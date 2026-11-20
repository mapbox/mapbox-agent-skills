# Navigation SDK for Android: integration audit reference

**Target:** Navigation SDK for Android (Kotlin)
**Minimum compatible version:** `3.18.0`
**Validated against:** `3.26.0`

Entries marked ★ are experimental: check they exist in the app's SDK version before flagging. Entries that need a newer version than the minimum say so inline. Skip them on older SDKs.

IDs (`NAV-…`) are stable. Cite them exactly in findings. Use the grounding rule, output schema and workflow from SKILL.md.

## Part A — SDK Functional Catalog

Each entry lists what the SDK provides and the key public API to search for. If the app has its own implementation of the same capability, that is a candidate finding (a possible reimplementation). A star (★) marks experimental or preview APIs; confirm they are available in the SDK version being audited.

### NAV-A1. Trip session & navigation state

| ID       | Functionality                                                                    | Key API to detect a reimplementation in the app                       |
| -------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| NAV-A1.1 | Navigation lifecycle, route/observer management, single entry point              | `MapboxNavigation`, `MapboxNavigationProvider`, `MapboxNavigationApp` |
| NAV-A1.2 | Navigation progress on every update (distance/time/step/leg) — see **NAV-NRO-1** | `RouteProgressObserver` → `RouteProgress`                             |
| NAV-A1.3 | Raw + map-matched location stream                                                | `LocationObserver` → `LocationMatcherResult`                          |
| NAV-A1.4 | Trip session state (started/stopped, FreeDrive/ActiveGuidance)                   | `TripSessionStateObserver`, `NavigationSessionStateObserver`          |
| NAV-A1.5 | Arrival detection & waypoint advance                                             | `ArrivalObserver`, `ArrivalController`                                |
| NAV-A1.6 | Off-route detection                                                              | `OffRouteObserver`                                                    |

### NAV-A2. Routing

| ID       | Functionality                                                    | Key API                                                           |
| -------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| NAV-A2.1 | Route requests to Directions API                                 | `MapboxNavigation.requestRoutes()`, `NavigationRouterCallback`    |
| NAV-A2.2 | Setting / clearing active routes                                 | `setNavigationRoutes()`, `RoutesObserver`                         |
| NAV-A2.3 | Route preview before active guidance                             | `setRoutesPreview()`, `RoutesPreviewObserver`                     |
| NAV-A2.4 | Automatic & manual rerouting                                     | `RerouteController`, `RerouteStateObserver`                       |
| NAV-A2.5 | Continuous alternative-route discovery & scoring                 | `RouteAlternativesObserver`                                       |
| NAV-A2.6 | Automatic route refresh (traffic/ETA/annotations) ★              | `RouteRefreshController`, `RouteRefreshStatesObserver`            |
| NAV-A2.7 | Map matching (snap GPS trace to roads) ★                         | `MapboxNavigation.requestMapMatching()`, `MapMatchingAPICallback` |
| NAV-A2.8 | Build `NavigationRoute` from external/custom `DirectionsRoute` ★ | `NavigationRouteObjectFactory`                                    |

### NAV-A3. Route & map visualization (ui-maps)

| ID       | Functionality                                                                | Key API                                                                                                                                                                                                                                                      |
| -------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NAV-A3.1 | Route line with traffic-congestion gradient, casing, restrictions, and trail | `MapboxRouteLineApi`, `MapboxRouteLineView`                                                                                                                                                                                                                  |
| NAV-A3.2 | Maneuver direction arrow on the map                                          | `MapboxRouteArrowApi`, `MapboxRouteArrowView`                                                                                                                                                                                                                |
| NAV-A3.3 | Route callouts (ETA/duration labels on alternatives) ★                       | Manual: `MapboxRouteLineApiOptions.isRouteCalloutsEnabled` + `DefaultRouteCalloutAdapter`. Presenter (3.24.0+): `routeLine { callouts { visible(true); adapter(...) } }` with `DefaultCalloutAdapterConfig` or `CustomCalloutAdapterConfig` (off by default) |
| NAV-A3.4 | Destination building highlight (2D/3D extrusion)                             | `MapboxBuildingsApi`, `MapboxBuildingView`                                                                                                                                                                                                                   |
| NAV-A3.5 | Junction ★ / signboard / rest-area guidance images                           | `MapboxJunctionApi`, `MapboxSignboardApi`, `MapboxRestAreaApi`                                                                                                                                                                                               |

### NAV-A4. Camera

| ID       | Functionality                                                       | Key API                              |
| -------- | ------------------------------------------------------------------- | ------------------------------------ |
| NAV-A4.1 | Following-puck & route-overview camera states, transitions, padding | `NavigationCamera`                   |
| NAV-A4.2 | Camera framing data (route geometry → viewport)                     | `MapboxNavigationViewportDataSource` |

### NAV-A5. Guidance UI data & prebuilt views

| ID       | Functionality                                                 | Key API                                                                    |
| -------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| NAV-A5.1 | Maneuver instruction breakdown (primary/secondary/sub, lanes) | `MapboxManeuverApi` (data) / `MapboxManeuverView` (view)                   |
| NAV-A5.2 | Trip progress (distance/time remaining, ETA)                  | `MapboxTripProgressApi` / `MapboxTripProgressView`                         |
| NAV-A5.3 | Posted speed limit + current speed                            | `MapboxSpeedInfoApi` / `MapboxSpeedInfoView`                               |
| NAV-A5.4 | Turn icons / lane icons drawables                             | `MapboxTurnIconsApi`, `MapboxLaneIconsApi`                                 |
| NAV-A5.5 | Road shields / route shields rendering ★                      | `MapboxRouteShieldApi`                                                     |
| NAV-A5.6 | Current road-name view                                        | `MapboxRoadNameView`                                                       |
| NAV-A5.7 | Camera-mode / recenter / sound buttons                        | `MapboxCameraModeButton`, `MapboxAudioGuidanceButton`, `MapboxSoundButton` |

### NAV-A6. Voice / audio

| ID       | Functionality                                      | Key API                                           |
| -------- | -------------------------------------------------- | ------------------------------------------------- |
| NAV-A6.1 | Voice instruction availability per step            | `VoiceInstructionsObserver` → `VoiceInstructions` |
| NAV-A6.2 | Speech file download/synthesis + caching ★         | `MapboxSpeechApi`                                 |
| NAV-A6.3 | Audio playback of instructions (TTS + prerecorded) | `MapboxVoiceInstructionsPlayer`                   |
| NAV-A6.4 | Managed audio-guidance on/off state                | `MapboxAudioGuidance`                             |

### NAV-A7. Notification

| ID       | Functionality                                | Key API                                                                                                        |
| -------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| NAV-A7.1 | Foreground-service turn-by-turn notification | Built-in; customize via `MapboxNavigation.setTripNotificationInterceptor(...)` / `TripNotificationInterceptor` |

### NAV-A8. Formatting

| ID       | Functionality                                    | Key API                                                  |
| -------- | ------------------------------------------------ | -------------------------------------------------------- |
| NAV-A8.1 | Localized distance formatting (units, spannable) | `MapboxDistanceFormatter`, `DistanceFormatter`           |
| NAV-A8.2 | Time-remaining / ETA formatting                  | `MapboxTimeFormatter`, `EstimatedTimeOfArrivalFormatter` |

### NAV-A9. EV (electric vehicle) — all ★ experimental

| ID       | Functionality                                       | Key API                             |
| -------- | --------------------------------------------------- | ----------------------------------- |
| NAV-A9.1 | EV charging-station search (location/route/quadkey) | `MapboxEvSearchClient`              |
| NAV-A9.2 | Battery range map (drivable-area polygon)           | `MapboxEvRangeMapPresenter`         |
| NAV-A9.3 | EV station map markers                              | `MapboxEvViewClient`                |
| NAV-A9.4 | Better-charging-route / busy-station notifications  | `EvBetterRouteNotificationProvider` |

### NAV-A10. Driver assistance / ADAS — all ★ experimental

