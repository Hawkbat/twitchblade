import * as z from 'zod'
import type { UserAccessTokenScopeSet } from '../auth/types.js'

interface EndpointDefinition<RequestQuerySchema extends z.ZodType, RequestBodySchema extends z.ZodType, ResponseBodySchema extends z.ZodType> {
    auth: {
        appAccessToken?: boolean
        userAccessToken?: boolean
        userScopes?: UserAccessTokenScopeSet
    }
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    path: string
    requestQuery: RequestQuerySchema
    requestBody: RequestBodySchema
    responseBody: ResponseBodySchema
    successCodes: number[]
    errorCodes: number[]
}

export type InferRequestQuery<T extends EndpointDefinition<any, any, any>> = T extends EndpointDefinition<infer S, infer _, infer _> ? z.infer<S> : never
export type InferRequestBody<T extends EndpointDefinition<any, any, any>> = T extends EndpointDefinition<infer _, infer S, infer _> ? z.infer<S> : never
export type InferResponseBody<T extends EndpointDefinition<any, any, any>> = T extends EndpointDefinition<infer _, infer _, infer S> ? z.infer<S> : never

function defineEndpoint<RequestQuerySchema extends z.ZodType, RequestBodySchema extends z.ZodType, ResponseBodySchema extends z.ZodType>(
    def: EndpointDefinition<RequestQuerySchema, RequestBodySchema, ResponseBodySchema>
): EndpointDefinition<RequestQuerySchema, RequestBodySchema, ResponseBodySchema> {
    return def
}

// Ads Endpoints

export const StartCommercial = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:edit:commercial',
    },
    method: 'POST',
    path: 'channels/commercial',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        broadcaster_id: z.string(),
        length: z.number(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            length: z.number(),
            message: z.string(),
            retry_after: z.number(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404, 429],
})

export type StartCommercialRequestBody = InferRequestBody<typeof StartCommercial>
export type StartCommercialResponseBody = InferResponseBody<typeof StartCommercial>

export const GetAdSchedule = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:ads',
    },
    method: 'GET',
    path: 'channels/ads',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            snooze_count: z.number(),
            snooze_refresh_at: z.string(),
            next_ad_at: z.string(),
            duration: z.number(),
            last_ad_at: z.string(),
            preroll_free_time: z.number(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 500],
})

export type GetAdScheduleQuery = InferRequestQuery<typeof GetAdSchedule>
export type GetAdScheduleResponseBody = InferResponseBody<typeof GetAdSchedule>

export const SnoozeNextAd = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:ads',
    },
    method: 'POST',
    path: 'channels/ads/schedule/snooze',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            snooze_count: z.number(),
            snooze_refresh_at: z.string(),
            next_ad_at: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 429, 500],
})

export type SnoozeNextAdQuery = InferRequestQuery<typeof SnoozeNextAd>
export type SnoozeNextAdResponseBody = InferResponseBody<typeof SnoozeNextAd>

// Analytics Endpoints

export const GetExtensionAnalytics = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'analytics:read:extensions',
    },
    method: 'GET',
    path: 'analytics/extensions',
    requestQuery: z.object({
        extension_id: z.string().optional(),
        type: z.string().optional(),
        started_at: z.string().optional(),
        ended_at: z.string().optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            extension_id: z.string(),
            URL: z.string(),
            type: z.string(),
            date_range: z.object({
                started_at: z.string(),
                ended_at: z.string(),
            }),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type GetExtensionAnalyticsQuery = InferRequestQuery<typeof GetExtensionAnalytics>
export type GetExtensionAnalyticsResponseBody = InferResponseBody<typeof GetExtensionAnalytics>

export const GetGameAnalytics = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'analytics:read:games',
    },
    method: 'GET',
    path: 'analytics/games',
    requestQuery: z.object({
        game_id: z.string().optional(),
        type: z.string().optional(),
        started_at: z.string().optional(),
        ended_at: z.string().optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            game_id: z.string(),
            URL: z.string(),
            type: z.string(),
            date_range: z.object({
                started_at: z.string(),
                ended_at: z.string(),
            }),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type GetGameAnalyticsQuery = InferRequestQuery<typeof GetGameAnalytics>
export type GetGameAnalyticsResponseBody = InferResponseBody<typeof GetGameAnalytics>

// Bits Endpoints

export const GetBitsLeaderboard = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'bits:read',
    },
    method: 'GET',
    path: 'bits/leaderboard',
    requestQuery: z.object({
        count: z.number().optional(),
        period: z.string().optional(),
        started_at: z.string().optional(),
        user_id: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
            rank: z.number(),
            score: z.number(),
        })),
        date_range: z.object({
            started_at: z.string(),
            ended_at: z.string(),
        }),
        total: z.number(),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403],
})

export type GetBitsLeaderboardQuery = InferRequestQuery<typeof GetBitsLeaderboard>
export type GetBitsLeaderboardResponseBody = InferResponseBody<typeof GetBitsLeaderboard>

export const GetCheermotes = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'bits/cheermotes',
    requestQuery: z.object({
        broadcaster_id: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            prefix: z.string(),
            tiers: z.array(z.object({
                min_bits: z.number(),
                id: z.string(),
                color: z.string(),
                images: z.object({
                    dark: z.object({
                        animated: z.object({
                            '1': z.string(),
                            '1.5': z.string(),
                            '2': z.string(),
                            '3': z.string(),
                            '4': z.string(),
                        }),
                        static: z.object({
                            '1': z.string(),
                            '1.5': z.string(),
                            '2': z.string(),
                            '3': z.string(),
                            '4': z.string(),
                        }),
                    }),
                    light: z.object({
                        animated: z.object({
                            '1': z.string(),
                            '1.5': z.string(),
                            '2': z.string(),
                            '3': z.string(),
                            '4': z.string(),
                        }),
                        static: z.object({
                            '1': z.string(),
                            '1.5': z.string(),
                            '2': z.string(),
                            '3': z.string(),
                            '4': z.string(),
                        }),
                    }),
                }),
                can_cheer: z.boolean(),
                show_in_bits_card: z.boolean(),
            })),
            type: z.string(),
            order: z.number(),
            last_updated: z.string(),
            is_charitable: z.boolean(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetcheermotesQuery = InferRequestQuery<typeof GetCheermotes>
export type GetCheermotesResponseBody = InferResponseBody<typeof GetCheermotes>

export const GetExtensionTransactions = defineEndpoint({
    auth: {
        appAccessToken: true,
    },
    method: 'GET',
    path: 'extensions/transactions',
    requestQuery: z.object({
        extension_id: z.string(),
        id: z.string().or(z.array(z.string())).optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            timestamp: z.string(),
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
            product_type: z.string(),
            product_data: z.object({
                domain: z.string(),
                sku: z.string(),
                cost: z.object({
                    amount: z.number(),
                    type: z.string(),
                }),
                displayName: z.string(),
                inDevelopment: z.boolean(),
            }),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type GetExtensionTransactionsQuery = InferRequestQuery<typeof GetExtensionTransactions>
export type GetExtensionTransactionsResponseBody = InferResponseBody<typeof GetExtensionTransactions>

// Channel Endpoints

export const GetChannelInformation = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'channels',
    requestQuery: z.object({
        broadcaster_id: z.string().or(z.array(z.string())),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            broadcaster_language: z.string(),
            game_id: z.string(),
            game_name: z.string(),
            title: z.string(),
            delay: z.number(),
            tags: z.array(z.string()),
            content_classification_labels: z.array(z.string()),
            is_branded_content: z.boolean(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetChannelInformationQuery = InferRequestQuery<typeof GetChannelInformation>
export type GetChannelInformationResponseBody = InferResponseBody<typeof GetChannelInformation>

export const ModifyChannelInformation = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:broadcast',
    },
    method: 'PATCH',
    path: 'channels',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.object({
        game_id: z.string().optional(),
        broadcaster_language: z.string().optional(),
        title: z.string().optional(),
        delay: z.number().optional(),
        tags: z.array(z.string()).optional(),
        content_classification_labels: z.array(z.string()).optional(),
        is_branded_content: z.boolean().optional(),
    }),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 500],
})

export type ModifyChannelInformationQuery = InferRequestQuery<typeof ModifyChannelInformation>
export type ModifyChannelInformationRequestBody = InferRequestBody<typeof ModifyChannelInformation>

export const GetChannelEditors = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:editors',
    },
    method: 'GET',
    path: 'channels/editors',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            user_id: z.string(),
            user_name: z.string(),
            created_at: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetChannelEditorsQuery = InferRequestQuery<typeof GetChannelEditors>
export type GetChannelEditorsResponseBody = InferResponseBody<typeof GetChannelEditors>

export const GetFollowedChannels = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:read:follows',
    },
    method: 'GET',
    path: 'channels/followed',
    requestQuery: z.object({
        user_id: z.string(),
        broadcaster_id: z.string().optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            followed_at: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
        total: z.number(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetFollowedChannelsQuery = InferRequestQuery<typeof GetFollowedChannels>
export type GetFollowedChannelsResponseBody = InferResponseBody<typeof GetFollowedChannels>

export const GetChannelFollowers = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:read:followers',
    },
    method: 'GET',
    path: 'channels/followers',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        user_id: z.string().optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
            followed_at: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
        total: z.number(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetChannelFollowersQuery = InferRequestQuery<typeof GetChannelFollowers>
export type GetChannelFollowersResponseBody = InferResponseBody<typeof GetChannelFollowers>

// Channel Points Endpoints

export const CreateCustomRewards = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:redemptions',
    },
    method: 'POST',
    path: 'channel_points/custom_rewards',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.object({
        title: z.string(),
        cost: z.number(),
        prompt: z.string().optional(),
        is_enabled: z.boolean().optional(),
        background_color: z.string().optional(),
        is_user_input_required: z.boolean().optional(),
        is_max_per_stream_enabled: z.boolean().optional(),
        max_per_stream: z.number().optional(),
        is_max_per_user_per_stream_enabled: z.boolean().optional(),
        max_per_user_per_stream: z.number().optional(),
        is_global_cooldown_enabled: z.boolean().optional(),
        global_cooldown_seconds: z.number().optional(),
        should_redemptions_skip_request_queue: z.boolean().optional(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            id: z.string(),
            title: z.string(),
            prompt: z.string(),
            cost: z.number(),
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
            background_color: z.string(),
            is_enabled: z.boolean(),
            is_user_input_required: z.boolean(),
            max_per_stream_setting: z.object({
                is_enabled: z.boolean(),
                max_per_stream: z.number(),
            }),
            max_per_user_per_stream_setting: z.object({
                is_enabled: z.boolean(),
                max_per_user_per_stream: z.number(),
            }),
            global_cooldown_setting: z.object({
                is_enabled: z.boolean(),
                global_cooldown_seconds: z.number(),
            }),
            is_paused: z.boolean(),
            is_in_stock: z.boolean(),
            should_redemptions_skip_request_queue: z.boolean(),
            redemptions_redeemed_current_stream: z.number().nullable(),
            cooldown_expires_at: z.string().nullable(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403, 500],
})

export type CreateCustomRewardsQuery = InferRequestQuery<typeof CreateCustomRewards>
export type CreateCustomRewardsRequestBody = InferRequestBody<typeof CreateCustomRewards>
export type CreateCustomRewardsResponseBody = InferResponseBody<typeof CreateCustomRewards>

export const DeleteCustomReward = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:redemptions',
    },
    method: 'DELETE',
    path: 'channel_points/custom_rewards',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 403, 404],
})

export type DeleteCustomRewardQuery = InferRequestQuery<typeof DeleteCustomReward>

export const GetCustomReward = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:redemptions',
    },
    method: 'GET',
    path: 'channel_points/custom_rewards',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        id: z.string().or(z.array(z.string())).optional(),
        only_manageable_rewards: z.boolean().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            id: z.string(),
            title: z.string(),
            prompt: z.string(),
            cost: z.number(),
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
            background_color: z.string(),
            is_enabled: z.boolean(),
            is_user_input_required: z.boolean(),
            max_per_stream_setting: z.object({
                is_enabled: z.boolean(),
                max_per_stream: z.number(),
            }),
            max_per_user_per_stream_setting: z.object({
                is_enabled: z.boolean(),
                max_per_user_per_stream: z.number(),
            }),
            global_cooldown_setting: z.object({
                is_enabled: z.boolean(),
                global_cooldown_seconds: z.number(),
            }),
            is_paused: z.boolean(),
            is_in_stock: z.boolean(),
            should_redemptions_skip_request_queue: z.boolean(),
            redemptions_redeemed_current_stream: z.number().nullable(),
            cooldown_expires_at: z.string().nullable(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403, 404],
})

