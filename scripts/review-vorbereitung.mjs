#!/usr/bin/env node
/**
 * Reviewzettel für ein Teamrepository erzeugen (docs/zusammenarbeit-mit-ki.md, Kap. 6.5).
 *
 * **Es bewertet nicht.** Es bereitet das Sprintreview vor: Was hat sich geändert,
 * welches Akzeptanzkriterium ist ohne Test, wo wurde verdoppelt, und welche drei
 * Fragen lassen sich mit Fundstelle stellen. Das Urteil bleibt bei der Lehrkraft
 * (G9); der Zettel ist ein Vorschlag wie jeder andere.
 *
 * **Die KI sieht Code, nicht Leute.** In den Prompt geht der Diff; Commit-Autoren
 * und Kennungen bleiben draußen, E-Mail-Adressen werden entfernt. Wer welchen
 * Beitrag geleistet hat, steht in der Anwendung (FA-81 AK-3) und bleibt auf dem
 * Gerät. Mit `--mit-verlauf` kommt eine Commit-Liste dazu – dann mit
 * **Pseudonymen** (A, B, C); die Zuordnung steht nur im Zettel, nie im Prompt.
 *
 * Läuft außerhalb der Anwendung, wie `github-auswertung.mjs`: ADR-001, NFA-03 und
 * DS-02 bleiben unberührt. Der Diff geht allerdings an den Anbieter des gewählten
 * Werkzeugs – bei Firmencode gehört das in die Auftragsvereinbarung (Kap. 11.2).
 *
 *   node scripts/review-vorbereitung.mjs --repo ../projekt-kepler \
 *     --von 2026-10-03 --bis 2026-10-17 --ziel "Buchungsmodul mit Storno" \
 *     [--kriterien ak-fa12.md] [--werkzeug "claude -p"] [--aus zettel.md]
 *
 * Ohne Werkzeug oder mit `--nur-prompt` wird nur der Prompt geschrieben. Damit
 * funktioniert das Skript auch ohne jeden Zugang: Text einfügen, Antwort
 * zurückkopieren.
 */

import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import {
  MAX_ZEILEN,
  abbrechen,
  anonymisieren,
  ausgabeZiel,
  kurzname,
  parameter,
} from './hilfen.mjs';

const ausfuehren = promisify(execFile);

/**
 * Der leere Git-Baum. Gegen ihn wird verglichen, wenn es vor dem Sprintbeginn
 * noch keinen Commit gibt – dieser Hash ist in Git fest verdrahtet.
 */
export const LEERER_BAUM = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

/** Was nie in einen Diff zur Beurteilung gehört: erzeugt, gesperrt oder binär. */
const AUSGENOMMEN = [
  ':(exclude)package-lock.json',
  ':(exclude)pnpm-lock.yaml',
  ':(exclude)yarn.lock',
  ':(exclude)*.min.js',
  ':(exclude)*.map',
  ':(exclude)dist/**',
  ':(exclude)build/**',
  ':(exclude)coverage/**',
  ':(exclude)node_modules/**',
  ':(exclude)*.png',
  ':(exclude)*.jpg',
  ':(exclude)*.pdf',
  ':(exclude)*.zip',
];

/** Ein Git-Aufruf im Zielrepository. */
async function git(pfad, args) {
  try {
    const { stdout } = await ausfuehren('git', ['-C', pfad, ...args], {
      maxBuffer: 64 * 1024 * 1024,
    });
    return stdout;
  } catch (fehler) {
    if (fehler.code === 'ENOENT') abbrechen('Git ist nicht installiert oder nicht im Pfad.');
    abbrechen(`Git-Aufruf fehlgeschlagen: git ${args.join(' ')}\n${fehler.stderr?.trim() ?? fehler.message}`);
    return '';
  }
}

/**
 * Ein Datum in einen Commit umsetzen – der letzte Commit bis einschließlich
 * dieses Tages.
 *
 * Sprintgrenzen sind in diesem Projekt Daten und keine Tags (FA-66). Wer hier
 * einen Tag erwartet, müsste ihn erst anlegen, und das passiert im Unterricht
 * nicht.
 */
async function alsCommit(pfad, wert, zweig, erlaubeLeer = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(wert)) return wert;
  const stdout = await git(pfad, ['rev-list', '-1', `--before=${wert}T23:59:59`, zweig]);
  const commit = stdout.trim();
  if (commit) return commit;
  // Der erste Sprint hat keinen Vorzustand: Vor seinem Beginn liegt kein Commit.
  // Das ist der Normalfall und kein Fehler – verglichen wird dann mit dem leeren
  // Baum, also „alles neu". Nur die obere Grenze muss es wirklich geben.
  if (erlaubeLeer) {
    console.log(`Vor ${wert} liegt kein Commit – verglichen wird mit dem leeren Stand (erster Sprint).`);
    return LEERER_BAUM;
  }
  abbrechen(`Für ${wert} gibt es in ${zweig} keinen Commit – anderes Datum oder Zweig wählen.`);
  return '';
}

