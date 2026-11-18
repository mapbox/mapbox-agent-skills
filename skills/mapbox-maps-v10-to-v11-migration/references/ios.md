# iOS: Maps SDK v10 → v11

Mappings from Maps SDK for iOS v10 to the current v11 APIs, for UIKit (`MapView`) and SwiftUI (`Map`).

**Requirements for current v11:** Xcode 26.2+, iOS 14+. The minimum iOS version is expected to move to iOS 15, so check the target release's notes. 11.0 itself needed only Xcode 14.1 and iOS 12; if the developer pins an older 11.x, use that release's requirements.

**Minimum versions for target APIs:** Featureset Interactions (`TapInteraction`, `LongPressInteraction`) and the deprecation of the old gesture callbacks: **11.13**. `setFeatureStateExpression`: 11.17 (experimental). `LocationManager.dataModel` (replaces the deprecated `override(...)`): 11.17. If the app pins an older 11.x, use the "older 11.x" alternative given in the Notes column.

**UIKit or SwiftUI:** v11 adds SwiftUI support. Don't move a UIKit screen to SwiftUI as part of the migration. Migrate each map with the surface it already uses.

## Inventory search list

Search the app's sources (exclude `Pods/`, `.build/`, `DerivedData/`). Count call sites per pattern.

| Area             | Search for                                                                                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependencies     | `MapboxMaps` in `Package.swift`, `Package.resolved`, `Podfile`, `Podfile.lock`, `Cartfile`; `.package(url: "https://github.com/mapbox/mapbox-maps-ios"`                                                   |
| Setup, token     | `ResourceOptions`, `ResourceOptionsManager`, `accessToken:` in `MapInitOptions`, `MGLMapboxAccessToken`, `MBXAccessToken`                                                                                 |
| Map view, style  | `MapInitOptions(`, `styleURI`, `mapboxMap.style`, `loadStyleURI`, `loadStyleJSON`, `.uri`, `.JSON`, `.isLoaded`, `.defaultCamera`, `.transition`; `MapView(frame:` with no `mapInitOptions:`              |
| Events           | `onEvery(`, `onNext(`, `.observe(for:`, `MapEvents.`, `.payload`, `addPuckLocationConsumer`                                                                                                               |
| Camera, viewport | `mapView.cameraState`, `camera(for:`, `cameraForCoordinates`, `OverviewViewportStateOptions`, `dragStart`, `dragEnd`, `optimizeForTerrain`                                                                |
| Annotations      | `makePointAnnotationManager`, `iconTextFit`, `iconTextFitPadding`, `textLineHeight` on a manager, `userInfo`                                                                                              |
| View annotations | `viewAnnotations.add(`, `ViewAnnotationOptions(`, `viewAnnotations.update(`, `viewAnnotations.remove(`, `options(for:`                                                                                    |
| Style, sources   | `style.addSource(`, `style.addLayer(`, `addSource(_:id:)`, `LineLayer(id:` without `source:`, `.source =`, `visibility = .expression`, `promoteId`, `*PatternTransition`, `lineDasharrayTransition`       |
| Gestures, taps   | `queryRenderedFeatures` (inspect each: tap handler or not), `UITapGestureRecognizer` / `UILongPressGestureRecognizer` on the map view, `pinchRotateEnabled`, `GestureManagerDelegate`                     |
| Location, puck   | `LocationProvider`, `LocationProviderDelegate`, `location.options`, `PuckBearingSource`, `puckBearingSource`, `Puck3DConfiguration`, `modelScale`, `locationProvider(` , `heading`                        |
| Offline          | `OfflineManager(resourceOptions:`, `TilesetDescriptorOptionsForTilesets`, `createTilesetDescriptorForTilesetDescriptorOptions`, `OfflineRegionManager`, `OfflineRegion`, `ResponseError`, `startLocation` |
| HTTP, other      | `HttpServiceFactory`, `HttpServiceInterface`, `HttpServiceInterceptorInterface`, `onDownload`, `keepCompression`, `setMemoryBudget`, `setRenderCache`, `Snapshotter`                                      |
| Implicit imports | Files that use `UIView`, `UIViewController` or `MTKView` and import only `MapboxMaps`                                                                                                                     |

## Behavior changes

Each row compiles in v11 but behaves differently. Present every row that applies as a decision (SKILL.md rule 2).