export type GetCustomRewardQuery = InferRequestQuery<typeof GetCustomReward>
export type GetCustomRewardResponseBody = InferResponseBody<typeof GetCustomReward>

export const GetCustomRewardRedemption = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:redemptions',
    },
    method: 'GET',
    path: 'channel_points/custom_rewards/redemptions',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        reward_id: z.string(),
        id: z.string().or(z.array(z.string())).optional(),
        status: z.string().optional(),
        sort: z.string().optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            id: z.string(),
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
            user_input: z.string(),
            status: z.string(),
            redeemed_at: z.string(),
            reward: z.object({
                id: z.string(),
                title: z.string(),
                prompt: z.string(),
                cost: z.number(),
            }),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403, 404],
})

export type GetCustomRewardRedemptionQuery = InferRequestQuery<typeof GetCustomRewardRedemption>
export type GetCustomRewardRedemptionResponseBody = InferResponseBody<typeof GetCustomRewardRedemption>

export const UpdateCustomReward = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:redemptions',
    },
    method: 'PATCH',
    path: 'channel_points/custom_rewards',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        id: z.string(),
    }),
    requestBody: z.object({
        title: z.string().optional(),
        cost: z.number().optional(),
        prompt: z.string().optional(),
        is_enabled: z.boolean().optional(),
        background_color: z.string().optional(),
        is_user_input_required: z.boolean().optional(),
        is_max_per_stream_enabled: z.boolean().optional(),
        max_per_stream: z.number().optional(),
        is_max_per_user_per_stream_enabled: z.boolean().optional(),
        max_per_user_per_stream: z.number().optional(),
        is_global_cooldown_enabled: z.boolean().optional(),
        global_cooldown_seconds: z.number().optional(),
        is_paused: z.boolean().optional(),
        should_redemptions_skip_request_queue: z.boolean().optional(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            id: z.string(),
            title: z.string(),
            prompt: z.string(),
            cost: z.number(),
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
            background_color: z.string(),
            is_enabled: z.boolean(),
            is_user_input_required: z.boolean(),
            max_per_stream_setting: z.object({
                is_enabled: z.boolean(),
                max_per_stream: z.number(),
            }),
            max_per_user_per_stream_setting: z.object({
                is_enabled: z.boolean(),
                max_per_user_per_stream: z.number(),
            }),
            global_cooldown_setting: z.object({
                is_enabled: z.boolean(),
                global_cooldown_seconds: z.number(),
            }),
            is_paused: z.boolean(),
            is_in_stock: z.boolean(),
            should_redemptions_skip_request_queue: z.boolean(),
            redemptions_redeemed_current_stream: z.number().nullable(),
            cooldown_expires_at: z.string().nullable(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403, 404, 500],
})

export type UpdateCustomRewardQuery = InferRequestQuery<typeof UpdateCustomReward>
export type UpdateCustomRewardRequestBody = InferRequestBody<typeof UpdateCustomReward>
export type UpdateCustomRewardResponseBody = InferResponseBody<typeof UpdateCustomReward>

export const UpdateRedemptionStatus = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:redemptions',
    },
    method: 'PATCH',
    path: 'channel_points/custom_rewards/redemptions',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        reward_id: z.string(),
        id: z.string().or(z.array(z.string())),
    }),
    requestBody: z.object({
        status: z.string(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            id: z.string(),
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
            user_input: z.string(),
            status: z.string(),
            redeemed_at: z.string(),
            reward: z.object({
                id: z.string(),
                title: z.string(),
                prompt: z.string(),
                cost: z.number(),
            }),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403, 404],
})

export type UpdateRedemptionStatusQuery = InferRequestQuery<typeof UpdateRedemptionStatus>
export type UpdateRedemptionStatusRequestBody = InferRequestBody<typeof UpdateRedemptionStatus>
export type UpdateRedemptionStatusResponseBody = InferResponseBody<typeof UpdateRedemptionStatus>

// Charity Endpoints

export const GetCharityCampaign = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:charity',
    },
    method: 'GET',
    path: 'charity/campaigns',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            charity_name: z.string(),
            charity_description: z.string(),
            charity_logo: z.string(),
            charity_website: z.string(),
            current_amount: z.object({
                value: z.number(),
                decimal_places: z.number(),
                currency: z.string(),
            }),
            target_amount: z.object({
                value: z.number(),
                decimal_places: z.number(),
                currency: z.string(),
            }),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetCharityCampaignQuery = InferRequestQuery<typeof GetCharityCampaign>
export type GetCharityCampaignResponseBody = InferResponseBody<typeof GetCharityCampaign>

export const GetCharityCampaignDonations = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:charity',
    },
    method: 'GET',
    path: 'charity/donations',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            campaign_id: z.string(),
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
            amount: z.object({
                value: z.number(),
                decimal_places: z.number(),
                currency: z.string(),
            }),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetCharityCampaignDonationsQuery = InferRequestQuery<typeof GetCharityCampaignDonations>
export type GetCharityCampaignDonationsResponseBody = InferResponseBody<typeof GetCharityCampaignDonations>

// Chat Endpoints

export const GetChatters = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:read:chatters',
    },
    method: 'GET',
    path: 'chat/chatters',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
        total: z.number(),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403],
})

export type GetChattersQuery = InferRequestQuery<typeof GetChatters>
export type GetChattersResponseBody = InferResponseBody<typeof GetChatters>

export const GetChannelEmotes = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'chat/emotes',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            images: z.object({
                url_1x: z.string(),
                url_2x: z.string(),
                url_4x: z.string(),
            }),
            tier: z.string(),
            emote_type: z.string(),
            emote_set_id: z.string(),
            format: z.array(z.string()),
            scale: z.array(z.string()),
            theme_mode: z.array(z.string()),
        })),
        template: z.string(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetChannelEmotesQuery = InferRequestQuery<typeof GetChannelEmotes>
export type GetChannelEmotesResponseBody = InferResponseBody<typeof GetChannelEmotes>

export const GetGlobalEmotes = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'chat/emotes/global',
    requestQuery: z.undefined().optional(),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            images: z.object({
                url_1x: z.string(),
                url_2x: z.string(),
                url_4x: z.string(),
            }),
            format: z.array(z.string()),
            scale: z.array(z.string()),
            theme_mode: z.array(z.string()),
        })),
        template: z.string(),
    }),
    successCodes: [200],
    errorCodes: [401],
})

export type GetGlobalEmotesResponseBody = InferResponseBody<typeof GetGlobalEmotes>

export const GetEmoteSets = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'chat/emotes/set',
    requestQuery: z.object({
        emote_set_id: z.string().or(z.array(z.string())),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            images: z.object({
                url_1x: z.string(),
                url_2x: z.string(),
                url_4x: z.string(),
            }),
            emote_type: z.string(),
            emote_set_id: z.string(),
            owner_id: z.string(),
            format: z.array(z.string()),
            scale: z.array(z.string()),
            theme_mode: z.array(z.string()),
        })),
        template: z.string(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetEmoteSetsQuery = InferRequestQuery<typeof GetEmoteSets>
export type GetEmoteSetsResponseBody = InferResponseBody<typeof GetEmoteSets>

export const GetChannelChatBadges = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'chat/badges',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            set_id: z.string(),
            versions: z.array(z.object({
                id: z.string(),
                image_url_1x: z.string(),
                image_url_2x: z.string(),
                image_url_4x: z.string(),
                title: z.string(),
                description: z.string(),
                click_action: z.string().nullable(),
                click_url: z.string().nullable(),
            })),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetChannelChatBadgesQuery = InferRequestQuery<typeof GetChannelChatBadges>
export type GetChannelChatBadgesResponseBody = InferResponseBody<typeof GetChannelChatBadges>

export const GetGlobalChatBadges = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'chat/badges/global',
    requestQuery: z.undefined().optional(),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            set_id: z.string(),
            versions: z.array(z.object({
                id: z.string(),
                image_url_1x: z.string(),
                image_url_2x: z.string(),
                image_url_4x: z.string(),
                title: z.string(),
                description: z.string(),
                click_action: z.string().nullable(),
                click_url: z.string().nullable(),
            })),
        })),
    }),
    successCodes: [200],
    errorCodes: [401],
})

export type GetGlobalChatBadgesResponseBody = InferResponseBody<typeof GetGlobalChatBadges>

export const GetChatSettings = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'chat/settings',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            emote_mode: z.boolean(),
            follower_mode: z.boolean(),
            follower_mode_duration: z.number().nullable(),
            moderator_id: z.string().optional(),
            non_moderator_chat_delay: z.boolean().optional(),
            non_moderator_chat_delay_duration: z.number().nullable().optional(),
            slow_mode: z.boolean(),
            slow_mode_wait_time: z.number().nullable(),
            subscriber_mode: z.boolean(),
            unique_chat_mode: z.boolean(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetChatSettingsQuery = InferRequestQuery<typeof GetChatSettings>
export type GetChatSettingsResponseBody = InferResponseBody<typeof GetChatSettings>

export const GetSharedChatSession = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'shared_chat/session',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            session_id: z.string(),
            host_broadcaster_id: z.string(),
            participants: z.array(z.object({
                broadcaster_id: z.string(),
            })),
            created_at: z.string(),
            updated_at: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetSharedChatSessionQuery = InferRequestQuery<typeof GetSharedChatSession>
export type GetSharedChatSessionResponseBody = InferResponseBody<typeof GetSharedChatSession>

export const GetUserEmotes = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:read:emotes',
    },
    method: 'GET',
    path: 'chat/emotes/user',
    requestQuery: z.object({
        user_id: z.string(),
        broadcaster_id: z.string().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            images: z.object({
                url_1x: z.string(),
                url_2x: z.string(),
                url_4x: z.string(),
            }),
            emote_type: z.string(),
            emote_set_id: z.string(),
            owner_id: z.string(),
            format: z.array(z.string()),
            scale: z.array(z.string()),
            theme_mode: z.array(z.string()),
        })),
        template: z.string(),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetUserEmotesQuery = InferRequestQuery<typeof GetUserEmotes>
export type GetUserEmotesResponseBody = InferResponseBody<typeof GetUserEmotes>

export const UpdateChatSettings = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:manage:chat_settings',
    },
    method: 'PATCH',
    path: 'chat/settings',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
    }),
    requestBody: z.object({
        emote_mode: z.boolean().optional(),
        follower_mode: z.boolean().optional(),
        follower_mode_duration: z.number().optional(),
        non_moderator_chat_delay: z.boolean().optional(),
        non_moderator_chat_delay_duration: z.number().optional(),
        slow_mode: z.boolean().optional(),
        slow_mode_wait_time: z.number().optional(),
        subscriber_mode: z.boolean().optional(),
        unique_chat_mode: z.boolean().optional(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            emote_mode: z.boolean(),
            follower_mode: z.boolean(),
            follower_mode_duration: z.number().nullable(),
            moderator_id: z.string(),
            non_moderator_chat_delay: z.boolean(),
            non_moderator_chat_delay_duration: z.number().nullable(),
            slow_mode: z.boolean(),
            slow_mode_wait_time: z.number().nullable(),
            subscriber_mode: z.boolean(),
            unique_chat_mode: z.boolean(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403],
})

export type UpdateChatSettingsQuery = InferRequestQuery<typeof UpdateChatSettings>
export type UpdateChatSettingsRequestBody = InferRequestBody<typeof UpdateChatSettings>
export type UpdateChatSettingsResponseBody = InferResponseBody<typeof UpdateChatSettings>

export const SendChatAnnouncement = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:manage:announcements',
    },
    method: 'POST',
    path: 'chat/announcements',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
    }),
    requestBody: z.object({
        message: z.string(),
        color: z.string().optional(),
    }),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 403],
})

