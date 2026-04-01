# Common Modifications

## Add 3D Buildings

```json
{
  "id": "3d-buildings",
  "type": "fill-extrusion",
  "source": "composite",
  "source-layer": "building",
  "minzoom": 15,
  "paint": {
    "fill-extrusion-color": "#aaa",
    "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
    "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"]],
    "fill-extrusion-opacity": 0.6
  }
}
```

## Add Terrain/Hillshade

```json
{
  "sources": {
    "mapbox-dem": {
      "type": "raster-dem",
      "url": "mapbox://mapbox.mapbox-terrain-dem-v1"
    }
  },
  "layers": [
    {
      "id": "hillshade",
      "type": "hillshade",
      "source": "mapbox-dem",
      "paint": {
        "hillshade-exaggeration": 0.5,
        "hillshade-shadow-color": "#000000"
      }
    }
  ],
  "terrain": {
    "source": "mapbox-dem",
    "exaggeration": 1.5
  }
}
```

## Add Custom Markers

```json
{
  "id": "custom-markers",
  "type": "symbol",
  "source": "markers",
  "layout": {
    "icon-image": "custom-marker",
    "icon-size": 0.8,
    "icon-anchor": "bottom",
    "icon-allow-overlap": true,
    "text-field": ["get", "name"],
    "text-offset": [0, -2],
    "text-anchor": "top",
    "text-size": 12
  },
  "paint": {
    "text-color": "#ffffff",
    "text-halo-color": "#000000",
    "text-halo-width": 2
  }
}
```
