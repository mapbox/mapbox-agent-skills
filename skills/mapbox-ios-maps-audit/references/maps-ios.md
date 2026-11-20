# Maps SDK for iOS: integration audit reference

**Target:** Maps SDK for iOS
**Minimum compatible version:** `11.13.0` — all catalog entries stable from this release, unless a row says otherwise
**Validated against:** `11.32.0`

Entries marked ★ are experimental: check they exist in the app's SDK version before flagging. Entries that need a newer version than the minimum say so inline. Skip them on older SDKs.

IDs (`MAPSIOS-…`) are stable. Cite them exactly in findings. Use the grounding rule, output schema and workflow from SKILL.md.

## Part A — v11 API Catalog

Modern v11 APIs that audits often find missing or under-used. Each row gives the API, the symbols to search for, and what "not yet using it" looks like.

Symbols live in the `MapboxMaps` module. In UIKit they are reached from `MapView` / `mapView.mapboxMap`; in SwiftUI from the `Map` content closure and modifiers.

### MAPSIOS-A1. Featureset Interactions API

`TapInteraction` and `LongPressInteraction` replace the old gesture callbacks and `queryRenderedFeatures`-based tap handling, for Standard features and for custom layers. UIKit: `mapboxMap.addInteraction(_:)`. SwiftUI: place the interaction inside `Map { ... }`.

These older APIs are **deprecated** since `11.13.0`, and any use is a finding:

- UIKit: `GestureManager.onMapTap`, `onMapLongPress`, `onLayerTap(_:handler:)`, `onLayerLongPress(_:handler:)`.
- SwiftUI: `Map.onMapTapGesture`, `onMapLongPressGesture`, `onLayerTapGesture(_:perform:)`, `onLayerLongPressGesture(_:perform:)`.

| ID           | Functionality                                              | Key API symbols                                                                                                                                      | "Not yet using it" looks like                                                                                |
| ------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| MAPSIOS-A1.1 | Tap on Standard POIs **[Standard-style-only]**             | `TapInteraction(.standardPoi) { poi, ctx in ... }`; `StandardPoiFeature`                                                                             | `queryRenderedFeatures` filtered by a POI layer id inside a tap handler                                      |
| MAPSIOS-A1.2 | Tap on Standard buildings **[Standard-style-only]**        | `TapInteraction(.standardBuildings) { building, ctx in ... }`; `StandardBuildingsFeature`                                                            | Same, filtering for a building layer id                                                                      |
| MAPSIOS-A1.3 | Tap on Standard place labels **[Standard-style-only]**     | `TapInteraction(.standardPlaceLabels) { label, ctx in ... }`; `StandardPlaceLabelsFeature`                                                           | Same, filtering for a place-label layer id                                                                   |
| MAPSIOS-A1.4 | Long press on Standard features **[Standard-style-only]**  | `LongPressInteraction(.standardPoi) { ... }`, `LongPressInteraction(.standardBuildings) { ... }`                                                     | `UILongPressGestureRecognizer` or deprecated `onMapLongPress`, plus `queryRenderedFeatures`                  |
| MAPSIOS-A1.5 | Tap or long press on custom layers                         | `TapInteraction(.layer("layer-id")) { feature, ctx in ... }`, `LongPressInteraction(.layer("layer-id")) { ... }`                                     | `queryRenderedFeatures` against a custom layer id in a tap handler, or deprecated `onLayerTap("layer-id")`   |
| MAPSIOS-A1.6 | Tap or long press on the map itself (no feature)           | `TapInteraction { ctx in ... }`, `LongPressInteraction { ctx in ... }`                                                                               | Deprecated `onMapTap` / `onMapLongPress`, or a `UITapGestureRecognizer` added to `MapView`                   |
| MAPSIOS-A1.7 | Featureset from the app's own style                        | `FeaturesetDescriptor.featureset(_:importId:)`                                                                                                       | `queryRenderedFeatures` in a tap handler against the layers of a featureset the style defines                |
| MAPSIOS-A1.8 | Narrow or widen the hit target                             | `filter:` and `radius:` parameters on `TapInteraction` / `LongPressInteraction`                                                                      | Filtering query results in Swift after a too-broad `queryRenderedFeatures`, or a hand-written distance check |
| MAPSIOS-A1.9 | Landmark icons and indoor labels **[Standard-style-only]** | `.standardLandmarkIcons` (`StandardLandmarkIconsFeature`, since `11.16.0`), `.standardIndoorLabels` (`StandardIndoorLabelsFeature`, since `11.25.0`) | `queryRenderedFeatures` against the matching Standard layer ids                                              |

`queryRenderedFeatures` is not deprecated. It is still correct for non-interactive queries ("what is inside this rectangle?"). Only flag it when it implements a tap or long-press handler.

### MAPSIOS-A2. Feature State API

Feature state holds per-feature UI state (selected, hovered, highlighted) without rewriting source data. Layers read it through expressions.

| ID             | Functionality                                                | Key API symbols                                                                                                               | "Not yet using it" looks like                                                        |
| -------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| MAPSIOS-A2.1   | Set state on a typed feature                                 | `mapboxMap.setFeatureState(_:state:callback:)` with a `FeaturesetFeatureType`                                                 | A `GeoJSONSource` rewritten with changed feature properties on each tap              |
| MAPSIOS-A2.2   | Set state by source and id                                   | `mapboxMap.setFeatureState(sourceId:sourceLayerId:featureId:state:callback:)`                                                 | Same                                                                                 |
| MAPSIOS-A2.3   | Read state in a layer                                        | `Exp(.featureState) { "key" }` in a layer property                                                                            | A separate overlay layer added and removed to show a selection                       |
| MAPSIOS-A2.4   | Read, clear, reset                                           | `getFeatureState`, `removeFeatureState`, `resetFeatureStates`                                                                 | Selection tracked only in Swift, with the source rebuilt to show it                  |
| MAPSIOS-A2.5   | Typed state for Standard buildings **[Standard-style-only]** | `setFeatureState(buildingFeature, state: .init(highlight: true))` or `.init(select: true)` — `StandardBuildingsFeature.State` | A hand-made selection layer with a copy of the building geometry                     |
| MAPSIOS-A2.6   | Feature state in SwiftUI                                     | `FeatureState(feature, .init(...))` inside `Map { ... }`                                                                      | A `@State` selection that rebuilds a whole source in `body`                          |
| MAPSIOS-A2.7   | Stable feature ids (needed for feature state)                | `GeoJSONSource.promoteId2`, `VectorSource.promoteId2`, or `GeoJSONSource.generateId`                                          | Deprecated `promoteId`; or features with no id, which makes feature state impossible |
| MAPSIOS-A2.8 ★ | State for many features at once                              | `setFeatureStateExpression(...)`, `removeFeatureStateExpression(...)`, `resetFeatureStateExpressions(...)` — since `11.17.0`  | A loop calling `setFeatureState` once per feature over a large set                   |

### MAPSIOS-A3. Style Import Config API

To switch visual modes (day/night and similar), change the config of an imported style (including Standard). Do not reload the style.

Two routes, both fine:

- **Declarative (preferred).** Assign a `MapStyle` to `mapboxMap.mapStyle` (UIKit) or use `.mapStyle(_:)` (SwiftUI). If the URI or JSON is the **same** and only `configuration` changes, the SDK applies only the config change. The style is **not** reloaded. So setting `mapStyle` from a SwiftUI `body` or a state observer is safe.
- **Imperative.** Call `setStyleImportConfigProperty` / `setStyleImportConfigProperties`.

| ID           | Functionality                    | Key API symbols                                                                                           | "Not yet using it" looks like                                      |
| ------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| MAPSIOS-A3.1 | Change config declaratively      | `mapboxMap.mapStyle = .standard(lightPreset: .night)`; SwiftUI `.mapStyle(.standard(lightPreset: .dusk))` | `loadStyle(_:)` with a different URI on each mode change           |
| MAPSIOS-A3.2 | Change one config property       | `mapboxMap.setStyleImportConfigProperty(for:config:value:)`                                               | Same                                                               |
| MAPSIOS-A3.3 | Change several at once           | `mapboxMap.setStyleImportConfigProperties(for:configs:)`                                                  | Several `setStyleImportConfigProperty` calls in a row              |
| MAPSIOS-A3.4 | Force a reload when truly needed | `StyleReloadPolicy.always` (since `11.17.0`)                                                              | A cache-busting query parameter added to the URI to force a reload |

### MAPSIOS-A4. Standard Style Config Parameters **[Standard-style-only]**

`MapStyle.standard(...)` and `MapStyle.standardSatellite(...)` expose Standard's config as typed Swift parameters. Set them through `MapStyle` or the import config API (MAPSIOS-A3), not through a style reload.

