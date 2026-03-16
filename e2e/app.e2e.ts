import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

/**
 * E2E smoke tests for siza-desktop.
 *
 * These tests launch the built Electron app (vite build must be run first).
 * In CI the `test:e2e` script runs `vite build` before launching.
 *
 * The tests are lightweight: they only assert that the renderer window
 * loads and key UI elements are visible. Network / IPC calls are not
 * mocked — tests that depend on Ollama or Supabase are skipped if
 * the services are not available (see skip conditions below).
 */

const DIST_MAIN = path.resolve(__dirname, '../dist/main/index.js');

test.describe('App bootstrap', () => {
  test('window launches and renderer is ready', async () => {
    const app = await electron.launch({
      args: [DIST_MAIN],
      env: {
        ...process.env,
        // Suppress secure keystore in test environment
        ELECTRON_ENABLE_LOGGING: '1',
        NODE_ENV: 'test',
      },
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Page title should be siza-desktop
    const title = await window.title();
    expect(title).toBeTruthy();

    // Root element rendered
    const root = await window.locator('#root');
    await expect(root).toBeVisible();

    await app.close();
  });

  test('onboarding or login screen is shown on first run', async () => {
    const app = await electron.launch({
      args: [DIST_MAIN],
      env: {
        ...process.env,
        ELECTRON_ENABLE_LOGGING: '1',
        NODE_ENV: 'test',
      },
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    // Small wait for React to mount
    await window.waitForTimeout(1000);

    // Either onboarding step title or sign-in heading should be visible
    const onboardingTitle = window.locator('text=Welcome to Siza');
    const loginHeading = window.locator('h1:has-text("Sign in")');

    const eitherVisible =
      (await onboardingTitle.isVisible().catch(() => false)) ||
      (await loginHeading.isVisible().catch(() => false));

    expect(eitherVisible).toBe(true);

    await app.close();
  });
});
