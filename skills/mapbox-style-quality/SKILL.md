---
name: mapbox-style-quality
description: Expert guidance on validating, optimizing, and ensuring quality of Mapbox styles through validation, accessibility checks, and optimization. Use when preparing styles for production, debugging issues, or ensuring map quality standards.
---

# Mapbox Style Quality Skill

This skill provides expert guidance on ensuring Mapbox style quality through validation, accessibility, and optimization tools.

## When to Use Quality Tools

### Pre-Production Checklist

Before deploying any Mapbox style to production:

1. **Validate all expressions** - Catch syntax errors before runtime
2. **Check color contrast** - Ensure text is readable (WCAG AA: 4.5:1 normal text, 3:1 large text and line work)
3. **Check color encoding** - No red/green-only distinctions, no rainbow ramps for ordered data, nothing carried by color alone; verify with a deuteranopia simulator
4. **Validate GeoJSON sources** - Ensure data integrity
5. **Audit Standard-style layer hygiene** - Every custom layer has an explicit `slot`; every fill / line / circle layer has emissive strength `1` (see below)
6. **Check all four light presets** - `dawn` / `day` / `dusk` / `night` must all be legible
7. **Optimize style** - Reduce file size and improve performance
8. **Compare versions** - Understand what changed
9. **Remove empty layers** - Delete layers with no visible paint properties as a final cleanup step
10. **Simplify redundant boolean expressions** - Clean up filters with unnecessary boolean logic (e.g., `["all", expr]` → `expr`, `["any", false, expr]` → `expr`)

### Standard-style layer audit

Two omissions account for most "the map looks broken" reports on the Standard style, and both are cheap to check mechanically before deploying:

```javascript
// 1. Custom layers with no `slot` render ABOVE everything, including street labels
map
  .getStyle()
  .layers.filter((l) => !l.slot && !l.id.startsWith('basemap'))
  .forEach((l) => console.warn('missing slot:', l.id));

// 2. fill/line/circle layers default to emissive-strength 0 and vanish at
//    dusk/night. Symbol layers already default to 1, so they're not checked.
const emissiveProp = {
  fill: 'fill-emissive-strength',
  line: 'line-emissive-strength',
  circle: 'circle-emissive-strength'
};
map
  .getStyle()
  .layers.filter((l) => emissiveProp[l.type] && !l.paint?.[emissiveProp[l.type]])
  .forEach((l) => console.warn('missing emissive strength:', l.id));
```

Also verify:

- **Routes set `line-occlusion-opacity`** — otherwise 3D buildings hide them block by block in a pitched camera.
- **No `color*` config override was authored as an already-dark value.** Standard interprets every `color*` override as its **day** appearance and re-derives it per preset, so a night-tuned `colorLand` double-darkens to near-black under `lightPreset: 'night'`.
- **No hard `minzoom`/`maxzoom` pops.** Keep the bound for the GPU saving, but set it 1–2 levels below where the layer should appear and fade opacity in across that band.
- **Brand color appears on user content only** — routes, markers, pins — never on basemap roads, water, or land.

Design rules behind these checks live in the **mapbox-cartography** skill.

### During Development

**When adding GeoJSON data:**

- Always validate external GeoJSON with `validate_geojson_tool` before using as a source

**When writing expressions:**

- Validate expressions with `validate_expression_tool` as you write them
- Catch type mismatches early (e.g., using string operator on number)
- Verify operator availability in your Mapbox GL JS version
- Test expressions with expected data types

**When styling text/labels:**

- Check foreground/background contrast with `check_color_contrast_tool`
- Aim for WCAG AA minimum (4.5:1 for normal text, 3:1 for large text and line work)
- Use AAA standard (7:1 for normal text) for better accessibility
- Consider different background scenarios (map tiles, overlays)
- Keep to **one font family, two weights max**. DIN Pro is the Standard style's family — mixing in a second family reads as noise on an already busy map
- Prefer **heavier weight with a thin halo** over a thin font with a thick bright halo. In dark themes halos do the legibility work, since land/road separation runs below 3:1 by design

### Before Committing Changes

**Compare style versions:**

- Use `compare_styles_tool` to generate a diff report
- Review all layer changes, source modifications, and expression updates
- Understand the impact of your changes
- Document significant changes in commit messages

### Before Deployment

**Optimize the style:**

- Run `optimize_style_tool` to reduce file size
- Remove unused sources that reference deleted layers
- Eliminate duplicate layers with identical properties
- Simplify redundant boolean expressions in filters (e.g., collapse `["all", expr]` to `expr`, remove tautological conditions)
- Remove empty layers (layers with no visible paint properties) as a final cleanup step

## Validation Best Practices

### GeoJSON Validation

**Always validate when:**

- Loading GeoJSON from user uploads
- Fetching GeoJSON from external APIs
- Processing GeoJSON from third-party sources
- Converting between data formats

**Common GeoJSON errors:**

- Invalid coordinate ranges (longitude > 180 or < -180)
- Unclosed polygon rings (first and last coordinates must match)
- Wrong coordinate order (should be [longitude, latitude], not [latitude, longitude])
- Missing required properties (type, coordinates, geometry)
- Invalid geometry types or nesting

**Example workflow:**

```
1. Receive GeoJSON data
2. Validate with validate_geojson_tool
3. If valid: Add as source to style
4. If invalid: Fix errors, re-validate
```

### Expression Validation

**Validate expressions for:**

- Filter conditions (`filter` property on layers)
- Data-driven styling (`paint` and `layout` properties)
- Feature state expressions
- Dynamic property calculations

**Common expression errors:**

- Type mismatches (string operators on numbers)
- Invalid operator names or wrong syntax
- Wrong number of arguments for operators
- Nested expression errors
- Using unavailable operators for your GL JS version

