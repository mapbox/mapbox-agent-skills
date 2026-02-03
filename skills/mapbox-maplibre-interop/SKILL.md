---
name: mapbox-maplibre-interop
description: Guide for using Mapbox services (vector tiles, Search JS, APIs) with MapLibre GL JS. Covers hybrid architecture, token management, and best practices for combining open-source rendering with premium Mapbox data and services.
---

# Using Mapbox Services with MapLibre GL JS

Expert guidance for MapLibre GL JS users who want to leverage Mapbox's premium services, APIs, and data while keeping their open-source renderer.

## Overview

MapLibre GL JS and Mapbox services work great together! You can use:
- **MapLibre GL JS** for rendering (open-source, BSD license)
- **Mapbox services** for data and APIs (vector tiles, Search, Geocoding, Directions)

This hybrid approach gives you the best of both worlds: open-source flexibility + premium data quality.

## Benefits of This Approach

**Why use Mapbox services with MapLibre?**
- ✅ Keep open-source renderer (BSD license)
- ✅ Access premium Mapbox vector tiles (better coverage)
- ✅ Use Mapbox APIs (Search, Geocoding, Directions, Isochrone)
- ✅ Leverage Mapbox Search JS (no backend needed)
- ✅ Get high-quality satellite imagery
- ✅ No infrastructure management for tiles/APIs
- ✅ Cost optimize (open renderer + pay-as-you-go services)

## What You Can Use

### Mapbox Services Compatible with MapLibre

| Service | Description | Use Case |
|---------|-------------|----------|
| **Vector Tiles** | Mapbox Streets, Satellite, Terrain | Base map data |
| **Tiling Service (MTS)** | Process, host, serve custom vector tiles | Custom data hosting |
| **Raster Tiles** | Satellite imagery, terrain | Imagery layers |
| **Search JS** | Address search, autocomplete | Search functionality |
| **Geocoding API** | Forward/reverse geocoding | Address lookup |
| **Directions API** | Routing, turn-by-turn | Navigation |
| **Isochrone API** | Time/distance polygons | Coverage areas |
| **Matrix API** | Distance matrices | Multi-point routing |
| **Static Images API** | Map snapshots | Thumbnails, emails |

## Architecture Patterns

### Pattern 1: MapLibre Rendering + Mapbox Tiles

**Use when:** You want open-source rendering but need high-quality base map data.

```javascript
import maplibregl from 'maplibre-gl';

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
          'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.mvt?access_token=YOUR_TOKEN'
        ],
        minzoom: 0,
        maxzoom: 14
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#f8f8f8' }
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
    ]
  }
});
```

**Benefits:**
- High-quality Mapbox tiles
- Open-source MapLibre renderer
- Full style control

### Pattern 2: MapLibre + Mapbox Search JS

**Use when:** You need search/autocomplete functionality without building a backend.

```javascript
import maplibregl from 'maplibre-gl';
import { SearchSession } from '@mapbox/search-js-core';

// Initialize MapLibre map
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-122.4194, 37.7749],
  zoom: 12
});

// Add Mapbox Search
const search = new SearchSession({
  accessToken: 'YOUR_MAPBOX_TOKEN'
});

// Search for addresses
async function searchAddress(query) {
  const results = await search.suggest(query, {
    proximity: map.getCenter().toArray()
  });

  // Display results on MapLibre map
  results.suggestions.forEach(result => {
    new maplibregl.Marker()
      .setLngLat(result.coordinate)
      .setPopup(new maplibregl.Popup().setText(result.name))
      .addTo(map);
  });
}
```

**Benefits:**
- No backend search infrastructure needed
- Mapbox's high-quality search data
- Works seamlessly with MapLibre rendering

### Pattern 3: MapLibre + Mapbox APIs

**Use when:** You need geocoding, directions, or other Mapbox services.

```javascript
import maplibregl from 'maplibre-gl';

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json'
});

// Use Mapbox Geocoding API
async function geocodeAddress(address) {
  const response = await fetch(
    `https://api.mapbox.com/search/geocode/v6/forward?` +
    `q=${encodeURIComponent(address)}&` +
    `access_token=YOUR_MAPBOX_TOKEN`
  );
  const data = await response.json();
  const [lng, lat] = data.features[0].geometry.coordinates;

  // Display on MapLibre map
  map.setCenter([lng, lat]);
  new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
}

