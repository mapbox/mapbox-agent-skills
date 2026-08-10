# iOS: Navigation SDK UIKit / Drop-in UI

**Load this file only when** the user explicitly asks for UIKit, `NavigationViewController`, or a drop-in full-screen navigation experience.

**Default for all other iOS Navigation work:** [`ios-navigation-sdk.md`](ios-navigation-sdk.md) (Core + SwiftUI / CoreSDKExample).

**Canonical samples:**

- [UIKitExample](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/UIKitExample)
- Topic samples in [AdditionalExamples](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/AdditionalExamples) (Basic, Embedded, Styled UI, etc.) — list `listOfExamples` in `Constants.swift` before answering so new samples (e.g. Road Cameras) are not missed.

## Drop-in turn-by-turn UI

```swift
import MapboxNavigationCore
import MapboxNavigationUIKit
import CoreLocation

class NavigationManager: UIViewController {
    // Maintain strong reference to provider
    private let mapboxNavigationProvider: MapboxNavigationProvider
    private var navigationViewController: NavigationViewController?

    override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
        self.mapboxNavigationProvider = MapboxNavigationProvider(
            coreConfig: CoreConfig(
                locationSource: .live,
                ttsConfig: .default
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
        let origin = CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194)
        let destination = CLLocationCoordinate2D(latitude: 37.8044, longitude: -122.2711)

        Task {
            do {
                let routeOptions = NavigationRouteOptions(
                    coordinates: [origin, destination]
                )

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
        let navigationOptions = NavigationOptions(
            mapboxNavigation: mapboxNavigationProvider.mapboxNavigation,
            voiceController: mapboxNavigationProvider.routeVoiceController,
            eventsManager: mapboxNavigationProvider.eventsManager(),
            predictiveCacheManager: mapboxNavigationProvider.predictiveCacheManager
        )

        navigationViewController = NavigationViewController(
            navigationRoutes: navigationRoutes,
            navigationOptions: navigationOptions
        )

        navigationViewController?.modalPresentationStyle = .fullScreen
        present(navigationViewController!, animated: true)
    }
}
```

## Custom UIKit UI with Core publishers

When staying on UIKit but building a custom chrome (not `NavigationViewController`), still use `MapboxNavigationCore` publishers — same Core APIs as the SwiftUI default path.

```swift
import MapboxNavigationCore
import MapboxMaps
import Combine
import CoreLocation

class CustomNavigationViewController: UIViewController {
    private let mapboxNavigationProvider: MapboxNavigationProvider
    private var mapView: MapView!
    private var subscriptions = Set<AnyCancellable>()

    var instructionLabel: UILabel!
    var distanceLabel: UILabel!
    var etaLabel: UILabel!

    init() {
        self.mapboxNavigationProvider = MapboxNavigationProvider(
            coreConfig: CoreConfig(locationSource: .live)
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
        mapView = MapView(frame: view.bounds)
        view.insertSubview(mapView, at: 0)
        // Layout instructionLabel / distanceLabel / etaLabel as needed
    }

    func startCustomNavigation(to destination: CLLocationCoordinate2D) {
        Task {
            do {
                guard let origin = mapboxNavigationProvider
                    .mapboxNavigation
                    .navigation()
                    .currentLocationMatching?.location.coordinate else { return }

                let routeOptions = NavigationRouteOptions(
                    coordinates: [origin, destination]
                )
                let navigationRoutes = try await mapboxNavigationProvider
                    .mapboxNavigation
                    .routingProvider()
                    .calculateRoutes(options: routeOptions)
                    .value

                mapboxNavigationProvider.mapboxNavigation
                    .tripSession()
                    .startActiveGuidance(with: navigationRoutes, startLegIndex: 0)

                await setupNavigationSubscriptions()
            } catch {
                print("Error: \(error.localizedDescription)")
            }
        }
    }

    @MainActor
    func setupNavigationSubscriptions() {
        let navigation = mapboxNavigationProvider.mapboxNavigation.navigation()

        navigation.routeProgress
            .sink { [weak self] progressState in
                guard let progress = progressState?.routeProgress else { return }
                self?.updateProgress(progress)
            }
            .store(in: &subscriptions)

        navigation.bannerInstructions
            .removeDuplicates()
            .sink { [weak self] state in
                guard let instruction = state.visualInstruction else { return }
                self?.instructionLabel.text = instruction.primaryInstruction.text
            }
            .store(in: &subscriptions)
    }

    private func updateProgress(_ progress: RouteProgress) {
        let distanceRemaining =
            progress.currentLegProgress?.currentStepProgress.distanceRemaining ?? 0
        distanceLabel.text = "In \(Int(distanceRemaining)) meters"

        let eta = Date().addingTimeInterval(progress.durationRemaining)
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        etaLabel.text = "Arrival: \(formatter.string(from: eta))"
    }
}
```

## Voice guidance

Same CoreConfig TTS options as the Core reference (`.default`, `.localOnly`, `.custom`); set `locale` / `distanceMeasurementSystem` on `NavigationRouteOptions`.

## Resources

- [UIKitExample](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/UIKitExample)
- [AdditionalExamples](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/AdditionalExamples)
- Core / SwiftUI default → [`ios-navigation-sdk.md`](ios-navigation-sdk.md)
