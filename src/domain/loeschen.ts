/**
 * Löschregeln für Stammdaten (FA-94).
 *
 * **Zwei Arten zu löschen, und die Anwendung wählt selbst.**
 *
 * - *Wirklich löschen*, solange an dem Objekt **nichts Bewertetes** hängt. Das
 *   ist der häufige Fall: gerade angelegt, vertippt, doppelt erfasst. Müll
 *   anzusammeln, den niemand je wieder ansieht, wäre die schlechtere Antwort.
 * - *Logisch löschen*, sobald Punkte, Peer-Urteile, ein gesetzter Stand oder
 *   ein Notenstand daran hängen. Dann verschwindet das Objekt aus allen
 *   Auswahllisten und Auswertungen, bleibt aber in bestehenden Bewertungen und
 *   Belegfassungen lesbar – und lässt sich wiederherstellen.
 *
 * **Warum nicht immer physisch:** Fachkonzept **G7 – „Jede Note ist
 * rekonstruierbar."** Wer eine Klasse löscht, an der ein Semesterzeugnis hängt,
 * löscht die Begründung dieses Zeugnisses mit. Das darf nicht von einer
 * Bestätigungsfrage abhängen, die jeder mit Ja beantwortet.
 *
 * **Warum nicht immer logisch:** Ein Bestand, in dem jeder Tippfehler ewig
 * mitläuft, wird unbenutzbar, und die Auswahllisten füllen sich mit Leichen.
 *
 * Dieses Modul entscheidet nur, **welche der beiden Arten greift**. Ausgeführt
 * wird im Reducer.
 */

import type { Bewertung, Datenbestand, Id } from './types';

/** Die Stammdatenarten, für die es die Unterscheidung gibt. */
export type Stammdatenart = 'klasse' | 'person' | 'projekt' | 'abschnitt' | 'stichtag' | 'rubrik';

/** Trägt diese Bewertung irgendeinen erfassten Wert? */
function bewertungGefuellt(bewertung: Bewertung): boolean {
  if (Object.keys(bewertung.team).length > 0) return true;
  if (Object.keys(bewertung.prozess).length > 0) return true;
  if (Object.keys(bewertung.peer).length > 0) return true;
  return Object.values(bewertung.individuell).some(
    (eintrag) => Object.keys(eintrag.punkte ?? {}).length > 0,
  );
}

/** Hängt an dieser Person irgendetwas Bewertetes? */
function personBewertet(daten: Datenbestand, personId: Id): boolean {
  for (const bewertung of daten.bewertungen) {
    const eigen = bewertung.individuell[personId];
    if (eigen && Object.keys(eigen.punkte ?? {}).length > 0) return true;
    if (bewertung.peer[personId]) return true;
    for (const zeile of Object.values(bewertung.peer)) {
      if (zeile[personId]) return true;
    }
    if (bewertung.gesetzt?.abschnittsergebnis?.[personId]) return true;
  }
  for (const jeStichtag of Object.values(daten.gesamtstand)) {
    if (jeStichtag[personId]) return true;
  }
  for (const jeStichtag of Object.values(daten.notenstaende)) {
    if (jeStichtag[personId]) return true;
  }
  return false;
}

/** Hängt an diesem Abschnitt eine gefüllte Bewertung? */
function abschnittBewertet(daten: Datenbestand, abschnittId: Id): boolean {
  return daten.bewertungen.some((b) => b.abschnittId === abschnittId && bewertungGefuellt(b));
}

/**
 * Muss dieses Objekt **logisch** gelöscht werden?
 *
 * `true` heißt: Es hängt Bewertetes daran, physisches Löschen würde eine
 * Begründung vernichten (G7).
 */
export function nurLogischLoeschbar(daten: Datenbestand, art: Stammdatenart, id: Id): boolean {
  switch (art) {
    case 'klasse': {
      // Über die Schüler der Klasse und über ihre Tests. Ein Projekt hängt
      // nicht mehr an der Klasse (Fachkonzept 15.1) und zählt hier nicht mit.
      const schueler = daten.personen.filter((p) => p.klasseId === id);
      if (schueler.some((p) => personBewertet(daten, p.id))) return true;
      return daten.abschnitte.some((a) => a.klasseId === id && abschnittBewertet(daten, a.id));
    }
    case 'person':
      return personBewertet(daten, id);
    case 'projekt': {
      // Bewertungen hängen bis Schemastand 5 am Paar Abschnitt/Team.
      if (daten.bewertungen.some((b) => b.teamId === id && bewertungGefuellt(b))) return true;
      // Eine festgehaltene Planung mit eingefrorenen Kriterien ist ebenfalls
      // eine Aufzeichnung: Sie belegt, wonach beurteilt werden sollte.
      return (daten.teamabschnitte ?? []).some((tp) => tp.teamId === id && tp.rubrikKopie);
    }
    case 'abschnitt':
      // Nicht nur Punkte: Eine festgehaltene Planung mit eingefrorenen
      // Kriterien belegt, wonach beurteilt werden sollte (FA-65 AK-1a).
      return (
        abschnittBewertet(daten, id) ||
        (daten.teamabschnitte ?? []).some((tp) => tp.abschnittId === id && tp.rubrikKopie)
      );
    case 'stichtag':
      return (
        Object.keys(daten.gesamtstand[id] ?? {}).length > 0 ||
        Object.keys(daten.notenstaende[id] ?? {}).length > 0
      );
    case 'rubrik': {
      // FA-55 AK-3: Eine Rubrik, nach der bereits bewertet wurde, bleibt. Die
      // eingefrorene Kopie ist der Beleg – sie liegt am Abschnitt oder an der
      // Planung des Projekts.
      const abschnitteDerRubrik = new Set(
        daten.abschnitte.filter((a) => a.rubrikId === id).map((a) => a.id),
      );
      if (daten.abschnitte.some((a) => a.rubrikId === id && a.rubrikKopie)) return true;
      return (daten.teamabschnitte ?? []).some(
        (tp) => tp.rubrikKopie && abschnitteDerRubrik.has(tp.abschnittId),
      );
    }
  }
}

/**
 * Ein Satz, der sagt, was beim Löschen geschieht und warum.
 *
 * Steht in der Oberfläche **vor** der Bestätigung. „Wirklich?" beantwortet
 * jeder mit Ja; „bleibt erhalten, weil Punkte daran hängen" ist eine Auskunft
 * (FA-36 AK-3).
 */
export function loeschhinweis(daten: Datenbestand, art: Stammdatenart, id: Id): string {
  return nurLogischLoeschbar(daten, art, id)
    ? 'Es hängen Bewertungen daran: Der Eintrag bleibt erhalten und wird nur ausgeblendet. ' +
        'Wiederherstellen ist jederzeit möglich.'
    : 'Es hängt nichts Bewertetes daran: Der Eintrag wird endgültig entfernt.';
}

/** Ist dieses Objekt sichtbar, also nicht logisch gelöscht? */
export function aktiv<T extends { geloeschtAm?: string }>(objekt: T): boolean {
  return !objekt.geloeschtAm;
}

/** Nur die nicht gelöschten Einträge einer Liste. */
export function nurAktive<T extends { geloeschtAm?: string }>(liste: T[]): T[] {
  return liste.filter(aktiv);
}
