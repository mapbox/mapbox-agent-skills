# Style Comparison Workflow

## When to Compare Styles

**Before merging changes:**

- Review what changed in your feature branch
- Ensure no unintended modifications
- Generate change summary for PR description

**When investigating issues:**

- Compare working version vs. broken version
- Identify what changed between versions
- Narrow down root cause of problems

**During migrations:**

- Compare old format vs. new format
- Verify data integrity after conversion
- Document transformation differences

## Comparison Best Practices

**Use ignoreMetadata flag:**

```
// Ignore metadata differences (id, owner, created, modified)
compare_styles_tool({
  styleA: oldStyle,
  styleB: newStyle,
  ignoreMetadata: true
})
```

**Focus on meaningful changes:**

- Layer additions/removals
- Source changes
- Expression modifications
- Paint/layout property updates

**Document significant changes:**

- Note breaking changes in documentation
- Update style version numbers
- Communicate changes to team/users

## Refactoring Workflow

```
1. Create backup of current style
2. Make refactoring changes
3. Compare before vs. after
4. Validate all modified expressions
5. Optimize to clean up
6. Review size impact
```

## Best Practices Summary

**Before Committing:**

- Compare with previous version
- Document significant changes
- Validate modified expressions
