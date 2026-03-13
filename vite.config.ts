import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  root: 'src/renderer',
  plugins: [
    react(),
    electron([
      {
        entry: resolve(__dirname, 'src/main/index.ts'),
        vite: {
          build: {
            outDir: resolve(__dirname, 'dist/main'),
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      {
        entry: resolve(__dirname, 'src/main/preload.ts'),
        vite: {
          build: {
            outDir: resolve(__dirname, 'dist/preload')
          }
        }
      }
    ]),
    renderer()
  ],
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true
  }
});
