# Pattern 5: Dark Mode / Night Theme

**Use case:** Reduced eye strain, night use, modern aesthetic, battery saving (OLED)

**Visual requirements:**

- Dark background
- Reduced brightness
- Maintained contrast
- Readable text
- Comfortable viewing

**Recommended layers:**

```json
{
  "layers": [
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#0a0a0a"
      }
    },
    {
      "id": "water",
      "type": "fill",
      "source": "mapbox-streets",
      "source-layer": "water",
      "paint": {
        "fill-color": "#1a237e",
        "fill-opacity": 0.5
      }
    },
    {
      "id": "parks",
      "type": "fill",
      "source": "mapbox-streets",
      "source-layer": "landuse",
      "filter": ["==", "class", "park"],
      "paint": {
        "fill-color": "#1b5e20",
        "fill-opacity": 0.4
      }
    },
    {
      "id": "buildings",
      "type": "fill",
      "source": "mapbox-streets",
      "source-layer": "building",
      "paint": {
        "fill-color": "#1a1a1a",
        "fill-opacity": 0.8,
        "fill-outline-color": "#2a2a2a"
      }
    },
    {
      "id": "roads-minor",
      "type": "line",
      "source": "mapbox-streets",
      "source-layer": "road",
      "filter": ["in", "class", "street", "street_limited"],
      "paint": {
        "line-color": "#2a2a2a",
        "line-width": {
          "base": 1.5,
          "stops": [
            [12, 0.5],
            [15, 2],
            [18, 6]
          ]
        }
      }
    },
    {
      "id": "roads-major",
      "type": "line",
      "source": "mapbox-streets",
      "source-layer": "road",
      "filter": ["in", "class", "primary", "secondary", "motorway"],
      "paint": {
        "line-color": "#3a3a3a",
        "line-width": {
          "base": 1.5,
          "stops": [
            [10, 1],
            [15, 4],
            [18, 12]
          ]
        }
      }
    },
    {
      "id": "labels",
      "type": "symbol",
      "source": "mapbox-streets",
      "source-layer": "place_label",
      "layout": {
        "text-field": ["get", "name"],
        "text-size": 12
      },
      "paint": {
        "text-color": "#e0e0e0",
        "text-halo-color": "#0a0a0a",
        "text-halo-width": 2
      }
    }
  ]
}
```

**Key features:**

- Very dark background (#0a0a0a near-black)
- Subtle color differentiation (deep blues, greens)
- Light text (#e0e0e0) with dark halos
- Reduced opacity throughout
- Easy on eyes in low light
