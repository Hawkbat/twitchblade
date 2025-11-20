import * as z from "zod"

// ============================================================================
// Core Request/Response Types
// ============================================================================

/**
 * Webhook Transport Request
 */
export interface WebhookTransportRequest {
  /** The transport method. */
  method: 'webhook'
  /** The callback URL where the notifications are sent. The URL must use the HTTPS protocol and port 443. */
  callback: string
  /** The secret used to verify the signature. The secret must be an ASCII string that’s a minimum of 10 characters long and a maximum of 100 characters long. */
  secret: string
}

export const WebhookTransportRequestSchema = z.object({
  method: z.literal('webhook'),
  callback: z.string(),
  secret: z.string().min(10).max(100),
})

/**
 * Webhook Transport Response
 */
export interface WebhookTransportResponse {
  /** The transport method. */
  method: 'webhook'
  /** The callback URL where the notifications are sent. The URL must use the HTTPS protocol and port 443. */
  callback: string
}

export const WebhookTransportResponseSchema = z.object({
  method: z.literal('webhook'),
  callback: z.string(),
})

/**
 * WebSocket Transport Request
 */
export interface WebSocketTransportRequest {
  /** The transport method. */
  method: 'websocket'
  /** An ID that identifies the WebSocket to send notifications to. When you connect to EventSub using WebSockets, the server returns the ID in the Welcome message. */
  session_id: string
}

export const WebSocketTransportRequestSchema = z.object({
  method: z.literal('websocket'),
  session_id: z.string(),
})

/**
 * WebSocket Transport Response
 */
export interface WebSocketTransportResponse {
  /** The transport method. */
  method: 'websocket'
  /** An ID that identifies the WebSocket to send notifications to. When you connect to EventSub using WebSockets, the server returns the ID in the Welcome message. */
  session_id: string
  /** The UTC date and time that the WebSocket connection was established. */
  connected_at?: string | undefined
  /** The UTC date and time that the WebSocket connection was lost. */
  disconnected_at?: string | undefined
}

export const WebSocketTransportResponseSchema = z.object({
  method: z.literal('websocket'),
  session_id: z.string(),
  connected_at: z.string().optional(),
  disconnected_at: z.string().optional(),
})

export type SubscriptionStatus = 'enabled' | 'webhook_callback_verification_pending' | 'webhook_callback_verification_failed' | 'notification_failures_exceeded' | 'authorization_revoked' | 'moderator_removed' | 'user_removed' | 'version_removed' | 'beta_maintenance' | 'websocket_disconnected' | 'websocket_failed_ping_pong' | 'websocket_received_inbound_traffic' | 'websocket_connection_unused' | 'websocket_internal_error' | 'websocket_network_timeout' | 'websocket_network_error'

const SubscriptionStatusSchema = z.enum(['enabled', 'webhook_callback_verification_pending', 'webhook_callback_verification_failed', 'notification_failures_exceeded', 'authorization_revoked', 'moderator_removed', 'user_removed', 'version_removed', 'beta_maintenance', 'websocket_disconnected', 'websocket_failed_ping_pong', 'websocket_received_inbound_traffic', 'websocket_connection_unused', 'websocket_internal_error', 'websocket_network_timeout', 'websocket_network_error'])

/**
 * Webhook Subscription Response
 */
export interface WebhookSubscriptionResponse {
  /** The subscription ID. */
  id: string
  /** The subscription status. */
  status: SubscriptionStatus
  /** The subscription's type. */
  type: string
  /** The version number that identifies this definition of the subscription’s data. */
  version: string
  /** How much the subscription counts against your limit. */
  cost: number
  /** The subscription’s parameter values. */
  condition: Record<string, unknown>
  /** The date and time (in RFC3339 format) of when the subscription was created. */
  created_at: string
  /** The transport method. */
  transport: WebhookTransportResponse
}

export const WebhookSubscriptionResponseSchema = z.object({
  id: z.string(),
  status: SubscriptionStatusSchema,
  type: z.string(),
  version: z.string(),
  cost: z.number(),
  condition: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  transport: WebhookTransportResponseSchema,
})

/**
 * WebSocket Subscription Response
 */
export interface WebSocketSubscriptionResponse {
  /** The subscription ID. */
  id: string
  /** The subscription status. */
  status: SubscriptionStatus
  /** The subscription's type. */
  type: string
  /** The version number that identifies this definition of the subscription’s data. */
  version: string
  /** How much the subscription counts against your limit. */
  cost: number
  /** The subscription’s parameter values. */
  condition: Record<string, unknown>
  /** The date and time (in RFC3339 format) of when the subscription was created. */
  created_at: string
  /** The transport method. */
  transport: WebSocketTransportResponse
}

export const WebSocketSubscriptionResponseSchema = z.object({
  id: z.string(),
  status: SubscriptionStatusSchema,
  type: z.string(),
  version: z.string(),
  cost: z.number(),
  condition: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  transport: WebSocketTransportResponseSchema,
})

/**
 * Webhook Challenge
 */
export interface WebhookChallenge {
  challenge: string
  subscription: WebhookSubscriptionResponse
}

export const WebhookChallengeSchema = z.object({
  challenge: z.string(),
  subscription: WebhookSubscriptionResponseSchema,
})

/**
 * Webhook Revocation
 */
export interface WebhookRevocation {
  subscription: WebhookSubscriptionResponse
}

export const WebhookRevocationSchema = z.object({
  subscription: WebhookSubscriptionResponseSchema,
})

/**
 * Webhook Notification
 */
export interface WebhookNotification {
  subscription: WebhookSubscriptionResponse
  event: Record<string, unknown>
}

export const WebhookNotificationSchema = z.object({
  subscription: WebhookSubscriptionResponseSchema,
  event: z.record(z.string(), z.unknown()),
})

/**
 * WebSocket Metadata
 */
export type WebSocketMetadata = {
  message_id: string
  message_type: 'session_welcome' | 'session_keepalive' | 'session_reconnect'
  message_timestamp: string
} | {
  message_id: string
  message_type: 'notification' | 'revocation'
  message_timestamp: string
  subscription_type: string
  subscription_version: string
}

export const WebSocketMetadataSchema = z.discriminatedUnion('message_type', [
  z.object({
    message_id: z.string(),
    message_type: z.enum(['session_welcome', 'session_keepalive', 'session_reconnect']),
    message_timestamp: z.string(),
  }),
  z.object({
    message_id: z.string(),
    message_type: z.enum(['notification', 'revocation']),
    message_timestamp: z.string(),
    subscription_type: z.string(),
    subscription_version: z.string(),
  }),
])

/**
 * WebSocket Message
 */
export interface WebSocketMessage {
  metadata: WebSocketMetadata
  payload: Record<string, unknown>
}

export const WebSocketMessageSchema = z.object({
  metadata: WebSocketMetadataSchema,
  payload: z.record(z.string(), z.unknown()),
})

/**
 * WebSocket Welcome Payload
 */
export interface WebSocketWelcomePayload {
  /** An object that contains information about the connection. */
  session: {
    /** An ID that uniquely identifies this WebSocket connection. Use this ID to set the session_id field in all subscription requests. */
    id: string
    /** The connection’s status, which is set to connected. */
    status: 'connected'
    /** The maximum number of seconds that you should expect silence before receiving a keepalive message. For a welcome message, this is the number of seconds that you have to subscribe to an event after receiving the welcome message. If you don’t subscribe to an event within this window, the socket is disconnected. */
    keepalive_timeout_seconds: number
    /** The URL to reconnect to if you get a Reconnect message. Is set to null. */
    reconnect_url: null
    /** The UTC date and time that the connection was created. */
    connected_at: string
  }
}

export const WebSocketWelcomePayloadSchema = z.object({
  session: z.object({
    id: z.string(),
    status: z.literal('connected'),
    keepalive_timeout_seconds: z.number().int(),
    reconnect_url: z.null(),
    connected_at: z.string(),
  })
})

/**
 * WebSocket Revocation Payload
 */
export interface WebSocketRevocationPayload {
  /** An object that contains information about your subscription. */
  subscription: WebSocketSubscriptionResponse
}

export const WebSocketRevocationPayloadSchema = z.object({
  subscription: WebSocketSubscriptionResponseSchema,
})

/**
 * WebSocket Keepalive Payload
 */
export interface WebSocketKeepalivePayload {

}

export const WebSocketKeepalivePayloadSchema = z.object({})

/**
 * WebSocket Reconnect Payload
 */
export interface WebSocketReconnectPayload {
  /** An object that contains information about the connection. */
  session: {
    /** An ID that uniquely identifies this WebSocket connection. */
    id: string
    /** The connection’s status, which is set to reconnecting. */
    status: 'reconnecting'
    /** Is set to null. */
    keepalive_timeout_seconds: null
    /** The URL to reconnect to. Use this URL as is; do not modify it. The connection automatically includes the subscriptions from the old connection. */
    reconnect_url: string
    /** The UTC date and time when the connection was created. */
    connected_at: string
  }
}

export const WebSocketReconnectPayloadSchema = z.object({
  session: z.object({
    id: z.string(),
    status: z.literal('reconnecting'),
    keepalive_timeout_seconds: z.null(),
    reconnect_url: z.string(),
    connected_at: z.string(),
  })
})

/**
 * WebSocket Notification Payload
 */
export interface WebSocketNotificationPayload {
  subscription: WebSocketSubscriptionResponse
  event: Record<string, unknown>
}

export const WebSocketNotificationPayloadSchema = z.object({
  subscription: WebSocketSubscriptionResponseSchema,
  event: z.record(z.string(), z.unknown()),
})

// ============================================================================
// Voting Objects
// ============================================================================

/**
 * Bits Voting
 * NOTE: Bits voting is not supported.
 */
export interface BitsVoting {
  /** Not used will be set to false */
  is_enabled: boolean
  /** Not used will be set to 0 */
  amount_per_vote: number
}

export const BitsVotingSchema = z.object({
  is_enabled: z.boolean(),
  amount_per_vote: z.number().int(),
})

/**
 * Channel Points Voting
 */
export interface ChannelPointsVoting {
  /** Indicates if Channel Points can be used for voting */
  is_enabled: boolean
  /** Number of Channel Points required to vote once with Channel Points */
  amount_per_vote: number
}

export const ChannelPointsVotingSchema = z.object({
  is_enabled: z.boolean(),
  amount_per_vote: z.number().int(),
})

/**
 * Poll Choice
 * An array of the choices for a particular poll.
 */
export interface PollChoice {
  /** ID for the choice */
  id: string
  /** Text displayed for the choice */
  title: string
  /** Not used; will be set to 0 */
  bits_votes: number
  /** Number of votes received via Channel Points */
  channel_points_votes: number
  /** Total number of votes received for the choice across all methods of voting */
  votes: number
}

export const PollChoiceSchema = z.object({
  id: z.string(),
  title: z.string(),
  bits_votes: z.number().int(),
  channel_points_votes: z.number().int(),
  votes: z.number().int(),
})

// ============================================================================
// Condition Types
// ============================================================================

/**
 * Automod Message Hold Condition
 */
export interface AutomodMessageHoldCondition {
  /** User ID of the broadcaster (channel) */
  broadcaster_user_id: string
  /** User ID of the moderator */
  moderator_user_id: string
}

export const AutomodMessageHoldConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Automod Message Update Condition
 */
export interface AutomodMessageUpdateCondition {
  /** User ID of the broadcaster (channel). Maximum:1. */
  broadcaster_user_id: string
  /** User ID of the moderator */
  moderator_user_id: string
}

export const AutomodMessageUpdateConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Automod Settings Update Condition
 */
export interface AutomodSettingsUpdateCondition {
  /** User ID of the broadcaster (channel). Maximum:1. */
  broadcaster_user_id: string
  /** User ID of the moderator */
  moderator_user_id: string
}

export const AutomodSettingsUpdateConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Automod Terms Update Condition
 */
export interface AutomodTermsUpdateCondition {
  /** User ID of the broadcaster (channel). Maximum:1. */
  broadcaster_user_id: string
  /** User ID of the moderator creating the subscription. Maximum:1 */
  moderator_user_id: string
}

export const AutomodTermsUpdateConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Channel Ad Break Begin Condition
 */
export interface ChannelAdBreakBeginCondition {
  /** The ID of the broadcaster that you want to get Channel Ad Break begin notifications for. Maximum: 1 */
  broadcaster_id: string
}

export const ChannelAdBreakBeginConditionSchema = z.object({
  broadcaster_id: z.string(),
})

/**
 * Channel Ban Condition
 */
export interface ChannelBanCondition {
  /** The broadcaster user ID for the channel you want to get ban notifications for */
  broadcaster_user_id: string
}

export const ChannelBanConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Bits Use Condition
 */
export interface ChannelBitsUseCondition {
  /** The user ID of the channel broadcaster. Maximum: 1. */
  broadcaster_user_id: string
}

export const ChannelBitsUseConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Chat Clear Condition
 */
export interface ChannelChatClearCondition {
  /** User ID of the channel to receive chat clear events for */
  broadcaster_user_id: string
  /** The user ID to read chat as */
  user_id: string
}

export const ChannelChatClearConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  user_id: z.string(),
})

/**
 * Channel Chat Clear User Messages Condition
 */
export interface ChannelChatClearUserMessagesCondition {
  /** User ID of the channel to receive chat clear user messages events for */
  broadcaster_user_id: string
  /** The user ID to read chat as */
  user_id: string
}

export const ChannelChatClearUserMessagesConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  user_id: z.string(),
})

/**
 * Channel Chat Message Condition
 */
export interface ChannelChatMessageCondition {
  /** The User ID of the channel to receive chat message events for */
  broadcaster_user_id: string
  /** The User ID to read chat as */
  user_id: string
}

export const ChannelChatMessageConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  user_id: z.string(),
})

/**
 * Channel Chat Message Delete Condition
 */
export interface ChannelChatMessageDeleteCondition {
  /** User ID of the channel to receive chat message delete events for */
  broadcaster_user_id: string
  /** The user ID to read chat as */
  user_id: string
}

export const ChannelChatMessageDeleteConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  user_id: z.string(),
})

/**
 * Channel Chat Notification Condition
 */
export interface ChannelChatNotificationCondition {
  /** User ID of the channel to receive chat notification events for */
  broadcaster_user_id: string
  /** The user ID to read chat as */
  user_id: string
}

export const ChannelChatNotificationConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  user_id: z.string(),
})

/**
 * Channel Chat Settings Update Condition
 */
export interface ChannelChatSettingsUpdateCondition {
  /** User ID of the channel to receive chat settings update events for */
  broadcaster_user_id: string
  /** The user ID to read chat as */
  user_id: string
}

export const ChannelChatSettingsUpdateConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  user_id: z.string(),
})

/**
 * Channel Chat User Message Hold Condition
 */
export interface ChannelChatUserMessageHoldCondition {
  /** User ID of the channel to receive chat message events for */
  broadcaster_user_id: string
  /** The user ID to read chat as */
  user_id: string
}

export const ChannelChatUserMessageHoldConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  user_id: z.string(),
})

/**
 * Channel Chat User Message Update Condition
 */
export interface ChannelChatUserMessageUpdateCondition {
  /** User ID of the channel to receive chat message events for */
  broadcaster_user_id: string
  /** The user ID to read chat as */
  user_id: string
}

export const ChannelChatUserMessageUpdateConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  user_id: z.string(),
})

/**
 * Channel Subscribe Condition
 */
export interface ChannelSubscribeCondition {
  /** The broadcaster user ID for the channel you want to get subscribe notifications for */
  broadcaster_user_id: string
}

export const ChannelSubscribeConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Subscription End Condition
 */
export interface ChannelSubscriptionEndCondition {
  /** The broadcaster user ID for the channel you want to get subscription end notifications for */
  broadcaster_user_id: string
}

export const ChannelSubscriptionEndConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Subscription Gift Condition
 */
export interface ChannelSubscriptionGiftCondition {
  /** The broadcaster user ID for the channel you want to get subscription gift notifications for */
  broadcaster_user_id: string
}

export const ChannelSubscriptionGiftConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Subscription Message Condition
 */
export interface ChannelSubscriptionMessageCondition {
  /** The broadcaster user ID for the channel you want to get resubscription chat message notifications for */
  broadcaster_user_id: string
}

export const ChannelSubscriptionMessageConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Cheer Condition
 */
export interface ChannelCheerCondition {
  /** The broadcaster user ID for the channel you want to get cheer notifications for */
  broadcaster_user_id: string
}

export const ChannelCheerConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Update Condition
 */
export interface ChannelUpdateCondition {
  /** The broadcaster user ID for the channel you want to get updates for */
  broadcaster_user_id: string
}

export const ChannelUpdateConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Follow Condition
 */
export interface ChannelFollowCondition {
  /** The broadcaster user ID for the channel you want to get follow notifications for */
  broadcaster_user_id: string
  /** The ID of the moderator of the channel you want to get follow notifications for */
  moderator_user_id: string
}

export const ChannelFollowConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Channel Unban Condition
 */
export interface ChannelUnbanCondition {
  /** The broadcaster user ID for the channel you want to get unban notifications for */
  broadcaster_user_id: string
}

export const ChannelUnbanConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Unban Request Create Condition
 */
export interface ChannelUnbanRequestCreateCondition {
  /** The ID of the user that has permission to moderate the broadcaster's channel */
  moderator_user_id: string
  /** The ID of the broadcaster you want to get chat unban request notifications for. Maximum: 1. */
  broadcaster_user_id: string
}

export const ChannelUnbanRequestCreateConditionSchema = z.object({
  moderator_user_id: z.string(),
  broadcaster_user_id: z.string(),
})

/**
 * Channel Unban Request Resolve Condition
 */
export interface ChannelUnbanRequestResolveCondition {
  /** The ID of the user that has permission to moderate the broadcaster's channel */
  moderator_user_id: string
  /** The ID of the broadcaster you want to get unban request resolution notifications for. Maximum: 1. */
  broadcaster_user_id: string
}

export const ChannelUnbanRequestResolveConditionSchema = z.object({
  moderator_user_id: z.string(),
  broadcaster_user_id: z.string(),
})

/**
 * Channel Raid Condition
 */
export interface ChannelRaidCondition {
  /** The broadcaster user ID that created the channel raid you want to get notifications for */
  from_broadcaster_user_id?: string | undefined
  /** The broadcaster user ID that received the channel raid you want to get notifications for */
  to_broadcaster_user_id?: string | undefined
}

export const ChannelRaidConditionSchema = z.object({
  from_broadcaster_user_id: z.string().optional(),
  to_broadcaster_user_id: z.string().optional(),
})

/**
 * Channel Moderate Condition
 */
export interface ChannelModerateCondition {
  /** The user ID of the broadcaster */
  broadcaster_user_id: string
  /** The user ID of the moderator */
  moderator_user_id: string
}

export const ChannelModerateConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Channel Moderate V2 Condition
 */
export interface ChannelModerateV2Condition {
  /** The user ID of the broadcaster */
  broadcaster_user_id: string
  /** The user ID of the moderator */
  moderator_user_id: string
}

export const ChannelModerateV2ConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Channel Moderator Add Condition
 */
export interface ChannelModeratorAddCondition {
  /** The broadcaster user ID for the channel you want to get moderator addition notifications for */
  broadcaster_user_id: string
}

export const ChannelModeratorAddConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Moderator Remove Condition
 */
export interface ChannelModeratorRemoveCondition {
  /** The broadcaster user ID for the channel you want to get moderator removal notifications for */
  broadcaster_user_id: string
}

export const ChannelModeratorRemoveConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Guest Star Session Begin Condition
 */
export interface ChannelGuestStarSessionBeginCondition {
  /** The broadcaster user ID of the channel hosting the Guest Star Session */
  broadcaster_user_id: string
  /** The user ID of the moderator or broadcaster of the specified channel */
  moderator_user_id: string
}

export const ChannelGuestStarSessionBeginConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Channel Guest Star Session End Condition
 */
export interface ChannelGuestStarSessionEndCondition {
  /** The broadcaster user ID of the channel hosting the Guest Star Session */
  broadcaster_user_id: string
  /** The user ID of the moderator or broadcaster of the specified channel */
  moderator_user_id: string
}

export const ChannelGuestStarSessionEndConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Channel Guest Star Guest Update Condition
 */
export interface ChannelGuestStarGuestUpdateCondition {
  /** The broadcaster user ID of the channel hosting the Guest Star Session */
  broadcaster_user_id: string
  /** The user ID of the moderator or broadcaster of the specified channel */
  moderator_user_id: string
}

export const ChannelGuestStarGuestUpdateConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Channel Guest Star Settings Update Condition
 */
export interface ChannelGuestStarSettingsUpdateCondition {
  /** The broadcaster user ID of the channel hosting the Guest Star Session */
  broadcaster_user_id: string
  /** The user ID of the moderator or broadcaster of the specified channel */
  moderator_user_id: string
}

export const ChannelGuestStarSettingsUpdateConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Channel Points Automatic Reward Redemption Add V2 Condition
 */
export interface ChannelPointsAutomaticRewardRedemptionAddV2Condition {
  /** The broadcaster user ID for the channel you want to receive channel points reward add notifications for */
  broadcaster_user_id: string
}

export const ChannelPointsAutomaticRewardRedemptionAddV2ConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Points Custom Reward Add Condition
 */
export interface ChannelPointsCustomRewardAddCondition {
  /** The broadcaster user ID for the channel you want to receive channel points custom reward add notifications for */
  broadcaster_user_id: string
}

export const ChannelPointsCustomRewardAddConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Points Custom Reward Update Condition
 */
export interface ChannelPointsCustomRewardUpdateCondition {
  /** The broadcaster user ID for the channel you want to receive channel points custom reward update notifications for */
  broadcaster_user_id: string
  /** Optional. Specify a reward id to only receive notifications for a specific reward */
  reward_id?: string | undefined
}

export const ChannelPointsCustomRewardUpdateConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  reward_id: z.string().optional(),
})

/**
 * Channel Points Custom Reward Remove Condition
 */
export interface ChannelPointsCustomRewardRemoveCondition {
  /** The broadcaster user ID for the channel you want to receive channel points custom reward remove notifications for */
  broadcaster_user_id: string
  /** Optional. Specify a reward id to only receive notifications for a specific reward */
  reward_id?: string | undefined
}

export const ChannelPointsCustomRewardRemoveConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  reward_id: z.string().optional(),
})

/**
 * Channel Points Custom Reward Redemption Add Condition
 */
export interface ChannelPointsCustomRewardRedemptionAddCondition {
  /** The broadcaster user ID for the channel you want to receive channel points custom reward redemption add notifications for */
  broadcaster_user_id: string
  /** Optional. Specify a reward id to only receive notifications for a specific reward */
  reward_id?: string | undefined
}

export const ChannelPointsCustomRewardRedemptionAddConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  reward_id: z.string().optional(),
})

/**
 * Channel Points Custom Reward Redemption Update Condition
 */
export interface ChannelPointsCustomRewardRedemptionUpdateCondition {
  /** The broadcaster user ID for the channel you want to receive channel points custom reward redemption update notifications for */
  broadcaster_user_id: string
  /** Optional. Specify a reward id to only receive notifications for a specific reward */
  reward_id?: string | undefined
}

export const ChannelPointsCustomRewardRedemptionUpdateConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  reward_id: z.string().optional(),
})

/**
 * Channel Poll Begin Condition
 */
export interface ChannelPollBeginCondition {
  /** The broadcaster user ID of the channel for which "poll begin" notifications will be received */
  broadcaster_user_id: string
}

export const ChannelPollBeginConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Poll Progress Condition
 */
export interface ChannelPollProgressCondition {
  /** The broadcaster user ID of the channel for which "poll progress" notifications will be received */
  broadcaster_user_id: string
}

