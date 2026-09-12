/**
 * Zuordnungen im Datenbestand: welche Rubrik gilt für einen Abschnitt, in
 * welchem Team war eine Person in einem Abschnitt.
 *
 * Reine Lesefunktionen ohne Seiteneffekte. Sie stehen in der Domäne, weil die
 * Berechnung sie braucht – und weil die Regel aus FA-65 hier an genau einer
 * Stelle steht statt verstreut in den Ansichten.
 */

import { RUBRIK_VORBEREITUNG, VORLAGE_RUBRIK_SPRINT, strukturKopie } from './defaults';
import type {
  Abschnitt,
  Datenbestand,
  Herkunft,
  Id,
  KategorieSchluessel,
  Kriterium,
  Person,
  Rubrik,
  Team,
  Teamabschnitt,
  Zeitraum,
} from './types';

const nachName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'de');

/**
 * Die für einen Abschnitt maßgebliche Rubrik (FA-65 AK-2).
 *
 * **Immer diese Funktion verwenden, nie `daten.rubriken` direkt.** Sobald ein
 * Abschnitt eine Rubrikkopie trägt, gilt sie – auch wenn die zugeordnete
 * Rubrik inzwischen anders aussieht. Der Fehler ist von außen unsichtbar und
 * fällt erst auf, wenn eine Belegfassung die falschen Kriterien zeigt.
 */
export function rubrikFuer(
  daten: Datenbestand,
  abschnitt: Abschnitt | undefined,
  teamId: Id | null,
): Rubrik {
  if (abschnitt && teamId) {
    const planung = planungVon(daten, abschnitt.id, teamId);
    if (planung?.rubrikKopie) return planung.rubrikKopie;
  }
  if (abschnitt?.rubrikKopie) return abschnitt.rubrikKopie;
  const zugeordnet = abschnitt
    ? daten.rubriken.find((r) => r.id === abschnitt.rubrikId)
    : undefined;
  if (zugeordnet) return zugeordnet;
  const vorgabe = daten.rubriken.find((r) => r.id === daten.vorgabeRubrikId);
  return vorgabe ?? daten.rubriken[0] ?? VORLAGE_RUBRIK_SPRINT;
}

/**
 * Die Rubrik eines Abschnitts ohne Bezug auf ein Team.
 *
 * Für Tests (die kein Team haben) und für Ausgaben, die den Abschnitt als
 * Ganzes betreffen – etwa das Kriterienblatt vor dem Sprint.
 */
export function rubrikVon(daten: Datenbestand, abschnitt: Abschnitt | undefined): Rubrik {
  return rubrikFuer(daten, abschnitt, null);
}

/* -------------------------------------------------------------------------- */
/* Planung je Team (FA-66, FA-67)                                             */
/* -------------------------------------------------------------------------- */

/** Die Planung eines Teams für einen Abschnitt, sofern angelegt. */
export function planungVon(
  daten: Datenbestand,
  abschnittId: Id,
  teamId: Id | null,
): Teamabschnitt | undefined {
  if (!teamId) return undefined;
  return daten.teamabschnitte?.find(
    (tp) => tp.abschnittId === abschnittId && tp.teamId === teamId,
  );
}

/** Alle Planungen zu einem Abschnitt. */
export function planungenIn(daten: Datenbestand, abschnittId: Id): Teamabschnitt[] {
  return (daten.teamabschnitte ?? []).filter((tp) => tp.abschnittId === abschnittId);
}

/**
 * Die Planung, aus der die Kriterien des nächsten Sprints stammen (FA-67 AK-7).
 *
 * **Die Kette läuft nur von Sprint zu Sprint** (AK-10). Ein Test und die
 * Diplomarbeitsvorbereitung entstehen aus keinem Sprint und geben an keinen
 * weiter: Sie haben ihre eigenen Kriterien. Ein Sprint sucht also den Sprint
 * mit der größten kleineren Nummer, der eine Planung dieses Teams trägt.
 */