| Change                     | v10                                                                                                                            | v11 default                                                                                                                                                                                          | To keep v10 behavior                                                                                                                                                     | Applies when                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Default style              | Mapbox Streets (`StyleURI.streets`)                                                                                            | Mapbox Standard                                                                                                                                                                                      | Set the style explicitly: `MapInitOptions(styleURI: .streets)`, or the exact URI v10 resolved to                                                                         | The app never sets a style (`MapView(frame:)` with no `styleURI`, SwiftUI not applicable) |
| Puck bearing               | `puckBearingEnabled` defaults to `true`                                                                                        | Defaults to `false`; the puck doesn't rotate                                                                                                                                                         | `mapView.location.options.puckBearingEnabled = true`                                                                                                                     | The app shows the puck and didn't set `puckBearingEnabled`                                |
| Heading source             | Heading came with `Location` from the location provider                                                                        | Heading is a separate stream: a `HeadingProvider`, or the `heading:` publisher of `LocationDataModel` (11.17+). A custom location source supplies no heading unless the app adds one                 | With `puckBearing = .heading` and a custom location source, also pass a heading publisher (`LocationDataModel(location:heading:)`), or the puck stops rotating           | The app uses a custom `LocationProvider` and heading-based bearing                        |
| 3D puck scale              | `Puck3DConfiguration.modelScale` used a zoom-based `model-scale` expression                                                    | v11 renders the same `modelScale` at a different size (scale mode defaults to `.viewport`). `modelScaleMode` is `@_spi(Experimental)` in 11.x (checked in 11.35), so it can't be set with public API | Re-tune `modelScale`. Mapbox measured about 100× the v10 value, but it varies. Check on device.                                                                          | The app uses `Puck3D`                                                                     |
| Overview padding           | `OverviewViewportStateOptions.padding` padded the geometry                                                                     | `padding` is camera padding; geometry padding is `geometryPadding`                                                                                                                                   | Rename `padding:` to `geometryPadding:`                                                                                                                                  | The app uses `makeOverviewViewportState`                                                  |
| Location provider settings | `mapView.location.options` set `distanceFilter`, `desiredAccuracy`, `activityType`                                             | `LocationManager.options` controls only the puck                                                                                                                                                     | Pass them in `AppleLocationProvider.Options` to `LocationDataModel.createDefault(_:)` and assign `mapView.location.dataModel` (see Location)                             | The app sets any of these on `location.options`                                           |
| Terrain layer order        | `MapOptions.optimizeForTerrain` (default on) reordered layers                                                                  | Option removed; layers are reordered automatically when terrain is present                                                                                                                           | Nothing to set. Check the rendering if the app had turned the option off                                                                                                 | The app uses terrain                                                                      |
| Layer visibility           | `visibility` accepted an expression                                                                                            | Constant only                                                                                                                                                                                        | Replace with `setLayerProperty(for:property:"visibility", value:)` driven by app state, or a filter or opacity expression                                                | The app set `visibility` to an expression                                                 |
| Gestures during animation  | Camera animations stopped while a gesture was in progress                                                                      | Animations allowed during gestures; zoom allowed during drag                                                                                                                                         | No switch. Mention it if the app coordinates gestures and animations by hand                                                                                             | The app relies on gestures cancelling animations                                          |
| Map size                   | Map size tracked the view                                                                                                      | Map size is synced to the Metal view                                                                                                                                                                 | No switch. Check layouts with insets or non-standard frames                                                                                                              | Custom layout around the map view                                                         |
| Style constants            | `StyleURI` constants (`.streets`, `.outdoors`, `.light`, `.dark`, `.satelliteStreets`) resolved to the versions in the v10 SDK | The same constants may resolve to newer style versions                                                                                                                                               | Replace the constant with the literal URI the v10 SDK used, e.g. `StyleURI(rawValue: "mapbox://styles/mapbox/streets-v11")!` [VERIFY WITH MAPBOX] for the exact versions | The app uses a `StyleURI` constant                                                        |

**Finding the v10 default style:** the v10 SDK resolves `StyleURI.streets` to a specific Streets version. Read it from the v10 source the app currently builds against, before bumping: search for `static let streets` in `SourcePackages/checkouts/mapbox-maps-ios` (SPM) or `Pods/MapboxMaps` (CocoaPods). Pin that exact URI as a literal. Do the same for any other `StyleURI` constant the app uses: read its v10 value and pin it, because the v11 constant may point to a newer style version. If you can't read the v10 source, write the literal you believe is right and add `[VERIFY WITH MAPBOX]`.

