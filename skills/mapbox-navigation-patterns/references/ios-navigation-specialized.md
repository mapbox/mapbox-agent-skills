# iOS: Specialized Navigation Patterns

Load this file for multi-stop routing, route-line styling, navigation camera, road cameras, and route alerts.

`NavigationMapView` APIs here are stack-independent — wrap `NavigationMapView` in `UIViewRepresentable`. Defaults, catalog, and the sample-host vs API-stack rule live in [`ios-navigation-sdk.md`](ios-navigation-sdk.md).

Snippets are NavSDK-focused (like Android’s reference): not full screens — omit permissions, full error UI, and app architecture.

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

`NavigationMapView` API — stack-independent (wrap `NavigationMapView` in a SwiftUI `UIViewRepresentable`). Take `mapboxMap` from the map view; give `RoadCamerasManager` Core dependencies via `provider.navigatorHandle`. Catalog: Road Cameras. Uses experimental SPI / `MapboxNavigationCppRoadCameras`.

```swift
import Combine
@_spi(ExperimentalMapboxAPI) import MapboxDirections
@_spi(MapboxInternal) import MapboxNavigationCore
@_spi(ExperimentalMapboxAPI) import MapboxNavigationCppRoadCameras

var options = NavigationRouteOptions(coordinates: [origin, destination])
options.attributeOptions.insert(.roadCamera)

func setupRoadCameras(on navigationMapView: NavigationMapView, provider: MapboxNavigationProvider) {
    let mapboxMap = navigationMapView.mapView.mapboxMap

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

// Drop-in NVC is the same NMV path:
// setupRoadCameras(on: navVC.navigationMapView!, provider: provider)
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
