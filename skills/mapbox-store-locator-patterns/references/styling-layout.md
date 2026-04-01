# Styling & Layout

## Layout Structure

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Store Locator</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" rel="stylesheet" />
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Arial', sans-serif;
      }

      #app {
        display: flex;
        height: 100vh;
      }

      /* Sidebar */
      .sidebar {
        width: 400px;
        height: 100vh;
        overflow-y: scroll;
        background-color: #fff;
        border-right: 1px solid #ddd;
      }

      .sidebar-header {
        padding: 20px;
        background-color: #f8f9fa;
        border-bottom: 1px solid #ddd;
      }

      .sidebar-header h1 {
        margin: 0 0 10px 0;
        font-size: 24px;
      }

      /* Search */
      .search-box {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }

      .filter-group {
        margin-top: 10px;
      }

      .filter-group select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }

      /* Listings */
      #listings {
        padding: 0;
      }

      .listing {
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .listing:hover {
        background-color: #f8f9fa;
      }

      .listing.active {
        background-color: #e3f2fd;
        border-left: 3px solid #2196f3;
      }

      .listing .title {
        display: block;
        color: #333;
        font-weight: bold;
        font-size: 16px;
        text-decoration: none;
        margin-bottom: 5px;
      }

      .listing .title:hover {
        color: #2196f3;
      }

      .listing p {
        margin: 5px 0;
        font-size: 14px;
        color: #666;
      }

      .listing .distance {
        color: #2196f3;
        font-weight: bold;
      }

      /* Map */
      #map {
        flex: 1;
        height: 100vh;
      }

      /* Popups */
      .mapboxgl-popup-content {
        padding: 15px;
        font-family: 'Arial', sans-serif;
      }

      .mapboxgl-popup-content h3 {
        margin: 0 0 10px 0;
        font-size: 18px;
      }

      .mapboxgl-popup-content p {
        margin: 5px 0;
        font-size: 14px;
      }

      .mapboxgl-popup-content button {
        margin-top: 10px;
        padding: 8px 16px;
        background-color: #2196f3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }

      .mapboxgl-popup-content button:hover {
        background-color: #1976d2;
      }

      /* Responsive */
      @media (max-width: 768px) {
        #app {
          flex-direction: column;
        }

        .sidebar {
          width: 100%;
          height: 50vh;
        }

        #map {
          height: 50vh;
        }
      }
    </style>
  </head>
  <body>
    <div id="app">
      <div class="sidebar">
        <div class="sidebar-header">
          <h1>Store Locator</h1>
          <input type="text" id="search-input" class="search-box" placeholder="Search by name or address..." />
          <div class="filter-group">
            <select id="category-select">
              <option value="all">All Categories</option>
              <option value="retail">Retail</option>
              <option value="restaurant">Restaurant</option>
              <option value="office">Office</option>
            </select>
          </div>
        </div>
        <div id="listings"></div>
      </div>
      <div id="map"></div>
    </div>

    <script src="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js"></script>
    <script src="app.js"></script>
  </body>
</html>
```

## Custom Marker Styling

```css
/* Custom marker styles */
.marker {
  background-size: cover;
  width: 30px;
  height: 40px;
  cursor: pointer;
  transition: transform 0.2s;
}

.marker:hover {
  transform: scale(1.1);
}

/* Category-specific marker colors */
.marker.retail {
  background-color: #2196f3;
}

.marker.restaurant {
  background-color: #f44336;
}

.marker.office {
  background-color: #4caf50;
}
```
