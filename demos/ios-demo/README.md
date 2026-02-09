# Mapbox iOS Demo App

Pure SwiftUI demo app showcasing modern integration patterns from the `mapbox-ios-patterns` skill.

## Features Demonstrated

This app demonstrates key patterns using **SwiftUI only** (the modern, recommended approach):

1. ✅ **Map Initialization** - Native SwiftUI Map with Standard style
2. ✅ **Add Markers** - Declarative PointAnnotation components
3. ✅ **Featureset Interactions** - TapInteraction for POIs and buildings
4. ✅ **Feature State Management** - Building highlighting on tap
5. ✅ **Camera Control** - Viewport state management with animations
6. ✅ **Location Permissions** - Proper iOS permission handling

## Setup

### Prerequisites
- Xcode 15+
- iOS 13+
- Swift 5.9+
- Mapbox account (free)

### Installation

1. **Get your Mapbox access token:**
   - Sign in at [mapbox.com](https://account.mapbox.com/access-tokens/)
   - Copy your **public token** (starts with `pk.`)

2. **Configure the token:**
   - Open `Sources/MapboxIOSDemo/Info.plist`
   - Replace `YOUR_MAPBOX_ACCESS_TOKEN` with your actual token

3. **Install dependencies:**
   ```bash
   cd demos/ios-demo
   swift package resolve
   ```

4. **Open in Xcode:**
   ```bash
   open Package.swift
   ```

5. **Run the app:**
   - Select a simulator or device (iOS 13+)
   - Press Cmd+R to build and run

## Code Structure

```
Sources/MapboxIOSDemo/
├── MapboxIOSDemoApp.swift    # App entry point
├── ContentView.swift          # Main map view (Pure SwiftUI)
└── Info.plist                 # Token configuration
```

## Implementation Details

### Pure SwiftUI Approach
This demo uses **only SwiftUI** - the modern, declarative approach for iOS:

```swift
Map(viewport: $viewport) {
    PointAnnotation(coordinate: location)
        .iconImage("marker")

    TapInteraction(.featureset(.standardPoi)) { poi, context in
        // Handle POI taps
        return true
    }
}
.mapStyle(.standard)
```

**Why SwiftUI?**
- ✅ Modern, declarative API (v11+)
- ✅ Simpler code, less boilerplate
- ✅ Better integration with iOS ecosystem
- ✅ Recommended by Apple and Mapbox

## Patterns from Skill

All code follows patterns from: `skills/mapbox-ios-patterns/SKILL.md`

| Pattern | Implementation |
|---------|----------------|
| Standard Style | `.mapStyle(.standard)` |
| Native Map | `Map(viewport: $viewport)` |
| Markers | `PointAnnotation(coordinate:)` |
| Featureset Interactions | `TapInteraction(.featureset())` |
| Feature State | `setFeatureState()` |
| Camera Control | Viewport state binding |
| Permissions | CLLocationManager |

## Testing

1. **Map displays** - Standard style loads with San Francisco view
2. **Markers visible** - Three markers at different locations
3. **POI taps** - Tap on restaurants, shops, etc. Shows name
4. **Building taps** - Tap on buildings, they highlight
5. **Reset button** - Returns to initial view with animation

## Troubleshooting

**Map not displaying:**
- ✅ Check `MBXAccessToken` in Info.plist is a valid **public token** (pk.*)
- ✅ Token must be valid (test at mapbox.com)
- ✅ Check internet connection

**Build errors:**
- ✅ Run `swift package resolve`
- ✅ Clean build folder: Product → Clean Build Folder (Shift+Cmd+K)
- ✅ Minimum iOS 13 required

**Markers not showing:**
- ✅ Default "marker" icon is used - may need custom images for visibility
- ✅ Zoom in to see markers better

## Resources

- [iOS Skill Documentation](../../skills/mapbox-ios-patterns/SKILL.md)
- [iOS Maps Guides](https://docs.mapbox.com/ios/maps/guides/)
- [SwiftUI User Guide](https://docs.mapbox.com/ios/maps/api/11.18.1/documentation/mapboxmaps/swiftui-user-guide)
- [Interactions Guide](https://docs.mapbox.com/ios/maps/guides/user-interaction/Interactions/)
- [API Reference](https://docs.mapbox.com/ios/maps/api-reference/)
