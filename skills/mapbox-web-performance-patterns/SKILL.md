---
name: mapbox-web-performance-patterns
description: Performance optimization patterns for Mapbox GL JS web applications. Covers initialization waterfalls, bundle size, rendering performance, memory management, and web optimization. Prioritized by impact on user experience.
---

# Mapbox Performance Patterns Skill

This skill provides performance optimization guidance for building fast, efficient Mapbox applications. Patterns are prioritized by impact on user experience, starting with the most critical improvements.

**Performance philosophy:** These aren't micro-optimizations. They show up as waiting time, jank, and repeat costs that hit every user session.

## Priority Levels

Performance issues are prioritized by their impact on user experience:

- **🔴 Critical (Fix First)**: Directly causes slow initial load or visible jank
- **🟡 High Impact**: Noticeable delays or increased resource usage
- **🟢 Optimization**: Incremental improvements for polish

---

## 🔴 Critical: Eliminate Initialization Waterfalls

**Problem:** Sequential loading creates cascading delays where each resource waits for the previous one.

**Note:** Modern bundlers (Vite, Webpack, etc.) and ESM dynamic imports automatically handle code splitting and library loading. The primary waterfall to eliminate is **data loading** - fetching map data sequentially instead of in parallel with map initialization.

### Anti-Pattern: Sequential Data Loading

```javascript
// ❌ BAD: Data loads AFTER map initializes
async function initMap() {
  const map = new mapboxgl.Map({
    container: 'map',
    accessToken: MAPBOX_TOKEN,
    style: 'mapbox://styles/mapbox/streets-v12'
  });

  // Wait for map to load, THEN fetch data
  map.on('load', async () => {
    const data = await fetch('/api/data'); // Waterfall!
    map.addSource('data', { type: 'geojson', data: await data.json() });
  });
}
```

**Timeline:** Map init (0.5s) → Data fetch (1s) = **1.5s total**

### Solution: Parallel Data Loading

```javascript
// ✅ GOOD: Data fetch starts immediately
async function initMap() {
  // Start data fetch immediately (don't wait for map)
  const dataPromise = fetch('/api/data').then((r) => r.json());

  const map = new mapboxgl.Map({
    container: 'map',
    accessToken: MAPBOX_TOKEN,
    style: 'mapbox://styles/mapbox/streets-v12'
  });

  // Data is ready when map loads
  map.on('load', async () => {
    const data = await dataPromise;
    map.addSource('data', { type: 'geojson', data });
    map.addLayer({
      id: 'data-layer',
      type: 'circle',
      source: 'data'
    });
  });
}
```

**Timeline:** Max(map init, data fetch) = **~1s total**

### Set Precise Initial Viewport

```javascript
// ✅ Set exact center/zoom so the map fetches the right tiles immediately
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-122.4194, 37.7749],
  zoom: 13
});

// Use 'idle' to know when the initial viewport is fully rendered
// (all tiles, sprites, and other resources are loaded; no transitions in progress)
map.once('idle', () => {
  console.log('Initial viewport fully rendered');
});
```

If you know the exact area users will see first, setting `center` and `zoom` upfront avoids the map starting at a default view and then panning/zooming to the target, which wastes tile fetches.

### Defer Non-Critical Features

```javascript
// ✅ Load critical features first, defer others
const map = new mapboxgl.Map({
  /* config */
});

map.on('load', () => {
  // 1. Add critical layers immediately
  addCriticalLayers(map);

  // 2. Defer secondary features
  // Note: Standard style 3D buildings can be toggled via config:
  // map.setConfigProperty('basemap', 'show3dObjects', false);
  requestIdleCallback(
    () => {
      addTerrain(map);
      addCustom3DLayers(map); // For classic styles with custom fill-extrusion layers
    },
    { timeout: 2000 }
  );

  // 3. Defer analytics and non-visual features
  setTimeout(() => {
    initializeAnalytics(map);
  }, 3000);
});
```

**Impact:** Significant reduction in time-to-interactive, especially when deferring terrain and 3D layers

---

## 🔴 Critical: Optimize Initial Bundle Size

**Problem:** Large bundles delay time-to-interactive on slow networks.

**Note:** Modern bundlers (Vite, Webpack, etc.) automatically handle code splitting for framework-based applications. The guidance below is most relevant for optimizing what gets bundled and when.

