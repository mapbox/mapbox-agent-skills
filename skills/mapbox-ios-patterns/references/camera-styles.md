# Camera Control + Map Styles

---

## Camera Control

### Set Camera Position

```swift
// SwiftUI — update viewport state
viewport = .camera(
    center: CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060),
    zoom: 14,
    bearing: 90,
    pitch: 60
)

// UIKit — immediate
mapView.mapboxMap.setCamera(to: CameraOptions(
    center: CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060),
    zoom: 14,
    bearing: 90,
    pitch: 60
))
```

### Animated Camera Transitions

**SwiftUI:**

```swift
// Fly animation (arc pattern — dramatic, long distances)
withViewportAnimation(.fly(duration: 0.8)) {
    viewport = .camera(center: destination, zoom: 15)
}

// Ease animation (smooth, short distances)
withViewportAnimation(.easeOut(duration: 0.5)) {
    viewport = .camera(center: destination, zoom: 15)
}
```

**UIKit:**

```swift
// Fly animation
mapView.camera.fly(to: CameraOptions(center: destination, zoom: 15), duration: 2.0)

// Ease animation
mapView.camera.ease(to: CameraOptions(center: destination, zoom: 15), duration: 1.0)
```

### Fit Camera to Coordinates

```swift
// UIKit
let coordinates = [coord1, coord2, coord3]
let camera = mapView.mapboxMap.camera(
    for: coordinates,
    padding: UIEdgeInsets(top: 50, left: 50, bottom: 50, right: 50),
    bearing: 0,
    pitch: 0
)
mapView.camera.ease(to: camera, duration: 1.0)

// SwiftUI
viewport = .overview(geometry: MultiPoint(coordinates), padding: UIEdgeInsets(top: 50, left: 50, bottom: 50, right: 50))
```

---

## Map Styles

### Built-in Styles

```swift
// SwiftUI
Map(viewport: $viewport)
    .mapStyle(.standard)           // Mapbox Standard (recommended)
    .mapStyle(.standardSatellite)  // Satellite imagery
    .mapStyle(.streets)
    .mapStyle(.outdoors)
    .mapStyle(.light)
    .mapStyle(.dark)

// UIKit
mapView.mapboxMap.loadStyle(.standard)
mapView.mapboxMap.loadStyle(.streets)
mapView.mapboxMap.loadStyle(.dark)
```

### Custom Style URL (Mapbox Studio)

```swift
// mapbox:// URI
let styleURI = StyleURI(rawValue: "mapbox://styles/username/style-id")!

// SwiftUI
Map(viewport: $viewport)
    .mapStyle(MapStyle(uri: styleURI))

// UIKit
mapView.mapboxMap.loadStyle(styleURI)
```

> Use `StyleURI(rawValue:)` for `mapbox://` URIs. Use `StyleURI(url:)` for `https://` URLs.

### Standard Style Configuration

```swift
// SwiftUI — configure light preset and theme
Map(viewport: $viewport)
    .mapStyle(.standard(lightPreset: .dawn, theme: .faded))

// Available light presets: .default, .dawn, .dusk, .night
// Available themes: .default, .faded, .monochrome
```
