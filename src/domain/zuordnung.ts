/**
 * Zuordnungen im Datenbestand: welche Rubrik gilt für einen Abschnitt, in
 * welchem Team war eine Person in einem Abschnitt.
 *
 * Reine Lesefunktionen ohne Seiteneffekte. Sie stehen in der Domäne, weil die
 * Berechnung sie braucht – und weil die Regel aus FA-65 hier an genau einer
 * Stelle steht statt verstreut in den Ansichten.
 */

import { VORLAGE_RUBRIK_SPRINT } from './defaults';
import type { Abschnitt, Datenbestand, Id, Person, Rubrik, Team, Zeitraum } from './types';

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

/* -------------------------------------------------------------------------- */
/* Stichtage und Beurteilungszeiträume (FA-48)                                */
/* -------------------------------------------------------------------------- */

/**
 * Der Beurteilungszeitraum, den ein Stichtag auswertet (FA-48 AK-5).
 *
 * Ein `zeugnis`-Stichtag schließt einen Zeitraum ab: Er beginnt nach dem
 * vorherigen **Zeugnis**-Stichtag. Ein `kontrolle`-Stichtag erzeugt keinen
 * eigenen Zeitraum, sondern wertet den laufenden bis zu seinem Datum aus –
 * deshalb zählt für den Beginn in beiden Fällen nur die Art `zeugnis`.
 *
 * Ohne Stichtag ist der Zeitraum offen: Dann gilt alles.
 */
export function zeitraumVon(daten: Datenbestand, stichtagId: Id | null): Zeitraum {
  if (!stichtagId) return { von: null, bis: null };
  const sortiert = [...daten.stichtage].sort((a, b) => a.bis.localeCompare(b.bis));
  const stichtag = sortiert.find((s) => s.id === stichtagId);
  if (!stichtag) return { von: null, bis: null };

  const vorherigesZeugnis = sortiert
    .filter((s) => s.art === 'zeugnis' && s.bis < stichtag.bis)
    .pop();
  return { von: vorherigesZeugnis ? vorherigesZeugnis.bis : null, bis: stichtag.bis };
}

/**
 * Liegt der Abschnitt in diesem Zeitraum?
 *
 * Maßgeblich ist sein **Ende**: Ausgewertet wird, was bis zum Stichtag
 * abgeschlossen ist. Ein Abschnitt ohne Enddatum lässt sich keinem Zeitraum
 * zuordnen – er wird ausgelassen und gesondert gemeldet, statt stillschweigend
 * in einem beliebigen Zeitraum zu landen (siehe `auslassungen`).
 */
export function imZeitraum(abschnitt: Abschnitt, zeitraum: Zeitraum): boolean {
  if (zeitraum.von === null && zeitraum.bis === null) return true;
  const ende = abschnitt.bis.trim();
  if (!ende) return false;
  if (zeitraum.von !== null && ende <= zeitraum.von) return false;
  if (zeitraum.bis !== null && ende > zeitraum.bis) return false;
  return true;
}

/** Abschnitte einer Klasse, eingeschränkt auf einen Zeitraum (FA-48 AK-1, AK-2). */
export function abschnitteImZeitraum(
  daten: Datenbestand,
  klasseId: Id | null,
  zeitraum: Zeitraum,
): Abschnitt[] {
  return abschnitteVon(daten, klasseId).filter((a) => imZeitraum(a, zeitraum));
}

/**
 * Abschnitte, die eine Stichtagsauswertung nicht zuordnen kann (FA-48).
 *
 * Ohne Enddatum ist ein Abschnitt keinem Zeitraum zuzurechnen. Die Anwendung
 * lässt ihn aus **und sagt es** – ein stilles Weglassen wäre ein falscher
 * Stand, ein stilles Mitzählen ein falscher Zeitraum.
 */
export function auslassungen(
  daten: Datenbestand,
  klasseId: Id | null,
  zeitraum: Zeitraum,
): Abschnitt[] {
  if (zeitraum.von === null && zeitraum.bis === null) return [];
  return abschnitteVon(daten, klasseId).filter((a) => !a.bis.trim());
}

/**
 * Personen, für die die Rückmeldung zu diesem Abschnitt noch aussteht
 * (FA-42 AK-4).
 *
 * Gefragt wird nur nach denen, die in diesem Abschnitt überhaupt bewertet
 * werden – wer keinem Team zugeordnet ist, steht nicht auf der Liste.
 */
export function rueckmeldungOffen(
  daten: Datenbestand,
  abschnittId: Id,
  bewertungen: Map<string, { individuell: Record<Id, { rueckmeldung?: unknown }> }>,
): Person[] {
  const abschnitt = daten.abschnitte.find((a) => a.id === abschnittId);
  if (!abschnitt) return [];

  return daten.personen
    .filter((p) => p.klasseId === abschnitt.klasseId)
    .filter((p) => {
      const teamId = abschnitt.art === 'test' ? null : teamIn(daten, abschnittId, p.id);
      if (abschnitt.art !== 'test' && teamId === null) return false;
      const bewertung = bewertungen.get(`${abschnittId}__${teamId ?? '-'}`);
      return bewertung?.individuell?.[p.id]?.rueckmeldung === undefined;
    })
    .sort(nachName);
}
