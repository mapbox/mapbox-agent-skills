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

## Add Markers (Annotations)

### Point Annotations (Markers)

Point annotations are the most common way to mark locations on the map.

**SwiftUI:**

```swift
Map(viewport: $viewport) {
    PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194))
        .iconImage("custom-marker")
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
let locations = [
    CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
    CLLocationCoordinate2D(latitude: 37.7849, longitude: -122.4094),
    CLLocationCoordinate2D(latitude: 37.7649, longitude: -122.4294)
]

let annotations = locations.map { coordinate in
    var annotation = PointAnnotation(coordinate: coordinate)
    annotation.image = .init(image: UIImage(named: "marker")!, name: "marker")
    return annotation
}

pointAnnotationManager.annotations = annotations
```

### Circle Annotations

```swift
var circleAnnotationManager = mapView.annotations.makeCircleAnnotationManager()

var circle = CircleAnnotation(coordinate: coordinate)
circle.circleRadius = 10
circle.circleColor = StyleColor(.red)

circleAnnotationManager.annotations = [circle]
```

### Polyline Annotations

```swift
var polylineAnnotationManager = mapView.annotations.makePolylineAnnotationManager()

let coordinates = [coord1, coord2, coord3]
var polyline = PolylineAnnotation(lineCoordinates: coordinates)
polyline.lineColor = StyleColor(.blue)
polyline.lineWidth = 4

polylineAnnotationManager.annotations = [polyline]
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

## Show User Location

### Display User Location

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

### Camera Follow User Location

To make the camera follow the user's location as they move:

```swift
import Combine

class MapViewController: UIViewController {
    private var mapView: MapView!
    private var cancelables = Set<AnyCancellable>()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupMap()
        setupLocationTracking()
    }

    func setupLocationTracking() {
        // Request permissions
        let locationManager = CLLocationManager()
        locationManager.requestWhenInUseAuthorization()

        // Show user location
        mapView.location.options.puckType = .puck2D()
        mapView.location.options.puckBearingEnabled = true

        // Follow user location with camera
        mapView.location.onLocationChange.observe { [weak self] locations in
            guard let self = self, let location = locations.last else { return }

            self.mapView.camera.ease(to: CameraOptions(
                center: location.coordinate,
                zoom: 15,
                bearing: location.course >= 0 ? location.course : nil,
                pitch: 45
            ), duration: 1.0)
        }.store(in: &cancelables)
    }
}
```

### Get Current Location Once

```swift
if let location = mapView.location.latestLocation {
    let coordinate = location.coordinate
    print("User at: \(coordinate.latitude), \(coordinate.longitude)")

    // Move camera to user location
    mapView.camera.ease(to: CameraOptions(
        center: coordinate,
        zoom: 14
    ), duration: 1.0)
}
```

---

## Add Custom Data (GeoJSON)

Add your own data to the map using GeoJSON sources and layers.

### Add Line (Route, Path)

```swift
// Create coordinates for the line
let routeCoordinates = [
    CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
    CLLocationCoordinate2D(latitude: 37.7849, longitude: -122.4094),
    CLLocationCoordinate2D(latitude: 37.7949, longitude: -122.3994)
]

// Create GeoJSON source
var source = GeoJSONSource(id: "route-source")
source.data = .geometry(.lineString(LineString(routeCoordinates)))

try? mapView.mapboxMap.addSource(source)

// Create line layer
var layer = LineLayer(id: "route-layer", source: "route-source")
layer.lineColor = .constant(StyleColor(.blue))
layer.lineWidth = .constant(4)
layer.lineCap = .constant(.round)
layer.lineJoin = .constant(.round)

try? mapView.mapboxMap.addLayer(layer)
```

### Add Polygon (Area)

```swift
let polygonCoordinates = [coord1, coord2, coord3, coord1] // Close the polygon

var source = GeoJSONSource(id: "area-source")
source.data = .geometry(.polygon(Polygon([polygonCoordinates])))

try? mapView.mapboxMap.addSource(source)

var fillLayer = FillLayer(id: "area-fill", source: "area-source")
fillLayer.fillColor = .constant(StyleColor(.blue.withAlphaComponent(0.3)))
fillLayer.fillOutlineColor = .constant(StyleColor(.blue))

