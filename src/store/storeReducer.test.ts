import { describe, expect, it } from 'vitest';

import { RUBRIK_SPRINT, leererDatenbestand, testRubrik } from '../domain/defaults';
import { planungVon, rubrikFuer, rueckmeldungOffen, teamIn } from '../domain/zuordnung';
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

describe('Kriterien einfrieren (FA-65)', () => {
  it('friert die Kriterien beim ersten Punktewert je Team ein', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/punkte',
      abschnittId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      kriteriumId: 't1',
      wert: 7,
    });
    // Ab Schemastand 3 hängt die Kopie am Team, nicht am Abschnitt (FA-65 AK-1).
    const planung = planungVon(daten, 's1', 'team1');
    expect(planung?.rubrikKopie).toBeDefined();
    expect(planung?.eingefrorenAm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(daten.abschnitte[0].rubrikKopie).toBeUndefined();
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
    expect(planungVon(daten, 's1', 'team1')).toBeUndefined();
  });

  it('rechnet danach mit der Kopie, nicht mit der geänderten Rubrik (AK-2)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 7 },
      { art: 'rubrik/gewicht', rubrikId: RUBRIK_SPRINT, kategorie: 'team', wert: 5 },
    );
    expect(rubrikFuer(daten, daten.abschnitte[0], 'team1').gewichte.team).toBe(45);
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
    expect(planungVon(zweite, 's1', 'team1')?.eingefrorenAm).toBe(
      planungVon(erste, 's1', 'team1')?.eingefrorenAm,
    );
  });

  it('friert bei einem Test weiterhin am Abschnitt ein – dort gibt es kein Team (AK-7)', () => {
    const daten = anwenden(
      grundbestand(),
      {
        art: 'abschnitt/anlegen',
        abschnitt: abschnitt({ id: 'x9', nummer: 3, name: 'Test 9', art: 'test', strang: 'theorie', rubrikId: 'rubrik-test-9' }),
        rubrik: testRubrik('rubrik-test-9', 'Test 9'),
      },
      { art: 'bewertung/individuell', abschnittId: 'x9', teamId: null, personId: 'p1', kriteriumId: 'f1', wert: 2 },
    );
    const test = daten.abschnitte.find((a) => a.id === 'x9')!;
    expect(test.rubrikKopie).toBeDefined();
    expect(daten.teamabschnitte.some((tp) => tp.abschnittId === 'x9')).toBe(false);
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

  it('behält eine Bewertung, solange eine persönliche Notiz vorhanden ist (FA-17 AK-1)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/individuellNotiz',
      abschnittId: 's1',
      teamId: 'team1',
      personId: 'p1',
      notiz: 'Hat die Schnittstelle allein gebaut.',
    });
    expect(daten.bewertungen[0].individuell.p1.notiz).toContain('Schnittstelle');
  });

  it('hält Teamnotiz und persönliche Notiz getrennt (FA-16, FA-17 AK-2)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/notiz', abschnittId: 's1', teamId: 'team1', notiz: 'Demo lief stabil.' },
      {
        art: 'bewertung/individuellNotiz',
        abschnittId: 's1',
        teamId: 'team1',
        personId: 'p1',
        notiz: 'Hat die Schnittstelle allein gebaut.',
      },
    );
    expect(daten.bewertungen[0].notiz).toBe('Demo lief stabil.');
    expect(daten.bewertungen[0].individuell.p1.notiz).toContain('Schnittstelle');
    expect(daten.bewertungen[0].individuell.p2).toBeUndefined();
  });

  it('speichert eine geleerte persönliche Notiz nicht (FA-17 AK-3)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 5 },
      { art: 'bewertung/individuellNotiz', abschnittId: 's1', teamId: 'team1', personId: 'p1', notiz: 'Merkzettel' },
      { art: 'bewertung/individuellNotiz', abschnittId: 's1', teamId: 'team1', personId: 'p1', notiz: '  ' },
    );
    expect(daten.bewertungen[0].individuell).toEqual({});
  });

  it('behält die Notiz, wenn alle Punkte der Person geleert werden (FA-17 AK-5)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/individuell', abschnittId: 's1', teamId: 'team1', personId: 'p1', kriteriumId: 'i1', wert: 8 },
      { art: 'bewertung/individuellNotiz', abschnittId: 's1', teamId: 'team1', personId: 'p1', notiz: 'Krank gewesen.' },
      { art: 'bewertung/individuell', abschnittId: 's1', teamId: 'team1', personId: 'p1', kriteriumId: 'i1', wert: null },
    );
    expect(daten.bewertungen).toHaveLength(1);
    expect(daten.bewertungen[0].individuell.p1.punkte).toEqual({});
    expect(daten.bewertungen[0].individuell.p1.notiz).toBe('Krank gewesen.');
  });

  it('lässt eine Bewertung fallen, die nur noch eine leere Notiz trug (FA-17 AK-3)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/individuellNotiz', abschnittId: 's1', teamId: 'team1', personId: 'p1', notiz: 'Merkzettel' },
      { art: 'bewertung/individuellNotiz', abschnittId: 's1', teamId: 'team1', personId: 'p1', notiz: '' },
    );
    expect(daten.bewertungen).toHaveLength(0);
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

