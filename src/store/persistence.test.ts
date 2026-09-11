import { beforeEach, describe, expect, it } from 'vitest';

import { RUBRIK_SPRINT, SCHEMA_VERSION, leererDatenbestand } from '../domain/defaults';
import {
  SPEICHER_SCHLUESSEL,
  alsSicherung,
  ausSicherung,
  laden,
  loeschen,
  migriere,
  sicherungsDateiname,
  speichern,
} from './persistence';

/** Minimaler Storage-Ersatz für die Tests. */
function speicherAttrappe(): Storage {
  const inhalt = new Map<string, string>();
  return {
    get length() {
      return inhalt.size;
    },
    clear: () => inhalt.clear(),
    getItem: (schluessel: string) => inhalt.get(schluessel) ?? null,
    key: (index: number) => [...inhalt.keys()][index] ?? null,
    removeItem: (schluessel: string) => void inhalt.delete(schluessel),
    setItem: (schluessel: string, wert: string) => void inhalt.set(schluessel, wert),
  } as Storage;
}

/** Alle Sicherungsschlüssel im Speicher. */
function sicherungen(speicher: Storage): string[] {
  return [...Array(speicher.length).keys()]
    .map((i) => speicher.key(i)!)
    .filter((k) => k.startsWith('pre-syp-prp.data.backup.'));
}

/**
 * Ein Bestand nach Schemastand 1: `rubrik` statt `rubriken`, `sprints` statt
 * `abschnitte`, Bewertungen mit `sprintId`. Bewusst als lose Struktur
 * geschrieben – so lag er tatsächlich im Speicher.
 */
function bestandStand1(): Record<string, unknown> {
  return {
    rubrik: {
      team: [{ id: 't1', name: 'Funktionalität', beschreibung: '', max: 10 }],
      prozess: [{ id: 'p1', name: 'Planning', beschreibung: '', max: 5 }],
      individuell: [{ id: 'i1', name: 'Umfang', beschreibung: '', max: 10 }],
      gewichte: { team: 40, prozess: 20, individuell: 30, peer: 10 },
      selbstZaehlt: false,
      notenschluessel: [
        { note: 1, ab: 88, bezeichnung: 'Sehr gut' },
        { note: 2, ab: 76, bezeichnung: 'Gut' },
        { note: 3, ab: 63, bezeichnung: 'Befriedigend' },
        { note: 4, ab: 50, bezeichnung: 'Genügend' },
        { note: 5, ab: 0, bezeichnung: 'Nicht genügend' },
      ],
    },
    klassen: [{ id: 'k1', name: '4AHIF' }],
    teams: [{ id: 'team1', klasseId: 'k1', name: 'Team Kepler' }],
    personen: [{ id: 'p1', klasseId: 'k1', teamId: 'team1', name: 'Berger Lena' }],
    sprints: [{ id: 's1', klasseId: 'k1', nummer: 1, name: 'Sprint 1', von: '', bis: '' }],
    bewertungen: [
      { sprintId: 's1', teamId: 'team1', team: { t1: 8 }, notiz: 'Demo lief stabil.' },
    ],
  };
}

let speicher: Storage;

beforeEach(() => {
  speicher = speicherAttrappe();
});

describe('speichern und laden (FA-33)', () => {
  it('gibt einen leeren Bestand zurück, wenn nichts gespeichert ist', () => {
    const { daten, warnung } = laden(speicher);
    expect(warnung).toBeNull();
    expect(daten).toEqual(leererDatenbestand());
  });

  it('liest zurück, was gespeichert wurde', () => {
    const bestand = leererDatenbestand();
    bestand.klassen.push({ id: 'k1', name: '4AHIF' });
    expect(speichern(bestand, speicher)).toBe(true);
    expect(laden(speicher).daten.klassen[0].name).toBe('4AHIF');
  });

  it('legt beim Lesen eines aktuellen Bestands keine Sicherung an', () => {
    speichern(leererDatenbestand(), speicher);
    laden(speicher);
    expect(sicherungen(speicher)).toHaveLength(0);
  });

  it('löscht den Bestand vollständig (DS-03)', () => {
    speichern(leererDatenbestand(), speicher);
    loeschen(speicher);
    expect(speicher.getItem(SPEICHER_SCHLUESSEL)).toBeNull();
  });
});

