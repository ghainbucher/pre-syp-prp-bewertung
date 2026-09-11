/**
 * Ableitungen aus dem Datenbestand für die Oberfläche: Filtern und Sortieren.
 * Enthält keine Bewertungslogik.
 *
 * Zuordnungsfragen („welche Rubrik gilt“, „wer war in welchem Team“) stehen
 * bewusst in `domain/zuordnung.ts` und werden hier nur benutzt.
 */

import { abschnitteVon, mitgliederIn } from '../domain/zuordnung';
import type { Datenbestand, Id, Person, Team } from '../domain/types';
import type { UiZustand } from './useUiZustand';

const nachName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'de');

export function klassen(daten: Datenbestand) {
  return [...daten.klassen].sort(nachName);
}

export function teamsVon(daten: Datenbestand, klasseId: Id | null): Team[] {
  if (!klasseId) return [];
  return daten.teams.filter((t) => t.klasseId === klasseId).sort(nachName);
}

/** Alle Personen einer Klasse. Die Teamzugehörigkeit hängt am Abschnitt (FA-58). */
export function personenVon(daten: Datenbestand, klasseId: Id | null): Person[] {
  if (!klasseId) return [];
  return daten.personen.filter((p) => p.klasseId === klasseId).sort(nachName);
}

/**
 * Hält die Auswahl gültig: Verschwindet die gewählte Klasse, der Abschnitt,
 * das Team oder die Rubrik, rückt automatisch ein vorhandener Eintrag nach.
 */
export function auswahlKorrigieren(daten: Datenbestand, ui: UiZustand): Partial<UiZustand> | null {
  const aenderung: Partial<UiZustand> = {};
  const alleKlassen = klassen(daten);

  const klasseId = alleKlassen.some((k) => k.id === ui.klasseId)
    ? ui.klasseId
    : (alleKlassen[0]?.id ?? null);
  if (klasseId !== ui.klasseId) aenderung.klasseId = klasseId;

  const abschnitte = abschnitteVon(daten, klasseId);
  const abschnittId = abschnitte.some((a) => a.id === ui.abschnittId)
    ? ui.abschnittId
    : (abschnitte[abschnitte.length - 1]?.id ?? null);
  if (abschnittId !== ui.abschnittId) aenderung.abschnittId = abschnittId;

  const teams = teamsVon(daten, klasseId);
  const teamId = teams.some((t) => t.id === ui.teamId) ? ui.teamId : (teams[0]?.id ?? null);
  if (teamId !== ui.teamId) aenderung.teamId = teamId;

  const mitglieder = abschnittId ? mitgliederIn(daten, abschnittId, teamId) : [];
  const bewerterId = mitglieder.some((p) => p.id === ui.bewerterId)
    ? ui.bewerterId
    : (mitglieder[0]?.id ?? null);
  if (bewerterId !== ui.bewerterId) aenderung.bewerterId = bewerterId;

  const rubrikId = daten.rubriken.some((r) => r.id === ui.rubrikId)
    ? ui.rubrikId
    : (daten.vorgabeRubrikId ?? daten.rubriken[0]?.id ?? null);
  if (rubrikId !== ui.rubrikId) aenderung.rubrikId = rubrikId;

  return Object.keys(aenderung).length > 0 ? aenderung : null;
}

/** Kurze, ausreichend eindeutige Kennung für neue Datensätze. */
export function neueId(praefix: string): string {
  const zufall = Math.random().toString(36).slice(2, 8);
  const zeit = Date.now().toString(36).slice(-4);
  return `${praefix}${zufall}${zeit}`;
}
