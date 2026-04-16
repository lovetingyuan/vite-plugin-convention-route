# vite-plugin-convention-route

A Vite-based file system routing plugin for React Router, providing Next.js-like capabilities.

- File system-based routing conventions
  - `/a/[b]/index.tsx` --> `/a/:b`
  - `/a/-[b]/index.tsx` --> `/a/:b?`
  - `/a/b/index.tsx` --> `/a/b`
  - `/a/-b/index.tsx` --> `/a/b?`
  - `/a/[...b]/index.tsx` --> `/a/b/*` (splat route)
  - `/a/(group)/index.tsx` --> `/a` (layout group, requires `layout.tsx` in the group folder)
  - `/a/_private/index.tsx` --> ignored (private folder)

### Usage

Install

```sh
npm i vite-plugin-convention-route -D
```

vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import conventionRoute from 'vite-plugin-convention-route'

export default defineConfig(() => {
  return {
    plugins: [react(), conventionRoute()],
  }
})
```

App.tsx

```tsx
import { Suspense } from 'react'
import routes from 'virtual:route?routePath=./pages'
import { createBrowserRouter, RouterProvider } from 'react-router'

const router = createBrowserRouter(routes)

export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
```

> **Note:** All page components are loaded with `React.lazy`. You must wrap your router in a `<Suspense>` boundary, otherwise React will throw an error.

### File conventions

| File | Route |
|------|-------|
| `pages/index.tsx` | `/` |
| `pages/about/index.tsx` | `/about` |
| `pages/[id]/index.tsx` | `/:id` |
| `pages/-[id]/index.tsx` | `/:id?` |
| `pages/[...slug]/index.tsx` | `/slug/*` |
| `pages/-about/index.tsx` | `/about?` |
| `pages/(auth)/layout.tsx` + `pages/(auth)/login/index.tsx` | layout group |
| `pages/layout.tsx` | wraps all child routes |
| `pages/404.tsx` | catch-all not-found page |
| `pages/_utils/helper.ts` | ignored (private) |

Supported file extensions: `.tsx`, `.jsx`, `.ts`, `.js`

### TypeScript

Add this to your `*.d.ts` file:

```ts
/// <reference types="vite-plugin-convention-route/client" />
```
