/**
 * Gemeinsame Hilfen der Skripte unter `scripts/`.
 *
 * Sie stehen hier und nicht dreimal kopiert: „Gibt es das schon?" ist die erste
 * Frage im Review (docs/zusammenarbeit-mit-ki.md, Kap. 6.4), und sie gilt auch
 * für die eigenen Werkzeuge.
 *
 * Dieses Modul führt **keine** Befehle aus und hat keine Seiteneffekte außer
 * `abbrechen`.
 */

import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Vorgabe für den Umfang eines Diffs. Darüber wird gekürzt und das gesagt. */
export const MAX_ZEILEN = 4000;

/** Aufrufparameter in der Form `--name wert`, Schalter ohne Wert. */
export function parameter(argv) {
  const werte = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const folgt = argv[i + 1];
    werte[argv[i].slice(2)] = !folgt || folgt.startsWith('--') ? true : folgt;
  }
  return werte;
}

export function abbrechen(satz) {
  console.error(satz);
  process.exit(1);
}

/**
 * Ein Repository auf die Form `eigentuemer/name` bringen.
 *
 * Erlaubt ist, was in der Adresszeile steht, was `git clone` frisst und was
 * `gh` erwartet – alles drei führt hierher:
 *
 *   https://github.com/htl/projekt        git@github.com:htl/projekt.git
 *   https://github.com/htl/projekt.git    htl/projekt
 *
 * Ohne diese Umsetzung entsteht ein Fehler, der nicht erklärt, was falsch ist:
 * `gh api` setzt den Wert unverändert in den Pfad ein und meldet dann
 * „unsupported protocol scheme" – eine Meldung über die Adresse, nicht über den
 * Aufruf. Wer sie zum ersten Mal sieht, sucht an der falschen Stelle.
 */
export function repoKuerzel(wert) {
  const roh = String(wert).trim();
  let kurz = roh
    .replace(/^git@[^:]+:/, '')
    .replace(/^(?:https?:\/\/|ssh:\/\/git@)[^/]+\//, '')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '');

  // Aus einer Adresse tieferer Ebenen – Pull Request, Datei, Zweig – die ersten
  // beiden Teile nehmen: github.com/htl/projekt/pull/12 ist dasselbe Repository.
  const teile = kurz.split('/').filter(Boolean);
  if (teile.length > 2) kurz = `${teile[0]}/${teile[1]}`;

  if (!/^[\w.-]+\/[\w.-]+$/.test(kurz)) {
    abbrechen(
      `„${roh}" ergibt kein Repository in der Form eigentuemer/name.\n` +
        'Erlaubt sind: eigentuemer/name, https://github.com/eigentuemer/name, git@github.com:eigentuemer/name.git',
    );
  }
  return kurz;
}

/**
 * Personenbezogenes aus einem Diff entfernen.
 *
 * Der Diff selbst nennt keine Autoren – wohl aber der Inhalt: Adressen in
 * Testdaten, Vermerke in Commit-Anhängen. Das ist **keine vollständige
 * Anonymisierung** und wird auch nicht als solche behauptet; es entfernt das,
 * was regelmäßig und maschinell auffindbar ist.
 */
export function anonymisieren(text) {
  return text
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, '<adresse entfernt>')
    .replace(/^([+-]?\s*)(Signed-off-by|Co-Authored-By|Reported-by):.*$/gim, '$1<vermerk entfernt>');
}

/**
 * Ein Datum auf Plausibilität prüfen und vor Zeiträumen in der Zukunft warnen.
 *
 * Kein Abbruch: Ein künftiges Ende ist bei einem laufenden Sprint richtig. Ein
 * künftiger **Beginn** ist dagegen fast immer ein Vertipper – und ohne Hinweis
 * sieht das Ergebnis wie ein Team ohne Beiträge aus. Ein leeres Ergebnis, das
 * nicht sagt warum, ist schlimmer als ein Fehler.
 */
export function zeitraumPruefen(von, bis, heute = new Date().toISOString().slice(0, 10)) {
  for (const [name, wert] of [['--von', von], ['--bis', bis]]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(wert)) abbrechen(`${name} braucht ein Datum in der Form JJJJ-MM-TT, nicht „${wert}".`);
  }
  if (von > bis) abbrechen(`--von (${von}) liegt nach --bis (${bis}).`);
  if (von > heute) {
    console.warn(
      `Hinweis: Der Zeitraum beginnt am ${von} und damit in der Zukunft (heute ist der ${heute}).\n` +
        'Das Ergebnis wird leer sein – das liegt am Zeitraum, nicht am Team.',
    );
  }
}

