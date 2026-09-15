import { describe, expect, it } from 'vitest';

import { leererDatenbestand } from '../domain/defaults';
import type { Datenbestand } from '../domain/types';
import { storeReducer, type Aktion } from '../store/storeReducer';
import { auswahlKorrigieren, personenVon, teamsVon } from './auswahl';
import { START, type UiZustand } from './uizustand';

function anwenden(start: Datenbestand, ...aktionen: Aktion[]): Datenbestand {
  return aktionen.reduce(storeReducer, start);
}

/**
 * Zwei Klassen, drei Projekte: eines je Klasse und eine Diplomarbeit mit
 * Mitgliedern aus beiden.
 */
function bestand(): Datenbestand {
  return anwenden(
    leererDatenbestand(),
    { art: 'klasse/anlegen', id: 'k4', name: '4AHIF' },
    { art: 'klasse/anlegen', id: 'k5', name: '5AHIF' },
    { art: 'team/anlegen', id: 'tk', klasseId: 'k4', name: 'Kepler' },
    { art: 'team/anlegen', id: 'td', klasseId: 'k5', name: 'Doppler' },
    { art: 'team/anlegen', id: 'tda', klasseId: 'k5', name: 'Lagerverwaltung' },
    { art: 'person/anlegen', klasseId: 'k4', teamId: 'tk', namen: [{ id: 'p1', name: 'Berger' }] },
    { art: 'person/anlegen', klasseId: 'k5', teamId: 'td', namen: [{ id: 'p2', name: 'Steiner' }] },
    { art: 'person/anlegen', klasseId: 'k5', teamId: 'tda', namen: [{ id: 'p3', name: 'Huber' }] },
    { art: 'person/anlegen', klasseId: 'k4', teamId: 'tda', namen: [{ id: 'p4', name: 'Ortner' }] },
  );
}

/*
 * FA-95: Ein Klassenfilter für die ganze Anwendung. `null` heißt „alle
 * Klassen" und ist die Vorgabe – nicht „keine".
 */
describe('Klassenfilter über alle Sichten (FA-95)', () => {
  it('zeigt ohne Filter alle Schüler', () => {
    expect(personenVon(bestand(), null).map((p) => p.id).sort()).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
    ]);
  });

  it('zeigt mit Filter nur die Schüler dieser Klasse', () => {
    expect(personenVon(bestand(), 'k4').map((p) => p.id).sort()).toEqual(['p1', 'p4']);
  });

  it('lässt die Schüler einer ausgeblendeten Klasse ausgeblendet (AK-8)', () => {
    // Solange jede Liste über eine gewählte Klasse ging, ergab sich das von
    // selbst – die gelöschte Klasse stand in keiner Auswahl mehr. Mit „alle
    // Klassen" muss es ausdrücklich dastehen.
    const daten = bestand();
    daten.klassen.find((k) => k.id === 'k5')!.geloeschtAm = '2026-09-14T10:00:00.000Z';
    expect(personenVon(daten, null).map((p) => p.id).sort()).toEqual(['p1', 'p4']);
  });

  it('zeigt ohne Filter alle Projekte', () => {
    expect(teamsVon(bestand(), null).map((t) => t.id).sort()).toEqual(['td', 'tda', 'tk']);
  });

  it('ordnet ein Projekt über seine Mitglieder zu, nicht über ein Feld am Projekt', () => {
    // „Lagerverwaltung" wird in der 5AHIF verwaltet, hat aber auch ein Mitglied
    // aus der 4AHIF – und steht deshalb in beiden Klassen (Fachkonzept 15.1).
    expect(teamsVon(bestand(), 'k4').map((t) => t.id).sort()).toEqual(['tda', 'tk']);
    expect(teamsVon(bestand(), 'k5').map((t) => t.id).sort()).toEqual(['td', 'tda']);
  });

  it('behält ein frisch angelegtes Projekt ohne Mitglieder in seiner Klasse', () => {
    // Sonst verschwände es sofort aus der Liste, in der es angelegt wurde.
    const daten = anwenden(bestand(), {
      art: 'team/anlegen',
      id: 'tneu',
      klasseId: 'k4',
      name: 'Frisch',
    });
    expect(teamsVon(daten, 'k4').map((t) => t.id)).toContain('tneu');
    expect(teamsVon(daten, 'k5').map((t) => t.id)).not.toContain('tneu');
  });
});

describe('Auswahl gültig halten (FA-95 AK-7)', () => {
  const ui = (teil: Partial<UiZustand>): UiZustand => ({ ...START, ...teil });

  it('lässt „alle Klassen" stehen', () => {
    const aenderung = auswahlKorrigieren(bestand(), ui({ klasseId: null }));
    expect(aenderung?.klasseId).toBeUndefined();
  });

  it('lässt eine vorhandene Klasse stehen', () => {
    const aenderung = auswahlKorrigieren(bestand(), ui({ klasseId: 'k4' }));
    expect(aenderung?.klasseId).toBeUndefined();
  });

  it('fällt auf „alle Klassen" zurück statt auf die nächstbeste', () => {
    // Wer eine Klasse gelöscht hat, arbeitet danach nicht stillschweigend in
    // einer anderen weiter.
    const aenderung = auswahlKorrigieren(bestand(), ui({ klasseId: 'gibtesnicht' }));
    expect(aenderung?.klasseId).toBe(null);
  });
});
