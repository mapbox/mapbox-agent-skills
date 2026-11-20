---
name: mapbox-android-navigation-v2-to-v3-migration
description: Migrate an Android app from Mapbox Navigation SDK v2 to v3 with a coding agent. Inventories v2 usage, plans the work by area with effort and blockers, migrates one area at a time, and surfaces every behavior change (reroute control, arrival, alternatives switching) as a developer decision. Maps each v2 hook the app uses for its own telemetry to its v3 source or says it is gone. Replaces the removed Drop-in UI by copying the public v2 Drop-in sources into the app, or with the UX Framework or the v3 UI components. Covers the build toolchain upgrade. Hands map-layer changes to mapbox-android-maps-v10-to-v11-migration. Use when upgrading Navigation SDK v2 on Android, estimating a v2 to v3 migration, or fixing a build after bumping to v3.
---

# Mapbox Navigation SDK v2 → v3 Migration (Android)

Moves an Android app from Navigation SDK v2 to the latest Navigation SDK v3 release. The agent does most of the work. The developer makes the decisions.

Navigation SDK v3 requires Maps SDK v11. Every app on Navigation v2 is also on Maps v10, so **this migration includes a Maps v10 → v11 migration**. Use the `mapbox-android-maps-v10-to-v11-migration` skill for the map layer (map view, style, annotations, camera APIs, gestures). This skill covers what the Navigation SDK owns: configuration, route requests, the trip session, observers and events, rerouting, arrival, voice, the navigation UI, route line and navigation camera.

**Reference files:**

- `references/migration-workflow.md`: templates for the inventory, plan, decision log, telemetry map and migration summary
- `references/android.md`: v2 → v3 mappings for Android (Kotlin, Java)
- `references/android-drop-in-port.md`: how to copy the public v2 Drop-in UI sources into the app and adapt it to v3

For an iOS app, use `mapbox-ios-navigation-v2-to-v3-migration`. A project with both platforms gets two separate migrations, one per platform.

## When to use

- The app depends on Navigation SDK v2 (`com.mapbox.navigation:*` 2.x)
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

