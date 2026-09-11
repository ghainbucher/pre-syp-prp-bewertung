/**
 * CSV-Export der Klassenübersicht (FA-31).
 *
 * Trennzeichen ist der Strichpunkt und das Dezimaltrennzeichen das Komma,
 * damit die Datei in einer deutschsprachigen Excel-Installation ohne
 * Importdialog korrekt öffnet. Das vorangestellte BOM sorgt dafür, dass
 * Umlaute richtig erkannt werden.
 */

import { formatProzent, gesamtErgebnis, note } from '../domain/scoring';
import type { Bewertung, Datenbestand, Person, Sprint, Team } from '../domain/types';

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
  sprints: Sprint[];
  bewertungen: Map<string, Bewertung>;
}

/** Erzeugt die Zeilen der Klassenübersicht. */
export function uebersichtZeilen(eingabe: UebersichtEingabe): Array<Array<string | number | null>> {
  const { daten, personen, teams, sprints, bewertungen } = eingabe;
  const kopf: Array<string> = [
    'Name',
    'Team',
    ...sprints.map((sprint) => `${sprint.name} (%)`),
    'Gesamt (%)',
    'Note',
  ];

  const zeilen: Array<Array<string | number | null>> = [kopf];

  for (const person of personen) {
    const teammitglieder = personen.filter((p) => p.teamId === person.teamId && person.teamId !== null);
    const ergebnis = gesamtErgebnis(person, sprints, teammitglieder, bewertungen, daten.rubrik);
    const team = teams.find((t) => t.id === person.teamId);

    zeilen.push([
      person.name,
      team?.name ?? '',
      ...ergebnis.proSprint.map((eintrag) =>
        eintrag.ergebnis.prozent === null ? '' : formatProzent(eintrag.ergebnis.prozent, 1),
      ),
      ergebnis.prozent === null ? '' : formatProzent(ergebnis.prozent, 1),
      note(ergebnis.prozent, daten.rubrik.notenschluessel) ?? '',
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
