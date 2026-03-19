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

<div class="mt-8 text-sm text-gray-500">

Matthew Podwysocki · matthew.podwysocki@mapbox.com · GitHub: mattpodwysocki · X: @mattpodwysocki

</div>

---

# The Problem

AI assistants are good at general coding — but Mapbox is a specialized, fast-moving platform.

<div class="grid grid-cols-2 gap-6 mt-6">
<div class="border-l-4 border-red-400 pl-4">

**Without domain expertise, AI assistants...**

- Suggest `queryRenderedFeatures` for Standard style taps ❌
- Create a new `PointAnnotationManager` on every marker update ❌
- Put access tokens directly in source code ❌
- Use `< 1 MB GeoJSON / > 10 MB vector tiles` thresholds from old docs ❌
- Scaffold React without cleaning up the map on unmount ❌

</div>
<div class="border-l-4 border-gray-300 pl-4">

**Why this happens**

- Training data has a cutoff — SDK APIs evolve
- Mapbox has platform-specific conventions that aren't obvious
- The right answer often depends on context (data size, use case, platform)
- Security and performance trade-offs require judgment, not just syntax

</div>
</div>

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

<div class="mt-6 p-4 bg-blue-900/30 rounded">

> Skills teach AI assistants _how to think_ about a domain — not just what actions to take.

</div>

---

# Why Agent Skills?

Skills are a lightweight way to give AI assistants deep, focused domain expertise — without fine-tuning.

<div class="grid grid-cols-3 gap-4 mt-4">
<div class="border rounded p-4 text-sm">

**Fine-tuning**

Bakes knowledge into model weights. Expensive, slow to update, requires training data.

</div>
<div class="border rounded p-4 text-sm">

**RAG / context injection**

Retrieves docs at query time. Requires infrastructure, noisy results, no guarantee of relevance.

</div>
<div class="border-2 border-blue-400 rounded p-4 text-sm">

**Agent Skills** ✓

A folder of curated guidance the AI reads at task time. Zero infra, always up to date, version-controlled alongside the code.

</div>
</div>

<div class="mt-6 p-4 bg-blue-900/30 rounded">

> A skill is like hiring a specialist who sits next to the AI — they don't write the code, but they make sure it's done right.

</div>

---

# Why Mapbox Needs Skills

Mapbox has deep, interconnected complexity across multiple surfaces.

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

**Fast-moving APIs**

The Standard style (v3) introduced a completely new interaction model. The iOS and Android SDKs have platform-specific annotation patterns. Models trained before 2024 don't know these.

**Performance decisions require judgment**

"Should I use GeoJSON or vector tiles?" depends on data size, update frequency, and zoom range — not just a simple threshold.

**Security is easy to get wrong**

Token scoping, secret vs public tokens, and environment variable patterns are Mapbox-specific. Generic security advice doesn't apply.

</div>
<div>

**Multi-platform surface**

Each platform (Web, iOS, Android) has different idioms. A correct React pattern is wrong in Vue. A correct Swift pattern is wrong in Kotlin.

**The cost of mistakes is high**

A leaked token means real billing exposure. An HTML marker loop with 50K points freezes the browser. A wrong API call returns 404s in production.

**MCP is brand new territory**

Using Mapbox MCP tools effectively inside AI agents is a novel pattern — no training data exists for it yet.

</div>
</div>

---

# Skills as a Strategy

Skills are Mapbox's answer to the question: _how do we make AI assistants great at Mapbox development?_

<div class="grid grid-cols-3 gap-4 mt-6">
<div class="border rounded p-4 text-center">

**📦 Open source**

Published on GitHub, installable with one command, forkable and customizable.

</div>
<div class="border rounded p-4 text-center">

**🔄 Version controlled**

Skill updates ship alongside SDK releases. When the API changes, the skill changes too.

</div>
<div class="border rounded p-4 text-center">

**📏 Measurable**

Every skill ships with evals — we can prove the improvement with a benchmark delta.

</div>
</div>

<div class="mt-6 p-4 bg-green-900/30 rounded">

