/**
 * Alle Änderungen am Datenbestand.
 *
 * Bewusste Entscheidung: Jede Aktion arbeitet auf einer tiefen Kopie des
 * gesamten Bestands. Bei den in A-1 festgelegten Größen (höchstens 40 Personen
 * und 12 Sprints) liegt der Bestand deutlich unter 1 MB; die Kopie kostet
 * Bruchteile einer Millisekunde und erspart fehleranfällige verschachtelte
 * Aktualisierungen. Für React entsteht dadurch zugleich eine neue Identität.
 */

import { VORLAGE_RUBRIK, leererDatenbestand, strukturKopie } from '../domain/defaults';
import { bewertungsSchluessel } from '../domain/scoring';
import type {
  Bewertung,
  Datenbestand,
  Id,
  KategorieSchluessel,
  Kriterium,
  Sprint,
} from '../domain/types';

export type PunkteKategorie = Extract<KategorieSchluessel, 'team' | 'prozess'>;

export type Aktion =
  | { art: 'klasse/anlegen'; id: Id; name: string }
  | { art: 'klasse/umbenennen'; id: Id; name: string }
  | { art: 'klasse/loeschen'; id: Id }
  | { art: 'team/anlegen'; id: Id; klasseId: Id; name: string }
  | { art: 'team/umbenennen'; id: Id; name: string }
  | { art: 'team/loeschen'; id: Id }
  | { art: 'person/anlegen'; klasseId: Id; teamId: Id | null; namen: Array<{ id: Id; name: string }> }
  | { art: 'person/umbenennen'; id: Id; name: string }
  | { art: 'person/teamSetzen'; id: Id; teamId: Id | null }
  | { art: 'person/loeschen'; id: Id }
  | { art: 'sprint/anlegen'; sprint: Sprint }
  | { art: 'sprint/aendern'; id: Id; aenderung: Partial<Omit<Sprint, 'id' | 'klasseId'>> }
  | { art: 'sprint/loeschen'; id: Id }
  | {
      art: 'bewertung/punkte';
      sprintId: Id;
      teamId: Id;
      kategorie: PunkteKategorie;
      kriteriumId: Id;
      wert: number | null;
    }
  | {
      art: 'bewertung/individuell';
      sprintId: Id;
      teamId: Id;
      personId: Id;
      kriteriumId: Id;
      wert: number | null;
    }
  | { art: 'bewertung/individuellNotiz'; sprintId: Id; teamId: Id; personId: Id; notiz: string }
  | {
      art: 'bewertung/peer';
      sprintId: Id;
      teamId: Id;
      bewerterId: Id;
      bewerteterId: Id;
      kriteriumId: Id;
      wert: number | null;
    }
  | { art: 'bewertung/notiz'; sprintId: Id; teamId: Id; notiz: string }
  | { art: 'rubrik/kriteriumAendern'; kategorie: KategorieSchluessel; index: number; aenderung: Partial<Kriterium> }
  | { art: 'rubrik/kriteriumHinzufuegen'; kategorie: KategorieSchluessel; kriterium: Kriterium }
  | { art: 'rubrik/kriteriumLoeschen'; kategorie: KategorieSchluessel; index: number }
  | { art: 'rubrik/gewicht'; kategorie: KategorieSchluessel; wert: number }
  | { art: 'rubrik/notengrenze'; note: number; ab: number }
  | { art: 'rubrik/selbstZaehlt'; wert: boolean }
  | { art: 'rubrik/zuruecksetzen' }
  | { art: 'daten/ersetzen'; daten: Datenbestand }
  | { art: 'daten/loeschen' };

/** Holt die Bewertung eines Teams in einem Sprint oder legt sie an. */
function bewertungHolen(daten: Datenbestand, sprintId: Id, teamId: Id): Bewertung {
  const vorhanden = daten.bewertungen.find((b) => b.sprintId === sprintId && b.teamId === teamId);
  if (vorhanden) return vorhanden;
  const neu: Bewertung = {
    sprintId,
    teamId,
    team: {},
    prozess: {},
    individuell: {},
    peer: {},
    notiz: '',
  };
  daten.bewertungen.push(neu);
  return neu;
}

/** Setzt oder entfernt einen Punktewert. `null` bedeutet „nicht bewertet“. */
function punktSetzen(ziel: Record<Id, number>, kriteriumId: Id, wert: number | null): void {
  if (wert === null || !Number.isFinite(wert)) {
    delete ziel[kriteriumId];
  } else {
    ziel[kriteriumId] = wert;
  }
}