| ID        | Functionality                                            | Key API                                          |
| --------- | -------------------------------------------------------- | ------------------------------------------------ |
| NAV-A10.1 | ADASIS v2 message generation for IVI/ADAS bus            | `AdasisManager`                                  |
| NAV-A10.2 | Upcoming road attributes (speed limits, cameras, slopes) | `AdasRoadItem`, `AdasSpeedLimitInfo`             |
| NAV-A10.3 | Electronic Horizon (predictive road graph ahead)         | `EHorizonObserver`                               |
| NAV-A10.4 | Speed/safety camera detection & display                  | `RoadCamerasManager`, `RoadCamerasMapController` |

### NAV-A11. Sensor / external data inputs

| ID        | Functionality                                                    | Key API             |
| --------- | ---------------------------------------------------------------- | ------------------- |
| NAV-A11.1 | Feed external odometry/GNSS/IMU/compass/altimeter to navigator ★ | `DataInputsManager` |

### NAV-A12. Weather

| ID        | Functionality                                          | Key API                            |
| --------- | ------------------------------------------------------ | ---------------------------------- |
| NAV-A12.1 | Weather along route (current/hourly/daily, warnings) ★ | `MapboxWeatherApi`, `WeatherQuery` |

### NAV-A13. Predictive caching / offline

| ID        | Functionality                                                | Key API                            |
| --------- | ------------------------------------------------------------ | ---------------------------------- |
| NAV-A13.1 | Predictive prefetch of map/guidance/search tiles along route | `PredictiveCacheController`        |
| NAV-A13.2 | Tile store & routing-tile management                         | `RoutingTilesOptions`, `TileStore` |

### NAV-A14. Replay, history & simulation

| ID        | Functionality                                         | Key API                                         |
| --------- | ----------------------------------------------------- | ----------------------------------------------- |
| NAV-A14.1 | Route/location simulation for development and testing | `MapboxReplayer`, `ReplayRouteSession` ★        |
| NAV-A14.2 | History recording to disk                             | `MapboxHistoryRecorder`                         |
| NAV-A14.3 | History playback / reader                             | `MapboxHistoryReader`, `ReplayHistorySession` ★ |
| NAV-A14.4 | Full-HD live session socket replay                    | `PlatformLiveNavigationSocketReplayer`          |

### NAV-A15. High-level UI coordination (Coordination API)

The Coordination API is a single layer that connects `MapboxNavigation` to the map presentation (route line, maneuver arrow, camera, location indicator, and route callouts), voice, and HD/navigation-quality state. It replaces the manual assembly of the individual `ui-maps` APIs. An app that connects `MapboxRouteLineApi`/`View`, `NavigationCamera`, `MapboxNavigationViewportDataSource`, the location indicator, and voice manually is reimplementing what a single `NavigationPresenter` provides. This is a high-value check, because it usually replaces a large amount of custom integration code.

| ID        | Functionality                                                                          | Key API                                                                       |
| --------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| NAV-A15.1 | Per-screen navigation UI presenter (owns map side-effects + voice + HD state)          | `NavigationPresenter` (created via `NavigationPresenter.create(...)`)         |
| NAV-A15.2 | Screen / navigation context construction                                               | `PresentersScreenContext.create()`, `PresentersNavigationContext.create(...)` |
| NAV-A15.3 | Declarative UI config (camera, route line, callouts, location indicator, warnings, HD) | `NavigationPresenterConfig` + config DSL builders                             |
| NAV-A15.4 | Map interaction events (route/puck click, etc.)                                        | `NavigationPresenterEvent`                                                    |
| NAV-A15.5 | Camera state within a presenter                                                        | `NavigationPresenterCamera`                                                   |
| NAV-A15.6 | Matching custom route objects onto the (HD) route                                      | `MatchableRouteObject`                                                        |

> How to identify this: if the Coordination API is used, direct use of the individual components in NAV-A3 and NAV-A4 should be minimal or absent. If the app both assembles the route line, camera, location indicator, and voice manually and also uses `NavigationPresenter`, report the duplication — this is antipattern **NAV-COORD-6**. If the app only assembles them manually and does not use `NavigationPresenter` at all, report it as a candidate for migration to the Coordination API. Correct use of the Coordination API (lifecycle and context) is covered in antipattern section **NAV-COORD**.
>
> ⚠️ **Two entry points to the same capability.** Several capabilities catalogued in NAV-A3 and NAV-A4 can be reached **either** through the individual `ui-maps` API **or** through the presenter's config DSL (NAV-A15.3). An app that has adopted the Coordination API will show no trace of the manual class names — searching for them returns nothing, and the correct conclusion is "they use the presenter", **not** "they do not use this capability" or "the SDK does not provide it".
>
> When the manual API is absent, check the presenter configuration for the matching config block before drawing any conclusion:
>
> | Capability                                               | Manual API to search for                                                          | Presenter config to search for                                                                                                                       |
> | -------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
> | Route line, congestion gradient, vanishing/traveled line | `MapboxRouteLineApi` / `MapboxRouteLineView`                                      | `routeLine { }`, `vanishingRouteLineStyle(...)`                                                                                                      |
> | Maneuver arrow                                           | `MapboxRouteArrowApi` / `MapboxRouteArrowView`                                    | `routeLine { arrowVisible(...) }`, `maneuverArrowHeadDrawableInt(...)`                                                                               |
> | Route callouts (alternative ETA labels) ★                | `MapboxRouteLineApiOptions.isRouteCalloutsEnabled` / `DefaultRouteCalloutAdapter` | `routeLine { callouts { visible(...); adapter(...) } }` (3.24.0+) — off by default; a custom view is plugged in through `CustomCalloutAdapterConfig` |
> | Camera (following / overview)                            | `NavigationCamera`, `MapboxNavigationViewportDataSource`                          | `camera { }`                                                                                                                                         |
> | Location puck / indicator                                | location-indicator plugin APIs                                                    | `locationIndicator { }`                                                                                                                              |
>
> Some config blocks are off by default, so a block that is simply absent means the capability is switched off — not that it is unavailable. Two things are worth reporting here: a capability **switched off in the presenter config and rebuilt by hand**, and a capability **never configured at all** while the application implements the same thing itself. Report both against the NAV-A3 or NAV-A4 catalog ID for that capability.

### NAV-A16. Dependency & version alignment (not a feature)

This is not a reimplementation to look for. It is a note on dependency management.

- The Navigation SDK publishes a **`search`** artifact (`com.mapbox.navigation:search`) that re-exports the Search SDK modules through the Navigation SDK. Its only purpose is **version alignment**: obtaining Search through this artifact guarantees a Navigation and Search version pairing that has been tested for compatibility. It contains no functional code of its own.
- How to identify this: if the app uses Mapbox Search alongside Navigation but depends on the **Search SDK artifacts directly** (with separately pinned versions) instead of the `search` artifact provided by Navigation, report it. A version mismatch between Navigation and Search is a compatibility risk. (There is no finding if the app does not use Search.)

### NAV-A17. SDK-wide coroutine-dispatcher configuration ★

| ID        | Functionality                                                      | Key API                                                        |
| --------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| NAV-A17.1 | Cap or replace the SDK's CPU/IO coroutine dispatchers at startup ★ | `SdkDispatchers.configure { }`, `SdkDispatchersConfig.Builder` |

`SdkDispatchers.configure { }` must be called once before any SDK entry point (typically in `Application.onCreate()`). Via `SdkDispatchersConfig.Builder` the app can either replace the built-in `Dispatchers.Default`/`Dispatchers.IO` with custom dispatchers (`setDefault(dispatcher)` / `setIO(dispatcher)`), or cap their parallelism (`setDefaultParallelism(n)` / `setIoParallelism(n)`), reducing contention with the host app's own thread pools. If `configure {}` is never called the SDK falls back to the Kotlin built-in defaults.

