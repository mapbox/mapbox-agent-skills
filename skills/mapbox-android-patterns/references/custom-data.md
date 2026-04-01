# GeoJSON: Lines, Polygons, Points, Update/Remove

Add your own data to the map using GeoJSON sources and layers.

## Add Line (Route, Path)

```kotlin
// Create coordinates for the line
val routeCoordinates = listOf(
    Point.fromLngLat(-122.4194, 37.7749),
    Point.fromLngLat(-122.4094, 37.7849),
    Point.fromLngLat(-122.3994, 37.7949)
)

// Create GeoJSON source
val geoJsonSource = geoJsonSource("route-source") {
    geometry(LineString.fromLngLats(routeCoordinates))
}
mapView.mapboxMap.style?.addSource(geoJsonSource)

// Create line layer
val lineLayer = lineLayer("route-layer", "route-source") {
    lineColor(Color.BLUE)
    lineWidth(4.0)
    lineCap(LineCap.ROUND)
    lineJoin(LineJoin.ROUND)
}
mapView.mapboxMap.style?.addLayer(lineLayer)
```

## Add Polygon (Area)

```kotlin
val polygonCoordinates = listOf(
    listOf(coord1, coord2, coord3, coord1) // Close the polygon
)

val geoJsonSource = geoJsonSource("area-source") {
    geometry(Polygon.fromLngLats(polygonCoordinates))
}
mapView.mapboxMap.style?.addSource(geoJsonSource)

val fillLayer = fillLayer("area-fill", "area-source") {
    fillColor(Color.parseColor("#0000FF"))
    fillOpacity(0.3)
    fillOutlineColor(Color.parseColor("#0000FF"))
}
mapView.mapboxMap.style?.addLayer(fillLayer)
```

## Add Points from GeoJSON

```kotlin
val geojsonString = """
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [-122.4194, 37.7749]},
      "properties": {"name": "Location 1"}
    },
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [-122.4094, 37.7849]},
      "properties": {"name": "Location 2"}
    }
  ]
}
"""

val geoJsonSource = geoJsonSource("points-source") {
    data(geojsonString)
}
mapView.mapboxMap.style?.addSource(geoJsonSource)

val symbolLayer = symbolLayer("points-layer", "points-source") {
    iconImage("marker")
    textField(Expression.get("name"))
    textOffset(listOf(0.0, 1.5))
}
mapView.mapboxMap.style?.addLayer(symbolLayer)
```

## Update Layer Properties

```kotlin
mapView.mapboxMap.style?.getLayerAs<LineLayer>("route-layer")?.let { layer ->
    layer.lineColor(Color.RED)
    layer.lineWidth(6.0)
}
```

## Remove Layers and Sources

```kotlin
mapView.mapboxMap.style?.removeStyleLayer("route-layer")
mapView.mapboxMap.style?.removeStyleSource("route-source")
```
