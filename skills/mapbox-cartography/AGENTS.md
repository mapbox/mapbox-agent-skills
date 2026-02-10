# Mapbox Cartography Principles

Quick reference for map design, color theory, visual hierarchy, and accessibility.

## Core Cartography Principles

### 1. Visual Hierarchy

**Most Important Rule:** Direct user attention to what matters most.

**Priority levels:**

- **Primary:** Main features (roads, labels for user's task)
- **Secondary:** Supporting context (water, parks)
- **Tertiary:** Background (minor roads, less important labels)

**Tools:**

- Size: Larger = more important
- Color: Brighter/saturated = more important
- Contrast: Higher contrast = more important
- Position: Foreground > Background

### 2. Figure-Ground Relationship

**Make primary features stand out from background:**

```javascript
// ✅ Good contrast between features and background
'background': '#f8f8f8',     // Light gray
'water': '#a8d5ff',          // Distinct blue
'roads': '#ffffff',          // Bright white
'labels': '#333333'          // Dark text
```

### 3. Color Theory

**Color Schemes:**

- **Sequential:** Light → Dark (population density, elevation)
- **Diverging:** Low ← Neutral → High (temperature, sentiment)
- **Categorical:** Distinct colors for categories (never more than 7-8)

**Rules:**

- Limit palette to 5-7 colors maximum
- Use ColorBrewer for data visualization
- Test for colorblindness (deuteranopia most common)
- Avoid red/green combinations

### 4. Label Hierarchy

**Typography sizing:**

```javascript
// Cities by population
'text-size': [
  'interpolate', ['linear'], ['zoom'],
  4, ['match', ['get', 'type'],
    'capital', 16,
    'city', 12,
    'town', 10,
    8
  ]
]
```

**Label placement rules:**

- Cities: Above point
- Roads: Along line
- Areas: Inside polygon
- Avoid label collisions (use `text-allow-overlap: false`)

## Color Best Practices

### Accessible Color Contrast

**WCAG 2.1 Standards:**

- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- Essential graphics: 3:1 contrast ratio

```javascript
// ✅ Good contrast for labels
'text-color': '#333333',     // Dark text
'text-halo-color': '#ffffff', // White halo
'text-halo-width': 2
```

### Colorblind-Safe Palettes

**Avoid:**

- ❌ Red/Green (deuteranopia)
- ❌ Blue/Yellow (tritanopia)
- ❌ Pure color differentiation

**Use:**

- ✅ Pattern/texture in addition to color
- ✅ Labels for categories
- ✅ Size/shape variations
- ✅ Colorblind-safe palettes (ColorBrewer)

## Typography

### Font Selection

**Mapbox fonts:**

- **Roboto**: Clean, modern, web-optimized
- **Open Sans**: Highly legible, good for labels
- **DIN Pro**: Professional, geometric
- **Montserrat**: Elegant headlines

**Rules:**

- Max 2 font families per map
- Use font-weight for hierarchy
- Sans-serif for UI, optional serif for labels

### Label Sizing

**Base sizes:**

```javascript
'text-size': [
  'interpolate', ['linear'], ['zoom'],
  8, 10,    // Small at low zoom
  12, 14,   // Medium at mid zoom
  16, 18    // Large at high zoom
]
```

## Data Visualization

### Choropleth Maps

**For area data (population, income, etc.):**

```javascript
// ✅ Use sequential colors
'fill-color': [
  'step',
  ['get', 'density'],
  '#f7fbff',  // Light
  10, '#deebf7',
  20, '#c6dbef',
  50, '#9ecae1',
  100, '#6baed6',
  200, '#3182bd',
  500, '#08519c'  // Dark
]
```

**Rules:**

- 5-7 data classes maximum
- Equal intervals or quantiles
- Include legend
- Show data source

### Proportional Symbols

**For point data (city size, counts):**

```javascript
// ✅ Scale circle size by value
'circle-radius': [
  'interpolate', ['linear'], ['get', 'population'],
  0, 5,           // Min: 5px
  100000, 15,     // Mid: 15px
  1000000, 30     // Max: 30px
]
```

## Map Styles by Use Case

### Navigation/Wayfinding

- **Emphasize:** Roads, labels, route
- **De-emphasize:** Buildings, terrain
- **Colors:** High contrast, clear hierarchy

### Data Visualization

- **Emphasize:** Data layer, legend
- **De-emphasize:** Base map (grayscale)
- **Colors:** Data-appropriate palette

### Storytelling

- **Emphasize:** Story points, annotations
- **De-emphasize:** Irrelevant features
- **Colors:** Support narrative mood

### Reference Map

- **Balanced:** All features proportionate
- **Clear:** Good labels, readable
- **Colors:** Conventional (blue water, green parks)

## Quick Design Checklist

✅ Clear visual hierarchy (primary features stand out)
✅ Limited color palette (5-7 colors max)
✅ Accessible contrast ratios (4.5:1 for text)
✅ Colorblind-safe colors (avoid red/green alone)
✅ Appropriate label sizes (scales with zoom)
✅ No label collisions (readable at all zooms)
✅ Legend included (for data visualization)
✅ Consistent styling (similar features look similar)
✅ Tested at multiple zoom levels
✅ Mobile-friendly (tap targets, text size)

## Common Mistakes

❌ Too many colors (>7 categories)
❌ Poor contrast (low visibility)
❌ Red/green combinations (colorblind users)
❌ Small text without halos (illegible)
❌ Cluttered labels (overlapping)
❌ Inconsistent styling (confusing)
❌ No legend (data maps unclear)
❌ Ignoring zoom levels (too much/little detail)
