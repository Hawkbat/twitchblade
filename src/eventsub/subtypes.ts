import * as z from 'zod'
import type { UserAccessTokenScopeSet } from "../auth/types.js"
import * as eventsub from "./types.js"

export type AllEventTypes = typeof ALL_SUBSCRIPTION_TYPES
export type EventTypeKeys = keyof AllEventTypes
export type EventTypeDefinition<K extends EventTypeKeys> = AllEventTypes[K]
export type EventTypeNames = AllEventTypes[EventTypeKeys]['type']
export type EventTypeVersions = AllEventTypes[EventTypeKeys]['version']
export type EventTypeByTypeAndVersion<TType extends EventTypeNames, TVersion extends EventTypeVersions> = {
    [K in EventTypeKeys]: EventTypeDefinition<K> extends EventSubscriptionType<TType, TVersion, infer _, infer _> ? EventTypeDefinition<K> : never
}[EventTypeKeys]

export type SubscriptionOfEventType<T extends EventTypeKeys> = {
    id: string
    type: EventTypeDefinition<T>['type']
    version: EventTypeDefinition<T>['version']
    status: string
    cost: number
    condition: z.infer<EventTypeDefinition<T>['condition']>
    transport: {
        method: 'webhook'
        callback: string
    } | {
        method: 'websocket'
        session_id: string
        connected_at?: string
        disconnected_at?: string
    }
    created_at: string
}

export type EventResultOf<K extends EventTypeKeys> = EventTypeDefinition<K> extends EventSubscriptionType<infer TType, infer TVersion, infer TConditionSchema, infer TEventSchema> ? {
    type: TType
    version: TVersion
    subscription: SubscriptionOfEventType<K>
    condition: TConditionSchema
    event: TEventSchema
} : never

export type AnyEventResult = {
    [K in EventTypeKeys]: EventResultOf<K>
}[EventTypeKeys]

export function getEventTypeByTypeAndVersion<TType extends EventTypeNames, TVersion extends EventTypeVersions>(type: TType, version: TVersion): EventTypeByTypeAndVersion<TType, TVersion> | null {
    for (const key in ALL_SUBSCRIPTION_TYPES) {
        const eventType = ALL_SUBSCRIPTION_TYPES[key as EventTypeKeys]
        if (eventType.type === type && eventType.version === version) {
            return eventType as EventTypeByTypeAndVersion<TType, TVersion>
        }
    }
    return null
}

export interface EventSubscriptionType<TType extends string, TVersion extends string, TCondition extends Record<string, any>, TEvent extends Record<string, any>> {
    type: TType
    version: TVersion
    auth: {
        appAccessToken?: boolean
        appScopes?: UserAccessTokenScopeSet
        userAccessToken?: boolean
        userScopes?: UserAccessTokenScopeSet
    }
    condition: z.ZodType<TCondition>
    event: z.ZodType<TEvent>
}

function defineEventSubscriptionType<TType extends string, TVersion extends string, TCondition extends Record<string, any>, TEvent extends Record<string, any>>(
    definition: EventSubscriptionType<TType, TVersion, TCondition, TEvent>,
): EventSubscriptionType<TType, TVersion, TCondition, TEvent> {
    return definition
}

export const AutomodMessageHold = defineEventSubscriptionType<'automod.message.hold', '1', eventsub.AutomodMessageHoldCondition, eventsub.AutomodMessageHoldEvent>({
    type: 'automod.message.hold',
    version: '1',
    auth: {
        appAccessToken: true,
        appScopes: 'moderator:manage:automod',
        userAccessToken: true,
        userScopes: 'moderator:manage:automod',
    },
    condition: eventsub.AutomodMessageHoldConditionSchema,
    event: eventsub.AutomodMessageHoldEventSchema,
})

export const AutomodMessageHoldV2 = defineEventSubscriptionType<'automod.message.hold', '2', eventsub.AutomodMessageHoldCondition, eventsub.AutomodMessageHoldEventV2>({
    type: 'automod.message.hold',
    version: '2',
    auth: {
        appAccessToken: true,
        userAccessToken: true,
        userScopes: 'moderator:manage:automod',
    },
    condition: eventsub.AutomodMessageHoldConditionSchema,
    event: eventsub.AutomodMessageHoldEventV2Schema,
})

export const AutomodMessageUpdate = defineEventSubscriptionType<'automod.message.update', '1', eventsub.AutomodMessageUpdateCondition, eventsub.AutomodMessageUpdateEvent>({
    type: 'automod.message.update',
    version: '1',
    auth: {
        appAccessToken: true,
        appScopes: 'moderator:manage:automod',
        userAccessToken: true,
        userScopes: 'moderator:manage:automod',
    },
    condition: eventsub.AutomodMessageUpdateConditionSchema,
    event: eventsub.AutomodMessageUpdateEventSchema,
})

export const AutomodMessageUpdateV2 = defineEventSubscriptionType<'automod.message.update', '2', eventsub.AutomodMessageUpdateCondition, eventsub.AutomodMessageUpdateEventV2>({
    type: 'automod.message.update',
    version: '2',
    auth: {
        appAccessToken: true,
        userAccessToken: true,
        userScopes: 'moderator:manage:automod',
    },
    condition: eventsub.AutomodMessageUpdateConditionSchema,
    event: eventsub.AutomodMessageUpdateEventV2Schema,
})

export const AutomodSettingsUpdate = defineEventSubscriptionType<'automod.settings.update', '1', eventsub.AutomodSettingsUpdateCondition, eventsub.AutomodSettingsUpdateEvent>({
    type: 'automod.settings.update',
    version: '1',
    auth: {
        appAccessToken: true,
        appScopes: 'moderator:read:automod_settings',
        userAccessToken: true,
        userScopes: 'moderator:read:automod_settings',
    },
    condition: eventsub.AutomodSettingsUpdateConditionSchema,
    event: eventsub.AutomodSettingsUpdateEventSchema,
})

