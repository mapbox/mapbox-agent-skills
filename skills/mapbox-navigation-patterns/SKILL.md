---
name: mapbox-navigation-patterns
description: Navigation implementation patterns for turn-by-turn directions, route optimization, real-time traffic, multi-stop routing, and voice guidance across web, iOS, and Android platforms
---

# Mapbox Navigation Patterns

Expert guidance for implementing navigation and routing features using Mapbox Directions API and Navigation SDKs. Covers turn-by-turn navigation, route optimization, real-time traffic integration, multi-stop routing, and navigation UI components.

## Use This Skill When

User says things like:

- "I need turn-by-turn navigation in my app"
- "How do I add driving directions?"
- "I want to show a route on the map"
- "I need multi-stop routing"
- "How do I add voice guidance?"
- "I want real-time traffic updates"
- "I need to optimize delivery routes"

## Product Overview

### Directions API (REST)

**Best for:** Web applications, simple routing, backend route calculation

**Features:**

- Route calculation (driving, walking, cycling, traffic)
- Alternative routes
- Turn-by-turn instructions
- Multi-stop routing (up to 25 waypoints)
- Route optimization
- Real-time traffic data
- Avoid specific roads/areas

**Pricing:** Pay per request

### Navigation SDK for iOS

**Best for:** Native iOS apps with turn-by-turn navigation

**Features:**

- Complete turn-by-turn navigation UI
- Voice guidance (30+ languages)
- Real-time rerouting
- Traffic-aware routing
- Offline maps and routing
- Custom UI components
- Route progress tracking
- Speed limit display

**Pricing:** Monthly Active Users (MAU) based

### Navigation SDK for Android

**Best for:** Native Android apps with turn-by-turn navigation

**Features:**

- Complete turn-by-turn navigation UI
- Voice guidance (30+ languages)
- Real-time rerouting
- Traffic-aware routing
- Offline maps and routing
- Custom UI components
- Route progress tracking
- Speed limit display

**Pricing:** Monthly Active Users (MAU) based

## Decision Guide

### Choose Directions API when:

- ✅ Web application
- ✅ Simple route display (no turn-by-turn)
- ✅ Backend route calculation
- ✅ Route planning and optimization
- ✅ Multi-stop routing
- ✅ Don't need voice guidance

### Choose Navigation SDK when:

- ✅ Native mobile app (iOS/Android)
- ✅ Need turn-by-turn navigation
- ✅ Need voice guidance
- ✅ Need navigation UI components
- ✅ Need offline navigation
- ✅ Need real-time rerouting
- ✅ Building a navigation/delivery app

## Web: Directions API Patterns

### Basic Route Display

**Use when:** Show driving directions on a web map

```javascript
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-122.4194, 37.7749],
  zoom: 12
});

async function getRoute(start, end) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?` +
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

### Turn-by-Turn Instructions Display

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

### Alternative Routes

```javascript
async function getRouteWithAlternatives(start, end) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?` +
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

### Multi-Stop Routing

```javascript
async function getMultiStopRoute(waypoints) {
  // waypoints: array of [lng, lat] coordinates
  // Maximum 25 waypoints including start and end

  const coordinates = waypoints.map((wp) => `${wp[0]},${wp[1]}`).join(';');

  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?` +
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

### Route Optimization

**Use when:** Need to optimize the order of waypoints (traveling salesman problem)

```javascript
async function getOptimizedRoute(waypoints, startIndex = 0, endIndex = null) {
  const coordinates = waypoints.map((wp) => `${wp[0]},${wp[1]}`).join(';');

  // Build waypoint indices for source and destination
  const source = startIndex === 'first' ? 'first' : 'any';
  const destination = endIndex === 'last' ? 'last' : 'any';

  const query = await fetch(
    `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordinates}?` +
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

### Traffic-Aware Routing

```javascript
async function getTrafficRoute(start, end) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${start[0]},${start[1]};${end[0]},${end[1]}?` +
      `steps=true&` +
      `geometries=geojson&` +
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

## iOS: Navigation SDK Patterns

### Basic Turn-by-Turn Navigation

```swift
import MapboxNavigationCore
import MapboxNavigationUIKit
import CoreLocation

