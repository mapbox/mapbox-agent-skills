# Layer and Style Performance

## Consolidate Layers

```javascript
// ❌ BAD: 20 separate layers for restaurant types
restaurantTypes.forEach((type) => {
  map.addLayer({
    id: `restaurants-${type}`,
    type: 'symbol',
    source: 'restaurants',
    filter: ['==', ['get', 'type'], type],
    layout: { 'icon-image': `${type}-icon` }
  });
});

// ✅ GOOD: Single layer with data-driven styling
map.addLayer({
  id: 'restaurants',
  type: 'symbol',
  source: 'restaurants',
  layout: {
    'icon-image': [
      'match',
      ['get', 'type'],
      'pizza',
      'pizza-icon',
      'burger',
      'burger-icon',
      'sushi',
      'sushi-icon',
      'default-icon' // fallback
    ]
  }
});
```

**Impact:** Fewer layers means less rendering overhead. Each layer has fixed per-layer cost regardless of feature count.

## Simplify Expressions for Large Datasets

For datasets with 100,000+ features, simpler expressions reduce per-feature evaluation cost. For smaller datasets, the expression engine is fast enough that this won't be noticeable.

```javascript
// Zoom-dependent paint properties MUST use step or interpolate, not comparisons
// ❌ WRONG: Cannot use comparison operators on ['zoom'] in paint properties
// paint: { 'fill-extrusion-height': ['case', ['>', ['zoom'], 16], ...] }

// ✅ CORRECT: Use step for discrete zoom breakpoints
map.addLayer({
  id: 'buildings',
  type: 'fill-extrusion',
  source: 'buildings',
  paint: {
    'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#dedede', 50, '#a0a0a0', 100, '#606060'],
    'fill-extrusion-height': [
      'step',
      ['zoom'],
      ['get', 'height'], // Default: use raw height
      16,
      ['*', ['get', 'height'], 1.5] // At zoom 16+: scale up
    ]
  }
});
```

For very large GeoJSON datasets, pre-computing static property derivations (like color categories) into the source data can reduce per-feature expression work:

```javascript
// ✅ Pre-compute STATIC derivations for large datasets (100K+ features)
const buildingsWithColor = {
  type: 'FeatureCollection',
  features: buildings.features.map((f) => ({
    ...f,
    properties: {
      ...f.properties,
      heightColor: getColorForHeight(f.properties.height) // Pre-computed once
    }
  }))
};

map.addSource('buildings', { type: 'geojson', data: buildingsWithColor });

map.addLayer({
  id: 'buildings',
  type: 'fill-extrusion',
  source: 'buildings',
  paint: {
    'fill-extrusion-color': ['get', 'heightColor'], // Simple property lookup
    'fill-extrusion-height': ['get', 'height']
  }
});
```

## Use Zoom-Based Layer Visibility

```javascript
// ✅ Only render layers at appropriate zoom levels
map.addLayer({
  id: 'building-details',
  type: 'fill',
  source: 'buildings',
  minzoom: 15, // Render at zoom 15 and above
  paint: { 'fill-color': '#aaa' }
});

map.addLayer({
  id: 'poi-labels',
  type: 'symbol',
  source: 'pois',
  minzoom: 12, // Hide at low zoom levels where labels would overlap heavily
  layout: {
    'text-field': ['get', 'name'],
    visibility: 'visible'
  }
});
```

**Note:** `minzoom` is inclusive (layer visible at that zoom), `maxzoom` is exclusive (layer hidden at that zoom). A layer with `maxzoom: 16` is visible up to but not including zoom 16.

**Impact:** Reduces GPU work at zoom levels where layers aren't useful
