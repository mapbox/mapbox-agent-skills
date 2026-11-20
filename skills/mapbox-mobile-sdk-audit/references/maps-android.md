# Maps SDK for Android: integration audit reference

**Target:** Maps SDK for Android (Kotlin)
**Minimum compatible version:** `11.13.0` — catalog entries are stable from this release unless a row names a higher version inline
**Validated against:** `11.30.1`

Entries marked ★ are experimental: check they exist in the app's SDK version before flagging. Entries that need a newer version than the minimum say so inline. Skip them on older SDKs.

IDs (`MAPS-…`) are stable. Cite them exactly in findings. Use the grounding rule, output schema and workflow from SKILL.md.

## Part A — v11 API Catalog

These are the modern v11 APIs that audits most commonly find missing or under-used. Each entry describes what the API provides, the key public symbols to search for, and what "not yet using it" looks like in app code.

### MAPS-A1. Featureset Interactions API

The Featureset Interactions API replaces `queryRenderedFeatures`-based tap handling for Standard style features (POIs, buildings, place labels, road labels) and for custom layers. The interactions APIs are stable since `11.13.0`. `mapboxMap.addInteraction(...)` still carries a leftover `@MapboxExperimental` annotation, which only produces a warning.

| ID        | Functionality                                                                      | Key API symbols                                                                                                                                                                                       | "Not yet using it" looks like                                                                                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MAPS-A1.1 | Tap handler for Standard POIs **[Standard-style-only]**                            | `ClickInteraction.standardPoi { poi, ctx -> }`, `mapboxMap.addInteraction(...)`                                                                                                                       | `queryRenderedFeatures` filtered by POI layer id in a click listener                                                                                                                                                             |
| MAPS-A1.2 | Tap handler for Standard buildings **[Standard-style-only]**                       | `ClickInteraction.standardBuildings { building, ctx -> }`                                                                                                                                             | Same, filtering for building layer id                                                                                                                                                                                            |
| MAPS-A1.3 | Tap handler for Standard place labels **[Standard-style-only]**                    | `ClickInteraction.standardPlaceLabels { label, ctx -> }`                                                                                                                                              | Same, filtering for place-label layer id                                                                                                                                                                                         |
| MAPS-A1.4 | Long-press handler for Standard features **[Standard-style-only]**                 | `LongClickInteraction.standardPoi { ... }`, `LongClickInteraction.standardBuildings { ... }`                                                                                                          | `addOnMapLongClickListener` + `queryRenderedFeatures`                                                                                                                                                                            |
| MAPS-A1.7 | Tap or long-press for the remaining Standard featuresets **[Standard-style-only]** | `ClickInteraction.standardLandmarkIcons { ... }` (**11.16.0+**), `ClickInteraction.standardIndoorLabels { ... }` (**11.25.0+**), and the `LongClickInteraction` equivalents                           | `queryRenderedFeatures` filtered by a landmark-icon or indoor-label layer id                                                                                                                                                     |
| MAPS-A1.5 | Tap or long-press handler for custom layers                                        | `ClickInteraction.layer("layer-id") { feature, ctx -> }`, `LongClickInteraction.layer(...)`                                                                                                           | `queryRenderedFeatures` against a custom layer string id in a click listener — **or with no layer filter at all** (`RenderedQueryOptions(null, null)`), which queries every layer in the style and is a superset of this pattern |
| MAPS-A1.6 | Tap or long-press on the map surface itself (no feature hit)                       | `ClickInteraction { ctx -> }` / `LongClickInteraction { ctx -> }` — Kotlin `operator invoke`; the Java-visible name is `ClickInteraction.map(...)`. Registers last, after all featureset interactions | The "nothing was hit" branch of a `queryRenderedFeatures` click handler. Needed to migrate a handler that branches feature-vs-empty-space: MAPS-A1.1–A1.5 cover only the feature branch                                          |

### MAPS-A2. Feature State API

Feature state expresses per-feature ephemeral UI state (selected, hovered, highlighted) without rewriting source data, by binding the state directly to the render layer via expressions.

| ID        | Functionality                                                | Key API symbols                                                                                                                                      | "Not yet using it" looks like                                                 |
| --------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| MAPS-A2.1 | Set per-feature state                                        | `mapboxMap.setFeatureState(sourceId, sourceLayerId, featureId, state, callback)`, plus `getFeatureState`, `removeFeatureState`, `resetFeatureStates` | GeoJsonSource rewritten with mutated feature properties on each tap/selection |
| MAPS-A2.2 | Data-driven expression using state                           | `featureState { literal("key") }` inside a paint-property expression (top-level DSL, or `Expression.featureState { }`)                               | A separate overlay layer added/removed to show a selection                    |
| MAPS-A2.3 | Typed state for Standard POIs **[Standard-style-only]**      | `StandardPoiState { hide(true) }`                                                                                                                    | Manual recolor of POI layer on tap                                            |
| MAPS-A2.4 | Typed state for Standard buildings **[Standard-style-only]** | `StandardBuildingsState { highlight(true) }` or `StandardBuildingsState { select(true) }`                                                            | Manual fill-color override on building layer on tap                           |

Signature details that shape any migration: `state` is a `Value`, the callback is **required**, and the call returns `Cancelable`. When there is no source layer to name — as with a `GeoJsonSource` — use the 4-argument overload, which omits `sourceLayerId` entirely. `removeFeatureState` additionally takes an optional `stateKey`: omit it to clear every key on the feature, pass it to clear one.

**Preconditions — check these before recommending MAPS-A2.1/A2.2 as a migration.** Feature state is not a drop-in replacement for a source rewrite:

- **Features need stable ids.** State is addressed by `(sourceId, featureId)`, and the feature id must be an integer or a string castable to one. A source whose features carry no id has nowhere to attach state — set `GeoJsonSource.Builder.promoteId(PromoteId(propertyName = "..."))` or `generateId(true)` first.
- **Paint properties only.** Layout properties do not support feature state.
- **Updates are asynchronous**, hence the mandatory callback.
- **Annotation-plugin features.** Where the highlighted thing is a `PointAnnotation` whose icon comes from a `Bitmap`, feature state cannot change its appearance — an expression cannot recolour a rasterized icon. Style it through the annotation's own options, or move the layer to an app-owned `SymbolLayer` over a persistent source. Whether feature state can otherwise address the source a `PointAnnotationManager` owns is `[VERIFY WITH MAPBOX]` — do not assume either way.

Example of a compiling pair (set, then read in a paint expression):

```kotlin
mapboxMap.setFeatureState(
    sourceId = SOURCE_ID,
    featureId = tappedId,
    state = Value(hashMapOf("selected" to Value(true))),
) { /* completion */ }

circleLayer(LAYER_ID, SOURCE_ID) {
    circleColor(
        switchCase {
            boolean { featureState { literal("selected") }; literal(false) }
            literal("#ff0000")
            literal("#888888")
        }
    )
}
```

