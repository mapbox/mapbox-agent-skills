---
name: mapbox-cartography
description: Platform-independent guidance on Mapbox map design — the Standard style and its config-first workflow (themes, light presets, slots, color overrides), and Classic styles and raw style JSON (layer order, palette relationships), plus color, visual hierarchy, typography, and cartographic best practice. Applies across Mapbox GL JS (web), Maps SDK for Android, Maps SDK for iOS, and Maps SDK for Flutter. Use when designing map styles, choosing a theme or light preset, placing custom layers, setting up dark mode, restyling a Classic style, or making cartographic decisions.
---

# Mapbox Cartography Skill

Map design guidance for Mapbox — legibility, color, visual hierarchy, and typography. The recommended
workflow is to configure the **Standard** style rather than author a style from scratch. Applies equally to
**Mapbox GL JS** (web), **Maps SDK for Android**, and **Maps SDK for iOS**.

It also covers **Classic** styles and raw style JSON, where you author the layer stack yourself — see
[Classic styles & raw style JSON](#classic-styles--raw-style-json). Sections that apply to only one style family
are labeled.

All of it is **platform-independent**. The **style spec is the shared contract** — sources, layers, slots, and
paint/layout **expressions are the same JSON on every SDK**, so every layer and expression example below is shown
as style-spec JSON. Only the _imperative_ calls differ; those are in the
[cross-platform API reference](#appendix-cross-platform-api-reference).

## Start here: Standard style + config-first

**Default to the Standard style** — `mapbox://styles/mapbox/standard` (short form `mapbox/standard`; the URL is
identical on all three SDKs). Sibling: `mapbox/standard-satellite` — satellite imagery with roads, labels, and boundaries drawn on top.

**Config-first is the core principle:** Standard config covers ~95% of design needs. Adjust **config properties**
at runtime instead of swapping the whole style — set the property, don't reload the style. Only drop to a Classic
style when you need per-layer paint expressions that config can't express.

- **Web:** use `setConfigProperty` — never `setStyle()` for incremental change.
- **Android / iOS:** use `setStyleImportConfigProperty` — never a full style reload for incremental change.

**Design for day mode first.** Standard handles the other presets for you — it shifts basemap colors along with
the lighting — so author your palette and custom layers against `day` and leave `lightPreset` alone by default.

**Set `lightPreset` when it carries meaning, not for decoration.** Two cases:

- **Dark theme / dark mode** — if the app has a dark theme or follows the OS appearance, the map should follow it:
  `lightPreset:'night'` (or `'dusk'` for a softer, still-lit look). Bind it to the same signal that drives the
  rest of your UI (`prefers-color-scheme` on web, `UITraitCollection` / `uiMode` on iOS / Android).
- **Mood** — `dawn` / `dusk` when the user explicitly asks for a time-of-day feel.

`lightPreset:'night'` is enough for a dark basemap on its own — your `color*` overrides are day values and the
style adapts them with the preset. What it doesn't carry over is your **own layers** — see
[Dark mode](#dark-mode).

## The config surface

These config keys and values are **identical across GL JS / Android / iOS** — only the setter call differs. The
import id is always `"basemap"`.

- **`lightPreset`**: `dawn | day | dusk | night` — lighting, atmosphere, **and** the basemap colors that follow
  from them (see [Dark mode](#dark-mode)).
- **`theme`**: `default | faded | monochrome | custom` — in-config substyles (`custom` takes a LUT, which
  regrades every color it covers and overrides the rest of this list; see
  [Custom color themes](#appendix-custom-color-themes-lut)).
- **`font`**: `DIN Pro` (default).
- **Visibility toggles (global booleans, not zoom toggles):** `showPlaceLabels`, `showPointOfInterestLabels`,
  `showRoadLabels`, `showTransitLabels`, `showLandmarkIcons`, `show3dObjects`, `show3dBuildings`,
  `show3dLandmarks`, `showPedestrianRoads`.
- **Numeric:** `densityPointOfInterestLabels` `1–5`.
- **Color overrides:** `colorLand`, `colorWater`, `colorGreenspace`, `colorRoads`, `colorTrunks`,
  `colorMotorways`, `colorBuildings`, `colorPlaceLabels`, `colorPointOfInterestLabels`, `colorRoadLabels`.

A Standard config object (the `config.basemap` block is the same everywhere):

```json
{
  "style": "mapbox://styles/mapbox/standard",
  "config": {
    "basemap": {
      "lightPreset": "day",
      "theme": "faded",
      "showPlaceLabels": true,
      "colorWater": "hsl(202, 75%, 70%)"
    }
  }
}
```

## Common use cases

Start from the use case that matches what you're building. Config keys are identical on all SDKs. Shorthand:
**3D** = `show3dObjects`, **POIs** = `showPointOfInterestLabels`, **landmarks** = `showLandmarkIcons`.

| Use case               | Config                                                                                                 | Why                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **General purpose**    | Standard as it ships — `theme:'default'`, 3D on                                                        | A browsable, self-explanatory map. If nothing below fits, stay here and change nothing.                                                                  |
| **Navigation**         | `theme:'default'`; 3D on; road + place labels on; `showPedestrianRoads:true` for last-mile and walking | The route and the next maneuver must dominate. Landmarks orient the driver, and 3D earns its cost at z16+, where a footprint identifies the destination. |
| **Data visualization** | `theme:'monochrome'` (or the `light-2d` / `dark-2d` styles); POIs off; 3D off                          | The base is a canvas, not the subject. POIs compete with the thematic layer for attention and 3D occludes it outright.                                   |
| **Outdoors**           | The `outdoors` / `outdoors-winter` **styles** — not a config; 3D on                                    | Trails, contours, and terrain shading aren't reachable through Standard config, so this is a style choice rather than a config one.                      |
| **Tourism & travel**   | `theme:'default'`; POIs on at density 4; landmarks on; 3D on                                           | Here the basemap _is_ the content — POIs and landmarks are what the user came to browse, and 3D landmarks make a place recognizable.                     |

## Substyles & basemaps — priority ladder

Pick the cheapest rung that meets the need, top to bottom:

1. **In-config `theme` values** (`default`/`faded`/`monochrome`/`custom`) — instant, no reload,
   no new style. Reach here first (e.g. `theme:'faded'` or `'monochrome'` for data-overlay maps).
2. **Standalone Standard-based styles** hosted under `mapbox-map-design` — `dark-2d` and `light-2d`
   (purpose-built for data viz / choropleths), `outdoors` (trails, contours, terrain), and `outdoors-winter`
   (ski runs, alpine). These are **full styles, not `theme:` values**. Find them in the
   [Mapbox gallery](https://www.mapbox.com/gallery), copy one to your own account, and reference your copy
   (`yourusername/styleId`) in production.
3. **[Classic styles](https://docs.mapbox.com/map-styles/guides/)** — `streets-v12`, `light-v11`, `dark-v11`,
   `outdoors-v12`, `satellite-v9`, `satellite-streets-v12`. 2D, no slots, no config surface; you restyle them by
   editing layer paint expressions. Reach for one when you need a server-rendered raster (the Static Images API
   can't render Standard), per-layer paint control config can't express, or a deliberate 2D / low-power fallback.
   See [Classic styles & raw style JSON](#classic-styles--raw-style-json).

## Visual hierarchy

Guide the viewer's attention to what matters most. The strict order (highest priority first):

1. **User content** — routes, active selections, the user's location, markers (see slots below for exact z-order)
2. **POIs & place/road labels**
3. **Roads**
4. **Buildings**
5. **Land / land use / water** (background)

**Figure-ground:** the subject must visually separate from its context. Desaturate the base and keep data vivid.
When your data isn't popping, **lighten/desaturate the basemap, not the data** — `theme:'faded'` or
`'monochrome'` is the fastest way to do this. `colorBuildings` should be lighter than `colorRoads` in day mode so
structures read as floating above the road network.

### Placing custom layers on Standard: slots + emissive

On Standard, Mapbox owns the basemap layer order — you don't hand-order it. Insert each _custom_ layer into one of
three **slots**, using `slot` rather than a `beforeId` against basemap layers. `slot` is a style-spec property, so
the value is the same string on every SDK:

| Slot     | Position in the Standard stack                          | Put here                                                                                                       |
| -------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `bottom` | Above land / landuse / water polygons, **below** roads  | Rasters, terrain, choropleth fills that belong under the road network                                          |
| `middle` | Above roads & lines, **behind** 3D buildings and labels | Most data overlays — polygon fills, geofences, zone boundaries, heatmaps; **routes** and **custom POI layers** |
| `top`    | Above POI labels, **behind** place & transit labels     | Markers and active selections                                                                                  |

- A layer with **no slot lands on top of everything** — rarely right for a fill or raster, so **always set a
  slot explicitly**.
- The `top` slot is designed for **symbol layers** (markers, active selections). Put **routes and custom POI
  layers in `middle`** — a route in `middle` reads above roads but under all labels and 3D buildings, so labels
  stay legible; add `line-occlusion-opacity` so buildings don't hide it.
- Two layers in the same slot keep their insertion order (or use a `beforeId` that is itself inside that slot).
- Add **emissive strength `1`** to every non-3D custom **fill, line, and circle** layer, or it goes nearly
  invisible at `dusk`/`night`: `fill-emissive-strength`, `line-emissive-strength`, `circle-emissive-strength`.
  These default to `0`, so the layer is lit by the scene and falls into shadow. **Symbol layers need nothing** —
  `icon-emissive-strength` and `text-emissive-strength` already default to `1`, so icons and labels stay legible
  across all four presets on their own.

Style-spec JSON (shared) — a choropleth and a route, both in `middle`:

```json
{ "id": "zones", "type": "fill", "slot": "middle", "source": "zones",
  "paint": { "fill-color": "#7b61ff", "fill-opacity": 0.6, "fill-emissive-strength": 1 } }

{ "id": "route", "type": "line", "slot": "middle", "source": "route",
  "paint": { "line-color": "#3b6df5", "line-width": 4, "line-emissive-strength": 1, "line-occlusion-opacity": 1 } }
```

Docs: [Work with layers — slots](https://docs.mapbox.com/mapbox-gl-js/guides/styles/work-with-layers/) ·
[Add a layer to a slot](https://docs.mapbox.com/mapbox-gl-js/example/geojson-layer-in-slot/) ·
[iOS: change a layer's slot](https://docs.mapbox.com/ios/maps/examples/layer-slot/)

## Color

**Standard color overrides (day mode).** Standard's defaults are already tuned — override only when brand or
product needs demand it. Starting values that satisfy the rules below:

| Config key       | Start from                      |                               |
| ---------------- | ------------------------------- | ----------------------------- |
| `colorLand`      | `hsl(28, 15%, 95%)`             | warm, desaturated, very light |
| `colorBuildings` | `hsl(35, 18%, 87%)`             | a step darker than land       |
| `colorRoads`     | `hsl(218, 18%, 72%)`            | cool blue-gray                |
| `colorWater`     | `hsl(202, 75%, 70%)`            | blue, clearly saturated       |
| `colorMotorways` | 5–8% L darker than `colorRoads` |                               |

Rules that keep a map readable:

- **Brand color goes on routes, markers, and pins — never on basemap roads, water, or land.** (This is the single
  most common map-design mistake.)
- Keep a **clear lightness step between land and roads** — which one is lighter is a style convention, but they
  must never sit at the same value. Motorways always a step darker than local roads.
- Keep water distinguished by **hue + saturation**, not lightness alone — S ≥ 60% in light themes, ≥ 35% in dark
  ones, where a high saturation floor isn't realistic for a dark surface.
- **Accessibility:** WCAG AA — 4.5:1 for normal text, 3:1 for large text and road lines. Don't rely on color
  alone; test with a **deuteranopia** simulator; never use red+green as the sole distinction.

### ColorBrewer for data layers

- **Sequential** (one-direction data): Blues, Greens, Oranges, YlOrRd, BuPu.
- **Diverging** (bidirectional / political): RdBu, PuOr, BrBG — **never RdGn** (colorblind failure).
- **Qualitative** (categories, ≤ 8): Set1, Set2, Paired, Dark2.
- **Never** use rainbow/spectral for ordered data — rainbow has no perceptual ordering. Keep choropleth
  `fill-opacity ≤ 0.7` so the road network shows through for context.

## Dark mode

**`lightPreset:'night'` gives you a real dark basemap.** Standard shifts land, buildings, water, and roads along
with the lighting, so the preset on its own is a legitimate dark mode — start there rather than hand-building a
dark palette.

**Config colors are day values — Standard adapts them.** Every `color*` override is interpreted as its _day_
appearance, and the style re-derives it for whichever preset is active. So author the overrides once, against
`day`, and let the preset handle the rest; there is no parallel night set of config colors to maintain.

The failure mode this creates: **never hand Standard an already-dark color.** A night-tuned `colorLand` gets
darkened _again_ under `night` and collapses to near-black. If a dark surface looks black, check whether you're
double-darkening it rather than reaching for a darker value.

What the preset does **not** adapt is **your own layers** — they keep the paint colors you gave them, and without
`fill-emissive-strength` / `line-emissive-strength: 1` they fall into shadow and go nearly invisible.

**Don't fake dark mode by inverting the rendered map** — web CSS `invert()` is the classic offender, and it breaks
route and label legibility. Set `lightPreset:'night'` instead.

## Typography

**One font family, two weights max** for map labels (regular + medium/bold). DIN Pro is Standard's default —
match it in your own symbol layers rather than introducing a second family. `text-font` takes a **fontstack**, not
a font name: list your intended face first and a Unicode fallback second (e.g.
`["DIN Pro Medium", "Arial Unicode MS Bold"]`), and confirm the exact face exists for your account, since a face
that can't be resolved silently falls through to the next entry. Use
serif or monospace _only_ as deliberate exceptions for map furniture — a title block or a coordinate readout —
labeled as such; don't mix families across the label set (it reads as noise on an already busy map).

- **Weight-vs-halo:** medium/bold weight + a subtle thin halo = a clean signal. A thin font + a bright/thick
  outline = a noise trap. When unsure, go heavier on weight, lighter on halo.
- **Italic** is reserved for water-body labels. Some styles set road labels in caps to separate them from place
  names; Standard uses mixed case — treat it as a style choice, not a rule.
- **Placement:** upper-right first, upper-left second. Point labels center or slightly offset; line labels
  follow the curve and repeat; area labels center in the polygon.
- When labels conflict, **drop the lower-priority label — don't shrink it.**

Text sizing:

```
Place labels (cities, POIs): 11–14px      Map title: 16–20px
Street labels: 9–11px                     Attribution: 8–9px
Feature labels (parks): 10–12px
```

## Zoom strategy

A general scale reference for what belongs at each zoom. On Standard the basemap already does this for you —
consult it when authoring **your own layers**, or a Classic style, and use it to judge whether a custom layer is
showing detail the scale can't support:

| Zoom  | Scale             | Belongs here                                                    |
| ----- | ----------------- | --------------------------------------------------------------- |
| 0–4   | World → continent | Country boundaries, ocean/sea labels, capital cities            |
| 5–8   | Country → state   | State/province lines, major cities, major highways, large water |
| 9–11  | Metro area        | City boundaries, neighborhoods, all highways, parks, landmarks  |
| 12–15 | Neighborhood      | All streets, building footprints, POIs, street names            |
| 16–22 | Street level      | House numbers, parking lots, fine-grained amenities             |

**Zoom continuity** is the rule that always applies to your layers: never use hard `minzoom`/`maxzoom` cutoffs —
fade features in and out over 1–2 zoom levels. 3D buildings should fade in starting at z13, never below. These are
style-spec expressions (same on all SDKs):

```json
"fill-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0, 12, 1]      // fade in
"line-opacity": ["interpolate", ["linear"], ["zoom"], 15, 1, 16, 0]      // fade out
"line-width":   ["interpolate", ["linear"], ["zoom"], 10, 1, 16, 4]      // scale with zoom
```

## Markers & symbols

Two **independent** decisions here. Point count answers the first one; it does not answer the second.

**1. How to render — driven by cost.**

- **< ~100** → a view/annotation marker (per-element interaction, full DOM/CSS control on web). Each one is a
  real element; several hundred make a browser sluggish.
- **~100+** → a **GL layer** (`circle` or `symbol`), drawn on the GPU. Hundreds of points cost essentially
  nothing, and these layers stay smooth well into the tens of thousands. `circle` is cheaper than `symbol` —
  no label placement or collision work.
- **Thousands of points, or a payload past a few MB** → a **vector tileset**, so only the current viewport
  loads instead of the whole dataset up front. Once you're on tiles, markers are no longer an option.

**2. Whether to aggregate — driven by legibility, not by dataset size.**

**Cluster when points visibly overlap at the zooms your users actually use.** 300 pins on one city block need
clustering at z12; 50,000 points spread across a continent may not need it at all. Decide by looking at the
map, not at the row count — there is no point count that makes clustering correct on its own. (Clustering does
cut per-frame work as a side effect, but that's rarely the reason to reach for it — if rendering cost is the
problem, the fix on axis 1 is a tileset.)

- **Coordinate-anchor principle:** anchor markers to lng/lat, never to screen pixels, so they track pan/zoom.
- **Symbol-layer properties (style spec, identical everywhere):** set `icon-allow-overlap: true` when every icon
  must be visible (the default hides colliding icons — the #1 cause of "my icons disappeared"); set
  `text-optional: true` so labels drop before icons in collision; make `icon-size` a zoom-interpolate expression,
  never a flat number. Use **SDF** images for single-color tintable icons (color via `icon-color`); don't bake
  gradient fills into icon images (they turn muddy after rasterization).
- **Per-platform small-set marker widget:** Web `mapboxgl.Marker({element})`; Android `ViewAnnotationManager`
  (custom view) or `PointAnnotationManager` (bitmap); iOS `ViewAnnotation` or `PointAnnotationManager`. For 100+,
  switch to a symbol layer on every platform.

## Classic styles & raw style JSON

Everything in this section applies **only** to non-Standard styles — Classic styles and raw style JSON you author
yourself. On Standard, use config overrides and slots instead.

### Layer order

You author the full stack, bottom to top:

1. Background (solid color or pattern)
2. Land use (parks, residential, commercial)
3. Water bodies (oceans, lakes, rivers)
4. Terrain / hillshade (if using elevation)
5. Buildings (3D or 2D footprints)
6. Roads (highways → local streets)
7. Borders (country, state lines)
8. Labels (place names, street names)
9. POI symbols
10. User-generated content (routes, markers)

### Palette

Classic layer keys map onto Standard's config keys roughly as: `background` → `colorLand`, `water` →
`colorWater`, `roads` → `colorRoads` (+ `colorMotorways`), `parks` → `colorGreenspace`, `buildings` →
`colorBuildings`, `text` → `colorPlaceLabels`/`colorRoadLabels`/`colorPointOfInterestLabels`.

Build a palette that satisfies these relationships rather than copying fixed values (`L` / `S` are HSL lightness
and saturation):

| Layer key           | Light theme                                                                                                                    | Dark theme                                  | What must hold                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `background` (land) | L 94–97%, slightly warm                                                                                                        | L 8–14%, neutral to cool                    | Never pure white or pure black                                                                                                           |
| `roads`             | A clear step from land — either near-white over gray land or mid blue-gray over near-white land; pick one convention per style | L 20–28%                                    | Visibly separated from land, or you get "floating labels" — street names with no road under them                                         |
| `buildings`         | 3–8% L darker than land                                                                                                        | 3–8% L lighter than land                    | Reads as background mass, never competes with roads                                                                                      |
| `water`             | Hue 195–210°, S ≥ 60%                                                                                                          | Same hue, S ≥ 35%, a step lighter than land | Distinguished by hue + saturation, not lightness alone                                                                                   |
| `parks`             | Muted green, S ≤ 35%                                                                                                           | Muted green, L 18–25%                       | Quieter than water                                                                                                                       |
| `text`              | L 20–30%, not `#000`                                                                                                           | L 90–100% with a dark halo                  | 4.5:1 against every surface it crosses; in dark themes halos do the legibility work, since land/road separation runs below 3:1 by design |

High Contrast (Accessibility **only** — not for general use):

```json
{
  "background": "#000000",
  "water": "#0066ff",
  "parks": "#00ff00",
  "roads": "#ffffff",
  "buildings": "#808080",
  "text": "#ffffff"
}
```

## Appendix: cross-platform API reference

The style spec is shared; only these imperative calls differ per platform.

| Operation                          | Web (GL JS)                                                      | Android (Kotlin)                                                                         | iOS (Swift)                                                                                         |
| ---------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Set a Standard config property     | `map.setConfigProperty('basemap', k, v)`                         | `style.setStyleImportConfigProperty("basemap", k, Value.valueOf(v))`                     | `mapView.mapboxMap.setStyleImportConfigProperty(for: "basemap", config: k, value: v)`               |
| Set initial config at map creation | `new mapboxgl.Map({ style, config: { basemap: {…} } })`          | `mapboxMap.loadStyle(Style.STANDARD) { style -> style.setStyleImportConfigProperty(…) }` | `Map { }.mapStyle(.standard(lightPreset: .day))` (SwiftUI)                                          |
| Add a layer to a slot              | `map.addLayer({ id, type, slot: 'middle', source, paint })`      | `style.addLayer(fillLayer("zones", "zones") { slot("middle") })`                         | `layer.slot = .middle; try mapView.mapboxMap.addLayer(layer)`                                       |
| Register an image                  | `map.addImage('id', img)`                                        | `style.addImage("id", bitmap)`                                                           | `try mapView.mapboxMap.addImage(uiImage, id: "id")`                                                 |
| Coordinate-anchored marker (<100)  | `new mapboxgl.Marker({element}).setLngLat([lng,lat]).addTo(map)` | `viewAnnotationManager.addViewAnnotation(view, opts)` / `PointAnnotationManager`         | `ViewAnnotation` via `mapView.viewAnnotations` / `mapView.annotations.makePointAnnotationManager()` |
| 100+ markers                       | symbol layer (style spec)                                        | symbol layer (style spec)                                                                | symbol layer (style spec)                                                                           |

> Anything DOM/CSS-based (HTML markers, CSS transforms/filters, CSS `invert()`) is **Web / GL JS only** and is
> labeled as such wherever it appears — never apply it as universal advice.

**Flutter** (Maps SDK for Flutter) follows the same contract, through `mapboxMap.style`:
`MapWidget(styleUri: MapboxStyles.STANDARD)` to load it,
`style.setStyleImportConfigProperty("basemap", key, value)` for config,
and a `slot` argument on the layer constructor (`FillLayer(..., slot: "middle")`) for placement.

## Appendix: custom color themes (LUT)

For a global mood beyond `default`/`faded`/`monochrome`, set `theme` to `custom` and supply a **LUT (look-up
table)** as the `theme-data` config property. A LUT is **not a set of numeric sliders** — it is a base64-encoded
PNG "cube-strip" that remaps every color on the map, so the mood is baked into the image itself. Produce it in an
image editor or LUT tool starting from a neutral identity LUT.

**A LUT is applied last, and it overrides everything.** It regrades the final color of the map, so it sits on top
of your `color*` config overrides _and_ the paint colors of your own layers — a graded map will shift your brand
color, route line, and marker hues along with the basemap. Three consequences:

- **Tune the LUT last**, after config and custom layers are settled; otherwise you're chasing colors that the
  grade is about to change.
- **Scope it deliberately.** Applied to the `basemap` import (via `theme:'custom'` + `theme-data`) it grades the
  basemap only. Applied at style level (`color-theme`) it grades the whole style and its imports — your layers
  included.
- If a layer must hold an exact color — a brand route, a category-coded ramp — either scope the LUT to the
  basemap or don't use one.

`color-theme` is the style-level form:

- Style JSON: `"color-theme": { "data": "<base64 PNG>" }`
- Web (GL JS): `map.setColorTheme({ data: '<base64 PNG>' })`
- Android: `mapboxMap.setStyleColorTheme(base64 = "<base64 PNG>")` (or `bitmap = …`)
- iOS: `try mapView.mapboxMap.setColorTheme(ColorTheme(uiimage: UIImage(named: "lut")!))`

Docs: [Create a custom color theme (LUT)](https://docs.mapbox.com/help/tutorials/create-a-custom-color-theme/) ·
[iOS color theme](https://docs.mapbox.com/ios/maps/examples/color-theme/) ·
[Android color theme](https://docs.mapbox.com/android/maps/examples/android-view/using-color-theme/)
