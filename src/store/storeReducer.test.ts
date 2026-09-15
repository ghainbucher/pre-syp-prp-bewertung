import { describe, expect, it } from 'vitest';

import {
  RUBRIK_DIPLOMARBEIT,
  RUBRIK_SPRINT,
  VORLAGE_RUBRIK_DIPLOMARBEIT,
  VORLAGE_RUBRIK_SPRINT,
  leererDatenbestand,
  testRubrik,
} from '../domain/defaults';
import {
  abschnittIstLeer,
  abschnitteVon,
  abschnittsinhalt,
  kennungDoppelt,
  massnahmenZurNachschau,
  kriterienVorrat,
  paralleleProjekte,
  planungVon,
  sprintZustand,
  rubrikFuer,
  rueckmeldungOffen,
  teamIn,
  zuordnungBrauchtBestaetigung,
} from '../domain/zuordnung';
import type { Abschnitt, Datenbestand } from '../domain/types';
import { nurAktive } from '../domain/loeschen';
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
    expect(daten.mitgliedschaften).toHaveLength(0);
  });

  it('entfernt eine Klasse ohne Bewertungen endgültig (FA-94)', () => {
    const daten = anwenden(grundbestand(), { art: 'klasse/loeschen', id: 'k1' });
    expect(daten).toEqual(leererDatenbestand());
  });

  it('behält eine Klasse, an der Bewertungen hängen, und blendet sie nur aus (FA-94, G7)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 5 },
      { art: 'klasse/loeschen', id: 'k1' },
    );
    expect(Boolean(daten.klassen[0].geloeschtAm)).toBe(true);
    // Nichts darunter wird angefasst: Die Begründung der Note bleibt lesbar.
    expect(daten.personen).toHaveLength(2);
    expect(daten.abschnitte).toHaveLength(1);
    expect(daten.bewertungen).toHaveLength(1);
    // Aus den Auswahllisten ist sie trotzdem verschwunden.
    expect(nurAktive(daten.klassen)).toHaveLength(0);
  });

  it('macht ein logisches Löschen rückgängig (FA-94)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 5 },
      { art: 'klasse/loeschen', id: 'k1' },
      { art: 'stammdaten/wiederherstellen', was: 'klasse', id: 'k1' },
    );
    expect(daten.klassen[0].geloeschtAm).toBeUndefined();
    expect(nurAktive(daten.klassen)).toHaveLength(1);
  });

  it('entfernt eine Person ohne Bewertungen endgültig (FA-94)', () => {
    const daten = anwenden(grundbestand(), { art: 'person/loeschen', id: 'p1' });
    expect(daten.personen).toHaveLength(1);
    expect(daten.mitgliedschaften.some((m) => m.personId === 'p1')).toBe(false);
  });

  it('behält eine bewertete Person samt ihren Punkten (FA-94, G7)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'bewertung/individuell', abschnittId: 's1', teamId: 'team1', personId: 'p1', kriteriumId: 'i1', wert: 8 },
      { art: 'bewertung/peer', abschnittId: 's1', teamId: 'team1', bewerterId: 'p2', bewerteterId: 'p1', kriteriumId: 'q1', wert: 4 },
      { art: 'person/loeschen', id: 'p1' },
    );
    expect(daten.personen).toHaveLength(2);
    expect(Boolean(daten.personen.find((p) => p.id === 'p1')?.geloeschtAm)).toBe(true);
    expect(daten.bewertungen[0].individuell.p1.punkte).toEqual({ i1: 8 });
    expect(nurAktive(daten.personen).map((p) => p.id)).toEqual(['p2']);
  });
});

/*
 * Was früher der Durchstich „führt die Diplomarbeit als Projekt eines Typs"
 * geprüft hat, steht seit der Straffung der Teststrategie hier: Die
 * Entscheidung, ob nachgefragt werden muss, ist eine Frage an den Datenbestand
 * und keine an den Browser (Solution-Design 8.1).
 */
describe('Überschneidung zwischen Projekten (FA-87 AK-5)', () => {
  function zweiProjekte(): Datenbestand {
    return anwenden(grundbestand(), {
      art: 'team/anlegen',
      id: 'team2',
      klasseId: 'k1',
      name: 'Energiemonitor',
    });
  }

  it('fragt beim ersten Projekt nicht nach', () => {
    const daten = zweiProjekte();
    expect(paralleleProjekte(daten, 'team1', 'p1')).toEqual([]);
    expect(zuordnungBrauchtBestaetigung(daten, 'team1', 'p1')).toBe(false);
  });

  it('nennt beim zweiten Projekt, wo der Schüler schon ist', () => {
    const daten = zweiProjekte();
    expect(zuordnungBrauchtBestaetigung(daten, 'team2', 'p1')).toBe(true);
    expect(paralleleProjekte(daten, 'team2', 'p1').map((t) => t.name)).toEqual(['Team Kepler']);
  });

  it('schreibt die Zuordnung erst mit der Bestätigung, und mit Datum', () => {
    const daten = anwenden(zweiProjekte(), {
      art: 'mitgliedschaft/setzen',
      projektId: 'team2',
      personId: 'p1',
      dabei: true,
      bestaetigtAm: '2026-09-14T10:00:00.000Z',
    });
    const eintrag = daten.mitgliedschaften.find(
      (m) => m.projektId === 'team2' && m.personId === 'p1',
    );
    expect(eintrag?.ueberschneidungBestaetigtAm).toBe('2026-09-14T10:00:00.000Z');
    // Und danach ist es keine Überraschung mehr, sondern eine Auskunft.
    expect(paralleleProjekte(daten, 'team1', 'p1').map((t) => t.name)).toEqual(['Energiemonitor']);
  });

  it('zählt ein ausgeblendetes Projekt nicht mit (FA-94)', () => {
    const daten = anwenden(zweiProjekte(), { art: 'team/loeschen', id: 'team1' });
    expect(zuordnungBrauchtBestaetigung(daten, 'team2', 'p1')).toBe(false);
  });
});