### MAPS-A3. Style Imports Config API

The Style Imports Config API is the correct mechanism for changing runtime-configurable properties of any imported style (including Standard). A full `loadStyle` reload for mode switching is the expensive wrong alternative.

| ID        | Functionality                    | Key API symbols                                                                                                                                     | "Not yet using it" looks like                                                                                              |
| --------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| MAPS-A3.1 | Change an import config property | `style.setStyleImportConfigProperty(importId, key, Value(...))`                                                                                     | `mapboxMap.loadStyle(...)` with a different URI on each mode change                                                        |
| MAPS-A3.2 | Read an import config property   | `style.getStyleImportConfigProperty(importId, key)`                                                                                                 | —                                                                                                                          |
| MAPS-A3.3 | Batch import config change       | `style.setStyleImportConfigProperties(importId, hashMapOf(...))` — the parameter type is `HashMap<String, Value>`, so `mapOf(...)` does not compile | Multiple sequential `setStyleImportConfigProperty` calls in one code path                                                  |
| MAPS-A3.4 | List the style's imports         | `style.getStyleImports(): List<StyleObjectInfo>`                                                                                                    | An `importId` hard-coded or guessed. Every other MAPS-A3 entry needs one, and for a non-Standard style it is not guessable |
| MAPS-A3.5 | Read an import's schema          | `style.getStyleImportSchema(importId)` — returns the style import schema, or an error string                                                        | Setting a config key without checking the style defines it                                                                 |

All MAPS-A3 methods are `@MainThread` and throw when called off the main thread. MAPS-A3.4 and MAPS-A3.5 are the discovery step: run them first on any style that is not Standard.

### MAPS-A4. Standard Style Config Slots **[Standard-style-only]**

Standard style exposes named config properties for runtime customization. These must be set via the imports config API (MAPS-A3), not via full style reload or per-layer overrides.

| Config key                  | Effect                                    | Wrong pattern                                           |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| `lightPreset`               | `"day"` / `"night"` / `"dawn"` / `"dusk"` | Swapping a day-URI for a night-URI on each theme change |
| `showPointOfInterestLabels` | Show/hide POI labels                      | Adding a separate visibility-toggle overlay layer       |
| `showPlaceLabels`           | Show/hide place labels                    | Same                                                    |
| `showRoadLabels`            | Show/hide road labels                     | Same                                                    |
| `showTransitLabels`         | Show/hide transit labels                  | Same                                                    |
| `show3dObjects`             | Show/hide 3D buildings                    | Manually toggling the extrusion layer visibility        |
| `showAdminBoundaries`       | Show/hide admin boundaries                | Manually toggling the boundary layer visibility         |
| `font`                      | Default text font                         | Per-layer `textFont` override on Standard layers        |
| `theme`                     | `"default"` / `"faded"` / `"monochrome"`  | Overlay layers to recolor the map                       |

### MAPS-A5. Annotation Batching APIs

All three CUD operations on annotation managers have list-overload variants. Using per-item single calls in a loop is the common mistake.

| ID        | Functionality                                             | Key API symbols                                                                                                                                   | "Not yet using it" looks like                                                                                                                                                                                                                                    |
| --------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MAPS-A5.1 | Batch create                                              | `manager.create(listOf(...))`                                                                                                                     | Loop calling `manager.create(option)` once per item                                                                                                                                                                                                              |
| MAPS-A5.2 | Batch update                                              | `manager.update(listOf(...))`                                                                                                                     | Loop calling `manager.update(annotation)` once per item                                                                                                                                                                                                          |
| MAPS-A5.3 | Batch delete                                              | `manager.delete(listOf(...))`                                                                                                                     | Loop calling `manager.delete(annotation)` once per item                                                                                                                                                                                                          |
| MAPS-A5.4 | Replace all annotations with minimal intermediate renders | `manager.deleteAll(); manager.create(newList)` called back-to-back — both trigger a source update, but no intermediate render occurs between them | `manager.deleteAll()` and `manager.create(listOf(...))` separated by a **suspension point or a post to a later frame**, so a frame renders with an empty or stale annotation set between the two updates. Intervening code that cannot yield is not this pattern |

### MAPS-A6. View Annotation Update API

`updateViewAnnotation` updates geometry and options in place, without a remove + re-add cycle that destroys and rebuilds the view.

| ID        | Functionality                                         | Key API symbols                                                                                                                                                 | "Not yet using it" looks like                                                                   |
| --------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| MAPS-A6.1 | Update view annotation geometry or options in place   | `viewAnnotationManager.updateViewAnnotation(view, options)`                                                                                                     | `removeViewAnnotation(view)` then `addViewAnnotation(...)` to change geometry                   |
| MAPS-A6.2 | Inflate from layout resource (not from View instance) | `val view = addViewAnnotation(@LayoutRes resId, options)` — returns `View` synchronously; async: `addViewAnnotation(resId, options, asyncInflater) { view -> }` | `LayoutInflater.from(...).inflate(R.layout.x, null)` inside a loop, passing the `View` overload |

**Precondition for MAPS-A6.2.** The `resId` overload replaces the inflation, not the wiring: an annotation that carries a view holder, listeners, or animation state still needs a bind step against the returned `View`. The async overload additionally requires an `androidx.asynclayoutinflater` dependency — not worth adding for a handful of annotations.

### MAPS-A7. Lifecycle Plugin

The lifecycle plugin wires `MapView` to a `LifecycleOwner`, removing the need for manual `onStart` / `onResume` / `onStop` / `onDestroy` / `onLowMemory` calls in each Activity or Fragment. Manual calls are still valid for specific corner cases, but are not recommended — incorrect or incomplete forwarding is a common source of memory leaks.

| ID        | Functionality                  | Key API symbols                                                                                                                                                                   | "Not yet using it" looks like                                                                                                                                                                                                                           |
| --------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MAPS-A7.1 | Automatic lifecycle forwarding | `mapView.lifecycle` (extension property from `plugin-lifecycle`, returns `MapboxLifecyclePlugin`) — no manual calls needed when `MapView` is hosted in a `LifecycleOwner` context | Manual `mapView.onStart()` / `mapView.onResume()` / `mapView.onStop()` / `mapView.onDestroy()` / `mapView.onLowMemory()` in Activity or Fragment — valid for corner cases but surface to Mapbox: incorrect or incomplete forwarding causes memory leaks |

### MAPS-A8. Compose Extension

The Mapbox Compose extension provides a `MapboxMap` composable and a `MapEffect` API for side-effecting map operations.

