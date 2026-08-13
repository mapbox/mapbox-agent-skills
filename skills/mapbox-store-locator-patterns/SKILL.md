---
name: mapbox-store-locator-patterns
description: Common patterns for building store locators, restaurant finders, and location-based search applications with Mapbox. Covers marker display, filtering, distance calculation, and interactive lists.
---

# Store Locator Patterns Skill

Comprehensive patterns for building store locators, restaurant finders, and location-based search applications with Mapbox GL JS. Covers marker display, filtering, distance calculation, interactive lists, and directions integration.

## When to Use This Skill

Use this skill when building applications that:

- Display multiple locations on a map (stores, restaurants, offices, etc.)
- Allow users to filter or search locations
- Calculate distances from user location
- Provide interactive lists synced with map markers
- Show location details in popups or side panels
- Integrate directions to selected locations

## Dependencies

**Required:**

- Mapbox GL JS v3.x
- [@turf/turf](https://turfjs.org/) - For spatial calculations (distance, area, etc.)

**Installation:**

```bash
npm install mapbox-gl @turf/turf
```

## Core Architecture

### Pattern Overview

A typical store locator consists of:

1. **Map Display** - Shows all locations as markers
2. **Location Data** - GeoJSON with store/location information
3. **Interactive List** - Side panel listing all locations
4. **Filtering** - Search, category filters, distance filters
5. **Detail View** - Popup or panel with location details
6. **User Location** - Geolocation for distance calculation. For the blue dot location indicator, use the built-in `mapboxgl.GeolocateControl` — simpler than custom markers.
7. **Directions** - Route to selected location (optional)

### Data Structure

**GeoJSON format for locations:**

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
        "address": "123 Main St, Washington, DC 20001",
        "phone": "(202) 555-0123",
        "hours": "Mon-Sat: 9am-9pm, Sun: 10am-6pm",
        "category": "retail",
        "website": "https://example.com/downtown"
      }
    }
  ]
}
```

**Key properties:**

- `id` - Unique identifier for each location
- `name` - Display name
- `address` - Full address for display and geocoding
- `coordinates` - `[longitude, latitude]` format
- `category` - For filtering (retail, restaurant, office, etc.)
- Custom properties as needed (hours, phone, website, etc.)

## Basic Store Locator Implementation

### Step 1: Initialize Map and Data

```javascript
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

// Store locations data
const stores = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-77.034084, 38.909671]
      },
      properties: {
        id: 'store-001',
        name: 'Downtown Store',
        address: '123 Main St, Washington, DC 20001',
        phone: '(202) 555-0123',
        category: 'retail'
      }
    }
    // ... more stores
  ]
};

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard',
  center: [-77.034084, 38.909671],
  zoom: 11,
  config: {
    // A store locator IS a POI-browsing map, so leave the basemap POIs on —
    // they give the user context around each store.
    basemap: { showPointOfInterestLabels: true }
  }
});

// Follow the app's dark theme with config, never by loading a different style:
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  map.setConfigProperty('basemap', 'lightPreset', 'night');
}
```

### Step 2: Add Markers to Map

**Marker strategy.** Two independent decisions — location count answers the first, but not the second.

**1. How to render (cost):**

| Count                                     | Strategy                   | Reason                                                                                                                   |
| ----------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Fewer than ~100**                       | HTML Markers               | Full DOM/CSS control; DOM node count is manageable                                                                       |
| **~100 and up**                           | **Symbol Layer** (default) | Renders on the **GPU via WebGL** — one `<canvas>`, zero per-point DOM elements. Smooth into the tens of thousands        |
| **Thousands, or a payload past a few MB** | Vector tileset             | Only the current viewport loads instead of the whole file up front. Markers are no longer an option once you're on tiles |

**2. Whether to cluster (legibility, not count):** cluster when your pins **visibly overlap at the zooms customers actually browse** — for a store locator, usually the city and neighborhood zooms. A 300-location chain concentrated in one metro needs clustering at z12; 5,000 locations spread nationwide may read fine unclustered at z4. Judge it from the map, not the row count.

> HTML Markers create one DOM element per point. Beyond ~100 locations the browser spends too much time on layout/paint. Symbol layers bypass the DOM entirely — the GPU draws all points in a single WebGL draw call.

**Symbol Layer implementation** (best for 100–1,000 locations). For HTML Markers (fewer than 100) or Clustering (more than 1,000), see `references/markers.md`.

```javascript
map.on('load', () => {
  // Add store data as source
  map.addSource('stores', {
    type: 'geojson',
    data: stores
  });

  // Add custom marker image
  map.loadImage('/marker-icon.png', (error, image) => {
    if (error) throw error;
    map.addImage('custom-marker', image);

    // Add symbol layer
    map.addLayer({
      id: 'stores-layer',
      type: 'symbol',
      // `top` is the slot for markers and active selections. Without a slot
      // the layer draws above every basemap label.
      slot: 'top',
      source: 'stores',
      layout: {
        'icon-image': 'custom-marker',
        // Scale with zoom — a flat icon-size looks wrong across the range
        'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 16, 1],
        'icon-allow-overlap': true, // every store must be visible
        'text-field': ['get', 'name'],
        // DIN Pro is the Standard style's font. One family, two weights max —
        // pulling in a second family reads as noise on an already busy map.
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
        'text-size': 12,
        'text-optional': true // drop the label before the icon when they collide
      }
    });
  });

  // Handle marker clicks using Interactions API (recommended)
  map.addInteraction('store-click', {
    type: 'click',
    target: { layerId: 'stores-layer' },
    handler: (e) => {
      const store = e.feature;
      flyToStore(store);
      createPopup(store);
    }
  });

  // Or using traditional event listener:
  // map.on('click', 'stores-layer', (e) => {
  //   const store = e.features[0];
  //   flyToStore(store);
  //   createPopup(store);
  // });

  // Change cursor on hover
  map.on('mouseenter', 'stores-layer', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'stores-layer', () => {
    map.getCanvas().style.cursor = '';
  });
});
```

### Step 3: Build Interactive Location List

```javascript
function buildLocationList(stores) {
  const listingContainer = document.getElementById('listings');

  stores.features.forEach((store, index) => {
    const listing = listingContainer.appendChild(document.createElement('div'));
    listing.id = `listing-${store.properties.id}`;
    listing.className = 'listing';

    const link = listing.appendChild(document.createElement('a'));
    link.href = '#';
    link.className = 'title';
    link.id = `link-${store.properties.id}`;
    link.innerHTML = store.properties.name;

    const details = listing.appendChild(document.createElement('div'));
    details.innerHTML = `
      <p>${store.properties.address}</p>
      <p>${store.properties.phone || ''}</p>
    `;

    // Handle listing click
    link.addEventListener('click', (e) => {
      e.preventDefault();
      flyToStore(store);
      createPopup(store);
      highlightListing(store.properties.id);
    });
  });
}

