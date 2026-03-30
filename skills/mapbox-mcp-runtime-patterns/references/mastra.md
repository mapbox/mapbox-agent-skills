# Mastra Integration

**Use case:** Building multi-agent systems with geospatial workflows

```typescript
import { Mastra } from '@mastra/core';

class MapboxMCP {
  private url = 'https://mcp.mapbox.com/mcp';
  private headers: Record<string, string>;

  constructor(token?: string) {
    const mapboxToken = token || process.env.MAPBOX_ACCESS_TOKEN;
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mapboxToken}`
    };
  }

  async callTool(toolName: string, params: any): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: toolName, arguments: params }
    };

    const response = await fetch(this.url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(request)
    });

    const data = await response.json();
    return JSON.parse(data.result.content[0].text);
  }
}

// Create Mastra agent with Mapbox tools
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const mcp = new MapboxMCP();

// Create Mapbox tools
const searchPOITool = createTool({
  id: 'search-poi',
  description: 'Find places of a specific category near a location',
  inputSchema: z.object({
    category: z.string(),
    location: z.array(z.number()).length(2)
  }),
  execute: async ({ category, location }) => {
    return await mcp.callTool('category_search_tool', {
      category,
      proximity: { longitude: location[0], latitude: location[1] }
    });
  }
});

const getDirectionsTool = createTool({
  id: 'get-directions',
  description: 'Get driving directions with traffic',
  inputSchema: z.object({
    origin: z.array(z.number()).length(2),
    destination: z.array(z.number()).length(2)
  }),
  execute: async ({ origin, destination }) => {
    return await mcp.callTool('directions_tool', {
      coordinates: [
        { longitude: origin[0], latitude: origin[1] },
        { longitude: destination[0], latitude: destination[1] }
      ],
      routing_profile: 'mapbox/driving-traffic'
    });
  }
});

// Create location agent
const locationAgent = new Agent({
  id: 'location-agent',
  name: 'Location Intelligence Agent',
  instructions: 'You help users find places and plan routes with geospatial tools.',
  model: 'openai/gpt-5.2',
  tools: {
    searchPOITool,
    getDirectionsTool
  }
});

// Use agent
const result = await locationAgent.generate([
  { role: 'user', content: 'Find restaurants near Times Square NYC (-73.9857, 40.7484)' }
]);
```

**Benefits:**

- Multi-step geospatial workflows
- Agent orchestration
- State management
