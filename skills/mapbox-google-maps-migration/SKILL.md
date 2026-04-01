---
name: mapbox-google-maps-migration
description: Migration guide for developers moving from Google Maps Platform to Mapbox GL JS, covering API equivalents, pattern translations, and key differences
---

# Mapbox Google Maps Migration Skill

Comprehensive guidance for migrating from Google Maps Platform to Mapbox GL JS. Provides API equivalents, pattern translations, and strategies for successful migration.

## Core Philosophy Differences

### Google Maps: Imperative & Object-Oriented

- Create objects (Marker, Polygon, etc.)
- Add to map with `.setMap(map)`
- Update properties with setters
- Heavy reliance on object instances

### Mapbox GL JS: Declarative & Data-Driven

- Add data sources
- Define layers (visual representation)
- Style with JSON
- Update data, not object properties

**Key Insight:** Mapbox treats everything as data + styling, not individual objects.

## Map Initialization

### Google Maps

```javascript
const map = new google.maps.Map(document.getElementById('map'), {
  center: { lat: 37.7749, lng: -122.4194 },
  zoom: 12,
  mapTypeId: 'roadmap' // or 'satellite', 'hybrid', 'terrain'
});
```

### Mapbox GL JS

```javascript
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12', // or satellite-v9, outdoors-v12
  center: [-122.4194, 37.7749], // [lng, lat] - note the order!
  zoom: 12
});
```

**Key Differences:**

- **Coordinate order:** Google uses `{lat, lng}`, Mapbox uses `[lng, lat]`
- **Authentication:** Google uses API key in script tag, Mapbox uses access token in code
- **Styling:** Google uses map types, Mapbox uses full style URLs

## API Equivalents Reference

### Map Methods

| Google Maps              | Mapbox GL JS                           | Notes                         |
| ------------------------ | -------------------------------------- | ----------------------------- |
| `map.setCenter(latLng)`  | `map.setCenter([lng, lat])`            | Coordinate order reversed     |
| `map.getCenter()`        | `map.getCenter()`                      | Returns LngLat object         |
| `map.setZoom(zoom)`      | `map.setZoom(zoom)`                    | Same behavior                 |
| `map.getZoom()`          | `map.getZoom()`                        | Same behavior                 |
| `map.panTo(latLng)`      | `map.panTo([lng, lat])`                | Animated pan                  |
| `map.fitBounds(bounds)`  | `map.fitBounds([[lng,lat],[lng,lat]])` | Different bound format        |
| `map.setMapTypeId(type)` | `map.setStyle(styleUrl)`               | Completely different approach |
| `map.getBounds()`        | `map.getBounds()`                      | Similar                       |

### Map Events

| Google Maps                                       | Mapbox GL JS           | Notes                 |
| ------------------------------------------------- | ---------------------- | --------------------- |
| `google.maps.event.addListener(map, 'click', fn)` | `map.on('click', fn)`  | Simpler syntax        |
| `event.latLng`                                    | `event.lngLat`         | Event property name   |
| `'center_changed'`                                | `'move'` / `'moveend'` | Different event names |
| `'zoom_changed'`                                  | `'zoom'` / `'zoomend'` | Different event names |
| `'bounds_changed'`                                | `'moveend'`            | No direct equivalent  |
| `'mousemove'`                                     | `'mousemove'`          | Same                  |
| `'mouseout'`                                      | `'mouseleave'`         | Different name        |

## Markers and Points

### Simple Marker

**Google Maps:**

```javascript
const marker = new google.maps.Marker({
  position: { lat: 37.7749, lng: -122.4194 },
  map: map,
  title: 'San Francisco',
  icon: 'custom-icon.png'
});

// Remove marker
marker.setMap(null);
```

**Mapbox GL JS:**

```javascript
// Create marker
const marker = new mapboxgl.Marker()
  .setLngLat([-122.4194, 37.7749])
  .setPopup(new mapboxgl.Popup().setText('San Francisco'))
  .addTo(map);

// Remove marker
marker.remove();
```

### Multiple Markers