export function vorigePlanung(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  teamId: Id,
): Teamabschnitt | undefined {
  if (abschnitt.art !== 'sprint') return undefined;
  const fruehere = abschnitteVon(daten, abschnitt.klasseId)
    .filter((a) => a.art === 'sprint' && a.nummer < abschnitt.nummer)
    .sort((a, b) => b.nummer - a.nummer);
  for (const frueher of fruehere) {
    const planung = planungVon(daten, frueher.id, teamId);
    if (planung?.rubrikKopie) return planung;
  }
  return undefined;
}

/**
 * Welche Kriterien beim Planen vorgeschlagen werden (FA-67 AK-7, AK-8).
 *
 * Fortgeschrieben wird der eigene Satz des Teams; erst wenn es keinen gibt,
 * greift eine Vorlage. Die Rubrik ist damit Saatgut und nicht Maßstab.
 */
export function kriterienVorschlag(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  teamId: Id,
): { rubrik: Rubrik; herkunft: Herkunft } {
  const vorige = vorigePlanung(daten, abschnitt, teamId);
  if (vorige?.rubrikKopie) {
    return {
      rubrik: strukturKopie(vorige.rubrikKopie),
      herkunft: { art: 'uebernommen', ausAbschnittId: vorige.abschnittId },
    };
  }
  // Kein voriger Sprint – oder gar kein Sprint: die dem Abschnitt zugeordnete
  // Rubrik (AK-8, AK-10).
  const zugeordnet = daten.rubriken.find((r) => r.id === abschnitt.rubrikId);
  const rubrik = zugeordnet ?? rubrikVon(daten, abschnitt);
  return { rubrik: strukturKopie(rubrik), herkunft: { art: 'vorlage', rubrikId: rubrik.id } };
}

/**
 * Alle Kriterien, die beim Planen zur Auswahl stehen (FA-67 AK-2, AK-2a).
 *
 * Zusammengetragen aus: der dem Abschnitt zugeordneten Rubrik, allem, was
 * dieses Team in einem früheren Abschnitt **derselben Art** verwendet hat, bei
 * einem Sprint zusätzlich der Vorlage „Vorbereitungssprint“, und der aktuellen
 * Auswahl – darin steckt auch, was hier neu angelegt wurde.
 *
 * Zurück kommt eine Rubrik-Struktur: Gewichte und `selbstZaehlt` stammen aus
 * der geltenden Rubrik, damit die Ansicht nichts zusammensetzen muss.
 */
