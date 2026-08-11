# iOS: Navigation SDK Patterns

**Default stack:** SwiftUI + `MapboxNavigationCore`. Use `MapboxNavigationUIKit` / `NavigationViewController` only when the user explicitly asks for UIKit or a drop-in navigation UI.

**Canonical sample:** [CoreSDKExample](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/CoreSDKExample) (`Navigation.swift` + `Views/`).

## Example patterns catalog

Like Maps/Search skills, this file is self-contained. Use the catalog below to pick a pattern. **Do not** fetch upstream example source unless the user explicitly asks to open or follow a specific sample file.

| Topic                               | Example                              | Stack / notes                     |
| ----------------------------------- | ------------------------------------ | --------------------------------- |
| Custom Core navigation UI (default) | `CoreSDKExample`                     | SwiftUI + `MapboxNavigationCore`  |
| Minimal drop-in navigation          | `AdditionalExamples` → Basic         | UIKit `NavigationViewController`  |
| Full UIKit app shell                | `UIKitExample`                       | UIKit                             |
| CarPlay                             | `CarPlayExample`                     | CarPlay                           |
| Advanced / alt routes + style       | Advanced Implementation              | UIKit; preview → active guidance  |
| Multi-stop route                    | Multiple Waypoints                   | UIKit                             |
| Custom final waypoint image         | Custom Final Waypoint                | UIKit                             |
| Custom route callouts               | Custom Route Callouts                | UIKit                             |
| Embed `NavigationViewController`    | Embedded View Controller             | UIKit                             |
| Styled UI + map style               | Styled UI Elements                   | UIKit                             |
| Directions beta query params        | Directions API beta query parameters | Subclass `NavigationRouteOptions` |
| Custom waypoint styling             | Custom Waypoint Styling              | UIKit                             |
| Custom voice / audio                | Custom Voice Controller              | Custom TTS recordings             |
| Custom top/bottom bars              | Custom Top & Bottom Bars             | UIKit chrome                      |
| Custom route line styling           | Custom Route Lines Styling           | UIKit                             |
| Offline TileStore / regions         | Offline Regions                      | Offline                           |
| Record trip history                 | History Recording                    | Free drive + active guidance      |
| Replay trip history                 | History Replaying                    | History files (not map-matched)   |
| Route alerts                        | Route Alerts                         | UIKit                             |
| Custom navigation camera            | Custom Navigation Camera             | Custom data source / transitions  |
| Electronic horizon / MPP            | Electronic Horizon Events            | Upcoming intersections            |
| Custom road objects (e-horizon)     | Custom Road Objects                  | User-defined objects              |
| Declarative map styling             | Declarative Map Styling              | Style DSL                         |
| Road cameras on map                 | Road Cameras                         | Display cameras + camera events   |

Upstream tree (optional deep dive only): [`Examples/`](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples). Topic list source: `AdditionalExamples/Constants.swift` `listOfExamples`.

## Decision guide

| Need                                               | Prefer                                             |
| -------------------------------------------------- | -------------------------------------------------- |
| Custom turn-by-turn UI (default)                   | Core + SwiftUI — CoreSDKExample                    |
| Drop-in full-screen navigation UI                  | UIKit — `NavigationViewController` (section below) |
| Specialized topic (cameras, history, e-horizon, …) | Match row in **Example patterns catalog** above    |

---

## Core + SwiftUI (default)

Keep a strong reference to `MapboxNavigationProvider`. Drive UI from Core publishers / `@Published` state (as in CoreSDKExample’s `Navigation` observable).