**Prevention strategies:**

- Validate as you write expressions, not at runtime
- Test expressions with representative data
- Use type checking (expectedType parameter)
- Validate in context (layer, filter, paint, layout)

### Accessibility Validation

**WCAG Levels:**

- **AA** (minimum): 4.5:1 for normal text, 3:1 for large text and road/line work
- **AAA** (enhanced): 7:1 for normal text, 4.5:1 for large text

**Color-encoding rules — contrast ratios alone won't catch these:**

- **Never rely on color alone** to distinguish features. Pair it with size, shape, icon, dash pattern, or a label.
- **Never use red + green as the sole distinction.** Roughly 1 in 12 men cannot separate them. For diverging data use **RdBu**, **PuOr**, or **BrBG** — never RdYlGn or a green-yellow-red "traffic light" ramp.
- **Never use rainbow or spectral ramps for ordered data.** Rainbow has no perceptual ordering, so readers cannot tell which end means "more".
- **Test with a deuteranopia simulator**, not just a contrast checker.

**Text size categories:**

- **Normal**: < 18pt or < 14pt bold
- **Large**: ≥ 18pt or ≥ 14pt bold

**Common scenarios to check:**

- Text labels on map tiles
- POI labels with background colors
- Custom markers with text
- UI overlays on maps
- Legend text and symbols
- Attribution text

**Testing strategy:**

- Test against both light and dark map tiles — on Standard, that means checking every `lightPreset`, not loading a second style
- Consider overlay backgrounds (popups, modals)
- Test in different lighting conditions (mobile outdoor use)
- Verify contrast at different zoom levels
- Run a deuteranopia simulation over the rendered map, including your data layers

## Quality Workflow Examples

### Basic Quality Check

```
1. Validate expressions in style
2. Check color contrast for text layers
3. Optimize if needed
```

### Full Pre-Production Workflow

```
1. Validate all GeoJSON sources
2. Validate all expressions (filters, paint, layout)
3. Check color contrast for all text layers
4. Compare with previous production version
5. Optimize style
6. Test optimized style
7. Deploy
```

### Troubleshooting Workflow

```
1. Compare working vs. broken style
2. Identify differences
3. Validate suspicious expressions
4. Check GeoJSON data if source-related
5. Verify color contrast if visibility issue
```

## Common Issues and Solutions

### Runtime Expression Errors

**Problem:** Map throws expression errors at runtime
**Solution:** Validate expressions with `validate_expression_tool` during development
**Prevention:** Add expression validation to pre-commit hooks or CI/CD

### Poor Text Readability

**Problem:** Text labels are hard to read on map
**Solution:** Check contrast with `check_color_contrast_tool`, adjust colors to meet WCAG AA
**Prevention:** Test text on both light and dark backgrounds, check at different zoom levels

### Custom Layer Draws Over the Street Labels

**Problem:** A choropleth, route, or marker layer covers the basemap labels
**Solution:** Give the layer an explicit `slot` — `bottom` for fills under roads, `middle` for overlays and routes, `top` for markers and selections
**Prevention:** A layer with no slot lands above everything on the Standard style. Audit for missing slots before deploying (see the pre-production checklist)

### Layer Nearly Invisible in Dark Mode

**Problem:** Custom layers disappear when `lightPreset` is `dusk` or `night`
**Solution:** Set the matching emissive-strength property to `1` — `fill-`, `line-`, or `circle-emissive-strength`, which all default to `0` (symbol layers already default to `1`)
**Prevention:** The light preset relights the basemap but does not touch your layers' paint colors. Switch to `night` as a standing part of visual review

### Dark Map Renders Near-Black

**Problem:** Setting `lightPreset: 'night'` produces an almost entirely black map
**Solution:** Author `color*` config overrides as **day** values, or drop them and let the preset do the work
**Prevention:** Standard re-derives every `color*` override for the active preset, so an already-dark value gets darkened twice

### Large Style File Size

**Problem:** Style takes long to load or transfer
**Solution:** Run `optimize_style_tool` to remove redundancies and simplify
**Prevention:** Regularly optimize during development, remove unused sources immediately

### Invalid GeoJSON Source

**Problem:** GeoJSON source fails to load or render
**Solution:** Validate with `validate_geojson_tool`, fix coordinate issues, verify structure
**Prevention:** Validate all external GeoJSON before adding to style

### Unexpected Style Changes

**Problem:** Style changed but unsure what modified
**Solution:** Use `compare_styles_tool` to generate diff report
**Prevention:** Compare before/after for all significant changes, document modifications

## Tool Quick Reference

| Tool                        | Use When               | Output                     |
| --------------------------- | ---------------------- | -------------------------- |
| `validate_geojson_tool`     | Adding GeoJSON sources | Valid/invalid + error list |
| `validate_expression_tool`  | Writing expressions    | Valid/invalid + error list |
| `check_color_contrast_tool` | Styling text labels    | Passes/fails + WCAG levels |
| `compare_styles_tool`       | Reviewing changes      | Diff report with paths     |
| `optimize_style_tool`       | Before deployment      | Optimized style + savings  |

## Reference Files

For detailed guidance on specific topics, load the relevant reference:

- **`references/optimization.md`** — Optimization types, strategies, recommended order, and maintenance best practices
- **`references/comparison.md`** — Style comparison workflows, ignoreMetadata usage, and refactoring workflow
- **`references/ci-integration.md`** — Git pre-commit hooks, CI/CD pipeline steps, and code review checklist

> **Load instruction:** Read the reference file when the user needs in-depth guidance on that topic.

## Additional Resources

- [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [GeoJSON Specification (RFC 7946)](https://tools.ietf.org/html/rfc7946)
- [Mapbox Expression Reference](https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/)
