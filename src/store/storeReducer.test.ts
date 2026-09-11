import { describe, expect, it } from 'vitest';

import { RUBRIK_SPRINT, leererDatenbestand, testRubrik } from '../domain/defaults';
import { rubrikVon, teamIn } from '../domain/zuordnung';
import type { Abschnitt, Datenbestand } from '../domain/types';
import { bewertungsIndex, storeReducer, type Aktion } from './storeReducer';

function anwenden(start: Datenbestand, ...aktionen: Aktion[]): Datenbestand {
  return aktionen.reduce(storeReducer, start);
}

/** Ein Abschnitt mit den Pflichtfeldern; abweichende Felder werden übergeben. */
function abschnitt(teil: Partial<Abschnitt> & Pick<Abschnitt, 'id' | 'nummer' | 'name'>): Abschnitt {
  return {
    klasseId: 'k1',
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
    { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's1', nummer: 1, name: 'Sprint 1' }) },
  );
}

describe('Stammdaten (FA-01 bis FA-04)', () => {
  it('legt Klasse, Team, Personen und Abschnitt an', () => {
    const daten = grundbestand();
    expect(daten.klassen).toHaveLength(1);
    expect(daten.personen.map((p) => p.name)).toEqual(['Berger Lena', 'Steiner Jonas']);
    expect(daten.abschnitte[0].faktor).toBe(1);
    expect(daten.abschnitte[0].strang).toBe('praxis');
  });

  it('behält Personen beim Löschen eines Teams und setzt sie auf „ohne Team“', () => {
    const daten = anwenden(grundbestand(), { art: 'team/loeschen', id: 'team1' });
    expect(daten.teams).toHaveLength(0);
    expect(daten.personen).toHaveLength(2);
    expect(daten.personen.every((p) => p.teamId === null)).toBe(true);
    expect(daten.zugehoerigkeiten.every((z) => z.teamId === null)).toBe(true);
  });

  it('entfernt mit der Klasse auch Teams, Personen, Abschnitte und Bewertungen', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 5 },
      { art: 'klasse/loeschen', id: 'k1' },
    );
    expect(daten).toEqual(leererDatenbestand());
  });

  it('entfernt mit einer Person auch ihre Einzel-, Peer- und Zugehörigkeitsangaben', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/individuell', abschnittId: 's1', teamId: 'team1', personId: 'p1', kriteriumId: 'i1', wert: 8 },
      { art: 'bewertung/peer', abschnittId: 's1', teamId: 'team1', bewerterId: 'p2', bewerteterId: 'p1', kriteriumId: 'q1', wert: 4 },
      { art: 'person/loeschen', id: 'p1' },
    );
    expect(daten.personen).toHaveLength(1);
    expect(daten.bewertungen).toHaveLength(0);
    expect(daten.zugehoerigkeiten.some((z) => z.personId === 'p1')).toBe(false);
  });
});

describe('Teamzugehörigkeit je Abschnitt (FA-58)', () => {
  it('übernimmt beim Anlegen eines Abschnitts die Zuordnung des vorherigen (AK-2)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'abschnitt/anlegen',
      abschnitt: abschnitt({ id: 's2', nummer: 2, name: 'Sprint 2' }),
    });
    expect(teamIn(daten, 's2', 'p1')).toBe('team1');
  });

  it('lässt einen Teamwechsel zu, ohne den früheren Abschnitt zu ändern (AK-1)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'team/anlegen', id: 'team2', klasseId: 'k1', name: 'Team Galilei' },
      { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's2', nummer: 2, name: 'Sprint 2' }) },
      { art: 'zugehoerigkeit/setzen', abschnittId: 's2', personId: 'p1', teamId: 'team2' },
    );
    expect(teamIn(daten, 's1', 'p1')).toBe('team1');
    expect(teamIn(daten, 's2', 'p1')).toBe('team2');
    expect(teamIn(daten, 's2', 'p2')).toBe('team1');
  });

  it('erlaubt „kein Team“ in einem Abschnitt (AK-3)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'zugehoerigkeit/setzen',
      abschnittId: 's1',
      personId: 'p2',
      teamId: null,
    });
    expect(teamIn(daten, 's1', 'p2')).toBeNull();
  });
});

