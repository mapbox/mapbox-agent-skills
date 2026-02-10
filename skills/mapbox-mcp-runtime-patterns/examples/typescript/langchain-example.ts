/**
 * LangChain + Mapbox MCP Integration Example
 *
 * This example shows how to integrate Mapbox MCP Server with LangChain agents.
 *
 * Prerequisites:
 * - npm install langchain @langchain/core @langchain/openai
 * - Set MAPBOX_ACCESS_TOKEN and OPENAI_API_KEY environment variables
 *
 * Usage:
 * - ts-node langchain-example.ts
 */

import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
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

  async callTool(name: string, args: any): Promise<string> {
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

    const data = await response.json() as any;

    if (data.error) {
      throw new Error(`MCP error: ${data.error.message}`);
    }

    return data.result.content[0].text;
  }
}

// Initialize MCP client
const mcp = new MapboxMCP();

// Create LangChain tools from Mapbox MCP
const getDirectionsTool = new DynamicStructuredTool({
  name: 'directions_tool',
  description: 'Get turn-by-turn driving directions with traffic-aware route distance and travel time along roads. Use when you need the actual driving route, navigation, or traffic-aware duration. Returns route distance and time.',
  schema: z.object({
    origin: z.tuple([z.number(), z.number()]).describe('Origin coordinates [longitude, latitude]'),
    destination: z.tuple([z.number(), z.number()]).describe('Destination coordinates [longitude, latitude]'),
  }) as any,
  func: async ({ origin, destination }: any) => {
    const result = await mcp.callTool('directions_tool', {
      coordinates: [
        { longitude: origin[0], latitude: origin[1] },
        { longitude: destination[0], latitude: destination[1] }
      ],
      routing_profile: 'mapbox/driving-traffic'
    });
    return result;
  }
});

const searchPOITool = new DynamicStructuredTool({
  name: 'search_poi',
  description: 'Find ALL places of a specific category type (restaurants, hotels, coffee shops, gas stations, etc.) near a location. Use when user wants to browse or discover places by type, not search for a specific named place.',
  schema: z.object({
    category: z.string().describe('POI category: restaurant, hotel, coffee, gas_station, etc.'),
    location: z.tuple([z.number(), z.number()]).describe('Search center [longitude, latitude]'),
  }) as any,
  func: async ({ category, location }: any) => {
    const result = await mcp.callTool('category_search_tool', {
      category,
      proximity: { longitude: location[0], latitude: location[1] }
    });
    return result;
  }
});

const calculateDistanceTool = new DynamicStructuredTool({
  name: 'distance_tool',
  description: 'Calculate straight-line (great-circle) distance between two points. Use for quick "as the crow flies" distance, proximity checks, or when routing not needed. Works offline, instant, no API cost.',
  schema: z.object({
    from: z.tuple([z.number(), z.number()]).describe('Start coordinates [longitude, latitude]'),
    to: z.tuple([z.number(), z.number()]).describe('End coordinates [longitude, latitude]'),
    units: z.enum(['miles', 'kilometers']).optional()
  }) as any,
  func: async ({ from, to, units }: any) => {
    const result = await mcp.callTool('distance_tool', {
      from: Array.from(from),
      to: Array.from(to),
      units: units || 'miles'
    });
    return result;
  }
});

const getIsochroneTool = new DynamicStructuredTool({
  name: 'isochrone_tool',
  description: 'Calculate the AREA reachable within a time limit from a starting point. Use for "What can I reach in X minutes?" questions, service areas, or delivery zones. Returns GeoJSON polygon of reachable area.',
  schema: z.object({
    location: z.tuple([z.number(), z.number()]).describe('Center point [longitude, latitude]'),
    minutes: z.number().describe('Time limit in minutes'),
    profile: z.enum(['mapbox/driving', 'mapbox/walking', 'mapbox/cycling']).optional()
  }) as any,
  func: async ({ location, minutes, profile }: any) => {
    const result = await mcp.callTool('isochrone_tool', {
      coordinates: { longitude: location[0], latitude: location[1] },
      contours_minutes: [minutes],
      profile: profile || 'mapbox/walking'
    });
    return result;
  }
});

// Create the agent
async function createLocationAgent() {
  const tools = [
    getDirectionsTool,
    searchPOITool,
    calculateDistanceTool,
    getIsochroneTool
  ];

  const llm = new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are a location intelligence assistant. You help users with:
- Finding places (restaurants, hotels, coffee shops, etc.)
- Planning routes with traffic
- Calculating distances and travel times
- Analyzing reachable areas

TOOL SELECTION RULES:
- Use calculate_distance for straight-line distance ("as the crow flies")
- Use get_directions for route distance along roads with traffic
- Use search_poi for finding types of places ("coffee shops", "restaurants")
- Use get_isochrone for "what can I reach in X minutes" questions
- Prefer offline tools (calculate_distance) when real-time data is not needed

Always provide clear, specific information with times and distances.`],
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad')
  ]);

  // @ts-ignore - Zod tuple schemas cause deep type recursion
  const agent = await createToolCallingAgent({
    llm,
    tools,
    prompt
  });

  return new AgentExecutor({
    agent,
    tools,
    verbose: true
  });
}

// Example usage
async function main() {
  try {
    const executor = await createLocationAgent();

    // Example 1: Find coffee shops
    console.log('Example 1: Finding coffee shops near Union Square\n');

    const result1 = await executor.invoke({
      input: 'Find coffee shops within 10 minutes walking from Union Square NYC (coordinates: -73.9908, 40.7360). Tell me their names and how far each is.'
    });

    console.log('\nResult:', result1.output);
    console.log('\n---\n');

    // Example 2: Route planning
    console.log('Example 2: Planning route with traffic\n');

    const result2 = await executor.invoke({
      input: 'How long does it take to drive from San Francisco downtown (-122.4194, 37.7749) to Oakland (-122.2712, 37.8044) with current traffic?'
    });

    console.log('\nResult:', result2.output);
    console.log('\n---\n');

    // Example 3: Multi-step workflow
    console.log('Example 3: Multi-step location analysis\n');

    const result3 = await executor.invoke({
      input: 'I work at -122.4, 37.79 in San Francisco. Find restaurants within 15 minutes walking, calculate the distance to each, and recommend the closest 3.'
    });

    console.log('\nResult:', result3.output);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { createLocationAgent, mcp };
