# Maps SDK v11: UIKit → SwiftUI

Mappings from UIKit map code to the SwiftUI API in `MapboxMaps`. "Since" is the Maps SDK version. **Experimental** entries need `@_spi(Experimental) import MapboxMaps` (SKILL.md Rule 2).

`Map` is a `UIViewControllerRepresentable` built on the same `MapView`, so rendering, tiles, styles and the token setup don't change. What changes is how the screen declares content, moves the camera and receives events.

## Inventory search list

Search the screen's Swift, storyboard and XIB files for:

| Area                | Search for                                                                                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Map view            | `MapView(frame:`, `MapInitOptions(`, `customClass="MapView"` in storyboards, `UIViewRepresentable` wrapping `MapView`, `MBXAccessToken`                                          |
| Style               | `mapStyle =`, `loadStyle(`, `styleURI`, `addSource(`, `addLayer(`, `setMapStyleContent`, `setStyleImportConfigProperty`, `addImage(`                                             |
| Camera and viewport | `setCamera(to:`, `camera.fly(`, `camera.ease(`, `camera(for:`, `viewport.transition(`, `makeFollowPuckViewportState`, `makeOverviewViewportState`                                |
| Events              | `onMapLoaded`, `onStyleLoaded`, `onCameraChanged`, `onMapIdle`, `onSourceDataLoaded`, `observeNext`, `observe {`                                                                 |
| Gestures            | `gestures.options`, `gestures.onMapTap`, `onMapLongPress`, `onLayerTap`, `GestureManagerDelegate`                                                                                |
| Interactions        | `addInteraction(`, `TapInteraction`, `LongPressInteraction`, `setFeatureState`, `queryRenderedFeatures`                                                                          |
| Annotations         | `makePointAnnotationManager`, `makeCircleAnnotationManager`, `makePolylineAnnotationManager`, `makePolygonAnnotationManager`, `tapHandler`, `isDraggable`, `viewAnnotations.add` |
| Location            | `location.options`, `puckType`, `location.override(`, `onLocationChange`, `onPuckRender`                                                                                         |
| Ornaments           | `ornaments.options`, `compassView`, `scaleBarView`, `logoView`, `attributionButton`                                                                                              |
| Other               | `Snapshotter`, `OfflineManager`, `TileStore`, `CustomLayer`, `debugOptions`, `preferredFramesPerSecond`                                                                          |

## Map view

```swift
import SwiftUI
import MapboxMaps

struct StoreMapView: View {
    var body: some View {
        Map(initialViewport: .camera(center: CLLocationCoordinate2D(latitude: 37.77, longitude: -122.42), zoom: 12)) {
            // map content: annotations, sources, layers, Puck2D, TapInteraction
        }
        .mapStyle(MapStyle(uri: StyleURI(rawValue: "mapbox://styles/acme/store-style")!)) // the screen's existing style
        .ignoresSafeArea()
    }
}
```

| UIKit                                                          | SwiftUI target                                                                            | Notes                                                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `MapView(frame:mapInitOptions:)` added in `viewDidLoad`        | `Map(initialViewport:content:)` or `Map(viewport:content:)`                               | `Map` owns the `MapView`. Don't also create one.                                                   |
| `UIViewRepresentable` wrapping `MapView` in a SwiftUI app      | `Map`                                                                                     | Delete the wrapper and its coordinator once nothing else uses it                                   |
| Storyboard or XIB scene with a `MapView`                       | A SwiftUI view with `Map`, presented via `UIHostingController` if the flow is still UIKit | Remove the scene and outlet once nothing references them                                           |
| `MBXAccessToken` in Info.plist, or `MapboxOptions.accessToken` | Unchanged                                                                                 | Set the token before the first `Map` is created                                                    |
| `mapView.preferredFramesPerSecond`                             | `.frameRate(range:preferred:)`                                                            |                                                                                                    |
| `mapView.debugOptions`                                         | `.debugOptions(...)`                                                                      |                                                                                                    |
| `MapInitOptions(cameraOptions:)` bounds, `setCameraBounds`     | `.cameraBounds(CameraBoundsOptions(...))`                                                 |                                                                                                    |
| Content insets for overlaid UI (`viewport.options` padding)    | `.additionalSafeAreaInsets(...)`, `.usesSafeAreaInsetsAsPadding(...)`                     | Viewport padding follows the safe area in SwiftUI. Compare camera framing in the after screenshot. |

