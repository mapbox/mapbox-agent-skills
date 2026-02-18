# Store Locator Patterns

Quick reference for building store locators and location finders with Mapbox.

## Architecture

**Core Components:**

1. Map with markers
2. Location data (GeoJSON)
3. Interactive list
4. Search/filter
5. User location + distance
6. Directions (optional)

## Data Structure

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-77.034084, 38.909671]
      },
      "properties": {
        "id": "store-001",
        "name": "Downtown Store",
        "address": "123 Main St, DC 20001",
        "phone": "(202) 555-0123",
        "category": "retail",
        "hours": "Mon-Sat: 9am-9pm"
      }
    }
  ]
}
```

## Marker Strategies

| Locations    | Strategy     | Implementation                 |
| ------------ | ------------ | ------------------------------ |
| **< 100**    | HTML Markers | `new mapboxgl.Marker()`        |
| **100-1000** | Symbol Layer | `addLayer({ type: 'symbol' })` |
| **> 1000**   | Clustering   | `cluster: true` in source      |

## HTML Markers Pattern

```javascript
stores.features.forEach((store) => {
  const marker = new mapboxgl.Marker()
    .setLngLat(store.geometry.coordinates)
    .setPopup(
      new mapboxgl.Popup().setHTML(`
        <h3>${store.properties.name}</h3>
        <p>${store.properties.address}</p>
      `)
    )
    .addTo(map);
});
```

## Symbol Layer Pattern

```javascript
map.on('load', () => {
  map.addSource('stores', {
    type: 'geojson',
    data: stores
  });

  map.addLayer({
    id: 'stores',
    type: 'symbol',
    source: 'stores',
    layout: {
      'icon-image': 'custom-marker',
      'icon-size': 0.8,
      'text-field': ['get', 'name'],
      'text-offset': [0, 1.5]
    }
  });

  // Using Interactions API (recommended)
  map.addInteraction('store-click', {
    type: 'click',
    target: { layerId: 'stores' },
    handler: (e) => {
      const store = e.feature;
      showStoreDetails(store);
    }
  });

  // Or using traditional event listener
  // map.on('click', 'stores', (e) => {
  //   const store = e.features[0];
  //   showStoreDetails(store);
  // });
});
```

## Clustering Pattern

```javascript
map.addSource('stores', {
  type: 'geojson',
  data: stores,
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50
});

// Clusters
map.addLayer({
  id: 'clusters',
  type: 'circle',
  source: 'stores',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 30, '#f28cb1'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40]
  }
});

// Unclustered points
map.addLayer({
  id: 'unclustered-point',
  type: 'circle',
  source: 'stores',
  filter: ['!', ['has', 'point_count']],
  paint: { 'circle-color': '#11b4da', 'circle-radius': 8 }
});
```

## Interactive List

```javascript
function buildLocationList(stores) {
  const container = document.getElementById('listings');
  container.innerHTML = '';

  stores.features.forEach((store) => {
    const listing = document.createElement('div');
    listing.className = 'listing';
    listing.innerHTML = `
      <a href="#" class="title">${store.properties.name}</a>
      <p>${store.properties.address}</p>
      ${store.properties.distance ? `<p class="distance">${store.properties.distance} mi</p>` : ''}
    `;

    listing.querySelector('.title').addEventListener('click', (e) => {
      e.preventDefault();
      flyToStore(store);
      createPopup(store);
    });

    container.appendChild(listing);
  });
}

function flyToStore(store) {
  map.flyTo({
    center: store.geometry.coordinates,
    zoom: 15
  });
}
```

## Search/Filter

**Text Search:**

```javascript
function filterStores(query) {
  const filtered = {
    type: 'FeatureCollection',
    features: stores.features.filter((store) => {
      const name = store.properties.name.toLowerCase();
      const address = store.properties.address.toLowerCase();
      return name.includes(query.toLowerCase()) || address.includes(query.toLowerCase());
    })
  };

  map.getSource('stores').setData(filtered);
  buildLocationList(filtered);
}

document.getElementById('search').addEventListener('input', (e) => {
  filterStores(e.target.value);
});
```

**Category Filter:**

```javascript
function filterByCategory(category) {
  const filtered =
    category === 'all'
      ? stores
      : {
          type: 'FeatureCollection',
          features: stores.features.filter((s) => s.properties.category === category)
        };

  map.getSource('stores').setData(filtered);
  buildLocationList(filtered);
}
```

## Distance Calculation

**Using Turf.js (recommended):**

```javascript
import * as turf from '@turf/turf';

// Calculate distance between two points
function calculateDistance(from, to) {
  const fromPoint = turf.point(from);
  const toPoint = turf.point(to);
  const distance = turf.distance(fromPoint, toPoint, { units: 'miles' });
  return distance.toFixed(1);
}

// Get user location
navigator.geolocation.getCurrentPosition((position) => {
  const userLocation = [position.coords.longitude, position.coords.latitude];

  // Add distances
  stores.features = stores.features.map((store) => ({
    ...store,
    properties: {
      ...store.properties,
      distance: calculateDistance(userLocation, store.geometry.coordinates)
    }
  }));

  // Sort by distance
  stores.features.sort((a, b) => a.properties.distance - b.properties.distance);

  buildLocationList(stores);
});
```

## Directions Integration

```javascript
async function getDirections(from, to) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${from[0]},${from[1]};${to[0]},${to[1]}?` +
      `geometries=geojson&access_token=${mapboxgl.accessToken}`
  );

  const route = (await query.json()).routes[0];

  // Display route
  map.getSource('route').setData({
    type: 'Feature',
    geometry: route.geometry
  });

  // Add route layer if not exists
  if (!map.getLayer('route')) {
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      paint: {
        'line-color': '#3b9ddd',
        'line-width': 5
      }
    });
  }

  return {
    duration: Math.floor(route.duration / 60),
    distance: (route.distance * 0.000621371).toFixed(1)
  };
}
```

## Layout Patterns

**Sidebar + Map:**

```html
<div style="display: flex; height: 100vh;">
  <div class="sidebar" style="width: 400px; overflow-y: scroll;">
    <input type="text" id="search" placeholder="Search..." />
    <div id="listings"></div>
  </div>
  <div id="map" style="flex: 1;"></div>
</div>
```

**Mobile Responsive:**

```css
@media (max-width: 768px) {
  #app {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: 40vh;
  }
  #map {
    height: 60vh;
  }
}
```

## Performance Tips

```javascript
// Debounce search
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const debouncedSearch = debounce(filterStores, 300);
```

## Geolocation Control

```javascript
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true
  })
);
```

## Common Patterns

**Restaurant Finder:**

- Category filters (cuisine type)
- Price range filters
- Rating display
- Hours of operation
- Delivery/pickup options

**Office Locator:**

- Department filters
- Floor/building numbers
- Contact information
- Meeting room availability

**Retail Store Finder:**

- Inventory availability
- Store hours
- Services offered
- Appointment booking

## Quick Decisions

**Need clustering?**
→ Yes if > 1000 locations

**Need search?**
→ Always include for > 10 locations

**Need directions?**
→ Yes for physical locations users visit

**Need distance sorting?**
→ Yes if user location available

**Need filters?**
→ Yes if > 20 locations or multiple categories

## Resources

- [Turf.js](https://turfjs.org/) - Spatial analysis (distance, area, etc.)
- [Interactions API](https://docs.mapbox.com/mapbox-gl-js/guides/user-interactions/interactions/) - Modern event handling
- [Store Locator Tutorial](https://docs.mapbox.com/help/tutorials/building-a-store-locator/)
- [Directions API](https://docs.mapbox.com/api/navigation/directions/)
