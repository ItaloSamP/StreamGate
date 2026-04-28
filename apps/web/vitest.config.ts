import path from 'node:path'

import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    pool: 'vmThreads',
    fileParallelism: false,
    maxWorkers: 1,
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    exclude: [...configDefaults.exclude, 'tests/integration/**/*.integration.test.ts'],
  },
})
