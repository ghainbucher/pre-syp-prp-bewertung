import { describe, expect, it } from 'vitest';

import { RUBRIK_SPRINT, leererDatenbestand } from '../domain/defaults';
import type { Abschnitt, Datenbestand } from '../domain/types';
import { storeReducer, type Aktion } from '../store/storeReducer';
import {
  FILTER_LEER,
  jahrgangVon,
  mitgliederVonProjekt,
  projektzeile,
  projektzeilen,
  sprintzeilen,
} from './projekte';

function anwenden(start: Datenbestand, ...aktionen: Aktion[]): Datenbestand {
  return aktionen.reduce(storeReducer, start);
}

function abschnitt(
  teil: Partial<Abschnitt> & Pick<Abschnitt, 'id' | 'nummer' | 'name' | 'klasseId'>,
): Abschnitt {
  return {
    art: 'sprint',
    strang: 'praxis',
    rubrikId: RUBRIK_SPRINT,
    von: '',
    bis: '',
    faktor: 1,
    peerAktiv: false,
    ...teil,
  };
}

/**
 * Zwei Klassen, drei Projekte: ein reines Projekt je Klasse und eine
 * Diplomarbeit, deren Mitglieder aus beiden Klassen kommen.
 */
function bestand(): Datenbestand {
  return anwenden(
    leererDatenbestand(),
    { art: 'klasse/anlegen', id: 'k4', name: '4AHIF' },
    { art: 'klasse/anlegen', id: 'k5', name: '5AHIF' },
    { art: 'team/anlegen', id: 'tk', klasseId: 'k4', name: 'Kepler' },
    { art: 'team/anlegen', id: 'td', klasseId: 'k5', name: 'Doppler' },
    { art: 'team/anlegen', id: 'tda', klasseId: 'k5', name: 'Lagerverwaltung' },
    { art: 'team/art', id: 'tk', projektart: 'syp-pre-4' },
    { art: 'team/art', id: 'td', projektart: 'syp-pre-5' },
    { art: 'team/art', id: 'tda', projektart: 'diplomarbeit' },
    {
      art: 'person/anlegen',
      klasseId: 'k4',
      teamId: 'tk',
      namen: [{ id: 'p1', name: 'Berger Lena' }],
    },
    {
      art: 'person/anlegen',
      klasseId: 'k5',
      teamId: 'td',
      namen: [{ id: 'p2', name: 'Steiner Jonas' }],
    },
    // Die Diplomarbeit bekommt je einen Schüler aus beiden Klassen.
    {
      art: 'person/anlegen',
      klasseId: 'k5',
      teamId: 'tda',
      namen: [{ id: 'p3', name: 'Huber Mia' }],
    },
    {
      art: 'person/anlegen',
      klasseId: 'k4',
      teamId: 'tda',
      namen: [{ id: 'p4', name: 'Ortner Paul' }],
    },
  );
}

describe('jahrgangVon (OP-F34)', () => {
  it('leitet den Jahrgang aus der Art ab und erfindet keinen', () => {
    expect(jahrgangVon('syp-pre-4')).toBe(4);
    expect(jahrgangVon('syp-pre-5')).toBe(5);
    expect(jahrgangVon('diplomarbeit')).toBe(5);
    expect(jahrgangVon(undefined)).toBe(null);
  });
});

describe('mitgliederVonProjekt (FA-58)', () => {
  it('nennt die Mitglieder eines Projekts', () => {
    expect(mitgliederVonProjekt(bestand(), 'tk').map((p) => p.name)).toEqual(['Berger Lena']);
  });

  it('nimmt einen Schüler auf, der einem zweiten Projekt zugeordnet wird (FA-87 AK-5)', () => {
    const daten = anwenden(
      bestand(),
      { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's1', klasseId: 'k4', nummer: 1, name: 'Sprint 1' }) },
      { art: 'mitgliedschaft/setzen', projektId: 'tk', personId: 'p4', dabei: true },
    );
    expect(mitgliederVonProjekt(daten, 'tk').map((p) => p.name)).toEqual([
      'Berger Lena',
      'Ortner Paul',
    ]);
  });
});

