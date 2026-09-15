#!/usr/bin/env node
/**
 * Pull Requests eines Zeitraums im Nachhinein auswerten
 * (docs/zusammenarbeit-mit-ki.md, Kap. 6.5).
 *
 * **Zwei Teile, getrennt ausgewiesen.**
 *
 *   1. **Kennzahlen – ohne KI.** Zählbar und reproduzierbar: Gab es ein Review
 *      von einer anderen Person? Wie lange lag zwischen letztem Commit und
 *      Genehmigung? Wie groß war der Pull Request? Wurde nach der Genehmigung
 *      noch nachgeschoben? Wer hat wen begutachtet? Das gilt auch dann noch,
 *      wenn man der KI-Auswertung nicht glaubt – und es ist das, was im
 *      Widerspruchsfall zeigbar ist.
 *   2. **Vier Fragen je Pull Request – mit KI.** Erst danach, klar getrennt und
 *      als Vorschlag gekennzeichnet.
 *
 * **Kein Klon nötig:** `gh pr list` und `gh pr diff` holen Liste und Diff direkt,
 * mit der Anmeldung der Lehrkraft. Der Diff geht an den Anbieter des gewählten
 * Werkzeugs – bei Firmencode gehört das in die Auftragsvereinbarung (Kap. 11.2).
 * Ohne `--werkzeug` entstehen nur die Kennzahlen, und nichts verlässt den Rechner.
 *
 * **Personen erscheinen als Pseudonyme** (A, B, C). Die Zuordnung steht im
 * Bericht, nie im Prompt – wie bei `review-vorbereitung.mjs`.
 *
 * **Es bewertet nicht** (G9). Keine Note, keine Punkte, kein Urteil über Personen.
 *
 *   node scripts/pull-requests-auswerten.mjs --repo htl/projekt-kepler \
 *     --von 2026-10-03 --bis 2026-10-17 [--kriterien ak.md] \
 *     [--werkzeug "claude -p"] [--nur-prompt] [--aus bericht.md]
 *
 * Voraussetzung: `gh auth login` ist erledigt und das Konto darf das Repository
 * lesen.
 */

import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import {
  MAX_ZEILEN,
  abbrechen,
  anonymisieren,
  ausgabeZiel,
  kurzname,
  parameter,
  repoKuerzel,
  zeitraumPruefen,
} from './hilfen.mjs';

const ausfuehren = promisify(execFile);

/**
 * Ab wann eine Genehmigung als „ohne Lesezeit" gilt – Zeilen je Minute.
 *
 * Bewusst grob und bewusst nur ein **Hinweis**: 200 geänderte Zeilen in einer
 * Minute genehmigt heißt nicht, dass nicht gelesen wurde – vielleicht war es ein
 * Umbenennen. Es heißt, dass man fragen sollte.
 */
const ZEILEN_JE_MINUTE = 200;

async function gh(args) {
  try {
    const { stdout } = await ausfuehren('gh', args, { maxBuffer: 64 * 1024 * 1024 });
    return stdout;
  } catch (fehler) {
    if (fehler.code === 'ENOENT') {
      abbrechen(
        'Die GitHub-CLI `gh` ist nicht installiert oder nicht im Pfad.\n' +
          'Sie ist die Voraussetzung dieses Skripts: https://cli.github.com',
      );
    }
    abbrechen(`Abfrage fehlgeschlagen: gh ${args.join(' ')}\n${fehler.stderr?.trim() ?? fehler.message}`);
    return '';
  }
}

/** Minuten zwischen zwei ISO-Zeitpunkten, auf ganze Minuten. */
function minuten(frueher, spaeter) {
  if (!frueher || !spaeter) return null;
  return Math.max(0, Math.round((new Date(spaeter) - new Date(frueher)) / 60000));
}

/** Dauer in etwas Lesbares: „4 min", „3,5 h", „2 Tage". */
function dauer(min) {
  if (min === null) return '–';
  if (min < 90) return `${min} min`;
  if (min < 60 * 36) return `${(min / 60).toFixed(1).replace('.', ',')} h`;
  return `${Math.round(min / 1440)} Tage`;
}

/** Pseudonyme je Person, stabil in der Reihenfolge des ersten Auftretens. */
function pseudonyme() {
  const karte = new Map();
  const buchstaben = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return {
    karte,
    fuer(name) {
      if (!name) return '?';
      if (!karte.has(name)) karte.set(name, buchstaben[karte.size] ?? '?');
      return karte.get(name);
    },
  };
}

/**
 * Die Kennzahlen eines Pull Requests.
 *
 * `reviewDecision` allein genügt nicht: Es sagt, ob genehmigt wurde, aber nicht
 * von wem und wann. Eine Selbstgenehmigung und eine Genehmigung durch ein
 * anderes Teammitglied sind aber nicht dasselbe – deshalb die Einzelreviews.
 */