describe('Nachfrage zur Peer-Bewertung (FA-53)', () => {
  /** Grundbestand mit zwei Sprints und vollständig bewertetem Sprint 1. */
  function zweiSprints(): Datenbestand {
    return anwenden(
      grundbestand(),
      { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's2', nummer: 2, name: 'Sprint 2' }) },
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 8 },
    );
  }

  it('hält Antwort, Abschnitt und Datum fest (AK-4)', () => {
    const daten = anwenden(zweiSprints(), {
      art: 'peer/entscheidung',
      abschnittId: 's1',
      antwort: 'ja',
      am: '2026-10-24T12:00:00.000Z',
    });
    expect(daten.peerEntscheidungen).toEqual([
      { abschnittId: 's1', am: '2026-10-24T12:00:00.000Z', antwort: 'ja' },
    ]);
  });

  it('schaltet bei „ja“ den nächsten vorhandenen Abschnitt ein', () => {
    const daten = anwenden(zweiSprints(), {
      art: 'peer/entscheidung',
      abschnittId: 's1',
      antwort: 'ja',
    });
    expect(daten.abschnitte.find((a) => a.id === 's1')!.peerAktiv).toBe(false);
    expect(daten.abschnitte.find((a) => a.id === 's2')!.peerAktiv).toBe(true);
  });

  it('schaltet bei „nein“ und „später“ nichts ein (AK-5)', () => {
    for (const antwort of ['nein', 'spaeter'] as const) {
      const daten = anwenden(zweiSprints(), { art: 'peer/entscheidung', abschnittId: 's1', antwort });
      expect(daten.abschnitte.find((a) => a.id === 's2')!.peerAktiv).toBe(false);
    }
  });

  it('lässt die Vorgabe für neu angelegte Abschnitte bei „aus“ (FA-52 AK-1)', () => {
    const daten = anwenden(
      zweiSprints(),
      { art: 'peer/entscheidung', abschnittId: 's1', antwort: 'ja' },
      { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's3', nummer: 3, name: 'Sprint 3' }) },
    );
    expect(daten.abschnitte.find((a) => a.id === 's3')!.peerAktiv).toBe(false);
  });

  it('ersetzt eine frühere Antwort zum selben Abschnitt', () => {
    const daten = anwenden(
      zweiSprints(),
      { art: 'peer/entscheidung', abschnittId: 's1', antwort: 'spaeter' },
      { art: 'peer/entscheidung', abschnittId: 's1', antwort: 'nein' },
    );
    expect(daten.peerEntscheidungen).toHaveLength(1);
    expect(daten.peerEntscheidungen[0].antwort).toBe('nein');
  });

  it('entfernt die Entscheidung mit dem Abschnitt', () => {
    const daten = anwenden(
      zweiSprints(),
      { art: 'peer/entscheidung', abschnittId: 's1', antwort: 'nein' },
      { art: 'abschnitt/loeschen', id: 's1' },
    );
    expect(daten.peerEntscheidungen).toEqual([]);
  });
});

