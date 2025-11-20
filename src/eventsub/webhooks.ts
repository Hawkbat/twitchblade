import type z from "zod"
import type { AppAccessTokenProvider } from "../auth/auth.js"
import type { CreateEventSubSubscriptionRequestBody } from "../helix/types.js"
import { createExposedAsyncGenerator, type ExposedAsyncGenerator } from "../utils/async.js"
import { type KeyCache, FifoKeyCache } from "../utils/cache.js"
import { safeJsonParse } from "../utils/data.js"
import { type AnyEventResult, getEventTypeByTypeAndVersion, type EventTypeNames, type EventTypeVersions, type EventResultOf, type EventTypeDefinition, type EventTypeKeys, ALL_SUBSCRIPTION_TYPES } from "./subtypes.js"
import { WebhookChallengeSchema, WebhookRevocationSchema, WebhookNotificationSchema } from "./types.js"
import { generateSubscriptionSecret } from "./common.js"
import type { HelixClient } from "../helix/helix.js"
import type { Logger } from "../utils/logger.js"

type FunctionNameFromEventTypeKey<K extends EventTypeKeys> = K extends `${infer FirstLetter}${infer Rest}`
    ? `${Lowercase<FirstLetter>}${Rest}`
    : never

type SubscribeFunctionOptions = {
    appAccessToken: AppAccessTokenProvider
    callbackUrl?: string
    signal?: AbortSignal
}

interface SubscribeFunctionResult<K extends EventTypeKeys> {
    id: string
    each: (cb: (event: EventResultOf<K>) => void) => void
    unsubscribe: () => Promise<void>
    [Symbol.asyncIterator](): AsyncGenerator<EventResultOf<K>>
}

type SubscribeFunction<K extends EventTypeKeys> = (condition: z.Infer<EventTypeDefinition<K>['condition']>, options: SubscribeFunctionOptions) => Promise<SubscribeFunctionResult<K>>

type AllSubscribeFunctions = {
    [K in EventTypeKeys as FunctionNameFromEventTypeKey<K>]: SubscribeFunction<K>
}

interface SubscriptionState {
    id: string
    state: 'active' | 'inactive' | 'revoked'
    request: CreateEventSubSubscriptionRequestBody
    appAccessToken: AppAccessTokenProvider
    callbackUrl: string
    secret: string
    generator: ExposedAsyncGenerator<AnyEventResult>
}

export class WebhookError extends Error {
    constructor(
        message: string,
    ) {
        super(message)
        this.name = 'WebhookError'
    }
}

export type WebhookRevocationReason = 'user_removed' | 'authorization_revoked' | 'notification_failures_exceeded' | 'version_removed'

export class WebhookRevocationError extends WebhookError {
    constructor(
        message: string,
        public readonly reason: WebhookRevocationReason,
    ) {
        super(message)
        this.reason = reason
        this.name = 'WebhookRevokedError'
    }
}

function getHeaderCaseInsensitive(headers: Record<string, string>, key: string): string {
    const lowerKey = key.toLowerCase()
    for (const headerKey in headers) {
        if (headerKey.toLowerCase() === lowerKey) {
            return headers[headerKey]!
        }
    }
    throw new WebhookError(`Header ${key} not found`)
}

function parseWebhookHeaders(headers: Record<string, string>) {
    return {
        messageId: getHeaderCaseInsensitive(headers, 'Twitch-Eventsub-Message-Id'),
        messageRetry: parseInt(getHeaderCaseInsensitive(headers, 'Twitch-Eventsub-Message-Retry'), 10),
        messageType: getHeaderCaseInsensitive(headers, 'Twitch-Eventsub-Message-Type'),
        messageSignature: getHeaderCaseInsensitive(headers, 'Twitch-Eventsub-Message-Signature'),
        messageTimestamp: getHeaderCaseInsensitive(headers, 'Twitch-Eventsub-Message-Timestamp'),
        subscriptionType: getHeaderCaseInsensitive(headers, 'Twitch-Eventsub-Subscription-Type'),
        subscriptionVersion: getHeaderCaseInsensitive(headers, 'Twitch-Eventsub-Subscription-Version'),
    }
}

type WebhookHeaders = ReturnType<typeof parseWebhookHeaders>

