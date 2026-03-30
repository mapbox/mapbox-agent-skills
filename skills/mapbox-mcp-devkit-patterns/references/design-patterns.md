# Design Patterns

## Pattern 1: Iterative Style Development

**Workflow:**

1. Describe desired style in natural language
2. AI creates initial style via MCP
3. View preview URL
4. Request adjustments
5. AI updates style via MCP
6. Repeat until satisfied

**Example conversation:**

```
You: "Create a style for a real estate app - emphasize property boundaries,
     show parks prominently, muted roads"

AI: [Creates style, returns ID and preview URL]

You: "Make the property boundaries purple and thicker"

AI: [Updates style]

You: "Perfect! Now add POI icons for schools and transit"

AI: [Updates style with symbols]
```

**Benefits:**

- No manual JSON editing
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
