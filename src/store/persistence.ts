/**
 * Laden, Speichern, Migrieren und Sichern des Datenbestands.
 *
 * Umsetzung von FA-33, FA-57 (Schemastand 2), NFA-03 (nur lokal),
 * NFA-09 (robust gegen beschädigte Daten) und DS-03 (vollständiger Export und
 * vollständige Löschung).
 */

import {
  PEER_DECKELUNG,
  RUBRIK_SPRINT,
  SCHEMA_VERSION,
  STANDARD_NOTENSCHLUESSEL,
  STRANG_GEWICHTE,
  BEFUND_SCHWELLE,
  VERSTEHENS_ANTEIL,
  ZEITFAKTOR_ZWEITE_HAELFTE,
  VORLAGE_RUBRIK_SPRINT,
  leererDatenbestand,
  strukturKopie,
  vorlagenRubriken,
} from '../domain/defaults';
import type {
  Abschnitt,
  Bewertung,
  Datenbestand,
  Id,
  Notenstufe,
  PeerEntscheidung,
  Person,
  Rubrik,
  Stichtag,
  Team,
  Teamabschnitt,
  Zugehoerigkeit,
  Mitgliedschaft,
} from '../domain/types';

export const SPEICHER_SCHLUESSEL = 'pre-syp-prp.data.v1';
const SICHERUNG_PRAEFIX = 'pre-syp-prp.data.backup.';

export interface Ladeergebnis {
  daten: Datenbestand;
  /** Meldung, wenn der gespeicherte Bestand nicht verwendet werden konnte. */
  warnung: string | null;
}

/** Loser Blick auf einen Bestand unbekannten Schemastands. */
type RoherBestand = Record<string, unknown>;

function istFeld<T>(wert: unknown): wert is T {
  return wert !== undefined && wert !== null;
}

/**
 * Prüft grob, ob ein gelesenes Objekt ein Datenbestand sein kann.
 *
 * Akzeptiert beide Schemastände: Stand 1 führt `rubrik` und `sprints`,
 * Stand 2 führt `rubriken` und `abschnitte`.
 */
function istDatenbestand(wert: unknown): wert is RoherBestand {
  if (typeof wert !== 'object' || wert === null) return false;
  const k = wert as RoherBestand;
  const stammdaten =
    Array.isArray(k.klassen) &&
    Array.isArray(k.teams) &&
    Array.isArray(k.personen) &&
    Array.isArray(k.bewertungen);
  const stand1 = Array.isArray(k.sprints) && typeof k.rubrik === 'object' && k.rubrik !== null;
  const stand2 = Array.isArray(k.abschnitte) && Array.isArray(k.rubriken);
  return stammdaten && (stand1 || stand2);
}

/** Ergänzt fehlende Felder einer Rubrik aus der Vorlage. */
function rubrikVervollstaendigen(roh: Partial<Rubrik> | undefined, id: string, name: string): Rubrik {
  const vorlage = strukturKopie(VORLAGE_RUBRIK_SPRINT);
  if (!roh) return { ...vorlage, id, name };
  return {
    id: roh.id ?? id,
    name: roh.name ?? name,
    team: roh.team ?? vorlage.team,
    prozess: roh.prozess ?? vorlage.prozess,
    individuell: roh.individuell ?? vorlage.individuell,
    peer: roh.peer ?? vorlage.peer,
    gewichte: { ...vorlage.gewichte, ...(roh.gewichte ?? {}) },
    selbstZaehlt: roh.selbstZaehlt ?? vorlage.selbstZaehlt,
  };
}

/**
 * Zwischenmodell der Migration: der neue Bestand plus die Felder, die bis
 * Schemastand 3 existierten. Nur innerhalb dieser Datei – nach außen gibt es
 * ausschließlich `Datenbestand`.
 */
type BestandMitAltlast = Omit<Datenbestand, 'personen'> & {
  zugehoerigkeiten?: Zugehoerigkeit[];
  personen: Array<Person & { teamId?: Id | null }>;
};

/**
 * Hebt einen Bestand nach Schemastand 1 auf Stand 2 (FA-57).
 *
 * Punkte, Notizen und Peer-Urteile bleiben unangetastet; es ändern sich nur
 * die Namen der Bezugsgrößen und die Ablage der Rubrik.
 */
