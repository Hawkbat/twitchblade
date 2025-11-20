import { UserAccessTokenScopeSchema, type AppAccessToken, type UserAccessToken, type UserAccessTokenScope } from "./types.js"
import { z } from "zod"

// Zod schemas for OAuth response validation
const TokenResponseSchema = z.object({
    access_token: z.string(),
    expires_in: z.number(),
    token_type: z.string(),
    refresh_token: z.string().optional(),
    scope: z.union([z.array(z.string()), z.string()]).optional(),
})

const DeviceCodeResponseSchema = z.object({
    device_code: z.string(),
    expires_in: z.number(),
    interval: z.number(),
    user_code: z.string(),
    verification_uri: z.string(),
})

const ErrorResponseSchema = z.object({
    message: z.string(),
    status: z.number().optional(),
    error: z.string().optional(),
})

const ValidationResponseSchema = z.object({
    client_id: z.string(),
    login: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    user_id: z.string().optional(),
    expires_in: z.number().optional(),
})

// Implements auth flows for obtaining tokens. Flows include:
// Implicit Code Grant Flow: generates user access tokens without refresh tokens (requires publicly accessible redirect URI but not client secret)
// Authorization Code Grant Flow: generates user access tokens with refresh tokens (requires publicly accessible redirect URI and client secret)
// Device Code Grant Flow: generates user access tokens with refresh tokens (does not require redirect URI but refresh tokens expire after 30 days of inactivity, requiring periodic re-authentication)
// Client Credentials Flow: generates app access tokens (requires client secret)

/**
 * Generates a cryptographically secure random anti-CSRF token as a hexadecimal string to use as the state parameter in OAuth flows.
 */
export function generateAntiCSRFToken() {
    return crypto.getRandomValues(new Uint8Array(16)).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')
}

function isBrowser() {
    // @ts-expect-error Node, Bun and Deno define global variables that browser environments do not have
    return (typeof window !== 'undefined' && typeof window.document !== 'undefined' && typeof process === 'undefined' && typeof Bun === 'undefined' && typeof Deno === 'undefined')
}

interface BaseAccessTokenFlowStrategy<T extends UserAccessToken | AppAccessToken> {
    getClientID(): string
    canRefreshAccessToken(expiredToken: T): boolean
    refreshAccessToken(expiredToken: T): Promise<T>
}

export interface UserAccessTokenFlowStrategy extends BaseAccessTokenFlowStrategy<UserAccessToken> {

}

export interface AppAccessTokenFlowStrategy extends BaseAccessTokenFlowStrategy<AppAccessToken> {

}

/**
 * Implements the Implicit Code Grant Flow for obtaining user access tokens.
 */
export class ImplicitGrantFlowStrategy implements UserAccessTokenFlowStrategy {

    /**
     * @param clientID Your Twitch application's Client ID.
     * @param redirectURI Your Twitch application's Redirect URI. Required for most operations.
     */
    constructor(
        private readonly clientID: string,
        private readonly redirectURI: string | null,
    ) {

    }

    getClientID(): string {
        return this.clientID
    }

    // Implicit Code Grant Flow:
    // 1. Generate authorization URL with client ID, redirect URI, scopes, and CSRF state
    // 2. Redirect user to authorization URL
    // 3. User logs in to Twitch (if needed) and authorizes application
    // 4. Twitch redirects user to redirect URI with access token in URL fragment
    // 5. Extract access token from URL fragment

    /**
     * Generates an authorization URL and anti-CSRF state token for the Implicit Code Grant Flow. Browser or server.
     */
    generateAuthorizationUrl({ scopes, state, forceVerify }: {
        scopes: UserAccessTokenScope[]
        state?: string
        forceVerify?: boolean
    }) {
        if (!this.clientID) {
            throw new Error("Client ID is required for Implicit Code Grant Flow")
        }
        if (!this.redirectURI) {
            throw new Error("Redirect URI is required for Implicit Code Grant Flow")
        }
        state ??= generateAntiCSRFToken()
        const url = new URL('https://id.twitch.tv/oauth2/authorize')
        url.searchParams.append('client_id', this.clientID)
        if (forceVerify) {
            url.searchParams.append('force_verify', 'true')
        }
        url.searchParams.append('redirect_uri', this.redirectURI)
        url.searchParams.append('response_type', 'token')
        url.searchParams.append('scope', scopes.join(' '))
        url.searchParams.append('state', state)

        return {
            url: url.toString(),
            state,
        }
    }