export type SendChatAnnouncementQuery = InferRequestQuery<typeof SendChatAnnouncement>
export type SendChatAnnouncementRequestBody = InferRequestBody<typeof SendChatAnnouncement>

export const SendShoutout = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:manage:shoutouts',
    },
    method: 'POST',
    path: 'chat/shoutouts',
    requestQuery: z.object({
        from_broadcaster_id: z.string(),
        to_broadcaster_id: z.string(),
        moderator_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 403, 429],
})

export type SendShoutoutQuery = InferRequestQuery<typeof SendShoutout>

export const SendChatMessage = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:write:chat',
    },
    method: 'POST',
    path: 'chat/messages',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        broadcaster_id: z.string(),
        sender_id: z.string(),
        message: z.string(),
        reply_parent_message_id: z.string().optional(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            message_id: z.string(),
            is_sent: z.boolean(),
            drop_reason: z.object({
                code: z.string(),
                message: z.string(),
            }).optional(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403, 422],
})

export type SendChatMessageRequestBody = InferRequestBody<typeof SendChatMessage>
export type SendChatMessageResponseBody = InferResponseBody<typeof SendChatMessage>

export const GetUserChatColor = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'chat/color',
    requestQuery: z.object({
        user_id: z.string().or(z.array(z.string())),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
            color: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetUserChatColorQuery = InferRequestQuery<typeof GetUserChatColor>
export type GetUserChatColorResponseBody = InferResponseBody<typeof GetUserChatColor>

export const UpdateUserChatColor = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:manage:chat_color',
    },
    method: 'PUT',
    path: 'chat/color',
    requestQuery: z.object({
        user_id: z.string(),
        color: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401],
})

export type UpdateUserChatColorQuery = InferRequestQuery<typeof UpdateUserChatColor>

// Clips Endpoints

export const CreateClip = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'clips:edit',
    },
    method: 'POST',
    path: 'clips',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        has_delay: z.boolean().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            edit_url: z.string(),
            id: z.string(),
        })),
    }),
    successCodes: [202],
    errorCodes: [400, 401, 403, 404],
})

export type CreateClipQuery = InferRequestQuery<typeof CreateClip>
export type CreateClipResponseBody = InferResponseBody<typeof CreateClip>

export const GetClips = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'clips',
    requestQuery: z.object({
        broadcaster_id: z.string().optional(),
        game_id: z.string().optional(),
        id: z.string().or(z.array(z.string())).optional(),
        started_at: z.string().optional(),
        ended_at: z.string().optional(),
        first: z.number().optional(),
        before: z.string().optional(),
        after: z.string().optional(),
        is_featured: z.boolean().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            url: z.string(),
            embed_url: z.string(),
            broadcaster_id: z.string(),
            broadcaster_name: z.string(),
            creator_id: z.string(),
            creator_name: z.string(),
            video_id: z.string(),
            game_id: z.string(),
            language: z.string(),
            title: z.string(),
            view_count: z.number(),
            created_at: z.string(),
            thumbnail_url: z.string(),
            duration: z.number(),
            vod_offset: z.number().nullable(),
            is_featured: z.boolean(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type GetClipsQuery = InferRequestQuery<typeof GetClips>
export type GetClipsResponseBody = InferResponseBody<typeof GetClips>

export const GetClipsDownload = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'clips/download',
    requestQuery: z.object({
        id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            quality: z.string(),
            url: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type GetClipsDownloadQuery = InferRequestQuery<typeof GetClipsDownload>
export type GetClipsDownloadResponseBody = InferResponseBody<typeof GetClipsDownload>

// Conduits Endpoints

export const GetConduits = defineEndpoint({
    auth: {
        appAccessToken: true,
    },
    method: 'GET',
    path: 'eventsub/conduits',
    requestQuery: z.undefined().optional(),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            shard_count: z.number(),
        })),
    }),
    successCodes: [200],
    errorCodes: [401],
})

export type GetConduitsResponseBody = InferResponseBody<typeof GetConduits>

