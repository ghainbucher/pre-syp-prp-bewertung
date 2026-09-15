/**
 * Zuordnungen im Datenbestand: welche Rubrik gilt für einen Abschnitt, in
 * welchem Team war eine Person in einem Abschnitt.
 *
 * Reine Lesefunktionen ohne Seiteneffekte. Sie stehen in der Domäne, weil die
 * Berechnung sie braucht – und weil die Regel aus FA-65 hier an genau einer
 * Stelle steht statt verstreut in den Ansichten.
 */

import { RUBRIK_VORBEREITUNG, VORLAGE_RUBRIK_SPRINT, strukturKopie } from './defaults';
import { nurAktive } from './loeschen';
import type {
  Abschnitt,
  Datenbestand,
  Herkunft,
  Id,
  Massnahme,
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

/** Die Projekte, in denen dieser Schüler Mitglied ist (FA-87, Fachkonzept 15.1). */
export function projekteVon(daten: Datenbestand, personId: Id): Id[] {
  return daten.mitgliedschaften.filter((m) => m.personId === personId).map((m) => m.projektId);
}

/**
 * Die **anderen** Projekte, in denen dieser Schüler außerdem mitarbeitet
 * (FA-87 AK-5).
 *
 * Parallele Mitgliedschaft ist erlaubt – theoretisch kommt sie vor, praktisch
 * fast nie. Deshalb wird sie nicht verhindert, sondern **benannt**: Die
 * Oberfläche sagt, in welchem anderen Projekt der Schüler schon ist, und
 * verlangt eine ausdrückliche Bestätigung.
 *
 * Die Entscheidung steht hier und nicht in der Ansicht, damit sie prüfbar ist
 * (NFA-06): Eine Komponente rechnet nicht, sie zeigt an.
 */
export function paralleleProjekte(daten: Datenbestand, projektId: Id, personId: Id): Team[] {
  const andere = new Set(projekteVon(daten, personId).filter((id) => id !== projektId));
  return nurAktive(daten.teams)
    .filter((team) => andere.has(team.id))
    .sort(nachName);
}

/**
 * Muss vor dieser Zuordnung nachgefragt werden (FA-87 AK-5)?
 *
 * `true` heißt: **nicht zuordnen, sondern fragen.** Die Zuordnung wird erst mit
 * der Bestätigung geschrieben – und mit ihr das Datum, an dem bestätigt wurde.
 * Das Kästchen springt dadurch beim ersten Klick zurück; genau das ist gewollt.
 */
export function zuordnungBrauchtBestaetigung(
  daten: Datenbestand,
  projektId: Id,
  personId: Id,
): boolean {
  return paralleleProjekte(daten, projektId, personId).length > 0;
}

/**
 * Wer trägt dieselbe GitHub-Kennung wie diese Person (FA-88 AK-4)?
 *
 * Zwei Personen mit einer Kennung machen **jede** Beitragsverteilung falsch,
 * und zwar unbemerkt: Das Auswertungsskript ordnet die Commits einer von
 * beiden zu, und niemand sieht es der Zahl an. Groß- und Kleinschreibung zählt
 * dabei nicht – GitHub unterscheidet sie nicht.
 *
 * Leere Kennungen sind keine Dopplung: Noch nicht erfasst ist nicht dasselbe
 * wie zweimal vergeben.
 */
export function kennungDoppelt(daten: Datenbestand, personId: Id, kennung: string): Person | null {
  const gesucht = kennung.trim().toLowerCase();
  if (gesucht === '') return null;
  return (
    nurAktive(daten.personen).find(
      (p) => p.id !== personId && (p.githubKennung ?? '').trim().toLowerCase() === gesucht,
    ) ?? null
  );
}

/** Alle Schüler dieses Projekts, nach Namen geordnet. */
export function mitgliederVon(daten: Datenbestand, projektId: Id | null): Person[] {
  if (!projektId) return [];
  const ids = new Set(
    daten.mitgliedschaften.filter((m) => m.projektId === projektId).map((m) => m.personId),
  );
  return nurAktive(daten.personen)
    .filter((p) => ids.has(p.id))
    .sort(nachName);
}

/**
 * Welches Projekt dieser Person gilt für diesen Abschnitt (Schemastand 4)?
 *
 * **Die Zuordnung liegt am Projekt, nicht mehr am Abschnitt** (Fachkonzept
 * 15.2, A8). Für einen Abschnitt bleibt trotzdem eine Frage offen, solange ein
 * Abschnitt noch der Klasse gehört: Ein Schüler kann in mehreren Projekten
 * sein. Dann zählt das Projekt, das **für diesen Abschnitt geplant hat**; gibt
 * es keines und ist der Schüler in genau einem Projekt, gilt dieses. Sonst
 * `null` – lieber keine Zuordnung als eine geratene.
 *
 * Der Name bleibt `teamIn`, weil er an rund dreißig Stellen steht und der
 * Umbau auf `Abschnitt.projektId` ohnehin folgt (Solution-Design 5.0d).
 */
export function teamIn(daten: Datenbestand, abschnittId: Id, personId: Id): Id | null {
  const eigene = projekteVon(daten, personId);
  if (eigene.length === 0) return null;
  if (eigene.length === 1) return eigene[0]!;
  const geplant = eigene.filter((projektId) =>
    daten.teamabschnitte.some((tp) => tp.abschnittId === abschnittId && tp.teamId === projektId),
  );
  return geplant.length === 1 ? geplant[0]! : null;
}

/**
 * Alle Personen, die für diesen Abschnitt zu diesem Projekt gehören.
 *
 * Der Abschnitt entscheidet nicht mehr über die Mitgliedschaft – er schränkt
 * nur noch auf die Klasse ein, solange ein Abschnitt einer Klasse gehört.
 */
export function mitgliederIn(daten: Datenbestand, abschnittId: Id, teamId: Id | null): Person[] {
  const abschnitt = daten.abschnitte.find((a) => a.id === abschnittId);
  if (!abschnitt || teamId === null) return [];
  return mitgliederVon(daten, teamId).filter((p) => p.klasseId === abschnitt.klasseId);
}

/** Alle Projekte, die in dieser Klasse mindestens ein Mitglied haben (FA-58 AK-7). */
export function teamsIn(daten: Datenbestand, abschnittId: Id): Team[] {
  const abschnitt = daten.abschnitte.find((a) => a.id === abschnittId);
  if (!abschnitt) return [];
  const belegt = new Set<Id>();
  for (const m of daten.mitgliedschaften) {
    const person = daten.personen.find((p) => p.id === m.personId);
    if (person?.klasseId === abschnitt.klasseId) belegt.add(m.projektId);
  }
  return nurAktive(daten.teams)
    .filter((t) => belegt.has(t.id))
    .sort(nachName);
}

/**
 * Die Kennungen der **sichtbaren** Klassen (FA-94).
 *
 * Eine logisch gelöschte Klasse blendet alles aus, was an ihr hängt: ihre
 * Schüler, ihre Tests, ihre Projekte. Solange jede Liste über eine gewählte
 * Klasse ging, ergab sich das von selbst – die gelöschte Klasse stand in keiner
 * Auswahl mehr. Mit „alle Klassen" (FA-95) ist das nicht mehr so: Ohne diese
 * Menge tauchten die Schüler einer ausgeblendeten Klasse plötzlich wieder auf.
 */
export function sichtbareKlassen(daten: Datenbestand): Set<Id> {
  return new Set(nurAktive(daten.klassen).map((k) => k.id));
}

/**
 * Abschnitte einer Klasse, in Reihenfolge ihrer Nummer.
 *
 * **`null` heißt „alle Klassen"** (FA-95), nicht „keine": Der Klassenfilter der
 * Kopfleiste steht auf jeder Sicht und darf leer bleiben. Sichtbar ist dann
 * alles, was zu einer sichtbaren Klasse gehört.
 */
export function abschnitteVon(daten: Datenbestand, klasseId: Id | null): Abschnitt[] {
  const sichtbar = klasseId ? null : sichtbareKlassen(daten);
  // Logisch gelöschte Abschnitte verschwinden aus jeder Leiste und aus der
  // Rechnung (FA-94); ihre Bewertungen bleiben im Bestand lesbar.
  return nurAktive(daten.abschnitte)
    .filter((a) => (sichtbar ? sichtbar.has(a.klasseId) : a.klasseId === klasseId))
    .sort((a, b) => a.nummer - b.nummer);
}

/**
 * Gehört dieses Projekt zu dieser Klasse (Fachkonzept 15.1)?
 *
 * **Über die Mitglieder, nicht über ein Feld am Projekt.** Die Klasse hängt am
 * Schüler; ein Projekt „gehört" einer Klasse genau dann, wenn einer seiner
 * Schüler in ihr ist. Ein gemischtes Projekt gehört damit zu beiden – und
 * erscheint in beiden Filtern, was der Regelfall bei Diplomarbeiten ist (A9).
 *
 * **Ausnahme für das frisch angelegte Projekt:** Solange es noch keine
 * Mitglieder hat, entscheidet die verwaltende Klasse am Projekt. Sonst
 * verschwände ein gerade angelegtes Projekt sofort aus der Liste, in der es
 * angelegt wurde – und der nächste Schritt, die Schüler zuzuordnen, wäre nicht
 * mehr erreichbar.
 */
export function projektInKlasse(daten: Datenbestand, team: Team, klasseId: Id | null): boolean {
  if (!klasseId) return true;
  const mitglieder = mitgliederVon(daten, team.id);
  if (mitglieder.length === 0) return team.klasseId === klasseId;
  return mitglieder.some((p) => p.klasseId === klasseId);
}

/**
 * Gehört dieser Abschnitt zu dieser Person (FA-70, OP-F17)?
 *
 * Ein Test wird von der ganzen Klasse geschrieben. Ein Sprint gehört dem
 * **Team**: Er zählt für eine Person, wenn ihr Team ihn geplant hat. Hat ihn
 * **kein** Team geplant, gilt er wie früher für die ganze Klasse – so bleiben
 * Bestände lesbar, die vor Schemastand 3 entstanden sind.
 *
 * Das entscheidet nicht nur die Anzeige, sondern auch die Bezugsgröße des
 * Zeitfaktors (FA-54): Die Hälften werden über die Abschnitte gebildet, die
 * diese Person tatsächlich hatte.
 */
export function gehoertZu(daten: Datenbestand, abschnitt: Abschnitt, personId: Id): boolean {
  if (abschnitt.art === 'test') return true;
  const teamId = teamIn(daten, abschnitt.id, personId);
  if (planungVon(daten, abschnitt.id, teamId)) return true;
  return planungenIn(daten, abschnitt.id).length === 0;
}

/** Abschnitte, die ein Team geplant hat – in Reihenfolge ihrer Nummer. */
export function abschnitteVonTeam(
  daten: Datenbestand,
  klasseId: Id | null,
  teamId: Id | null,
  art: Abschnitt['art'],
): Abschnitt[] {
  return abschnitteVon(daten, klasseId).filter((a) => {
    if (a.art !== art) return false;
    if (a.art === 'test') return true;
    if (planungVon(daten, a.id, teamId)) return true;
    return planungenIn(daten, a.id).length === 0;
  });
}

/**
 * Die Ordnungszahl eines Abschnitts **innerhalb seiner Art** (FA-04 AK-5).
 *
 * `nummer` ordnet alle Abschnitte einer Klasse gemeinsam – Sprints, Tests und
 * Diplomarbeitsvorbereitung – und ist damit der Schlüssel für Reihenfolge und
 * Zeitfaktor. Zum Anzeigen taugt sie nicht: Wird ein Test gelöscht, klafft in
 * den Sprintnummern eine Lücke, und der siebte Sprint hieße „S9“.
 *
 * Mit `teamId` wird innerhalb der Sprints **dieses Teams** gezählt: Keplers
 * dritter Sprint ist S3, auch wenn Doppler zu dem Zeitpunkt schon bei fünf ist.
 * Ohne `teamId` zählt die Klasse – so beschriftet die Auswertung ihre Spalten,
 * die für alle gelten.
 */
export function ordnungszahl(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  teamId: Id | null = null,
): number {
  const gleicheArt = teamId
    ? abschnitteVonTeam(daten, abschnitt.klasseId, teamId, abschnitt.art)
    : abschnitteVon(daten, abschnitt.klasseId).filter((a) => a.art === abschnitt.art);
  const stelle = gleicheArt.findIndex((a) => a.id === abschnitt.id);
  return stelle < 0 ? gleicheArt.length + 1 : stelle + 1;
}

/** Vorsilbe je Abschnittsart. */
const VORSILBE: Record<Abschnitt['art'], string> = {
  sprint: 'S',
  test: 'T',
  diplomarbeit: 'DA',
};

/**
 * Das Kürzel, das in Abschnittsleiste und Auswertung steht (FA-04 AK-5).
 *
 * An **einer** Stelle, weil zwei Stellen zwei Zählweisen bedeuten – genau das
 * war am 12.09.2026 zu sehen: ein Chip „S9 Sprint 6“.
 */
export function kurzzeichen(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  teamId: Id | null = null,
): string {
  return `${VORSILBE[abschnitt.art]}${ordnungszahl(daten, abschnitt, teamId)}`;
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

/**
 * Planungen desselben Teams, deren Zeitraum sich mit diesem überschneidet
 * (FA-66 AK-8).
 *
 * Ein Team arbeitet zu einer Zeit an einem Sprint. Überlappen zwei, ist nicht
 * mehr entscheidbar, in welchen eine Leistung gehört – und die
 * Stichtagszuordnung (FA-48) wie der Zeitfaktor (FA-54) hängen genau daran.
 *
 * **Berührung ist keine Überschneidung**: Endet der eine am 17.10. und beginnt
 * der nächste am 17.10., ist das der normale Übergabetag im Unterricht. Nur
 * ein echtes Übereinander zählt.
 */
export function ueberschneidungen(
  daten: Datenbestand,
  abschnittId: Id,
  teamId: Id,
): Teamabschnitt[] {
  const eigene = planungVon(daten, abschnittId, teamId);
  const von = eigene?.von.trim();
  const bis = eigene?.bis.trim();
  if (!von || !bis) return [];

  return (daten.teamabschnitte ?? []).filter((andere) => {
    if (andere.teamId !== teamId || andere.abschnittId === abschnittId) return false;
    const anderesVon = andere.von.trim();
    const anderesBis = andere.bis.trim();
    if (!anderesVon || !anderesBis) return false;
    return von < anderesBis && anderesVon < bis;
  });
}

/** Liegt das Ende vor dem Beginn? Kein Zeitraum, sondern ein Tippfehler. */
export function zeitraumVerdreht(planung: Teamabschnitt | undefined): boolean {
  const von = planung?.von.trim();
  const bis = planung?.bis.trim();
  return Boolean(von && bis && bis < von);
}

/**
 * Der heutige Tag als `JJJJ-MM-TT` – in **Ortszeit**, nicht in UTC.
 *
 * Ein Schultag ist ein Tag vor Ort. `toISOString()` liefert an einem
 * Oktoberabend in Österreich bereits den nächsten Tag; damit fiele der letzte
 * Sprinttag um 22 Uhr aus seinem eigenen Zeitraum.
 */
export function heutigerTag(jetzt = new Date()): string {
  const zwei = (n: number) => String(n).padStart(2, '0');
  return `${jetzt.getFullYear()}-${zwei(jetzt.getMonth() + 1)}-${zwei(jetzt.getDate())}`;
}

/**
 * Der für ein Team maßgebliche Zeitraum eines Abschnitts.
 *
 * Die Planung des Teams geht vor; fehlt sie oder ist sie leer, gilt der Rahmen
 * des Abschnitts (FA-66 AK-3). Für einen Test gilt immer der Abschnitt – er
 * findet für alle zugleich statt.
 */
export function zeitraumFuerTeam(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  teamId: Id | null,
): { von: string; bis: string } {
  if (abschnitt.art === 'test') return { von: abschnitt.von, bis: abschnitt.bis };
  const planung = planungVon(daten, abschnitt.id, teamId);
  return {
    von: planung?.von.trim() || abschnitt.von,
    bis: planung?.bis.trim() || abschnitt.bis,
  };
}

/**
 * Ist das der laufende Abschnitt dieses Teams (FA-76 AK-1)?
 *
 * **Am Datum zu erkennen:** Heute liegt im Zeitraum dieses Teams, Beginn und
 * Ende zählen mit. Da sich die Sprints eines Teams nicht überschneiden
 * (FA-66 AK-8), gibt es höchstens einen. Liegt heute in keinem Zeitraum, ist
 * keiner laufend – das ist beim Nachtragen der Regelfall und kein Fehler
 * (AK-1a).
 *
 * Die Sperre gilt nur für Sprints (AK-6): Ein Test wird an einem Tag
 * geschrieben und danach in einem Zug erfasst, und die
 * Diplomarbeitsvorbereitung läuft ganzjährig.
 *
 * Ein unvollständiger Zeitraum lässt den Abschnitt **offen**: Wer Beginn und
 * Ende noch nicht eingetragen hat, soll nicht ausgesperrt sein.
 */
export function istLaufenderAbschnitt(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  teamId: Id | null,
  heute = heutigerTag(),
): boolean {
  if (abschnitt.art !== 'sprint') return true;
  const { von, bis } = zeitraumFuerTeam(daten, abschnitt, teamId);
  if (!von.trim() || !bis.trim()) return true;
  return von <= heute && heute <= bis;
}

/**
 * Beginnt dieser Abschnitt für dieses Team erst in der Zukunft (FA-76 AK-1c)?
 *
 * Ein künftiger Sprint ist nicht laufend und damit für die Bewertung gesperrt –
 * seine **Planung** muss trotzdem änderbar sein. Vorausplanen heißt, vor dem
 * Beginn zu schreiben; ohne diese Ausnahme wäre ein Vorschlag (FA-77 AK-2)
 * nicht anlegbar.
 */
export function abschnittKuenftig(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  teamId: Id | null,
  heute = heutigerTag(),
): boolean {
  const von = zeitraumFuerTeam(daten, abschnitt, teamId).von.trim();
  return von !== '' && von > heute;
}

/**
 * Der Sprint dieses Teams, der zuletzt geendet hat (FA-76 AK-1a).
 *
 * Liegt heute in keinem Zeitraum, ist nichts beschreibbar. Damit das keine
 * Sackgasse ist, wird gesagt, welcher Sprint zuletzt lief – das ist der, den
 * man in aller Regel nachtragen will.
 */
export function zuletztGelaufenerAbschnitt(
  daten: Datenbestand,
  klasseId: Id | null,
  teamId: Id | null,
  heute = heutigerTag(),
): Abschnitt | undefined {
  const beendet = abschnitteVonTeam(daten, klasseId, teamId, 'sprint')
    .map((a) => ({ a, bis: zeitraumFuerTeam(daten, a, teamId).bis.trim() }))
    .filter((x) => x.bis !== '' && x.bis < heute)
    .sort((x, y) => x.bis.localeCompare(y.bis));
  return beendet[beendet.length - 1]?.a;
}

/* -------------------------------------------------------------------------- */
/* Maßnahmen aus der Retrospektive (FA-80)                                    */
/* -------------------------------------------------------------------------- */

/**
 * Die Maßnahmen, über die im **Folgesprint** Nachschau zu halten ist
 * (FA-80 AK-3).
 *
 * Sie stehen am vorigen Sprint desselben Teams – dort sind sie entstanden, und
 * dort bleibt der Text. Zurückgegeben wird auch der Abschnitt, damit die
 * Herkunft benannt werden kann („aus der Retrospektive von Sprint n“).
 */
export function massnahmenZurNachschau(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  teamId: Id | null,
): { herkunft: Abschnitt; massnahmen: Massnahme[] } | undefined {
  if (abschnitt.art !== 'sprint' || !teamId) return undefined;
  const vorher = vorigerSprint(daten, abschnitt, teamId);
  if (!vorher) return undefined;
  const massnahmen = planungVon(daten, vorher.id, teamId)?.massnahmen ?? [];
  if (massnahmen.length === 0) return undefined;
  return { herkunft: vorher, massnahmen };
}

/**
 * Wie viele Abschnitte dieses Teams **keine Spur** dieser Person tragen
 * (FA-78, drittes Signal von FA-79 AK-4).
 *
 * Gezählt werden nur Sprints, in denen die Person auch dabei war, und nur
 * solche, deren Zeitraum vorbei ist: Im laufenden Sprint ist eine fehlende
 * Spur kein Befund, sondern die Gegenwart.
 */
export function abschnitteOhneSpur(
  daten: Datenbestand,
  personId: Id,
  klasseId: Id | null,
  teamId: Id | null,
  heute = heutigerTag(),
): number {
  let ohne = 0;
  for (const abschnitt of abschnitteVonTeam(daten, klasseId, teamId, 'sprint')) {
    if (teamIn(daten, abschnitt.id, personId) !== teamId) continue;
    if (istLaufenderAbschnitt(daten, abschnitt, teamId, heute)) continue;
    if (abschnittKuenftig(daten, abschnitt, teamId, heute)) continue;
    const bewertung = daten.bewertungen.find(
      (b) => b.abschnittId === abschnitt.id && b.teamId === teamId,
    );
    const spur = bewertung?.individuell?.[personId]?.spur;
    if (!spur?.bezeichnung.trim()) ohne += 1;
  }
  return ohne;
}

/* -------------------------------------------------------------------------- */
/* Zustand einer Planung: Vorschlag, fixiert, abgeschlossen (FA-77)           */
/* -------------------------------------------------------------------------- */

/** Die drei Zustände einer Teamplanung (FA-77 AK-1). */
export type Sprintzustand = 'vorschlag' | 'fixiert' | 'abgeschlossen';

export const ZUSTAND_BEZEICHNUNG: Record<Sprintzustand, string> = {
  vorschlag: 'Vorschlag',
  fixiert: 'fixiert',
  abgeschlossen: 'abgeschlossen',
};

/**
 * In welchem Zustand ist die Planung dieses Teams (FA-77 AK-1, AK-10)?
 *
 * Ohne Planung gilt „Vorschlag“ – es ist noch nichts festgelegt. Fehlt der
 * Fixierungszeitpunkt, gilt eine Planung als fixiert, sobald Punkte erfasst
 * sind: Was bewertet wird, ist nicht mehr Absicht. Die eingefrorene Rubrik
 * taugt dafür **nicht** als Ersatz – sie entsteht schon beim Festhalten der
 * Planung, und das ist gerade der Vorschlag.
 */
export function sprintZustand(
  daten: Datenbestand,
  abschnittId: Id,
  teamId: Id | null,
): Sprintzustand {
  const planung = planungVon(daten, abschnittId, teamId);
  if (!planung) return 'vorschlag';
  if (planung.abgeschlossenAm) return 'abgeschlossen';
  if (planung.fixiertAm) return 'fixiert';
  if (punkteErfasst(daten, abschnittId, teamId)) return 'fixiert';
  return 'vorschlag';
}

/**
 * Der vorige Sprint dieses Teams – unabhängig davon, ob er Kriterien trägt.
 *
 * `vorigePlanung` sucht die Kriterienherkunft und übergeht deshalb Sprints ohne
 * Rubrikkopie. Für die Fixierbedingung (FA-77 AK-3) zählt jeder Vorgänger: Ein
 * Sprint, dessen Kriterien nie festgehalten wurden, ist erst recht nicht
 * abgeschlossen.
 */
export function vorigerSprint(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  teamId: Id | null,
): Abschnitt | undefined {
  if (abschnitt.art !== 'sprint') return undefined;
  const fruehere = abschnitteVonTeam(daten, abschnitt.klasseId, teamId, 'sprint').filter(
    (a) => a.nummer < abschnitt.nummer,
  );
  return fruehere[fruehere.length - 1];
}

/** Was einer Fixierung im Weg steht (FA-77 AK-3, AK-4). */
export interface Fixierbarkeit {
  erlaubt: boolean;
  /** Der Sprint, dessen Review noch fehlt – nur gesetzt, wenn `erlaubt` falsch ist. */
  wartetAuf?: Abschnitt;
}

/**
 * Darf diese Planung fixiert werden (FA-77 AK-3)?
 *
 * Erst, wenn der vorige Sprint desselben Teams abgeschlossen ist. Ohne
 * Vorgänger sofort – der Vorbereitungssprint beginnt ohne einen. Eine bereits
 * fixierte oder abgeschlossene Planung wird nicht erneut fixiert.
 */
export function fixierbarkeit(
  daten: Datenbestand,
  abschnitt: Abschnitt,
  teamId: Id | null,
): Fixierbarkeit {
  if (sprintZustand(daten, abschnitt.id, teamId) !== 'vorschlag') return { erlaubt: false };
  const vorher = vorigerSprint(daten, abschnitt, teamId);
  if (!vorher) return { erlaubt: true };
  if (sprintZustand(daten, vorher.id, teamId) === 'abgeschlossen') return { erlaubt: true };
  return { erlaubt: false, wartetAuf: vorher };
}

/**
 * Was an einem Abschnitt hängt (FA-36 AK-3).
 *
 * Vor dem Löschen zu benennen, was verlorengeht – nicht bloß zu fragen, ob man
 * sicher ist. „Wirklich?“ beantwortet jeder mit Ja; „drei Planungen, 48 Punkte
 * und zwei Rückmeldungen“ nicht.
 *
 * Mit `teamId` wird nur gezählt, was diesem Team gehört.
 */
export interface Abschnittsinhalt {
  /** Teams mit einer festgehaltenen Planung. */
  planungen: number;
  /** Teams, deren Kriterien von der Rubrik abweichen (FA-67). */
  eigeneKriterien: number;
  /** Erfasste Punktewerte – Team, Prozess und individuell zusammen. */
  punkte: number;
  peerUrteile: number;
  notizen: number;
  rueckmeldungen: number;
  verstehensnachweise: number;
  reflexionen: number;
  gesetzteWerte: number;
  /** Gezeigte Spuren (FA-78). */
  spuren: number;
  /** Maßnahmen aus der Retrospektive (FA-80). */
  massnahmen: number;
}

export function abschnittsinhalt(
  daten: Datenbestand,
  abschnittId: Id,
  teamId: Id | null = null,
): Abschnittsinhalt {
  const gehoert = (id: Id | null) => teamId === null || id === teamId;
  const inhalt: Abschnittsinhalt = {
    planungen: 0, eigeneKriterien: 0, punkte: 0, peerUrteile: 0,
    notizen: 0, rueckmeldungen: 0, verstehensnachweise: 0, reflexionen: 0, gesetzteWerte: 0,
    spuren: 0, massnahmen: 0,
  };

  const abschnitt = daten.abschnitte.find((a) => a.id === abschnittId);
  const rubrik = abschnitt ? daten.rubriken.find((r) => r.id === abschnitt.rubrikId) : undefined;

  for (const planung of daten.teamabschnitte ?? []) {
    if (planung.abschnittId !== abschnittId || !gehoert(planung.teamId)) continue;
    inhalt.planungen += 1;
    inhalt.massnahmen += planung.massnahmen?.length ?? 0;
    if (planung.rubrikKopie && rubrik) {
      const anders = (['team', 'prozess', 'individuell', 'peer'] as const).some(
        (k) =>
          planung.rubrikKopie![k].map((x) => x.id).join(',') !==
          rubrik[k].map((x) => x.id).join(','),
      );
      if (anders) inhalt.eigeneKriterien += 1;
    }
  }

  for (const bewertung of daten.bewertungen) {
    if (bewertung.abschnittId !== abschnittId || !gehoert(bewertung.teamId)) continue;
    inhalt.punkte += Object.keys(bewertung.team).length + Object.keys(bewertung.prozess).length;
    if (bewertung.notiz.trim()) inhalt.notizen += 1;
    for (const zeile of Object.values(bewertung.peer)) {
      for (const urteil of Object.values(zeile)) inhalt.peerUrteile += Object.keys(urteil).length;
    }
    for (const eintrag of Object.values(bewertung.individuell)) {
      inhalt.punkte += Object.keys(eintrag.punkte).length;
      if (eintrag.notiz.trim()) inhalt.notizen += 1;
      if (eintrag.rueckmeldung) inhalt.rueckmeldungen += 1;
      if (eintrag.verstehen) inhalt.verstehensnachweise += 1;
      if (eintrag.reflexion?.trim()) inhalt.reflexionen += 1;
      if (eintrag.spur?.bezeichnung.trim()) inhalt.spuren += 1;
    }
    inhalt.gesetzteWerte +=
      Object.keys(bewertung.gesetzt?.kategorie ?? {}).length +
      Object.keys(bewertung.gesetzt?.abschnittsergebnis ?? {}).length;
  }
  return inhalt;
}

/** Hängt an diesem Abschnitt überhaupt etwas? */
export function abschnittIstLeer(inhalt: Abschnittsinhalt): boolean {
  return Object.values(inhalt).every((wert) => wert === 0);
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
