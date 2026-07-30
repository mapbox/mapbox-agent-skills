# Token Management (bundler env patterns)

Use **one** env access pattern per app. Do not chain `import.meta.env`, `process.env`, and `window.*` in a single expression — unused identifiers throw `ReferenceError` in the browser before your token guard runs.

| Framework/Bundler    | Environment Variable            | Access Pattern                             |
| -------------------- | ------------------------------- | ------------------------------------------ |
| **Vite**             | `VITE_MAPBOX_ACCESS_TOKEN`      | `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN` |
| **Next.js**          | `NEXT_PUBLIC_MAPBOX_TOKEN`      | `process.env.NEXT_PUBLIC_MAPBOX_TOKEN`     |
| **Create React App** | `REACT_APP_MAPBOX_TOKEN`        | `process.env.REACT_APP_MAPBOX_TOKEN`       |
| **Angular**          | `environment.mapboxAccessToken` | Environment files (`environment.ts`)       |
| **Plain HTML / CDN** | (config script)                 | `window.MAPBOX_ACCESS_TOKEN`               |

For framework lifecycle examples, also see the **mapbox-web-integration-patterns** skill.
