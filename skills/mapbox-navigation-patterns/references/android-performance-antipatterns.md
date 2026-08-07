# Performance & Correctness Antipatterns

These are not reimplemented features. They are ways of using the SDK that are known to be costly or unsafe, and they usually produce the most valuable findings.

## NAV-NRO. Native Route Object (NRO) & route traversal

**Background.** `RouteProgress` is delivered on every `RouteProgressObserver` update (approximately 1 to 10 times per second) and already exposes most navigation values as pre-computed fields. Separately, when `NavigationOptions.Builder.nativeRouteObject(true)` is enabled, route data is held in native memory rather than as plain Java objects. As a result, the Java-side accessors (`legs()`, `steps()`, `annotation()`, and so on) perform real work on each call: they read and convert the data from the native representation every time, and the result is not cached between calls. Together, these make manual route traversal expensive, especially in the frequently-called progress callback.

### NAV-NRO-1. RouteProgress fields recomputed manually

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

### NAV-NRO-2. Route-derived values recomputed on every update when they only change with the route

Values derived from the route — total distance and duration, leg count, per-leg and per-step distances, and any computation that traverses the route (for example, building a list of upcoming maneuvers, summing annotations, or precomputing segment lookups) — change **only** when the route changes. Computing them on every `RouteProgressObserver` update is unnecessary work. Compute them once in `RoutesObserver`, store the result, and read the stored value in the progress callback.

This applies to substantial computation, not to single field reads. A single `directionsRoute.distance()`, `.duration()`, or `legs().size` inside a callback is usually acceptable (though see NAV-NRO-3 for the NRO case). Report cases where the callback performs meaningful work over route data whose result does not change until the route changes; that work belongs in `RoutesObserver` (computed once and stored), not in the callback that runs on every update. Route-level values are available directly: `navigationRoute.directionsRoute.distance()`, `.duration()`, `.durationTypical()`, `leg.distance()`, `leg.duration()`, and `navigationRoute.id`.

### NAV-NRO-3. Repeated / uncached route traversal under NRO

With NRO enabled, every `legs()` / `steps()` / `annotation()` access re-reads and re-converts the data from the native representation.

```kotlin
// Avoid — legs() is converted twice, and each legs()[0] re-converts leg 0
val n   = route.directionsRoute.legs()?.size
val all = route.directionsRoute.legs()?.flatMap { it.steps() ?: emptyList() }
val d   = route.directionsRoute.legs()?.get(0)?.distance()
val t   = route.directionsRoute.legs()?.get(0)?.duration()

// Prefer — read each value once into a local variable
val legs = route.directionsRoute.legs() ?: return
val leg0 = legs[0]
val n = legs.size; val all = legs.flatMap { it.steps() ?: emptyList() }
val d = leg0.distance(); val t = leg0.duration()
```

The same applies to any accessor that returns route elements, not only the ones above: `steps()`, `annotation()`, `intersections()`, `voiceInstructions()`, `bannerInstructions()`, incidents, and so on. Each one reads from the native representation on every access.

The most costly cases are iterating over `annotation().distance()`, `.duration()`, or `.speed()` (and `intersections()`) arrays. This is most expensive when done **on the main thread inside `RouteProgressObserver`**, because it blocks the frame from rendering. The same traversal performed on a background thread is far less of a concern; give priority to findings on the main thread.

### NAV-NRO-4. Road objects extracted by walking the route instead of using `RouteProgress.upcomingRoadObjects`

`RouteLeg.incidents()`, `RouteLeg.closures()`, and similar route-level annotations hold every road object for the whole route, without regard to the driver's current position. Filtering these lists down to "what's ahead" on every location update — by leg/step index or geometry index — and computing the distance from the current location to each object duplicates work the SDK already does.

Use `RouteProgress.upcomingRoadObjects` instead. It is recomputed for you on every update: already filtered to only the objects ahead of the current position, already ordered by distance, with each entry's `distanceToStart` already calculated.

`NavigationRoute.upcomingRoadObjects` is the same kind of field but at the whole-route level: it is the unfiltered list for the entire route, not just what's ahead. Re-filtering _that_ by position on every update is the same antipattern this section warns against — the fix is still to read the already-filtered, already-ordered list from `RouteProgress` instead of recomputing it yourself.