describe('Zeitfaktor und Peer-Deckelung einstellen (FA-45 AK-4, FA-54 AK-6)', () => {
  it('begrenzt die Peer-Deckelung auf 0 bis 50 Prozentpunkte', () => {
    expect(anwenden(leererDatenbestand(), { art: 'peerDeckelung', wert: 99 }).peerDeckelung).toBe(50);
    expect(anwenden(leererDatenbestand(), { art: 'peerDeckelung', wert: -3 }).peerDeckelung).toBe(0);
  });

  it('lässt den Zeitfaktor nicht unter 1 fallen', () => {
    // Unter 1 wögen spätere Abschnitte weniger als frühere – das wäre das
    // Gegenteil von § 20 Abs. 1 LBVO, nicht bloß eine Abweichung.
    const daten = anwenden(leererDatenbestand(), { art: 'zeitfaktor', wert: 0 });
    expect(daten.zeitfaktorZweiteHaelfte).toBe(1);
    expect(anwenden(leererDatenbestand(), { art: 'zeitfaktor', wert: 9 }).zeitfaktorZweiteHaelfte).toBe(5);
  });
});

describe('Stichtage (FA-48)', () => {
  it('legt die drei vorgesehenen Stichtage an (AK-4)', () => {
    const daten = anwenden(leererDatenbestand(), { art: 'stichtag/vorlage', startjahr: 2026 });
    expect(daten.stichtage.map((s) => s.art)).toEqual(['zeugnis', 'kontrolle', 'zeugnis']);
  });

  it('legt beim zweiten Aufruf nichts doppelt an und behält angepasste Daten', () => {
    const daten = anwenden(
      leererDatenbestand(),
      { art: 'stichtag/vorlage', startjahr: 2026 },
      { art: 'stichtag/aendern', id: 'stichtag-semester', aenderung: { bis: '2027-02-05' } },
      { art: 'stichtag/vorlage', startjahr: 2026 },
    );
    expect(daten.stichtage).toHaveLength(3);
    expect(daten.stichtage.find((s) => s.id === 'stichtag-semester')!.bis).toBe('2027-02-05');
  });

  it('entfernt einen Stichtag, ohne Abschnitte anzufassen (AK-2)', () => {
    const daten = anwenden(
      { ...grundbestand(), stichtage: [] },
      { art: 'stichtag/vorlage', startjahr: 2026 },
      { art: 'stichtag/loeschen', id: 'stichtag-fruehwarnung' },
    );
    expect(daten.stichtage.map((s) => s.id)).toEqual(['stichtag-semester', 'stichtag-jahr']);
    expect(daten.abschnitte).toHaveLength(1);
  });
});

