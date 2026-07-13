# Camera Control + Map Styles

---

## Camera Control

### Set Camera Position

```swift
// SwiftUI - Update viewport state
viewport = .camera(
    center: CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060),
    zoom: 14,
    bearing: 90,
    pitch: 60
)

// UIKit - Immediate
mapView.mapboxMap.setCamera(to: CameraOptions(
    center: CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060),
    zoom: 14,
    bearing: 90,
    pitch: 60
))
```

### Animated Camera Transitions

```swift
// Fly animation (dramatic arc)
mapView.camera.fly(to: CameraOptions(
    center: destination,
    zoom: 15
), duration: 2.0)

// Ease animation (smooth)
mapView.camera.ease(to: CameraOptions(
    center: destination,
    zoom: 15
), duration: 1.0)
```

### Fit Camera to Coordinates

```swift
let coordinates = [coord1, coord2, coord3]
let camera = mapView.mapboxMap.camera(for: coordinates,
                                       padding: UIEdgeInsets(top: 50, left: 50, bottom: 50, right: 50),
                                       bearing: 0,
                                       pitch: 0)
mapView.camera.ease(to: camera, duration: 1.0)
```

---

## Map Styles

### Built-in Styles

```swift
// SwiftUI
Map(viewport: $viewport)
    .mapStyle(.standard)        // Mapbox Standard (recommended)
    .mapStyle(.streets)          // Mapbox Streets
    .mapStyle(.outdoors)         // Mapbox Outdoors
    .mapStyle(.light)            // Mapbox Light
    .mapStyle(.dark)             // Mapbox Dark
    .mapStyle(.standardSatellite) // Satellite imagery

// UIKit
mapView.mapboxMap.loadStyle(.standard)
mapView.mapboxMap.loadStyle(.streets)
mapView.mapboxMap.loadStyle(.dark)
```

### Custom Style URL

```swift
// SwiftUI
Map(viewport: $viewport)
    .mapStyle(MapStyle(uri: StyleURI(url: customStyleURL)!))

// UIKit
mapView.mapboxMap.loadStyle(StyleURI(url: customStyleURL)!)
```

**Style from Mapbox Studio:**

```swift
let styleURL = URL(string: "mapbox://styles/username/style-id")!
```
