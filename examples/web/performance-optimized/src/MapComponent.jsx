/**
 * Performance-Optimized MapComponent
 *
 * Demonstrates advanced patterns from mapbox-web-performance-patterns:
 * ✅ Parallel data loading (eliminates waterfalls)
 * ✅ Marker clustering (handles 5,000+ markers)
 * ✅ Event throttling (smooth 60 FPS)
 * ✅ Performance monitoring
 */

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { throttle } from 'lodash';
import 'mapbox-gl/dist/mapbox-gl.css';
import { generateRestaurants } from './data/generateRestaurants';

function MapComponent() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [stats, setStats] = useState({
    loadTime: 0,
    markerCount: 0,
    visibleClusters: 0
  });

  useEffect(() => {
    const startTime = performance.now();

    // ✅ CRITICAL: Start data fetch immediately (parallel loading)
    // This eliminates the initialization waterfall
    const restaurantsPromise = Promise.resolve(generateRestaurants(5000));

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-122.4194, 37.7749],
      zoom: 11
    });

    const map = mapRef.current;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', async () => {
      // Data is already loading! No waterfall.
      const restaurants = await restaurantsPromise;

      // Add clustered restaurant source
      map.addSource('restaurants', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: restaurants
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Cluster circles - size and color by count
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'restaurants',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ]
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
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      // Individual unclustered points
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'restaurants',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#FF6B35',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Click handler for clusters - zoom in
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('restaurants').getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return;
            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            });
          }
        );
      });

      // Click handler for individual points - show popup
      map.on('click', 'unclustered-point', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { name, cuisine } = e.features[0].properties;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`<strong>${name}</strong><br/>${cuisine}`)
          .addTo(map);
      });

      // Change cursor on hover
      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
      });

      // Update stats
      setStats(prev => ({
        ...prev,
        markerCount: restaurants.length,
        loadTime: Math.round(performance.now() - startTime)
      }));
    });

    // ✅ Throttle move event to 100ms (10 updates/second max)
    // Prevents performance degradation during pan/zoom
    const updateVisibleClusters = throttle(() => {
      if (!map.isStyleLoaded()) return;

      const features = map.queryRenderedFeatures({ layers: ['clusters', 'unclustered-point'] });
      setStats(prev => ({
        ...prev,
        visibleClusters: features.length
      }));
    }, 100);

    map.on('move', updateVisibleClusters);
    map.on('idle', updateVisibleClusters);

    return () => {
      map.off('move', updateVisibleClusters);
      map.remove();
    };
  }, []);

  return (
    <>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '10px',
          background: 'white',
          padding: '12px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '13px',
          fontFamily: 'monospace',
          zIndex: 1
        }}
      >
        <div><strong>Performance Stats</strong></div>
        <div>Load time: {stats.loadTime}ms</div>
        <div>Total markers: {stats.markerCount.toLocaleString()}</div>
        <div>Visible: {stats.visibleClusters}</div>
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>
          ✅ Clustering enabled<br/>
          ✅ Events throttled<br/>
          ✅ Parallel loading
        </div>
      </div>
    </>
  );
}

export default MapComponent;
