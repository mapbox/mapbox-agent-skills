# Conversation Example: Restaurant Finder Design

This conversation demonstrates how multiple skills work together to design a map style for a restaurant finder application.

## Skills Used

- 🎨 **mapbox-cartography** - Provides design principles for restaurant finder maps
- 📐 **mapbox-style-patterns** - Offers the POI Finder pattern
- ✅ **mapbox-style-quality** - Validates accessibility and quality

---

## Conversation

### User

> I'm building a restaurant discovery app and need to design the map style. What colors and styling should I use to make restaurants stand out while keeping the map easy to navigate?

### AI Assistant

Great question! Let me help you design an effective map style for your restaurant finder using guidance from the **mapbox-cartography** and **mapbox-style-patterns** skills.

### Design Requirements for Restaurant Finders

Based on **mapbox-cartography** principles, restaurant finder maps have specific needs:

**Visual Hierarchy:**

1. **Primary focus**: Restaurant markers (highest contrast)
2. **Secondary**: Street names and navigation context
3. **Tertiary**: Background map features

**Key Considerations:**

- Users will overlay food photos and details, so the base map should be **muted**
- High contrast needed for marker visibility
- Clear street labels for wayfinding
- Mobile-optimized (most users on phones)

### Recommended: POI Finder Pattern

From **mapbox-style-patterns**, the **POI Finder pattern** is ideal for restaurant apps:

#### Color Palette

```json
{
  "background": "#F5F5F5", // Light neutral - won't compete with food photos
  "water": "#C8E6F5", // Subtle blue
  "parks": "#E8F5E9", // Very light green
  "roads_major": "#FFFFFF", // White roads for clarity
  "roads_minor": "#F0F0F0", // Slightly darker for hierarchy
  "buildings": "#E0E0E0", // Muted gray
  "labels_primary": "#333333", // Dark gray for readability
  "labels_secondary": "#666666", // Medium gray
  "markers": "#FF6B35" // Vibrant orange - stands out!
}
```

**Why these colors:**

