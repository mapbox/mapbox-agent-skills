# Annotations and Sources (Flutter)

Deeper reference for annotation managers beyond point annotations, plus the GeoJSON source + style layer approach for large datasets.

> **Style layers on Standard need two properties.** `slot` decides where the layer sits in the
> basemap stack — a layer with **no slot draws above everything, including street labels**.
> On **fill, line, and circle** layers, emissive strength keeps it visible under the
> `dusk` / `night` light presets — those properties default to `0`. Symbol layers need
> nothing: `iconEmissiveStrength` / `textEmissiveStrength` already default to `1`.
>
> - `slot: 'bottom'` — above land and water, below roads (rasters, choropleth fills)
> - `slot: 'middle'` — above roads, behind 3D and labels (**routes**, overlays, custom POIs)
> - `slot: 'top'` — above POI labels (markers, active selections)
>
> Annotation _managers_ accept a `slot` too — pass it when creating the manager. Routes also
> want `lineOcclusionOpacity: 1.0` so 3D buildings don't hide them. See the
> **mapbox-cartography** skill.

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
    slot: 'top',                  // markers belong in `top`
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

// Cluster bubbles — `middle` slot, above roads but behind basemap labels
await mapboxMap.style.addLayer(CircleLayer(
  id: 'clusters',
  sourceId: 'shops',
  slot: 'middle',
  filter: ['has', 'point_count'],
  circleColorExpression: [
    'step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 30, '#f28cb1'
  ],
  circleRadiusExpression: ['step', ['get', 'point_count'], 20, 10, 30, 30, 40],
  circleEmissiveStrength: 1.0,
));

// Count labels — `top` slot
await mapboxMap.style.addLayer(SymbolLayer(
  id: 'cluster-count',
  sourceId: 'shops',
  slot: 'top',
  filter: ['has', 'point_count'],
  textFieldExpression: ['get', 'point_count_abbreviated'],
  textSize: 12,
  textColor: 0xFFFFFFFF,
));
```

Cluster when points visibly overlap at the zooms users actually browse — a legibility call, not a row count. Separately, once the dataset runs to thousands of points or a payload of a few MB, serve it as a vector tileset rather than a GeoJSON source.

---

## Removing annotations

- Per-annotation: `manager.delete(annotation)` or `manager.deleteMulti([annotation])`.
- Clear one manager: `manager.deleteAll()`.
- Remove the manager and its backing layer/source: `mapboxMap.annotations.removeAnnotationManager(manager)`.
