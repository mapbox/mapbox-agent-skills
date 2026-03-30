# Memory Management

**Problem:** Memory leaks cause browser tabs to become unresponsive over time. In SPAs that create/destroy map instances, this is a common production issue.

## Always Clean Up Map Resources

```javascript
// ✅ Essential cleanup pattern
function cleanupMap(map) {
  if (!map) return;

  // 1. Remove event listeners
  map.off('load', handleLoad);
  map.off('move', handleMove);

  // 2. Remove layers (if adding/removing dynamically)
  if (map.getLayer('dynamic-layer')) {
    map.removeLayer('dynamic-layer');
  }

  // 3. Remove sources (if adding/removing dynamically)
  if (map.getSource('dynamic-source')) {
    map.removeSource('dynamic-source');
  }

  // 4. Remove controls
  map.removeControl(navigationControl);

  // 5. CRITICAL: Remove map instance
  map.remove();
}

// React example
useEffect(() => {
  const map = new mapboxgl.Map({
    /* config */
  });

  return () => {
    cleanupMap(map); // Called on unmount
  };
}, []);
```

## Clean Up Popups and Markers

```javascript
// ❌ BAD: Creates new popup on every click (memory leak)
map.on('click', 'restaurants', (e) => {
  new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(e.features[0].properties.name).addTo(map);
  // Popup never removed!
});

// ✅ GOOD: Reuse single popup instance
let popup = new mapboxgl.Popup({ closeOnClick: true });

map.on('click', 'restaurants', (e) => {
  popup.setLngLat(e.lngLat).setHTML(e.features[0].properties.name).addTo(map);
  // Previous popup content replaced, no leak
});

// Cleanup
function cleanup() {
  popup.remove();
  popup = null;
}
```

## Use Feature State Instead of New Layers

```javascript
// ❌ BAD: Create new layer for hover (memory overhead, causes re-render)
let hoveredFeatureId = null;

map.on('mousemove', 'restaurants', (e) => {
  if (map.getLayer('hover-layer')) {
    map.removeLayer('hover-layer');
  }
  map.addLayer({
    id: 'hover-layer',
    type: 'circle',
    source: 'restaurants',
    filter: ['==', ['id'], e.features[0].id],
    paint: { 'circle-color': 'yellow' }
  });
});

// ✅ GOOD: Use feature state (efficient, no layer creation)
map.on('mousemove', 'restaurants', (e) => {
  if (e.features.length > 0) {
    // Remove previous hover state
    if (hoveredFeatureId !== null) {
      map.setFeatureState({ source: 'restaurants', id: hoveredFeatureId }, { hover: false });
    }

    // Set new hover state
    hoveredFeatureId = e.features[0].id;
    map.setFeatureState({ source: 'restaurants', id: hoveredFeatureId }, { hover: true });
  }
});

// Style uses feature state
map.addLayer({
  id: 'restaurants',
  type: 'circle',
  source: 'restaurants',
  paint: {
    'circle-color': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      '#ffff00', // Yellow when hover
      '#0000ff' // Blue otherwise
    ]
  }
});
```

**Note:** Feature state requires features to have IDs. Use `generateId: true` on the GeoJSON source to auto-assign IDs, or use `promoteId` to use an existing property as the feature ID.

**Impact:** Prevents memory growth from continuous layer churn over long sessions