    /**
     * Opens the Twitch authorization URL in the current window or a new tab. Browser-only.
     * @param url The Twitch authorization URL to open.
     * @param newTab Whether to open the URL in a new tab. Defaults to false (current window).
     */
    openAuthorizationUrl(url: string, newTab: boolean = false) {
        if (!isBrowser()) {
            throw new Error("openAuthorizationUrl can only be used in a browser environment")
        }
        const parsedUrl = new URL(url)
        // Validate that the URL is a Twitch authorization URL to prevent redirect hijacking
        if (parsedUrl.origin !== 'https://id.twitch.tv' || parsedUrl.pathname !== '/oauth2/authorize') {
            throw new Error("Invalid Twitch authorization URL")
        }

        if (newTab) {
            window.open(url, '_blank', 'noopener')
        } else {
            window.location.href = url
        }
    }

    /**
     * Tries to retrieve a user access token from the URL fragment after redirection from Twitch OAuth. Returns null if no token is found. Browser-only.
     * @param expectedState Expected state parameter for CSRF protection.
     */
    tryRetrieveTokenAtRedirectUri(expectedState: string): UserAccessToken | null {
        if (!isBrowser()) {
            throw new Error("tryRetrieveToken can only be used in a browser environment")
        }

        const hashParams = new URLSearchParams(window.location.hash.slice(1))

        // If access was denied or an error occurred, Twitch will include error parameters in the URL fragment
        if (hashParams.has('error')) {
            const error = hashParams.get('error')
            const errorDescription = hashParams.get('error_description')
            throw new Error(`Twitch OAuth error: ${error} - ${errorDescription}`)
        }

        if (!hashParams.has('access_token')) {
            // No access token found in URL fragment; page was likely not redirected from Twitch OAuth
            return null
        }

        const accessToken = hashParams.get('access_token')
        const tokenType = hashParams.get('token_type')
        const expiresIn = hashParams.get('expires_in')
        const scope = hashParams.get('scope')
        const state = hashParams.get('state')

        // Verify state to prevent CSRF attacks
        if (state !== expectedState) {
            throw new Error("Invalid state parameter")
        }

        if (accessToken && tokenType === 'bearer' && expiresIn) {
            const expiry = Date.now() + parseInt(expiresIn, 10) * 1000
            const scopes = scope ? z.array(UserAccessTokenScopeSchema).parse(scope.split(' ')) : []

            // Clear the URL fragment to remove sensitive information
            window.history.replaceState(null, '', window.location.pathname + window.location.search)

            return {
                accessToken,
                expiry,
                scopes,
                refreshToken: null, // Implicit Grant Flow does not provide refresh tokens
            }
        } else {
            throw new Error("Invalid token response in URL fragment")
        }
    }

    /**
     * Determines if the expired access token can be refreshed. Implicit Grant Flow does not provide refresh tokens, so this always returns false.
     */
    canRefreshAccessToken(expiredToken: UserAccessToken): boolean {
        // Implicit Grant Flow does not provide refresh tokens
        return false
    }

    /**
     * @deprecated Implicit Grant Flow does not support token refresh; use Authorization Code Grant Flow or Device Code Grant Flow for refreshable tokens. This method always throws an error but is included for interface compatibility.
     */
    async refreshAccessToken(expiredToken: UserAccessToken): Promise<UserAccessToken> {
        throw new Error("Implicit Grant Flow does not support token refresh")
    }
}

/**
 * Implements the Authorization Code Grant Flow for obtaining user access tokens.
 */
export class AuthorizationCodeGrantFlowStrategy implements UserAccessTokenFlowStrategy {

    /**
     * @param clientID Your Twitch application's Client ID.
     * @param clientSecret Your Twitch application's Client Secret. Required for most operations.
     * @param redirectURI Your Twitch application's Redirect URI. Required for most operations.
     */
    constructor(
        private readonly clientID: string,
        private readonly clientSecret: string | null,
        private readonly redirectURI: string | null,
    ) {

    }

    getClientID(): string {
        return this.clientID
    }

