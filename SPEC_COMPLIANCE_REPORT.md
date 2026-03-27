# Agent Skills Specification Compliance Report

> **Project:** mapbox-agent-skills
> **Specification:** [Agent Skills Specification](https://agentskills.io/specification)
> **Date:** 2026-03-27

---

## Executive Summary

Our 17 Mapbox agent skills pass all required specification checks — names, descriptions, and file structure are valid. However, **13 of 17 skills exceed the recommended SKILL.md size limit** (500 lines), with the largest being nearly 4x over. This directly impacts agent performance: when a skill is activated, its entire SKILL.md is loaded into the context window. An oversized file wastes tokens on reference material that could be loaded on demand, leaving less room for the agent to reason about the user's actual task.

**The highest-impact optimization is splitting the 7 worst offenders into a lean SKILL.md (core guidance) plus a `references/` directory (detailed examples).** For `mapbox-search-integration` alone, this could reduce activation cost from ~12,000 tokens to ~2,000 tokens — an 80% savings. Across all skills, we estimate reclaiming ~40,000 tokens of wasted context capacity.

We recommend starting with one skill as a reference implementation, then applying the pattern across the rest.

---

## Overview

| Metric | Value |
|--------|-------|
| Total Skills | 17 |
| Fully Compliant | 4 |
| Needs Improvement | 13 |
| Total Content | 388,697 bytes / 15,138 lines |
| Avg SKILL.md Lines | 891 (limit: 500) |
| Skills ≥ 2x Over Limit | 7 |

### Compliance Score: **B+**

All required fields and naming conventions are met. Key gaps: oversized SKILL.md files, missing optional metadata, and non-standard file layout.

---

## 1. Checklist Results

### 1.1 Required Fields

| Check | Status | Notes |
|-------|--------|-------|
| Every skill has `SKILL.md` | ✅ Pass | 17/17 |
| Frontmatter includes `name` | ✅ Pass | 17/17 |
| Frontmatter includes `description` | ✅ Pass | 17/17 |
| `name` matches directory name | ✅ Pass | 17/17 |
| `name` format (lowercase + hyphens) | ✅ Pass | 17/17 |
| No consecutive hyphens in `name` | ✅ Pass | 17/17 |
| `name` does not start/end with hyphen | ✅ Pass | 17/17 |
| `description` non-empty and ≤1024 chars | ✅ Pass | Range: 121–274 chars |

### 1.2 Recommendations

| Check | Status | Notes |
|-------|--------|-------|
| SKILL.md ≤ 500 lines | ⚠️ Fail | Only 4/17 compliant |
| `description` includes trigger keywords | ✅ Mostly | Most include "Use when..." |
| Uses `references/` for long content | ❌ Not used | 0/17 |
| Uses `scripts/` for executable code | ❌ Not used | 0/17 |

### 1.3 Optional Metadata

| Field | Usage |
|-------|-------|
| `license` | ❌ 0/17 (project is MIT, should be declared) |
| `compatibility` | ❌ 0/17 (android/ios skills should declare platform requirements) |
| `metadata` | ❌ 0/17 (recommend adding author, version) |
| `allowed-tools` | ❌ 0/17 (experimental field, can skip for now) |

---

## 2. SKILL.md Line Count Analysis

The spec recommends keeping SKILL.md under **500 lines** and splitting detailed reference content into the `references/` directory.

| Skill | Lines | Size | Status |
|-------|-------|------|--------|
| mapbox-cartography | 329 | 9.6 KB | ✅ Compliant |
| mapbox-style-quality | 420 | 11.5 KB | ✅ Compliant |
| mapbox-geospatial-operations | 429 | 17.7 KB | ✅ Compliant |
| mapbox-token-security | 493 | 10.6 KB | ✅ Compliant |
| mapbox-mcp-devkit-patterns | 581 | 13.7 KB | ⚠️ Slightly over (1.2x) |
| mapbox-ios-patterns | 725 | 17.8 KB | ⚠️ Over (1.5x) |
| mapbox-maplibre-migration | 732 | 21.3 KB | ⚠️ Over (1.5x) |
| mapbox-search-patterns | 758 | 20.7 KB | ⚠️ Over (1.5x) |
| mapbox-web-performance-patterns | 874 | 24.0 KB | ⚠️ Over (1.7x) |
| mapbox-android-patterns | 888 | 20.7 KB | ⚠️ Over (1.8x) |
| mapbox-google-maps-migration | 1000 | 23.6 KB | 🔴 Significantly over (2.0x) |
| mapbox-store-locator-patterns | 1118 | 27.0 KB | 🔴 Significantly over (2.2x) |
| mapbox-data-visualization-patterns | 1134 | 26.6 KB | 🔴 Significantly over (2.3x) |
| mapbox-web-integration-patterns | 1224 | 29.2 KB | 🔴 Significantly over (2.4x) |
| mapbox-style-patterns | 1244 | 26.5 KB | 🔴 Significantly over (2.5x) |
| mapbox-mcp-runtime-patterns | 1679 | 49.0 KB | 🔴 Significantly over (3.4x) |
| mapbox-search-integration | 1926 | 49.8 KB | 🔴 Significantly over (3.9x) |

**Impact:** Oversized SKILL.md files consume excessive context window when activated, reducing the agent's reasoning capacity.

---

## 3. Non-Standard File: AGENTS.md

`AGENTS.md` is not part of the Agent Skills specification. The spec defines the following directory structure:

```
skill-name/
├── SKILL.md          # Required
├── scripts/          # Optional
├── references/       # Optional
└── assets/           # Optional
```

Current state:
- **14/17** skills include `AGENTS.md`
- **3 missing:** mapbox-geospatial-operations, mapbox-search-integration, mapbox-search-patterns

**Recommendation:** Move `AGENTS.md` to `references/AGENTS.md` to align with the spec's progressive disclosure model — loaded only when needed.

---

## 4. Evals Directory

- **16/17** skills include an `evals/` directory
- **1 missing:** mapbox-search-patterns

While `evals/` is not defined in the spec, it serves as a valuable quality assurance mechanism and should be retained.

---

## 5. Description Quality Analysis

The spec recommends that descriptions should cover both what the skill does **and** when to use it.

| Quality | Count | Example |
|---------|-------|---------|
| ✅ Good (includes "Use when...") | 9 | mapbox-cartography: "...Use when designing map styles, choosing colors, or making cartographic decisions." |
| ⚠️ Needs improvement (missing trigger context) | 8 | mapbox-data-visualization-patterns: "Patterns for visualizing data on maps..." (no "Use when" guidance) |

**Skills missing trigger keywords:**
- mapbox-android-patterns
- mapbox-data-visualization-patterns
- mapbox-geospatial-operations
- mapbox-google-maps-migration
- mapbox-ios-patterns
- mapbox-maplibre-migration
- mapbox-search-integration
- mapbox-search-patterns

---

## 6. Recommendations

### P0: High Priority

#### 6.1 Split oversized SKILL.md files
Refactor the 7 significantly oversized skills (≥2x limit). Keep core guidance in SKILL.md (< 500 lines) and move detailed code examples and API references to `references/`.

**Example refactor (mapbox-search-integration, 1926 lines):**
```
mapbox-search-integration/
├── SKILL.md                    # Core guidance (~400 lines)
├── references/
│   ├── api-reference.md        # Detailed API reference
│   ├── code-examples.md        # Full code examples
│   └── troubleshooting.md      # Troubleshooting guide
└── evals/
```

#### 6.2 Add trigger keywords to descriptions
Add "Use when..." context to the 8 skills missing trigger guidance, helping agents match skills more accurately.

### P1: Medium Priority

#### 6.3 Move AGENTS.md to references/
```bash
for dir in skills/mapbox-*/; do
  if [ -f "$dir/AGENTS.md" ]; then
    mkdir -p "$dir/references"
    mv "$dir/AGENTS.md" "$dir/references/AGENTS.md"
  fi
done
```

#### 6.4 Add optional frontmatter fields
```yaml
---
name: mapbox-android-patterns
description: ...
license: MIT
compatibility: Requires Android SDK 21+ and Kotlin
metadata:
  author: mapbox
  version: "1.0"
---
```

### P2: Low Priority

#### 6.5 Add evals/ to mapbox-search-patterns
Maintain consistency with the other 16 skills.

#### 6.6 Consider using `scripts/` directory
For skills with executable logic (e.g., mapbox-style-quality's validation workflows), extract scripts into the `scripts/` directory.

---

## 7. Compliance Matrix

| Skill | name | desc | ≤500L | refs/ | license | compat | metadata | Score |
|-------|------|------|-------|-------|---------|--------|----------|-------|
| mapbox-cartography | ✅ | ✅ | ✅ | ❌ | ❌ | — | ❌ | 3/4 |
| mapbox-style-quality | ✅ | ✅ | ✅ | ❌ | ❌ | — | ❌ | 3/4 |
| mapbox-geospatial-operations | ✅ | ⚠️ | ✅ | ❌ | ❌ | — | ❌ | 2.5/4 |
| mapbox-token-security | ✅ | ✅ | ✅ | ❌ | ❌ | — | ❌ | 3/4 |
| mapbox-mcp-devkit-patterns | ✅ | ✅ | ⚠️ | ❌ | ❌ | — | ❌ | 2.5/4 |
| mapbox-ios-patterns | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | 1.5/4 |
| mapbox-maplibre-migration | ✅ | ⚠️ | ❌ | ❌ | ❌ | — | ❌ | 1.5/4 |
| mapbox-search-patterns | ✅ | ⚠️ | ❌ | ❌ | ❌ | — | ❌ | 1.5/4 |
| mapbox-web-performance-patterns | ✅ | ✅ | ❌ | ❌ | ❌ | — | ❌ | 2/4 |
| mapbox-android-patterns | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | 1.5/4 |
| mapbox-google-maps-migration | ✅ | ⚠️ | ❌ | ❌ | ❌ | — | ❌ | 1.5/4 |
| mapbox-store-locator-patterns | ✅ | ✅ | ❌ | ❌ | ❌ | — | ❌ | 2/4 |
| mapbox-data-visualization-patterns | ✅ | ⚠️ | ❌ | ❌ | ❌ | — | ❌ | 1.5/4 |
| mapbox-web-integration-patterns | ✅ | ✅ | ❌ | ❌ | ❌ | — | ❌ | 2/4 |
| mapbox-style-patterns | ✅ | ✅ | ❌ | ❌ | ❌ | — | ❌ | 2/4 |
| mapbox-mcp-runtime-patterns | ✅ | ✅ | ❌ | ❌ | ❌ | — | ❌ | 2/4 |
| mapbox-search-integration | ✅ | ⚠️ | ❌ | ❌ | ❌ | — | ❌ | 1.5/4 |

> ✅ = Compliant, ⚠️ = Partially compliant, ❌ = Non-compliant/Missing, — = Not applicable

---

## 8. Proposed Next Steps

| Step | Action |
|------|--------|
| 1 | Pick `mapbox-search-integration` as the reference implementation — split into SKILL.md + references/, validate with `skills-ref` |
| 2 | Add a SKILL.md line-count check to `validate:skills` CI script (fail on > 500 lines) with allowlist for in-progress migrations |
| 3 | Apply the same split pattern to remaining 6 red skills, one PR per skill |
| 4 | Add "Use when..." trigger keywords to 8 descriptions missing them |
| 5 | Move AGENTS.md → references/AGENTS.md across all skills |
| 6 | Add `license`, `compatibility`, `metadata` fields to all frontmatter |
| 7 | Remove CI allowlist once all skills are under 500 lines |

---

## Appendix: Key Specification Requirements

Source: https://agentskills.io/specification

- **SKILL.md** is the only required file, containing YAML frontmatter + Markdown body
- **Required fields:** `name` (≤64 chars, lowercase + hyphens), `description` (≤1024 chars)
- **Optional fields:** `license`, `compatibility`, `metadata`, `allowed-tools`
- **Recommended size:** SKILL.md < 500 lines; move detailed content to `references/`
- **Progressive disclosure:** At startup, load only name + description (~100 tokens). On activation, load full SKILL.md (recommended < 5000 tokens). During execution, load references/scripts/assets on demand
- **Directory structure:** `scripts/` (executable code), `references/` (documentation), `assets/` (static resources)

---

## Appendix: How Progressive Disclosure Works

```
┌─────────────────────────────────────────────────────────┐
│ Startup: Load name + description only (~100 tokens)     │
│                                                         │
│   17 skills × ~100 tokens = ~1,700 tokens total         │
│   Agent knows WHAT each skill does and WHEN to use it   │
├─────────────────────────────────────────────────────────┤
│ Activation: Load full SKILL.md (target < 5,000 tokens)  │
│                                                         │
│   Current avg: ~2,200 tokens (within budget)            │
│   BUT 7 skills load 6,000–12,000 tokens (over budget)   │
│   → Wastes context on examples agent may not need       │
├─────────────────────────────────────────────────────────┤
│ Execution: Load references/ on demand                   │
│                                                         │
│   Currently: NOT USED (0/17 skills have references/)    │
│   Proposed: Move code examples + API docs here          │
│   → Agent loads only what it actually needs             │
└─────────────────────────────────────────────────────────┘
```

This is why splitting matters: a 1,926-line SKILL.md forces the agent to load ~12,000 tokens of content it may never use, leaving less room for reasoning about the user's actual problem.
