# Performance Optimization

## Vector Tiles vs GeoJSON

**When to use each:**

| Data Size | Format                  | Reason                                  |
| --------- | ----------------------- | --------------------------------------- |
| < 5 MB    | GeoJSON                 | Simple, no processing needed            |
| 5-20 MB   | GeoJSON or Vector Tiles | Consider data update frequency          |
| > 20 MB   | Vector Tiles            | Better performance, progressive loading |

**Vector Tile Pattern:**

```javascript
map.addSource('large-dataset', {
  type: 'vector',
  tiles: ['https://example.com/tiles/{z}/{x}/{y}.mvt'],
  minzoom: 0,
  maxzoom: 14
});

map.addLayer({
  id: 'data-layer',
  type: 'fill',
  source: 'large-dataset',
  'source-layer': 'data-layer-name', // Layer name in the tileset
  paint: {
    'fill-color': ['get', 'color'],
    'fill-opacity': 0.7
  }
});
```

## Feature State for Dynamic Styling

**Pattern:** Update styling without modifying geometry

```javascript
map.on('load', () => {
  map.addSource('states', {
    type: 'geojson',
    data: statesData,
    generateId: true // Important for feature state
  });

  map.addLayer({
    id: 'states',
    type: 'fill',
    source: 'states',
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#ff0000', // Hover color
        '#3b9ddd' // Default color
      ]
    }
  });

  let hoveredStateId = null;

  // Update feature state on hover
  map.on('mousemove', 'states', (e) => {
    if (e.features.length > 0) {
      if (hoveredStateId !== null) {
        map.setFeatureState({ source: 'states', id: hoveredStateId }, { hover: false });
      }

      hoveredStateId = e.features[0].id;

      map.setFeatureState({ source: 'states', id: hoveredStateId }, { hover: true });
    }
  });

  map.on('mouseleave', 'states', () => {
    if (hoveredStateId !== null) {
      map.setFeatureState({ source: 'states', id: hoveredStateId }, { hover: false });
    }
    hoveredStateId = null;
  });
});
```

## Filtering Large Datasets

**Pattern:** Filter data client-side for performance

```javascript
map.on('load', () => {
  map.addSource('all-data', {
    type: 'geojson',
    data: largeDataset
  });

  map.addLayer({
    id: 'filtered-data',
    type: 'circle',
    source: 'all-data',
    filter: ['>=', ['get', 'value'], 50], // Only show values >= 50
    paint: {
      'circle-radius': 6,
      'circle-color': '#ff4444'
    }
  });

  // Update filter dynamically
  function updateFilter(minValue) {
    map.setFilter('filtered-data', ['>=', ['get', 'value'], minValue]);
  }

  // Slider for dynamic filtering
  document.getElementById('filter-slider').addEventListener('input', (e) => {
    updateFilter(parseFloat(e.target.value));
  });
});
```

## Progressive Loading

**Pattern:** Load data in chunks as needed

```javascript
// Helper to check if feature is in bounds
function isFeatureInBounds(feature, bounds) {
  const coords = feature.geometry.coordinates;

  // Handle different geometry types
  if (feature.geometry.type === 'Point') {
    return bounds.contains(coords);
  } else if (feature.geometry.type === 'LineString') {
    return coords.some((coord) => bounds.contains(coord));
  } else if (feature.geometry.type === 'Polygon') {
    return coords[0].some((coord) => bounds.contains(coord));
  }
  return false;
}

const bounds = map.getBounds();
const visibleData = allData.features.filter((feature) => isFeatureInBounds(feature, bounds));

map.getSource('data-source').setData({
  type: 'FeatureCollection',
  features: visibleData
});

// Reload on map move with debouncing
let updateTimeout;
map.on('moveend', () => {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    const bounds = map.getBounds();
    const visibleData = allData.features.filter((feature) => isFeatureInBounds(feature, bounds));

    map.getSource('data-source').setData({
      type: 'FeatureCollection',
      features: visibleData
    });
  }, 150);
});
```
