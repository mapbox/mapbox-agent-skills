# Mapbox Navigation Patterns

Quick reference for implementing navigation and routing with Mapbox Directions API and Navigation SDKs.

## Product Decision

| Need | Solution |
|------|----------|
| **Web routing** | Directions API |
| **Turn-by-turn iOS** | Navigation SDK for iOS |
| **Turn-by-turn Android** | Navigation SDK for Android |
| **Voice guidance** | Navigation SDK only |
| **Multi-stop optimization** | Optimization API |

## Directions API (Web)

### Basic Route

```javascript
const query = await fetch(
  `https://api.mapbox.com/directions/v5/mapbox/driving/` +
  `${start[0]},${start[1]};${end[0]},${end[1]}?` +
  `steps=true&geometries=geojson&access_token=${token}`
);

const route = (await query.json()).routes[0];

// Display on map
map.addSource('route', {
  type: 'geojson',
  data: { type: 'Feature', geometry: route.geometry }
});

map.addLayer({
  id: 'route',
  type: 'line',
  source: 'route',
  paint: {
    'line-color': '#3b9ddd',
    'line-width': 8
  }
});
```

### Alternative Routes

```javascript
// Add alternatives=true
const url = `...&alternatives=true&...`;

const routes = json.routes; // Returns multiple routes

// Main route = routes[0], alternatives = routes[1], routes[2]
```

### Multi-Stop Routing

```javascript
// Up to 25 waypoints
const waypoints = [start, stop1, stop2, stop3, end];
const coords = waypoints.map(w => `${w[0]},${w[1]}`).join(';');

const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?...`;
```

### Route Optimization

```javascript
// Optimize waypoint order
const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coords}?` +
  `source=first&destination=last&roundtrip=true&...`;

const optimized = json.trips[0];
const order = json.waypoints.map(wp => wp.waypoint_index);
```

### Traffic-Aware Routing

```javascript
// Use driving-traffic profile
const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?` +
  `annotations=duration,distance,congestion&...`;

// Color by congestion level
const congestion = route.legs[0].annotation.congestion;
// Values: 'low', 'moderate', 'heavy', 'severe'
```

### Turn-by-Turn Instructions

```javascript
const steps = route.legs[0].steps;

steps.forEach(step => {
  console.log(step.maneuver.instruction); // "Turn left onto Main St"
  console.log(step.distance); // meters
  console.log(step.duration); // seconds
});
```

## Navigation SDK for iOS

### Basic Navigation

```swift
import MapboxNavigation

// Define waypoints
let origin = Waypoint(coordinate: start, name: "Start")
let destination = Waypoint(coordinate: end, name: "End")

// Request route
let options = NavigationRouteOptions(waypoints: [origin, destination])

Directions.shared.calculate(options) { (_, result) in
    switch result {
    case .success(let response):
        let route = response.routes!.first!

        // Show full navigation UI
        let navVC = NavigationViewController(
            for: route,
            routeIndex: 0,
            routeOptions: options
        )
        navVC.delegate = self
        present(navVC, animated: true)

    case .failure(let error):
        print("Error: \(error)")
    }
}
```

### Custom Navigation UI

```swift
import MapboxCoreNavigation

// Core navigation without UI
let service = MapboxNavigationService(
    routeResponse: response,
    routeIndex: 0,
    routeOptions: options
)

service.delegate = self
service.start()

// Implement NavigationServiceDelegate
func navigationService(_ service: NavigationService,
                      didUpdate progress: RouteProgress,
                      with location: CLLocation,
                      rawLocation: CLLocation) {
    // Update your custom UI
    let instruction = progress.currentLegProgress.currentStepProgress.step.instructions
    let distance = progress.currentLegProgress.currentStepProgress.distanceRemaining
}
```

### Voice Guidance

```swift
let voiceController = navigationService.voiceController

// Configure language
voiceController.locale = Locale(identifier: "en-US")

// Control volume
voiceController.volume = .normal // or .muted, .custom(0.5)
```

## Navigation SDK for Android

### Basic Navigation

```kotlin
import com.mapbox.navigation.dropin.NavigationView

// NavigationView provides complete UI
val navigationView = findViewById<NavigationView>(R.id.navigationView)

navigationView.api.startArrival(
    Waypoint.builder()
        .coordinate(Point.fromLngLat(lng, lat))
        .name("Destination")
        .build()
)
```

