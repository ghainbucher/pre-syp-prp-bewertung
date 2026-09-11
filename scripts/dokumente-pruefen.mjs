#!/usr/bin/env node
/**
 * Prüft die Aktualität und die Zusammenhänge der geführten Dokumente (RB-10).
 *
 * Harte Prüfungen (brechen den Lauf) betreffen gerissene Ketten – also
 * inhaltliche Fehler:
 *   H1  Jede umgesetzte Anforderung wird von mindestens einem Test genannt.
 *   H2  Jede Anforderung nennt einen Stakeholder.
 *   H3  Jede funktionale Anforderung nennt einen Nutzen („damit …“),
 *       jede nicht-funktionale und jede Datenschutzanforderung ein Prüfverfahren.
 *       Ein Prüfverfahren, das kein benannter Test ist (Sichtprüfung, Pipeline,
 *       Abdeckungsbericht), befreit von H1 – aber es muss dastehen.
 *   H4  Jedes Risiko nennt mindestens eine Maßnahme mit Verweis.
 *
 * Weiche Prüfungen (nur Warnung) betreffen Fristen:
 *   W1  Dokument steht auf einem älteren Softwarestand als package.json.
 *   W2  „Zuletzt geprüft“ liegt länger zurück als ein Sprint.
 *
 * Aufruf:  node scripts/dokumente-pruefen.mjs [--nur-warnen]
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath statt .pathname: Unter Windows liefert .pathname '/C:/...',
// was join() zu 'C:\\C:\\...' verkettet.
const WURZEL = fileURLToPath(new URL('..', import.meta.url));
const SPRINTLAENGE_TAGE = 21;
const NUR_WARNEN = process.argv.includes('--nur-warnen');

/** Dokumente mit Aktualitätskopf. */
const GEFUEHRTE_DOKUMENTE = [
  'docs/fachkonzept-unterricht.md',
  'docs/stakeholder.md',
  'docs/product-goal.md',
  'docs/anforderungen.md',
  'docs/solution-design.md',
  'docs/risiken.md',
  'docs/anforderungs-und-loesungsmanagement.md',
  'docs/testfaelle-notenfindung.md',
];

const fehler = [];
const warnungen = [];

const meldeFehler = (text) => fehler.push(text);
const meldeWarnung = (text) => warnungen.push(text);

function lies(pfad) {
  return readFileSync(join(WURZEL, pfad), 'utf8');
}

function dateienUnter(verzeichnis, endung) {
  const treffer = [];
  const gehe = (ort) => {
    for (const eintrag of readdirSync(ort)) {
      if (eintrag === 'node_modules' || eintrag.startsWith('.')) continue;
      const voll = join(ort, eintrag);
      if (statSync(voll).isDirectory()) gehe(voll);
      else if (voll.endsWith(endung)) treffer.push(voll);
    }
  };
  gehe(join(WURZEL, verzeichnis));
  return treffer;
}

/* -------------------------------------------------------------------------- */
/* Anforderungen einlesen                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Zerlegt das Anforderungsdokument in Blöcke.
 * Eine Anforderung beginnt mit `### FA-32 Titel` und endet vor der nächsten
 * Überschrift gleicher oder höherer Ebene.
 */
function leseAnforderungen(text) {
  const zeilen = text.split('\n');
  const anforderungen = [];
  let aktuell = null;

  for (const zeile of zeilen) {
    const kopf = /^### ((?:FA|NFA|DS)-\d+)\s+(.*)$/.exec(zeile);
    if (kopf) {
      if (aktuell) anforderungen.push(aktuell);
      aktuell = { id: kopf[1], titel: kopf[2].trim(), zeilen: [] };
      continue;
    }
    if (/^#{1,3} /.test(zeile) && aktuell) {
      anforderungen.push(aktuell);
      aktuell = null;
      continue;
    }
    if (aktuell) aktuell.zeilen.push(zeile);
  }
  if (aktuell) anforderungen.push(aktuell);

  return anforderungen.map((a) => {
    const block = a.zeilen.join('\n');
    const meta = /^`([^`]+)`\s*·\s*([^·]+)·\s*([^·]+)·\s*(.+)$/m.exec(block);
    return {
      ...a,
      block,
      prioritaet: meta ? meta[1].trim() : null,
      release: meta ? meta[2].trim() : null,
      stakeholder: [...block.matchAll(/SH-\d+/g)].map((m) => m[0]),
      status: meta ? meta[4].trim() : null,
      hatNutzen: /^damit /m.test(block),
      hatPruefverfahren: /\*\*Prüfung:\*\*/.test(block),
      andersGeprueft: /\*\*Prüfung:\*\*.*(manuell|Zeitmessung|Sichtprüfung|Kontrastwerkzeug|Offline|Matrix|Abdeckungsbericht|Branch Protection|Größenprüfung|Durchsicht)/i.test(block),
    };
  });
}

/* -------------------------------------------------------------------------- */
/* IDs aus Testnamen sammeln                                                   */
/* -------------------------------------------------------------------------- */

/** Erkennt einzelne IDs und Bereiche der Form „FA-01 bis FA-04". */
function idsAusText(text) {
  const gefunden = new Set();

  for (const treffer of text.matchAll(/\b(FA|NFA|DS)-(\d+)\s+bis\s+(?:FA|NFA|DS)-(\d+)/g)) {
    const [, praefix, von, bis] = treffer;
    for (let n = Number(von); n <= Number(bis); n += 1) {
      gefunden.add(`${praefix}-${String(n).padStart(2, '0')}`);
    }
  }
  for (const treffer of text.matchAll(/\b((?:FA|NFA|DS)-\d+)/g)) {
    gefunden.add(treffer[1]);
  }
  return gefunden;
}

function idsAusTests() {
  const dateien = [...dateienUnter('src', '.test.ts'), ...dateienUnter('e2e', '.spec.ts')];
  const gefunden = new Map(); // ID -> Dateiliste
  for (const datei of dateien) {
    const inhalt = readFileSync(datei, 'utf8');
    // Nur Testbeschreibungen betrachten, nicht beliebige Kommentare.
    const beschreibungen = [...inhalt.matchAll(/\b(?:describe|it|test)\s*\(\s*(['"`])([\s\S]*?)\1/g)]
      .map((m) => m[2])
      .join('\n');
    for (const id of idsAusText(beschreibungen)) {
      if (!gefunden.has(id)) gefunden.set(id, []);
      gefunden.get(id).push(relative(WURZEL, datei));
    }
  }
  return gefunden;
}

