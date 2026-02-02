---
name: mapbox-maplibre-migration
description: Migration guide between Mapbox GL JS and MapLibre GL JS, covering API compatibility, token handling, style differences, and feature parity in both directions
---

# Mapbox ↔ MapLibre Migration Skill

Expert guidance for migrating between Mapbox GL JS and MapLibre GL JS in either direction. Covers the fork history, API compatibility, key differences, and when to choose each library.

## Understanding the Fork

### History

**MapLibre GL JS** is an open-source fork of **Mapbox GL JS v1.13.0**, created in December 2020 when Mapbox changed their license starting with v2.0.

**Timeline:**
- **Pre-2020:** Mapbox GL JS was open source (BSD license)
- **Dec 2020:** Mapbox GL JS v2.0 introduced proprietary license
- **Dec 2020:** Community forked v1.13 as MapLibre GL JS
- **Present:** Both libraries continue active development

**Key Insight:** The APIs are ~95% identical because MapLibre started as a Mapbox fork. Most code works in both with minimal changes.

## Quick Comparison

| Aspect | Mapbox GL JS | MapLibre GL JS |
|--------|--------------|----------------|
| **License** | Proprietary (v2+) | BSD 3-Clause (Open Source) |
| **Cost** | Requires Mapbox account/billing | Free, but need tile source |
| **Tiles** | Mapbox vector tiles | OSM or custom tile sources |
| **Token** | Required (access token) | Optional (depends on tile source) |
| **3D Terrain** | ✅ Built-in | ✅ Available |
| **Sky Layer** | ✅ Yes | ✅ Yes |
| **Globe View** | ✅ v2.9+ | ✅ v3.0+ |
| **API Compatibility** | ~95% compatible with MapLibre | ~95% compatible with Mapbox |
| **Bundle Size** | ~500KB | ~450KB |
| **Community** | Mapbox + community | Fully community-driven |

## Migration Direction 1: Mapbox → MapLibre

### Why Migrate to MapLibre?

**Common reasons:**
- ✅ Open source license requirements
- ✅ Cost considerations (no Mapbox billing)
- ✅ Self-hosted tile infrastructure
- ✅ Community-driven development
- ✅ Avoiding vendor lock-in

### Step-by-Step Migration

#### 1. Update Package

```bash
# Remove Mapbox
npm uninstall mapbox-gl

# Install MapLibre
npm install maplibre-gl
```

#### 2. Update Imports

```javascript
// Before (Mapbox)
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// After (MapLibre)
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
```

Or with CDN:

```html
<!-- Before (Mapbox) -->
<script src='https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js'></script>
<link href='https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css' rel='stylesheet' />

<!-- After (MapLibre) -->
<script src='https://unpkg.com/maplibre-gl@3.0.0/dist/maplibre-gl.js'></script>
<link href='https://unpkg.com/maplibre-gl@3.0.0/dist/maplibre-gl.css' rel='stylesheet' />
```

#### 3. Update Map Initialization

```javascript
// Before (Mapbox)
mapboxgl.accessToken = 'pk.your_mapbox_token';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12', // or satellite-v9, outdoors-v12, light-v11, dark-v11
  center: [-122.4194, 37.7749],
  zoom: 12
});

// After (MapLibre)
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json', // or your own style
  center: [-122.4194, 37.7749],
  zoom: 12
});
// No token needed (unless your tile source requires one)
```

#### 4. Update Style URL

**Option A: Use OSM-based styles**
```javascript
// MapLibre demo tiles (OSM data)
style: 'https://demotiles.maplibre.org/style.json'

// Or other OSM-based providers
style: 'https://tiles.openfreemap.org/styles/liberty' // OpenFreeMap
```

**Option B: Self-hosted tiles**
```javascript
style: {
  version: 8,
  sources: {
    'osm': {
      type: 'raster',
      tiles: ['https://your-tile-server.com/{z}/{x}/{y}.png'],
      tileSize: 256
    }
  },
  layers: [{
    id: 'osm',
    type: 'raster',
    source: 'osm'
  }]
}
```

