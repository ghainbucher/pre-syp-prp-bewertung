/**
 * Datenmodell der PRE/SYP-PRP-Bewertung.
 *
 * Siehe docs/solution-design.md, Abschnitt 5. Dieses Modul ist frei von
 * Abhängigkeiten zu React oder zum Browser.
 *
 * Schemastand 2 (FA-55 bis FA-60, FA-65): Der **Abschnitt** trägt das Modell,
 * nicht mehr der Sprint. Ein Sprint ist ein Abschnitt, die
 * Diplomarbeitsvorbereitung ist einer, ein Test ist einer.
 *
 * Schemastand 3 (FA-66 bis FA-69): Der Abschnitt ist nur noch der Rahmen der
 * Klasse – Nummer, Art, Strang, Faktor. Beginn, Ende, Ziel und die geltenden
 * Kriterien liegen beim **Team** (`Teamabschnitt`).
 */

export type Id = string;

/**
 * Wann ein Kriterium beobachtet wird (FA-75).
 *
 * Bestimmt **nur den Ort der Erfassung**, niemals die Rechnung: Kategorie,
 * Gewicht und Maximalpunkte bleiben unberührt (AK-2). Ohne Angabe gilt
 * `review` – so verhalten sich alle bisherigen Bestände unverändert (AK-5).
 */
export type Erfassungszeitpunkt = 'planning' | 'daily' | 'review';

/** Ein Bewertungskriterium mit erreichbarer Punktezahl. */
export interface Kriterium {
  id: Id;
  name: string;
  beschreibung: string;
  /** Erreichbare Punkte. Bei Peer-Kriterien ohne Bedeutung (feste Skala 1–5). */
  max: number;
  /** Wann es beobachtet wird (FA-75). Fehlt es, gilt `review`. */
  zeitpunkt?: Erfassungszeitpunkt;
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

/**
 * Art eines Projekts (FA-87 AK-2).
 *
 * Sie sagt, worum es geht, und sie trägt den Jahrgang: Ein SYP/PRE-Projekt der
 * 4. Klasse ist etwas anderes als eines der 5., und eine Diplomarbeit ist
 * wieder etwas anderes. Fehlt die Angabe, ist die Art unbekannt – dann taucht
 * das Projekt in keinem Jahrgangsfilter auf und wird als solches angezeigt
 * (FA-90 AK-4). Additiv innerhalb von Schemastand 3.
 */
export type Projekttyp = 'syp-pre-4' | 'syp-pre-5' | 'diplomarbeit';

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
  /**
   * Gewicht je Kategorie in Prozent; die Summe muss nicht 100 ergeben (FA-07).
   *
   * `gewichte.peer` ist seit FA-45 **ohne Wirkung**: Peer-Werte gehen nicht als
   * gewichtete Kategorie ein, sondern als gedeckelter Korrekturfaktor. Das Feld
   * bleibt nur, damit ältere Bestände unverändert lesbar sind.
   */
  gewichte: Record<KategorieSchluessel, number>;
  /** Zählt die Selbsteinschätzung in die Peer-Note (FA-15)? */
  selbstZaehlt: boolean;
  /**
   * Zeitpunkt des logischen Löschens (FA-94).
   *
   * Gesetzt heißt: aus allen Auswahllisten und Auswertungen verschwunden, in
   * bestehenden Bewertungen und Belegfassungen aber weiterhin lesbar – und
   * wiederherstellbar. Physisch gelöscht wird nur, was **nichts Bewertetes**
   * trägt; sonst wäre eine Note nicht mehr rekonstruierbar (Fachkonzept G7).
   */
  geloeschtAm?: string;
}

export interface Klasse {
  id: Id;
  name: string;
  /**
   * Zeitpunkt des logischen Löschens (FA-94).
   *
   * Gesetzt heißt: aus allen Auswahllisten und Auswertungen verschwunden, in
   * bestehenden Bewertungen und Belegfassungen aber weiterhin lesbar – und
   * wiederherstellbar. Physisch gelöscht wird nur, was **nichts Bewertetes**
   * trägt; sonst wäre eine Note nicht mehr rekonstruierbar (Fachkonzept G7).
   */
  geloeschtAm?: string;
}

