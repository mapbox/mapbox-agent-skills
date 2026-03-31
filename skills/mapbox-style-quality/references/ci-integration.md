# Integration with Development Workflow

## Git Pre-Commit Hook

```bash
# Validate expressions before commit
npm run validate-style

# Optimize before commit (optional)
npm run optimize-style
```

## CI/CD Pipeline

```
1. Validate all expressions
2. Check accessibility compliance
3. Run optimization (warning if significant savings)
4. Compare with production version
5. Generate quality report
```

## Code Review Checklist

- [ ] All expressions validated
- [ ] Text contrast meets WCAG AA
- [ ] GeoJSON sources validated
- [ ] Style optimized for production
- [ ] Changes documented in comparison report
