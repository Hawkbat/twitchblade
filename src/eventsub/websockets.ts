import * as z from "zod"
import type { UserAccessTokenProvider } from "../auth/auth.js"
import type { HelixClient } from "../helix/helix.js"
import type { CreateEventSubSubscriptionRequestBody } from "../helix/types.js"
import { createExposedAsyncGenerator, type ExposedAsyncGenerator } from "../utils/async.js"
import { safeJsonParse } from "../utils/data.js"
import { EventEmitter } from "../utils/events.js"
import { ALL_SUBSCRIPTION_TYPES, type AnyEventResult, type EventResultOf, type EventTypeDefinition, type EventTypeKeys } from "./subtypes.js"
import { WebSocketMessageSchema, WebSocketNotificationPayloadSchema, WebSocketReconnectPayloadSchema, WebSocketRevocationPayloadSchema, WebSocketWelcomePayloadSchema, type SubscriptionStatus, type WebSocketNotificationPayload, type WebSocketReconnectPayload, type WebSocketRevocationPayload, type WebSocketWelcomePayload } from "./types.js"
import type { Logger } from "../utils/logger.js"

type FunctionNameFromEventTypeKey<K extends EventTypeKeys> = K extends `${infer FirstLetter}${infer Rest}`
  ? `${Lowercase<FirstLetter>}${Rest}`
  : never

type SubscribeFunctionOptions = {
    userAccessToken: UserAccessTokenProvider
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
    userAccessToken: UserAccessTokenProvider
    generator: ExposedAsyncGenerator<AnyEventResult>
}

export class WebSocketRevocationError extends Error {
    constructor(
        message: string,
        public readonly reason: SubscriptionStatus,
    ) {
        super(message)
        this.name = 'EventSubRevocationError'
    }
}

const enum WebSocketCloseReason {
    NORMAL_CLOSURE = 1000,
    GOING_AWAY = 1001,
    PROTOCOL_ERROR = 1002,
    UNSUPPORTED_DATA = 1003,
    NO_STATUS_RECEIVED = 1005,
    ABNORMAL_CLOSURE = 1006,
    INVALID_FRAME_PAYLOAD_DATA = 1007,
    POLICY_VIOLATION = 1008,
    MESSAGE_TOO_BIG = 1009,
    MANDATORY_EXTENSION = 1010,
    INTERNAL_SERVER_ERROR = 1011,
    TLS_HANDSHAKE = 1015,

    TWITCH_INTERNAL_SERVER_ERROR = 4000,
    TWITCH_CLIENT_SENT_INBOUND_TRAFFIC = 4001,
    TWITCH_CLINET_FAILED_PING_PONG = 4002,
    TWITCH_CONNECTION_UNUSED = 4003,
    TWITCH_RECONNECT_GRACE_TIME_EXPIRED = 4004,
    TWITCH_NETWORK_TIMEOUT = 4005,
    TWITCH_NETWORK_ERROR = 4006,
    TWITCH_INVALID_RECONNECT_URL = 4007,
}

class WebSocketSession {
    private keepaliveTimeoutID: ReturnType<typeof setTimeout>
    public readonly events = new EventEmitter<{
        reconnect: [payload: WebSocketReconnectPayload],
        revocation: [payload: WebSocketRevocationPayload],
        notification: [payload: WebSocketNotificationPayload],
        error: [error: Error],
        close: [reason: WebSocketCloseReason],
    }>()
    
    private constructor(
        public readonly websocket: WebSocket,
        public readonly sessionID: string,
        public readonly keepaliveTimeoutSeconds: number,
    ) {
        this.keepaliveTimeoutID = this.extendKeepaliveTimeout()
        this.listenForEvents()
    }

    static fromExisting(websocket: WebSocket, sessionID: string, keepaliveTimeoutSeconds: number): WebSocketSession {
        return new WebSocketSession(websocket, sessionID, keepaliveTimeoutSeconds)
    }

