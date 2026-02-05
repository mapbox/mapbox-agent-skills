---
name: mapbox-mcp-runtime-patterns
description: Integration patterns for Mapbox MCP Server in AI applications and agent frameworks. Covers runtime integration with pydantic-ai, mastra, LangChain, and custom agents. Use when building AI-powered applications that need geospatial capabilities.
---

# Mapbox MCP Runtime Patterns

This skill provides patterns for integrating the Mapbox MCP Server into AI applications for production use with geospatial capabilities.

## What is Mapbox MCP Server?

The [Mapbox MCP Server](https://github.com/mapbox/mcp-server) is a Model Context Protocol (MCP) server that provides AI agents with geospatial tools:

**Offline Tools (Turf.js):**
- Distance, bearing, midpoint calculations
- Point-in-polygon tests
- Area, buffer, centroid operations
- No API calls, instant results

**Mapbox API Tools:**
- Directions and routing
- Reverse geocoding
- POI category search
- Isochrones (reachability)
- Travel time matrices
- Static map images

**Key benefit:** Give your AI application geospatial superpowers without manually integrating multiple APIs.

## Installation

```bash
npm install @mapbox/mcp-server
```

Or use directly via npx:

```bash
npx @mapbox/mcp-server
```

### Environment Setup

```bash
export MAPBOX_ACCESS_TOKEN="your_token_here"
```

## Integration Patterns

### Pattern 1: Pydantic AI Integration

**Use case:** Building AI agents with type-safe tools in Python

```python
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
import subprocess
import json

class MapboxTools:
    """Mapbox geospatial tools via MCP."""

    def __init__(self, token: str):
        self.token = token
        self.mcp_process = None

    def start_mcp_server(self):
        """Start Mapbox MCP server."""
        env = {'MAPBOX_ACCESS_TOKEN': self.token}
        self.mcp_process = subprocess.Popen(
            ['npx', '@mapbox/mcp-server'],
            env=env,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

    def call_tool(self, tool_name: str, params: dict) -> dict:
        """Call MCP tool and return result."""
        request = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'tools/call',
            'params': {
                'name': tool_name,
                'arguments': params
            }
        }

        self.mcp_process.stdin.write(
            json.dumps(request).encode() + b'\n'
        )
        self.mcp_process.stdin.flush()

        response = json.loads(
            self.mcp_process.stdout.readline()
        )
        return response['result']

# Create agent with Mapbox tools
mapbox = MapboxTools(token='your_token')
mapbox.start_mcp_server()

agent = Agent(
    model=OpenAIModel('gpt-4'),
    tools=[
        lambda from_loc, to_loc: mapbox.call_tool(
            'get_directions',
            {'origin': from_loc, 'destination': to_loc}
        ),
        lambda address: mapbox.call_tool(
            'reverse_geocode',
            {'coordinates': address}
        )
    ]
)

# Use agent
result = agent.run_sync(
    "What's the driving time from Boston to NYC?"
)
```

**Benefits:**
- Type-safe tool definitions
- Seamless MCP integration
- Python-native development

### Pattern 2: Mastra Integration

**Use case:** Building multi-agent systems with geospatial capabilities

```typescript
import { Mastra } from '@mastra/core';
import { spawn } from 'child_process';

class MapboxMCPIntegration {
  private mcpProcess: any;

  async initialize() {
    // Start MCP server
    this.mcpProcess = spawn('npx', ['@mapbox/mcp-server'], {
      env: {
        ...process.env,
        MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN
      }
    });

    // Wait for server ready
    await this.waitForReady();
  }

  async callTool(toolName: string, params: any): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params
      }
    };

    return new Promise((resolve, reject) => {
      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');

      this.mcpProcess.stdout.once('data', (data: Buffer) => {
        const response = JSON.parse(data.toString());
        resolve(response.result);
      });
    });
  }
}

// Create Mastra workflow with Mapbox
const mastra = new Mastra({
  workflows: {
    findNearbyRestaurants: {
      steps: [
        {
          name: 'geocode',
          tool: 'mapbox.reverse_geocode',
          input: (context) => context.userLocation
        },
        {
          name: 'search',
          tool: 'mapbox.category_search',
          input: (context) => ({
            category: 'restaurant',
            proximity: context.geocode.coordinates
          })
        },
        {
          name: 'calculate_times',
          tool: 'mapbox.matrix',
          input: (context) => ({
            origins: [context.userLocation],
            destinations: context.search.results.map(r => r.coordinates)
          })
        }
      ]
    }
  }
});
```

**Benefits:**
- Multi-step geospatial workflows
- Agent orchestration
- State management

### Pattern 3: LangChain Integration

**Use case:** Building conversational AI with geospatial tools

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { DynamicTool } from '@langchain/core/tools';
import { spawn } from 'child_process';

// MCP Server wrapper
class MapboxMCPServer {
  private process: any;

  async start() {
    this.process = spawn('npx', ['@mapbox/mcp-server'], {
      env: { MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN }
    });
  }

  async callTool(name: string, args: any): Promise<string> {
    // ... MCP call implementation
    return JSON.stringify(result);
  }
}

// Create LangChain tools from MCP
const mcpServer = new MapboxMCPServer();
await mcpServer.start();

const tools = [
  new DynamicTool({
    name: 'get_directions',
    description: 'Get driving directions between two locations',
    func: async (input: string) => {
      const { origin, destination } = JSON.parse(input);
      return await mcpServer.callTool('get_directions', {
        origin,
        destination,
        profile: 'driving'
      });
    }
  }),

  new DynamicTool({
    name: 'find_pois',
    description: 'Find points of interest by category',
    func: async (input: string) => {
      const { category, location } = JSON.parse(input);
      return await mcpServer.callTool('category_search', {
        category,
        proximity: location
      });
    }
  }),

  new DynamicTool({
    name: 'calculate_isochrone',
    description: 'Calculate reachable area within time limit',
    func: async (input: string) => {
      const { location, minutes } = JSON.parse(input);
      return await mcpServer.callTool('get_isochrone', {
        coordinates: location,
        contours_minutes: [minutes]
      });
    }
  })
];

// Create agent
const model = new ChatOpenAI({ modelName: 'gpt-4' });
const executor = await initializeAgentExecutorWithOptions(
  tools,
  model,
  {
    agentType: 'openai-functions',
    verbose: true
  }
);

// Use agent
const result = await executor.invoke({
  input: "Find coffee shops within 10 minutes walking from Union Square, NYC"
});
```

**Benefits:**
- Conversational interface
- Tool chaining
- Memory and context management

### Pattern 4: Custom Agent Integration

**Use case:** Building domain-specific AI applications (Zillow-style, TripAdvisor-style)

```typescript
import { spawn, ChildProcess } from 'child_process';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

class CustomMapboxAgent {
  private mcpProcess: ChildProcess;
  private tools: Map<string, MCPTool> = new Map();

  async initialize() {
    // Start MCP server
    this.mcpProcess = spawn('npx', ['@mapbox/mcp-server'], {
      env: {
        MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN
      }
    });

    // Discover available tools
    await this.discoverTools();
  }

  private async discoverTools() {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    };

    // Send request and parse tools
    const response = await this.sendMCPRequest(request);
    response.result.tools.forEach((tool: MCPTool) => {
      this.tools.set(tool.name, tool);
    });
  }

  async callTool(toolName: string, params: any): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params
      }
    };

    const response = await this.sendMCPRequest(request);
    return response.result.content[0].text;
  }

  private async sendMCPRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');

      const timeout = setTimeout(() => {
        reject(new Error('MCP request timeout'));
      }, 10000);

      this.mcpProcess.stdout.once('data', (data: Buffer) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  // Domain-specific methods
  async findPropertiesWithCommute(
    homeLocation: [number, number],
    workLocation: [number, number],
    maxCommuteMinutes: number
  ) {
    // Get isochrone from work location
    const isochrone = await this.callTool('get_isochrone', {
      coordinates: workLocation,
      contours_minutes: [maxCommuteMinutes],
      profile: 'driving-traffic'
    });

    // Check if home is within isochrone
    const isInRange = await this.callTool('point_in_polygon', {
      point: homeLocation,
      polygon: JSON.parse(isochrone).features[0].geometry
    });

    return JSON.parse(isInRange);
  }

  async findRestaurantsNearby(
    location: [number, number],
    radiusMiles: number
  ) {
    // Search restaurants
    const results = await this.callTool('category_search', {
      category: 'restaurant',
      proximity: location
    });

    // Filter by distance
    const restaurants = JSON.parse(results);
    const filtered = [];

    for (const restaurant of restaurants) {
      const distance = await this.callTool('calculate_distance', {
        from: location,
        to: restaurant.coordinates,
        units: 'miles'
      });

      if (parseFloat(distance) <= radiusMiles) {
        filtered.push({
          ...restaurant,
          distance: parseFloat(distance)
        });
      }
    }

    return filtered.sort((a, b) => a.distance - b.distance);
  }
}