describe('Tests als Abschnittsart (FA-60)', () => {
  it('legt einen Test mit eigener Rubrik und ohne Teamzuordnung an', () => {
    const daten = anwenden(grundbestand(), {
      art: 'abschnitt/anlegen',
      abschnitt: abschnitt({
        id: 'x1',
        nummer: 2,
        name: 'Test 1',
        art: 'test',
        strang: 'theorie',
        rubrikId: 'rubrik-test-1',
        angekuendigtAm: '2026-10-01',
        arbeitszeitMinuten: 25,
      }),
      rubrik: testRubrik('rubrik-test-1', 'Test 1'),
    });
    expect(daten.rubriken.some((r) => r.id === 'rubrik-test-1')).toBe(true);
    expect(daten.zugehoerigkeiten.some((z) => z.abschnittId === 'x1')).toBe(false);
    expect(daten.abschnitte.find((a) => a.id === 'x1')?.arbeitszeitMinuten).toBe(25);
  });

  it('nimmt beim Löschen des Tests dessen Rubrik mit', () => {
    const daten = anwenden(
      grundbestand(),
      {
        art: 'abschnitt/anlegen',
        abschnitt: abschnitt({ id: 'x1', nummer: 2, name: 'Test 1', art: 'test', strang: 'theorie', rubrikId: 'rubrik-test-1' }),
        rubrik: testRubrik('rubrik-test-1', 'Test 1'),
      },
      { art: 'abschnitt/loeschen', id: 'x1' },
    );
    expect(daten.rubriken.some((r) => r.id === 'rubrik-test-1')).toBe(false);
  });

  it('erfasst Testpunkte ohne Team unter dem Schlüssel mit null', () => {
    const daten = anwenden(
      grundbestand(),
      {
        art: 'abschnitt/anlegen',
        abschnitt: abschnitt({ id: 'x1', nummer: 2, name: 'Test 1', art: 'test', strang: 'theorie', rubrikId: 'rubrik-test-1' }),
        rubrik: testRubrik('rubrik-test-1', 'Test 1'),
      },
      { art: 'bewertung/individuell', abschnittId: 'x1', teamId: null, personId: 'p1', kriteriumId: 'f4', wert: 3 },
    );
    expect(bewertungsIndex(daten).get('x1__-')?.individuell.p1.punkte.f4).toBe(3);
  });
});

describe('Rubrik einfrieren (FA-65)', () => {
  it('friert die Rubrik beim ersten Punktewert ein', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/punkte',
      abschnittId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      kriteriumId: 't1',
      wert: 7,
    });
    const eingefroren = daten.abschnitte[0];
    expect(eingefroren.rubrikKopie).toBeDefined();
    expect(eingefroren.eingefrorenAm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('friert nicht ein, solange nur geleert wird', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/punkte',
      abschnittId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      kriteriumId: 't1',
      wert: null,
    });
    expect(daten.abschnitte[0].rubrikKopie).toBeUndefined();
  });

  it('rechnet danach mit der Kopie, nicht mit der geänderten Rubrik (AK-2)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 7 },
      { art: 'rubrik/gewicht', rubrikId: RUBRIK_SPRINT, kategorie: 'team', wert: 5 },
    );
    expect(rubrikVon(daten, daten.abschnitte[0]).gewichte.team).toBe(45);
    expect(daten.rubriken.find((r) => r.id === RUBRIK_SPRINT)!.gewichte.team).toBe(5);
  });

  it('friert bei einem zweiten Wert nicht erneut ein', () => {
    const erste = anwenden(grundbestand(), {
      art: 'bewertung/punkte',
      abschnittId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      kriteriumId: 't1',
      wert: 7,
    });
    const zweite = anwenden(erste, {
      art: 'bewertung/punkte',
      abschnittId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      kriteriumId: 't2',
      wert: 6,
    });
    expect(zweite.abschnitte[0].eingefrorenAm).toBe(erste.abschnitte[0].eingefrorenAm);
  });
});

describe('Bewertung erfassen (FA-12 bis FA-16, FA-19)', () => {
  it('legt die Bewertung beim ersten Punkt automatisch an', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/punkte',
      abschnittId: 's1',
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
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 7 },
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: null },
    );
    expect(daten.bewertungen).toHaveLength(0);
  });

  it('speichert eine 0 als bewertet, nicht als leer', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/punkte',
      abschnittId: 's1',
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
      { art: 'bewertung/peer', abschnittId: 's1', teamId: 'team1', bewerterId: 'p1', bewerteterId: 'p2', kriteriumId: 'q1', wert: 5 },
      { art: 'bewertung/peer', abschnittId: 's1', teamId: 'team1', bewerterId: 'p2', bewerteterId: 'p1', kriteriumId: 'q1', wert: 3 },
    );
    expect(daten.bewertungen[0].peer.p1.p2.q1).toBe(5);
    expect(daten.bewertungen[0].peer.p2.p1.q1).toBe(3);
  });

  it('räumt leer gewordene Peer-Zweige auf', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/peer', abschnittId: 's1', teamId: 'team1', bewerterId: 'p1', bewerteterId: 'p2', kriteriumId: 'q1', wert: 5 },
      { art: 'bewertung/peer', abschnittId: 's1', teamId: 'team1', bewerterId: 'p1', bewerteterId: 'p2', kriteriumId: 'q1', wert: null },
    );
    expect(daten.bewertungen).toHaveLength(0);
  });

  it('behält eine Bewertung, solange eine Notiz vorhanden ist (FA-16)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/notiz',
      abschnittId: 's1',
      teamId: 'team1',
      notiz: 'Demo lief stabil.',
    });
    expect(daten.bewertungen).toHaveLength(1);
  });

  it('behält eine Bewertung, solange eine persönliche Notiz vorhanden ist (FA-17)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/individuellNotiz',
      abschnittId: 's1',
      teamId: 'team1',
      personId: 'p1',
      notiz: 'Hat die Schnittstelle allein gebaut.',
    });
    expect(daten.bewertungen[0].individuell.p1.notiz).toContain('Schnittstelle');
  });

  it('verändert den vorherigen Zustand nicht', () => {
    const vorher = grundbestand();
    const kopie = JSON.parse(JSON.stringify(vorher));
    storeReducer(vorher, { art: 'klasse/umbenennen', id: 'k1', name: 'Neu' });
    expect(vorher).toEqual(kopie);
  });
});

