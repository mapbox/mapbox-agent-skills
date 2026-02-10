# Data Visualization Patterns

Quick reference for visualizing data on Mapbox maps.

## Visualization Type Decision Matrix

| Data Type             | Visualization | Layer Type       | Use For                             |
| --------------------- | ------------- | ---------------- | ----------------------------------- |
| **Regional/Polygons** | Choropleth    | `fill`           | Statistics, demographics, elections |
| **Point Density**     | Heat Map      | `heatmap`        | Crime, events, incident clustering  |
| **Point Magnitude**   | Bubble/Circle | `circle`         | Earthquakes, sales, metrics         |
| **3D Data**           | Extrusions    | `fill-extrusion` | Buildings, elevation, volume        |
| **Flow/Network**      | Lines         | `line`           | Traffic, routes, connections        |

## Choropleth Maps

**Pattern:** Color-code regions by data values

```javascript
map.addLayer({
  id: 'choropleth',
  type: 'fill',
  source: 'regions',
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'value'],
      0,
      '#f0f9ff', // Low
      50,
      '#7fcdff',
      100,
      '#0080ff' // High
    ],
    'fill-opacity': 0.75
  }
});
```

**Color Scale Types:**

```javascript
// Linear (continuous)
['interpolate', ['linear'], ['get', 'value'], 0, '#fff', 100, '#000'][
  // Steps (discrete buckets)
  ('step', ['get', 'value'], '#fff', 25, '#ccc', 50, '#888', 75, '#000')
][
  // Categories (qualitative)
  ('match', ['get', 'category'], 'A', '#ff0000', 'B', '#0000ff', '#cccccc')
];
```

## Heat Maps

**Pattern:** Show point density

```javascript
map.addLayer({
  id: 'heatmap',
  type: 'heatmap',
  source: 'points',
  paint: {
    'heatmap-weight': ['get', 'intensity'],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
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
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20]
  }
});

// Show individual points at high zoom
map.addLayer({
  id: 'points',
  type: 'circle',
  source: 'points',
  minzoom: 14,
  paint: {
    'circle-radius': 6,
    'circle-color': '#ff4444'
  }
});
```

## Bubble Maps

**Pattern:** Size circles by magnitude

```javascript
map.addLayer({
  id: 'bubbles',
  type: 'circle',
  source: 'data',
  paint: {
    'circle-radius': ['interpolate', ['exponential', 2], ['get', 'magnitude'], 0, 2, 5, 20, 10, 100],
    'circle-color': ['interpolate', ['linear'], ['get', 'value'], 0, '#ffffcc', 50, '#78c679', 100, '#006837'],
    'circle-opacity': 0.7,
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 1
  }
});
```

## 3D Extrusions

**Pattern:** Extrude polygons by height

```javascript
map.addLayer({
  id: '3d-buildings',
  type: 'fill-extrusion',
  source: 'buildings',
  paint: {
    'fill-extrusion-height': ['get', 'height'],
    'fill-extrusion-base': ['get', 'base_height'],
    'fill-extrusion-color': [
      'interpolate',
      ['linear'],
      ['get', 'height'],
      0,
      '#fafa6e',
      100,
      '#e64a45',
      200,
      '#a63e3e'
    ],
    'fill-extrusion-opacity': 0.9
  }
});

// Enable 3D view
map.setPitch(45);
map.setBearing(-17.6);
```

## Line Visualization

**Pattern:** Style lines by data

```javascript
map.addLayer({
  id: 'traffic',
  type: 'line',
  source: 'roads',
  paint: {
    'line-width': ['interpolate', ['exponential', 2], ['get', 'volume'], 0, 1, 10000, 15],
    'line-color': [
      'interpolate',
      ['linear'],
      ['get', 'speed'],
      0,
      '#d73027', // Stopped
      30,
      '#fee08b', // Moderate
      60,
      '#1a9850' // Free flow
    ]
  }
});
```

## Animated Data

**Time-Series:**

```javascript
let currentTime = 0;

function animate() {
  currentTime++;
  map.getSource('data').setData(getDataForTime(currentTime));
  requestAnimationFrame(animate);
}
```

**Real-Time Updates:**

```javascript
setInterval(async () => {
  const data = await fetch('/api/live-data').then((r) => r.json());
  map.getSource('live').setData(data);
}, 5000);
```

## Performance

**Data Size Guidelines:**

