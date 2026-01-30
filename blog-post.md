# Mapbox Agent Skills: Teaching AI Assistants to Build Better Maps

If you've been following along with what we're doing at Mapbox in the AI space, you know we've been busy. We launched our [Mapbox MCP Server](https://github.com/mapbox/mcp-server) ([announcement blog post](https://dev.to/mapbox/introducing-the-mapbox-mcp-server-location-intelligence-for-ai-agents-4bia)) that gives AI agents access to geocoding, routing, search, isochrones, and more location intelligence capabilities. We also have a Mapbox-specific agent in private preview that's been helping developers build mapping applications. Today, I'm excited to share what we've been working on next: **Mapbox Agent Skills**.

## What Are Agent Skills?

Think of agent skills like giving your AI assistant a specialized education. Instead of just providing tools (like "create a style" or "geocode an address"), skills teach the AI the expertise and know-how behind building great mapping applications. They're folders containing instructions and best practices that AI assistants like Claude Code, Cursor, and GitHub Copilot can discover and use when helping you code.

Here's how I like to think about it:
- **Tools** provide actions (do this thing)
- **Prompts** provide workflows (do these steps in order)
- **Skills** provide domain expertise (here's how to make good decisions)

When you install a skill, you're basically giving the AI access to the collective knowledge that Mapbox engineers have built up over years of helping developers build mapping applications. It's like having a senior Mapbox engineer looking over your shoulder.

## Why Skills?

I've lost count of how many times I've seen developers hit the same issues over and over again:
- "My map with 5,000 markers is slow, what do I do?"
- "How do I properly set up Mapbox in React without memory leaks?"
- "What's the best token scope for my use case?"
- "Which colors should I use for my map style?"

These aren't questions that can be answered with a simple tool call. They require understanding performance thresholds, framework lifecycle patterns, security principles, and design best practices. That's exactly what skills provide.

The other reason I'm excited about skills is that they work across different AI assistants. Whether you're using Claude Code, Cursor, VS Code with Copilot, or any other assistant that supports the Agent Skills specification, you get the same Mapbox expertise. We write the skill once, and it helps developers everywhere.

## What's in the Box

We're launching with 8 comprehensive skills that cover the platforms and scenarios we see most often:

**Platform-Specific Integration:**
- **mapbox-web-integration-patterns**: React, Vue, Svelte, Angular, Next.js patterns with proper lifecycle management
- **mapbox-ios-patterns**: Swift, SwiftUI, UIKit integration with offline maps and Navigation SDK
- **mapbox-android-patterns**: Kotlin, Jetpack Compose, View system with mobile optimization

**Performance & Quality:**
- **mapbox-web-performance-patterns**: Marker thresholds, bundle size, rendering optimization
- **mapbox-style-quality**: Validation, accessibility checks, production readiness

**Design & Styling:**
- **mapbox-cartography**: Color theory, visual hierarchy, typography, map design principles
- **mapbox-style-patterns**: Common patterns for restaurant finders, real estate, data viz, etc.

**Security:**
- **mapbox-token-security**: Scope management, URL restrictions, rotation strategies

These 8 skills cover web, iOS, and Android development with a focus on the patterns and decisions that actually matter when building production mapping applications.

## How to Install

Installing skills is dead simple. We built a CLI tool that handles everything:

```bash
# Install all Mapbox skills
npx add-skill mapbox/mapbox-agent-skills

# Or just install one specific skill
npx add-skill mapbox/mapbox-agent-skills --skill mapbox-web-performance-patterns

# See what's available
npx add-skill mapbox/mapbox-agent-skills --list
```

The `add-skill` CLI works with Claude Code, Cursor, VS Code (Copilot), and other assistants. Just add the `-a` flag:

```bash
# For Cursor
npx add-skill mapbox/mapbox-agent-skills -a cursor

# For VS Code
npx add-skill mapbox/mapbox-agent-skills -a vscode
```

Once installed, the skills activate automatically when you're working on relevant tasks. You don't need to do anything special. Just ask your AI assistant for help like you normally would, and it'll use the skills when appropriate.

## What Each Skill Does

Let me walk through each skill and when you'd use it.

### mapbox-web-performance-patterns

This one answers the question "why is my map slow?" It includes decision trees for marker performance (HTML vs Canvas vs Symbol layers), data loading strategies (GeoJSON vs vector tiles), and bundle size optimization.

The skill includes specific thresholds:
- Less than 100 markers? HTML markers are fine
- 100 to 1,000? Use Symbol layers with GeoJSON
- 1,000 to 10,000? You need clustering
- More than 10,000? Time for server-side clustering

It also covers initialization waterfalls, event handling optimization (debouncing/throttling), and memory management patterns. Based on performance principles we've learned from optimizing thousands of production maps.

### mapbox-cartography

This skill is all about making maps that actually look good. It covers color theory, visual hierarchy, typography, and cartographic best practices.

When you ask "what colors should I use for my restaurant finder map?", the AI can reference this skill to explain why you want high contrast markers (#FF6B35 orange), a muted background so food photos pop, and simplified labels for better mobile UX. It's the design knowledge that separates okay maps from great ones.

### mapbox-web-integration-patterns

Probably our most used skill. It has official integration patterns for React, Vue, Svelte, Angular, and Next.js. Each pattern shows the right way to handle the framework's lifecycle, manage tokens, and integrate search.

The React pattern, for example, teaches the AI that you need `useRef` for both the map instance and container, initialization in `useEffect` with empty deps, and most importantly, a cleanup function that calls `map.remove()` to prevent memory leaks. These are the patterns from our `create-web-app` scaffolding tool, tested and proven.

### mapbox-ios-patterns

Everything you need for iOS development. Shows how to use the SwiftUI `UIViewRepresentable` pattern, UIKit lifecycle management, token handling with Info.plist or .xcconfig files, offline map storage, Navigation SDK integration, and battery optimization.

If you're building a mapping app for iOS, this skill helps the AI guide you through proper memory management (avoiding retain cycles), background map updates, and handling map state across SwiftUI view updates.

### mapbox-android-patterns

The Android equivalent. Covers Jetpack Compose with `AndroidView`, Activity/Fragment lifecycle, token management with BuildConfig or local.properties, offline maps, Navigation SDK, and battery/network optimization.

Helps avoid common Android mistakes like holding references that cause memory leaks or initializing maps at the wrong point in the lifecycle.

### mapbox-style-patterns

This skill has recipes for typical mapping scenarios. Restaurant finder? Use the POI pattern with desaturated backgrounds and high-contrast markers. Real estate map? Property emphasis pattern with bold property markers and simplified surroundings. Navigation map? High contrast roads, minimal POIs, clear labels.

It's like having a cookbook of proven map styles for common use cases.

### mapbox-style-quality

Before you ship a style to production, this skill helps validate it. Covers validation patterns for styles, expressions, and GeoJSON, accessibility checking (WCAG AA/AAA color contrast), style optimization, and production readiness checklists.

Catches issues before they become production problems.

### mapbox-token-security

Security is not optional. This skill teaches best practices for access tokens: when to use public vs secret vs temporary tokens, how to set up proper scopes (principle of least privilege), URL restrictions, storage patterns, rotation strategies, and incident response.

Helps developers create secure token patterns from day one instead of retrofitting security later.

## Where We're Going

These 8 skills are just the start. We already have 5 more skills in pull requests that'll ship soon:

- **mapbox-geospatial-operations**: Choosing between offline geometric tools (Turf.js) and routing APIs. I like calling this the "as the crow flies vs as the crow drives" skill because that's exactly what it teaches you to think about.

- **mapbox-search-patterns**: How to pick the right search tool and parameters. Do you need `search_and_geocode`, `category_search`, or `reverse_geocode`? This skill walks through the decision tree.

- **mapbox-google-maps-migration**: Comprehensive guide for teams moving from Google Maps to Mapbox GL JS. Side-by-side code comparisons, API equivalents, and migration checklists. Critical things like coordinate order (lat,lng vs lng,lat) that trip people up.

- **mapbox-maplibre-migration**: Bidirectional guide for moving between Mapbox and MapLibre. They're about 95% compatible (MapLibre forked from Mapbox GL JS v1.13.0), so this skill covers the 5% that's different: licensing, tokens, tile sources.

- **mapbox-search-integration**: A discovery-driven workflow for implementing search. Asks the right questions upfront (autocomplete or single search? web or mobile? session token budget?) before suggesting implementation patterns. Covers debouncing, session tokens, error handling.

These should land in the next few weeks as we wrap up review.

## Try It Out

If you're building with Mapbox and using an AI assistant, give these skills a shot. Install them with `npx add-skill mapbox/mapbox-agent-skills` and then just work normally. Ask questions, build features, optimize performance. You'll notice your AI assistant starts giving more specific, more accurate Mapbox guidance.

The skills are open source at [github.com/mapbox/mapbox-agent-skills](https://github.com/mapbox/mapbox-agent-skills). If you have ideas for new skills or improvements to existing ones, pull requests are welcome.

And if you want even more power, combine these skills with our [Mapbox MCP Server](https://github.com/mapbox/mcp-server). Skills provide the expertise (performance patterns, design principles, framework integration), and MCP tools provide the actions (geocoding, routing, search, static maps). Together, they enable complete workflows from idea to deployment.

Happy mapping!