describe('Gesetzte Werte (FA-50)', () => {
  it('setzt ein Kategorieergebnis, ohne die Ebene darunter auszufüllen (AK-1)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'gesetzt/kategorie',
      abschnittId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      wert: 85,
      begruendung: 'Demo im Unterricht gesehen',
    });
    const gesetzt = daten.bewertungen[0].gesetzt!.kategorie!.team!;
    expect(gesetzt.prozent).toBe(85);
    expect(gesetzt.begruendung).toBe('Demo im Unterricht gesehen');
    expect(gesetzt.gesetztAm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // Die Punkte darunter bleiben leer – das ist der Zweck.
    expect(daten.bewertungen[0].team).toEqual({});
  });

  it('hält einen gesetzten Wert, auch wenn sonst nichts erfasst ist', () => {
    const daten = anwenden(grundbestand(), {
      art: 'gesetzt/abschnitt',
      abschnittId: 's1',
      teamId: 'team1',
      personId: 'p1',
      wert: 70,
    });
    expect(daten.bewertungen).toHaveLength(1);
  });

  it('lässt den berechneten Wert unberührt (AK-2)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 5 },
      { art: 'gesetzt/kategorie', abschnittId: 's1', teamId: 'team1', kategorie: 'team', wert: 85 },
    );
    expect(daten.bewertungen[0].team.t1).toBe(5);
    expect(daten.bewertungen[0].gesetzt!.kategorie!.team!.prozent).toBe(85);
  });

  it('verdrängt einen gesetzten Wert nicht, wenn sich die Ebene darunter ändert (AK-4)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'gesetzt/abschnitt', abschnittId: 's1', teamId: 'team1', personId: 'p1', wert: 70 },
      { art: 'bewertung/individuell', abschnittId: 's1', teamId: 'team1', personId: 'p1', kriteriumId: 'i1', wert: 10 },
    );
    expect(daten.bewertungen[0].gesetzt!.abschnittsergebnis!.p1.prozent).toBe(70);
  });

  it('entfernt einen gesetzten Wert wieder (AK-6)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'gesetzt/kategorie', abschnittId: 's1', teamId: 'team1', kategorie: 'team', wert: 85 },
      { art: 'gesetzt/kategorie', abschnittId: 's1', teamId: 'team1', kategorie: 'team', wert: null },
    );
    // Ohne weiteren Inhalt verschwindet die Bewertung ganz.
    expect(daten.bewertungen).toHaveLength(0);
  });

  it('begrenzt gesetzte Werte auf 0 bis 100 Prozent', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'gesetzt/gesamt', stichtagId: null, personId: 'p1', wert: 140 },
      { art: 'gesetzt/gesamt', stichtagId: null, personId: 'p2', wert: -20 },
    );
    const stand = daten.gesamtstand['gesamter-durchgang'];
    expect(stand.p1.prozent).toBe(100);
    expect(stand.p2.prozent).toBe(0);
  });

  it('führt gesetzte Gesamtstände je Stichtag getrennt (FA-49 AK-5)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'stichtag/vorlage', startjahr: 2026 },
      { art: 'gesetzt/gesamt', stichtagId: 'stichtag-semester', personId: 'p1', wert: 62 },
      { art: 'gesetzt/gesamt', stichtagId: 'stichtag-jahr', personId: 'p1', wert: 78 },
    );
    expect(daten.gesamtstand['stichtag-semester'].p1.prozent).toBe(62);
    expect(daten.gesamtstand['stichtag-jahr'].p1.prozent).toBe(78);
  });

  it('nimmt gesetzte Werte mit, wenn die Person gelöscht wird', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'gesetzt/abschnitt', abschnittId: 's1', teamId: 'team1', personId: 'p1', wert: 70 },
      { art: 'gesetzt/gesamt', stichtagId: null, personId: 'p1', wert: 70 },
      { art: 'notenstand', stichtagId: null, personId: 'p1', note: 3 },
      { art: 'person/loeschen', id: 'p1' },
    );
    expect(daten.bewertungen).toHaveLength(0);
    expect(daten.gesamtstand['gesamter-durchgang']?.p1).toBeUndefined();
    expect(daten.notenstaende['gesamter-durchgang']?.p1).toBeUndefined();
  });
});