/** Ordner, in dem alle Auswertungen landen – neben den Skripten. */
export const AUSGABEORDNER = 'Review-Auswertungen';

/**
 * Wohin eine Auswertung geschrieben wird.
 *
 * `scripts/Review-Auswertungen/JJJJ-MM/<name>` – ein Ordner je Monat, damit die
 * Auswertungen **aller Teams** eines Monats beieinanderliegen und sich
 * vergleichen lassen (G11: gleich hinsehen).
 *
 * Der Monat kommt aus dem **Ende** des Zeitraums, nicht aus dem Beginn. Ein
 * Sprint, der über den Monatswechsel läuft, gehört damit in den Monat, in dem er
 * abgeschlossen wurde – dieselbe Regel wie bei der Stichtagszuordnung (FA-48
 * AK-6). Ist das Ende kein Datum (ein Git-Verweis), zählt der heutige Monat.
 *
 * **Der Ordner gehört nicht ins Git-Repository.** Die Berichte enthalten
 * GitHub-Kennungen und damit personenbezogene Daten; `.gitignore` schließt ihn
 * deshalb aus, und die Dateien gehören in den schulischen Speicher (DS-06).
 */
export async function ausgabeZiel(skriptUrl, dateiname, bis) {
  const monat = /^\d{4}-\d{2}-\d{2}$/.test(String(bis))
    ? String(bis).slice(0, 7)
    : new Date().toISOString().slice(0, 7);
  const ordner = join(dirname(fileURLToPath(skriptUrl)), AUSGABEORDNER, monat);
  await mkdir(ordner, { recursive: true });
  return join(ordner, dateiname);
}

/** Aus `eigentuemer/name` oder einem Pfad einen Dateinamensbestandteil machen. */
export function kurzname(wert) {
  const teil = String(wert).replace(/[\\/]+$/, '').split(/[\\/]/).pop() || 'repo';
  return teil.replace(/[^\w.-]+/g, '-');
}

/**
 * Die Teams mit Repository aus einer Sicherungsdatei der Anwendung.
 *
 * Damit muss die Adresse nur an **einer** Stelle gepflegt werden: in der
 * Anwendung, bei „Klassen & Teams" (FA-81 AK-3). Die Skripte lesen sie von dort,
 * statt sie im Aufruf zu wiederholen – eine zweite Liste wäre eine zweite
 * Wahrheit.
 *
 * Gelesen wird **nur** Name, Repository und Kennungszuordnung. Noten, Punkte und
 * Notizen bleiben unangetastet; sie gehen keinen Skriptlauf etwas an.
 */
export async function teamsAusBestand(pfad, klassenname = '') {
  let bestand;
  try {
    bestand = JSON.parse(await readFile(pfad, 'utf8'));
  } catch (fehler) {
    abbrechen(`Sicherungsdatei nicht lesbar: ${pfad}\n${fehler.message}`);
  }
  const klassen = bestand.klassen ?? [];
  const gesucht = klassenname
    ? klassen.filter((k) => k.name.toLowerCase() === klassenname.toLowerCase())
    : klassen;
  if (klassenname && gesucht.length === 0) {
    abbrechen(`Keine Klasse „${klassenname}" im Bestand. Vorhanden: ${klassen.map((k) => k.name).join(', ') || 'keine'}`);
  }
  const ids = new Set(gesucht.map((k) => k.id));
  const personen = new Map((bestand.personen ?? []).map((pe) => [pe.id, pe.name]));
  return (bestand.teams ?? [])
    .filter((team) => ids.has(team.klasseId) && String(team.repository ?? '').trim())
    .map((team) => ({
      name: team.name,
      klasse: klassen.find((k) => k.id === team.klasseId)?.name ?? '',
      repository: repoKuerzel(team.repository),
      // Kennung → Name, damit der Bericht sagen kann, welche Kennung zu niemandem gehört.
      kennungen: Object.fromEntries(
        Object.entries(team.kennungen ?? {}).map(([kennung, personId]) => [
          kennung,
          personen.get(personId) ?? '(unbekannte Person)',
        ]),
      ),
    }));
}