export const ChannelPollProgressConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Poll End Condition
 */
export interface ChannelPollEndCondition {
  /** The broadcaster user ID of the channel for which "poll end" notifications will be received */
  broadcaster_user_id: string
}

export const ChannelPollEndConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Prediction Begin Condition
 */
export interface ChannelPredictionBeginCondition {
  /** The broadcaster user ID of the channel for which "prediction begin" notifications will be received */
  broadcaster_user_id: string
}

export const ChannelPredictionBeginConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Prediction Progress Condition
 */
export interface ChannelPredictionProgressCondition {
  /** The broadcaster user ID of the channel for which "prediction progress" notifications will be received */
  broadcaster_user_id: string
}

export const ChannelPredictionProgressConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Prediction Lock Condition
 */
export interface ChannelPredictionLockCondition {
  /** The broadcaster user ID of the channel for which "prediction lock" notifications will be received */
  broadcaster_user_id: string
}

export const ChannelPredictionLockConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Prediction End Condition
 */
export interface ChannelPredictionEndCondition {
  /** The broadcaster user ID of the channel for which "prediction end" notifications will be received */
  broadcaster_user_id: string
}

export const ChannelPredictionEndConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Shared Chat Session End Condition
 */
export interface ChannelSharedChatSessionEndCondition {
  /** The User ID of the channel to receive shared chat session end events for */
  broadcaster_user_id: string
}

export const ChannelSharedChatSessionEndConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Suspicious User Message Condition
 */
export interface ChannelSuspiciousUserMessageCondition {
  /** The ID of a user that has permission to moderate the broadcaster's channel */
  moderator_user_id: string
  /** User ID of the channel to receive chat message events for */
  broadcaster_user_id: string
}

export const ChannelSuspiciousUserMessageConditionSchema = z.object({
  moderator_user_id: z.string(),
  broadcaster_user_id: z.string(),
})

/**
 * Channel Suspicious User Update Condition
 */
export interface ChannelSuspiciousUserUpdateCondition {
  /** The ID of a user that has permission to moderate the broadcaster's channel */
  moderator_user_id: string
  /** The broadcaster you want to get chat unban request notifications for */
  broadcaster_user_id: string
}

export const ChannelSuspiciousUserUpdateConditionSchema = z.object({
  moderator_user_id: z.string(),
  broadcaster_user_id: z.string(),
})

/**
 * Channel VIP Add Condition
 */
export interface ChannelVIPAddCondition {
  /** The User ID of the broadcaster (channel) Maximum: 1 */
  broadcaster_user_id: string
}

export const ChannelVIPAddConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel VIP Remove Condition
 */
export interface ChannelVIPRemoveCondition {
  /** The User ID of the broadcaster (channel) Maximum: 1 */
  broadcaster_user_id: string
}

export const ChannelVIPRemoveConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Warning Acknowledge Condition
 */
export interface ChannelWarningAcknowledgementCondition {
  /** The User ID of the broadcaster */
  broadcaster_user_id: string
  /** The User ID of the moderator */
  moderator_user_id: string
}

export const ChannelWarningAcknowledgementConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Channel Warning Send Condition
 */
export interface ChannelWarningSendCondition {
  /** The User ID of the broadcaster */
  broadcaster_user_id: string
  /** The User ID of the moderator */
  moderator_user_id: string
}

export const ChannelWarningSendConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Conduit Shard Disabled Condition
 */
export interface ConduitShardDisabledCondition {
  /** Your application's client id. The provided client_id must match the client ID in the application access token */
  client_id: string
  /** The conduit ID to receive events for. If omitted, events for all of this client's conduits are sent */
  conduit_id?: string | undefined
}

export const ConduitShardDisabledConditionSchema = z.object({
  client_id: z.string(),
  conduit_id: z.string().optional(),
})

/**
 * Drop Entitlement Grant Condition
 */
export interface DropEntitlementGrantCondition {
  /** The organization ID of the organization that owns the game on the developer portal */
  organization_id: string
  /** The category (or game) ID of the game for which entitlement notifications will be received */
  category_id?: string | undefined
  /** The campaign ID for a specific campaign for which entitlement notifications will be received */
  campaign_id?: string | undefined
}

export const DropEntitlementGrantConditionSchema = z.object({
  organization_id: z.string(),
  category_id: z.string().optional(),
  campaign_id: z.string().optional(),
})

/**
 * Extension Bits Transaction Create Condition
 */
export interface ExtensionBitsTransactionCreateCondition {
  /** The client ID of the extension */
  extension_client_id: string
}

export const ExtensionBitsTransactionCreateConditionSchema = z.object({
  extension_client_id: z.string(),
})

/**
 * Goals Condition
 */
export interface GoalsCondition {
  /** The ID of the broadcaster to get notified about. The ID must match the user_id in the OAuth access token */
  broadcaster_user_id: string
}

export const GoalsConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Hype Train Begin Condition
 */
export interface HypeTrainBeginCondition {
  /** The ID of the broadcaster that you want to get Hype Train begin notifications for */
  broadcaster_user_id: string
}

export const HypeTrainBeginConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Hype Train Progress Condition
 */
export interface HypeTrainProgressCondition {
  /** The ID of the broadcaster that you want to get Hype Train progress notifications for */
  broadcaster_user_id: string
}

export const HypeTrainProgressConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Hype Train End Condition
 */
export interface HypeTrainEndCondition {
  /** The ID of the broadcaster that you want to get Hype Train end notifications for */
  broadcaster_user_id: string
}

export const HypeTrainEndConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Stream Online Condition
 */
export interface StreamOnlineCondition {
  /** The broadcaster user ID you want to get stream online notifications for */
  broadcaster_user_id: string
}

export const StreamOnlineConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Stream Offline Condition
 */
export interface StreamOfflineCondition {
  /** The broadcaster user ID you want to get stream offline notifications for */
  broadcaster_user_id: string
}

export const StreamOfflineConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * User Authorization Grant Condition
 */
export interface UserAuthorizationGrantCondition {
  /** Your application's client id. The provided client_id must match the client id in the application access token */
  client_id: string
}

export const UserAuthorizationGrantConditionSchema = z.object({
  client_id: z.string(),
})

/**
 * User Authorization Revoke Condition
 */
export interface UserAuthorizationRevokeCondition {
  /** Your application's client id. The provided client_id must match the client id in the application access token */
  client_id: string
}

export const UserAuthorizationRevokeConditionSchema = z.object({
  client_id: z.string(),
})

/**
 * User Update Condition
 */
export interface UserUpdateCondition {
  /** The user ID for the user you want update notifications for */
  user_id: string
}

export const UserUpdateConditionSchema = z.object({
  user_id: z.string(),
})

/**
 * Whisper Received Condition
 */
export interface WhisperReceivedCondition {
  /** The user_id of the person receiving whispers */
  user_id: string
}

export const WhisperReceivedConditionSchema = z.object({
  user_id: z.string(),
})

// ============================================================================
// Emote Types
// ============================================================================

/**
 * Emote data
 */
export interface Emote {
  /** The index of where the Emote starts in the text */
  begin: number
  /** The index of where the Emote ends in the text */
  end: number
  /** The emote ID */
  id: string
}

export const EmoteSchema = z.object({
  begin: z.number().int(),
  end: z.number().int(),
  id: z.string(),
})

// ============================================================================
// Message Fragment Types
// ============================================================================

/**
 * Emote metadata in message fragments
 */
export interface EmoteMetadata {
  /** An ID that uniquely identifies this emote */
  id: string
  /** An ID that identifies the emote set that the emote belongs to */
  emote_set_id: string
}

export const EmoteMetadataSchema = z.object({
  id: z.string(),
  emote_set_id: z.string(),
})

/**
 * Cheermote metadata in message fragments
 */
export interface CheermoteMetadata {
  /** The name portion of the Cheermote string that you use in chat to cheer Bits */
  prefix: string
  /** The amount of Bits cheered */
  bits: number
  /** The tier level of the cheermote */
  tier: number
}

export const CheermoteMetadataSchema = z.object({
  prefix: z.string(),
  bits: z.number().int(),
  tier: z.number().int(),
})

/**
 * Message fragment
 */
export interface MessageFragment {
  /** Message text in a fragment */
  text: string
  /** Optional. Metadata pertaining to the emote */
  emote?: EmoteMetadata | undefined
  /** Optional. Metadata pertaining to the cheermote */
  cheermote?: CheermoteMetadata | undefined
}

export const MessageFragmentSchema = z.object({
  text: z.string(),
  emote: EmoteMetadataSchema.optional(),
  cheermote: CheermoteMetadataSchema.optional(),
})

/**
 * Typed message fragment
 */
export interface TextMessageFragment {
  /** Fragment type */
  type: 'text'
  /** Message text in a fragment */
  text: string
}

/**
 * Typed message fragment
 */
export interface EmoteMessageFragment {
  /** Fragment type */
  type: 'emote'
  /** Message text in a fragment */
  text: string
  /** Metadata pertaining to the emote */
  emote: EmoteMetadata
}

/**
 * Typed message fragment
 */
export interface CheermoteMessageFragment {
  /** Fragment type */
  type: 'cheermote'
  /** Message text in a fragment */
  text: string
  /** Metadata pertaining to the cheermote */
  cheermote: CheermoteMetadata
}

export type TypedMessageFragment = TextMessageFragment | EmoteMessageFragment | CheermoteMessageFragment

export const TypedMessageFragmentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("emote"),
    text: z.string(),
    emote: EmoteMetadataSchema,
  }),
  z.object({
    type: z.literal("cheermote"),
    text: z.string(),
    cheermote: CheermoteMetadataSchema,
  }),
])

/**
 * Message body
 */
export interface MessageBody {
  /** The contents of the message */
  text: string
  /** Metadata surrounding the potential inappropriate fragments of the message */
  fragments: MessageFragment[]
}

export const MessageBodySchema = z.object({
  text: z.string(),
  fragments: z.array(MessageFragmentSchema),
})

/**
 * Message body with typed fragments
 */
export interface TypedMessageBody {
  /** The contents of the message */
  text: string
  /** Metadata surrounding the potential inappropriate fragments of the message */
  fragments: TypedMessageFragment[]
}

export const TypedMessageBodySchema = z.object({
  text: z.string(),
  fragments: z.array(TypedMessageFragmentSchema),
})

// ============================================================================
// Event Types
// ============================================================================

/**
 * Automod Message Hold Event
 */
export interface AutomodMessageHoldEvent {
  /** The ID of the broadcaster specified in the request */
  broadcaster_user_id: string
  /** The login of the broadcaster specified in the request */
  broadcaster_user_login: string
  /** The user name of the broadcaster specified in the request */
  broadcaster_user_name: string
  /** The message sender's user ID */
  user_id: string
  /** The message sender's login name */
  user_login: string
  /** The message sender's display name */
  user_name: string
  /** The ID of the message that was flagged by automod */
  message_id: string
  /** The body of the message */
  message: MessageBody
  /** The category of the message */
  category: string
  /** The level of severity. Measured between 1 to 4 */
  level: number
  /** The timestamp of when automod saved the message */
  held_at: string
}

export const AutomodMessageHoldEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  message_id: z.string(),
  message: MessageBodySchema,
  category: z.string(),
  level: z.number().int().min(1).max(4),
  held_at: z.string(),
})

/**
 * Text boundary for automod
 */
export interface TextBoundary {
  /** Index in the message for the start of the problem (0 indexed, inclusive) */
  start_pos: number
  /** Index in the message for the end of the problem (0 indexed, inclusive) */
  end_pos: number
}

export const TextBoundarySchema = z.object({
  start_pos: z.number().int(),
  end_pos: z.number().int(),
})

/**
 * Blocked term information
 */
export interface BlockedTermInfo {
  /** The id of the blocked term found */
  term_id: string
  /** The bounds of the text that caused the message to be caught */
  boundary: TextBoundary
  /** The id of the broadcaster that owns the blocked term */
  owner_broadcaster_user_id: string
  /** The login of the broadcaster that owns the blocked term */
  owner_broadcaster_user_login: string
  /** The username of the broadcaster that owns the blocked term */
  owner_broadcaster_user_name: string
}

export const BlockedTermInfoSchema = z.object({
  term_id: z.string(),
  boundary: TextBoundarySchema,
  owner_broadcaster_user_id: z.string(),
  owner_broadcaster_user_login: z.string(),
  owner_broadcaster_user_name: z.string(),
})

/**
 * Automod detection info
 */
export interface AutomodInfo {
  /** The category of the caught message */
  category: string
  /** The level of severity (1-4) */
  level: number
  /** The bounds of the text that caused the message to be caught */
  boundaries: TextBoundary[]
}

export const AutomodInfoSchema = z.object({
  category: z.string(),
  level: z.number().int().min(1).max(4),
  boundaries: z.array(TextBoundarySchema),
})

/**
 * Blocked term detection info
 */
export interface BlockedTermDetection {
  /** The list of blocked terms found in the message */
  terms_found: BlockedTermInfo[]
}

export const BlockedTermDetectionSchema = z.object({
  terms_found: z.array(BlockedTermInfoSchema),
})

/**
 * Automod hold reason
 */
export type AutomodHoldReason = "automod" | "blocked_term"

/**
 * Automod Message Hold Event V2
 */
export type AutomodMessageHoldEventV2 = {
  /** The ID of the broadcaster specified in the request */
  broadcaster_user_id: string
  /** The login of the broadcaster specified in the request */
  broadcaster_user_login: string
  /** The user name of the broadcaster specified in the request */
  broadcaster_user_name: string
  /** The message sender's user ID */
  user_id: string
  /** The message sender's login name */
  user_login: string
  /** The message sender's display name */
  user_name: string
  /** The ID of the held message */
  message_id: string
  /** The body of the message */
  message: TypedMessageBody
  /** The timestamp of when automod saved the message */
  held_at: string
} & ({
  /** The reason why the message was caught */
  reason: "automod"
  /** If the message was caught by automod, this will be populated */
  automod: AutomodInfo
} | {
  /** The reason why the message was caught */
  reason: "blocked_term"
  /** If the message was caught due to a blocked term, this will be populated */
  blocked_term: BlockedTermDetection
})

export const AutomodMessageHoldEventV2Schema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  message_id: z.string(),
  message: TypedMessageBodySchema,
  held_at: z.string(),
}).and(z.discriminatedUnion("reason", [
  z.object({
    reason: z.literal("automod"),
    automod: AutomodInfoSchema,
  }),
  z.object({
    reason: z.literal("blocked_term"),
    blocked_term: BlockedTermDetectionSchema,
  }),
]))

/**
 * Automod message status
 */
export type AutomodMessageStatus = "Approved" | "Denied" | "Expired"

/**
 * Automod Message Update Event
 */
export interface AutomodMessageUpdateEvent {
  /** The ID of the broadcaster specified in the request */
  broadcaster_user_id: string
  /** The login of the broadcaster specified in the request */
  broadcaster_user_login: string
  /** The user name of the broadcaster specified in the request */
  broadcaster_user_name: string
  /** The message sender's user ID */
  user_id: string
  /** The message sender's login name */
  user_login: string
  /** The message sender's display name */
  user_name: string
  /** The ID of the moderator */
  moderator_user_id: string
  /** The moderator's user name */
  moderator_user_name: string
  /** The login of the moderator */
  moderator_user_login: string
  /** The ID of the message that was flagged by automod */
  message_id: string
  /** The body of the message */
  message: MessageBody
  /** The category of the message */
  category: string
  /** The level of severity. Measured between 1 to 4 */
  level: number
  /** The message's status */
  status: AutomodMessageStatus
  /** The timestamp of when automod saved the message */
  held_at: string
}

export const AutomodMessageUpdateEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  moderator_user_id: z.string(),
  moderator_user_name: z.string(),
  moderator_user_login: z.string(),
  message_id: z.string(),
  message: MessageBodySchema,
  category: z.string(),
  level: z.number().int().min(1).max(4),
  status: z.enum(["Approved", "Denied", "Expired"]),
  held_at: z.string(),
})

/**
 * Automod Message Update Event V2
 */
export interface AutomodMessageUpdateEventV2 {
  /** The ID of the broadcaster specified in the request */
  broadcaster_user_id: string
  /** The login of the broadcaster specified in the request */
  broadcaster_user_login: string
  /** The user name of the broadcaster specified in the request */
  broadcaster_user_name: string
  /** The message sender's user ID */
  user_id: string
  /** The message sender's login name */
  user_login: string
  /** The message sender's display name */
  user_name: string
  /** The ID of the moderator */
  moderator_user_id: string
  /** The moderator's user name */
  moderator_user_name: string
  /** The login of the moderator */
  moderator_user_login: string
  /** The ID of the message that was flagged by automod */
  message_id: string
  /** The body of the message */
  message: MessageBody
  /** The message's status */
  status: AutomodMessageStatus
  /** The timestamp of when automod saved the message */
  held_at: string
  /** The reason why the message was caught */
  reason: AutomodHoldReason
  /** Optional. If the message was caught by automod, this will be populated */
  automod?: AutomodInfo | undefined
  /** Optional. If the message was caught due to a blocked term, this will be populated */
  blocked_term?: BlockedTermDetection | undefined
}

export const AutomodMessageUpdateEventV2Schema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  moderator_user_id: z.string(),
  moderator_user_name: z.string(),
  moderator_user_login: z.string(),
  message_id: z.string(),
  message: MessageBodySchema,
  status: z.enum(["Approved", "Denied", "Expired"]),
  held_at: z.string(),
  reason: z.enum(["automod", "blocked_term"]),
  automod: AutomodInfoSchema.optional(),
  blocked_term: BlockedTermDetectionSchema.optional(),
})

/**
 * Automod Settings Update Event
 */
export interface AutomodSettingsUpdateEvent {
  /** The ID of the broadcaster specified in the request */
  broadcaster_user_id: string
  /** The login of the broadcaster specified in the request */
  broadcaster_user_login: string
  /** The user name of the broadcaster specified in the request */
  broadcaster_user_name: string
  /** The ID of the moderator who changed the channel settings */
  moderator_user_id: string
  /** The moderator's login */
  moderator_user_login: string
  /** The moderator's user name */
  moderator_user_name: string
  /** The Automod level for hostility involving name calling or insults */
  bullying: number
  /** The default AutoMod level for the broadcaster. This field is null if the broadcaster has set one or more of the individual settings */
  overall_level: number | null
  /** The Automod level for discrimination against disability */
  disability: number
  /** The Automod level for racial discrimination */
  race_ethnicity_or_religion: number
  /** The Automod level for discrimination against women */
  misogyny: number
  /** The AutoMod level for discrimination based on sexuality, sex, or gender */
  sexuality_sex_or_gender: number
  /** The Automod level for hostility involving aggression */
  aggression: number
  /** The Automod level for sexual content */
  sex_based_terms: number
  /** The Automod level for profanity */
  swearing: number
}

export const AutomodSettingsUpdateEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  moderator_user_id: z.string(),
  moderator_user_login: z.string(),
  moderator_user_name: z.string(),
  bullying: z.number().int(),
  overall_level: z.number().int().nullable(),
  disability: z.number().int(),
  race_ethnicity_or_religion: z.number().int(),
  misogyny: z.number().int(),
  sexuality_sex_or_gender: z.number().int(),
  aggression: z.number().int(),
  sex_based_terms: z.number().int(),
  swearing: z.number().int(),
})

/**
 * Automod term action type
 */
export type AutomodTermAction = "add_permitted" | "remove_permitted" | "add_blocked" | "remove_blocked"

/**
 * Automod Terms Update Event
 */
export interface AutomodTermsUpdateEvent {
  /** The ID of the broadcaster specified in the request */
  broadcaster_user_id: string
  /** The login of the broadcaster specified in the request */
  broadcaster_user_login: string
  /** The user name of the broadcaster specified in the request */
  broadcaster_user_name: string
  /** The ID of the moderator who changed the channel settings */
  moderator_user_id: string
  /** The moderator's login */
  moderator_user_login: string
  /** The moderator's user name */
  moderator_user_name: string
  /** The status change applied to the terms */
  action: AutomodTermAction
  /** Indicates whether this term was added due to an Automod message approve/deny action */
  from_automod: boolean
  /** The list of terms that had a status change */
  terms: string[]
}

export const AutomodTermsUpdateEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  moderator_user_id: z.string(),
  moderator_user_login: z.string(),
  moderator_user_name: z.string(),
  action: z.enum(["add_permitted", "remove_permitted", "add_blocked", "remove_blocked"]),
  from_automod: z.boolean(),
  terms: z.array(z.string()),
})

/**
 * Channel Ad Break Begin Event
 */
export interface ChannelAdBreakBeginEvent {
  /** Length in seconds of the mid-roll ad break requested */
  duration_seconds: number
  /** The UTC timestamp of when the ad break began, in RFC3339 format */
  started_at: string
  /** Indicates if the ad was automatically scheduled via Ads Manager */
  is_automatic: boolean
  /** The broadcaster's user ID for the channel the ad was run on */
  broadcaster_user_id: string
  /** The broadcaster's user login for the channel the ad was run on */
  broadcaster_user_login: string
  /** The broadcaster's user display name for the channel the ad was run on */
  broadcaster_user_name: string
  /** The ID of the user that requested the ad */
  requester_user_id: string
  /** The login of the user that requested the ad */
  requester_user_login: string
  /** The display name of the user that requested the ad */
  requester_user_name: string
}

export const ChannelAdBreakBeginEventSchema = z.object({
  duration_seconds: z.number().int(),
  started_at: z.string(),
  is_automatic: z.boolean(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  requester_user_id: z.string(),
  requester_user_login: z.string(),
  requester_user_name: z.string(),
})

/**
 * Channel Ban Event
 */
export interface ChannelBanEvent {
  /** The user ID for the user who was banned on the specified channel */
  user_id: string
  /** The user login for the user who was banned on the specified channel */
  user_login: string
  /** The user display name for the user who was banned on the specified channel */
  user_name: string
  /** The requested broadcaster ID */
  broadcaster_user_id: string
  /** The requested broadcaster login */
  broadcaster_user_login: string
  /** The requested broadcaster display name */
  broadcaster_user_name: string
  /** The user ID of the issuer of the ban */
  moderator_user_id: string
  /** The user login of the issuer of the ban */
  moderator_user_login: string
  /** The user name of the issuer of the ban */
  moderator_user_name: string
  /** The reason behind the ban */
  reason: string
  /** The UTC date and time (in RFC3339 format) of when the user was banned or put in a timeout */
  banned_at: string
  /** The UTC date and time (in RFC3339 format) of when the timeout ends. Is null if the user was banned instead of put in a timeout */
  ends_at: string | null
  /** Indicates whether the ban is permanent (true) or a timeout (false) */
  is_permanent: boolean
}

export const ChannelBanEventSchema = z.object({
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  moderator_user_id: z.string(),
  moderator_user_login: z.string(),
  moderator_user_name: z.string(),
  reason: z.string(),
  banned_at: z.string(),
  ends_at: z.string().nullable(),
  is_permanent: z.boolean(),
})

/**
 * Bits use type
 */
export type BitsUseType = "cheer" | "power_up"

/**
 * Emote format
 */
export type EmoteFormat = "animated" | "static"

/**
 * Extended emote metadata
 */
export interface ExtendedEmoteMetadata {
  /** The ID that uniquely identifies this emote */
  id: string
  /** The ID that identifies the emote set that the emote belongs to */
  emote_set_id: string
  /** The ID of the broadcaster who owns the emote */
  owner_id: string
  /** The formats that the emote is available in */
  format: EmoteFormat[]
}

export const ExtendedEmoteMetadataSchema = z.object({
  id: z.string(),
  emote_set_id: z.string(),
  owner_id: z.string(),
  format: z.array(z.enum(["animated", "static"])),
})


/**
 * Mention metadata
 */
export interface MentionMetadata {
  /** The user ID of the mentioned user */
  user_id: string
  /** The user name of the mentioned user */
  user_name: string
  /** The user login of the mentioned user */
  user_login: string
}

export const MentionMetadataSchema = z.object({
  user_id: z.string(),
  user_name: z.string(),
  user_login: z.string(),
})

/**
 * Message fragment type for chat messages
 */
export type ChatMessageFragmentType = "text" | "cheermote" | "emote" | "mention"

/**
 * Chat message fragment
 */
export type ChatMessageFragment = {
  /** The type of message fragment */
  type: "text"
  /** Message text in fragment */
  text: string
} | {
  /** The type of message fragment */
  type: "cheermote"
  /** Message text in fragment */
  text: string
  /** Metadata pertaining to the cheermote */
  cheermote: CheermoteMetadata
} | {
  /** The type of message fragment */
  type: "emote"
  /** Message text in fragment */
  text: string
  /** Metadata pertaining to the emote */
  emote: ExtendedEmoteMetadata
} | {
  /** The type of message fragment */
  type: "mention"
  /** Message text in fragment */
  text: string
  /** Metadata pertaining to the mention */
  mention: MentionMetadata
}

export const ChatMessageFragmentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("cheermote"),
    text: z.string(),
    cheermote: CheermoteMetadataSchema,
  }),
  z.object({
    type: z.literal("emote"),
    text: z.string(),
    emote: ExtendedEmoteMetadataSchema,
  }),
  z.object({
    type: z.literal("mention"),
    text: z.string(),
    mention: MentionMetadataSchema,
  }),
])

