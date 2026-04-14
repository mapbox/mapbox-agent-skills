# Jetpack Compose Integration

Compose-specific patterns for Mapbox Maps SDK v11.

## Dependencies

```kotlin
dependencies {
    implementation("com.mapbox.maps:android:11.18.1")
    implementation("com.mapbox.extension:maps-compose:11.18.1")
}
```

Check [releases](https://github.com/mapbox/mapbox-maps-android/releases) for the latest version. Both artifacts must use the same version.

The Compose extension group is `com.mapbox.extension`, NOT `com.mapbox.maps`.
These do NOT exist: `com.mapbox.maps:compose`, `com.mapbox.maps:extension-compose`, `com.mapbox.maps:android-compose`, `com.mapbox.maps:maps-compose`.

## Access Token

Create `app/src/main/res/values/mapbox_access_token.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
    <string name="mapbox_access_token" translatable="false"
        tools:ignore="UnusedResources">YOUR_MAPBOX_ACCESS_TOKEN</string>
</resources>
```

The SDK reads this resource automatically. This is the recommended approach.

To set the token programmatically, import from `com.mapbox.common` (NOT `com.mapbox.maps`):

```kotlin
import com.mapbox.common.MapboxOptions
MapboxOptions.accessToken = "pk.your_token"
```

Do NOT use manifest `<meta-data>` placeholders — the SDK does not read tokens from `${MAPBOX_ACCESS_TOKEN}` in AndroidManifest.xml.

## MapboxMap Composable

```kotlin
import com.mapbox.maps.extension.compose.MapboxMap
import com.mapbox.maps.extension.compose.animation.viewport.rememberMapViewportState
import com.mapbox.geojson.Point

@Composable
fun MapScreen() {
    MapboxMap(
        modifier = Modifier.fillMaxSize(),
        mapViewportState = rememberMapViewportState {
            setCameraOptions {
                center(Point.fromLngLat(-122.4194, 37.7749))
                zoom(12.0)
            }
        }
    )
}
```

`rememberMapViewportState` is in `com.mapbox.maps.extension.compose.animation.viewport`, not the root compose package.

## Point Annotations

```kotlin
import com.mapbox.maps.extension.compose.annotation.generated.PointAnnotation
import com.mapbox.maps.extension.compose.annotation.rememberIconImage

@Composable
fun MapWithMarkers() {
    val markerIcon = rememberIconImage(R.drawable.ic_marker)

    MapboxMap(modifier = Modifier.fillMaxSize(), mapViewportState = ...) {
        PointAnnotation(point = Point.fromLngLat(lng, lat)) {
            iconImage = markerIcon
            interactionsState.onClicked { /* handle tap */ true }
        }
    }
}
```

- `PointAnnotation` renders nothing without `iconImage` — always set it
- Use `rememberIconImage(R.drawable.ic_marker)` for drawable resources
- Use `interactionsState.onClicked { ... }` for tap handling (the `onClick` parameter is deprecated)
- Annotation IDs are `Long`, not `String`

## Loading GeoJSON from Assets

```kotlin
import com.mapbox.geojson.FeatureCollection
import com.mapbox.geojson.Point

val json = context.assets.open("data.geojson").bufferedReader().use { it.readText() }
val features = FeatureCollection.fromJson(json).features() ?: emptyList()
features.forEach { feature ->
    val point = feature.geometry() as Point
    val name = feature.getStringProperty("name")
}
```

## MapEffect

Use `MapEffect` for imperative style and layer operations (prefer `PointAnnotation` composable for markers):

```kotlin
import com.mapbox.maps.extension.compose.MapEffect

MapboxMap(...) {
    MapEffect(Unit) { mapView ->
        // Style operations, custom layers, etc.
    }
}
```

Import is `com.mapbox.maps.extension.compose.MapEffect`, not `LaunchedEffect` from Compose runtime.
