# Pattern 6: Delivery/Logistics Map

**Use case:** Food delivery, package delivery, logistics tracking, on-demand services (DoorDash, Uber Eats, courier apps)

**Visual requirements:**

- Real-time location tracking (drivers, customers)
- Delivery zones clearly defined
- Active routes highly visible
- Status indicators obvious
- Active delivery location must read as _live_ — a static dot doesn't; the customer marker needs a pulsing ring
  (second circle layer + `requestAnimationFrame` + `setPaintProperty`, shown below)
- Delivery radius visualization
- Performance for live updates

## Basemap config

The basemap's job here is orientation only — zones, routes, and drivers are the content. Quiet it, and keep the road network for context.

```javascript
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard',
  config: {
    basemap: {
      theme: 'faded', // desaturate so zones and driver pins dominate
      showPointOfInterestLabels: false, // POIs compete with pickup and drop-off pins
      showRoadLabels: true, // couriers need street names
      showPlaceLabels: true,
      show3dObjects: false // 3D occludes zones and hides driver markers
    }
  }
});

// Night shifts — one property, bound to the app theme
map.setConfigProperty('basemap', 'lightPreset', 'night');
```

Don't hand-author background, water, and road layers — Standard supplies them, already tuned and label-collided.

## Your layers

Zone fills sit in `bottom` (roads draw over them, keeping the network readable); routes, radius, and markers stack in `middle` and `top`. Every non-3D layer carries emissive strength `1`, or it disappears under the `dusk` / `night` presets.

```json
{
  "layers": [
    {
      "id": "delivery-zones",
      "type": "fill",
      "slot": "bottom",
      "source": "delivery-zones",
      "paint": {
        "fill-color": [
          "match",
          ["get", "status"],
          "available",
          "#4caf50",
          "busy",
          "#ff9800",
          "unavailable",
          "#b2182b",
          "#9e9e9e"
        ],
        "fill-opacity": 0.15,
        "fill-emissive-strength": 1
      }
    },
    {
      "id": "delivery-zone-borders",
      "type": "line",
      "slot": "bottom",
      "source": "delivery-zones",
      "paint": {
        "line-color": [
          "match",
          ["get", "status"],
          "available",
          "#4caf50",
          "busy",
          "#ff9800",
          "unavailable",
          "#b2182b",
          "#9e9e9e"
        ],
        "line-width": 2,
        "line-dasharray": [
          "match",
          ["get", "status"],
          "available",
          ["literal", [1, 0]],
          "busy",
          ["literal", [3, 2]],
          "unavailable",
          ["literal", [1, 2]],
          ["literal", [3, 2]]
        ],
        "line-emissive-strength": 1
      }
    },
    {
      "id": "delivery-radius",
      "type": "fill",
      "slot": "bottom",
      "source": "delivery-radius",
      "paint": {
        "fill-color": "#2196f3",
        "fill-opacity": 0.1,
        "fill-emissive-strength": 1
      }
    },
    {
      "id": "delivery-radius-border",
      "type": "line",
      "slot": "bottom",
      "source": "delivery-radius",
      "paint": {
        "line-color": "#2196f3",
        "line-width": 2,
        "line-dasharray": [5, 3],
        "line-emissive-strength": 1
      }
    },
    {
      "id": "active-route",
      "type": "line",
      "slot": "middle",
      "source": "active-route",
      "layout": { "line-cap": "round", "line-join": "round" },
      "paint": {
        "line-color": "#1976d2",
        "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 10, 4, 15, 8, 18, 16],
        "line-opacity": 0.8,
        "line-emissive-strength": 1,
        "line-occlusion-opacity": 1
      }
    },
    {
      "id": "route-progress",
      "type": "line",
      "slot": "middle",
      "source": "route-progress",
      "layout": { "line-cap": "round", "line-join": "round" },
      "paint": {
        "line-color": "#43a047",
        "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 10, 4, 15, 8, 18, 16],
        "line-emissive-strength": 1,
        "line-occlusion-opacity": 1
      }
    },
    {
      "id": "restaurant-marker",
      "type": "circle",
      "slot": "top",
      "source": "pickup-locations",
      "paint": {
        "circle-radius": 12,
        "circle-color": "#ff5722",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 3,
        "circle-emissive-strength": 1
      }
    },
    {
      "id": "restaurant-icon",
      "type": "symbol",
      "slot": "top",
      "source": "pickup-locations",
      "layout": {
        "icon-image": "restaurant-marker",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 12, 0.9, 17, 1.3],
        "icon-allow-overlap": true,
        "text-field": ["get", "name"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
        "text-offset": [0, 2],
        "text-size": 11,
        "text-optional": true
      },
      "paint": {
        "text-color": "#212121",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2
      }
    },
    {
      "id": "customer-pulse",
      "type": "circle",
      "slot": "top",
      "source": "delivery-locations",
      "paint": {
        "circle-radius": 12,
        "circle-color": "#4caf50",
        "circle-opacity": 0.3,
        "circle-emissive-strength": 1
      }
    },
    {
      "id": "customer-marker",
      "type": "circle",
      "slot": "top",
      "source": "delivery-locations",
      "paint": {
        "circle-radius": 12,
        "circle-color": "#4caf50",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 3,
        "circle-emissive-strength": 1
      }
    },
    {
      "id": "driver-marker-shadow",
      "type": "circle",
      "slot": "top",
      "source": "driver-locations",
      "paint": {
        "circle-radius": 14,
        "circle-color": "#000000",
        "circle-opacity": 0.2,
        "circle-translate": [0, 2],
        "circle-emissive-strength": 1
      }
    },
    {
      "id": "driver-marker",
      "type": "circle",
      "slot": "top",
      "source": "driver-locations",
      "paint": {
        "circle-radius": 14,
        "circle-color": [
          "match",
          ["get", "status"],
          "picking_up",
          "#ff9800",
          "en_route",
          "#2196f3",
          "delivered",
          "#4caf50",
          "#9e9e9e"
        ],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 3,
        "circle-emissive-strength": 1
      }
    },
    {
      "id": "driver-direction",
      "type": "symbol",
      "slot": "top",
      "source": "driver-locations",
      "layout": {
        "icon-image": "arrow",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 12, 0.4, 18, 0.7],
        "icon-rotate": ["get", "bearing"],
        "icon-rotation-alignment": "map",
        "icon-allow-overlap": true
      }
    },
    {
      "id": "eta-badges",
      "type": "symbol",
      "slot": "top",
      "source": "driver-locations",
      "layout": {
        "text-field": ["concat", ["get", "eta"], " min"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 11,
        "text-offset": [0, -2.5],
        "text-allow-overlap": true
      },
      "paint": {
        "text-color": "#ffffff",
        "text-halo-color": "#1976d2",
        "text-halo-width": 8,
        "text-halo-blur": 1
      }
    }
  ]
}
```

