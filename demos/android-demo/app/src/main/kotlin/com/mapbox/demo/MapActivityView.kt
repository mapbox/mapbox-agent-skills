package com.mapbox.demo

import android.graphics.Color
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.mapbox.geojson.LineString
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.MapAnimationOptions
import com.mapbox.maps.MapView
import com.mapbox.maps.Style
import com.mapbox.maps.interactions.ClickInteraction
import com.mapbox.maps.plugin.annotation.generated.PointAnnotationOptions
import com.mapbox.maps.plugin.annotation.generated.createPointAnnotationManager
import com.mapbox.maps.plugin.gestures.gestures
import com.mapbox.maps.plugin.locationcomponent.location

/**
 * View system implementation demonstrating all patterns from mapbox-android-patterns skill.
 * This class shows:
 * 1. Map initialization with Standard style
 * 2. Adding multiple markers
 * 3. User location with camera follow (position + bearing)
 * 4. Custom GeoJSON data (route line)
 * 5. Featureset interactions (POI and building taps)
 */
class MapActivityView : AppCompatActivity() {
    private lateinit var mapView: MapView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Demonstrate: Map initialization
        mapView = MapView(this)
        setContentView(mapView)

        mapView.mapboxMap.setCamera(
            CameraOptions.Builder()
                .center(Point.fromLngLat(-122.4194, 37.7749))
                .zoom(12.0)
                .build()
        )

        // Demonstrate: Standard style (recommended)
        mapView.mapboxMap.loadStyle(Style.STANDARD) {
            setupMarkers()
            setupCustomData()
            setupLocationTracking()
            setupFeatureInteractions()
        }
    }

    private fun setupMarkers() {
        // Demonstrate: Add multiple markers
        val pointAnnotationManager = mapView.annotations.createPointAnnotationManager()

        val locations = listOf(
            Point.fromLngLat(-122.4194, 37.7749),
            Point.fromLngLat(-122.4094, 37.7849),
            Point.fromLngLat(-122.4294, 37.7649)
        )

        val annotations = locations.map { point ->
            PointAnnotationOptions()
                .withPoint(point)
                .withIconImage("marker") // Use default marker or add custom image
        }

        pointAnnotationManager.create(annotations)
    }

    private fun setupCustomData() {
        // Demonstrate: Add custom GeoJSON data (route line)
        val routeCoordinates = listOf(
            Point.fromLngLat(-122.4194, 37.7749),
            Point.fromLngLat(-122.4094, 37.7849),
            Point.fromLngLat(-122.3994, 37.7949)
        )

        val geoJsonSource = com.mapbox.maps.extension.style.sources.generated.geoJsonSource("route-source") {
            geometry(LineString.fromLngLats(routeCoordinates))
        }
        mapView.mapboxMap.style?.addSource(geoJsonSource)

        val lineLayer = com.mapbox.maps.extension.style.layers.generated.lineLayer("route-layer", "route-source") {
            lineColor(Color.BLUE)
            lineWidth(4.0)
            lineCap(com.mapbox.maps.extension.style.layers.properties.generated.LineCap.ROUND)
            lineJoin(com.mapbox.maps.extension.style.layers.properties.generated.LineJoin.ROUND)
        }
        mapView.mapboxMap.style?.addLayer(lineLayer)
    }

    private fun setupLocationTracking() {
        // Demonstrate: User location with camera follow
        // Note: Request permissions first using ActivityResultContracts

        // Show user location puck
        mapView.location.updateSettings {
            enabled = true
            puckBearingEnabled = true
        }

        // Follow user location with camera
        mapView.location.addOnIndicatorPositionChangedListener { point ->
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

        // Optional: Follow bearing (direction)
        mapView.location.addOnIndicatorBearingChangedListener { bearing ->
            mapView.camera.easeTo(
                CameraOptions.Builder()
                    .bearing(bearing)
                    .build(),
                MapAnimationOptions.Builder()
                    .duration(1000)
                    .build()
            )
        }
    }

    private fun setupFeatureInteractions() {
        // Demonstrate: Featureset interactions (recommended)

        // Tap on POI features
        mapView.mapboxMap.addInteraction(
            ClickInteraction.standardPoi { poi, context ->
                Log.d("MapDemo", "Tapped POI: ${poi.name}")
                true // Stop propagation
            }
        )

        // Tap on buildings
        mapView.mapboxMap.addInteraction(
            ClickInteraction.standardBuildings { building, context ->
                Log.d("MapDemo", "Tapped building")

                // Highlight the building
                mapView.mapboxMap.setFeatureState(
                    building,
                    com.mapbox.maps.extension.style.expressions.generated.StandardBuildingsState {
                        highlight(true)
                    }
                )
                true
            }
        )

        // Handle map taps (empty space)
        mapView.gestures.addOnMapClickListener { point ->
            Log.d("MapDemo", "Tapped map at: ${point.latitude()}, ${point.longitude()}")
            true
        }
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