describe('Notenstand (FA-49)', () => {
  it('trägt eine Note ohne jeden Gesamtstand ein (AK-2)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'notenstand',
      stichtagId: null,
      personId: 'p1',
      note: 2,
      begruendung: 'Verlauf steigend, Einbruch war Krankheit',
    });
    const stand = daten.notenstaende['gesamter-durchgang'].p1;
    expect(stand.note).toBe(2);
    expect(stand.begruendung).toContain('Krankheit');
    expect(daten.gesamtstand).toEqual({});
  });

  it('behält die Begründung, wenn nur die Note geändert wird (AK-4)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'notenstand', stichtagId: null, personId: 'p1', note: 3, begruendung: 'wie besprochen' },
      { art: 'notenstand', stichtagId: null, personId: 'p1', note: 2 },
    );
    expect(daten.notenstaende['gesamter-durchgang'].p1.begruendung).toBe('wie besprochen');
  });

  it('entfernt den Notenstand wieder', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'notenstand', stichtagId: null, personId: 'p1', note: 3 },
      { art: 'notenstand', stichtagId: null, personId: 'p1', note: null },
    );
    expect(daten.notenstaende).toEqual({});
  });

  it('ist die einzige personenbezogene Note im Bestand (AK-1, G8)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 9 },
      { art: 'gesetzt/gesamt', stichtagId: null, personId: 'p1', wert: 88 },
      { art: 'notenstand', stichtagId: null, personId: 'p1', note: 2 },
    );
    // Der Notenschlüssel führt Noten als **Einstellung** – das ist etwas
    // anderes als die Note einer Person. Geprüft wird deshalb, dass an keiner
    // personenbezogenen Stelle eine Note steht.
    expect(JSON.stringify(daten.bewertungen)).not.toContain('"note"');
    expect(JSON.stringify(daten.gesamtstand)).not.toContain('"note"');
    expect(JSON.stringify(daten.personen)).not.toContain('"note"');
    expect(Object.keys(daten.notenstaende['gesamter-durchgang'])).toEqual(['p1']);
  });
});

describe('Rückmeldung an die Person (FA-42)', () => {
  it('hält Stärken und Entwicklungsfelder getrennt von der Notiz (FA-17)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/individuellNotiz', abschnittId: 's1', teamId: 'team1', personId: 'p1', notiz: 'intern' },
      {
        art: 'bewertung/rueckmeldung',
        abschnittId: 's1',
        teamId: 'team1',
        personId: 'p1',
        staerken: 'Schnittstelle sauber',
        entwicklung: 'Tests früher',
      },
    );
    const eintrag = daten.bewertungen[0].individuell.p1;
    expect(eintrag.notiz).toBe('intern');
    expect(eintrag.rueckmeldung!.staerken).toBe('Schnittstelle sauber');
    expect(eintrag.rueckmeldung!.entwicklung).toBe('Tests früher');
  });

  it('gilt als nicht erteilt, solange beide Felder leer sind (AK-4)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/rueckmeldung',
      abschnittId: 's1',
      teamId: 'team1',
      personId: 'p1',
      staerken: '  ',
      entwicklung: '',
    });
    expect(daten.bewertungen).toHaveLength(0);
  });

  it('lässt sich zurücknehmen, ohne die Notiz mitzunehmen', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/individuellNotiz', abschnittId: 's1', teamId: 'team1', personId: 'p1', notiz: 'intern' },
      { art: 'bewertung/rueckmeldung', abschnittId: 's1', teamId: 'team1', personId: 'p1', staerken: 'gut', entwicklung: '' },
      { art: 'bewertung/rueckmeldung', abschnittId: 's1', teamId: 'team1', personId: 'p1', staerken: '', entwicklung: '' },
    );
    expect(daten.bewertungen[0].individuell.p1.rueckmeldung).toBeUndefined();
    expect(daten.bewertungen[0].individuell.p1.notiz).toBe('intern');
  });

  it('nennt die Personen, für die sie noch aussteht (AK-4)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/rueckmeldung',
      abschnittId: 's1',
      teamId: 'team1',
      personId: 'p1',
      staerken: 'gut',
      entwicklung: '',
    });
    const offen = rueckmeldungOffen(daten, 's1', bewertungsIndex(daten));
    expect(offen.map((p) => p.id)).toEqual(['p2']);
  });

  it('zählt niemanden ohne Teamzuordnung zu den offenen', () => {
    const daten = anwenden(grundbestand(), {
      art: 'zugehoerigkeit/setzen',
      abschnittId: 's1',
      personId: 'p2',
      teamId: null,
    });
    expect(rueckmeldungOffen(daten, 's1', bewertungsIndex(daten)).map((p) => p.id)).toEqual(['p1']);
  });
});