/**
 * Chat message body
 */
export interface ChatMessageBody {
  /** The chat message in plain text */
  text: string
  /** The ordered list of chat message fragments */
  fragments: ChatMessageFragment[]
}

export const ChatMessageBodySchema = z.object({
  text: z.string(),
  fragments: z.array(ChatMessageFragmentSchema),
})

/**
 * Power-up type
 */
export type PowerUpType = "message_effect" | "celebration" | "gigantify_an_emote"

/**
 * Power-up emote
 */
export interface PowerUpEmote {
  /** The ID that uniquely identifies this emote */
  id: string
  /** The human readable emote token */
  name: string
}

export const PowerUpEmoteSchema = z.object({
  id: z.string(),
  name: z.string(),
})

/**
 * Power-up data
 */
export interface PowerUpData {
  /** Power-up type */
  type: PowerUpType
  /** Optional. Emote associated with the reward */
  emote?: PowerUpEmote | undefined
  /** Optional. The ID of the message effect */
  message_effect_id?: string | undefined
}

export const PowerUpDataSchema = z.object({
  type: z.enum(["message_effect", "celebration", "gigantify_an_emote"]),
  emote: PowerUpEmoteSchema.optional(),
  message_effect_id: z.string().optional(),
})

/**
 * Channel Bits Use Event
 */
export interface ChannelBitsUseEvent {
  /** The User ID of the channel where the Bits were redeemed */
  broadcaster_user_id: string
  /** The login of the channel where the Bits were used */
  broadcaster_user_login: string
  /** The display name of the channel where the Bits were used */
  broadcaster_user_name: string
  /** The User ID of the redeeming user */
  user_id: string
  /** The login name of the redeeming user */
  user_login: string
  /** The display name of the redeeming user */
  user_name: string
  /** The number of Bits used */
  bits: number
  /** Bits use type */
  type: BitsUseType
  /** Optional. An object that contains the user message and emote information */
  message?: ChatMessageBody | undefined
  /** Optional. Data about Power-up */
  power_up?: PowerUpData | undefined
}

export const ChannelBitsUseEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  bits: z.number().int(),
  type: z.enum(["cheer", "power_up"]),
  message: ChatMessageBodySchema.optional(),
  power_up: PowerUpDataSchema.optional(),
})

/**
 * Channel Chat Clear Event
 */
export interface ChannelChatClearEvent {
  /** The broadcaster user ID */
  broadcaster_user_id: string
  /** The broadcaster display name */
  broadcaster_user_name: string
  /** The broadcaster login */
  broadcaster_user_login: string
}

export const ChannelChatClearEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
})

/**
 * Channel Chat Clear User Messages Event
 */
export interface ChannelChatClearUserMessagesEvent {
  /** The broadcaster user ID */
  broadcaster_user_id: string
  /** The broadcaster display name */
  broadcaster_user_name: string
  /** The broadcaster login */
  broadcaster_user_login: string
  /** The ID of the user that was banned or put in a timeout */
  target_user_id: string
  /** The user name of the user that was banned or put in a timeout */
  target_user_name: string
  /** The user login of the user that was banned or put in a timeout */
  target_user_login: string
}

export const ChannelChatClearUserMessagesEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  target_user_id: z.string(),
  target_user_name: z.string(),
  target_user_login: z.string(),
})

/**
 * Channel Chat Message Event
 */
export interface ChannelChatMessageEvent {
  /** The broadcaster user ID */
  broadcaster_user_id: string
  /** The broadcaster display name */
  broadcaster_user_name: string
  /** The broadcaster login */
  broadcaster_user_login: string
  /** The user ID of the user that sent the message */
  chatter_user_id: string
  /** The user name of the user that sent the message */
  chatter_user_name: string
  /** The user login of the user that sent the message */
  chatter_user_login: string
  /** A UUID that identifies the message */
  message_id: string
  /** The structured chat message */
  message: ChatMessageBody
}

export const ChannelChatMessageEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  chatter_user_id: z.string(),
  chatter_user_name: z.string(),
  chatter_user_login: z.string(),
  message_id: z.string(),
  message: ChatMessageBodySchema,
})

/**
 * Chat message type
 */
export type ChatMessageType =
  | "text"
  | "channel_points_highlighted"
  | "channel_points_sub_only"
  | "user_intro"
  | "power_ups_message_effect"
  | "power_ups_gigantified_emote"

/**
 * Chat badge
 */
export interface ChatBadge {
  /** An ID that identifies this set of chat badges */
  set_id: string
  /** An ID that identifies this version of the badge */
  id: string
  /** Contains metadata related to the chat badges */
  info: string
}

export const ChatBadgeSchema = z.object({
  set_id: z.string(),
  id: z.string(),
  info: z.string(),
})

/**
 * Cheer metadata in chat message
 */
export interface CheerInfo {
  /** The amount of Bits the user cheered */
  bits: number
}

export const CheerInfoSchema = z.object({
  bits: z.number().int(),
})

/**
 * Reply metadata
 */
export interface ReplyMetadata {
  /** An ID that uniquely identifies the parent message that this message is replying to */
  parent_message_id: string
  /** The message body of the parent message */
  parent_message_body: string
  /** User ID of the sender of the parent message */
  parent_user_id: string
  /** User name of the sender of the parent message */
  parent_user_name: string
  /** User login of the sender of the parent message */
  parent_user_login: string
  /** An ID that identifies the parent message of the reply thread */
  thread_message_id: string
  /** User ID of the sender of the thread's parent message */
  thread_user_id: string
  /** User name of the sender of the thread's parent message */
  thread_user_name: string
  /** User login of the sender of the thread's parent message */
  thread_user_login: string
}

export const ReplyMetadataSchema = z.object({
  parent_message_id: z.string(),
  parent_message_body: z.string(),
  parent_user_id: z.string(),
  parent_user_name: z.string(),
  parent_user_login: z.string(),
  thread_message_id: z.string(),
  thread_user_id: z.string(),
  thread_user_name: z.string(),
  thread_user_login: z.string(),
})

/**
 * Extended Channel Chat Message Event (with full metadata)
 */
export interface ExtendedChannelChatMessageEvent extends ChannelChatMessageEvent {
  /** The type of message */
  message_type: ChatMessageType
  /** List of chat badges */
  badges: ChatBadge[]
  /** Optional. Metadata if this message is a cheer */
  cheer?: CheerInfo | undefined
  /** The color of the user's name in the chat room */
  color: string
  /** Optional. Metadata if this message is a reply */
  reply?: ReplyMetadata | undefined
  /** Optional. The ID of a channel points custom reward that was redeemed */
  channel_points_custom_reward_id?: string | undefined
  /** Optional. The broadcaster user ID of the channel the message was sent from */
  source_broadcaster_user_id?: string | undefined
  /** Optional. The user name of the broadcaster of the channel the message was sent from */
  source_broadcaster_user_name?: string | undefined
  /** Optional. The login of the broadcaster of the channel the message was sent from */
  source_broadcaster_user_login?: string | undefined
  /** Optional. The UUID that identifies the source message */
  source_message_id?: string | undefined
  /** Optional. The list of chat badges for the chatter in the channel the message was sent from */
  source_badges?: ChatBadge[] | undefined
  /** Optional. Determines if a message delivered during a shared chat session is only sent to the source channel */
  is_source_only?: boolean | undefined
}

export const ExtendedChannelChatMessageEventSchema = ChannelChatMessageEventSchema.extend({
  message_type: z.enum(["text", "channel_points_highlighted", "channel_points_sub_only", "user_intro", "power_ups_message_effect", "power_ups_gigantified_emote"]),
  badges: z.array(ChatBadgeSchema),
  cheer: CheerInfoSchema.optional(),
  color: z.string(),
  reply: ReplyMetadataSchema.optional(),
  channel_points_custom_reward_id: z.string().optional(),
  source_broadcaster_user_id: z.string().optional(),
  source_broadcaster_user_name: z.string().optional(),
  source_broadcaster_user_login: z.string().optional(),
  source_message_id: z.string().optional(),
  source_badges: z.array(ChatBadgeSchema).optional(),
  is_source_only: z.boolean().optional(),
})

/**
 * Channel Chat Message Delete Event
 */
export interface ChannelChatMessageDeleteEvent {
  /** The broadcaster user ID */
  broadcaster_user_id: string
  /** The broadcaster display name */
  broadcaster_user_name: string
  /** The broadcaster login */
  broadcaster_user_login: string
  /** The ID of the user whose message was deleted */
  target_user_id: string
  /** The user name of the user whose message was deleted */
  target_user_name: string
  /** The user login of the user whose message was deleted */
  target_user_login: string
  /** A UUID that identifies the message that was removed */
  message_id: string
}

export const ChannelChatMessageDeleteEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  target_user_id: z.string(),
  target_user_name: z.string(),
  target_user_login: z.string(),
  message_id: z.string(),
})

/**
 * Chat notification type
 */
export type ChatNotificationType =
  | "sub"
  | "resub"
  | "sub_gift"
  | "community_sub_gift"
  | "gift_paid_upgrade"
  | "prime_paid_upgrade"
  | "raid"
  | "unraid"
  | "pay_it_forward"
  | "announcement"
  | "bits_badge_tier"
  | "charity_donation"
  | "shared_chat_sub"
  | "shared_chat_resub"
  | "shared_chat_sub_gift"
  | "shared_chat_community_sub_gift"
  | "shared_chat_gift_paid_upgrade"
  | "shared_chat_prime_paid_upgrade"
  | "shared_chat_raid"
  | "shared_chat_pay_it_forward"
  | "shared_chat_announcement"

/**
 * Subscription tier
 */
export type SubscriptionTier = "1000" | "2000" | "3000"

/**
 * Sub notification info
 */
export interface SubNotificationInfo {
  /** The type of subscription plan being used */
  sub_tier: SubscriptionTier
  /** Indicates if the subscription was obtained through Amazon Prime */
  is_prime: boolean
  /** The number of months the subscription is for */
  duration_months: number
}

export const SubNotificationInfoSchema = z.object({
  sub_tier: z.enum(["1000", "2000", "3000"]),
  is_prime: z.boolean(),
  duration_months: z.number().int(),
})

/**
 * Resub notification info
 */
export interface ResubNotificationInfo {
  /** Cumulative months */
  cumulative_months: number
  /** Duration of months */
  duration_months: number
  /** Streak months (may be null) */
  streak_months: number | null
  /** Subscription tier */
  sub_tier: SubscriptionTier
  /** Is Prime subscription */
  is_prime: boolean
  /** Is gift */
  is_gift: boolean
  /** Gifter user ID (if gifted) */
  gifter_user_id?: string | undefined
  /** Gifter user name (if gifted) */
  gifter_user_name?: string | undefined
  /** Gifter user login (if gifted) */
  gifter_user_login?: string | undefined
  /** Gifter is anonymous */
  gifter_is_anonymous?: boolean | undefined
}

export const ResubNotificationInfoSchema = z.object({
  cumulative_months: z.number().int(),
  duration_months: z.number().int(),
  streak_months: z.number().int().nullable(),
  sub_tier: z.enum(["1000", "2000", "3000"]),
  is_prime: z.boolean(),
  is_gift: z.boolean(),
  gifter_user_id: z.string().optional(),
  gifter_user_name: z.string().optional(),
  gifter_user_login: z.string().optional(),
  gifter_is_anonymous: z.boolean().optional(),
})

/**
 * Sub gift notification info
 */
export interface SubGiftNotificationInfo {
  /** The number of months the subscription is for */
  duration_months: number
  /** The amount of gifts the gifter has given in this channel (null if anonymous) */
  cumulative_total?: number | undefined
  /** The user ID of the subscription gift recipient */
  recipient_user_id: string
  /** The user name of the subscription gift recipient */
  recipient_user_name: string
  /** The user login of the subscription gift recipient */
  recipient_user_login: string
  /** Subscription tier */
  sub_tier: SubscriptionTier
  /** The ID of the associated community gift (null if not associated) */
  community_gift_id?: string | undefined
}

export const SubGiftNotificationInfoSchema = z.object({
  duration_months: z.number().int(),
  cumulative_total: z.number().int().optional(),
  recipient_user_id: z.string(),
  recipient_user_name: z.string(),
  recipient_user_login: z.string(),
  sub_tier: z.enum(["1000", "2000", "3000"]),
  community_gift_id: z.string().optional(),
})

/**
 * Community sub gift notification info
 */
export interface CommunitySubGiftNotificationInfo {
  /** The ID of the associated community gift */
  id: string
  /** Number of subscriptions being gifted */
  total: number
  /** Subscription tier */
  sub_tier: SubscriptionTier
  /** The amount of gifts the gifter has given in this channel (null if anonymous) */
  cumulative_total?: number | undefined
}

export const CommunitySubGiftNotificationInfoSchema = z.object({
  id: z.string(),
  total: z.number().int(),
  sub_tier: z.enum(["1000", "2000", "3000"]),
  cumulative_total: z.number().int().optional(),
})

/**
 * Gift paid upgrade notification info
 */
export interface GiftPaidUpgradeNotificationInfo {
  /** Whether the gift was given anonymously */
  gifter_is_anonymous: boolean
  /** The user ID of the user who gifted the subscription (null if anonymous) */
  gifter_user_id?: string | undefined
  /** The user name of the user who gifted the subscription (null if anonymous) */
  gifter_user_name?: string | undefined
}

export const GiftPaidUpgradeNotificationInfoSchema = z.object({
  gifter_is_anonymous: z.boolean(),
  gifter_user_id: z.string().optional(),
  gifter_user_name: z.string().optional(),
})

/**
 * Prime paid upgrade notification info
 */
export interface PrimePaidUpgradeNotificationInfo {
  /** Subscription tier */
  sub_tier: SubscriptionTier
}

export const PrimePaidUpgradeNotificationInfoSchema = z.object({
  sub_tier: z.enum(["1000", "2000", "3000"]),
})

/**
 * Pay it forward notification info
 */
export interface PayItForwardNotificationInfo {
  /** Whether the gift was given anonymously */
  gifter_is_anonymous: boolean
  /** The user ID of the user who gifted the subscription (null if anonymous) */
  gifter_user_id?: string | undefined
  /** The user name of the user who gifted the subscription (null if anonymous) */
  gifter_user_name?: string | undefined
  /** The user login of the user who gifted the subscription (null if anonymous) */
  gifter_user_login?: string | undefined
}

export const PayItForwardNotificationInfoSchema = z.object({
  gifter_is_anonymous: z.boolean(),
  gifter_user_id: z.string().optional(),
  gifter_user_name: z.string().optional(),
  gifter_user_login: z.string().optional(),
})

/**
 * Raid notification info
 */
export interface RaidNotificationInfo {
  /** The user ID of the broadcaster raiding this channel */
  user_id: string
  /** The user name of the broadcaster raiding this channel */
  user_name: string
  /** The login name of the broadcaster raiding this channel */
  user_login: string
  /** The number of viewers raiding this channel from the broadcaster's channel */
  viewer_count: number
  /** Profile image URL of the broadcaster raiding this channel */
  profile_image_url: string
}

export const RaidNotificationInfoSchema = z.object({
  user_id: z.string(),
  user_name: z.string(),
  user_login: z.string(),
  viewer_count: z.number().int(),
  profile_image_url: z.string(),
})

/**
 * Unraid notification info (empty object)
 */
export interface UnraidNotificationInfo { }

export const UnraidNotificationInfoSchema = z.object({})

/**
 * Announcement notification info
 */
export interface AnnouncementNotificationInfo {
  /** Color of the announcement */
  color: string
}

export const AnnouncementNotificationInfoSchema = z.object({
  color: z.string(),
})

/**
 * Bits badge tier notification info
 */
export interface BitsBadgeTierNotificationInfo {
  /** The tier of the Bits badge the user just earned (e.g., 100, 1000, 10000) */
  tier: number
}

export const BitsBadgeTierNotificationInfoSchema = z.object({
  tier: z.number().int(),
})

/**
 * Charity donation amount
 */
export interface CharityAmount {
  /** The monetary amount in the currency's minor unit */
  value: number
  /** The number of decimal places used by the currency */
  decimal_place: number
  /** The ISO-4217 three-letter currency code */
  currency: string
}

export const CharityAmountSchema = z.object({
  value: z.number().int(),
  decimal_place: z.number().int(),
  currency: z.string(),
})

/**
 * Charity donation notification info
 */
export interface CharityDonationNotificationInfo {
  /** Name of the charity */
  charity_name: string
  /** An object that contains the amount of money that the user paid */
  amount: CharityAmount
}

export const CharityDonationNotificationInfoSchema = z.object({
  charity_name: z.string(),
  amount: CharityAmountSchema,
})

interface BaseChannelChatNotificationEvent {
  /** The broadcaster user ID */
  broadcaster_user_id: string
  /** The broadcaster display name */
  broadcaster_user_name: string
  /** The broadcaster login */
  broadcaster_user_login: string
  /** The user ID of the user that sent the message */
  chatter_user_id: string
  /** The user login of the user that sent the message */
  chatter_user_name: string
  /** Whether or not the chatter is anonymous */
  chatter_is_anonymous: boolean
  /** The color of the user's name in the chat room */
  color: string
  /** List of chat badges */
  badges: ChatBadge[]
  /** The message Twitch shows in the chat room for this notice */
  system_message: string
  /** A UUID that identifies the message */
  message_id: string
  /** The structured chat message */
  message: ChatMessageBody
  /** The broadcaster user ID of the channel the message was sent from (shared chat) */
  source_broadcaster_user_id?: string | undefined
  /** The user name of the broadcaster of the channel the message was sent from (shared chat) */
  source_broadcaster_user_name?: string | undefined
  /** The login of the broadcaster of the channel the message was sent from (shared chat) */
  source_broadcaster_user_login?: string | undefined
  /** The UUID that identifies the source message from the channel (shared chat) */
  source_message_id?: string | undefined
  /** The list of chat badges for the chatter in the channel the message was sent from (shared chat) */
  source_badges?: ChatBadge[] | undefined
  /** Information about the sub event. Null if notice_type is not sub. */
  sub: SubNotificationInfo | null
  /** Information about the resub event. Null if notice_type is not resub. */
  resub: ResubNotificationInfo | null
  /** Information about the sub gift event. Null if notice_type is not sub_gift. */
  sub_gift: SubGiftNotificationInfo | null
  /** Information about the community sub gift event. Null if notice_type is not community_sub_gift. */
  community_sub_gift: CommunitySubGiftNotificationInfo | null
  /** Information about the gift paid upgrade event. Null if notice_type is not gift_paid_upgrade. */
  gift_paid_upgrade: GiftPaidUpgradeNotificationInfo | null
  /** Information about the prime paid upgrade event. Null if notice_type is not prime_paid_upgrade. */
  prime_paid_upgrade: PrimePaidUpgradeNotificationInfo | null
  /** Information about the raid event. Null if notice_type is not raid. */
  raid: RaidNotificationInfo | null
  /** Information about the unraid event. Null if notice_type is not unraid. */
  unraid: UnraidNotificationInfo | null
  /** Information about the pay it forward event. Null if notice_type is not pay_it_forward. */
  pay_it_forward: PayItForwardNotificationInfo | null
  /** Information about the announcement event. Null if notice_type is not announcement. */
  announcement: AnnouncementNotificationInfo | null
  /** Information about the bits badge tier event. Null if notice_type is not bits_badge_tier. */
  bits_badge_tier: BitsBadgeTierNotificationInfo | null
  /** Information about the charity donation event. Null if notice_type is not charity_donation. */
  charity_donation: CharityDonationNotificationInfo | null
  /** Information about the shared chat sub event. Null if notice_type is not shared_chat_sub. */
  shared_chat_sub: SubNotificationInfo | null
  /** Information about the shared chat resub event. Null if notice_type is not shared_chat_resub. */
  shared_chat_resub: ResubNotificationInfo | null
  /** Information about the shared chat sub gift event. Null if notice_type is not shared_chat_sub_gift. */
  shared_chat_sub_gift: SubGiftNotificationInfo | null
  /** Information about the shared chat community sub gift event. Null if notice_type is not shared_chat_community_sub_gift. */
  shared_chat_community_sub_gift: CommunitySubGiftNotificationInfo | null
  /** Information about the shared chat gift paid upgrade event. Null if notice_type is not shared_chat_gift_paid_upgrade. */
  shared_chat_gift_paid_upgrade: GiftPaidUpgradeNotificationInfo | null
  /** Information about the shared chat prime paid upgrade event. Null if notice_type is not shared_chat_prime_paid_upgrade. */
  shared_chat_prime_paid_upgrade: PrimePaidUpgradeNotificationInfo | null
  /** Information about the shared chat raid event. Null if notice_type is not shared_chat_raid. */
  shared_chat_raid: RaidNotificationInfo | null
  /** Information about the shared chat pay it forward event. Null if notice_type is not shared_chat_pay_it_forward. */
  shared_chat_pay_it_forward: PayItForwardNotificationInfo | null
  /** Information about the shared chat announcement event. Null if notice_type is not shared_chat_announcement. */
  shared_chat_announcement: AnnouncementNotificationInfo | null
}

/**
 * Channel Chat Notification Event
 */
