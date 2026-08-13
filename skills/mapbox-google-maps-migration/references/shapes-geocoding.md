# Shapes, Custom Icons, and Geocoding

## Polygons and Shapes

### Google Maps

```javascript
const polygon = new google.maps.Polygon({
  paths: [
    { lat: 37.7749, lng: -122.4194 },
    { lat: 37.7849, lng: -122.4094 },
    { lat: 37.7649, lng: -122.4094 }
  ],
  strokeColor: '#FF0000',
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: '#FF0000',
  fillOpacity: 0.35,
  map: map
});
```

### Mapbox GL JS

```javascript
map.addSource('polygon', {
  type: 'geojson',
  data: {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-122.4194, 37.7749],
          [-122.4094, 37.7849],
          [-122.4094, 37.7649],
          [-122.4194, 37.7749] // Close the ring
        ]
      ]
    }
  }
});

map.addLayer({
  id: 'polygon-layer',
  type: 'fill',
  slot: 'middle', // no slot means it draws above the street labels
  source: 'polygon',
  paint: {
    'fill-color': '#FF0000',
    'fill-opacity': 0.35,
    'fill-emissive-strength': 1 // or it vanishes at dusk/night
  }
});

// Add outline
map.addLayer({
  id: 'polygon-outline',
  type: 'line',
  slot: 'middle',
  source: 'polygon',
  paint: {
    'line-color': '#FF0000',
    'line-width': 2,
    'line-opacity': 0.8,
    'line-emissive-strength': 1
  }
});
```

## Polylines / Lines

### Google Maps

```javascript
const line = new google.maps.Polyline({
  path: [
    { lat: 37.7749, lng: -122.4194 },
    { lat: 37.7849, lng: -122.4094 }
  ],
  strokeColor: '#0000FF',
  strokeWeight: 3,
  map: map
});
```

### Mapbox GL JS

```javascript
map.addSource('route', {
  type: 'geojson',
  data: {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849]
      ]
    }
  }
});

map.addLayer({
  id: 'route-layer',
  type: 'line',
  slot: 'middle', // routes go in `middle`: above roads, under labels and 3D
  source: 'route',
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': '#0000FF',
    'line-width': 3,
    'line-emissive-strength': 1,
    'line-occlusion-opacity': 1 // 3D buildings don't hide the route
  }
});
```

## Custom Icons and Symbols

### Google Maps

```javascript
const marker = new google.maps.Marker({
  position: { lat: 37.7749, lng: -122.4194 },
  map: map,
  icon: {
    url: 'marker.png',
    scaledSize: new google.maps.Size(32, 32)
  }
});
```

### Mapbox GL JS

**Option 1: HTML Marker**

```javascript
const el = document.createElement('div');
el.className = 'marker';
el.style.backgroundImage = 'url(marker.png)';
el.style.width = '32px';
el.style.height = '32px';

new mapboxgl.Marker(el).setLngLat([-122.4194, 37.7749]).addTo(map);
```

**Option 2: Symbol Layer (Better Performance)**

```javascript
// Load image
map.loadImage('marker.png', (error, image) => {
  if (error) throw error;
  map.addImage('custom-marker', image);

  map.addLayer({
    id: 'markers',
    type: 'symbol',
    slot: 'top', // markers and active selections belong in `top`
    source: 'points',
    layout: {
      'icon-image': 'custom-marker',
      'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.7, 16, 1],
      'icon-allow-overlap': true // the default hides colliding icons
    }
  });
});
```

## Geocoding

### Google Maps

```javascript
const geocoder = new google.maps.Geocoder();

geocoder.geocode({ address: '1600 Amphitheatre Parkway' }, (results, status) => {
  if (status === 'OK') {
    map.setCenter(results[0].geometry.location);
  }
});
```

### Mapbox GL JS

```javascript
// Use Mapbox Geocoding API v6
fetch(
  `https://api.mapbox.com/search/geocode/v6/forward?q=1600+Amphitheatre+Parkway&access_token=${mapboxgl.accessToken}`
)
  .then((response) => response.json())
  .then((data) => {
    const [lng, lat] = data.features[0].geometry.coordinates;
    map.setCenter([lng, lat]);
  });

// Or use mapbox-gl-geocoder plugin
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl
});

map.addControl(geocoder);
```
