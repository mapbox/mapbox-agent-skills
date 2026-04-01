# Web Components (Framework-Agnostic)

Web Components are a W3C standard for creating reusable custom elements that work in any framework or no framework at all.

**When to use Web Components:**

- ✅ **Vanilla JavaScript apps** - No framework? Web Components are a great choice
- ✅ **Design systems** - Building component libraries used across multiple frameworks
- ✅ **Micro-frontends** - Application uses different frameworks in different parts
- ✅ **Multi-framework organizations** - Teams working with React, Vue, Svelte, etc. need shared components
- ✅ **Framework migration** - Transitioning from one framework to another incrementally
- ✅ **Long-term stability** - W3C standard, no framework lock-in

**When to use framework-specific patterns instead:**

- 🔧 **Already using a framework** - If you're building in React, use React patterns (simpler, better integration)
- 🔧 **Need framework features** - Deep integration with React hooks, Vue Composition API, state management, routing
- 🔧 **Team familiarity** - Team is proficient with framework patterns

> **💡 Tip:** If you're using React, Vue, Svelte, or Angular, start with the framework-specific patterns. They're simpler and better integrated. Use Web Components when you need cross-framework compatibility or are building vanilla JavaScript apps.

**Real-world example:** A company with React (main app), Vue (admin panel), and Svelte (marketing site) can build one `<mapbox-map>` component that works everywhere.

## Basic Web Component

```javascript
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

class MapboxMap extends HTMLElement {
  constructor() {
    super();
    this.map = null;
  }

  connectedCallback() {
    // Get configuration from attributes
    const token = this.getAttribute('access-token') || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const mapStyle = this.getAttribute('map-style') || 'mapbox://styles/mapbox/standard';
    const center = this.getAttribute('center')?.split(',').map(Number) || [-71.05953, 42.3629];
    const zoom = parseFloat(this.getAttribute('zoom')) || 13;

    // Initialize map
    mapboxgl.accessToken = token;

    this.map = new mapboxgl.Map({
      container: this,
      style: mapStyle,
      center: center,
      zoom: zoom
    });

    // Dispatch custom event when map loads
    this.map.on('load', () => {
      this.dispatchEvent(
        new CustomEvent('mapload', {
          detail: { map: this.map }
        })
      );
    });
  }

  // CRITICAL: Clean up when element is removed
  disconnectedCallback() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // Expose map instance to JavaScript
  getMap() {
    return this.map;
  }
}

// Register the custom element
customElements.define('mapbox-map', MapboxMap);
```

**Usage in HTML:**

```html
<!-- Basic usage -->
<mapbox-map
  access-token="pk.YOUR_TOKEN"
  map-style="mapbox://styles/mapbox/dark-v11"
  center="-122.4194,37.7749"
  zoom="12"
></mapbox-map>

<style>
  mapbox-map {
    display: block;
    height: 100vh;
    width: 100%;
  }
</style>
```

**Usage in React:**

```jsx
import './mapbox-map-component';
function App() {
  const mapRef = useRef(null);

  useEffect(() => {
    const handleMapLoad = (e) => {
      const map = e.detail.map;
      // Add markers, layers, etc.
      new mapboxgl.Marker().setLngLat([-122.4194, 37.7749]).addTo(map);
    };

    mapRef.current?.addEventListener('mapload', handleMapLoad);

    return () => {
      mapRef.current?.removeEventListener('mapload', handleMapLoad);
    };
  }, []);

  return (
    <mapbox-map
      ref={mapRef}
      access-token={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
      map-style="mapbox://styles/mapbox/standard"
      center="-122.4194,37.7749"
      zoom="12"
    />
  );
}
```

**Usage in Vue:**

Import the component file, then use directly in template. Vue supports custom events natively via `@mapload`:

```vue
<template>
  <mapbox-map
    ref="map"
    :access-token="token"
    map-style="mapbox://styles/mapbox/streets-v12"
    center="-71.05953,42.3629"
    zoom="13"
    @mapload="handleMapLoad"
  />
</template>
<script>
import './mapbox-map-component';
export default {
  data: () => ({ token: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN }),
  methods: {
    handleMapLoad(e) {
      const map = e.detail.map; /* interact */
    }
  }
};
</script>
```

**Usage in Svelte:**

Use `bind:this` for element ref and `on:mapload` for custom events:

```svelte
<script>
  import './mapbox-map-component';
  let mapElement;
  function handleMapLoad(e) { const map = e.detail.map; /* interact */ }
</script>
<mapbox-map bind:this={mapElement} access-token={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
  map-style="mapbox://styles/mapbox/standard" center="-71.05953,42.3629" zoom="13"
  on:mapload={handleMapLoad} />
```

## Advanced: Reactive Attributes Pattern

```javascript
class MapboxMapReactive extends HTMLElement {
  static get observedAttributes() {
    return ['center', 'zoom', 'map-style'];
  }

  constructor() {
    super();
    this.map = null;
  }

  connectedCallback() {
    mapboxgl.accessToken = this.getAttribute('access-token');

    this.map = new mapboxgl.Map({
      container: this,
      style: this.getAttribute('map-style') || 'mapbox://styles/mapbox/standard',
      center: this.getAttribute('center')?.split(',').map(Number) || [0, 0],
      zoom: parseFloat(this.getAttribute('zoom')) || 9
    });
  }

  disconnectedCallback() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // React to attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.map || oldValue === newValue) return;

    switch (name) {
      case 'center':
        const center = newValue.split(',').map(Number);
        this.map.setCenter(center);
        break;
      case 'zoom':
        this.map.setZoom(parseFloat(newValue));
        break;
      case 'map-style':
        this.map.setStyle(newValue);
        break;
    }
  }
}

customElements.define('mapbox-map-reactive', MapboxMapReactive);
```

**Key points:** Use `connectedCallback()` for init, **always implement `disconnectedCallback()`** with `map.remove()`, read config from HTML attributes, dispatch custom events (`mapload`), use `observedAttributes` + `attributeChangedCallback` for reactive updates. Works in any framework.
