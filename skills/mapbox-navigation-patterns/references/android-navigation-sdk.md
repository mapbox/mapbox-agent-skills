# Android: Navigation SDK Patterns

The snippets below illustrate how the NavSDK pieces fit together — lifecycle-aware navigation
handle, route requests, route line/arrow rendering, camera, voice guidance. They are not
copy-paste-ready screens: concerns like request cancellation, error/null handling, and permission
checks are left out so the NavSDK-specific parts stay legible, and other concerns (state
restoration, DI) depend on your app's architecture.

## Basic Turn-by-Turn Navigation

**Use `MapboxNavigationApp` + `requireMapboxNavigation`, not `MapboxNavigationProvider`.** The
provider pattern requires you to manually create/destroy the instance in `onCreate`/`onDestroy`,
which does not survive configuration changes and is easy to get wrong. The lifecycle-aware
pattern below is what the official NavSDK examples use.

```kotlin
import com.mapbox.api.directions.v5.models.RouteOptions
import com.mapbox.geojson.Point
import com.mapbox.navigation.base.extensions.applyDefaultNavigationOptions
import com.mapbox.navigation.base.options.NavigationOptions
import com.mapbox.navigation.base.route.NavigationRoute
import com.mapbox.navigation.base.route.NavigationRouterCallback
import com.mapbox.navigation.base.route.RouterFailure
import com.mapbox.navigation.base.route.RouterOrigin
import com.mapbox.navigation.core.MapboxNavigation
import com.mapbox.navigation.core.lifecycle.MapboxNavigationApp
import com.mapbox.navigation.core.lifecycle.MapboxNavigationObserver
import com.mapbox.navigation.core.lifecycle.requireMapboxNavigation

class NavigationActivity : AppCompatActivity() {

    // Lifecycle-aware handle: attaches/detaches automatically as the Activity
    // moves through the lifecycle and survives configuration changes.
    private val mapboxNavigation: MapboxNavigation by requireMapboxNavigation(
        onResumedObserver = object : MapboxNavigationObserver {
            override fun onAttached(mapboxNavigation: MapboxNavigation) {
                mapboxNavigation.startTripSession()
            }

            override fun onDetached(mapboxNavigation: MapboxNavigation) {
                // Unregister any observers registered in onAttached
            }
        },
        onInitialize = {
            MapboxNavigationApp.setup(NavigationOptions.Builder(this).build())
        }
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_navigation)

        // Define origin and destination
        val origin = Point.fromLngLat(-122.4194, 37.7749)
        val destination = Point.fromLngLat(-122.2711, 37.8044)

        // Request routes
        mapboxNavigation.requestRoutes(
            RouteOptions.builder()
                .applyDefaultNavigationOptions()
                .coordinatesList(listOf(origin, destination))
                .build(),
            object : NavigationRouterCallback {
                override fun onRoutesReady(
                    routes: List<NavigationRoute>,
                    @RouterOrigin routerOrigin: String
                ) {
                    // Set routes; startTripSession() already ran in onAttached
                    mapboxNavigation.setNavigationRoutes(routes)
                }

                override fun onFailure(
                    reasons: List<RouterFailure>,
                    routeOptions: RouteOptions
                ) {
                    // Handle failure
                }

                override fun onCanceled(
                    routeOptions: RouteOptions,
                    @RouterOrigin routerOrigin: String
                ) {
                    // Handle cancellation
                }
            }
        )
    }
}
```

## Custom Navigation UI

