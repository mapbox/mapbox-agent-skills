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
            Map(viewport: $viewport) {
                // Demonstrate: Add Markers
                PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194))
                    .iconImage("marker")

                PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7849, longitude: -122.4094))
                    .iconImage("marker")

                PointAnnotation(coordinate: CLLocationCoordinate2D(latitude: 37.7649, longitude: -122.4294))
                    .iconImage("marker")

                // Demonstrate: Featureset Interactions
                TapInteraction(.featureset(.standardPoi)) { feature, context in
                    if let poi = feature as? StandardPoiFeature {
                        selectedFeature = "Tapped POI: \(poi.name ?? "Unknown")"
                    }
                    return true
                }

                TapInteraction(.featureset(.standardBuildings)) { feature, context in
                    if let building = feature as? StandardBuildingsFeature {
                        selectedFeature = "Tapped Building"
                        building.setFeatureState(StandardBuildingsState { state in
                            state.select(true)
                        })
                    }
                    return true
                }
            }
            .mapStyle(.standard) // Demonstrate: Standard style (recommended)
            .ignoresSafeArea()

            // Info panel
            VStack(spacing: 12) {
                if !selectedFeature.isEmpty {
                    Text(selectedFeature)
                        .padding()
                        .background(Color.white)
                        .cornerRadius(8)
                        .shadow(radius: 4)
                }

                HStack {
                    Button(action: {
                        followUserLocation.toggle()
                    }) {
                        Label(
                            followUserLocation ? "Stop Following" : "Follow Location",
                            systemImage: followUserLocation ? "location.fill" : "location"
                        )
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }

                    Button(action: {
                        // Demonstrate: Fit camera to coordinates
                        viewport = .camera(
                            center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
                            zoom: 13
                        )
                    }) {
                        Label("Reset View", systemImage: "arrow.counterclockwise")
                            .padding()
                            .background(Color.gray)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
            }
            .padding()
        }
        .onAppear {
            // Request location permissions
            let locationManager = CLLocationManager()
            locationManager.requestWhenInUseAuthorization()
        }
    }
}

// For UIKit version with more features (user location follow, custom data)
class MapViewController: UIViewController {
    private var mapView: MapView!
    private var cancelables = Set<AnyCancellable>()
    private var pointAnnotationManager: PointAnnotationManager!

    override func viewDidLoad() {
        super.viewDidLoad()

        setupMap()
        setupMarkers()
        setupCustomData()
        setupLocationTracking()
        setupFeatureInteractions()
    }

    private func setupMap() {
        // Demonstrate: Map initialization
        let options = MapInitOptions(
            cameraOptions: CameraOptions(
                center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
                zoom: 12
            )
        )

        mapView = MapView(frame: view.bounds, mapInitOptions: options)
        mapView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(mapView)

        mapView.mapboxMap.loadStyle(.standard) // Demonstrate: Standard style
    }

    private func setupMarkers() {
        // Demonstrate: Add multiple markers
        pointAnnotationManager = mapView.annotations.makePointAnnotationManager()

        let locations = [
            CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
            CLLocationCoordinate2D(latitude: 37.7849, longitude: -122.4094),
            CLLocationCoordinate2D(latitude: 37.7649, longitude: -122.4294)
        ]

        let annotations = locations.map { coordinate in
            var annotation = PointAnnotation(coordinate: coordinate)
            // Note: In a real app, add custom marker image
            return annotation
        }

        pointAnnotationManager.annotations = annotations
    }

    private func setupCustomData() {
        // Demonstrate: Add custom GeoJSON data (route line)
        mapView.mapboxMap.onStyleLoaded.observe { [weak self] _ in
            guard let self = self else { return }

            let routeCoordinates = [
                CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
                CLLocationCoordinate2D(latitude: 37.7849, longitude: -122.4094),
                CLLocationCoordinate2D(latitude: 37.7949, longitude: -122.3994)
            ]

            var source = GeoJSONSource(id: "route-source")
            source.data = .geometry(.lineString(LineString(routeCoordinates)))

            try? self.mapView.mapboxMap.addSource(source)

            var layer = LineLayer(id: "route-layer", source: "route-source")
            layer.lineColor = .constant(StyleColor(.blue))
            layer.lineWidth = .constant(4)
            layer.lineCap = .constant(.round)
            layer.lineJoin = .constant(.round)

            try? self.mapView.mapboxMap.addLayer(layer)
        }.store(in: &cancelables)
    }

    private func setupLocationTracking() {
        // Demonstrate: User location with camera follow
        let locationManager = CLLocationManager()
        locationManager.requestWhenInUseAuthorization()

        mapView.location.options.puckType = .puck2D()
        mapView.location.options.puckBearingEnabled = true

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

    private func setupFeatureInteractions() {
        // Demonstrate: Featureset interactions
        let poiToken = mapView.mapboxMap.addInteraction(
            TapInteraction(.featureset(.standardPoi)) { [weak self] feature, context in
                guard let poi = feature as? StandardPoiFeature else { return false }
                print("Tapped POI: \(poi.name ?? "Unknown")")
                return true
            }
        )

        let buildingToken = mapView.mapboxMap.addInteraction(
            TapInteraction(.featureset(.standardBuildings)) { [weak self] feature, context in
                guard let building = feature as? StandardBuildingsFeature else { return false }
                print("Tapped building")

                self?.mapView.mapboxMap.setFeatureState(
                    building,
                    StandardBuildingsState { state in
                        state.select(true)
                    }
                )
                return true
            }
        )
    }
}

#Preview {
    ContentView()
}
