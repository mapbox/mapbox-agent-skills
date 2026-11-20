---
name: mapbox-android-sdk-inventory
description: Produce a factual inventory of what an Android app currently uses from the Mapbox SDKs, with a coding agent. Reports the resolved version of every Mapbox dependency, the modules used, every Mapbox class, function, overload and constant the code calls with file and line, the parameters passed (for example every route request option), and the non-code configuration (style, manifest, XML, offline, tokens by location only). Answers what is used and with which values. Read-only, version-agnostic, no recommendations. Use to answer "what do we use from Mapbox?", for support questions that depend on the exact parameters an app passes, or to compare two runs (for example before and after a migration). Migration planning and effort estimates come from the migration skills, not this one.
---

# Mapbox Android SDK Usage Inventory

Reports what an Android app uses from the Mapbox SDKs today. It describes. It doesn't judge, recommend or change anything. The agent searches the app's build files, code, XML and resources. For SDK signatures, annotations and defaults it reads the sources of the exact resolved SDK version when they are available (rule 2).

**Reference files:**

- `references/report-template.md`: the report templates, the JSON record format, and the parameters to capture per API area

Read it before step 1.

## When to use

- "What do we use from Mapbox?", "which SDK versions and modules?", "which route request options do we pass?"
- Support conversations where the exact usage and values matter, for example which request parameters an app sends
- Comparing two runs, for example before and after a migration, by diffing `inventory.json`
- Before a migration, to hand the result to a migration skill

**Not covered:**

- iOS, Flutter, React Native and web apps
- Judging usage (deprecated or inefficient APIs, antipatterns). If an audit skill is installed (`mapbox-android-maps-audit`, `mapbox-android-navigation-audit`), use it for an app already on Maps v11 / Navigation v3.
- Planning a migration, estimating its effort, or doing it. Use `mapbox-android-maps-v10-to-v11-migration` or `mapbox-android-navigation-v2-to-v3-migration`, and give them this inventory.
- Token security review (use `mapbox-token-security`), billing or pricing analysis

## Rules

1. **Read-only, except the report.** Don't edit, build or commit anything in the project. Running Gradle read-only tasks (`dependencies`, `projects`) is fine. Ask first if the build needs network access or a token. The report files are the only files written (step 7).
2. **Evidence for every entry.** Each row has a repo-relative `file:line` in the app. Facts about the SDK itself (a signature, an annotation, a default value) come only from the sources or API reference of the exact resolved version: the sources jar (in the Gradle cache or from the Mapbox Maven repository), or the public source repository and docs at that version tag. Label them `sdk` with the version. If you can't get them, write `unresolved`. Never fill them in from memory.
3. **Never print secrets.** This covers every secret and credential, not only Mapbox tokens: access tokens, API keys, passwords, signing configuration, Maven credentials, authorization headers and keys inside URLs. Record where each is set (file, key name, and for a Mapbox token its type `pk.`, `sk.` or other) and never the value. A literal passed to a call that is or looks like a secret is written as `<redacted>` with its kind, for example `<redacted: Mapbox public token>`. When in doubt, redact.
4. **Mark what you can't resolve.** A parameter that comes from a variable, remote config, a server or another module is `dynamic`, with the place it comes from. Never guess a value.
5. **Declared and resolved versions.** Declared in the build file and resolved by Gradle can differ (BOM, catalog, forced or transitive versions). Report both, per build variant when variants differ.
6. **No judgment.** Don't call anything wrong or slow, and don't recommend changes. The `deprecated`, `experimental`, `delicate` and `internal` flags are allowed as facts: `internal` from an `internal` package in the import or a `@RestrictTo` annotation in the SDK sources, the others from the SDK annotation (rule 2). Fixes and recommendations belong to other skills.
7. **Count honestly.** Report call sites (each call), not files. State what was searched and what was skipped (generated code, `build/`, tests unless asked).
8. **Mapbox usage only, no source excerpts.** Quote no app code beyond the Mapbox call expression itself. Don't describe what the app's own logic does, how it decides things, or code that doesn't touch Mapbox. When a value comes from app code or a result goes into it, name the class or function and stop there.

## Workflow

### 1. Scope

Find the Gradle modules, build types and product flavors. Ask which modules to cover only when the repo has several apps. A monorepo with several apps gets one inventory per app. Say whether tests are included (default: no).

### 2. Build and versions

From the Gradle files, version catalog and `dependencies` output:

- Every `com.mapbox.*` dependency: declared version, resolved version, module it is declared in, artifact variant (for example NDK or snapshot). Resolve against the release runtime classpath of each variant in scope, and name the configuration used. If Gradle can't run, report declared versions only and say so.
- Mapbox Maven repository and credentials setup, by location only
- AGP, Gradle, Kotlin, JDK, `compileSdk`, `minSdk`
- R8 / ProGuard rules that mention Mapbox
- Other libraries that wrap or depend on Mapbox (Compose extension, Android Auto, plugins, third-party)

### 3. Modules

List each Mapbox artifact in use and the Gradle modules that use it. Then check which are declared but unused (no import in code) and which are used through a transitive dependency without being declared. An artifact that a declared Mapbox artifact exposes as an `api` dependency counts as declared: for example `com.mapbox.maps:android` exposes its plugins and extensions, so using `mapView.gestures` needs no extra declaration. List only artifacts reached another way as transitive-only. To tell them apart, read the declared artifact's published POM or Gradle module metadata: its `api` dependencies are the ones in the compile scope (`apiElements`). If you can't read it, list the artifact as transitive and say that it wasn't checked.

### 4. Usage

Find every use of a Mapbox symbol in Kotlin and Java. Imports are only the starting point:

- Imports of `com.mapbox.*`, including wildcard imports, and fully qualified names in code
- Then follow the types. A file can call Mapbox members with no Mapbox import, for example the member call `mapView.mapboxMap.setCamera(...)` on an inferred type. Follow every variable, property, parameter and return value that holds a Mapbox type, into the files that receive it.
- Layout XML and Compose code that create Mapbox views

For each symbol, record the class, the function or property, the overload and each constant or enum value, with `file:line`. Record the argument types as written at the call site. The declared SDK signature comes from SDK sources (rule 2), or is `unresolved`. Include:

- Kotlin extension functions and DSL builders, Java call sites
- Calls made through the app's own wrappers (record the wrapper and its callers)
- Flags: `internal` from an `internal` package in the import or from `@RestrictTo` in the SDK sources (restricted symbols also live in normal packages), `experimental` from `@MapboxExperimental` (Maps) or `@ExperimentalMapboxNavigationAPI` and `@ExperimentalPreviewMapboxNavigationAPI` (Navigation), `delicate` from `@MapboxDelicateApi`, and `deprecated` from `@Deprecated`. Take them from the SDK annotation or an opt-in in app code, and record which annotation it is, because other Mapbox SDKs have their own.
- The lifecycle context of the call: once at startup, per location update, per frame, per user action. Say when it can't be told.

Group rows by area (setup, map, style, camera, annotations, gestures, location, routing, trip session, observers, UI, voice, offline, search, other). Use the record format in the reference.

### 5. Parameters

For calls that take configuration, record the values passed, not just that the call exists. The reference lists what to capture per area. For a route request, record every option set on the request and on any interceptor, and where the coordinates come from. Mark each value `literal`, `constant` or `dynamic`.

Some SDK calls set values the app code doesn't show, for example `applyDefaultNavigationOptions()` on a route request. Record the call, then list the values it sets from the SDK sources of the resolved version, marked `sdk-default`. If the sources aren't available, write `unresolved` and say that the request contains more than the app code shows.

### 6. Non-code configuration

Style URIs and style JSON (sources and layers if loaded from the app), `MapView` XML attributes, manifest permissions and services, offline regions and style packs, resource strings that feed SDK calls, direct HTTP calls to Mapbox APIs (Directions, Geocoding, Matrix, Tilequery and others) in the app code.

### 7. Report

Before writing, scan the whole report for secrets (rule 3): strings starting with `pk.`, `sk.` or `tk.`, JWT-like strings, long random-looking strings, `key=`, `token=`, `password=` and `Authorization` values, and URLs with credentials. Replace each with `<redacted>`. Also remove any code excerpt that rule 8 doesn't allow. Say in the summary how many values were redacted.

Write the report to files, because the full tables are too long for chat: `mapbox-inventory/inventory.md` and `mapbox-inventory/inventory.json` at the repository root, or a directory the developer names. Don't add them to git. Tell the developer where they are.

In chat, show only the summary:

- Versions and modules
- Areas used, with call-site counts
- Values that stayed `dynamic` or `unresolved`
- What wasn't searched, and anything you couldn't confirm

The report contains file paths, class names and style identifiers from the app. It belongs to the developer. Say so, and that they should review it before sharing it with anyone, including Mapbox.

Offer the next step by name (a migration or audit skill), and don't start it.
