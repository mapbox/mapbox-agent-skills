---
name: mapbox-style-patterns
description: Common style patterns, layer configurations, and recipes for typical mapping scenarios including restaurant finders, real estate, data visualization, navigation, delivery/logistics, and more. Use when implementing specific map use cases or looking for proven style patterns.
---

# Mapbox Style Patterns Skill

This skill provides battle-tested style patterns and layer configurations for common mapping scenarios.

## Pattern Library

### Pattern 1: Restaurant/POI Finder

**Use case:** Consumer app showing restaurants, cafes, bars, or other points of interest

**Visual requirements:**

- POIs must be immediately visible
- Street context for navigation
- Neutral background (photos/content overlay)
- Mobile-optimized

**Recommended layers:**

```json
{
  "layers": [
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#f5f5f5"
      }
    },
    {
      "id": "water",
      "type": "fill",
      "source": "mapbox-streets",
      "source-layer": "water",
      "paint": {
        "fill-color": "#d4e4f7",
        "fill-opacity": 0.6
      }
    },
    {
      "id": "landuse-parks",
      "type": "fill",
      "source": "mapbox-streets",
      "source-layer": "landuse",
      "filter": ["==", "class", "park"],
      "paint": {
        "fill-color": "#e8f5e8",
        "fill-opacity": 0.5
      }
    },
    {
      "id": "roads-minor",
      "type": "line",
      "source": "mapbox-streets",
      "source-layer": "road",
      "filter": ["in", "class", "street", "street_limited"],
      "paint": {
        "line-color": "#e0e0e0",
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
      "filter": ["in", "class", "primary", "secondary", "tertiary"],
      "paint": {
        "line-color": "#ffffff",
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
      "id": "restaurant-markers",
      "type": "symbol",
      "source": "restaurants",
      "layout": {
        "icon-image": "restaurant-15",
        "icon-size": 1.5,
        "icon-allow-overlap": false,
        "text-field": ["get", "name"],
        "text-offset": [0, 1.5],
        "text-size": 12,
        "text-allow-overlap": false
      },
      "paint": {
        "icon-color": "#FF6B35",
        "text-color": "#333333",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2
      }
    }
  ]
}
```

**Key features:**

