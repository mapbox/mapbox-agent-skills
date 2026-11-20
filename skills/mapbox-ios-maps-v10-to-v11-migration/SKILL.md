---
name: mapbox-ios-maps-v10-to-v11-migration
description: Migrate an iOS app from Mapbox Maps SDK v10 to v11 with a coding agent. Inventories v10 usage, plans the work by area with effort and blockers, migrates one area at a time to the current recommended v11 APIs (Featureset Interactions, Feature State, typed events), surfaces behavior changes as developer decisions, keeps the app's style, and reports what changed. Covers UIKit and SwiftUI. Use when upgrading Maps SDK v10 on iOS, estimating a v10 to v11 migration, or fixing a build after bumping to v11.
---

# Mapbox Maps SDK v10 → v11 Migration (iOS)

Moves an iOS app from Maps SDK v10 to the latest Maps SDK v11 release. The agent does most of the work. The developer makes the decisions.

**Reference files:**

- `references/migration-workflow.md`: templates for the inventory, plan, decision log and migration summary
- `references/ios.md`: v10 → v11 mappings for iOS (Swift, UIKit, SwiftUI)

For an Android app, use `mapbox-android-maps-v10-to-v11-migration`. A project with both platforms gets two separate migrations, one per platform.

## When to use

- The app depends on Maps SDK v10 (`MapboxMaps` 10.x)
- The developer asks "how much work is it to move to v11?". Run steps 1 and 2 only and stop.
- The build broke after the dependency was bumped to 11.x

**Not covered:**

- Flutter and React Native. They have their own plugin migration guides.
- Navigation SDK v2 → v3. Navigation SDK v3 requires Maps v11, so do this migration first or alongside it (`mapbox-ios-navigation-v2-to-v3-migration`).
- Changing the map style, moving to Mapbox Standard, or turning on other data products
- Token changes beyond moving the token to where v11 reads it
- Fixing app bugs that have nothing to do with the migration
- Legal or pricing advice

## Rules

These rules apply to every step.

### 1. Migrate to the current recommended API, not a literal port

The official v11 migration guide was written when v11 first shipped and lists what changed between v10 and 11.0. Since then v11 has gained APIs that replace patterns the guide still shows. For example, the guide maps v10 tap handling to `onLayerTap` and `onMapTap`. Those are now deprecated or discouraged in favor of **Featureset Interactions**.

Use the migration guide to find **what breaks**. Use the "Target" column in `references/ios.md` to decide **what the code becomes**. When the two disagree, the reference wins.

Two limits:

- `queryRenderedFeatures` and `querySourceFeatures` are still correct for **non-interactive** queries ("what is inside this rectangle?"). Replace them only when they implement a tap or long-press handler.
- Entries marked **[Standard only]** apply only when the app already uses Mapbox Standard. This migration never changes the style.

### 2. No silent behavior change

Some v11 changes alter what the app does at runtime even though the code compiles. Examples: the default style, default puck bearing, 3D puck scale, overview padding. `references/ios.md` has a **Behavior changes** table. For every row that applies to the app:

1. Stop and present the change as a decision. Say what v10 did, what v11 does by default, and the options.
2. Default to **preserving v10 behavior** if the developer doesn't answer, and say so.
3. Record the decision in the decision log (`references/migration-workflow.md`).

### 3. Keep the style and data products

Keep the app's style URL or style JSON exactly as it is. Don't switch to Standard, add style imports, or change tilesets or traffic data. **v11 changed the default style to Standard.** If the app relied on the v10 default (it never set a style), set the style explicitly to the one v10 loaded. **v11 also points some built-in style constants (for example `.streets`) at newer style versions.** Keeping the constant can still change the map, so pin the literal style URI the v10 SDK resolved to. See `references/ios.md`.

Moving to Standard is a separate, opt-in recommendation. List it in the final report if relevant. Never do it as part of the migration.

### 4. Grounding

Only use v11 symbols that appear in `references/ios.md`, the official migration guide, or the SDK source and docs for the version you're targeting. If you're unsure whether a symbol exists or has the stated signature, don't invent one. Write the closest match, add a `// [VERIFY WITH MAPBOX]` comment at the call site, and list it in the report. The build is the final check. A symbol that doesn't compile is a grounding failure, not something to patch around with a guess.

### 5. Target the latest v11 release

Use the latest stable 11.x unless the developer pins a version. Several target APIs need a minimum v11 minor version (for example, Featureset Interactions are stable from 11.13, and `LocationManager.dataModel` needs 11.17). If the developer pins an older 11.x, check each Target entry's minimum version and fall back to the entry's "older 11.x" alternative.

## Workflow

Run the five steps in order. Don't edit code before step 2 is done and shown to the developer.

### Step 1: Inventory

Find every v10 symbol the app uses, by file, with call counts. Use the **inventory search list** in `references/ios.md`. It lists the symbols and patterns to search for, grouped by area.

Output the inventory table from `references/migration-workflow.md`. Also flag:

