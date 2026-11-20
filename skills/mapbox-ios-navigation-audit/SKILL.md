---
name: mapbox-ios-navigation-audit
description: Audit an iOS app's Mapbox Navigation SDK v3 integration with a coding agent. Finds outdated or deprecated API usage, functionality the app rebuilt that the SDK already provides, and known antipatterns in provider and session lifecycle, Combine subscriptions, Swift concurrency, route progress, map gestures and camera, voice and SPI use, using a catalog and checks prepared by Mapbox engineers. Produces a findings table with stable IDs, confidence and false-positive risk. Read-only by default. Runs alongside mapbox-ios-maps-audit for the map layer. Use when reviewing a Navigation SDK v3 integration on iOS, after a migration to Navigation v3, or when chasing crashes, leaks or lifecycle problems in navigation screens.
---

# Mapbox Navigation SDK Integration Audit (iOS)

Reviews how an iOS app uses the Mapbox Navigation SDK v3 (`MapboxNavigationCore`, `MapboxNavigationUIKit`) and reports what to change. The agent searches the app's code for the patterns described in the reference. It doesn't need the SDK source.

The audit finds three kinds of issues:

1. **Outdated or inefficient API usage:** the app uses an older, deprecated or costly pattern where a current API exists
2. **Reimplemented functionality:** the app built something the SDK already provides
3. **Performance and correctness antipatterns:** known-costly or known-unsafe usage

**Reference file:** `references/navigation-ios.md`, ID prefix `NAVIOS`, minimum version Navigation SDK 3.16.0. It has a **Part A** catalog (what the SDK provides), a **Part B** list of antipatterns, and **Part C** checks (prompts) that drive the audit, plus a priority order for the report.

A navigation app also has a map. Run `mapbox-ios-maps-audit` (ID prefix `MAPSIOS`) alongside this audit for the map layer. The prefixes keep the findings apart in one report. `NavigationMapView.mapView` is a Maps v11 `MapView`, but some Maps checks work differently on it: the reference lists them under "Using this reference with `maps-ios.md`". Read that list before running the Maps checks.

## When to use

- The developer asks for a review, audit or health check of their Navigation SDK integration on iOS
- After a Navigation v2 → v3 migration (the migration skill recommends this as the next step)
- Navigation screens crash on a second open, leak, stop updating, or behave inconsistently

**Not covered:**

- Apps below Navigation SDK 3.16.0. A Navigation v2 app needs a migration first: use `mapbox-ios-navigation-v2-to-v3-migration`.
- The Search SDK. There is no reference for it yet. Say so instead of improvising checks.
- Flutter, React Native and web apps
- Choosing a map style or moving to Mapbox Standard. That is a design decision, not a finding.
- Pricing, licensing and account questions

## Rules

### 1. Grounding

Only report a finding when it matches a catalog entry (Part A) or an antipattern (Part B) in the reference. If you're unsure whether an API exists in the app's SDK version or has the stated signature, tag the finding `[VERIFY WITH MAPBOX]` and describe what you saw. Don't invent method, property or type names.

**SPI is not public API.** Never recommend a symbol marked `@_spi(...)` as a fix. Where the app already uses one, report it as the reference says.

### 2. Check the version first

Read the SDK versions from `Package.resolved` before running any check. Every finding must be valid for that version:

- Skip entries that need a newer version than the app uses. Rows say so inline.
- Entries marked ★ are experimental. Confirm they exist in the app's version before recommending them.

### 3. Respect the app's design choices

- **Style.** Don't report the app's map style, or not using Mapbox Standard, as a finding.
- **UI framework.** UIKit and SwiftUI hosting are both supported. Don't report the choice of UI framework, or building a custom UI instead of `NavigationViewController`, as a finding.
- Where the reference says something is "not a finding" or "a pass", don't report it, even if it looks like the antipattern at first glance.

### 4. Read-only by default

The audit reports. It doesn't change code. Fix findings only when the developer asks, and then one finding at a time (see Fixing findings).

### 5. Every finding carries its evidence

Cite `File:line`, the observed pattern and the matching ID. State the confidence and the false-positive risk. The reference lists common false positives per check. Read them before reporting.

## Scoped questions vs a full audit

When the developer asks about specific code ("why does this crash on the second open?", "why doesn't this label update?"), answer that directly. Don't run the whole workflow:

