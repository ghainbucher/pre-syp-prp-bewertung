#!/usr/bin/env node
/**
 * Aus einer GitHub-Auswertung einen Bericht mit **Interpretation** machen
 * (docs/zusammenarbeit-mit-ki.md, Kap. 6.5).
 *
 * Grundlage ist die JSON-Datei aus `github-auswertung.mjs`. Dazu kommen auf
 * Wunsch zwei Quellen, die dort nicht drinstehen:
 *
 *   --klon <pfad>   **Wissensinseln**: Dateien, die nur eine einzige Person je
 *                   angefasst hat, und der Anteil fremdbearbeiteter Dateien.
 *                   Braucht eine Arbeitskopie – auch eine flüchtige genügt.
 *   --repo <r>      **Issues, Board und Pipeline** über `gh`: Anteil der Stories
 *                   mit Akzeptanzkriterien, Liegezeiten, wer schließt nur eigene
 *                   Issues, längste rote Phase auf dem Hauptzweig.
 *
 * **Die Interpretation ist gerechnet, nicht erfunden.** Sie entsteht aus festen
 * Regeln – für jedes Team dieselben (G11, R-14). Wo eine Regel greift, steht die
 * Einschränkung daneben: Eine Verteilung sagt nichts über Qualität (PN-2, E1).
 *
 * **Es bewertet nicht** (G9). Kein Punktevorschlag – den rechnet die Anwendung
 * (FA-81 AK-5); zwei Stellen für dieselbe Zahl driften auseinander.
 *
 *   node scripts/auswertung-deuten.mjs --auswertung auswertung-x.json \
 *     [--bestand sicherung.json] [--klon ../projekt] [--repo htl/projekt] \
 *     [--werkzeug "claude -p"] [--aus bericht.md]
 */

import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import {
  abbrechen,
  ausgabeZiel,
  kurzname,
  parameter,
  repoKuerzel,
  teamsAusBestand,
} from './hilfen.mjs';

const ausfuehren = promisify(execFile);

/** Ab welchem Verhältnis stärkste zu schwächster Kennung die Verteilung schief heißt. */
const SCHIEF_AB = 2.5;
/** Ab welchem Anteil einer einzelnen Kennung das Muster „designierter Ingenieur" greift (E1a). */
const ALLEIN_AB = 60;
/** Ab welchem Anteil der fünf stärksten Tage von Schubarbeit die Rede ist. */
const SCHUB_AB = 35;

async function ruf(befehl, args) {
  try {
    const { stdout } = await ausfuehren(befehl, args, { maxBuffer: 64 * 1024 * 1024 });
    return stdout;
  } catch {
    // Ein fehlender Block darf den Bericht nicht verhindern – der Aufruf sagt
    // an der Stelle, an der er fehlt, dass nichts kam (siehe `inselLeer`).
    return null;
  }
}

const prozent = (teil, ganz) => (ganz > 0 ? Math.round((100 * teil) / ganz) : 0);
const tagAus = (iso) => String(iso).slice(0, 10);

/* ------------------------------------------------------------------ Zahlen */

function verteilung(anteile) {
  const eintraege = Object.entries(anteile).sort((a, b) => b[1] - a[1]);
  if (eintraege.length === 0) return null;
  const hoechster = eintraege[0][1];
  const niedrigster = eintraege[eintraege.length - 1][1];
  return {
    eintraege,
    hoechster,
    niedrigster,
    verhaeltnis: niedrigster > 0 ? hoechster / niedrigster : Infinity,
  };
}

