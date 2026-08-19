---
name: mapbox-navigation-patterns
description: Navigation implementation patterns for turn-by-turn directions, route optimization, real-time traffic, multi-stop routing, and voice guidance across web, iOS, and Android platforms
---

# Mapbox Navigation Patterns

Expert guidance for implementing navigation and routing features using Mapbox Directions API and Navigation SDKs. Covers turn-by-turn navigation, route optimization, real-time traffic integration, multi-stop routing, and navigation UI components.

## Use This Skill When

User says things like:

- "I need turn-by-turn navigation in my app"
- "How do I add driving directions?"
- "I want to show a route on the map"
- "I need multi-stop routing"
- "How do I add voice guidance?"
- "I want real-time traffic updates"
- "I need to optimize delivery routes"

## Product Overview

### Directions API (REST)

**Best for:** Web applications, simple routing, backend route calculation

**Features:**

- Route calculation (driving, walking, cycling, traffic)
- Alternative routes
- Turn-by-turn instructions
- Multi-stop routing (up to 25 waypoints)
- Route optimization
- Real-time traffic data
- Avoid specific roads/areas

**Pricing:** Pay per request

### Navigation SDK for iOS

**Best for:** Native iOS apps with turn-by-turn navigation

**Defaults:** SwiftUI app shell + wrap drop-in `NavigationViewController` via `UIViewControllerRepresentable` (official getting-started path). Use a fully custom Core UI ([CoreSDKExample](https://github.com/mapbox/mapbox-navigation-ios/tree/main/Examples/CoreSDKExample)) only when the user explicitly wants to build their own nav chrome.

**Before coding:** SPM (`MapboxNavigationCore` + `MapboxNavigationUIKit`), `.netrc` download token, `MBXAccessToken`, location permissions, background `audio`/`location` — see [install guide](https://docs.mapbox.com/ios/navigation/guides/install/) and the iOS reference checklist.

**Features:**

- Drop-in turn-by-turn UI (`NavigationViewController`) — default
- Optional fully custom Core UI (route progress / banner publishers)
- Voice guidance (30+ languages)
- Real-time rerouting
- Traffic-aware routing
- Offline maps and routing
- Route progress tracking
- Speed limit display

**Pricing:** Monthly Active Users (MAU) based

### Navigation SDK for Android

**Best for:** Native Android apps with turn-by-turn navigation

**Features:**

- Complete turn-by-turn navigation UI
- Voice guidance (30+ languages)
- Real-time rerouting
- Traffic-aware routing
- Offline maps and routing
- Custom UI components
- Route progress tracking
- Speed limit display

**Pricing:** Monthly Active Users (MAU) based

## Decision Guide

### Choose Directions API when:

- ✅ Web application
- ✅ Simple route display (no turn-by-turn)
- ✅ Backend route calculation
- ✅ Route planning and optimization
- ✅ Multi-stop routing
- ✅ Don't need voice guidance

### Choose Navigation SDK when:

- ✅ Native mobile app (iOS/Android)
- ✅ Need turn-by-turn navigation
- ✅ Need voice guidance
- ✅ Need navigation UI components
- ✅ Need offline navigation
- ✅ Need real-time rerouting
- ✅ Building a navigation/delivery app

## Implementation Patterns

- **[references/web-directions-api.md](references/web-directions-api.md)** - Directions API patterns for the web: basic route display, turn-by-turn instructions, alternative routes, multi-stop routing, route optimization, and congestion-based route coloring
- **[references/ios-navigation-sdk.md](references/ios-navigation-sdk.md)** - When: iOS turn-by-turn, setup, default SwiftUI + wrapped `NavigationViewController`, Core opt-in, example catalog
- **[references/ios-navigation-specialized.md](references/ios-navigation-specialized.md)** - When: multi-stop, route line, camera, road cameras, route alerts, or `NavigationMapView` customization
- **[references/android-navigation-sdk.md](references/android-navigation-sdk.md)** - Navigation SDK for Android: basic turn-by-turn navigation, custom navigation UI, route line rendering, maneuver arrows, navigation camera, voice guidance
- **[references/android-performance-antipatterns.md](references/android-performance-antipatterns.md)** - Android Navigation SDK performance and correctness antipatterns: Native Route Object traversal costs, threading, memory/lifecycle leaks, route management correctness, frequent-callback rendering efficiency, and Coordination API lifecycle
- **[references/best-practices.md](references/best-practices.md)** - Route caching, error handling, performance optimization, user experience, and common use cases (delivery routing, ride-sharing ETAs, walking/cycling directions)

## Related Skills

- **mapbox-search-integration**: Address search and geocoding
- **mapbox-web-performance-patterns**: Optimizing navigation performance
- **mapbox-ios-patterns**: iOS-specific integration patterns
- **mapbox-android-patterns**: Android-specific integration patterns
- **mapbox-token-security**: Securing your access tokens

## Resources

- [Directions API Documentation](https://docs.mapbox.com/api/navigation/directions/)
- [Navigation SDK for iOS](https://docs.mapbox.com/ios/navigation/)
- [Navigation SDK for Android](https://docs.mapbox.com/android/navigation/)
- [Optimization API Documentation](https://docs.mapbox.com/api/navigation/optimization/)
- [Map Matching API](https://docs.mapbox.com/api/navigation/map-matching/)
- [Navigation Products Overview](https://docs.mapbox.com/help/getting-started/navigation/)

## Quick Decision Guide

**User says: "I need directions"**

- Web app → Use Directions API
- Mobile app → Use Navigation SDK

**User says: "I need turn-by-turn navigation"**

- iOS → Navigation SDK for iOS (SwiftUI + wrapped `NavigationViewController` by default; Core custom UI only if requested)
- Android → Navigation SDK for Android
- Web → Use Directions API + custom UI (no voice guidance)

**User says: "I need to optimize delivery routes"**
→ Use Optimization API (multi-stop route optimization)

**User says: "I need real-time traffic"**
→ Use `driving-traffic` profile with Directions API or Navigation SDK

**User says: "I need voice guidance"**
→ Must use Navigation SDK (iOS/Android only)

**User says: "Directions API or Navigation SDK?"**
→ Native turn-by-turn / voice → Navigation SDK (**MAU** pricing). Web / route display only → Directions API (**pay-per-request**).
