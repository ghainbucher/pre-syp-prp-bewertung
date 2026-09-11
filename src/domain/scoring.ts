/**
 * Berechnung von Prozentwerten und Noten.
 *
 * Reine Funktionen ohne Zustand und ohne Seiteneffekte – siehe
 * docs/solution-design.md, Abschnitt 6. Umsetzung von FA-21 bis FA-25 und
 * FA-59 (zwei Stränge).
 */

import type {
  Abschnitt,
  AbschnittMitErgebnis,
  Abschnittsergebnis,
  Bewertung,
  Datenbestand,
  Gesamtergebnis,
  Id,
  Kategorieergebnis,
  Kriterium,
  Notenstufe,
  Peerergebnis,
  Person,
  Punkte,
  Rubrik,
  Strang,
  Strangergebnis,
} from './types';
import { abschnitteVon, mitgliederIn, rubrikVon, teamIn, teamsIn } from './zuordnung';

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
  personId: Id,
  teammitglieder: Person[],
  rubrik: Rubrik,
): Peerergebnis | null {
  if (!bewertung || rubrik.peer.length === 0) return null;

  let summe = 0;
  let anzahlUrteile = 0;
  const bewertende = new Set<Id>();

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
  personId: Id,
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
 * Ergebnis einer Person in einem Abschnitt aus schon aufgelösten Bausteinen.
 *
 * Gewichtetes Mittel der vorhandenen Kategorieergebnisse. Kategorien ohne
 * Daten und Kategorien mit Gewicht 0 werden aus der Gewichtung
 * herausgerechnet – sie gelten nicht als 0 Prozent (ADR-004).
 */
export function ergebnisAusRubrik(
  bewertung: Bewertung | undefined,
  person: Person,
  teammitglieder: Person[],
  rubrik: Rubrik,
  peerAktiv: boolean,
): Abschnittsergebnis {
  const team = kategorieErgebnis(bewertung?.team, rubrik.team);
  const prozess = kategorieErgebnis(bewertung?.prozess, rubrik.prozess);
  const individuell = kategorieErgebnis(
    bewertung?.individuell?.[person.id]?.punkte,
    rubrik.individuell,
  );
  const peer = peerAktiv ? peerErgebnis(bewertung, person.id, teammitglieder, rubrik) : null;

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
    selbst: peerAktiv ? selbstEinschaetzung(bewertung, person.id, rubrik) : null,
    fehlend,
  };
}

/**
 * Ergebnis einer Person in einem Abschnitt (FA-23).
 *
 * Löst Rubrik, Team und Teammitglieder aus dem Bestand auf – für einen Test
 * ohne Team greift dabei der Schlüssel mit `null`.
 */
export function abschnittsErgebnis(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  person: Person,
  bewertungen: Map<string, Bewertung>,
): Abschnittsergebnis {
  const rubrik = rubrikVon(daten, abschnitt);
  const teamId = abschnitt.art === 'test' ? null : teamIn(daten, abschnitt.id, person.id);
  const bewertung = bewertungen.get(bewertungsSchluessel(abschnitt.id, teamId));
  const mitglieder = mitgliederIn(daten, abschnitt.id, teamId);
  return ergebnisAusRubrik(bewertung, person, mitglieder, rubrik, abschnitt.peerAktiv);
}

/**
 * Ist die Bewertung dieses Abschnitts abgeschlossen (FA-53 AK-1)?
 *
 * Gemessen an dem, was erfasst ist – nicht an einem Schalter „fertig“: Der
 * Abschnitt gilt als abgeschlossen, wenn es mindestens ein Team gibt und jedes
 * Mitglied jedes Teams ein Ergebnis hat. Ein Team ohne Mitglieder zählt nicht
 * als erledigt, sondern als unvollständig.
 */
export function abschnittAbgeschlossen(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  bewertungen: Map<string, Bewertung>,
): boolean {
  const teams = teamsIn(daten, abschnitt.id);
  if (teams.length === 0) return false;

  return teams.every((team) => {
    const mitglieder = mitgliederIn(daten, abschnitt.id, team.id);
    if (mitglieder.length === 0) return false;
    return mitglieder.every(
      (person) => abschnittsErgebnis(daten, abschnitt, person, bewertungen).prozent !== null,
    );
  });
}

/**
 * Steht die Nachfrage zur Peer-Bewertung an (FA-53)?
 *
 * Sie steht an, wenn die Bewertung abgeschlossen ist (AK-1), die
 * Peer-Bewertung noch nicht läuft (AK-2) und für diesen Abschnitt noch keine
 * Antwort vorliegt – auch ein „später“ zählt als Antwort und lässt die Frage
 * bis zum nächsten Abschnitt ruhen (AK-3). Für einen Test entfällt sie: dort
 * gibt es kein Team, das sich gegenseitig einschätzen könnte.
 */
export function peerFrageFaellig(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  bewertungen: Map<string, Bewertung>,
): boolean {
  if (abschnitt.art === 'test' || abschnitt.peerAktiv) return false;
  if (daten.peerEntscheidungen.some((e) => e.abschnittId === abschnitt.id)) return false;
  return abschnittAbgeschlossen(daten, abschnitt, bewertungen);
}

