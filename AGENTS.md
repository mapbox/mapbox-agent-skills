# Mapbox Development Knowledge Base

This repo contains specialized Agent Skills for Mapbox development. Skills provide domain expertise that helps you make informed decisions when building map applications.

## Available Skills

### Migration & Platform Comparison

- **mapbox-google-maps-migration**: Migrate from Google Maps Platform to Mapbox GL JS. Covers API equivalents (coordinate order, markers, popups, geocoding), performance advantages (WebGL vs DOM), and migration patterns. Use when transitioning existing Google Maps apps or comparing platforms.
- **mapbox-maplibre-migration**: Migrate between Mapbox GL JS ↔ MapLibre GL JS. ~95% API compatible. Covers package/import changes, token handling, style URLs (mapbox:// vs custom), license differences. Use for open-source migrations or understanding compatibility.

### Performance & Optimization

- **mapbox-web-performance-patterns**: Optimize Mapbox GL JS apps. Covers initialization waterfalls, bundle size, marker performance (HTML vs Canvas vs Symbol layers), clustering, data loading (GeoJSON vs vector tiles), memory management. Critical patterns prioritized by UX impact.
- **mapbox-web-integration-patterns**: Framework integration (React, Vue, Svelte, Angular, Next.js). Covers proper initialization/cleanup, state management, SSR handling, component patterns. Use when integrating Mapbox into modern web frameworks.

### Design & Styling

- **mapbox-cartography**: Map design. Covers the **Standard** style and its config-first workflow (themes, light presets, slots, color overrides), **Classic styles and raw style JSON** (layer order, palette relationships), plus color, visual hierarchy, typography, dark mode, and accessibility. Platform-independent: applies to GL JS, Android, iOS, and Flutter. Use for creating visually effective, accessible maps.
- **mapbox-style-patterns**: Style recipes for common use cases (POI finder, real estate, data viz, navigation, delivery), expressed as Standard config plus custom layers in slots. Use when implementing a specific map use case.
- **mapbox-style-quality**: Style validation, accessibility checks, performance optimization, testing patterns. Use when ensuring style quality and performance.

### Security

- **mapbox-token-security**: Access token best practices. Covers public vs secret tokens, URL restrictions, token rotation, scoping, rate limiting. Use when implementing secure token management.

### Mobile Development

- **mapbox-ios-patterns**: iOS integration with Swift, SwiftUI, UIKit (Maps SDK for iOS). Covers initialization, markers, annotations, camera control, platform-specific patterns.
- **mapbox-android-patterns**: Android integration with Kotlin, Jetpack Compose, View system (Maps SDK for Android). Covers setup, markers, styling, camera animations, platform patterns.

## How to Use Skills

Skills are invoked automatically by your AI assistant when relevant. You can also explicitly reference them:

- "Use the mapbox-web-performance-patterns skill to optimize this"
- "Check the mapbox-token-security skill for best practices"

Install skills: `npx skills add mapbox/mapbox-agent-skills`

## Skill Combinations

Common workflows that combine multiple skills:

- **Building production web app**: web-integration-patterns + web-performance-patterns + token-security
- **Migrating from Google Maps**: google-maps-migration + web-integration-patterns + token-security
- **Custom styled map**: cartography + style-patterns + style-quality
- **Cross-platform app**: ios-patterns + android-patterns + token-security
- **Open-source project**: maplibre-migration + web-performance-patterns

## Quick Decision Guide

**Choose Mapbox GL JS when**: Commercial support needed, Mapbox-hosted tiles/APIs required, latest features important
**Choose MapLibre GL JS when**: Open-source license required, self-hosted infrastructure, cost optimization, custom tile sources

**Performance priorities**: 1) Eliminate initialization waterfalls 2) Use data-driven symbol layers for 100+ markers 3) Use a vector tileset once the data runs to thousands of points 4) Cluster when points visibly overlap at the zooms users browse 5) Prefer config properties over `setStyle()` reloads

**Token security**: Always use public tokens (pk.\*) client-side, add URL restrictions, never commit tokens to git, rotate tokens if exposed