export type ChannelChatNotificationEvent = BaseChannelChatNotificationEvent & (
  | ({ notice_type: "sub", sub: SubNotificationInfo })
  | ({ notice_type: "resub", resub: ResubNotificationInfo })
  | ({ notice_type: "sub_gift", sub_gift: SubGiftNotificationInfo })
  | ({ notice_type: "community_sub_gift", community_sub_gift: CommunitySubGiftNotificationInfo })
  | ({ notice_type: "gift_paid_upgrade", gift_paid_upgrade: GiftPaidUpgradeNotificationInfo })
  | ({ notice_type: "prime_paid_upgrade", prime_paid_upgrade: PrimePaidUpgradeNotificationInfo })
  | ({ notice_type: "raid", raid: RaidNotificationInfo })
  | ({ notice_type: "unraid", unraid: UnraidNotificationInfo })
  | ({ notice_type: "pay_it_forward", pay_it_forward: PayItForwardNotificationInfo })
  | ({ notice_type: "announcement", announcement: AnnouncementNotificationInfo })
  | ({ notice_type: "bits_badge_tier", bits_badge_tier: BitsBadgeTierNotificationInfo })
  | ({ notice_type: "charity_donation", charity_donation: CharityDonationNotificationInfo })
  | ({ notice_type: "shared_chat_sub", shared_chat_sub: SubNotificationInfo })
  | ({ notice_type: "shared_chat_resub", shared_chat_resub: ResubNotificationInfo })
  | ({ notice_type: "shared_chat_sub_gift", shared_chat_sub_gift: SubGiftNotificationInfo })
  | ({ notice_type: "shared_chat_community_sub_gift", shared_chat_community_sub_gift: CommunitySubGiftNotificationInfo })
  | ({ notice_type: "shared_chat_gift_paid_upgrade", shared_chat_gift_paid_upgrade: GiftPaidUpgradeNotificationInfo })
  | ({ notice_type: "shared_chat_prime_paid_upgrade", shared_chat_prime_paid_upgrade: PrimePaidUpgradeNotificationInfo })
  | ({ notice_type: "shared_chat_raid", shared_chat_raid: RaidNotificationInfo })
  | ({ notice_type: "shared_chat_pay_it_forward", shared_chat_pay_it_forward: PayItForwardNotificationInfo })
  | ({ notice_type: "shared_chat_announcement", shared_chat_announcement: AnnouncementNotificationInfo })
)

const BaseChannelChatNotificationEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  chatter_user_id: z.string(),
  chatter_user_name: z.string(),
  chatter_is_anonymous: z.boolean(),
  color: z.string(),
  badges: z.array(ChatBadgeSchema),
  system_message: z.string(),
  message_id: z.string(),
  message: ChatMessageBodySchema,
  source_broadcaster_user_id: z.string().optional(),
  source_broadcaster_user_name: z.string().optional(),
  source_broadcaster_user_login: z.string().optional(),
  source_message_id: z.string().optional(),
  source_badges: z.array(ChatBadgeSchema).optional(),
})

const allNotificationFieldsNullSchema = {
  sub: z.null(),
  resub: z.null(),
  sub_gift: z.null(),
  community_sub_gift: z.null(),
  gift_paid_upgrade: z.null(),
  prime_paid_upgrade: z.null(),
  raid: z.null(),
  unraid: z.null(),
  pay_it_forward: z.null(),
  announcement: z.null(),
  bits_badge_tier: z.null(),
  charity_donation: z.null(),
  shared_chat_sub: z.null(),
  shared_chat_resub: z.null(),
  shared_chat_sub_gift: z.null(),
  shared_chat_community_sub_gift: z.null(),
  shared_chat_gift_paid_upgrade: z.null(),
  shared_chat_prime_paid_upgrade: z.null(),
  shared_chat_raid: z.null(),
  shared_chat_pay_it_forward: z.null(),
  shared_chat_announcement: z.null(),
}

export const ChannelChatNotificationEventSchema = BaseChannelChatNotificationEventSchema.and(
  z.discriminatedUnion("notice_type", [
    z.object({ notice_type: z.literal("sub"), ...allNotificationFieldsNullSchema, sub: SubNotificationInfoSchema }),
    z.object({ notice_type: z.literal("resub"), ...allNotificationFieldsNullSchema, resub: ResubNotificationInfoSchema }),
    z.object({ notice_type: z.literal("sub_gift"), ...allNotificationFieldsNullSchema, sub_gift: SubGiftNotificationInfoSchema }),
    z.object({ notice_type: z.literal("community_sub_gift"), ...allNotificationFieldsNullSchema, community_sub_gift: CommunitySubGiftNotificationInfoSchema }),
    z.object({ notice_type: z.literal("gift_paid_upgrade"), ...allNotificationFieldsNullSchema, gift_paid_upgrade: GiftPaidUpgradeNotificationInfoSchema }),
    z.object({ notice_type: z.literal("prime_paid_upgrade"), ...allNotificationFieldsNullSchema, prime_paid_upgrade: PrimePaidUpgradeNotificationInfoSchema }),
    z.object({ notice_type: z.literal("raid"), ...allNotificationFieldsNullSchema, raid: RaidNotificationInfoSchema }),
    z.object({ notice_type: z.literal("unraid"), ...allNotificationFieldsNullSchema, unraid: UnraidNotificationInfoSchema }),
    z.object({ notice_type: z.literal("pay_it_forward"), ...allNotificationFieldsNullSchema, pay_it_forward: PayItForwardNotificationInfoSchema }),
    z.object({ notice_type: z.literal("announcement"), ...allNotificationFieldsNullSchema, announcement: AnnouncementNotificationInfoSchema }),
    z.object({ notice_type: z.literal("bits_badge_tier"), ...allNotificationFieldsNullSchema, bits_badge_tier: BitsBadgeTierNotificationInfoSchema }),
    z.object({ notice_type: z.literal("charity_donation"), ...allNotificationFieldsNullSchema, charity_donation: CharityDonationNotificationInfoSchema }),
    z.object({ notice_type: z.literal("shared_chat_sub"), ...allNotificationFieldsNullSchema, shared_chat_sub: SubNotificationInfoSchema }),
    z.object({ notice_type: z.literal("shared_chat_resub"), ...allNotificationFieldsNullSchema, shared_chat_resub: ResubNotificationInfoSchema }),
    z.object({ notice_type: z.literal("shared_chat_sub_gift"), ...allNotificationFieldsNullSchema, shared_chat_sub_gift: SubGiftNotificationInfoSchema }),
    z.object({ notice_type: z.literal("shared_chat_community_sub_gift"), ...allNotificationFieldsNullSchema, shared_chat_community_sub_gift: CommunitySubGiftNotificationInfoSchema }),
    z.object({ notice_type: z.literal("shared_chat_gift_paid_upgrade"), ...allNotificationFieldsNullSchema, shared_chat_gift_paid_upgrade: GiftPaidUpgradeNotificationInfoSchema }),
    z.object({ notice_type: z.literal("shared_chat_prime_paid_upgrade"), ...allNotificationFieldsNullSchema, shared_chat_prime_paid_upgrade: PrimePaidUpgradeNotificationInfoSchema }),
    z.object({ notice_type: z.literal("shared_chat_raid"), ...allNotificationFieldsNullSchema, shared_chat_raid: RaidNotificationInfoSchema }),
    z.object({ notice_type: z.literal("shared_chat_pay_it_forward"), ...allNotificationFieldsNullSchema, shared_chat_pay_it_forward: PayItForwardNotificationInfoSchema }),
    z.object({ notice_type: z.literal("shared_chat_announcement"), ...allNotificationFieldsNullSchema, shared_chat_announcement: AnnouncementNotificationInfoSchema }),
  ])
)

/**
 * Channel Chat Settings Update Event
 */
export interface ChannelChatSettingsUpdateEvent {
  /** The ID of the broadcaster specified in the request */
  broadcaster_user_id: string
  /** The login of the broadcaster specified in the request */
  broadcaster_user_login: string
  /** The user name of the broadcaster specified in the request */
  broadcaster_user_name: string
  /** A Boolean value that determines whether chat messages must contain only emotes */
  emote_mode: boolean
  /** A Boolean value that determines whether the broadcaster restricts the chat room to followers only */
  follower_mode: boolean
  /** The length of time, in minutes, that the followers must have followed the broadcaster to participate in the chat room */
  follower_mode_duration_minutes: number | null
  /** A Boolean value that determines whether the broadcaster limits how often users in the chat room are allowed to send messages */
  slow_mode: boolean
  /** The amount of time, in seconds, that users need to wait between sending messages */
  slow_mode_wait_time_seconds: number | null
  /** A Boolean value that determines whether only users that subscribe to the broadcaster's channel can talk in the chat room */
  subscriber_mode: boolean
  /** A Boolean value that determines whether the broadcaster requires users to post only unique messages in the chat room */
  unique_chat_mode: boolean
}

export const ChannelChatSettingsUpdateEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  emote_mode: z.boolean(),
  follower_mode: z.boolean(),
  follower_mode_duration_minutes: z.number().int().nullable(),
  slow_mode: z.boolean(),
  slow_mode_wait_time_seconds: z.number().int().nullable(),
  subscriber_mode: z.boolean(),
  unique_chat_mode: z.boolean(),
})

/**
 * Channel Chat User Message Hold Event
 */
export interface ChannelChatUserMessageHoldEvent {
  /** The ID of the broadcaster specified in the request */
  broadcaster_user_id: string
  /** The login of the broadcaster specified in the request */
  broadcaster_user_login: string
  /** The user name of the broadcaster specified in the request */
  broadcaster_user_name: string
  /** The User ID of the message sender */
  user_id: string
  /** The message sender's login */
  user_login: string
  /** The message sender's display name */
  user_name: string
  /** The ID of the message that was flagged by automod */
  message_id: string
  /** The body of the message */
  message: MessageBody
}

export const ChannelChatUserMessageHoldEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  message_id: z.string(),
  message: MessageBodySchema,
})

/**
 * Chat user message status
 */
export type ChatUserMessageStatus = "approved" | "denied" | "invalid"

/**
 * Channel Chat User Message Update Event
 */
export interface ChannelChatUserMessageUpdateEvent {
  /** The ID of the broadcaster specified in the request */
  broadcaster_user_id: string
  /** The login of the broadcaster specified in the request */
  broadcaster_user_login: string
  /** The user name of the broadcaster specified in the request */
  broadcaster_user_name: string
  /** The User ID of the message sender */
  user_id: string
  /** The message sender's login */
  user_login: string
  /** The message sender's user name */
  user_name: string
  /** The message's status */
  status: ChatUserMessageStatus
  /** The ID of the message that was flagged by automod */
  message_id: string
  /** The body of the message */
  message: MessageBody
}

export const ChannelChatUserMessageUpdateEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  status: z.enum(["approved", "denied", "invalid"]),
  message_id: z.string(),
  message: MessageBodySchema,
})

/**
 * Channel Subscribe Event
 */
export interface ChannelSubscribeEvent {
  /** The user ID for the user who subscribed */
  user_id: string
  /** The user login for the user who subscribed */
  user_login: string
  /** The user display name for the user who subscribed */
  user_name: string
  /** The broadcaster user ID */
  broadcaster_user_id: string
  /** The broadcaster login */
  broadcaster_user_login: string
  /** The broadcaster display name */
  broadcaster_user_name: string
  /** The tier of the subscription */
  tier: SubscriptionTier
  /** Whether the subscription is a gift */
  is_gift: boolean
}

export const ChannelSubscribeEventSchema = z.object({
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  tier: z.enum(["1000", "2000", "3000"]),
  is_gift: z.boolean(),
})

/**
 * Channel Subscription End Event
 */
export interface ChannelSubscriptionEndEvent {
  /** The user ID for the user whose subscription ended */
  user_id: string
  /** The user login for the user whose subscription ended */
  user_login: string
  /** The user display name for the user whose subscription ended */
  user_name: string
  /** The broadcaster user ID */
  broadcaster_user_id: string
  /** The broadcaster login */
  broadcaster_user_login: string
  /** The broadcaster display name */
  broadcaster_user_name: string
  /** The tier of the subscription that ended */
  tier: SubscriptionTier
  /** Whether the subscription was a gift */
  is_gift: boolean
}

export const ChannelSubscriptionEndEventSchema = z.object({
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  tier: z.enum(["1000", "2000", "3000"]),
  is_gift: z.boolean(),
})

/**
 * Channel Subscription Gift Event
 */
export interface ChannelSubscriptionGiftEvent {
  /** The user ID of the user who sent the subscription gift. Set to null if it was an anonymous subscription gift */
  user_id: string | null
  /** The user login of the user who sent the gift. Set to null if it was an anonymous subscription gift */
  user_login: string | null
  /** The user display name of the user who sent the gift. Set to null if it was an anonymous subscription gift */
  user_name: string | null
  /** The broadcaster user ID */
  broadcaster_user_id: string
  /** The broadcaster login */
  broadcaster_user_login: string
  /** The broadcaster display name */
  broadcaster_user_name: string
  /** The number of subscriptions in the subscription gift */
  total: number
  /** The tier of subscriptions in the subscription gift */
  tier: SubscriptionTier
  /** The number of subscriptions gifted by this user in the channel. This value is null for anonymous gifts or if the gifter has opted out of sharing this information */
  cumulative_total: number | null
  /** Whether the subscription gift was anonymous */
  is_anonymous: boolean
}

export const ChannelSubscriptionGiftEventSchema = z.object({
  user_id: z.string().nullable(),
  user_login: z.string().nullable(),
  user_name: z.string().nullable(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  total: z.number().int(),
  tier: z.enum(["1000", "2000", "3000"]),
  cumulative_total: z.number().int().nullable(),
  is_anonymous: z.boolean(),
})

/**
 * Channel Subscription Message Event
 */
export interface ChannelSubscriptionMessageEvent {
  /** The user ID of the user who sent a resubscription chat message */
  user_id: string
  /** The user login of the user who sent a resubscription chat message */
  user_login: string
  /** The user display name of the user who sent a resubscription chat message */
  user_name: string
  /** The broadcaster user ID */
  broadcaster_user_id: string
  /** The broadcaster login */
  broadcaster_user_login: string
  /** The broadcaster display name */
  broadcaster_user_name: string
  /** The tier of the user's subscription */
  tier: SubscriptionTier
  /** The message sent by the user */
  message: ChatMessageBody
  /** The total number of months the user has subscribed */
  cumulative_months: number
  /** The number of consecutive months the user's current subscription has been active */
  streak_months: number | null
  /** The month duration of the subscription */
  duration_months: number
}

export const ChannelSubscriptionMessageEventSchema = z.object({
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  tier: z.enum(["1000", "2000", "3000"]),
  message: ChatMessageBodySchema,
  cumulative_months: z.number().int(),
  streak_months: z.number().int().nullable(),
  duration_months: z.number().int(),
})

/**
 * Channel Cheer Event
 */
export interface ChannelCheerEvent {
  /** Whether the user cheered anonymously or not */
  is_anonymous: boolean
  /** The user ID for the user who cheered on the specified channel. This is null if is_anonymous is true */
  user_id: string | null
  /** The user login for the user who cheered on the specified channel. This is null if is_anonymous is true */
  user_login: string | null
  /** The user display name for the user who cheered on the specified channel. This is null if is_anonymous is true */
  user_name: string | null
  /** The requested broadcaster ID */
  broadcaster_user_id: string
  /** The requested broadcaster login */
  broadcaster_user_login: string
  /** The requested broadcaster display name */
  broadcaster_user_name: string
  /** The message sent with the cheer */
  message: string
  /** The number of bits cheered */
  bits: number
}

export const ChannelCheerEventSchema = z.object({
  is_anonymous: z.boolean(),
  user_id: z.string().nullable(),
  user_login: z.string().nullable(),
  user_name: z.string().nullable(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  message: z.string(),
  bits: z.number().int(),
})

/**
 * Channel Update Event
 */
export interface ChannelUpdateEvent {
  /** The broadcaster's user ID */
  broadcaster_user_id: string
  /** The broadcaster's user login */
  broadcaster_user_login: string
  /** The broadcaster's user display name */
  broadcaster_user_name: string
  /** The channel's stream title */
  title: string
  /** The channel's broadcast language */
  language: string
  /** The channel's category ID */
  category_id: string
  /** The category name */
  category_name: string
  /** A boolean identifying whether the channel is flagged as mature. Valid values are true and false */
  is_mature: boolean
}

export const ChannelUpdateEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  title: z.string(),
  language: z.string(),
  category_id: z.string(),
  category_name: z.string(),
  is_mature: z.boolean(),
})

/**
 * Channel Follow Event
 */
export interface ChannelFollowEvent {
  /** The user ID for the user now following the specified channel */
  user_id: string
  /** The user login for the user now following the specified channel */
  user_login: string
  /** The user display name for the user now following the specified channel */
  user_name: string
  /** The requested broadcaster ID */
  broadcaster_user_id: string
  /** The requested broadcaster login */
  broadcaster_user_login: string
  /** The requested broadcaster display name */
  broadcaster_user_name: string
  /** RFC3339 timestamp of when the follow occurred */
  followed_at: string
}

export const ChannelFollowEventSchema = z.object({
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  followed_at: z.string(),
})

/**
 * Channel Unban Event
 */
export interface ChannelUnbanEvent {
  /** The user ID for the user who was unbanned on the specified channel */
  user_id: string
  /** The user login for the user who was unbanned on the specified channel */
  user_login: string
  /** The user display name for the user who was unbanned on the specified channel */
  user_name: string
  /** The requested broadcaster ID */
  broadcaster_user_id: string
  /** The requested broadcaster login */
  broadcaster_user_login: string
  /** The requested broadcaster display name */
  broadcaster_user_name: string
  /** The user ID of the issuer of the unban */
  moderator_user_id: string
  /** The user login of the issuer of the unban */
  moderator_user_login: string
  /** The user name of the issuer of the unban */
  moderator_user_name: string
}

export const ChannelUnbanEventSchema = z.object({
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  moderator_user_id: z.string(),
  moderator_user_login: z.string(),
  moderator_user_name: z.string(),
})

/**
 * Unban request status
 */
export type UnbanRequestStatus = "approved" | "canceled" | "denied"

/**
 * Channel Unban Request Create Event
 */
export interface ChannelUnbanRequestCreateEvent {
  /** The ID of the unban request */
  id: string
  /** The broadcaster's user ID for the channel the unban request was created for */
  broadcaster_user_id: string
  /** The broadcaster's login name */
  broadcaster_user_login: string
  /** The broadcaster's display name */
  broadcaster_user_name: string
  /** User ID of user that requested to be unbanned */
  user_id: string
  /** The user's login name */
  user_login: string
  /** The user's display name */
  user_name: string
  /** Message sent in the unban request */
  text: string
  /** The UTC timestamp (in RFC3339 format) of when the unban request was created */
  created_at: string
}

export const ChannelUnbanRequestCreateEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  text: z.string(),
  created_at: z.string(),
})

/**
 * Channel Unban Request Resolve Event
 */
export interface ChannelUnbanRequestResolveEvent {
  /** The ID of the unban request */
  id: string
  /** The broadcaster's user ID for the channel the unban request was updated for */
  broadcaster_user_id: string
  /** The broadcaster's login name */
  broadcaster_user_login: string
  /** The broadcaster's display name */
  broadcaster_user_name: string
  /** Optional. User ID of moderator who approved/denied the request */
  moderator_id?: string | undefined
  /** Optional. The moderator's login name */
  moderator_login?: string | undefined
  /** Optional. The moderator's display name */
  moderator_name?: string | undefined
  /** User ID of user that requested to be unbanned */
  user_id: string
  /** The user's login name */
  user_login: string
  /** The user's display name */
  user_name: string
  /** Optional. Resolution text supplied by the mod/broadcaster upon approval/denial of the request */
  resolution_text?: string | undefined
  /** Dictates whether the unban request was approved or denied */
  status: UnbanRequestStatus
}

export const ChannelUnbanRequestResolveEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  moderator_id: z.string().optional(),
  moderator_login: z.string().optional(),
  moderator_name: z.string().optional(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  resolution_text: z.string().optional(),
  status: z.enum(["approved", "canceled", "denied"]),
})

/**
 * Channel Raid Event
 */
export interface ChannelRaidEvent {
  /** The broadcaster ID that created the raid */
  from_broadcaster_user_id: string
  /** The broadcaster login that created the raid */
  from_broadcaster_user_login: string
  /** The broadcaster display name that created the raid */
  from_broadcaster_user_name: string
  /** The broadcaster ID that received the raid */
  to_broadcaster_user_id: string
  /** The broadcaster login that received the raid */
  to_broadcaster_user_login: string
  /** The broadcaster display name that received the raid */
  to_broadcaster_user_name: string
  /** The number of viewers in the raid */
  viewers: number
}

export const ChannelRaidEventSchema = z.object({
  from_broadcaster_user_id: z.string(),
  from_broadcaster_user_login: z.string(),
  from_broadcaster_user_name: z.string(),
  to_broadcaster_user_id: z.string(),
  to_broadcaster_user_login: z.string(),
  to_broadcaster_user_name: z.string(),
  viewers: z.number().int(),
})

/**
 * Moderate action type
 */
export type ModerateActionType =
  | "ban"
  | "timeout"
  | "unban"
  | "untimeout"
  | "clear"
  | "emoteonly"
  | "emoteonlyoff"
  | "followers"
  | "followersoff"
  | "uniquechat"
  | "uniquechatoff"
  | "slow"
  | "slowoff"
  | "subscribers"
  | "subscribersoff"
  | "unraid"
  | "delete"
  | "unvip"
  | "vip"
  | "raid"
  | "add_blocked_term"
  | "add_permitted_term"
  | "remove_blocked_term"
  | "remove_permitted_term"
  | "mod"
  | "unmod"
  | "approve_unban_request"
  | "deny_unban_request"
  | "shared_chat_ban"
  | "shared_chat_timeout"
  | "shared_chat_untimeout"
  | "shared_chat_unban"
  | "shared_chat_delete"

/**
 * User info in moderate actions
 */
export interface ModerateUserInfo {
  /** User ID */
  user_id: string
  /** User login */
  user_login: string
  /** User name */
  user_name: string
}

export const ModerateUserInfoSchema = z.object({
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
})

/**
 * Followers command metadata
 */
export interface FollowersMetadata {
  /** The length of time, in minutes, that the followers must have followed the broadcaster to participate in the chat room */
  follow_duration_minutes: number
}

export const FollowersMetadataSchema = z.object({
  follow_duration_minutes: z.number().int(),
})

/**
 * Slow command metadata
 */
export interface SlowMetadata {
  /** The amount of time, in seconds, that users need to wait between sending messages */
  wait_time_seconds: number
}

export const SlowMetadataSchema = z.object({
  wait_time_seconds: z.number().int(),
})

/**
 * Ban command metadata
 */
export interface BanMetadata extends ModerateUserInfo {
  /** Optional. Reason given for the ban */
  reason?: string | undefined
}

export const BanMetadataSchema = ModerateUserInfoSchema.extend({
  reason: z.string().optional(),
})

/**
 * Timeout command metadata
 */
export interface TimeoutMetadata extends ModerateUserInfo {
  /** Optional. The reason given for the timeout */
  reason?: string | undefined
  /** The time at which the timeout ends */
  expires_at: string
}

export const TimeoutMetadataSchema = ModerateUserInfoSchema.extend({
  reason: z.string().optional(),
  expires_at: z.string(),
})

/**
 * Raid command metadata
 */
export interface RaidMetadata extends ModerateUserInfo {
  /** The viewer count */
  viewer_count: number
}

export const RaidMetadataSchema = ModerateUserInfoSchema.extend({
  viewer_count: z.number().int(),
})

/**
 * Delete command metadata
 */
export interface DeleteMetadata extends ModerateUserInfo {
  /** The ID of the message being deleted */
  message_id: string
  /** The message body of the message being deleted */
  message_body: string
}

export const DeleteMetadataSchema = ModerateUserInfoSchema.extend({
  message_id: z.string(),
  message_body: z.string(),
})

/**
 * Automod terms metadata
 */
export interface AutomodTermsMetadata {
  /** Either "add" or "remove" */
  action: "add" | "remove"
  /** Either "blocked" or "permitted" */
  list: "blocked" | "permitted"
  /** Terms being added or removed */
  terms: string[]
  /** Whether the terms were added due to an Automod message approve/deny action */
  from_automod: boolean
}

export const AutomodTermsMetadataSchema = z.object({
  action: z.enum(["add", "remove"]),
  list: z.enum(["blocked", "permitted"]),
  terms: z.array(z.string()),
  from_automod: z.boolean(),
})

/**
 * Unban request metadata
 */
export interface UnbanRequestMetadata extends ModerateUserInfo {
  /** Whether or not the unban request was approved or denied */
  is_approved: boolean
  /** The message included by the moderator explaining their approval or denial */
  moderator_message: string
}

