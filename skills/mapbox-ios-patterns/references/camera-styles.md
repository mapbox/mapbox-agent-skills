# Camera Control + Map Styles

---

## Camera Control

### Set Camera Position

```swift
// SwiftUI - Update viewport state
viewport = .camera(
    center: CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060),
    zoom: 14,
    bearing: 90,
    pitch: 60
)

// UIKit - Immediate
mapView.mapboxMap.setCamera(to: CameraOptions(
    center: CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060),
    zoom: 14,
    bearing: 90,
    pitch: 60
))
```

### Animated Camera Transitions

```swift
// Fly animation (dramatic arc)
mapView.camera.fly(to: CameraOptions(
    center: destination,
    zoom: 15
), duration: 2.0)

// Ease animation (smooth)
mapView.camera.ease(to: CameraOptions(
    center: destination,
    zoom: 15
), duration: 1.0)
```

### Fit Camera to Coordinates

```swift
let coordinates = [coord1, coord2, coord3]
let camera = mapView.mapboxMap.camera(for: coordinates,
                                       padding: UIEdgeInsets(top: 50, left: 50, bottom: 50, right: 50),
                                       bearing: 0,
                                       pitch: 0)
mapView.camera.ease(to: camera, duration: 1.0)
```

---

## Map Styles

### Built-in Styles

`.standard` is the recommended default. You rarely need a different style — Standard's **config surface** covers appearance changes without a reload.

```swift
// SwiftUI
Map(viewport: $viewport)
    .mapStyle(.standard)          // Mapbox Standard (recommended)
    .mapStyle(.standardSatellite) // imagery with roads, labels, boundaries on top

// UIKit
mapView.mapboxMap.loadStyle(.standard)
```

The Classic styles (`.streets`, `.outdoors`, `.light`, `.dark`) are 2D, have **no slots and no config surface**, and you restyle them by editing layer paint. Reach for one only when you need per-layer paint control that config can't express, or a deliberate 2D / low-power fallback.

### Configure Standard: dark mode and visibility

Dark mode is a **light preset**, not a separate style. SwiftUI takes it inline:

```swift
Map(viewport: $viewport)
    .mapStyle(.standard(lightPreset: .night))   // .dawn | .day | .dusk | .night
```

Bind it to the system appearance so the map follows the app:

```swift
@Environment(\.colorScheme) var colorScheme

Map(viewport: $viewport)
    .mapStyle(.standard(lightPreset: colorScheme == .dark ? .night : .day))
```

Imperatively — and for every other config key — set the property on the `"basemap"` import. Never reload the style for an incremental change:

```swift
try mapView.mapboxMap.setStyleImportConfigProperty(
    for: "basemap", config: "lightPreset", value: "night"
)
try mapView.mapboxMap.setStyleImportConfigProperty(
    for: "basemap", config: "theme", value: "monochrome"  // default | faded | monochrome
)
try mapView.mapboxMap.setStyleImportConfigProperty(
    for: "basemap", config: "showPointOfInterestLabels", value: false
)
try mapView.mapboxMap.setStyleImportConfigProperty(
    for: "basemap", config: "show3dObjects", value: false
)
```

Standard shifts land, buildings, water, roads, and label colors along with the lighting, so the preset alone is a complete dark basemap. Two caveats, both covered in the **mapbox-cartography** skill:

- **Your own layers don't adapt.** They keep the colors you gave them, and fill / line / circle layers go nearly invisible at night without emissive strength (those default to `0`; symbol layers already default to `1`) — see [custom-data.md](custom-data.md).
- **`color*` config overrides are day values.** Standard re-derives them per preset, so handing it an already-dark `colorLand` double-darkens to near-black.

### Custom Style URL

```swift
// SwiftUI
Map(viewport: $viewport)
    .mapStyle(MapStyle(uri: StyleURI(url: customStyleURL)!))

// UIKit
mapView.mapboxMap.loadStyle(StyleURI(url: customStyleURL)!)
```

**Style from Mapbox Studio:**

```swift
let styleURL = URL(string: "mapbox://styles/username/style-id")!
```
