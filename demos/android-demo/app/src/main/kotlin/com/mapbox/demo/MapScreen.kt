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
import com.mapbox.maps.Style
import com.mapbox.maps.extension.compose.*

@Composable
fun MapScreen() {
    val context = LocalContext.current
    var selectedFeature by remember { mutableStateOf("") }
    var followLocation by remember { mutableStateOf(false) }
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

    // Demonstrate: Camera state management
    val cameraState = rememberCameraState {
        position = CameraPosition(
            center = Point.fromLngLat(-122.4194, 37.7749),
            zoom = 12.0
        )
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
            modifier = Modifier.fillMaxSize(),
            mapViewportState = cameraState,
            style = Style.STANDARD
        ) {
            // Demonstrate: Add Markers - Multiple point annotations
            PointAnnotation(
                point = Point.fromLngLat(-122.4194, 37.7749)
            ) {
                iconImage = "marker"
            }

            PointAnnotation(
                point = Point.fromLngLat(-122.4094, 37.7849)
            ) {
                iconImage = "marker"
            }

            PointAnnotation(
                point = Point.fromLngLat(-122.4294, 37.7649)
            ) {
                iconImage = "marker"
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
                            if (followLocation) {
                                // Demonstrate: In a full implementation, observe location
                                // updates and animate camera to follow user
                                selectedFeature = "Location tracking ${if (followLocation) "enabled" else "disabled"}"
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
                        cameraState.position = CameraPosition(
                            center = Point.fromLngLat(-122.4194, 37.7749),
                            zoom = 13.0,
                            bearing = 0.0,
                            pitch = 0.0
                        )
                        selectedFeature = ""
                    }
                ) {
                    Text("Reset View")
                }
            }

            // Instructions
            Text(
                text = "Map shows Standard style with 3 markers",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
