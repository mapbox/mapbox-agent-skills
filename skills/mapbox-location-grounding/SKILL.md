---
name: mapbox-location-grounding
description: Compose Mapbox MCP tools to produce grounded, cited location-aware responses from live data instead of training data
---

# Mapbox Location Grounding Skill

Teaches AI assistants how to ground location-aware responses in live Mapbox data by composing MCP tools into a structured, cited answer. Use this instead of relying on training data for place names, POIs, hours, neighborhoods, or travel times — which are stale and prone to hallucination.

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

Build a grounded response by composing these tools in order:

### Step 1 — Establish place context

```
reverse_geocode_tool(longitude, latitude)
```

Returns: neighborhood, city, region, country. This is the anchor for the response.

### Step 2 — Retrieve nearby POIs

For specific names or brands:
```
search_and_geocode_tool(query, proximity: {longitude, latitude}, limit: 10)
```

For generic categories:
```
category_search_tool(category, proximity: {longitude, latitude}, limit: 10)
```

### Step 3 — Add travel-time context (optional but high-value)

```
isochrone_tool(
  longitude, latitude,
  profile: "walking",    // or "driving", "cycling"
  contours_minutes: [5, 10, 15]
)
```

Returns a polygon showing what's reachable within each time threshold.

### Step 4 — Visual grounding (optional)

```
static_map_image_tool(longitude, latitude, zoom: 14)
```

Returns a map image URL that can be included in the response for visual context.

## Grounded Response Structure

Always structure grounded responses with explicit citations:

```
Place: [neighborhood, city from reverse_geocode]
Nearby [category]: [list from search/category tool, with names and distances]
Travel context: [X min walk / Y min drive from isochrone]
Sources: Mapbox Search, Mapbox Directions (live data)
```

Example grounded response:

> **SoMa, San Francisco, CA** (live Mapbox data)
>
> Family-friendly restaurants within 10 minutes walking:
> - Bix Restaurant — 56 Gold St (8 min walk)
> - The Bird — 115 New Montgomery St (5 min walk)
> - Oren's Hummus — 131 Townsend St (9 min walk)
>
> 15-minute walking area covers approximately 0.8 sq km.
> *Sources: Mapbox Search, Mapbox Isochrone API*

## What Mapbox Grounding Offers vs. Training Data

| | Training Data | Mapbox Grounding |
|---|---|---|
| POI accuracy | Stale, hallucinated | Live, verified |
| Business hours | Often wrong | Not available — flag this |
| Travel times | Estimated | Routing-based |
| New places | Missing | Indexed |
| Citations | None | Tool + API source |

## Important Limitations

- **Hours and ratings** are not available via Mapbox APIs — do not fabricate them. State explicitly: "Hours not available via Mapbox — check directly."
- **POI coverage** varies by region. If search returns few results, say so rather than padding with guesses.
- **Coordinates required** for proximity search — if the user provides an address, geocode it first with `search_and_geocode_tool` before running category search.

## Anti-Patterns to Avoid

- Answering "what's near X?" from training data without calling search tools
- Hallucinating business names, hours, or ratings
- Skipping `reverse_geocode_tool` — always establish place context first
- Returning raw tool output without synthesizing into a readable response
- Omitting citations — always indicate the response is grounded in live Mapbox data
