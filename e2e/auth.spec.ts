import { test, expect } from '@playwright/test';

test.describe('Authenticated flows', () => {
  test('ダッシュボードへ遷移できる', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

