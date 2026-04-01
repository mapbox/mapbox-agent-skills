# Annotations: Circle, Polyline, Polygon

Additional annotation types beyond point markers.

## Circle Annotations

```kotlin
val circleAnnotationManager = mapView.annotations.createCircleAnnotationManager()

val circle = CircleAnnotationOptions()
    .withPoint(Point.fromLngLat(-122.4194, 37.7749))
    .withCircleRadius(10.0)
    .withCircleColor("#FF0000")

circleAnnotationManager.create(circle)
```

## Polyline Annotations

```kotlin
val polylineAnnotationManager = mapView.annotations.createPolylineAnnotationManager()

val polyline = PolylineAnnotationOptions()
    .withPoints(listOf(point1, point2, point3))
    .withLineColor("#0000FF")
    .withLineWidth(4.0)

polylineAnnotationManager.create(polyline)
```

## Polygon Annotations

```kotlin
val polygonAnnotationManager = mapView.annotations.createPolygonAnnotationManager()

val points = listOf(listOf(coord1, coord2, coord3, coord1)) // Close the polygon

val polygon = PolygonAnnotationOptions()
    .withPoints(points)
    .withFillColor("#0000FF")
    .withFillOpacity(0.5)

polygonAnnotationManager.create(polygon)
```
