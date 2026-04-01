# Common Patterns and Workflows

## Pattern 1: "Near Me" Search

**User:** "Find coffee shops near me"

**Optimal approach:**

```
1. Get user's location (from app/browser)
2. Use category_search_tool:
   - category: "coffee_shop"
   - proximity: user's coordinates
   - limit: 10
```

**Why:** Category tool for generic "coffee shops", proximity for "near me"

## Pattern 2: Branded Chain Lookup

**User:** "Find all Starbucks in Seattle"

**Optimal approach:**

```
1. Use search_and_geocode_tool:
   - q: "Starbucks"
   - proximity: Seattle coordinates
   - country: ["US"]
2. Or if need strict boundary:
   - bbox: Seattle city bounds
```

**Why:** Brand name = search_and_geocode_tool; proximity biases to Seattle

## Pattern 3: Address Geocoding

**User:** "What are the coordinates of 1600 Pennsylvania Ave?"

**Optimal approach:**

```
Use search_and_geocode_tool:
- q: "1600 Pennsylvania Ave, Washington DC"
- types: ["address"]  // Focus on addresses
- country: ["US"]     // Narrow to US
```

**Why:** Specific address with country context for disambiguation

## Pattern 4: Category Search with Area Restriction

**User:** "Show me all hotels in downtown Portland"

**Optimal approach:**

```
1. Geocode "downtown Portland" → get center point
2. Define downtown bbox (or use 1-2 mile radius)
3. Use category_search_tool:
   - category: "hotel"
   - bbox: downtown bounds (or proximity + filter by distance)
   - limit: 25  // Get comprehensive list
```

**Why:** Category for "hotels", bbox for "in downtown" hard boundary

## Pattern 5: Reverse Geocoding

**User:** "What's at these GPS coordinates?"

**Optimal approach:**

```
Use reverse_geocode_tool:
- longitude: -122.4194
- latitude: 37.7749
- types: ["address"]  // Get address (can also use place, locality, postcode, etc.)
```

**Why:** Coordinates → address is exactly what reverse geocoding does

## Pattern 6: Route-Based Search

**User:** "Find gas stations along my route"

**Optimal approach:**

```
1. Get route geometry from directions_tool
2. Create bbox around route (use bounding_box_tool)
3. Use category_search_tool:
   - category: "gas_station"
   - bbox: route bounding box
4. Filter results to those within X meters of route (use distance_tool)
```

**Why:** Bbox for rough filter, then distance calculation for precision

## Pattern 7: Multilingual POI Search

**User:** "Find ramen shops" (user locale: ja)

**Optimal approach:**

```
Use category_search_tool:
- category: "ramen_restaurant" (or "restaurant")
- language: "ja"
- proximity: user location
```

**Why:** Returns Japanese names/addresses for better UX
