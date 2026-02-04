# Mapbox Agent Skills

This directory contains [Agent Skills](https://agentskills.io) that provide domain expertise for building maps with Mapbox.

## Available Skills

| Skill | Description |
|-------|-------------|
| [mapbox-google-maps-migration](./mapbox-google-maps-migration/) | Migration guide from Google Maps Platform to Mapbox GL JS with API equivalents and patterns |
| [mapbox-maplibre-migration](./mapbox-maplibre-migration/) | Migration guide between Mapbox GL JS and MapLibre GL JS in both directions |
| [mapbox-search-integration](./mapbox-search-integration/) | Complete workflow for implementing Mapbox search with discovery questions and best practices |
| [mapbox-web-performance-patterns](./mapbox-web-performance-patterns/) | Performance optimization for Mapbox GL JS (initialization, markers, data loading, memory) |
| [mapbox-cartography](./mapbox-cartography/) | Map design principles, color theory, visual hierarchy, typography |
| [mapbox-web-integration-patterns](./mapbox-web-integration-patterns/) | Framework integration (React, Vue, Svelte, Angular, Next.js) |
| [mapbox-ios-patterns](./mapbox-ios-patterns/) | iOS integration with Swift, SwiftUI, UIKit |
| [mapbox-android-patterns](./mapbox-android-patterns/) | Android integration with Kotlin, Jetpack Compose |
| [mapbox-style-patterns](./mapbox-style-patterns/) | Common style patterns and layer configurations |
| [mapbox-style-quality](./mapbox-style-quality/) | Style validation, accessibility, optimization |
| [mapbox-token-security](./mapbox-token-security/) | Security best practices for access tokens |
| [mapbox-data-visualization-patterns](./mapbox-data-visualization-patterns/) | Data visualization patterns including choropleth, heat maps, 3D, and animated data |

## Documentation

For full documentation including:
- Detailed skill descriptions and use cases
- Installation instructions for Claude Code, Cursor, VS Code
- Examples and conversation transcripts
- How skills work with Mapbox MCP Server

See the [main README](../README.md).

## Contributing

Want to create a new skill or improve an existing one? See the [Contributing Guide](../CONTRIBUTING.md) for:
- Skill structure and format requirements
- Content guidelines and quality standards
- Testing and validation instructions
- Pull request process

## Skill Structure

Each skill follows the [Agent Skills specification](https://github.com/anthropics/skills):

```
skill-name/
├── SKILL.md              # Main skill file (required)
│   ├── YAML frontmatter  # name, description
│   └── Markdown content  # Instructions and guidance
└── [optional files]      # Additional resources
```

**SKILL.md format:**

```yaml
---
name: skill-name
description: What the skill does and when to use it
---
# Skill Name

[Instructions and guidance for AI assistants]
```

## Resources

- [Agent Skills Overview](https://agentskills.io)
- [Agent Skills Specification](https://github.com/anthropics/skills)
- [Mapbox Documentation](https://docs.mapbox.com)
