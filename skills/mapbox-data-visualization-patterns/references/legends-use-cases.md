# Legends, UI Controls, and Common Use Cases

## Color Scale Legend

```html
<div class="legend">
  <h4>Population Density</h4>
  <div class="legend-scale">
    <div class="legend-item">
      <span class="legend-color" style="background: #f0f9ff;"></span>
      <span>0-500</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background: #7fcdff;"></span>
      <span>500-1000</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background: #0080ff;"></span>
      <span>1000-5000</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background: #001f5c;"></span>
      <span>5000+</span>
    </div>
  </div>
</div>

<style>
  .legend {
    position: absolute;
    bottom: 30px;
    right: 10px;
    background: white;
    padding: 10px;
    border-radius: 3px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    font-family: Arial, sans-serif;
    font-size: 12px;
  }

  .legend h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
  }

  .legend-color {
    width: 20px;
    height: 20px;
    margin-right: 10px;
    border: 1px solid #ccc;
  }
</style>
```

## Interactive Data Inspector

```javascript
map.on('click', 'data-layer', (e) => {
  const feature = e.features[0];
  const properties = feature.properties;

  // Build properties table
  const propsTable = Object.entries(properties)
    .map(([key, value]) => `<tr><td><strong>${key}:</strong></td><td>${value}</td></tr>`)
    .join('');

  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(
      `
      <div style="max-width: 300px;">
        <h3>Feature Details</h3>
        <table style="width: 100%; font-size: 12px;">
          ${propsTable}
        </table>
      </div>
    `
    )
    .addTo(map);
});
```

## Data Preprocessing

```javascript
// Calculate statistical breaks for choropleth
// Using classybrew library (npm install classybrew)
import classybrew from 'classybrew';

function calculateJenksBreaks(values, numClasses) {
  const brew = new classybrew();
  brew.setSeries(values);
  brew.setNumClasses(numClasses);
  brew.classify('jenks');
  return brew.getBreaks();
}

// Normalize data for better visualization
function normalizeData(features, property) {
  const values = features.map((f) => f.properties[property]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  // Handle case where all values are the same
  if (range === 0) {
    return features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        normalized: 0.5
      }
    }));
  }

  return features.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      normalized: (feature.properties[property] - min) / range
    }
  }));
}
```

## Common Use Cases

### Election Results Map

```javascript
map.addLayer({
  id: 'election-results',
  type: 'fill',
  source: 'districts',
  paint: {
    'fill-color': [
      'match',
      ['get', 'winner'],
      'democrat',
      '#3b82f6',
      'republican',
      '#ef4444',
      'independent',
      '#a855f7',
      '#94a3b8' // No data
    ],
    'fill-opacity': [
      'interpolate',
      ['linear'],
      ['get', 'margin'],
      0,
      0.3, // Close race: light
      20,
      0.9 // Landslide: dark
    ]
  }
});
```

### COVID-19 Case Map

```javascript
map.addLayer({
  id: 'covid-cases',
  type: 'fill',
  source: 'counties',
  paint: {
    'fill-color': [
      'step',
      ['/', ['get', 'cases'], ['get', 'population']], // Cases per capita
      '#ffffb2',
      0.001,
      '#fed976',
      0.005,
      '#feb24c',
      0.01,
      '#fd8d3c',
      0.02,
      '#fc4e2a',
      0.05,
      '#e31a1c',
      0.1,
      '#b10026'
    ]
  }
});
```

### Real Estate Price Heatmap

```javascript
map.addLayer({
  id: 'real-estate',
  type: 'circle',
  source: 'properties',
  paint: {
    'circle-radius': ['interpolate', ['exponential', 2], ['get', 'price'], 100000, 5, 1000000, 20, 10000000, 50],
    'circle-color': [
      'interpolate',
      ['linear'],
      ['get', 'price_per_sqft'],
      0,
      '#ffffcc',
      200,
      '#a1dab4',
      400,
      '#41b6c4',
      600,
      '#2c7fb8',
      800,
      '#253494'
    ],
    'circle-opacity': 0.6,
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 1
  }
});
```