export interface Team {
  id: Id;
  klasseId: Id;
  name: string;
  /**
   * Pfad des Repositorys, `eigentuemer/name` (FA-81 AK-3).
   *
   * Nur nötig, wo die GitHub-Auswertung benutzt wird; leer heißt: keine.
   */
  repository?: string;
  /**
   * Typ des Projekts (FA-87 AK-2, Fachkonzept 15.1). Fehlt er, ist er unbekannt.
   *
   * Aus dem Typ wird der Jahrgang abgeleitet; ein Projekt ohne Typ fällt aus
   * dem Jahrgangsfilter heraus und wird keinem Jahrgang zugeschlagen.
   */
  typ?: Projekttyp;
  /** Freier Text zum Auftrag – reine Gedächtnisstütze (Fachkonzept 15.1). */
  beschreibung?: string;
  /**
   * Zeitraum des Projekts – **Information für den Leser, keine Rechnung**
   * (Fachkonzept 15.1). Üblicherweise der Zeitraum, in dem die Sprints liegen;
   * geprüft wird das nicht. Der Zeitfaktor nach § 20 Abs. 1 LBVO rechnet
   * weiterhin über die Hälften des Beurteilungszeitraums.
   */
  von?: string;
  bis?: string;
  /**
   * Zeitpunkt des logischen Löschens (FA-94).
   *
   * Gesetzt heißt: aus allen Auswahllisten und Auswertungen verschwunden, in
   * bestehenden Bewertungen und Belegfassungen aber weiterhin lesbar – und
   * wiederherstellbar. Physisch gelöscht wird nur, was **nichts Bewertetes**
   * trägt; sonst wäre eine Note nicht mehr rekonstruierbar (Fachkonzept G7).
   */
  geloeschtAm?: string;
}

export interface Person {
  id: Id;
  klasseId: Id;
  name: string;
  /**
   * GitHub-Kennung dieser Person (FA-88 AK-1).
   *
   * Sie liegt an der Person und nicht am Projekt: Eine Kennung gehört einem
   * Menschen, nicht einer Gruppe. Leer heißt „nicht erfasst" und ist der
   * Normalzustand am Anfang eines Durchgangs.
   */
  githubKennung?: string;
  /**
   * Schul-E-Mail-Adresse (FA-88 AK-1).
   *
   * Eine Angabe der Lehrkraft. Die Anwendung **prüft nicht**, ob sie mit dem
   * GitHub-Konto verknüpft ist – sie ruft nichts ab (ADR-001), und GitHub
   * verbirgt Adressen standardmäßig (FA-88 AK-5).
   */
  schulEmail?: string;
  /**
   * Zeitpunkt des logischen Löschens (FA-94).
   *
   * Gesetzt heißt: aus allen Auswahllisten und Auswertungen verschwunden, in
   * bestehenden Bewertungen und Belegfassungen aber weiterhin lesbar – und
   * wiederherstellbar. Physisch gelöscht wird nur, was **nichts Bewertetes**
   * trägt; sonst wäre eine Note nicht mehr rekonstruierbar (Fachkonzept G7).
   */
  geloeschtAm?: string;
}

/**
 * Ein Schüler gehört zu einem Projekt (Fachkonzept 15.1, FA-87).
 *
 * **Eigene Größe und kein Feld an der Person**: Ein Schüler darf in mehreren
 * Projekten zugleich sein – im 5. Jahrgang laufen SYP/PRE-Projekt und
 * Diplomarbeit nebeneinander. Praktisch ist das selten, deshalb warnt die
 * Anwendung und verlangt eine Bestätigung (FA-87 AK-5).
 *
 * Ersetzt ab Schemastand 4 die Zugehörigkeit **je Abschnitt**: Der Auftraggeber
 * hat am 14.09.2026 festgelegt, dass Schüler zu Projekten gehören und nicht zu
 * Sprints (Fachkonzept 15.2, A8).
 */
