# Interactions: Featureset, Custom Layer Taps, Long Press, Gestures

---

## Featureset Interactions (Recommended)

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

## Tap on Custom Layers

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

## Long Press Interactions

```swift
let token = mapView.mapboxMap.addInteraction(
    LongPressInteraction(.standardPoi) { poi, context in
        print("Long pressed POI: \(poi.name ?? "Unknown")")
        return true
    }
)
```

## Handle Map Taps (Empty Space)

```swift
// UIKit
mapView.gestures.onMapTap.observe { [weak self] context in
    let coordinate = context.coordinate
    print("Tapped map at: \(coordinate.latitude), \(coordinate.longitude)")
}.store(in: &cancelables)
```

## Gesture Configuration

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
