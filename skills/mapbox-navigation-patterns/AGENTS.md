# Mapbox Navigation Patterns

Quick reference for implementing navigation and routing with Mapbox Directions API and Navigation SDKs.

## Product Decision

| Need                        | Solution                   |
| --------------------------- | -------------------------- |
| **Web routing**             | Directions API             |
| **Turn-by-turn iOS**        | Navigation SDK for iOS     |
| **Turn-by-turn Android**    | Navigation SDK for Android |
| **Voice guidance**          | Navigation SDK only        |
| **Multi-stop optimization** | Optimization API           |

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
const coords = waypoints.map((w) => `${w[0]},${w[1]}`).join(';');

const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?...`;
```

### Route Optimization

```javascript
// Optimize waypoint order
const url =
  `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coords}?` +
  `source=first&destination=last&roundtrip=true&...`;

const optimized = json.trips[0];
const order = json.waypoints.map((wp) => wp.waypoint_index);
```

### Traffic-Aware Routing

```javascript
// Use driving-traffic profile
const url =
  `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?` +
  `annotations=duration,distance,congestion&...`;

// Color by congestion level
const congestion = route.legs[0].annotation.congestion;
// Values: 'low', 'moderate', 'heavy', 'severe'
```

### Turn-by-Turn Instructions

```javascript
const steps = route.legs[0].steps;

steps.forEach((step) => {
  console.log(step.maneuver.instruction); // "Turn left onto Main St"
  console.log(step.distance); // meters
  console.log(step.duration); // seconds
});
```

## Navigation SDK for iOS

### Basic Navigation

```swift
import MapboxNavigationCore
import MapboxNavigationUIKit

// Initialize provider
let mapboxNavigationProvider = MapboxNavigationProvider(
    coreConfig: CoreConfig(
        locationSource: .live,
        ttsConfig: .default  // Voice guidance enabled
    )
)

// Calculate routes with async/await
Task {
    do {
        let options = NavigationRouteOptions(
            coordinates: [start, end]
        )

        let navigationRoutes = try await mapboxNavigationProvider
            .mapboxNavigation
            .routingProvider()
            .calculateRoutes(options: options)
            .value

        // Show full navigation UI
        let navigationOptions = NavigationOptions(
            mapboxNavigation: mapboxNavigationProvider.mapboxNavigation,
            voiceController: mapboxNavigationProvider.routeVoiceController,
            eventsManager: mapboxNavigationProvider.eventsManager()
        )

        let navVC = NavigationViewController(
            navigationRoutes: navigationRoutes,
            navigationOptions: navigationOptions
        )
        present(navVC, animated: true)

    } catch {
        print("Error: \(error)")
    }
}
```

### Custom Navigation UI

```swift
import MapboxNavigationCore
import Combine

class CustomNavigation {
    private let provider: MapboxNavigationProvider
    private var subscriptions = Set<AnyCancellable>()

    init() {
        provider = MapboxNavigationProvider(coreConfig: CoreConfig())
        setupSubscriptions()
    }

    func setupSubscriptions() {
        let navigation = provider.mapboxNavigation.navigation()

        // Subscribe to route progress
        navigation.routeProgress
            .sink { [weak self] progressState in
                guard let progress = progressState?.routeProgress else { return }
                self?.updateUI(progress)
            }
            .store(in: &subscriptions)

        // Subscribe to banner instructions
        navigation.bannerInstructions
            .removeDuplicates()
            .sink { [weak self] state in
                guard let instruction = state.visualInstruction else { return }
                self?.showInstruction(instruction.primaryInstruction.text)
            }
            .store(in: &subscriptions)
    }

    func updateUI(_ progress: RouteProgress) {
        let distance = progress.currentLegProgress?.currentStepProgress.distanceRemaining
        // Update your custom UI
    }

    func showInstruction(_ text: String) {
        // Display instruction in custom UI
    }
}
```

### Voice Guidance

```swift
// Configure voice via CoreConfig when creating provider
let provider = MapboxNavigationProvider(
    coreConfig: CoreConfig(
        ttsConfig: .default  // or .localOnly, .custom(synthesizer)
    )
)

// Set language via route options
var options = NavigationRouteOptions(coordinates: [start, end])
options.locale = Locale(identifier: "es-ES")  // Spanish
options.distanceMeasurementSystem = .metric
```

## Navigation SDK for Android

### Basic Navigation

```kotlin
import com.mapbox.navigation.core.MapboxNavigationProvider
import com.mapbox.navigation.base.options.NavigationOptions
import com.mapbox.navigation.base.route.NavigationRouterCallback
import com.mapbox.geojson.Point

// Initialize MapboxNavigation
val mapboxNavigation = MapboxNavigationProvider.create(
    NavigationOptions.Builder(context).build()
)

// Request route
val routeOptions = RouteOptions.builder()
    .applyDefaultNavigationOptions()
    .coordinatesList(listOf(
        Point.fromLngLat(originLng, originLat),
        Point.fromLngLat(destLng, destLat)
    ))
    .build()

mapboxNavigation.requestRoutes(
    routeOptions,
    object : NavigationRouterCallback {
        override fun onRoutesReady(
            routes: List<NavigationRoute>,
            routerOrigin: String
        ) {
            mapboxNavigation.setNavigationRoutes(routes)
            mapboxNavigation.startTripSession()
        }

        override fun onFailure(reasons: List<RouterFailure>, routeOptions: RouteOptions) {
            // Handle failure
        }

        override fun onCanceled(routeOptions: RouteOptions, routerOrigin: String) {
            // Handle cancellation
        }
    }
)

// Cleanup
override fun onDestroy() {
    super.onDestroy()
    MapboxNavigationProvider.destroy()
}
```

### Custom Navigation UI

```kotlin
import com.mapbox.navigation.core.trip.session.RouteProgressObserver

// Register route progress observer
private val routeProgressObserver = RouteProgressObserver { routeProgress ->
    // Update custom UI
    val instruction = routeProgress.currentLegProgress
        ?.currentStepProgress?.step
        ?.bannerInstructions?.firstOrNull()?.primary?.text

    val distanceRemaining = routeProgress.currentLegProgress
        ?.currentStepProgress?.distanceRemaining

    val durationRemaining = routeProgress.durationRemaining
}

override fun onStart() {
    super.onStart()
    mapboxNavigation.registerRouteProgressObserver(routeProgressObserver)
}

override fun onStop() {
    super.onStop()
    mapboxNavigation.unregisterRouteProgressObserver(routeProgressObserver)
}
```

## Routing Profiles

| Profile           | Use Case                           |
| ----------------- | ---------------------------------- |
| `driving`         | Car routing without traffic        |
| `driving-traffic` | Car routing with real-time traffic |
| `walking`         | Pedestrian routing                 |
| `cycling`         | Bicycle routing                    |

## Best Practices

### Route Caching

```javascript
const cache = new Map();

async function getCachedRoute(start, end) {
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

| Feature                | Limit                               |
| ---------------------- | ----------------------------------- |
| **Waypoints**          | 25 max (including start/end)        |
| **Alternative routes** | Max 2 alternatives (3 total routes) |
| **Optimization**       | 12 waypoints (v1 API hard limit)    |
| **Rate limit**         | 300 requests/minute (default)       |

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
