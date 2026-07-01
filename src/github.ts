export type GithubProfile = {
    login: string
    name?: string | null
    bio: string | null
    avatarUrl: string
    followers: number
    publicRepos: number
}

export type GithubRepo = {
    stargazersCount: number
    language: string | null
}

const GITHUB_API_BASE = 'https://api.github.com'
const USER_AGENT = 'github-stats-discord-widget'

function githubHeaders(token: string) {
    return {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': USER_AGENT
    } as HeadersInit
}

export async function fetchProfile(username: string, token: string) {
    const res = await fetch(`${GITHUB_API_BASE}/users/${username}`, {
        headers: githubHeaders(token)
    })
    if (!res.ok) {
        throw new Error(
            `GitHub profile request failed: ${res.status} ${await res.text()}`
        )
    }

    const body = await res.json()

    return {
        login: body.login,
        name: body.name,
        bio: body.bio,
        avatarUrl: body.avatar_url,
        followers: body.followers,
        publicRepos: body.public_repos
    } as GithubProfile
}

export async function fetchAllRepos(username: string, token: string) {
    const repos: GithubRepo[] = []
    let page = 1

    for (;;) {
        const res = await fetch(
            `${GITHUB_API_BASE}/users/${username}/repos?per_page=100&page=${page}&type=owner`,
            { headers: githubHeaders(token) }
        )

        if (!res.ok) {
            throw new Error(
                `GitHub repos request failed: ${res.status} ${await res.text()}`
            )
        }

        const body = (await res.json()) as Array<{
            stargazers_count: number
            language: string | null
        }>
        for (const repo of body) {
            repos.push({
                stargazersCount: repo.stargazers_count,
                language: repo.language
            })
        }

        if (body.length < 100) break
        page += 1
    }

    return repos
}

const CONTRIBUTIONS_QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
        }
      }
    }
  }
`

export async function fetchContributionsTotal(username: string, token: string) {
    const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT
        },
        body: JSON.stringify({
            query: CONTRIBUTIONS_QUERY,
            variables: { login: username }
        })
    })

    if (!res.ok) {
        throw new Error(
            `GitHub GraphQL request failed: ${res.status} ${await res.text()}`
        )
    }

    const body = (await res.json()) as {
        data?: {
            user?: {
                contributionsCollection?: {
                    contributionCalendar?: { totalContributions?: number }
                }
            }
        }
        errors?: Array<{ message: string }>
    }

    if (body.errors && body.errors.length > 0) {
        throw new Error(
            `GitHub GraphQL errors: ${body.errors.map(e => e.message).join('; ')}`
        )
    }

    const total =
        body.data?.user?.contributionsCollection?.contributionCalendar
            ?.totalContributions
    if (typeof total !== 'number') {
        throw new Error('GitHub GraphQL response missing totalContributions')
    }

    return total
}
