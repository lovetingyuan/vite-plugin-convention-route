import { type RouteObject } from 'react-router'
import { lazy, type ComponentType } from 'react'

const PageKey = Symbol('page')
const LayoutKey = Symbol('layout')

type Comp = { default: ComponentType }

const pages = import.meta.glob<Comp>([
  '__ROUTERS_PATH__/**/index.tsx',
  '__ROUTERS_PATH__/**/index.jsx',
  '__ROUTERS_PATH__/**/index.ts',
  '__ROUTERS_PATH__/**/index.js',
  '__ROUTERS_PATH__/**/layout.tsx',
  '__ROUTERS_PATH__/**/layout.jsx',
  '__ROUTERS_PATH__/**/layout.ts',
  '__ROUTERS_PATH__/**/layout.js',
])
const notFound = import.meta.glob<Comp>([
  '__ROUTERS_PATH__/404.tsx',
  '__ROUTERS_PATH__/404.jsx',
  '__ROUTERS_PATH__/404.ts',
  '__ROUTERS_PATH__/404.js',
])

type RouteMetaItem = {
  [PageKey]?: () => Promise<Comp>
  [LayoutKey]?: () => Promise<Comp>
} & {
  [K in string]: RouteMetaItem
}

function buildRoute(route: string, config: RouteMetaItem, routes: RouteObject[] = []) {
  const children: RouteObject[] = []
  const router: RouteObject = {
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
        Component: lazy(config[PageKey]),
      })
    }
    router.Component = lazy(config[LayoutKey])
  } else if (config[PageKey]) {
    router.Component = lazy(config[PageKey])
  }

  for (const key of Object.keys(config)) {
    buildRoute(key, config[key], children)
  }

  if (router.Component || router.path !== undefined || children.length > 0) {
    routes.push(router)
  }

  return routes
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function buildRoutesFromFiles(
  pages: Record<string, () => Promise<Comp>>,
  notFound: Record<string, () => Promise<Comp>> = {}
): RouteObject[] {
  const pagesMap: RouteMetaItem = {}

  Object.keys(pages).forEach(file => {
    let _file = file.replace('__ROUTERS_PATH__/', '')
    const lastSlash = _file.lastIndexOf('/')
    const filename = lastSlash >= 0 ? _file.slice(lastSlash + 1) : _file
    const isPage = filename.startsWith('index.')
    const isLayout = filename.startsWith('layout.')
    if (!isPage && !isLayout) return

    const dirPart = lastSlash >= 0 ? _file.slice(0, lastSlash) : ''
    const segments = dirPart ? dirPart.split('/') : []
    let map = pagesMap
    segments.unshift('/')
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
        if (i > 1) {
          const parentSegments = segments.slice(1, i)
          const layoutPath = '__ROUTERS_PATH__/' + parentSegments.join('/') + '/layout.tsx'
          const layoutPathJsx = '__ROUTERS_PATH__/' + parentSegments.join('/') + '/layout.jsx'
          if (!pages[layoutPath] && !pages[layoutPathJsx]) {
            throw new Error(`${segment} must contain layout.tsx in its parent directory (nested routes).`)
          }
        }
      }
      map[segment] ??= {}
      map = map[segment]
    }

    const key = isPage ? PageKey : LayoutKey
    map[key] = pages[file]
  })

  const rootConfig = pagesMap['/']
  const routes: RouteObject[] = rootConfig ? buildRoute('/', rootConfig) : []

  const notFoundExts = ['.tsx', '.jsx', '.ts', '.js']
  const notFoundFile = notFoundExts
    .map(ext => '__ROUTERS_PATH__/404' + ext)
    .find(p => notFound[p])

  if (notFoundFile) {
    routes.push({
      path: '*',
      Component: lazy(notFound[notFoundFile]),
    })
  }

  return routes
}

export default buildRoutesFromFiles(pages, notFound)
