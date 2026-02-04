# Conversation Example: Android Jetpack Compose Setup

This conversation demonstrates how the **mapbox-android-patterns** skill helps integrate Mapbox Maps SDK into a Jetpack Compose app with proper lifecycle handling.

## Skills Used

- 📱 **mapbox-android-patterns** - Provides Jetpack Compose AndroidView pattern and lifecycle management
- 🔐 **mapbox-token-security** - Guides secure token storage in Android apps

---

## Conversation

### User

> How do I add a Mapbox map to my Jetpack Compose screen with proper lifecycle handling?

### AI Assistant

I'll help you integrate Mapbox Maps SDK into your Jetpack Compose app using the correct patterns from the **mapbox-android-patterns** skill.

### Step 1: Add Mapbox SDK Dependency

**Add to your module-level `build.gradle.kts`:**

```kotlin
dependencies {
    implementation("com.mapbox.maps:android:11.1.0")

    // Compose
    implementation("androidx.compose.ui:ui:1.6.0")
    implementation("androidx.activity:activity-compose:1.8.2")
}
```

**Add to `settings.gradle.kts`:**

```kotlin
dependencyResolutionManagement {
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
}
```

### Step 2: Configure Access Token (Secure Pattern)

**Following mapbox-token-security skill**, store your token securely:

**Create `local.properties` (add to `.gitignore`):**

```properties
MAPBOX_ACCESS_TOKEN=pk.your_actual_token_here
MAPBOX_DOWNLOADS_TOKEN=sk.your_secret_token_here
```

**Update `build.gradle.kts` to read token:**

```kotlin
android {
    defaultConfig {
        // Read from local.properties
        val properties = Properties()
        properties.load(project.rootProject.file("local.properties").inputStream())

        // Make available in BuildConfig
        buildConfigField(
            "String",
            "MAPBOX_ACCESS_TOKEN",
            "\"${properties.getProperty("MAPBOX_ACCESS_TOKEN", "")}\""
        )

        // Make available in resources
        resValue(
            "string",
            "mapbox_access_token",
            properties.getProperty("MAPBOX_ACCESS_TOKEN", "")
        )
    }

    buildFeatures {
        buildConfig = true
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}
```

### Step 3: Create Lifecycle-Aware Composable

**Following the AndroidView pattern from mapbox-android-patterns:**

```kotlin
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.MapView
import com.mapbox.maps.Style

@Composable
fun MapboxMap(
    modifier: Modifier = Modifier,
    center: Point = Point.fromLngLat(-122.4194, 37.7749),
    zoom: Double = 12.0,
    onMapReady: (MapView) -> Unit = {}
) {
    // Create and remember MapView with lifecycle awareness
    val mapView = rememberMapViewWithLifecycle()

    // AndroidView bridges traditional Android Views into Compose
    AndroidView(
        modifier = modifier,
        factory = { mapView },
        update = { view ->
            // Update map when state changes
            view.mapboxMap.setCamera(
                CameraOptions.Builder()
                    .center(center)
                    .zoom(zoom)
                    .build()
            )
        }
    )

    // Load style and notify when ready
    LaunchedEffect(mapView) {
        mapView.mapboxMap.loadStyle(Style.MAPBOX_STREETS) {
            onMapReady(mapView)
        }
    }
}

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

    // CRITICAL: Lifecycle management to prevent memory leaks
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

        onDispose {
            lifecycle.removeObserver(observer)
            mapView.onDestroy()
        }
    }

    return mapView
}
```

### Step 4: Use in Your Compose Screen

```kotlin
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import com.mapbox.geojson.Point

@Composable
fun MapScreen() {
    var center by remember {
        mutableStateOf(Point.fromLngLat(-122.4194, 37.7749))
    }
    var zoom by remember { mutableDoubleStateOf(12.0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("San Francisco") }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            MapboxMap(
                modifier = Modifier.fillMaxSize(),
                center = center,
                zoom = zoom,
                onMapReady = { mapView ->
                    // Map is ready, add markers, etc.
                }
            )

            // Optional: Floating action button
            FloatingActionButton(
                onClick = {
                    // Update center - map will automatically update
                    center = Point.fromLngLat(-122.4, 37.77)
                },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp)
            ) {
                Icon(Icons.Default.Place, "Center Map")
            }
        }
    }
}
```

