/**
 * MapComponent - Basic Mapbox GL JS integration in React
 *
 * This component demonstrates the fundamental pattern from the
 * mapbox-web-integration-patterns skill:
 *
 * ✅ useRef for map instance (persists across renders)
 * ✅ useRef for container element (direct DOM access)
 * ✅ useEffect with empty deps (initialize once on mount)
 * ✅ Cleanup function (prevent memory leaks)
 * ✅ Environment variable token management
 */

import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function MapComponent() {
  // Store map instance - persists across re-renders
  const mapRef = useRef(null);

  // Store container DOM element reference
  const mapContainerRef = useRef(null);

  useEffect(() => {
    // Set access token from environment variable
    // Following mapbox-token-security skill - never hardcode tokens!
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    // Initialize map
    // IMPORTANT: This runs only once due to empty dependency array []
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-122.4194, 37.7749], // San Francisco
      zoom: 12
    });

    // Optional: Add marker when map loads
    mapRef.current.on('load', () => {
      // Add a simple marker
      new mapboxgl.Marker()
        .setLngLat([-122.4194, 37.7749])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML('<h3>San Francisco</h3><p>Welcome to SF!</p>')
        )
        .addTo(mapRef.current);

      // Add navigation controls
      mapRef.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      console.log('Map loaded successfully!');
    });

    // CRITICAL: Cleanup function to prevent memory leaks
    // This runs when component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        console.log('Map cleaned up');
      }
    };
  }, []); // Empty dependency array = runs once on mount

  // NEVER initialize map here in render!
  // That would cause infinite loops and performance issues

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100vh'
      }}
    />
  );
}

export default MapComponent;
