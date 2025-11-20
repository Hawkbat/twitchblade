import type { AppAccessTokenProvider, UserAccessTokenProvider } from '../auth/auth.js'
import type { UserAccessTokenScopeSet } from '../auth/types.js'
import { wait } from '../utils/async.js'
import type { Logger } from '../utils/logger.js'
import { ALL_ENDPOINTS, type InferRequestQuery, type InferRequestBody, type InferResponseBody } from './types.js'

const BASE_URL = 'https://api.twitch.tv/helix/'

const MAX_RETRY_ATTEMPTS = 5

type AllEndpoints = typeof ALL_ENDPOINTS
type EndpointName = keyof AllEndpoints

type FunctionNameFromEndpointName<N extends EndpointName> = N extends `${infer FirstLetter}${infer Rest}`
  ? `${Lowercase<FirstLetter>}${Rest}`
  : never

type EndpointCallOptions = {
    signal?: AbortSignal | undefined
} & ({
    userAccessToken: UserAccessTokenProvider
    appAccessToken?: AppAccessTokenProvider | undefined
} | {
    userAccessToken?: UserAccessTokenProvider | undefined
    appAccessToken: AppAccessTokenProvider
})

type EndpointFunction<N extends EndpointName> = (params: (InferRequestQuery<AllEndpoints[N]> extends undefined ? { query?: undefined } : { query: InferRequestQuery<AllEndpoints[N]> }) & (InferRequestBody<AllEndpoints[N]> extends undefined ? { body?: undefined } : { body: InferRequestBody<AllEndpoints[N]> }) & EndpointCallOptions) => Promise<InferResponseBody<AllEndpoints[N]>>

type AllEndpointFunctions = {
  [N in EndpointName as FunctionNameFromEndpointName<N>]: EndpointFunction<N>
}

export interface HelixClient extends AllEndpointFunctions {

}

interface HelixHttpRequestArgs {
    method: string
    url: string
    headers?: Record<string, string> | undefined
    query?: Record<string, string | string[]> | undefined
    body?: Record<string, unknown> | undefined
    signal?: AbortSignal | undefined
}

export interface HelixHttpClient {
    fetch: (args: HelixHttpRequestArgs) => Promise<HelixHttpResponse>
}

interface HelixHttpResponse {
    status: number
    body?: Record<string, unknown>
    headers: {
        ratelimitLimit: number
        ratelimitRemaining: number
        ratelimitReset: number
    }
}

export interface HelixRateLimitInfo {
    limit: number
    remaining: number
    resetAt: Date
}

export interface HelixRateLimitState {
    limit: number
    remaining: number
    resetAt: Date
    /**
     * How many times rate limit (429) has been hit consecutively
     */
    consecutiveHits: number
}

export interface HelixRateLimitManager {
    /**
     * Get the current rate limit state
     */
    getRateLimitState(): HelixRateLimitState
    
    /**
     * Called when a 429 response is received. Returns the number of milliseconds to wait before retrying.
     */
    onRateLimitHit(): number

    /**
     * Update the rate limit state based on response headers
     */
    onRequestAttempt(headers: HelixHttpResponse['headers']): void
    
    /**
     * Reset the consecutive hit counter (called on successful request)
     */
    onSuccessfulRequest(): void
}

export class HelixApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly endpoint: string,
    ) {
        super(message)
        this.name = 'HelixApiError'
    }
}

export class HelixApiRateLimitError extends HelixApiError {
    constructor(
        message: string,
        status: number,
        endpoint: string,
        public readonly rateLimitInfo: HelixRateLimitInfo,
    ) {
        super(message, status, endpoint)
        this.name = 'HelixApiRateLimitError'
    }
}

export class HelixInsufficientScopesError extends HelixApiError {
    constructor(
        message: string,
        status: number,
        endpoint: string,
        public readonly requiredScopes: UserAccessTokenScopeSet,
    ) {
        super(message, status, endpoint)
        this.name = 'HelixInsufficientScopesError'
    }
}

