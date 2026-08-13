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
  slot: 'top',
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
    ],
    'icon-allow-overlap': true
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
  slot: 'middle',
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
  slot: 'middle',
  source: 'buildings',
  paint: {
    'fill-extrusion-color': ['get', 'heightColor'], // Simple property lookup
    'fill-extrusion-height': ['get', 'height']
  }
});
```

## Use Zoom-Based Layer Visibility — with a Fade

Culling layers by zoom is a genuine performance win. But a bare `minzoom` makes features **pop** into existence mid-pinch, which reads as a rendering bug. Get both: keep the cull, and set the bound 1–2 levels _below_ where the layer should become visible, then fade opacity in across that band.

```javascript
// ✅ Culled at low zoom AND visually continuous
map.addLayer({
  id: 'building-details',
  type: 'fill',
  slot: 'bottom',
  source: 'buildings',
  minzoom: 13, // culled below 13 — no GPU work spent down there
  paint: {
    'fill-color': '#aaa',
    // ...but faded in from 13 to 15, so nothing snaps on
    'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 15, 1],
    'fill-emissive-strength': 1
  }
});

map.addLayer({
  id: 'poi-labels',
  type: 'symbol',
  slot: 'top',
  source: 'pois',
  minzoom: 11, // one level below the intended appearance at 12
  layout: {
    'text-field': ['get', 'name'],
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12,
    'text-optional': true
  },
  paint: {
    'text-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0, 12, 1]
  }
});
```

The fade costs one expression evaluation over a two-zoom band. The cull saves whole draw calls at every zoom below it — you keep essentially all of the performance benefit.

**Note:** `minzoom` is inclusive (layer visible at that zoom), `maxzoom` is exclusive (layer hidden at that zoom). A layer with `maxzoom: 16` is visible up to but not including zoom 16.

> `visibility` is a plain enum (`'visible'` / `'none'`) and does **not** accept expressions. Toggling it is also an all-or-nothing snap. For zoom-driven appearance use `minzoom`/`maxzoom` plus an opacity fade as above; reserve `visibility` for user-driven layer toggles.

**Impact:** Reduces GPU work at zoom levels where layers aren't useful, without the visual snap.

## Standard-style layer hygiene

Two properties every custom layer on the Standard style needs — both are free at runtime, and omitting them produces bugs that look like performance problems:

- **`slot`** (`bottom` / `middle` / `top`) — a layer with no slot draws above every basemap label. People often "fix" this by re-adding layers in a different order, which is far more expensive than setting the property.
- **emissive strength `1`** on fill / line / circle layers (`fill-`, `line-`, `circle-emissive-strength`) — these default to `0`, so without it the layer nearly vanishes under the `dusk` / `night` light presets. Symbol layers already default to `1`. Routes also want `line-occlusion-opacity: 1`.

See the **mapbox-cartography** skill.
