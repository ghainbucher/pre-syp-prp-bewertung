/**
 * Zuordnungen im Datenbestand: welche Rubrik gilt für einen Abschnitt, in
 * welchem Team war eine Person in einem Abschnitt.
 *
 * Reine Lesefunktionen ohne Seiteneffekte. Sie stehen in der Domäne, weil die
 * Berechnung sie braucht – und weil die Regel aus FA-65 hier an genau einer
 * Stelle steht statt verstreut in den Ansichten.
 */

import { VORLAGE_RUBRIK_SPRINT } from './defaults';
import type { Abschnitt, Datenbestand, Id, Person, Rubrik, Team } from './types';

const nachName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'de');

/**
 * Die für einen Abschnitt maßgebliche Rubrik (FA-65 AK-2).
 *
 * **Immer diese Funktion verwenden, nie `daten.rubriken` direkt.** Sobald ein
 * Abschnitt eine Rubrikkopie trägt, gilt sie – auch wenn die zugeordnete
 * Rubrik inzwischen anders aussieht. Der Fehler ist von außen unsichtbar und
 * fällt erst auf, wenn eine Belegfassung die falschen Kriterien zeigt.
 */
export function rubrikVon(daten: Datenbestand, abschnitt: Abschnitt | undefined): Rubrik {
  if (abschnitt?.rubrikKopie) return abschnitt.rubrikKopie;
  const zugeordnet = abschnitt
    ? daten.rubriken.find((r) => r.id === abschnitt.rubrikId)
    : undefined;
  if (zugeordnet) return zugeordnet;
  const vorgabe = daten.rubriken.find((r) => r.id === daten.vorgabeRubrikId);
  return vorgabe ?? daten.rubriken[0] ?? VORLAGE_RUBRIK_SPRINT;
}

/** Rubrik zu einer Kennung, unabhängig von einem Abschnitt. */
export function rubrikMitId(daten: Datenbestand, rubrikId: Id): Rubrik | undefined {
  return daten.rubriken.find((r) => r.id === rubrikId);
}

/**
 * In welchem Team war die Person in diesem Abschnitt (FA-58)?
 *
 * Maßgeblich ist die eingetragene Zugehörigkeit. Fehlt sie – etwa weil der
 * Abschnitt vor der Person angelegt wurde –, gilt die Vorbelegung an der
 * Person. `null` bedeutet: in diesem Abschnitt keinem Team zugeordnet.
 */
export function teamIn(daten: Datenbestand, abschnittId: Id, personId: Id): Id | null {
  const eintrag = daten.zugehoerigkeiten.find(
    (z) => z.abschnittId === abschnittId && z.personId === personId,
  );
  if (eintrag) return eintrag.teamId;
  return daten.personen.find((p) => p.id === personId)?.teamId ?? null;
}

/** Alle Personen, die in diesem Abschnitt zu diesem Team gehörten. */
export function mitgliederIn(daten: Datenbestand, abschnittId: Id, teamId: Id | null): Person[] {
  const abschnitt = daten.abschnitte.find((a) => a.id === abschnittId);
  if (!abschnitt || teamId === null) return [];
  return daten.personen
    .filter((p) => p.klasseId === abschnitt.klasseId && teamIn(daten, abschnittId, p.id) === teamId)
    .sort(nachName);
}

/** Alle Teams, die in diesem Abschnitt mindestens ein Mitglied hatten (FA-58 AK-7). */
export function teamsIn(daten: Datenbestand, abschnittId: Id): Team[] {
  const abschnitt = daten.abschnitte.find((a) => a.id === abschnittId);
  if (!abschnitt) return [];
  const belegt = new Set<Id>();
  for (const person of daten.personen) {
    if (person.klasseId !== abschnitt.klasseId) continue;
    const teamId = teamIn(daten, abschnittId, person.id);
    if (teamId) belegt.add(teamId);
  }
  return daten.teams.filter((t) => belegt.has(t.id)).sort(nachName);
}

/** Abschnitte einer Klasse, in Reihenfolge ihrer Nummer. */
export function abschnitteVon(daten: Datenbestand, klasseId: Id | null): Abschnitt[] {
  if (!klasseId) return [];
  return daten.abschnitte
    .filter((a) => a.klasseId === klasseId)
    .sort((a, b) => a.nummer - b.nummer);
}

/** Abschnitte einer Klasse in einem Strang. */
export function abschnitteVonStrang(
  daten: Datenbestand,
  klasseId: Id | null,
  strang: Abschnitt['strang'],
): Abschnitt[] {
  return abschnitteVon(daten, klasseId).filter((a) => a.strang === strang);
}

/** Trägt dieser Abschnitt bereits erfasste Punkte? Entscheidet über FA-65. */
export function hatBewertung(daten: Datenbestand, abschnittId: Id): boolean {
  return daten.bewertungen.some((b) => b.abschnittId === abschnittId);
}
