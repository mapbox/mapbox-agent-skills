# Pattern 2: Real Estate Map

**Use case:** Property search, neighborhood exploration, real estate listings

**Visual requirements:**

- Property boundaries clear
- Neighborhood context visible
- Amenities highlighted (schools, parks, transit)
- Price/property data display

## Basemap config

Here the neighborhood _is_ part of the product — buyers are reading the surroundings, not just the listings. Keep greenspace and POIs legible, quiet everything else a step so the property overlay dominates.

```javascript
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard',
  config: {
    basemap: {
      theme: 'faded', // desaturate so the price overlay reads as the subject
      showPointOfInterestLabels: true, // schools, transit, shops = buying signals
      densityPointOfInterestLabels: 3,
      showPlaceLabels: true, // neighborhood names matter to buyers
      showRoadLabels: true,
      show3dObjects: false // footprints compete with property boundaries
    }
  }
});
```

Standard already draws parks, water, schools, and transit — use its POI labels rather than adding duplicate amenity layers. Add only the layers Standard can't know about: **your listings**.

## Property fills, color-coded by price

```javascript
map.addLayer({
  id: 'property-fills',
  type: 'fill',
  slot: 'bottom', // under roads, so the street network keeps supplying context
  source: 'properties',
  paint: {
    // Sequential ColorBrewer ramp (YlOrRd). Price is ORDERED data, so it needs an
    // ordered ramp — a green->yellow->red ramp reads as good/bad and fails for
    // deuteranopia, where the green and red ends collapse together.
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'price'],
      200000,
      '#ffffb2',
      500000,
      '#fecc5c',
      750000,
      '#fd8d3c',
      1000000,
      '#e31a1c'
    ],
    'fill-opacity': 0.5,
    'fill-emissive-strength': 1 // or the fills vanish at dusk/night
  }
});

map.addLayer({
  id: 'property-boundaries',
  type: 'line',
  slot: 'bottom',
  source: 'properties',
  paint: {
    'line-color': '#7e57c2',
    'line-width': ['interpolate', ['linear'], ['zoom'], 14, 1, 18, 3],
    'line-opacity': 0.8,
    'line-emissive-strength': 1
  }
});
```

Always pair the price ramp with a **legend and a readable number** — a color ramp alone can't communicate a dollar value, and color must never be the only encoding.

## Listing pins

```javascript
map.addLayer({
  id: 'listing-pins',
  type: 'symbol',
  slot: 'top', // markers and active selections belong in `top`
  source: 'properties',
  layout: {
    'icon-image': 'listing-pin',
    'icon-size': ['interpolate', ['linear'], ['zoom'], 12, 0.7, 17, 1.2],
    'icon-anchor': 'bottom',
    'icon-allow-overlap': true,
    'text-field': ['get', 'price_label'], // e.g. "$450k"
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'], // Standard's family
    'text-size': 12,
    'text-offset': [0, -2.2],
    'text-anchor': 'bottom',
    'text-optional': true // drop the price label before the pin on collision
  },
  paint: {
    'text-color': '#333333',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1.5
  }
});
```

**Selected property** — a second layer filtered to the active id, also in `top`, inserted after the pins so it draws above them:

```javascript
map.addLayer({
  id: 'listing-selected',
  type: 'circle',
  slot: 'top',
  source: 'properties',
  filter: ['==', ['get', 'id'], ''], // updated via setFilter on selection
  paint: {
    'circle-radius': 14,
    'circle-color': 'rgba(0,0,0,0)',
    'circle-stroke-color': '#7e57c2',
    'circle-stroke-width': 3,
    'circle-emissive-strength': 1
  }
});
```

**Key features:**

- Faded Standard base — neighborhood context without competing with listings
- Standard's own POIs cover schools, parks, and transit; no duplicate amenity layers
- Price fills in `bottom` (roads draw over them), pins and selection in `top`
- Sequential ramp, not green→red, plus a legend and a literal price label
- Purple brand accent on **your** boundaries and pins, never on the basemap
