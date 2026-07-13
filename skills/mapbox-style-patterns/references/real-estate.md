# Pattern 2: Real Estate Map

**Use case:** Property search, neighborhood exploration, real estate listings

**Visual requirements:**

- Property boundaries clear
- Neighborhood context visible
- Amenities highlighted (schools, parks, transit)
- Price/property data display

**Recommended layers:**

```json
{
  "layers": [
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#fafafa"
      }
    },
    {
      "id": "parks-green-spaces",
      "type": "fill",
      "source": "mapbox-streets",
      "source-layer": "landuse",
      "filter": ["in", "class", "park", "pitch", "playground"],
      "paint": {
        "fill-color": "#7cb342",
        "fill-opacity": 0.3
      }
    },
    {
      "id": "water",
      "type": "fill",
      "source": "mapbox-streets",
      "source-layer": "water",
      "paint": {
        "fill-color": "#42a5f5",
        "fill-opacity": 0.4
      }
    },
    {
      "id": "roads",
      "type": "line",
      "source": "mapbox-streets",
      "source-layer": "road",
      "paint": {
        "line-color": "#e0e0e0",
        "line-width": {
          "base": 1.2,
          "stops": [
            [10, 0.5],
            [15, 2],
            [18, 6]
          ]
        }
      }
    },
    {
      "id": "property-boundaries",
      "type": "line",
      "source": "properties",
      "paint": {
        "line-color": "#7e57c2",
        "line-width": 2,
        "line-opacity": 0.8
      }
    },
    {
      "id": "property-fills",
      "type": "fill",
      "source": "properties",
      "paint": {
        "fill-color": [
          "interpolate",
          ["linear"],
          ["get", "price"],
          200000,
          "#4caf50",
          500000,
          "#ffc107",
          1000000,
          "#f44336"
        ],
        "fill-opacity": 0.3
      }
    },
    {
      "id": "school-icons",
      "type": "symbol",
      "source": "composite",
      "source-layer": "poi_label",
      "filter": ["==", "class", "school"],
      "layout": {
        "icon-image": "school-15",
        "icon-size": 1.2
      },
      "paint": {
        "icon-opacity": 0.8
      }
    },
    {
      "id": "transit-stops",
      "type": "circle",
      "source": "transit",
      "paint": {
        "circle-radius": 6,
        "circle-color": "#2196f3",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2
      }
    }
  ]
}
```

**Key features:**

- Properties color-coded by price (green->yellow->red)
- Parks prominently visible (important for home buyers)
- Schools and transit clearly marked
- Property boundaries visible
- Clean, professional aesthetic