class NavigationManager: UIViewController {
    // Maintain strong reference to provider
    private let mapboxNavigationProvider: MapboxNavigationProvider
    private var navigationViewController: NavigationViewController?

    override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
        // Initialize provider with configuration
        self.mapboxNavigationProvider = MapboxNavigationProvider(
            coreConfig: CoreConfig(
                locationSource: .live,
                ttsConfig: .default  // Voice guidance enabled
            )
        )
        super.init(nibName: nibNameOrNil, bundle: nibBundleOrNil)
    }

    required init?(coder: NSCoder) {
        self.mapboxNavigationProvider = MapboxNavigationProvider(
            coreConfig: CoreConfig()
        )
        super.init(coder: coder)
    }

    func startNavigation() {
        // Define origin and destination
        let origin = CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194)
        let destination = CLLocationCoordinate2D(latitude: 37.8044, longitude: -122.2711)

        Task {
            do {
                // Build route options
                let routeOptions = NavigationRouteOptions(
                    coordinates: [origin, destination]
                )

                // Calculate routes using async/await
                let navigationRoutes = try await mapboxNavigationProvider
                    .mapboxNavigation
                    .routingProvider()
                    .calculateRoutes(options: routeOptions)
                    .value

                await showNavigationUI(with: navigationRoutes)

            } catch {
                print("Error calculating route: \(error.localizedDescription)")
            }
        }
    }

    @MainActor
    func showNavigationUI(with navigationRoutes: NavigationRoutes) {
        // Configure navigation options
        let navigationOptions = NavigationOptions(
            mapboxNavigation: mapboxNavigationProvider.mapboxNavigation,
            voiceController: mapboxNavigationProvider.routeVoiceController,
            eventsManager: mapboxNavigationProvider.eventsManager(),
            predictiveCacheManager: mapboxNavigationProvider.predictiveCacheManager
        )

        // Create navigation view controller with full UI
        navigationViewController = NavigationViewController(
            navigationRoutes: navigationRoutes,
            navigationOptions: navigationOptions
        )

        navigationViewController?.modalPresentationStyle = .fullScreen
        present(navigationViewController!, animated: true)
    }
}
```

### Custom Navigation UI

```swift
import MapboxNavigationCore
import MapboxMaps
import Combine
import CoreLocation

class CustomNavigationViewController: UIViewController {
    private let mapboxNavigationProvider: MapboxNavigationProvider
    private var mapView: MapView!
    private var subscriptions = Set<AnyCancellable>()

    // Custom UI elements
    var instructionLabel: UILabel!
    var distanceLabel: UILabel!
    var etaLabel: UILabel!

    init() {
        self.mapboxNavigationProvider = MapboxNavigationProvider(
            coreConfig: CoreConfig(
                locationSource: .live
            )
        )
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        self.mapboxNavigationProvider = MapboxNavigationProvider(
            coreConfig: CoreConfig()
        )
        super.init(coder: coder)
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        setupMapView()
        setupCustomUI()
    }

    func setupCustomUI() {
        // Custom instruction banner
        instructionLabel = UILabel()
        instructionLabel.font = .systemFont(ofSize: 24, weight: .bold)
        instructionLabel.textAlignment = .center
        instructionLabel.numberOfLines = 2
        view.addSubview(instructionLabel)

        // Distance to next maneuver
        distanceLabel = UILabel()
        distanceLabel.font = .systemFont(ofSize: 18)
        view.addSubview(distanceLabel)

        // ETA label
        etaLabel = UILabel()
        etaLabel.font = .systemFont(ofSize: 16)
        view.addSubview(etaLabel)

        // Add constraints (simplified)
        instructionLabel.frame = CGRect(x: 20, y: 100, width: view.bounds.width - 40, height: 60)
        distanceLabel.frame = CGRect(x: 20, y: 170, width: view.bounds.width - 40, height: 30)
        etaLabel.frame = CGRect(x: 20, y: 210, width: view.bounds.width - 40, height: 30)
    }

