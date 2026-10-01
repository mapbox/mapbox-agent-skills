# Best Practices and Common Use Cases

## Best Practices

### Reducing Directions API Calls

> **Terms of service:** Storing or caching Mapbox API responses is restricted. Check the
> [Mapbox Terms of Service](https://www.mapbox.com/legal/tos) and [Product Terms](https://www.mapbox.com/legal/product-terms) for what your
> plan permits, and talk to Mapbox Sales if your use case needs storage rights. The
> patterns below cut request volume by not asking for the same route twice, rather than
> by retaining responses, so they stay clear of the question entirely.

Deduplicate requests that are already in flight. Concurrent callers share one network
call, and nothing is retained once it settles:

```javascript
const inFlight = new Map();

function getRouteOnce(start, end) {
  const key = `${start.join(',')}-${end.join(',')}`;

  let pending = inFlight.get(key);

  if (!pending) {
    // The entry is dropped as soon as the request settles — no response is kept.
    pending = getRoute(start, end).finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }

  return pending;
}
```

Other ways to cut request volume without storing results:

- **Debounce** while the user is still dragging a waypoint — see
  [Performance Optimization](#performance-optimization).
- **Request only what you render** — `overview=simplified` and `geometries=polyline6`
  instead of full GeoJSON geometry.
- **Use the Matrix API** for many-to-many travel times instead of N Directions calls.
- **Keep the active route in memory for the current session** and re-render from it
  instead of re-requesting on every UI change. Holding a response in memory to serve the
  request it was made for, and discarding it when the session ends, is in-session use.
  Writing it to disk, `localStorage`, or a database is storage — that is the line, and
  storage is what the terms restrict.

### Error Handling

```javascript
async function getRobustRoute(start, end) {
  try {
    const response = await fetch(directionsURL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    if (json.code !== 'Ok') {
      throw new Error(`Directions error: ${json.code}`);
    }

    if (!json.routes || json.routes.length === 0) {
      throw new Error('No routes found');
    }

    return json.routes[0];
  } catch (error) {
    console.error('Route calculation failed:', error);

    // Show user-friendly error message
    if (error.message.includes('No routes found')) {
      alert('Cannot find a route between these locations');
    } else if (error.message.includes('HTTP 429')) {
      alert('Too many requests. Please try again in a moment.');
    } else {
      alert('Unable to calculate route. Please try again.');
    }

    throw error;
  }
}
```

### Performance Optimization

```javascript
// Debounce route requests when user is moving markers
let routeTimeout;

function requestRouteDebounced(start, end) {
  clearTimeout(routeTimeout);
  routeTimeout = setTimeout(() => {
    getRoute(start, end);
  }, 500);
}

// Simplify route geometry for better performance
async function getSimplifiedRoute(start, end) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/` +
      `${start.join(',')};${end.join(',')}?` +
      `geometries=polyline6&` + // More compact than geojson
      `overview=simplified&` + // Simplified geometry
      `access_token=${mapboxgl.accessToken}`
  );

  return await query.json();
}
```

### User Experience

```javascript
// Show loading state during route calculation
async function getRouteWithLoading(start, end) {
  const loadingEl = document.getElementById('loading');
  loadingEl.style.display = 'block';

  try {
    const route = await getRoute(start, end);
    displayRoute(route);
  } finally {
    loadingEl.style.display = 'none';
  }
}

// Animate camera to show full route
function showRouteWithAnimation(route) {
  const bounds = new mapboxgl.LngLatBounds();
  route.geometry.coordinates.forEach((coord) => bounds.extend(coord));

  map.fitBounds(bounds, {
    padding: { top: 100, bottom: 100, left: 50, right: 50 },
    duration: 1000, // Smooth 1-second animation
    essential: true
  });
}
```

## Common Use Cases

### Delivery Route Planning

```javascript
async function planDeliveryRoute(warehouse, deliveryLocations) {
  // Add warehouse as first and last point for round trip
  const waypoints = [warehouse, ...deliveryLocations, warehouse];

  // Optimize the order
  const optimized = await getOptimizedRoute(waypoints, 0, waypoints.length - 1);

  // Get the optimized order of deliveries
  const deliveryOrder = optimized.order
    .slice(1, -1) // Remove warehouse from start and end
    .map((index) => deliveryLocations[index - 1]);

  return {
    route: optimized.route,
    order: deliveryOrder,
    totalDistance: optimized.route.distance,
    totalDuration: optimized.route.duration
  };
}
```

### Ride-Sharing ETA

```javascript
async function calculatePickupETA(driverLocation, passengerLocation) {
  const route = await getTrafficRoute(driverLocation, passengerLocation);

  // Account for real-time traffic
  const etaMinutes = Math.ceil(route.duration / 60);
  const etaText = etaMinutes === 1 ? '1 minute' : `${etaMinutes} minutes`;

  return {
    eta: etaText,
    distance: (route.distance * 0.000621371).toFixed(1), // miles
    route: route
  };
}
```

### Walking/Cycling Directions

```javascript
async function getWalkingRoute(start, end) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/walking/` +
      `${start.join(',')};${end.join(',')}?` +
      `steps=true&` +
      `geometries=geojson&` +
      `access_token=${mapboxgl.accessToken}`
  );

  const json = await query.json();
  return json.routes[0];
}

async function getCyclingRoute(start, end) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/cycling/` +
      `${start.join(',')};${end.join(',')}?` +
      `steps=true&` +
      `geometries=geojson&` +
      `access_token=${mapboxgl.accessToken}`
  );

  const json = await query.json();
  return json.routes[0];
}
```