On an SDK older than a row's "Since" version, the parameter is missing from `MapStyle.standard(...)`. Do not flag its absence. The same config key may still be set with `setStyleImportConfigProperty(for:config:value:)` if the loaded Standard style supports it.

| Parameter                                                                                   | Effect                                                                       | Since     | Wrong pattern                                                    |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| `lightPreset:`                                                                              | `.dawn` / `.day` / `.dusk` / `.night`                                        | `11.0.0`  | Swapping a day URI for a night URI                               |
| `theme:`                                                                                    | `.default` / `.faded` / `.monochrome`                                        | `11.6.0`  | Overlay layers or post-processing to tint the map                |
| `themeData:`                                                                                | A custom LUT for `theme: .custom`                                            | `11.10.0` | Overlay layers or post-processing to tint the map                |
| `showLandmarkIcons:`                                                                        | Show or hide landmark icons                                                  | `11.13.0` | A custom `SymbolLayer` that copies landmark icons                |
| `colorBuildingHighlight:`, `colorBuildingSelect:`                                           | Look of the building `highlight` / `select` states (pairs with MAPSIOS-A2.5) | `11.13.0` | A hand-made selection layer with a copy of the building geometry |
| `showIndoor:`, `showIndoorLabels:`, `colorIndoorLabelHighlight:`, `colorIndoorLabelSelect:` | Indoor maps in supported venues                                              | `11.25.0` | A custom indoor overlay                                          |

### MAPSIOS-A5. Declarative Style Content

`setMapStyleContent { ... }` (UIKit) and the `Map { ... }` content closure (SwiftUI) let the app declare its sources, layers, imports, and images. The SDK compares that with the live style and applies only the difference, and re-applies it after a style reload.

| ID           | Functionality             | Key API symbols                                                                | "Not yet using it" looks like                                                           |
| ------------ | ------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| MAPSIOS-A5.1 | Declare content (UIKit)   | `mapboxMap.setMapStyleContent { GeoJSONSource(id:)…; LineLayer(id:source:)… }` | A long `onStyleLoaded` handler calling `addSource` / `addLayer` behind existence checks |
| MAPSIOS-A5.2 | Content driven by state   | `if` / `else` inside the builder, re-run on state change                       | `addLayer` / `removeLayer` pairs driven by app state (MAPSIOS-B-STYLE-2)                |
| MAPSIOS-A5.3 | Declare content (SwiftUI) | Sources, layers, `StyleImport` inside `Map { ... }`                            | A `UIViewRepresentable` whose `updateUIView` re-adds layers                             |

Declarative styling is not required. A clean imperative integration is not a finding. Recommend it only when the right-hand column matches.

### MAPSIOS-A6. Partial GeoJSON Source Updates

Replacing a whole `GeoJSONSource` re-parses and re-tiles every feature. Partial updates touch only the named features.

| ID           | Functionality             | Key API symbols                                                         | "Not yet using it" looks like                              |
| ------------ | ------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| MAPSIOS-A6.1 | Add features              | `mapboxMap.addGeoJSONSourceFeatures(forSourceId:features:dataId:)`      | The whole collection rebuilt to add one feature            |
| MAPSIOS-A6.2 | Update features           | `mapboxMap.updateGeoJSONSourceFeatures(forSourceId:features:dataId:)`   | The whole collection rebuilt to change one feature         |
| MAPSIOS-A6.3 | Remove features           | `mapboxMap.removeGeoJSONSourceFeatures(forSourceId:featureIds:dataId:)` | The whole collection rebuilt with one feature filtered out |
| MAPSIOS-A6.4 | Full replacement          | `updateGeoJSONSource(withId:data:dataId:)` / `(withId:geoJSON:dataId:)` | Correct for replacing the whole dataset — not a finding    |
| MAPSIOS-A6.5 | Know when data is applied | `dataId:` plus `onSourceDataLoaded`                                     | A fixed delay used to guess that the data is in            |

### MAPSIOS-A7. ViewAnnotation Class API

The `ViewAnnotation` class is the current view-annotation API. You change an annotation **in place** through its properties. The older `UIView`-keyed methods on `ViewAnnotationManager` are **deprecated**: `add(_:options:)`, `add(_:id:options:)`, `update(_:options:)`, `remove(_:)`, `options(for:)`, and the `annotations` dictionary. Any use is a finding.

| ID             | Functionality                    | Key API symbols                                                                                                                                                                                            | "Not yet using it" looks like                                                      |
| -------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| MAPSIOS-A7.1   | Create and add                   | `ViewAnnotation(annotatedFeature:view:)`, then `mapView.viewAnnotations.add(_:)`                                                                                                                           | Deprecated `viewAnnotations.add(view, options: ViewAnnotationOptions(...))`        |
| MAPSIOS-A7.2   | Move in place                    | `annotation.annotatedFeature = .geometry(...)` (or `.layerFeature(...)`)                                                                                                                                   | `remove` then `add` to change the coordinate                                       |
| MAPSIOS-A7.3   | Change look or behavior in place | `annotation.visible`, `.priority`, `.allowOverlap`, `.allowOverlapWithPuck`, `.ignoreCameraPadding`, `.variableAnchors`, `.minZoom`, `.maxZoom`                                                            | Deprecated `update(view, options:)`                                                |
| MAPSIOS-A7.4   | Remove                           | `annotation.remove()`                                                                                                                                                                                      | Deprecated `viewAnnotations.remove(view)`                                          |
| MAPSIOS-A7.5   | React to placement               | `annotation.onVisibilityChanged`, `.onAnchorChanged`, `.onAnchorCoordinateChanged`, `.onFrameChanged`                                                                                                      | App code that projects coordinates to screen points on every camera change         |
| MAPSIOS-A7.6   | Re-measure after content resize  | `annotation.setNeedsUpdateSize()`                                                                                                                                                                          | Remove and re-add just to pick up a new size                                       |
| MAPSIOS-A7.7   | List annotations                 | `mapView.viewAnnotations.allAnnotations`                                                                                                                                                                   | Deprecated `annotations` dictionary, or a parallel `[UIView: ...]` map in app code |
| MAPSIOS-A7.8 ★ | Avoid overlap with map content   | `annotation.enableSymbolLayerCollision`, `annotation.enableAvoidRegions` (since `11.26.0`); `viewAnnotations.viewAnnotationAvoidLayers` (since `11.10.0`), `.viewAnnotationAvoidRegions` (since `11.26.0`) | App-side hit testing to hide annotations that collide with labels or UI            |

### MAPSIOS-A8. SwiftUI Map Access

| ID           | Functionality     | Key API symbols                                              | "Not yet using it" looks like                                         |
| ------------ | ----------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| MAPSIOS-A8.1 | Imperative access | `MapReader { proxy in Map() }`, `proxy.map` (a `MapboxMap?`) | A `MapView` reference passed out of a representable into a view model |

### MAPSIOS-A9. Annotation Clustering

`ClusterOptions` groups nearby points into clusters on-device.

| ID           | Functionality        | Key API symbols                                                                       | "Not yet using it" looks like                               |
| ------------ | -------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| MAPSIOS-A9.1 | Clustering (UIKit)   | `mapView.annotations.makePointAnnotationManager(id:layerPosition:clusterOptions:)`    | Large, dense point sets with no clustering                  |
| MAPSIOS-A9.2 | Cluster taps         | `onClusterTap:` / `onClusterLongPress:` parameters, `AnnotationClusterGestureContext` | `queryRenderedFeatures` against the generated cluster layer |
| MAPSIOS-A9.3 | Clustering (SwiftUI) | `PointAnnotationGroup(...)` with `.clusterOptions(_:)`                                | A flat list of many `PointAnnotation` values                |

### MAPSIOS-A10. Viewport API

The viewport owns the camera for ongoing behaviors — following the puck, or framing a geometry — and the transitions between them. Moving the camera by hand from location updates re-creates this and fights the SDK's own animation.

