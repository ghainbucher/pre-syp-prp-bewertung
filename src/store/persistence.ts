/**
 * Laden, Speichern, Migrieren und Sichern des Datenbestands.
 *
 * Umsetzung von FA-33, NFA-03 (nur lokal), NFA-09 (robust gegen beschädigte Daten)
 * und DS-03 (vollständiger Export und vollständige Löschung).
 */

import { SCHEMA_VERSION, VORLAGE_RUBRIK, leererDatenbestand, strukturKopie } from '../domain/defaults';
import type { Datenbestand, Rubrik } from '../domain/types';

export const SPEICHER_SCHLUESSEL = 'pre-syp-prp.data.v1';
const SICHERUNG_PRAEFIX = 'pre-syp-prp.data.backup.';

export interface Ladeergebnis {
  daten: Datenbestand;
  /** Meldung, wenn der gespeicherte Bestand nicht verwendet werden konnte. */
  warnung: string | null;
}

/** Prüft grob, ob ein gelesenes Objekt ein Datenbestand sein kann. */
function istDatenbestand(wert: unknown): wert is Datenbestand {
  if (typeof wert !== 'object' || wert === null) return false;
  const kandidat = wert as Partial<Datenbestand>;
  return (
    Array.isArray(kandidat.klassen) &&
    Array.isArray(kandidat.teams) &&
    Array.isArray(kandidat.personen) &&
    Array.isArray(kandidat.sprints) &&
    Array.isArray(kandidat.bewertungen) &&
    typeof kandidat.rubrik === 'object' &&
    kandidat.rubrik !== null
  );
}

/** Ergänzt fehlende Felder einer Rubrik aus der Vorlage. */
function rubrikVervollstaendigen(rubrik: Partial<Rubrik> | undefined): Rubrik {
  const vorlage = strukturKopie(VORLAGE_RUBRIK);
  if (!rubrik) return vorlage;
  return {
    team: rubrik.team ?? vorlage.team,
    prozess: rubrik.prozess ?? vorlage.prozess,
    individuell: rubrik.individuell ?? vorlage.individuell,
    peer: rubrik.peer ?? vorlage.peer,
    gewichte: { ...vorlage.gewichte, ...(rubrik.gewichte ?? {}) },
    selbstZaehlt: rubrik.selbstZaehlt ?? vorlage.selbstZaehlt,
    notenschluessel: rubrik.notenschluessel?.length
      ? rubrik.notenschluessel
      : vorlage.notenschluessel,
  };
}

/**
 * Hebt einen älteren Bestand auf die aktuelle Schemaversion.
 *
 * Bei jeder Schemaänderung kommt hier ein Schritt dazu; der Bestand wird nie
 * verworfen, solange er lesbar ist.
 */
export function migriere(roh: Datenbestand): Datenbestand {
  const daten = strukturKopie(roh);
  daten.rubrik = rubrikVervollstaendigen(daten.rubrik);
  daten.sprints = daten.sprints.map((sprint) => ({
    ...sprint,
    faktor: typeof sprint.faktor === 'number' && Number.isFinite(sprint.faktor) ? sprint.faktor : 1,
  }));
  daten.bewertungen = daten.bewertungen.map((bewertung) => ({
    ...bewertung,
    team: bewertung.team ?? {},
    prozess: bewertung.prozess ?? {},
    individuell: bewertung.individuell ?? {},
    peer: bewertung.peer ?? {},
    notiz: bewertung.notiz ?? '',
  }));
  daten.schemaVersion = SCHEMA_VERSION;
  return daten;
}

/** Liest den Bestand aus dem übergebenen Speicher (Vorgabe: localStorage). */
export function laden(speicher: Storage | undefined = sicherenSpeicher()): Ladeergebnis {
  if (!speicher) {
    return {
      daten: leererDatenbestand(),
      warnung: 'Dieser Browser erlaubt keine lokale Speicherung. Änderungen gehen beim Schließen verloren.',
    };
  }

  const roh = speicher.getItem(SPEICHER_SCHLUESSEL);
  if (!roh) return { daten: leererDatenbestand(), warnung: null };

  try {
    const gelesen: unknown = JSON.parse(roh);
    if (!istDatenbestand(gelesen)) throw new Error('unerwartete Struktur');
    return { daten: migriere(gelesen), warnung: null };
  } catch {
    // NFA-09: Der beschädigte Stand wird nicht überschrieben, sondern beiseitegelegt.
    const name = `${SICHERUNG_PRAEFIX}${new Date().toISOString()}`;
    try {
      speicher.setItem(name, roh);
    } catch {
      /* Speicher voll – die Warnung genügt. */
    }
    return {
      daten: leererDatenbestand(),
      warnung: `Der gespeicherte Datenbestand war nicht lesbar. Er wurde unter „${name}“ gesichert; die Anwendung startet leer.`,
    };
  }
}

/** Schreibt den Bestand. Gibt zurück, ob das Speichern gelungen ist. */
export function speichern(daten: Datenbestand, speicher: Storage | undefined = sicherenSpeicher()): boolean {
  if (!speicher) return false;
  try {
    speicher.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(daten));
    return true;
  } catch {
    return false;
  }
}

/** Entfernt den Bestand vollständig (DS-03). */
export function loeschen(speicher: Storage | undefined = sicherenSpeicher()): void {
  speicher?.removeItem(SPEICHER_SCHLUESSEL);
}

/** Erzeugt den Inhalt einer Sicherungsdatei (FA-33). */
export function alsSicherung(daten: Datenbestand): string {
  return JSON.stringify(daten, null, 2);
}

/** Liest eine Sicherungsdatei. Wirft bei ungültigem Inhalt. */
export function ausSicherung(text: string): Datenbestand {
  const gelesen: unknown = JSON.parse(text);
  if (!istDatenbestand(gelesen)) {
    throw new Error('Die Datei enthält keinen gültigen Datenbestand dieser Anwendung.');
  }
  return migriere(gelesen);
}

/** Dateiname für die Sicherung, mit Datum. */
export function sicherungsDateiname(datum = new Date()): string {
  const iso = datum.toISOString().slice(0, 10);
  return `pre-syp-prp-${iso}.json`;
}

/**
 * localStorage, sofern verfügbar.
 *
 * In privaten Fenstern oder bei gesperrtem Speicher wirft schon der Zugriff –
 * die Anwendung muss dann ohne Speicher arbeiten (NFA-09).
 */
function sicherenSpeicher(): Storage | undefined {
  try {
    if (typeof localStorage === 'undefined') return undefined;
    const probe = '__pre-syp-prp_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return undefined;
  }
}
