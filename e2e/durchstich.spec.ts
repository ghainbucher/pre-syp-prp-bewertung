import { expect, test, type Page } from '@playwright/test';

/**
 * Durchstiche durch die Anwendung (Teststrategie, Solution Design Kap. 8).
 *
 * Die Reiter werden immer über die Navigationsleiste angesprochen: Die
 * Leeransicht enthält einen Schalter mit demselben Text, und Playwright
 * verlangt eindeutige Treffer.
 */

/**
 * Ein Hauptbereich in der oberen Reiterzeile (FA-34 AK-1).
 *
 * **Kein `exact`**: Der Knopf trägt vor dem Titel seine Nummer, sein
 * zugänglicher Name lautet also „02 Tests". Eindeutig ist der Treffer trotzdem,
 * weil der Locator nur die obere Zeile umfasst – die Unterseiten liegen in der
 * zweiten und heißen teilweise gleich.
 */
function reiter(seite: Page, name: string) {
  return seite.locator('nav.reiter .rahmen').first().getByRole('button', { name });
}

/**
 * Eine Unterseite in der zweiten Reiterzeile.
 *
 * Sie ist nur sichtbar, wenn man im zugehörigen Bereich ist (FA-34 AK-5a) –
 * `exact`, weil „Tests" oben und unten vorkommt.
 */
function unterseite(seite: Page, name: string) {
  return seite.locator('nav.reiter .unterreiter').getByRole('button', { name, exact: true });
}

/** Eine der sechs Stammdatenseiten öffnen (FA-34 AK-3). */
async function stammdaten(seite: Page, name: string) {
  await reiter(seite, 'Stammdaten').click();
  await unterseite(seite, name).click();
}

/**
 * Einen Teil eines Abschnitts öffnen – Planning, Daily, Review,
 * Diplomarbeitsvorbereitung.
 *
 * Die zweite Reiterzeile ist **nur im Bereich Projekt** sichtbar (FA-34 AK-5):
 * Ein Sprintteil ohne Projekt ist ein Schritt ohne Gegenstand. Wer von der
 * Notenauswertung in ein Review will, geht über „Projekt“ – dieser Helfer tut
 * genau das, und nur wenn es nötig ist.
 */
async function sprintteil(seite: Page, name: string) {
  if (!(await unterseite(seite, name).isVisible())) await reiter(seite, 'Projekte').click();
  await unterseite(seite, name).click();
}

/**
 * Klasse, Projekt, zwei Schüler und ein Sprint – die Ausgangslage fast aller
 * Durchstiche.
 *
 * Der Weg geht bewusst durch die Stammdatenblätter in der Reihenfolge, in der
 * ein Mensch sie braucht: Klasse, Schüler, Projekt, Zuordnung. Zuletzt entsteht
 * der Sprint dort, wo er entsteht – im Planning (FA-70 AK-1).
 */
