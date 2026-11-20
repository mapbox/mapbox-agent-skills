# Migration Workflow Templates

Output templates for the five migration steps. Fill them in as you go and show each one to the developer at the end of its step.

## Step 1: Inventory table

One row per v10 symbol or pattern, grouped by area. Count call sites, not files.

```markdown
## Inventory — Maps SDK v10 usage

Platform: iOS | Android
Current SDK: 10.x.y (from Package.resolved / Podfile.lock / build.gradle)
UI layer: UIKit | SwiftUI | Views | Jetpack Compose | mixed
Style: <style URI or "v10 default (not set)">

| Area     | Symbol / pattern                       | Files | Call sites | Mapping      | Notes                                |
| -------- | -------------------------------------- | ----- | ---------- | ------------ | ------------------------------------ |
| Events   | `mapboxMap.onEvery(.cameraChanged)`    | 3     | 5          | direct       |                                      |
| Gestures | `queryRenderedFeatures` in tap handler | 2     | 2          | redesign     | → Featureset Interactions            |
| Setup    | Custom `HttpServiceInterface`          | 1     | 1          | **none**     | Blocker: HTTP stack override removed |
| Location | Relies on default puck bearing         | 1     | 1          | **behavior** | Default changed to off               |
```

`Mapping` values:

- `direct`: rename or signature change, mechanical
- `redesign`: the v11 target is a different API (interactions, feature state, typed events)
- `behavior`: compiles either way but runtime behavior changes. This goes into the decision log.
- `none`: no v11 equivalent. Blocker or developer decision.
- `removed-in-v10`: used an API deprecated in v10 and removed in v11

## Step 2: Plan

```markdown
## Migration plan — Maps SDK v10 → v11.<minor>

Target version: 11.x.y (latest stable unless pinned)

| #   | Area                       | Call sites | Effort | Blockers / decisions |
| --- | -------------------------- | ---------- | ------ | -------------------- |
| 1   | Dependencies, setup, token | 4          | S      |                      |
| 2   | Map view, style loading    | 2          | S      | D1: default style    |
| 3   | Events and observers       | 11         | M      |                      |
| …   |                            |            |        |                      |

Total effort: <sum, as a range>
Blockers: <list, or "none">

### Decisions needed before migrating

| ID  | Area     | v10 behavior              | v11 default                | Options                                    | Recommended   |
| --- | -------- | ------------------------- | -------------------------- | ------------------------------------------ | ------------- |
| D1  | Style    | Streets loaded by default | Standard loaded by default | Pin v10 style (keep look) / adopt Standard | Pin v10 style |
| D2  | Location | Puck rotates with heading | Puck bearing off           | Turn bearing on / accept no rotation       | Turn on       |
```

Effort scale: **S** under 1 hour, **M** half a day, **L** 1-2 days, **XL** more than 2 days. **Blocked** means it can't proceed without a decision or Mapbox input.

Estimate from call-site counts and mapping type. `direct` mappings are cheap even in bulk. `redesign` mappings cost more per call site. Each `none` is a blocker until resolved.

## Decision log

Keep this up to date during step 3. Every `behavior` row from the inventory must end up here.

```markdown
| ID  | Decision                    | Decided by                             | Code change                                                     |
| --- | --------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| D1  | Keep Streets v12 explicitly | developer                              | `MapInitOptions(styleURI: .streets)` in MapViewController.swift |
| D2  | Keep heading rotation       | default (no answer, v10 behavior kept) | `puckBearingEnabled = true`                                     |
```

When the developer doesn't answer, write "default (no answer, v10 behavior kept)" and keep v10 behavior.

## Step 5: Migration summary

Keep it to one screen. A PM should be able to read it without opening the code.

```markdown
## Maps SDK v10 → v11 migration summary

**Result:** Builds on <targets>. Map renders with the original style. <N> files changed.
**SDK:** 10.x.y → 11.x.y

### Areas

| Area                 | Files | Effort (est. → actual) | Notes                              |
| -------------------- | ----- | ---------------------- | ---------------------------------- |
| Events and observers | 6     | M → M                  | Moved to typed events              |
| Gestures             | 2     | M → L                  | Tap handling moved to interactions |

### Behavior decisions

- D1: Kept the Streets style explicitly (v11 defaults to Standard)
- D2: Kept puck heading rotation on

### Needs confirmation from Mapbox

- `MapController.swift:88`: `[VERIFY WITH MAPBOX]` <what and why>

### Not verified

- <e.g. "UI tests not run: no simulator available">

### Pre-existing issues (not changed by this migration)

| File:line             | Pattern                            | Why it matters                          |
| --------------------- | ---------------------------------- | --------------------------------------- |
| MapViewModel.swift:40 | Style reloaded to switch day/night | Drops and rebuilds all layers each time |

### Next steps

- Run a Maps SDK v11 best-practices audit on the migrated app
- <optional, opt-in> Evaluate Mapbox Standard as a separate project
- <Android, View-based maps> Move to Jetpack Compose as a separate project: `MapboxMap` composable for the map, Google's XML-to-Compose skill for the rest of the screen
```

## Pre-existing issues to look for during the migration

While migrating, note these if you see them. Report them in step 5 and don't fix them unless the developer asks.

- Style reloaded (new URI or JSON) to switch visual modes such as day and night
- Layer removed and added again to show or hide it, instead of changing `visibility`
- Whole GeoJSON source replaced to change one feature or show a selection
- Layer properties or global settings (terrain, lights, projection) written on every camera frame
- Camera moved by hand on every location update instead of the viewport's follow-puck state
- Annotation manager created again on every data update
- A unique image name per annotation for the same icon
- Many (50+) view annotations on screen at once
- Observer or subscription tokens dropped right away, so the callback never fires
- Map APIs called off the main thread
- Strong references to the screen in map callbacks (retain cycles or leaks)
- A map view inside a reused list cell, or kept alive after its screen closes
- Sources and layers added before the style has loaded
