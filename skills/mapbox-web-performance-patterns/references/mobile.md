# Mobile Performance

**Problem:** Mobile devices have limited resources (CPU, GPU, memory, battery).

## Mobile-Specific Optimizations

```javascript
// Detect mobile device
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',

  // Mobile optimizations
  ...(isMobile && {
    // Limit max zoom to reduce tile fetching at extreme zoom levels
    maxZoom: 18,

    // fadeDuration controls symbol collision fade animation only
    // Reducing it makes label transitions snappier
    fadeDuration: 0
  })
});

// Load simpler layers on mobile
map.on('load', () => {
  if (isMobile) {
    // Circle layers are cheaper than symbol layers (no collision detection,
    // no texture atlas, no text shaping)
    map.addLayer({
      id: 'markers-mobile',
      type: 'circle',
      source: 'data',
      paint: {
        'circle-radius': 8,
        'circle-color': '#007cbf'
      }
    });
  } else {
    // Rich desktop rendering with icons and labels
    map.addLayer({
      id: 'markers-desktop',
      type: 'symbol',
      source: 'data',
      layout: {
        'icon-image': 'marker',
        'icon-size': 1,
        'text-field': ['get', 'name'],
        'text-size': 12,
        'text-offset': [0, 1.5]
      }
    });
  }
});
```

## Touch Interaction Optimization

```javascript
// ✅ Simplify touch gestures
map.touchZoomRotate.disableRotation(); // Disable rotation (simpler gestures, fewer accidental rotations)

// Debounce expensive operations during touch
let touchTimeout;
map.on('touchmove', () => {
  if (touchTimeout) clearTimeout(touchTimeout);
  touchTimeout = setTimeout(() => {
    updateVisibleData();
  }, 500); // Wait for touch to settle
});
```

## Performance-Sensitive Constructor Options

```javascript
// These options have real GPU/performance costs -- only enable when needed
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',

  // Default false -- only set true if you need map.getCanvas().toDataURL()
  // Costs: prevents GPU buffer optimization
  preserveDrawingBuffer: false,

  // Default false -- only set true if you need smooth diagonal lines
  // Costs: enables MSAA which increases GPU memory and fill cost
  antialias: false
});
```
