# Navigation SDK for iOS: integration audit reference

**Target:** Navigation SDK for iOS v3 (`MapboxNavigationCore`, `MapboxNavigationUIKit`)
**Minimum compatible version:** `3.16.0` — all catalog entries exist from this release, unless a row says otherwise
**Validated against:** `3.35.1`

Entries marked ★ are experimental: check they exist in the app's SDK version before flagging. Entries that need a newer version than the minimum say so inline. Skip them on older SDKs.

IDs (`NAVIOS-…`) are stable. Cite them exactly in findings. Use the grounding rule, output schema and workflow from SKILL.md.

**SPI is not public API.** A symbol marked `@_spi(...)` in the SDK source (for example `@_spi(MapboxInternal)`, `@_spi(ExperimentalMapboxAPI)`) is not part of the public API. Never recommend one as a fix. Where the app already uses one, report it under NAVIOS-B-HYGIENE-1.

**Using this reference with `maps-ios.md`** (the `mapbox-ios-maps-audit` skill). A navigation app on iOS uses both audits. `NavigationMapView.mapView` is a Maps v11 `MapView`, so the Maps checks apply to it, with these exceptions:

- **Camera.** On a `NavigationMapView` the camera is owned by `NavigationCamera`, not by `mapView.viewport`. For camera code on a `NavigationMapView`, use NAVIOS-B-MAP-2 instead of MAPSIOS-B-CAMERA-1 and MAPSIOS-B-CAMERA-4, and don't recommend `makeFollowPuckViewportState` there.
- **Taps and long presses.** Check NAVIOS-B-MAP-1 before recommending `TapInteraction` / `LongPressInteraction` (MAPSIOS-A1) on a `NavigationMapView`.
- **Combine.** Navigation publishers already deliver on the main actor (NAVIOS-B-THREAD). MAPSIOS-B-HYGIENE-2's "no `.receive(on: DispatchQueue.main)`" doesn't apply to them.
- **Cancellation tokens.** Maps signals return `AnyCancelable` (one "l", MAPSIOS-B-HYGIENE-1). Navigation publishers are Combine and return `AnyCancellable`. Same failure when dropped, different ID: NAVIOS-B-COMBINE-1.
- **SDK-owned layers.** The route line, arrows, waypoints and callouts are layers the SDK adds and updates. Don't report them under MAPSIOS-B-STYLE.

## Part A — SDK Functional Catalog

Each entry lists what the SDK provides and the key public API to search for. If the app has its own implementation of the same capability, that is a candidate finding (a possible reimplementation).

### NAVIOS-A1. Provider, trip session & navigation state

| ID          | Functionality                                                                                       | Key API to detect a reimplementation in the app                                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NAVIOS-A1.1 | Single entry point, configuration                                                                   | `MapboxNavigationProvider(coreConfig:)`, `provider.mapboxNavigation`, `CoreConfig`                                                                       |
| NAVIOS-A1.2 | Session state: idle, Free Drive, Active Guidance, off-route                                         | `tripSession().startFreeDrive()`, `startActiveGuidance(with:startLegIndex:)`, `setToIdle()`, `session` / `currentSession` (`.activeGuidance(.offRoute)`) |
| NAVIOS-A1.3 | Progress on every status update (distance, time, fraction, leg, step) — see **NAVIOS-B-PROGRESS-1** | `navigation().routeProgress` → `RouteProgressState.routeProgress` (`RouteProgress`, `RouteLegProgress`, `RouteStepProgress`)                             |
| NAVIOS-A1.4 | Map-matched location, road name, speed limit, current speed                                         | `navigation().locationMatching` → `MapMatchingState` (`enhancedLocation`, `roadName`, `speedLimit`, `currentSpeed`), `currentLocationMatching`           |
| NAVIOS-A1.5 | Arrival and leg advance                                                                             | `navigation().waypointsArrival`, `CoreConfig.multilegAdvancing` (`.automatically`, `.manually`), `navigation().switchLeg(newLegIndex:)`                  |
| NAVIOS-A1.6 | Banner and voice instruction events                                                                 | `navigation().bannerInstructions`, `navigation().voiceInstructions`                                                                                      |
| NAVIOS-A1.7 | One error stream                                                                                    | `navigation().errors`                                                                                                                                    |
| NAVIOS-A1.8 | Background location handling                                                                        | `CoreConfig.disableBackgroundTrackingLocation`, `tripSession().disableTrackingBackgroundLocationIfNeeded()`, `restoreTrackingLocationIfNeeded()`         |
| NAVIOS-A1.9 | Keeping the screen awake during navigation                                                          | `IdleTimerManager.shared.disableIdleTimer()` (keep the returned `Cancellable`), `NavigationViewController.shouldManageApplicationIdleTimer`              |

**Reimplementation signals:** an app enum or set of flags that mirrors idle / free drive / guidance / off-route; `UIApplication.shared.isIdleTimerDisabled` toggled by hand around navigation screens (two owners of the same flag: one turns it off while the other still needs it).

### NAVIOS-A2. Routing

| ID          | Functionality                                   | Key API                                                                                                                                            |
| ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| NAVIOS-A2.1 | Route requests with navigation defaults         | `routingProvider().calculateRoutes(options:)` with `NavigationRouteOptions` → `NavigationRoutes`                                                   |
| NAVIOS-A2.2 | Map matching                                    | `routingProvider().calculateRoutes(options:)` with `NavigationMatchOptions`                                                                        |
| NAVIOS-A2.3 | Choosing an alternative before or during a trip | `NavigationRoutes.alternativeRoutes`, `selectingAlternativeRoute(at:)`, `selecting(alternativeRoute:)`, `navigation().selectAlternativeRoute(at:)` |
| NAVIOS-A2.4 | Automatic rerouting                             | `RoutingConfig.rerouteConfig` (`RerouteConfig`: `detectsReroute`, `urlOptionsCustomization` since `3.6.0`), `navigation().rerouting`               |
| NAVIOS-A2.5 | Continuous alternatives during guidance         | `RoutingConfig.alternativeRoutesDetectionConfig`, `navigation().continuousAlternatives`                                                            |
| NAVIOS-A2.6 | Faster-route detection, with optional approval  | `RoutingConfig.fasterRouteDetectionConfig` (`fasterRouteApproval`: `.automatically` or `.manually`), `navigation().fasterRoutes`                   |
| NAVIOS-A2.7 | Route refresh (traffic, ETA, incidents)         | `RoutingConfig.routeRefreshPeriod`, `navigation().routeRefreshing`                                                                                 |
| NAVIOS-A2.8 | Online, offline or hybrid routing               | `RoutingConfig.routingProviderSource` (`.online`, `.offline`, `.hybrid`)                                                                           |

### NAVIOS-A3. Route & map visualization (`NavigationMapView`)

