# Annotations: Markers, Points, Circle, Polyline, Polygon, View Annotations

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

**SwiftUI — single:**

```swift
Map(viewport: $viewport) {
    CircleAnnotation(centerCoordinate: coordinate)
        .circleRadius(8)
        .circleColor(StyleColor(UIColor(red: 0.44, green: 0.31, blue: 0.22, alpha: 1)))
        .circleStrokeColor(StyleColor(.white))
        .circleStrokeWidth(2)
        .onTapGesture {
            print("Circle tapped")
        }
}
```

**SwiftUI — group from data:**

```swift
Map(viewport: $viewport) {
    CircleAnnotationGroup(shops) { shop in
        CircleAnnotation(centerCoordinate: shop.coordinate)
            .circleRadius(8)
            .circleColor(StyleColor(UIColor(red: 0.44, green: 0.31, blue: 0.22, alpha: 1)))
            .circleStrokeColor(StyleColor(.white))
            .circleStrokeWidth(2)
            .onTapGesture {
                selectedShop = shop
            }
    }
}
```

> `StyleColor(red:green:blue:alpha:)` returns optional — always use `StyleColor(UIColor(...))` instead.

**UIKit:**

```swift
var circleAnnotationManager = mapView.annotations.makeCircleAnnotationManager()

var circle = CircleAnnotation(centerCoordinate: coordinate)
circle.circleRadius = 10
circle.circleColor = StyleColor(UIColor.red)

circleAnnotationManager.annotations = [circle]
```

---

## Custom SwiftUI View Annotations (Callouts)

Use `MapViewAnnotation` to pin any SwiftUI view to a coordinate — ideal for selected-state callouts:

```swift
Map(viewport: $viewport) {
    if let selected = selectedShop {
        MapViewAnnotation(coordinate: selected.coordinate) {
            Text(selected.name)
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(.white)
                .clipShape(Capsule())
                .shadow(color: .black.opacity(0.15), radius: 4, y: 2)
        }
        .allowOverlap(true)
        .variableAnchors([ViewAnnotationAnchorConfig(anchor: .bottom, offsetY: 10)])
    }
}
```

---

## Polyline Annotations

**SwiftUI:**

```swift
Map(viewport: $viewport) {
    PolylineAnnotation(lineCoordinates: [coord1, coord2, coord3])
        .lineColor(StyleColor(.blue))
        .lineWidth(4)
}
```

**UIKit:**

```swift
var polylineAnnotationManager = mapView.annotations.makePolylineAnnotationManager()

var polyline = PolylineAnnotation(lineCoordinates: [coord1, coord2, coord3])
polyline.lineColor = StyleColor(.blue)
polyline.lineWidth = 4

polylineAnnotationManager.annotations = [polyline]
```

---

## Polygon Annotations

**SwiftUI:**

```swift
Map(viewport: $viewport) {
    PolygonAnnotation(polygon: .init(outerRing: .init([coord1, coord2, coord3, coord1])))
        .fillColor(StyleColor(UIColor.blue.withAlphaComponent(0.5)))
        .fillOutlineColor(StyleColor(.blue))
}
```

**UIKit:**

```swift
var polygonAnnotationManager = mapView.annotations.makePolygonAnnotationManager()

var polygon = PolygonAnnotation(polygon: .init(outerRing: .init([coord1, coord2, coord3, coord1])))
polygon.fillColor = StyleColor(UIColor.blue.withAlphaComponent(0.5))
polygon.fillOutlineColor = StyleColor(.blue)

polygonAnnotationManager.annotations = [polygon]
```
