import path from 'node:path'

import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    pool: 'vmThreads',
    fileParallelism: false,
    maxWorkers: 1,
    include: ['tests/integration/**/*.integration.test.ts'],
    exclude: [...configDefaults.exclude],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
})