**Reimplementation signal:** custom `Executor` or `ThreadPoolExecutor` wrappers, or `Dispatchers.Default.limitedParallelism(n)` calls, whose stated purpose is to constrain the Navigation SDK's background concurrency; or `Application.onCreate()` code that installs a global coroutine-dispatcher override to contain the SDK's thread usage.

---

## Part B — Performance & Correctness Antipatterns

These are not reimplemented features. They are ways of using the SDK that are known to be costly or unsafe, and they usually produce the most valuable findings.

### NAV-NRO. Native Route Object (NRO) & route traversal

**Background.** `RouteProgress` is delivered on every `RouteProgressObserver` update (approximately 1 to 10 times per second) and already exposes most navigation values as pre-computed fields. Separately, when `NavigationOptions.Builder.nativeRouteObject(true)` is enabled, route data is held in native memory rather than as plain Java objects. As a result, the Java-side accessors (`legs()`, `steps()`, `annotation()`, and so on) perform real work on each call: they read and convert the data from the native representation every time, and the result is not cached between calls. Together, these make manual route traversal expensive, especially in the frequently-called progress callback. The collections these accessors return (`legs()`, `steps()`, `intersections()`, the `annotation()` arrays, and the rest) produce their elements on demand: every element read — each iteration step, each `get(i)` — converts that element again and allocates a new object for it, and numeric annotation values come back as boxed `Double`/`Int` objects, one per element per read. So under NRO the cost of a traversal is proportional to the number of elements actually read, not to the number of accessor calls (NAV-NRO-3, NAV-NRO-5). A few operations are also unsupported or have different semantics under NRO (NAV-NRO-6).

#### NAV-NRO-1. RouteProgress fields recomputed manually

`RouteProgress` already provides the following values. Do not recompute them by traversing the route:

`distanceRemaining`, `distanceTraveled`, `durationRemaining`, `fractionTraveled`, `remainingWaypoints`, `currentState`, `inTunnel`, `stale`, `currentRouteGeometryIndex`, `upcomingRoadObjects`, `bannerInstructions`, `voiceInstructions`, and `currentLegProgress` / `currentStepProgress` (each with their own `distanceRemaining`, `durationRemaining`, and `fractionTraveled`).

```kotlin
// Avoid — computing remaining distance from leg annotations on every update
val distanceRemaining = routeProgress.navigationRoute.directionsRoute.legs()
    .mapNotNull { it.annotation()?.distance() ?: emptyList() }
    .flatten().drop(currentIndex).fold(0.0) { a, b -> a + b }

// Prefer — the value is already provided by the SDK
val distanceRemaining = routeProgress.distanceRemaining
```

#### NAV-NRO-2. Route-derived values recomputed on every update when they only change with the route

Values derived from the route — total distance and duration, leg count, per-leg and per-step distances, and any computation that traverses the route (for example, building a list of upcoming maneuvers, summing annotations, or precomputing segment lookups) — change **only** when the route changes. Computing them on every `RouteProgressObserver` update is unnecessary work. Compute them once in `RoutesObserver`, store the result, and read the stored value in the progress callback.

This applies to substantial computation, not to single field reads. A single `directionsRoute.distance()`, `.duration()`, or `legs().size` inside a callback is usually acceptable (though see NAV-NRO-3 for the NRO case). Report cases where the callback performs meaningful work over route data whose result does not change until the route changes; that work belongs in `RoutesObserver` (computed once and stored), not in the callback that runs on every update. Route-level values are available directly: `navigationRoute.directionsRoute.distance()`, `.duration()`, `.durationTypical()`, `leg.distance()`, `leg.duration()`, and `navigationRoute.id`.

When the derived value is consumed in several independent places (several use cases or view models each receiving the route from a flow), a single `RoutesObserver` is not always the natural home for it. A per-route cache keyed by the `NavigationRoute` instance works as well: `NavigationRoute.equals()`/`hashCode()` are cheap (route id plus content hashes), so it is a suitable map key, and a `WeakHashMap<NavigationRoute, T>` keeps the cache from retaining routes after they leave the active set (NAV-MEMORY-5). Do not key such a cache by `DirectionsRoute`, `RouteLeg`, or `LegStep`. A refreshed route is a new `NavigationRoute` instance that is not equal to the pre-refresh one, so the cache is naturally invalidated on refresh — which is what you want for values derived from refreshable annotations (congestion, duration), and harmless for values derived from static data (geometry, steps, waypoints).

#### NAV-NRO-3. Repeated / uncached route traversal under NRO

With NRO enabled, every `legs()` / `steps()` / `annotation()` access re-reads and re-converts the data from the native representation.

**Hold on to the route element you reuse.** Reading the same element out of a collection more than once converts it more than once. Assign the element itself to a local, then read as many fields off it as you need:

```kotlin
// Avoid — leg 0 is converted twice, once for each get(0)
val d = route.directionsRoute.legs()?.get(0)?.distance()
val t = route.directionsRoute.legs()?.get(0)?.duration()

// Prefer — leg 0 converted once, both fields read from it
val leg0 = route.directionsRoute.legs()?.firstOrNull() ?: return
val d = leg0.distance()
val t = leg0.duration()
```

The most common real case is `leg.annotation()`, where several arrays are read off one leg through a separate `leg.annotation()?.x()` chain each:

```kotlin
// Avoid — a new annotation object for every field
val dist = leg.annotation()?.distance()
val free = leg.annotation()?.freeflowSpeed()
val curr = leg.annotation()?.currentSpeed()

// Prefer — one annotation object, all fields read from it
val ann = leg.annotation() ?: return
val dist = ann.distance(); val free = ann.freeflowSpeed(); val curr = ann.currentSpeed()
```

**Assigning a collection to a local variable is not the same fix, and on its own it does not help.** `legs()`, `steps()`, `intersections()`, `closures()`, and the `annotation()` arrays produce their elements on demand, so each element is converted every time it is read — whether the collection sits in a local variable or not. Hoisting the call avoids re-calling the accessor, which was never the expensive part. If the same collection is genuinely traversed more than once, copy it (`toList()`) so the conversion happens once, or make a single pass that extracts only the values needed:

```kotlin
// Avoid — a local val, but every traversal re-converts each step
val steps = leg.steps() ?: return
val total = steps.sumOf { it.duration() }
val names = steps.map { it.name() }        // each step converted a second time

// Prefer — copy once, then traverse freely
val steps = leg.steps()?.toList() ?: return
```

The same applies to any accessor that returns route elements, not only the ones above: `steps()`, `annotation()`, `intersections()`, `voiceInstructions()`, `bannerInstructions()`, incidents, and so on. Each one reads from the native representation on every access.

The most costly cases are iterating over `annotation().distance()`, `.duration()`, or `.speed()` (and `intersections()`) arrays. This is most expensive when done **on the main thread inside `RouteProgressObserver`**, because it blocks the frame from rendering. The same traversal performed on a background thread is far less of a concern; give priority to findings on the main thread.

#### NAV-NRO-4. Road objects extracted by walking the route instead of using `RouteProgress.upcomingRoadObjects`

`RouteLeg.incidents()`, `RouteLeg.closures()`, and similar route-level annotations hold every road object for the whole route, without regard to the driver's current position. Filtering these lists down to "what's ahead" on every location update — by leg/step index or geometry index — and computing the distance from the current location to each object duplicates work the SDK already does. `RouteProgress.upcomingRoadObjects` is recomputed for you on every update: it already contains only the objects ahead of the current position, ordered by distance, and each entry's `distanceToStart` is already calculated. `NavigationRoute.upcomingRoadObjects` has the same caveat — it is the unfiltered, whole-route list, so re-filtering it by position on every update is the same antipattern.

```kotlin
// Avoid — walking route annotations and filtering/measuring distance manually on every update
val closures = routeProgress.navigationRoute.directionsRoute.legs()
    ?.getOrNull(currentLegIndex)?.closures()
val upcomingClosures = closures?.filter { it.geometryIndexStart() >= currentGeometryIndex }

// Prefer — already filtered to what's ahead
val upcomingRoadObjects = routeProgress.upcomingRoadObjects
```

