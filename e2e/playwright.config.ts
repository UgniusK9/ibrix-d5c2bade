import { defineConfig, devices } from '@playwright/test';

// Shopper journeys against a running site. Defaults to the local dev server;
// point BASE_URL at a Vercel preview to check a deploy before it goes live.
// Kept out of the site's package.json so the shop build never installs it.
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8080',
    locale: 'lt-LT',
    trace: 'retain-on-failure',
    // Uses the Chrome already on the machine instead of downloading one.
    channel: 'chrome',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],
});