export const AutomodTermsUpdate = defineEventSubscriptionType<'automod.terms.update', '1', eventsub.AutomodTermsUpdateCondition, eventsub.AutomodTermsUpdateEvent>({
    type: 'automod.terms.update',
    version: '1',
    auth: {
        appAccessToken: true,
        appScopes: 'moderator:manage:automod',
        userAccessToken: true,
        userScopes: 'moderator:manage:automod',
    },
    condition: eventsub.AutomodTermsUpdateConditionSchema,
    event: eventsub.AutomodTermsUpdateEventSchema,
})

export const ChannelBitsUse = defineEventSubscriptionType<'channel.bits.use', '1', eventsub.ChannelBitsUseCondition, eventsub.ChannelBitsUseEvent>({
    type: 'channel.bits.use',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'bits:read',
    },
    condition: eventsub.ChannelBitsUseConditionSchema,
    event: eventsub.ChannelBitsUseEventSchema,
})

export const ChannelUpdate = defineEventSubscriptionType<'channel.update', '2', eventsub.ChannelUpdateCondition, eventsub.ChannelUpdateEvent>({
    type: 'channel.update',
    version: '2',
    auth: {},
    condition: eventsub.ChannelUpdateConditionSchema,
    event: eventsub.ChannelUpdateEventSchema,
})

export const ChannelFollow = defineEventSubscriptionType<'channel.follow', '2', eventsub.ChannelFollowCondition, eventsub.ChannelFollowEvent>({
    type: 'channel.follow',
    version: '2',
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:read:followers',
    },
    condition: eventsub.ChannelFollowConditionSchema,
    event: eventsub.ChannelFollowEventSchema,
})

export const ChannelAdBreakBegin = defineEventSubscriptionType<'channel.ad_break.begin', '1', eventsub.ChannelAdBreakBeginCondition, eventsub.ChannelAdBreakBeginEvent>({
    type: 'channel.ad_break.begin',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:ads',
    },
    condition: eventsub.ChannelAdBreakBeginConditionSchema,
    event: eventsub.ChannelAdBreakBeginEventSchema,
})

export const ChannelChatClear = defineEventSubscriptionType<'channel.chat.clear', '1', eventsub.ChannelChatClearCondition, eventsub.ChannelChatClearEvent>({
    type: 'channel.chat.clear',
    version: '1',
    auth: {
        appAccessToken: true,
        appScopes: { all: ['user:bot', { any: ['channel:bot', 'moderator:read:chat_messages'] }] },
        userAccessToken: true,
        userScopes: 'user:read:chat',
    },
    condition: eventsub.ChannelChatClearConditionSchema,
    event: eventsub.ChannelChatClearEventSchema,
})

export const ChannelChatClearUserMessages = defineEventSubscriptionType<'channel.chat.clear_user_messages', '1', eventsub.ChannelChatClearUserMessagesCondition, eventsub.ChannelChatClearUserMessagesEvent>({
    type: 'channel.chat.clear_user_messages',
    version: '1',
    auth: {
        appAccessToken: true,
        appScopes: { all: ['user:bot', { any: ['channel:bot', 'moderator:read:chat_messages'] }] },
        userAccessToken: true,
        userScopes: 'user:read:chat',
    },
    condition: eventsub.ChannelChatClearUserMessagesConditionSchema,
    event: eventsub.ChannelChatClearUserMessagesEventSchema,
})

export const ChannelChatMessage = defineEventSubscriptionType<'channel.chat.message', '1', eventsub.ChannelChatMessageCondition, eventsub.ChannelChatMessageEvent>({
    type: 'channel.chat.message',
    version: '1',
    auth: {
        appAccessToken: true,
        appScopes: { all: ['user:bot', { any: ['channel:bot', 'moderator:read:chat_messages'] }] },
        userAccessToken: true,
        userScopes: 'user:read:chat',
    },
    condition: eventsub.ChannelChatMessageConditionSchema,
    event: eventsub.ChannelChatMessageEventSchema,
})

export const ChannelChatMessageDelete = defineEventSubscriptionType<'channel.chat.message_delete', '1', eventsub.ChannelChatMessageDeleteCondition, eventsub.ChannelChatMessageDeleteEvent>({
    type: 'channel.chat.message_delete',
    version: '1',
    auth: {
        appAccessToken: true,
        appScopes: { all: ['user:bot', { any: ['channel:bot', 'moderator:read:chat_messages'] }] },
        userAccessToken: true,
        userScopes: 'user:read:chat',
    },
    condition: eventsub.ChannelChatMessageDeleteConditionSchema,
    event: eventsub.ChannelChatMessageDeleteEventSchema,
})

export const ChannelChatNotification = defineEventSubscriptionType<'channel.chat.notification', '1', eventsub.ChannelChatNotificationCondition, eventsub.ChannelChatNotificationEvent>({
    type: 'channel.chat.notification',
    version: '1',
    auth: {
        appAccessToken: true,
        appScopes: { all: ['user:bot', { any: ['channel:bot', 'moderator:read:chat_messages'] }] },
        userAccessToken: true,
        userScopes: 'user:read:chat',
    },
    condition: eventsub.ChannelChatNotificationConditionSchema,
    event: eventsub.ChannelChatNotificationEventSchema,
})

