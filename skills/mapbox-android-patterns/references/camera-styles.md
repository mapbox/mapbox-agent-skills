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
// Compose - pass the style through the `style` slot, not MapEffect
MapboxMap(modifier = Modifier.fillMaxSize(), style = { MapboxStandardStyle() }) // Default, recommended
MapboxMap(style = { MapboxStandardSatelliteStyle() })    // Satellite imagery
MapboxMap(style = { MapStyle(style = Style.STREETS) })   // Mapbox Streets
MapboxMap(style = { MapStyle(style = Style.OUTDOORS) })  // Mapbox Outdoors
MapboxMap(style = { MapStyle(style = Style.LIGHT) })     // Mapbox Light
MapboxMap(style = { MapStyle(style = Style.DARK) })      // Mapbox Dark
MapboxMap(style = { MapStyle(style = Style.SATELLITE_STREETS) }) // Satellite + streets

// Views
mapView.mapboxMap.loadStyle(Style.STANDARD)
mapView.mapboxMap.loadStyle(Style.DARK)
```

### Custom Style URL

```kotlin
val customStyleUrl = "mapbox://styles/username/style-id"

// Compose
MapboxMap(
    modifier = Modifier.fillMaxSize(),
    style = { MapStyle(style = customStyleUrl) }
)

// Views
mapView.mapboxMap.loadStyle(customStyleUrl)
```
