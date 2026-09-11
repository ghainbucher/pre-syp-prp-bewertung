import { beforeEach, describe, expect, it } from 'vitest';

import { leererDatenbestand } from '../domain/defaults';
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
    const sicherungen = [...Array(speicher.length).keys()]
      .map((i) => speicher.key(i)!)
      .filter((k) => k.startsWith('pre-syp-prp.data.backup.'));
    expect(sicherungen).toHaveLength(1);
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

describe('Migration', () => {
  it('ergänzt fehlende Rubrikteile aus der Vorlage', () => {
    const alt = leererDatenbestand();
    // @ts-expect-error – simuliert einen älteren Bestand ohne Peer-Kriterien
    delete alt.rubrik.peer;
    expect(migriere(alt).rubrik.peer.length).toBeGreaterThan(0);
  });

  it('setzt einen fehlenden Sprintfaktor auf 1', () => {
    const alt = leererDatenbestand();
    // @ts-expect-error – älterer Sprint ohne Faktor
    alt.sprints.push({ id: 's1', klasseId: 'k1', nummer: 1, name: 'S1', von: '', bis: '' });
    expect(migriere(alt).sprints[0].faktor).toBe(1);
  });

  it('ergänzt fehlende Teilstrukturen einer Bewertung', () => {
    const alt = leererDatenbestand();
    // @ts-expect-error – ältere Bewertung ohne peer-Zweig
    alt.bewertungen.push({ sprintId: 's1', teamId: 't1', team: { a: 1 } });
    const bewertung = migriere(alt).bewertungen[0];
    expect(bewertung.peer).toEqual({});
    expect(bewertung.individuell).toEqual({});
    expect(bewertung.notiz).toBe('');
  });
});

describe('Sicherungsdatei (FA-33)', () => {
  it('schreibt und liest den Bestand verlustfrei', () => {
    const bestand = leererDatenbestand();
    bestand.klassen.push({ id: 'k1', name: '4AHIF' });
    bestand.personen.push({ id: 'p1', klasseId: 'k1', teamId: null, name: 'Berger Lena' });
    expect(ausSicherung(alsSicherung(bestand))).toEqual(bestand);
  });

  it('weist fremde Dateien mit verständlicher Meldung ab', () => {
    expect(() => ausSicherung('{"etwas":"anderes"}')).toThrow(/gültigen Datenbestand dieser Anwendung/);
  });

  it('benennt die Sicherung nach dem Datum', () => {
    expect(sicherungsDateiname(new Date('2026-09-09T10:00:00Z'))).toBe('pre-syp-prp-2026-09-09.json');
  });
});