/**
 * Default rate limit manager implementation that tracks state and implements exponential backoff
 */
export class DefaultHelixRateLimitManager implements HelixRateLimitManager {
    private state: HelixRateLimitState
    private warningCooldownTimeoutID: ReturnType<typeof setTimeout> | null = null
    
    constructor(
        private readonly onWarning?: (state: HelixRateLimitState, reason: string) => void
    ) {
        this.state = {
            limit: 0,
            remaining: 0,
            resetAt: new Date(),
            consecutiveHits: 0,
        }
    }
    
    getRateLimitState(): HelixRateLimitState {
        return { ...this.state }
    }
    
    onRateLimitHit(): number {
        this.state.consecutiveHits++
        
        // Raise warning on initial hit
        if (this.state.consecutiveHits === 1) {
            clearTimeout(this.warningCooldownTimeoutID ?? undefined)
            this.issueWarning(`Twitch Helix API rate limit hit. Consider reducing request frequency to avoid hitting the rate limit.`)
        }
        
        // Calculate wait time with exponential backoff
        const resetTime = this.state.resetAt.getTime() - Date.now()
        const backoffMultiplier = Math.pow(2, Math.min(this.state.consecutiveHits - 1, 5))
        const backoffDelay = Math.min(1000 * backoffMultiplier, 30000) // Cap at 30 seconds
        
        return Math.max(resetTime, backoffDelay)
    }
    
    onRequestAttempt(headers: HelixHttpResponse['headers']): void {
        this.state.limit = headers.ratelimitLimit
        this.state.remaining = headers.ratelimitRemaining
        this.state.resetAt = new Date(headers.ratelimitReset * 1000)
        
        // Raise warning if remaining is low (less than 10% of limit)
        if (this.state.remaining < this.state.limit * 0.1) {
            this.issueWarning(`Twitch Helix API rate limit is low: ${this.state.remaining} out of ${this.state.limit} request points remaining until ${this.state.resetAt.toISOString()}. Consider reducing request frequency to avoid hitting the rate limit.`)
        }
    }
    
    onSuccessfulRequest(): void {
        this.state.consecutiveHits = 0
    }

    private issueWarning(reason: string): void {
        if (this.onWarning) {
            this.onWarning(this.state, reason)
            this.warningCooldownTimeoutID = setTimeout(() => {
                this.warningCooldownTimeoutID = null
            }, 60000) // 1 minute cooldown
        }
    }
}

export class DefaultHelixHttpClient implements HelixHttpClient {

        async fetch(args: HelixHttpRequestArgs): Promise<HelixHttpResponse> {
            const { method, url, headers, query, body, signal } = args
            const urlObj = new URL(url)
            if (query) {
                for (const [key, value] of Object.entries(query)) {
                    if (Array.isArray(value)) {
                        for (const v of value) {
                            urlObj.searchParams.append(key, v)
                        }
                    } else {
                        urlObj.searchParams.append(key, value)
                    }
                }
            }
            const response = await fetch(urlObj.toString(), {
                method,
                headers: {
                    ...(body ? {
                        'Content-Type': 'application/json',
                    } : {}),
                    ...headers,
                },
                body: body ? JSON.stringify(body) : null,
                signal: signal ?? null,
            })
            const responseBody = await response.json().catch(() => ({})) as Record<string, unknown>
            
            // Parse rate limit headers
            const limitHeader = response.headers.get('Ratelimit-Limit')
            const remainingHeader = response.headers.get('Ratelimit-Remaining')
            const resetHeader = response.headers.get('Ratelimit-Reset')

            if (!limitHeader || !remainingHeader || !resetHeader) {
                throw new Error('Missing rate limit headers in Helix API response')
            }

            const rateLimitHeaders: HelixHttpResponse['headers'] = {
                ratelimitLimit: parseInt(limitHeader),
                ratelimitRemaining: parseInt(remainingHeader),
                ratelimitReset: parseInt(resetHeader) , 
            }
            
            return { status: response.status, body: responseBody, headers: rateLimitHeaders }
        }
}

