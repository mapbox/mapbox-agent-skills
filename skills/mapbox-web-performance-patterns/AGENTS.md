# Mapbox GL JS Performance Optimization Guide

Quick reference for optimizing Mapbox GL JS applications. Prioritized by impact: 🔴 Critical → 🟡 High Impact → 🟢 Optimization.

## 🔴 Critical Performance Patterns (Fix First)

### 1. Eliminate Initialization Waterfalls

**Impact:** Saves 500ms-2s on initial load

**Problem:** Sequential loading (map → data → render)
**Solution:** Parallel data fetching

```javascript
// ❌ Sequential: 1.5s total
map.on('load', async () => {
  const data = await fetch('/api/data'); // Waits for map first
});

// ✅ Parallel: ~1s total
const dataPromise = fetch('/api/data'); // Starts immediately
const map = new mapboxgl.Map({...});
map.on('load', async () => {
  const data = await dataPromise; // Already fetching
});
```

**Key principle:** Start all data fetches immediately, don't wait for map load.

### 2. Bundle Size Optimization

**Impact:** 200-500KB savings, faster load times

**Critical actions:**

- Use dynamic imports for large features: `const geocoder = await import('mapbox-gl-geocoder')`
- Code-split by route/feature
- Avoid importing entire Mapbox GL JS if only using specific features
- Use CSS splitting for mapbox-gl.css

**Size targets:** <500KB initial bundle, <200KB per route

## 🟡 High Impact Patterns

### 3. Marker Performance

**Impact:** Smooth rendering with 100+ markers

**Decision tree:**

- **< 50 markers:** HTML markers (`new mapboxgl.Marker()`) - OK for small counts
- **50-500 markers:** Canvas markers or Symbol layers - Much faster
- **500+ markers:** Symbol layers + clustering - Required for performance
- **1000+ markers:** Clustering is mandatory

```javascript
// ✅ For 100+ markers: Use symbol layer, not HTML markers
map.addLayer({
  id: 'points',
  type: 'symbol',
  source: 'points',
  layout: { 'icon-image': 'marker' }
});

// ✅ For 500+ markers: Add clustering
map.addSource('points', {
  type: 'geojson',
  data: geojson,
  cluster: true,
  clusterRadius: 50
});
```

### 4. Data Loading Strategy

**Impact:** Faster rendering, lower memory

**Decision tree:**

- **< 5MB GeoJSON:** Load directly as GeoJSON source
- **> 5MB GeoJSON:** Use vector tiles instead
- **Dynamic data:** Implement viewport-based loading
- **Static data:** Embed small datasets, fetch large ones

**Viewport-based loading pattern:**

```javascript
map.on('moveend', () => {
  const bounds = map.getBounds();
  fetchDataInBounds(bounds).then((data) => {
    map.getSource('data').setData(data);
  });
});
```

### 5. Event Handler Optimization

**Impact:** Prevents jank during interactions

**Rules:**

- Debounce search/geocoding: 300ms minimum
- Throttle move/zoom events: 100ms for analytics, 16ms for UI updates
- Use `once()` for one-time events
- Remove event listeners on cleanup

```javascript
// ✅ Debounce expensive operations
const debouncedSearch = debounce((query) => {
  geocode(query);
}, 300);

// ✅ Throttle frequent events
const throttledUpdate = throttle(() => {
  updateAnalytics(map.getCenter());
}, 100);
```

## 🟢 Optimization Patterns

### 6. Memory Management

**Critical for SPAs and long-running apps**

**Always cleanup on unmount:**

```javascript
// ✅ Remove map and all resources
map.remove(); // Removes all event listeners, sources, layers

// ✅ Cancel pending requests
controller.abort();

// ✅ Clear references
markers.forEach((m) => m.remove());
markers = [];
```

### 7. Layer Management

**Rules:**

- Use feature state instead of removing/re-adding layers
- Batch style changes: Use `map.once('idle', callback)` after multiple changes
- Hide layers with visibility: 'none' instead of removing
- Minimize layer count: Combine similar layers where possible

### 8. Rendering Optimization

**Key patterns:**

- Use `generateId: true` for better feature state performance
- Set `maxzoom` on sources to avoid over-fetching
- Use `promoteId` to avoid style mutations
- Disable collision detection if not needed: `'icon-allow-overlap': true`

## Quick Decision Guide

**Slow initial load?** → Check for waterfalls (data loading), optimize bundle size
**Jank with many markers?** → Switch to symbol layers + clustering
**Memory leaks in SPA?** → Add proper cleanup (`map.remove()`)
**Slow with large data?** → Use vector tiles, viewport loading
**Sluggish interactions?** → Debounce/throttle event handlers
**High memory usage?** → Use feature state instead of layer churn, check for listener leaks

## Performance Testing

**Measure what matters:**

- Time to Interactive (TTI): < 2s on 3G
- First Contentful Paint (FCP): < 1s
- Bundle size: < 500KB initial
- Memory: Stable over time (no leaks)

**Tools:** Chrome DevTools Performance tab, Lighthouse, Bundle analyzers (webpack-bundle-analyzer, vite-bundle-visualizer)

## Anti-Patterns to Avoid

❌ Loading data after map initialization (waterfall)
❌ Using HTML markers for 100+ points
❌ Not clustering 500+ markers
❌ Loading entire GeoJSON files > 5MB
❌ Not debouncing search/geocoding
❌ Forgetting to call `map.remove()` in SPAs
❌ Adding/removing layers frequently (use feature state)
❌ Not code-splitting large features
