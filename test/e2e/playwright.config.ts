import { defineConfig, devices } from '@playwright/test'

// E2E_MODE=dev runs the site with `next dev`; anything else (the default)
// serves the production build, which requires `pnpm build:e2e` first.
const isDev = process.env.E2E_MODE === 'dev'

export default defineConfig({
  webServer: {
    // Relative commands run from this config file's directory.
    command: isDev ? 'pnpm --dir site dev' : 'pnpm --dir site start',
    reuseExistingServer: !process.env.CI,
    port: 4000,
    timeout: 120 * 1000
  },
  testDir: '.',
  /* The base directory, relative to the config file, for snapshot files created with toMatchSnapshot and toHaveScreenshot. */
  snapshotDir: './__snapshots__',
  outputDir: './test-results',
  /* Maximum time one test can run for. Dev mode compiles pages on demand, so give it more headroom. */
  timeout: (isDev ? 30 : 10) * 1000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. Cap workers in dev mode — the dev server
     is a single process and too many concurrent renders skew the fixed timing
     windows some tests assert on. */
  workers: process.env.CI ? 1 : isDev ? 4 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { open: 'never', outputFolder: './playwright-report' }]
      ]
    : [['html', { open: 'on-failure', outputFolder: './playwright-report' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: 'http://localhost:4000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: process.env.CI ? 'on-first-retry' : 'on',
    ...devices['Desktop Chrome']
  },
  projects: isDev
    ? [
        /* Dev compiles routes on demand — visit them all once so tests see production-like timing. */
        { name: 'warmup', testMatch: /warmup\.setup\.ts/ },
        { name: 'chromium', dependencies: ['warmup'] }
      ]
    : [{ name: 'chromium' }]
})
