# Search SDK for Android: integration audit reference

**Target:** Search SDK for Android (Kotlin and Java)
**Minimum compatible version:** `2.21.0`
**Validated against:** `2.33.0`

Entries marked ★ are experimental: check they exist in the app's SDK version before flagging. Entries that need a newer version than the minimum say so inline. Skip them on older SDKs.

> 🔒 **Restricted API.** Entries marked 🔒 carry `@RestrictedMapboxSearchAPI`: they are enabled for selected accounts only, return `null` or empty data for everyone else, and require an opt-in (`@OptIn(RestrictedMapboxSearchAPI::class)`). If one of them fits your use case, contact the Mapbox sales team to request access.

IDs (`SEARCH-…`) are stable. Cite them exactly in findings. Use the grounding rule, output schema and workflow from SKILL.md.

## Part A — SDK Functional Catalog

Each entry lists what the SDK provides and the key public API to search for. If the app has its own implementation of the same capability, that is a candidate finding (a possible reimplementation). A star (★) marks experimental APIs; confirm they are available in the SDK version being audited.

**Where to start.** The recommended integration points are the online **`SearchEngine`** (SEARCH-A1–SEARCH-A7) and the **`OfflineSearchEngine`** (SEARCH-A8). They cover the full feature set and receive the most development attention. The narrower helper APIs in SEARCH-A10 and the prebuilt UI in SEARCH-A11 exist for simpler cases but are not the primary recommendation.

### SEARCH-A1. Engine setup & configuration

| ID          | Functionality                                                                                                                                                  | Key API to detect a reimplementation in the app                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEARCH-A1.1 | Single online entry point for forward search, category search, reverse geocoding, and local records; create once and reuse (see **SEARCH-B-ENGINE-1**)         | `SearchEngine.createSearchEngine(ApiType, SearchEngineSettings)`, `SearchEngine.createSearchEngineWithBuiltInDataProviders(ApiType, SearchEngineSettings)` |
| SEARCH-A1.2 | Backend selection: `ApiType.SEARCH_BOX` (recommended; POIs, addresses, places) or `ApiType.GEOCODING` (addresses and places only — see **SEARCH-B-MIGRATE-2**) | `ApiType`                                                                                                                                                  |
| SEARCH-A1.3 | Engine settings: location source, map viewport source, custom base URL                                                                                         | `SearchEngineSettings` (`locationProvider`, `viewportProvider`, `baseUrl`), `SearchEngineSettings.Builder`                                                 |
| SEARCH-A1.4 | Map center and zoom attached to analytics and feedback events                                                                                                  | `ViewportProvider` via `SearchEngineSettings.viewportProvider`                                                                                             |
| SEARCH-A1.5 | Location used automatically for proximity biasing (no manual "last location" plumbing needed)                                                                  | `SearchEngineSettings.locationProvider` (Common SDK `LocationProvider`)                                                                                    |
| SEARCH-A1.6 | Offline engine (see SEARCH-A8)                                                                                                                                 | `OfflineSearchEngine.create(OfflineSearchEngineSettings)`                                                                                                  |

### SEARCH-A2. Forward search (suggest → select)

Forward search is a two-step flow: `search` returns lightweight suggestions, and `select` resolves one suggestion into a full `SearchResult` with coordinates, address, and metadata. The two steps form one search session on the server.

| ID          | Functionality                                                                                                               | Key API                                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEARCH-A2.1 | Suggestions for a typed query                                                                                               | `SearchEngine.search(query, SearchOptions, SearchSuggestionsCallback)` → `SearchSuggestion`                                                                                                                       |
| SEARCH-A2.2 | Resolving a suggestion to a result (coordinates, address, metadata)                                                         | `SearchEngine.select(SearchSuggestion, SelectOptions, SearchSelectionCallback)` → `SearchResult` via `onResult`, `onResults`, or `onSuggestions`                                                                  |
| SEARCH-A2.3 | Suggestion kinds that resolve differently (single result, list of results, or a further list of suggestions)                | `SearchSuggestion.type`: `SearchSuggestionType.SearchResultSuggestion`, `.Category`, `.Brand`, `.Query`, `.IndexableRecordItem`                                                                                   |
| SEARCH-A2.4 | Request tuning: proximity, bounding box, countries, languages, limit, result types, request debounce, local-record handling | `SearchOptions` (`proximity`, `boundingBox`, `countries`, `languages`, `limit`, `newTypes` with `NewQueryType` constants, `requestDebounce`, `ignoreIndexableRecords`, `indexableRecordsDistanceThresholdMeters`) |
| SEARCH-A2.5 | ETA from a trip origin and ranking by travel time                                                                           | `SearchOptions.origin` + `SearchNavigationOptions` (`NavigationProfile.DRIVING` / `.WALKING` / `.CYCLING`, `EtaType.NAVIGATION`) → `SearchResult.etaMinutes`                                                      |
| SEARCH-A2.6 | One-step forward search that returns results directly (Search Box only)                                                     | `SearchEngine.forward(query, ForwardSearchOptions, SearchCallback)`                                                                                                                                               |
| SEARCH-A2.7 | Retrieve a result by its Mapbox ID (Search Box only) ★                                                                      | `SearchEngine.retrieve(mapboxId, RetrieveOptions, SearchResultCallback)`                                                                                                                                          |
| SEARCH-A2.8 | Requesting richer metadata (photos, venue details, visit details) with a selection                                          | `AttributeSet.BASIC` / `.PHOTOS` / `.VENUE` / `.VISIT` via `SelectOptions.attributeSets`, `ForwardSearchOptions.attributeSets`, `CategorySearchOptions.attributeSets`                                             |
| SEARCH-A2.9 | Automatic history entry on selection (on by default)                                                                        | `SelectOptions.addResultToHistory`                                                                                                                                                                                |

> Suggestion-step coordinates (`SearchSuggestion.coordinate`, `SearchSuggestion.routablePoints`) are 🔒 restricted: `null` unless enabled for your account. The normal flow obtains coordinates from `select`. If resolving a suggestion without `select` matters for your product, contact the Mapbox sales team. See **SEARCH-B-FLOW-1**.

### SEARCH-A3. Category & brand search

| ID          | Functionality                                                                      | Key API                                                                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEARCH-A3.1 | Search by one category name (for example `"cafe"`, `"gas_station"`)                | `SearchEngine.search(categoryName, CategorySearchOptions, SearchCallback)`                                                                                                       |
| SEARCH-A3.2 | Several categories in one request, optionally guaranteeing results for each        | `SearchEngine.search(List<String>, CategorySearchOptions, SearchCallback)`, `CategorySearchOptions.ensureResultsPerCategory`                                                     |
| SEARCH-A3.3 | Category search along a route with a detour budget                                 | `CategorySearchOptions.routeOptions` → `RouteOptions(route, RouteOptions.Deviation.Time(value, unit))` or `RouteOptions.Deviation.SarType`                                       |
| SEARCH-A3.4 | Category results with ETA and proximity biasing                                    | `CategorySearchOptions.proximity`, `.origin`, `.navigationProfile`, `.boundingBox`, `.limit`                                                                                     |
| SEARCH-A3.5 | Search by brand name, for example every location of one chain (Search Box only) 🔒 | `SearchEngine.brandSearch(brandName, BrandSearchOptions, SearchCallback)`; `BrandSearchOptions` (`proximity`, `boundingBox`, `countries`, `language`, `limit`, `showClosedPOIs`) |

