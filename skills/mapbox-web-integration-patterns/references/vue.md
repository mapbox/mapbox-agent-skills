# Vue Integration

**Pattern: mounted + unmounted lifecycle hooks**

```vue
<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script>
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default {
  mounted() {
    const map = new mapboxgl.Map({
      container: this.$refs.mapContainer,
      style: 'mapbox://styles/mapbox/standard',
      center: [-71.05953, 42.3629],
      zoom: 13
    });

    // Assign map instance to component property
    this.map = map;
  },

  // CRITICAL: Clean up when component is unmounted
  unmounted() {
    this.map.remove();
    this.map = null;
  }
};
</script>

<style>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
```

**Key points:**

- Initialize in `mounted()` hook
- Access container via `this.$refs.mapContainer`
- Store map as `this.map`
- **Always implement `unmounted()` hook** to call `map.remove()`
