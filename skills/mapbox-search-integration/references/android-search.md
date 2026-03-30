# Android: Search SDK for Android

## Option 1: Search SDK with UI (Easiest)

**When to use:** Android app, want pre-built search UI, fastest implementation

**Installation:**

```gradle
// Add to build.gradle
dependencies {
    implementation 'com.mapbox.search:mapbox-search-android-ui:2.0.0'
    implementation 'com.mapbox.maps:android:11.0.0'
}
```

**Complete implementation with built-in UI:**

```kotlin
import com.mapbox.search.ui.view.SearchBottomSheetView
import com.mapbox.maps.MapView

class SearchActivity : AppCompatActivity() {
    private lateinit var searchView: SearchBottomSheetView
    private lateinit var mapView: MapView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_search)

        mapView = findViewById(R.id.map_view)

        // SearchBottomSheetView provides complete UI automatically
        searchView = findViewById(R.id.search_view)
        searchView.initializeSearch(
            savedInstanceState,
            SearchBottomSheetView.Configuration()
        )

        // Handle result selection
        searchView.addOnSearchResultClickListener { searchResult ->
            // SDK handled all the search interaction
            val coordinate = searchResult.coordinate

            mapView.getMapboxMap().flyTo(
                CameraOptions.Builder()
                    .center(Point.fromLngLat(coordinate.longitude, coordinate.latitude))
                    .zoom(15.0)
                    .build()
            )

            searchView.hide()
        }
    }
}
```

## Option 2: Search SDK Core (Custom UI)

**When to use:** Need custom UI, integrate with SearchView, full control over UX

**Complete implementation:**

```kotlin
import com.mapbox.search.SearchEngine
import com.mapbox.search.SearchEngineSettings
import com.mapbox.search.SearchOptions
import com.mapbox.maps.MapView

class SearchActivity : AppCompatActivity() {
    private lateinit var searchEngine: SearchEngine
    private lateinit var mapView: MapView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Search Engine (SDK handles debouncing and session tokens)
        searchEngine = SearchEngine.createSearchEngine(
            SearchEngineSettings("YOUR_MAPBOX_TOKEN")
        )

        setupSearchView()
        setupMap()
    }

    private fun setupSearchView() {
        val searchView = findViewById<SearchView>(R.id.search_view)

        searchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextSubmit(query: String): Boolean {
                performSearch(query)
                return true
            }

            override fun onQueryTextChange(newText: String): Boolean {
                if (newText.length >= 2) {
                    // Search SDK handles debouncing automatically
                    performSearch(newText)
                }
                return true
            }
        })
    }

    private fun performSearch(query: String) {
        val options = SearchOptions(
            countries = listOf("US"),
            limit = 5
        )

        searchEngine.search(query, options) { results ->
            results.onSuccess { searchResults ->
                displayResults(searchResults)
            }.onFailure { error ->
                Log.e("Search", "Error: $error")
            }
        }
    }

    private fun displayResults(results: List<SearchResult>) {
        // Display in custom RecyclerView
        handleResultSelection(results[0])
    }

    private fun handleResultSelection(result: SearchResult) {
        val coordinate = result.coordinate

        mapView.getMapboxMap().flyTo(
            CameraOptions.Builder()
                .center(Point.fromLngLat(coordinate.longitude, coordinate.latitude))
                .zoom(15.0)
                .build()
        )
    }
}
```

## Option 3: Direct API Integration (Advanced)

**When to use:** Very specific requirements, server-side Android backend

**Important:** Only use if SDK doesn't meet your needs. You must handle debouncing and session tokens manually.

```kotlin
// Direct API calls - see Web direct API example
// Not recommended for Android - use Search SDK instead
```
