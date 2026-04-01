# Smolagents Integration

**Use case:** Lightweight agents with geospatial capabilities (Hugging Face)

Smolagents is Hugging Face's simple, efficient agent framework. Perfect for deploying geospatial agents with minimal overhead.

```python
from smolagents import CodeAgent, Tool, HfApiModel
import requests
import os

class MapboxMCP:
    """Mapbox MCP connector."""

    def __init__(self, token: str = None):
        self.url = 'https://mcp.mapbox.com/mcp'
        token = token or os.getenv('MAPBOX_ACCESS_TOKEN')
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }

    def call_tool(self, tool_name: str, params: dict) -> str:
        request = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'tools/call',
            'params': {'name': tool_name, 'arguments': params}
        }
        response = requests.post(self.url, headers=self.headers, json=request)
        result = response.json()['result']
        return result['content'][0]['text']

# Create Mapbox tools for Smolagents
class DirectionsTool(Tool):
    name = "directions_tool"
    description = """
    Get driving directions between two locations.

    Args:
        origin: Origin coordinates as [longitude, latitude]
        destination: Destination coordinates as [longitude, latitude]

    Returns:
        Directions with distance and travel time
    """

    def __init__(self):
        super().__init__()
        self.mcp = MapboxMCP()

    def forward(self, origin: list, destination: list) -> str:
        return self.mcp.call_tool('directions_tool', {
            'coordinates': [
                {'longitude': origin[0], 'latitude': origin[1]},
                {'longitude': destination[0], 'latitude': destination[1]}
            ],
            'routing_profile': 'mapbox/driving-traffic'
        })

class CalculateDistanceTool(Tool):
    name = "distance_tool"
    description = """
    Calculate distance between two points (offline, instant).

    Args:
        from_coords: Start coordinates [longitude, latitude]
        to_coords: End coordinates [longitude, latitude]
        units: 'miles' or 'kilometers'

    Returns:
        Distance as a number
    """

    def __init__(self):
        super().__init__()
        self.mcp = MapboxMCP()

    def forward(self, from_coords: list, to_coords: list, units: str = 'miles') -> str:
        return self.mcp.call_tool('distance_tool', {
            'from': {'longitude': from_coords[0], 'latitude': from_coords[1]},
            'to': {'longitude': to_coords[0], 'latitude': to_coords[1]},
            'units': units
        })

class SearchPOITool(Tool):
    name = "search_poi"
    description = """
    Search for points of interest by category.

    Args:
        category: POI category (restaurant, hotel, gas_station, etc.)
        location: Search center [longitude, latitude]

    Returns:
        List of nearby POIs with names and coordinates
    """

    def __init__(self):
        super().__init__()
        self.mcp = MapboxMCP()

    def forward(self, category: str, location: list) -> str:
        return self.mcp.call_tool('category_search_tool', {
            'category': category,
            'proximity': {'longitude': location[0], 'latitude': location[1]}
        })

class IsochroneTool(Tool):
    name = "isochrone_tool"
    description = """
    Calculate reachable area within time limit (isochrone).

    Args:
        location: Center point [longitude, latitude]
        minutes: Time limit in minutes
        profile: 'mapbox/driving', 'mapbox/walking', or 'mapbox/cycling'

    Returns:
        GeoJSON polygon of reachable area
    """

    def __init__(self):
        super().__init__()
        self.mcp = MapboxMCP()

    def forward(self, location: list, minutes: int, profile: str = 'mapbox/driving') -> str:
        return self.mcp.call_tool('isochrone_tool', {
            'coordinates': {'longitude': location[0], 'latitude': location[1]},
            'contours_minutes': [minutes],
            'profile': profile
        })

# Create agent with Mapbox tools
model = HfApiModel()

agent = CodeAgent(
    tools=[
        DirectionsTool(),
        CalculateDistanceTool(),
        SearchPOITool(),
        IsochroneTool()
    ],
    model=model
)

# Use agent
result = agent.run(
    "Find restaurants within 10 minutes walking from Times Square NYC "
    "(coordinates: -73.9857, 40.7484). Calculate distances to each."
)

print(result)
```

**Real-world example - Property search agent:**

```python
class PropertySearchAgent:
    def __init__(self):
        self.mcp = MapboxMCP()

        # Create specialized tools
        tools = [
            IsochroneTool(),
            SearchPOITool(),
            CalculateDistanceTool()
        ]

        self.agent = CodeAgent(
            tools=tools,
            model=HfApiModel()
        )

    def find_properties_near_work(
        self,
        work_location: list,
        max_commute_minutes: int,
        property_locations: list[dict]
    ):
        """Find properties within commute time of work."""

        prompt = f"""
        I need to find properties within {max_commute_minutes} minutes
        driving of my work at {work_location}.

        Property locations to check:
        {property_locations}

        For each property:
        1. Calculate if it's within the commute time
        2. Find nearby amenities (grocery stores, restaurants)
        3. Calculate distances to key locations

        Return a ranked list of properties with commute time and nearby amenities.
        """

        return self.agent.run(prompt)

# Usage
property_agent = PropertySearchAgent()

properties = [
    {'id': 1, 'address': '123 Main St', 'coords': [-122.4194, 37.7749]},
    {'id': 2, 'address': '456 Oak Ave', 'coords': [-122.4094, 37.7849]},
]

results = property_agent.find_properties_near_work(
    work_location=[-122.4, 37.79],  # Downtown SF
    max_commute_minutes=30,
    property_locations=properties
)
```

**Benefits:**

- Lightweight and efficient
- Simple tool definition
- Code-based agent execution
- Great for production deployment
