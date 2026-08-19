# Best Practices and Common Use Cases

## Best Practices

### Route Caching

Cache routes to reduce API calls and improve performance:

```javascript
const routeCache = new Map();

async function getCachedRoute(start, end) {
  const key = `${start.join(',')}-${end.join(',')}`;

  if (routeCache.has(key)) {
    const cached = routeCache.get(key);
    // Check if cache is still fresh (e.g., 5 minutes)
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.route;
    }
  }

  const route = await getRoute(start, end);
  routeCache.set(key, { route, timestamp: Date.now() });
  return route;
}
```

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
