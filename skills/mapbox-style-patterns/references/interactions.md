# Interactions: addInteraction, setFeatureState, and appearances

Three complementary mechanisms, not competing alternatives. They form a pipeline:

**`addInteraction` (bind the event) -> `setFeatureState` (flip the state) -> `appearances` or raw feature-state expressions (apply the visual change)**

## addInteraction + setFeatureState

`addInteraction` (GL JS v3.9+) binds click/mouseenter/mouseleave events to features, replacing `map.on(event, layerId, handler)`. Its handler is where you call `setFeatureState` to record what happened.

```javascript
// Custom layer: target by layerId
map.addInteraction('building-hover', {
  type: 'mouseenter',
  target: { layerId: 'buildings-layer' },
  handler: ({ feature }) => {
    if (hoveredBuilding) {
      map.setFeatureState(hoveredBuilding, { highlight: false });
    }
    hoveredBuilding = feature;
    map.setFeatureState(feature, { highlight: true });
    map.getCanvas().style.cursor = 'pointer';
  }
});

// Standard Style / style-import featureset: target by featuresetId + importId
map.addInteraction('place-click', {
  type: 'click',
  target: { featuresetId: 'place-labels', importId: 'basemap' },
  handler: ({ feature }) => {
    if (selectedPlace) {
      map.setFeatureState(selectedPlace, { select: false });
    }
    selectedPlace = feature;
    map.setFeatureState(feature, { select: true });
  }
});

// Omit `target` for a map-wide interaction (e.g. clicking empty space to deselect)
map.addInteraction('map-click', {
  type: 'click',
  handler: () => {
    if (selectedPlace) map.setFeatureState(selectedPlace, { select: false });
    selectedPlace = null;
  }
});
```

`setFeatureState(feature, state)` works with any source/layer type, given a stable feature `id` (`promoteId`/`generateId` for GeoJSON/vector sources).

## appearances

`appearances` is a **style-spec layer property** that defines an array of named, condition-gated property bundles:

```json
{
  "id": "poi-labels",
  "type": "symbol",
  "appearances": [
    {
      "name": "selected",
      "condition": ["feature-state", "select"],
      "properties": {
        "icon-size": 1.3,
        "text-color": "#ff0000",
        "text-halo-color": "#c0caff"
      }
    },
    {
      "name": "highlighted",
      "condition": ["feature-state", "highlighted"],
      "properties": {
        "icon-size": 2,
        "text-color": "#4264fb"
      }
    }
  ]
}
```

If multiple conditions are true, only the first matching appearance applies. `setFeatureState(feature, { select: true })` is what drives the `condition` here — `appearances` doesn't replace `setFeatureState`, it replaces writing the same `["case", ["boolean", ["feature-state", "x"], false], ...]` expression into every paint property you want to bundle under one named state.

**Constraint:** `appearances` currently only works on **symbol layers**, and only on properties tagged "Works with appearances" (`icon-*`, `text-*`, `symbol-z-offset`) — it cannot be used on `fill`, `fill-extrusion`, `circle`, or `line` layers. Known issue: `appearances` combined with `text-variable-anchor` on the same layer doesn't work correctly. Available in recent Mapbox GL JS v3.x releases — check the [CHANGELOG](https://github.com/mapbox/mapbox-gl-js/blob/main/CHANGELOG.md) for the exact version in your SDK.

## When to use each

| Need                                                                                                         | Use                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bind a click/hover event to a feature                                                                        | `addInteraction` (new code, works with custom layers via `layerId` or Standard Style/style-import featuresets via `featuresetId`+`importId`)                                                              |
| Bind a click/hover event, targeting a v2-era or non-featureset setup                                         | Legacy `map.on(event, layerId, handler)` — still works, but has no featureset targeting                                                                                                                   |
| Apply the visual change on a **symbol** layer, several properties at once, under one named condition         | `appearances` — cleaner than repeating the condition per property                                                                                                                                         |
| Apply the visual change on `fill`, `fill-extrusion`, `circle`, or `line`, or need finer per-property control | Raw `["feature-state", ...]` expressions written directly into each paint property (see [SKILL.md](../SKILL.md) and [performance.md](../../mapbox-data-visualization-patterns/references/performance.md)) |

Either way, `setFeatureState` is the mechanism that actually flips the state — `addInteraction` decides _when_ to call it, `appearances`/raw expressions decide _what happens_ once it's called.
