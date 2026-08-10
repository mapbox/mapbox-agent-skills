# iOS: Navigation SDK Patterns (Core + SwiftUI)

**Default stack:** SwiftUI + `MapboxNavigationCore`. Do **not** use `MapboxNavigationUIKit` / `NavigationViewController` unless the user explicitly asks for UIKit or a drop-in navigation UI — then load [`ios-navigation-uikit.md`](ios-navigation-uikit.md).

**Canonical sample:** [CoreSDKExample](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/CoreSDKExample) (`Navigation.swift` + `Views/`).

## Before answering: validate upstream examples

Examples evolve (e.g. Road Cameras). **Before** answering any iOS Navigation question:

1. List the current tree under [`Examples/`](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples) (`CoreSDKExample`, `UIKitExample`, `CarPlayExample`, `AdditionalExamples`).
2. For topic samples, list [`AdditionalExamples/Examples/`](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/AdditionalExamples/Examples) and/or read [`Constants.swift`](https://github.com/mapbox/mapbox-navigation-ios/blob/main/Examples/AdditionalExamples/Constants.swift) `listOfExamples` (authoritative titles/descriptions).
3. Open the matching sample source and ground the answer in that code. Prefer live examples over skill snippets when they diverge.

Use `gh api repos/mapbox/mapbox-navigation-ios/contents/Examples?ref=main` (and nested paths) or equivalent.

## Decision guide

| Need                                                       | Prefer                                                          |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| Custom turn-by-turn UI (default)                           | Core + SwiftUI — CoreSDKExample                                 |
| Drop-in full-screen navigation UI                          | UIKit — load `ios-navigation-uikit.md`                          |
| CarPlay                                                    | `Examples/CarPlayExample`                                       |
| Road cameras, history, e-horizon, offline, styled UI, etc. | Match title in `listOfExamples` / `AdditionalExamples/Examples` |

## Core + SwiftUI pattern

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

Wire SwiftUI to `@StateObject` / `@ObservedObject` and render instructions from `visualInstruction` and distances from `routeProgress` (see CoreSDKExample `Views/`).

### Session states

- **Free drive** — `tripSession().startFreeDrive()`
- **Active guidance** — `startActiveGuidance(with:startLegIndex:)` after preview routes
- **Idle** — `setToIdle()` when pausing a session

### Voice guidance

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
- UIKit / drop-in UI → [`ios-navigation-uikit.md`](ios-navigation-uikit.md)
