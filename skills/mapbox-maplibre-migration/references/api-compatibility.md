# API Compatibility Matrix

## 100% Compatible APIs

These work identically in both libraries:

```javascript
// Map methods
map.setCenter([lng, lat]);
map.setZoom(zoom);
map.fitBounds(bounds);
map.panTo([lng, lat]);
map.flyTo({ center, zoom });
map.getCenter();
map.getZoom();
map.getBounds();
map.resize();

// Events
map.on('load', callback);
map.on('click', callback);
map.on('move', callback);
map.on('zoom', callback);
map.on('rotate', callback);

// Markers
new mapboxgl.Marker();
marker.setLngLat([lng, lat]);
marker.setPopup(popup);
marker.addTo(map);
marker.remove();
marker.setDraggable(true);

// Popups
new mapboxgl.Popup();
popup.setLngLat([lng, lat]);
popup.setHTML(html);
popup.setText(text);
popup.addTo(map);

// Sources & Layers
map.addSource(id, source);
map.removeSource(id);
map.addLayer(layer);
map.removeLayer(id);
map.getSource(id);
map.getLayer(id);

// Styling
map.setPaintProperty(layerId, property, value);
map.setLayoutProperty(layerId, property, value);
map.setFilter(layerId, filter);

// Controls
map.addControl(control, position);
new mapboxgl.NavigationControl();
new mapboxgl.GeolocateControl();
new mapboxgl.FullscreenControl();
new mapboxgl.ScaleControl();
```

## Side-by-Side Example

### MapLibre GL JS (Before)

```javascript
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// No token needed for OSM tiles

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-122.4194, 37.7749],
  zoom: 12
});

map.on('load', () => {
  new maplibregl.Marker()
    .setLngLat([-122.4194, 37.7749])
    .setPopup(new maplibregl.Popup().setText('San Francisco'))
    .addTo(map);
});
```

### Mapbox GL JS (After)

```javascript
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Add your Mapbox token
mapboxgl.accessToken = 'pk.your_mapbox_access_token';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-122.4194, 37.7749],
  zoom: 12
});

map.on('load', () => {
  new mapboxgl.Marker()
    .setLngLat([-122.4194, 37.7749])
    .setPopup(new mapboxgl.Popup().setText('San Francisco'))
    .addTo(map);
});
```

**What's different:** Package, import, token, and style URL. **Everything else is identical.**
