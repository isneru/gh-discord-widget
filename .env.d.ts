declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production'
            GITHUB_AUTH_TOKEN: string
            DISCORD_BOT_TOKEN: string
            DISCORD_APPLICATION_ID: string
            DISCORD_USER_ID: string
            GH_STATS_USERNAME: string
            GH_PAT: string
        }
    }
}

export {}