> **Status color coding needs a second cue.** Green/orange/red is a strong convention for
> availability, but roughly 1 in 12 men cannot separate the green and red ends, so status must
> not rest on hue alone — the zone borders above also vary their dash pattern by status, and the
> driver pins pair color with the direction arrow and the ETA badge. The "unavailable" red is
> `#b2182b` (the RdBu dark-red endpoint) rather than a pure `#f44336`, which holds up better
> against the faded basemap.
>
> **Platform caveat:** the `match` expression on `line-dasharray` above is **Mapbox GL JS only**
> (data-driven `line-dasharray` requires GL JS ≥ 2.3.0 and is not yet supported on the Android or
> iOS SDKs). For a cross-platform build, split the borders into one layer per status, each with a
> constant `line-dasharray` and a `filter` on `status` — three small layers instead of one
> expression:
>
> ```json
> {
>   "id": "zone-border-busy",
>   "type": "line",
>   "slot": "bottom",
>   "source": "delivery-zones",
>   "filter": ["==", ["get", "status"], "busy"],
>   "paint": { "line-color": "#ff9800", "line-width": 2, "line-dasharray": [3, 2], "line-emissive-strength": 1 }
> }
> ```

**Key features:**

- Color-coded delivery zones (green=available, orange=busy, red=unavailable)
- Real-time driver markers with status colors
- Pulsing customer location indicator
- Active route with completed progress shown in different color
- Delivery radius visualization with dashed border
- ETA badges on driver markers
- Direction arrows showing driver heading
- Restaurant/pickup locations clearly marked
- Shadow effects on driver markers for depth

> The `customer-pulse` layer uses flat `circle-radius` / `circle-opacity` values because the
> pulse is animated over **time** via `requestAnimationFrame` + `setPaintProperty` (see below).
> A zoom `interpolate` expression cannot animate over time — the legacy `{base, stops}` form
> that looks like it does was a zoom function, not an animation.

**Load custom arrow icon:**

```javascript
// Load custom arrow icon for driver direction indicator
// Note: 'arrow' is not a standard Maki icon and must be loaded manually
map.on('load', () => {
  map.loadImage('path/to/arrow-icon.png', (error, image) => {
    if (error) throw error;
    map.addImage('arrow', image);
  });
});
```

**Real-time update pattern:**

```javascript
// Update driver location (call on GPS update)
map.getSource('driver-locations').setData({
  type: 'FeatureCollection',
  features: drivers.map((driver) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: driver.location
    },
    properties: {
      id: driver.id,
      status: driver.status,
      bearing: driver.bearing,
      eta: driver.eta
    }
  }))
});

// Animate route progress
function updateRouteProgress(completedCoordinates) {
  map.getSource('route-progress').setData({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: completedCoordinates
    }
  });
}

// Pulse animation for active delivery
function pulseCustomerMarker() {
  const duration = 2000;
  const start = performance.now();

  function animate(time) {
    const elapsed = time - start;
    const phase = (elapsed % duration) / duration;

    // Update radius (12 to 24 pixels)
    map.setPaintProperty('customer-pulse', 'circle-radius', 12 + phase * 12);

    // Update opacity (fade from 0.3 to 0)
    map.setPaintProperty('customer-pulse', 'circle-opacity', 0.3 * (1 - phase));

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
```

**Performance tips:**

- Update driver positions every 3-5 seconds (not every GPS ping)
- Use `setData()` instead of removing/re-adding sources
- Limit visible drivers to current viewport + buffer
- Debounce rapid updates during high activity
- Use a GL layer instead of HTML markers from ~100 drivers; move to a vector tileset once the fleet payload runs to a few MB. Cluster only if driver pins actually overlap at the zooms dispatchers watch — for a live fleet view they usually shouldn't, since each driver needs to stay individually visible
- Prefer `setPaintProperty` on a `feature-state` expression over rebuilding layers for status changes