/** Der Prompt. Für alle Teams derselbe – das ist der halbe Zweck (R-14). */
function prompt({ ziel, kriterien, umfang, diff, verlauf, gekuerzt, maxZeilen }) {
  const teile = [];
  teile.push(
    'Du bereitest ein Sprintreview in einer österreichischen HTL vor. Die Lehrkraft führt das',
    'Gespräch, nicht du. Deine Aufgabe ist es, ihr Fragen mit Fundstelle zu liefern.',
    '',
    'Halte dich streng an diese Grenzen:',
    '- **Keine Bewertung.** Keine Noten, keine Punkte, keine Prozentwerte, kein „gut" oder',
    '  „schlecht" über Personen. Du beurteilst niemanden.',
    '- Im Diff stehen keine Namen. Erfinde keine und ordne nichts einer Person zu.',
    '- Was aus dem Diff nicht hervorgeht, sagst du ausdrücklich. Keine Vermutung als Feststellung.',
    '- Antworte auf Deutsch, knapp, ohne Einleitung.',
    '',
  );
  if (ziel) teile.push(`Sprintziel des Teams: ${ziel}`, '');
  if (kriterien) {
    teile.push('Akzeptanzkriterien, gegen die geprüft wird:', '', kriterien.trim(), '');
  }
  teile.push('Umfang der Änderung:', '', umfang.trim(), '');
  if (verlauf) teile.push('Commits (Beitragende als Pseudonyme A, B, C …):', '', verlauf.trim(), '');
  teile.push(
    'Gib genau diese vier Abschnitte aus:',
    '',
    '## Was sich geändert hat',
    'Drei Sätze, fachlich – nicht „Dateien geändert", sondern was die Anwendung jetzt kann.',
    '',
    '## Akzeptanzkriterien ohne Test',
    kriterien
      ? 'Je Kriterium: durch einen Test abgedeckt, teilweise, oder nicht – mit dem Testnamen, wenn es einen gibt. Steht kein Test im Diff, sage das.'
      : 'Es wurden keine Akzeptanzkriterien übergeben. Schreibe genau das hin und nenne stattdessen, welche der geänderten Stellen ohne Test geblieben sind.',
    '',
    '## Verdoppelt statt wiederverwendet',
    'Stellen, an denen etwas neu geschrieben wurde, das im Diff schon vorkommt oder offensichtlich vorhanden war. Mit Datei und Zeile. Findest du nichts, schreibe „nichts aufgefallen".',
    '',
    '## Drei Fragen für das Review',
    'Genau drei. Jede mit Datei und Zeile, jede so gestellt, dass sie nur beantwortbar ist, wenn die Person die Stelle versteht. Keine Ja-Nein-Fragen, keine Wissensfragen – Fragen zu *dieser* Änderung.',
    '',
  );
  if (gekuerzt) {
    teile.push(
      `Hinweis: Der Diff wurde bei ${maxZeilen} Zeilen gekürzt. Sage im ersten Abschnitt, dass du nur einen Teil gesehen hast.`,
      '',
    );
  }
  teile.push('--- Diff ---', '', diff);
  return teile.join('\n');
}

/** Das Werkzeug aufrufen, Prompt über die Standardeingabe. */
async function fragen(befehl, text) {
  const teile = befehl.trim().split(/\s+/);
  const kind = execFile(teile[0], teile.slice(1), { maxBuffer: 32 * 1024 * 1024 });
  let aus = '';
  let fehler = '';
  kind.stdout.on('data', (d) => (aus += d));
  kind.stderr.on('data', (d) => (fehler += d));
  kind.stdin.end(text);
  const ende = await new Promise((loesen) => kind.on('close', loesen));
  if (ende !== 0) {
    abbrechen(
      `Das Werkzeug „${befehl}" endete mit Code ${ende}.\n${fehler.trim()}\n\n` +
        'Mit --nur-prompt wird nur der Prompt geschrieben; dann geht es auch von Hand.',
    );
  }
  return aus;
}

