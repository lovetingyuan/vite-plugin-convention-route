# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
# Build the plugin (outputs to dist/)
npm run build
```

The build uses `tsup` to compile two entry points:
- `index.ts` → `dist/index.js` (with `.d.ts` types, ESM)
- `route.ts` → `dist/route.js` (ESM, React and react-router are external)

There are no test scripts configured.

## Architecture

This plugin has two distinct runtime contexts:

### 1. Build-time: `index.ts` (Vite Plugin)

Runs inside Vite's plugin pipeline. Intercepts imports of `virtual:route?routePath=<path>` and returns generated module code.

Key flow:
- `resolveId`: Captures `virtual:route` imports and appends `&importer=<file>` to the ID so relative `routePath` values can be resolved
- `load`: Reads the compiled `dist/route.js` at runtime, replaces the `__ROUTERS_PATH__` placeholder with the resolved absolute path (relative to Vite root), and returns it as the virtual module's source

### 2. Browser-time: `route.ts` (Route Builder)

This file is **not executed directly** — it's read as a text template by `index.ts` and injected as a virtual module into the user's app bundle. The `__ROUTERS_PATH__` string is a placeholder that gets replaced before injection.

Inside the user's browser bundle, `route.ts` uses `import.meta.glob` to discover:
- `<routePath>/**/index.tsx` — page components
- `<routePath>/**/layout.tsx` — layout components  
- `<routePath>/404.tsx` — not-found page

### File Convention → Route Mapping

| File path segment | Route path |
|---|---|
| `[param]` | `:param` |
| `-[param]` | `:param?` (optional dynamic) |
| `[...param]` | `param/*` (splat) |
| `-segment` | `segment?` (optional static) |
| `(group)` | no path (layout group, requires `layout.tsx`) |
| `_prefix` | ignored (private folder) |

`layout.tsx` in a directory creates a nested route wrapper; `index.tsx` becomes the index route under it.

### Data Flow

```
User app imports "virtual:route?routePath=./pages"
  → Vite calls plugin.resolveId() → returns ID with importer appended
  → Vite calls plugin.load() → reads dist/route.js, substitutes __ROUTERS_PATH__
  → Returns module code to bundler
  → import.meta.glob in route.ts resolves at bundle time against actual files
  → buildRoute() recursively constructs RouteObject[] tree
  → exported as default, consumed by createBrowserRouter()
```
