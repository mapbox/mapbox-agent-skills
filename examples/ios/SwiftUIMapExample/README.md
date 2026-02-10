# SwiftUI Map Example

A SwiftUI application demonstrating proper Mapbox Maps SDK integration following the **mapbox-ios-patterns** skill.

## Patterns Demonstrated

✅ **UIViewRepresentable pattern** - Proper SwiftUI integration
✅ **Token security** - Using .xcconfig for secure token storage
✅ **Lifecycle management** - Automatic cleanup by SwiftUI
✅ **State binding** - Reactive camera updates
✅ **Memory safety** - No retain cycles

## What This Example Shows

This example demonstrates the **fundamental pattern** for integrating Mapbox Maps SDK in SwiftUI:

- UIViewRepresentable for bridging UIKit → SwiftUI
- Secure token management with .xcconfig
- @Binding for reactive state updates
- Proper Coordinator pattern for event handling

## Prerequisites

- macOS 14.0+ (Sonoma) or later
- Xcode 15.0 or later
- iOS 14.0+ deployment target
- A Mapbox access token ([get one free](https://account.mapbox.com/access-tokens/))

## Setup

### 1. Install Dependencies

This project uses Swift Package Manager. Dependencies will be fetched automatically when you open the project in Xcode.

Or manually add:

```
https://github.com/mapbox/mapbox-maps-ios.git
Version: 11.0.0 or later
```

### 2. Configure Access Token (Secure Pattern)

Following **mapbox-token-security** skill:

**Create `Config/Secrets.xcconfig`:**

```bash
MAPBOX_ACCESS_TOKEN = pk.your_actual_token_here
```

**Add to `.gitignore`:**

```
Config/Secrets.xcconfig
```

**Link in Xcode:**

1. Select project → Info tab → Configurations
2. Set `Secrets` for Debug and Release configurations

**Update `Info.plist`:**

```xml
<key>MBXAccessToken</key>
<string>$(MAPBOX_ACCESS_TOKEN)</string>
```

### 3. Run

1. Open `SwiftUIMapExample.xcodeproj` in Xcode
2. Select your device or simulator
3. Press ⌘R to build and run

## Project Structure

```
SwiftUIMapExample/
├── SwiftUIMapExample/
│   ├── SwiftUIMapExampleApp.swift    # App entry point
│   ├── ContentView.swift             # Main view with map
│   ├── MapView.swift                 # Reusable map component
│   ├── Info.plist                    # Token configuration
│   └── Assets.xcassets
├── Config/
│   ├── Secrets.xcconfig              # Token storage (gitignored)
│   └── Secrets.xcconfig.example      # Example file
└── README.md
```

## Key Implementation Details

### MapView.swift - UIViewRepresentable Pattern

This is the core pattern from **mapbox-ios-patterns**:

```swift
import SwiftUI
import MapboxMaps

struct MapView: UIViewRepresentable {
    @Binding var coordinate: CLLocationCoordinate2D
    @Binding var zoom: CGFloat

    // Create the MapView (called once)
    func makeUIView(context: Context) -> MapboxMap.MapView {
        let mapView = MapboxMap.MapView(frame: .zero)

        mapView.mapboxMap.setCamera(
            to: CameraOptions(
                center: coordinate,
                zoom: zoom
            )
        )

        return mapView
    }

    // Update when SwiftUI state changes
    func updateUIView(_ mapView: MapboxMap.MapView, context: Context) {
        mapView.mapboxMap.setCamera(
            to: CameraOptions(
                center: coordinate,
                zoom: zoom
            )
        )
    }

    // Coordinator for handling map events
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject {
        var parent: MapView

        init(_ parent: MapView) {
            self.parent = parent
        }
    }
}
```

### ContentView.swift - Using the Map

```swift
import SwiftUI
import CoreLocation

struct ContentView: View {
    @State private var coordinate = CLLocationCoordinate2D(
        latitude: 37.7749,
        longitude: -122.4194
    )
    @State private var zoom: CGFloat = 12

    var body: some View {
        ZStack {
            MapView(coordinate: $coordinate, zoom: $zoom)
                .edgesIgnoringSafeArea(.all)

            VStack {
                Text("San Francisco")
                    .font(.headline)
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(8)

                Spacer()
            }
            .padding()
        }
    }
}
```

## Key Points from mapbox-ios-patterns

✅ **Lifecycle Management:**

- SwiftUI automatically manages MapView lifecycle
- No manual deinitialization needed
- UIViewRepresentable handles creation and cleanup

✅ **Token Security:**

- Token in `.xcconfig` (not in code)
- `.xcconfig` in `.gitignore`
- Accessed via `Info.plist` at runtime

✅ **State Management:**

- Use `@Binding` for reactive updates
- Camera updates when SwiftUI state changes
- No manual observer patterns needed

✅ **Memory Safety:**

- Coordinator pattern prevents retain cycles
- SwiftUI handles deallocation automatically
- No weak/unowned references needed in basic usage

## Common Modifications

### Adding Annotations

```swift
func updateUIView(_ mapView: MapboxMap.MapView, context: Context) {
    // Update camera
    mapView.mapboxMap.setCamera(
        to: CameraOptions(center: coordinate, zoom: zoom)
    )

    // Add annotation
    var pointAnnotationManager = mapView.annotations.makePointAnnotationManager()

    var annotation = PointAnnotation(coordinate: coordinate)
    annotation.image = .init(image: UIImage(systemName: "mappin")!, name: "marker")
    annotation.textField = "San Francisco"

    pointAnnotationManager.annotations = [annotation]
}
```

### Handling User Interactions

```swift
class Coordinator: NSObject {
    var parent: MapView

    init(_ parent: MapView) {
        self.parent = parent
        super.init()
    }

    func handleMapTap(coordinate: CLLocationCoordinate2D) {
        // Update parent's bound state
        parent.coordinate = coordinate
    }
}
```

### Custom Style

```swift
func makeUIView(context: Context) -> MapboxMap.MapView {
    let mapView = MapboxMap.MapView(frame: .zero)

    mapView.mapboxMap.loadStyleURI(.dark) { result in
        switch result {
        case .success:
            print("Style loaded")
        case .failure(let error):
            print("Error loading style: \\(error)")
        }
    }

    return mapView
}
```

## Testing

To verify proper implementation:

1. **Rotation** - Rotate device, map should survive
2. **Navigation** - Push/pop views, no memory leaks
3. **State updates** - Change coordinate/zoom, map updates
4. **Instruments** - Run Leaks instrument, verify no leaks

## Skills Reference

This example follows patterns from:

- **mapbox-ios-patterns** - SwiftUI integration patterns
- **mapbox-token-security** - Secure token storage

## Next Steps

Once you have this basic pattern working:

- Add **offline maps** - Download regions for offline use
- Add **navigation** - Integrate Navigation SDK
- Custom **styling** - Use mapbox-cartography patterns
- **Performance** - Battery optimization patterns

See **mapbox-ios-patterns** skill for implementation details.

## Troubleshooting

**Map not showing?**

- Verify `MAPBOX_ACCESS_TOKEN` is set in `Config/Secrets.xcconfig`
- Check `Info.plist` has `MBXAccessToken` key
- Verify token has required scopes
- Check Xcode console for errors

**Token not found?**

- Ensure `Secrets.xcconfig` is linked in Project Settings → Configurations
- Clean build folder (⇧⌘K) and rebuild

**Memory issues?**

- SwiftUI handles cleanup automatically
- Check for strong reference cycles in Coordinator
- Use Instruments → Leaks to diagnose

**Build errors?**

- Update to Xcode 15+
- Verify iOS deployment target is 14.0+
- Clean derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
