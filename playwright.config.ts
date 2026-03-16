import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // Electron tests don't use a browser baseURL; config is here for reference
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'electron',
      testMatch: /.*\.e2e\.ts$/,
    },
  ],
});
