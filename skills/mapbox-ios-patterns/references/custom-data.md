# Custom Data (GeoJSON): Lines, Polygons, Points, Update/Remove

Add your own data to the map using GeoJSON sources and layers.

> **Two properties every custom layer needs on the Standard style.** `slot` decides where the
> layer sits in the basemap stack — a layer with **no slot draws above everything, including
> street labels**. On **fill, line, and circle** layers, emissive strength keeps it visible
> under the `dusk` and `night` light presets — those properties default to `0`, so without
> them the layer falls into shadow and nearly disappears. Symbol layers need nothing:
> `iconEmissiveStrength` and `textEmissiveStrength` already default to `1`.
>
> - `.bottom` — above land and water, below roads (rasters, choropleth fills)
> - `.middle` — above roads, behind 3D and labels (**routes**, overlays, custom POIs)
> - `.top` — above POI labels (markers, active selections)
>
> These are style-spec properties, so the values are the same on every SDK. See the
> **mapbox-cartography** skill.

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
layer.slot = .middle                          // above roads, under labels and 3D
layer.lineColor = .constant(StyleColor(.blue))
layer.lineWidth = .constant(4)
layer.lineCap = .constant(.round)
layer.lineJoin = .constant(.round)
layer.lineEmissiveStrength = .constant(1)     // stays visible at dusk/night
layer.lineOcclusionOpacity = .constant(1)     // 3D buildings don't hide the route

try? mapView.mapboxMap.addLayer(layer)
```

## Add Polygon (Area)

```swift
let polygonCoordinates = [coord1, coord2, coord3, coord1] // Close the polygon

var source = GeoJSONSource(id: "area-source")
source.data = .geometry(.polygon(Polygon([polygonCoordinates])))

try? mapView.mapboxMap.addSource(source)

var fillLayer = FillLayer(id: "area-fill", source: "area-source")
fillLayer.slot = .bottom                      // under the road network
fillLayer.fillColor = .constant(StyleColor(.blue.withAlphaComponent(0.3)))
fillLayer.fillOutlineColor = .constant(StyleColor(.blue))
fillLayer.fillEmissiveStrength = .constant(1)

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
symbolLayer.slot = .top                       // markers and selections
symbolLayer.iconImage = .constant(.name("marker"))
symbolLayer.iconAllowOverlap = .constant(true) // the default hides colliding icons
symbolLayer.textField = .constant(.expression(Exp(.get) { "name" }))
symbolLayer.textFont = .constant(["DIN Pro Medium", "Arial Unicode MS Bold"])
symbolLayer.textOffset = .constant([0, 1.5])
symbolLayer.textOptional = .constant(true)     // label drops before the icon

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
