# Mapbox ↔ MapLibre Migration Guide

Quick reference for migrating between Mapbox GL JS and MapLibre GL JS. APIs are ~95% identical.

## Key Differences

| Aspect | Mapbox GL JS | MapLibre GL JS |
|--------|--------------|----------------|
| **License** | Proprietary (v2+) | BSD Open Source |
| **Token** | Required | Optional (depends on tiles) |
| **Package** | `mapbox-gl` | `maplibre-gl` |
| **Tiles** | Mapbox hosted | Custom/OSM tiles |
| **Styles** | `mapbox://styles/...` | Custom URL or OSM |

## Migration Decision Tree

**From Mapbox → MapLibre?**
- Reason: Open source license, cost savings, custom tiles
- Change: Package, imports, style URLs, remove token
- Keep: All map code (95% compatible)

**From MapLibre → Mapbox?**
- Reason: Mapbox support, hosted tiles, specific features
- Change: Package, imports, add token, use mapbox:// styles
- Keep: All map code (95% compatible)

## Mapbox → MapLibre Migration

### 1. Update Package
```bash
npm uninstall mapbox-gl
npm install maplibre-gl
```

### 2. Update Imports
```javascript
// Before
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// After
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
```

### 3. Update Initialization
```javascript
// Before (Mapbox)
mapboxgl.accessToken = 'pk.your_token';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12'
});

// After (MapLibre with OSM)
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json'
});
// No token needed for OSM tiles
```

### 4. Using Mapbox Tiles with MapLibre
```javascript
// Define Mapbox tiles explicitly in style.json
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      'mapbox-streets': {
        type: 'vector',
        tiles: [
          'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.mvt?access_token=YOUR_TOKEN'
        ]
      }
    },
    layers: [/* your layers */]
  }
});
```

**Note:** MapLibre doesn't parse `mapbox://` URLs. Use explicit tile URLs.

### What Stays the Same (100% Compatible)
```javascript
// All these work identically in both:
map.setCenter([lng, lat])
map.setZoom(zoom)
map.fitBounds(bounds)
map.on('click', handler)
new maplibregl.Marker().setLngLat([lng, lat]).addTo(map)
new maplibregl.Popup().setHTML(html).addTo(map)
map.addSource(id, source)
map.addLayer(layer)
```

## MapLibre → Mapbox Migration

### 1. Update Package
```bash
npm uninstall maplibre-gl
npm install mapbox-gl
```

### 2. Update Imports
```javascript
// Before
import maplibregl from 'maplibre-gl';

// After
import mapboxgl from 'mapbox-gl';
```

### 3. Add Token
```javascript
// Required for Mapbox
mapboxgl.accessToken = 'pk.your_mapbox_token';
```

### 4. Update Style URL
```javascript
// Before (MapLibre with OSM)
style: 'https://demotiles.maplibre.org/style.json'

// After (Mapbox)
style: 'mapbox://styles/mapbox/streets-v12'
```

### Plugin Migration
| Mapbox Plugin | MapLibre Alternative |
|---------------|---------------------|
| `@mapbox/mapbox-gl-geocoder` | `@maplibre/maplibre-gl-geocoder` |
| `@mapbox/mapbox-gl-draw` | `@maplibre/maplibre-gl-draw` |
| `mapbox-gl-compare` | `maplibre-gl-compare` |

## Common Migration Issues

### Issue: Style URL Format
```javascript
// ❌ Won't work in MapLibre
style: 'mapbox://styles/mapbox/streets-v12'

// ✅ Use OSM tiles or explicit Mapbox tiles
style: 'https://demotiles.maplibre.org/style.json'
// OR define Mapbox tiles explicitly (see above)
```

### Issue: Plugin Compatibility
```javascript
// ❌ Mapbox plugins won't work with MapLibre
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

// ✅ Use MapLibre versions
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
```

### Issue: Access Token
```javascript
// ❌ MapLibre doesn't use accessToken by default
maplibregl.accessToken = 'pk.xxx'; // Does nothing

// ✅ Pass token in tile URLs if using Mapbox tiles
tiles: ['https://api.mapbox.com/...?access_token=YOUR_TOKEN']
```

## When to Choose Each

### Choose Mapbox GL JS When:
- Need official commercial support
- Want Mapbox-hosted tiles (streets, satellite)
- Using Mapbox APIs (Directions, Geocoding)
- Need latest Mapbox-specific features
- Want simplest setup with `mapbox://` styles

### Choose MapLibre GL JS When:
- Need open source license (BSD)
- Cost optimization important
- Using custom tile infrastructure
- Want self-hosted tiles
- Avoiding vendor lock-in

## Testing Migration

**Checklist:**
- ✅ Map initializes without errors
- ✅ Tiles load correctly
- ✅ Markers/popups display properly
- ✅ Events fire as expected
- ✅ Custom layers render correctly
- ✅ Plugins work (if using alternatives)
- ✅ No console errors
- ✅ Performance unchanged

## API Compatibility (100%)

Both libraries support identical APIs for:
- Map methods (setCenter, setZoom, fitBounds, flyTo, etc.)
- Event handling (on, once, off)
- Markers and Popups
- Sources and Layers
- Controls (Navigation, Geolocate, etc.)
- GeoJSON handling
- Style manipulation

**Difference:** Packaging and tile sources, not API.
