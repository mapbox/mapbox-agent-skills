# Optimize Map Interactions

**Problem:** Unthrottled event handlers cause performance degradation.

## Anti-Pattern: Expensive Operations on Every Event

```javascript
// ❌ BAD: Runs ~60 times per second during pan (once per render frame)
map.on('move', () => {
  updateVisibleFeatures(); // Expensive query
  fetchDataFromAPI(); // Network request
  updateUI(); // DOM manipulation
});
```

## Debounce/Throttle Events

```javascript
// ✅ GOOD: Throttle during interaction, finalize on idle
let throttleTimeout;

// Lightweight updates during move (throttled)
map.on('move', () => {
  if (throttleTimeout) return;
  throttleTimeout = setTimeout(() => {
    updateMapCenter(); // Cheap update
    throttleTimeout = null;
  }, 100);
});

// Expensive operations after interaction stops
map.on('moveend', () => {
  updateVisibleFeatures();
  fetchDataFromAPI();
  updateUI();
});
```

## Optimize Feature Queries

```javascript
// ❌ BAD: Query all features (expensive with many layers)
map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point);
  console.log(features); // Could be 100+ features from all layers
});

// ✅ GOOD: Query specific layers only
map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['restaurants', 'shops'] // Only query these layers
  });

  if (features.length > 0) {
    showPopup(features[0]);
  }
});

// ✅ For touch targets or fuzzy clicks: Use a bounding box
map.on('click', (e) => {
  const bbox = [
    [e.point.x - 5, e.point.y - 5],
    [e.point.x + 5, e.point.y + 5]
  ];
  const features = map.queryRenderedFeatures(bbox, {
    layers: ['restaurants'],
    filter: ['==', ['get', 'type'], 'pizza'] // Further narrow results
  });
});
```

## Batch DOM Updates

```javascript
// ❌ BAD: Update DOM for every feature
map.on('mousemove', 'restaurants', (e) => {
  e.features.forEach((feature) => {
    document.getElementById(feature.id).classList.add('highlight');
  });
});

// ✅ GOOD: Batch updates with requestAnimationFrame
let pendingUpdates = new Set();
let rafScheduled = false;

map.on('mousemove', 'restaurants', (e) => {
  e.features.forEach((f) => pendingUpdates.add(f.id));

  if (!rafScheduled) {
    rafScheduled = true;
    requestAnimationFrame(() => {
      pendingUpdates.forEach((id) => {
        document.getElementById(id).classList.add('highlight');
      });
      pendingUpdates.clear();
      rafScheduled = false;
    });
  }
});
```

**Impact:** 60 FPS maintained during interaction vs 15-20 FPS without optimization
