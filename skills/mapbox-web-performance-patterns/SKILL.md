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
  // isStyleLoaded() returns true when style, sources, tiles, sprites, and models are all loaded
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

---

## Reference Files

For detailed patterns on specific topics, load the corresponding reference file:

- **`references/data-loading.md`** — GeoJSON vs Vector Tiles decision matrix, viewport-based loading, progressive loading, vector tiles for large datasets
- **`references/interactions.md`** — Debounce/throttle events, optimize feature queries, batch DOM updates
- **`references/memory.md`** — Map cleanup patterns, popup/marker reuse, feature state vs dynamic layers
- **`references/mobile.md`** — Device detection, mobile-optimized layers, touch interaction, constructor options
- **`references/layers-styles.md`** — Consolidate layers with data-driven styling, simplify expressions, zoom-based visibility