### Custom Navigation UI

```kotlin
import com.mapbox.navigation.core.MapboxNavigation

// Core navigation
val mapboxNavigation = MapboxNavigationProvider.create(
    NavigationOptions.Builder(context)
        .accessToken(token)
        .build()
)

// Request route
val routeOptions = RouteOptions.builder()
    .applyDefaultNavigationOptions()
    .coordinatesList(listOf(origin, destination))
    .build()

mapboxNavigation.requestRoutes(routeOptions, callback)

// Start navigation
mapboxNavigation.registerRouteProgressObserver { routeProgress ->
    // Update UI
    val instruction = routeProgress.currentLegProgress
        ?.currentStepProgress?.step
        ?.bannerInstructions?.firstOrNull()?.primary?.text

    val distanceRemaining = routeProgress.currentLegProgress
        ?.currentStepProgress?.distanceRemaining
}

mapboxNavigation.startTripSession()
```

## Routing Profiles

| Profile | Use Case |
|---------|----------|
| `driving` | Car routing without traffic |
| `driving-traffic` | Car routing with real-time traffic |
| `walking` | Pedestrian routing |
| `cycling` | Bicycle routing |

## Best Practices

### Route Caching

```javascript
const cache = new Map();

function getCachedRoute(start, end) {
  const key = `${start}-${end}`;
  const cached = cache.get(key);

  if (cached && Date.now() - cached.time < 5 * 60 * 1000) {
    return cached.route;
  }

  // Fetch new route
  const route = await getRoute(start, end);
  cache.set(key, { route, time: Date.now() });
  return route;
}
```

### Error Handling

```javascript
try {
  const response = await fetch(directionsURL);
  const json = await response.json();

  if (json.code !== 'Ok') {
    throw new Error(`Directions error: ${json.code}`);
  }

  if (!json.routes || json.routes.length === 0) {
    throw new Error('No routes found');
  }

  return json.routes[0];

} catch (error) {
  // Show user-friendly message
  alert('Unable to calculate route');
}
```

### Performance

```javascript
// Debounce route requests
let timeout;
function requestRouteDebounced(start, end) {
  clearTimeout(timeout);
  timeout = setTimeout(() => getRoute(start, end), 500);
}

// Use simplified geometry
const url = `...&overview=simplified&geometries=polyline6`;
```

## Common Patterns

### Delivery Route

```javascript
// Optimize delivery stops
const stops = [warehouse, ...deliveries, warehouse];
const optimized = await getOptimizedRoute(stops, 0, stops.length - 1);

// Get optimized order
const order = optimized.order.slice(1, -1);
```

### Ride-Sharing ETA

```javascript
const route = await getTrafficRoute(driver, passenger);
const eta = Math.ceil(route.duration / 60); // minutes
const distance = (route.distance * 0.000621371).toFixed(1); // miles
```

### Walking/Cycling

```javascript
// Walking
const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?...`;

// Cycling
const url = `https://api.mapbox.com/directions/v5/mapbox/cycling/${coords}?...`;
```

## API Limits

| Feature | Limit |
|---------|-------|
| **Waypoints** | 25 max (including start/end) |
| **Alternative routes** | Up to 3 |
| **Optimization** | 12 waypoints (free tier), 25 (premium) |
| **Rate limit** | 300 requests/minute (default) |

## Quick Decisions

**Need turn-by-turn navigation?**
→ iOS/Android: Navigation SDK | Web: Directions API + custom UI

**Need voice guidance?**
→ Must use Navigation SDK (iOS/Android only)

**Need route optimization?**
→ Use Optimization API with `source` and `destination` params

**Need real-time traffic?**
→ Use `driving-traffic` profile

**Need offline navigation?**
→ Must use Navigation SDK (iOS/Android only)

## Resources

- Directions API: <https://docs.mapbox.com/api/navigation/directions/>
- Navigation SDK iOS: <https://docs.mapbox.com/ios/navigation/>
- Navigation SDK Android: <https://docs.mapbox.com/android/navigation/>
- Optimization API: <https://docs.mapbox.com/api/navigation/optimization/>
