# Mapbox Navigation Patterns

Quick reference for implementing navigation and routing with Mapbox Directions API and Navigation SDKs.

## Product Decision

| Need                          | Solution                                               |
| ----------------------------- | ------------------------------------------------------ |
| **Show a route on a web map** | Directions API                                         |
| **Turn-by-turn iOS**          | Navigation SDK for iOS (SwiftUI + drop-in NVC default) |
| **Turn-by-turn Android**      | Navigation SDK for Android                             |
| **Voice guidance**            | Navigation SDK only                                    |
| **Multi-stop optimization**   | Optimization API                                       |

## Directions API (Web)

Coordinates are always `longitude,latitude` order. Default to the `driving-traffic` profile — it factors in live traffic, congestion, and incidents. Use `driving` only when you need `arrive_by` (not supported by `driving-traffic`); both profiles support `depart_at`.

### Basic Route

```javascript
const query = await fetch(
  `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/` +
    `${start[0]},${start[1]};${end[0]},${end[1]}?` + // lon,lat
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
const coords = waypoints.map((w) => `${w[0]},${w[1]}`).join(';'); // lon,lat

const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?...`;
```

### Route Optimization

```javascript
// Optimize waypoint order — hard limit: 12 coordinates max (v1 API)
// source/destination only accept 'first'/'any' and 'last'/'any' — no numeric indices
const url =
  `https://api.mapbox.com/optimized-trips/v1/mapbox/driving-traffic/${coords}?` +
  `source=first&destination=last&roundtrip=true&...`;

const optimized = json.trips[0];
const order = json.waypoints.map((wp) => wp.waypoint_index);

// More than 12 stops, or need time windows/vehicle capacities? See Optimization
// API v2 (separate async job-submission API, Public Beta, up to 1,000 locations)
```

### Congestion-Based Route Coloring

```javascript
// annotations must be paired with overview=full or the geometry won't line up
// point-for-point with the per-segment annotation array
const url =
  `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?` +
  `overview=full&annotations=duration,distance,congestion&...`;

// Color by congestion level
const congestion = route.legs[0].annotation.congestion;
// Values: 'low', 'moderate', 'heavy', 'severe', 'unknown'
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

**Default:** SwiftUI app shell + wrap `NavigationViewController` with `UIViewControllerRepresentable` (official getting-started). Fully custom Core UI ([CoreSDKExample](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/CoreSDKExample)) only when explicitly requested.

