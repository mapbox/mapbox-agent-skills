# Mapbox-Exclusive Features

After migration, you gain access to these Mapbox-only features:

## Premium Vector Tiles

- **Streets**: Comprehensive road network with names, shields, and routing data
- **Satellite**: High-resolution global imagery updated regularly
- **Terrain**: Elevation data with hillshading and 3D terrain
- **Traffic**: Real-time traffic data (with Navigation SDK)

## Mapbox APIs

Use these APIs alongside your map for enhanced functionality:

```javascript
// Geocoding API - Convert addresses to coordinates
const response = await fetch(
  `https://api.mapbox.com/search/geocode/v6/forward?q=San+Francisco&access_token=${mapboxgl.accessToken}`
);

// Directions API - Get turn-by-turn directions
const directions = await fetch(
  `https://api.mapbox.com/directions/v5/mapbox/driving/-122.42,37.78;-122.45,37.76?access_token=${mapboxgl.accessToken}`
);

// Isochrone API - Calculate travel time polygons
const isochrone = await fetch(
  `https://api.mapbox.com/isochrone/v1/mapbox/driving/-122.42,37.78?contours_minutes=5,10,15&access_token=${mapboxgl.accessToken}`
);
```

## Mapbox Studio

- Visual style editor with live preview
- Dataset management and editing
- Tilesets with custom data upload
- Collaborative team features
- Style versioning and publishing

## Advanced Features (v2.9+)

- **Globe projection**: Seamless transition from globe to Mercator
- **3D buildings**: Extrusion with real building footprints
- **Custom terrain**: Use your own DEM sources
- **Sky layer**: Realistic atmospheric rendering

## Framework Integration

Migration works identically across all frameworks. See `mapbox-web-integration-patterns` skill for detailed React, Vue, Svelte, Angular patterns.

### React Example

```jsx
import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set token once (can be in app initialization)
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

function MapComponent() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
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

Just replace `maplibregl` with `mapboxgl` and update token/style - everything else is identical!

### Vue Example

```vue
<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const mapContainer = ref(null);
let map = null;

onMounted(() => {
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-122.4194, 37.7749],
    zoom: 12
  });
});

onUnmounted(() => {
  map?.remove();
});
</script>

<style scoped>
.map-container {
  height: 100vh;
}
</style>
```
