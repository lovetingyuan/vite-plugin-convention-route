# Route Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vitest test suite that creates real fixture files on disk and verifies that `buildRoutesFromFiles` generates the correct `RouteObject[]` for every supported file convention.

**Architecture:** Export `buildRoutesFromFiles` from `route.ts` so it can be called with a plain `Record<string, loader>` (same shape as `import.meta.glob`). A fixture directory under `__tests__/fixtures/pages/` holds real empty files for every routing scenario. Tests use `fast-glob` to scan the fixture directory, build the file map, call `buildRoutesFromFiles`, and assert on the resulting route tree.

**Tech Stack:** Vitest, fast-glob (for scanning fixture files), TypeScript

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `route.ts` | Export `buildRoutesFromFiles` and `buildRoute` |
| Create | `__tests__/fixtures/pages/index.tsx` | root page |
| Create | `__tests__/fixtures/pages/about/index.tsx` | static nested |
| Create | `__tests__/fixtures/pages/[id]/index.tsx` | dynamic param |
| Create | `__tests__/fixtures/pages/-[id]/index.tsx` | optional dynamic |
| Create | `__tests__/fixtures/pages/[...slug]/index.tsx` | splat |
| Create | `__tests__/fixtures/pages/-about/index.tsx` | optional static |
| Create | `__tests__/fixtures/pages/layout.tsx` | root layout |
| Create | `__tests__/fixtures/pages/(auth)/layout.tsx` | layout group layout |
| Create | `__tests__/fixtures/pages/(auth)/login/index.tsx` | layout group page |
| Create | `__tests__/fixtures/pages/_utils/index.tsx` | private (ignored) |
| Create | `__tests__/fixtures/pages/404.tsx` | not-found |
| Create | `__tests__/fixtures/pages/deep/a/b/c/index.tsx` | deep nesting |
| Create | `__tests__/fixtures/pages/ext-test/index.jsx` | .jsx extension |
| Create | `__tests__/fixtures/pages/ext-test-ts/index.ts` | .ts extension |
| Create | `__tests__/fixtures/pages/ext-test-js/index.js` | .js extension |
| Create | `__tests__/fixtures/pages/layout-with-page/layout.tsx` | layout + index coexist |
| Create | `__tests__/fixtures/pages/layout-with-page/index.tsx` | index under layout |
| Create | `__tests__/route.test.ts` | all test cases |
| Modify | `package.json` | add vitest + fast-glob devDeps, add test script |
| Modify | `tsconfig.json` | include `__tests__` directory |

---

### Task 1: Install dependencies and configure Vitest

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: Install vitest and fast-glob**

```bash
npm install -D vitest fast-glob
```

Expected: both appear in `devDependencies` in `package.json`.

- [ ] **Step 2: Add test script to `package.json`**

In the `"scripts"` section, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Update `tsconfig.json` to include `__tests__`**

Change `"include": ["*.ts"]` to:

```json
"include": ["*.ts", "__tests__/**/*.ts"]
```

---

### Task 2: Export testable API from `route.ts`

**Files:**
- Modify: `route.ts`

The goal is to wrap the inline `pagesMap` building + `buildRoute` call into an exported function, without changing any existing logic.

- [ ] **Step 1: Wrap pagesMap building into `buildRoutesFromFiles` and export it**

After the `buildRoute` function definition (around line 122), replace the bottom section of `route.ts`:

```ts
// Replace everything from "const pagesMap: RouteMetaItem = {}" to the end of the file
// with the following:

export function buildRoutesFromFiles(
  pages: Record<string, () => Promise<Comp>>,
  notFound: Record<string, () => Promise<Comp>> = {}
): RouteObject[] {
  const pagesMap: RouteMetaItem = {}

  // eslint-disable-next-line sonarjs/cognitive-complexity
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

// Keep the original module-level execution for production use
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

export default buildRoutesFromFiles(pages, notFound)
```

