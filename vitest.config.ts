import { defineConfig } from 'vitest/config'
import { Plugin } from 'vite'

// In test environment, replace import.meta.glob calls in route.ts with empty objects
// so the module can be imported without Vite's glob validation running.
function mockImportMetaGlob(): Plugin {
  return {
    name: 'mock-import-meta-glob',
    transform(code, id) {
      if (!id.includes('route.ts') || id.includes('route.test.ts')) return
      // Replace import.meta.glob(...) calls with {}
      const patched = code.replace(/import\.meta\.glob\s*(<[^>]*>)?\s*\([^)]*\)/gs, '{}')
      return { code: patched, map: null }
    },
  }
}

export default defineConfig({
  plugins: [mockImportMetaGlob()],
  test: {
    environment: 'node',
  },
})