| ID           | Functionality                                          | Key API                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NAVIOS-A3.1  | Route line with traffic, casing, alternatives          | `show(_:routeAnnotationKinds:)`, `showcase(_:routesPresentationStyle:routeAnnotationKinds:animated:duration:)`, `removeRoutes()`, `showsTrafficOnRouteLine`, `congestionConfiguration`, `showsAlternatives` |
| NAVIOS-A3.2  | Vanishing route line (traveled part fades)             | `routeLineTracksTraversal`                                                                                                                                                                                  |
| NAVIOS-A3.3  | Duration and relative-ETA callouts on routes           | `routeAnnotationKinds` (`.routeDurations`, `.relativeDurationsOnAlternative`, `.relativeDurationsOnAlternativeManuever`), `showsRelativeDurationsOnAlternativeManuever`                                     |
| NAVIOS-A3.4  | Maneuver arrow and intersection annotations            | Drawn by the SDK during guidance; `showsIntersectionAnnotations`                                                                                                                                            |
| NAVIOS-A3.5  | Waypoints and their styling                            | `showsIntermediateWaypoints`; `NavigationMapViewDelegate` `shapeFor waypoints:legIndex:`, `willAdd layer:`                                                                                                  |
| NAVIOS-A3.6  | Restricted areas and road alerts on the route          | `showsRestrictedAreasOnRoute`, `excludedRouteAlertTypes`, `updateFreeDriveAlertAnnotations(_:)`                                                                                                             |
| NAVIOS-A3.7  | Route line fades behind 3D buildings                   | `routeLineOcclusionFactor`                                                                                                                                                                                  |
| NAVIOS-A3.8  | Location puck                                          | `puckType`, `puckBearing`                                                                                                                                                                                   |
| NAVIOS-A3.9  | Taps on routes, waypoints and map features; long press | `NavigationMapViewDelegate`: `didSelect alternativeRoute:`, `didSelect waypoint:`, `userDidTap:`, `userDidLongTap:`; `tapGestureDistanceThreshold`                                                          |
| NAVIOS-A3.10 | App layers placed relative to the route line           | `customRouteLineLayerPosition`                                                                                                                                                                              |

**Reimplementation signals:** a `LineLayer` or `GeoJSONSource` the app fills with route geometry; traffic colors computed from `congestionLevels` or annotations; a "traveled part" recolored from progress (NAVIOS-B-MAP-3); `PointAnnotation`s or view annotations for route durations; a hand-drawn maneuver arrow.

### NAVIOS-A4. Camera

| ID          | Functionality                                          | Key API                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NAVIOS-A4.1 | Following and overview camera, transitions and padding | `navigationMapView.update(navigationCameraState:)` (`.following`, `.overview`), `navigationCamera.cameraStates`, `navigationCamera.stop()`, `viewportPadding`                              |
| NAVIOS-A4.2 | Camera framing from route and location                 | `MobileViewportDataSource`, `CarPlayViewportDataSource`; tune with `viewportDataSource.options` (`NavigationViewportDataSourceOptions`: `followingCameraOptions`, `overviewCameraOptions`) |
| NAVIOS-A4.3 | Custom framing or transitions                          | Own `ViewportDataSource` or `CameraStateTransition` conformance assigned to `navigationCamera`                                                                                             |

**Reimplementation signal:** `mapView.camera.ease` / `fly` / `mapboxMap.setCamera` driven from `locationMatching` or `routeProgress` to follow the user or frame the route (NAVIOS-B-MAP-2).

### NAVIOS-A5. Drop-in UI & UIKit components (`MapboxNavigationUIKit`)

| ID          | Functionality                                  | Key API                                                                                                                                                                 |
| ----------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NAVIOS-A5.1 | Complete turn-by-turn screen                   | `NavigationViewController(navigationRoutes:navigationOptions:)`, `NavigationOptions(mapboxNavigation:voiceController:eventsManager:…)`                                  |
| NAVIOS-A5.2 | Embeddable navigation view                     | `NavigationView`                                                                                                                                                        |
| NAVIOS-A5.3 | Route and destination preview                  | `PreviewViewController`, `RoutePreviewViewController`, `DestinationPreviewViewController`                                                                               |
| NAVIOS-A5.4 | Maneuver banner, lanes, next step, step list   | `TopBannerViewController`, `BottomBannerViewController`, `InstructionsBannerView`, `ManeuverView`, `LanesView`, `NextBannerView`, `StepsViewController`, `JunctionView` |
| NAVIOS-A5.5 | Custom banners that get navigation updates     | Pass them as `NavigationOptions` `topBanner` / `bottomBanner`; conform to `NavigationComponent` (`onRouteProgressUpdated(_:)` and the other callbacks)                  |
| NAVIOS-A5.6 | Speed limit sign and current road name         | `SpeedLimitView`, `WayNameView`                                                                                                                                         |
| NAVIOS-A5.7 | Day/night styles by time of day and in tunnels | `StyleManager.automaticallyAdjustsStyleForTimeOfDay`, `DayStyle` / `NightStyle` subclasses, `NavigationViewController.usesNightStyleWhileInTunnel`                      |
| NAVIOS-A5.8 | Localized distances                            | `DistanceFormatter`                                                                                                                                                     |
| NAVIOS-A5.9 | CarPlay                                        | `CarPlayManager`, `CarPlayNavigationViewController`, `CarPlaySearchController`                                                                                          |

**Reimplementation signals:** a custom speed-limit sign fed from `MapMatchingState.speedLimit`; a road-name label fed from `roadName`; sunrise and sunset math to switch the map style; a `MeasurementFormatter` or string math for "0.3 mi" / "200 m" next to maneuvers; a custom banner that isn't a `NavigationComponent` and polls the SDK for progress.

FP risk: a design system that requires its own components is a valid reason. Report a reimplementation only when it duplicates the SDK behavior (same data, same purpose) with no visible design reason, and say so in the FP column.

### NAVIOS-A6. Voice guidance

| ID          | Functionality                                             | Key API                                                                                                             |
| ----------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| NAVIOS-A6.1 | Plays voice instructions at the right time, reroute sound | `provider.routeVoiceController` (`RouteVoiceController`, `playsRerouteSound`); `speechSynthesizer.muted`, `.volume` |
| NAVIOS-A6.2 | Speech engine choice                                      | `CoreConfig.ttsConfig`: `.default`, `.localOnly`, `.custom(speechSynthesizer:)`                                     |
| NAVIOS-A6.3 | Own speech engine, or a chain of engines with fallback    | `SpeechSynthesizing` conformance, `MultiplexedSpeechSynthesizer`                                                    |
| NAVIOS-A6.4 | Audio session handling (ducking other audio)              | `SpeechSynthesizing.managesAudioSession` (`true` by default on the SDK synthesizers)                                |

`provider.routeVoiceController` is created on first access. `NavigationViewController` gets it through `NavigationOptions(voiceController:)`. Voice plays only once something has accessed it.

**Reimplementation signal:** an `AVSpeechSynthesizer` or audio player driven from `voiceInstructions`, `SpokenInstruction` or `RouteStepProgress.currentSpokenInstruction`.

### NAVIOS-A7. Road objects & electronic horizon

| ID          | Functionality                                                                                   | Key API                                                                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NAVIOS-A7.1 | Upcoming tunnels, tolls, border crossings, incidents, restricted areas, rest stops on the route | `RouteProgress.upcomingRouteAlerts` (`RouteAlert`: `roadObject`, `distanceToStart`)                                                                    |
| NAVIOS-A7.2 | Road graph and road objects ahead, also in Free Drive                                           | `CoreConfig.electronicHorizonConfig`, `electronicHorizon().startUpdatingEHorizon()`, `eHorizonEvents`, `roadMatching` (`roadGraph`, `roadObjectStore`) |
| NAVIOS-A7.3 | Live incidents                                                                                  | `CoreConfig.liveIncidentsConfig`                                                                                                                       |

**Reimplementation signal:** the app walks `route.legs` / `steps` / `intersections` on progress updates to find the next tunnel, toll or border, or queries its own backend for incidents along the route.

### NAVIOS-A8. Location sources, simulation & replay

| ID          | Functionality                            | Key API                                                                                                     |
| ----------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| NAVIOS-A8.1 | Live, simulated or app-provided location | `CoreConfig.locationSource`: `.live`, `.simulation(initialLocation:)`, `.custom(LocationClient)`            |
| NAVIOS-A8.2 | Replay a recorded drive                  | `HistoryReader`, `HistoryReplayController`, `LocationClient.historyReplayingValue(with:)`                   |
| NAVIOS-A8.3 | Switch the source at runtime             | `provider.apply(coreConfig:)` with a new `locationSource` (see NAVIOS-B-PROVIDER-3 for what else it resets) |

