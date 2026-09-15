#!/usr/bin/env node
/**
 * Kennzahlen zur Zusammenarbeit eines Teams abfragen (FA-81).
 *
 * **Dieses Skript ist der Grund, warum die Anwendung kein Netzwerk braucht.**
 * Es fragt über die GitHub-CLI (`gh`) ab und schreibt eine Datei; die
 * Anwendung liest sie ein. Damit bleiben ADR-001, NFA-03 und DS-02 unverändert
 * gültig, und es liegt kein Zugriffstoken im Browserspeicher eines
 * Lehrergeräts (FA-81 AK-1).
 *
 * Vier Größen, alle auf Teamebene und alle als Verteilung – nie eine
 * Leistungszahl je Person (AK-2):
 *   1. Anteil je Kennung an den Beiträgen des Zeitraums
 *   2. wer wessen Pull Requests begutachtet hat
 *   3. Anteil der Änderungen über Pull Requests mit Review
 *   4. Beiträge je Tag
 *
 * Es liest **keine Inhalte** (AK-10): keine Quelltexte, keine Commit-Texte,
 * keine Kommentartexte. Es zählt Ereignisse und Beziehungen.
 *
 *   node scripts/github-auswertung.mjs --repo htl/projekt-kepler \
 *     --von 2026-10-03 --bis 2026-10-17 [--aus kepler-s2.json]
 *
 * Voraussetzung: `gh auth login` ist erledigt und das Konto darf das
 * Repository lesen.
 */

import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import {
  abbrechen,
  ausgabeZiel,
  kurzname,
  parameter,
  repoKuerzel,
  zeitraumPruefen,
} from './hilfen.mjs';

const ausfuehren = promisify(execFile);

/**
 * Eine GitHub-API-Abfrage über `gh`.
 *
 * `--paginate` holt alle Seiten; ohne das fehlten ab 30 Einträgen Daten, und
 * zwar unbemerkt – das ist die Art Fehler, die eine Auswertung still verfälscht.
 */
async function api(pfad) {
  try {
    const { stdout } = await ausfuehren('gh', ['api', '--paginate', pfad], {
      maxBuffer: 32 * 1024 * 1024,
    });
    // `--paginate` hängt bei Listen mehrere JSON-Dokumente aneinander.
    const teile = stdout.replace(/\]\s*\[/g, ',').trim();
    return teile === '' ? [] : JSON.parse(teile);
  } catch (fehler) {
    if (fehler.code === 'ENOENT') {
      abbrechen(
        'Die GitHub-CLI `gh` ist nicht installiert oder nicht im Pfad.\n' +
          'Sie ist die einzige Voraussetzung dieses Skripts: https://cli.github.com',
      );
    }
    abbrechen(`Abfrage fehlgeschlagen: ${pfad}\n${fehler.stderr?.trim() ?? fehler.message}`);
  }
  return [];
}

/** Der Tag eines Zeitstempels, in Ortszeit – ein Schultag ist ein Tag vor Ort. */
function tagVon(zeitstempel) {
  const tag = new Date(zeitstempel);
  const zwei = (n) => String(n).padStart(2, '0');
  return `${tag.getFullYear()}-${zwei(tag.getMonth() + 1)}-${zwei(tag.getDate())}`;
}