#### NAV-NRO-5. Whole-collection traversal under NRO

NAV-NRO-3 is about reading the same element more than once. This rule is about reading _every_ element when only a few are needed. On the Java route model this is cheap; under NRO each element read allocates a new object, so on a long route (thousands of annotation values, hundreds of steps with intersections) a whole-collection pass can become the dominant cost of the code path.

- **Materialising a whole collection to use part of it.** `annotation()?.distance()?.drop(index)`, `steps().subList(...)`, `.toList()` followed by a single read, `steps().take(n)`, `.first { }` / `.last { }` / `.indexOfFirst { }` over the whole list. Every element before and after the ones needed is converted. Index into the collection directly instead: `size` is cheap, and `list[i]` / `getOrNull(i)` converts only that element.
- **Per-element accessors inside loops.** `leg.annotation()`, `step.intersections()`, `step.maneuver()` called inside a loop over steps or over annotation indices repeats the parent conversion on every iteration — hold the element outside the loop (NAV-NRO-3).
- **Geometry.** `step.geometry()` returns the encoded polyline string and decoding it yourself (`LineString.fromPolyline`, `PolylineUtils.decode`) repeats work the SDK has already done. `DecodeUtils.completeGeometryToPoints()`, `stepsGeometryToPoints()`, and `stepGeometryToPoints(step)` return the already-decoded geometry, but as on-demand collections: call them once per route and copy the result (`toList()`) if the points are iterated more than once.
- **Position lookups against the route on every update.** Scanning `steps()` or `annotation().distance()` on each `RouteProgress` to find which leg, step, or annotation index corresponds to the current position (comparing against `distanceTraveled` or `currentRouteGeometryIndex`) is the per-update form of this antipattern. `RouteProgress` already provides `currentLegProgress.legIndex`, `currentLegProgress.geometryIndex`, `currentStepProgress.stepIndex`, and `currentRouteGeometryIndex`. For anything else, precompute the lookup table once per route (NAV-NRO-2) — prefix sums of per-step or per-leg distances, or the geometry index at which each step starts — and binary-search it in the callback.

```kotlin
// Avoid — drop() converts and copies every step from stepIndex to the end of the route to keep three
val upcoming = leg.steps()!!.drop(stepIndex).take(3)

// Prefer — only the three steps that are needed are converted; size is cheap
val steps = leg.steps() ?: return
val upcoming = (stepIndex until minOf(stepIndex + 3, steps.size)).map { steps[it] }
```

As with NAV-NRO-3, the priority is traversal on the main thread inside `RouteProgressObserver`; the same work once per route on a background thread is much lower priority.

#### NAV-NRO-6. Operations that are unsupported, or behave differently, under NRO

The route model classes keep their Java API under NRO, but a few operations are not supported or no longer mean what they mean on the Java model. Code that relies on them works with the default Java route model and fails, or silently does something else, once `nativeRouteObject(true)` is enabled.

- **`toBuilder()` is not supported.** On `DirectionsRoute`, `RouteLeg`, `LegStep`, `LegAnnotation`, `StepIntersection`, `DirectionsWaypoint`, and the other route model classes it throws under NRO. Any code that rebuilds a route or a component to modify it (stripping legs, replacing annotations, patching a waypoint) breaks. Converting route objects to JSON (`toJson()`) is not supported either. Keep derived data in your own types rather than in modified copies of SDK route objects, and do not persist or transfer routes as JSON.
- **Client-side traffic features are disabled.** Route refresh itself works under NRO (a refreshed route arrives as a new `NavigationRoute` instance) and must not be flagged. What is disabled is client-side traffic modification — `TrafficOverrideOptions` ★ — and the automatic cleanup of outdated traffic information when a refresh is not possible. Flag code that depends on either.
- **Comparing with a plain Java model object throws.** `equals()` between a route object (`DirectionsRoute`, `RouteLeg`, `LegStep`, or any other component) and a plain Java model object, for example one parsed with `DirectionsRoute.fromJson`, throws under NRO instead of returning `false`.
- **Unrecognized properties are rebuilt on every read.** `getUnrecognizedProperty(...)` and the related accessors on any route object build the full property map on each call under NRO. Reading them per update, or per element inside a loop (for example charging-station metadata off every `DirectionsWaypoint`), is expensive — read once per route and store the result.
- **Empty collections are `null`.** Under NRO a collection accessor returns `null` where the Java model may return an empty list. Code that distinguishes the two (`legs() != null` as "has legs", `annotation()?.distance()!!`) behaves differently; treat `null` and empty alike (`.orEmpty()`, `?: emptyList()`).

### NAV-THREAD. Threading

All observers (`RouteProgressObserver`, `LocationObserver`, `RoutesObserver`, `BannerInstructionsObserver`, `VoiceInstructionsObserver`, `OffRouteObserver`, `ArrivalObserver`, …) are dispatched on the **main thread** and carry `@UiThread`. `MapboxNavigation` itself is `@UiThread`.

#### NAV-THREAD-1. SDK API called off the main thread

`MapboxNavigation` is `@UiThread`: every call on it must run on the main thread. Report calls made from any other thread or dispatcher, such as `Dispatchers.IO` / `Dispatchers.Default`, a `Thread` or `Executor`, `WorkManager`, or an RxJava scheduler.

**Reading route data on a background thread is not a finding.** `RouteProgress`, `NavigationRoute`, and `DirectionsRoute` are safe to read from any thread, with or without `nativeRouteObject(true)`. Passing one of them to a background thread and reading its fields there — to keep expensive route traversal off the frame — is a supported pattern that the SDK itself uses. Do not report it. The finding is a call back into `MapboxNavigation` from that thread, not the route access.

#### NAV-THREAD-2. Observer callback incorrectly assumed to run on a background thread

A callback that immediately switches to a background thread and then calls back into `MapboxNavigation` is usually a sign the developer expected the callback to run off the main thread. It does not. Switching to a background thread only to _read_ route data is fine (see NAV-THREAD-1); the finding is the call back into `MapboxNavigation`.

### NAV-MEMORY. Memory & lifecycle

#### NAV-MEMORY-1. MapboxNavigation referenced after destruction, or held too long

After `onDestroy()` (or `MapboxNavigationProvider.destroy()`), the instance is no longer valid. Report storage in a `ViewModel`, `Application`, static field, or dependency-injection singleton that outlives the navigation session.

#### NAV-MEMORY-2. Components that hold a MapboxNavigation reference

Any object that receives a `MapboxNavigation` (through a constructor, factory method, setter, or capture in a lambda or field) keeps the underlying navigator alive and must not outlive the session. There are two cases to distinguish:

- **A constructor or factory method receives and stores `MapboxNavigation`.** Two rules apply here, and they are independent of each other:
  1. **Lifetime — always applies.** The component must not outlive the `MapboxNavigation` instance it was built from: `MapboxNavigation` must not be destroyed while the component is still in use. Report a component held in `Application`, singleton, static, or `ViewModel` scope when the `MapboxNavigation` it holds has a shorter life. This rule holds whether or not the component has a teardown method.

  2. **Teardown — only if the component has one.** Some of these components own resources and expose an explicit teardown method (`onDestroy()`, `destroy()`, `cancel()`, `shutdown()`); others are thin wrappers that own nothing and expose none. **Check the component's public API before reporting.** If it has a teardown method that is never called, that is a finding. If it has none, there is nothing to call — report only rule 1, and do not name a teardown method that does not exist. An SDK example with teardown: `PredictiveCacheController(mapboxNavigation, …)`, released with `onDestroy()`.

  Both rules apply equally to any app class that stores a `MapboxNavigation` passed into its constructor or factory.

- **The `MapboxNavigationObserver` pattern** (`onAttached(mapboxNavigation)` and `onDetached(mapboxNavigation)`). Many SDK components use this pattern instead, for example `MapboxAudioGuidance`, `MapboxTripStarter`, `VoiceInstructionsPrefetcher`, and `DriverNotificationManager`. They receive the reference in `onAttached` and release it in `onDetached`, so the risk is different: report them being attached to a lifecycle that outlives the screen, or never detached. See **NAV-MEMORY-4**.

