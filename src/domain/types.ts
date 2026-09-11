/**
 * Datenmodell der PRE/SYP-PRP-Bewertung.
 *
 * Siehe docs/solution-design.md, Abschnitt 5. Dieses Modul ist frei von
 * Abhängigkeiten zu React oder zum Browser.
 *
 * Schemastand 2 (FA-55 bis FA-60, FA-65): Der **Abschnitt** trägt das Modell,
 * nicht mehr der Sprint. Ein Sprint ist ein Abschnitt, die
 * Diplomarbeitsvorbereitung ist einer, ein Test ist einer.
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

/** Die vier Kategorien einer Rubrik (FA-05). */
export type KategorieSchluessel = 'team' | 'prozess' | 'individuell' | 'peer';

/** Die beiden Stränge des Gegenstands (FA-59, Fachkonzept 3.5). */
export type Strang = 'praxis' | 'theorie';

/**
 * Art eines Abschnitts (FA-56 AK-1, FA-60 AK-1).
 *
 * Die Art bestimmt **nur** die vorgeschlagene Rubrik und die Beschriftung in
 * der Oberfläche – niemals die Rechenlogik (FA-56 AK-3).
 */
export type Abschnittsart = 'sprint' | 'diplomarbeit' | 'test';

export interface Notenstufe {
  /** Note 1 bis 5. */
  note: 1 | 2 | 3 | 4 | 5;
  /** Untere Prozentgrenze, ab der diese Note gilt. */
  ab: number;
  bezeichnung: string;
}

/**
 * Ein Satz Kriterien mit Gewichten (FA-55).
 *
 * Der Notenschlüssel gehört **nicht** hierher: Er gilt für den ganzen
 * Gegenstand und steht im Datenbestand.
 */
export interface Rubrik {
  id: Id;
  name: string;
  team: Kriterium[];
  prozess: Kriterium[];
  individuell: Kriterium[];
  peer: Kriterium[];
  /** Gewicht je Kategorie in Prozent; die Summe muss nicht 100 ergeben (FA-07). */
  gewichte: Record<KategorieSchluessel, number>;
  /** Zählt die Selbsteinschätzung in die Peer-Note (FA-15)? */
  selbstZaehlt: boolean;
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
  name: string;
  /**
   * Vorbelegung für neu angelegte Abschnitte – **nicht** die gültige
   * Zuordnung. Maßgeblich ist die Zugehörigkeit je Abschnitt (FA-58); dieses
   * Feld dient nur als Ausgangswert, solange für einen Abschnitt noch keine
   * Zugehörigkeit eingetragen ist. `null` = keinem Team zugeordnet.
   */
  teamId: Id | null;
}

/** Wer war in welchem Abschnitt in welchem Team (FA-58). */
export interface Zugehoerigkeit {
  abschnittId: Id;
  personId: Id;
  /** `null` = in diesem Abschnitt keinem Team zugeordnet (FA-58 AK-3). */
  teamId: Id | null;
}

/**
 * Ein Beurteilungsabschnitt: Sprint, Diplomarbeitsvorbereitung oder Test.
 *
 * Alle Arten verhalten sich in Erfassung und Rechnung gleich (FA-56 AK-2).
 */
export interface Abschnitt {
  id: Id;
  klasseId: Id;
  nummer: number;
  name: string;
  art: Abschnittsart;
  strang: Strang;
  /** Rubrik, nach der bewertet wird, solange nicht eingefroren (FA-55 AK-2). */
  rubrikId: Id;
  /**
   * Ab dem ersten Punkteintrag: vollständige Kopie der damals geltenden
   * Rubrik (FA-65). Sobald sie existiert, ist **sie** maßgeblich – nie mehr
   * die aktuelle Rubrik.
   */
  rubrikKopie?: Rubrik;
  /** Zeitpunkt des Einfrierens (FA-65 AK-5). */
  eingefrorenAm?: string;
  von: string;
  bis: string;
  /** Eigenart des Abschnitts: Vorgabe 1, Lernsprint 0,5 (FA-04, FA-24). */
  faktor: number;
  /** Findet in diesem Abschnitt eine Peer-Bewertung statt (FA-52)? */
  peerAktiv: boolean;
  /** Nur bei Tests: Ankündigung nach § 8 LBVO (FA-60 AK-5). */
  angekuendigtAm?: string;
  /** Nur bei Tests: Arbeitszeit in Minuten (FA-60 AK-5, FA-62). */
  arbeitszeitMinuten?: number;
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
 * Bewertung eines Teams in einem Abschnitt.
 *
 * Fachlicher Schlüssel ist die Kombination abschnittId + teamId. Bei einem
 * Test gibt es kein Team: Dort ist `teamId` null, und die Punkte je Person
 * stehen in `individuell` (FA-60 AK-3).
 */
export interface Bewertung {
  abschnittId: Id;
  teamId: Id | null;
  team: Punkte;
  prozess: Punkte;
  individuell: Record<Id, Einzelbewertung>;
  /** peer[bewertendePersonId][bewertetePersonId][kriteriumId] = 1..5 */
  peer: Record<Id, Record<Id, PeerUrteil>>;
  notiz: string;
}

export interface Datenbestand {
  schemaVersion: number;
  /** Mehrere Rubriken, eine je Abschnitt zuordenbar (FA-55). */
  rubriken: Rubrik[];
  /** Rubrik für neue Abschnitte ohne eigene Zuordnung (FA-55 AK-2). */
  vorgabeRubrikId: Id;
  /** Gilt für den ganzen Gegenstand, nicht je Rubrik (FA-25). */
  notenschluessel: Notenstufe[];
  /** Gewicht der beiden Stränge, Vorgabe 75/25 (FA-59 AK-3). */
  strangGewichte: Record<Strang, number>;
  klassen: Klasse[];
  teams: Team[];
  personen: Person[];
  abschnitte: Abschnitt[];
  zugehoerigkeiten: Zugehoerigkeit[];
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

/** Ergebnis einer Person in einem Abschnitt (FA-23). */
export interface Abschnittsergebnis {
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

export interface AbschnittMitErgebnis {
  abschnitt: Abschnitt;
  ergebnis: Abschnittsergebnis;
}

/** Stand einer Person in einem Strang (FA-59 AK-2). */
export interface Strangergebnis {
  strang: Strang;
  prozent: number | null;
  abschnitte: AbschnittMitErgebnis[];
}

export interface Gesamtergebnis {
  prozent: number | null;
  praxis: Strangergebnis;
  theorie: Strangergebnis;
  /** Alle Abschnitte beider Stränge in Reihenfolge – für Übersichten. */
  alle: AbschnittMitErgebnis[];
}
