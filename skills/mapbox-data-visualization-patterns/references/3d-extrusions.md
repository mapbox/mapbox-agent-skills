# 3D Extrusions

**Best for:** Building heights, elevation data, volumetric representation

**Pattern:** Extrude polygons based on data

## On the Standard style: don't add basemap buildings yourself

Standard already ships high-detail 3D buildings and landmarks. Toggle them with config — never re-add them as a custom layer:

```javascript
map.setConfigProperty('basemap', 'show3dObjects', true); // all 3D
map.setConfigProperty('basemap', 'show3dBuildings', true); // buildings only
map.setConfigProperty('basemap', 'show3dLandmarks', true); // landmark models
```

Custom `fill-extrusion` layers of _your own_ data are still valid on Standard — see [Extruding your own data](#extruding-your-own-data) below. Place them in the `middle` slot.

## Basemap buildings on a Classic style

> **Classic styles only** (`streets-v12`, `dark-v11`, `light-v11`, …). This is the pattern for when you have a reason to be on a Classic style — a server-rendered raster from the Static Images API, or per-layer paint control that Standard config can't express. On Standard, use the config toggles above instead.

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

## Extruding your own data

Works on Standard and Classic alike. 3D layers are lit by the scene, so they do **not** need an emissive-strength override — that rule applies to non-3D custom layers.

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
    slot: 'middle',
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
