/**
 * Auslieferungsvorlagen: Rubriken, Notenschlüssel, leerer Datenbestand.
 *
 * Die Kriterien sind bewusst so formuliert, dass sie gegenüber Schülerinnen
 * und Schülern begründbar sind (FA-09).
 */

import type { Datenbestand, Notenstufe, Rubrik, Strang } from './types';

export const SCHEMA_VERSION = 2;

/** Feste Kennungen der ausgelieferten Rubriken. */
export const RUBRIK_SPRINT = 'rubrik-sprint';
export const RUBRIK_DIPLOMARBEIT = 'rubrik-diplomarbeit';

/** Gewicht der beiden Stränge – drei von vier Wochenstunden gegen eine (FA-59). */
export const STRANG_GEWICHTE: Record<Strang, number> = { praxis: 75, theorie: 25 };

export const STANDARD_NOTENSCHLUESSEL: Notenstufe[] = [
  { note: 1, ab: 90, bezeichnung: 'Sehr gut' },
  { note: 2, ab: 80, bezeichnung: 'Gut' },
  { note: 3, ab: 65, bezeichnung: 'Befriedigend' },
  { note: 4, ab: 51, bezeichnung: 'Genügend' },
  { note: 5, ab: 0, bezeichnung: 'Nicht genügend' },
];

/** Rubrik für Sprints (Fachkonzept 8.1). */
export const VORLAGE_RUBRIK_SPRINT: Rubrik = {
  id: RUBRIK_SPRINT,
  name: 'Sprint',
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
  // Der Peer-Anteil trägt kein Kategoriegewicht: Er wirkt ab 0.3.0 als
  // gedeckelter Korrekturfaktor (FA-45, ADR-007).
  gewichte: { team: 45, prozess: 20, individuell: 35, peer: 0 },
  selbstZaehlt: false,
};

/** Rubrik für die Diplomarbeitsvorbereitung (Fachkonzept 8.8). */
export const VORLAGE_RUBRIK_DIPLOMARBEIT: Rubrik = {
  id: RUBRIK_DIPLOMARBEIT,
  name: 'Diplomarbeitsvorbereitung',
  team: [
    { id: 'd1', name: 'Themenqualität', beschreibung: 'Fachlicher Anspruch, Abgrenzung, Umsetzbarkeit im verfügbaren Zeitrahmen', max: 12 },
    { id: 'd2', name: 'Auftragsklarheit', beschreibung: 'Realer Auftraggeber vorhanden, seine Erwartung schriftlich festgehalten', max: 10 },
    { id: 'd3', name: 'Präsentation', beschreibung: 'Aufbau, Verständlichkeit, vereinbarte Zeit eingehalten', max: 8 },
  ],
  prozess: [
    { id: 'da-p1', name: 'Akquise', beschreibung: 'Eigenständige Suche, Beharrlichkeit nach Absagen, Qualität der Kontaktaufnahme', max: 8 },
    { id: 'da-p2', name: 'Absprachen festhalten', beschreibung: 'Gesprächsnotizen, Zusagen schriftlich, nachvollziehbar', max: 6 },
    { id: 'da-p3', name: 'Termintreue', beschreibung: 'Die Zwischenschritte bis zur Präsentation wurden gehalten', max: 6 },
  ],
  individuell: [
    { id: 'da-i1', name: 'Anteil an der Themenfindung', beschreibung: 'Eigener Beitrag zu Suche und Zuschnitt, im Verhältnis zum Team', max: 8 },
    { id: 'da-i2', name: 'Auftritt im Gremium', beschreibung: 'Eigener Redeanteil, Adressatenbezug', max: 7 },
    { id: 'da-i3', name: 'Rückfragen', beschreibung: 'Beantwortet fachlich und ohne Ausweichen', max: 6 },
    { id: 'da-i4', name: 'Risiken benennen', beschreibung: 'Kennt die Risiken des eigenen Themas und spricht sie von sich aus an', max: 4 },
  ],
  peer: [
    { id: 'da-q1', name: 'Verlässlichkeit', beschreibung: 'hält Zusagen ein', max: 5 },
    { id: 'da-q2', name: 'Fachlicher Beitrag', beschreibung: 'trägt zum Ergebnis bei', max: 5 },
    { id: 'da-q3', name: 'Zusammenarbeit', beschreibung: 'kommuniziert, hilft, nimmt Feedback an', max: 5 },
    { id: 'da-q4', name: 'Eigeninitiative', beschreibung: 'bringt von sich aus Aufgaben ein', max: 5 },
  ],
  gewichte: { team: 30, prozess: 20, individuell: 50, peer: 0 },
  selbstZaehlt: false,
};

/**
 * Rubrik eines Tests (Fachkonzept 3.6).
 *
 * Jeder Test bekommt eine **eigene** Rubrik, weil ihre Kriterien die Fragen
 * genau dieses Tests sind. Aufbau: drei Multiple-Choice-Fragen zu je 2 Punkten
 * und eine offene Frage zu 4 Punkten – 20/20/20/40.
 */
export function testRubrik(id: string, name: string): Rubrik {
  return {
    id,
    name,
    team: [],
    prozess: [],
    individuell: [
      { id: 'f1', name: 'Frage 1', beschreibung: 'Multiple Choice', max: 2 },
      { id: 'f2', name: 'Frage 2', beschreibung: 'Multiple Choice', max: 2 },
      { id: 'f3', name: 'Frage 3', beschreibung: 'Multiple Choice', max: 2 },
      {
        id: 'f4',
        name: 'Offene Frage',
        beschreibung: 'Anwendung auf eine neue Situation. Bewertungsschema 0–4 hier eintragen.',
        max: 4,
      },
    ],
    peer: [],
    gewichte: { team: 0, prozess: 0, individuell: 100, peer: 0 },
    selbstZaehlt: false,
  };
}

/** Die mit der Anwendung ausgelieferten Rubriken. */
export function vorlagenRubriken(): Rubrik[] {
  return [strukturKopie(VORLAGE_RUBRIK_SPRINT), strukturKopie(VORLAGE_RUBRIK_DIPLOMARBEIT)];
}

export function leererDatenbestand(): Datenbestand {
  return {
    schemaVersion: SCHEMA_VERSION,
    rubriken: vorlagenRubriken(),
    vorgabeRubrikId: RUBRIK_SPRINT,
    notenschluessel: strukturKopie(STANDARD_NOTENSCHLUESSEL),
    strangGewichte: { ...STRANG_GEWICHTE },
    klassen: [],
    teams: [],
    personen: [],
    abschnitte: [],
    zugehoerigkeiten: [],
    bewertungen: [],
  };
}

/** Tiefe Kopie über JSON – ausreichend, da der Bestand reines JSON ist. */
export function strukturKopie<T>(wert: T): T {
  return JSON.parse(JSON.stringify(wert)) as T;
}
