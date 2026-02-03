# Mapbox Android Integration Guide

Quick reference for Mapbox Maps SDK for Android with Kotlin, Jetpack Compose, and View system.

## Setup

### Gradle Configuration
```kotlin
// build.gradle.kts (project)
repositories {
    google()
    mavenCentral()
    maven {
        url = uri("https://api.mapbox.com/downloads/v2/releases/maven")
        credentials {
            username = "mapbox"
            password = providers.gradleProperty("MAPBOX_DOWNLOADS_TOKEN").get()
        }
    }
}

// build.gradle.kts (app)
dependencies {
    implementation("com.mapbox.maps:android:11.0.0")
}
```

### Access Token
```kotlin
// secrets.properties (add to .gitignore)
MAPBOX_ACCESS_TOKEN=pk.your_token_here

// AndroidManifest.xml
<application>
    <meta-data
        android:name="MAPBOX_ACCESS_TOKEN"
        android:value="${MAPBOX_ACCESS_TOKEN}" />
</application>
```

## Jetpack Compose Integration

### Basic Map
```kotlin
import com.mapbox.maps.compose.*

@Composable
fun MapScreen() {
    val cameraState = rememberCameraState {
        position = CameraPosition(
            center = Point.fromLngLat(-122.4194, 37.7749),
            zoom = 12.0
        )
    }

    MapboxMap(
        modifier = Modifier.fillMaxSize(),
        mapViewportState = cameraState,
        style = Style.STREETS
    )
}
```

### With Annotations
```kotlin
@Composable
fun MapWithMarkers() {
    MapboxMap(
        modifier = Modifier.fillMaxSize()
    ) {
        PointAnnotation(
            point = Point.fromLngLat(-122.4194, 37.7749)
        ) {
            iconImage = "marker-icon"
        }

        CircleAnnotation(
            point = Point.fromLngLat(-122.4, 37.78)
        ) {
            circleRadius = 10.0
            circleColor = "#FF0000"
        }
    }
}
```

## View System Integration