// Use Mapbox Directions API
async function getDirections(start, end) {
  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${start.join(',')};${end.join(',')}?` +
    `geometries=geojson&` +
    `access_token=YOUR_MAPBOX_TOKEN`
  );
  const data = await response.json();
  const route = data.routes[0];

  // Display route on MapLibre map
  map.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: route.geometry
    }
  });

  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    paint: {
      'line-color': '#0080ff',
      'line-width': 5
    }
  });
}
```

**Benefits:**
- Access all Mapbox APIs
- MapLibre for rendering
- Best-in-class routing and geocoding

### Pattern 4: MapLibre + Mapbox Tiling Service (Custom Data)

**Use when:** You have custom vector data and need tile processing, hosting, and CDN infrastructure.

```javascript
import maplibregl from 'maplibre-gl';

// Upload your data to Mapbox Tiling Service (MTS)
// via Mapbox Studio or Mapbox Tiling Service (API):
// https://docs.mapbox.com/api/maps/tilesets/

// Then consume your custom tileset with MapLibre
const map = new maplibregl.Map({
  container: 'map',
  center: [-122.4194, 37.7749],
  zoom: 12,
  style: {
    version: 8,
    sources: {
      'my-custom-data': {
        type: 'vector',
        url: 'mapbox://your-username.your-tileset-id',
        // Or use explicit tile URLs:
        tiles: [
          `https://api.mapbox.com/v4/your-username.your-tileset-id/{z}/{x}/{y}.mvt?access_token=${MAPBOX_TOKEN}`
        ],
        minzoom: 0,
        maxzoom: 14
      }
    },
    layers: [
      {
        id: 'custom-data-layer',
        type: 'fill',
        source: 'my-custom-data',
        'source-layer': 'your-source-layer',
        paint: {
          'fill-color': '#0080ff',
          'fill-opacity': 0.5
        }
      }
    ]
  }
});
```

**Workflow:**

1. **Upload data to Mapbox:**
   - Use Mapbox Studio to upload GeoJSON, CSV, Shapefile
   - Or use Mapbox Tiling Service (API) for programmatic uploads
   - Or use Mapbox Tiling Service CLI

2. **Mapbox processes your data:**
   - Converts to optimized vector tiles
   - Generates tiles at multiple zoom levels
   - Validates and optimizes geometry

3. **Mapbox hosts and serves tiles:**
   - Global CDN for fast delivery
   - Automatic scaling
   - Built-in caching

4. **Consume with MapLibre:**
   - Reference tileset ID in your style
   - MapLibre handles rendering
   - Full control over styling

**Benefits:**
- No tile processing infrastructure needed
- No hosting or CDN management
- Scalable tile serving (handles any load)
- Optimized vector tiles (fast rendering)
- Pay only for tile requests
- Focus on rendering and UX, not infrastructure

**Example use cases:**
- Real estate listings (millions of properties)
- Store locators (thousands of locations)
- Delivery zones (custom polygons)
- Census data (detailed geographic data)
- IoT sensor data (time-series geospatial)

**Upload using Mapbox Studio or Mapbox Tiling Service (API):**
- Mapbox Studio: <https://studio.mapbox.com/tilesets/>
- Mapbox Tiling Service API: <https://docs.mapbox.com/api/maps/tilesets/>
- MTS CLI: <https://docs.mapbox.com/help/tutorials/get-started-mts/>

## Token Management

### Public Tokens for MapLibre

Use Mapbox public tokens (pk.*) for:
- Vector tile requests
- Raster tile requests
- Client-side API calls (Search JS, Geocoding)

```javascript
// Store token securely
const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN; // pk.* token

// Use in tile URLs
tiles: [
  `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.mvt?access_token=${MAPBOX_TOKEN}`
]

// Use with Search JS
const search = new SearchSession({
  accessToken: MAPBOX_TOKEN
});
```

### Token Security Best Practices

```javascript
// ✅ Use environment variables
const token = process.env.VITE_MAPBOX_TOKEN;

// ✅ Add URL restrictions in Mapbox dashboard
// Only allow your domains