## No direct mapping

Treat these as blockers or developer decisions in the plan.

| v10 feature                                                                                       | v11 status                                                 | What to do                                                                                                                     |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Custom HTTP stack (`HttpServiceFactory.setUserDefinedForCustom`, `HttpServiceInterface`, `reset`) | Removed from public API. You can't replace the HTTP stack. | **Blocker.** If the app only rewrites requests or responses, move to an interceptor (see Other). Otherwise escalate to Mapbox. |
| `HttpServiceInterceptorInterface.onDownload`                                                      | Removed                                                    | Decision: move logic to `onRequest`, or drop it                                                                                |
| `MapboxMap.setRenderCache(_:)` (experimental)                                                     | Removed                                                    | Delete the call. Note it in the report.                                                                                        |
| Access token on `TileStore` options                                                               | `TileStore` no longer takes a token                        | Set `MapboxOptions.accessToken` once                                                                                           |
| `visibility` as an expression                                                                     | Constant only                                              | See Behavior changes                                                                                                           |

## Mappings by area

Columns: **v10** is what you find. **v11 target** is what the code becomes. When the official migration guide gives a different v11 mapping, Notes says so and the target here wins.

### 1. Dependencies, setup and access token

| v10                                                                       | v11 target                                                                                                            | Notes                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MapboxMaps` 10.x (SPM, CocoaPods, Carthage)                              | `MapboxMaps` latest 11.x via SPM or CocoaPods                                                                         | v11 ships via SPM, CocoaPods and direct download. A Carthage project needs a packaging decision. **If the app also uses Navigation SDK v3**, which ships only via SPM, take Maps v11 from the same SPM package graph rather than CocoaPods. |
| `ResourceOptions(accessToken:)` passed to `MapInitOptions`                | `MBXAccessToken` in `Info.plist` (read automatically), or `MapboxOptions.accessToken = token` before creating any map | `ResourceOptions` and `ResourceOptionsManager` are removed                                                                                                                                                                                  |
| `ResourceOptionsManager.default.resourceOptions.accessToken = …`          | `MapboxOptions.accessToken = …`                                                                                       | One call covers every Mapbox SDK                                                                                                                                                                                                            |
| `ResourceOptions(dataPathURL:assetPathURL:tileStore:tileStoreUsageMode:)` | `MapboxMapsOptions.dataPath`, `.assetPath`, `.tileStore`, `.tileStoreUsageMode`                                       |                                                                                                                                                                                                                                             |
| `import MapboxMaps` covering UIKit and MetalKit                           | Add `import UIKit` (and `import MetalKit` where used) explicitly                                                      | v11 no longer re-exports them. Expect "cannot find type 'UIView'" errors.                                                                                                                                                                   |

Keep the token where it was if it's already in `Info.plist` as `MBXAccessToken`. Don't change the token itself or its scopes.

### 2. Map view and style loading

| v10                                                           | v11 target                                                             | Notes                                                        |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| `MapView(frame:)` with no style                               | `MapView(frame:mapInitOptions: MapInitOptions(styleURI: <v10 style>))` | Behavior change: default style. Pass the style at creation.  |
| `mapboxMap.style.uri`, `mapboxMap.uri`                        | `mapboxMap.styleURI`                                                   |                                                              |
| `mapboxMap.style.JSON`, `mapboxMap.JSON`                      | `mapboxMap.styleJSON`                                                  |                                                              |
| `mapboxMap.transition`                                        | `mapboxMap.styleTransition`                                            |                                                              |
| `mapboxMap.isLoaded` (style)                                  | `mapboxMap.isStyleLoaded`                                              |                                                              |
| `mapboxMap.defaultCamera`                                     | `mapboxMap.styleDefaultCamera`                                         |                                                              |
| `loadStyleURI(_:completion:)`, `loadStyleJSON(_:completion:)` | `mapboxMap.loadStyle(_:completion:)`, or assign `mapboxMap.mapStyle`   | Both v10 methods are deprecated in v11                       |
| `mapboxMap.style.<anything>`, `snapshot.style.<anything>`     | The same method directly on `mapboxMap` / `snapshotter` / `snapshot`   | e.g. `mapboxMap.style.addLayer(l)` → `mapboxMap.addLayer(l)` |

### 3. Events and observers

v11 events are typed `Signal`s. Observing returns an `AnyCancelable` that **cancels the subscription when released**. Store every token for as long as the observer should live.

| v10                                                                                                                   | v11 target                                                                                                  | Notes                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `mapboxMap.onEvery(.cameraChanged) { _ in }`                                                                          | `mapboxMap.onCameraChanged.observe { event in }.store(in: &cancelables)`                                    | `event.cameraState` replaces reading `mapView.cameraState` in the handler                                            |
| `mapboxMap.onNext(event: .styleLoaded) { _ in }`                                                                      | `mapboxMap.onStyleLoaded.observeNext { _ in }.store(in: &cancelables)`                                      |                                                                                                                      |
| `onNext(event: .mapLoaded)`, `.mapLoadingError`, `.sourceDataLoaded`, `.renderFrameFinished`, `.styleImageMissing`, … | `onMapLoaded`, `onMapLoadingError`, `onSourceDataLoaded`, `onRenderFrameFinished`, `onStyleImageMissing`, … | One signal per event type                                                                                            |
| `mapboxMap.observe(for:handler:)`, `MapEvents.EventKind`, `MapEvents.Event`                                           | Typed signals                                                                                               | Removed in v11. A shim exists to ease migration; don't rely on it.                                                   |
| `event.payload.<field>`                                                                                               | Read the field on the event itself                                                                          | e.g. `.id` on source events becomes `.sourceId`, on image events `.imageId`; `MapLoadingError.error` becomes `.type` |
| `snapshotter.onEvery` / `onNext`                                                                                      | Typed signals on `Snapshotter`                                                                              |                                                                                                                      |
| Combine bridging written by hand                                                                                      | `Signal` is a `Combine.Publisher`: `.debounce`, `.map`, `.sink`                                             | Optional. Only use it if the app already uses Combine.                                                               |

```swift
// v10
mapView.mapboxMap.onEvery(.cameraChanged) { [weak self] _ in
    guard let self else { return }
    self.handleCameraChange(self.mapView.cameraState)
}