```kotlin
// Avoid — walking route annotations and filtering/measuring distance manually on every update
val closures = routeProgress.navigationRoute.directionsRoute.legs()
    ?.getOrNull(currentLegIndex)?.closures()
val upcomingClosures = closures?.filter { it.geometryIndexStart() >= currentGeometryIndex }

// Prefer — already filtered to what's ahead
val upcomingRoadObjects = routeProgress.upcomingRoadObjects
```

## NAV-THREAD. Threading

All observers (`RouteProgressObserver`, `LocationObserver`, `RoutesObserver`, `BannerInstructionsObserver`, `VoiceInstructionsObserver`, `OffRouteObserver`, `ArrivalObserver`, …) are dispatched on the **main thread** and carry `@UiThread`. `MapboxNavigation` itself is `@UiThread`.

### NAV-THREAD-1. SDK API called off the main thread

Any `MapboxNavigation` call (or access to `RouteProgress` / `NavigationRoute`) from `Dispatchers.IO` or `Dispatchers.Default`, a `Thread` or `Executor`, `WorkManager`, RxJava `Schedulers.io()`, and similar contexts must be switched back to the main thread.

### NAV-THREAD-2. Observer callback incorrectly assumed to run on a background thread

A callback that immediately switches to a background thread and then calls back into `MapboxNavigation`, or reads route state there, is usually a sign the developer expected the callback to run off the main thread. It does not.

## NAV-MEMORY. Memory & lifecycle

### NAV-MEMORY-1. MapboxNavigation referenced after destruction, or held too long

**After `onDestroy()` (or `MapboxNavigationProvider.destroy()`), the instance is no longer valid.** Referencing it afterward is a bug on its own, regardless of where the reference was stored.

Separately, flag any storage location that could outlive the navigation session in the first place: a `ViewModel` (it survives Activity recreation), `Application`, a static field, or a dependency-injection singleton.

### NAV-MEMORY-2. Components that hold a MapboxNavigation reference

Any object that receives a `MapboxNavigation` (through a constructor, factory method, setter, or capture in a lambda or field) keeps the underlying navigator alive and must not outlive the session. There are two cases to distinguish:

- **A constructor or factory method receives and stores `MapboxNavigation`.** Such a component must be explicitly destroyed and must not be scoped longer than the `MapboxNavigation` instance; holding it in `Application`, singleton, or `ViewModel` scope is a leak. SDK examples: `PredictiveCacheController(mapboxNavigation, …)` (constructor; destroy with `onDestroy()`); `AdasisManager.create(mapboxNavigation, …)` and `DataInputsManager.create(mapboxNavigation, …)` (factory methods, ★). The same rule applies to any customer class that stores a `MapboxNavigation` passed into its constructor or factory.

- **The `MapboxNavigationObserver` pattern** (`onAttached(mapboxNavigation)` and `onDetached(mapboxNavigation)`). Many SDK components use this pattern instead, for example `MapboxAudioGuidance`, `MapboxTripStarter`, `VoiceInstructionsPrefetcher`, and `DriverNotificationManager`. They receive the reference in `onAttached` and release it in `onDetached`, so the risk is different: report them being attached to a lifecycle that outlives the screen, or never detached. See **NAV-MEMORY-4**.

In customer code, report any object that stores a `MapboxNavigation` reference and can be reached from `Application`, a singleton (`object` or companion object), a static field, or a `ViewModel` that survives Activity recreation.

### NAV-MEMORY-3. Observer registered without a matching unregister

`register*Observer` adds the observer to an internal list and never removes it automatically. Every registration needs a matching `unregister*Observer` during teardown. Observers registered as inline lambdas (with no stored reference) cannot be unregistered; report them. Registration inside a frequently-called method or callback accumulates without limit.

### NAV-MEMORY-4. Matching lifecycle for every disposable component

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

### NAV-MEMORY-5. `NavigationRoute` instances retained after they leave the active route set

Each `NavigationRoute` keeps the full route data — geometry, annotations, and step data for every leg. That memory is reclaimed only when the last reference to the `NavigationRoute` is released and it is garbage-collected; there is no manual "free" call. When routes change (a new `setNavigationRoutes`, a reroute, or an alternatives update), the SDK drops its own reference to the previous route set, so any copy the application is still holding is the only thing keeping that route's memory alive.