function vonStand1(roh: RoherBestand): BestandMitAltlast {
  const alteRubrik = roh.rubrik as (Partial<Rubrik> & { notenschluessel?: Notenstufe[] }) | undefined;
  const rubrik = rubrikVervollstaendigen(alteRubrik, RUBRIK_SPRINT, 'Sprint');

  // Im alten Modell trug die Peer-Kategorie ein Gewicht. Trug sie eines,
  // wurde offenbar peer-bewertet – der Abschnitt bekommt `peerAktiv`.
  const peerWarAktiv = (alteRubrik?.gewichte?.peer ?? 0) > 0;

  const alteSprints = (roh.sprints ?? []) as Array<Record<string, unknown>>;
  const abschnitte: Abschnitt[] = alteSprints.map((s, i) => ({
    id: String(s.id ?? `abschnitt-${i}`),
    klasseId: String(s.klasseId ?? ''),
    nummer: typeof s.nummer === 'number' ? s.nummer : i + 1,
    name: String(s.name ?? `Sprint ${i + 1}`),
    art: 'sprint',
    strang: 'praxis',
    rubrikId: RUBRIK_SPRINT,
    von: String(s.von ?? ''),
    bis: String(s.bis ?? ''),
    faktor: typeof s.faktor === 'number' && Number.isFinite(s.faktor) ? s.faktor : 1,
    peerAktiv: peerWarAktiv,
  }));

  const alteBewertungen = (roh.bewertungen ?? []) as Array<Record<string, unknown>>;
  const bewertungen: Bewertung[] = alteBewertungen.map((b) => ({
    abschnittId: String(b.sprintId ?? b.abschnittId ?? ''),
    teamId: (b.teamId as string | null) ?? null,
    team: (b.team as Bewertung['team']) ?? {},
    prozess: (b.prozess as Bewertung['prozess']) ?? {},
    individuell: (b.individuell as Bewertung['individuell']) ?? {},
    peer: (b.peer as Bewertung['peer']) ?? {},
    notiz: String(b.notiz ?? ''),
  }));

  const personen = (roh.personen ?? []) as Array<{ id: string; klasseId: string; teamId: string | null }>;
  const zugehoerigkeiten: Zugehoerigkeit[] = [];
  for (const abschnitt of abschnitte) {
    for (const person of personen) {
      if (person.klasseId !== abschnitt.klasseId) continue;
      zugehoerigkeiten.push({
        abschnittId: abschnitt.id,
        personId: person.id,
        teamId: person.teamId ?? null,
      });
    }
  }

  const rubriken = vorlagenRubriken().filter((r) => r.id !== RUBRIK_SPRINT);
  rubriken.unshift(rubrik);

  return {
    schemaVersion: SCHEMA_VERSION,
    rubriken,
    vorgabeRubrikId: RUBRIK_SPRINT,
    notenschluessel: alteRubrik?.notenschluessel?.length
      ? strukturKopie(alteRubrik.notenschluessel)
      : strukturKopie(STANDARD_NOTENSCHLUESSEL),
    strangGewichte: { ...STRANG_GEWICHTE },
    peerDeckelung: PEER_DECKELUNG,
    verstehensAnteil: VERSTEHENS_ANTEIL,
    befundSchwelle: BEFUND_SCHWELLE,
    zeitfaktorZweiteHaelfte: ZEITFAKTOR_ZWEITE_HAELFTE,
    sperreAktiv: true,
    stichtage: [],
    gesamtstand: {},
    notenstaende: {},
    klassen: (roh.klassen ?? []) as Datenbestand['klassen'],
    teams: (roh.teams ?? []) as Datenbestand['teams'],
    personen: personen as BestandMitAltlast['personen'],
    abschnitte,
    teamabschnitte: [],
    zugehoerigkeiten,
    mitgliedschaften: [],
    bewertungen,
    peerEntscheidungen: [],
  };
}

/**
 * Hebt einen Bestand nach Schemastand 2 auf Stand 3 (FA-68).
 *
 * Aus jeder Paarung von Abschnitt und Team, die eine Bewertung oder eine
 * Zugehörigkeit hat, wird eine Planung. Sie übernimmt den Zeitraum des
 * Abschnitts und dessen eingefrorene Rubrik – damit rechnet der Bestand danach
 * **genau gleich weiter** (AK-5). Ein Ziel gibt es nicht; es ist nicht
 * erfindbar und bleibt leer.
 */
