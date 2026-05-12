# Annotations and Sources (Flutter)

Deeper reference for annotation managers beyond point annotations, plus the GeoJSON source + style layer approach for large datasets.

---

## Circle Annotations

```dart
final manager = await mapboxMap.annotations.createCircleAnnotationManager();

await manager.create(CircleAnnotationOptions(
  geometry: Point(coordinates: Position(-122.4194, 37.7749)),
  circleRadius: 10,
  circleColor: Colors.red.toARGB32(),
));

manager.tapEvents(onTap: (annotation) {
  debugPrint('circle tapped: ${annotation.id}');
});
```

## Polyline Annotations

```dart
final manager = await mapboxMap.annotations.createPolylineAnnotationManager();

await manager.create(PolylineAnnotationOptions(
  geometry: LineString(coordinates: [
    Position(-122.4194, 37.7749),
    Position(-122.4094, 37.7849),
    Position(-122.3994, 37.7949),
  ]),
  lineColor: Colors.blue.toARGB32(),
  lineWidth: 4,
));
```

## Polygon Annotations

```dart
final manager = await mapboxMap.annotations.createPolygonAnnotationManager();

await manager.create(PolygonAnnotationOptions(
  geometry: Polygon(coordinates: [
    [
      Position(-122.420, 37.770),
      Position(-122.410, 37.770),
      Position(-122.410, 37.780),
      Position(-122.420, 37.780),
      Position(-122.420, 37.770),
    ],
  ]),
  fillColor: Colors.green.toARGB32(),
  fillOpacity: 0.4,
));
```

---

## GeoJSON Source + Style Layer (large datasets)

Annotations render each feature through a manager which is convenient but expensive. For hundreds or thousands of features, clustering, or data-driven styling, load the GeoJSON into a `GeoJsonSource` and render it with a `SymbolLayer` (or `CircleLayer` / `LineLayer` / `FillLayer`).

```dart
import 'package:flutter/services.dart' show rootBundle;

Future<void> _addGeoJsonLayer(MapboxMap mapboxMap) async {
  final data = await rootBundle.loadString('assets/coffee_shops.geojson');

  await mapboxMap.style.addSource(GeoJsonSource(id: 'shops', data: data));

  // Register the icon once in the style.
  final iconBytes = (await rootBundle.load('assets/coffee.png')).buffer.asUint8List();
  await mapboxMap.style.addStyleImage(
    'coffee-icon',
    1.0,
    MbxImage(width: 48, height: 48, data: iconBytes),
    false,
    [],
    [],
    null,
  );

  await mapboxMap.style.addLayer(SymbolLayer(
    id: 'shops-layer',
    sourceId: 'shops',
    iconImage: 'coffee-icon',
    iconAllowOverlap: true,
  ));
}
```

### Clustering

Enable clustering on the source and render cluster bubbles with a `CircleLayer` + count labels with a `SymbolLayer` filtered by `["has", "point_count"]`.

```dart
await mapboxMap.style.addSource(GeoJsonSource(
  id: 'shops',
  data: data,
  cluster: true,
  clusterRadius: 50,
  clusterMaxZoom: 14,
));
```

---

## Removing annotations

- Per-annotation: `manager.delete(annotation)` or `manager.deleteMulti([annotation])`.
- Clear one manager: `manager.deleteAll()`.
- Remove the manager and its backing layer/source: `mapboxMap.annotations.removeAnnotationManager(manager)`.