/*
 * Vorher der Durchstich „meldet eine zweimal vergebene GitHub-Kennung". Die
 * Prüfung selbst stand in der Ansicht; sie steht jetzt in der Domäne und wird
 * hier geprüft (NFA-06).
 */
describe('Doppelt vergebene GitHub-Kennung (FA-88 AK-4)', () => {
  function mitKennungen(erste: string, zweite: string): Datenbestand {
    return anwenden(
      grundbestand(),
      { art: 'person/stammdaten', id: 'p1', githubKennung: erste },
      { art: 'person/stammdaten', id: 'p2', githubKennung: zweite },
    );
  }

  it('findet die Dopplung von beiden Seiten', () => {
    const daten = mitKennungen('lberger', 'lberger');
    // Beide Zeilen sagen es: In welcher der Fehler steckt, weiß die Anwendung
    // nicht.
    expect(kennungDoppelt(daten, 'p1', 'lberger')?.name).toBe('Steiner Jonas');
    expect(kennungDoppelt(daten, 'p2', 'lberger')?.name).toBe('Berger Lena');
  });

  it('unterscheidet nicht nach Groß- und Kleinschreibung', () => {
    const daten = mitKennungen('LBerger', ' lberger ');
    expect(kennungDoppelt(daten, 'p1', 'LBerger')?.id).toBe('p2');
  });

  it('meldet verschiedene Kennungen nicht', () => {
    const daten = mitKennungen('lberger', 'jsteiner');
    expect(kennungDoppelt(daten, 'p1', 'lberger')).toBeNull();
    expect(kennungDoppelt(daten, 'p2', 'jsteiner')).toBeNull();
  });

  it('ist bei einer leeren Kennung keine Dopplung', () => {
    // Noch nicht erfasst ist nicht dasselbe wie zweimal vergeben.
    const daten = mitKennungen('', '');
    expect(kennungDoppelt(daten, 'p1', '')).toBeNull();
  });

  it('zählt einen ausgeblendeten Schüler nicht mit (FA-94)', () => {
    const daten = anwenden(
      mitKennungen('lberger', 'lberger'),
      {
        art: 'bewertung/individuell',
        abschnittId: 's1',
        teamId: 'team1',
        personId: 'p2',
        kriteriumId: 'i1',
        wert: 4,
      },
      { art: 'person/loeschen', id: 'p2' },
    );
    expect(Boolean(daten.personen.find((p) => p.id === 'p2')?.geloeschtAm)).toBe(true);
    expect(kennungDoppelt(daten, 'p1', 'lberger')).toBeNull();
  });
});

