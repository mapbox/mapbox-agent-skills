# MapLibre to Mapbox Migration Guide

Quick reference for migrating from MapLibre GL JS to Mapbox GL JS. APIs are ~95% identical - migration is straightforward.

## Why Migrate to Mapbox?

**Key advantages:**

- ✅ Official support and SLAs
- ✅ Premium global tile coverage (streets, satellite, terrain)
- ✅ Mapbox APIs (Geocoding, Directions, Isochrone, Matrix)
- ✅ Mapbox Studio for custom styles (no coding required)
- ✅ Advanced features (Globe view, 3D terrain, better satellite)
- ✅ No infrastructure management (hosted tiles)
- ✅ Predictable costs, free tier: 50,000 map loads/month
- ✅ Enterprise features (compliance, analytics, support)

## Migration Overview

| Aspect                | MapLibre GL JS (Current) | Mapbox GL JS (Target) |
| --------------------- | ------------------------ | --------------------- |
| **Package**           | `maplibre-gl`            | `mapbox-gl`           |
| **Token**             | Optional                 | Required (pk.\*)      |
| **Styles**            | Custom URL / OSM         | `mapbox://styles/...` |
| **Tiles**             | OSM / Custom             | Mapbox premium tiles  |
| **Support**           | Community                | Official + SLA        |
| **APIs**              | Separate                 | Integrated ecosystem  |
| **API Compatibility** | ~95% identical           | ~95% identical        |

**Key insight:** Most of your code stays the same. Only packaging and configuration changes.

## Step-by-Step Migration

### 1. Get Mapbox Access Token

```bash
# Sign up at mapbox.com
# Get token from account dashboard
# Free tier: 50,000 map loads/month
```

### 2. Update Package

```bash
npm uninstall maplibre-gl
npm install mapbox-gl
```

### 3. Update Imports

```javascript
// Before (MapLibre)
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// After (Mapbox)
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
```

### 4. Add Access Token

```javascript
// Required for Mapbox
mapboxgl.accessToken = 'pk.your_mapbox_token';

// Best practice: Use environment variables
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
```

### 5. Update Map Initialization

```javascript
// Before (MapLibre with OSM tiles)
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-122.4194, 37.7749],
  zoom: 12
});

// After (Mapbox with premium tiles)
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12', // Or any Mapbox style
  center: [-122.4194, 37.7749],
  zoom: 12
});
```

### 6. Everything Else Stays the Same!

```javascript
// All these work identically:
map.setCenter([lng, lat]);
map.setZoom(zoom);
map.fitBounds(bounds);
map.on('click', handler);
new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
new mapboxgl.Popup().setHTML(html).addTo(map);
map.addSource(id, source);
map.addLayer(layer);
```

## Mapbox Style Options

**Pre-built styles:**

```javascript
'mapbox://styles/mapbox/standard'; // Mapbox Standard
'mapbox://styles/mapbox/standard-satellite'; // Mapbox Standard Satellite
'mapbox://styles/mapbox/streets-v12'; // Streets v12
'mapbox://styles/mapbox/outdoors-v12'; // Hiking/outdoor
'mapbox://styles/mapbox/light-v11'; // Minimal light
'mapbox://styles/mapbox/dark-v11'; // Minimal dark
'mapbox://styles/mapbox/satellite-v9'; // Satellite imagery
'mapbox://styles/mapbox/satellite-streets-v12'; // Satellite + labels
'mapbox://styles/mapbox/navigation-day-v1'; // Turn-by-turn navigation
```

**Custom styles:**

- Create in Mapbox Studio (visual editor)
- Reference as `'mapbox://styles/your-username/style-id'`

## Plugin Migration

| MapLibre Plugin                  | Mapbox Plugin                |
| -------------------------------- | ---------------------------- |
| `@maplibre/maplibre-gl-geocoder` | `@mapbox/mapbox-gl-geocoder` |
| `@maplibre/maplibre-gl-draw`     | `@mapbox/mapbox-gl-draw`     |
| `maplibre-gl-compare`            | `mapbox-gl-compare`          |

