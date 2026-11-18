---
name: mapbox-navigation-v2-to-v3-migration
description: Migrate an iOS or Android app from Mapbox Navigation SDK v2 to v3 with a coding agent. Inventories v2 usage, plans the work by area with effort and blockers, migrates one area at a time, and surfaces every behavior change (reroute veto, arrival callbacks, leg advancing) as a developer decision. Maps each v2 hook the app uses for its own telemetry to its v3 source or says it is gone, and maps Drop-in UI to the v3 UI components. Hands map-layer changes to mapbox-maps-v10-to-v11-migration. Use when upgrading Navigation SDK v2, estimating a v2 to v3 migration, or fixing a build after bumping to v3.
---

# Mapbox Navigation SDK v2 → v3 Migration

Moves an iOS or Android app from Navigation SDK v2 to the latest Navigation SDK v3 release. The agent does most of the work. The developer makes the decisions.

Navigation SDK v3 requires Maps SDK v11. Every app on Navigation v2 is also on Maps v10, so **this migration includes a Maps v10 → v11 migration**. Use the `mapbox-maps-v10-to-v11-migration` skill for the map layer (map view, style, annotations, camera APIs, gestures). This skill covers what the Navigation SDK owns: configuration, route requests, the trip session, observers and events, rerouting, arrival, voice, the navigation UI, route line and navigation camera.

**Reference files:**

- `references/migration-workflow.md`: templates for the inventory, plan, decision log, telemetry map and migration summary
- `references/ios.md`: v2 → v3 mappings for iOS (`MapboxCoreNavigation` → `MapboxNavigationCore`, `MapboxNavigation` → `MapboxNavigationUIKit`)
- `references/android.md`: v2 → v3 mappings for Android (Kotlin, Java)

Load the reference for the platform you are migrating. A project with both platforms gets two separate migrations, one per platform.

## When to use

- The app depends on Navigation SDK v2 (iOS `MapboxCoreNavigation` / `MapboxNavigation` 2.x, Android `com.mapbox.navigation:*` 2.x)
- The developer asks "how much work is it to move to v3?". Run steps 1 and 2 only and stop.
- The build broke after the dependency was bumped to 3.x

**Not covered:**

- Flutter and React Native
- Changing the map style, moving to Mapbox Standard, or turning on other data products. This includes traffic data versions, live incidents, EV routing and HD features.
- Changing route request parameters (profile, annotations, exclusions) beyond what the v3 API requires
- Token changes beyond moving the token to where v3 reads it
- Fixing app bugs that have nothing to do with the migration
- Legal or pricing advice

## Rules

These rules apply to every step.

### 1. Migrate to the current recommended API, not a literal port

Read the official v3 migration guide for the platform first. It describes the new structure:

