"""
CrewAI + Mapbox MCP Integration Example

This example shows how to integrate Mapbox MCP Server with CrewAI multi-agent systems.

Prerequisites:
- pip install crewai requests openai python-dotenv
- Set MAPBOX_ACCESS_TOKEN and OPENAI_API_KEY environment variables

Usage:
- python crewai_example.py
"""

import os
import json
import requests
from typing import Type
from pydantic import BaseModel, Field
from crewai import Agent, Task, Crew
from crewai.tools import BaseTool
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


# Create Mapbox tools for CrewAI

class DirectionsInput(BaseModel):
    """Input schema for directions tool."""
    origin: list = Field(..., description="Origin coordinates [longitude, latitude]")
    destination: list = Field(..., description="Destination coordinates [longitude, latitude]")


class DirectionsTool(BaseTool):
    name: str = "get_directions"
    description: str = "Get turn-by-turn driving directions with traffic-aware route distance and travel time along roads. Use when you need the actual driving route or traffic-aware duration. Returns duration and distance."
    args_schema: Type[BaseModel] = DirectionsInput

    def _run(self, origin: list, destination: list) -> str:
        result = mcp.call_tool('get_directions', {
            'origin': origin,
            'destination': destination,
            'profile': 'driving-traffic'
        })
        return f"Directions: {result}"


class SearchPOIInput(BaseModel):
    """Input schema for POI search tool."""
    category: str = Field(..., description="POI category (restaurant, hotel, coffee, etc.)")
    location: list = Field(..., description="Search center [longitude, latitude]")


class SearchPOITool(BaseTool):
    name: str = "search_poi"
    description: str = "Find ALL places of a specific category type near a location. Use when user wants to browse places by type (restaurants, hotels, coffee, etc.), not search for a specific named place. Returns names and addresses."
    args_schema: Type[BaseModel] = SearchPOIInput

    def _run(self, category: str, location: list) -> str:
        result = mcp.call_tool('category_search', {
            'category': category,
            'proximity': location
        })
        return result


class CalculateDistanceInput(BaseModel):
    """Input schema for distance calculation tool."""
    from_coords: list = Field(..., description="Start coordinates [longitude, latitude]")
    to_coords: list = Field(..., description="End coordinates [longitude, latitude]")
    units: str = Field('miles', description="Units: 'miles' or 'kilometers'")


class CalculateDistanceTool(BaseTool):
    name: str = "calculate_distance"
    description: str = "Calculate straight-line (great-circle) distance between two points. Use for quick 'as the crow flies' distance checks. Works offline, instant, no API cost."
    args_schema: Type[BaseModel] = CalculateDistanceInput

    def _run(self, from_coords: list, to_coords: list, units: str = 'miles') -> str:
        result = mcp.call_tool('calculate_distance', {
            'from': from_coords,
            'to': to_coords,
            'units': units
        })
        return f"{result} {units}"


class IsochroneInput(BaseModel):
    """Input schema for isochrone tool."""
    location: list = Field(..., description="Center point [longitude, latitude]")
    minutes: int = Field(..., description="Time limit in minutes")
    profile: str = Field('driving', description="Travel mode: driving, walking, or cycling")


class IsochroneTool(BaseTool):
    name: str = "get_isochrone"
    description: str = "Calculate the AREA reachable within a time limit from a starting point. Use for 'What can I reach in X minutes?' questions or service area analysis. Returns GeoJSON polygon of reachable area."
    args_schema: Type[BaseModel] = IsochroneInput

    def _run(self, location: list, minutes: int, profile: str = 'driving') -> str:
        result = mcp.call_tool('get_isochrone', {
            'coordinates': location,
            'contours_minutes': [minutes],
            'profile': profile
        })
        return result


# Create specialized agents with geospatial tools

location_analyst = Agent(
    role='Location Intelligence Analyst',
    goal='Analyze geographic locations and find the best places for users',
    backstory="""Expert in geographic analysis with years of experience finding optimal locations.

    TOOL SELECTION: Use search_poi for finding types of places (restaurants, hotels),
    calculate_distance for straight-line distance checks, and get_isochrone for
    'what can I reach in X minutes' questions. Prefer offline tools when real-time data not needed.""",
    tools=[SearchPOITool(), CalculateDistanceTool(), IsochroneTool()],
    verbose=True
)

route_planner = Agent(
    role='Route Planning Specialist',
    goal='Plan optimal routes and provide accurate travel time estimates',
    backstory="""Experienced logistics coordinator specializing in route optimization and traffic analysis.

    TOOL SELECTION: Use get_directions for route distance along roads with traffic,
    calculate_distance for straight-line distance. Always use get_directions when
    traffic-aware travel time is needed.""",
    tools=[DirectionsTool(), CalculateDistanceTool()],
    verbose=True
)


def example_restaurant_finder():
    """Example: Find restaurants near a location."""
    print("\n=== Example 1: Restaurant Finder Crew ===\n")

    # Define tasks
    find_restaurants = Task(
        description="""
        Find 5 restaurants near Times Square NYC (coordinates: -73.9857, 40.7484).
        Get their names, addresses, and coordinates.
        """,
        agent=location_analyst,
        expected_output="List of 5 restaurants with names and locations"
    )

    calculate_routes = Task(
        description="""
        For each restaurant found, calculate the driving time from downtown NYC
        (coordinates: -74.0060, 40.7128) with current traffic.
        Rank the restaurants by travel time.
        """,
        agent=route_planner,
        expected_output="Restaurants ranked by travel time with durations",
        context=[find_restaurants]  # Depends on previous task
    )

    # Create and run crew
    crew = Crew(
        agents=[location_analyst, route_planner],
        tasks=[find_restaurants, calculate_routes],
        verbose=True
    )

    result = crew.kickoff()
    print("\nCrew Result:")
    print(result)


def example_property_search():
    """Example: Find properties with good commute."""
    print("\n=== Example 2: Property Search with Commute Analysis ===\n")

    # Define property search task
    analyze_commute = Task(
        description="""
        I'm looking for apartments in San Francisco. My work is at -122.4, 37.79.

        1. Calculate the area I can reach within 30 minutes driving from work
        2. Find coffee shops within 10 minutes walking from work
        3. Recommend neighborhoods that are within the commute area and have coffee shops nearby
        """,
        agent=location_analyst,
        expected_output="Recommended neighborhoods with commute times and nearby amenities"
    )

    # Create and run crew
    crew = Crew(
        agents=[location_analyst],
        tasks=[analyze_commute],
        verbose=True
    )

    result = crew.kickoff()
    print("\nCrew Result:")
    print(result)


def main():
    """Run all examples."""
    try:
        # Example 1: Restaurant finder with multi-agent crew
        example_restaurant_finder()

        print("\n" + "="*60 + "\n")

        # Example 2: Property search with commute analysis
        example_property_search()

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