Wait — `import.meta.glob` cannot be called inside a function (it's a Vite compile-time macro). The correct approach is to keep the `import.meta.glob` calls at the top level and only export `buildRoutesFromFiles` as a pure function that accepts the already-resolved glob maps.

**Correct final structure for `route.ts`:**

Keep the existing `import.meta.glob` calls at the top (lines 9–24). Move the `pagesMap` building logic into `buildRoutesFromFiles`. Replace the bottom of the file (from `const pagesMap` to `export default routes`) with:

```ts
export function buildRoutesFromFiles(
  pages: Record<string, () => Promise<Comp>>,
  notFound: Record<string, () => Promise<Comp>> = {}
): RouteObject[] {
  const pagesMap: RouteMetaItem = {}

  // eslint-disable-next-line sonarjs/cognitive-complexity
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
```

---

### Task 3: Create fixture files

**Files:**
- Create all files under `__tests__/fixtures/pages/`

All fixture files are empty (zero bytes). Their existence is what matters — the loader functions in tests are mocks.

- [ ] **Step 1: Create all fixture files**

```
__tests__/fixtures/pages/index.tsx
__tests__/fixtures/pages/404.tsx
__tests__/fixtures/pages/layout.tsx
__tests__/fixtures/pages/about/index.tsx
__tests__/fixtures/pages/[id]/index.tsx
__tests__/fixtures/pages/-[id]/index.tsx
__tests__/fixtures/pages/[...slug]/index.tsx
__tests__/fixtures/pages/-about/index.tsx
__tests__/fixtures/pages/(auth)/layout.tsx
__tests__/fixtures/pages/(auth)/login/index.tsx
__tests__/fixtures/pages/_utils/index.tsx
__tests__/fixtures/pages/deep/a/b/c/index.tsx
__tests__/fixtures/pages/ext-test/index.jsx
__tests__/fixtures/pages/ext-test-ts/index.ts
__tests__/fixtures/pages/ext-test-js/index.js
__tests__/fixtures/pages/layout-with-page/layout.tsx
__tests__/fixtures/pages/layout-with-page/index.tsx
```

Each file can be empty or contain a minimal export:
```tsx
export default function Page() { return null }
```

---

### Task 4: Write the test file

**Files:**
- Create: `__tests__/route.test.ts`

- [ ] **Step 1: Create `__tests__/route.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import fg from 'fast-glob'
import path from 'path'
import { buildRoutesFromFiles } from '../route'
import type { RouteObject } from 'react-router'

const FIXTURE_DIR = path.resolve(__dirname, 'fixtures/pages')
const PREFIX = '__ROUTERS_PATH__'

// Loader stub — just needs to be a function returning a Promise
const loader = () => Promise.resolve({ default: () => null })

/**
 * Scan the fixture directory with a glob pattern and return a pages map
 * keyed by `__ROUTERS_PATH__/<relative-path>`.
 */
function scanFixtures(patterns: string[]): Record<string, typeof loader> {
  const files = fg.sync(patterns, { cwd: FIXTURE_DIR, dot: false })
  return Object.fromEntries(
    files.map(f => [`${PREFIX}/${f}`, loader])
  )
}

/** Recursively find a route by path in a RouteObject tree */
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
      expect(root!.Component).toBeDefined() // layout is the Component
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
      // The (auth) group should appear as a child with no path
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
      // (group) nested under `a/` which has no layout.tsx
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
      // 404 catch-all present
      expect(routes.find(r => r.path === '*')).toBeDefined()
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail (before implementation)**

```bash
npm test
```

Expected: tests fail because `buildRoutesFromFiles` is not yet exported.

---

### Task 5: Implement `buildRoutesFromFiles` export in `route.ts`

**Files:**
- Modify: `route.ts`

- [ ] **Step 1: Apply the changes from Task 2 Step 1 to `route.ts`**

The final `route.ts` should look like this (full file):

```ts
import { type RouteObject } from 'react-router'
import { lazy, type ComponentType } from 'react'

const PageKey = Symbol('page')
const LayoutKey = Symbol('layout')

type Comp = { default: ComponentType }

type RouteMetaItem = {
  [PageKey]?: () => Promise<Comp>
  [LayoutKey]?: () => Promise<Comp>
} & {
  [K in string]: RouteMetaItem
}

/**
 * 接受当前路由名称，路由配置，以及父级路由数组
 */
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

  // Only push routes that have something meaningful
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

export default buildRoutesFromFiles(pages, notFound)
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add route.ts __tests__/ package.json tsconfig.json
git commit -m "test: add vitest suite covering all route conventions"
```

---

## Self-Review

- All spec scenarios covered: root, static, dynamic, optional dynamic, splat, optional static, layout, layout group, private, 404, multi-extension, deep nesting, error cases ✓
- No TBD/TODO placeholders ✓
- `buildRoutesFromFiles` signature consistent across Task 2, Task 4, Task 5 ✓
- `fast-glob` used only in test helper, not in production code ✓
- `import.meta.glob` stays at module top level (Vite macro constraint respected) ✓
