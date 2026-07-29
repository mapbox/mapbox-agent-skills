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

`Style.STANDARD` is the default and the recommended choice. You rarely need to load a different style — Standard's **config surface** covers appearance changes without a reload.

```kotlin
// Compose - Style.STANDARD loads by default; explicit loading is only needed
// for a different style family (e.g. satellite imagery or outdoors)
MapboxMap(modifier = Modifier.fillMaxSize()) {
    MapEffect(Unit) { mapView ->
        // mapView.mapboxMap.loadStyle(Style.STANDARD_SATELLITE) // imagery + labels
        // mapView.mapboxMap.loadStyle(Style.OUTDOORS)           // trails, contours
    }
}

// Views
mapView.mapboxMap.loadStyle(Style.STANDARD)
```

The Classic styles (`Style.STREETS`, `Style.LIGHT`, `Style.DARK`, `Style.SATELLITE_STREETS`) are 2D, have **no slots and no config surface**, and you restyle them by editing layer paint. Reach for one only when you need per-layer paint control that config can't express, or a deliberate 2D / low-power fallback.

### Configure Standard: dark mode and visibility

Change **config properties** on the `"basemap"` import — never reload the style for an incremental change. The keys and values are identical on GL JS, iOS, and Flutter; only this setter differs.

```kotlin
mapView.mapboxMap.style?.setStyleImportConfigProperty(
    "basemap", "lightPreset", Value.valueOf("night")   // dawn | day | dusk | night
)

// Other config: theme, label visibility, 3D, POI density
mapView.mapboxMap.style?.setStyleImportConfigProperty(
    "basemap", "theme", Value.valueOf("monochrome")    // default | faded | monochrome | custom
)
mapView.mapboxMap.style?.setStyleImportConfigProperty(
    "basemap", "showPointOfInterestLabels", Value.valueOf(false)
)
mapView.mapboxMap.style?.setStyleImportConfigProperty(
    "basemap", "show3dObjects", Value.valueOf(false)
)
```

**Dark mode is `lightPreset`, not `Style.DARK`.** Standard shifts land, buildings, water, roads, and label colors along with the lighting, so the preset alone is a complete dark basemap. Bind it to the system appearance:

```kotlin
val isNight = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
    Configuration.UI_MODE_NIGHT_YES

mapView.mapboxMap.style?.setStyleImportConfigProperty(
    "basemap", "lightPreset", Value.valueOf(if (isNight) "night" else "day")
)
```

Two caveats, both covered in the **mapbox-cartography** skill:

- **Your own layers don't adapt.** They keep the colors you gave them, and fill / line / circle layers go nearly invisible at night without emissive strength (those default to `0`; symbol layers already default to `1`) — see [custom-data.md](custom-data.md).
- **`color*` config overrides are day values.** Standard re-derives them per preset, so handing it an already-dark `colorLand` double-darkens to near-black.

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