    // Authorization Code Grant Flow:
    // 1. Generate authorization URL with client ID, redirect URI, scopes, and CSRF state
    // 2. Redirect user to authorization URL
    // 3. User logs in to Twitch (if needed) and authorizes application
    // 4. Twitch redirects user to redirect URI with authorization code and CSRF state in query parameters
    // 5. Exchange authorization code for access token and refresh token via API endpoint

    /**
     * Generates an authorization URL and anti-CSRF state token for the Authorization Code Grant Flow. Browser or server.
     */
    generateAuthorizationUrl({ scopes, state, forceVerify }: {
        scopes: UserAccessTokenScope[]
        state?: string
        forceVerify?: boolean
    }) {
        if (!this.clientID) {
            throw new Error("Client ID is required for Authorization Code Grant Flow")
        }
        if (!this.redirectURI) {
            throw new Error("Redirect URI is required for Authorization Code Grant Flow")
        }
        state ??= generateAntiCSRFToken()
        const url = new URL('https://id.twitch.tv/oauth2/authorize')
        url.searchParams.append('client_id', this.clientID)
        if (forceVerify) {
            url.searchParams.append('force_verify', 'true')
        }
        url.searchParams.append('redirect_uri', this.redirectURI)
        url.searchParams.append('response_type', 'code')
        url.searchParams.append('scope', scopes.join(' '))
        url.searchParams.append('state', state)
        return {
            url: url.toString(),
            state,
        }
    }

    /**
     * Opens the Twitch authorization URL in the current window or a new tab. Browser-only.
     * @param url The Twitch authorization URL to open.
     * @param newTab Whether to open the URL in a new tab. Defaults to false (current window).
     */
    openAuthorizationUrl(url: string, newTab: boolean = false) {
        if (!isBrowser()) {
            throw new Error("openAuthorizationUrl can only be used in a browser environment")
        }
        
        const parsedUrl = new URL(url)
        // Validate that the URL is a Twitch authorization URL to prevent redirect hijacking
        if (parsedUrl.origin !== 'https://id.twitch.tv' || parsedUrl.pathname !== '/oauth2/authorize') {
            throw new Error("Invalid Twitch authorization URL")
        }

        // Not storing state here because it should be handled server-side in this flow

        if (newTab) {
            window.open(url, '_blank', 'noopener')
        } else {
            window.location.href = url
        }
    }

    /**
     * Tries to retrieve an authorization code from the query parameters after redirection from Twitch OAuth. Returns null if no code is found. Server-only.
     * @param queryParams The URLSearchParams object containing the query parameters from the redirect URI.
     * @param expectedState The expected state parameter for CSRF protection. 
     * @param ignoreIncorrectState Whether to ignore an incorrect state parameter and return null instead. This is useful for scenarios where you need to check the response against multiple in-progress OAuth flows to see which one it belongs to. Defaults to false.
     */
    tryRetrieveAuthorizationCodeAtRedirectUri(queryParams: URLSearchParams, expectedState: string, ignoreIncorrectState: boolean = false) {
        if (isBrowser()) {
            throw new Error("tryRetrieveAuthorizationCodeAtRedirectUri should only be used in a server environment")
        }

        const state = queryParams.get('state')

        if (state && state !== expectedState) {
            if (ignoreIncorrectState) {
                // Useful for server-side scenarios where multiple OAuth flows are in progress and we're checking which one this response belongs to
                return null
            }
            throw new Error("Invalid state parameter")
        }

        // If access was denied or an error occurred, Twitch will include error parameters in the query string
        if (queryParams.has('error')) {
            const error = queryParams.get('error')
            const errorDescription = queryParams.get('error_description')
            throw new Error(`Twitch OAuth error: ${error} - ${errorDescription}`)
        }

        const code = queryParams.get('code')
        if (!code) {
            // No authorization code found in query parameters; request was likely not redirected from Twitch OAuth
            return null
        }

        const scope = queryParams.get('scope')
        const scopes = scope ? z.array(UserAccessTokenScopeSchema).parse(scope.split(' ')) : []

        return {
            code,
            scopes,
        }
    }