function zeitverlauf(jeTag, bis) {
  const tage = Object.keys(jeTag).sort();
  if (tage.length === 0) return null;
  const gesamt = Object.values(jeTag).reduce((a, b) => a + b, 0);
  const sortiert = Object.entries(jeTag).sort((a, b) => b[1] - a[1]);
  const spitze = sortiert.slice(0, 5);
  const jeMonat = {};
  for (const [tag, anzahl] of Object.entries(jeTag)) {
    jeMonat[tag.slice(0, 7)] = (jeMonat[tag.slice(0, 7)] ?? 0) + anzahl;
  }
  // Juli und August sind in Österreich Ferienmonate; eine Näherung, keine Schulzeitrechnung.
  const ferien = Object.entries(jeTag)
    .filter(([tag]) => ['07', '08'].includes(tag.slice(5, 7)))
    .reduce((summe, [, anzahl]) => summe + anzahl, 0);
  let groessteLuecke = { von: null, tage: 0 };
  for (let i = 0; i < tage.length - 1; i += 1) {
    const abstand = Math.round((new Date(tage[i + 1]) - new Date(tage[i])) / 86_400_000);
    if (abstand > groessteLuecke.tage) groessteLuecke = { von: tage[i], tage: abstand };
  }
  return {
    gesamt,
    aktiveTage: tage.length,
    erster: tage[0],
    letzter: tage[tage.length - 1],
    jeMonat,
    ferienAnteil: prozent(ferien, gesamt),
    spitze,
    spitzenAnteil: prozent(spitze.reduce((s, [, a]) => s + a, 0), gesamt),
    groessteLuecke,
    stillSeit: Math.round((new Date(bis) - new Date(tage[tage.length - 1])) / 86_400_000),
  };
}

/* ------------------------------------------------ Wissensinseln (Arbeitskopie) */

async function wissensinseln(klon, von, bis) {
  const roh = await ruf('git', [
    '-C', klon, 'log', `--since=${von}`, `--until=${bis}T23:59:59`,
    '--no-merges', '--pretty=format:@@%an', '--name-only',
  ]);
  if (roh === null) return null;

  const jeDatei = new Map();
  let autor = null;
  for (const zeile of roh.split('\n')) {
    if (zeile.startsWith('@@')) {
      autor = zeile.slice(2).trim();
      continue;
    }
    const datei = zeile.trim();
    if (!datei || !autor) continue;
    if (!jeDatei.has(datei)) jeDatei.set(datei, new Set());
    jeDatei.get(datei).add(autor);
  }
  if (jeDatei.size === 0) return null;

  // Die Namen bleiben hier: Wer die Insel hält, gehört ins Gespräch, nicht in
  // den Bericht als Vorwurf. Ausgewiesen wird die **Zahl** je Person.
  const inseln = [...jeDatei].filter(([, autoren]) => autoren.size === 1);
  const jePerson = new Map();
  for (const [, autoren] of inseln) {
    const einziger = [...autoren][0];
    jePerson.set(einziger, (jePerson.get(einziger) ?? 0) + 1);
  }
  const ordner = new Map();
  for (const [datei] of inseln) {
    const teil = datei.includes('/') ? datei.slice(0, datei.lastIndexOf('/')) : '.';
    ordner.set(teil, (ordner.get(teil) ?? 0) + 1);
  }
  return {
    dateien: jeDatei.size,
    inseln: inseln.length,
    anteil: prozent(inseln.length, jeDatei.size),
    jePerson: [...jePerson].sort((a, b) => b[1] - a[1]),
    ordner: [...ordner].sort((a, b) => b[1] - a[1]).slice(0, 5),
  };
}

/* ------------------------------------------------------ Issues, Board, Pipeline */

