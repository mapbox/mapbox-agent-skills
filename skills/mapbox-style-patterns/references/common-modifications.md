# Common Modifications

## 3D buildings and landmarks

**On Standard, this is config — not a layer.** Standard ships high-detail 3D buildings and landmark models. Adding your own `fill-extrusion` of the basemap buildings on top of it double-draws the city.

```javascript
map.setConfigProperty('basemap', 'show3dObjects', true); // all 3D
map.setConfigProperty('basemap', 'show3dBuildings', true); // buildings only
map.setConfigProperty('basemap', 'show3dLandmarks', true); // landmark models
```

Extruding **your own** polygon data is still a layer, and works on any style. Put it in `middle`. 3D layers are lit by the scene, so they don't need an emissive-strength override:

```json
{
  "id": "my-buildings",
  "type": "fill-extrusion",
  "slot": "middle",
  "source": "my-buildings",
  "paint": {
    "fill-extrusion-color": "#aaa",
    "fill-extrusion-height": ["get", "height"],
    "fill-extrusion-base": ["get", "min_height"],
    "fill-extrusion-opacity": 0.9
  }
}
```

**Classic styles only** — extruding the basemap's own building layer, hand-ordered with a `beforeId` because Classic has no slots. Fade 3D in starting at z13, never below:

```json
{
  "id": "3d-buildings",
  "type": "fill-extrusion",
  "source": "composite",
  "source-layer": "building",
  "filter": ["==", ["get", "extrude"], "true"],
  "minzoom": 13,
  "paint": {
    "fill-extrusion-color": "#aaa",
    "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 13, 0, 15, ["get", "height"]],
    "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 13, 0, 15, ["get", "min_height"]],
    "fill-extrusion-opacity": 0.6
  }
}
```

## Terrain / hillshade

Terrain works the same on Standard and Classic — it's a root-level `terrain` property, not a layer. Hillshade _is_ a layer, and belongs in `bottom` so roads and labels stay on top:

```json
{
  "sources": {
    "mapbox-dem": {
      "type": "raster-dem",
      "url": "mapbox://mapbox.mapbox-terrain-dem-v1",
      "tileSize": 512,
      "maxzoom": 14
    }
  },
  "layers": [
    {
      "id": "hillshade",
      "type": "hillshade",
      "slot": "bottom",
      "source": "mapbox-dem",
      "paint": {
        "hillshade-exaggeration": 0.5,
        "hillshade-shadow-color": "hsl(220, 20%, 25%)"
      }
    }
  ],
  "terrain": {
    "source": "mapbox-dem",
    "exaggeration": 1.5
  }
}
```

Keep `hillshade-shadow-color` off pure black — a tinted dark (cool for rock, warmer for arid terrain) reads as shading; `#000000` reads as a hole and crushes everything drawn over it.

For trails, contours, and tuned terrain shading, prefer the ready-made **`outdoors`** / **`outdoors-winter`** styles from the [Mapbox gallery](https://www.mapbox.com/gallery) — that detail isn't reachable through Standard config, so it's a style choice rather than a config one.

## Custom markers

Symbol layer in the `top` slot:

```json
{
  "id": "custom-markers",
  "type": "symbol",
  "slot": "top",
  "source": "markers",
  "layout": {
    "icon-image": "custom-marker",
    "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 16, 1],
    "icon-anchor": "bottom",
    "icon-allow-overlap": true,
    "text-field": ["get", "name"],
    "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
    "text-offset": [0, -2],
    "text-anchor": "top",
    "text-size": 12,
    "text-optional": true
  },
  "paint": {
    "text-color": "#ffffff",
    "text-halo-color": "#000000",
    "text-halo-width": 2
  }
}
```

- `icon-allow-overlap: true` when every marker must be visible — the default hides colliding icons, and that is the #1 cause of "my icons disappeared."
- `text-optional: true` so labels drop before icons when space runs out.
- Use **SDF** images for single-color tintable icons (color them via `icon-color`); don't bake gradient fills into icon images — they turn muddy after rasterization.
- Go heavier on **weight**, lighter on **halo**. A thin font with a thick bright outline is a noise trap.

**Marker count decides how to render:** under ~100 → an HTML marker / platform annotation; ~100 and up → a symbol layer like the above, which stays smooth into the tens of thousands; thousands of points or a payload past a few MB → a vector tileset. **Whether to cluster is a separate question**, driven by whether pins visibly overlap at the zooms users actually browse — not by the row count.
