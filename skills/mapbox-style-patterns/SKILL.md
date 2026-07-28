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

## Pattern Selection Guide

### Decision Tree

**Question 1: What is the primary content?**

- User-generated markers/pins -> **POI Finder Pattern**
- Property data/boundaries -> **Real Estate Pattern**
- Statistical/analytical data -> **Data Visualization Pattern**
- Routes/directions -> **Navigation Pattern**
- Real-time tracking/delivery zones -> **Delivery/Logistics Pattern** (customer markers should include a pulse animation via second circle layer + requestAnimationFrame + setPaintProperty; see references/delivery-logistics.md)

**Question 2: What is the viewing environment?**

- Daytime/office -> Light theme
- Night/dark environment -> **Dark Mode Pattern**
- Variable -> Provide theme toggle

**Question 3: What is the user's primary action?**

- Browse/explore -> Focus on POIs, rich detail
- Navigate -> Focus on roads, route visibility
- Track delivery/logistics -> Real-time updates, zones, status
- Analyze data -> Minimize base map, maximize data
- Select location -> Clear boundaries, context

**Question 4: What is the platform?**

- Mobile -> Simplified, larger touch targets, less detail
- Desktop -> Can include more detail and complexity
- Both -> Design mobile-first, enhance for desktop

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

## Reference Files

Additional patterns and configurations are available in the `references/` directory. Load the relevant file when a specific pattern is needed.

| File                                                                         | Contents                                                                                         |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [references/real-estate.md](references/real-estate.md)                       | Pattern 2: Real Estate Map -- property boundaries, price color-coding, amenity markers           |
| [references/data-viz-base.md](references/data-viz-base.md)                   | Pattern 3: Data Visualization Base Map -- minimal grayscale base for choropleth/heatmap overlays |
| [references/navigation.md](references/navigation.md)                         | Pattern 4: Navigation/Routing Map -- route display, user location, turn arrows                   |
| [references/dark-mode.md](references/dark-mode.md)                           | Pattern 5: Dark Mode / Night Theme -- near-black background, reduced brightness                  |
| [references/delivery-logistics.md](references/delivery-logistics.md)         | Pattern 6: Delivery/Logistics Map -- real-time tracking, zones, driver markers, ETA badges       |
| [references/expressions-clustering.md](references/expressions-clustering.md) | Data-driven expression patterns + clustering for dense POIs                                      |
| [references/common-modifications.md](references/common-modifications.md)     | 3D Buildings, Terrain/Hillshade, Custom Markers                                                  |

**Loading instructions:** Read the reference file that matches the user's use case. For example, if implementing a delivery tracking map, load `references/delivery-logistics.md`.

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