export const CreateConduits = defineEndpoint({
    auth: {
        appAccessToken: true,
    },
    method: 'POST',
    path: 'eventsub/conduits',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        shard_count: z.number(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            shard_count: z.number(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type CreateConduitsRequestBody = InferRequestBody<typeof CreateConduits>
export type CreateConduitsResponseBody = InferResponseBody<typeof CreateConduits>

export const UpdateConduits = defineEndpoint({
    auth: {
        appAccessToken: true,
    },
    method: 'PATCH',
    path: 'eventsub/conduits',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        id: z.string(),
        shard_count: z.number(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            shard_count: z.number(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type UpdateConduitsRequestBody = InferRequestBody<typeof UpdateConduits>
export type UpdateConduitsResponseBody = InferResponseBody<typeof UpdateConduits>

export const DeleteConduit = defineEndpoint({
    auth: {
        appAccessToken: true,
    },
    method: 'DELETE',
    path: 'eventsub/conduits',
    requestQuery: z.object({
        id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type DeleteConduitQuery = InferRequestQuery<typeof DeleteConduit>

export const GetConduitShards = defineEndpoint({
    auth: {
        appAccessToken: true,
    },
    method: 'GET',
    path: 'eventsub/conduits/shards',
    requestQuery: z.object({
        conduit_id: z.string(),
        status: z.string().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            status: z.string(),
            transport: z.object({
                method: z.string(),
                callback: z.string().optional(),
                session_id: z.string().optional(),
            }),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type GetConduitShardsQuery = InferRequestQuery<typeof GetConduitShards>
export type GetConduitShardsResponseBody = InferResponseBody<typeof GetConduitShards>

export const UpdateConduitShards = defineEndpoint({
    auth: {
        appAccessToken: true,
    },
    method: 'PATCH',
    path: 'eventsub/conduits/shards',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        conduit_id: z.string(),
        shards: z.array(z.object({
            id: z.string(),
            transport: z.object({
                method: z.string(),
                callback: z.string().optional(),
                session_id: z.string().optional(),
                secret: z.string().optional(),
            }),
        })),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            status: z.string(),
            transport: z.object({
                method: z.string(),
                callback: z.string().optional(),
                session_id: z.string().optional(),
            }),
        })),
        errors: z.array(z.object({
            id: z.string(),
            message: z.string(),
            code: z.string(),
        })).optional(),
    }),
    successCodes: [202],
    errorCodes: [400, 401, 404],
})

export type UpdateConduitShardsRequestBody = InferRequestBody<typeof UpdateConduitShards>
export type UpdateConduitShardsResponseBody = InferResponseBody<typeof UpdateConduitShards>

// Content Classification Labels

export const GetContentClassificationLabels = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'content_classification_labels',
    requestQuery: z.object({
        locale: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            description: z.string(),
            name: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetContentClassificationLabelsQuery = InferRequestQuery<typeof GetContentClassificationLabels>
export type GetContentClassificationLabelsResponseBody = InferResponseBody<typeof GetContentClassificationLabels>

// Entitlements Endpoints

export const GetDropsEntitlements = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'entitlements/drops',
    requestQuery: z.object({
        id: z.string().or(z.array(z.string())).optional(),
        user_id: z.string().optional(),
        game_id: z.string().optional(),
        fulfillment_status: z.string().optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            benefit_id: z.string(),
            timestamp: z.string(),
            user_id: z.string(),
            game_id: z.string(),
            fulfillment_status: z.string(),
            last_updated: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetDropsEntitlementsQuery = InferRequestQuery<typeof GetDropsEntitlements>
export type GetDropsEntitlementsResponseBody = InferResponseBody<typeof GetDropsEntitlements>

export const UpdateDropsEntitlements = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'PATCH',
    path: 'entitlements/drops',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        entitlement_ids: z.array(z.string()).optional(),
        fulfillment_status: z.string(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            status: z.string(),
            ids: z.array(z.string()),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type UpdateDropsEntitlementsRequestBody = InferRequestBody<typeof UpdateDropsEntitlements>
export type UpdateDropsEntitlementsResponseBody = InferResponseBody<typeof UpdateDropsEntitlements>

// Extensions Endpoints

export const GetExtensionConfigurationSegment = defineEndpoint({
    auth: {
        userAccessToken: true,
    },
    method: 'GET',
    path: 'extensions/configurations',
    requestQuery: z.object({
        extension_id: z.string(),
        segment: z.string().or(z.array(z.string())),
        broadcaster_id: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            segment: z.string(),
            broadcaster_id: z.string().optional(),
            content: z.string(),
            version: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type GetExtensionConfigurationSegmentQuery = InferRequestQuery<typeof GetExtensionConfigurationSegment>
export type GetExtensionConfigurationSegmentResponseBody = InferResponseBody<typeof GetExtensionConfigurationSegment>

export const SetExtensionConfigurationSegment = defineEndpoint({
    auth: {
        userAccessToken: true,
    },
    method: 'PUT',
    path: 'extensions/configurations',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        extension_id: z.string(),
        segment: z.string(),
        broadcaster_id: z.string().optional(),
        content: z.string().optional(),
        version: z.string().optional(),
    }),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type SetExtensionConfigurationSegmentRequestBody = InferRequestBody<typeof SetExtensionConfigurationSegment>

export const SetExtensionRequiredConfiguration = defineEndpoint({
    auth: {
        userAccessToken: true,
    },
    method: 'PUT',
    path: 'extensions/required_configuration',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.object({
        extension_id: z.string(),
        extension_version: z.string(),
        required_configuration: z.string(),
    }),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type SetExtensionRequiredConfigurationQuery = InferRequestQuery<typeof SetExtensionRequiredConfiguration>
export type SetExtensionRequiredConfigurationRequestBody = InferRequestBody<typeof SetExtensionRequiredConfiguration>

export const SendExtensionPubSubMessage = defineEndpoint({
    auth: {
        userAccessToken: true,
    },
    method: 'POST',
    path: 'extensions/pubsub',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        target: z.array(z.string()),
        broadcaster_id: z.string(),
        is_global_broadcast: z.boolean(),
        message: z.string(),
    }),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 403, 404],
})

export type SendExtensionPubSubMessageRequestBody = InferRequestBody<typeof SendExtensionPubSubMessage>

export const GetExtensionLiveChannels = defineEndpoint({
    auth: {
        appAccessToken: true,
    },
    method: 'GET',
    path: 'extensions/live',
    requestQuery: z.object({
        extension_id: z.string(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            broadcaster_name: z.string(),
            game_name: z.string(),
            game_id: z.string(),
            title: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetExtensionLiveChannelsQuery = InferRequestQuery<typeof GetExtensionLiveChannels>
export type GetExtensionLiveChannelsResponseBody = InferResponseBody<typeof GetExtensionLiveChannels>

export const GetExtensionSecrets = defineEndpoint({
    auth: {
        userAccessToken: true,
    },
    method: 'GET',
    path: 'extensions/jwt/secrets',
    requestQuery: z.object({
        extension_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            format_version: z.number(),
            secrets: z.array(z.object({
                content: z.string(),
                active_at: z.string(),
                expires_at: z.string(),
            })),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type GetExtensionSecretsQuery = InferRequestQuery<typeof GetExtensionSecrets>
export type GetExtensionSecretsResponseBody = InferResponseBody<typeof GetExtensionSecrets>

export const CreateExtensionSecret = defineEndpoint({
    auth: {
        userAccessToken: true,
    },
    method: 'POST',
    path: 'extensions/jwt/secrets',
    requestQuery: z.object({
        extension_id: z.string(),
    }),
    requestBody: z.object({
        delay: z.number().optional(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            format_version: z.number(),
            secrets: z.array(z.object({
                content: z.string(),
                active_at: z.string(),
                expires_at: z.string(),
            })),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type CreateExtensionSecretQuery = InferRequestQuery<typeof CreateExtensionSecret>
export type CreateExtensionSecretRequestBody = InferRequestBody<typeof CreateExtensionSecret>
export type CreateExtensionSecretResponseBody = InferResponseBody<typeof CreateExtensionSecret>

export const SendExtensionChatMessage = defineEndpoint({
    auth: {
        userAccessToken: true,
    },
    method: 'POST',
    path: 'extensions/chat',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.object({
        text: z.string(),
        extension_id: z.string(),
        extension_version: z.string(),
    }),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 403, 404],
})

export type SendExtensionChatMessageQuery = InferRequestQuery<typeof SendExtensionChatMessage>
export type SendExtensionChatMessageRequestBody = InferRequestBody<typeof SendExtensionChatMessage>

export const GetExtensions = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'extensions',
    requestQuery: z.object({
        extension_id: z.string(),
        extension_version: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            author_name: z.string(),
            bits_enabled: z.boolean(),
            can_install: z.boolean(),
            configuration_location: z.string(),
            description: z.string(),
            eula_tos_url: z.string(),
            has_chat_support: z.boolean(),
            icon_url: z.string(),
            icon_urls: z.record(z.string(), z.string()),
            id: z.string(),
            name: z.string(),
            privacy_policy_url: z.string(),
            request_identity_link: z.boolean(),
            screenshot_urls: z.array(z.string()),
            state: z.string(),
            subscriptions_support_level: z.string(),
            summary: z.string(),
            support_email: z.string(),
            version: z.string(),
            viewer_summary: z.string(),
            views: z.object({
                mobile: z.object({
                    viewer_url: z.string(),
                }),
                panel: z.object({
                    viewer_url: z.string(),
                    height: z.number(),
                    can_link_external_content: z.boolean(),
                }),
                video_overlay: z.object({
                    viewer_url: z.string(),
                    can_link_external_content: z.boolean(),
                }),
                component: z.object({
                    viewer_url: z.string(),
                    aspect_ratio_x: z.number(),
                    aspect_ratio_y: z.number(),
                    autoscale: z.boolean(),
                    scale_pixels: z.number(),
                    target_height: z.number(),
                    can_link_external_content: z.boolean(),
                }),
                config: z.object({
                    viewer_url: z.string(),
                    can_link_external_content: z.boolean(),
                }),
            }),
            allowlisted_config_urls: z.array(z.string()),
            allowlisted_panel_urls: z.array(z.string()),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetExtensionsQuery = InferRequestQuery<typeof GetExtensions>
export type GetExtensionsResponseBody = InferResponseBody<typeof GetExtensions>

export const GetReleasedExtensions = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'extensions/released',
    requestQuery: z.object({
        extension_id: z.string(),
        extension_version: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            author_name: z.string(),
            bits_enabled: z.boolean(),
            can_install: z.boolean(),
            configuration_location: z.string(),
            description: z.string(),
            eula_tos_url: z.string(),
            has_chat_support: z.boolean(),
            icon_url: z.string(),
            icon_urls: z.record(z.string(), z.string()),
            id: z.string(),
            name: z.string(),
            privacy_policy_url: z.string(),
            request_identity_link: z.boolean(),
            screenshot_urls: z.array(z.string()),
            state: z.string(),
            subscriptions_support_level: z.string(),
            summary: z.string(),
            support_email: z.string(),
            version: z.string(),
            viewer_summary: z.string(),
            views: z.object({
                mobile: z.object({
                    viewer_url: z.string(),
                }),
                panel: z.object({
                    viewer_url: z.string(),
                    height: z.number(),
                    can_link_external_content: z.boolean(),
                }),
                video_overlay: z.object({
                    viewer_url: z.string(),
                    can_link_external_content: z.boolean(),
                }),
                component: z.object({
                    viewer_url: z.string(),
                    aspect_ratio_x: z.number(),
                    aspect_ratio_y: z.number(),
                    autoscale: z.boolean(),
                    scale_pixels: z.number(),
                    target_height: z.number(),
                    can_link_external_content: z.boolean(),
                }),
                config: z.object({
                    viewer_url: z.string(),
                    can_link_external_content: z.boolean(),
                }),
            }),
            allowlisted_config_urls: z.array(z.string()),
            allowlisted_panel_urls: z.array(z.string()),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetReleasedExtensionsQuery = InferRequestQuery<typeof GetReleasedExtensions>
export type GetReleasedExtensionsResponseBody = InferResponseBody<typeof GetReleasedExtensions>

export const GetExtensionBitsProducts = defineEndpoint({
    auth: {
        appAccessToken: true,
    },
    method: 'GET',
    path: 'bits/extensions',
    requestQuery: z.object({
        should_include_all: z.boolean().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            sku: z.string(),
            cost: z.object({
                amount: z.number(),
                type: z.string(),
            }),
            in_development: z.boolean(),
            display_name: z.string(),
            expiration: z.string(),
            is_broadcast: z.boolean(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetExtensionBitsProductsQuery = InferRequestQuery<typeof GetExtensionBitsProducts>
export type GetExtensionBitsProductsResponseBody = InferResponseBody<typeof GetExtensionBitsProducts>

export const UpdateExtensionBitsProduct = defineEndpoint({
    auth: {
        appAccessToken: true,
    },
    method: 'PUT',
    path: 'bits/extensions',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        sku: z.string(),
        cost: z.object({
            amount: z.number(),
            type: z.string(),
        }),
        display_name: z.string(),
        in_development: z.boolean().optional(),
        expiration: z.string().optional(),
        is_broadcast: z.boolean().optional(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            sku: z.string(),
            cost: z.object({
                amount: z.number(),
                type: z.string(),
            }),
            in_development: z.boolean(),
            display_name: z.string(),
            expiration: z.string(),
            is_broadcast: z.boolean(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 422],
})

export type UpdateExtensionBitsProductRequestBody = InferRequestBody<typeof UpdateExtensionBitsProduct>
export type UpdateExtensionBitsProductResponseBody = InferResponseBody<typeof UpdateExtensionBitsProduct>

// EventSub Endpoints

const TransportRequest = z.discriminatedUnion('method', [
    z.object({
        method: z.literal('webhook'),
        callback: z.string(),
        secret: z.string(),
    }),
    z.object({
        method: z.literal('websocket'),
        session_id: z.string(),
    }),
    z.object({
        method: z.literal('conduit'),
        conduit_id: z.string(),
    }),
])

const TransportResponse = z.discriminatedUnion('method', [
    z.object({
        method: z.literal('webhook'),
        callback: z.string(),
    }),
    z.object({
        method: z.literal('websocket'),
        session_id: z.string(),
        connected_at: z.string(),
    }),
    z.object({
        method: z.literal('conduit'),
        conduit_id: z.string(),
    }),
])

export const CreateEventSubSubscription = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'POST',
    path: 'eventsub/subscriptions',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        type: z.string(),
        version: z.string(),
        condition: z.record(z.string(), z.unknown()),
        transport: TransportRequest,
    }),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            status: z.string(),
            type: z.string(),
            version: z.string(),
            condition: z.record(z.string(), z.unknown()),
            created_at: z.string(),
            transport: TransportResponse,
            cost: z.number(),
        })),
        total: z.number(),
        total_cost: z.number(),
        max_total_cost: z.number(),
    }),
    successCodes: [202],
    errorCodes: [400, 401, 403, 409, 429],
})

export type CreateEventSubSubscriptionRequestBody = InferRequestBody<typeof CreateEventSubSubscription>
export type CreateEventSubSubscriptionResponseBody = InferResponseBody<typeof CreateEventSubSubscription>

export const DeleteEventSubSubscription = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'DELETE',
    path: 'eventsub/subscriptions',
    requestQuery: z.object({
        id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type DeleteEventSubSubscriptionQuery = InferRequestQuery<typeof DeleteEventSubSubscription>

export const GetEventSubSubscriptions = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'eventsub/subscriptions',
    requestQuery: z.object({
        status: z.string().optional(),
        type: z.string().optional(),
        user_id: z.string().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            status: z.string(),
            type: z.string(),
            version: z.string(),
            condition: z.record(z.string(), z.any()),
            created_at: z.string(),
            transport: z.object({
                method: z.string(),
                callback: z.string().optional(),
                session_id: z.string().optional(),
                conduit_id: z.string().optional(),
            }),
            cost: z.number(),
        })),
        total: z.number(),
        total_cost: z.number(),
        max_total_cost: z.number(),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetEventSubSubscriptionsQuery = InferRequestQuery<typeof GetEventSubSubscriptions>
export type GetEventSubSubscriptionsResponseBody = InferResponseBody<typeof GetEventSubSubscriptions>

// Games Endpoints

export const GetTopGames = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'games/top',
    requestQuery: z.object({
        first: z.number().optional(),
        before: z.string().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            box_art_url: z.string(),
            igdb_id: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetTopGamesQuery = InferRequestQuery<typeof GetTopGames>
export type GetTopGamesResponseBody = InferResponseBody<typeof GetTopGames>

export const GetGames = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'games',
    requestQuery: z.object({
        id: z.string().or(z.array(z.string())).optional(),
        name: z.string().or(z.array(z.string())).optional(),
        igdb_id: z.string().or(z.array(z.string())).optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            box_art_url: z.string(),
            igdb_id: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetGamesQuery = InferRequestQuery<typeof GetGames>
export type GetGamesResponseBody = InferResponseBody<typeof GetGames>

// Goals Endpoints

export const GetCreatorGoals = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:goals',
    },
    method: 'GET',
    path: 'goals',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            broadcaster_id: z.string(),
            broadcaster_name: z.string(),
            broadcaster_login: z.string(),
            type: z.string(),
            description: z.string(),
            current_amount: z.number(),
            target_amount: z.number(),
            created_at: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetCreatorGoalsQuery = InferRequestQuery<typeof GetCreatorGoals>
export type GetCreatorGoalsResponseBody = InferResponseBody<typeof GetCreatorGoals>

// Guest Star Endpoints

export const GetChannelGuestStarSettings = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:guest_star', 'channel:manage:guest_star', 'moderator:read:guest_star', 'moderator:manage:guest_star'] },
    },
    method: 'GET',
    path: 'guest_star/channel_settings',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        is_moderator_send_live_enabled: z.boolean(),
        slot_count: z.number(),
        is_browser_source_audio_enabled: z.boolean(),
        group_layout: z.string(),
        browser_source_token: z.string(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetChannelGuestStarSettingsQuery = InferRequestQuery<typeof GetChannelGuestStarSettings>
export type GetChannelGuestStarSettingsResponseBody = InferResponseBody<typeof GetChannelGuestStarSettings>

export const UpdateChannelGuestStarSettings = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:guest_star',
    },
    method: 'PUT',
    path: 'guest_star/channel_settings',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.object({
        is_moderator_send_live_enabled: z.boolean().optional(),
        slot_count: z.number().optional(),
        is_browser_source_audio_enabled: z.boolean().optional(),
        group_layout: z.string().optional(),
    }),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401],
})

export type UpdateChannelGuestStarSettingsQuery = InferRequestQuery<typeof UpdateChannelGuestStarSettings>
export type UpdateChannelGuestStarSettingsRequestBody = InferRequestBody<typeof UpdateChannelGuestStarSettings>

export const GetGuestStarSession = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:guest_star', 'channel:manage:guest_star', 'moderator:read:guest_star', 'moderator:manage:guest_star'] },
    },
    method: 'GET',
    path: 'guest_star/session',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            guests: z.array(z.object({
                slot_id: z.string(),
                is_live: z.boolean(),
                user_id: z.string(),
                user_name: z.string(),
                user_login: z.string(),
                volume: z.number(),
                assigned_at: z.string(),
                audio_settings: z.object({
                    is_host_enabled: z.boolean(),
                    is_guest_enabled: z.boolean(),
                    is_available: z.boolean(),
                }),
                video_settings: z.object({
                    is_host_enabled: z.boolean(),
                    is_guest_enabled: z.boolean(),
                    is_available: z.boolean(),
                }),
            })),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type GetGuestStarSessionQuery = InferRequestQuery<typeof GetGuestStarSession>
export type GetGuestStarSessionResponseBody = InferResponseBody<typeof GetGuestStarSession>

export const CreateGuestStarSession = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:guest_star',
    },
    method: 'POST',
    path: 'guest_star/session',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            guests: z.array(z.any()),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type CreateGuestStarSessionQuery = InferRequestQuery<typeof CreateGuestStarSession>
export type CreateGuestStarSessionResponseBody = InferResponseBody<typeof CreateGuestStarSession>

export const EndGuestStarSession = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:guest_star',
    },
    method: 'DELETE',
    path: 'guest_star/session',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        session_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type EndGuestStarSessionQuery = InferRequestQuery<typeof EndGuestStarSession>

export const GetGuestStarInvites = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:guest_star', 'channel:manage:guest_star', 'moderator:read:guest_star', 'moderator:manage:guest_star'] },
    },
    method: 'GET',
    path: 'guest_star/invites',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        session_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            user_id: z.string(),
            invited_at: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type GetGuestStarInvitesQuery = InferRequestQuery<typeof GetGuestStarInvites>
export type GetGuestStarInvitesResponseBody = InferResponseBody<typeof GetGuestStarInvites>

export const SendGuestStarInvite = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:manage:guest_star', 'moderator:manage:guest_star'] },
    },
    method: 'POST',
    path: 'guest_star/invites',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        session_id: z.string(),
        guest_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type SendGuestStarInviteQuery = InferRequestQuery<typeof SendGuestStarInvite>

export const DeleteGuestStarInvite = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:manage:guest_star', 'moderator:manage:guest_star'] },
    },
    method: 'DELETE',
    path: 'guest_star/invites',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        session_id: z.string(),
        guest_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type DeleteGuestStarInviteQuery = InferRequestQuery<typeof DeleteGuestStarInvite>

export const AssignGuestStarSlot = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:manage:guest_star', 'moderator:manage:guest_star'] },
    },
    method: 'POST',
    path: 'guest_star/slot',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        session_id: z.string(),
        guest_id: z.string(),
        slot_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type AssignGuestStarSlotQuery = InferRequestQuery<typeof AssignGuestStarSlot>

export const UpdateGuestStarSlot = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:manage:guest_star', 'moderator:manage:guest_star'] },
    },
    method: 'PATCH',
    path: 'guest_star/slot',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        session_id: z.string(),
        source_slot_id: z.string(),
        destination_slot_id: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type UpdateGuestStarSlotQuery = InferRequestQuery<typeof UpdateGuestStarSlot>

export const DeleteGuestStarSlot = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:manage:guest_star', 'moderator:manage:guest_star'] },
    },
    method: 'DELETE',
    path: 'guest_star/slot',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        session_id: z.string(),
        guest_id: z.string(),
        slot_id: z.string(),
        should_reinvite_guest: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type DeleteGuestStarSlotQuery = InferRequestQuery<typeof DeleteGuestStarSlot>

export const UpdateGuestStarSlotSettings = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:manage:guest_star', 'moderator:manage:guest_star'] },
    },
    method: 'PATCH',
    path: 'guest_star/slot_settings',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        session_id: z.string(),
        slot_id: z.string(),
    }),
    requestBody: z.object({
        is_audio_enabled: z.boolean().optional(),
        is_video_enabled: z.boolean().optional(),
        is_live: z.boolean().optional(),
        volume: z.number().optional(),
    }),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type UpdateGuestStarSlotSettingsQuery = InferRequestQuery<typeof UpdateGuestStarSlotSettings>
export type UpdateGuestStarSlotSettingsRequestBody = InferRequestBody<typeof UpdateGuestStarSlotSettings>

// Hype Train Endpoints

export const GetHypeTrainEvents = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:hype_train',
    },
    method: 'GET',
    path: 'hypetrain/events',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        first: z.number().optional(),
        cursor: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            event_type: z.string(),
            event_timestamp: z.string(),
            version: z.string(),
            event_data: z.object({
                broadcaster_id: z.string(),
                cooldown_end_time: z.string(),
                expires_at: z.string(),
                goal: z.number(),
                id: z.string(),
                last_contribution: z.object({
                    total: z.number(),
                    type: z.string(),
                    user: z.string(),
                }),
                level: z.number(),
                started_at: z.string(),
                top_contributions: z.array(z.object({
                    total: z.number(),
                    type: z.string(),
                    user: z.string(),
                })),
                total: z.number(),
            }),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetHypeTrainEventsQuery = InferRequestQuery<typeof GetHypeTrainEvents>
export type GetHypeTrainEventsResponseBody = InferResponseBody<typeof GetHypeTrainEvents>

export const GetHypeTrainStatus = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:hype_train',
    },
    method: 'GET',
    path: 'hypetrain',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            broadcaster_id: z.string(),
            cooldown_end_time: z.string(),
            expires_at: z.string(),
            goal: z.number(),
            last_contribution: z.object({
                total: z.number(),
                type: z.string(),
                user_id: z.string(),
                user_login: z.string(),
                user_name: z.string(),
            }),
            level: z.number(),
            started_at: z.string(),
            top_contributions: z.array(z.object({
                total: z.number(),
                type: z.string(),
                user_id: z.string(),
                user_login: z.string(),
                user_name: z.string(),
            })),
            total: z.number(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetHypeTrainStatusQuery = InferRequestQuery<typeof GetHypeTrainStatus>
export type GetHypeTrainStatusResponseBody = InferResponseBody<typeof GetHypeTrainStatus>

// Moderation Endpoints

export const CheckAutoModStatus = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderation:read',
    },
    method: 'POST',
    path: 'moderation/enforcements/status',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.object({
        data: z.array(z.object({
            msg_id: z.string(),
            msg_text: z.string(),
            user_id: z.string(),
        })),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            msg_id: z.string(),
            is_permitted: z.boolean(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403],
})

export type CheckAutoModStatusQuery = InferRequestQuery<typeof CheckAutoModStatus>
export type CheckAutoModStatusRequestBody = InferRequestBody<typeof CheckAutoModStatus>
export type CheckAutoModStatusResponseBody = InferResponseBody<typeof CheckAutoModStatus>

export const ManageHeldAutoModMessages = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:manage:automod',
    },
    method: 'POST',
    path: 'moderation/automod/message',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        user_id: z.string(),
        msg_id: z.string(),
        action: z.string(),
    }),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 403, 404],
})

export type ManageHeldAutoModMessagesRequestBody = InferRequestBody<typeof ManageHeldAutoModMessages>

export const GetAutoModSettings = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:read:automod_settings',
    },
    method: 'GET',
    path: 'moderation/automod/settings',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            moderator_id: z.string(),
            overall_level: z.number().nullable(),
            disability: z.number(),
            aggression: z.number(),
            sexuality_sex_or_gender: z.number(),
            misogyny: z.number(),
            bullying: z.number(),
            swearing: z.number(),
            race_ethnicity_or_religion: z.number(),
            sex_based_terms: z.number(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetAutoModSettingsQuery = InferRequestQuery<typeof GetAutoModSettings>
export type GetAutoModSettingsResponseBody = InferResponseBody<typeof GetAutoModSettings>

export const UpdateAutoModSettings = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:manage:automod_settings',
    },
    method: 'PUT',
    path: 'moderation/automod/settings',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
    }),
    requestBody: z.object({
        overall_level: z.number().optional(),
        disability: z.number().optional(),
        aggression: z.number().optional(),
        sexuality_sex_or_gender: z.number().optional(),
        misogyny: z.number().optional(),
        bullying: z.number().optional(),
        swearing: z.number().optional(),
        race_ethnicity_or_religion: z.number().optional(),
        sex_based_terms: z.number().optional(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            moderator_id: z.string(),
            overall_level: z.number().nullable(),
            disability: z.number(),
            aggression: z.number(),
            sexuality_sex_or_gender: z.number(),
            misogyny: z.number(),
            bullying: z.number(),
            swearing: z.number(),
            race_ethnicity_or_religion: z.number(),
            sex_based_terms: z.number(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type UpdateAutoModSettingsQuery = InferRequestQuery<typeof UpdateAutoModSettings>
export type UpdateAutoModSettingsRequestBody = InferRequestBody<typeof UpdateAutoModSettings>
export type UpdateAutoModSettingsResponseBody = InferResponseBody<typeof UpdateAutoModSettings>

export const GetBannedUsers = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['moderation:read', 'moderator:read:banned_users'] },
    },
    method: 'GET',
    path: 'moderation/banned',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        user_id: z.string().or(z.array(z.string())).optional(),
        first: z.number().optional(),
        after: z.string().optional(),
        before: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
            expires_at: z.string(),
            created_at: z.string(),
            reason: z.string(),
            moderator_id: z.string(),
            moderator_login: z.string(),
            moderator_name: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetBannedUsersQuery = InferRequestQuery<typeof GetBannedUsers>
export type GetBannedUsersResponseBody = InferResponseBody<typeof GetBannedUsers>

export const BanUser = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:manage:banned_users',
    },
    method: 'POST',
    path: 'moderation/bans',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
    }),
    requestBody: z.object({
        data: z.object({
            user_id: z.string(),
            duration: z.number().optional(),
            reason: z.string().optional(),
        }),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            moderator_id: z.string(),
            user_id: z.string(),
            created_at: z.string(),
            end_time: z.string().or(z.null()),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403, 409, 429],
})

export type BanUserQuery = InferRequestQuery<typeof BanUser>
export type BanUserRequestBody = InferRequestBody<typeof BanUser>
export type BanUserResponseBody = InferResponseBody<typeof BanUser>

export const UnbanUser = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:manage:banned_users',
    },
    method: 'DELETE',
    path: 'moderation/bans',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        user_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 403],
})

export type UnbanUserQuery = InferRequestQuery<typeof UnbanUser>

export const GetUnbanRequests = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['moderator:read:unban_requests', 'moderator:manage:unban_requests'] },
    },
    method: 'GET',
    path: 'moderation/unban_requests',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        status: z.string(),
        user_id: z.string().optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
            text: z.string(),
            status: z.string(),
            created_at: z.string(),
            resolved_at: z.string().nullable(),
            resolution_text: z.string().nullable(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403],
})

