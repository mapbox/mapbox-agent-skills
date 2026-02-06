---
name: mapbox-ios-patterns
description: Official integration patterns for Mapbox Maps SDK on iOS. Covers installation, map initialization with SwiftUI/UIKit, styles, camera control, annotations, user interaction, and querying. Based on official Mapbox documentation.
---

# Mapbox iOS Integration Patterns

Official patterns for integrating Mapbox Maps SDK v11 on iOS with Swift, SwiftUI, and UIKit.

**Use this skill when:**
- Installing and configuring Mapbox Maps SDK for iOS
- Creating maps with SwiftUI or UIKit
- Working with map styles, camera, annotations, or user interaction
- Querying map features or handling gestures

**Official Resources:**
- [iOS Maps Guides](https://docs.mapbox.com/ios/maps/guides/)
- [API Reference](https://docs.mapbox.com/ios/maps/api-reference/)
- [Example Apps](https://github.com/mapbox/mapbox-maps-ios/tree/main/Sources/Examples)

---

## Installation & Setup

### Requirements
- iOS 12+
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

### SwiftUI Pattern (iOS 13+)

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
            .mapStyle(.streets)
    }
}
```

**With camera options:**

```swift
Map(viewport: $viewport)
    .mapStyle(.streets)
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
    }
}
```

---

## Map Styles

### Built-in Styles

```swift
// SwiftUI
Map(viewport: $viewport)
    .mapStyle(.streets)      // Mapbox Streets
    .mapStyle(.outdoors)     // Mapbox Outdoors
    .mapStyle(.light)        // Mapbox Light
    .mapStyle(.dark)         // Mapbox Dark
    .mapStyle(.satellite)    // Satellite imagery
    .mapStyle(.satelliteStreets) // Satellite + streets

// UIKit
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
// Fly animation
mapView.camera.fly(to: CameraOptions(
    center: destination,
    zoom: 15
), duration: 2.0)

// Ease animation
mapView.camera.ease(to: CameraOptions(
    center: destination,
    zoom: 15
), duration: 1.0)
```

### Fit to Coordinates

```swift
let coordinates = [coord1, coord2, coord3]
let camera = mapView.mapboxMap.camera(for: coordinates,
                                       padding: UIEdgeInsets(top: 50, left: 50, bottom: 50, right: 50),
                                       bearing: 0,
                                       pitch: 0)
mapView.camera.ease(to: camera, duration: 1.0)
```

---

## Annotations

### Point Annotations (Markers)

```swift
// SwiftUI
Map(viewport: $viewport) {
    PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194))
        .iconImage("custom-marker")
}

// UIKit
var pointAnnotationManager = mapView.annotations.makePointAnnotationManager()

var annotation = PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194))
annotation.image = .init(image: UIImage(named: "marker")!, name: "marker")
annotation.iconAnchor = .bottom

pointAnnotationManager.annotations = [annotation]
```

### Circle Annotations

```swift
var circleAnnotationManager = mapView.annotations.makeCircleAnnotationManager()

var circle = CircleAnnotation(coordinate: coordinate)
circle.circleRadius = 10
circle.circleColor = StyleColor(.red)

circleAnnotationManager.annotations = [circle]
```

### Polygon Annotations

```swift
var polygonAnnotationManager = mapView.annotations.makePolygonAnnotationManager()

let coordinates = [coord1, coord2, coord3, coord1] // Close the polygon
var polygon = PolygonAnnotation(polygon: .init(outerRing: .init(coordinates)))
polygon.fillColor = StyleColor(.blue.withAlphaComponent(0.5))
polygon.fillOutlineColor = StyleColor(.blue)

