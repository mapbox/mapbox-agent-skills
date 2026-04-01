# Data Loading Optimization

## GeoJSON vs Vector Tiles Decision Matrix

| Scenario                  | Use GeoJSON | Use Vector Tiles |
| ------------------------- | ----------- | ---------------- |
| < 5 MB data               | Yes         | No               |
| 5-20 MB data              | Consider    | Yes              |
| > 20 MB data              | No          | Yes              |
| Data changes frequently   | Yes         | No               |
| Static data, global scale | No          | Yes              |
| Need server-side updates  | No          | Yes              |

## Viewport-Based Loading (GeoJSON)

**Note:** This pattern is applicable when hosting GeoJSON data locally or on external servers. Mapbox-hosted data sources are already optimized for viewport-based loading.

```javascript
// ✅ Only load data in current viewport
async function loadVisibleData(map) {
  const bounds = map.getBounds();
  const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(',');

  const data = await fetch(`/api/data?bbox=${bbox}&zoom=${map.getZoom()}`);

  map.getSource('data').setData(await data.json());
}

// Update on viewport change (with debounce)
let timeout;
map.on('moveend', () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => loadVisibleData(map), 300);
});
```

**Important:** `setData()` triggers a full re-parse of the GeoJSON in a web worker. For small datasets updated frequently, consider using `source.updateData()` (requires `dynamic: true` on the source) for partial updates. For large datasets, switch to vector tiles.

## Progressive Data Loading

**Note:** This pattern is applicable when hosting GeoJSON data locally or on external servers.

```javascript
// ✅ Load basic data first, add details progressively
async function loadDataProgressive(map) {
  // 1. Load simplified data first (low-res)
  const simplified = await fetch('/api/data?detail=low');
  map.addSource('data', {
    type: 'geojson',
    data: await simplified.json()
  });
  addLayers(map);

  // 2. Load full detail in background
  const detailed = await fetch('/api/data?detail=high');
  map.getSource('data').setData(await detailed.json());
}
```

## Vector Tiles for Large Datasets

**Note:** The `minzoom`/`maxzoom` optimization shown below is primarily for self-hosted vector tilesets. Mapbox-hosted tilesets have built-in optimization via [Mapbox Tiling Service (MTS)](https://docs.mapbox.com/mapbox-tiling-service/guides/) recipes that handle zoom-level optimizations automatically.

```javascript
// ✅ Server generates tiles, client loads only visible area (self-hosted tilesets)
map.addSource('large-dataset', {
  type: 'vector',
  tiles: ['https://api.example.com/tiles/{z}/{x}/{y}.pbf'],
  minzoom: 0,
  maxzoom: 14
});

map.addLayer({
  id: 'large-dataset-layer',
  type: 'fill',
  source: 'large-dataset',
  'source-layer': 'data', // Layer name in .pbf
  paint: {
    'fill-color': '#088',
    'fill-opacity': 0.6
  }
});
```

**Impact:** 10 MB dataset reduced to ~500 KB per viewport load
