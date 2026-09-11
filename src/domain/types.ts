/**
 * Datenmodell der PRE/SYP-PRP-Bewertung.
 *
 * Siehe docs/solution-design.md, Abschnitt 5.
 * Dieses Modul ist frei von Abhängigkeiten zu React oder zum Browser.
 */

export type Id = string;

/** Ein Bewertungskriterium mit erreichbarer Punktezahl. */
export interface Kriterium {
  id: Id;
  name: string;
  beschreibung: string;
  /** Erreichbare Punkte. Bei Peer-Kriterien ohne Bedeutung (feste Skala 1–5). */
  max: number;
}

/** Die vier Kategorien der Rubrik (FA-05). */
export type KategorieSchluessel = 'team' | 'prozess' | 'individuell' | 'peer';

export interface Notenstufe {
  /** Note 1 bis 5. */
  note: 1 | 2 | 3 | 4 | 5;
  /** Untere Prozentgrenze, ab der diese Note gilt. */
  ab: number;
  bezeichnung: string;
}

export interface Rubrik {
  team: Kriterium[];
  prozess: Kriterium[];
  individuell: Kriterium[];
  peer: Kriterium[];
  /** Gewicht je Kategorie in Prozent; die Summe muss nicht 100 ergeben (FA-07). */
  gewichte: Record<KategorieSchluessel, number>;
  /** Zählt die Selbsteinschätzung in die Peer-Note (FA-15)? */
  selbstZaehlt: boolean;
  notenschluessel: Notenstufe[];
}

export interface Klasse {
  id: Id;
  name: string;
}

export interface Team {
  id: Id;
  klasseId: Id;
  name: string;
}

export interface Person {
  id: Id;
  klasseId: Id;
  /** null = noch keinem Team zugeordnet. */
  teamId: Id | null;
  name: string;
}

export interface Sprint {
  id: Id;
  klasseId: Id;
  nummer: number;
  name: string;
  von: string;
  bis: string;
  /** Sprintfaktor: Gewicht dieses Sprints im Gesamtergebnis (FA-24). */
  faktor: number;
}

/** Punkte je Kriterium. Ein fehlender Schlüssel bedeutet „nicht bewertet“. */
export type Punkte = Record<Id, number>;

/** Peer-Urteil: Wert 1–5 je Peer-Kriterium. */
export type PeerUrteil = Record<Id, number>;

export interface Einzelbewertung {
  punkte: Punkte;
  notiz: string;
}

/**
 * Bewertung eines Teams in einem Sprint.
 * Fachlicher Schlüssel ist die Kombination sprintId + teamId.
 */
export interface Bewertung {
  sprintId: Id;
  teamId: Id;
  team: Punkte;
  prozess: Punkte;
  individuell: Record<Id, Einzelbewertung>;
  /** peer[bewertendePersonId][bewertetePersonId][kriteriumId] = 1..5 */
  peer: Record<Id, Record<Id, PeerUrteil>>;
  notiz: string;
}

export interface Datenbestand {
  schemaVersion: number;
  rubrik: Rubrik;
  klassen: Klasse[];
  teams: Team[];
  personen: Person[];
  sprints: Sprint[];
  bewertungen: Bewertung[];
}

/* -------------------------------------------------------------------------- */
/* Ergebnisstrukturen der Berechnung                                          */
/* -------------------------------------------------------------------------- */

/** Ergebnis einer Kategorie; `null` bedeutet „nicht bewertet“ (FA-21). */
export interface Kategorieergebnis {
  prozent: number;
  erreicht: number;
  moeglich: number;
  /** Anzahl ausgefüllter Kriterien. */
  ausgefuellt: number;
  /** Anzahl Kriterien der Kategorie insgesamt. */
  gesamt: number;
}

export interface Peerergebnis {
  prozent: number;
  /** Anzahl der Personen, deren Urteil eingeflossen ist. */
  bewertende: number;
}

export interface Sprintergebnis {
  prozent: number | null;
  team: Kategorieergebnis | null;
  prozess: Kategorieergebnis | null;
  individuell: Kategorieergebnis | null;
  peer: Peerergebnis | null;
  /** Selbsteinschätzung in Prozent, unabhängig davon, ob sie in die Note zählt. */
  selbst: number | null;
  /** Bezeichnungen der Kategorien, zu denen noch nichts erfasst ist (FA-26). */
  fehlend: string[];
}

export interface Gesamtergebnis {
  prozent: number | null;
  proSprint: Array<{ sprint: Sprint; ergebnis: Sprintergebnis }>;
}
