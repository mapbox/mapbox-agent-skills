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
    @State private var selectedBuildings = [StandardBuildingsFeature]()

    var body: some View {
        ZStack(alignment: .bottom) {
            // Demonstrate: Map with Standard style (recommended)
            Map(viewport: $viewport) {
                // Demonstrate: Show user location puck
                Puck2D()
                // Demonstrate: Add Markers - Multiple point annotations
                PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194))
                    .iconImage("marker")

                PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7849, longitude: -122.4094))
                    .iconImage("marker")

                PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7649, longitude: -122.4294))
                    .iconImage("marker")

                // Demonstrate: Featureset Interactions - Tap on POIs
                TapInteraction(.standardPoi) { poi, context in
                    selectedFeature = "Tapped POI: \(poi.name ?? "Unknown")"
                    return true
                }

                // Demonstrate: Featureset Interactions - Tap on buildings
                TapInteraction(.standardBuildings) { building, context in
                    selectedFeature = "Tapped Building"
                    // Demonstrate: Feature state management - highlight selected buildings
                    selectedBuildings.append(building)
                    return true
                }

                // Demonstrate: Feature State Management - Apply selection state to buildings
                ForEvery(selectedBuildings, id: \.id) { building in
                    FeatureState(building, .init(select: true))
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
                            // Demonstrate: Camera follows user location with bearing
                            viewport = .followPuck(zoom: 15, bearing: .heading, pitch: 45)
                        } else {
                            // Stop following and return to default view
                            viewport = .camera(
                                center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
                                zoom: 12
                            )
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
                        followUserLocation = false
                        viewport = .camera(
                            center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
                            zoom: 13,
                            bearing: 0,
                            pitch: 0
                        )
                        selectedFeature = ""
                        selectedBuildings = []
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
