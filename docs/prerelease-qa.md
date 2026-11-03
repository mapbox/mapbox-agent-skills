# Testing the Mapbox plugins before a release

Use this guide to test an unreleased MCP server build the way users get it: inside the plugin, together with the skills. A plain connector test leaves the skills out.

## What ships, and what you test

| Artifact                                          | Contents                                          | Test package                                             |
| ------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| OpenAI plugin (one listing for ChatGPT and Codex) | skills + the `mapbox` server                      | `dist/<env>/openai/`                                     |
| Claude Code plugin                                | skills + `mapbox`, `mapbox-devkit`, `mapbox-docs` | `dist/<env>/claude-code/`                                |
| Claude connector (MCP App on claude.ai)           | the `mapbox` server only, no skills               | nothing to build: point a custom connector at the server |

All plugin packages come from `plugin.config.json`. Production and test builds run through the same code. A test build differs from what gets submitted only in:

- server URLs
- a `-local` or `-staging` version suffix
- a "(local)" or "(staging)" suffix on the display name (OpenAI only)
- the marketplace it installs from (`mapbox-local` or `mapbox-staging`)

`npm run validate:plugin` checks this for every target and environment. Every package the build produces also passes the vendor rules it encodes, such as OpenAI's one MCP server per submitted plugin.

The plugin name stays `mapbox`, so tool names (for example `mcp__plugin_mapbox_mapbox__search_and_geocode_tool`) match production.

## Choose the servers

| Env       | Server URLs come from                                                                                                    | Use for                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `local`   | `mapbox` at `http://localhost:3333/mcp`. Other servers use their staging URL if one is configured, otherwise production. | the iteration loop                            |
| `staging` | `plugin.config.local.json` (gitignored), or `--url`                                                                      | testing against a deployed pre-release server |

### Run the server locally

Run [mcp-server](https://github.com/mapbox/mcp-server) over HTTP:

```bash
npm install && npm run build
MAPBOX_ACCESS_TOKEN=<token> MAPBOX_PUBLIC_TOKEN=<public token> npm run dev:http
```

Claude Code and the Codex CLI run on your machine, so they can reach `localhost` directly. ChatGPT and claude.ai call MCP servers from their own cloud, so they need a public HTTPS tunnel:

```bash
ngrok http 3333
npm run build:plugin -- --env local --url mapbox=https://<id>.ngrok.app/mcp
```

`--url` overrides one server for this build only. The value is never written to a config file.

The local dev server has no OAuth and uses your `MAPBOX_ACCESS_TOKEN` for every call. It also registers only tools and resources. Run a final pass against a deployed server before release.

### Point at a deployed pre-release server

Staging URLs are not committed to this public repo. Put them in `plugin.config.local.json`, which is gitignored:

```json
{
  "servers": {
    "mapbox": { "staging": "https://<staging host>/mcp" },
    "mapbox-devkit": { "staging": "https://<staging host>/mcp" },
    "mapbox-docs": { "staging": "https://<staging host>/mcp" }
  }
}
```

Mapbox staff can find the staging hosts in the internal QA notes.

## Build the test packages

```bash
npm run build:plugin -- --env staging          # both targets
npm run build:plugin -- --env local --target claude-code
```

The build prints each server URL it used, so check them before installing. `npm run validate:plugin` also validates `plugin.config.local.json` when it exists.

## 1. OpenAI plugin (ChatGPT and Codex)

### Codex

```bash
codex plugin marketplace add ./dist/staging/openai
codex plugin marketplace list
```

Restart Codex, then install `mapbox` from the "Mapbox Agent Skills (staging)" marketplace. Check that the plugin lists only the `mapbox` MCP server.

To remove it afterwards, run `codex plugin marketplace remove mapbox-staging`.

### ChatGPT, skills and MCP together

ChatGPT's web flow can't upload a local package with skills. Use the ChatGPT desktop app in Work mode instead:

1. Copy `dist/<env>/openai/plugins/mapbox` into `~/.codex/plugins/mapbox`, with a matching entry in `~/.agents/plugins/marketplace.json`. Or ask `@plugin-creator` to install it from that folder.
2. Restart the desktop app, then pick the plugin with `@`.

ChatGPT can't reach `localhost`, so the package must use a deployed or ngrok URL.

### ChatGPT web, MCP only

1. On `https://chatgpt.com/plugins`, choose **+ → Add custom MCP server**.
2. Enter the server URL. Use OAuth for a deployed server, or no auth for the local dev server.
3. Choose **Create as a plugin**.

This tests OAuth and the `render_map_tool` map iframe, but not the skills. Pair it with the desktop test above.

## 2. Claude Code plugin

To load it for one session only:

```bash
claude --plugin-dir ./dist/staging/claude-code/mapbox
```

`--plugin-dir` takes the place of an installed plugin with the same name for that session, so the production plugin doesn't collide with it.

To install it from a local marketplace instead, disable the production plugin first, then run:

```text
/plugin marketplace add ./dist/staging/claude-code
/plugin install mapbox@mapbox-staging
```

Run `/mcp` and confirm each server points at the URL the build printed. Servers that use OAuth show "needs auth" until you authenticate them from `/mcp`. Headless `claude -p` runs can't complete OAuth, so test those servers interactively. When you're done, run `/plugin uninstall mapbox@mapbox-staging` and `/plugin marketplace remove mapbox-staging`.

`claude plugin validate --strict ./dist/staging/claude-code/mapbox` runs the same checks as Anthropic's plugin directory. Icon and privacy-policy warnings are expected: the production manifest doesn't set them yet.

## 3. Claude connector (claude.ai)

There is no package to build: the connector is the bare `mapbox` server.

1. In claude.ai, go to **Settings → Connectors → Add custom connector**.
2. Enter the deployed server URL (OAuth) or your ngrok URL (local dev server, no auth).
3. Exercise `render_map_tool`, which renders the MCP App map iframe, plus the tools that changed in this release.

## Checks to run alongside

- **mcp-server:**

  ```bash
  npm test
  npm run typecheck
  npm run inspect:dev
  npm run eval:tools
  npm run eval:tools:openai
  ```

- **This repo:** `npm run check` and `npm run eval:diff`.

## Changing what ships

Edit `plugin.config.json`. It holds the version, description, production and local server URLs, which servers each target ships, and which skill files each target leaves out. Then run:

```bash
npm run build:plugin
npm run check
```

CI fails if a generated manifest is edited by hand, or if a target breaks a vendor rule.
