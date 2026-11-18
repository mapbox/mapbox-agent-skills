# Navigation SDK v3 screens in SwiftUI

How to move a Navigation SDK v3 screen from UIKit to SwiftUI, using public APIs only. Load `maps.md` too for anything the screen does on the map outside navigation.

**What doesn't change:** `MapboxNavigationProvider`, `MapboxNavigation`, routing, the trip session, the Combine publishers, voice guidance. They are the same objects with the same calls. What changes is who owns them and how their output reaches the UI.

**What Navigation v3 provides for SwiftUI:** no SwiftUI views. `NavigationMapView` (in `MapboxNavigationCore`) and `NavigationViewController` (in `MapboxNavigationUIKit`) are UIKit. The public [Core SDK example](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/CoreSDKExample) is a SwiftUI app that follows the pattern on this page: an `ObservableObject` holds the navigation state, and the map is a `NavigationMapView` hosted in a `UIViewControllerRepresentable`.

**The SwiftUI `Map` is not a navigation map.** `NavigationMapView` draws the route line, maneuver arrows and route callouts, and runs the navigation camera. None of that has a public SwiftUI `Map` equivalent. Keep `NavigationMapView` and host it. Rebuilding a navigation screen on `Map` (your own route `LineLayer`, `Viewport.followPuck` for the camera) drops those features and is a redesign, not a migration. Only do it if the developer asks, and mark the result `[VERIFY WITH MAPBOX]`.

## Inventory search list

| Area       | Search for                                                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Setup      | `MapboxNavigationProvider`, `CoreConfig`, `mapboxNavigation`, `tripSession()`, `startFreeDrive`, `startActiveGuidance`                                |
| Map        | `NavigationMapView(`, `NavigationMapViewDelegate`, `navigationMapView.mapView`, `show(`, `showcase(`, `removeRoutes`, `update(navigationCameraState:` |
| Drop-in UI | `NavigationViewController(`, `NavigationOptions`, `NavigationViewControllerDelegate`, `present(navigationViewController`                              |
| Publishers | `routeProgress`, `bannerInstructions`, `locationMatching`, `session`, `navigationRoutes`, `routeRefreshing`, `.sink`, `.assign(to:`                   |
| Voice      | `routeVoiceController`, `RouteVoiceController`                                                                                                        |
| Cleanup    | `AnyCancellable` sets, `setToIdle()`, `deinit`                                                                                                        |

## State: a view model instead of a view controller

Move what the view controller owned into an `ObservableObject` (or an `@Observable` class, if the app targets iOS 17+ and already uses Observation). Republish the SDK's publishers as properties the SwiftUI views read.

```swift
@MainActor
final class Navigation: ObservableObject {
    @Published private(set) var routeProgress: RouteProgress?
    @Published private(set) var visualInstruction: VisualInstructionBanner?
    @Published private(set) var currentLocation: CLLocation?
    @Published var cameraState: NavigationCameraState = .idle

    let predictiveCacheManager: PredictiveCacheManager?
    private let core: MapboxNavigation

    init() {
        let provider = MapboxNavigationProvider(coreConfig: CoreConfig(locationSource: .live)) // the app's existing config
        core = provider.mapboxNavigation
        predictiveCacheManager = provider.predictiveCacheManager

        core.navigation().routeProgress.map { $0?.routeProgress }.assign(to: &$routeProgress)
        core.navigation().bannerInstructions.map { $0.visualInstruction }.assign(to: &$visualInstruction)
        core.navigation().locationMatching.map { $0.enhancedLocation }.assign(to: &$currentLocation)
    }

    var routeRefreshing: AnyPublisher<RefreshingStatus, Never> { core.navigation().routeRefreshing }
}
```

| UIKit                                                                       | SwiftUI target                                                                                                        | Notes                                                                                                                      |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `MapboxNavigationProvider` created in a view controller or app delegate     | Unchanged owner if it's app-wide. Otherwise the view model, created **once** (owned by the `App`, or `@StateObject`). | Only one `MapboxNavigationProvider` may exist at a time. Never create it in `body` or in an `@ObservedObject` initializer. |
| `.sink { [weak self] in self?.label.text = ... }.store(in: &subscriptions)` | `.assign(to: &$property)` on the view model, read by the view                                                         | `assign(to:)` on a `@Published` ends with the object, so no stored `AnyCancellable`                                        |
| `startFreeDrive()` in `viewDidLoad`                                         | The view model, called from `.task` or `.onAppear` on the screen                                                      | Guard against running twice when the view reappears                                                                        |
| Cleanup in `deinit` (`setToIdle()`, cancel subscriptions)                   | The view model's lifetime, or `.onDisappear` if the session must end with the screen                                  | Match when the UIKit screen ended the session                                                                              |

## The map: host `NavigationMapView`

```swift
struct NavigationMap: UIViewControllerRepresentable {
    let navigation: Navigation

    func makeUIViewController(context: Context) -> UIViewController {
        NavigationMapViewController(navigation: navigation) // the existing view controller, trimmed to the map
    }

    func updateUIViewController(_ controller: UIViewController, context: Context) {}
}
```