function flyToStore(store) {
  map.flyTo({
    center: store.geometry.coordinates,
    zoom: 15,
    duration: 1000
  });
}

function createPopup(store) {
  const popups = document.getElementsByClassName('mapboxgl-popup');
  // Remove existing popups
  if (popups[0]) popups[0].remove();

  new mapboxgl.Popup({ closeOnClick: true })
    .setLngLat(store.geometry.coordinates)
    .setHTML(
      `<h3>${store.properties.name}</h3>
       <p>${store.properties.address}</p>
       <p>${store.properties.phone}</p>
       ${store.properties.website ? `<a href="${store.properties.website}" target="_blank">Visit Website</a>` : ''}`
    )
    .addTo(map);
}

// IMPORTANT: highlightListing MUST include scrollIntoView — without it,
// selecting a marker on the map won't scroll the sidebar to the listing.
function highlightListing(id) {
  // Remove existing highlights
  const activeItem = document.getElementsByClassName('active');
  if (activeItem[0]) {
    activeItem[0].classList.remove('active');
  }

  // Add highlight to selected listing
  const listing = document.getElementById(`listing-${id}`);
  listing.classList.add('active');

  // Scroll the selected listing into view (critical UX requirement)
  listing.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Build the list on load
map.on('load', () => {
  buildLocationList(stores);
});
```

## Reference Files

Load these references for additional patterns as needed:

| Reference                 | File                                   | Contents                                                         |
| ------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| HTML Markers & Clustering | `references/markers.md`                | HTML Markers (< 100 locations), Clustering (> 1000 locations)    |
| Search & Filter           | `references/search-filter.md`          | Text search, category filter                                     |
| Geolocation & Directions  | `references/geolocation-directions.md` | User location, distance calculation, route directions            |
| Styling & Layout          | `references/styling-layout.md`         | Full HTML/CSS layout, custom marker CSS                          |
| Performance & A11y        | `references/optimization-a11y.md`      | Debounced search, data management, error handling, accessibility |
| Variations & React        | `references/variations-react.md`       | Mobile-first, fullscreen, map-only, React implementation         |

## Map design

Store-locator styling decisions — where the brand color belongs, marker legibility, dark mode, category color coding — are covered by the **mapbox-cartography** skill. The two rules that bite most often here:

- **Brand color goes on the markers and the route, never on basemap roads, water, or land.** This is the single most common map-design mistake.
- **Never code categories by color alone**, and never use red + green as the sole distinction — roughly 1 in 12 men cannot separate them. Pair color with a different icon or a label.

## Resources

- [Turf.js](https://turfjs.org/) - Spatial analysis library (recommended for distance calculations)
- [Mapbox GL JS API](https://docs.mapbox.com/mapbox-gl-js/)
- [Interactions API Guide](https://docs.mapbox.com/mapbox-gl-js/guides/user-interactions/interactions/)
- [GeoJSON Specification](https://geojson.org/)
- [Directions API](https://docs.mapbox.com/api/navigation/directions/)
- [Store Locator Tutorial](https://docs.mapbox.com/help/tutorials/building-a-store-locator/)
