# Node.js: Mapbox Search JS Core

## Option 1: Search JS Core (Recommended)

**When to use:** Server-side search, backend API, serverless functions

**Installation:**

```bash
npm install @mapbox/search-js-core
```

**Complete implementation:**

```javascript
import { SearchSession } from '@mapbox/search-js-core';

// Initialize search session (handles session tokens automatically)
const search = new SearchSession({
  accessToken: process.env.MAPBOX_TOKEN
});

// Express.js API endpoint example
app.get('/api/search', async (req, res) => {
  const { query, proximity, country } = req.query;

  try {
    // Get suggestions (Search JS Core handles session management)
    const response = await search.suggest(query, {
      proximity: proximity ? proximity.split(',').map(Number) : undefined,
      country: country,
      limit: 10
    });

    res.json(response.suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retrieve full details for a selected result
app.get('/api/search/:id', async (req, res) => {
  try {
    const result = await search.retrieve(req.params.id);
    res.json(result.features[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Key benefits:**

- ✅ Search JS Core handles session tokens automatically
- ✅ Perfect for serverless (Vercel, Netlify, AWS Lambda)
- ✅ Same API as browser Search JS Core
- ✅ No manual debouncing needed (handle at API gateway level)

## Option 2: Direct API Integration (Advanced)

**When to use:** Very specific requirements, need features not in Search JS Core

**Implementation:**

```javascript
import fetch from 'node-fetch';

async function searchPlaces(query, options = {}) {
  const params = new URLSearchParams({
    q: query,
    access_token: process.env.MAPBOX_TOKEN,
    session_token: generateSessionToken(), // You must manage this
    ...options
  });

  const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/suggest?${params}`);

  return response.json();
}
```

**Important:** Only use direct API calls if Search JS Core doesn't meet your needs. You'll need to handle session tokens manually.
