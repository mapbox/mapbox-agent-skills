# Variations & React Implementation

## Mobile-First Layout

```css
/* Mobile first: stack sidebar on top */
@media (max-width: 768px) {
  #app {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: 40vh;
    max-height: 40vh;
  }

  #map {
    height: 60vh;
  }

  /* Toggle sidebar */
  .sidebar.collapsed {
    height: 60px;
  }
}
```

## Fullscreen Map with Overlay

```javascript
// Map takes full screen, list appears as overlay
const listOverlay = document.createElement('div');
listOverlay.className = 'list-overlay';
listOverlay.innerHTML = `
  <button id="toggle-list">View All Locations (${stores.features.length})</button>
  <div id="listings" class="hidden"></div>
`;

document.getElementById('toggle-list').addEventListener('click', () => {
  document.getElementById('listings').classList.toggle('hidden');
});
```

## Map-Only View

```javascript
// No sidebar, everything in popups
function createDetailedPopup(store) {
  const popup = new mapboxgl.Popup({ maxWidth: '400px' })
    .setLngLat(store.geometry.coordinates)
    .setHTML(
      `
      <div class="store-popup">
        <h3>${store.properties.name}</h3>
        <p class="address">${store.properties.address}</p>
        <p class="phone">${store.properties.phone}</p>
        <p class="hours">${store.properties.hours}</p>
        ${store.properties.distance ? `<p class="distance">${store.properties.distance} mi away</p>` : ''}
        <div class="actions">
          <button onclick="getDirections('${store.properties.id}')">Directions</button>
          <button onclick="callStore('${store.properties.phone}')">Call</button>
          ${store.properties.website ? `<a href="${store.properties.website}" target="_blank">Website</a>` : ''}
        </div>
      </div>
    `
    )
    .addTo(map);
}
```

## React Implementation

```jsx
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

function StoreLocator({ stores }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [filteredStores, setFilteredStores] = useState(stores);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [-77.034084, 38.909671],
      zoom: 11
    });

    map.current.on('load', () => {
      map.current.addSource('stores', {
        type: 'geojson',
        data: filteredStores
      });

      map.current.addLayer({
        id: 'stores',
        type: 'circle',
        source: 'stores',
        paint: {
          'circle-color': '#2196f3',
          'circle-radius': 8
        }
      });

      map.current.on('click', 'stores', (e) => {
        setSelectedStore(e.features[0]);
      });
    });

    return () => map.current.remove();
  }, []);

  // Update source when filtered stores change
  useEffect(() => {
    if (map.current && map.current.getSource('stores')) {
      map.current.getSource('stores').setData(filteredStores);
    }
  }, [filteredStores]);

  return (
    <div className="store-locator">
      <Sidebar
        stores={filteredStores}
        selectedStore={selectedStore}
        onStoreClick={setSelectedStore}
        onFilter={setFilteredStores}
      />
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
```
