# Clustering (Point Density)

**Best for:** Grouping nearby points, aggregated counts, large point datasets

**Pattern:** Client-side clustering for visualization

Clustering is a valuable point density visualization technique alongside heat maps. Use clustering when you want **discrete grouping with exact counts** rather than a continuous density visualization.

```javascript
map.on('load', () => {
  // Add data source with clustering enabled
  map.addSource('locations', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        // Your point features
      ]
    },
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points
    clusterRadius: 50 // Radius of each cluster (default 50)
  });

  // Clustered circles - styled by point count
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'locations',
    filter: ['has', 'point_count'],
    paint: {
      // Color clusters by count (step expression)
      'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 30, '#f28cb1'],
      // Size clusters by count
      'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40]
    }
  });

  // Cluster count labels
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'locations',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    }
  });

  // Individual unclustered points
  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'locations',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#11b4da',
      'circle-radius': 6,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  });

  // Click handler to expand clusters
  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['clusters']
    });
    const clusterId = features[0].properties.cluster_id;

    // Get cluster expansion zoom
    map.getSource('locations').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;

      map.easeTo({
        center: features[0].geometry.coordinates,
        zoom: zoom
      });
    });
  });

  // Change cursor on hover
  map.on('mouseenter', 'clusters', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'clusters', () => {
    map.getCanvas().style.cursor = '';
  });
});
```

**Advanced: Custom Cluster Properties**

```javascript
map.addSource('locations', {
  type: 'geojson',
  data: data,
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50,
  // Calculate custom cluster properties
  clusterProperties: {
    // Sum total values
    sum: ['+', ['get', 'value']],
    // Calculate max value
    max: ['max', ['get', 'value']]
  }
});

// Use custom properties in styling
'circle-color': [
  'interpolate',
  ['linear'],
  ['get', 'sum'],
  0,
  '#51bbd6',
  100,
  '#f1f075',
  1000,
  '#f28cb1'
];
```

**When to use clustering vs heatmaps:**

| Use Case                         | Clustering                       | Heatmap                    |
| -------------------------------- | -------------------------------- | -------------------------- |
| **Visual style**                 | Discrete circles with counts     | Continuous gradient        |
| **Interaction**                  | Click to expand/zoom             | Visual density only        |
| **Data granularity**             | Exact counts visible             | Approximate density        |
| **Best for**                     | Store locators, event listings   | Crime maps, incident areas |
| **Performance with many points** | Excellent (groups automatically) | Good                       |
| **User understanding**           | Clear (numbered clusters)        | Intuitive (heat analogy)   |
