---
name: mapbox-flutter-patterns
description: Official integration patterns for the Mapbox Maps Flutter SDK. Covers installation, iOS/Android platform setup, access token configuration, MapWidget initialization, camera control, annotations with tap handling, user location, and loading GeoJSON. Based on official Mapbox documentation.
---

# Mapbox Flutter Integration Patterns

Official patterns for integrating the Mapbox Maps SDK for Flutter (mapbox_maps_flutter) on iOS and Android with Dart.

**Use this skill when:**

- Installing and configuring mapbox_maps_flutter in a Flutter app
- Setting the Mapbox access token the right way
- Initializing a `MapWidget` with camera / style options
- Adding annotations (points, circles, lines, polygons) and handling taps
- Showing the user location puck
- Loading GeoJSON from app assets
- Troubleshooting iOS build failures after adding Mapbox

**Official Resources:**

- [Flutter Maps Guides](https://docs.mapbox.com/flutter/maps/guides/)
- [API Reference on pub.dev](https://pub.dev/documentation/mapbox_maps_flutter/latest/)
- [Example App](https://github.com/mapbox/mapbox-maps-flutter/tree/main/example)

> Web and desktop are not supported — the Flutter SDK targets iOS and Android only.

---

## Installation & Setup

### Requirements

- Flutter SDK 3.22.3 / Dart 3.4.4+
- **iOS: deployment target 14.0 or higher**
- **Android: minSdk 21 or higher**
- Free Mapbox account

### Step 1: Add the dependency

```yaml
# pubspec.yaml
dependencies:
  mapbox_maps_flutter: ^2.0.0
```

```bash
flutter pub get
```

### Step 2: Bump the iOS deployment target to 14.0 (required)

**This is the single most common cause of iOS build failures after adding Mapbox.** The Flutter SDK requires **iOS 14.0** and will not compile on the Flutter default.

1. Open `ios/Runner.xcworkspace` in Xcode.
2. Select the **Runner** target → **General** → set **Minimum Deployments → iOS** to `14.0`.
3. If `ios/Podfile` exists, update the platform line too:

   ```ruby
   # ios/Podfile
   platform :ios, '14.0'
   ```

You do not need to worry about CocoaPods vs Swift Package Manager — `mapbox_maps_flutter` supports both and Flutter picks whichever your app is configured for.

### Step 3: iOS location permission

Add the purpose string to `ios/Runner/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Show your location on the map</string>
```

### Step 4: Android permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### Step 5: Configure the access token

The recommended pattern is to pass the token via `--dart-define` at build/run time and set it on `MapboxOptions` before creating any `MapWidget`.

```bash
flutter run --dart-define=ACCESS_TOKEN=pk.your_token_here
```

```dart
// main.dart
import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

const accessToken = String.fromEnvironment('ACCESS_TOKEN');

void main() {
  MapboxOptions.setAccessToken(accessToken);
  runApp(const MaterialApp(home: MapScreen()));
}
```

Never hard-code tokens in source. For CI, pass `--dart-define=ACCESS_TOKEN=$MAPBOX_ACCESS_TOKEN`.

---

## Map Initialization

### Basic map

```dart
import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

class MapScreen extends StatelessWidget {
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: MapWidget(
        key: const ValueKey('mapWidget'),
        cameraOptions: CameraOptions(
          center: Point(coordinates: Position(-122.4194, 37.7749)),
          zoom: 12,
        ),
        styleUri: MapboxStyles.STANDARD,
      ),
    );
  }
}
```

### Grab the `MapboxMap` controller

```dart
class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  MapboxMap? mapboxMap;

  void _onMapCreated(MapboxMap controller) {
    mapboxMap = controller;
  }

  @override
  Widget build(BuildContext context) {
    return MapWidget(
      key: const ValueKey('mapWidget'),
      onMapCreated: _onMapCreated,
      cameraOptions: CameraOptions(
        center: Point(coordinates: Position(-122.4194, 37.7749)),
        zoom: 12,
      ),
    );
  }
}
```

---

## Add Annotations

Use `mapboxMap.annotations` to create managers for point, circle, polyline, and polygon annotations. Managers are long-lived — create them once and reuse for updates.

### Point annotations with a custom image

```dart
import 'package:flutter/services.dart' show rootBundle;

PointAnnotationManager? pointAnnotationManager;

Future<void> _addMarkers(MapboxMap mapboxMap) async {
  pointAnnotationManager = await mapboxMap.annotations.createPointAnnotationManager();

  final bytes = await rootBundle.load('assets/marker.png');
  final imageBytes = bytes.buffer.asUint8List();

  final options = <PointAnnotationOptions>[
    PointAnnotationOptions(
      geometry: Point(coordinates: Position(-122.4194, 37.7749)),
      image: imageBytes,
      iconSize: 1.2,
    ),
    PointAnnotationOptions(
      geometry: Point(coordinates: Position(-122.4094, 37.7849)),
      image: imageBytes,
    ),
  ];

  await pointAnnotationManager!.createMulti(options);
}
```

Remember to register the asset in `pubspec.yaml`:

```yaml
flutter:
  assets:
    - assets/marker.png
```

### Tap handling

Use `manager.tapEvents` — this is the current API. `addOnPointAnnotationClickListener` is deprecated.

`tapEvents` returns a `Cancelable` that you store and invoke `.cancel()` on when the listener is no longer needed:

```dart
final Cancelable tapSubscription = pointAnnotationManager!.tapEvents(
  onTap: (annotation) {
    debugPrint('Tapped annotation ${annotation.id}');
  },
);

@override
void dispose() {
  tapSubscription.cancel();
  super.dispose();
}
```

The same pattern — returning a `Cancelable` — exists on every manager's `longPressEvents` and `dragEvents`, and across the other annotation types (`CircleAnnotationManager.tapEvents`, etc.).

### Load annotations from GeoJSON

```dart
import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;

Future<void> _loadGeoJson(MapboxMap mapboxMap) async {
  final raw = await rootBundle.loadString('assets/coffee_shops.geojson');
  final geo = jsonDecode(raw) as Map<String, dynamic>;
  final features = (geo['features'] as List).cast<Map<String, dynamic>>();

  final manager = await mapboxMap.annotations.createPointAnnotationManager();
  final icon = (await rootBundle.load('assets/coffee.png')).buffer.asUint8List();

  final options = features.map((feature) {
    final coords = feature['geometry']['coordinates'] as List;
    return PointAnnotationOptions(
      geometry: Point(coordinates: Position(coords[0] as double, coords[1] as double)),
      image: icon,
    );
  }).toList();

  await manager.createMulti(options);
}
```

For thousands of features use a style layer (`GeoJsonSource` + `SymbolLayer`) instead of annotations.

---

## Show User Location

Permissions must already be granted (use `permission_handler` or similar) before enabling the puck.

```dart
await mapboxMap.location.updateSettings(LocationComponentSettings(
  enabled: true,
  puckBearingEnabled: true,
  locationPuck: LocationPuck(
    locationPuck2D: DefaultLocationPuck2D(),
  ),
));
```

---

## Camera Control

```dart
// Instant jump
await mapboxMap.setCamera(CameraOptions(
  center: Point(coordinates: Position(-80.1263, 25.7845)),
  zoom: 14,
));

// Animated fly-to
await mapboxMap.flyTo(
  CameraOptions(
    center: Point(coordinates: Position(-80.1263, 25.7845)),
    zoom: 17,
    bearing: 180,
    pitch: 30,
  ),
  MapAnimationOptions(duration: 2000),
);
```

---

## Troubleshooting

### iOS build fails with "platform is lower than deployment target"

The Flutter default iOS deployment target is lower than Mapbox's minimum (iOS 14). Set **Minimum Deployments → iOS** to `14.0` on the Runner target in Xcode. If the project has an `ios/Podfile`, also set `platform :ios, '14.0'` there and re-run `pod install`.

### `setAccessToken` not called

If you forget to call `MapboxOptions.setAccessToken` before creating a `MapWidget`, the map will load with a blank grid. Always call it in `main()` before `runApp`.

### Annotation tap handler not firing

Make sure you're using `manager.tapEvents(onTap: ...)` — `addOnPointAnnotationClickListener` is deprecated. Also confirm the `MapboxMap` controller is captured via `onMapCreated` before you create the annotation manager.

### Hot reload after permissions change

iOS/Android will not re-read manifests or Info.plist on hot reload. Fully restart the app after editing permissions.

---

## Reference Files

- **`references/annotations.md`** — Circle, Polyline, Polygon patterns and GeoJSON source/layer recipes.
- **`references/platform-setup.md`** — Deeper iOS/Android setup, token strategies, release signing notes.

---

## Additional Resources

- [Flutter Maps Guides](https://docs.mapbox.com/flutter/maps/guides/)
- [Markers and Annotations guide](https://docs.mapbox.com/flutter/maps/guides/markers-and-annotations/)
- [User Location guide](https://docs.mapbox.com/flutter/maps/guides/user-location/)
- [Example App](https://github.com/mapbox/mapbox-maps-flutter/tree/main/example)