**Option C: Keep using Mapbox tiles (with token)**
```javascript
// You CAN still use Mapbox tiles with MapLibre by manually defining sources
// Note: MapLibre doesn't parse mapbox:// URLs, so you need to explicitly define the tile sources
const map = new maplibregl.Map({
  container: 'map',
  center: [-122.4194, 37.7749],
  zoom: 12,
  style: {
    version: 8,
    sources: {
      'mapbox-streets': {
        type: 'vector',
        tiles: [
          'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.mvt?access_token=YOUR_MAPBOX_TOKEN'
        ],
        minzoom: 0,
        maxzoom: 14
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#f8f8f8'
        }
      },
      {
        id: 'roads',
        type: 'line',
        source: 'mapbox-streets',
        'source-layer': 'road',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2
        }
      }
      // Add more layers as needed
    ]
  }
});
```

**Note:** For production use, you may want to use a complete Mapbox style.json. You can download a Mapbox style from the Mapbox Studio or Styles API, then manually replace any `mapbox://` source URLs with explicit tile URLs (as shown above) before using it with MapLibre.

#### 5. Update Marker/Popup Code

**Good news:** Marker and Popup APIs are identical!

```javascript
// Works in both Mapbox and MapLibre
const marker = new maplibregl.Marker() // or mapboxgl.Marker()
  .setLngLat([-122.4194, 37.7749])
  .setPopup(new maplibregl.Popup().setText('San Francisco'))
  .addTo(map);
```

Just replace `mapboxgl` with `maplibregl` and it works.

#### 6. Update Plugin Imports

Some Mapbox plugins need MapLibre alternatives:

| Mapbox Plugin | MapLibre Alternative |
|---------------|---------------------|
| `@mapbox/mapbox-gl-geocoder` | `@maplibre/maplibre-gl-geocoder` |
| `@mapbox/mapbox-gl-directions` | Use Mapbox API directly or custom solution |
| `@mapbox/mapbox-gl-draw` | `@maplibre/maplibre-gl-draw` (or original works) |
| `mapbox-gl-compare` | `maplibre-gl-compare` |

Example:
```javascript
// Before (Mapbox)
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

// After (MapLibre)
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
```

### What Changes: Summary