The goal: any developer using Claude Code, Cursor, or GitHub Copilot on a Mapbox project gets expert-level guidance automatically — without reading docs, without knowing which patterns apply.

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

<div class="mt-4 p-3 bg-white/10 rounded text-sm">

**Example:** Ask "how do I optimize markers for 50,000 points?" → the `mapbox-web-performance-patterns` skill activates and guides the AI toward symbol layers + clustering instead of HTML markers.

</div>

---

# Discovering & Installing Skills

**[skills.sh](https://skills.sh)** is the registry for Agent Skills — browse and search the full catalog.

<div class="grid grid-cols-3 gap-6 mt-4">
<div>

**Find skills on skills.sh**

- Browse by category (maps, data, security, …)
- Search by tool or framework name
- See install commands, descriptions, and source links
- Community and official skills in one place

</div>
<div>

**Install with `npx skills`**

```bash
# Browse what's available
npx skills add mapbox/mapbox-agent-skills --list

# Install everything from a repo
npx skills add mapbox/mapbox-agent-skills

# Install one specific skill
npx skills add mapbox/mapbox-agent-skills \
  --skill mapbox-token-security
```

</div>
<div>

**Install as a plugin**

Open Plugins (Cursor, Codex, Copilot, Claude Code):

```
/plugin marketplace add \
  mapbox/mapbox-agent-skills

/plugin install mapbox
```

Claude Code official marketplace:

```
/plugin install mapbox
```

</div>
</div>

<div class="mt-4 text-sm text-gray-400">

Skills are installed into your project's `.claude/` directory and automatically picked up by Claude Code, Cursor, and other AI assistants that support the Agent Skills spec.

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

# Skill Benchmarks (Evals)

Every skill ships with `evals/evals.json` — 3 test cases that measure how much the skill improves AI responses.

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

Each eval is graded pass/fail per expectation. Results are aggregated into a **pass rate delta**: `with_skill` minus `without_skill`.

---

# Benchmark Results

<div class="text-sm mt-2">

| Skill | Without | With | Delta |
| ----- | ------- | ---- | ----- |
| `ios-patterns` | 67% | 100% | **+33pp** |
| `android-patterns` | 67% | 100% | **+33pp** |
| `web-performance-patterns` | ~80% | ~95% | **+15pp** |
| `mcp-devkit-patterns` | 100% | 100% | +0pp ¹ |
| `data-visualization-patterns` | 92% | 92% | +0pp ² |

</div>

<div class="mt-2 text-xs text-gray-500">

¹ Base model already knows MCP DevKit tools from public GitHub docs<br>
² Common patterns (choropleth, feature state) are well-represented in training data

</div>

+0pp isn't a bad result — it means the base model already covers that topic well. The high-value skills are the ones where the model confidently gives the **wrong answer** without guidance.

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

# Let Claude Write the Skill

Claude Code has a built-in `skill-creator` skill — ask it to create, improve, and benchmark skills for you.

```
You: "Create a new skill for Mapbox offline maps patterns"
     ↓
Claude: reads existing skills for structure + style
        drafts SKILL.md, AGENTS.md, evals/evals.json
        runs benchmark (with_skill vs without_skill)
        iterates based on delta
```

**What `skill-creator` can do:**

- Create a skill from scratch given a topic or existing docs
- Improve an existing skill's content or trigger description
- Write eval prompts that target base model failure modes
- Run the full benchmark and report the pass rate delta
- Iterate until the delta is meaningful

<div class="mt-4 p-3 border-l-4 border-blue-400 text-sm">

Just describe the domain and Claude will handle the rest — including finding the edge cases where the base model gets it wrong.

</div>

---

# Writing Evals for Your Skill

Evals prove your skill actually improves AI responses — and show exactly _where_ it adds value.

**The format (`evals/evals.json`):**

```json
{
  "skill_name": "mapbox-my-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "How do I ...?",
      "expectations": [
        "Uses the correct API, not the outdated one",
        "Includes the required configuration step",
        "Shows the platform-specific pattern"
      ]
    }
  ]
}
```

---

# Writing Good Evals

**Pick prompts where the base model fails without the skill.**

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

**Good eval prompts**

- Platform-specific questions where the wrong API is plausible
- Questions about APIs that changed in recent SDK versions
- Trade-off questions where context determines the right answer
- Security or performance questions with non-obvious correct answers

</div>
<div>

**Good expectations**

- Specific and verifiable — not "gives a good answer"
- Each expectation tests one thing
- Include negative expectations: "does NOT use `queryRenderedFeatures`"
- Cover the pattern, not just the syntax

</div>
</div>

<div class="mt-4 p-3 bg-amber-900/30 rounded text-sm">

**Rule of thumb:** if the base model gets it right without your skill, the eval is too easy — it's not testing what your skill uniquely provides. Find the edge where the base model fails.

</div>

---

# Benchmarking Your Skill

Run each eval prompt **with** and **without** the skill context. Grade each expectation pass/fail.

```
eval-1/
  with_skill/run-1/
    outputs/response.md     ← AI response with SKILL.md in context
    grading.json            ← { passed, failed, total, pass_rate }
  without_skill/run-1/
    outputs/response.md     ← AI response with no skill context
    grading.json

benchmark.json              ← aggregated delta across all evals
```

**What a good benchmark looks like:**

| | without_skill | with_skill | delta |
|--|--|--|--|
| eval-1 | 0.33 | 1.00 | **+67pp** |
| eval-2 | 0.67 | 1.00 | **+33pp** |
| eval-3 | 1.00 | 1.00 | +0pp (base model already knows this) |
| **mean** | **0.67** | **1.00** | **+33pp** |

A +0pp eval isn't failure — it just means that prompt isn't a good discriminator. Keep it if the topic is important; replace it if you can find a harder prompt.

---

# Where Skills Are Still Needed

18 skills cover a lot — but significant Mapbox surface area isn't yet represented.

<div class="grid grid-cols-3 gap-4 mt-4 text-sm">
<div class="border rounded p-3">

**📱 Cross-platform mobile**

Flutter, React Native, Unity SDK — AI assistants have no Mapbox-specific guidance for these runtimes at all.

</div>
<div class="border rounded p-3">

**🌐 Custom rendering**

`CustomLayerInterface`, THREE.js integration, WebGL custom layers, point clouds, 3D model overlays.

</div>
<div class="border rounded p-3">

**📴 Offline maps**

Download regions, offline packs, cache management, conflict resolution between offline and live data.

</div>
<div class="border rounded p-3">

**🧪 Testing**

How to write unit and integration tests for map applications — mocking the map, asserting layer state, CI/CD for styles.

</div>
<div class="border rounded p-3">

**🌍 Internationalization**

RTL text rendering, non-Latin script support, locale-aware label ordering, right-to-left UI with maps.

</div>
<div class="border rounded p-3">

**📡 Tiling Service**

Mapbox Tiling Service workflows — recipe authoring, tileset publishing, update pipelines, source validation.

</div>
</div>

---

# The Skill Gap Is an Opportunity

Every uncovered area is a place where AI assistants are currently guessing.

<div class="mt-4 p-4 bg-orange-900/30 border-l-4 border-orange-400 rounded">

**If you've ever had to correct an AI assistant's Mapbox advice — that's a skill waiting to be written.**

The correction you just made, the pattern you know that the model doesn't, the mistake you've seen developers make repeatedly — that's exactly the knowledge a skill should capture.

</div>

<div class="grid grid-cols-2 gap-6 mt-6">
<div>

**Good candidates for new skills**

- Any Mapbox API or SDK surface not yet covered
- Common mistakes you see in support channels or code review
- Patterns that are correct but non-obvious
- Areas where the docs exist but judgment is still required

</div>
<div>

**How to get started**

```bash
gh repo fork mapbox/mapbox-agent-skills
git checkout -b add-my-skill
mkdir skills/mapbox-my-skill
# Write SKILL.md, AGENTS.md, evals.json
gh pr create
```

You don't need to be a Mapbox employee — community skills are welcome.

</div>
</div>

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
