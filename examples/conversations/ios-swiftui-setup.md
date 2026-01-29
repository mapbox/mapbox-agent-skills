# Conversation Example: iOS SwiftUI Setup

This conversation demonstrates how the **mapbox-ios-patterns** skill helps set up Mapbox Maps SDK in a SwiftUI app with proper lifecycle management.

## Skills Used

- 📱 **mapbox-ios-patterns** - Provides SwiftUI UIViewRepresentable pattern and lifecycle management
- 🔐 **mapbox-token-security** - Guides secure token storage in iOS apps

---

## Conversation

### User
> I need to add a Mapbox map to my SwiftUI app. Can you show me how to do this correctly?

### AI Assistant

I'll help you integrate Mapbox Maps SDK into your SwiftUI app using the correct patterns from the **mapbox-ios-patterns** skill.

### Step 1: Install Mapbox Maps SDK

First, add the SDK via Swift Package Manager in Xcode:

1. File → Add Package Dependencies
2. Enter: `https://github.com/mapbox/mapbox-maps-ios.git`
3. Select "Up to Next Major Version" with version 11.0.0

Or add to your `Package.swift`:
```swift
dependencies: [
    .package(url: "https://github.com/mapbox/mapbox-maps-ios.git", from: "11.0.0")
]
```

### Step 2: Configure Your Access Token (Secure Pattern)

**Following the mapbox-token-security skill**, we'll store your token securely using a `.xcconfig` file:

**Create `Config/Secrets.xcconfig`:**
```bash
MAPBOX_ACCESS_TOKEN = pk.your_actual_token_here
```

**Add to `.gitignore`:**
```
Config/Secrets.xcconfig
```

**Update `Info.plist`:**
```xml
<key>MBXAccessToken</key>
<string>$(MAPBOX_ACCESS_TOKEN)</string>
```

**Link in Xcode Project Settings:**
- Select your project → Info → Configurations
- Set Secrets.xcconfig for Debug and Release

This keeps your token out of source control while making it available to the app at runtime.

### Step 3: Create SwiftUI Map Component

**Following the UIViewRepresentable pattern from mapbox-ios-patterns:**

```swift
import SwiftUI
import MapboxMaps

struct MapView: UIViewRepresentable {
    // MARK: - Bindable State
    @Binding var coordinate: CLLocationCoordinate2D
    @Binding var zoom: CGFloat

    // MARK: - UIViewRepresentable Methods

    func makeUIView(context: Context) -> MapboxMap.MapView {
        let mapView = MapboxMap.MapView(frame: .zero)

        // Configure initial camera position
        mapView.mapboxMap.setCamera(
            to: CameraOptions(
                center: coordinate,
                zoom: zoom
            )
        )

        // Set up gesture recognizers if needed
        mapView.gestures.options.panEnabled = true
        mapView.gestures.options.pinchEnabled = true

        return mapView
    }

    func updateUIView(_ mapView: MapboxMap.MapView, context: Context) {
        // Update map when SwiftUI state changes
        mapView.mapboxMap.setCamera(
            to: CameraOptions(
                center: coordinate,
                zoom: zoom
            )
        )
    }

    // MARK: - Coordinator for Handling Map Events

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

### Step 4: Use in Your SwiftUI View

```swift
struct ContentView: View {
    @State private var coordinate = CLLocationCoordinate2D(
        latitude: 37.7749,
        longitude: -122.4194
    )
    @State private var zoom: CGFloat = 12

    var body: some View {
        VStack {
            // Map takes full available space
            MapView(coordinate: $coordinate, zoom: $zoom)
                .edgesIgnoringSafeArea(.all)

            // Optional: Controls overlay
            VStack {
                Text("San Francisco")
                    .font(.headline)
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(8)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .padding()
        }
    }
}
```

### Key Points from mapbox-ios-patterns

✅ **Proper Lifecycle Management:**
- SwiftUI automatically handles map lifecycle through UIViewRepresentable
- No manual cleanup needed - SwiftUI handles deinitialization

✅ **State Binding:**
- Use `@Binding` for reactive state management
- Map updates automatically when SwiftUI state changes

✅ **Token Security:**
- Token stored in `.xcconfig` (not in code)
- `.xcconfig` added to `.gitignore`
- Token accessed via `Info.plist` at runtime

✅ **Memory Management:**
- No retain cycles - Coordinator pattern properly manages references
- SwiftUI handles map view deallocation automatically

### Optional: Adding Markers

If you need to add annotations:

```swift
struct MapView: UIViewRepresentable {
    var annotations: [RestaurantAnnotation]

    func updateUIView(_ mapView: MapboxMap.MapView, context: Context) {
        // Update camera
        mapView.mapboxMap.setCamera(to: CameraOptions(center: coordinate, zoom: zoom))

        // Update annotations
        var pointAnnotationManager = mapView.annotations.makePointAnnotationManager()

        let pointAnnotations = annotations.map { restaurant in
            var annotation = PointAnnotation(coordinate: restaurant.coordinate)
            annotation.image = .init(image: UIImage(named: "restaurant-marker")!, name: "restaurant")
            annotation.textField = restaurant.name
            return annotation
        }

        pointAnnotationManager.annotations = pointAnnotations
    }
}
```

### Testing

Run your app and you should see:
- Map loads immediately
- Pan and zoom gestures work smoothly
- No memory leaks (verify in Instruments)
- No crashes when navigating away

### Next Steps

Based on your needs, you might want to add:
- **Offline maps** - See offline patterns in mapbox-ios-patterns skill
- **Turn-by-turn navigation** - Navigation SDK integration patterns
- **Custom styles** - Use mapbox-cartography and mapbox-style-patterns skills

Does this help? Let me know if you need to add any specific features!

---

## Skills Application Analysis

### How the skill helped:

1. **Provided correct pattern** - UIViewRepresentable is the proper way to integrate UIKit views in SwiftUI
2. **Security guidance** - Showed secure token storage using .xcconfig instead of hardcoding
3. **Lifecycle management** - Explained how SwiftUI handles map lifecycle automatically
4. **Memory safety** - Used proper Coordinator pattern to avoid retain cycles
5. **Complete example** - Included all necessary imports, state management, and usage

### Without the skill:

An AI assistant without the skill might:
- Suggest outdated patterns or deprecated APIs
- Hardcode the access token in source code (security risk)
- Not explain lifecycle management properly
- Create memory leaks with improper reference handling
- Miss SwiftUI-specific patterns like @Binding

### Common mistakes avoided:

❌ Hardcoding token: `ResourceOptionsManager.default.resourceOptions.accessToken = "pk.xyz"`
❌ Manual deinitialization in SwiftUI context
❌ Not using @Binding for reactive updates
❌ Creating retain cycles with strong Coordinator references

### Result:

The skill-enhanced AI provided a complete, secure, SwiftUI-idiomatic implementation following Apple's best practices and Mapbox's recommended patterns.
