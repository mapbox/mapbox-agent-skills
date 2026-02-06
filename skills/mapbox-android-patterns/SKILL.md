---
name: mapbox-android-patterns
description: Official integration patterns for Mapbox Maps SDK on Android. Covers installation, map initialization with Jetpack Compose/Views, styles, camera control, annotations, user interaction, and querying. Based on official Mapbox documentation.
---

# Mapbox Android Integration Patterns

Official patterns for integrating Mapbox Maps SDK v11 on Android with Kotlin, Jetpack Compose, and View system.

**Use this skill when:**
- Installing and configuring Mapbox Maps SDK for Android
- Creating maps with Jetpack Compose or View system
- Working with map styles, camera, annotations, or user interaction
- Querying map features or handling gestures

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

**With ornaments:**

```kotlin
MapboxMap(
    modifier = Modifier.fillMaxSize(),
    mapViewportState = cameraState,
    style = Style.STREETS,
    scaleBar = {
        ScaleBar(
            enabled = true,
            position = Alignment.BottomStart
        )
    },
    compass = {
        Compass(enabled = true)
    }
)
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

        mapView.mapboxMap.loadStyle(Style.STREETS)
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

## Map Styles

### Built-in Styles

```kotlin
// Compose
MapboxMap(
    style = Style.STREETS        // Mapbox Streets
    style = Style.OUTDOORS       // Mapbox Outdoors
    style = Style.LIGHT          // Mapbox Light
    style = Style.DARK           // Mapbox Dark
    style = Style.SATELLITE      // Satellite imagery
    style = Style.SATELLITE_STREETS // Satellite + streets
)

// Views
mapView.mapboxMap.loadStyle(Style.STREETS)
mapView.mapboxMap.loadStyle(Style.DARK)
```

### Custom Style URL

```kotlin
val customStyleUrl = "mapbox://styles/username/style-id"

// Compose
MapboxMap(style = customStyleUrl)

// Views
mapView.mapboxMap.loadStyle(customStyleUrl)
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
// Fly animation
mapView.camera.flyTo(
    CameraOptions.Builder()
        .center(destination)
        .zoom(15.0)
        .build(),
    MapAnimationOptions.Builder()
        .duration(2000)
        .build()
)

// Ease animation
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

### Fit to Coordinates

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

## Annotations

### Point Annotations

```kotlin
// Compose
MapboxMap(modifier = Modifier.fillMaxSize()) {
    PointAnnotation(
        point = Point.fromLngLat(-122.4194, 37.7749)
    ) {
        iconImage = "custom-marker"
    }
}

// Views
val pointAnnotationManager = mapView.annotations.createPointAnnotationManager()

val pointAnnotation = PointAnnotationOptions()
    .withPoint(Point.fromLngLat(-122.4194, 37.7749))
    .withIconImage("custom-marker")

pointAnnotationManager.create(pointAnnotation)
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

## User Interaction

### Handle Map Clicks

```kotlin
// Views
mapView.gestures.addOnMapClickListener { point ->
    Log.d("MapClick", "Tapped at: ${point.latitude()}, ${point.longitude()}")
    true // Consume event
}
```

### Query Features at Point

```kotlin
val screenCoordinate = ScreenCoordinate(x.toDouble(), y.toDouble())

mapView.mapboxMap.queryRenderedFeatures(
    RenderedQueryGeometry(screenCoordinate),
    RenderedQueryOptions(listOf("poi-layer"), null)
) { result ->
    result.onSuccess { features ->
        Log.d("Query", "Found ${features.size} features")
    }
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

## User Location

### Display User Location

**Add permissions to AndroidManifest.xml:**

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**Request permissions and show location:**

```kotlin
// Request permissions first (use ActivityResultContracts)

// Show location puck
mapView.location.updateSettings {
    enabled = true
    puckBearingEnabled = true
}
```

### Track User Location

```kotlin
mapView.location.addOnIndicatorPositionChangedListener { point ->
    // Update camera to follow user
    mapView.camera.easeTo(
        CameraOptions.Builder()
            .center(point)
            .zoom(14.0)
            .build()
    )
}
```

---

## Runtime Styling

### Add GeoJSON Source and Layer

```kotlin
// Create GeoJSON source
val geoJsonSource = geoJsonSource("route-source") {
    geometry(LineString.fromLngLats(routeCoordinates))
}
mapView.mapboxMap.style?.addSource(geoJsonSource)

// Create line layer
val lineLayer = lineLayer("route-layer", "route-source") {
    lineColor(Color.BLUE)
    lineWidth(4.0)
}
mapView.mapboxMap.style?.addLayer(lineLayer)
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

## Querying the Map

### Query Rendered Features

```kotlin
val screenPoint = ScreenCoordinate(100.0, 100.0)

mapView.mapboxMap.queryRenderedFeatures(
    RenderedQueryGeometry(screenPoint),
    RenderedQueryOptions(listOf("poi-layer"), null)
) { result ->
    result.onSuccess { features ->
        features.forEach { feature ->
            Log.d("Feature", "Properties: ${feature.properties()}")
        }
    }
}
```

### Query Source Features

```kotlin
mapView.mapboxMap.querySourceFeatures(
    "composite",
    SourceQueryOptions(
        sourceLayerIds = listOf("building"),
        filter = null
    )
) { result ->
    result.onSuccess { features ->
        Log.d("Query", "Found ${features.size} buildings")
    }
}
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

- Use `Style.STREETS` instead of `Style.SATELLITE_STREETS` when possible
- Limit visible annotations to viewport
- Reuse annotation managers
- Avoid frequent style reloads
- Call lifecycle methods (onStart, onStop, onDestroy)

---

## Additional Resources

- [Android Maps Guides](https://docs.mapbox.com/android/maps/guides/)
- [API Reference](https://docs.mapbox.com/android/maps/api/11.18.1/)
- [Jetpack Compose Guide](https://docs.mapbox.com/android/maps/guides/using-jetpack-compose/)
- [Example Apps](https://github.com/mapbox/mapbox-maps-android/tree/main/Examples)
- [Migration Guide (v10 → v11)](https://docs.mapbox.com/android/maps/guides/migrate-to-v11/)