// v11
private var cancelables = Set<AnyCancelable>()

mapView.mapboxMap.onCameraChanged.observe { [weak self] event in
    self?.handleCameraChange(event.cameraState)
}.store(in: &cancelables)
```

A dropped token (`_ = mapboxMap.onStyleLoaded.observe { … }`) means the callback never fires, with no error. This doesn't apply to the plain `Cancelable` returned by `ease`, `fly`, `queryRenderedFeatures` or `addInteraction`: those keep running when released.

### 4. Camera and viewport

| v10                                                                                               | v11 target                                                                            | Notes                                                                                                                              |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `mapView.cameraState`, `mapView.anchor`                                                           | `mapView.mapboxMap.cameraState`, `mapboxMap.anchor`                                   |                                                                                                                                    |
| `mapboxMap.camera(for:padding:bearing:pitch:)`, overloads taking `CoordinateBounds` or `Geometry` | `mapboxMap.camera(for: coordinates, camera:, coordinatesPadding:, maxZoom:, offset:)` | Takes an array of coordinates and `throws`. Not a pure rename. The migration guide's 11.0 signatures are deprecated in later 11.x. |
| `OverviewViewportStateOptions(geometry:padding:)`                                                 | `OverviewViewportStateOptions(geometry:geometryPadding:)`                             | Behavior change. `padding` now means camera padding.                                                                               |
| `mapboxMap.dragStart()`, `dragEnd()`                                                              | `mapboxMap.beginGesture()`, `endGesture()`                                            | Removed in v11                                                                                                                     |
| `MapOptions(optimizeForTerrain:)`                                                                 | Delete the argument                                                                   | Removed                                                                                                                            |
| `camera.ease(to:duration:)` / `fly(to:)` returning `Cancelable?`                                  | Returns a non-optional `Cancelable`                                                   | Remove optional chaining on the result                                                                                             |
| `CameraAnimator` owner tracked by the app                                                         | `CameraAnimator.owner`                                                                | Optional cleanup                                                                                                                   |

### 5. Annotations and view annotations

| v10                                                                                                              | v11 target                                                                                                                                                | Notes                                                                           |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `pointAnnotationManager.iconTextFit`, `.iconTextFitPadding`                                                      | Set on each `PointAnnotation`                                                                                                                             | Manager properties deprecated in v11                                            |
| `pointAnnotationManager.textLineHeight`                                                                          | `PointAnnotation.textLineHeight`                                                                                                                          | Removed in v11                                                                  |
| `annotation.userInfo`                                                                                            | `annotation.customData`                                                                                                                                   | Deprecated in v11                                                               |
| Tap delegate on the manager (`AnnotationInteractionDelegate`) or `queryRenderedFeatures` on the annotation layer | `annotation.tapHandler = { [weak self] context in …; return true }` (also `longPressHandler`)                                                             | Return `true` to stop the tap propagating                                       |
| Many points, no clustering                                                                                       | Unchanged; `makePointAnnotationManager(id:layerPosition:clusterOptions:)` exists if wanted                                                                | Out of scope. Mention it in the report only.                                    |
| `viewAnnotations.add(view, options: ViewAnnotationOptions(geometry: point, …))`                                  | `let a = ViewAnnotation(coordinate: point, view: view)` (or `annotatedFeature: .geometry(…)` / `.layerFeature(…)`), then `mapView.viewAnnotations.add(a)` | The `UIView`-keyed API is deprecated. Keep a reference to the `ViewAnnotation`. |
| `viewAnnotations.update(view, options:)`                                                                         | Change properties on the `ViewAnnotation` in place: `annotatedFeature`, `visible`, `allowOverlap`, `priority`, `variableAnchors`, `minZoom`, `maxZoom`    | Don't remove and re-add to move or restyle                                      |
| `viewAnnotations.remove(view)`                                                                                   | `annotation.remove()`                                                                                                                                     |                                                                                 |
| `viewAnnotations.options(for:)`, `viewAnnotations.annotations` dictionary                                        | Keep the `ViewAnnotation` references, or use `viewAnnotations.allAnnotations`                                                                             |                                                                                 |
| `ViewAnnotationOptions.selected`                                                                                 | `ViewAnnotation.priority`                                                                                                                                 |                                                                                 |
| Remove and re-add after the view's content changes size                                                          | `annotation.setNeedsUpdateSize()`                                                                                                                         |                                                                                 |
| Projecting coordinates to screen points on every camera change to place views                                    | `ViewAnnotation` with `onAnchorChanged` / `onFrameChanged`                                                                                                | Only when the app positions its own views over the map. Otherwise out of scope. |

### 6. Style, sources and layers

| v10                                                                                                                                          | v11 target                                                                                                                                                | Notes                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `let s = GeoJSONSource(); style.addSource(s, id: "x")`                                                                                       | `let s = GeoJSONSource(id: "x"); mapboxMap.addSource(s)`                                                                                                  | Every source needs an `id` at creation                                                                            |
| `var l = LineLayer(id: "x"); l.source = "src"`                                                                                               | `let l = LineLayer(id: "x", source: "src")`                                                                                                               | `source` is required in the initializer for layers that use one                                                   |
| `source`, `sourceLayer`, `filter` on `BackgroundLayer`, `SkyLayer`, `LocationIndicatorLayer`                                                 | Delete them                                                                                                                                               | Removed from those layers                                                                                         |
| `layer.visibility = .expression(…)`                                                                                                          | `.constant(.visible)` / `.constant(.none)`                                                                                                                | Behavior change if the expression varied                                                                          |
| `backgroundPatternTransition`, `fillPatternTransition`, `fillExtrusionPatternTransition`, `linePatternTransition`, `lineDasharrayTransition` | Delete                                                                                                                                                    | Removed in v11                                                                                                    |
| `GeoJSONSource.data = .url(…)` or a decoded `FeatureCollection`                                                                              | Unchanged. `.string(…)` also accepts a URL string or inline GeoJSON                                                                                       |                                                                                                                   |
| `promoteId`                                                                                                                                  | `promoteId2`                                                                                                                                              | Needed for feature state on sources with non-numeric ids                                                          |
| **Selection by rewriting the source:** map features, set `properties["selected"] = true`, `updateGeoJSONSource`                              | **Feature State:** `mapboxMap.setFeatureState(sourceId:sourceLayerId:featureId:state:callback:)` + a `featureState` expression in the layer               | Not in the migration guide. Features need stable ids (`promoteId2` or `generateId`).                              |
| **Small data change by replacing the whole source:** rebuild the collection to add, move or remove one feature                               | `addGeoJSONSourceFeatures(forSourceId:features:dataId:)`, `updateGeoJSONSourceFeatures(…)`, `removeGeoJSONSourceFeatures(forSourceId:featureIds:dataId:)` | Features need ids. Full replacement with `updateGeoJSONSource(withId:geoJSON:)` is still right for a new dataset. |
| Cluster APIs `getGeoJsonClusterLeaves`, `…Children`, `…ExpansionZoom`                                                                        | Same names, now return `Cancelable`                                                                                                                       |                                                                                                                   |
| `setMemoryBudget(_:)` (experimental)                                                                                                         | `setTileCacheBudget(size:)`                                                                                                                               | The 11.0 name `setTileCacheBudget(_:)` is itself deprecated                                                       |

```swift
// v10: selection by rewriting the source
let updated = features.map { f -> Feature in
    var f = f
    f.properties?["selected"] = .boolean(f.identifier == .string(tappedId))
    return f
}
try mapView.mapboxMap.style.updateGeoJSONSource(withId: "pois", geoJSON: .featureCollection(.init(features: updated)))

