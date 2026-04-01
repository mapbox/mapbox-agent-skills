# Performance, Combining Tools, and Troubleshooting

## Performance Optimization

### Minimize API Calls

**Pattern: Geocode once, reuse coordinates**

```
// GOOD
1. User enters "Seattle"
2. Geocode "Seattle" → (lng, lat)
3. Use those coordinates for multiple category searches
4. Cache coordinates for session

// BAD
1. Geocode "Seattle" for coffee search
2. Geocode "Seattle" again for restaurant search
3. Geocode "Seattle" again for hotel search
```

### Set Appropriate Limits

| UI Context            | Recommended Limit |
| --------------------- | ----------------- |
| Autocomplete dropdown | 5                 |
| List view             | 10                |
| Map view              | 25                |
| Export/download       | 25 (or paginate)  |

### Use Offline Tools When Possible

**After getting search results:**

```
1. category_search_tool → Get POIs
2. distance_tool (offline) → Calculate distances
3. bearing_tool (offline) → Get directions
```

**Why:** Search once (API), then use offline tools for calculations (free, fast)

## Combining Search with Other Tools

### Search → Distance Calculation

```
1. category_search_tool({category: "hospital", proximity: user_location})
   → Returns 10 hospitals with coordinates
2. distance_tool(user_location, each_hospital)
   → Calculate exact distances offline
3. Sort by distance
```

### Search → Directions

```
1. search_and_geocode_tool({q: "Space Needle"})
   → Get destination coordinates
2. directions_tool({from: user_location, to: space_needle_coords})
   → Get turn-by-turn directions
```

### Search → Isochrone → Containment Check

```
1. search_and_geocode_tool({q: "warehouse"})
   → Get warehouse coordinates
2. isochrone_tool({coordinates: warehouse, time: 30, profile: "driving"})
   → Get 30-minute delivery zone polygon
3. point_in_polygon_tool(customer_address, delivery_zone)
   → Check if customer is in delivery zone
```

### Search → Static Map Visualization

```
1. category_search_tool({category: "restaurant", limit: 10})
   → Get restaurant coordinates
2. static_map_image_tool({
     markers: restaurant_coordinates,
     auto_fit: true
   })
   → Create map image showing all restaurants
```

## Handling No Results

### If category_search returns no results:

**Possible reasons:**

1. Invalid category → Use `resource_reader_tool` with `mapbox://categories` to see valid categories
2. Too restrictive bbox → Expand area or use proximity instead
3. No POIs in area → Try broader category or remove spatial filters
4. Wrong country filter → Check country codes

**Example recovery:**

```
1. category_search_tool({category: "taco"}) → No results
2. Check: Is "taco" a valid category?
   → Use category_list_tool → See "mexican_restaurant" is valid
3. Retry: category_search_tool({category: "mexican_restaurant"}) → Success
```

### If search_and_geocode returns no results:

**Possible reasons:**

1. Typo in query → Retry with `auto_complete: true`
2. Too specific → Broaden search (remove address numbers, try nearby city)
3. Wrong types filter → Remove or expand types
4. Not a recognized place → Check spelling, try alternative names

## Category List Resource

**Get valid categories:** Use `resource_reader_tool` or `category_list_tool`

```
resource_reader_tool({uri: "mapbox://categories"})
```

**Returns:** All valid category IDs (e.g., "restaurant", "hotel", "gas_station")

**When to use:**

- User enters free-text category
- Need to map user terms to Mapbox categories
- Validating category before search

**Example mapping:**

- User: "places to eat" → Category: "restaurant"
- User: "gas" → Category: "gas_station"
- User: "lodging" → Category: "hotel"

## Integration with Other Skills

**Works with:**

- **mapbox-geospatial-operations**: After search, use offline distance/bearing calculations
- **mapbox-web-integration-patterns**: Display search results on map in web app
- **mapbox-token-security**: Ensure search requests use properly scoped tokens

## Resources

- [Mapbox Search Box API Docs](https://docs.mapbox.com/api/search/search-box/)
- [Category Search API](https://docs.mapbox.com/api/search/search-box/#category-search)
- [Geocoding API](https://docs.mapbox.com/api/search/geocoding/)
- [Category List Resource](https://docs.mapbox.com/api/search/search-box/#category-list)
