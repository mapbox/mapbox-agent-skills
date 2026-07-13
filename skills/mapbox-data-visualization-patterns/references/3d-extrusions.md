# 3D Extrusions

**Best for:** Building heights, elevation data, volumetric representation

**Pattern:** Extrude polygons based on data

> **Note:** The example below works with **classic styles only** (`streets-v12`, `dark-v11`, `light-v11`, etc.). The **Mapbox Standard style** includes 3D buildings with much greater detail by default.

```javascript
map.on('load', () => {
  // Insert the layer beneath any symbol layer for proper ordering
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find((layer) => layer.type === 'symbol' && layer.layout['text-field']).id;

  // Add 3D buildings from basemap
  map.addLayer(
    {
      id: 'add-3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': '#aaa',
        // Smoothly transition height on zoom
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'height']],
        'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'min_height']],
        'fill-extrusion-opacity': 0.6
      }
    },
    labelLayerId
  );

  // Enable pitch and bearing for 3D view
  map.setPitch(45);
  map.setBearing(-17.6);
});
```

**Using Custom Data Source:**

```javascript
map.on('load', () => {
  // Add your own buildings data
  map.addSource('custom-buildings', {
    type: 'geojson',
    data: 'https://example.com/buildings.geojson'
  });

  // Add 3D buildings layer
  map.addLayer({
    id: '3d-custom-buildings',
    type: 'fill-extrusion',
    source: 'custom-buildings',
    paint: {
      // Height in meters
      'fill-extrusion-height': ['get', 'height'],
      // Base height if building on terrain
      'fill-extrusion-base': ['get', 'base_height'],
      // Color by building type or height
      'fill-extrusion-color': [
        'interpolate',
        ['linear'],
        ['get', 'height'],
        0,
        '#fafa6e',
        50,
        '#eca25b',
        100,
        '#e64a45',
        200,
        '#a63e3e'
      ],
      'fill-extrusion-opacity': 0.9
    }
  });
});
```

**Data-Driven 3D Heights:**

```javascript
// Population density visualization
'fill-extrusion-height': [
  'interpolate',
  ['linear'],
  ['get', 'density'],
  0, 0,
  1000, 500,    // 1000 people/sq mi = 500m height
  10000, 5000
]

// Revenue visualization (scale for visibility)
'fill-extrusion-height': [
  '*',
  ['get', 'revenue'],
  0.001  // Scale factor
]
```
