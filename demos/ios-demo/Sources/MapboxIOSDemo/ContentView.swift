import SwiftUI
import MapboxMaps
import CoreLocation

struct ContentView: View {
    @State private var viewport: Viewport = .camera(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        zoom: 12
    )

    @State private var selectedFeature: String = ""
    @State private var followUserLocation: Bool = false

    var body: some View {
        ZStack(alignment: .bottom) {
            // Demonstrate: Map with Standard style (recommended)
            Map(viewport: $viewport) {
                // Demonstrate: Add Markers - Multiple point annotations
                PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194))
                    .iconImage("marker")

                PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7849, longitude: -122.4094))
                    .iconImage("marker")

                PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7649, longitude: -122.4294))
                    .iconImage("marker")

                // Demonstrate: Featureset Interactions - Tap on POIs
                TapInteraction(.featureset(.standardPoi)) { feature, context in
                    if let poi = feature as? StandardPoiFeature {
                        selectedFeature = "Tapped POI: \(poi.name ?? "Unknown")"
                    }
                    return true
                }

                // Demonstrate: Featureset Interactions - Tap on buildings
                TapInteraction(.featureset(.standardBuildings)) { feature, context in
                    if let building = feature as? StandardBuildingsFeature {
                        selectedFeature = "Tapped Building"
                        // Demonstrate: Feature state management
                        building.setFeatureState(StandardBuildingsState { state in
                            state.select(true)
                        })
                    }
                    return true
                }
            }
            .mapStyle(.standard) // Demonstrate: Standard style (recommended)
            .ignoresSafeArea()

            // UI Controls
            VStack(spacing: 12) {
                // Show selected feature info
                if !selectedFeature.isEmpty {
                    Text(selectedFeature)
                        .font(.headline)
                        .padding()
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(8)
                        .shadow(radius: 4)
                }

                // Control buttons
                HStack(spacing: 12) {
                    // User location button
                    Button(action: {
                        followUserLocation.toggle()
                        if followUserLocation {
                            // Demonstrate: Move camera to user location
                            // Note: In a full implementation, observe location updates
                            // and update viewport state
                        }
                    }) {
                        Label(
                            followUserLocation ? "Stop Following" : "Follow Location",
                            systemImage: followUserLocation ? "location.fill" : "location"
                        )
                        .padding()
                        .background(followUserLocation ? Color.blue : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }

                    // Reset view button
                    Button(action: {
                        // Demonstrate: Animated camera transition
                        viewport = .camera(
                            center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
                            zoom: 13,
                            bearing: 0,
                            pitch: 0
                        )
                        selectedFeature = ""
                    }) {
                        Label("Reset View", systemImage: "arrow.counterclockwise")
                            .padding()
                            .background(Color.gray)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }

                // Instructions
                Text("Tap on map POIs or buildings to interact")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal)
            }
            .padding()
        }
        .onAppear {
            // Demonstrate: Request location permissions
            let locationManager = CLLocationManager()
            locationManager.requestWhenInUseAuthorization()
        }
    }
}

#Preview {
    ContentView()
}
