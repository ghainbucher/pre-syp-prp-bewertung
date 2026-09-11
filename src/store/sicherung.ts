/**
 * Stand und Erinnerung der Datensicherung (FA-46, Vorbereitung für FA-64).
 *
 * Die Regel, *wann* erinnert wird, steht hier als reine Funktion und nicht in
 * einer Komponente – sonst wäre sie ohne Oberfläche nicht prüfbar (NFA-06).
 *
 * Der Stand liegt in einem eigenen Speicherschlüssel, getrennt vom
 * Datenbestand: Er ist eine Aussage *über* den Bestand und darf beim Einlesen
 * einer Sicherung nicht mitwandern – sonst behauptete eine eingelesene Datei,
 * es sei bereits gesichert worden.
 */

import type { Datenbestand } from '../domain/types';

export const SICHERUNGSSTAND_SCHLUESSEL = 'pre-syp-prp.sicherung.v1';

/** Schwelle für den deutlicheren Hinweis (FA-46 AK-5). */
export const DRINGEND_AB_TAGEN = 3;

export interface Sicherungsumfang {
  klassen: number;
  personen: number;
  abschnitte: number;
  bewertungen: number;
}

/**
 * Zustand der automatischen Sicherung (FA-64).
 *
 * `freigabe` ist der Fall nach einem Neuladen: Der Ordner ist eingerichtet,
 * die Schreibberechtigung muss aber einmal je Sitzung bestätigt werden
 * (FA-64 AK-6). Das ist kein Fehler, verlangt aber einen Klick – und darf
 * deshalb nicht als „läuft“ dargestellt werden.
 */
export type Automatik = 'aus' | 'ok' | 'fehler' | 'freigabe';

export interface Sicherungsstand {
  /** Zeitpunkt der letzten erzeugten Sicherung, ISO. */
  zuletztAm: string | null;
  /** Umfang der letzten Sicherung (FA-46 AK-3). */
  umfang: Sicherungsumfang | null;
  /** Zeitpunkt der letzten Änderung am Bestand, ISO. */
  zuletztGeaendertAm: string | null;
  automatisch: Automatik;
  /** Name des gewählten Zielordners, nur zur Anzeige (FA-64 AK-1). */
  ordnerName: string | null;
  /** Klartext des letzten Fehlschlags der Automatik (FA-64 AK-5). */
  fehlermeldung: string | null;
}

export type Hinweisstufe = 'hinweis' | 'dringend';

export interface Sicherungshinweis {
  stufe: Hinweisstufe;
  text: string;
}

export function leererSicherungsstand(): Sicherungsstand {
  return {
    zuletztAm: null,
    umfang: null,
    zuletztGeaendertAm: null,
    automatisch: 'aus',
    ordnerName: null,
    fehlermeldung: null,
  };
}

/** Der Tag eines Zeitpunkts in Ortszeit – nicht `toISOString`, das rechnet in UTC. */
export function tagesschluessel(datum: Date): string {
  const zahl = (wert: number) => String(wert).padStart(2, '0');
  return `${datum.getFullYear()}-${zahl(datum.getMonth() + 1)}-${zahl(datum.getDate())}`;
}

/** Volle Kalendertage zwischen zwei Zeitpunkten, in Ortszeit gerechnet. */
export function tageDazwischen(frueher: Date, spaeter: Date): number {
  const tag = (datum: Date) => Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate());
  return Math.round((tag(spaeter) - tag(frueher)) / 86_400_000);
}

export function umfangVon(daten: Datenbestand): Sicherungsumfang {
  return {
    klassen: daten.klassen.length,
    personen: daten.personen.length,
    abschnitte: daten.abschnitte.length,
    bewertungen: daten.bewertungen.length,
  };
}

const EINHEITEN: Array<[keyof Sicherungsumfang, string, string]> = [
  ['klassen', 'Klasse', 'Klassen'],
  ['personen', 'Person', 'Personen'],
  ['abschnitte', 'Abschnitt', 'Abschnitte'],
  ['bewertungen', 'Bewertung', 'Bewertungen'],
];

/** „1 Klasse, 24 Personen, 3 Abschnitte“ – Zähler ohne Inhalt bleiben weg. */
export function umfangText(umfang: Sicherungsumfang | null): string {
  if (!umfang) return '';
  const teile = EINHEITEN.filter(([schluessel]) => umfang[schluessel] > 0).map(
    ([schluessel, eins, viele]) => `${umfang[schluessel]} ${umfang[schluessel] === 1 ? eins : viele}`,
  );
  return teile.length > 0 ? teile.join(', ') : 'leerer Bestand';
}

/** „11.09.2026, 08:12“ */
export function zeitpunktText(iso: string | null): string {
  if (!iso) return 'noch nie';
  const datum = new Date(iso);
  if (Number.isNaN(datum.getTime())) return 'unbekannt';
  const zahl = (wert: number) => String(wert).padStart(2, '0');
  return `${zahl(datum.getDate())}.${zahl(datum.getMonth() + 1)}.${datum.getFullYear()}, ${zahl(datum.getHours())}:${zahl(datum.getMinutes())}`;
}

/**
 * Eine Zeile für die dauerhafte Anzeige in der Fußzeile (FA-46 AK-3, FA-64 AK-4).
 *
 * Ausdrücklich der Zeitpunkt der letzten **erfolgreichen** Sicherung – ein
 * Zeitstempel, der auch nach einem Fehlschlag weiterliefe, wäre schlimmer als
 * keiner (ADR-011).
 */
export function standText(stand: Sicherungsstand): string {
  if (!stand.zuletztAm) return 'noch keine Sicherung erstellt';
  const umfang = umfangText(stand.umfang);
  return `zuletzt gesichert: ${zeitpunktText(stand.zuletztAm)}${umfang ? ` · ${umfang}` : ''}`;
}

