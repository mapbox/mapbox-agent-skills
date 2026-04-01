# Search & Filter

**Text Search:**

```javascript
function filterStores(searchTerm) {
  const filtered = {
    type: 'FeatureCollection',
    features: stores.features.filter((store) => {
      const name = store.properties.name.toLowerCase();
      const address = store.properties.address.toLowerCase();
      const search = searchTerm.toLowerCase();

      return name.includes(search) || address.includes(search);
    })
  };

  // Update map source
  if (map.getSource('stores')) {
    map.getSource('stores').setData(filtered);
  }

  // Rebuild listing
  document.getElementById('listings').innerHTML = '';
  buildLocationList(filtered);

  // Fit map to filtered results
  if (filtered.features.length > 0) {
    const bounds = new mapboxgl.LngLatBounds();
    filtered.features.forEach((feature) => {
      bounds.extend(feature.geometry.coordinates);
    });
    map.fitBounds(bounds, { padding: 50 });
  }
}

// Add search input handler
document.getElementById('search-input').addEventListener('input', (e) => {
  filterStores(e.target.value);
});
```

**Category Filter:**

```javascript
function filterByCategory(category) {
  const filtered =
    category === 'all'
      ? stores
      : {
          type: 'FeatureCollection',
          features: stores.features.filter((store) => store.properties.category === category)
        };

  // Update map and list
  if (map.getSource('stores')) {
    map.getSource('stores').setData(filtered);
  }

  document.getElementById('listings').innerHTML = '';
  buildLocationList(filtered);
}

// Category dropdown
document.getElementById('category-select').addEventListener('change', (e) => {
  filterByCategory(e.target.value);
});
```