### Step 5: Update AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Required permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

    <application>
        <!-- ... -->
    </application>
</manifest>
```

### Key Points from mapbox-android-patterns

✅ **Proper Lifecycle Management:**

- `rememberMapViewWithLifecycle()` handles ON_START, ON_STOP, ON_DESTROY
- `DisposableEffect` ensures cleanup when composable leaves composition
- Prevents memory leaks and crashes

✅ **Token Security:**

- Token stored in `local.properties` (not in source code)
- `local.properties` added to `.gitignore`
- Token accessed via `BuildConfig` at runtime

✅ **Compose Integration:**

- `AndroidView` bridges traditional Views into Compose
- `remember` prevents MapView recreation on recomposition
- State changes trigger `update` block, not recreation

✅ **Memory Safety:**

- Explicit cleanup in `DisposableEffect.onDispose`
- Lifecycle observer properly removed
- No memory leaks

### Optional: Adding Markers

```kotlin
@Composable
fun MapboxMap(
    // ... other parameters
    markers: List<MarkerData> = emptyList()
) {
    val mapView = rememberMapViewWithLifecycle()

    AndroidView(
        modifier = modifier,
        factory = { mapView },
        update = { view ->
            // Update camera
            view.mapboxMap.setCamera(
                CameraOptions.Builder()
                    .center(center)
                    .zoom(zoom)
                    .build()
            )
        }
    )

    // Add markers when map is ready
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

    return mapView
}
```

### Testing Lifecycle

To verify proper lifecycle handling:

1. **Rotate device** - Map should survive configuration changes
2. **Navigate away** - Check LogCat for proper onStop/onDestroy calls
3. **Use Android Studio Profiler** - Verify no memory leaks
4. **Background app** - Map should pause properly

### Common Pitfalls Avoided

❌ **Not calling onDestroy** - Memory leaks and crashes
❌ **Recreating MapView on recomposition** - Performance issues
❌ **Not handling lifecycle events** - App crashes when backgrounded
❌ **Hardcoding token** - Security vulnerability

### Next Steps

Based on your needs:

- **Add clustering** - Use mapbox-web-performance-patterns guidance (applies to Android too)
- **Offline maps** - See offline patterns in mapbox-android-patterns skill
- **Navigation** - Navigation SDK integration patterns
- **Custom styles** - Use mapbox-cartography and mapbox-style-patterns skills

Does this cover what you need?

---

## Skills Application Analysis

### How the skill helped:

1. **Provided correct Compose pattern** - AndroidView with rememberMapViewWithLifecycle
2. **Lifecycle management** - Complete lifecycle event handling (START, STOP, DESTROY)
3. **Security guidance** - Secure token storage using local.properties and BuildConfig
4. **Memory safety** - Proper cleanup in DisposableEffect to prevent leaks
5. **Compose idioms** - Correct use of remember, DisposableEffect, LaunchedEffect

### Without the skill:

An AI assistant without the skill might:

- Forget lifecycle callbacks (causes crashes)
- Not use DisposableEffect for cleanup (memory leaks)
- Hardcode token in source (security risk)
- Recreate MapView on every recomposition (performance issues)
- Not handle configuration changes properly

### Common mistakes avoided:

❌ Missing `mapView.onDestroy()` in cleanup
❌ Not using `remember` - MapView recreated on every recomposition
❌ Forgetting `LifecycleEventObserver` - crashes when app goes to background
❌ Hardcoding token: `ResourceOptionsManager.getDefault(context).update { ... }`

### Result:

The skill-enhanced AI provided a complete, secure, lifecycle-aware Compose implementation following Android best practices and Mapbox's recommended patterns.