- Areas with **no direct mapping** (the reference lists them, for example a custom HTTP stack)
- Places that rely on a **v10 default** that changes in v11 (default style, puck bearing)
- v10 code that already uses **deprecated v10 APIs**. These were removed in v11 and need more than a rename.

If the app can run on a simulator, offer to take **before screenshots** of the main map screens now, on v10, for comparison in step 4. Note the device, camera position and app state for each, so the after screenshot can repeat it.

### Step 2: Plan

Group the work by area, in this order:

1. Dependencies, setup and access token
2. Map view and style loading
3. Events and observers
4. Camera and viewport
5. Annotations and view annotations
6. Style, sources and layers
7. Gestures and interactions
8. Location and puck
9. Offline
10. Other (HTTP stack, snapshotter, tracing)

For each area, give the call-site count, an effort estimate (S < 1h, M = half a day, L = 1-2 days, XL = more, or blocked), and blockers. List every behavior change that applies, as a decision the developer needs to make. Use the plan template in `references/migration-workflow.md`.

The plan on its own answers "how much work is this?". If that was the question, stop here.

### Step 3: Migrate one area at a time

Bumping the dependency breaks the whole build at once, and the app won't compile again until **every** area is migrated. Don't expect a green build after each area. Instead:

1. Bump the dependency (area 1). Build once with `xcodebuild` for the app scheme and save the full error list. This is the baseline.
2. For each area in plan order, apply the mappings from `references/ios.md`, using the **Target** column. Use the error list as the to-do list for that area: the area is done when none of the remaining errors are in its files or symbols. Rebuild to refresh the list. Expect new errors to appear as earlier ones clear, since the compiler stops at some errors.
3. Show the developer the diff summary for the area
4. After the last area, build until the app compiles. Fix what's left by area, not in the order the compiler reports it.

If the app already isolates map code behind its own interface (see Staged rollout), migrating and building one module at a time is possible. Say so in the plan.

### Step 4: Verify

- [ ] The app builds for every target that used the map
- [ ] The map renders with the **same style** as before (compare the style URL or JSON in code against v10)
- [ ] If before screenshots were taken in step 1, take after screenshots of the same screens and compare them. They won't match pixel for pixel. Look for unintended changes (style, puck, labels, annotations, layout) and list each one, with the decision it comes from or as a regression
- [ ] No v10-only symbols remain. Re-run the inventory search: removed symbols, plus anything the reference marks as deprecated in v11.
- [ ] Every behavior change in the decision log has a recorded decision and the matching code
- [ ] Every `[VERIFY WITH MAPBOX]` tag is listed in the report
- [ ] Existing unit and UI tests that touch the map still pass. Run them. Don't skip failures.

If you can run the app in a simulator, check the map renders, taps on interactive features still work, and the location puck shows. If you can't, say so in the report. Don't claim the app was checked.

### Step 5: Report

Write the migration summary from `references/migration-workflow.md`:

- What changed, per area, with file counts
- Behavior decisions taken
- `[VERIFY WITH MAPBOX]` items
- **Pre-existing issues outside the migration's scope.** Patterns that were already in the app and work in v11 but are known to be costly or fragile: style reloads to switch modes, whole-source rewrites to show a selection, camera moves on every location update, dropped observer tokens, map calls off the main thread, and similar. List them, don't fix them.
- Recommended next step: an audit of the app's Maps SDK integration against v11 best practices. If an audit or best-practices skill is installed (for example `mapbox-ios-patterns`), point the developer to it.

The summary should be short enough for a PM to read: areas, effort spent, blockers, decisions.

## Staged rollout

If the developer needs v10 and v11 builds side by side (A/B test, fast rollback), don't try to link both SDK versions into one binary. Put map code behind one app-level protocol (for example `MapProvider`) with a v10 implementation and a v11 implementation. Then select the implementation per target or build configuration. Whether both versions can coexist in a single binary is unconfirmed; mark any such suggestion `[VERIFY WITH MAPBOX]`.

## Quick reference: what breaks

| Area                | v10                                             | v11 target                                                            |
| ------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| Access token        | `ResourceOptions` / `ResourceOptionsManager`    | `MapboxOptions.accessToken`, or `MBXAccessToken` in `Info.plist`      |
| Default style       | Streets                                         | Standard. Pin the app's style explicitly.                             |
| Events              | `onEvery` / `onNext`                            | Typed events, keeping the subscription token                          |
| Tap handling        | Gesture recognizers + `queryRenderedFeatures`   | Featureset Interactions (`TapInteraction`)                            |
| Selection highlight | Rewriting the source with a `selected` property | Feature State + `feature-state` expression                            |
| Small data changes  | Replacing the whole GeoJSON source              | Partial GeoJSON updates (add, update, remove features by id)          |
| Style access        | `mapboxMap.style`                               | Style APIs directly on `mapboxMap`                                    |
| View annotations    | View-keyed options API                          | `ViewAnnotation` objects changed in place                             |
| Location            | Location manager owns the provider              | Provider configured directly, heading separated                       |
| Offline             | Legacy `OfflineRegionManager`                   | `TileStore` + `OfflineManager`. Legacy still works but is deprecated. |
