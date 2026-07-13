# Android: Navigation SDK Patterns

## Basic Turn-by-Turn Navigation

```kotlin
import com.mapbox.navigation.base.options.NavigationOptions
import com.mapbox.navigation.core.MapboxNavigation
import com.mapbox.navigation.core.MapboxNavigationProvider
import com.mapbox.navigation.base.route.NavigationRouterCallback
import com.mapbox.navigation.base.route.RouterOrigin
import com.mapbox.navigation.base.route.RouterFailure
import com.mapbox.api.directions.v5.models.RouteOptions
import com.mapbox.geojson.Point

class NavigationActivity : AppCompatActivity() {
    private lateinit var mapboxNavigation: MapboxNavigation

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_navigation)

        // Initialize MapboxNavigation
        mapboxNavigation = MapboxNavigationProvider.create(
            NavigationOptions.Builder(this).build()
        )

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
                    // Set routes and start navigation
                    mapboxNavigation.setNavigationRoutes(routes)
                    mapboxNavigation.startTripSession()
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

    override fun onDestroy() {
        super.onDestroy()
        MapboxNavigationProvider.destroy()
    }
}
```

## Custom Navigation UI

```kotlin
import com.mapbox.navigation.core.MapboxNavigation
import com.mapbox.navigation.core.trip.session.LocationMatcherResult
import com.mapbox.navigation.core.trip.session.LocationObserver
import com.mapbox.navigation.core.trip.session.RouteProgressObserver
import com.mapbox.maps.MapView

class CustomNavigationActivity : AppCompatActivity() {
    private lateinit var mapboxNavigation: MapboxNavigation
    private lateinit var mapView: MapView
    private lateinit var instructionText: TextView
    private lateinit var distanceText: TextView
    private lateinit var etaText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_custom_navigation)

        mapView = findViewById(R.id.mapView)
        instructionText = findViewById(R.id.instructionText)
        distanceText = findViewById(R.id.distanceText)
        etaText = findViewById(R.id.etaText)

        setupNavigation()
    }

    private fun setupNavigation() {
        // Initialize MapboxNavigation
        // Note: Access token is configured via MapboxOptions.accessToken
        // or from mapbox_access_token string resource
        mapboxNavigation = MapboxNavigationProvider.create(
            NavigationOptions.Builder(this).build()
        )

        // Request route
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
                    mapboxNavigation.setNavigationRoutes(routes)
                    startNavigation()
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

    private fun startNavigation() {
        // Register observers for navigation updates
        mapboxNavigation.registerRouteProgressObserver(routeProgressObserver)
        mapboxNavigation.registerLocationObserver(locationObserver)

        // Start trip session
        mapboxNavigation.startTripSession()
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

    override fun onDestroy() {
        super.onDestroy()
        mapboxNavigation.unregisterRouteProgressObserver(routeProgressObserver)
        mapboxNavigation.unregisterLocationObserver(locationObserver)
        MapboxNavigationProvider.destroy()
    }
}
```