describe('Verstehensnachweis und Reflexion (FA-40, FA-41)', () => {
  it('hält Stufe und Notiz fest und friert die Rubrik ein (FA-40, FA-65)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/verstehen',
      abschnittId: 's1',
      teamId: 'team1',
      personId: 'p1',
      stufe: 'ueberwiegend',
      notiz: 'Konnte die Abfrage erklären, bei der Transaktion unsicher',
    });
    const nachweis = daten.bewertungen[0].individuell.p1.verstehen!;
    expect(nachweis.stufe).toBe('ueberwiegend');
    expect(nachweis.notiz).toContain('Transaktion');
    // Er geht in die Rechnung ein, also gelten ab jetzt die eingefrorenen
    // Kriterien – seit Schemastand 3 die des Teams.
    expect(planungVon(daten, 's1', 'team1')?.rubrikKopie).toBeDefined();
  });

  it('behält die Notiz, wenn nur die Stufe geändert wird', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/verstehen', abschnittId: 's1', teamId: 'team1', personId: 'p1', stufe: 'teilweise', notiz: 'nachgefragt' },
      { art: 'bewertung/verstehen', abschnittId: 's1', teamId: 'team1', personId: 'p1', stufe: 'sicher' },
    );
    expect(daten.bewertungen[0].individuell.p1.verstehen!.notiz).toBe('nachgefragt');
  });

  it('lässt sich wieder entfernen', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/verstehen', abschnittId: 's1', teamId: 'team1', personId: 'p1', stufe: 'sicher' },
      { art: 'bewertung/verstehen', abschnittId: 's1', teamId: 'team1', personId: 'p1', stufe: null },
    );
    expect(daten.bewertungen).toHaveLength(0);
  });

  it('hält die Reflexion der Person fest und rechnet nicht damit (FA-41 AK-1, AK-3)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/reflexion',
      abschnittId: 's1',
      teamId: 'team1',
      personId: 'p1',
      text: 'Habe die Schnittstelle gebaut und gelernt, früher zu fragen.',
    });
    expect(daten.bewertungen[0].individuell.p1.reflexion).toContain('früher zu fragen');
    // Keine Rubrik eingefroren – die Reflexion ist keine Bewertung.
    expect(daten.abschnitte[0].rubrikKopie).toBeUndefined();
  });

  it('entfernt eine geleerte Reflexion', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/reflexion', abschnittId: 's1', teamId: 'team1', personId: 'p1', text: 'etwas' },
      { art: 'bewertung/reflexion', abschnittId: 's1', teamId: 'team1', personId: 'p1', text: '  ' },
    );
    expect(daten.bewertungen).toHaveLength(0);
  });

  it('begrenzt den Anteil des Verstehensnachweises auf 0 bis 100 (FA-40 AK-2)', () => {
    expect(anwenden(leererDatenbestand(), { art: 'verstehensAnteil', wert: 140 }).verstehensAnteil).toBe(100);
    expect(anwenden(leererDatenbestand(), { art: 'verstehensAnteil', wert: -1 }).verstehensAnteil).toBe(0);
  });
});

