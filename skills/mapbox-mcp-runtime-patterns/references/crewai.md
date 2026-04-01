# CrewAI Integration

**Use case:** Multi-agent orchestration with geospatial capabilities

CrewAI enables building autonomous agent crews with specialized roles. Integration with Mapbox MCP adds geospatial intelligence to your crew.

```python
from crewai import Agent, Task, Crew
from crewai.tools import BaseTool
import requests
import os
from typing import Type
from pydantic import BaseModel, Field

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
        response.raise_for_status()
        data = response.json()

        if 'error' in data:
            raise RuntimeError(f"MCP error: {data['error']['message']}")

        return data['result']['content'][0]['text']

# Create Mapbox tools for CrewAI
class DirectionsTool(BaseTool):
    name: str = "directions_tool"
    description: str = "Get driving directions between two locations"

    class InputSchema(BaseModel):
        origin: list = Field(description="Origin [lng, lat]")
        destination: list = Field(description="Destination [lng, lat]")

    args_schema: Type[BaseModel] = InputSchema

    def __init__(self):
        super().__init__()
        self.mcp = MapboxMCP()

    def _run(self, origin: list, destination: list) -> str:
        result = self.mcp.call_tool('directions_tool', {
            'coordinates': [
                {'longitude': origin[0], 'latitude': origin[1]},
                {'longitude': destination[0], 'latitude': destination[1]}
            ],
            'routing_profile': 'mapbox/driving-traffic'
        })
        return f"Directions: {result}"

class GeocodeTool(BaseTool):
    name: str = "reverse_geocode_tool"
    description: str = "Convert coordinates to human-readable address"

    class InputSchema(BaseModel):
        coordinates: list = Field(description="Coordinates [lng, lat]")

    args_schema: Type[BaseModel] = InputSchema

    def __init__(self):
        super().__init__()
        self.mcp = MapboxMCP()

    def _run(self, coordinates: list) -> str:
        result = self.mcp.call_tool('reverse_geocode_tool', {
            'coordinates': {'longitude': coordinates[0], 'latitude': coordinates[1]}
        })
        return result

class SearchPOITool(BaseTool):
    name: str = "search_poi"
    description: str = "Find points of interest by category near a location"

    class InputSchema(BaseModel):
        category: str = Field(description="POI category (restaurant, hotel, etc.)")
        location: list = Field(description="Search center [lng, lat]")

    args_schema: Type[BaseModel] = InputSchema

    def __init__(self):
        super().__init__()
        self.mcp = MapboxMCP()

    def _run(self, category: str, location: list) -> str:
        result = self.mcp.call_tool('category_search_tool', {
            'category': category,
            'proximity': {'longitude': location[0], 'latitude': location[1]}
        })
        return result

# Create specialized agents with geospatial tools
location_analyst = Agent(
    role='Location Analyst',
    goal='Analyze geographic locations and provide insights',
    backstory="""Expert in geographic analysis and location intelligence.

    Use search_poi for finding types of places (restaurants, hotels).
    Use reverse_geocode_tool for converting coordinates to addresses.""",
    tools=[GeocodeTool(), SearchPOITool()],
    verbose=True
)

route_planner = Agent(
    role='Route Planner',
    goal='Plan optimal routes and provide travel time estimates',
    backstory="""Experienced logistics coordinator specializing in route optimization.

    Use directions_tool for route distance along roads with traffic.
    Always use when traffic-aware travel time is needed.""",
    tools=[DirectionsTool()],
    verbose=True
)

# Create tasks
find_restaurants_task = Task(
    description="""
    Find the top 5 restaurants near coordinates [-73.9857, 40.7484] (Times Square).
    Provide their names and approximate distances.
    """,
    agent=location_analyst,
    expected_output="List of 5 restaurants with distances"
)

plan_route_task = Task(
    description="""
    Plan a route from [-74.0060, 40.7128] (downtown NYC) to [-73.9857, 40.7484] (Times Square).
    Provide driving time considering current traffic.
    """,
    agent=route_planner,
    expected_output="Route with estimated driving time"
)

# Create and run crew
crew = Crew(
    agents=[location_analyst, route_planner],
    tasks=[find_restaurants_task, plan_route_task],
    verbose=True
)

result = crew.kickoff()
print(result)
```

**Real-world example - Restaurant finder crew:**

```python
# Define crew for restaurant recommendation system
class RestaurantCrew:
    def __init__(self):
        self.mcp = MapboxMCP()

        # Location specialist agent
        self.location_agent = Agent(
            role='Location Specialist',
            goal='Find and analyze restaurant locations',
            tools=[SearchPOITool(), GeocodeTool()],
            backstory='Expert in finding the best dining locations'
        )

        # Logistics agent
        self.logistics_agent = Agent(
            role='Logistics Coordinator',
            goal='Calculate travel times and optimal routes',
            tools=[DirectionsTool()],
            backstory='Specialist in urban navigation and time optimization'
        )

    def find_restaurants_with_commute(self, user_location: list, max_minutes: int):
        # Task 1: Find nearby restaurants
        search_task = Task(
            description=f"Find restaurants near {user_location}",
            agent=self.location_agent,
            expected_output="List of restaurants with coordinates"
        )

        # Task 2: Calculate travel times
        route_task = Task(
            description=f"Calculate travel time to each restaurant from {user_location}",
            agent=self.logistics_agent,
            expected_output="Travel times to each restaurant",
            context=[search_task]  # Depends on search results
        )

        crew = Crew(
            agents=[self.location_agent, self.logistics_agent],
            tasks=[search_task, route_task],
            verbose=True
        )

        return crew.kickoff()

# Usage
restaurant_crew = RestaurantCrew()
results = restaurant_crew.find_restaurants_with_commute(
    user_location=[-73.9857, 40.7484],
    max_minutes=15
)
```

**Benefits:**

- Multi-agent orchestration with geospatial tools
- Task dependencies and context passing
- Role-based agent specialization
- Autonomous crew execution
