# Using Mapbox Services with MapLibre GL JS

Quick reference for MapLibre users leveraging Mapbox services, APIs, and data with open-source rendering.

## Hybrid Architecture Benefits

**Best of both worlds:**
- ✅ MapLibre GL JS (open-source, BSD license)
- ✅ Mapbox services (premium data, APIs)
- ✅ Cost optimization (free renderer + pay-per-use)
- ✅ No infrastructure management
- ✅ High-quality data and tiles

## What You Can Use with MapLibre

| Mapbox Service | Use With MapLibre | Common Use |
|----------------|-------------------|------------|
| **Vector Tiles** | ✅ Yes | Base map data |
| **Tiling Service (MTS)** | ✅ Yes | Custom data hosting |
| **Satellite Tiles** | ✅ Yes | Imagery layers |
| **Search JS** | ✅ Yes | Address search |
| **Geocoding API** | ✅ Yes | Address lookup |
| **Directions API** | ✅ Yes | Routing |
| **Isochrone API** | ✅ Yes | Coverage areas |
| **Matrix API** | ✅ Yes | Multi-point routing |
| **Static Images** | ✅ Yes | Thumbnails |

## Quick Start Patterns

### Pattern 1: MapLibre + Mapbox Tiles

```javascript
import maplibregl from 'maplibre-gl';

const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN;

const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      'mapbox-streets': {
        type: 'vector',
        tiles: [
          `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.mvt?access_token=${MAPBOX_TOKEN}`
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
- High-quality Mapbox vector tiles
- Open-source MapLibre rendering
- Full style control

### Pattern 2: MapLibre + Mapbox Search JS

```javascript
import maplibregl from 'maplibre-gl';
import { SearchSession } from '@mapbox/search-js-core';

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json'
});

// Add Mapbox Search (no backend needed!)
const search = new SearchSession({
  accessToken: MAPBOX_TOKEN
});

async function searchPlaces(query) {
  const results = await search.suggest(query, {
    proximity: map.getCenter().toArray()
  });

  // Display on MapLibre map
  results.suggestions.forEach(result => {
    new maplibregl.Marker()
      .setLngLat(result.coordinate)
      .addTo(map);
  });
}
```

**Benefits:**
- No backend search infrastructure
- Mapbox's high-quality search data
- Works seamlessly with MapLibre

### Pattern 3: MapLibre + Mapbox APIs

```javascript
// Geocoding
const geocodeResponse = await fetch(
  `https://api.mapbox.com/search/geocode/v6/forward?` +
  `q=${address}&access_token=${MAPBOX_TOKEN}`
);

// Directions
const directionsResponse = await fetch(
  `https://api.mapbox.com/directions/v5/mapbox/driving/` +
  `${start.join(',')};${end.join(',')}?` +
  `geometries=geojson&access_token=${MAPBOX_TOKEN}`
);

// Isochrone
const isochroneResponse = await fetch(
  `https://api.mapbox.com/isochrone/v1/mapbox/driving/` +
  `${center.join(',')}?contours_minutes=15&` +
  `polygons=true&access_token=${MAPBOX_TOKEN}`
);
```

**Benefits:**
- Best-in-class routing and geocoding
- All Mapbox APIs available
- MapLibre handles rendering

### Pattern 4: MapLibre + Mapbox Tiling Service (Custom Data)

```javascript
// Upload your data to MTS (via Studio or Tilesets API)
// Then consume with MapLibre:

const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      'my-custom-data': {
        type: 'vector',
        tiles: [
          `https://api.mapbox.com/v4/username.tileset-id/{z}/{x}/{y}.mvt?access_token=${MAPBOX_TOKEN}`
        ]
      }
    },
    layers: [
      {
        id: 'custom-layer',
        type: 'fill',
        source: 'my-custom-data',
        'source-layer': 'your-source-layer',
        paint: { 'fill-color': '#0080ff' }
      }
    ]
  }
});
```

**Benefits:**
- No tile processing infrastructure
- No hosting/CDN management
- Scalable (handles any load)
- Pay only for tile requests
- Focus on rendering, not infrastructure

**Use cases:** Real estate, store locators, delivery zones, census data

## Token Management

### Use Public Tokens (pk.*)

```javascript
// ✅ Environment variable
const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN;

// ✅ In tile URLs
tiles: [
  `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.mvt?access_token=${MAPBOX_TOKEN}`
]

// ✅ With Search JS
const search = new SearchSession({ accessToken: MAPBOX_TOKEN });

// ✅ With API calls
const url = `https://api.mapbox.com/...?access_token=${MAPBOX_TOKEN}`;
```

### Security Best Practices

- ✅ Use environment variables (never hardcode)
- ✅ Add URL restrictions in Mapbox dashboard
- ✅ Use public tokens (pk.*) for client-side
- ✅ Add .env to .gitignore
- ✅ Rotate tokens if exposed

## Complete Example: Restaurant Finder

```javascript
import maplibregl from 'maplibre-gl';
import { SearchSession } from '@mapbox/search-js-core';

const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN;

// 1. MapLibre with Mapbox vector tiles
const map = new maplibregl.Map({
  container: 'map',
  center: [-122.4, 37.8],
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
    layers: [/* your layers */]
  }
});

// 2. Mapbox Search JS
const search = new SearchSession({ accessToken: MAPBOX_TOKEN });

async function searchRestaurants(query) {
  const results = await search.suggest(query, {
    types: ['poi'],
    proximity: map.getCenter().toArray()
  });

  // Show on MapLibre map
  results.suggestions.forEach(result => {
    new maplibregl.Marker()
      .setLngLat(result.coordinate)
      .setPopup(new maplibregl.Popup().setText(result.name))
      .addTo(map);
  });
}