export const ChannelChatSettingsUpdate = defineEventSubscriptionType<'channel.chat_settings.update', '1', eventsub.ChannelChatSettingsUpdateCondition, eventsub.ChannelChatSettingsUpdateEvent>({
    type: 'channel.chat_settings.update',
    version: '1',
    auth: {
        appAccessToken: true,
        appScopes: { all: ['user:bot', { any: ['channel:bot', 'moderator:read:chat_messages'] }] },
        userAccessToken: true,
        userScopes: 'user:read:chat',
    },
    condition: eventsub.ChannelChatSettingsUpdateConditionSchema,
    event: eventsub.ChannelChatSettingsUpdateEventSchema,
})

export const ChannelChatUserMessageHold = defineEventSubscriptionType<'channel.chat.user_message_hold', '1', eventsub.ChannelChatUserMessageHoldCondition, eventsub.ChannelChatUserMessageHoldEvent>({
    type: 'channel.chat.user_message_hold',
    version: '1',
    auth: {
        appAccessToken: true,
        appScopes: 'user:bot',
        userAccessToken: true,
        userScopes: 'user:read:chat',
    },
    condition: eventsub.ChannelChatUserMessageHoldConditionSchema,
    event: eventsub.ChannelChatUserMessageHoldEventSchema,
})

export const ChannelChatUserMessageUpdate = defineEventSubscriptionType<'channel.chat.user_message_update', '1', eventsub.ChannelChatUserMessageUpdateCondition, eventsub.ChannelChatUserMessageUpdateEvent>({
    type: 'channel.chat.user_message_update',
    version: '1',
    auth: {
        appAccessToken: true,
        appScopes: 'user:bot',
        userAccessToken: true,
        userScopes: 'user:read:chat',
    },
    condition: eventsub.ChannelChatUserMessageUpdateConditionSchema,
    event: eventsub.ChannelChatUserMessageUpdateEventSchema,
})

export const ChannelSharedChatSessionBegin = defineEventSubscriptionType<'channel.shared_chat.begin', '1', eventsub.ChannelSharedChatSessionBeginCondition, eventsub.ChannelSharedChatSessionBeginEvent>({
    type: 'channel.shared_chat.begin',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'user:read:chat',
    },
    condition: eventsub.ChannelSharedChatSessionBeginConditionSchema,
    event: eventsub.ChannelSharedChatBeginEventSchema,
})

export const ChannelSharedChatSessionUpdate = defineEventSubscriptionType<'channel.shared_chat.update', '1', eventsub.ChannelSharedChatSessionUpdateCondition, eventsub.ChannelSharedChatUpdateEvent>({
    type: 'channel.shared_chat.update',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'user:read:chat',
    },
    condition: eventsub.ChannelSharedChatSessionUpdateConditionSchema,
    event: eventsub.ChannelSharedChatUpdateEventSchema,
})

export const ChannelSharedChatSessionEnd = defineEventSubscriptionType<'channel.shared_chat.end', '1', eventsub.ChannelSharedChatSessionEndCondition, eventsub.ChannelSharedChatEndEvent>({
    type: 'channel.shared_chat.end',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'user:read:chat',
    },
    condition: eventsub.ChannelSharedChatEndConditionSchema,
    event: eventsub.ChannelSharedChatEndEventSchema,
})

export const ChannelSubscribe = defineEventSubscriptionType<'channel.subscribe', '1', eventsub.ChannelSubscribeCondition, eventsub.ChannelSubscribeEvent>({
    type: 'channel.subscribe',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:subscriptions',
    },
    condition: eventsub.ChannelSubscribeConditionSchema,
    event: eventsub.ChannelSubscribeEventSchema,
})

export const ChannelSubscriptionEnd = defineEventSubscriptionType<'channel.subscription.end', '1', eventsub.ChannelSubscriptionEndCondition, eventsub.ChannelSubscriptionEndEvent>({
    type: 'channel.subscription.end',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:subscriptions',
    },
    condition: eventsub.ChannelSubscriptionEndConditionSchema,
    event: eventsub.ChannelSubscriptionEndEventSchema,
})

export const ChannelSubscriptionGift = defineEventSubscriptionType<'channel.subscription.gift', '1', eventsub.ChannelSubscriptionGiftCondition, eventsub.ChannelSubscriptionGiftEvent>({
    type: 'channel.subscription.gift',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:subscriptions',
    },
    condition: eventsub.ChannelSubscriptionGiftConditionSchema,
    event: eventsub.ChannelSubscriptionGiftEventSchema,
})

export const ChannelSubscriptionMessage = defineEventSubscriptionType<'channel.subscription.message', '1', eventsub.ChannelSubscriptionMessageCondition, eventsub.ChannelSubscriptionMessageEvent>({
    type: 'channel.subscription.message',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:subscriptions',
    },
    condition: eventsub.ChannelSubscriptionMessageConditionSchema,
    event: eventsub.ChannelSubscriptionMessageEventSchema,
})

export const ChannelCheer = defineEventSubscriptionType<'channel.cheer', '1', eventsub.ChannelCheerCondition, eventsub.ChannelCheerEvent>({
    type: 'channel.cheer',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'bits:read',
    },
    condition: eventsub.ChannelCheerConditionSchema,
    event: eventsub.ChannelCheerEventSchema,
})

export const ChannelRaid = defineEventSubscriptionType<'channel.raid', '1', eventsub.ChannelRaidCondition, eventsub.ChannelRaidEvent>({
    type: 'channel.raid',
    version: '1',
    auth: {},
    condition: eventsub.ChannelRaidConditionSchema,
    event: eventsub.ChannelRaidEventSchema,
})

export const ChannelBan = defineEventSubscriptionType<'channel.ban', '1', eventsub.ChannelBanCondition, eventsub.ChannelBanEvent>({
    type: 'channel.ban',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:moderate',
    },
    condition: eventsub.ChannelBanConditionSchema,
    event: eventsub.ChannelBanEventSchema,
})

