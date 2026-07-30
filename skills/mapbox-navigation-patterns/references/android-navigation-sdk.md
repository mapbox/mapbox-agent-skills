# Android: Navigation SDK Patterns

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

## Reference

The examples above cover the basic pattern. For a complete, production-grade implementation —
route line rendering, maneuver arrows, camera transitions, voice guidance, and a replay engine for
testing without physically moving — see the official
[Turn-by-Turn Experience example](https://github.com/mapbox/mapbox-navigation-android-examples/blob/main/app/src/main/java/com/mapbox/navigation/examples/standalone/turnbyturn/TurnByTurnExperienceActivity.kt)
in `mapbox-navigation-android-examples`. That repo is the canonical source for current NavSDK
Android patterns — check it if the API surface shown here looks out of date.