// Usage in Zillow-style app
const agent = new CustomMapboxAgent();
await agent.initialize();

const properties = await agent.findPropertiesWithCommute(
  [-122.4194, 37.7749], // Home in SF
  [-122.4, 37.79],      // Work downtown
  30                     // Max 30min commute
);

// Usage in TripAdvisor-style app
const restaurants = await agent.findRestaurantsNearby(
  [-73.9857, 40.7484], // Times Square
  0.5                   // Within 0.5 miles
);
```

**Benefits:**
- Full control over agent behavior
- Domain-specific abstractions
- Custom error handling

## Architecture Patterns

### Pattern: MCP as Service Layer

```
┌─────────────────────────────────────┐
│         Your Application            │
│  (Next.js, Express, FastAPI, etc.)  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│        AI Agent Layer               │
│   (pydantic-ai, mastra, custom)     │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│     Mapbox MCP Server               │
│  (Geospatial tools abstraction)     │
└────────────────┬────────────────────┘
                 │
          ┌──────┴──────┐
          ▼             ▼
    ┌─────────┐   ┌──────────┐
    │ Turf.js │   │ Mapbox   │
    │ (Local) │   │   APIs   │
    └─────────┘   └──────────┘
```

**Benefits:**
- Clean separation of concerns
- Easy to swap MCP server versions
- Centralized geospatial logic

### Pattern: Hybrid Approach

```typescript
class HybridGeospatialService {
  constructor(
    private mcpServer: MapboxMCPServer,
    private mapboxSdk: MapboxSDK
  ) {}