async function issues(repo, von, bis) {
  const roh = await ruf('gh', [
    'issue', 'list', '--repo', repo, '--state', 'all', '--limit', '200',
    '--json', 'number,title,body,createdAt,closedAt,author,labels',
  ]);
  if (roh === null) return null;
  let liste;
  try {
    liste = JSON.parse(roh);
  } catch {
    return null;
  }
  const imZeitraum = liste.filter((i) => tagAus(i.createdAt) <= bis && (!i.closedAt || tagAus(i.closedAt) >= von));
  if (imZeitraum.length === 0) return { gesamt: 0 };

  // „Hat Akzeptanzkriterien" heißt: irgendeine überprüfbare Form ist da –
  // Kästchen, das Wort, oder eine ID. Bewusst großzügig: Gesucht wird, ob
  // überhaupt jemand daran gedacht hat, nicht ob es schön ist.
  const mitAk = imZeitraum.filter((i) =>
    /akzeptanz|gegeben.*wenn.*dann|^\s*[-*]\s*\[[ xX]\]/ims.test(String(i.body ?? '')),
  );
  const geschlossen = imZeitraum.filter((i) => i.closedAt);
  const liegezeiten = geschlossen
    .map((i) => Math.round((new Date(i.closedAt) - new Date(i.createdAt)) / 86_400_000))
    .sort((a, b) => a - b);
  const mitte = Math.floor(liegezeiten.length / 2);
  const median =
    liegezeiten.length === 0
      ? null
      : liegezeiten.length % 2 === 1
        ? liegezeiten[mitte]
        : Math.round((liegezeiten[mitte - 1] + liegezeiten[mitte]) / 2);
  const jeAutor = new Map();
  for (const i of imZeitraum) {
    const a = i.author?.login ?? '?';
    jeAutor.set(a, (jeAutor.get(a) ?? 0) + 1);
  }
  return {
    gesamt: imZeitraum.length,
    mitAk: mitAk.length,
    offen: imZeitraum.length - geschlossen.length,
    median,
    aelteste: liegezeiten[liegezeiten.length - 1] ?? null,
    jeAutor: [...jeAutor].sort((a, b) => b[1] - a[1]),
  };
}

async function pipeline(repo, von, bis) {
  const roh = await ruf('gh', [
    'run', 'list', '--repo', repo, '--limit', '200',
    '--json', 'conclusion,createdAt,headBranch,workflowName',
  ]);
  if (roh === null) return null;
  let laeufe;
  try {
    laeufe = JSON.parse(roh);
  } catch {
    return null;
  }
  const haupt = laeufe
    .filter((l) => ['main', 'master'].includes(l.headBranch))
    .filter((l) => tagAus(l.createdAt) >= von && tagAus(l.createdAt) <= bis)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (haupt.length === 0) return { gesamt: 0 };

  const fehl = haupt.filter((l) => l.conclusion === 'failure');
  // Längste rote Phase: vom ersten Fehlschlag bis zum nächsten Erfolg.
  let laengste = 0;
  let rotSeit = null;
  for (const lauf of haupt) {
    if (lauf.conclusion === 'failure' && rotSeit === null) rotSeit = new Date(lauf.createdAt);
    if (lauf.conclusion === 'success' && rotSeit !== null) {
      laengste = Math.max(laengste, (new Date(lauf.createdAt) - rotSeit) / 3_600_000);
      rotSeit = null;
    }
  }
  const offenRot = rotSeit !== null ? (new Date(`${bis}T23:59:59`) - rotSeit) / 3_600_000 : 0;
  return {
    gesamt: haupt.length,
    fehlgeschlagen: fehl.length,
    laengsteRotStunden: Math.round(Math.max(laengste, offenRot)),
    nochRot: rotSeit !== null,
  };
}

/* --------------------------------------------------------- Die Interpretation */

/**
 * Feste Regeln, für jedes Team dieselben. Jede Aussage nennt, worauf sie sich
 * stützt – und, wo nötig, was sie **nicht** sagt.
 */
