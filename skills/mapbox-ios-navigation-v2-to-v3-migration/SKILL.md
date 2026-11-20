---
name: mapbox-ios-navigation-v2-to-v3-migration
description: Migrate an iOS app from Mapbox Navigation SDK v2 to v3 with a coding agent. Inventories v2 usage, plans the work by area with effort and blockers, migrates one area at a time, and surfaces every behavior change (reroute veto, arrival callbacks, leg advancing) as a developer decision. Maps each v2 hook the app uses for its own telemetry to its v3 source or says it is gone. Covers the move to Swift Package Manager, Swift concurrency, SPI-only features and MapboxNavigationUIKit. Hands map-layer changes to mapbox-ios-maps-v10-to-v11-migration. Use when upgrading Navigation SDK v2 on iOS, estimating a v2 to v3 migration, or fixing a build after bumping to v3.
---

# Mapbox Navigation SDK v2 → v3 Migration (iOS)

Moves an iOS app from Navigation SDK v2 to the latest Navigation SDK v3 release. The agent does most of the work. The developer makes the decisions.

Navigation SDK v3 requires Maps SDK v11. Every app on Navigation v2 is also on Maps v10, so **this migration includes a Maps v10 → v11 migration**. Use the `mapbox-ios-maps-v10-to-v11-migration` skill for the map layer (map view, style, annotations, camera APIs, gestures). This skill covers what the Navigation SDK owns: configuration, route requests, the trip session, observers and events, rerouting, arrival, voice, the navigation UI, route line and navigation camera.

**Reference files:**

- `references/migration-workflow.md`: templates for the inventory, plan, decision log, telemetry map and migration summary
- `references/ios.md`: v2 → v3 mappings for iOS (`MapboxCoreNavigation` → `MapboxNavigationCore`, `MapboxNavigation` → `MapboxNavigationUIKit`)

For an Android app, use `mapbox-android-navigation-v2-to-v3-migration`. A project with both platforms gets two separate migrations, one per platform.

## When to use

- The app depends on Navigation SDK v2 (`MapboxCoreNavigation` / `MapboxNavigation` 2.x)
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

