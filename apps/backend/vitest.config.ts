import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@repo/db': resolve(__dirname, '../../packages/db/src/index.ts'),
    },
  },
})