**Must change:**
- ✅ Package name (`mapbox-gl` → `maplibre-gl`)
- ✅ Import statements
- ✅ Style URL (can't use `mapbox://` without extra config)
- ✅ Remove `mapboxgl.accessToken` (unless using Mapbox tiles)

**Stays the same:**
- ✅ All map methods (`setCenter`, `setZoom`, `fitBounds`, etc.)
- ✅ All event handling (`map.on('click')`, etc.)
- ✅ Marker/Popup APIs
- ✅ Layer/source APIs
- ✅ GeoJSON handling
- ✅ Most plugin APIs

## Migration Direction 2: MapLibre → Mapbox

### Why Migrate to Mapbox?

**Common reasons:**
- ✅ Official support and SLAs
- ✅ Better global tile coverage and quality
- ✅ Mapbox-specific features (see Feature Parity below)
- ✅ Easier integration with Mapbox ecosystem
- ✅ Traffic-aware routing and directions
- ✅ Better satellite imagery

### Step-by-Step Migration

#### 1. Create Mapbox Account

1. Sign up at [mapbox.com](https://mapbox.com)
2. Get access token from account dashboard
3. Note: Mapbox has free tier (50,000 map loads/month)

#### 2. Update Package

```bash
# Remove MapLibre
npm uninstall maplibre-gl

# Install Mapbox
npm install mapbox-gl
```

#### 3. Update Imports

```javascript
// Before (MapLibre)
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// After (Mapbox)
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
```

#### 4. Add Access Token

```javascript
// Add this before map initialization
mapboxgl.accessToken = 'pk.your_mapbox_access_token';
```

**Token best practices:**
- Use environment variables: `process.env.VITE_MAPBOX_TOKEN`
- Add URL restrictions in Mapbox dashboard
- Use public tokens (pk.*) for client-side code
- Never commit tokens to git

See `mapbox-token-security` skill for details.

#### 5. Update Style URL

```javascript
// Before (MapLibre with OSM)
style: 'https://demotiles.maplibre.org/style.json'

// After (Mapbox)
style: 'mapbox://styles/mapbox/streets-v12'
// Other options: satellite-v9, outdoors-v12, light-v11, dark-v11
```

#### 6. Everything Else Stays the Same

All your map code, markers, popups, layers, events, etc. work identically!

```javascript
// This code works in BOTH libraries
map.on('load', () => {
  map.addSource('points', {
    type: 'geojson',
    data: geojsonData
  });

  map.addLayer({
    id: 'points-layer',
    type: 'circle',
    source: 'points',
    paint: {
      'circle-radius': 8,
      'circle-color': '#ff0000'
    }
  });
});
```

## Feature Parity

### Features in Both Libraries

✅ **Core mapping:**
- Vector tiles rendering
- Markers and popups
- Custom layers (sources + styling)
- GeoJSON support
- Event handling
- 3D buildings
- Terrain/hillshading
- Globe view (Mapbox v2.9+, MapLibre v3.0+)
- Sky layer

✅ **Performance:**
- WebGL rendering
- Clustering
- Data-driven styling
- Expression support

### Mapbox-Only Features

❌ **Not in MapLibre:**
- Mapbox-hosted vector tiles (streets, satellite, terrain)
- Mapbox Studio integration
- Mapbox APIs (Directions, Geocoding, Matrix, etc.)
- Mapbox-specific style features in newer versions
- Official commercial support/SLA
- Some newer experimental features

**Workaround:** You can use Mapbox APIs separately with MapLibre for the map rendering.

### MapLibre-Only Features

❌ **Not in Mapbox (or different):**
- BSD open source license
- Some community-contributed features
- Ability to use without any token
- Some performance optimizations specific to MapLibre

**Note:** Most MapLibre features are API-compatible with Mapbox.

## API Compatibility Matrix

### 100% Compatible APIs

These work identically in both libraries:

```javascript
// Map methods
map.setCenter([lng, lat])
map.setZoom(zoom)
map.fitBounds(bounds)
map.panTo([lng, lat])
map.flyTo({center, zoom})
map.getCenter()
map.getZoom()
map.getBounds()

// Events
map.on('load', callback)
map.on('click', callback)
map.on('move', callback)
map.on('zoom', callback)

// Markers
new mapboxgl.Marker() / new maplibregl.Marker()
marker.setLngLat([lng, lat])
marker.setPopup(popup)
marker.addTo(map)
marker.remove()

// Popups
new mapboxgl.Popup() / new maplibregl.Popup()
popup.setLngLat([lng, lat])
popup.setHTML(html)
popup.addTo(map)

// Sources & Layers
map.addSource(id, source)
map.removeSource(id)
map.addLayer(layer)
map.removeLayer(id)
map.getSource(id)
map.getLayer(id)

// Styling
map.setPaintProperty(layerId, property, value)
map.setLayoutProperty(layerId, property, value)
map.setFilter(layerId, filter)

// Controls
map.addControl(control, position)
new mapboxgl.NavigationControl() / new maplibregl.NavigationControl()
new mapboxgl.GeolocateControl() / new maplibregl.GeolocateControl()
```

### Minor Differences

**TypeScript types:**
- Mapbox: `@types/mapbox-gl` (community-maintained)
- MapLibre: Types included in package

**Version numbering:**
- Mapbox GL JS: Currently v3.x
- MapLibre GL JS: Currently v3.x (but different v3)

**Bundle:**
- Slightly different bundle sizes
- MapLibre often smaller

## Common Migration Issues

### Issue 1: Style URL Format

**Problem:**
```javascript
// This won't work in MapLibre without configuration
style: 'mapbox://styles/mapbox/streets-v12'
```

**Solution:**
```javascript
// Use MapLibre-compatible style URL
style: 'https://demotiles.maplibre.org/style.json'

// Or define Mapbox tiles explicitly in a custom style.json
// (see "Option C: Keep using Mapbox tiles" in the migration steps above)
```

### Issue 2: Plugin Compatibility

**Problem:**
```javascript
// @mapbox/mapbox-gl-geocoder won't work with MapLibre
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
```

**Solution:**
```javascript
// Use MapLibre-specific version
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';

// Or use Mapbox Geocoding API directly
fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/query.json?access_token=${token}`)
```

### Issue 3: Access Token

**Problem:**
```javascript
// MapLibre doesn't use accessToken by default
maplibregl.accessToken = 'pk.xxx'; // This does nothing
```

**Solution:**
```javascript
// MapLibre doesn't use accessToken - pass tokens in tile URLs instead
// If using Mapbox tiles with MapLibre, define them explicitly in style.json
// (see "Option C: Keep using Mapbox tiles" in the migration steps above)

// For Mapbox GL JS, token is required:
mapboxgl.accessToken = 'pk.xxx'; // Required
```

### Issue 4: CDN URLs

**Problem:**
```javascript
// Wrong CDN for library
<script src='https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js'></script>
// vs
<script src='https://unpkg.com/maplibre-gl@3.0.0/dist/maplibre-gl.js'></script>
```

**Solution:** Make sure CDN matches the library you're using.

## Side-by-Side Example

### Mapbox GL JS

```javascript
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.your_token';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-122.4194, 37.7749],
  zoom: 12
});