export interface Mitgliedschaft {
  projektId: Id;
  personId: Id;
  /**
   * Zeitpunkt, zu dem die Überschneidung mit einem anderen Projekt bestätigt
   * wurde. Fehlt er, gab es zum Zeitpunkt der Zuordnung keine Überschneidung.
   */
  ueberschneidungBestaetigtAm?: string;
}

/** Nur noch für das Einlesen alter Bestände (bis Schemastand 3). */
export interface Zugehoerigkeit {
  abschnittId: Id;
  personId: Id;
  teamId: Id | null;
}

/**
 * Woher die Kriterien einer Planung stammen (FA-67 AK-9).
 *
 * Ohne diese Angabe lässt sich später nicht mehr sagen, ob ein abweichendes
 * Kriterium eine Entscheidung war oder aus einer Vorlage stammt.
 */
export type Herkunft =
  | { art: 'vorlage'; rubrikId: Id }
  | { art: 'uebernommen'; ausAbschnittId: Id }
  | { art: 'geaendert'; ausAbschnittId: Id | null };

/**
 * Die Planung eines Teams für einen Abschnitt (FA-66, FA-67).
 *
 * Eigene Größe und nicht ein paar Felder in `Bewertung`: Die Planung entsteht
 * am Sprintbeginn, also bevor es eine Bewertung gibt. Eine leere Bewertung nur
 * als Träger eines Datums anzulegen liefe der Aufräumregel zuwider, die leere
 * Bewertungen entfernt – die Planung wäre beim nächsten Speichern weg.
 */
export interface Teamabschnitt {
  abschnittId: Id;
  teamId: Id;
  /** Was sich das Team vornimmt (FA-66 AK-1). */
  ziel: string;
  /**
   * Die **geplanten** Anforderungen dieses Sprints (FA-96).
   *
   * Vorerst Freitext: eine Zeile je Anforderung, so wie sie im Planning
   * besprochen wird. Bewusst keine Liste mit Kennungen – welche Struktur sie
   * braucht, entscheidet sich, wenn erkennbar ist, wie damit gearbeitet wird
   * (OP-F38).
   *
   * Sie ist **keine Bewertungsgrundlage**: Bewertet wird nach den Kriterien
   * der Planung (`rubrikKopie`, FA-65). Der Text sagt, woran gearbeitet werden
   * sollte, und macht den Vergleich mit dem Ergebnis möglich.
   */
  geplanteAnforderungen?: string;
  /**
   * Die **umgesetzten** Anforderungen, im Review festgehalten (FA-96).
   *
   * Steht neben dem Plantext, damit Plan und Ist nebeneinander lesbar sind –
   * das ist der ganze Zweck der Aufzeichnung. Ob etwas fehlt, ist eine
   * Feststellung; ob das schlecht war, entscheiden die Kriterien.
   */
  umgesetzteAnforderungen?: string;
  /** Beginn; leer = nicht festgelegt, dann gilt der Rahmen des Abschnitts. */
  von: string;
  /** Ende; leer = offen. Maßgeblich für die Stichtagszuordnung (FA-48 AK-6). */
  bis: string;
  /** Zeitpunkt, zu dem die Planung festgehalten wurde. */
  geplantAm?: string;
  /**
   * Die für dieses Team geltenden Kriterien (FA-65 AK-1, FA-67 AK-1).
   *
   * Sobald sie existiert, ist **sie** maßgeblich – nie mehr die Rubrik.
   */
  rubrikKopie?: Rubrik;
  eingefrorenAm?: string;
  /** Zeitpunkt des letzten Angleichens (FA-47 AK-6). */
  angeglichenAm?: string;
  herkunft?: Herkunft;
  /**
   * Zeitpunkt der Fixierung (FA-77 AK-3).
   *
   * Bis dahin ist die Planung ein **Vorschlag**: vorausgeplant, aber noch nicht
   * der geltende Sprint. Fixieren geht erst, wenn der vorige Sprint desselben
   * Teams abgeschlossen ist. Fehlt das Feld, gilt eine Planung als fixiert,
   * sobald für sie Punkte erfasst sind (AK-10).
   */
  fixiertAm?: string;
  /**
   * Was sich das Team in der Retrospektive vornimmt (FA-80 AK-1).
   *
   * Zwei bis drei Sätze. Sie gehören zu **diesem** Sprint, in dessen
   * Retrospektive sie entstanden sind; ob sie umgesetzt wurden, steht am
   * Folgesprint (`nachschau`) – so gibt es für den Text eine einzige Quelle.
   */
  massnahmen?: Massnahme[];
  /**
   * Umsetzungsstand der Maßnahmen des **vorigen** Sprints (FA-80 AK-4).
   *
   * Schlüssel ist die Maßnahmenkennung. Grundlage für das Prozesskriterium
   * „Retrospektive“, das sonst etwas bewertet, das nirgends steht.
   */
  nachschau?: Record<Id, Nachschau>;
  /** Eingelesene Kennzahlen zur Zusammenarbeit (FA-81). */
  auswertung?: GithubAuswertung;
  /**
   * Zeitpunkt des Abschlusses im Sprintreview (FA-77 AK-5).
   *
   * Eine ausdrückliche Handlung, kein Nebenprodukt der Bewertung: Ein bewusst
   * leer gelassenes Feld soll den nächsten Sprint nicht aufhalten. Für den
   * Abschluss gibt es keine Ersatzregel – was nie abgeschlossen wurde, ist
   * offen.
   */
  abgeschlossenAm?: string;
}

