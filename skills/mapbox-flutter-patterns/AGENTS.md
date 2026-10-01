# Mapbox Flutter Quick Reference

Fast reference for `mapbox_maps_flutter` on iOS + Android.

## Install

```yaml
# pubspec.yaml
dependencies:
  mapbox_maps_flutter: ^2.0.0
```

- **iOS:** Runner target **Minimum Deployments → iOS = 14.0** (Podfile `platform :ios, '14.0'` if using Pods). This is
  the single most common cause of iOS build failures — Flutter's default target is below Mapbox's minimum, which surfaces
  as `platform is lower than deployment target`.
- **Android:** `minSdk = 21` in `android/app/build.gradle(.kts)`.

You do not need to choose between CocoaPods and Swift Package Manager: the plugin ships both, and Flutter picks
whichever your app is configured for (new projects on Flutter 3.29+ default to SPM, older ones stay on CocoaPods).

## Access Token

```bash
flutter run --dart-define=ACCESS_TOKEN=pk.your_token
```

```dart
const accessToken = String.fromEnvironment('ACCESS_TOKEN');

void main() {
  MapboxOptions.setAccessToken(accessToken);
  runApp(const MaterialApp(home: MapScreen()));
}
```

## Basic MapWidget

```dart
MapWidget(
  key: const ValueKey('mapWidget'),
  onMapCreated: (controller) => mapboxMap = controller,
  cameraOptions: CameraOptions(
    center: Point(coordinates: Position(-122.4194, 37.7749)),
    zoom: 12,
  ),
  styleUri: MapboxStyles.STANDARD,
)
```

## Point Annotations

```dart
final manager = await mapboxMap.annotations.createPointAnnotationManager();
final icon = (await rootBundle.load('assets/marker.png')).buffer.asUint8List();

await manager.createMulti([
  PointAnnotationOptions(
    geometry: Point(coordinates: Position(-122.4194, 37.7749)),
    image: icon,
  ),
]);

// Current non-deprecated tap API. Returns a Cancelable — store it and cancel in dispose,
// or the listener outlives the widget.
final Cancelable tapSubscription = manager.tapEvents(onTap: (annotation) {
  debugPrint('tapped ${annotation.id}');
});

@override
void dispose() {
  tapSubscription.cancel();
  super.dispose();
}
```

The same `Cancelable`-returning pattern exists on every manager's `tapEvents`, `longPressEvents` and
`dragEvents`, and across the other annotation types (`CircleAnnotationManager.tapEvents`, and so on).

## Load GeoJSON

```dart
final raw = await rootBundle.loadString('assets/data.geojson');
final features = (jsonDecode(raw)['features'] as List).cast<Map<String, dynamic>>();
```

For thousands of features use a `GeoJsonSource` + `SymbolLayer` instead of annotations.

## User Location

```dart
await mapboxMap.location.updateSettings(LocationComponentSettings(
  enabled: true,
  puckBearingEnabled: true,
  locationPuck: LocationPuck(locationPuck2D: DefaultLocationPuck2D()),
));
```

Grant permission first (use `permission_handler`).

## Camera

```dart
await mapboxMap.flyTo(
  CameraOptions(
    center: Point(coordinates: Position(-80.1263, 25.7845)),
    zoom: 17,
  ),
  MapAnimationOptions(duration: 2000),
);
```

## Checklist

- ✅ iOS Runner target Minimum Deployment = 14.0
- ✅ Android minSdk = 21
- ✅ Location permissions declared in `Info.plist` / `AndroidManifest.xml`
- ✅ `MapboxOptions.setAccessToken(...)` called in `main()` before `runApp`
- ✅ Annotation managers reused; `manager.tapEvents` (not deprecated `addOn...ClickListener`)

## Resources

- [Flutter Maps Guides](https://docs.mapbox.com/flutter/maps/guides/)
- [pub.dev — mapbox_maps_flutter](https://pub.dev/packages/mapbox_maps_flutter)
- [Example App](https://github.com/mapbox/mapbox-maps-flutter/tree/main/mapbox_maps_flutter/example)
