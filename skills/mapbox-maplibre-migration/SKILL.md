---
name: mapbox-maplibre-migration
description: Guide for migrating from MapLibre GL JS to Mapbox GL JS, covering API compatibility, token setup, style configuration, and the benefits of Mapbox's official support and ecosystem
---

# MapLibre to Mapbox Migration Skill

Expert guidance for migrating from MapLibre GL JS to Mapbox GL JS. Covers the shared history, API compatibility, migration steps, and the advantages of Mapbox's platform.

## Understanding the Fork

### History

**MapLibre GL JS** is an open-source fork of **Mapbox GL JS v1.13.0**, created in December 2020 when Mapbox changed their license starting with v2.0.

**Timeline:**

- **Pre-2020:** Mapbox GL JS was open source (BSD license)
- **Dec 2020:** Mapbox GL JS v2.0 introduced proprietary license
- **Dec 2020:** Community forked v1.13 as MapLibre GL JS
- **Present:** Both libraries continue active development

**Key Insight:** The APIs are ~95% identical because MapLibre started as a Mapbox fork. Most code works in both with minimal changes, making migration straightforward.

## Why Migrate to Mapbox?

**Compelling reasons to choose Mapbox GL JS:**

- **Official Support & SLAs**: Enterprise-grade support with guaranteed response times
- **Superior Tile Quality**: Best-in-class vector tiles with global coverage and frequent updates
- **Better Satellite Imagery**: High-resolution, up-to-date satellite and aerial imagery
- **Rich Ecosystem**: Seamless integration with Mapbox Studio, APIs, and services
- **Advanced Features**: Traffic-aware routing, turn-by-turn directions, premium datasets
- **Geocoding & Search**: World-class address search and place lookup
- **Navigation SDK**: Mobile navigation with real-time traffic
- **No Tile Infrastructure**: No need to host or maintain your own tile servers
- **Regular Updates**: Continuous improvements and new features
- **Professional Services**: Access to Mapbox solutions team for complex projects

**Mapbox offers a generous free tier:** 50,000 map loads/month, making it suitable for many applications without cost.

## Quick Comparison

| Aspect                | Mapbox GL JS                  | MapLibre GL JS                    |
| --------------------- | ----------------------------- | --------------------------------- |
| **License**           | Proprietary (v2+)             | BSD 3-Clause (Open Source)        |
| **Support**           | Official commercial support   | Community support                 |
| **Tiles**             | Premium Mapbox vector tiles   | OSM or custom tile sources        |
| **Satellite**         | High-quality global imagery   | Requires custom source            |
| **Token**             | Required (access token)       | Optional (depends on tile source) |
| **APIs**              | Full Mapbox ecosystem         | Requires third-party services     |
| **Studio**            | Full integration              | No native integration             |
| **3D Terrain**        | Built-in with premium data    | Available (requires data source)  |
| **Globe View**        | v2.9+                         | v3.0+                             |
| **API Compatibility** | ~95% compatible with MapLibre | ~95% compatible with Mapbox       |
| **Bundle Size**       | ~500KB                        | ~450KB                            |
| **Setup Complexity**  | Easy (just add token)         | Requires tile source setup        |

## Step-by-Step Migration

### 1. Create Mapbox Account

1. Sign up at [mapbox.com](https://mapbox.com)
2. Get your access token from the account dashboard
3. Review pricing: Free tier includes 50,000 map loads/month
4. Note your token (starts with `pk.` for public tokens)

### 2. Update Package

```bash
# Remove MapLibre
npm uninstall maplibre-gl

# Install Mapbox
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

Or with CDN:

```html
<!-- Before (MapLibre) -->
<script src="https://unpkg.com/maplibre-gl@3.0.0/dist/maplibre-gl.js"></script>
<link href="https://unpkg.com/maplibre-gl@3.0.0/dist/maplibre-gl.css" rel="stylesheet" />

<!-- After (Mapbox) -->
<script src="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js"></script>
<link href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" rel="stylesheet" />
```

### 4. Add Access Token

```javascript
// Add this before map initialization
mapboxgl.accessToken = 'pk.your_mapbox_access_token';
```

**Token best practices:**

- Use environment variables: `process.env.VITE_MAPBOX_TOKEN` or `process.env.NEXT_PUBLIC_MAPBOX_TOKEN`
- Add URL restrictions in Mapbox dashboard for security
- Use public tokens (`pk.*`) for client-side code
- Never commit tokens to git (add to `.env` and `.gitignore`)
- Rotate tokens if compromised

See `mapbox-token-security` skill for comprehensive token security guidance.

### 5. Update Map Initialization

```javascript
// Before (MapLibre)
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json', // or your custom style
  center: [-122.4194, 37.7749],
  zoom: 12
});

