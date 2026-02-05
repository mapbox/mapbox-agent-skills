"""
Pydantic AI + Mapbox MCP Integration Example

This example shows how to integrate Mapbox MCP Server with Pydantic AI agents.

Prerequisites:
- pip install pydantic-ai requests openai python-dotenv
- Set MAPBOX_ACCESS_TOKEN and OPENAI_API_KEY environment variables

Usage:
- python pydantic_ai_example.py
"""

import os
import json
from typing import List, Tuple
import requests
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel
from dotenv import load_dotenv

load_dotenv()


class MapboxMCP:
    """Mapbox MCP client for hosted server."""

    def __init__(self, token: str = None):
        self.url = 'https://mcp.mapbox.com/mcp'
        token = token or os.getenv('MAPBOX_ACCESS_TOKEN')
        if not token:
            raise ValueError('MAPBOX_ACCESS_TOKEN is required')

        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }

    def call_tool(self, tool_name: str, params: dict) -> str:
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


# Initialize MCP client
mcp = MapboxMCP()

# Create Pydantic AI agent with Mapbox tools
model = OpenAIModel('gpt-4o')

agent = Agent(
    model,
    system_prompt="""You are a location intelligence expert. You help users with:
    - Finding places (restaurants, hotels, etc.)
    - Planning routes with traffic
    - Calculating distances and travel times
    - Analyzing reachable areas

    Always provide clear, actionable information with specific times and distances."""
)


@agent.tool
def get_directions(
    ctx: RunContext,
    origin: Tuple[float, float],
    destination: Tuple[float, float]
) -> str:
    """Get driving directions between two locations with current traffic.

    Args:
        origin: Origin coordinates (longitude, latitude)
        destination: Destination coordinates (longitude, latitude)

    Returns:
        JSON string with route details (duration, distance)
    """
    result = mcp.call_tool('get_directions', {
        'origin': list(origin),
        'destination': list(destination),
        'profile': 'driving-traffic'
    })
    return result


@agent.tool
def search_poi(
    ctx: RunContext,
    category: str,
    location: Tuple[float, float]
) -> str:
    """Find points of interest near a location.

    Args:
        category: POI category (restaurant, hotel, coffee, gas_station, etc.)
        location: Search center (longitude, latitude)

    Returns:
        JSON string with nearby POIs
    """
    result = mcp.call_tool('category_search', {
        'category': category,
        'proximity': list(location)
    })
    return result


@agent.tool
def calculate_distance(
    ctx: RunContext,
    from_coords: Tuple[float, float],
    to_coords: Tuple[float, float],
    units: str = 'miles'
) -> str:
    """Calculate distance between two points (offline, instant, free).

    Args:
        from_coords: Start coordinates (longitude, latitude)
        to_coords: End coordinates (longitude, latitude)
        units: 'miles' or 'kilometers'

    Returns:
        Distance as a string
    """
    result = mcp.call_tool('calculate_distance', {
        'from': list(from_coords),
        'to': list(to_coords),
        'units': units
    })
    return result


@agent.tool
def get_isochrone(
    ctx: RunContext,
    location: Tuple[float, float],
    minutes: int,
    profile: str = 'walking'
) -> str:
    """Calculate reachable area within a time limit.

    Args:
        location: Center point (longitude, latitude)
        minutes: Time limit in minutes
        profile: 'driving', 'walking', or 'cycling'

    Returns:
        GeoJSON polygon of reachable area
    """
    result = mcp.call_tool('get_isochrone', {
        'coordinates': list(location),
        'contours_minutes': [minutes],
        'profile': profile
    })
    return result


def main():
    """Run example queries."""

    print("Example 1: Finding restaurants near Times Square\n")
    result1 = agent.run_sync(
        "Find 3 restaurants near Times Square NYC (coordinates: -73.9857, 40.7484) "
        "and tell me how far each is from the center."
    )
    print("Agent:", result1.data)
    print("\n---\n")

    print("Example 2: Planning route with traffic\n")
    result2 = agent.run_sync(
        "What is the driving time from Boston (-71.0589, 42.3601) to "
        "NYC (-74.0060, 40.7128) with current traffic?"
    )
    print("Agent:", result2.data)
    print("\n---\n")

    print("Example 3: Multi-step analysis\n")
    result3 = agent.run_sync(
        "I work at -122.4, 37.79 in San Francisco. Find coffee shops within "
        "10 minutes walking, calculate distance to each, and recommend the closest 3."
    )
    print("Agent:", result3.data)


if __name__ == '__main__':
    main()
