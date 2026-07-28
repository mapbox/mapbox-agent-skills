# Data sources, budgets & design QA

Read this when deciding how to get data onto the map, when a map is slow or markers drift on pan, or when
reviewing a map before it ships.

## Data-source tiers — pick by scale, not by habit

| What you're asking for                                                                                                | Use                                                | Why                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A few unique named places ("the best coffee downtown", "the Ferry Building")                                          | A **category / POI search** request                | Returns a capped, ranked result set. It is not a way to enumerate a class — don't use it for "all X".                                                  |
| A whole feature class ("all restaurants", "every building")                                                           | A **vector tileset source + a filtered layer**     | Renders every feature at any zoom with payload proportional to the viewport, not to the dataset. Never fetch a whole class as one global GeoJSON blob. |
| A category Mapbox doesn't index (benches, defibrillators, hydrants, trees), or denser coverage than the POI index has | An **OSM / Overpass** extract converted to GeoJSON | The fallback tier. Bound the bbox, run it at build time rather than per page load, and attribute "© OpenStreetMap contributors (ODbL)".                |
| Data you own, updated per session                                                                                     | **GeoJSON source**, within the limits below        | Simplest path, but it scales with the dataset, not the viewport.                                                                                       |

## Budgets

These are the thresholds where a design decision becomes a performance decision:

- **GeoJSON source:** ≤ 500 features / ≤ 500 KB. Past that, build a vector tileset.
- **Clustering:** enable above ~100 point features (`cluster: true`), or icons collide into an unreadable mass.
- **Custom layers:** ≤ 15. Each layer is a draw call per frame — combine variants with a `match` / `case`
  expression on one layer instead of adding a layer per category.
- **Markers by count** (repeated from SKILL.md because it's the decision people get wrong most often):
  - < 100 → a view/annotation marker
  - 100 – 1,000 → a symbol layer
  - 1,000 – 100,000 → a clustered symbol/circle layer
  - \> 100,000 → a vector tileset
- **Icons:** one sprite sheet, SDF for anything tintable. Don't register images one-by-one at runtime.
- **Geometry:** simplify at low zoom in the tileset, not in the style — the style can't undo a heavy tile.

## Web / GL JS only — marker drift

These apply to `mapboxgl.Marker` and DOM overlays. Android and iOS view annotations are SDK-positioned and don't
have this compositor problem, so never give this as cross-platform advice.

- Never position `absolute` divs over the map yourself — they drift on pan and zoom, because the canvas moves and
  the overlay doesn't.
- Never set `transform`, `transition: transform`, or `will-change: transform` on the Marker **root** element. GL JS
  writes `transform: translate()` to that element on every camera move. Put your visuals and hover animation on an
  **inner child**.
- For shadows and selection states use `border` / `background` / `box-shadow` only — not `filter`,
  `drop-shadow`, `scale`, or `transform`. Each of those spawns a compositor layer, which is what produces the drift.
- Don't `flyTo` with a zoom change when a marker is selected; `easeTo` (pan only) keeps the marker under the cursor.
- Don't fake dark mode with CSS `invert()` on the map container — it destroys route and label legibility. Set
  `lightPreset:'night'` instead.

## Design QA checklist

Run this before shipping a map.

**Layer placement (Standard)**

- [ ] Every custom layer sets an explicit `slot` — a layer with no slot lands above everything, including labels.
- [ ] Markers and active selections are in `slot:'top'`; routes, choropleths, and custom POI layers are in
      `slot:'middle'`.
- [ ] Every non-3D custom layer sets `fill-emissive-strength` / `line-emissive-strength: 1`, or it disappears at
      `dusk` and `night`.
- [ ] A route that must survive 3D buildings sets `line-occlusion-opacity`.

**Color**

- [ ] Brand color appears on data only — routes, markers, pins — and on zero basemap layers.
- [ ] Land and roads sit at clearly different lightness values (otherwise: floating labels).
- [ ] Water is separated by hue and saturation, not lightness alone.
- [ ] Motorways are a step darker than local roads.
- [ ] No `color*` override was authored as an already-dark value in order to "get dark mode" — that
      double-darkens under `night`.
- [ ] Text meets 4.5:1 against every surface it crosses (3:1 for large text and road lines).
- [ ] Checked in a deuteranopia simulator; nothing is distinguished by red-vs-green alone.
- [ ] Choropleth `fill-opacity` ≤ 0.7 so the road network still gives context, and the ramp is sequential or
      diverging — never rainbow.

**Symbols and labels**

- [ ] `icon-size` is a zoom-interpolate expression, not a flat number.
- [ ] `text-optional: true` so labels drop before icons under collision.
- [ ] `text-variable-anchor` set so labels don't sit on top of their own icons.
- [ ] Icons encode category by shape and color — not one identical pin for everything.

**Scale and data**

- [ ] No hard `minzoom` / `maxzoom` cutoffs on custom layers; features fade over 1–2 zoom levels.
- [ ] 3D buildings fade in at z13 or above, never below.
- [ ] Source and layer counts are inside the budgets above.

**Verification passes**

- [ ] Viewed at every zoom the product actually uses, with real data density — not a three-feature fixture.
- [ ] Viewed under `day` and under `night` if the app has a dark theme.
- [ ] Checked on a real mid-range device, not just a desktop browser.
- [ ] Touch targets ≥ 44 × 44 px on mobile.
