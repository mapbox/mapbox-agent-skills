---
name: mapbox-web-integration-patterns
description: Official integration patterns for Mapbox GL JS across popular web frameworks (React, Vue, Svelte, Angular). Covers setup, lifecycle management, token handling, search integration, and common pitfalls. Based on Mapbox's create-web-app scaffolding tool.
---

# Mapbox Integration Patterns Skill

This skill provides official patterns for integrating Mapbox GL JS into web applications using React, Vue, Svelte, Angular, and vanilla JavaScript. These patterns are based on Mapbox's `create-web-app` scaffolding tool and represent production-ready best practices.

## Version Requirements

### Mapbox GL JS

**Recommended:** v3.x (latest)

- **Minimum:** v3.0.0
- **Why v3.x:** Modern API, improved performance, active development
- **v2.x:** Still supported but deprecated patterns (see migration notes below)

**Installing via npm (recommended for production):**

```bash
npm install mapbox-gl@^3.0.0    # Installs latest v3.x
```

**CDN (for prototyping only):**

```html
<!-- Replace VERSION with latest v3.x from https://docs.mapbox.com/mapbox-gl-js/ -->
<script src="https://api.mapbox.com/mapbox-gl-js/vVERSION/mapbox-gl.js"></script>
<link href="https://api.mapbox.com/mapbox-gl-js/vVERSION/mapbox-gl.css" rel="stylesheet" />
```

⚠️ **Production apps should use npm, not CDN** - ensures consistent versions and offline builds.

### Framework Requirements

**React:**

- Minimum: 19+ (current implementation in create-web-app)
- Recommended: Latest 19.x

**Vue:**

- Minimum: 3.x (Composition API recommended)
- Vue 2.x: Use Options API pattern (mounted/unmounted hooks)

**Svelte:**

- Minimum: 5+ (current implementation in create-web-app)
- Recommended: Latest 5.x

**Angular:**

- Minimum: 19+ (current implementation in create-web-app)
- Recommended: Latest 19.x

**Next.js:**

- Minimum: 13.x (App Router)
- Pages Router: 12.x+

### Mapbox Search JS

**Required for search integration:**

```bash
npm install @mapbox/search-js-react@^1.0.0      # React
npm install @mapbox/search-js-web@^1.0.0        # Other frameworks
```

### Version Migration Notes

**Migrating from v2.x to v3.x:**

- `accessToken` can now be passed to Map constructor (preferred)
- Improved TypeScript types
- Better tree-shaking support
- No breaking changes to core initialization patterns

**Example:**

```javascript
const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN; // Use env vars in production

// v2.x pattern (still works in v3.x)
mapboxgl.accessToken = token;
const map = new mapboxgl.Map({ container: '...' });

// v3.x pattern (preferred)
const map = new mapboxgl.Map({
  accessToken: token,
  container: '...'
});
```

## Core Principles

**Every Mapbox GL JS integration must:**

1. Initialize the map in the correct lifecycle hook
2. Store map instance in component state (not recreate on every render)
3. **Always call `map.remove()` on cleanup** to prevent memory leaks
4. Handle token management securely (environment variables)
5. Import CSS: `import 'mapbox-gl/dist/mapbox-gl.css'`

## Framework-Specific Patterns

### React Integration

**Pattern: useRef + useEffect with cleanup**

