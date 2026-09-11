/**
 * Laden, Speichern, Migrieren und Sichern des Datenbestands.
 *
 * Umsetzung von FA-33, FA-57 (Schemastand 2), NFA-03 (nur lokal),
 * NFA-09 (robust gegen beschädigte Daten) und DS-03 (vollständiger Export und
 * vollständige Löschung).
 */

import {
  RUBRIK_SPRINT,
  SCHEMA_VERSION,
  STANDARD_NOTENSCHLUESSEL,
  STRANG_GEWICHTE,
  VORLAGE_RUBRIK_SPRINT,
  leererDatenbestand,
  strukturKopie,
  vorlagenRubriken,
} from '../domain/defaults';
import type {
  Abschnitt,
  Bewertung,
  Datenbestand,
  Notenstufe,
  PeerEntscheidung,
  Rubrik,
  Zugehoerigkeit,
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
 * Hebt einen Bestand nach Schemastand 1 auf Stand 2 (FA-57).
 *
 * Punkte, Notizen und Peer-Urteile bleiben unangetastet; es ändern sich nur
 * die Namen der Bezugsgrößen und die Ablage der Rubrik.
 */
function vonStand1(roh: RoherBestand): Datenbestand {
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
    klassen: (roh.klassen ?? []) as Datenbestand['klassen'],
    teams: (roh.teams ?? []) as Datenbestand['teams'],
    personen: personen as Datenbestand['personen'],
    abschnitte,
    zugehoerigkeiten,
    bewertungen,
    peerEntscheidungen: [],
  };
}

/** Füllt fehlende Felder eines Bestands nach Schemastand 2 auf. */
function vervollstaendigen(roh: RoherBestand): Datenbestand {
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
    klassen: (roh.klassen ?? []) as Datenbestand['klassen'],
    teams: (roh.teams ?? []) as Datenbestand['teams'],
    personen: (roh.personen ?? []) as Datenbestand['personen'],
    abschnitte,
    zugehoerigkeiten: (roh.zugehoerigkeiten ?? []) as Zugehoerigkeit[],
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
  return stand < 2 ? vonStand1(kopie) : vervollstaendigen(kopie);
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
