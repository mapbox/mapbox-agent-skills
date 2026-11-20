# Migration Workflow Templates

Output templates for the five migration steps. Fill them in as you go and show each one to the developer at the end of its step. The map-layer parts use the same templates as `mapbox-maps-v10-to-v11-migration`. Keep them in the same documents, under the "Map layer" area.

## Step 1: Inventory table

One row per v2 symbol or pattern, grouped by area. Count call sites, not files.

```markdown
## Inventory — Navigation SDK v2 + Maps SDK v10 usage

Platform: iOS | Android
Current SDKs: Navigation 2.x.y, Maps 10.x.y (from Package.resolved / Podfile.lock / build.gradle)
UI: Drop-in UI | NavigationViewController | custom UI on core APIs | mixed
Style: <style URI(s)>

| Area      | Symbol / pattern                                         | Files | Call sites | Mapping      | Notes                            |
| --------- | -------------------------------------------------------- | ----- | ---------- | ------------ | -------------------------------- |
| Setup     | `NavigationSettings.shared.initialize(...)`              | 1     | 1          | direct       | → `CoreConfig`                   |
| Events    | `NotificationCenter` `.routeControllerProgressDidChange` | 2     | 3          | redesign     | → `navigation().routeProgress`   |
| Rerouting | `shouldRerouteFrom` returning `false` when parked        | 1     | 1          | **behavior** | No per-reroute veto in v3        |
| Arrival   | `didArriveAt` returning `false` for pickup stops         | 1     | 1          | **behavior** | → `CoreConfig.multilegAdvancing` |
| Routing   | Custom `RoutingProvider`                                 | 1     | 1          | **none**     | Blocker: not available in v3     |
| Map layer | (from the Maps skill inventory)                          |       |            |              |                                  |
```

`Mapping` values:

- `direct`: rename or signature change, mechanical
- `redesign`: the v3 target is a different API (publishers, config, new route objects)
- `behavior`: runtime behavior changes, or a decision callback is gone. This goes into the decision log.
- `none`: no v3 equivalent. Blocker or developer decision.
- `removed-in-v2`: used an API deprecated in v2 and removed in v3

## Step 1: Telemetry hook list

Every place the app reads data from the Navigation SDK and sends it to its own analytics, logs or backend. Include hooks that only feed logging.

```markdown
## App telemetry hooks

| #   | v2 hook                              | Data the app logs                    | Event name in the app | Mapping (same / changed / reduced / gone) | v3 source (step 3)                          | Data lost                      |
| --- | ------------------------------------ | ------------------------------------ | --------------------- | ----------------------------------------- | ------------------------------------------- | ------------------------------ |
| 1   | `didRerouteAlong(_:at:proactive:)`   | new route distance, `proactive` flag | `nav_reroute`         | reduced                                   | `rerouting` `.Fetched` + `navigationRoutes` | <fill in, e.g. reroute reason> |
| 2   | `IndexedRouteResponse.routeResponse` | response identifier, route count     | `route_received`      | gone                                      |                                             |                                |
| 3   | off-route observer                   | timestamp, location                  | `nav_off_route`       | same                                      |                                             |                                |
```

Fill the last two columns in step 3. Every row ends with a v3 source or "no v3 equivalent". Never leave a row blank, and never drop the app's log call without a decision.

## Step 2: Plan

