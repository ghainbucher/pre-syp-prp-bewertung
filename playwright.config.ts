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
  /*
   * **Vier Arbeiter, nicht sechs, und 60 Sekunden statt 30.** Beides betrifft den
   * Start von Firefox unter Windows, nicht die Anwendung.
   *
   * Beobachtet am 13.09.2026: Die ersten vier Firefox-Tests eines Laufs brauchten
   * 21 bis 30 Sekunden, die späteren desselben Laufs 0,5 bis 3 Sekunden. Einer
   * riss die Vorgabe von 30 s und schlug fehl – beim Warten auf ein Feld, das
   * vorhanden war. Sechs gleichzeitig startende Firefox-Profile sind der Engpass;
   * wer nach dem Fehler in der Anwendung sucht, sucht am falschen Ort.
   *
   * `workers` senkt die Zahl der gleichzeitigen Kaltstarts, `timeout` gibt dem
   * verbleibenden Start Luft. 60 s erkennt eine echte Blockade immer noch – nur
   * eine Minute später.
   */
  workers: process.env.CI ? undefined : 4,
  timeout: 60_000,
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
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        /**
         * Firefox legt beim Schließen eines Kontexts über die Sitzungs-
         * wiederherstellung («SessionStore») los und stolpert dabei, wenn
         * mehrere Fenster gleichzeitig starten und enden: Der Abbau meldet
         * `can't access property "_maybeDontRestoreTabs"`, **nachdem** der Test
         * selbst durchgelaufen ist. Das ist kein Befund über die Anwendung,
         * kostet aber einen roten Lauf.
         *
         * Die Wiederherstellung wird hier abgeschaltet – ein Testlauf hat
         * nichts wiederherzustellen.
         */
        launchOptions: {
          firefoxUserPrefs: {
            'browser.sessionstore.resume_from_crash': false,
            'browser.sessionstore.max_tabs_undo': 0,
            'browser.sessionstore.max_windows_undo': 0,
            // Praktisch nie: der Lauf ist vorbei, bevor gespeichert wird.
            'browser.sessionstore.interval': 6_000_000,
          },
        },
      },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