- Desaturated base map (doesn't compete with photos)
- High-contrast markers (#FF6B35 orange stands out)
- Clear road network (white on light gray)
- Parks visible but subtle
- Text halos for readability

### Pattern 2: Real Estate Map

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

- Properties color-coded by price (green→yellow→red)
- Parks prominently visible (important for home buyers)
- Schools and transit clearly marked
- Property boundaries visible
- Clean, professional aesthetic

### Pattern 3: Data Visualization Base Map

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

### Pattern 4: Navigation/Routing Map

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

### Pattern 5: Dark Mode / Night Theme

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

### Pattern 6: Delivery/Logistics Map

**Use case:** Food delivery, package delivery, logistics tracking, on-demand services (DoorDash, Uber Eats, courier apps)

**Visual requirements:**

- Real-time location tracking (drivers, customers)
- Delivery zones clearly defined
- Active routes highly visible
- Status indicators obvious
- Delivery radius visualization
- Performance for live updates

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
      "id": "water",
      "type": "fill",
      "source": "mapbox-streets",
      "source-layer": "water",
      "paint": {
        "fill-color": "#c6dff5",
        "fill-opacity": 0.5
      }
    },
    {
      "id": "roads-background",
      "type": "line",
      "source": "mapbox-streets",
      "source-layer": "road",
      "paint": {
        "line-color": "#e0e0e0",
        "line-width": {
          "base": 1.5,
          "stops": [
            [10, 1],
            [15, 3],
            [18, 8]
          ]
        }
      }
    },
    {
      "id": "delivery-zones",
      "type": "fill",
      "source": "delivery-zones",
      "paint": {
        "fill-color": [
          "match",
          ["get", "status"],
          "available",
          "#4caf50",
          "busy",
          "#ff9800",
          "unavailable",
          "#f44336",
          "#9e9e9e"
        ],
        "fill-opacity": 0.15
      }
    },
    {
      "id": "delivery-zone-borders",
      "type": "line",
      "source": "delivery-zones",
      "paint": {
        "line-color": [
          "match",
          ["get", "status"],
          "available",
          "#4caf50",
          "busy",
          "#ff9800",
          "unavailable",
          "#f44336",
          "#9e9e9e"
        ],
        "line-width": 2,
        "line-dasharray": [3, 2]
      }
    },
    {
      "id": "delivery-radius",
      "type": "fill",
      "source": "delivery-radius",
      "paint": {
        "fill-color": "#2196f3",
        "fill-opacity": 0.1
      }
    },
    {
      "id": "delivery-radius-border",
      "type": "line",
      "source": "delivery-radius",
      "paint": {
        "line-color": "#2196f3",
        "line-width": 2,
        "line-dasharray": [5, 3]
      }
    },
    {
      "id": "active-route",
      "type": "line",
      "source": "active-route",
      "paint": {
        "line-color": "#1976d2",
        "line-width": {
          "base": 1.5,
          "stops": [
            [10, 4],
            [15, 8],
            [18, 16]
          ]
        },
        "line-opacity": 0.8
      }
    },
    {
      "id": "route-progress",
      "type": "line",
      "source": "route-progress",
      "paint": {
        "line-color": "#43a047",
        "line-width": {
          "base": 1.5,
          "stops": [
            [10, 4],
            [15, 8],
            [18, 16]
          ]
        }
      }
    },
    {
      "id": "restaurant-marker",
      "type": "circle",
      "source": "pickup-locations",
      "paint": {
        "circle-radius": 12,
        "circle-color": "#ff5722",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 3
      }
    },
    {
      "id": "restaurant-icon",
      "type": "symbol",
      "source": "pickup-locations",
      "layout": {
        "icon-image": "restaurant-15",
        "icon-size": 1.2,
        "text-field": ["get", "name"],
        "text-offset": [0, 2],
        "text-size": 11
      },
      "paint": {
        "text-color": "#212121",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2
      }
    },
    {
      "id": "customer-marker",
      "type": "circle",
      "source": "delivery-locations",
      "paint": {
        "circle-radius": 12,
        "circle-color": "#4caf50",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 3
      }
    },
    {
      "id": "customer-pulse",
      "type": "circle",
      "source": "delivery-locations",
      "paint": {
        "circle-radius": {
          "base": 1,
          "stops": [
            [0, 12],
            [1, 24]
          ]
        },
        "circle-color": "#4caf50",
        "circle-opacity": {
          "base": 1,
          "stops": [
            [0, 0.3],
            [1, 0]
          ]
        }
      }
    },
    {
      "id": "driver-marker-shadow",
      "type": "circle",
      "source": "driver-locations",
      "paint": {
        "circle-radius": 14,
        "circle-color": "#000000",
        "circle-opacity": 0.2,
        "circle-translate": [0, 2]
      }
    },
    {
      "id": "driver-marker",
      "type": "circle",
      "source": "driver-locations",
      "paint": {
        "circle-radius": 14,
        "circle-color": [
          "match",
          ["get", "status"],
          "picking_up",
          "#ff9800",
          "en_route",
          "#2196f3",
          "delivered",
          "#4caf50",
          "#9e9e9e"
        ],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 3
      }
    },
    {
      "id": "driver-direction",
      "type": "symbol",
      "source": "driver-locations",
      "layout": {
        "icon-image": "arrow",
        "icon-size": 0.5,
        "icon-rotate": ["get", "bearing"],
        "icon-rotation-alignment": "map",
        "icon-allow-overlap": true
      }
    },
    {
      "id": "eta-badges",
      "type": "symbol",
      "source": "driver-locations",
      "layout": {
        "text-field": ["concat", ["get", "eta"], " min"],
        "text-size": 11,
        "text-offset": [0, -2.5],
        "text-allow-overlap": true
      },
      "paint": {
        "text-color": "#ffffff",
        "text-halo-color": "#1976d2",
        "text-halo-width": 8,
        "text-halo-blur": 1
      }
    }
  ]
}
```

**Key features:**

- Color-coded delivery zones (green=available, orange=busy, red=unavailable)
- Real-time driver markers with status colors
- Pulsing customer location indicator
- Active route with completed progress shown in different color
- Delivery radius visualization with dashed border
- ETA badges on driver markers
- Direction arrows showing driver heading
- Restaurant/pickup locations clearly marked
- Shadow effects on driver markers for depth

**Load custom arrow icon:**

```javascript
// Load custom arrow icon for driver direction indicator
// Note: 'arrow' is not a standard Maki icon and must be loaded manually
map.on('load', () => {
  map.loadImage('path/to/arrow-icon.png', (error, image) => {
    if (error) throw error;
    map.addImage('arrow', image);
  });
});
```

**Real-time update pattern:**

```javascript
// Update driver location (call on GPS update)
map.getSource('driver-locations').setData({
  type: 'FeatureCollection',
  features: drivers.map((driver) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: driver.location
    },
    properties: {
      id: driver.id,
      status: driver.status,
      bearing: driver.bearing,
      eta: driver.eta
    }
  }))
});

// Animate route progress
function updateRouteProgress(completedCoordinates) {
  map.getSource('route-progress').setData({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: completedCoordinates
    }
  });
}

