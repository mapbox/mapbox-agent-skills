# Design Patterns

## Pattern 1: Iterative Style Development

**Start by asking whether a new style is needed at all.** The Mapbox Standard style covers most
design intent through **config properties** — `theme`, `lightPreset`, the visibility toggles, POI
density, and the `color*` overrides — with nothing to create or maintain. `create_style_tool`
produces a Classic style JSON (hand-authored layer stack, no slots, no config surface), which is
the right output only when you need a server-rendered raster, per-layer paint control config
can't express, or a deliberate 2D fallback.

**Workflow:**

1. Describe the desired look in natural language
2. **Map it onto Standard config first** — most requests resolve to a handful of properties
3. Only if config can't express it, create a Classic style via MCP
4. View preview URL
5. Request adjustments
6. Repeat until satisfied

**Example conversation — config resolves it:**

```
You: "Set up a map for a real estate app - emphasize property boundaries,
     show parks prominently, muted roads"

AI: No new style needed. On mapbox/standard:
      theme: 'faded'                    (mutes roads and the whole base)
      showPointOfInterestLabels: true   (schools, transit = buying signals)
      show3dObjects: false              (3D competes with property boundaries)
    Property boundaries are your own line layer in the `bottom` slot with
    line-emissive-strength: 1. Purple goes on YOUR boundaries, never on the
    basemap.

You: "Make the property boundaries purple and thicker"

AI: [Updates the custom layer's paint — no style round-trip needed]
```

**Example conversation — a style is genuinely required:**

```
You: "We render PNGs of the map server-side for an emailed weekly report."

AI: The Static Images API can't render Standard, so this needs a Classic style.
    [Creates one via create_style_tool, returns ID and preview URL]
```

**Benefits:**

- Most requests need no style at all — just config
- No manual JSON editing when a style is required
- Visual feedback via preview URLs
- Rapid iteration

## Pattern 2: Environment-Specific Tokens

**Workflow:**

1. Define requirements per environment
2. AI creates tokens with appropriate scopes/restrictions
3. Store securely in environment variables

**Example:**

```
You: "Create three tokens:
1. Development - all scopes, localhost only
2. Staging - read-only scopes, staging.example.com
3. Production - minimal scopes, example.com only"

AI: [Creates three tokens with specified configurations]
```

**Benefits:**

- Least-privilege access
- Domain restrictions prevent token misuse
- Clear separation of concerns

## Pattern 3: Validation-First Development

**Workflow:**

1. Design data structure
2. Validate GeoJSON before using
3. Validate expressions before adding to style
4. Catch errors early

**Example:**

```
You: "I have GeoJSON with restaurant locations. Validate it and check for
     any missing required properties"

AI: [Validates, reports any issues]

You: "Now create a style that displays these restaurants with icons sized
     by rating. Validate the expression first."

AI: [Validates expression, then creates style]
```

**Benefits:**

- Catch errors before deployment
- Ensure data integrity
- Faster debugging

## Pattern 4: Documentation-Driven Development

**Workflow:**

1. Ask about Mapbox capabilities
2. Get authoritative documentation
3. Implement with correct patterns
4. Validate implementation

**Example:**

```
You: "How do I create a choropleth map in Mapbox GL JS?"

AI: [Retrieves docs, provides pattern]

You: "Create a style with that pattern for population density data"

AI: [Creates style following documented pattern]
```

**Benefits:**

- Always use latest best practices
- No outdated Stack Overflow answers
- Official Mapbox guidance

## Integration with Existing Tools

### With Mapbox Studio

DevKit complements, doesn't replace Studio:

- **DevKit:** Quick iterations, automated workflows, AI assistance
- **Studio:** Visual editing, fine-tuning, team collaboration

**Pattern:** Use DevKit for initial creation, Studio for refinement.

### With Mapbox APIs

DevKit wraps Mapbox APIs but doesn't replace them:

- **DevKit:** Development-time operations via AI
- **APIs:** Production runtime operations

**Pattern:** Use DevKit during development, APIs in production code.

### With Version Control

**Pattern:** Save generated styles to git for review and rollback.

```
You: "Create a new style for the home page map and save the JSON to
     styles/home-map.json"

AI: [Creates style, writes JSON to file]

You: [Review, commit to git]
```
