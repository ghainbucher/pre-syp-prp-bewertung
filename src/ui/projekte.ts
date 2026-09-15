/**
 * Ableitungen für die Projektsicht (FA-87, FA-90, FA-91).
 *
 * Hier wird gefiltert, zusammengefasst und sortiert – nicht gerechnet und nicht
 * dargestellt (NFA-06). Die Sicht selbst bekommt fertige Zeilen.
 *
 * **Warum eine eigene Datei:** `auswahl.ts` hält die Auswahl gültig. Was ein
 * Projekt ist und welche Klassen darin vorkommen, ist eine andere Frage – und
 * eine, die sich mit FA-87 noch ändert.
 */

import { nurAktive } from '../domain/loeschen';
import { projektInKlasse } from '../domain/zuordnung';
import {
  abschnitteVonTeam,
  istLaufenderAbschnitt,
  kurzzeichen,
  planungVon,
  mitgliederVon,
  sprintZustand,
  zeitraumFuerTeam,
  ZUSTAND_BEZEICHNUNG,
  type Sprintzustand,
} from '../domain/zuordnung';
import type { Abschnitt, Datenbestand, Id, Person, Projekttyp, Team } from '../domain/types';

/** Klartext für die Projektart (FA-87 AK-2). */
export const ART_BEZEICHNUNG: Record<Projekttyp, string> = {
  'syp-pre-4': 'SYP/PRE 4. Jahrgang',
  'syp-pre-5': 'SYP/PRE 5. Jahrgang',
  diplomarbeit: 'Diplomarbeit',
};

/** Kurzform für Listen und Tabellen. */
export const ART_KURZ: Record<Projekttyp, string> = {
  'syp-pre-4': '4. Jg.',
  'syp-pre-5': '5. Jg.',
  diplomarbeit: 'DA',
};

/**
 * Der Jahrgang wird aus der Projektart **abgeleitet** und nicht eigens erfasst
 * (OP-F34).
 *
 * Eine Diplomarbeit entsteht im 5. Jahrgang; das ist keine Festlegung der
 * Anwendung, sondern die Lage im Unterricht. Fehlt die Art, ist der Jahrgang
 * unbekannt – dann fällt das Projekt aus dem Jahrgangsfilter heraus und wird
 * **nicht** stillschweigend einem Jahrgang zugeschlagen (ADR-004 sinngemäß).
 */
export function jahrgangVon(art: Projekttyp | undefined): 4 | 5 | null {
  if (art === 'syp-pre-4') return 4;
  if (art === 'syp-pre-5' || art === 'diplomarbeit') return 5;
  return null;
}

/**
 * Wer gehört zu diesem Projekt?
 *
 * Ab Schemastand 4 ist das eine einzige Frage an die Mitgliedschaften – die
 * Zuordnung gilt für das Projekt und nicht je Abschnitt (Fachkonzept 15.2, A8).
 */
export function mitgliederVonProjekt(daten: Datenbestand, teamId: Id): Person[] {
  return mitgliederVon(daten, teamId);
}

/** Eine Zeile der Sprintliste eines Projekts (FA-91 AK-2). */
export interface Sprintzeile {
  abschnitt: Abschnitt;
  /** Kürzel in der Zählweise dieses Projekts, etwa `S3` (FA-04 AK-5). */
  kurz: string;
  von: string;
  bis: string;
  ziel: string;
  zustand: Sprintzustand;
  zustandText: string;
  /** Heute liegt im Zeitraum dieses Projekts (FA-76 AK-1). */
  laufend: boolean;
}

/**
 * Die Sprints eines Projekts in ihrer Reihenfolge (FA-91 AK-1).
 *
 * `laufend` meint hier wirklich laufend: `istLaufenderAbschnitt` lässt einen
 * Abschnitt ohne Zeitraum bewusst offen, damit man nachtragen kann – für eine
 * Liste wäre „alle ohne Datum sind laufend“ aber irreführend. Deshalb zählt
 * hier nur ein vollständiger Zeitraum, in dem heute liegt.
 */
export function sprintzeilen(daten: Datenbestand, team: Team): Sprintzeile[] {
  return abschnitteVonTeam(daten, team.klasseId, team.id, 'sprint').map((abschnitt) => {
    const zeitraum = zeitraumFuerTeam(daten, abschnitt, team.id);
    const zustand = sprintZustand(daten, abschnitt.id, team.id);
    const vollstaendig = zeitraum.von.trim() !== '' && zeitraum.bis.trim() !== '';
    return {
      abschnitt,
      kurz: kurzzeichen(daten, abschnitt, team.id),
      von: zeitraum.von,
      bis: zeitraum.bis,
      ziel: planungVon(daten, abschnitt.id, team.id)?.ziel ?? '',
      zustand,
      zustandText: ZUSTAND_BEZEICHNUNG[zustand],
      laufend: vollstaendig && istLaufenderAbschnitt(daten, abschnitt, team.id),
    };
  });
}