> **Note:** These examples use **Vite** (the bundler used in `create-web-app`). If using Create React App, replace `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN` with `process.env.REACT_APP_MAPBOX_TOKEN`. See the [Token Management Patterns](#token-management-patterns) section for other bundlers.

```jsx
import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function MapComponent() {
  const mapRef = useRef(null); // Store map instance
  const mapContainerRef = useRef(null); // Store DOM reference

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: [-71.05953, 42.3629],
      zoom: 13
    });

    // CRITICAL: Cleanup to prevent memory leaks
    return () => {
      mapRef.current.remove();
    };
  }, []); // Empty dependency array = run once on mount

  return <div ref={mapContainerRef} style={{ height: '100vh' }} />;
}
```

**Key points:**

- Use `useRef` for both map instance and container
- Initialize in `useEffect` with empty deps `[]`
- **Always return cleanup function** that calls `map.remove()`
- Never initialize map in render (causes infinite loops)

**React + Search JS:**

```jsx
import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { SearchBox } from '@mapbox/search-js-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const center = [-71.05953, 42.3629];

function MapWithSearch() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    mapboxgl.accessToken = accessToken;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: center,
      zoom: 13
    });

    return () => {
      mapRef.current.remove();
    };
  }, []);

  return (
    <>
      <div
        style={{
          margin: '10px 10px 0 0',
          width: 300,
          right: 0,
          top: 0,
          position: 'absolute',
          zIndex: 10
        }}
      >
        <SearchBox
          accessToken={accessToken}
          map={mapRef.current}
          mapboxgl={mapboxgl}
          value={inputValue}
          proximity={center}
          onChange={(d) => setInputValue(d)}
          marker
        />
      </div>
      <div ref={mapContainerRef} style={{ height: '100vh' }} />
    </>
  );
}
```

---

### Vue Integration

**Pattern: mounted + unmounted lifecycle hooks**

```vue
<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script>
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default {
  mounted() {
    const map = new mapboxgl.Map({
      container: this.$refs.mapContainer,
      style: 'mapbox://styles/mapbox/standard',
      center: [-71.05953, 42.3629],
      zoom: 13
    });

    // Assign map instance to component property
    this.map = map;
  },

  // CRITICAL: Clean up when component is unmounted
  unmounted() {
    this.map.remove();
    this.map = null;
  }
};
</script>

<style>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
```

**Key points:**

- Initialize in `mounted()` hook
- Access container via `this.$refs.mapContainer`
- Store map as `this.map`
- **Always implement `unmounted()` hook** to call `map.remove()`

---

### Svelte Integration

**Pattern: onMount + onDestroy**

```svelte
<script>
  import { Map } from 'mapbox-gl'
  import 'mapbox-gl/dist/mapbox-gl.css'
  import { onMount, onDestroy } from 'svelte'

  let map
  let mapContainer

  onMount(() => {
    map = new Map({
      container: mapContainer,
      accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
      center: [-71.05953, 42.36290],
      zoom: 13
    })
  })

  // CRITICAL: Clean up on component destroy
  onDestroy(() => {
    map.remove()
  })
</script>

<div class="map" bind:this={mapContainer}></div>

<style>
  .map {
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>
```

**Key points:**

- Use `onMount` for initialization
- Bind container with `bind:this={mapContainer}`
- **Always implement `onDestroy`** to call `map.remove()`
- Can pass `accessToken` directly to Map constructor in Svelte

---

### Angular Integration

**Pattern: ngOnInit + ngOnDestroy with SSR handling**

```typescript
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: false })
  mapContainer!: ElementRef<HTMLDivElement>;

  private map: any;
  private readonly platformId = inject(PLATFORM_ID);

  async ngOnInit(): Promise<void> {
    // IMPORTANT: Check if running in browser (not SSR)
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      await this.initializeMap();
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }

  private async initializeMap(): Promise<void> {
    // Dynamically import to avoid SSR issues
    const mapboxgl = (await import('mapbox-gl')).default;

    this.map = new mapboxgl.Map({
      accessToken: environment.mapboxAccessToken,
      container: this.mapContainer.nativeElement,
      center: [-71.05953, 42.3629],
      zoom: 13
    });

    // Handle map errors
    this.map.on('error', (e: any) => console.error('Map error:', e.error));
  }

  // CRITICAL: Clean up on component destroy
  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
```

**Template (map.component.html):**

```html
<div #mapContainer style="height: 100vh; width: 100%"></div>
```

**Key points:**

- Use `@ViewChild` to reference map container
- **Check `isPlatformBrowser` before initializing** (SSR support)
- **Dynamically import `mapbox-gl`** to avoid SSR issues
- Initialize in `ngOnInit()` lifecycle hook
- **Always implement `ngOnDestroy()`** to call `map.remove()`
- Handle errors with `map.on('error', ...)`

---

### Vanilla JavaScript (with Vite)

**Pattern: Module imports with initialization function**

```javascript
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './main.css';

// Set access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

let map;

/**
 * Initialize the map
 */
function initMap() {
  map = new mapboxgl.Map({
    container: 'map-container',
    center: [-71.05953, 42.3629],
    zoom: 13
  });

  map.on('load', () => {
    console.log('Map is loaded');
  });
}

// Initialize when script runs
initMap();
```

**HTML:**

```html
<div id="map-container" style="height: 100vh;"></div>
```

**Key points:**

- Store map in module-scoped variable
- Initialize immediately or on DOMContentLoaded
- Listen for 'load' event for post-initialization actions

---

### Vanilla JavaScript (No Bundler - CDN)

**Pattern: Script tag with inline initialization**

⚠️ **Note:** This pattern is for prototyping only. Production apps should use npm/bundler for version control and offline builds.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mapbox GL JS - No Bundler</title>

    <!-- Mapbox GL JS CSS -->
    <!-- Replace 3.x.x with latest version from https://docs.mapbox.com/mapbox-gl-js/ -->
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.x.x/mapbox-gl.css" rel="stylesheet" />

    <style>
      body {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        margin: 0;
        padding: 0;
      }
      #map-container {
        height: 100%;
        width: 100%;
      }
    </style>
  </head>
  <body>
    <div id="map-container"></div>

    <!-- Mapbox GL JS -->
    <!-- Replace 3.x.x with latest version from https://docs.mapbox.com/mapbox-gl-js/ -->
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.x.x/mapbox-gl.js"></script>

    <script>
      // Set access token
      mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN_HERE';

      let map;

      function initMap() {
        map = new mapboxgl.Map({
          container: 'map-container',
          center: [-71.05953, 42.3629],
          zoom: 13
        });

        map.on('load', () => {
          console.log('Map is loaded');
        });
      }

      // Initialize when page loads
      initMap();
    </script>
  </body>