export type GetUnbanRequestsQuery = InferRequestQuery<typeof GetUnbanRequests>
export type GetUnbanRequestsResponseBody = InferResponseBody<typeof GetUnbanRequests>

export const ResolveUnbanRequests = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:manage:unban_requests',
    },
    method: 'PATCH',
    path: 'moderation/unban_requests',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        unban_request_id: z.string(),
        status: z.string(),
    }),
    requestBody: z.object({
        resolution_text: z.string().optional(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
            moderator_id: z.string(),
            moderator_login: z.string(),
            moderator_name: z.string(),
            text: z.string(),
            status: z.string(),
            created_at: z.string(),
            resolved_at: z.string(),
            resolution_text: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403, 404, 409],
})

export type ResolveUnbanRequestsQuery = InferRequestQuery<typeof ResolveUnbanRequests>
export type ResolveUnbanRequestsRequestBody = InferRequestBody<typeof ResolveUnbanRequests>
export type ResolveUnbanRequestsResponseBody = InferResponseBody<typeof ResolveUnbanRequests>

export const GetBlockedTerms = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:read:blocked_terms',
    },
    method: 'GET',
    path: 'moderation/blocked_terms',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            moderator_id: z.string(),
            id: z.string(),
            text: z.string(),
            created_at: z.string(),
            updated_at: z.string(),
            expires_at: z.string().nullable(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetBlockedTermsQuery = InferRequestQuery<typeof GetBlockedTerms>
export type GetBlockedTermsResponseBody = InferResponseBody<typeof GetBlockedTerms>

export const AddBlockedTerm = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:manage:blocked_terms',
    },
    method: 'POST',
    path: 'moderation/blocked_terms',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
    }),
    requestBody: z.object({
        text: z.string(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            moderator_id: z.string(),
            id: z.string(),
            text: z.string(),
            created_at: z.string(),
            updated_at: z.string(),
            expires_at: z.string().nullable(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 409],
})

export type AddBlockedTermQuery = InferRequestQuery<typeof AddBlockedTerm>
export type AddBlockedTermRequestBody = InferRequestBody<typeof AddBlockedTerm>
export type AddBlockedTermResponseBody = InferResponseBody<typeof AddBlockedTerm>

export const RemoveBlockedTerm = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:manage:blocked_terms',
    },
    method: 'DELETE',
    path: 'moderation/blocked_terms',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type RemoveBlockedTermQuery = InferRequestQuery<typeof RemoveBlockedTerm>

