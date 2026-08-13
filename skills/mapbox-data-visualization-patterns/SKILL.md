---
name: mapbox-data-visualization-patterns
description: Patterns for visualizing data on maps including choropleth maps, heat maps, 3D visualizations, data-driven styling, and animated data. Covers layer types, color scales, and performance optimization.
---

# Data Visualization Patterns Skill

Comprehensive patterns for visualizing data on Mapbox maps. Covers choropleth maps, heat maps, 3D extrusions, data-driven styling, animated visualizations, and performance optimization for data-heavy applications.

## Basemap setup: do this first

Every pattern below assumes the **Mapbox Standard** style with a quieted basemap. The base is a canvas, not the subject — POI labels compete with your thematic layer for attention, and 3D objects occlude it outright.

```javascript
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard',
  config: {
    basemap: {
      theme: 'monochrome', // or 'faded' — desaturate the base, not your data
      showPointOfInterestLabels: false,
      show3dObjects: false
    }
  }
});

// Change it later with config, never by reloading the style:
map.setConfigProperty('basemap', 'theme', 'faded');
```

Alternatives: the purpose-built `light-2d` / `dark-2d` styles in the [Mapbox gallery](https://www.mapbox.com/gallery) (copy to your account first). For dark mode, set `lightPreset: 'night'` — do not swap to a different style.

**Two rules that apply to every `addLayer` call in this skill:**

1. **Always set an explicit `slot`.** A layer with no slot renders above _everything_, including street labels. Choropleths and rasters go in `bottom` (under the road network) or `middle`; routes and custom POI layers in `middle`; markers and active selections in `top`.
2. **Set emissive strength to `1` on fill, line, and circle layers** (`fill-emissive-strength`, `line-emissive-strength`, `circle-emissive-strength`). These default to `0`, so without it the layer falls into shadow and goes nearly invisible under the `dusk` and `night` light presets. Symbol layers are already fine — `icon-`/`text-emissive-strength` default to `1`.

See the **mapbox-cartography** skill for the full slot table, color rules, and light-preset behavior.

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
    slot: 'bottom', // under the road network, so roads stay readable as context
    source: 'states',
    paint: {
      // Sequential ColorBrewer ramp (Blues) — ordered data needs an ordered ramp
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
      'fill-opacity': 0.7, // cap at 0.7 so the basemap reads through for context
      'fill-emissive-strength': 1 // or the fill disappears at dusk/night
    }
  });

  // Add border layer
  map.addLayer({
    id: 'states-border',
    type: 'line',
    slot: 'bottom',
    source: 'states',
    paint: {
      'line-color': '#ffffff',
      'line-width': 1,
      'line-emissive-strength': 1
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
    slot: 'middle', // above roads, behind labels and 3D
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
    slot: 'middle',
    source: 'incidents',
    minzoom: 13, // set 1-2 levels below where the layer should appear...
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 4, 22, 30],
      'circle-color': '#ff4444',
      // ...then fade in across that band. Never pop a layer on at a hard cutoff.
      'circle-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, 0.8],
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 1,
      'circle-emissive-strength': 1
    }
  });
});
```

> **Zoom continuity:** `minzoom` is worth keeping — it saves real GPU work at zooms where the layer is useless. But a bare `minzoom` makes features pop into existence. Set `minzoom` 1–2 levels _below_ where the layer should become visible, then interpolate opacity from 0 across that band.

## Best Practices

### Color Accessibility

```javascript
// Use ColorBrewer scales for accessibility
// https://colorbrewer2.org/

// Good: Sequential, one direction of data (Blues, Greens, Oranges, YlOrRd, BuPu)
const sequentialScale = ['#f0f9ff', '#bae4ff', '#7fcdff', '#0080ff', '#001f5c'];

// Good: Diverging, bidirectional data (RdBu shown; also PuOr, BrBG)
const divergingScale = ['#b2182b', '#ef8a62', '#fddbc7', '#d1e5f0', '#67a9cf', '#2166ac'];

// Good: Qualitative, categories up to 8 (Set1, Set2, Paired, Dark2)
const qualitativeScale = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'];
```

**Hard rules:**

- **Never red→green** (RdYlGn / green-yellow-red "traffic light" ramps). It is the most common colorblind failure — roughly 1 in 12 men cannot separate the endpoints. Use **RdBu**, **PuOr**, or **BrBG** for diverging data instead.
- **Never rainbow or spectral for ordered data.** Rainbow has no perceptual ordering, so readers cannot tell which end is "more".
- **Never rely on color alone** to encode a category — pair it with size, shape, icon, or a label.
- Target **WCAG AA**: 4.5:1 contrast for normal text, 3:1 for large text and line work. Test with a **deuteranopia** simulator.

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
    slot: 'bottom',
    source: 'data',
    paint: {
      'fill-color': [
        'case',
        ['has', 'value'], // Check if property exists
        ['interpolate', ['linear'], ['get', 'value'], 0, '#f0f0f0', 100, '#0080ff'],
        '#cccccc' // Default color for missing data
      ],
      'fill-opacity': 0.7,
      'fill-emissive-strength': 1
    }
  });

  // Handle map errors
  map.on('error', (e) => {
    console.error('Map error:', e.error);
  });
});
```

## Data Size Rule

By payload size:

- **< 5 MB**: Use GeoJSON directly
- **5–20 MB**: Consider vector tiles, depending on geometry complexity
- **> 20 MB**: Use vector tiles (upload to Mapbox as a tileset)

By **feature count**, for point data — the rendering-cost ladder used across these skills:

| Points                                | Approach                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| < ~100                                | HTML marker / annotation (per-element interaction)                           |
| ~100 and up                           | `circle` or `symbol` layer — GPU-rendered, smooth into the tens of thousands |
| Thousands, or a payload past a few MB | Vector tileset — only the current viewport loads                             |

**Clustering is a separate decision, driven by legibility.** Cluster when points visibly overlap at the zooms your readers use — that depends on how the data is distributed, not on the row count. A heatmap of 50,000 sparse points needs no clustering; 300 incidents on one city block do.

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
