/**
 * CSV-Export der Klassenübersicht (FA-31).
 *
 * Trennzeichen ist der Strichpunkt und das Dezimaltrennzeichen das Komma,
 * damit die Datei in einer deutschsprachigen Excel-Installation ohne
 * Importdialog korrekt öffnet. Das vorangestellte BOM sorgt dafür, dass
 * Umlaute richtig erkannt werden.
 */

import { formatProzent, gesamtErgebnis, note } from '../domain/scoring';
import { teamIn } from '../domain/zuordnung';
import type { Abschnitt, Bewertung, Datenbestand, Person, Team } from '../domain/types';

export const BOM = '﻿';

function feld(wert: string | number | null): string {
  const text = wert === null ? '' : String(wert);
  return `"${text.replace(/"/g, '""')}"`;
}

export function alsCsv(zeilen: Array<Array<string | number | null>>): string {
  return BOM + zeilen.map((zeile) => zeile.map(feld).join(';')).join('\r\n');
}

export interface UebersichtEingabe {
  daten: Datenbestand;
  klasseId: string;
  personen: Person[];
  teams: Team[];
  abschnitte: Abschnitt[];
  bewertungen: Map<string, Bewertung>;
}

/**
 * Erzeugt die Zeilen der Klassenübersicht (FA-31).
 *
 * Die Spalte „Team“ nennt die Zuordnung im **letzten** Abschnitt, weil Teams
 * wechseln dürfen (FA-58); die Abschnittsspalten stehen für sich.
 */
export function uebersichtZeilen(eingabe: UebersichtEingabe): Array<Array<string | number | null>> {
  const { daten, personen, teams, abschnitte, bewertungen } = eingabe;
  const kopf: Array<string> = [
    'Name',
    'Team',
    ...abschnitte.map((abschnitt) => `${abschnitt.name} (%)`),
    'Praxis (%)',
    'Theorie (%)',
    'Gesamt (%)',
    'Notenvorschlag',
  ];

  const zeilen: Array<Array<string | number | null>> = [kopf];
  const letzter = abschnitte[abschnitte.length - 1];

  for (const person of personen) {
    const ergebnis = gesamtErgebnis(daten, person, bewertungen);
    const teamId = letzter ? teamIn(daten, letzter.id, person.id) : person.teamId;
    const team = teams.find((t) => t.id === teamId);
    const nachId = new Map(ergebnis.alle.map((e) => [e.abschnitt.id, e.ergebnis]));

    zeilen.push([
      person.name,
      team?.name ?? '',
      ...abschnitte.map((abschnitt) => {
        const wert = nachId.get(abschnitt.id)?.prozent ?? null;
        return wert === null ? '' : formatProzent(wert, 1);
      }),
      ergebnis.praxis.prozent === null ? '' : formatProzent(ergebnis.praxis.prozent, 1),
      ergebnis.theorie.prozent === null ? '' : formatProzent(ergebnis.theorie.prozent, 1),
      ergebnis.prozent === null ? '' : formatProzent(ergebnis.prozent, 1),
      note(ergebnis.prozent, daten.notenschluessel) ?? '',
    ]);
  }

  return zeilen;
}

/** Dateiname des Exports, abgeleitet vom Klassennamen. */
export function csvDateiname(klassenname: string, datum = new Date()): string {
  const sauber = klassenname.trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '') || 'Klasse';
  return `pre-syp-prp-${sauber}-${datum.toISOString().slice(0, 10)}.csv`;
}

/**
 * Bietet einen Text als Datei zum Herunterladen an.
 *
 * Der einzige Ort im Programm mit Browser-Seiteneffekt beim Export; dadurch
 * bleiben die Funktionen oben testbar.
 */
export function dateiAnbieten(dateiname: string, inhalt: string, typ = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([inhalt], { type: typ });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = dateiname;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