export const DeleteChatMessages = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:manage:chat_messages',
    },
    method: 'DELETE',
    path: 'moderation/chat',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
        message_id: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 403, 404],
})

export type DeleteChatMessagesQuery = InferRequestQuery<typeof DeleteChatMessages>

export const GetModeratedChannels = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:read:moderated_channels',
    },
    method: 'GET',
    path: 'moderation/channels',
    requestQuery: z.object({
        user_id: z.string(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetModeratedChannelsQuery = InferRequestQuery<typeof GetModeratedChannels>
export type GetModeratedChannelsResponseBody = InferResponseBody<typeof GetModeratedChannels>

export const GetModerators = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['moderation:read', 'moderator:read:moderators'] },
    },
    method: 'GET',
    path: 'moderation/moderators',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        user_id: z.string().or(z.array(z.string())).optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetModeratorsQuery = InferRequestQuery<typeof GetModerators>
export type GetModeratorsResponseBody = InferResponseBody<typeof GetModerators>

export const AddChannelModerator = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:moderators',
    },
    method: 'POST',
    path: 'moderation/moderators',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        user_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 403, 422, 429],
})

export type AddChannelModeratorQuery = InferRequestQuery<typeof AddChannelModerator>

export const RemoveChannelModerator = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:moderators',
    },
    method: 'DELETE',
    path: 'moderation/moderators',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        user_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 403, 422, 429],
})

export type RemoveChannelModeratorQuery = InferRequestQuery<typeof RemoveChannelModerator>

export const GetVIPs = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['channel:read:vips', 'moderator:read:vips'] },
    },
    method: 'GET',
    path: 'channels/vips',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        user_id: z.string().or(z.array(z.string())).optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetVIPsQuery = InferRequestQuery<typeof GetVIPs>
export type GetVIPsResponseBody = InferResponseBody<typeof GetVIPs>

export const AddChannelVIP = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:vips',
    },
    method: 'POST',
    path: 'channels/vips',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        user_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 403, 409, 422, 425, 429],
})

export type AddChannelVIPQuery = InferRequestQuery<typeof AddChannelVIP>

export const RemoveChannelVIP = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:vips',
    },
    method: 'DELETE',
    path: 'channels/vips',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        user_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 403, 422, 425, 429],
})

export type RemoveChannelVIPQuery = InferRequestQuery<typeof RemoveChannelVIP>

export const UpdateShieldModeStatus = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:manage:shield_mode',
    },
    method: 'PUT',
    path: 'moderation/shield_mode',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
    }),
    requestBody: z.object({
        is_active: z.boolean(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            is_active: z.boolean(),
            moderator_id: z.string(),
            moderator_login: z.string(),
            moderator_name: z.string(),
            last_activated_at: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403],
})

export type UpdateShieldModeStatusQuery = InferRequestQuery<typeof UpdateShieldModeStatus>
export type UpdateShieldModeStatusRequestBody = InferRequestBody<typeof UpdateShieldModeStatus>
export type UpdateShieldModeStatusResponseBody = InferResponseBody<typeof UpdateShieldModeStatus>

export const GetShieldModeStatus = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: { any: ['moderator:read:shield_mode', 'moderator:manage:shield_mode'] },
    },
    method: 'GET',
    path: 'moderation/shield_mode',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            is_active: z.boolean(),
            moderator_id: z.string(),
            moderator_login: z.string(),
            moderator_name: z.string(),
            last_activated_at: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetShieldModeStatusQuery = InferRequestQuery<typeof GetShieldModeStatus>
export type GetShieldModeStatusResponseBody = InferResponseBody<typeof GetShieldModeStatus>

export const WarnChatUser = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'moderator:manage:warnings',
    },
    method: 'POST',
    path: 'moderation/warnings',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        moderator_id: z.string(),
    }),
    requestBody: z.object({
        user_id: z.string(),
        reason: z.string(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            user_id: z.string(),
            moderator_id: z.string(),
            reason: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403, 409],
})

export type WarnChatUserQuery = InferRequestQuery<typeof WarnChatUser>
export type WarnChatUserRequestBody = InferRequestBody<typeof WarnChatUser>
export type WarnChatUserResponseBody = InferResponseBody<typeof WarnChatUser>

// Polls Endpoints

export const GetPolls = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:polls',
    },
    method: 'GET',
    path: 'polls',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        id: z.string().or(z.array(z.string())).optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            broadcaster_id: z.string(),
            broadcaster_name: z.string(),
            broadcaster_login: z.string(),
            title: z.string(),
            choices: z.array(z.object({
                id: z.string(),
                title: z.string(),
                votes: z.number(),
                channel_points_votes: z.number(),
                bits_votes: z.number(),
            })),
            bits_voting_enabled: z.boolean(),
            bits_per_vote: z.number(),
            channel_points_voting_enabled: z.boolean(),
            channel_points_per_vote: z.number(),
            status: z.string(),
            duration: z.number(),
            started_at: z.string(),
            ended_at: z.string().nullable(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetPollsQuery = InferRequestQuery<typeof GetPolls>
export type GetPollsResponseBody = InferResponseBody<typeof GetPolls>

export const CreatePoll = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:polls',
    },
    method: 'POST',
    path: 'polls',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        broadcaster_id: z.string(),
        title: z.string(),
        choices: z.array(z.object({
            title: z.string(),
        })),
        bits_voting_enabled: z.boolean().optional(),
        bits_per_vote: z.number().optional(),
        channel_points_voting_enabled: z.boolean().optional(),
        channel_points_per_vote: z.number().optional(),
        duration: z.number(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            broadcaster_id: z.string(),
            broadcaster_name: z.string(),
            broadcaster_login: z.string(),
            title: z.string(),
            choices: z.array(z.object({
                id: z.string(),
                title: z.string(),
                votes: z.number(),
                channel_points_votes: z.number(),
                bits_votes: z.number(),
            })),
            bits_voting_enabled: z.boolean(),
            bits_per_vote: z.number(),
            channel_points_voting_enabled: z.boolean(),
            channel_points_per_vote: z.number(),
            status: z.string(),
            duration: z.number(),
            started_at: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type CreatePollRequestBody = InferRequestBody<typeof CreatePoll>
export type CreatePollResponseBody = InferResponseBody<typeof CreatePoll>

export const EndPoll = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:polls',
    },
    method: 'PATCH',
    path: 'polls',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        broadcaster_id: z.string(),
        id: z.string(),
        status: z.string(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            broadcaster_id: z.string(),
            broadcaster_name: z.string(),
            broadcaster_login: z.string(),
            title: z.string(),
            choices: z.array(z.object({
                id: z.string(),
                title: z.string(),
                votes: z.number(),
                channel_points_votes: z.number(),
                bits_votes: z.number(),
            })),
            bits_voting_enabled: z.boolean(),
            bits_per_vote: z.number(),
            channel_points_voting_enabled: z.boolean(),
            channel_points_per_vote: z.number(),
            status: z.string(),
            duration: z.number(),
            started_at: z.string(),
            ended_at: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type EndPollRequestBody = InferRequestBody<typeof EndPoll>
export type EndPollResponseBody = InferResponseBody<typeof EndPoll>

// Predictions Endpoints

export const GetPredictions = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:predictions',
    },
    method: 'GET',
    path: 'predictions',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        id: z.string().or(z.array(z.string())).optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            broadcaster_id: z.string(),
            broadcaster_name: z.string(),
            broadcaster_login: z.string(),
            title: z.string(),
            winning_outcome_id: z.string().nullable(),
            outcomes: z.array(z.object({
                id: z.string(),
                title: z.string(),
                users: z.number(),
                channel_points: z.number(),
                top_predictors: z.array(z.object({
                    user_id: z.string(),
                    user_name: z.string(),
                    user_login: z.string(),
                    channel_points_used: z.number(),
                    channel_points_won: z.number().nullable(),
                })).nullable(),
                color: z.string(),
            })),
            prediction_window: z.number(),
            status: z.string(),
            created_at: z.string(),
            ended_at: z.string().nullable(),
            locked_at: z.string().nullable(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetPredictionsQuery = InferRequestQuery<typeof GetPredictions>
export type GetPredictionsResponseBody = InferResponseBody<typeof GetPredictions>

export const CreatePrediction = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:predictions',
    },
    method: 'POST',
    path: 'predictions',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        broadcaster_id: z.string(),
        title: z.string(),
        outcomes: z.array(z.object({
            title: z.string(),
        })),
        prediction_window: z.number(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            broadcaster_id: z.string(),
            broadcaster_name: z.string(),
            broadcaster_login: z.string(),
            title: z.string(),
            winning_outcome_id: z.string().nullable(),
            outcomes: z.array(z.object({
                id: z.string(),
                title: z.string(),
                users: z.number(),
                channel_points: z.number(),
                top_predictors: z.array(z.any()).nullable(),
                color: z.string(),
            })),
            prediction_window: z.number(),
            status: z.string(),
            created_at: z.string(),
            ended_at: z.string().nullable(),
            locked_at: z.string().nullable(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type CreatePredictionRequestBody = InferRequestBody<typeof CreatePrediction>
export type CreatePredictionResponseBody = InferResponseBody<typeof CreatePrediction>

export const EndPrediction = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:predictions',
    },
    method: 'PATCH',
    path: 'predictions',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        broadcaster_id: z.string(),
        id: z.string(),
        status: z.string(),
        winning_outcome_id: z.string().optional(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            broadcaster_id: z.string(),
            broadcaster_name: z.string(),
            broadcaster_login: z.string(),
            title: z.string(),
            winning_outcome_id: z.string().nullable(),
            outcomes: z.array(z.object({
                id: z.string(),
                title: z.string(),
                users: z.number(),
                channel_points: z.number(),
                top_predictors: z.array(z.object({
                    user_id: z.string(),
                    user_name: z.string(),
                    user_login: z.string(),
                    channel_points_used: z.number(),
                    channel_points_won: z.number().nullable(),
                })).nullable(),
                color: z.string(),
            })),
            prediction_window: z.number(),
            status: z.string(),
            created_at: z.string(),
            ended_at: z.string(),
            locked_at: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type EndPredictionRequestBody = InferRequestBody<typeof EndPrediction>
export type EndPredictionResponseBody = InferResponseBody<typeof EndPrediction>

// Raids Endpoints

export const StartRaid = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:raids',
    },
    method: 'POST',
    path: 'raids',
    requestQuery: z.object({
        from_broadcaster_id: z.string(),
        to_broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            created_at: z.string(),
            is_mature: z.boolean(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403, 429],
})

export type StartRaidQuery = InferRequestQuery<typeof StartRaid>
export type StartRaidResponseBody = InferResponseBody<typeof StartRaid>

export const CancelRaid = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:raids',
    },
    method: 'DELETE',
    path: 'raids',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type CancelRaidQuery = InferRequestQuery<typeof CancelRaid>

// Schedule Endpoints

export const GetChannelStreamSchedule = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'schedule',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        id: z.string().or(z.array(z.string())).optional(),
        start_time: z.string().optional(),
        utc_offset: z.string().optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.object({
            segments: z.array(z.object({
                id: z.string(),
                start_time: z.string(),
                end_time: z.string(),
                title: z.string(),
                canceled_until: z.string().nullable(),
                category: z.object({
                    id: z.string(),
                    name: z.string(),
                }).nullable(),
                is_recurring: z.boolean(),
            })),
            broadcaster_id: z.string(),
            broadcaster_name: z.string(),
            broadcaster_login: z.string(),
            vacation: z.object({
                start_time: z.string(),
                end_time: z.string(),
            }).nullable(),
        }),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetChannelStreamScheduleQuery = InferRequestQuery<typeof GetChannelStreamSchedule>
