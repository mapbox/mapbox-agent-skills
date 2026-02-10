# Mapbox MCP DevKit Patterns

Quick reference for using Mapbox MCP DevKit Server in AI coding workflows.

## What is DevKit?

MCP server that gives AI assistants access to Mapbox developer APIs for style management, token creation, validation, and documentation.

**Repo:** <https://github.com/mapbox/mcp-devkit-server>

## Setup

### Hosted (Recommended)

Use Mapbox's hosted server - no installation needed.

**Claude Desktop:**

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
// %APPDATA%\Claude\claude_desktop_config.json (Windows)
{
  "mcpServers": {
    "mapbox-devkit-mcp": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp-devkit.mapbox.com/mcp"]
    }
  }
}
```

**Claude Code:**

User-level (all projects) in `~/.claude.json`:

```json
{
  "mcpServers": {
    "mapbox-devkit": {
      "url": "https://mcp-devkit.mapbox.com/mcp"
    }
  }
}
```

Or project-level (specific project) in `.mcp.json`:

```json
{
  "mcpServers": {
    "mapbox-devkit": {
      "url": "https://mcp-devkit.mapbox.com/mcp"
    }
  }
}
```

**Cursor:**

```json
// .cursor/mcp.json or ~/.cursor/mcp.json
{
  "mcpServers": {
    "mapbox-devkit": {
      "url": "https://mcp-devkit.mapbox.com/mcp"
    }
  }
}
```

**VS Code with Copilot:**

```json
// mcp.json
{
  "servers": {
    "mapbox-devkit": {
      "type": "http",
      "url": "https://mcp-devkit.mapbox.com/mcp"
    }
  }
}
```

### Self-Hosted (Advanced)

```bash
git clone https://github.com/mapbox/mcp-devkit-server.git
cd mcp-devkit-server && npm install && npm run build
```

Configure in Claude Desktop config:

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

## Core Tools

### Style Management

| Tool                    | Purpose                   | Example Use                                |
| ----------------------- | ------------------------- | ------------------------------------------ |
| **create_style_tool**   | Create new style          | "Create dark mode style with 3D buildings" |
| **list_styles_tool**    | List all styles           | "Show my styles"                           |
| **retrieve_style_tool** | Get style details         | "Show details of my light style"           |
| **update_style_tool**   | Modify existing style     | "Make roads more prominent"                |
| **delete_style_tool**   | Delete a style            | "Delete my test style"                     |
| **preview_style_tool**  | Generate preview URL      | "Preview this style at downtown SF"        |
| **style_builder_tool**  | Build style from template | "Create a style for navigation"            |
| **validate_style_tool** | Check style JSON          | "Validate this style"                      |
| **compare_styles_tool** | Compare two styles        | "Compare light vs dark style"              |
| **optimize_style_tool** | Optimize style JSON       | "Optimize this style for performance"      |

### Token Management

| Tool             | Purpose               | Example Use                  |
| ---------------- | --------------------- | ---------------------------- |
| **create_token** | Generate access token | "Create token for localhost" |
| **list_tokens**  | Show all tokens       | "List my tokens and scopes"  |

### Validation & Analysis

| Tool                          | Purpose                | Example Use                               |
| ----------------------------- | ---------------------- | ----------------------------------------- |
| **validate_geojson_tool**     | Check GeoJSON          | "Validate this GeoJSON"                   |
| **validate_expression_tool**  | Check expression       | "Is this expression valid?"               |
| **geojson_preview_tool**      | Preview GeoJSON on map | "Preview this GeoJSON"                    |
| **check_color_contrast_tool** | Check WCAG contrast    | "Check if #FF0000 on #FFFFFF passes WCAG" |

### Geographic Utilities

| Tool                           | Purpose                    | Example Use                         |
| ------------------------------ | -------------------------- | ----------------------------------- |
| **bounding_box_tool**          | Get bounding box for area  | "Get bbox for San Francisco"        |
| **country_bounding_box_tool**  | Get country bounds         | "Get bounding box for France"       |
| **coordinate_conversion_tool** | Convert coordinate systems | "Convert lat/lng to Web Mercator"   |
| **tilequery_tool**             | Query tile data at point   | "What features at this coordinate?" |

### Feedback & Data

| Tool                   | Purpose            | Example Use            |
| ---------------------- | ------------------ | ---------------------- |
| **get_feedback_tool**  | Get feedback item  | "Get feedback #12345"  |
| **list_feedback_tool** | List user feedback | "Show recent feedback" |

### Documentation

| Tool                            | Purpose            | Example Use                       |
| ------------------------------- | ------------------ | --------------------------------- |
| **get_latest_mapbox_docs_tool** | Access Mapbox docs | "What are fill layer properties?" |

## Common Workflows

### Create Style

```
"Create a style for a real estate app:
- Emphasize property boundaries in purple
- Show parks in green
- Muted roads
- 3D buildings at zoom 15+"
```

Returns: Style ID and preview URL

### Create Scoped Token

```
"Create a token with:
- styles:read, fonts:read
- Restricted to: localhost, example.com"
```

### Validate Data

```
"Validate this GeoJSON:
{ \"type\": \"FeatureCollection\", ... }

Check for:
- Valid coordinates
- Required properties: name, address"
```

### Iterative Development

```
1. "Create a light style for a delivery app"
2. [View preview URL]
3. "Add restaurant POIs with icons"
4. "Make delivery zones semi-transparent"
5. [Iterate until satisfied]
```

## When to Use DevKit

| Scenario                    | Use DevKit | Use Direct APIs |
| --------------------------- | ---------- | --------------- |
| Development-time operations | ✅         |                 |
| Production runtime          |            | ✅              |
| Style creation/updates      | ✅         |                 |
| Tile serving                |            | ✅              |
| Token generation            | ✅         |                 |
| Map rendering               |            | ✅              |
| Data validation             | ✅         |                 |
| High-frequency updates      |            | ✅              |
| Learning/prototyping        | ✅         |                 |
| User-facing features        |            | ✅              |
| Documentation lookup        | ✅         |                 |
| Client-side operations      |            | ✅              |

## Validation Patterns

```javascript
// Validate before using
"Validate GeoJSON" → Fix issues → Create style

// Validate expressions
"Is ['case', ['<', ['get', 'pop'], 1000], 'small', 'large'] valid?"

// Convert coordinates
"Convert -122.4194, 37.7749 to Web Mercator"
```

## Token Scopes

| Scope             | Grants Access To     |
| ----------------- | -------------------- |
| **styles:read**   | Read styles          |
| **styles:write**  | Create/update styles |
| **fonts:read**    | Load fonts           |
| **datasets:read** | Read datasets        |
| **tokens:write**  | Create tokens        |
| **uploads:read**  | Read uploads         |

**Best practice:** Use minimal scopes + URL restrictions

## Example: Multi-Environment Setup

```
"Create 3 environments:

Dev:
- Token: all scopes, localhost only
- Style: app-dev (debug labels enabled)

Staging:
- Token: read-only, staging.example.com
- Style: app-staging (production-like)

Prod:
- Token: minimal scopes, example.com
- Style: app-prod (optimized)"
```

## Troubleshooting

| Issue                | Solution                                        |
| -------------------- | ----------------------------------------------- |
| DevKit not found     | Check MCP config path, restart AI assistant     |
| Style creation fails | Verify token has `styles:write` scope           |
| Token creation fails | Need `tokens:write` scope                       |
| Validation errors    | Check GeoJSON spec (RFC 7946), coordinate order |

## Integration Patterns

**With Mapbox Studio:**

- DevKit: Quick creation, AI iteration
- Studio: Fine-tuning, visual editing

**With Version Control:**

```
1. "Create style and save JSON to styles/map.json"
2. Review changes in git
3. Commit to repository
```

**With CI/CD:**

```
1. Style JSON in repo
2. Validate via DevKit in CI
3. Deploy to Mapbox on merge
```

## Resources

- [DevKit Server](https://github.com/mapbox/mcp-devkit-server)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Style Spec](https://docs.mapbox.com/style-spec/)
- [Token Scopes](https://docs.mapbox.com/api/accounts/tokens/)