### Style JSON Bundle Impact

```javascript
// ❌ BAD: Inline massive style JSON (can be 500+ KB)
const style = {
  version: 8,
  sources: {
    /* 100s of lines */
  },
  layers: [
    /* 100s of layers */
  ]
};

// ✅ GOOD: Reference Mapbox-hosted styles
const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/streets-v12' // Fetched on demand
});

// ✅ OR: Store large custom styles externally
const map = new mapboxgl.Map({
  style: '/styles/custom-style.json' // Loaded separately
});
```

**Impact:** Reduces initial bundle by 30-50% when moving from inlined to hosted styles

---

## 🟡 High Impact: Optimize Marker Count

**Problem:** Too many markers causes slow rendering and interaction lag.

### Performance Thresholds

- **< 100 markers**: HTML markers OK (Marker class)
- **100-10,000 markers**: Use symbol layers (GPU-accelerated)
- **10,000+ markers**: Clustering recommended
- **100,000+ markers**: Vector tiles with server-side clustering

### Anti-Pattern: Thousands of HTML Markers

```javascript
// ❌ BAD: 5,000 HTML markers = 5+ second render, janky pan/zoom
restaurants.forEach((restaurant) => {
  const marker = new mapboxgl.Marker()
    .setLngLat([restaurant.lng, restaurant.lat])
    .setPopup(new mapboxgl.Popup().setHTML(restaurant.name))
    .addTo(map);
});
```

**Result:** 5,000 DOM elements, slow interactions, high memory

### Solution: Use Symbol Layers (GeoJSON)

```javascript
// ✅ GOOD: GPU-accelerated rendering, smooth at 10,000+ features
map.addSource('restaurants', {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: restaurants.map((r) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
      properties: { name: r.name, type: r.type }
    }))
  }
});

map.addLayer({
  id: 'restaurants',
  type: 'symbol',
  source: 'restaurants',
  layout: {
    'icon-image': 'restaurant',
    'icon-size': 0.8,
    'text-field': ['get', 'name'],
    'text-size': 12,
    'text-offset': [0, 1.5],
    'text-anchor': 'top'
  }
});

// Click handler (one listener for all features)
map.on('click', 'restaurants', (e) => {
  const feature = e.features[0];
  new mapboxgl.Popup().setLngLat(feature.geometry.coordinates).setHTML(feature.properties.name).addTo(map);
});
```

**Performance:** 10,000 features render in <100ms

### Solution: Clustering for High Density

```javascript
// ✅ GOOD: 50,000 markers → ~500 clusters at low zoom
map.addSource('restaurants', {
  type: 'geojson',
  data: restaurantsGeoJSON,
  cluster: true,
  clusterMaxZoom: 14, // Stop clustering at zoom 15
  clusterRadius: 50 // Radius relative to tile dimensions (512 = full tile width)
});

// Cluster circle layer
map.addLayer({
  id: 'clusters',
  type: 'circle',
  source: 'restaurants',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
  }
});

// Cluster count label
map.addLayer({
  id: 'cluster-count',
  type: 'symbol',
  source: 'restaurants',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-size': 12
  }
});

// Individual point layer
map.addLayer({
  id: 'unclustered-point',
  type: 'circle',
  source: 'restaurants',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#11b4da',
    'circle-radius': 6
  }
});
```

**Impact:** 50,000 markers at 60 FPS with smooth interaction

---

## 🟡 High Impact: Optimize Data Loading Strategy

**Problem:** Loading all data upfront wastes bandwidth and slows initial render.

### GeoJSON vs Vector Tiles Decision Matrix

| Scenario                  | Use GeoJSON | Use Vector Tiles |
| ------------------------- | ----------- | ---------------- |
| < 5 MB data               | Yes         | No               |
| 5-20 MB data              | Consider    | Yes              |
| > 20 MB data              | No          | Yes              |
| Data changes frequently   | Yes         | No               |
| Static data, global scale | No          | Yes              |
| Need server-side updates  | No          | Yes              |

### Viewport-Based Loading (GeoJSON)

**Note:** This pattern is applicable when hosting GeoJSON data locally or on external servers. Mapbox-hosted data sources are already optimized for viewport-based loading.

