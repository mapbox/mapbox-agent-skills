---
name: mapbox-cartography
description: Expert guidance on map design principles, color theory, visual hierarchy, typography, and cartographic best practices for creating effective and beautiful maps with Mapbox. Use when designing map styles, choosing colors, or making cartographic decisions.
---

# Mapbox Cartography Skill

This skill provides expert cartographic knowledge to help you design effective, beautiful, and functional maps using Mapbox.

## Core Cartographic Principles

### Visual Hierarchy

Maps must guide the viewer's attention to what matters most:

- **Most important**: POIs, user location, route highlights
- **Secondary**: Major roads, city labels, landmarks
- **Tertiary**: Minor streets, administrative boundaries
- **Background**: Water, land use, terrain

**Implementation:**

- Use size, color intensity, and contrast to establish hierarchy
- Primary features: high contrast, larger symbols, bold colors
- Background features: low contrast, muted colors, smaller text

### Color Theory for Maps

**Color Harmony:**

- **Analogous colors**: Use colors next to each other on color wheel (blue-green-teal) for cohesive designs
- **Complementary colors**: Use opposite colors (blue/orange, red/green) for high contrast emphasis
- **Monochromatic**: Single hue with varying saturation/brightness for elegant, minimal designs

**Color Psychology:**

- **Blue**: Water, trust, calm, professional (default for water bodies)
- **Green**: Parks, nature, growth, eco-friendly (vegetation, parks)
- **Red/Orange**: Urgent, important, dining (alerts, restaurants)
- **Yellow**: Caution, highlight, attention (warnings, selected items)
- **Gray**: Neutral, background, roads (infrastructure)

**Accessibility:**

- Ensure 4.5:1 contrast ratio for text (WCAG AA)
- Don't rely solely on color to convey information
- Test designs with colorblind simulators
- Avoid red/green combinations for critical distinctions

**Color Palette Templates:**

Light Theme (Day/Professional):

```json
{
  "background": "#f5f5f5",
  "water": "#a0c8f0",
  "parks": "#d4e7c5",
  "roads": "#ffffff",
  "buildings": "#e0e0e0",
  "text": "#333333"
}
```

Dark Theme (Night Mode):

```json
{
  "background": "#1a1a1a",
  "water": "#0d47a1",
  "parks": "#2e7d32",
  "roads": "#3a3a3a",
  "buildings": "#2d2d2d",
  "text": "#ffffff"
}
```

> **Road color rule for dark themes:** Roads must use neutral dark gray (`#3a3a3a`), visibly distinct from the background but not colored. Never style roads with amber, blue, or other hues — reserve color for app data layers (routes, markers). Colored base roads and colored data layers will compete visually. Local roads that blend into the background (`#1e1e1e` on `#1a1a1a`) create a "floating labels" problem where street names appear with no visible road beneath them.

High Contrast (Accessibility):

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

Vintage/Retro:

```json
{
  "background": "#f4e8d0",
  "water": "#b8d4d4",
  "parks": "#c8d4a4",
  "roads": "#d4c4a8",
  "buildings": "#e4d4c4",
  "text": "#4a3828"
}
```

### Typography at Map Scale

**Font Selection:**

- **Sans-serif** (Roboto, Open Sans): Modern, clean, high legibility at small sizes - use for labels
- **Serif** (Noto Serif): Traditional, formal - use sparingly for titles or historic maps
- **Monospace**: Technical data, coordinates

**Text Sizing:**

```
Place labels (cities, POIs): 11-14px
Street labels: 9-11px
Feature labels (parks): 10-12px
Map title: 16-20px
Attribution: 8-9px
```

**Label Placement:**

- Point labels: Center or slightly offset (avoid overlap with symbol)
- Line labels: Follow line curve, repeat for long features
- Area labels: Center in polygon, sized appropriately
- Prioritize: Major features get labels first, minor features labeled if space allows

### Zoom Level Strategy

**Zoom 0-4** (World to Continent):

- Major country boundaries
- Ocean and sea labels
- Capital cities only

**Zoom 5-8** (Country to State):

- State/province boundaries
- Major cities
- Major highways
- Large water bodies

**Zoom 9-11** (Metro Area):

- City boundaries
- Neighborhoods
- All highways and major roads
- Parks and landmarks

**Zoom 12-15** (Neighborhood):

- All streets
- Building footprints
- POIs (restaurants, shops)
- Street names

> **Note:** Mapbox's hosted Streets style defaults to showing most POIs around zoom 14. For custom styles, start POIs at zoom 12 — this is the neighborhood scale where density is manageable and users are browsing. Zoom 14 is late; zoom 10 (metro-area scale) is far too early and creates severe icon clutter.

**Zoom 16-22** (Street Level):

- All detail
- House numbers
- Parking lots
- Fine-grained POIs

## Mapbox-Specific Implementation Guidance

### Style Layer Best Practices

**Layer Ordering (bottom to top):**

1. Background (solid color or pattern)
2. Landuse (parks, residential, commercial)
3. Water bodies (oceans, lakes, rivers)
4. Terrain/hillshade (if using elevation)
5. Buildings (3D or 2D footprints)
6. Roads (highways → local streets)
7. Borders (country, state lines)
8. Labels (place names, street names)
9. POI symbols
10. User-generated content (routes, markers)

> **Common mistake:** Developers often put their app's route line or active markers _below_ POI symbols, reasoning that "POIs must stay visible." This is backwards — user-generated content (your route, selected location, user position) is the most important layer and must render above everything, including POIs. A route line that covers a POI icon is acceptable; a route obscured by POI icons is not.

### Map Context Considerations

**Know Your Audience:**

- **General public**: Simplify, use familiar patterns (Google/Apple style)
- **Technical users**: Include more detail, technical layers, data precision
- **Domain experts**: Show specialized data, use domain-specific symbology

**Platform Considerations:**

- **Mobile**: Larger touch targets (44x44px minimum), simpler designs, readable at arm's length
- **Desktop**: Can include more detail, hover interactions, complex overlays
- **Print**: Higher contrast, larger text, consider CMYK color space
- **Outdoor/Bright**: Higher contrast, avoid subtle grays

**Use Case Optimization:**

- **Navigation**: Emphasize roads, clear hierarchy, route visibility
- **Data visualization**: Muted base map, let data stand out
- **Storytelling**: Guide viewer attention, establish mood with colors
- **Location selection**: Show POIs clearly, provide context
- **Analysis**: Include relevant layers, maintain clarity at different zooms

## Reference Files

For detailed guidance on specific topics, load these references as needed:

- `references/scenarios.md` — Common scenario guidance (Restaurant Finder, Real Estate, Data Visualization, Navigation)
- `references/performance-testing.md` — Performance optimization, testing checklist, and common mistakes to avoid

## When to Use This Skill

Invoke this skill when:

- Designing a new map style
- Choosing colors for map elements
- Making decisions about visual hierarchy
- Optimizing for specific use cases
- Troubleshooting visibility issues
- Ensuring accessibility
- Creating themed maps (dark mode, vintage, etc.)
