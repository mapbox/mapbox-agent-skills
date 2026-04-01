# Framework-Specific Hooks and Composables

## React Best Practices

**Best Practice:** Use Search JS React or Search JS Core instead of building custom hooks with direct API calls.

### Option 1: Use Search JS React (Recommended)

```javascript
import { SearchBox } from '@mapbox/search-js-react';

// Easiest - just use the SearchBox component
function MyComponent() {
  return (
    <SearchBox
      accessToken="YOUR_TOKEN"
      onRetrieve={(result) => {
        // Handle result
      }}
      options={{
        country: 'US',
        types: 'address,poi'
      }}
    />
  );
}
```

### Option 2: Custom Hook with Search JS Core

```javascript
import { useState, useCallback, useRef, useEffect } from 'react';
import { SearchSession } from '@mapbox/search-js-core';

// Custom hook using Search JS Core (handles debouncing and session tokens)
function useMapboxSearch(accessToken, options = {}) {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search JS Core handles session tokens automatically
  const searchSessionRef = useRef(null);

  useEffect(() => {
    searchSessionRef.current = new SearchSession({ accessToken });
  }, [accessToken]);

  const search = useCallback(
    async (query) => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Search JS Core handles debouncing and session tokens
        const response = await searchSessionRef.current.suggest(query, options);
        setResults(response.suggestions || []);
      } catch (err) {
        setError(err.message);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const retrieve = useCallback(async (suggestion) => {
    try {
      // Search JS Core handles session tokens automatically
      const result = await searchSessionRef.current.retrieve(suggestion);
      return result.features[0];
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return { results, isLoading, error, search, retrieve };
}
```

**Benefits of using Search JS Core:**

- ✅ No manual session token management
- ✅ No manual debouncing needed
- ✅ No race condition handling needed (SDK handles it)
- ✅ Cleaner, simpler code
- ✅ Production-ready error handling built-in

## Vue Composition API (Using Search JS Core - Recommended)

```javascript
import { ref, watch } from 'vue';
import { SearchSession } from '@mapbox/search-js-core';

export function useMapboxSearch(accessToken, options = {}) {
  const query = ref('');
  const results = ref([]);
  const isLoading = ref(false);

  // Use Search JS Core - handles debouncing and session tokens automatically
  const searchSession = new SearchSession({ accessToken });

  const performSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      results.value = [];
      return;
    }

    isLoading.value = true;

    try {
      // Search JS Core handles debouncing and session tokens
      const response = await searchSession.suggest(searchQuery, options);
      results.value = response.suggestions || [];
    } catch (error) {
      console.error('Search error:', error);
      results.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  // Watch query changes (Search JS Core handles debouncing)
  watch(query, (newQuery) => {
    performSearch(newQuery);
  });

  const retrieve = async (suggestion) => {
    // Search JS Core handles session tokens automatically
    const feature = await searchSession.retrieve(suggestion);
    return feature;
  };

  return {
    query,
    results,
    isLoading,
    retrieve
  };
}
```

**Key benefits:**

- ✅ Search JS Core handles debouncing automatically (no lodash needed)
- ✅ Session tokens managed automatically (no manual token generation)
- ✅ Simpler code, fewer dependencies
- ✅ Same API works in browser and Node.js