    /**
     * Exchanges an authorization code for a user access token and refresh token via the Twitch OAuth token endpoint. Server-only.
     * @param code The authorization code to exchange for a token.
     */
    async exchangeAuthorizationCodeForToken(code: string): Promise<UserAccessToken> {
        if (isBrowser()) {
            throw new Error("exchangeAuthorizationCodeForToken should only be used in a server environment")
        }
        if (!this.clientID) {
            throw new Error("Client ID is required for Authorization Code Grant Flow")
        }
        if (!this.clientSecret) {
            throw new Error("Client Secret is required for Authorization Code Grant Flow")
        }
        if (!this.redirectURI) {
            throw new Error("Redirect URI is required for Authorization Code Grant Flow")
        }
        const url = new URL('https://id.twitch.tv/oauth2/token')
        const body = new URLSearchParams()
        body.append('client_id', this.clientID)
        body.append('client_secret', this.clientSecret)
        body.append('code', code)
        body.append('grant_type', 'authorization_code')
        body.append('redirect_uri', this.redirectURI)
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        })
        if (!response.ok) {
            throw new Error(`Failed to exchange authorization code for token: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        const parsed = TokenResponseSchema.parse(data)
        if (parsed.token_type !== 'bearer') {
            throw new Error(`Invalid token type received: ${parsed.token_type}`)
        }
        const expiry = Date.now() + parsed.expires_in * 1000
        const scopes = parsed.scope ? z.array(UserAccessTokenScopeSchema).parse(Array.isArray(parsed.scope) ? parsed.scope : parsed.scope.split(' ')) : []
        const accessToken = parsed.access_token
        const refreshToken = parsed.refresh_token ?? null
        return {
            accessToken,
            expiry,
            scopes,
            refreshToken,
        }
    }

    /**
     * Determines if the expired access token can be refreshed.
     * @param expiredToken The expired user access token.
     */
    canRefreshAccessToken(expiredToken: UserAccessToken): boolean {
        return expiredToken.refreshToken !== null
    }

    /**
     * Refreshes an expired user access token using its refresh token via the Twitch OAuth token endpoint. Server-only.
     * @param expiredToken The expired user access token to refresh.
     */
    async refreshAccessToken(expiredToken: UserAccessToken): Promise<UserAccessToken> {
        if (isBrowser()) {
            throw new Error("refreshAccessToken should only be used in a server environment")
        }
        if (!this.clientID) {
            throw new Error("Client ID is required for Authorization Code Grant Flow")
        }
        if (!this.clientSecret) {
            throw new Error("Client Secret is required for Authorization Code Grant Flow")
        }
        if (!expiredToken.refreshToken) {
            throw new Error("Access token does not have a valid refresh token")
        }
        const url = new URL('https://id.twitch.tv/oauth2/token')
        const body = new URLSearchParams()
        body.append('client_id', this.clientID)
        body.append('client_secret', this.clientSecret)
        body.append('grant_type', 'refresh_token')
        body.append('refresh_token', expiredToken.refreshToken)
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        })
        if (!response.ok) {
            throw new Error(`Failed to refresh access token: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        const parsed = TokenResponseSchema.parse(data)
        if (parsed.token_type !== 'bearer') {
            throw new Error(`Invalid token type received: ${parsed.token_type}`)
        }
        const expiry = Date.now() + parsed.expires_in * 1000
        const scopes = parsed.scope ? z.array(UserAccessTokenScopeSchema).parse(Array.isArray(parsed.scope) ? parsed.scope : parsed.scope.split(' ')) : []
        const accessToken = parsed.access_token
        const refreshToken = parsed.refresh_token ?? null
        return {
            accessToken,
            expiry,
            scopes,
            refreshToken,
        }
    }
}

/**
 * Implements the Device Code Grant Flow for obtaining user access tokens.
 */
export class DeviceCodeGrantFlowStrategy implements UserAccessTokenFlowStrategy {

    /**
     * @param clientID Your Twitch application's Client ID.
     * @param clientSecret Your Twitch application's Client Secret. Required for confidential clients, optional for public clients.
     * @param isConfidentialClient Whether your application is a confidential client (can securely store a client secret) or a public client (cannot securely store a client secret).
     */
    constructor(
        private readonly clientID: string,
        private readonly clientSecret: string | null,
        private readonly isConfidentialClient: boolean,
    ) {

    }

