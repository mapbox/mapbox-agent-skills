# iOS: Search SDK for iOS

## Option 1: Search SDK with UI (Easiest)

**When to use:** iOS app, want pre-built search UI, fastest implementation

**Installation:**

```swift
// Add to Package.swift or SPM
dependencies: [
    .package(url: "https://github.com/mapbox/mapbox-search-ios.git", from: "2.0.0")
]
```

**Complete implementation with built-in UI:**

```swift
import MapboxSearch
import MapboxMaps

class SearchViewController: UIViewController {
    private var searchController: MapboxSearchController!
    private var mapView: MapView!

    override func viewDidLoad() {
        super.viewDidLoad()

        setupMap()
        setupSearchWithUI()
    }

    func setupMap() {
        mapView = MapView(frame: view.bounds)
        view.addSubview(mapView)
    }

    func setupSearchWithUI() {
        // MapboxSearchController provides complete UI automatically
        searchController = MapboxSearchController()
        searchController.delegate = self

        // Present the search UI
        present(searchController, animated: true)
    }
}

extension SearchViewController: SearchControllerDelegate {
    func searchResultSelected(_ searchResult: SearchResult) {
        // SDK handled all the search interaction
        // Just respond to selection

        mapView.camera.fly(to: CameraOptions(
            center: searchResult.coordinate,
            zoom: 15
        ))

        let annotation = PointAnnotation(coordinate: searchResult.coordinate)
        mapView.annotations.pointAnnotations = [annotation]

        dismiss(animated: true)
    }
}
```

## Option 2: Search SDK Core (Custom UI)

**When to use:** Need custom UI, integrate with UISearchController, full control over UX

**Complete implementation:**

```swift
import MapboxSearch
import MapboxMaps

class SearchViewController: UIViewController {
    private var searchEngine: SearchEngine!
    private var mapView: MapView!

    override func viewDidLoad() {
        super.viewDidLoad()

        // Initialize Search Engine (SDK handles debouncing and session tokens)
        searchEngine = SearchEngine(accessToken: "YOUR_MAPBOX_TOKEN")

        setupSearchBar()
        setupMap()
    }

    func setupSearchBar() {
        let searchController = UISearchController(searchResultsController: nil)
        searchController.searchResultsUpdater = self
        searchController.obscuresBackgroundDuringPresentation = false
        navigationItem.searchController = searchController
    }

    func setupMap() {
        mapView = MapView(frame: view.bounds)
        view.addSubview(mapView)
    }
}

extension SearchViewController: UISearchResultsUpdating {
    func updateSearchResults(for searchController: UISearchController) {
        guard let query = searchController.searchBar.text, !query.isEmpty else {
            return
        }

        // Search SDK handles debouncing automatically
        searchEngine.search(query: query) { [weak self] result in
            switch result {
            case .success(let results):
                self?.displayResults(results)
            case .failure(let error):
                print("Search error: \(error)")
            }
        }
    }

    func displayResults(_ results: [SearchResult]) {
        // Display results in custom table view
        // When user selects a result:
        handleResultSelection(results[0])
    }

    func handleResultSelection(_ result: SearchResult) {
        mapView.camera.fly(to: CameraOptions(
            center: result.coordinate,
            zoom: 15
        ))

        let annotation = PointAnnotation(coordinate: result.coordinate)
        mapView.annotations.pointAnnotations = [annotation]
    }
}
```

## Option 3: Direct API Integration (Advanced)

**When to use:** Very specific requirements, server-side iOS backend

**Important:** Only use if SDK doesn't meet your needs. You must handle debouncing and session tokens manually.

```swift
// Direct API calls - see Web direct API example
// Not recommended for iOS - use Search SDK instead
```
