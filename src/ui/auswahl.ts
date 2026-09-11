/**
 * Ableitungen aus dem Datenbestand für die Oberfläche: Filtern und Sortieren.
 * Enthält keine Bewertungslogik.
 */

import type { Datenbestand, Id, Person, Sprint, Team } from '../domain/types';
import type { UiZustand } from './useUiZustand';

const nachName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'de');

export function klassen(daten: Datenbestand) {
  return [...daten.klassen].sort(nachName);
}

export function teamsVon(daten: Datenbestand, klasseId: Id | null): Team[] {
  if (!klasseId) return [];
  return daten.teams.filter((t) => t.klasseId === klasseId).sort(nachName);
}

export function personenVon(daten: Datenbestand, klasseId: Id | null, teamId?: Id | null): Person[] {
  if (!klasseId) return [];
  return daten.personen
    .filter((p) => p.klasseId === klasseId && (teamId === undefined || p.teamId === teamId))
    .sort(nachName);
}

export function sprintsVon(daten: Datenbestand, klasseId: Id | null): Sprint[] {
  if (!klasseId) return [];
  return daten.sprints.filter((s) => s.klasseId === klasseId).sort((a, b) => a.nummer - b.nummer);
}

/**
 * Hält die Auswahl gültig: Verschwindet die gewählte Klasse, der Sprint oder
 * das Team, rückt automatisch ein vorhandener Eintrag nach.
 */
export function auswahlKorrigieren(daten: Datenbestand, ui: UiZustand): Partial<UiZustand> | null {
  const aenderung: Partial<UiZustand> = {};
  const alleKlassen = klassen(daten);

  const klasseId = alleKlassen.some((k) => k.id === ui.klasseId)
    ? ui.klasseId
    : (alleKlassen[0]?.id ?? null);
  if (klasseId !== ui.klasseId) aenderung.klasseId = klasseId;

  const sprints = sprintsVon(daten, klasseId);
  const sprintId = sprints.some((s) => s.id === ui.sprintId)
    ? ui.sprintId
    : (sprints[sprints.length - 1]?.id ?? null);
  if (sprintId !== ui.sprintId) aenderung.sprintId = sprintId;

  const teams = teamsVon(daten, klasseId);
  const teamId = teams.some((t) => t.id === ui.teamId) ? ui.teamId : (teams[0]?.id ?? null);
  if (teamId !== ui.teamId) aenderung.teamId = teamId;

  const mitglieder = personenVon(daten, klasseId, teamId);
  const bewerterId = mitglieder.some((p) => p.id === ui.bewerterId)
    ? ui.bewerterId
    : (mitglieder[0]?.id ?? null);
  if (bewerterId !== ui.bewerterId) aenderung.bewerterId = bewerterId;

  return Object.keys(aenderung).length > 0 ? aenderung : null;
}

/** Kurze, ausreichend eindeutige Kennung für neue Datensätze. */
export function neueId(praefix: string): string {
  const zufall = Math.random().toString(36).slice(2, 8);
  const zeit = Date.now().toString(36).slice(-4);
  return `${praefix}${zufall}${zeit}`;
}
