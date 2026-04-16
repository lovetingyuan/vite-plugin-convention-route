import { describe, it, expect } from 'vitest'
import fg from 'fast-glob'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildRoutesFromFiles } from '../route'
import type { RouteObject } from 'react-router'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE_DIR = path.resolve(__dirname, 'fixtures/pages')
const PREFIX = '__ROUTERS_PATH__'

const loader = () => Promise.resolve({ default: () => null })

function scanFixtures(patterns: string[]): Record<string, typeof loader> {
  const escaped = patterns.map(p => fg.escapePath(p))
  const files = fg.sync(escaped, { cwd: FIXTURE_DIR, dot: false })
  return Object.fromEntries(
    files.map(f => [`${PREFIX}/${f}`, loader])
  )
}

function findRoute(routes: RouteObject[], ...pathSegments: string[]): RouteObject | undefined {
  let current: RouteObject[] = routes
  let found: RouteObject | undefined
  for (const seg of pathSegments) {
    found = current.find(r => r.path === seg)
    if (!found) return undefined
    current = found.children ?? []
  }
  return found
}

describe('buildRoutesFromFiles', () => {
  describe('basic pages', () => {
    it('empty input → empty routes', () => {
      const routes = buildRoutesFromFiles({})
      expect(routes).toEqual([])
    })

    it('root index.tsx → path "/"', () => {
      const pages = scanFixtures(['index.tsx'])
      const routes = buildRoutesFromFiles(pages)
      expect(routes).toHaveLength(1)
      expect(routes[0].path).toBe('/')
      expect(routes[0].Component).toBeDefined()
    })

    it('about/index.tsx → nested path "about"', () => {
      const pages = scanFixtures(['index.tsx', 'about/index.tsx'])
      const routes = buildRoutesFromFiles(pages)
      const about = findRoute(routes, '/', 'about')
      expect(about).toBeDefined()
      expect(about!.path).toBe('about')
      expect(about!.Component).toBeDefined()
    })
  })

  describe('dynamic routes', () => {
    it('[id]/index.tsx → path ":id"', () => {
      const pages = scanFixtures(['index.tsx', '[id]/index.tsx'])
      const routes = buildRoutesFromFiles(pages)
      const dynamic = findRoute(routes, '/', ':id')
      expect(dynamic).toBeDefined()
      expect(dynamic!.path).toBe(':id')
    })

    it('-[id]/index.tsx → path ":id?"', () => {
      const pages = scanFixtures(['index.tsx', '-[id]/index.tsx'])
      const routes = buildRoutesFromFiles(pages)
      const optional = findRoute(routes, '/', ':id?')
      expect(optional).toBeDefined()
      expect(optional!.path).toBe(':id?')
    })

    it('[...slug]/index.tsx → path "slug/*"', () => {
      const pages = scanFixtures(['index.tsx', '[...slug]/index.tsx'])
      const routes = buildRoutesFromFiles(pages)
      const splat = findRoute(routes, '/', 'slug/*')
      expect(splat).toBeDefined()
      expect(splat!.path).toBe('slug/*')
    })
  })

  describe('optional static', () => {
    it('-about/index.tsx → path "about?"', () => {
      const pages = scanFixtures(['index.tsx', '-about/index.tsx'])
      const routes = buildRoutesFromFiles(pages)
      const opt = findRoute(routes, '/', 'about?')
      expect(opt).toBeDefined()
      expect(opt!.path).toBe('about?')
    })
  })

  describe('layout wrapping', () => {
    it('layout.tsx + index.tsx → index becomes nested child', () => {
      const pages = scanFixtures(['layout.tsx', 'index.tsx'])
      const routes = buildRoutesFromFiles(pages)
      const root = routes.find(r => r.path === '/')
      expect(root).toBeDefined()
      expect(root!.Component).toBeDefined()
      const indexChild = root!.children?.find(r => r.index === true)
      expect(indexChild).toBeDefined()
      expect(indexChild!.Component).toBeDefined()
    })

    it('layout-with-page/layout.tsx + layout-with-page/index.tsx → nested index child', () => {
      const pages = scanFixtures([
        'index.tsx',
        'layout-with-page/layout.tsx',
        'layout-with-page/index.tsx',
      ])
      const routes = buildRoutesFromFiles(pages)
      const lwp = findRoute(routes, '/', 'layout-with-page')
      expect(lwp).toBeDefined()
      expect(lwp!.Component).toBeDefined()
      const indexChild = lwp!.children?.find(r => r.index === true)
      expect(indexChild).toBeDefined()
    })
  })

  describe('layout groups', () => {
    it('(auth)/layout.tsx + (auth)/login/index.tsx → group has no path', () => {
      const pages = scanFixtures([
        'index.tsx',
        '(auth)/layout.tsx',
        '(auth)/login/index.tsx',
      ])
      const routes = buildRoutesFromFiles(pages)
      const root = routes.find(r => r.path === '/')
      const group = root!.children?.find(r => r.path === undefined && r.Component !== undefined)
      expect(group).toBeDefined()
      const login = group!.children?.find(r => r.path === 'login')
      expect(login).toBeDefined()
    })
  })

  describe('private folders', () => {
    it('_utils/index.tsx is ignored', () => {
      const pages = scanFixtures(['index.tsx', '_utils/index.tsx'])
      const routes = buildRoutesFromFiles(pages)
      const root = routes.find(r => r.path === '/')
      const utils = root?.children?.find(r => r.path === '_utils')
      expect(utils).toBeUndefined()
    })
  })

  describe('404 page', () => {
    it('404.tsx → { path: "*" }', () => {
      const pages = scanFixtures(['index.tsx'])
      const notFound = scanFixtures(['404.tsx'])
      const routes = buildRoutesFromFiles(pages, notFound)
      const catchAll = routes.find(r => r.path === '*')
      expect(catchAll).toBeDefined()
      expect(catchAll!.Component).toBeDefined()
    })

    it('no 404.tsx → no catch-all route', () => {
      const pages = scanFixtures(['index.tsx'])
      const routes = buildRoutesFromFiles(pages)
      const catchAll = routes.find(r => r.path === '*')
      expect(catchAll).toBeUndefined()
    })
  })

  describe('multiple extensions', () => {
    it('.jsx extension works', () => {
      const pages = scanFixtures(['index.tsx', 'ext-test/index.jsx'])
      const routes = buildRoutesFromFiles(pages)
      const extTest = findRoute(routes, '/', 'ext-test')
      expect(extTest).toBeDefined()
    })

    it('.ts extension works', () => {
      const pages = scanFixtures(['index.tsx', 'ext-test-ts/index.ts'])
      const routes = buildRoutesFromFiles(pages)
      const extTest = findRoute(routes, '/', 'ext-test-ts')
      expect(extTest).toBeDefined()
    })

    it('.js extension works', () => {
      const pages = scanFixtures(['index.tsx', 'ext-test-js/index.js'])
      const routes = buildRoutesFromFiles(pages)
      const extTest = findRoute(routes, '/', 'ext-test-js')
      expect(extTest).toBeDefined()
    })
  })

  describe('deep nesting', () => {
    it('deep/a/b/c/index.tsx → nested route tree', () => {
      const pages = scanFixtures(['index.tsx', 'deep/a/b/c/index.tsx'])
      const routes = buildRoutesFromFiles(pages)
      const c = findRoute(routes, '/', 'deep', 'a', 'b', 'c')
      expect(c).toBeDefined()
      expect(c!.path).toBe('c')
      expect(c!.Component).toBeDefined()
    })
  })

  describe('error cases', () => {
    it('splat route not as last segment throws', () => {
      const pages = {
        '__ROUTERS_PATH__/index.tsx': loader,
        '__ROUTERS_PATH__/[...slug]/sub/index.tsx': loader,
      }
      expect(() => buildRoutesFromFiles(pages)).toThrow(
        /Splats route.*must be the last segment/
      )
    })

    it('nested layout group without parent layout throws', () => {
      const pages = {
        '__ROUTERS_PATH__/index.tsx': loader,
        '__ROUTERS_PATH__/a/(group)/index.tsx': loader,
      }
      expect(() => buildRoutesFromFiles(pages)).toThrow(
        /must contain layout\.tsx in its parent directory/
      )
    })
  })

  describe('full fixture scan', () => {
    it('all fixture files produce a valid route tree without throwing', () => {
      const pages = scanFixtures([
        'index.tsx',
        'layout.tsx',
        'about/index.tsx',
        '[id]/index.tsx',
        '-[id]/index.tsx',
        '[...slug]/index.tsx',
        '-about/index.tsx',
        '(auth)/layout.tsx',
        '(auth)/login/index.tsx',
        '_utils/index.tsx',
        'deep/a/b/c/index.tsx',
        'ext-test/index.jsx',
        'ext-test-ts/index.ts',
        'ext-test-js/index.js',
        'layout-with-page/layout.tsx',
        'layout-with-page/index.tsx',
      ])
      const notFound = scanFixtures(['404.tsx'])
      expect(() => buildRoutesFromFiles(pages, notFound)).not.toThrow()
      const routes = buildRoutesFromFiles(pages, notFound)
      expect(routes.length).toBeGreaterThan(0)
      expect(routes.find(r => r.path === '*')).toBeDefined()
    })
  })
})