    static async fromUrl(url: string): Promise<WebSocketSession> {
        const ws = new WebSocket(url)

        // Do the initial handshake to get the session ID and keepalive timeout before returning the session as a live and ready-to-use object
        const initialHandshakeAC = new AbortController()
        const { session: { id, keepalive_timeout_seconds } } = await new Promise<WebSocketWelcomePayload>((resolve, reject) => {
            ws.addEventListener('close', e => {
                reject(new Error(`WebSocket closed with code ${e.code}`))
            }, { once: true, signal: initialHandshakeAC.signal })
            ws.addEventListener('error', e => {
                reject(new Error(`WebSocket error occurred`))
            }, { once: true, signal: initialHandshakeAC.signal })
            ws.addEventListener('message', (e: MessageEvent<unknown>) => {
                if (typeof e.data !== 'string') {
                    reject(new Error('Received non-text message from EventSub WebSocket'))
                    return
                }
                const rawData = safeJsonParse(e.data)
                const parsedMsg = WebSocketMessageSchema.safeParse(rawData)
                if (!parsedMsg.success) {
                    reject(new Error(`Failed to parse message from EventSub WebSocket: ${JSON.stringify(parsedMsg.error.issues)}`))
                    return
                }
                const parsedWelcome = WebSocketWelcomePayloadSchema.safeParse(parsedMsg.data.payload)
                if (!parsedWelcome.success) {
                    reject(new Error(`Failed to parse welcome message from EventSub WebSocket: ${JSON.stringify(parsedWelcome.error.issues)}`))
                    return
                }
                resolve(parsedWelcome.data)
            }, { once: true, signal: initialHandshakeAC.signal })
        })
        // Clean up the listeners for the initial handshake
        initialHandshakeAC.abort()

        return new WebSocketSession(ws, id, keepalive_timeout_seconds)
    }

    dispose() {
        clearTimeout(this.keepaliveTimeoutID)
        this.websocket.close()
        this.events.removeAllListeners()
    }

    private listenForEvents() {
        this.websocket.addEventListener('close', (e: CloseEvent) => {
            this.events.emit('close', e.code as WebSocketCloseReason)
        })
        this.websocket.addEventListener('error', (e: Event) => {
            this.onUnrecoverableError(new Error('WebSocket error occurred'))
        })
        this.websocket.addEventListener('message', (e: MessageEvent<unknown>) => {
            if (typeof e.data !== 'string') {
                // Twitch API only sends text messages, so this means something went very wrong
                this.onUnrecoverableError(new Error('Received non-text message from EventSub WebSocket'))
                return
            }
            const rawData = safeJsonParse(e.data)
            const baseMsg = WebSocketMessageSchema.safeParse(rawData)
            if (!baseMsg.success) {
                this.onUnrecoverableError(new Error(`Failed to parse message from EventSub WebSocket: ${JSON.stringify(baseMsg.error.issues)}`))
                return
            }
            const msgType = baseMsg.data.metadata.message_type
            switch (msgType) {
                case 'session_welcome': {
                    // Duplicate welcome message, connection is in a weird state
                    this.onUnrecoverableError(new Error('Received duplicate welcome message from EventSub WebSocket'))
                    break
                }
                case 'session_keepalive': {
                    this.extendKeepaliveTimeout()
                    break
                }
                case 'session_reconnect': {
                    const reconnectPayload = WebSocketReconnectPayloadSchema.safeParse(baseMsg.data.payload)
                    if (!reconnectPayload.success) {
                        this.onUnrecoverableError(new Error(`Failed to parse reconnect payload from EventSub WebSocket: ${JSON.stringify(reconnectPayload.error.issues)}`))
                        return
                    }
                    this.events.emit('reconnect', reconnectPayload.data)
                    break
                }
                case 'revocation': {
                    const revocationPayload = WebSocketRevocationPayloadSchema.safeParse(baseMsg.data.payload)
                    if (!revocationPayload.success) {
                        this.onUnrecoverableError(new Error(`Failed to parse revocation payload from EventSub WebSocket: ${JSON.stringify(revocationPayload.error.issues)}`))
                        return
                    }
                    this.events.emit('revocation', revocationPayload.data)
                    break
                }
                case 'notification': {
                    const notificationPayload = WebSocketNotificationPayloadSchema.safeParse(baseMsg.data.payload)
                    if (!notificationPayload.success) {
                        this.onUnrecoverableError(new Error(`Failed to parse notification payload from EventSub WebSocket: ${JSON.stringify(notificationPayload.error.issues)}`))
                        return
                    }
                    this.events.emit('notification', notificationPayload.data)
                    break
                }
            }
        })
    }

