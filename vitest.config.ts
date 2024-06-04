import { defineVitestConfig } from '@nuxt/test-utils/config'
import Vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineVitestConfig({
  plugins: [Vue()],
  test: {
    globals: true,
    environment: 'jsdom',
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