// ✅ Use public tokens (pk.*) for client-side
// Never expose secret tokens (sk.*)

// ✅ Add to .gitignore
// .env
// .env.local
```

**See also:** `mapbox-token-security` skill for comprehensive token security guidance.

## Complete Integration Example

**Restaurant Finder with MapLibre + Mapbox Services**

```javascript
import maplibregl from 'maplibre-gl';
import { SearchSession } from '@mapbox/search-js-core';

const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN;

// 1. Initialize MapLibre with Mapbox vector tiles
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
          `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.mvt?access_token=${MAPBOX_TOKEN}`
        ]
      }
    },
    layers: [
      // Your custom layers here
    ]
  }
});

// 2. Add Mapbox Search JS
const search = new SearchSession({
  accessToken: MAPBOX_TOKEN
});

// 3. Search for restaurants using Mapbox Search
async function searchRestaurants(query, center) {
  const results = await search.suggest(query, {
    types: ['poi'],
    proximity: center,
    limit: 10
  });

  // Display results on MapLibre map
  const features = results.suggestions.map(result => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: result.coordinate
    },
    properties: {
      name: result.name,
      address: result.address
    }
  }));

  map.addSource('restaurants', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: features
    }
  });

  map.addLayer({
    id: 'restaurants',
    type: 'symbol',
    source: 'restaurants',
    layout: {
      'icon-image': 'restaurant-15',
      'text-field': ['get', 'name'],
      'text-offset': [0, 1.5],
      'text-anchor': 'top'
    }
  });
}

// 4. Get directions using Mapbox Directions API
async function getDirections(start, restaurant) {
  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${start.join(',')};${restaurant.join(',')}?` +
    `geometries=geojson&steps=true&` +
    `access_token=${MAPBOX_TOKEN}`
  );
  const data = await response.json();

  // Show route on MapLibre map
  map.getSource('route')?.setData({
    type: 'Feature',
    geometry: data.routes[0].geometry
  });
}
```

**Result:** Restaurant finder with:
- MapLibre rendering (open-source)
- Mapbox vector tiles (high quality)
- Mapbox Search JS (no backend needed)
- Mapbox Directions API (best-in-class routing)

## Cost Optimization

### Pricing Model

**MapLibre GL JS:**
- Free and open source
- No licensing costs

**Mapbox Services (pay-as-you-go):**
- Vector tiles: Included in map loads
- Search JS: Per search request
- Geocoding API: Per request
- Directions API: Per request
- Free tier: 50,000 map loads/month + generous API allowances

### Cost Saving Tips

```javascript
// 1. Cache API responses
const geocodeCache = new Map();

async function cachedGeocode(address) {
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address);
  }
  const result = await geocode(address);
  geocodeCache.set(address, result);
  return result;
}

// 2. Debounce search requests
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query) => {
  const results = await search.suggest(query);
  // Display results
}, 300); // Wait 300ms after user stops typing

// 3. Use session tokens for Search JS
const search = new SearchSession({
  accessToken: MAPBOX_TOKEN,
  // Session tokens reduce costs for multi-request searches
});

// 4. Set appropriate tile maxzoom
sources: {
  'mapbox-streets': {
    type: 'vector',
    tiles: [...],
    maxzoom: 14  // Don't fetch tiles beyond zoom 14
  }
}
```

## Common Use Cases

### Use Case 1: Search Integration

**Scenario:** Add address search to MapLibre map

**Solution:**
```javascript
import { SearchSession } from '@mapbox/search-js-core';

const search = new SearchSession({
  accessToken: MAPBOX_TOKEN
});

// Autocomplete search
searchInput.addEventListener('input', async (e) => {
  const results = await search.suggest(e.target.value, {
    proximity: map.getCenter().toArray()
  });
  displaySuggestions(results.suggestions);
});
```

### Use Case 2: Turn-by-Turn Directions

**Scenario:** Show driving directions on MapLibre map

**Solution:**
```javascript
async function showDirections(origin, destination) {
  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${origin.join(',')};${destination.join(',')}?` +
    `steps=true&geometries=geojson&` +
    `access_token=${MAPBOX_TOKEN}`
  );
  const data = await response.json();

  // Display route
  map.getSource('route').setData(data.routes[0].geometry);

  // Show turn-by-turn instructions
  const steps = data.routes[0].legs[0].steps;
  displayInstructions(steps);
}
```

### Use Case 3: Isochrone Visualization

**Scenario:** Show 15-minute drive time area

**Solution:**
```javascript
async function showIsochrone(center, minutes) {
  const response = await fetch(
    `https://api.mapbox.com/isochrone/v1/mapbox/driving/` +
    `${center.join(',')}?` +
    `contours_minutes=${minutes}&` +
    `polygons=true&` +
    `access_token=${MAPBOX_TOKEN}`
  );
  const data = await response.json();

  // Display isochrone polygon on MapLibre
  map.addSource('isochrone', {
    type: 'geojson',
    data: data
  });

  map.addLayer({
    id: 'isochrone',
    type: 'fill',
    source: 'isochrone',
    paint: {
      'fill-color': '#0080ff',
      'fill-opacity': 0.3
    }
  });
}
```

## When to Use This Approach

### ✅ Great for:
- Projects requiring open-source licenses
- Teams with MapLibre expertise
- Need premium data but want rendering control
- Cost-conscious projects (free renderer + pay-per-use APIs)
- Custom tile infrastructure + Mapbox APIs
- Multi-provider data strategy

### Consider Full Mapbox When:
- Want simplest setup (`mapbox://` styles)
- Need Mapbox Studio for visual style editing
- Want official support and SLAs
- Building production apps needing enterprise features
- Team prefers integrated ecosystem

