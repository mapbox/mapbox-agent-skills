# Custom Agent Integration

**Use case:** Building domain-specific AI applications (Zillow-style, TripAdvisor-style)

```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

class CustomMapboxAgent {
  private url = 'https://mcp.mapbox.com/mcp';
  private headers: Record<string, string>;
  private tools: Map<string, MCPTool> = new Map();

  constructor(token?: string) {
    const mapboxToken = token || process.env.MAPBOX_ACCESS_TOKEN;
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mapboxToken}`
    };
  }

  async initialize() {
    // Discover available tools from MCP server
    await this.discoverTools();
  }

  private async discoverTools() {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    };

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
      params: { name: toolName, arguments: params }
    };

    const response = await this.sendMCPRequest(request);
    return response.result.content[0].text;
  }

  private async sendMCPRequest(request: any): Promise<any> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(request)
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data;
  }

  // Domain-specific methods
  async findPropertiesWithCommute(
    homeLocation: [number, number],
    workLocation: [number, number],
    maxCommuteMinutes: number
  ) {
    // Get isochrone from work location
    const isochrone = await this.callTool('isochrone_tool', {
      coordinates: { longitude: workLocation[0], latitude: workLocation[1] },
      contours_minutes: [maxCommuteMinutes],
      profile: 'mapbox/driving-traffic'
    });

    // Check if home is within isochrone
    const isInRange = await this.callTool('point_in_polygon_tool', {
      point: { longitude: homeLocation[0], latitude: homeLocation[1] },
      polygon: JSON.parse(isochrone).features[0].geometry
    });

    return JSON.parse(isInRange);
  }

  async findRestaurantsNearby(location: [number, number], radiusMiles: number) {
    // Search restaurants
    const results = await this.callTool('category_search_tool', {
      category: 'restaurant',
      proximity: { longitude: location[0], latitude: location[1] }
    });

    // Filter by distance
    const restaurants = JSON.parse(results);
    const filtered = [];

    for (const restaurant of restaurants) {
      const distance = await this.callTool('distance_tool', {
        from: { longitude: location[0], latitude: location[1] },
        to: { longitude: restaurant.coordinates[0], latitude: restaurant.coordinates[1] },
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
  [-122.4, 37.79], // Work downtown
  30 // Max 30min commute
);

// Usage in TripAdvisor-style app
const restaurants = await agent.findRestaurantsNearby(
  [-73.9857, 40.7484], // Times Square
  0.5 // Within 0.5 miles
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

You can use MCP for AI agent features while using direct Mapbox APIs for other parts of your app.

```typescript
class GeospatialService {
  constructor(
    private mcpServer: MapboxMCPServer, // For AI features
    private mapboxSdk: MapboxSDK // For direct app features
  ) {}

  // AI Agent Feature: Natural language search
  async aiSearchNearby(userQuery: string): Promise<string> {
    // Let AI agent use MCP tools to interpret query and find places
    // Returns natural language response
    return await this.agent.execute(userQuery, [
      this.mcpServer.tools.category_search_tool,
      this.mcpServer.tools.directions_tool
    ]);
  }

  // Direct App Feature: Display route on map
  async getRouteGeometry(origin: Point, dest: Point): Promise<LineString> {
    // Direct API call for map rendering - returns GeoJSON
    const result = await this.mapboxSdk.directions.getDirections({
      waypoints: [origin, dest],
      geometries: 'geojson'
    });
    return result.routes[0].geometry;
  }

  // Offline Feature: Distance calculations (always use MCP/Turf.js)
  async calculateDistance(from: Point, to: Point): Promise<number> {
    // No API cost, instant
    return await this.mcpServer.callTool('distance_tool', {
      from,
      to,
      units: 'miles'
    });
  }
}
```

**Architecture Decision Guide:**

| Use Case                           | Use This                   | Why                                              |
| ---------------------------------- | -------------------------- | ------------------------------------------------ |
| AI agent natural language features | MCP Server                 | Simplified tool interface, AI-friendly responses |
| Map rendering, direct UI controls  | Mapbox SDK                 | More control, better performance                 |
| Distance/area calculations         | MCP Server (offline tools) | Free, instant, no API calls                      |
| Custom map styling                 | Mapbox SDK                 | Fine-grained style control                       |
| Conversational geospatial queries  | MCP Server                 | AI agent can chain tools                         |
