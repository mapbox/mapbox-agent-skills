# Mapbox MCP Runtime Integration Examples

Working, compilable examples showing how to integrate Mapbox MCP Server with popular agent frameworks.

## Prerequisites

1. **Mapbox Access Token**: Get one at [mapbox.com/account/access-tokens](https://console.mapbox.com/account/access-tokens/)
2. **OpenAI API Key** (or other LLM provider)
3. **HuggingFace Token** (for smolagents)

## Python Examples

### Setup

```bash
cd python
pip install -r requirements.txt

# Set environment variables
export MAPBOX_ACCESS_TOKEN="your_token_here"
export OPENAI_API_KEY="your_openai_key"
export HF_TOKEN="your_huggingface_token"  # For smolagents
```

### 1. Pydantic AI Example

**Framework**: [Pydantic AI](https://ai.pydantic.dev/) - Type-safe agents with validation

```bash
python pydantic_ai_example.py
```

**Features**:
- Type-safe tool definitions
- Environment variable support
- Hosted MCP server integration
- Real-world examples (restaurant finder, route planning)

**Best for**: Production applications requiring type safety and validation

---

### 2. CrewAI Example

**Framework**: [CrewAI](https://docs.crewai.com/) - Multi-agent orchestration

```bash
python crewai_example.py
```

**Features**:
- Multi-agent crews with specialized roles
- Task dependencies and context passing
- Location Analyst + Route Planner agents
- Real-world examples (restaurant crew, property search)

**Best for**: Complex workflows requiring multiple specialized agents

**Agents included**:
- **Location Analyst**: Finds places, analyzes areas
- **Route Planner**: Calculates routes and travel times

---

### 3. Smolagents Example

**Framework**: [Smolagents](https://huggingface.co/docs/smolagents) - Hugging Face's lightweight agents

```bash
python smolagents_example.py
```

**Features**:
- **Method 1**: Direct MCP connection (recommended, minimal code)
- **Method 2**: Custom tools with `@tool` decorator
- Lightweight and fast
- Real-world example (property search agent)

**Best for**: Production deployment with minimal overhead

**Note**: Smolagents has native MCP support via `MCPClient`!

---

## TypeScript Examples

### Setup

```bash
cd typescript
npm install

# Set environment variables
export MAPBOX_ACCESS_TOKEN="your_token_here"
export OPENAI_API_KEY="your_openai_key"
```

### 1. Mastra Example

**Framework**: [Mastra 1.x](https://mastra.ai/docs) - Modern TypeScript agent framework

```bash
npm run mastra
```

**Features**:
- Type-safe tool creation with Zod schemas
- Hosted MCP server integration
- Multiple Mapbox tools (directions, POI search, distance, isochrone)
- Real-world examples

**Best for**: TypeScript applications with strong typing

**Tools included**:
- `get-directions`: Driving directions with traffic
- `search-poi`: Find restaurants, hotels, etc.
- `calculate-distance`: Offline distance calculation
- `get-isochrone`: Reachable area analysis

**Verify it compiles**:
```bash
npm run build  # TypeScript type-check
```

---

### 2. LangChain Example

**Framework**: [LangChain](https://docs.langchain.com/oss/javascript/langchain/overview/) - Conversational AI framework

```bash
npm run langchain
```

**Features**:
- Conversational interface
- Tool chaining
- Memory and context management
- Multi-step workflows

**Best for**: Conversational applications with complex tool chains

**Tools included**:
- Directions, POI search, distance calculation, isochrones
- All tools use hosted Mapbox MCP server

---

## Framework Comparison

| Framework | Language | Best For | Complexity | Type Safety |
|-----------|----------|----------|------------|-------------|
| **Pydantic AI** | Python | Production apps | Medium | ⭐⭐⭐ |
| **CrewAI** | Python | Multi-agent systems | High | ⭐⭐ |
| **Smolagents** | Python | Lightweight agents | Low | ⭐⭐ |
| **Mastra** | TypeScript | Typed agents | Medium | ⭐⭐⭐ |
| **LangChain** | TypeScript | Conversational AI | High | ⭐⭐ |

## Common Use Cases

### 1. Restaurant Finder

Find restaurants near a location with distances:

- **Pydantic AI**: `pydantic_ai_example.py` (Example 1)
- **CrewAI**: `crewai_example.py` (Example 1)
- **LangChain**: `langchain-example.ts` (Example 3)

### 2. Route Planning

Calculate driving time with traffic:

- **Pydantic AI**: `pydantic_ai_example.py` (Example 2)
- **Mastra**: `mastra-example.ts` (Example 2)

### 3. Property Search

Find properties with good commute:

- **CrewAI**: `crewai_example.py` (Example 2)
- **Smolagents**: `smolagents_example.py` (Example 3)

## Mapbox MCP Tools Available

All examples connect to the hosted Mapbox MCP Server at `https://mcp.mapbox.com/mcp`.

**API Tools** (require Mapbox token):
- `directions_tool`: Driving directions with traffic
- `category_search_tool`: Find POIs by category
- `reverse_geocode_tool`: Coordinates to address
- `isochrone_tool`: Reachable area within time
- `matrix_tool`: Travel time matrix
- `static_map_image_tool`: Static map images
- `map_matching_tool`: Match GPS traces to roads
- `optimization_tool`: Optimize multi-stop routes

**Offline Tools** (free, instant):
- `distance_tool`: Distance between points
- `bearing_tool`: Compass direction
- `midpoint_tool`: Midpoint between points
- `point_in_polygon_tool`: Point containment test
- `area_tool`: Polygon area
- `centroid_tool`: Polygon center
- `buffer_tool`: Create buffer zones
- `bbox_tool`: Calculate bounding boxes
- `simplify_tool`: Simplify geometries

**Utility Tools**:
- `version_tool`: Get MCP server version
- `category_list_tool`: List available POI categories

## Testing Examples

### Python

```bash
# Run all Python examples
cd python
python pydantic_ai_example.py
python crewai_example.py
python smolagents_example.py
```

### TypeScript

```bash
# Type-check all TypeScript examples
cd typescript
npm run build

# Run individual examples
npm run mastra
npm run langchain
```

## Troubleshooting

### Missing MAPBOX_ACCESS_TOKEN

```
Error: MAPBOX_ACCESS_TOKEN is required
```

**Solution**: Export the environment variable
```bash
export MAPBOX_ACCESS_TOKEN="pk.ey..."
```

### MCP Connection Failed

```
Error: MCP request failed: Unauthorized
```

**Solution**: Check your token has proper scopes at [mapbox.com/account/access-tokens](https://console.mapbox.com/account/access-tokens/)

### Import Errors (Python)

```
ModuleNotFoundError: No module named 'crewai'
```

**Solution**: Install requirements
```bash
pip install -r requirements.txt
```

### TypeScript Compilation Errors

```
Cannot find module '@mastra/core'
```

**Solution**: Install dependencies
```bash
npm install
```

## Resources

- [Mapbox MCP Server](https://github.com/mapbox/mcp-server)
- [Mapbox MCP DevKit](https://github.com/mapbox/mcp-devkit-server)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Pydantic AI Docs](https://ai.pydantic.dev/)
- [CrewAI Docs](https://docs.crewai.com/)
- [Smolagents Docs](https://huggingface.co/docs/smolagents)
- [Mastra Docs](https://mastra.ai/docs)
- [LangChain Docs](https://docs.langchain.com/oss/javascript/langchain/overview/)

## Contributing

Found an issue or want to add more examples? Please open a PR!

## License

These examples are provided as-is for educational purposes.
