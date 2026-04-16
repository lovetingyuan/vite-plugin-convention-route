/// <reference types="vite/client" />

declare module 'virtual:route?routePath=/src/pages' {
  import type { RouteObject } from 'react-router'
  const routes: RouteObject[]
  export default routes
}