function kennzahlen(pr, namen) {
  const autor = pr.author?.login ?? '';
  const reviews = (pr.reviews ?? []).filter((r) => r.state !== 'COMMENTED');
  const fremde = reviews.filter((r) => (r.author?.login ?? '') !== autor);
  const genehmigungen = fremde.filter((r) => r.state === 'APPROVED');
  const erste = genehmigungen[0] ?? null;
  const selbst = reviews.some((r) => (r.author?.login ?? '') === autor && r.state === 'APPROVED');

  // Nach Datum sortieren statt auf die Reihenfolge der Antwort zu vertrauen.
  const commits = [...(pr.commits ?? [])].sort(
    (a, b) => new Date(a.committedDate) - new Date(b.committedDate),
  );
  const letzterCommit = commits.length > 0 ? commits[commits.length - 1].committedDate : null;
  // Nachschieben nach der Genehmigung: der Grund, warum „Genehmigungen verfallen
  // bei neuen Commits" die wichtigste der fünf Schutzeinstellungen ist (Kap. 6.4).
  const nachgeschoben = erste && letzterCommit ? new Date(letzterCommit) > new Date(erste.submittedAt) : false;

  const groesse = (pr.additions ?? 0) + (pr.deletions ?? 0);
  /*
   * Bezug für die Lesezeit ist der letzte Commit **vor** der Genehmigung – nicht
   * der letzte überhaupt. Sonst rechnet genau der Fall falsch, der am meisten
   * interessiert: Wurde nach der Genehmigung nachgeschoben, liegt der letzte
   * Commit *nach* ihr, die Spanne wird negativ und erschiene als „0 min" – also
   * als unauffällig. Gibt es keinen Commit vor der Genehmigung, zählt die
   * Eröffnung.
   */
  const davor = erste
    ? commits.filter((c) => new Date(c.committedDate) <= new Date(erste.submittedAt))
    : [];
  const bezug = davor.length > 0 ? davor[davor.length - 1].committedDate : pr.createdAt;
  const bisGenehmigung = erste ? minuten(bezug, erste.submittedAt) : null;
  // 0 Minuten heißt „sofort" und ist der auffälligste Fall, nicht der harmloseste.
  const tempo = bisGenehmigung !== null ? groesse / Math.max(1, bisGenehmigung) : null;

  return {
    nummer: pr.number,
    titel: pr.title,
    autor: namen.fuer(autor),
    groesse,
    dateien: pr.changedFiles ?? 0,
    reviewer: fremde.map((r) => namen.fuer(r.author?.login ?? '')),
    genehmigt: genehmigungen.length > 0,
    ohneFremdes: fremde.length === 0,
    selbstGenehmigt: selbst && genehmigungen.length === 0,
    bisGenehmigung,
    nachgeschoben,
    ohneLesezeit: tempo !== null && tempo > ZEILEN_JE_MINUTE,
    offeneDauer: minuten(pr.createdAt, pr.mergedAt ?? pr.closedAt),
  };
}

/** Der Prompt für **einen** Pull Request. Für alle derselbe (R-14). */
function prompt(k, kriterien, diff, gekuerzt, maxZeilen) {
  const teile = [
    'Du wertest einen bereits zusammengeführten Pull Request eines Schülerteams im Nachhinein aus.',
    'Die Lehrkraft beurteilt, nicht du. Du lieferst Fragen mit Fundstelle.',
    '',
    'Grenzen:',
    '- **Keine Bewertung.** Keine Noten, Punkte, Prozentwerte, kein Urteil über Personen.',
    '- Im Diff stehen keine Namen. Erfinde keine und ordne nichts einer Person zu.',
    '- Was aus dem Diff nicht hervorgeht, sagst du ausdrücklich.',
    '- Deutsch, knapp, ohne Einleitung.',
    '',
    `Pull Request #${k.nummer}: ${k.titel}`,
    `Umfang: ${k.groesse} geänderte Zeilen in ${k.dateien} Dateien.`,
    '',
  ];
  if (kriterien) teile.push('Akzeptanzkriterien des Sprints:', '', kriterien.trim(), '');
  teile.push(
    'Gib genau diese vier Abschnitte aus:',
    '',
    '### Was dieser Pull Request bewirkt',
    'Zwei Sätze, fachlich.',
    '',
    '### Ohne Test geblieben',
    kriterien
      ? 'Welche der genannten Akzeptanzkriterien berührt dieser Pull Request, und welche davon ohne Test? Nenne Testnamen, wenn es welche gibt.'
      : 'Welche geänderten Stellen sind ohne Test geblieben? Keine Kriterien übergeben – sage das.',
    '',
    '### Verdoppelt statt wiederverwendet',
    'Mit Datei und Zeile. Nichts gefunden: „nichts aufgefallen".',
    '',
    '### Eine Frage für das Review',
    'Genau eine, mit Datei und Zeile, nur beantwortbar, wenn die Person die Stelle versteht.',
    '',
  );
  if (gekuerzt) {
    teile.push(`Hinweis: Der Diff ist bei ${maxZeilen} Zeilen gekürzt – sage, dass du nur einen Teil gesehen hast.`, '');
  }
  teile.push('--- Diff ---', '', diff);
  return teile.join('\n');
}

