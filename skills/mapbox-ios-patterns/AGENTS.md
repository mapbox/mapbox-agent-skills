# Mapbox iOS Integration Guide

Quick reference for Mapbox Maps SDK for iOS with Swift, SwiftUI, and UIKit.

## Setup

### Installation (SPM)
```swift
dependencies: [
  .package(url: "https://github.com/mapbox/mapbox-maps-ios.git", from: "11.0.0")
]
```

### Configuration
```swift
// Info.plist or code
MapboxOptions.accessToken = "pk.your_token_here"
```

## SwiftUI Integration

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

### With Annotations
```swift
struct MapView: View {
  var body: some View {
    Map {
      PointAnnotation(coordinate: CLLocationCoordinate2D(
        latitude: 37.7749,
        longitude: -122.4194
      ))
      .iconImage("custom-marker")
    }
  }
}
```

## UIKit Integration

### Basic Map
```swift
import UIKit
import MapboxMaps

class MapViewController: UIViewController {
  var mapView: MapView!

  override func viewDidLoad() {
    super.viewDidLoad()

    let options = MapInitOptions(
      cameraOptions: CameraOptions(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        zoom: 12
      )
    )

    mapView = MapView(frame: view.bounds, mapInitOptions: options)
    view.addSubview(mapView)
  }
}
```

## Common Patterns

### 1. Camera Control
```swift
// Fly to location
mapView.camera.fly(to: CameraOptions(
  center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
  zoom: 14
), duration: 2.0)

// Ease to location
mapView.camera.ease(to: CameraOptions(
  center: coordinate,
  zoom: 15
), duration: 1.0)

// Set immediately
mapView.mapboxMap.setCamera(to: CameraOptions(
  center: coordinate,
  zoom: 12
))
```

### 2. Annotations
```swift
// Point annotation
var pointAnnotation = PointAnnotation(coordinate: coordinate)
pointAnnotation.image = .init(image: UIImage(named: "marker")!, name: "marker")
pointAnnotationManager.annotations = [pointAnnotation]

// Circle annotation
var circleAnnotation = CircleAnnotation(coordinate: coordinate)
circleAnnotation.circleRadius = 10
circleAnnotation.circleColor = StyleColor(.red)

// Polygon annotation
var polygonAnnotation = PolygonAnnotation(polygon: polygon)
polygonAnnotation.fillColor = StyleColor(.blue.withAlphaComponent(0.5))
```

### 3. Adding Layers
```swift
// GeoJSON source
var source = GeoJSONSource(id: "source-id")
source.data = .geometry(.point(Point(coordinate)))
try? mapView.mapboxMap.addSource(source)

// Circle layer
var layer = CircleLayer(id: "layer-id", source: "source-id")
layer.circleRadius = .constant(8)
layer.circleColor = .constant(StyleColor(.red))
try? mapView.mapboxMap.addLayer(layer)
```

### 4. Event Handling
```swift
// Map tap
mapView.gestures.onMapTap.observe { context in
  let coordinate = context.coordinate
  print("Tapped at: \(coordinate)")
}.store(in: &cancelables)

// Long press
mapView.gestures.onLongPress.observe { context in
  // Handle long press
}.store(in: &cancelables)

// Camera changed
mapView.mapboxMap.onCameraChanged.observe { event in
  print("Camera: \(event.cameraState)")
}.store(in: &cancelables)
```

### 5. User Location
```swift
// Enable location
mapView.location.options.puckType = .puck2D()
mapView.location.options.puckBearingEnabled = true

// Request permissions
import CoreLocation

let locationManager = CLLocationManager()
locationManager.requestWhenInUseAuthorization()

// Track user location
mapView.camera.ease(to: CameraOptions(
  center: mapView.location.latestLocation?.coordinate,
  zoom: 14
), duration: 1.0)
```

## Performance Optimization

