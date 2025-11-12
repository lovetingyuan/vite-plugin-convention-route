import { type RouteObject } from 'react-router'
import React from 'react'

const PageKey = Symbol('page')
const LayoutKey = Symbol('layout')

type Comp = { default: React.ComponentType }

const pages = import.meta.glob<Comp>([
  '__ROUTERS_PATH__/**/index.tsx',
  '__ROUTERS_PATH__/**/layout.tsx',
])
const notFound = import.meta.glob<Comp>('__ROUTERS_PATH__/404.tsx')

type RouteMetaItem = {
  [PageKey]?: () => Promise<Comp>
  [LayoutKey]?: () => Promise<Comp>
} & {
  [K in string]: RouteMetaItem
}

const pagesMap: RouteMetaItem = {}

// eslint-disable-next-line sonarjs/cognitive-complexity
Object.keys(pages).map(file => {
  let _file = file.replace('__ROUTERS_PATH__/', '')
  const segments = _file.split('/')
  let map = pagesMap
  const comp = segments.pop() // index.tsx or layout.tsx
  segments.unshift('/') // route path
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (segment.startsWith('_')) {
      return
    }
    if (segment.startsWith('[...') && segment.endsWith(']')) {
      if (i !== segments.length - 1) {
        throw new Error(`Splats route(${segment}) must be the last segment of the path: ${file}`)
      }
    }
    if (segment.startsWith('(') && segment.endsWith(')')) {
      const path = '__ROUTERS_PATH__/' + segments.slice(1, i).join('/') + '/layout.tsx'
      if (!pages[path]) {
        throw new Error(`${segment} must contain layout.tsx(nested routes).`)
      }
    }
    map[segment] ??= {}
    map = map[segment]
  }

  const key = comp === 'index.tsx' ? PageKey : LayoutKey
  map[key] = pages[file]
})
// console.log(pagesMap)
/**
 * 接受当前路由名称，路由配置，以及父级路由数组
 */
function buildRoute(route: string, config: RouteMetaItem, routes: RouteObject[] = []) {
  const children: RouteObject[] = []
  const router: RouteObject = {
    // path: route,
    // Component: null,
    children,
  }

  if (route.startsWith('-[') && route.endsWith(']')) {
    router.path = ':' + route.slice(2, -1) + '?'
  } else if (route.startsWith('[...') && route.endsWith(']')) {
    router.path = route.slice(4, -1) + '/*'
  } else if (route.startsWith('[') && route.endsWith(']')) {
    router.path = ':' + route.slice(1, -1)
  } else if (route.startsWith('-')) {
    router.path = route.slice(1) + '?'
  } else if (!(route.startsWith('(') && route.endsWith(')'))) {
    router.path = route
  }

  if (config[LayoutKey]) {
    if (config[PageKey]) {
      children.push({
        index: true,
        Component: React.lazy(config[PageKey]),
      })
    }
    router.Component = React.lazy(config[LayoutKey])
  } else if (config[PageKey]) {
    router.Component = React.lazy(config[PageKey])
  }
  for (const key in config) {
    buildRoute(key, config[key], children)
  }
  routes.push(router)
  return routes
}

const routes = buildRoute('/', pagesMap['/'])

if (notFound['__ROUTERS_PATH__/404.tsx']) {
  routes.push({
    path: '*',
    Component: React.lazy(notFound['__ROUTERS_PATH__/404.tsx']),
  })
}

export default routes
