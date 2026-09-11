/**
 * Auslieferungsvorlage der Rubrik (FA-09) und leerer Datenbestand.
 *
 * Die Kriterien sind auf Softwareprojekte in Sprints zugeschnitten und
 * bewusst so formuliert, dass sie gegenüber Schülerinnen und Schülern
 * begründbar sind.
 */

import type { Datenbestand, Rubrik } from './types';

export const SCHEMA_VERSION = 1;

export const VORLAGE_RUBRIK: Rubrik = {
  team: [
    { id: 't1', name: 'Funktionalität', beschreibung: 'Sprint-Ziel erreicht, User Stories erfüllen die Akzeptanzkriterien', max: 10 },
    { id: 't2', name: 'Code-Qualität', beschreibung: 'Struktur, Namensgebung, Wiederverwendbarkeit, Einhaltung der Coding-Standards', max: 10 },
    { id: 't3', name: 'Tests', beschreibung: 'Unit-Tests für neue Features, sinnvolle Testfälle, lauffähiger Testlauf', max: 8 },
    { id: 't4', name: 'Dokumentation', beschreibung: 'README, Architekturskizze, Kommentare, Änderungsprotokoll', max: 6 },
    { id: 't5', name: 'Versionsverwaltung', beschreibung: 'Aussagekräftige Commits, Branch-Strategie, Pull Requests mit Review', max: 6 },
    { id: 't6', name: 'Sprint Review', beschreibung: 'Demo läuft, Ergebnisse werden nachvollziehbar präsentiert', max: 5 },
  ],
  prozess: [
    { id: 'p1', name: 'Sprint Planning', beschreibung: 'Stories geschätzt, Sprint Backlog realistisch gefüllt', max: 5 },
    { id: 'p2', name: 'Daily Standup', beschreibung: 'Regelmäßig, kurz, Hindernisse werden benannt', max: 5 },
    { id: 'p3', name: 'Backlog-Pflege', beschreibung: 'Stories mit Akzeptanzkriterien, Priorisierung, Definition of Done', max: 5 },
    { id: 'p4', name: 'Board & Transparenz', beschreibung: 'Board aktuell, Burndown bzw. Velocity gepflegt', max: 5 },
    { id: 'p5', name: 'Retrospektive', beschreibung: 'Maßnahmen abgeleitet und im Folgesprint sichtbar umgesetzt', max: 5 },
  ],
  individuell: [
    { id: 'i1', name: 'Umfang & Schwierigkeit', beschreibung: 'Anspruch der übernommenen Aufgaben im Verhältnis zum Team', max: 10 },
    { id: 'i2', name: 'Selbstständigkeit', beschreibung: 'Löst Probleme eigenständig, holt gezielt Hilfe', max: 8 },
    { id: 'i3', name: 'Termintreue', beschreibung: 'Zugesagte Stories sind am Sprint-Ende fertig', max: 6 },
    { id: 'i4', name: 'Beitrag zum Team', beschreibung: 'Code Reviews, Unterstützung anderer, Kommunikation', max: 6 },
  ],
  peer: [
    { id: 'q1', name: 'Verlässlichkeit', beschreibung: 'hält Zusagen ein', max: 5 },
    { id: 'q2', name: 'Fachlicher Beitrag', beschreibung: 'trägt zum Ergebnis bei', max: 5 },
    { id: 'q3', name: 'Zusammenarbeit', beschreibung: 'kommuniziert, hilft, nimmt Feedback an', max: 5 },
    { id: 'q4', name: 'Eigeninitiative', beschreibung: 'bringt von sich aus Aufgaben ein', max: 5 },
  ],
  gewichte: { team: 40, prozess: 15, individuell: 35, peer: 10 },
  selbstZaehlt: false,
  notenschluessel: [
    { note: 1, ab: 90, bezeichnung: 'Sehr gut' },
    { note: 2, ab: 80, bezeichnung: 'Gut' },
    { note: 3, ab: 65, bezeichnung: 'Befriedigend' },
    { note: 4, ab: 51, bezeichnung: 'Genügend' },
    { note: 5, ab: 0, bezeichnung: 'Nicht genügend' },
  ],
};

export function leererDatenbestand(): Datenbestand {
  return {
    schemaVersion: SCHEMA_VERSION,
    rubrik: strukturKopie(VORLAGE_RUBRIK),
    klassen: [],
    teams: [],
    personen: [],
    sprints: [],
    bewertungen: [],
  };
}

/** Tiefe Kopie über JSON – ausreichend, da der Bestand reines JSON ist. */
export function strukturKopie<T>(wert: T): T {
  return JSON.parse(JSON.stringify(wert)) as T;
}
