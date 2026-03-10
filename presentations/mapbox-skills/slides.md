---
theme: default
title: Mapbox Agent Skills
titleTemplate: '%s'
info: |
  Comprehensive Agent Skills for building fast, beautiful, secure Mapbox applications.
  Covers Web, iOS, Android, performance, cartography, and more.
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
transition: slide-left
mdc: true
---

# Mapbox Agent Skills

**Domain expertise for AI assistants building Mapbox applications**

Web · iOS · Android · Performance · Cartography · Security

---

# What Are Agent Skills?

Skills are folders of instructions + resources that AI assistants can discover and use.

<div class="grid grid-cols-3 gap-4 mt-6">
<div class="border rounded p-4">

### 🛠️ Tools

Provide **actions**
`create_style`, `directions`, `geocode`

</div>
<div class="border rounded p-4">

### 📚 Skills

Provide **expertise**
Know-how, patterns, best practices

</div>
<div class="border rounded p-4">

### 💬 Prompts

Provide **workflows**
Guided sequences for specific tasks

</div>
</div>

<div class="mt-6 p-4 bg-blue-50 rounded">

> Skills teach AI assistants _how to think_ about a domain — not just what actions to take.

</div>

---

# How Skills Work

```bash
# Install all Mapbox skills
npx skills add mapbox/mapbox-agent-skills

# Install a specific skill
npx skills add mapbox/mapbox-agent-skills --skill mapbox-web-performance-patterns

# List available skills
npx skills add mapbox/mapbox-agent-skills --list
```

Once installed, AI assistants automatically apply skill knowledge when the trigger conditions match.

<div class="mt-4 p-3 bg-gray-100 rounded text-sm">

**Example:** Ask "how do I optimize markers for 50,000 points?" → the `mapbox-web-performance-patterns` skill activates and guides the AI toward symbol layers + clustering instead of HTML markers.

</div>

---

# Skill Structure

Every skill follows a simple, consistent format:

```
skill-name/
├── SKILL.md          # Main skill file (required)
│   ├── YAML frontmatter   # name, description, trigger conditions
│   └── Markdown content   # Instructions, patterns, examples
├── AGENTS.md         # Quick-reference cheatsheet (optional)
└── evals/
    └── evals.json    # Benchmark test cases (optional)
```

**SKILL.md frontmatter:**

```yaml
---
name: mapbox-web-performance-patterns
description: >
  Performance optimization patterns for Mapbox GL JS.
  TRIGGER when the user is building or optimizing a Mapbox web map.
---
```

---

# 18 Skills Across 6 Domains

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

**🌐 Web**

- `mapbox-web-integration-patterns` — React, Vue, Svelte, Angular, Next.js
- `mapbox-web-performance-patterns` — Markers, data loading, memory
- `mapbox-data-visualization-patterns` — Choropleth, heat maps, clustering

**🗺️ Cartography & Style**

- `mapbox-cartography` — Color theory, visual hierarchy, typography
- `mapbox-style-patterns` — Layer configs, expressions, reuse
- `mapbox-style-quality` — Validation, accessibility, optimization

</div>
<div>

**📍 Location & Search**

- `mapbox-geospatial-operations` — Geometry vs routing APIs
- `mapbox-search-patterns` — Geocoding, POI, forward/reverse
- `mapbox-search-integration` — Full search workflow
- `mapbox-store-locator-patterns` — Filtering, distance, clustering

**📱 Mobile**

- `mapbox-ios-patterns` — Swift, SwiftUI, UIKit
- `mapbox-android-patterns` — Kotlin, Jetpack Compose

</div>
</div>

---

# 18 Skills Across 6 Domains (cont.)

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

**🤖 MCP / AI Integration**

- `mapbox-mcp-devkit-patterns` — Style management in AI coding assistants
- `mapbox-mcp-runtime-patterns` — pydantic-ai, mastra, LangChain, custom agents

**🔄 Migration**

- `mapbox-google-maps-migration` — Google Maps → Mapbox GL JS
- `mapbox-maplibre-migration` — MapLibre ↔ Mapbox (both directions)

</div>
<div>

**🔒 Security**

- `mapbox-token-security` — Token scoping, rotation, env vars

**🧭 Navigation** _(in review)_

- `mapbox-navigation-patterns` — Directions API, Navigation SDKs

</div>
</div>

---

# Deep Dive: Web Performance

`mapbox-web-performance-patterns` prevents the most common mistakes.

**Marker decision tree:**

| Count      | Approach                   | Why                   |
| ---------- | -------------------------- | --------------------- |
| < 100      | HTML markers               | Simple, interactive   |
| 100 – 10K  | Symbol layers              | GPU-rendered, no DOM  |
| 10K – 100K | Clustering + symbol layers | Reduce visual clutter |
| 100K+      | Vector tiles               | Progressive loading   |

**Key patterns the skill teaches:**

- Avoid `new mapboxgl.Marker()` in loops — create annotation managers once
- Use `feature-state` instead of new layers for hover/selection
- `generateId: true` + `setFeatureState` for highlight without re-uploading GeoJSON
- `preserveDrawingBuffer` and `antialias` have real GPU costs — disable unless needed