**Name clash with MapKit:** if a file imports both `MapKit` and `MapboxMaps`, `Map` is ambiguous. Write `MapboxMaps.Map`, or drop the `MapKit` import from that file.

There are no lifecycle calls to remove on iOS. Delegates and stored subscriptions move to modifiers and map content instead (see Events).

## Style

| UIKit                                                                                                                   | SwiftUI target                                                                                  | Notes                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MapInitOptions(styleURI:)`, `mapboxMap.mapStyle = .streets`, `loadStyle(...)`                                          | `.mapStyle(.streets)` or `.mapStyle(MapStyle(uri: StyleURI(rawValue: "mapbox://styles/...")!))` | `StyleURI(rawValue:)` for `mapbox://`, `StyleURI(url:)` for `https://`                                                                             |
| No style set (v11 loads Standard)                                                                                       | Leave `.mapStyle` off, or `.mapStyle(.standard)`                                                |                                                                                                                                                    |
| Standard config (`setStyleImportConfigProperty(for: "basemap", config: "lightPreset", ...)`, `.standard(lightPreset:)`) | `.mapStyle(.standard(lightPreset: .night, showPointOfInterestLabels: false))`                   | Same options as the UIKit `MapStyle`. Drive the preset from state (for example `colorScheme`) if the UIKit screen did.                             |
| Switching styles at runtime                                                                                             | Change the `MapStyle` passed to `.mapStyle(...)` from state                                     | Still a full style reload. Map content is re-added automatically; layers added through `proxy.map` are not.                                        |
| `addSource` + `addLayer` in `onStyleLoaded`                                                                             | `GeoJSONSource(id:).data(...)` and `LineLayer(id:source:)` etc. as map content                  | Declarative style content since 11.4. Keep the **same source and layer IDs** if other code, interactions or `queryRenderedFeatures` refer to them. |
| `mapboxMap.setMapStyleContent { ... }` (UIKit declarative styling)                                                      | Move the same content into `Map { ... }`                                                        | The `MapStyleContent` types are shared                                                                                                             |
| `layerPosition: .above("id")`, slots                                                                                    | `.position(.above("id"))` on the layer, or `.slot(.middle)`                                     | `[VERIFY WITH MAPBOX]` the modifier name on the app's version if it predates 11.6                                                                  |
| `addImage(image, id:)`                                                                                                  | `StyleImage(id:image:)` as map content                                                          |                                                                                                                                                    |
| Updating GeoJSON with `updateGeoJSONSource(withId:geoJSON:)`                                                            | Change the data the `GeoJSONSource` content reads from                                          | Keep the data in a model, not rebuilt in `body` on every update                                                                                    |
| Custom layers, style APIs with no content type                                                                          | `MapReader` + `.onStyleLoaded { _ in proxy.map?... }`                                           | Re-run on every style load                                                                                                                         |

Declare each layer either as map content or through `proxy.map`, not both.

## Camera and viewport

`Viewport` describes what the camera should do. Pass it once with `initialViewport`, or bind it with `Map(viewport: $viewport)` when other UI moves the camera. When the user pans, a bound viewport becomes `.idle`.

