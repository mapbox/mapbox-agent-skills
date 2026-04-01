# Vanilla JavaScript Integration

## Vanilla JS with Vite

**Pattern: Module imports with initialization function**

```javascript
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './main.css';

// Set access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

let map;

/**
 * Initialize the map
 */
function initMap() {
  map = new mapboxgl.Map({
    container: 'map-container',
    center: [-71.05953, 42.3629],
    zoom: 13
  });

  map.on('load', () => {
    console.log('Map is loaded');
  });
}

// Initialize when script runs
initMap();
```

**HTML:**

```html
<div id="map-container" style="height: 100vh;"></div>
```

**Key points:**

- Store map in module-scoped variable
- Initialize immediately or on DOMContentLoaded
- Listen for 'load' event for post-initialization actions

---

## Vanilla JS (No Bundler - CDN)

**Pattern: Script tag with inline initialization**

> **Note:** This pattern is for prototyping only. Production apps should use npm/bundler for version control and offline builds.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mapbox GL JS - No Bundler</title>

    <!-- Mapbox GL JS CSS -->
    <!-- Replace 3.x.x with latest version from https://docs.mapbox.com/mapbox-gl-js/ -->
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.x.x/mapbox-gl.css" rel="stylesheet" />

    <style>
      body {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        margin: 0;
        padding: 0;
      }
      #map-container {
        height: 100%;
        width: 100%;
      }
    </style>
  </head>
  <body>
    <div id="map-container"></div>

    <!-- Mapbox GL JS -->
    <!-- Replace 3.x.x with latest version from https://docs.mapbox.com/mapbox-gl-js/ -->
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.x.x/mapbox-gl.js"></script>

    <script>
      // Set access token
      mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN_HERE';

      let map;

      function initMap() {
        map = new mapboxgl.Map({
          container: 'map-container',
          center: [-71.05953, 42.3629],
          zoom: 13
        });

        map.on('load', () => {
          console.log('Map is loaded');
        });
      }

      // Initialize when page loads
      initMap();
    </script>
  </body>
</html>
```

**Key points:**

- **Prototyping only** - not recommended for production
- Replace `3.x.x` with specific version (e.g., `3.7.0`) from [Mapbox docs](https://docs.mapbox.com/mapbox-gl-js/)
- **Don't use `/latest/`** - always pin to specific version for consistency
- Initialize after script loads (bottom of body)
- For production: Use npm + bundler instead

**Why not CDN for production?**

- No version locking (CDN could change)
- Network dependency (breaks offline)
- Slower (no bundler optimization)
- No tree-shaking
- Use npm for production: `npm install mapbox-gl@^3.0.0`
