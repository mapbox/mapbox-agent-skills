# Production Patterns

## Performance Optimization

### Caching Strategy

```typescript
class CachedMapboxMCP {
  private cache = new Map<string, { result: any; timestamp: number }>();
  private cacheTTL = 3600000; // 1 hour

  async callTool(name: string, params: any): Promise<any> {
    // Cache offline tools indefinitely (deterministic)
    const offlineTools = ['distance_tool', 'point_in_polygon_tool', 'bearing_tool'];
    const ttl = offlineTools.includes(name) ? Infinity : this.cacheTTL;

    // Check cache
    const cacheKey = JSON.stringify({ name, params });
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.result;
    }

    // Call MCP
    const result = await this.mcpServer.callTool(name, params);

    // Store in cache
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    return result;
  }
}
```

### Batch Operations

```typescript
// ❌ Bad: Sequential calls
for (const location of locations) {
  const distance = await mcp.callTool('distance_tool', {
    from: userLocation,
    to: location
  });
}

// ✅ Good: Parallel batch
const distances = await Promise.all(
  locations.map((location) =>
    mcp.callTool('distance_tool', {
      from: userLocation,
      to: location
    })
  )
);

// ✅ Better: Use matrix tool
const matrix = await mcp.callTool('matrix_tool', {
  origins: [userLocation],
  destinations: locations
});
```

## Writing Effective Tool Descriptions

Clear, specific tool descriptions are critical for helping LLMs select the right tools. Poor descriptions lead to incorrect tool calls, wasted API requests, and user frustration.

### Common Confusion Points

**Problem: "How far is it from A to B?"** - Could trigger either `directions_tool` OR `distance_tool`

```typescript
// ❌ Ambiguous descriptions
{
  name: 'directions_tool',
  description: 'Get directions between two locations'  // Could mean distance
}
{
  name: 'distance_tool',
  description: 'Calculate distance between two points'  // Unclear what kind
}

// ✅ Clear, specific descriptions
{
  name: 'directions_tool',
  description: 'Get turn-by-turn driving directions with traffic-aware route distance and travel time. Use when you need the actual route, navigation instructions, or driving duration. Returns route geometry, distance along roads, and time estimate.'
}
{
  name: 'distance_tool',
  description: 'Calculate straight-line (great-circle) distance between two points. Use for quick "as the crow flies" distance checks, proximity comparisons, or when routing is not needed. Works offline, instant, no API cost.'
}
```

**Problem: "Find coffee shops nearby"** - Could trigger `category_search_tool` OR `search_and_geocode_tool`

```typescript
// ❌ Ambiguous
{
  name: 'search_poi',
  description: 'Search for places'
}

// ✅ Clear when to use each
{
  name: 'category_search_tool',
  description: 'Find ALL places of a specific type/category (e.g., "all coffee shops", "restaurants", "gas stations") near a location. Use for browsing or discovering places by category. Returns multiple results.'
}
{
  name: 'search_and_geocode_tool',
  description: 'Search for a SPECIFIC named place or address (e.g., "Starbucks on Main St", "123 Market St"). Use when the user provides a business name, street address, or landmark. Returns best match.'
}
```

**Problem: "Where can I go in 15 minutes?"** - Could trigger `isochrone_tool` OR `directions_tool`

```typescript
// ❌ Confusing
{
  name: 'isochrone_tool',
  description: 'Calculate travel time area'
}

// ✅ Clear distinction
{
  name: 'isochrone_tool',
  description: 'Calculate the AREA reachable within a time limit from a starting point. Returns a GeoJSON polygon showing everywhere you can reach. Use for: "What can I reach in X minutes?", service area analysis, catchment zones, delivery zones.'
}
{
  name: 'directions_tool',
  description: 'Get route from point A to specific point B. Returns turn-by-turn directions to ONE destination. Use for: "How do I get to X?", "Route from A to B", navigation to a known destination.'
}
```

### Best Practices for Tool Descriptions

1. **Start with the primary use case** in simple terms
2. **Explain WHEN to use this tool** vs alternatives
3. **Include key distinguishing details**: Does it use traffic? Is it offline? Does it cost API calls?
4. **Give concrete examples** of questions that should trigger this tool
5. **Mention what it returns** so LLMs know if it fits the user's need

```typescript
// ✅ Complete example
const searchPOITool = new DynamicStructuredTool({
  name: 'category_search_tool',
  description: `Find places by category type (restaurants, hotels, coffee shops, gas stations, etc.) near a location.

  Use when the user wants to:
  - Browse places of a certain type: "coffee shops nearby", "find restaurants"
  - Discover options: "what hotels are in this area?"
  - Search by industry/amenity, not by specific name

  Returns: List of matching places with names, addresses, and coordinates.

  DO NOT use for:
  - Specific named places (use search_and_geocode_tool instead)
  - Addresses (use search_and_geocode_tool or reverse_geocode_tool)`
  // ... schema and implementation
});
```

