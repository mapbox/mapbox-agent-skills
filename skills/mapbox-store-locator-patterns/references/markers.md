# Markers: HTML Markers, Symbol Layers & Clustering

## Choosing the Right Marker Strategy

Two independent decisions. Location count settles the rendering approach; it does **not** settle whether to cluster.

**1. How to render (cost):**

| Location Count                        | Strategy                               | Why                                                                                                                              |
| ------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Fewer than ~100                       | HTML Markers                           | Full DOM/CSS control; manageable DOM node count                                                                                  |
| ~100 and up                           | **Symbol Layer** (recommended default) | Renders on the **GPU via WebGL** — no DOM elements created, so performance stays smooth from hundreds into the tens of thousands |
| Thousands, or a payload past a few MB | Vector tileset                         | Only the viewport's data loads instead of the whole file up front. Markers are no longer an option once you're on tiles          |

**2. Whether to cluster (legibility):** cluster when pins **visibly overlap at the zooms customers actually browse**. This is a map-reading judgement, not a row count — a 300-location chain packed into one metro needs clustering at z12, while 5,000 nationwide locations may read fine unclustered at z4. Clustering does cut per-frame work as a side effect, but if rendering _cost_ is the problem, the fix is a tileset.

> **Key insight:** Each HTML Marker creates a real DOM element. At 150+ markers that means 150+ nodes the browser must lay out, paint, and composite every frame. A symbol layer, by contrast, is drawn entirely on the GPU through WebGL — the browser sees only the single `<canvas>` element regardless of point count.

**Option 1: HTML Markers (fewer than 100 locations)**

```javascript
const markers = {};

stores.features.forEach((store) => {
  // Create marker element
  const el = document.createElement('div');
  el.className = 'marker';
  el.style.backgroundImage = 'url(/marker-icon.png)';
  el.style.width = '30px';
  el.style.height = '40px';
  el.style.backgroundSize = 'cover';
  el.style.cursor = 'pointer';

  // Create marker
  const marker = new mapboxgl.Marker(el)
    .setLngLat(store.geometry.coordinates)
    .setPopup(
      new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<h3>${store.properties.name}</h3>
         <p>${store.properties.address}</p>
         <p>${store.properties.phone}</p>`
      )
    )
    .addTo(map);

  // Store reference for later access
  markers[store.properties.id] = marker;

  // Handle marker click
  el.addEventListener('click', () => {
    flyToStore(store);
    createPopup(store);
    highlightListing(store.properties.id);
  });
});
```

**Option 2: Symbol Layer (100–1,000 locations)** — see SKILL.md Step 2 for full implementation.

**Option 3: Clustering (when pins overlap at browsing zooms)**

Clustering is a legibility choice, so it composes with either of the rendering approaches above — cluster a GeoJSON source with `cluster: true`, or use [Mapbox Tiling Service](https://docs.mapbox.com/help/tutorials/cluster-point-data-with-mts/) to cluster server-side in a tileset.

```javascript
map.on('load', () => {
  map.addSource('stores', {
    type: 'geojson',
    data: stores,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50
  });

  // Cluster circles
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    slot: 'middle', // above roads, behind basemap labels and 3D buildings
    source: 'stores',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 30, '#f28cb1'],
      'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40],
      'circle-emissive-strength': 1 // or the clusters vanish at dusk/night
    }
  });

  // Cluster count labels
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    slot: 'top', // symbol layers go in `top`
    source: 'stores',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      // DIN Pro is Standard's font — don't mix in a second family
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
    source: 'stores',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#11b4da',
      'circle-radius': 8,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff',
      'circle-emissive-strength': 1
    }
  });

  // Zoom on cluster click
  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['clusters']
    });
    const clusterId = features[0].properties.cluster_id;
    map.getSource('stores').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;

      map.easeTo({
        center: features[0].geometry.coordinates,
        zoom: zoom
      });
    });
  });

  // Show popup on unclustered point click
  map.on('click', 'unclustered-point', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const props = e.features[0].properties;

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(
        `<h3>${props.name}</h3>
         <p>${props.address}</p>`
      )
      .addTo(map);
  });
});
```
