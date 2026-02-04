# Google Maps to Mapbox GL JS Migration Guide

Quick reference for migrating from Google Maps Platform to Mapbox GL JS with API equivalents and patterns.

## Critical Differences

| Aspect             | Google Maps             | Mapbox GL JS              |
| ------------------ | ----------------------- | ------------------------- |
| **Coordinates**    | `{lat, lng}` objects    | `[lng, lat]` arrays       |
| **Philosophy**     | Imperative (objects)    | Declarative (data-driven) |
| **Rendering**      | DOM elements            | WebGL (much faster)       |
| **Performance**    | Slow with 500+ markers  | Fast with 10,000+ points  |
| **Initialization** | `new google.maps.Map()` | `new mapboxgl.Map()`      |

## Quick Migration Checklist

✅ Install `mapbox-gl` package
✅ Get Mapbox access token
✅ Swap coordinate order (lat,lng → lng,lat)
✅ Replace Google Maps API with Mapbox equivalents
✅ Use Symbol layers for 100+ markers (not HTML markers)
✅ Add clustering for 500+ points
✅ Update geocoding to Mapbox Geocoding API
✅ Test all functionality

## API Equivalents

### Map Initialization

```javascript
// Google Maps
const map = new google.maps.Map(document.getElementById('map'), {
  center: { lat: 37.7749, lng: -122.4194 },
  zoom: 12
});

// Mapbox GL JS
mapboxgl.accessToken = 'pk.your_token';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-122.4194, 37.7749], // Note: [lng, lat]
  zoom: 12
});
```

### Individual Markers (< 50 points)

```javascript
// Google Maps
const marker = new google.maps.Marker({
  position: { lat: 37.7749, lng: -122.4194 },
  map: map
});

// Mapbox (equivalent approach)
const marker = new mapboxgl.Marker().setLngLat([-122.4194, 37.7749]).addTo(map);
```

### Many Markers (100+ points) - Performance Critical

```javascript
// ❌ Google Maps: DOM-based (slow with 500+ markers)
locations.forEach((loc) => {
  new google.maps.Marker({
    position: { lat: loc.lat, lng: loc.lng },
    map: map
  });
});

// ✅ Mapbox: WebGL-based (fast with 10,000+ points)
map.addSource('points', {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: locations.map((loc) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [loc.lng, loc.lat] }
    }))
  }
});

map.addLayer({
  id: 'points',
  type: 'symbol',
  source: 'points',
  layout: {
    'icon-image': 'marker-15'
  }
});
```

**Performance Note:** Google Maps renders ALL markers as DOM elements (even with Data Layer). Mapbox uses WebGL for Symbol/Circle layers = 10-100x faster for large datasets.

### Clustering (500+ points)

```javascript
// Google Maps (requires MarkerClusterer library)
import MarkerClusterer from '@googlemaps/markerclustererplus';
const clusterer = new MarkerClusterer(map, markers);

// Mapbox (built-in)
map.addSource('points', {
  type: 'geojson',
  data: geojson,
  cluster: true,
  clusterRadius: 50
});
```

### Info Windows / Popups

```javascript
// Google Maps
const infowindow = new google.maps.InfoWindow({
  content: '<h3>Title</h3>'
});
infowindow.open(map, marker);

// Mapbox
const popup = new mapboxgl.Popup().setHTML('<h3>Title</h3>').setLngLat([-122.4194, 37.7749]).addTo(map);

// Or attach to marker
marker.setPopup(popup);
```

### Events

```javascript
// Google Maps
marker.addListener('click', () => {
  /* ... */
});
map.addListener('click', (e) => {
  const lat = e.latLng.lat();
  const lng = e.latLng.lng();
});

// Mapbox
marker.on('click', () => {
  /* ... */
});
map.on('click', (e) => {
  const [lng, lat] = [e.lngLat.lng, e.lngLat.lat];
});
```

### Geocoding

```javascript
// Google Maps
const geocoder = new google.maps.Geocoder();
geocoder.geocode({ address: '1600 Amphitheatre Parkway' }, (results) => {
  map.setCenter(results[0].geometry.location);
});

// Mapbox
fetch(
  `https://api.mapbox.com/search/geocode/v6/forward?q=1600+Amphitheatre+Parkway&access_token=${mapboxgl.accessToken}`
)
  .then((r) => r.json())
  .then((data) => {
    const [lng, lat] = data.features[0].geometry.coordinates;
    map.setCenter([lng, lat]);
  });
```

### Directions

```javascript
// Google Maps
const directionsService = new google.maps.DirectionsService();
directionsService.route(
  {
    origin: 'San Francisco',
    destination: 'Los Angeles',
    travelMode: 'DRIVING'
  },
  (result) => {
    /* ... */
  }
);