| UIKit                                                                             | SwiftUI target                                                                        | Notes                                                                                                                                                         |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MapInitOptions(cameraOptions:)`, `setCamera(to:)` in `viewDidLoad`               | `Map(initialViewport: .camera(center:zoom:bearing:pitch:))`                           | Applied once, when the map is created                                                                                                                         |
| `mapboxMap.setCamera(to:)` from a button or model                                 | `@State var viewport: Viewport`; `viewport = .camera(...)`                            |                                                                                                                                                               |
| `mapView.camera.fly(to:duration:)` / `ease(to:duration:)`                         | `withViewportAnimation(.fly) { viewport = .camera(...) }` / `.easeInOut(duration:)`   | Also `.default(maxDuration:)`, `.linear`, `.easeIn`, `.easeOut`                                                                                               |
| `viewport.transition(to: viewport.makeFollowPuckViewportState(options:))`         | `viewport = .followPuck(zoom:bearing:pitch:)`                                         | Animate with `withViewportAnimation(.default(maxDuration: 1))`. Other animations can jump at the end. The puck still needs adding.                            |
| `makeOverviewViewportState(options: .init(geometry:))`, `camera(for:padding:...)` | `viewport = .overview(geometry:bearing:pitch:geometryPadding:maxZoom:offset:)`        |                                                                                                                                                               |
| `viewport.idle()`                                                                 | `viewport = .idle`                                                                    |                                                                                                                                                               |
| Reading `mapboxMap.cameraState`                                                   | `.onCameraChanged { event in ... }`, or `proxy.map?.cameraState`                      | A `Viewport` can't be read back as a camera. Don't store every camera change in `@State`: it re-runs `body` at frame rate. Keep it in a model or throttle it. |
| `viewport.addStatusObserver`                                                      | `[VERIFY WITH MAPBOX]`: use `proxy.viewport?.addStatusObserver(...)` from `MapReader` |                                                                                                                                                               |
| Custom camera animations (`camera.makeAnimator`)                                  | `proxy.camera?.makeAnimator(...)` from `MapReader`                                    | The SDK's SwiftUI guide lists custom camera animations as not yet exposed                                                                                     |

## Events

Each `mapboxMap.on...` signal has a `Map` modifier. SwiftUI owns the subscription, so the stored `Cancelable`s go away.

| UIKit                                                                    | SwiftUI target                                                              |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `mapboxMap.onMapLoaded.observeNext { }.store(in: &cancelables)`          | `.onMapLoaded { _ in }`                                                     |
| `onStyleLoaded`, `onStyleDataLoaded`, `onMapLoadingError`                | `.onStyleLoaded { }`, `.onStyleDataLoaded { }`, `.onMapLoadingError { }`    |
| `onCameraChanged`, `onMapIdle`                                           | `.onCameraChanged { }`, `.onMapIdle { }`                                    |
| `onSourceAdded`, `onSourceDataLoaded`, `onStyleImageMissing`             | `.onSourceAdded { }`, `.onSourceDataLoaded { }`, `.onStyleImageMissing { }` |
| `queryRenderedFeatures`, `coordinate(for:)`, `point(for:)` outside a tap | `MapReader { proxy in ... }` then `proxy.map?.queryRenderedFeatures(...)`   |
| `mapView.snapshot(includeOverlays:)`                                     | `proxy.captureSnapshot()`                                                   |

## Gestures and interactions

| UIKit                                                                  | SwiftUI target                                                                                     | Notes                                                                                 |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `gestures.options.rotateEnabled = false` (and the other options)       | `.gestureOptions(GestureOptions(rotateEnabled: false, ...))`                                       | Same `GestureOptions` struct. Carry every option the UIKit screen set.                |
| `GestureManagerDelegate` (gesture began / ended)                       | `.gestureHandlers(MapGestureHandlers(...))`                                                        |                                                                                       |
| `mapboxMap.addInteraction(TapInteraction { context in ... })`          | `TapInteraction { context in ... return true }` inside `Map { }`                                   | Stable since 11.12. Return `true` to stop propagation, as before.                     |
| `addInteraction(TapInteraction(.standardPoi) { poi, context in })`     | `TapInteraction(.standardPoi) { poi, context in ... return true }`                                 | Also `.standardBuildings`, `.standardPlaceLabels`, `.layer("id")`, `.featureset(...)` |
| `LongPressInteraction`                                                 | `LongPressInteraction(...)` as map content                                                         |                                                                                       |
| `gestures.onMapTap.observe { }`, `onLayerTap("id") { }` (before 11.12) | `TapInteraction` on 11.12+. On 11.6–11.11, `.onMapTapGesture { }` / `.onLayerTapGesture("id") { }` | The gesture modifiers are deprecated from 11.12. Record which one you used.           |
| `setFeatureState(...)` in a handler                                    | `proxy.map?.setFeatureState(...)`, or the experimental `FeatureState` map content (11.7)           | Don't adopt `FeatureState` without asking (Rule 2)                                    |

## Annotations

**A `PointAnnotation` placed directly in `Map { }` is wrapped in its own `PointAnnotationGroup`, which means its own annotation manager and layer.** A `ForEvery` over a list of `PointAnnotation`s creates one layer per marker. Use the group types for lists. The same applies to `CircleAnnotation`, `PolylineAnnotation` and `PolygonAnnotation`.

```swift
Map {
    PointAnnotationGroup(stores) { store in   // stores: [Store], Store: Identifiable
        PointAnnotation(coordinate: store.coordinate)
            .image(.init(image: UIImage(named: "store-pin")!, name: "store-pin"))
            .iconAnchor(.bottom)
            .onTapGesture { selected = store }
    }
    .clusterOptions(ClusterOptions())        // only if the UIKit manager clustered
}
```

| UIKit                                                                         | SwiftUI target                                                                              | Notes                                                                                                                             |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `makePointAnnotationManager()` + `manager.annotations = [...]`                | `PointAnnotationGroup(data, id: \.id) { PointAnnotation(...) }` or with `Identifiable` data | One layer, like the UIKit manager. Also `CircleAnnotationGroup`, `PolylineAnnotationGroup`, `PolygonAnnotationGroup`.             |
| `makePointAnnotationManager(clusterOptions:)`                                 | `.clusterOptions(ClusterOptions(...))` on the group                                         | Point annotations only. `.onClusterTap { }` on the group.                                                                         |
| `makePointAnnotationManager(id:layerPosition:)`                               | `.layerId(...)`, `.slot(...)` on the group                                                  | Keep the manager's ID if other code queries its layer `[VERIFY WITH MAPBOX]`                                                      |
| A few individual annotations                                                  | `PointAnnotation(coordinate:)` directly in `Map { }`                                        | Fine for a handful                                                                                                                |
| `annotation.image = .init(image:name:)`                                       | `.image(.init(image: UIImage, name:))` or `.image(named: "asset")`                          | A point annotation without an image or text draws nothing                                                                         |
| `annotation.tapHandler = { context in ... }`, `AnnotationInteractionDelegate` | `.onTapGesture { }` or `.onTapGesture { context in ... return true }` on the annotation     | Also `.onLongPressGesture`                                                                                                        |
| `annotation.isDraggable = true`, drag handlers                                | **Not supported** on SwiftUI layer annotations                                              | Keep the screen (or that layer) on UIKit through `MapReader`, or use an experimental draggable `MapViewAnnotation`. Ask (Rule 2). |
| `annotation.isSelected`                                                       | **Not supported** in SwiftUI                                                                | Track selection in state and change the annotation's properties                                                                   |
| `mapView.viewAnnotations.add(ViewAnnotation(coordinate:view:))`               | `MapViewAnnotation(coordinate:) { SwiftUIView() }`                                          | Content is SwiftUI. Rebuild the `UIView`, or wrap it in a `UIViewRepresentable`.                                                  |
| `ViewAnnotation(layerId:featureId:view:)`                                     | `MapViewAnnotation(layerId:featureId:) { ... }`                                             |                                                                                                                                   |
| View annotation options (`allowOverlap`, `variableAnchors`, `priority`)       | `.allowOverlap(true)`, `.variableAnchors([...])`, `.priority(...)`                          |                                                                                                                                   |
| Many view annotations from data                                               | `ForEvery(items) { MapViewAnnotation(coordinate: $0.coordinate) { ... } }`                  | Duplicate IDs in `ForEvery` crashed before 11.8. Use unique, stable IDs.                                                          |
| Updating annotations by reassigning `manager.annotations`                     | Change the data the group reads                                                             | Keep stable `id`s so updates don't recreate every annotation                                                                      |

`Marker` (since 11.15) is experimental. Don't replace existing annotations with it during a migration.

## Location and puck

```swift
@State var viewport: Viewport = .followPuck(zoom: 15)

