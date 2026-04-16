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