export type GetChannelStreamScheduleResponseBody = InferResponseBody<typeof GetChannelStreamSchedule>

export const GetChannelICalendar = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'schedule/icalendar',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetChannelICalendarQuery = InferRequestQuery<typeof GetChannelICalendar>

export const UpdateChannelStreamSchedule = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:schedule',
    },
    method: 'PATCH',
    path: 'schedule/settings',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.object({
        is_vacation_enabled: z.boolean().optional(),
        vacation_start_time: z.string().optional(),
        vacation_end_time: z.string().optional(),
        timezone: z.string().optional(),
    }),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401],
})

export type UpdateChannelStreamScheduleQuery = InferRequestQuery<typeof UpdateChannelStreamSchedule>
export type UpdateChannelStreamScheduleRequestBody = InferRequestBody<typeof UpdateChannelStreamSchedule>

export const CreateChannelStreamScheduleSegment = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:schedule',
    },
    method: 'POST',
    path: 'schedule/segment',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.object({
        start_time: z.string(),
        timezone: z.string(),
        is_recurring: z.boolean(),
        duration: z.string().optional(),
        category_id: z.string().optional(),
        title: z.string().optional(),
    }),
    responseBody: z.object({
        data: z.object({
            segments: z.array(z.object({
                id: z.string(),
                start_time: z.string(),
                end_time: z.string(),
                title: z.string(),
                canceled_until: z.string().nullable(),
                category: z.object({
                    id: z.string(),
                    name: z.string(),
                }).nullable(),
                is_recurring: z.boolean(),
            })),
            broadcaster_id: z.string(),
            broadcaster_name: z.string(),
            broadcaster_login: z.string(),
            vacation: z.object({
                start_time: z.string(),
                end_time: z.string(),
            }).nullable(),
        }),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type CreateChannelStreamScheduleSegmentQuery = InferRequestQuery<typeof CreateChannelStreamScheduleSegment>
export type CreateChannelStreamScheduleSegmentRequestBody = InferRequestBody<typeof CreateChannelStreamScheduleSegment>
export type CreateChannelStreamScheduleSegmentResponseBody = InferResponseBody<typeof CreateChannelStreamScheduleSegment>

export const UpdateChannelStreamScheduleSegment = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:schedule',
    },
    method: 'PATCH',
    path: 'schedule/segment',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        id: z.string(),
    }),
    requestBody: z.object({
        start_time: z.string().optional(),
        duration: z.string().optional(),
        category_id: z.string().optional(),
        title: z.string().optional(),
        is_canceled: z.boolean().optional(),
        timezone: z.string().optional(),
    }),
    responseBody: z.object({
        data: z.object({
            segments: z.array(z.object({
                id: z.string(),
                start_time: z.string(),
                end_time: z.string(),
                title: z.string(),
                canceled_until: z.string().nullable(),
                category: z.object({
                    id: z.string(),
                    name: z.string(),
                }).nullable(),
                is_recurring: z.boolean(),
            })),
            broadcaster_id: z.string(),
            broadcaster_name: z.string(),
            broadcaster_login: z.string(),
            vacation: z.object({
                start_time: z.string(),
                end_time: z.string(),
            }).nullable(),
        }),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type UpdateChannelStreamScheduleSegmentQuery = InferRequestQuery<typeof UpdateChannelStreamScheduleSegment>
export type UpdateChannelStreamScheduleSegmentRequestBody = InferRequestBody<typeof UpdateChannelStreamScheduleSegment>
export type UpdateChannelStreamScheduleSegmentResponseBody = InferResponseBody<typeof UpdateChannelStreamScheduleSegment>

export const DeleteChannelStreamScheduleSegment = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:schedule',
    },
    method: 'DELETE',
    path: 'schedule/segment',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 404],
})

export type DeleteChannelStreamScheduleSegmentQuery = InferRequestQuery<typeof DeleteChannelStreamScheduleSegment>

// Search Endpoints

export const SearchCategories = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'search/categories',
    requestQuery: z.object({
        query: z.string(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            box_art_url: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type SearchCategoriesQuery = InferRequestQuery<typeof SearchCategories>
export type SearchCategoriesResponseBody = InferResponseBody<typeof SearchCategories>

export const SearchChannels = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'search/channels',
    requestQuery: z.object({
        query: z.string(),
        live_only: z.boolean().optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_language: z.string(),
            broadcaster_login: z.string(),
            display_name: z.string(),
            game_id: z.string(),
            game_name: z.string(),
            id: z.string(),
            is_live: z.boolean(),
            tags: z.array(z.string()),
            thumbnail_url: z.string(),
            title: z.string(),
            started_at: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type SearchChannelsQuery = InferRequestQuery<typeof SearchChannels>
export type SearchChannelsResponseBody = InferResponseBody<typeof SearchChannels>

// Streams Endpoints

export const GetStreamKey = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:stream_key',
    },
    method: 'GET',
    path: 'streams/key',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            stream_key: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetStreamKeyQuery = InferRequestQuery<typeof GetStreamKey>
export type GetStreamKeyResponseBody = InferResponseBody<typeof GetStreamKey>

export const GetStreams = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'streams',
    requestQuery: z.object({
        user_id: z.string().or(z.array(z.string())).optional(),
        user_login: z.string().or(z.array(z.string())).optional(),
        game_id: z.string().or(z.array(z.string())).optional(),
        type: z.string().optional(),
        language: z.string().or(z.array(z.string())).optional(),
        first: z.number().optional(),
        before: z.string().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
            game_id: z.string(),
            game_name: z.string(),
            type: z.string(),
            title: z.string(),
            tags: z.array(z.string()),
            viewer_count: z.number(),
            started_at: z.string(),
            language: z.string(),
            thumbnail_url: z.string(),
            is_mature: z.boolean(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetStreamsQuery = InferRequestQuery<typeof GetStreams>
export type GetStreamsResponseBody = InferResponseBody<typeof GetStreams>

export const GetFollowedStreams = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:read:follows',
    },
    method: 'GET',
    path: 'streams/followed',
    requestQuery: z.object({
        user_id: z.string(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
            game_id: z.string(),
            game_name: z.string(),
            type: z.string(),
            title: z.string(),
            tags: z.array(z.string()),
            viewer_count: z.number(),
            started_at: z.string(),
            language: z.string(),
            thumbnail_url: z.string(),
            is_mature: z.boolean(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetFollowedStreamsQuery = InferRequestQuery<typeof GetFollowedStreams>
export type GetFollowedStreamsResponseBody = InferResponseBody<typeof GetFollowedStreams>

export const CreateStreamMarker = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:broadcast',
    },
    method: 'POST',
    path: 'streams/markers',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        user_id: z.string(),
        description: z.string().optional(),
    }),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            created_at: z.string(),
            description: z.string(),
            position_seconds: z.number(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 403, 404],
})

export type CreateStreamMarkerRequestBody = InferRequestBody<typeof CreateStreamMarker>
export type CreateStreamMarkerResponseBody = InferResponseBody<typeof CreateStreamMarker>

export const GetStreamMarkers = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:read:broadcast',
    },
    method: 'GET',
    path: 'streams/markers',
    requestQuery: z.object({
        user_id: z.string().optional(),
        video_id: z.string().optional(),
        first: z.number().optional(),
        before: z.string().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            user_id: z.string(),
            user_name: z.string(),
            user_login: z.string(),
            videos: z.array(z.object({
                video_id: z.string(),
                markers: z.array(z.object({
                    id: z.string(),
                    created_at: z.string(),
                    description: z.string(),
                    position_seconds: z.number(),
                    URL: z.string(),
                })),
            })),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetStreamMarkersQuery = InferRequestQuery<typeof GetStreamMarkers>
export type GetStreamMarkersResponseBody = InferResponseBody<typeof GetStreamMarkers>

// Subscriptions Endpoints

export const GetBroadcasterSubscriptions = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:read:subscriptions',
    },
    method: 'GET',
    path: 'subscriptions',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        user_id: z.string().or(z.array(z.string())).optional(),
        first: z.number().optional(),
        after: z.string().optional(),
        before: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            gifter_id: z.string().optional(),
            gifter_login: z.string().optional(),
            gifter_name: z.string().optional(),
            is_gift: z.boolean(),
            tier: z.string(),
            plan_name: z.string(),
            user_id: z.string(),
            user_name: z.string(),
            user_login: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
        total: z.number(),
        points: z.number(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetBroadcasterSubscriptionsQuery = InferRequestQuery<typeof GetBroadcasterSubscriptions>
export type GetBroadcasterSubscriptionsResponseBody = InferResponseBody<typeof GetBroadcasterSubscriptions>

export const CheckUserSubscription = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:read:subscriptions',
    },
    method: 'GET',
    path: 'subscriptions/user',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        user_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            gifter_id: z.string().optional(),
            gifter_login: z.string().optional(),
            gifter_name: z.string().optional(),
            is_gift: z.boolean(),
            tier: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type CheckUserSubscriptionQuery = InferRequestQuery<typeof CheckUserSubscription>
export type CheckUserSubscriptionResponseBody = InferResponseBody<typeof CheckUserSubscription>

// Tags Endpoints

export const GetAllStreamTags = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'tags/streams',
    requestQuery: z.object({
        tag_id: z.string().or(z.array(z.string())).optional(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            tag_id: z.string(),
            is_auto: z.boolean(),
            localization_names: z.record(z.string(), z.string()),
            localization_descriptions: z.record(z.string(), z.string()),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetAllStreamTagsQuery = InferRequestQuery<typeof GetAllStreamTags>
export type GetAllStreamTagsResponseBody = InferResponseBody<typeof GetAllStreamTags>

export const GetStreamTags = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'streams/tags',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            tag_id: z.string(),
            is_auto: z.boolean(),
            localization_names: z.record(z.string(), z.string()),
            localization_descriptions: z.record(z.string(), z.string()),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetStreamTagsQuery = InferRequestQuery<typeof GetStreamTags>
export type GetStreamTagsResponseBody = InferResponseBody<typeof GetStreamTags>

// Teams Endpoints

export const GetChannelTeams = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'teams/channel',
    requestQuery: z.object({
        broadcaster_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            broadcaster_id: z.string(),
            broadcaster_login: z.string(),
            broadcaster_name: z.string(),
            background_image_url: z.string().nullable(),
            banner: z.string().nullable(),
            created_at: z.string(),
            updated_at: z.string(),
            info: z.string(),
            thumbnail_url: z.string(),
            team_name: z.string(),
            team_display_name: z.string(),
            id: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404],
})

export type GetChannelTeamsQuery = InferRequestQuery<typeof GetChannelTeams>
export type GetChannelTeamsResponseBody = InferResponseBody<typeof GetChannelTeams>

export const GetTeams = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'teams',
    requestQuery: z.object({
        name: z.string().optional(),
        id: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            users: z.array(z.object({
                user_id: z.string(),
                user_login: z.string(),
                user_name: z.string(),
            })),
            background_image_url: z.string().nullable(),
            banner: z.string().nullable(),
            created_at: z.string(),
            updated_at: z.string(),
            info: z.string(),
            thumbnail_url: z.string(),
            team_name: z.string(),
            team_display_name: z.string(),
            id: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401, 404, 500],
})

export type GetTeamsQuery = InferRequestQuery<typeof GetTeams>
export type GetTeamsResponseBody = InferResponseBody<typeof GetTeams>

// Users Endpoints

export const GetUsers = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'users',
    requestQuery: z.object({
        id: z.string().or(z.array(z.string())).optional(),
        login: z.string().or(z.array(z.string())).optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            login: z.string(),
            display_name: z.string(),
            type: z.string(),
            broadcaster_type: z.string(),
            description: z.string(),
            profile_image_url: z.string(),
            offline_image_url: z.string(),
            view_count: z.number(),
            email: z.string().optional(),
            created_at: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetUsersQuery = InferRequestQuery<typeof GetUsers>
export type GetUsersResponseBody = InferResponseBody<typeof GetUsers>

export const UpdateUser = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:edit',
    },
    method: 'PUT',
    path: 'users',
    requestQuery: z.object({
        description: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            login: z.string(),
            display_name: z.string(),
            type: z.string(),
            broadcaster_type: z.string(),
            description: z.string(),
            profile_image_url: z.string(),
            offline_image_url: z.string(),
            view_count: z.number(),
            email: z.string().optional(),
            created_at: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type UpdateUserQuery = InferRequestQuery<typeof UpdateUser>
export type UpdateUserResponseBody = InferResponseBody<typeof UpdateUser>

export const GetAuthorizationByUser = defineEndpoint({
    auth: {
        userAccessToken: true,
    },
    method: 'GET',
    path: 'users/authorization',
    requestQuery: z.undefined().optional(),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            client_id: z.string(),
            scopes: z.array(z.string()),
            user_id: z.string(),
            login: z.string(),
            expires_at: z.string(),
        })),
    }),
    successCodes: [200],
    errorCodes: [401],
})

export type GetAuthorizationByUserResponseBody = InferResponseBody<typeof GetAuthorizationByUser>

export const GetUserBlockList = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:read:blocked_users',
    },
    method: 'GET',
    path: 'users/blocks',
    requestQuery: z.object({
        broadcaster_id: z.string(),
        first: z.number().optional(),
        after: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            user_id: z.string(),
            user_login: z.string(),
            display_name: z.string(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetUserBlockListQuery = InferRequestQuery<typeof GetUserBlockList>
export type GetUserBlockListResponseBody = InferResponseBody<typeof GetUserBlockList>

export const BlockUser = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:manage:blocked_users',
    },
    method: 'PUT',
    path: 'users/blocks',
    requestQuery: z.object({
        target_user_id: z.string(),
        source_context: z.string().optional(),
        reason: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401],
})

export type BlockUserQuery = InferRequestQuery<typeof BlockUser>

export const UnblockUser = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:manage:blocked_users',
    },
    method: 'DELETE',
    path: 'users/blocks',
    requestQuery: z.object({
        target_user_id: z.string(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401],
})

export type UnblockUserQuery = InferRequestQuery<typeof UnblockUser>

export const GetUserExtensions = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:read:broadcast',
    },
    method: 'GET',
    path: 'users/extensions/list',
    requestQuery: z.undefined().optional(),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            version: z.string(),
            name: z.string(),
            can_activate: z.boolean(),
            type: z.array(z.string()),
        })),
    }),
    successCodes: [200],
    errorCodes: [401],
})

