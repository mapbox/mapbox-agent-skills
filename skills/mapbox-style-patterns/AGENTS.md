# Mapbox Style Patterns

Quick reference for common style patterns, layer configurations, and data-driven styling.

## Standard style + config first

```javascript
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard',
  config: { basemap: { theme: 'default' } }
});

map.setConfigProperty('basemap', 'theme', 'faded'); // never setStyle() for an incremental change
map.setConfigProperty('basemap', 'lightPreset', 'night'); // dark mode
```

Config covers ~95% of design needs. Keys (identical on GL JS / Android / iOS / Flutter): `lightPreset` (`dawn|day|dusk|night`), `theme` (`default|faded|monochrome|custom`), `showPlaceLabels`, `showPointOfInterestLabels`, `showRoadLabels`, `showTransitLabels`, `showLandmarkIcons`, `showAdminBoundaries`, `showPedestrianRoads`, `showIndoor`, `show3dObjects` (+ `show3dBuildings`, `show3dLandmarks`, `show3dTrees`, `show3dFacades`), `densityPointOfInterestLabels` (1–5), and the `color*` overrides. Full list with per-SDK version gates: [Standard API reference](https://docs.mapbox.com/map-styles/standard/api/) — see the **mapbox-cartography** skill for the annotated surface.

**Every custom layer needs `slot` + emissive strength:**

| Slot     | Position                               | Put here                                     |
| -------- | -------------------------------------- | -------------------------------------------- |
| `bottom` | Above land/water, **below** roads      | Rasters, terrain, choropleth fills           |
| `middle` | Above roads, **behind** 3D and labels  | Most overlays, **routes**, custom POI layers |
| `top`    | Above POI labels, behind place/transit | Markers, active selections                   |

No slot = projection-dependent placement (above everything in non-globe projections, below labels under `globe`, GL JS's default) — always set one. On fill / line / circle layers, missing emissive strength (`fill-`, `line-`, `circle-emissive-strength`, all defaulting to `0`) = nearly invisible at `dusk`/`night`; symbol layers already default to `1`. Routes also need `line-occlusion-opacity: 1`. See the **mapbox-cartography** skill.

**Reach for a Classic style** (`streets-v12`, `light-v11`, `dark-v11`, `outdoors-v12`, `satellite-v9`, `satellite-streets-v12`) only when you need a server-rendered raster (the Static Images API can't render Standard), per-layer paint control config can't express, or a deliberate 2D fallback. Classic has no slots and no config surface — you hand-order layers with a `beforeId`.

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
// ✅ Fade in by zoom. `visibility` is a plain enum and does NOT accept
// expressions — vary an opacity property instead, which also gives a fade.
'fill-opacity': [
  'interpolate', ['linear'],
  ['zoom'],
  10, 0,    // invisible at zoom 10
  11.5, 1   // fully faded in by 11.5
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
  slot: 'middle',
  source: 'points',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
    'circle-emissive-strength': 1
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
// ✅ Conditional styling — sequential ramp, not green/yellow/red.
// Ordered data needs an ordered ramp, and a green-to-red scale is the most
// common colorblind failure.
'circle-color': [
  'case',
  ['<', ['get', 'value'], 10], '#deebf7',  // Low
  ['<', ['get', 'value'], 20], '#6baed6',  // Mid
  '#08519c'  // High
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
// ✅ minzoom/maxzoom saves real GPU work — but pair it with a fade, or features
// pop into existence. Set the bound 1-2 levels BELOW where the layer should
// appear, then interpolate opacity across that band.
map.addLayer({
  id: 'layer',
  type: 'fill',
  slot: 'bottom',
  source: 'source',
  minzoom: 10, // culled below 10
  maxzoom: 16,
  paint: {
    'fill-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0, 11.5, 0.7],
    'fill-emissive-strength': 1
  }
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

### Layer position: slots, not beforeId

```javascript
// ✅ On Standard: use a slot. Mapbox owns the basemap layer order.
map.addLayer({
  id: 'new-layer',
  type: 'fill',
  slot: 'bottom',
  source: 'source',
  paint: { 'fill-opacity': 0.7, 'fill-emissive-strength': 1 }
});

// Two layers in the same slot keep their insertion order.

// ⚠️ beforeId against a *basemap* layer only works on Classic styles, where
// you own the whole stack. On Standard, use a slot instead.
map.addLayer({ id: 'new-layer', type: 'fill', source: 'source' }, 'existing-layer-id');
```

## Common Use Cases

### Choropleth Map

```javascript
map.addLayer({
  id: 'choropleth',
  type: 'fill',
  slot: 'bottom', // roads draw over it, keeping the network as context
  source: 'counties',
  paint: {
    // Sequential ColorBrewer (Blues). Never rainbow for ordered data.
    'fill-color': ['interpolate', ['linear'], ['get', 'density'], 0, '#f7fbff', 100, '#08519c'],
    'fill-opacity': 0.7, // cap at 0.7 so the basemap reads through
    'fill-emissive-strength': 1
  }
});
```

### Route Visualization

```javascript
map.addLayer({
  id: 'route',
  type: 'line',
  slot: 'middle', // above roads, under labels and 3D — NOT `top`
  source: 'route',
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': '#0080ff', // route = user content, where brand color belongs
    'line-width': 5,
    'line-opacity': 0.8,
    'line-emissive-strength': 1,
    'line-occlusion-opacity': 1 // 3D buildings don't hide the route
  }
});
```

### 3D Buildings

**On Standard this is config, not a layer** — Standard already ships high-detail 3D buildings and landmarks:

```javascript
map.setConfigProperty('basemap', 'show3dObjects', true);
// also: show3dBuildings, show3dLandmarks
```

Extruding **your own** polygons is still a layer. 3D layers are scene-lit, so no emissive override:

```javascript
map.addLayer({
  id: 'buildings',
  type: 'fill-extrusion',
  slot: 'middle',
  source: 'my-buildings',
  paint: {
    'fill-extrusion-color': '#aaa',
    'fill-extrusion-height': ['get', 'height'],
    'fill-extrusion-base': ['get', 'min_height'],
    'fill-extrusion-opacity': 0.8
  }
});
```

> The `source: 'composite'` + `source-layer: 'building'` form extrudes the _basemap's_ buildings and is **Classic styles only**. Fade it in from z13, never below.

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

// ✅ Find custom layers missing a slot (they'll draw over the labels)
map
  .getStyle()
  .layers.filter((l) => !l.slot && !l.id.startsWith('basemap'))
  .forEach((l) => console.warn('no slot:', l.id));

// ✅ Verify night legibility — the fastest way to catch missing emissive strength
map.setConfigProperty('basemap', 'lightPreset', 'night');
```

## Symptom → cause

| Symptom                                    | Cause                                                                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Custom layer covers the street labels      | Missing `slot`                                                                                                       |
| Layer nearly invisible at dusk/night       | Missing `*-emissive-strength: 1`                                                                                     |
| Route disappears behind 3D buildings       | Missing `line-occlusion-opacity`                                                                                     |
| Dark map came out solid black              | Pre-darkened `color*` override + `lightPreset: 'night'` (config colors are **day** values; Standard re-derives them) |
| Icons randomly missing                     | `icon-allow-overlap` defaults to `false`                                                                             |
| Street names float with no road under them | No lightness step between land and roads                                                                             |
