import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Basis "./" – dadurch läuft der Build sowohl lokal als auch unter einem
 * Unterpfad auf GitHub Pages (https://<konto>.github.io/pre-syp-prp-bewertung/).
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/domain/**', 'src/store/**', 'src/export/**'],
    },
  },
});