export const ChannelUnban = defineEventSubscriptionType<'channel.unban', '1', eventsub.ChannelUnbanCondition, eventsub.ChannelUnbanEvent>({
    type: 'channel.unban',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:moderate',
    },
    condition: eventsub.ChannelUnbanConditionSchema,
    event: eventsub.ChannelUnbanEventSchema,
})

export const ChannelUnbanRequestCreate = defineEventSubscriptionType<'channel.unban_request.create', '1', eventsub.ChannelUnbanRequestCreateCondition, eventsub.ChannelUnbanRequestCreateEvent>({
    type: 'channel.unban_request.create',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['moderator:read:unban_requests', 'moderator:manage:unban_requests'] },
    },
    condition: eventsub.ChannelUnbanRequestCreateConditionSchema,
    event: eventsub.ChannelUnbanRequestCreateEventSchema,
})

export const ChannelUnbanRequestResolve = defineEventSubscriptionType<'channel.unban_request.resolve', '1', eventsub.ChannelUnbanRequestResolveCondition, eventsub.ChannelUnbanRequestResolveEvent>({
    type: 'channel.unban_request.resolve',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['moderator:read:unban_requests', 'moderator:manage:unban_requests'] },
    },
    condition: eventsub.ChannelUnbanRequestResolveConditionSchema,
    event: eventsub.ChannelUnbanRequestResolveEventSchema,
})

export const ChannelModerate = defineEventSubscriptionType<'channel.moderate', '1', eventsub.ChannelModerateCondition, eventsub.ChannelModerateEvent>({
    type: 'channel.moderate',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:read:chat_messages',
    },
    condition: eventsub.ChannelModerateConditionSchema,
    event: eventsub.ChannelModerateEventSchema,
})

export const ChannelModerateV2 = defineEventSubscriptionType<'channel.moderate', '2', eventsub.ChannelModerateCondition, eventsub.ChannelModerateEventV2>({
    type: 'channel.moderate',
    version: '2',
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:read:chat_messages',
    },
    condition: eventsub.ChannelModerateConditionSchema,
    event: eventsub.ChannelModerateEventV2Schema,
})

export const ChannelModeratorAdd = defineEventSubscriptionType<'channel.moderator.add', '1', eventsub.ChannelModeratorAddCondition, eventsub.ChannelModeratorAddEvent>({
    type: 'channel.moderator.add',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'moderation:read',
    },
    condition: eventsub.ChannelModeratorAddConditionSchema,
    event: eventsub.ChannelModeratorAddEventSchema,
})

export const ChannelModeratorRemove = defineEventSubscriptionType<'channel.moderator.remove', '1', eventsub.ChannelModeratorRemoveCondition, eventsub.ChannelModeratorRemoveEvent>({
    type: 'channel.moderator.remove',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'moderation:read',
    },
    condition: eventsub.ChannelModeratorRemoveConditionSchema,
    event: eventsub.ChannelModeratorRemoveEventSchema,
})

export const ChannelGuestStarSessionBegin = defineEventSubscriptionType<'channel.guest_star_session.begin', 'beta', eventsub.ChannelGuestStarSessionBeginCondition, eventsub.ChannelGuestStarSessionBeginEvent>({
    type: 'channel.guest_star_session.begin',
    version: 'beta',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:guest_star', 'channel:manage:guest_star', 'moderator:read:guest_star', 'moderator:manage:guest_star'] },
    },
    condition: eventsub.ChannelGuestStarSessionBeginConditionSchema,
    event: eventsub.ChannelGuestStarSessionBeginEventSchema,
})

export const ChannelGuestStarSessionEnd = defineEventSubscriptionType<'channel.guest_star_session.end', 'beta', eventsub.ChannelGuestStarSessionEndCondition, eventsub.ChannelGuestStarSessionEndEvent>({
    type: 'channel.guest_star_session.end',
    version: 'beta',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:guest_star', 'channel:manage:guest_star', 'moderator:read:guest_star', 'moderator:manage:guest_star'] },
    },
    condition: eventsub.ChannelGuestStarSessionEndConditionSchema,
    event: eventsub.ChannelGuestStarSessionEndEventSchema,
})

export const ChannelGuestStarGuestUpdate = defineEventSubscriptionType<'channel.guest_star_guest.update', 'beta', eventsub.ChannelGuestStarGuestUpdateCondition, eventsub.ChannelGuestStarGuestUpdateEvent>({
    type: 'channel.guest_star_guest.update',
    version: 'beta',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:guest_star', 'channel:manage:guest_star', 'moderator:read:guest_star', 'moderator:manage:guest_star'] },
    },
    condition: eventsub.ChannelGuestStarGuestUpdateConditionSchema,
    event: eventsub.ChannelGuestStarGuestUpdateEventSchema,
})

export const ChannelGuestStarSettingsUpdate = defineEventSubscriptionType<'channel.guest_star_settings.update', 'beta', eventsub.ChannelGuestStarSettingsUpdateCondition, eventsub.ChannelGuestStarSettingsUpdateEvent>({
    type: 'channel.guest_star_settings.update',
    version: 'beta',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:guest_star', 'channel:manage:guest_star', 'moderator:read:guest_star', 'moderator:manage:guest_star'] },
    },
    condition: eventsub.ChannelGuestStarSettingsUpdateConditionSchema,
    event: eventsub.ChannelGuestStarSettingsUpdateEventSchema,
})

export const ChannelPointsAutomaticRewardRedemptionAdd = defineEventSubscriptionType<'channel.channel_points_automatic_reward_redemption.add', '1', eventsub.ChannelPointsAutomaticRewardRedemptionAddCondition, eventsub.ChannelPointsAutomaticRewardRedemptionAddEvent>({
    type: 'channel.channel_points_automatic_reward_redemption.add',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:redemptions',
    },
    condition: eventsub.ChannelPointsAutomaticRewardRedemptionAddConditionSchema,
    event: eventsub.ChannelPointsAutomaticRewardRedemptionAddEventSchema,
})