Read the official [Migrate to Navigation SDK v3](https://docs.mapbox.com/android/navigation/guides/migration-from-v2/) guide first. It describes the new structure: `MapboxNavigation` is owned by `MapboxNavigationApp`, and artifacts move to `com.mapbox.navigationcore`.

`references/android.md` doesn't copy the guide. It adds what it leaves out: callbacks apps actually use that the guide doesn't map, behavior changes, telemetry, and mappings where the guide is out of date. When the guide and the reference disagree, the reference wins. If you can't fetch the guide, work from the reference alone and say so in the report.

The map layer follows the Maps skill's rule: move tap handling to Featureset Interactions and selection highlighting to Feature State, not a literal port.

### 2. No silent behavior change

Navigation v3 removed or changed several hooks that let the app **decide** something, such as plugging in a custom reroute controller or router, and changed runtime defaults, such as automatic alternatives switching. `references/android.md` has a **Behavior changes** table and a **New in v3 and on by default** table. For every row that applies to the app:

1. Present it as a decision. Say what v2 did, what v3 does, and the options, including "no equivalent". Collect all applicable rows into one decision list at the end of step 2 rather than stopping once per row.
2. Default to the option **closest to v2 behavior** if the developer doesn't answer, and say so. Exception: if the developer chose "show the v3 way" for a sample or demo app (step 1, **Migration goal**), default to the v3 behavior instead and still list the change.
3. Record the decision in the decision log.

For **New in v3 and on by default** rows, the default is to turn the feature off, so the migrated app behaves like v2. List each one in the report as available to turn on later. When the developer reports one of these after migrating ("the route line looks different"), go through the **whole** table.

**When v3 has no equivalent** (the feature can't be kept with public v3 API):

- Drop the feature and document it. Keep the code compiling with the nearest public API, or remove the feature's code path. Leave a short comment at the call site.
- **Highlight it to the developer explicitly as a change of the app's behavior**, not a routine migration step. List it under "Behavior removed" at the top of the summary.
- You may **suggest** a workaround (for example reimplementing the feature in app code). **Implement it only after the developer explicitly approves that workaround.** "Closest to v2" never means writing a replacement on your own.

**Migration or workaround?**

- **Migration (no approval needed):** expressing the same app behavior through a public v3 API that the reference or the SDK documentation names as the replacement. Example: `MapboxSpeedLimitView` replaced by `MapboxSpeedInfoView`.
- **Workaround (needs approval):** rebuilding in app code a feature the SDK no longer provides, or substituting different behavior. Example: taking over rerouting with `setRerouteEnabled(false)` and the app's own off-route handling.
- **A hook used only as a trigger** (it never changes the SDK's decision and only runs app logic) isn't a behavior change. Move the logic to the matching observer and record it in the decision log.

### 3. Keep the app's own telemetry working

Apps often send analytics from Navigation SDK callbacks: reroute events, off-route, route progress, arrival, the raw directions response. In step 1, list **every** v2 hook the app reads data from, including data that only feeds logging. Map each to its v3 source using the **App telemetry hooks** table in `references/android.md`, and say per hook whether it is **same** (the v2 API still works), **changed** (new API or payload, same data) or **reduced / gone** (less data, or no v3 equivalent). Do this in step 2 for an effort estimate, and confirm it in step 3. When v3 has no equivalent, or reports less (for example no raw response object), say so in the telemetry map. Don't drop the log call silently, and don't invent fields.

### 4. Keep the style, data products and route requests

Keep the app's map style, traffic data, and route request options exactly as they are. v3 changes some defaults. When a default changes something the app relied on, set the v2 value explicitly and log it as a decision. Moving to Standard, newer traffic data, or new routing features is a separate, opt-in recommendation for the report.

### 5. Drop-in UI

v2 Drop-in UI (`NavigationView`) isn't shipped in v3. Present the choice as a decision, with these options:

1. **Copy the v2 Drop-in UI sources into the app and adapt them to v3** (recommended). The sources are public in the v2 repository, under the Mapbox Terms of Service (not an open source license). The app keeps its screens, layouts and Drop-in customizations with few code changes, and can move to Compose later as a separate project. Follow `references/android-drop-in-port.md`.
2. **The v3 UX Framework.** A different product, in beta at the time of writing. Drop-in customizations don't carry over.
3. **The app's own UI** built on the v3 UI components (`ui-components`, `ui-maps`), in Views or Compose

Inventory every Drop-in customization so it can be checked against the option chosen. Option 1 needs the developer's explicit yes. In the question, link the v2 [`LICENSE.md`](https://github.com/mapbox/mapbox-navigation-android/blob/lts/v2/LICENSE.md) and state its terms: it requires an active Mapbox account, allows use and modification only with Mapbox products, and doesn't grant unrestricted rights to redistribute or sublicense the code, and modifications that change or interfere with marked portions related to billing, accounting or data collection are not authorized. If the developer doesn't answer, don't copy: migrate everything else and report Drop-in as an open decision.

If the developer asks for their own UI instead, build it on the v3 core APIs and the route line and camera components, and list what the Drop-in UI did that the app now owns.

### 6. Grounding

Only use v3 symbols that appear in `references/android.md`, the official migration guide, or the SDK source and docs for the version you're targeting. If you're unsure whether a symbol exists or has the stated signature, don't invent one. Write the closest match, add a `// [VERIFY WITH MAPBOX]` comment, and list it in the report. The build is the final check.

**SDK `internal` packages are not public API.** Classes under a `…internal…` package of a Mapbox module are public in Kotlin but not part of the supported API, and can change in any release.

- **Never add** a new import from a Mapbox `internal` package. The one exception is an approved Drop-in copy (rule 5, option 1): the developer accepts that dependency by saying yes, and the port lists it.
- **Internal API the app already used in v2** often still exists in v3. Report it as a pre-existing risk and replace it only where the v3 build breaks.

### 7. Target the latest v3 release

Use the latest stable 3.x unless the developer pins a version. The v3 API changed during the 3.x line. Check each Target entry's minimum version when the developer pins an older 3.x. Pair it with the Maps SDK v11 version from the release notes.

### 8. Running without the developer

If the developer asks you to proceed without stopping, or can't answer: write the plan and decision log as usual, take the rule-2 defaults, and continue. Don't implement any workaround that needs approval (rule 2), and don't copy the Drop-in sources (rule 5). Start the summary with a **Needs developer review** list: every decision taken by default, every behavior removed, every workaround suggested but not implemented.

## Workflow

Run the five steps in order. Don't edit code before step 2 is done and shown to the developer (or, per rule 8, written to the plan file when the developer asked you not to stop).

### Step 1: Inventory

Run two inventories:

1. **Navigation:** use the inventory search list in `references/android.md`
2. **Map layer:** use the inventory search list in `mapbox-android-maps-v10-to-v11-migration`'s reference. If that skill isn't installed, list Maps SDK symbols by area and mark the map layer `[VERIFY WITH MAPBOX]` in the plan.

Output the inventory and the **telemetry hook list** (templates in `references/migration-workflow.md`). Flag:

- **Migration goal**: if the project is a sample, demo, tutorial or SDK example app (many independent screens, each showing one SDK feature, often with docs links), ask once, up front, as the first decision: **keep v2 behavior** (the default for production apps) or **show the v3 way** (use v3 defaults and drop v2-only workarounds). Record the answer; it sets the default for every behavior-change decision.
- **Drop-in UI** usage and every customization of it (rule 5)
- **Areas with no direct mapping**: custom router, custom reroute controller, building routes from JSON, Feedback Agent. The reference has the full list.
- **Callbacks that return a decision** or replace an SDK component. These are almost always behavior changes.
- **Observers used for the app's own telemetry**
- v2 code that already uses APIs deprecated in v2. These were removed in v3.
- App code that imports SDK `internal` packages (for example `flowLocationMatcherResult` or `ifNonNull`). Report them as pre-existing risks (rule 6).
- **The build toolchain** (Android Gradle Plugin, Gradle, Kotlin, JDK, compile SDK). v3 can force an upgrade, which is part of area 1.
- Every module that depends on navigation, including dynamic feature modules and libraries

If the app can run on an emulator, offer to take **before screenshots** on v2 of the main navigation screens: route preview, active guidance with a maneuver banner, and arrival. Use route simulation so the after screenshots in step 4 can repeat the same route and position.

### Step 2: Plan

Group the work by area, in this order:

1. Dependencies, build toolchain, setup, access token and SDK configuration
2. Navigation instance and lifecycle
3. Route requests and route objects
4. Trip session (free drive, active guidance) and location
5. Route progress, instructions and other observers
6. Rerouting, faster routes, alternatives and route refresh
7. Arrival and multi-leg routes
8. Voice guidance
9. Navigation UI: Drop-in UI, route line, navigation camera, Android Auto
10. **Map layer**: Maps v10 → v11, planned with the Maps skill
11. Other: history, feedback, offline and predictive caching, simulation

For each area, give the call-site count, effort (S < 1h, M = half a day, L = 1-2 days, XL = more, or blocked), and blockers. List every behavior change and every telemetry hook that loses data as a decision. Use the plan template in `references/migration-workflow.md`.

The plan on its own answers "how much work is this?". If that was the question, stop here.

### Step 3: Migrate one area at a time

Bump Navigation v3 and Maps v11 together, since Navigation v3 pulls in Maps v11. The whole app stops compiling, and it won't compile again until **every** area, including the map layer, is migrated. Fixing one area doesn't make the build green, so don't wait for a passing build between areas. Instead:

1. Bump the dependencies, and the build toolchain if v3 requires it (see Build toolchain in `references/android.md`). Build once with `./gradlew assembleDebug` (or the app's variant) and save the full error list as the baseline. Toolchain errors come first; fix them before counting SDK errors.
2. For each area in plan order, apply the mappings from `references/android.md` using the **Target** column. For the map layer, apply the Maps skill's mappings. The area is done when none of the remaining errors are in its files or symbols. Rebuild to refresh the list. New errors can appear as earlier ones clear. In a single-module app the compiler often stops at the first batch of failing files, so the baseline isn't the total: read each file in the area and migrate it, and use the build to confirm.
3. Update the telemetry map as you migrate each hook
4. Show the developer the diff summary for the area
5. After the last area, build until the app compiles, then run the checks in step 4

If the app already has navigation behind its own interface (see Staged rollout), migrating and building one module at a time is possible. Say so in the plan.

### Step 4: Verify

- [ ] The app builds for every module and variant that uses navigation, **including release builds**. Code shrinking (R8) can fail only there.
- [ ] The map renders with the **same style** as before
- [ ] If before screenshots were taken in step 1, take after screenshots of the same screens on the same simulated route and compare them. They won't match pixel for pixel. Look for unintended changes (route line, maneuver banner, puck, camera, map style) and list each one, with the decision it comes from or as a regression
- [ ] No v2-only symbols remain. Re-run both inventories.
- [ ] No new imports from Mapbox `internal` packages outside an approved Drop-in copy (rule 6)
- [ ] Every behavior change has a recorded decision and the matching code
- [ ] Every telemetry hook in the list is mapped, or marked "no v3 equivalent" with a decision
- [ ] Every `[VERIFY WITH MAPBOX]` tag is listed in the report
- [ ] Existing tests pass. Run them. Don't skip failures.

If you can run the app with route simulation, check:

- the simulated location shows on the map, and moves along the route once guidance starts. A location that never appears, or a puck that stays at the origin, compiles fine but is a simulation setup bug (see Trip session and location in the reference);
- a route is requested and drawn;
- guidance starts and instructions are spoken and shown;
- a forced off-route triggers a reroute;
- arrival is reported, including an intermediate waypoint on a multi-leg route;
- the app's telemetry events fire;
- each navigation screen opens **twice in a row**, and two different navigation screens open one after another, without a crash.

A successful build doesn't cover these. If you can't run the app, say so in the report, list these checks as not done, and don't claim they were checked.

### Step 5: Report

Write the migration summary from `references/migration-workflow.md`:

- What changed, per area, with file counts
- Behavior decisions taken
- Telemetry map: each hook, its v3 source, and any data lost
- `[VERIFY WITH MAPBOX]` items
- Pre-existing issues outside the migration's scope (patterns that work in v3 but are known to be costly or fragile). List them, don't fix them.
- Recommended next step: audit the app's Navigation and Maps SDK integration against v3 and v11 best practices
- **Apps on the View system:** recommend moving to Jetpack Compose as a separate follow-up, since Compose is the standard Android UI toolkit. The map moves to the `MapboxMap` composable from the Mapbox Compose extension, and Google's [migrate XML views to Jetpack Compose](https://developer.android.com/agents/skills/jetpack-compose/migration/migrate-xml-views-to-jetpack-compose/skill) skill covers the rest of the screen. Navigation SDK v3 has no Compose UI components: its `ui-components` (maneuver, trip progress, speed info, buttons) are Views, hosted in `AndroidView` or rebuilt in Compose. Don't do it as part of this migration. If the app copied the v2 Drop-in UI (rule 5, option 1), the copied screens are the starting point for that follow-up. If the developer chose the app's own UI, building that UI in Compose is a reasonable choice.

The summary should be short enough for a PM to read: areas, effort, blockers, decisions, telemetry gaps.

## Staged rollout

If the developer needs v2 and v3 side by side (A/B test, fast rollback), don't try to link both SDK generations into one binary. Put navigation and map code behind app-level interfaces (for example `NavigationEngine` and `MapProvider`) with a v2 implementation and a v3 implementation. Then select the implementation per build flavor. Keep the app's telemetry events identical across both implementations, so the A/B comparison measures the SDK and not a logging change. Whether both generations can coexist in a single binary is unconfirmed; mark any such suggestion `[VERIFY WITH MAPBOX]`.

## Quick reference: what changes

| Area           | v2 → v3                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Maps SDK       | v10 → v11 (separate migration)                                                                           |
| Distribution   | Maven, as in v2; artifacts move to `com.mapbox.navigationcore`                                           |
| Configuration  | `NavigationOptions` stays; token and location engine move out                                            |
| Entry point    | `MapboxNavigationApp` / `MapboxNavigationProvider` stay                                                  |
| Events         | Observers mostly stay; some alternatives observers removed                                               |
| Route objects  | `NavigationRoute` only from `requestRoutes` / `requestMapMatching`; building routes from JSON is removed |
| Raw response   | `NavigationRoute.directionsResponse` removed                                                             |
| Reroute        | No custom reroute controller; turn rerouting off with `setRerouteEnabled(false)`                         |
| Leg advancing  | `ArrivalController` / `navigateNextRouteLeg`: see the reference                                          |
| Custom routing | Custom router → removed; built-in hybrid router                                                          |
| Drop-in UI     | Drop-in `NavigationView` → copy of the v2 Drop-in sources, UX Framework (beta) or the app's own UI       |
