# vite-plugin-convention-route

A Vite-based file system routing plugin for React Router, providing Next.js-like capabilities.

- File system-based routing conventions
  - `/a/[b]/index.tsx` --> `/a/:b`
  - `/a/-[b]/index.tsx` --> `/a/:b?`
  - `/a/b/index.tsx` --> `/a/b`
  - `/a/-b/index.tsx` --> `/a/b?`
  - `/a/[...b]/index.tsx` --> `/a/:b`, `/a/:b/:c` ...

### Usage

Install

```sh
npm i vite-plugin-convention-route -D
```

vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  return {
    plugins: [react(), conventionRoute()],
  }
})
```

App.tsx

```ts
import routes from 'virtual:route?routePath=./pages'
import { createBrowserRouter } from 'react-router'
const router = createBrowserRouter(routes)
```

### TypeScript

add this to d.ts

```ts
/// <reference types="vite-plugin-convention-route/client" />
```
