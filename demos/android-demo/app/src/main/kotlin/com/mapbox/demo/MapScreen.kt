package com.mapbox.demo

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.Style
import com.mapbox.maps.extension.compose.*
import com.mapbox.maps.plugin.animation.MapAnimationOptions
import com.mapbox.maps.plugin.animation.camera
import com.mapbox.maps.plugin.locationcomponent.location

@Composable
fun MapScreen() {
    val context = LocalContext.current
    var selectedFeature by remember { mutableStateOf("") }
    var followLocation by remember { mutableStateOf(false) }
    var resetTrigger by remember { mutableIntStateOf(0) }
    var hasLocationPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    // Request location permissions
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        hasLocationPermission = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true
    }

    LaunchedEffect(Unit) {
        if (!hasLocationPermission) {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Demonstrate: Map with Standard style (recommended)
        MapboxMap(
            modifier = Modifier.fillMaxSize()
        ) {
            // Initialize camera position and setup features
            MapEffect(Unit) { mapView ->
                // Load Standard style
                mapView.mapboxMap.loadStyle(Style.STANDARD)

                // Set initial camera
                mapView.mapboxMap.setCamera(
                    CameraOptions.Builder()
                        .center(Point.fromLngLat(-122.4194, 37.7749))
                        .zoom(12.0)
                        .build()
                )

                // TODO: Add markers via annotation manager
                // Note: Compose extension doesn't have declarative PointAnnotation
                // Markers would be added via mapView.annotations.createPointAnnotationManager()
            }

            // Demonstrate: Show user location puck (reactive to permission)
            MapEffect(hasLocationPermission) { mapView ->
                if (hasLocationPermission) {
                    mapView.location.updateSettings {
                        enabled = true
                        puckBearingEnabled = true
                    }
                }
            }

            // Demonstrate: Reset camera to initial position
            MapEffect(resetTrigger) { mapView ->
                if (resetTrigger > 0) {
                    mapView.camera.easeTo(
                        CameraOptions.Builder()
                            .center(Point.fromLngLat(-122.4194, 37.7749))
                            .zoom(13.0)
                            .bearing(0.0)
                            .pitch(0.0)
                            .build(),
                        MapAnimationOptions.Builder()
                            .duration(1000)
                            .build()
                    )
                }
            }

            // Demonstrate: Camera follows user location when enabled
            MapEffect(followLocation) { mapView ->
                if (followLocation && hasLocationPermission) {
                    val positionListener: (Point) -> Unit = { point ->
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

                    val bearingListener: (Double) -> Unit = { bearing ->
                        mapView.camera.easeTo(
                            CameraOptions.Builder()
                                .bearing(bearing)
                                .build(),
                            MapAnimationOptions.Builder()
                                .duration(1000)
                                .build()
                        )
                    }

                    mapView.location.addOnIndicatorPositionChangedListener(positionListener)
                    mapView.location.addOnIndicatorBearingChangedListener(bearingListener)
                } else {
                    // Note: Listeners remain until map is destroyed
                    // For production, would need proper cleanup via DisposableEffect
                }
            }

            // Note: Featureset interactions in Compose require MapboxStandardStyle
            // with experimental interactions state. This demonstrates the declarative
            // approach with basic features. For full featureset interaction examples,
            // see the skills documentation.
        }

        // UI Controls
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Show selected feature info
            if (selectedFeature.isNotEmpty()) {
                Surface(
                    color = MaterialTheme.colorScheme.surface,
                    shadowElevation = 4.dp,
                    shape = MaterialTheme.shapes.medium
                ) {
                    Text(
                        text = selectedFeature,
                        modifier = Modifier.padding(16.dp),
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            }

            // Control buttons
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // User location button
                Button(
                    onClick = {
                        if (!hasLocationPermission) {
                            permissionLauncher.launch(
                                arrayOf(
                                    Manifest.permission.ACCESS_FINE_LOCATION,
                                    Manifest.permission.ACCESS_COARSE_LOCATION
                                )
                            )
                        } else {
                            followLocation = !followLocation
                            selectedFeature = if (followLocation) {
                                "Following your location"
                            } else {
                                ""
                            }
                        }
                    }
                ) {
                    Text(if (followLocation) "Stop Following" else "Follow Location")
                }

                // Reset view button
                Button(
                    onClick = {
                        // Demonstrate: Animated camera transition
                        followLocation = false
                        resetTrigger++
                        selectedFeature = ""
                    }
                ) {
                    Text("Reset View")
                }
            }

            // Instructions
            Text(
                text = "Tap 'Follow Location' to track your position",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
