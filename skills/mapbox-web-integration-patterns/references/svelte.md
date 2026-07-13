# Svelte Integration

**Pattern: onMount + onDestroy**

```svelte
<script>
  import mapboxgl from 'mapbox-gl'
  import 'mapbox-gl/dist/mapbox-gl.css'
  import { onMount, onDestroy } from 'svelte'

  let map
  let mapContainer

  onMount(() => {
    map = new mapboxgl.Map({
      container: mapContainer,
      accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
      center: [-71.05953, 42.36290],
      zoom: 13
    })
  })

  // CRITICAL: Clean up on component destroy
  onDestroy(() => {
    map.remove()
  })
</script>

<div class="map" bind:this={mapContainer}></div>

<style>
  .map {
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>
```

**Key points:**

- Use `onMount` for initialization
- Bind container with `bind:this={mapContainer}`
- **Always implement `onDestroy`** to call `map.remove()`
- Can pass `accessToken` directly to Map constructor in Svelte
