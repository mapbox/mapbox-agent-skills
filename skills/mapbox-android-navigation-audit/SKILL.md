---
name: mapbox-android-navigation-audit
description: Audit an Android app's Mapbox Navigation SDK v3 integration with a coding agent. Finds outdated or deprecated API usage, functionality the app rebuilt that the SDK already provides (route progress math, reroute handling, UI components), and known performance, memory and lifecycle antipatterns, using a catalog and checks prepared by Mapbox engineers. Produces a findings table with stable IDs, confidence and false-positive risk. Read-only by default. Runs alongside mapbox-android-maps-audit for the map layer. Use when reviewing a Navigation SDK v3 integration on Android, after a migration to Navigation v3, or when chasing memory or lifecycle problems in navigation screens.
---

# Mapbox Navigation SDK Integration Audit (Android)

Reviews how an Android app uses the Mapbox Navigation SDK v3 and reports what to change. The agent searches the app's code for the patterns described in the reference. It doesn't need the SDK source.

The audit finds three kinds of issues:

1. **Outdated or inefficient API usage:** the app uses an older, deprecated or costly pattern where a current API exists
2. **Reimplemented functionality:** the app built something the SDK already provides
3. **Performance and correctness antipatterns:** known-costly or known-unsafe usage

**Reference file:** `references/navigation-android.md`, ID prefix `NAV`, minimum version Navigation SDK 3.18.0. It has a **Part A** catalog (current APIs, or what the SDK provides), a **Part B** list of antipatterns, and **Part C** checks (prompts) that drive the audit, plus a priority order for the report.

A navigation app also has a map. Run `mapbox-android-maps-audit` (ID prefix `MAPS`) alongside this audit for the map layer. The prefixes keep the findings apart in one report.

## When to use

- The developer asks for a review, audit or health check of their Navigation SDK integration on Android
- After a Navigation v2 → v3 migration (the migration skill recommends this as the next step)
- Navigation screens leak memory, observers fire more than once, or route progress, rerouting or arrival behave inconsistently

**Not covered:**

- Apps below Navigation SDK 3.18.0. A Navigation v2 app needs a migration first: use `mapbox-android-navigation-v2-to-v3-migration`.
- Navigation SDK for iOS and the Search SDK. There is no reference for them yet. Say so instead of improvising checks.
- Flutter, React Native and web apps
- Choosing a map style or moving to Mapbox Standard. That is a design decision, not a finding.
- Pricing, licensing and account questions

## Rules

### 1. Grounding

Only report a finding when it matches a catalog entry (Part A) or an antipattern (Part B) in the reference. If you're unsure whether an API exists in the app's SDK version or has the stated signature, tag the finding `[VERIFY WITH MAPBOX]` and describe what you saw. Don't invent method, property or type names.

### 2. Check the version first

Read the SDK versions from the app's Gradle files or version catalog before running any check. Every finding must be valid for that version:

- Skip entries that need a newer version than the app uses. Rows say "since `3.20.0`" or similar.
- Entries marked ★ are experimental. Confirm they exist in the app's version before recommending them.

### 3. Respect the app's design choices

- **Style.** Don't report the app's map style, or not using Mapbox Standard, as a finding.
- **UI framework.** Views and Jetpack Compose are both supported. Don't report the choice of UI framework as a finding.
- Where the reference says something is "not a finding" or "a pass", don't report it, even if it looks like the antipattern at first glance.

### 4. Read-only by default

The audit reports. It doesn't change code. Fix findings only when the developer asks, and then one finding at a time (see Fixing findings).

### 5. Every finding carries its evidence

Cite `File:line`, the observed pattern and the matching ID. State the confidence and the false-positive risk (for example "intentional: the app computes ETA from its own dispatch data"). The reference lists common false positives per check. Read them before reporting.

## Scoped questions vs a full audit

When the developer asks about specific code ("is anything wrong with this observer?"), answer that directly. Don't run the whole workflow:

1. Check the version, then match the code against the relevant Part A and Part B entries
2. Give the findings first, in the output schema, with the cause and the fix (adapt the reference's "Prefer" example)
3. Mention anything in the snippet that looks like an antipattern but isn't, with one line on why
4. Offer a full audit as a follow-up

Run the full workflow below when the developer asks for an audit, review or health check of the integration as a whole.

## Workflow

### Step 1: Scope

1. Find the Navigation and Maps SDK versions, and any other Mapbox SDKs the app depends on
2. Plan to run `mapbox-android-maps-audit` for the map layer alongside this audit. If it isn't installed, say the map layer wasn't audited.
3. Note how the app owns `MapboxNavigation` (`MapboxNavigationApp`, `MapboxNavigationProvider`) and which screens use navigation
4. Tell the developer which checks apply, which checks you'll skip and why, and what the report will contain (the outline in step 5)

### Step 2: Inventory

Run `NAV-P1` (and `MAPS-P1` from the Maps audit). It lists the SDK symbols the app uses, its dependencies and its main navigation features. Later checks rely on it. Inventory output uses the columns its check gives, not the findings schema.

### Step 3: Run the checks

Run the remaining Part C checks **one at a time, in order**:

- Skip checks that don't apply (for example Coordination API checks when the app doesn't use it) and say why
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
| Check ID | File:line          | Pattern observed                                                         | SDK equivalent (ID) | Confidence | FP risk | Suggested change                                           |
| -------- | ------------------ | ------------------------------------------------------------------------ | ------------------- | ---------- | ------- | ---------------------------------------------------------- |
| NAV-P6   | TripFragment.kt:57 | `registerRouteProgressObserver { ... }` inline lambda in `onViewCreated` | NAV-MEMORY-3        | High       | Low     | Keep the observer in a field and unregister it in teardown |
```

- **Check ID:** the Part C prompt that found it
- **SDK equivalent (ID):** the full catalog or antipattern ID, with its prefix. If nothing matches, don't report it, or tag it `[VERIFY WITH MAPBOX]`.
- **Confidence:** High, Medium or Low
- **FP risk:** why this might be intentional or a false positive

Where the reference asks for one table instead of one row per call site, follow the reference.

## Fixing findings

When the developer asks to fix findings:

1. Go in the report's priority order, or the order the developer picks
2. One finding at a time. Apply the fix from the reference's "Prefer" example, adapted to the app's code.
3. Build after each fix (`./gradlew assembleDebug` or the app's variant), and run the existing tests
4. Re-run the check that produced the finding to confirm it's gone and that nothing new appeared
5. Don't change the style, the UI framework or behavior the app relies on as a side effect of a fix. If a fix changes what the user sees or hears, say so before applying it.

## Related skills

- `mapbox-android-navigation-v2-to-v3-migration`: run this first on apps below Navigation v3
- `mapbox-android-maps-audit`: the Maps SDK audit, run alongside this one
- `mapbox-navigation-patterns`, `mapbox-android-patterns`: how to build features correctly in the first place