// v11 target: feature state
mapView.mapboxMap.setFeatureState(sourceId: "pois", featureId: tappedId, state: ["selected": true]) { _ in }

var layer = CircleLayer(id: "pois-layer", source: "pois")
layer.circleColor = .expression(
    Exp(.switchCase) {
        Exp(.boolean) { Exp(.featureState) { "selected" }; false }
        UIColor.systemRed
        UIColor.systemBlue
    }
)
```

Clear the previous selection with `removeFeatureState` (same source and feature id) before setting the new one, or `resetFeatureStates(sourceId:sourceLayerId:)` to clear them all. Check the exact signatures for the target version.

### 7. Gestures and interactions

The official guide maps tap handling to `gestures.onLayerTap`, `gestures.onMapTap` and SwiftUI `onLayerTapGesture` / `onMapTapGesture`. **That mapping is outdated: all of these are deprecated from 11.13.** Use Featureset Interactions instead.

| v10                                                                                             | v11 target                                                                                            | Notes                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `UITapGestureRecognizer` on the map + `queryRenderedFeatures(with:options:)` for a custom layer | `mapboxMap.addInteraction(TapInteraction(.layer("layer-id")) { feature, context in …; return true })` | SwiftUI: put `TapInteraction(.layer("layer-id")) { … }` inside `Map { }`. Older 11.x: `gestures.onLayerTap`. |
| Same, for a long press                                                                          | `LongPressInteraction(.layer("layer-id")) { feature, context in … }`                                  | Older 11.x: `gestures.onLayerLongPress`                                                                      |
| `UITapGestureRecognizer` for taps on empty map                                                  | `mapboxMap.addInteraction(TapInteraction { context in …; return true })`                              | Older 11.x: `gestures.onMapTap.observe { }`                                                                  |
| `queryRenderedFeatures` with a tolerance rectangle around the tap                               | `TapInteraction(.layer("id"), filter: …, radius: …)`                                                  |                                                                                                              |
| Tap handling for Mapbox POIs, buildings or place labels **[Standard only]**                     | `TapInteraction(.standardPoi)`, `.standardBuildings`, `.standardPlaceLabels`                          | Only if the app already uses Standard                                                                        |
| Tap handling for a featureset defined in the app's own style                                    | `TapInteraction(.featureset("id", importId: …))`                                                      | Only if the style defines featuresets                                                                        |
| `MapContentGestureContext`                                                                      | `InteractionContext`                                                                                  |                                                                                                              |
| `gestures.options.pinchRotateEnabled`                                                           | `gestures.options.rotateEnabled`                                                                      | Removed in v11                                                                                               |
| `GestureType` checks that lumped rotation into pinch                                            | `GestureType.rotation` is separate                                                                    |                                                                                                              |
| `queryRenderedFeatures` for non-interactive queries (inside a rectangle, at app start)          | Unchanged                                                                                             | Not deprecated. Don't replace it.                                                                            |

```swift
// v10
let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
mapView.addGestureRecognizer(tap)

