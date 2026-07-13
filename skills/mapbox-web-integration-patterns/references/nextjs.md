# Next.js Specific Patterns

## App Router (Recommended)

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

## Pages Router (Legacy)

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
