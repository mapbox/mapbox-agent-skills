# Common Mistakes (continued) and Testing Patterns

## Mistake 4: Wrong dependency array in useEffect

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

## Mistake 5: Hardcoding token in source code

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

## Mistake 6: Not handling Angular SSR

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

## Mistake 7: Missing CSS import

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
