# React Integration Patterns

**Best Practice:** Use Search JS React for easiest implementation, or Search JS Core for custom UI.

## Option 1: Search JS React (Recommended - Easiest)

```javascript
import { SearchBox } from '@mapbox/search-js-react';
import mapboxgl from 'mapbox-gl';
import { useState } from 'react';

function MapboxSearchComponent() {
  const [map, setMap] = useState(null);

  useEffect(() => {
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
      <SearchBox
        accessToken="YOUR_MAPBOX_TOKEN"
        onRetrieve={handleRetrieve}
        placeholder="Search for places"
        options={{
          country: 'US', // Optional
          types: 'address,poi'
        }}
      />
      <div id="map" style={{ height: '600px' }} />
    </div>
  );
}
```

**Benefits:**

- ✅ Complete UI component provided
- ✅ No manual debouncing needed
- ✅ No manual session token management
- ✅ Production-ready out of the box

## Option 2: Search JS Core (Custom UI)

```javascript
import { useState, useEffect } from 'react';
import { SearchSession } from '@mapbox/search-js-core';
import mapboxgl from 'mapbox-gl';

function MapboxSearchComponent({ country, types = 'address,poi' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search JS Core handles debouncing and session tokens automatically
  const searchSession = new SearchSession({
    accessToken: 'YOUR_MAPBOX_TOKEN'
  });

  useEffect(() => {
    const performSearch = async () => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchSession.suggest(query, {
          country,
          types,
          limit: 5
        });
        setResults(response.suggestions || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const handleResultClick = async (suggestion) => {
    try {
      const result = await searchSession.retrieve(suggestion);
      const feature = result.features[0];

      // Handle result (fly to location, add marker, etc.)
      onResultSelect(feature);

      setQuery(feature.properties.name);
      setResults([]);
    } catch (error) {
      console.error('Retrieve error:', error);
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a place..."
        className="search-input"
      />

      {isLoading && <div className="loading">Searching...</div>}

      {results.length > 0 && (
        <div className="search-results">
          {results.map((result) => (
            <div key={result.mapbox_id} className="search-result" onClick={() => handleResultClick(result)}>
              <strong>{result.name}</strong>
              {result.place_formatted && <p>{result.place_formatted}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Benefits:**

- ✅ Full control over UI design
- ✅ Search JS Core handles debouncing automatically
- ✅ Search JS Core handles session tokens automatically
- ✅ Cleaner code than direct API calls

**Note:** For React apps, prefer Search JS React (Option 1) unless you need a completely custom UI design.

## Why NOT Direct API Calls (fetch)?

If you bypass Search JS Core and call the Search Box API directly with `fetch()`, you must handle:

1. **Session tokens** — Required for proper billing. The Search Box API uses session-based pricing: one session = one suggest flow + one retrieve. You must generate a unique session token per search session and pass it as `session_token` parameter on every request. Without session tokens, each individual request is billed separately (much more expensive).
2. **Debouncing** — You must implement your own 300ms debounce to avoid excessive API calls.
3. **Race conditions** — Later requests may resolve before earlier ones; you need request cancellation or ordering logic.

Search JS Core handles all three automatically — this is why it's recommended over direct `fetch()` calls even for custom UIs.
