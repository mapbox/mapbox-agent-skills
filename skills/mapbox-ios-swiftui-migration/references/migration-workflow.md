# SwiftUI Migration Workflow Templates

Output templates for the five steps. Fill them in as you go and show each one to the developer at the end of its step.

## Step 1: Inventory

One block per map screen.

```markdown
## Inventory: StoreMapViewController

Maps SDK: 11.x.y | Navigation SDK: 3.x.y or none (from Package.resolved / Podfile.lock)
Host: UIViewController | storyboard scene | UIViewRepresentable in SwiftUI
Style: <style URI, or "not set (Standard)">
Experimental SPI already imported: yes (<where>) | no
MapKit imported in SwiftUI files: yes | no
Before screenshot: <device, camera, app state> | not taken (<why>)

| Area        | Symbol / pattern                                    | Call sites | SwiftUI target                           | Mapping     | Notes                                |
| ----------- | --------------------------------------------------- | ---------- | ---------------------------------------- | ----------- | ------------------------------------ |
| Map view    | `MapView(frame:mapInitOptions:)` with style, camera | 1          | `Map(initialViewport:)` + `.mapStyle`    | direct      |                                      |
| Annotations | `PointAnnotationManager`, 120 markers, `tapHandler` | 1          | `PointAnnotationGroup` + `.onTapGesture` | direct      | Not one `PointAnnotation` each       |
| Annotations | `isDraggable = true` on the drop-off pin            | 1          | none (stable)                            | **blocked** | Decision: keep UIKit or experimental |
| Ornaments   | `compass.margins = CGPoint(x: 8, y: 80)`            | 1          | `.ornamentOptions(...)`                  | direct      |                                      |
| Events      | `onMapLoaded.observeNext` + `cancelables`           | 1          | `.onMapLoaded { }`                       | direct      |                                      |
| Queries     | `queryRenderedFeatures` on a button                 | 1          | `MapReader` + `proxy.map`                | proxy       |                                      |
| Navigation  | `NavigationMapView` as the view                     | 1          | `UIViewControllerRepresentable`          | interop     |                                      |
```

`Mapping` values:

- `direct`: a SwiftUI API replaces it
- `proxy`: no SwiftUI API; it goes through `MapReader` and `MapProxy`
- `interop`: a UIKit view or controller that stays UIKit, hosted in a representable
- `behavior`: compiles, but what the user sees may change. Goes into the decision log.
- `blocked`: needs a newer Maps version, an experimental API, or Mapbox input

## Step 2: Plan

```markdown
## SwiftUI migration plan

Covers the map. The rest of each screen is the team's normal SwiftUI work.
Order: 1. StoreMapViewController (simplest, sets the pattern) 2. TripViewController (navigation)

### StoreMapViewController

| #   | Area                | Call sites | Effort | Blockers / decisions |
| --- | ------------------- | ---------- | ------ | -------------------- |
| 1   | Map view and style  | 2          | S      |                      |
| 2   | Camera and viewport | 4          | S      | D2: camera on return |
| 3   | Annotations         | 3          | M      | D1: draggable pin    |
| 4   | Events and queries  | 2          | S      |                      |

Total effort: <range>

### Decisions needed

| ID  | Area        | UIKit screen                   | SwiftUI default                      | Options                                                                                         | Recommended           |
| --- | ----------- | ------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------- | --------------------- |
| D1  | Annotations | Draggable drop-off pin         | Not supported on layer annotations   | Keep screen on UIKit / `MapReader` + UIKit manager / experimental draggable `MapViewAnnotation` | `MapReader` + manager |
| D2  | Camera      | Camera kept while the VC lived | `initialViewport` again when rebuilt | Hold `Viewport` in the model / accept                                                           | Hold in model         |
```

Effort scale: **S** under 1 hour, **M** half a day, **L** 1-2 days, **XL** more than 2 days.

## Decision log

```markdown
| ID  | Decision                         | Decided by                               | Code change                                          |
| --- | -------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| D1  | Draggable pin via `MapReader`    | developer                                | `StoreMapView.swift`: manager made in `.onMapLoaded` |
| D2  | Viewport held in `StoreMapModel` | default (no answer, UIKit behavior kept) | `Map(viewport: $model.viewport)`                     |
```

When the developer doesn't answer, write "default (no answer, UIKit behavior kept)" and match the UIKit screen.

## Step 5: Summary

```markdown
## SwiftUI migration summary

**Migrated:** StoreMapViewController → StoreMapView. **Remaining on UIKit:** TripViewController (by choice).
**Result:** Builds for <schemes>. Same style. <N> files changed, <M> storyboard scenes removed.

### Decisions

- D1: Draggable pin kept through `MapReader` with a UIKit annotation manager
- D2: Viewport held in the model so the camera survives navigation

### Experimental APIs introduced

- <none> | `MapViewAnnotation(coordinate:content:onDraggingChanged:)` (needs `@_spi(Experimental) import MapboxMaps`)

### Needs confirmation from Mapbox

- `StoreMapView.swift:88`: `[VERIFY WITH MAPBOX]` <what and why>

### Not verified

- <e.g. "Navigation flow not driven on a device: no simulated route available">

### Pre-existing issues (not changed)

| File:line             | Pattern                                    | Why it matters                     |
| --------------------- | ------------------------------------------ | ---------------------------------- |
| StoreMapView.swift:40 | Whole GeoJSON source replaced on selection | Rebuilds the source for one change |

### Next steps

- Migrate the remaining screens, one per change
- Run a Mapbox integration audit on the migrated screens, if an audit skill is installed
```

## SwiftUI mistakes to catch during review

- `Map` inside an `if`/`else` or a `List` row that toggles, so the map is destroyed and recreated
- `.id(...)` on `Map` tied to changing state, which recreates it
- `ForEvery` of `PointAnnotation` over a large list instead of `PointAnnotationGroup`
- Annotation data without stable IDs, or rebuilt in `body` with new IDs each time
- Every `onCameraChanged` event written to `@State`
- `proxy.map?.loadStyle(...)` in `.onAppear` instead of `.mapStyle(...)`
- Sources and layers added through `proxy.map` that could be map content, then lost on style reload
- A `Viewport` binding and `proxy.camera` both moving the camera
- `@_spi(Experimental)` added without telling the developer
- `MapboxNavigationProvider` created in `body`, in an `@ObservedObject` initializer, or more than once
- `NavigationMapView` created in `updateUIViewController` or `updateUIView`
- `.sink` subscriptions stored on a SwiftUI view struct
- `Map` ambiguous because the file also imports `MapKit`
