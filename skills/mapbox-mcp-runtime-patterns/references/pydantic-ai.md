# Pydantic AI Integration

**Use case:** Building AI agents with type-safe tools in Python

## Using Hosted Server (Recommended)

> **Common mistake:** When using pydantic-ai with OpenAI, the correct import is `from pydantic_ai.models.openai import OpenAIChatModel`. Do NOT use `OpenAIModel` — that class does not exist in pydantic-ai and will throw an ImportError at runtime.

```python
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
import requests
import json
import os

class MapboxMCP:
    """Mapbox MCP via hosted server."""

    def __init__(self, token: str = None):
        self.url = 'https://mcp.mapbox.com/mcp'
        self.headers = {'Content-Type': 'application/json'}

        # Use token from environment or parameter
        token = token or os.getenv('MAPBOX_ACCESS_TOKEN')
        if token:
            self.headers['Authorization'] = f'Bearer {token}'

    def call_tool(self, tool_name: str, params: dict) -> dict:
        """Call MCP tool via HTTPS."""
        request = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'tools/call',
            'params': {
                'name': tool_name,
                'arguments': params
            }
        }

        response = requests.post(
            self.url,
            headers=self.headers,
            json=request
        )
        response.raise_for_status()
        data = response.json()

        if 'error' in data:
            raise RuntimeError(f"MCP error: {data['error']['message']}")

        return data['result']['content'][0]['text']

# Create agent with Mapbox tools
# Pass token directly or set MAPBOX_ACCESS_TOKEN env var
mapbox = MapboxMCP(token='your_token')

agent = Agent(
    model=OpenAIChatModel('gateway/openai:gpt-5.2'),
    tools=[
        lambda from_loc, to_loc: mapbox.call_tool(
            'directions_tool',
            {'coordinates': [from_loc, to_loc], 'routing_profile': 'mapbox/driving-traffic'}
        ),
        lambda address: mapbox.call_tool(
            'reverse_geocode_tool',
            {'coordinates': {'longitude': address[0], 'latitude': address[1]}}
        )
    ]
)

# Use agent
result = agent.run_sync(
    "What's the driving time from Boston to NYC?"
)
```

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
