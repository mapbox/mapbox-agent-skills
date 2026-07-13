# Optimization Best Practices

## When to Optimize

**Before production deployment:**

- After all development changes are complete
- After merging multiple feature branches
- When style has grown significantly over time
- Before major releases or launches

**Benefits of optimization:**

- Faster initial load times
- Reduced bandwidth usage
- Better runtime performance
- Cleaner, more maintainable code

## Optimization Types

**Remove unused sources:**

- Automatically identifies sources not referenced by any layer
- Safe to remove without affecting functionality
- Common after deleting layers or refactoring

**Remove duplicate layers:**

- Finds layers with identical properties (excluding ID)
- Can occur when copying/pasting layers
- Reduces style complexity and file size

**Simplify expressions:**

- Converts `["all", true]` → `true`
- Converts `["any", false]` → `false`
- Converts `["!", false]` → `true`
- Converts `["!", true]` → `false`
- Improves expression evaluation performance

**Remove empty layers:**

- Removes layers with no paint or layout properties
- Preserves background layers (valid even when empty)
- Cleans up incomplete or placeholder layers

**Consolidate filters:**

- Identifies groups of layers with identical filter expressions
- Highlights opportunities for layer consolidation
- Doesn't automatically consolidate (informational only)

## Optimization Strategy

**Recommended order:**

1. Remove unused sources first (reduces noise for other checks)
2. Remove duplicate layers (eliminates redundancy)
3. Simplify expressions (improves readability and performance)
4. Remove empty layers (final cleanup)
5. Review consolidation opportunities (manual step)

**Selective optimization:**

```
// All optimizations (recommended for production)
optimize_style_tool({ style })

// Specific optimizations only
optimize_style_tool({
  style,
  optimizations: ['remove-unused-sources', 'simplify-expressions']
})
```

**Review before deploying:**

- Check the optimization report
- Verify size savings (percentReduction)
- Review the list of changes (optimizations array)
- Test the optimized style before deployment

## Best Practices Summary

**During Development:**

- Validate expressions as you write them
- Check GeoJSON data when adding sources
- Test color contrast for new text layers

**Before Production:**

- Run full validation suite
- Check accessibility compliance
- Optimize style
- Test optimized version
- Generate quality report

**Regular Maintenance:**

- Periodically optimize to prevent bloat
- Review and consolidate similar layers
- Update expressions to use simpler forms
- Remove deprecated or unused code
