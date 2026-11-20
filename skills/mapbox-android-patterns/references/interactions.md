# Featureset Interactions, Custom Layer Taps, Long Press, Gestures

## Featureset Interactions (Recommended)

The modern Interactions API allows handling taps on map features with typed feature access. Works with Standard Style predefined featuresets like POIs, buildings, and place labels.

**View System Pattern:**

```kotlin
import com.mapbox.maps.interactions.ClickInteraction

class MapActivity : AppCompatActivity() {
    private lateinit var mapView: MapView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_map)

        mapView = findViewById(R.id.mapView)
        mapView.mapboxMap.loadStyle(Style.STANDARD)

        setupFeatureInteractions()
    }

    private fun setupFeatureInteractions() {
        // Tap on POI features
        mapView.mapboxMap.addInteraction(
            ClickInteraction.standardPoi { poi, context ->
                Log.d("MapTap", "Tapped POI: ${poi.name}")
                true // Stop propagation
            }
        )

        // Tap on buildings
        mapView.mapboxMap.addInteraction(
            ClickInteraction.standardBuildings { building, context ->
                Log.d("MapTap", "Tapped building")

                // Highlight the building
                mapView.mapboxMap.setFeatureState(
                    building,
                    StandardBuildingsState {
                        highlight(true)
                    }
                )
                true
            }
        )
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
```

**Jetpack Compose Pattern:**

```kotlin
import com.mapbox.maps.extension.compose.style.standard.MapboxStandardStyle
import com.mapbox.maps.extension.compose.style.standard.rememberStandardStyleState

@Composable
fun MapScreen() {
    MapboxMap(
        modifier = Modifier.fillMaxSize(),
        style = {
            MapboxStandardStyle(
                standardStyleState = rememberStandardStyleState {
                    interactionsState
                        .onPoiClicked { poi, context ->
                            Log.d("MapTap", "Tapped POI: ${poi.name}")
                            true // Stop propagation
                        }
                        .onBuildingsClicked { building, context ->
                            Log.d("MapTap", "Tapped building")
                            // Highlight the building
                            building.setStandardBuildingsState { highlight(true) }
                            true
                        }
                }
            )
        }
    )
}
```

Compose interactions go through the style's `interactionsState`, not `MapEffect`. `MapboxStandardStyle`'s `interactionsState` covers the Standard featuresets (`onPoiClicked`, `onBuildingsClicked`, `onPlaceLabelsClicked`, `onLandmarkIconsClicked`, plus `onFeaturesetClicked` and `onLayerClicked`). For featuresets in an imported style, use `rememberStyleImportState { interactionsState.onFeaturesetClicked(id = ...) { ... } }` on a `StyleImport`. See the [Compose interactions example](https://github.com/mapbox/mapbox-maps-android/blob/main/compose/compose-app/src/main/java/com/mapbox/maps/compose/testapp/examples/style/InteractionsActivity.kt).

## Tap on Custom Layers

```kotlin
mapView.mapboxMap.addInteraction(
    ClickInteraction.layer("custom-layer-id") { feature, context ->
        Log.d("MapTap", "Feature properties: ${feature.properties()}")
        true
    }
)
```

## Long Press Interactions

```kotlin
import com.mapbox.maps.interactions.LongClickInteraction

mapView.mapboxMap.addInteraction(
    LongClickInteraction.standardPoi { poi, context ->
        Log.d("MapTap", "Long pressed POI: ${poi.name}")
        true
    }
)
```

## Handle Map Clicks (Empty Space)

```kotlin
mapView.gestures.addOnMapClickListener { point ->
    Log.d("MapClick", "Tapped at: ${point.latitude()}, ${point.longitude()}")
    true // Consume event
}
```

## Gesture Configuration

```kotlin
// Disable specific gestures
mapView.gestures.pitchEnabled = false
mapView.gestures.rotateEnabled = false

// Configure zoom limits
mapView.mapboxMap.setCamera(
    CameraOptions.Builder()
        .zoom(12.0)
        .build()
)
```
