# Mapbox MCP Runtime Patterns

Quick reference for integrating Mapbox MCP Server into AI applications for production use.

## What is MCP Server?

Runtime server providing geospatial tools to AI agents via Model Context Protocol.

**Repo:** <https://github.com/mapbox/mcp-server>

## Tools Available

| Category            | Tools                                                                                                                                                                                                                                                                                                              | Cost            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| **Local (Turf.js)** | `area_tool`, `bbox_tool`, `bearing_tool`, `buffer_tool`, `centroid_tool`, `convex_tool`, `destination_tool`, `difference_tool`, `distance_tool`, `intersect_tool`, `length_tool`, `midpoint_tool`, `nearest_point_tool`, `nearest_point_on_line_tool`, `points_within_polygon_tool`, `simplify_tool`, `union_tool` | Free, instant   |
| **Mapbox APIs**     | `directions_tool`, `search_and_geocode_tool`, `reverse_geocode_tool`, `category_search_tool`, `place_details_tool`, `ground_location_tool`, `isochrone_tool`, `matrix_tool`, `map_matching_tool`, `optimization_tool`, `render_map_tool`, `static_map_image_tool`                                                  | API costs apply |
| **Utility**         | `resource_reader_tool`                                                                                                                                                                                                                                                                                             | Free            |

Verify against `tools/list` for your server version — this set changes. Notes on the
current one:

- **`render_map_tool` is the preferred way to display a map.** It renders an interactive
  GL JS map and consumes the `mapboxRender.ref` URI that other tools return in
  `structuredContent`. `static_map_image_tool` is still the right call when you
  specifically need a static PNG or JPEG.
- **`category_list_tool` is deprecated** in favour of `resource_reader_tool` with the
  `mapbox://categories` URI.
- **`ground_location_tool`** answers "what is near here" in one call; do not pair it with
  `reverse_geocode_tool` or a category search for the same question.
- **`place_details_tool`** takes a `mapbox_id` from an earlier search to fetch photos,
  hours, ratings and contact details.

## Coordinate Formats

All tools use `{longitude, latitude}` object format — **not** arrays.

**Object format** `{longitude: lng, latitude: lat}`:

- `directions_tool` - `coordinates` array of objects
- `isochrone_tool` - `coordinates` parameter
- `reverse_geocode_tool` - `coordinates` parameter
- `category_search_tool` - `proximity` parameter
- `distance_tool` - `from`/`to` parameters
- `bearing_tool` - `from`/`to` parameters
- `midpoint_tool` - `from`/`to` parameters
- `points_within_polygon_tool` - `point` parameter

**Exception — GeoJSON geometry** (arrays only):

- `buffer_tool` - `geometry` parameter uses `[longitude, latitude]` arrays (GeoJSON format)
- `points_within_polygon_tool` - `polygon` rings use `[longitude, latitude]` arrays

**Note:** All coordinates use `longitude` before `latitude` order.

## Installation

### Hosted (Recommended)

Use Mapbox's hosted server - no installation needed:

```
https://mcp.mapbox.com/mcp
```

Connect with your token in the `Authorization: Bearer <token>` header.

**Note:** Hosted server supports OAuth for interactive flows (coding assistants), but use token auth for programmatic runtime access.

### Self-Hosted

```bash
npm install @mapbox/mcp-server
# Or: npx @mapbox/mcp-server

export MAPBOX_ACCESS_TOKEN="your_token"
```

## Framework Integration

### Pydantic AI

```python
from pydantic_ai import Agent
# Correct import. `OpenAIModel` does not exist and raises ImportError at runtime.
from pydantic_ai.models.openai import OpenAIChatModel


async def get_directions(
    origin: tuple[float, float], destination: tuple[float, float]
):
    # directions_tool takes `coordinates`: a list of {longitude, latitude}
    # objects. It has no `origin`/`destination` parameters.
    return await call_mcp('directions_tool', {
        'coordinates': [
            {'longitude': origin[0], 'latitude': origin[1]},
            {'longitude': destination[0], 'latitude': destination[1]}
        ],
        'routing_profile': 'mapbox/driving-traffic'
    })


agent = Agent(model=OpenAIChatModel('gpt-4o'), tools=[get_directions])
```

### Mastra

```typescript
import { spawn } from 'child_process';

const mcp = spawn('npx', ['@mapbox/mcp-server'], {
  env: { MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN }
});

const mastra = new Mastra({
  workflows: {
    findRestaurants: {
      steps: [
        { tool: 'mapbox.category_search_tool', input: {...} },
        { tool: 'mapbox.matrix_tool', input: {...} }
      ]
    }
  }
});
```

### LangChain

