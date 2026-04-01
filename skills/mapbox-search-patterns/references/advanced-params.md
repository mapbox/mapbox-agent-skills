# Advanced Parameters Reference

## poi_category Parameter

**search_and_geocode_tool:** Narrow generic searches

```json
{
  "q": "lunch",
  "poi_category": ["restaurant", "cafe"],
  "proximity": { "longitude": -122.4194, "latitude": 37.7749 }
}
```

**When to use:**

- Generic query that could match multiple categories
- Want to focus search within category
- User specifies type implicitly

**category_search_tool:** Use `poi_category_exclusions` instead

```json
{
  "category": "food_and_drink",
  "poi_category_exclusions": ["bar", "nightclub"]
}
```

**When to use:**

- Broad category but want to exclude subcategories
- "Restaurants but not fast food"

## ETA Parameters (search_and_geocode_tool)

**Request estimated time of arrival to results**

**Parameters:**

- `eta_type`: Set to `"navigation"`
- `navigation_profile`: `"driving"` | `"walking"` | `"cycling"`
- `origin`: Starting coordinates

**Use when:**

- User asks "how long to get there?"
- Sorting by travel time, not distance
- Need route time, not straight-line distance

**Example:**

```json
{
  "q": "grocery stores",
  "proximity": { "longitude": -122.4194, "latitude": 37.7749 },
  "eta_type": "navigation",
  "navigation_profile": "driving",
  "origin": { "longitude": -122.4194, "latitude": 37.7749 }
}
```

**Returns:** Results with `eta` (travel time in seconds)

**Warning:** Requires routing calculation per result (counts toward API quota)

**When NOT to use:**

- Just need straight-line distance (use distance_tool offline after search)
- Budget-conscious (adds API cost)

## format Parameter (category_search_tool)

**Choose output format:**

| Format                     | Returns                | Use When                      |
| -------------------------- | ---------------------- | ----------------------------- |
| `formatted_text` (default) | Human-readable text    | Displaying to user directly   |
| `json_string`              | GeoJSON as JSON string | Need to parse/process results |

**Example:**

**formatted_text:**

```
1. Blue Bottle Coffee
   Address: 66 Mint St, San Francisco, CA
   Coordinates: 37.7825, -122.4052
   Type: poi
```

**json_string:**

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {"type": "Point", "coordinates": [-122.4052, 37.7825]},
    "properties": {"name": "Blue Bottle Coffee", ...}
  }]
}
```

**Decision:**

- Showing list to user -> `formatted_text`
- Plotting on map -> `json_string` (parse and use coordinates)
- Further processing -> `json_string`

## language Parameter

**ISO language codes** (e.g., "en", "es", "fr", "de", "ja", "zh")

**Use when:**

- Building multilingual app
- User's language preference known
- Need localized names

**Example:**

```json
{
  "q": "東京タワー",
  "language": "ja"
}
// Returns results in Japanese
```

**Default:** English (if not specified)

**Tip:** Match user's locale for best experience
