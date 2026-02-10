"""
Smolagents + Mapbox MCP Integration Example

This example shows TWO ways to integrate Mapbox MCP Server with Smolagents:
1. Using MCPClient (direct MCP connection - recommended)
2. Creating custom tools with @tool decorator

Prerequisites:
- pip install smolagents requests huggingface-hub python-dotenv
- Set MAPBOX_ACCESS_TOKEN and HF_TOKEN environment variables

Usage:
- python smolagents_example.py
"""

import os
from smolagents import CodeAgent, HfApiModel, MCPClient, tool
import requests
from dotenv import load_dotenv

load_dotenv()


# ============================================================================
# Method 1: Direct MCP Connection (RECOMMENDED)
# ============================================================================

def example_with_mcp_client():
    """
    Use Smolagents MCPClient to directly connect to Mapbox MCP Server.
    This is the recommended approach as it requires minimal code.
    """
    print("\n=== Example 1: Using MCPClient (Direct MCP Connection) ===\n")

    # Configure Mapbox MCP server connection
    server_params = {
        "url": "https://mcp.mapbox.com/mcp",
        "transport": "streamable-http",
        "headers": {
            "Authorization": f"Bearer {os.getenv('MAPBOX_ACCESS_TOKEN')}"
        }
    }

    model = HfApiModel()

    # Use MCP Client to load all Mapbox tools automatically
    with MCPClient(server_params, structured_output=True) as tools:
        agent = CodeAgent(
            tools=tools,
            model=model,
            add_base_tools=True
        )

        # Example 1: Find restaurants
        result1 = agent.run(
            "Find 3 restaurants near Times Square NYC (coordinates: -73.9857, 40.7484). "
            "For each restaurant, calculate how far it is from Times Square."
        )
        print("\nResult:", result1)
        print("\n" + "="*60)

        # Example 2: Route planning
        result2 = agent.run(
            "What is the driving time with traffic from Boston (-71.0589, 42.3601) to "
            "NYC (-74.0060, 40.7128)?"
        )
        print("\nResult:", result2)


# ============================================================================
# Method 2: Custom Tools with @tool Decorator
# ============================================================================

# Mapbox MCP Client for custom tools
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


mcp = MapboxMCP()


# Create custom tools with @tool decorator
@tool
def get_directions(origin: list, destination: list) -> str:
    """
    Get driving directions between two locations with current traffic.

    Args:
        origin: Origin coordinates [longitude, latitude]
        destination: Destination coordinates [longitude, latitude]

    Returns:
        Route details with duration and distance
    """
    return mcp.call_tool('directions_tool', {
        'origin': origin,
        'destination': destination,
        'profile': 'mapbox/driving-traffic'
    })


@tool
def search_poi(category: str, location: list) -> str:
    """
    Find points of interest (restaurants, hotels, etc.) near a location.

    Args:
        category: POI category (restaurant, hotel, coffee, gas_station, etc.)
        location: Search center [longitude, latitude]

    Returns:
        List of nearby POIs with names and addresses
    """
    return mcp.call_tool('category_search_tool', {
        'category': category,
        'proximity': location
    })


@tool
def calculate_distance(from_coords: list, to_coords: list, units: str = 'miles') -> str:
    """
    Calculate distance between two points (offline, instant, free).

    Args:
        from_coords: Start coordinates [longitude, latitude]
        to_coords: End coordinates [longitude, latitude]
        units: 'miles' or 'kilometers'

    Returns:
        Distance value
    """
    return mcp.call_tool('distance_tool', {
        'from': from_coords,
        'to': to_coords,
        'units': units
    })


@tool
def get_isochrone(location: list, minutes: int, profile: str = 'mapbox/walking') -> str:
    """
    Calculate reachable area within a time limit (isochrone).

    Args:
        location: Center point [longitude, latitude]
        minutes: Time limit in minutes
        profile: 'mapbox/driving', 'mapbox/walking', or 'mapbox/cycling'

    Returns:
        GeoJSON polygon of reachable area
    """
    return mcp.call_tool('isochrone_tool', {
        'coordinates': location,
        'contours_minutes': [minutes],
        'profile': profile
    })


def example_with_custom_tools():
    """
    Use custom tools created with @tool decorator.
    Gives you more control over individual tool behavior.
    """
    print("\n=== Example 2: Using Custom Tools (@tool decorator) ===\n")

    model = HfApiModel()

    # Create agent with custom tools
    agent = CodeAgent(
        tools=[
            get_directions,
            search_poi,
            calculate_distance,
            get_isochrone
        ],
        model=model,
        add_base_tools=True
    )

    # Example: Property search with commute analysis
    result = agent.run(
        """I'm looking for an apartment in San Francisco. My work is at -122.4, 37.79.

        1. Calculate the area I can reach within 30 minutes driving from work
        2. Find coffee shops within 10 minutes walking from work
        3. Calculate distance from work to downtown SF (-122.4194, 37.7749)
        """
    )
    print("\nResult:", result)


# ============================================================================
# Real-World Use Case: Property Search Agent
# ============================================================================

class PropertySearchAgent:
    """Agent for finding properties with good commutes."""

    def __init__(self):
        self.model = HfApiModel()
        self.mcp_params = {
            "url": "https://mcp.mapbox.com/mcp",
            "transport": "streamable-http",
            "headers": {
                "Authorization": f"Bearer {os.getenv('MAPBOX_ACCESS_TOKEN')}"
            }
        }

    def find_properties_near_work(
        self,
        work_location: list,
        max_commute_minutes: int
    ):
        """Find properties within commute time of work."""

        with MCPClient(self.mcp_params, structured_output=True) as tools:
            agent = CodeAgent(
                tools=tools,
                model=self.model,
                add_base_tools=True
            )

            prompt = f"""
            I work at coordinates {work_location} and want to find good neighborhoods
            to live in with a maximum commute of {max_commute_minutes} minutes.

            Please:
            1. Calculate the reachable area within {max_commute_minutes} minutes driving
            2. Find restaurants within 10 minutes walking from work (for lunch)
            3. Find coffee shops within 5 minutes walking from work
            4. Recommend neighborhoods based on this analysis
            """

            return agent.run(prompt)


def example_real_world():
    """Real-world example: Property search with commute."""
    print("\n=== Example 3: Real-World Use Case (Property Search) ===\n")

    property_agent = PropertySearchAgent()

    result = property_agent.find_properties_near_work(
        work_location=[-122.4, 37.79],  # Downtown SF
        max_commute_minutes=30
    )

    print("\nResult:", result)


# ============================================================================
# Main
# ============================================================================

def main():
    """Run all examples."""
    try:
        # Recommended approach: Direct MCP connection
        example_with_mcp_client()

        print("\n\n")

        # Alternative: Custom tools for fine control
        example_with_custom_tools()

        print("\n\n")

        # Real-world use case
        example_real_world()

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