### SEARCH-A4. Reverse geocoding

| ID          | Functionality                     | Key API                                                                                                                                                                   |
| ----------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEARCH-A4.1 | Address or place for a coordinate | `SearchEngine.search(ReverseGeoOptions, SearchCallback)`; `ReverseGeoOptions` (`center`, `limit`, `newTypes`, `languages`, `countries`, `reverseMode` with `ReverseMode`) |

### SEARCH-A5. Details API ★

| ID          | Functionality                                                                                      | Key API                                                                                                                                                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEARCH-A5.1 | POI, address, and place details by Mapbox ID, one or many at a time, with language and worldview ★ | `DetailsApi.create(DetailsApiSettings)`, `DetailsApi.retrieveDetails(mapboxId, RetrieveDetailsOptions, SearchResultCallback)`, `retrieveDetails(List<String>, RetrieveDetailsOptions, SearchCallback)`; `RetrieveDetailsOptions` (`attributeSets`, `language`, `worldview`) |

### SEARCH-A6. Result model, metadata & utilities

| ID          | Functionality                                                                                                                                | Key API                                                                                                                                                                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEARCH-A6.1 | Resolved result fields: coordinate, routable points, structured address, full address, distance, ETA, categories, icon, accuracy, types, IDs | `SearchResult` (`coordinate`, `routablePoints`, `address`, `fullAddress`, `distanceMeters`, `etaMinutes`, `categories`, `categoryIds`, `makiIcon`, `accuracy` → `ResultAccuracy`, `newTypes`, `mapboxId`, `externalIDs`, `boundingBox`, `metadata`)                                           |
| SEARCH-A6.2 | Address formatting at four levels of detail (no manual string assembly)                                                                      | `SearchAddress.formattedAddress(SearchAddress.FormatStyle.Short / .Medium / .Long / .Full)`                                                                                                                                                                                                   |
| SEARCH-A6.3 | POI metadata: opening hours, contacts, ratings, photos, price level, cuisines, amenity flags                                                 | `SearchResultMetadata` (`openHours` → `OpenHours`, `phone`, `website`, `averageRating`, `rating`, `reviewCount`, `priceLevel`, `primaryPhotos` / `otherPhotos` → `ImageInfo`, `cuisines`, `wheelchairAccessible`, `delivery`, `takeout`, `reservable`, `parkingAvailable`, and similar flags) |
| SEARCH-A6.4 | Parking details ★ 🔒 (rates, availability, restrictions, payment)                                                                            | `SearchResultMetadata.parkingInfo` → `ParkingInfo`, `ParkingRateInfo`, `ParkingAvailabilityLevel`, `ParkingRestriction`                                                                                                                                                                       |
| SEARCH-A6.5 | Distance between two points, on the sphere or precise near a latitude                                                                        | `DistanceCalculator.instance(latitude).distance(from, to)`, `DistanceCalculator.distanceOnSphere(from, to)`                                                                                                                                                                                   |
| SEARCH-A6.6 | Match highlighting of the query inside a result name (for bold ranges in a list)                                                             | `HighlightsCalculator.highlights(name, query)`                                                                                                                                                                                                                                                |
| SEARCH-A6.7 | OpenStreetMap ID from a POI ID                                                                                                               | `OsmIdUtils.fromPoiId`                                                                                                                                                                                                                                                                        |
| SEARCH-A6.8 | Typed ISO country and language codes with constants (no hand-written tags)                                                                   | `IsoCountryCode`, `IsoLanguageCode` — see **SEARCH-B-REQUEST-3**                                                                                                                                                                                                                              |

### SEARCH-A7. Local data: history, favorites & custom records

The SDK stores search history and favorites on the device and searches them together with server results. An app-maintained store of recent or saved places is a legitimate design choice, but it may duplicate what the built-in providers already do: persistence, a bounded history filled automatically on `select`, favorites, searching the records alongside server results, and change notifications. Report such a store as a **possible duplication** at low severity, pointing to this section, so the developer can check whether the built-in providers cover their needs. It is not a defect.

| ID          | Functionality                                                                                                                                                      | Key API                                                                                                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SEARCH-A7.1 | Persistent search history (bounded, most recent first) filled automatically on `select`                                                                            | `ServiceProvider.INSTANCE.historyDataProvider()` → `HistoryDataProvider`, `HistoryRecord`                                                                                                                                                                                |
| SEARCH-A7.2 | Persistent favorites                                                                                                                                               | `ServiceProvider.INSTANCE.favoritesDataProvider()` → `FavoritesDataProvider`, `FavoriteRecord`                                                                                                                                                                           |
| SEARCH-A7.3 | Searching the app's own records (stores, depots, contacts) in the same request as server results, with ranking by provider priority and an optional distance limit | `IndexableDataProvider`, `IndexableRecord`, `SearchEngine.registerDataProvider` / `unregisterDataProvider`; results arrive as `SearchSuggestionType.IndexableRecordItem` and `SearchResult.indexableRecord`; see `SearchOptions.indexableRecordsDistanceThresholdMeters` |
| SEARCH-A7.4 | Batch record updates and reads                                                                                                                                     | `IndexableDataProvider.upsertAll`, `remove`, `clear`, `get`, `getAll`, `contains`; engine side `IndexableDataProviderEngine.upsertAll` / `removeAll`                                                                                                                     |
| SEARCH-A7.5 | Change notifications for history and favorites                                                                                                                     | `LocalDataProvider.addOnDataChangedListener` / `removeOnDataChangedListener`                                                                                                                                                                                             |

### SEARCH-A8. Offline search

Offline search is available to accounts that have arranged access with Mapbox; if the codebase uses it, assume access is in place. Some additional data resources (for example the Japanese dictionary, SEARCH-A8.3) have narrower availability and should be confirmed with Mapbox per project.

The offline engine runs one operation at a time: every new call of any kind (search, category search, reverse geocoding, search along a route, retrieve) cancels the operation still in flight, which then completes with `SearchCancellationException` (see SEARCH-A9).