describe('Robustheit (NFA-09)', () => {
  it('startet leer und sichert den unlesbaren Stand', () => {
    speicher.setItem(SPEICHER_SCHLUESSEL, '{kein gültiges json');
    const { daten, warnung } = laden(speicher);
    expect(daten).toEqual(leererDatenbestand());
    expect(warnung).toMatch(/nicht lesbar/i);
    expect(sicherungen(speicher)).toHaveLength(1);
  });

  it('weist strukturell falsche Inhalte zurück', () => {
    speicher.setItem(SPEICHER_SCHLUESSEL, JSON.stringify({ klassen: 'keine Liste' }));
    expect(laden(speicher).warnung).toMatch(/nicht lesbar/i);
  });

  it('arbeitet ohne Speicher weiter und weist darauf hin', () => {
    const { daten, warnung } = laden(undefined);
    expect(daten).toEqual(leererDatenbestand());
    expect(warnung).toMatch(/keine lokale Speicherung/i);
  });
});

describe('Migration auf Schemastand 2 (FA-57)', () => {
  it('sichert den alten Stand, bevor migriert wird (AK-3)', () => {
    const roh = JSON.stringify(bestandStand1());
    speicher.setItem(SPEICHER_SCHLUESSEL, roh);
    const { warnung } = laden(speicher);
    expect(warnung).toBeNull();
    const namen = sicherungen(speicher);
    expect(namen).toHaveLength(1);
    expect(namen[0]).toContain('schema1');
    // Die Sicherung enthält den Stand unverändert.
    expect(speicher.getItem(namen[0])).toBe(roh);
  });

  it('macht aus Sprints Abschnitte im Praxisstrang (AK-1)', () => {
    const daten = migriere(bestandStand1());
    expect(daten.schemaVersion).toBe(SCHEMA_VERSION);
    expect(daten.abschnitte).toHaveLength(1);
    expect(daten.abschnitte[0]).toMatchObject({
      id: 's1',
      art: 'sprint',
      strang: 'praxis',
      rubrikId: RUBRIK_SPRINT,
      faktor: 1,
    });
  });

  it('hebt die eine Rubrik in die Rubrikliste und ergänzt fehlende Teile', () => {
    const daten = migriere(bestandStand1());
    const rubrik = daten.rubriken.find((r) => r.id === RUBRIK_SPRINT)!;
    expect(rubrik.name).toBe('Sprint');
    // Peer-Kriterien fehlten im alten Bestand und kommen aus der Vorlage.
    expect(rubrik.peer.length).toBeGreaterThan(0);
    expect(daten.vorgabeRubrikId).toBe(RUBRIK_SPRINT);
  });

  it('übernimmt den Notenschlüssel aus der alten Rubrik in den Bestand', () => {
    const daten = migriere(bestandStand1());
    expect(daten.notenschluessel.find((n) => n.note === 1)!.ab).toBe(88);
  });

  it('schaltet die Peer-Bewertung ein, wenn die alte Rubrik ihr Gewicht gab (FA-52)', () => {
    expect(migriere(bestandStand1()).abschnitte[0].peerAktiv).toBe(true);
  });

  it('behält erfasste Punkte und Notizen und schreibt sie auf den Abschnitt um', () => {
    const bewertung = migriere(bestandStand1()).bewertungen[0];
    expect(bewertung.abschnittId).toBe('s1');
    expect(bewertung.team.t1).toBe(8);
    expect(bewertung.notiz).toBe('Demo lief stabil.');
    expect(bewertung.peer).toEqual({});
    expect(bewertung.individuell).toEqual({});
  });

  it('leitet die Teamzugehörigkeit je Abschnitt aus der alten Zuordnung ab (FA-58)', () => {
    const daten = migriere(bestandStand1());
    expect(daten.zugehoerigkeiten).toEqual([
      { abschnittId: 's1', personId: 'p1', teamId: 'team1' },
    ]);
  });

  it('setzt die Stranggewichte auf die Vorgabe 75 zu 25 (FA-59)', () => {
    expect(migriere(bestandStand1()).strangGewichte).toEqual({ praxis: 75, theorie: 25 });
  });

  it('gibt einen leeren Bestand zurück, wenn nichts Lesbares vorliegt', () => {
    expect(migriere({ etwas: 'anderes' })).toEqual(leererDatenbestand());
    expect(migriere(null)).toEqual(leererDatenbestand());
  });
});