try? mapView.mapboxMap.addLayer(fillLayer)
```

### Add Points from GeoJSON

```swift
let geojsonString = """
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [-122.4194, 37.7749]},
      "properties": {"name": "Location 1"}
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [-122.4094, 37.7849]},
      "properties": {"name": "Location 2"}
    }
  ]
}
"""

var source = GeoJSONSource(id: "points-source")
source.data = .string(geojsonString)

try? mapView.mapboxMap.addSource(source)

var symbolLayer = SymbolLayer(id: "points-layer", source: "points-source")
symbolLayer.iconImage = .constant(.name("marker"))
symbolLayer.textField = .constant(.expression(Exp(.get) { "name" }))
symbolLayer.textOffset = .constant([0, 1.5])

try? mapView.mapboxMap.addLayer(symbolLayer)
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

---

## User Interaction & Feature Taps

### Featureset Interactions (Recommended)

The modern Interactions API allows handling taps on map features with typed feature access. Works with Standard Style predefined featuresets like POIs, buildings, and place labels.

**SwiftUI Pattern:**

```swift
import SwiftUI
import MapboxMaps

struct MapView: View {
    @State private var viewport: Viewport = .camera(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        zoom: 12
    )
    @State private var selectedBuildings = [StandardBuildingsFeature]()

    var body: some View {
        Map(viewport: $viewport) {
            // Tap on POI features
            TapInteraction(.standardPoi) { poi, context in
                print("Tapped POI: \(poi.name ?? "Unknown")")
                return true // Stop propagation
            }

            // Tap on buildings and collect selected buildings
            TapInteraction(.standardBuildings) { building, context in
                print("Tapped building")
                selectedBuildings.append(building)
                return true
            }

            // Apply feature state to selected buildings (highlighting)
            ForEvery(selectedBuildings, id: \.id) { building in
                FeatureState(building, .init(select: true))
            }
        }
        .mapStyle(.standard)
    }
}
```

**UIKit Pattern:**

```swift
import MapboxMaps
import Combine

class MapViewController: UIViewController {
    private var mapView: MapView!
    private var cancelables = Set<AnyCancellable>()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupMap()
        setupInteractions()
    }

    func setupInteractions() {
        // Tap on POI features
        let poiToken = mapView.mapboxMap.addInteraction(
            TapInteraction(.standardPoi) { [weak self] poi, context in
                print("Tapped POI: \(poi.name ?? "Unknown")")
                return true
            }
        )

        // Tap on buildings
        let buildingToken = mapView.mapboxMap.addInteraction(
            TapInteraction(.standardBuildings) { [weak self] building, context in
                print("Tapped building")

                // Highlight the building using feature state
                self?.mapView.mapboxMap.setFeatureState(
                    building,
                    state: ["select": true]
                )
                return true
            }
        )

        // Store tokens to keep interactions active
        // Cancel tokens when done: poiToken.cancel()
    }
}
```

### Tap on Custom Layers

```swift
let token = mapView.mapboxMap.addInteraction(
    TapInteraction(.layer("custom-layer-id")) { feature, context in
        if let properties = feature.properties {
            print("Feature properties: \(properties)")
        }
        return true
    }
)
```

### Long Press Interactions

```swift
let token = mapView.mapboxMap.addInteraction(
    LongPressInteraction(.standardPoi) { poi, context in
        print("Long pressed POI: \(poi.name ?? "Unknown")")
        return true
    }
)
```

### Handle Map Taps (Empty Space)

```swift
// UIKit
mapView.gestures.onMapTap.observe { [weak self] context in
    let coordinate = context.coordinate
    print("Tapped map at: \(coordinate.latitude), \(coordinate.longitude)")
}.store(in: &cancelables)
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

## Additional Resources

- [iOS Maps Guides](https://docs.mapbox.com/ios/maps/guides/)
- [API Reference](https://docs.mapbox.com/ios/maps/api/11.18.1/documentation/mapboxmaps/)
- [Interactions Guide](https://docs.mapbox.com/ios/maps/guides/user-interaction/Interactions/)
- [SwiftUI User Guide](https://docs.mapbox.com/ios/maps/api/11.18.1/documentation/mapboxmaps/swiftui-user-guide)
- [Example Apps](https://github.com/mapbox/mapbox-maps-ios/tree/main/Sources/Examples)
- [Migration Guide (v10 → v11)](https://docs.mapbox.com/ios/maps/guides/migrate-to-v11/)