**Reimplementation signal:** a `Timer` that steps a coordinate along the route geometry and feeds it to the map or the SDK; a second `CLLocationManager` running next to the SDK's for the same purpose.

### NAVIOS-A9. Predictive caching & offline

| ID          | Functionality                                 | Key API                                                                                                                           |
| ----------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| NAVIOS-A9.1 | Caching map and routing tiles around the user | `CoreConfig.predictiveCacheConfig`, `provider.predictiveCacheManager` (pass it to `NavigationMapView` and `NavigationOptions`)    |
| NAVIOS-A9.2 | Offline routing tiles                         | `provider.getLatestNavigationTilesetDescriptor()` with Maps `TileStore` / `OfflineManager` (map tiles: `maps-ios.md` MAPSIOS-A12) |

### NAVIOS-A10. History, feedback & telemetry

| ID           | Functionality             | Key API                                                                                                                     |
| ------------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| NAVIOS-A10.1 | Record a drive for replay | `CoreConfig.historyRecordingConfig`, `historyRecorder()?.startRecordingHistory()`, `stopRecordingHistory(writingFileWith:)` |
| NAVIOS-A10.2 | User feedback to Mapbox   | `eventsManager().createFeedback()`, `sendActiveNavigationFeedback(…)`, `sendPassiveNavigationFeedback(…)`                   |
| NAVIOS-A10.3 | Copilot trip recording    | `CoreConfig(copilotEnabled:)`, `copilot()`                                                                                  |

### NAVIOS-A11. Dependency & version alignment (not a feature)

This is not a reimplementation to look for. It is a note on dependency management.

- Navigation v3 ships **only through Swift Package Manager** (products `MapboxNavigationCore` and `MapboxNavigationUIKit`). It brings in Maps v11 and MapboxCommon at versions it pins.
- Report a separate `mapbox-maps-ios` or `mapbox-common-ios` requirement in the app's package graph that holds them to a version the navigation release doesn't use, and other Mapbox SDKs (for example `mapbox-search-ios`) on a release line that needs a different MapboxCommon. SPM either fails to resolve, or the app is held on an older Navigation release. Read the resolved versions from `Package.resolved`.
- No finding if the app adds Maps only to get a newer v11 than navigation pins, and it resolves.

---

## Part B — Performance & Correctness Antipatterns

These are not reimplemented features. They are ways of using the SDK that are known to be costly or unsafe, and they usually produce the most valuable findings.

### Provider & session lifecycle (NAVIOS-B-PROVIDER-\*)

#### NAVIOS-B-PROVIDER-1. More than one `MapboxNavigationProvider` alive

**A crash, not a warning.** Only one provider may exist at a time. Creating a second while the first is alive hits `preconditionFailure("MapboxNavigationProvider was instantiated twice.")`. No build catches it. It often shows up only when a screen opens for the second time.

Common causes:

- One provider per screen, and the previous screen is still alive: a child view controller removed from the view but never with `removeFromParent()`, a view controller cached in a coordinator or array, a strong `self` in a Combine sink or `Task` (NAVIOS-B-COMBINE-2)
- `NavigationOptions()` with no arguments. It builds **its own** provider. If the app already has one, that is the second.
- A provider created in two places (app delegate and a screen, or the phone app and the CarPlay scene)

```swift
// Avoid — NavigationOptions() creates a second provider next to the app's
let controller = NavigationViewController(navigationRoutes: routes, navigationOptions: NavigationOptions())

// Prefer — build the options from the app's one provider
let options = NavigationOptions(
    mapboxNavigation: provider.mapboxNavigation,
    voiceController: provider.routeVoiceController,
    eventsManager: provider.eventsManager()
)
```

Flag: `MapboxNavigationProvider(` in more than one place, or in a type that can have two instances alive at once; `NavigationOptions()` with no arguments in an app that also creates a provider; a provider owned by a screen that is kept alive by any of the causes above. One app-wide owner is the safe default. One provider per screen works only when each screen is released before the next one is created.

#### NAVIOS-B-PROVIDER-2. Navigation started on a screen that has no trip session

A `NavigationMapView` shows the user's location from the navigation publishers. While the session is **idle** it shows no puck and no location updates. `NavigationViewController` starts Active Guidance itself and **sets the session to idle when it's dismissed**.

Flag:

- A preview or browsing screen with a `NavigationMapView` and no `tripSession().startFreeDrive()` (the map never shows the user)
- A screen that presents `NavigationViewController` and doesn't restart Free Drive after it's dismissed (the preview map stops updating after the first trip)
- `tripSession().startActiveGuidance(with:startLegIndex:)` called by the app before presenting `NavigationViewController` with the same routes (it starts guidance itself)

#### NAVIOS-B-PROVIDER-3. `apply(coreConfig:)` used for settings it doesn't change

`provider.apply(coreConfig:)` re-applies only the location source, TTS config, locale, log level, access token, telemetry app metadata and Copilot. Other fields are read once: `predictiveCacheConfig` when the provider is created; `multilegAdvancing`, `routingConfig` (reroute, faster-route, alternatives, refresh) and `electronicHorizonConfig` when the navigator is first built (the first `navigation()` or `tripSession()` call); `historyRecordingConfig` when the history recorder is first created. Changing them through `apply` after that point compiles and does nothing. (`routingProvider()` reads `routingConfig.routingProviderSource` on each call.)

`apply(coreConfig:)` also **rebuilds the route voice controller's speech synthesizer** from `ttsConfig`. Anything set on the old synthesizer is lost: `muted`, `volume`, `managesAudioSession`. The SDK documents `apply` as not recommended during operation.

Flag: `apply(coreConfig:)` that changes any of the read-once fields above after the navigator exists; `apply` in a frequently called path (every screen appearance, every settings toggle) when only one field changes; `speechSynthesizer.muted` / `.volume` set once and not set again after an `apply`. Recommend creating the provider with the final configuration, and re-applying speech settings after each `apply`, or keeping them in the app's own `SpeechSynthesizing` passed through `ttsConfig: .custom(...)`.

#### NAVIOS-B-PROVIDER-4. Free Drive left running with no screen that needs it

Free Drive and Active Guidance collect and process location continuously. A session started for a map screen and never set back to idle keeps running after the screen closes: battery, location use, and a navigation trip session the app may be billed for (check the billing impact with Mapbox).

Flag `startFreeDrive()` with no `setToIdle()` (or `pauseFreeDrive()`) on the path that leaves the last screen using it.

FP risk: apps that want Free Drive in the background on purpose (drive detection, electronic horizon, trip logging). Ask, don't assume.

---

### Combine subscriptions (NAVIOS-B-COMBINE-\*)

All navigation state comes from Combine publishers on `navigation()`, `tripSession()` and `electronicHorizon()`. `sink` returns an `AnyCancellable` that **cancels the subscription when it's released**.

#### NAVIOS-B-COMBINE-1. Dropped `AnyCancellable` — the subscription ends at once

```swift
// Avoid — the token is released at the end of the statement; the sink never runs again
_ = navigation.routeProgress.sink { [weak self] state in self?.update(state) }

// Prefer — keep the token as long as the subscription should live
private var cancellables = Set<AnyCancellable>()
navigation.routeProgress
    .sink { [weak self] state in self?.update(state) }
    .store(in: &cancellables)
```

Flag: `_ =` on a `sink` / `assign` result; a token kept in a local that goes out of scope; a token stored on an object that lives shorter than the subscription should.

#### NAVIOS-B-COMBINE-2. Strong `self` in a stored sink

A sink stored in `self.cancellables` that captures `self` strongly forms a cycle: `self` keeps the token, the token keeps the closure, the closure keeps `self`. The screen and everything it owns never deallocate. When that screen owns a `MapboxNavigationProvider` or a `NavigationMapView`, this leads to NAVIOS-B-PROVIDER-1 or a second live map.

