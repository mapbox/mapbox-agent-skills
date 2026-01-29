/**
 * MapView - Mapbox Maps SDK integration in SwiftUI
 *
 * This demonstrates the UIViewRepresentable pattern from mapbox-ios-patterns:
 * ✅ UIViewRepresentable bridges UIKit → SwiftUI
 * ✅ @Binding for reactive state management
 * ✅ Coordinator pattern for event handling
 * ✅ Automatic lifecycle management by SwiftUI
 * ✅ No manual cleanup needed
 */

import SwiftUI
import MapboxMaps
import CoreLocation

struct MapView: UIViewRepresentable {
    // MARK: - Bindings (reactive state)

    @Binding var coordinate: CLLocationCoordinate2D
    @Binding var zoom: CGFloat

    // MARK: - UIViewRepresentable Methods

    /// Creates the MapView (called once when view appears)
    func makeUIView(context: Context) -> MapboxMap.MapView {
        // Create map view
        let mapView = MapboxMap.MapView(frame: .zero)

        // Configure initial camera position
        mapView.mapboxMap.setCamera(
            to: CameraOptions(
                center: coordinate,
                zoom: zoom
            )
        )

        // Configure gestures
        mapView.gestures.options.panEnabled = true
        mapView.gestures.options.pinchEnabled = true
        mapView.gestures.options.rotateEnabled = true

        // Load style
        mapView.mapboxMap.loadStyleURI(.streets) { result in
            switch result {
            case .success:
                print("✅ Map style loaded successfully")
            case .failure(let error):
                print("❌ Error loading map style: \\(error)")
            }
        }

        return mapView
    }

    /// Updates MapView when SwiftUI state changes
    func updateUIView(_ mapView: MapboxMap.MapView, context: Context) {
        // Update camera when coordinate or zoom changes
        mapView.mapboxMap.setCamera(
            to: CameraOptions(
                center: coordinate,
                zoom: zoom
            )
        )
    }

    /// Creates Coordinator for handling map events
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    // MARK: - Coordinator

    /// Coordinator handles map events and updates parent state
    class Coordinator: NSObject {
        var parent: MapView

        init(_ parent: MapView) {
            self.parent = parent
        }

        // Add event handlers here if needed
        // Example: handle map tap, camera change, etc.
    }
}

// MARK: - Preview

#Preview {
    MapView(
        coordinate: .constant(CLLocationCoordinate2D(
            latitude: 37.7749,
            longitude: -122.4194
        )),
        zoom: .constant(12)
    )
}
