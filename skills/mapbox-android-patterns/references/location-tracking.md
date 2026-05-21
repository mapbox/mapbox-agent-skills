# Camera Follow User + Get Current Location

## Camera Follow User Location

To make the camera follow the user's location as they move:

```kotlin
class MapActivity : AppCompatActivity() {
    private lateinit var mapView: MapView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_map)

        mapView = findViewById(R.id.mapView)
        mapView.mapboxMap.loadStyle(Style.STANDARD)

        setupLocationTracking()
    }

    private fun setupLocationTracking() {
        // Request permissions first (use ActivityResultContracts)

        // Show user location
        mapView.location.updateSettings {
            enabled = true
            puckBearingEnabled = true
        }

        // Follow user location with camera
        mapView.location.addOnIndicatorPositionChangedListener { point ->
            mapView.camera.easeTo(
                CameraOptions.Builder()
                    .center(point)
                    .zoom(15.0)
                    .pitch(45.0)
                    .build(),
                MapAnimationOptions.Builder()
                    .duration(1000)
                    .build()
            )
        }

        // Optional: Follow bearing (direction) as well
        mapView.location.addOnIndicatorBearingChangedListener { bearing ->
            mapView.camera.easeTo(
                CameraOptions.Builder()
                    .bearing(bearing)
                    .build(),
                MapAnimationOptions.Builder()
                    .duration(1000)
                    .build()
            )
        }
    }

    override fun onStart() {
        super.onStart()
        mapView.onStart()
    }

    override fun onStop() {
        super.onStop()
        mapView.onStop()
    }

    override fun onDestroy() {
        super.onDestroy()
        mapView.onDestroy()
    }
}
```

## Get Current Location Once

```kotlin
mapView.location.getLastLocation { location ->
    location?.let {
        val point = Point.fromLngLat(it.longitude, it.latitude)
        mapView.camera.easeTo(
            CameraOptions.Builder()
                .center(point)
                .zoom(14.0)
                .build()
        )
    }
}
```