Flag strong `self` (implicit `self.` or a captured property of `self`) in `sink` / `assign(to:on:)` closures on navigation publishers that are stored on `self`. `assign(to:on: self)` is always a strong capture. Recommend `[weak self]`, or `assign(to: &$property)` for `@Published` properties.

#### NAVIOS-B-COMBINE-3. Subscriptions added again on every appearance

Subscribing in `viewWillAppear`, `viewDidAppear`, a `layoutSubviews` path or inside another sink, into a set that is never cleared, adds a new subscriber each time. Handlers run two, three, n times per update.

Flag: subscriptions created in methods that run more than once per object, with no `cancellables.removeAll()` (or a dedicated set reset) on the matching disappear path.

---

### Threading & Swift concurrency (NAVIOS-B-THREAD-\*)

Most of the v3 surface is `@MainActor`: `MapboxNavigation` and its controllers (`navigation()`, `tripSession()`, `routingProvider()`, `electronicHorizon()`, `eventsManager()`, `historyRecorder()`), `provider.mapboxNavigation`, `provider.routeVoiceController`, `NavigationMapView`, `NavigationCamera`, and every UIKit component. The core publishers emit **on the main actor**, so sinks already run on the main thread.

Not a finding: `.receive(on: DispatchQueue.main)` on a navigation publisher. It is unnecessary (the value is already on main) and only delays delivery by one run-loop turn. Mention it under "Checked, not flagged" if it appears in a hot path.

#### NAVIOS-B-THREAD-1. SDK called off the main actor

Flag calls into the `@MainActor` API above from: `Task.detached`, a `Task` started from a nonisolated context, `DispatchQueue.global()` or a custom queue, an `OperationQueue`, a `URLSession` completion handler, or a delegate callback documented to run off main. In Swift 6 mode many of these are compile errors. In Swift 5 mode they compile with warnings and race at runtime.

Recommend: mark the owning type `@MainActor`, or hop with `await MainActor.run { … }` / `Task { @MainActor in … }`.

#### NAVIOS-B-THREAD-2. `MainActor.assumeIsolated` where the code isn't on the main thread

`MainActor.assumeIsolated` doesn't move work to the main thread. It **traps at runtime** when called elsewhere. Several closures the SDK calls are `@Sendable` and run **off** the main actor:

- `CoreConfig.multilegAdvancing` `.manually { … }`
- `FasterRouteDetectionConfig` `fasterRouteApproval: .manually { … }`
- the `skuTokenProvider` closure passed to `MultiplexedSpeechSynthesizer`

The app's own `SpeechSynthesizing` type is not on this list: the protocol is `@MainActor`.

```swift
// Avoid — traps at the first spoken instruction: the closure runs off the main actor
skuTokenProvider: { MainActor.assumeIsolated { provider.skuTokenProvider.skuToken() } }

// Prefer — read the Sendable provider once on the main actor, capture the value
let sku = provider.skuTokenProvider
let synthesizer = MultiplexedSpeechSynthesizer(
    mapboxSpeechApiConfiguration: apiConfiguration,
    skuTokenProvider: sku.skuToken,
    customSpeechSynthesizers: [appSynthesizer]
)
```

Flag `MainActor.assumeIsolated` inside any of these closures, in a startup `Task` that isn't `@MainActor`, or in a `CLLocationManagerDelegate` whose manager was created off the main thread. High confidence. Recommend capturing `Sendable` values, or hopping with `await MainActor.run`.

---

### Route progress hot path (NAVIOS-B-PROGRESS-\*)

`routeProgress` emits on every navigator status update during Active Guidance (typically once per location update), and `nil` when guidance ends, so sinks get an optional; `locationMatching` emits during both Free Drive and Active Guidance. Both run on the main thread. Work in their sinks competes with map rendering and UI.

#### NAVIOS-B-PROGRESS-1. `RouteProgress` fields recomputed by hand

`RouteProgress` already provides these values. Don't recompute them from the route geometry:

`distanceRemaining`, `distanceTraveled`, `durationRemaining`, `fractionTraveled`, `remainingWaypoints`, `remainingLegs`, `remainingSteps`, `upcomingStep`, `upcomingLeg`, `isFinalLeg`, `routeIsComplete`, `upcomingRouteAlerts`, `currentLegProgress` (`distanceRemaining`, `durationRemaining`, `fractionTraveled`, `currentStep`, `upcomingStep`, `followOnStep`, `currentSpeedLimit`) and `currentLegProgress.currentStepProgress` (`distanceRemaining`, `durationRemaining`, `fractionTraveled`, `upcomingIntersection`, `userDistanceToUpcomingIntersection`, `currentSpokenInstruction`, `currentVisualInstruction`).

```swift
// Avoid — distance to the end summed from the route shape on every update
let remaining = LineString(progress.route.shape!.coordinates)
    .sliced(from: location.coordinate)?.distance() ?? 0

// Prefer — already computed by the SDK
let remaining = progress.distanceRemaining
```

Search inside `routeProgress` and `locationMatching` sinks for: `.distance(` on a `LineString`, `sliced(`, `closestCoordinate(`, `reduce(` or `map` over `legs` / `steps` / `shape?.coordinates`, `CLLocation.distance(from:)` against route coordinates.

#### NAVIOS-B-PROGRESS-2. Route-derived values recomputed on every update

Values that depend only on the route — total distance and duration, leg count, the list of maneuvers, per-step lookups, a simplified shape for drawing — change only when the routes change. Compute them in a `tripSession().navigationRoutes` sink (or when the app receives `NavigationRoutes` from `calculateRoutes`), store the result, and read it in the progress sink.

Single field reads (`progress.route.distance`, `progress.route.legs.count`) in the progress sink are fine. Report meaningful work over route data whose result can't change until the route does.

#### NAVIOS-B-PROGRESS-3. Heavy synchronous work in progress or location sinks

Flag, inside `routeProgress`, `locationMatching` or `heading` sinks, work that runs on every update with no throttle: JSON encoding or decoding, disk or `UserDefaults` writes, Core Data saves, image rendering, `queryRenderedFeatures`, building a new `GeoJSONSource` or layer, `print` / logging of whole objects, network calls.

Recommend: do it when the value changes (`removeDuplicates()` on the derived value), throttle (`throttle(for:scheduler:latest:)`), or move the work off the main thread after copying the values it needs.

#### NAVIOS-B-PROGRESS-4. Polling instead of subscribing

A `Timer` or `CADisplayLink` that reads `navigation().currentRouteProgress`, `currentLocationMatching` or `tripSession().currentSession` re-creates the publishers with worse timing: it misses updates or reads the same one many times. Recommend subscribing to the matching publisher.

FP risk: a one-off read (`currentLocationMatching?.enhancedLocation` as the origin of a route request) is the intended use of the `current…` properties. Don't flag it.

---

### Route management (NAVIOS-B-ROUTE-\*)

#### NAVIOS-B-ROUTE-1. `RouteOptions` instead of `NavigationRouteOptions`

`NavigationRouteOptions` sets what navigation needs: alternatives, travel times, speed limits, banner and voice instructions, and for the default `.automobileAvoidingTraffic` profile, numeric congestion and route refresh. A plain `RouteOptions` sent to `calculateRoutes` misses these. The visible effects: no traffic colors on the route line, no voice or banner instructions, and route refresh that does nothing.

Flag `RouteOptions(` passed to `routingProvider().calculateRoutes(options:)`, and `NavigationRouteOptions` whose `attributeOptions` are reassigned in a way that drops `.numericCongestionLevel` or `.expectedTravelTime`. Also flag a traffic-aware app that uses a profile other than `.automobileAvoidingTraffic` and expects traffic colors or refresh.

#### NAVIOS-B-ROUTE-2. Off-route or reroute logic written by hand