**Google Maps:**

```javascript
const markers = locations.map(
  (loc) =>
    new google.maps.Marker({
      position: { lat: loc.lat, lng: loc.lng },
      map: map
    })
);
```

**Mapbox GL JS (Equivalent Approach):**

```javascript
// Same object-oriented approach
const markers = locations.map((loc) => new mapboxgl.Marker().setLngLat([loc.lng, loc.lat]).addTo(map));
```

**Mapbox GL JS (Data-Driven Approach - Recommended for 100+ points):**

```javascript
// Add as GeoJSON source + layer (uses WebGL, not DOM)
map.addSource('points', {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: locations.map((loc) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [loc.lng, loc.lat] },
      properties: { name: loc.name }
    }))
  }
});

map.addLayer({
  id: 'points-layer',
  type: 'circle', // or 'symbol' for icons
  source: 'points',
  paint: {
    'circle-radius': 8,
    'circle-color': '#ff0000'
  }
});
```

**Performance Advantage:** Google Maps renders all markers as DOM elements (even when using the Data Layer), which becomes slow with 500+ markers. Mapbox's circle and symbol layers are rendered by WebGL, making them much faster for large datasets (1,000-10,000+ points). This is a significant advantage when building applications with many points.

## Info Windows / Popups

### Google Maps

```javascript
const infowindow = new google.maps.InfoWindow({
  content: '<h3>Title</h3><p>Content</p>'
});

marker.addListener('click', () => {
  infowindow.open(map, marker);
});
```

### Mapbox GL JS

```javascript
// Option 1: Attach to marker
const marker = new mapboxgl.Marker()
  .setLngLat([-122.4194, 37.7749])
  .setPopup(new mapboxgl.Popup().setHTML('<h3>Title</h3><p>Content</p>'))
  .addTo(map);

// Option 2: On layer click (for data-driven markers)
map.on('click', 'points-layer', (e) => {
  const coordinates = e.features[0].geometry.coordinates.slice();
  const description = e.features[0].properties.description;

  new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
});
```

## Migration Strategy

### Step 1: Audit Current Implementation

Identify all Google Maps features you use:

- [ ] Basic map with markers
- [ ] Info windows/popups
- [ ] Polygons/polylines
- [ ] Geocoding
- [ ] Directions
- [ ] Clustering
- [ ] Custom styling
- [ ] Drawing tools
- [ ] Street View (no Mapbox equivalent)
- [ ] Other advanced features

### Step 2: Set Up Mapbox

```html
<!-- Replace Google Maps script -->
<script src="https://api.mapbox.com/mapbox-gl-js/v3.18.1/mapbox-gl.js"></script>
<link href="https://api.mapbox.com/mapbox-gl-js/v3.18.1/mapbox-gl.css" rel="stylesheet" />
```

### Step 3: Convert Core Map

Start with basic map initialization:

1. Replace `new google.maps.Map()` with `new mapboxgl.Map()`
2. Fix coordinate order (lat,lng -> lng,lat)
3. Update zoom/center

### Step 4: Convert Features One by One

Prioritize by complexity:

1. **Easy:** Map controls, basic markers
2. **Medium:** Popups, polygons, lines
3. **Complex:** Clustering, custom styling, data updates

### Step 5: Update Event Handlers

Change event syntax:

- `google.maps.event.addListener()` -> `map.on()`
- Update event property names (`latLng` -> `lngLat`)

### Step 6: Optimize for Mapbox

Take advantage of Mapbox features:

- Convert multiple markers to data-driven layers
- Use clustering (built-in)
- Leverage vector tiles for custom styling
- Use expressions for dynamic styling

### Step 7: Test Thoroughly

- Cross-browser testing
- Mobile responsiveness
- Performance with real data volumes
- Touch/gesture interactions

## Gotchas and Common Issues

### Coordinate Order

```javascript
// Google Maps
{ lat: 37.7749, lng: -122.4194 }

// Mapbox (REVERSED!)
[-122.4194, 37.7749]
```

**Always double-check coordinate order!**

