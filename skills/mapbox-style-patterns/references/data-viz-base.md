# Pattern 3: Data Visualization Base Map

**Use case:** Choropleth maps, heatmaps, data overlays, analytics dashboards

**Visual requirements:**

- Minimal base map (data is the focus)
- Context without distraction
- Works with various data overlay colors
- High contrast optional for dark data

**Recommended layers:**

```json
{
  "layers": [
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#f0f0f0"
      }
    },
    {
      "id": "water",
      "type": "fill",
      "source": "mapbox-streets",
      "source-layer": "water",
      "paint": {
        "fill-color": "#d8d8d8",
        "fill-opacity": 0.5
      }
    },
    {
      "id": "admin-boundaries",
      "type": "line",
      "source": "mapbox-streets",
      "source-layer": "admin",
      "filter": ["in", "admin_level", 0, 1, 2],
      "paint": {
        "line-color": "#999999",
        "line-width": {
          "base": 1,
          "stops": [
            [0, 0.5],
            [10, 1],
            [15, 2]
          ]
        },
        "line-dasharray": [3, 2]
      }
    },
    {
      "id": "roads-major-simplified",
      "type": "line",
      "source": "mapbox-streets",
      "source-layer": "road",
      "filter": ["in", "class", "motorway", "primary"],
      "minzoom": 6,
      "paint": {
        "line-color": "#cccccc",
        "line-width": {
          "base": 1.2,
          "stops": [
            [6, 0.5],
            [10, 1],
            [15, 2]
          ]
        },
        "line-opacity": 0.5
      }
    },
    {
      "id": "place-labels-major",
      "type": "symbol",
      "source": "mapbox-streets",
      "source-layer": "place_label",
      "filter": ["in", "type", "city", "capital"],
      "layout": {
        "text-field": ["get", "name"],
        "text-size": {
          "base": 1,
          "stops": [
            [4, 10],
            [10, 14]
          ]
        },
        "text-font": ["Open Sans Semibold"]
      },
      "paint": {
        "text-color": "#666666",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2
      }
    }
  ]
}
```

**Key features:**

- Grayscale palette (doesn't interfere with data colors)
- Minimal detail (roads, borders only)
- Major cities labeled for orientation
- Low opacity throughout
- Perfect for overlay data