export const ChannelPointsAutomaticRewardRedemptionAddV2 = defineEventSubscriptionType<'channel.channel_points_automatic_reward_redemption.add', '2', eventsub.ChannelPointsAutomaticRewardRedemptionAddCondition, eventsub.ChannelPointsAutomaticRewardRedemptionAddEventV2>({
    type: 'channel.channel_points_automatic_reward_redemption.add',
    version: '2',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:redemptions',
    },
    condition: eventsub.ChannelPointsAutomaticRewardRedemptionAddConditionSchema,
    event: eventsub.ChannelPointsAutomaticRewardRedemptionAddEventV2Schema,
})

export const ChannelPointsCustomRewardAdd = defineEventSubscriptionType<'channel.channel_points_custom_reward.add', '1', eventsub.ChannelPointsCustomRewardAddCondition, eventsub.ChannelPointsCustomRewardAddEvent>({
    type: 'channel.channel_points_custom_reward.add',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:redemptions', 'channel:manage:redemptions'] },
    },
    condition: eventsub.ChannelPointsCustomRewardAddConditionSchema,
    event: eventsub.ChannelPointsCustomRewardAddEventSchema,
})

export const ChannelPointsCustomRewardUpdate = defineEventSubscriptionType<'channel.channel_points_custom_reward.update', '1', eventsub.ChannelPointsCustomRewardUpdateCondition, eventsub.ChannelPointsCustomRewardUpdateEvent>({
    type: 'channel.channel_points_custom_reward.update',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:redemptions', 'channel:manage:redemptions'] },
    },
    condition: eventsub.ChannelPointsCustomRewardUpdateConditionSchema,
    event: eventsub.ChannelPointsCustomRewardUpdateEventSchema,
})

export const ChannelPointsCustomRewardRemove = defineEventSubscriptionType<'channel.channel_points_custom_reward.remove', '1', eventsub.ChannelPointsCustomRewardRemoveCondition, eventsub.ChannelPointsCustomRewardRemoveEvent>({
    type: 'channel.channel_points_custom_reward.remove',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:redemptions', 'channel:manage:redemptions'] },
    },
    condition: eventsub.ChannelPointsCustomRewardRemoveConditionSchema,
    event: eventsub.ChannelPointsCustomRewardRemoveEventSchema,
})

export const ChannelPointsCustomRewardRedemptionAdd = defineEventSubscriptionType<'channel.channel_points_custom_reward_redemption.add', '1', eventsub.ChannelPointsCustomRewardRedemptionAddCondition, eventsub.ChannelPointsCustomRewardRedemptionAddEvent>({
    type: 'channel.channel_points_custom_reward_redemption.add',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:redemptions', 'channel:manage:redemptions'] },
    },
    condition: eventsub.ChannelPointsCustomRewardRedemptionAddConditionSchema,
    event: eventsub.ChannelPointsCustomRewardRedemptionAddEventSchema,
})

export const ChannelPointsCustomRewardRedemptionUpdate = defineEventSubscriptionType<'channel.channel_points_custom_reward_redemption.update', '1', eventsub.ChannelPointsCustomRewardRedemptionUpdateCondition, eventsub.ChannelPointsCustomRewardRedemptionUpdateEvent>({
    type: 'channel.channel_points_custom_reward_redemption.update',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:redemptions', 'channel:manage:redemptions'] },
    },
    condition: eventsub.ChannelPointsCustomRewardRedemptionUpdateConditionSchema,
    event: eventsub.ChannelPointsCustomRewardRedemptionUpdateEventSchema,
})

export const ChannelPollBegin = defineEventSubscriptionType<'channel.poll.begin', '1', eventsub.ChannelPollBeginCondition, eventsub.ChannelPollBeginEvent>({
    type: 'channel.poll.begin',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:polls', 'channel:manage:polls'] },
    },
    condition: eventsub.ChannelPollBeginConditionSchema,
    event: eventsub.ChannelPollBeginEventSchema,
})

export const ChannelPollProgress = defineEventSubscriptionType<'channel.poll.progress', '1', eventsub.ChannelPollProgressCondition, eventsub.ChannelPollProgressEvent>({
    type: 'channel.poll.progress',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:polls', 'channel:manage:polls'] },
    },
    condition: eventsub.ChannelPollProgressConditionSchema,
    event: eventsub.ChannelPollProgressEventSchema,
})

export const ChannelPollEnd = defineEventSubscriptionType<'channel.poll.end', '1', eventsub.ChannelPollEndCondition, eventsub.ChannelPollEndEvent>({
    type: 'channel.poll.end',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:polls', 'channel:manage:polls'] },
    },
    condition: eventsub.ChannelPollEndConditionSchema,
    event: eventsub.ChannelPollEndEventSchema,
})

export const ChannelPredictionBegin = defineEventSubscriptionType<'channel.prediction.begin', '1', eventsub.ChannelPredictionBeginCondition, eventsub.ChannelPredictionBeginEvent>({
    type: 'channel.prediction.begin',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:predictions', 'channel:manage:predictions'] },
    },
    condition: eventsub.ChannelPredictionBeginConditionSchema,
    event: eventsub.ChannelPredictionBeginEventSchema,
})

export const ChannelPredictionProgress = defineEventSubscriptionType<'channel.prediction.progress', '1', eventsub.ChannelPredictionProgressCondition, eventsub.ChannelPredictionProgressEvent>({
    type: 'channel.prediction.progress',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:predictions', 'channel:manage:predictions'] },
    },
    condition: eventsub.ChannelPredictionProgressConditionSchema,
    event: eventsub.ChannelPredictionProgressEventSchema,
})

