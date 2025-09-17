import { defineConfig } from '@playwright/test';

// Playwright configuration for E2E tests
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  // Use baseURL for shorter page.goto calls in tests
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    storageState: 'tmp/playwright/state/auth.json',
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
  },
  // Keep artifacts in repo-local tmp folder
  outputDir: 'tmp/playwright',
  // Create a logged-in storage state before tests run
  globalSetup: './e2e/global-setup.ts',
});