    func setupMapView() {
        mapView = MapView(frame: view.bounds)
        view.insertSubview(mapView, at: 0)
    }

    func startCustomNavigation(to destination: CLLocationCoordinate2D) {
        Task {
            do {
                // Get current location
                guard let origin = mapboxNavigationProvider
                    .mapboxNavigation
                    .navigation()
                    .currentLocationMatching?.location.coordinate else {
                    print("No current location")
                    return
                }

                // Calculate routes
                let routeOptions = NavigationRouteOptions(
                    coordinates: [origin, destination]
                )

                let navigationRoutes = try await mapboxNavigationProvider
                    .mapboxNavigation
                    .routingProvider()
                    .calculateRoutes(options: routeOptions)
                    .value

                // Start navigation and setup subscriptions
                await setupNavigationSubscriptions()

            } catch {
                print("Error: \(error.localizedDescription)")
            }
        }
    }

    @MainActor
    func setupNavigationSubscriptions() {
        let navigation = mapboxNavigationProvider.mapboxNavigation.navigation()

        // Subscribe to route progress updates
        navigation.routeProgress
            .sink { [weak self] progressState in
                guard let progress = progressState?.routeProgress else { return }
                self?.updateProgress(progress)
            }
            .store(in: &subscriptions)

        // Subscribe to location updates
        navigation.locationMatching
            .sink { [weak self] matchingState in
                guard let location = matchingState?.enhancedLocation else { return }
                self?.updateCamera(location)
            }
            .store(in: &subscriptions)

        // Subscribe to banner instructions
        navigation.bannerInstructions
            .removeDuplicates()
            .sink { [weak self] state in
                guard let instruction = state.visualInstruction else { return }
                self?.instructionLabel.text = instruction.primaryInstruction.text
            }
            .store(in: &subscriptions)

        // Subscribe to waypoint arrivals
        navigation.waypointsArrival
            .sink { [weak self] _ in
                print("Arrived!")
            }
            .store(in: &subscriptions)
    }

    private func updateProgress(_ progress: RouteProgress) {
        let distanceRemaining = progress.currentLegProgress?.currentStepProgress.distanceRemaining ?? 0
        distanceLabel.text = "In \(Int(distanceRemaining)) meters"

        let eta = Date().addingTimeInterval(progress.durationRemaining)
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        etaLabel.text = "Arrival: \(formatter.string(from: eta))"
    }

    private func updateCamera(_ location: CLLocation) {
        mapView.camera.ease(
            to: CameraOptions(
                center: location.coordinate,
                zoom: 15,
                bearing: location.course
            ),
            duration: 1.0
        )
    }
}
```

### Voice Guidance Configuration

```swift
import MapboxNavigationCore

// Configure voice guidance when creating the provider

// Option 1: Default (Mapbox Voice API with AVSpeechSynthesizer fallback)
let provider = MapboxNavigationProvider(
    coreConfig: CoreConfig(
        ttsConfig: .default
    )
)

// Option 2: Local-only (AVSpeechSynthesizer, no internet required)
let providerLocal = MapboxNavigationProvider(
    coreConfig: CoreConfig(
        ttsConfig: .localOnly
    )
)

// Option 3: Custom speech synthesizer
let customSynthesizer = MyCustomSpeechSynthesizer()
let providerCustom = MapboxNavigationProvider(
    coreConfig: CoreConfig(
        ttsConfig: .custom(customSynthesizer)
    )
)

