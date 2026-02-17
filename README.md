# Mapbox Agent Skills

**Comprehensive Agent Skills** that teach AI assistants how to build fast, beautiful, secure Mapbox applications across **Web, iOS, and Android** platforms. Covers performance optimization, cartographic design, framework integration, platform migration, search integration, navigation, geospatial operations, and security best practices.

## Quick Start

Install all Mapbox Agent Skills:

```bash
npx skills add mapbox/mapbox-agent-skills
```

Install specific skills:

```bash
npx skills add mapbox/mapbox-agent-skills --skill mapbox-web-performance-patterns
```

List available skills:

```bash
npx skills add mapbox/mapbox-agent-skills --list
```

> **💡 Pro tip:** These skills work great on their own, but they're even more powerful when combined with the [Mapbox MCP DevKit Server](https://github.com/mapbox/mcp-devkit-server). Skills provide the expertise (performance patterns, design principles), while MCP tools provide the actions (create styles, generate previews). Together, they enable complete workflows from design to deployment.

## What are Agent Skills?

Agent Skills are folders containing instructions and resources that AI assistants (like Claude Code, Cursor, GitHub Copilot) can discover and use to perform tasks more effectively. Unlike tools (which provide actions) or prompts (which provide workflows), skills provide **domain expertise** - the "know-how" that helps AI make informed decisions.

Think of skills as giving your AI assistant a specialized education in Mapbox development best practices.

## Available Skills

**Platform Coverage:**

- 🌐 **Web**: React, Vue, Svelte, Angular, Next.js (Mapbox GL JS)
- 📱 **iOS**: Swift, SwiftUI, UIKit (Maps SDK for iOS)
- 📱 **Android**: Kotlin, Jetpack Compose, View system (Maps SDK for Android)

---

### 🗺️ mapbox-geospatial-operations

**Expert guidance on choosing between offline geometric tools and routing APIs for geospatial operations.**

Helps AI assistants select the right tool based on problem type (geometric vs routing), accuracy requirements, and performance needs. Features the "as the crow flies" vs "as the crow drives" decision framework.

**Use when:**

- Deciding between offline calculations and API calls
- Calculating distances (straight-line vs road distance)
- Checking if points are within an area
- Creating travel-time zones vs distance buffers
- Optimizing geospatial operations for performance
- Understanding when to use routing vs geometry

**Key topics:**

- Decision framework: geometric operations vs routing APIs
- Distance calculations (crow flies vs crow drives)
- Proximity and containment checks
- Area and shape operations
- Routing and navigation patterns
- Clustering and optimization
- Hybrid approaches (combining tools)
- Common anti-patterns to avoid
- Performance and scale considerations

**Tool categories covered:**

- Offline geometric: distance, bearing, buffer, centroid, area, containment
- Routing APIs: directions, matrix, optimization, isochrone, map matching

[View skill →](./skills/mapbox-geospatial-operations/SKILL.md)

---

### 🔍 mapbox-search-integration

**Complete workflow for implementing Mapbox search in applications from discovery to production.**

Guides AI assistants through the entire search integration process: asking discovery questions, selecting the right product, implementing with best practices, and avoiding common pitfalls. Embodies collective knowledge from the Mapbox search team and customer learnings.

**Use when:**

- User needs to add search to their app
- Implementing location search or geocoding
- Need to ask the right questions about requirements
- Want production-ready search implementation
- Avoiding common integration mistakes

**Key workflow:**

1. **Discovery questions** - What to ask users (POIs? Addresses? Geographic scope? Platform?)
2. **Product selection** - Search Box API vs Geocoding API, SDK vs direct API
3. **Implementation patterns** - Complete code examples for web, iOS, Android
4. **Best practices** - Debouncing, session tokens, error handling, UX patterns
5. **Common pitfalls** - What goes wrong and how to avoid it

**Covers all platforms:**

