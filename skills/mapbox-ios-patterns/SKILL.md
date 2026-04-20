---
name: mapbox-ios-patterns
description: Official integration patterns for Mapbox Maps SDK on iOS. Covers installation, adding markers, user location, custom data, styles, camera control, and featureset interactions. Based on official Mapbox documentation.
---

# Mapbox iOS Integration Patterns

Official patterns for integrating Mapbox Maps SDK v11 on iOS with Swift, SwiftUI, and UIKit.

**Use this skill when:**

- Installing and configuring Mapbox Maps SDK for iOS
- Adding markers and annotations to maps
- Showing user location and tracking with camera
- Adding custom data (GeoJSON) to maps
- Working with map styles, camera, or user interaction
- Handling feature interactions and taps

**Official Resources:**

- [iOS Maps Guides](https://docs.mapbox.com/ios/maps/guides/)
- [API Reference](https://docs.mapbox.com/ios/maps/api-reference/)
- [Example Apps](https://github.com/mapbox/mapbox-maps-ios/tree/main/Sources/Examples)

---

## Installation & Setup

### Requirements

- iOS 14+
- Xcode 15+
- Swift 5.9+
- Free Mapbox account

### Step 1: Configure Access Token

Add your public token to `Info.plist`:

```xml
<key>MBXAccessToken</key>
<string>pk.your_mapbox_token_here</string>
```

**Get your token:** Sign in at [mapbox.com](https://account.mapbox.com/access-tokens/)

### Step 2: Add Swift Package Dependency

1. **File → Add Package Dependencies**
2. **Enter URL:** `https://github.com/mapbox/mapbox-maps-ios.git`
3. **Version:** "Up to Next Major" from `11.0.0`
4. **Verify** four dependencies appear: MapboxCommon, MapboxCoreMaps, MapboxMaps, Turf

**Alternative:** CocoaPods or direct download ([install guide](https://docs.mapbox.com/ios/maps/guides/install/))

---

## Map Initialization

### SwiftUI Pattern

**Basic map:**

```swift
import SwiftUI
import MapboxMaps

struct ContentView: View {
    @State private var viewport: Viewport = .camera(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        zoom: 12
    )

    var body: some View {
        Map(viewport: $viewport)
            .mapStyle(.standard)
    }
}
```

**With ornaments:**

```swift
Map(viewport: $viewport)
    .mapStyle(.standard)
    .ornamentOptions(OrnamentOptions(
        scaleBar: .init(visibility: .visible),
        compass: .init(visibility: .adaptive),
        logo: .init(position: .bottomLeading)
    ))
```

### UIKit Pattern

```swift
import UIKit
import MapboxMaps

class MapViewController: UIViewController {
    private var mapView: MapView!

    override func viewDidLoad() {
        super.viewDidLoad()

        let options = MapInitOptions(
            cameraOptions: CameraOptions(
                center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
                zoom: 12
            )
        )

        mapView = MapView(frame: view.bounds, mapInitOptions: options)
        mapView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(mapView)

        mapView.mapboxMap.loadStyle(.standard)
    }
}
```

---

## Add Markers

The SDK offers three ways to place a point on the map. Pick the simplest one that fits.

### Which API should I use?

| API                                                       | Use it when                                                                                    | Platforms       | Notes                                                                                                                                                                        |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Marker` (Markers API)                                    | You need a default pin and don't have a custom image asset                                     | SwiftUI only    | No image assets required. Experimental SPI — needs `@_spi(Experimental) import MapboxMaps`. Best < 100 markers.                                                              |
| `PointAnnotation`                                         | You have a custom image and want layer-level placement                                         | SwiftUI + UIKit | Backed by a symbol layer, so it scales well to hundreds of markers. Accepts any `UIImage` that `UIKit` can render.                                                           |
| View annotations (`ViewAnnotation` / `MapViewAnnotation`) | You want to render a full native view (card, badge, animated content) anchored to a coordinate | SwiftUI + UIKit | SwiftUI uses `MapViewAnnotation`; UIKit uses `mapView.viewAnnotations` with a `ViewAnnotation`. Each annotation is a real view — costs more than `PointAnnotation` at scale. |

For hundreds or thousands of features, use a style layer (`SymbolLayer` on a `GeoJSONSource`) instead of annotations.

### Markers API (recommended for simple cases, SwiftUI)

```swift
import SwiftUI
@_spi(Experimental) import MapboxMaps

struct ContentView: View {
    var body: some View {
        Map {
            Marker(coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194))
                .color(.red)
                .text("San Francisco")
        }
    }
}
```

Multiple markers from a collection:

```swift
Map {
    ForEvery(locations, id: \.id) { location in
        Marker(coordinate: location.coordinate)
            .color(.red)
            .text(location.name)
    }
}
```

> **Scaling note.** `Marker` and `PointAnnotation` each create their own view or symbol entry per pin — fine up to about 100 markers. For larger datasets (hundreds or thousands of features — common with open-ended GeoJSON feeds), load the data into a `GeoJSONSource` and render it with a `SymbolLayer` instead. That scales to thousands of features and enables clustering.

### PointAnnotation (custom image)

**SwiftUI:**

```swift
Map(viewport: $viewport) {
    PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194))
        .image(.init(image: UIImage(named: "marker")!, name: "marker"))
}
```

**UIKit:**

```swift
// Create annotation manager (once, reuse for updates)
var pointAnnotationManager = mapView.annotations.makePointAnnotationManager()

// Create marker
var annotation = PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194))
annotation.image = .init(image: UIImage(named: "marker")!, name: "marker")
annotation.iconAnchor = .bottom

// Add to map
pointAnnotationManager.annotations = [annotation]
```

**Multiple markers:**

```swift
let annotations = locations.map { coordinate in
    var annotation = PointAnnotation(coordinate: coordinate)
    annotation.image = .init(image: UIImage(named: "marker")!, name: "marker")
    return annotation
}

pointAnnotationManager.annotations = annotations
```

---

## Show User Location

**Step 1: Add location permission to Info.plist:**

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Show your location on the map</string>
```

**Step 2: Request permissions and show location:**

```swift
import CoreLocation

// Request permissions
let locationManager = CLLocationManager()
locationManager.requestWhenInUseAuthorization()

// Show user location puck
mapView.location.options.puckType = .puck2D()
mapView.location.options.puckBearingEnabled = true
```

---

## Performance Best Practices

### Reuse Annotation Managers

```swift
// ❌ Don't create new managers repeatedly
func updateMarkers() {
    let manager = mapView.annotations.makePointAnnotationManager()
    manager.annotations = markers
}

// ✅ Create once, reuse
let pointAnnotationManager: PointAnnotationManager

init() {
    pointAnnotationManager = mapView.annotations.makePointAnnotationManager()
}

func updateMarkers() {
    pointAnnotationManager.annotations = markers
}
```

### Batch Annotation Updates

```swift
// ✅ Update all at once
pointAnnotationManager.annotations = newAnnotations

// ❌ Don't update one by one
for annotation in newAnnotations {
    pointAnnotationManager.annotations.append(annotation)
}
```

### Memory Management

```swift
// Use weak self in closures
mapView.gestures.onMapTap.observe { [weak self] context in
    self?.handleTap(context.coordinate)
}.store(in: &cancelables)

// Clean up on deinit
deinit {
    cancelables.forEach { $0.cancel() }
}
```

### Use Standard Style

```swift
// ✅ Standard style is optimized and recommended
.mapStyle(.standard)

// Use other styles only when needed for specific use cases
.mapStyle(.standardSatellite) // Satellite imagery
```

---

## Troubleshooting

### Map Not Displaying

**Check:**

1. ✅ `MBXAccessToken` in Info.plist
2. ✅ Token is valid (test at mapbox.com)
3. ✅ MapboxMaps framework imported
4. ✅ MapView added to view hierarchy
5. ✅ Correct frame/constraints set

### Style Not Loading

```swift
mapView.mapboxMap.onStyleLoaded.observe { [weak self] _ in
    print("Style loaded successfully")
    // Add layers and sources here
}.store(in: &cancelables)
```

### Performance Issues

- Use `.standard` style (recommended and optimized)
- Limit visible annotations to viewport
- Reuse annotation managers
- Avoid frequent style reloads
- Batch annotation updates

---

## Reference Files

Load these references when the task requires deeper patterns:

- **`references/annotations.md`** — Circle, Polyline, Polygon Annotations
- **`references/location-tracking.md`** — Camera Follow User + Get Current Location
- **`references/custom-data.md`** — GeoJSON: Lines, Polygons, Points, Update/Remove
- **`references/camera-styles.md`** — Camera Control + Map Styles
- **`references/interactions.md`** — Featureset Interactions, Custom Layer Taps, Long Press, Gestures

---

## Additional Resources

- [iOS Maps Guides](https://docs.mapbox.com/ios/maps/guides/)
- [API Reference](https://docs.mapbox.com/ios/maps/api/11.18.1/documentation/mapboxmaps/)
- [Interactions Guide](https://docs.mapbox.com/ios/maps/guides/user-interaction/Interactions/)
- [SwiftUI User Guide](https://docs.mapbox.com/ios/maps/api/11.18.1/documentation/mapboxmaps/swiftui-user-guide)
- [Example Apps](https://github.com/mapbox/mapbox-maps-ios/tree/main/Sources/Examples)
- [Migration Guide (v10 → v11)](https://docs.mapbox.com/ios/maps/guides/migrate-to-v11/)
