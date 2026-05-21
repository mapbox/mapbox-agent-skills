# Web: Mapbox Search JS Integration

**Important:** Always prefer using SDKs (Mapbox Search JS, Search SDK for iOS/Android) over calling APIs directly. SDKs handle debouncing, session tokens, error handling, and provide UI components. Only use direct API calls for advanced use cases.

## Option 1: Search JS React (Easiest - React apps with UI)

**When to use:** React application, want autocomplete UI component, fastest implementation

**Installation:**

```bash
npm install @mapbox/search-js-react
```

**Complete implementation:**

```jsx
import { SearchBox } from '@mapbox/search-js-react';
import mapboxgl from 'mapbox-gl';

function App() {
  const [map, setMap] = React.useState(null);

  React.useEffect(() => {
    mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';
    const mapInstance = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-122.4194, 37.7749],
      zoom: 12
    });
    setMap(mapInstance);
  }, []);

  const handleRetrieve = (result) => {
    const [lng, lat] = result.features[0].geometry.coordinates;
    map.flyTo({ center: [lng, lat], zoom: 14 });

    new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
  };

  return (
    <div>
      <SearchBox accessToken="YOUR_MAPBOX_TOKEN" onRetrieve={handleRetrieve} placeholder="Search for places" />
      <div id="map" style={{ height: '600px' }} />
    </div>
  );
}
```

## Option 2: Search JS Web (Web Components with UI)

**When to use:** Vanilla JavaScript, Web Components, or any framework, want autocomplete UI

**Complete implementation:**

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://api.mapbox.com/search-js/v1.0.0-beta.18/web.js"></script>
    <link href="https://api.mapbox.com/search-js/v1.0.0-beta.18/web.css" rel="stylesheet" />
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js"></script>
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" rel="stylesheet" />
  </head>
  <body>
    <div id="search"></div>
    <div id="map" style="height: 600px;"></div>

    <script>
      // Initialize map
      mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';
      const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-122.4194, 37.7749],
        zoom: 12
      });

      // Initialize Search Box
      const search = new MapboxSearchBox();
      search.accessToken = 'YOUR_MAPBOX_TOKEN';

      // CRITICAL: Set options based on discovery
      search.options = {
        language: 'en',
        country: 'US', // If single-country (from Question 2)
        proximity: 'ip', // Or specific coordinates
        types: 'address,poi' // Based on Question 1
      };

      search.mapboxgl = mapboxgl;
      search.marker = true; // Auto-add marker on result selection

      // Handle result selection
      search.addEventListener('retrieve', (event) => {
        const result = event.detail;

        // Fly to result
        map.flyTo({
          center: result.geometry.coordinates,
          zoom: 15,
          essential: true
        });

        // Optional: Show popup with details
        new mapboxgl.Popup()
          .setLngLat(result.geometry.coordinates)
          .setHTML(
            `<h3>${result.properties.name}</h3>
                  <p>${result.properties.full_address || ''}</p>`
          )
          .addTo(map);
      });

      // Attach to DOM
      document.getElementById('search').appendChild(search);
    </script>
  </body>
</html>
```

**Key implementation notes:**

- ✅ Set `country` if single-country search (better results, lower cost)
- ✅ Set `types` based on what users search for
- ✅ Use `proximity` to bias results to user location
- ✅ Handle `retrieve` event for result selection
- ✅ Integrate with map (flyTo, markers, popups)

## Option 3: Search JS Core (Custom UI)

**When to use:** Need custom UI design, full control over UX, works in any framework or Node.js

**Installation:**

```bash
npm install @mapbox/search-js-core
```

**Complete implementation:**

```javascript
import { SearchSession } from '@mapbox/search-js-core';
import mapboxgl from 'mapbox-gl';

// Initialize search session
const search = new SearchSession({
  accessToken: 'YOUR_MAPBOX_TOKEN'
});

// Initialize map
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-122.4194, 37.7749],
  zoom: 12
});

// Your custom search input
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results');

// Handle user input
searchInput.addEventListener('input', async (e) => {
  const query = e.target.value;

  if (query.length < 2) {
    resultsContainer.innerHTML = '';
    return;
  }

  // Get suggestions (Search JS Core handles debouncing and session tokens)
  const response = await search.suggest(query, {
    proximity: map.getCenter().toArray(),
    country: 'US', // Optional
    types: ['address', 'poi']
  });

  // Render custom results UI
  resultsContainer.innerHTML = response.suggestions
    .map(
      (suggestion) => `
    <div class="result-item" data-id="${suggestion.mapbox_id}">
      <strong>${suggestion.name}</strong>
      <div>${suggestion.place_formatted}</div>
    </div>
  `
    )
    .join('');
});