- Web (Mapbox Search JS React/Web/Core, Vue, Angular, Next.js)
- iOS (Search SDK for iOS with UISearchController integration)
- Android (Search SDK for Android with SearchView integration)
- Node.js (Mapbox Search JS Core)

**Best practices from "the good parts":**

- ✅ Debouncing (prevent API spam)
- ✅ Session token management (cost optimization)
- ✅ Geographic filtering (better results)
- ✅ Error handling (all failure cases)
- ✅ Mobile UX (touch targets, keyboards)
- ✅ Accessibility (keyboard nav, ARIA)
- ✅ Caching strategies (high-volume apps)
- ✅ Token security (proper scoping)

[View skill →](./skills/mapbox-search-integration/SKILL.md)

---

### 🔍 mapbox-search-patterns

**Expert guidance on choosing the right search tool and parameters for geocoding, POI search, and location discovery.**

Helps AI assistants select between search_and_geocode, category_search, and reverse_geocode tools, and optimize parameters like proximity, bbox, country, limit, and more.

**Use when:**

- Choosing between search tools (specific names vs categories)
- Setting up geocoding or POI search
- Optimizing search parameters for accuracy
- Implementing "near me" searches
- Building autocomplete functionality
- Troubleshooting search results

**Key topics:**

- Tool selection decision matrix (brands vs categories vs coordinates)
- Parameter guidance (proximity, bbox, country, limit, types, ETA)
- Common patterns ("near me", route-based search, multilingual)
- Anti-patterns to avoid (missing proximity, wrong tool choice)
- Performance optimization (minimizing API calls, appropriate limits)
- Combining search with geospatial operations

**Search tools covered:**

- search_and_geocode_tool: Specific places, addresses, brands
- category_search_tool: Generic categories, plural queries
- reverse_geocode_tool: Coordinates to addresses

[View skill →](./skills/mapbox-search-patterns/SKILL.md)

---

### 🔄 mapbox-maplibre-migration

**Migration guide between Mapbox GL JS and MapLibre GL JS in both directions.**

Covers the fork history, API compatibility (~95% identical), token handling, style differences, and feature parity. Helps developers migrate in either direction or use both libraries together.

**Use when:**

- Migrating from Mapbox to MapLibre (or vice versa)
- Evaluating which library to use
- Understanding API compatibility
- Switching tile sources
- Combining MapLibre rendering with Mapbox APIs

**Key topics:**