export const UnbanRequestMetadataSchema = ModerateUserInfoSchema.extend({
  is_approved: z.boolean(),
  moderator_message: z.string(),
})

/**
 * Warn command metadata (V2 only)
 */
export interface WarnMetadata extends ModerateUserInfo {
  /** Reason given for the warning. */
  reason?: string | undefined
  /** Chat rules cited for the warning. */
  chat_rules_cited?: string[] | undefined
}

export const WarnMetadataSchema = ModerateUserInfoSchema.extend({
  reason: z.string().optional(),
  chat_rules_cited: z.array(z.string()).optional(),
})

/**
 * Channel Moderate Event
 */
export type ChannelModerateEvent = {
  /** The ID of the broadcaster */
  broadcaster_user_id: string
  /** The login of the broadcaster */
  broadcaster_user_login: string
  /** The user name of the broadcaster */
  broadcaster_user_name: string
  /** The channel in which the action originally occurred */
  source_broadcaster_user_id: string
  /** The channel in which the action originally occurred */
  source_broadcaster_user_login: string
  /** The channel in which the action originally occurred */
  source_broadcaster_user_name: string | null
  /** The ID of the moderator who performed the action */
  moderator_user_id: string
  /** The login of the moderator */
  moderator_user_login: string
  /** The user name of the moderator */
  moderator_user_name: string
} & (
    | { action: "ban", ban: BanMetadata }
    | { action: "timeout", timeout: TimeoutMetadata }
    | { action: "unban", unban: ModerateUserInfo }
    | { action: "untimeout", untimeout: ModerateUserInfo }
    | { action: "clear" }
    | { action: "emoteonly" }
    | { action: "emoteonlyoff" }
    | { action: "followers", followers: FollowersMetadata }
    | { action: "followersoff" }
    | { action: "uniquechat" }
    | { action: "uniquechatoff" }
    | { action: "slow", slow: SlowMetadata }
    | { action: "slowoff" }
    | { action: "subscribers" }
    | { action: "subscribersoff" }
    | { action: "unraid", unraid: ModerateUserInfo }
    | { action: "delete", delete: DeleteMetadata }
    | { action: "unvip", unvip: ModerateUserInfo }
    | { action: "vip", vip: ModerateUserInfo }
    | { action: "raid", raid: RaidMetadata }
    | { action: "add_blocked_term", automod_terms: AutomodTermsMetadata }
    | { action: "add_permitted_term", automod_terms: AutomodTermsMetadata }
    | { action: "remove_blocked_term", automod_terms: AutomodTermsMetadata }
    | { action: "remove_permitted_term", automod_terms: AutomodTermsMetadata }
    | { action: "mod", mod: ModerateUserInfo }
    | { action: "unmod", unmod: ModerateUserInfo }
    | { action: "approve_unban_request", unban_request: UnbanRequestMetadata }
    | { action: "deny_unban_request", unban_request: UnbanRequestMetadata }
    | { action: "warn", /** V2 only */ warn: WarnMetadata }
    | { action: "shared_chat_ban", shared_chat_ban: BanMetadata }
    | { action: "shared_chat_timeout", shared_chat_timeout: TimeoutMetadata }
    | { action: "shared_chat_untimeout", shared_chat_untimeout: ModerateUserInfo }
    | { action: "shared_chat_unban", shared_chat_unban: ModerateUserInfo }
    | { action: "shared_chat_delete", shared_chat_delete: DeleteMetadata }
  )

export const ChannelModerateEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  source_broadcaster_user_id: z.string(),
  source_broadcaster_user_login: z.string(),
  source_broadcaster_user_name: z.string().nullable(),
  moderator_user_id: z.string(),
  moderator_user_login: z.string(),
  moderator_user_name: z.string(),
}).and(
  z.discriminatedUnion("action", [
    z.object({ action: z.literal("ban"), ban: BanMetadataSchema }),
    z.object({ action: z.literal("timeout"), timeout: TimeoutMetadataSchema }),
    z.object({ action: z.literal("unban"), unban: ModerateUserInfoSchema }),
    z.object({ action: z.literal("untimeout"), untimeout: ModerateUserInfoSchema }),
    z.object({ action: z.literal("clear") }),
    z.object({ action: z.literal("emoteonly") }),
    z.object({ action: z.literal("emoteonlyoff") }),
    z.object({ action: z.literal("followers"), followers: FollowersMetadataSchema }),
    z.object({ action: z.literal("followersoff") }),
    z.object({ action: z.literal("uniquechat") }),
    z.object({ action: z.literal("uniquechatoff") }),
    z.object({ action: z.literal("slow"), slow: SlowMetadataSchema }),
    z.object({ action: z.literal("slowoff") }),
    z.object({ action: z.literal("subscribers") }),
    z.object({ action: z.literal("subscribersoff") }),
    z.object({ action: z.literal("unraid"), unraid: ModerateUserInfoSchema }),
    z.object({ action: z.literal("delete"), delete: DeleteMetadataSchema }),
    z.object({ action: z.literal("unvip"), unvip: ModerateUserInfoSchema }),
    z.object({ action: z.literal("vip"), vip: ModerateUserInfoSchema }),
    z.object({ action: z.literal("raid"), raid: RaidMetadataSchema }),
    z.object({ action: z.literal("add_blocked_term"), automod_terms: AutomodTermsMetadataSchema }),
    z.object({ action: z.literal("add_permitted_term"), automod_terms: AutomodTermsMetadataSchema }),
    z.object({ action: z.literal("remove_blocked_term"), automod_terms: AutomodTermsMetadataSchema }),
    z.object({ action: z.literal("remove_permitted_term"), automod_terms: AutomodTermsMetadataSchema }),
    z.object({ action: z.literal("mod"), mod: ModerateUserInfoSchema }),
    z.object({ action: z.literal("unmod"), unmod: ModerateUserInfoSchema }),
    z.object({ action: z.literal("approve_unban_request"), unban_request: UnbanRequestMetadataSchema }),
    z.object({ action: z.literal("deny_unban_request"), unban_request: UnbanRequestMetadataSchema }),
    z.object({ action: z.literal("warn"), warn: WarnMetadataSchema }),
    z.object({ action: z.literal("shared_chat_ban"), shared_chat_ban: BanMetadataSchema }),
    z.object({ action: z.literal("shared_chat_timeout"), shared_chat_timeout: TimeoutMetadataSchema }),
    z.object({ action: z.literal("shared_chat_untimeout"), shared_chat_untimeout: ModerateUserInfoSchema }),
    z.object({ action: z.literal("shared_chat_unban"), shared_chat_unban: ModerateUserInfoSchema }),
    z.object({ action: z.literal("shared_chat_delete"), shared_chat_delete: DeleteMetadataSchema }),
  ])
)

// V2 is identical to V1 except for the addition of the "warn" action; unifying types for simplicity
/**
 * Channel Moderate Event V2
 */
export type ChannelModerateEventV2 = ChannelModerateEvent

export const ChannelModerateEventV2Schema = ChannelModerateEventSchema

/**
 * Channel Moderator Add Event
 */
export interface ChannelModeratorAddEvent {
  /** The requested broadcaster ID */
  broadcaster_user_id: string
  /** The requested broadcaster login */
  broadcaster_user_login: string
  /** The requested broadcaster display name */
  broadcaster_user_name: string
  /** The user ID of the new moderator */
  user_id: string
  /** The user login of the new moderator */
  user_login: string
  /** The display name of the new moderator */
  user_name: string
}

export const ChannelModeratorAddEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
})

/**
 * Channel Moderator Remove Event
 */
export interface ChannelModeratorRemoveEvent {
  /** The requested broadcaster ID */
  broadcaster_user_id: string
  /** The requested broadcaster login */
  broadcaster_user_login: string
  /** The requested broadcaster display name */
  broadcaster_user_name: string
  /** The user ID of the removed moderator */
  user_id: string
  /** The user login of the removed moderator */
  user_login: string
  /** The display name of the removed moderator */
  user_name: string
}

export const ChannelModeratorRemoveEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
})

/**
 * Channel Guest Star Session Begin Event
 */
export interface ChannelGuestStarSessionBeginEvent {
  /** The broadcaster user ID. */
  broadcaster_user_id: string
  /** The broadcaster display name. */
  broadcaster_user_name: string
  /** The broadcaster user login. */
  broadcaster_user_login: string
  /** ID representing the unique session that was started. */
  session_id: string
  /** RFC3339 timestamp indicating the time the session began. */
  started_at: string
}

export const ChannelGuestStarSessionBeginEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  session_id: z.string(),
  started_at: z.string(),
})

/**
 * Channel Guest Star Session End Event
 */
export interface ChannelGuestStarSessionEndEvent {
  /** The non-host broadcaster user ID. */
  broadcaster_user_id: string
  /** The non-host broadcaster display name. */
  broadcaster_user_name: string
  /** The non-host broadcaster user login. */
  broadcaster_user_login: string
  /** ID representing the unique session that was started. */
  session_id: string
  /** RFC3339 timestamp indicating the time the session began. */
  started_at: string
  /** RFC3339 timestamp indicating the time the session ended. */
  ended_at: string
  /** User ID of the host channel. */
  host_user_id: string
  /** The host display name. */
  host_user_name: string
  /** The host login. */
  host_user_login: string
}

export const ChannelGuestStarSessionEndEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  session_id: z.string(),
  started_at: z.string(),
  ended_at: z.string(),
  host_user_id: z.string(),
  host_user_name: z.string(),
  host_user_login: z.string(),
})

/**
 * Channel Guest Star Guest Update Event
 */
export type ChannelGuestStarGuestUpdateEvent = {
  /** The non-host broadcaster user ID. */
  broadcaster_user_id: string
  /** The non-host broadcaster display name. */
  broadcaster_user_name: string
  /** The non-host broadcaster user login. */
  broadcaster_user_login: string
  /** ID representing the unique session that was started. */
  session_id: string

  /** User ID of the host channel. */
  host_user_id: string
  /** The host display name. */
  host_user_name: string
  /** The host login. */
  host_user_login: string
} & ({
  /** The user ID of the moderator who updated the guest’s state (could be the host). null if the update was performed by the guest. */
  moderator_user_id: string
  /** The moderator display name.null if the update was performed by the guest. */
  moderator_user_name: string
  /** The moderator login. null if the update was performed by the guest. */
  moderator_user_login: string
} | {
  /** The user ID of the moderator who updated the guest’s state (could be the host). null if the update was performed by the guest. */
  moderator_user_id: null
  /** The moderator display name.null if the update was performed by the guest. */
  moderator_user_name: null
  /** The moderator login. null if the update was performed by the guest. */
  moderator_user_login: null
}) & ({
  // Case if the guest is not slotted yet

  /** The user ID of the guest who transitioned states in the session. null if the slot is now empty. */
  guest_user_id: string
  /** The guest display name. null if the slot is now empty. */
  guest_user_name: string
  /** The guest login. null if the slot is now empty. */
  guest_user_login: string
  /** The ID of the slot assignment the guest is assigned to. null if the guest is in the INVITED, REMOVED, READY, or ACCEPTED state. */
  slot_id: null
  /** The current state of the user after the update has taken place. null if the slot is now empty. Can otherwise be one of the following:
   * - invited — The guest has transitioned to the invite queue. This can take place when the guest was previously assigned a slot, but have been removed from the call and are sent back to the invite queue.
   * - accepted — The guest has accepted the invite and is currently in the process of setting up to join the session.
   * - ready — The guest has signaled they are ready and can be assigned a slot.
   * - backstage — The guest has been assigned a slot in the session, but is not currently seen live in the broadcasting software.
   * - live — The guest is now live in the host's broadcasting software.
   * - removed — The guest was removed from the call or queue.
   */
  state: 'invited' | 'accepted' | 'ready' | 'removed'
  /** Flag that signals whether the host is allowing the slot’s video to be seen by participants within the session. null if the guest is not slotted. */
  host_video_enabled: null
  /** Flag that signals whether the host is allowing the slot’s audio to be heard by participants within the session. null if the guest is not slotted. */
  host_audio_enabled: null
  /** Value between 0-100 that represents the slot’s audio level as heard by participants within the session. null if the guest is not slotted. */
  host_volume: null
} | {
  // Case if the guest is slotted

  /** The user ID of the guest who transitioned states in the session. null if the slot is now empty. */
  guest_user_id: string
  /** The guest display name. null if the slot is now empty. */
  guest_user_name: string
  /** The guest login. null if the slot is now empty. */
  guest_user_login: string
  /** The ID of the slot assignment the guest is assigned to. null if the guest is in the INVITED, REMOVED, READY, or ACCEPTED state. */
  slot_id: string
  /** The current state of the user after the update has taken place. null if the slot is now empty. Can otherwise be one of the following:
   * - invited — The guest has transitioned to the invite queue. This can take place when the guest was previously assigned a slot, but have been removed from the call and are sent back to the invite queue.
   * - accepted — The guest has accepted the invite and is currently in the process of setting up to join the session.
   * - ready — The guest has signaled they are ready and can be assigned a slot.
   * - backstage — The guest has been assigned a slot in the session, but is not currently seen live in the broadcasting software.
   * - live — The guest is now live in the host's broadcasting software.
   * - removed — The guest was removed from the call or queue.
   */
  state: 'backstage' | 'live'
  /** Flag that signals whether the host is allowing the slot’s video to be seen by participants within the session. null if the guest is not slotted. */
  host_video_enabled: boolean
  /** Flag that signals whether the host is allowing the slot’s audio to be heard by participants within the session. null if the guest is not slotted. */
  host_audio_enabled: boolean
  /** Value between 0-100 that represents the slot’s audio level as heard by participants within the session. null if the guest is not slotted. */
  host_volume: number
} | {
  // Case if the slot is now empty

  /** The user ID of the guest who transitioned states in the session. null if the slot is now empty. */
  guest_user_id: null
  /** The guest display name. null if the slot is now empty. */
  guest_user_name: null
  /** The guest login. null if the slot is now empty. */
  guest_user_login: null
  /** The ID of the slot assignment the guest is assigned to. null if the guest is in the INVITED, REMOVED, READY, or ACCEPTED state. */
  slot_id: string
  /** The current state of the user after the update has taken place. null if the slot is now empty. Can otherwise be one of the following:
   * - invited — The guest has transitioned to the invite queue. This can take place when the guest was previously assigned a slot, but have been removed from the call and are sent back to the invite queue.
   * - accepted — The guest has accepted the invite and is currently in the process of setting up to join the session.
   * - ready — The guest has signaled they are ready and can be assigned a slot.
   * - backstage — The guest has been assigned a slot in the session, but is not currently seen live in the broadcasting software.
   * - live — The guest is now live in the host's broadcasting software.
   * - removed — The guest was removed from the call or queue.
   */
  state: null
  /** Flag that signals whether the host is allowing the slot’s video to be seen by participants within the session. null if the guest is not slotted. */
  host_video_enabled: null
  /** Flag that signals whether the host is allowing the slot’s audio to be heard by participants within the session. null if the guest is not slotted. */
  host_audio_enabled: null
  /** Value between 0-100 that represents the slot’s audio level as heard by participants within the session. null if the guest is not slotted. */
  host_volume: null
})

export const ChannelGuestStarGuestUpdateEventSchema = z.intersection(
  // Base fields always present
  z.object({
    broadcaster_user_id: z.string(),
    broadcaster_user_name: z.string(),
    broadcaster_user_login: z.string(),
    session_id: z.string(),
    host_user_id: z.string(),
    host_user_name: z.string(),
    host_user_login: z.string(),
  }),
  z.intersection(
    // Moderator vs Guest update
    z.union([
      z.object({
        moderator_user_id: z.string(),
        moderator_user_name: z.string(),
        moderator_user_login: z.string(),
      }),
      z.object({
        moderator_user_id: z.null(),
        moderator_user_name: z.null(),
        moderator_user_login: z.null(),
      }),
    ]),
    // Guest presence and slotting status
    z.union([
      // Guest present, not slotted
      z.object({
        guest_user_id: z.string(),
        guest_user_name: z.string(),
        guest_user_login: z.string(),
        slot_id: z.null(),
        state: z.enum(['invited', 'accepted', 'ready', 'removed']),
        host_video_enabled: z.null(),
        host_audio_enabled: z.null(),
        host_volume: z.null(),
      }),
      // Guest present, slotted
      z.object({
        guest_user_id: z.string(),
        guest_user_name: z.string(),
        guest_user_login: z.string(),
        slot_id: z.string(),
        state: z.enum(['backstage', 'live']),
        host_video_enabled: z.boolean(),
        host_audio_enabled: z.boolean(),
        host_volume: z.number().min(0).max(100),
      }),
      // Slot empty
      z.object({
        guest_user_id: z.null(),
        guest_user_name: z.null(),
        guest_user_login: z.null(),
        slot_id: z.string(),
        state: z.null(),
        host_video_enabled: z.null(),
        host_audio_enabled: z.null(),
        host_volume: z.null(),
      }),
    ])
  )
)

/**
 * Channel Guest Star Settings Update Event
 */
export interface ChannelGuestStarSettingsUpdateEvent {
  /** User ID of the host channel. */
  broadcaster_user_id: string
  /** The broadcaster display name */
  broadcaster_user_name: string
  /** The broadcaster login. */
  broadcaster_user_login: string
  /** Flag determining if Guest Star moderators have access to control whether a guest is live once assigned to a slot. */
  is_moderator_send_live_enabled: boolean
  /** Number of slots the Guest Star call interface will allow the host to add to a call. */
  slot_count: number
  /** Flag determining if browser sources subscribed to sessions on this channel should output audio. */
  is_browser_source_audio_enabled: boolean
  /** This setting determines how the guests within a session should be laid out within a group browser source. Can be one of the following values:
    * - tiled — All live guests are tiled within the browser source with the same size.
    * - screenshare — All live guests are tiled within the browser source with the same size. If there is an active screen share, it is sized larger than the other guests.
    * - horizontal_top — Indicates the group layout will contain all participants in a top-aligned horizontal stack.
    * - horizontal_bottom — Indicates the group layout will contain all participants in a bottom-aligned horizontal stack.
    * - vertical_left — Indicates the group layout will contain all participants in a left-aligned vertical stack.
    * - vertical_right — Indicates the group layout will contain all participants in a right-aligned vertical stack.
    **/
  group_layout: 'tiled' | 'screenshare' | 'horizontal_top' | 'horizontal_bottom' | 'vertical_left' | 'vertical_right'
}

export const ChannelGuestStarSettingsUpdateEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  is_moderator_send_live_enabled: z.boolean(),
  slot_count: z.number().int(),
  is_browser_source_audio_enabled: z.boolean(),
  group_layout: z.enum(['tiled', 'screenshare', 'horizontal_top', 'horizontal_bottom', 'vertical_left', 'vertical_right']),
})

/**
 * Channel VIP Add Event
 */
export interface ChannelVIPAddEvent {
  /** The requested broadcaster ID */
  broadcaster_user_id: string
  /** The requested broadcaster login */
  broadcaster_user_login: string
  /** The requested broadcaster display name */
  broadcaster_user_name: string
  /** The user ID of the new VIP */
  user_id: string
  /** The user login of the new VIP */
  user_login: string
  /** The display name of the new VIP */
  user_name: string
}

export const ChannelVIPAddEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
})

/**
 * Channel VIP Remove Event
 */
export interface ChannelVIPRemoveEvent {
  /** The requested broadcaster ID */
  broadcaster_user_id: string
  /** The requested broadcaster login */
  broadcaster_user_login: string
  /** The requested broadcaster display name */
  broadcaster_user_name: string
  /** The user ID of the removed VIP */
  user_id: string
  /** The user login of the removed VIP */
  user_login: string
  /** The display name of the removed VIP */
  user_name: string
}

export const ChannelVIPRemoveEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
})

/**
 * Stream Online Event
 */
export interface StreamOnlineEvent {
  /** The id of the stream */
  id: string
  /** The broadcaster's user ID */
  broadcaster_user_id: string
  /** The broadcaster's user login */
  broadcaster_user_login: string
  /** The broadcaster's user display name */
  broadcaster_user_name: string
  /** The stream type. Valid values are: live, playlist, watch_party, premiere, rerun */
  type: "live" | "playlist" | "watch_party" | "premiere" | "rerun"
  /** The timestamp at which the stream went online at */
  started_at: string
}

export const StreamOnlineEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  type: z.enum(["live", "playlist", "watch_party", "premiere", "rerun"]),
  started_at: z.string(),
})

/**
 * Stream Offline Event
 */
export interface StreamOfflineEvent {
  /** The broadcaster's user ID */
  broadcaster_user_id: string
  /** The broadcaster's user login */
  broadcaster_user_login: string
  /** The broadcaster's user display name */
  broadcaster_user_name: string
}

export const StreamOfflineEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
})

/**
 * User Update Event
 */
export interface UserUpdateEvent {
  /** The user's user ID */
  user_id: string
  /** The user's user login */
  user_login: string
  /** The user's user display name */
  user_name: string
  /** The user's email address. The event includes the user's email address only if the app used to request this event type includes the user:read:email scope for the user */
  email?: string | undefined
  /** A Boolean value that determines whether Twitch has verified the user's email address. Is true if Twitch has verified the email address otherwise, false. NOTE: Ignore this field if the email field contains an empty string */
  email_verified?: boolean | undefined
  /** The user's description */
  description: string
}

export const UserUpdateEventSchema = z.object({
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  email: z.string().optional(),
  email_verified: z.boolean().optional(),
  description: z.string(),
})

// ============================================================================
// Channel Points Events
// ============================================================================

/**
 * Channel Points Custom Reward Add Event
 */
export interface ChannelPointsCustomRewardAddEvent {
  /** The reward identifier */
  id: string
  /** The broadcaster's user ID */
  broadcaster_user_id: string
  /** The broadcaster's user login */
  broadcaster_user_login: string
  /** The broadcaster's user display name */
  broadcaster_user_name: string
  /** Is the reward currently enabled */
  is_enabled: boolean
  /** Is the reward currently paused */
  is_paused: boolean
  /** Is the reward currently in stock */
  is_in_stock: boolean
  /** The reward title */
  title: string
  /** The reward cost */
  cost: number
  /** The reward description */
  prompt: string
  /** Does the viewer need to enter information when redeeming the reward */
  is_user_input_required: boolean
  /** Should redemptions be set to fulfilled status immediately when redeemed */
  should_redemptions_skip_request_queue: boolean
  /** Whether a maximum per stream is enabled and what the maximum is */
  max_per_stream: {
    /** Is the max per stream limit enabled */
    is_enabled: boolean
    /** The maximum number of redemptions per stream */
    value: number
  }
  /** Whether a maximum per user per stream is enabled and what the maximum is */
  max_per_user_per_stream: {
    /** Is the max per user per stream limit enabled */
    is_enabled: boolean
    /** The maximum number of redemptions per user per stream */
    value: number
  }
  /** Custom background color for the reward */
  background_color: string
  /** Set of custom images for the reward */
  image: {
    /** URL for 1x size */
    url_1x: string
    /** URL for 2x size */
    url_2x: string
    /** URL for 4x size */
    url_4x: string
  } | null
  /** Set of default images for the reward */
  default_image: {
    /** URL for 1x size */
    url_1x: string
    /** URL for 2x size */
    url_2x: string
    /** URL for 4x size */
    url_4x: string
  }
  /** Whether a cooldown is enabled and what the cooldown is */
  global_cooldown: {
    /** Is the cooldown enabled */
    is_enabled: boolean
    /** The cooldown in seconds */
    seconds: number
  }
  /** Timestamp of when the reward was cooldown expires. null if the reward isn't on cooldown */
  cooldown_expires_at: string | null
  /** The number of redemptions redeemed during the current live stream */
  redemptions_redeemed_current_stream: number | null
}

export const ChannelPointsCustomRewardAddEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  is_enabled: z.boolean(),
  is_paused: z.boolean(),
  is_in_stock: z.boolean(),
  title: z.string(),
  cost: z.number().int(),
  prompt: z.string(),
  is_user_input_required: z.boolean(),
  should_redemptions_skip_request_queue: z.boolean(),
  max_per_stream: z.object({
    is_enabled: z.boolean(),
    value: z.number().int(),
  }),
  max_per_user_per_stream: z.object({
    is_enabled: z.boolean(),
    value: z.number().int(),
  }),
  background_color: z.string(),
  image: z.object({
    url_1x: z.string(),
    url_2x: z.string(),
    url_4x: z.string(),
  }).nullable(),
  default_image: z.object({
    url_1x: z.string(),
    url_2x: z.string(),
    url_4x: z.string(),
  }),
  global_cooldown: z.object({
    is_enabled: z.boolean(),
    seconds: z.number().int(),
  }),
  cooldown_expires_at: z.string().nullable(),
  redemptions_redeemed_current_stream: z.number().int().nullable(),
})

// ============================================================================
// Poll Events
// ============================================================================

/**
 * Channel Poll Begin Event
 */
export interface ChannelPollBeginEvent {
  /** ID of the poll */
  id: string
  /** The broadcaster's user ID */
  broadcaster_user_id: string
  /** The broadcaster's user login */
  broadcaster_user_login: string
  /** The broadcaster's user display name */
  broadcaster_user_name: string
  /** Question displayed for the poll */
  title: string
  /** An array of choices for the poll */
  choices: PollChoice[]
  /** The Bits voting settings for the poll */
  bits_voting: BitsVoting
  /** The Channel Points voting settings for the poll */
  channel_points_voting: ChannelPointsVoting
  /** The time the poll started */
  started_at: string
  /** The time the poll will end */
  ends_at: string
}

export const ChannelPollBeginEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  title: z.string(),
  choices: z.array(PollChoiceSchema),
  bits_voting: BitsVotingSchema,
  channel_points_voting: ChannelPointsVotingSchema,
  started_at: z.string(),
  ends_at: z.string(),
})

/**
 * Channel Poll Progress Event
 */
export type ChannelPollProgressEvent = ChannelPollBeginEvent

export const ChannelPollProgressEventSchema = ChannelPollBeginEventSchema

/**
 * Channel Poll End Event
 */
export interface ChannelPollEndEvent extends ChannelPollBeginEvent {
  /** The status of the poll */
  status: "completed" | "archived" | "terminated"
  /** The time the poll ended */
  ended_at: string
}

export const ChannelPollEndEventSchema = ChannelPollBeginEventSchema.extend({
  status: z.enum(["completed", "archived", "terminated"]),
  ended_at: z.string(),
})

// ============================================================================
// Hype Train Events
// ============================================================================

/**
 * Hype Train Begin Event
 */
export interface HypeTrainBeginEvent {
  /** The Hype Train ID */
  id: string
  /** The broadcaster's user ID */
  broadcaster_user_id: string
  /** The broadcaster's user login */
  broadcaster_user_login: string
  /** The broadcaster's user display name */
  broadcaster_user_name: string
  /** Total points contributed to the Hype Train */
  total: number
  /** The number of points contributed to the Hype Train at the current level */
  progress: number
  /** The number of points required to reach the next level */
  goal: number
  /** The contributors with the most points contributed */
  top_contributions: Array<{
    /** The ID of the user */
    user_id: string
    /** The login of the user */
    user_login: string
    /** The display name of the user */
    user_name: string
    /** Type of contribution */
    type: "bits" | "subscription" | "other"
    /** Total contribution amount */
    total: number
  }>
  /** The most recent contribution */
  last_contribution: {
    /** The ID of the user */
    user_id: string
    /** The login of the user */
    user_login: string
    /** The display name of the user */
    user_name: string
    /** Type of contribution */
    type: "bits" | "subscription" | "other"
    /** Total contribution amount */
    total: number
  }
  /** Current level of the Hype Train */
  level: number
  /** The time when the Hype Train started */
  started_at: string
  /** The time when the Hype Train expires */
  expires_at: string
}

export const HypeTrainBeginEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  total: z.number().int(),
  progress: z.number().int(),
  goal: z.number().int(),
  top_contributions: z.array(z.object({
    user_id: z.string(),
    user_login: z.string(),
    user_name: z.string(),
    type: z.enum(["bits", "subscription", "other"]),
    total: z.number().int(),
  })),
  last_contribution: z.object({
    user_id: z.string(),
    user_login: z.string(),
    user_name: z.string(),
    type: z.enum(["bits", "subscription", "other"]),
    total: z.number().int(),
  }),
  level: z.number().int(),
  started_at: z.string(),
  expires_at: z.string(),
})

/**
 * Hype Train End Event
 */
export interface HypeTrainEndEvent {
  /** The Hype Train ID */
  id: string
  /** The broadcaster's user ID */
  broadcaster_user_id: string
  /** The broadcaster's user login */
  broadcaster_user_login: string
  /** The broadcaster's user display name */
  broadcaster_user_name: string
  /** The final level of the Hype Train */
  level: number
  /** Total points contributed to the Hype Train */
  total: number
  /** The contributors with the most points contributed */
  top_contributions: Array<{
    /** The ID of the user */
    user_id: string
    /** The login of the user */
    user_login: string
    /** The display name of the user */
    user_name: string
    /** Type of contribution */
    type: "bits" | "subscription" | "other"
    /** Total contribution amount */
    total: number
  }>
  /** The time when the Hype Train started */
  started_at: string
  /** The time when the Hype Train ended */
  ended_at: string
  /** The time when the Hype Train cooldown ends */
  cooldown_ends_at: string
}

export const HypeTrainEndEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  level: z.number().int(),
  total: z.number().int(),
  top_contributions: z.array(z.object({
    user_id: z.string(),
    user_login: z.string(),
    user_name: z.string(),
    type: z.enum(["bits", "subscription", "other"]),
    total: z.number().int(),
  })),
  started_at: z.string(),
  ended_at: z.string(),
  cooldown_ends_at: z.string(),
})

// ============================================================================
// Shared Chat Events
// ============================================================================

/**
 * Channel Shared Chat Session Begin condition
 */
export interface ChannelSharedChatSessionBeginCondition {
  /** The User ID of the channel to receive shared chat session begin events for. */
  broadcaster_user_id: string
}

export const ChannelSharedChatSessionBeginConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Shared Chat Session Begin event
 */
export interface ChannelSharedChatSessionBeginEvent {
  /** The unique identifier for the shared chat session. */
  session_id: string
  /** The User ID of the channel in the subscription condition. */
  broadcaster_user_id: string
  /** The display name of the channel in the subscription condition. */
  broadcaster_user_name: string
  /** The user login of the channel in the subscription condition. */
  broadcaster_user_login: string
  /** The User ID of the host channel. */
  host_broadcaster_user_id: string
  /** The display name of the host channel. */
  host_broadcaster_user_name: string
  /** The user login of the host channel. */
  host_broadcaster_user_login: string
  /** The list of participants in the session. */
  participants: Array<{
    /** The User ID of the participant channel. */
    broadcaster_user_id: string
    /** The display name of the participant channel. */
    broadcaster_user_name: string
    /** The user login of the participant channel. */
    broadcaster_user_login: string
  }>
}

export const ChannelSharedChatBeginEventSchema = z.object({
  session_id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  host_broadcaster_user_id: z.string(),
  host_broadcaster_user_name: z.string(),
  host_broadcaster_user_login: z.string(),
  participants: z.array(z.object({
    broadcaster_user_id: z.string(),
    broadcaster_user_name: z.string(),
    broadcaster_user_login: z.string(),
  })),
})

/**
 * Channel Shared Chat Session Update condition
 */
export interface ChannelSharedChatSessionUpdateCondition {
  /** The User ID of the channel to receive shared chat session update events for. */
  broadcaster_user_id: string
}

export const ChannelSharedChatSessionUpdateConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Shared Chat Session Update event
 */
export interface ChannelSharedChatUpdateEvent {
  /** The unique identifier for the shared chat session. */
  session_id: string
  /** The User ID of the channel in the subscription condition. */
  broadcaster_user_id: string
  /** The display name of the channel in the subscription condition. */
  broadcaster_user_name: string
  /** The user login of the channel in the subscription condition. */
  broadcaster_user_login: string
  /** The User ID of the host channel. */
  host_broadcaster_user_id: string
  /** The display name of the host channel. */
  host_broadcaster_user_name: string
  /** The user login of the host channel. */
  host_broadcaster_user_login: string
  /** The list of participants in the session. */
  participants: Array<{
    /** The User ID of the participant channel. */
    broadcaster_user_id: string
    /** The display name of the participant channel. */
    broadcaster_user_name: string
    /** The user login of the participant channel. */
    broadcaster_user_login: string
  }>
}

export const ChannelSharedChatUpdateEventSchema = z.object({
  session_id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  host_broadcaster_user_id: z.string(),
  host_broadcaster_user_name: z.string(),
  host_broadcaster_user_login: z.string(),
  participants: z.array(z.object({
    broadcaster_user_id: z.string(),
    broadcaster_user_name: z.string(),
    broadcaster_user_login: z.string(),
  })),
})

/**
 * Channel Shared Chat Session End condition
 */
export interface ChannelSharedChatSessionEndCondition {
  /** The User ID of the channel to receive shared chat session end events for. */
  broadcaster_user_id: string
}

export const ChannelSharedChatEndConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Shared Chat Session End event
 */
export interface ChannelSharedChatEndEvent {
  /** The unique identifier for the shared chat session. */
  session_id: string
  /** The User ID of the channel in the subscription condition. */
  broadcaster_user_id: string
  /** The display name of the channel in the subscription condition. */
  broadcaster_user_name: string
  /** The user login of the channel in the subscription condition. */
  broadcaster_user_login: string
  /** The User ID of the host channel. */
  host_broadcaster_user_id: string
  /** The display name of the host channel. */
  host_broadcaster_user_name: string
  /** The user login of the host channel. */
  host_broadcaster_user_login: string
}

export const ChannelSharedChatEndEventSchema = z.object({
  session_id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  host_broadcaster_user_id: z.string(),
  host_broadcaster_user_name: z.string(),
  host_broadcaster_user_login: z.string(),
})

// ============================================================================
// Channel Points Events
// ============================================================================

/**
 * Channel Points Automatic Reward Redemption Add condition
 */
export interface ChannelPointsAutomaticRewardRedemptionAddCondition {
  /** The broadcaster user ID for the channel you want to receive channel points reward add notifications for. */
  broadcaster_user_id: string
}

export const ChannelPointsAutomaticRewardRedemptionAddConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Channel Points Automatic Reward Redemption Add event
 */
export interface ChannelPointsAutomaticRewardRedemptionAddEvent {
  /** The ID of the channel where the reward was redeemed. */
  broadcaster_user_id: string
  /** The login of the channel where the reward was redeemed. */
  broadcaster_user_login: string
  /** The display name of the channel where the reward was redeemed. */
  broadcaster_user_name: string
  /** The ID of the redeeming user. */
  user_id: string
  /** The login of the redeeming user. */
  user_login: string
  /** The display name of the redeeming user. */
  user_name: string
  /** The ID of the Redemption. */
  id: string
  /** An object that contains the reward information. */
  reward: {
    /** The type of reward. */
    type: "single_message_bypass_sub_mode" | "send_highlighted_message" | "random_sub_emote_unlock" | "chosen_sub_emote_unlock" | "chosen_modified_sub_emote_unlock" | "message_effect" | "gigantify_an_emote" | "celebration"
    /** The reward cost. */
    cost: number
    /** Optional. Emote that was unlocked. */
    unlocked_emote?: {
      /** The emote ID. */
      id: string
      /** The human readable emote token. */
      name: string
    } | undefined
  }
  /** An object that contains the user message and emote information needed to recreate the message. */
  message: {
    /** The text of the chat message. */
    text: string
    /** An array that includes the emote ID and start and end positions for where the emote appears in the text. */
    emotes: Array<{
      /** The emote ID. */
      id: string
      /** The index of where the Emote starts in the text. */
      begin: number
      /** The index of where the Emote ends in the text. */
      end: number
    }>
  }
  /** Optional. A string that the user entered if the reward requires input. */
  user_input?: string | undefined
  /** The UTC date and time (in RFC3339 format) of when the reward was redeemed. */
  redeemed_at: string
}

export const ChannelPointsAutomaticRewardRedemptionAddEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  id: z.string(),
  reward: z.object({
    type: z.enum(["single_message_bypass_sub_mode", "send_highlighted_message", "random_sub_emote_unlock", "chosen_sub_emote_unlock", "chosen_modified_sub_emote_unlock", "message_effect", "gigantify_an_emote", "celebration"]),
    cost: z.number().int(),
    unlocked_emote: z.object({
      id: z.string(),
      name: z.string(),
    }).optional(),
  }),
  message: z.object({
    text: z.string(),
    emotes: z.array(z.object({
      id: z.string(),
      begin: z.number().int(),
      end: z.number().int(),
    })),
  }),
  user_input: z.string().optional(),
  redeemed_at: z.string(),
})

/**
 * Channel Points Automatic Reward Redemption Add V2 event
 */
export interface ChannelPointsAutomaticRewardRedemptionAddEventV2 {
  /** The ID of the channel where the reward was redeemed. */
  broadcaster_user_id: string
  /** The login of the channel where the reward was redeemed. */
  broadcaster_user_login: string
  /** The display name of the channel where the reward was redeemed. */
  broadcaster_user_name: string
  /** The ID of the redeeming user. */
  user_id: string
  /** The login of the redeeming user. */
  user_login: string
  /** The display name of the redeeming user. */
  user_name: string
  /** The ID of the Redemption. */
  id: string
  /** An object that contains the reward information. */
  reward: {
    /** The type of reward. */
    type: "single_message_bypass_sub_mode" | "send_highlighted_message" | "random_sub_emote_unlock" | "chosen_sub_emote_unlock" | "chosen_modified_sub_emote_unlock"
    /** Number of channel points used. */
    channel_points: number
    /** Optional. Emote associated with the reward. */
    emote?: {
      /** The emote ID. */
      id: string
      /** The human readable emote token. */
      name: string
    } | undefined
  }
  /** Optional. An object that contains the user message and emote information needed to recreate the message. */
  message?: {
    /** The chat message in plain text. */
    text: string
    /** The ordered list of chat message fragments. */
    fragments: Array<{
      /** The message text in fragment. */
      text: string
      /** The type of message fragment. Possible values are: text, emote */
      type: "text" | "emote"
      /** Optional. The metadata pertaining to the emote. */
      emote?: {
        /** The ID that uniquely identifies this emote. */
        id: string
      } | undefined
    }>
  } | undefined
  /** The UTC date and time (in RFC3339 format) of when the reward was redeemed. */
  redeemed_at: string
}

export const ChannelPointsAutomaticRewardRedemptionAddEventV2Schema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  id: z.string(),
  reward: z.object({
    type: z.enum(["single_message_bypass_sub_mode", "send_highlighted_message", "random_sub_emote_unlock", "chosen_sub_emote_unlock", "chosen_modified_sub_emote_unlock"]),
    channel_points: z.number().int(),
    emote: z.object({
      id: z.string(),
      name: z.string(),
    }).optional(),
  }),
  message: z.object({
    text: z.string(),
    fragments: z.array(z.object({
      text: z.string(),
      type: z.enum(["text", "emote"]),
      emote: z.object({
        id: z.string(),
      }).optional(),
    })),
  }).optional(),
  redeemed_at: z.string(),
})

/**
 * Channel Points Custom Reward Update event
 */
export interface ChannelPointsCustomRewardUpdateEvent {
  /** The reward identifier. */
  id: string
  /** The requested broadcaster ID. */
  broadcaster_user_id: string
  /** The requested broadcaster login. */
  broadcaster_user_login: string
  /** The requested broadcaster display name. */
  broadcaster_user_name: string
  /** Is the reward currently enabled. If false, the reward won't show up to viewers. */
  is_enabled: boolean
  /** Is the reward currently paused. If true, viewers can't redeem. */
  is_paused: boolean
  /** Is the reward currently in stock. If false, viewers can't redeem. */
  is_in_stock: boolean
  /** The reward title. */
  title: string
  /** The reward cost. */
  cost: number
  /** The reward description. */
  prompt: string
  /** Does the viewer need to enter information when redeeming the reward. */
  is_user_input_required: boolean
  /** Should redemptions be set to fulfilled status immediately when redeemed and skip the request queue instead of the normal unfulfilled status. */
  should_redemptions_skip_request_queue: boolean
  /** Whether a maximum per stream is enabled and what the maximum is. */
  max_per_stream: {
    /** Is the setting enabled. */
    is_enabled: boolean
    /** The max per stream limit. */
    value: number
  }
  /** Whether a maximum per user per stream is enabled and what the maximum is. */
  max_per_user_per_stream: {
    /** Is the setting enabled. */
    is_enabled: boolean
    /** The max per user per stream limit. */
    value: number
  }
  /** Custom background color for the reward. Format: Hex with # prefix. Example: #FA1ED2. */
  background_color: string
  /** Set of custom images of 1x, 2x and 4x sizes for the reward. Can be null if no images have been uploaded. */
  image: {
    /** URL for 1x size image. */
    url_1x: string
    /** URL for 2x size image. */
    url_2x: string
    /** URL for 4x size image. */
    url_4x: string
  } | null
  /** Set of default images of 1x, 2x and 4x sizes for the reward. */
  default_image: {
    /** URL for 1x size image. */
    url_1x: string
    /** URL for 2x size image. */
    url_2x: string
    /** URL for 4x size image. */
    url_4x: string
  }
  /** Whether a cooldown is enabled and what the cooldown is in seconds. */
  global_cooldown: {
    /** Is the setting enabled. */
    is_enabled: boolean
    /** The cooldown in seconds. */
    seconds: number
  }
  /** Timestamp of the cooldown expiration. null if the reward isn't on cooldown. */
  cooldown_expires_at: string | null
  /** The number of redemptions redeemed during the current live stream. Counts against the max_per_stream limit. null if the broadcasters stream isn't live or max_per_stream isn't enabled. */
  redemptions_redeemed_current_stream: number | null
}

export const ChannelPointsCustomRewardUpdateEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  is_enabled: z.boolean(),
  is_paused: z.boolean(),
  is_in_stock: z.boolean(),
  title: z.string(),
  cost: z.number().int(),
  prompt: z.string(),
  is_user_input_required: z.boolean(),
  should_redemptions_skip_request_queue: z.boolean(),
  max_per_stream: z.object({
    is_enabled: z.boolean(),
    value: z.number().int(),
  }),
  max_per_user_per_stream: z.object({
    is_enabled: z.boolean(),
    value: z.number().int(),
  }),
  background_color: z.string(),
  image: z.object({
    url_1x: z.string(),
    url_2x: z.string(),
    url_4x: z.string(),
  }).nullable(),
  default_image: z.object({
    url_1x: z.string(),
    url_2x: z.string(),
    url_4x: z.string(),
  }),
  global_cooldown: z.object({
    is_enabled: z.boolean(),
    seconds: z.number().int(),
  }),
  cooldown_expires_at: z.string().nullable(),
  redemptions_redeemed_current_stream: z.number().int().nullable(),
})

export type ChannelPointsCustomRewardRemoveEvent = ChannelPointsCustomRewardUpdateEvent

export const ChannelPointsCustomRewardRemoveEventSchema = ChannelPointsCustomRewardUpdateEventSchema

/**
 * Channel Points Custom Reward Redemption Add event
 */
export interface ChannelPointsCustomRewardRedemptionAddEvent {
  /** The redemption identifier. */
  id: string
  /** The requested broadcaster ID. */
  broadcaster_user_id: string
  /** The requested broadcaster login. */
  broadcaster_user_login: string
  /** The requested broadcaster display name. */
  broadcaster_user_name: string
  /** User ID of the user that redeemed the reward. */
  user_id: string
  /** Login of the user that redeemed the reward. */
  user_login: string
  /** Display name of the user that redeemed the reward. */
  user_name: string
  /** The user input provided. Empty string if not provided. */
  user_input: string
  /** Defaults to unfulfilled. Possible values are unknown, unfulfilled, fulfilled, and canceled. */
  status: string
  /** Basic information about the reward that was redeemed, at the time it was redeemed. */
  reward: {
    /** The reward identifier. */
    id: string
    /** The reward name. */
    title: string
    /** The reward cost. */
    cost: number
    /** The reward description. */
    prompt: string
  }
  /** RFC3339 timestamp of when the reward was redeemed. */
  redeemed_at: string
}

export const ChannelPointsCustomRewardRedemptionAddEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  user_input: z.string(),
  status: z.string(),
  reward: z.object({
    id: z.string(),
    title: z.string(),
    cost: z.number().int(),
    prompt: z.string(),
  }),
  redeemed_at: z.string(),
})

/**
 * Channel Points Custom Reward Redemption Update event
 */
export interface ChannelPointsCustomRewardRedemptionUpdateEvent {
  /** The redemption identifier. */
  id: string
  /** The requested broadcaster ID. */
  broadcaster_user_id: string
  /** The requested broadcaster login. */
  broadcaster_user_login: string
  /** The requested broadcaster display name. */
  broadcaster_user_name: string
  /** User ID of the user that redeemed the reward. */
  user_id: string
  /** Login of the user that redeemed the reward. */
  user_login: string
  /** Display name of the user that redeemed the reward. */
  user_name: string
  /** The user input provided. Empty string if not provided. */
  user_input: string
  /** Will be fulfilled or canceled. Possible values are unknown, unfulfilled, fulfilled, and canceled. */
  status: string
  /** Basic information about the reward that was redeemed, at the time it was redeemed. */
  reward: {
    /** The reward identifier. */
    id: string
    /** The reward name. */
    title: string
    /** The reward cost. */
    cost: number
    /** The reward description. */
    prompt: string
  }
  /** RFC3339 timestamp of when the reward was redeemed. */
  redeemed_at: string
}

export const ChannelPointsCustomRewardRedemptionUpdateEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  user_input: z.string(),
  status: z.string(),
  reward: z.object({
    id: z.string(),
    title: z.string(),
    cost: z.number().int(),
    prompt: z.string(),
  }),
  redeemed_at: z.string(),
})

// ============================================================================
// Channel Prediction Events
// ============================================================================

/**
 * Channel Prediction Begin event
 */
export interface ChannelPredictionBeginEvent {
  /** Channel Points Prediction ID. */
  id: string
  /** The requested broadcaster ID. */
  broadcaster_user_id: string
  /** The requested broadcaster login. */
  broadcaster_user_login: string
  /** The requested broadcaster display name. */
  broadcaster_user_name: string
  /** Title for the Channel Points Prediction. */
  title: string
  /** An array of outcomes for the Channel Points Prediction. */
  outcomes: Array<{
    /** The outcome ID. */
    id: string
    /** The outcome title. */
    title: string
    /** The color for the outcome. Valid values are pink and blue. */
    color: string
  }>
  /** The time the Channel Points Prediction started. */
  started_at: string
  /** The time the Channel Points Prediction will automatically lock. */
  locks_at: string
}

export const ChannelPredictionBeginEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  title: z.string(),
  outcomes: z.array(z.object({
    id: z.string(),
    title: z.string(),
    color: z.string(),
  })),
  started_at: z.string(),
  locks_at: z.string(),
})

/**
 * Channel Prediction Progress event
 */