```kotlin
import com.mapbox.maps.MapView
import com.mapbox.navigation.base.options.NavigationOptions
import com.mapbox.navigation.core.MapboxNavigation
import com.mapbox.navigation.core.lifecycle.MapboxNavigationApp
import com.mapbox.navigation.core.lifecycle.MapboxNavigationObserver
import com.mapbox.navigation.core.lifecycle.requireMapboxNavigation
import com.mapbox.navigation.core.trip.session.LocationMatcherResult
import com.mapbox.navigation.core.trip.session.LocationObserver
import com.mapbox.navigation.core.trip.session.RouteProgressObserver

class CustomNavigationActivity : AppCompatActivity() {
    private lateinit var mapView: MapView
    private lateinit var instructionText: TextView
    private lateinit var distanceText: TextView
    private lateinit var etaText: TextView

    // Lifecycle-aware handle: register/unregister observers here rather than
    // in onCreate/onDestroy, so they stay correct across configuration changes.
    private val mapboxNavigation: MapboxNavigation by requireMapboxNavigation(
        onResumedObserver = object : MapboxNavigationObserver {
            override fun onAttached(mapboxNavigation: MapboxNavigation) {
                mapboxNavigation.registerRouteProgressObserver(routeProgressObserver)
                mapboxNavigation.registerLocationObserver(locationObserver)
                mapboxNavigation.startTripSession()
            }

            override fun onDetached(mapboxNavigation: MapboxNavigation) {
                mapboxNavigation.unregisterRouteProgressObserver(routeProgressObserver)
                mapboxNavigation.unregisterLocationObserver(locationObserver)
            }
        },
        onInitialize = {
            // Note: Access token is configured via MapboxOptions.accessToken
            // or from mapbox_access_token string resource
            MapboxNavigationApp.setup(NavigationOptions.Builder(this).build())
        }
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_custom_navigation)

        mapView = findViewById(R.id.mapView)
        instructionText = findViewById(R.id.instructionText)
        distanceText = findViewById(R.id.distanceText)
        etaText = findViewById(R.id.etaText)

        requestRoute()
    }

    private fun requestRoute() {
        val origin = Point.fromLngLat(-122.4194, 37.7749)
        val destination = Point.fromLngLat(-122.2711, 37.8044)

        val routeOptions = RouteOptions.builder()
            .applyDefaultNavigationOptions()
            .coordinatesList(listOf(origin, destination))
            .build()

        mapboxNavigation.requestRoutes(
            routeOptions,
            object : NavigationRouterCallback {
                override fun onRoutesReady(routes: List<NavigationRoute>,
                                          routerOrigin: RouterOrigin) {
                    // Set routes; startTripSession() already ran in onAttached
                    mapboxNavigation.setNavigationRoutes(routes)
                }

                override fun onFailure(reasons: List<RouterFailure>,
                                      routeOptions: RouteOptions) {
                    Log.e("Navigation", "Route request failed: $reasons")
                }

                override fun onCanceled(routeOptions: RouteOptions,
                                       routerOrigin: RouterOrigin) {
                    // Handle cancellation
                }
            }
        )
    }

    private val routeProgressObserver = RouteProgressObserver { routeProgress ->
        // Update custom UI
        val currentStep = routeProgress.currentLegProgress
            ?.currentStepProgress?.step

        instructionText.text = currentStep?.bannerInstructions?.firstOrNull()
            ?.primary?.text ?: "Continue"

        val distanceRemaining = routeProgress.currentLegProgress
            ?.currentStepProgress?.distanceRemaining ?: 0f
        distanceText.text = "In ${distanceRemaining.toInt()} meters"

        val durationRemaining = routeProgress.durationRemaining
        val eta = System.currentTimeMillis() + (durationRemaining * 1000).toLong()
        val formatter = SimpleDateFormat("h:mm a", Locale.getDefault())
        etaText.text = "Arrival: ${formatter.format(Date(eta))}"
    }

    private val locationObserver = object : LocationObserver {
        override fun onNewRawLocation(rawLocation: Location) {
            // Handle raw location
        }

        override fun onNewLocationMatcherResult(
            locationMatcherResult: LocationMatcherResult
        ) {
            // Update camera to follow user
            val location = locationMatcherResult.enhancedLocation
            mapView.getMapboxMap().setCamera(
                CameraOptions.Builder()
                    .center(Point.fromLngLat(location.longitude, location.latitude))
                    .zoom(15.0)
                    .bearing(location.bearing.toDouble())
                    .build()
            )
        }
    }
}
```

## Route Line Rendering