1. Check the version, then match the code against the relevant Part A and Part B entries
2. Give the findings first, in the output schema, with the cause and the fix (adapt the reference's "Prefer" example)
3. Mention anything in the snippet that looks like an antipattern but isn't, with one line on why
4. Offer a full audit as a follow-up

Run the full workflow below when the developer asks for an audit, review or health check of the integration as a whole.

## Workflow

### Step 1: Scope

1. Find the Navigation and Maps SDK versions, and any other Mapbox SDKs in the package graph
2. Plan to run `mapbox-ios-maps-audit` for the map layer alongside this audit. If it isn't installed, say the map layer wasn't audited.
3. Note where `MapboxNavigationProvider` is created and who owns it, which screens use `NavigationMapView` or `NavigationViewController`, and whether the app has CarPlay
4. Tell the developer which checks apply, which checks you'll skip and why, and what the report will contain (the outline in step 5)

### Step 2: Inventory

Run `NAVIOS-P1` (and `MAPSIOS-P1` from the Maps audit). It lists the SDK symbols the app uses, its dependencies, where the provider lives, and every `@_spi` or `_Private` import. Later checks rely on it. Inventory output uses the columns its check gives, not the findings schema.

### Step 3: Run the checks

Run the remaining Part C checks **one at a time, in order**:

- Skip checks that don't apply (for example voice checks when the app has no voice guidance) and say why
- Each check names the catalog entries and antipatterns it covers. Load those sections of the reference for the check.
- On a large codebase, finish and record one check before starting the next. If the context gets long, summarize the findings so far and continue from the next check.
- When a later check contradicts an earlier finding, correct the earlier one. Don't leave both versions in the report.

### Step 4: Open-ended review and summary

Run the reference's open-ended and summary checks last. They ask for things that look surprising or off-pattern without matching a specific ID, and for an executive summary. List open-ended observations separately from ID-backed findings, as questions for the developer.

### Step 5: Report

Write the report in this order. When the Maps audit ran too, combine both into one report:

1. **Summary:** SDKs and versions, navigation screens, the top 3 issues by impact, and what was skipped
2. **Findings**, grouped by check, in the reference's priority order (the **Reporting** section at the end of the reference gives it). Use the output schema below.
3. **Checked, not flagged:** patterns that looked like a finding but aren't, with one line on why. This saves the developer re-checking them.
4. **`[VERIFY WITH MAPBOX]` items**

The findings belong to the developer. If they want help from Mapbox, they can share the findings table and IDs. They don't need to share source code.

## Output schema

One row per finding:

```markdown
| Check ID  | File:line                   | Pattern observed                                                        | SDK equivalent (ID) | Confidence | FP risk | Suggested change                                    |
| --------- | --------------------------- | ----------------------------------------------------------------------- | ------------------- | ---------- | ------- | --------------------------------------------------- |
| NAVIOS-P3 | TripViewController.swift:31 | `_ = navigation.routeProgress.sink { … }`: subscription dropped at once | NAVIOS-B-COMBINE-1  | High       | Low     | Store the `AnyCancellable` in a set the screen owns |
```

- **Check ID:** the Part C prompt that found it
- **SDK equivalent (ID):** the full catalog or antipattern ID, with its prefix. If nothing matches, don't report it, or tag it `[VERIFY WITH MAPBOX]`.
- **Confidence:** High, Medium or Low
- **FP risk:** why this might be intentional or a false positive

Where the reference asks for one table instead of one row per call site (for example the deprecated-API sweep `NAVIOS-B-HYGIENE-3`), follow the reference.

## Fixing findings

When the developer asks to fix findings:

1. Go in the report's priority order, or the order the developer picks
2. One finding at a time. Apply the fix from the reference's "Prefer" example, adapted to the app's code.
3. Build after each fix (`xcodebuild` for the app scheme), and run the existing tests
4. Re-run the check that produced the finding to confirm it's gone and that nothing new appeared
5. Don't change the style, the UI framework or behavior the app relies on as a side effect of a fix. If a fix changes what the user sees or hears, say so before applying it.

## Related skills

- `mapbox-ios-navigation-v2-to-v3-migration`: run this first on apps below Navigation v3
- `mapbox-ios-maps-audit`: the Maps SDK audit, run alongside this one
- `mapbox-navigation-patterns`, `mapbox-ios-patterns`: how to build features correctly in the first place
