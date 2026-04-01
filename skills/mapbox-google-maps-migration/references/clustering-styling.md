# Clustering and Styling

## Clustering

### Google Maps

```javascript
// Requires MarkerClusterer library
import MarkerClusterer from '@googlemaps/markerclustererplus';

const markers = locations.map((loc) => new google.maps.Marker({ position: loc, map: map }));

new MarkerClusterer(map, markers, {
  imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
});
```

### Mapbox GL JS

```javascript
// Built-in clustering support
map.addSource('points', {
  type: 'geojson',
  data: geojsonData,
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50
});

// Cluster circles
map.addLayer({
  id: 'clusters',
  type: 'circle',
  source: 'points',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
  }
});

// Cluster count labels
map.addLayer({
  id: 'cluster-count',
  type: 'symbol',
  source: 'points',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-size': 12
  }
});

// Unclustered points
map.addLayer({
  id: 'unclustered-point',
  type: 'circle',
  source: 'points',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#11b4da',
    'circle-radius': 8
  }
});
```

**Key Advantage:** Mapbox clustering is built-in and highly performant.

## Styling and Appearance

### Map Types vs. Styles

**Google Maps:**

- Limited map types: roadmap, satellite, hybrid, terrain
- Styling via `styles` array (complex)

**Mapbox GL JS:**

- Full control over every visual element
- Pre-built styles: standard, standard-satellite, streets, outdoors, light, dark
- Custom styles via Mapbox Studio for unique branding and design
- Dynamic styling based on data properties
- For classic styles (pre Mapbox Standard) you can modify style programmatically by using the setPaintProperty()

### Custom Styling Example

**Google Maps:**

```javascript
const styledMapType = new google.maps.StyledMapType(
  [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] }
    // ... many more rules
  ],
  { name: 'Dark' }
);

map.mapTypes.set('dark', styledMapType);
map.setMapTypeId('dark');
```

**Mapbox GL JS:**

```javascript
// Use pre-built style
map.setStyle('mapbox://styles/mapbox/dark-v11');

// Or create custom style in Mapbox Studio and reference it
map.setStyle('mapbox://styles/yourusername/your-style-id');

// Modify classic styles programmatically
map.setPaintProperty('water', 'fill-color', '#242f3e');
```
