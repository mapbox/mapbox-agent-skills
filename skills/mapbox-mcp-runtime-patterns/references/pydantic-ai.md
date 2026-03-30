# Pydantic AI Integration

**Use case:** Building AI agents with type-safe tools in Python

## Using Hosted Server (Recommended)

> **Common mistake:** When using pydantic-ai with OpenAI, the correct import is `from pydantic_ai.models.openai import OpenAIChatModel`. Do NOT use `OpenAIModel` — that class does not exist in pydantic-ai and will throw an ImportError at runtime.

**Use `MCPServerHTTP` from pydantic-ai** to connect to the hosted Mapbox MCP server. This is the idiomatic way — avoid writing custom HTTP wrappers.

```python
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.mcp import MCPServerHTTP
import os

# Connect to Mapbox MCP server using MCPServerHTTP
mapbox_server = MCPServerHTTP(
    url='https://mcp.mapbox.com/sse',
    headers={
        'Authorization': f'Bearer {os.getenv("MAPBOX_ACCESS_TOKEN")}'
    }
)

# Create agent with MCP server — tools are discovered automatically
agent = Agent(
    model=OpenAIChatModel('gpt-4o'),
    mcp_servers=[mapbox_server]
)

# Use agent — MCP tools (directions_tool, etc.) are available automatically
async def main():
    async with agent.run_mcp_servers():
        result = await agent.run(
            "What's the driving time from the Eiffel Tower to the Louvre?"
        )
        print(result.output)
```

> **Key point:** With `MCPServerHTTP`, you do NOT define tools manually — the agent discovers them from the MCP server. The server exposes tools like `directions_tool`, `category_search_tool`, `isochrone_tool`, etc.

### How the Agent Calls directions_tool

When the agent processes a directions query, it will call `directions_tool` with these parameters:

```python
# The agent automatically calls directions_tool like this:
{
    "coordinates": [
        {"longitude": 2.2945, "latitude": 48.8584},   # Eiffel Tower
        {"longitude": 2.3376, "latitude": 48.8606}    # Louvre
    ],
    "routing_profile": "mapbox/driving-traffic"
}
```

**Critical parameter rules:**

- `coordinates` is an **array of `{longitude, latitude}` objects** — NOT `[lng, lat]` arrays
- `routing_profile` must include the **`mapbox/` prefix** (e.g., `mapbox/driving-traffic`, `mapbox/walking`)
- Do NOT use `origin`/`destination` parameter names — use the `coordinates` array instead

## Using Self-Hosted Server

```python
import subprocess

class MapboxMCPLocal:
    def __init__(self, token: str):
        self.token = token
        self.mcp_process = subprocess.Popen(
            ['npx', '@mapbox/mcp-server'],
            env={'MAPBOX_ACCESS_TOKEN': token},
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE
        )

    def call_tool(self, tool_name: str, params: dict) -> dict:
        # ... similar to hosted but via subprocess
        pass
```

**Benefits:**

- Type-safe tool definitions
- Seamless MCP integration
- Python-native development