| Size    | Format       | Strategy              |
| ------- | ------------ | --------------------- |
| < 1 MB  | GeoJSON      | Direct load           |
| 1-10 MB | GeoJSON      | Consider vector tiles |
| > 10 MB | Vector Tiles | Required              |

**Vector Tiles:**

```javascript
map.addSource('large-data', {
  type: 'vector',
  tiles: ['https://example.com/{z}/{x}/{y}.mvt']
});

map.addLayer({
  id: 'data',
  type: 'fill',
  source: 'large-data',
  'source-layer': 'layer-name'
});
```

**Feature State (Dynamic Styling):**

```javascript
// Add source with generateId
map.addSource('data', {
  type: 'geojson',
  data: data,
  generateId: true  // Required
});

// Update state
map.setFeatureState(
  { source: 'data', id: featureId },
  { hover: true }
);

// Use in paint property
'fill-color': [
  'case',
  ['boolean', ['feature-state', 'hover'], false],
  '#ff0000',
  '#0000ff'
]
```

**Client-Side Filtering:**

```javascript
// Filter without reloading data
map.setFilter('layer-id', ['>=', ['get', 'value'], threshold]);
```

**Progressive Loading:**

```javascript
map.on('moveend', () => {
  const bounds = map.getBounds();
  const visible = allData.features.filter((f) => bounds.contains(f.geometry.coordinates));
  map.getSource('data').setData({ type: 'FeatureCollection', features: visible });
});
```

## Color Scales

**Accessible Colors (ColorBrewer):**

```javascript
// Sequential (single hue)
const sequential = ['#f0f9ff', '#bae4ff', '#7fcdff', '#0080ff', '#001f5c'];

// Diverging (two hues)
const diverging = ['#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60', '#1a9850'];

// Qualitative (distinct categories)
const qualitative = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'];
```

## Legend Component

```html
<div class="legend">
  <h4>Population Density</h4>
  <div class="legend-item">
    <span class="legend-color" style="background: #f0f9ff;"></span>
    <span>0-500</span>
  </div>
  <div class="legend-item">
    <span class="legend-color" style="background: #0080ff;"></span>
    <span>1000+</span>
  </div>
</div>
```

## Common Use Cases

**Election Results:**

```javascript
'fill-color': [
  'match',
  ['get', 'winner'],
  'democrat', '#3b82f6',
  'republican', '#ef4444',
  '#94a3b8'
]
```

**COVID Cases:**

```javascript
'fill-color': [
  'step',
  ['/', ['get', 'cases'], ['get', 'population']],
  '#ffffb2',
  0.001, '#fed976',
  0.01, '#fc4e2a',
  0.1, '#b10026'
]
```

**Real Estate:**

```javascript
'circle-radius': [
  'interpolate',
  ['exponential', 2],
  ['get', 'price'],
  100000, 5,
  1000000, 20
],
'circle-color': [
  'interpolate',
  ['linear'],
  ['get', 'price_per_sqft'],
  0, '#ffffcc',
  400, '#41b6c4',
  800, '#253494'
]
```

## Quick Decisions

**Need to show regional statistics?**
→ Use choropleth with `fill` layer

**Need to show point density?**
→ Use `heatmap` layer

**Need to show point magnitude?**
→ Use `circle` layer with data-driven radius

**Need 3D visualization?**
→ Use `fill-extrusion` layer

**Need to animate over time?**
→ Use `setData()` with time-based filtering

**Large dataset (> 10 MB)?**
→ Use vector tiles instead of GeoJSON

**Need dynamic hover effects?**
→ Use feature state instead of updating data

**Color-blind friendly?**
→ Use blue-orange or purple-green, avoid red-green

## Expression Patterns

**Safe Property Access:**

```javascript
['case', ['has', 'property'], ['get', 'property'], defaultValue];
```

**Calculations:**

```javascript
// Divide
['/', ['get', 'numerator'], ['get', 'denominator']][
  // Multiply
  ('*', ['get', 'value'], 1.5)
][
  // Percentage
  ('*', ['/', ['get', 'part'], ['get', 'total']], 100)
];
```

## Resources

- [Mapbox Expression Reference](https://docs.mapbox.com/style-spec/reference/expressions/)
- [ColorBrewer](https://colorbrewer2.org/) - Accessible color scales
- [Turf.js](https://turfjs.org/) - Spatial analysis