### System Prompt Guidance

Add tool selection guidance to your agent's system prompt:

```typescript
const systemPrompt = `You are a location intelligence assistant.

TOOL SELECTION RULES:
- Use distance_tool for straight-line distance ("as the crow flies")
- Use directions_tool for route distance along roads with traffic
- Use category_search_tool for finding types of places ("coffee shops")
- Use search_and_geocode_tool for specific addresses or named places ("123 Main St", "Starbucks downtown")
- Use isochrone_tool for "what can I reach in X minutes" questions
- Use offline tools (distance_tool, point_in_polygon_tool) when real-time data is not needed

When in doubt, prefer:
1. Offline tools over API calls (faster, free)
2. Specific tools over general ones
3. Asking for clarification over guessing`;
```

## Tool Selection

```typescript
// Use offline tools when possible (faster, free)
const localOps = {
  distance: 'distance_tool', // Turf.js
  pointInPolygon: 'point_in_polygon_tool', // Turf.js
  bearing: 'bearing_tool', // Turf.js
  area: 'area_tool' // Turf.js
};

// Use API tools when necessary (requires token, slower)
const apiOps = {
  directions: 'directions_tool', // Mapbox API
  geocoding: 'reverse_geocode_tool', // Mapbox API
  isochrone: 'isochrone_tool', // Mapbox API
  search: 'category_search_tool' // Mapbox API
};

// Choose based on requirements
function chooseTool(operation: string, needsRealtime: boolean) {
  if (needsRealtime) {
    return apiOps[operation]; // Traffic, live data
  }
  return localOps[operation] || apiOps[operation];
}
```

## Error Handling

```typescript
class RobustMapboxMCP {
  async callToolWithRetry(name: string, params: any, maxRetries: number = 3): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.mcpServer.callTool(name, params);
      } catch (error) {
        if (error.code === 'RATE_LIMIT') {
          // Exponential backoff
          await this.sleep(Math.pow(2, i) * 1000);
          continue;
        }

        if (error.code === 'INVALID_TOKEN') {
          // Non-retryable error
          throw error;
        }

        if (i === maxRetries - 1) {
          throw error;
        }
      }
    }
  }

  async callToolWithFallback(primaryTool: string, fallbackTool: string, params: any): Promise<any> {
    try {
      return await this.callTool(primaryTool, params);
    } catch (error) {
      console.warn(`Primary tool ${primaryTool} failed, using fallback`);
      return await this.callTool(fallbackTool, params);
    }
  }
}
```

## Security Best Practices

### Token Management

```typescript
// ✅ Good: Use environment variables
const mcp = new MapboxMCP({
  token: process.env.MAPBOX_ACCESS_TOKEN
});

// ❌ Bad: Hardcode tokens
const mcp = new MapboxMCP({
  token: 'pk.ey...' // Never do this!
});

// ✅ Good: Use scoped tokens
// Create token with minimal scopes:
// - directions:read
// - geocoding:read
// - No write permissions
```

### Rate Limiting

```typescript
class RateLimitedMCP {
  private requestQueue: Array<() => Promise<any>> = [];
  private requestsPerMinute = 300;
  private currentMinute = Math.floor(Date.now() / 60000);
  private requestCount = 0;

  async callTool(name: string, params: any): Promise<any> {
    // Check rate limit
    const minute = Math.floor(Date.now() / 60000);
    if (minute !== this.currentMinute) {
      this.currentMinute = minute;
      this.requestCount = 0;
    }

    if (this.requestCount >= this.requestsPerMinute) {
      // Wait until next minute
      const waitMs = (this.currentMinute + 1) * 60000 - Date.now();
      await this.sleep(waitMs);
    }

    this.requestCount++;
    return await this.mcpServer.callTool(name, params);
  }
}
```

## Testing

```typescript
// Mock MCP server for testing
class MockMapboxMCP {
  async callTool(name: string, params: any): Promise<any> {
    const mocks = {
      distance_tool: () => '2.5',
      directions_tool: () => JSON.stringify({
        duration: 1200,
        distance: 5000,
        geometry: {...}
      }),
      point_in_polygon_tool: () => 'true'
    };

    return mocks[name]?.() || '{}';
  }
}

// Use in tests
describe('Property search', () => {
  it('finds properties within commute time', async () => {
    const agent = new CustomMapboxAgent(new MockMapboxMCP());
    const results = await agent.findPropertiesWithCommute(
      [-122.4, 37.7],
      [-122.41, 37.78],
      30
    );

    expect(results).toHaveLength(5);
  });
});
```