In app code, report any object that stores a `MapboxNavigation` reference and can be reached from `Application`, a singleton (`object` or companion object), a static field, or a `ViewModel` that survives Activity recreation.

#### NAV-MEMORY-3. Observer registered without a matching unregister

`register*Observer` adds the observer to an internal list and never removes it automatically. Every registration needs a matching `unregister*Observer` during teardown. Observers registered as inline lambdas (with no stored reference) cannot be unregistered; report them. Registration inside a frequently-called method or callback accumulates without limit.

#### NAV-MEMORY-4. Matching lifecycle for every disposable component

The register-and-unregister principle in NAV-MEMORY-3 applies generally: **every SDK component that is created or started must be released or stopped in the matching lifecycle callback**, and the teardown must be complete (all such components released together, on the same teardown path). Components that expose `cancel()` have in-progress asynchronous work (fetches for images, routes, shields, or voice) that will otherwise deliver results to UI that has already been destroyed; cancel them during teardown. Matching pairs:

| Component                                    | Acquire / start                     | Release / stop / teardown                  |
| -------------------------------------------- | ----------------------------------- | ------------------------------------------ |
| `MapboxNavigation`                           | `MapboxNavigationProvider.create()` | `destroy()` / `onDestroy()` (NAV-MEMORY-1) |
| Trip session                                 | `startTripSession()`                | `stopTripSession()`                        |
| Any observer                                 | `register*Observer`                 | `unregister*Observer` (NAV-MEMORY-3)       |
| `PredictiveCacheController`                  | constructor                         | `onDestroy()` (NAV-MEMORY-2)               |
| `MapboxRouteLineApi` / `MapboxRouteLineView` | constructor                         | `cancel()`                                 |
| `MapboxManeuverApi`                          | constructor                         | `cancel()`                                 |
| `MapboxRouteShieldApi`                       | constructor                         | `cancel()`                                 |
| `MapboxBuildingsApi` / `MapboxBuildingView`  | constructor                         | `cancel()` / `clear(style)`                |
| `MapboxSpeechApi`                            | constructor                         | `cancel()`                                 |
| `MapboxVoiceInstructionsPlayer`              | constructor                         | `shutdown()` (`clear()` to flush queue)    |
| `MapboxHistoryRecorder`                      | `startRecording()`                  | `stopRecording()`                          |
| `MapboxReplayer`                             | `play()`                            | `stop()` / `finish()`                      |
| `MapboxNavigationObserver` implementations   | `onAttached`                        | `onDetached`                               |
| Coordination presenters                      | `NavigationPresenter.create()`      | `destroy()` (section **NAV-COORD-1**)      |

Report any create-or-start action without a matching release-or-stop, any teardown that releases some components but not all, and any component with a `cancel()` method that is never cancelled.

#### NAV-MEMORY-5. `NavigationRoute` instances retained after they leave the active route set

Each `NavigationRoute` keeps the full route data — geometry, annotations, and step data for every leg. That memory is reclaimed only when the last reference to the `NavigationRoute` is released and it is garbage-collected; there is no manual "free" call. When routes change (a new `setNavigationRoutes`, a reroute, or an alternatives update), the SDK drops its own reference to the previous route set, so any copy the application is still holding is the only thing keeping that route's memory alive.

Report application code that stores `NavigationRoute` instances beyond their active lifetime and does not clear them when the active routes change: routes cached in a list "for later" or for an undo/redo history, kept in a `ViewModel`, `Application`, singleton, or static field, or held by a UI adapter (for example an alternatives list) that is not cleared when `RoutesObserver` delivers a new set. Release the reference — for example clear the stored value or list in `onRoutesChanged` — so it is not retained past the current route set.

The memory cost of a retained `NavigationRoute` is the same whether or not `nativeRouteObject(true)` is enabled (see section **NAV-NRO**) — what differs is how the leak surfaces. With the default Java route model, retained routes accumulate on the comparatively small Java heap, so the leak tends to surface relatively quickly as an `OutOfMemoryError`. With NRO enabled, route data is held in native memory, which can accommodate many more retained routes before running out, so the same leak takes much longer to surface and, when it eventually does, may appear as a native allocation failure or the process being killed rather than a clean `OutOfMemoryError`. This is the ongoing-session counterpart to **NAV-ROUTE-1**, which concerns routes requested and stored _before_ a session starts.

### NAV-ROUTE. Route management correctness

#### NAV-ROUTE-1. Routes requested in advance for later use

Requesting routes and storing them for a trip that starts much later has three problems: their traffic and ETA annotations are fixed at request time (only the _active_ route is refreshed), they use memory (each route retains its full geometry, annotations, and step data), and `durationRemaining` is computed from out-of-date data when the route is finally set. Request routes close to the time navigation starts. Automatic annotation refresh applies only to the active route set (after `setNavigationRoutes`); it does not apply to routes held in advance or shown via `setRoutesPreview`.

#### NAV-ROUTE-2. `setNavigationRoutes` called from inside `RoutesObserver`

`setNavigationRoutes` is asynchronous, and `RoutesObserver` callbacks run while a route update is being applied. Calling `setNavigationRoutes` again from inside `onRoutesChanged` starts a new route update before the current one has finished, which leads to an unpredictable order of route-state updates and to bugs that are hard to reproduce (not a crash, but incorrect behavior). Schedule the follow-up outside the callback (`lifecycleScope.launch { … }`), or use `RouteAlternativesObserver` to switch alternatives.

#### NAV-ROUTE-3. Manual off-route, reroute, or alternative logic

Custom distance-to-route checks in `LocationObserver`, `requestRoutes()` called from `OffRouteObserver`, or polling `getNavigationRoutes()` on a timer all duplicate `OffRouteObserver`, `RerouteController`, and `RouteAlternativesObserver`. Periodically re-requesting routes to "find a better route" duplicates the SDK's automatic discovery of alternatives.

#### NAV-ROUTE-4. Route refresh unintentionally disabled

Route refresh updates traffic and ETA only if the request enables it: `RouteOptions.enableRefresh(true)` must be set, and the refreshable annotations (`congestion` or `congestion_numeric`, `duration`, `maxspeed`, and so on) must be requested. Requests built without `enableRefresh`, or with those annotations removed, produce routes whose ETA and traffic never update, even though a `RouteRefreshController` is running. Use the SDK helper `RouteOptions.Builder.applyDefaultNavigationOptions()`, which sets these correctly. Report `requestRoutes` or `RouteOptions` construction that omits `enableRefresh` or the refresh annotations.

#### NAV-ROUTE-5. Too many or duplicate route requests

Issuing a `requestRoutes` call on every intermediate update of a continuous interaction — for example on each position change while a waypoint is still being dragged — sends excessive requests to the Directions API and reprocesses routes that are immediately discarded, since only the final position matters. Request once the interaction settles (for example, when the drag gesture ends). This is about the intermediate events of a single gesture, not the change itself: a waypoint that ends up only a few meters away, but on the other side of the road, still legitimately warrants a new route. Report `requestRoutes` calls made on every event of a continuous gesture, or from other high-frequency callbacks, without waiting for the interaction to complete.

### NAV-PERF. Frequent-callback & rendering efficiency

#### NAV-PERF-1. Heavy synchronous work on the main thread on every update

Observers run on the main thread (section **NAV-THREAD**). Even with correct threading, performing expensive _synchronous_ work inside `RouteProgressObserver` or `LocationObserver` on every update — memory allocation, JSON or route parsing, disk or `SharedPreferences` access, `queryRenderedFeatures`, or bitmap decoding — causes visible stutter, because it blocks the frame from rendering. Move one-time work out of the callback, store results, delay work where possible, or move heavy computation to a background thread and return only the result. Report substantial work performed on every update without a condition to limit it.