The hosted view controller keeps what it did before on the map: it creates `NavigationMapView(location:routeProgress:routeRefreshing:predictiveCacheManager:)` from the view model's publishers, loads the screen's style, sets `viewportPadding`, subscribes to route and camera state, and acts as `NavigationMapViewDelegate`. Labels, buttons and banners move out to SwiftUI.

| UIKit                                                                           | SwiftUI target                                                                                                       | Notes                                                                                            |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `NavigationMapView` as the view controller's `view`                             | Same, inside the hosted view controller (or a `UIViewRepresentable` returning `NavigationMapView`)                   | **Create it once**, in `makeUIViewController` / `makeUIView`. Never in `updateUIViewController`. |
| `navigationMapView.mapView.mapboxMap.loadStyle(...)`                            | Unchanged, in the hosted controller                                                                                  | Keep the same style                                                                              |
| `navigationMapView.update(navigationCameraState: .following)`                   | Set `navigation.cameraState` from SwiftUI; the hosted controller observes `$cameraState` and calls `update(...)`     | One owner for the camera: `NavigationMapView`                                                    |
| `navigationMapView.show(routes)` / `showcase(previewRoutes)` / `removeRoutes()` | Unchanged, in the hosted controller, driven by the view model's published routes                                     |                                                                                                  |
| `NavigationMapViewDelegate` (`didSelect alternativeRoute`, `userDidLongTap`)    | Unchanged on the hosted controller, forwarding to the view model                                                     |                                                                                                  |
| `viewportPadding` computed from overlaid views                                  | Fixed values, or passed in from SwiftUI layout through `updateUIViewController`                                      | Compare camera framing with screenshots                                                          |
| Style switching (day and night)                                                 | Unchanged. `NavigationMapView` re-adds its route layers on style reload. `[VERIFY WITH MAPBOX]` on the app's version |                                                                                                  |

## UI: rebuild in SwiftUI, or host the UIKit component

Instruction banners, trip progress, speed limit, recenter and overview buttons are views over published data. In SwiftUI, either:

- **Rebuild** them as SwiftUI views reading the view model (`visualInstruction`, `routeProgress`, `cameraState`), as the Core SDK example does. This changes how they look. It's a design decision, so ask.
- **Host** the existing UIKit views in `UIViewRepresentable` to keep the look identical. Default to this when the developer hasn't decided.

| UIKit                                                                  | SwiftUI target                                                                                                               |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| App-built instruction and progress views updated in `.sink`            | SwiftUI views over `@Published` properties, or the same `UIView` in `UIViewRepresentable` with `updateUIView` applying state |
| Recenter and overview buttons calling `update(navigationCameraState:)` | SwiftUI buttons setting `navigation.cameraState`                                                                             |
| Alerts (`UIAlertController`) for routing errors                        | `.alert(...)` driven by view model state                                                                                     |

Stack the map and overlays in a `ZStack` (map first), matching the old layout's positions.

## `NavigationViewController` (ready-made UI)

`NavigationViewController` is the SDK's full turn-by-turn UI. It stays UIKit.

| UIKit                                                                                    | SwiftUI target                                                                                                  | Notes                                                                          |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `present(NavigationViewController(navigationRoutes:navigationOptions:), animated:)`      | A `UIViewControllerRepresentable` returning it, shown with `.fullScreenCover`                                   | `[VERIFY WITH MAPBOX]`: presentation from SwiftUI isn't in the public examples |
| `NavigationViewControllerDelegate` (`didArriveAt`, `navigationViewControllerDidDismiss`) | The representable's `Coordinator` as delegate, forwarding to the view model, which clears the presentation flag | Dismiss through SwiftUI state, not `dismiss(animated:)` alone                  |
| Customization through `NavigationOptions` (styles, `NavigationMapView`)                  | Unchanged, passed when the representable creates the controller                                                 |                                                                                |

Keeping the flow that presents `NavigationViewController` in UIKit, while other screens move to SwiftUI, is a valid end state.

## Behavior changes

| Change                           | UIKit screen                                          | SwiftUI default                                                                                             | Preserve the UIKit behavior                                                                          |
| -------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Navigation objects recreated     | Owned by a view controller that lived for the session | A view model created in `body`, or an `@ObservedObject` created by the parent on every update, is recreated | Own it in the `App` or with `@StateObject`. One `MapboxNavigationProvider` for the app.              |
| Map recreated                    | `NavigationMapView` lived with the view controller    | Recreated when the representable leaves the hierarchy or its identity changes                               | Keep the representable in place for the whole session. Don't put it in a branch that toggles.        |
| Camera owner                     | `NavigationMapView` only                              | Nothing else, unless the screen also adds a SwiftUI `Map` or `Viewport`                                     | Let `NavigationMapView` own the camera. Don't add a second map or viewport on the navigation screen. |
| UI components rebuilt in SwiftUI | UIKit views with their styling                        | Whatever the SwiftUI rebuild draws                                                                          | Host the UIKit views. Rebuild only when the developer decides to.                                    |
| Safe area and padding            | `viewportPadding` from the UIKit layout               | SwiftUI overlays and safe-area insets                                                                       | Recompute `viewportPadding` so the puck sits in the same place. Check with screenshots.              |