- iOS: [Migrate core](https://docs.mapbox.com/ios/navigation/guides/migration/migrate-core/) and [Migrate UI](https://docs.mapbox.com/ios/navigation/guides/migration/migrate-ui/). Delegates and `NotificationCenter` notifications become Combine publishers on `MapboxNavigation`.
- Android: [Migrate to Navigation SDK v3](https://docs.mapbox.com/android/navigation/guides/migration-from-v2/). `MapboxNavigation` is owned by `MapboxNavigationApp`.

The platform reference doesn't copy the guides. It adds what they leave out: callbacks apps actually use that the guides don't map, behavior changes, telemetry, and mappings where the guide is out of date. When the guide and the reference disagree, the reference wins. If you can't fetch the guide, work from the reference alone and say so in the report.

The map layer follows the Maps skill's rule: move tap handling to Featureset Interactions and selection highlighting to Feature State, not a literal port.

### 2. No silent behavior change

Navigation v3 removed or changed several callbacks that let the app **decide** something. Examples on iOS:

- `shouldRerouteFrom` returned `Bool` to veto a reroute. v3 has no per-reroute veto: the SDK reroutes, and `willRerouteFrom` only reports it.
- `willArriveAt(_:after:distance:)` is removed
- `didArriveAt` returned `Bool` to control advancing to the next leg. It now returns nothing. Leg advancing is set once in `CoreConfig.multilegAdvancing`.

Android has its own list. v3 also turns on some features v2 didn't have or had off, such as predictive caching and the vanishing route line on iOS, and automatic alternatives switching on Android. Each platform reference has a **Behavior changes** table and a **New in v3 and on by default** table. For every row that applies to the app:

1. Stop and present it as a decision. Say what v2 did, what v3 does, and the options, including "no equivalent".
2. Default to the option **closest to v2 behavior** if the developer doesn't answer, and say so. If there is no way to keep v2 behavior, say that plainly. Don't write a workaround the developer didn't ask for.
3. Record the decision in the decision log.

For **New in v3 and on by default** rows, the default is to turn the feature off, so the migrated app behaves like v2. List each one in the report as available to turn on later. When the developer reports one of these after migrating ("the route line looks different"), go through the **whole** table, including the defaults QA can't see, such as predictive caching.

### 3. Keep the app's own telemetry working

Apps often send analytics from Navigation SDK callbacks: reroute events, off-route, route progress, arrival, the raw directions response. In step 1, list **every** v2 hook the app reads data from, including data that only feeds logging. Map each to its v3 source using the **App telemetry hooks** table in the platform reference, and say per hook whether it is **same** (the v2 API still works), **changed** (new API or payload, same data) or **reduced / gone** (less data, or no v3 equivalent). Do this in step 2 for an effort estimate, and confirm it in step 3. When v3 has no equivalent, or reports less (for example no reroute reason, or no raw response object), say so in the telemetry map. Don't drop the log call silently, and don't invent fields.

### 4. Keep the style, data products and route requests

Keep the app's map style, traffic data, and route request options exactly as they are. v3 changes some defaults. When a default changes something the app relied on, set the v2 value explicitly and log it as a decision. Moving to Standard, newer traffic data, or new routing features is a separate, opt-in recommendation for the report.

### 5. Drop-in UI

- **iOS:** v2 `NavigationViewController` and `NavigationView` (library `MapboxNavigation`) move to the same components in `MapboxNavigationUIKit` v3
- **Android:** v2 Drop-in UI (`NavigationView`) has no in-place port. Present the choice as a decision: the v3 UX Framework (in beta at the time of writing, and Drop-in customizations don't carry over), or the app's own UI built on the v3 UI components. Inventory every Drop-in customization so it can be checked against the option chosen.
- If the developer asks for their own UI instead, build it on the v3 core APIs and the route line and camera components, and list what the Drop-in UI did that the app now owns

Customization hooks that v3 removed (custom layers for waypoints in some UI delegates, CarPlay layer customization on iOS) are behavior changes. Log them as decisions.

### 6. Grounding

Only use v3 symbols that appear in the platform reference, the official migration guide, or the SDK source and docs for the version you're targeting. If you're unsure whether a symbol exists or has the stated signature, don't invent one. Write the closest match, add a `// [VERIFY WITH MAPBOX]` comment, and list it in the report. The build is the final check.

### 7. Target the latest v3 release

Use the latest stable 3.x unless the developer pins a version. The v3 API changed during the 3.x line. Check each Target entry's minimum version when the developer pins an older 3.x.

## Workflow

Run the five steps in order. Don't edit code before step 2 is done and shown to the developer.

### Step 1: Inventory

Run two inventories:

1. **Navigation:** use the inventory search list in this skill's platform reference
2. **Map layer:** use the inventory search list in `mapbox-maps-v10-to-v11-migration`'s platform reference. If that skill isn't installed, list Maps SDK symbols by area and mark the map layer `[VERIFY WITH MAPBOX]` in the plan.

Output the inventory and the **telemetry hook list** (templates in `references/migration-workflow.md`). Flag:

- **Areas with no direct mapping**: Drop-in UI customization, custom route handling (custom routing provider, custom reroute logic, reroute vetoes), location discarding, simulation speed control, custom speech synthesizers. The platform reference has the full list.
- **Callbacks that return a decision** (`Bool` or modified options). These are almost always behavior changes.
- **Observers used for the app's own telemetry**
- v2 code that already uses APIs deprecated in v2. These were removed in v3.

If the app can run on a simulator or emulator, offer to take **before screenshots** on v2 of the main navigation screens: route preview, active guidance with a maneuver banner, and arrival. Use route simulation so the after screenshots in step 4 can repeat the same route and position.

### Step 2: Plan

Group the work by area, in this order:

1. Dependencies, setup, access token and SDK configuration
2. Navigation instance and lifecycle
3. Route requests and route objects
4. Trip session (free drive, active guidance) and location
5. Route progress, instructions and other observers
6. Rerouting, faster routes, alternatives and route refresh
7. Arrival and multi-leg routes
8. Voice guidance
9. Navigation UI: Drop-in UI, route line, navigation camera, CarPlay or Android Auto
10. **Map layer**: Maps v10 → v11, planned with the Maps skill
11. Other: history, feedback, offline and predictive caching, simulation

For each area, give the call-site count, effort (S < 1h, M = half a day, L = 1-2 days, XL = more, or blocked), and blockers. List every behavior change and every telemetry hook that loses data as a decision. Use the plan template in `references/migration-workflow.md`.

The plan on its own answers "how much work is this?". If that was the question, stop here.

### Step 3: Migrate one area at a time

Bump Navigation v3 and Maps v11 together, since Navigation v3 pulls in Maps v11. The whole app stops compiling, and it won't compile again until **every** area, including the map layer, is migrated. Fixing one area doesn't make the build green, so don't wait for a passing build between areas. Instead:

1. Bump the dependencies. Build once (iOS: `xcodebuild` for the app scheme; Android: `./gradlew assembleDebug` or the app's variant) and save the full error list as the baseline.
2. For each area in plan order, apply the mappings from the platform reference using the **Target** column. For the map layer, apply the Maps skill's mappings. The area is done when none of the remaining errors are in its files or symbols. Rebuild to refresh the list. New errors can appear as earlier ones clear.
3. Update the telemetry map as you migrate each hook
4. Show the developer the diff summary for the area
5. After the last area, build until the app compiles, then run the checks in step 4

If the app already has navigation behind its own interface (see Staged rollout), migrating and building one module at a time is possible. Say so in the plan.

### Step 4: Verify

- [ ] The app builds for every target and variant that uses navigation
- [ ] The map renders with the **same style** as before
- [ ] If before screenshots were taken in step 1, take after screenshots of the same screens on the same simulated route and compare them. They won't match pixel for pixel. Look for unintended changes (route line, maneuver banner, puck, camera, map style) and list each one, with the decision it comes from or as a regression
- [ ] No v2-only symbols remain. Re-run both inventories.
- [ ] Every behavior change has a recorded decision and the matching code
- [ ] Every telemetry hook in the list is mapped, or marked "no v3 equivalent" with a decision
- [ ] Every `[VERIFY WITH MAPBOX]` tag is listed in the report
- [ ] Existing tests pass. Run them. Don't skip failures.

If you can run the app with route simulation, check:

- a route is requested and drawn;
- guidance starts and instructions are spoken and shown;
- a forced off-route triggers a reroute;
- arrival is reported;
- the app's telemetry events fire.

If you can't run the app, say so in the report. Don't claim it was checked.

### Step 5: Report

Write the migration summary from `references/migration-workflow.md`:

- What changed, per area, with file counts
- Behavior decisions taken
- Telemetry map: each hook, its v3 source, and any data lost
- `[VERIFY WITH MAPBOX]` items
- Pre-existing issues outside the migration's scope (patterns that work in v3 but are known to be costly or fragile). List them, don't fix them.
- Recommended next step: audit the app's Navigation and Maps SDK integration against v3 and v11 best practices

The summary should be short enough for a PM to read: areas, effort, blockers, decisions, telemetry gaps.

## Staged rollout

If the developer needs v2 and v3 side by side (A/B test, fast rollback), don't try to link both SDK generations into one binary. Put navigation and map code behind one app-level interface (for example `NavigationEngine` and `MapProvider` protocols or interfaces) with a v2 implementation and a v3 implementation. Then select the implementation per build flavor or target. Keep the app's telemetry events identical across both implementations, so the A/B comparison measures the SDK and not a logging change. Whether both generations can coexist in a single binary is unconfirmed; mark any such suggestion `[VERIFY WITH MAPBOX]`.

## Quick reference: what changes on both platforms

| Area           | iOS v2 → v3                                                                                                        | Android v2 → v3                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Maps SDK       | v10 → v11 (separate migration)                                                                                     | v10 → v11 (separate migration)                                                                           |
| Configuration  | `NavigationSettings` → `CoreConfig`, required at creation                                                          | `NavigationOptions` stays; token and location engine move out                                            |
| Entry point    | `NavigationService` / `Router` / `PassiveLocationManager` → one `MapboxNavigation` from `MapboxNavigationProvider` | `MapboxNavigationApp` / `MapboxNavigationProvider` stay                                                  |
| Events         | Delegates and `NotificationCenter` → Combine publishers on `navigation()` and `tripSession()`                      | Observers mostly stay; some alternatives observers removed                                               |
| Route objects  | `IndexedRouteResponse` / `RouteResponse` → `NavigationRoutes`                                                      | `NavigationRoute` only from `requestRoutes` / `requestMapMatching`; building routes from JSON is removed |
| Raw response   | `RouteResponse` → not exposed on `NavigationRoutes`                                                                | `NavigationRoute.directionsResponse` removed                                                             |
| Reroute veto   | `shouldRerouteFrom -> Bool` → none; reroute detection can only be turned off entirely                              | Custom reroute controller: see the Android reference                                                     |
| Leg advancing  | `didArriveAt -> Bool` → `CoreConfig.multilegAdvancing`                                                             | `ArrivalController` / `navigateNextRouteLeg`: see the Android reference                                  |
| Custom routing | Custom routing provider → not available                                                                            | Custom router → removed; built-in hybrid router                                                          |
| Drop-in UI     | `MapboxNavigation` UI → `MapboxNavigationUIKit`                                                                    | Drop-in `NavigationView` → UX Framework (beta) or the app's own UI                                       |
