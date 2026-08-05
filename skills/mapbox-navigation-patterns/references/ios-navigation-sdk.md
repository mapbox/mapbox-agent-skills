# iOS: Navigation SDK Patterns

## Basic Turn-by-Turn Navigation

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

## Custom Navigation UI

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

## Anti-pattern: recomputing progress manually

`RouteProgress`, `RouteLegProgress`, and `RouteStepProgress` already expose `distanceRemaining`,
`durationRemaining`, `distanceTraveled`, and `fractionTraveled` (see `updateProgress` above). Don't
recompute these by walking a route's `legs`/`steps`/`shape` coordinates by hand on every
`routeProgress` publisher update — it duplicates values the SDK already maintains for you and is
easy to get subtly wrong (leg boundaries, partial progress within the current step).

```swift
// Avoid — manually summing step distances on every update
let remaining = progress.route.legs
    .flatMap { $0.steps }
    .dropFirst(progress.legIndex)
    .reduce(0.0) { $0 + $1.distance }

// Prefer — already computed by the SDK
let remaining = progress.durationRemaining
```

This is the same underlying principle as Android's `RouteProgress` guidance — a different SDK,
same idea: read the field the SDK already gives you rather than re-deriving it from raw route
data. Unlike the Android antipatterns file's native-object accessor cost claims, this hasn't been
verified against actual iOS SDK internals — treat the correctness/duplication point as solid, but
don't assume a specific performance cost here without checking the iOS SDK source.

## Voice Guidance Configuration

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