// Set voice language via route options
var routeOptions = NavigationRouteOptions(
    coordinates: [origin, destination]
)
routeOptions.locale = Locale(identifier: "es-ES")  // Spanish voice
routeOptions.distanceMeasurementSystem = .metric   // Metric distances
```

## Android: Navigation SDK Patterns

### Basic Turn-by-Turn Navigation

```kotlin
import com.mapbox.navigation.base.options.NavigationOptions
import com.mapbox.navigation.core.MapboxNavigation
import com.mapbox.navigation.core.MapboxNavigationProvider
import com.mapbox.navigation.base.route.NavigationRouterCallback
import com.mapbox.navigation.base.route.RouterOrigin
import com.mapbox.navigation.base.route.RouterFailure
import com.mapbox.api.directions.v5.models.RouteOptions
import com.mapbox.geojson.Point

class NavigationActivity : AppCompatActivity() {
    private lateinit var mapboxNavigation: MapboxNavigation

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_navigation)

        // Initialize MapboxNavigation
        mapboxNavigation = MapboxNavigationProvider.create(
            NavigationOptions.Builder(this).build()
        )

        // Define origin and destination
        val origin = Point.fromLngLat(-122.4194, 37.7749)
        val destination = Point.fromLngLat(-122.2711, 37.8044)

        // Request routes
        mapboxNavigation.requestRoutes(
            RouteOptions.builder()
                .applyDefaultNavigationOptions()
                .coordinatesList(listOf(origin, destination))
                .build(),
            object : NavigationRouterCallback {
                override fun onRoutesReady(
                    routes: List<NavigationRoute>,
                    @RouterOrigin routerOrigin: String
                ) {
                    // Set routes and start navigation
                    mapboxNavigation.setNavigationRoutes(routes)
                    mapboxNavigation.startTripSession()
                }

                override fun onFailure(
                    reasons: List<RouterFailure>,
                    routeOptions: RouteOptions
                ) {
                    // Handle failure
                }

                override fun onCanceled(
                    routeOptions: RouteOptions,
                    @RouterOrigin routerOrigin: String
                ) {
                    // Handle cancellation
                }
            }
        )
    }

    override fun onDestroy() {
        super.onDestroy()
        MapboxNavigationProvider.destroy()
    }
}
```

### Custom Navigation UI

```kotlin
import com.mapbox.navigation.core.MapboxNavigation
import com.mapbox.navigation.core.trip.session.LocationMatcherResult
import com.mapbox.navigation.core.trip.session.LocationObserver
import com.mapbox.navigation.core.trip.session.RouteProgressObserver
import com.mapbox.maps.MapView

