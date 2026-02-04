# Mapbox Framework Integration Guide

Quick reference for integrating Mapbox GL JS with React, Vue, Svelte, Angular, and Next.js.

## Critical Integration Rules

### 1. Map Lifecycle Management

**Must properly initialize and cleanup in all frameworks:**

```javascript
// ✅ Initialize once, cleanup on unmount
useEffect(() => {
  const map = new mapboxgl.Map({...});

  return () => map.remove(); // Critical: prevents memory leaks
}, []); // Empty deps = mount once
```

### 2. Never Re-initialize Map

**Problem:** Creating new map instances causes memory leaks
**Solution:** Initialize once with empty dependency array

```javascript
// ❌ Bad: Re-creates map on every state change
useEffect(() => {
  const map = new mapboxgl.Map({...});
}, [someState]); // Re-runs on state change!

// ✅ Good: Create once, update separately
useEffect(() => {
  const map = new mapboxgl.Map({...});
  return () => map.remove();
}, []); // Only runs once

useEffect(() => {
  if (map) map.setCenter(center);
}, [center]); // Update separately
```

### 3. Wait for Map Load

**All map operations must wait for 'load' event:**

```javascript
map.on('load', () => {
  // ✅ Now safe to add sources/layers
  map.addSource('data', {...});
  map.addLayer({...});
});
```

## Framework-Specific Patterns

### React

```javascript
import { useEffect, useRef } from 'react';

function MapComponent() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // Initialize only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-122.4, 37.8],
      zoom: 12
    });

    return () => map.current.remove();
  }, []);

  // Update map when props change
  useEffect(() => {
    if (!map.current) return;
    map.current.setCenter([lng, lat]);
  }, [lng, lat]);

  return <div ref={mapContainer} style={{ width: '100%', height: '400px' }} />;
}
```

### Next.js (with SSR)

```javascript
'use client'; // Mark as client component

import dynamic from 'next/dynamic';

// Option 1: Dynamic import (recommended)
const Map = dynamic(() => import('./Map'), { ssr: false });

// Option 2: Check for window
useEffect(() => {
  if (typeof window === 'undefined') return;
  const mapboxgl = require('mapbox-gl');
  // Initialize map...
}, []);
```

### Vue 3 (Composition API)

```javascript
import { onMounted, onUnmounted, ref } from 'vue';

export default {
  setup() {
    const mapContainer = ref(null);
    let map = null;

    onMounted(() => {
      map = new mapboxgl.Map({
        container: mapContainer.value,
        style: 'mapbox://styles/mapbox/streets-v12'
      });
    });

    onUnmounted(() => {
      map?.remove();
    });

    return { mapContainer };
  }
};
```

### Svelte

```javascript
<script>
  import { onMount, onDestroy } from 'svelte';
  import mapboxgl from 'mapbox-gl';

  let mapContainer;
  let map;

  onMount(() => {
    map = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/streets-v12'
    });
  });

  onDestroy(() => {
    map?.remove();
  });
</script>

<div bind:this={mapContainer}></div>
```

### Angular

```typescript
import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-map',
  template: '<div #mapContainer></div>'
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  private map!: mapboxgl.Map;

  ngOnInit() {
    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12'
    });
  }

  ngOnDestroy() {
    this.map?.remove();
  }
}
```

## State Management Patterns

### Updating Map from State

```javascript
// ✅ Separate effects for different updates
useEffect(() => {
  if (!map.current) return;
  map.current.setCenter(center);
}, [center]);

useEffect(() => {
  if (!map.current) return;
  map.current.setZoom(zoom);
}, [zoom]);

useEffect(() => {
  if (!map.current) return;
  map.current.getSource('data')?.setData(geojson);
}, [geojson]);
```

### Extracting State from Map

```javascript
// ✅ Update component state from map events
useEffect(() => {
  if (!map.current) return;

  const handleMove = () => {
    setCenter(map.current.getCenter());
    setZoom(map.current.getZoom());
  };

  map.current.on('move', handleMove);
  return () => map.current.off('move', handleMove);
}, []);
```

## Common Issues

### Issue: Map Not Visible

```javascript
// ❌ Container has no height
<div ref={mapContainer}></div>

// ✅ Container must have explicit dimensions
<div ref={mapContainer} style={{ width: '100%', height: '400px' }}></div>
```

### Issue: Map Renders Before Container

```javascript
// ❌ Map created before DOM ready
const map = new mapboxgl.Map({...}); // Too early!

// ✅ Wait for mount
useEffect(() => {
  const map = new mapboxgl.Map({...}); // DOM is ready
}, []);
```

### Issue: Memory Leaks in SPA

```javascript
// ❌ No cleanup
useEffect(() => {
  const map = new mapboxgl.Map({...});
  // Missing return statement
}, []);

// ✅ Always cleanup
useEffect(() => {
  const map = new mapboxgl.Map({...});
  return () => map.remove(); // Critical!
}, []);
```

### Issue: "Container is already initialized"

```javascript
// ❌ Multiple initializations
useEffect(() => {
  const map = new mapboxgl.Map({...});
}, [someState]); // Runs multiple times!

// ✅ Initialize once, check if exists
useEffect(() => {
  if (map.current) return; // Don't re-initialize
  map.current = new mapboxgl.Map({...});
}, []);
```

## SSR/Hydration Considerations

### Next.js App Router

```javascript
// Mark component as client-only
'use client';

// OR use dynamic import
const Map = dynamic(() => import('./Map'), { ssr: false });
```

### Next.js Pages Router

```javascript
// Disable SSR for map component
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), { ssr: false });
```

### Check for Browser Environment

```javascript
useEffect(() => {
  // Only runs in browser
  if (typeof window === 'undefined') return;

  const map = new mapboxgl.Map({...});
  return () => map.remove();
}, []);
```

## Performance Tips

1. **Code Splitting**: Dynamic import mapbox-gl (large bundle)
2. **Lazy Loading**: Load map component on demand
3. **Memoization**: Use useMemo/React.memo for expensive computations
4. **Debounce Updates**: Don't update map on every keystroke

```javascript
// ✅ Debounce state updates
const debouncedSearch = useMemo(() => debounce((query) => updateMap(query), 300), []);
```

## Integration Checklist

✅ Map initialized in mount hook (useEffect, onMounted, etc.)
✅ Cleanup with `map.remove()` in unmount hook
✅ Empty dependency array (initialize once)
✅ Container has explicit width/height
✅ Operations wait for 'load' event
✅ SSR handled (disable or check for window)
✅ State updates in separate effects
✅ Event listeners removed on cleanup
✅ No re-initialization on state changes
✅ Map reference stored (useRef, let, class property)
