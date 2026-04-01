# Pattern 6: Delivery/Logistics Map

**Use case:** Food delivery, package delivery, logistics tracking, on-demand services (DoorDash, Uber Eats, courier apps)

**Visual requirements:**

- Real-time location tracking (drivers, customers)
- Delivery zones clearly defined
- Active routes highly visible
- Status indicators obvious
- Delivery radius visualization
- Performance for live updates

**Recommended layers:**

```json
{
  "layers": [
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#fafafa"
      }
    },
    {
      "id": "water",
      "type": "fill",
      "source": "mapbox-streets",
      "source-layer": "water",
      "paint": {
        "fill-color": "#c6dff5",
        "fill-opacity": 0.5
      }
    },
    {
      "id": "roads-background",
      "type": "line",
      "source": "mapbox-streets",
      "source-layer": "road",
      "paint": {
        "line-color": "#e0e0e0",
        "line-width": {
          "base": 1.5,
          "stops": [
            [10, 1],
            [15, 3],
            [18, 8]
          ]
        }
      }
    },
    {
      "id": "delivery-zones",
      "type": "fill",
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
          "#f44336",
          "#9e9e9e"
        ],
        "fill-opacity": 0.15
      }
    },
    {
      "id": "delivery-zone-borders",
      "type": "line",
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
          "#f44336",
          "#9e9e9e"
        ],
        "line-width": 2,
        "line-dasharray": [3, 2]
      }
    },
    {
      "id": "delivery-radius",
      "type": "fill",
      "source": "delivery-radius",
      "paint": {
        "fill-color": "#2196f3",
        "fill-opacity": 0.1
      }
    },
    {
      "id": "delivery-radius-border",
      "type": "line",
      "source": "delivery-radius",
      "paint": {
        "line-color": "#2196f3",
        "line-width": 2,
        "line-dasharray": [5, 3]
      }
    },
    {
      "id": "active-route",
      "type": "line",
      "source": "active-route",
      "paint": {
        "line-color": "#1976d2",
        "line-width": {
          "base": 1.5,
          "stops": [
            [10, 4],
            [15, 8],
            [18, 16]
          ]
        },
        "line-opacity": 0.8
      }
    },
    {
      "id": "route-progress",
      "type": "line",
      "source": "route-progress",
      "paint": {
        "line-color": "#43a047",
        "line-width": {
          "base": 1.5,
          "stops": [
            [10, 4],
            [15, 8],
            [18, 16]
          ]
        }
      }
    },
    {
      "id": "restaurant-marker",
      "type": "circle",
      "source": "pickup-locations",
      "paint": {
        "circle-radius": 12,
        "circle-color": "#ff5722",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 3
      }
    },
    {
      "id": "restaurant-icon",
      "type": "symbol",
      "source": "pickup-locations",
      "layout": {
        "icon-image": "restaurant-15",
        "icon-size": 1.2,
        "text-field": ["get", "name"],
        "text-offset": [0, 2],
        "text-size": 11
      },
      "paint": {
        "text-color": "#212121",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2
      }
    },
    {
      "id": "customer-marker",
      "type": "circle",
      "source": "delivery-locations",
      "paint": {
        "circle-radius": 12,
        "circle-color": "#4caf50",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 3
      }
    },
    {
      "id": "customer-pulse",
      "type": "circle",
      "source": "delivery-locations",
      "paint": {
        "circle-radius": {
          "base": 1,
          "stops": [
            [0, 12],
            [1, 24]
          ]
        },
        "circle-color": "#4caf50",
        "circle-opacity": {
          "base": 1,
          "stops": [
            [0, 0.3],
            [1, 0]
          ]
        }
      }
    },
    {
      "id": "driver-marker-shadow",
      "type": "circle",
      "source": "driver-locations",
      "paint": {
        "circle-radius": 14,
        "circle-color": "#000000",
        "circle-opacity": 0.2,
        "circle-translate": [0, 2]
      }
    },
    {
      "id": "driver-marker",
      "type": "circle",
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
        "circle-stroke-width": 3
      }
    },
    {
      "id": "driver-direction",
      "type": "symbol",
      "source": "driver-locations",
      "layout": {
        "icon-image": "arrow",
        "icon-size": 0.5,
        "icon-rotate": ["get", "bearing"],
        "icon-rotation-alignment": "map",
        "icon-allow-overlap": true
      }
    },
    {
      "id": "eta-badges",
      "type": "symbol",
      "source": "driver-locations",
      "layout": {
        "text-field": ["concat", ["get", "eta"], " min"],
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
- Use symbol layers instead of HTML markers for 50+ drivers
