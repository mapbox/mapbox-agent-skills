# Mapbox Android Demo App

Pure Jetpack Compose demo app showcasing modern integration patterns from the `mapbox-android-patterns` skill.

## Features Demonstrated

This app demonstrates key patterns using **Jetpack Compose only** (the modern, recommended approach):

1. ✅ **Map Initialization** - Native MapboxMap composable with Standard style
2. ✅ **Add Markers** - Declarative PointAnnotation components
3. ✅ **Camera State** - rememberCameraState for state management
4. ✅ **Location Permissions** - Modern permission request with ActivityResultContracts
5. ✅ **UI Controls** - Material3 components with proper state management

## Setup

### Prerequisites

- Android Studio (latest version)
- Android SDK 21+
- Kotlin
- Mapbox account (free)

### Installation

1. **Get your Mapbox access token:**
   - Sign in at [mapbox.com](https://account.mapbox.com/access-tokens/)
   - Copy your **public token** (starts with `pk.`)

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
   - Connect a device or start an emulator (API 21+)
   - Click the "Run" button (green play icon)

## Code Structure

```
app/src/main/kotlin/com/mapbox/demo/
├── MainActivity.kt    # App entry point
└── MapScreen.kt       # Main map screen (Pure Compose)
```

## Implementation Details

### Pure Jetpack Compose Approach

This demo uses **only Jetpack Compose** - the modern, declarative approach for Android:

```kotlin
MapboxMap(
    mapViewportState = cameraState,
    style = Style.STANDARD
) {
    PointAnnotation(point = location) {
        iconImage = "marker"
    }
}
```

**Why Jetpack Compose?**

- ✅ Modern, declarative UI (recommended by Google & Mapbox)
- ✅ Less boilerplate, more readable code
- ✅ Better state management
- ✅ Future of Android development

## Patterns from Skill

All code follows patterns from: `skills/mapbox-android-patterns/SKILL.md`

| Pattern        | Implementation                      |
| -------------- | ----------------------------------- |
| Standard Style | `style = Style.STANDARD`            |
| Native Map     | `MapboxMap` composable              |
| Markers        | `PointAnnotation` composable        |
| Camera State   | `rememberCameraState {}`            |
| Permissions    | `rememberLauncherForActivityResult` |
| Material3      | Modern UI components                |

## Testing

1. **Map displays** - Standard style loads with San Francisco view
2. **Markers visible** - Three markers at different locations
3. **Permissions** - App requests location permissions properly
4. **Reset button** - Returns to initial view with animation
5. **Location button** - Toggles location tracking

## Troubleshooting

**Map not displaying:**

- ✅ Check `mapbox_access_token.xml` has valid **public token** (pk.\*)
- ✅ Token must be valid (test at mapbox.com)
- ✅ Maven repository configured in settings.gradle.kts
- ✅ Check AndroidManifest.xml has internet permission

**Build errors:**

- ✅ Sync Gradle files (File → Sync Project with Gradle Files)
- ✅ Check Maven repository URL is correct
- ✅ Ensure minSdk = 21 in build.gradle.kts
- ✅ Clean and rebuild (Build → Clean Project)

**Location not working:**

- ✅ Grant location permission when prompted
- ✅ Check AndroidManifest.xml has location permissions
- ✅ Test on physical device for best results

## Gradle Configuration

### settings.gradle.kts

Mapbox Maven repository:

```kotlin
maven {
    url = uri("https://api.mapbox.com/downloads/v2/releases/maven")
}
```

### app/build.gradle.kts

Dependencies:

```kotlin
implementation("com.mapbox.maps:android:11.18.1")
implementation("com.mapbox.extension:maps-compose:11.18.1")
```

## Resources

- [Android Skill Documentation](../../skills/mapbox-android-patterns/SKILL.md)
- [Android Maps Guides](https://docs.mapbox.com/android/maps/guides/)
- [Jetpack Compose Guide](https://docs.mapbox.com/android/maps/guides/using-jetpack-compose/)
- [API Reference](https://docs.mapbox.com/android/maps/api-reference/)
