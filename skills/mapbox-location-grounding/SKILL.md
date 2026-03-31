---
name: mapbox-location-grounding
description: Compose Mapbox MCP tools to produce grounded, cited location-aware responses from live data instead of training data
---

# Mapbox Location Grounding Skill

Teaches AI assistants how to ground location-aware responses in live Mapbox data by composing MCP tools into a structured, cited answer. Use this instead of relying on training data for place names, POIs, ratings, or travel times — which are stale and prone to hallucination.

## When to Use Grounding

Ground responses when the user asks about:

- "What's near [location]?" or "What's around [coordinate]?"
- "Describe this neighborhood / area"
- "Find [category] within walking/driving distance"
- "What can I do near [address]?"
- Real estate, travel, mobility, or local discovery use cases
- Any question where place accuracy and recency matter

**Never answer location questions from training data alone.** Always retrieve live data.

## Grounding Tool Composition

### Preferred: single tool call

If `ground_location_tool` is available, use it — it handles reverse geocoding, POI search, place details enrichment, isochrone, and a static map image in one call:

```
ground_location_tool(
  longitude, latitude,
  query: "restaurant",   // optional — category or subcategory of nearby places to find
  profile: "walking",    // optional — travel profile for isochrone
  contours_minutes: [5, 10, 15]
)
```

Returns:

- Neighborhood/place name from reverse geocoding
- Nearby POIs with distances, ratings, price levels, and popularity (when available)
- Travel-time reachability from isochrone
- A static map image for visual context
- Citations for all data sources

Do not call `reverse_geocode_tool`, `category_search_tool`, `place_details_tool`, or `isochrone_tool` separately — they are already composed inside this tool.

### Query parameter

The `query` parameter accepts **category or subcategory terms** — not attribute preferences:

- Supported: `"restaurant"`, `"coffee"`, `"park"`, `"Italian restaurant"`, `"EV charging station"`
- Not supported: `"family-friendly"`, `"fast charging"`, `"outdoor seating"` — these are not filterable attributes in Mapbox data

To help users find places matching a preference (e.g. "family-friendly"), search by category (`"restaurant"`) and use the returned rating and price data to inform the recommendation.

### Fallback: manual composition

If `ground_location_tool` is not available, build the grounded response by composing these tools in order:

#### Step 1 — Establish place context

```
reverse_geocode_tool(longitude, latitude, types: "neighborhood,locality,place")
```

Returns: neighborhood, city, region, country. This is the anchor for the response.

#### Step 2 — Retrieve nearby POIs

For specific names or brands:

```
search_and_geocode_tool(query, proximity: {longitude, latitude}, limit: 10)
```

For generic categories:

```
category_search_tool(category, proximity: {longitude, latitude}, limit: 10)
```

#### Step 3 — Enrich POIs with ratings and price (optional but high-value)

For each POI with a `mapbox_id`, call in parallel:

```
place_details_tool(mapbox_id, attribute_sets: ["visit"])
```

Returns: rating, price level, popularity, and opening hours per place.

#### Step 4 — Add travel-time context (optional but high-value)

```
isochrone_tool(
  coordinates: {longitude, latitude},
  profile: "mapbox/walking",    // or "mapbox/driving", "mapbox/cycling", "mapbox/driving-traffic"
  contours_minutes: [5, 10, 15]
)
```

Returns a polygon showing what's reachable within each time threshold.

#### Step 5 — Visual grounding (optional)

```
static_map_image_tool(longitude, latitude, zoom: 14)
```

Returns a map image that can be included in the response for visual context.

## Grounded Response Structure

Always structure grounded responses with explicit citations:

```
Place: [neighborhood, city from reverse_geocode]
Nearby [category]: [list from search/category tool, with names, ratings, prices, and distances]
Travel context: [X min walk / Y min drive from isochrone]
Sources: Mapbox Search, Mapbox Directions (live data)
```

Example grounded response:

> **SoMa, San Francisco, CA** (live Mapbox data)
>
> Restaurants within walking distance:
>
> - Bix Restaurant $$ ★8.4 — 56 Gold St (180m)
> - The Bird $ ★7.9 — 115 New Montgomery St (320m)
> - Oren's Hummus $$ ★8.1 — 131 Townsend St (510m)
>
> Reachable by walking: 5 min, 10 min, 15 min
>
> _Sources: Mapbox Geocoding API, Mapbox Search API, Mapbox Place Details API, Mapbox Isochrone API, Mapbox Static Images API_

## What Mapbox Grounding Offers vs. Training Data

|                | Training Data       | Mapbox Grounding       |
| -------------- | ------------------- | ---------------------- |
| POI accuracy   | Stale, hallucinated | Live, verified         |
| Ratings/price  | Often wrong         | Live via Place Details |
| Business hours | Often wrong         | Live via Place Details |
| Travel times   | Estimated           | Routing-based          |
| New places     | Missing             | Indexed                |
| Map image      | None                | Inline static map      |
| Citations      | None                | Tool + API source      |

## Important Limitations

- **Attribute filtering** (family-friendly, outdoor seating, fast charging) is not supported by the category search API. Use category terms and let rating/price data inform preference-based recommendations.
- **POI coverage** varies by region. If search returns few results, say so rather than padding with guesses.
- **Coordinates required** for proximity search — if the user provides an address, geocode it first with `search_and_geocode_tool` before running category search.

## Anti-Patterns to Avoid

- Answering "what's near X?" from training data without calling search tools
- Hallucinating business names, hours, or ratings
- Calling `reverse_geocode_tool` + `category_search_tool` + `place_details_tool` separately when `ground_location_tool` is available
- Using attribute terms like "family-friendly" as the query parameter — use the category instead
- Returning raw tool output without synthesizing into a readable response
- Omitting citations — always indicate the response is grounded in live Mapbox data