/** Eine Maßnahme aus der Retrospektive (FA-80). */
export interface Massnahme {
  id: Id;
  /** Ein Satz: was das Team im Folgesprint anders macht. */
  text: string;
}

/** Wie weit eine Maßnahme umgesetzt wurde (FA-80 AK-4). */
export type Umsetzungsstand = 'ja' | 'teilweise' | 'nein';

export interface Nachschau {
  stand: Umsetzungsstand;
  notiz: string;
}

/**
 * Kennzahlen zur Zusammenarbeit eines Teams in einem Zeitraum (FA-81).
 *
 * **Alles auf Teamebene und alles als Verteilung** – nie eine Leistungszahl je
 * Person (AK-2). Die Zahlen entstehen außerhalb der Anwendung durch ein Skript
 * und werden eingelesen; die Anwendung ruft nichts ab (AK-1).
 */
export interface GithubAuswertung {
  /** Wann eingelesen – die Zahlen sind ein Stand, kein Live-Wert (AK-4). */
  standAm: string;
  /** Zeitraum, über den das Skript abgefragt hat. */
  von: string;
  bis: string;
  /** Anteil je GitHub-Kennung an den Beiträgen des Zeitraums, in Prozent. */
  anteile: Record<string, number>;
  /** Wer wessen Pull Requests kommentiert oder genehmigt hat. */
  reviews: Reviewkante[];
  /** Anteil der Änderungen über Pull Requests mit Review, in Prozent. */
  prAnteil: number;
  /** Zahl der Änderungen, die direkt auf den Hauptzweig gingen. */
  direktePushes: number;
  /** Beiträge je Tag (`JJJJ-MM-TT`), für die zeitliche Verteilung. */
  jeTag: Record<string, number>;
  /** Kennungen, für die das Team keine Person benannt hat (AK-3). */
  nichtZugeordnet: string[];
}

