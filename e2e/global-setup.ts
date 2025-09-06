import { chromium, request, type FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Global setup: obtain a Clerk sign-in token and persist an authenticated storage state
export default async function globalSetup(_config: FullConfig) {
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
  const secretKey = process.env.CLERK_SECRET_KEY;
  const testUserId = process.env.CLERK_TEST_USER_ID;
  const locale = process.env.E2E_LOCALE || 'en'; // ex: 'en' | 'ja' | 'fr'

  const storagePath = path.resolve('tmp/playwright/state/auth.json');

  // If required envs are missing, skip creating auth state (tests using it will likely fail)
  if (!secretKey || !testUserId) {
    console.warn('[global-setup] Missing CLERK_SECRET_KEY or CLERK_TEST_USER_ID. Skipping auth state creation.');
    return;
  }

  // 1) Create a sign-in token via Clerk's Management API
  const api = await request.newContext({
    baseURL: 'https://api.clerk.com',
    extraHTTPHeaders: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  const tokenResp = await api.post('/v1/sign_in_tokens', {
    data: { user_id: testUserId },
  });

  if (!tokenResp.ok()) {
    const body = await tokenResp.text();
    throw new Error(`[global-setup] Failed to create sign-in token: ${tokenResp.status()} ${body}`);
  }

  const tokenJson = await tokenResp.json();
  const token: string | undefined = tokenJson?.token;
  if (!token) {
    throw new Error('[global-setup] Clerk token response did not include token');
  }

  // 2) Open the app and sign-in with the token (no UI interaction)
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const signInPath = locale === 'en'
    ? `/signin?sign_in_token=${encodeURIComponent(token)}`
    : `/${locale}/signin?sign_in_token=${encodeURIComponent(token)}`;

  await page.goto(`${baseURL}${signInPath}`);
  await page.waitForLoadState('networkidle');

  // Middleware redirects authenticated users away from /signin to /dashboard
  const expectedDashboard = locale === 'en' ? '/dashboard' : `/${locale}/dashboard`;
  try {
    await page.waitForURL(new RegExp(`${expectedDashboard.replace('/', '\\/')}`), { timeout: 15_000 });
  } catch {
    // If redirect detection fails, ensure a Clerk session cookie exists at least
  }

  const cookies = await context.cookies();
  const hasSession = cookies.some((c) => c.name === '__session');
  if (!hasSession) {
    throw new Error('[global-setup] Clerk session cookie not found after token sign-in');
  }

  // 3) Persist storage state for all tests
  await fs.promises.mkdir(path.dirname(storagePath), { recursive: true });
  await context.storageState({ path: storagePath });

  await browser.close();
  await api.dispose();
}

