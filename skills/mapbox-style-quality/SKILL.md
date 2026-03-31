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
2. **Check color contrast** - Ensure text is readable (WCAG compliance)
3. **Validate GeoJSON sources** - Ensure data integrity
4. **Optimize style** - Reduce file size and improve performance
5. **Compare versions** - Understand what changed
6. **Remove empty layers** - Delete layers with no visible paint properties as a final cleanup step
7. **Simplify redundant boolean expressions** - Clean up filters with unnecessary boolean logic (e.g., `["all", expr]` → `expr`, `["any", false, expr]` → `expr`)

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
- Aim for WCAG AA minimum (4.5:1 for normal text, 3:1 for large text)
- Use AAA standard (7:1 for normal text) for better accessibility
- Consider different background scenarios (map tiles, overlays)

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

- **AA** (minimum): 4.5:1 for normal text, 3:1 for large text
- **AAA** (enhanced): 7:1 for normal text, 4.5:1 for large text

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

- Test against both light and dark map tiles
- Consider overlay backgrounds (popups, modals)
- Test in different lighting conditions (mobile outdoor use)
- Verify contrast at different zoom levels

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
