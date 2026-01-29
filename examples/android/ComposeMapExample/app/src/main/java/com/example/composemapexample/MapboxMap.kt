/**
 * MapboxMap - Mapbox Maps SDK integration in Jetpack Compose
 *
 * This demonstrates the AndroidView pattern from mapbox-android-patterns:
 * ✅ AndroidView bridges traditional Views → Compose
 * ✅ rememberMapViewWithLifecycle() for lifecycle management
 * ✅ State changes trigger update, not recreation
 * ✅ LaunchedEffect for async style loading
 * ✅ Proper cleanup via DisposableEffect
 */

package com.example.composemapexample

import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.MapView
import com.mapbox.maps.Style

/**
 * Composable that displays a Mapbox map
 *
 * @param modifier Modifier for styling
 * @param center Camera center point
 * @param zoom Camera zoom level
 * @param onMapReady Callback when map is ready
 */
@Composable
fun MapboxMap(
    modifier: Modifier = Modifier,
    center: Point = Point.fromLngLat(-122.4194, 37.7749),
    zoom: Double = 12.0,
    onMapReady: (MapView) -> Unit = {}
) {
    // Create and remember lifecycle-aware MapView
    // CRITICAL: This prevents recreation on recomposition
    val mapView = rememberMapViewWithLifecycle()

    // AndroidView bridges traditional Android Views into Compose
    AndroidView(
        modifier = modifier,
        factory = {
            // This runs ONCE when entering composition
            mapView
        },
        update = { view ->
            // This runs when state changes (center, zoom)
            // IMPORTANT: Don't recreate MapView here!
            view.mapboxMap.setCamera(
                CameraOptions.Builder()
                    .center(center)
                    .zoom(zoom)
                    .build()
            )
        }
    )

    // Load style asynchronously when map is ready
    // LaunchedEffect ensures this only runs once per mapView
    LaunchedEffect(mapView) {
        mapView.mapboxMap.loadStyle(Style.MAPBOX_STREETS) {
            // Style loaded successfully
            onMapReady(mapView)
        }
    }
}
