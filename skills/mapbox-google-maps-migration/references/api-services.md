# API Services, Pricing, Plugins, Framework Integration, and Testing

## API Services Comparison

| Service               | Google Maps         | Mapbox         | Notes                            |
| --------------------- | ------------------- | -------------- | -------------------------------- |
| **Geocoding**         | Geocoding API       | Geocoding API  | Similar capabilities             |
| **Reverse Geocoding** | ✅                  | ✅             | Similar                          |
| **Directions**        | Directions API      | Directions API | Mapbox has traffic-aware routing |
| **Distance Matrix**   | Distance Matrix API | Matrix API     | Similar                          |
| **Isochrones**        | ❌                  | ✅             | Mapbox exclusive                 |
| **Optimization**      | ❌                  | ✅             | Mapbox exclusive (TSP)           |
| **Street View**       | ✅                  | ❌             | Google exclusive                 |
| **Static Maps**       | ✅                  | ✅             | Both supported                   |
| **Satellite Imagery** | ✅                  | ✅             | Both supported                   |
| **Tilesets**          | Limited             | Full API       | Mapbox more flexible             |

## Pricing Differences

### Google Maps Platform

- Charges per API call
- Free tier: $200/month credit
- Different rates for different APIs
- Can get expensive with high traffic

### Mapbox

- Charges per map load
- Free tier: 50,000 map loads/month
- Unlimited API requests per map session
- More predictable costs

**Migration Tip:** Understand how pricing models differ for your use case.

## Plugins and Extensions

### Google Maps Plugins -> Mapbox Alternatives

| Google Maps Plugin | Mapbox Alternative           |
| ------------------ | ---------------------------- |
| MarkerClusterer    | Built-in clustering          |
| Drawing Manager    | @mapbox/mapbox-gl-draw       |
| Geocoder           | @mapbox/mapbox-gl-geocoder   |
| Directions         | @mapbox/mapbox-gl-directions |
| -                  | @mapbox/mapbox-gl-traffic    |
| -                  | @mapbox/mapbox-gl-compare    |

## Framework Integration

### React

**Google Maps:**

```javascript
import { GoogleMap, Marker } from '@react-google-maps/api';
```

**Mapbox:**

```javascript
import Map, { Marker } from 'react-map-gl';
// or
import { useMap } from '@mapbox/mapbox-gl-react';
```

### Vue

**Google Maps:**

```javascript
import { GoogleMap } from 'vue3-google-map';
```

**Mapbox:**

```javascript
import { MglMap } from 'vue-mapbox';
```

See `mapbox-web-integration-patterns` skill for detailed framework guidance.

## Testing Strategy

### Unit Tests

```javascript
// Mock mapboxgl
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn()
  })),
  Marker: jest.fn()
}));
```

### Integration Tests

- Test map initialization
- Test data loading and updates
- Test user interactions (click, pan, zoom)
- Test API integrations (geocoding, directions)

### Visual Regression Tests

- Compare before/after screenshots
- Ensure visual parity with Google Maps version

## Checklist: Migration Complete

- [ ] Map initializes correctly
- [ ] All markers/features display
- [ ] Click/hover interactions work
- [ ] Popups/info windows display
- [ ] Geocoding integrated
- [ ] Directions/routing working
- [ ] Custom styling applied
- [ ] Controls positioned correctly
- [ ] Mobile/touch gestures work
- [ ] Performance is acceptable
- [ ] Cross-browser tested
- [ ] API keys secured
- [ ] Error handling in place
- [ ] Analytics/monitoring updated
- [ ] Documentation updated
- [ ] Team trained on Mapbox