map.on('load', () => {
  new mapboxgl.Marker()
    .setLngLat([-122.4194, 37.7749])
    .setPopup(new mapboxgl.Popup().setText('San Francisco'))
    .addTo(map);
});
```

### MapLibre GL JS

```javascript
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// No token needed for OSM tiles

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-122.4194, 37.7749],
  zoom: 12
});

map.on('load', () => {
  new maplibregl.Marker()
    .setLngLat([-122.4194, 37.7749])
    .setPopup(new maplibregl.Popup().setText('San Francisco'))
    .addTo(map);
});
```

**What's different:** Package, import, style URL, token. **Everything else is identical.**

## Decision Guide

### Choose Mapbox GL JS When:

- ✅ Need official commercial support and SLAs
- ✅ Want best-in-class vector tiles without setup
- ✅ Using Mapbox APIs (Directions, Geocoding, etc.)
- ✅ Need latest Mapbox-specific features
- ✅ Budget allows for Mapbox pricing
- ✅ Want seamless Mapbox Studio integration
- ✅ Need global high-quality satellite imagery

### Choose MapLibre GL JS When:

- ✅ Need open source license (BSD)
- ✅ Cost is a primary concern (free rendering)
- ✅ Have your own tile infrastructure
- ✅ Want community-driven development
- ✅ Need to avoid vendor lock-in
- ✅ Have custom tile sources
- ✅ Don't need Mapbox-specific APIs

### Use Both?

**Yes, you can!**
- Render with MapLibre (free)
- Use Mapbox APIs for geocoding, directions, etc. (pay per request)
- Best of both worlds for some use cases

```javascript
// MapLibre for rendering
const map = new maplibregl.Map({...});

// Mapbox API for geocoding
fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/query.json?access_token=${token}`)
```

## Framework Integration

Both libraries work identically with frameworks. See `mapbox-web-integration-patterns` skill for detailed React, Vue, Svelte, Angular patterns.

### React Example (Works for Both)

```jsx
import { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl'; // or mapboxgl
import 'maplibre-gl/dist/maplibre-gl.css';

function MapComponent() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    // Only difference: token for Mapbox, style URL for both
    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-122.4194, 37.7749],
      zoom: 12
    });

    return () => {
      mapRef.current.remove();
    };
  }, []);

  return <div ref={mapContainerRef} style={{ height: '100vh' }} />;
}
```

Just swap `maplibregl` with `mapboxgl` and update token/style - everything else is identical!

## Testing Strategy

### Testing Cross-Compatibility

If you want to support both libraries:

```javascript
// Detect which library is available
const gl = typeof mapboxgl !== 'undefined' ? mapboxgl : maplibregl;

const map = new gl.Map({
  container: 'map',
  style: getStyle(), // Function that returns appropriate style
  center: [-122.4194, 37.7749],
  zoom: 12
});

function getStyle() {
  if (typeof mapboxgl !== 'undefined') {
    return 'mapbox://styles/mapbox/streets-v12';
  }
  return 'https://demotiles.maplibre.org/style.json';
}
```

### Unit Tests

```javascript
// Mock either library in tests
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(),
  Marker: jest.fn()
}));

// or

jest.mock('maplibre-gl', () => ({
  Map: jest.fn(),
  Marker: jest.fn()
}));
```

## Migration Checklist

### Mapbox → MapLibre