// Pulse animation for active delivery
function pulseCustomerMarker() {
  const duration = 2000;
  const start = performance.now();

  function animate(time) {
    const elapsed = time - start;
    const phase = (elapsed % duration) / duration;

    // Update radius (12 to 24 pixels)
    map.setPaintProperty('customer-pulse', 'circle-radius', 12 + phase * 12);

    // Update opacity (fade from 0.3 to 0)
    map.setPaintProperty('customer-pulse', 'circle-opacity', 0.3 * (1 - phase));

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
```

**Performance tips:**

- Update driver positions every 3-5 seconds (not every GPS ping)
- Use `setData()` instead of removing/re-adding sources
- Limit visible drivers to current viewport + buffer
- Debounce rapid updates during high activity
- Use symbol layers instead of HTML markers for 50+ drivers

## Pattern Selection Guide

### Decision Tree

**Question 1: What is the primary content?**

- User-generated markers/pins → **POI Finder Pattern**
- Property data/boundaries → **Real Estate Pattern**
- Statistical/analytical data → **Data Visualization Pattern**
- Routes/directions → **Navigation Pattern**
- Real-time tracking/delivery zones → **Delivery/Logistics Pattern**

**Question 2: What is the viewing environment?**

- Daytime/office → Light theme
- Night/dark environment → **Dark Mode Pattern**
- Variable → Provide theme toggle

**Question 3: What is the user's primary action?**

- Browse/explore → Focus on POIs, rich detail
- Navigate → Focus on roads, route visibility
- Track delivery/logistics → Real-time updates, zones, status
- Analyze data → Minimize base map, maximize data
- Select location → Clear boundaries, context

**Question 4: What is the platform?**

- Mobile → Simplified, larger touch targets, less detail
- Desktop → Can include more detail and complexity
- Both → Design mobile-first, enhance for desktop

## Layer Optimization Patterns

### Performance Pattern: Simplified by Zoom

```json
{
  "id": "roads",
  "type": "line",
  "source": "mapbox-streets",
  "source-layer": "road",
  "filter": [
    "step",
    ["zoom"],
    ["in", "class", "motorway", "trunk"],
    8,
    ["in", "class", "motorway", "trunk", "primary"],
    12,
    ["in", "class", "motorway", "trunk", "primary", "secondary"],
    14,
    true
  ],
  "paint": {
    "line-width": {
      "base": 1.5,
      "stops": [
        [4, 0.5],
        [10, 1],
        [15, 4],
        [18, 12]
      ]
    }
  }
}
```

### Expression Pattern: Data-Driven Styling

```json
{
  "paint": {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "population"],
      0,
      3,
      1000,
      5,
      10000,
      8,
      100000,
      12,
      1000000,
      20
    ],
    "circle-color": [
      "case",
      ["<", ["get", "temperature"], 0],
      "#2196f3",
      ["<", ["get", "temperature"], 20],
      "#4caf50",
      ["<", ["get", "temperature"], 30],
      "#ffc107",
      "#f44336"
    ]
  }
}
```

### Clustering Pattern: Handle Dense POIs

```json
{
  "id": "clusters",
  "type": "circle",
  "source": "pois",
  "filter": ["has", "point_count"],
  "paint": {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#51bbd6", 10,
      "#f1f075", 30,
      "#f28cb1"
    ],
    "circle-radius": [
      "step",
      ["get", "point_count"],
      15, 10,
      20, 30,
      25
    ]
  }
},
{
  "id": "cluster-count",
  "type": "symbol",
  "source": "pois",
  "filter": ["has", "point_count"],
  "layout": {
    "text-field": ["get", "point_count_abbreviated"],
    "text-size": 12
  }
}
```

## Common Modifications

### Add 3D Buildings

```json
{
  "id": "3d-buildings",
  "type": "fill-extrusion",
  "source": "composite",
  "source-layer": "building",
  "minzoom": 15,
  "paint": {
    "fill-extrusion-color": "#aaa",
    "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
    "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"]],
    "fill-extrusion-opacity": 0.6
  }
}
```

### Add Terrain/Hillshade

```json
{
  "sources": {
    "mapbox-dem": {
      "type": "raster-dem",
      "url": "mapbox://mapbox.mapbox-terrain-dem-v1"
    }
  },
  "layers": [
    {
      "id": "hillshade",
      "type": "hillshade",
      "source": "mapbox-dem",
      "paint": {
        "hillshade-exaggeration": 0.5,
        "hillshade-shadow-color": "#000000"
      }
    }
  ],
  "terrain": {
    "source": "mapbox-dem",
    "exaggeration": 1.5
  }
}
```

### Add Custom Markers

```json
{
  "id": "custom-markers",
  "type": "symbol",
  "source": "markers",
  "layout": {
    "icon-image": "custom-marker",
    "icon-size": 0.8,
    "icon-anchor": "bottom",
    "icon-allow-overlap": true,
    "text-field": ["get", "name"],
    "text-offset": [0, -2],
    "text-anchor": "top",
    "text-size": 12
  },
  "paint": {
    "text-color": "#ffffff",
    "text-halo-color": "#000000",
    "text-halo-width": 2
  }
}
```

## Testing Patterns

### Visual Regression Checklist

- [ ] Test at zoom levels: 4, 8, 12, 16, 20
- [ ] Verify on mobile (375px width)
- [ ] Verify on desktop (1920px width)
- [ ] Test with dense data
- [ ] Test with sparse data
- [ ] Check label collision
- [ ] Verify color contrast (WCAG)
- [ ] Test loading performance

## When to Use This Skill

Invoke this skill when:

- Starting a new map style for a specific use case
- Looking for layer configuration examples
- Implementing common mapping patterns
- Optimizing existing styles
- Need proven recipes for typical scenarios
- Debugging style issues
- Learning Mapbox style best practices