---

# Deep Dive: iOS & Android

**iOS — `mapbox-ios-patterns`**

```swift
// ❌ Slow: creates new manager on every update
func updateMarkers() {
    let manager = mapView.annotations.makePointAnnotationManager()
    manager.annotations = markers
}

// ✅ Fast: create once, update the array
private var annotationManager: PointAnnotationManager?

func updateMarkers() {
    annotationManager?.annotations = markers
}
```

**Android — `mapbox-android-patterns`**

```kotlin
// ✅ Batch updates: deleteAll() + create() in one call
annotationManager.deleteAll()
annotationManager.create(markers)
```

---

# Deep Dive: MCP Integration

Skills + MCP tools = complete end-to-end workflows.

**`mapbox-mcp-devkit-patterns`** — for AI coding assistants (Claude Code, Cursor):

```
User: "Create a dark style with highlighted water features"
     ↓
Skill: knows style creation workflow and validation steps
     ↓
MCP tools: create_style_tool → update_style_tool → preview_style_tool
           → validate_style_tool → check_color_contrast_tool
```

**`mapbox-mcp-runtime-patterns`** — for AI agents at runtime:

```python
# pydantic-ai agent with Mapbox MCP server
async with MCPServerStdio("mapbox-mcp-server") as mcp:
    agent = Agent(model, mcp_servers=[mcp])
    result = await agent.run("Find coffee shops near Mapbox HQ")
```

---

# Skill Benchmarks (Evals)

Every skill ships with `evals/evals.json` — 3 test cases that measure how much the skill improves AI responses.

**Example eval for `mapbox-ios-patterns`:**

```json
{
  "id": 3,
  "prompt": "How do I detect taps on POIs with the Standard style?",
  "expectations": [
    "Uses TapInteraction(.standardPoi) — not queryRenderedFeatures",
    "Shows both SwiftUI and UIKit patterns",
    "Accesses typed properties like poi.name"
  ]
}
```

**Benchmark results:**

| Skill                             | Without skill | With skill | Delta     |
| --------------------------------- | ------------- | ---------- | --------- |
| `mapbox-ios-patterns`             | 67%           | 100%       | **+33pp** |
| `mapbox-android-patterns`         | 67%           | 100%       | **+33pp** |
| `mapbox-web-performance-patterns` | ~80%          | ~95%       | **+15pp** |

---

# Why Evals Matter

The eval delta shows where skills add the most value: **cases where the base model uses outdated or incorrect APIs**.

**Base model failure mode — iOS Standard style interaction:**

```swift
// ❌ What the base model suggests (outdated):
mapView.mapboxMap.queryRenderedFeatures(at: point) { result in
    // ...
}

// ✅ What the skill teaches (correct for Standard style):
mapView.mapboxMap.addInteraction(TapInteraction(.standardPoi) { feature, _ in
    print(feature.name) // Typed access — no casting needed
    return true
})
```

The skill bridges the gap between the model's training cutoff and current SDK versions.

---

# Skills + MCP: Better Together

```
┌─────────────────────────────────────────────────────┐
│                  AI Assistant                        │
├──────────────────┬──────────────────────────────────┤
│   Agent Skills   │         MCP Tools                │
│  (know-how)      │         (actions)                │
│                  │                                  │
│ • Performance    │ • create_style_tool              │
│   patterns       │ • preview_style_tool             │
│ • Token security │ • directions_tool                │
│ • iOS/Android    │ • search_and_geocode_tool        │
│   best practices │ • validate_style_tool            │
│ • Cartography    │ • isochrone_tool                 │
│   principles     │ • static_map_image_tool          │
└──────────────────┴──────────────────────────────────┘
```

Skills provide the **judgment**. MCP provides the **capability**.

---

# Contributing a Skill

1. **Create the skill directory** under `skills/`
2. **Write `SKILL.md`** — frontmatter + domain expertise
3. **Write `AGENTS.md`** — quick-reference cheatsheet
4. **Add `evals/evals.json`** — 3 benchmark test cases
5. **Run validation:** `npm run check`
6. **Open a PR**

```bash
git checkout -b add-my-skill
mkdir skills/mapbox-my-skill
# ... write SKILL.md, AGENTS.md, evals/evals.json
npm run check
gh pr create
```

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for full guidelines.

---

# Resources

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

**This repo**

- [github.com/mapbox/mapbox-agent-skills](https://github.com/mapbox/mapbox-agent-skills)

**Agent Skills spec**

- [agentskills.io](https://agentskills.io)
- [github.com/anthropics/skills](https://github.com/anthropics/skills)

</div>
<div>

**Mapbox tools**

- [Mapbox MCP DevKit Server](https://github.com/mapbox/mcp-devkit-server)
- [Mapbox MCP Server](https://github.com/mapbox/mcp-server)
- [Mapbox GL JS docs](https://docs.mapbox.com/mapbox-gl-js/)

</div>
</div>

<div class="mt-8 text-center text-2xl">

```bash
npx skills add mapbox/mapbox-agent-skills
```

</div>

---
layout: center
---

# Questions?

**github.com/mapbox/mapbox-agent-skills**