Map(viewport: $viewport) {
    Puck2D(bearing: .heading)
        .showsAccuracyRing(true)
}
```

| UIKit                                                                          | SwiftUI target                                                                       | Notes                                                              |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `location.options.puckType = .puck2D(.makeDefault(showBearing: true))`         | `Puck2D(bearing: .heading)` as map content                                           | Carry over `showsAccuracyRing`, custom images and pulsing settings |
| `.puck3D(Puck3DConfiguration(model:))`                                         | `Puck3D(model:bearing:)`                                                             | Only the last puck in the content is shown                         |
| `location.options.puckBearing = .course`                                       | `Puck2D(bearing: .course)`                                                           |                                                                    |
| `location.override(provider:)` / `override(locationProvider:headingProvider:)` | `.locationDataModel(LocationDataModel(location: publisher, heading: publisher))`     | `LocationDataModel.createCore()` for the Core Location provider    |
| `location.onLocationChange.observe { }`                                        | Observe the same publisher in the view model, or `proxy.location?.onLocationChange`  |                                                                    |
| Location permission request                                                    | Unchanged. The default provider requests it; custom providers still need the app to. |                                                                    |

## Ornaments

SwiftUI uses the same `OrnamentOptions` struct through `.ornamentOptions(...)`. Positions and margins carry over directly.

| UIKit                                                                   | SwiftUI target                                                                                                              |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `ornaments.options.compass.visibility = .hidden`                        | `.ornamentOptions(OrnamentOptions(compass: CompassViewOptions(visibility: .hidden)))`                                       |
| `ornaments.options.scaleBar.position = .bottomLeading`, `margins = ...` | `OrnamentOptions(scaleBar: ScaleBarViewOptions(position: .bottomLeading, margins: CGPoint(...)))`                           |
| `ornaments.compassView.isHidden = true`                                 | `CompassViewOptions(visibility: .hidden)`                                                                                   |
| Logo and attribution position                                           | `OrnamentOptions(logo: LogoViewOptions(position:margins:), attributionButton: AttributionButtonOptions(position:margins:))` |

Set every ornament the UIKit screen changed in one `OrnamentOptions`: fields you leave out use the defaults. Keep the logo and attribution visible. Hiding them has terms-of-service implications; leave that decision to the developer.

## No SwiftUI API: use `MapReader`

| Feature                                             | What to do                                                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `OfflineManager`, `TileStore`                       | They don't need the map. Keep them in the app's model; no change.                                                                |
| `Snapshotter` (off-screen)                          | No change. For an image of the visible map, `proxy.captureSnapshot()`.                                                           |
| Custom layers, style APIs with no content type      | `MapReader` + `.onStyleLoaded`                                                                                                   |
| Annotation manager features the groups don't expose | `MapReader` with a manager created once on `.onMapLoaded` and kept in a model `[VERIFY WITH MAPBOX]` for the feature in question |

## Behavior changes

| Change                                  | UIKit screen                                                     | SwiftUI default                                                                                                                                                          | Preserve the UIKit behavior                                                                                                           |
| --------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Style loaded from code after creation   | `loadStyle(...)` in `viewDidLoad`, after `MapView` was created   | `Map` loads Standard when `.mapStyle` is absent. Calling `proxy.map?.loadStyle` in `.onAppear` loads Standard first, then the app's style.                               | Use `.mapStyle(...)`. Remove the `loadStyle` call.                                                                                    |
| Map recreated                           | Lived as long as the view controller                             | Destroyed when the view leaves the hierarchy, or when its identity changes (an `if`/`else` branch, `.id(...)`, a `List` row scrolling off). The style reloads each time. | Keep `Map` out of branches that toggle. Hold the `Viewport` in the parent or model so the camera returns with the screen.             |
| Camera after the screen is rebuilt      | Kept by the view controller                                      | `initialViewport` applies again on recreation                                                                                                                            | Bind a `Viewport` held outside the view and keep the last camera in the model, or accept and record it                                |
| Layers added imperatively               | Added in `onStyleLoaded`                                         | Lost on style reload when added through `proxy.map` and not re-added                                                                                                     | Declare them as map content, or re-add them in `.onStyleLoaded`                                                                       |
| Many single annotations                 | One manager, one layer: icons collide and sort within that layer | One layer per `PointAnnotation`: draw order follows content order, and collision between markers changes                                                                 | Use the group type with the same data                                                                                                 |
| Draggable or selected layer annotations | `isDraggable`, `isSelected`                                      | Not supported in SwiftUI                                                                                                                                                 | Keep that screen on UIKit, use `MapReader` with a UIKit manager, or the experimental draggable `MapViewAnnotation` (developer's call) |
| Safe area and camera padding            | Padding from `viewport.options` or content insets                | Viewport padding includes the safe area; `.ignoresSafeArea()` changes ornament and camera placement                                                                      | Use `.usesSafeAreaInsetsAsPadding(false)` or `.additionalSafeAreaInsets(...)` to match. Compare in the after screenshot.              |
| Camera updates in state                 | `onCameraChanged` updated a label directly                       | Writing each camera change to `@State` re-runs `body` at frame rate                                                                                                      | Keep it in a model, throttle, or read it only when needed                                                                             |
| Gesture settings                        | `gestures.options` set in `viewDidLoad`                          | Defaults (all gestures on)                                                                                                                                               | Carry each option into `.gestureOptions(...)`                                                                                         |
