# Setup & Installation

## Prerequisites

- Mapbox account with access token
- AI coding assistant that supports MCP (Claude Code, Cursor, Windsurf, Cline, etc.)

## Option 1: Hosted Server (Recommended)

**Easiest setup** - Use Mapbox's hosted DevKit MCP server at:

```
https://mcp-devkit.mapbox.com/mcp
```

No installation required, just configure your AI assistant.

**Authentication:** The hosted server supports OAuth, so no token configuration needed! Simply add the server URL:

### For Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "mapbox-devkit-mcp": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp-devkit.mapbox.com/mcp"]
    }
  }
}
```

You'll be prompted to authenticate via OAuth on first use.

### For Claude Code

Claude Code supports both user-level and project-level MCP configuration:

**User-level** (applies to all projects) - `~/.claude.json`:

```json
{
  "mcpServers": {
    "mapbox-devkit": {
      "url": "https://mcp-devkit.mapbox.com/mcp"
    }
  }
}
```

**Project-level** (specific project, can commit to git) - `.mcp.json` in repository root:

```json
{
  "mcpServers": {
    "mapbox-devkit": {
      "url": "https://mcp-devkit.mapbox.com/mcp"
    }
  }
}
```

See [Claude Code settings documentation](https://code.claude.com/docs/en/settings) for more details on configuration scopes.

### For Cursor

Create or edit `.cursor/mcp.json` (project-local) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "mapbox-devkit": {
      "url": "https://mcp-devkit.mapbox.com/mcp"
    }
  }
}
```

After saving, restart Cursor. Click "Needs authentication" when prompted and follow the OAuth flow.

### For VS Code with Copilot

Create or edit `mcp.json`:

```json
{
  "servers": {
    "mapbox-devkit": {
      "type": "http",
      "url": "https://mcp-devkit.mapbox.com/mcp"
    }
  }
}
```

After saving, refresh the MCP service in VS Code. Requires GitHub Copilot with MCP support enabled.

### For Windsurf/Cline

Similar configuration using the hosted URL with OAuth support.

## Option 2: Self-Hosted (Advanced)

For development, debugging, or customization:

```bash
# Clone the DevKit server
git clone https://github.com/mapbox/mcp-devkit-server.git
cd mcp-devkit-server

# Install dependencies
npm install

# Build the server
npm run build
```

**Configuration for self-hosted (Claude Desktop):**

```json
{
  "mcpServers": {
    "MapboxDevKitServer": {
      "command": "node",
      "args": ["/Users/username/github-projects/mcp-devkit-server/dist/esm/index.js"],
      "env": {
        "MAPBOX_ACCESS_TOKEN": "some token"
      }
    }
  }
}
```

Replace `/Users/username/github-projects/` with your actual path.

## Verify Installation

Ask your AI assistant:

```
"List the available Mapbox DevKit tools"
```

You should see 30+ tools including:

- **Style tools**: `create_style_tool`, `list_styles_tool`, `update_style_tool`, `delete_style_tool`, `preview_style_tool`, etc.
- **Token tools**: `create_token_tool`, `list_tokens_tool`
- **Validation tools**: `validate_geojson_tool`, `validate_style_tool`, `validate_expression_tool`
- **Geographic tools**: `bounding_box_tool`, `coordinate_conversion_tool`, `tilequery_tool`
- **Documentation**: `get_latest_mapbox_docs_tool`