Report application code that stores `NavigationRoute` instances beyond their active lifetime and does not clear them when the active routes change: routes cached in a list "for later" or for an undo/redo history, kept in a `ViewModel`, `Application`, singleton, or static field, or held by a UI adapter (for example an alternatives list) that is not cleared when `RoutesObserver` delivers a new set. Release the reference — for example clear the stored value or list in `onRoutesChanged` — so it is not retained past the current route set.

The memory cost of a retained `NavigationRoute` is the same whether or not `nativeRouteObject(true)` is enabled (see section **NAV-NRO**) — what differs is how the leak surfaces. With the default Java route model, retained routes accumulate on the comparatively small Java heap, so the leak tends to surface relatively quickly as an `OutOfMemoryError`. With NRO enabled, route data is held in native memory, which can accommodate many more retained routes before running out, so the same leak takes much longer to surface and, when it eventually does, may appear as a native allocation failure or the process being killed rather than a clean `OutOfMemoryError`. This is the ongoing-session counterpart to **NAV-ROUTE-1**, which concerns routes requested and stored _before_ a session starts.

## NAV-ROUTE. Route management correctness

### NAV-ROUTE-1. Routes requested in advance for later use

Requesting routes and storing them for a trip that starts much later has three problems: their traffic and ETA annotations are fixed at request time (only the _active_ route is refreshed), they use memory (each route retains its full geometry, annotations, and step data), and `durationRemaining` is computed from out-of-date data when the route is finally set. Request routes close to the time navigation starts. Automatic annotation refresh applies only to the active route set (after `setNavigationRoutes`); it does not apply to routes held in advance or shown via `setRoutesPreview`.

### NAV-ROUTE-2. `setNavigationRoutes` called from inside `RoutesObserver`

`setNavigationRoutes` is asynchronous, and `RoutesObserver` callbacks run while a route update is being applied. Calling `setNavigationRoutes` again from inside `onRoutesChanged` starts a new route update before the current one has finished, which leads to an unpredictable order of route-state updates and to bugs that are hard to reproduce (not a crash, but incorrect behavior). Schedule the follow-up outside the callback (`lifecycleScope.launch { … }`), or use `RouteAlternativesObserver` to switch alternatives.

### NAV-ROUTE-3. Manual off-route, reroute, or alternative logic

Custom distance-to-route checks in `LocationObserver`, `requestRoutes()` called from `OffRouteObserver`, or polling `getNavigationRoutes()` on a timer all duplicate `OffRouteObserver`, `RerouteController`, and `RouteAlternativesObserver`. Periodically re-requesting routes to "find a better route" duplicates the SDK's automatic discovery of alternatives.

### NAV-ROUTE-4. Route refresh unintentionally disabled

Route refresh updates traffic and ETA only if the request enables it: `RouteOptions.enableRefresh(true)` must be set, and the refreshable annotations (`congestion` or `congestion_numeric`, `duration`, `maxspeed`, and so on) must be requested. Requests built without `enableRefresh`, or with those annotations removed, produce routes whose ETA and traffic never update, even though a `RouteRefreshController` is running. Use the SDK helper `RouteOptions.Builder.applyDefaultNavigationOptions()`, which sets these correctly. Report `requestRoutes` or `RouteOptions` construction that omits `enableRefresh` or the refresh annotations.

### NAV-ROUTE-5. Too many or duplicate route requests

Issuing a `requestRoutes` call on every intermediate update of a continuous interaction — for example on each position change while a waypoint is still being dragged — sends excessive requests to the Directions API and reprocesses routes that are immediately discarded, since only the final position matters. Request once the interaction settles (for example, when the drag gesture ends). This is about the intermediate events of a single gesture, not the change itself: a waypoint that ends up only a few meters away, but on the other side of the road, still legitimately warrants a new route. Report `requestRoutes` calls made on every event of a continuous gesture, or from other high-frequency callbacks, without waiting for the interaction to complete.

## NAV-PERF. Frequent-callback & rendering efficiency

### NAV-PERF-1. Heavy synchronous work on the main thread on every update

