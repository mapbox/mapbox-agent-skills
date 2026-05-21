# Data Updates, Performance, and Common Migration Patterns

## Data Updates

### Google Maps

```javascript
// Update marker position
marker.setPosition({ lat: 37.7849, lng: -122.4094 });

// Update polygon path
polygon.setPath(newCoordinates);
```

### Mapbox GL JS

```javascript
// Update source data
map.getSource('points').setData(newGeojsonData);

// Or update specific features
const source = map.getSource('points');
const data = source._data;
data.features[0].geometry.coordinates = [-122.4094, 37.7849];
source.setData(data);
```

## Performance Considerations

### Google Maps

- Individual objects for each feature
- Can be slow with 1000+ markers
- Requires MarkerClusterer for performance

### Mapbox GL JS

- Data-driven rendering
- WebGL-based (hardware accelerated)
- Handles 10,000+ points smoothly
- Built-in clustering

**Migration Tip:** If you have performance issues with Google Maps (many markers), Mapbox will likely perform significantly better.

## Common Migration Patterns

### Pattern 1: Store Locator

**Google Maps approach:**

1. Create marker for each store
2. Add click listeners to each marker
3. Show info window on click

**Mapbox approach:**

1. Add all stores as GeoJSON source
2. Add symbol layer for markers
3. Use layer click event for all markers
4. More performant, cleaner code

### Pattern 2: Drawing Tools

**Google Maps:**

- Use Drawing Manager library
- Creates overlay objects

**Mapbox:**

- Use Mapbox Draw plugin
- More powerful, customizable
- Better for complex editing

### Pattern 3: Heatmaps

**Google Maps:**

```javascript
const heatmap = new google.maps.visualization.HeatmapLayer({
  data: points,
  map: map
});
```

**Mapbox:**

```javascript
map.addLayer({
  id: 'heatmap',
  type: 'heatmap',
  source: 'points',
  paint: {
    'heatmap-intensity': 1,
    'heatmap-radius': 50,
    'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,255,0)', 0.5, 'lime', 1, 'red']
  }
});
```