```typescript
// Use DynamicStructuredTool with a Zod schema, not DynamicTool — a structured
// schema is what keeps the LLM from passing malformed coordinates.
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const tools = [
  new DynamicStructuredTool({
    name: 'directions_tool',
    description: 'Get turn-by-turn driving directions with traffic-aware duration along roads.',
    schema: z.object({
      origin: z.tuple([z.number(), z.number()]).describe('[longitude, latitude]'),
      destination: z.tuple([z.number(), z.number()]).describe('[longitude, latitude]')
    }),
    // directions_tool takes `coordinates`: {longitude, latitude} objects.
    func: async ({ origin, destination }) =>
      callMCP('directions_tool', {
        coordinates: [
          { longitude: origin[0], latitude: origin[1] },
          { longitude: destination[0], latitude: destination[1] }
        ],
        routing_profile: 'mapbox/driving-traffic'
      })
  })
];
```

### Custom Agent

```typescript
class MapboxAgent {
  private mcpProcess: ChildProcess;

  async initialize() {
    this.mcpProcess = spawn('npx', ['@mapbox/mcp-server'], {
      env: { MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN }
    });
  }

  async callTool(name: string, params: any): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name, arguments: params }
    };

    this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');

    return new Promise((resolve) => {
      this.mcpProcess.stdout.once('data', (data) => {
        const response = JSON.parse(data.toString());
        resolve(response.result);
      });
    });
  }
}
```

## Common Use Cases

### Real Estate (Zillow-style)

```typescript
// Find properties with good commute
async findByCommute(home: Point, work: Point, maxMinutes: number) {
  // 1. Get reachable area from work
  const isochrone = await mcp.call('isochrone_tool', {
    // `coordinates` is a single {longitude, latitude} object, not an array
    coordinates: { longitude: work[0], latitude: work[1] },
    contours_minutes: [maxMinutes],
    profile: 'mapbox/driving'
  });

  // 2. Check if home is within range
  const inRange = await mcp.call('points_within_polygon_tool', {
    point: home,
    polygon: isochrone
  });

  // 3. Get exact commute time
  if (inRange) {
    const route = await mcp.call('directions_tool', {
      coordinates: [
        { longitude: home[0], latitude: home[1] },
        { longitude: work[0], latitude: work[1] }
      ],
      routing_profile: 'mapbox/driving-traffic'
    });
    return { commuteMinutes: route.duration / 60 };
  }
}
```

### Food Delivery (DoorDash-style)

```typescript
// Check delivery availability
async canDeliver(restaurant: Point, address: Point, maxTime: number) {
  // 1. Calculate delivery zone
  const zone = await mcp.call('isochrone_tool', {
    coordinates: { longitude: restaurant[0], latitude: restaurant[1] },
    contours_minutes: [maxTime],
    profile: 'mapbox/driving'
  });

  // 2. Check if address is in zone
  const canDeliver = await mcp.call('points_within_polygon_tool', {
    point: address,
    polygon: zone
  });

  // 3. Get delivery time with traffic
  if (canDeliver) {
    const route = await mcp.call('directions_tool', {
      coordinates: [
        { longitude: restaurant[0], latitude: restaurant[1] },
        { longitude: address[0], latitude: address[1] }
      ],
      routing_profile: 'mapbox/driving-traffic'
    });
    return { eta: route.duration / 60, distance: route.distance };
  }
}
```

### Travel Planning (TripAdvisor-style)

```typescript
// Find nearby attractions with travel times
async findAttractions(hotel: Point, category: string) {
  // 1. Search nearby
  const places = await mcp.call('category_search_tool', {
    category,
    proximity: hotel
  });

  // 2. Calculate distances (offline, free)
  const withDistances = await Promise.all(
    places.map(async (place) => ({
      ...place,
      distance: await mcp.call('distance_tool', {
        from: hotel,
        to: place.coordinates,
        units: 'miles'
      })
    }))
  );

  // 3. Get travel times (batch API call)
  const matrix = await mcp.call('matrix_tool', {
    origins: [hotel],
    destinations: places.map(p => p.coordinates),
    profile: 'mapbox/walking'
  });

  return withDistances.map((place, i) => ({
    ...place,
    walkingMinutes: matrix.durations[0][i] / 60
  }));
}
```

## Architecture Pattern

```
Application Layer
      ↓
AI Agent Layer (pydantic-ai, mastra, custom)
      ↓
MCP Server (geospatial tools)
      ↓
   ↙     ↘
Turf.js   Mapbox APIs
(free)    (API costs)
```

## Tool Selection Strategy