/** Entfernt Bewertungen, die keine Daten mehr enthalten. */
function leereBewertungenEntfernen(daten: Datenbestand): void {
  daten.bewertungen = daten.bewertungen.filter((b) => {
    const hatPunkte = Object.keys(b.team).length > 0 || Object.keys(b.prozess).length > 0;
    const hatIndividuell = Object.values(b.individuell).some(
      (e) => Object.keys(e.punkte).length > 0 || e.notiz.trim() !== '',
    );
    const hatPeer = Object.values(b.peer).some((zeile) => Object.keys(zeile).length > 0);
    return hatPunkte || hatIndividuell || hatPeer || b.notiz.trim() !== '';
  });
}

export function storeReducer(vorher: Datenbestand, aktion: Aktion): Datenbestand {
  if (aktion.art === 'daten/ersetzen') return strukturKopie(aktion.daten);
  if (aktion.art === 'daten/loeschen') return leererDatenbestand();

  const daten = strukturKopie(vorher);

  switch (aktion.art) {
    /* ------------------------------------------------------------------ */
    /* Stammdaten (FA-01 bis FA-04)                                        */
    /* ------------------------------------------------------------------ */
    case 'klasse/anlegen':
      daten.klassen.push({ id: aktion.id, name: aktion.name });
      break;

    case 'klasse/umbenennen': {
      const klasse = daten.klassen.find((k) => k.id === aktion.id);
      if (klasse) klasse.name = aktion.name;
      break;
    }

    case 'klasse/loeschen': {
      const teamIds = daten.teams.filter((t) => t.klasseId === aktion.id).map((t) => t.id);
      const sprintIds = daten.sprints.filter((s) => s.klasseId === aktion.id).map((s) => s.id);
      daten.klassen = daten.klassen.filter((k) => k.id !== aktion.id);
      daten.teams = daten.teams.filter((t) => t.klasseId !== aktion.id);
      daten.personen = daten.personen.filter((p) => p.klasseId !== aktion.id);
      daten.sprints = daten.sprints.filter((s) => s.klasseId !== aktion.id);
      daten.bewertungen = daten.bewertungen.filter(
        (b) => !teamIds.includes(b.teamId) && !sprintIds.includes(b.sprintId),
      );
      break;
    }

    case 'team/anlegen':
      daten.teams.push({ id: aktion.id, klasseId: aktion.klasseId, name: aktion.name });
      break;

    case 'team/umbenennen': {
      const team = daten.teams.find((t) => t.id === aktion.id);
      if (team) team.name = aktion.name;
      break;
    }

    case 'team/loeschen':
      // Personen bleiben erhalten und sind danach „ohne Team“ (FA-03).
      daten.teams = daten.teams.filter((t) => t.id !== aktion.id);
      daten.personen = daten.personen.map((p) => (p.teamId === aktion.id ? { ...p, teamId: null } : p));
      daten.bewertungen = daten.bewertungen.filter((b) => b.teamId !== aktion.id);
      break;

    case 'person/anlegen':
      for (const eintrag of aktion.namen) {
        daten.personen.push({
          id: eintrag.id,
          klasseId: aktion.klasseId,
          teamId: aktion.teamId,
          name: eintrag.name,
        });
      }
      break;

    case 'person/umbenennen': {
      const person = daten.personen.find((p) => p.id === aktion.id);
      if (person) person.name = aktion.name;
      break;
    }

    case 'person/teamSetzen': {
      const person = daten.personen.find((p) => p.id === aktion.id);
      if (person) person.teamId = aktion.teamId;
      break;
    }

    case 'person/loeschen':
      daten.personen = daten.personen.filter((p) => p.id !== aktion.id);
      for (const bewertung of daten.bewertungen) {
        delete bewertung.individuell[aktion.id];
        delete bewertung.peer[aktion.id];
        for (const zeile of Object.values(bewertung.peer)) delete zeile[aktion.id];
      }
      leereBewertungenEntfernen(daten);
      break;

    case 'sprint/anlegen':
      daten.sprints.push(strukturKopie(aktion.sprint));
      break;

    case 'sprint/aendern': {
      const sprint = daten.sprints.find((s) => s.id === aktion.id);
      if (sprint) Object.assign(sprint, aktion.aenderung);
      break;
    }

    case 'sprint/loeschen':
      daten.sprints = daten.sprints.filter((s) => s.id !== aktion.id);
      daten.bewertungen = daten.bewertungen.filter((b) => b.sprintId !== aktion.id);
      break;

    /* ------------------------------------------------------------------ */
    /* Bewertung (FA-12 bis FA-16)                                         */
    /* ------------------------------------------------------------------ */
    case 'bewertung/punkte': {
      const bewertung = bewertungHolen(daten, aktion.sprintId, aktion.teamId);
      punktSetzen(bewertung[aktion.kategorie], aktion.kriteriumId, aktion.wert);
      leereBewertungenEntfernen(daten);
      break;
    }

    case 'bewertung/individuell': {
      const bewertung = bewertungHolen(daten, aktion.sprintId, aktion.teamId);
      const eintrag = (bewertung.individuell[aktion.personId] ??= { punkte: {}, notiz: '' });
      punktSetzen(eintrag.punkte, aktion.kriteriumId, aktion.wert);
      leereBewertungenEntfernen(daten);
      break;
    }

    case 'bewertung/individuellNotiz': {
      const bewertung = bewertungHolen(daten, aktion.sprintId, aktion.teamId);
      const eintrag = (bewertung.individuell[aktion.personId] ??= { punkte: {}, notiz: '' });
      eintrag.notiz = aktion.notiz;
      leereBewertungenEntfernen(daten);
      break;
    }

    case 'bewertung/peer': {
      const bewertung = bewertungHolen(daten, aktion.sprintId, aktion.teamId);
      const zeile = (bewertung.peer[aktion.bewerterId] ??= {});
      const urteil = (zeile[aktion.bewerteterId] ??= {});
      if (aktion.wert === null) {
        delete urteil[aktion.kriteriumId];
        if (Object.keys(urteil).length === 0) delete zeile[aktion.bewerteterId];
        if (Object.keys(zeile).length === 0) delete bewertung.peer[aktion.bewerterId];
      } else {
        urteil[aktion.kriteriumId] = aktion.wert;
      }
      leereBewertungenEntfernen(daten);
      break;
    }

    case 'bewertung/notiz': {
      const bewertung = bewertungHolen(daten, aktion.sprintId, aktion.teamId);
      bewertung.notiz = aktion.notiz;
      leereBewertungenEntfernen(daten);
      break;
    }

    /* ------------------------------------------------------------------ */
    /* Rubrik (FA-06 bis FA-09, FA-15)                                     */
    /* ------------------------------------------------------------------ */
    case 'rubrik/kriteriumAendern': {
      const kriterium = daten.rubrik[aktion.kategorie][aktion.index];
      if (kriterium) Object.assign(kriterium, aktion.aenderung);
      break;
    }

    case 'rubrik/kriteriumHinzufuegen':
      daten.rubrik[aktion.kategorie].push(strukturKopie(aktion.kriterium));
      break;

    case 'rubrik/kriteriumLoeschen':
      daten.rubrik[aktion.kategorie].splice(aktion.index, 1);
      break;

    case 'rubrik/gewicht':
      daten.rubrik.gewichte[aktion.kategorie] = Math.max(0, Math.min(100, aktion.wert));
      break;

    case 'rubrik/notengrenze': {
      const stufe = daten.rubrik.notenschluessel.find((n) => n.note === aktion.note);
      // Die Grenze für Note 5 bleibt fix bei 0 (FA-08).
      if (stufe && stufe.note !== 5) stufe.ab = Math.max(0, Math.min(100, aktion.ab));
      break;
    }

    case 'rubrik/selbstZaehlt':
      daten.rubrik.selbstZaehlt = aktion.wert;
      break;

    case 'rubrik/zuruecksetzen':
      daten.rubrik = strukturKopie(VORLAGE_RUBRIK);
      break;
  }

  return daten;
}

/** Bewertungen als Nachschlagetabelle, wie sie die Berechnung erwartet. */
export function bewertungsIndex(daten: Datenbestand): Map<string, Bewertung> {
  const index = new Map<string, Bewertung>();
  for (const bewertung of daten.bewertungen) {
    index.set(bewertungsSchluessel(bewertung.sprintId, bewertung.teamId), bewertung);
  }
  return index;
}