The SDK detects off-route and reroutes by default (`RerouteConfig(detectsReroute: true)`), and reports both on `navigation().rerouting` and `tripSession().session` (`.activeGuidance(.offRoute)`). App code that measures the distance from the location to the route line and calls `calculateRoutes` itself when it's too far requests a second route in parallel with the SDK's.

Flag distance-to-route checks in `locationMatching` sinks that lead to `calculateRoutes` or `startActiveGuidance`. Recommend the SDK reroute and the `rerouting` publisher; to change the reroute request, `RerouteConfig.urlOptionsCustomization` (since `3.6.0`).

FP risk: `detectsReroute: false` with app-owned rerouting is a valid design (for example routes from the app's own backend). Then it's not a finding, but check that the app turned detection off; if both run, it is.

#### NAVIOS-B-ROUTE-3. Faster-route or alternative polling

Periodic `calculateRoutes` calls during guidance to look for a faster route or compare alternatives duplicate `FasterRouteDetectionConfig` and continuous alternatives (NAVIOS-A2.5, NAVIOS-A2.6). If the app needs the driver to confirm a faster route, use `fasterRouteApproval: .manually { … }` (NAVIOS-B-THREAD-2 applies to the closure).

#### NAVIOS-B-ROUTE-4. Route requests on every intermediate gesture event

`calculateRoutes` called on every update of a continuous interaction (dragging a waypoint, panning to pick a destination) instead of once it settles. Each request costs a Directions API call. The change itself still warrants a route; only the intermediate events are wasteful. Recommend requesting at the end of the gesture, or `debounce` on the input.

#### NAVIOS-B-ROUTE-5. Routes kept long before guidance starts

`NavigationRoutes` fetched far ahead of time (on app start, from a list screen) and started much later carry stale traffic and ETA, and the route may no longer start where the user is. Flag routes kept in a long-lived store and started without a fresh request. Low to medium confidence: say how long they're held.

---

### Map, camera & gestures (NAVIOS-B-MAP-\*)

#### NAVIOS-B-MAP-1. App gesture recognizers on a `NavigationMapView`

`NavigationMapView` installs its own tap and long-press handling and reports them on `NavigationMapViewDelegate`. A `UILongPressGestureRecognizer` or `UITapGestureRecognizer` the app adds to the map competes with the SDK's. The usual symptom: **long press does nothing**, with no error. It compiles and looks right in review.

```swift
// Avoid — competes with the SDK's own recognizer
let press = UILongPressGestureRecognizer(target: self, action: #selector(didLongPress(_:)))
navigationMapView.addGestureRecognizer(press)

// Prefer — the SDK reports it
func navigationMapView(_ navigationMapView: NavigationMapView, userDidLongTap mapPoint: MapPoint) {
    requestRoute(to: mapPoint.coordinate)
}
```

The delegate callbacks:

- `userDidLongTap:` — any long press. Fires when the press **begins**.
- `didSelect alternativeRoute:` — a tap near an alternative route line.
- `didSelect waypoint:` — a tap near an intermediate waypoint.
- `userDidTap:` — only a tap on a **named map feature** (`mapPoint.name != nil`). It is not a "tap anywhere" callback.

Flag `addGestureRecognizer` on a `NavigationMapView` or its `mapView`, and Maps `LongPressInteraction` on its `mapView`. High confidence for long press.

FP risk: for taps on empty map (no named feature), a Maps v11 `TapInteraction` on `navigationMapView.mapView` is the right tool, since `userDidTap:` won't fire. Don't flag it; mention it under "Checked, not flagged".

#### NAVIOS-B-MAP-2. Camera moved from app code while `NavigationCamera` owns it

In `.following` or `.overview` state, `NavigationCamera` updates the camera on every location and progress update. App code that calls `mapView.camera.ease` / `fly`, `mapboxMap.setCamera`, or a `mapView.viewport` transition at the same time fights it: the camera jumps between the two.

Flag camera writes on a `NavigationMapView`'s `mapView` that can run while the navigation camera is following or in overview, with no `navigationCamera.stop()` before them. Flag a follow-the-user camera written by hand from `locationMatching` or `routeProgress` (recommend `update(navigationCameraState: .following)`), and overview bounds computed by hand (recommend `.overview`, tuned through `viewportDataSource.options`).

FP risk: user gestures move the camera to idle on their own. A deliberate one-off move after `stop()` is fine. Check `navigationCamera.cameraStates` handling before reporting with high confidence.

#### NAVIOS-B-MAP-3. Vanishing route line or traffic coloring updated by hand

Recoloring the traveled part of the route, or rebuilding the route line source, on every progress update re-creates `routeLineTracksTraversal` and `showsTrafficOnRouteLine` at far higher cost: each rebuild re-uploads the whole route geometry to the renderer.

Flag `GeoJSONSource` updates or line-gradient expressions for the route, driven from `routeProgress`. Recommend `routeLineTracksTraversal = true` and the SDK route line (NAVIOS-A3.1, NAVIOS-A3.2).

#### NAVIOS-B-MAP-4. Route line shown again on every update

`show(_:routeAnnotationKinds:)` or `showcase(...)` called from a `routeProgress` or `locationMatching` sink (or on every `navigationRoutes` emission that didn't change the routes) rebuilds the route layers each time. Call it when the routes change, not on progress.

---

### Voice guidance (NAVIOS-B-VOICE-\*)

#### NAVIOS-B-VOICE-1. Instructions spoken twice

The app speaks `voiceInstructions` with its own `AVSpeechSynthesizer` while `provider.routeVoiceController` also exists (the app accessed it, or passed it to `NavigationOptions`). Both speak every instruction.

Flag an app speech pipeline fed from `voiceInstructions` in an app that also touches `routeVoiceController` or presents `NavigationViewController`. Recommend one pipeline: the SDK's, with the app's engine passed as `ttsConfig: .custom(speechSynthesizer:)` if it needs its own voice.

#### NAVIOS-B-VOICE-2. Audio session managed twice

The SDK synthesizers activate and deactivate `AVAudioSession` (ducking other audio) when `managesAudioSession` is `true`, the default. App code that also sets the category, activates or deactivates the session around navigation speech can deactivate it while the SDK is speaking (cut-off instructions) or leave other audio ducked.

Flag `AVAudioSession.sharedInstance().setActive(` / `setCategory(` around navigation speech while the SDK synthesizer keeps `managesAudioSession = true`. Recommend one owner: set `managesAudioSession = false` when the app manages the session (and re-apply it after `apply(coreConfig:)`, NAVIOS-B-PROVIDER-3).

FP risk: apps that play their own audio (music, calls) set the session category for that. That's not this finding unless it toggles activation around SDK speech.

---

### Integration hygiene (NAVIOS-B-HYGIENE-\*)

#### NAVIOS-B-HYGIENE-1. SPI and private imports

`@_spi(...) import MapboxNavigationCore` (or `MapboxNavigationUIKit`, `MapboxMaps`), and `import …_Private` modules, use API that can change or disappear in any release without notice. Report every use with the symbol it unlocks. Common ones and their public alternatives:

| SPI symbol                                                                                                                                                                                                                    | Public alternative                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `NavigationMapView.showRoutes(_:)`, `showcaseRoutes(...)`                                                                                                                                                                     | `show(_:routeAnnotationKinds:)`, `showcase(_:routesPresentationStyle:routeAnnotationKinds:animated:duration:)`              |
| `NavigationRoutes(routeResponse:routeIndex:responseOrigin:)` (routes from a decoded response)                                                                                                                                 | None for arbitrary responses: request through `routingProvider()`. Routes from a history file: `HistoryReader`              |
| `refitDisplayedRoutes`, `routeLineWidthMultiplier`, `allowsHDRoads`, `routeCalloutViewProvider`, `apiRouteCalloutViewProviderEnabled`, `showsIntersectionLaneGuidance`, `useLegacyEtaRouteAnnotations` on `NavigationMapView` | None public. Raise the need with Mapbox                                                                                     |
| `NavigationMapView` initializers with `mapOptions:` / an app-built `MapView`                                                                                                                                                  | The public `NavigationMapView(location:routeProgress:routeRefreshing:navigationCameraType:heading:predictiveCacheManager:)` |
| `RoadCamerasManager`, `RoadCamerasMapController` (`MapboxNavigationCppRoadCameras`)                                                                                                                                           | None public (`@_spi(ExperimentalMapboxAPI)`)                                                                                |
| `CarPlayManagerDelegate` SPI requirements (`carPlayManager(_:didSetup:)` and one navigation-bar button method)                                                                                                                | Implement them as ordinary methods in the app. Don't import SPI to get the default implementations                          |

Severity: Medium (maintenance and upgrade risk), High when the SPI type sits in a core flow (route creation, the main map).

#### NAVIOS-B-HYGIENE-2. API that compiles and does nothing

These members are still in the SDK, but setting or implementing them has no effect. Code that uses them looks correct and silently doesn't work. Report each as a **correctness** finding, not a deprecation.

| Symbol                                                                                                                                                                                                           | What happens                                                                                                         | Use instead                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `TelemetryAppMetadata.userId`, `.sessionId`                                                                                                                                                                      | Ignored                                                                                                              | `TelemetryAppMetadata(name:version:)`; keep app identifiers in the app's own analytics |
| `CoreConfig.unitOfMeasurement` (since `3.20.0`; don't flag on older SDKs)                                                                                                                                        | Route requests from `RoutingProvider` ignore it                                                                      | `unitMeasurementSystem` (or `distanceUnit:`) on the `NavigationRouteOptions`           |
| `AlternativeRoutesDetectionConfig.refreshesAfterPassingDeviation`, `.refreshesWhenNoAvailableAlternatives`                                                                                                       | No effect                                                                                                            | `AlternativeRoutesDetectionConfig(acceptionPolicy:refreshIntervalSeconds:)`            |
| `ViewportState.routeProgress` (custom `ViewportDataSource`)                                                                                                                                                      | Always `nil`                                                                                                         | `navigationProgress`                                                                   |
| `ViewportState.heading`                                                                                                                                                                                          | Always `nil`                                                                                                         | `navigationHeading`                                                                    |
| `NavigationMapView.routeAnnotationMoreTimeTextColor`, `.routeAnnotationLessTimeTextColor`                                                                                                                        | No effect in the current callout design                                                                              | `routeAnnotationTextColor`, `routeAnnotationCaptionTextColor`                          |
| `CarPlayNavigationViewController.waypointStyle`                                                                                                                                                                  | No effect                                                                                                            | —                                                                                      |
| `didAdd finalDestinationAnnotation:` on `NavigationMapViewDelegate`, `NavigationViewControllerDelegate`, `CarPlayManagerDelegate`, `CarPlayNavigationViewControllerDelegate`, `CarPlayMapViewControllerDelegate` | Never called: the SDK no longer adds a destination annotation                                                        | The waypoint layer methods (`shapeFor waypoints:legIndex:`, `willAdd layer:`)          |
| `NavigationViewControllerDelegate.navigationViewController(_:didSubmitArrivalFeedback:)`                                                                                                                         | Never called (checked in `3.16.0` and `3.35.1`): the end-of-route screen sends the rating to Mapbox telemetry itself | If the app needs the rating, build its own arrival UI on `waypointsArrival`            |
| `RoadCamerasManager(navigator:)`                                                                                                                                                                                 | Always returns `nil`                                                                                                 | (SPI, see NAVIOS-B-HYGIENE-1)                                                          |
| `StyleManagerDelegate.styleManager(_:viewForApplying:)`                                                                                                                                                          | Not used: all views are refreshed                                                                                    | Drop the method                                                                        |

#### NAVIOS-B-HYGIENE-3. Deprecated APIs — one sweep

Each row is deprecated in `3.35.1` and has a replacement. Report them as **one table** under this ID: one row per deprecated symbol, with a call-site count. Don't report one finding per call site. Rows already in NAVIOS-B-HYGIENE-2 are reported there, not here.

| Deprecated                                                                                                                                               | Replacement                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `RerouteConfig.optionsCustomization`                                                                                                                     | `urlOptionsCustomization` (since `3.6.0`)                                                                                   |
| `CoreConfig.routeRequestConfig`, `RouteRequestConfig`, the `CoreConfig` initializer that takes them                                                      | Options on each `NavigationRouteOptions`; the `CoreConfig` initializer without `routeRequestConfig` and `unitOfMeasurement` |
| `UnitOfMeasurement`, `MeasurementSystem(_ lengthUnit:)`, `DistanceFormatter.measurementSystem`, `StepsViewController.measurementSystem`                  | `UnitMeasurementSystem`, `unitMeasurementSystem` (since `3.20.0`; don't flag on older SDKs)                                 |
| `NavigationMapView(location:routeProgress:navigationCameraType:heading:predictiveCacheManager:)` (no `routeRefreshing:`; deprecated on iOS 15 and later) | `NavigationMapView(location:routeProgress:routeRefreshing:navigationCameraType:heading:predictiveCacheManager:)`            |
| `NavigationMapView.pointAnnotationManager`                                                                                                               | The app's own annotation manager on `mapView` (the SDK no longer adds the destination annotation)                           |
| `ViewportState` initializer with `location:` / `routeProgress:`, `ViewportState.location`                                                                | `init(navigationLocation:navigationProgress:viewportPadding:navigationHeading:)`, `navigationLocation`                      |
| `RouteVoiceController` initializer without `rerouteSoundTrigger:` (since `3.17.0`)                                                                       | `init(routeProgressing:rerouteSoundTrigger:speechSynthesizer:)`, or `provider.routeVoiceController`                         |
| `MapboxSpeechSynthesizer.prepareIncomingSpokenInstructions(_:)`, `speak(_:during:)`                                                                      | The overloads with `locale:`                                                                                                |
| `AVAudioSession.tryDuckAudio()`                                                                                                                          | Let the synthesizer manage the session (NAVIOS-B-VOICE-2)                                                                   |
| `RoutingConfig` initializer with `alternativeRoutesDetectionSettings:`, `fasterRouteDetectionSettings:`, `rerouteSettings:`, `detectsReroute:`           | `RoutingConfig(datasetProfileIdentifier:alternativeRoutesDetectionConfig:fasterRouteDetectionConfig:rerouteConfig:…)`       |
| `TelemetryAppMetadata` initializer with `userId:` / `sessionId:`                                                                                         | `TelemetryAppMetadata(name:version:)`                                                                                       |
| `MapboxCopilot.startFreeDriveSession()` and the other synchronous session methods                                                                        | The `async` variants (`startFreeDriveSessionAsync()` …): the synchronous ones can lose recorded events                      |
| `NavigationRoutes.nativeRoute`, `NavigationRoutes(nativeRoute:)`, `AlternativeRoute(mainRoute:alternativeRoute:)`                                        | No longer supported: build routes through `routingProvider()`                                                               |
| `CarPlayManager.application(_:didConnectCarInterfaceController:to:)` and the `templateApplicationScene` methods without `didConnect` / `didDisconnect`   | `CPTemplateApplicationSceneDelegate`: `templateApplicationScene(_:didConnect:to:)`, `(_:didDisconnect:from:)`               |
| `CarPlayManagerDelegate` navigation-bar button methods that take `in carPlayTemplate: CPTemplate`                                                        | `carPlayManager(_:leadingNavigationBarButtonsCompatibleWith:in:for:)`, `…trailingNavigationBarButtonsCompatibleWith…`       |
| `CarPlaySearchController` `listTemplate(_:didSelect:completionHandler:)`                                                                                 | `CPListItem.handler`                                                                                                        |

#### NAVIOS-B-HYGIENE-4. Simulation reachable in release builds

`CoreConfig(locationSource: .simulation(...))` or a runtime switch to `.simulation` that isn't behind `#if DEBUG`, a debug menu, or a build setting. A release user who reaches it drives a simulated route.

Flag `.simulation(` in code that a release build can reach. Medium confidence: check the conditions around it.

Also note: `.simulation(initialLocation: nil)` starts at the route point closest to the device's last location, not at the route origin. A demo route that starts elsewhere can begin mid-route or arrive at once. Pass the route origin as `initialLocation` when that matters. `[VERIFY WITH MAPBOX]` for versions other than `3.35.1`.

---

## Part C — Audit Prompts

Run the prompts below one at a time, in order.

Every prompt uses the **grounding rule**: only flag a finding when it matches Part A or B; tag uncertain items `[VERIFY WITH MAPBOX]`; never invent method, property or type names.

Record every finding in the **output schema**: `Prompt ID | File:line | Pattern observed | SDK equivalent (catalog ID) | Confidence | FP risk | Suggested change`. Put the extra details a prompt asks for in "Pattern observed". Inventories (NAVIOS-P1, the deprecated-symbol table in NAVIOS-P9, NAVIOS-P11) are not findings and use the columns their prompt gives.

---

### Per-Prompt Reference

#### NAVIOS-P1. SDK API & feature inventory

```
You are reviewing a Mapbox Navigation SDK for iOS v3 integration (MapboxNavigationCore,
MapboxNavigationUIKit). Apply the grounding rule.

NAVIOS-P1a. List every Navigation SDK public symbol used in this codebase, grouped by
catalog area (NAVIOS-A1..NAVIOS-A10). Table: symbol | call-site count | sample file:line |
one-line use | actor context (main actor, nonisolated, background queue).
Ignore tests, samples, previews and dead code.

NAVIOS-P1b. Dependencies (Package.swift, Package.resolved, the Xcode project's package
references, XcodeGen / Tuist manifests, every target including widgets, watch and CarPlay
extensions): product | resolved version | targets that link it | used? | removal candidate.
Include mapbox-maps-ios, mapbox-common-ios and other Mapbox SDKs (NAVIOS-A11). State the
Navigation version in use. Every later finding must be valid for that version.

NAVIOS-P1c. Provider and session map: where MapboxNavigationProvider is created (file:line),
who owns it and for how long; every startFreeDrive / startActiveGuidance / setToIdle /
pauseFreeDrive call; every NavigationViewController, NavigationView and NavigationMapView,
and which screen owns each.

NAVIOS-P1d. Navigation features built by the app: name | 1–2 sentence description | entry
point file:line | SDK APIs used | custom UI or rendering. Note which use the drop-in UI
(NavigationViewController) and which build their own on NavigationMapView.

NAVIOS-P1e. List every @_spi( import, every import of a module ending in _Private, and
every use of a symbol from the SPI table in NAVIOS-B-HYGIENE-1.
```

#### NAVIOS-P2. Reimplemented-functionality review (catalog-driven)

```
Using the SDK Functional Catalog (Part A), find places where this codebase implements its
own version of something the SDK already provides.

For each catalog area, search for custom implementations and report matches:
- NAVIOS-A1 session/progress/arrival: an app enum mirroring session state; arrival detected
  from distance to the destination; isIdleTimerDisabled toggled by hand (NAVIOS-A1.9)
- NAVIOS-A2 routing: custom reroute or faster-route logic (see NAVIOS-P6 for the
  antipatterns), Directions API called with URLSession instead of routingProvider()
- NAVIOS-A3 route visuals: app LineLayers / GeoJSONSources with route geometry, traffic
  colors computed by the app, route-duration annotations, a hand-drawn maneuver arrow,
  custom waypoint markers where the delegate layer methods would do
- NAVIOS-A4 camera: follow or overview camera driven from location or progress updates
- NAVIOS-A5 guidance UI: custom maneuver, lane, speed-limit, road-name or step-list views fed
  from RouteProgress / MapMatchingState; sunrise/sunset style switching; distance strings
  formatted by hand
- NAVIOS-A6 voice: AVSpeechSynthesizer or audio playback fed from voiceInstructions
- NAVIOS-A7 road data: walking legs/steps/intersections to find tunnels, tolls, borders or
  incidents ahead; app backend calls for the same along the route
- NAVIOS-A8 simulation: a Timer stepping a coordinate along the route
- NAVIOS-A9 / NAVIOS-A10: custom tile prefetching; custom drive recording that duplicates
  history recording; feedback sent to Mapbox through a custom HTTP call

A design system that requires its own components is a valid reason to rebuild a view.
Report a reimplementation only when it duplicates the SDK behavior with no visible design
reason, and say so in the FP column.

For each finding: catalog ID | file:line | what is custom | SDK equivalent | confidence |
false-positive risk.
```

#### NAVIOS-P3. Provider, session & subscription lifecycle (NAVIOS-B-PROVIDER-1–4, NAVIOS-B-COMBINE-1–3)

```
Grounding: antipattern sections NAVIOS-B-PROVIDER and NAVIOS-B-COMBINE.

1. NAVIOS-B-PROVIDER-1 (crash): more than one place that creates MapboxNavigationProvider;
   a provider owned by a screen that can be alive twice (child view controllers never
   removeFromParent()'d, view controllers cached in a coordinator or array, strong self in
   sinks or Tasks); NavigationOptions() with no arguments in an app that also creates a
   provider. Give the path that would create the second instance.
2. NAVIOS-B-PROVIDER-2: NavigationMapView screens with no startFreeDrive(); screens that
   present NavigationViewController and don't restart Free Drive when it's dismissed;
   startActiveGuidance called by the app before presenting NavigationViewController.
3. NAVIOS-B-PROVIDER-3: apply(coreConfig:) calls. For each, which CoreConfig fields change.
   Flag read-once fields changed after the navigator exists (multilegAdvancing,
   routingConfig, historyRecordingConfig, electronicHorizonConfig, predictiveCacheConfig),
   apply in frequently called paths, and
   speech settings (muted, volume, managesAudioSession) not set again after apply.
4. NAVIOS-B-PROVIDER-4: startFreeDrive() with no setToIdle()/pauseFreeDrive() on the path
   that leaves the last screen using it. Ask whether background Free Drive is intended.
5. NAVIOS-B-COMBINE-1: sink/assign results dropped with `_ =`, kept in a local, or stored on
   a shorter-lived object.
6. NAVIOS-B-COMBINE-2: strong self in sinks stored on self, and assign(to:on: self).
7. NAVIOS-B-COMBINE-3: subscriptions created in viewWillAppear / viewDidAppear /
   layoutSubviews or inside another sink, into a set never cleared.

For each: file:line | pattern | consequence (crash, stale map, leak, duplicate handler) | fix.
```

#### NAVIOS-P4. Threading & Swift concurrency (NAVIOS-B-THREAD-1, NAVIOS-B-THREAD-2)

```
Grounding: antipattern section NAVIOS-B-THREAD. MapboxNavigation, its controllers,
provider.mapboxNavigation, routeVoiceController, NavigationMapView, NavigationCamera and all
UIKit components are @MainActor. Navigation publishers emit on the main actor.

1. NAVIOS-B-THREAD-1: calls into that API from Task.detached, a Task started from a
   nonisolated context, DispatchQueue.global() or a custom queue, an OperationQueue, or a
   URLSession completion handler, with no hop to the main actor.
2. NAVIOS-B-THREAD-2 (crash): MainActor.assumeIsolated inside multilegAdvancing .manually,
   fasterRouteApproval .manually, a skuTokenProvider closure, a startup Task that isn't @MainActor, or a CLLocationManagerDelegate whose
   manager was created off the main thread.

Do NOT report .receive(on: DispatchQueue.main) on navigation publishers as a threading fix
or a finding: it is unnecessary. Mention it under "Checked, not flagged" if it is in a hot
path.

For each: file:line | API | actor or queue it runs on | fix.
```

#### NAVIOS-P5. Route progress hot path (NAVIOS-B-PROGRESS-1–4)

```
Grounding: antipattern section NAVIOS-B-PROGRESS.

Find every sink on navigation().routeProgress, locationMatching and heading, and the
methods they call.
1. NAVIOS-B-PROGRESS-1: computation equivalent to a RouteProgress, RouteLegProgress or
   RouteStepProgress field. Search for LineString .distance(, sliced(, closestCoordinate(,
   reduce/map over legs, steps or shape?.coordinates, CLLocation.distance(from:) against
   route coordinates.
2. NAVIOS-B-PROGRESS-2: work over route data whose result only changes with the route.
   Recommend computing it in a tripSession().navigationRoutes sink and storing it.
3. NAVIOS-B-PROGRESS-3: JSON, disk, UserDefaults, Core Data, image rendering,
   queryRenderedFeatures, new sources or layers, full-object logging, network calls, on every
   update with no throttle or removeDuplicates.
4. NAVIOS-B-PROGRESS-4: Timers or display links reading currentRouteProgress,
   currentLocationMatching or currentSession. Don't flag one-off reads.

For each: file:line | pattern | cost per update | fix.
```

#### NAVIOS-P6. Route management (NAVIOS-B-ROUTE-1–5)

```
Grounding: antipattern section NAVIOS-B-ROUTE.

1. NAVIOS-B-ROUTE-1: RouteOptions( passed to calculateRoutes; NavigationRouteOptions whose
   attributeOptions drop .numericCongestionLevel or .expectedTravelTime; a non-traffic
   profile in an app that expects traffic colors or refresh.
2. NAVIOS-B-ROUTE-2: distance-to-route checks in locationMatching sinks that lead to
   calculateRoutes or startActiveGuidance. Check RerouteConfig(detectsReroute:) first: with
   false and app-owned rerouting it's a design choice; with both running it's a finding.
3. NAVIOS-B-ROUTE-3: periodic calculateRoutes during guidance to find faster routes or
   compare alternatives.
4. NAVIOS-B-ROUTE-4: calculateRoutes on every intermediate gesture event.
5. NAVIOS-B-ROUTE-5: NavigationRoutes stored long before guidance and started without a
   fresh request. Say how long they are held.

For each: file:line | pattern | why it's unsafe or stale | recommended SDK pattern.
```

#### NAVIOS-P7. Map, camera & gestures (NAVIOS-B-MAP-1–4)

```
Grounding: catalog NAVIOS-A3, NAVIOS-A4; antipattern section NAVIOS-B-MAP. For Maps checks on
navigationMapView.mapView, follow the exceptions at the top of this reference.

1. NAVIOS-B-MAP-1: addGestureRecognizer on a NavigationMapView or its mapView, and
   LongPressInteraction on its mapView. Recommend the NavigationMapViewDelegate callbacks.
   Do not flag a TapInteraction used for taps on empty map (userDidTap: only fires for named
   features); list it under "Checked, not flagged".
2. NAVIOS-B-MAP-2: camera writes (ease, fly, setCamera, viewport transitions) on the
   NavigationMapView's mapView that can run while the navigation camera is following or in
   overview, with no navigationCamera.stop() first; follow or overview cameras written by
   hand from locationMatching or routeProgress.
3. NAVIOS-B-MAP-3: route GeoJSONSource updates or line-gradient expressions driven from
   routeProgress.
4. NAVIOS-B-MAP-4: show / showcase called from routeProgress or locationMatching sinks, or
   on navigationRoutes emissions that didn't change the routes.

For each: file:line | pattern | user-visible effect | fix.
```

#### NAVIOS-P8. Voice guidance (NAVIOS-B-VOICE-1, NAVIOS-B-VOICE-2)

```
Grounding: catalog NAVIOS-A6; antipattern section NAVIOS-B-VOICE.

1. NAVIOS-B-VOICE-1: an app speech pipeline (AVSpeechSynthesizer, audio player, third-party
   TTS) fed from voiceInstructions or SpokenInstruction, in an app that also accesses
   provider.routeVoiceController or presents NavigationViewController.
2. NAVIOS-B-VOICE-2: AVAudioSession setActive / setCategory around navigation speech while
   the SDK synthesizer keeps managesAudioSession = true.
3. Speech settings (muted, volume, managesAudioSession) that are lost after
   apply(coreConfig:) — cross-reference NAVIOS-B-PROVIDER-3 instead of reporting twice.

For each: file:line | pattern | user-visible effect | fix.
```

#### NAVIOS-P9. Integration hygiene (NAVIOS-B-HYGIENE-1–4, NAVIOS-A11)

```
Grounding: antipattern section NAVIOS-B-HYGIENE; catalog NAVIOS-A11.

1. NAVIOS-B-HYGIENE-1: every @_spi( import of a Mapbox module and every _Private import, with
   the symbols each one unlocks. Give the public alternative from the table, or "none
   public".
2. NAVIOS-B-HYGIENE-2: every use of a symbol from the "compiles and does nothing" table. Report as
   correctness findings.
3. NAVIOS-B-HYGIENE-3: every deprecated symbol from the table. Output ONE table:
   deprecated symbol | replacement | call-site count | sample file:line. Don't repeat rows
   from item 2.
4. NAVIOS-B-HYGIENE-4: .simulation( reachable from a release build.
5. NAVIOS-A11: separate requirements on mapbox-maps-ios, mapbox-common-ios or other Mapbox
   SDKs that conflict with what the navigation release resolves.

Report findings in the output schema. The deprecated-symbol table from item 3 is separate.
```

#### NAVIOS-P10. Open-ended

```
NAVIOS-P10a. As a senior Navigation SDK engineer, list the 5 most expensive
navigation-related code paths: file:line | how often it runs | why it's expensive | top fix.
Rank by impact. Use sections NAVIOS-B-PROGRESS and NAVIOS-B-MAP for context.

NAVIOS-P10b. List up to 10 things that look surprising, unusual or inconsistent, even if not
clearly bugs: file:line | one-line description | one question for the author. Watch for:
assumptions about how often the progress publisher emits, force-unwrapped optional route
fields (route.shape, upcomingStep), hard-coded route or waypoint data, screens that behave
differently on first and second open, and behavior that differs between the phone and
CarPlay.
```

#### NAVIOS-P11. Wrap-up executive summary

```
Produce a one-page summary for the Mapbox reviewer:
- Integration scale: rough count of navigation-related files and types, distinct navigation
  screens, CarPlay yes/no, drop-in UI vs own UI, and which catalog areas
  (NAVIOS-A1–NAVIOS-A10) are in use.
- Primary use case(s) in one paragraph.
- Top 5 findings across all prompts, ranked by impact (crash, correctness, performance).
- SDK capabilities the integration should likely adopt but doesn't (from the catalog), such
  as a feature the app rebuilt.
- SDK version reviewed, any ★ experimental APIs relied on, and every SPI use.
```

---

### Reporting

For each prompt, record: prompt ID, finding count, the finding table, and any false positives (report these to Mapbox if you want to help improve the audit).

Priority order: **NAVIOS-P3, P4** (crashes and lifecycle: NAVIOS-B-PROVIDER-1 and NAVIOS-B-THREAD-2 first) > **NAVIOS-P7, P8, NAVIOS-P9 items 1–2** (silent correctness bugs: gestures, voice, no-op API) > **NAVIOS-P5, P6** (performance and route state) > **NAVIOS-P2** (rebuilt SDK features) > **NAVIOS-P9 items 3–5** (deprecations, simulation, dependencies) > **NAVIOS-P10** (open-ended).