| ID        | Functionality           | Key API symbols                                                       | "Not yet using it" looks like                                          |
| --------- | ----------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| MAPS-A8.1 | Map in Compose          | `MapboxMap(modifier, ...) { ... }` composable                         | `AndroidView { MapView(...) }` wrapper with manual lifecycle bridging  |
| MAPS-A8.2 | One-shot map setup      | `MapEffect(Unit) { mapView -> ... }`                                  | Effect with a non-stable key that re-runs every recomposition          |
| MAPS-A8.3 | State-driven map effect | `MapEffect(stableKey) { mapView -> ... }` with `remember`-backed keys | Inline object literal, `Modifier`, or captured `var` as the effect key |

### MAPS-A9. Annotation Clustering

`ClusterOptions` enables source-level clustering on a `PointAnnotationManager` — the GeoJSON source groups nearby points into cluster features on-device before they reach the renderer. Large annotation sets without clustering force the renderer to draw every point individually.

| ID        | Functionality    | Key API symbols                                                                                                                                        | "Not yet using it" looks like                                      |
| --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| MAPS-A9.1 | Point clustering | `PointAnnotationManager` created with `AnnotationConfig(annotationSourceOptions = AnnotationSourceOptions(..., clusterOptions = ClusterOptions(...)))` | No clustering on a manager holding hundreds or thousands of points |

---

## Part B — Performance & Correctness Antipatterns

These are not missing features. They are ways of using the SDK that are known to be expensive or unsafe.

### Runtime Styling (MAPS-B-STYLE-\*)

**Background.** Every runtime style mutation causes the native style engine to re-evaluate the affected layer (for property changes) or re-tile from scratch (for source changes). Frequency and batching matter most.

#### MAPS-B-STYLE-1. Heavy runtime layer mutation in hot paths

Only flag this when mutations are **frequent** (inside a camera-change listener, gesture handler, animation frame callback, or a flow emitting faster than 50 ms) **and** either involve many properties (5+) on the same layer per update **or** re-create the layer instead of mutating it. A handful of property updates on a discrete user action is not a concern.

The re-creation half matters: an integration that discards a layer and builds a new one sets zero properties on any live layer, so a property count alone reads as a clean pass while the runtime cost is higher than the example below. Route it to MAPS-B-STYLE-4.

```kotlin
// Avoid — many typed setter calls on every camera/animation frame
mapboxMap.subscribeCameraChanged {
    routeLayer.lineColor(currentColor)
    routeLayer.lineOpacity(currentOpacity)
    routeLayer.lineWidth(currentWidth)
    routeLayer.lineDasharray(currentDash)
    routeLayer.lineGapWidth(currentGap)
    // ... more properties per frame
}

// Prefer — hoist constant properties to layer creation; use data-driven expressions
// or feature state for values that change at runtime (no per-frame native calls)
```

The real fix is architectural: constants belong in the layer definition, dynamic values belong in data-driven expressions (`Expression.interpolate`, `Expression.featureState`).

#### MAPS-B-STYLE-2. Expression construction churn

Rebuilding a style expression on every update when only an input value changes:

```kotlin
// Avoid — entire expression object rebuilt on every update
layer.lineColor(
    interpolate {
        linear()
        zoom()
        stop { literal(10.0); color(Color.BLUE) }
        stop { literal(16.0); color(Color.RED) }
    }
)

// Prefer — hoist the constant expression to a property-level val; only swap the data-driven input
```

Also flag expressions rebuilt inside camera or animation callbacks, and multi-kilobyte JSON blobs reassigned to a layer property on every update.

#### MAPS-B-STYLE-3. Source data rewrite for per-feature state

Expressing ephemeral per-feature UI state (selected, highlighted, focused) by rewriting the entire GeoJsonSource with mutated feature properties:

```kotlin
// Avoid — full source rewrite on every tap
source.featureCollection(FeatureCollection.fromFeatures(features.map { f ->
    f.also { it.addBooleanProperty("selected", it.id() == tappedId) }
}))

// Prefer — feature state API (see catalog MAPS-A2, including its preconditions);
// the source data stays untouched
mapboxMap.setFeatureState(
    sourceId = SOURCE_ID,
    featureId = tappedId,
    state = Value(hashMapOf("selected" to Value(true))),
) { /* completion */ }
```

A third, more expensive shape counts here too: **removing the sources and layers and adding a new set** on each state emission, rather than mutating a long-lived source. It matches MAPS-B-STYLE-4 on mechanism — report it there and cross-reference, do not double-count.

#### MAPS-B-STYLE-4. Add/remove layer vs. visibility toggle

Calling `style.addLayer` / `style.removeStyleLayer` for the **same logical layer** repeatedly to show/hide a visual category. Match on role, not only on a literal repeated id — an integration that mints a fresh id (for example a UUID) per render never repeats an id, which is worse than repeating one, not better. Also in scope: a wholesale teardown that calls `removeStyleLayer` / `removeStyleSource` across the app's whole layer set and re-adds it on each update.

```kotlin
// Avoid — invalidates the render plan and re-sorts layer order each cycle
style.removeStyleLayer(layerId)
// ... later ...
style.addLayer(layer)

// Prefer — typed visibility setter, no structural change to the style
style.getLayerAs<Layer>(layerId)?.visibility(Visibility.NONE)    // hide
style.getLayerAs<Layer>(layerId)?.visibility(Visibility.VISIBLE) // show
```

**Precondition.** The visibility setter needs a stable, known layer id. Where ids are generated per render, this is a two-step migration: first make the update path idempotent (skip or diff when the incoming set is unchanged) and give the layers stable ids, then toggle visibility. Recommending the toggle alone is not actionable.

#### MAPS-B-STYLE-5. Full style reload for mode switching

Calling `mapboxMap.loadStyle(...)` to switch between visual modes (day/night, traffic on/off, lane guidance, etc.):

```kotlin
// Avoid — destroys every source, layer, image, and annotation, then rebuilds from scratch
mapboxMap.loadStyle(Style.STANDARD) // called again on night mode

// Prefer — flip the import config property (see catalog MAPS-A3, MAPS-A4)
style.setStyleImportConfigProperty("basemap", "lightPreset", Value("night"))
```

#### MAPS-B-STYLE-6. Style image churn

Re-uploading the same image repeatedly:

```kotlin
// Avoid — re-uploads to the GPU on every call with the same id and content
style.addImage("pin", bitmap)

// Prefer — add once at style-loaded; reuse the id in all annotations or layers
```

Also flag `addImage` called inside animation frame or camera-change callbacks, and fresh `BitmapFactory.decodeResource(...)` calls per `addImage` invocation.

**A clean result here does not mean icons are cheap.** Most integrations never call `addImage` — they hand bitmaps to `PointAnnotationOptions.withIconImage(bitmap)` and the annotation plugin registers the style image itself. Check MAPS-B-ANNOT-3 before concluding there is no image churn.

#### MAPS-B-STYLE-7. Standard config via per-layer override **[Standard-style-only]**

Changing Standard style properties by directly overriding individual Standard layers instead of using the imports config API:

