# Location Tracking: Camera Follow User + Get Current Location

Advanced location patterns beyond basic user location display (covered in SKILL.md).

---

## Camera Follow User Location

**SwiftUI — use `Viewport.followPuck`:**

```swift
struct TrackingView: View {
    @State private var viewport: Viewport = .followPuck(zoom: 16, bearing: .heading, pitch: 45)

    var body: some View {
        Map(viewport: $viewport) {
            Puck2D(bearing: .heading)
        }
    }
}
```

**UIKit:**

```swift
import Combine

class MapViewController: UIViewController {
    private var mapView: MapView!
    private var cancelables = Set<AnyCancellable>()

    func setupLocationTracking() {
        let locationManager = CLLocationManager()
        locationManager.requestWhenInUseAuthorization()

        mapView.location.options.puckType = .puck2D()
        mapView.location.options.puckBearingEnabled = true

        mapView.location.onLocationChange.observe { [weak self] locations in
            guard let self, let location = locations.last else { return }
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

---

## Get Current Location Once

```swift
// UIKit
if let location = mapView.location.latestLocation {
    let coordinate = location.coordinate
    mapView.camera.ease(to: CameraOptions(center: coordinate, zoom: 14), duration: 1.0)
}

// SwiftUI — fly to user location on button tap
Button("My Location") {
    if let location = /* inject LocationManager */ {
        withViewportAnimation(.fly) {
            viewport = .camera(center: location.coordinate, zoom: 14)
        }
    }
}
```
