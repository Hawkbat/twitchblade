import { DefaultUserAccessTokenProvider, DeviceCodeGrantFlowStrategy } from "./auth/auth.js"
import type { UserAccessTokenScope } from "./auth/types.js"
import { DefaultWebSocketClient } from "./eventsub/websockets.js"
import { DefaultHelixClient, DefaultHelixHttpClient, DefaultHelixRateLimitManager } from "./helix/helix.js"
import { ConsoleLogger } from "./utils/logger.js"

async function main() {
    const CLIENT_ID = 'e25jlvwzf9ogl3lfzj3xcgxmsgm50f'
    const BROADCASTER_ID = '122728283'
    const SCOPES: UserAccessTokenScope[] = [
        'user:read:chat'
    ]

    const logger = new ConsoleLogger()
    const httpClient = new DefaultHelixHttpClient()
    const rateLimitManager = new DefaultHelixRateLimitManager()

    const helixClient = new DefaultHelixClient({
        logger,
        httpClient,
        rateLimitManager,
    })

    const cleanupSignalController = new AbortController()
    const signal = cleanupSignalController.signal

    const deviceCodeStrategy = new DeviceCodeGrantFlowStrategy(CLIENT_ID, null, false)

    const dcr = await deviceCodeStrategy.requestDeviceCode(SCOPES)
    console.log('Please authorize the application by visiting the following URL and entering the code:')
    console.log(dcr.verificationUrl)
    console.log('Code:', dcr.userCode)
    console.log('This code will expire in', dcr.expiresIn, 'seconds.')

    const initialUserToken = await deviceCodeStrategy.pollForToken(dcr)
    if (!initialUserToken) {
        console.error('Device code has expired. Please restart the authorization process.')
        return
    }

    const userAccessToken = new DefaultUserAccessTokenProvider(deviceCodeStrategy, initialUserToken)

    const eventSubWsClient = new DefaultWebSocketClient({
        logger,
        helixClient,
    })
    for await (const evt of await eventSubWsClient.channelChatMessage({
        broadcaster_user_id: BROADCASTER_ID,
        user_id: BROADCASTER_ID,
    }, {
        userAccessToken,
        signal,
    })) {
        console.log('Received chat message event:', JSON.stringify(evt.event, null, 2))
    }
}

main().catch(console.error)
