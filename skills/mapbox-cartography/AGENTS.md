# Mapbox Cartography Principles

Quick reference for map design on Mapbox: the Standard style's config surface, slot placement, color, dark mode,
and accessibility. Platform-independent — the style spec is shared across GL JS, Android, and iOS; only the
imperative calls differ.

## Config-first

Default to `mapbox://styles/mapbox/standard`. Standard config covers ~95% of design needs — change a **config
property**, never reload the style.

```javascript
// ✅ Adjust the running style
map.setConfigProperty('basemap', 'theme', 'faded');

// ❌ Reloads everything, drops your layers and camera
map.setStyle('mapbox://styles/mapbox/standard');
```

Android: `style.setStyleImportConfigProperty("basemap", key, Value.valueOf(v))`.
iOS: `mapView.mapboxMap.setStyleImportConfigProperty(for: "basemap", config: key, value: v)`.
The import id is always `"basemap"` and the keys are identical on all three SDKs.

**Config keys**

- `lightPreset`: `dawn | day | dusk | night` — lighting, atmosphere, and the basemap colors that follow from them
- `theme`: `default | faded | monochrome | custom`
- `font`: `DIN Pro` (default)
- Toggles: `showPlaceLabels`, `showPointOfInterestLabels`, `showRoadLabels`, `showTransitLabels`,
  `showLandmarkIcons`, `show3dObjects`, `show3dBuildings`, `show3dLandmarks`, `showPedestrianRoads`
- Numeric: `densityPointOfInterestLabels` (1–5)
- Colors: `colorLand`, `colorWater`, `colorGreenspace`, `colorRoads`, `colorTrunks`, `colorMotorways`,
  `colorBuildings`, `colorPlaceLabels`, `colorPointOfInterestLabels`, `colorRoadLabels`

Author against `day`. Standard re-derives your colors for the other presets.

## Visual hierarchy

Highest priority first:

1. User content — routes, selections, user location, markers
2. POIs and place/road labels
3. Roads
4. Buildings
5. Land / land use / water

**Figure-ground:** when the data isn't popping, quiet the basemap (`theme:'faded'` or `'monochrome'`) rather than
brightening the data.

## Slots — placing custom layers on Standard

Mapbox owns basemap layer order. Insert custom layers with `slot`, not a `beforeId` against basemap layers.

| Slot     | Position                                      | Put here                                                          |
| -------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `bottom` | Above land/water, below roads                 | Rasters, terrain, choropleths that belong under roads             |
| `middle` | Above roads, behind 3D buildings and labels   | Data overlays, geofences, heatmaps, **routes**, custom POI layers |
| `top`    | Above POI labels, behind place/transit labels | Markers, active selections                                        |

```json
{
  "id": "route",
  "type": "line",
  "slot": "middle",
  "source": "route",
  "paint": {
    "line-color": "#3b6df5",
    "line-width": 4,
    "line-emissive-strength": 1,
    "line-occlusion-opacity": 1
  }
}
```

- ❌ No `slot` → the layer lands above everything, including labels.
- ✅ Every non-3D custom layer sets `fill-`/`line-emissive-strength: 1`, or it vanishes at `dusk` / `night`.

## Color

Standard's defaults are tuned; override only for brand or product reasons. Starting values:

```json
{
  "colorLand": "hsl(28, 15%, 95%)",
  "colorBuildings": "hsl(35, 18%, 87%)",
  "colorRoads": "hsl(218, 18%, 72%)",
  "colorWater": "hsl(202, 75%, 70%)"
}
```

**Rules**

- Brand color goes on routes, markers, and pins — never on basemap roads, water, or land. This is the single most
  common map-design mistake.
- Keep a clear lightness step between land and roads. Same value = "floating labels", street names with no visible
  road under them.
- `colorMotorways` 5–8% L darker than `colorRoads`.
- Water is separated by hue + saturation, not lightness alone: S ≥ 60% light themes, ≥ 35% dark ones.
- WCAG AA: 4.5:1 normal text, 3:1 large text and road lines. Test in a deuteranopia simulator; never red-vs-green
  as the only distinction.

**Data ramps (ColorBrewer)**

- Sequential: Blues, Greens, Oranges, YlOrRd, BuPu
- Diverging: RdBu, PuOr, BrBG — never red-green
- Qualitative: Set1, Set2, Paired, Dark2 (≤ 8 categories)
- ❌ Never rainbow/spectral for ordered data — no perceptual ordering
- Choropleth `fill-opacity` ≤ 0.7 so roads still give context

## Dark mode

`lightPreset:'night'` is a real dark basemap on its own — Standard shifts land, buildings, water, and roads with
the lighting. Bind it to the same signal as the rest of your UI (`prefers-color-scheme`, `UITraitCollection`,
`uiMode`).

- ❌ Never hand Standard an already-dark `color*` value. It gets darkened again under `night` and collapses to
  near-black.
- ❌ Never fake dark mode with CSS `invert()` — it destroys route and label legibility.
- ✅ Your own layers don't adapt: they need `fill-`/`line-emissive-strength: 1` to stay visible.

## Typography

- One family, two weights max. DIN Pro is the Standard default.
- Heavier weight + thin halo beats thin weight + thick halo.
- Italic for water bodies. Case for road labels is a style convention, not a rule — Standard uses mixed case.
- Place labels 11–14px, street labels 9–11px, feature labels 10–12px, attribution 8–9px.
- When labels conflict, drop the lower-priority label — don't shrink it.

## Zoom

| Zoom  | Scale             | Belongs here                                                   |
| ----- | ----------------- | -------------------------------------------------------------- |
| 0–4   | World → continent | Country boundaries, ocean labels, capitals                     |
| 5–8   | Country → state   | State lines, major cities and highways, large water            |
| 9–11  | Metro             | City boundaries, neighborhoods, all highways, parks, landmarks |
| 12–15 | Neighborhood      | All streets, building footprints, POIs, street names           |
| 16–22 | Street            | House numbers, parking, fine-grained amenities                 |

Never hard-cut with `minzoom` / `maxzoom` on your own layers — fade over 1–2 levels. 3D buildings fade in at z13+.

```json
"fill-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0, 12, 1]
```

## Markers by count

- < 100 → view/annotation marker
- 100 – 1,000 → symbol layer
- 1,000 – 100,000 → clustered symbol/circle layer
- \> 100,000 → vector tileset

Anchor to lng/lat, never screen pixels. Set `icon-allow-overlap: true` when every icon must show (the default
hides colliding icons — the #1 cause of "my icons disappeared"), `text-optional: true` so labels drop before
icons, and make `icon-size` a zoom-interpolate expression.

**Web / GL JS only:** never set `transform` or `will-change: transform` on a `Marker` root element — GL JS writes
`transform: translate()` there on every camera move. Animate an inner child instead.

## Classic styles

Only for non-Standard styles — Static Images API renders, per-layer paint control config can't express, or a
deliberate 2D fallback. There you author the stack bottom-to-top: background → land use → water →
terrain → buildings → roads → borders → labels → POI symbols → user content. No slots, no config surface.

## Quick checklist

✅ Every custom layer has an explicit slot
✅ Markers in `top`, routes and choropleths in `middle`
✅ Emissive strength 1 on every non-3D custom layer
✅ Brand color on data only, zero basemap layers
✅ Clear lightness step between land and roads
✅ 4.5:1 text contrast, colorblind-safe ramps
✅ `icon-size` interpolated, not flat
✅ Features fade over 1–2 zoom levels
✅ Dark mode via `lightPreset`, not dark config colors or CSS filters