describe('Geplante und umgesetzte Anforderungen (FA-96)', () => {
  function geplant(): Datenbestand {
    return anwenden(grundbestand(), {
      art: 'planung/festhalten',
      abschnittId: 's1',
      teamId: 'team1',
      ziel: 'Buchungsmodul',
    });
  }

  it('hält den Plantext an der Planung des Teams, nicht am Abschnitt', () => {
    // Zwei Teams planen denselben Sprint verschieden (Fachkonzept 15.1: Der
    // Sprint hängt am Projekt).
    const daten = anwenden(
      geplant(),
      { art: 'team/anlegen', id: 'team2', klasseId: 'k1', name: 'Team Galilei' },
      { art: 'planung/festhalten', abschnittId: 's1', teamId: 'team2' },
      {
        art: 'planung/aendern',
        abschnittId: 's1',
        teamId: 'team1',
        aenderung: { geplanteAnforderungen: 'Storno einer Buchung\nÜbersicht je Kunde' },
      },
    );
    expect(planungVon(daten, 's1', 'team1')?.geplanteAnforderungen).toBe(
      'Storno einer Buchung\nÜbersicht je Kunde',
    );
    expect(planungVon(daten, 's1', 'team2')?.geplanteAnforderungen).toBeUndefined();
  });

  it('hält den Ist-Text getrennt vom Plantext', () => {
    // Beide bleiben nebeneinander lesbar – der Vergleich ist der Zweck.
    const daten = anwenden(
      geplant(),
      {
        art: 'planung/aendern',
        abschnittId: 's1',
        teamId: 'team1',
        aenderung: { geplanteAnforderungen: 'Storno einer Buchung' },
      },
      {
        art: 'planung/aendern',
        abschnittId: 's1',
        teamId: 'team1',
        aenderung: { umgesetzteAnforderungen: 'Storno einer Buchung (ohne Stornogrund)' },
      },
    );
    const planung = planungVon(daten, 's1', 'team1');
    expect(planung?.geplanteAnforderungen).toBe('Storno einer Buchung');
    expect(planung?.umgesetzteAnforderungen).toBe('Storno einer Buchung (ohne Stornogrund)');
  });

  it('lässt sich leeren, ohne den anderen Text anzurühren', () => {
    const daten = anwenden(
      geplant(),
      {
        art: 'planung/aendern',
        abschnittId: 's1',
        teamId: 'team1',
        aenderung: { geplanteAnforderungen: 'A', umgesetzteAnforderungen: 'B' },
      },
      {
        art: 'planung/aendern',
        abschnittId: 's1',
        teamId: 'team1',
        aenderung: { umgesetzteAnforderungen: '' },
      },
    );
    expect(planungVon(daten, 's1', 'team1')?.geplanteAnforderungen).toBe('A');
    expect(planungVon(daten, 's1', 'team1')?.umgesetzteAnforderungen).toBe('');
  });

  it('geht in keine Rechnung ein (G9)', () => {
    // Der Text ist eine Aufzeichnung, kein Maßstab: Er darf das Ergebnis eines
    // Sprints nicht verändern.
    const mitPunkten = anwenden(geplant(), {
      art: 'bewertung/punkte',
      abschnittId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      kriteriumId: 't1',
      wert: 7,
    });
    const vorher = JSON.stringify(mitPunkten.bewertungen);
    const nachher = anwenden(mitPunkten, {
      art: 'planung/aendern',
      abschnittId: 's1',
      teamId: 'team1',
      aenderung: { umgesetzteAnforderungen: 'alles offen geblieben' },
    });
    expect(JSON.stringify(nachher.bewertungen)).toBe(vorher);
  });
});

