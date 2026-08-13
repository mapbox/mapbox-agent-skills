# Mapbox Cartography

Quick reference for Mapbox map design. Platform-independent — applies to GL JS, Android, iOS, and Flutter. **This is the source of truth for map design guidance across these skills.**

## Start here: Standard + config

Default to `mapbox://styles/mapbox/standard`. Config covers ~95% of design needs — set the property, don't reload the style.

```javascript
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard',
  config: { basemap: { lightPreset: 'day', theme: 'default' } }
});

map.setConfigProperty('basemap', 'lightPreset', 'night');
```

| Platform | Setter                                                                      |
| -------- | --------------------------------------------------------------------------- |
| Web      | `map.setConfigProperty('basemap', k, v)`                                    |
| Android  | `style.setStyleImportConfigProperty("basemap", k, Value.valueOf(v))`        |
| iOS      | `mapboxMap.setStyleImportConfigProperty(for: "basemap", config: k, value:)` |
| Flutter  | `mapboxMap.style.setStyleImportConfigProperty('basemap', k, v)`             |

## Config surface

Complete list; version gates in the [Standard API reference](https://docs.mapbox.com/map-styles/standard/api/).

- **`lightPreset`**: `dawn | day | dusk | night` — lighting, atmosphere, and the basemap colors that follow
- **`theme`**: `default | faded | monochrome | custom` (`custom` requires a LUT via `theme-data`)
- **`font`**: any Mapbox or account-uploaded family; Standard's own labels are DIN Pro. Missing `Bold`/`Medium`/`Regular`/`Italic` weights fall back silently
- **Label booleans**: `showPlaceLabels`, `showPointOfInterestLabels`, `showRoadLabels`, `showTransitLabels`, `showLandmarkIconLabels`, `showIndoorLabels`
- **Feature booleans**: `showPedestrianRoads`, `showAdminBoundaries`, `showLandmarkIcons`, `showIndoor`
- **3D booleans**: `show3dObjects` (master — also shadows, ambient occlusion, flood lights), `show3dBuildings`, `show3dLandmarks`, `show3dTrees`, `show3dFacades`
- **Off by default**: `showLandmarkIcons`, `showLandmarkIconLabels`, `showIndoor`, `showIndoorLabels`
- **POI controls**: `densityPointOfInterestLabels` `1–5` (default `3`), `colorModePointOfInterestLabels` (`default|single`), `backgroundPointOfInterestLabels` (`circle|none`), `fuelingStationModePointOfInterestLabels`
- **Colors**: `colorLand`, `colorWater`, `colorGreenspace`; `colorCommercial`, `colorEducation`, `colorMedical`, `colorIndustrial`; `colorMotorways`, `colorTrunks`, `colorRoads`; `colorBuildings`; `colorPlaceLabels`, `colorRoadLabels`, `colorPointOfInterestLabels`, `colorAdminBoundaries`
- **Feature-state colors**: `colorBuildingHighlight`/`Select`, `colorPlaceLabelHighlight`/`Select`, `colorIndoorLabelHighlight`/`Select`
- **Recent gates** (an unknown key is ignored silently): indoor → GL JS `v3.21` / SDK `v11.19`; per-layer `show3d*`, land-use colors, `colorLand`, `colorBuildings` → `v3.17` / `v11.17`; `font` → `v3.14` / `v11.11`
- **`standard-satellite`**: subset — no `theme`/`theme-data`, no `show3d*`, no landmark or indoor toggles, no land/water/land-use/building colors. Adds **`showRoadsAndTransit`**

## Featuresets — the only per-feature basemap control

`poi` (`hide`), `place-labels` (`hide`, `highlight`, `select`), `buildings` (`highlight`, `select`), `landmark-icons` (properties only), `indoor-labels` (`highlight`, `select`). `select` outranks `highlight`. The state paints with the matching `color*Highlight`/`color*Select` config. Use `hide` on `poi` — not a clip layer — when swapping one basemap POI for your own marker.

## Slots — every custom layer needs one

| Slot     | Position                               | Put here                                     |
| -------- | -------------------------------------- | -------------------------------------------- |
| `bottom` | Above land/water, **below** roads      | Rasters, terrain, choropleth fills           |
| `middle` | Above roads, **behind** 3D and labels  | Most overlays, **routes**, custom POI layers |
| `top`    | Above POI labels, behind place/transit | Markers, active selections                   |

**A layer with no slot is projection-dependent** — above everything in non-globe projections, below labels under `globe` (GL JS's default). Never rely on it; always set a slot. Two layers in the same slot keep insertion order.

```json
{
  "id": "route",
  "type": "line",
  "slot": "middle",
  "source": "route",
  "paint": { "line-color": "#3b6df5", "line-width": 4, "line-emissive-strength": 1, "line-occlusion-opacity": 1 }
}
```

**Emissive strength `1` on every custom fill / line / circle layer**, or it nearly vanishes at `dusk`/`night` — `fill-`, `line-`, `circle-emissive-strength` all default to `0`. **Symbol layers need nothing**: `icon-`/`text-emissive-strength` already default to `1`. 3D `fill-extrusion` layers are scene-lit and don't need it either.

## Use-case config

| Use case   | Config                                                                       |
| ---------- | ---------------------------------------------------------------------------- |
| General    | Standard as it ships — change nothing                                        |
| Navigation | `theme:'default'`, 3D on, road + place labels on, `showPedestrianRoads:true` |
| Data viz   | `theme:'monochrome'` (or `light-2d`/`dark-2d` styles), POIs off, 3D off      |
| Outdoors   | The `outdoors` / `outdoors-winter` **styles**, not a config                  |
| Tourism    | `theme:'default'`, POIs at density 4, landmarks on, 3D on                    |

## Basemap ladder — cheapest rung first

1. In-config `theme` (`default`/`faded`/`monochrome`/`custom`) — instant, no reload
2. Standalone Standard-based styles from the [gallery](https://www.mapbox.com/gallery) — `light-2d`, `dark-2d`, `outdoors`, `outdoors-winter` (copy to your account)
3. Classic styles — `streets-v12`, `light-v11`, `dark-v11`, `outdoors-v12`, `satellite-v9`, `satellite-streets-v12`. 2D, **no slots, no config**. Only for a server-rendered raster (the Static Images API can't render Standard), per-layer paint control config can't express, or a deliberate 2D fallback.

## Visual hierarchy

1. User content (routes, selections, location, markers) → 2. POIs & labels → 3. Roads → 4. Buildings → 5. Land/water

**Figure-ground:** when your data isn't popping, **desaturate the basemap, not the data** — `theme:'faded'` or `'monochrome'`.

## Color

| Key              | Start from                      |
| ---------------- | ------------------------------- |
| `colorLand`      | `hsl(28, 15%, 95%)`             |
| `colorBuildings` | `hsl(35, 18%, 87%)`             |
| `colorRoads`     | `hsl(218, 18%, 72%)`            |
| `colorWater`     | `hsl(202, 75%, 70%)`            |
| `colorMotorways` | 5–8% L darker than `colorRoads` |

- **Brand color goes on routes, markers, and pins — never on basemap roads, water, or land.** The single most common map-design mistake.
- Keep a clear lightness step between land and roads; motorways a step darker than local roads.
- Water distinguished by **hue + saturation**, not lightness: S ≥ 60% light themes, ≥ 35% dark.
- **Sequential**: Blues, Greens, Oranges, YlOrRd, BuPu. **Diverging**: RdBu, PuOr, BrBG — **never RdGn**. **Qualitative** (≤8): Set1, Set2, Paired, Dark2. **Never rainbow for ordered data.** Choropleth `fill-opacity ≤ 0.7`.
- **WCAG AA**: 4.5:1 normal text, 3:1 large text and road lines. Never color alone; test with a deuteranopia simulator.

## Dark mode

`lightPreset:'night'` is a complete dark basemap on its own. Bind it to the OS/UI appearance signal.

- **Config colors are DAY values** — Standard re-derives them per preset. **Never hand it an already-dark color**; a night-tuned `colorLand` double-darkens to near-black.
- **Your own layers don't adapt** — they need emissive strength.
- **Never** CSS `invert()` (web), a second dark style, or a hand-built parallel night palette.

## Typography

One family, two weights max. DIN Pro is Standard's default. Heavier weight + thin halo beats thin font + thick halo. Italic for water bodies. Placement: upper-right first, upper-left second. When labels conflict, **drop the lower-priority label — don't shrink it.**

```
Place labels 11–14px    Street labels 9–11px    Feature labels 10–12px
Map title 16–20px       Attribution 8–9px
```

## Zoom

| Zoom  | Belongs here                                                   |
| ----- | -------------------------------------------------------------- |
| 0–4   | Country boundaries, ocean labels, capitals                     |
| 5–8   | State lines, major cities, major highways, large water         |
| 9–11  | City boundaries, neighborhoods, all highways, parks, landmarks |
| 12–15 | All streets, building footprints, POIs, street names           |
| 16–22 | House numbers, parking lots, fine-grained amenities            |

**Zoom continuity:** never a hard `minzoom`/`maxzoom` pop. Keep the bound for the GPU saving, but set it 1–2 levels below where the layer should appear and fade opacity across that band. 3D buildings fade in from z13, never below.

```json
"fill-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0, 12, 1]
```

> `visibility` is a plain enum and does **not** accept expressions.

## Markers

Two independent decisions. Count answers the first, not the second.

**1. How to render — cost:**

| Count                               | Approach                                                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| < ~100                              | View/annotation marker (per-element interaction, DOM/CSS control on web)                                               |
| ~100+                               | GL layer — `circle` or `symbol`, GPU-drawn, smooth into the tens of thousands (`circle` is cheaper: no collision work) |
| Thousands, or payload past a few MB | Vector tileset — only the viewport loads; markers no longer an option                                                  |

**2. Whether to aggregate — legibility, not dataset size:** cluster when points **visibly overlap at the zooms users actually use**. 300 pins on one block need it; 50,000 sparse points across a continent may not. No point count makes clustering correct on its own — look at the map. If rendering _cost_ is the problem, the fix is a tileset, not clustering.

- Anchor to lng/lat, never screen pixels.
- `icon-allow-overlap: true` when every icon must be visible (the default hides colliding icons — the #1 cause of "my icons disappeared"). `text-optional: true` so labels drop before icons. `icon-size` as a zoom expression, never a flat number.
- **SDF** images for single-color tintable icons; don't bake gradients into icon images.

## Classic styles & raw style JSON only

Layer order bottom→top: background, land use, water, terrain/hillshade, buildings, roads, borders, labels, POI symbols, user content.

| Layer key           | Light theme             | Dark theme                 | What must hold                         |
| ------------------- | ----------------------- | -------------------------- | -------------------------------------- |
| `background` (land) | L 94–97%, slightly warm | L 8–14%, neutral to cool   | Never pure white or pure black         |
| `roads`             | Clear step from land    | L 20–28%                   | Or street names appear to float        |
| `buildings`         | 3–8% L darker than land | 3–8% L lighter than land   | Never competes with roads              |
| `water`             | Hue 195–210°, S ≥ 60%   | Same hue, S ≥ 35%          | Hue + saturation, not lightness alone  |
| `parks`             | Muted green, S ≤ 35%    | Muted green, L 18–25%      | Quieter than water                     |
| `text`              | L 20–30%, not `#000`    | L 90–100% with a dark halo | 4.5:1 against every surface it crosses |

## LUT color themes

`theme: 'custom'` + `theme-data` (base64 PNG cube-strip). **A LUT is applied last and overrides everything** — it regrades your own layers along with the basemap. Tune it last; scope it to the `basemap` import if a layer must hold an exact color.

## Symptom → cause

| Symptom                                    | Cause                                                  |
| ------------------------------------------ | ------------------------------------------------------ |
| Custom layer covers the street labels      | Missing `slot`                                         |
| Fill/line/circle invisible at dusk/night   | Missing `*-emissive-strength: 1` (defaults to `0`)     |
| Route disappears behind 3D buildings       | Missing `line-occlusion-opacity`                       |
| Dark map came out solid black              | Pre-darkened `color*` override + `lightPreset:'night'` |
| Icons randomly missing                     | `icon-allow-overlap` defaults to `false`               |
| Street names float with no road under them | No lightness step between land and roads               |

> Anything DOM/CSS-based (HTML markers, CSS transforms/filters, `invert()`) is **Web / GL JS only** — never universal advice.