describe('Migration innerhalb von Schemastand 2', () => {
  it('füllt fehlende Felder eines Abschnitts auf', () => {
    const roh = leererDatenbestand() as unknown as Record<string, unknown>;
    (roh.abschnitte as unknown[]).push({ id: 's1', klasseId: 'k1', nummer: 1, name: 'S1', von: '', bis: '' });
    const abschnitt = migriere(roh).abschnitte[0];
    expect(abschnitt.art).toBe('sprint');
    expect(abschnitt.strang).toBe('praxis');
    expect(abschnitt.faktor).toBe(1);
    expect(abschnitt.peerAktiv).toBe(false);
  });

  it('ergänzt fehlende Teilstrukturen einer Bewertung', () => {
    const roh = leererDatenbestand() as unknown as Record<string, unknown>;
    (roh.bewertungen as unknown[]).push({ abschnittId: 's1', teamId: 'team1', team: { t1: 1 } });
    const bewertung = migriere(roh).bewertungen[0];
    expect(bewertung.peer).toEqual({});
    expect(bewertung.individuell).toEqual({});
    expect(bewertung.prozess).toEqual({});
    expect(bewertung.notiz).toBe('');
  });

  it('lässt einen Abschnitt mit eingefrorener Rubrik unangetastet (FA-65)', () => {
    const roh = leererDatenbestand() as unknown as Record<string, unknown>;
    const kopie = leererDatenbestand().rubriken[0];
    kopie.gewichte.team = 99;
    (roh.abschnitte as unknown[]).push({
      id: 's1',
      klasseId: 'k1',
      nummer: 1,
      name: 'S1',
      art: 'sprint',
      strang: 'praxis',
      rubrikId: RUBRIK_SPRINT,
      rubrikKopie: kopie,
      eingefrorenAm: '2026-09-01T08:00:00.000Z',
      von: '',
      bis: '',
      faktor: 1,
      peerAktiv: false,
    });
    const abschnitt = migriere(roh).abschnitte[0];
    expect(abschnitt.rubrikKopie?.gewichte.team).toBe(99);
    expect(abschnitt.eingefrorenAm).toBe('2026-09-01T08:00:00.000Z');
  });
});

describe('Sicherungsdatei (FA-33)', () => {
  it('schreibt und liest den Bestand verlustfrei', () => {
    const bestand = leererDatenbestand();
    bestand.klassen.push({ id: 'k1', name: '4AHIF' });
    bestand.personen.push({ id: 'p1', klasseId: 'k1', teamId: null, name: 'Berger Lena' });
    expect(ausSicherung(alsSicherung(bestand))).toEqual(bestand);
  });

  it('hebt eine alte Sicherungsdatei beim Einlesen auf den aktuellen Stand (FA-57)', () => {
    const daten = ausSicherung(JSON.stringify(bestandStand1()));
    expect(daten.schemaVersion).toBe(SCHEMA_VERSION);
    expect(daten.abschnitte[0].name).toBe('Sprint 1');
  });

  it('weist fremde Dateien mit verständlicher Meldung ab', () => {
    expect(() => ausSicherung('{"etwas":"anderes"}')).toThrow(/gültigen Datenbestand dieser Anwendung/);
  });

  it('benennt die Sicherung nach dem Datum', () => {
    expect(sicherungsDateiname(new Date('2026-09-09T10:00:00Z'))).toBe('pre-syp-prp-2026-09-09.json');
  });
});
