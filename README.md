# GitHub Stats Discord Widget

Displays your GitHub handle, display name, and bio, plus stats (followers,
public repos, total stars, yearly contributions, top language, and whether
you use Rust anywhere) on your Discord profile, using Discord's experimental
"Widgets v2" feature. A GitHub Actions workflow refreshes the data once a
day.

This repo only automates the _data refresh_. Creating the Discord
application and designing the widget itself must be done once, by hand, in
Discord's UI - that part can't be scripted. Follow the steps below in order.

## 1. One-time Discord setup

1. Create an application at the
   [Discord Developer Portal](https://discord.com/developers/home).
2. Under **Games -> Social SDK**, fill out the access request form. No real
   game is required; access is granted instantly.
3. Open the Developer Portal in your browser and open its DevTools console.
   Widgets v2's editor is gated behind an experiment flag not exposed in the
   UI. Paste this to unlock it for your current tab (community-sourced
   technique, may change if Discord alters their client internals):

    ```js
    let _mods = webpackChunkdiscord_developers.push([[Symbol()], {}, r => r.c])
    webpackChunkdiscord_developers.pop()

    let findByProps = (...props) => {
        for (let m of Object.values(_mods)) {
            try {
                if (!m.exports || m.exports === window) continue
                if (props.every(x => m.exports?.[x])) return m.exports
                for (let ex in m.exports) {
                    if (
                        props.every(x => m.exports?.[ex]?.[x]) &&
                        m.exports[ex][Symbol.toStringTag] !==
                            'IntlMessagesProxy'
                    )
                        return m.exports[ex]
                }
            } catch {}
        }
    }

    findByProps('getAll')
        .getAll()
        .find(e => e.getName() === 'ApexExperimentStore')
        .createOverride('2026-03-widget-config-editor', 1)
    ```

4. Click the back arrow, then re-open your application page (do not
   refresh - that clears the override). A **Widgets** page now appears
   under Games.
5. Click **Create widget**. Build a Widget Top and Widget Bottom with these
   fields (matching what `src/discord.ts` sends):

    | Widget field | Value Type | Data Field name       | Field type |
    | ------------ | ---------- | --------------------- | ---------- |
    | Top field    | User Data  | `handle`              | Text       |
    | Top field    | User Data  | `display_name`        | Text       |
    | Top field    | User Data  | `description`         | Text       |
    | Top icon     | User Data  | `avatar`              | Image      |
    | Bottom row   | User Data  | `followers`           | Number     |
    | Bottom row   | User Data  | `public_repos`        | Number     |
    | Bottom row   | User Data  | `total_stars`         | Number     |
    | Bottom row   | User Data  | `total_contributions` | Number     |
    | Bottom row   | User Data  | `top_language`        | Text       |
    | Bottom row   | User Data  | `uses_rust`           | Text       |

    `uses_rust` is `"Yes"`/`"No"` based on whether any of your public repos
    list Rust as their language (not necessarily your top language) - give
    that row whatever label text you want in the editor.

    Give every field a sensible fallback (shown before the first successful
    sync). Style it however you like.

    > **Note:** the exact JSON shape the editor expects wasn't independently
    > verified when this repo was built - it's based on a third-party
    > tutorial's example. Use the editor's **Generate Json** button on the
    > Sample Data tab to check the real field names/shape, and adjust the
    > `name` values in `buildPayload` (`src/discord.ts`) if they don't match.

6. Click **Save Changes**, then **Publish**.
7. Go to your application's **OAuth2** page. Add a redirect URI (pointing
   it at `https://discord.com` works fine). Under the OAuth2 URL
   Generator, check scopes `openid` and `sdk.social_layer`, select your
   redirect URI, and copy the generated URL. Change `response_type=code`
   to `response_type=token` in that URL, then open it once in your browser
   to confirm it doesn't error.

## 2. Issue your identity (personal-use shortcut)

Because this widget is for your own profile only, you self-authorize once
instead of running a bot with slash commands:

1. In Discord's client settings, go to **Authorized Apps**, find your
   application, and confirm it has the permissions requested during step
   1.7's authorization.
2. In the Developer Portal, go to your application's **Bot** page and reset
   the bot token. Save it somewhere safe - you'll need it both here and as
   the `DISCORD_BOT_TOKEN` secret in step 3.
3. Run the following once (replace the placeholders), using `curl` or
   PowerShell's `Invoke-RestMethod`:

    ```bash
    curl -X PATCH \
      "https://discord.com/api/v9/applications/<discordApplicationId>/users/<yourDiscordUserId>/identities/0/profile" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bot <botToken>" \
      -H "User-Agent: github-stats-discord-widget" \
      -d '{"username":"placeholder","data":{"dynamic":[]}}'
    ```

    A successful (non-error) response means your identity is issued and the
    widget will stop showing "still syncing".

## 3. Configure secrets and enable the workflow

This repo reads everything from environment variables - no source edits
needed. In your fork's **Settings -> Secrets and variables -> Actions**,
add:

| Secret                   | Value                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `GH_STATS_USERNAME`      | Your GitHub username                                                                                |
| `GH_PAT`                 | A GitHub Personal Access Token (no special scopes needed for public data, but needs GraphQL access) |
| `DISCORD_APPLICATION_ID` | Your Discord application's ID                                                                       |
| `DISCORD_USER_ID`        | Your Discord user ID                                                                                |
| `DISCORD_BOT_TOKEN`      | The bot token from step 2.2                                                                         |

The workflow at `.github/workflows/refresh.yml` runs daily at 06:00 UTC. To
run it immediately after setting secrets, go to the **Actions** tab, select
**Refresh Discord Widget**, and click **Run workflow**.

## 4. Attach the widget to your profile

Discord currently requires a browser console snippet (not something this
repo can automate) to attach a widget to your profile. Join the
[Discord Previews server](https://discord.gg/discord-603970300668805120)
and follow the pinned instructions in their widgets thread. Make sure the
`2026-03-application-widget-v2-renderer` experiment is set to Variant 1.

## Local development

```bash
npm install
npm run typecheck
```

To run the real refresh against your own data, copy `.env.example` to
`.env`, fill in the five values, then:

```bash
npm run dev      # loads .env via Node's built-in --env-file flag, no dotenv dependency
```

`npm start` (used by the GitHub Actions workflow) does not read `.env` -
in CI, the same five variables are injected directly as job env vars from
the repo's secrets instead.
