---
name: mapbox-android-patterns
description: Official integration patterns for Mapbox Maps SDK on Android. Covers installation, adding markers, user location, custom data, styles, camera control, and featureset interactions. Based on official Mapbox documentation.
---

# Mapbox Android Integration Patterns

Official patterns for integrating Mapbox Maps SDK v11 on Android with Kotlin, Jetpack Compose, and View system.

**Use this skill when:**

- Installing and configuring Mapbox Maps SDK for Android
- Adding markers and annotations to maps
- Showing user location and tracking with camera
- Adding custom data (GeoJSON) to maps
- Working with map styles, camera, or user interaction
- Handling feature interactions and taps

**Official Resources:**

- [Android Maps Guides](https://docs.mapbox.com/android/maps/guides/)
- [API Reference](https://docs.mapbox.com/android/maps/api-reference/)
- [Example Apps](https://github.com/mapbox/mapbox-maps-android/tree/main/Examples)

---

## Installation & Setup

### Requirements

- Android SDK 21+
- Kotlin or Java
- Android Studio
- Free Mapbox account

### Step 1: Configure Access Token

Create `app/res/values/mapbox_access_token.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
    <string name="mapbox_access_token" translatable="false"
        tools:ignore="UnusedResources">YOUR_MAPBOX_ACCESS_TOKEN</string>
</resources>
```

**Get your token:** Sign in at [mapbox.com](https://account.mapbox.com/access-tokens/)

### Step 2: Add Maven Repository

In `settings.gradle.kts`:

```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven {
            url = uri("https://api.mapbox.com/downloads/v2/releases/maven")
        }
    }
}
```

### Step 3: Add Dependency

In module `build.gradle.kts`:

```kotlin
android {
    defaultConfig {
        minSdk = 21
    }
}

dependencies {
    implementation("com.mapbox.maps:android:11.18.1")
}
```

**For Jetpack Compose:**

```kotlin
dependencies {
    implementation("com.mapbox.maps:android:11.18.1")
    implementation("com.mapbox.extension:maps-compose:11.18.1")
}
```

---

## Map Initialization

### Jetpack Compose Pattern

**Basic map:**

```kotlin
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import com.mapbox.maps.extension.compose.*
import com.mapbox.maps.Style
import com.mapbox.geojson.Point

@Composable
fun MapScreen() {
    MapboxMap(
        modifier = Modifier.fillMaxSize()
    ) {
        // Initialize camera via MapEffect (Style.STANDARD loads by default)
        MapEffect(Unit) { mapView ->
            // Set initial camera position
            mapView.mapboxMap.setCamera(
                CameraOptions.Builder()
                    .center(Point.fromLngLat(-122.4194, 37.7749))
                    .zoom(12.0)
                    .build()
            )
        }
    }
}
```

**With ornaments:**

```kotlin
MapboxMap(
    modifier = Modifier.fillMaxSize(),
    scaleBar = {
        ScaleBar(
            enabled = true,
            position = Alignment.BottomStart
        )
    },
    compass = {
        Compass(enabled = true)
    }
) {
    // Style.STANDARD loads by default
}
```

### View System Pattern

**Layout XML (activity_map.xml):**

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <com.mapbox.maps.MapView
        android:id="@+id/mapView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

**Activity:**

```kotlin
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.mapbox.maps.MapView
import com.mapbox.maps.Style
import com.mapbox.geojson.Point

class MapActivity : AppCompatActivity() {
    private lateinit var mapView: MapView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_map)

        mapView = findViewById(R.id.mapView)

        mapView.mapboxMap.setCamera(
            CameraOptions.Builder()
                .center(Point.fromLngLat(-122.4194, 37.7749))
                .zoom(12.0)
                .build()
        )

        mapView.mapboxMap.loadStyle(Style.STANDARD)
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

---

## Add Markers (Annotations)

### Point Annotations (Markers)

Point annotations are the most common way to mark locations on the map.

**Jetpack Compose:**

```kotlin
MapboxMap(modifier = Modifier.fillMaxSize()) {
    MapEffect(Unit) { mapView ->
        // Load style first
        mapView.mapboxMap.loadStyle(Style.STANDARD)

        // Create annotation manager and add markers
        val annotationManager = mapView.annotations.createPointAnnotationManager()
        val pointAnnotation = PointAnnotationOptions()
            .withPoint(Point.fromLngLat(-122.4194, 37.7749))
            .withIconImage("custom-marker")
        annotationManager.create(pointAnnotation)
    }
}

// Note: Compose doesn't have declarative PointAnnotation component
// Markers must be added imperatively via MapEffect
```

**View System:**

```kotlin
// Create annotation manager (once, reuse for updates)
val pointAnnotationManager = mapView.annotations.createPointAnnotationManager()

// Create marker
val pointAnnotation = PointAnnotationOptions()
    .withPoint(Point.fromLngLat(-122.4194, 37.7749))
    .withIconImage("custom-marker")

pointAnnotationManager.create(pointAnnotation)
```

**Multiple markers:**

```kotlin
val locations = listOf(
    Point.fromLngLat(-122.4194, 37.7749),
    Point.fromLngLat(-122.4094, 37.7849),
    Point.fromLngLat(-122.4294, 37.7649)
)

val annotations = locations.map { point ->
    PointAnnotationOptions()
        .withPoint(point)
        .withIconImage("marker")
}

pointAnnotationManager.create(annotations)
```

### Circle Annotations

```kotlin
val circleAnnotationManager = mapView.annotations.createCircleAnnotationManager()

val circle = CircleAnnotationOptions()
    .withPoint(Point.fromLngLat(-122.4194, 37.7749))
    .withCircleRadius(10.0)
    .withCircleColor("#FF0000")

circleAnnotationManager.create(circle)
```

### Polyline Annotations

```kotlin
val polylineAnnotationManager = mapView.annotations.createPolylineAnnotationManager()

val polyline = PolylineAnnotationOptions()
    .withPoints(listOf(point1, point2, point3))
    .withLineColor("#0000FF")
    .withLineWidth(4.0)

polylineAnnotationManager.create(polyline)
```

### Polygon Annotations

```kotlin
val polygonAnnotationManager = mapView.annotations.createPolygonAnnotationManager()

val points = listOf(listOf(coord1, coord2, coord3, coord1)) // Close the polygon

val polygon = PolygonAnnotationOptions()
    .withPoints(points)
    .withFillColor("#0000FF")
    .withFillOpacity(0.5)

polygonAnnotationManager.create(polygon)
```

---

## Show User Location

### Display User Location

**Step 1: Add permissions to AndroidManifest.xml:**

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**Step 2: Request permissions and show location:**

```kotlin
// Request permissions first (use ActivityResultContracts)

// Show location puck
mapView.location.updateSettings {
    enabled = true
    puckBearingEnabled = true
}
```

### Camera Follow User Location

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

### Get Current Location Once

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

---

## Add Custom Data (GeoJSON)

Add your own data to the map using GeoJSON sources and layers.

### Add Line (Route, Path)

```kotlin
// Create coordinates for the line
val routeCoordinates = listOf(
    Point.fromLngLat(-122.4194, 37.7749),
    Point.fromLngLat(-122.4094, 37.7849),
    Point.fromLngLat(-122.3994, 37.7949)
)

// Create GeoJSON source
val geoJsonSource = geoJsonSource("route-source") {
    geometry(LineString.fromLngLats(routeCoordinates))
}
mapView.mapboxMap.style?.addSource(geoJsonSource)

// Create line layer
val lineLayer = lineLayer("route-layer", "route-source") {
    lineColor(Color.BLUE)
    lineWidth(4.0)
    lineCap(LineCap.ROUND)
    lineJoin(LineJoin.ROUND)
}
mapView.mapboxMap.style?.addLayer(lineLayer)
```

### Add Polygon (Area)

```kotlin
val polygonCoordinates = listOf(
    listOf(coord1, coord2, coord3, coord1) // Close the polygon
)

val geoJsonSource = geoJsonSource("area-source") {
    geometry(Polygon.fromLngLats(polygonCoordinates))
}
mapView.mapboxMap.style?.addSource(geoJsonSource)

val fillLayer = fillLayer("area-fill", "area-source") {
    fillColor(Color.parseColor("#0000FF"))
    fillOpacity(0.3)
    fillOutlineColor(Color.parseColor("#0000FF"))
}
mapView.mapboxMap.style?.addLayer(fillLayer)
```

### Add Points from GeoJSON

```kotlin
val geojsonString = """
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [-122.4194, 37.7749]},
      "properties": {"name": "Location 1"}
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [-122.4094, 37.7849]},
      "properties": {"name": "Location 2"}
    }
  ]
}
"""

val geoJsonSource = geoJsonSource("points-source") {
    data(geojsonString)
}
mapView.mapboxMap.style?.addSource(geoJsonSource)

val symbolLayer = symbolLayer("points-layer", "points-source") {
    iconImage("marker")
    textField(Expression.get("name"))
    textOffset(listOf(0.0, 1.5))
}
mapView.mapboxMap.style?.addLayer(symbolLayer)
```

### Update Layer Properties

```kotlin
mapView.mapboxMap.style?.getLayerAs<LineLayer>("route-layer")?.let { layer ->
    layer.lineColor(Color.RED)
    layer.lineWidth(6.0)
}
```

### Remove Layers and Sources

```kotlin
mapView.mapboxMap.style?.removeStyleLayer("route-layer")
mapView.mapboxMap.style?.removeStyleSource("route-source")
```

---

## Camera Control

### Set Camera Position

```kotlin
// Compose - Update camera state
cameraState.position = CameraPosition(
    center = Point.fromLngLat(-74.0060, 40.7128),
    zoom = 14.0,
    bearing = 90.0,
    pitch = 60.0
)

// Views - Immediate
mapView.mapboxMap.setCamera(
    CameraOptions.Builder()
        .center(Point.fromLngLat(-74.0060, 40.7128))
        .zoom(14.0)
        .bearing(90.0)
        .pitch(60.0)
        .build()
)
```

### Animated Camera Transitions

```kotlin
// Fly animation (dramatic arc)
mapView.camera.flyTo(
    CameraOptions.Builder()
        .center(destination)
        .zoom(15.0)
        .build(),
    MapAnimationOptions.Builder()
        .duration(2000)
        .build()
)

// Ease animation (smooth)
mapView.camera.easeTo(
    CameraOptions.Builder()
        .center(destination)
        .zoom(15.0)
        .build(),
    MapAnimationOptions.Builder()
        .duration(1000)
        .build()
)
```

### Fit Camera to Coordinates

```kotlin
val coordinates = listOf(coord1, coord2, coord3)
val camera = mapView.mapboxMap.cameraForCoordinates(
    coordinates,
    EdgeInsets(50.0, 50.0, 50.0, 50.0),
    bearing = 0.0,
    pitch = 0.0
)
mapView.camera.easeTo(camera)
```

---

## Map Styles

### Built-in Styles

```kotlin
// Compose - load style via MapEffect
MapboxMap(modifier = Modifier.fillMaxSize()) {
    MapEffect(Unit) { mapView ->
        // Style.STANDARD loads by default, explicit loading only needed for other styles
        // mapView.mapboxMap.loadStyle(Style.STREETS)       // Mapbox Streets
        // mapView.mapboxMap.loadStyle(Style.OUTDOORS)      // Mapbox Outdoors
        // mapView.mapboxMap.loadStyle(Style.LIGHT)         // Mapbox Light
        // mapView.mapboxMap.loadStyle(Style.DARK)          // Mapbox Dark
        // mapView.mapboxMap.loadStyle(Style.STANDARD_SATELLITE)     // Satellite imagery
        // mapView.mapboxMap.loadStyle(Style.SATELLITE_STREETS) // Satellite + streets
    }
}

// Views
mapView.mapboxMap.loadStyle(Style.STANDARD)
mapView.mapboxMap.loadStyle(Style.DARK)
```

### Custom Style URL

```kotlin
val customStyleUrl = "mapbox://styles/username/style-id"

// Compose
MapboxMap(modifier = Modifier.fillMaxSize()) {
    MapEffect(Unit) { mapView ->
        mapView.mapboxMap.loadStyle(customStyleUrl)
    }
}

// Views
mapView.mapboxMap.loadStyle(customStyleUrl)
```

---

## User Interaction & Feature Taps

### Featureset Interactions (Recommended)

The modern Interactions API allows handling taps on map features with typed feature access. Works with Standard Style predefined featuresets like POIs, buildings, and place labels.

**View System Pattern:**

```kotlin
import com.mapbox.maps.interactions.ClickInteraction

class MapActivity : AppCompatActivity() {
    private lateinit var mapView: MapView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_map)

        mapView = findViewById(R.id.mapView)
        mapView.mapboxMap.loadStyle(Style.STANDARD)

        setupFeatureInteractions()
    }

    private fun setupFeatureInteractions() {
        // Tap on POI features
        mapView.mapboxMap.addInteraction(
            ClickInteraction.standardPoi { poi, context ->
                Log.d("MapTap", "Tapped POI: ${poi.name}")
                true // Stop propagation
            }
        )

        // Tap on buildings
        mapView.mapboxMap.addInteraction(
            ClickInteraction.standardBuildings { building, context ->
                Log.d("MapTap", "Tapped building")

                // Highlight the building
                mapView.mapboxMap.setFeatureState(
                    building,
                    StandardBuildingsState {
                        highlight(true)
                    }
                )
                true
            }
        )
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

**Jetpack Compose Pattern:**

````kotlin
@Composable
fun MapScreen() {
    MapboxMap(modifier = Modifier.fillMaxSize()) {
        MapEffect(Unit) { mapView ->
            // Load Standard style
            mapView.mapboxMap.loadStyle(Style.STANDARD)

            // Add featureset interactions using View system API
            mapView.mapboxMap.addInteraction(
                ClickInteraction.standardPoi { poi, context ->
                    Log.d("MapTap", "Tapped POI: ${poi.name}")
                    true
                }
            )

            mapView.mapboxMap.addInteraction(
                ClickInteraction.standardBuildings { building, context ->
                    Log.d("MapTap", "Tapped building")
                    mapView.mapboxMap.setFeatureState(
                        building,
                        state = mapOf("select" to true)
                    )
                    true
                }
            )
        }
    }
}

// Note: Featureset interactions in Compose use MapEffect to access
// the underlying MapView and use the View system interaction API

### Tap on Custom Layers

```kotlin
mapView.mapboxMap.addInteraction(
    ClickInteraction.layer("custom-layer-id") { feature, context ->
        Log.d("MapTap", "Feature properties: ${feature.properties()}")
        true
    }
)
````

### Long Press Interactions

```kotlin
import com.mapbox.maps.interactions.LongClickInteraction

mapView.mapboxMap.addInteraction(
    LongClickInteraction.standardPoi { poi, context ->
        Log.d("MapTap", "Long pressed POI: ${poi.name}")
        true
    }
)
```

### Handle Map Clicks (Empty Space)

```kotlin
mapView.gestures.addOnMapClickListener { point ->
    Log.d("MapClick", "Tapped at: ${point.latitude()}, ${point.longitude()}")
    true // Consume event
}
```

### Gesture Configuration

```kotlin
// Disable specific gestures
mapView.gestures.pitchEnabled = false
mapView.gestures.rotateEnabled = false

// Configure zoom limits
mapView.mapboxMap.setCamera(
    CameraOptions.Builder()
        .zoom(12.0)
        .build()
)
```

---

## Performance Best Practices

### Reuse Annotation Managers

```kotlin
// ❌ Don't create new managers repeatedly
fun updateMarkers() {
    val manager = mapView.annotations.createPointAnnotationManager()
    manager.create(markers)
}

// ✅ Create once, reuse
val pointAnnotationManager = mapView.annotations.createPointAnnotationManager()

fun updateMarkers() {
    pointAnnotationManager.deleteAll()
    pointAnnotationManager.create(markers)
}
```

### Batch Annotation Updates

```kotlin
// ✅ Create all at once
pointAnnotationManager.create(allAnnotations)

// ❌ Don't create one by one
allAnnotations.forEach { annotation ->
    pointAnnotationManager.create(annotation)
}
```

### Lifecycle Management

```kotlin
// Always call lifecycle methods
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
```

### Use Standard Style

```kotlin
// ✅ Standard style is optimized and recommended
Style.STANDARD

// Use other styles only when needed for specific use cases
Style.STANDARD_SATELLITE // Satellite imagery
```

---

## Troubleshooting

### Map Not Displaying

**Check:**

1. ✅ Token in `mapbox_access_token.xml`
2. ✅ Token is valid (test at mapbox.com)
3. ✅ Maven repository configured
4. ✅ Dependency added correctly
5. ✅ Internet permission in manifest

### Style Not Loading

```kotlin
mapView.mapboxMap.subscribeStyleLoaded { _ ->
    Log.d("Map", "Style loaded successfully")
    // Add layers and sources here
}
```

### Performance Issues

- Use `Style.STANDARD` (recommended and optimized)
- Limit visible annotations to viewport
- Reuse annotation managers
- Avoid frequent style reloads
- Call lifecycle methods (onStart, onStop, onDestroy)
- Batch annotation updates

---

## Additional Resources

- [Android Maps Guides](https://docs.mapbox.com/android/maps/guides/)
- [API Reference](https://docs.mapbox.com/android/maps/api/11.18.1/)
- [Interactions Guide](https://docs.mapbox.com/android/maps/guides/user-interaction/interactions/)
- [Jetpack Compose Guide](https://docs.mapbox.com/android/maps/guides/using-jetpack-compose/)
- [Example Apps](https://github.com/mapbox/mapbox-maps-android/tree/main/Examples)
- [Migration Guide (v10 → v11)](https://docs.mapbox.com/android/maps/guides/migrate-to-v11/)