export const ChannelPredictionLock = defineEventSubscriptionType<'channel.prediction.lock', '1', eventsub.ChannelPredictionLockCondition, eventsub.ChannelPredictionLockEvent>({
    type: 'channel.prediction.lock',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:predictions', 'channel:manage:predictions'] },
    },
    condition: eventsub.ChannelPredictionLockConditionSchema,
    event: eventsub.ChannelPredictionLockEventSchema,
})

export const ChannelPredictionEnd = defineEventSubscriptionType<'channel.prediction.end', '1', eventsub.ChannelPredictionEndCondition, eventsub.ChannelPredictionEndEvent>({
    type: 'channel.prediction.end',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:predictions', 'channel:manage:predictions'] },
    },
    condition: eventsub.ChannelPredictionEndConditionSchema,
    event: eventsub.ChannelPredictionEndEventSchema,
})

export const ChannelSuspiciousUserMessage = defineEventSubscriptionType<'channel.suspicious_user.message', '1', eventsub.ChannelSuspiciousUserMessageCondition, eventsub.ChannelSuspiciousUserMessageEvent>({
    type: 'channel.suspicious_user.message',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:read:suspicious_users',
    },
    condition: eventsub.ChannelSuspiciousUserMessageConditionSchema,
    event: eventsub.ChannelSuspiciousUserMessageEventSchema,
})

export const ChannelSuspiciousUserUpdate = defineEventSubscriptionType<'channel.suspicious_user.update', '1', eventsub.ChannelSuspiciousUserUpdateCondition, eventsub.ChannelSuspiciousUserUpdateEvent>({
    type: 'channel.suspicious_user.update',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:read:suspicious_users',
    },
    condition: eventsub.ChannelSuspiciousUserUpdateConditionSchema,
    event: eventsub.ChannelSuspiciousUserUpdateEventSchema,
})

export const ChannelVIPAdd = defineEventSubscriptionType<'channel.vip.add', '1', eventsub.ChannelVIPAddCondition, eventsub.ChannelVIPAddEvent>({
    type: 'channel.vip.add',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:vips', 'channel:manage:vips'] },
    },
    condition: eventsub.ChannelVIPAddConditionSchema,
    event: eventsub.ChannelVIPAddEventSchema,
})

export const ChannelVIPRemove = defineEventSubscriptionType<'channel.vip.remove', '1', eventsub.ChannelVIPRemoveCondition, eventsub.ChannelVIPRemoveEvent>({
    type: 'channel.vip.remove',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:vips', 'channel:manage:vips'] },
    },
    condition: eventsub.ChannelVIPRemoveConditionSchema,
    event: eventsub.ChannelVIPRemoveEventSchema,
})

export const ChannelWarningAcknowledgement = defineEventSubscriptionType<'channel.warning.acknowledge', '1', eventsub.ChannelWarningAcknowledgementCondition, eventsub.ChannelWarningAcknowledgementEvent>({
    type: 'channel.warning.acknowledge',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['moderator:read:warnings', 'moderator:manage:warnings'] },
    },
    condition: eventsub.ChannelWarningAcknowledgementConditionSchema,
    event: eventsub.ChannelWarningAcknowledgementEventSchema,
})

export const ChannelWarningSend = defineEventSubscriptionType<'channel.warning.send', '1', eventsub.ChannelWarningSendCondition, eventsub.ChannelWarningSendEvent>({
    type: 'channel.warning.send',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['moderator:read:warnings', 'moderator:manage:warnings'] },
    },
    condition: eventsub.ChannelWarningSendConditionSchema,
    event: eventsub.ChannelWarningSendEventSchema,
})

export const CharityDonation = defineEventSubscriptionType<'channel.charity_campaign.donate', '1', eventsub.CharityDonationCondition, eventsub.CharityDonationEvent>({
    type: 'channel.charity_campaign.donate',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:charity',
    },
    condition: eventsub.CharityDonationConditionSchema,
    event: eventsub.CharityDonationEventSchema,
})

export const CharityCampaignStart = defineEventSubscriptionType<'channel.charity_campaign.start', '1', eventsub.CharityCampaignStartCondition, eventsub.CharityCampaignStartEvent>({
    type: 'channel.charity_campaign.start',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:charity',
    },
    condition: eventsub.CharityCampaignStartConditionSchema,
    event: eventsub.CharityCampaignStartEventSchema,
})

export const CharityCampaignProgress = defineEventSubscriptionType<'channel.charity_campaign.progress', '1', eventsub.CharityCampaignProgressCondition, eventsub.CharityCampaignProgressEvent>({
    type: 'channel.charity_campaign.progress',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:charity',
    },
    condition: eventsub.CharityCampaignProgressConditionSchema,
    event: eventsub.CharityCampaignProgressEventSchema,
})

export const CharityCampaignStop = defineEventSubscriptionType<'channel.charity_campaign.stop', '1', eventsub.CharityCampaignStopCondition, eventsub.CharityCampaignStopEvent>({
    type: 'channel.charity_campaign.stop',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:charity',
    },
    condition: eventsub.CharityCampaignStopConditionSchema,
    event: eventsub.CharityCampaignStopEventSchema,
})

export const ConduitShardDisabled = defineEventSubscriptionType<'conduit.shard.disabled', '1', eventsub.ConduitShardDisabledCondition, eventsub.ConduitShardDisabledEvent>({
    type: 'conduit.shard.disabled',
    version: '1',
    auth: {},
    condition: eventsub.ConduitShardDisabledConditionSchema,
    event: eventsub.ConduitShardDisabledEventSchema,
})