| ID           | Functionality                                                                                                                                                                                                                                                                                                   | Key API                                                                                                                                                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEARCH-A8.1  | Offline engine (one instance per process; see **SEARCH-B-ENGINE-1**)                                                                                                                                                                                                                                            | `OfflineSearchEngine.create(OfflineSearchEngineSettings)`; settings `tileStore` (Common SDK `TileStore`), `tilesBaseUri`, `locationProvider`                                                                                                                              |
| SEARCH-A8.2  | Describing which search data to download for a region                                                                                                                                                                                                                                                           | `OfflineSearchEngine.createTilesetDescriptor(TilesetParameters)` ★, `createTilesetDescriptor(List<TilesetParameters>, additionalResources)` ★; `TilesetParameters.Builder` (`language`, `worldview`, `overviewOnly`); used with the Common SDK `TileStore.loadTileRegion` |
| SEARCH-A8.3  | Additional resources a region needs ★ (limited availability — confirm with Mapbox; `OfflineSearchResource.JAPANESE_DICTIONARY` for regions covering Japan)                                                                                                                                                      | `OfflineSearchResource`                                                                                                                                                                                                                                                   |
| SEARCH-A8.4  | Choosing which downloaded dataset and result language offline search uses. Without a selection the engine decides on its own: the default dataset when it is downloaded, otherwise an unspecified one of the downloaded datasets, so an app that downloads several datasets or languages must select explicitly | `OfflineSearchEngine.selectTileset(TilesetParameters)` ★                                                                                                                                                                                                                  |
| SEARCH-A8.5  | Engine readiness after previously downloaded data is loaded                                                                                                                                                                                                                                                     | `OfflineSearchEngine.addEngineReadyCallback` / `removeEngineReadyCallback`                                                                                                                                                                                                |
| SEARCH-A8.6  | Offline forward search                                                                                                                                                                                                                                                                                          | `OfflineSearchEngine.search(query, OfflineSearchOptions, OfflineSearchCallback)`; options `proximity`, `boundingBox`, `limit`, `origin`, `searchPlacesOutsideBoundingBox`                                                                                                 |
| SEARCH-A8.7  | Offline category search, single or multiple categories ★                                                                                                                                                                                                                                                        | `OfflineSearchEngine.categorySearch(name or List<String>, OfflineCategorySearchOptions, OfflineSearchCallback)`, `OfflineCategorySearchOptions.ensureResultsPerCategory`                                                                                                  |
| SEARCH-A8.8  | Offline reverse geocoding                                                                                                                                                                                                                                                                                       | `OfflineSearchEngine.reverseGeocoding(OfflineReverseGeoOptions, OfflineSearchCallback)`                                                                                                                                                                                   |
| SEARCH-A8.9  | Offline search along a route ★                                                                                                                                                                                                                                                                                  | `OfflineSearchEngine.searchAlongRoute(query, OfflineSearchAlongRouteOptions, OfflineSearchCallback)`; options `route`, `origin`, `limit`                                                                                                                                  |
| SEARCH-A8.10 | Offline addresses on a street near a point                                                                                                                                                                                                                                                                      | `OfflineSearchEngine.searchAddressesNearby(street, proximity, radiusMeters, OfflineSearchCallback)`                                                                                                                                                                       |
| SEARCH-A8.11 | Offline EV charging filters 🔒 (only datasets that include EV data)                                                                                                                                                                                                                                             | `OfflineEvSearchOptions` (`connectorTypes`, `operators`, `excludeOperators`, `minChargingPower`, `maxChargingPower`) on `OfflineSearchOptions`, `OfflineCategorySearchOptions`, `OfflineSearchAlongRouteOptions`                                                          |
| SEARCH-A8.12 | Offline result details for a map feature                                                                                                                                                                                                                                                                        | `OfflineSearchEngine.retrieve(Feature, OfflineSearchResultCallback)` → `OfflineSearchResult`                                                                                                                                                                              |
| SEARCH-A8.13 | Offline result metadata ★ 🔒 (contacts, opening hours, photos, EV charging data, parking details; only datasets that include it)                                                                                                                                                                                | `OfflineSearchResult.metadata` → `OfflineSearchResultMetadata` (`phone`, `website`, `openHours`, `primaryPhotos` / `otherPhotos`, `evMetadata` → `EvMetadata`, `parkingInfo` → `ParkingInfo`, `facilities`, `timezone`)                                                   |

### SEARCH-A9. Request lifecycle & threading contract (not a feature)

This is not a reimplementation to look for. It is the contract the antipatterns in Part B rely on.

- **Every call is asynchronous** and returns an `AsyncOperationTask` (`cancel()`, `isDone`, `isCancelled`). Nothing blocks the caller.
- **Callbacks run on the main thread by default.** Every method has an overload that takes an `Executor` for delivering the callback elsewhere. Result objects are built on an SDK worker thread before the callback is posted, so the callback receives ready-to-use `SearchResult` / `SearchSuggestion` instances.
- **Engine methods may be called from any thread.** There is no main-thread requirement on the calling side.
- **A superseded request completes with `SearchCancellationException`** in `onError`. For the online suggest step this happens automatically when a newer suggest is issued (with or without `requestDebounce`); for the offline engine it happens for every operation. Category, reverse, one-step forward, and retrieve calls on the online engine are not superseded automatically — cancel them through the returned task when they become obsolete.
- **Server and connectivity failures** arrive as `SearchRequestException` (HTTP) or other exceptions in `onError`.

### SEARCH-A10. Narrow helper APIs (simpler cases only)

These are lighter wrappers around the same backend. They are supported but receive less development attention than `SearchEngine`, cover fewer options, and recent integrations have generally been better served by `SearchEngine` directly. Do not recommend migrating _to_ them; do note where a codebase uses them so the reviewer can judge whether `SearchEngine` would fit better.

| ID           | Functionality                                                                       | Key API                                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEARCH-A10.1 | Place Autocomplete: suggestions, selection, and reverse lookup with a coroutine API | `PlaceAutocomplete.create(locationProvider)`, `suggestions(query, region, proximity, PlaceAutocompleteOptions)`, `select(suggestion)`, `reverse(point, options)` |
| SEARCH-A10.2 | Discover: nearby, in-area, or along-route search for a fixed set of categories      | `Discover.create(locationProvider)`, `search(DiscoverQuery.Category.X, proximity / region / route, DiscoverOptions)`, `RouteDeviationOptions`                    |
| SEARCH-A10.3 | Address Autofill: address-form completion                                           | `AddressAutofill.create(locationProvider)`, `suggestions(Query, AddressAutofillOptions)`, `select(suggestion)`, `reverse(point, options)`                        |

### SEARCH-A11. Prebuilt UI (mention only)

The `ui` module ships a results list and adapters. It is lightly maintained and covers a narrow set of screens; most integrations implement their own UI on top of `SearchEngine`, and that is a reasonable default. Note its presence in the inventory; do not flag custom UI as a reimplementation of it.

| ID           | Functionality                                                                       | Key API                                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEARCH-A11.1 | Results list view wired to the online and offline engines, with online/offline mode | `SearchResultsView` (`initialize(SearchResultsView.Configuration)`), `SearchEngineUiAdapter(view, searchEngine, offlineSearchEngine)`, `SearchMode.ONLINE` / `.OFFLINE` |
| SEARCH-A11.2 | Adapters for the helper APIs and a place bottom sheet                               | `PlaceAutocompleteUiAdapter`, `AddressAutofillUiAdapter`, `SearchPlaceBottomSheetView`, `SearchPlace`                                                                   |
| SEARCH-A11.3 | Main-thread debounce helper                                                         | `Debouncer(delayMillis).debounce { }` / `cancel()`                                                                                                                      |