Render the route line explicitly with `MapboxRouteLineApi` (computes what to draw) and
`MapboxRouteLineView` (renders it to the style). Drive both from a `RoutesObserver` so the line
updates automatically on reroutes, congestion refreshes, and alternative-route changes — don't call
`setNavigationRoutes`/`renderRouteDrawData` manually after each route request.

```kotlin
import com.mapbox.navigation.core.MapboxNavigation
import com.mapbox.navigation.core.RoutesObserver
import com.mapbox.navigation.core.RoutesUpdatedResult
import com.mapbox.navigation.ui.maps.route.line.api.MapboxRouteLineApi
import com.mapbox.navigation.ui.maps.route.line.api.MapboxRouteLineView
import com.mapbox.navigation.ui.maps.route.line.model.MapboxRouteLineApiOptions
import com.mapbox.navigation.ui.maps.route.line.model.MapboxRouteLineViewOptions

// Declared lateinit and built in onCreate()
private lateinit var routeLineApi: MapboxRouteLineApi
private lateinit var routeLineView: MapboxRouteLineView

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // ...after setContentView()/view binding...

    // Defaults style render a solid blue line with a darker blue outline.
    routeLineApi = MapboxRouteLineApi(MapboxRouteLineApiOptions.Builder().build())
    routeLineView = MapboxRouteLineView(MapboxRouteLineViewOptions.Builder(this).build())
}

// Register on the lifecycle-aware MapboxNavigation handle (see above) so
// route changes — including reroutes and alternatives — redraw the line.
private val routesObserver = object : RoutesObserver {
    override fun onRoutesChanged(result: RoutesUpdatedResult) {
        val alternativesMetadata = mapboxNavigation.getAlternativeMetadataFor(
            result.navigationRoutes
        )
        routeLineApi.setNavigationRoutes(
            result.navigationRoutes,
            alternativesMetadata
        ) { value ->
            routeLineView.renderRouteDrawData(mapView.getMapboxMap().getStyle()!!, value)
        }
    }
}

override fun onDestroy() {
    super.onDestroy()
    // Release both — MapboxRouteLineApi and MapboxRouteLineView do not stop
    // work on their own when the screen goes away.
    routeLineApi.cancel()
    routeLineView.cancel()
}
```

## Route Maneuver Arrows

Render the upcoming-turn arrow with `MapboxRouteArrowApi` (computes the arrow geometry from
`RouteProgress`) and `MapboxRouteArrowView` (renders it to the style).

**If arrows are combined with route line rendering (Route Line Rendering above), the route line's
style layers must exist before any arrow rendering happens** — arrows anchor above the route
line's top layer. The route line's render call comes from `RoutesObserver`, asynchronously,
while the arrow's render fires from `RouteProgressObserver` as soon as a route is set — so on the
first route, the arrow can render before the route line's layers exist and end up stacked
underneath it. Avoid this by calling `initializeLayers` once the style loads,
before any route exists:

```kotlin
mapView.getMapboxMap().loadStyle(Style.STANDARD) { style ->
    routeLineView.initializeLayers(style)
}
```

```kotlin
import com.mapbox.navigation.core.trip.session.RouteProgressObserver
import com.mapbox.navigation.ui.maps.route.arrow.api.MapboxRouteArrowApi
import com.mapbox.navigation.ui.maps.route.arrow.api.MapboxRouteArrowView
import com.mapbox.navigation.ui.maps.route.arrow.model.RouteArrowOptions

// Declared lateinit and built in onCreate()
private lateinit var routeArrowApi: MapboxRouteArrowApi
private lateinit var routeArrowView: MapboxRouteArrowView

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // ...after setContentView()/view binding...

    routeArrowApi = MapboxRouteArrowApi()
    routeArrowView = MapboxRouteArrowView(RouteArrowOptions.Builder(this).build())
}

// Fold the update into the same routeProgressObserver that's registered via
// onAttached/onDetached in the Custom Navigation UI section above — don't wire
// up a second observer or unregister it by hand; the lifecycle-aware handle
// already covers registration and teardown for it.
private val routeProgressObserver = RouteProgressObserver { routeProgress ->
    // ...existing banner/ETA updates...

    val updatedManeuverArrow = routeArrowApi.addUpcomingManeuverArrow(routeProgress)
    routeArrowView.renderManeuverUpdate(mapView.getMapboxMap().getStyle()!!, updatedManeuverArrow)
}
```