/* -------------------------------------------------------------------------- */
/* Prüfungen                                                                   */
/* -------------------------------------------------------------------------- */

function pruefeAnforderungen(anforderungen, testIds) {
  for (const a of anforderungen) {
    if (!a.status) {
      meldeFehler(`${a.id}: Kopfzeile fehlt oder ist unlesbar (erwartet: \`Priorität\` · Release · SH-x · Status)`);
      continue;
    }

    // H2 Stakeholder
    if (a.stakeholder.length === 0) {
      meldeFehler(`${a.id}: nennt keinen Stakeholder`);
    }

    // H3 Nutzen bzw. Prüfverfahren
    if (a.id.startsWith('FA-')) {
      if (!a.hatNutzen) meldeFehler(`${a.id}: Satzschablone ohne „damit …“ – der Nutzen fehlt`);
    } else if (!a.hatPruefverfahren) {
      meldeFehler(`${a.id}: nennt kein Prüfverfahren`);
    }

    // H1 Test vorhanden
    const istUmgesetzt = a.status.toLowerCase().startsWith('umgesetzt');
    if (istUmgesetzt && !testIds.has(a.id) && !a.andersGeprueft) {
      meldeFehler(`${a.id} ist als umgesetzt geführt, wird aber von keinem Test genannt`);
    }
  }
}

function pruefeRisiken(text) {
  const abschnitte = text.split(/^### (R-\d+)/m);
  // abschnitte: [vorspann, id, block, id, block, ...]
  for (let i = 1; i < abschnitte.length; i += 2) {
    const id = abschnitte[i];
    const block = abschnitte[i + 1] ?? '';
    const verweise = block.match(/\b(?:FA|NFA|DS|RB|ADR|OP)-\w+/g) ?? [];
    if (verweise.length === 0) {
      meldeFehler(`${id}: keine Maßnahme mit Verweis auf eine Anforderung, Entscheidung oder einen offenen Punkt`);
    }
  }
}

function pruefeAktualitaet(paketVersion) {
  const heute = new Date();
  for (const pfad of GEFUEHRTE_DOKUMENTE) {
    let text;
    try {
      text = lies(pfad);
    } catch {
      meldeFehler(`${pfad}: Dokument fehlt, ist aber als geführtes Dokument gelistet`);
      continue;
    }

    const stand = /\|\s*\*\*Gültig für Softwarestand\*\*\s*\|\s*([^|]+)\|/.exec(text);
    const geprueft = /\|\s*\*\*Zuletzt geprüft\*\*\s*\|\s*([\d-]+)\s*\|/.exec(text);

    if (!stand || !geprueft) {
      meldeWarnung(`${pfad}: Aktualitätskopf unvollständig (Gültig für Softwarestand / Zuletzt geprüft)`);
      continue;
    }

    if (stand[1].trim() !== paketVersion) {
      meldeWarnung(`${pfad}: gültig für ${stand[1].trim()}, die Software steht auf ${paketVersion}`);
    }

    const tage = Math.floor((heute - new Date(geprueft[1])) / 86_400_000);
    if (tage > SPRINTLAENGE_TAGE) {
      meldeWarnung(`${pfad}: zuletzt vor ${tage} Tagen geprüft (mehr als ein Sprint)`);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Ausführung                                                                  */
/* -------------------------------------------------------------------------- */

const paket = JSON.parse(lies('package.json'));
const anforderungen = leseAnforderungen(lies('docs/anforderungen.md'));
const testIds = idsAusTests();

pruefeAnforderungen(anforderungen, testIds);
pruefeRisiken(lies('docs/risiken.md'));
pruefeAktualitaet(paket.version);

const umgesetzt = anforderungen.filter((a) => a.status?.toLowerCase().startsWith('umgesetzt'));
const mitTest = umgesetzt.filter((a) => testIds.has(a.id));

console.log('Dokumentenprüfung');
console.log('─'.repeat(60));
console.log(`Anforderungen gesamt      ${anforderungen.length}`);
console.log(`davon umgesetzt           ${umgesetzt.length}`);
console.log(`davon durch Tests belegt  ${mitTest.length}`);
console.log(`Softwarestand             ${paket.version}`);
console.log('');

if (warnungen.length > 0) {
  console.log(`Warnungen (${warnungen.length}):`);
  for (const w of warnungen) console.log(`  ~ ${w}`);
  console.log('');
}

if (fehler.length > 0) {
  console.log(`Fehler (${fehler.length}):`);
  for (const f of fehler) console.log(`  ✗ ${f}`);
  console.log('');
  if (!NUR_WARNEN) {
    console.log('Gerissene Ketten brechen den Lauf. Mit --nur-warnen lässt sich das umgehen.');
    process.exit(1);
  }
}

if (fehler.length === 0 && warnungen.length === 0) {
  console.log('Alle Ketten geschlossen, alle Dokumente aktuell.');
} else if (fehler.length === 0) {
  console.log('Keine gerissenen Ketten. Die Warnungen betreffen nur Fristen.');
}
