/// <reference types="node" />
// Diese Datei läuft auf Node, nicht im Browser – tsconfig.json führt in `types`
// bewusst nur `vite/client`, damit Node-Globals nicht im Anwendungscode
// auftauchen. Die Referenz holt sie genau hier und nur hier herein.

import { defineConfig, devices } from '@playwright/test';

/**
 * E2E-Tests laufen gegen den Produktionsbuild (NFA-05).
 * Der Vorschauserver wird von Playwright selbst gestartet.
 *
 * **Gebaut wird vorher, im Skript `e2e`** – nicht hier. Der Vorschauserver
 * liefert aus, was in `dist` liegt, und sagt nicht dazu, wie alt das ist. Wer
 * `playwright test` ohne vorherigen Build aufruft, prüft stillschweigend einen
 * veralteten Stand; genau das ist am 12.09.2026 passiert und hat eine bereits
 * behobene Ursache zweimal als offen erscheinen lassen.
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