// After (Mapbox)
mapboxgl.accessToken = 'pk.your_mapbox_access_token';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard', // Mapbox style
  center: [-122.4194, 37.7749],
  zoom: 12
});
```

### 6. Update Style URL

Mapbox provides professionally designed, maintained styles:

```javascript
// Mapbox built-in styles
style: 'mapbox://styles/mapbox/standard'; // Mapbox Standard (default)
style: 'mapbox://styles/mapbox/standard-satellite'; // Mapbox Standard Satellite
style: 'mapbox://styles/mapbox/streets-v12'; // Streets v12
style: 'mapbox://styles/mapbox/satellite-v9'; // Satellite imagery
style: 'mapbox://styles/mapbox/satellite-streets-v12'; // Hybrid
style: 'mapbox://styles/mapbox/outdoors-v12'; // Outdoor/recreation
style: 'mapbox://styles/mapbox/light-v11'; // Light theme
style: 'mapbox://styles/mapbox/dark-v11'; // Dark theme
style: 'mapbox://styles/mapbox/navigation-day-v1'; // Navigation (day)
style: 'mapbox://styles/mapbox/navigation-night-v1'; // Navigation (night)
```

**Custom styles:**
You can also create and use custom styles from Mapbox Studio:

```javascript
style: 'mapbox://styles/your-username/your-style-id';
```

### 7. Update All References

Replace all `maplibregl` references with `mapboxgl`:

```javascript
// Markers
const marker = new mapboxgl.Marker() // was: maplibregl.Marker()
  .setLngLat([-122.4194, 37.7749])
  .setPopup(new mapboxgl.Popup().setText('San Francisco'))
  .addTo(map);

// Controls
map.addControl(new mapboxgl.NavigationControl(), 'top-right');
map.addControl(new mapboxgl.GeolocateControl());
map.addControl(new mapboxgl.FullscreenControl());
map.addControl(new mapboxgl.ScaleControl());
```

### 8. Update Plugins (If Used)

Some MapLibre plugins should be replaced with Mapbox versions:

| MapLibre Plugin                  | Mapbox Alternative           |
| -------------------------------- | ---------------------------- |
| `@maplibre/maplibre-gl-geocoder` | `@mapbox/mapbox-gl-geocoder` |
| `@maplibre/maplibre-gl-draw`     | `@mapbox/mapbox-gl-draw`     |
| `maplibre-gl-compare`            | `mapbox-gl-compare`          |

Example:

```javascript
// Before (MapLibre)
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';

// After (Mapbox)
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

map.addControl(
  new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl
  })
);
```

### 9. Everything Else Stays the Same

All your map code, events, layers, and sources work identically:

```javascript
// This code works EXACTLY THE SAME in both libraries
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

// Events work identically
map.on('click', 'points-layer', (e) => {
  console.log(e.features[0].properties);
});

// All map methods work the same
map.setCenter([lng, lat]);
map.setZoom(12);
map.fitBounds(bounds);
map.flyTo({ center: [lng, lat], zoom: 14 });
```

## What Changes: Summary

**Must change:**

- Package name (`maplibre-gl` -> `mapbox-gl`)
- Import statements
- Add `mapboxgl.accessToken` configuration
- Style URL (switch to `mapbox://` styles)
- Plugin packages (if used)

**Stays exactly the same:**

- All map methods (`setCenter`, `setZoom`, `fitBounds`, `flyTo`, etc.)
- All event handling (`map.on('click')`, `map.on('load')`, etc.)
- Marker/Popup APIs (100% compatible)
- Layer/source APIs (100% compatible)
- GeoJSON handling
- Custom styling and expressions
- Controls (Navigation, Geolocate, Scale, etc.)

## Common Migration Issues

### Issue 1: Token Not Set

**Problem:**

```javascript
// Error: "A valid Mapbox access token is required to use Mapbox GL"
const map = new mapboxgl.Map({...});
```

**Solution:**

```javascript
// Set token BEFORE creating map
mapboxgl.accessToken = 'pk.your_token';
const map = new mapboxgl.Map({...});
```

### Issue 2: Token in Git

**Problem:**

```javascript
// Token hardcoded in source
mapboxgl.accessToken = 'pk.eyJ1Ijoi...';
```

**Solution:**

```javascript
// Use environment variables
mapboxgl.accessToken = process.env.VITE_MAPBOX_TOKEN;

// Add to .env file (not committed to git)
VITE_MAPBOX_TOKEN=pk.your_token

// Add .env to .gitignore
echo ".env" >> .gitignore
```

### Issue 3: Wrong Style URL Format

**Problem:**