// 3. Mapbox Directions API
async function getDirections(start, end) {
  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${start.join(',')};${end.join(',')}?` +
    `geometries=geojson&access_token=${MAPBOX_TOKEN}`
  );
  const data = await response.json();

  // Display route on MapLibre
  map.addSource('route', {
    type: 'geojson',
    data: { type: 'Feature', geometry: data.routes[0].geometry }
  });

  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    paint: { 'line-color': '#0080ff', 'line-width': 5 }
  });
}
```

**Result:**
- Open-source MapLibre rendering
- High-quality Mapbox tiles
- Mapbox Search JS (no backend)
- Mapbox Directions API

## Cost Optimization

### Smart Caching

```javascript
// Cache geocoding results
const geocodeCache = new Map();

async function cachedGeocode(address) {
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address);
  }
  const result = await geocode(address);
  geocodeCache.set(address, result);
  return result;
}

// Debounce search (reduce requests)
const debouncedSearch = debounce(
  (query) => search.suggest(query),
  300 // 300ms delay
);

// Use Search JS session tokens
const search = new SearchSession({
  accessToken: MAPBOX_TOKEN
  // Session tokens reduce costs
});

// Set tile maxzoom (don't over-fetch)
sources: {
  'mapbox-streets': {
    maxzoom: 14  // Stop at zoom 14
  }
}
```

## Pricing

**MapLibre GL JS:** Free (open source)

**Mapbox Services (pay-as-you-go):**
- Free tier: 50,000 map loads/month
- Vector tiles: Included in map loads
- Search JS: Per search request
- Geocoding: Per request
- Directions: Per request

**Cost example:**
- MapLibre rendering: $0
- Mapbox tiles: ~$5/50K loads (free tier)
- APIs: Pay only for what you use

## Common Use Cases

### Use Case 1: Address Search

```javascript
import { SearchSession } from '@mapbox/search-js-core';

const search = new SearchSession({ accessToken: MAPBOX_TOKEN });

searchInput.addEventListener('input', async (e) => {
  const results = await search.suggest(e.target.value, {
    proximity: map.getCenter().toArray()
  });
  displaySuggestions(results.suggestions);
});
```

### Use Case 2: Turn-by-Turn Directions

```javascript
async function showDirections(origin, destination) {
  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${origin.join(',')};${destination.join(',')}?` +
    `steps=true&geometries=geojson&` +
    `access_token=${MAPBOX_TOKEN}`
  );
  const data = await response.json();

  // Show route on MapLibre
  map.getSource('route').setData(data.routes[0].geometry);

  // Display turn-by-turn instructions
  const steps = data.routes[0].legs[0].steps;
  displayInstructions(steps);
}
```

### Use Case 3: Isochrone (Drive Time)

```javascript
async function show15MinuteDriveTime(center) {
  const response = await fetch(
    `https://api.mapbox.com/isochrone/v1/mapbox/driving/` +
    `${center.join(',')}?contours_minutes=15&` +
    `polygons=true&access_token=${MAPBOX_TOKEN}`
  );
  const data = await response.json();

  // Display on MapLibre
  map.addSource('isochrone', { type: 'geojson', data });
  map.addLayer({
    id: 'isochrone',
    type: 'fill',
    source: 'isochrone',
    paint: { 'fill-color': '#0080ff', 'fill-opacity': 0.3 }
  });
}
```

## When to Use This Approach

### ✅ Perfect For:
- Projects requiring open-source licenses
- Teams with MapLibre expertise
- Need premium data + rendering control
- Cost-conscious (free renderer + pay-per-use)
- Custom tile infrastructure + Mapbox APIs
- Multi-provider strategy

### Consider Full Mapbox When:
- Want simplest setup (mapbox:// styles)
- Need Mapbox Studio visual editing
- Want official support/SLAs
- Building enterprise applications
- Prefer integrated ecosystem

## Framework Integration

Works with all MapLibre-compatible frameworks:

```javascript
// React
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { SearchSession } from '@mapbox/search-js-core';

function Map() {
  const mapRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    mapRef.current = new maplibregl.Map({/* Mapbox tiles */});
    searchRef.current = new SearchSession({
      accessToken: MAPBOX_TOKEN
    });

    return () => mapRef.current?.remove();
  }, []);

  return <div ref={mapRef} />;
}
```

## Quick Decision Guide

**Use this hybrid approach when:**
- ✅ Need open-source renderer
- ✅ Want Mapbox data/API quality
- ✅ Cost optimization important
- ✅ Team knows MapLibre
- ✅ Need flexibility + premium services

**Full migration when:**
- ⏩ Want simplest setup
- ⏩ Need Mapbox Studio
- ⏩ Want official support
- ⏩ Building production enterprise app

## Checklist

✅ MapLibre GL JS installed
✅ Mapbox account created (free tier OK)
✅ Public token (pk.*) obtained
✅ Token stored in environment variables
✅ URL restrictions added to token
✅ Tile URLs include access token
✅ Search JS configured (if using)
✅ API responses cached (if using)
✅ Search requests debounced (if using)
✅ Tile maxzoom set appropriately

## Resources

- [Mapbox Search JS Docs](https://docs.mapbox.com/mapbox-search-js/)
- [Mapbox APIs](https://docs.mapbox.com/api/)
- [MapLibre GL JS](https://maplibre.org/)
- `mapbox-token-security` skill - Token security
- `mapbox-maplibre-migration` skill - Full migration
- `mapbox-web-integration-patterns` skill - Framework patterns