| ID            | Functionality            | Key API symbols                                                                                                                                              | "Not yet using it" looks like                                                                               |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| MAPSIOS-A10.1 | Follow the puck (UIKit)  | `mapView.viewport.makeFollowPuckViewportState(options:)` + `viewport.transition(to:transition:completion:)`                                                  | `setCamera(to:)` or `camera.ease(to:duration:)` on every location update                                    |
| MAPSIOS-A10.2 | Frame a geometry (UIKit) | `viewport.makeOverviewViewportState(options:)`                                                                                                               | Bounds computed by hand, plus a manual animation on each data change                                        |
| MAPSIOS-A10.3 | Transitions and idle     | `makeDefaultViewportTransition(options:)`, `makeImmediateViewportTransition()`, `viewport.idle()`, `viewport.status`, `addStatusObserver(_:)`                | An "is following" `Bool` in app code, with animations cancelled by hand                                     |
| MAPSIOS-A10.4 | SwiftUI                  | `Viewport.followPuck(zoom:bearing:pitch:)`, `.overview(geometry:)`, `.camera(center:zoom:bearing:pitch:)`, `.idle`, `.styleDefault`; `withViewportAnimation` | `CameraOptions` computed in `body` and pushed through `setCamera`                                           |
| MAPSIOS-A10.5 | One-off moves            | `mapView.camera.ease(to:duration:)`, `.fly(to:duration:)`, `makeAnimator(...)`                                                                               | Correct for one-off moves — not a finding. Flag only when used to build ongoing follow or overview behavior |

### MAPSIOS-A11. Snapshotter

`Snapshotter` renders a map image off-screen, without a `MapView`.

| ID            | Functionality        | Key API symbols                                                                          | "Not yet using it" looks like                                                |
| ------------- | -------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| MAPSIOS-A11.1 | Off-screen map image | `Snapshotter(options:)`, `start(overlayHandler:completion:)`                             | A hidden `MapView` captured with `UIGraphicsImageRenderer` / `drawHierarchy` |
| MAPSIOS-A11.2 | Style the snapshot   | `Snapshotter` supports the same style APIs: `mapStyle`, `setMapStyleContent`, `addLayer` | A live `MapView` kept only to render thumbnails or share images              |

### MAPSIOS-A12. Offline

Narrow scope: find apps still on the **legacy** offline API and point them to the replacement. Offline strategy, cache size, and region shape are product decisions and out of scope.

| ID            | Functionality | Key API symbols                                                                                                                                                                    | "Not yet using it" looks like                                                                                               |
| ------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| MAPSIOS-A12.1 | Tile regions  | `TileStore.default`, `loadTileRegion(forId:loadOptions:progress:completion:)`, `offlineManager.createTilesetDescriptor(for:)`, `TilesetDescriptorOptions`, `TileRegionLoadOptions` | Any use of `OfflineRegionManager`, `OfflineRegion`, `OfflineRegionGeometryDefinition` (all deprecated, MAPSIOS-B-OFFLINE-1) |
| MAPSIOS-A12.2 | Style packs   | `OfflineManager.loadStylePack(for:loadOptions:progress:completion:)`, or `stylePackOptions:` in `TilesetDescriptorOptions`; `StylePackLoadOptions`                                 | Tile regions downloaded with neither, so style, sprites, and fonts still need the network                                   |

---

## Part B — Performance & Correctness Antipatterns

These are not missing features. They are ways of using the SDK that are known to be expensive or unsafe.

### Runtime Styling (MAPSIOS-B-STYLE-\*)

Every style change makes the renderer re-evaluate the affected layer, or re-tile for source changes. How often it happens matters most.

#### MAPSIOS-B-STYLE-1. Style writes in a hot path

Only flag this when the writes are **frequent**: inside a camera-change observer, gesture handler, `CADisplayLink`, location-update handler, or a timer/publisher faster than every 50 ms. A few writes on a discrete user action are fine.

Three shapes:

- **`updateLayer(withId:type:update:)` per frame.** It reads the whole layer, decodes it, runs the closure, and writes **every** property back. Fine for a one-off edit; wasteful for one property many times per second.
- **Many `setLayerProperty` calls on one layer**, one after another. Each is a separate call into the renderer. Use one `setLayerProperties(for:properties:)` call. Same for import config: use `setStyleImportConfigProperties(for:configs:)`.
- **An expression rebuilt on every update** when only an input changes, or a large JSON value re-assigned each time.

```swift
// Avoid — whole-layer read and write-back on every camera frame
mapboxMap.onCameraChanged.observe { [weak self] _ in
    try? self?.mapboxMap.updateLayer(withId: "route", type: LineLayer.self) { layer in
        layer.lineWidth = .constant(self?.currentWidth ?? 4)
    }
}.store(in: &cancelables)

// Prefer — if the value depends on zoom, set an expression once when creating the layer.
// No per-frame call at all.
var route = LineLayer(id: "route", source: "route-source")
route.lineWidth = .expression(Exp(.interpolate) { Exp(.linear); Exp(.zoom); 10; 2; 16; 8 })
try mapboxMap.addLayer(route)

// Prefer — if one value must change at runtime, write only that property
try mapboxMap.setLayerProperty(for: "route", property: "line-width", value: currentWidth)
```

For per-feature values, use feature state (MAPSIOS-A2) instead of rewriting layer properties.

Note: `setLayerProperty(for:property:value:)` takes a JSON-compatible value (number, string, array). Passing an `Exp` value directly is not supported. Set expressions through a typed layer, or pass the JSON array form.

#### MAPSIOS-B-STYLE-2. Add/remove layer to show or hide it

Calling `addLayer` / `removeLayer` on the same layer id again and again to show and hide it:

```swift
// Avoid — changes the style structure on each toggle
try mapboxMap.removeLayer(withId: "traffic")
// ... later ...
try mapboxMap.addLayer(trafficLayer)

// Prefer — change visibility
try mapboxMap.setLayerProperty(for: "traffic", property: "visibility", value: "none")
try mapboxMap.setLayerProperty(for: "traffic", property: "visibility", value: "visible")
```

If app state drives the toggle, declarative content (MAPSIOS-A5.2) is another good fix.

#### MAPSIOS-B-STYLE-3. Style reload to switch modes

Calling `loadStyle(_:)`, or assigning a `MapStyle` with a **different URI**, to switch visual modes (day/night, traffic on/off):

```swift
// Avoid — drops every source, layer, and image, then rebuilds everything
mapboxMap.loadStyle(isNight ? nightStyleURI : dayStyleURI)

// Prefer — same URI, different config: only the config change is applied
mapboxMap.mapStyle = .standard(lightPreset: isNight ? .night : .day)
// or
try mapboxMap.setStyleImportConfigProperty(for: "basemap", config: "lightPreset", value: "night")
```

**Do not flag** a `mapStyle` assignment just because it runs often (for example, in a SwiftUI `body`). It reloads only when the URI or JSON changes, or with `StyleReloadPolicy.always`. Check whether the URI actually differs.

The config fix only works if the style has import config (Standard does; a custom style may not). If it does not, report the reload, but do not recommend switching to Standard.

#### MAPSIOS-B-STYLE-4. Style image re-added again and again

```swift
// Avoid — converts and replaces the image every time, even if nothing changed
try mapboxMap.addImage(pinImage, id: "pin")

// Prefer — add once after the style loads, then reuse the id
```

Also flag `addImage` in a camera-change or display-link callback, and a new `UIImage` created per `addImage` call. (`UIImage(named:)` is cached, but `addImage` still converts and replaces the image on each call.)

#### MAPSIOS-B-STYLE-5. Whole source rewritten for a small change

Replacing a whole `GeoJSONSource` when only one feature changed — either to show UI state, or to add, move, or remove one item:

```swift
// Avoid — re-parses and re-tiles every feature to flip one flag
let updated = features.map { f -> Feature in
    var f = f
    if f.identifier == .string(tappedId) { f.properties?["selected"] = true }
    return f
}
mapboxMap.updateGeoJSONSource(withId: "pois", geoJSON: .featureCollection(.init(features: updated)))

// Prefer, for UI state — feature state (MAPSIOS-A2)
mapboxMap.setFeatureState(sourceId: "pois", featureId: tappedId, state: ["selected": true]) { _ in }

// Prefer, for a real data change — a partial update (MAPSIOS-A6)
mapboxMap.updateGeoJSONSourceFeatures(forSourceId: "pois", features: [changedFeature])
```

Feature state needs stable feature ids (MAPSIOS-A2.7).

#### MAPSIOS-B-STYLE-6. Global map settings changed per frame

These are meant for discrete state changes: `setLights(...)`, `setTerrain(_:)`, `setAtmosphere(_:)`, `setProjection(_:)`, ★ `setSnow(_:)`, ★ `setRain(_:)`, and assignments to `mapboxMap.prefetchZoomDelta`. Flag any of them in a camera-change observer, display link, or location-update handler.

#### MAPSIOS-B-STYLE-7. Large GeoJSON decoded on the main thread

`GeoJSONSourceData.string(_:)` accepts **a URL or an inline GeoJSON string**. The SDK loads and parses it off the main thread. An app that decodes a large payload into a `FeatureCollection` on the main thread moves that cost onto the thread that also drives the UI.