class CustomNavigationActivity : AppCompatActivity() {
    private lateinit var mapboxNavigation: MapboxNavigation
    private lateinit var mapView: MapView
    private lateinit var instructionText: TextView
    private lateinit var distanceText: TextView
    private lateinit var etaText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_custom_navigation)

        mapView = findViewById(R.id.mapView)
        instructionText = findViewById(R.id.instructionText)
        distanceText = findViewById(R.id.distanceText)
        etaText = findViewById(R.id.etaText)

        setupNavigation()
    }

    private fun setupNavigation() {
        // Initialize MapboxNavigation
        // Note: Access token is configured via MapboxOptions.accessToken
        // or from mapbox_access_token string resource
        mapboxNavigation = MapboxNavigationProvider.create(
            NavigationOptions.Builder(this).build()
        )

        // Request route
        val origin = Point.fromLngLat(-122.4194, 37.7749)
        val destination = Point.fromLngLat(-122.2711, 37.8044)

        val routeOptions = RouteOptions.builder()
            .applyDefaultNavigationOptions()
            .coordinatesList(listOf(origin, destination))
            .build()

        mapboxNavigation.requestRoutes(
            routeOptions,
            object : NavigationRouterCallback {
                override fun onRoutesReady(routes: List<NavigationRoute>,
                                          routerOrigin: RouterOrigin) {
                    mapboxNavigation.setNavigationRoutes(routes)
                    startNavigation()
                }

                override fun onFailure(reasons: List<RouterFailure>,
                                      routeOptions: RouteOptions) {
                    Log.e("Navigation", "Route request failed: $reasons")
                }

                override fun onCanceled(routeOptions: RouteOptions,
                                       routerOrigin: RouterOrigin) {
                    // Handle cancellation
                }
            }
        )
    }

    private fun startNavigation() {
        // Register observers for navigation updates
        mapboxNavigation.registerRouteProgressObserver(routeProgressObserver)
        mapboxNavigation.registerLocationObserver(locationObserver)

        // Start trip session
        mapboxNavigation.startTripSession()
    }

    private val routeProgressObserver = RouteProgressObserver { routeProgress ->
        // Update custom UI
        val currentStep = routeProgress.currentLegProgress
            ?.currentStepProgress?.step

        instructionText.text = currentStep?.bannerInstructions?.firstOrNull()
            ?.primary?.text ?: "Continue"

        val distanceRemaining = routeProgress.currentLegProgress
            ?.currentStepProgress?.distanceRemaining ?: 0f
        distanceText.text = "In ${distanceRemaining.toInt()} meters"

        val durationRemaining = routeProgress.durationRemaining
        val eta = System.currentTimeMillis() + (durationRemaining * 1000).toLong()
        val formatter = SimpleDateFormat("h:mm a", Locale.getDefault())
        etaText.text = "Arrival: ${formatter.format(Date(eta))}"
    }

    private val locationObserver = object : LocationObserver {
        override fun onNewRawLocation(rawLocation: Location) {
            // Handle raw location
        }

        override fun onNewLocationMatcherResult(
            locationMatcherResult: LocationMatcherResult
        ) {
            // Update camera to follow user
            val location = locationMatcherResult.enhancedLocation
            mapView.getMapboxMap().setCamera(
                CameraOptions.Builder()
                    .center(Point.fromLngLat(location.longitude, location.latitude))
                    .zoom(15.0)
                    .bearing(location.bearing.toDouble())
                    .build()
            )
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        mapboxNavigation.unregisterRouteProgressObserver(routeProgressObserver)
        mapboxNavigation.unregisterLocationObserver(locationObserver)
        MapboxNavigationProvider.destroy()
    }
}
```

## Best Practices

### 1. Route Caching

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

### 2. Error Handling

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

### 3. Performance Optimization

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
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${start.join(',')};${end.join(',')}?` +
      `geometries=polyline6&` + // More compact than geojson
      `overview=simplified&` + // Simplified geometry
      `access_token=${mapboxgl.accessToken}`
  );

  return await query.json();
}
```

### 4. User Experience

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

## Related Skills

- **mapbox-search-integration**: Address search and geocoding
- **mapbox-web-performance-patterns**: Optimizing navigation performance
- **mapbox-ios-patterns**: iOS-specific integration patterns
- **mapbox-android-patterns**: Android-specific integration patterns
- **mapbox-token-security**: Securing your access tokens

## Resources

- [Directions API Documentation](https://docs.mapbox.com/api/navigation/directions/)
- [Navigation SDK for iOS](https://docs.mapbox.com/ios/navigation/)
- [Navigation SDK for Android](https://docs.mapbox.com/android/navigation/)
- [Optimization API Documentation](https://docs.mapbox.com/api/navigation/optimization/)
- [Map Matching API](https://docs.mapbox.com/api/navigation/map-matching/)
- [Navigation Products Overview](https://docs.mapbox.com/help/getting-started/navigation/)

## Quick Decision Guide

**User says: "I need directions"**

- Web app → Use Directions API
- Mobile app → Use Navigation SDK

**User says: "I need turn-by-turn navigation"**

- iOS → Navigation SDK for iOS
- Android → Navigation SDK for Android
- Web → Use Directions API + custom UI (no voice guidance)

**User says: "I need to optimize delivery routes"**
→ Use Optimization API (multi-stop route optimization)

**User says: "I need real-time traffic"**
→ Use `driving-traffic` profile with Directions API or Navigation SDK

**User says: "I need voice guidance"**
→ Must use Navigation SDK (iOS/Android only)