@objc func handleTap(_ sender: UITapGestureRecognizer) {
    let point = sender.location(in: mapView)
    mapView.mapboxMap.queryRenderedFeatures(with: point, options: RenderedQueryOptions(layerIds: ["stores"], filter: nil)) { [weak self] result in
        guard case .success(let features) = result, let feature = features.first?.queriedFeature.feature else { return }
        self?.showStore(feature)
    }
}

// v11 target
mapView.mapboxMap.addInteraction(TapInteraction(.layer("stores")) { [weak self] feature, _ in
    self?.showStore(feature)
    return true // handled; don't pass the tap to features below
})
```

```swift
// v11 target, SwiftUI
Map {
    TapInteraction(.layer("stores")) { feature, _ in
        selectedStore = feature
        return true
    }
}
```

Use `[weak self]` in every interaction and tap handler. The SDK keeps the closure.

### 8. Location and puck

| v10                                                                                         | v11 target                                                                                                              | Notes                                                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `mapView.location.options.distanceFilter`, `.desiredAccuracy`, `.activityType`              | `mapView.location.dataModel = .createDefault(options)` with an `AppleLocationProvider.Options`                          | Behavior change if not moved. Older 11.x (before 11.17): `location.override(provider:)`              |
| `LocationOptions(…puckBearingSource:…)`, `PuckBearingSource`                                | `LocationOptions(puckType:puckBearing:puckBearingEnabled:)`, `PuckBearing`                                              | Removed in v11                                                                                       |
| `puckBearingEnabled` left at default                                                        | Set `puckBearingEnabled = true` if the puck rotated in v10                                                              | Behavior change                                                                                      |
| Custom `LocationProvider` that also handled permissions, accuracy authorization and heading | `mapView.location.dataModel = LocationDataModel(location: <publisher of [Location]>, heading: <publisher of Heading>?)` | Permission prompts move to the app (`CLLocationManager`). Publishers must deliver on the main thread |
| `Location.heading`                                                                          | `Heading` from `HeadingProvider` / `location.onHeadingChange`                                                           |                                                                                                      |
| `mapView.location.addPuckLocationConsumer(self)`                                            | `mapView.location.onPuckRender.observe { data in … }.store(in: &cancelables)`                                           | Also `onLocationChange`, `onHeadingChange`                                                           |
| `LocationManager.locationProvider` used to read the current location                        | `mapView.location.latestLocation`, or observe `onLocationChange`                                                        |                                                                                                      |
| `Puck3DConfiguration(model:modelScale:)`                                                    | Same. `modelScaleMode` exists but is `@_spi(Experimental)`: don't set it                                                | Behavior change: re-tune `modelScale`                                                                |
| Camera moved in a location observer to follow the user                                      | Unchanged in the migration. `viewport.makeFollowPuckViewportState` is the better pattern.                               | Pre-existing issue: report, don't rewrite                                                            |

```swift
// v10
mapView.location.options.distanceFilter = 100
mapView.location.options.puckType = .puck2D()