Remember to register/unregister it the same way the observers above do: via
the `onAttached`/`onDetached` callbacks of an `onResumedObserver` passed to
`requireMapboxNavigation` (see Basic Turn-by-Turn Navigation). `onAttached` fires on Resumed and
`onDetached` fires on Paused, so the observer — and the recomputation it triggers on every progress
update — is torn down as soon as the screen leaves the foreground. **This is a more convenient
alternative to manually pairing lifecycle callbacks yourself (e.g. `onResume`/`onPause`) to achieve
the same effect** — no Activity callback override required.

## Navigation Camera

`NavigationCamera` doesn't compute camera positions itself — it consumes targets from a
`MapboxNavigationViewportDataSource` and transitions to them. The data source starts empty and has
nothing to transition to until it's been fed, so all three of the following are required — not
optional extras — before `requestNavigationCameraToFollowing()`/`...ToOverview()` will have any
visible effect:

| Observer                | Feeds the data source via                        |
| ----------------------- | ------------------------------------------------ |
| `RoutesObserver`        | `viewportDataSource.onRouteChanged(...)`         |
| `LocationObserver`      | `viewportDataSource.onLocationChanged(...)`      |
| `RouteProgressObserver` | `viewportDataSource.onRouteProgressChanged(...)` |

Call `viewportDataSource.evaluate()` after each of these three updates — it's what recomputes the
camera targets from whatever has been fed in so far.

```kotlin
import com.mapbox.navigation.core.directions.session.RoutesObserver
import com.mapbox.navigation.core.trip.session.LocationMatcherResult
import com.mapbox.navigation.core.trip.session.LocationObserver
import com.mapbox.navigation.core.trip.session.RouteProgressObserver
import com.mapbox.navigation.ui.maps.camera.NavigationCamera
import com.mapbox.navigation.ui.maps.camera.data.MapboxNavigationViewportDataSource
import com.mapbox.navigation.ui.maps.camera.transition.NavigationCameraTransitionOptions

// Declared lateinit and built in onCreate(), once mapView exists (see Custom
// Navigation UI above).
private lateinit var viewportDataSource: MapboxNavigationViewportDataSource
private lateinit var navigationCamera: NavigationCamera

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    mapView = findViewById(R.id.mapView)
    // ...

    viewportDataSource = MapboxNavigationViewportDataSource(mapView.getMapboxMap())
    navigationCamera = NavigationCamera(
        mapView.getMapboxMap(),
        mapView.camera,
        viewportDataSource
    )
}

// Feed route changes into the data source (register alongside the other
// observers on the lifecycle-aware MapboxNavigation handle).
private val routesObserver = RoutesObserver { result ->
    if (result.navigationRoutes.isNotEmpty()) {
        viewportDataSource.onRouteChanged(result.navigationRoutes.first())
    } else {
        viewportDataSource.clearRouteData()
    }
    viewportDataSource.evaluate()
}

// Feed location updates in. Move to Overview once, on the first fix — after
// that, only request Following in response to explicit user action (e.g. a
// recenter button), not automatically on every update.
private var firstLocationUpdateReceived = false
private val locationObserver = object : LocationObserver {
    override fun onNewRawLocation(rawLocation: Location) {
        // not used for the camera
    }

    override fun onNewLocationMatcherResult(
        locationMatcherResult: LocationMatcherResult
    ) {
        viewportDataSource.onLocationChanged(locationMatcherResult.enhancedLocation)
        viewportDataSource.evaluate()

        if (!firstLocationUpdateReceived) {
            firstLocationUpdateReceived = true
            navigationCamera.requestNavigationCameraToOverview(
                stateTransitionOptions = NavigationCameraTransitionOptions.Builder()
                    .maxDuration(0) // instant transition
                    .build()
            )
        }
    }
}

// Feed route progress in — the third required feed alongside routesObserver
// and locationObserver above. This only updates the data the camera reads
// from; it doesn't request a camera state itself.
private val routeProgressObserver = RouteProgressObserver { routeProgress ->
    viewportDataSource.onRouteProgressChanged(routeProgress)
    viewportDataSource.evaluate()
}

// Elsewhere — e.g. a recenter button's click listener:
// navigationCamera.requestNavigationCameraToFollowing()
```

