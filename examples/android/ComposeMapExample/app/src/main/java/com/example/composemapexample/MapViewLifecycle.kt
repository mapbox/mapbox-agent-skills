/**
 * MapViewLifecycle - Lifecycle-aware MapView management
 *
 * CRITICAL for preventing memory leaks and crashes.
 *
 * From mapbox-android-patterns:
 * ✅ remember prevents MapView recreation on recomposition
 * ✅ DisposableEffect handles lifecycle events
 * ✅ Proper cleanup in onDispose
 * ✅ Lifecycle observer removed on cleanup
 */

package com.example.composemapexample

import android.view.View
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.mapbox.maps.MapView

/**
 * Creates and remembers a lifecycle-aware MapView
 *
 * This composable:
 * 1. Creates MapView once (via remember)
 * 2. Observes lifecycle events (START, STOP, DESTROY)
 * 3. Calls appropriate MapView methods
 * 4. Cleans up when leaving composition
 *
 * IMPORTANT: Without this, your app will:
 * - Leak memory
 * - Crash when backgrounded
 * - Not pause rendering properly
 */
@Composable
fun rememberMapViewWithLifecycle(): MapView {
    val context = LocalContext.current
    val lifecycle = LocalLifecycleOwner.current.lifecycle

    // Remember MapView across recompositions
    // CRITICAL: Without remember, MapView would be recreated every recomposition
    val mapView = remember {
        MapView(context).apply {
            // Generate unique ID for view hierarchy
            id = View.generateViewId()
        }
    }

    // CRITICAL: Lifecycle observer prevents crashes and memory leaks
    DisposableEffect(lifecycle, mapView) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                // Activity/Fragment started - resume rendering
                Lifecycle.Event.ON_START -> {
                    mapView.onStart()
                }
                // Activity/Fragment stopped - pause rendering
                Lifecycle.Event.ON_STOP -> {
                    mapView.onStop()
                }
                // Activity/Fragment destroyed - release resources
                Lifecycle.Event.ON_DESTROY -> {
                    mapView.onDestroy()
                }
                else -> {
                    // Other events (CREATE, RESUME, PAUSE) don't need handling
                }
            }
        }

        // Register observer
        lifecycle.addObserver(observer)

        // CRITICAL: Cleanup when composable leaves composition
        onDispose {
            // Remove observer to prevent memory leaks
            lifecycle.removeObserver(observer)

            // Destroy map to release resources
            mapView.onDestroy()
        }
    }

    return mapView
}