```kotlin
// Avoid — brittle, breaks on style updates, ignores the Standard theming contract
style.setStyleLayerProperty("road-label-simple", "text-color", Value("#000000"))

// Prefer — config slot via imports config API (see catalog MAPS-A3, MAPS-A4)
style.setStyleImportConfigProperty("basemap", "showRoadLabels", Value(false))
```

#### MAPS-B-STYLE-8. Whole-map property set on a per-frame cadence

`setLight` / `setTerrain` / `setAtmosphere` / `setProjection` reconfigure the whole map, not one layer:

```kotlin
// Avoid — the whole map is reconfigured on every camera frame
mapboxMap.subscribeCameraChanged {
    style.setLight(flatLight { color(currentColor) })
}

// Prefer — set once per discrete state transition (e.g. on entering night mode)
style.setLight(flatLight { color(NIGHT_LIGHT_COLOR) })
```

**Pass state:** these four called from discrete state transitions — a mode switch, a user toggle, style-loaded — at any number of call sites. Frequency is the whole test; a codebase that calls `setTerrain` in five places on five distinct user actions is not a finding.

---

### Annotation API (MAPS-B-ANNOT-\*)

#### MAPS-B-ANNOT-1. Manager recreation per data update

Creating a new `AnnotationManager` each time the underlying data changes:

```kotlin
// Avoid — creates a new style layer + source pair each time; orphans accumulate
val manager = mapView.annotations.createPointAnnotationManager()

// Prefer — create once, store as a field; update data via manager.create/update/delete
```

#### MAPS-B-ANNOT-2. Unbatched create / update / delete

Per-item single calls in a loop:

```kotlin
// Avoid
features.forEach { manager.create(PointAnnotationOptions().withPoint(it)) }

// Prefer (see catalog MAPS-A5)
manager.create(features.map { PointAnnotationOptions().withPoint(it) })
```

**Why this is more than a style preference.** The single-item overloads update the manager's source once per call, and that update is not incremental — it re-walks every annotation the manager holds and rewrites the whole GeoJSON feature collection. Inserting _N_ annotations one at a time therefore costs _N_ full source rewrites and O(N²) feature conversions, against one rewrite and O(N) for the list overload. Replacing a set (delete loop then create loop) doubles it again. Rank this accordingly: it is cheap to fix and degrades quadratically with annotation count.

#### MAPS-B-ANNOT-3. Style-image churn from the `Bitmap` icon overload

Using the `Bitmap` overload of `withIconImage` for icons that are shared across annotations. When you pass a `Bitmap`, the plugin registers the style image for you and names it — so image reuse is decided by **`Bitmap` instance identity within one manager**, not by what the artwork looks like. Three consequences, none of them strictly per annotation:

- Annotations sharing one cached `Bitmap` instance on one manager upload once.
- Anything that **replaces the instance** re-uploads every icon: clearing a bitmap cache, re-decoding or re-rasterizing the same artwork, or a `deleteAll()` that drops the manager's registered images.
- The same bitmap handed to _k_ managers is uploaded _k_ times.

Passing your own id (`style.addImage("pin", bitmap)` then `withIconImage("pin")`) removes all three, because you control the identity.

Flag both shapes: a genuinely per-annotation bitmap, and a cache whose invalidation forces a full re-upload on a repeated path.

```kotlin
// Avoid — re-uploads the bitmap and creates a fresh style image entry per annotation
options.withIconImage(sharedBitmap)

// Prefer — register once at style-loaded, then reference by id
style.addImage("pin", sharedBitmap)
options.withIconImage("pin")
```

#### MAPS-B-ANNOT-4. No clustering on large annotation sets

A `PointAnnotationManager` holding hundreds of points with no `ClusterOptions`. The renderer draws every point individually at all zoom levels, causing frame drops at high density.

Absolute counts are a weak test, because peak count usually varies by screen while clustering is configured per manager. Ask instead: **is each producer's annotation count bounded in client code, and is the unbounded one clustered?** An unbounded producer feeding a non-clustering manager is the finding, even when today's peak is modest. Note too whether anything culls off-screen annotations against the camera bounds — as with view annotations (MAPS-B-VANN-3), nothing does this automatically.

---

### View Annotation API (MAPS-B-VANN-\*)

#### MAPS-B-VANN-1. Inflate inside loop or frequent callback

Creating and inflating a `View` instance per annotation, rather than using the `layoutResId` overload:

```kotlin
// Avoid — inflates on every call
val view = LayoutInflater.from(context).inflate(R.layout.annotation_view, null)
viewAnnotationManager.addViewAnnotation(view, options)

// Prefer — layoutResId overload; returns View synchronously (see catalog MAPS-A6)
val view = viewAnnotationManager.addViewAnnotation(R.layout.annotation_view, options)
```

See the MAPS-A6.2 precondition: the returned `View` still needs binding when the annotation carries a holder, listeners, or animation state. Weight this finding by how often the inflation re-runs — an inflate loop over a handful of annotations that runs once is not the same finding as one that re-runs on every data update.

#### MAPS-B-VANN-2. Remove + re-add instead of update

Removing and re-adding a view annotation to change its geometry or options:

```kotlin
// Avoid — destroys and rebuilds the view and its projection entry
viewAnnotationManager.removeViewAnnotation(view)
viewAnnotationManager.addViewAnnotation(view, newOptions)

// Prefer (see catalog MAPS-A6)
viewAnnotationManager.updateViewAnnotation(view, newOptions)
```

`updateViewAnnotation` merges — only the properties present in `options` change — so a `geometry`-only update preserves the anchors and overlap settings set earlier.

**It updates annotation options, not the `View`'s contents**, so split the decision three ways rather than treating remove + re-add as the only alternative:

| What changed                                                    | Correct response                                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Geometry or options                                             | `updateViewAnnotation(view, options)`                                                           |
| Displayed content (text, icon, badge)                           | Re-bind the existing view — re-binding is not re-inflating, and neither needs a remove + re-add |
| The annotation's identity (it now represents a different thing) | Remove + add                                                                                    |

#### MAPS-B-VANN-3. Peak count exceeds GPU-render threshold

More than ~50 simultaneously visible view annotations. Each is a real Android `View` that participates in the layout/draw pipeline every frame. Beyond ~50, recommend:

- Move icon-only annotations to `PointAnnotationManager` / `SymbolLayer` (GPU-rendered, scales to thousands).
- Move label-only annotations (single-line text, optional background, no interactivity) to a `SymbolLayer` with `textField`, `textColor`, `textHaloColor`, and built-in collision detection.
- Reserve view annotations for cases that genuinely require the Android view system (rich typography, interactive children, custom animations).
- Cull off-screen annotations app-side based on the camera bounds rather than relying on the manager to clip.

A count under the threshold is a pass only if the count is **bounded in client code**. If the number of annotations follows a server-supplied list or a backend flag with no cap on the client, report that separately from the observed peak — a peak of 3 today with an unbounded expression is a different risk from a hard-capped 3.

