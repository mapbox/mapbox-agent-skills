# Jetpack Compose Map Example

An Android application demonstrating proper Mapbox Maps SDK integration in Jetpack Compose following the **mapbox-android-patterns** skill.

## Patterns Demonstrated

✅ **AndroidView pattern** - Proper Compose integration
✅ **Lifecycle awareness** - Handles START, STOP, DESTROY
✅ **Token security** - Using local.properties and BuildConfig
✅ **Memory safety** - DisposableEffect cleanup
✅ **State management** - Reactive camera updates

## What This Example Shows

This example demonstrates the **fundamental pattern** for integrating Mapbox Maps SDK in Jetpack Compose:

- `AndroidView` for bridging traditional Views → Compose
- `rememberMapViewWithLifecycle()` for lifecycle-aware maps
- `DisposableEffect` for proper cleanup
- Token management with `local.properties` and `BuildConfig`

## Prerequisites

- Android Studio Hedgehog (2023.1.1) or later
- Minimum SDK: 21 (Android 5.0)
- Target SDK: 34 (Android 14)
- A Mapbox access token ([get one free](https://account.mapbox.com/access-tokens/))

## Setup

### 1. Clone and Open Project

```bash
# Open in Android Studio
File → Open → select ComposeMapExample directory
```

### 2. Configure Access Token (Secure Pattern)

Following **mapbox-token-security** skill:

**Create `local.properties` (add to `.gitignore`):**

```properties
MAPBOX_ACCESS_TOKEN=pk.your_actual_token_here
MAPBOX_DOWNLOADS_TOKEN=sk.your_secret_downloads_token_here
```

The build system will automatically inject these tokens into `BuildConfig`.

### 3. Sync and Run

1. Click "Sync Now" when prompted
2. Select your device or emulator
3. Click Run ▶️

## Project Structure

```
ComposeMapExample/
├── app/
│   ├── src/main/
│   │   ├── java/com/example/composemapexample/
│   │   │   ├── MainActivity.kt           # Entry point
│   │   │   ├── MapScreen.kt              # Main screen with map
│   │   │   ├── MapboxMap.kt              # Reusable map component
│   │   │   └── MapViewLifecycle.kt       # Lifecycle helper
│   │   ├── AndroidManifest.xml
│   │   └── res/
│   └── build.gradle.kts                  # Token configuration
├── gradle/
├── local.properties                      # Tokens (gitignored)
└── README.md
```

## Key Implementation Details

### MapboxMap.kt - AndroidView Pattern

This is the core pattern from **mapbox-android-patterns**:

```kotlin
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.MapView
import com.mapbox.maps.Style

@Composable
fun MapboxMap(
    modifier: Modifier = Modifier,
    center: Point,
    zoom: Double,
    onMapReady: (MapView) -> Unit = {}
) {
    // Create lifecycle-aware MapView
    val mapView = rememberMapViewWithLifecycle()

    // Bridge traditional View into Compose
    AndroidView(
        modifier = modifier,
        factory = { mapView },
        update = { view ->
            // Update camera when state changes
            view.mapboxMap.setCamera(
                CameraOptions.Builder()
                    .center(center)
                    .zoom(zoom)
                    .build()
            )
        }
    )

    // Load style when map is ready
    LaunchedEffect(mapView) {
        mapView.mapboxMap.loadStyle(Style.MAPBOX_STREETS) {
            onMapReady(mapView)
        }
    }
}
```

### MapViewLifecycle.kt - Lifecycle Management

**CRITICAL for preventing memory leaks and crashes:**

```kotlin
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.mapbox.maps.MapView

@Composable
fun rememberMapViewWithLifecycle(): MapView {
    val context = LocalContext.current
    val lifecycle = LocalLifecycleOwner.current.lifecycle

    // Remember MapView across recompositions
    val mapView = remember {
        MapView(context).apply {
            id = View.generateViewId()
        }
    }

    // CRITICAL: Lifecycle observer prevents crashes
    DisposableEffect(lifecycle, mapView) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> mapView.onStart()
                Lifecycle.Event.ON_STOP -> mapView.onStop()
                Lifecycle.Event.ON_DESTROY -> mapView.onDestroy()
                else -> {}
            }
        }

        lifecycle.addObserver(observer)

        // Cleanup when leaving composition
        onDispose {
            lifecycle.removeObserver(observer)
            mapView.onDestroy()
        }
    }

    return mapView
}
```

### build.gradle.kts - Token Configuration

```kotlin
android {
    defaultConfig {
        // Read tokens from local.properties
        val properties = Properties()
        properties.load(project.rootProject.file("local.properties").inputStream())

        // Make available in BuildConfig
        buildConfigField(
            "String",
            "MAPBOX_ACCESS_TOKEN",
            "\\"${properties.getProperty("MAPBOX_ACCESS_TOKEN", "")}\\"  "
        )

        // Make available in AndroidManifest.xml
        manifestPlaceholders["MAPBOX_ACCESS_TOKEN"] =
            properties.getProperty("MAPBOX_ACCESS_TOKEN", "")
    }

    buildFeatures {
        buildConfig = true
        compose = true
    }
}
```

## Key Points from mapbox-android-patterns

✅ **Lifecycle Management:**

- `rememberMapViewWithLifecycle()` handles ON_START, ON_STOP, ON_DESTROY
- `DisposableEffect` ensures cleanup when composable leaves composition
- Prevents memory leaks and crashes

✅ **Token Security:**

- Token stored in `local.properties` (not in code)
- `local.properties` in `.gitignore`
- Accessed via `BuildConfig` at runtime

✅ **Compose Integration:**

- `AndroidView` bridges traditional Views into Compose
- `remember` prevents MapView recreation on recomposition
- State changes trigger `update` block, not recreation

✅ **Memory Safety:**

- Explicit cleanup in `DisposableEffect.onDispose`
- Lifecycle observer properly removed
- No memory leaks

## Common Modifications

### Adding Markers

```kotlin
LaunchedEffect(mapView, markers) {
    mapView.mapboxMap.loadStyle(Style.MAPBOX_STREETS) {
        val annotationApi = mapView.annotations
        val pointAnnotationManager = annotationApi.createPointAnnotationManager()

        val pointAnnotations = markers.map { marker ->
            PointAnnotationOptions()
                .withPoint(marker.point)
                .withIconImage(marker.iconId)
                .withTextField(marker.title)
        }

        pointAnnotationManager.create(pointAnnotations)
    }
}
```

### Handling Click Events

```kotlin
LaunchedEffect(mapView) {
    mapView.mapboxMap.loadStyle(Style.MAPBOX_STREETS) {
        mapView.mapboxMap.addOnMapClickListener { point ->
            // Handle map click
            onMapClick(point)
            true
        }
    }
}
```

### Custom Style

```kotlin
mapView.mapboxMap.loadStyle(Style.DARK) {
    // Style loaded
}
```

## Testing Lifecycle

To verify proper lifecycle handling:

1. **Rotate device** - Map should survive configuration changes
2. **Navigate away** - Check Logcat for onStop/onDestroy calls
3. **LeakCanary** - Add LeakCanary to detect memory leaks
4. **Android Profiler** - Verify memory usage is stable

## Skills Reference

This example follows patterns from:

- **mapbox-android-patterns** - Compose integration patterns
- **mapbox-token-security** - Secure token storage

## Next Steps

Once you have this basic pattern working:

- Add **offline maps** - Download regions for offline use
- Add **navigation** - Integrate Navigation SDK
- Custom **styling** - Use mapbox-cartography patterns
- **Performance** - Battery optimization patterns

See **mapbox-android-patterns** skill for implementation details.

## Common Pitfalls Avoided

This example avoids common mistakes:

❌ **Not calling onDestroy** - Memory leaks
❌ **Recreating MapView on recomposition** - Performance issues
❌ **Not handling lifecycle events** - Crashes when backgrounded
❌ **Hardcoding token** - Security vulnerability
❌ **Missing DisposableEffect** - Resource leaks

## Troubleshooting

**Map not showing?**

- Verify `MAPBOX_ACCESS_TOKEN` is set in `local.properties`
- Check `BuildConfig.MAPBOX_ACCESS_TOKEN` is not empty
- Verify token has required scopes
- Check Logcat for errors

**Token not found?**

- Ensure `local.properties` exists in project root
- Run "Sync Project with Gradle Files"
- Clean and rebuild project

**Crashes on background?**

- Verify `rememberMapViewWithLifecycle()` is used
- Check lifecycle callbacks in Logcat
- Ensure `DisposableEffect` cleanup is present

**Memory leaks?**

- Add LeakCanary: `debugImplementation("com.squareup.leakcanary:leakcanary-android:2.12")`
- Verify `mapView.onDestroy()` is called
- Check for missing lifecycle observer removal

**Build errors?**

- Update to Android Studio Hedgehog or later
- Verify Gradle plugin version is 8.2.0+
- Invalidate caches and restart: File → Invalidate Caches → Invalidate and Restart