- [ ] Update package: `npm install maplibre-gl` (remove mapbox-gl)
- [ ] Update imports: `mapbox-gl` → `maplibre-gl`
- [ ] Update CSS imports
- [ ] Remove `mapboxgl.accessToken` line
- [ ] Update style URL to OSM/custom source
- [ ] Update all `mapboxgl.` references to `maplibregl.`
- [ ] Update plugins to MapLibre versions
- [ ] Test all map functionality
- [ ] Verify no Mapbox-specific features used
- [ ] Update documentation

### MapLibre → Mapbox

- [ ] Create Mapbox account and get token
- [ ] Update package: `npm install mapbox-gl` (remove maplibre-gl)
- [ ] Update imports: `maplibre-gl` → `mapbox-gl`
- [ ] Update CSS imports
- [ ] Add `mapboxgl.accessToken = 'pk.xxx'`
- [ ] Update style URL to Mapbox style
- [ ] Update all `maplibregl.` references to `mapboxgl.`
- [ ] Update plugins to Mapbox versions (if needed)
- [ ] Configure token security (URL restrictions)
- [ ] Test all map functionality
- [ ] Set up billing alerts
- [ ] Update documentation

## Performance Comparison

Both libraries have similar performance as they share the same core codebase:

| Metric | Mapbox GL JS | MapLibre GL JS |
|--------|--------------|----------------|
| **Bundle size** | ~500KB | ~450KB |
| **Initial load** | Similar | Similar |
| **Rendering** | WebGL-based | WebGL-based |
| **Memory usage** | Similar | Similar |
| **Clustering** | Built-in | Built-in |

**Key insight:** Performance is virtually identical. Choose based on features, licensing, and tile sources, not performance.

## Common Use Cases

### Use Case 1: Open Source Project

**Recommendation:** MapLibre GL JS
- Open source license compatible
- No token required
- Community-driven

### Use Case 2: Commercial Application

**Recommendation:** Either works
- Mapbox if budget allows and want official support
- MapLibre if cost-sensitive or have tile infrastructure

### Use Case 3: Existing Mapbox App

**Recommendation:** Evaluate migration cost
- If using Mapbox APIs heavily: Stay with Mapbox
- If just rendering: MapLibre could save costs
- Migration is straightforward but requires testing

### Use Case 4: Starting Fresh

**Recommendation:** Consider requirements
- Need Mapbox tiles/APIs? → Mapbox
- Have custom tiles? → MapLibre
- Budget-constrained? → MapLibre
- Want commercial support? → Mapbox

## Integration with Other Skills

**Works with:**
- **mapbox-web-integration-patterns**: Framework patterns work for both libraries
- **mapbox-web-performance-patterns**: Performance tips apply to both
- **mapbox-token-security**: If using Mapbox tiles or APIs
- **mapbox-google-maps-migration**: Can migrate from Google Maps to either library

## Resources

**Mapbox GL JS:**
- [Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [Examples](https://docs.mapbox.com/mapbox-gl-js/examples/)
- [GitHub](https://github.com/mapbox/mapbox-gl-js)

**MapLibre GL JS:**
- [Documentation](https://maplibre.org/maplibre-gl-js-docs/)
- [Examples](https://maplibre.org/maplibre-gl-js-docs/examples/)
- [GitHub](https://github.com/maplibre/maplibre-gl-js)

**Tile Sources for MapLibre:**
- [OpenFreeMap](https://openfreemap.org/) - Free vector tiles
- [Protomaps](https://protomaps.com/) - Self-hosted tiles
- [Maptiler](https://www.maptiler.com/) - Commercial tiles
- [Stadia Maps](https://stadiamaps.com/) - Commercial tiles

## Quick Reference

### Key Differences Summary

| What | Mapbox | MapLibre |
|------|--------|----------|
| Package | `mapbox-gl` | `maplibre-gl` |
| Import | `import mapboxgl from 'mapbox-gl'` | `import maplibregl from 'maplibre-gl'` |
| Token | Required: `mapboxgl.accessToken = 'pk.xxx'` | Optional (depends on tiles) |
| Style | `mapbox://styles/mapbox/streets-v12` | Custom URL or OSM tiles |
| License | Proprietary (v2+) | BSD (Open Source) |
| Cost | Mapbox billing | Free (but need tile source) |
| API | ~95% compatible | ~95% compatible |

**Bottom line:** Migration is easy because APIs are nearly identical. Main differences are packaging, token handling, and tile sources.