```javascript
// ✅ Only load data in current viewport
async function loadVisibleData(map) {
  const bounds = map.getBounds();
  const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(',');

  const data = await fetch(`/api/data?bbox=${bbox}&zoom=${map.getZoom()}`);

  map.getSource('data').setData(await data.json());
}

// Update on viewport change (with debounce)
let timeout;
map.on('moveend', () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => loadVisibleData(map), 300);
});
```

**Important:** `setData()` triggers a full re-parse of the GeoJSON in a web worker. For small datasets updated frequently, consider using `source.updateData()` (requires `dynamic: true` on the source) for partial updates. For large datasets, switch to vector tiles. **Note:** When both `dynamic: true` and `cluster: true` are set, `updateData()` triggers a full recluster, so the performance benefit over `setData()` is reduced.

### Progressive Data Loading

**Note:** This pattern is applicable when hosting GeoJSON data locally or on external servers.

```javascript
// ✅ Load basic data first, add details progressively
async function loadDataProgressive(map) {
  // 1. Load simplified data first (low-res)
  const simplified = await fetch('/api/data?detail=low');
  map.addSource('data', {
    type: 'geojson',
    data: await simplified.json()
  });
  addLayers(map);

  // 2. Load full detail in background
  const detailed = await fetch('/api/data?detail=high');
  map.getSource('data').setData(await detailed.json());
}
```

### Vector Tiles for Large Datasets