### Event Properties

```javascript
// Google Maps
map.on('click', (e) => {
  console.log(e.latLng.lat(), e.latLng.lng());
});

// Mapbox
map.on('click', (e) => {
  console.log(e.lngLat.lat, e.lngLat.lng);
});
```

### Timing Issues

```javascript
// Google Maps - immediate
const marker = new google.maps.Marker({ map: map });

// Mapbox - wait for load
map.on('load', () => {
  map.addSource(...);
  map.addLayer(...);
});
```

### Removing Features

```javascript
// Google Maps
marker.setMap(null);

// Mapbox - must remove both
map.removeLayer('layer-id');
map.removeSource('source-id');
```

### Updating Data Without Flash

**Never** remove and re-add layers to update data — this reinitializes WebGL resources and causes a visible flash. Instead:

```javascript
// ✅ Update data in place (no flash)
map.getSource('stores').setData(newGeoJSON);

// ✅ Filter existing data (GPU-side, fastest)
map.setFilter('stores-layer', ['==', ['get', 'category'], 'coffee']);

// ❌ BAD: remove + re-add causes flash
map.removeLayer('stores-layer');
map.removeSource('stores');
map.addSource('stores', { ... });
map.addLayer({ ... });
```

## When NOT to Migrate

Consider staying with Google Maps if:

- **Street View is critical** - Mapbox doesn't have equivalent
- **Tight Google Workspace integration** - Places API deeply integrated
- **Already heavily optimized** - Migration cost > benefits
- **Team expertise** - Retraining costs too high
- **Short-term project** - Not worth migration effort

## Quick Reference: Side-by-Side Comparison

```javascript
// GOOGLE MAPS
const map = new google.maps.Map(el, {
  center: { lat: 37.7749, lng: -122.4194 },
  zoom: 12
});

const marker = new google.maps.Marker({
  position: { lat: 37.7749, lng: -122.4194 },
  map: map
});

google.maps.event.addListener(map, 'click', (e) => {
  console.log(e.latLng.lat(), e.latLng.lng());
});

// MAPBOX GL JS
mapboxgl.accessToken = 'YOUR_TOKEN';
const map = new mapboxgl.Map({
  container: el,
  center: [-122.4194, 37.7749], // REVERSED!
  zoom: 12,
  style: 'mapbox://styles/mapbox/streets-v12'
});

const marker = new mapboxgl.Marker()
  .setLngLat([-122.4194, 37.7749]) // REVERSED!
  .addTo(map);

map.on('click', (e) => {
  console.log(e.lngLat.lat, e.lngLat.lng);
});
```

**Remember:** lng, lat order in Mapbox!

## Additional Resources

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [Official Google Maps to Mapbox Migration Guide](https://docs.mapbox.com/help/tutorials/google-to-mapbox/)
- [Mapbox Examples](https://docs.mapbox.com/mapbox-gl-js/examples/)
- [Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)

## Integration with Other Skills

**Works with:**

- **mapbox-web-integration-patterns**: Framework-specific migration guidance
- **mapbox-web-performance-patterns**: Optimize after migration
- **mapbox-token-security**: Secure your Mapbox tokens properly
- **mapbox-geospatial-operations**: Use Mapbox's geospatial tools effectively
- **mapbox-search-patterns**: Migrate geocoding/search functionality

## Reference Files

The following reference files contain detailed migration guides for specific topics. Load them when working on those areas:

- **`references/shapes-geocoding.md`** — Polygons, Polylines, Custom Icons, Geocoding
- **`references/directions-controls.md`** — Directions/Routing, Controls
- **`references/clustering-styling.md`** — Clustering, Styling/Appearance
- **`references/data-performance.md`** — Data Updates, Performance, Common Migration Patterns (Store Locator, Drawing Tools, Heatmaps)
- **`references/api-services.md`** — API Services Comparison, Pricing, Plugins, Framework Integration, Testing, Migration Checklist

To load a reference, read the file relative to this skill directory, e.g.:

```
Load references/shapes-geocoding.md
```
