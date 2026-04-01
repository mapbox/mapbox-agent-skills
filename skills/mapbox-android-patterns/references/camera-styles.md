# Camera Control + Map Styles

## Camera Control

### Set Camera Position

```kotlin
// Compose - Update camera state
cameraState.position = CameraPosition(
    center = Point.fromLngLat(-74.0060, 40.7128),
    zoom = 14.0,
    bearing = 90.0,
    pitch = 60.0
)

// Views - Immediate
mapView.mapboxMap.setCamera(
    CameraOptions.Builder()
        .center(Point.fromLngLat(-74.0060, 40.7128))
        .zoom(14.0)
        .bearing(90.0)
        .pitch(60.0)
        .build()
)
```

### Animated Camera Transitions

```kotlin
// Fly animation (dramatic arc)
mapView.camera.flyTo(
    CameraOptions.Builder()
        .center(destination)
        .zoom(15.0)
        .build(),
    MapAnimationOptions.Builder()
        .duration(2000)
        .build()
)

// Ease animation (smooth)
mapView.camera.easeTo(
    CameraOptions.Builder()
        .center(destination)
        .zoom(15.0)
        .build(),
    MapAnimationOptions.Builder()
        .duration(1000)
        .build()
)
```

### Fit Camera to Coordinates

```kotlin
val coordinates = listOf(coord1, coord2, coord3)
val camera = mapView.mapboxMap.cameraForCoordinates(
    coordinates,
    EdgeInsets(50.0, 50.0, 50.0, 50.0),
    bearing = 0.0,
    pitch = 0.0
)
mapView.camera.easeTo(camera)
```

## Map Styles

### Built-in Styles

```kotlin
// Compose - load style via MapEffect
MapboxMap(modifier = Modifier.fillMaxSize()) {
    MapEffect(Unit) { mapView ->
        // Style.STANDARD loads by default, explicit loading only needed for other styles
        // mapView.mapboxMap.loadStyle(Style.STREETS)       // Mapbox Streets
        // mapView.mapboxMap.loadStyle(Style.OUTDOORS)      // Mapbox Outdoors
        // mapView.mapboxMap.loadStyle(Style.LIGHT)         // Mapbox Light
        // mapView.mapboxMap.loadStyle(Style.DARK)          // Mapbox Dark
        // mapView.mapboxMap.loadStyle(Style.STANDARD_SATELLITE)     // Satellite imagery
        // mapView.mapboxMap.loadStyle(Style.SATELLITE_STREETS) // Satellite + streets
    }
}

// Views
mapView.mapboxMap.loadStyle(Style.STANDARD)
mapView.mapboxMap.loadStyle(Style.DARK)
```

### Custom Style URL

```kotlin
val customStyleUrl = "mapbox://styles/username/style-id"

// Compose
MapboxMap(modifier = Modifier.fillMaxSize()) {
    MapEffect(Unit) { mapView ->
        mapView.mapboxMap.loadStyle(customStyleUrl)
    }
}

// Views
mapView.mapboxMap.loadStyle(customStyleUrl)
```
