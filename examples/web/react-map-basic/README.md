# React Map Basic Example

A basic React application demonstrating proper Mapbox GL JS integration following the **mapbox-web-integration-patterns** skill.

## Patterns Demonstrated

✅ **Proper lifecycle management** - Map initialization and cleanup
✅ **Token management** - Using environment variables securely
✅ **Memory leak prevention** - Cleanup function in useEffect
✅ **React patterns** - useRef for map instance and container

## What This Example Shows

This example demonstrates the **fundamental pattern** for integrating Mapbox GL JS in a React application:

- Map initialization in `useEffect` with empty dependency array
- Using `useRef` for both map instance and container element
- Proper cleanup to prevent memory leaks
- Token management via environment variables

## Prerequisites

- Node.js 18 or higher
- A Mapbox access token ([get one free](https://account.mapbox.com/access-tokens/))

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create `.env.local` file:**

   ```bash
   VITE_MAPBOX_ACCESS_TOKEN=pk.your_token_here
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:5173
   ```

## Project Structure

```
react-map-basic/
├── src/
│   ├── App.jsx           # Main app component
│   ├── MapComponent.jsx  # Map component following skill patterns
│   └── main.jsx          # App entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Key Implementation Details

### MapComponent.jsx

This is the core pattern from **mapbox-web-integration-patterns**:

```jsx
import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function MapComponent() {
  // Two refs: one for map instance, one for container DOM element
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    // Set access token
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: [-122.4194, 37.7749],
      zoom: 12
    });

    // CRITICAL: Cleanup function prevents memory leaks
    return () => {
      mapRef.current.remove();
    };
  }, []); // Empty deps = runs once on mount

  return <div ref={mapContainerRef} style={{ height: '100vh' }} />;
}
```

### Why This Pattern?

❌ **Common mistakes avoided:**

- Initializing map in render (causes infinite loops)
- Not cleaning up map instance (memory leaks)
- Missing cleanup function (crashes on unmount)
- Reinitializing on every render

✅ **Best practices:**

- Initialize in useEffect with empty deps
- Store map instance in ref (persists across renders)
- Store container element in ref (direct DOM access)
- Always return cleanup function

## Common Modifications

### Adding Markers

```jsx
useEffect(() => {
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  mapRef.current = new mapboxgl.Map({
    container: mapContainerRef.current,
    center: [-122.4194, 37.7749],
    zoom: 12
  });

  // Add marker after map loads
  mapRef.current.on('load', () => {
    new mapboxgl.Marker()
      .setLngLat([-122.4194, 37.7749])
      .setPopup(new mapboxgl.Popup().setHTML('<h3>San Francisco</h3>'))
      .addTo(mapRef.current);
  });

  return () => {
    mapRef.current.remove();
  };
}, []);
```

### Adding Navigation Controls

```jsx
import mapboxgl from 'mapbox-gl';

mapRef.current = new mapboxgl.Map({
  container: mapContainerRef.current,
  center: [-122.4194, 37.7749],
  zoom: 12
});

// Add navigation controls
mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
```

### Custom Style

```jsx
mapRef.current = new mapboxgl.Map({
  container: mapContainerRef.current,
  style: 'mapbox://styles/mapbox/dark-v11', // Use dark style
  center: [-122.4194, 37.7749],
  zoom: 12
});
```

## Skills Reference

This example follows patterns from:

- **mapbox-web-integration-patterns** - React integration best practices
- **mapbox-token-security** - Environment variable token management

## Next Steps

Once you have this basic pattern working, explore:

- [Performance Optimized](../performance-optimized/) - Advanced performance patterns
- **mapbox-web-performance-patterns** skill - Optimization guidance

## Troubleshooting

**Map not showing?**

- Check that `VITE_MAPBOX_ACCESS_TOKEN` is set in `.env.local`
- Verify token has `styles:tiles` scope
- Check browser console for errors

**Memory issues?**

- Ensure cleanup function is present: `return () => { mapRef.current.remove(); }`
- Don't create new Map instances on every render

**Type errors?**

- Install TypeScript types: `npm install -D @types/mapbox-gl`
