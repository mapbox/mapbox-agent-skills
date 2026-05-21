# Common Pitfalls and How to Avoid Them

## Pitfall 1: No Debouncing

**Problem:**

```javascript
input.addEventListener('input', (e) => {
  performSearch(e.target.value); // API call on EVERY keystroke!
});
```

**Impact:**

- Expensive (hundreds of unnecessary API calls)
- Slow (race conditions, outdated results)
- Rate limiting (429 errors)

**Solution:** Always debounce (see Best Practices #1)

## Pitfall 2: Ignoring Session Tokens

**Problem:**

```javascript
// No session token = each request charged separately
fetch('...suggest?q=query&access_token=xxx');
```

**Impact:**

- Costs 10-100x more than necessary
- Budget blown on redundant charges

**Solution:** Use session tokens (see Best Practices #2)

## Pitfall 3: No Geographic Context

**Problem:**

```javascript
// Searching globally for "Paris"
{
  q: 'Paris';
} // Paris, France? Paris, Texas? Paris, Kentucky?
```

**Impact:**

- Confusing results (wrong country)
- Slower responses
- Poor user experience

**Solution:**

```javascript
// Much better
{ q: 'Paris', country: 'US', proximity: user_location }
```

## Pitfall 4: Poor Mobile UX

**Problem:**

```html
<!-- Tiny touch targets -->
<div style="height: 20px; padding: 2px;">Search result</div>
```

**Impact:**

- Frustrating to tap
- Accidental selections
- Bad reviews

**Solution:**

```css
.search-result {
  min-height: 48px; /* Android minimum */
  padding: 12px;
  margin: 4px 0;
}
```

## Pitfall 5: Not Handling Empty Results

**Problem:**

```javascript
// Just shows empty container
displayResults([]); // User sees blank space - is it loading? broken?
```

**Impact:**

- User confusion
- Is it working?

**Solution:**

```javascript
if (results.length === 0) {
  showMessage('No results found. Try a different search term.');
}
```

## Pitfall 6: Blocking on Slow Networks

**Problem:**

```javascript
// No timeout = waits forever on slow network
await fetch(searchUrl);
```

**Impact:**

- Appears frozen
- User frustration

**Solution:**

```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

fetch(searchUrl, { signal: controller.signal }).finally(() => clearTimeout(timeout));
```

## Pitfall 7: Ignoring Result Types

**Problem:**

```javascript
// Treating all results the same
displayResult(result.name); // But is it an address? POI? Region?
```

**Impact:**

- Unclear what was selected
- Wrong zoom level
- Inappropriate markers

**Solution:**

```javascript
function handleResult(result) {
  const type = result.feature_type;

  if (type === 'poi') {
    map.flyTo({ center: coords, zoom: 17 }); // Close zoom
    addPOIMarker(result);
  } else if (type === 'address') {
    map.flyTo({ center: coords, zoom: 16 });
    addAddressMarker(result);
  } else if (type === 'place') {
    map.flyTo({ center: coords, zoom: 12 }); // Wider view for city
  }
}
```

## Pitfall 8: Race Conditions

**Problem:**

```javascript
// Fast typing: "san francisco"
// API responses arrive out of order:
// "san f" results arrive AFTER "san francisco" results
```

**Impact:**

- Wrong results displayed
- Confusing UX

**Solution:**

```javascript
let searchCounter = 0;

async function performSearch(query) {
  const currentSearch = ++searchCounter;
  const results = await fetchResults(query);

  // Only display if this is still the latest search
  if (currentSearch === searchCounter) {
    displayResults(results);
  }
}
```