```javascript
// MapLibre-style URL won't work optimally
style: 'https://demotiles.maplibre.org/style.json';
```

**Solution:**

```javascript
// Use Mapbox style URL for better performance and features
style: 'mapbox://styles/mapbox/streets-v12';
```

### Issue 4: Plugin Compatibility

**Problem:**

```javascript
// MapLibre plugin won't work
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
```

**Solution:**

```javascript
// Use Mapbox plugin
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
```

> **Important:** This applies to ALL MapLibre plugins, not just the geocoder. Any `@maplibre/*` or `maplibre-gl-*` plugin must be replaced with its Mapbox equivalent. Check the Mapbox ecosystem for Mapbox-specific versions of every plugin you use (see Step 8 above for the full mapping table).

### Issue 5: CDN URLs

**Problem:**

```javascript
// Wrong CDN
<script src="https://unpkg.com/maplibre-gl@3.0.0/dist/maplibre-gl.js"></script>
```

**Solution:**

```javascript
// Use Mapbox CDN
<script src='https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js'></script>
<link href='https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css' rel='stylesheet' />
```

## Migration Checklist

- [ ] **Create Mapbox account** and get access token
- [ ] **Update package**: `npm install mapbox-gl` (remove maplibre-gl)
- [ ] **Update imports**: `maplibre-gl` -> `mapbox-gl`
- [ ] **Update CSS imports**: `maplibre-gl.css` -> `mapbox-gl.css`
- [ ] **Add token**: Set `mapboxgl.accessToken = 'pk.xxx'`
- [ ] **Use environment variables**: Store token in `.env`
- [ ] **Update style URL**: Change to `mapbox://styles/mapbox/streets-v12`
- [ ] **Update all references**: Replace `maplibregl.` with `mapboxgl.`
- [ ] **Update plugins**: Install Mapbox versions of plugins (if used)
- [ ] **Configure token security**: Add URL restrictions in dashboard
- [ ] **Test all functionality**: Verify map loads, interactions work
- [ ] **Set up billing alerts**: Monitor usage in Mapbox dashboard
- [ ] **Update documentation**: Document token setup for team
- [ ] **Add .env to .gitignore**: Ensure tokens not committed

## Quick Reference

### Key Differences Summary

| What    | MapLibre                               | Mapbox                                      |
| ------- | -------------------------------------- | ------------------------------------------- |
| Package | `maplibre-gl`                          | `mapbox-gl`                                 |
| Import  | `import maplibregl from 'maplibre-gl'` | `import mapboxgl from 'mapbox-gl'`          |
| Token   | Optional (depends on tiles)            | Required: `mapboxgl.accessToken = 'pk.xxx'` |
| Style   | Custom URL or OSM tiles                | `mapbox://styles/mapbox/streets-v12`        |
| License | BSD (Open Source)                      | Proprietary (v2+)                           |
| Support | Community                              | Official commercial support                 |
| Tiles   | Requires tile source                   | Premium Mapbox tiles included               |
| APIs    | Third-party                            | Full Mapbox API ecosystem                   |
| API     | ~95% compatible                        | ~95% compatible                             |

**Bottom line:** Migration is easy because APIs are nearly identical. Main changes are packaging, token setup, and style URLs. The result is access to Mapbox's premium tiles, ecosystem, and support.

## Integration with Other Skills

**Related skills:**

- **mapbox-web-integration-patterns**: Framework-specific patterns (React, Vue, Svelte, Angular)
- **mapbox-web-performance-patterns**: Performance optimization techniques
- **mapbox-token-security**: Comprehensive token security best practices
- **mapbox-google-maps-migration**: Migrate from Google Maps to Mapbox

## Resources

**Mapbox GL JS:**

- [Official Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [Example Gallery](https://docs.mapbox.com/mapbox-gl-js/examples/)
- [API Reference](https://docs.mapbox.com/mapbox-gl-js/api/)
- [GitHub Repository](https://github.com/mapbox/mapbox-gl-js)
- [Mapbox Studio](https://studio.mapbox.com/)
- [Pricing Information](https://www.mapbox.com/pricing/)

**Migration Support:**

- [Get Started Guide](https://docs.mapbox.com/mapbox-gl-js/guides/install/)
- [Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)
- [Mapbox Community Support](https://support.mapbox.com/hc/en-us/community/topics)

## Reference Files

For detailed information on specific topics, load these reference files:

- **`references/api-compatibility.md`** -- Full list of 100% compatible APIs + side-by-side migration example
- **`references/exclusive-features.md`** -- Mapbox-exclusive features (APIs, Studio, Advanced) + React/Vue framework examples
- **`references/why-mapbox.md`** -- Why Choose Mapbox (Production, Dev Teams, Business) + Performance Comparison