### SEARCH-A12. Feedback & analytics

| ID           | Functionality                                               | Key API                                                                                                                                                                       |
| ------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEARCH-A12.1 | Reporting a wrong result or a missing result back to Mapbox | `SearchEngine.analyticsService` → `AnalyticsService.sendFeedback(result or suggestion, ResponseInfo, FeedbackEvent)`, `sendMissingResultFeedback(MissingResultFeedbackEvent)` |

### SEARCH-A13. Dependency & version alignment (not a feature)

This is not a reimplementation to look for. It is a note on dependency management.

- Every Search SDK release is built against specific **Common SDK** and **Maps SDK** versions (for example 2.33.0 pairs with Common 24.33.0 and Maps 11.33.0). Mixing a Search SDK release with Maps or Navigation artifacts from a different release line is a compatibility risk.
- With the **Navigation SDK**, consume Search through the Navigation-provided `com.mapbox.navigation:search` artifact rather than pinning Search SDK artifacts directly; it guarantees a tested Navigation–Search pairing.
- The older **mapbox-java** geocoding client (`com.mapbox.api.geocoding.v5.MapboxGeocoding`) is a separate library against the Geocoding v5 API. Using it alongside the Search SDK is covered by **SEARCH-B-MIGRATE-3**.

---

## Part B — Performance & Correctness Antipatterns

These are not reimplemented features. They are ways of using the SDK that are known to be costly or unsafe, and they usually produce the most valuable findings. Section **SEARCH-B-MIGRATE** additionally covers API choices that still work but should be migrated.

### SEARCH-B-FLOW. Suggest / select flow correctness

**Background.** Forward search (SEARCH-A2) is two steps. Suggestions are intentionally lightweight; the coordinates, address, and metadata come from `select`. A `select` call can resolve to one result, to a list of results, or to another list of suggestions, depending on the suggestion kind.

#### SEARCH-B-FLOW-1. Suggestion used as a final result

Reading `coordinate` or `routablePoints` from a `SearchSuggestion` and skipping `select` is not the normal flow. Those fields are 🔒 restricted: `null` unless enabled for the account, and even where populated the result metadata, accuracy, and history entry only come from `select`. Report code that navigates to, places a marker at, or stores a suggestion's coordinate without calling `select`. If that code opts in with `@OptIn(RestrictedMapboxSearchAPI::class)` or the matching compiler flag, the account may have access: report it as `[VERIFY WITH MAPBOX]` rather than a defect. Otherwise the fix is to call `select` and use the `SearchResult`.

```kotlin
// Avoid — treating the suggestion as a resolved place
val point = suggestion.coordinate ?: return   // null unless specially enabled
showMarker(point)

// Prefer — resolve first
searchEngine.select(suggestion, object : SearchSelectionCallback { /* onResult → showMarker(result.coordinate) */ })
```

#### SEARCH-B-FLOW-2. Not all suggestion kinds handled

`SearchSelectionCallback` has three success paths: `onResult` (one result), `onResults` (a list — category and brand suggestions), and `onSuggestions` (a further list of suggestions — query suggestions). An implementation that handles only `onResult` silently drops category, brand, and query suggestions, which typically appear at the top of the list. Report callbacks that leave `onResults` or `onSuggestions` empty while the UI shows all suggestion kinds, and code that filters out `SearchSuggestionType.Category` / `.Query` to avoid handling them.

#### SEARCH-B-FLOW-3. Deprecated batch selection

`select(List<SearchSuggestion>, SearchMultipleSelectionCallback)` is deprecated and not supported on `ApiType.SEARCH_BOX` — the callback receives `onError` immediately. Report its use; resolve suggestions one at a time with `select(SearchSuggestion, …)`.

#### SEARCH-B-FLOW-4. Search-Box-only calls on another API type

`SearchEngine.forward(...)` and `SearchEngine.retrieve(mapboxId, ...)` require an engine created with `ApiType.SEARCH_BOX`; on other API types they fail (`retrieve` throws, `forward` reports an error). Report these calls on an engine whose `ApiType` is `GEOCODING` or `SBS`, or on an engine created with the deprecated `createSearchEngine(settings)` overload, which defaults to `GEOCODING`.

#### SEARCH-B-FLOW-5. Duplicate history writes