function vonStand2(daten: BestandMitAltlast): BestandMitAltlast {
  const vorhanden = new Set(
    (daten.teamabschnitte ?? []).map((tp) => `${tp.abschnittId}__${tp.teamId}`),
  );
  const teamabschnitte: Teamabschnitt[] = [...(daten.teamabschnitte ?? [])];

  for (const abschnitt of daten.abschnitte) {
    // Ein Test hat kein Team (FA-60 AK-3) und damit keine Planung.
    if (abschnitt.art === 'test') continue;

    const teams = new Set<string>();
    for (const z of daten.zugehoerigkeiten ?? []) {
      if (z.abschnittId === abschnitt.id && z.teamId) teams.add(z.teamId);
    }
    for (const b of daten.bewertungen) {
      if (b.abschnittId === abschnitt.id && b.teamId) teams.add(b.teamId);
    }
    // Ohne Zugehörigkeiten greift die Vorbelegung an der Person (FA-58).
    if (teams.size === 0) {
      for (const person of daten.personen) {
        if (person.klasseId === abschnitt.klasseId && person.teamId) teams.add(person.teamId);
      }
    }

    for (const teamId of teams) {
      if (vorhanden.has(`${abschnitt.id}__${teamId}`)) continue;
      const planung: Teamabschnitt = {
        abschnittId: abschnitt.id,
        teamId,
        ziel: '',
        von: abschnitt.von,
        bis: abschnitt.bis,
      };
      if (abschnitt.rubrikKopie) {
        planung.rubrikKopie = strukturKopie(abschnitt.rubrikKopie);
        if (abschnitt.eingefrorenAm) planung.eingefrorenAm = abschnitt.eingefrorenAm;
        planung.herkunft = { art: 'vorlage', rubrikId: abschnitt.rubrikId };
      }
      teamabschnitte.push(planung);
    }
  }

  return { ...daten, schemaVersion: SCHEMA_VERSION, teamabschnitte };
}

/**
 * Hebt einen Bestand nach Schemastand 3 auf Stand 4 (FA-87 AK-6).
 *
 * **Schüler gehören zu Projekten, nicht zu Sprints** (Fachkonzept 15.2, A8).
 * Aus jeder Zugehörigkeit mit Team und aus jeder Vorbelegung an der Person
 * wird eine Mitgliedschaft – ohne Doppel. `teamId: null` bedeutete „in diesem
 * Abschnitt keinem Team zugeordnet" und entfällt ersatzlos: Wer in keinem
 * Projekt war, hat auch keine Mitgliedschaft.
 *
 * **Die Rechnung ändert sich dadurch nicht.** Ein Schüler, der in allen
 * Abschnitten demselben Team zugeordnet war – der Normalfall –, ist danach
 * Mitglied genau dieses Projekts, und `teamIn` liefert dasselbe Ergebnis wie
 * vorher. Nur der Sonderfall „wechselt im dritten Sprint das Team" geht
 * verloren; er war eine Festlegung, die der Auftraggeber am 14.09.2026
 * aufgehoben hat.
 */
function vonStand3(daten: BestandMitAltlast): Datenbestand {
  const paare = new Set<string>();
  const mitgliedschaften: Mitgliedschaft[] = [];
  const merken = (projektId: Id, personId: Id) => {
    const schluessel = `${projektId}__${personId}`;
    if (paare.has(schluessel)) return;
    paare.add(schluessel);
    mitgliedschaften.push({ projektId, personId });
  };

  for (const z of daten.zugehoerigkeiten ?? []) {
    if (z.teamId) merken(z.teamId, z.personId);
  }
  for (const person of daten.personen) {
    if (person.teamId) merken(person.teamId, person.id);
  }

  // Die GitHub-Kennungen am Team sind ab Schemastand 4 an der Person zu Hause
  // (FA-88 AK-3). Eine Kennung, die dort schon steht, wird nicht überschrieben.
  const teams = daten.teams.map((team) => {
    // `kennungen` gibt es am Typ nicht mehr; ein alter Bestand trägt es noch.
    const alt = team as Team & { kennungen?: Record<string, Id> };
    const kennungen = alt.kennungen;
    const rest = { ...team };
    delete (rest as { kennungen?: unknown }).kennungen;
    for (const [kennung, personId] of Object.entries(kennungen ?? {})) {
      const person = daten.personen.find((pe) => pe.id === personId);
      if (person && !(person.githubKennung ?? '').trim()) person.githubKennung = kennung;
    }
    return rest;
  });

  // `delete` statt Destrukturierung mit ungenutzter Bindung: Die Regel
  // `no-unused-vars` ist hier ohne `ignoreRestSiblings` eingestellt und würde
  // ein `{ teamId: _weg, ...rest }` als Fehler melden.
  const personen = daten.personen.map((person) => {
    const kopie = { ...person };
    delete kopie.teamId;
    return kopie;
  });

  return {
    ...daten,
    schemaVersion: SCHEMA_VERSION,
    teams,
    personen,
    mitgliedschaften,
  };
}

