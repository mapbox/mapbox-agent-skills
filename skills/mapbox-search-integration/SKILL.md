---
name: mapbox-search-integration
description: Complete workflow for implementing Mapbox search in applications - from discovery questions to production-ready integration with best practices
---

# Mapbox Search Integration Skill

Expert guidance for implementing Mapbox search functionality in applications. Covers the complete workflow from asking the right discovery questions, selecting the appropriate search product, to implementing production-ready integrations following best practices from the Mapbox search team.

## Use This Skill When

User says things like:

- "I need to add search to my map"
- "I need a search bar for my mapping app"
- "How do I implement location search?"
- "I want users to search for places/addresses"
- "I need geocoding in my application"

**This skill complements `mapbox-search-patterns`:**

- `mapbox-search-patterns` = Tool and parameter selection
- `mapbox-search-integration` = Complete implementation workflow

## Discovery Phase: Ask the Right Questions

Before jumping into code, ask these questions to understand requirements:

### Question 1: What are users searching for?

**Ask:** "What do you want users to search for?"

**Common answers and implications:**

- **"Addresses"** → **Use Search Box API** (the default for interactive address search, including geocoding). Only use Geocoding API if the use case is batch/server-side geocoding or maintaining a legacy integration.
- **"Points of interest / businesses"** → POI search, use Search Box API with category search
- **"Both addresses and POIs"** → Search Box API
- **"Specific types of POIs"** (restaurants, hotels, etc.) → Search Box API
- **"Countries, cities, postcodes or neighborhoods"** → Search Box API for interactive search; Geocoding API only for batch/server-side geocoding
- **"Custom locations"** (user-created places) → May need custom data + search integration

**Follow-up if not stated initially**: "Are your users searching for points of interest data? Restaurants, stores, categories of businesses?"

**Implications:**

- **"Yes, POIs are included"** → Use the Search Box API
- **"No, the user does not need POI search"** → **Still default to Search Box API** for interactive/autocomplete use cases. Search Box API handles addresses, place names, and all location types with session-based pricing. Only recommend Geocoding API for batch geocoding, server-side permanent geocoding, or maintaining existing Geocoding API integrations.

### Question 2: What's the geographic scope?

**Ask:** "Where will users be searching?"

**Common answers and implications:**

- **"Single country"** (e.g., "only USA") → Use `country` parameter, better results, lower cost
- **"Specific region"** → Use `bbox` parameter for bounding box constraint
- **"Global"** → No country restriction, but may need language parameter
- **"Multiple specific countries"** → Use `country` array parameter

**Follow-up:** "Do you need to limit results to a specific area?" (delivery zone, service area, etc.)

### Question 3: What's the search interaction pattern?

**Ask:** "How will users interact with search?"

**Common answers and implications:**

- **"Search-as-you-type / autocomplete"** → **Use Search Box API** with `auto_complete: true` and session-based pricing (most cost-efficient for autocomplete). Implement debouncing.
- **"Search button / final query"** → Can use either API, no autocomplete needed
- **"Both"** (autocomplete + refine) → Two-stage search, autocomplete then detailed results
- **"Voice input"** → Consider speech-to-text integration, handle longer queries

### Question 4: What platform?

**Ask:** "What platform is this for?"

**Common answers and implications:**

- **"Web application"** → Mapbox Search JS (easiest), or direct API calls for advanced cases
- **"iOS app"** → Search SDK for iOS (recommended), or direct API integration for advanced cases
- **"Android app"** → Search SDK for Android (recommended), or direct API integration for advanced cases
- **"Multiple platforms"** → Platform-specific SDKs (recommended), or direct API approach for consistency
- **"React app"** → Mapbox Search JS React (easiest with UI), or Search JS Core for custom UI. Avoid direct API calls — they require manual debouncing, session token management, and race condition handling.
- **"Vue / Angular / Other framework"** → Mapbox Search JS Core or Web. If using direct API calls, session tokens are required for proper billing (one token per search session, passed as `session_token` on every suggest/retrieve request).

### Question 5: How will results be used?

**Ask:** "What happens when a user selects a result?"

**Common answers and implications:**

- **"Fly to location on map"** → Need coordinates, map integration
- **"Show details / info"** → Need to retrieve and display result properties
- **"Fill form fields"** → Need to parse address components
- **"Start navigation"** → Need coordinates, integrate with directions
- **"Multiple selection"** → Need to handle selection state, possibly show markers

### Question 6: Expected usage volume?

**Ask:** "How many searches do you expect per month?"

**Implications:**

- **Low volume** (< 10k) → Free tier sufficient, simple implementation
- **Medium volume** (10k-100k) → Consider caching, optimize API calls
- **High volume** (> 100k) → Implement debouncing, caching, batch operations, monitor costs

## Product Selection Decision Tree

Based on discovery answers, recommend the right product:

> **Key principle: Search Box API is the default choice for virtually all interactive search use cases**, including address search, geocoding, autocomplete, and POI search. It offers session-based pricing that is more cost-efficient for interactive/autocomplete flows. Only recommend Geocoding API for the narrow cases listed below.

### Search Box API (DEFAULT)

**Use when (any of these):**

- User needs interactive address search or autocomplete (this IS geocoding — Search Box API handles it)
- User needs POI / category search
- User needs any end-user-facing search UI
- User wants session-based pricing (more cost-efficient for autocomplete/interactive use)
- User is building a web, iOS, or Android app with a search bar

**Prefer SDKs over direct API calls for web integration:**