export interface ChannelPredictionProgressEvent {
  /** Channel Points Prediction ID. */
  id: string
  /** The requested broadcaster ID. */
  broadcaster_user_id: string
  /** The requested broadcaster login. */
  broadcaster_user_login: string
  /** The requested broadcaster display name. */
  broadcaster_user_name: string
  /** Title for the Channel Points Prediction. */
  title: string
  /** An array of outcomes for the Channel Points Prediction. Includes top_predictors. */
  outcomes: Array<{
    /** The outcome ID. */
    id: string
    /** The outcome title. */
    title: string
    /** The color for the outcome. Valid values are pink and blue. */
    color: string
    /** The number of users who used Channel Points on this outcome. */
    users: number
    /** The total number of Channel Points used on this outcome. */
    channel_points: number
    /** An array of users who used the most Channel Points on this outcome. */
    top_predictors: Array<{
      /** The ID of the user. */
      user_id: string
      /** The login of the user. */
      user_login: string
      /** The display name of the user. */
      user_name: string
      /** The number of Channel Points won. This value is always null in the event payload for Prediction progress and Prediction lock. This value is 0 if the outcome did not win or if the Prediction was canceled and Channel Points were refunded. */
      channel_points_won: number | null
      /** The number of Channel Points used to participate in the Prediction. */
      channel_points_used: number
    }>
  }>
  /** The time the Channel Points Prediction started. */
  started_at: string
  /** The time the Channel Points Prediction will automatically lock. */
  locks_at: string
}

export const ChannelPredictionProgressEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  title: z.string(),
  outcomes: z.array(z.object({
    id: z.string(),
    title: z.string(),
    color: z.string(),
    users: z.number().int(),
    channel_points: z.number().int(),
    top_predictors: z.array(z.object({
      user_id: z.string(),
      user_login: z.string(),
      user_name: z.string(),
      channel_points_won: z.number().int().nullable(),
      channel_points_used: z.number().int(),
    })),
  })),
  started_at: z.string(),
  locks_at: z.string(),
})

/**
 * Channel Prediction Lock event
 */
export interface ChannelPredictionLockEvent {
  /** Channel Points Prediction ID. */
  id: string
  /** The requested broadcaster ID. */
  broadcaster_user_id: string
  /** The requested broadcaster login. */
  broadcaster_user_login: string
  /** The requested broadcaster display name. */
  broadcaster_user_name: string
  /** Title for the Channel Points Prediction. */
  title: string
  /** An array of outcomes for the Channel Points Prediction. Includes top_predictors. */
  outcomes: Array<{
    /** The outcome ID. */
    id: string
    /** The outcome title. */
    title: string
    /** The color for the outcome. Valid values are pink and blue. */
    color: string
    /** The number of users who used Channel Points on this outcome. */
    users: number
    /** The total number of Channel Points used on this outcome. */
    channel_points: number
    /** An array of users who used the most Channel Points on this outcome. */
    top_predictors: Array<{
      /** The ID of the user. */
      user_id: string
      /** The login of the user. */
      user_login: string
      /** The display name of the user. */
      user_name: string
      /** The number of Channel Points won. This value is always null in the event payload for Prediction progress and Prediction lock. This value is 0 if the outcome did not win or if the Prediction was canceled and Channel Points were refunded. */
      channel_points_won: number | null
      /** The number of Channel Points used to participate in the Prediction. */
      channel_points_used: number
    }>
  }>
  /** The time the Channel Points Prediction started. */
  started_at: string
  /** The time the Channel Points Prediction was locked. */
  locked_at: string
}

export const ChannelPredictionLockEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  title: z.string(),
  outcomes: z.array(z.object({
    id: z.string(),
    title: z.string(),
    color: z.string(),
    users: z.number().int(),
    channel_points: z.number().int(),
    top_predictors: z.array(z.object({
      user_id: z.string(),
      user_login: z.string(),
      user_name: z.string(),
      channel_points_won: z.number().int().nullable(),
      channel_points_used: z.number().int(),
    })),
  })),
  started_at: z.string(),
  locked_at: z.string(),
})

/**
 * Channel Prediction End event
 */
export interface ChannelPredictionEndEvent {
  /** Channel Points Prediction ID. */
  id: string
  /** The requested broadcaster ID. */
  broadcaster_user_id: string
  /** The requested broadcaster login. */
  broadcaster_user_login: string
  /** The requested broadcaster display name. */
  broadcaster_user_name: string
  /** Title for the Channel Points Prediction. */
  title: string
  /** ID of the winning outcome. */
  winning_outcome_id: string
  /** An array of outcomes for the Channel Points Prediction. Includes top_predictors. */
  outcomes: Array<{
    /** The outcome ID. */
    id: string
    /** The outcome title. */
    title: string
    /** The color for the outcome. Valid values are pink and blue. */
    color: string
    /** The number of users who used Channel Points on this outcome. */
    users: number
    /** The total number of Channel Points used on this outcome. */
    channel_points: number
    /** An array of users who used the most Channel Points on this outcome. */
    top_predictors: Array<{
      /** The ID of the user. */
      user_id: string
      /** The login of the user. */
      user_login: string
      /** The display name of the user. */
      user_name: string
      /** The number of Channel Points won. This value is always null in the event payload for Prediction progress and Prediction lock. This value is 0 if the outcome did not win or if the Prediction was canceled and Channel Points were refunded. */
      channel_points_won: number | null
      /** The number of Channel Points used to participate in the Prediction. */
      channel_points_used: number
    }>
  }>
  /** The status of the Channel Points Prediction. Valid values are resolved and canceled. */
  status: string
  /** The time the Channel Points Prediction started. */
  started_at: string
  /** The time the Channel Points Prediction ended. */
  ended_at: string
}

export const ChannelPredictionEndEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  title: z.string(),
  winning_outcome_id: z.string(),
  outcomes: z.array(z.object({
    id: z.string(),
    title: z.string(),
    color: z.string(),
    users: z.number().int(),
    channel_points: z.number().int(),
    top_predictors: z.array(z.object({
      user_id: z.string(),
      user_login: z.string(),
      user_name: z.string(),
      channel_points_won: z.number().int().nullable(),
      channel_points_used: z.number().int(),
    })),
  })),
  status: z.string(),
  started_at: z.string(),
  ended_at: z.string(),
})

// ============================================================================
// Channel Suspicious User Events
// ============================================================================

/**
 * Channel Suspicious User Message event
 */
export interface ChannelSuspiciousUserMessageEvent {
  /** The ID of the channel where the treatment for a suspicious user was updated. */
  broadcaster_user_id: string
  /** The display name of the channel where the treatment for a suspicious user was updated. */
  broadcaster_user_name: string
  /** The login of the channel where the treatment for a suspicious user was updated. */
  broadcaster_user_login: string
  /** The user ID of the user that sent the message. */
  user_id: string
  /** The user name of the user that sent the message. */
  user_name: string
  /** The user login of the user that sent the message. */
  user_login: string
  /** The status set for the suspicious user. Can be the following: "none", "active_monitoring", or "restricted" */
  low_trust_status: string
  /** A list of channel IDs where the suspicious user is also banned. */
  shared_ban_channel_ids: string[]
  /** User types (if any) that apply to the suspicious user, can be "manually_added", "ban_evader", or "banned_in_shared_channel". */
  types: string[]
  /** A ban evasion likelihood value (if any) that as been applied to the user automatically by Twitch, can be "unknown", "possible", or "likely". */
  ban_evasion_evaluation: string
  /** The structured chat message. */
  message: {
    /** The UUID that identifies the message. */
    message_id: string
    /** The chat message in plain text. */
    text: string
    /** Ordered list of chat message fragments. */
    fragments: Array<{
      /** The type of message fragment. Possible values: text, cheermote, emote */
      type: string
      /** Message text in fragment. */
      text: string
      /** Optional. Metadata pertaining to the cheermote. */
      cheermote?: {
        /** The name portion of the Cheermote string that you use in chat to cheer Bits. The full Cheermote string is the concatenation of {prefix} + {number of Bits}. */
        prefix: string
        /** The amount of Bits cheered. */
        bits: string
        /** The tier level of the cheermote. */
        tier: string
      } | undefined
      /** Optional. Metadata pertaining to the emote. */
      emote?: {
        /** An ID that uniquely identifies this emote. */
        id: string
        /** An ID that identifies the emote set that the emote belongs to. */
        emote_set_id: string
      } | undefined
    }>
  }
}

export const ChannelSuspiciousUserMessageEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  user_login: z.string(),
  low_trust_status: z.string(),
  shared_ban_channel_ids: z.array(z.string()),
  types: z.array(z.string()),
  ban_evasion_evaluation: z.string(),
  message: z.object({
    message_id: z.string(),
    text: z.string(),
    fragments: z.array(z.object({
      type: z.string(),
      text: z.string(),
      cheermote: z.object({
        prefix: z.string(),
        bits: z.string(),
        tier: z.string(),
      }).optional(),
      emote: z.object({
        id: z.string(),
        emote_set_id: z.string(),
      }).optional(),
    })),
  }),
})

/**
 * Channel Suspicious User Update event
 */
export interface ChannelSuspiciousUserUpdateEvent {
  /** The user ID of the broadcaster. */
  broadcaster_user_id: string
  /** The user name of the broadcaster. */
  broadcaster_user_name: string
  /** The login of the broadcaster. */
  broadcaster_user_login: string
  /** The user ID of the suspicious user whose treatment was updated. */
  user_id: string
  /** The user name of the suspicious user whose treatment was updated. */
  user_name: string
  /** The login of the suspicious user whose treatment was updated. */
  user_login: string
  /** The status set for the suspicious user. Can be the following: "none", "active_monitoring", or "restricted". */
  low_trust_status: string
}

export const ChannelSuspiciousUserUpdateEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  user_login: z.string(),
  low_trust_status: z.string(),
})

// ============================================================================
// Channel Warning Events
// ============================================================================

/**
 * Channel Warning Acknowledge event
 */
export interface ChannelWarningAcknowledgementEvent {
  /** The user ID of the broadcaster. */
  broadcaster_user_id: string
  /** The login of the broadcaster. */
  broadcaster_user_login: string
  /** The user name of the broadcaster. */
  broadcaster_user_name: string
  /** The ID of the user that has acknowledged their warning. */
  user_id: string
  /** The login of the user that has acknowledged their warning. */
  user_login: string
  /** The user name of the user that has acknowledged their warning. */
  user_name: string
}

export const ChannelWarningAcknowledgementEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
})

/**
 * Channel Warning Send event
 */
export interface ChannelWarningSendEvent {
  /** The user ID of the broadcaster. */
  broadcaster_user_id: string
  /** The login of the broadcaster. */
  broadcaster_user_login: string
  /** The user name of the broadcaster. */
  broadcaster_user_name: string
  /** The user ID of the moderator who sent the warning. */
  moderator_user_id: string
  /** The login of the moderator. */
  moderator_user_login: string
  /** The user name of the moderator. */
  moderator_user_name: string
  /** The ID of the user being warned. */
  user_id: string
  /** The login of the user being warned. */
  user_login: string
  /** The user name of the user being. */
  user_name: string
  /** Optional. The reason given for the warning. */
  reason?: string | undefined
  /** Optional. The chat rules cited for the warning. */
  chat_rules_cited?: string[] | undefined
}

export const ChannelWarningSendEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  moderator_user_id: z.string(),
  moderator_user_login: z.string(),
  moderator_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  reason: z.string().optional(),
  chat_rules_cited: z.array(z.string()).optional(),
})

// ============================================================================
// Charity Campaign Events
// ============================================================================

/**
 * Charity Donation condition
 */
export interface CharityDonationCondition {
  /** The broadcaster user ID. */
  broadcaster_user_id: string
}

export const CharityDonationConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Charity Donation event
 */
export interface CharityDonationEvent {
  /** An ID that identifies the donation. The ID is unique across campaigns. */
  id: string
  /** An ID that identifies the charity campaign. */
  campaign_id: string
  /** An ID that identifies the broadcaster that's running the campaign. */
  broadcaster_user_id: string
  /** The broadcaster's login name. */
  broadcaster_user_login: string
  /** The broadcaster's display name. */
  broadcaster_user_name: string
  /** An ID that identifies the user that donated to the campaign. */
  user_id: string
  /** The user's login name. */
  user_login: string
  /** The user's display name. */
  user_name: string
  /** The charity's name. */
  charity_name: string
  /** A description of the charity. */
  charity_description: string
  /** A URL to an image of the charity's logo. The image's type is PNG and its size is 100px X 100px. */
  charity_logo: string
  /** A URL to the charity's website. */
  charity_website: string
  /** An object that contains the amount of money that the user donated. */
  amount: {
    /** The monetary amount. The amount is specified in the currency's minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, value is set to 550. */
    value: number
    /** The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate value from minor units to major units by using the formula: value / 10^decimal_places */
    decimal_places: number
    /** The ISO-4217 three-letter currency code that identifies the type of currency in value. */
    currency: string
  }
}

export const CharityDonationEventSchema = z.object({
  id: z.string(),
  campaign_id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  charity_name: z.string(),
  charity_description: z.string(),
  charity_logo: z.string(),
  charity_website: z.string(),
  amount: z.object({
    value: z.number().int(),
    decimal_places: z.number().int(),
    currency: z.string(),
  }),
})

/**
 * Charity Campaign Start condition
 */
export interface CharityCampaignStartCondition {
  /** The broadcaster user ID. */
  broadcaster_user_id: string
}

export const CharityCampaignStartConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Charity Campaign Start event
 */
export interface CharityCampaignStartEvent {
  /** An ID that identifies the charity campaign. */
  id: string
  /** An ID that identifies the broadcaster that's running the campaign. */
  broadcaster_id: string
  /** The broadcaster's login name. */
  broadcaster_login: string
  /** The broadcaster's display name. */
  broadcaster_name: string
  /** The charity's name. */
  charity_name: string
  /** A description of the charity. */
  charity_description: string
  /** A URL to an image of the charity's logo. The image's type is PNG and its size is 100px X 100px. */
  charity_logo: string
  /** A URL to the charity's website. */
  charity_website: string
  /** An object that contains the current amount of donations that the campaign has received. */
  current_amount: {
    /** The monetary amount. The amount is specified in the currency's minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, value is set to 550. */
    value: number
    /** The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate value from minor units to major units by using the formula: value / 10^decimal_places */
    decimal_places: number
    /** The ISO-4217 three-letter currency code that identifies the type of currency in value. */
    currency: string
  }
  /** An object that contains the campaign's target fundraising goal. */
  target_amount: {
    /** The monetary amount. The amount is specified in the currency's minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, value is set to 550. */
    value: number
    /** The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate value from minor units to major units by using the formula: value / 10^decimal_places */
    decimal_places: number
    /** The ISO-4217 three-letter currency code that identifies the type of currency in value. */
    currency: string
  }
  /** The UTC timestamp (in RFC3339 format) of when the broadcaster started the campaign. */
  started_at: string
}

export const CharityCampaignStartEventSchema = z.object({
  id: z.string(),
  broadcaster_id: z.string(),
  broadcaster_login: z.string(),
  broadcaster_name: z.string(),
  charity_name: z.string(),
  charity_description: z.string(),
  charity_logo: z.string(),
  charity_website: z.string(),
  current_amount: z.object({
    value: z.number().int(),
    decimal_places: z.number().int(),
    currency: z.string(),
  }),
  target_amount: z.object({
    value: z.number().int(),
    decimal_places: z.number().int(),
    currency: z.string(),
  }),
  started_at: z.string(),
})

/**
 * Charity Campaign Progress condition
 */
export interface CharityCampaignProgressCondition {
  /** The broadcaster user ID. */
  broadcaster_user_id: string
}

export const CharityCampaignProgressConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Charity Campaign Progress event
 */
export interface CharityCampaignProgressEvent {
  /** An ID that identifies the charity campaign. */
  id: string
  /** An ID that identifies the broadcaster that's running the campaign. */
  broadcaster_id: string
  /** The broadcaster's login name. */
  broadcaster_login: string
  /** The broadcaster's display name. */
  broadcaster_name: string
  /** The charity's name. */
  charity_name: string
  /** A description of the charity. */
  charity_description: string
  /** A URL to an image of the charity's logo. The image's type is PNG and its size is 100px X 100px. */
  charity_logo: string
  /** A URL to the charity's website. */
  charity_website: string
  /** An object that contains the current amount of donations that the campaign has received. */
  current_amount: {
    /** The monetary amount. The amount is specified in the currency's minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, value is set to 550. */
    value: number
    /** The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate value from minor units to major units by using the formula: value / 10^decimal_places */
    decimal_places: number
    /** The ISO-4217 three-letter currency code that identifies the type of currency in value. */
    currency: string
  }
  /** An object that contains the campaign's target fundraising goal. */
  target_amount: {
    /** The monetary amount. The amount is specified in the currency's minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, value is set to 550. */
    value: number
    /** The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate value from minor units to major units by using the formula: value / 10^decimal_places */
    decimal_places: number
    /** The ISO-4217 three-letter currency code that identifies the type of currency in value. */
    currency: string
  }
}

export const CharityCampaignProgressEventSchema = z.object({
  id: z.string(),
  broadcaster_id: z.string(),
  broadcaster_login: z.string(),
  broadcaster_name: z.string(),
  charity_name: z.string(),
  charity_description: z.string(),
  charity_logo: z.string(),
  charity_website: z.string(),
  current_amount: z.object({
    value: z.number().int(),
    decimal_places: z.number().int(),
    currency: z.string(),
  }),
  target_amount: z.object({
    value: z.number().int(),
    decimal_places: z.number().int(),
    currency: z.string(),
  }),
})

/**
 * Charity Campaign Stop condition
 */
export interface CharityCampaignStopCondition {
  /** The broadcaster user ID. */
  broadcaster_user_id: string
}

export const CharityCampaignStopConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Charity Campaign Stop event
 */
export interface CharityCampaignStopEvent {
  /** An ID that identifies the charity campaign. */
  id: string
  /** An ID that identifies the broadcaster that ran the campaign. */
  broadcaster_id: string
  /** The broadcaster's login name. */
  broadcaster_login: string
  /** The broadcaster's display name. */
  broadcaster_name: string
  /** The charity's name. */
  charity_name: string
  /** A description of the charity. */
  charity_description: string
  /** A URL to an image of the charity's logo. The image's type is PNG and its size is 100px X 100px. */
  charity_logo: string
  /** A URL to the charity's website. */
  charity_website: string
  /** An object that contains the final amount of donations that the campaign received. */
  current_amount: {
    /** The monetary amount. The amount is specified in the currency's minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, value is set to 550. */
    value: number
    /** The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate value from minor units to major units by using the formula: value / 10^decimal_places */
    decimal_places: number
    /** The ISO-4217 three-letter currency code that identifies the type of currency in value. */
    currency: string
  }
  /** An object that contains the campaign's target fundraising goal. */
  target_amount: {
    /** The monetary amount. The amount is specified in the currency's minor unit. For example, the minor units for USD is cents, so if the amount is $5.50 USD, value is set to 550. */
    value: number
    /** The number of decimal places used by the currency. For example, USD uses two decimal places. Use this number to translate value from minor units to major units by using the formula: value / 10^decimal_places */
    decimal_places: number
    /** The ISO-4217 three-letter currency code that identifies the type of currency in value. */
    currency: string
  }
  /** The UTC timestamp (in RFC3339 format) of when the broadcaster stopped the campaign. */
  stopped_at: string
}

export const CharityCampaignStopEventSchema = z.object({
  id: z.string(),
  broadcaster_id: z.string(),
  broadcaster_login: z.string(),
  broadcaster_name: z.string(),
  charity_name: z.string(),
  charity_description: z.string(),
  charity_logo: z.string(),
  charity_website: z.string(),
  current_amount: z.object({
    value: z.number().int(),
    decimal_places: z.number().int(),
    currency: z.string(),
  }),
  target_amount: z.object({
    value: z.number().int(),
    decimal_places: z.number().int(),
    currency: z.string(),
  }),
  stopped_at: z.string(),
})

// ============================================================================
// Conduit Shard Events
// ============================================================================

/**
 * Conduit Shard Disabled event
 */
export interface ConduitShardDisabledEvent {
  /** The ID of the conduit. */
  conduit_id: string
  /** The ID of the disabled shard. */
  shard_id: string
  /** The new status of the transport. */
  status: string
  /** The disabled transport. */
  transport: {
    /** websocket or webhook */
    method: string
    /** Optional. Webhook callback URL. Null if method is set to websocket. */
    callback: string | null
    /** Optional. WebSocket session ID. Null if  method is set to webhook. */
    session_id: string | null
    /** Optional. Time that the WebSocket session connected. Null if method is set to webhook. */
    connected_at: string | null
    /** Optional. Time that the WebSocket session disconnected. Null if method is set to webhook. */
    disconnected_at: string | null
  }
}

export const ConduitShardDisabledEventSchema = z.object({
  conduit_id: z.string(),
  shard_id: z.string(),
  status: z.string(),
  transport: z.object({
    method: z.string(),
    callback: z.string().nullable(),
    session_id: z.string().nullable(),
    connected_at: z.string().nullable(),
    disconnected_at: z.string().nullable(),
  }),
})

// ============================================================================
// Drop Entitlement Events
// ============================================================================

/**
 * Drop Entitlement Grant event
 */
export interface DropEntitlementGrantEvent {
  /** Individual event ID, as assigned by EventSub. Use this for de-duplicating messages. */
  id: string
  /** Entitlement object. */
  data: Array<{
    /** The ID of the organization that owns the game that has Drops enabled. */
    organization_id: string
    /** Twitch category ID of the game that was being played when this benefit was entitled. */
    category_id: string
    /** The category name. */
    category_name: string
    /** The campaign this entitlement is associated with. */
    campaign_id: string
    /** Twitch user ID of the user who was granted the entitlement. */
    user_id: string
    /** The user display name of the user who was granted the entitlement. */
    user_name: string
    /** The user login of the user who was granted the entitlement. */
    user_login: string
    /** Unique identifier of the entitlement. Use this to de-duplicate entitlements. */
    entitlement_id: string
    /** Identifier of the Benefit. */
    benefit_id: string
    /** UTC timestamp in ISO format when this entitlement was granted on Twitch. */
    created_at: string
  }>
}

export const DropEntitlementGrantEventSchema = z.object({
  id: z.string(),
  data: z.array(z.object({
    organization_id: z.string(),
    category_id: z.string(),
    category_name: z.string(),
    campaign_id: z.string(),
    user_id: z.string(),
    user_name: z.string(),
    user_login: z.string(),
    entitlement_id: z.string(),
    benefit_id: z.string(),
    created_at: z.string(),
  })),
})

// ============================================================================
// Extension Bits Transaction Events
// ============================================================================

/**
 * Extension Bits Transaction Create event
 */
export interface ExtensionBitsTransactionCreateEvent {
  /** Client ID of the extension. */
  extension_client_id: string
  /** Transaction ID. */
  id: string
  /** The transaction's broadcaster ID. */
  broadcaster_user_id: string
  /** The transaction's broadcaster login. */
  broadcaster_user_login: string
  /** The transaction's broadcaster display name. */
  broadcaster_user_name: string
  /** The transaction's user ID. */
  user_id: string
  /** The transaction's user login. */
  user_login: string
  /** The transaction's user display name. */
  user_name: string
  /** Additional extension product information. */
  product: {
    /** Product name. */
    name: string
    /** Bits involved in the transaction. */
    bits: number
    /** Unique identifier for the product acquired. */
    sku: string
    /** Flag indicating if the product is in development. If in_development is true, bits will be 0. */
    in_development: boolean
  }
}

export const ExtensionBitsTransactionCreateEventSchema = z.object({
  extension_client_id: z.string(),
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
  product: z.object({
    name: z.string(),
    bits: z.number().int(),
    sku: z.string(),
    in_development: z.boolean(),
  }),
})

// ============================================================================
// Goal Events
// ============================================================================

/**
 * Goal Begin condition
 */
export interface GoalBeginCondition {
  /** The broadcaster user ID. */
  broadcaster_user_id: string
}