describe('Rubrik angleichen (FA-47)', () => {
  function mitEingefrorenem(): Datenbestand {
    return anwenden(grundbestand(), {
      art: 'bewertung/punkte',
      abschnittId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      kriteriumId: 't1',
      wert: 8,
    });
  }

  it('überträgt die aktuelle Rubrik auf bewertete Abschnitte und hält den Zeitpunkt fest (AK-4)', () => {
    const daten = anwenden(
      mitEingefrorenem(),
      { art: 'rubrik/kriteriumAendern', rubrikId: RUBRIK_SPRINT, kategorie: 'team', index: 0, aenderung: { name: 'Funktionsumfang' } },
      { art: 'abschnitt/angleichen', rubrikId: RUBRIK_SPRINT },
    );
    const planung = planungVon(daten, 's1', 'team1')!;
    expect(planung.rubrikKopie!.team[0].name).toBe('Funktionsumfang');
    expect(planung.angeglichenAm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // Der Zeitpunkt des Einfrierens bleibt daneben stehen.
    expect(planung.eingefrorenAm).toBeDefined();
  });

  it('geschieht nie als Nebenwirkung einer Rubrikänderung (AK-1)', () => {
    const daten = anwenden(mitEingefrorenem(), {
      art: 'rubrik/kriteriumAendern',
      rubrikId: RUBRIK_SPRINT,
      kategorie: 'team',
      index: 0,
      aenderung: { name: 'Funktionsumfang' },
    });
    expect(planungVon(daten, 's1', 'team1')!.rubrikKopie!.team[0].name).toBe('Funktionalität');
    expect(planungVon(daten, 's1', 'team1')!.angeglichenAm).toBeUndefined();
  });

  it('rührt Abschnitte anderer Rubriken nicht an', () => {
    const daten = anwenden(
      mitEingefrorenem(),
      { art: 'rubrik/anlegen', rubrik: testRubrik('r2', 'Andere') },
      { art: 'abschnitt/angleichen', rubrikId: 'r2' },
    );
    expect(planungVon(daten, 's1', 'team1')!.angeglichenAm).toBeUndefined();
  });

  it('rührt Abschnitte ohne eingefrorene Kopie nicht an', () => {
    const daten = anwenden(grundbestand(), { art: 'abschnitt/angleichen', rubrikId: RUBRIK_SPRINT });
    expect(daten.abschnitte[0].rubrikKopie).toBeUndefined();
    expect(daten.abschnitte[0].angeglichenAm).toBeUndefined();
  });
});

describe('Sprintplanung je Team (FA-66)', () => {
  it('legt Ziel, Beginn und Ende je Team an (AK-1)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'planung/festhalten',
      abschnittId: 's1',
      teamId: 'team1',
      ziel: 'Kursbuchung mit Warteliste',
      von: '2026-10-06',
      bis: '2026-10-31',
    });
    const planung = planungVon(daten, 's1', 'team1')!;
    expect(planung.ziel).toBe('Kursbuchung mit Warteliste');
    expect(planung.von).toBe('2026-10-06');
    expect(planung.bis).toBe('2026-10-31');
    expect(planung.geplantAm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('lässt sich anlegen, bevor ein Punkt erfasst ist (AK-2)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'planung/festhalten',
      abschnittId: 's1',
      teamId: 'team1',
    });
    expect(daten.bewertungen).toHaveLength(0);
    expect(planungVon(daten, 's1', 'team1')?.rubrikKopie).toBeDefined();
  });

  it('übernimmt den Rahmen des Abschnitts, wenn nichts angegeben ist (AK-3)', () => {
    const start = anwenden(grundbestand(), {
      art: 'abschnitt/aendern',
      id: 's1',
      aenderung: { von: '2026-10-06', bis: '2026-10-24' },
    });
    const daten = anwenden(start, {
      art: 'planung/festhalten',
      abschnittId: 's1',
      teamId: 'team1',
    });
    expect(planungVon(daten, 's1', 'team1')?.bis).toBe('2026-10-24');
  });

  it('wird für einen Test nicht angelegt – dort gilt der Zeitpunkt für alle (AK-6)', () => {
    const daten = anwenden(
      grundbestand(),
      {
        art: 'abschnitt/anlegen',
        abschnitt: abschnitt({ id: 'x1', nummer: 2, name: 'Test 1', art: 'test', strang: 'theorie', rubrikId: 'rubrik-test-1' }),
        rubrik: testRubrik('rubrik-test-1', 'Test 1'),
      },
      { art: 'planung/festhalten', abschnittId: 'x1', teamId: 'team1' },
    );
    expect(daten.teamabschnitte.some((tp) => tp.abschnittId === 'x1')).toBe(false);
  });

  it('räumt Planungen mit dem Abschnitt und mit dem Team weg', () => {
    const mitPlanung = anwenden(grundbestand(), {
      art: 'planung/festhalten',
      abschnittId: 's1',
      teamId: 'team1',
    });
    expect(anwenden(mitPlanung, { art: 'abschnitt/loeschen', id: 's1' }).teamabschnitte).toHaveLength(0);
    expect(anwenden(mitPlanung, { art: 'team/loeschen', id: 'team1' }).teamabschnitte).toHaveLength(0);
  });
});

