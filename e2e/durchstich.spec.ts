import { expect, test, type Page } from '@playwright/test';

/**
 * Durchstiche durch die Anwendung (Teststrategie, Solution Design Kap. 8).
 *
 * Die Reiter werden immer über die Navigationsleiste angesprochen: Die
 * Leeransicht enthält einen Schalter mit demselben Text, und Playwright
 * verlangt eindeutige Treffer.
 */

function reiter(seite: Page, name: string) {
  return seite.locator('nav.reiter').getByRole('button', { name });
}

async function grunddatenAnlegen(seite: Page) {
  await reiter(seite, 'Klassen & Teams').click();

  await seite.getByLabel('Neue Klasse').fill('4AHIF');
  await seite.getByRole('button', { name: 'Klasse anlegen' }).click();

  await seite.getByLabel('Neues Team').fill('Team Kepler');
  await seite.getByRole('button', { name: 'Team hinzufügen' }).click();

  await seite.getByLabel('Neue Schülerinnen und Schüler').fill('Berger Lena, Steiner Jonas');
  await seite.getByLabel('Team für neue Einträge').selectOption({ label: 'Team Kepler' });
  await seite.getByRole('button', { name: 'Hinzufügen', exact: true }).click();

  await seite.getByLabel('Neuer Abschnitt').fill('Sprint 1');
  await seite.getByRole('button', { name: 'Abschnitt hinzufügen' }).click();
}