describe('Rubriken (FA-06 bis FA-09, FA-55)', () => {
  it('begrenzt Gewichte auf 0 bis 100', () => {
    const daten = anwenden(
      leererDatenbestand(),
      { art: 'rubrik/gewicht', rubrikId: RUBRIK_SPRINT, kategorie: 'team', wert: 250 },
      { art: 'rubrik/gewicht', rubrikId: RUBRIK_SPRINT, kategorie: 'peer', wert: -10 },
    );
    const rubrik = daten.rubriken.find((r) => r.id === RUBRIK_SPRINT)!;
    expect(rubrik.gewichte.team).toBe(100);
    expect(rubrik.gewichte.peer).toBe(0);
  });

  it('lässt die Grenze für Note 5 unverändert', () => {
    const daten = anwenden(leererDatenbestand(), { art: 'notengrenze', note: 5, ab: 40 });
    expect(daten.notenschluessel.find((n) => n.note === 5)!.ab).toBe(0);
  });

  it('setzt eine Rubrik auf die Vorlage zurück (FA-09)', () => {
    const daten = anwenden(
      leererDatenbestand(),
      { art: 'rubrik/kriteriumLoeschen', rubrikId: RUBRIK_SPRINT, kategorie: 'team', index: 0 },
      { art: 'rubrik/gewicht', rubrikId: RUBRIK_SPRINT, kategorie: 'team', wert: 5 },
      { art: 'rubrik/zuruecksetzen', rubrikId: RUBRIK_SPRINT },
    );
    expect(daten.rubriken.find((r) => r.id === RUBRIK_SPRINT)).toEqual(
      leererDatenbestand().rubriken.find((r) => r.id === RUBRIK_SPRINT),
    );
  });

  it('behält eine Rubrik, nach der bereits bewertet wurde (FA-55 AK-3)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'rubrik/anlegen', rubrik: testRubrik('r2', 'Eigene Rubrik') },
      { art: 'abschnitt/aendern', id: 's1', aenderung: { rubrikId: 'r2' } },
      { art: 'bewertung/individuell', abschnittId: 's1', teamId: 'team1', personId: 'p1', kriteriumId: 'f1', wert: 2 },
      { art: 'rubrik/loeschen', rubrikId: 'r2' },
    );
    expect(daten.rubriken.some((r) => r.id === 'r2')).toBe(true);
  });

  it('löscht eine unbenutzte Rubrik und hängt ihre Abschnitte an die Vorgabe', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'rubrik/anlegen', rubrik: testRubrik('r2', 'Eigene Rubrik') },
      { art: 'abschnitt/aendern', id: 's1', aenderung: { rubrikId: 'r2' } },
      { art: 'rubrik/loeschen', rubrikId: 'r2' },
    );
    expect(daten.rubriken.some((r) => r.id === 'r2')).toBe(false);
    expect(daten.abschnitte[0].rubrikId).toBe(RUBRIK_SPRINT);
  });

  it('behält beim Umbenennen eines Kriteriums dessen Kennung (Regel 4)', () => {
    const daten = anwenden(leererDatenbestand(), {
      art: 'rubrik/kriteriumAendern',
      rubrikId: RUBRIK_SPRINT,
      kategorie: 'team',
      index: 0,
      aenderung: { name: 'Funktionsumfang' },
    });
    const kriterium = daten.rubriken.find((r) => r.id === RUBRIK_SPRINT)!.team[0];
    expect(kriterium.id).toBe('t1');
    expect(kriterium.name).toBe('Funktionsumfang');
  });
});

describe('Stranggewichte (FA-59)', () => {
  it('begrenzt das Gewicht eines Strangs auf 0 bis 100', () => {
    const daten = anwenden(
      leererDatenbestand(),
      { art: 'strang/gewicht', strang: 'theorie', wert: 140 },
      { art: 'strang/gewicht', strang: 'praxis', wert: -5 },
    );
    expect(daten.strangGewichte.theorie).toBe(100);
    expect(daten.strangGewichte.praxis).toBe(0);
  });
});

describe('bewertungsIndex', () => {
  it('schlüsselt Bewertungen nach Abschnitt und Team', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/punkte',
      abschnittId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      kriteriumId: 't1',
      wert: 3,
    });
    expect(bewertungsIndex(daten).get('s1__team1')?.team.t1).toBe(3);
  });
});
