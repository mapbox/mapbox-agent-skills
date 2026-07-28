# Segment archetypes

Ready-to-apply Standard `basemap` configs by product segment. Config keys are identical on GL JS / Android / iOS —
only the setter differs (see the cross-platform API reference in SKILL.md).

Use these as a **starting point, not a spec**: apply the config, then check the result against the visual-hierarchy
and color rules in SKILL.md. Where a row names a style instead of config keys, the need isn't reachable through
Standard config and you should pick that style instead.

Shorthand used below: **3D** = `show3dObjects`, **POIs** = `showPointOfInterestLabels`,
**landmarks** = `showLandmarkIcons`, **road labels** = `showRoadLabels`, **place labels** = `showPlaceLabels`,
**POI density** = `densityPointOfInterestLabels`.

## The table

| Segment                | Config                                                                        | Why                                                                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **logistics_customer** | `theme:'faded'`; POIs off; 3D off                                             | The vehicle and the ETA are the whole product. An ambient base keeps attention on a single moving dot.                                                      |
| **logistics_driver**   | `theme:'default'`; POIs off; 3D on; `showPedestrianRoads:true`                | Building footprints and walkways carry the last 50 feet. Follow the OS appearance for night driving.                                                        |
| **logistics_ops**      | `theme:'monochrome'`; POIs off; 3D off                                        | A dispatcher reads fleet state, not geography. Neutral canvas, no competing color.                                                                          |
| **travel_discovery**   | `theme:'default'`; POIs on at density 4; landmarks on; 3D on                  | Here the basemap _is_ the content — POIs and 3D landmarks are what the user came to browse.                                                                 |
| **travel_navigation**  | `theme:'default'`; POIs off; landmarks on; 3D on; road + place labels on      | Route and maneuver dominate; landmarks orient the driver while POI noise stays off.                                                                         |
| **real_estate**        | `theme:'faded'`; POIs off; 3D off; place labels on                            | Listings must be the only thing that pops, and parcel geometry must never be occluded by 3D.                                                                |
| **automotive**         | `theme:'default'`; 3D on; landmarks on                                        | 3D context helps in-car recognition, but the route line always beats landmarks in the hierarchy.                                                            |
| **data_viz**           | `theme:'monochrome'` (or the `light-2d` / `dark-2d` styles); POIs off; 3D off | The base is a canvas. POIs compete with the thematic layer and 3D occludes it outright.                                                                     |
| **outdoors**           | The `outdoors` / `outdoors-winter` **styles** — not a config; 3D on           | Trails, contours, and terrain shading aren't reachable through config, so this is a style choice.                                                           |
| **social**             | `theme:'default'`; POIs on; landmarks on                                      | Lively and shareable. POIs and landmarks give a place character in a screenshot.                                                                            |
| **journalism**         | `theme:'faded'`; POIs off; landmarks off; 3D off; road labels off             | A flat, quiet base. Map rates, not counts, and prefer an equal-area projection for global stories.                                                          |
| **retail**             | `theme:'faded'`; POIs off; 3D off                                             | Store locators must not look like a generic web map. Scope brand color to the markers, never the basemap.                                                   |
| **weather**            | `theme:'default'`; POIs off; 3D off                                           | A light base is required under a radar/precipitation ramp — and that ramp is meteorological, never a brand ramp.                                            |
| **telecom**            | `theme:'faded'`; POIs off; 3D off                                             | A neutral canvas so the coverage/signal gradient reads as the only variable.                                                                                |
| **mobility**           | `theme:'default'`; POIs off; 3D off                                           | Zone geofences: brand fill at ~15% opacity with a solid border; restricted zones ~20% with a dashed border.                                                 |
| **public_sector**      | `theme:'faded'`; POIs off; 3D off                                             | Trust and accessibility over aesthetics: WCAG AA throughout, no 3D or dark theme in emergency contexts, and a Static Images fallback for low-power clients. |

## Applying one

A segment config is just a `config.basemap` block:

```json
{
  "style": "mapbox://styles/mapbox/standard",
  "config": {
    "basemap": {
      "theme": "faded",
      "showPointOfInterestLabels": false,
      "show3dObjects": false
    }
  }
}
```

Set the same keys at runtime with `setConfigProperty` (web) or `setStyleImportConfigProperty` (Android / iOS) —
never reload the style to change a segment.

## Reading the table

Three patterns explain most of the rows:

1. **`faded` / `monochrome` means "the data is the subject."** Every segment whose product is an overlay —
   logistics, real estate, telecom, journalism, data viz — quiets the base rather than brightening the data.
2. **`default` means "the map is the subject."** Discovery, social, and navigation keep a rich base because the
   basemap content is what the user is reading.
3. **3D is a cost, not a feature.** It earns its place at z16+ where a footprint identifies a destination
   (driver hand-off, automotive, discovery), and it comes off wherever a flat overlay must stay unoccluded.

## Dark mode in a segment

Nothing in this table sets `lightPreset`. Dark mode is an app-appearance decision, not a segment one: bind
`lightPreset:'night'` to the same signal that drives the rest of your UI (`prefers-color-scheme`,
`UITraitCollection`, `uiMode`). The segment's `theme` and `color*` overrides stay exactly as they are — Standard
re-derives them for the active preset. See "Dark mode" in SKILL.md, and never hand Standard an already-dark color.
