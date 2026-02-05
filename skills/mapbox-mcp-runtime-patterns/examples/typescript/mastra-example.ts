/**
 * Mastra + Mapbox MCP Integration Example
 *
 * This example shows how to integrate Mapbox MCP Server with Mastra agents.
 *
 * Prerequisites:
 * - npm install @mastra/core zod
 * - Set MAPBOX_ACCESS_TOKEN environment variable
 *
 * Usage:
 * - ts-node mastra-example.ts
 */

import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Mapbox MCP Client (hosted server)
class MapboxMCP {
  private url = 'https://mcp.mapbox.com/mcp';
  private headers: Record<string, string>;

  constructor(token?: string) {
    const mapboxToken = token || process.env.MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      throw new Error('MAPBOX_ACCESS_TOKEN is required');
    }
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mapboxToken}`
    };
  }

  async callTool(name: string, args: any): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name, arguments: args }
    };

    const response = await fetch(this.url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`MCP error: ${data.error.message}`);
    }

    return JSON.parse(data.result.content[0].text);
  }
}

// Initialize Mapbox MCP client
const mcp = new MapboxMCP();

// Create Mapbox tools for Mastra
const getDirectionsTool = createTool({
  id: 'get-directions',
  description: 'Get driving directions between two locations with current traffic',
  inputSchema: z.object({
    origin: z.array(z.number()).length(2).describe('Origin coordinates [longitude, latitude]'),
    destination: z.array(z.number()).length(2).describe('Destination coordinates [longitude, latitude]'),
  }),
  outputSchema: z.object({
    duration: z.number().describe('Travel time in seconds'),
    distance: z.number().describe('Distance in meters'),
    summary: z.string().describe('Route summary')
  }),
  execute: async ({ origin, destination }) => {
    const result = await mcp.callTool('get_directions', {
      origin,
      destination,
      profile: 'driving-traffic'
    });

    return {
      duration: result.routes[0].duration,
      distance: result.routes[0].distance,
      summary: `${Math.round(result.routes[0].duration / 60)} min, ${(result.routes[0].distance / 1000).toFixed(1)} km`
    };
  }
});

const searchPOITool = createTool({
  id: 'search-poi',
  description: 'Find points of interest (restaurants, hotels, etc.) near a location',
  inputSchema: z.object({
    category: z.string().describe('POI category: restaurant, hotel, coffee, gas_station, etc.'),
    location: z.array(z.number()).length(2).describe('Search center [longitude, latitude]'),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      name: z.string(),
      coordinates: z.array(z.number()),
      address: z.string().optional()
    }))
  }),
  execute: async ({ category, location }) => {
    const result = await mcp.callTool('category_search', {
      category,
      proximity: location
    });

    return {
      results: result.features.map((f: any) => ({
        name: f.properties.name,
        coordinates: f.geometry.coordinates,
        address: f.properties.address
      }))
    };
  }
});

const calculateDistanceTool = createTool({
  id: 'calculate-distance',
  description: 'Calculate distance between two points (offline, instant)',
  inputSchema: z.object({
    from: z.array(z.number()).length(2).describe('Start coordinates [longitude, latitude]'),
    to: z.array(z.number()).length(2).describe('End coordinates [longitude, latitude]'),
    units: z.enum(['miles', 'kilometers']).optional().default('miles')
  }),
  outputSchema: z.object({
    distance: z.number().describe('Distance in specified units')
  }),
  execute: async ({ from, to, units }) => {
    const result = await mcp.callTool('calculate_distance', {
      from,
      to,
      units: units || 'miles'
    });

    return {
      distance: parseFloat(result)
    };
  }
});

const getIsochroneTool = createTool({
  id: 'get-isochrone',
  description: 'Calculate reachable area within a time limit (isochrone)',
  inputSchema: z.object({
    location: z.array(z.number()).length(2).describe('Center point [longitude, latitude]'),
    minutes: z.number().describe('Time limit in minutes'),
    profile: z.enum(['driving', 'walking', 'cycling']).optional().default('driving')
  }),
  outputSchema: z.object({
    area: z.string().describe('GeoJSON polygon of reachable area')
  }),
  execute: async ({ location, minutes, profile }) => {
    const result = await mcp.callTool('get_isochrone', {
      coordinates: location,
      contours_minutes: [minutes],
      profile: profile || 'driving'
    });

    return {
      area: JSON.stringify(result)
    };
  }
});

// Create Mastra agent with Mapbox tools
const locationAgent = new Agent({
  id: 'location-agent',
  name: 'Location Intelligence Agent',
  instructions: `You are a location intelligence expert. You help users with:
- Finding places (restaurants, hotels, etc.)
- Planning routes with traffic
- Calculating distances and travel times
- Analyzing reachable areas

Always provide clear, actionable information with specific times and distances.`,
  model: 'openai/gpt-4o',
  tools: {
    getDirectionsTool,
    searchPOITool,
    calculateDistanceTool,
    getIsochroneTool
  }
});

// Example usage
async function main() {
  try {
    // Example 1: Find restaurants and calculate route
    console.log('Example 1: Finding restaurants near Times Square\n');

    const response1 = await locationAgent.generate([
      {
        role: 'user',
        content: 'Find 3 restaurants near Times Square NYC (coordinates: -73.9857, 40.7484) and tell me how far each is.'
      }
    ]);

    console.log('Agent:', response1.text);
    console.log('\n---\n');

    // Example 2: Plan a route
    console.log('Example 2: Planning route with traffic\n');

    const response2 = await locationAgent.generate([
      {
        role: 'user',
        content: 'What is the driving time from Boston (-71.0589, 42.3601) to NYC (-74.0060, 40.7128) with current traffic?'
      }
    ]);

    console.log('Agent:', response2.text);
    console.log('\n---\n');

    // Example 3: Isochrone analysis
    console.log('Example 3: Reachable area analysis\n');

    const response3 = await locationAgent.generate([
      {
        role: 'user',
        content: 'Show me the area I can reach within 15 minutes driving from downtown SF (-122.4194, 37.7749)'
      }
    ]);

    console.log('Agent:', response3.text);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { locationAgent, mcp };