export type GetUserExtensionsResponseBody = InferResponseBody<typeof GetUserExtensions>

export const GetUserActiveExtensions = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:read:broadcast',
    },
    method: 'GET',
    path: 'users/extensions',
    requestQuery: z.object({
        user_id: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.object({
            panel: z.record(z.string(), z.object({
                active: z.boolean(),
                id: z.string().optional(),
                version: z.string().optional(),
                name: z.string().optional(),
            })).optional(),
            overlay: z.record(z.string(), z.object({
                active: z.boolean(),
                id: z.string().optional(),
                version: z.string().optional(),
                name: z.string().optional(),
            })).optional(),
            component: z.record(z.string(), z.object({
                active: z.boolean(),
                id: z.string().optional(),
                version: z.string().optional(),
                name: z.string().optional(),
                x: z.number().optional(),
                y: z.number().optional(),
            })).optional(),
        }),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetUserActiveExtensionsQuery = InferRequestQuery<typeof GetUserActiveExtensions>
export type GetUserActiveExtensionsResponseBody = InferResponseBody<typeof GetUserActiveExtensions>

export const UpdateUserExtensions = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:edit:broadcast',
    },
    method: 'PUT',
    path: 'users/extensions',
    requestQuery: z.undefined().optional(),
    requestBody: z.object({
        data: z.object({
            panel: z.record(z.string(), z.object({
                active: z.boolean(),
                id: z.string().optional(),
                version: z.string().optional(),
            })).optional(),
            overlay: z.record(z.string(), z.object({
                active: z.boolean(),
                id: z.string().optional(),
                version: z.string().optional(),
            })).optional(),
            component: z.record(z.string(), z.object({
                active: z.boolean(),
                id: z.string().optional(),
                version: z.string().optional(),
                x: z.number().optional(),
                y: z.number().optional(),
            })).optional(),
        }),
    }),
    responseBody: z.object({
        data: z.object({
            panel: z.record(z.string(), z.object({
                active: z.boolean(),
                id: z.string().optional(),
                version: z.string().optional(),
                name: z.string().optional(),
            })).optional(),
            overlay: z.record(z.string(), z.object({
                active: z.boolean(),
                id: z.string().optional(),
                version: z.string().optional(),
                name: z.string().optional(),
            })).optional(),
            component: z.record(z.string(), z.object({
                active: z.boolean(),
                id: z.string().optional(),
                version: z.string().optional(),
                name: z.string().optional(),
                x: z.number().optional(),
                y: z.number().optional(),
            })).optional(),
        }),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type UpdateUserExtensionsRequestBody = InferRequestBody<typeof UpdateUserExtensions>
export type UpdateUserExtensionsResponseBody = InferResponseBody<typeof UpdateUserExtensions>

// Videos Endpoints

export const GetVideos = defineEndpoint({
    auth: {
        appAccessToken: true,
        userAccessToken: true,
    },
    method: 'GET',
    path: 'videos',
    requestQuery: z.object({
        id: z.string().or(z.array(z.string())).optional(),
        user_id: z.string().optional(),
        game_id: z.string().optional(),
        language: z.string().optional(),
        period: z.string().optional(),
        sort: z.string().optional(),
        type: z.string().optional(),
        first: z.number().optional(),
        after: z.string().optional(),
        before: z.string().optional(),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.object({
            id: z.string(),
            stream_id: z.string().nullable(),
            user_id: z.string(),
            user_login: z.string(),
            user_name: z.string(),
            title: z.string(),
            description: z.string(),
            created_at: z.string(),
            published_at: z.string(),
            url: z.string(),
            thumbnail_url: z.string(),
            viewable: z.string(),
            view_count: z.number(),
            language: z.string(),
            type: z.string(),
            duration: z.string(),
            muted_segments: z.array(z.object({
                duration: z.number(),
                offset: z.number(),
            })).nullable(),
        })),
        pagination: z.object({
            cursor: z.string().optional(),
        }).optional(),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type GetVideosQuery = InferRequestQuery<typeof GetVideos>
export type GetVideosResponseBody = InferResponseBody<typeof GetVideos>

export const DeleteVideos = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'channel:manage:videos',
    },
    method: 'DELETE',
    path: 'videos',
    requestQuery: z.object({
        id: z.string().or(z.array(z.string())),
    }),
    requestBody: z.undefined().optional(),
    responseBody: z.object({
        data: z.array(z.string()),
    }),
    successCodes: [200],
    errorCodes: [400, 401],
})

export type DeleteVideosQuery = InferRequestQuery<typeof DeleteVideos>
export type DeleteVideosResponseBody = InferResponseBody<typeof DeleteVideos>

// Whispers Endpoints

export const SendWhisper = defineEndpoint({
    auth: {
        userAccessToken: true,
        userScopes: 'user:manage:whispers',
    },
    method: 'POST',
    path: 'whispers',
    requestQuery: z.object({
        from_user_id: z.string(),
        to_user_id: z.string(),
    }),
    requestBody: z.object({
        message: z.string(),
    }),
    responseBody: z.undefined().optional(),
    successCodes: [204],
    errorCodes: [400, 401, 403, 404, 429],
})

export type SendWhisperQuery = InferRequestQuery<typeof SendWhisper>
export type SendWhisperRequestBody = InferRequestBody<typeof SendWhisper>

export const ALL_ENDPOINTS = {
    StartCommercial,
    GetAdSchedule,
    SnoozeNextAd,
    GetExtensionAnalytics,
    GetGameAnalytics,
    GetBitsLeaderboard,
    GetCheermotes,
    GetExtensionTransactions,
    GetChannelInformation,
    ModifyChannelInformation,
    GetChannelEditors,
    GetFollowedChannels,
    GetChannelFollowers,
    CreateCustomRewards,
    DeleteCustomReward,
    GetCustomReward,
    GetCustomRewardRedemption,
    UpdateCustomReward,
    UpdateRedemptionStatus,
    GetCharityCampaign,
    GetCharityCampaignDonations,
    GetChatters,
    GetChannelEmotes,
    GetGlobalEmotes,
    GetEmoteSets,
    GetChannelChatBadges,
    GetGlobalChatBadges,
    GetChatSettings,
    GetSharedChatSession,
    GetUserEmotes,
    UpdateChatSettings,
    SendChatAnnouncement,
    SendShoutout,
    SendChatMessage,
    GetUserChatColor,
    UpdateUserChatColor,
    CreateClip,
    GetClips,
    GetClipsDownload,
    GetConduits,
    CreateConduits,
    UpdateConduits,
    DeleteConduit,
    GetConduitShards,
    UpdateConduitShards,
    GetContentClassificationLabels,
    GetDropsEntitlements,
    UpdateDropsEntitlements,
    GetExtensionConfigurationSegment,
    SetExtensionConfigurationSegment,
    SetExtensionRequiredConfiguration,
    SendExtensionPubSubMessage,
    GetExtensionLiveChannels,
    GetExtensionSecrets,
    CreateExtensionSecret,
    SendExtensionChatMessage,
    GetExtensions,
    GetReleasedExtensions,
    GetExtensionBitsProducts,
    UpdateExtensionBitsProduct,
    CreateEventSubSubscription,
    DeleteEventSubSubscription,
    GetEventSubSubscriptions,
    GetTopGames,
    GetGames,
    GetCreatorGoals,
    GetChannelGuestStarSettings,
    UpdateChannelGuestStarSettings,
    GetGuestStarSession,
    CreateGuestStarSession,
    EndGuestStarSession,
    GetGuestStarInvites,
    SendGuestStarInvite,
    DeleteGuestStarInvite,
    AssignGuestStarSlot,
    UpdateGuestStarSlot,
    DeleteGuestStarSlot,
    UpdateGuestStarSlotSettings,
    GetHypeTrainEvents,
    GetHypeTrainStatus,
    CheckAutoModStatus,
    ManageHeldAutoModMessages,
    GetAutoModSettings,
    UpdateAutoModSettings,
    GetBannedUsers,
    BanUser,
    UnbanUser,
    GetUnbanRequests,
    ResolveUnbanRequests,
    GetBlockedTerms,
    AddBlockedTerm,
    RemoveBlockedTerm,
    DeleteChatMessages,
    GetModeratedChannels,
    GetModerators,
    AddChannelModerator,
    RemoveChannelModerator,
    GetVIPs,
    AddChannelVIP,
    RemoveChannelVIP,
    UpdateShieldModeStatus,
    GetShieldModeStatus,
    WarnChatUser,
    GetPolls,
    CreatePoll,
    EndPoll,
    GetPredictions,
    CreatePrediction,
    EndPrediction,
    StartRaid,
    CancelRaid,
    GetChannelStreamSchedule,
    GetChannelICalendar,
    UpdateChannelStreamSchedule,
    CreateChannelStreamScheduleSegment,
    UpdateChannelStreamScheduleSegment,
    DeleteChannelStreamScheduleSegment,
    SearchCategories,
    SearchChannels,
    GetStreamKey,
    GetStreams,
    GetFollowedStreams,
    CreateStreamMarker,
    GetStreamMarkers,
    GetBroadcasterSubscriptions,
    CheckUserSubscription,
    GetAllStreamTags,
    GetStreamTags,
    GetChannelTeams,
    GetTeams,
    GetUsers,
    UpdateUser,
    GetAuthorizationByUser,
    GetUserBlockList,
    BlockUser,
    UnblockUser,
    GetUserExtensions,
    GetUserActiveExtensions,
    UpdateUserExtensions,
    GetVideos,
    DeleteVideos,
    SendWhisper,
}
