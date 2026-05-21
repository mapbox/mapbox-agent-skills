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
- **v2.x:** Legacy; no longer actively developed (see migration notes below)

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

### Framework Requirements

**React:** GL JS works with React 16.8+ (requires hooks). `create-web-app` scaffolds with React 19.x.
**Vue:** GL JS works with Vue 2.x+ (Vue 3 Composition API recommended).
**Svelte:** GL JS works with any Svelte version. `create-web-app` scaffolds with Svelte 5.x.
**Angular:** GL JS works with Angular 2+. `create-web-app` scaffolds with Angular 19.x.
**Next.js:** Minimum 13.x (App Router), Pages Router 12.x+.

### Mapbox Search JS

```bash
npm install @mapbox/search-js-react@^1.0.0      # React
npm install @mapbox/search-js-web@^1.0.0        # Other frameworks
```

### Version Migration Notes (v2.x to v3.x)

- WebGL 2 now required
- `optimizeForTerrain` option removed
- Improved TypeScript types, better tree-shaking support
- No breaking changes to core initialization patterns

**Token patterns (work in v2.x and v3.x):**

```javascript
const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN; // Use env vars in production

// Global token (works since v1.x)
mapboxgl.accessToken = token;
const map = new mapboxgl.Map({ container: '...' });

// Per-map token (preferred for multi-map setups)
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

## React Integration (Primary Pattern)

**Pattern: useRef + useEffect with cleanup**

> **Note:** These examples use **Vite** (the bundler used in `create-web-app`). If using Create React App, replace `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN` with `process.env.REACT_APP_MAPBOX_TOKEN`. See [Token Management Patterns](references/token-management.md) for other bundlers.

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

### React + Search JS

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

## Search JS Integration Summary

**Install:**

```bash
npm install @mapbox/search-js-react      # React
npm install @mapbox/search-js-web        # Vanilla/Vue/Svelte
```

Both packages include `@mapbox/search-js-core` as a dependency. Only install `-core` directly if building a custom search UI.

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

## Common Mistakes (Critical)

### Mistake 1: Forgetting to call map.remove()

```javascript
// BAD - Memory leak!
useEffect(() => {
  const map = new mapboxgl.Map({ ... })
  // No cleanup function
}, [])

// GOOD - Proper cleanup
useEffect(() => {
  const map = new mapboxgl.Map({ ... })
  return () => map.remove()  // Cleanup
}, [])
```

**Why:** Every Map instance creates WebGL contexts, event listeners, and DOM nodes. Without cleanup, these accumulate and cause memory leaks.

### Mistake 2: Initializing map in render

```javascript
// BAD - Infinite loop in React!
function MapComponent() {
  const map = new mapboxgl.Map({ ... })  // Runs on every render
  return <div />
}

// GOOD - Initialize in effect
function MapComponent() {
  useEffect(() => {
    const map = new mapboxgl.Map({ ... })
  }, [])
  return <div />
}
```

**Why:** React components re-render frequently. Creating a new map on every render causes infinite loops and crashes.

### Mistake 3: Not storing map instance properly

```javascript
// BAD - map variable lost between renders
function MapComponent() {
  useEffect(() => {
    let map = new mapboxgl.Map({ ... })
    // map variable is not accessible later
  }, [])
}

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

### Mistake 4: Storing map instance in Vue's data() (Vue-specific)

```javascript
// BAD - Vue's reactivity wraps data() objects in a Proxy, breaking mapbox-gl internals!
export default {
  data() {
    return {
      map: null  // Will be wrapped in a Proxy
    }
  },
  mounted() {
    this.map = new mapboxgl.Map({ ... })  // Proxy breaks GL internals
  }
}

// GOOD - Assign map as a plain instance property, not in data()
export default {
  mounted() {
    this.map = new mapboxgl.Map({
      container: this.$refs.mapContainer,
      center: [-71.05953, 42.3629],
      zoom: 13
    })
  },
  unmounted() {
    this.map?.remove()
  }
}
```

**Why:** In Vue (especially Vue 3), `data()` properties are wrapped in a `Proxy` for reactivity. Mapbox GL JS internally checks object identity and uses properties that don't survive proxy wrapping. Storing the map in `data()` causes subtle, hard-to-debug failures. Instead, assign the map instance directly as `this.map` in `mounted()` — properties assigned outside `data()` are not made reactive.

## Reference Files

Load these for framework-specific patterns and additional details:

- `references/vue.md` — Vue Integration (mounted/unmounted lifecycle)
- `references/svelte.md` — Svelte Integration (onMount/onDestroy)
- `references/angular.md` — Angular Integration with SSR handling
- `references/vanilla.md` — Vanilla JS (Vite) + Vanilla JS (CDN)
- `references/web-components.md` — Web Components (basic + reactive + usage in React/Vue/Svelte)
- `references/nextjs.md` — Next.js App Router + Pages Router
- `references/common-mistakes.md` — Common Mistakes 4-7 + Testing Patterns
- `references/token-management.md` — Token Management per bundler + Style Configuration

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