async function verifyWebhookSignature(headers: WebhookHeaders, body: string, subscriptionSecret: string) {
    const { messageId, messageTimestamp, messageSignature } = headers

    if (!messageId || !messageTimestamp || !messageSignature) {
        return false
    }

    const encoder = new TextEncoder()

    const algorithm: HmacImportParams = { name: 'HMAC', hash: 'SHA-256' }
    const hmacKey = await crypto.subtle.importKey('raw', encoder.encode(subscriptionSecret), algorithm, false, ['sign', 'verify'])
    const hmacData = encoder.encode(messageId + messageTimestamp + body)
    const hmacSig = await crypto.subtle.sign(algorithm, hmacKey, hmacData)
    const hmacSigHex = new Uint8Array(hmacSig).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')
    const expectedSignature = `sha256=${hmacSigHex}`

    const signaturesMatch = await crypto.subtle.verify(algorithm, hmacKey, encoder.encode(expectedSignature), encoder.encode(messageSignature))

    return signaturesMatch
}

/** Contains metadata about the parsed webhook message and information about how to respond to it. */
export type WebhookResponse = {
    /** HTTP status code, headers, and body to respond with. */
    response: {
        status: number
        headers?: Record<string, string>
        body?: string
    }
    /** The parsed message data. */
    message: {
        id: string
        timestamp: string
        retry?: number | undefined
    } & ({
        type: 'challenge'
    } | {
        type: 'revocation'
        reason: WebhookRevocationReason
    } | {
        type: 'notification'
        event: AnyEventResult
    } | {
        type: 'discarded'
    })
    /** Information about the subscription related to this webhook message. */
    subscription: {
        id: string
        type: string
        version: string
    }
}

export interface WebhookClient extends AllSubscribeFunctions {
    parseRequest: (headers: Record<string, string>, body: string, getSubscriptionSecret: (subscriptionID: string) => string | null) => Promise<WebhookResponse>
}

// We add the subscribe functions dynamically below; this satisfies TypeScript
export declare interface DefaultWebhookClient extends AllSubscribeFunctions {}

export class DefaultWebhookClient implements WebhookClient {
    private subscriptions: Map<string, SubscriptionState> = new Map()
    
    constructor(
        private readonly services: {
            logger: Logger,
            helixClient: HelixClient,
        },
        private callbackUrl: string,
        private seenMessageCache: KeyCache<string> = new FifoKeyCache(10000),
    ) {
        for (const eventKey of Object.keys(ALL_SUBSCRIPTION_TYPES) as EventTypeKeys[]) {
            const functionName = (eventKey.charAt(0).toLowerCase() + eventKey.slice(1)) as FunctionNameFromEventTypeKey<typeof eventKey>
            ; (this as any)[functionName] = this.createSubscribeFunction(eventKey).bind(this)
        }
    }
    
    private createSubscribeFunction<K extends EventTypeKeys>(eventKey: K): SubscribeFunction<K> {
        return async (condition: z.Infer<EventTypeDefinition<K>['condition']>, options: SubscribeFunctionOptions): Promise<SubscribeFunctionResult<K>> => {
            return await this.subscribe(eventKey, condition, options)
        }
    }

    /**
     * Handles an incoming EventSub webhook request using the internal subscription state to look up subscription secrets and emits any events to relevant subscriptions. Use this if you want the client to manage subscriptions for you.
     * @param headers The request headers. Twitch EventSub headers will be parsed case-insensitively.
     * @param body The raw request body as a string.
     * @returns A promise that resolves to an object describing the status code, headers, and body to respond with, as well as the parsed message data.
     */
    async handleRequest(headers: Record<string, string>, body: string): Promise<WebhookResponse> {
        const result = await this.parseRequest(headers, body, (subscriptionID) => {
            const subState = this.subscriptions.get(subscriptionID)
            return subState ? subState.secret : null
        })

        if (result.message.type === 'discarded' || result.message.type === 'challenge') {
            return result
        }

        // If it's a revocation, clean up internal state
        if (result.message.type === 'revocation') {
            const subState = this.subscriptions.get(result.subscription.id)
            if (subState) {
                subState.state = 'revoked'
                subState.generator.throw(new WebhookRevocationError(`Subscription ${result.subscription.id} was revoked: ${result.message.reason}`, result.message.reason))
                this.subscriptions.delete(result.subscription.id)
            }
        }
        else if (result.message.type === 'notification') {
            const subState = this.subscriptions.get(result.subscription.id)
            if (subState && subState.state === 'active') {
                subState.generator.push(result.message.event)
            }
        }

        return result
    }

