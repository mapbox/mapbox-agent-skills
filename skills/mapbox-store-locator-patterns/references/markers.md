# Markers: HTML Markers, Symbol Layers & Clustering

## Choosing the Right Marker Strategy

| Location Count  | Strategy                               | Why                                                                                                                  |
| --------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Fewer than 100  | HTML Markers                           | Full DOM/CSS control; manageable DOM node count                                                                      |
| 100–1,000       | **Symbol Layer** (recommended default) | Renders on the **GPU via WebGL** — no DOM elements created, so performance stays smooth even with hundreds of points |
| More than 1,000 | Clustering + Symbol Layer              | Reduces visual clutter and keeps interaction snappy at large scale                                                   |

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

**Option 3: Clustering (more than 1,000 locations)**

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
    source: 'stores',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 30, '#f28cb1'],
      'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40]
    }
  });

  // Cluster count labels
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'stores',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    }
  });

  // Unclustered points
  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'stores',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#11b4da',
      'circle-radius': 8,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
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
