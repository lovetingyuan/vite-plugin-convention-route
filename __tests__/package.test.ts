import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageJsonPath = path.resolve(__dirname, '../package.json')

async function readPackageJson() {
  return JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
    peerDependencies?: Record<string, string>
  }
}

describe('package metadata', () => {
  it('declares Vite 7 and Vite 8 as supported peers', async () => {
    const pkg = await readPackageJson()

    expect(pkg.peerDependencies?.vite).toBe('^7 || ^8')
  })
})