</html>
```

**Key points:**

- ⚠️ **Prototyping only** - not recommended for production
- Replace `3.x.x` with specific version (e.g., `3.7.0`) from [Mapbox docs](https://docs.mapbox.com/mapbox-gl-js/)
- **Don't use `/latest/`** - always pin to specific version for consistency
- Initialize after script loads (bottom of body)
- For production: Use npm + bundler instead

**Why not CDN for production?**

- ❌ Network dependency (breaks offline)
- ❌ No version locking (CDN could change)
- ❌ Slower (no bundler optimization)
- ❌ No tree-shaking
- ✅ Use npm for production: `npm install mapbox-gl@^3.0.0`

---

## Advanced Patterns

### Web Components (Framework-Agnostic)

Web Components are a W3C standard for creating reusable custom elements that work in any framework or no framework at all.

**When to use Web Components:**

- ✅ **Vanilla JavaScript apps** - No framework? Web Components are a great choice
- ✅ **Design systems** - Building component libraries used across multiple frameworks
- ✅ **Micro-frontends** - Application uses different frameworks in different parts
- ✅ **Multi-framework organizations** - Teams working with React, Vue, Svelte, etc. need shared components
- ✅ **Framework migration** - Transitioning from one framework to another incrementally
- ✅ **Long-term stability** - W3C standard, no framework lock-in

**Real-world example:** A company with React (main app), Vue (admin panel), and Svelte (marketing site) can build one `<mapbox-map>` component that works everywhere.

**When to use framework-specific patterns instead:**

- 🔧 **Already using a framework** - If you're building in React, use React patterns (simpler, better integration)
- 🔧 **Need framework features** - Deep integration with React hooks, Vue Composition API, state management, routing
- 🔧 **Team familiarity** - Team is proficient with framework patterns

> **💡 Tip:** If you're using React, Vue, Svelte, or Angular, start with the framework-specific patterns above. They're simpler and better integrated. Use Web Components when you need cross-framework compatibility or are building vanilla JavaScript apps.

---

**Pattern: Standard Custom Element with lifecycle callbacks**

Web Components provide a framework-agnostic way to encapsulate Mapbox maps using the W3C Web Components standard.

**Basic Web Component:**

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
import './mapbox-map-component'; // Import to register element

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
  data() {
    return {
      token: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
    };
  },
  methods: {
    handleMapLoad(event) {
      const map = event.detail.map;
      // Interact with map
    }
  }
};
</script>
```

