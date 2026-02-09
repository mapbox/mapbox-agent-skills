# Mapbox Android Demo App

Demo Android app showcasing integration patterns from the `mapbox-android-patterns` skill.

## Features Demonstrated

This app demonstrates all the key patterns from the Android skill:

1. ✅ **Map Initialization** - Jetpack Compose MapboxMap with Standard style (recommended)
2. ✅ **Add Markers** - Multiple point annotations on the map
3. ✅ **User Location with Camera Follow** - Real-time location tracking with camera following user movement and bearing
4. ✅ **Add Custom Data** - GeoJSON route line visualization
5. ✅ **Featureset Interactions** - Tap handling for POIs and buildings with feature state management
6. ✅ **Camera Control** - Animated transitions and camera state management

## Setup

### Prerequisites
- Android Studio (latest version)
- Android SDK 21+
- Kotlin
- Mapbox account (free)

### Installation

1. **Get your Mapbox access token:**
   - Sign in at [mapbox.com](https://account.mapbox.com/access-tokens/)
   - Copy your public token (starts with `pk.`)

2. **Configure the token:**
   - Open `app/src/main/res/values/mapbox_access_token.xml`
   - Replace `YOUR_MAPBOX_ACCESS_TOKEN` with your actual token

3. **Open in Android Studio:**
   ```bash
   cd demos/android-demo
   # Open the folder in Android Studio
   ```

4. **Sync Gradle:**
   - Android Studio should prompt you to sync
   - Or click "File → Sync Project with Gradle Files"

5. **Run the app:**
   - Connect a device or start an emulator
   - Click the "Run" button (green play icon)

## Code Structure

### Jetpack Compose Implementation
- `MainActivity.kt` - App entry point
- `MapScreen.kt` - Compose-based map screen with basic features
  - Map initialization with Standard style
  - Multiple markers
  - UI controls for location and camera

### View System Implementation
- `MapActivityView.kt` - Comprehensive example using View system
  - Complete map setup with lifecycle
  - Multiple markers with batch creation
  - Custom GeoJSON data (route line)
  - User location with camera follow (position + bearing)
  - Featureset interactions with feature state management

## Implementation Notes

### Jetpack Compose
The Compose implementation in `MapScreen.kt` demonstrates:
- Native MapboxMap composable with Standard style
- Declarative marker placement with PointAnnotation
- Camera state management with rememberCameraState
- Location permission handling
- Simple UI controls

### View System
The `MapActivityView.kt` class demonstrates the full feature set:
- Map initialization with Standard style
- Batch marker creation for performance
- GeoJSON source and layer for custom data visualization
- User location tracking with smooth camera following
- Bearing tracking for navigation-style orientation
- Featureset interactions (ClickInteraction.standardPoi, ClickInteraction.standardBuildings)
- Feature state management for highlighting selected features
- Proper lifecycle management (onStart, onStop, onDestroy)

## Patterns from Skill

All code follows the patterns documented in:
`skills/mapbox-android-patterns/SKILL.md`

Key patterns used:
- ✅ Style.STANDARD (recommended)
- ✅ Native Jetpack Compose MapboxMap with rememberCameraState
- ✅ ClickInteraction.standardPoi/standardBuildings for typed feature access
- ✅ addOnIndicatorPositionChangedListener + addOnIndicatorBearingChangedListener
- ✅ geoJsonSource and lineLayer DSL for custom data
- ✅ Batch annotation creation for performance
- ✅ Proper lifecycle management

## Testing

1. **Map displays correctly** - Standard style loads
2. **Markers visible** - Three markers appear on San Francisco
3. **Location tracking** - Tap "Follow Location" to enable tracking
4. **Custom route** - Blue route line visible connecting points
5. **POI taps work** (View system) - Check logs for POI tap events
6. **Building taps work** (View system) - Buildings highlight on tap

### To test View system features:
1. Open `AndroidManifest.xml`
2. Change main activity from `MainActivity` to `MapActivityView`
3. Run the app
4. All features including featureset interactions will be available

## Troubleshooting

**Map not displaying:**
- ✅ Check mapbox_access_token.xml has valid token
- ✅ Token must be valid (test at mapbox.com)
- ✅ Maven repository configured in settings.gradle.kts
- ✅ Check internet permission in AndroidManifest.xml

**Build errors:**
- ✅ Sync Gradle files
- ✅ Check Maven repository URL is correct
- ✅ Ensure minSdk = 21 in build.gradle.kts

**Location not working:**
- ✅ Grant location permission when prompted
- ✅ Check AndroidManifest.xml has location permissions
- ✅ Test on physical device for best results

## Gradle Files

### settings.gradle.kts
Configures Maven repository for Mapbox SDK:
```kotlin
maven {
    url = uri("https://api.mapbox.com/downloads/v2/releases/maven")
}
```

### app/build.gradle.kts
Dependencies:
- `com.mapbox.maps:android:11.18.1` - Maps SDK
- `com.mapbox.extension:maps-compose:11.18.1` - Compose extension
- Jetpack Compose BOM and libraries

## Resources

- [Android Maps Guides](https://docs.mapbox.com/android/maps/guides/)
- [API Reference](https://docs.mapbox.com/android/maps/api-reference/)
- [Interactions Guide](https://docs.mapbox.com/android/maps/guides/user-interaction/interactions/)
- [Jetpack Compose Guide](https://docs.mapbox.com/android/maps/guides/using-jetpack-compose/)