/** Mittelt Abschnittsergebnisse mit dem Faktor des jeweiligen Abschnitts. */
function gewichtetesMittel(eintraege: AbschnittMitErgebnis[]): number | null {
  let gewichtssumme = 0;
  let summe = 0;
  for (const eintrag of eintraege) {
    if (eintrag.ergebnis.prozent === null) continue;
    const faktor = istZahl(eintrag.abschnitt.faktor) ? Math.max(0, eintrag.abschnitt.faktor) : 1;
    if (faktor === 0) continue;
    gewichtssumme += faktor;
    summe += faktor * eintrag.ergebnis.prozent;
  }
  return gewichtssumme > 0 ? summe / gewichtssumme : null;
}

/** Stand einer Person in einem Strang (FA-59 AK-2). */
export function strangErgebnis(
  daten: Datenbestand,
  person: Person,
  strang: Strang,
  bewertungen: Map<string, Bewertung>,
): Strangergebnis {
  const abschnitte = abschnitteVon(daten, person.klasseId)
    .filter((a) => a.strang === strang)
    .map((abschnitt) => ({
      abschnitt,
      ergebnis: abschnittsErgebnis(daten, abschnitt, person, bewertungen),
    }));
  return { strang, prozent: gewichtetesMittel(abschnitte), abschnitte };
}

/**
 * Gesamtstand einer Person (FA-24, FA-59 AK-3).
 *
 * Gewichtetes Mittel der beiden Strangstände, Vorgabe 75 zu 25. Ein Strang
 * ohne jedes Ergebnis fällt aus der Gewichtung, statt als 0 zu zählen
 * (FA-59 AK-5) – sonst zeigte die Anwendung im Oktober, wenn noch kein Test
 * geschrieben wurde, einen um ein Viertel gedrückten Wert.
 */
export function gesamtErgebnis(
  daten: Datenbestand,
  person: Person,
  bewertungen: Map<string, Bewertung>,
): Gesamtergebnis {
  const praxis = strangErgebnis(daten, person, 'praxis', bewertungen);
  const theorie = strangErgebnis(daten, person, 'theorie', bewertungen);

  let gewichtssumme = 0;
  let summe = 0;
  for (const strang of [praxis, theorie]) {
    if (strang.prozent === null) continue;
    const gewicht = Math.max(0, daten.strangGewichte[strang.strang] ?? 0);
    if (gewicht === 0) continue;
    gewichtssumme += gewicht;
    summe += gewicht * strang.prozent;
  }

  const alle = [...praxis.abschnitte, ...theorie.abschnitte].sort(
    (a, b) => a.abschnitt.nummer - b.abschnitt.nummer,
  );

  return {
    prozent: gewichtssumme > 0 ? summe / gewichtssumme : null,
    praxis,
    theorie,
    alle,
  };
}

/**
 * Weicht die Selbsteinschätzung deutlich von der Fremdeinschätzung ab (FA-27)?
 *
 * Gibt zurück, in welche Richtung – oder `null`, wenn einer der beiden Werte
 * fehlt oder die Abweichung unter der Schwelle liegt.
 */
export function selbstbildAbweichung(ergebnis: Abschnittsergebnis): 'hoeher' | 'niedriger' | null {
  if (ergebnis.selbst === null || ergebnis.peer === null) return null;
  const abstand = ergebnis.selbst - ergebnis.peer.prozent;
  if (Math.abs(abstand) < ABWEICHUNG_SCHWELLE) return null;
  return abstand > 0 ? 'hoeher' : 'niedriger';
}

/**
 * Schlüssel einer Bewertung im Datenbestand.
 *
 * `null` als Team steht für einen Abschnitt ohne Team – bei einem Test gibt es
 * genau eine Bewertung je Abschnitt, in der die Punkte je Person liegen.
 */
export function bewertungsSchluessel(abschnittId: Id, teamId: Id | null): string {
  return `${abschnittId}__${teamId ?? '-'}`;
}

/**
 * Note zu einem Prozentwert (FA-25).
 *
 * Es gilt die beste Note, deren untere Grenze erreicht ist. Ohne Prozentwert
 * gibt es keine Note. Der Wert ist ein **Vorschlag** und wird nie gespeichert
 * (G8, FA-25 AK-3).
 */
export function note(prozent: number | null, notenschluessel: Notenstufe[]): number | null {
  if (prozent === null || !istZahl(prozent) || notenschluessel.length === 0) return null;
  const absteigend = [...notenschluessel].sort((a, b) => b.ab - a.ab);
  for (const stufe of absteigend) {
    if (prozent >= stufe.ab) return stufe.note;
  }
  return absteigend[absteigend.length - 1].note;
}

/**
 * Ein ISO-Datum (JJJJ-MM-TT) in deutscher Schreibweise.
 *
 * Die Datumsfelder der Oberfläche liefern ISO; angezeigt und ausgegeben wird,
 * was hierzulande lesbar ist. Ein leerer oder unerwarteter Wert kommt
 * unverändert zurück – hier wird nichts geraten.
 */
export function datumDeutsch(iso: string): string {
  const treffer = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  return treffer ? `${treffer[3]}.${treffer[2]}.${treffer[1]}` : iso;
}

/** Formatiert einen Prozentwert für die Anzeige (deutsche Schreibweise). */
export function formatProzent(wert: number | null, nachkommastellen = 0): string {
  if (wert === null || !istZahl(wert)) return '–';
  return wert.toLocaleString('de-AT', {
    minimumFractionDigits: nachkommastellen,
    maximumFractionDigits: nachkommastellen,
  });
}
