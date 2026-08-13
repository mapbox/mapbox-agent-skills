---
name: mapbox-style-patterns
description: Common style patterns and recipes for typical mapping scenarios — restaurant finders, real estate, data visualization, navigation, delivery/logistics — expressed as Mapbox Standard config plus custom layers in slots, with hand-authored Classic style stacks as a labeled fallback. Use when implementing specific map use cases or looking for proven style recipes.
---

# Mapbox Style Patterns Skill

Battle-tested style recipes for common mapping scenarios.

## How these patterns are built

**Every pattern here is a Standard-style recipe:** basemap **config** for the look, plus **your own layers in slots** for your data. That covers roughly 95% of design needs without authoring a style at all.

```javascript
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard',
  config: { basemap: { theme: 'default', showPointOfInterestLabels: true } }
});

// Adjust at runtime with config — never setStyle() for an incremental change
map.setConfigProperty('basemap', 'theme', 'faded');
```

Three rules apply to every custom layer in every pattern below:

| Rule                                                  | Why                                                                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Always set `slot`** — `bottom` \| `middle` \| `top` | A layer with no slot draws above **everything**, including street labels                                                             |
| **Set emissive strength `1`** on fill / line / circle | These default to `0`, so the layer falls into shadow and nearly disappears at `dusk` / `night`. Symbol layers already default to `1` |
| **Routes also need `line-occlusion-opacity: 1`**      | Keeps 3D buildings from hiding the route                                                                                             |

Slots: `bottom` = above land/water, below roads (choropleths, rasters). `middle` = above roads, behind 3D and labels (most overlays, **routes**, custom POI layers). `top` = above POI labels (markers, active selections).

See the **mapbox-cartography** skill for the full slot table, color rules, typography, and light-preset behavior.

> **When a Classic style is the right answer:** you need a server-rendered raster (the Static Images API cannot render Standard), you need per-layer paint control that config cannot express, or you want a deliberate 2D / low-power fallback. Those cases hand-author the whole layer stack — the reference files below label which pattern is which.

## Pattern Library

### Pattern 1: Restaurant/POI Finder

**Use case:** Consumer app showing restaurants, cafes, bars, or other points of interest

**Visual requirements:**

- Your POIs must be immediately visible
- Street context for navigation
- Neutral background (photos/content overlay)
- Mobile-optimized

**Standard config:** the basemap _is_ useful context here, so keep it browsable — but quiet it a step so your pins dominate.

```javascript
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard',
  config: {
    basemap: {
      theme: 'faded', // desaturate the base so your pins and photos pop
      showPointOfInterestLabels: true, // basemap POIs give orientation...
      densityPointOfInterestLabels: 2, // ...but thin them so they don't compete
      showRoadLabels: true,
      show3dObjects: false // 3D occludes pins at browsing zooms
    }
  }
});
```

**Your POI layer** — one symbol layer, in the `top` slot:

```javascript
map.addLayer({
  id: 'restaurant-markers',
  type: 'symbol',
  slot: 'top', // markers and selections belong in `top`
  source: 'restaurants',
  layout: {
    'icon-image': 'restaurant-marker',
    // Scale with zoom; a flat icon-size looks wrong across the range
    'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 16, 1.4],
    'icon-allow-overlap': true, // every restaurant must be visible
    'text-field': ['get', 'name'],
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'], // Standard's family
    'text-offset': [0, 1.5],
    'text-anchor': 'top',
    'text-size': 12,
    'text-optional': true // drop the label before the icon on collision
  },
  paint: {
    'icon-color': '#FF6B35', // brand color on YOUR pins — never on the basemap
    'text-color': '#333333',
    'text-halo-color': '#ffffff',
    'text-halo-width': 2
  }
});
```

**Key features:**

- Faded basemap doesn't compete with photos or pins
- High-contrast markers (`#FF6B35` orange) carry the brand
- `icon-allow-overlap: true` + `text-optional: true` — icons never vanish, labels yield first
- Standard's own road labels and POIs supply context at a reduced density

> `icon-color` tints **SDF** images only. Register single-color icons as SDF; don't bake gradient fills into icon images.

## Pattern Selection Guide

### Decision Tree

**Question 1: What is the primary content?**

- User-generated markers/pins -> **POI Finder Pattern** (above)
- Property data/boundaries -> **Real Estate Pattern**
- Statistical/analytical data -> **Data Visualization Pattern**
- Routes/directions -> **Navigation Pattern**
- Real-time tracking/delivery zones -> **Delivery/Logistics Pattern** (customer markers should include a pulse animation via second circle layer + requestAnimationFrame + setPaintProperty; see references/delivery-logistics.md)

**Question 2: What is the viewing environment?**

- Daytime/office -> `lightPreset: 'day'` (the default — design against it first)
- Night/dark environment, or the app has a dark theme -> `lightPreset: 'night'` (`'dusk'` for a softer, still-lit look)
- Variable -> bind `lightPreset` to the same signal that drives the rest of your UI (`prefers-color-scheme` on web, `UITraitCollection` / `uiMode` on iOS / Android)