  async getDirections(origin: Point, destination: Point) {
    // Use MCP for AI agent calls
    if (this.isAIAgentCall()) {
      return await this.mcpServer.callTool('get_directions', {
        origin, destination
      });
    }

    // Use SDK for direct API calls (better performance)
    return await this.mapboxSdk.directions.getDirections({
      waypoints: [origin, destination]
    });
  }

  async calculateDistance(from: Point, to: Point) {
    // Always use offline tools (no API cost)
    return await this.mcpServer.callTool('calculate_distance', {
      from, to, units: 'miles'
    });
  }
}
```

**When to use:**
- MCP: AI agent interactions, complex workflows
- Direct API: Simple operations, performance-critical paths
- Offline tools: Distance/area calculations, point-in-polygon

## Use Cases by Application Type

### Real Estate App (Zillow-style)

```typescript
// Find properties with good commute
async findPropertiesByCommute(
  searchArea: Polygon,
  workLocation: Point,
  maxCommuteMinutes: number
) {
  // 1. Get isochrone from work
  const reachableArea = await mcp.callTool('get_isochrone', {
    coordinates: workLocation,
    contours_minutes: [maxCommuteMinutes]
  });

  // 2. Check each property
  const propertiesInRange = [];
  for (const property of properties) {
    const inRange = await mcp.callTool('point_in_polygon', {
      point: property.location,
      polygon: reachableArea
    });

    if (inRange) {
      // 3. Get exact commute time
      const directions = await mcp.callTool('get_directions', {
        origin: property.location,
        destination: workLocation
      });

      propertiesInRange.push({
        ...property,
        commuteTime: directions.duration / 60
      });
    }
  }

  return propertiesInRange;
}
```

### Food Delivery App (DoorDash-style)

```typescript
// Check if restaurant can deliver to address
async canDeliver(
  restaurantLocation: Point,
  deliveryAddress: Point,
  maxDeliveryTime: number
) {
  // 1. Calculate delivery zone
  const deliveryZone = await mcp.callTool('get_isochrone', {
    coordinates: restaurantLocation,
    contours_minutes: [maxDeliveryTime],
    profile: 'driving'
  });

  // 2. Check if address is in zone
  const canDeliver = await mcp.callTool('point_in_polygon', {
    point: deliveryAddress,
    polygon: deliveryZone
  });

  if (!canDeliver) return false;

  // 3. Get accurate delivery time
  const route = await mcp.callTool('get_directions', {
    origin: restaurantLocation,
    destination: deliveryAddress,
    profile: 'driving-traffic'
  });

  return {
    canDeliver: true,
    estimatedTime: route.duration / 60,
    distance: route.distance
  };
}
```

### Travel Planning App (TripAdvisor-style)

```typescript
// Build day itinerary with travel times
async buildItinerary(
  hotel: Point,
  attractions: Array<{name: string, location: Point}>
) {
  // 1. Calculate distances from hotel
  const attractionsWithDistance = await Promise.all(
    attractions.map(async (attr) => ({
      ...attr,
      distance: await mcp.callTool('calculate_distance', {
        from: hotel,
        to: attr.location,
        units: 'miles'
      })
    }))
  );

  // 2. Get travel time matrix
  const matrix = await mcp.callTool('get_matrix', {
    origins: [hotel],
    destinations: attractions.map(a => a.location),
    profile: 'walking'
  });

  // 3. Sort by walking time
  return attractionsWithDistance
    .map((attr, idx) => ({
      ...attr,
      walkingTime: matrix.durations[0][idx] / 60
    }))
    .sort((a, b) => a.walkingTime - b.walkingTime);
}
```

## Performance Optimization

### Caching Strategy

```typescript
class CachedMapboxMCP {
  private cache = new Map<string, {result: any, timestamp: number}>();
  private cacheTTL = 3600000; // 1 hour