function formatScopeSet(scopeSet: UserAccessTokenScopeSet): string {
    if (typeof scopeSet === 'string') {
        return scopeSet
    } else if ('any' in scopeSet) {
        return `Any Of: ${scopeSet.any.map(formatScopeSet).join(', ')}`
    } else if ('all' in scopeSet) {
        return `All Of: ${scopeSet.all.map(formatScopeSet).join(', ')}`
    }
    throw new Error('Invalid UserAccessTokenScopeSet structure')
}

function validateScopeSet(scopeSet: UserAccessTokenScopeSet, tokenScopes: string[]): boolean {
    if (typeof scopeSet === 'string') {
        return tokenScopes.includes(scopeSet)
    } else if ('any' in scopeSet) {
        return scopeSet.any.some(subSet => validateScopeSet(subSet, tokenScopes))
    } else if ('all' in scopeSet) {
        return scopeSet.all.every(subSet => validateScopeSet(subSet, tokenScopes))
    } else {
        throw new Error('Invalid UserAccessTokenScopeSet structure')
    }
}

// We add the endpoint functions dynamically below; this satisfies TypeScript
export declare interface DefaultHelixClient extends AllEndpointFunctions {}

export class DefaultHelixClient implements HelixClient {
    constructor(private readonly services: {
        logger: Logger,
        httpClient: HelixHttpClient,
        rateLimitManager: HelixRateLimitManager,
    }) {
        for (const endpointName of Object.keys(ALL_ENDPOINTS) as EndpointName[]) {
            const functionName = endpointName.charAt(0).toLowerCase() + endpointName.slice(1)
            ; (this as any)[functionName] = this.createEndpointFunction(endpointName).bind(this)
        }
    }
    
