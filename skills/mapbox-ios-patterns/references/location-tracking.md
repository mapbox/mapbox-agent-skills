# Location Tracking: Camera Follow User + Get Current Location

Advanced location patterns beyond basic user location display (covered in SKILL.md).

---

## Camera Follow User Location

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

## Get Current Location Once

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