#### NAV-PERF-2. Manual route-line "traveled and remaining" or vanishing updates

`MapboxRouteLineApi` provides `updateWithRouteProgress(...)`, `updateTraveledRouteLine(...)`, and a built-in vanishing route line. Under the Coordination API the same behaviour is configured with `routeLine { vanishingRouteLineStyle(...) }` (`VanishingRouteLineStyle.TRANSPARENT` or `TRAVELED_COLORS`) and the presenter drives it from route progress itself. Implementing the traveled-and-remaining coloring or vanishing-point tracking manually from `RouteProgress` geometry indices duplicates this, is easy to get wrong, and is costly on every update. Report custom route-line geometry or gradient calculations driven from `RouteProgress` where the built-in API applies.

### NAV-COORD. Coordination API lifecycle & context

Applies only when the Coordination API (catalog **NAV-A15**) is used. These are the correctness patterns a healthy integration follows; deviations are findings.

#### NAV-COORD-1. Symmetric lifecycle with full teardown

Every presenter that is created must be `destroy()`-ed, and teardown must be complete: detach the map, `destroy()` all presenters (navigation _and_ preview), clear any external references that hold the presenter, and cancel the coroutines/observers started for it. A presenter created but never destroyed, or a partial teardown that leaves an external object still referencing it, is a leak (related to **NAV-MEMORY**).

#### NAV-COORD-2. Destroy → recreate, never reuse

A `NavigationPresenter` cannot be reused after `destroy()`. On restart, recreate the screen context, presenters, and any sub-controllers rather than caching and re-attaching a destroyed instance. Flag code that reuses a presenter across a destroy/recreate cycle.

#### NAV-COORD-3. One `PresentersNavigationContext` per process

Create a single `PresentersNavigationContext` for the whole process and share it — do not create one per screen, per Activity, or per presenter. Multiple navigation contexts in one process is a finding. (The per-UI-surface object is `PresentersScreenContext`, created per screen — do not confuse the two.)

#### NAV-COORD-4. Combine configuration updates that are available together

When several parameters are known at the same point in the code, set them in a single `configure { }` block rather than making a separate `configure { }` call for each parameter — for example, applying `minZoom`, `maxZoom`, `padding`, `bearing`, and framing points to a camera mode in one block. Separate `configure { }` calls are justified only when the values genuinely become available at different times (each driven by its own event). Report multiple `configure { }` calls in the same code path that could be combined into one.

#### NAV-COORD-5. Skip camera and configuration updates that have no effect

Before making a camera update (`easeTo`, a camera-mode change, or a configuration change that animates), check whether the requested state actually differs from the current state, using a small tolerance for each property (for example, a small threshold for zoom and pitch, and a smaller one for bearing). Skip the update when it would have no effect. This avoids redundant animations that cause jitter and interfere with the user's gestures. Also report redundant camera-mode changes (setting a mode that is already active); the `if (!alreadyFollowing)` check in a follow-mode request is a good example of this guard. Report camera and configuration updates made unconditionally in response to input that is often unchanged.

#### NAV-COORD-6. Coordination API mixed with manual UI assembly

The Coordination API is the current high-level UI layer and the goal is to converge on it. Report a codebase that uses **both** it and manual assembly of the APIs it coordinates (route line, maneuver arrow, camera, location indicator, voice):

- **Same surface** — a `NavigationPresenter` and a manual pipeline both drive one surface. They compete for the same map/camera side-effects, causing duplicated work and hard-to-reproduce ordering bugs. Route the behavior through the presenter's `configure { }` / `NavigationPresenterEvent` instead. This is a correctness finding.
- **Different surfaces** — some screens use a presenter while others are assembled manually. Not a runtime bug, but inconsistent and higher-maintenance; recommend migrating the manual screens onto the Coordination API.

Manual use of an API for a purpose the presenter does not cover is not a finding. The individual UI APIs are not deprecated, so migration is a directional recommendation, not a defect on its own. (A codebase with no `NavigationPresenter` anywhere is the **NAV-A15** migration case, not NAV-COORD-6.)

---

## Part C — Audit Prompts

Run the prompts below one at a time, in order.

Apply the **grounding rule** in every prompt: only flag a finding when the API or antipattern appears in Parts A or B; tag uncertain items `[VERIFY WITH MAPBOX]` and never invent method or class names.

Record findings in the **output schema**: `Prompt ID | File:line | Pattern observed | SDK equivalent (catalog ID) | Confidence | FP risk | Suggested change`.

---

### Per-Prompt Reference

#### NAV-P1. SDK API & feature inventory

```
You are reviewing a Mapbox Navigation SDK for Android (Kotlin) integration.
Apply the grounding rule: only reference SDK APIs that appear in the catalog
(Part A) of the provided audit document. Tag uncertain items [VERIFY WITH MAPBOX].

1. List every com.mapbox.navigation.* and com.mapbox.* (nav-related) public
   symbol called in this codebase, grouped by catalog area (NAV-A1..NAV-A17).
   Table: symbol | distinct call-site count | sample file:line | one-line use | thread context.

2. List every Mapbox navigation module in build.gradle(.kts): coordinate |
   used? | purpose | removal candidate.

3. If Mapbox Search is used alongside Navigation (NAV-A16): is it consumed via the
   Nav-provided `com.mapbox.navigation:search` artifact, or via Search SDK artifacts
   pinned directly? Flag the latter (Nav↔Search version-drift risk).

4. SDK dispatcher configuration (NAV-A17.1 ★): is `SdkDispatchers.configure { }`
   called before the first SDK entry point? If not, and the codebase contains custom
   Executor/ThreadPoolExecutor wrappers, limitedParallelism calls, or global dispatcher
   overrides aimed at containing the SDK's thread usage, flag as candidate for
   `SdkDispatchers.configure { }`. Skip if the API is not present in the SDK version
   being audited.

Ignore tests, samples, dead code.
```

#### NAV-P2. Reimplemented-functionality review (catalog-driven)

```
Using the SDK Functional Catalog (Part A), find places where this codebase
implements its own version of something the SDK already provides.

For EACH catalog area below, search for custom implementations and report matches:
- NAV-A1 trip/progress/arrival/off-route: custom progress math, custom arrival
  detection, custom off-route detection
- NAV-A2 routing: custom route-request orchestration, custom reroute, custom
  alternative comparison, custom map-matching, manual geo: URI parsing
- NAV-A3 route visuals: custom route-line rendering / traffic gradient, custom
  maneuver arrow, custom alternative-ETA callouts, custom destination building
  highlight, custom junction/signboard rendering
- NAV-A4 camera: custom follow/overview camera driven from location updates
- NAV-A5 guidance UI: custom maneuver / trip-progress / speed-limit / lane / shield
  views fed manually from RouteProgress
- NAV-A6 voice: custom TTS/playback pipeline fed from voiceInstructions
- NAV-A8 formatting: custom distance/time/ETA formatting
- NAV-A9 EV / NAV-A10 ADAS / NAV-A12 weather / NAV-A11 data inputs / NAV-A13 caching / NAV-A14 replay:
  any custom client duplicating the listed API
- NAV-A15 Coordination API: manual assembly of route line + camera + location puck +
  voice (from NAV-A3/NAV-A4/NAV-A6) where a single NavigationPresenter would coordinate it;
  or duplicated wiring alongside an existing NavigationPresenter
- NAV-A17 SDK dispatcher config (★ — skip if not available in the version being audited):
  custom Executor/ThreadPoolExecutor wrappers, limitedParallelism calls, or global dispatcher
  overrides whose purpose is to contain the Navigation SDK's background concurrency;
  flag as candidate for SdkDispatchers.configure { }

IMPORTANT when the Coordination API is in use. The NAV-A3 and NAV-A4 capabilities have
TWO entry points: the manual ui-maps API, or the presenter's config DSL (see the
two-entry-points table under catalog NAV-A15). Absence of the manual class names does
NOT mean the capability is unused, and does NOT mean the SDK lacks it. For each of
these capabilities, check the presenter configuration for the matching config block —
routeLine { }, camera { }, locationIndicator { }, arrowVisible, vanishingRouteLineStyle,
callouts { } — before concluding anything. Some blocks are off by default, so an absent block means
the capability is switched off, not unavailable. Report where a capability is switched
off or never configured while the application implements the same thing itself.

Also: do not drop a capability from this prompt because it seemed to belong to a
section you judged unused. A custom route-line, arrow, camera, or location-puck
implementation found anywhere in the codebase is in scope here, including one you
noticed while answering a different prompt.

If the Coordination API is used, also check the lifecycle & context patterns
(antipattern section NAV-COORD):
- NAV-COORD-1: every NavigationPresenter (and RoutesPreviewPresenter) that is created
  is destroy()-ed, with complete teardown (map detached, all presenters destroyed,
  external references to the presenter cleared, related coroutines cancelled).
  Flag presenters created but never destroyed, or partial teardown.
- NAV-COORD-2: no code holds and reuses a presenter after destroy() — on restart it
  should be recreated. Flag caching/reuse of a destroyed presenter.
- NAV-COORD-3: exactly one PresentersNavigationContext per process (shared). Flag any
  code creating a PresentersNavigationContext per screen/Activity/presenter.
- NAV-COORD-4: parameters available together are set in a single configure { } block, not
  split across multiple configure { } calls in the same code path. Flag configure { }
  calls that could be combined (separate calls are fine only when values arrive separately).
- NAV-COORD-5: camera and configuration updates are guarded — skipped when the requested state
  matches the current state within a per-property tolerance, and mode changes are skipped
  when the mode is already active. Flag unconditional camera updates or redundant
  mode changes that would have no effect.

For each finding: catalog ID | file:line | what is custom | SDK equivalent |
confidence | false-positive risk (some custom behavior is intentional —
say why you think it's a duplicate).
```

