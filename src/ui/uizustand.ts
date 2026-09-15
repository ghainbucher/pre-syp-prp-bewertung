/**
 * Oberflächenzustand: gewählte Ansicht, Klasse, Abschnitt, Team, bewertende
 * Person und die zur Bearbeitung geöffnete Rubrik.
 *
 * Wird getrennt vom Datenbestand gehalten und im localStorage abgelegt, damit
 * die Anwendung dort weitermacht, wo zuletzt gearbeitet wurde (FA-35).
 *
 * **Hier steht kein React.** Der Haken dazu liegt in `useUiZustand.ts`; die
 * Form des Zustands und die Regel, was davon gemerkt wird, stehen hier – so
 * sind sie ohne Browser prüfbar (NFA-06).
 */

/**
 * Die Sichten (FA-34 neu gefasst, Fassung vom 14.09.2026).
 *
 * Vier **Hauptbereiche** – `projekte`, `tests`, `auswertung`, `stammdaten` –
 * und darunter die Teile eines Sprints, die zum Projekt gehören: `planning`,
 * `daily`, `review` (FA-91 AK-4). `diplomarbeit` steht noch daneben, solange
 * die Diplomarbeitsvorbereitung eine Abschnittsart ist; mit dem nächsten
 * Schemastand wird sie ein Projekt und der Eintrag entfällt (FA-34 AK-6).
 *
 * Die Reihenfolge der Hauptbereiche folgt der **Häufigkeit** und nicht mehr dem
 * Ablauf (FA-34 AK-2): Der Ablauf liegt eine Ebene tiefer, im Sprint.
 */
export type Ansicht =
  | 'projekte'
  | 'planning'
  | 'daily'
  | 'review'
  | 'diplomarbeit'
  | 'tests'
  | 'auswertung'
  | 'stammdaten';

/**
 * Die Unterseiten des Bereichs Stammdaten (FA-34 AK-3).
 *
 * Ein Blatt je Sache: Klassen und Schüler getrennt, je Leistungsbereich eines,
 * der Notenschlüssel und die Stichtage als Rahmendaten daneben.
 */
export type Stammseite =
  | 'klassen'
  | 'schueler'
  | 'projekte'
  | 'tests'
  | 'rubrik'
  | 'stichtage';

export interface UiZustand {
  ansicht: Ansicht;
  /** Gewählte Unterseite im Bereich Stammdaten (FA-34 AK-3). */
  stammseite: Stammseite;
  /**
   * Klassenfilter, `null` = **alle Klassen** (FA-95).
   *
   * Wirkt auf jeder Sicht, auf der eine Klasse vorkommt, und steht deshalb in
   * der Kopfleiste: Ein Filter, der über Sichtgrenzen hinweg gilt, muss überall
   * zu sehen und zu ändern sein.
   */
  klasseId: string | null;
  /** Gewählter Beurteilungsabschnitt – Sprint, Diplomarbeit oder Test. */
  abschnittId: string | null;
  teamId: string | null;
  bewerterId: string | null;
  /** In der Rubrikansicht geöffnete Rubrik (FA-55). */
  rubrikId: string | null;
  /** Stichtag der Auswertung; `null` = alles (FA-48). */
  stichtagId: string | null;
  /**
   * Jahrgangsfilter der Projektsicht; `null` = alle (FA-90 AK-1).
   *
   * Abgeleitet aus der Projektart, nicht eigens erfasst – siehe OP-F34.
   */
  jahrgang: 4 | 5 | null;
  /**
   * Nur gemischte Projekte zeigen (FA-90 AK-3).
   *
   * Getrennt von `klasseId`, weil „gemischt" kein Klassenwert ist, sondern eine
   * Eigenschaft. Der Klassenfilter selbst ist `klasseId` und steht in der
   * Kopfleiste, weil er auf allen Sichten wirkt (FA-95).
   *
   * Der Freitext der Suche steht bewusst **nicht** hier: Ein nach dem Neustart
   * wieder eingesetzter Suchbegriff sieht aus wie ein Datenverlust.
   */
  nurGemischt: boolean;
  /**
   * Schülerfilter in Theorie-Tests und Notenauswertung; `null` = alle der
   * gewählten Klasse (FA-92 AK-1, AK-2).
   */
  schuelerId: string | null;
  /**
   * Herleitung anzeigen (FA-51)? Vorgabe aus.
   *
   * Steht bewusst hier und nicht im Datenbestand: Die Einstellung wirkt nur auf
   * die Anzeige und darf nie in einer Sicherung landen (AK-3).
   */
  ausfuehrlich: boolean;
  /**
   * Abschnitt, der zum Bearbeiten geöffnet wurde (FA-76 AK-3).
   *
   * Wird **nicht** mitgespeichert: Ein Schreibschutz, den man einmal aufhebt
   * und der dann für immer offen bleibt, ist keiner. Nach dem Neuladen greift
   * er wieder.
   */
  bearbeiten: string | null;
}

// Stand 7: `projektKlasse` ist entfallen – der Klassenfilter ist `klasseId`
// und gilt für die ganze Anwendung (FA-95). Ein neuer Schlüssel ist einfacher
// als eine Migration eines Zustands, der sich in Sekunden wiederherstellt.
// Stand 6: Die Stammdaten haben sechs Unterseiten – Klassen und Schüler sind
// getrennt, die Stichtage haben ein eigenes Blatt. Ein neuer Schlüssel ist
// einfacher als eine Migration eines Zustands, der sich in Sekunden
// wiederherstellt – er kostet einmal die gemerkte Auswahl.
export const SCHLUESSEL = 'pre-syp-prp.ui.v7';

export const START: UiZustand = {
  // Der Einstieg sind die Projekte: Dort wird gearbeitet (FA-34 AK-1).
  ansicht: 'projekte',
  stammseite: 'klassen',
  klasseId: null,
  abschnittId: null,
  teamId: null,
  bewerterId: null,
  rubrikId: null,
  stichtagId: null,
  jahrgang: null,
  nurGemischt: false,
  schuelerId: null,
  ausfuehrlich: false,
  bearbeiten: null,
};

export function gelesen(): UiZustand {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return START;
    const wert = JSON.parse(roh) as Partial<UiZustand>;
    return { ...START, ...wert };
  } catch {
    return START;
  }
}

/**
 * Was vom Sichtzustand **dauerhaft** gemerkt wird (FA-35, FA-76 AK-3).
 *
 * Gemerkt wird die Auswahl – Klasse, Sprint, Projekt –, damit man beim nächsten
 * Öffnen weiterarbeitet, wo man aufgehört hat.
 *
 * **Nicht gemerkt wird `bearbeiten`.** Das ist die ausdrückliche Freigabe eines
 * Sprints, der nicht läuft. Sie gilt für diese Sitzung und für nichts weiter:
 * Wer eine Bewertung nachträgt, soll das bewusst tun und nicht deshalb, weil
 * ein Fenster seit vorgestert offen ist. Eine Freigabe, die ein Neuladen
 * übersteht, wäre keine Ausnahme mehr, sondern der neue Normalzustand.
 *
 * Die Regel steht als Funktion und nicht als Zeile im Effekt, damit sie prüfbar
 * ist: Ein vergessenes `delete` fiele sonst niemandem auf.
 */
export function dauerhafterTeil(zustand: UiZustand): Partial<UiZustand> {
  const dauerhaft: Partial<UiZustand> = { ...zustand };
  delete dauerhaft.bearbeiten;
  return dauerhaft;
}