// v11 (11.17+)
mapView.location.dataModel = .createDefault(AppleLocationProvider.Options(distanceFilter: 100))
mapView.location.options.puckType = .puck2D()
mapView.location.options.puckBearingEnabled = true // only if v10 showed bearing
```

A custom location source becomes a `LocationDataModel` built from publishers. **Heading is separate in v11.** In v10 a custom provider delivered heading with each `Location`. In v11 the location publisher carries no heading, so an app that shows heading-based bearing (`puckBearing = .heading`) must also pass a heading publisher, or the puck stops rotating. Both publishers must deliver on the main thread:

```swift
// v11 (11.17+): custom location source, for example locations replayed from the app's own feed
let locations = PassthroughSubject<[Location], Never>()
let headings = PassthroughSubject<Heading, Never>() // only if the puck uses heading-based bearing
mapView.location.dataModel = LocationDataModel(
    location: locations.eraseToAnyPublisher(),
    heading: headings.eraseToAnyPublisher()
)
// later, on the main thread, convert the app's own updates to [Location] and send them
locations.send(latestLocations)
```

Don't write `location.override(...)` on 11.17 or later: all three overloads are deprecated in favor of `dataModel`. On an older pinned 11.x, `override(provider:)` / `override(locationProvider:headingProvider:)` is the API, and it isn't deprecated there.

### 9. Offline

| v10                                                                                                               | v11 target                                                                                                | Notes                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OfflineManager(resourceOptions:)`                                                                                | `OfflineManager()`                                                                                        | Token comes from `MapboxOptions`                                                                                                                              |
| `TilesetDescriptorOptionsForTilesets(tilesets:zoomRange:)` + `createTilesetDescriptorForTilesetDescriptorOptions` | `TilesetDescriptorOptions(styleURI:zoomRange:tilesets:)` + `offlineManager.createTilesetDescriptor(for:)` | Removed in v11                                                                                                                                                |
| `offlineManager.removeStylePack(for:)`                                                                            | `removeStylePack(for:completion:)`                                                                        | Completion is optional                                                                                                                                        |
| `TileRegionLoadOptions.startLocation: CLLocation`                                                                 | `startLocation: Coordinate2D`                                                                             |                                                                                                                                                               |
| `OfflineRegionManager(resourceOptions:)`                                                                          | `OfflineRegionManager()`                                                                                  | Legacy API, deprecated. Migrating to `TileStore` is a redesign, not a rename. Keep it working, list the move to `TileStore` + `OfflineManager` in the report. |
| `OfflineRegionObserver.responseError(forError:)`, `tileCountLimitExceeded()`                                      | `errorOccurred(forError: OfflineRegionError)`; check `error.type == .tileCountLimitExceeded`; `.isFatal`  | `ResponseError` → `OfflineRegionError`, `ResponseErrorReason` → `OfflineRegionErrorType`. New `.diskFull`.                                                    |
| `TileStore` options with an access token                                                                          | Remove; `TileStore.default`                                                                               |                                                                                                                                                               |