async function main() {
  const p = parameter(process.argv.slice(2));
  const repo = p.repo ? repoKuerzel(p.repo) : '';
  const von = p.von;
  const bis = p.bis;
  if (!repo || !von || !bis) {
    abbrechen(
      'Aufruf: node scripts/github-auswertung.mjs --repo eigentuemer/name --von JJJJ-MM-TT --bis JJJJ-MM-TT [--aus datei.json]',
    );
  }

  zeitraumPruefen(String(von), String(bis));

  // Der Zeitraum ist einschließlich beider Tage: Endet ein Sprint am 17.,
  // gehört der 17. dazu.
  const seit = `${von}T00:00:00Z`;
  const bisEinschliesslich = `${bis}T23:59:59Z`;

  const commits = await api(
    `repos/${repo}/commits?since=${seit}&until=${bisEinschliesslich}&per_page=100`,
  );

  /** Beiträge je Kennung und je Tag. */
  const jeKennung = new Map();
  const jeTag = {};
  const ohneKonto = new Set();
  for (const commit of commits) {
    const kennung = commit.author?.login;
    if (kennung) jeKennung.set(kennung, (jeKennung.get(kennung) ?? 0) + 1);
    // Ein Commit ohne verknüpftes Konto lässt sich niemandem zuordnen. Er wird
    // genannt und nicht stillschweigend weggelassen (AK-3).
    else ohneKonto.add(commit.commit?.author?.name ?? 'ohne Konto');
    const tag = tagVon(commit.commit?.author?.date ?? seit);
    jeTag[tag] = (jeTag[tag] ?? 0) + 1;
  }

  const gesamt = [...jeKennung.values()].reduce((a, b) => a + b, 0);
  const anteile = {};
  for (const [kennung, anzahl] of jeKennung) {
    anteile[kennung] = gesamt > 0 ? (100 * anzahl) / gesamt : 0;
  }

  // Pull Requests, die in diesem Zeitraum zusammengeführt wurden.
  const pulls = await api(`repos/${repo}/pulls?state=closed&per_page=100`);
  const zusammengefuehrt = pulls.filter(
    (pr) => pr.merged_at && pr.merged_at >= seit && pr.merged_at <= bisEinschliesslich,
  );

  const reviewKanten = new Map();
  let ueberPr = 0;
  for (const pr of zusammengefuehrt) {
    const prCommits = await api(`repos/${repo}/pulls/${pr.number}/commits?per_page=100`);
    ueberPr += prCommits.length;

    const reviews = await api(`repos/${repo}/pulls/${pr.number}/reviews?per_page=100`);
    const autor = pr.user?.login ?? 'unbekannt';
    for (const review of reviews) {
      const von = review.user?.login;
      // Eine Selbstbegutachtung ist keine Zusammenarbeit.
      if (!von || von === autor) continue;
      const schluessel = `${von}\u0000${autor}`;
      reviewKanten.set(schluessel, (reviewKanten.get(schluessel) ?? 0) + 1);
    }
  }

  // Alles, was nicht über einen Pull Request kam, ging direkt auf den
  // Hauptzweig. Bei Squash-Merges zählt der Zusammenführungs-Commit mit; die
  // Größe ist ein Anhaltspunkt und keine Buchhaltung.
  const direktePushes = Math.max(0, commits.length - ueberPr);
  const prAnteil =
    commits.length > 0 ? (100 * Math.min(ueberPr, commits.length)) / commits.length : 0;

  const auswertung = {
    standAm: new Date().toISOString(),
    von,
    bis,
    anteile,
    reviews: [...reviewKanten].map(([schluessel, anzahl]) => {
      const [vonKennung, anKennung] = schluessel.split('\u0000');
      return { von: vonKennung, an: anKennung, anzahl };
    }),
    prAnteil,
    direktePushes,
    jeTag,
    nichtZugeordnet: [...ohneKonto],
  };

  const ziel =
    typeof p.aus === 'string'
      ? p.aus
      : await ausgabeZiel(import.meta.url, `auswertung-${kurzname(repo)}-${von}-bis-${bis}.json`, bis);
  await writeFile(ziel, `${JSON.stringify(auswertung, null, 2)}\n`, 'utf8');

  console.log(`Geschrieben: ${ziel}`);
  console.log(`  Commits im Zeitraum: ${commits.length}`);
  console.log(`  Kennungen: ${Object.keys(anteile).length}`);
  console.log(`  Pull Requests zusammengeführt: ${zusammengefuehrt.length}`);
  console.log(`  Anteil über Pull Requests: ${prAnteil.toFixed(0)} %`);
  console.log(`  Reviews: ${auswertung.reviews.length} Beziehungen`);
  if (auswertung.nichtZugeordnet.length > 0) {
    console.log(`  Ohne GitHub-Konto: ${auswertung.nichtZugeordnet.length}`);
  }
  console.log('\nDie Datei wird in der Sprintreview-Sicht eingelesen.');
}

await main();