describe('projektzeile (FA-90 AK-3)', () => {
  it('nennt ein Projekt gemischt, sobald die Mitglieder aus zwei Klassen kommen', () => {
    const zeile = projektzeile(bestand(), bestand().teams.find((t) => t.id === 'tda')!);
    expect(zeile.gemischt).toBe(true);
    expect(zeile.klassen).toEqual(['4AHIF', '5AHIF']);
  });

  it('nennt ein Projekt einer einzigen Klasse nicht gemischt', () => {
    const zeile = projektzeile(bestand(), bestand().teams.find((t) => t.id === 'tk')!);
    expect(zeile.gemischt).toBe(false);
    expect(zeile.klassen).toEqual(['4AHIF']);
  });

  it('lässt `aktuell` leer, solange kein Sprint angelegt ist', () => {
    expect(projektzeile(bestand(), bestand().teams[0]!).aktuell).toBe(null);
  });
});

describe('projektzeilen (FA-90)', () => {
  it('zeigt ohne Filter alle Projekte, nach Klasse und Name geordnet', () => {
    expect(projektzeilen(bestand(), FILTER_LEER).map((z) => z.team.name)).toEqual([
      'Kepler',
      'Doppler',
      'Lagerverwaltung',
    ]);
  });

  it('filtert nach Jahrgang und lässt ein Projekt ohne Art heraus', () => {
    const daten = anwenden(bestand(), { art: 'team/art', id: 'td', projektart: null });
    const vier = projektzeilen(daten, { ...FILTER_LEER, jahrgang: 4 }).map((z) => z.team.name);
    const fuenf = projektzeilen(daten, { ...FILTER_LEER, jahrgang: 5 }).map((z) => z.team.name);
    expect(vier).toEqual(['Kepler']);
    expect(fuenf).toEqual(['Lagerverwaltung']);
  });

  it('zeigt ein gemischtes Projekt auch in der Sicht der zweiten Klasse', () => {
    const namen = projektzeilen(bestand(), { ...FILTER_LEER, klasse: 'k4' }).map(
      (z) => z.team.name,
    );
    expect(namen).toEqual(['Kepler', 'Lagerverwaltung']);
  });

  it('zeigt mit „nur gemischte“ die Projekte über Klassengrenzen', () => {
    const namen = projektzeilen(bestand(), { ...FILTER_LEER, nurGemischt: true }).map(
      (z) => z.team.name,
    );
    expect(namen).toEqual(['Lagerverwaltung']);
  });

  it('lässt Klasse und „nur gemischte“ zusammen wirken (FA-95)', () => {
    // „Gemischte Projekte, an denen die 4AHIF beteiligt ist" – das ist der
    // Grund, warum die beiden getrennt sind und nicht ein Auswahlfeld mit drei
    // Bedeutungen.
    const namen = projektzeilen(bestand(), {
      ...FILTER_LEER,
      klasse: 'k4',
      nurGemischt: true,
    }).map((z) => z.team.name);
    expect(namen).toEqual(['Lagerverwaltung']);
  });

  it('nimmt ein frisch angelegtes Projekt ohne Mitglieder in seine Klasse (FA-95)', () => {
    // Ohne diese Ausnahme verschwände ein gerade angelegtes Projekt sofort aus
    // der Liste, in der es angelegt wurde – und der nächste Schritt, die
    // Schüler zuzuordnen, wäre nicht mehr erreichbar.
    const daten = anwenden(bestand(), {
      art: 'team/anlegen',
      id: 'tneu',
      klasseId: 'k4',
      name: 'Frisch',
    });
    const namen = projektzeilen(daten, { ...FILTER_LEER, klasse: 'k4' }).map((z) => z.team.name);
    expect(namen).toContain('Frisch');
    expect(projektzeilen(daten, { ...FILTER_LEER, klasse: 'k5' }).map((z) => z.team.name)).not.toContain(
      'Frisch',
    );
  });

  it('sucht über Name, Repository und Klasse', () => {
    const daten = anwenden(bestand(), {
      art: 'team/repository',
      id: 'td',
      repository: 'htl/warenkorb',
    });
    expect(projektzeilen(daten, { ...FILTER_LEER, suche: 'warenkorb' }).map((z) => z.team.name)).toEqual(
      ['Doppler'],
    );
    expect(projektzeilen(daten, { ...FILTER_LEER, suche: 'kepl' }).map((z) => z.team.name)).toEqual([
      'Kepler',
    ]);
  });
});

