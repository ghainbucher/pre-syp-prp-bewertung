/**
 * Alle Änderungen am Datenbestand.
 *
 * Bewusste Entscheidung: Jede Aktion arbeitet auf einer tiefen Kopie des
 * gesamten Bestands. Bei den in A-1 festgelegten Größen (höchstens 40 Personen
 * und 12 Abschnitte) liegt der Bestand deutlich unter 1 MB; die Kopie kostet
 * Bruchteile einer Millisekunde und erspart fehleranfällige verschachtelte
 * Aktualisierungen. Für React entsteht dadurch zugleich eine neue Identität.
 */

import {
  RUBRIK_DIPLOMARBEIT,
  RUBRIK_SPRINT,
  STANDARD_NOTENSCHLUESSEL,
  VORLAGE_RUBRIK_DIPLOMARBEIT,
  VORLAGE_RUBRIK_SPRINT,
  leererDatenbestand,
  strukturKopie,
} from '../domain/defaults';
import { bewertungsSchluessel } from '../domain/scoring';
import { rubrikVon, teamIn } from '../domain/zuordnung';
import type {
  Abschnitt,
  Bewertung,
  Datenbestand,
  Id,
  KategorieSchluessel,
  Kriterium,
  Rubrik,
  Strang,
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
  | { art: 'zugehoerigkeit/setzen'; abschnittId: Id; personId: Id; teamId: Id | null }
  | { art: 'abschnitt/anlegen'; abschnitt: Abschnitt; rubrik?: Rubrik }
  | { art: 'abschnitt/aendern'; id: Id; aenderung: Partial<Omit<Abschnitt, 'id' | 'klasseId'>> }
  | { art: 'abschnitt/loeschen'; id: Id }
  | {
      art: 'bewertung/punkte';
      abschnittId: Id;
      teamId: Id | null;
      kategorie: PunkteKategorie;
      kriteriumId: Id;
      wert: number | null;
    }
  | {
      art: 'bewertung/individuell';
      abschnittId: Id;
      teamId: Id | null;
      personId: Id;
      kriteriumId: Id;
      wert: number | null;
    }
  | { art: 'bewertung/individuellNotiz'; abschnittId: Id; teamId: Id | null; personId: Id; notiz: string }
  | {
      art: 'bewertung/peer';
      abschnittId: Id;
      teamId: Id | null;
      bewerterId: Id;
      bewerteterId: Id;
      kriteriumId: Id;
      wert: number | null;
    }
  | { art: 'bewertung/notiz'; abschnittId: Id; teamId: Id | null; notiz: string }
  | { art: 'rubrik/anlegen'; rubrik: Rubrik }
  | { art: 'rubrik/umbenennen'; rubrikId: Id; name: string }
  | { art: 'rubrik/loeschen'; rubrikId: Id }
  | { art: 'rubrik/kriteriumAendern'; rubrikId: Id; kategorie: KategorieSchluessel; index: number; aenderung: Partial<Kriterium> }
  | { art: 'rubrik/kriteriumHinzufuegen'; rubrikId: Id; kategorie: KategorieSchluessel; kriterium: Kriterium }
  | { art: 'rubrik/kriteriumLoeschen'; rubrikId: Id; kategorie: KategorieSchluessel; index: number }
  | { art: 'rubrik/gewicht'; rubrikId: Id; kategorie: KategorieSchluessel; wert: number }
  | { art: 'rubrik/selbstZaehlt'; rubrikId: Id; wert: boolean }
  | { art: 'rubrik/zuruecksetzen'; rubrikId: Id }
  | { art: 'notengrenze'; note: number; ab: number }
  | { art: 'strang/gewicht'; strang: Strang; wert: number }
  | { art: 'daten/ersetzen'; daten: Datenbestand }
  | { art: 'daten/loeschen' };

/** Holt die Bewertung eines Teams in einem Abschnitt oder legt sie an. */
function bewertungHolen(daten: Datenbestand, abschnittId: Id, teamId: Id | null): Bewertung {
  const vorhanden = daten.bewertungen.find(
    (b) => b.abschnittId === abschnittId && b.teamId === teamId,
  );
  if (vorhanden) return vorhanden;
  const neu: Bewertung = {
    abschnittId,
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

/**
 * Friert die Rubrik eines Abschnitts ein (FA-65).
 *
 * Aufgerufen beim ersten gesetzten Punktewert. Ab diesem Moment gilt für
 * diesen Abschnitt die Kopie – spätere Änderungen an der Rubrik wirken nur
 * noch auf Abschnitte, die noch keine Kopie tragen.
 */
function einfrierenFallsNoetig(daten: Datenbestand, abschnittId: Id): void {
  const abschnitt = daten.abschnitte.find((a) => a.id === abschnittId);
  if (!abschnitt || abschnitt.rubrikKopie) return;
  abschnitt.rubrikKopie = strukturKopie(rubrikVon(daten, abschnitt));
  abschnitt.eingefrorenAm = new Date().toISOString();
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

/** Die Rubrik mit dieser Kennung im (bereits kopierten) Bestand. */
function rubrikSuchen(daten: Datenbestand, rubrikId: Id): Rubrik | undefined {
  return daten.rubriken.find((r) => r.id === rubrikId);
}

/**
 * Überträgt die Teamzuordnung auf einen neu angelegten Abschnitt (FA-58 AK-2).
 *
 * Grundlage ist der zuletzt angelegte Abschnitt derselben Klasse; gibt es
 * keinen, die Vorbelegung an der Person. Für Tests entfällt das – dort gibt es
 * kein Team.
 */
function zugehoerigkeitenUebernehmen(daten: Datenbestand, neu: Abschnitt): void {
  if (neu.art === 'test') return;
  const vorherige = daten.abschnitte
    .filter((a) => a.klasseId === neu.klasseId && a.id !== neu.id && a.art !== 'test')
    .sort((a, b) => a.nummer - b.nummer)
    .pop();

  for (const person of daten.personen) {
    if (person.klasseId !== neu.klasseId) continue;
    const teamId = vorherige ? teamIn(daten, vorherige.id, person.id) : person.teamId;
    daten.zugehoerigkeiten.push({ abschnittId: neu.id, personId: person.id, teamId });
  }
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
      const abschnittIds = daten.abschnitte
        .filter((a) => a.klasseId === aktion.id)
        .map((a) => a.id);
      daten.klassen = daten.klassen.filter((k) => k.id !== aktion.id);
      daten.teams = daten.teams.filter((t) => t.klasseId !== aktion.id);
      daten.personen = daten.personen.filter((p) => p.klasseId !== aktion.id);
      daten.abschnitte = daten.abschnitte.filter((a) => a.klasseId !== aktion.id);
      daten.zugehoerigkeiten = daten.zugehoerigkeiten.filter(
        (z) => !abschnittIds.includes(z.abschnittId),
      );
      daten.bewertungen = daten.bewertungen.filter((b) => !abschnittIds.includes(b.abschnittId));
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
      daten.personen = daten.personen.map((p) =>
        p.teamId === aktion.id ? { ...p, teamId: null } : p,
      );
      daten.zugehoerigkeiten = daten.zugehoerigkeiten.map((z) =>
        z.teamId === aktion.id ? { ...z, teamId: null } : z,
      );
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
      daten.zugehoerigkeiten = daten.zugehoerigkeiten.filter((z) => z.personId !== aktion.id);
      for (const bewertung of daten.bewertungen) {
        delete bewertung.individuell[aktion.id];
        delete bewertung.peer[aktion.id];
        for (const zeile of Object.values(bewertung.peer)) delete zeile[aktion.id];
      }
      leereBewertungenEntfernen(daten);
      break;

    case 'zugehoerigkeit/setzen': {
      const vorhanden = daten.zugehoerigkeiten.find(
        (z) => z.abschnittId === aktion.abschnittId && z.personId === aktion.personId,
      );
      if (vorhanden) vorhanden.teamId = aktion.teamId;
      else
        daten.zugehoerigkeiten.push({
          abschnittId: aktion.abschnittId,
          personId: aktion.personId,
          teamId: aktion.teamId,
        });
      break;
    }

    /* ------------------------------------------------------------------ */
    /* Abschnitte (FA-04, FA-56, FA-58, FA-60)                             */
    /* ------------------------------------------------------------------ */
    case 'abschnitt/anlegen': {
      if (aktion.rubrik && !rubrikSuchen(daten, aktion.rubrik.id)) {
        daten.rubriken.push(strukturKopie(aktion.rubrik));
      }
      const neu = strukturKopie(aktion.abschnitt);
      daten.abschnitte.push(neu);
      zugehoerigkeitenUebernehmen(daten, neu);
      break;
    }

    case 'abschnitt/aendern': {
      const abschnitt = daten.abschnitte.find((a) => a.id === aktion.id);
      if (abschnitt) Object.assign(abschnitt, aktion.aenderung);
      break;
    }

    case 'abschnitt/loeschen': {
      const abschnitt = daten.abschnitte.find((a) => a.id === aktion.id);
      daten.abschnitte = daten.abschnitte.filter((a) => a.id !== aktion.id);
      daten.zugehoerigkeiten = daten.zugehoerigkeiten.filter((z) => z.abschnittId !== aktion.id);
      daten.bewertungen = daten.bewertungen.filter((b) => b.abschnittId !== aktion.id);
      // Die Rubrik eines Tests gehört nur diesem Test und geht mit ihm.
      if (abschnitt?.art === 'test') {
        const nochVerwendet = daten.abschnitte.some((a) => a.rubrikId === abschnitt.rubrikId);
        if (!nochVerwendet && abschnitt.rubrikId !== daten.vorgabeRubrikId) {
          daten.rubriken = daten.rubriken.filter((r) => r.id !== abschnitt.rubrikId);
        }
      }
      break;
    }

    /* ------------------------------------------------------------------ */
    /* Bewertung (FA-12 bis FA-16, FA-65)                                  */
    /* ------------------------------------------------------------------ */
    case 'bewertung/punkte': {
      if (aktion.wert !== null) einfrierenFallsNoetig(daten, aktion.abschnittId);
      const bewertung = bewertungHolen(daten, aktion.abschnittId, aktion.teamId);
      punktSetzen(bewertung[aktion.kategorie], aktion.kriteriumId, aktion.wert);
      leereBewertungenEntfernen(daten);
      break;
    }

    case 'bewertung/individuell': {
      if (aktion.wert !== null) einfrierenFallsNoetig(daten, aktion.abschnittId);
      const bewertung = bewertungHolen(daten, aktion.abschnittId, aktion.teamId);
      const eintrag = (bewertung.individuell[aktion.personId] ??= { punkte: {}, notiz: '' });
      punktSetzen(eintrag.punkte, aktion.kriteriumId, aktion.wert);
      leereBewertungenEntfernen(daten);
      break;
    }

    case 'bewertung/individuellNotiz': {
      const bewertung = bewertungHolen(daten, aktion.abschnittId, aktion.teamId);
      const eintrag = (bewertung.individuell[aktion.personId] ??= { punkte: {}, notiz: '' });
      eintrag.notiz = aktion.notiz;
      leereBewertungenEntfernen(daten);
      break;
    }

    case 'bewertung/peer': {
      if (aktion.wert !== null) einfrierenFallsNoetig(daten, aktion.abschnittId);
      const bewertung = bewertungHolen(daten, aktion.abschnittId, aktion.teamId);
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
      const bewertung = bewertungHolen(daten, aktion.abschnittId, aktion.teamId);
      bewertung.notiz = aktion.notiz;
      leereBewertungenEntfernen(daten);
      break;
    }

    /* ------------------------------------------------------------------ */
    /* Rubriken (FA-06 bis FA-09, FA-15, FA-55)                            */
    /* ------------------------------------------------------------------ */
    case 'rubrik/anlegen':
      if (!rubrikSuchen(daten, aktion.rubrik.id)) daten.rubriken.push(strukturKopie(aktion.rubrik));
      break;

    case 'rubrik/umbenennen': {
      const rubrik = rubrikSuchen(daten, aktion.rubrikId);
      if (rubrik) rubrik.name = aktion.name;
      break;
    }

    case 'rubrik/loeschen': {
      // FA-55 AK-3: Eine Rubrik, nach der bereits bewertet wurde, bleibt.
      const inVerwendung = daten.abschnitte.some(
        (a) => a.rubrikId === aktion.rubrikId && a.rubrikKopie,
      );
      if (!inVerwendung && aktion.rubrikId !== daten.vorgabeRubrikId) {
        daten.rubriken = daten.rubriken.filter((r) => r.id !== aktion.rubrikId);
        for (const abschnitt of daten.abschnitte) {
          if (abschnitt.rubrikId === aktion.rubrikId) abschnitt.rubrikId = daten.vorgabeRubrikId;
        }
      }
      break;
    }

    case 'rubrik/kriteriumAendern': {
      const rubrik = rubrikSuchen(daten, aktion.rubrikId);
      const kriterium = rubrik?.[aktion.kategorie][aktion.index];
      if (kriterium) Object.assign(kriterium, aktion.aenderung);
      break;
    }

    case 'rubrik/kriteriumHinzufuegen': {
      const rubrik = rubrikSuchen(daten, aktion.rubrikId);
      rubrik?.[aktion.kategorie].push(strukturKopie(aktion.kriterium));
      break;
    }

    case 'rubrik/kriteriumLoeschen': {
      const rubrik = rubrikSuchen(daten, aktion.rubrikId);
      rubrik?.[aktion.kategorie].splice(aktion.index, 1);
      break;
    }

    case 'rubrik/gewicht': {
      const rubrik = rubrikSuchen(daten, aktion.rubrikId);
      if (rubrik) rubrik.gewichte[aktion.kategorie] = Math.max(0, Math.min(100, aktion.wert));
      break;
    }

    case 'rubrik/selbstZaehlt': {
      const rubrik = rubrikSuchen(daten, aktion.rubrikId);
      if (rubrik) rubrik.selbstZaehlt = aktion.wert;
      break;
    }

    case 'rubrik/zuruecksetzen': {
      const index = daten.rubriken.findIndex((r) => r.id === aktion.rubrikId);
      if (index >= 0) {
        if (aktion.rubrikId === RUBRIK_SPRINT) {
          daten.rubriken[index] = strukturKopie(VORLAGE_RUBRIK_SPRINT);
        } else if (aktion.rubrikId === RUBRIK_DIPLOMARBEIT) {
          daten.rubriken[index] = strukturKopie(VORLAGE_RUBRIK_DIPLOMARBEIT);
        }
      }
      break;
    }

    /* ------------------------------------------------------------------ */
    /* Notenschlüssel und Stränge (FA-08, FA-59)                           */
    /* ------------------------------------------------------------------ */
    case 'notengrenze': {
      if (!daten.notenschluessel.length) {
        daten.notenschluessel = strukturKopie(STANDARD_NOTENSCHLUESSEL);
      }
      const stufe = daten.notenschluessel.find((n) => n.note === aktion.note);
      // Die Grenze für Note 5 bleibt fix bei 0 (FA-08).
      if (stufe && stufe.note !== 5) stufe.ab = Math.max(0, Math.min(100, aktion.ab));
      break;
    }

    case 'strang/gewicht':
      daten.strangGewichte[aktion.strang] = Math.max(0, Math.min(100, aktion.wert));
      break;
  }

  return daten;
}

/** Bewertungen als Nachschlagetabelle, wie sie die Berechnung erwartet. */
export function bewertungsIndex(daten: Datenbestand): Map<string, Bewertung> {
  const index = new Map<string, Bewertung>();
  for (const bewertung of daten.bewertungen) {
    index.set(bewertungsSchluessel(bewertung.abschnittId, bewertung.teamId), bewertung);
  }
  return index;
}
