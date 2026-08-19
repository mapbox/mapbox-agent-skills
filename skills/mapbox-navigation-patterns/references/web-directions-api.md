# Web: Directions API Patterns

Coordinates are always `longitude,latitude` order. Default to the `driving-traffic` profile — it factors in live traffic, congestion, and incidents. Use `driving` only when you need `arrive_by` (not supported by `driving-traffic`); both profiles support `depart_at`.

## Basic Route Display

**Use when:** Show driving directions on a web map

```javascript
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard',
  center: [-122.4194, 37.7749],
  zoom: 12
});

async function getRoute(start, end) {
  // start/end are [lon, lat]
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${start[0]},${start[1]};${end[0]},${end[1]}?` +
      `steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
    { method: 'GET' }
  );

  const json = await query.json();
  const route = json.routes[0];

  // Display route on map
  if (map.getSource('route')) {
    map.getSource('route').setData(route.geometry);
  } else {
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: route.geometry
      }
    });

    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b9ddd',
        'line-width': 8,
        'line-opacity': 0.8
      }
    });
  }

  // Add start and end markers
  new mapboxgl.Marker({ color: '#3FB1CE' }).setLngLat(start).addTo(map);

  new mapboxgl.Marker({ color: '#FF0000' }).setLngLat(end).addTo(map);

  // Fit map to route
  const bounds = new mapboxgl.LngLatBounds();
  route.geometry.coordinates.forEach((coord) => bounds.extend(coord));
  map.fitBounds(bounds, { padding: 50 });

  return route;
}

// Example usage
const start = [-122.4194, 37.7749]; // San Francisco
const end = [-122.2711, 37.8044]; // Oakland

getRoute(start, end);
```

> **Geometry format:** `geometries=geojson` is used here because the response is fed straight into a GL JS source. It's the largest of the three geometry formats over the wire — when you don't need to render immediately (backend processing, caching, mobile clients), request `geometries=polyline6` instead and decode client-side. See [Performance Optimization](best-practices.md#performance-optimization).

## Turn-by-Turn Instructions Display

```javascript
function displayInstructions(route) {
  const steps = route.legs[0].steps;

  const instructionsHTML = steps
    .map((step, index) => {
      const instruction = step.maneuver.instruction;
      const distance = (step.distance * 0.000621371).toFixed(1); // Convert to miles
      const duration = Math.round(step.duration / 60); // Convert to minutes

      return `
      <div class="instruction-step">
        <div class="step-number">${index + 1}</div>
        <div class="step-details">
          <div class="step-instruction">${instruction}</div>
          <div class="step-meta">${distance} mi · ${duration} min</div>
        </div>
      </div>
    `;
    })
    .join('');

  document.getElementById('instructions').innerHTML = `
    <div class="instructions-container">
      <h3>Directions</h3>
      <div class="route-summary">
        <strong>Distance:</strong> ${(route.distance * 0.000621371).toFixed(1)} miles<br>
        <strong>Duration:</strong> ${Math.round(route.duration / 60)} minutes
      </div>
      <div class="instructions-list">
        ${instructionsHTML}
      </div>
    </div>
  `;
}
```

## Alternative Routes

```javascript
async function getRouteWithAlternatives(start, end) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${start[0]},${start[1]};${end[0]},${end[1]}?` +
      `alternatives=true&` +
      `geometries=geojson&` +
      `steps=true&` +
      `access_token=${mapboxgl.accessToken}`
  );

  const json = await query.json();
  const routes = json.routes;

  // Display all alternative routes
  routes.forEach((route, index) => {
    const routeId = `route-${index}`;
    const isMainRoute = index === 0;

    map.addSource(routeId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: route.geometry
      }
    });

    map.addLayer({
      id: routeId,
      type: 'line',
      source: routeId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': isMainRoute ? '#3b9ddd' : '#cccccc',
        'line-width': isMainRoute ? 8 : 6,
        'line-opacity': isMainRoute ? 0.8 : 0.5
      }
    });

    // Make routes clickable to select alternative
    map.on('click', routeId, () => {
      selectRoute(index);
    });

    map.on('mouseenter', routeId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', routeId, () => {
      map.getCanvas().style.cursor = '';
    });
  });

  return routes;
}

