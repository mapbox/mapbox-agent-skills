# Inventory Report Templates

Fill these in during the workflow and write them to the report files (SKILL.md step 7). Every row has a repo-relative `file:line`. SDK facts follow SKILL.md rule 2.

## Summary

```markdown
## Mapbox usage inventory — <app / module>

Scope: <modules, flavors, build types>. Tests: included | excluded
Versions resolved from: <configuration, e.g. releaseRuntimeClasspath> | not resolved (declared only)
SDK sources: <where read, per artifact> | not available
Searched: <paths>. Skipped: <generated code, build/, ...>

### Versions

| Artifact                               | Declared      | Resolved | Declared in   | Notes               |
| -------------------------------------- | ------------- | -------- | ------------- | ------------------- |
| `com.mapbox.maps:android`              | `libs.mapbox` | 11.x.y   | `app`         | via version catalog |
| `com.mapbox.navigationcore:navigation` | 3.x.y         | 3.x.y    | `app`, `:nav` |                     |

Toolchain: AGP x, Gradle x, Kotlin x, JDK x, compileSdk x, minSdk x

### Modules

| Artifact | Gradle modules | Imports in code | Notes |
| -------- | -------------- | --------------- | ----- |
```

## Usage table

One row per symbol and overload. Count call sites. `Call-site types` is what the app code passes. `SDK signature` comes from the SDK sources, or is `unresolved`.

```markdown
| Area    | Class                  | Member         | Call-site types / constant | SDK signature                   | Call sites | Where (file:line)                                         | Context     | Flags |
| ------- | ---------------------- | -------------- | -------------------------- | ------------------------------- | ---------- | --------------------------------------------------------- | ----------- | ----- |
| Camera  | `MapboxMap`            | `setCamera`    | `(CameraOptions)`          | `unresolved`                    | 3          | `app/src/main/java/com/acme/MapFragment.kt:88`, `...:140` | user action |       |
| Routing | `RouteOptions.Builder` | `alternatives` | `(Boolean)`                | `sdk`: `alternatives(Boolean?)` | 1          | `app/src/main/java/com/acme/RouteRequester.kt:42`         | per request |       |
| Setup   | `MapboxNavigationApp`  | `setup`        | `(NavigationOptions)`      | `unresolved`                    | 1          | `app/src/main/java/com/acme/App.kt:31`                    | startup     |       |
```

`Flags`: `experimental` (give the annotation, for example `@MapboxExperimental`, `@ExperimentalMapboxNavigationAPI` or `@ExperimentalPreviewMapboxNavigationAPI`), `delicate` (`@MapboxDelicateApi`), `deprecated`, `internal` (an `internal` package or `@RestrictTo`), `wrapped` (called through an app wrapper). Leave empty when none.

## Parameters table

One row per call that takes configuration, per call site.

```markdown
| Call                     | Call site (file:line)      | Parameter                                | Value                                | Kind        | Value source               |
| ------------------------ | -------------------------- | ---------------------------------------- | ------------------------------------ | ----------- | -------------------------- |
| `RouteOptions.builder()` | `.../RouteRequester.kt:36` | `coordinatesList`                        | user location + `destination`        | dynamic     | `DestinationRepo`          |
| `RouteOptions.builder()` | `.../RouteRequester.kt:36` | `exclude`                                | `EXCLUDE_TOLL` = `toll`              | constant    | `RouteRequester.kt:12`     |
| `RouteOptions.builder()` | `.../RouteRequester.kt:36` | `alternatives`                           | `true`                               | literal     |                            |
| `RouteOptions.builder()` | `.../RouteRequester.kt:36` | set by `applyDefaultNavigationOptions()` | <each value it sets> or `unresolved` | sdk-default | SDK sources, version x.y.z |
```

A secret literal has the value `<redacted: kind>`. `Kind`: `literal`, `constant` (named constant, give its value), `dynamic` (give where it comes from), `sdk-default` (set inside an SDK call, read from the SDK sources).

## What to capture per area

- **Route request:** every option set on `RouteOptions` or the request builder, including the values set by SDK helper calls such as `applyDefaultNavigationOptions()` (profile, coordinates and waypoint indices, alternatives, steps, annotations, exclusions, language, voice and banner instructions, overview, continue straight, refresh, departure or arrival time, any option not on this list), the interceptor if any, and the callback class or function that receives the result (SKILL.md rule 8)
- **Navigation setup:** `NavigationOptions` fields, location provider and engine, replay, telemetry and event settings, notification and foreground service options
- **Trip session and observers:** each observer registered (progress, routes, location matcher, off-route, arrival, rerouting, alternatives, voice, banner), and where it is unregistered
- **Map:** `MapInitOptions` fields, style URI or JSON, map options (`MapOptions`, constrain mode, glyph rasterization), gesture settings, ornaments, debug options
- **Camera:** `CameraOptions` fields, animation options, `viewport` and follow modes, padding
- **Style:** sources, layers and expressions added at runtime, with their ids and types
- **Annotations and interactions:** annotation managers and their options, tap and click handlers, queried features and layer filters
- **Location:** puck type and its settings, location provider, permissions flow
- **UI components:** each Mapbox view or widget, its options, and the app styling or binders applied
- **Offline:** tile store and region options, style packs, download and eviction settings
- **Other APIs:** direct HTTP calls to Mapbox endpoints (URL path, query parameters, which token type)

## Non-code configuration

```markdown
| Kind     | Where                     | What                                          |
| -------- | ------------------------- | --------------------------------------------- |
| Token    | `res/values/mapbox.xml:3` | `mapbox_access_token`, type `pk.`             |
| Style    | `MapFragment.kt:50`       | `mapbox://styles/<owner>/<id>`                |
| Manifest | `AndroidManifest.xml:12`  | `FOREGROUND_SERVICE_LOCATION`                 |
| XML      | `fragment_map.xml:7`      | `MapView` with `mapbox:mapbox_...` attributes |
```

Never print a token value or any other secret (SKILL.md rule 3). A secret passed as a literal is `<redacted: kind>` in the parameters table and in the JSON.

## JSON record

Write one JSON file next to the report so two runs can be compared. Paths are repo-relative. Parameters belong to the call site, not the symbol. Sort `versions` by artifact, `usage` by area, class, member and call-site types, and `calls` by file and line.

```json
{
  "app": "<name>",
  "scope": {
    "modules": ["app"],
    "variants": ["release"],
    "tests": false
  },
  "versions": [
    {
      "artifact": "com.mapbox.maps:android",
      "declared": "11.13.0",
      "resolved": "11.13.0",
      "module": "app",
      "configuration": "releaseRuntimeClasspath"
    }
  ],
  "usage": [
    {
      "area": "Routing",
      "class": "RouteOptions.Builder",
      "member": "alternatives",
      "callSiteTypes": "(Boolean)",
      "sdkSignature": "unresolved",
      "flags": [],
      "calls": [
        {
          "file": "app/src/main/java/com/acme/RouteRequester.kt",
          "line": 42,
          "context": "per request",
          "wrappedBy": null,
          "parameters": [
            {
              "name": "alternatives",
              "value": "true",
              "kind": "literal",
              "source": null
            }
          ]
        }
      ]
    }
  ],
  "config": [
    {
      "kind": "token",
      "where": "app/src/main/res/values/mapbox.xml:3",
      "what": "mapbox_access_token, type pk."
    }
  ],
  "notSearched": ["build/", "generated sources"]
}
```
