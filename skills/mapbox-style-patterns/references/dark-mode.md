# Pattern 5: Dark Mode / Night Theme

**Use case:** Reduced eye strain, night use, modern aesthetic, battery saving (OLED)

**Visual requirements:**

- Dark background
- Reduced brightness
- Maintained contrast
- Readable text
- Comfortable viewing

## The pattern: `lightPreset: 'night'`

On the Standard style, dark mode is **one config property**. Standard shifts land, buildings, water, roads, and label colors along with the lighting, so the preset on its own is a complete, professionally-tuned dark basemap. Do not hand-build a dark palette, and do not swap to a different style.

```javascript
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/standard',
  config: { basemap: { lightPreset: 'night' } }
});

// Toggle at runtime — set the property, don't reload the style
map.setConfigProperty('basemap', 'lightPreset', 'night');
```

Use `'dusk'` instead for a softer, still-lit look.

**Bind it to the signal that drives the rest of your UI**, so the map follows the app rather than diverging from it:

```javascript
const dark = window.matchMedia('(prefers-color-scheme: dark)');

function syncMapTheme() {
  map.setConfigProperty('basemap', 'lightPreset', dark.matches ? 'night' : 'day');
}

dark.addEventListener('change', syncMapTheme);
syncMapTheme();
```

On the mobile SDKs the config key and value are identical — only the setter differs:

```kotlin
// Android — follow uiMode
style.setStyleImportConfigProperty("basemap", "lightPreset", Value.valueOf("night"))
```

```swift
// iOS — follow UITraitCollection
try mapView.mapboxMap.setStyleImportConfigProperty(for: "basemap", config: "lightPreset", value: "night")
// SwiftUI: Map { }.mapStyle(.standard(lightPreset: .night))
```

## Your own layers do NOT adapt

This is the failure that makes a night map look broken. The preset relights the basemap; it does **not** touch the paint colors of layers you added. Without emissive strength they fall into shadow and go nearly invisible:

```javascript
map.addLayer({
  id: 'zones',
  type: 'fill',
  slot: 'middle',
  source: 'zones',
  paint: {
    'fill-color': '#7b61ff',
    'fill-opacity': 0.6,
    'fill-emissive-strength': 1 // REQUIRED, or this vanishes at night
  }
});
```

This applies to **fill, line, and circle** layers: `fill-emissive-strength`, `line-emissive-strength`, `circle-emissive-strength` all default to `0`, so they are lit by the scene and drop into shadow. **Symbol layers are already covered** — `icon-emissive-strength` and `text-emissive-strength` default to `1`, so your icons and labels stay legible without you doing anything. 3D `fill-extrusion` layers are scene-lit by design. Routes additionally want `line-occlusion-opacity: 1`.

## Config colors are DAY values

Every `color*` override is interpreted as its **day** appearance, and Standard re-derives it for whichever preset is active. So author the overrides once, against `day`, and let the preset handle the rest — there is no parallel night set to maintain.

The failure this creates: **never hand Standard an already-dark color.**

```javascript
// ❌ WRONG — double-darkened, collapses to near-black
map.setConfigProperty('basemap', 'colorLand', '#12181f');
map.setConfigProperty('basemap', 'lightPreset', 'night');

// ✅ RIGHT — day value; the preset darkens it once
map.setConfigProperty('basemap', 'colorLand', 'hsl(28, 15%, 95%)');
map.setConfigProperty('basemap', 'lightPreset', 'night');
```

If a dark surface looks black, check whether you're double-darkening it rather than reaching for a darker value.

## Anti-patterns

- **CSS `invert()` on the map canvas** (web only, and always wrong) — it destroys route and label legibility and inverts your brand colors along with the basemap.
- **`setStyle('mapbox://styles/mapbox/dark-v11')`** — a full style reload that drops your config, and it re-teaches the app a second style to maintain. Set `lightPreset` instead.
- **Hand-authoring a dark palette** when `lightPreset: 'night'` already gives you a tuned one.
- **Pure black backgrounds.** Keep land at L 8–14% — never `#000`. Text sits at L 90–100% with a dark halo; in dark themes the halo does the legibility work, since land/road separation runs below 3:1 by design.

## Classic-style fallback

Only if you're on a Classic style for a reason (server-rendered raster via the Static Images API, per-layer paint control config can't express, or a deliberate 2D fallback): use the ready-made **`dark-v11`**, or author a stack that satisfies these relationships rather than copying fixed hex values.

| Layer key           | Dark theme                                      | What must hold                                               |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| `background` (land) | L 8–14%, neutral to cool                        | Never pure black                                             |
| `roads`             | L 20–28%                                        | Visibly separated from land, or street names appear to float |
| `buildings`         | 3–8% L lighter than land                        | Reads as background mass, never competes with roads          |
| `water`             | Hue 195–210°, S ≥ 35%, a step lighter than land | Distinguished by hue + saturation, not lightness alone       |
| `parks`             | Muted green, L 18–25%                           | Quieter than water                                           |
| `text`              | L 90–100% with a dark halo                      | Halos carry legibility in dark themes                        |
