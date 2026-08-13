# Pattern 4: Navigation/Routing Map

**Use case:** Turn-by-turn directions, route planning, delivery apps

**Visual requirements:**

- Route highly visible
- Current location always clear
- Turn points obvious
- Street names readable
- Performance optimized

## Basemap config

The route and the next maneuver must dominate — but unlike a data-viz map, navigation _needs_ a rich base: landmarks orient the driver, and 3D earns its cost at z16+, where a building footprint identifies the destination.

```javascript
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard',
  config: {
    basemap: {
      theme: 'default', // don't fade the base — road hierarchy is the content
      showRoadLabels: true, // street names are essential here
      showPlaceLabels: true,
      showLandmarkIcons: true, // landmarks orient the driver
      show3dObjects: true, // footprints identify the destination at z16+
      showPedestrianRoads: true, // last-mile and walking legs
      showPointOfInterestLabels: true,
      densityPointOfInterestLabels: 2 // thin them so the route stays dominant
    }
  }
});

// Night driving — one property, bound to the OS appearance
map.setConfigProperty('basemap', 'lightPreset', 'night');
```

Standard's own road hierarchy, casings, and label collision are already tuned for navigation. Don't re-author the road network; add only the route, the user's position, and the maneuvers.

## Route: casing + line, both in `middle`

Routes go in **`middle`**, not `top`. In `middle` the route reads above the road network but under all labels and 3D buildings, so street names stay legible over it.

```javascript
// Casing first (drawn under the line — same slot keeps insertion order)
map.addLayer({
  id: 'route-casing',
  type: 'line',
  slot: 'middle',
  source: 'route',
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': '#0d47a1',
    'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 10, 8, 15, 16, 18, 32],
    'line-opacity': 0.4,
    'line-emissive-strength': 1,
    'line-occlusion-opacity': 1
  }
});

map.addLayer({
  id: 'route-line',
  type: 'line',
  slot: 'middle',
  source: 'route',
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    // The route is user content — this is where the brand color belongs
    'line-color': '#2196f3',
    'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 10, 6, 15, 12, 18, 24],
    'line-emissive-strength': 1, // or the route vanishes at dusk/night
    'line-occlusion-opacity': 1 // 3D buildings don't hide the route
  }
});
```

`line-occlusion-opacity` is what keeps the route visible where it passes behind 3D buildings — without it the line disappears block by block in a pitched camera.

## User location

For the standard blue dot, prefer the built-in control (web) or the platform location component — it handles heading, accuracy rings, and permissions for you:

```javascript
map.addControl(new mapboxgl.GeolocateControl({ trackUserLocation: true, showUserHeading: true }));
```

If you're rendering position from your own source (a tracked vehicle rather than the device), use circle layers in `top`:

```javascript
map.addLayer({
  id: 'user-location-pulse',
  type: 'circle',
  slot: 'top',
  source: 'user-location',
  paint: {
    'circle-radius': 20,
    'circle-color': '#2196f3',
    'circle-opacity': 0.25,
    'circle-emissive-strength': 1
  }
});

map.addLayer({
  id: 'user-location',
  type: 'circle',
  slot: 'top',
  source: 'user-location',
  paint: {
    'circle-radius': 8,
    'circle-color': '#2196f3',
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 3,
    'circle-emissive-strength': 1
  }
});
```

Animate the pulse with `requestAnimationFrame` + `setPaintProperty` — a zoom-`interpolate` expression cannot animate over time.

## Turn arrows

```javascript
map.addLayer({
  id: 'turn-arrows',
  type: 'symbol',
  slot: 'top',
  source: 'route-maneuvers',
  layout: {
    'icon-image': ['get', 'arrow-type'],
    'icon-size': ['interpolate', ['linear'], ['zoom'], 12, 1, 18, 1.8],
    'icon-rotation-alignment': 'map',
    'icon-rotate': ['get', 'bearing'],
    'icon-allow-overlap': true // never drop a maneuver icon
  }
});
```

**Key features:**

- Standard's tuned road hierarchy and label collision, not a hand-authored stack
- Thick, high-contrast route in `middle` — above roads, under labels
- `line-occlusion-opacity` keeps the route readable through 3D buildings
- Pulsing user location and maneuver icons in `top`
- Night driving via `lightPreset`, not a second style

> For full turn-by-turn — voice guidance, route progress, off-route detection — use the **Mapbox Navigation SDK** rather than assembling it from these layers.