---

### Integration Hygiene (MAPS-B-HYGIENE-\*)

#### MAPS-B-HYGIENE-1. MapView lifecycle wiring

The lifecycle plugin (catalog MAPS-A7) is the recommended approach. It retrieves the lifecycle from the `MapView`'s view tree and auto-wires all calls when `MapView` is properly hosted in an Activity or Fragment. If the plugin is not used, manual forwarding of all five calls (`onStart`, `onResume`, `onStop`, `onDestroy`, `onLowMemory`) is required regardless of context. The `MapView` KDoc says each one must be called from the matching Activity or Fragment callback.

**Skip this check for Compose `MapboxMap { }`.** The Compose extension disables the lifecycle plugin and forwards the lifecycle itself, so a Compose map has neither the plugin nor manual calls and would wrongly match case A. Since 11.35, reading `mapView.lifecycle` inside `MapEffect` throws `PluginDisabledException`, so don't recommend it there either. Apply this check only to a `MapView` the app creates itself, including one wrapped in `AndroidView`.

**Detect the plugin correctly before reporting anything here.** The plugin is installed by default — it is part of `MapInitOptions.defaultPluginList`, so a correct integration references it nowhere in app code. Test for `MAPBOX_LIFECYCLE_PLUGIN_ID` being present in the plugin list actually passed to `MapInitOptions` (present unless the app subtracted it), **not** for a `mapView.lifecycle` call site. Grepping for the call site and finding nothing is the common way to produce a false critical finding here.

**Why ViewModel / Application / static field breaks lifecycle wiring (even with the plugin):**
The lifecycle plugin works by resolving a `LifecycleOwner` from the `MapView`'s position in the view tree. This works correctly when `MapView` is added to an Activity's or Fragment's view hierarchy. It breaks in two ways:

- A `MapView` that is never attached to such a hierarchy — one constructed against an `Application` context, or parked in a static field and not added to a view tree — has no `LifecycleOwner` to resolve, so the plugin cannot wire at all.
- `ViewModel` context: developers put `MapView` in a ViewModel intending to reuse it across configuration changes. On rotation, the lifecycle plugin correctly observes `DESTROYED` and calls `mapView.onDestroy()`. But the ViewModel then holds a reference to an already-destroyed `MapView`, and the new Activity tries to use a dead instance. Even if not reused, the ViewModel holds a destroyed `View` whose context points to the finished Activity — a context leak.

Four cases to report. D is listed first because it must be ruled out before A — the two look identical to a search for manual calls:

**D. Plugin present and no manual calls (pass — report as correct, not as a finding).** The plugin is in the plugin list and app code makes no manual `onStart` / `onResume` / `onStop` / `onDestroy` / `onLowMemory` calls. This is the recommended integration (MAPS-A7), and it covers `onLowMemory` too — the plugin forwards memory-pressure callbacks as well as lifecycle events. Do not read the absence of manual calls as case A.

**A. No lifecycle plugin and no manual calls (bug).** `MapView` has no lifecycle forwarding at all. Flag and explain consequences: `onStop()` never called → GL context runs in background, drains battery; `onDestroy()` never called → GL resources, tile cache, and observers are never released → memory leak on every screen exit; `onStart()` never called → map appears frozen after returning to foreground; `onLowMemory()` never called → map cannot shed tile cache under memory pressure → OOM risk; `onResume()` never called → a call the `MapView` KDoc requires is skipped.

**B. Manual calls present but incomplete (bug).** Manual forwarding is used but not all five calls are present — flag the missing ones. Any missing call causes the corresponding consequence above.

**C. Manual calls present and complete (surface to Mapbox).** All five calls are forwarded manually. Do not flag as a bug. Report to Mapbox as noteworthy: manual lifecycle wiring is fragile (easy to miss a call in future refactors, order-dependent, does not auto-adapt to lifecycle changes). Recommend migrating to the lifecycle plugin (MAPS-A7).

Also flag in all cases: `MapView` stored in a `ViewModel`, `Application`, a static field, **or any process-scoped DI binding** (Dagger/Hilt `@Singleton`, Koin `single`, a manually held app-scoped object) — same process lifetime, same consequence as a static field, and far more common in modern Android. Retaining a `MapView` past `onDestroy` also retains an invalid `MapboxMap`, which the SDK documents as a native-memory leak; it will not show up in a Java-heap leak trace.

**Teardown ordering, when the plugin is in use.** A Fragment dispatches its view lifecycle's `ON_DESTROY` — which is what drives `MapView.onDestroy()` — **before** `onDestroyView()` runs. App cleanup written in `onDestroyView` therefore executes against an already-destroyed map. Flag app-side teardown that calls back into the map (removing gesture listeners, setting a location provider, cancelling camera animators) from `onDestroyView`, and recommend moving it to a `DefaultLifecycleObserver` registered on the view lifecycle, or guarding it on map validity.

#### MAPS-B-HYGIENE-2. Main-thread-only SDK type used off the main thread

**Criterion:** any Mapbox type annotated `@UiThread` or `@MainThread` must be used only on the main thread. `MapboxMap`, `Style`, annotation managers, and the gestures plugin are the common examples. The criterion extends to any Mapbox library rendering onto the same `MapView`, and within one such library the annotation is not uniform — a rendering/view class often carries it while the data and formatter APIs beside it do not. Check the annotation on the specific type; do not infer it from the package.

Flag use from `Dispatchers.IO` / `Dispatchers.Default`, `withContext(IO/Default)`, `WorkManager`, `Schedulers.io()`, or a raw `Thread` / `ExecutorService`. **Construction counts, not only method calls** — `async(Dispatchers.Default) { SomeUiThreadType(...) }` as a startup pre-warm is a common shape and matches this antipattern.

Report separately, rather than as a bug: Mapbox `androidx.startup` initializers driven manually from a background dispatcher. They carry no `@UiThread` annotation, normally run on the main thread during `ContentProvider` creation, and whether moving them off it is supported is a question for Mapbox — tag `[VERIFY WITH MAPBOX]`.

#### MAPS-B-HYGIENE-3. Unstable `MapEffect` key in Compose

A `MapEffect` key that is not stable across recompositions causes the effect to re-run and re-create internal state (annotation managers, listeners, sources) on every recomposition:

```kotlin
// Avoid — effect re-runs on every recomposition
MapEffect(Modifier) { mapView -> ... }
MapEffect(viewModel::onMapReady) { mapView -> ... }

// Prefer (see catalog MAPS-A8)
MapEffect(Unit) { mapView -> ... }                         // one-shot setup
MapEffect(remember { stableKey }) { mapView -> ... }       // reactive, stable key
```

---

## Part C — Audit Prompts

Run the prompts below one at a time, in order.