/** Eine Review-Beziehung: `von` hat einen PR von `an` begutachtet. */
export interface Reviewkante {
  von: string;
  an: string;
  anzahl: number;
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
  /**
   * Zeitpunkt des letzten Angleichens an die aktuelle Rubrik (FA-47 AK-4).
   *
   * Gehört in die Belegfassung: Wer nachvollziehen soll, wie ein Stand
   * zustande kam, muss wissen, dass die Kriterien nachträglich berichtigt
   * wurden.
   */
  angeglichenAm?: string;
  /**
   * Rahmen der Klasse, keine Festlegung (FA-04 AK-2).
   *
   * Ab Schemastand 3 ist für einen Sprint der Zeitraum des **Teams**
   * maßgeblich; dieser hier gilt als Rückfall, solange keine Planung vorliegt,
   * und für Tests, die kein Team haben.
   */
  von: string;
  bis: string;
  /** Eigenart des Abschnitts: Vorgabe 1, Lernsprint 0,5 (FA-04, FA-24). Gilt für alle Teams. */
  faktor: number;
  /** Findet in diesem Abschnitt eine Peer-Bewertung statt (FA-52)? */
  peerAktiv: boolean;
  /** Nur bei Tests: Ankündigung nach § 8 LBVO (FA-60 AK-5). */
  angekuendigtAm?: string;
  /** Nur bei Tests: Arbeitszeit in Minuten (FA-60 AK-5, FA-62). */
  arbeitszeitMinuten?: number;
  /**
   * Zeitpunkt des logischen Löschens (FA-94).
   *
   * Gesetzt heißt: aus allen Auswahllisten und Auswertungen verschwunden, in
   * bestehenden Bewertungen und Belegfassungen aber weiterhin lesbar – und
   * wiederherstellbar. Physisch gelöscht wird nur, was **nichts Bewertetes**
   * trägt; sonst wäre eine Note nicht mehr rekonstruierbar (Fachkonzept G7).
   */
  geloeschtAm?: string;
}

/**
 * Art eines Stichtags (FA-48 AK-5).
 *
 * Ein `zeugnis`-Stichtag **schließt** einen Beurteilungszeitraum ab; der
 * folgende beginnt danach. Ein `kontrolle`-Stichtag (Ende April, Frühwarnung
 * nach § 19 Abs. 3a SchUG) erzeugt keinen eigenen Zeitraum, sondern wertet den
 * laufenden bis zu diesem Datum aus.
 */
export type Stichtagsart = 'zeugnis' | 'kontrolle';

export interface Stichtag {
  id: Id;
  name: string;
  /** Letztes einbezogenes Datum, ISO (JJJJ-MM-TT). */
  bis: string;
  art: Stichtagsart;
  /**
   * Zeitpunkt des logischen Löschens (FA-94).
   *
   * Gesetzt heißt: aus allen Auswahllisten und Auswertungen verschwunden, in
   * bestehenden Bewertungen und Belegfassungen aber weiterhin lesbar – und
   * wiederherstellbar. Physisch gelöscht wird nur, was **nichts Bewertetes**
   * trägt; sonst wäre eine Note nicht mehr rekonstruierbar (Fachkonzept G7).
   */
  geloeschtAm?: string;
}

/** Ein Beurteilungszeitraum als Datumsspanne; `null` heißt „offen“. */
export interface Zeitraum {
  von: string | null;
  bis: string | null;
}

/** Punkte je Kriterium. Ein fehlender Schlüssel bedeutet „nicht bewertet“. */
export type Punkte = Record<Id, number>;

/** Peer-Urteil: Wert 1–5 je Peer-Kriterium. */
export type PeerUrteil = Record<Id, number>;

/**
 * Ein von der Lehrkraft gesetzter Wert (FA-50).
 *
 * Er **ersetzt den berechneten nicht** (AK-2, G9): Der berechnete Wert ist
 * eine Funktion des Bestands und keine Spalte darin, also stehen beide
 * jederzeit nebeneinander. Nur der berechnete erklärt, was die Person getan
 * hat – nur der gesetzte, was die Lehrkraft entschieden hat.
 */
export interface GesetzterWert {
  /** 0 bis 100. */
  prozent: number;
  /** Freiwillig (FA-50 AK-5). */
  begruendung: string;
  /** ISO-Zeitpunkt, für die Belegfassung. */
  gesetztAm: string;
}

/**
 * Der Notenstand einer Person zu einem Stichtag (FA-49).
 *
 * Die **einzige** Stelle im Datenbestand mit einer Ziffer 1 bis 5 (AK-1, G8).
 * Der Notenvorschlag wird bei der Anzeige gebildet und nie gespeichert – wer
 * ihn speicherte, hätte eine zweite Wahrheit im Bestand.
 */
export interface Notenstand {
  note: 1 | 2 | 3 | 4 | 5;
  /** Freiwillig (FA-49 AK-4). */
  begruendung: string;
  gesetztAm: string;
}

