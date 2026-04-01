# Circle/Bubble Maps and Line Data Visualization

## Circle/Bubble Maps

**Best for:** Point data with magnitude, proportional symbols

**Pattern:** Size circles based on data values

```javascript
map.on('load', () => {
  map.addSource('earthquakes', {
    type: 'geojson',
    data: 'https://example.com/earthquakes.geojson'
  });

  // Size by magnitude, color by depth
  map.addLayer({
    id: 'earthquakes',
    type: 'circle',
    source: 'earthquakes',
    paint: {
      // Size circles by magnitude
      'circle-radius': ['interpolate', ['exponential', 2], ['get', 'mag'], 0, 2, 5, 20, 8, 100],
      // Color by depth
      'circle-color': [
        'interpolate',
        ['linear'],
        ['get', 'depth'],
        0,
        '#ffffcc',
        50,
        '#a1dab4',
        100,
        '#41b6c4',
        200,
        '#2c7fb8',
        300,
        '#253494'
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
      'circle-opacity': 0.75
    }
  });

  // Add popup on click
  map.on('click', 'earthquakes', (e) => {
    const props = e.features[0].properties;
    new mapboxgl.Popup()
      .setLngLat(e.features[0].geometry.coordinates)
      .setHTML(
        `
        <h3>Magnitude ${props.mag}</h3>
        <p>Depth: ${props.depth} km</p>
        <p>Time: ${new Date(props.time).toLocaleString()}</p>
      `
      )
      .addTo(map);
  });
});
```

## Line Data Visualization

**Best for:** Routes, flows, connections, networks

**Pattern:** Style lines based on data

```javascript
map.on('load', () => {
  map.addSource('traffic', {
    type: 'geojson',
    data: 'https://example.com/traffic.geojson'
  });

  // Traffic flow with data-driven styling
  map.addLayer({
    id: 'traffic-lines',
    type: 'line',
    source: 'traffic',
    paint: {
      // Width by traffic volume
      'line-width': ['interpolate', ['exponential', 2], ['get', 'volume'], 0, 1, 1000, 5, 10000, 15],
      // Color by speed (congestion)
      'line-color': [
        'interpolate',
        ['linear'],
        ['get', 'speed'],
        0,
        '#d73027', // Red: stopped
        15,
        '#fc8d59', // Orange: slow
        30,
        '#fee08b', // Yellow: moderate
        45,
        '#d9ef8b', // Light green: good
        60,
        '#91cf60', // Green: free flow
        75,
        '#1a9850'
      ],
      'line-opacity': 0.8
    }
  });
});
```
