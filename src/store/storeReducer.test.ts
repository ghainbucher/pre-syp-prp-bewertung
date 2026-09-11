import { describe, expect, it } from 'vitest';

import { RUBRIK_SPRINT, leererDatenbestand, testRubrik } from '../domain/defaults';
import { rubrikVon, rueckmeldungOffen, teamIn } from '../domain/zuordnung';
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