### 10. Other

| v10                                                              | v11 target                                                                                          | Notes                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `HttpServiceInterceptorInterface.onRequest(for:) -> HttpRequest` | `onRequest(for:continuation:)`, call `continuation(HttpRequestOrResponse.fromHttpRequest(request))` | Register with `HttpServiceFactory.setHttpServiceInterceptorInterface` |
| `onResponse(for:) -> HttpResponse`                               | `onResponse(for:continuation:)`, call `continuation(response)`                                      |                                                                       |
| `HttpRequest(…keepCompression:…)`                                | `HttpRequest(…flags: HttpRequestFlags.…)`                                                           |                                                                       |
| `mapboxMap.debugOptions`                                         | `mapView.debugOptions`                                                                              | Different option type                                                 |
| `presentsWithTransaction`                                        | `presentationTransactionMode` (`.automatic` default; `true` → `.sync`, `false` → `.async`)          | Keep `.sync` if the app moves its own views to follow coordinates     |
| Performance tracing by hand                                      | `Tracing.status = .enabled` (optional)                                                              | Not required                                                          |

## Removed in v11

APIs deprecated in v10 and removed in v11. These need a change even when nothing else in the area does.

| Removed                                                                                                                                 | Use instead                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `PointAnnotationManager.textLineHeight`                                                                                                 | `PointAnnotation.textLineHeight`                                                              |
| `PuckBearingSource`, `LocationOptions.init(distanceFilter:desiredAccuracy:activityType:puckType:puckBearingSource:puckBearingEnabled:)` | `PuckBearing`, `LocationOptions(puckType:puckBearing:puckBearingEnabled:)` + provider options |
| `GestureOptions.pinchRotateEnabled`                                                                                                     | `rotateEnabled`                                                                               |
| `MapboxMap.setRenderCache(_:)`                                                                                                          | Nothing. Delete it.                                                                           |
| `MapEvents.EventKind`, `MapEvents.Event`, `MapboxMap.observe`, `Snapshotter.observe`                                                    | Typed event signals                                                                           |
| `dragStart()`, `dragEnd()`                                                                                                              | `beginGesture()`, `endGesture()`                                                              |
| `*PatternTransition`, `lineDasharrayTransition`                                                                                         | Nothing. Delete them.                                                                         |
| `ResourceOptions`, `ResourceOptionsManager`                                                                                             | `MapboxOptions`, `MapboxMapsOptions`                                                          |
| `MapOptions.optimizeForTerrain`                                                                                                         | Nothing. Automatic.                                                                           |
