# Compose Migration Workflow Templates

Output templates for the five steps. Fill them in as you go and show each one to the developer at the end of its step.

## Step 1: Inventory

One block per map screen.

```markdown
## Inventory: StoreMapActivity

Maps SDK: 11.x.y | Navigation SDK: 3.x.y or none (from Gradle / version catalog)
Compose extension: present at 11.x.y | missing
Host: Activity | Fragment | existing composable (`AndroidView { MapView }`)
Style: <style URI, or "not set (Standard)">
Before screenshot: <device, camera, app state> | not taken (<why>)

| Area        | Symbol / pattern                           | Call sites | Compose target                  | Mapping      | Notes                          |
| ----------- | ------------------------------------------ | ---------- | ------------------------------- | ------------ | ------------------------------ |
| Map view    | `<MapView>` with `mapbox_styleUri`, camera | 1          | `MapboxMap` + `style` slot      | direct       |                                |
| Lifecycle   | `mapView.onStart/onStop/onDestroy`         | 3          | delete                          | direct       |                                |
| Annotations | `PointAnnotationManager`, 120 markers      | 1          | `PointAnnotationGroup`          | direct       | Not one `PointAnnotation` each |
| Ornaments   | `mapbox_compassMarginTop="80dp"`           | 1          | `Compass(contentPadding = ...)` | **behavior** | Position must match            |
| Location    | `location.updateSettings`                  | 1          | `MapEffect(Unit)`               | effect       |                                |
| Navigation  | `MapboxManeuverView` in layout             | 1          | `AndroidView`                   | interop      |                                |
```

`Mapping` values:

- `direct`: a Compose API replaces it
- `effect`: no Compose API; it moves into `MapEffect` or `DisposableMapEffect`
- `interop`: a View that stays a View, hosted in `AndroidView`
- `behavior`: compiles, but what the user sees may change. Goes into the decision log.
- `blocked`: needs a newer Maps version for the Compose API, or Mapbox input

## Step 2: Plan

```markdown
## Compose migration plan

Order: 1. StoreMapActivity (simplest, sets the pattern) 2. TripFragment (navigation)

### StoreMapActivity

| #   | Area                 | Call sites | Effort | Blockers / decisions |
| --- | -------------------- | ---------- | ------ | -------------------- |
| 1   | Dependency, map view | 2          | S      | D1: style slot       |
| 2   | Camera and viewport  | 4          | S      |                      |
| 3   | Annotations          | 3          | M      | D3: draw order       |
| 4   | Ornaments            | 2          | S      | D2: positions        |

Total effort: <range>

### Decisions needed

| ID  | Area      | View screen                     | Compose default          | Options                                | Recommended  |
| --- | --------- | ------------------------------- | ------------------------ | -------------------------------------- | ------------ |
| D1  | Style     | `loadStyle(custom)` in onCreate | Standard in `style` slot | Pass the custom style in the slot      | Slot         |
| D2  | Ornaments | Compass 80dp from the top       | Compose default padding  | Match with `contentPadding` / accept   | Match        |
| D4  | Camera    | Reset on rotation               | Restored on rotation     | Keep restore (record it) / force reset | Keep restore |
```

Effort scale: **S** under 1 hour, **M** half a day, **L** 1-2 days, **XL** more than 2 days.

## Decision log

```markdown
| ID  | Decision                         | Decided by                              | Code change                                                                                     |
| --- | -------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| D1  | Custom style in the `style` slot | developer                               | `MapStyle(style = STORE_STYLE)` in StoreMapScreen.kt                                            |
| D2  | Compass position kept            | default (no answer, View behavior kept) | `Compass(contentPadding = PaddingValues(start = 4.dp, top = 80.dp, end = 4.dp, bottom = 4.dp))` |
```

When the developer doesn't answer, write "default (no answer, View behavior kept)" and match the View screen.

## Step 5: Summary

```markdown
## Compose migration summary

**Migrated:** StoreMapActivity. **Remaining on Views:** TripFragment (by choice).
**Result:** Builds on <variants>. Same style. <N> files changed, <M> XML layouts deleted.

### Decisions

- D1: Custom style passed in the `style` slot
- D4: Camera now survives rotation (accepted)

### Experimental APIs introduced

- <none> | `mapState.gesturesState` (needs `@OptIn(MapboxExperimental::class)`)

### Needs confirmation from Mapbox

- `TripScreen.kt:120`: `[VERIFY WITH MAPBOX]` <what and why>

### Not verified

- <e.g. "Navigation flow not driven on a device: no emulator with location simulation">

### Pre-existing issues (not changed)

| File:line            | Pattern                                    | Why it matters                     |
| -------------------- | ------------------------------------------ | ---------------------------------- |
| StoreMapScreen.kt:40 | Whole GeoJSON source replaced on selection | Rebuilds the source for one change |

### Next steps

- Migrate the remaining screens, one per change
- Run a Mapbox integration audit on the migrated screens, if an audit skill is installed
```

## Compose mistakes to catch during review

- `MapboxMap` inside an `if` or a `LazyColumn` item that toggles, so the map is destroyed and recreated
- `ComposeMapInitOptions(...)` whose values change across recompositions, so the map recreates. It's a data class and `MapboxMap` keys on it, so an inline instance with the same values is fine
- `MapEffect(someState)` keyed on fast-changing state, so setup reruns
- `MapEffect` registering listeners without `DisposableMapEffect` and `onDispose`
- A `forEach` of `PointAnnotation` over a large list instead of `PointAnnotationGroup`
- An options list rebuilt on every recomposition (wrap it in `remember(data)`)
- `rememberGeoJsonSourceState` holding large GeoJSON
- Leftover `mapView.onStart()`-style calls, or `mapView.compass`/`logo`/`scalebar`/`attribution` calls in `MapEffect`
- Navigation APIs (`MapboxRouteLineView`, `MapboxManeuverApi`) created inside a composable
- Observers registered from composition instead of `MapboxNavigationObserver.onAttached`
- Both `MapViewportState` and `NavigationCamera` moving the camera on one screen
