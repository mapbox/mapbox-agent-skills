# Animated Data Visualizations

## Time-Series Animation

**Pattern:** Animate data over time

```javascript
let currentTime = 0;
const times = [0, 6, 12, 18, 24]; // Hours of day
let animationId;

map.on('load', () => {
  map.addSource('hourly-data', {
    type: 'geojson',
    data: getDataForTime(currentTime)
  });

  map.addLayer({
    id: 'data-layer',
    type: 'circle',
    source: 'hourly-data',
    paint: {
      'circle-radius': 8,
      'circle-color': ['get', 'color']
    }
  });

  // Animation loop
  function animate() {
    currentTime = (currentTime + 1) % times.length;

    // Update data
    map.getSource('hourly-data').setData(getDataForTime(times[currentTime]));

    // Update UI
    document.getElementById('time-display').textContent = `${times[currentTime]}:00`;

    animationId = setTimeout(animate, 1000); // Update every second
  }

  // Start animation
  document.getElementById('play-button').addEventListener('click', () => {
    if (animationId) {
      clearTimeout(animationId);
      animationId = null;
    } else {
      animate();
    }
  });
});

function getDataForTime(hour) {
  // Fetch or generate data for specific time
  return {
    type: 'FeatureCollection',
    features: data.filter((d) => d.properties.hour === hour)
  };
}
```

## Real-Time Data Updates

**Pattern:** Update data from live sources

```javascript
map.on('load', () => {
  map.addSource('live-data', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });

  map.addLayer({
    id: 'live-points',
    type: 'circle',
    source: 'live-data',
    paint: {
      'circle-radius': 6,
      'circle-color': '#ff4444'
    }
  });

  // Poll for updates every 5 seconds
  setInterval(async () => {
    const response = await fetch('https://api.example.com/live-data');
    const data = await response.json();

    // Update source
    map.getSource('live-data').setData(data);
  }, 5000);

  // Or use WebSocket for real-time updates
  const ws = new WebSocket('wss://api.example.com/live');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    map.getSource('live-data').setData(data);
  };
});
```

## Smooth Transitions

**Pattern:** Animate property changes

```javascript
// Smoothly transition circle sizes
function updateVisualization(newData) {
  map.getSource('data-source').setData(newData);

  // Animate circle radius
  const currentRadius = map.getPaintProperty('data-layer', 'circle-radius');
  const targetRadius = ['get', 'newSize'];

  // Use setPaintProperty with transition
  map.setPaintProperty('data-layer', 'circle-radius', targetRadius);

  // Or use expressions for smooth interpolation
  map.setPaintProperty('data-layer', 'circle-radius', ['interpolate', ['linear'], ['get', 'value'], 0, 2, 100, 20]);
}
```
