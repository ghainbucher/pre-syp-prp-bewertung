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
  zugehoerigkeiten: Zugehoerigkeit[];
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