async function fragen(befehl, text) {
  const teile = befehl.trim().split(/\s+/);
  const kind = execFile(teile[0], teile.slice(1), { maxBuffer: 32 * 1024 * 1024 });
  let aus = '';
  let fehler = '';
  kind.stdout.on('data', (d) => (aus += d));
  kind.stderr.on('data', (d) => (fehler += d));
  kind.stdin.end(text);
  const ende = await new Promise((loesen) => kind.on('close', loesen));
  if (ende !== 0) abbrechen(`Das Werkzeug „${befehl}" endete mit Code ${ende}.\n${fehler.trim()}`);
  return aus;
}

async function hauptlauf() {
  const p = parameter(process.argv.slice(2));
  if (!p.repo || !p.von || !p.bis) {
    abbrechen(
      'Aufruf: node scripts/pull-requests-auswerten.mjs --repo eigentuemer/name --von JJJJ-MM-TT --bis JJJJ-MM-TT\n' +
        '        [--kriterien datei.md] [--werkzeug "claude -p"] [--nur-prompt]\n' +
        '        [--zustand merged|closed|all] [--max-zeilen 4000] [--aus bericht.md]',
    );
  }

  const repo = repoKuerzel(p.repo);
  const von = String(p.von);
  const bis = String(p.bis);
  zeitraumPruefen(von, bis);
  const zustand = typeof p.zustand === 'string' ? p.zustand : 'merged';
  const maxZeilen = Number(p['max-zeilen']) > 0 ? Number(p['max-zeilen']) : MAX_ZEILEN;

  const liste = JSON.parse(
    await gh([
      'pr', 'list', '--repo', repo, '--state', zustand, '--limit', '200',
      '--json', 'number,title,author,createdAt,mergedAt,closedAt',
    ]),
  );

  // Zeitraum einschließlich beider Tage – wie in github-auswertung.mjs.
  const imZeitraum = liste.filter((pr) => {
    const tag = (pr.mergedAt ?? pr.closedAt ?? pr.createdAt).slice(0, 10);
    return tag >= von && tag <= bis;
  });
  if (imZeitraum.length === 0) abbrechen(`Im Zeitraum ${von} bis ${bis} gibt es keinen Pull Request (Zustand ${zustand}).`);

  const namen = pseudonyme();
  const zeilen = [];
  const prompts = [];
  const kriterien = typeof p.kriterien === 'string' ? await readFile(p.kriterien, 'utf8') : '';

  for (const kurz of imZeitraum) {
    // Einzelabfrage je Pull Request: `pr list` liefert weder Reviews noch Commits.
    const pr = JSON.parse(
      await gh([
        'pr', 'view', String(kurz.number), '--repo', repo,
        '--json', 'number,title,author,createdAt,mergedAt,closedAt,additions,deletions,changedFiles,reviews,commits',
      ]),
    );
    const k = kennzahlen(pr, namen);
    zeilen.push(k);

    if (p.werkzeug || p['nur-prompt']) {
      const roh = anonymisieren(await gh(['pr', 'diff', String(kurz.number), '--repo', repo]));
      const alle = roh.split('\n');
      const gekuerzt = alle.length > maxZeilen;
      prompts.push({ k, text: prompt(k, kriterien, alle.slice(0, maxZeilen).join('\n'), gekuerzt, maxZeilen) });
    }
  }

  /* ---------------------------------------------------------------- Bericht */

  const ohneReview = zeilen.filter((k) => k.ohneFremdes);
  const schnell = zeilen.filter((k) => k.ohneLesezeit);
  const nachher = zeilen.filter((k) => k.nachgeschoben);
  // Median wie in `domain/scoring.ts`: bei gerader Anzahl das Mittel der beiden
  // mittleren Werte. Zwei Stellen im Projekt dürfen nicht zwei Konventionen haben.
  const groessen = zeilen.map((k) => k.groesse).sort((a, b) => a - b);
  const mitte = Math.floor(groessen.length / 2);
  const mittlere =
    groessen.length === 0
      ? 0
      : groessen.length % 2 === 1
        ? groessen[mitte]
        : Math.round((groessen[mitte - 1] + groessen[mitte]) / 2);

  const bericht = [
    `# Pull Requests ${repo}`,
    '',
    '| | |',
    '|---|---|',
    `| **Zeitraum** | ${von} bis ${bis} (${zustand}) |`,
    `| **Pull Requests** | ${zeilen.length} |`,
    `| **Erzeugt am** | ${new Date().toISOString().slice(0, 10)} |`,
    `| **Quelle** | \`gh\`, ohne Klon |`,
    '',
    '> **Vorschlag, keine Feststellung.** Keine Bewertung, keine Note (G9). Die Kennzahlen',
    '> sind zählbar und reproduzierbar; der KI-Teil darunter ist es nicht.',
    '',
    '**Beteiligte** – diese Zuordnung stand *nicht* in einem Prompt:',
    '',
    ...[...namen.karte].map(([login, kuerzel]) => `- ${kuerzel} = \`${login}\``),
    '',
    '> Damit enthält diese Datei Kennungen. Sie gehört in den schulischen Speicher,',
    '> nicht in eine private Cloud (DS-06).',
    '',
    '---',
    '',
    '## 1 Kennzahlen (ohne KI)',
    '',
    '| PR | Autor | Zeilen | Dateien | Review von | bis Genehmigung | Auffällig |',
    '|---|---|---|---|---|---|---|',
    ...zeilen.map((k) => {
      const hinweise = [];
      if (k.ohneFremdes) hinweise.push('**kein fremdes Review**');
      if (k.selbstGenehmigt) hinweise.push('selbst genehmigt');
      if (k.ohneLesezeit) hinweise.push(`${Math.round(k.groesse / Math.max(1, k.bisGenehmigung))} Zeilen/min`);
      if (k.nachgeschoben) hinweise.push('nach Genehmigung nachgeschoben');
      return `| #${k.nummer} | ${k.autor} | ${k.groesse} | ${k.dateien} | ${k.reviewer.join(', ') || '–'} | ${dauer(k.bisGenehmigung)} | ${hinweise.join(' · ') || '–'} |`;
    }),
    '',
    `- **Ohne Review einer anderen Person:** ${ohneReview.length} von ${zeilen.length}${ohneReview.length > 0 ? ` (${ohneReview.map((k) => `#${k.nummer}`).join(', ')})` : ''}`,
    `- **Genehmigt schneller als ${ZEILEN_JE_MINUTE} Zeilen je Minute:** ${schnell.length}${schnell.length > 0 ? ` (${schnell.map((k) => `#${k.nummer}`).join(', ')})` : ''} – ein Hinweis, keine Feststellung: Umbenennungen lesen sich schnell`,
    `- **Nach der Genehmigung nachgeschoben:** ${nachher.length}${nachher.length > 0 ? ` (${nachher.map((k) => `#${k.nummer}`).join(', ')})` : ''}`,
    `- **Mittlere Größe:** ${mittlere} geänderte Zeilen`,
    '',
  ];

  if (p['nur-prompt']) {
    const ziel =
      typeof p.aus === 'string'
        ? p.aus
        : await ausgabeZiel(import.meta.url, `prompts-${kurzname(repo)}-${von}-bis-${bis}.md`, bis);
    await writeFile(
      ziel,
      `${bericht.join('\n')}\n---\n\n## 2 Prompts (einzeln einfügen)\n\n` +
        prompts.map((e) => `### Prompt für #${e.k.nummer}\n\n~~~\n${e.text}\n~~~\n`).join('\n'),
      'utf8',
    );
    console.log(`Kennzahlen und ${prompts.length} Prompts geschrieben: ${ziel}`);
    return;
  }

  if (p.werkzeug) {
    bericht.push('---', '', '## 2 Auswertung je Pull Request (mit KI – Vorschlag)', '');
    for (const e of prompts) {
      console.log(`… frage zu #${e.k.nummer}`);
      bericht.push(`## Pull Request #${e.k.nummer}: ${e.k.titel}`, '', (await fragen(String(p.werkzeug), e.text)).trim(), '');
    }
  } else {
    bericht.push('---', '', '## 2 Auswertung je Pull Request', '', 'Kein Werkzeug angegeben – es wurden nur die Kennzahlen erhoben. Kein Diff hat den Rechner verlassen.', '');
  }

  const ziel =
    typeof p.aus === 'string'
      ? p.aus
      : await ausgabeZiel(import.meta.url, `pull-requests-${kurzname(repo)}-${von}-bis-${bis}.md`, bis);
  await writeFile(ziel, `${bericht.join('\n')}\n`, 'utf8');
  console.log(`Bericht geschrieben: ${ziel}`);
}

hauptlauf();
