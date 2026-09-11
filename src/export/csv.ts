/**
 * CSV-Export der Klassenübersicht (FA-31).
 *
 * Trennzeichen ist der Strichpunkt und das Dezimaltrennzeichen das Komma,
 * damit die Datei in einer deutschsprachigen Excel-Installation ohne
 * Importdialog korrekt öffnet. Das vorangestellte BOM sorgt dafür, dass
 * Umlaute richtig erkannt werden.
 */

import { formatProzent, gesamtErgebnis, notenvorschlag } from '../domain/scoring';
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
  /** Stichtag der Auswertung; `null` = gesamter Durchgang (FA-48 AK-1). */
  stichtagId?: string | null;
}

/**
 * Erzeugt die Zeilen der Klassenübersicht (FA-31).
 *
 * Die Spalte „Team“ nennt die Zuordnung im **letzten** Abschnitt, weil Teams
 * wechseln dürfen (FA-58); die Abschnittsspalten stehen für sich. Die Spalte
 * „Sperre“ nennt den Strang, der den Vorschlag auf Nicht genügend gesetzt hat
 * (FA-61 AK-2) – sonst widerspräche der Export dem, was am Bildschirm steht.
 */
export function uebersichtZeilen(eingabe: UebersichtEingabe): Array<Array<string | number | null>> {
  const { daten, personen, teams, abschnitte, bewertungen, stichtagId = null } = eingabe;
  const kopf: Array<string> = [
    'Name',
    'Team',
    ...abschnitte.map((abschnitt) => `${abschnitt.name} (%)`),
    'Praxis (%)',
    'Theorie (%)',
    'Gesamt (%)',
    'Notenvorschlag',
    'Sperre',
    'Notenstand',
  ];

  const zeilen: Array<Array<string | number | null>> = [kopf];
  const letzter = abschnitte[abschnitte.length - 1];

  for (const person of personen) {
    const ergebnis = gesamtErgebnis(daten, person, bewertungen, stichtagId);
    const vorschlag = notenvorschlag(ergebnis, daten.notenschluessel, daten.sperreAktiv);
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
      vorschlag.note ?? '',
      vorschlag.gesperrtDurch === 'praxis'
        ? 'Praxis negativ'
        : vorschlag.gesperrtDurch === 'theorie'
          ? 'Theorie negativ'
          : '',
      // FA-49: die eingetragene Note – die einzige Ziffer, die nicht gerechnet ist.
      ergebnis.notenstand?.note ?? '',
    ]);
  }

  return zeilen;
}

/** Vereinfacht einen Namen auf dateisystemtaugliche Zeichen. */
function sauber(text: string, ersatz: string): string {
  return text.trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '') || ersatz;
}

/**
 * Dateiname des Exports, abgeleitet von Klasse und Stichtag.
 *
 * Der Stichtag gehört in den Namen: Ein Semesterexport und ein Jahresexport
 * desselben Tages hießen sonst gleich und überschrieben einander.
 */
export function csvDateiname(
  klassenname: string,
  datum = new Date(),
  stichtagsname?: string,
): string {
  const teile = [sauber(klassenname, 'Klasse')];
  if (stichtagsname?.trim()) teile.push(sauber(stichtagsname, 'Stichtag'));
  return `pre-syp-prp-${teile.join('-')}-${datum.toISOString().slice(0, 10)}.csv`;
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