describe('Mitgliedschaft im Projekt (FA-87, Fachkonzept 15.2 A8)', () => {
  it('gilt für alle Abschnitte des Projekts, nicht je Abschnitt', () => {
    const daten = anwenden(grundbestand(), {
      art: 'abschnitt/anlegen',
      abschnitt: abschnitt({ id: 's2', nummer: 2, name: 'Sprint 2' }),
    });
    expect(teamIn(daten, 's1', 'p1')).toBe('team1');
    expect(teamIn(daten, 's2', 'p1')).toBe('team1');
  });

  it('lässt einen Schüler in zwei Projekten zugleich zu (AK-5)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'team/anlegen', id: 'team2', klasseId: 'k1', name: 'Team Galilei' },
      {
        art: 'mitgliedschaft/setzen',
        projektId: 'team2',
        personId: 'p1',
        dabei: true,
        bestaetigtAm: '2026-09-14T10:00:00.000Z',
      },
    );
    expect(daten.mitgliedschaften.filter((m) => m.personId === 'p1')).toHaveLength(2);
    expect(
      daten.mitgliedschaften.find((m) => m.personId === 'p1' && m.projektId === 'team2')
        ?.ueberschneidungBestaetigtAm,
    ).toBe('2026-09-14T10:00:00.000Z');
  });

  it('trägt eine Mitgliedschaft nicht doppelt ein', () => {
    const daten = anwenden(grundbestand(), {
      art: 'mitgliedschaft/setzen',
      projektId: 'team1',
      personId: 'p1',
      dabei: true,
    });
    expect(daten.mitgliedschaften.filter((m) => m.personId === 'p1')).toHaveLength(1);
  });

  it('entfernt eine Mitgliedschaft wieder', () => {
    const daten = anwenden(grundbestand(), {
      art: 'mitgliedschaft/setzen',
      projektId: 'team1',
      personId: 'p2',
      dabei: false,
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
    expect(daten.abschnitte.find((a) => a.id === 'x1')?.art).toBe('test');
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

  it('entfernt die Entscheidung mit einem unbewerteten Abschnitt (FA-94)', () => {
    // s2 trägt keine Punkte – s1 schon, der ginge nur logisch.
    const daten = anwenden(
      zweiSprints(),
      { art: 'peer/entscheidung', abschnittId: 's2', antwort: 'nein' },
      { art: 'abschnitt/loeschen', id: 's2' },
    );
    expect(daten.peerEntscheidungen).toEqual([]);
    expect(daten.abschnitte.some((a) => a.id === 's2')).toBe(false);
  });

  it('behält Abschnitt und Entscheidung, sobald Punkte erfasst sind (FA-94, G7)', () => {
    const daten = anwenden(
      zweiSprints(),
      { art: 'peer/entscheidung', abschnittId: 's1', antwort: 'nein' },
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 5 },
      { art: 'abschnitt/loeschen', id: 's1' },
    );
    expect(Boolean(daten.abschnitte.find((a) => a.id === 's1')?.geloeschtAm)).toBe(true);
    expect(daten.peerEntscheidungen).toHaveLength(1);
    expect(abschnitteVon(daten, 'k1').some((a) => a.id === 's1')).toBe(false);
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

  it('behält gesetzte Werte, wenn die Person gelöscht wird (FA-94, G7)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'gesetzt/abschnitt', abschnittId: 's1', teamId: 'team1', personId: 'p1', wert: 70 },
      { art: 'gesetzt/gesamt', stichtagId: null, personId: 'p1', wert: 70 },
      { art: 'notenstand', stichtagId: null, personId: 'p1', note: 3 },
      { art: 'person/loeschen', id: 'p1' },
    );
    // Ein gesetzter Wert ist eine Entscheidung der Lehrkraft. Sie mit dem
    // Namen zu löschen hieße, ein Zeugnis ohne Begründung zurückzulassen.
    expect(Boolean(daten.personen.find((p) => p.id === 'p1')?.geloeschtAm)).toBe(true);
    expect(daten.gesamtstand['gesamter-durchgang']?.p1?.prozent).toBe(70);
    expect(daten.notenstaende['gesamter-durchgang']?.p1?.note).toBe(3);
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

  it('zählt niemanden ohne Projektzuordnung zu den offenen', () => {
    const daten = anwenden(grundbestand(), {
      art: 'mitgliedschaft/setzen',
      projektId: 'team1',
      personId: 'p2',
      dabei: false,
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

  it('behält eine festgehaltene Planung beim Löschen (FA-94, G7)', () => {
    const mitPlanung = anwenden(grundbestand(), {
      art: 'planung/festhalten',
      abschnittId: 's1',
      teamId: 'team1',
    });
    // Eine festgehaltene Planung trägt die eingefrorenen Kriterien – sie
    // belegt, wonach beurteilt werden sollte, und bleibt deshalb stehen.
    const ohneAbschnitt = anwenden(mitPlanung, { art: 'abschnitt/loeschen', id: 's1' });
    expect(ohneAbschnitt.teamabschnitte).toHaveLength(1);
    expect(Boolean(ohneAbschnitt.abschnitte.find((a) => a.id === 's1')?.geloeschtAm)).toBe(true);

    const ohneTeam = anwenden(mitPlanung, { art: 'team/loeschen', id: 'team1' });
    expect(ohneTeam.teamabschnitte).toHaveLength(1);
    expect(Boolean(ohneTeam.teams[0].geloeschtAm)).toBe(true);
  });

  it('räumt eine Planung ohne Kriterien mit dem Abschnitt weg (FA-94)', () => {
    const ohnePlanung = anwenden(grundbestand(), { art: 'abschnitt/loeschen', id: 's1' });
    expect(ohnePlanung.abschnitte).toHaveLength(0);
    expect(ohnePlanung.teamabschnitte).toHaveLength(0);
  });
});

describe('Sprintwert je Team (FA-82)', () => {
  it('setzt den Wert mit Begründung und nimmt ihn zurück (AK-1, AK-6)', () => {
    const gesetzt = anwenden(grundbestand(), {
      art: 'gesetzt/sprintwert',
      abschnittId: 's1',
      teamId: 'team1',
      wert: 82,
      begruendung: 'Ziel erreicht',
    });
    const wert = gesetzt.bewertungen[0].gesetzt?.sprintwert;
    expect(wert?.prozent).toBe(82);
    expect(wert?.begruendung).toBe('Ziel erreicht');
    expect(wert?.gesetztAm).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const zurueck = anwenden(gesetzt, {
      art: 'gesetzt/sprintwert',
      abschnittId: 's1',
      teamId: 'team1',
      wert: null,
    });
    // Ohne gesetzten Wert gibt es keinen – und die leere Bewertung verschwindet.
    expect(zurueck.bewertungen).toHaveLength(0);
  });

  it('lässt die Rechnung darunter unberührt (AK-1, G9)', () => {
    const daten = anwenden(
      grundbestand(),
      {
        art: 'bewertung/punkte',
        abschnittId: 's1',
        teamId: 'team1',
        kategorie: 'team',
        kriteriumId: 't1',
        wert: 7,
      },
      { art: 'gesetzt/sprintwert', abschnittId: 's1', teamId: 'team1', wert: 50 },
    );
    expect(daten.bewertungen[0].team.t1).toBe(7);
    expect(daten.bewertungen[0].gesetzt?.sprintwert?.prozent).toBe(50);
  });
});

describe('Spur je Person (FA-78)', () => {
  it('hält Bezeichnung und Verweis fest (AK-1)', () => {
    const daten = anwenden(grundbestand(), {
      art: 'bewertung/spur',
      abschnittId: 's1',
      teamId: 'team1',
      personId: 'p1',
      bezeichnung: 'PR #42, Storno-Validierung',
      verweis: 'https://example.invalid/pr/42',
    });
    const spur = daten.bewertungen[0].individuell.p1.spur;
    expect(spur?.bezeichnung).toBe('PR #42, Storno-Validierung');
    expect(spur?.verweis).toBe('https://example.invalid/pr/42');
  });

  it('behält den Verweis, wenn nur die Bezeichnung geändert wird', () => {
    const daten = anwenden(
      grundbestand(),
      {
        art: 'bewertung/spur',
        abschnittId: 's1',
        teamId: 'team1',
        personId: 'p1',
        bezeichnung: 'PR 42',
        verweis: 'https://example.invalid/pr/42',
      },
      {
        art: 'bewertung/spur',
        abschnittId: 's1',
        teamId: 'team1',
        personId: 'p1',
        bezeichnung: 'PR 42, Storno',
      },
    );
    expect(daten.bewertungen[0].individuell.p1.spur?.verweis).toBe(
      'https://example.invalid/pr/42',
    );
  });

  it('entfernt sie, wenn beides leer ist (AK-2)', () => {
    const daten = anwenden(
      grundbestand(),
      {
        art: 'bewertung/spur',
        abschnittId: 's1',
        teamId: 'team1',
        personId: 'p1',
        bezeichnung: 'PR 42',
      },
      {
        art: 'bewertung/spur',
        abschnittId: 's1',
        teamId: 'team1',
        personId: 'p1',
        bezeichnung: '   ',
        verweis: '',
      },
    );
    // Eine leere Spur zählte sonst als erfasst und fiele aus der Meldung.
    expect(daten.bewertungen).toHaveLength(0);
  });
});

describe('Maßnahmen aus der Retrospektive (FA-80)', () => {
  function geplant(): Datenbestand {
    return anwenden(
      grundbestand(),
      { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's2', nummer: 2, name: 'Sprint 2' }) },
      { art: 'planung/festhalten', abschnittId: 's1', teamId: 'team1' },
      { art: 'planung/festhalten', abschnittId: 's2', teamId: 'team1' },
    );
  }

  it('legt eine Maßnahme an und ändert sie (AK-1)', () => {
    const einmal = anwenden(geplant(), {
      art: 'planung/massnahme',
      abschnittId: 's1',
      teamId: 'team1',
      massnahmeId: 'm1',
      text: 'Jeden Tag ein kurzes Daily',
    });
    expect(planungVon(einmal, 's1', 'team1')?.massnahmen).toEqual([
      { id: 'm1', text: 'Jeden Tag ein kurzes Daily' },
    ]);

    const geaendert = anwenden(einmal, {
      art: 'planung/massnahme',
      abschnittId: 's1',
      teamId: 'team1',
      massnahmeId: 'm1',
      text: 'Daily am Anfang jeder Einheit',
    });
    expect(planungVon(geaendert, 's1', 'team1')?.massnahmen?.[0].text).toBe(
      'Daily am Anfang jeder Einheit',
    );
  });

  it('entfernt sie mit leerem Text', () => {
    const daten = anwenden(
      geplant(),
      { art: 'planung/massnahme', abschnittId: 's1', teamId: 'team1', massnahmeId: 'm1', text: 'X' },
      { art: 'planung/massnahme', abschnittId: 's1', teamId: 'team1', massnahmeId: 'm1', text: '  ' },
    );
    expect(planungVon(daten, 's1', 'team1')?.massnahmen).toBeUndefined();
  });

  it('stellt die Maßnahmen des vorigen Sprints zur Nachschau (AK-3)', () => {
    const daten = anwenden(geplant(), {
      art: 'planung/massnahme',
      abschnittId: 's1',
      teamId: 'team1',
      massnahmeId: 'm1',
      text: 'Jeden Tag ein kurzes Daily',
    });
    const s2 = daten.abschnitte.find((a) => a.id === 's2')!;
    const zurNachschau = massnahmenZurNachschau(daten, s2, 'team1');
    expect(zurNachschau?.herkunft.id).toBe('s1');
    expect(zurNachschau?.massnahmen.map((m) => m.id)).toEqual(['m1']);
    // Und andersherum nicht: Der erste Sprint hat keinen Vorgänger.
    const s1 = daten.abschnitte.find((a) => a.id === 's1')!;
    expect(massnahmenZurNachschau(daten, s1, 'team1')).toBeUndefined();
  });

  it('hält den Umsetzungsstand am Folgesprint (AK-4)', () => {
    const daten = anwenden(
      geplant(),
      { art: 'planung/massnahme', abschnittId: 's1', teamId: 'team1', massnahmeId: 'm1', text: 'X' },
      {
        art: 'planung/nachschau',
        abschnittId: 's2',
        teamId: 'team1',
        massnahmeId: 'm1',
        stand: 'teilweise',
        notiz: 'zweimal ausgefallen',
      },
    );
    expect(planungVon(daten, 's2', 'team1')?.nachschau?.m1).toEqual({
      stand: 'teilweise',
      notiz: 'zweimal ausgefallen',
    });
    // Am Sprint, in dem die Maßnahme entstand, steht keine Nachschau.
    expect(planungVon(daten, 's1', 'team1')?.nachschau).toBeUndefined();
  });

  it('räumt die Nachschau mit der Maßnahme weg', () => {
    const daten = anwenden(
      geplant(),
      { art: 'planung/massnahme', abschnittId: 's1', teamId: 'team1', massnahmeId: 'm1', text: 'X' },
      {
        art: 'planung/nachschau',
        abschnittId: 's2',
        teamId: 'team1',
        massnahmeId: 'm1',
        stand: 'ja',
      },
      { art: 'planung/massnahmeEntfernen', abschnittId: 's1', teamId: 'team1', massnahmeId: 'm1' },
    );
    // Ein Umsetzungsstand ohne Maßnahme wäre unsichtbar und stünde trotzdem
    // in der Sicherungsdatei.
    expect(planungVon(daten, 's2', 'team1')?.nachschau).toBeUndefined();
  });
});

describe('GitHub-Auswertung einlesen (FA-81)', () => {
  const auswertung = {
    standAm: '2026-10-18T10:00:00.000Z',
    von: '2026-10-03',
    bis: '2026-10-17',
    anteile: { anna: 60, bert: 40 },
    reviews: [{ von: 'anna', an: 'bert', anzahl: 2 }],
    prAnteil: 80,
    direktePushes: 3,
    jeTag: { '2026-10-06': 4 },
    nichtZugeordnet: [],
  };

  it('legt den Stand an der Planung ab (AK-1, AK-4)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'planung/festhalten', abschnittId: 's1', teamId: 'team1' },
      { art: 'planung/auswertungEinlesen', abschnittId: 's1', teamId: 'team1', auswertung },
    );
    expect(planungVon(daten, 's1', 'team1')?.auswertung?.prAnteil).toBe(80);
  });

  it('ersetzt einen früheren Stand vollständig (AK-4)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'planung/festhalten', abschnittId: 's1', teamId: 'team1' },
      { art: 'planung/auswertungEinlesen', abschnittId: 's1', teamId: 'team1', auswertung },
      {
        art: 'planung/auswertungEinlesen',
        abschnittId: 's1',
        teamId: 'team1',
        auswertung: { ...auswertung, anteile: { cem: 100 }, prAnteil: 10 },
      },
    );
    const gespeichert = planungVon(daten, 's1', 'team1')?.auswertung;
    expect(gespeichert?.prAnteil).toBe(10);
    // Teile zusammenzuführen würde einen Stand erzeugen, den es nie gab.
    expect(Object.keys(gespeichert?.anteile ?? {})).toEqual(['cem']);
  });

  it('hält Repository am Projekt und Kennung an der Person (FA-81 AK-3, FA-88 AK-3)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'team/repository', id: 'team1', repository: 'htl/kepler' },
      { art: 'person/stammdaten', id: 'p1', githubKennung: 'anna' },
    );
    expect(daten.teams[0].repository).toBe('htl/kepler');
    expect(daten.personen.find((p) => p.id === 'p1')?.githubKennung).toBe('anna');
  });

  it('nimmt die Kennung mit der gelöschten Person mit (FA-88 AK-3)', () => {
    const daten = anwenden(
      grundbestand(),
      { art: 'person/stammdaten', id: 'p1', githubKennung: 'anna' },
      { art: 'person/loeschen', id: 'p1' },
    );
    // Eine Kennung, die niemandem gehört, gibt es nicht mehr: Sie hing an der
    // Person und nicht am Projekt.
    expect(daten.personen.some((p) => p.id === 'p1')).toBe(false);
    expect(daten.personen.some((p) => (p.githubKennung ?? '') === 'anna')).toBe(false);
  });
});