## Voice Guidance

`MapboxAudioGuidance` is the high-level voice guidance component. Key points:

- **Call `MapboxAudioGuidance.getRegisteredInstance()` — this is the recommended way to get an
  instance.** It handles prefetching and mute state for you automatically, on top of the shared
  `MapboxNavigationApp` lifecycle. `MapboxAudioGuidance` is built on top of `MapboxSpeechApi`
  (fetches/synthesizes the instruction audio) and `MapboxVoiceInstructionsPlayer` (plays it).
- **`MapboxAudioGuidance.getRegisteredInstance()` self-registers** — MapboxAudioGuidance instance
  fetched via `MapboxAudioGuidance.getRegisteredInstance()` attaches itself to
  `MapboxNavigationApp`'s lifecycle as an observer and tears itself down automatically.
  No manual registration is needed for the shared instance.
- **Muting suppresses playback only, not the instructions themselves.** `mute()`, `unmute()`, and
  `toggle()` control whether audio is _played_; voice instructions keep arriving and staying in
  sync with the driver's position the whole time — muting doesn't pause or skip them.
- **If you need a standalone instance that you manage yourself** — for example to register it
  conditionally, or with specific options — use `MapboxAudioGuidance.create()`. Keep in mind not
  to use it together with `MapboxAudioGuidance.getRegisteredInstance()` — you'd end up with two
  independently-constructed instances, each driving its own voice player, racing to speak over
  each other.
- For additional information regarding `MapboxSpeechApi` and `MapboxVoiceInstructionsPlayer` use
  mapbox-docs mcp.

```kotlin
import com.mapbox.navigation.voice.api.MapboxAudioGuidance

// Fetches the instance MapboxNavigationApp already registered, or creates and
// registers one if none exists yet.
val audioGuidance = MapboxAudioGuidance.getRegisteredInstance()

audioGuidance.mute()
audioGuidance.unmute()
audioGuidance.toggle()

// Observe state (e.g. to reflect mute status in a mute button icon).
audioGuidance.stateFlow().collect { state ->
    // Update UI based on the current MapboxAudioGuidanceState
}
```

No manual unregistration needed here — the shared instance is tied to `MapboxNavigationApp`'s
own lifecycle and cleans itself up. That's only required if you build your own instance instead
(`MapboxAudioGuidance.create(options)` + `MapboxNavigationApp.registerObserver(audioGuidance)`),
in which case unregister it yourself in `onDestroy()` via
`MapboxNavigationApp.unregisterObserver(audioGuidance)`.

If you need a standalone instance that you manage yourself (for example to register it
conditionally or with specific options), use create() instead and unregister it
when it is no longer needed.

```kotlin
val options = MapboxSpeechApiOptions.Builder()
    .gender(VoiceGender.MALE)
    .build()

val audioGuidance = MapboxAudioGuidance.create(options)
override fun onCreate() {
  super.onCreate()
  MapboxNavigationApp.registerObserver(audioGuidance)
}

override fun onDestroy() {
  super.onDestroy()
  MapboxNavigationApp.unregisterObserver(audioGuidance)
}
```

## Reference

The examples above cover the basic pattern. For a complete, production-grade implementation —
route line rendering, maneuver arrows, camera transitions, voice guidance, and a replay engine for
testing without physically moving — see the official
[Turn-by-Turn Experience example](https://github.com/mapbox/mapbox-navigation-android-examples/blob/main/app/src/main/java/com/mapbox/navigation/examples/standalone/turnbyturn/TurnByTurnExperienceActivity.kt)
in `mapbox-navigation-android-examples`. That repo is the canonical source for current NavSDK
Android patterns — check it if the API surface shown here looks out of date.
