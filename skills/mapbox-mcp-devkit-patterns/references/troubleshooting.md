# Troubleshooting

## DevKit not appearing in AI assistant

**Check:**

1. MCP server running? Check logs
2. Config file in correct location?
3. Token environment variable set?
4. Path to `index.js` correct?

**Solution:** Restart AI assistant after config changes.

## Style creation fails

**Check:**

1. Access token has `styles:write` scope
2. Style name is unique
3. JSON is valid Mapbox Style Spec

**Solution:** Use `validate_style_tool` tool first.

## Token creation fails

**Check:**

1. Access token has `tokens:write` scope
2. Requested scopes are valid
3. URL restrictions are well-formed

**Solution:** Check token scope documentation via DevKit.

## Validation errors

**Check:**

1. GeoJSON follows spec (RFC 7946)
2. Coordinates are [longitude, latitude] order
3. Properties match expected schema

**Solution:** Ask AI to explain validation errors.

## Example Workflows

### Build a Restaurant Finder

```
You: "I'm building a restaurant finder app. Create:
1. A light, neutral style emphasizing restaurants
2. A token for localhost with minimal scopes
3. Validate this GeoJSON with restaurant locations: [paste]"

AI: [Creates style, token, validates data]

You: "Add filters to show only 4+ star restaurants"

AI: [Updates style with expression]

You: "Generate a preview URL"

AI: [Returns preview]
```

### Create Multi-Environment Setup

```
You: "Set up styles and tokens for dev, staging, prod:
- Dev: Full access, localhost
- Staging: Read-only, staging.example.com
- Prod: Minimal scopes, example.com

Each environment needs its own style variant."

AI: [Creates 3 styles and 3 tokens with specifications]
```

### Validate Third-Party Data

```
You: "I received GeoJSON from a vendor. Validate it, check for:
- Correct coordinate order
- Valid geometry types
- Required properties: name, address, category"

AI: [Validates, reports issues]

You: "Fix the issues and save cleaned data to data/locations.json"

AI: [Fixes, saves file]
```