// Mapbox
fetch(
  `https://api.mapbox.com/directions/v5/mapbox/driving/-122.4194,37.7749;-118.2437,34.0522?access_token=${mapboxgl.accessToken}`
)
  .then((r) => r.json())
  .then((data) => {
    const route = data.routes[0].geometry;
    // Display route on map
  });
```

### Polygons/Shapes

```javascript
// Google Maps
const polygon = new google.maps.Polygon({
  paths: coordinates,
  map: map
});

// Mapbox
map.addSource('polygon', {
  type: 'geojson',
  data: {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates] // Note: Array of arrays
    }
  }
});

map.addLayer({
  id: 'polygon',
  type: 'fill',
  source: 'polygon',
  paint: {
    'fill-color': '#088',
    'fill-opacity': 0.5
  }
});
```

## Coordinate Order - CRITICAL

**Most common migration bug:**

```javascript
// ❌ Google Maps order (lat, lng)
{ lat: 37.7749, lng: -122.4194 }

// ✅ Mapbox order (lng, lat)
[-122.4194, 37.7749]

// Remember: Mapbox follows GeoJSON standard (longitude first)
```

## Performance Advantages

**Mapbox is significantly faster for:**

1. **Large datasets:** 500+ markers (Symbol layers vs DOM markers)
2. **Data visualization:** Choropleth, heatmaps (WebGL rendering)
3. **Custom styling:** Full control over every visual element
4. **Vector tiles:** Efficient data loading and rendering

**When Mapbox wins:**

- Rendering 10,000+ points smoothly
- Custom map styles (not just pins on a map)
- Data-driven visualizations
- Performance-critical applications

**When Google Maps might be better:**

- Need Street View
- Heavy Google Workspace integration
- Places API is critical
- Team has deep Google Maps expertise

## Styling Comparison

```javascript
// Google Maps (limited styling)
const styledMapType = new google.maps.StyledMapType([{ elementType: 'geometry', stylers: [{ color: '#242f3e' }] }]);

// Mapbox (full control)
map.setStyle('mapbox://styles/mapbox/dark-v11');
// Or create custom styles in Mapbox Studio
```

**Mapbox Styles:**

- `streets-v12` - Standard streets
- `outdoors-v12` - Hiking/outdoor
- `light-v11` / `dark-v11` - Minimal
- `satellite-v9` / `satellite-streets-v12` - Imagery
- Custom styles via Mapbox Studio

## Common Migration Patterns

### Store Locator

**Google Maps:** Create marker for each store, add click listeners, show info windows
**Mapbox:** Use Symbol layer + click events + popups (much faster for 100+ stores)

### Route Display

**Google Maps:** DirectionsRenderer
**Mapbox:** Fetch route from Directions API, add as Line layer

### Heatmaps

**Google Maps:** HeatmapLayer (DOM-based)
**Mapbox:** Heatmap layer (WebGL-based, much faster)

## Token & Pricing

**Google Maps:**

- Requires API key
- Pay per map load + API calls
- Free tier: $200/month credit

**Mapbox:**

- Requires access token (pk.\* for client-side)
- Pay per map load + API calls
- Free tier: 50,000 map loads/month

**Token setup:**

```javascript
// Store in environment variables
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
```

## Testing Migration

**Checklist:**

1. ✅ Map displays at correct location
2. ✅ All markers/pins visible
3. ✅ Click events work
4. ✅ Popups display correctly
5. ✅ Geocoding returns results
6. ✅ Directions routing works
7. ✅ Performance improved (if using Symbol layers)
8. ✅ Mobile works (touch events)

## Migration Strategy

**Phase 1: Setup**

- Install Mapbox GL JS
- Get access token
- Create test page

**Phase 2: Core Migration**

- Initialize map
- Swap coordinate order
- Convert markers (use Symbol layers for 100+)
- Migrate popups/info windows

**Phase 3: Features**

- Geocoding
- Directions
- Custom styling
- Events

**Phase 4: Optimization**

- Add clustering (if 500+ points)
- Implement proper cleanup
- Test performance
- Mobile optimization

## Quick Wins

**Easy migrations (mostly drop-in replacements):**

- Basic map initialization
- Individual markers (< 50)
- Popups
- Map controls
- Click events

**Requires rethinking (but worth it):**

- Large marker sets → Symbol layers (10-100x faster)
- Custom styling → Mapbox Studio
- Heatmaps → Heatmap layers (WebGL)

## When NOT to Migrate

Consider staying with Google Maps if:

- Street View is critical
- Heavy Places API usage
- Team has deep Google Maps expertise
- Already heavily optimized
- Short-term project
