import { describe, expect, it } from 'vitest';

import { leererDatenbestand } from '../domain/defaults';
import { bewertungsIndex, storeReducer, type Aktion } from '../store/storeReducer';
import type { Datenbestand } from '../domain/types';
import { BOM, alsCsv, csvDateiname, uebersichtZeilen } from './csv';

function bestand(): Datenbestand {
  const aktionen: Aktion[] = [
    { art: 'klasse/anlegen', id: 'k1', name: '4 AHIF' },
    { art: 'team/anlegen', id: 'team1', klasseId: 'k1', name: 'Team Kepler' },
    {
      art: 'person/anlegen',
      klasseId: 'k1',
      teamId: 'team1',
      namen: [{ id: 'p1', name: 'Berger, Lena' }],
    },
    {
      art: 'sprint/anlegen',
      sprint: { id: 's1', klasseId: 'k1', nummer: 1, name: 'Sprint 1', von: '', bis: '', faktor: 1 },
    },
    {
      art: 'sprint/anlegen',
      sprint: { id: 's2', klasseId: 'k1', nummer: 2, name: 'Sprint 2', von: '', bis: '', faktor: 1 },
    },
    // Nur Sprint 1 wird bewertet: Team-Kategorie voll, Rest leer.
    { art: 'rubrik/gewicht', kategorie: 'prozess', wert: 0 },
    { art: 'rubrik/gewicht', kategorie: 'individuell', wert: 0 },
    { art: 'rubrik/gewicht', kategorie: 'peer', wert: 0 },
    { art: 'bewertung/punkte', sprintId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 8 },
  ];
  return aktionen.reduce(storeReducer, leererDatenbestand());
}

function zeilen() {
  const daten = bestand();
  return uebersichtZeilen({
    daten,
    klasseId: 'k1',
    personen: daten.personen,
    teams: daten.teams,
    sprints: daten.sprints,
    bewertungen: bewertungsIndex(daten),
  });
}

describe('uebersichtZeilen (FA-31)', () => {
  it('schreibt eine Kopfzeile mit einer Spalte je Sprint', () => {
    expect(zeilen()[0]).toEqual(['Name', 'Team', 'Sprint 1 (%)', 'Sprint 2 (%)', 'Gesamt (%)', 'Note']);
  });

  it('lässt nicht bewertete Sprints leer statt sie mit 0 zu füllen', () => {
    const [, datenzeile] = zeilen();
    expect(datenzeile[2]).toBe('80,0');
    expect(datenzeile[3]).toBe('');
  });

  it('verwendet das Komma als Dezimaltrennzeichen', () => {
    const [, datenzeile] = zeilen();
    expect(String(datenzeile[4])).toContain(',');
  });

  it('gibt die Note der Klassenübersicht aus', () => {
    const [, datenzeile] = zeilen();
    expect(datenzeile[5]).toBe(2);
  });
});

describe('alsCsv', () => {
  it('trennt mit Strichpunkt und beginnt mit einem BOM', () => {
    const csv = alsCsv([['a', 'b'], [1, 2]]);
    expect(csv.startsWith(BOM)).toBe(true);
    expect(csv).toContain('"a";"b"');
  });

  it('maskiert Anführungszeichen im Inhalt', () => {
    expect(alsCsv([['Sagt "Hallo"']])).toContain('"Sagt ""Hallo"""');
  });

  it('verkraftet Beistriche im Namen, weil in Anführungszeichen gesetzt', () => {
    const csv = alsCsv(zeilen());
    expect(csv).toContain('"Berger, Lena"');
  });
});

describe('csvDateiname', () => {
  it('baut einen dateisystemtauglichen Namen mit Datum', () => {
    expect(csvDateiname('4 AHIF', new Date('2026-09-09T08:00:00Z'))).toBe('pre-syp-prp-4_AHIF-2026-09-09.csv');
  });

  it('fängt einen leeren Klassennamen ab', () => {
    expect(csvDateiname('   ', new Date('2026-09-09T08:00:00Z'))).toBe('pre-syp-prp-Klasse-2026-09-09.csv');
  });
});