**Usage in Svelte:**

```svelte
<script>
  import './mapbox-map-component';

  let mapElement;

  function handleMapLoad(event) {
    const map = event.detail.map;
    // Interact with map
  }
</script>

<mapbox-map
  bind:this={mapElement}
  access-token={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
  map-style="mapbox://styles/mapbox/standard"
  center="-71.05953,42.3629"
  zoom="13"
  on:mapload={handleMapLoad}
/>
```

**Advanced: Reactive Attributes Pattern:**

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

**Key Implementation Points:**

- Use `connectedCallback()` for initialization (equivalent to mount/ngOnInit)
- **Always implement `disconnectedCallback()`** to call `map.remove()` (prevents memory leaks)
- Read configuration from HTML attributes
- Dispatch custom events for map interactions (`mapload`, etc.)
- Use `observedAttributes` + `attributeChangedCallback` for reactive updates
- Works in any framework without modification

---

## Token Management Patterns

### Environment Variables (Recommended)

Different frameworks use different prefixes for client-side environment variables:

| Framework/Bundler    | Environment Variable            | Access Pattern                             |
| -------------------- | ------------------------------- | ------------------------------------------ |
| **Vite**             | `VITE_MAPBOX_ACCESS_TOKEN`      | `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN` |
| **Next.js**          | `NEXT_PUBLIC_MAPBOX_TOKEN`      | `process.env.NEXT_PUBLIC_MAPBOX_TOKEN`     |
| **Create React App** | `REACT_APP_MAPBOX_TOKEN`        | `process.env.REACT_APP_MAPBOX_TOKEN`       |
| **Angular**          | `environment.mapboxAccessToken` | Environment files (`environment.ts`)       |

**Vite .env file:**

```bash
VITE_MAPBOX_ACCESS_TOKEN=pk.YOUR_MAPBOX_TOKEN_HERE
```

**Next.js .env.local file:**

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_MAPBOX_TOKEN_HERE
```

**Important:**

- ✅ Always use environment variables for tokens
- ✅ Never commit `.env` files to version control
- ✅ Use public tokens (pk.\*) for client-side apps
- ✅ Add `.env` to `.gitignore`
- ✅ Provide `.env.example` template for team

**.gitignore:**

```
.env
.env.local
.env.*.local
```

**.env.example:**

```bash
VITE_MAPBOX_ACCESS_TOKEN=your_token_here
```

---

## Mapbox Search JS Integration

### Search Box Component Pattern

**Install dependency:**

```bash
npm install @mapbox/search-js-react      # React
npm install @mapbox/search-js-web        # Vanilla/Vue/Svelte
```

**Note:** Both packages include `@mapbox/search-js-core` as a dependency. You only need to install `-core` directly if building a custom search UI.

**React Search Pattern:**

```jsx
import { SearchBox } from '@mapbox/search-js-react';

