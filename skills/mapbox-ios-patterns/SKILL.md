---
name: mapbox-ios-patterns
description: Official integration patterns for Mapbox Maps SDK on iOS. Covers project setup, installation, adding markers, user location, custom data, styles, camera control, and featureset interactions. Based on official Mapbox documentation.
---

# Mapbox iOS Integration Patterns

Official patterns for integrating Mapbox Maps SDK v11 on iOS with Swift and SwiftUI.

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
- [SwiftUI User Guide](https://docs.mapbox.com/ios/maps/api/11.18.1/documentation/mapboxmaps/swiftui-user-guide)
- [Example Apps](https://github.com/mapbox/mapbox-maps-ios/tree/main/Sources/Examples)

---

## Project Setup

### Use an Xcode Project, Not a Bare SPM Package

Always create a proper Xcode project (`.xcodeproj`). A bare SPM package with `Package.swift` builds as a library — it cannot be launched as an iOS app from Xcode.

**Recommended: `xcodegen`**

`xcodegen` generates an `.xcodeproj` from a `project.yml` config file. Commit `project.yml`, gitignore the generated `.xcodeproj`.

```bash
brew install xcodegen
xcodegen generate
open MyApp.xcodeproj
```

Minimal `project.yml`:

```yaml
name: MyApp
options:
  bundleIdPrefix: com.example
  deploymentTarget:
    iOS: '16.0'

packages:
  MapboxMaps:
    url: https://github.com/mapbox/mapbox-maps-ios
    from: 11.0.0

targets:
  MyApp:
    type: application
    platform: iOS
    sources:
      - MyApp
    info:
      path: MyApp/Info.plist
      properties:
        UILaunchScreen: {}
    dependencies:
      - package: MapboxMaps
    settings:
      base:
        SWIFT_VERSION: '5.9'
        PRODUCT_BUNDLE_IDENTIFIER: com.example.MyApp
```

**Alternative: Add via Xcode**

In an existing Xcode project: File → Add Package Dependencies → enter `https://github.com/mapbox/mapbox-maps-ios.git` → "Up to Next Major" from `11.0.0`.

---

## Requirements

- iOS 16+ (recommended for full SwiftUI feature set; SDK minimum is iOS 14)
- Xcode 15+
- Swift 5.9+
- Free Mapbox account

---

## Access Token Setup

### Option A: Config.swift (recommended for xcodegen/SPM projects)

Create `Config.swift` (gitignored) and set the token explicitly in your `App` entry point:

```swift
// Config.swift — gitignored, never commit
enum Config {
    static let mapboxToken = "pk.your_token_here"
}
```

```swift
// MyApp.swift
import SwiftUI
import MapboxMaps

@main
struct MyApp: App {
    init() {
        MapboxOptions.accessToken = Config.mapboxToken
    }
    var body: some Scene {
        WindowGroup { ContentView() }
    }
}
```

Commit a `Config.swift.example` with a placeholder so others know what's needed.

### Option B: Info.plist (Xcode-managed projects only)

For traditional Xcode projects where Info.plist is managed by Xcode, the SDK reads `MBXAccessToken` automatically — no code needed:

```xml
<key>MBXAccessToken</key>
<string>pk.your_mapbox_token_here</string>
```

**Get your token:** Sign in at [mapbox.com](https://account.mapbox.com/access-tokens/)

---

## Map Initialization (SwiftUI — preferred)

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
            .ignoresSafeArea()
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

> Avoid `UIViewRepresentable` wrappers — use `Map(viewport:)` directly in SwiftUI views.

---

## Add Markers (Point Annotations)

**SwiftUI — single annotation:**

```swift
Map(viewport: $viewport) {
    PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194))
        .image(.init(image: UIImage(named: "marker")!, name: "marker"))
        .iconAnchor(.bottom)
        .onTapGesture {
            print("Marker tapped")
        }
}
```

**SwiftUI — multiple annotations from data:**

```swift
Map(viewport: $viewport) {
    PointAnnotationGroup(locations) { location in
        PointAnnotation(coordinate: location.coordinate)
            .image(.init(image: UIImage(named: "marker")!, name: "marker"))
            .onTapGesture {
                selectedLocation = location
            }
    }
}
```

**UIKit:**

```swift
// Create annotation manager once, reuse for updates
var pointAnnotationManager = mapView.annotations.makePointAnnotationManager()

var annotation = PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194))
annotation.image = .init(image: UIImage(named: "marker")!, name: "marker")
annotation.iconAnchor = .bottom

pointAnnotationManager.annotations = [annotation]
```

---

## Show User Location

**Step 1: Add location permission to Info.plist:**

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Show your location on the map</string>
```

**Step 2: SwiftUI — `Puck2D` inside `Map` content:**

```swift
Map(viewport: $viewport) {
    Puck2D(bearing: .heading)
}
```

**UIKit:**

```swift
let locationManager = CLLocationManager()
locationManager.requestWhenInUseAuthorization()

mapView.location.options.puckType = .puck2D()
mapView.location.options.puckBearingEnabled = true
```

---

## Performance Best Practices

### Reuse Annotation Managers (UIKit)

```swift
// ❌ Don't create new managers repeatedly
func updateMarkers() {
    let manager = mapView.annotations.makePointAnnotationManager()
    manager.annotations = markers
}

// ✅ Create once, reuse
var pointAnnotationManager: PointAnnotationManager

init() {
    pointAnnotationManager = mapView.annotations.makePointAnnotationManager()
}

func updateMarkers() {
    pointAnnotationManager.annotations = markers
}
```

### StyleColor

`StyleColor(red:green:blue:alpha:)` returns an optional — use `UIColor` instead:

```swift
// ❌ Returns StyleColor? — requires unwrapping
CircleAnnotation(...).circleColor(StyleColor(red: 0.44, green: 0.31, blue: 0.22, alpha: 1))

// ✅ Non-optional
CircleAnnotation(...).circleColor(StyleColor(UIColor(red: 0.44, green: 0.31, blue: 0.22, alpha: 1)))
```

---

## Troubleshooting

### Map Not Displaying

1. ✅ Token set via `MapboxOptions.accessToken` or `MBXAccessToken` in Info.plist
2. ✅ Token is valid (test at mapbox.com)
3. ✅ MapboxMaps framework imported
4. ✅ For UIKit: MapView added to view hierarchy with correct frame

### Style Not Loading (UIKit)

```swift
mapView.mapboxMap.onStyleLoaded.observe { [weak self] _ in
    // Add layers and sources here
}.store(in: &cancelables)
```

---

## Reference Files

Load these when the task requires deeper patterns:

- **`references/annotations.md`** — Circle, Polyline, Polygon Annotations (SwiftUI + UIKit)
- **`references/location-tracking.md`** — Camera Follow User + Get Current Location
- **`references/custom-data.md`** — GeoJSON: Lines, Polygons, Points, Update/Remove
- **`references/camera-styles.md`** — Camera Control + Map Styles
- **`references/interactions.md`** — Featureset Interactions, Custom Layer Taps, Long Press, Gestures
