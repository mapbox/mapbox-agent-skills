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

## Add Markers (Point Annotations)

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

---

## Show User Location (Display)

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

---

## Performance Best Practices

### Reuse Annotation Managers

```kotlin
// Don't create new managers repeatedly
// val manager = mapView.annotations.createPointAnnotationManager() // each call

// Create once, reuse
val pointAnnotationManager = mapView.annotations.createPointAnnotationManager()

fun updateMarkers() {
    pointAnnotationManager.deleteAll()
    pointAnnotationManager.create(markers)
}
```

### Batch Annotation Updates

```kotlin
// Create all at once
pointAnnotationManager.create(allAnnotations)

// Don't create one by one in a loop
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
// Standard style is optimized and recommended
Style.STANDARD

// Use other styles only when needed for specific use cases
Style.STANDARD_SATELLITE // Satellite imagery
```

---

## Troubleshooting

### Map Not Displaying

**Check:**

1. Token in `mapbox_access_token.xml`
2. Token is valid (test at mapbox.com)
3. Maven repository configured
4. Dependency added correctly
5. Internet permission in manifest

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

## Reference Files

Load these references when you need detailed patterns for specific topics:

- **`references/annotations.md`** -- Circle, Polyline, and Polygon annotation patterns
- **`references/location-tracking.md`** -- Camera follow user location + get current location once
- **`references/custom-data.md`** -- GeoJSON sources and layers: lines, polygons, points, update/remove
- **`references/camera-styles.md`** -- Camera control (set, animate, fit) + map styles (built-in and custom)
- **`references/interactions.md`** -- Featureset interactions, custom layer taps, long press, gestures

---

## Additional Resources

- [Android Maps Guides](https://docs.mapbox.com/android/maps/guides/)
- [API Reference](https://docs.mapbox.com/android/maps/api/11.18.1/)
- [Interactions Guide](https://docs.mapbox.com/android/maps/guides/user-interaction/interactions/)
- [Jetpack Compose Guide](https://docs.mapbox.com/android/maps/guides/using-jetpack-compose/)
- [Example Apps](https://github.com/mapbox/mapbox-maps-android/tree/main/Examples)
- [Migration Guide (v10 -> v11)](https://docs.mapbox.com/android/maps/guides/migrate-to-v11/)