#### NAV-P3. RouteProgress callback & static data (NAV-NRO-1, NAV-NRO-2, NAV-NRO-4)

```
Grounding: antipattern section NAV-NRO (NAV-NRO-1, NAV-NRO-2, NAV-NRO-4).

Find every RouteProgressObserver (onRouteProgressChanged) and, inside the
callback or methods it calls:
1. Any computation equivalent to a RouteProgress field (distanceRemaining,
   durationRemaining, fractionTraveled, remainingWaypoints, leg/step progress).
   Search for: .fold(, .sumOf(, .map { it.distance, .mapNotNull { it.annotation,
   .drop(, legs().forEach, steps().forEach
2. Substantial custom logic over route data whose result only changes when the
   route changes (building upcoming-maneuver lists, summing annotations, precomputed
   segment lookups) recomputed on every update instead of cached on route change.
   Do NOT flag a single field read like directionsRoute.distance()/duration()/
   legs().size in a callback — that is usually fine. Target work that could be run
   once (in RoutesObserver) and cached, but is instead repeated on every update.
3. Road objects (incidents, closures, or other route-level annotations) read from
   the route — via leg.incidents(), leg.closures(), or navigationRoute.upcomingRoadObjects
   — and then filtered or measured against the current position, instead of reading
   routeProgress.upcomingRoadObjects directly.

For each: file:line | what is computed | RouteProgress field or cache that replaces it |
frequency | fix (use field, or compute once in RoutesObserver and cache).
```

#### NAV-P4. Native Route Object traversal cost & semantics (NAV-NRO-3, NAV-NRO-5, NAV-NRO-6)

```
Grounding: antipattern section NAV-NRO (NAV-NRO-3, NAV-NRO-5, NAV-NRO-6).

First: is nativeRouteObject(true) set? Report file:line.

Then, with NRO enabled or unknown:

1. NAV-NRO-6 — unsupported operations and changed semantics:
   - toBuilder() or toJson() called on DirectionsRoute, RouteLeg, LegStep, LegAnnotation,
     StepIntersection, DirectionsWaypoint, or any other route component (throws /
     unsupported under NRO).
   - reliance on client-side traffic changes: TrafficOverrideOptions, or the automatic
     cleanup of outdated traffic when refresh is not possible. Route refresh itself IS
     supported under NRO — do NOT flag route refresh.
   - ==, equals(), or Set/Map membership between a route object (DirectionsRoute, RouteLeg,
     LegStep, or other component) and a plain Java model object, such as one parsed with
     DirectionsRoute.fromJson. Throws under NRO.
   - getUnrecognizedProperty() or other unrecognized-property reads on every update, or
     per element inside a loop (e.g. metadata off every DirectionsWaypoint). Fix: read once
     per route and store.
   - code that distinguishes a null collection from an empty one.

2. NAV-NRO-3 — repeated element conversion:
   - legs().get(i) called repeatedly with the same index, or leg.annotation() called once
     per field read. Fix: hold the ELEMENT in a local — val ann = leg.annotation() — then
     read every field from it.
   - the same collection traversed more than once (steps(), intersections(), closures(),
     the annotation() arrays). Fix: toList() to copy it once, or a single pass that
     extracts only the values needed.
   - leg.steps(), leg.annotation(), step.intersections() etc. accessed inside a loop whose
     iterations all need the same collection. Fix: hoist it above the loop.
   - annotation().distance()/.duration()/.speed() or intersections() iterated on every update

3. NAV-NRO-5 — whole-collection traversal. Search for
   .drop(, .take(, .subList(, .toList(), .indexOfFirst, .first {, .last { applied to
   legs(), steps(), intersections(),
   the annotation() arrays, or DecodeUtils results:
   - a whole collection materialised to use a slice or a single element. Fix: index
     directly (size is cheap; list[i] converts only that element).
   - step.geometry() decoded manually (LineString.fromPolyline, PolylineUtils.decode), or
     DecodeUtils.completeGeometryToPoints()/stepsGeometryToPoints()/stepGeometryToPoints()
     called on every update. Fix: DecodeUtils once per route; toList() if iterated repeatedly.
   - a linear scan over steps() or annotation() on every update to locate the current
     position. Fix: RouteProgress currentLegProgress.legIndex / geometryIndex,
     currentStepProgress.stepIndex, currentRouteGeometryIndex; otherwise a prefix-sum or
     start-index table built once per route and binary-searched in the callback.

Note: assigning a collection accessor to a local val does NOT on its own make the later
element reads cheaper — these collections produce their elements on demand, so each
element is converted (and a new object allocated) every time it is read. Do not recommend
that as the fix. Recommend holding the element, copying the collection once, indexing
directly, or a single pass.

For each: file:line | antipattern ID | pattern | runs on every update or once | thread (main vs
background) | fix.
Give high priority to traversal done on the main thread inside RouteProgressObserver
(it blocks the frame). The same traversal on a background thread is much lower priority;
note it, but do not rank it high. NAV-NRO-6 correctness findings (toBuilder/toJson,
equality, traffic) are high priority regardless of thread.
```

#### NAV-P5. Threading (NAV-THREAD-1, NAV-THREAD-2)

```
Grounding: antipattern section NAV-THREAD. MapboxNavigation and all observers are
@UiThread (main thread only).

Find any MapboxNavigation call made from a thread or dispatcher other than main:
Dispatchers.IO/Default, Thread/Executor/HandlerThread, WorkManager Worker, an RxJava
scheduler, or similar.

Also flag observer callbacks that switch to a background dispatcher and then
call back into MapboxNavigation without returning to main.

Do NOT report reading data from RouteProgress, NavigationRoute, or DirectionsRoute on
a background thread. Those objects are safe to read from any thread, with or without
nativeRouteObject(true), and passing one to a background thread to keep expensive
route traversal off the frame is a supported pattern that the SDK itself uses. Only a
call back into MapboxNavigation from that thread is a finding.

For each: file:line | API | thread/context it runs on | fix (switch back to the main thread).
```

#### NAV-P6. Memory & lifecycle (NAV-MEMORY-1–NAV-MEMORY-5)

