---
name: mapbox-ios-swiftui-migration
description: Move iOS Mapbox map and navigation screens from UIKit (MapView in a view controller, storyboards, or UIViewRepresentable wrappers) to SwiftUI with a coding agent. Covers the Mapbox parts of the screen (the SwiftUI Map view, Viewport, map content for styles and annotations, MapReader, events, Navigation SDK v3 hosting) and marks which APIs are stable and which are experimental. Keeps the map looking and behaving the same, one screen at a time. Use when migrating a Mapbox screen to SwiftUI, planning that work, or fixing a map that broke after moving to SwiftUI.
---

# Mapbox iOS Screens → SwiftUI

Moves iOS map and navigation screens built with UIKit to SwiftUI. The agent does the work. The developer makes the decisions.

This skill covers only what's specific to Mapbox: the map, its content, its camera and its events. The rest of the screen (layout, navigation stack, view models, theming) is the app team's normal SwiftUI work. Say so in the plan rather than guessing at the app's architecture.

**Reference files:**

- `references/maps.md`: UIKit → SwiftUI mappings for Maps SDK v11 (map view, style, camera and viewport, events, gestures, interactions, annotations, location, ornaments)
- `references/navigation.md`: Navigation SDK v3 screens in SwiftUI (hosting `NavigationMapView` and `NavigationViewController`, Combine publishers to SwiftUI state, what the SwiftUI `Map` can't do)
- `references/migration-workflow.md`: templates for the inventory, plan, decision log and summary

Load `maps.md` for every migration. Also load `navigation.md` when the screen uses the Navigation SDK.

## When to use

- The app shows a Mapbox map in a `UIViewController`, a storyboard, or a `UIViewRepresentable` wrapper inside SwiftUI, and the developer wants that screen on the SwiftUI `Map`
- The developer asks "how much work is it to move our map screens to SwiftUI?". Run steps 1 and 2 only and stop.
- A map screen broke after moving to SwiftUI (map recreated on navigation, camera jumps back, taps not firing, layers disappear after a style change, high CPU from camera updates)
- The Maps v10 → v11 or Navigation v2 → v3 migration skill recommended SwiftUI as the next step

**Not covered:**

- Apps on Maps SDK v10 or Navigation SDK v2. Migrate first with `mapbox-ios-maps-v10-to-v11-migration` or `mapbox-ios-navigation-v2-to-v3-migration`. Never combine an SDK version migration and a SwiftUI migration in one change.
- The non-map parts of the screen
- Changing the map style, moving to Mapbox Standard, or turning on other data products
- Flutter and React Native
- Android. Use `mapbox-android-compose-migration` if it's installed.

## Rules

These rules apply to every step.

### 1. Requirements

- Maps SDK **11.6.0 or later**. The SwiftUI API was marked stable in 11.6.0. Earlier 11.x releases shipped it as experimental, with signatures that changed between releases.
- `Map` is part of `MapboxMaps`. There's no separate package to add.
- Use the app's current Maps version. If a target API in `references/maps.md` needs a newer one (for example `TapInteraction` as map content, stable since 11.12), use the row's fallback, or propose a Maps bump as a separate change. Don't bump the SDK silently as part of this migration.

### 2. Stable APIs only, unless the developer agrees

Some SwiftUI-facing APIs still need `@_spi(Experimental) import MapboxMaps` (for example `Marker`, draggable `MapViewAnnotation`, `viewAnnotationAvoidLayers`). `references/maps.md` marks them. Don't introduce one to replace stable UIKit code without asking. If the app already imports `@_spi(Experimental)`, keep using what it uses, and list it in the report.

### 3. No silent behavior change

Moving to SwiftUI can change what the user sees even when the code compiles. Examples: a single `PointAnnotation` per marker puts each marker on its own layer, the map is recreated when the view's identity changes, and the camera returns to `initialViewport` when the screen is rebuilt. `references/maps.md` has a **Behavior changes** table. For every row that applies:

1. Present it as a decision. Say what the UIKit screen did, what SwiftUI does by default, and the options.
2. Default to **matching the UIKit screen** if the developer doesn't answer, and say so.
3. Record it in the decision log (`references/migration-workflow.md`).

### 4. Keep the style and data products

Carry the screen's style over exactly: the same style URI or JSON, the same Standard config (light preset, labels), the same runtime sources and layers with the same IDs. A UIKit screen that never set a style loaded Standard, and so does `Map`, so leave it. Don't move a screen to Standard or change tilesets as part of the migration.

### 5. Declarative where it exists, `MapReader` where it doesn't

Use the SwiftUI API when `references/maps.md` lists one: `Map` modifiers, `Viewport`, map content (sources, layers, annotations, `Puck2D`, `TapInteraction`), event modifiers. Use `MapReader` and `MapProxy` only for what has no SwiftUI API (queries, snapshots, custom layers, annotation manager features the groups don't expose). Don't move a whole `viewDidLoad` into one `.onAppear { proxy.map ... }` and call it migrated.

`MapReader` rules:

- `proxy.map`, `proxy.camera`, `proxy.location` and `proxy.viewport` are optional. They're nil until the map exists.
- Don't add sources or layers through `proxy.map` when they can be map content. Layers added through the proxy aren't part of the declaration and are lost on style reload.
- Don't drive the camera from both `proxy.camera` and a `Viewport` binding on one screen

### 6. Grounding

Only use symbols from the references, the official [SwiftUI user guide](https://docs.mapbox.com/ios/maps/api/latest/documentation/mapboxmaps/swiftui-user-guide), the [SwiftUI examples](https://github.com/mapbox/mapbox-maps-ios/tree/main/Sources/Examples/SwiftUI%20Examples), or the SDK source and docs for the app's version. If you're unsure whether a symbol exists or has the stated signature, don't invent one. Write the closest match, add `// [VERIFY WITH MAPBOX]` at the call site, and list it in the report.

### 7. One screen at a time; mixed apps are fine

Migrate one map screen per change. A UIKit app hosting SwiftUI map screens through `UIHostingController`, or a SwiftUI app keeping a UIKit `MapView` in a `UIViewRepresentable`, is a valid end state. Don't migrate screens the developer didn't pick.

## Questions vs a full migration

Run the workflow below when you have the project and the developer asks you to migrate or plan. When the developer describes a screen or pastes code in chat, answer directly instead of filling in the templates:

- **"How do we move this screen?"** Give the SwiftUI code for the map parts, the decisions it raises (one line each), and what stays UIKit. Lead with code, not an inventory table. Keep it compact: one code block for the screen's skeleton (the `Map` call, its content and modifiers, and any hosted UIKit views), with `// ...` for bodies that don't change, then short bullets for the rules behind it. Don't restate code the developer already has.
- **"Is this SwiftUI map code right?"** Name each problem, its cause and the fix, with corrected code
- **"How much work is it?" without the code.** Give a provisional estimate by screen type (plain map with a style and taps: S; annotations, layers and gestures: M; Navigation screens: L) with your assumptions, the version blockers, the decisions to expect, the one-screen-at-a-time order, and that the non-map parts of each screen are separate work. Then ask which screens they want moved, and for the code to firm up the estimate.

## Workflow

Run the five steps in order. Don't edit code before step 2 is done and shown to the developer.

### Step 1: Inventory

For each map screen, record:

- Where the map is created (`MapView(frame:mapInitOptions:)` in a view controller, a storyboard or XIB with a `MapView` custom class, or a `UIViewRepresentable` wrapping `MapView`) and its host (`UIViewController`, `UIHostingController`, a SwiftUI view)
- Map APIs used, by area, using the **inventory search list** in `references/maps.md` (and `references/navigation.md` for navigation screens)
- Delegates and stored `Cancelable`s / `AnyCancellable`s: these show what has to move into modifiers or the view model
- `@_spi(Experimental)` imports already in the app
- Whether the app also imports `MapKit` in SwiftUI files (`Map` is ambiguous then; see `references/maps.md`)

Check the Maps (and Navigation) SDK version against Rule 1.

If the app can run in the simulator or on a device, offer to take **before screenshots** of the map screens now. Note the device, camera position and app state so the after screenshot repeats them. Xcode Previews don't render a live map reliably, so simulator or device screenshots are the visual check for the map itself.

### Step 2: Plan

Suggest the order. Start with the simplest screen (one map, few annotations, no navigation) to establish the pattern. For each screen, list per area: the call sites, the SwiftUI target, effort (S < 1h, M = half a day, L = 1-2 days, XL = more, or blocked), and blockers. List every row from the **Behavior changes** table that applies as a decision. Use the plan template in `references/migration-workflow.md`.

Every plan also states:

- That the plan covers the map, and the non-map parts of each screen are the team's normal SwiftUI work
- That screens left on UIKit are a valid end state (Rule 7). Ask which screens the developer wants moved, rather than assuming all of them.
- Any version blocker from Rule 1, as a separate change before the migration
- Any feature that has no stable SwiftUI API (draggable layer annotations, for example), with the option to keep that screen on UIKit

The plan on its own answers "how much work is this?". If that was the question, stop here.

### Step 3: Migrate one screen

1. Build the `Map` call: initial camera (`initialViewport`, or a `@State` `Viewport` if other UI moves the camera), `.mapStyle(...)` with the screen's style, ornament and gesture options. Follow `references/maps.md`.
2. Move each area in plan order, using the **Target** column
3. Move delegates and stored subscriptions into modifiers (`.onMapLoaded`, `.onCameraChanged`), map content handlers (`TapInteraction`, `.onTapGesture`), or the screen's view model. Delete the `Cancelable` bookkeeping that SwiftUI now owns.
4. Navigation screens: follow `references/navigation.md`
5. Replace the screen's entry point (push the SwiftUI view in the app's navigation, or wrap it in `UIHostingController` from the existing UIKit flow)
6. Build for the simulator (`xcodebuild` with the app's scheme, or Xcode) and fix errors before moving to the next screen
7. Delete the view controller, storyboard scene and UIKit-only code only once nothing else references them

### Step 4: Verify

- [ ] The app builds for every target and configuration that shows the screen
- [ ] The map uses the **same style** as before
- [ ] If before screenshots exist, take after screenshots on the same device and state. List every visible difference (style, ornament positions, safe-area padding, puck, annotations, route line, camera framing) with the decision it comes from, or as a regression
- [ ] Push and pop the screen, background and foreground the app, and rotate. The map shouldn't reload its style when unrelated state changes, and handlers shouldn't fire twice
- [ ] Taps on annotations and interactive features still work, and the location puck shows
- [ ] Layers declared as map content survive a style change, if the screen switches styles
- [ ] Navigation screens: route line, instructions, camera following and overview, and rerouting all work. Subscriptions end when the screen leaves
- [ ] Every decision is recorded, every `[VERIFY WITH MAPBOX]` tag is listed, and every experimental API introduced is listed
- [ ] Existing unit and UI tests that touch the screen still pass

If you can't run the app, say so in the report. Don't claim it was checked.

### Step 5: Report

Write the summary from `references/migration-workflow.md`: screens migrated and remaining, decisions taken, `[VERIFY WITH MAPBOX]` items, experimental APIs introduced, and pre-existing issues seen but not fixed (for example a style reload to switch themes, or a camera move on every location update). If an audit skill is installed (for example `mapbox-mobile-sdk-audit`), recommend running it on the migrated screens.

## Quick reference

| UIKit                                                             | SwiftUI                                                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `MapView(frame:mapInitOptions:)` in a view controller             | `Map(initialViewport:) { ... }` or `Map(viewport: $viewport) { ... }`             |
| `UIViewRepresentable` wrapping `MapView`                          | `Map` (remove the wrapper)                                                        |
| `MapInitOptions(styleURI:)` / `mapboxMap.mapStyle = ...`          | `.mapStyle(...)`                                                                  |
| `MapInitOptions(cameraOptions:)`                                  | `initialViewport: .camera(center:zoom:bearing:pitch:)`                            |
| `mapView.camera.fly(to:duration:)`                                | `withViewportAnimation(.fly) { viewport = .camera(...) }`                         |
| `viewport.transition(to: viewport.makeFollowPuckViewportState())` | `viewport = .followPuck(zoom:)`                                                   |
| `mapboxMap.onMapLoaded.observeNext { }` + stored `Cancelable`     | `.onMapLoaded { }`                                                                |
| `mapboxMap.addInteraction(TapInteraction { })`                    | `TapInteraction { }` as map content                                               |
| `makePointAnnotationManager()` + `manager.annotations = [...]`    | `PointAnnotationGroup(items) { PointAnnotation(...) }`                            |
| `annotation.tapHandler = { }`                                     | `PointAnnotation(...).onTapGesture { }`                                           |
| `mapView.viewAnnotations.add(ViewAnnotation(coordinate:view:))`   | `MapViewAnnotation(coordinate:) { SwiftUIView() }`                                |
| `setMapStyleContent { }` / `addSource` + `addLayer` in style load | Sources and layers as map content inside `Map { }`                                |
| `location.options.puckType = .puck2D(...)`                        | `Puck2D(bearing: .heading)` as map content                                        |
| `location.override(provider:)`                                    | `.locationDataModel(LocationDataModel(location:heading:))`                        |
| `ornaments.options.compass.visibility = .hidden`                  | `.ornamentOptions(OrnamentOptions(compass: CompassViewOptions(visibility: ...)))` |
| `gestures.options.rotateEnabled = false`                          | `.gestureOptions(GestureOptions(rotateEnabled: false))`                           |
| Anything else on `mapView` / `mapboxMap`                          | `MapReader { proxy in ... }`, then `proxy.map`, `proxy.camera`                    |
| `NavigationMapView`, `NavigationViewController`                   | Host in `UIViewControllerRepresentable` (see `references/navigation.md`)          |

## Related skills

- `mapbox-ios-patterns`: building Maps features on iOS, in SwiftUI and UIKit
- `mapbox-navigation-patterns`: building navigation features
- `mapbox-ios-maps-v10-to-v11-migration`, `mapbox-ios-navigation-v2-to-v3-migration`: run these first on older SDKs