// Handle result selection
resultsContainer.addEventListener('click', async (e) => {
  const resultItem = e.target.closest('.result-item');
  if (!resultItem) return;

  const mapboxId = resultItem.dataset.id;

  // Retrieve full details
  const result = await search.retrieve(mapboxId);
  const feature = result.features[0];
  const [lng, lat] = feature.geometry.coordinates;

  // Update map
  map.flyTo({ center: [lng, lat], zoom: 15 });
  new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);

  // Clear search
  searchInput.value = feature.properties.name;
  resultsContainer.innerHTML = '';
});
```

**Key benefits:**

- ✅ Full control over UI/UX
- ✅ Search JS Core handles session tokens automatically
- ✅ Works in any framework (React, Vue, Angular, etc.)
- ✅ Can use in Node.js for server-side search

## Option 4: Direct API Integration (Advanced - Last Resort)

**When to use:** Very specific requirements that SDKs don't support, or server-side integration where Search JS Core doesn't fit

**Important:** Only use direct API calls when SDKs don't meet your needs. You'll need to handle debouncing and session tokens manually.

**When to use:** Custom UI, framework integration, need full control

**Complete implementation with debouncing:**

```javascript
import mapboxgl from 'mapbox-gl';

class MapboxSearch {
  constructor(accessToken, options = {}) {
    this.accessToken = accessToken;
    this.options = {
      country: options.country || null, // e.g., 'US'
      language: options.language || 'en',
      proximity: options.proximity || 'ip',
      types: options.types || 'address,poi',
      limit: options.limit || 5,
      ...options
    };

    this.debounceTimeout = null;
    this.sessionToken = this.generateSessionToken();
  }

  generateSessionToken() {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  // CRITICAL: Debounce to avoid API spam
  async search(query, callback, debounceMs = 300) {
    clearTimeout(this.debounceTimeout);

    this.debounceTimeout = setTimeout(async () => {
      const results = await this.performSearch(query);
      callback(results);
    }, debounceMs);
  }

  async performSearch(query) {
    if (!query || query.length < 2) return [];

    const params = new URLSearchParams({
      q: query,
      access_token: this.accessToken,
      session_token: this.sessionToken,
      language: this.options.language,
      limit: this.options.limit
    });

    // Add optional parameters
    if (this.options.country) {
      params.append('country', this.options.country);
    }

    if (this.options.types) {
      params.append('types', this.options.types);
    }

    if (this.options.proximity && this.options.proximity !== 'ip') {
      params.append('proximity', this.options.proximity);
    }

    try {
      const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/suggest?${params}`);

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async retrieve(suggestionId) {
    const params = new URLSearchParams({
      access_token: this.accessToken,
      session_token: this.sessionToken
    });

    try {
      const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestionId}?${params}`);

      if (!response.ok) {
        throw new Error(`Retrieve API error: ${response.status}`);
      }

      const data = await response.json();

      // Session ends on retrieve - generate new token for next search
      this.sessionToken = this.generateSessionToken();

      return data.features[0];
    } catch (error) {
      console.error('Retrieve error:', error);
      return null;
    }
  }
}

// Usage example
const search = new MapboxSearch('YOUR_MAPBOX_TOKEN', {
  country: 'US', // Based on discovery Question 2
  types: 'poi', // Based on discovery Question 1
  proximity: [-122.4194, 37.7749] // Or 'ip' for user location
});

// Attach to input field
const input = document.getElementById('search-input');
const resultsContainer = document.getElementById('search-results');

input.addEventListener('input', (e) => {
  const query = e.target.value;

  search.search(query, (results) => {
    displayResults(results);
  });
});

function displayResults(results) {
  resultsContainer.innerHTML = results
    .map(
      (result) => `
    <div class="result" data-id="${result.mapbox_id}">
      <strong>${result.name}</strong>
      <p>${result.place_formatted || ''}</p>
    </div>
  `
    )
    .join('');

  // Handle result selection
  resultsContainer.querySelectorAll('.result').forEach((el) => {
    el.addEventListener('click', async () => {
      const feature = await search.retrieve(el.dataset.id);
      handleResultSelection(feature);
    });
  });
}

function handleResultSelection(feature) {
  const [lng, lat] = feature.geometry.coordinates;

  // Fly map to result
  map.flyTo({
    center: [lng, lat],
    zoom: 15
  });

  // Add marker
  new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);

  // Close results
  resultsContainer.innerHTML = '';
  input.value = feature.properties.name;
}
```

**Critical implementation details:**

1. ✅ **Debouncing**: Wait 300ms after user stops typing before API call
2. ✅ **Session tokens**: Use same token for suggest + retrieve, generate new after
3. ✅ **Error handling**: Handle API errors gracefully
4. ✅ **Parameter optimization**: Only send parameters you need
5. ✅ **Result display**: Show name + formatted address
6. ✅ **Selection handling**: Retrieve full feature on selection