    getClientID(): string {
        return this.clientID
    }

    // Device Code Grant Flow:
    // 1. Request device code, user code, and verification URL via API endpoint with client ID and scopes
    // 2. Display user code and verification URL to user
    // 3. User navigates to verification URL and enters user code, then logs in and authorizes application
    // 4. Poll API endpoint with device code until user has authorized application and access token and refresh token are returned

    /**
     * Requests a device code, user code, and verification URL for the Device Code Grant Flow. The user must navigate to the verification URL and enter the user code to authorize the application.
     * @param scopes The scopes to request for the user access token.
     */
    async requestDeviceCode(scopes: UserAccessTokenScope[]) {
        if (!this.clientID) {
            throw new Error("Client ID is required for Device Code Grant Flow")
        }
        const url = new URL('https://id.twitch.tv/oauth2/device')
        url.searchParams.append('client_id', this.clientID)
        url.searchParams.append('scopes', scopes.join(' '))
        const response = await fetch(url.toString(), {
            method: 'POST',
        })
        if (!response.ok) {
            throw new Error(`Failed to request device code: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        const parsed = DeviceCodeResponseSchema.parse(data)
        return {
            deviceCode: parsed.device_code,
            expiresIn: parsed.expires_in,
            interval: parsed.interval,
            userCode: parsed.user_code,
            verificationUrl: parsed.verification_uri,
            scopes,
        }
    }

    /**
     * Opens the verification URL in the current window or a new tab for the user to enter the user code and authorize the application. Browser-only.
     * @param url The verification URL where the user can enter the user code to authorize the application.
     * @param newTab Whether to open the URL in a new tab. Defaults to false (current window).
     */
    openVerificationUrl(url: string, newTab: boolean = false) {
        if (!isBrowser()) {
            throw new Error("openVerificationUri can only be used in a browser environment")
        }

        const parsedUrl = new URL(url)
        // Validate that the URL is a Twitch verification URL to prevent redirect hijacking
        if (parsedUrl.origin !== 'https://www.twitch.tv' || parsedUrl.pathname !== '/activate') {
            throw new Error("Invalid Twitch verification URL")
        }

        if (newTab) {
            window.open(url, '_blank', 'noopener')
        } else {
            window.location.href = url
        }
    }

    /**
     * Tries to retrieve a user access token using the device code via the Twitch OAuth token endpoint. Returns null if the user has not yet authorized the device code. You should call this method at the interval specified when requesting the device code until a token is returned or the device code expires.
     * @param deviceCode The device code obtained from the requestDeviceCode method.
     * @param scopes The scopes to request for the user access token.
     */
    async tryRetrieveTokenWithDeviceCode(deviceCode: string, scopes: UserAccessTokenScope[]) : Promise<UserAccessToken | null> {
        if (!this.clientID) {
            throw new Error("Client ID is required for Device Code Grant Flow")
        }
        if (!this.clientSecret && this.isConfidentialClient) {
            throw new Error("Client Secret is required for confidential clients in Device Code Grant Flow")
        }
        if (this.clientSecret && !this.isConfidentialClient) {
            throw new Error("Client Secret should not be provided for public clients in Device Code Grant Flow")
        }
        const url = new URL('https://id.twitch.tv/oauth2/token')
        const body = new URLSearchParams()
        body.append('client_id', this.clientID)
        if (this.clientSecret && this.isConfidentialClient) {
            body.append('client_secret', this.clientSecret)
        }
        body.append('scope', scopes.join(' '))
        body.append('device_code', deviceCode)
        body.append('grant_type', 'urn:ietf:params:oauth:grant-type:device_code')
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        })
        if (!response.ok) {
            if (response.status === 400) {
                const data = await response.json()
                const parsed = ErrorResponseSchema.parse(data)
                if (parsed.message === 'authorization_pending') {
                    // User has not yet authorized the device code
                    return null
                } else {
                    throw new Error(`Failed to retrieve token with device code: ${parsed.message}`)
                }
            } else {
                throw new Error(`Failed to retrieve token with device code: ${response.status} ${response.statusText}`)
            }
        }
        const data = await response.json()
        const parsed = TokenResponseSchema.parse(data)
        if (parsed.token_type !== 'bearer') {
            throw new Error(`Invalid token type received: ${parsed.token_type}`)
        }
        const expiry = Date.now() + parsed.expires_in * 1000
        const tokenScopes = parsed.scope ? z.array(UserAccessTokenScopeSchema).parse(Array.isArray(parsed.scope) ? parsed.scope : parsed.scope.split(' ')) : []
        const accessToken = parsed.access_token
        const refreshToken = parsed.refresh_token ?? null
        return {
            accessToken,
            expiry,
            scopes: tokenScopes,
            refreshToken,
        }
    }

    /**
     * Helper method that polls for a user access token using the device code until the user authorizes it or the device code expires. Returns null if the device code expires before authorization.
     * @param deviceCodeResponse The response from the {@link requestDeviceCode} method containing the device code, expiration time, polling interval, and scopes.
     */
    async pollForToken(deviceCodeResponse: { deviceCode: string, expiresIn: number, interval: number, scopes: UserAccessTokenScope[] }): Promise<UserAccessToken | null> {
        const { deviceCode, expiresIn, interval, scopes } = deviceCodeResponse
        const initialUserToken = await new Promise<UserAccessToken | null>((resolve) => {
            let debounce = false
            const intervalHandle = setInterval(async () => {
                if (debounce) return
                debounce = true
                const token = await this.tryRetrieveTokenWithDeviceCode(deviceCode, scopes)
                debounce = false
                if (!token) return
                clearInterval(intervalHandle)
                clearTimeout(timeoutHandle)
                resolve(token)
            }, interval * 1000)
    
            const timeoutHandle = setTimeout(() => {
                clearInterval(intervalHandle)
                resolve(null)
            }, expiresIn * 1000)
        })
        return initialUserToken
    }

    /**
     * Determines if the expired access token can be refreshed.
     * @param expiredToken The expired user access token.
     */
    canRefreshAccessToken(expiredToken: UserAccessToken): boolean {
        return expiredToken.refreshToken !== null
    }

    /**
     * Refreshes an expired user access token using its refresh token via the Twitch OAuth token endpoint.
     * @param expiredToken The expired user access token to refresh.
     */
    async refreshAccessToken(expiredToken: UserAccessToken): Promise<UserAccessToken> {
        // Same as Authorization Code Grant Flow, but client secret is optional for public clients
        if (!this.clientID) {
            throw new Error("Client ID is required for Device Code Grant Flow")
        }
        if (this.clientSecret && !this.isConfidentialClient) {
            throw new Error("Client Secret should not be provided for public clients in Device Code Grant Flow")
        }
        if (!this.clientSecret && this.isConfidentialClient) {
            throw new Error("Client Secret is required for confidential clients in Device Code Grant Flow")
        }
        if (!expiredToken.refreshToken) {
            throw new Error("Access token does not have a valid refresh token")
        }
        const url = new URL('https://id.twitch.tv/oauth2/token')
        const body = new URLSearchParams()
        body.append('client_id', this.clientID)
        if (this.clientSecret && this.isConfidentialClient) {
            body.append('client_secret', this.clientSecret)
        }
        body.append('grant_type', 'refresh_token')
        body.append('refresh_token', expiredToken.refreshToken)
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        })
        if (!response.ok) {
            throw new Error(`Failed to refresh access token: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        const parsed = TokenResponseSchema.parse(data)
        if (parsed.token_type !== 'bearer') {
            throw new Error(`Invalid token type received: ${parsed.token_type}`)
        }
        const expiry = Date.now() + parsed.expires_in * 1000
        const scopes = parsed.scope ? z.array(UserAccessTokenScopeSchema).parse(Array.isArray(parsed.scope) ? parsed.scope : parsed.scope.split(' ')) : []
        const accessToken = parsed.access_token
        const refreshToken = parsed.refresh_token ?? null
        return {
            accessToken,
            expiry,
            scopes,
            refreshToken,
        }
    }
}

/**
 * Implements the Client Credentials Flow for obtaining app access tokens.
 */
export class ClientCredentialsFlowStrategy implements AppAccessTokenFlowStrategy {

    /**
     * 
     * @param clientID Your Twitch application's Client ID.
     * @param clientSecret Your Twitch application's Client Secret. Required.
     */
    constructor(
        private readonly clientID: string,
        private readonly clientSecret: string | null,
    ) {

    }

    getClientID(): string {
        return this.clientID
    }

    // Client Credentials Flow:
    // 1. Request app access token via API endpoint with client ID and client secret

    /**
     * Requests an app access token via the Twitch OAuth token endpoint using the Client Credentials Flow. Server-only.
     */
    async requestAppAccessToken(): Promise<AppAccessToken> {
        if (isBrowser()) {
            throw new Error("requestAppAccessToken should only be used in a server environment")
        }
        if (!this.clientID) {
            throw new Error("Client ID is required for Client Credentials Flow")
        }
        if (!this.clientSecret) {
            throw new Error("Client Secret is required for Client Credentials Flow")
        }
        const url = new URL('https://id.twitch.tv/oauth2/token')
        const body = new URLSearchParams()
        body.append('client_id', this.clientID)
        body.append('client_secret', this.clientSecret)
        body.append('grant_type', 'client_credentials')
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        })
        if (!response.ok) {
            throw new Error(`Failed to request app access token: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        const parsed = TokenResponseSchema.parse(data)
        if (parsed.token_type !== 'bearer') {
            throw new Error(`Invalid token type received: ${parsed.token_type}`)
        }
        const expiry = Date.now() + parsed.expires_in * 1000
        return {
            accessToken: parsed.access_token,
            expiry,
        }
    }

    /**
     * Determines if the expired access token can be refreshed. App access tokens can always be refreshed by requesting a new token.
     * @param expiredToken The expired app access token.
     */
    canRefreshAccessToken(expiredToken: AppAccessToken): boolean {
        return true
    }

    async refreshAccessToken(expiredToken: AppAccessToken): Promise<AppAccessToken> {
        // Client Credentials Flow tokens can be refreshed by simply requesting a new token
        return this.requestAppAccessToken()
    }
}

interface BaseAccessTokenProvider<T extends UserAccessToken | AppAccessToken> {
    getClientID(): string
    getAccessToken(): Promise<T>
    canRefreshAccessToken(): boolean
    refreshAccessToken(): Promise<T>
    validateAccessToken(): Promise<boolean>
}

export interface UserAccessTokenProvider extends BaseAccessTokenProvider<UserAccessToken> {

}

export interface AppAccessTokenProvider extends BaseAccessTokenProvider<AppAccessToken> {

}

export class InvalidTokenError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "InvalidTokenError"
    }
}

/**
 * Provides user access tokens using the specified {@link UserAccessTokenFlowStrategy}.
 */
export class DefaultUserAccessTokenProvider implements UserAccessTokenProvider {
    private validationPromise: Promise<boolean> | null = null
    private validationResult: boolean | null = null
    private validationExpiry: number | null = null
    private validationIntervalID: ReturnType<typeof setInterval> | null = null

    /**
     * @param strategy The strategy to use for obtaining and refreshing user access tokens.
     * @param accessToken The initial user access token.
     */
    constructor(
        private readonly strategy: UserAccessTokenFlowStrategy,
        private accessToken: UserAccessToken,
    ) {

    }

    /**
     * Retrieves the Client ID associated with the application.
     */
    getClientID(): string {
        return this.strategy.getClientID()
    }

    /**
     * Retrieves a valid user access token, refreshing it if necessary.
     */
    async getAccessToken() {
        if (!this.validateAccessToken()) {
            // Attempt to refresh the token if possible
            if (this.strategy.canRefreshAccessToken(this.accessToken)) {
                this.accessToken = await this.strategy.refreshAccessToken(this.accessToken)
            }
        }
        if (!this.validateAccessToken()) {
            throw new InvalidTokenError("Failed to obtain valid user access token")
        }
        return this.accessToken
    }

    /**
     * Determines if the current access token can be refreshed.
     */
    canRefreshAccessToken() {
        return this.strategy.canRefreshAccessToken(this.accessToken)
    }

    /**
     * Refreshes the current access token using the strategy's refresh method.
     */
    async refreshAccessToken() {
        if (!this.strategy.canRefreshAccessToken(this.accessToken)) {
            throw new InvalidTokenError("Cannot refresh access token")
        }
        this.accessToken = await this.strategy.refreshAccessToken(this.accessToken)
        return this.accessToken
    }

    /**
     * Starts polling to validate the access token every hour. Twitch requires apps to validate tokens at least once per hour, even if they aren't being used for API requests. Returns a function that stops the polling.
     */
    pollValidationStatus() {
        if (this.validationIntervalID) {
            clearInterval(this.validationIntervalID)
        }
        const interval = setInterval(() => this.validateAccessToken(), 60 * 60 * 1000) // Validate every hour
        this.validationIntervalID = interval
        return () => clearInterval(interval)
    }

    /**
     * Validates the current access token by calling the Twitch OAuth validation endpoint. Caches the result for one hour.
     * @returns True if the access token is valid, false otherwise.
     */
    async validateAccessToken() {
        if (this.validationResult === false) {
            // Token is already known to be invalid
            return false
        }
        if (this.validationResult !== null && this.validationExpiry && Date.now() < this.validationExpiry) {
            // Cached validation result is still valid
            return this.validationResult
        }
        if (this.validationPromise) {
            // Wait for ongoing validation to complete
            await this.validationPromise
            return this.validationResult ?? false
        } else {
            // Start new validation
            this.validationPromise = (async (): Promise<boolean> => {
                if (!this.accessToken) {
                    return false
                }
                if (Date.now() >= this.accessToken.expiry) {
                    return false
                }

                // TODO: Cache validation results for one hour to avoid excessive validation requests
                // Twitch requires apps to validate tokens every hour even if they aren't in use

                const url = new URL('https://id.twitch.tv/oauth2/validate')
                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken.accessToken}`,
                    },
                })
                if (!response.ok) {
                    return false
                }
                const data = await response.json()
                const parsed = ValidationResponseSchema.parse(data)
                if (parsed.client_id !== this.strategy.getClientID()) {
                    return false
                }