```
Grounding: antipattern section NAV-MEMORY.

1. Every reference to MapboxNavigation / MapboxNavigationProvider: holder class
   and scope. Flag ViewModel, Application, static, or dependency-injection singleton scope.
2. Every class constructed with (or created from) MapboxNavigation, SDK or app-written.
   Two independent checks:
   a. LIFETIME — always applies. Does the component outlive the MapboxNavigation instance
      it holds? MapboxNavigation must not be destroyed while the component is still in
      use. Flag Application, singleton, static, or ViewModel scope where the
      MapboxNavigation it holds is shorter-lived.
   b. TEARDOWN — only if the component has one. Inspect its public API for
      onDestroy(), destroy(), cancel(), or shutdown(). If it has one and it is never
      called, flag it. If it has none, it owns nothing to release: report only (a), and
      do NOT report a missing teardown or name a method that does not exist.
3. Every register*Observer: is there a matching unregister*Observer in teardown?
   Flag a missing unregister, inline-lambda observers (no stored reference), and
   registration inside frequently-called code.
4. Matching lifecycle (NAV-MEMORY-4): for each disposable component in use — MapboxRouteLineApi/
   View, MapboxManeuverApi, MapboxRouteShieldApi, MapboxBuildingsApi/View, MapboxSpeechApi,
   MapboxVoiceInstructionsPlayer, MapboxHistoryRecorder, MapboxReplayer, MapboxNavigationObserver
   implementations, trip session — verify that the create-or-start action has a matching
   release, stop, or cancel on the teardown path. Flag a missing release, partial teardown
   (some components released, others not), and components with a cancel() method (API
   fetches) that are never cancelled.
5. NAV-MEMORY-5: NavigationRoute instances stored beyond their active lifetime and not cleared
   when the active routes change. Flag NavigationRoute (or List<NavigationRoute>) held in
   a field, ViewModel, Application, singleton, static, or UI adapter (e.g. an alternatives
   list) that is not reset when RoutesObserver delivers a new set — an undo/redo or history
   cache of past routes is the common case. The memory cost is the same with or without
   nativeRouteObject(true), but the leak is harder to detect under NRO. (Recommended change
   belongs in the fix column: clear the stored value/list in onRoutesChanged.)

For each: file:line | component | create site | release site (or MISSING) | risk | fix.
```

#### NAV-P7. Route management correctness (NAV-ROUTE-1–NAV-ROUTE-5)

```
Grounding: antipattern section NAV-ROUTE.

1. NAV-ROUTE-1: routes fetched via requestRoutes() and stored for later use without an
   immediate setNavigationRoutes()/setRoutesPreview() (held in field/VM/repo,
   fetched long before navigation). Report hold duration + staleness risk.
2. NAV-ROUTE-2: setNavigationRoutes() (or moveRoutesFromPreviewToNavigator()) called
   from inside a RoutesObserver.onRoutesChanged body.
3. NAV-ROUTE-3: custom off-route detection (manual distance-to-route in LocationObserver),
   requestRoutes() from OffRouteObserver, polling getNavigationRoutes() on a timer,
   periodic requestRoutes() to compare alternatives.
4. NAV-ROUTE-4: requestRoutes()/RouteOptions built without enableRefresh(true) or missing
   refresh annotations (congestion/duration), so refresh silently does nothing. Use
   applyDefaultNavigationOptions().
5. NAV-ROUTE-5: requestRoutes() called on every intermediate event of a continuous
   interaction (e.g. each update while a waypoint is being dragged) instead of once it
   settles, or from other high-frequency callbacks without waiting for completion. The
   change itself still warrants a route (even a few meters can move a waypoint to the other
   side of the road); only the intermediate gesture events are wasteful.

For each: file:line | pattern | why it's unsafe/stale | recommended SDK pattern.
```

#### NAV-P8. Frequent-callback & rendering efficiency (NAV-PERF-1, NAV-PERF-2)

```
Grounding: antipattern section NAV-PERF.

1. NAV-PERF-1: heavy synchronous work on the main thread inside RouteProgressObserver /
   LocationObserver on every update — memory allocation, JSON or route parsing, disk or
   SharedPreferences access, queryRenderedFeatures, bitmap decoding. Flag substantial
   work performed on every update without a condition to limit it; recommend moving it
   out of the callback, caching, delaying, or moving it to a background thread.
2. NAV-PERF-2: manual route-line traveled-and-remaining coloring or vanishing-point tracking
   computed from RouteProgress geometry indices, where MapboxRouteLineApi's
   updateWithRouteProgress() / updateTraveledRouteLine() / vanishing route line, or the
   presenter's routeLine { vanishingRouteLineStyle(...) }, applies.

For each: file:line | pattern | cost per update | fix.
```

#### NAV-P9. Coordination API lifecycle & context (NAV-COORD-1–NAV-COORD-6)

```
Grounding: antipattern section NAV-COORD. Applies only if the Coordination API (catalog NAV-A15)
is used — NavigationPresenter, RoutesPreviewPresenter, PresentersNavigationContext,
PresentersScreenContext.

1. NAV-COORD-1: every presenter created is destroy()-ed with complete teardown (map detached,
   all presenters destroyed, external refs cleared, related coroutines cancelled).
   Flag created-but-never-destroyed and partial teardown.
2. NAV-COORD-2: no presenter is cached and reused after destroy(); on restart it is recreated.
3. NAV-COORD-3: exactly one PresentersNavigationContext per process (shared). Flag one created
   per screen/Activity/presenter. (PresentersScreenContext is per-UI-surface — OK.)
4. NAV-COORD-4: parameters available together are set in a single configure { } block, not
   split across multiple configure { } calls in the same code path.
5. NAV-COORD-5: camera/config updates are guarded — skipped when the requested state matches
   the current state within tolerance, and mode changes skipped when already active.
6. NAV-COORD-6: report the Coordination API and manual assembly (MapboxRouteLineApi/View,
   MapboxRouteArrowApi/View, NavigationCamera/MapboxNavigationViewportDataSource,
   location-indicator, MapboxVoiceInstructionsPlayer) used together — same surface
   (competing pipelines: correctness bug; route through configure { } /
   NavigationPresenterEvent) or different screens (inconsistent; recommend migrating manual
   screens to the presenter). Manual use for a purpose the presenter doesn't cover, or no
   NavigationPresenter anywhere (that is NAV-A15), is not NAV-COORD-6.

For each: file:line | pattern | fix.
```

#### NAV-P10. Open-ended

```
NAV-P10a. As a senior Navigation SDK engineer, list the 5 most expensive
navigation-related code paths: file:line | frequency | why expensive | top fix.
Rank by impact. Use sections NAV-NRO and NAV-PERF for frequent-callback and traversal context.

NAV-P10b. Surface up to 10 things that look surprising, unusual, or inconsistent
(even if not clearly bugs): file:line | one-line description | one question for
the author. Watch for: observers never unregistered, route data accessed off the
main thread, assumptions about how often the progress callback fires, hardcoded
route or waypoint data, and missing null checks on optional RouteProgress fields.
```

#### NAV-P11. Wrap-up executive summary

```
Produce a one-page summary for the Mapbox reviewer:
- Integration scale: rough count of navigation-related files/classes, distinct
  navigation screens, and which catalog areas (NAV-A1–NAV-A15) are in use.
- Primary use case(s) in one paragraph.
- Top 5 findings across all prompts, ranked by impact (perf, memory, correctness).
- SDK capabilities the integration plausibly should adopt but does not
  (from the catalog) — e.g. Coordination API, route refresh, feature the app
  reimplemented.
- SDK version reviewed, and any ★ experimental APIs relied upon.
```

---

### Reporting

For each prompt, record: the prompt ID, the number of findings, the finding table, and any false positives (report these to Mapbox if you want to help improve the audit). Sections **NAV-NRO**, **NAV-MEMORY**, **NAV-ROUTE**, and **NAV-PERF** are the highest priority, because they affect performance, memory stability, and route-state correctness.