function deutung({ a, vert, zeit, team, insel, iss, pipe }) {
  const s = [];

  /* Pull Requests und Reviews */
  const reviewZahl = (a.reviews ?? []).length;
  if (a.prAnteil >= 90 && reviewZahl === 0) {
    s.push(
      `**Die Form ist da, die Sache fehlt.** ${Math.round(a.prAnteil)} % der Änderungen liefen über Pull Requests, ` +
        `und **kein einziger** wurde von jemand anderem begutachtet. Das ist das Muster aus R-13: die Form ohne den ` +
        `Inhalt. Zu klären ist, ob das vereinbart war oder nie aufgekommen ist – beides ist möglich und führt zu ` +
        `verschiedenen Maßnahmen.`,
    );
  } else if (reviewZahl === 0 && a.prAnteil < 90) {
    s.push(
      `**Weder Pull Requests noch Reviews.** ${Math.round(a.prAnteil)} % über Pull Requests, ${a.direktePushes} ` +
        `Änderungen direkt auf den Hauptzweig, keine Begutachtung. Der Ablauf ist noch nicht eingeführt.`,
    );
  } else if (reviewZahl > 0) {
    const kanten = a.reviews.map((r) => `${r.von} → ${r.an} (${r.anzahl})`).join(', ');
    const gebend = new Set(a.reviews.map((r) => r.von)).size;
    s.push(
      `**Es wird begutachtet:** ${reviewZahl} Beziehungen, ${gebend} Personen geben Reviews (${kanten}). ` +
        `Zu prüfen ist die Gegenseitigkeit: Begutachten immer dieselben zwei einander, ist es eine Gewohnheit ` +
        `zwischen zweien und keine Teampraxis.`,
    );
  }
  if (a.direktePushes > 0) {
    s.push(
      `${a.direktePushes} Änderungen gingen **direkt auf den Hauptzweig**. Mit einem geschützten Zweig wäre das ` +
        `nicht möglich (CONTRIBUTING, fünf Einstellungen) – die Zahl misst hier also die Einrichtung, nicht die Disziplin.`,
    );
  }

  /* Verteilung */
  if (vert) {
    const [starkName, starkWert] = vert.eintraege[0];
    const liste = vert.eintraege.map(([k, v]) => `${k} ${v.toFixed(1).replace('.', ',')} %`).join(' · ');
    if (starkWert >= ALLEIN_AB) {
      s.push(
        `**Ein Konto trägt fast alles:** ${starkName} mit ${starkWert.toFixed(0)} % (${liste}). Das ist das Muster ` +
          `„designierter Ingenieur" aus E1a – die Teams mit den **schlechtesten** Ergebnissen der dortigen Fallstudie. ` +
          `Es sagt nichts darüber, wer mehr gearbeitet hat: Möglicherweise committet einer für alle.`,
      );
    } else if (vert.verhaeltnis >= SCHIEF_AB) {
      s.push(
        `**Die Beteiligung ist schief:** ${liste}. Verhältnis zwischen stärkstem und schwächstem Konto ` +
          `${vert.verhaeltnis.toFixed(1).replace('.', ',')} zu 1. Nach E1 sagt die Commit-Zahl über die geleistete ` +
          `Arbeit fast nichts – über die **Verteilung der Beteiligung** sagt sie etwas, und die ist ungleich.`,
      );
    } else {
      s.push(
        `**Die Beteiligung ist gleichmäßig:** ${liste}. In der Fallstudie E1a hatten Teams, in denen alle regelmäßig ` +
          `committen, die besten Ergebnisse – das ist ein Zusammenhang, keine Ursache.`,
      );
    }
    if (team) {
      const fremd = vert.eintraege.map(([k]) => k).filter((k) => !(k in team.kennungen));
      if (fremd.length > 0) {
        s.push(
          `**Nicht jede Kennung gehört zum Team:** ${fremd.join(', ')} ${fremd.length === 1 ? 'ist' : 'sind'} in der ` +
            `Anwendung keiner Person zugeordnet. Solange das offen ist, ist die Verteilung oben nicht lesbar – ` +
            `ein Lehrer-, Schul- oder gemeinsames Konto verschiebt sie vollständig.`,
        );
      }
    } else {
      s.push(
        `Ob alle ${vert.eintraege.length} Kennungen zu Mitgliedern des Teams gehören, ist hier nicht prüfbar ` +
          `(keine Sicherungsdatei übergeben). Ein Schul- oder gemeinsames Konto in der Liste verschiebt die Verteilung.`,
      );
    }
  }
  if ((a.nichtZugeordnet ?? []).length > 0) {
    s.push(
      `**${a.nichtZugeordnet.length} Beitragende ohne verknüpftes GitHub-Konto** (${a.nichtZugeordnet.join(', ')}). ` +
        `Ihre Commits zählen in den Tageszahlen, aber in keiner Kennung – die Verteilung ist dadurch unvollständig.`,
    );
  }

  /* Zeit */
  if (zeit) {
    const monate = Object.entries(zeit.jeMonat).sort().map(([m, n]) => `${m}: ${n}`).join(' · ');
    s.push(
      `**Zeitlich:** ${zeit.gesamt} Beiträge an ${zeit.aktiveTage} Tagen, vom ${zeit.erster} bis zum ${zeit.letzter} ` +
        `(${monate}).`,
    );
    if (zeit.ferienAnteil >= 50) {
      s.push(
        `**${zeit.ferienAnteil} % der Arbeit fiel in die Sommerferien.** Das ist Arbeit, die nicht beobachtet wurde ` +
          `(G4), und es trifft R-09: Wer im Sommer Zeit hat, hat hier einen Vorsprung, den keine Rubrik ausgleicht. ` +
          `Für die Beurteilung heißt das, sich an das zu halten, was im Review erklärt werden kann.`,
      );
    }
    if (zeit.spitzenAnteil >= SCHUB_AB) {
      const tage = zeit.spitze.map(([t, n]) => `${t} (${n})`).join(', ');
      s.push(
        `**Schubarbeit:** ${zeit.spitzenAnteil} % aller Beiträge liegen auf fünf Tagen – ${tage}. Das ist kein ` +
          `gleichmäßiger Fluss. Ob dahinter eine Klausurphase, ein gemeinsamer Arbeitstag oder eine Abgabe steckt, ` +
          `sagen die Zahlen nicht.`,
      );
    }
    if (zeit.groessteLuecke.tage >= 14) {
      s.push(
        `**Längste Pause: ${zeit.groessteLuecke.tage} Tage** ab dem ${zeit.groessteLuecke.von}.`,
      );
    }
    if (zeit.stillSeit >= 7) {
      s.push(`Seit dem ${zeit.letzter} ist nichts mehr passiert – ${zeit.stillSeit} Tage bis zum Ende des Zeitraums.`);
    }
  }

  /* Wissensinseln */
  if (insel) {
    const personen = insel.jePerson.map(([n, z]) => `${n}: ${z}`).join(' · ');
    s.push(
      `**Wissensinseln:** ${insel.inseln} von ${insel.dateien} Dateien (${insel.anteil} %) wurden von **nur einer** ` +
        `Person angefasst (${personen}). Schwerpunkte: ${insel.ordner.map(([o, z]) => `${o} (${z})`).join(', ')}. ` +
        `Das ist kein Vorwurf, sondern ein Teamrisiko – und die Frage dazu stellt sich von selbst: Wer könnte hier ` +
        `weiterarbeiten, wenn die Person ausfällt?`,
    );
    if (insel.anteil >= 70) {
      s.push(
        `Bei ${insel.anteil} % Alleinbesitz arbeiten vier Leute eher **nebeneinander** als miteinander. Das ist der ` +
          `Zustand, gegen den Review-Pflicht und rotierendes Mitlesen gebaut sind (Kap. 3.2, 6.2).`,
      );
    }
  }

  /* Issues */
  if (iss && iss.gesamt > 0) {
    s.push(
      `**Issues:** ${iss.gesamt} im Zeitraum, davon ${iss.offen} offen. ` +
        `${iss.mitAk} (${prozent(iss.mitAk, iss.gesamt)} %) enthalten etwas Überprüfbares – Kästchen, ` +
        `Akzeptanzkriterien oder eine Gegeben-wenn-dann-Form.` +
        (iss.median !== null ? ` Mittlere Liegezeit ${iss.median} Tage, längste ${iss.aelteste} Tage.` : ''),
    );
    if (prozent(iss.mitAk, iss.gesamt) < 40) {
      s.push(
        `Unter 40 % der Stories sind überprüfbar formuliert. Damit ist im Nachhinein nicht feststellbar, ob eine ` +
          'Story erfüllt wurde – und `p3` beurteilt dann einen Eindruck statt einer Tatsache.',
      );
    }
  } else if (iss) {
    s.push(`**Keine Issues im Zeitraum.** Das Backlog wird woanders geführt – oder nicht (\`p3\`, \`p4\`).`);
  }

  /* Pipeline */
  if (pipe && pipe.gesamt > 0) {
    s.push(
      `**Pipeline auf dem Hauptzweig:** ${pipe.gesamt} Läufe, ${pipe.fehlgeschlagen} fehlgeschlagen. ` +
        `Längste rote Phase: ${pipe.laengsteRotStunden} Stunden${pipe.nochRot ? ' – und sie ist noch offen' : ''}. ` +
        `Ein Hauptzweig, der tagelang nicht baut, ist eine Aussage über die Definition of Done.`,
    );
  } else if (pipe) {
    s.push('**Keine Pipeline-Läufe auf dem Hauptzweig im Zeitraum** – entweder gibt es keine CI oder sie läuft woanders.');
  }

  return s;
}