Apply the **grounding rule** in every prompt: only flag a finding when the API or antipattern appears in Parts A or B; tag uncertain items `[VERIFY WITH MAPBOX]`.

Record findings in the **output schema**: `Prompt ID | File:line | Pattern observed | SDK equivalent (catalog ID) | Confidence | FP risk | Suggested change`.

This schema is authoritative for every flagged finding. The shorter `Report:` line at the end of each prompt names the fields that prompt most wants filled in — treat it as emphasis, not as a replacement column set. Inventory and synthesis tasks — MAPS-P1 and all of MAPS-P9a–MAPS-P9f — produce output of their own shape and are exempt.

---

### Per-Prompt Reference

#### MAPS-P1. API Surface & Use Case Inventory

```
Apply the grounding rule. List every Mapbox public API symbol called in this codebase:
- com.mapbox.maps.*
- com.mapbox.maps.plugin.*
- com.mapbox.maps.extension.*
- com.mapbox.maps.interactions.*
- com.mapbox.common.*
- com.mapbox.geojson.* / com.mapbox.turf.*

Per group: symbol | distinct call-site count | sample file:line | one-line usage summary.
Ignore tests, samples, dead code.

Also:
- For each Mapbox module in build.gradle(.kts): coordinate | used? | primary purpose | removal candidate.
- Identify top-level product features built on the map: name | description | entry point file:line |
  Mapbox APIs used | custom rendering unique to this feature. Skip passive-background screens.
- Summarize runtime customization: day/night trigger, per-context changes, overlaid data
  (live/static, cadence, source), interactive vs. visual, session-persistent vs. per-screen.
```

#### MAPS-P2. Featureset Interactions (MAPS-A1)

```
Grounding: catalog MAPS-A1.

Find every tap or long-press handler on map features. Look for:
- mapboxMap.queryRenderedFeatures(...) called inside addOnMapClickListener or
  addOnMapLongClickListener
- gestures.addOnMapClickListener / addOnMapLongClickListener handlers that then call
  queryRenderedFeatures against Standard or custom layer ids, or with no layer filter at all
  (RenderedQueryOptions(null, null)) — the unfiltered form queries every layer in the style
  and is in scope

For each, determine: is the target a Standard feature set (POI, buildings, place labels,
road labels)?
- If yes: recommend the typed Featureset Interactions API (MAPS-A1.1–MAPS-A1.4, MAPS-A1.7).
- If custom layer: recommend ClickInteraction.layer("layer-id") (MAPS-A1.5).
- If the handler branches feature-vs-empty-space: the empty-space branch needs
  ClickInteraction { ctx -> } (MAPS-A1.6). A migration covering only the feature branch
  silently drops it.

For selection highlights: combine with mapboxMap.setFeatureState(...) (MAPS-A2.1/A2.2, any style,
subject to its preconditions); if the target is Standard, use StandardBuildingsState or
StandardPoiState instead [Standard-style-only] (MAPS-A2.3, MAPS-A2.4).

Report: file:line | target (Standard feature or custom layer id) | current pattern |
recommended API (catalog ID).
```

#### MAPS-P3. Feature State vs. Data Rewrite (MAPS-A2, MAPS-B-STYLE-3)

```
Grounding: catalog MAPS-A2; antipattern MAPS-B-STYLE-3.

Find every place per-feature ephemeral UI state (selected, hovered, highlighted, focused)
is represented by rewriting a GeoJsonSource:
- (style.getSource(id) as GeoJsonSource).featureCollection(...) called with mutated properties
  in response to a UI event (tap, selection, hover)
- source.feature(...) / source.data(...) used to flip a per-feature flag
- A parallel overlay GeoJsonSource maintained alongside the main source for selection state
- Sources and layers destroyed and re-created on each state emission, rather than a long-lived
  source being mutated — the strictly more expensive shape

For each: what state is tracked | source/layer pair | recommend migration to
setFeatureState(sourceId, featureId, state, callback) + featureState { literal("key") } in a
paint expression (MAPS-A2.1–MAPS-A2.2).

Check MAPS-A2's preconditions before recommending it: sources need stable feature ids
(promoteId / generateId), only paint properties support feature state, and features managed by an
annotation manager cannot use it at all. If a precondition fails, state what must change first
rather than presenting feature state as a direct swap.

Report: file:line | state type | current pattern | recommended API (catalog ID) | FP risk.
```

#### MAPS-P4. Style Import Config & Standard Slots (MAPS-A3, MAPS-A4, MAPS-B-STYLE-5, MAPS-B-STYLE-7)

```
Grounding: catalog MAPS-A3, MAPS-A4; antipatterns MAPS-B-STYLE-5, MAPS-B-STYLE-7.

If the codebase does not use Standard style, skip [Standard-style-only] items below — do not
recommend adopting Standard as a fix. Item 2 still applies to any style; only apply
its "recommended fix" if the codebase's own style defines import config properties.

1. [Standard-style-only] List every mapboxMap.loadStyle(...) / loadStyleUri(...): style identifier, file:line.
   Note legacy non-Standard built-ins (Style.MAPBOX_STREETS, OUTDOORS, LIGHT, DARK,
   TRAFFIC_DAY, TRAFFIC_NIGHT) as information only. Switching styles is a design decision
   and out of scope: never recommend Standard as a fix.

2. Find every loadStyle(...) used to switch visual modes at runtime (day/night, traffic,
   lane guidance, etc.). Each is a MAPS-B-STYLE-5 finding. Recommend style imports config
   (MAPS-A3.1) instead, if the style defines one.

3. [Standard-style-only] If Standard is used: find every Standard config slot change (lightPreset, show* keys,
   font, theme, show3dObjects, showAdminBoundaries).
   - Confirm each uses style.setStyleImportConfigProperty(...) (MAPS-A3.1).
   - Flag: done via loadStyle reload (MAPS-B-STYLE-5); done by overriding individual Standard layers (MAPS-B-STYLE-7);
     fired on per-frame or per-camera-change cadence.

4. Whatever the outcome above, record: how is the style initially set (loadStyle call,
   MapInitOptions styleUri, XML attribute), and is it reachable for mutation afterwards?
   A style set once at MapView construction and never touched scores zero on every item here —
   correctly — but it also means there is no in-place mode-switch mechanism, which is the
   condition under which MAPS-B-STYLE-5 tends to be introduced later. Where a recommendation
   needs an importId, note it must be discovered via getStyleImports() /
   getStyleImportSchema(importId) (MAPS-A3.4/A3.5), not guessed.

Report: file:line | slot key | current mechanism | recommended mechanism.
```

#### MAPS-P5. Runtime Styling Efficiency (MAPS-B-STYLE-1, MAPS-B-STYLE-2, MAPS-B-STYLE-4, MAPS-B-STYLE-6, MAPS-B-STYLE-8)