`select` adds the resolved result to the SDK history automatically (`SelectOptions.addResultToHistory` defaults to `true`). Code that also calls `historyDataProvider().upsert(...)` in the selection callback writes every selection twice. Either rely on the automatic entry, or pass `SelectOptions(addResultToHistory = false)` and write manually — not both. (An app-owned history store that is independent of the SDK's is not this finding; report it as a possible duplication of SEARCH-A7.)

#### SEARCH-B-FLOW-6. Cancellation shown as an error

A superseded request completes through `onError` with `SearchCancellationException` (contract in SEARCH-A9). Handlers that show a toast, log at error level, or clear the results list for every `onError` turn routine supersession during typing into user-visible failures. Report `onError` implementations that do not distinguish `SearchCancellationException` from real failures.

### SEARCH-B-REQUEST. Request hygiene

#### SEARCH-B-REQUEST-1. A request per keystroke with no debounce

Issuing `search(query, …)` on every text change with neither `SearchOptions.requestDebounce` nor a client-side debounce sends a request per character. The SDK offers `requestDebounce` (milliseconds) which delays the send and drops a pending request when a newer one arrives, and separately supersedes any older in-flight suggest response. Use one mechanism: set `requestDebounce`, or debounce in the UI layer (for example with `Debouncer`); doing both only adds latency. Report text-change handlers that call `search` unconditionally with no debounce anywhere.

#### SEARCH-B-REQUEST-2. Returned task discarded, nothing cancelled on teardown

Every engine call returns an `AsyncOperationTask`. Discarding it means in-flight category, reverse, forward, retrieve, and details requests cannot be cancelled when the screen closes or the input changes, so their callbacks arrive on a destroyed view (a leak or crash) or render results for a stale query. Keep the latest task per request kind, cancel it before issuing the next request of the same kind, and cancel all of them in the teardown path. The online suggest step is superseded automatically (SEARCH-A9) but still delivers a cancellation callback, so teardown cancellation applies to it too.

```kotlin
// Avoid
searchEngine.search(query, options, callback)

// Prefer
currentTask?.cancel()
currentTask = searchEngine.search(query, options, callback)
// … and in onDestroy / onCleared: currentTask?.cancel()
```

#### SEARCH-B-REQUEST-3. Hand-built language and country codes

`SearchOptions.languages`, `countries`, and the equivalents on category, reverse, forward, and details options take `IsoLanguageCode` / `IsoCountryCode`. Building them from `Locale.getDefault().toLanguageTag()` (which yields tags such as `"en-US"` or `"zh-Hans-CN"`) or from other non-ISO-639-1 strings produces values the backend does not recognise, and Search Box then falls back silently to English rather than failing. Use the provided constants (`IsoLanguageCode.ENGLISH`, …) or the two-letter `Locale.language`. Note that the options already default to the device locale, so explicit language plumbing is usually unnecessary. Also, on `ApiType.SEARCH_BOX` only the first entry of `languages` is sent for search (forward, category, reverse, etc.); any further entries are dropped without notice, so a list built to express fallbacks does nothing. Report `toLanguageTag()`, `toString()` on a `Locale`, or string concatenation feeding these options, and `languages` lists with more than one entry on a Search Box engine.

#### SEARCH-B-REQUEST-4. Unsafe parameters duplicating a typed option

`unsafeParameters` is an escape hatch for backend parameters the SDK has no typed option for. When a typed option exists (`limit`, `languages`, `countries`, `proximity`, `boundingBox`, `newTypes`, `navigationProfile`, `origin`, …) the typed value is already in the request; the unsafe key is appended as a second copy, is not URL-encoded, and is ignored by the backend. The app's intended value therefore never takes effect. Changing unsafe parameters between requests also ends the current search session. This is a bug, not a style issue. Report any `unsafeParameters` key that has a typed equivalent on the same options class, and any unsafe value containing characters that require encoding.

#### SEARCH-B-REQUEST-5. Options that change on every request

A suggest-then-select flow runs inside one search session. The SDK keeps the session open across suggestions only while the `SearchOptions` stay the same as the first request's; changing them, or issuing any other kind of request on the same engine while the user types, starts a new session. This typically happens when options are rebuilt from changing state (such as the map camera) on every request, or when the engine behind a search box is also used for other requests while the user types. On `ApiType.SEARCH_BOX`, suggest and select calls are billed per session (see the [Search Box API billing section](https://docs.mapbox.com/api/search/search-box/#understand-how-billing-works-for-both-apis) and [pricing](https://www.mapbox.com/pricing#search)), so avoidable restarts can multiply billable sessions. Keep the options stable for the duration of a typing session, change them when the user's intent changes (new screen, new origin), and give unrelated requests their own engine or run them outside the typing flow.

### SEARCH-B-ENGINE. Engine instances, lifecycle & threading

#### SEARCH-B-ENGINE-1. An engine per request, per screen, or per call site

`SearchEngine` and `OfflineSearchEngine` have no teardown method and are meant to be created once and reused. Each online instance carries its own search session (SEARCH-B-REQUEST-5), its own location subscription, and its own local-record wiring; creating one per screen or per request splits suggest and select across sessions (each billed separately on Search Box, see SEARCH-B-REQUEST-5) and repeats that setup every time. Each offline instance additionally loads and holds its own copy of the offline tile data in memory, so two offline engines double the memory cost. Report engine construction inside Activities, Fragments, ViewModels, repositories created per screen, or request helpers; the fix is one shared online engine per `ApiType` and one shared offline engine, typically application-scoped or provided by the dependency-injection graph as a singleton.

#### SEARCH-B-ENGINE-2. Heavy work inside main-thread callbacks

Callbacks are delivered on the main thread by default, and that is fine for updating the UI: the SDK has already converted the response into `SearchResult` / `SearchSuggestion` objects on its own worker thread. What should not happen on that thread is substantial synchronous work — distance recomputation over every result, JSON serialisation, database or `SharedPreferences` writes, bitmap decoding, or sorting large lists with expensive comparators. Either pass an `Executor` to the engine call so the callback runs off the main thread and post only the final UI update back, or move the work out of the callback. Report only callbacks with clearly substantial per-result work; a few field reads and a list-adapter submit are not findings.

#### SEARCH-B-ENGINE-3. Listener or callback added without a matching removal

`OfflineSearchEngine.addEngineReadyCallback`, `LocalDataProvider.addOnDataChangedListener`, `LocalDataProvider.addOnDataProviderEngineRegisterListener`, and `SearchEngineUiAdapter.addSearchListener` register the listener until it is explicitly removed. Because the engines and data providers are long-lived (SEARCH-B-ENGINE-1), a listener that captures an Activity, Fragment, or View keeps that object alive for the life of the process. Report additions with no matching removal on the teardown path, listeners registered as inline lambdas with no stored reference, and registration in frequently-called code.

#### SEARCH-B-ENGINE-4. Default location source alongside an existing one

When no `locationProvider` is given, each engine obtains the device location itself through the Common SDK location service, including subscribing for location updates when no last location is known. An application that already runs a location pipeline (for example through the Navigation SDK or its own provider) should pass that provider through `SearchEngineSettings.locationProvider` / `OfflineSearchEngineSettings.locationProvider` instead of running a second one. Report engines created with default settings in applications that have their own location source. Also note that the default source requires the coarse or fine location permission; without it proximity biasing silently falls back to none.

### SEARCH-B-DATA. Local records

Applies when history, favorites, or custom `IndexableDataProvider` records are used (SEARCH-A7).

#### SEARCH-B-DATA-1. Per-record updates in a loop

Each `upsert` / `remove` call on a local data provider rewrites the whole records file and updates the search index; a loop of single-record calls does that once per record. Use `upsertAll` for bulk inserts and `clear` plus `upsertAll` for a full replacement; on the engine side use `IndexableDataProviderEngine.upsertAll` / `removeAll`. Report loops that call single-record methods, and "sync" code that clears and re-inserts a whole dataset one record at a time.

#### SEARCH-B-DATA-2. Unbounded favorites or custom record sets

History is capped by the SDK, favorites and custom providers are not. Every record is kept in memory and indexed for prefix matching, and the whole favorites set is rewritten to disk on each change (SEARCH-B-DATA-1). A provider fed with tens of thousands of records — a full store catalogue, every contact, every past address — grows memory and makes each change proportionally slower. Keep custom datasets to what the user should actually see in search, and keep favorites bounded (for example by pruning the oldest entries). Report providers whose record count is open-ended or driven by a bulk import without a limit.

#### SEARCH-B-DATA-3. Local records searched separately and merged by hand

Querying an app-owned list of places with a custom string match and merging it into the SDK results client-side duplicates what a registered `IndexableDataProvider` does: the SDK matches the records, ranks them by provider priority alongside server results, applies the distance threshold, and resolves them through the same `select` flow. Report custom matching-and-merging code where the data could be registered as a provider. (An app-owned store that is not merged into search is not this finding; report it as a possible duplication of SEARCH-A7.)

### SEARCH-B-OFFLINE. Offline search

Applies when the `offline` module is used (SEARCH-A8).

#### SEARCH-B-OFFLINE-1. Searching before data is available

Offline results depend on two things: the tile region download reported complete by the Common SDK `TileStore`, and the engine having loaded previously downloaded data (`addEngineReadyCallback`). Firing offline searches at startup before either has happened returns empty results that are easy to misread as "no data". Report offline searches issued without gating on engine readiness and region availability, and readiness gated on the deprecated `OfflineSearchEngine.OnIndexChangeListener` (see SEARCH-B-OFFLINE-3) instead of the tile store's completion callback.

#### SEARCH-B-OFFLINE-2. Tile store configured differently for search than for Maps or Navigation

The Common SDK keeps one `TileStore` per process: `TileStore.create()` returns the existing instance, and `OfflineSearchEngineSettings()` calls exactly that, so the default settings already share the store with the Maps and Navigation SDKs. Leaving `tileStore` unset is correct and is not a finding. What still goes wrong is configuring the store's location differently for search: the deprecated `TileStore.create(path)` overload, or a `TileStore.setRootPath(...)` call for search that names a different path from the one Maps or Navigation set. Report `TileStore.create(path)` anywhere, and `setRootPath` calls that disagree between SDKs; the fix is one path set once at startup, or no path at all.

#### SEARCH-B-OFFLINE-3. Deprecated offline calls

The following still compile but are deprecated: `createPlacesTilesetDescriptor(...)` (use `createTilesetDescriptor(TilesetParameters)` with `overviewOnly(true)`), the `searchAlongRoute(query, proximity, route, …)` overload (use `OfflineSearchAlongRouteOptions`), and the `OnIndexChangeListener` / `OfflineIndexChangeEvent` family (start searching once the tile store reports the region download complete). Report each use with the replacement.

Pinning a dataset version deserves its own entry in the report. The `TilesetParameters.Builder(dataset, version)` constructor and its `version` property are deprecated; use `Builder(dataset)` or `Builder()`, which take the latest version. Report every non-empty version as a migration to the versionless builder.

#### SEARCH-B-OFFLINE-4. Online and offline engines raced for the same query

Issuing the same query to both engines and showing whichever answers first, or showing both, produces duplicated and flickering lists and doubles the work. Decide the mode up front (for example from connectivity, or from whether the region is downloaded) and query one engine; cancel the other engine's task if a mode switch happens mid-query. The `ui` module's `SearchEngineUiAdapter` with `SearchMode` is one existing implementation of this switch. Report code paths that dispatch one query to both engines without cancelling one of them.

#### SEARCH-B-OFFLINE-5. Region covers Japan without the Japanese dictionary (confirm with Mapbox)

For regions that include Japan, search in that data needs the additional resource `OfflineSearchResource.JAPANESE_DICTIONARY` declared on the tileset descriptor; without it searches in that data return no results. Availability of additional resources is arranged per account, so this is a question for the reviewer rather than a defect: report tileset descriptors for regions that plausibly cover Japan and state whether the resource is declared, tagged `[VERIFY WITH MAPBOX]`.

#### SEARCH-B-OFFLINE-6. Offline operations started while another is in progress

`OfflineSearchEngine` processes one request at a time: a new call of any kind cancels the one still running, which completes with `SearchCancellationException` (SEARCH-A8). That is the right behavior while the user types, because the newest query can start immediately and the stale one is dropped. It is wrong when the cancellation is not wanted: a reverse geocode for the map center issued while a category search is loading a results list cancels that list; an along-route search started by a route update cancels a search the user is waiting on. Report call sites that issue offline requests from independent triggers (typing, map movement, route updates, screen setup) with no coordination between them. The fix is one coordinator for the offline engine that queues or prioritises requests, so only the typing path relies on cancellation.

#### SEARCH-B-OFFLINE-7. Offline result ids saved or used for online lookups

`OfflineSearchResult.id` identifies a result only within the offline data currently on the device. It can change when that data is updated, even for a place that did not change otherwise, and it is never the same as an online result id; `OfflineSearchResult.mapboxId` is `null` for offline results apart from some EV charging data. Report offline ids stored in favorites, history, waypoints, or any persisted record, offline ids used as deduplication keys across searches or sessions, and offline ids passed to `SearchEngine.retrieve(mapboxId, …)` or `DetailsApi.retrieveDetails(...)`, which cannot resolve them. The fix is to persist the place's name and coordinate (and the address if needed) and search again to resolve it when it is used.

#### SEARCH-B-OFFLINE-8. Offline results joined to online or map results by id or exact coordinate

An offline result cannot be matched to an online result or to a map-tile POI by identity: it has no online id (SEARCH-B-OFFLINE-7), and its coordinate is stored at reduced precision in the offline data, about a metre, so it will not equal the online or map coordinate of the same place. Report joins between offline results and online results, map features, or stored places that compare `mapboxId`, compare coordinates for equality, or use the coordinate as a map key. Match by name plus a distance tolerance instead (`DistanceCalculator`, SEARCH-A6.5), and treat the match as approximate.

### SEARCH-B-MIGRATE. API choices to migrate

These still work today. They are reported as migration recommendations, with the severity noted per entry.

#### SEARCH-B-MIGRATE-1. `ApiType.SBS` (deprecated)

`ApiType.SBS` has been deprecated since 2.6.0 in favour of `ApiType.SEARCH_BOX`, which is the maintained backend for POI, address, and place search. Report every engine created with `SBS`, and any `singleBoxSearchBaseUrl` configuration, as a migration to `SEARCH_BOX`. Severity: should migrate.

#### SEARCH-B-MIGRATE-2. `ApiType.GEOCODING` where POIs are expected

The Geocoding v5 backend no longer returns points of interest (restaurants, fuel stations, landmarks, businesses); it serves addresses and administrative places. An engine on `ApiType.GEOCODING` — including one created with the deprecated `createSearchEngine(settings)` overload, which defaults to `GEOCODING` — used for category search, for queries whose UI expects businesses, or whose results are filtered by `categories` / `makiIcon`, will not get them. Report such engines as a migration to `ApiType.SEARCH_BOX`. If the integration is purely address and place lookup, `GEOCODING` remains a valid choice and is not a finding. Severity: should migrate when POIs are involved.

#### SEARCH-B-MIGRATE-3. mapbox-java geocoding mixed with the Search SDK

`com.mapbox.api.geocoding.v5.MapboxGeocoding` (from the mapbox-java `mapbox-sdk-services` library) is a separate, older client for the Geocoding v5 API, with its own models (`CarmenFeature`), no session handling, no local records, and no offline mode. A codebase that uses it alongside the Search SDK maintains two result models and two sets of request semantics, and inherits the POI limitation in SEARCH-B-MIGRATE-2. This is a warning, not a bug: report each `MapboxGeocoding` use with what it is used for (forward, reverse, autocomplete) and suggest the Search SDK equivalent (SEARCH-A2, SEARCH-A4). Severity: consider consolidating on the Search SDK.

#### SEARCH-B-MIGRATE-4. Deprecated type enums and overloads

Report with the replacement: `SearchOptions.types` / `ReverseGeoOptions.types` / `ForwardSearchOptions.types` and the `QueryType` enum (use `newTypes` with `NewQueryType` constants); `SearchResult.types` and the `SearchResultType` enum (use `newTypes` / `NewSearchResultType`); `HistoryRecord` / `FavoriteRecord` / `IndexableRecord.type` (use `newType`); `createSearchEngine(settings)` and `createSearchEngineWithBuiltInDataProviders(settings)` without an explicit `ApiType`. Severity: low on their own; they matter because the old enums cannot represent newer result kinds.

---

## Part C — Audit Prompts

Run the prompts below one at a time, in order.

Apply the **grounding rule** in every prompt: only flag a finding when the API or antipattern appears in Parts A or B; tag uncertain items `[VERIFY WITH MAPBOX]` and never invent method or class names.

Record findings in the **output schema**: `Prompt ID | File:line | Pattern observed | SDK equivalent (catalog ID) | Confidence | FP risk | Suggested change`.

---

### Per-Prompt Reference

#### SEARCH-P1. SDK API & feature inventory

```
You are reviewing a Mapbox Search SDK for Android (Kotlin/Java) integration.
Apply the grounding rule: only reference SDK APIs that appear in the catalog
(Part A) of the provided audit document. Tag uncertain items [VERIFY WITH MAPBOX].

1. List every com.mapbox.search.* public symbol called in this codebase, grouped
   by catalog area (SEARCH-A1..SEARCH-A12).
   Table: symbol | distinct call-site count | sample file:line | one-line use | thread context.

2. List every Mapbox search module in build.gradle(.kts) — search-sdk, offline,
   place-autocomplete, autofill, discover, ui, sdk-common, or the Navigation-provided
   com.mapbox.navigation:search: coordinate | version | used? | purpose | removal candidate.
   Note whether the Search SDK version line matches the Maps / Navigation SDK versions
   in use (SEARCH-A13).

3. Every SearchEngine / OfflineSearchEngine / DetailsApi / PlaceAutocomplete / Discover /
   AddressAutofill creation: file:line | ApiType (SEARCH_BOX, GEOCODING, SBS, or defaulted)
   | scope (singleton / Application / DI / ViewModel / Activity / per call)
   | settings passed (locationProvider, viewportProvider, tileStore).

4. Any use of com.mapbox.api.geocoding.v5.MapboxGeocoding or other mapbox-java
   geocoding classes: file:line | purpose (forward / reverse / autocomplete).

Ignore tests, samples, dead code.
```

#### SEARCH-P2. Reimplemented-functionality review (catalog-driven)

```
Using the SDK Functional Catalog (Part A), find places where this codebase
implements its own version of something the SDK already provides.

For EACH catalog area below, search for custom implementations and report matches:
- SEARCH-A1 engine setup: manual last-location plumbing into every request instead of
  SearchEngineSettings.locationProvider (passing the map viewport as boundingBox is
  correct, not a reimplementation)
- SEARCH-A2 forward search: custom suggest/select orchestration, custom ETA or
  travel-time ranking of results, a custom debounce layered on top of requestDebounce
- SEARCH-A3 category search: category results assembled from forward search plus
  client-side category filtering; custom along-route filtering where
  CategorySearchOptions.routeOptions applies; client-side name matching to find one
  brand's locations where brandSearch applies (🔒 — note that access is requested
  from Mapbox sales)
- SEARCH-A4 reverse geocoding performed through another client
- SEARCH-A5 details (★ — skip if not available in the version being audited): a second
  request pipeline for POI details where DetailsApi / SearchEngine.retrieve applies
- SEARCH-A6 result utilities: custom address string assembly (use
  SearchAddress.formattedAddress), custom haversine / distance code (DistanceCalculator),
  custom query highlighting (HighlightsCalculator), hand-written ISO code tables
- SEARCH-A7 local records: custom string matching over local places merged into search
  results where an IndexableDataProvider applies; and any app-owned history or
  favorites store — report it as a possible duplication of the built-in providers at
  low severity, so the developer can compare. It is not a defect.
- SEARCH-A8 offline: custom matching over downloaded data, custom tileset bookkeeping
- SEARCH-A12 feedback: custom "report wrong result" pipelines

Do NOT flag custom UI as a reimplementation of SEARCH-A11, and do NOT recommend
migrating to the SEARCH-A10 helper APIs.

For each finding: catalog ID | file:line | what is custom | SDK equivalent |
confidence | false-positive risk (some custom behavior is intentional —
say why you think it's a duplicate).
```

#### SEARCH-P3. Suggest / select flow (SEARCH-B-FLOW-1–SEARCH-B-FLOW-6)

```
Grounding: antipattern section SEARCH-B-FLOW.

1. SEARCH-B-FLOW-1: suggestion.coordinate or suggestion.routablePoints read and used
   (marker, navigation, storage) without a select() call on that suggestion. If the
   code opts in to RestrictedMapboxSearchAPI, report it as [VERIFY WITH MAPBOX]
   instead of a defect.
2. SEARCH-B-FLOW-2: SearchSelectionCallback implementations whose onResults or
   onSuggestions is empty or missing, or code that filters out
   SearchSuggestionType.Category / .Brand / .Query to avoid handling them.
3. SEARCH-B-FLOW-3: the deprecated select(List<SearchSuggestion>,
   SearchMultipleSelectionCallback).
4. SEARCH-B-FLOW-4: SearchEngine.forward() or SearchEngine.retrieve(mapboxId) on an
   engine whose ApiType is GEOCODING or SBS, or that was created with the ApiType-less
   createSearchEngine(settings) overload (defaults to GEOCODING).
5. SEARCH-B-FLOW-5: historyDataProvider().upsert(...) inside a selection callback while
   SelectOptions.addResultToHistory is left at its default (true).
6. SEARCH-B-FLOW-6: onError handlers that treat SearchCancellationException like a
   real failure (toast, error-level log, clearing the results list).

For each: file:line | pattern | fix.
```

#### SEARCH-P4. Request hygiene (SEARCH-B-REQUEST-1–SEARCH-B-REQUEST-5)

```
Grounding: antipattern section SEARCH-B-REQUEST.

1. SEARCH-B-REQUEST-1: search() called from a text-change listener with neither
   SearchOptions.requestDebounce nor a client-side debounce; or both stacked.
2. SEARCH-B-REQUEST-2: AsyncOperationTask return values discarded; no cancel() before
   the next request of the same kind; no cancel() in onDestroy / onCleared /
   onDetachedFromWindow.
3. SEARCH-B-REQUEST-3: IsoLanguageCode / IsoCountryCode built from
   Locale.toLanguageTag(), Locale.toString(), or string concatenation; any
   non-ISO-639-1 language value; languages lists with more than one entry on a
   SEARCH_BOX engine (only the first entry is sent).
4. SEARCH-B-REQUEST-4: unsafeParameters keys that have a typed equivalent on the same
   options class (limit, language, country, proximity, bbox, types, navigation_profile,
   origin, …), or values that need URL encoding. This is a bug: the unsafe copy is
   ignored by the backend.
5. SEARCH-B-REQUEST-5: SearchOptions that change between requests within one typing
   session (for example rebuilt from changing state such as the map camera), or other
   kinds of requests issued on the search box's engine while the user types.

For each: file:line | pattern | fix.
```

#### SEARCH-P5. Engine instances, lifecycle & threading (SEARCH-B-ENGINE-1–SEARCH-B-ENGINE-4)

```
Grounding: antipattern section SEARCH-B-ENGINE. Engine calls may be made from any
thread; callbacks arrive on the main thread unless an Executor is passed.

1. SEARCH-B-ENGINE-1: SearchEngine / OfflineSearchEngine created per Activity, Fragment,
   ViewModel, per-screen repository, or per request; more than one OfflineSearchEngine
   instance in the process.
2. SEARCH-B-ENGINE-2: substantial synchronous work inside callbacks delivered on the
   main thread — per-result distance math, JSON serialisation, disk or SharedPreferences
   writes, bitmap decoding, expensive sorting. Do not flag simple field reads and
   adapter updates.
3. SEARCH-B-ENGINE-3: addEngineReadyCallback / addOnDataChangedListener /
   addOnDataProviderEngineRegisterListener / addSearchListener without a matching
   remove on teardown; inline-lambda listeners; registration in frequently-called code.
4. SEARCH-B-ENGINE-4: engines created with default settings (no locationProvider) in an
   application that already has a location source (Navigation SDK, own provider).

For each: file:line | component | create site | release site (or MISSING) | risk | fix.
```

#### SEARCH-P6. Local records (SEARCH-B-DATA-1–SEARCH-B-DATA-3)

```
Grounding: antipattern section SEARCH-B-DATA. Only if history, favorites, or an
IndexableDataProvider are used.

1. SEARCH-B-DATA-1: loops of single-record upsert / remove calls; clear-and-reinsert
   of a whole dataset one record at a time (use upsertAll, or clear plus upsertAll;
   on the engine side upsertAll / removeAll).
2. SEARCH-B-DATA-2: favorites or custom providers filled from open-ended sources
   (full catalogues, all contacts, every past address) with no cap.
3. SEARCH-B-DATA-3: custom string matching over a local place list merged into SDK
   results client-side where registering an IndexableDataProvider applies.
   An app-owned store that is not merged into search is not a DATA finding; it
   belongs under SEARCH-P2 as a possible duplication of SEARCH-A7.

For each: file:line | pattern | record count or source | fix.
```

#### SEARCH-P7. Offline search (SEARCH-B-OFFLINE-1–SEARCH-B-OFFLINE-8)

```
Grounding: antipattern section SEARCH-B-OFFLINE. Only if the offline module is used.

1. SEARCH-B-OFFLINE-1: offline searches not gated on addEngineReadyCallback and on
   tile-region download completion; readiness gated on the deprecated
   OnIndexChangeListener instead of the tile store's completion callback.
2. SEARCH-B-OFFLINE-2: the deprecated TileStore.create(path) overload anywhere, or
   TileStore.setRootPath(...) paths that differ between search and Maps/Navigation. The
   default tile store in OfflineSearchEngineSettings is the shared one and is not a
   finding.
3. SEARCH-B-OFFLINE-3: createPlacesTilesetDescriptor, the
   searchAlongRoute(query, proximity, route, …) overload, OnIndexChangeListener /
   OfflineIndexChangeEvent, and any TilesetParameters.Builder(dataset, version) call with
   a non-empty version — report the version pin separately: it bypasses multi-tileset
   descriptors and additional resources.
4. SEARCH-B-OFFLINE-4: the same query dispatched to both the online and the offline
   engine without cancelling one of them.
5. SEARCH-B-OFFLINE-5: tileset descriptors for regions that plausibly cover Japan —
   state whether OfflineSearchResource.JAPANESE_DICTIONARY is declared. Tag
   [VERIFY WITH MAPBOX]; this is a question for the reviewer, not a defect.
6. SEARCH-B-OFFLINE-6: offline requests issued from independent triggers (typing, map
   movement, route updates, screen setup) with no coordinator between them, so one
   request cancels another unintentionally.
7. SEARCH-B-OFFLINE-7: OfflineSearchResult.id persisted (favorites, history, waypoints,
   any stored record), used as a deduplication key, or passed to SearchEngine.retrieve /
   DetailsApi.retrieveDetails.
8. SEARCH-B-OFFLINE-8: offline results joined to online results, map features, or stored
   places by mapboxId, by exact coordinate equality, or by using the coordinate as a map
   key; the fix is name plus a distance tolerance.

For each: file:line | pattern | fix.
```

#### SEARCH-P8. API migrations (SEARCH-B-MIGRATE-1–SEARCH-B-MIGRATE-4)

```
Grounding: antipattern section SEARCH-B-MIGRATE. These work today; report them as
migrations with the stated severity.

1. SEARCH-B-MIGRATE-1: ApiType.SBS or singleBoxSearchBaseUrl anywhere → SEARCH_BOX.
2. SEARCH-B-MIGRATE-2: ApiType.GEOCODING (explicit, or defaulted through
   createSearchEngine(settings)) on an engine used for category search, or whose
   results are expected to contain businesses / POIs (UI shows categories, makiIcon,
   opening hours; queries such as "coffee" or "fuel") → SEARCH_BOX. Pure address and
   place lookup on GEOCODING is not a finding.
3. SEARCH-B-MIGRATE-3: com.mapbox.api.geocoding.v5.MapboxGeocoding used alongside the
   Search SDK — warning level; list each use with its purpose and the Search SDK
   equivalent (SEARCH-A2 / SEARCH-A4).
4. SEARCH-B-MIGRATE-4: QueryType / .types, SearchResultType / SearchResult.types,
   record .type, and ApiType-less engine creation.

For each: file:line | current API | replacement | severity.
```

#### SEARCH-P9. Open-ended

```
SEARCH-P9a. As a senior Search SDK engineer, list the 5 most expensive search-related
code paths in CPU, memory, or network terms: file:line | frequency | why expensive |
top fix. Consider request volume during typing (SEARCH-B-REQUEST), engine and session
churn (SEARCH-B-ENGINE-1, SEARCH-B-REQUEST-5), local-record volume (SEARCH-B-DATA),
and offline tile memory (SEARCH-B-ENGINE-1).

SEARCH-P9b. Surface up to 10 things that look surprising, unusual, or inconsistent
(even if not clearly bugs): file:line | one-line description | one question for the
author. Watch for: results of different queries shown together, suggestions cached
across sessions and selected much later, access tokens or base URLs configured
inconsistently per engine, engines created on a background thread during startup,
hard-coded coordinates or language codes, missing null checks on optional
SearchResult fields (address, metadata, distanceMeters, etaMinutes).
```

#### SEARCH-P10. Wrap-up executive summary

```
Produce a one-page summary for the Mapbox reviewer:
- Integration scale: rough count of search-related files/classes, distinct search
  screens, and which catalog areas (SEARCH-A1–SEARCH-A12) are in use.
- ApiType(s) in use, and whether offline search is used.
- Primary use case(s) in one paragraph.
- Top 5 findings across all prompts, ranked by impact (correctness, cost,
  performance, memory).
- SDK capabilities the integration plausibly should adopt but does not
  (from the catalog).
- SDK version reviewed, and any ★ experimental APIs relied upon.
```

---

### Reporting

For each prompt, record: the prompt ID, the number of findings, the finding table, and any false positives (report these to Mapbox if you want to help improve the audit). Sections **SEARCH-B-REQUEST**, **SEARCH-B-ENGINE**, and **SEARCH-B-MIGRATE** are the highest priority, because they affect correctness, request cost, and the backend the integration depends on.
