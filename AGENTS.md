# Mapbox Development Knowledge Base

This repo contains specialized Agent Skills for Mapbox development. Skills provide domain expertise that helps you make informed decisions when building map applications.

## Available Skills

### Migration & Platform Comparison

- **mapbox-google-maps-migration**: Migrate from Google Maps Platform to Mapbox GL JS. Covers API equivalents (coordinate order, markers, popups, geocoding), performance advantages (WebGL vs DOM), and migration patterns. Use when transitioning existing Google Maps apps or comparing platforms.
- **mapbox-ios-maps-v10-to-v11-migration**: Migrate an iOS app from Maps SDK v10 to v11 (UIKit, SwiftUI). Five-step workflow (inventory, plan, migrate per area, verify, report). Targets current v11 APIs (Featureset Interactions, Feature State, typed events) rather than a literal port, surfaces behavior changes (default style, puck bearing) as decisions, and keeps the app's style. Use for v10 → v11 upgrades or effort estimates.
- **mapbox-android-maps-v10-to-v11-migration**: The same for an Android app (Kotlin, Java, Views, Jetpack Compose).
- **mapbox-ios-navigation-v2-to-v3-migration**: Migrate an iOS app from Navigation SDK v2 to v3 (includes the Maps v10 → v11 migration via mapbox-ios-maps-v10-to-v11-migration). Surfaces removed decision callbacks (reroute veto, arrival and leg advancing) as developer decisions, maps every v2 hook the app logs to its v3 source, and covers the move to Swift Package Manager and MapboxNavigationUIKit. Use for v2 → v3 upgrades or effort estimates.
- **mapbox-android-navigation-v2-to-v3-migration**: Migrate an Android app from Navigation SDK v2 to v3 (includes the Maps migration via mapbox-android-maps-v10-to-v11-migration). Surfaces removed hooks and new defaults as decisions, maps every v2 observer the app logs to its v3 source, and replaces the removed Drop-in UI (recommended: a copy of the public v2 Drop-in sources, adapted to v3, on the developer's approval). Use for v2 → v3 upgrades or effort estimates.
- **mapbox-maplibre-migration**: Migrate between Mapbox GL JS ↔ MapLibre GL JS. ~95% API compatible. Covers package/import changes, token handling, style URLs (mapbox:// vs custom), license differences. Use for open-source migrations or understanding compatibility.

### Performance & Optimization

- **mapbox-web-performance-patterns**: Optimize Mapbox GL JS apps. Covers initialization waterfalls, bundle size, marker performance (HTML vs Canvas vs Symbol layers), clustering, data loading (GeoJSON vs vector tiles), memory management. Critical patterns prioritized by UX impact.
- **mapbox-web-integration-patterns**: Framework integration (React, Vue, Svelte, Angular, Next.js). Covers proper initialization/cleanup, state management, SSR handling, component patterns. Use when integrating Mapbox into modern web frameworks.

### Design & Styling

- **mapbox-cartography**: Map design principles. Covers color theory, visual hierarchy, typography, accessibility, data visualization best practices. Use for creating visually effective, accessible maps.
- **mapbox-style-patterns**: Common style patterns and layer configurations. Covers data-driven styling, expressions, filters, layer types. Use when building custom map styles or configuring layers.
- **mapbox-style-quality**: Style validation, accessibility checks, performance optimization, testing patterns. Use when ensuring style quality and performance.

### Security

- **mapbox-token-security**: Access token best practices. Covers public vs secret tokens, URL restrictions, token rotation, scoping, rate limiting. Use when implementing secure token management.

### Mobile Development

- **mapbox-ios-patterns**: iOS integration with Swift, SwiftUI, UIKit (Maps SDK for iOS). Covers initialization, markers, annotations, camera control, platform-specific patterns.
- **mapbox-ios-swiftui-migration**: Move iOS map and navigation screens from UIKit to SwiftUI (Maps SDK v11, Navigation SDK v3). Covers the SwiftUI Map view, Viewport, map content for styles and annotations, MapReader, and hosting NavigationMapView, one screen at a time, without changing what the map looks like. Marks stable vs experimental APIs.
- **mapbox-android-patterns**: Android integration with Kotlin, Jetpack Compose, View system (Maps SDK for Android). Covers setup, markers, styling, camera animations, platform patterns.
- **mapbox-android-sdk-inventory**: Read-only inventory of what an Android app uses from the Mapbox SDKs. Reports resolved versions, modules, every class, function, overload and constant called with file and line, the parameters passed (such as route request options) and non-code configuration. No recommendations. Use to answer what an app uses and with which values, for support questions, or to compare two runs. Migration effort estimates come from the migration skills.
- **mapbox-android-compose-migration**: Move Android map and navigation screens from the View system to Jetpack Compose (Maps SDK v11, Navigation SDK v3). Covers the MapboxMap composable, viewport and style state, annotation composables, MapEffect, lifecycle and Navigation wiring, one screen at a time, without changing what the map looks like. Use alongside Google's XML-to-Compose skill.

## How to Use Skills

Skills are invoked automatically by your AI assistant when relevant. You can also explicitly reference them:

- "Use the mapbox-web-performance-patterns skill to optimize this"
- "Check the mapbox-token-security skill for best practices"

Install skills: `npx skills add mapbox/mapbox-agent-skills`

## Skill Combinations

Common workflows that combine multiple skills:

- **Building production web app**: web-integration-patterns + web-performance-patterns + token-security
- **Migrating from Google Maps**: google-maps-migration + web-integration-patterns + token-security
- **Upgrading a mobile app to Maps SDK v11**: ios-maps-v10-to-v11-migration + ios-patterns, or android-maps-v10-to-v11-migration + android-patterns
- **Upgrading a navigation app to Navigation SDK v3**: the platform's navigation-v2-to-v3-migration + maps-v10-to-v11-migration skills (ios- or android-) + navigation-patterns
- **Custom styled map**: cartography + style-patterns + style-quality
- **Cross-platform app**: ios-patterns + android-patterns + token-security
- **Moving iOS map screens to SwiftUI**: ios-swiftui-migration + ios-patterns
- **Moving Android map screens to Compose**: android-compose-migration + android-patterns
- **Open-source project**: maplibre-migration + web-performance-patterns

## Quick Decision Guide

**Choose Mapbox GL JS when**: Commercial support needed, Mapbox-hosted tiles/APIs required, latest features important
**Choose MapLibre GL JS when**: Open-source license required, self-hosted infrastructure, cost optimization, custom tile sources

**Performance priorities**: 1) Eliminate initialization waterfalls 2) Use data-driven symbol layers for 100+ markers 3) Implement clustering for 1000+ points 4) Use vector tiles over large GeoJSON

**Token security**: Always use public tokens (pk.\*) client-side, add URL restrictions, never commit tokens to git, rotate tokens if exposed