/** Zustand der Automatik in einem Satz, für die Fußzeile (FA-64 AK-4). */
export function automatikText(stand: Sicherungsstand): string {
  switch (stand.automatisch) {
    case 'ok':
      return `Automatische Sicherung in „${stand.ordnerName ?? 'gewählter Ordner'}“ läuft.`;
    case 'freigabe':
      return `Der Ordner „${stand.ordnerName ?? 'gewählter Ordner'}“ ist eingerichtet, die Schreibberechtigung ist für diese Sitzung noch zu bestätigen.`;
    case 'fehler':
      return `Automatische Sicherung fehlgeschlagen: ${stand.fehlermeldung ?? 'unbekannter Grund'}`;
    default:
      return 'Keine automatische Sicherung eingerichtet.';
  }
}

/**
 * Ob und wie deutlich an die Sicherung erinnert wird (FA-46).
 *
 * Gibt `null` zurück, wenn nichts zu erinnern ist. Die Entscheidung hängt an
 * drei Größen: Wurde heute gearbeitet, wann wurde zuletzt gesichert, und wie
 * steht es um die automatische Sicherung.
 */
export function sicherungsHinweis(stand: Sicherungsstand, jetzt = new Date()): Sicherungshinweis | null {
  // AK-6: Eine fehlgeschlagene Automatik ist der lauteste Fall – sie sieht
  // sonst niemand, weil man sich auf sie verlässt.
  if (stand.automatisch === 'fehler') {
    const grund = stand.fehlermeldung ? ` (${stand.fehlermeldung})` : '';
    return {
      stufe: 'dringend',
      text: `Die automatische Sicherung ist fehlgeschlagen${grund}. ${standText(stand)}. Bitte jetzt von Hand sichern.`,
    };
  }

  const heute = tagesschluessel(jetzt);
  const heuteGeaendert = stand.zuletztGeaendertAm
    ? tagesschluessel(new Date(stand.zuletztGeaendertAm)) === heute
    : false;
  const heuteGesichert = stand.zuletztAm
    ? tagesschluessel(new Date(stand.zuletztAm)) === heute
    : false;

  // FA-64 AK-6: Der Ordner steht, aber die Berechtigung fehlt für diese
  // Sitzung. Solange nichts geändert wurde, ist das nicht dringend – sobald
  // gearbeitet wird, schon: es wird sonst nichts geschrieben.
  if (stand.automatisch === 'freigabe') {
    if (!heuteGeaendert) return null;
    return {
      stufe: 'hinweis',
      text: `Die automatische Sicherung wartet auf die Freigabe des Ordners „${stand.ordnerName ?? 'gewählter Ordner'}“. Bis dahin wird nichts geschrieben.`,
    };
  }

  // AK-6: läuft die Automatik und hat heute geschrieben, entfällt der Hinweis.
  if (stand.automatisch === 'ok' && heuteGesichert) return null;

  // AK-1: Ohne Änderung am laufenden Tag gibt es nichts zu erinnern.
  if (!heuteGeaendert) return null;
  if (heuteGesichert) return null;

  if (!stand.zuletztAm) {
    return {
      stufe: 'dringend',
      text: 'Heute wurde gearbeitet und es gibt noch keine Sicherung. Ein gelöschter Browserspeicher nimmt alles mit.',
    };
  }

  const tage = tageDazwischen(new Date(stand.zuletztAm), jetzt);
  if (tage > DRINGEND_AB_TAGEN) {
    return {
      stufe: 'dringend',
      text: `Die letzte Sicherung liegt ${tage} Tage zurück (${standText(stand)}). Bitte heute sichern.`,
    };
  }

  return {
    stufe: 'hinweis',
    text: `Heute wurde gearbeitet, aber noch nicht gesichert. ${standText(stand)}.`,
  };
}

/* -------------------------------------------------------------------------- */
/* Fortschreiben                                                              */
/* -------------------------------------------------------------------------- */

export function aenderungVermerken(stand: Sicherungsstand, jetzt = new Date()): Sicherungsstand {
  return { ...stand, zuletztGeaendertAm: jetzt.toISOString() };
}

export function sicherungVermerken(
  stand: Sicherungsstand,
  daten: Datenbestand,
  jetzt = new Date(),
): Sicherungsstand {
  return { ...stand, zuletztAm: jetzt.toISOString(), umfang: umfangVon(daten) };
}

/* -------------------------------------------------------------------------- */
/* Ablage                                                                     */
/* -------------------------------------------------------------------------- */

function sichererSpeicher(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function standLesen(speicher: Storage | undefined = sichererSpeicher()): Sicherungsstand {
  if (!speicher) return leererSicherungsstand();
  try {
    const roh = speicher.getItem(SICHERUNGSSTAND_SCHLUESSEL);
    if (!roh) return leererSicherungsstand();
    const gelesen = JSON.parse(roh) as Partial<Sicherungsstand>;
    return { ...leererSicherungsstand(), ...gelesen };
  } catch {
    return leererSicherungsstand();
  }
}

export function standSchreiben(
  stand: Sicherungsstand,
  speicher: Storage | undefined = sichererSpeicher(),
): void {
  try {
    speicher?.setItem(SICHERUNGSSTAND_SCHLUESSEL, JSON.stringify(stand));
  } catch {
    /* Ohne Speicher geht der Stand beim Neuladen verloren – kein Fehlerfall. */
  }
}

/** Entfernt den Stand mit (DS-03). */
export function standLoeschen(speicher: Storage | undefined = sichererSpeicher()): void {
  speicher?.removeItem(SICHERUNGSSTAND_SCHLUESSEL);
}