**Note:** The `minzoom`/`maxzoom` optimization shown below is primarily for self-hosted vector tilesets. Mapbox-hosted tilesets have built-in optimization via [Mapbox Tiling Service (MTS)](https://docs.mapbox.com/mapbox-tiling-service/guides/) recipes that handle zoom-level optimizations automatically.

```javascript
// ✅ Server generates tiles, client loads only visible area (self-hosted tilesets)
map.addSource('large-dataset', {
  type: 'vector',
  tiles: ['https://api.example.com/tiles/{z}/{x}/{y}.pbf'],
  minzoom: 0,
  maxzoom: 14
});

map.addLayer({
  id: 'large-dataset-layer',
  type: 'fill',
  source: 'large-dataset',
  'source-layer': 'data', // Layer name in .pbf
  paint: {
    'fill-color': '#088',
    'fill-opacity': 0.6
  }
});
```

**Impact:** 10 MB dataset reduced to ~500 KB per viewport load

---

## 🟡 High Impact: Optimize Map Interactions

**Problem:** Unthrottled event handlers cause performance degradation.

### Anti-Pattern: Expensive Operations on Every Event

```javascript
// ❌ BAD: Runs ~60 times per second during pan (once per render frame)
map.on('move', () => {
  updateVisibleFeatures(); // Expensive query
  fetchDataFromAPI(); // Network request
  updateUI(); // DOM manipulation
});
```

### Solution: Debounce/Throttle Events

```javascript
// ✅ GOOD: Throttle during interaction, finalize on idle
let throttleTimeout;

// Lightweight updates during move (throttled)
map.on('move', () => {
  if (throttleTimeout) return;
  throttleTimeout = setTimeout(() => {
    updateMapCenter(); // Cheap update
    throttleTimeout = null;
  }, 100);
});

// Expensive operations after interaction stops
map.on('moveend', () => {
  updateVisibleFeatures();
  fetchDataFromAPI();
  updateUI();
});
```

### Optimize Feature Queries

```javascript
// ❌ BAD: Query all features (expensive with many layers)
map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point);
  console.log(features); // Could be 100+ features from all layers
});

// ✅ GOOD: Query specific layers only
map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['restaurants', 'shops'] // Only query these layers
  });

  if (features.length > 0) {
    showPopup(features[0]);
  }
});

// ✅ For touch targets or fuzzy clicks: Use a bounding box
map.on('click', (e) => {
  const bbox = [
    [e.point.x - 5, e.point.y - 5],
    [e.point.x + 5, e.point.y + 5]
  ];
  const features = map.queryRenderedFeatures(bbox, {
    layers: ['restaurants'],
    filter: ['==', ['get', 'type'], 'pizza'] // Further narrow results
  });
});
```

### Batch DOM Updates

```javascript
// ❌ BAD: Update DOM for every feature
map.on('mousemove', 'restaurants', (e) => {
  e.features.forEach((feature) => {
    document.getElementById(feature.id).classList.add('highlight');
  });
});

// ✅ GOOD: Batch updates with requestAnimationFrame
let pendingUpdates = new Set();
let rafScheduled = false;

map.on('mousemove', 'restaurants', (e) => {
  e.features.forEach((f) => pendingUpdates.add(f.id));

  if (!rafScheduled) {
    rafScheduled = true;
    requestAnimationFrame(() => {
      pendingUpdates.forEach((id) => {
        document.getElementById(id).classList.add('highlight');
      });
      pendingUpdates.clear();
      rafScheduled = false;
    });
  }
});
```

**Impact:** 60 FPS maintained during interaction vs 15-20 FPS without optimization

---

## 🟡 High Impact: Memory Management

**Problem:** Memory leaks cause browser tabs to become unresponsive over time. In SPAs that create/destroy map instances, this is a common production issue.

### Always Clean Up Map Resources

```javascript
// ✅ Essential cleanup pattern
function cleanupMap(map) {
  if (!map) return;

  // 1. Remove event listeners
  map.off('load', handleLoad);
  map.off('move', handleMove);

  // 2. Remove layers (if adding/removing dynamically)
  if (map.getLayer('dynamic-layer')) {
    map.removeLayer('dynamic-layer');
  }

  // 3. Remove sources (if adding/removing dynamically)
  if (map.getSource('dynamic-source')) {
    map.removeSource('dynamic-source');
  }

  // 4. Remove controls
  map.removeControl(navigationControl);

  // 5. CRITICAL: Remove map instance
  map.remove();
}

// React example
useEffect(() => {
  const map = new mapboxgl.Map({
    /* config */
  });

  return () => {
    cleanupMap(map); // Called on unmount
  };
}, []);
```

### Clean Up Popups and Markers

```javascript
// ❌ BAD: Creates new popup on every click (memory leak)
map.on('click', 'restaurants', (e) => {
  new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(e.features[0].properties.name).addTo(map);
  // Popup never removed!
});

// ✅ GOOD: Reuse single popup instance
let popup = new mapboxgl.Popup({ closeOnClick: true });

map.on('click', 'restaurants', (e) => {
  popup.setLngLat(e.lngLat).setHTML(e.features[0].properties.name).addTo(map);
  // Previous popup content replaced, no leak
});

// Cleanup
function cleanup() {
  popup.remove();
  popup = null;
}
```

### Use Feature State Instead of New Layers

```javascript
// ❌ BAD: Create new layer for hover (memory overhead, causes re-render)
let hoveredFeatureId = null;

map.on('mousemove', 'restaurants', (e) => {
  if (map.getLayer('hover-layer')) {
    map.removeLayer('hover-layer');
  }
  map.addLayer({
    id: 'hover-layer',
    type: 'circle',
    source: 'restaurants',
    filter: ['==', ['id'], e.features[0].id],
    paint: { 'circle-color': 'yellow' }
  });
});

// ✅ GOOD: Use feature state (efficient, no layer creation)
map.on('mousemove', 'restaurants', (e) => {
  if (e.features.length > 0) {
    // Remove previous hover state
    if (hoveredFeatureId !== null) {
      map.setFeatureState({ source: 'restaurants', id: hoveredFeatureId }, { hover: false });
    }

    // Set new hover state
    hoveredFeatureId = e.features[0].id;
    map.setFeatureState({ source: 'restaurants', id: hoveredFeatureId }, { hover: true });
  }
});

// Style uses feature state
map.addLayer({
  id: 'restaurants',
  type: 'circle',
  source: 'restaurants',
  paint: {
    'circle-color': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      '#ffff00', // Yellow when hover
      '#0000ff' // Blue otherwise
    ]
  }
});
```

**Note:** Feature state requires features to have IDs. Use `generateId: true` on the GeoJSON source to auto-assign IDs, or use `promoteId` to use an existing property as the feature ID.

**Impact:** Prevents memory growth from continuous layer churn over long sessions

---

## 🟢 Optimization: Mobile Performance

**Problem:** Mobile devices have limited resources (CPU, GPU, memory, battery).

### Mobile-Specific Optimizations

```javascript
// Detect mobile device
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',

  // Mobile optimizations
  ...(isMobile && {
    // Limit max zoom to reduce tile fetching at extreme zoom levels
    maxZoom: 18,

    // fadeDuration controls the label collision fade-in/fade-out animation
    // Reducing it makes label transitions snappier
    fadeDuration: 0
  })
});

// Load simpler layers on mobile
map.on('load', () => {
  if (isMobile) {
    // Circle layers are cheaper than symbol layers (no collision detection,
    // no texture atlas, no text shaping)
    map.addLayer({
      id: 'markers-mobile',
      type: 'circle',
      source: 'data',
      paint: {
        'circle-radius': 8,
        'circle-color': '#007cbf'
      }
    });
  } else {
    // Rich desktop rendering with icons and labels
    map.addLayer({
      id: 'markers-desktop',
      type: 'symbol',
      source: 'data',
      layout: {
        'icon-image': 'marker',
        'icon-size': 1,
        'text-field': ['get', 'name'],
        'text-size': 12,
        'text-offset': [0, 1.5]
      }
    });
  }
});
```

### Touch Interaction Optimization

```javascript
// ✅ Simplify touch gestures
map.touchZoomRotate.disableRotation(); // Disable rotation (simpler gestures, fewer accidental rotations)

// Debounce expensive operations during touch
let touchTimeout;
map.on('touchmove', () => {
  if (touchTimeout) clearTimeout(touchTimeout);
  touchTimeout = setTimeout(() => {
    updateVisibleData();
  }, 500); // Wait for touch to settle
});
```

### Performance-Sensitive Constructor Options

```javascript
// These options have real GPU/performance costs -- only enable when needed
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',

  // Default false -- only set true if you need map.getCanvas().toDataURL()
  // Costs: prevents GPU buffer optimization
  preserveDrawingBuffer: false,

  // Default false -- only set true if you need smooth diagonal lines
  // Costs: enables MSAA which increases GPU memory and fill cost
  antialias: false
});
```

---

## 🟢 Optimization: Layer and Style Performance

### Consolidate Layers

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

### Simplify Expressions for Large Datasets

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

### Use Zoom-Based Layer Visibility

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

---

## Summary: Performance Checklist

When building a Mapbox application, verify these optimizations in order:

### 🔴 Critical (Do First)

- [ ] Load map library and data in parallel (eliminate waterfalls)
- [ ] Use dynamic imports for map code (reduce initial bundle)
- [ ] Defer non-critical features (terrain, custom 3D layers, analytics)
- [ ] Use symbol layers for > 100 markers (not HTML markers)
- [ ] Implement viewport-based data loading for large datasets

### 🟡 High Impact

- [ ] Debounce/throttle map event handlers
- [ ] Optimize queryRenderedFeatures with layers filter and bounding box
- [ ] Use GeoJSON for < 5 MB, vector tiles for > 20 MB
- [ ] Always call map.remove() on cleanup in SPAs
- [ ] Reuse popup instances (don't create on every interaction)
- [ ] Use feature state instead of dynamic layers for hover/selection

### 🟢 Optimization

- [ ] Consolidate multiple layers with data-driven styling
- [ ] Add mobile-specific optimizations (circle layers, disabled rotation)
- [ ] Set minzoom/maxzoom on layers to avoid rendering at irrelevant zoom levels
- [ ] Avoid enabling preserveDrawingBuffer or antialias unless needed

### Measurement

```javascript
// Measure initial load time
console.time('map-load');
map.on('load', () => {
  console.timeEnd('map-load');
  // isStyleLoaded() returns true when the style is fully loaded (not tiles/sprites)
  console.log('Style loaded:', map.isStyleLoaded());
});

// Monitor frame rate
let frameCount = 0;
map.on('render', () => frameCount++);
setInterval(() => {
  console.log('FPS:', frameCount);
  frameCount = 0;
}, 1000);

// Check memory usage (Chrome DevTools -> Performance -> Memory)
```

**Target metrics:**

- **Time to Interactive:** < 2 seconds on 3G
- **Frame Rate:** 60 FPS during pan/zoom
- **Memory Growth:** < 10 MB per hour of usage
- **Bundle Size:** < 500 KB initial (map lazy-loaded)