export const GoalBeginConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Goal Begin event
 */
export interface GoalBeginEvent {
  /** An ID that identifies this event. */
  id: string
  /** An ID that uniquely identifies the broadcaster. */
  broadcaster_user_id: string
  /** The broadcaster's display name. */
  broadcaster_user_name: string
  /** The broadcaster's user handle. */
  broadcaster_user_login: string
  /** The type of goal. */
  type: "follow" | "subscription" | "subscription_count" | "new_subscription" | "new_subscription_count" | "new_bit" | "new_cheerer"
  /** A description of the goal, if specified. The description may contain a maximum of 40 characters. */
  description: string
  /** The goal's current value. */
  current_amount: number
  /** The goal's target value. For example, if the broadcaster has 200 followers before creating the goal, and their goal is to double that number, this field is set to 400. */
  target_amount: number
  /** The UTC timestamp in RFC 3339 format, which indicates when the broadcaster created the goal. */
  started_at: string
}

export const GoalBeginEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  type: z.enum(["follow", "subscription", "subscription_count", "new_subscription", "new_subscription_count", "new_bit", "new_cheerer"]),
  description: z.string(),
  current_amount: z.number().int(),
  target_amount: z.number().int(),
  started_at: z.string(),
})

/**
 * Goal Progress condition
 */
export interface GoalProgressCondition {
  /** The broadcaster user ID. */
  broadcaster_user_id: string
}

export const GoalProgressConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Goal Progress event
 */
export interface GoalProgressEvent {
  /** An ID that identifies this event. */
  id: string
  /** An ID that uniquely identifies the broadcaster. */
  broadcaster_user_id: string
  /** The broadcaster's display name. */
  broadcaster_user_name: string
  /** The broadcaster's user handle. */
  broadcaster_user_login: string
  /** The type of goal. */
  type: "follow" | "subscription" | "subscription_count" | "new_subscription" | "new_subscription_count" | "new_bit" | "new_cheerer"
  /** A description of the goal, if specified. The description may contain a maximum of 40 characters. */
  description: string
  /** The goal's current value. */
  current_amount: number
  /** The goal's target value. For example, if the broadcaster has 200 followers before creating the goal, and their goal is to double that number, this field is set to 400. */
  target_amount: number
  /** The UTC timestamp in RFC 3339 format, which indicates when the broadcaster created the goal. */
  started_at: string
}

export const GoalProgressEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  type: z.enum(["follow", "subscription", "subscription_count", "new_subscription", "new_subscription_count", "new_bit", "new_cheerer"]),
  description: z.string(),
  current_amount: z.number().int(),
  target_amount: z.number().int(),
  started_at: z.string(),
})

/**
 * Goal End condition
 */
export interface GoalEndCondition {
  /** The broadcaster user ID. */
  broadcaster_user_id: string
}

export const GoalEndConditionSchema = z.object({
  broadcaster_user_id: z.string(),
})

/**
 * Goal End event
 */
export interface GoalEndEvent {
  /** An ID that identifies this event. */
  id: string
  /** An ID that uniquely identifies the broadcaster. */
  broadcaster_user_id: string
  /** The broadcaster's display name. */
  broadcaster_user_name: string
  /** The broadcaster's user handle. */
  broadcaster_user_login: string
  /** The type of goal. */
  type: "follow" | "subscription" | "subscription_count" | "new_subscription" | "new_subscription_count" | "new_bit" | "new_cheerer"
  /** A description of the goal, if specified. The description may contain a maximum of 40 characters. */
  description: string
  /** A Boolean value that indicates whether the broadcaster achieved their goal. Is true if the goal was achieved; otherwise, false. */
  is_achieved: boolean
  /** The goal's current value. */
  current_amount: number
  /** The goal's target value. For example, if the broadcaster has 200 followers before creating the goal, and their goal is to double that number, this field is set to 400. */
  target_amount: number
  /** The UTC timestamp in RFC 3339 format, which indicates when the broadcaster created the goal. */
  started_at: string
  /** The UTC timestamp in RFC 3339 format, which indicates when the broadcaster ended the goal. */
  ended_at: string
}

export const GoalEndEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_name: z.string(),
  broadcaster_user_login: z.string(),
  type: z.enum(["follow", "subscription", "subscription_count", "new_subscription", "new_subscription_count", "new_bit", "new_cheerer"]),
  description: z.string(),
  is_achieved: z.boolean(),
  current_amount: z.number().int(),
  target_amount: z.number().int(),
  started_at: z.string(),
  ended_at: z.string(),
})

// ============================================================================
// Hype Train Events (V2)
// ============================================================================

/**
 * Hype Train Begin V2 event
 */
export interface HypeTrainBeginEventV2 {
  /** The Hype Train ID. */
  id: string
  /** The requested broadcaster ID. */
  broadcaster_user_id: string
  /** The requested broadcaster login. */
  broadcaster_user_login: string
  /** The requested broadcaster display name. */
  broadcaster_user_name: string
  /** Total points contributed to the Hype Train. */
  total: number
  /** The number of points contributed to the Hype Train at the current level. */
  progress: number
  /** The number of points required to reach the next level. */
  goal: number
  /** The contributors with the most points contributed. */
  top_contributions: Array<{
    /** The ID of the user that made the contribution. */
    user_id: string
    /** The user's login name. */
    user_login: string
    /** The user's display name. */
    user_name: string
    /** The contribution method used. Possible values are: bits, subscription, other */
    type: "bits" | "subscription" | "other"
    /** The total amount contributed. If type is bits, total represents the amount of Bits used. If type is subscription, total is 500, 1000, or 2500 to represent tier 1, 2, or 3 subscriptions, respectively. */
    total: number
  }>
  /** The current level of the Hype Train. */
  level: number
  /** The all-time high level this type of Hype Train has reached for this broadcaster. */
  all_time_high_level: number
  /** The all-time high total this type of Hype Train has reached for this broadcaster. */
  all_time_high_total: number
  /** Optional. Non-null for a shared Hype Train. Contains the list of broadcasters in the shared Hype Train. */
  shared_train_participants?: Array<{
    /** The ID of the broadcaster participating in the shared Hype Train. */
    broadcaster_user_id: string
    /** The login of the broadcaster participating in the shared Hype Train. */
    broadcaster_user_login: string
    /** The display name of the broadcaster participating in the shared Hype Train. */
    broadcaster_user_name: string
  }> | undefined
  /** The time when the Hype Train started. */
  started_at: string
  /** The time when the Hype Train expires. The expiration is extended when the Hype Train reaches a new level. */
  expires_at: string
  /** The type of the Hype Train. Possible values are: treasure, golden_kappa, regular */
  type: "treasure" | "golden_kappa" | "regular"
  /** Indicates if the Hype Train is shared. When true, shared_train_participants will contain the list of broadcasters the train is shared with. */
  is_shared_train: boolean
}

export const HypeTrainBeginEventV2Schema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  total: z.number().int(),
  progress: z.number().int(),
  goal: z.number().int(),
  top_contributions: z.array(z.object({
    user_id: z.string(),
    user_login: z.string(),
    user_name: z.string(),
    type: z.enum(["bits", "subscription", "other"]),
    total: z.number().int(),
  })),
  level: z.number().int(),
  all_time_high_level: z.number().int(),
  all_time_high_total: z.number().int(),
  shared_train_participants: z.array(z.object({
    broadcaster_user_id: z.string(),
    broadcaster_user_login: z.string(),
    broadcaster_user_name: z.string(),
  })).optional(),
  started_at: z.string(),
  expires_at: z.string(),
  type: z.enum(["treasure", "golden_kappa", "regular"]),
  is_shared_train: z.boolean(),
})

/**
 * Hype Train Progress event
 */
export interface HypeTrainProgressEvent {
  /** The Hype Train ID. */
  id: string
  /** The requested broadcaster ID. */
  broadcaster_user_id: string
  /** The requested broadcaster login. */
  broadcaster_user_login: string
  /** The requested broadcaster display name. */
  broadcaster_user_name: string
  /** The current level of the Hype Train. */
  level: number
  /** Total points contributed to the Hype Train. */
  total: number
  /** The number of points contributed to the Hype Train at the current level. */
  progress: number
  /** The number of points required to reach the next level. */
  goal: number
  /** The contributors with the most points contributed. */
  top_contributions: Array<{
    /** The ID of the user that made the contribution. */
    user_id: string
    /** The user's login name. */
    user_login: string
    /** The user's display name. */
    user_name: string
    /** The contribution method used. Possible values are: bits, subscription, other */
    type: "bits" | "subscription" | "other"
    /** The total amount contributed. If type is bits, total represents the amount of Bits used. If type is subscription, total is 500, 1000, or 2500 to represent tier 1, 2, or 3 subscriptions, respectively. */
    total: number
  }>
  /** The most recent contribution. */
  last_contribution: {
    /** The ID of the user that made the contribution. */
    user_id: string
    /** The user's login name. */
    user_login: string
    /** The user's display name. */
    user_name: string
    /** The contribution method used. Possible values are: bits, subscription, other */
    type: "bits" | "subscription" | "other"
    /** The total amount contributed. If type is bits, total represents the amount of Bits used. If type is subscription, total is 500, 1000, or 2500 to represent tier 1, 2, or 3 subscriptions, respectively. */
    total: number
  }
  /** The time when the Hype Train started. */
  started_at: string
  /** The time when the Hype Train expires. The expiration is extended when the Hype Train reaches a new level. */
  expires_at: string
  /** Indicates if the Hype Train is a Golden Kappa Train. */
  is_golden_kappa_train: boolean
}

export const HypeTrainProgressEventSchema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  level: z.number().int(),
  total: z.number().int(),
  progress: z.number().int(),
  goal: z.number().int(),
  top_contributions: z.array(z.object({
    user_id: z.string(),
    user_login: z.string(),
    user_name: z.string(),
    type: z.enum(["bits", "subscription", "other"]),
    total: z.number().int(),
  })),
  last_contribution: z.object({
    user_id: z.string(),
    user_login: z.string(),
    user_name: z.string(),
    type: z.enum(["bits", "subscription", "other"]),
    total: z.number().int(),
  }),
  started_at: z.string(),
  expires_at: z.string(),
  is_golden_kappa_train: z.boolean(),
})

/**
 * Hype Train Progress V2 event
 */
export interface HypeTrainProgressEventV2 {
  /** The Hype Train ID. */
  id: string
  /** The requested broadcaster ID. */
  broadcaster_user_id: string
  /** The requested broadcaster login. */
  broadcaster_user_login: string
  /** The requested broadcaster display name. */
  broadcaster_user_name: string
  /** Total points contributed to the Hype Train. */
  total: number
  /** The number of points contributed to the Hype Train at the current level. */
  progress: number
  /** The number of points required to reach the next level. */
  goal: number
  /** The contributors with the most points contributed. */
  top_contributions: Array<{
    /** The ID of the user that made the contribution. */
    user_id: string
    /** The user's login name. */
    user_login: string
    /** The user's display name. */
    user_name: string
    /** The contribution method used. Possible values are: bits, subscription, other */
    type: "bits" | "subscription" | "other"
    /** The total amount contributed. If type is bits, total represents the amount of Bits used. If type is subscription, total is 500, 1000, or 2500 to represent tier 1, 2, or 3 subscriptions, respectively. */
    total: number
  }>
  /** The current level of the Hype Train. */
  level: number
  /** Optional. Non-null for a shared Hype Train. Contains the list of broadcasters in the shared Hype Train. */
  shared_train_participants?: Array<{
    /** The ID of the broadcaster participating in the shared Hype Train. */
    broadcaster_user_id: string
    /** The login of the broadcaster participating in the shared Hype Train. */
    broadcaster_user_login: string
    /** The display name of the broadcaster participating in the shared Hype Train. */
    broadcaster_user_name: string
  }> | undefined
  /** The time when the Hype Train started. */
  started_at: string
  /** The time when the Hype Train expires. The expiration is extended when the Hype Train reaches a new level. */
  expires_at: string
  /** The type of the Hype Train. Possible values are: treasure, golden_kappa, regular */
  type: "treasure" | "golden_kappa" | "regular"
  /** Indicates if the Hype Train is shared. When true, shared_train_participants will contain the list of broadcasters the train is shared with. */
  is_shared_train: boolean
}

export const HypeTrainProgressEventV2Schema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  total: z.number().int(),
  progress: z.number().int(),
  goal: z.number().int(),
  top_contributions: z.array(z.object({
    user_id: z.string(),
    user_login: z.string(),
    user_name: z.string(),
    type: z.enum(["bits", "subscription", "other"]),
    total: z.number().int(),
  })),
  level: z.number().int(),
  shared_train_participants: z.array(z.object({
    broadcaster_user_id: z.string(),
    broadcaster_user_login: z.string(),
    broadcaster_user_name: z.string(),
  })).optional(),
  started_at: z.string(),
  expires_at: z.string(),
  type: z.enum(["treasure", "golden_kappa", "regular"]),
  is_shared_train: z.boolean(),
})

/**
 * Hype Train End V2 event
 */
export interface HypeTrainEndEventV2 {
  /** The Hype Train ID. */
  id: string
  /** The requested broadcaster ID. */
  broadcaster_user_id: string
  /** The requested broadcaster login. */
  broadcaster_user_login: string
  /** The requested broadcaster display name. */
  broadcaster_user_name: string
  /** Total points contributed to the Hype Train. */
  total: number
  /** The contributors with the most points contributed. */
  top_contributions: Array<{
    /** The ID of the user that made the contribution. */
    user_id: string
    /** The user's login name. */
    user_login: string
    /** The user's display name. */
    user_name: string
    /** The contribution method used. Possible values are: bits, subscription, other */
    type: "bits" | "subscription" | "other"
    /** The total amount contributed. If type is bits, total represents the amount of Bits used. If type is subscription, total is 500, 1000, or 2500 to represent tier 1, 2, or 3 subscriptions, respectively. */
    total: number
  }>
  /** The current level of the Hype Train. */
  level: number
  /** Optional. Non-null for a shared Hype Train. Contains the list of broadcasters in the shared Hype Train. */
  shared_train_participants?: Array<{
    /** The ID of the broadcaster participating in the shared Hype Train. */
    broadcaster_user_id: string
    /** The login of the broadcaster participating in the shared Hype Train. */
    broadcaster_user_login: string
    /** The display name of the broadcaster participating in the shared Hype Train. */
    broadcaster_user_name: string
  }> | undefined
  /** The time when the Hype Train started. */
  started_at: string
  /** The time when the Hype Train cooldown ends so that the next Hype Train can start. */
  cooldown_ends_at: string
  /** The time when the Hype Train ended. */
  ended_at: string
  /** The type of the Hype Train. Possible values are: treasure, golden_kappa, regular */
  type: "treasure" | "golden_kappa" | "regular"
}

export const HypeTrainEndEventV2Schema = z.object({
  id: z.string(),
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  total: z.number().int(),
  top_contributions: z.array(z.object({
    user_id: z.string(),
    user_login: z.string(),
    user_name: z.string(),
    type: z.enum(["bits", "subscription", "other"]),
    total: z.number().int(),
  })),
  level: z.number().int(),
  shared_train_participants: z.array(z.object({
    broadcaster_user_id: z.string(),
    broadcaster_user_login: z.string(),
    broadcaster_user_name: z.string(),
  })).optional(),
  started_at: z.string(),
  cooldown_ends_at: z.string(),
  ended_at: z.string(),
  type: z.enum(["treasure", "golden_kappa", "regular"]),
})

// ============================================================================
// Shield Mode Events
// ============================================================================

/**
 * Shield Mode Begin condition
 */
export interface ShieldModeBeginCondition {
  /** The User ID of the broadcaster. */
  broadcaster_user_id: string
  /** The User ID of the moderator. */
  moderator_user_id: string
}

export const ShieldModeBeginConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Shield Mode Begin event
 */
export interface ShieldModeBeginEvent {
  /** An ID that identifies the broadcaster whose Shield Mode status was updated. */
  broadcaster_user_id: string
  /** The broadcaster's login name. */
  broadcaster_user_login: string
  /** The broadcaster's display name. */
  broadcaster_user_name: string
  /** An ID that identifies the moderator that updated the Shield Mode's status. If the broadcaster updated the status, this ID will be the same as broadcaster_user_id. */
  moderator_user_id: string
  /** The moderator's login name. */
  moderator_user_login: string
  /** The moderator's display name. */
  moderator_user_name: string
  /** The UTC timestamp (in RFC3339 format) of when the moderator activated Shield Mode. */
  started_at: string
}

export const ShieldModeBeginEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  moderator_user_id: z.string(),
  moderator_user_login: z.string(),
  moderator_user_name: z.string(),
  started_at: z.string(),
})

/**
 * Shield Mode End condition
 */
export interface ShieldModeEndCondition {
  /** The User ID of the broadcaster. */
  broadcaster_user_id: string
  /** The User ID of the moderator. */
  moderator_user_id: string
}

export const ShieldModeEndConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Shield Mode End event
 */
export interface ShieldModeEndEvent {
  /** An ID that identifies the broadcaster whose Shield Mode status was updated. */
  broadcaster_user_id: string
  /** The broadcaster's login name. */
  broadcaster_user_login: string
  /** The broadcaster's display name. */
  broadcaster_user_name: string
  /** An ID that identifies the moderator that updated the Shield Mode's status. If the broadcaster updated the status, this ID will be the same as broadcaster_user_id. */
  moderator_user_id: string
  /** The moderator's login name. */
  moderator_user_login: string
  /** The moderator's display name. */
  moderator_user_name: string
  /** The UTC timestamp (in RFC3339 format) of when the moderator deactivated Shield Mode. */
  ended_at: string
}

export const ShieldModeEndEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  moderator_user_id: z.string(),
  moderator_user_login: z.string(),
  moderator_user_name: z.string(),
  ended_at: z.string(),
})

// ============================================================================
// Shoutout Events
// ============================================================================

/**
 * Shoutout Create condition
 */
export interface ShoutoutCreateCondition {
  /** The User ID of the broadcaster. */
  broadcaster_user_id: string
  /** The User ID of the moderator. */
  moderator_user_id: string
}

export const ShoutoutCreateConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Shoutout Create event
 */
export interface ShoutoutCreateEvent {
  /** An ID that identifies the broadcaster that sent the Shoutout. */
  broadcaster_user_id: string
  /** The broadcaster's login name. */
  broadcaster_user_login: string
  /** The broadcaster's display name. */
  broadcaster_user_name: string
  /** An ID that identifies the broadcaster that received the Shoutout. */
  to_broadcaster_user_id: string
  /** The broadcaster's login name. */
  to_broadcaster_user_login: string
  /** The broadcaster's display name. */
  to_broadcaster_user_name: string
  /** An ID that identifies the moderator that sent the Shoutout. If the broadcaster sent the Shoutout, this ID is the same as the ID in broadcaster_user_id. */
  moderator_user_id: string
  /** The moderator's login name. */
  moderator_user_login: string
  /** The moderator's display name. */
  moderator_user_name: string
  /** The number of users that were watching the broadcaster's stream at the time of the Shoutout. */
  viewer_count: number
  /** The UTC timestamp (in RFC3339 format) of when the moderator sent the Shoutout. */
  started_at: string
  /** The UTC timestamp (in RFC3339 format) of when the broadcaster may send a Shoutout to a different broadcaster. */
  cooldown_ends_at: string
  /** The UTC timestamp (in RFC3339 format) of when the broadcaster may send another Shoutout to the broadcaster in to_broadcaster_user_id. */
  target_cooldown_ends_at: string
}

export const ShoutoutCreateEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  to_broadcaster_user_id: z.string(),
  to_broadcaster_user_login: z.string(),
  to_broadcaster_user_name: z.string(),
  moderator_user_id: z.string(),
  moderator_user_login: z.string(),
  moderator_user_name: z.string(),
  viewer_count: z.number().int(),
  started_at: z.string(),
  cooldown_ends_at: z.string(),
  target_cooldown_ends_at: z.string(),
})

/**
 * Shoutout Received condition
 */
export interface ShoutoutReceivedCondition {
  /** The User ID of the broadcaster. */
  broadcaster_user_id: string
  /** The User ID of the moderator. */
  moderator_user_id: string
}

export const ShoutoutReceivedConditionSchema = z.object({
  broadcaster_user_id: z.string(),
  moderator_user_id: z.string(),
})

/**
 * Shoutout Received event
 */
export interface ShoutoutReceivedEvent {
  /** An ID that identifies the broadcaster that received the Shoutout. */
  broadcaster_user_id: string
  /** The broadcaster's login name. */
  broadcaster_user_login: string
  /** The broadcaster's display name. */
  broadcaster_user_name: string
  /** An ID that identifies the broadcaster that sent the Shoutout. */
  from_broadcaster_user_id: string
  /** The broadcaster's login name. */
  from_broadcaster_user_login: string
  /** The broadcaster's display name. */
  from_broadcaster_user_name: string
  /** The number of users that were watching the from-broadcaster's stream at the time of the Shoutout. */
  viewer_count: number
  /** The UTC timestamp (in RFC3339 format) of when the moderator sent the Shoutout. */
  started_at: string
}

export const ShoutoutReceivedEventSchema = z.object({
  broadcaster_user_id: z.string(),
  broadcaster_user_login: z.string(),
  broadcaster_user_name: z.string(),
  from_broadcaster_user_id: z.string(),
  from_broadcaster_user_login: z.string(),
  from_broadcaster_user_name: z.string(),
  viewer_count: z.number().int(),
  started_at: z.string(),
})

// ============================================================================
// User Authorization Events
// ============================================================================

/**
 * User Authorization Grant event
 */
export interface UserAuthorizationGrantEvent {
  /** The client_id of the application that was granted user access. */
  client_id: string
  /** The user id for the user who has granted authorization for your client id. */
  user_id: string
  /** The user login for the user who has granted authorization for your client id. */
  user_login: string
  /** The user display name for the user who has granted authorization for your client id. */
  user_name: string
}

export const UserAuthorizationGrantEventSchema = z.object({
  client_id: z.string(),
  user_id: z.string(),
  user_login: z.string(),
  user_name: z.string(),
})

/**
 * User Authorization Revoke event
 */
export interface UserAuthorizationRevokeEvent {
  /** The client_id of the application with revoked user access. */
  client_id: string
  /** The user id for the user who has revoked authorization for your client id. */
  user_id: string
  /** The user login for the user who has revoked authorization for your client id. This is null if the user no longer exists. */
  user_login: string | null
  /** The user display name for the user who has revoked authorization for your client id. This is null if the user no longer exists. */
  user_name: string | null
}

export const UserAuthorizationRevokeEventSchema = z.object({
  client_id: z.string(),
  user_id: z.string(),
  user_login: z.string().nullable(),
  user_name: z.string().nullable(),
})

// ============================================================================
// Whisper Events
// ============================================================================

/**
 * Whisper Received event
 */
export interface WhisperReceivedEvent {
  /** The ID of the user sending the message. */
  from_user_id: string
  /** The name of the user sending the message. */
  from_user_name: string
  /** The login of the user sending the message. */
  from_user_login: string
  /** The ID of the user receiving the message. */
  to_user_id: string
  /** The name of the user receiving the message. */
  to_user_name: string
  /** The login of the user receiving the message. */
  to_user_login: string
  /** The whisper ID. */
  whisper_id: string
  /** Object containing whisper information. */
  whisper: {
    /** The body of the whisper message. */
    text: string
  }
}

export const WhisperReceivedEventSchema = z.object({
  from_user_id: z.string(),
  from_user_name: z.string(),
  from_user_login: z.string(),
  to_user_id: z.string(),
  to_user_name: z.string(),
  to_user_login: z.string(),
  whisper_id: z.string(),
  whisper: z.object({
    text: z.string(),
  }),
})