    /**
     * Parses and verifies an incoming EventSub webhook request. Does not use the internal subscription state; the subscription secret must be provided via the getSubscriptionSecret function. Use this if you want to manage subscriptions yourself (e.g. if have multiple applications using the same webhook endpoint).
     * @param headers The request headers. Twitch EventSub headers will be parsed case-insensitively.
     * @param body The raw request body as a string.
     * @param getSubscriptionSecret A function that takes a subscription ID and returns the corresponding subscription secret, or null if not found.
     * @returns A promise that resolves to an object describing the status code, headers, and body to respond with, as well as the parsed message data.
     */
    async parseRequest(headers: Record<string, string>, body: string, getSubscriptionSecret: (subscriptionID: string) => string | null): Promise<WebhookResponse> {
        const parsedHeaders = parseWebhookHeaders(headers)
        const rawBodyJson = safeJsonParse(body)

        if (!(typeof rawBodyJson === 'object' && rawBodyJson !== null && 'subscription' in rawBodyJson && typeof rawBodyJson.subscription === 'object' && rawBodyJson.subscription !== null && 'id' in rawBodyJson.subscription && typeof rawBodyJson.subscription.id === 'string')) {
            throw new WebhookError('Missing subscription ID')
        }
        const subscriptionID = rawBodyJson.subscription.id
        const subscriptionSecret = getSubscriptionSecret(subscriptionID)
        if (!subscriptionSecret) {
            throw new WebhookError('Unknown subscription ID')
        }

        const subscription: WebhookResponse['subscription'] = {
            id: subscriptionID,
            type: parsedHeaders.subscriptionType,
            version: parsedHeaders.subscriptionVersion,
        }

        const message = {
            id: parsedHeaders.messageId,
            timestamp: parsedHeaders.messageTimestamp,
            retry: parsedHeaders.messageRetry ? parsedHeaders.messageRetry : undefined,
        } satisfies Partial<WebhookResponse['message']>

        const isValid = await verifyWebhookSignature(parsedHeaders, body, subscriptionSecret)
        if (!isValid) {
            throw new WebhookError('Invalid signature')
        }

        // Discard messages older than 10 minutes
        const messageTime = new Date(parsedHeaders.messageTimestamp).getTime()
        const now = Date.now()
        if (now - messageTime > 10 * 60 * 1000) {
            return { response: { status: 204, }, subscription, message: { ...message, type: 'discarded' } }
        }

        // Discard duplicate messages
        if (this.seenMessageCache.has(parsedHeaders.messageId)) {
            return { response: { status: 204, }, subscription, message: { ...message, type: 'discarded' } }
        }

        this.seenMessageCache.add(parsedHeaders.messageId)

        if (parsedHeaders.messageType === 'webhook_callback_verification') {
            const parsedChallenge = WebhookChallengeSchema.safeParse(rawBodyJson)
            if (!parsedChallenge.success) {
                throw new WebhookError('Invalid challenge body')
            }
            return { response: { status: 200, headers: { 'Content-Type': 'text/plain', 'Content-Length': parsedChallenge.data.challenge.length.toString() }, body: parsedChallenge.data.challenge, }, subscription, message: { ...message, type: 'challenge' } }
        } else if (parsedHeaders.messageType === 'revocation') {
            const parsedRevocation = WebhookRevocationSchema.safeParse(rawBodyJson)
            if (!parsedRevocation.success) {
                throw new WebhookError('Invalid revocation body')
            }
            return { response: { status: 204, }, subscription, message: { ...message, type: 'revocation', reason: parsedRevocation.data.subscription.status as WebhookRevocationReason } }
        } else if (parsedHeaders.messageType === 'notification') {
            const parsedNotification = WebhookNotificationSchema.safeParse(rawBodyJson)
            if (!parsedNotification.success) {
                throw new WebhookError('Invalid notification body')
            }

            const rawEvent = parsedNotification.data.event
            const eventType = getEventTypeByTypeAndVersion(parsedHeaders.subscriptionType as EventTypeNames, parsedHeaders.subscriptionVersion as EventTypeVersions)
            if (!eventType) {
                throw new WebhookError('Unknown event type or version')
            }

            const eventParseResult = eventType.event.safeParse(rawEvent)
            if (!eventParseResult.success) {
                throw new WebhookError('Invalid event data')
            }
            const eventData = eventParseResult.data

            const event: AnyEventResult = {
                type: eventType.type,
                version: eventType.version as AnyEventResult['version'],
                subscription: parsedNotification.data.subscription as unknown as AnyEventResult['subscription'],
                condition: parsedNotification.data.subscription.condition as AnyEventResult['condition'],
                event: eventData,
            } as AnyEventResult

            return { response: { status: 204, }, subscription, message: { ...message, type: 'notification', event } }
        } else {
            throw new WebhookError('Unknown message type')
        }
    }
    