function selectRoute(routeIndex) {
  // Update styling to highlight selected route
  routes.forEach((route, index) => {
    map.setPaintProperty(`route-${index}`, 'line-color', index === routeIndex ? '#3b9ddd' : '#cccccc');
    map.setPaintProperty(`route-${index}`, 'line-width', index === routeIndex ? 8 : 6);
    map.setPaintProperty(`route-${index}`, 'line-opacity', index === routeIndex ? 0.8 : 0.5);
  });

  // Update instructions for selected route
  displayInstructions(routes[routeIndex]);
}
```

## Multi-Stop Routing

```javascript
async function getMultiStopRoute(waypoints) {
  // waypoints: array of [lng, lat] coordinates
  // Maximum 25 waypoints including start and end

  const coordinates = waypoints.map((wp) => `${wp[0]},${wp[1]}`).join(';');

  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordinates}?` +
      `steps=true&` +
      `geometries=geojson&` +
      `access_token=${mapboxgl.accessToken}`
  );

  const json = await query.json();
  const route = json.routes[0];

  // Display route
  displayRoute(route);

  // Add numbered markers for each waypoint
  waypoints.forEach((waypoint, index) => {
    const el = document.createElement('div');
    el.className = 'waypoint-marker';
    el.textContent = index + 1;

    new mapboxgl.Marker(el).setLngLat(waypoint).addTo(map);
  });

  // Display total distance and duration
  console.log(`Total distance: ${(route.distance * 0.000621371).toFixed(1)} miles`);
  console.log(`Total duration: ${Math.round(route.duration / 60)} minutes`);

  return route;
}

// Example: Delivery route with 5 stops
const deliveryStops = [
  [-122.4194, 37.7749], // Start: San Francisco
  [-122.4089, 37.7849], // Stop 1
  [-122.3922, 37.7911], // Stop 2
  [-122.3844, 37.8044], // Stop 3
  [-122.2711, 37.8044] // End: Oakland
];

getMultiStopRoute(deliveryStops);
```

## Route Optimization

**Use when:** Need to optimize the order of waypoints (traveling salesman problem)

**Hard limit: 12 coordinates per request** (Optimization v1 API). `source` and `destination` only
accept the string values `first`/`any` and `last`/`any` respectively — not numeric indices. If you
need more than 12 stops, or time windows/vehicle capacities/driver shifts, see the **Optimization
API v2** note below instead of trying to work around the v1 limit.

```javascript
async function getOptimizedRoute(waypoints, { startAtFirst = true, endAtLast = false } = {}) {
  // Hard limit: 12 coordinates max for the v1 endpoint.
  if (waypoints.length > 12) {
    throw new Error('Optimization v1 API supports a maximum of 12 coordinates per request');
  }

  const coordinates = waypoints.map((wp) => `${wp[0]},${wp[1]}`).join(';');

  // source/destination only accept 'first'/'any' and 'last'/'any' — no numeric indices
  const source = startAtFirst ? 'first' : 'any';
  const destination = endAtLast ? 'last' : 'any';

  const query = await fetch(
    `https://api.mapbox.com/optimized-trips/v1/mapbox/driving-traffic/${coordinates}?` +
      `source=${source}&` +
      `destination=${destination}&` +
      `roundtrip=true&` +
      `steps=true&` +
      `geometries=geojson&` +
      `access_token=${mapboxgl.accessToken}`
  );

  const json = await query.json();
  const optimizedRoute = json.trips[0];

  // Get the optimized order of waypoints
  const waypointOrder = json.waypoints.map((wp) => wp.waypoint_index);

  console.log('Optimized waypoint order:', waypointOrder);
  console.log(`Optimized distance: ${(optimizedRoute.distance * 0.000621371).toFixed(1)} miles`);
  console.log(`Optimized duration: ${Math.round(optimizedRoute.duration / 60)} minutes`);

  return {
    route: optimizedRoute,
    order: waypointOrder
  };
}
```

**Note:** For more than 12 locations, or time windows, vehicle capacities, and driver shifts, see
the [Optimization API v2](https://docs.mapbox.com/api/navigation/optimization/) — a separate,
async, job-submission API (`POST` a routing problem, then poll for the solution) currently in
**Public Beta** (requires signing up for early access), supporting up to 1,000 locations per
routing problem. It is not a drop-in replacement for the v1 endpoint above; it uses a different
request/response shape entirely.

## Congestion-Based Route Coloring

**Use when:** Visualize traffic severity along a route (the `driving-traffic` profile above already includes live traffic in ETAs — this adds a `congestion` annotation for per-segment styling)

`annotations` must always be paired with `overview=full` — without it, the API returns a
simplified geometry that doesn't line up point-for-point with the per-segment annotation array.

```javascript
async function getTrafficRoute(start, end) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${start[0]},${start[1]};${end[0]},${end[1]}?` +
      `steps=true&` +
      `geometries=geojson&` +
      `overview=full&` +
      `annotations=duration,distance,speed,congestion&` +
      `access_token=${mapboxgl.accessToken}`
  );

  const json = await query.json();
  const route = json.routes[0];

  // Color code route by congestion
  const congestion = route.legs[0].annotation.congestion;
  const coordinates = route.geometry.coordinates;

  // Create segments with congestion-based colors
  const segments = [];
  for (let i = 0; i < congestion.length; i++) {
    segments.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [coordinates[i], coordinates[i + 1]]
      },
      properties: {
        congestion: congestion[i]
      }
    });
  }

  map.addSource('route-traffic', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: segments
    }
  });

  map.addLayer({
    id: 'route-traffic',
    type: 'line',
    source: 'route-traffic',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': [
        'match',
        ['get', 'congestion'],
        'low',
        '#4CAF50', // Green - free flow
        'moderate',
        '#FFC107', // Yellow - moderate traffic
        'heavy',
        '#FF5722', // Orange - heavy traffic
        'severe',
        '#F44336', // Red - severe congestion
        'unknown',
        '#3b9ddd', // Blue - unknown congestion
        '#3b9ddd' // Default blue
      ],
      'line-width': 8
    }
  });

  return route;
}
```
