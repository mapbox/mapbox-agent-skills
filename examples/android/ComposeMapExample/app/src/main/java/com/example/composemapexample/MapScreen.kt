/**
 * MapScreen - Main screen demonstrating MapboxMap usage
 *
 * Shows how to use the MapboxMap component with state management
 * for reactive camera updates.
 */

package com.example.composemapexample

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mapbox.geojson.Point

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapScreen() {
    // State for camera position
    var center by remember {
        mutableStateOf(Point.fromLngLat(-122.4194, 37.7749))
    }
    var zoom by remember { mutableDoubleStateOf(12.0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("San Francisco")
                        Text(
                            "Following mapbox-android-patterns",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Map fills entire available space
            MapboxMap(
                modifier = Modifier.fillMaxSize(),
                center = center,
                zoom = zoom,
                onMapReady = { mapView ->
                    // Map is ready - can add markers, etc.
                }
            )

            // Camera controls overlay
            Row(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Zoom out
                FloatingActionButton(
                    onClick = {
                        zoom = (zoom - 1).coerceAtLeast(0.0)
                    },
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = MaterialTheme.colorScheme.onSurface
                ) {
                    Icon(Icons.Default.Remove, "Zoom Out")
                }

                // Zoom in
                FloatingActionButton(
                    onClick = {
                        zoom = (zoom + 1).coerceAtMost(22.0)
                    },
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = MaterialTheme.colorScheme.onSurface
                ) {
                    Icon(Icons.Default.Add, "Zoom In")
                }

                // Reset to San Francisco
                FloatingActionButton(
                    onClick = {
                        center = Point.fromLngLat(-122.4194, 37.7749)
                        zoom = 12.0
                    },
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                ) {
                    Icon(Icons.Default.LocationOn, "Center")
                }
            }
        }
    }
}