// Inside component:
<SearchBox
  accessToken={accessToken}
  map={mapRef.current} // Pass map instance
  mapboxgl={mapboxgl} // Pass mapboxgl library
  value={inputValue}
  onChange={(value) => setInputValue(value)}
  proximity={centerCoordinates} // Bias results near center
  marker // Show marker for selected result
/>;
```

**Key configuration options:**

- `accessToken`: Your Mapbox public token
- `map`: Map instance (must be initialized first)
- `mapboxgl`: The mapboxgl library reference
- `proximity`: `[lng, lat]` to bias results geographically
- `marker`: Boolean to show/hide result marker
- `placeholder`: Search box placeholder text

### Positioning Search Box

**Absolute positioning (overlay):**

```jsx
<div
  style={{
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 300
  }}
>
  <SearchBox {...props} />
</div>
```

**Common positions:**

- Top-right: `top: 10px, right: 10px`
- Top-left: `top: 10px, left: 10px`
- Bottom-left: `bottom: 10px, left: 10px`

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Forgetting to call map.remove()

```javascript
// BAD - Memory leak!
useEffect(() => {
  const map = new mapboxgl.Map({ ... })
  // No cleanup function
}, [])
```

```javascript
// GOOD - Proper cleanup
useEffect(() => {
  const map = new mapboxgl.Map({ ... })
  return () => map.remove()  // ✅ Cleanup
}, [])
```

**Why:** Every Map instance creates WebGL contexts, event listeners, and DOM nodes. Without cleanup, these accumulate and cause memory leaks.

---

### ❌ Mistake 2: Initializing map in render

```javascript
// BAD - Infinite loop in React!
function MapComponent() {
  const map = new mapboxgl.Map({ ... })  // Runs on every render
  return <div />
}
```

```javascript
// GOOD - Initialize in effect
function MapComponent() {
  useEffect(() => {
    const map = new mapboxgl.Map({ ... })
  }, [])
  return <div />
}
```

**Why:** React components re-render frequently. Creating a new map on every render causes infinite loops and crashes.

---

### ❌ Mistake 3: Not storing map instance properly

```javascript
// BAD - map variable lost between renders
function MapComponent() {
  useEffect(() => {
    let map = new mapboxgl.Map({ ... })
    // map variable is not accessible later
  }, [])
}
```

```javascript
// GOOD - Store in useRef
function MapComponent() {
  const mapRef = useRef()
  useEffect(() => {
    mapRef.current = new mapboxgl.Map({ ... })
    // mapRef.current accessible throughout component
  }, [])
}
```

**Why:** You need to access the map instance for operations like adding layers, markers, or calling `remove()`.

---

### ❌ Mistake 4: Wrong dependency array in useEffect

```javascript
// BAD - Re-creates map on every render
useEffect(() => {
  const map = new mapboxgl.Map({ ... })
  return () => map.remove()
})  // No dependency array

// BAD - Re-creates map when props change
useEffect(() => {
  const map = new mapboxgl.Map({ center: props.center, ... })
  return () => map.remove()
}, [props.center])
```

```javascript
// GOOD - Initialize once
useEffect(() => {
  const map = new mapboxgl.Map({ ... })
  return () => map.remove()
}, [])  // Empty array = run once