- Fork history and license differences
- Package and import changes
- Token handling (Mapbox token vs no token)
- Style URL differences (mapbox:// vs OSM/custom)
- Feature parity comparison
- Plugin compatibility
- Migration in both directions
- When to choose each library
- Using both together

**Covers:**

- Step-by-step migration guides (both directions)
- API compatibility matrix (100% compatible vs minor differences)
- Common migration issues and solutions
- Decision guide (when to use which)
- Side-by-side code examples

[View skill →](./skills/mapbox-maplibre-migration/SKILL.md)

---

### ⚡ mapbox-web-performance-patterns

**Performance optimization patterns for building fast, efficient Mapbox GL JS web applications.**

Covers initialization waterfalls, bundle size, rendering performance, memory management, and web optimization. Patterns are prioritized by impact on user experience (Critical → High Impact → Optimization).

**Use when:**

- Optimizing map load time and time-to-interactive
- Reducing bundle size or implementing code splitting
- Debugging slow rendering or janky interactions
- Managing thousands of markers or large datasets
- Optimizing for web browsers and low-end hardware
- Preventing memory leaks in long-running applications

**Key topics:**

- Eliminating initialization waterfalls (parallel loading, data fetching)
- Bundle size optimization (code splitting)
- Marker performance (HTML vs Canvas vs Symbol layers, clustering)
- Data loading strategies (GeoJSON vs vector tiles, viewport-based loading)
- Event handling optimization (debouncing, throttling)
- Memory management (cleanup patterns, feature state)
- Web-specific optimizations (browser performance, touch events)

**Based on:** Performance principles from [Vercel's react-best-practices](https://vercel.com/blog/introducing-react-best-practices) and Mapbox GL JS patterns

[View skill →](./skills/mapbox-web-performance-patterns/SKILL.md)

---

### 🎨 mapbox-cartography

**Expert guidance on map design principles, color theory, visual hierarchy, typography, and cartographic best practices.**

**Use when:**

- Designing a new map style
- Choosing colors for map elements
- Making decisions about visual hierarchy
- Optimizing for specific use cases (navigation, data viz, etc.)
- Ensuring accessibility
- Creating themed maps (dark mode, vintage, etc.)

**Key topics:**

- Core cartographic principles (visual hierarchy, color theory)
- Typography best practices for maps
- Map context considerations (audience, platform, use case)
- Zoom level strategies
- Color palette templates
- Common mapping scenarios (restaurant finders, real estate, etc.)

[View skill →](./skills/mapbox-cartography/SKILL.md)

---

### 🔧 mapbox-web-integration-patterns

**Official integration patterns for Mapbox GL JS across popular web frameworks.**

Covers React, Vue, Svelte, Angular, and Next.js with proper lifecycle management, token handling, and search integration. Based on Mapbox's `create-web-app` scaffolding tool.

**Use when:**

- Setting up Mapbox GL JS in a new web project
- Integrating Mapbox into a specific web framework
- Adding Mapbox Search functionality
- Implementing proper cleanup and lifecycle management
- Debugging map initialization issues in web apps
- Converting between frameworks

**Key topics:**

- Framework-specific patterns (React hooks, Vue composition API, Svelte stores, Angular services)
- Token management (environment variables across frameworks)
- Lifecycle management and cleanup (preventing memory leaks)
- Mapbox Search JS integration
- Common mistakes and how to avoid them
- SSR handling (Angular Universal, Next.js)

[View skill →](./skills/mapbox-web-integration-patterns/SKILL.md)

---

### 📱 mapbox-ios-patterns

**Integration patterns for Mapbox Maps SDK on iOS with Swift, SwiftUI, UIKit, and mobile optimization.**

Covers Swift/SwiftUI integration, lifecycle management, token handling, offline maps, Navigation SDK, and battery/memory optimization for iOS devices.

**Use when:**

- Setting up Mapbox Maps SDK for iOS
- Integrating maps with SwiftUI or UIKit
- Managing token security in iOS apps
- Implementing offline map caching
- Adding turn-by-turn navigation
- Optimizing for battery life and memory
- Debugging crashes or performance issues on iOS

**Key topics:**

- SwiftUI UIViewRepresentable pattern
- UIKit lifecycle management (viewDidLoad, deinit)
- Token management (Info.plist, .xcconfig)
- Memory management and retain cycle prevention
- Offline map download and storage
- Navigation SDK integration
- Battery and network optimization
- Common iOS mistakes and solutions

[View skill →](./skills/mapbox-ios-patterns/SKILL.md)

---

### 📱 mapbox-android-patterns

**Integration patterns for Mapbox Maps SDK on Android with Kotlin, Jetpack Compose, and mobile optimization.**

Covers Kotlin/Jetpack Compose integration, lifecycle management, token handling, offline maps, Navigation SDK, and battery/memory optimization for Android devices.

**Use when:**

- Setting up Mapbox Maps SDK for Android
- Integrating maps with Jetpack Compose or View system
- Managing token security in Android apps
- Implementing offline map caching
- Adding turn-by-turn navigation
- Optimizing for battery life and memory
- Debugging crashes or performance issues on Android

**Key topics:**

- Jetpack Compose AndroidView pattern
- Activity/Fragment lifecycle management
- Token management (BuildConfig, local.properties)
- Memory management and leak prevention
- Offline map download and storage
- Navigation SDK integration
- Battery and network optimization
- Common Android mistakes and solutions

[View skill →](./skills/mapbox-android-patterns/SKILL.md)

---

### 📐 mapbox-style-patterns

**Common style patterns, layer configurations, and recipes for typical mapping scenarios.**

**Use when:**

- Starting a new map style for a specific use case
- Looking for layer configuration examples
- Implementing common mapping patterns
- Optimizing existing styles
- Need proven recipes for typical scenarios

**Key topics:**

- Restaurant/POI finder pattern
- Real estate map pattern
- Data visualization base map pattern
- Navigation/routing map pattern
- Dark mode / night theme pattern
- Layer optimization patterns
- Common modifications (3D buildings, terrain, custom markers)

[View skill →](./skills/mapbox-style-patterns/SKILL.md)

---

### ✅ mapbox-style-quality

**Expert guidance on validating, optimizing, and ensuring quality of Mapbox styles.**

Covers validation, accessibility checks, and optimization techniques for production-ready styles.

**Use when:**

- Validating styles before production deployment
- Checking accessibility compliance (WCAG)
- Optimizing style file size and complexity
- Reviewing styles for common issues
- Setting up quality gates in CI/CD pipelines

**Key topics:**

- Style validation patterns
- Expression validation
- GeoJSON validation
- Color contrast checking (WCAG AA/AAA)
- Style optimization techniques
- Production readiness checklists

[View skill →](./skills/mapbox-style-quality/SKILL.md)

---

### 🔐 mapbox-token-security

**Security best practices for Mapbox access tokens.**

Covers scope management, URL restrictions, rotation strategies, and incident response.

**Use when:**

- Creating new tokens
- Deciding between public vs secret tokens
- Setting up token restrictions
- Implementing token rotation
- Investigating security incidents
- Conducting security audits

**Key topics:**

- Token types and when to use them (public, secret, temporary)
- Scope management (principle of least privilege)
- URL restrictions and patterns
- Token storage and handling
- Rotation strategies
- Monitoring and auditing
- Incident response plans

[View skill →](./skills/mapbox-token-security/SKILL.md)

---

### 🧭 mapbox-navigation-patterns

**Quick reference for implementing navigation and routing with Mapbox Directions API and Navigation SDKs.**

Covers web routing, turn-by-turn navigation, multi-stop routes, optimization, traffic-aware routing, and voice guidance across Web, iOS, and Android platforms.

**Use when:**

- Implementing routing and directions in applications
- Adding turn-by-turn navigation (iOS/Android)
- Building delivery route optimization
- Showing traffic-aware routes
- Need voice guidance for navigation
- Calculating ETAs or route alternatives

**Key topics:**

- Directions API for web (basic routes, alternatives, multi-stop, optimization)
- Navigation SDK for iOS (NavigationViewController, voice guidance, custom UI)
- Navigation SDK for Android (NavigationView, custom UI, route progress)
- Traffic-aware routing with congestion data
- Route caching and performance optimization
- Error handling and best practices

**Covers all platforms:**

- Web (Directions API with Mapbox GL JS)
- iOS (Navigation SDK for iOS with Swift)
- Android (Navigation SDK for Android with Kotlin)

**Common patterns:**

- Basic route display on map
- Alternative routes comparison
- Multi-stop waypoint routing (up to 25 waypoints)
- Route optimization for deliveries
- Turn-by-turn instruction display
- Traffic congestion visualization
- Voice-guided navigation
- Ride-sharing ETA calculations

**API features:**

- Routing profiles (driving, driving-traffic, walking, cycling)
- Multi-stop routing and optimization
- Alternative route generation
- Turn-by-turn instructions
- Traffic congestion annotations
- Voice guidance (Navigation SDK only)

[View skill →](./skills/mapbox-navigation-patterns/SKILL.md)

---

### 📍 mapbox-store-locator-patterns

**Common patterns for building store locators, restaurant finders, and location-based search applications.**

Comprehensive guide covering marker display strategies, filtering, distance calculation, interactive lists synced with maps, and directions integration. Perfect for building any location-based finder application.

**Use when:**

- Building store locator or restaurant finder applications
- Displaying multiple locations on a map with interactive lists
- Need filtering by category, distance, or search term
- Calculate distances from user location
- Show location details in popups or panels
- Integrate directions to selected locations

**Key topics:**

- Marker strategies (HTML markers, symbol layers, clustering) based on location count
- Interactive list/map synchronization
- Search and category filtering
- User location and distance calculation (Haversine formula)
- Directions API integration
- Performance optimization (debouncing, lazy loading, virtual scrolling)
- Layout patterns (sidebar, overlay, mobile-responsive)

**Covers all marker strategies:**

- **< 100 locations**: HTML Markers with `mapboxgl.Marker()`
- **100-1000 locations**: Symbol layers with GeoJSON
- **> 1000 locations**: Clustering with aggregation

**Common use cases:**

- Store locators for retail chains
- Restaurant finders with category filters
- Office location directories
- Real estate property search
- Event venue finders
- Service provider locators

**Complete implementation:**

- GeoJSON data structure
- Map initialization and marker display
- Interactive listing component
- Search/filter functionality
- Distance calculation and sorting
- Popup/detail views
- Directions integration
- Responsive layouts

[View skill →](./skills/mapbox-store-locator-patterns/SKILL.md)

---

### 🔄 mapbox-google-maps-migration

**Comprehensive migration guide for developers moving from Google Maps Platform to Mapbox GL JS.**

Covers API equivalents, coordinate order gotchas, pattern translations, and step-by-step migration strategies with side-by-side code examples.

**Use when:**

- Migrating an existing Google Maps application to Mapbox
- Evaluating Mapbox as a Google Maps alternative
- Learning Mapbox with Google Maps background
- Translating Google Maps patterns to Mapbox
- Troubleshooting migration issues

**Key topics:**

- API equivalents (Map, Marker, Polygon, InfoWindow, etc.)
- Critical differences (lng,lat vs lat,lng coordinate order)
- Event mapping and handling changes
- Markers: Object-oriented vs data-driven approaches
- Geocoding, directions, and clustering comparisons
- Performance considerations (WebGL vs DOM)
- Custom styling: Map types vs style URLs
- Step-by-step migration strategy and checklist
- When NOT to migrate guidance

**Covers all major features:**

- Map initialization and configuration
- Markers (individual and data-driven)
- Popups/info windows
- Polygons, polylines, shapes
- Custom icons and symbols
- Geocoding and reverse geocoding
- Directions/routing
- Clustering (built-in vs MarkerClusterer)
- Controls and UI elements
- Framework integration (React, Vue, etc.)

[View skill →](./skills/mapbox-google-maps-migration/SKILL.md)

---

## How Skills Work

### With Claude Code

Skills in this repository are automatically discovered by Claude Code when placed in:

```bash
# Install all skills
npx skills add mapbox/mapbox-agent-skills

# Or manually symlink (for development)
mkdir -p .claude
ln -s ~/git/mapbox-agent-skills/skills .claude/skills
```

Skills are automatically activated when relevant to your task.

### With Cursor

```bash
npx skills add mapbox/mapbox-agent-skills -a cursor
```

### With VS Code (GitHub Copilot)

```bash
npx skills add mapbox/mapbox-agent-skills -a vscode
```

### With Other AI Assistants

The `skills` CLI supports: OpenCode, Codex, Antigravity, and more. Run `npx skills add --help` for full list.

## Example Usage

Once installed, skills activate automatically when relevant:

### Performance Optimization

👤 User: "My Mapbox map with 5,000 restaurant markers is slow. How do I optimize it?"

🤖 Claude: [Uses mapbox-web-performance-patterns skill]

"Based on the marker performance thresholds:

- < 100 markers: HTML markers OK
- 100-1,000: Use Symbol layers (GeoJSON)
- 1,000-10,000: Clustering required
- > 10,000: Server-side clustering

For 5,000 markers, you need clustering. Here's the pattern..."

### Framework Integration

👤 User: "Set up Mapbox in my React app"

🤖 Claude: [Uses mapbox-web-integration-patterns skill]

"I'll use the React pattern with useRef + useEffect:

```jsx
import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function MapComponent() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: [-71.05953, 42.3629],
      zoom: 13
    });

    // CRITICAL: Cleanup to prevent memory leaks
    return () => {
      mapRef.current.remove();
    };
  }, []);

  return <div ref={mapContainerRef} style={{ height: '100vh' }} />;
}
```

Key points:

- Use useRef for both map instance and container
- Initialize in useEffect with empty deps []
- Always return cleanup function that calls map.remove()
- Never initialize map in render (causes infinite loops)"

### Map Design

👤 User: "Create a map style for a restaurant finder app"

🤖 Claude: [Uses mapbox-cartography + mapbox-style-patterns skills]

"For a restaurant finder, you need:

Design (from cartography skill):

- High contrast for restaurant markers
- Muted background (food photos will overlay)
- Clear street labels for navigation
- Mobile-optimized design

Style pattern (from style-patterns skill):
I'll apply the POI Finder pattern:

- Desaturated base map (#f5f5f5 background)
- Orange markers (#FF6B35) for visibility
- White roads on light gray background
- Simplified labels (only major streets)
  ..."

## How Skills Complement Mapbox MCP Server

These Agent Skills work together with the [Mapbox MCP DevKit Server](https://github.com/mapbox/mcp-devkit-server):

| Component                    | Purpose               | Example                                 |
| ---------------------------- | --------------------- | --------------------------------------- |
| **Agent Skills** (this repo) | Provide expertise     | Performance patterns, design principles |
| **MCP Tools**                | Execute actions       | `create_style_tool`, `list_tokens_tool` |
| **MCP Prompts**              | Orchestrate workflows | `create-and-preview-style` workflow     |

**Example workflow:**

```
User: "Create a high-performance map for my restaurant finder"

1. [mapbox-cartography skill] → Understands restaurant maps need high contrast, muted background
2. [mapbox-token-security skill] → Creates token with only styles:read scope, URL restrictions
3. [mapbox-style-patterns skill] → Applies POI Finder pattern
4. [MCP style_builder_tool] → Generates style JSON
5. [MCP create_style_tool] → Creates style in Mapbox account
6. [mapbox-web-performance-patterns skill] → Recommends clustering for > 1,000 markers
7. [MCP preview_style_tool] → Generates preview link
```

## Examples

Want to see these skills in action? Check out the [`examples/`](./examples/) directory for both conversation transcripts and working code examples.

### 📝 Conversation Examples

Realistic conversation transcripts showing how AI assistants use the skills:

- [Web Performance Optimization](./examples/conversations/web-performance-optimization.md) - Optimizing a map with 5,000 markers using **mapbox-web-performance-patterns**
- [iOS SwiftUI Setup](./examples/conversations/ios-swiftui-setup.md) - Setting up Mapbox in SwiftUI using **mapbox-ios-patterns**
- [Android Jetpack Compose Setup](./examples/conversations/android-compose-setup.md) - Integrating Mapbox with Compose using **mapbox-android-patterns**
- [Restaurant Finder Design](./examples/conversations/restaurant-finder-design.md) - Designing a map style using **mapbox-cartography** + **mapbox-style-patterns**

### 💻 Working Code Examples

Complete, runnable applications following skill patterns:

**Web:**

- [react-map-basic](./examples/web/react-map-basic/) - Basic React integration with proper lifecycle management
- [performance-optimized](./examples/web/performance-optimized/) - Advanced patterns: clustering, parallel loading, throttling

**iOS:**

- [SwiftUIMapExample](./examples/ios/SwiftUIMapExample/) - SwiftUI integration with UIViewRepresentable pattern

**Android:**

- [ComposeMapExample](./examples/android/ComposeMapExample/) - Jetpack Compose integration with AndroidView pattern

Each example includes:

- ✅ Complete, working code
- ✅ Detailed README explaining patterns
- ✅ Comments highlighting key practices
- ✅ Setup and troubleshooting instructions

[**→ Browse all examples**](./examples/)

## Development

### Structure

Each skill follows the Agent Skills specification:

```
skill-name/
├── SKILL.md              # Main skill file (required)
│   ├── YAML frontmatter  # name, description
│   └── Markdown content  # Instructions and guidance
└── [optional files]      # Additional resources
```

### Creating Custom Skills

1. Create a new directory in `skills/`
2. Create `SKILL.md` with YAML frontmatter and instructions
3. Add reference materials (optional)
4. Test with Claude Code or Cursor
5. Submit a pull request

**Guidelines:**

- Keep instructions clear and actionable
- Provide concrete examples
- Include decision trees when applicable
- Reference official Mapbox documentation
- Test with real scenarios

### Testing

To test skills locally:

```bash
# Clone repo
git clone https://github.com/mapbox/mapbox-agent-skills.git
cd mapbox-agent-skills

# Install in Claude Code
npx skills add . -a claude-code

# Or symlink for development
mkdir -p .claude
ln -s $(pwd)/skills .claude/skills
```

Test with prompts like:

**Web:**

- "How do I optimize a Mapbox map with 50,000 markers?"
- "What's the best way to load large GeoJSON files?"
- "Set up Mapbox in my React app with proper cleanup"
- "Create a dark mode map style"

**iOS:**

- "Add Mapbox to my SwiftUI app"
- "How do I prevent memory leaks in my iOS map?"
- "Download offline maps for iOS"
- "Integrate Navigation SDK in my iOS app"

**Android:**

- "Integrate Mapbox with Jetpack Compose"
- "Handle lifecycle properly in my Android map Fragment"
- "Optimize battery usage for Android maps"
- "Set up offline regions for Android"

## Resources

**Agent Skills:**

- [Agent Skills Overview](https://agentskills.io)
- [Agent Skills Specification](https://github.com/anthropics/skills)
- [Skills CLI Tool](https://github.com/anthropics/skills)

**Mapbox Documentation:**

- [Mapbox Documentation](https://docs.mapbox.com)
- [Mapbox GL JS (Web)](https://docs.mapbox.com/mapbox-gl-js/guides/)
- [Maps SDK for iOS](https://docs.mapbox.com/ios/maps/guides/)
- [Maps SDK for Android](https://docs.mapbox.com/android/maps/guides/)
- [Mapbox Style Specification](https://docs.mapbox.com/style-spec/)
- [Mapbox Tutorials](https://docs.mapbox.com/help/tutorials/)

**Related Tools:**

- [Mapbox MCP DevKit Server](https://github.com/mapbox/mcp-devkit-server)

## Contributing

We welcome contributions of new skills or improvements to existing ones! Please see our [Contributing Guide](./CONTRIBUTING.md) for detailed instructions on creating skills, testing, and submitting pull requests.

For questions or suggestions, please [open an issue](https://github.com/mapbox/mapbox-agent-skills/issues).

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Related Projects:**

- [Mapbox MCP DevKit Server](https://github.com/mapbox/mcp-devkit-server) - MCP server with tools for Mapbox development
- [Mapbox GL JS](https://github.com/mapbox/mapbox-gl-js) - JavaScript library for interactive web maps
- [Maps SDK for iOS](https://docs.mapbox.com/ios/maps/guides/) - Native iOS mapping SDK
- [Maps SDK for Android](https://docs.mapbox.com/android/maps/guides/) - Native Android mapping SDK
- [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills) - Agent Skills for React and Next.js
