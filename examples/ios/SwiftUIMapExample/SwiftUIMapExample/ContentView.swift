/**
 * ContentView - Main view demonstrating MapView usage
 *
 * Shows how to use the MapView component with @State bindings
 * for reactive camera updates.
 */

import SwiftUI
import CoreLocation

struct ContentView: View {
    // MARK: - State

    @State private var coordinate = CLLocationCoordinate2D(
        latitude: 37.7749,
        longitude: -122.4194
    )
    @State private var zoom: CGFloat = 12

    // MARK: - Body

    var body: some View {
        ZStack {
            // Map fills entire screen
            MapView(coordinate: $coordinate, zoom: $zoom)
                .edgesIgnoringSafeArea(.all)

            // Overlay UI
            VStack {
                // Title card
                VStack(spacing: 4) {
                    Text("San Francisco")
                        .font(.headline)
                        .fontWeight(.semibold)

                    Text("Following mapbox-ios-patterns")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial)
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)

                Spacer()

                // Optional: Camera control buttons
                HStack(spacing: 16) {
                    Button {
                        // Zoom in
                        withAnimation {
                            zoom = min(zoom + 1, 22)
                        }
                    } label: {
                        Image(systemName: "plus")
                            .font(.title2)
                            .frame(width: 44, height: 44)
                            .background(.ultraThinMaterial)
                            .cornerRadius(22)
                    }

                    Button {
                        // Zoom out
                        withAnimation {
                            zoom = max(zoom - 1, 0)
                        }
                    } label: {
                        Image(systemName: "minus")
                            .font(.title2)
                            .frame(width: 44, height: 44)
                            .background(.ultraThinMaterial)
                            .cornerRadius(22)
                    }

                    Button {
                        // Reset to San Francisco
                        withAnimation {
                            coordinate = CLLocationCoordinate2D(
                                latitude: 37.7749,
                                longitude: -122.4194
                            )
                            zoom = 12
                        }
                    } label: {
                        Image(systemName: "location.fill")
                            .font(.title2)
                            .frame(width: 44, height: 44)
                            .background(.ultraThinMaterial)
                            .cornerRadius(22)
                    }
                }
                .padding(.bottom, 32)
            }
            .padding()
        }
    }
}

// MARK: - Preview

#Preview {
    ContentView()
}