/** Füllt fehlende Felder eines Bestands nach Schemastand 2 auf. */
function vervollstaendigen(roh: RoherBestand): BestandMitAltlast {
  const rubriken = (roh.rubriken as Rubrik[] | undefined)?.length
    ? (roh.rubriken as Rubrik[])
    : vorlagenRubriken();
  const abschnitte = ((roh.abschnitte ?? []) as Abschnitt[]).map((a) => ({
    ...a,
    art: a.art ?? 'sprint',
    strang: a.strang ?? 'praxis',
    rubrikId: a.rubrikId ?? RUBRIK_SPRINT,
    faktor: Number.isFinite(a.faktor) ? a.faktor : 1,
    peerAktiv: a.peerAktiv ?? false,
  }));
  const bewertungen = ((roh.bewertungen ?? []) as Bewertung[]).map((b) => ({
    ...b,
    teamId: b.teamId ?? null,
    team: b.team ?? {},
    prozess: b.prozess ?? {},
    individuell: b.individuell ?? {},
    peer: b.peer ?? {},
    notiz: b.notiz ?? '',
  }));

  return {
    schemaVersion: SCHEMA_VERSION,
    rubriken,
    vorgabeRubrikId: istFeld<string>(roh.vorgabeRubrikId)
      ? (roh.vorgabeRubrikId as string)
      : (rubriken[0]?.id ?? RUBRIK_SPRINT),
    notenschluessel: (roh.notenschluessel as Notenstufe[] | undefined)?.length
      ? (roh.notenschluessel as Notenstufe[])
      : strukturKopie(STANDARD_NOTENSCHLUESSEL),
    strangGewichte: {
      ...STRANG_GEWICHTE,
      ...((roh.strangGewichte as Datenbestand['strangGewichte'] | undefined) ?? {}),
    },
    peerDeckelung:
      typeof roh.peerDeckelung === 'number' && Number.isFinite(roh.peerDeckelung)
        ? roh.peerDeckelung
        : PEER_DECKELUNG,
    verstehensAnteil:
      typeof roh.verstehensAnteil === 'number' && Number.isFinite(roh.verstehensAnteil)
        ? roh.verstehensAnteil
        : VERSTEHENS_ANTEIL,
    // FA-79 AK-4a: additiv innerhalb von Schemastand 3 – ein Bestand ohne das
    // Feld bekommt die Vorgabe, nichts wird umgeschrieben.
    befundSchwelle:
      typeof roh.befundSchwelle === 'number' && Number.isFinite(roh.befundSchwelle)
        ? roh.befundSchwelle
        : BEFUND_SCHWELLE,
    zeitfaktorZweiteHaelfte:
      typeof roh.zeitfaktorZweiteHaelfte === 'number' && Number.isFinite(roh.zeitfaktorZweiteHaelfte)
        ? roh.zeitfaktorZweiteHaelfte
        : ZEITFAKTOR_ZWEITE_HAELFTE,
    // Vorgabe eingeschaltet: Ein älterer Bestand kannte die Sperre nicht, und
    // § 14 LBVO gilt trotzdem.
    sperreAktiv: typeof roh.sperreAktiv === 'boolean' ? roh.sperreAktiv : true,
    stichtage: (roh.stichtage ?? []) as Stichtag[],
    gesamtstand: (roh.gesamtstand ?? {}) as Datenbestand['gesamtstand'],
    notenstaende: (roh.notenstaende ?? {}) as Datenbestand['notenstaende'],
    klassen: (roh.klassen ?? []) as Datenbestand['klassen'],
    teams: (roh.teams ?? []) as Datenbestand['teams'],
    personen: (roh.personen ?? []) as Datenbestand['personen'],
    abschnitte,
    teamabschnitte: ((roh.teamabschnitte ?? []) as Teamabschnitt[]).map((tp) => ({
      ...tp,
      ziel: tp.ziel ?? '',
      von: tp.von ?? '',
      bis: tp.bis ?? '',
    })),
    zugehoerigkeiten: (roh.zugehoerigkeiten ?? []) as Zugehoerigkeit[],
    mitgliedschaften: (roh.mitgliedschaften ?? []) as Mitgliedschaft[],
    bewertungen,
    peerEntscheidungen: (roh.peerEntscheidungen ?? []) as PeerEntscheidung[],
  };
}

/**
 * Hebt einen gelesenen Bestand auf den aktuellen Schemastand.
 *
 * Bei jeder Schemaänderung kommt hier ein Schritt dazu; der Bestand wird nie
 * verworfen, solange er lesbar ist.
 */
