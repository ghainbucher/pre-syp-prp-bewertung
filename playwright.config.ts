/// <reference types="node" />
// Diese Datei läuft auf Node, nicht im Browser – tsconfig.json führt in `types`
// bewusst nur `vite/client`, damit Node-Globals nicht im Anwendungscode
// auftauchen. Die Referenz holt sie genau hier und nur hier herein.

import { defineConfig, devices } from '@playwright/test';

/**
 * E2E-Tests laufen gegen den Produktionsbuild (NFA-05).
 * Der Vorschauserver wird von Playwright selbst gestartet.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    locale: 'de-AT',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
