# Mapbox MCP Runtime Patterns

Quick reference for integrating Mapbox MCP Server into AI applications for production use.

## What is MCP Server?

Runtime server providing geospatial tools to AI agents via Model Context Protocol.

**Repo:** <https://github.com/mapbox/mcp-server>

## Tools Available

| Category              | Tools                                                                                              | Cost            |
| --------------------- | -------------------------------------------------------------------------------------------------- | --------------- |
| **Offline (Turf.js)** | distance, bearing, midpoint, point-in-polygon, area, buffer, centroid, bbox, simplify              | Free, instant   |
| **Mapbox APIs**       | directions, geocoding, category search, isochrone, matrix, static maps, map matching, optimization | API costs apply |
| **Utility**           | version, category list                                                                             | Free            |

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
import subprocess

# Start MCP server
mcp = subprocess.Popen(['npx', '@mapbox/mcp-server'],
                       env={'MAPBOX_ACCESS_TOKEN': token})

agent = Agent(
    model='gpt-4',
    tools=[
        lambda from_loc, to_loc: call_mcp('directions_tool', {
            'origin': from_loc,
            'destination': to_loc
        })
    ]
)
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
        { tool: 'mapbox.category_search', input: {...} },
        { tool: 'mapbox.matrix', input: {...} }
      ]
    }
  }
});
```

### LangChain

```typescript
import { DynamicTool } from '@langchain/core/tools';

const tools = [
  new DynamicTool({
    name: 'directions_tool',
    description: 'Get driving directions',
    func: async (input) => {
      const { origin, destination } = JSON.parse(input);
      return await callMCP('directions_tool', { origin, destination });
    }
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
    coordinates: work,
    contours_minutes: [maxMinutes]
  });

  // 2. Check if home is within range
  const inRange = await mcp.call('point_in_polygon_tool', {
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
    coordinates: restaurant,
    contours_minutes: [maxTime],
    profile: 'mapbox/driving'
  });

  // 2. Check if address is in zone
  const canDeliver = await mcp.call('point_in_polygon_tool', {
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

| Need                    | Use                                  | Reason                |
| ----------------------- | ------------------------------------ | --------------------- |
| Distance calculation    | distance_tool (offline)              | Free, instant         |
| Point in polygon        | point_in_polygon_tool (offline)      | Free, instant         |
| Bounding box            | bbox_tool (offline)                  | Free, instant         |
| Simplify geometry       | simplify_tool (offline)              | Free, instant         |
| Directions with traffic | directions_tool (API)                | Real-time data        |
| Geocoding               | reverse_geocode_tool (API)           | Requires database     |
| Isochrones              | isochrone_tool (API)                 | Complex calculation   |
| Multi-stop optimization | optimization_tool (API)              | Complex calculation   |
| GPS trace matching      | map_matching_tool (API)              | Requires routing data |
| Bearing/midpoint        | bearing_tool/midpoint_tool (offline) | Free, instant         |
| POI categories          | category_list_tool (utility)         | Metadata lookup       |

## Performance Optimization

### Caching

```typescript
class CachedMCP {
  private cache = new Map();
  private offlineTools = ['distance_tool', 'point_in_polygon_tool'];

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
      point_in_polygon_tool: () => true
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
  'point_in_polygon_tool',
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
  'version_tool', // Server version info
  'category_list_tool' // Available POI categories
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