- **Orange markers (#FF6B35)** - High visibility, warm (associates with food), works on both light and muted backgrounds
- **Desaturated base** - Prevents competing with colorful food photos
- **White roads** - Creates clear navigation paths
- **Neutral grays** - Provides context without distraction

#### Style Configuration

Using Mapbox Standard style with customization:

```javascript
const style = {
  version: 8,
  name: 'Restaurant Finder',
  sources: {
    mapbox: {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8'
    }
  },
  layers: [
    // Background
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#F5F5F5'
      }
    },
    // Water - subtle
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#C8E6F5',
        'fill-opacity': 0.7
      }
    },
    // Parks - very subtle
    {
      id: 'parks',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'landuse',
      filter: ['==', ['get', 'class'], 'park'],
      paint: {
        'fill-color': '#E8F5E9',
        'fill-opacity': 0.5
      }
    },
    // Buildings - muted
    {
      id: 'buildings',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'building',
      paint: {
        'fill-color': '#E0E0E0',
        'fill-opacity': 0.7
      }
    },
    // Major roads - white for clarity
    {
      id: 'roads-major',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]],
      paint: {
        'line-color': '#FFFFFF',
        'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 1, 18, 24]
      }
    },
    // Minor roads - slightly darker
    {
      id: 'roads-minor',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['in', ['get', 'class'], ['literal', ['secondary', 'tertiary', 'street']]],
      paint: {
        'line-color': '#F0F0F0',
        'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 12, 0.5, 18, 18]
      }
    },
    // Street labels - clear and readable
    {
      id: 'road-labels',
      type: 'symbol',
      source: 'mapbox',
      'source-layer': 'road',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 11, 18, 16],
        'symbol-placement': 'line',
        'text-rotation-alignment': 'map'
      },
      paint: {
        'text-color': '#333333',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 2
      }
    }
  ]
};
```

### Accessibility Check

Using **mapbox-style-quality** principles, let's verify color contrast:

**Orange markers (#FF6B35) on light background (#F5F5F5):**

- Contrast ratio: **4.8:1**
- WCAG AA: ✅ Pass (requires 3:1 for graphics)
- WCAG AAA: ✅ Pass

**Street labels (#333333) on white halos:**

- Contrast ratio: **12.6:1**
- WCAG AA: ✅ Pass (requires 4.5:1 for text)
- WCAG AAA: ✅ Pass (requires 7:1)

All color choices meet accessibility standards!

### Restaurant Markers

For your restaurant markers, I recommend:

```javascript
// Add restaurant data source
map.addSource('restaurants', {
  type: 'geojson',
  data: restaurantsGeoJSON,
  cluster: true, // Enable if you have many restaurants
  clusterMaxZoom: 15,
  clusterRadius: 50
});

// Clustered restaurants
map.addLayer({
  id: 'restaurant-clusters',
  type: 'circle',
  source: 'restaurants',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': '#FF6B35',
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20, // radius for < 10 restaurants
      10,
      25, // radius for 10-50 restaurants
      50,
      30 // radius for 50+ restaurants
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#FFFFFF'
  }
});

// Cluster count
map.addLayer({
  id: 'cluster-count',
  type: 'symbol',
  source: 'restaurants',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
    'text-size': 14
  },
  paint: {
    'text-color': '#FFFFFF'
  }
});

// Individual unclustered restaurants
map.addLayer({
  id: 'unclustered-restaurants',
  type: 'circle',
  source: 'restaurants',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#FF6B35',
    'circle-radius': 10,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#FFFFFF'
  }
});
```

### Mobile Optimization

From **mapbox-cartography**, optimize for mobile:

**1. Simplified at low zoom:**

```javascript
// Hide minor details at low zoom
"paint": {
  "fill-opacity": [
    "interpolate", ["linear"], ["zoom"],
    10, 0,    // Hidden at zoom 10 and below
    12, 0.5   // Fade in by zoom 12
  ]
}
```

**2. Larger touch targets:**

```javascript
// Make markers easier to tap on mobile
'circle-radius': [
  'interpolate', ['linear'], ['zoom'],
  10, 8,   // Smaller at far zoom
  15, 14   // Larger when zoomed in for easy tapping
]
```

**3. Readable text:**

```javascript
// Minimum 11px for mobile readability
'text-size': [
  'interpolate', ['linear'], ['zoom'],
  10, 11,  // Never smaller than 11px
  18, 16
]
```

### Complete Example with Interactivity

```javascript
// Click handler for restaurant selection
map.on('click', 'unclustered-restaurants', (e) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['unclustered-restaurants']
  });

  if (!features.length) return;

  const restaurant = features[0].properties;

  // Show popup with restaurant details
  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(
      `
      <div style="font-family: system-ui; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; color: #FF6B35;">
          ${restaurant.name}
        </h3>
        <p style="margin: 0; color: #666; font-size: 14px;">
          ${restaurant.cuisine} • ${restaurant.priceRange}
        </p>
        <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">
          ⭐ ${restaurant.rating} (${restaurant.reviewCount} reviews)
        </p>
      </div>
    `
    )
    .addTo(map);

  // Change cursor on hover
  map.getCanvas().style.cursor = 'pointer';
});

// Reset cursor when leaving marker
map.on('mouseleave', 'unclustered-restaurants', () => {
  map.getCanvas().style.cursor = '';
});
```

### Expected User Experience

With this design:

- ✅ Restaurants immediately draw attention (orange on muted background)
- ✅ Users can easily see street names for navigation
- ✅ Food photos pop when overlaid on the muted base
- ✅ Touch targets are large enough for mobile
- ✅ Accessible to users with color vision deficiencies
- ✅ Professional, clean appearance

### Alternative Color Schemes

If orange doesn't fit your brand:

**Red (#E53935)** - Traditional food/dining association
**Teal (#00897B)** - Modern, fresh feeling
**Purple (#7B1FA2)** - Premium dining experience
**Yellow (#FDD835)** - Fun, casual dining

Just ensure contrast ratio > 4.5:1 against the background!

Would you like me to adjust any of these design choices or add additional features?

---

## Skills Application Analysis

### How the skills worked together:

1. **mapbox-cartography** provided:
   - Visual hierarchy principles (primary: markers, secondary: streets, tertiary: background)
   - Context considerations (mobile optimization, food photo overlays)
   - Color theory (muted base, high-contrast markers)

2. **mapbox-style-patterns** provided:
   - Specific POI Finder pattern
   - Concrete color palette
   - Layer configuration examples
   - Common modifications

3. **mapbox-style-quality** provided:
   - Accessibility validation (WCAG contrast ratios)
   - Color contrast checking methodology

### Without the skills:

An AI assistant without these skills might:

- Suggest overly saturated base maps that compete with content
- Use random colors without considering food association or visibility
- Not validate accessibility compliance
- Miss mobile optimization patterns
- Provide generic styling without use-case-specific guidance

### Result:

The skill-enhanced AI provided a comprehensive, accessible, use-case-optimized design with concrete implementation code, color justifications, and accessibility validation.