/**
 * Rückmeldung an die Person nach einem Abschnitt (FA-42).
 *
 * Bewusst **nicht** dasselbe wie die Notiz der Lehrkraft (FA-17): Die Notiz ist
 * eine Aufzeichnung für Gespräch und Begründung, die Rückmeldung geht an die
 * Schülerin oder den Schüler. Sie enthält weder Punktetabelle noch Note
 * (AK-2, AK-3, Fachkonzept G10).
 */
export interface Rueckmeldung {
  /** Zwei bis drei Stärken (AK-1). */
  staerken: string;
  /** Ein bis zwei Entwicklungsfelder (AK-1). */
  entwicklung: string;
  gesetztAm: string;
}

/**
 * Einstufung des mündlichen Verstehensnachweises (FA-40 AK-1).
 *
 * Vier Stufen, kein Punktewert: Der Nachweis fragt, ob die Person für ihren
 * Code einstehen kann (Fachkonzept 8.3) – das ist eine Einschätzung und keine
 * Messung. Scheingenauigkeit wäre hier das falsche Signal.
 */
export type Verstehensstufe = 'sicher' | 'ueberwiegend' | 'teilweise' | 'nicht';

export interface Verstehensnachweis {
  stufe: Verstehensstufe;
  /** Kurzer Freitext, freiwillig. */
  notiz: string;
  gesetztAm: string;
}

export interface Einzelbewertung {
  punkte: Punkte;
  /** Aufzeichnung der Lehrkraft (FA-17) – geht nicht an die Person. */
  notiz: string;
  /** Rückmeldung an die Person (FA-42) – geht an sie. */
  rueckmeldung?: Rueckmeldung;
  /** Mündlicher Verstehensnachweis im Review (FA-40). */
  verstehen?: Verstehensnachweis;
  /**
   * Sicht der Person auf den Abschnitt (FA-41).
   *
   * Geht in **keine** Rechnung ein (AK-3): Was jemand beigetragen und gelernt
   * hat, ist Grundlage des Gesprächs und nicht ein weiterer Prozentwert.
   */
  reflexion?: string;
  /** Woran diese Person ihren Beitrag zeigt (FA-78). */
  spur?: Spur;
}

/**
 * Die eine Stelle, an der eine Person ihren Beitrag in einem Abschnitt zeigt
 * (FA-78 AK-1).
 *
 * Kein Punktewert und kein Nachweis von Menge – eine einzige Stelle kann viel
 * oder wenig Arbeit sein (AK-3). Sie ist der Anker des Urteils: die Stelle,
 * über die im Verstehensnachweis gesprochen wurde. Im Vorbereitungssprint ein
 * Dokument, später ein Commit oder ein Pull Request (AK-6).
 */
export interface Spur {
  /** Kurz, in eigenen Worten: „PR #42, Storno-Validierung“. */
  bezeichnung: string;
  /**
   * Verweis darauf, etwa eine URL.
   *
   * Wird **gespeichert und angezeigt, nie geöffnet oder gelesen** (AK-4): Die
   * Anwendung ruft nichts ab (ADR-001, NFA-03).
   */
  verweis?: string;
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
  /**
   * Gesetzte Werte unterhalb des Gesamtstands (FA-50 AK-1).
   *
   * `kategorie` gilt für das ganze Team, `abschnittsergebnis` je Person.
   */
  gesetzt?: {
    kategorie?: Partial<Record<KategorieSchluessel, GesetzterWert>>;
    abschnittsergebnis?: Record<Id, GesetzterWert>;
    /**
     * Der Sprintwert dieses Teams (FA-82).
     *
     * Eine Aussage **an das Team**, keine Bewertungsebene: Er geht in keine
     * Note ein (AK-4). Die Jahresnote entsteht weiter aus den
     * Abschnittsergebnissen je Person.
     */
    sprintwert?: GesetzterWert;
  };
}

/**
 * Antwort auf die Nachfrage am Ende einer Abschnittsbewertung (FA-53 AK-4).
 *
 * Festgehalten wird auch ein „später“ – sonst stünde die Frage nach jedem
 * Neuladen wieder da, obwohl sie schon übergangen wurde.
 */