```swift
import Combine
import CoreLocation
import MapboxDirections
import MapboxNavigationCore
import SwiftUI

@MainActor
final class Navigation: ObservableObject {
    let predictiveCacheManager: PredictiveCacheManager?

    @Published private(set) var visualInstruction: VisualInstructionBanner?
    @Published private(set) var routeProgress: RouteProgress?
    @Published private(set) var currentPreviewRoutes: NavigationRoutes?
    @Published private(set) var isInActiveNavigation = false
    @Published var cameraState: NavigationCameraState = .idle

    private let core: MapboxNavigation
    private let voiceController: RouteVoiceController
    private var waypoints: [Waypoint] = []

    init() {
        let provider = MapboxNavigationProvider(
            coreConfig: CoreConfig(
                credentials: .init(),
                locationSource: .live
                // ttsConfig: .default — voice via provider.routeVoiceController
            )
        )
        core = provider.mapboxNavigation
        voiceController = provider.routeVoiceController
        predictiveCacheManager = provider.predictiveCacheManager
        observeNavigation()
    }

    private func observeNavigation() {
        core.navigation().bannerInstructions
            .map(\.visualInstruction)
            .assign(to: &$visualInstruction)

        core.navigation().routeProgress
            .map { $0?.routeProgress }
            .assign(to: &$routeProgress)

        core.tripSession().session
            .map {
                if case .activeGuidance = $0.state { return true }
                return false
            }
            .removeDuplicates()
            .assign(to: &$isInActiveNavigation)
    }

    func requestRoutes(to coordinate: CLLocationCoordinate2D) async throws {
        guard let location = core.navigation().currentLocationMatching?.enhancedLocation
        else { return }

        waypoints.append(Waypoint(coordinate: coordinate))
        var userWaypoint = Waypoint(location: location)
        if location.course >= 0 {
            userWaypoint.heading = location.course
            userWaypoint.headingAccuracy = 90
        }

        var optionsWaypoints = waypoints
        optionsWaypoints.insert(userWaypoint, at: 0)

        let options = NavigationRouteOptions(
            waypoints: optionsWaypoints,
            profileIdentifier: .automobileAvoidingTraffic
        )
        currentPreviewRoutes = try await core.routingProvider()
            .calculateRoutes(options: options)
            .value
        cameraState = .idle
    }

    func startActiveNavigation() {
        guard let previewRoutes = currentPreviewRoutes else { return }
        core.tripSession().startActiveGuidance(with: previewRoutes, startLegIndex: 0)
        cameraState = .following
        waypoints = []
    }

    func startFreeDrive() {
        core.tripSession().startFreeDrive()
    }

    func stopActiveNavigation() {
        core.tripSession().startFreeDrive()
        cameraState = .following
        currentPreviewRoutes = nil
    }
}
```

Wire SwiftUI with `@StateObject` / `@ObservedObject` and render from `visualInstruction` / `routeProgress` (see CoreSDKExample `Views/`).

### Session states

- **Free drive** — `tripSession().startFreeDrive()`
- **Active guidance** — start active guidance on the trip session after preview routes are ready
- **Idle** — `setToIdle()` when pausing a session

---

## UIKit drop-in UI (opt-in only)

Load this path only when the user asks for UIKit or a drop-in full-screen navigation experience. Sample: [UIKitExample](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/UIKitExample).

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

---

## Voice guidance

```swift
// Default: Mapbox Voice API with AVSpeechSynthesizer fallback
MapboxNavigationProvider(coreConfig: CoreConfig(ttsConfig: .default))

// Local-only / custom synthesizer
CoreConfig(ttsConfig: .localOnly)
CoreConfig(ttsConfig: .custom(MyCustomSpeechSynthesizer()))

var options = NavigationRouteOptions(coordinates: [origin, destination])
options.locale = Locale(identifier: "es-ES")
options.distanceMeasurementSystem = .metric
```

Retain `provider.routeVoiceController` (as CoreSDKExample does) so TTS stays alive.

## Anti-pattern: recomputing progress manually

Use SDK fields on `RouteProgress` / leg / step progress — do not walk `legs`/`steps` on every update.

```swift
// ❌ Avoid
let remaining = progress.route.legs
    .flatMap(\.steps)
    .dropFirst(progress.legIndex)
    .reduce(0.0) { $0 + $1.distance }

// ✅ Prefer
let remaining = progress.currentLegProgress?.currentStepProgress.distanceRemaining
// or progress.durationRemaining / progress.distanceRemaining
```

## Resources

- [Navigation SDK for iOS](https://docs.mapbox.com/ios/navigation/)
- [Examples](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples)
- [CoreSDKExample](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/CoreSDKExample)
- [UIKitExample](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/UIKitExample)