export function kriterienVorrat(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  teamId: Id | null,
): Rubrik {
  const geltend = rubrikFuer(daten, abschnitt, teamId);
  const quellen: Rubrik[] = [];

  const zugeordnet = daten.rubriken.find((r) => r.id === abschnitt.rubrikId);
  if (zugeordnet) quellen.push(zugeordnet);

  if (abschnitt.art === 'sprint') {
    const vorbereitung = daten.rubriken.find((r) => r.id === RUBRIK_VORBEREITUNG);
    if (vorbereitung) quellen.push(vorbereitung);
  }

  if (teamId) {
    for (const frueher of abschnitteVon(daten, abschnitt.klasseId)) {
      if (frueher.art !== abschnitt.art || frueher.id === abschnitt.id) continue;
      const planung = planungVon(daten, frueher.id, teamId);
      if (planung?.rubrikKopie) quellen.push(planung.rubrikKopie);
    }
  }

  // Zuletzt die geltende Auswahl: Was hier angelegt wurde, steht sonst nirgends.
  quellen.push(geltend);

  const zusammen = (kategorie: KategorieSchluessel): Kriterium[] => {
    const gesehen = new Set<Id>();
    const liste: Kriterium[] = [];
    for (const quelle of quellen) {
      for (const kriterium of quelle[kategorie]) {
        if (gesehen.has(kriterium.id)) continue;
        gesehen.add(kriterium.id);
        liste.push(kriterium);
      }
    }
    return liste;
  };

  return {
    id: geltend.id,
    name: geltend.name,
    team: zusammen('team'),
    prozess: zusammen('prozess'),
    individuell: zusammen('individuell'),
    peer: zusammen('peer'),
    gewichte: geltend.gewichte,
    selbstZaehlt: geltend.selbstZaehlt,
  };
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

/**
 * Sind für dieses Team in diesem Abschnitt schon Punkte erfasst (FA-67 AK-4)?
 *
 * Danach sind die Kriterien nicht mehr frei änderbar. Steht hier und nicht in
 * der Ansicht: Die Regel entscheidet über die Bewertung und gehört damit in
 * die Domäne (NFA-06).
 */
export function punkteErfasst(daten: Datenbestand, abschnittId: Id, teamId: Id | null): boolean {
  const bewertung = daten.bewertungen.find(
    (b) => b.abschnittId === abschnittId && b.teamId === teamId,
  );
  if (!bewertung) return false;
  if (Object.keys(bewertung.team).length > 0) return true;
  if (Object.keys(bewertung.prozess).length > 0) return true;
  if (Object.keys(bewertung.peer).length > 0) return true;
  return Object.values(bewertung.individuell).some(
    (e) => Object.keys(e.punkte).length > 0 || e.verstehen !== undefined,
  );
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
  return endeImZeitraum(abschnitt.bis, zeitraum);
}

/** Dieselbe Prüfung für ein bereits aufgelöstes Enddatum. */
export function endeImZeitraum(ende: string, zeitraum: Zeitraum): boolean {
  if (zeitraum.von === null && zeitraum.bis === null) return true;
  const wert = ende.trim();
  if (!wert) return false;
  if (zeitraum.von !== null && wert <= zeitraum.von) return false;
  if (zeitraum.bis !== null && wert > zeitraum.bis) return false;
  return true;
}

/**
 * Wann endete dieser Abschnitt für diese Person (FA-48 AK-6, Schemastand 3)?
 *
 * Für einen Test das Datum des Abschnitts – er findet für alle zugleich statt.
 * Sonst das Ende der Planung des Teams, in dem die Person **in diesem
 * Abschnitt** war (FA-58). Liegt keine Planung vor, gilt der Rahmen des
 * Abschnitts (FA-66 AK-3): Ein noch nicht geplanter Sprint soll nicht aus jeder
 * Stichtagsauswertung fallen, nur weil die Planung fehlt.
 */
export function endeFuer(daten: Datenbestand, abschnitt: Abschnitt, personId: Id): string {
  if (abschnitt.art === 'test') return abschnitt.bis;
  const teamId = teamIn(daten, abschnitt.id, personId);
  const planung = planungVon(daten, abschnitt.id, teamId);
  const ende = planung?.bis?.trim();
  return ende ? ende : abschnitt.bis;
}

/** Liegt der Abschnitt für diese Person in diesem Zeitraum (FA-48 AK-6a)? */
export function imZeitraumFuer(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  personId: Id,
  zeitraum: Zeitraum,
): boolean {
  return endeImZeitraum(endeFuer(daten, abschnitt, personId), zeitraum);
}

/** Abschnitte einer Klasse, eingeschränkt auf einen Zeitraum (FA-48 AK-1, AK-2). */
export function abschnitteImZeitraum(
  daten: Datenbestand,
  klasseId: Id | null,
  zeitraum: Zeitraum,
): Abschnitt[] {
  return abschnitteVon(daten, klasseId).filter((a) => {
    if (a.art === 'test') return imZeitraum(a, zeitraum);
    const planungen = planungenIn(daten, a.id);
    // Ein Sprint gehört in die Übersicht, sobald er für **irgendein** Team in
    // den Zeitraum fällt; wen er betrifft, entscheidet dann `imZeitraumFuer`.
    if (planungen.length === 0) return imZeitraum(a, zeitraum);
    return planungen.some((tp) => endeImZeitraum(tp.bis.trim() || a.bis, zeitraum));
  });
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
  person: Person,
  zeitraum: Zeitraum,
): Abschnitt[] {
  if (zeitraum.von === null && zeitraum.bis === null) return [];
  return abschnitteVon(daten, person.klasseId).filter(
    (a) => !endeFuer(daten, a, person.id).trim(),
  );
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
