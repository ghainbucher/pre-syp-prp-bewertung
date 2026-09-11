/**
 * Berechnung von Prozentwerten und Noten.
 *
 * Reine Funktionen ohne Zustand und ohne Seiteneffekte – siehe
 * docs/solution-design.md, Abschnitt 6. Umsetzung von FA-21 bis FA-25.
 */

import type {
  Bewertung,
  Gesamtergebnis,
  Kategorieergebnis,
  Kriterium,
  Notenstufe,
  Peerergebnis,
  Person,
  Punkte,
  Rubrik,
  Sprint,
  Sprintergebnis,
} from './types';

export const PEER_MIN = 1;
export const PEER_MAX = 5;

/** Ab dieser Abweichung in Prozentpunkten gilt ein Selbstbild als auffällig (FA-27). */
export const ABWEICHUNG_SCHWELLE = 20;

const KATEGORIE_BEZEICHNUNG = {
  team: 'Team-Ergebnis',
  prozess: 'Scrum-Prozess',
  individuell: 'Individueller Beitrag',
  peer: 'Peer-Bewertung',
} as const;

/** Begrenzt einen Wert auf das Intervall [min, max]. */
function klemme(wert: number, min: number, max: number): number {
  return Math.min(Math.max(wert, min), max);
}

function istZahl(wert: unknown): wert is number {
  return typeof wert === 'number' && Number.isFinite(wert);
}

/**
 * Ergebnis einer punktebasierten Kategorie (FA-21).
 *
 * Nur ausgefüllte Kriterien gehen in Zähler **und** Nenner ein: ein noch nicht
 * bewertetes Kriterium senkt das Ergebnis nicht. Punkte werden auf [0, max]
 * begrenzt. `null`, wenn kein Kriterium ausgefüllt ist.
 */
export function kategorieErgebnis(
  punkte: Punkte | undefined,
  kriterien: Kriterium[],
): Kategorieergebnis | null {
  if (!punkte) return null;
  let erreicht = 0;
  let moeglich = 0;
  let ausgefuellt = 0;

  for (const kriterium of kriterien) {
    const wert = punkte[kriterium.id];
    if (!istZahl(wert)) continue;
    const max = Math.max(0, kriterium.max);
    erreicht += klemme(wert, 0, max);
    moeglich += max;
    ausgefuellt += 1;
  }

  if (ausgefuellt === 0 || moeglich === 0) return null;
  return {
    prozent: (erreicht / moeglich) * 100,
    erreicht,
    moeglich,
    ausgefuellt,
    gesamt: kriterien.length,
  };
}

/** Bildet einen Peer-Wert der Skala 1–5 linear auf 0–100 % ab (FA-22). */
export function peerWertInProzent(wert: number): number {
  return ((klemme(wert, PEER_MIN, PEER_MAX) - PEER_MIN) / (PEER_MAX - PEER_MIN)) * 100;
}

/**
 * Peer-Ergebnis einer Person (FA-22).
 *
 * Gemittelt wird über alle vorliegenden Einzelurteile der Teammitglieder.
 * Fehlende Urteile verringern nur den Nenner. Ob die Selbsteinschätzung zählt,
 * steuert `rubrik.selbstZaehlt` (FA-15).
 */
export function peerErgebnis(
  bewertung: Bewertung | undefined,
  personId: string,
  teammitglieder: Person[],
  rubrik: Rubrik,
): Peerergebnis | null {
  if (!bewertung || rubrik.peer.length === 0) return null;

  let summe = 0;
  let anzahlUrteile = 0;
  const bewertende = new Set<string>();

  for (const mitglied of teammitglieder) {
    if (!rubrik.selbstZaehlt && mitglied.id === personId) continue;
    const urteil = bewertung.peer?.[mitglied.id]?.[personId];
    if (!urteil) continue;
    for (const kriterium of rubrik.peer) {
      const wert = urteil[kriterium.id];
      if (!istZahl(wert)) continue;
      summe += peerWertInProzent(wert);
      anzahlUrteile += 1;
      bewertende.add(mitglied.id);
    }
  }

  if (anzahlUrteile === 0) return null;
  return { prozent: summe / anzahlUrteile, bewertende: bewertende.size };
}

/** Selbsteinschätzung einer Person in Prozent, unabhängig von `selbstZaehlt`. */
export function selbstEinschaetzung(
  bewertung: Bewertung | undefined,
  personId: string,
  rubrik: Rubrik,
): number | null {
  const urteil = bewertung?.peer?.[personId]?.[personId];
  if (!urteil) return null;
  let summe = 0;
  let anzahl = 0;
  for (const kriterium of rubrik.peer) {
    const wert = urteil[kriterium.id];
    if (!istZahl(wert)) continue;
    summe += peerWertInProzent(wert);
    anzahl += 1;
  }
  return anzahl === 0 ? null : summe / anzahl;
}

/**
 * Ergebnis einer Person in einem Sprint (FA-23).
 *
 * Gewichtetes Mittel der vorhandenen Kategorieergebnisse. Kategorien ohne Daten
 * und Kategorien mit Gewicht 0 werden aus der Gewichtung herausgerechnet – sie
 * gelten nicht als 0 Prozent.
 */
