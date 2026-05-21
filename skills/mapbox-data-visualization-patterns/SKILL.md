---
name: mapbox-data-visualization-patterns
description: Patterns for visualizing data on maps including choropleth maps, heat maps, 3D visualizations, data-driven styling, and animated data. Covers layer types, color scales, and performance optimization.
---

# Data Visualization Patterns Skill

Comprehensive patterns for visualizing data on Mapbox maps. Covers choropleth maps, heat maps, 3D extrusions, data-driven styling, animated visualizations, and performance optimization for data-heavy applications.

## When to Use This Skill

Use this skill when:

- Visualizing statistical data on maps (population, sales, demographics)
- Creating choropleth maps with color-coded regions
- Building heat maps or clustering for density visualization
- Adding 3D visualizations (building heights, terrain elevation)
- Implementing data-driven styling based on properties
- Animating time-series data
- Working with large datasets that require optimization

## Visualization Types

### Choropleth Maps

**Best for:** Regional data (states, counties, zip codes), statistical comparisons

**Pattern:** Color-code polygons based on data values

```javascript
map.on('load', () => {
  // Add data source (GeoJSON with properties)
  map.addSource('states', {
    type: 'geojson',
    data: 'https://example.com/states.geojson' // Features with population property
  });

  // Add fill layer with data-driven color
  map.addLayer({
    id: 'states-layer',
    type: 'fill',
    source: 'states',
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'population'],
        0,
        '#f0f9ff', // Light blue for low population
        500000,
        '#7fcdff',
        1000000,
        '#0080ff',
        5000000,
        '#0040bf', // Dark blue for high population
        10000000,
        '#001f5c'
      ],
      'fill-opacity': 0.75
    }
  });

  // Add border layer
  map.addLayer({
    id: 'states-border',
    type: 'line',
    source: 'states',
    paint: {
      'line-color': '#ffffff',
      'line-width': 1
    }
  });

  // Add hover effect with reusable popup
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  map.on('mousemove', 'states-layer', (e) => {
    if (e.features.length > 0) {
      map.getCanvas().style.cursor = 'pointer';

      const feature = e.features[0];
      popup
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <h3>${feature.properties.name}</h3>
          <p>Population: ${feature.properties.population.toLocaleString()}</p>
        `
        )
        .addTo(map);
    }
  });

  map.on('mouseleave', 'states-layer', () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
  });
});
```

> **`step` vs `interpolate`:** The example above uses `interpolate` for smooth color gradients. For **discrete color buckets** (e.g., "low / medium / high"), use `['step', ['get', 'population'], '#f0f0f0', 500000, '#fee0d2', 2000000, '#fc9272', 10000000, '#de2d26']` instead. Prefer `step` when data has natural categories or when exact boundary values matter.

**Color Scale Strategies:**

```javascript
// Linear interpolation (continuous scale)
'fill-color': [
  'interpolate',
  ['linear'],
  ['get', 'value'],
  0, '#ffffcc',
  25, '#78c679',
  50, '#31a354',
  100, '#006837'
]

// Step intervals (discrete buckets)
'fill-color': [
  'step',
  ['get', 'value'],
  '#ffffcc',  // Default color
  25, '#c7e9b4',
  50, '#7fcdbb',
  75, '#41b6c4',
  100, '#2c7fb8'
]

// Case-based (categorical data)
'fill-color': [
  'match',
  ['get', 'category'],
  'residential', '#ffd700',
  'commercial', '#ff6b6b',
  'industrial', '#4ecdc4',
  'park', '#45b7d1',
  '#cccccc'  // Default
]
```

### Heat Maps

**Best for:** Point density, event locations, incident clustering

**Pattern:** Visualize density of points

```javascript
map.on('load', () => {
  // Add data source (points)
  map.addSource('incidents', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749]
          },
          properties: {
            intensity: 1
          }
        }
        // ... more points
      ]
    }
  });

  // Add heatmap layer
  map.addLayer({
    id: 'incidents-heat',
    type: 'heatmap',
    source: 'incidents',
    maxzoom: 15,
    paint: {
      // Increase weight based on intensity property
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 6, 1],
      // Increase intensity as zoom level increases
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
      // Color ramp for heatmap
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(33,102,172,0)',
        0.2,
        'rgb(103,169,207)',
        0.4,
        'rgb(209,229,240)',
        0.6,
        'rgb(253,219,199)',
        0.8,
        'rgb(239,138,98)',
        1,
        'rgb(178,24,43)'
      ],
      // Adjust radius by zoom level
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
      // Decrease opacity at higher zoom levels
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 0]
    }
  });

  // Add circle layer for individual points at high zoom
  map.addLayer({
    id: 'incidents-point',
    type: 'circle',
    source: 'incidents',
    minzoom: 14,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 4, 22, 30],
      'circle-color': '#ff4444',
      'circle-opacity': 0.8,
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 1
    }
  });
});
```

## Best Practices

### Color Accessibility

```javascript
// Use ColorBrewer scales for accessibility
// https://colorbrewer2.org/

// Good: Sequential (single hue)
const sequentialScale = ['#f0f9ff', '#bae4ff', '#7fcdff', '#0080ff', '#001f5c'];

// Good: Diverging (two hues)
const divergingScale = ['#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60', '#1a9850'];

// Good: Qualitative (distinct categories)
const qualitativeScale = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'];

// Avoid: Red-green for color-blind accessibility
// Use: Blue-orange or purple-green instead
```

### Error Handling

```javascript
// Handle missing or invalid data
map.on('load', () => {
  map.addSource('data', {
    type: 'geojson',
    data: dataUrl
  });

  map.addLayer({
    id: 'data-viz',
    type: 'fill',
    source: 'data',
    paint: {
      'fill-color': [
        'case',
        ['has', 'value'], // Check if property exists
        ['interpolate', ['linear'], ['get', 'value'], 0, '#f0f0f0', 100, '#0080ff'],
        '#cccccc' // Default color for missing data
      ]
    }
  });

  // Handle map errors
  map.on('error', (e) => {
    console.error('Map error:', e.error);
  });
});
```

## Data Size Rule

- **< 1 MB**: Use GeoJSON directly
- **1–10 MB**: Consider either GeoJSON or vector tiles depending on complexity
- **> 10 MB**: Use vector tiles (upload to Mapbox as tileset)

See [references/performance.md](references/performance.md) for implementation details.

## Reference Files

For additional visualization patterns, load the relevant reference file:

- **[references/clustering.md](references/clustering.md)** — Point clustering, custom cluster properties, clustering vs heatmap comparison
- **[references/3d-extrusions.md](references/3d-extrusions.md)** — 3D building extrusions, custom data sources, data-driven heights
- **[references/circles-lines.md](references/circles-lines.md)** — Circle/bubble maps, line data visualization, traffic flow styling
- **[references/animation.md](references/animation.md)** — Time-series animation, real-time data updates, smooth transitions
- **[references/performance.md](references/performance.md)** — Vector tiles vs GeoJSON, feature state, filtering, progressive loading
- **[references/legends-use-cases.md](references/legends-use-cases.md)** — Legend UI, data inspector, data preprocessing, election/COVID/real-estate examples

## Resources

- [Mapbox Expression Reference](https://docs.mapbox.com/style-spec/reference/expressions/)
- [ColorBrewer](https://colorbrewer2.org/) - Color scales for maps
- [Turf.js](https://turfjs.org/) - Spatial analysis
- [Simple Statistics](https://simple-statistics.github.io/) - Data classification
- [Data Visualization Tutorials](https://docs.mapbox.com/help/tutorials/#data-visualization)
