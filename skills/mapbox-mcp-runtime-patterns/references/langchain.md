# LangChain Integration

**Use case:** Building conversational AI with geospatial tools

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { z } from 'zod';

// MCP client/transport setup using @modelcontextprotocol/sdk
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// Connect to the Mapbox MCP server via SSE transport
const transport = new SSEClientTransport(new URL('https://mcp.mapbox.com/sse'), {
  requestInit: {
    headers: {
      Authorization: `Bearer ${process.env.MAPBOX_ACCESS_TOKEN}`
    }
  }
});

const mcpClient = new Client({ name: 'langchain-mapbox', version: '1.0.0' });
await mcpClient.connect(transport);

// Helper to call MCP tools through the client
async function callMcpTool(name: string, args: any): Promise<string> {
  const result = await mcpClient.callTool({ name, arguments: args });
  return (result.content as any)[0].text;
}

const tools = [
  new DynamicStructuredTool({
    name: 'directions_tool',
    description:
      'Get turn-by-turn driving directions with traffic-aware route distance along roads. Use when you need the actual driving route or traffic-aware duration.',
    schema: z.object({
      origin: z.tuple([z.number(), z.number()]).describe('Origin [longitude, latitude]'),
      destination: z.tuple([z.number(), z.number()]).describe('Destination [longitude, latitude]')
    }) as any,
    func: async ({ origin, destination }: any) => {
      return await callMcpTool('directions_tool', {
        coordinates: [
          { longitude: origin[0], latitude: origin[1] },
          { longitude: destination[0], latitude: destination[1] }
        ],
        routing_profile: 'mapbox/driving-traffic'
      });
    }
  }),

  new DynamicStructuredTool({
    name: 'category_search_tool',
    description:
      'Find ALL places of a specific category type near a location. Use when user wants to browse places by type (restaurants, hotels, coffee, etc.).',
    schema: z.object({
      category: z.string().describe('POI category: restaurant, hotel, coffee, etc.'),
      location: z.tuple([z.number(), z.number()]).describe('Search center [longitude, latitude]')
    }) as any,
    func: async ({ category, location }: any) => {
      return await callMcpTool('category_search_tool', {
        category,
        proximity: { longitude: location[0], latitude: location[1] }
      });
    }
  }),

  new DynamicStructuredTool({
    name: 'isochrone_tool',
    description:
      'Calculate the AREA reachable within a time limit from a starting point. Use for "What can I reach in X minutes?" questions.',
    schema: z.object({
      location: z.tuple([z.number(), z.number()]).describe('Center point [longitude, latitude]'),
      minutes: z.number().describe('Time limit in minutes'),
      profile: z.enum(['mapbox/driving', 'mapbox/walking', 'mapbox/cycling']).optional()
    }) as any,
    func: async ({ location, minutes, profile }: any) => {
      return await callMcpTool('isochrone_tool', {
        coordinates: { longitude: location[0], latitude: location[1] },
        contours_minutes: [minutes],
        profile: profile || 'mapbox/walking'
      });
    }
  }),

  new DynamicStructuredTool({
    name: 'distance_tool',
    description: 'Calculate straight-line distance between two points (offline, free)',
    schema: z.object({
      from: z.tuple([z.number(), z.number()]).describe('Start [longitude, latitude]'),
      to: z.tuple([z.number(), z.number()]).describe('End [longitude, latitude]'),
      units: z.enum(['miles', 'kilometers']).optional()
    }) as any,
    func: async ({ from, to, units }: any) => {
      return await callMcpTool('distance_tool', {
        from: { longitude: from[0], latitude: from[1] },
        to: { longitude: to[0], latitude: to[1] },
        units: units || 'miles'
      });
    }
  })
];

// Create agent
const llm = new ChatOpenAI({ model: 'gpt-5.2', temperature: 0 });
const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a location intelligence assistant.'],
  ['human', '{input}'],
  new MessagesPlaceholder('agent_scratchpad')
]);
// @ts-ignore - Zod tuple schemas cause deep type recursion
const agent = await createToolCallingAgent({ llm, tools, prompt });
const executor = new AgentExecutor({ agent, tools, verbose: true });

// Use agent
const result = await executor.invoke({
  input: 'Find coffee shops within 10 minutes walking from Union Square, NYC'
});
```

**Benefits:**

- Conversational interface
- Tool chaining
- Memory and context management

**TypeScript Type Considerations:**

When using `DynamicStructuredTool` with Zod schemas (especially `z.tuple()`), TypeScript may encounter deep type recursion errors. This is a known limitation with complex Zod generic types. The minimal fix is to add `as any` type assertions:

```typescript
const tool = new DynamicStructuredTool({
  name: 'my_tool',
  schema: z.object({
    coords: z.tuple([z.number(), z.number()])
  }) as any, // ← Add 'as any' to prevent type recursion
  func: async ({ coords }: any) => {
    // ← Type parameters as 'any'
    // Implementation
  }
});

// For JSON responses from external APIs
const data = (await response.json()) as any;

// For createOpenAIFunctionsAgent with complex tool types
// @ts-ignore - Zod tuple schemas cause deep type recursion
const agent = await createOpenAIFunctionsAgent({ llm, tools, prompt });
```

This doesn't affect runtime validation (Zod still validates at runtime) - it only helps TypeScript's type checker avoid infinite recursion during compilation.