export function sprintErgebnis(
  bewertung: Bewertung | undefined,
  person: Person,
  teammitglieder: Person[],
  rubrik: Rubrik,
): Sprintergebnis {
  const team = kategorieErgebnis(bewertung?.team, rubrik.team);
  const prozess = kategorieErgebnis(bewertung?.prozess, rubrik.prozess);
  const individuell = kategorieErgebnis(
    bewertung?.individuell?.[person.id]?.punkte,
    rubrik.individuell,
  );
  const peer = peerErgebnis(bewertung, person.id, teammitglieder, rubrik);

  const anteile: Array<{ schluessel: keyof typeof KATEGORIE_BEZEICHNUNG; prozent: number | null }> = [
    { schluessel: 'team', prozent: team?.prozent ?? null },
    { schluessel: 'prozess', prozent: prozess?.prozent ?? null },
    { schluessel: 'individuell', prozent: individuell?.prozent ?? null },
    { schluessel: 'peer', prozent: peer?.prozent ?? null },
  ];

  let gewichtssumme = 0;
  let summe = 0;
  const fehlend: string[] = [];

  for (const anteil of anteile) {
    const gewicht = rubrik.gewichte[anteil.schluessel] ?? 0;
    if (gewicht <= 0) continue;
    if (anteil.prozent === null) {
      fehlend.push(KATEGORIE_BEZEICHNUNG[anteil.schluessel]);
      continue;
    }
    gewichtssumme += gewicht;
    summe += gewicht * anteil.prozent;
  }

  return {
    prozent: gewichtssumme > 0 ? summe / gewichtssumme : null,
    team,
    prozess,
    individuell,
    peer,
    selbst: selbstEinschaetzung(bewertung, person.id, rubrik),
    fehlend,
  };
}

/**
 * Gesamtergebnis einer Person über alle Sprints (FA-24).
 *
 * Gewichtet mit dem Sprintfaktor. Sprints ohne Ergebnis und Sprints mit
 * Faktor 0 bleiben unberücksichtigt.
 */
export function gesamtErgebnis(
  person: Person,
  sprints: Sprint[],
  teammitglieder: Person[],
  bewertungen: Map<string, Bewertung>,
  rubrik: Rubrik,
): Gesamtergebnis {
  let gewichtssumme = 0;
  let summe = 0;
  const proSprint: Gesamtergebnis['proSprint'] = [];

  for (const sprint of sprints) {
    const bewertung = person.teamId
      ? bewertungen.get(bewertungsSchluessel(sprint.id, person.teamId))
      : undefined;
    const ergebnis = sprintErgebnis(bewertung, person, teammitglieder, rubrik);
    proSprint.push({ sprint, ergebnis });

    if (ergebnis.prozent === null) continue;
    const faktor = istZahl(sprint.faktor) ? Math.max(0, sprint.faktor) : 1;
    if (faktor === 0) continue;
    gewichtssumme += faktor;
    summe += faktor * ergebnis.prozent;
  }

  return { prozent: gewichtssumme > 0 ? summe / gewichtssumme : null, proSprint };
}

/**
 * Weicht die Selbsteinschätzung deutlich von der Fremdeinschätzung ab (FA-27)?
 *
 * Gibt zurück, in welche Richtung – oder `null`, wenn einer der beiden Werte
 * fehlt oder die Abweichung unter der Schwelle liegt.
 */
export function selbstbildAbweichung(ergebnis: Sprintergebnis): 'hoeher' | 'niedriger' | null {
  if (ergebnis.selbst === null || ergebnis.peer === null) return null;
  const abstand = ergebnis.selbst - ergebnis.peer.prozent;
  if (Math.abs(abstand) < ABWEICHUNG_SCHWELLE) return null;
  return abstand > 0 ? 'hoeher' : 'niedriger';
}

/** Schlüssel einer Bewertung im Datenbestand. */
export function bewertungsSchluessel(sprintId: string, teamId: string): string {
  return `${sprintId}__${teamId}`;
}

/**
 * Note zu einem Prozentwert (FA-25).
 *
 * Es gilt die beste Note, deren untere Grenze erreicht ist. Ohne Prozentwert
 * gibt es keine Note.
 */
export function note(prozent: number | null, notenschluessel: Notenstufe[]): number | null {
  if (prozent === null || !istZahl(prozent) || notenschluessel.length === 0) return null;
  const absteigend = [...notenschluessel].sort((a, b) => b.ab - a.ab);
  for (const stufe of absteigend) {
    if (prozent >= stufe.ab) return stufe.note;
  }
  return absteigend[absteigend.length - 1].note;
}

/** Formatiert einen Prozentwert für die Anzeige (deutsche Schreibweise). */
export function formatProzent(wert: number | null, nachkommastellen = 0): string {
  if (wert === null || !istZahl(wert)) return '–';
  return wert.toLocaleString('de-AT', {
    minimumFractionDigits: nachkommastellen,
    maximumFractionDigits: nachkommastellen,
  });
}
