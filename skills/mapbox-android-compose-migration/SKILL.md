---
name: mapbox-android-compose-migration
description: Move Android Mapbox map and navigation screens from the View system (XML MapView, AndroidView-wrapped MapView, fragments) to Jetpack Compose with a coding agent. Covers the Mapbox parts of the screen (MapboxMap composable, viewport state, style and annotation composables, MapEffect, lifecycle, Navigation SDK v3 wiring) and leaves the rest of the screen to Google's XML-to-Compose skill. Keeps the map looking and behaving the same, one screen at a time. Use when migrating a Mapbox screen to Compose, planning that work, or fixing a map that broke after moving to Compose.
---

# Mapbox Android Screens → Jetpack Compose

Moves Android map and navigation screens built on the View system to Jetpack Compose. The agent does the work. The developer makes the decisions.

This skill covers only what's specific to Mapbox. Google's [migrate XML views to Jetpack Compose](https://developer.android.com/agents/skills/jetpack-compose/migration/migrate-xml-views-to-jetpack-compose/skill) skill covers the rest of the screen (layouts, theming, other views, Compose setup). Use both: Google's skill for the screen, this one for the map.

**Reference files:**

- `references/maps.md`: View → Compose mappings for Maps SDK v11 (map view, camera, style, annotations, events, interactions, location, ornaments, lifecycle)
- `references/navigation.md`: running Navigation SDK v3 on a `MapboxMap` composable (lifecycle, route line, camera, puck, observers, View-based UI components)
- `references/migration-workflow.md`: templates for the inventory, plan, decision log and summary

Load `maps.md` for every migration. Also load `navigation.md` when the screen uses the Navigation SDK.

## When to use

- The app shows a Mapbox map in an XML layout, a fragment, or `AndroidView { MapView(...) }`, and the developer wants that screen in Compose
- The developer asks "how much work is it to move our map screens to Compose?". Run steps 1 and 2 only and stop.
- A map screen broke after moving to Compose (blank map, map reloads on recomposition, listeners firing twice, `PluginDisabledException`)
- The Maps v10 → v11 or Navigation v2 → v3 migration skill recommended Compose as the next step

**Not covered:**

- Apps on Maps SDK v10 or Navigation SDK v2. Migrate first with `mapbox-android-maps-v10-to-v11-migration` or `mapbox-android-navigation-v2-to-v3-migration`. Never combine an SDK version migration and a Compose migration in one change.
- The non-map parts of the screen. Use Google's skill.
- Changing the map style, moving to Mapbox Standard, or turning on other data products
- Flutter and React Native
- Navigation SDK for iOS, or the drop-in `NavigationView` (removed in Navigation SDK v3)

## Rules

These rules apply to every step.

### 1. Requirements

- Maps SDK **11.6.0 or later**. The Compose extension became stable in 11.6.0. Earlier releases marked it experimental and had different signatures.
- The extension artifact is `com.mapbox.extension:maps-compose`, at **the same version** as `com.mapbox.maps:android`. Other group IDs (`com.mapbox.maps:compose`, `com.mapbox.maps:maps-compose`) don't exist.
- Use the app's current Maps version. If a target API in `references/maps.md` needs a newer one, use the row's fallback, or propose a Maps bump as a separate change. Don't bump the SDK silently as part of this migration.

### 2. No silent behavior change

Moving to Compose can change what the user sees even when the code compiles. Examples: the composable loads Standard when the `style` slot is left at its default, the ornaments render as Compose with their own defaults, and the camera now survives configuration changes. `references/maps.md` has a **Behavior changes** table. For every row that applies:

1. Present it as a decision. Say what the View screen did, what Compose does by default, and the options.
2. Default to **matching the View screen** if the developer doesn't answer, and say so.
3. Record it in the decision log (`references/migration-workflow.md`).

### 3. Keep the style and data products

Carry the screen's style over exactly: the same style URI or JSON, the same imports and config, the same runtime layers. A View screen that never set a style loaded Standard, and so does the composable, so leave it. Don't move a screen to Standard or change tilesets as part of the migration.

### 4. Declarative where it exists, `MapEffect` where it doesn't

Use the Compose API when `references/maps.md` lists one: `MapboxMap` parameters, `MapViewportState`, `MapState`, the `style` slot, source and layer composables, annotation composables, `ViewAnnotation`. Use `MapEffect` or `DisposableMapEffect` only for what has no Compose API (location puck settings, custom location providers, Navigation SDK glue, debug options, custom layers). Don't wrap a whole View-era setup function in one `MapEffect` and call it migrated.

`MapEffect` rules:

- Key it on what the effect actually depends on, usually `Unit`. Don't key it on state that changes often. Each change cancels and reruns the block.
- Use `DisposableMapEffect` when the block registers listeners or observers, and unregister them in `onDispose`
- Don't create long-lived objects (route line views, annotation managers, APIs with `cancel()`) inside a `MapEffect` that can rerun

### 5. Grounding

Only use symbols from the references, the official [Compose guide](https://docs.mapbox.com/android/maps/guides/using-jetpack-compose/), or the SDK source and docs for the app's version. If you're unsure whether a symbol exists or has the stated signature, don't invent one. Write the closest match, add `// [VERIFY WITH MAPBOX]` at the call site, and list it in the report. Entries marked **experimental** need `@OptIn(MapboxExperimental::class)`. Tell the developer before introducing one.

### 6. One screen at a time; mixed apps are fine

Migrate one map screen per change. Leaving other screens on the View system, or keeping a View `MapView` while the rest of the app moves to Compose, is a valid end state. Don't migrate screens the developer didn't pick.

## Questions vs a full migration

Run the workflow below when you have the project and the developer asks you to migrate or plan. When the developer describes a screen or pastes code in chat, answer directly instead of filling in the templates:

- **"How do we move this screen?"** Give the Compose code for the map parts, the decisions it raises (one line each), and what stays a View. Lead with code, not an inventory table. Keep it compact: one code block for the screen's skeleton (the `MapboxMap` call, its effects and the hosted views), with `// ...` for bodies that don't change, then short bullets for the rules behind it. Don't restate code the developer already has.
- **"Is this Compose map code right?"** Name each problem, its cause and the fix, with corrected code
- **"How much work is it?" without the code.** Give a provisional estimate by screen type (plain map with a style and listeners: S; annotations, layers and gestures: M; Navigation screens: L) with your assumptions, the version blockers, the decisions to expect, the one-screen-at-a-time order, and that the rest of each screen goes to Google's skill. Then ask for the code to firm it up.

## Workflow

Run the five steps in order. Don't edit code before step 2 is done and shown to the developer.

### Step 1: Inventory

For each map screen, record:

- Where the map is created (XML `MapView`, `MapView(context)` in code, `AndroidView { MapView(...) }`) and its host (Activity, Fragment, existing composable)
- XML attributes on the `MapView` (camera, style, ornaments, gestures, `mapbox_mapSurface`)
- Map APIs used, by area, using the **inventory search list** in `references/maps.md` (and `references/navigation.md` for navigation screens)
- Manual lifecycle calls (`mapView.onStart()`, `onStop()`, `onDestroy()`, `onLowMemory()`)
- Navigation View components (`MapboxManeuverView`, `MapboxTripProgressView` and the others listed in `references/navigation.md`)

Check the Maps (and Navigation) SDK version against Rule 1.

If the app can run on an emulator or device, offer to take **before screenshots** of the map screens now. Note the device, camera position and app state so the after screenshot repeats them. Compose Previews don't render a live map, so device screenshots are the only visual check for the map itself.

### Step 2: Plan

Suggest the order. Start with the simplest screen (one map, few annotations, no navigation) to establish the pattern. For each screen, list per area: the call sites, the Compose target, effort (S < 1h, M = half a day, L = 1-2 days, XL = more, or blocked), and blockers. List every row from the **Behavior changes** table that applies as a decision. Use the plan template in `references/migration-workflow.md`.

Every plan also states:

- That Google's XML-to-Compose skill covers the non-map parts of each screen, and this plan covers the map
- That screens left on the View system are a valid end state (Rule 6). Ask which screens the developer wants moved, rather than assuming all of them.
- Any version blocker from Rule 1, as a separate change before the migration

The plan on its own answers "how much work is this?". If that was the question, stop here.

### Step 3: Migrate one screen

1. Add the Compose extension dependency if missing (Rule 1). Google's skill covers the Compose compiler and BOM.
2. Build the `MapboxMap` call: style slot, `rememberMapViewportState` for the initial camera, ornament slots, click listeners. Follow `references/maps.md`.
3. Move each area in plan order, using the **Target** column
4. Delete the manual lifecycle calls. The composable handles lifecycle (see `references/maps.md`).
5. Navigation screens: follow `references/navigation.md` for the lifecycle, route line, camera and puck
6. Replace the screen's usage (`setContent`, `ComposeView` in a fragment, or the navigation graph destination) as Google's skill describes
7. Build (`./gradlew assembleDebug` or the app's variant) and fix errors before moving to the next screen
8. Delete the XML layout and the View-only code only once nothing else references them

### Step 4: Verify

- [ ] The app builds for every variant that shows the screen
- [ ] The map uses the **same style** as before
- [ ] If before screenshots exist, take after screenshots on the same device and state. List every visible difference (style, ornament positions, puck, annotations, route line, camera framing) with the decision it comes from, or as a regression
- [ ] No manual `mapView.onStart/onStop/onDestroy/onLowMemory` calls remain for this screen
- [ ] No `mapView.compass`, `mapView.logo`, `mapView.attribution`, `mapView.scalebar`, `mapView.indoorSelector` or lifecycle-plugin calls in `MapEffect` (they throw `PluginDisabledException` from 11.35)
- [ ] Rotate the device, background and foreground the app, and navigate away and back. The map shouldn't reload its style on recomposition, and listeners shouldn't fire twice
- [ ] Taps on annotations and interactive features still work, and the location puck shows
- [ ] Navigation screens: route line, maneuver banner, trip progress, camera following and overview, and rerouting all work. Observers are unregistered when the screen leaves
- [ ] Every decision is recorded and every `[VERIFY WITH MAPBOX]` tag is listed
- [ ] Existing tests that touch the screen still pass

If you can't run the app, say so in the report. Don't claim it was checked.

### Step 5: Report

Write the summary from `references/migration-workflow.md`: screens migrated and remaining, decisions taken, `[VERIFY WITH MAPBOX]` items, experimental APIs introduced, and pre-existing issues seen but not fixed (for example a style reload to switch themes, or a camera move on every location update). If an audit skill is installed (for example `mapbox-mobile-sdk-audit`), recommend running it on the migrated screens.

## Quick reference

| View system                                       | Compose                                                                      |
| ------------------------------------------------- | ---------------------------------------------------------------------------- |
| `<com.mapbox.maps.MapView>` in XML                | `MapboxMap(...)` composable                                                  |
| `mapbox_styleUri` / `loadStyle(...)`              | `style = { MapStyle(style = ...) }` or `{ MapboxStandardStyle() }`           |
| XML camera attributes / `setCamera(...)`          | `rememberMapViewportState { setCameraOptions { ... } }`                      |
| `mapView.camera.flyTo(...)`                       | `mapViewportState.flyTo(...)`                                                |
| `viewport.transitionTo(followPuckState)`          | `mapViewportState.transitionToFollowPuckState()`                             |
| `addOnMapClickListener`                           | `MapboxMap(onMapClickListener = ...)`                                        |
| `subscribeCameraChanged` / `subscribeMapIdle`     | `mapState.cameraChangedEvents` / `mapState.mapIdleEvents` flows              |
| `PointAnnotationManager` with many annotations    | `PointAnnotationGroup(annotations = ...)`                                    |
| Single annotation + click listener                | `PointAnnotation(point) { iconImage = ...; interactionsState.onClicked {} }` |
| `addInteraction(ClickInteraction.standardPoi {})` | `standardStyleState.interactionsState.onPoiClicked {}`                       |
| `mapView.location.updateSettings { ... }`         | Same call inside `MapEffect(Unit)`                                           |
| `mapView.compass.updateSettings { ... }`          | `compass = { Compass(alignment = ...) }` slot                                |
| `mapView.onStart()` / `onStop()` / `onDestroy()`  | Delete. The composable handles lifecycle.                                    |
| Navigation route line, camera, puck               | `DisposableMapEffect(Unit)` with the same Navigation APIs                    |
| `MapboxManeuverView`, `MapboxTripProgressView`    | Host in `AndroidView`, or rebuild in Compose                                 |

## Related skills

- `mapbox-android-patterns`: building Maps features on Android, including Compose
- `mapbox-navigation-patterns`: building navigation features
- `mapbox-android-maps-v10-to-v11-migration`, `mapbox-android-navigation-v2-to-v3-migration`: run these first on older SDKs
