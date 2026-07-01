export type Config = {
    githubUsername: string
    githubToken: string
    discordApplicationId: string
    discordUserId: string
    discordBotToken: string
}

const REQUIRED_VARS = [
    'GH_STATS_USERNAME',
    'GH_PAT',
    'DISCORD_APPLICATION_ID',
    'DISCORD_USER_ID',
    'DISCORD_BOT_TOKEN'
] as const

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
    const missing = REQUIRED_VARS.filter(
        key => !env[key] || env[key]!.trim() === ''
    )
    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variable(s): ${missing.join(', ')}`
        )
    }

    return {
        githubUsername: env.GH_STATS_USERNAME,
        githubToken: env.GH_PAT,
        discordApplicationId: env.DISCORD_APPLICATION_ID,
        discordUserId: env.DISCORD_USER_ID,
        discordBotToken: env.DISCORD_BOT_TOKEN
    } as Config
}