async function hauptlauf() {
  const p = parameter(process.argv.slice(2));
  if (!p.repo || !p.von || !p.bis) {
    abbrechen(
      'Aufruf: node scripts/review-vorbereitung.mjs --repo <pfad> --von <ref|JJJJ-MM-TT> --bis <ref|JJJJ-MM-TT>\n' +
        '        [--ziel "Sprintziel"] [--kriterien datei.md] [--zweig main] [--mit-verlauf]\n' +
        '        [--werkzeug "claude -p"] [--nur-prompt] [--max-zeilen 4000] [--aus zettel.md]',
    );
  }

  const repo = String(p.repo);
  const zweig = typeof p.zweig === 'string' ? p.zweig : 'HEAD';
  const maxZeilen = Number(p['max-zeilen']) > 0 ? Number(p['max-zeilen']) : MAX_ZEILEN;

  await git(repo, ['rev-parse', '--git-dir']);
  const von = await alsCommit(repo, String(p.von), zweig, true);
  const bis = await alsCommit(repo, String(p.bis), zweig);

  const umfang = await git(repo, ['diff', '--stat', `${von}..${bis}`, '--', '.', ...AUSGENOMMEN]);
  if (!umfang.trim()) abbrechen('Zwischen den beiden Ständen liegt keine Änderung an Quelldateien.');

  const rohdiff = await git(repo, [
    'diff',
    '--unified=3',
    '--no-color',
    `${von}..${bis}`,
    '--',
    '.',
    ...AUSGENOMMEN,
  ]);

  const zeilen = anonymisieren(rohdiff).split('\n');
  const gekuerzt = zeilen.length > maxZeilen;
  const diff = zeilen.slice(0, maxZeilen).join('\n');

  // Verlauf nur auf Verlangen, und dann mit Pseudonymen. Die Zuordnung bleibt hier.
  let verlauf = '';
  const karte = new Map();
  if (p['mit-verlauf']) {
    const bereich = von === LEERER_BAUM ? bis : `${von}..${bis}`;
    const roh = await git(repo, ['log', '--no-merges', '--format=%an\t%s', bereich]);
    const buchstaben = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    verlauf = roh
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((zeile) => {
        const [autor, ...rest] = zeile.split('\t');
        if (!karte.has(autor)) karte.set(autor, buchstaben[karte.size] ?? '?');
        return `${karte.get(autor)}: ${rest.join(' ')}`;
      })
      .join('\n');
  }

  const kriterien = typeof p.kriterien === 'string' ? await readFile(p.kriterien, 'utf8') : '';
  const text = prompt({
    ziel: typeof p.ziel === 'string' ? p.ziel : '',
    kriterien,
    umfang,
    diff,
    verlauf,
    gekuerzt,
    maxZeilen,
  });

  const heute = new Date().toISOString().slice(0, 10);
  const name = kurzname(repo);

  if (p['nur-prompt'] || !p.werkzeug) {
    const ziel =
      typeof p.aus === 'string'
        ? p.aus
        : await ausgabeZiel(import.meta.url, `prompt-${name}-${heute}.md`, p.bis);
    await writeFile(ziel, text, 'utf8');
    console.log(`Prompt geschrieben: ${ziel} (${zeilen.length} Diffzeilen${gekuerzt ? `, gekürzt auf ${maxZeilen}` : ''})`);
    console.log('Einfügen, Antwort zurückkopieren – oder mit --werkzeug "claude -p" direkt fragen.');
    return;
  }

  const antwort = await fragen(String(p.werkzeug), text);

  const kopf = [
    `# Reviewzettel ${name}`,
    '',
    '| | |',
    '|---|---|',
    `| **Repository** | \`${repo}\` |`,
    `| **Stand von** | \`${von.slice(0, 12)}\` (${p.von}) |`,
    `| **Stand bis** | \`${bis.slice(0, 12)}\` (${p.bis}) |`,
    `| **Erzeugt am** | ${heute} |`,
    `| **Werkzeug** | \`${p.werkzeug}\` |`,
    `| **Diffzeilen** | ${zeilen.length}${gekuerzt ? ` (gekürzt auf ${maxZeilen})` : ''} |`,
    '',
    '> **Vorschlag, keine Feststellung.** Dieser Zettel bereitet das Gespräch vor. Er enthält',
    '> keine Bewertung und geht in keine Note ein (G9). Was gilt, entscheidet das Review.',
    '',
  ];
  if (karte.size > 0) {
    kopf.push(
      '**Pseudonyme im Verlauf** – diese Zuordnung stand *nicht* im Prompt:',
      '',
      ...[...karte].map(([autor, kuerzel]) => `- ${kuerzel} = ${autor}`),
      '',
      '> Diese Datei enthält damit Namen. Sie gehört in den schulischen Speicher,',
      '> nicht in eine private Cloud (DS-06).',
      '',
    );
  }
  kopf.push('---', '');

  const ziel =
    typeof p.aus === 'string'
      ? p.aus
      : await ausgabeZiel(import.meta.url, `reviewzettel-${name}-${heute}.md`, p.bis);
  await writeFile(ziel, `${kopf.join('\n')}${antwort.trim()}\n`, 'utf8');
  console.log(`Reviewzettel geschrieben: ${ziel}`);
}

// Nur ausführen, wenn dieses Skript selbst aufgerufen wurde – es wird auch
// importiert. Die gemeinsamen Hilfen liegen in `hilfen.mjs`.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  hauptlauf();
}