Observers run on the main thread (section **NAV-THREAD**). Even with correct threading, performing expensive _synchronous_ work inside `RouteProgressObserver` or `LocationObserver` on every update — memory allocation, JSON or route parsing, disk or `SharedPreferences` access, `queryRenderedFeatures`, or bitmap decoding — causes visible stutter, because it blocks the frame from rendering. Move one-time work out of the callback, store results, delay work where possible, or move heavy computation to a background thread and return only the result. Report substantial work performed on every update without a condition to limit it.

### NAV-PERF-2. Manual route-line "traveled and remaining" or vanishing updates

`MapboxRouteLineApi` provides `updateWithRouteProgress(...)`, `updateTraveledRouteLine(...)`, and a built-in vanishing route line. Implementing the traveled-and-remaining coloring or vanishing-point tracking manually from `RouteProgress` geometry indices duplicates this, is easy to get wrong, and is costly on every update. Report custom route-line geometry or gradient calculations driven from `RouteProgress` where the built-in API applies.

## NAV-COORD. Coordination API lifecycle & context

Applies only when the Coordination API (catalog **NAV-A15**) is used. These are the correctness patterns a healthy integration follows; deviations are findings.

### NAV-COORD-1. Symmetric lifecycle with full teardown

Every presenter that is created must be `destroy()`-ed, and teardown must be complete: detach the map, `destroy()` all presenters (navigation _and_ preview), clear any external references that hold the presenter, and cancel the coroutines/observers started for it. A presenter created but never destroyed, or a partial teardown that leaves an external object still referencing it, is a leak (related to **NAV-MEMORY**).

### NAV-COORD-2. Destroy → recreate, never reuse

A `NavigationPresenter` cannot be reused after `destroy()`. On restart, recreate the screen context, presenters, and any sub-controllers rather than caching and re-attaching a destroyed instance. Flag code that reuses a presenter across a destroy/recreate cycle.

### NAV-COORD-3. One `PresentersNavigationContext` per process

Create a single `PresentersNavigationContext` for the whole process and share it — do not create one per screen, per Activity, or per presenter. Multiple navigation contexts in one process is a finding. (The per-UI-surface object is `PresentersScreenContext`, created per screen — do not confuse the two.)

### NAV-COORD-4. Combine configuration updates that are available together

When several parameters are known at the same point in the code, set them in a single `configure { }` block rather than making a separate `configure { }` call for each parameter — for example, applying `minZoom`, `maxZoom`, `padding`, `bearing`, and framing points to a camera mode in one block. Separate `configure { }` calls are justified only when the values genuinely become available at different times (each driven by its own event). Report multiple `configure { }` calls in the same code path that could be combined into one.

### NAV-COORD-5. Skip camera and configuration updates that have no effect

Before making a camera update (`easeTo`, a camera-mode change, or a configuration change that animates), check whether the requested state actually differs from the current state, using a small tolerance for each property (for example, a small threshold for zoom and pitch, and a smaller one for bearing). Skip the update when it would have no effect. This avoids redundant animations that cause jitter and interfere with the user's gestures. Also report redundant camera-mode changes (setting a mode that is already active); the `if (!alreadyFollowing)` check in a follow-mode request is a good example of this guard. Report camera and configuration updates made unconditionally in response to input that is often unchanged.

### NAV-COORD-6. Coordination API mixed with manual UI assembly

The Coordination API is the current high-level UI layer and the goal is to converge on it. Report a codebase that uses **both** it and manual assembly of the APIs it coordinates (route line, maneuver arrow, camera, location indicator, voice):

- **Same surface** — a `NavigationPresenter` and a manual pipeline both drive one surface. They compete for the same map/camera side-effects, causing duplicated work and hard-to-reproduce ordering bugs. Route the behavior through the presenter's `configure { }` / `NavigationPresenterEvent` instead. This is a correctness finding.
- **Different surfaces** — some screens use a presenter while others are assembled manually. Not a runtime bug, but inconsistent and higher-maintenance; recommend migrating the manual screens onto the Coordination API.

Manual use of an API for a purpose the presenter does not cover is not a finding. The individual UI APIs are not deprecated, so migration is a directional recommendation, not a defect on its own. (A codebase with no `NavigationPresenter` anywhere is the **NAV-A15** migration case, not NAV-COORD-6.)