/*
 * Vorher der Durchstich „führt die Diplomarbeit als Projekt eines Typs"
 * (Solution-Design 8.1). Die Aussage von FA-73 ist keine über die Oberfläche,
 * sondern eine über das Modell: Es gibt keinen Sonderweg mehr.
 */
describe('Die Diplomarbeit ist ein Projekt eines Typs (FA-73)', () => {
  it('steht in derselben Liste wie jedes andere Projekt', () => {
    const zeilen = projektzeilen(bestand(), FILTER_LEER);
    expect(zeilen.map((z) => z.team.name)).toContain('Lagerverwaltung');
  });

  it('wird über denselben Jahrgangsfilter gefunden (FA-90 AK-1)', () => {
    const zeilen = projektzeilen(bestand(), { ...FILTER_LEER, jahrgang: 5 });
    expect(zeilen.map((z) => z.team.name).sort()).toEqual(['Doppler', 'Lagerverwaltung']);
  });

  it('hat Mitglieder wie jedes andere Projekt – hier aus zwei Klassen (A9)', () => {
    const zeile = projektzeile(bestand(), bestand().teams.find((t) => t.id === 'tda')!);
    expect(zeile.mitglieder.map((p) => p.name).sort()).toEqual(['Huber Mia', 'Ortner Paul']);
    expect(zeile.gemischt).toBe(true);
  });

  it('nimmt Sprints auf wie jedes andere Projekt (FA-91)', () => {
    const daten = anwenden(bestand(), {
      art: 'abschnitt/anlegen',
      abschnitt: abschnitt({ id: 'd1', nummer: 1, name: 'Sprint 1', klasseId: 'k5' }),
    });
    const geplant = anwenden(daten, {
      art: 'planung/festhalten',
      abschnittId: 'd1',
      teamId: 'tda',
      von: '2026-10-03',
      bis: '2026-10-17',
    });
    const diplomarbeit = geplant.teams.find((t) => t.id === 'tda')!;
    expect(sprintzeilen(geplant, diplomarbeit).map((z) => z.abschnitt.name)).toEqual(['Sprint 1']);
  });
});

describe('sprintzeilen (FA-91)', () => {
  it('zählt je Projekt und nicht je Klasse (FA-04 AK-5)', () => {
    const daten = anwenden(
      bestand(),
      { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's1', klasseId: 'k5', nummer: 1, name: 'Sprint 1' }) },
      { art: 'planung/festhalten', abschnittId: 's1', teamId: 'td' },
      { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's2', klasseId: 'k5', nummer: 2, name: 'Sprint 1' }) },
      { art: 'planung/festhalten', abschnittId: 's2', teamId: 'tda' },
      { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's3', klasseId: 'k5', nummer: 3, name: 'Sprint 2' }) },
      { art: 'planung/festhalten', abschnittId: 's3', teamId: 'td' },
    );
    const doppler = daten.teams.find((t) => t.id === 'td')!;
    expect(sprintzeilen(daten, doppler).map((z) => z.kurz)).toEqual(['S1', 'S2']);
    const da = daten.teams.find((t) => t.id === 'tda')!;
    expect(sprintzeilen(daten, da).map((z) => z.kurz)).toEqual(['S1']);
  });

  it('nennt einen Sprint ohne vollständigen Zeitraum nicht laufend', () => {
    const daten = anwenden(
      bestand(),
      { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's1', klasseId: 'k4', nummer: 1, name: 'Sprint 1' }) },
      { art: 'planung/festhalten', abschnittId: 's1', teamId: 'tk' },
    );
    const kepler = daten.teams.find((t) => t.id === 'tk')!;
    expect(sprintzeilen(daten, kepler)[0]!.laufend).toBe(false);
    expect(sprintzeilen(daten, kepler)[0]!.zustand).toBe('vorschlag');
  });
});
