# Expression Patterns and Clustering

Expressions are pure style spec — identical on GL JS, Android, iOS, and Flutter, and identical on Standard and Classic styles.

## Expression Pattern: Data-Driven Styling

```json
{
  "paint": {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "population"],
      0,
      3,
      1000,
      5,
      10000,
      8,
      100000,
      12,
      1000000,
      20
    ],
    "circle-color": [
      "case",
      ["<", ["get", "temperature"], 0],
      "#2166ac",
      ["<", ["get", "temperature"], 20],
      "#67a9cf",
      ["<", ["get", "temperature"], 30],
      "#ef8a62",
      "#b2182b"
    ],
    "circle-emissive-strength": 1
  }
}
```

Temperature is diverging data around a midpoint, so this uses an **RdBu** ramp. A blue→green→yellow→red ramp would be a rainbow — no perceptual ordering — and its green/red ends are indistinguishable with deuteranopia.

## Clustering Pattern: Handle Dense POIs

Cluster circles go in `middle`, the count labels in `top`. Both need emissive strength, or they disappear at the `dusk` / `night` presets.

```json
{
  "id": "clusters",
  "type": "circle",
  "slot": "middle",
  "source": "pois",
  "filter": ["has", "point_count"],
  "paint": {
    "circle-color": ["step", ["get", "point_count"], "#51bbd6", 10, "#f1f075", 30, "#f28cb1"],
    "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 30, 25],
    "circle-emissive-strength": 1
  }
}

{
  "id": "cluster-count",
  "type": "symbol",
  "slot": "top",
  "source": "pois",
  "filter": ["has", "point_count"],
  "layout": {
    "text-field": ["get", "point_count_abbreviated"],
    "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
    "text-size": 12
  },
  "paint": {
    "text-color": "#ffffff"
  }
}
```

Enable clustering on the **source**, not the layer:

```javascript
map.addSource('pois', {
  type: 'geojson',
  data: pois,
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50
});
```

**When to cluster:** when points **visibly overlap at the zooms your users actually use** — a legibility judgement, not a row count. 300 POIs packed into one neighborhood need clustering at z13; thousands spread thinly across a country may not. Clustering is independent of how you render: if the dataset is large enough to be slow or heavy to load, the fix is a vector tileset, and you can cluster server-side with [Mapbox Tiling Service](https://docs.mapbox.com/help/tutorials/cluster-point-data-with-mts/).

## Zoom expressions and continuity

```json
"fill-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0, 12, 1]      // fade in
"line-opacity": ["interpolate", ["linear"], ["zoom"], 15, 1, 16, 0]      // fade out
"line-width":   ["interpolate", ["linear"], ["zoom"], 10, 1, 16, 4]      // scale with zoom
```

Never pop a layer on at a hard `minzoom`/`maxzoom` boundary. Keep `minzoom` for the GPU saving, but set it 1–2 levels below where the layer should appear and fade opacity in across that band.

> `visibility` is a plain enum (`"visible"` / `"none"`) — it does **not** accept expressions. To vary a layer by zoom, use an `interpolate`/`step` expression on an opacity property (which also gives you a fade), or set `minzoom`/`maxzoom` on the layer.
