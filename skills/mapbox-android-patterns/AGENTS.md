# Mapbox Android Quick Reference

Fast reference for Mapbox Maps SDK v11 on Android with Kotlin, Jetpack Compose, and View system.

## Setup

### Installation (Gradle)

```kotlin
// settings.gradle.kts
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven {
            url = uri("https://api.mapbox.com/downloads/v2/releases/maven")
        }
    }
}

// build.gradle.kts
dependencies {
    implementation("com.mapbox.maps:android:11.18.1")
    implementation("com.mapbox.extension:maps-compose:11.18.1") // For Compose
}
```

### Access Token

```xml
<!-- app/res/values/mapbox_access_token.xml -->
<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
    <string name="mapbox_access_token" translatable="false"
        tools:ignore="UnusedResources">YOUR_MAPBOX_ACCESS_TOKEN</string>
</resources>
```

## Jetpack Compose

### Basic Map

```kotlin
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import com.mapbox.maps.extension.compose.*
import com.mapbox.maps.Style
import com.mapbox.geojson.Point

@Composable
fun MapScreen() {
    MapboxMap(modifier = Modifier.fillMaxSize()) {
        MapEffect(Unit) { mapView ->
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

### With Annotation

```kotlin
MapboxMap(modifier = Modifier.fillMaxSize()) {
    MapEffect(Unit) { mapView ->
        val annotationManager = mapView.annotations.createPointAnnotationManager()
        val pointAnnotation = PointAnnotationOptions()
            .withPoint(Point.fromLngLat(-122.4194, 37.7749))
            .withIconImage("marker")
        annotationManager.create(pointAnnotation)
    }
}
```

### Compose Annotations Pattern

```kotlin
// ❌ Declarative annotation components are not supported
// Use MapEffect with annotation managers instead (see above)
MapboxMap(modifier = Modifier.fillMaxSize()) {
    // This doesn't work:
    PointAnnotation(
        point = Point.fromLngLat(-122.4194, 37.7749)
    ) {
        iconImage = "custom-marker"
    }
}
```

## View System

### Basic Map

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

## Common Patterns

### 1. Add Markers

```kotlin
val manager = mapView.annotations.createPointAnnotationManager()

val annotation = PointAnnotationOptions()
    .withPoint(Point.fromLngLat(-122.4194, 37.7749))
    .withIconImage("custom-marker")

manager.create(annotation)
```

### 2. User Location with Camera Follow

```kotlin
// Request permission (add to AndroidManifest.xml)
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

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

// Optional: Follow bearing (direction)
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
```

### 3. Add Custom Data (GeoJSON)

```kotlin
val geoJsonSource = geoJsonSource("route-source") {
    geometry(LineString.fromLngLats(coordinates))
}
mapView.mapboxMap.style?.addSource(geoJsonSource)

val lineLayer = lineLayer("route-layer", "route-source") {
    lineColor(Color.BLUE)
    lineWidth(4.0)
}
mapView.mapboxMap.style?.addLayer(lineLayer)
```

### 4. Camera Control

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

### 5. Featureset Interactions

```kotlin
import com.mapbox.maps.interactions.ClickInteraction

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
```

### 6. Map Tap Handling

```kotlin
mapView.gestures.addOnMapClickListener { point ->
    Log.d("MapClick", "Tapped at: ${point.latitude()}, ${point.longitude()}")
    true // Consume event
}
```

### 7. Styles

```kotlin
// Compose
MapboxMap(style = Style.STANDARD)  // Recommended
MapboxMap(style = Style.DARK)
MapboxMap(style = Style.STANDARD_SATELLITE)

// Views
mapView.mapboxMap.loadStyle(Style.STANDARD)
mapView.mapboxMap.loadStyle(Style.DARK)
```

## Performance Tips

### Reuse Managers

```kotlin
// ✅ Create once
val annotationManager = mapView.annotations.createPointAnnotationManager()

// ✅ Update many times
fun updateMarkers() {
    annotationManager.deleteAll()
    annotationManager.create(newMarkers)
}
```

### Batch Updates

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
// ✅ Recommended
Style.STANDARD

// Use others only when needed
Style.STANDARD_SATELLITE
```

## Quick Checklist

✅ Token in `mapbox_access_token.xml`
✅ Maven repository configured
✅ MapboxMaps dependency added
✅ Location permissions if needed
✅ Use Style.STANDARD (recommended)
✅ Lifecycle methods called
✅ Annotation managers reused

## Resources

- [Android Maps Guides](https://docs.mapbox.com/android/maps/guides/)
- [API Reference](https://docs.mapbox.com/android/maps/api-reference/)
- [Interactions Guide](https://docs.mapbox.com/android/maps/guides/user-interaction/interactions/)
- [Jetpack Compose Guide](https://docs.mapbox.com/android/maps/guides/using-jetpack-compose/)
- [Examples](https://github.com/mapbox/mapbox-maps-android/tree/main/Examples)