polygonAnnotationManager.annotations = [polygon]
```

---

## User Interaction

### Handle Map Taps

```swift
// UIKit
mapView.gestures.onMapTap.observe { [weak self] context in
    let coordinate = context.coordinate
    print("Tapped at: \(coordinate.latitude), \(coordinate.longitude)")
}.store(in: &cancelables)
```

### Query Features at Point

```swift
mapView.mapboxMap.queryRenderedFeatures(
    with: screenPoint,
    options: RenderedQueryOptions(layerIds: ["poi-layer"], filter: nil)
) { result in
    switch result {
    case .success(let features):
        print("Found \(features.count) features")
    case .failure(let error):
        print("Query failed: \(error)")
    }
}
```

### Gesture Configuration

```swift
// Disable specific gestures
mapView.gestures.options.pitchEnabled = false
mapView.gestures.options.rotateEnabled = false

// Configure zoom limits
mapView.mapboxMap.setCamera(to: CameraOptions(
    zoom: 12,
    minZoom: 10,
    maxZoom: 16
))
```

---

## User Location

### Display User Location

```swift
// Request permissions (add to Info.plist first)
let locationManager = CLLocationManager()
locationManager.requestWhenInUseAuthorization()

// Show user location puck
mapView.location.options.puckType = .puck2D()
mapView.location.options.puckBearingEnabled = true
```

**Required Info.plist keys:**

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Show your location on the map</string>
```

### Track User Location

```swift
// Get latest location
if let location = mapView.location.latestLocation {
    let coordinate = location.coordinate
    mapView.camera.ease(to: CameraOptions(
        center: coordinate,
        zoom: 14
    ), duration: 1.0)
}
```

---

## Runtime Styling

### Add GeoJSON Source and Layer

```swift
// Create GeoJSON source
var source = GeoJSONSource(id: "route-source")
source.data = .geometry(.lineString(LineString(routeCoordinates)))

try? mapView.mapboxMap.addSource(source)

// Create line layer
var layer = LineLayer(id: "route-layer", source: "route-source")
layer.lineColor = .constant(StyleColor(.blue))
layer.lineWidth = .constant(4)

try? mapView.mapboxMap.addLayer(layer)
```

### Update Layer Properties

```swift
try? mapView.mapboxMap.updateLayer(
    withId: "route-layer",
    type: LineLayer.self
) { layer in
    layer.lineColor = .constant(StyleColor(.red))
    layer.lineWidth = .constant(6)
}
```

### Remove Layers and Sources

```swift
try? mapView.mapboxMap.removeLayer(withId: "route-layer")
try? mapView.mapboxMap.removeSource(withId: "route-source")
```

---

## Querying the Map

### Query Rendered Features

```swift
let screenPoint = CGPoint(x: 100, y: 100)

mapView.mapboxMap.queryRenderedFeatures(
    with: screenPoint,
    options: RenderedQueryOptions(layerIds: ["poi-layer"], filter: nil)
) { result in
    if case .success(let features) = result {
        for feature in features {
            print("Feature: \(feature.properties)")
        }
    }
}
```

### Query Source Features

```swift
mapView.mapboxMap.querySourceFeatures(
    for: "composite",
    options: SourceQueryOptions(
        sourceLayerIds: ["building"],
        filter: Exp(.eq) {
            "type"
            "residential"
        }
    )
) { result in
    if case .success(let features) = result {
        print("Found \(features.count) residential buildings")
    }
}
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

- Use `.streets` instead of `.satelliteStreets` when possible (lighter)
- Limit visible annotations to viewport
- Reuse annotation managers
- Avoid frequent style reloads

---

## Additional Resources

- [iOS Maps Guides](https://docs.mapbox.com/ios/maps/guides/)
- [API Reference](https://docs.mapbox.com/ios/maps/api/11.18.1/documentation/mapboxmaps/)
- [SwiftUI User Guide](https://docs.mapbox.com/ios/maps/api/11.18.1/documentation/mapboxmaps/swiftui-user-guide)
- [Example Apps](https://github.com/mapbox/mapbox-maps-ios/tree/main/Sources/Examples)
- [Migration Guide (v10 → v11)](https://docs.mapbox.com/ios/maps/guides/migrate-to-v11/)