**Note:** Most Mapbox plugins work directly, no alternatives needed.

## API Compatibility (95%+)

**100% Compatible APIs:**

- Map methods (all setters/getters)
- Event handling
- Markers and Popups
- Sources and Layers
- Controls
- GeoJSON handling
- Camera animations
- Feature state

**Only differences:**

- Package name (`maplibre-gl` vs `mapbox-gl`)
- Style URL format (custom vs `mapbox://`)
- Token requirement (optional vs required)
- Some plugins need Mapbox versions

## Common Issues

### Issue: Missing Token

```javascript
// ❌ Forgot to set token
const map = new mapboxgl.Map({...});  // Error!

// ✅ Set token first
mapboxgl.accessToken = 'pk.your_token';
const map = new mapboxgl.Map({...});
```

### Issue: Wrong Style Format

```javascript
// ❌ Using OSM/custom URL
style: 'https://demotiles.maplibre.org/style.json'; // Won't load Mapbox tiles

// ✅ Use Mapbox style URL
style: 'mapbox://styles/mapbox/streets-v12';
```

### Issue: Plugin Compatibility

```javascript
// ❌ Using MapLibre plugin with Mapbox
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';

// ✅ Use Mapbox plugin
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
```

## Testing Checklist

✅ Map initializes without errors
✅ Tiles load correctly (Mapbox tiles, not OSM)
✅ Access token configured
✅ Markers/popups display properly
✅ Events fire as expected
✅ Custom layers render correctly
✅ Plugins work (if using Mapbox versions)
✅ No console errors
✅ Performance same or better

## Token Security

**Best practices:**

```javascript
// ✅ Use environment variables
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// ✅ Add URL restrictions in Mapbox dashboard
// Only allow your domains

// ✅ Never commit tokens
// Add .env to .gitignore

// ✅ Use public tokens (pk.*) for client-side
// Never expose secret tokens (sk.*)
```

## Mapbox Ecosystem Benefits

**After migration, you gain access to:**

**Mapbox APIs:**

- Geocoding API (forward/reverse)
- Directions API (routing, turn-by-turn)
- Isochrone API (time/distance polygons)
- Matrix API (distance matrices)
- Tilequery API (feature lookup)

**Mapbox Studio:**

- Visual style editor (no coding)
- Dataset editor
- Tileset management
- Style publishing

**Advanced Features:**

- Globe view (3D Earth)
- 3D terrain with real elevations
- Premium satellite imagery
- Traffic-aware routing
- Real-time updates

## Performance Notes

**Mapbox tiles are optimized for:**

- Fast loading (global CDN)
- Smaller file sizes (vector tiles)
- Better caching
- Consistent quality worldwide

**Expected performance:**

- Similar or better rendering speed
- Potentially faster tile loading (Mapbox CDN)
- Same memory usage
- Identical frame rates

## Migration Timeline

**Typical migration: 1-2 hours**

1. **Setup (15 min):** Get token, update packages
2. **Code changes (30 min):** Update imports, add token, change style URL
3. **Testing (30 min):** Verify all features work
4. **Deployment (15 min):** Deploy and monitor

**For large apps:** May take 1-2 days including QA

## Support & Resources

**After migration:**

- Official Mapbox support (for paid plans)
- Extensive documentation
- Code examples
- Community forums
- Enterprise SLAs (for enterprise plans)

## Quick Decision: Should I Migrate?

**Migrate to Mapbox if:**

- ✅ Want official support
- ✅ Need Mapbox APIs (Geocoding, Directions)
- ✅ Want better tile quality/coverage
- ✅ Prefer no infrastructure management
- ✅ Need enterprise features
- ✅ Want Mapbox Studio for styling
- ✅ Building production applications

**Free tier (50K loads/month) is often sufficient for:**

- Small-medium websites
- Internal tools
- MVPs and prototypes
- Many business applications

## Migration is Low Risk

✅ ~95% API compatibility = minimal code changes
✅ Quick migration (1-2 hours typical)
✅ Free tier available for testing
✅ Easy to rollback if needed
✅ No data loss (just configuration changes)
