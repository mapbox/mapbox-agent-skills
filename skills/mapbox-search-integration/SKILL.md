---
name: mapbox-search-integration
description: "Implements Mapbox search in web, iOS, and Android apps — configures Search Box API autocomplete, geocoding endpoints, address lookup, and POI search with session tokens and geographic filtering. Use when adding a search bar, place search, address autocomplete, geocoding, or location lookup to a Mapbox application."
---

# Mapbox Search Integration

Complete workflow from requirements discovery to production-ready Mapbox search.

## Requirements Discovery

Ask these questions before writing code, then use the decision table:

| Question | Answer | Action |
|----------|--------|--------|
| What are users searching for? | Addresses, POIs, places, categories | **Search Box API** (default for all interactive search) |
| What are users searching for? | Batch/server-side address lists, permanent geocoding | **Geocoding API** (specialized) |
| Geographic scope? | Single country | Set `country` parameter |
| Geographic scope? | Specific region | Set `bbox` parameter |
| Interaction pattern? | Autocomplete / search-as-you-type | Search Box API with `auto_complete: true`, add 300ms debounce |
| Interaction pattern? | Submit button / single query | Either API works |
| Platform? | React | `@mapbox/search-js-react` (recommended) |
| Platform? | Web (any framework) | Search JS Web or Search JS Core |
| Platform? | iOS | Search SDK for iOS |
| Platform? | Android | Search SDK for Android |
| Platform? | Node.js / server-side | Direct API calls or Search JS Core |

**Default rule:** Use **Search Box API** for all interactive/user-facing search, including address geocoding. Only use Geocoding API for batch/server-side geocoding or permanent result storage.

## Quick Start: React SearchBox

```jsx
import { SearchBox } from '@mapbox/search-js-react';

function MapSearch({ map }) {
  return (
    <SearchBox
      accessToken={process.env.MAPBOX_TOKEN}
      map={map}
      onRetrieve={(res) => {
        const [lng, lat] = res.features[0].geometry.coordinates;
        map.flyTo({ center: [lng, lat], zoom: 14 });
      }}
      options={{ country: 'US', types: 'address,poi' }}
      placeholder="Search places..."
    />
  );
}
```

## Platform References

| Platform | Reference | When to load |
|----------|-----------|-------------|
| Web (JS, Vue, Angular) | `references/web-search-js.md` | Any web app using Search JS |
| React | `references/react-search.md` | React-specific patterns |
| iOS (Swift/SwiftUI) | `references/ios-search.md` | Native iOS app |
| Android (Kotlin/Java) | `references/android-search.md` | Native Android app |
| Node.js / server-side | `references/nodejs-search.md` | Backend search or batch geocoding |

**Cross-cutting:** `references/best-practices.md` (debouncing, session tokens, caching) · `references/pitfalls.md` (debugging) · `references/framework-hooks.md` (custom hooks/composables) · `references/testing-monitoring.md` (tests, monitoring)

## Production Checklist

**Search-specific configuration:**

- [ ] Access token scoped to `search:read` only, with URL restrictions
- [ ] Geographic filtering set (`country`, `proximity`, or `bbox`)
- [ ] `types` parameter set (e.g., `address`, `poi`, `place`)
- [ ] Session tokens used correctly (one per search session, passed on every suggest/retrieve call)

**Implementation essentials:**

- [ ] 300ms debounce on autocomplete, cancel stale requests to prevent race conditions
- [ ] Error handling, empty-result states, keyboard navigation, and accessibility attributes
- [ ] Touch targets 44pt+ (iOS) / 48dp+ (Android); usage tracking and budget alerts configured

## Resources

- [Search Box API](https://docs.mapbox.com/api/search/search-box/) · [Geocoding API](https://docs.mapbox.com/api/search/geocoding/) · [Search JS](https://docs.mapbox.com/mapbox-search-js/guides/) ([React](https://docs.mapbox.com/mapbox-search-js/api/react/) · [Web](https://docs.mapbox.com/mapbox-search-js/api/web/) · [Core](https://docs.mapbox.com/mapbox-search-js/api/core/)) · [iOS SDK](https://docs.mapbox.com/ios/search/guides/) · [Android SDK](https://docs.mapbox.com/android/search/guides/)