    /**
     * Unsubscribes from an active EventSub subscription managed by this client.
     * @param subscriptionID The ID of the subscription to unsubscribe from.
     * @param options.appAccessToken An optional App Access Token provider to use for the unsubscription request. If not provided, the one used during subscription creation will be used.
     * @param options.signal An optional AbortSignal to cancel the unsubscription request.
     */
    public async unsubscribe(subscriptionID: string, options?: { appAccessToken?: AppAccessTokenProvider, signal?: AbortSignal }): Promise<void> {
        const subState = this.subscriptions.get(subscriptionID)
        if (!subState) {
            throw new WebhookError(`No active subscription with ID ${subscriptionID}`)
        }
        try {
            subState.state = 'inactive'
            await this.services.helixClient.deleteEventSubSubscription({
                appAccessToken: options?.appAccessToken ?? subState.appAccessToken,
                query: {
                    id: subscriptionID,
                },
                signal: options?.signal,
            })
            this.subscriptions.delete(subscriptionID)
            subState.generator.close()
        } catch (e) {
            console.error(`Failed to delete EventSub subscription ${subscriptionID}:`, e)
            // Restore state
            subState.state = 'active'
            this.subscriptions.set(subscriptionID, subState)
        }
    }

    private async subscribe<K extends EventTypeKeys>(eventKey: K, condition: z.Infer<EventTypeDefinition<K>['condition']>, options: SubscribeFunctionOptions): Promise<SubscribeFunctionResult<K>> {
        const { appAccessToken, signal } = options

        const eventType = ALL_SUBSCRIPTION_TYPES[eventKey] as EventTypeDefinition<K>
        if (!eventType) {
            throw new WebhookError(`Unknown EventSub event type key: ${eventKey}`)
        }

        const parsedCondition = eventType.condition.safeParse(condition)
        if (!parsedCondition.success) {
            throw new WebhookError(`Invalid condition for event type ${eventType.type}: ${JSON.stringify(parsedCondition.error.issues)}`)
        }

        const callbackUrl = options.callbackUrl ?? this.callbackUrl
        const secret = generateSubscriptionSecret()

        const request: CreateEventSubSubscriptionRequestBody = {
            type: eventType.type,
            version: eventType.version,
            condition: parsedCondition.data as Record<string, unknown>,
            transport: {
                method: 'webhook',
                callback: callbackUrl,
                secret,
            },
        }

        const response = await this.services.helixClient.createEventSubSubscription({
            appAccessToken,
            body: request,
            signal,
        })
        const [sub] = response.data
        if (!sub) {
            throw new WebhookError('Failed to create EventSub subscription')
        }

        const generator = createExposedAsyncGenerator<AnyEventResult>()
        const subscriptionState: SubscriptionState = {
            id: sub.id,
            state: 'active',
            request,
            appAccessToken,
            callbackUrl,
            secret,
            generator,
        }
        this.subscriptions.set(sub.id, subscriptionState)

        if (signal) {
            if (signal.aborted) {
                this.unsubscribe(sub.id)
            } else {
                signal.addEventListener('abort', () => {
                    this.unsubscribe(sub.id)
                }, { once: true })
            }
        }

        const result: SubscribeFunctionResult<K> = {
            id: sub.id,
            each: async (cb: (event: EventResultOf<K>) => void) => {
                for await (const evt of generator) {
                    cb(evt as any)
                }
            },
            unsubscribe: async () => {
                await this.unsubscribe(sub.id)
            },
            [Symbol.asyncIterator]: () => generator as AsyncGenerator<EventResultOf<K>>,
        }

        return result
    }
}