```swift
// Avoid — a multi-MB decode on the main thread
let collection = try JSONDecoder().decode(FeatureCollection.self, from: data)
mapboxMap.updateGeoJSONSource(withId: "pois", geoJSON: .featureCollection(collection))

// Prefer, if the data is hosted — give the SDK the URL
mapboxMap.updateGeoJSONSource(withId: "pois", data: .string("https://example.com/pois.geojson"))

// Prefer, if the app must fetch it — decode off the main thread, apply on the main thread (MAPSIOS-B-HYGIENE-2)
```

Do not flag small collections built in code.

---

### Annotation API (MAPSIOS-B-ANNOT-\*)

#### MAPSIOS-B-ANNOT-1. Manager created again on each data update

```swift
// Avoid — a new manager (new source and layer) on each update
let manager = mapView.annotations.makePointAnnotationManager()
manager.annotations = newAnnotations
```

Create the manager once, keep it in a property, and assign `manager.annotations` to update. Notes:

- `make*AnnotationManager(id:)` uses a **random** id by default. Each call adds a new source and layer, and old ones stay until `removeAnnotationManager(withId:)`.
- Reusing an explicit id removes the old manager and logs a warning. No leak, but the source and layer are rebuilt each time.

#### MAPSIOS-B-ANNOT-2. Changing `manager.annotations` one item at a time in a loop

```swift
// Avoid — each append copies the whole array and re-checks it for duplicates: O(n²) overall
for poi in pois {
    manager.annotations.append(PointAnnotation(coordinate: poi.coordinate))
}

// Prefer — build the array, assign once
manager.annotations = pois.map { PointAnnotation(coordinate: $0.coordinate) }
```

The manager syncs its source at most once per display frame, so the loop does not cause one render per item. The cost is the array work.

Also flag `manager.annotations = manager.annotations + [x]` inside a loop.

#### MAPSIOS-B-ANNOT-3. A unique image name per annotation for a shared icon

The manager registers one style image per distinct image **name**. A shared name is added once. A unique name per item adds a copy of the same bitmap for every annotation.

```swift
// Avoid — one style image per annotation
a.image = .init(image: pinImage, name: "pin-\(poi.id)")

// Prefer — one shared name
a.image = .init(image: pinImage, name: "pin")
```

Note: after an image name is registered, a different `UIImage` under the same name is ignored. Use a new name when the picture really changes.

Also flag a new `UIImage` decode or `UIGraphicsImageRenderer` render inside the loop that builds annotations.

#### MAPSIOS-B-ANNOT-4. No clustering on a large, dense point set

A `PointAnnotationManager` (or SwiftUI `PointAnnotationGroup`) with many hundreds of overlapping points and no `ClusterOptions` (MAPSIOS-A9). Raise it as a question, with low confidence: clustering is also a UX choice, and the renderer can draw many symbols.

---

### View Annotation API (MAPSIOS-B-VANN-\*)

#### MAPSIOS-B-VANN-1. Deprecated `UIView`-keyed view-annotation API

Any use of `viewAnnotations.add(_:options:)`, `add(_:id:options:)`, `update(_:options:)`, `remove(_:)`, `options(for:)`, or the `annotations` dictionary (MAPSIOS-A7).

```swift
// Avoid — deprecated
try mapView.viewAnnotations.add(calloutView, options: ViewAnnotationOptions(annotatedFeature: .geometry(point)))

// Prefer
let annotation = ViewAnnotation(annotatedFeature: .geometry(point), view: calloutView)
mapView.viewAnnotations.add(annotation)
```

#### MAPSIOS-B-VANN-2. Remove and re-add instead of changing in place

```swift
// Avoid
annotation.remove()
mapView.viewAnnotations.add(ViewAnnotation(annotatedFeature: .geometry(newPoint), view: calloutView))

// Prefer (MAPSIOS-A7.2, MAPSIOS-A7.3)
annotation.annotatedFeature = .geometry(newPoint)
```

Also flag:

- Remove and re-add done only to pick up a new size — use `setNeedsUpdateSize()` (MAPSIOS-A7.6).
- `visible` toggled in a hot path to hide overlapping annotations by hand — `allowOverlap` and `priority` do this.

#### MAPSIOS-B-VANN-3. Too many view annotations on screen

More than about 50 view annotations visible at once. Each is a real `UIView` that is laid out and moved on every camera change. The SDK hides annotations that are off-screen or not placed, so the cost comes from the visible ones. Recommend:

- Icon-only annotations → a `PointAnnotationManager` or `SymbolLayer` (GPU-rendered, scales to thousands).
- Label-only annotations (one line of text, no interaction) → a `SymbolLayer` with `textField`, `textColor`, `textHaloColor`, and built-in collision.
- Keep view annotations for content that needs UIKit: rich layout, interactive subviews, custom animation.

---

### Camera & Viewport (MAPSIOS-B-CAMERA-\*)

Three kinds of camera API:

- `setCamera(to:)` jumps the camera at once. No animation.
- `ease(to:duration:)` and `fly(to:duration:)` run a one-off animation. A new `ease`/`fly` cancels the previous one.
- `viewport` owns ongoing behaviors (follow puck, overview) and the transitions between them.

#### MAPSIOS-B-CAMERA-1. Puck following written by hand

A location observer that moves the camera on every update re-creates `FollowPuckViewportState`, and fights the puck animation. The puck is smoothed between updates; the hand-driven camera is not, so the two drift apart at speed.

```swift
// Avoid — a camera jump on every location update
mapView.location.onLocationChange.observe { [weak self] locations in
    guard let l = locations.last else { return }
    self?.mapView.mapboxMap.setCamera(to: CameraOptions(center: l.coordinate, zoom: 16))
}.store(in: &cancelables)

// Prefer — the viewport owns the behavior
let follow = mapView.viewport.makeFollowPuckViewportState(
    options: FollowPuckViewportStateOptions(zoom: 16, bearing: .course))
mapView.viewport.transition(to: follow)
```

SwiftUI: `Viewport.followPuck(zoom:bearing:pitch:)` through `Map(viewport:)` (MAPSIOS-A10.4).

Flag `setCamera`, `ease`, or `fly` called from `onLocationChange`, a `CLLocationManagerDelegate` callback, or a puck-related publisher. Also flag an "is following" `Bool` with `cancelAnimations()` calls around it — that is `viewport.status` / `viewport.idle()` written by hand (MAPSIOS-A10.3).

