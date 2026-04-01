# Performance, Testing & Common Mistakes

## Performance Optimization

**Style Performance:**

- Minimize layer count (combine similar layers)
- Use expressions instead of multiple layers for variants
- Simplify complex geometries at lower zooms
- Use sprite sheets for repeated icons
- Leverage tileset simplification

**Loading Speed:**

- Preload critical zoom levels
- Use style optimization tools
- Minimize external resource calls
- Compress images in sprite sheets

## Testing Your Design

**Checklist:**

- [ ] View at all relevant zoom levels
- [ ] Test in different lighting conditions
- [ ] Check on actual devices (mobile, desktop)
- [ ] Verify color accessibility (colorblind.org)
- [ ] Review with target users
- [ ] Test with real data density
- [ ] Check label collision/overlap
- [ ] Verify performance on slower devices

## Common Mistakes to Avoid

1. **Too many colors**: Stick to 5-7 main colors maximum
2. **Insufficient contrast**: Text must be readable
3. **Overcrowding**: Not everything needs a label
4. **Ignoring zoom levels**: Show appropriate detail for scale
5. **Poor label hierarchy**: Organize by importance
6. **Inconsistent styling**: Maintain visual consistency
7. **Neglecting performance**: Complex styles slow rendering
8. **Forgetting mobile**: Test on actual devices