                // Set validation expiry to one hour from now
                this.validationExpiry = Date.now() + 3600 * 1000
                return true
            })()
            this.validationResult = await this.validationPromise
            this.validationPromise = null
            return this.validationResult
        }
    }
}

/**
 * Provides app access tokens using the specified {@link AppAccessTokenFlowStrategy}.
 */
export class DefaultAppAccessTokenProvider implements AppAccessTokenProvider {

    /**
     * @param strategy The strategy to use for obtaining and refreshing app access tokens.
     * @param accessToken The initial app access token, or null if none is available.
     */
    constructor(
        private readonly strategy: AppAccessTokenFlowStrategy,
        private accessToken: AppAccessToken | null,
    ) {

    }

    /**
     * Retrieves the Client ID associated with the application.
     */
    getClientID(): string {
        return this.strategy.getClientID()
    }

    /**
     * Retrieves a valid app access token, generating a new one if necessary.
     */
    async getAccessToken(): Promise<AppAccessToken> {
        if (!this.validateAccessToken()) {
            const tokenToRefreshWith = this.accessToken ?? { accessToken: '', expiry: 0 }
            if (this.strategy.canRefreshAccessToken(tokenToRefreshWith)) {
                this.accessToken = await this.strategy.refreshAccessToken(tokenToRefreshWith)
            }
        }
        if (!this.validateAccessToken() || !this.accessToken) {
            throw new InvalidTokenError("Failed to obtain app access token")
        }
        return this.accessToken
    }

    /**
     * Determines if the current access token can be refreshed.
     */
    canRefreshAccessToken(): boolean {
        return this.strategy.canRefreshAccessToken(this.accessToken ?? { accessToken: '', expiry: 0 })
    }

    /**
     * Refreshes the current access token using the strategy's refresh method.
     */
    refreshAccessToken(): Promise<AppAccessToken> {
        const tokenToRefreshWith = this.accessToken ?? { accessToken: '', expiry: 0 }
        if (!this.strategy.canRefreshAccessToken(tokenToRefreshWith)) {
            throw new InvalidTokenError("Cannot refresh app access token")
        }
        return this.strategy.refreshAccessToken(tokenToRefreshWith)
    }

    async validateAccessToken(): Promise<boolean> {
        // App access tokens do not require checking against a validation endpoint but may still expire
        if (!this.accessToken) {
            return false
        }
        if (Date.now() >= this.accessToken.expiry) {
            return false
        }
        return true
    }
}