FP risk: following a target that is **not** the puck (a vehicle from the app's own data) is not covered by `FollowPuckViewportState`. Do not put it in the findings table. Mention it in one line under "Checked, not flagged", and suggest a custom `ViewportState`.

#### MAPSIOS-B-CAMERA-2. Camera animation written by hand with a timer

`setCamera(to:)` does not animate. Stepping toward a target with a `CADisplayLink` or `Timer` and calling `setCamera` each tick re-creates what the animators already do, with worse timing and no gesture handling.

Flag `setCamera` in a `CADisplayLink` target, a `Timer` block, a `DispatchSourceTimer`, or an `onRenderFrameFinished` / `onCameraChanged` observer. Recommend `ease(to:duration:curve:)`, `fly(to:duration:)`, or `makeAnimator(...)` when the app needs its own animation.

Do not flag a single `setCamera` used to jump the camera.

#### MAPSIOS-B-CAMERA-3. Camera animator from `makeAnimator` not kept by the app

**A correctness bug.** The SDK holds a camera animator strongly only while it runs. Before start, and after it stops **or pauses**, the app must hold it. If not, the animator is freed and start or resume does nothing — no error, no log.

```swift
// Avoid — freed at once, never starts
weak var zoomAnimator: BasicCameraAnimator?
zoomAnimator = mapView.camera.makeAnimator(duration: 1, curve: .easeInOut) { transition in
    transition.zoom.toValue = 16
}
zoomAnimator?.startAnimation()   // already nil

// Prefer — a strong property for as long as it may be paused or resumed
private var zoomAnimator: BasicCameraAnimator?
```

Flag:

- A `makeAnimator(...)` result stored straight into a `weak` var or dropped with `_ =`. High confidence.
- A paused animator held only weakly or looked up through `camera.cameraAnimators`. High confidence when `pauseAnimation()` is called on it.

Do not flag:

- A local `let animator` paused and resumed in the same scope — the local keeps it alive.
- An animator started while the app still holds it (`makeAnimator(...).startAnimation()`, or a local), with or without `afterDelay:`, and never paused — the SDK holds it while it runs.

#### MAPSIOS-B-CAMERA-4. Camera moved from app code while a viewport state is active

While a viewport state (follow puck, overview) is active, it writes the camera on every frame. A `setCamera`, `ease`, `fly`, or a started `makeAnimator` animator from app code at the same time means two owners fight over the camera. Call `viewport.idle()` first, or make the move a viewport transition.

Flag an app-code camera write that can run while `viewport.transition(to:)` is active, with no `idle()` before it. Check for `viewport.status` handling before reporting with high confidence — the app may already sequence this correctly.

User gestures are not this finding: a pan moves the viewport to idle by default. Only if the app sets `ViewportOptions(transitionsToIdleUponUserInteraction: false)` do gestures and the viewport state share the camera, and that is usually intended for a custom state.

---

### Startup & Configuration (MAPSIOS-B-INIT-\*)

#### MAPSIOS-B-INIT-1. Default style loaded, then replaced after a delay

`MapView(frame:)` without `mapInitOptions:` starts loading Standard at once. If the app sets its real style only after an async step (remote config, a stored preference, a network call), both styles load on cold start.

```swift
// Avoid — Standard starts loading, then the real style replaces it later
let mapView = MapView(frame: view.bounds)
fetchConfig { config in mapView.mapboxMap.mapStyle = config.style }

// Prefer — pass the style (and the start camera) at creation, or create MapView once the style is known
let mapView = MapView(frame: view.bounds, mapInitOptions: MapInitOptions(
    cameraOptions: CameraOptions(center: start, zoom: 12),
    styleURI: .outdoors))
```

Do not flag a style set right after `MapView(frame:)` in the same function — the first request is cancelled before it costs much. Do not flag SwiftUI `Map` with `.mapStyle(_:)` — it passes the style in at creation. Low to medium confidence; raise as a question if cold-start time matters to the app.

---

### Offline (MAPSIOS-B-OFFLINE-\*)

#### MAPSIOS-B-OFFLINE-1. Legacy offline API

`OfflineRegionManager`, `OfflineRegion`, and `OfflineRegionGeometryDefinition` are deprecated as whole types. Any use is a finding. The replacement is `TileStore` plus `OfflineManager` (MAPSIOS-A12).

The migration is not a rename: legacy regions use a geometry and zoom range; tile regions use tileset descriptors, and style resources move into a separate style pack (MAPSIOS-A12.2). Report the finding and point to the catalog. Do not write a line-by-line rewrite.

Also flag tile regions downloaded without a style pack. Do not review region shape, zoom ranges, download triggers, or cache size — out of scope.

---

### Integration Hygiene (MAPSIOS-B-HYGIENE-\*)

#### MAPSIOS-B-HYGIENE-1. Dropped `AnyCancelable` — the observer stops at once

`Signal.observe` and `observeNext` (for example `mapboxMap.onStyleLoaded`, `onCameraChanged`, `location.onLocationChange`) return an `AnyCancelable`. It **cancels the subscription when it is released**. If the app does not keep it, the observer stops at once and silently. This is not a leak — the callback just never fires.

```swift
// Avoid — the token is released right away, so the observer is cancelled
_ = mapboxMap.onStyleLoaded.observe { [weak self] _ in self?.addLayers() }

// Prefer — keep the token as long as the subscription should live
private var cancelables = Set<AnyCancelable>()
mapboxMap.onStyleLoaded.observe { [weak self] _ in self?.addLayers() }
    .store(in: &cancelables)
```

Flag: `_ =` on an `observe` / `observeNext` result; a token kept in a local variable that goes out of scope; a token stored on an object that lives shorter than the map. (An unused result without `_ =` also gets a compiler warning.)

Do **not** apply this to the plain `Cancelable` returned by `queryRenderedFeatures`, `ease`, `fly`, `addInteraction`, and similar. Those do not cancel when released, and discarding them is fine.

#### MAPSIOS-B-HYGIENE-2. Map APIs used off the main thread

`MapboxMap`, style APIs, annotation managers, the gesture manager, and the viewport must be used on the main thread. Some methods are `@MainActor`. Using them from a background thread is unsafe.

Flag map calls from: a `DispatchQueue.global()` or custom queue, `Task.detached`, a `Task` not on the main actor, an `OperationQueue` operation, a `URLSession` completion handler with no switch back to the main queue, and a Combine pipeline with no `.receive(on: DispatchQueue.main)` before the map call.

A common case: data decoded off the main thread (correct), then applied to a source or annotation manager in the same closure (wrong).

#### MAPSIOS-B-HYGIENE-3. Retain cycles through map callbacks

The SDK keeps the callbacks the app gives it: annotation tap handlers, interaction actions, view-annotation callbacks, and `observe` handlers. A strong `self` (or a strong `MapView` / `MapboxMap`) in one of them can keep the whole screen alive.

```swift
// Avoid — the map keeps the handler, the handler keeps self, self keeps the map
annotation.tapHandler = { _ in
    self.showDetails()
    return true
}

// Prefer
annotation.tapHandler = { [weak self] _ in
    self?.showDetails()
    return true
}
```

Flag strong `self` in: `annotation.tapHandler` (and other annotation gesture handlers), `TapInteraction` / `LongPressInteraction` actions, `ViewAnnotation.onVisibilityChanged` / `.onAnchorChanged` / `.onAnchorCoordinateChanged` / `.onFrameChanged` (and ★ `.onDragCoordinateChanged` / `.onDraggingChanged`, since `11.31.0`), and `observe` handlers stored on `self`.

Do not flag the `setMapStyleContent { ... }` builder — it runs once and is not stored.

#### MAPSIOS-B-HYGIENE-4. `MapView` in a reused cell, or kept after its screen closes

`MapView` is a heavy, GPU-backed view. Two cases to report:

- **`MapView` inside a `UITableViewCell` / `UICollectionViewCell`.** Scrolling creates and destroys maps, and several can be alive at once. Recommend `Snapshotter` (MAPSIOS-A11) for static previews, and one full `MapView` on a detail screen. With a classic style, the [Static Images API](https://docs.mapbox.com/api/maps/static-images/) is another option: a plain image URL, no map rendering on the device. It does not support Standard, Standard Satellite, or styles that import them.
- **`MapView` stored beyond its screen** — in a singleton, a static property, or a view model that lives longer than the screen. The map and its caches stay in memory after the screen closes. Recommend that the view controller or SwiftUI view own the `MapView`, and that view models reach it through `MapReader` / `MapProxy` (MAPSIOS-A8.1).

#### MAPSIOS-B-HYGIENE-5. Style changed before the style is loaded

Layers, sources, or images added before the style finishes loading are wiped when the style arrives. The symptom: layers missing on first launch that appear after a later style change.

Flag: `addLayer` / `addSource` / `addImage` in `viewDidLoad` (or similar setup) with no `onStyleLoaded` wait; a fixed `asyncAfter` delay used instead of `onStyleLoaded`. Declarative content (MAPSIOS-A5) avoids this — it is safe to set at any time.

#### MAPSIOS-B-HYGIENE-6. Deprecated APIs — one sweep

Each row is deprecated and has a direct or near-direct replacement. Report them as **one table** under this ID: one row per deprecated symbol, with a call-site count. Do not report one finding per call site.

| Deprecated                                                                                                         | Replacement                                                                  | Note                                                                              |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `mapboxMap.style`, `Snapshotter.style`                                                                             | Style APIs directly on `MapboxMap` / `Snapshotter`                           | `mapboxMap.style.addLayer(l)` → `mapboxMap.addLayer(l)`                           |
| `mapboxMap.onNext(event:)`, `onEvery(event:)`                                                                      | Typed signals, e.g. `mapboxMap.onMapLoaded.observeNext { }` / `.observe { }` | Keep the returned token (MAPSIOS-B-HYGIENE-1)                                     |
| `loadStyleURI(_:completion:)`, `loadStyleJSON(_:completion:)`                                                      | `loadStyle(_:completion:)`, or `mapStyle` (MAPSIOS-A3)                       |                                                                                   |
| `setTileCacheBudget(_:)`                                                                                           | `setTileCacheBudget(size:)`                                                  |                                                                                   |
| `mapboxMap.debugOptions`                                                                                           | `mapView.debugOptions`                                                       | Different option type                                                             |
| `camera(for:padding:bearing:pitch:)`, and the `camera(for:)` overloads taking a `CoordinateBounds` or a `Geometry` | `camera(for:camera:coordinatesPadding:maxZoom:offset:)`                      | Takes coordinates and `throws` — not a pure rename                                |
| `presentsWithTransaction`                                                                                          | `presentationTransactionMode`                                                | See below                                                                         |
| `MapView.cameraState`, `MapView.anchor`                                                                            | `mapboxMap.cameraState`, `mapboxMap.anchor`                                  |                                                                                   |
| `LocationManager.override(...)` (three overloads)                                                                  | `LocationManager.dataModel` (a `LocationDataModel`)                          | Since `11.17.0`. On older SDKs `override(...)` is not deprecated — do not flag it |
| `Annotation.userInfo`                                                                                              | `customData`                                                                 |                                                                                   |
| `ViewAnnotation.selected`, `ViewAnnotationOptions.selected`, SwiftUI `MapViewAnnotation.selected(_:)`              | `priority`                                                                   |                                                                                   |
| `MapContentGestureContext`                                                                                         | `InteractionContext`                                                         | Comes with the interactions migration (MAPSIOS-A1)                                |
| `removeStyleImport(for:)`                                                                                          | `removeStyleImport(withId:)`                                                 |                                                                                   |
| `.payload` on an event (v10 leftover, e.g. `event.payload.id`)                                                     | The event itself: drop `.payload`                                            |                                                                                   |
| `MapLoadingError.error`                                                                                            | `.type`                                                                      |                                                                                   |
| `.id` on `SourceAdded`, `SourceRemoved`, `SourceDataLoaded`                                                        | `.sourceId`                                                                  |                                                                                   |
| `.id` on `StyleImageMissing`, `StyleImageRemoveUnused`                                                             | `.imageId`                                                                   |                                                                                   |
| `ResourceRequest.dataSource`                                                                                       | `.source`                                                                    |                                                                                   |
| SwiftUI `MapProxy.viewport`                                                                                        | `Map(viewport:)`                                                             |                                                                                   |
| SwiftUI `Viewport.inset(by:ignoringSafeArea:)`                                                                     | `Viewport.padding(_:)`                                                       | **Does nothing** — see below                                                      |

Two rows need more than a rename:

- **`presentsWithTransaction`.** Sync mode keeps views on top of the map in step with map movement. Async mode is faster, but these views jitter when the camera moves. `.automatic` (the default) uses sync only when the map has view annotations. `true` means `.sync`, `false` means `.async`.
  - `false`: view annotations jitter. Recommend `.automatic`.
  - `true`, and the app has no views of its own pinned to coordinates: recommend `.automatic`.
  - `true`, and the app moves its own views to follow coordinates (for example with `mapboxMap.point(for:)`): `.automatic` does not know about these views, so keep `.sync`.
- **`Viewport.inset(by:ignoringSafeArea:)`.** The deprecated method returns the viewport unchanged — it is a **no-op**. Code that calls it gets no inset. Report it as a correctness finding (the viewport ignores the padding the app asked for).

These have their own IDs and are not repeated here: the `UIView`-keyed view-annotation API (MAPSIOS-B-VANN-1), the old gesture callbacks (MAPSIOS-A1), `promoteId` (MAPSIOS-A2.7), and the legacy offline types (MAPSIOS-B-OFFLINE-1).

---

## Part C — Audit Prompts

Run the prompts below one at a time, in order.

Every prompt uses the **grounding rule**: only flag a finding when it matches Part A or B; tag uncertain items `[VERIFY WITH MAPBOX]`.

Record every finding in the **output schema**: `Prompt ID | File:line | Pattern observed | SDK equivalent (catalog ID) | Confidence | FP risk | Suggested change`. Put the extra details a prompt asks for in "Pattern observed". Inventories (MAPSIOS-P1, the deprecated-symbol table in MAPSIOS-P10, MAPSIOS-P11) are not findings and use the columns their prompt gives.

---

### Per-Prompt Reference

Use these to re-run one area after fixes, to stay within a context window, or to focus on one concern (for example, performance only: MAPSIOS-P5–MAPSIOS-P7).

#### MAPSIOS-P1. API Surface & Use Case Inventory

```
Apply the grounding rule.

MAPSIOS-P1a. List every Mapbox public API symbol used in this codebase, grouped by area:
- MapView / MapboxMap / style APIs
- SwiftUI: Map, MapReader, MapProxy, Viewport, map content types
- Interactions: TapInteraction, LongPressInteraction, FeaturesetDescriptor, queryRenderedFeatures
- Annotations: annotation managers and types, ViewAnnotation / ViewAnnotationManager
- Style primitives: layer and source types, Exp, StyleColor, addImage
- Location / puck, viewport, camera, Snapshotter
- MapboxCommon, Turf
Per group: symbol | call-site count | sample file:line | one-line usage summary.
Ignore tests, samples, and dead code.

MAPSIOS-P1b. For each Mapbox dependency (Package.swift / Podfile / project file):
product or pod | version | used? | purpose | removal candidate.
State the SDK version in use. Every later finding must be valid for that version.

MAPSIOS-P1c. For each map, state its UI surface: UIKit MapView, SwiftUI Map, or SwiftUI
wrapping UIKit. This decides which catalog entries apply.

MAPSIOS-P1d. List the main product features built on the map: name | 1–2 sentence
description | entry point file:line | Mapbox APIs used | custom rendering. Skip screens
where the map is only a background.

MAPSIOS-P1e. Summarize runtime customization: (1) what changes for day/night and what
triggers it; (2) what changes per app context; (3) what data is overlaid (live or static,
refresh rate, source); (4) what is interactive vs. visual only; (5) what persists across
sessions vs. is rebuilt per screen.
```

#### MAPSIOS-P2. Featureset Interactions (MAPSIOS-A1, MAPSIOS-A2)

```
Grounding: catalog MAPSIOS-A1, MAPSIOS-A2.

Find every tap or long-press handler on map features. Look for:
- queryRenderedFeatures called from a tap or long-press handler or gesture recognizer
- deprecated UIKit GestureManager.onMapTap / onMapLongPress / onLayerTap / onLayerLongPress
- deprecated SwiftUI onMapTapGesture / onMapLongPressGesture / onLayerTapGesture /
  onLayerLongPressGesture
- a UITapGestureRecognizer or UILongPressGestureRecognizer added directly to MapView
- SwiftUI .onTapGesture on Map, followed by a manual query

For each, decide the target:
- A Standard featureset (POI, buildings, place labels, landmark icons, indoor labels):
  recommend the typed interaction (MAPSIOS-A1.1–MAPSIOS-A1.4, MAPSIOS-A1.9). [Standard-style-only]
- A featureset from the app's own style: recommend .featureset(_:importId:) (MAPSIOS-A1.7).
- A custom layer: recommend TapInteraction(.layer("id")) (MAPSIOS-A1.5).
- The map itself: MAPSIOS-A1.6.
If the handler filters query results by hand, mention filter: / radius: (MAPSIOS-A1.8).

For selection highlights, recommend setFeatureState (MAPSIOS-A2.1, MAPSIOS-A2.2, any style);
for Standard targets, the typed State (MAPSIOS-A2.5) [Standard-style-only].

Do not flag queryRenderedFeatures used for non-interactive queries.

Report in the output schema. Also note the target: Standard featureset or custom layer id.
```

#### MAPSIOS-P3. Feature State & Source Updates (MAPSIOS-A2, MAPSIOS-A6, MAPSIOS-B-STYLE-5)

```
Grounding: catalog MAPSIOS-A2, MAPSIOS-A6; antipattern MAPSIOS-B-STYLE-5.

1. Find UI state (selected, hovered, highlighted, focused) shown by rewriting a
   GeoJSONSource: updateGeoJSONSource(withId:data:) / (withId:geoJSON:) or a
   GeoJSONSource.data assignment with changed feature properties after a UI event; or an
   extra overlay source kept only for selection. Recommend feature state (MAPSIOS-A2.1–A2.3).
2. Find whole-source replacement used for a small data change (add, move, or remove a few
   features). Recommend addGeoJSONSourceFeatures / updateGeoJSONSourceFeatures /
   removeGeoJSONSourceFeatures (MAPSIOS-A6.1–A6.3). Do not flag a real full-dataset swap.
3. For sources that need feature state, check for stable ids (promoteId2 or generateId,
   MAPSIOS-A2.7). Flag deprecated promoteId.
4. SwiftUI: find a @State selection that rebuilds a whole source in body. Recommend
   FeatureState inside Map { ... } (MAPSIOS-A2.6).
5. Find a loop calling setFeatureState once per feature over a large set. Recommend the
   feature state expression APIs (MAPSIOS-A2.8, since 11.17.0, experimental).
6. Find a fixed delay after a source update used to guess that the data is applied.
   Recommend dataId: plus onSourceDataLoaded (MAPSIOS-A6.5).

Report in the output schema. Also note the state or change, and the source and layer.
```

#### MAPSIOS-P4. Style Config, Reloads & Declarative Styling (MAPSIOS-A3, MAPSIOS-A4, MAPSIOS-A5, MAPSIOS-B-STYLE-3)

```
Grounding: catalog MAPSIOS-A3, MAPSIOS-A4, MAPSIOS-A5; antipattern MAPSIOS-B-STYLE-3.

If the app does not use Standard style, skip the [Standard-style-only] items. Do not
recommend switching to Standard.

1. List every loadStyle call, MapStyle assignment, and .mapStyle(_:) modifier: style,
   file:line.
2. Find style loads used to switch modes at runtime (day/night, traffic, and similar).
   A loadStyle call, or a MapStyle assignment with a DIFFERENT URI or JSON, is a
   MAPSIOS-B-STYLE-3 finding. A MapStyle assignment with the SAME URI and a different
   configuration is NOT a reload — do not flag it. Recommend the config route
   (MAPSIOS-A3.1, MAPSIOS-A3.2) only if the style has import config.
3. [Standard-style-only] Find every Standard config change. Check that each goes through
   MapStyle.standard(...) or setStyleImportConfigProperty (MAPSIOS-A3). Flag: done by a
   reload (MAPSIOS-B-STYLE-3); done per frame
   or per camera change. Respect the "Since" column in MAPSIOS-A4 and the SDK
   version from MAPSIOS-P1b. Also look for the "Wrong pattern" column of MAPSIOS-A4
   (tint overlays, copied landmark icons, a custom indoor overlay).
4. Look for imperative style bookkeeping: an onStyleLoaded handler that adds sources and
   layers behind existence checks, or add/remove pairs driven by app state. Where found,
   recommend declarative content (MAPSIOS-A5). Do not flag a clean imperative setup.
   Do not report add/remove pairs twice: they are reported in MAPSIOS-P5
   (MAPSIOS-B-STYLE-2). Here, only point to that finding and add the MAPSIOS-A5 option.
5. Find several setStyleImportConfigProperty calls in a row on one import. Recommend one
   setStyleImportConfigProperties call (MAPSIOS-A3.3). Hot-path cases belong to MAPSIOS-P5.
6. Find a cache-busting query parameter added to a style URI to force a reload. Recommend
   StyleReloadPolicy.always (MAPSIOS-A3.4, since 11.17.0).

Report in the output schema. Also note the config key or content.
```

#### MAPSIOS-P5. Runtime Styling Efficiency (MAPSIOS-B-STYLE-1, -2, -4, -6, -7)

```
Grounding: antipatterns MAPSIOS-B-STYLE-1, MAPSIOS-B-STYLE-2, MAPSIOS-B-STYLE-4,
MAPSIOS-B-STYLE-6, MAPSIOS-B-STYLE-7.

1. MAPSIOS-B-STYLE-1: in camera-change observers, gesture handlers, CADisplayLink,
   location-update handlers, and timers/publishers faster than 50 ms, find:
   updateLayer(withId:type:update:) calls; runs of setLayerProperty on one layer, or of
   setStyleImportConfigProperty on one import;
   expressions rebuilt on each update. Explain the cost (updateLayer reads and writes the
   whole layer). Recommend: an expression set once at layer creation, feature state, one
   setLayerProperties or setStyleImportConfigProperties call, or a single setLayerProperty.
   Do not flag one-off edits.
2. MAPSIOS-B-STYLE-2: find addLayer / removeLayer on the same layer id repeated at runtime.
   Recommend the visibility property, or declarative content.
3. MAPSIOS-B-STYLE-4: find addImage(_:id:) called again with the same id; addImage in a
   display-link or camera callback; a new UIImage created per addImage call.
4. MAPSIOS-B-STYLE-6: find setLights / setTerrain / setAtmosphere / setProjection /
   setSnow / setRain, or a prefetchZoomDelta assignment, run per frame or per camera change.
5. MAPSIOS-B-STYLE-7: find a JSONDecoder / JSONSerialization decode of a large GeoJSON
   payload on the main thread, feeding a GeoJSON source. Recommend passing the URL to
   GeoJSONSourceData.string, or decoding off the main thread. Do not flag small collections
   built in code.

Report in the output schema. Also note how often it runs.
```

#### MAPSIOS-P6. Annotation API Efficiency (MAPSIOS-A9, MAPSIOS-B-ANNOT-1–MAPSIOS-B-ANNOT-4)

```
Grounding: catalog MAPSIOS-A9; antipatterns MAPSIOS-B-ANNOT-1–MAPSIOS-B-ANNOT-4.

1. MAPSIOS-B-ANNOT-1: find every make*AnnotationManager call. Check it is created once and
   kept in a property. Flag: created again per data update; created with the default random
   id in code that runs more than once; never removed with removeAnnotationManager(withId:).
2. MAPSIOS-B-ANNOT-2: find append / insert / remove on manager.annotations inside a loop, or
   whole-array reassignment inside a loop. Recommend building the array and assigning once.
   State the cost correctly: the sync happens once per display frame, so the cost is O(n²)
   array copying and duplicate checks — NOT one render per item.
3. MAPSIOS-B-ANNOT-3: find a unique image name per annotation for a shared icon. Recommend
   one shared name. Flag image decoding or rendering inside the annotation-building loop.
4. MAPSIOS-B-ANNOT-4: note point managers (or SwiftUI PointAnnotationGroup) holding many
   hundreds of dense points with no clusterOptions. Raise as a low-confidence question.
5. Find queryRenderedFeatures against a generated cluster layer. Recommend onClusterTap /
   onClusterLongPress (MAPSIOS-A9.2).

Report in the output schema.
```

#### MAPSIOS-P7. View Annotation Efficiency (MAPSIOS-A7, MAPSIOS-B-VANN-1–MAPSIOS-B-VANN-3)

```
Grounding: catalog MAPSIOS-A7; antipatterns MAPSIOS-B-VANN-1–MAPSIOS-B-VANN-3.

1. MAPSIOS-B-VANN-1: find the deprecated UIView-keyed API: viewAnnotations.add(_:options:),
   add(_:id:options:), update(_:options:), remove(_:), options(for:), the annotations
   dictionary. Recommend the ViewAnnotation class (MAPSIOS-A7.1).
2. MAPSIOS-B-VANN-2: find remove + re-add used to change position, content, or size.
   Recommend changing annotatedFeature or properties in place (MAPSIOS-A7.2, MAPSIOS-A7.3),
   or setNeedsUpdateSize() for size (MAPSIOS-A7.6). Also flag `visible` toggled in a hot path
   to hide overlaps by hand — recommend allowOverlap / priority.
3. MAPSIOS-B-VANN-3: estimate the peak number of view annotations visible at once. Flag if
   over ~50. Recommend: icon-only → PointAnnotationManager / SymbolLayer; label-only →
   SymbolLayer with textField / textColor / textHaloColor.
4. Flag app code that projects coordinates to screen on camera change where
   onAnchorCoordinateChanged / onFrameChanged / onVisibilityChanged would do (MAPSIOS-A7.5).
5. Find app-side hit testing that hides view annotations colliding with labels or UI.
   Recommend the avoid-overlap APIs (MAPSIOS-A7.8; check the versions in that row).

Report in the output schema.
```

#### MAPSIOS-P8. Integration Hygiene (MAPSIOS-B-HYGIENE-1–MAPSIOS-B-HYGIENE-5)

```
Grounding: catalog MAPSIOS-A8, MAPSIOS-A11; antipatterns MAPSIOS-B-HYGIENE-1–MAPSIOS-B-HYGIENE-5.

1. MAPSIOS-B-HYGIENE-1: find every observe / observeNext call. Flag a token dropped with
   `_ =`, kept in a local that goes out of scope, or stored on a shorter-lived object. State
   the effect correctly: AnyCancelable cancels when released, so the observer stops firing —
   it does not leak. Recommend .store(in:) into a kept Set<AnyCancelable>. Do NOT flag the
   plain Cancelable from queryRenderedFeatures, ease, fly, or addInteraction.
2. MAPSIOS-B-HYGIENE-2: find MapboxMap, style, annotation manager, gesture, or viewport calls
   from DispatchQueue.global() or a custom queue, Task.detached, a Task not on the main actor,
   an OperationQueue, a URLSession completion with no main-queue hop, or a Combine pipeline
   with no .receive(on: DispatchQueue.main).
3. MAPSIOS-B-HYGIENE-3: find strong self (or strong MapView / MapboxMap) in annotation tap
   handlers, interaction actions, ViewAnnotation callbacks, or observe handlers stored on
   self. Recommend [weak self]. Do not flag the setMapStyleContent builder.
4. MAPSIOS-B-HYGIENE-4: find MapView inside a table or collection view cell (recommend
   Snapshotter for previews, or the Static Images API if the style does not use or import
   Standard), and MapView stored in a singleton, static property, or
   long-lived view model (recommend MapReader / MapProxy). Also find a hidden MapView
   captured with UIGraphicsImageRenderer or drawHierarchy (recommend Snapshotter, MAPSIOS-A11.1).
5. MAPSIOS-B-HYGIENE-5: find addLayer / addSource / addImage with no onStyleLoaded wait, or
   an asyncAfter delay used instead of onStyleLoaded.

Report in the output schema.
```

#### MAPSIOS-P9. Camera & Viewport (MAPSIOS-A10, MAPSIOS-B-CAMERA-1–MAPSIOS-B-CAMERA-4)

```
Grounding: catalog MAPSIOS-A10; antipatterns MAPSIOS-B-CAMERA-1–MAPSIOS-B-CAMERA-4.

1. MAPSIOS-B-CAMERA-1: find setCamera / ease / fly called from onLocationChange, a
   CLLocationManagerDelegate callback, or a puck-related publisher. Recommend
   makeFollowPuckViewportState + viewport.transition, or SwiftUI Viewport.followPuck
   (MAPSIOS-A10.1, MAPSIOS-A10.4). Also flag an "is following" Bool with cancelAnimations()
   around it (MAPSIOS-A10.3). If the target is not the puck, do not add a finding: mention it
   in one line under "Checked, not flagged" and suggest a custom ViewportState.
2. MAPSIOS-B-CAMERA-2: find setCamera inside a CADisplayLink, Timer, DispatchSourceTimer, or
   an onRenderFrameFinished / onCameraChanged observer. Recommend ease, fly, or makeAnimator.
   Do not flag a single setCamera jump.
3. MAPSIOS-B-CAMERA-3 (correctness bug): find makeAnimator results stored straight into a
   weak var or dropped with `_ =` (freed before start). Also find paused animators held only
   weakly or looked up through camera.cameraAnimators (the SDK lets go on pause, so resume
   does nothing). High confidence when pauseAnimation() is called.
   Do NOT flag a local paused and resumed in the same scope, or an animator started while the
   app holds it and never paused (including startAnimation(afterDelay:)).
4. MAPSIOS-B-CAMERA-4: find app-code camera writes (setCamera, ease, fly, a started
   makeAnimator animator) in code that can run while a viewport state is active, with no
   viewport.idle() first. Check for viewport.status handling before reporting with high
   confidence. Do not flag user gestures: they idle the viewport by default.
5. Find overview bounds computed by hand, with a camera animation on each data change.
   Recommend makeOverviewViewportState, or SwiftUI Viewport.overview (MAPSIOS-A10.2,
   MAPSIOS-A10.4).

Report in the output schema. Also note the trigger, and whether it is one-off or ongoing.
```

#### MAPSIOS-P10. Startup, Offline & Deprecated API (MAPSIOS-A12, MAPSIOS-B-INIT-1, MAPSIOS-B-OFFLINE-1, MAPSIOS-B-HYGIENE-6)

```
Grounding: catalog MAPSIOS-A12; antipatterns MAPSIOS-B-INIT-1, MAPSIOS-B-OFFLINE-1,
MAPSIOS-B-HYGIENE-6.

1. MAPSIOS-B-INIT-1: find MapView(frame:) with no mapInitOptions:, where the real style is set
   only after an async step (remote config, stored preference, network call). Recommend
   passing the style and start camera in MapInitOptions, or creating MapView once the style is
   known. Do not flag a style set in the same function right after creation, or SwiftUI Map.
   Low to medium confidence.
2. MAPSIOS-B-OFFLINE-1: find any use of OfflineRegionManager, OfflineRegion, or
   OfflineRegionGeometryDefinition. Recommend TileStore + OfflineManager (MAPSIOS-A12.1).
   Also flag tile regions downloaded with no style pack, neither loadStylePack nor
   stylePackOptions in TilesetDescriptorOptions (MAPSIOS-A12.2). Do not review
   region shape, zoom ranges, download triggers, or cache size.
3. MAPSIOS-B-HYGIENE-6: search for every deprecated symbol in the MAPSIOS-B-HYGIENE-6 table.
   Output ONE table: deprecated symbol | replacement | call-site count | sample file:line.
   For presentsWithTransaction, follow the cases under the MAPSIOS-B-HYGIENE-6 table. Report
   Viewport.inset(by:ignoringSafeArea:) as a correctness finding (it does nothing).
   Do not repeat call sites covered by MAPSIOS-B-VANN-1, MAPSIOS-P2's gesture callbacks,
   MAPSIOS-A2.7's promoteId, or MAPSIOS-B-OFFLINE-1.

Report findings in the output schema. The deprecated-symbol table from item 3 is separate.
```

#### MAPSIOS-P11. Open-Ended Review & Summary

```
Run last, so the summary can use all earlier findings.

MAPSIOS-P11a. List the 5 most frequent style-change code paths — setLayerProperty,
setLayerProperties, updateLayer, setSourceProperty, updateGeoJSONSource, addImage,
addLayer / removeLayer, setLights / setTerrain / setAtmosphere. Per path: how often it runs |
refactor opportunity | the single most useful change. Rank by render-thread savings. Keep the
app's current style; do not suggest switching to Standard.

MAPSIOS-P11b. Annotation manager inventory: manager | created at file:line | id (explicit or
default) | purpose | peak annotation count | update rate | could merge with another manager
of the same type.

MAPSIOS-P11c. Find hard-coded layer / source / image / featureset id strings. Group by id;
flag ids used in many places. Recommend a Swift enum or a struct of static constants.

MAPSIOS-P11d. Camera inventory: file:line | API (setCamera, ease, fly, makeAnimator,
viewport.transition, SwiftUI Viewport) | trigger | one-off or ongoing | owner (app or
viewport). Inventory only — do not repeat MAPSIOS-P9 findings.

MAPSIOS-P11e. As a senior Maps SDK engineer, list up to 10 things that look surprising,
off-pattern, or inconsistent, even if not clearly bugs. Per item: file:line | one-line
description | one question for the author.

MAPSIOS-P11f. Write a one-paragraph summary: size of the integration (rough lines of map
code, number of map screens), UIKit vs. SwiftUI split, main use case, top 3 efficiency
opportunities by impact, and v11 features the app should likely adopt. Do not include
switching to Standard style, or between UIKit and SwiftUI — both are design decisions and
out of scope.
```

---

### Style + Integration Artifacts

> **Collected by a person, not the agent.** The prompts check how app code uses the style. To judge what the style itself costs (expression complexity, layer count, sprite size, imports), also collect the items below. Keep them with the findings, and include them if the developer shares the findings with Mapbox.

**MAPSIOS-F1. Style URIs.** Every style URI the production app loads (for example `mapbox://styles/<owner>/<style-id>`), with the context for each (day/night, region).

**MAPSIOS-F2. Style JSON.** Download it with the Styles API: `GET https://api.mapbox.com/styles/v1/<owner>/<style-id>?access_token=<pk>`, then remove the token. Or print `mapView.mapboxMap.styleJSON` once after the style loads, in a debug build.

**MAPSIOS-F3. Style import config.** If the style uses imports: import ids, imported URIs, current config values, and where the app sets each (file:line). `getStyleImportConfigProperties(for:)` prints the current values in a debug build. If there are no imports, say so.

**MAPSIOS-F4. Runtime style-change log.** In a debug build, log every call to: `setLayerProperty` / `setLayerProperties`, `updateLayer`, `setSourceProperty`, `updateGeoJSONSource` and the partial-update methods, `addImage` / `removeImage`, `addLayer` / `addPersistentLayer` / `removeLayer` / `moveLayer`, `setLights` / `setTerrain` / `setAtmosphere` / `setProjection`, `setStyleImportConfigProperty`, `setMapStyleContent`, `mapStyle`, and `loadStyle`. Log time, call, target id, and value size, for one typical session. This is the most useful artifact for style cost.

**MAPSIOS-F5. Assets and profiling.** Custom images added with `addImage` (id, size, SDF, source); `GeoJSONSource` ids (peak feature count, update rate); custom layers. If possible, attach an Instruments Time Profiler trace of one typical map session.

---

### Reporting

For each prompt, record: prompt ID, finding count, the finding table, and any false positives (report these to Mapbox if you want to help improve the audit).

Priority order: **MAPSIOS-P5, P6, P7** (performance) > **MAPSIOS-P8, P9** (correctness) > **MAPSIOS-P2, P3, P4** (API modernization; their MAPSIOS-B-STYLE-3 and MAPSIOS-B-STYLE-5 findings count as performance) > **MAPSIOS-P10** (startup and deprecations) > **MAPSIOS-P11** (open-ended).
