# Geolocation, Distance & Directions

## Geolocation and Distance Calculation

**Two separate APIs for two separate jobs:**

1. **`mapboxgl.GeolocateControl`** — Adds the blue dot on the map showing the user's live position. This is a UI control only; use it for the visual indicator.
2. **`navigator.geolocation.getCurrentPosition()`** — Returns the raw coordinates you need for distance calculation and sorting. Call this separately because `GeolocateControl` does not expose coordinates in a convenient way for data processing.

```javascript
let userLocation = null;

// 1. Add GeolocateControl for the blue dot on-map indicator
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
  })
);

// 2. Use navigator.geolocation.getCurrentPosition() separately to get
//    coordinates for distance calculation and sorting
navigator.geolocation.getCurrentPosition(
  (position) => {
    userLocation = [position.coords.longitude, position.coords.latitude];

    // Calculate distances and sort
    const storesWithDistance = stores.features.map((store) => {
      const distance = calculateDistance(userLocation, store.geometry.coordinates);
      return {
        ...store,
        properties: {
          ...store.properties,
          distance: distance
        }
      };
    });

    // Sort by distance
    storesWithDistance.sort((a, b) => a.properties.distance - b.properties.distance);

    // Update data
    stores.features = storesWithDistance;

    // Rebuild list with distances
    document.getElementById('listings').innerHTML = '';
    buildLocationList(stores);
  },
  (error) => {
    console.error('Error getting location:', error);
  }
);

// Calculate distance using Turf.js (recommended)
import * as turf from '@turf/turf';

function calculateDistance(from, to) {
  const fromPoint = turf.point(from);
  const toPoint = turf.point(to);
  const distance = turf.distance(fromPoint, toPoint, { units: 'miles' });
  return distance.toFixed(1); // Distance in miles
}

// Update listing to show distance
function buildLocationList(stores) {
  const listingContainer = document.getElementById('listings');

  stores.features.forEach((store) => {
    const listing = listingContainer.appendChild(document.createElement('div'));
    listing.id = `listing-${store.properties.id}`;
    listing.className = 'listing';

    const link = listing.appendChild(document.createElement('a'));
    link.href = '#';
    link.className = 'title';
    link.innerHTML = store.properties.name;

    const details = listing.appendChild(document.createElement('div'));
    details.innerHTML = `
      ${store.properties.distance ? `<p class="distance">${store.properties.distance} mi</p>` : ''}
      <p>${store.properties.address}</p>
      <p>${store.properties.phone || ''}</p>
    `;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      flyToStore(store);
      createPopup(store);
      highlightListing(store.properties.id);
    });
  });
}
```

## Directions Integration

```javascript
async function getDirections(from, to) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?` +
      `steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
  );

  const data = await query.json();
  const route = data.routes[0];

  // Display route on map
  if (map.getSource('route')) {
    map.getSource('route').setData({
      type: 'Feature',
      geometry: route.geometry
    });
  } else {
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: route.geometry
      }
    });

    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      paint: {
        'line-color': '#3b9ddd',
        'line-width': 5,
        'line-opacity': 0.75
      }
    });
  }

  // Display directions info
  const duration = Math.floor(route.duration / 60);
  const distance = (route.distance * 0.000621371).toFixed(1); // Convert to miles

  return { duration, distance, steps: route.legs[0].steps };
}

// Add "Get Directions" button to popup
function createPopup(store) {
  const popups = document.getElementsByClassName('mapboxgl-popup');
  if (popups[0]) popups[0].remove();

  const popup = new mapboxgl.Popup({ closeOnClick: true })
    .setLngLat(store.geometry.coordinates)
    .setHTML(
      `<h3>${store.properties.name}</h3>
       <p>${store.properties.address}</p>
       <p>${store.properties.phone}</p>
       ${userLocation ? '<button id="get-directions">Get Directions</button>' : ''}`
    )
    .addTo(map);

  // Handle directions button
  if (userLocation) {
    document.getElementById('get-directions').addEventListener('click', async () => {
      const directions = await getDirections(userLocation, store.geometry.coordinates);

      // Update popup with directions
      popup.setHTML(
        `<h3>${store.properties.name}</h3>
         <p><strong>${directions.distance} mi • ${directions.duration} min</strong></p>
         <p>${store.properties.address}</p>
         <div class="directions-steps">
           ${directions.steps.map((step) => `<p>${step.maneuver.instruction}</p>`).join('')}
         </div>`
      );
    });
  }
}
```
