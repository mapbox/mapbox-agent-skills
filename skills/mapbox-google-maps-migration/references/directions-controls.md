# Directions, Routing, and Controls

## Directions / Routing

### Google Maps

```javascript
const directionsService = new google.maps.DirectionsService();
const directionsRenderer = new google.maps.DirectionsRenderer();
directionsRenderer.setMap(map);

directionsService.route(
  {
    origin: 'San Francisco, CA',
    destination: 'Los Angeles, CA',
    travelMode: 'DRIVING'
  },
  (response, status) => {
    if (status === 'OK') {
      directionsRenderer.setDirections(response);
    }
  }
);
```

### Mapbox GL JS

```javascript
// Use Mapbox Directions API
const origin = [-122.4194, 37.7749];
const destination = [-118.2437, 34.0522];

fetch(
  `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.join(',')};${destination.join(',')}?geometries=geojson&access_token=${mapboxgl.accessToken}`
)
  .then((response) => response.json())
  .then((data) => {
    const route = data.routes[0].geometry;

    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: route
      }
    });

    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      paint: {
        'line-color': '#3887be',
        'line-width': 5
      }
    });
  });

// Or use @mapbox/mapbox-gl-directions plugin
const directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken
});

map.addControl(directions, 'top-left');
```

## Controls

### Google Maps

```javascript
// Controls are automatic, can configure:
map.setOptions({
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true
});
```

### Mapbox GL JS

```javascript
// Add controls explicitly
map.addControl(new mapboxgl.NavigationControl()); // Zoom + rotation
map.addControl(new mapboxgl.FullscreenControl());
map.addControl(new mapboxgl.GeolocateControl());
map.addControl(new mapboxgl.ScaleControl());

// Position controls
map.addControl(new mapboxgl.NavigationControl(), 'top-right');
```
