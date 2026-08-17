# iOS: Navigation SDK Patterns

App UI framework (SwiftUI vs UIKit) and navigation experience (drop-in vs fully custom Core) are **independent**.

**Default (matches official getting-started docs):** SwiftUI app shell + wrap drop-in `NavigationViewController` with `UIViewControllerRepresentable`. Do **not** build a fully custom Core UI unless the user explicitly wants that.

**Canonical getting-started:** [Add turn-by-turn navigation](https://docs.mapbox.com/ios/navigation/guides/get-started/) + [UIKitExample](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/UIKitExample) / AdditionalExamples → Basic.

**Fully custom Core UI (opt-in):** [CoreSDKExample](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/CoreSDKExample) — only when the user asks to customize the entire nav UI / avoid `NavigationViewController`.

## Sample host vs API stack

`AdditionalExamples` are UIKit _demo hosts_. A `UIViewController` sample does **not** mean the API is UIKit-only.

- **`NavigationMapView` APIs are stack-independent.** Wrap `NavigationMapView` in `UIViewRepresentable` and configure the same entities (route line, camera, waypoint / final-waypoint image, route callouts).
- **`MapboxMap` APIs** (road cameras, declarative style) attach to any map: SwiftUI `MapReader` (`proxy.map`) or `navigationMapView.mapView.mapboxMap`.
- **True drop-in / UIKit chrome:** `NavigationViewController` top/bottom bars, styled NVC UI elements, embedding NVC. Those stay on the drop-in path.

```swift
struct NavigationMapViewWrapper: UIViewRepresentable {
    func makeUIView(context: Context) -> NavigationMapView {
        NavigationMapView(frame: .zero)
    }

    func updateUIView(_ view: NavigationMapView, context: Context) {
        // Configure NMV APIs here: waypoint images, route-line delegate, camera, callouts, …
        view.delegate = context.coordinator
    }
}
```

## Example patterns catalog

Self-contained like Maps/Search skills. Use the catalog to pick a pattern. **Do not** fetch upstream example source unless the user explicitly asks to open a specific sample file.

**NMV API** / **MapboxMap** rows are stack-independent even when the sample is a UIKit host. **NVC chrome** rows are drop-in UIKit UI.

| Topic                                  | Example                              | Stack / notes                                                      |
| -------------------------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| Drop-in nav in a SwiftUI app (default) | Docs getting-started + Basic         | Wrap `NavigationViewController` in `UIViewControllerRepresentable` |
| Minimal drop-in navigation             | `AdditionalExamples` → Basic         | Drop-in NVC (sample is a UIKit host)                               |
| Full UIKit app shell                   | `UIKitExample`                       | UIKit app shell                                                    |
| Fully custom Core nav UI               | `CoreSDKExample`                     | Core publishers — opt-in only                                      |
| CarPlay                                | `CarPlayExample`                     | CarPlay                                                            |
| Advanced / alt routes + style          | Advanced Implementation              | NMV API (reuse map preview → active)                               |
| Multi-stop route                       | Multiple Waypoints                   | Core waypoints; **inline section below**                           |
| Custom route line styling              | Custom Route Lines Styling           | NMV API; **inline section below**                                  |
| Custom navigation camera               | Custom Navigation Camera             | NMV API; **inline section below**                                  |
| Road cameras on map                    | Road Cameras                         | MapboxMap / `MapReader`; **inline section below**                  |
| Route alerts                           | Route Alerts                         | Core `RouteProgress` (+ optional NVC `topBanner`); **inline**      |
| Custom final waypoint image            | Custom Final Waypoint                | NMV API — wrap `NavigationMapView` in SwiftUI                      |
| Custom route callouts                  | Custom Route Callouts                | NMV API — wrap `NavigationMapView` in SwiftUI                      |
| Embed `NavigationViewController`       | Embedded View Controller             | NVC chrome                                                         |
| Styled UI + map style                  | Styled UI Elements                   | NVC chrome                                                         |
| Directions beta query params           | Directions API beta query parameters | Core — subclass `NavigationRouteOptions`                           |
| Custom waypoint styling                | Custom Waypoint Styling              | NMV API — wrap `NavigationMapView` in SwiftUI                      |
| Custom voice / audio                   | Custom Voice Controller              | Core TTS                                                           |
| Custom top/bottom bars                 | Custom Top & Bottom Bars             | NVC chrome                                                         |
| Offline TileStore / regions            | Offline Regions                      | Core / TileStore                                                   |
| Record trip history                    | History Recording                    | Core                                                               |
| Replay trip history                    | History Replaying                    | Core (history files, not map-matched)                              |
| Electronic horizon / MPP               | Electronic Horizon Events            | Core                                                               |
| Custom road objects (e-horizon)        | Custom Road Objects                  | Core                                                               |
| Declarative map styling                | Declarative Map Styling              | MapboxMap / Style DSL                                              |

Upstream tree (optional deep dive only): [`Examples/`](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples). Topic list source: `AdditionalExamples/Constants.swift` `listOfExamples`.

## Decision guide

| Need                                                                        | Prefer                                                                        |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Add turn-by-turn to a SwiftUI app (default)                                 | Wrap `NavigationViewController` in `UIViewControllerRepresentable`            |
| UIKit app + drop-in nav                                                     | Present `NavigationViewController` directly                                   |
| Fully custom nav chrome / no drop-in UI                                     | CoreSDKExample-style Core + publishers (opt-in)                               |
| `NavigationMapView` customization (waypoints, route line, camera, callouts) | Wrap `NavigationMapView` in SwiftUI `UIViewRepresentable` — stack-independent |
| Specialized topic with an inline section below                              | Multi-stop, route line, camera, road cameras, route alerts                    |
| Other specialized topics                                                    | Match row in **Example patterns catalog** (catalog-only)                      |

---

## Before you code (iOS setup)

Greenfield apps need install prerequisites before the snippets below will run. See [Get started](https://docs.mapbox.com/ios/navigation/guides/install/) and **mapbox-token-security**.

Checklist:

1. **SPM** — `https://github.com/mapbox/mapbox-navigation-ios.git`; add both `MapboxNavigationCore` and `MapboxNavigationUIKit`
2. **Secret download token** — `Downloads:Read` scope in `~/.netrc` (SPM auth only; never ship in the app)
3. **Public token** — `MBXAccessToken` in `Info.plist` (`pk.*`)
4. **Location** — `NSLocationWhenInUseUsageDescription` (and precise-location temporary usage dictionary when needed)
5. **Background modes** — `audio` and `location` in `UIBackgroundModes`

The snippets below are NavSDK-focused patterns (like Android’s reference): not full screens — omit permissions, full error UI, and app architecture.

---

## Default: SwiftUI + drop-in `NavigationViewController`

Keep a strong reference to `MapboxNavigationProvider`. Calculate routes with Core, then present the drop-in UI from SwiftUI via a representable.

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

@MainActor
final class NavigationSession: ObservableObject {
    let provider = MapboxNavigationProvider(
        coreConfig: CoreConfig(locationSource: .live, ttsConfig: .default)
    )
    @Published var navigationRoutes: NavigationRoutes?

    func requestRoutes(from origin: CLLocationCoordinate2D, to destination: CLLocationCoordinate2D) async throws {
        let options = NavigationRouteOptions(coordinates: [origin, destination])
        navigationRoutes = try await provider.mapboxNavigation
            .routingProvider()
            .calculateRoutes(options: options)
            .value
    }

    var navigationOptions: NavigationOptions {
        NavigationOptions(
            mapboxNavigation: provider.mapboxNavigation,
            voiceController: provider.routeVoiceController,
            eventsManager: provider.eventsManager(),
            predictiveCacheManager: provider.predictiveCacheManager
        )
    }
}

// In a SwiftUI view, after routes are ready:
// NavigationViewControllerWrapper(
//     navigationRoutes: routes,
//     navigationOptions: session.navigationOptions
// )
// .ignoresSafeArea()
```

---

## UIKit app: present drop-in UI directly

```swift
import MapboxNavigationCore
import MapboxNavigationUIKit
import CoreLocation

class NavigationManager: UIViewController {
    private let mapboxNavigationProvider: MapboxNavigationProvider
    private var navigationViewController: NavigationViewController?

    override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
        self.mapboxNavigationProvider = MapboxNavigationProvider(
            coreConfig: CoreConfig(locationSource: .live, ttsConfig: .default)
        )
        super.init(nibName: nibNameOrNil, bundle: nibBundleOrNil)
    }

    required init?(coder: NSCoder) {
        self.mapboxNavigationProvider = MapboxNavigationProvider(coreConfig: CoreConfig())
        super.init(coder: coder)
    }

    func startNavigation() {
        let origin = CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194)
        let destination = CLLocationCoordinate2D(latitude: 37.8044, longitude: -122.2711)

        Task {
            do {
                let routeOptions = NavigationRouteOptions(coordinates: [origin, destination])
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

## Opt-in: fully custom Core UI (CoreSDKExample)

Use only when the user explicitly wants a custom navigation UI (no drop-in `NavigationViewController`). Drive chrome from Core publishers / `@Published` state.

```swift
import Combine
import MapboxNavigationCore
import SwiftUI

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

    func requestRoutes(waypoints: [Waypoint]) async throws {
        let options = NavigationRouteOptions(
            waypoints: waypoints,
            profileIdentifier: .automobileAvoidingTraffic
        )
        currentPreviewRoutes = try await core.routingProvider()
            .calculateRoutes(options: options)
            .value
    }

    func startActiveNavigation() {
        guard let routes = currentPreviewRoutes else { return }
        core.tripSession().startActiveGuidance(with: routes, startLegIndex: 0)
    }
}
```

Session states: free drive → `startFreeDrive()`; active guidance → start active guidance on the trip session after preview routes; idle → `setToIdle()`.

---

## Multi-stop waypoints

Append intermediate `Waypoint`s (user first), then `NavigationRouteOptions(waypoints:)`. Catalog: Multiple Waypoints.

```swift
var waypoints: [Waypoint] = []

func requestRoute(to mapPoint: MapPoint, userLocation: CLLocation) async throws -> NavigationRoutes {
    waypoints.append(Waypoint(coordinate: mapPoint.coordinate, name: mapPoint.name))
    var requestWaypoints = waypoints
    requestWaypoints.insert(Waypoint(location: userLocation), at: 0)

    let options = NavigationRouteOptions(waypoints: requestWaypoints)
    return try await mapboxNavigation.routingProvider()
        .calculateRoutes(options: options)
        .value
}

// Preview, then drop-in UI as usual:
// navigationMapView.showcase(navigationRoutes)
// present(NavigationViewController(navigationRoutes:navigationOptions:))
```

On arrival during drop-in UI, implement `NavigationViewControllerDelegate.navigationViewController(_:didArriveAt:)`.

## Route line styling

`NavigationMapView` API — stack-independent (wrap `NavigationMapView` in a SwiftUI `UIViewRepresentable`). Customize preview and active-guidance route lines via `NavigationMapViewDelegate` / `NavigationViewControllerDelegate` layer factories. Catalog: Custom Route Lines Styling. Use `identifier` (`main` vs `alternative_N`, `.casing`) to pick colors.

```swift
func navigationMapView(
    _ navigationMapView: NavigationMapView,
    routeLineLayerWithIdentifier identifier: String,
    sourceIdentifier: String
) -> LineLayer? {
    var layer = LineLayer(id: identifier, source: sourceIdentifier)
    let isMain = identifier.contains("main")
    layer.lineColor = .constant(.init(isMain ? UIColor.systemGreen : UIColor.systemGray))
    layer.lineWidth = .expression(
        Exp(.interpolate) {
            Exp(.linear)
            Exp(.zoom)
            RouteLineWidthByZoomLevel.multiplied(by: 1)
        }
    )
    layer.lineJoin = .constant(.round)
    layer.lineCap = .constant(.round)
    return layer
}

func navigationMapView(
    _ navigationMapView: NavigationMapView,
    routeCasingLineLayerWithIdentifier identifier: String,
    sourceIdentifier: String
) -> LineLayer? {
    // Same pattern; typically a darker casing with a slightly larger width multiplier.
    var layer = LineLayer(id: identifier, source: sourceIdentifier)
    layer.lineColor = .constant(.init(UIColor.darkGray))
    layer.lineWidth = .expression(
        Exp(.interpolate) {
            Exp(.linear)
            Exp(.zoom)
            RouteLineWidthByZoomLevel.multiplied(by: 1.2)
        }
    )
    return layer
}

// Mirror the same two methods on NavigationViewControllerDelegate for active guidance.
// Optional: navigationView.navigationMapView.traversedRouteColor = .lightGray
```

## Navigation camera

`NavigationMapView` API — stack-independent (wrap `NavigationMapView` in a SwiftUI `UIViewRepresentable`). Default camera works via `NavigationMapView` + `update(navigationCameraState:)` (see CoreSDKExample). To customize framing/transitions, replace `viewportDataSource` and/or `cameraStateTransition`. Catalog: Custom Navigation Camera.

```swift
let navigationCamera = navigationMapView.navigationCamera
navigationCamera.viewportDataSource = CustomViewportDataSource(navigationMapView.mapView)
navigationCamera.cameraStateTransition = CustomCameraStateTransition(navigationMapView.mapView)

// Core / SwiftUI-driven state (CoreSDKExample):
// navigationMapView.update(navigationCameraState: .following) // or .idle, overview, etc.

// When handing the same map into drop-in UI:
let navigationOptions = NavigationOptions(
    mapboxNavigation: mapboxNavigation,
    voiceController: provider.routeVoiceController,
    eventsManager: provider.eventsManager(),
    navigationMapView: navigationMapView // reuse preview map + custom camera
)
```

Implement `ViewportDataSource` / `CameraStateTransition` (see example `NavigationCamera/` helpers) — do not only call follow/overview without feeding the data source.

## Road cameras

Stack-independent: attach `RoadCamerasManager` + `RoadCamerasMapController` to any `MapboxMap`. The AdditionalExamples sample hosts this in UIKit, but that chrome is not required. In SwiftUI, take the map with `MapReader` (`proxy.map`). Catalog: Road Cameras. Uses experimental SPI / `MapboxNavigationCppRoadCameras`.

```swift
import Combine
import MapboxMaps
@_spi(ExperimentalMapboxAPI) import MapboxDirections
@_spi(MapboxInternal) import MapboxNavigationCore
@_spi(ExperimentalMapboxAPI) import MapboxNavigationCppRoadCameras

var options = NavigationRouteOptions(coordinates: [origin, destination])
options.attributeOptions.insert(.roadCamera)

let routes = try await mapboxNavigation.routingProvider()
    .calculateRoutes(options: options)
    .value

// Any MapboxMap — SwiftUI MapReader, drop-in NVC, or Core NavigationMapView
MapReader { proxy in
    Map()
        .onAppear {
            guard let mapboxMap = proxy.map else { return }
            setupRoadCameras(on: mapboxMap, provider: provider)
        }
}

func setupRoadCameras(on mapboxMap: MapboxMap, provider: MapboxNavigationProvider) {
    let manager = RoadCamerasManager(navigatorHandle: provider.navigatorHandle)
    let mapController = RoadCamerasMapController(
        map: mapboxMap,
        manager: manager,
        config: RoadCamerasConfig(
            displayConfig: RoadCamerasDisplayConfig(startShowDistance: 1000),
            iconProvider: nil // or custom RoadCamerasIconProvider
        )
    )
    // Keep strong references to manager + mapController

    manager.camerasAppearing.sink { /* upcoming cameras */ }.store(in: &subscriptions)
    manager.camerasPassed.sink { _ in /* passed */ }.store(in: &subscriptions)
    mapController.cameraClicked.sink { camera in /* camera.id */ }.store(in: &subscriptions)
}

// UIKit / drop-in equivalent:
// let mapboxMap = navVC.navigationMapView?.mapView.mapboxMap
```

## Route alerts

Core `RouteProgress.upcomingRouteAlerts` is stack-independent. Optional custom top banner via `NavigationOptions.topBanner` is NVC chrome. Catalog: Route Alerts.

```swift
// Custom ContainerViewController as topBanner:
navigation.routeProgress
    .sink { status in
        guard let progress = status?.routeProgress else { return }
        let alerts = progress.upcomingRouteAlerts.compactMap { alert -> String? in
            let distance = Int64(alert.distanceToStart)
            guard distance > 0, distance < 500 else { return nil }
            // Use alert.roadObject.kind for a user-facing label
            return "Alert in \(distance) m"
        }
        // Update banner primary label with alerts, or fall back to visual instruction
    }
    .store(in: &subscriptions)

let navigationOptions = NavigationOptions(
    mapboxNavigation: mapboxNavigation,
    voiceController: provider.routeVoiceController,
    eventsManager: provider.eventsManager(),
    topBanner: TopAlertsBarViewController(navigationProvider: provider)
)
```

---

## Voice guidance

```swift
MapboxNavigationProvider(coreConfig: CoreConfig(ttsConfig: .default))
CoreConfig(ttsConfig: .localOnly)
CoreConfig(ttsConfig: .custom(MyCustomSpeechSynthesizer()))

var options = NavigationRouteOptions(coordinates: [origin, destination])
options.locale = Locale(identifier: "es-ES")
options.distanceMeasurementSystem = .metric
```

Retain `provider.routeVoiceController` so TTS stays alive.

## Anti-pattern: recomputing progress manually

Use SDK fields on `RouteProgress` / leg / step progress — do not walk `legs`/`steps` on every update.

```swift
// ❌ Avoid — walks legs/steps and misses partial progress in the current step
let remaining = progress.route.legs
    .flatMap(\.steps)
    .dropFirst(progress.legIndex)
    .reduce(0.0) { $0 + $1.distance }

// ✅ Prefer — total distance remaining on the route (use step/leg fields only when that scope is intentional)
let remaining = progress.distanceRemaining
// Distance to next maneuver: progress.currentLegProgress?.currentStepProgress.distanceRemaining
```

## Resources

- [Navigation SDK for iOS](https://docs.mapbox.com/ios/navigation/)
- [Get started](https://docs.mapbox.com/ios/navigation/guides/get-started/)
- [Examples](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples)
- [UIKitExample](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/UIKitExample)
- [CoreSDKExample](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/CoreSDKExample) (custom UI opt-in)
