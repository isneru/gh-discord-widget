import { loadConfig } from './config.ts'
import { buildPayload, pushToDiscord } from './discord.ts'
import {
    fetchProfile,
    fetchAllRepos,
    fetchContributionsTotal
} from './github.ts'
import {
    totalStars,
    topLanguage,
    truncateBio,
    resolveDisplayName,
    usesLanguage
} from './stats.ts'

async function main() {
    const config = loadConfig()
    const profile = await fetchProfile(
        config.githubUsername,
        config.githubToken
    )
    const repos = await fetchAllRepos(config.githubUsername, config.githubToken)
    const totalContributions = await fetchContributionsTotal(
        config.githubUsername,
        config.githubToken
    )

    const payload = buildPayload(profile, {
        displayName: resolveDisplayName(profile.name),
        description: truncateBio(profile.bio),
        totalStars: totalStars(repos),
        totalContributions,
        topLanguage: topLanguage(repos),
        usesRust: usesLanguage(repos, 'Rust')
    })

    await pushToDiscord(payload, config)
    console.log('Widget refreshed successfully')
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
