# Pattern 3: Data Visualization Base Map

**Use case:** Choropleth maps, heatmaps, data overlays, analytics dashboards

**Visual requirements:**

- Minimal base map (data is the focus)
- Context without distraction
- Works with various data overlay colors
- High contrast optional for dark data

## The pattern: quiet the basemap with config

The base is a **canvas, not the subject**. POI labels compete with the thematic layer for attention and 3D objects occlude it outright, so turn both off. `theme: 'monochrome'` desaturates the whole basemap in one property.

```javascript
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard',
  config: {
    basemap: {
      theme: 'monochrome', // grayscale base — won't fight your data colors
      showPointOfInterestLabels: false, // POIs compete with the thematic layer
      show3dObjects: false, // 3D occludes the overlay
      showTransitLabels: false,
      showRoadLabels: false, // keep road *geometry* for orientation, drop the names
      showPlaceLabels: true // city names still orient the reader
    }
  }
});
```

**Figure-ground:** when your data isn't popping, **lighten and desaturate the basemap, not the data.** `theme: 'monochrome'` (or `'faded'`) is the fastest way to do this. Turning your data up instead is the reflex to resist.

## Purpose-built alternatives

For a base designed from the ground up for choropleths, use the standalone Standard-based styles in the [Mapbox gallery](https://www.mapbox.com/gallery) — **`light-2d`** and **`dark-2d`**. These are full styles, not `theme:` values: copy one to your own account and reference your copy (`yourusername/styleId`) in production.

## Your data layer

Choropleths go in the `bottom` slot so the road network draws **over** them and keeps supplying context:

```javascript
map.addLayer({
  id: 'choropleth',
  type: 'fill',
  // `bottom` puts the fill UNDER the road network, so roads and labels draw on
  // top of it and keep supplying geographic context. With no slot at all, the
  // fill would cover the labels entirely.
  slot: 'bottom',
  source: 'regions',
  paint: {
    // Sequential ColorBrewer ramp — ordered data needs an ordered ramp
    'fill-color': ['interpolate', ['linear'], ['get', 'value'], 0, '#f0f9ff', 50, '#7fcdff', 100, '#0080ff'],
    'fill-opacity': 0.7,
    'fill-emissive-strength': 1 // defaults to 0 — or the fill disappears at dusk/night
  }
});
```

**Cap `fill-opacity` at 0.7.** Above that the fill goes effectively opaque and the road network stops reading through, which is what was giving the reader their sense of place. This holds even when opacity is data-driven — if you vary opacity to encode a second variable (margin of victory, confidence, sample size), the **top** of that ramp still stops at 0.7:

```javascript
// ✅ Data-driven opacity that respects the cap
'fill-opacity': ['interpolate', ['linear'], ['get', 'margin'], 0, 0.3, 20, 0.7]

// ❌ Runs opaque at the high end — the basemap vanishes under landslide districts
'fill-opacity': ['interpolate', ['linear'], ['get', 'margin'], 0, 0.35, 20, 0.85]
```

**Color rules for the data layer:**

- **Sequential** (one direction): Blues, Greens, Oranges, YlOrRd, BuPu
- **Diverging** (bidirectional / political): RdBu, PuOr, BrBG — **never RdYlGn**, the most common colorblind failure
- **Qualitative** (categories, ≤ 8): Set1, Set2, Paired, Dark2
- **Never rainbow or spectral for ordered data** — rainbow has no perceptual ordering

**Key features:**

- Monochrome base doesn't interfere with data colors
- Minimal labels — place names only, for orientation
- Road geometry retained for spatial context, road _names_ dropped
- Data in `bottom` so the network overlays it

## Classic-style fallback

If you need a server-rendered raster (the Static Images API cannot render Standard) or a deliberate 2D fallback, reach for the ready-made **`light-v11`** Classic style, which is already a minimal grayscale base — hand-authoring an equivalent stack is rarely worth it. If you do author one: L 94–97% slightly-warm background, gray admin boundaries dashed, major roads only at low opacity, and major place labels in a single family at 10–14px.