### 1. Reuse Annotation Managers
```swift
// ❌ Creating new manager each time
func updateMarkers() {
  let manager = mapView.annotations.makePointAnnotationManager()
  manager.annotations = markers
}

// ✅ Reuse manager
let annotationManager: PointAnnotationManager

init() {
  annotationManager = mapView.annotations.makePointAnnotationManager()
}

func updateMarkers() {
  annotationManager.annotations = markers
}
```

### 2. Batch Updates
```swift
// ✅ Update all annotations at once
annotationManager.annotations = newAnnotations

// ❌ Update one by one (slow)
newAnnotations.forEach { annotation in
  annotationManager.annotations.append(annotation)
}
```

### 3. Layer Management
```swift
// ✅ Update layer properties
try? mapView.mapboxMap.updateLayer(
  withId: "layer-id",
  type: CircleLayer.self
) { layer in
  layer.circleColor = .constant(StyleColor(.blue))
}

// ❌ Remove and re-add layer
try? mapView.mapboxMap.removeLayer(withId: "layer-id")
// ...then re-add
```

## Common Issues

### 1. Map Not Displaying
```swift
// ❌ No access token
// Fix: Set MapboxOptions.accessToken

// ❌ Wrong constraints
mapView.translatesAutoresizingMaskIntoConstraints = false
NSLayoutConstraint.activate([
  mapView.topAnchor.constraint(equalTo: view.topAnchor),
  mapView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
  mapView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
  mapView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
])
```

### 2. Memory Leaks
```swift
// ✅ Use weak self in closures
mapView.gestures.onMapTap.observe { [weak self] context in
  self?.handleTap(context.coordinate)
}.store(in: &cancelables)

// ✅ Clean up on deinit
deinit {
  cancelables.forEach { $0.cancel() }
}
```

### 3. Location Permissions
```swift
// ✅ Add to Info.plist
<key>NSLocationWhenInUseUsageDescription</key>
<string>Show your location on the map</string>

// ✅ Request before using
locationManager.requestWhenInUseAuthorization()
```

## SwiftUI Best Practices

### State Management
```swift
struct MapView: View {
  @State private var viewport: Viewport = .camera(...)
  @State private var selectedMarker: Marker?

  var body: some View {
    Map(viewport: $viewport) {
      ForEach(markers) { marker in
        PointAnnotation(coordinate: marker.coordinate)
          .onTapGesture {
            selectedMarker = marker
          }
      }
    }
    .sheet(item: $selectedMarker) { marker in
      MarkerDetailView(marker: marker)
    }
  }
}
```

### Combine with Other Views
```swift
struct ContentView: View {
  var body: some View {
    ZStack(alignment: .top) {
      Map(viewport: $viewport)

      VStack {
        SearchBar(...)
        Spacer()
      }
    }
  }
}
```

## Platform-Specific Considerations

### Dark Mode
```swift
// Auto-adjust for dark mode
.mapStyle(
  colorScheme == .dark ? .dark : .streets
)
```

### iPad Support
```swift
// Handle larger screens
if UIDevice.current.userInterfaceIdiom == .pad {
  // iPad-specific layout
}
```

### Safe Areas
```swift
// Respect safe areas
Map(viewport: $viewport)
  .ignoresSafeArea(edges: .all)
```

## Testing

### Unit Tests
```swift
func testCameraPosition() {
  let mapView = MapView(frame: .zero)
  let cameraOptions = CameraOptions(
    center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
    zoom: 12
  )
  mapView.mapboxMap.setCamera(to: cameraOptions)

  XCTAssertEqual(mapView.cameraState.center.latitude, 37.7749, accuracy: 0.01)
}
```

## Quick Checklist

✅ Access token configured
✅ Location permissions in Info.plist
✅ Map view constraints set properly
✅ Weak self in closures
✅ Cancelables stored and cancelled
✅ Dark mode handled
✅ Safe areas respected
✅ Error handling implemented
✅ Memory management considered
✅ Performance optimized (reuse managers)