| Need                    | Use                                          | Reason                |
| ----------------------- | -------------------------------------------- | --------------------- |
| Distance calculation    | distance_tool (offline)                      | Free, instant         |
| Point in polygon        | points_within_polygon_tool (offline)         | Free, instant         |
| Bounding box            | bbox_tool (offline)                          | Free, instant         |
| Simplify geometry       | simplify_tool (offline)                      | Free, instant         |
| Directions with traffic | directions_tool (API)                        | Real-time data        |
| Geocoding               | reverse_geocode_tool (API)                   | Requires database     |
| Isochrones              | isochrone_tool (API)                         | Complex calculation   |
| Multi-stop optimization | optimization_tool (API)                      | Complex calculation   |
| GPS trace matching      | map_matching_tool (API)                      | Requires routing data |
| Bearing/midpoint        | bearing_tool/midpoint_tool (offline)         | Free, instant         |
| POI categories          | resource_reader_tool (`mapbox://categories`) | Metadata lookup       |

## Performance Optimization

### Caching

```typescript
class CachedMCP {
  private cache = new Map();
  private offlineTools = ['distance_tool', 'points_within_polygon_tool'];

  async callTool(name: string, params: any) {
    // Cache offline tools forever (deterministic)
    const ttl = this.offlineTools.includes(name) ? Infinity : 3600000;

    const key = JSON.stringify({ name, params });
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.result;
    }

    const result = await this.mcp.callTool(name, params);
    this.cache.set(key, { result, timestamp: Date.now() });
    return result;
  }
}
```

### Batching

```typescript
// ❌ Bad: Sequential calls
for (const location of locations) {
  await mcp.call('distance_tool', { from: user, to: location });
}

// ✅ Good: Parallel
await Promise.all(locations.map((loc) => mcp.call('distance_tool', { from: user, to: loc })));

// ✅ Better: Use matrix tool
await mcp.call('matrix_tool', {
  origins: [user],
  destinations: locations
});
```

## Error Handling

```typescript
class RobustMCP {
  async callWithRetry(name: string, params: any, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.mcp.callTool(name, params);
      } catch (error) {
        if (error.code === 'RATE_LIMIT') {
          await this.sleep(Math.pow(2, i) * 1000); // Exponential backoff
          continue;
        }
        throw error; // Non-retryable
      }
    }
  }
}
```

## Security

```typescript
// ✅ Good: Environment variables
const token = process.env.MAPBOX_ACCESS_TOKEN;

// ✅ Good: Scoped tokens (minimal permissions)
// directions:read, geocoding:read only

// ✅ Good: Rate limiting
class RateLimitedMCP {
  private requestsPerMinute = 300;
  private requestCount = 0;

  async callTool(name: string, params: any) {
    if (this.requestCount >= this.requestsPerMinute) {
      await this.waitForNextMinute();
    }
    this.requestCount++;
    return await this.mcp.callTool(name, params);
  }
}
```

## Testing

```typescript
// Mock MCP for tests
class MockMCP {
  async callTool(name: string, params: any) {
    const mocks = {
      distance_tool: () => '2.5',
      directions_tool: () => ({ duration: 1200, distance: 5000 }),
      points_within_polygon_tool: () => true
    };
    return mocks[name]?.();
  }
}

// Use in tests
const agent = new MapboxAgent(new MockMCP());
```

## When to Use

| Use MCP ✅                  | Use Direct API ❌     |
| --------------------------- | --------------------- |
| AI agent interactions       | Simple operations     |
| Complex workflows           | Performance-critical  |
| Offline calculations        | Client-side rendering |
| Multi-step geospatial logic | Map display           |
| Prototyping                 | Production maps       |

## Cost Optimization

```typescript
// Prefer offline tools (free)
const freeOps = [
  'distance_tool',
  'points_within_polygon_tool',
  'bearing_tool',
  'area_tool',
  'centroid_tool',
  'bbox_tool',
  'simplify_tool',
  'midpoint_tool',
  'buffer_tool'
];

// Use API tools only when necessary
const apiOps = [
  'directions_tool', // Need traffic data
  'reverse_geocode_tool', // Need address database
  'isochrone_tool', // Complex calculation
  'category_search_tool', // Need POI database
  'matrix_tool', // Travel time matrix
  'static_map_image_tool', // Static map generation
  'map_matching_tool', // GPS trace matching
  'optimization_tool' // Route optimization
];

// Utility tools
const utilityOps = [
  // category_list_tool is deprecated: read mapbox://categories instead
  'resource_reader_tool' // MCP resources, e.g. mapbox://categories
];

function chooseTool(operation: string, needsRealtime: boolean) {
  if (needsRealtime) return apiOps[operation];
  return freeOps.includes(operation) ? operation : apiOps[operation];
}
```

## Resources

- [MCP Server](https://github.com/mapbox/mcp-server)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Pydantic AI](https://ai.pydantic.dev/)
- [Mastra](https://mastra.ai/)
- [LangChain](https://docs.langchain.com/oss/javascript/langchain/overview/)
- [Mapbox APIs](https://docs.mapbox.com/api/)
