# Conversation Example: Web Performance Optimization

This conversation demonstrates how the **mapbox-web-performance-patterns** skill helps optimize a slow map with thousands of markers.

## Skills Used

- 🔧 **mapbox-web-performance-patterns** - Provides marker performance thresholds and clustering patterns
- 📐 **mapbox-style-patterns** - Suggests appropriate visualization approach

---

## Conversation

### User

> I have a Mapbox map showing 5,000 restaurant locations and it's really slow. The markers take forever to load and the map is janky when I pan around. How do I fix this?

### AI Assistant

I can help optimize your map performance. Based on the **mapbox-web-performance-patterns** skill, 5,000 markers falls into a critical performance range that requires specific optimization.

**Performance Threshold Analysis:**

- **< 500 markers**: HTML markers (Marker class) - OK
- **500-100,000 markers**: Symbol layers or clustering - **← You are here**
- **100,000-250,000 markers**: Clustering required
- **> 250,000 markers**: Server-side clustering

For 5,000 markers, you have two good options:

#### Option 1: Switch to Symbol Layers (Recommended for static markers)

Symbol layers use Canvas rendering which is much faster than HTML markers:

```javascript
// ❌ BAD: HTML markers (current approach)
restaurants.forEach((restaurant) => {
  new mapboxgl.Marker().setLngLat([restaurant.lng, restaurant.lat]).addTo(map);
});

// ✅ GOOD: Symbol layer with GeoJSON
map.addSource('restaurants', {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: restaurants.map((r) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [r.lng, r.lat]
      },
      properties: {
        name: r.name,
        cuisine: r.cuisine
      }
    }))
  }
});

map.addLayer({
  id: 'restaurants',
  type: 'symbol',
  source: 'restaurants',
  layout: {
    'icon-image': 'restaurant-15',
    'icon-allow-overlap': false,
    'text-field': ['get', 'name'],
    'text-offset': [0, 1.5],
    'text-size': 11
  }
});
```

**Performance improvement**: 10-20x faster rendering

#### Option 2: Add Clustering (Recommended for interactive maps)

If users need to see density and drill down:

```javascript
map.addSource('restaurants', {
  type: 'geojson',
  data: restaurantsGeoJSON,
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50
});

// Cluster circles
map.addLayer({
  id: 'clusters',
  type: 'circle',
  source: 'restaurants',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
  }
});

// Cluster count labels
map.addLayer({
  id: 'cluster-count',
  type: 'symbol',
  source: 'restaurants',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-size': 12
  }
});

// Individual points
map.addLayer({
  id: 'unclustered-point',
  type: 'circle',
  source: 'restaurants',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#11b4da',
    'circle-radius': 8
  }
});
```

**Performance improvement**: Reduces visible markers from 5,000 to typically 50-200 depending on zoom level

#### Additional Optimizations

From the performance skill, I'd also recommend:

**1. Parallel Data Loading** (eliminate waterfalls):

```javascript
// ✅ Start data fetch immediately, don't wait for map
const restaurantsPromise = fetch('/api/restaurants').then((r) => r.json());

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12'
});

map.on('load', async () => {
  const restaurants = await restaurantsPromise; // Already loading!
  // Add source and layers...
});
```

**2. Event Throttling** (reduce jank during pan):

```javascript
import { throttle } from 'lodash';

// ❌ BAD: Fires hundreds of times per second
map.on('move', () => {
  updateVisibleRestaurants();
});

// ✅ GOOD: Fires at most 10 times per second
map.on(
  'move',
  throttle(() => {
    updateVisibleRestaurants();
  }, 100)
);
```

**Expected Results:**

- Initial load time: 2-5 seconds → **< 1 second**
- Time to interactive: 5+ seconds → **< 2 seconds**
- FPS during pan: 15-30 → **50-60 FPS**

Which approach fits your use case better - static symbol layers or interactive clustering?

---

## Skills Application Analysis

### How the skill helped:

1. **Provided specific thresholds** - AI knew exactly when clustering becomes necessary (500-100,000 markers)
2. **Offered appropriate solutions** - Suggested both symbol layers and clustering based on marker count
3. **Included code examples** - Provided before/after patterns showing both anti-patterns and solutions
4. **Quantified improvements** - Gave concrete performance metrics (10-20x faster, FPS improvements)
5. **Suggested additional optimizations** - Recommended parallel loading and event throttling from the performance skill

### Without the skill:

An AI assistant without the skill might:

- Suggest generic "try clustering" without specific thresholds
- Not know when symbol layers vs clustering is appropriate
- Miss critical optimizations like parallel data loading
- Provide vague advice without concrete code examples
- Not quantify expected performance improvements

### Result:

The skill-enhanced AI provided a comprehensive, prioritized optimization strategy with concrete implementation patterns and measurable outcomes.