export const DropEntitlementGrant = defineEventSubscriptionType<'drop.entitlement.grant', '1', eventsub.DropEntitlementGrantCondition, eventsub.DropEntitlementGrantEvent>({
    type: 'drop.entitlement.grant',
    version: '1',
    auth: {},
    condition: eventsub.DropEntitlementGrantConditionSchema,
    event: eventsub.DropEntitlementGrantEventSchema,
})

export const ExtensionBitsTransactionCreate = defineEventSubscriptionType<'extension.bits_transaction.create', '1', eventsub.ExtensionBitsTransactionCreateCondition, eventsub.ExtensionBitsTransactionCreateEvent>({
    type: 'extension.bits_transaction.create',
    version: '1',
    auth: {},
    condition: eventsub.ExtensionBitsTransactionCreateConditionSchema,
    event: eventsub.ExtensionBitsTransactionCreateEventSchema,
})

export const GoalBegin = defineEventSubscriptionType<'channel.goal.begin', '1', eventsub.GoalBeginCondition, eventsub.GoalBeginEvent>({
    type: 'channel.goal.begin',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:goals',
    },
    condition: eventsub.GoalBeginConditionSchema,
    event: eventsub.GoalBeginEventSchema,
})

export const GoalProgress = defineEventSubscriptionType<'channel.goal.progress', '1', eventsub.GoalProgressCondition, eventsub.GoalProgressEvent>({
    type: 'channel.goal.progress',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:goals',
    },
    condition: eventsub.GoalProgressConditionSchema,
    event: eventsub.GoalProgressEventSchema,
})

export const GoalEnd = defineEventSubscriptionType<'channel.goal.end', '1', eventsub.GoalEndCondition, eventsub.GoalEndEvent>({
    type: 'channel.goal.end',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:goals',
    },
    condition: eventsub.GoalEndConditionSchema,
    event: eventsub.GoalEndEventSchema,
})

export const HypeTrainBegin = defineEventSubscriptionType<'channel.hype_train.begin', '1', eventsub.HypeTrainBeginCondition, eventsub.HypeTrainBeginEvent>({
    type: 'channel.hype_train.begin',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:hype_train',
    },
    condition: eventsub.HypeTrainBeginConditionSchema,
    event: eventsub.HypeTrainBeginEventSchema,
})

export const HypeTrainBeginV2 = defineEventSubscriptionType<'channel.hype_train.begin', '2', eventsub.HypeTrainBeginCondition, eventsub.HypeTrainBeginEventV2>({
    type: 'channel.hype_train.begin',
    version: '2',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:hype_train',
    },
    condition: eventsub.HypeTrainBeginConditionSchema,
    event: eventsub.HypeTrainBeginEventV2Schema,
})

export const HypeTrainProgress = defineEventSubscriptionType<'channel.hype_train.progress', '1', eventsub.HypeTrainProgressCondition, eventsub.HypeTrainProgressEvent>({
    type: 'channel.hype_train.progress',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:hype_train',
    },
    condition: eventsub.HypeTrainProgressConditionSchema,
    event: eventsub.HypeTrainProgressEventSchema,
})

export const HypeTrainProgressV2 = defineEventSubscriptionType<'channel.hype_train.progress', '2', eventsub.HypeTrainProgressCondition, eventsub.HypeTrainProgressEventV2>({
    type: 'channel.hype_train.progress',
    version: '2',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:hype_train',
    },
    condition: eventsub.HypeTrainProgressConditionSchema,
    event: eventsub.HypeTrainProgressEventV2Schema,
})

export const HypeTrainEnd = defineEventSubscriptionType<'channel.hype_train.end', '1', eventsub.HypeTrainEndCondition, eventsub.HypeTrainEndEvent>({
    type: 'channel.hype_train.end',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:hype_train',
    },
    condition: eventsub.HypeTrainEndConditionSchema,
    event: eventsub.HypeTrainEndEventSchema,
})

export const HypeTrainEndV2 = defineEventSubscriptionType<'channel.hype_train.end', '2', eventsub.HypeTrainEndCondition, eventsub.HypeTrainEndEventV2>({
    type: 'channel.hype_train.end',
    version: '2',
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:hype_train',
    },
    condition: eventsub.HypeTrainEndConditionSchema,
    event: eventsub.HypeTrainEndEventV2Schema,
})

export const ShieldModeBegin = defineEventSubscriptionType<'channel.shield_mode.begin', '1', eventsub.ShieldModeBeginCondition, eventsub.ShieldModeBeginEvent>({
    type: 'channel.shield_mode.begin',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['moderator:read:shield_mode', 'moderator:manage:shield_mode'] },
    },
    condition: eventsub.ShieldModeBeginConditionSchema,
    event: eventsub.ShieldModeBeginEventSchema,
})

export const ShieldModeEnd = defineEventSubscriptionType<'channel.shield_mode.end', '1', eventsub.ShieldModeEndCondition, eventsub.ShieldModeEndEvent>({
    type: 'channel.shield_mode.end',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['moderator:read:shield_mode', 'moderator:manage:shield_mode'] },
    },
    condition: eventsub.ShieldModeEndConditionSchema,
    event: eventsub.ShieldModeEndEventSchema,
})

export const ShoutoutCreate = defineEventSubscriptionType<'channel.shoutout.create', '1', eventsub.ShoutoutCreateCondition, eventsub.ShoutoutCreateEvent>({
    type: 'channel.shoutout.create',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['moderator:read:shoutouts', 'moderator:manage:shoutouts'] },
    },
    condition: eventsub.ShoutoutCreateConditionSchema,
    event: eventsub.ShoutoutCreateEventSchema,
})

