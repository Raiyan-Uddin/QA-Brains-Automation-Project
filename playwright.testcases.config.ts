import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'https://practice.qabrains.com/ecommerce';

export default defineConfig({
  testDir: './Test_cases',
  testMatch: '**/*_automation.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report-testcases', open: 'never' }],
    ['json', { outputFile: 'playwright-report-testcases/results.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    headless: false,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        channel: undefined,
      },
    },
    /*{
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },*/
  ],
});
