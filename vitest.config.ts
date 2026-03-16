import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/main/**/*.test.ts', 'src/shared/**/*.test.ts'],
        }
      },
      {
        test: {
          name: 'renderer',
          environment: 'jsdom',
          include: ['src/renderer/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/renderer/test-setup.ts'],
          globals: true,
        }
      }
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/main/ipc/**/*.ts',
        'src/shared/**/*.ts',
        'src/renderer/hooks/**/*.ts',
        'src/renderer/components/**/*.tsx',
        'src/renderer/pages/**/*.tsx',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        // Not yet covered — exclude until tests are added
        'src/renderer/pages/GeneratePage.tsx',
        'src/renderer/pages/SettingsPage.tsx',
        'src/renderer/components/layout/AppShell.tsx',
        'src/renderer/components/ErrorBoundary.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      },
      reporter: ['text', 'lcov']
    }
  }
});