Read the official v3 migration guides first: [Migrate core](https://docs.mapbox.com/ios/navigation/guides/migration/migrate-core/) and [Migrate UI](https://docs.mapbox.com/ios/navigation/guides/migration/migrate-ui/). Delegates and `NotificationCenter` notifications become Combine publishers on `MapboxNavigation`.

`references/ios.md` doesn't copy the guides. It adds what they leave out: callbacks apps actually use that the guides don't map, behavior changes, telemetry, and mappings where the guide is out of date. When the guide and the reference disagree, the reference wins. If you can't fetch the guide, work from the reference alone and say so in the report.

The map layer follows the Maps skill's rule: move tap handling to Featureset Interactions and selection highlighting to Feature State, not a literal port.

### 2. No silent behavior change

Navigation v3 removed or changed several callbacks that let the app **decide** something:

- `shouldRerouteFrom` returned `Bool` to veto a reroute. v3 has no per-reroute veto: the SDK reroutes, and `willRerouteFrom` only reports it.
- `willArriveAt(_:after:distance:)` is removed
- `didArriveAt` returned `Bool` to control advancing to the next leg. It now returns nothing. Leg advancing is set once in `CoreConfig.multilegAdvancing`.

v3 also turns on some features v2 didn't have or had off, such as predictive caching and the vanishing route line. `references/ios.md` has a **Behavior changes** table and a **New in v3 and on by default** table. For every row that applies to the app:

1. Present it as a decision. Say what v2 did, what v3 does, and the options, including "no equivalent". Collect all applicable rows into one decision list at the end of step 2 rather than stopping once per row.
2. Default to the option **closest to v2 behavior** if the developer doesn't answer, and say so. Exception: if the developer chose "show the v3 way" for a sample or demo app (step 1, **Migration goal**), default to the v3 behavior instead and still list the change.
3. Record the decision in the decision log.

For **New in v3 and on by default** rows, the default is to turn the feature off, so the migrated app behaves like v2. List each one in the report as available to turn on later. When the developer reports one of these after migrating ("the route line looks different"), go through the **whole** table, including the defaults QA can't see, such as predictive caching.

**When v3 has no equivalent** (the feature can't be kept with public v3 API):

- Drop the feature and document it. Keep the code compiling with the nearest public API, or remove the feature's code path. Leave a short comment at the call site.
- **Highlight it to the developer explicitly as a change of the app's behavior**, not a routine migration step. List it under "Behavior removed" at the top of the summary.
- You may **suggest** a workaround (for example reimplementing the feature in app code). **Implement it only after the developer explicitly approves that workaround.** "Closest to v2" never means writing a replacement on your own.

**Migration or workaround?**

- **Migration (no approval needed):** expressing the same app behavior through a public v3 API that the reference or the SDK documentation names as the replacement. Examples: a banner's delegate method moved to a `NavigationComponent` method, a fixed camera zoom through the documented camera options, the destination marker through the waypoint customization methods the SDK deprecation message points to.
- **Workaround (needs approval):** rebuilding in app code a feature the SDK no longer provides, or substituting different behavior. Examples: drawing building highlights with your own layer, or requesting a fresh route because the app's own route can't be loaded.
- **A decision callback used only as a trigger** (it always returns the permissive value, like `shouldRerouteFrom` returning `true`, and runs app logic) isn't a behavior change. Move the logic to the matching event publisher and record it in the decision log.

### 3. Keep the app's own telemetry working

Apps often send analytics from Navigation SDK callbacks: reroute events, off-route, route progress, arrival, the raw directions response. In step 1, list **every** v2 hook the app reads data from, including data that only feeds logging. Map each to its v3 source using the **App telemetry hooks** table in `references/ios.md`, and say per hook whether it is **same** (the v2 API still works), **changed** (new API or payload, same data) or **reduced / gone** (less data, or no v3 equivalent). Do this in step 2 for an effort estimate, and confirm it in step 3. When v3 has no equivalent, or reports less (for example no reroute reason, or no raw response object), say so in the telemetry map. Don't drop the log call silently, and don't invent fields.

### 4. Keep the style, data products and route requests

Keep the app's map style, traffic data, and route request options exactly as they are. v3 changes some defaults. When a default changes something the app relied on, set the v2 value explicitly and log it as a decision. Moving to Standard, newer traffic data, or new routing features is a separate, opt-in recommendation for the report.

### 5. Navigation UI

v2 `NavigationViewController` and `NavigationView` (library `MapboxNavigation`) move to the same components in `MapboxNavigationUIKit` v3.

Customization hooks that v3 removed (CarPlay route and waypoint layer customization, route shape delegate methods; the waypoint layer methods on `NavigationViewControllerDelegate` and `NavigationMapViewDelegate` remain) are behavior changes. Log them as decisions.

### 6. Grounding

Only use v3 symbols that appear in `references/ios.md`, the official migration guide, or the SDK source and docs for the version you're targeting. If you're unsure whether a symbol exists or has the stated signature, don't invent one. Write the closest match, add a `// [VERIFY WITH MAPBOX]` comment, and list it in the report. The build is the final check.

**SPI symbols are not public API.** A symbol in the SDK source marked `@_spi(...)` (for example `@_spi(MapboxInternal)`, `@_spi(ExperimentalMapboxAPI)`) doesn't count as available. Never add an `@_spi import`. If the only v3 way to do something is SPI, treat it as **no public equivalent**: log a blocker decision (rule 2), and list it in the report as an item to raise with Mapbox. The reference lists known SPI-only capabilities: check the app against it in step 1.

The same rule covers **private modules** (`MapboxCommon_Private`, `MapboxNavigationNative_Private`, any `*_Private` or `@_implementationOnly` import of a Mapbox module) and SPI in **every** Mapbox SDK the app uses, Maps included:

- **Never add** a new SPI import or a new private-module import, not even where the app already uses that module elsewhere.
- **Implementing** an SPI protocol requirement in the app, as an ordinary method with no SPI import, isn't importing SPI. If an SDK protocol can't be conformed to otherwise, do that and note it as an SDK issue. Don't drop the feature.
- **Private API the app already used in v2** is a decision for the developer, not something to drop or keep silently. The default (no answer, or rule 8) is closest to v2: keep it if it still exists and compiles against the new versions, and list it under "Needs developer review" as private-API risk. If it no longer exists, it's a behavior removed.

### 7. Target the latest v3 release

Use the latest stable 3.x unless the developer pins a version. The v3 API changed during the 3.x line. Check each Target entry's minimum version when the developer pins an older 3.x. Pair it with the Maps SDK v11 version from the release notes.

To find it, don't sort release tags as strings: the tag format changed during 3.x (`v3.27.3`, then `3.28.0`). Strip a leading `v`, drop pre-releases (`-rc`, `-beta`), and compare as versions. Simpler: add the package with "up to next major" from `3.0.0` and read the resolved version from `Package.resolved`.

### 8. Running without the developer

If the developer asks you to proceed without stopping, or can't answer: write the plan and decision log as usual, take the rule-2 defaults, and continue. Don't implement any workaround that needs approval (rule 2). Start the summary with a **Needs developer review** list: every decision taken by default, every behavior removed, every workaround suggested but not implemented.

## Workflow

Run the five steps in order. Don't edit code before step 2 is done and shown to the developer (or, per rule 8, written to the plan file when the developer asked you not to stop).

### Step 1: Inventory

Run two inventories:

1. **Navigation:** use the inventory search list in `references/ios.md`
2. **Map layer:** use the inventory search list in `mapbox-ios-maps-v10-to-v11-migration`'s reference. If that skill isn't installed, list Maps SDK symbols by area and mark the map layer `[VERIFY WITH MAPBOX]` in the plan.

Output the inventory and the **telemetry hook list** (templates in `references/migration-workflow.md`). Flag:

- **Migration goal**: if the project is a sample, demo, tutorial or SDK example app (many independent screens, each showing one SDK feature, often with docs links), ask once, up front, as the first decision: **keep v2 behavior** (the default for production apps) or **show the v3 way** (use v3 defaults such as the vanishing route line, Standard-based navigation styles and the default puck, and drop v2-only workarounds). Record the answer; it sets the default for every behavior-change decision.
- **Packaging**: v3 ships **only through Swift Package Manager**. A CocoaPods or Carthage project must switch, and that is a work item with its own effort estimate.
- **Other Mapbox SDKs** in the same package graph (Search, direct MapboxCommon pins, private Mapbox packages): navigation v3 pins MapboxCommon, so they may be forced to a new major in the same change. Each is a work item and a decision.
- **SPI and private-module use**, existing and needed: list the app's current `@_spi` and `*_Private` imports, and check the app's features against the reference's SPI-only list.
- **Swift concurrency exposure**: where the app creates or calls navigation objects off the main thread (startup tasks, background services, callbacks, tests). v3 is mostly `@MainActor`.
- **Areas with no direct mapping**: custom route handling (custom routing provider, reroute vetoes), location discarding, simulation speed control. The reference has the full list.
- **Callbacks that return a decision** (`Bool` or modified options). These are almost always behavior changes.
- **Observers used for the app's own telemetry**
- v2 code that already uses APIs deprecated in v2. These were removed in v3.

If the app can run on a simulator, offer to take **before screenshots** on v2 of the main navigation screens: route preview, active guidance with a maneuver banner, and arrival. Use route simulation so the after screenshots in step 4 can repeat the same route and position.

### Step 2: Plan

Group the work by area, in this order:

1. Dependencies and packaging, setup, access token and SDK configuration
2. Navigation instance and lifecycle
3. Route requests and route objects
4. Trip session (free drive, active guidance) and location
5. Route progress, instructions and other observers
6. Rerouting, faster routes, alternatives and route refresh
7. Arrival and multi-leg routes
8. Voice guidance
9. Navigation UI: `NavigationViewController`, route line, navigation camera, CarPlay
10. **Map layer**: Maps v10 → v11, planned with the Maps skill
11. Other: history, feedback, offline and predictive caching, simulation

For each area, give the call-site count, effort (S < 1h, M = half a day, L = 1-2 days, XL = more, or blocked), and blockers. List every behavior change and every telemetry hook that loses data as a decision. Use the plan template in `references/migration-workflow.md`.

The plan on its own answers "how much work is this?". If that was the question, stop here.

### Step 3: Migrate one area at a time

Bump Navigation v3 and Maps v11 together, since Navigation v3 pulls in Maps v11. The whole app stops compiling, and it won't compile again until **every** area, including the map layer, is migrated. Fixing one area doesn't make the build green, so don't wait for a passing build between areas. Instead:

1. Bump the dependencies (switching to SPM first if needed). Build once with `xcodebuild` for the app scheme and save the full error list as the baseline.
2. For each area in plan order, apply the mappings from `references/ios.md` using the **Target** column. For the map layer, apply the Maps skill's mappings. The area is done when none of the remaining errors are in its files or symbols. Rebuild to refresh the list. New errors can appear as earlier ones clear. In a single-module app the compiler often stops at the first batch of failing files, so the baseline isn't the total: read each file in the area and migrate it, and use the build to confirm.
3. Update the telemetry map as you migrate each hook
4. Show the developer the diff summary for the area
5. After the last area, build until the app compiles, then run the checks in step 4

If the app already has navigation behind its own interface (see Staged rollout), migrating and building one module at a time is possible. Say so in the plan.

### Step 4: Verify

- [ ] The app builds for every target that uses navigation, including Release
- [ ] The map renders with the **same style** as before
- [ ] If before screenshots were taken in step 1, take after screenshots of the same screens on the same simulated route and compare them. They won't match pixel for pixel. Look for unintended changes (route line, maneuver banner, puck, camera, map style) and list each one, with the decision it comes from or as a regression
- [ ] No v2-only symbols remain. Re-run both inventories.
- [ ] No new `@_spi` or `*_Private` imports of Mapbox modules in the app; every pre-existing one has a decision (rule 6)
- [ ] Every other Mapbox SDK in the package graph resolves against the navigation release's MapboxCommon, and its own API changes are done
- [ ] No leftover references to the old packaging (`Pods` build phases and xcconfigs, `*.framework` links, storyboard references with `org.cocoapods.*` bundle IDs; README and CI scripts)
- [ ] Every behavior change has a recorded decision and the matching code
- [ ] Every telemetry hook in the list is mapped, or marked "no v3 equivalent" with a decision
- [ ] Every `[VERIFY WITH MAPBOX]` tag is listed in the report
- [ ] Existing tests pass. Run them. Don't skip failures.

If you can run the app with route simulation, check:

- the simulated location shows on the map, and moves along the route once guidance starts;
- a route is requested and drawn;
- guidance starts and instructions are spoken and shown;
- a forced off-route triggers a reroute;
- arrival is reported, including an intermediate waypoint on a multi-leg route;
- the app's telemetry events fire;
- each navigation screen opens **twice in a row**, and two different navigation screens open one after another, without a crash (one live `MapboxNavigationProvider`);
- simulation starts at the route's origin, not partway along the route or at the destination;
- the first spoken instruction plays when a custom voice is configured (its callbacks run off the main thread);
- the app **launches**: `MainActor.assumeIsolated` reached from a startup task, or a `@MainActor` initializer called from a background queue, compiles but traps at launch.

A successful build doesn't cover these: in this skill's own evaluation, migrations built cleanly and still crashed or misbehaved on these checks. If you can't run the app, say so in the report, list these checks as not done, and don't claim they were checked.

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

If the developer needs v2 and v3 side by side (A/B test, fast rollback), don't try to link both SDK generations into one binary. Put navigation and map code behind app-level protocols (for example `NavigationEngine` and `MapProvider`) with a v2 implementation and a v3 implementation. Then select the implementation per target or build configuration. Keep the app's telemetry events identical across both implementations, so the A/B comparison measures the SDK and not a logging change. Whether both generations can coexist in a single binary is unconfirmed; mark any such suggestion `[VERIFY WITH MAPBOX]`.

## Quick reference: what changes

| Area           | v2 → v3                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Maps SDK       | v10 → v11 (separate migration)                                                                                     |
| Distribution   | **SPM only** (no CocoaPods, no Carthage); iOS 14+, Xcode 16+                                                       |
| Configuration  | `NavigationSettings` → `CoreConfig`, required at creation                                                          |
| Entry point    | `NavigationService` / `Router` / `PassiveLocationManager` → one `MapboxNavigation` from `MapboxNavigationProvider` |
| Events         | Delegates and `NotificationCenter` → Combine publishers on `navigation()` and `tripSession()`                      |
| Route objects  | `IndexedRouteResponse` / `RouteResponse` → `NavigationRoutes`                                                      |
| Raw response   | `RouteResponse` → not exposed on `NavigationRoutes`                                                                |
| Reroute veto   | `shouldRerouteFrom -> Bool` → none; reroute detection can only be turned off entirely                              |
| Leg advancing  | `didArriveAt -> Bool` → `CoreConfig.multilegAdvancing`                                                             |
| Custom routing | Custom routing provider → not available                                                                            |
| Navigation UI  | `MapboxNavigation` UI → `MapboxNavigationUIKit`                                                                    |