```markdown
## Migration plan — Navigation SDK v2 → v3.<minor> (with Maps v10 → v11.<minor>)

| #   | Area                                      | Call sites | Effort | Blockers / decisions               |
| --- | ----------------------------------------- | ---------- | ------ | ---------------------------------- |
| 1   | Dependencies, setup, token, configuration | 3          | S      |                                    |
| 2   | Navigation instance and lifecycle         | 4          | M      |                                    |
| 3   | Route requests and route objects          | 9          | M      | D3: raw response no longer exposed |
| 6   | Rerouting, faster routes, alternatives    | 5          | L      | D1: reroute veto                   |
| 7   | Arrival and multi-leg                     | 2          | M      | D2: leg advancing                  |
| 9   | Navigation UI                             | 12         | L      | D4: Drop-in UI target              |
| 10  | Map layer (Maps v10 → v11)                | 31         | L      | See the Maps plan                  |
| …   |                                           |            |        |                                    |

Total effort: <sum, as a range>
Blockers: <list, or "none">
Telemetry: <N> hooks; <M> map directly; <K> lose data (see decisions)

### Decisions needed before migrating

| ID  | Area      | v2 behavior                                      | v3 behavior                           | Options                                                                          | Recommended                 |
| --- | --------- | ------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------- | --------------------------- |
| D1  | Rerouting | App vetoed reroutes while parked                 | SDK always reroutes when off route    | Accept SDK reroutes / turn off reroute detection and handle off-route in the app | Accept SDK reroutes, log it |
| D2  | Arrival   | App held the next leg until the driver confirmed | Legs advance automatically by default | `multilegAdvancing = .manually { … }` / accept automatic                         | `.manually` (keeps v2)      |
```

Effort scale: **S** under 1 hour, **M** half a day, **L** 1-2 days, **XL** more than 2 days. **Blocked** means it can't proceed without a decision or Mapbox input. `redesign` and `behavior` rows cost far more per call site than `direct` rows. Each `none` is a blocker until resolved.

## Decision log

```markdown
| ID  | Decision                                                | Decided by                            | Code change                                      |
| --- | ------------------------------------------------------- | ------------------------------------- | ------------------------------------------------ |
| D1  | Accept SDK reroutes; log `nav_reroute` from `rerouting` | developer                             | NavigationCoordinator.swift                      |
| D2  | Hold the next leg until confirmation                    | default (no answer, v2 behavior kept) | `CoreConfig(multilegAdvancing: .manually { … })` |
```

When the developer doesn't answer, write "default (no answer, v2 behavior kept)". When v2 behavior can't be kept, write "no v3 equivalent: behavior removed", list it under **Behavior removed** in the summary, and put any workaround in the "Suggested workaround" column. Write "developer approved" in **Decided by** before implementing a workaround.

## Step 5: Migration summary

```markdown
## Navigation SDK v2 → v3 migration summary

**Result:** Builds on <targets>. Guidance runs in simulation: route drawn, instructions spoken, reroute and arrival observed. <N> files changed.
**SDKs:** Navigation 2.x.y → 3.x.y, Maps 10.x.y → 11.x.y
**Packaging:** <e.g. CocoaPods → Swift Package Manager>

### Behavior removed (needs your attention)

Features the app had in v2 that v3 can't provide with public API. The code now compiles without them.

| ID  | Feature | Where | What the user will notice | Suggested workaround (not implemented) |
| --- | ------- | ----- | ------------------------- | -------------------------------------- |

### Needs developer review

Only when the migration ran without the developer (SKILL.md rule 8): each decision taken by default, with its ID.

### Areas

| Area                       | Files | Effort (est. → actual) | Notes                             |
| -------------------------- | ----- | ---------------------- | --------------------------------- |
| Rerouting and alternatives | 3     | L → L                  | Delegates → `rerouting` publisher |
| Map layer                  | 9     | L → M                  | See Maps notes                    |

### Behavior decisions

- D1: …
- D2: …

### Telemetry

| App event     | v2 source         | v3 source              | Change                             |
| ------------- | ----------------- | ---------------------- | ---------------------------------- |
| `nav_reroute` | `didRerouteAlong` | `rerouting` `.Fetched` | Reroute reason no longer available |

### Blockers and no-equivalent items

- …

### Needs confirmation from Mapbox

- `File.swift:88`: `[VERIFY WITH MAPBOX]` <what and why>

### Not verified

- <e.g. "Drop-in UI not run on a device">

### Pre-existing issues (not changed by this migration)

| File:line | Pattern | Why it matters |
| --------- | ------- | -------------- |

### Next steps

- Audit the migrated app's Navigation and Maps integration against v3 and v11 best practices
- <Android, View-based UI> Move to Jetpack Compose as a separate project
```
