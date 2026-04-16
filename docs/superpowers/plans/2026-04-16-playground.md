# Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `playground/` Vite + React demo app inside the plugin repo that imports the plugin directly from TypeScript source and demonstrates every supported route convention.

**Architecture:** `playground/` is a self-contained Vite project. Its `vite.config.ts` imports the plugin from `../index.ts` directly (no build step for the plugin itself). A `build:route` script in the plugin root compiles `route.ts` → `route.js` at the root level so the plugin's `readFile(resolve(__dirname, "./route.js"))` call resolves correctly when running from source. Pages cover all conventions: static, dynamic, optional dynamic, splat, optional static, layout group, private folder, 404.

**Tech Stack:** Vite 6, React 19, react-router 7, TypeScript, @vitejs/plugin-react

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `package.json` | Add `build:route` script |
| Create | `playground/package.json` | Playground deps and scripts |
| Create | `playground/tsconfig.json` | TypeScript config for playground |
| Create | `playground/vite.config.ts` | Vite config importing plugin from source |
| Create | `playground/index.html` | HTML entry point |
| Create | `playground/src/main.tsx` | React entry, sets up router |
| Create | `playground/src/App.tsx` | RouterProvider wrapper |
| Create | `playground/src/pages/layout.tsx` | Root layout with nav |
| Create | `playground/src/pages/index.tsx` | Home page `/` |
| Create | `playground/src/pages/about/index.tsx` | Static nested `/about` |
| Create | `playground/src/pages/[id]/index.tsx` | Dynamic `/:id` |
| Create | `playground/src/pages/-[id]/index.tsx` | Optional dynamic `/:id?` |
| Create | `playground/src/pages/[...slug]/index.tsx` | Splat `/slug/*` |
| Create | `playground/src/pages/-about/index.tsx` | Optional static `/about?` |
| Create | `playground/src/pages/(auth)/layout.tsx` | Auth group layout |
| Create | `playground/src/pages/(auth)/login/index.tsx` | `/login` |
| Create | `playground/src/pages/(auth)/register/index.tsx` | `/register` |
| Create | `playground/src/pages/_private/index.tsx` | Ignored by plugin |
| Create | `playground/src/pages/404.tsx` | Catch-all `/*` |

---

### Task 1: Add `build:route` script to plugin root and install playground deps

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add `build:route` script**

In `package.json`, add to `"scripts"`:

```json
"build:route": "tsup route.ts --format esm --external react --external react-router --out-dir ."
```

Full scripts section becomes:

```json
"scripts": {
  "build": "tsup index.ts --dts --format esm && tsup route.ts --format esm --external react --external react-router",
  "build:route": "tsup route.ts --format esm --external react --external react-router --out-dir .",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 2: Run build:route to generate route.js at plugin root**

```bash
npm run build:route
```

Expected: `route.js` appears in the plugin root directory.

- [ ] **Step 3: Verify route.js exists**

```bash
ls route.js
```

Expected: file exists, ~3-5 KB.

- [ ] **Step 4: Add route.js to .gitignore**

Append to `.gitignore`:

```
route.js
```

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore
git commit -m "build: add build:route script for playground dev workflow"
```

---

### Task 2: Create playground package.json and tsconfig

**Files:**
- Create: `playground/package.json`
- Create: `playground/tsconfig.json`

- [ ] **Step 1: Create `playground/package.json`**

```json
{
  "name": "playground",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.9.3",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create `playground/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Install playground dependencies**

```bash
cd playground && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 4: Commit**

```bash
git add playground/package.json playground/tsconfig.json playground/package-lock.json
git commit -m "chore: scaffold playground package"
```

---

### Task 3: Create vite.config.ts and index.html

**Files:**
- Create: `playground/vite.config.ts`
- Create: `playground/index.html`

- [ ] **Step 1: Create `playground/vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore — importing plugin TypeScript source directly for dev
import conventionRoutePlugin from '../index.ts'

export default defineConfig({
  plugins: [
    react(),
    conventionRoutePlugin(),
  ],
})
```

- [ ] **Step 2: Create `playground/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Convention Route Playground</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add playground/vite.config.ts playground/index.html
git commit -m "chore: add playground vite config and html entry"
```

---

### Task 4: Create React entry files

**Files:**
- Create: `playground/src/main.tsx`
- Create: `playground/src/App.tsx`

- [ ] **Step 1: Create `playground/src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 2: Create `playground/src/App.tsx`**

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router'
import routes from 'virtual:route?routePath=./src/pages'