  async callTool(name: string, params: any): Promise<any> {
    // Cache offline tools indefinitely (deterministic)
    const offlineTools = ['calculate_distance', 'point_in_polygon', 'bearing'];
    const ttl = offlineTools.includes(name) ? Infinity : this.cacheTTL;

    // Check cache
    const cacheKey = JSON.stringify({name, params});
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
  const distance = await mcp.callTool('calculate_distance', {
    from: userLocation,
    to: location
  });
}

// ✅ Good: Parallel batch
const distances = await Promise.all(
  locations.map(location =>
    mcp.callTool('calculate_distance', {
      from: userLocation,
      to: location
    })
  )
);

// ✅ Better: Use matrix tool
const matrix = await mcp.callTool('get_matrix', {
  origins: [userLocation],
  destinations: locations
});
```

### Tool Selection

```typescript
// Use offline tools when possible (faster, free)
const localOps = {
  distance: 'calculate_distance',      // Turf.js
  pointInPolygon: 'point_in_polygon',  // Turf.js
  bearing: 'calculate_bearing',        // Turf.js
  area: 'calculate_area'               // Turf.js
};

// Use API tools when necessary (requires token, slower)
const apiOps = {
  directions: 'get_directions',        // Mapbox API
  geocoding: 'reverse_geocode',        // Mapbox API
  isochrone: 'get_isochrone',         // Mapbox API
  search: 'category_search'           // Mapbox API
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
  async callToolWithRetry(
    name: string,
    params: any,
    maxRetries: number = 3
  ): Promise<any> {
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

  async callToolWithFallback(
    primaryTool: string,
    fallbackTool: string,
    params: any
  ): Promise<any> {
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
      calculate_distance: () => '2.5',
      get_directions: () => JSON.stringify({
        duration: 1200,
        distance: 5000,
        geometry: {...}
      }),
      point_in_polygon: () => 'true'
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

## Resources

- [Mapbox MCP Server](https://github.com/mapbox/mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Pydantic AI](https://ai.pydantic.dev/)
- [Mastra](https://mastra.ai/)
- [LangChain](https://js.langchain.com/)
- [Mapbox API Documentation](https://docs.mapbox.com/api/)

## When to Use This Skill

Invoke this skill when:

- Integrating Mapbox MCP Server into AI applications
- Building AI agents with geospatial capabilities
- Architecting Zillow/TripAdvisor/DoorDash-style apps with AI
- Choosing between MCP, direct APIs, or SDKs
- Optimizing geospatial operations in production
- Implementing error handling for geospatial AI features
- Testing AI applications with geospatial tools