/** Fragen, die sich aus den Regeln ergeben – zum Mitnehmen ins Gespräch. */
function fragen({ a, vert, zeit, team, insel, iss }) {
  const f = [];
  if ((a.reviews ?? []).length === 0 && a.prAnteil >= 90) {
    f.push('Jede Änderung lief über einen Pull Request, keiner wurde begutachtet. War das so vereinbart?');
  }
  if (team) {
    const fremd = (vert?.eintraege ?? []).map(([k]) => k).filter((k) => !(k in team.kennungen));
    if (fremd.length > 0) f.push(`Wer steckt hinter ${fremd.join(', ')}?`);
  } else if (vert) {
    f.push(`Gehören alle diese Kennungen zu Mitgliedern des Teams: ${vert.eintraege.map(([k]) => k).join(', ')}?`);
  }
  if (zeit && zeit.spitzenAnteil >= SCHUB_AB) {
    f.push(`Was ist am ${zeit.spitze[0][0]} passiert – dort liegen ${zeit.spitze[0][1]} Beiträge an einem Tag?`);
  }
  if (insel && insel.jePerson.length > 0) {
    f.push(`${insel.ordner[0]?.[0] ?? 'Ein Bereich'} wurde nur von einer Person bearbeitet – wer könnte dort einspringen?`);
  }
  if (iss && iss.gesamt > 0 && prozent(iss.mitAk, iss.gesamt) < 40) {
    f.push('Woran erkennt ihr, dass eine Story fertig ist, wenn sie keine Akzeptanzkriterien nennt?');
  }
  if (vert && vert.verhaeltnis >= SCHIEF_AB) {
    f.push('Wie habt ihr die Arbeit aufgeteilt – und wie ist die Aufteilung entstanden?');
  }
  return f;
}

