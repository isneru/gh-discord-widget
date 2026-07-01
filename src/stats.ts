export const BIO_MAX_LENGTH = 100
export const NO_BIO_FALLBACK = 'No bio yet'
export const NO_DISPLAY_NAME_FALLBACK = 'No display name set'

export function totalStars(repos: Array<{ stargazersCount: number }>): number {
    return repos.reduce((sum, repo) => sum + repo.stargazersCount, 0)
}

export function topLanguage(repos: Array<{ language: string | null }>) {
    const counts = new Map<string, number>()
    for (const repo of repos) {
        if (!repo.language) continue
        counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1)
    }
    let best: string | null = null
    let bestCount = 0

    for (const [language, count] of counts) {
        if (count > bestCount) {
            best = language
            bestCount = count
        }
    }

    return best
}

export function truncateBio(bio?: string | null) {
    if (!bio || bio.trim().length === 0) {
        return NO_BIO_FALLBACK
    }
    if (bio.length <= BIO_MAX_LENGTH) {
        return bio
    }
    return `${bio.slice(0, BIO_MAX_LENGTH).trimEnd()}...`
}

export function resolveDisplayName(name?: string | null) {
    if (!name || name.trim().length === 0) {
        return NO_DISPLAY_NAME_FALLBACK
    }
    return name
}

export function usesLanguage(
    repos: Array<{ language: string | null }>,
    language: string
): boolean {
    return repos.some(repo => repo.language === language)
}