describe('Sprint fixieren und abschließen (FA-77)', () => {
  /** Zwei geplante Sprints eines Teams. */
  function zweiGeplante(): Datenbestand {
    return anwenden(
      grundbestand(),
      { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's2', nummer: 2, name: 'Sprint 2' }) },
      { art: 'planung/festhalten', abschnittId: 's1', teamId: 'team1' },
      { art: 'planung/festhalten', abschnittId: 's2', teamId: 'team1' },
    );
  }

  it('macht aus dem ersten Vorschlag den geltenden Sprint (AK-3)', () => {
    const daten = anwenden(zweiGeplante(), {
      art: 'planung/fixieren',
      abschnittId: 's1',
      teamId: 'team1',
    });
    expect(planungVon(daten, 's1', 'team1')?.fixiertAm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(sprintZustand(daten, 's1', 'team1')).toBe('fixiert');
  });

  it('fixiert den zweiten nicht, solange der erste kein Review hat (AK-3)', () => {
    const daten = anwenden(zweiGeplante(), {
      art: 'planung/fixieren',
      abschnittId: 's2',
      teamId: 'team1',
    });
    expect(planungVon(daten, 's2', 'team1')?.fixiertAm).toBeUndefined();
    expect(sprintZustand(daten, 's2', 'team1')).toBe('vorschlag');
  });

  it('gibt den zweiten frei, sobald der erste abgeschlossen ist (AK-3, AK-5)', () => {
    const daten = anwenden(
      zweiGeplante(),
      { art: 'planung/fixieren', abschnittId: 's1', teamId: 'team1' },
      { art: 'planung/abschliessen', abschnittId: 's1', teamId: 'team1', abgeschlossen: true },
      { art: 'planung/fixieren', abschnittId: 's2', teamId: 'team1' },
    );
    expect(sprintZustand(daten, 's1', 'team1')).toBe('abgeschlossen');
    expect(sprintZustand(daten, 's2', 'team1')).toBe('fixiert');
  });

  it('hält beim Abschluss auch die Fixierung fest, wenn sie fehlt (AK-9)', () => {
    const daten = anwenden(zweiGeplante(), {
      art: 'planung/abschliessen',
      abschnittId: 's1',
      teamId: 'team1',
      abgeschlossen: true,
    });
    const planung = planungVon(daten, 's1', 'team1')!;
    expect(planung.abgeschlossenAm).toBeDefined();
    expect(planung.fixiertAm).toBe(planung.abgeschlossenAm);
  });

  it('nimmt den Abschluss zurück, ohne den Folgesprint zu entfixieren (AK-6)', () => {
    const daten = anwenden(
      zweiGeplante(),
      { art: 'planung/abschliessen', abschnittId: 's1', teamId: 'team1', abgeschlossen: true },
      { art: 'planung/fixieren', abschnittId: 's2', teamId: 'team1' },
      { art: 'planung/abschliessen', abschnittId: 's1', teamId: 'team1', abgeschlossen: false },
    );
    expect(sprintZustand(daten, 's1', 'team1')).toBe('fixiert');
    expect(sprintZustand(daten, 's2', 'team1')).toBe('fixiert');
  });

  it('friert die Kriterien mit der Fixierung ein (FA-65 AK-1a)', () => {
    const ohnePlanung = anwenden(grundbestand(), {
      art: 'planung/fixieren',
      abschnittId: 's1',
      teamId: 'team1',
    });
    // Ohne Planung gibt es nichts zu fixieren.
    expect(planungVon(ohnePlanung, 's1', 'team1')).toBeUndefined();

    const daten = anwenden(zweiGeplante(), {
      art: 'planung/fixieren',
      abschnittId: 's1',
      teamId: 'team1',
    });
    expect(planungVon(daten, 's1', 'team1')?.eingefrorenAm).toBeDefined();
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

  it('wählt ein Kriterium nur für dieses Team ab (AK-2)', () => {
    const daten = anwenden(geplant(), {
      art: 'planung/kriteriumWaehlen',
      abschnittId: 's1',
      teamId: 'team1',
      kategorie: 'team',
      kriteriumId: 't1',
      gewaehlt: false,
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
      { art: 'planung/kriteriumWaehlen', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', gewaehlt: false },
    );
    expect(planungVon(daten, 's1', 'team1')!.rubrikKopie!.team[0].id).toBe('t1');
  });

  it('schreibt die Kriterien des vorigen Sprints fort, nicht die Rubrik (AK-7)', () => {
    const daten = anwenden(
      geplant(),
      { art: 'planung/kriteriumWaehlen', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', gewaehlt: false },
      { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's2', nummer: 2, name: 'Sprint 2' }) },
      { art: 'planung/festhalten', abschnittId: 's2', teamId: 'team1' },
    );
    const zweiter = planungVon(daten, 's2', 'team1')!;
    expect(zweiter.rubrikKopie!.team.map((k) => k.id)).not.toContain('t1');
    expect(zweiter.herkunft).toEqual({ art: 'uebernommen', ausAbschnittId: 's1' });
  });

  it('nimmt für den ersten Sprint die zugeordnete Rubrik, nicht die Kette (AK-8)', () => {
    const daten = geplant();
    expect(planungVon(daten, 's1', 'team1')!.herkunft).toEqual({
      art: 'vorlage',
      rubrikId: RUBRIK_SPRINT,
    });
  });

  it('nimmt ein abgewähltes Kriterium wieder auf und behält die Reihenfolge (AK-2)', () => {
    const ohne = anwenden(geplant(), {
      art: 'planung/kriteriumWaehlen', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't2', gewaehlt: false,
    });
    const wieder = anwenden(ohne, {
      art: 'planung/kriteriumWaehlen', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't2', gewaehlt: true,
    });
    // t2 steht wieder an seinem Platz, nicht am Ende.
    expect(planungVon(wieder, 's1', 'team1')!.rubrikKopie!.team.map((k) => k.id)).toEqual(
      VORLAGE_RUBRIK_SPRINT.team.map((k) => k.id),
    );
  });

  it('führt Vorlage, frühere Auswahl und Neues im Vorrat zusammen (AK-2a)', () => {
    const daten = anwenden(
      geplant(),
      { art: 'planung/kriteriumWaehlen', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', gewaehlt: false },
      { art: 'planung/kriteriumHinzufuegen', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriterium: { id: 'eigen2', name: 'Migrationsskript', beschreibung: '', max: 5 } },
    );
    const vorrat = kriterienVorrat(daten, daten.abschnitte[0], 'team1').team.map((k) => k.id);
    // Abgewähltes bleibt im Vorrat, Neues kommt dazu, und die Vorlage für den
    // Vorbereitungssprint steht bei einem Sprint ebenfalls zur Wahl.
    expect(vorrat).toContain('t1');
    expect(vorrat).toContain('eigen2');
    expect(vorrat).toContain('v1');
  });

  it('führt bei der Diplomarbeitsvorbereitung keine Sprintkriterien (AK-10)', () => {
    const daten = anwenden(
      geplant(),
      {
        art: 'abschnitt/anlegen',
        abschnitt: abschnitt({ id: 'd1', nummer: 5, name: 'Diplomarbeitsvorbereitung', art: 'diplomarbeit', rubrikId: RUBRIK_DIPLOMARBEIT }),
      },
      { art: 'planung/festhalten', abschnittId: 'd1', teamId: 'team1' },
    );
    const planung = planungVon(daten, 'd1', 'team1')!;
    expect(planung.rubrikKopie!.team.map((k) => k.id)).toEqual(
      VORLAGE_RUBRIK_DIPLOMARBEIT.team.map((k) => k.id),
    );
    expect(planung.herkunft).toEqual({ art: 'vorlage', rubrikId: RUBRIK_DIPLOMARBEIT });
    const vorrat = kriterienVorrat(daten, daten.abschnitte.find((a) => a.id === 'd1')!, 'team1');
    expect(vorrat.team.map((k) => k.id)).not.toContain('t1');
  });

  it('rechnet danach mit dem Satz des Teams (AK-1)', () => {
    const daten = anwenden(
      geplant(),
      { art: 'planung/kriteriumWaehlen', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', gewaehlt: false },
    );
    expect(rubrikFuer(daten, daten.abschnitte[0], 'team1').team.map((k) => k.id)).not.toContain('t1');
    expect(rubrikFuer(daten, daten.abschnitte[0], null).team.map((k) => k.id)).toContain('t1');
  });
});

describe('Abschnitt für ein Team entfernen (FA-70 AK-8, FA-36 AK-3)', () => {
  function zweiTeamsEinSprint(): Datenbestand {
    return anwenden(
      grundbestand(),
      { art: 'team/anlegen', id: 'team2', klasseId: 'k1', name: 'Doppler' },
      { art: 'planung/festhalten', abschnittId: 's1', teamId: 'team1', ziel: 'Buchung' },
      { art: 'planung/festhalten', abschnittId: 's1', teamId: 'team2', ziel: 'Storno' },
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 8 },
    );
  }

  it('nimmt den Sprint nur diesem Team weg', () => {
    const daten = anwenden(zweiTeamsEinSprint(), {
      art: 'abschnitt/vonTeamEntfernen',
      abschnittId: 's1',
      teamId: 'team1',
    });
    expect(daten.abschnitte.some((a) => a.id === 's1')).toBe(true);
    expect(planungVon(daten, 's1', 'team1')).toBeUndefined();
    expect(planungVon(daten, 's1', 'team2')?.ziel).toBe('Storno');
    // Die Bewertung dieses Teams geht mit – sie hätte sonst keinen Träger.
    expect(daten.bewertungen.some((b) => b.abschnittId === 's1' && b.teamId === 'team1')).toBe(false);
  });

  it('löscht den Abschnitt ganz, wenn kein Team mehr übrig ist', () => {
    const daten = anwenden(
      zweiTeamsEinSprint(),
      { art: 'abschnitt/vonTeamEntfernen', abschnittId: 's1', teamId: 'team1' },
      { art: 'abschnitt/vonTeamEntfernen', abschnittId: 's1', teamId: 'team2' },
    );
    expect(daten.abschnitte).toHaveLength(0);
    expect(daten.teamabschnitte).toHaveLength(0);
  });

  it('zählt vor dem Löschen, was daran hängt (FA-36 AK-3)', () => {
    const daten = anwenden(
      zweiTeamsEinSprint(),
      { art: 'bewertung/rueckmeldung', abschnittId: 's1', teamId: 'team1', personId: 'p1', staerken: 'sauber dokumentiert', entwicklung: 'früher anfangen' },
      { art: 'bewertung/notiz', abschnittId: 's1', teamId: 'team1', notiz: 'Board gepflegt' },
    );
    const ganz = abschnittsinhalt(daten, 's1');
    expect(ganz.planungen).toBe(2);
    expect(ganz.punkte).toBe(1);
    expect(ganz.rueckmeldungen).toBe(1);
    expect(ganz.notizen).toBe(1);

    // Auf ein Team eingegrenzt zählt nur, was diesem Team gehört.
    const nurDoppler = abschnittsinhalt(daten, 's1', 'team2');
    expect(nurDoppler.planungen).toBe(1);
    expect(nurDoppler.punkte).toBe(0);
    expect(abschnittIstLeer(abschnittsinhalt(daten, 's1', 'team1'))).toBe(false);
  });

  it('meldet einen frisch angelegten Abschnitt als leer', () => {
    const daten = grundbestand();
    expect(abschnittIstLeer(abschnittsinhalt(daten, 's1'))).toBe(true);
  });
});