```
Grounding: antipatterns MAPS-B-STYLE-1, MAPS-B-STYLE-2, MAPS-B-STYLE-4, MAPS-B-STYLE-6,
MAPS-B-STYLE-8.

First establish frequency, because items 1 and 3 turn on it: trace what re-enters each
layer-update path. Include paths that re-trigger themselves — an app-driven camera animation
feeding a camera-change listener that rebuilds layers is a floor on update rate independent of
any data change.

1. MAPS-B-STYLE-1: flag only when layer mutations are frequent (camera-change, gesture,
   animation frame, flow < 50ms) AND either involve many properties (5+) on the same layer per
   update OR re-create the layer instead of mutating it. Discrete one-time updates are not a
   concern. For flagged cases: hoist constants to layer creation, use data-driven expressions or
   feature state.

2. MAPS-B-STYLE-2: find style expressions constructed inside the same method that updates a layer property.
   Flag expressions rebuilt when only an input value changes; expressions in high-frequency
   callbacks; multi-KB JSON blobs reassigned each update.

3. MAPS-B-STYLE-4: find addLayer / removeStyleLayer repeated at runtime for the same logical
   layer — match on role, not only on a repeated literal id, since ids generated per render never
   repeat. Include whole-set teardowns (removeStyleLayer / removeStyleSource across the app's
   layers, then re-add). Recommend the visibility toggle and state its precondition: it needs
   stable layer ids, so where ids are per-render the first step is making the update path
   idempotent.

4. MAPS-B-STYLE-6: find style.addImage(...) called with the same id on multiple invocations; addImage
   inside animation frame or camera callbacks; fresh Bitmap decode per call. Zero hits does not
   mean icons are cheap — check MAPS-B-ANNOT-3 in MAPS-P6.

5. MAPS-B-STYLE-8: setLight / setTerrain / setAtmosphere / setProjection fired per-frame or
   per-camera-change (should only fire on discrete state transitions).

Report: file:line | antipattern ID | frequency context | recommended fix.
```

#### MAPS-P6. Annotation API Efficiency (MAPS-A5, MAPS-A9, antipatterns MAPS-B-ANNOT-1–MAPS-B-ANNOT-4)

```
Grounding: catalog MAPS-A5, MAPS-A9; antipatterns MAPS-B-ANNOT-1–MAPS-B-ANNOT-4 (annotation section of Part B).

1. MAPS-B-ANNOT-1 (manager lifetime): find every create*AnnotationManager. Verify: created once, stored
   as a field. Flag: recreated per data update; not removed via removeAnnotationManager when
   no longer needed; total manager count > 10.

2. MAPS-B-ANNOT-2 (batching): find every manager.create / update / delete. Flag per-item loop
   calls — each single-item call rewrites the manager's whole GeoJSON source, so N inserts cost
   N rewrites and O(N²) feature conversions; batch with listOf(...). Also flag deleteAll() +
   create(listOf(...)) separated by a suspension point or a post to a later frame (a frame
   renders with an empty or stale set); intervening code that cannot yield is not this pattern.

3. MAPS-B-ANNOT-3 (bitmap): find the withIconImage(bitmap) overload used for shared icons, and
   anything that replaces the cached Bitmap instance (cache clears, re-rasterization, deleteAll)
   on a repeated path — the generated style-image id derives from the Bitmap instance and the
   manager, so a replaced instance re-uploads every icon, and a bitmap shared across k managers
   is uploaded k times. Recommend style.addImage once + withIconImage("id").

4. MAPS-B-ANNOT-4/MAPS-A9 (clustering): derive each producer's peak annotation count and whether
   it is bounded in client code. Flag an unbounded or large producer routed to a manager with no
   ClusterOptions. Note clustering enabled where counts are always small (overhead without
   benefit) only when the same managers do not also serve a high-count screen. Report whether any
   off-screen culling against camera bounds exists.

Report: file:line | antipattern ID | current pattern | recommended fix.
```

#### MAPS-P7. View Annotation Efficiency (MAPS-A6, antipatterns MAPS-B-VANN-1–MAPS-B-VANN-3)

```
Grounding: catalog MAPS-A6; antipatterns MAPS-B-VANN-1, MAPS-B-VANN-2, MAPS-B-VANN-3.

1. MAPS-B-VANN-1: find addViewAnnotation calls passing an inflated View instance inside a loop or a
   frequently called method. Recommend the layoutResId: Int overload (MAPS-A6.2), noting that a
   view carrying a holder, listeners or animation state still needs a bind step against the
   returned View. Weight the finding by how often the inflation re-runs, not by the loop alone.

2. MAPS-B-VANN-2: find removeViewAnnotation + addViewAnnotation pairs used to update an
   annotation. Split by what changed: geometry or options → updateViewAnnotation (MAPS-A6.1;
   merge semantics, so a geometry-only options object is safe); displayed content → re-bind the
   existing view; identity → remove + add is correct. Flag equality checks that treat any data
   change as an identity change.

3. MAPS-B-VANN-3: estimate peak visible view-annotation count and state whether it is bounded in
   client code. Flag if > ~50, and report an unbounded count (driven by a server list or backend
   flag with no client cap) even when today's peak is small. Recommend:
   - Icon-only → PointAnnotationManager / SymbolLayer (GPU-rendered, scales to thousands).
   - Label-only (single-line text, no interactivity) → SymbolLayer with textField, textColor,
     textHaloColor, and built-in collision detection.
   - Cull off-screen annotations app-side based on camera bounds.

4. Flag ViewAnnotationOptions that look default-by-accident — for example allowOverlap(true) on a
   set large enough that collision detection was the point, or visible toggled from a per-frame
   or per-camera path. An option set deliberately for a documented reason is not a finding.

Report: file:line | antipattern ID | current pattern | recommended fix.
```

#### MAPS-P8. Integration Hygiene (MAPS-B-HYGIENE-1–MAPS-B-HYGIENE-3)

