import { describe, expect, it } from 'vitest';

import { leererDatenbestand } from '../domain/defaults';
import type { Datenbestand } from '../domain/types';
import { bewertungsIndex, storeReducer, type Aktion } from './storeReducer';

function anwenden(start: Datenbestand, ...aktionen: Aktion[]): Datenbestand {
  return aktionen.reduce(storeReducer, start);
}

function grundbestand(): Datenbestand {
  return anwenden(
    leererDatenbestand(),
    { art: 'klasse/anlegen', id: 'k1', name: '4AHIF' },
    { art: 'team/anlegen', id: 'team1', klasseId: 'k1', name: 'Team Kepler' },
    {
      art: 'person/anlegen',
      klasseId: 'k1',
      teamId: 'team1',
      namen: [
        { id: 'p1', name: 'Berger Lena' },
        { id: 'p2', name: 'Steiner Jonas' },
      ],
    },
    {
      art: 'sprint/anlegen',
      sprint: { id: 's1', klasseId: 'k1', nummer: 1, name: 'Sprint 1', von: '', bis: '', faktor: 1 },
    },
  );
}

describe('Stammdaten (FA-01 bis FA-04)', () => {
  it('legt Klasse, Team, Personen und Sprint an', () => {
    const daten = grundbestand();
    expect(daten.klassen).toHaveLength(1);
    expect(daten.personen.map((p) => p.name)).toEqual(['Berger Lena', 'Steiner Jonas']);
    expect(daten.sprints[0].faktor).toBe(1);
  });

  it('behält Personen beim Löschen eines Teams und setzt sie auf „ohne Team“', () => {
    const daten = anwenden(grundbestand(), { art: 'team/loeschen', id: 'team1' });
    expect(daten.teams).toHaveLength(0);
    expect(daten.personen).toHaveLength(2);
    expect(daten.personen.every((p) => p.teamId === null)).toBe(true);
  });

  it('entfernt mit der Klasse auch Teams, Personen, Sprints und Bewertungen', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/punkte', sprintId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 5 },
      { art: 'klasse/loeschen', id: 'k1' },
    );
    expect(daten).toEqual(leererDatenbestand());
  });

  it('entfernt mit einer Person auch ihre Einzel- und Peer-Bewertungen', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/individuell', sprintId: 's1', teamId: 'team1', personId: 'p1', kriteriumId: 'i1', wert: 8 },
      { art: 'bewertung/peer', sprintId: 's1', teamId: 'team1', bewerterId: 'p2', bewerteterId: 'p1', kriteriumId: 'q1', wert: 4 },
      { art: 'person/loeschen', id: 'p1' },
    );
    expect(daten.personen).toHaveLength(1);
    expect(daten.bewertungen).toHaveLength(0);
  });
});

describe('Bewertung erfassen (FA-12 bis FA-16, FA-19)', () => {
  it('legt die Bewertung beim ersten Punkt automatisch an', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/punkte',
      sprintId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      kriteriumId: 't1',
      wert: 7.5,
    });
    expect(daten.bewertungen).toHaveLength(1);
    expect(daten.bewertungen[0].team.t1).toBe(7.5);
  });

  it('entfernt den Wert wieder, wenn das Feld geleert wird', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/punkte', sprintId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 7 },
      { art: 'bewertung/punkte', sprintId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: null },
    );
    expect(daten.bewertungen).toHaveLength(0);
  });

  it('speichert eine 0 als bewertet, nicht als leer', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/punkte',
      sprintId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      kriteriumId: 't1',
      wert: 0,
    });
    expect(daten.bewertungen[0].team).toHaveProperty('t1', 0);
  });

  it('hält Peer-Urteile je Bewertendem und Bewertetem getrennt', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/peer', sprintId: 's1', teamId: 'team1', bewerterId: 'p1', bewerteterId: 'p2', kriteriumId: 'q1', wert: 5 },
      { art: 'bewertung/peer', sprintId: 's1', teamId: 'team1', bewerterId: 'p2', bewerteterId: 'p1', kriteriumId: 'q1', wert: 3 },
    );
    expect(daten.bewertungen[0].peer.p1.p2.q1).toBe(5);
    expect(daten.bewertungen[0].peer.p2.p1.q1).toBe(3);
  });

  it('räumt leer gewordene Peer-Zweige auf', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/peer', sprintId: 's1', teamId: 'team1', bewerterId: 'p1', bewerteterId: 'p2', kriteriumId: 'q1', wert: 5 },
      { art: 'bewertung/peer', sprintId: 's1', teamId: 'team1', bewerterId: 'p1', bewerteterId: 'p2', kriteriumId: 'q1', wert: null },
    );
    expect(daten.bewertungen).toHaveLength(0);
  });

  it('behält eine Bewertung, solange eine Notiz vorhanden ist (FA-16)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/notiz',
      sprintId: 's1',
      teamId: 'team1',
      notiz: 'Demo lief stabil.',
    });
    expect(daten.bewertungen).toHaveLength(1);
  });

  it('verändert den vorherigen Zustand nicht', () => {
    const vorher = grundbestand();
    const kopie = JSON.parse(JSON.stringify(vorher));
    storeReducer(vorher, { art: 'klasse/umbenennen', id: 'k1', name: 'Neu' });
    expect(vorher).toEqual(kopie);
  });
});

describe('Rubrik (FA-06 bis FA-09)', () => {
  it('begrenzt Gewichte auf 0 bis 100', () => {
    const daten = anwenden(
      leererDatenbestand(),
      { art: 'rubrik/gewicht', kategorie: 'team', wert: 250 },
      { art: 'rubrik/gewicht', kategorie: 'peer', wert: -10 },
    );
    expect(daten.rubrik.gewichte.team).toBe(100);
    expect(daten.rubrik.gewichte.peer).toBe(0);
  });

  it('lässt die Grenze für Note 5 unverändert', () => {
    const daten = anwenden(leererDatenbestand(), { art: 'rubrik/notengrenze', note: 5, ab: 40 });
    expect(daten.rubrik.notenschluessel.find((n) => n.note === 5)!.ab).toBe(0);
  });

  it('setzt die Rubrik auf die Vorlage zurück (FA-09)', () => {
    const daten = anwenden(
      leererDatenbestand(),
      { art: 'rubrik/kriteriumLoeschen', kategorie: 'team', index: 0 },
      { art: 'rubrik/gewicht', kategorie: 'team', wert: 5 },
      { art: 'rubrik/zuruecksetzen' },
    );
    expect(daten.rubrik).toEqual(leererDatenbestand().rubrik);
  });
});

describe('bewertungsIndex', () => {
  it('schlüsselt Bewertungen nach Sprint und Team', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/punkte',
      sprintId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      kriteriumId: 't1',
      wert: 3,
    });
    expect(bewertungsIndex(daten).get('s1__team1')?.team.t1).toBe(3);
  });
});