    private extendKeepaliveTimeout() {
        clearTimeout(this.keepaliveTimeoutID)
        this.keepaliveTimeoutID = setTimeout(() => {

        }, this.keepaliveTimeoutSeconds * 1000)
        return this.keepaliveTimeoutID
    }

    private onUnrecoverableError(error: Error) {
        this.events.emit('error', error)
        this.dispose()
    }
}

export interface WebSocketClient extends AllSubscribeFunctions {

}

// We add the subscribe functions dynamically below; this satisfies TypeScript
export declare interface DefaultWebSocketClient extends AllSubscribeFunctions {}

export class DefaultWebSocketClient implements WebSocketClient {
    private activeSession: WebSocketSession | null = null
    private pendingSessionPromise: Promise<WebSocketSession> | null = null
    private subscriptions: Map<string, SubscriptionState> = new Map()

    constructor(
        private readonly services: {
            logger: Logger,
            helixClient: HelixClient,
        },
        private keepaliveTimeoutSeconds?: number,
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

    private async subscribe<K extends EventTypeKeys>(eventKey: K, condition: z.Infer<EventTypeDefinition<K>['condition']>, options: SubscribeFunctionOptions): Promise<SubscribeFunctionResult<K>> {
        const { userAccessToken, signal } = options
        
        const session = this.activeSession ?? await this.openSession()

        const eventType = ALL_SUBSCRIPTION_TYPES[eventKey] as EventTypeDefinition<K>
        if (!eventType) {
            throw new Error(`Unknown EventSub event type key: ${eventKey}`)
        }

        const parsedCondition = eventType.condition.safeParse(condition)
        if (!parsedCondition.success) {
            throw new Error(`Invalid condition for event type ${eventType.type}: ${JSON.stringify(parsedCondition.error.issues)}`)
        }

        const request: CreateEventSubSubscriptionRequestBody = {
            type: eventType.type,
            version: eventType.version,
            condition: parsedCondition.data as Record<string, unknown>,
            transport: {
                method: 'websocket',
                session_id: session.sessionID,
            },
        }

        const response = await this.services.helixClient.createEventSubSubscription({
            userAccessToken,
            body: request,
            signal,
        })
        const [sub] = response.data
        if (!sub) {
            throw new Error('Failed to create EventSub subscription')
        }
        
        const generator = createExposedAsyncGenerator<AnyEventResult>()
        const subscriptionState: SubscriptionState = {
            id: sub.id,
            state: 'active',
            request,
            userAccessToken,
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

    public async unsubscribe(subscriptionID: string, options?: { userAccessToken?: UserAccessTokenProvider, signal?: AbortSignal }): Promise<void> {
        const subState = this.subscriptions.get(subscriptionID)
        if (!subState) {
            throw new Error(`No active subscription with ID ${subscriptionID}`)
        }
        try {
            subState.state = 'inactive'
            await this.services.helixClient.deleteEventSubSubscription({
                userAccessToken: options?.userAccessToken ?? subState.userAccessToken,
                query: {
                    id: subscriptionID,
                },
                signal: options?.signal,
            })
            this.subscriptions.delete(subscriptionID)
            subState.generator.close()
        } catch (e) {
            this.services.logger.error(`Failed to delete EventSub subscription ${subscriptionID}:`, e)
            // Restore state
            subState.state = 'active'
            this.subscriptions.set(subscriptionID, subState)
        }
    }
    
    private async openSession(): Promise<WebSocketSession> {
        try {
            if (this.pendingSessionPromise) {
                return await this.pendingSessionPromise
            }
            const url = new URL('wss://eventsub.wss.twitch.tv/ws')
            if (this.keepaliveTimeoutSeconds) {
                url.searchParams.set('keepalive_timeout_seconds', this.keepaliveTimeoutSeconds.toString())
            }
            this.services.logger.info('Opening new EventSub WebSocket session...')
            this.pendingSessionPromise = WebSocketSession.fromUrl(url.toString())
            const session = await this.pendingSessionPromise
            this.pendingSessionPromise = null
            this.activateSession(session, true)
            this.services.logger.info('Successfully opened new EventSub WebSocket session')
            return session
        } catch (e) {
            this.services.logger.error('Failed to open EventSub WebSocket session:', e)
            throw e
        }
    }

    private async migrateSession(reconnectUrl: string): Promise<WebSocketSession> {
        try {
            if (this.pendingSessionPromise) {
                return await this.pendingSessionPromise
            }
            this.pendingSessionPromise = WebSocketSession.fromUrl(reconnectUrl)
            const session = await this.pendingSessionPromise
            this.pendingSessionPromise = null
            this.activateSession(session, false)
            this.services.logger.info('Successfully reconnected EventSub WebSocket session')
            return session
        } catch (e) {
            this.services.logger.error('Failed to reconnect to EventSub WebSocket session:', e)
            // Failed to reconnect, need to open a new session
            return this.openSession()
        }
    }

    private activateSession(session: WebSocketSession, recreateSubscriptions: boolean) {
        if (this.activeSession && this.activeSession !== session) {
            this.cleanUpSession(this.activeSession)
        }
        this.activeSession = session
        this.services.logger.info('WebSocket session activated')
        session.events.on('error', (error) => {
            this.services.logger.error('WebSocket session error:', error)
            // 'close' event will always follow, so cleanup will happen there
        })
        session.events.on('close', reason => {
            this.cleanUpSession(session)
            this.services.logger.info('WebSocket session closed')
            for (const subState of this.subscriptions.values()) {
                subState.state = 'inactive'
            }
            switch (reason) {
                // Errors that may be recoverable by reconnecting
                case WebSocketCloseReason.NORMAL_CLOSURE:
                case WebSocketCloseReason.GOING_AWAY:
                case WebSocketCloseReason.TWITCH_INTERNAL_SERVER_ERROR:
                case WebSocketCloseReason.TWITCH_RECONNECT_GRACE_TIME_EXPIRED:
                case WebSocketCloseReason.TWITCH_NETWORK_TIMEOUT:
                case WebSocketCloseReason.TWITCH_NETWORK_ERROR:
                case WebSocketCloseReason.TWITCH_INVALID_RECONNECT_URL:
                    // Attempt to reconnect
                    this.openSession()
                    break
                default:
                    // Unrecoverable error, fail all subscriptions
                    for (const subState of this.subscriptions.values()) {
                        subState.state = 'inactive'
                        subState.generator.throw(new Error(`WebSocket session closed with unrecoverable reason: ${reason}`))
                    }
                    this.subscriptions.clear()
                    break
            }
        })
        session.events.on('reconnect', payload => {
            this.migrateSession(payload.session.reconnect_url)
        })
        session.events.on('revocation', payload => {
            const subState = this.subscriptions.get(payload.subscription.id)
            if (subState) {
                subState.state = 'revoked'
                subState.generator.throw(new WebSocketRevocationError(`Subscription ${payload.subscription.id} was revoked: ${payload.subscription.status}`, payload.subscription.status))
                this.subscriptions.delete(payload.subscription.id)
            } else {
                this.services.logger.warn(`Received revocation for unknown subscription ID ${payload.subscription.id}`)
            }
        })
        session.events.on('notification', payload => {
            const subState = this.subscriptions.get(payload.subscription.id)
            if (subState && subState.state === 'active') {
                subState.generator.push({
                    type: payload.subscription.type,
                    version: payload.subscription.version,
                    subscription: payload.subscription,
                    condition: payload.subscription.condition,
                    event: payload.event,
                } as any)
            }
        })
        if (recreateSubscriptions) {
            Promise.all(Array.from(this.subscriptions.values()).map(async subState => {
                try {
                    const response = await this.services.helixClient.createEventSubSubscription({
                        userAccessToken: subState.userAccessToken,
                        body: {
                            ...subState.request,
                            transport: {
                                method: 'websocket',
                                session_id: session.sessionID,
                            },
                        }
                    })
                    const [newSub] = response.data
                    if (!newSub) {
                        throw new Error('Failed to recreate EventSub subscription')
                    }
                    subState.id = newSub.id
                    this.services.logger.info(`Recreated EventSub subscription ${newSub.id} for type ${newSub.type}`)
                }
                catch (e) {
                    this.services.logger.error('Failed to recreate EventSub subscription:', e)
                    subState.generator.throw(new Error('Failed to recreate EventSub subscription after WebSocket reconnect'))
                    this.subscriptions.delete(subState.id)
                }
            }))
        }
    }

    private cleanUpSession(session: WebSocketSession) {
        session.dispose()
        if (this.activeSession === session) {
            this.services.logger.info('Active WebSocket session cleaned up')
            this.activeSession = null
        }
    }
}