export function migriere(roh: unknown): Datenbestand {
  if (!istDatenbestand(roh)) return leererDatenbestand();
  const kopie = strukturKopie(roh) as RoherBestand;
  const stand = typeof kopie.schemaVersion === 'number' ? kopie.schemaVersion : 1;
  const aufStand2 = stand < 2 ? vonStand1(kopie) : vervollstaendigen(kopie);
  const aufStand3 = stand < 3 ? vonStand2(aufStand2) : aufStand2;
  if (stand < 4) return vonStand3(aufStand3);
  // Ein Bestand, der schon auf Stand 4 ist, hat die Altfelder nicht mehr –
  // `vervollstaendigen` trägt sie aber leer ein, damit die Migrationsschritte
  // sie lesen können. Hier fallen sie wieder weg, sonst unterschiede sich ein
  // gelesener Bestand von einem frisch gebauten (FA-33).
  const sauber = { ...aufStand3 };
  delete sauber.zugehoerigkeiten;
  return {
    ...sauber,
    personen: sauber.personen.map((person) => {
      const kopie = { ...person };
      delete kopie.teamId;
      return kopie;
    }),
  };
}

/** Liest den Bestand aus dem übergebenen Speicher (Vorgabe: localStorage). */
export function laden(speicher: Storage | undefined = sicherenSpeicher()): Ladeergebnis {
  if (!speicher) {
    return {
      daten: leererDatenbestand(),
      warnung:
        'Dieser Browser erlaubt keine lokale Speicherung. Änderungen gehen beim Schließen verloren.',
    };
  }

  const roh = speicher.getItem(SPEICHER_SCHLUESSEL);
  if (!roh) return { daten: leererDatenbestand(), warnung: null };

  try {
    const gelesen: unknown = JSON.parse(roh);
    if (!istDatenbestand(gelesen)) throw new Error('unerwartete Struktur');

    // FA-57 AK-3: Vor einer Schemaänderung wird der bisherige Stand
    // unverändert gesichert – bevor irgendetwas verändert wird.
    const stand = (gelesen as RoherBestand).schemaVersion;
    if (typeof stand !== 'number' || stand < SCHEMA_VERSION) {
      try {
        speicher.setItem(`${SICHERUNG_PRAEFIX}schema${stand ?? 1}.${new Date().toISOString()}`, roh);
      } catch {
        /* Speicher voll – die Migration selbst ist wichtiger. */
      }
    }

    return { daten: migriere(gelesen), warnung: null };
  } catch {
    // NFA-09: Der beschädigte Stand wird nicht überschrieben, sondern beiseitegelegt.
    const name = `${SICHERUNG_PRAEFIX}${new Date().toISOString()}`;
    try {
      speicher.setItem(name, roh);
    } catch {
      /* Speicher voll – die Warnung genügt. */
    }
    return {
      daten: leererDatenbestand(),
      warnung: `Der gespeicherte Datenbestand war nicht lesbar. Er wurde unter „${name}“ gesichert; die Anwendung startet leer.`,
    };
  }
}

/** Schreibt den Bestand. Gibt zurück, ob das Speichern gelungen ist. */
export function speichern(
  daten: Datenbestand,
  speicher: Storage | undefined = sicherenSpeicher(),
): boolean {
  if (!speicher) return false;
  try {
    speicher.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(daten));
    return true;
  } catch {
    return false;
  }
}

/** Entfernt den Bestand vollständig (DS-03). */
export function loeschen(speicher: Storage | undefined = sicherenSpeicher()): void {
  speicher?.removeItem(SPEICHER_SCHLUESSEL);
}

/** Erzeugt den Inhalt einer Sicherungsdatei (FA-33). */
export function alsSicherung(daten: Datenbestand): string {
  return JSON.stringify(daten, null, 2);
}

/** Liest eine Sicherungsdatei. Wirft bei ungültigem Inhalt. */
export function ausSicherung(text: string): Datenbestand {
  const gelesen: unknown = JSON.parse(text);
  if (!istDatenbestand(gelesen)) {
    throw new Error('Die Datei enthält keinen gültigen Datenbestand dieser Anwendung.');
  }
  return migriere(gelesen);
}

/** Dateiname für die Sicherung, mit Datum (FA-46 AK-4). */
export function sicherungsDateiname(datum = new Date()): string {
  const iso = datum.toISOString().slice(0, 10);
  return `pre-syp-prp-${iso}.json`;
}

/**
 * localStorage, sofern verfügbar.
 *
 * In privaten Fenstern oder bei gesperrtem Speicher wirft schon der Zugriff –
 * die Anwendung muss dann ohne Speicher arbeiten (NFA-09).
 */
function sicherenSpeicher(): Storage | undefined {
  try {
    if (typeof localStorage === 'undefined') return undefined;
    const probe = '__pre-syp-prp_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return undefined;
  }
}
