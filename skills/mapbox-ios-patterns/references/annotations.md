# Annotations: Circle, Polyline, Polygon

Additional annotation types beyond Point Annotations (covered in SKILL.md).

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
