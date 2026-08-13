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
    slot: 'middle',
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
      'circle-opacity': 0.75,
      'circle-emissive-strength': 1
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
    slot: 'middle',
    source: 'traffic',
    paint: {
      // Width by traffic volume
      'line-width': ['interpolate', ['exponential', 2], ['get', 'volume'], 0, 1, 1000, 5, 10000, 15],
      // Color by speed (congestion) — RdBu, NOT red-to-green.
      // A red/yellow/green congestion ramp is unreadable with deuteranopia;
      // the dark-red-to-dark-blue ramp keeps both endpoints distinguishable.
      'line-color': [
        'interpolate',
        ['linear'],
        ['get', 'speed'],
        0,
        '#b2182b', // Dark red: stopped
        15,
        '#ef8a62', // Salmon: slow
        30,
        '#f7f7f7', // Neutral: moderate
        45,
        '#67a9cf', // Light blue: good
        60,
        '#2166ac' // Dark blue: free flow
      ],
      'line-opacity': 0.8,
      'line-emissive-strength': 1
    }
  });
});
```

> If the product requires the conventional traffic-light colors, keep them **and** add a
> non-color cue — line width, a dash pattern for the slowest class, or a text label — so
> the encoding does not rest on hue alone.
