# Performance, Best Practices & Accessibility

## Performance Optimization

### Debounced Search

```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedFilter = debounce(filterStores, 300);

document.getElementById('search-input').addEventListener('input', (e) => {
  debouncedFilter(e.target.value);
});
```

## Best Practices

### Data Management

```javascript
// GOOD: Load data once, filter in memory
const allStores = await fetch('/api/stores').then((r) => r.json());

function filterStores(criteria) {
  return {
    type: 'FeatureCollection',
    features: allStores.features.filter(criteria)
  };
}

// BAD: Fetch on every filter
async function filterStores(criteria) {
  return await fetch(`/api/stores?filter=${criteria}`).then((r) => r.json());
}
```

### Error Handling

```javascript
// Geolocation error handling
navigator.geolocation.getCurrentPosition(
  successCallback,
  (error) => {
    let message = 'Unable to get your location.';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Please enable location access to see nearby stores.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information is unavailable.';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out.';
        break;
    }

    showNotification(message);
  },
  {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  }
);

// API error handling
async function loadStores() {
  try {
    const response = await fetch('/api/stores');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load stores:', error);
    showNotification('Unable to load store locations. Please try again.');
    return { type: 'FeatureCollection', features: [] };
  }
}
```

## Accessibility

```javascript
// Add ARIA labels
document.getElementById('search-input').setAttribute('aria-label', 'Search stores');

// Keyboard navigation
document.querySelectorAll('.listing').forEach((listing, index) => {
  listing.setAttribute('tabindex', '0');
  listing.setAttribute('role', 'button');
  listing.setAttribute('aria-label', `View ${listing.querySelector('.title').textContent}`);

  listing.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      listing.click();
    }
  });
});

// Focus management
function highlightListing(id) {
  const listing = document.getElementById(`listing-${id}`);
  listing.classList.add('active');
  listing.focus();
  listing.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
```