/** Eine Zeile der Projektliste (FA-90, FA-84). */
export interface Projektzeile {
  team: Team;
  /** Klasse, in der das Projekt verwaltet wird. */
  klasseName: string;
  /** Klassen, aus denen die Mitglieder kommen – ohne Doppel, sortiert. */
  klassen: string[];
  /** Mehr als eine Klasse: der Diplomarbeitsfall (FA-90 AK-3). */
  gemischt: boolean;
  art: Projekttyp | null;
  jahrgang: 4 | 5 | null;
  mitglieder: Person[];
  sprints: Sprintzeile[];
  /**
   * Der Sprint, in dem das Projekt gerade steht (FA-84 AK-1).
   *
   * Der laufende, sonst der letzte nicht abgeschlossene, sonst der letzte
   * überhaupt. `null` heißt: noch kein Sprint angelegt.
   */
  aktuell: Sprintzeile | null;
}

export interface Projektfilter {
  /** `null` = alle Jahrgänge (FA-90 AK-1). */
  jahrgang: 4 | 5 | null;
  /**
   * Klassenkennung, `null` = alle Klassen (FA-90 AK-2, FA-95).
   *
   * Kommt aus der **Kopfleiste** und nicht aus einem eigenen Bedienelement
   * dieser Sicht: Der Klassenfilter gilt für die ganze Anwendung, und er muss
   * dort stehen, wo er auf jeder Sicht zu sehen ist.
   */
  klasse: Id | null;
  /**
   * Nur gemischte Projekte zeigen (FA-90 AK-3).
   *
   * Steht getrennt von der Klasse, weil „gemischt" **kein Klassenwert** ist,
   * sondern eine Eigenschaft: mehr als eine Klasse. Beides zusammen ist
   * sinnvoll – „gemischte Projekte, an denen die 4AHIF beteiligt ist".
   */
  nurGemischt: boolean;
  /** Freitext über Projektname, Repository und Klassen. */
  suche: string;
}

export const FILTER_LEER: Projektfilter = {
  jahrgang: null,
  klasse: null,
  nurGemischt: false,
  suche: '',
};

/**
 * Ein Projekt ist **gemischt**, wenn seine Mitglieder aus mehr als einer Klasse
 * kommen (FA-90 AK-3).
 *
 * Abgeleitet und nicht erfasst: Solange `Team.klasseId` Pflicht ist, wäre ein
 * eigenes Kennzeichen eine zweite Wahrheit. Bis FA-87 umgesetzt ist, bleibt die
 * Klasse des Projekts seine Heimatklasse – die Angabe „gemischt“ kommt aus den
 * Menschen und ist damit immer richtig.
 */
export function projektzeile(daten: Datenbestand, team: Team): Projektzeile {
  const mitglieder = mitgliederVonProjekt(daten, team.id);
  const namen = new Set<string>();
  for (const person of mitglieder) {
    namen.add(daten.klassen.find((k) => k.id === person.klasseId)?.name ?? '(ohne Klasse)');
  }
  const klassen = [...namen].sort((a, b) => a.localeCompare(b, 'de'));
  const sprints = sprintzeilen(daten, team);
  const laufend = sprints.find((s) => s.laufend);
  const offen = [...sprints].reverse().find((s) => s.zustand !== 'abgeschlossen');
  return {
    team,
    klasseName: daten.klassen.find((k) => k.id === team.klasseId)?.name ?? '(ohne Klasse)',
    klassen,
    gemischt: klassen.length > 1,
    art: team.typ ?? null,
    jahrgang: jahrgangVon(team.typ),
    mitglieder,
    sprints,
    aktuell: laufend ?? offen ?? sprints[sprints.length - 1] ?? null,
  };
}

/**
 * Alle Projekte, gefiltert und sortiert (FA-90).
 *
 * Sortiert nach Klasse und dann nach Name: Wer eine Klasse im Kopf hat, findet
 * ihre Projekte beieinander. Gemischte Projekte stehen bei ihrer Heimatklasse.
 */
export function projektzeilen(daten: Datenbestand, filter: Projektfilter): Projektzeile[] {
  const gesucht = filter.suche.trim().toLowerCase();
  // Logisch gelöschte Projekte fallen hier heraus und damit aus jeder Liste
  // und jedem Filter (FA-94).
  return nurAktive(daten.teams)
    .map((team) => projektzeile(daten, team))
    .filter((zeile) => {
      if (filter.jahrgang !== null && zeile.jahrgang !== filter.jahrgang) return false;
      if (filter.nurGemischt && !zeile.gemischt) return false;
      // Dieselbe Regel wie überall: Ein Projekt gehört zu der Klasse, aus der
      // seine Mitglieder kommen (`projektInKlasse`). Ein gemischtes Projekt
      // steht damit in beiden Klassen – und verschwindet nicht aus der Sicht
      // der zweiten.
      if (!projektInKlasse(daten, zeile.team, filter.klasse)) return false;
      if (gesucht === '') return true;
      const felder = [zeile.team.name, zeile.team.repository ?? '', ...zeile.klassen];
      return felder.some((feld) => feld.toLowerCase().includes(gesucht));
    })
    .sort(
      (a, b) =>
        a.klasseName.localeCompare(b.klasseName, 'de') ||
        a.team.name.localeCompare(b.team.name, 'de'),
    );
}