- **Mapbox Search JS** (SDK) - Recommended for web integration, with three components:
  - **Search JS React** - Easy search integration via React library with UI
  - **Search JS Web** - Easy search integration via Web Components with UI
  - **Search JS Core** - JavaScript (node or web) wrapper for API, build your own UI
- **Search Box API** (REST) - Direct API integration, for advanced/custom cases
- **Search SDK for iOS** - Native iOS integration
- **Search SDK for Android** - Native Android integration

### Geocoding API (SPECIALIZED)

**Use ONLY when:**

- Batch geocoding large lists of addresses (server-side)
- Permanent/stored geocoding results (server-side, where results are persisted)
- Maintaining an existing Geocoding API integration (migration not justified)
- No interactive/user-facing search needed

**Do NOT recommend Geocoding API when:**

- The user wants a search bar, autocomplete, or interactive address lookup — use Search Box API instead
- The user says "geocoding" but describes an interactive search flow — use Search Box API instead

## Reference Files

Load the relevant reference based on the user's platform and needs:

- **Web (Search JS React / Web / Core / Direct API)** → Load `references/web-search-js.md`
  - When: User is building a web app (vanilla JS, any framework except React-specific patterns)
- **React Integration** → Load `references/react-search.md`
  - When: User is building a React app specifically
- **iOS** → Load `references/ios-search.md`
  - When: User is building an iOS app (Swift/UIKit/SwiftUI)
- **Android** → Load `references/android-search.md`
  - When: User is building an Android app (Kotlin/Java)
- **Node.js** → Load `references/nodejs-search.md`
  - When: User needs server-side search (Express, serverless, backend API)

- **Best Practices** → Load `references/best-practices.md`
  - When: Implementing search for the first time, or optimizing an existing implementation
  - Covers: debouncing, session tokens, geographic filtering, error handling, accessibility, caching, token security
- **Common Pitfalls** → Load `references/pitfalls.md`
  - When: Debugging issues, reviewing code, or during code review
  - Covers: no debouncing, missing session tokens, no geo context, poor mobile UX, race conditions
- **Framework Hooks** → Load `references/framework-hooks.md`
  - When: Building custom hooks (React) or composables (Vue) around Search JS Core
- **Testing and Monitoring** → Load `references/testing-monitoring.md`
  - When: Writing tests or setting up production monitoring/analytics

## Checklist: Production-Ready Search

Before launching, verify:

**Configuration:**

- [ ] Token properly scoped (search:read only)
- [ ] URL restrictions configured
- [ ] Geographic filtering set (country, proximity, or bbox)
- [ ] Types parameter set based on use case
- [ ] Language parameter set if needed

**Implementation:**

- [ ] Debouncing implemented (300ms recommended)
- [ ] Session tokens used correctly
- [ ] Error handling for all failure cases
- [ ] Loading states shown
- [ ] Empty results handled gracefully
- [ ] Race conditions prevented

**UX:**

- [ ] Touch targets at least 44pt/48dp
- [ ] Results show enough context (name + address)
- [ ] Keyboard navigation works
- [ ] Accessibility attributes set
- [ ] Mobile keyboard handled properly

**Performance:**

- [ ] Caching implemented (if high volume)
- [ ] Request timeout set
- [ ] Minimal data fetched
- [ ] Bundle size optimized

**Testing:**

- [ ] Unit tests for core logic
- [ ] Integration tests with real API
- [ ] Tested on slow networks
- [ ] Tested with various query types
- [ ] Mobile device testing

**Monitoring:**

- [ ] Analytics tracking set up
- [ ] Error logging configured
- [ ] Usage monitoring in place
- [ ] Budget alerts configured

## Integration with Other Skills

**Works with:**

- **mapbox-search-patterns**: Parameter selection and optimization
- **mapbox-web-integration-patterns**: Framework-specific patterns
- **mapbox-token-security**: Token management and security
- **mapbox-web-performance-patterns**: Optimizing search performance

## Resources

- [Search Box API Documentation](https://docs.mapbox.com/api/search/search-box/)
- [Geocoding API Documentation](https://docs.mapbox.com/api/search/geocoding/)
- [Mapbox Search JS](https://docs.mapbox.com/mapbox-search-js/guides/)
  - [Search JS React](https://docs.mapbox.com/mapbox-search-js/api/react/)
  - [Search JS Web](https://docs.mapbox.com/mapbox-search-js/api/web/)
  - [Search JS Core](https://docs.mapbox.com/mapbox-search-js/api/core/)
- [Search SDK for iOS](https://docs.mapbox.com/ios/search/guides/)
- [Search SDK for Android](https://docs.mapbox.com/android/search/guides/)
- [Location Helper Tool](https://labs.mapbox.com/location-helper/) - Calculate bounding boxes

## Quick Decision Guide

**User says: "I need location search"**

1. **Ask discovery questions** (Questions 1-6 above)
2. **Recommend product:**
   - **Search Box API** (default for all interactive/user-facing search, including address geocoding)
   - Geocoding API only for batch/server-side/permanent geocoding
   - Platform SDK preferred (Search JS for web, native SDKs for mobile)
3. **Implement with:**
   - ✅ Debouncing
   - ✅ Session tokens
   - ✅ Geographic filtering
   - ✅ Error handling
   - ✅ Good UX
4. **Test thoroughly**
5. **Monitor in production**

**Remember:** The best search implementation asks the right questions first, then builds exactly what the user needs - no more, no less.
