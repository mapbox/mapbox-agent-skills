# Custom Data (GeoJSON): Lines, Polygons, Points, Update/Remove

Add your own data to the map using GeoJSON sources and layers.

---

## Add Line (Route, Path)

```swift
// Create coordinates for the line
let routeCoordinates = [
    CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
    CLLocationCoordinate2D(latitude: 37.7849, longitude: -122.4094),
    CLLocationCoordinate2D(latitude: 37.7949, longitude: -122.3994)
]

// Create GeoJSON source
var source = GeoJSONSource(id: "route-source")
source.data = .geometry(.lineString(LineString(routeCoordinates)))

try? mapView.mapboxMap.addSource(source)

// Create line layer
var layer = LineLayer(id: "route-layer", source: "route-source")
layer.lineColor = .constant(StyleColor(.blue))
layer.lineWidth = .constant(4)
layer.lineCap = .constant(.round)
layer.lineJoin = .constant(.round)

try? mapView.mapboxMap.addLayer(layer)
```

## Add Polygon (Area)

```swift
let polygonCoordinates = [coord1, coord2, coord3, coord1] // Close the polygon

var source = GeoJSONSource(id: "area-source")
source.data = .geometry(.polygon(Polygon([polygonCoordinates])))

try? mapView.mapboxMap.addSource(source)

var fillLayer = FillLayer(id: "area-fill", source: "area-source")
fillLayer.fillColor = .constant(StyleColor(.blue.withAlphaComponent(0.3)))
fillLayer.fillOutlineColor = .constant(StyleColor(.blue))

try? mapView.mapboxMap.addLayer(fillLayer)
```

## Add Points from GeoJSON

```swift
let geojsonString = """
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

var source = GeoJSONSource(id: "points-source")
source.data = .string(geojsonString)

try? mapView.mapboxMap.addSource(source)

var symbolLayer = SymbolLayer(id: "points-layer", source: "points-source")
symbolLayer.iconImage = .constant(.name("marker"))
symbolLayer.textField = .constant(.expression(Exp(.get) { "name" }))
symbolLayer.textOffset = .constant([0, 1.5])

try? mapView.mapboxMap.addLayer(symbolLayer)
```

## Update Layer Properties

```swift
try? mapView.mapboxMap.updateLayer(
    withId: "route-layer",
    type: LineLayer.self
) { layer in
    layer.lineColor = .constant(StyleColor(.red))
    layer.lineWidth = .constant(6)
}
```

## Remove Layers and Sources

```swift
try? mapView.mapboxMap.removeLayer(withId: "route-layer")
try? mapView.mapboxMap.removeSource(withId: "route-source")
```