async function grunddatenAnlegen(seite: Page) {
  await stammdaten(seite, 'Klassen');
  await seite.getByLabel('Neue Klasse').fill('4AHIF');
  await seite.getByRole('button', { name: 'anlegen' }).click();

  await unterseite(seite, 'Schüler').click();
  await seite.getByLabel('Neue Schülerinnen und Schüler').fill('Berger Lena, Steiner Jonas');
  await seite.getByRole('button', { name: 'Hinzufügen' }).click();

  await unterseite(seite, 'Projekte').click();
  await seite.getByLabel('Neues Projekt').fill('Team Kepler');
  await seite.getByRole('button', { name: 'anlegen' }).click();

  // FA-87 AK-5: Die Schüler werden beim Projekt gewählt, nicht umgekehrt.
  await seite.getByLabel('Berger Lena', { exact: true }).check();
  await seite.getByLabel('Steiner Jonas', { exact: true }).check();

  // FA-70 AK-1 und AK-6: Der Sprint entsteht beim Planning und gehört sofort
  // dem gewählten Projekt – ein eigener Schritt „Planung festhalten" entfällt.
  await sprintteil(seite, 'Sprintplanning');
  await seite.getByRole('button', { name: 'Sprint anlegen' }).click();
  await expect(
    seite.locator('section.karte').filter({
      has: seite.getByRole('heading', { name: 'Sprintplanung' }),
    }),
  ).toBeVisible();
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

  await sprintteil(page, 'Sprintreview');
  await expect(page.getByRole('heading', { level: 2, name: /Sprint 1/ })).toBeVisible();

  await teamErgebnisVollBewerten(page);
  await expect(page.getByText('100 %').first()).toBeVisible();

  await reiter(page, 'Notenauswertung').click();
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
  await sprintteil(page, 'Sprintreview');
  await teamErgebnisVollBewerten(page);

  await reiter(page, 'Notenauswertung').click();

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

test('gliedert die Anwendung in vier Bereiche und stellt den Ablauf eine Ebene tiefer (FA-34, FA-37)', async ({
  page,
}) => {
  // AK-1: Vier Bereiche, geordnet nach der Häufigkeit der Benutzung.
  const bereiche = ['Projekte', 'Tests', 'Notenauswertung', 'Stammdaten'];
  for (const name of bereiche) {
    await expect(reiter(page, name)).toBeVisible();
  }
  await expect(page.locator('nav.reiter .rahmen').first().locator('button')).toHaveText(
    bereiche.map((b) => new RegExp(b)),
  );

  // AK-1: Der Einstieg sind die Projekte, nicht die Stammdaten.
  await expect(page.getByRole('heading', { level: 2, name: 'Projekte', exact: true })).toBeVisible();

  // AK-2 und FA-91 AK-4: Der Ablauf eines Sprints ist kein Bereich, sondern ein
  // Schritt innerhalb eines Projekts – zweite Zeile, nur im Bereich Projekte.
  for (const name of ['Sprintplanning', 'Daily', 'Sprintreview']) {
    await expect(unterseite(page, name)).toBeVisible();
  }

  // AK-3: Ein Blatt je Sache – Klassen und Schüler getrennt, je
  // Leistungsbereich eines, Notenschlüssel und Stichtage für beide.
  await reiter(page, 'Stammdaten').click();
  await expect(page.locator('nav.reiter .unterreiter button')).toHaveText([
    'Klassen',
    'Schüler',
    'Projekte',
    'Tests',
    'Rubrik & Notenschlüssel',
    'Stichtage',
  ]);

  // AK-5a: Außerhalb des Projekts sind die Sprintteile nicht sichtbar.
  await expect(unterseite(page, 'Sprintreview')).toHaveCount(0);
  await reiter(page, 'Projekte').click();
  await expect(unterseite(page, 'Sprintreview')).toBeVisible();
  await unterseite(page, 'Daily').click();
  await expect(reiter(page, 'Projekte')).toHaveAttribute('aria-current', 'true');

  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test('verlangt für das Löschen eine zweite Bestätigung (FA-36)', async ({ page }) => {
  await grunddatenAnlegen(page);
  await stammdaten(page, 'Projekte');

  await page.getByRole('button', { name: 'Projekt löschen' }).click();

  // Erster Klick schärft nur – und der geschärfte Schalter benennt, was daran
  // hängt (FA-36 AK-3). „Wirklich?" beantwortet jeder mit Ja.
  const scharf = page.getByRole('button', { name: 'mit 2 Schülern?' });
  await expect(scharf).toBeVisible();
  await expect(page.getByLabel('Name von Team Kepler')).toHaveValue('Team Kepler');

  // Daneben steht, welcher der beiden Löschausgänge greift (FA-94 AK-3).
  await expect(page.getByText(/Der Eintrag (wird endgültig entfernt|bleibt erhalten)/)).toBeVisible();

  // Zweiter Klick löscht.
  await scharf.click();
  await expect(page.getByLabel('Name von Team Kepler')).toHaveCount(0);
});

test('behält die Daten nach dem Neuladen (FA-19, FA-35)', async ({ page }) => {
  await grunddatenAnlegen(page);

  // Der Klassenfilter steht in der Kopfleiste und gilt für die ganze Anwendung
  // (FA-95). Vorgabe ist „alle Klassen" – und zwar **auch nachdem** eine Klasse,
  // Schüler, ein Projekt und ein Sprint angelegt wurden: Nur der Benutzer stellt
  // den Filter, keine Anlegeaktion (AK-9). Diese Zeile ist der Wächter dafür.
  const klassenwahl = page.getByLabel('Klasse', { exact: true });
  await expect(klassenwahl).toHaveValue('');

  // Ausdrücklich eine Klasse wählen, damit das Merken der Auswahl überhaupt
  // etwas zu merken hat (FA-35).
  await klassenwahl.selectOption({ label: '4AHIF' });

  // Bewusst ohne Wartezeit: Das Speichern ist um 400 ms entprellt, das Neuladen
  // erfolgt früher. Der Test prüft damit zugleich, dass beim Verlassen der Seite
  // sofort geschrieben wird – sonst wäre die letzte Eingabe verloren (R-01).
  await page.reload();

  // FA-95 AK-1: derselbe Filter, dieselbe Stelle, und die Einstellung ist noch
  // da (FA-35).
  await expect(page.getByLabel('Klasse', { exact: true })).toHaveValue(/.+/);
  await stammdaten(page, 'Projekte');
  await expect(page.getByLabel('Name von Team Kepler')).toHaveValue('Team Kepler');

  // Und zurück auf „alle Klassen" – der Filter ist auf jeder Sicht änderbar.
  await page.getByLabel('Klasse', { exact: true }).selectOption('');
  await expect(page.getByLabel('Name von Team Kepler')).toHaveValue('Team Kepler');
});

test('erfasst einen Test in einer eigenen Sicht, ohne Team (FA-56, FA-60, FA-74)', async ({ page }) => {
  await grunddatenAnlegen(page);

  await stammdaten(page, 'Tests');
  await page.getByLabel('Neuer Test').fill('Test 1');
  await page.getByRole('button', { name: 'anlegen' }).click();

  // FA-74 AK-2: Der Test steht nicht in der Sprintleiste, sondern in seiner Sicht.
  await reiter(page, 'Tests').click();
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

test('überträgt keine Daten an einen Server (NFA-03, DS-02)', async ({ page }) => {
  const fremdeAufrufe: string[] = [];
  page.on('request', (anfrage) => {
    const url = new URL(anfrage.url());
    if (url.hostname !== 'localhost' && url.protocol !== 'data:' && url.protocol !== 'blob:') {
      fremdeAufrufe.push(anfrage.url());
    }
  });

  await grunddatenAnlegen(page);
  await sprintteil(page, 'Sprintreview');
  await page.getByLabel('Funktionalität', { exact: true }).fill('7');

  expect(fremdeAufrufe).toEqual([]);
});

test('plant den Sprint je Team, bevor bewertet wird (FA-66, FA-67, FA-70)', async ({ page }) => {
  await grunddatenAnlegen(page);
  await sprintteil(page, 'Sprintplanning');

  const planung = page
    .locator('section.karte')
    .filter({ has: page.getByRole('heading', { name: 'Sprintplanung' }) });
  await planung.getByLabel('Sprint-Ziel von Team Kepler').fill('Buchungsmodul mit Storno');
  await planung.getByLabel('Ende von Team Kepler').fill('2027-01-28');

  // Das Ziel überlebt das Neuladen – es liegt im Datenbestand, nicht im Zustand.
  await page.reload();
  await sprintteil(page, 'Sprintplanning');
  await expect(page.getByLabel('Sprint-Ziel von Team Kepler')).toHaveValue(
    'Buchungsmodul mit Storno',
  );

  // Alle Kriterien stehen zur Wahl; abgewählte verschwinden aus der Punktemaske,
  // nicht aus der Liste (FA-67 AK-2).
  const auswahl = page.getByLabel('Sprint Review in diesem Abschnitt verwenden');
  await expect(auswahl).toBeChecked();
  await auswahl.uncheck();
  await expect(auswahl).not.toBeChecked();

  // Im Sprintreview fehlt das abgewählte Kriterium, die übrigen stehen da.
  // (Im Planning wäre keines davon zu sehen – sie werden dort nicht beobachtet.)
  await sprintteil(page, 'Sprintreview');
  await expect(page.getByLabel('Sprint Review', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Funktionalität', { exact: true })).toBeVisible();

  // Nach dem ersten Punkt stehen die Kriterien fest (FA-67 AK-4).
  await page.getByLabel('Funktionalität', { exact: true }).fill('10');
  await sprintteil(page, 'Sprintplanning');
  await expect(page.getByLabel('Funktionalität in diesem Abschnitt verwenden')).toBeDisabled();
});

test('erfasst jedes Kriterium in der Phase, in der es beobachtet wird (FA-71, FA-72, FA-75)', async ({
  page,
}) => {
  await grunddatenAnlegen(page);

  // „Sprint Planning“ trägt den Zeitpunkt Planning und wird dort erfasst.
  await sprintteil(page, 'Sprintplanning');
  await expect(page.getByLabel('Sprint Planning', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Standup', { exact: true })).toHaveCount(0);
  await page.getByLabel('Sprint Planning', { exact: true }).fill('4');

  // „Standup“ steht im Daily – und sonst nirgends (OP-F30).
  await sprintteil(page, 'Daily');
  await expect(page.getByLabel('Standup', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Sprint Planning', { exact: true })).toHaveCount(0);

  // Im Review sind beide nur noch zu sehen, nicht mehr zu ändern (FA-72 AK-2).
  await sprintteil(page, 'Sprintreview');
  await expect(page.getByLabel('Sprint Planning', { exact: true })).toHaveCount(0);
  const frueher = page
    .locator('section.karte')
    .filter({ has: page.getByRole('heading', { name: 'Früher erfasst' }) });
  await expect(frueher.getByRole('cell', { name: 'Sprint Planning' })).toBeVisible();
  await expect(frueher.getByRole('cell', { name: 'Standup' })).toBeVisible();
});

test('fixiert einen Sprint erst nach dem Review des vorigen (FA-77)', async ({ page }) => {
  await grunddatenAnlegen(page);

  const planung = page
    .locator('section.karte')
    .filter({ has: page.getByRole('heading', { name: 'Sprintplanung' }) });

  // AK-1, AK-2: Der erste Sprint ist ein Vorschlag und ohne Vorgänger sofort
  // fixierbar.
  await expect(planung.getByText(/Noch ein Vorschlag/)).toBeVisible();
  await expect(planung.getByRole('button', { name: 'Sprint fixieren' })).toBeEnabled();

  // Ein zweiter Sprint: Sein Planning ist gesperrt, und der Grund steht da (AK-3, AK-4).
  await page.locator('.auswahlzeile').getByRole('button', { name: '+ Sprint' }).click();
  await expect(planung.getByText(/Sprint 1 mit dem Sprintreview abgeschlossen/)).toBeVisible();
  await expect(planung.getByRole('button', { name: 'Sprint fixieren' })).toBeDisabled();

  // AK-5: Der Abschluss geschieht im Sprintreview, mit einer Handlung.
  await page.locator('.auswahlzeile').getByRole('button', { name: /Sprint 1/ }).click();
  await sprintteil(page, 'Sprintreview');
  await page.getByRole('button', { name: 'Sprint abschließen' }).click();
  await expect(page.getByText(/Sprint 1 ist abgeschlossen/)).toBeVisible();

  // Danach lässt sich der zweite fixieren (AK-3).
  await sprintteil(page, 'Sprintplanning');
  await page.locator('.auswahlzeile').getByRole('button', { name: /Sprint 2/ }).click();
  await planung.getByRole('button', { name: 'Sprint fixieren' }).click();
  await expect(planung.getByText(/Noch ein Vorschlag/)).toHaveCount(0);
});

test('ordnet die Projekte über Klassen hinweg und führt in ihre Sprints (FA-87, FA-90, FA-91)', async ({
  page,
}) => {
  await grunddatenAnlegen(page);
  await reiter(page, 'Projekte').click();

  // FA-90 AK-1: Jahrgangsfilter. Ohne Art fällt das Projekt heraus – es wird
  // keinem Jahrgang zugeschlagen.
  const liste = page
    .locator('section.karte')
    .filter({ has: page.getByRole('heading', { name: 'Projekte' }) });
  await expect(liste.getByRole('cell', { name: 'Team Kepler' })).toBeVisible();
  await page.getByRole('button', { name: '4. Jahrgang' }).click();
  await expect(liste.getByRole('cell', { name: 'Team Kepler' })).toHaveCount(0);

  // FA-87 AK-2: Die Art wird am Projekt gesetzt; danach greift der Filter.
  await page.getByRole('button', { name: 'alle Jahrgänge' }).click();

  // Gesetzt wird der Typ im Stammdatenblatt, nicht in der Leistungssicht
  // (FA-94 AK-1): Dort steht er nur noch da.
  await stammdaten(page, 'Projekte');
  await page.getByLabel('Typ von Team Kepler').selectOption({ label: 'SYP/PRE 4. Jahrgang' });
  await reiter(page, 'Projekte').click();
  await page.getByRole('button', { name: '4. Jahrgang' }).click();
  await expect(liste.getByRole('cell', { name: 'Team Kepler' })).toBeVisible();

  // FA-90 AK-4: Eine leere Liste sagt, dass der Filter sie leert.
  await page.getByRole('button', { name: '5. Jahrgang' }).click();
  await expect(page.getByText(/Kein Projekt passt zu diesem Filter/)).toBeVisible();
  await expect(page.getByText(/Jahrgang 5/)).toBeVisible();
  await page.getByRole('button', { name: 'Filter zurücksetzen' }).click();

  // FA-91 AK-1, AK-3: Der in `grunddatenAnlegen` angelegte Sprint steht in der
  // Liste, mit Kürzel und Zustand.
  const sprints = page
    .locator('section.karte')
    .filter({ has: page.getByRole('heading', { name: 'Sprints' }) });
  await expect(sprints.getByRole('cell', { name: 'S1', exact: true })).toBeVisible();
  await expect(sprints.getByText('Vorschlag').first()).toBeVisible();

  // FA-91 AK-4: Von hier aus in die drei Teile des Sprints.
  await sprints.getByRole('button', { name: 'Review', exact: true }).first().click();
  await expect(
    page.getByRole('heading', { level: 2, name: /^Sprintreview · Sprint 1/ }),
  ).toBeVisible();

  /*
    FA-95 AK-10: Ein Projekt **ohne** Sprint darf keine Sackgasse sein.
    Gemeldet vom Auftraggeber am 14.09.2026: Die Projektleiste stand nur über
    dem gefüllten Inhalt und fehlte damit genau dort, wo man sie braucht – man
    kam aus dem Sprintbereich nicht mehr zu einem anderen Projekt zurück.
  */
  await stammdaten(page, 'Projekte');
  await page.getByLabel('Neues Projekt').fill('Team Galilei');
  await page.getByRole('button', { name: 'anlegen' }).click();

  await sprintteil(page, 'Sprintplanning');
  const projektleiste = page.locator('.auswahlzeile').filter({ hasText: 'Team' }).first();
  await projektleiste.getByRole('button', { name: 'Team Galilei' }).click();

  // Kein Sprint – und trotzdem steht die Leiste da, mit der man zurückkommt.
  await expect(page.getByText(/Noch kein Sprint für Team Galilei/)).toBeVisible();
  await expect(projektleiste.getByRole('button', { name: 'Team Kepler' })).toBeVisible();

  await projektleiste.getByRole('button', { name: 'Team Kepler' }).click();
  await expect(page.getByRole('heading', { level: 2, name: /^Sprintplanning/ })).toBeVisible();
});
