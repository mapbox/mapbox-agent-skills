# Mapbox Style Patterns

Quick reference for common style patterns, layer configurations, and data-driven styling.

## Layer Types Quick Reference

| Layer Type         | Use For                     | Key Properties                       |
| ------------------ | --------------------------- | ------------------------------------ |
| **fill**           | Polygons (countries, parks) | `fill-color`, `fill-opacity`         |
| **line**           | Roads, boundaries           | `line-color`, `line-width`           |
| **symbol**         | Labels, icons               | `text-field`, `icon-image`           |
| **circle**         | Points (markers, heatmap)   | `circle-radius`, `circle-color`      |
| **heatmap**        | Density visualization       | `heatmap-intensity`, `heatmap-color` |
| **fill-extrusion** | 3D buildings                | `fill-extrusion-height`              |
| **raster**         | Satellite, aerial imagery   | `raster-opacity`                     |

## Data-Driven Styling Patterns

### Based on Property Value

```javascript
// ✅ Color by category
'fill-color': [
  'match',
  ['get', 'type'],
  'park', '#90EE90',
  'water', '#87CEEB',
  'urban', '#D3D3D3',
  '#CCCCCC' // default
]

// ✅ Size by numeric value
'circle-radius': [
  'interpolate', ['linear'],
  ['get', 'population'],
  0, 5,
  1000000, 20
]
```

### Based on Zoom Level

```javascript
// ✅ Show/hide by zoom
'visibility': [
  'step',
  ['zoom'],
  'none',  // Hidden below zoom 10
  10, 'visible'
]

// ✅ Size by zoom
'text-size': [
  'interpolate', ['linear'],
  ['zoom'],
  8, 10,    // Small at zoom 8
  16, 18    // Large at zoom 16
]
```

## Common Patterns

### 1. Clustering

```javascript
map.addSource('points', {
  type: 'geojson',
  data: geojson,
  cluster: true,
  clusterRadius: 50,
  clusterMaxZoom: 14
});

// Cluster circles
map.addLayer({
  id: 'clusters',
  type: 'circle',
  source: 'points',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
  }
});
```

### 2. Feature State (Hover/Selection)

```javascript
// ✅ Hover effect without modifying data
map.on('mousemove', 'layer', (e) => {
  if (hoveredId) {
    map.setFeatureState(
      { source: 'source', id: hoveredId },
      { hover: false }
    );
  }
  hoveredId = e.features[0].id;
  map.setFeatureState(
    { source: 'source', id: hoveredId },
    { hover: true }
  );
});

// Style based on state
'fill-color': [
  'case',
  ['boolean', ['feature-state', 'hover'], false],
  '#0080ff',  // Hover color
  '#3bb2d0'   // Default color
]
```

### 3. Filters

```javascript
// ✅ Filter by property
map.setFilter('layer', ['==', ['get', 'type'], 'restaurant']);

// ✅ Filter by multiple conditions
map.setFilter('layer', ['all', ['==', ['get', 'type'], 'restaurant'], ['>', ['get', 'rating'], 4]]);

// ✅ Filter by zoom
map.setFilter('layer', ['all', ['>=', ['zoom'], 10], ['<', ['zoom'], 14]]);
```

### 4. Expressions

```javascript
// ✅ Conditional styling
'circle-color': [
  'case',
  ['<', ['get', 'value'], 10], '#00ff00',  // Green if < 10
  ['<', ['get', 'value'], 20], '#ffff00',  // Yellow if < 20
  '#ff0000'  // Red otherwise
]

// ✅ Math operations
'circle-radius': [
  '*',
  ['sqrt', ['get', 'population']],
  0.01
]

// ✅ String concatenation
'text-field': ['concat', 'Population: ', ['get', 'pop']]
```

## Performance Patterns

### Vector Tiles vs GeoJSON

**Use vector tiles when:**

- Large datasets (>5MB)
- Need different zoom levels
- Want server-side updates

**Use GeoJSON when:**

- Small datasets (<5MB)
- Frequent client-side updates
- Simple implementation needed

### Layer Optimization

```javascript
// ✅ Set minzoom/maxzoom
map.addLayer({
  id: 'layer',
  minzoom: 10, // Only show zoom 10+
  maxzoom: 16 // Hide above zoom 16
});

// ✅ Use feature state instead of removing/re-adding
// Bad: map.removeLayer() / map.addLayer()
// Good: map.setFeatureState()

// ✅ Combine similar layers
// Bad: Separate layer for each category
// Good: One layer with data-driven styling
```

## Style Management

### Dynamic Style Updates

```javascript
// ✅ Update paint property
map.setPaintProperty('layer', 'fill-color', '#ff0000');

// ✅ Update layout property
map.setLayoutProperty('layer', 'visibility', 'none');

// ✅ Update source data
map.getSource('source').setData(newGeojson);

// ✅ Batch updates (better performance)
map.once('idle', () => {
  // Multiple style changes here
});
```

### Before Layers

```javascript
// ✅ Insert layer at specific position
map.addLayer(
  {
    id: 'new-layer',
    type: 'fill',
    source: 'source'
  },
  'existing-layer-id'
); // Insert before this layer
```

## Common Use Cases

### Choropleth Map

```javascript
map.addLayer({
  id: 'choropleth',
  type: 'fill',
  source: 'counties',
  paint: {
    'fill-color': ['interpolate', ['linear'], ['get', 'density'], 0, '#f7fbff', 100, '#08519c'],
    'fill-opacity': 0.7
  }
});
```

### Route Visualization

```javascript
map.addLayer({
  id: 'route',
  type: 'line',
  source: 'route',
  paint: {
    'line-color': '#0080ff',
    'line-width': 5,
    'line-opacity': 0.8
  }
});
```

### 3D Buildings

```javascript
map.addLayer({
  id: 'buildings',
  type: 'fill-extrusion',
  source: 'composite',
  'source-layer': 'building',
  paint: {
    'fill-extrusion-color': '#aaa',
    'fill-extrusion-height': ['get', 'height'],
    'fill-extrusion-base': ['get', 'min_height'],
    'fill-extrusion-opacity': 0.8
  }
});
```

## Quick Reference: Expression Types

| Type         | Function                 | Example            |
| ------------ | ------------------------ | ------------------ |
| **Decision** | match, case              | Color by category  |
| **Ramp**     | interpolate, step        | Size by value      |
| **Math**     | +, -, \*, /, %           | Calculate values   |
| **String**   | concat, upcase, downcase | Format labels      |
| **Lookup**   | get, has, at             | Access properties  |
| **Zoom**     | zoom                     | Zoom-based styling |

## Debugging Tips

```javascript
// ✅ Check if layer exists
if (map.getLayer('layer-id')) {
  map.removeLayer('layer-id');
}

// ✅ Check if source exists
if (map.getSource('source-id')) {
  map.removeSource('source-id');
}

// ✅ List all layers
console.log(map.getStyle().layers);

// ✅ Get layer paint properties
console.log(map.getPaintProperty('layer', 'fill-color'));
```