```
Grounding: antipatterns MAPS-B-HYGIENE-1, MAPS-B-HYGIENE-2, MAPS-B-HYGIENE-3.

1. MAPS-B-HYGIENE-1: find every Activity, Fragment, or custom View holding a MapView field.
   Skip Compose MapboxMap { }: the extension disables the lifecycle plugin and forwards the
   lifecycle itself (mapView.lifecycle in MapEffect throws PluginDisabledException since 11.35).
   First determine plugin presence the right way: is MAPBOX_LIFECYCLE_PLUGIN_ID in the plugin
   list passed to MapInitOptions (it is in defaultPluginList unless the app subtracted it)?
   Do not infer absence from a missing mapView.lifecycle call site.
   (d) Pass — plugin present, no manual calls (check this before (a); they look identical to a
       search for manual calls): the recommended integration (MAPS-A7), including
       onLowMemory. Report as correct, not as a finding.
   (a) Bug — no lifecycle plugin and no manual calls: flag; explain GL leak, battery drain, frozen
       map, OOM risk. Escalate if MapView is in ViewModel / Application / static field / a
       process-scoped DI binding (@Singleton, Koin single).
   (b) Bug — manual calls present but incomplete: flag which of onStart/onResume/onStop/onDestroy/
       onLowMemory is missing.
   (c) Surface to Mapbox — all five manual calls present: report as fragile pattern; recommend
       lifecycle plugin (MAPS-A7).
   When the plugin is in use, also flag app-side teardown in onDestroyView that calls back into
   the map (removing listeners, setting a location provider, cancelling animators): the view
   lifecycle's ON_DESTROY, and therefore MapView.onDestroy(), runs before onDestroyView().

2. MAPS-B-HYGIENE-2: find any Mapbox type annotated @UiThread/@MainThread — MapboxMap, Style,
   annotation managers, gestures plugin, and rendering/view classes from any Mapbox library
   drawing onto the same MapView (check the annotation per type; it is not uniform within a
   library) — used from: Dispatchers.IO / Dispatchers.Default,
   withContext(IO/Default), Thread / ExecutorService / Handler, WorkManager Worker, RxJava
   Schedulers.io() / computation(). Include constructor calls, not only method calls:
   async(Dispatchers.Default) { SomeUiThreadType(...) } as a startup pre-warm is in scope.
   Report separately, tagged [VERIFY WITH MAPBOX], any Mapbox androidx.startup initializer driven
   manually from a background dispatcher.

3. MAPS-B-HYGIENE-3: if Jetpack Compose is used, find every MapEffect(...) { mapView -> }. Flag unstable
   keys: new object literal inline, captured var (not remember-backed), Modifier, inline lambda.
   Recommend Unit for one-shot setup; stable remember-backed values for reactive effects.

Report: file:line | antipattern ID | issue | recommended fix.
```

#### MAPS-P9. Open-Ended & Executive Summary

```
MAPS-P9a. Identify the 5 most frequent style-mutation code paths — look for low-level calls
(setStyleLayerProperty, setStyleSourceProperty, addSource/removeStyleSource, addImage,
addLayer/removeStyleLayer, setLight/setTerrain/setAtmosphere), typed extension-style setters
(layer.lineColor(...), layer.visibility(...), etc.), and structural rebuilds (a whole layer/source
set torn down and re-added). Per path: frequency estimate | refactor opportunity | most impactful
single change. Rank by estimated render-thread savings. Refactor opportunities must stay within the
codebase's existing style (see catalog/antipattern fixes); do not suggest switching to Standard
style as the refactor.

MAPS-P9b. Produce an annotation manager inventory table: manager/use site | created at file:line |
logical purpose | which producers feed it and whether their counts are bounded in code | peak
annotation count | update frequency | consolidation opportunity with another manager of the same
type. Where an unbounded producer is routed to a non-clustering manager, say so — routing is often
the finding rather than manager count.

MAPS-P9c. Inventory layer / source / style-image ids two ways.
(1) Hard-coded literals: group by id; flag ids referenced from many places; flag the same string
    defined twice in different modules; separate ids the app owns from ids it only probes (base
    style or SDK-internal, which can change on an SDK or style update). Recommend centralizing in
    a Kotlin object. If there are no style-image id literals at all, say so and check why: most
    integrations never call addImage and let the annotation plugin name their icons, in which
    case the icon-identity question belongs to MAPS-B-ANNOT-3, not here — report zero literals as
    "not applicable", not as a pass.
(2) Ids generated per render (UUIDs or similar) rather than stable. Report these too — they are
    what makes visibility toggling (MAPS-B-STYLE-4) and diffing inapplicable, and a codebase can
    pass (1) while having the worse version of the problem.

MAPS-P9d. As a senior Maps SDK engineer, surface things that look surprising, off-pattern, or
inconsistent — even if not clearly bugs — in two lists, up to 10 each: (i) correctness risks,
(ii) hygiene and consistency. Per item: file:line | one-line description | one question for the
author.

MAPS-P9e. Write a one-paragraph executive summary: integration scale (rough lines of map-related
code, distinct map screens), primary use case, top 3 efficiency opportunities ranked by impact,
and any v11 features the codebase plausibly should adopt but does not. Do not include switching
from a custom style to Standard style as one of these — the choice of base style is a
design/business decision, not an efficiency gap, and is out of scope for this audit regardless
of which style the codebase uses.

MAPS-P9f. List any claim made in an earlier prompt of this audit that later evidence contradicts,
with the correction. Running MAPS-P1–MAPS-P9 in sequence — especially across fresh sessions —
produces early claims that later prompts disprove; state them here rather than leaving both
versions in the report.
```

---

### Style + Integration Artifacts

> **Human collection step — not agent output.** The prompts above audit how app code uses the style. To diagnose what the style itself costs (expression complexity, layer count, sprite size, import graph), also collect the following manually. Keep them with the findings, and include them if the developer shares the findings with Mapbox. Conclusions about render-thread cost are only reliable when both are reviewed together.

**MAPS-F1. Style URI / id.** The full style URI(s) used by the production app (e.g. `mapbox://styles/<owner>/<style-id>`). If multiple URIs are loaded for day/night or regional variants, list all with the context in which each is used.

**MAPS-F2. Style JSON snapshot.** Download via Styles API: `GET https://api.mapbox.com/styles/v1/<owner>/<style-id>?access_token=<pk>` and strip the token. Or log `mapboxMap.style?.styleJSON` once after style-loaded in a debug build.

**MAPS-F3. Style imports config.** If the custom style uses imports: list import ids, imported style URIs, current import config values (app-set and defaults), and where each value is set (file:line). If imports are not used today, note that — it may itself be a finding.

**MAPS-F4. Runtime mutation log.** Run a debug build for one representative session with a logger wrapping every call into: `setStyleLayerProperty`, `setStyleLayerProperties`, `setStyleSourceProperty`, source `featureCollection`/`feature`/`data`, `addImage`/`removeStyleImage`, `addLayer`/`removeStyleLayer`/`moveStyleLayer`, `setLight`/`setTerrain`/`setAtmosphere`/`setProjection`, `setStyleImportConfigProperty`, `loadStyle`. Log: timestamp, call, target id, and value size. This is the most useful artifact for diagnosing runtime style cost.

**MAPS-F5. Asset inventory.** All custom style images registered via `addImage` (id, dimensions, SDF flag, source); all GeoJsonSource ids (peak feature count, update cadence); any custom layer types or plugins beyond the standard set.

---

### Reporting

For each prompt, record: prompt ID, finding count, the finding table, and any false positives (report these to Mapbox if you want to help improve the audit).

Priority order: **MAPS-P5, MAPS-P6, MAPS-P7** (performance/rendering) > **MAPS-P2, MAPS-P3, MAPS-P4** (API modernization) > **MAPS-P8** (hygiene) > **MAPS-P9** (open-ended).
