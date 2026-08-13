# GeoJSON: Lines, Polygons, Points, Update/Remove

Add your own data to the map using GeoJSON sources and layers.

> **Two properties every custom layer needs on the Standard style.** `slot` decides where the
> layer sits in the basemap stack — a layer with **no slot draws above everything, including
> street labels**. On **fill, line, and circle** layers, emissive strength keeps it visible
> under the `dusk` and `night` light presets — those properties default to `0`, so without
> them the layer falls into shadow and nearly disappears. Symbol layers need nothing:
> `iconEmissiveStrength` and `textEmissiveStrength` already default to `1`.
>
> - `slot("bottom")` — above land and water, below roads (rasters, choropleth fills)
> - `slot("middle")` — above roads, behind 3D and labels (**routes**, overlays, custom POIs)
> - `slot("top")` — above POI labels (markers, active selections)
>
> These are style-spec properties, so the values are the same strings on every SDK. See the
> **mapbox-cartography** skill.

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
    slot("middle")                 // above roads, under labels and 3D buildings
    lineColor(Color.BLUE)
    lineWidth(4.0)
    lineCap(LineCap.ROUND)
    lineJoin(LineJoin.ROUND)
    lineEmissiveStrength(1.0)      // stays visible at dusk/night
    lineOcclusionOpacity(1.0)      // 3D buildings don't hide the route
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
    slot("bottom")                 // under the road network, so roads stay readable
    fillColor(Color.parseColor("#0000FF"))
    fillOpacity(0.3)
    fillOutlineColor(Color.parseColor("#0000FF"))
    fillEmissiveStrength(1.0)
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
    slot("top")                    // markers and selections belong in `top`
    iconImage("marker")
    iconAllowOverlap(true)         // the default hides colliding icons
    textField(Expression.get("name"))
    textFont(listOf("DIN Pro Medium", "Arial Unicode MS Bold")) // Standard's family
    textOffset(listOf(0.0, 1.5))
    textOptional(true)             // drop the label before the icon on collision
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
