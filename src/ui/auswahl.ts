/**
 * Ableitungen aus dem Datenbestand für die Oberfläche: Filtern und Sortieren.
 * Enthält keine Bewertungslogik.
 *
 * Zuordnungsfragen („welche Rubrik gilt“, „wer war in welchem Team“) stehen
 * bewusst in `domain/zuordnung.ts` und werden hier nur benutzt.
 */

import { nurAktive } from '../domain/loeschen';
import {
  abschnitteVon,
  mitgliederIn,
  projektInKlasse,
  sichtbareKlassen,
} from '../domain/zuordnung';
import type { Datenbestand, Id, Person, Team } from '../domain/types';
import type { UiZustand } from './useUiZustand';

const nachName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'de');

/**
 * Alle sichtbaren Klassen (FA-94).
 *
 * Logisch gelöschte fallen hier heraus – und damit aus jeder Auswahlliste,
 * jedem Filter und jeder Auswertung. In bestehenden Bewertungen bleiben sie
 * lesbar, weil die dort über die Kennung nachgeschlagen werden.
 */
export function klassen(daten: Datenbestand) {
  return nurAktive(daten.klassen).sort(nachName);
}

/**
 * Die Projekte einer Klasse (FA-95).
 *
 * `null` heißt **alle Klassen**. Welche Klasse ein Projekt betrifft, ergibt
 * sich aus seinen Mitgliedern und nicht aus einem Feld am Projekt
 * (`projektInKlasse`, Fachkonzept 15.1).
 */
export function teamsVon(daten: Datenbestand, klasseId: Id | null): Team[] {
  return nurAktive(daten.teams)
    .filter((t) => projektInKlasse(daten, t, klasseId))
    .sort(nachName);
}

/**
 * Alle Personen einer Klasse. Die Projektzugehörigkeit hängt am Projekt (A8).
 *
 * `null` heißt **alle Klassen** (FA-95) – aber nur die sichtbaren: Die Schüler
 * einer ausgeblendeten Klasse bleiben ausgeblendet (FA-94).
 */
export function personenVon(daten: Datenbestand, klasseId: Id | null): Person[] {
  const sichtbar = klasseId ? null : sichtbareKlassen(daten);
  return nurAktive(daten.personen)
    .filter((p) => (sichtbar ? sichtbar.has(p.klasseId) : p.klasseId === klasseId))
    .sort(nachName);
}

/**
 * Hält die Auswahl gültig: Verschwindet der gewählte Abschnitt, das Team oder
 * die Rubrik, rückt automatisch ein vorhandener Eintrag nach.
 *
 * **Die Klasse rückt nicht nach.** Verschwindet die gefilterte Klasse, fällt
 * der Filter auf „alle Klassen" zurück und nicht auf die nächstbeste: Wer eine
 * Klasse gelöscht hat, arbeitet danach nicht stillschweigend in einer anderen
 * weiter (FA-95).
 */
export function auswahlKorrigieren(daten: Datenbestand, ui: UiZustand): Partial<UiZustand> | null {
  const aenderung: Partial<UiZustand> = {};
  const alleKlassen = klassen(daten);

  const klasseId =
    ui.klasseId === null || alleKlassen.some((k) => k.id === ui.klasseId) ? ui.klasseId : null;
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

  const sichtbareRubriken = nurAktive(daten.rubriken);
  const rubrikId = sichtbareRubriken.some((r) => r.id === ui.rubrikId)
    ? ui.rubrikId
    : (daten.vorgabeRubrikId ?? sichtbareRubriken[0]?.id ?? null);
  if (rubrikId !== ui.rubrikId) aenderung.rubrikId = rubrikId;

  // Ein gelöschter Stichtag darf die Auswertung nicht leer stehen lassen –
  // auch dann nicht, wenn er nur ausgeblendet wurde (FA-94).
  const stichtagId =
    ui.stichtagId === null || nurAktive(daten.stichtage).some((s) => s.id === ui.stichtagId)
      ? ui.stichtagId
      : null;
  if (stichtagId !== ui.stichtagId) aenderung.stichtagId = stichtagId;

  return Object.keys(aenderung).length > 0 ? aenderung : null;
}

/** Kurze, ausreichend eindeutige Kennung für neue Datensätze. */
export function neueId(praefix: string): string {
  const zufall = Math.random().toString(36).slice(2, 8);
  const zeit = Date.now().toString(36).slice(-4);
  return `${praefix}${zufall}${zeit}`;
}
