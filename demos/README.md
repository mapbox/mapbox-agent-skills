# Mapbox Mobile Skills Demo Apps

Working demonstration apps that prove the accuracy of the `mapbox-ios-patterns` and `mapbox-android-patterns` skills.

## Overview

These demo apps showcase all the key integration patterns documented in the skills:

- ✅ **Map Initialization** with Standard style (recommended)
- ✅ **Add Markers** to maps
- ✅ **User Location** with camera following (position + bearing)
- ✅ **Custom GeoJSON Data** visualization
- ✅ **Featureset Interactions** for tapping POIs and buildings
- ✅ **Camera Control** with animated transitions

## Demo Apps

### [iOS Demo](./ios-demo/)
**Pure SwiftUI** implementation demonstrating iOS Maps SDK v11 modern patterns.

**Technologies:**
- SwiftUI Map view (native v11 API, declarative)
- Swift Package Manager for dependencies
- Standard style with featureset interactions
- Modern, streamlined codebase

**Quick Start:**
```bash
cd ios-demo
# Add your token to Sources/MapboxIOSDemo/Info.plist
swift package resolve
open Package.swift
```

[Full iOS Setup Guide →](./ios-demo/README.md)

### [Android Demo](./android-demo/)
**Pure Jetpack Compose** implementation demonstrating Android Maps SDK v11 modern patterns.

**Technologies:**
- Jetpack Compose MapboxMap (native v11 API, declarative)
- Gradle with Maven repository configuration
- Standard style with Material3 UI
- Modern, streamlined codebase

**Quick Start:**
```bash
cd android-demo
# Add your token to app/src/main/res/values/mapbox_access_token.xml
# Open in Android Studio and sync Gradle
```

[Full Android Setup Guide →](./android-demo/README.md)

## What These Demos Prove

### 1. Patterns Work As Documented
Every code example in the demos is taken directly from the skill documentation, proving:
- ✅ Code examples compile and run
- ✅ APIs are used correctly
- ✅ Pattern recommendations are accurate

### 2. Modern APIs
Both demos use the latest recommended approaches:
- ✅ **Style.STANDARD** as default (not Streets)
- ✅ **Featureset Interactions** (not Query Rendered Features)
- ✅ **Native UI frameworks** (SwiftUI Map, Compose MapboxMap)
- ✅ **Typed feature access** (StandardPoiFeature, StandardBuildingsFeature)

### 3. Priority on Basics
Demos emphasize the most common use cases first:
- ✅ Adding markers (most common)
- ✅ User location with camera follow (very common)
- ✅ Custom GeoJSON data (common)
- ✅ Camera control (basic)
- ✅ Feature interactions (useful)

### 4. Complete Examples
Each demo includes:
- ✅ Full working app structure
- ✅ Dependency configuration
- ✅ Token setup instructions
- ✅ Both basic (Compose/SwiftUI) and advanced (View system) examples
- ✅ Proper lifecycle management
- ✅ Performance best practices

## Code Verification

All code patterns used in these demos are documented in:
- [`skills/mapbox-ios-patterns/SKILL.md`](../skills/mapbox-ios-patterns/SKILL.md)
- [`skills/mapbox-android-patterns/SKILL.md`](../skills/mapbox-android-patterns/SKILL.md)

The demos serve as executable proof that the skill documentation is accurate and functional.

## Features Matrix

| Feature | iOS Demo | Android Demo | Skill Pattern |
|---------|----------|--------------|---------------|
| Standard Style | ✅ | ✅ | Map Initialization |
| Add Markers | ✅ | ✅ | Point Annotations |
| User Location | ✅ | ✅ | Display User Location |
| Camera Follow | ✅ | ✅ | Camera Follow User Location |
| GeoJSON Data | ✅ | ✅ | Add Custom Data |
| POI Interactions | ✅ | ✅ | Featureset Interactions |
| Building Interactions | ✅ | ✅ | Featureset Interactions |
| Feature Highlighting | ✅ | ✅ | Feature State Management |
| Camera Animations | ✅ | ✅ | Animated Camera Transitions |
| Lifecycle Management | ✅ | ✅ | Performance Best Practices |

## Getting Your Mapbox Token

Both demos require a Mapbox access token:

1. Sign up at [mapbox.com](https://account.mapbox.com/auth/signup/) (free)
2. Get your public token at [access tokens page](https://account.mapbox.com/access-tokens/)
3. Copy the token (starts with `pk.`)
4. Add to:
   - **iOS**: `ios-demo/Sources/MapboxIOSDemo/Info.plist`
   - **Android**: `android-demo/app/src/main/res/values/mapbox_access_token.xml`

## Testing Guide

### iOS Demo Testing
1. Open in Xcode
2. Select simulator or device
3. Run app (Cmd+R)
4. Verify:
   - Map loads with Standard style
   - Three markers visible
   - "Follow Location" button works
   - Tapping POIs shows info (console logs)
   - Blue route line visible

### Android Demo Testing
1. Open in Android Studio
2. Sync Gradle files
3. Select emulator or device
4. Run app
5. Verify:
   - Map loads with Standard style
   - Three markers visible
   - "Follow Location" button requests permissions
   - Blue route line visible (View system version)
   - POI/building taps work (View system version - check logs)

## Implementation Notes

### Modern Frameworks Only

Both demos use **only the modern, declarative frameworks**:

**iOS - Pure SwiftUI:**
- ✅ Native Map view with Viewport binding
- ✅ Declarative PointAnnotation components
- ✅ TapInteraction for featureset interactions
- ✅ Clean, concise code following modern iOS patterns

**Android - Pure Jetpack Compose:**
- ✅ Native MapboxMap composable
- ✅ rememberCameraState for state management
- ✅ Declarative PointAnnotation components
- ✅ Material3 UI components

**Why modern frameworks only?**
- Simpler, cleaner code
- Less confusing for developers learning Mapbox
- Recommended approach by both Apple/Google and Mapbox
- The skills documentation covers both approaches in detail

## Troubleshooting

### Common Issues

**"Map not displaying"**
- Check token is valid at mapbox.com
- Verify token format (should start with `pk.`)
- Check internet connection

**"Location not working"**
- Grant location permissions when prompted
- Check Info.plist (iOS) or AndroidManifest.xml (Android) has permission declarations
- Test on physical device for best results

**Build errors**
- iOS: Run `swift package resolve`
- Android: Sync Gradle files in Android Studio
- Check minimum SDK versions (iOS 13+, Android 21+)

## Resources

- [iOS Skill Documentation](../skills/mapbox-ios-patterns/SKILL.md)
- [Android Skill Documentation](../skills/mapbox-android-patterns/SKILL.md)
- [Mapbox iOS Guides](https://docs.mapbox.com/ios/maps/guides/)
- [Mapbox Android Guides](https://docs.mapbox.com/android/maps/guides/)
- [Interactions API (iOS)](https://docs.mapbox.com/ios/maps/guides/user-interaction/Interactions/)
- [Interactions API (Android)](https://docs.mapbox.com/android/maps/guides/user-interaction/interactions/)

## Contributing

If you find any issues with the demo apps or have suggestions for improvements:
1. Check that your code matches the patterns in the skill documentation
2. Verify you're using the latest SDK version (11.18.1+)
3. Report issues with details about SDK version, platform, and steps to reproduce