// GOOD - Update map property instead
useEffect(() => {
  if (mapRef.current) {
    mapRef.current.setCenter(props.center)
  }
}, [props.center])
```

**Why:** Map initialization is expensive. Initialize once, then use map methods to update properties.

---

### ❌ Mistake 5: Hardcoding token in source code

```javascript
// BAD - Token exposed in source code
mapboxgl.accessToken = 'pk.YOUR_MAPBOX_TOKEN_HERE';
```

```javascript
// GOOD - Use environment variable
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
```

**Why:** Tokens in source code get committed to version control and exposed publicly. Always use environment variables.

---

### ❌ Mistake 6: Not handling Angular SSR

```typescript
// BAD - Crashes during server-side rendering
ngOnInit() {
  import('mapbox-gl').then(mapboxgl => {
    this.map = new mapboxgl.Map({ ... })
  })
}
```

```typescript
// GOOD - Check platform first
ngOnInit() {
  if (!isPlatformBrowser(this.platformId)) {
    return  // Skip map init during SSR
  }

  import('mapbox-gl').then(mapboxgl => {
    this.map = new mapboxgl.Map({ ... })
  })
}
```

**Why:** Mapbox GL JS requires browser APIs (WebGL, Canvas). Angular Universal (SSR) will crash without platform check.

---

### ❌ Mistake 7: Missing CSS import

```javascript
// BAD - Map renders but looks broken
import mapboxgl from 'mapbox-gl';
// Missing CSS import
```

```javascript
// GOOD - Import CSS for proper styling
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
```

**Why:** The CSS file contains critical styles for map controls, popups, and markers. Without it, the map appears broken.

---

## Next.js Specific Patterns

### App Router (Recommended)

```typescript
'use client'  // Mark as client component

import { useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export default function Map() {
  const mapRef = useRef<mapboxgl.Map>()
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: [-71.05953, 42.36290],
      zoom: 13
    })

    return () => mapRef.current?.remove()
  }, [])

  return <div ref={mapContainerRef} style={{ height: '100vh' }} />
}
```

**Key points:**

- **Must use `'use client'` directive** (maps require browser APIs)
- Use `process.env.NEXT_PUBLIC_*` for environment variables
- Type `mapRef` properly with TypeScript

### Pages Router (Legacy)

```typescript
import dynamic from 'next/dynamic'

// Dynamically import to disable SSR for map component
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
})

export default function HomePage() {
  return <Map />
}
```

**Key points:**

- Use `dynamic` import with `ssr: false`
- Provide loading state
- Map component itself follows standard React pattern

---

## Style Configuration

### Default Center and Zoom Guidelines

**Recommended defaults:**

- **Center**: `[-71.05953, 42.36290]` (Boston, MA) - Mapbox HQ
- **Zoom**: `13` for city-level view

**Zoom level guide:**

- `0-2`: World view
- `3-5`: Continent/country
- `6-9`: Region/state
- `10-12`: City view
- `13-15`: Neighborhood
- `16-18`: Street level
- `19-22`: Building level

**Customizing for user location:**

```javascript
// Use browser geolocation
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((position) => {
    map.setCenter([position.coords.longitude, position.coords.latitude]);
    map.setZoom(13);
  });
}
```

---

## Testing Patterns

### Unit Testing Maps

**Mock mapbox-gl:**

```javascript
// vitest.config.js or jest.config.js
export default {
  setupFiles: ['./test/setup.js']
};
```

```javascript
// test/setup.js
vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn(() => ({
      on: vi.fn(),
      remove: vi.fn(),
      setCenter: vi.fn(),
      setZoom: vi.fn()
    })),
    accessToken: ''
  }
}));
```

**Why:** Mapbox GL JS requires WebGL and browser APIs that don't exist in test environments. Mock the library to test component logic.

---

## When to Use This Skill

Invoke this skill when:

- Setting up Mapbox GL JS in a new project
- Integrating Mapbox into a specific framework (React, Vue, Svelte, Angular, Next.js)
- Building framework-agnostic Web Components
- Creating reusable map components for component libraries
- Debugging map initialization issues
- Adding Mapbox Search functionality
- Implementing proper cleanup and lifecycle management
- Converting between frameworks (e.g., React to Vue)
- Reviewing code for Mapbox integration best practices

## Related Skills

- **mapbox-cartography**: Map design principles and styling
- **mapbox-token-security**: Token management and security
- **mapbox-style-patterns**: Common map style patterns

## Resources

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [Mapbox Search JS Documentation](https://docs.mapbox.com/mapbox-search-js/)
- [create-web-app GitHub](https://github.com/mapbox/create-web-app)
