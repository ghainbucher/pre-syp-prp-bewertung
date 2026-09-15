#!/usr/bin/env node
/**
 * Eine Datei ausmustern: mit Zeitstempel nach `_temp/` legen und das Original
 * löschen.
 *
 * **Warum es dieses Skript gibt.** Eine KI kann in diesem Aufbau auf dem
 * Rechner des Auftraggebers Dateien *lesen* und *schreiben*, aber nicht
 * *löschen*. Das ließe sich nur über eine Freigabe ändern, die für einen ganzen
 * Ordner und die restliche Sitzung gilt – für drei Dateien eine Reichweite, die
 * in keinem Verhältnis steht. Also macht es der Rechner selbst, mit den Rechten
 * seines Benutzers, auf ausdrücklichen Aufruf. Das ist die kleinere Befugnis
 * und die bessere Spur: Jeder Aufruf steht im Terminal.
 *
 * **Warum verschieben und nicht löschen.** Ausgemusterter Code ist selten
 * endgültig ausgemustert. Der Zeitstempel im Namen sagt, wann er es wurde;
 * `_temp/` ist von Git ausgenommen, damit er nicht wieder ins Repository
 * wandert.
 *
 * Aufruf:
 *   npm run ausmustern -- src/ansichten/Alt.tsx [weitere …]
 *   npm run ausmustern -- --nur-anzeigen src/ansichten/Alt.tsx
 */

import { copyFileSync, existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = join(WURZEL, '_temp');

function abbrechen(satz) {
  console.error(satz);
  process.exit(1);
}

/** `yyyymmdd_hhmmss` in Ortszeit – der Zeitpunkt des Ausmusterns. */
function zeitstempel(jetzt = new Date()) {
  const zwei = (n) => String(n).padStart(2, '0');
  return (
    `${jetzt.getFullYear()}${zwei(jetzt.getMonth() + 1)}${zwei(jetzt.getDate())}` +
    `_${zwei(jetzt.getHours())}${zwei(jetzt.getMinutes())}${zwei(jetzt.getSeconds())}`
  );
}

/**
 * Ein freier Zielname.
 *
 * Zwei Dateien in derselben Sekunde sind unwahrscheinlich, aber nicht
 * unmöglich – und eine Sicherung, die eine andere Sicherung überschreibt, wäre
 * das Gegenteil dessen, wofür sie da ist.
 */
function freierName(praefix, name) {
  let versuch = join(ZIEL, `${praefix}_${name}`);
  let nummer = 2;
  while (existsSync(versuch)) {
    versuch = join(ZIEL, `${praefix}_${nummer}_${name}`);
    nummer += 1;
  }
  return versuch;
}

const argv = process.argv.slice(2);
const nurAnzeigen = argv.includes('--nur-anzeigen');
const dateien = argv.filter((a) => !a.startsWith('--'));

if (dateien.length === 0) {
  abbrechen(
    'Aufruf: npm run ausmustern -- <datei> [weitere …]\n' +
      '        npm run ausmustern -- --nur-anzeigen <datei>',
  );
}

const praefix = zeitstempel();
const geplant = [];

for (const angabe of dateien) {
  const voll = resolve(WURZEL, angabe);

  // Nur innerhalb des Repositorys. `relative` liefert einen Pfad mit '..',
  // sobald das Ziel darüber hinausführt – das ist die Prüfung.
  const innen = relative(WURZEL, voll);
  if (innen.startsWith('..') || innen === '') {
    abbrechen(`${angabe}: liegt außerhalb des Repositorys. Abgebrochen, nichts verändert.`);
  }
  if (!existsSync(voll)) {
    abbrechen(`${angabe}: gibt es nicht. Abgebrochen, nichts verändert.`);
  }
  if (statSync(voll).isDirectory()) {
    abbrechen(`${angabe}: ist ein Verzeichnis. Dieses Skript mustert einzelne Dateien aus.`);
  }
  if (innen.split(/[\\/]/)[0] === '_temp') {
    abbrechen(`${angabe}: liegt schon in _temp/.`);
  }

  geplant.push({ von: voll, nach: freierName(praefix, basename(voll)), angabe });
}

// Erst alles prüfen, dann alles ausführen: Ein Abbruch in der Mitte hinterließe
// einen halb ausgemusterten Stand.
if (nurAnzeigen) {
  console.log('Nur angezeigt, nichts verändert:');
  for (const e of geplant) {
    console.log(`  ${e.angabe}  →  ${relative(WURZEL, e.nach)}`);
  }
  process.exit(0);
}

mkdirSync(ZIEL, { recursive: true });

for (const e of geplant) {
  copyFileSync(e.von, e.nach);
  // Erst nach der Kopie löschen, und nur, wenn sie wirklich dasteht.
  if (!existsSync(e.nach)) {
    abbrechen(`${e.angabe}: Kopie nach _temp/ nicht angekommen. Original bleibt stehen.`);
  }
  unlinkSync(e.von);
  console.log(`ausgemustert  ${e.angabe}  →  ${relative(WURZEL, e.nach)}`);
}

console.log(
  `\n${geplant.length} ${geplant.length === 1 ? 'Datei' : 'Dateien'} ausgemustert. ` +
    '_temp/ ist von Git ausgenommen; endgültig löschen kannst du dort von Hand.',
);