### XML Layout
```xml
<com.mapbox.maps.MapView
    android:id="@+id/mapView"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

### Activity Setup
```kotlin
class MapActivity : AppCompatActivity() {
    private lateinit var mapView: MapView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_map)

        mapView = findViewById(R.id.mapView)
        mapView.mapboxMap.apply {
            setCamera(
                CameraOptions.Builder()
                    .center(Point.fromLngLat(-122.4194, 37.7749))
                    .zoom(12.0)
                    .build()
            )
            loadStyle(Style.STREETS)
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

## Common Patterns

### 1. Camera Control
```kotlin
// Fly to location
mapView.mapboxMap.flyTo(
    CameraOptions.Builder()
        .center(Point.fromLngLat(-122.4194, 37.7749))
        .zoom(14.0)
        .build(),
    MapAnimationOptions.mapAnimationOptions {
        duration(2000)
    }
)

// Ease to location
mapView.mapboxMap.easeTo(
    CameraOptions.Builder()
        .center(point)
        .zoom(15.0)
        .build(),
    MapAnimationOptions.mapAnimationOptions {
        duration(1000)
    }
)

// Set immediately
mapView.mapboxMap.setCamera(
    CameraOptions.Builder()
        .center(point)
        .zoom(12.0)
        .build()
)
```

### 2. Annotations
```kotlin
// Point annotation manager
val annotationApi = mapView.annotations
val pointAnnotationManager = annotationApi.createPointAnnotationManager()

val pointAnnotationOptions = PointAnnotationOptions()
    .withPoint(Point.fromLngLat(-122.4194, 37.7749))
    .withIconImage("marker-icon")

pointAnnotationManager.create(pointAnnotationOptions)

// Circle annotation
val circleAnnotationManager = annotationApi.createCircleAnnotationManager()
val circleAnnotationOptions = CircleAnnotationOptions()
    .withPoint(Point.fromLngLat(-122.4, 37.78))
    .withCircleRadius(10.0)
    .withCircleColor("#FF0000")

circleAnnotationManager.create(circleAnnotationOptions)
```

### 3. Adding Layers
```kotlin
// GeoJSON source
val source = geoJsonSource("source-id") {
    geometry(Point.fromLngLat(-122.4194, 37.7749))
}
mapView.mapboxMap.getStyle()?.addSource(source)

// Circle layer
val layer = circleLayer("layer-id", "source-id") {
    circleRadius(8.0)
    circleColor("#FF0000")
}
mapView.mapboxMap.getStyle()?.addLayer(layer)
```

### 4. Event Handling
```kotlin
// Map click
mapView.mapboxMap.addOnMapClickListener { point ->
    // Handle click at point
    true // Return true if consumed
}

// Map long click
mapView.mapboxMap.addOnMapLongClickListener { point ->
    // Handle long click
    true
}

// Camera change
mapView.mapboxMap.addOnCameraChangeListener {
    val cameraState = mapView.mapboxMap.cameraState
    // Handle camera change
}
```

### 5. User Location
```kotlin
// Add permissions to AndroidManifest.xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

// Enable location component
val locationComponentPlugin = mapView.location
locationComponentPlugin.updateSettings {
    enabled = true
    pulsingEnabled = true
}

// Request permissions (Activity)
if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
    != PackageManager.PERMISSION_GRANTED) {
    ActivityCompat.requestPermissions(
        this,
        arrayOf(Manifest.permission.ACCESS_FINE_LOCATION),
        LOCATION_PERMISSION_REQUEST_CODE
    )
}
```

## Performance Optimization

### 1. Reuse Annotation Managers
```kotlin
// ✅ Create once, reuse
class MapViewModel {
    private lateinit var pointAnnotationManager: PointAnnotationManager

    fun setup(mapView: MapView) {
        pointAnnotationManager = mapView.annotations.createPointAnnotationManager()
    }

    fun updateMarkers(markers: List<Marker>) {
        pointAnnotationManager.deleteAll()
        markers.forEach { marker ->
            pointAnnotationManager.create(
                PointAnnotationOptions()
                    .withPoint(marker.point)
                    .withIconImage("marker")
            )
        }
    }
}
```

### 2. Batch Operations
```kotlin
// ✅ Batch create annotations
val options = markers.map { marker ->
    PointAnnotationOptions()
        .withPoint(marker.point)
        .withIconImage("marker")
}
pointAnnotationManager.create(options)

// ❌ Create one by one (slow)
markers.forEach { marker ->
    pointAnnotationManager.create(...)
}
```

### 3. Lifecycle Management
```kotlin
// ✅ Properly handle lifecycle
class MapFragment : Fragment() {
    private var _binding: FragmentMapBinding? = null
    private val binding get() = _binding!!

    override fun onStart() {
        super.onStart()
        binding.mapView.onStart()
    }

    override fun onStop() {
        super.onStop()
        binding.mapView.onStop()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        binding.mapView.onDestroy()
        _binding = null  // Prevent memory leak
    }
}
```

## Common Issues

### 1. Map Not Displaying
```kotlin
// ❌ Missing access token in AndroidManifest.xml
// ❌ Wrong credentials in gradle.properties
// ❌ MapView not properly sized

// ✅ Check manifest, credentials, and layout
<MapView
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

### 2. Memory Leaks
```kotlin
// ✅ Clean up in onDestroy
override fun onDestroyView() {
    super.onDestroyView()
    mapView.onDestroy()
    _binding = null
}

// ✅ Remove listeners
override fun onStop() {
    super.onStop()
    mapView.mapboxMap.removeOnMapClickListener(clickListener)
}
```

### 3. Location Permissions
```kotlin
// ✅ Request runtime permissions (Android 6+)
private fun checkLocationPermission() {
    if (ContextCompat.checkSelfPermission(this, ACCESS_FINE_LOCATION)
        != PERMISSION_GRANTED) {
        requestPermissions(
            arrayOf(ACCESS_FINE_LOCATION),
            LOCATION_REQUEST_CODE
        )
    }
}

override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String>,
    grantResults: IntArray
) {
    if (requestCode == LOCATION_REQUEST_CODE) {
        if (grantResults.isNotEmpty() && grantResults[0] == PERMISSION_GRANTED) {
            enableLocation()
        }
    }
}
```

## Jetpack Compose Best Practices

### State Management
```kotlin
@Composable
fun MapScreen(viewModel: MapViewModel = viewModel()) {
    val markers by viewModel.markers.collectAsState()
    val cameraState = rememberCameraState()

    LaunchedEffect(markers) {
        // Update camera when markers change
        if (markers.isNotEmpty()) {
            val bounds = markers.calculateBounds()
            cameraState.flyTo(bounds)
        }
    }

    MapboxMap(
        mapViewportState = cameraState
    ) {
        markers.forEach { marker ->
            PointAnnotation(point = marker.point)
        }
    }
}
```

### Lifecycle Awareness
```kotlin
@Composable
fun MapScreen() {
    val lifecycleOwner = LocalLifecycleOwner.current

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> {
                    // Map started
                }
                Lifecycle.Event.ON_STOP -> {
                    // Map stopped
                }
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)

        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    MapboxMap(...)
}
```

## Testing

### Unit Tests
```kotlin
@Test
fun testCameraPosition() {
    val mapView = MapView(context)
    val cameraOptions = CameraOptions.Builder()
        .center(Point.fromLngLat(-122.4194, 37.7749))
        .zoom(12.0)
        .build()

    mapView.mapboxMap.setCamera(cameraOptions)

    val cameraState = mapView.mapboxMap.cameraState
    assertEquals(-122.4194, cameraState.center.longitude(), 0.01)
    assertEquals(37.7749, cameraState.center.latitude(), 0.01)
}
```

## Quick Checklist

✅ Access token in AndroidManifest.xml
✅ Download token in gradle.properties
✅ Location permissions requested
✅ MapView lifecycle methods called
✅ Listeners removed on destroy
✅ View binding cleared
✅ Annotation managers reused
✅ Batch operations for multiple items
✅ Error handling implemented
✅ Memory leaks prevented
