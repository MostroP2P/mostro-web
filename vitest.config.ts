import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import path from 'path'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  plugins: [
    Vue(),
    wasm(),
    topLevelAwait()
  ],
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      // Run browser-specific tests in jsdom
      ['**/browser/**/*.test.ts', 'jsdom'],
      // Run Node-specific tests in node
      ['**/node/**/*.test.ts', 'node'],
    ],
    testTransformMode: {
      web: ['\\.[jt]sx$'],
    },
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
})