    private createEndpointFunction<N extends EndpointName>(endpointName: N): EndpointFunction<N> {
        const { httpClient, rateLimitManager } = this.services
        const endpointDef = ALL_ENDPOINTS[endpointName]
        return async ({ query: rawQuery, body: rawBody, appAccessToken, userAccessToken, signal }: { query?: unknown, body?: unknown } & EndpointCallOptions) => {
            const url = `${BASE_URL}${endpointDef.path}`
            const method = endpointDef.method
            let query: any = undefined
            if (endpointDef.requestQuery) {
                query = endpointDef.requestQuery.parse(rawQuery)
            } else if (rawQuery && Object.keys(rawQuery).length > 0) {
                throw new HelixApiError(`Endpoint ${endpointName} does not accept query parameters`, 400, endpointName)
            }
            let body: any = undefined
            if (endpointDef.requestBody) {
                body = endpointDef.requestBody.parse(rawBody)
            } else if (rawBody && Object.keys(rawBody).length > 0) {
                throw new HelixApiError(`Endpoint ${endpointName} does not accept a request body`, 400, endpointName)
            }

            if (endpointDef.auth.userAccessToken && userAccessToken) {
                // User token provided (takes precedence over app token)
            } else if (endpointDef.auth.appAccessToken && appAccessToken) {
                // App token provided
            } else if (endpointDef.auth.userAccessToken || endpointDef.auth.appAccessToken) {
                throw new HelixApiError(`Endpoint ${endpointName} requires a user access token or app access token`, 401, endpointName)
            } else if (endpointDef.auth.userAccessToken) {
                throw new HelixApiError(`Endpoint ${endpointName} requires a user access token`, 401, endpointName)
            } else if (endpointDef.auth.appAccessToken) {
                throw new HelixApiError(`Endpoint ${endpointName} requires an app access token`, 401, endpointName)
            }
            
            let response: HelixHttpResponse
            let retryAttempts = 0
            let hasRefreshedToken = false
            
            // Main request loop with retry logic
            do {
                const headers: Record<string, string> = {}
                if (userAccessToken && endpointDef.auth.userAccessToken) {
                    const userToken = await userAccessToken.getAccessToken()
                    if (endpointDef.auth.userScopes) {
                        // Check token scopes
                        if (!validateScopeSet(endpointDef.auth.userScopes, userToken.scopes)) {
                            throw new HelixInsufficientScopesError(
                                `User access token does not have required scopes for endpoint ${endpointName}: ${formatScopeSet(endpointDef.auth.userScopes)}`,
                                401, // Unauthorized
                                endpointName,
                                endpointDef.auth.userScopes,
                            )
                        }
                    }
                    headers['Authorization'] = `Bearer ${userToken.accessToken}`
                    headers['Client-ID'] = userAccessToken.getClientID()
                } else if (appAccessToken && endpointDef.auth.appAccessToken) {
                    const appToken = await appAccessToken.getAccessToken()
                    headers['Authorization'] = `Bearer ${appToken.accessToken}`
                    headers['Client-ID'] = appAccessToken.getClientID()
                }
                response = await httpClient.fetch({ method, url, headers, query, body, signal })
                rateLimitManager.onRequestAttempt(response.headers)
                
                // Handle 401 - Unauthorized (try token refresh)
                if (response.status === 401 && !hasRefreshedToken) {
                    if (endpointDef.auth.userAccessToken && userAccessToken && userAccessToken.canRefreshAccessToken()) {
                        await userAccessToken.refreshAccessToken()
                        hasRefreshedToken = true
                    } else if (endpointDef.auth.appAccessToken && appAccessToken && appAccessToken.canRefreshAccessToken()) {
                        await appAccessToken.refreshAccessToken()
                        hasRefreshedToken = true
                    } else {
                        // If can't refresh or already tried, will fall through to error handling
                        break
                    }
                }
                // Handle 429 - Rate Limit (wait and retry)
                else if (response.status === 429) {
                    const waitMs = rateLimitManager.onRateLimitHit()
                    await wait(waitMs, signal)
                }
                // Handle 503 - Service Unavailable (wait and retry)
                else if (response.status === 503) {
                    await wait(1000, signal)
                }
                // Exit loop on any other status
                else {
                    break
                }
            } while (retryAttempts++ < MAX_RETRY_ATTEMPTS)
            
            // Extract rate limit info
            const rateLimitInfo: HelixRateLimitInfo = {
                limit: response.headers.ratelimitLimit,
                remaining: response.headers.ratelimitRemaining,
                resetAt: new Date(response.headers.ratelimitReset * 1000),
            }
            
            let responseBody: any = undefined
            if (endpointDef.successCodes.includes(response.status)) {
                rateLimitManager.onSuccessfulRequest()

                if (endpointDef.responseBody) {
                    if (!response.body) {
                        throw new HelixApiError(
                            `Endpoint ${endpointName} returned empty body`,
                            response.status,
                            endpointName,
                        )
                    }
                    responseBody = endpointDef.responseBody.parse(response.body)
                } else if (response.body && Object.keys(response.body).length > 0) {
                    throw new HelixApiError(
                        `Endpoint ${endpointName} did not expect a response body`,
                        response.status,
                        endpointName,
                    )
                }
            }
            else if (response.status === 429) {
                const resetTime = rateLimitInfo?.resetAt ? ` (reset at ${rateLimitInfo.resetAt.toISOString()})` : ''
                throw new HelixApiRateLimitError(
                    `Rate limit exceeded for endpoint ${endpointName}${resetTime}`,
                    response.status,
                    endpointName,
                    rateLimitInfo,
                )
            }
            else if (endpointDef.errorCodes.includes(response.status)) {
                throw new HelixApiError(
                    `Endpoint ${endpointName} returned error status ${response.status}`,
                    response.status,
                    endpointName,
                )
            } else {
                throw new HelixApiError(
                    `Endpoint ${endpointName} returned unexpected status ${response.status}`,
                    response.status,
                    endpointName,
                )
            }
            return responseBody
        }
    }
}