**See also:** `mapbox-maplibre-migration` skill for full migration guidance.

## Framework Integration

Works with all frameworks that support MapLibre:

```javascript
// React
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { SearchSession } from '@mapbox/search-js-core';

function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const search = useRef(null);

  useEffect(() => {
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: /* Mapbox tiles style */
    });

    search.current = new SearchSession({
      accessToken: MAPBOX_TOKEN
    });

    return () => map.current.remove();
  }, []);

  return <div ref={mapContainer} />;
}
```

**See also:** `mapbox-web-integration-patterns` skill for framework-specific patterns.

## Testing

```javascript
// Test Mapbox API integration
describe('Mapbox Services with MapLibre', () => {
  it('should geocode addresses', async () => {
    const result = await geocode('San Francisco');
    expect(result.coordinates).toBeDefined();
  });

  it('should get directions', async () => {
    const route = await getDirections(
      [-122.4, 37.8],
      [-122.5, 37.7]
    );
    expect(route.geometry).toBeDefined();
  });

  it('should search POIs', async () => {
    const results = await search.suggest('coffee');
    expect(results.suggestions.length).toBeGreaterThan(0);
  });
});
```

## Resources

**Mapbox Services Documentation:**
- [Mapbox Search JS](https://docs.mapbox.com/mapbox-search-js/)
- [Geocoding API](https://docs.mapbox.com/api/search/geocoding/)
- [Directions API](https://docs.mapbox.com/api/navigation/directions/)
- [Isochrone API](https://docs.mapbox.com/api/navigation/isochrone/)
- [Vector Tiles API](https://docs.mapbox.com/api/maps/vector-tiles/)
- [Static Images API](https://docs.mapbox.com/api/maps/static-images/)

**MapLibre Documentation:**
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js-docs/)
- [MapLibre Examples](https://maplibre.org/maplibre-gl-js-docs/examples/)

**Related Skills:**
- `mapbox-token-security` - Token management and security
- `mapbox-maplibre-migration` - Full migration to Mapbox GL JS
- `mapbox-web-integration-patterns` - Framework integration patterns
- `mapbox-web-performance-patterns` - Performance optimization

## Summary

**Best practices:**
- ✅ Use MapLibre GL JS for rendering (open-source)
- ✅ Use Mapbox services for data and APIs (premium quality)
- ✅ Implement proper token security (URL restrictions, env vars)
- ✅ Cache API responses to optimize costs
- ✅ Debounce search requests
- ✅ Use Search JS session tokens
- ✅ Set appropriate tile zoom limits

**This hybrid approach gives you:**
- Open-source flexibility (MapLibre)
- Premium data quality (Mapbox)
- Cost optimization (free renderer + pay-per-use)
- Best-in-class APIs (Search, Directions, Geocoding)
- No infrastructure management