export const ShoutoutReceived = defineEventSubscriptionType<'channel.shoutout.receive', '1', eventsub.ShoutoutReceivedCondition, eventsub.ShoutoutReceivedEvent>({
    type: 'channel.shoutout.receive',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['moderator:read:shoutouts', 'moderator:manage:shoutouts'] },
    },
    condition: eventsub.ShoutoutReceivedConditionSchema,
    event: eventsub.ShoutoutReceivedEventSchema,
})

export const StreamOnline = defineEventSubscriptionType<'stream.online', '1', eventsub.StreamOnlineCondition, eventsub.StreamOnlineEvent>({
    type: 'stream.online',
    version: '1',
    auth: {},
    condition: eventsub.StreamOnlineConditionSchema,
    event: eventsub.StreamOnlineEventSchema,
})

export const StreamOffline = defineEventSubscriptionType<'stream.offline', '1', eventsub.StreamOfflineCondition, eventsub.StreamOfflineEvent>({
    type: 'stream.offline',
    version: '1',
    auth: {},
    condition: eventsub.StreamOfflineConditionSchema,
    event: eventsub.StreamOfflineEventSchema,
})

export const UserAuthorizationGrant = defineEventSubscriptionType<'user.authorization.grant', '1', eventsub.UserAuthorizationGrantCondition, eventsub.UserAuthorizationGrantEvent>({
    type: 'user.authorization.grant',
    version: '1',
    auth: {},
    condition: eventsub.UserAuthorizationGrantConditionSchema,
    event: eventsub.UserAuthorizationGrantEventSchema,
})

export const UserAuthorizationRevoke = defineEventSubscriptionType<'user.authorization.revoke', '1', eventsub.UserAuthorizationRevokeCondition, eventsub.UserAuthorizationRevokeEvent>({
    type: 'user.authorization.revoke',
    version: '1',
    auth: {},
    condition: eventsub.UserAuthorizationRevokeConditionSchema,
    event: eventsub.UserAuthorizationRevokeEventSchema,
})

export const UserUpdate = defineEventSubscriptionType<'user.update', '1', eventsub.UserUpdateCondition, eventsub.UserUpdateEvent>({
    type: 'user.update',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: 'user:read:email',
    },
    condition: eventsub.UserUpdateConditionSchema,
    event: eventsub.UserUpdateEventSchema,
})

export const WhisperReceived = defineEventSubscriptionType<'user.whisper.message', '1', eventsub.WhisperReceivedCondition, eventsub.WhisperReceivedEvent>({
    type: 'user.whisper.message',
    version: '1',
    auth: {
        userAccessToken: true,
        userScopes: { any: ['user:read:whispers', 'user:manage:whispers'] },
    },
    condition: eventsub.WhisperReceivedConditionSchema,
    event: eventsub.WhisperReceivedEventSchema,
})

export const ALL_SUBSCRIPTION_TYPES = {
    AutomodMessageHold,
    AutomodMessageHoldV2,
    AutomodMessageUpdate,
    AutomodMessageUpdateV2,
    AutomodSettingsUpdate,
    AutomodTermsUpdate,
    ChannelBitsUse,
    ChannelUpdate,
    ChannelFollow,
    ChannelAdBreakBegin,
    ChannelChatClear,
    ChannelChatClearUserMessages,
    ChannelChatMessage,
    ChannelChatMessageDelete,
    ChannelChatNotification,
    ChannelChatSettingsUpdate,
    ChannelChatUserMessageHold,
    ChannelChatUserMessageUpdate,
    ChannelSharedChatSessionBegin,
    ChannelSharedChatSessionUpdate,
    ChannelSharedChatSessionEnd,
    ChannelSubscribe,
    ChannelSubscriptionEnd,
    ChannelSubscriptionGift,
    ChannelSubscriptionMessage,
    ChannelCheer,
    ChannelRaid,
    ChannelBan,
    ChannelUnban,
    ChannelUnbanRequestCreate,
    ChannelUnbanRequestResolve,
    ChannelModerate,
    ChannelModerateV2,
    ChannelModeratorAdd,
    ChannelModeratorRemove,
    ChannelGuestStarSessionBegin,
    ChannelGuestStarSessionEnd,
    ChannelGuestStarGuestUpdate,
    ChannelGuestStarSettingsUpdate,
    ChannelPointsAutomaticRewardRedemptionAdd,
    ChannelPointsAutomaticRewardRedemptionAddV2,
    ChannelPointsCustomRewardAdd,
    ChannelPointsCustomRewardUpdate,
    ChannelPointsCustomRewardRemove,
    ChannelPointsCustomRewardRedemptionAdd,
    ChannelPointsCustomRewardRedemptionUpdate,
    ChannelPollBegin,
    ChannelPollProgress,
    ChannelPollEnd,
    ChannelPredictionBegin,
    ChannelPredictionProgress,
    ChannelPredictionLock,
    ChannelPredictionEnd,
    ChannelSuspiciousUserMessage,
    ChannelSuspiciousUserUpdate,
    ChannelVIPAdd,
    ChannelVIPRemove,
    ChannelWarningAcknowledgement,
    ChannelWarningSend,
    CharityDonation,
    CharityCampaignStart,
    CharityCampaignProgress,
    CharityCampaignStop,
    ConduitShardDisabled,
    DropEntitlementGrant,
    ExtensionBitsTransactionCreate,
    GoalBegin,
    GoalProgress,
    GoalEnd,
    HypeTrainBegin,
    HypeTrainBeginV2,
    HypeTrainProgress,
    HypeTrainProgressV2,
    HypeTrainEnd,
    HypeTrainEndV2,
    ShieldModeBegin,
    ShieldModeEnd,
    ShoutoutCreate,
    ShoutoutReceived,
    StreamOnline,
    StreamOffline,
    UserAuthorizationGrant,
    UserAuthorizationRevoke,
    UserUpdate,
    WhisperReceived,
}
