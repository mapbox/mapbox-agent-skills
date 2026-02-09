package com.mapbox.demo

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Color
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.mapbox.geojson.LineString
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.MapAnimationOptions
import com.mapbox.maps.Style
import com.mapbox.maps.extension.compose.*
import com.mapbox.maps.plugin.annotation.generated.PointAnnotationOptions

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

    // Demonstrate: Map initialization
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
            // Demonstrate: Add markers
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

            // Note: Featureset interactions in Compose require MapboxStandardStyleExperimental
            // See MapActivityView.kt for View system implementation with full feature set
        }

        // UI Controls
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (selectedFeature.isNotEmpty()) {
                Text(
                    text = selectedFeature,
                    modifier = Modifier
                        .padding(8.dp)
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = {
                        if (!hasLocationPermission) {
                            permissionLauncher.launch(
                                arrayOf(
                                    Manifest.permission.ACCESS_FINE_LOCATION,
                                    Manifest.permission.ACCESS_COARSE_LOCATION
                                )
                            )
                        }
                        followLocation = !followLocation
                    }
                ) {
                    Text(if (followLocation) "Stop Following" else "Follow Location")
                }

                Button(
                    onClick = {
                        cameraState.position = CameraPosition(
                            center = Point.fromLngLat(-122.4194, 37.7749),
                            zoom = 13.0
                        )
                    }
                ) {
                    Text("Reset View")
                }
            }
        }
    }
}