describe('Kriterien je Team (FA-67)', () => {
  function geplant(): Datenbestand {
    return anwenden(grundbestand(), {
      art: 'planung/festhalten',
      abschnittId: 's1',
      teamId: 'team1',
    });
  }

  it('streicht ein Kriterium nur für dieses Team (AK-2)', () => {
    const daten = anwenden(geplant(), {
      art: 'planung/kriteriumLoeschen',
      abschnittId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      index: 0,
    });
    const kopie = planungVon(daten, 's1', 'team1')!.rubrikKopie!;
    expect(kopie.team.map((k) => k.id)).not.toContain('t1');
    // Die Rubrik selbst bleibt unberührt.
    expect(daten.rubriken.find((r) => r.id === RUBRIK_SPRINT)!.team[0].id).toBe('t1');
  });

  it('ergänzt ein Kriterium und hält die Änderung als Herkunft fest (AK-9)', () => {
    const daten = anwenden(geplant(), {
      art: 'planung/kriteriumHinzufuegen',
      abschnittId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      kriterium: { id: 'eigen1', name: 'Migrationsskript', beschreibung: '', max: 5 },
    });
    const planung = planungVon(daten, 's1', 'team1')!;
    expect(planung.rubrikKopie!.team.map((k) => k.id)).toContain('eigen1');
    expect(planung.herkunft?.art).toBe('geaendert');
  });

  it('lässt die Kriterien nach dem ersten Punkt nicht mehr ändern (AK-4)', () => {
    const daten = anwenden(
      geplant(),
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 8 },
      { art: 'planung/kriteriumLoeschen', abschnittId: 's1', teamId: 'team1', kategorie: 'team', index: 0 },
    );
    expect(planungVon(daten, 's1', 'team1')!.rubrikKopie!.team[0].id).toBe('t1');
  });

  it('schreibt die Kriterien des vorigen Sprints fort, nicht die Rubrik (AK-7)', () => {
    const daten = anwenden(
      geplant(),
      { art: 'planung/kriteriumLoeschen', abschnittId: 's1', teamId: 'team1', kategorie: 'team', index: 0 },
      { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's2', nummer: 2, name: 'Sprint 2' }) },
      { art: 'planung/festhalten', abschnittId: 's2', teamId: 'team1' },
    );
    const zweiter = planungVon(daten, 's2', 'team1')!;
    expect(zweiter.rubrikKopie!.team.map((k) => k.id)).not.toContain('t1');
    expect(zweiter.herkunft).toEqual({ art: 'uebernommen', ausAbschnittId: 's1' });
  });

  it('nimmt für den ersten Sprint eine Vorlage, nicht die Kette (AK-8)', () => {
    const daten = geplant();
    expect(planungVon(daten, 's1', 'team1')!.herkunft).toEqual({
      art: 'vorlage',
      rubrikId: RUBRIK_SPRINT,
    });
  });

  it('beginnt den ganzen Satz aus einer Vorlage neu (AK-10)', () => {
    const daten = anwenden(
      geplant(),
      { art: 'planung/kriteriumLoeschen', abschnittId: 's1', teamId: 'team1', kategorie: 'team', index: 0 },
      { art: 'planung/ausVorlage', abschnittId: 's1', teamId: 'team1', rubrikId: RUBRIK_SPRINT },
    );
    const planung = planungVon(daten, 's1', 'team1')!;
    expect(planung.rubrikKopie!.team.map((k) => k.id)).toContain('t1');
    expect(planung.herkunft).toEqual({ art: 'vorlage', rubrikId: RUBRIK_SPRINT });
  });

  it('rechnet danach mit dem Satz des Teams (AK-1)', () => {
    const daten = anwenden(
      geplant(),
      { art: 'planung/kriteriumLoeschen', abschnittId: 's1', teamId: 'team1', kategorie: 'team', index: 0 },
    );
    expect(rubrikFuer(daten, daten.abschnitte[0], 'team1').team.map((k) => k.id)).not.toContain('t1');
    expect(rubrikFuer(daten, daten.abschnitte[0], null).team.map((k) => k.id)).toContain('t1');
  });
});
