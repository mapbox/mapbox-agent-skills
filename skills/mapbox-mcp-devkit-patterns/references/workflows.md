# Core Workflows

## 1. Style Management

**Create a style conversationally:**

```
"Create a dark mode Mapbox style with 3D buildings, emphasize parks in green,
and use blue for water. Name it 'app-dark-mode'."
```

The AI will use `create_style_tool` tool to:

- Generate style JSON following Mapbox Style Spec
- Upload to your Mapbox account
- Return style ID and preview URL

**Update existing style:**

```
"Update style mapbox://styles/username/style-id to make roads more prominent
and reduce building opacity to 0.6"
```

**Validate style:**

```
"Validate this style JSON: [paste style]"
```

## 2. Token Management

**Create scoped token:**

```
"Create a Mapbox token with these scopes:
- styles:read
- fonts:read
- datasets:read
Restrict it to domains: localhost, example.com"
```

**List existing tokens:**

```
"Show me all my Mapbox tokens and their scopes"
```

**Use case:** Generate tokens for different environments (development, staging, production) with appropriate restrictions.

## 3. Data Validation

**Validate GeoJSON:**

```
"Validate this GeoJSON and show any errors:
{
  \"type\": \"FeatureCollection\",
  \"features\": [...]
}"
```

**Validate expressions:**

```
"Is this a valid Mapbox expression?
['case', ['<', ['get', 'population'], 1000], 'small', 'large']"
```

**Coordinate conversion:**

```
"Convert longitude -122.4194, latitude 37.7749 from WGS84 to Web Mercator"
```

## 4. Documentation Access

**Get style spec info:**

```
"What properties are available for fill layers in Mapbox GL JS?"
```

**Check token scopes:**

```
"What token scopes do I need to use the Directions API?"
```

**Streets v8 fields:**

```
"What fields are available in the 'road' layer of Streets v8?"
```

## Best Practices

### Security

- **Never commit access tokens** - Use environment variables
- **Use scoped tokens** - Minimal necessary permissions
- **Add URL restrictions** - Limit to your domains
- **Rotate tokens regularly** - Generate new tokens periodically

### Style Management

- **Version your styles** - Save JSON to source control
- **Use meaningful names** - `prod-light-mode` not `style-123`
- **Document decisions** - Add comments explaining style choices
- **Preview before deploying** - Always check preview URL

### Validation

- **Validate early** - Check data before creating styles
- **Use strict validation** - Don't skip validation steps
- **Test expressions** - Validate before adding to styles
- **Verify coordinates** - Ensure correct format and bounds

### Documentation

- **Ask specific questions** - "What are fill-extrusion properties?"
- **Reference versions** - Specify GL JS version if relevant
- **Cross-reference** - Validate AI responses against official docs
