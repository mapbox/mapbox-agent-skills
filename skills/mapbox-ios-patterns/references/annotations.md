# Annotations: Markers, Points, Circle, Polyline, Polygon

Deeper reference for the annotation APIs summarized in SKILL.md.

---

## Picking an annotation API

- **`Marker` (Markers API)** — SwiftUI-only convenience pin. No image assets required. Marked `@_spi(Experimental)`; import with `@_spi(Experimental) import MapboxMaps`. Best when you just need a pin and have < 100 points.
- **`PointAnnotation`** — SwiftUI + UIKit. Use when you have a custom image. Backed by a symbol layer under the hood, so it scales better than view annotations.
- **View annotations (`ViewAnnotation` / `MapViewAnnotation`)** — SwiftUI + UIKit. Render an arbitrary native view anchored to a coordinate. In SwiftUI use `MapViewAnnotation { SomeView() }`; in UIKit use `mapView.viewAnnotations.add(_:)` with a `ViewAnnotation`. Expensive per annotation.
- **`SymbolLayer` on `GeoJSONSource`** — for thousands of features, clustering, or data-driven styling.

## Markers API (SwiftUI)

```swift
import SwiftUI
@_spi(Experimental) import MapboxMaps

struct MyMap: View {
    let locations: [Location]

    var body: some View {
        Map {
            ForEvery(locations, id: \.id) { location in
                Marker(coordinate: location.coordinate)
                    .color(.red)
                    .stroke(.white)
                    .innerColor(.white)
                    .text(location.name)
                    .onTapGesture {
                        print("tapped \(location.name)")
                    }
            }
        }
    }
}
```

Remove a marker by taking it out of the `Map` block — `if` / `switch` inside the builder work as expected.

Markers appear above all other map content (layers, annotations, puck). If you need layer-ordered placement, use `PointAnnotation`.

## Point Annotations: custom image

```swift
var manager = mapView.annotations.makePointAnnotationManager()

var annotation = PointAnnotation(coordinate: coordinate)
annotation.image = .init(image: UIImage(named: "marker")!, name: "marker")
annotation.iconAnchor = .bottom

manager.annotations = [annotation]
```

---

## Circle Annotations

```swift
var circleAnnotationManager = mapView.annotations.makeCircleAnnotationManager()

var circle = CircleAnnotation(coordinate: coordinate)
circle.circleRadius = 10
circle.circleColor = StyleColor(.red)

circleAnnotationManager.annotations = [circle]
```

## Polyline Annotations

```swift
var polylineAnnotationManager = mapView.annotations.makePolylineAnnotationManager()

let coordinates = [coord1, coord2, coord3]
var polyline = PolylineAnnotation(lineCoordinates: coordinates)
polyline.lineColor = StyleColor(.blue)
polyline.lineWidth = 4

polylineAnnotationManager.annotations = [polyline]
```

## Polygon Annotations

```swift
var polygonAnnotationManager = mapView.annotations.makePolygonAnnotationManager()

let coordinates = [coord1, coord2, coord3, coord1] // Close the polygon
var polygon = PolygonAnnotation(polygon: .init(outerRing: .init(coordinates)))
polygon.fillColor = StyleColor(.blue.withAlphaComponent(0.5))
polygon.fillOutlineColor = StyleColor(.blue)

polygonAnnotationManager.annotations = [polygon]
```