/** Team-Ergebnis vollständig mit der Höchstpunktezahl bewerten. */
async function teamErgebnisVollBewerten(seite: Page) {
  const punkte: Array<[string, string]> = [
    ['Funktionalität', '10'],
    ['Code-Qualität', '10'],
    ['Tests', '8'],
    ['Dokumentation', '6'],
    ['Versionsverwaltung', '6'],
    ['Sprint Review', '5'],
  ];
  for (const [kriterium, wert] of punkte) {
    await seite.getByLabel(kriterium, { exact: true }).fill(wert);
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('führt von der Klasse bis zur Note (FA-01 bis FA-04, FA-12, FA-18, FA-28)', async ({ page }) => {
  await grunddatenAnlegen(page);

  await reiter(page, 'Bewerten').click();
  await expect(page.getByRole('heading', { level: 2, name: /Sprint 1/ })).toBeVisible();

  await teamErgebnisVollBewerten(page);
  await expect(page.getByText('100 %').first()).toBeVisible();

  await reiter(page, 'Auswertung').click();
  // In der Karte „Einzelergebnisse“ gesucht: Die Karte „Gesamtstand setzen“
  // (FA-50) führt dieselben Namen ein zweites Mal.
  const einzelergebnisse = page
    .locator('section.karte')
    .filter({ has: page.getByRole('heading', { name: 'Einzelergebnisse' }) });
  await expect(einzelergebnisse.getByRole('cell', { name: 'Berger Lena' })).toBeVisible();
  // Nur das Team-Ergebnis ist erfasst; es gilt für alle Mitglieder.
  await expect(einzelergebnisse.getByText('100,0 %').first()).toBeVisible();
});

test('zeigt Teamvergleich und Notenverteilung (FA-29, FA-30)', async ({ page }) => {
  await grunddatenAnlegen(page);
  await reiter(page, 'Bewerten').click();
  await teamErgebnisVollBewerten(page);

  await reiter(page, 'Auswertung').click();

  const teamvergleich = page.getByRole('heading', { name: 'Teams im Vergleich' });
  await expect(teamvergleich).toBeVisible();
  const vergleichskarte = page
    .locator('section.karte')
    .filter({ has: page.getByRole('heading', { name: 'Teams im Vergleich' }) });
  await expect(vergleichskarte.getByRole('cell', { name: 'Team Kepler' })).toBeVisible();

  const verteilung = page.getByRole('heading', { name: 'Notenverteilung' });
  await expect(verteilung).toBeVisible();
  // Beide Personen haben 100 % und damit Note 1.
  await expect(page.getByText('Sehr gut')).toBeVisible();
});

test('gliedert die Anwendung in vier deutschsprachige Bereiche (FA-34, FA-37)', async ({ page }) => {
  for (const bereich of ['Bewerten', 'Auswertung', 'Klassen & Teams', 'Rubrik & Notenschlüssel']) {
    await expect(reiter(page, bereich)).toBeVisible();
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test('verlangt für das Löschen eine zweite Bestätigung (FA-36)', async ({ page }) => {
  await grunddatenAnlegen(page);

  const loeschen = page.getByRole('button', { name: 'Team löschen' });
  await loeschen.click();

  // Erster Klick schärft nur – das Team ist noch da.
  await expect(page.getByRole('button', { name: 'wirklich?' })).toBeVisible();
  await expect(page.getByLabel('Teamname')).toHaveValue('Team Kepler');

  // Zweiter Klick löscht.
  await page.getByRole('button', { name: 'wirklich?' }).click();
  await expect(page.getByLabel('Teamname')).toHaveCount(0);
});

test('behält die Daten nach dem Neuladen (FA-19, FA-35)', async ({ page }) => {
  await grunddatenAnlegen(page);
  // Bewusst ohne Wartezeit: Das Speichern ist um 400 ms entprellt, das Neuladen
  // erfolgt früher. Der Test prüft damit zugleich, dass beim Verlassen der Seite
  // sofort geschrieben wird – sonst wäre die letzte Eingabe verloren (R-01).
  await page.reload();

  await expect(page.getByLabel('Klasse', { exact: true })).toHaveValue(/.+/);
  await reiter(page, 'Klassen & Teams').click();
  await expect(page.getByLabel('Teamname')).toHaveValue('Team Kepler');
});

test('erfasst einen Test ohne Team über die ganze Klasse (FA-56, FA-60)', async ({ page }) => {
  await grunddatenAnlegen(page);

  await page.getByLabel('Neuer Abschnitt').fill('Test 1');
  await page.getByLabel('Art des neuen Abschnitts').selectOption({ label: 'Test' });
  await page.getByRole('button', { name: 'Abschnitt hinzufügen' }).click();

  await reiter(page, 'Bewerten').click();
  await expect(page.getByRole('heading', { level: 2, name: 'Test 1' })).toBeVisible();

  // Ein Test kennt kein Team (FA-60 AK-3): keine Teamauswahl, dafür jede Person
  // der Klasse. Die Zelle wird in der Punktekarte gesucht – die Notizkarte
  // (FA-17) führt dieselben Namen noch einmal.
  await expect(page.locator('.auswahlzeile').getByText('Team', { exact: true })).toHaveCount(0);
  const punktekarte = page
    .locator('section.karte')
    .filter({ has: page.getByRole('heading', { name: 'Punkte je Frage' }) });
  await expect(punktekarte.getByRole('cell', { name: 'Steiner Jonas' })).toBeVisible();

  for (const frage of ['Frage 1', 'Frage 2', 'Frage 3']) {
    await page.getByLabel(`Berger Lena – ${frage}`).fill('2');
  }
  await page.getByLabel('Berger Lena – Offene Frage').fill('4');
  await expect(page.getByText('100 %').first()).toBeVisible();
});

test('zeigt die Herleitung erst auf Abruf (FA-51)', async ({ page }) => {
  await grunddatenAnlegen(page);
  await reiter(page, 'Bewerten').click();
  await teamErgebnisVollBewerten(page);
  await reiter(page, 'Auswertung').click();

  const einzelergebnisse = page
    .locator('section.karte')
    .filter({ has: page.getByRole('heading', { name: 'Einzelergebnisse' }) });

  // AK-1: Standardansicht ohne Punkte je Abschnitt, dafür Tendenz und offene
  // Kategorien.
  await expect(einzelergebnisse.getByRole('columnheader', { name: 'Tendenz' })).toBeVisible();
  await expect(einzelergebnisse.getByRole('columnheader', { name: 'offen' })).toBeVisible();
  await expect(einzelergebnisse.getByRole('columnheader', { name: 'S1' })).toHaveCount(0);

  // AK-2: mit einem Schritt erreichbar.
  await page.getByRole('button', { name: 'Herleitung zeigen' }).click();
  await expect(einzelergebnisse.getByRole('columnheader', { name: 'S1' })).toBeVisible();

  // Und wieder zurück – die Einstellung wirkt nur auf die Anzeige (AK-3).
  await page.getByRole('button', { name: 'Herleitung ausblenden' }).click();
  await expect(einzelergebnisse.getByRole('columnheader', { name: 'S1' })).toHaveCount(0);
  await expect(einzelergebnisse.getByRole('cell', { name: 'Berger Lena' })).toBeVisible();
});

test('bietet die automatische Sicherung nur an, wo der Browser sie kann (FA-64 AK-7, NFA-05)', async ({
  page,
}) => {
  const kannOrdner = await page.evaluate(() => 'showDirectoryPicker' in window);
  const waehlen = page.getByRole('button', { name: 'Ordner für die Sicherung wählen' });

  if (kannOrdner) {
    await expect(waehlen).toBeVisible();
  } else {
    // Der Durchlauf ohne die Schnittstelle, den NFA-05 verlangt: Die Anwendung
    // bleibt vollständig bedienbar und sagt, was hier nicht geht.
    await expect(waehlen).toHaveCount(0);
    await expect(page.getByText(/nicht selbst in einen Ordner schreiben/)).toBeVisible();
  }

  // In beiden Fällen bleibt der Weg von Hand offen (FA-33).
  await expect(page.getByRole('button', { name: 'Sicherung speichern' })).toBeVisible();
  await expect(page.getByText(/noch keine Sicherung erstellt/)).toBeVisible();
});

test('überträgt keine Daten an einen Server (NFA-03, DS-02)', async ({ page }) => {
  const fremdeAufrufe: string[] = [];
  page.on('request', (anfrage) => {
    const url = new URL(anfrage.url());
    if (url.hostname !== 'localhost' && url.protocol !== 'data:' && url.protocol !== 'blob:') {
      fremdeAufrufe.push(anfrage.url());
    }
  });

  await grunddatenAnlegen(page);
  await reiter(page, 'Bewerten').click();
  await page.getByLabel('Funktionalität', { exact: true }).fill('7');

  expect(fremdeAufrufe).toEqual([]);
});

test('plant den Sprint je Team, bevor bewertet wird (FA-66, FA-67)', async ({ page }) => {
  await grunddatenAnlegen(page);
  await reiter(page, 'Bewerten').click();

  // Vor dem Planen steht die Aufforderung, nicht die Punktemaske allein.
  const planen = page
    .locator('section.karte')
    .filter({ has: page.getByRole('heading', { name: 'Sprint planen' }) });
  await expect(planen).toBeVisible();
  await planen.getByRole('button', { name: 'Planung festhalten' }).click();

  const planung = page
    .locator('section.karte')
    .filter({ has: page.getByRole('heading', { name: 'Sprintplanung' }) });
  await planung.getByLabel('Sprint-Ziel von Team Kepler').fill('Buchungsmodul mit Storno');
  await planung.getByLabel('Ende von Team Kepler').fill('2027-01-28');

  // Das Ziel überlebt das Neuladen – es liegt im Datenbestand, nicht im Zustand.
  await page.reload();
  await reiter(page, 'Bewerten').click();
  await expect(page.getByLabel('Sprint-Ziel von Team Kepler')).toHaveValue(
    'Buchungsmodul mit Storno',
  );

  // Ein gestrichenes Kriterium verschwindet aus der Punktemaske dieses Teams.
  await page
    .getByRole('button', { name: 'Sprint Review für dieses Team streichen' })
    .click();
  await expect(page.getByLabel('Sprint Review', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Funktionalität', { exact: true })).toBeVisible();

  // Nach dem ersten Punkt stehen die Kriterien fest (FA-67 AK-4).
  await page.getByLabel('Funktionalität', { exact: true }).fill('10');
  await expect(
    page.getByRole('button', { name: 'Funktionalität für dieses Team streichen' }),
  ).toHaveCount(0);
});
