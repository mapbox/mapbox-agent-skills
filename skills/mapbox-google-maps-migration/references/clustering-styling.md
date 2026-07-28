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
  slot: 'middle', // above roads, behind labels — no slot means above everything
  source: 'points',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
    'circle-emissive-strength': 1 // or the clusters vanish at dusk/night
  }
});

// Cluster count labels
map.addLayer({
  id: 'cluster-count',
  type: 'symbol',
  slot: 'top',
  source: 'points',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12
  },
  paint: {
    'text-color': '#ffffff'
  }
});

// Unclustered points
map.addLayer({
  id: 'unclustered-point',
  type: 'circle',
  slot: 'middle',
  source: 'points',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#11b4da',
    'circle-radius': 8,
    'circle-emissive-strength': 1
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

- **`standard`** is the recommended default — 3D buildings and landmarks, dynamic lighting, and a **config surface** you change at runtime with no reload
- `standard-satellite` for imagery with roads, labels, and boundaries on top
- Classic styles (2D, no slots, no config surface): `streets-v12`, `outdoors-v12`, `light-v11`, `dark-v11`, `satellite-v9`, `satellite-streets-v12`
- Custom styles via Mapbox Studio for unique branding and design
- Dynamic styling based on data properties
- On Standard, appearance changes go through `setConfigProperty`. On Classic styles you edit layer paint directly with `setPaintProperty()`

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
// ✅ Dark mode on Standard: one config property, no reload
map.setConfigProperty('basemap', 'lightPreset', 'night');

// ✅ Other basemap appearance changes, also config
map.setConfigProperty('basemap', 'theme', 'monochrome');
map.setConfigProperty('basemap', 'colorWater', 'hsl(202, 75%, 70%)');

// A brand-tuned style authored in Mapbox Studio — setStyle() is correct here,
// because you really are changing which style is loaded
map.setStyle('mapbox://styles/yourusername/your-style-id');

// ❌ Don't do this for dark mode. It tears down the whole style and drops your
// config, and it leaves you maintaining two styles instead of one.
// map.setStyle('mapbox://styles/mapbox/dark-v11');

// Classic styles only — Standard's basemap layers aren't addressable this way
map.setPaintProperty('water', 'fill-color', '#242f3e');
```

**Migrating a Google `styles` array:** don't translate it rule-by-rule into `setPaintProperty` calls. Map the _intent_ onto Standard config — a muted base becomes `theme: 'faded'` or `'monochrome'`, a dark map becomes `lightPreset: 'night'`, hidden POIs become `showPointOfInterestLabels: false`, and brand colors go on your own markers and routes rather than on basemap roads, water, or land. See the **mapbox-cartography** skill.