const router = createBrowserRouter(routes)

export default function App() {
  return <RouterProvider router={router} />
}
```

- [ ] **Step 3: Add virtual module type declaration**

Create `playground/src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />

declare module 'virtual:route?routePath=./src/pages' {
  import type { RouteObject } from 'react-router'
  const routes: RouteObject[]
  export default routes
}
```

- [ ] **Step 4: Commit**

```bash
git add playground/src/
git commit -m "chore: add React entry files for playground"
```

---

### Task 5: Create root layout and home page

**Files:**
- Create: `playground/src/pages/layout.tsx`
- Create: `playground/src/pages/index.tsx`

- [ ] **Step 1: Create `playground/src/pages/layout.tsx`**

```tsx
import { Outlet, Link } from 'react-router'

export default function RootLayout() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '1rem' }}>
      <nav style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/">Home</Link>
        <Link to="/about">About (static)</Link>
        <Link to="/123">/123 (dynamic :id)</Link>
        <Link to="/login">Login (auth group)</Link>
        <Link to="/register">Register (auth group)</Link>
        <Link to="/slug/a/b/c">Splat /slug/a/b/c</Link>
        <Link to="/nonexistent">404 test</Link>
      </nav>
      <hr />
      <Outlet />
    </div>
  )
}
```

- [ ] **Step 2: Create `playground/src/pages/index.tsx`**

```tsx
export default function HomePage() {
  return (
    <div>
      <h1>Home</h1>
      <p>Route: <code>/</code></p>
      <p>Convention: <code>pages/index.tsx</code></p>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add playground/src/pages/layout.tsx playground/src/pages/index.tsx
git commit -m "feat(playground): add root layout and home page"
```

---

### Task 6: Create static and dynamic route pages

**Files:**
- Create: `playground/src/pages/about/index.tsx`
- Create: `playground/src/pages/[id]/index.tsx`
- Create: `playground/src/pages/-[id]/index.tsx`
- Create: `playground/src/pages/[...slug]/index.tsx`
- Create: `playground/src/pages/-about/index.tsx`

- [ ] **Step 1: Create `playground/src/pages/about/index.tsx`**

```tsx
export default function AboutPage() {
  return (
    <div>
      <h1>About</h1>
      <p>Route: <code>/about</code></p>
      <p>Convention: <code>pages/about/index.tsx</code> (static nested)</p>
    </div>
  )
}
```

- [ ] **Step 2: Create `playground/src/pages/[id]/index.tsx`**

```tsx
import { useParams } from 'react-router'

export default function DynamicPage() {
  const { id } = useParams()
  return (
    <div>
      <h1>Dynamic Route</h1>
      <p>Route: <code>/:id</code></p>
      <p>Convention: <code>pages/[id]/index.tsx</code></p>
      <p>Current id: <strong>{id}</strong></p>
    </div>
  )
}
```

- [ ] **Step 3: Create `playground/src/pages/-[id]/index.tsx`**

```tsx
import { useParams } from 'react-router'

export default function OptionalDynamicPage() {
  const { id } = useParams()
  return (
    <div>
      <h1>Optional Dynamic Route</h1>
      <p>Route: <code>/:id?</code></p>
      <p>Convention: <code>pages/-[id]/index.tsx</code></p>
      <p>Current id: <strong>{id ?? '(none)'}</strong></p>
    </div>
  )
}
```

- [ ] **Step 4: Create `playground/src/pages/[...slug]/index.tsx`**

```tsx
import { useParams } from 'react-router'

export default function SplatPage() {
  const { '*': splat } = useParams()
  return (
    <div>
      <h1>Splat Route</h1>
      <p>Route: <code>/slug/*</code></p>
      <p>Convention: <code>pages/[...slug]/index.tsx</code></p>
      <p>Splat: <strong>{splat ?? '(none)'}</strong></p>
    </div>
  )
}
```

- [ ] **Step 5: Create `playground/src/pages/-about/index.tsx`**

```tsx
export default function OptionalAboutPage() {
  return (
    <div>
      <h1>Optional Static Route</h1>
      <p>Route: <code>/about?</code></p>
      <p>Convention: <code>pages/-about/index.tsx</code></p>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add playground/src/pages/about playground/src/pages/\[id\] playground/src/pages/-\[id\] playground/src/pages/\[...slug\] playground/src/pages/-about
git commit -m "feat(playground): add static, dynamic, optional, and splat route pages"
```

---

### Task 7: Create auth layout group pages

**Files:**
- Create: `playground/src/pages/(auth)/layout.tsx`
- Create: `playground/src/pages/(auth)/login/index.tsx`
- Create: `playground/src/pages/(auth)/register/index.tsx`

- [ ] **Step 1: Create `playground/src/pages/(auth)/layout.tsx`**

```tsx
import { Outlet } from 'react-router'

export default function AuthLayout() {
  return (
    <div style={{ border: '2px solid #4f46e5', borderRadius: '8px', padding: '1rem' }}>
      <p style={{ color: '#4f46e5', fontWeight: 'bold' }}>Auth Group Layout (no path segment)</p>
      <p>Convention: <code>pages/(auth)/layout.tsx</code></p>
      <Outlet />
    </div>
  )
}
```

- [ ] **Step 2: Create `playground/src/pages/(auth)/login/index.tsx`**

```tsx
export default function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <p>Route: <code>/login</code></p>
      <p>Convention: <code>pages/(auth)/login/index.tsx</code></p>
    </div>
  )
}
```

- [ ] **Step 3: Create `playground/src/pages/(auth)/register/index.tsx`**

```tsx
export default function RegisterPage() {
  return (
    <div>
      <h1>Register</h1>
      <p>Route: <code>/register</code></p>
      <p>Convention: <code>pages/(auth)/register/index.tsx</code></p>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add "playground/src/pages/(auth)"
git commit -m "feat(playground): add auth layout group pages"
```

---

### Task 8: Create private folder and 404 page

**Files:**
- Create: `playground/src/pages/_private/index.tsx`
- Create: `playground/src/pages/404.tsx`

- [ ] **Step 1: Create `playground/src/pages/_private/index.tsx`**

```tsx
export default function PrivatePage() {
  return (
    <div>
      <h1>Private Page</h1>
      <p>This file is ignored by the plugin (prefix: <code>_</code>).</p>
      <p>You should never see this rendered via routing.</p>
    </div>
  )
}
```

- [ ] **Step 2: Create `playground/src/pages/404.tsx`**

```tsx
import { useLocation } from 'react-router'

export default function NotFoundPage() {
  const location = useLocation()
  return (
    <div>
      <h1>404 — Not Found</h1>
      <p>Route: <code>*</code></p>
      <p>Convention: <code>pages/404.tsx</code></p>
      <p>Tried to access: <strong>{location.pathname}</strong></p>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add playground/src/pages/_private playground/src/pages/404.tsx
git commit -m "feat(playground): add private folder and 404 page"
```

---

### Task 9: Verify playground runs

**Files:** none (verification only)

- [ ] **Step 1: Ensure route.js exists at plugin root**

From the plugin root:

```bash
ls route.js
```

If missing, run:

```bash
npm run build:route
```

- [ ] **Step 2: Start playground dev server**

```bash
cd playground && npm run dev
```

Expected output includes:
```
  VITE v6.x.x  ready in ...ms
  ➜  Local:   http://localhost:5173/
```

- [ ] **Step 3: Verify routes in browser**

Open `http://localhost:5173/` and check:
- `/` → Home page renders
- `/about` → About page renders
- `/123` → Dynamic page shows `id: 123`
- `/login` → Login inside auth layout
- `/register` → Register inside auth layout
- `/slug/a/b/c` → Splat page shows `a/b/c`
- `/nonexistent` → 404 page renders

- [ ] **Step 4: Final commit**

```bash
git add playground/
git commit -m "feat: add playground with all route convention demos"
```

---

## Self-Review

- All route conventions covered: static, dynamic `[id]`, optional dynamic `-[id]`, splat `[...slug]`, optional static `-about`, layout group `(auth)`, private `_private`, 404 ✓
- `build:route` script added so plugin source works without full build ✓
- No TBD/TODO placeholders ✓
- `virtual:route` type declaration included ✓
- `(auth)` group requires `layout.tsx` in parent — but `(auth)` is at root level (i > 1 check is `i > 1`, and `(auth)` is at index 1 in segments after unshift `/`), so no parent layout required ✓