export interface PeerEntscheidung {
  /** Abschnitt, an dessen Ende gefragt wurde. */
  abschnittId: Id;
  /** Zeitpunkt der Antwort, ISO. */
  am: string;
  antwort: 'ja' | 'nein' | 'spaeter';
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
  /**
   * Höchste Verschiebung durch Peer-Werte in Prozentpunkten (FA-45 AK-4).
   * Vorgabe 5. Additiv innerhalb von Schemastand 2.
   */
  peerDeckelung: number;
  /**
   * Anteil des Verstehensnachweises am individuellen Beitrag in Prozent
   * (FA-40 AK-2). Vorgabe 30; 0 schaltet ihn aus der Rechnung.
   */
  verstehensAnteil: number;
  /**
   * Zeitfaktor der zweiten Hälfte eines Beurteilungszeitraums (FA-54 AK-6).
   * Vorgabe 2 nach § 20 Abs. 1 LBVO; 1 ist zulässig, weicht aber ab.
   */
  zeitfaktorZweiteHaelfte: number;
  /**
   * Sperrt ein negativer Strang den Notenvorschlag (FA-61 AK-6)?
   * Vorgabe eingeschaltet; § 14 LBVO verlangt die Erfüllung in den
   * wesentlichen Bereichen.
   */
  sperreAktiv: boolean;
  /**
   * Abstand zum Teamergebnis in Prozentpunkten, ab dem das erste Signal des
   * Befunds anspricht (FA-79 AK-4a). Vorgabe 15.
   *
   * Einstellbar, weil eine fest verdrahtete Zahl im Widerspruchsfall nicht zu
   * begründen wäre: So ist es eine Festlegung der Lehrkraft, die in der
   * Aufzeichnung steht. Additiv innerhalb von Schemastand 3.
   */
  befundSchwelle: number;
  /** Beurteilungs- und Kontrollzeitpunkte (FA-48 AK-4). */
  stichtage: Stichtag[];
  /** Gesetzter Gesamtstand je Stichtag und Person (FA-50 AK-1). */
  gesamtstand: Record<Id, Record<Id, GesetzterWert>>;
  /** Notenstand je Stichtag und Person (FA-49 AK-5). */
  notenstaende: Record<Id, Record<Id, Notenstand>>;
  klassen: Klasse[];
  teams: Team[];
  personen: Person[];
  abschnitte: Abschnitt[];
  /** Planung je Team und Abschnitt (FA-66, Schemastand 3). */
  teamabschnitte: Teamabschnitt[];
  /** Schüler ↔ Projekt (FA-87). Ersetzt ab Schemastand 4 `zugehoerigkeiten`. */
  mitgliedschaften: Mitgliedschaft[];
  bewertungen: Bewertung[];
  /**
   * Nachvollziehbar, ab wann Peer-Werte einfließen (FA-53 AK-4).
   *
   * Additives Feld innerhalb von Schemastand 2: Ein älterer Bestand hat es
   * nicht, die Migration ergänzt es leer – ein eigener Schemastand wäre für
   * eine Liste ohne Bezug zu bestehenden Feldern unverhältnismäßig.
   */
  peerEntscheidungen: PeerEntscheidung[];
}

/* -------------------------------------------------------------------------- */
/* Ergebnisstrukturen der Berechnung                                          */
/* -------------------------------------------------------------------------- */

/**
 * Ergebnis einer Kategorie; `null` bedeutet „nicht bewertet“ (FA-21).
 *
 * `prozent` ist der **geltende** Wert: der gesetzte, wenn einer vorliegt, sonst
 * der berechnete (FA-50 AK-3). `prozentBerechnet` bleibt daneben stehen.
 */