/* -------------------------------------------------------------------- Lauf */

async function hauptlauf() {
  const p = parameter(process.argv.slice(2));
  if (!p.auswertung) {
    abbrechen(
      'Aufruf: node scripts/auswertung-deuten.mjs --auswertung datei.json\n' +
        '        [--bestand sicherung.json] [--klasse 3AHIF] [--klon ../projekt]\n' +
        '        [--repo eigentuemer/name] [--werkzeug "claude -p"] [--aus bericht.md]',
    );
  }

  let a;
  try {
    a = JSON.parse(await readFile(String(p.auswertung), 'utf8'));
  } catch (fehler) {
    abbrechen(`Auswertung nicht lesbar: ${p.auswertung}\n${fehler.message}`);
  }

  const repo = p.repo ? repoKuerzel(p.repo) : '';
  let team = null;
  if (typeof p.bestand === 'string') {
    const teams = await teamsAusBestand(p.bestand, typeof p.klasse === 'string' ? p.klasse : '');
    // Zuordnung über das Repository, sonst über den Namen der Auswertungsdatei.
    team =
      teams.find((t) => repo && t.repository === repo) ??
      teams.find((t) => String(p.auswertung).toLowerCase().includes(t.name.toLowerCase())) ??
      null;
  }

  const vert = verteilung(a.anteile ?? {});
  const zeit = zeitverlauf(a.jeTag ?? {}, a.bis);
  const insel = typeof p.klon === 'string' ? await wissensinseln(String(p.klon), a.von, a.bis) : null;
  // Stille ist kein Erfolg: Eine Arbeitskopie, aus der nichts kam, muss das sagen.
  const inselLeer = typeof p.klon === 'string' && insel === null;
  const iss = repo ? await issues(repo, a.von, a.bis) : null;
  const pipe = repo ? await pipeline(repo, a.von, a.bis) : null;

  const saetze = deutung({ a, vert, zeit, team, insel, iss, pipe });
  if (inselLeer) {
    saetze.push(
      `**Aus der Arbeitskopie \`${p.klon}\` kam nichts.** Entweder liegt im Zeitraum ${a.von} bis ${a.bis} dort ` +
        'kein Commit, oder der Pfad ist kein Git-Repository, oder die Kopie ist nicht aktuell (`git fetch`). ' +
        'Der Abschnitt zu den Wissensinseln fehlt deshalb – nicht, weil es keine gäbe.',
    );
  }
  const fr = fragen({ a, vert, zeit, team, insel, iss });

  const zeilen = [
    `# Auswertung ${team ? `${team.name} (${team.klasse})` : kurzname(String(p.auswertung))}`,
    '',
    '| | |',
    '|---|---|',
    `| **Zeitraum** | ${a.von} bis ${a.bis} |`,
    `| **Stand der Zahlen** | ${tagAus(a.standAm)} |`,
    ...(repo ? [`| **Repository** | \`${repo}\` |`] : []),
    ...(team ? [`| **Team** | ${team.name} |`] : []),
    `| **Bericht erzeugt** | ${new Date().toISOString().slice(0, 10)} |`,
    '',
    '> **Vorschlag, keine Feststellung.** Der Bericht enthält keine Bewertung und keinen',
    '> Punktevorschlag (G9). Den Wert für `t5` rechnet die Anwendung (FA-81 AK-5).',
    '',
    '---',
    '',
    '## 1 Zahlen',
    '',
    '| | |',
    '|---|---|',
    `| Beiträge | ${zeit?.gesamt ?? 0} an ${zeit?.aktiveTage ?? 0} Tagen |`,
    `| Anteil über Pull Requests | ${Math.round(a.prAnteil ?? 0)} % |`,
    `| Direkt auf den Hauptzweig | ${a.direktePushes ?? 0} |`,
    `| Review-Beziehungen | ${(a.reviews ?? []).length} |`,
    ...(insel ? [`| Dateien mit einer einzigen bearbeitenden Person | ${insel.inseln} von ${insel.dateien} (${insel.anteil} %) |`] : []),
    ...(iss && iss.gesamt > 0 ? [`| Issues (davon mit Akzeptanzkriterien) | ${iss.gesamt} (${iss.mitAk}) |`] : []),
    ...(pipe && pipe.gesamt > 0 ? [`| Längste rote Phase auf dem Hauptzweig | ${pipe.laengsteRotStunden} h |`] : []),
    '',
    '**Beteiligung je Kennung**',
    '',
    '| Kennung | Anteil |',
    '|---|---|',
    ...(vert?.eintraege ?? []).map(
      ([k, v]) => `| \`${k}\`${team && team.kennungen[k] ? ` (${team.kennungen[k]})` : ''} | ${v.toFixed(1).replace('.', ',')} % |`,
    ),
    '',
    '---',
    '',
    '## 2 Interpretation der Auswertung',
    '',
    'Gerechnet nach festen Regeln, für jedes Team dieselben (G11). Was eine Regel **nicht**',
    'sagt, steht dabei.',
    '',
    ...saetze.map((satz) => `- ${satz}`),
    '',
    '**Was keine dieser Zahlen sagt:** nichts über Qualität, nichts über Schwierigkeit, nichts',
    'darüber, wer gedacht hat. Ein Commit mit vierhundert Zeilen und einer mit einem Tippfehler',
    'zählen gleich (PN-2, E1). Die Auswertung ist ein Gesprächsanlass und keine Feststellung über',
    'Personen.',
    '',
    '---',
    '',
    '## 3 Fragen für das Gespräch',
    '',
    ...(fr.length > 0 ? fr.map((frage, i) => `${i + 1}. ${frage}`) : ['Aus den Zahlen ergibt sich keine auffällige Frage.']),
    '',
  ];

  if (typeof p.werkzeug === 'string') {
    /*
     * Vor dem Versand werden **alle** Kennungen und Namen durch A, B, C ersetzt.
     * Sonst widerspräche dieser Bericht der Regel, nach der die beiden anderen
     * Skripte gebaut sind: Die KI sieht Zahlen, nicht Leute. Die Zuordnung bleibt
     * im Bericht auf dem Gerät.
     */
    const ersatz = new Map();
    const buchstaben = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const [kennung] of vert?.eintraege ?? []) ersatz.set(kennung, buchstaben[ersatz.size] ?? '?');
    for (const [name] of insel?.jePerson ?? []) if (!ersatz.has(name)) ersatz.set(name, buchstaben[ersatz.size] ?? '?');
    for (const name of Object.values(team?.kennungen ?? {})) if (!ersatz.has(name)) ersatz.set(name, buchstaben[ersatz.size] ?? '?');
    let zahlenteil = zeilen.slice(zeilen.indexOf('## 1 Zahlen')).join('\n');
    for (const [echt, kuerzel] of ersatz) {
      zahlenteil = zahlenteil.split(echt).join(kuerzel);
    }

    const text =
      'Du liest die Auswertung eines Schüler-Repositorys und bereitest ein Sprintreview vor.\n' +
      'Die Lehrkraft beurteilt, nicht du. Keine Noten, keine Punkte, kein Urteil über Personen.\n' +
      'A, B, C sind Pseudonyme, keine Namen – ordne nichts einer Person zu.\n' +
      'Nenne in höchstens fünf Sätzen, was an diesen Zahlen **zusätzlich** auffällt, und sage\n' +
      'ausdrücklich, wenn dir nichts auffällt. Danach höchstens zwei weitere Fragen.\n\n' +
      zahlenteil;
    const teile = String(p.werkzeug).trim().split(/\s+/);
    const kind = execFile(teile[0], teile.slice(1), { maxBuffer: 32 * 1024 * 1024 });
    let aus = '';
    kind.stdout.on('data', (d) => (aus += d));
    kind.stdin.end(text);
    const ende = await new Promise((loesen) => kind.on('close', loesen));
    zeilen.push(
      '---',
      '',
      '## 4 Ergänzung durch die KI (Vorschlag)',
      '',
      ende === 0 ? aus.trim() : `Das Werkzeug „${p.werkzeug}" endete mit Code ${ende} – kein Beitrag.`,
      '',
    );
  }

  const ziel =
    typeof p.aus === 'string'
      ? p.aus
      : await ausgabeZiel(import.meta.url, `deutung-${team ? kurzname(team.name) : kurzname(String(p.auswertung))}-${a.von}-bis-${a.bis}.md`, a.bis);
  await writeFile(ziel, `${zeilen.join('\n')}\n`, 'utf8');
  console.log(`Bericht geschrieben: ${ziel}`);
  console.log(`  ${saetze.length} Aussagen, ${fr.length} Fragen`);
}

hauptlauf();
