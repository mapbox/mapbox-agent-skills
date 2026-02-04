# Mapbox Style Quality Guide

Quick reference for style validation, accessibility, performance optimization, and testing.

## Style Validation Rules

### Required Elements

✅ Valid version 8 style specification
✅ At least one source defined
✅ At least one layer defined
✅ Valid layer types and properties
✅ Proper source references in layers

### Common Errors

```javascript
// ❌ Layer references non-existent source
{
  "id": "layer",
  "source": "missing-source" // Error!
}

// ❌ Invalid property values
{
  "paint": {
    "fill-color": "not-a-color" // Error!
  }
}

// ✅ Valid layer
{
  "id": "layer",
  "source": "valid-source",
  "type": "fill",
  "paint": {
    "fill-color": "#ff0000"
  }
}
```

## Accessibility Standards

### Color Contrast (WCAG 2.1)

**Requirements:**

- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

```javascript
// ✅ Good contrast for labels
'text-color': '#222222',
'text-halo-color': '#ffffff',
'text-halo-width': 2,
'text-halo-blur': 1
```

### Colorblind Accessibility

**Test for:**

- Deuteranopia (red-green, 8% of males)
- Protanopia (red-green, 1% of males)
- Tritanopia (blue-yellow, rare)

**Rules:**

- ❌ Don't rely on color alone
- ✅ Add patterns, labels, or symbols
- ✅ Use colorblind-safe palettes
- ✅ Test with colorblind simulators

### Touch Targets

**Mobile requirements:**

- Minimum: 44x44 pixels (iOS)
- Recommended: 48x48 pixels (Material Design)

```javascript
// ✅ Large enough tap targets
'icon-size': 1.2,  // Larger icons
'icon-allow-overlap': false,  // No overlapping
'symbol-spacing': 250  // Space between symbols
```

## Performance Optimization

### Layer Count

**Rule:** Minimize layer count

- **Good:** < 50 layers
- **Warning:** 50-100 layers
- **Problem:** > 100 layers

**Optimization:**

```javascript
// ❌ Multiple layers for categories
map.addLayer({ id: 'parks', filter: ['==', 'type', 'park'] });
map.addLayer({ id: 'water', filter: ['==', 'type', 'water'] });

// ✅ One layer with data-driven styling
map.addLayer({
  id: 'features',
  paint: {
    'fill-color': ['match', ['get', 'type'], 'park', '#90EE90', 'water', '#87CEEB', '#CCCCCC']
  }
});
```

### Source Optimization

```javascript
// ✅ Set appropriate zoom ranges
{
  "type": "vector",
  "tiles": ["https://..."],
  "minzoom": 0,
  "maxzoom": 14  // Don't over-fetch
}

// ✅ Use generateId for feature state
{
  "type": "geojson",
  "data": geojson,
  "generateId": true  // Better performance
}
```

### Paint Properties

```javascript
// ✅ Use data-driven expressions efficiently
'circle-radius': [
  'interpolate', ['linear'], ['zoom'],
  8, 2,
  16, 8
]

// ❌ Avoid expensive operations in expressions
'circle-radius': [
  'sqrt',  // Expensive!
  ['*', ['get', 'value'], ['get', 'multiplier']]
]
```

## Style Testing Checklist

### Visual Testing

✅ Test at multiple zoom levels (0, 5, 10, 15, 20)
✅ Test with different data densities
✅ Check label collisions
✅ Verify symbol/icon rendering
✅ Test on desktop and mobile viewports
✅ Check dark mode compatibility

### Functional Testing

```javascript
// ✅ Validate style loads
map.on('style.load', () => {
  console.log('Style loaded successfully');
});

// ✅ Check for missing resources
map.on('error', (e) => {
  console.error('Style error:', e);
});

// ✅ Validate sources
const sources = map.getStyle().sources;
Object.keys(sources).forEach((id) => {
  console.log('Source:', id, sources[id]);
});

// ✅ Validate layers
const layers = map.getStyle().layers;
layers.forEach((layer) => {
  console.log('Layer:', layer.id, 'Type:', layer.type);
});
```

### Performance Testing

```javascript
// ✅ Measure style load time
const startTime = performance.now();
map.setStyle(style);
map.once('idle', () => {
  console.log('Style load time:', performance.now() - startTime, 'ms');
});

// ✅ Monitor frame rate
const fps = map.getFPS();
console.log('FPS:', fps); // Should be close to 60

// ✅ Check layer count
console.log('Layer count:', map.getStyle().layers.length);
```

## Common Quality Issues

### 1. Label Collisions

```javascript
// ❌ Overlapping labels
'text-allow-overlap': true  // Bad for readability

// ✅ Prevent collisions
'text-allow-overlap': false,
'text-padding': 2,
'symbol-spacing': 250
```

### 2. Inconsistent Styling

```javascript
// ❌ Different styles for similar features
layer1: { 'line-width': 2 }
layer2: { 'line-width': 3 }  // Inconsistent

// ✅ Consistent styling
'line-width': [
  'match', ['get', 'class'],
  'primary', 4,
  'secondary', 2,
  1
]
```

### 3. Missing Error Handling

```javascript
// ❌ No error handling
map.addSource('source', sourceData);

// ✅ Check before adding
if (!map.getSource('source')) {
  map.addSource('source', sourceData);
}
```

### 4. Poor Mobile Performance

**Issues:**

- Too many layers
- Large GeoJSON files
- High-resolution images
- Complex expressions

**Solutions:**

- Simplify geometry
- Use vector tiles
- Optimize images
- Cache data

## Style Optimization Workflow

1. **Validate Structure**
   - Check JSON syntax
   - Verify all sources referenced
   - Validate property types

2. **Test Accessibility**
   - Check color contrast
   - Test colorblind modes
   - Verify touch targets

3. **Optimize Performance**
   - Reduce layer count
   - Simplify expressions
   - Set appropriate zoom ranges
   - Use feature state

4. **Test Across Devices**
   - Desktop browsers
   - Mobile browsers
   - Different screen sizes
   - Low-end devices

5. **Monitor in Production**
   - Track load times
   - Monitor errors
   - Check tile request counts
   - Measure FPS

## Tools & Resources

**Validation:**

- Mapbox Style Specification: <https://docs.mapbox.com/mapbox-gl-js/style-spec/>
- JSON Schema validators

**Accessibility:**

- WebAIM Contrast Checker
- Coblis Color Blindness Simulator
- WAVE Accessibility Evaluation Tool

**Performance:**

- Chrome DevTools Performance tab
- Mapbox GL JS Performance metrics
- Bundle size analyzers

## Quick Fixes

**Slow rendering?**
→ Reduce layer count, simplify geometry

**Label collisions?**
→ Increase text-padding, reduce symbol density

**Poor mobile performance?**
→ Use vector tiles, reduce complexity

**Low contrast?**
→ Add text halos, adjust colors

**Icons not loading?**
→ Check sprite paths, add error handlers