export interface Kategorieergebnis {
  prozent: number;
  /** Der gerechnete Wert – auch dann, wenn ein gesetzter gilt. */
  prozentBerechnet: number | null;
  /** Der gesetzte Wert, sofern vorhanden (FA-50). */
  gesetzt: GesetzterWert | null;
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

/**
 * Ergebnis einer Person in einem Abschnitt (FA-23).
 *
 * `prozent` ist der geltende Wert (FA-50 AK-3), `prozentBerechnet` der
 * gerechnete. Sie können auseinanderlaufen, wenn sich die Ebene darunter nach
 * dem Setzen geändert hat – das ist beabsichtigt und sichtbar zu machen (AK-4).
 */
export interface Abschnittsergebnis {
  prozent: number | null;
  /** Der gerechnete Wert einschließlich Peer-Korrektur. */
  prozentBerechnet: number | null;
  /** Gesetzter Wert für diese Person in diesem Abschnitt (FA-50). */
  gesetzt: GesetzterWert | null;
  team: Kategorieergebnis | null;
  prozess: Kategorieergebnis | null;
  individuell: Kategorieergebnis | null;
  peer: Peerergebnis | null;
  /**
   * Prozentwert vor der Peer-Korrektur (FA-45). Gleich `prozent`, wenn keine
   * Korrektur greift – die Ansichten können damit beides zeigen, ohne zu rechnen.
   */
  prozentVorKorrektur: number | null;
  /** Verschiebung durch die Peer-Werte in Prozentpunkten, 0 wenn keine (FA-45). */
  korrektur: number;
  /** Selbsteinschätzung in Prozent, unabhängig davon, ob sie in die Note zählt. */
  selbst: number | null;
  /** Bezeichnungen der Kategorien, zu denen noch nichts erfasst ist (FA-26). */
  fehlend: string[];
}

export interface AbschnittMitErgebnis {
  abschnitt: Abschnitt;
  ergebnis: Abschnittsergebnis;
  /**
   * Zeitfaktor aus der Lage im Beurteilungszeitraum (FA-54). Getrennt vom
   * Faktor am Abschnitt gehalten: Wer nur das Produkt sieht, kann nicht mehr
   * unterscheiden, ob ein Abschnitt schwerer wiegt, weil er später liegt,
   * oder weil jemand den Faktor verstellt hat (AK-4).
   */
  zeitfaktor: number;
}

/** Stand einer Person in einem Strang (FA-59 AK-2). */
export interface Strangergebnis {
  strang: Strang;
  prozent: number | null;
  abschnitte: AbschnittMitErgebnis[];
}

/** Was eine Stichtagsauswertung ausgelassen hat – nie stillschweigend (FA-48). */
export interface Auslassung {
  /** Abschnitte ohne Enddatum, die keinem Zeitraum zuzuordnen sind. */
  ohneDatum: Abschnitt[];
}

/**
 * Notenvorschlag samt Grund (FA-25, FA-61 AK-2).
 *
 * Die Sperre ist eine Aussage über den Bestand, kein Eingriff in ihn: Beide
 * Strangstände und der Gesamtstand bleiben unverändert (AK-3).
 */
export interface Notenvorschlag {
  /** `null`, solange zu wenig erfasst ist. */
  note: number | null;
  /** Strang, der die Sperre ausgelöst hat – sonst `null`. */
  gesperrtDurch: Strang | null;
  /** Note, die sich ohne Sperre ergäbe; zum Ausweisen des Unterschieds. */
  ohneSperre: number | null;
}

export interface Gesamtergebnis {
  /** Der geltende Gesamtstand: gesetzt, wenn vorhanden, sonst gerechnet. */
  prozent: number | null;
  /** Der gerechnete Gesamtstand – bleibt neben einem gesetzten erhalten. */
  prozentBerechnet: number | null;
  /** Gesetzter Gesamtstand für diesen Stichtag (FA-50 AK-1). */
  gesetzt: GesetzterWert | null;
  /** Notenstand zu diesem Stichtag (FA-49); `null`, solange keiner gesetzt ist. */
  notenstand: Notenstand | null;
  praxis: Strangergebnis;
  theorie: Strangergebnis;
  /** Alle Abschnitte beider Stränge in Reihenfolge – für Übersichten. */
  alle: AbschnittMitErgebnis[];
  /** Abschnitte, die die Stichtagsauswertung nicht zuordnen konnte (FA-48). */
  auslassung: Auslassung;
}
