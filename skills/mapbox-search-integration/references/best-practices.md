# Best Practices: "The Good Parts"

## 1. Debouncing (CRITICAL for Autocomplete)

**Note:** Debouncing is only a concern if you are calling the API directly. Mapbox Search JS and the Search SDKs handle debouncing automatically.

**Problem:** Every keystroke = API call = expensive + slow

**Solution:** Wait until user stops typing (for direct API integration)

```javascript
let debounceTimeout;

function debouncedSearch(query) {
  clearTimeout(debounceTimeout);

  debounceTimeout = setTimeout(() => {
    performSearch(query);
  }, 300); // 300ms is optimal for most use cases
}
```

**Why 300ms?**

- Fast enough to feel responsive
- Slow enough to avoid spam
- Industry standard (Google uses ~300ms)

## 2. Session Token Management

**Note:** Session tokens are only a concern if you are calling the API directly. Mapbox Search JS and the Search SDKs for iOS/Android handle session tokens automatically.

**Problem:** Search Box API charges per session, not per request

**What's a session?**

- Starts with first suggest request
- Ends with retrieve request
- Use same token for all requests in session

**Implementation (direct API calls only):**

```javascript
class SearchSession {
  constructor() {
    this.token = this.generateToken();
  }

  generateToken() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async suggest(query) {
    // Use this.token for all suggest requests
    return fetch(`...?session_token=${this.token}`);
  }

  async retrieve(id) {
    const result = await fetch(`...?session_token=${this.token}`);
    // Session ends - generate new token
    this.token = this.generateToken();
    return result;
  }
}
```

**Cost impact:**

- ✅ Correct: 1 session = unlimited suggests + 1 retrieve = 1 charge
- ❌ Wrong: No session token = each request charged separately

## 3. Geographic Filtering

**Always set location context when possible:**

```javascript
// GOOD: Specific country
{
  country: 'US';
}

// GOOD: Proximity to user
{
  proximity: [-122.4194, 37.7749];
}

// GOOD: Bounding box for service area
{
  bbox: [-122.5, 37.7, -122.3, 37.9];
}

// BAD: No geographic context
{
} // Returns global results, slower, less relevant
```

**Tip:** Use the [Location Helper tool](https://labs.mapbox.com/location-helper/) to easily calculate bounding boxes for your service area.

**Why it matters:**

- ✅ Better result relevance
- ✅ Faster response times
- ✅ Lower ambiguity
- ✅ Better user experience

## 4. Error Handling

**Handle all failure cases:**

```javascript
async function performSearch(query) {
  try {
    const response = await fetch(searchUrl);

    // Check HTTP status
    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited
        showError('Too many requests. Please wait a moment.');
        return [];
      } else if (response.status === 401) {
        // Invalid token
        showError('Search is unavailable. Please check configuration.');
        return [];
      } else {
        // Other error
        showError('Search failed. Please try again.');
        return [];
      }
    }

    const data = await response.json();

    // Check for results
    if (!data.suggestions || data.suggestions.length === 0) {
      showMessage('No results found. Try a different search.');
      return [];
    }

    return data.suggestions;
  } catch (error) {
    // Network error
    console.error('Search error:', error);
    showError('Network error. Please check your connection.');
    return [];
  }
}
```

## 5. Result Display UX

**Show enough context for disambiguation:**

```html
<div class="search-result">
  <div class="result-name">Starbucks</div>
  <div class="result-address">123 Main St, San Francisco, CA</div>
  <div class="result-type">Coffee Shop</div>
</div>
```

**Not just:**

```html
<div>Starbucks</div>
<!-- Which Starbucks? -->
```

## 6. Loading States

**Always show loading feedback:**

```javascript
function performSearch(query) {
  showLoadingSpinner();

  fetch(searchUrl)
    .then((response) => response.json())
    .then((data) => {
      hideLoadingSpinner();
      displayResults(data.suggestions);
    })
    .catch((error) => {
      hideLoadingSpinner();
      showError('Search failed');
    });
}
```

## 7. Accessibility

**Make search keyboard-navigable:**

```html
<input type="search" role="combobox" aria-autocomplete="list" aria-controls="search-results" aria-expanded="false" />

<ul id="search-results" role="listbox">
  <li role="option" tabindex="0">Result 1</li>
  <li role="option" tabindex="0">Result 2</li>
</ul>
```

**Keyboard support:**

- ⬆️⬇️ Arrow keys: Navigate results
- Enter: Select result
- Escape: Close results

## 8. Mobile Optimizations

**iOS/Android specific considerations:**

```swift
// iOS: Adjust for keyboard
NotificationCenter.default.addObserver(
    forName: UIResponder.keyboardWillShowNotification,
    object: nil,
    queue: .main
) { notification in
    // Adjust view for keyboard
}

// Handle tap outside to dismiss
let tapGesture = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))
view.addGestureRecognizer(tapGesture)
```

**Make touch targets large enough:**

- Minimum: 44x44pt (iOS) / 48x48dp (Android)
- Ensure adequate spacing between results

## 9. Caching (For High-Volume Apps)

**Cache recent/popular searches:**

```javascript
class SearchCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(query) {
    const key = query.toLowerCase();
    return this.cache.get(key);
  }

  set(query, results) {
    const key = query.toLowerCase();

    // LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      results,
      timestamp: Date.now()
    });
  }

  isValid(entry, maxAgeMs = 5 * 60 * 1000) {
    return entry && Date.now() - entry.timestamp < maxAgeMs;
  }
}

// Usage
const cache = new SearchCache();

async function search(query) {
  const cached = cache.get(query);
  if (cache.isValid(cached)) {
    return cached.results;
  }

  const results = await performAPISearch(query);
  cache.set(query, results);
  return results;
}
```

## 10. Token Security

**CRITICAL: Scope tokens properly:**

```javascript
// Create token with only search scopes
// In Mapbox dashboard or via API:
{
  "scopes": [
    "search:read",
    "styles:read",  // Only if showing map
    "fonts:read"    // Only if showing map
  ],
  "allowedUrls": [
    "https://yourdomain.com/*"
  ]
}
```

**Never:**

- ❌ Use secret tokens (sk.\*) in client-side code
- ❌ Give tokens more scopes than needed
- ❌ Skip URL restrictions on public tokens

See `mapbox-token-security` skill for details.
