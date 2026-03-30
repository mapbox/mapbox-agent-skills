---
name: mapbox-mcp-devkit-patterns
description: Integration patterns for Mapbox MCP DevKit Server in AI coding assistants. Covers setup, style management, token management, validation workflows, and documentation access through MCP. Use when building Mapbox applications with AI coding assistance.
---

# Mapbox MCP DevKit Patterns

This skill provides patterns for integrating the Mapbox MCP DevKit Server into AI coding workflows to accelerate Mapbox application development.

## What is Mapbox MCP DevKit?

The [Mapbox MCP DevKit Server](https://github.com/mapbox/mcp-devkit-server) is a Model Context Protocol (MCP) server that gives AI assistants direct access to Mapbox developer APIs:

- **Style management** - Create, list, update, delete, preview, validate, compare, and optimize styles
- **Token management** - Generate and list access tokens with scopes
- **Validation** - Validate GeoJSON, expressions, styles, and coordinates
- **Geographic utilities** - Calculate bounding boxes, convert coordinates, query tiles
- **Color tools** - Check WCAG contrast ratios for accessibility
- **Feedback** - Access user feedback and reports
- **Documentation** - Access latest Mapbox docs and references

**Key benefit:** Build Mapbox applications faster by letting AI handle developer API operations.

## When to Use MCP DevKit

### Use DevKit when:

- Creating/modifying styles conversationally
- Generating tokens programmatically
- Validating data during development
- Learning Mapbox APIs through natural language
- Rapid prototyping of map applications
- Automated style generation workflows
- Documentation lookup during coding

### Don't use DevKit for:

- Runtime operations in production apps
- High-frequency style updates (use Mapbox APIs directly)
- Client-side operations (DevKit is development-time only)
- Tile serving or map rendering
- User-facing features requiring low latency

## Reference Files

Load these references as needed for detailed guidance:

- **[references/setup.md](references/setup.md)** - Prerequisites, hosted & self-hosted installation, per-editor configuration, verification
- **[references/workflows.md](references/workflows.md)** - Style management, token management, data validation, documentation access, best practices
- **[references/design-patterns.md](references/design-patterns.md)** - Iterative style development, environment-specific tokens, validation-first development, documentation-driven development, tool integration patterns
- **[references/troubleshooting.md](references/troubleshooting.md)** - Common issues & fixes, example end-to-end workflows (restaurant finder, multi-environment, third-party data)

## Resources

- [Mapbox MCP DevKit Server](https://github.com/mapbox/mcp-devkit-server)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Mapbox Style Specification](https://docs.mapbox.com/style-spec/)
- [Mapbox API Documentation](https://docs.mapbox.com/api/)
- [Token Scopes Reference](https://docs.mapbox.com/api/accounts/tokens/)

## When to Use This Skill

Invoke this skill when:

- Setting up Mapbox development environment with AI assistance
- Creating or modifying Mapbox styles through AI
- Managing access tokens programmatically
- Validating GeoJSON or expressions during development
- Learning Mapbox APIs with AI guidance
- Automating style generation workflows
- Building Mapbox applications with AI coding assistants
