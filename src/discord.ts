import type { GithubProfile } from './github.ts'
import type { Config } from './config.ts'

export type DynamicField =
    | { type: 1; name: string; value: string }
    | { type: 2; name: string; value: number }
    | { type: 3; name: string; value: { url: string } }

export type DiscordPayload = {
    username: string
    data: {
        dynamic: DynamicField[]
    }
}

export type WidgetStats = {
    displayName: string
    description: string
    totalStars: number
    totalContributions: number
    topLanguage: string | null
    usesRust: boolean
}

export function buildPayload(profile: GithubProfile, stats: WidgetStats) {
    return {
        username: profile.login,
        data: {
            dynamic: [
                { type: 1, name: 'handle', value: `@${profile.login}` },
                { type: 1, name: 'display_name', value: stats.displayName },
                { type: 1, name: 'description', value: stats.description },
                { type: 3, name: 'avatar', value: { url: profile.avatarUrl } },
                { type: 2, name: 'followers', value: profile.followers },
                { type: 2, name: 'public_repos', value: profile.publicRepos },
                { type: 2, name: 'total_stars', value: stats.totalStars },
                {
                    type: 2,
                    name: 'total_contributions',
                    value: stats.totalContributions
                },
                {
                    type: 1,
                    name: 'top_language',
                    value: stats.topLanguage ?? 'N/A'
                },
                {
                    type: 1,
                    name: 'uses_rust', // label will be "Likes Femboys"
                    value: stats.usesRust ? 'Yes' : 'No'
                }
            ]
        }
    } as DiscordPayload
}

export async function pushToDiscord(payload: DiscordPayload, config: Config) {
    const url = `https://discord.com/api/v9/applications/${config.discordApplicationId}/users/${config.discordUserId}/identities/0/profile`
    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bot ${config.discordBotToken}`,
            'User-Agent': 'github-stats-discord-widget'
        },
        body: JSON.stringify(payload)
    })

    if (!res.ok) {
        throw new Error(`Discord API error: ${res.status} ${await res.text()}`)
    }
}