```javascript
// Dark mode is a config change, not a different style
map.setConfigProperty('basemap', 'lightPreset', 'night');
```

**Question 3: What is the user's primary action?**

- Browse/explore -> Focus on POIs, rich detail (`theme: 'default'`, POIs on)
- Navigate -> Focus on roads, route visibility (`showPedestrianRoads` for last-mile)
- Track delivery/logistics -> Real-time updates, zones, status
- Analyze data -> Minimize base map, maximize data (`theme: 'monochrome'`, POIs off, 3D off)
- Select location -> Clear boundaries, context

**Question 4: What is the platform?**

- Mobile -> Simplified, larger touch targets, less detail
- Desktop -> Can include more detail and complexity
- Both -> Design mobile-first, enhance for desktop

Config keys and values are **identical** on GL JS, Android, iOS, and Flutter — only the setter call differs (`setConfigProperty` on web, `setStyleImportConfigProperty` on the mobile SDKs).

## Layer Optimization Patterns

### Performance Pattern: Simplified by Zoom

Applies to **your own** layers (and to Classic styles) — Standard's basemap already does this for you. Use modern `interpolate` / `step` expressions, not the legacy `{base, stops}` function syntax:

```json
{
  "id": "roads",
  "type": "line",
  "slot": "bottom",
  "source": "my-roads",
  "filter": [
    "step",
    ["zoom"],
    ["in", ["get", "class"], ["literal", ["motorway", "trunk"]]],
    8,
    ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary"]]],
    12,
    ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary"]]],
    14,
    true
  ],
  "paint": {
    "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 4, 0.5, 10, 1, 15, 4, 18, 12],
    "line-emissive-strength": 1
  }
}
```

**Zoom continuity:** never pop a layer on at a hard `minzoom`. Keep `minzoom` for the GPU saving, but set it 1–2 levels _below_ where the layer should appear and fade opacity in across that band:

```json
"line-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0, 12.5, 1]
```

3D buildings should fade in starting at z13, never below.

## Reference Files

Additional patterns and configurations are available in the `references/` directory. Load the relevant file when a specific pattern is needed.

| File                                                                         | Contents                                                                                         | Basis                   |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------- |
| [references/real-estate.md](references/real-estate.md)                       | Pattern 2: Real Estate Map -- property boundaries, price color-coding, amenity markers           | Standard config + slots |
| [references/data-viz-base.md](references/data-viz-base.md)                   | Pattern 3: Data Visualization Base Map -- quiet base for choropleth/heatmap overlays             | Standard config + slots |
| [references/navigation.md](references/navigation.md)                         | Pattern 4: Navigation/Routing Map -- route display, user location, turn arrows                   | Standard config + slots |
| [references/dark-mode.md](references/dark-mode.md)                           | Pattern 5: Dark Mode / Night Theme -- `lightPreset: 'night'`, and what it does and doesn't adapt | Standard config         |
| [references/delivery-logistics.md](references/delivery-logistics.md)         | Pattern 6: Delivery/Logistics Map -- real-time tracking, zones, driver markers, ETA badges       | Standard config + slots |
| [references/expressions-clustering.md](references/expressions-clustering.md) | Data-driven expression patterns + clustering for dense POIs                                      | Style spec (any style)  |
| [references/common-modifications.md](references/common-modifications.md)     | 3D objects, terrain/hillshade, custom markers                                                    | Standard config + slots |

**Loading instructions:** Read the reference file that matches the user's use case. For example, if implementing a delivery tracking map, load `references/delivery-logistics.md`.

## Testing Patterns

### Visual Regression Checklist

- [ ] Test at zoom levels: 4, 8, 12, 16, 20
- [ ] Verify on mobile (375px width)
- [ ] Verify on desktop (1920px width)
- [ ] Test with dense data
- [ ] Test with sparse data
- [ ] Check label collision
- [ ] Verify color contrast (WCAG AA: 4.5:1 text, 3:1 large text and line work)
- [ ] Choropleth / overlay `fill-opacity` stays at or below 0.7 — including the top of a data-driven opacity ramp — so the basemap reads through
- [ ] Check with a deuteranopia simulator — no red/green-only distinctions
- [ ] Test loading performance

### Standard-specific checks

- [ ] **Every custom layer has an explicit `slot`** — nothing is accidentally drawing over the labels
- [ ] **Every non-3D custom layer has emissive strength `1`** — check by switching to `lightPreset: 'night'`
- [ ] Routes set `line-occlusion-opacity` and stay visible through 3D buildings
- [ ] All four light presets (`dawn`/`day`/`dusk`/`night`) are legible
- [ ] No `color*` config override was authored as an already-dark value (they are **day** values; Standard re-derives them per preset, so a night-tuned color double-darkens to near-black)
- [ ] Brand color appears on user content only — not on basemap roads, water, or land

## When to Use This Skill

Invoke this skill when:

- Starting a new map for a specific use case
- Looking for a proven config + layer recipe
- Implementing common mapping patterns
- Optimizing an existing style
- Debugging style issues (layers over labels, layers invisible at night)
- Learning Mapbox style best practices
