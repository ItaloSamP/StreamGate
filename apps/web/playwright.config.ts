import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173'

const stableMode = Boolean(process.env.CI || process.env.E2E_STABLE_MODE)
const projects = stableMode
  ? [
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
        },
      },
    ]
  : [
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
        },
      },
      {
        name: 'firefox',
        use: {
          ...devices['Desktop Firefox'],
        },
      },
    ]

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: stableMode ? 1 : 0,
  workers: stableMode ? 1 : undefined,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  outputDir: 'e2e/reports/test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e/reports/playwright-report', open: 'never' }],
    ['json', { outputFile: 'e2e/reports/playwright-results.json' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  projects,
})
