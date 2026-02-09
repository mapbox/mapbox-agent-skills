# Mapbox iOS Demo App

Demo iOS app showcasing integration patterns from the `mapbox-ios-patterns` skill.

## Features Demonstrated

This app demonstrates all the key patterns from the iOS skill:

1. ✅ **Map Initialization** - SwiftUI Map with Standard style (recommended)
2. ✅ **Add Markers** - Multiple point annotations on the map
3. ✅ **User Location with Camera Follow** - Real-time location tracking with camera following user movement and bearing
4. ✅ **Add Custom Data** - GeoJSON route line visualization
5. ✅ **Featureset Interactions** - Tap handling for POIs and buildings with feature state management
6. ✅ **Camera Control** - Animated transitions and viewport management

## Setup

### Prerequisites
- Xcode 15+
- iOS 13+
- Swift 5.9+
- Mapbox account (free)

### Installation

1. **Get your Mapbox access token:**
   - Sign in at [mapbox.com](https://account.mapbox.com/access-tokens/)
   - Copy your public token (starts with `pk.`)

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
   - Select a simulator or device
   - Press Cmd+R to build and run

## Code Structure

- `MapboxIOSDemoApp.swift` - App entry point
- `ContentView.swift` - Main map view with all features:
  - SwiftUI implementation with basic features
  - UIKit `MapViewController` class with comprehensive examples

## Implementation Notes

### SwiftUI Implementation
The SwiftUI version demonstrates:
- Basic map setup with Standard style
- Adding markers declaratively
- Featureset interactions (POI and building taps)
- Simple UI controls

### UIKit Implementation
The `MapViewController` class demonstrates:
- Complete map setup with lifecycle
- Multiple markers with batch creation
- Custom GeoJSON data (route line)
- User location with camera follow (position + bearing)
- Featureset interactions with feature state management

## Patterns from Skill

All code follows the patterns documented in:
`skills/mapbox-ios-patterns/SKILL.md`

Key patterns used:
- ✅ Style.STANDARD (recommended)
- ✅ Native SwiftUI Map view with Viewport
- ✅ TapInteraction with .featureset() for typed feature access
- ✅ onLocationChange observer for camera following
- ✅ GeoJSON sources and LineLayer for custom data
- ✅ Batch annotation updates for performance

## Testing

1. **Map displays correctly** - Standard style loads
2. **Markers visible** - Three markers appear on San Francisco
3. **POI taps work** - Tap on map POIs shows info
4. **Building taps work** - Tap on buildings highlights them
5. **Location tracking** - Tap "Follow Location" to enable tracking
6. **Custom route** - Blue route line visible connecting points

## Troubleshooting

**Map not displaying:**
- ✅ Check MBXAccessToken in Info.plist
- ✅ Token must be valid (test at mapbox.com)
- ✅ Check internet connection

**Location not working:**
- ✅ Grant location permission when prompted
- ✅ Check Info.plist has NSLocationWhenInUseUsageDescription
- ✅ Test on device or enable location in simulator

## Resources

- [iOS Maps Guides](https://docs.mapbox.com/ios/maps/guides/)
- [API Reference](https://docs.mapbox.com/ios/maps/api-reference/)
- [Interactions Guide](https://docs.mapbox.com/ios/maps/guides/user-interaction/Interactions/)
