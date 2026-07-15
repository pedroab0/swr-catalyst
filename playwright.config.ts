import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  expect: {
    timeout: 15 * 1000,
    /* Increase tolerance for cross-platform rendering differences (Mac ARM vs CI x86) */
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.15,
      threshold: 0.2,
    },
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  testDir: "./examples/demo/e2e",
  /* Give extra time in CI/Docker environments */
  timeout: process.env.CI ? 60 * 1000 : 30 * 1000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:4173",

    /* Take screenshots on failure */
    screenshot: "only-on-failure",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run demo:preview",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    url: "http://localhost:4173",
  },
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
});
