# Pattern 4: Navigation/Routing Map

**Use case:** Turn-by-turn directions, route planning, delivery apps

**Visual requirements:**

- Route highly visible
- Current location always clear
- Turn points obvious
- Street names readable
- Performance optimized

**Recommended layers:**

```json
{
  "layers": [
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#ffffff"
      }
    },
    {
      "id": "water",
      "type": "fill",
      "source": "mapbox-streets",
      "source-layer": "water",
      "paint": {
        "fill-color": "#a8d8ea"
      }
    },
    {
      "id": "landuse",
      "type": "fill",
      "source": "mapbox-streets",
      "source-layer": "landuse",
      "paint": {
        "fill-color": [
          "match",
          ["get", "class"],
          "park",
          "#d4edda",
          "hospital",
          "#f8d7da",
          "school",
          "#fff3cd",
          "#e9ecef"
        ],
        "fill-opacity": 0.5
      }
    },
    {
      "id": "roads-background",
      "type": "line",
      "source": "mapbox-streets",
      "source-layer": "road",
      "paint": {
        "line-color": "#333333",
        "line-width": {
          "base": 1.5,
          "stops": [
            [10, 2],
            [15, 8],
            [18, 20]
          ]
        },
        "line-opacity": 0.3
      }
    },
    {
      "id": "roads-foreground",
      "type": "line",
      "source": "mapbox-streets",
      "source-layer": "road",
      "paint": {
        "line-color": "#ffffff",
        "line-width": {
          "base": 1.5,
          "stops": [
            [10, 1],
            [15, 6],
            [18, 16]
          ]
        }
      }
    },
    {
      "id": "route-casing",
      "type": "line",
      "source": "route",
      "paint": {
        "line-color": "#0d47a1",
        "line-width": {
          "base": 1.5,
          "stops": [
            [10, 8],
            [15, 16],
            [18, 32]
          ]
        },
        "line-opacity": 0.4
      }
    },
    {
      "id": "route-line",
      "type": "line",
      "source": "route",
      "paint": {
        "line-color": "#2196f3",
        "line-width": {
          "base": 1.5,
          "stops": [
            [10, 6],
            [15, 12],
            [18, 24]
          ]
        }
      }
    },
    {
      "id": "user-location",
      "type": "circle",
      "source": "user-location",
      "paint": {
        "circle-radius": 8,
        "circle-color": "#2196f3",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 3
      }
    },
    {
      "id": "user-location-pulse",
      "type": "circle",
      "source": "user-location",
      "paint": {
        "circle-radius": {
          "base": 1,
          "stops": [
            [0, 16],
            [1, 24]
          ]
        },
        "circle-color": "#2196f3",
        "circle-opacity": {
          "base": 1,
          "stops": [
            [0, 0.4],
            [1, 0]
          ]
        }
      }
    },
    {
      "id": "turn-arrows",
      "type": "symbol",
      "source": "route-maneuvers",
      "layout": {
        "icon-image": ["get", "arrow-type"],
        "icon-size": 1.5,
        "icon-rotation-alignment": "map",
        "icon-rotate": ["get", "bearing"]
      }
    }
  ]
}
```

**Key features:**

- Thick, high-contrast route (blue on white)
- Pulsing user location indicator
- Turn arrows at maneuver points
- Simplified background (focus on route)
- Color-coded land use for context
