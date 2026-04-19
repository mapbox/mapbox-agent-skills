# Annotations: Circle, Polyline, Polygon, View Annotations

Additional annotation types beyond Point Annotations (covered in SKILL.md).

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
