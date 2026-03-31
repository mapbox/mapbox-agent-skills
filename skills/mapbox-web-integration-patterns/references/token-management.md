# Token Management Patterns

## Environment Variables (Recommended)

Different frameworks use different prefixes for client-side environment variables:

| Framework/Bundler    | Environment Variable            | Access Pattern                             |
| -------------------- | ------------------------------- | ------------------------------------------ |
| **Vite**             | `VITE_MAPBOX_ACCESS_TOKEN`      | `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN` |
| **Next.js**          | `NEXT_PUBLIC_MAPBOX_TOKEN`      | `process.env.NEXT_PUBLIC_MAPBOX_TOKEN`     |
| **Create React App** | `REACT_APP_MAPBOX_TOKEN`        | `process.env.REACT_APP_MAPBOX_TOKEN`       |
| **Angular**          | `environment.mapboxAccessToken` | Environment files (`environment.ts`)       |

**Vite .env file:**

```bash
VITE_MAPBOX_ACCESS_TOKEN=pk.YOUR_MAPBOX_TOKEN_HERE
```

**Next.js .env.local file:**

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_MAPBOX_TOKEN_HERE
```

**Important:**

- Always use environment variables for tokens
- Never commit `.env` files to version control
- Use public tokens (pk.\*) for client-side apps
- Add `.env` to `.gitignore`
- Provide `.env.example` template for team

**.gitignore:**

```
.env
.env.local
.env.*.local
```

**.env.example:**

```bash
VITE_MAPBOX_ACCESS_TOKEN=your_token_here
```

## Style Configuration

### Default Center and Zoom Guidelines

**Example defaults (used in create-web-app demos):**

- **Center**: `[-71.05953, 42.36290]` (Boston, MA)
- **Zoom**: `13` for city-level view

> **Note:** GL JS defaults to `center: [0, 0]` and `zoom: 0` if not specified. Always set these explicitly.

**Zoom level guide:**

- `0-2`: World view
- `3-5`: Continent/country
- `6-9`: Region/state
- `10-12`: City view
- `13-15`: Neighborhood
- `16-18`: Street level
- `19-22`: Building level

**Customizing for user location:**

```javascript
// Use browser geolocation
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((position) => {
    map.setCenter([position.coords.longitude, position.coords.latitude]);
    map.setZoom(13);
  });
}
```
