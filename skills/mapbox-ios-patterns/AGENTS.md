# Mapbox iOS Quick Reference

Fast reference for Mapbox Maps SDK v11 on iOS with Swift, SwiftUI, and UIKit.

## Setup

### Installation (SPM)
```swift
// File → Add Package Dependencies
https://github.com/mapbox/mapbox-maps-ios.git
// Version: 11.0.0+
```

### Access Token
```xml
<!-- Info.plist -->
<key>MBXAccessToken</key>
<string>pk.your_token_here</string>
```

## SwiftUI

### Basic Map
```swift
import SwiftUI
import MapboxMaps

struct MapView: View {
    @State private var viewport: Viewport = .camera(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        zoom: 12
    )

    var body: some View {
        Map(viewport: $viewport)
            .mapStyle(.streets)
    }
}
```

### With Annotation
```swift
Map(viewport: $viewport) {
    PointAnnotation(coordinate: CLLocationCoordinate2D(
        latitude: 37.7749,
        longitude: -122.4194
    ))
    .iconImage("custom-marker")
}
```

## UIKit

### Basic Map
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
    }
}
```

## Common Patterns

### 1. Camera Control
```swift
// Fly animation
mapView.camera.fly(to: CameraOptions(
    center: CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060),
    zoom: 14
), duration: 2.0)

// Ease animation
mapView.camera.ease(to: CameraOptions(
    center: coordinate,
    zoom: 15
), duration: 1.0)
```

### 2. Point Annotations
```swift
var manager = mapView.annotations.makePointAnnotationManager()

var annotation = PointAnnotation(coordinate: coordinate)
annotation.image = .init(image: UIImage(named: "marker")!, name: "marker")

manager.annotations = [annotation]
```

### 3. User Location
```swift
// Request permission (add to Info.plist)
let locationManager = CLLocationManager()
locationManager.requestWhenInUseAuthorization()

// Show user location
mapView.location.options.puckType = .puck2D()
```

### 4. Map Tap Handling
```swift
mapView.gestures.onMapTap.observe { [weak self] context in
    let coordinate = context.coordinate
    print("Tapped at: \(coordinate)")
}.store(in: &cancelables)
```

### 5. Styles
```swift
// SwiftUI
.mapStyle(.streets)
.mapStyle(.dark)
.mapStyle(.satellite)

// UIKit
mapView.mapboxMap.loadStyle(.streets)
mapView.mapboxMap.loadStyle(.dark)
```

### 6. Add GeoJSON Layer
```swift
var source = GeoJSONSource(id: "route-source")
source.data = .geometry(.lineString(LineString(coordinates)))
try? mapView.mapboxMap.addSource(source)

var layer = LineLayer(id: "route-layer", source: "route-source")
layer.lineColor = .constant(StyleColor(.blue))
layer.lineWidth = .constant(4)
try? mapView.mapboxMap.addLayer(layer)
```

### 7. Query Features
```swift
mapView.mapboxMap.queryRenderedFeatures(
    with: screenPoint,
    options: RenderedQueryOptions(layerIds: ["poi-layer"], filter: nil)
) { result in
    if case .success(let features) = result {
        print("Found \(features.count) features")
    }
}
```

## Performance Tips

### Reuse Managers
```swift
// ✅ Create once
let annotationManager = mapView.annotations.makePointAnnotationManager()

// ✅ Update many times
func updateMarkers() {
    annotationManager.annotations = newMarkers
}
```

### Batch Updates
```swift
// ✅ Update all at once
manager.annotations = allAnnotations

// ❌ Don't update one by one
allAnnotations.forEach { manager.annotations.append($0) }
```

### Memory Management
```swift
// Use weak self
mapView.gestures.onMapTap.observe { [weak self] context in
    self?.handleTap(context.coordinate)
}.store(in: &cancelables)
```

## Quick Checklist

✅ MBXAccessToken in Info.plist
✅ MapboxMaps imported
✅ Location permissions if needed
✅ Weak self in closures
✅ Cancelables stored and cancelled
✅ Annotation managers reused

## Resources

- [iOS Maps Guides](https://docs.mapbox.com/ios/maps/guides/)
- [API Reference](https://docs.mapbox.com/ios/maps/api-reference/)
- [Examples](https://github.com/mapbox/mapbox-maps-ios/tree/main/Sources/Examples)
