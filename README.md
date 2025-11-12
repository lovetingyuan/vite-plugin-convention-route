# vite-plugin-convention-route

A Vite-based file system routing plugin for React Router, providing Next.js-like capabilities.

### Usage

Install

```sh
npm i vite-plugin-convention-route -D
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