**Setup first:** SPM (`MapboxNavigationCore` + `MapboxNavigationUIKit`), `.netrc` download token, `MBXAccessToken`, location permissions, background `audio`/`location` — see `references/ios-navigation-sdk.md` checklist and [install guide](https://docs.mapbox.com/ios/navigation/guides/install/).

For specialized topics (road cameras, history, e-horizon, CarPlay, offline, styled chrome, etc.), use the **Example patterns catalog** in `references/ios-navigation-sdk.md`. Load `references/ios-navigation-specialized.md` for multi-stop, route line, camera, road cameras, and route alerts. Do not fetch upstream sample source unless the user asks to open a specific example.

**Sample host ≠ API stack:** `AdditionalExamples` are often UIKit demos. APIs on `NavigationMapView` (waypoints, final-waypoint image, route line, camera, callouts, road cameras) are stack-independent — wrap `NavigationMapView` in `UIViewRepresentable`. Road cameras: `navigationMapView.mapView.mapboxMap` + `RoadCamerasManager(navigatorHandle: provider.navigatorHandle)`. True UIKit-only: NVC chrome (top/bottom bars, styled UI elements, embed NVC).

### Default: SwiftUI + drop-in NavigationViewController

```swift
import MapboxNavigationCore
import MapboxNavigationUIKit
import SwiftUI

struct NavigationViewControllerWrapper: UIViewControllerRepresentable {
    let navigationRoutes: NavigationRoutes
    let navigationOptions: NavigationOptions

    func makeUIViewController(context: Context) -> NavigationViewController {
        NavigationViewController(
            navigationRoutes: navigationRoutes,
            navigationOptions: navigationOptions
        )
    }

    func updateUIViewController(_ uiViewController: NavigationViewController, context: Context) {}
}

let provider = MapboxNavigationProvider(
    coreConfig: CoreConfig(locationSource: .live, ttsConfig: .default)
)
let routes = try await provider.mapboxNavigation
    .routingProvider()
    .calculateRoutes(options: NavigationRouteOptions(coordinates: [start, end]))
    .value
let options = NavigationOptions(
    mapboxNavigation: provider.mapboxNavigation,
    voiceController: provider.routeVoiceController,
    eventsManager: provider.eventsManager()
)
// NavigationViewControllerWrapper(navigationRoutes: routes, navigationOptions: options)
```

### UIKit: present drop-in UI

```swift
import MapboxNavigationCore
import MapboxNavigationUIKit

let provider = MapboxNavigationProvider(
    coreConfig: CoreConfig(locationSource: .live, ttsConfig: .default)
)
let navigationRoutes = try await provider.mapboxNavigation
    .routingProvider()
    .calculateRoutes(options: NavigationRouteOptions(coordinates: [start, end]))
    .value
let navVC = NavigationViewController(
    navigationRoutes: navigationRoutes,
    navigationOptions: NavigationOptions(
        mapboxNavigation: provider.mapboxNavigation,
        voiceController: provider.routeVoiceController,
        eventsManager: provider.eventsManager()
    )
)
present(navVC, animated: true)
```

### Opt-in: fully custom Core UI

```swift
import MapboxNavigationCore
import Combine

@MainActor
final class Navigation: ObservableObject {
    @Published private(set) var visualInstruction: VisualInstructionBanner?
    @Published private(set) var routeProgress: RouteProgress?
    @Published private(set) var currentPreviewRoutes: NavigationRoutes?

    // Keep a strong reference — do not create the provider only inside init and discard it.
    private let provider: MapboxNavigationProvider
    private let core: MapboxNavigation
    private let voiceController: RouteVoiceController

    init() {
        let provider = MapboxNavigationProvider(
            coreConfig: CoreConfig(locationSource: .live, ttsConfig: .default)
        )
        self.provider = provider
        core = provider.mapboxNavigation
        voiceController = provider.routeVoiceController

        core.navigation().bannerInstructions
            .map(\.visualInstruction)
            .assign(to: &$visualInstruction)

        core.navigation().routeProgress
            .map { $0?.routeProgress }
            .assign(to: &$routeProgress)
    }

    func startActiveNavigation() {
        guard let routes = currentPreviewRoutes else { return }
        core.tripSession().startActiveGuidance(with: routes, startLegIndex: 0)
    }
}
```

### Voice Guidance

```swift
MapboxNavigationProvider(
    coreConfig: CoreConfig(ttsConfig: .default) // or .localOnly, .custom(synthesizer)
)

var options = NavigationRouteOptions(coordinates: [start, end])
options.locale = Locale(identifier: "es-ES")
options.distanceMeasurementSystem = .metric
```

## Navigation SDK for Android

### Basic Navigation

```kotlin
import com.mapbox.geojson.Point
import com.mapbox.navigation.base.options.NavigationOptions
import com.mapbox.navigation.base.route.NavigationRouterCallback
import com.mapbox.navigation.core.MapboxNavigation
import com.mapbox.navigation.core.lifecycle.MapboxNavigationApp
import com.mapbox.navigation.core.lifecycle.MapboxNavigationObserver
import com.mapbox.navigation.core.lifecycle.requireMapboxNavigation

// Lifecycle-aware handle — prefer this over MapboxNavigationProvider.
// Survives configuration changes; attaches/detaches automatically.
val mapboxNavigation: MapboxNavigation by requireMapboxNavigation(
    onResumedObserver = object : MapboxNavigationObserver {
        override fun onAttached(mapboxNavigation: MapboxNavigation) {
            mapboxNavigation.startTripSession()
        }
        override fun onDetached(mapboxNavigation: MapboxNavigation) {}
    },
    onInitialize = {
        MapboxNavigationApp.setup(NavigationOptions.Builder(context).build())
    }
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
            // Set routes; startTripSession() already ran in onAttached
            mapboxNavigation.setNavigationRoutes(routes)
        }

        override fun onFailure(reasons: List<RouterFailure>, routeOptions: RouteOptions) {
            // Handle failure
        }

        override fun onCanceled(routeOptions: RouteOptions, routerOrigin: String) {
            // Handle cancellation
        }
    }
)
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
