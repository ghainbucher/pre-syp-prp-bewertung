/**
 * Rubrik zur Ausgabe an die Klasse (FA-39).
 *
 * Erzeugt ein in sich geschlossenes HTML-Blatt: keine Verweise nach außen, kein
 * Skript, keine Schrift von einem fremden Rechner (NFA-03). Es lässt sich
 * ausdrucken, als Datei weitergeben oder in die Lernplattform stellen.
 *
 * Die Ausgabe kennt **nur** Rubrik und Notenschlüssel. Namen und erfasste
 * Punkte kommen hier nicht vor, weil sie gar nicht erst übergeben werden
 * (AK-2) – das ist verlässlicher als eine Filterung, die man vergessen kann.
 */

import type { Kriterium, Notenstufe, Rubrik } from '../domain/types';

export interface RubrikblattEingabe {
  /** Überschrift, üblicherweise der Name des Abschnitts. */
  titel: string;
  rubrik: Rubrik;
  notenschluessel: Notenstufe[];
  /** Findet in diesem Abschnitt eine Peer-Bewertung statt (FA-52)? */
  peerAktiv: boolean;
  /** Zeitraum des Abschnitts, sofern eingetragen. */
  zeitraum?: string;
  /** Datum der Ausgabe. */
  stand?: Date;
}

const KATEGORIEN: Array<{ schluessel: keyof Pick<Rubrik, 'team' | 'prozess' | 'individuell' | 'peer'>; titel: string }> = [
  { schluessel: 'team', titel: 'Team-Ergebnis' },
  { schluessel: 'prozess', titel: 'Scrum-Prozess' },
  { schluessel: 'individuell', titel: 'Individueller Beitrag' },
  { schluessel: 'peer', titel: 'Peer- und Selbsteinschätzung' },
];

/** Maskiert die fünf Zeichen, die in HTML-Text bzw. Attributen stören. */
export function maskiert(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function standDeutsch(datum: Date): string {
  const zahl = (wert: number) => String(wert).padStart(2, '0');
  return `${zahl(datum.getDate())}.${zahl(datum.getMonth() + 1)}.${datum.getFullYear()}`;
}

function kriterienTabelle(kriterien: Kriterium[], mitPunkten: boolean): string {
  const zeilen = kriterien
    .map(
      (kriterium) => `        <tr>
          <th scope="row">${maskiert(kriterium.name)}</th>
          <td>${maskiert(kriterium.beschreibung)}</td>
          <td class="zahl">${mitPunkten ? kriterium.max : '1–5'}</td>
        </tr>`,
    )
    .join('\n');

  return `      <table>
        <thead>
          <tr><th scope="col">Kriterium</th><th scope="col">Worauf geachtet wird</th><th scope="col">${
            mitPunkten ? 'Punkte' : 'Skala'
          }</th></tr>
        </thead>
        <tbody>
${zeilen}
        </tbody>
      </table>`;
}

/**
 * Beschriftung des Kategoriegewichts (AK-1, AK-7).
 *
 * Eine Kategorie ohne Gewicht wird ausdrücklich als nicht zählend
 * ausgewiesen – sonst liest sich das Blatt so, als zählte alles gleich.
 */
function gewichtstext(gewicht: number, istPeer: boolean): string {
  if (gewicht > 0) return `zählt ${gewicht} %`;
  return istPeer
    ? 'zählt nicht unmittelbar in die Note; die Einschätzungen werden besprochen'
    : 'zählt in diesem Abschnitt nicht';
}

/** Das vollständige Blatt als HTML-Dokument. */
export function rubrikblattHtml(eingabe: RubrikblattEingabe): string {
  const { titel, rubrik, notenschluessel, peerAktiv, zeitraum } = eingabe;
  const stand = eingabe.stand ?? new Date();

  const abschnitte = KATEGORIEN.filter((kategorie) => {
    if (rubrik[kategorie.schluessel].length === 0) return false;
    // Ohne Peer-Bewertung in diesem Abschnitt hat die Kategorie nichts
    // verloren – das Blatt soll nicht mehr versprechen als gilt (AK-5).
    return kategorie.schluessel !== 'peer' || peerAktiv;
  })
    .map((kategorie) => {
      const istPeer = kategorie.schluessel === 'peer';
      const kriterien = rubrik[kategorie.schluessel];
      const summe = kriterien.reduce((wert, kriterium) => wert + kriterium.max, 0);
      const zusatz = istPeer ? '' : ` · ${summe} Punkte erreichbar`;
      return `    <section>
      <h2>${maskiert(kategorie.titel)}</h2>
      <p class="hinweis">${gewichtstext(rubrik.gewichte[kategorie.schluessel] ?? 0, istPeer)}${zusatz}</p>
${kriterienTabelle(kriterien, !istPeer)}
    </section>`;
    })
    .join('\n');

  const noten = [...notenschluessel]
    .sort((a, b) => a.note - b.note)
    .map(
      (stufe) =>
        `          <tr><th scope="row">${stufe.note}</th><td>${maskiert(stufe.bezeichnung)}</td><td class="zahl">ab ${stufe.ab} %</td></tr>`,
    )
    .join('\n');

  const kopfzeilen = [zeitraum, `Stand ${standDeutsch(stand)}`].filter(Boolean).join(' · ');

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Bewertungskriterien – ${maskiert(titel)}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0 auto; padding: 32px 24px; max-width: 44em;
         font: 15px/1.55 "Segoe UI", system-ui, sans-serif; color: #1a1a1a; background: #fff; }
  h1 { font-size: 1.5rem; margin: 0 0 4px; }
  h2 { font-size: 1.05rem; margin: 0 0 2px; }
  section { margin-top: 26px; page-break-inside: avoid; }
  p.hinweis { margin: 0 0 10px; color: #555; font-size: 0.88rem; }
  p.kopf { margin: 0 0 24px; color: #555; font-size: 0.88rem; }
  table { border-collapse: collapse; width: 100%; font-size: 0.92rem; }
  th, td { border-bottom: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
  thead th { border-bottom: 2px solid #999; font-size: 0.8rem; text-transform: uppercase;
             letter-spacing: 0.04em; color: #444; }
  th[scope="row"] { width: 30%; font-weight: 600; }
  td.zahl, thead th:last-child { text-align: right; white-space: nowrap; }
  footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #ddd;
           color: #555; font-size: 0.85rem; }
  @media print { body { padding: 0; max-width: none; } }
</style>
</head>
<body>
  <h1>Bewertungskriterien – ${maskiert(titel)}</h1>
  <p class="kopf">${maskiert(kopfzeilen)}</p>
${abschnitte}

    <section>
      <h2>Notenschlüssel</h2>
      <p class="hinweis">gilt für den gesamten Gegenstand</p>
      <table>
        <thead>
          <tr><th scope="col">Note</th><th scope="col">Bezeichnung</th><th scope="col">Prozent</th></tr>
        </thead>
        <tbody>
${noten}
        </tbody>
      </table>
    </section>

  <footer>
    Nicht bewertete Kategorien werden nicht als 0 gewertet, sondern aus der Gewichtung
    herausgerechnet. Der Prozentwert ist eine Rechengröße; die Note setzt die Lehrkraft.
  </footer>
</body>
</html>
`;
}

/** Dateiname des Blatts, abgeleitet vom Titel des Abschnitts. */
export function rubrikblattDateiname(titel: string, datum = new Date()): string {
  const sauber = titel.trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '') || 'Abschnitt';
  return `pre-syp-prp-kriterien-${sauber}-${datum.toISOString().slice(0, 10)}.html`;
}
