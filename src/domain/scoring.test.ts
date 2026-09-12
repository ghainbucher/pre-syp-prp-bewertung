import { describe, expect, it } from 'vitest';

import {
  RUBRIK_SPRINT,
  STANDARD_NOTENSCHLUESSEL,
  VORLAGE_RUBRIK_SPRINT,
  VORLAGE_RUBRIK_VORBEREITUNG,
  leererDatenbestand,
  schuljahrVon,
  strukturKopie,
  testRubrik,
  vorlageStichtage,
  vorlagenRubriken,
} from './defaults';
import { zeitraumVon } from './zuordnung';
import { abschnitteMitAbweichung, kriterienWeichenAb } from './scoring';
import {
  ABWEICHUNG_SCHWELLE,
  abschnittsErgebnis,
  abschnittAbgeschlossen,
  angleichungAendertWerte,
  angleichungsVorschau,
  bewertungsSchluessel,
  datumDeutsch,
  ergebnisAusRubrik,
  genuegendGrenze,
  gesamtErgebnis,
  kategorieErgebnis,
  mitVerstehensnachweis,
  note,
  notenstandWeichtAb,
  notenvorschlag,
  offeneKategorien,
  peerErgebnis,
  peerFrageFaellig,
  peerKorrektur,
  peerWertInProzent,
  selbstEinschaetzung,
  selbstbildAbweichung,
  strangErgebnis,
  strangUnterGrenze,
  tendenz,
  zeitfaktorWeichtAb,
  zeitfaktoren,
} from './scoring';
import type {
  Abschnitt,
  Bewertung,
  Datenbestand,
  Gesamtergebnis,
  Kriterium,
  Person,
  Rubrik,
  Verstehensstufe,
} from './types';

/* -------------------------------------------------------------------------- */
/* Testdaten                                                                  */
/* -------------------------------------------------------------------------- */

const KRITERIEN: Kriterium[] = [
  { id: 'a', name: 'A', beschreibung: '', max: 10 },
  { id: 'b', name: 'B', beschreibung: '', max: 5 },
  { id: 'c', name: 'C', beschreibung: '', max: 5 },
];

/** Alle vier Kategorien gewichtet – sonst fällt „fehlend“ anders aus. */
const ALLE_GEWICHTE = { team: 40, prozess: 15, individuell: 35, peer: 10 };

function person(id: string, teamId: string | null = 'team1'): Person {
  return { id, klasseId: 'k1', teamId, name: id };
}

function leereBewertung(abschnittId = 's1', teamId: string | null = 'team1'): Bewertung {
  return { abschnittId, teamId, team: {}, prozess: {}, individuell: {}, peer: {}, notiz: '' };
}

function rubrik(aenderung: Partial<Rubrik> = {}): Rubrik {
  return { ...strukturKopie(VORLAGE_RUBRIK_SPRINT), ...aenderung };
}

function abschnitt(teil: Partial<Abschnitt> = {}): Abschnitt {
  return {
    id: 's1',
    klasseId: 'k1',
    nummer: 1,
    name: 'Sprint 1',
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

/* -------------------------------------------------------------------------- */
/* FA-21 Kategorieergebnis                                                    */
/* -------------------------------------------------------------------------- */

describe('kategorieErgebnis (FA-21)', () => {
  it('rechnet erreichte Punkte gegen die Maximalpunkte der ausgefüllten Kriterien', () => {
    const ergebnis = kategorieErgebnis({ a: 8, b: 4, c: 3 }, KRITERIEN);
    expect(ergebnis).not.toBeNull();
    expect(ergebnis!.erreicht).toBe(15);
    expect(ergebnis!.moeglich).toBe(20);
    expect(ergebnis!.prozent).toBeCloseTo(75, 10);
  });

  it('zählt nicht ausgefüllte Kriterien weder im Zähler noch im Nenner', () => {
    // Nur Kriterium a ausgefüllt: 8 von 10, nicht 8 von 20.
    const ergebnis = kategorieErgebnis({ a: 8 }, KRITERIEN);
    expect(ergebnis!.prozent).toBeCloseTo(80, 10);
    expect(ergebnis!.ausgefuellt).toBe(1);
    expect(ergebnis!.gesamt).toBe(3);
  });

  it('unterscheidet „nicht bewertet“ von „0 Punkte“', () => {
    expect(kategorieErgebnis({}, KRITERIEN)).toBeNull();
    expect(kategorieErgebnis({ a: 0 }, KRITERIEN)!.prozent).toBe(0);
  });

  it('begrenzt Punkte über dem Maximum und unter null', () => {
    expect(kategorieErgebnis({ a: 99 }, KRITERIEN)!.prozent).toBe(100);
    expect(kategorieErgebnis({ a: -5 }, KRITERIEN)!.prozent).toBe(0);
  });

  it('ignoriert unbekannte Kriterien im Datenbestand', () => {
    const ergebnis = kategorieErgebnis({ a: 10, geloescht: 100 }, KRITERIEN);
    expect(ergebnis!.prozent).toBe(100);
  });

  it('liefert null ohne Punkte und ohne Kriterien', () => {
    expect(kategorieErgebnis(undefined, KRITERIEN)).toBeNull();
    expect(kategorieErgebnis({ a: 1 }, [])).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* FA-22 Peer-Bewertung                                                       */
/* -------------------------------------------------------------------------- */

describe('peerWertInProzent (FA-22)', () => {
  it('bildet die Skala 1–5 linear auf 0–100 % ab', () => {
    expect(peerWertInProzent(1)).toBe(0);
    expect(peerWertInProzent(3)).toBe(50);
    expect(peerWertInProzent(5)).toBe(100);
  });

  it('begrenzt Werte außerhalb der Skala', () => {
    expect(peerWertInProzent(0)).toBe(0);
    expect(peerWertInProzent(9)).toBe(100);
  });
});

describe('peerErgebnis (FA-22, FA-15)', () => {
  const team = [person('p1'), person('p2'), person('p3')];

  it('mittelt über alle Urteile der anderen Teammitglieder', () => {
    const b = leereBewertung();
    b.peer = {
      p2: { p1: { q1: 5, q2: 5, q3: 5, q4: 5 } }, // 100 %
      p3: { p1: { q1: 3, q2: 3, q3: 3, q4: 3 } }, // 50 %
    };
    const ergebnis = peerErgebnis(b, 'p1', team, rubrik());
    expect(ergebnis!.prozent).toBeCloseTo(75, 10);
    expect(ergebnis!.bewertende).toBe(2);
  });

  it('lässt die Selbsteinschätzung standardmäßig außen vor', () => {
    const b = leereBewertung();
    b.peer = {
      p1: { p1: { q1: 5, q2: 5, q3: 5, q4: 5 } }, // Selbstbild, zählt nicht
      p2: { p1: { q1: 1, q2: 1, q3: 1, q4: 1 } },
    };
    expect(peerErgebnis(b, 'p1', team, rubrik())!.prozent).toBe(0);
  });

  it('bezieht die Selbsteinschätzung ein, wenn eingestellt (FA-15)', () => {
    const b = leereBewertung();
    b.peer = {
      p1: { p1: { q1: 5, q2: 5, q3: 5, q4: 5 } },
      p2: { p1: { q1: 1, q2: 1, q3: 1, q4: 1 } },
    };
    const ergebnis = peerErgebnis(b, 'p1', team, rubrik({ selbstZaehlt: true }));
    expect(ergebnis!.prozent).toBeCloseTo(50, 10);
  });

  it('wertet fehlende Einzelurteile nicht als schlechteste Bewertung', () => {
    const b = leereBewertung();
    b.peer = { p2: { p1: { q1: 5 } } }; // nur ein Kriterium beurteilt
    expect(peerErgebnis(b, 'p1', team, rubrik())!.prozent).toBe(100);
  });

  it('liefert null, wenn niemand bewertet hat', () => {
    expect(peerErgebnis(leereBewertung(), 'p1', team, rubrik())).toBeNull();
    expect(peerErgebnis(undefined, 'p1', team, rubrik())).toBeNull();
  });

  it('liest die Selbsteinschätzung getrennt aus', () => {
    const b = leereBewertung();
    b.peer = { p1: { p1: { q1: 4, q2: 4, q3: 4, q4: 4 } } };
    expect(selbstEinschaetzung(b, 'p1', rubrik())).toBeCloseTo(75, 10);
    expect(selbstEinschaetzung(b, 'p2', rubrik())).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* FA-23 Abschnittsergebnis                                                   */
/* -------------------------------------------------------------------------- */

describe('ergebnisAusRubrik (FA-23, FA-26)', () => {
  const team = [person('p1'), person('p2')];

  it('rechnet das dokumentierte Beispiel aus dem Solution-Design nach (NFA-02)', () => {
    // Team 33,5/45 = 74,44 %, Prozess 20/25 = 80 %, Individuell 21/30 = 70 %.
    // Gewichte 45/20/35 → 74,0 %. Peer 81,25 % → Korrektur +3,1 (FA-45).
    const b = leereBewertung();
    b.team = { t1: 8, t2: 7.5, t3: 5, t4: 4, t5: 5, t6: 4 };
    b.prozess = { p1: 4, p2: 3, p3: 4, p4: 5, p5: 4 };
    b.individuell = { p1: { punkte: { i1: 6, i2: 6, i3: 5, i4: 4 }, notiz: '' } };
    b.peer = { p2: { p1: { q1: 5, q2: 4, q3: 4, q4: 4 } } };

    const ergebnis = ergebnisAusRubrik(b, person('p1'), team, rubrik(), true);
    expect(ergebnis.team!.prozent).toBeCloseTo(74.444, 2);
    expect(ergebnis.prozess!.prozent).toBeCloseTo(80, 10);
    expect(ergebnis.individuell!.prozent).toBeCloseTo(70, 10);
    expect(ergebnis.peer!.prozent).toBeCloseTo(81.25, 10);
    expect(ergebnis.prozentVorKorrektur).toBeCloseTo(74.0, 1);
    expect(ergebnis.korrektur).toBeCloseTo(3.125, 3);
    expect(ergebnis.prozent).toBeCloseTo(77.1, 1);
    expect(note(ergebnis.prozent, STANDARD_NOTENSCHLUESSEL)).toBe(3);
  });

  it('lässt das Ergebnis ohne Peer-Werte unverändert (FA-45 AK-3, Solution-Design 6.8)', () => {
    const b = leereBewertung();
    b.team = { t1: 8, t2: 7.5, t3: 5, t4: 4, t5: 5, t6: 4 };
    b.prozess = { p1: 4, p2: 3, p3: 4, p4: 5, p5: 4 };
    b.individuell = { p1: { punkte: { i1: 6, i2: 6, i3: 5, i4: 4 }, notiz: '' } };

    const ergebnis = ergebnisAusRubrik(b, person('p1'), team, rubrik(), true);
    expect(ergebnis.korrektur).toBe(0);
    expect(ergebnis.prozent).toBeCloseTo(74.0, 1);
  });

  it('zieht bei durchgängig schlechtester Peer-Bewertung die volle Deckelung ab (Solution-Design 6.8)', () => {
    const b = leereBewertung();
    b.team = { t1: 8, t2: 7.5, t3: 5, t4: 4, t5: 5, t6: 4 };
    b.prozess = { p1: 4, p2: 3, p3: 4, p4: 5, p5: 4 };
    b.individuell = { p1: { punkte: { i1: 6, i2: 6, i3: 5, i4: 4 }, notiz: '' } };
    b.peer = { p2: { p1: { q1: 1, q2: 1, q3: 1, q4: 1 } } };

    const ergebnis = ergebnisAusRubrik(b, person('p1'), team, rubrik(), true);
    expect(ergebnis.korrektur).toBeCloseTo(-5, 10);
    expect(ergebnis.prozent).toBeCloseTo(69.0, 1);
  });

  it('rechnet fehlende Kategorien aus der Gewichtung heraus statt sie als 0 zu werten', () => {
    const b = leereBewertung();
    b.team = { t1: 10, t2: 10, t3: 8, t4: 6, t5: 6, t6: 5 }; // 100 %
    const ergebnis = ergebnisAusRubrik(
      b,
      person('p1'),
      team,
      rubrik({ gewichte: ALLE_GEWICHTE }),
      true,
    );
    expect(ergebnis.prozent).toBe(100);
    // Peer steht seit FA-45 nicht mehr unter den gewichteten Kategorien und
    // kann deshalb auch nicht „fehlen“.
    expect(ergebnis.fehlend).toEqual(['Scrum-Prozess', 'Individueller Beitrag']);
  });

  it('nimmt Kategorien mit Gewicht 0 aus der Berechnung, ohne sie als fehlend zu melden (FA-07)', () => {
    const b = leereBewertung();
    b.team = { t1: 10, t2: 10, t3: 8, t4: 6, t5: 6, t6: 5 };
    b.prozess = { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 };
    const r = rubrik({ gewichte: { team: 100, prozess: 0, individuell: 0, peer: 0 } });
    const ergebnis = ergebnisAusRubrik(b, person('p1'), team, r, true);
    expect(ergebnis.prozent).toBe(100);
    expect(ergebnis.fehlend).toEqual([]);
  });

  it('liefert kein Ergebnis, solange nichts erfasst ist', () => {
    const ergebnis = ergebnisAusRubrik(
      undefined,
      person('p1'),
      team,
      rubrik({ gewichte: ALLE_GEWICHTE }),
      true,
    );
    expect(ergebnis.prozent).toBeNull();
    expect(ergebnis.fehlend).toHaveLength(3);
  });

  it('bewertet Personen desselben Teams individuell unterschiedlich', () => {
    const b = leereBewertung();
    b.team = { t1: 5 };
    b.individuell = {
      p1: { punkte: { i1: 10 }, notiz: '' },
      p2: { punkte: { i1: 0 }, notiz: '' },
    };
    const eins = ergebnisAusRubrik(b, person('p1'), team, rubrik(), false);
    const zwei = ergebnisAusRubrik(b, person('p2'), team, rubrik(), false);
    expect(eins.prozent).toBeGreaterThan(zwei.prozent!);
  });

  it('lässt den Peer-Anteil aus, solange er für den Abschnitt nicht eingeschaltet ist (FA-52)', () => {
    const b = leereBewertung();
    b.peer = { p2: { p1: { q1: 5, q2: 5, q3: 5, q4: 5 } } };
    expect(ergebnisAusRubrik(b, person('p1'), team, rubrik(), false).peer).toBeNull();
    expect(ergebnisAusRubrik(b, person('p1'), team, rubrik(), true).peer).not.toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* FA-59 Stränge und Gesamtstand                                              */
/* -------------------------------------------------------------------------- */

describe('strangErgebnis und gesamtErgebnis (FA-24, FA-59)', () => {
  /** Bestand mit einem Praxis- und einem Theorieabschnitt. */
  function bestand(): Datenbestand {
    const daten = leererDatenbestand();
    daten.klassen = [{ id: 'k1', name: '4AHIF' }];
    daten.teams = [{ id: 'team1', klasseId: 'k1', name: 'Team Kepler' }];
    daten.personen = [person('p1')];
    daten.rubriken = [
      rubrik({ gewichte: { team: 100, prozess: 0, individuell: 0, peer: 0 } }),
      testRubrik('rubrik-test', 'Test 1'),
    ];
    daten.abschnitte = [
      abschnitt({ id: 's1', nummer: 1 }),
      abschnitt({ id: 's2', nummer: 2, name: 'Sprint 2' }),
      abschnitt({
        id: 'x1',
        nummer: 3,
        name: 'Test 1',
        art: 'test',
        strang: 'theorie',
        rubrikId: 'rubrik-test',
      }),
    ];
    return daten;
  }

  function mitPunkten(
    daten: Datenbestand,
    eintraege: Array<{ abschnittId: string; teamPunkte?: number; testPunkte?: number }>,
  ): Map<string, Bewertung> {
    const map = new Map<string, Bewertung>();
    for (const eintrag of eintraege) {
      if (eintrag.teamPunkte !== undefined) {
        const b = leereBewertung(eintrag.abschnittId, 'team1');
        b.team = { t1: eintrag.teamPunkte }; // max 10
        map.set(bewertungsSchluessel(eintrag.abschnittId, 'team1'), b);
      }
      if (eintrag.testPunkte !== undefined) {
        const b = leereBewertung(eintrag.abschnittId, null);
        b.individuell = { p1: { punkte: { f1: eintrag.testPunkte }, notiz: '' } }; // max 2
        map.set(bewertungsSchluessel(eintrag.abschnittId, null), b);
      }
      void daten;
    }
    return map;
  }

  it('gewichtet Abschnitte mit dem Produkt aus Abschnitts- und Zeitfaktor (FA-24 AK-3, FA-54)', () => {
    const daten = bestand();
    daten.abschnitte[0].faktor = 0.5;
    const bewertungen = mitPunkten(daten, [
      { abschnittId: 's1', teamPunkte: 4 }, // 40 %
      { abschnittId: 's2', teamPunkte: 10 }, // 100 %
    ]);
    // Zwei Abschnitte → Zeitfaktoren 1 und 2. Gewichte 0,5·1 = 0,5 und 1·2 = 2.
    // (0,5·40 + 2·100) / 2,5 = 88
    expect(strangErgebnis(daten, person('p1'), 'praxis', bewertungen).prozent).toBeCloseTo(88, 10);
  });

  it('gewichtet ohne Zeitfaktor allein mit dem Abschnittsfaktor (FA-54 AK-6)', () => {
    const daten = bestand();
    daten.zeitfaktorZweiteHaelfte = 1;
    daten.abschnitte[0].faktor = 0.5;
    const bewertungen = mitPunkten(daten, [
      { abschnittId: 's1', teamPunkte: 4 },
      { abschnittId: 's2', teamPunkte: 10 },
    ]);
    // (0,5·40 + 1·100) / 1,5 = 80
    expect(strangErgebnis(daten, person('p1'), 'praxis', bewertungen).prozent).toBeCloseTo(80, 10);
  });

  it('lässt Abschnitte ohne Daten und mit Faktor 0 unberücksichtigt', () => {
    const daten = bestand();
    daten.abschnitte[0].faktor = 0;
    const bewertungen = mitPunkten(daten, [
      { abschnittId: 's1', teamPunkte: 0 },
      { abschnittId: 's2', teamPunkte: 8 },
    ]);
    expect(strangErgebnis(daten, person('p1'), 'praxis', bewertungen).prozent).toBeCloseTo(80, 10);
  });

  it('mittelt die Strangstände mit 75 zu 25 (FA-59 AK-3)', () => {
    const daten = bestand();
    const bewertungen = mitPunkten(daten, [
      { abschnittId: 's1', teamPunkte: 10 }, // Praxis 100 %
      { abschnittId: 's2', teamPunkte: 10 },
      { abschnittId: 'x1', testPunkte: 1 }, // Theorie 1 von 2 = 50 %
    ]);
    const ergebnis = gesamtErgebnis(daten, person('p1'), bewertungen);
    expect(ergebnis.praxis.prozent).toBeCloseTo(100, 10);
    expect(ergebnis.theorie.prozent).toBeCloseTo(50, 10);
    // 0,75·100 + 0,25·50 = 87,5
    expect(ergebnis.prozent).toBeCloseTo(87.5, 10);
  });

  it('nimmt einen Strang ohne jedes Ergebnis aus der Gewichtung (FA-59 AK-5)', () => {
    const daten = bestand();
    const bewertungen = mitPunkten(daten, [{ abschnittId: 's1', teamPunkte: 8 }]);
    const ergebnis = gesamtErgebnis(daten, person('p1'), bewertungen);
    expect(ergebnis.theorie.prozent).toBeNull();
    // Ohne diese Regel stünde hier 60 statt 80 – im Oktober, wenn noch kein
    // Test geschrieben wurde, wäre jeder Stand um ein Viertel gedrückt.
    expect(ergebnis.prozent).toBeCloseTo(80, 10);
  });

  it('führt jedes Abschnittsergebnis einzeln mit', () => {
    const daten = bestand();
    const bewertungen = mitPunkten(daten, [{ abschnittId: 's1', teamPunkte: 5 }]);
    const ergebnis = gesamtErgebnis(daten, person('p1'), bewertungen);
    expect(ergebnis.alle).toHaveLength(3);
    expect(ergebnis.alle[0].ergebnis.prozent).toBeCloseTo(50, 10);
    expect(ergebnis.alle[1].ergebnis.prozent).toBeNull();
  });

  it('rechnet einen Test über die Person, nicht über ein Team (FA-60)', () => {
    const daten = bestand();
    const bewertungen = mitPunkten(daten, [{ abschnittId: 'x1', testPunkte: 2 }]);
    const test = daten.abschnitte[2];
    expect(abschnittsErgebnis(daten, test, person('p1'), bewertungen).prozent).toBeCloseTo(100, 10);
  });
});

/* -------------------------------------------------------------------------- */
/* FA-05, FA-10 Aufbau der Rubrik                                             */
/* -------------------------------------------------------------------------- */

describe('Aufbau der Rubrik (FA-05, FA-10)', () => {
  it('führt genau vier Kategorien mit je einem Gewicht (FA-05)', () => {
    const r = rubrik();
    expect(Object.keys(r.gewichte).sort()).toEqual(['individuell', 'peer', 'prozess', 'team']);
    for (const kategorie of ['team', 'prozess', 'individuell', 'peer'] as const) {
      expect(Array.isArray(r[kategorie])).toBe(true);
      expect(r[kategorie].length).toBeGreaterThan(0);
    }
  });

  it('vergibt innerhalb einer Kategorie eindeutige Kriterien-IDs (FA-05)', () => {
    const r = rubrik();
    for (const kategorie of ['team', 'prozess', 'individuell', 'peer'] as const) {
      const ids = r[kategorie].map((k) => k.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('baut die Testrubrik nach dem Schema 20/20/20/40 (Fachkonzept 3.6)', () => {
    const r = testRubrik('t', 'Test');
    expect(r.individuell.map((k) => k.max)).toEqual([2, 2, 2, 4]);
    expect(r.gewichte).toEqual({ team: 0, prozess: 0, individuell: 100, peer: 0 });
    expect(r.team).toHaveLength(0);
  });

  it('wendet dieselbe Rubrik unabhängig von Klasse und Team an (FA-10)', () => {
    const b = leereBewertung();
    b.team = { t1: 5 };
    const r = rubrik();
    const ausKlasseA = { ...person('p1'), klasseId: 'k1', teamId: 'team1' };
    const ausKlasseB = { ...person('p2'), klasseId: 'k2', teamId: 'team2' };
    expect(ergebnisAusRubrik(b, ausKlasseA, [ausKlasseA], r, false).team!.prozent).toBe(
      ergebnisAusRubrik(b, ausKlasseB, [ausKlasseB], r, false).team!.prozent,
    );
  });
});

/* -------------------------------------------------------------------------- */
/* FA-27 Auffälliges Selbstbild                                               */
/* -------------------------------------------------------------------------- */

describe('selbstbildAbweichung (FA-27)', () => {
  const team = [person('p1'), person('p2')];

  function ergebnisMit(selbstWert: number, fremdWert: number) {
    const b = leereBewertung();
    b.peer = {
      p1: { p1: { q1: selbstWert, q2: selbstWert, q3: selbstWert, q4: selbstWert } },
      p2: { p1: { q1: fremdWert, q2: fremdWert, q3: fremdWert, q4: fremdWert } },
    };
    return ergebnisAusRubrik(b, person('p1'), team, rubrik(), true);
  }

  it('meldet ein deutlich zu hohes Selbstbild', () => {
    // Selbst 5 → 100 %, fremd 3 → 50 %: 50 Prozentpunkte darüber.
    expect(selbstbildAbweichung(ergebnisMit(5, 3))).toBe('hoeher');
  });

  it('meldet ein deutlich zu niedriges Selbstbild', () => {
    expect(selbstbildAbweichung(ergebnisMit(2, 5))).toBe('niedriger');
  });

  it('meldet nichts unterhalb der Schwelle', () => {
    expect(ABWEICHUNG_SCHWELLE).toBe(20);
    // Selbst 4 → 75 %, fremd 4 → 75 %: keine Abweichung.
    expect(selbstbildAbweichung(ergebnisMit(4, 4))).toBeNull();
  });

  it('meldet nichts, solange Selbst- oder Fremdbild fehlt', () => {
    const ohnePeer = ergebnisAusRubrik(leereBewertung(), person('p1'), team, rubrik(), true);
    expect(selbstbildAbweichung(ohnePeer)).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* Schlüssel und Note                                                         */
/* -------------------------------------------------------------------------- */

describe('bewertungsSchluessel', () => {
  it('unterscheidet Abschnitte mit und ohne Team (FA-60)', () => {
    expect(bewertungsSchluessel('a1', 'tm1')).toBe('a1__tm1');
    expect(bewertungsSchluessel('a1', null)).toBe('a1__-');
    expect(bewertungsSchluessel('a1', null)).not.toBe(bewertungsSchluessel('a1', 'tm1'));
  });
});

describe('note (FA-25)', () => {
  const schluessel = STANDARD_NOTENSCHLUESSEL;

  it('ordnet die Grenzwerte der besseren Note zu', () => {
    expect(note(100, schluessel)).toBe(1);
    expect(note(90, schluessel)).toBe(1);
    expect(note(89.99, schluessel)).toBe(2);
    expect(note(80, schluessel)).toBe(2);
    expect(note(65, schluessel)).toBe(3);
    expect(note(51, schluessel)).toBe(4);
    expect(note(50.99, schluessel)).toBe(5);
    expect(note(0, schluessel)).toBe(5);
  });

  it('gibt ohne Prozentwert keine Note aus', () => {
    expect(note(null, schluessel)).toBeNull();
  });

  it('folgt einem geänderten Notenschlüssel (FA-08)', () => {
    const streng = [
      { note: 1 as const, ab: 95, bezeichnung: 'Sehr gut' },
      { note: 2 as const, ab: 85, bezeichnung: 'Gut' },
      { note: 3 as const, ab: 75, bezeichnung: 'Befriedigend' },
      { note: 4 as const, ab: 60, bezeichnung: 'Genügend' },
      { note: 5 as const, ab: 0, bezeichnung: 'Nicht genügend' },
    ];
    expect(note(90, streng)).toBe(2);
    expect(note(70, streng)).toBe(4);
  });
});

describe('datumDeutsch', () => {
  it('schreibt ein ISO-Datum deutsch', () => {
    expect(datumDeutsch('2026-10-06')).toBe('06.10.2026');
  });

  it('lässt einen leeren oder unerwarteten Wert unverändert', () => {
    expect(datumDeutsch('')).toBe('');
    expect(datumDeutsch('demnächst')).toBe('demnächst');
  });
});

describe('Abschluss und Nachfrage (FA-53)', () => {
  const RUBRIK = testRubrik('r-nur-team', 'Nur Team');

  /**
   * Eine Klasse mit einem Team aus zwei Personen und einem Sprint. Die Rubrik
   * bewertet nur den individuellen Teil, damit jede Person einzeln zählt.
   */
  function lage(punkte: Record<string, Record<string, number>>): {
    daten: Datenbestand;
    abschnitt: Abschnitt;
    bewertungen: Map<string, Bewertung>;
  } {
    const daten = leererDatenbestand();
    daten.rubriken.push(RUBRIK);
    daten.klassen.push({ id: 'k1', name: '4AHIF' });
    daten.teams.push({ id: 'team1', klasseId: 'k1', name: 'Team Kepler' });
    daten.personen.push(
      { id: 'p1', klasseId: 'k1', teamId: 'team1', name: 'Berger Lena' },
      { id: 'p2', klasseId: 'k1', teamId: 'team1', name: 'Steiner Jonas' },
    );
    const abschnitt: Abschnitt = {
      id: 's1',
      klasseId: 'k1',
      nummer: 1,
      name: 'Sprint 1',
      art: 'sprint',
      strang: 'praxis',
      rubrikId: RUBRIK.id,
      von: '',
      bis: '',
      faktor: 1,
      peerAktiv: false,
    };
    daten.abschnitte.push(abschnitt);

    const bewertung: Bewertung = {
      abschnittId: 's1',
      teamId: 'team1',
      team: {},
      prozess: {},
      individuell: Object.fromEntries(
        Object.entries(punkte).map(([personId, werte]) => [personId, { punkte: werte, notiz: '' }]),
      ),
      peer: {},
      notiz: '',
    };
    daten.bewertungen.push(bewertung);
    return { daten, abschnitt, bewertungen: new Map([['s1__team1', bewertung]]) };
  }

  it('gilt erst als abgeschlossen, wenn jedes Mitglied ein Ergebnis hat (AK-1)', () => {
    const halb = lage({ p1: { f1: 2 } });
    expect(abschnittAbgeschlossen(halb.daten, halb.abschnitt, halb.bewertungen)).toBe(false);

    const ganz = lage({ p1: { f1: 2 }, p2: { f1: 1 } });
    expect(abschnittAbgeschlossen(ganz.daten, ganz.abschnitt, ganz.bewertungen)).toBe(true);
  });

  it('gilt ohne Team nicht als abgeschlossen', () => {
    const { daten, abschnitt, bewertungen } = lage({ p1: { f1: 2 }, p2: { f1: 1 } });
    daten.personen = daten.personen.map((p) => ({ ...p, teamId: null }));
    expect(abschnittAbgeschlossen(daten, abschnitt, bewertungen)).toBe(false);
  });

  it('stellt die Frage, sobald der Abschnitt fertig ist (AK-1)', () => {
    const { daten, abschnitt, bewertungen } = lage({ p1: { f1: 2 }, p2: { f1: 1 } });
    expect(peerFrageFaellig(daten, abschnitt, bewertungen)).toBe(true);
  });

  it('stellt sie nicht, solange die Peer-Bewertung schon läuft (AK-2)', () => {
    const { daten, abschnitt, bewertungen } = lage({ p1: { f1: 2 }, p2: { f1: 1 } });
    abschnitt.peerAktiv = true;
    expect(peerFrageFaellig(daten, abschnitt, bewertungen)).toBe(false);
  });

  it('stellt sie nach jeder Antwort nicht erneut – auch nach „später“ (AK-3)', () => {
    for (const antwort of ['ja', 'nein', 'spaeter'] as const) {
      const { daten, abschnitt, bewertungen } = lage({ p1: { f1: 2 }, p2: { f1: 1 } });
      daten.peerEntscheidungen.push({ abschnittId: 's1', am: '2026-10-24T12:00:00.000Z', antwort });
      expect(peerFrageFaellig(daten, abschnitt, bewertungen)).toBe(false);
    }
  });

  it('stellt sie bei einem Test gar nicht', () => {
    const { daten, abschnitt, bewertungen } = lage({ p1: { f1: 2 }, p2: { f1: 1 } });
    abschnitt.art = 'test';
    expect(peerFrageFaellig(daten, abschnitt, bewertungen)).toBe(false);
  });
});

describe('peerKorrektur (FA-45)', () => {
  it('verschiebt bei 50 % gar nicht – das ist der neutrale Punkt (AK-2)', () => {
    expect(peerKorrektur(50, 5)).toBe(0);
  });

  it('verschiebt bei 100 % um die volle Deckelung nach oben (AK-1)', () => {
    expect(peerKorrektur(100, 5)).toBeCloseTo(5, 10);
  });

  it('verschiebt bei 0 % um die volle Deckelung nach unten (AK-1)', () => {
    expect(peerKorrektur(0, 5)).toBeCloseTo(-5, 10);
  });

  it('verschiebt ohne Peer-Ergebnis nicht (AK-3)', () => {
    expect(peerKorrektur(null, 5)).toBe(0);
  });

  it('hält die Deckelung auch bei einem Wert außerhalb der Skala ein (AK-1)', () => {
    expect(peerKorrektur(500, 5)).toBe(5);
    expect(peerKorrektur(-200, 5)).toBe(-5);
  });

  it('ist einstellbar (AK-4)', () => {
    expect(peerKorrektur(100, 10)).toBeCloseTo(10, 10);
    expect(peerKorrektur(100, 0)).toBe(0);
  });

  it('behandelt eine unsinnige Deckelung wie keine', () => {
    expect(peerKorrektur(100, -5)).toBe(0);
    expect(peerKorrektur(100, Number.NaN)).toBe(0);
  });
});

describe('Peer-Korrektur im Abschnittsergebnis (FA-45)', () => {
  const team = [person('p1'), person('p2')];

  it('greift nicht, solange die Peer-Bewertung für den Abschnitt aus ist (FA-52)', () => {
    const b = leereBewertung();
    b.team = { t1: 10, t2: 10, t3: 8, t4: 6, t5: 6, t6: 5 };
    b.peer = { p2: { p1: { q1: 5, q2: 5, q3: 5, q4: 5 } } };
    const aus = ergebnisAusRubrik(b, person('p1'), team, rubrik(), false);
    expect(aus.korrektur).toBe(0);
  });

  it('verschiebt ein Ergebnis nie über 100 oder unter 0 Prozent', () => {
    const b = leereBewertung();
    b.team = { t1: 10, t2: 10, t3: 8, t4: 6, t5: 6, t6: 5 }; // 100 %
    b.prozess = { p1: 5, p2: 5, p3: 5, p4: 5, p5: 5 };
    b.individuell = { p1: { punkte: { i1: 10, i2: 8, i3: 6, i4: 6 }, notiz: '' } };
    b.peer = { p2: { p1: { q1: 5, q2: 5, q3: 5, q4: 5 } } };
    expect(ergebnisAusRubrik(b, person('p1'), team, rubrik(), true).prozent).toBe(100);
  });

  it('korrigiert nicht, wenn es gar kein Ergebnis gibt', () => {
    const b = leereBewertung();
    b.peer = { p2: { p1: { q1: 5, q2: 5, q3: 5, q4: 5 } } };
    const ergebnis = ergebnisAusRubrik(b, person('p1'), team, rubrik(), true);
    expect(ergebnis.prozent).toBeNull();
    expect(ergebnis.korrektur).toBe(0);
  });

  it('ignoriert ein Kategoriegewicht für Peer, damit nichts doppelt zählt (AK-1)', () => {
    const b = leereBewertung();
    b.team = { t1: 10, t2: 10, t3: 8, t4: 6, t5: 6, t6: 5 }; // 100 %
    b.peer = { p2: { p1: { q1: 1, q2: 1, q3: 1, q4: 1 } } }; // 0 %
    const mitGewicht = ergebnisAusRubrik(
      b,
      person('p1'),
      team,
      rubrik({ gewichte: { team: 50, prozess: 0, individuell: 0, peer: 50 } }),
      true,
    );
    // Ohne die Regel ergäbe die Gewichtung 50 %; mit ihr bleiben 100 % minus
    // der Deckelung.
    expect(mitGewicht.prozentVorKorrektur).toBe(100);
    expect(mitGewicht.prozent).toBeCloseTo(95, 10);
  });
});

/* -------------------------------------------------------------------------- */
/* Zeitfaktor (FA-54) – die Fälle aus docs/testfaelle-notenfindung.md          */
/* -------------------------------------------------------------------------- */

describe('zeitfaktoren (FA-54 AK-1, AK-2)', () => {
  it('gewichtet die zweite Hälfte doppelt', () => {
    expect(zeitfaktoren(8)).toEqual([1, 1, 1, 1, 2, 2, 2, 2]);
  });

  it('rundet zugunsten der späteren Abschnitte auf (AK-2)', () => {
    // Die Kontrolltabelle aus Kap. 3 des Testfalldokuments.
    expect(zeitfaktoren(2)).toEqual([1, 2]);
    expect(zeitfaktoren(3)).toEqual([1, 2, 2]);
    expect(zeitfaktoren(4)).toEqual([1, 1, 2, 2]);
    expect(zeitfaktoren(5)).toEqual([1, 1, 2, 2, 2]);
    expect(zeitfaktoren(6)).toEqual([1, 1, 1, 2, 2, 2]);
    expect(zeitfaktoren(7)).toEqual([1, 1, 1, 2, 2, 2, 2]);
    expect(zeitfaktoren(9)).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 2]);
  });

  it('kommt mit einem einzelnen Abschnitt und mit keinem zurecht', () => {
    expect(zeitfaktoren(1)).toEqual([2]);
    expect(zeitfaktoren(0)).toEqual([]);
  });

  it('ist einstellbar und kennzeichnet die Abweichung von § 20 Abs. 1 LBVO (AK-6)', () => {
    expect(zeitfaktoren(4, 3)).toEqual([1, 1, 3, 3]);
    expect(zeitfaktoren(4, 1)).toEqual([1, 1, 1, 1]);
    expect(zeitfaktorWeichtAb(1)).toBe(true);
    expect(zeitfaktorWeichtAb(2)).toBe(false);
  });
});

describe('Testfälle zur Notenfindung (FA-54, TF-A bis TF-I)', () => {
  /** Rubrik mit einem einzigen Teamkriterium über 100 Punkte. */
  const PROZENTRUBRIK: Rubrik = {
    id: 'r-prozent',
    name: 'Prozent',
    team: [{ id: 'w', name: 'Wert', beschreibung: '', max: 100 }],
    prozess: [],
    individuell: [],
    peer: [],
    gewichte: { team: 100, prozess: 0, individuell: 0, peer: 0 },
    selbstZaehlt: false,
  };

  /**
   * Baut eine Klasse mit einer Person und je einem Sprint pro Wert; der Wert
   * ist unmittelbar das Abschnittsergebnis in Prozent.
   */
  function verlauf(werte: number[], zeitfaktor = 2) {
    const daten = leererDatenbestand();
    daten.zeitfaktorZweiteHaelfte = zeitfaktor;
    daten.rubriken.push(strukturKopie(PROZENTRUBRIK));
    daten.klassen.push({ id: 'k1', name: '4AHIF' });
    daten.teams.push({ id: 'team1', klasseId: 'k1', name: 'Team Kepler' });
    const p = person('p1');
    daten.personen.push(p);

    const bewertungen = new Map<string, Bewertung>();
    werte.forEach((wert, i) => {
      const id = `s${i + 1}`;
      daten.abschnitte.push({
        id,
        klasseId: 'k1',
        nummer: i + 1,
        name: `Sprint ${i + 1}`,
        art: 'sprint',
        strang: 'praxis',
        rubrikId: PROZENTRUBRIK.id,
        von: '',
        bis: '',
        faktor: 1,
        peerAktiv: false,
      });
      daten.zugehoerigkeiten.push({ abschnittId: id, personId: 'p1', teamId: 'team1' });
      const bewertung: Bewertung = {
        abschnittId: id,
        teamId: 'team1',
        team: { w: wert },
        prozess: {},
        individuell: {},
        peer: {},
        notiz: '',
      };
      daten.bewertungen.push(bewertung);
      bewertungen.set(bewertungsSchluessel(id, 'team1'), bewertung);
    });

    return strangErgebnis(daten, p, 'praxis', bewertungen).prozent!;
  }

  const FAELLE: Array<[string, number[], number, number]> = [
    ['TF-A Konstant gut', [85, 85, 85, 85, 85, 85, 85, 85], 85.0, 85.0],
    ['TF-B Aufsteiger', [45, 50, 60, 68, 75, 82, 88, 90], 69.75, 74.4],
    ['TF-C Absteiger', [90, 88, 82, 75, 68, 60, 50, 45], 69.75, 65.1],
    ['TF-D Später Einbruch', [80, 82, 80, 83, 81, 40, 35, 30], 63.875, 58.1],
    ['TF-E Spätzünder', [50, 48, 52, 50, 55, 75, 88, 92], 63.75, 68.3],
    ['TF-F Ein Ausreißer früh', [30, 80, 82, 85, 83, 86, 84, 85], 76.875, 79.4],
    ['TF-G Ein Ausreißer spät', [85, 84, 86, 83, 85, 82, 30, 84], 77.375, 75.0],
    ['TF-H Schwankend', [80, 45, 85, 50, 78, 48, 82, 52], 65.0, 65.0],
    ['TF-I Knapp durchgehend', [55, 54, 56, 55, 53, 56, 55, 54], 54.75, 54.7],
  ];

  for (const [name, werte, ohne, mit] of FAELLE) {
    it(`${name} ergibt ${mit} % mit Zeitfaktor (FA-54)`, () => {
      expect(verlauf(werte)).toBeCloseTo(mit, 1);
    });

    it(`${name} ergibt ohne Zeitfaktor ${ohne} % – die Rechnung nach § 20 Abs. 1 LBVO ist die andere`, () => {
      expect(verlauf(werte, 1)).toBeCloseTo(ohne, 2);
    });
  }

  it('unterscheidet spiegelbildliche Verläufe: TF-B ≠ TF-C (FA-54 AK-5)', () => {
    const aufsteiger = verlauf([45, 50, 60, 68, 75, 82, 88, 90]);
    const absteiger = verlauf([90, 88, 82, 75, 68, 60, 50, 45]);
    // Ohne Zeitfaktor wären beide gleich – genau das ist der Beleg.
    expect(verlauf([45, 50, 60, 68, 75, 82, 88, 90], 1)).toBeCloseTo(
      verlauf([90, 88, 82, 75, 68, 60, 50, 45], 1),
      10,
    );
    expect(aufsteiger - absteiger).toBeCloseTo(9.33, 1);
  });

  it('wechselt bei TF-E die Notenstufe, bei TF-D nicht', () => {
    expect(note(verlauf([50, 48, 52, 50, 55, 75, 88, 92], 1), STANDARD_NOTENSCHLUESSEL)).toBe(4);
    expect(note(verlauf([50, 48, 52, 50, 55, 75, 88, 92]), STANDARD_NOTENSCHLUESSEL)).toBe(3);
    expect(note(verlauf([80, 82, 80, 83, 81, 40, 35, 30]), STANDARD_NOTENSCHLUESSEL)).toBe(4);
  });

  it('weist Abschnittsfaktor und Zeitfaktor getrennt aus (AK-4)', () => {
    const daten = leererDatenbestand();
    daten.rubriken.push(strukturKopie(PROZENTRUBRIK));
    daten.klassen.push({ id: 'k1', name: '4AHIF' });
    daten.personen.push(person('p1', null));
    for (let i = 1; i <= 4; i += 1) {
      daten.abschnitte.push({
        id: `s${i}`,
        klasseId: 'k1',
        nummer: i,
        name: `Sprint ${i}`,
        art: 'sprint',
        strang: 'praxis',
        rubrikId: PROZENTRUBRIK.id,
        von: '',
        bis: '',
        faktor: i === 1 ? 0.5 : 1,
        peerAktiv: false,
      });
    }
    const ergebnis = strangErgebnis(daten, person('p1', null), 'praxis', new Map());
    expect(ergebnis.abschnitte.map((e) => e.zeitfaktor)).toEqual([1, 1, 2, 2]);
    expect(ergebnis.abschnitte.map((e) => e.abschnitt.faktor)).toEqual([0.5, 1, 1, 1]);
  });
});

/* -------------------------------------------------------------------------- */
/* Sperre bei negativem Strang (FA-61) – TF-J bis TF-M                         */
/* -------------------------------------------------------------------------- */

describe('Sperre bei negativem Strang (FA-61)', () => {
  /** Ein Gesamtergebnis mit vorgegebenen Strangständen – ohne Umweg über Punkte. */
  function stand(praxis: number | null, theorie: number | null): Gesamtergebnis {
    const gewichtet =
      praxis === null && theorie === null
        ? null
        : praxis === null
          ? theorie
          : theorie === null
            ? praxis
            : (75 * praxis + 25 * theorie) / 100;
    return {
      prozent: gewichtet,
      praxis: { strang: 'praxis', prozent: praxis, abschnitte: [] },
      theorie: { strang: 'theorie', prozent: theorie, abschnitte: [] },
      alle: [],
      auslassung: { ohneDatum: [] },
      prozentBerechnet: gewichtet,
      gesetzt: null,
      notenstand: null,
    };
  }

  it('genügt sich die Grenze aus dem Notenschlüssel zu holen', () => {
    expect(genuegendGrenze(STANDARD_NOTENSCHLUESSEL)).toBe(51);
    expect(genuegendGrenze([])).toBe(51);
  });

  it('TF-J: Theorie trägt nicht – 82 / 44 ergibt trotz 72,5 % gesamt ein Nicht genügend', () => {
    const gesamt = stand(82, 44);
    expect(gesamt.prozent).toBeCloseTo(72.5, 10);
    const vorschlag = notenvorschlag(gesamt, STANDARD_NOTENSCHLUESSEL);
    expect(vorschlag.ohneSperre).toBe(3);
    expect(vorschlag.note).toBe(5);
    expect(vorschlag.gesperrtDurch).toBe('theorie');
  });

  it('TF-K: Praxis trägt nicht – die Sperre wirkt in beide Richtungen (AK-4)', () => {
    const gesamt = stand(48, 90);
    expect(gesamt.prozent).toBeCloseTo(58.5, 10);
    const vorschlag = notenvorschlag(gesamt, STANDARD_NOTENSCHLUESSEL);
    expect(vorschlag.ohneSperre).toBe(4);
    expect(vorschlag.note).toBe(5);
    expect(vorschlag.gesperrtDurch).toBe('praxis');
  });

  it('TF-L: noch kein Test – ein fehlender Stand ist kein negativer', () => {
    const gesamt = stand(82, null);
    expect(gesamt.prozent).toBe(82);
    const vorschlag = notenvorschlag(gesamt, STANDARD_NOTENSCHLUESSEL);
    expect(vorschlag.note).toBe(2);
    expect(vorschlag.gesperrtDurch).toBeNull();
  });

  it('TF-M: beide knapp positiv – keine Sperre, und die Grenze selbst gilt als erfüllt', () => {
    const vorschlag = notenvorschlag(stand(52, 51), STANDARD_NOTENSCHLUESSEL);
    expect(vorschlag.note).toBe(4);
    expect(vorschlag.gesperrtDurch).toBeNull();
    // Die andere Seite der Schwelle: 50,9 % ist nicht mehr positiv.
    expect(notenvorschlag(stand(52, 50.9), STANDARD_NOTENSCHLUESSEL).gesperrtDurch).toBe('theorie');
  });

  it('verändert keinen gespeicherten Wert (AK-3, ADR-010)', () => {
    const gesamt = stand(82, 44);
    const vorher = JSON.parse(JSON.stringify(gesamt));
    notenvorschlag(gesamt, STANDARD_NOTENSCHLUESSEL);
    expect(gesamt).toEqual(vorher);
  });

  it('nennt bei zwei negativen Strängen die Praxis zuerst (AK-2)', () => {
    expect(notenvorschlag(stand(40, 30), STANDARD_NOTENSCHLUESSEL).gesperrtDurch).toBe('praxis');
  });

  it('lässt sich abschalten (AK-6)', () => {
    const vorschlag = notenvorschlag(stand(82, 44), STANDARD_NOTENSCHLUESSEL, false);
    expect(vorschlag.note).toBe(3);
    expect(vorschlag.gesperrtDurch).toBeNull();
  });

  it('liefert ohne jedes Ergebnis keinen Vorschlag', () => {
    const vorschlag = notenvorschlag(stand(null, null), STANDARD_NOTENSCHLUESSEL);
    expect(vorschlag.note).toBeNull();
    expect(vorschlag.gesperrtDurch).toBeNull();
  });

  it('erkennt einen gefährdeten Strang für die Frühwarnung (AK-5)', () => {
    expect(strangUnterGrenze(44, STANDARD_NOTENSCHLUESSEL)).toBe(true);
    expect(strangUnterGrenze(51, STANDARD_NOTENSCHLUESSEL)).toBe(false);
    expect(strangUnterGrenze(null, STANDARD_NOTENSCHLUESSEL)).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* Stichtage (FA-48)                                                          */
/* -------------------------------------------------------------------------- */

describe('Auswertung zu einem Stichtag (FA-48)', () => {
  const STICHTAGE = vorlageStichtage(2026);

  /** Vier Sprints mit Enddaten über das Schuljahr verteilt. */
  function bestandMitDaten() {
    const daten = leererDatenbestand();
    daten.stichtage = strukturKopie(STICHTAGE);
    daten.klassen.push({ id: 'k1', name: '4AHIF' });
    daten.teams.push({ id: 'team1', klasseId: 'k1', name: 'Team Kepler' });
    daten.personen.push(person('p1'));
    const enden = ['2026-11-14', '2027-01-23', '2027-03-20', '2027-05-29'];
    const bewertungen = new Map<string, Bewertung>();
    enden.forEach((bis, i) => {
      const id = `s${i + 1}`;
      daten.abschnitte.push({
        id,
        klasseId: 'k1',
        nummer: i + 1,
        name: `Sprint ${i + 1}`,
        art: 'sprint',
        strang: 'praxis',
        rubrikId: RUBRIK_SPRINT,
        von: '',
        bis,
        faktor: 1,
        peerAktiv: false,
      });
      daten.zugehoerigkeiten.push({ abschnittId: id, personId: 'p1', teamId: 'team1' });
      const bewertung: Bewertung = {
        abschnittId: id,
        teamId: 'team1',
        team: { t1: 10, t2: 10, t3: 8, t4: 6, t5: 6, t6: 5 },
        prozess: {},
        individuell: {},
        peer: {},
        notiz: '',
      };
      daten.bewertungen.push(bewertung);
      bewertungen.set(bewertungsSchluessel(id, 'team1'), bewertung);
    });
    return { daten, bewertungen };
  }

  it('legt die drei vorgesehenen Stichtage an (AK-4)', () => {
    expect(STICHTAGE.map((s) => s.name)).toEqual([
      'Semesterzeugnis',
      'Frühwarnung',
      'Jahreszeugnis',
    ]);
    expect(STICHTAGE.map((s) => s.bis)).toEqual(['2027-01-31', '2027-04-30', '2027-06-10']);
  });

  it('leitet das Schuljahr aus dem Datum ab – der Jänner gehört zum Vorjahr', () => {
    expect(schuljahrVon(new Date(2026, 8, 15))).toBe(2026);
    expect(schuljahrVon(new Date(2027, 0, 15))).toBe(2026);
  });

  it('lässt einen Zeugnis-Stichtag beim vorherigen Zeugnis beginnen', () => {
    const { daten } = bestandMitDaten();
    expect(zeitraumVon(daten, 'stichtag-semester')).toEqual({ von: null, bis: '2027-01-31' });
    expect(zeitraumVon(daten, 'stichtag-jahr')).toEqual({
      von: '2027-01-31',
      bis: '2027-06-10',
    });
  });

  it('erzeugt für die Frühwarnung keinen eigenen Zeitraum, sondern wertet den laufenden aus (AK-5)', () => {
    const { daten } = bestandMitDaten();
    // Beginn wie beim Jahreszeugnis – nicht beim Semesterende plus eins.
    expect(zeitraumVon(daten, 'stichtag-fruehwarnung')).toEqual({
      von: '2027-01-31',
      bis: '2027-04-30',
    });
  });

  it('ohne Stichtag bleibt der Zeitraum offen', () => {
    const { daten } = bestandMitDaten();
    expect(zeitraumVon(daten, null)).toEqual({ von: null, bis: null });
    expect(zeitraumVon(daten, 'gibtesnicht')).toEqual({ von: null, bis: null });
  });

  it('schränkt die Auswertung auf die bis dahin abgeschlossenen Abschnitte ein (AK-1)', () => {
    const { daten, bewertungen } = bestandMitDaten();
    const semester = gesamtErgebnis(daten, person('p1'), bewertungen, 'stichtag-semester');
    expect(semester.praxis.abschnitte.map((e) => e.abschnitt.id)).toEqual(['s1', 's2']);

    const jahr = gesamtErgebnis(daten, person('p1'), bewertungen, 'stichtag-jahr');
    expect(jahr.praxis.abschnitte.map((e) => e.abschnitt.id)).toEqual(['s3', 's4']);

    const fruehwarnung = gesamtErgebnis(daten, person('p1'), bewertungen, 'stichtag-fruehwarnung');
    expect(fruehwarnung.praxis.abschnitte.map((e) => e.abschnitt.id)).toEqual(['s3']);
  });

  it('lässt die Abschnitte nach dem Stichtag im Bestand (AK-2)', () => {
    const { daten, bewertungen } = bestandMitDaten();
    gesamtErgebnis(daten, person('p1'), bewertungen, 'stichtag-semester');
    expect(daten.abschnitte).toHaveLength(4);
    expect(daten.bewertungen).toHaveLength(4);
  });

  it('bestimmt den Zeitfaktor innerhalb des Zeitraums neu (FA-54 AK-3)', () => {
    const { daten, bewertungen } = bestandMitDaten();
    // Ohne Stichtag: vier Abschnitte → 1 1 2 2.
    expect(
      gesamtErgebnis(daten, person('p1'), bewertungen).praxis.abschnitte.map((e) => e.zeitfaktor),
    ).toEqual([1, 1, 2, 2]);
    // Im Semester nur zwei → 1 2. Der Zeitfaktor ist eine Aussage über die
    // Lage im Zeitraum, nicht im Schuljahr.
    expect(
      gesamtErgebnis(daten, person('p1'), bewertungen, 'stichtag-semester').praxis.abschnitte.map(
        (e) => e.zeitfaktor,
      ),
    ).toEqual([1, 2]);
  });

  it('lässt Abschnitte ohne Enddatum aus und meldet sie (FA-48)', () => {
    const { daten, bewertungen } = bestandMitDaten();
    daten.abschnitte[1].bis = '';
    const semester = gesamtErgebnis(daten, person('p1'), bewertungen, 'stichtag-semester');
    expect(semester.praxis.abschnitte.map((e) => e.abschnitt.id)).toEqual(['s1']);
    expect(semester.auslassung.ohneDatum.map((a) => a.id)).toEqual(['s2']);
  });

  it('meldet ohne Stichtag keine Auslassung – dann zählt alles', () => {
    const { daten, bewertungen } = bestandMitDaten();
    daten.abschnitte[1].bis = '';
    const alles = gesamtErgebnis(daten, person('p1'), bewertungen);
    expect(alles.praxis.abschnitte).toHaveLength(4);
    expect(alles.auslassung.ohneDatum).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */
/* Gesetzte Werte in der Rechnung (FA-50, FA-49)                              */
/* -------------------------------------------------------------------------- */

describe('Gesetzte Werte in der Rechnung (FA-50)', () => {
  const team = [person('p1'), person('p2')];

  function bewertungMitGesetzt(gesetzt: Bewertung['gesetzt']): Bewertung {
    const b = leereBewertung();
    b.team = { t1: 8, t2: 7.5, t3: 5, t4: 4, t5: 5, t6: 4 }; // 74,44 %
    b.prozess = { p1: 4, p2: 3, p3: 4, p4: 5, p5: 4 }; // 80 %
    b.individuell = { p1: { punkte: { i1: 6, i2: 6, i3: 5, i4: 4 }, notiz: '' } }; // 70 %
    b.gesetzt = gesetzt;
    return b;
  }

  it('lässt ein gesetztes Kategorieergebnis für alles darüber gelten (AK-3)', () => {
    // Die dritte Variante des Rechenbeispiels aus Solution-Design 6.8:
    // Individuell auf 85 % gesetzt → (45·74,44 + 20·80 + 35·85)/100 = 79,25 %.
    // Das Dokument nannte hier 79,0 %; der Fehler fiel bei diesem Test auf und
    // ist am 11.09.2026 berichtigt worden.
    const b = bewertungMitGesetzt({
      kategorie: { individuell: { prozent: 85, begruendung: '', gesetztAm: '2027-01-20T10:00:00.000Z' } },
    });
    const ergebnis = ergebnisAusRubrik(b, person('p1'), team, rubrik(), false);
    expect(ergebnis.individuell!.prozent).toBe(85);
    expect(ergebnis.prozent).toBeCloseTo(79.25, 2);
  });

  it('behält den berechneten Wert daneben (AK-2, G9)', () => {
    const b = bewertungMitGesetzt({
      kategorie: { individuell: { prozent: 85, begruendung: '', gesetztAm: '2027-01-20T10:00:00.000Z' } },
    });
    const ergebnis = ergebnisAusRubrik(b, person('p1'), team, rubrik(), false);
    expect(ergebnis.individuell!.prozentBerechnet).toBeCloseTo(70, 10);
    expect(ergebnis.individuell!.gesetzt!.prozent).toBe(85);
  });

  it('setzt eine Kategorie auch dann, wenn darunter nichts erfasst ist (AK-1)', () => {
    const b = leereBewertung();
    b.gesetzt = {
      kategorie: { team: { prozent: 60, begruendung: '', gesetztAm: '2027-01-20T10:00:00.000Z' } },
    };
    const ergebnis = ergebnisAusRubrik(b, person('p1'), team, rubrik(), false);
    expect(ergebnis.team!.prozent).toBe(60);
    expect(ergebnis.team!.prozentBerechnet).toBeNull();
    expect(ergebnis.prozent).toBeCloseTo(60, 10);
  });

  it('lässt ein gesetztes Abschnittsergebnis die Kategorien überstimmen (AK-3)', () => {
    const b = bewertungMitGesetzt({
      abschnittsergebnis: { p1: { prozent: 90, begruendung: 'Krankheit', gesetztAm: '2027-01-20T10:00:00.000Z' } },
    });
    const ergebnis = ergebnisAusRubrik(b, person('p1'), team, rubrik(), false);
    expect(ergebnis.prozent).toBe(90);
    expect(ergebnis.prozentBerechnet).toBeCloseTo(74.0, 1);
    expect(ergebnis.gesetzt!.begruendung).toBe('Krankheit');
  });

  it('gilt nur für die Person, für die er gesetzt wurde', () => {
    const b = bewertungMitGesetzt({
      abschnittsergebnis: { p1: { prozent: 90, begruendung: '', gesetztAm: '2027-01-20T10:00:00.000Z' } },
    });
    expect(ergebnisAusRubrik(b, person('p2'), team, rubrik(), false).gesetzt).toBeNull();
  });

  it('TF-G: ein gesetzter Wert löscht den gerechneten nicht (FA-50 AK-2)', () => {
    // Aus docs/testfaelle-notenfindung.md Kap. 6: TF-G bekommt zwei Tests.
    const b = leereBewertung();
    b.team = { t1: 3 }; // niedrig gerechnet
    b.gesetzt = {
      abschnittsergebnis: { p1: { prozent: 84, begruendung: 'Einbruch war Krankheit', gesetztAm: '2027-01-20T10:00:00.000Z' } },
    };
    const ergebnis = ergebnisAusRubrik(b, person('p1'), team, rubrik(), false);
    expect(ergebnis.prozent).toBe(84);
    expect(ergebnis.prozentBerechnet).not.toBe(null);
    expect(ergebnis.prozentBerechnet).toBeLessThan(84);
  });
});

describe('Gesetzter Gesamtstand und Notenstand (FA-49, FA-50)', () => {
  function bestandMitStand() {
    const daten = leererDatenbestand();
    daten.klassen.push({ id: 'k1', name: '4AHIF' });
    daten.personen.push(person('p1', null));
    return daten;
  }

  it('lässt einen gesetzten Gesamtstand gelten und behält den gerechneten', () => {
    const daten = bestandMitStand();
    daten.gesamtstand['gesamter-durchgang'] = {
      p1: { prozent: 88, begruendung: '', gesetztAm: '2027-06-05T10:00:00.000Z' },
    };
    const ergebnis = gesamtErgebnis(daten, person('p1', null), new Map());
    expect(ergebnis.prozent).toBe(88);
    // Ohne Abschnitte gibt es nichts zu rechnen – der gesetzte Wert steht für sich.
    expect(ergebnis.prozentBerechnet).toBeNull();
  });

  it('führt gesetzte Werte je Stichtag getrennt (FA-49 AK-5)', () => {
    const daten = bestandMitStand();
    daten.stichtage = vorlageStichtage(2026);
    daten.gesamtstand['stichtag-semester'] = {
      p1: { prozent: 62, begruendung: '', gesetztAm: '2027-01-31T10:00:00.000Z' },
    };
    expect(gesamtErgebnis(daten, person('p1', null), new Map(), 'stichtag-semester').prozent).toBe(62);
    expect(gesamtErgebnis(daten, person('p1', null), new Map(), 'stichtag-jahr').prozent).toBeNull();
  });

  it('reicht den Notenstand des Stichtags durch (FA-49)', () => {
    const daten = bestandMitStand();
    daten.notenstaende['gesamter-durchgang'] = {
      p1: { note: 2, begruendung: 'Verlauf steigend', gesetztAm: '2027-06-05T10:00:00.000Z' },
    };
    const ergebnis = gesamtErgebnis(daten, person('p1', null), new Map());
    expect(ergebnis.notenstand!.note).toBe(2);
  });

  it('erkennt eine Abweichung zwischen Notenstand und Vorschlag (AK-3)', () => {
    const vorschlag = { note: 3, gesperrtDurch: null, ohneSperre: 3 };
    const stand = { note: 2 as const, begruendung: '', gesetztAm: '2027-06-05T10:00:00.000Z' };
    expect(notenstandWeichtAb(stand, vorschlag)).toBe(true);
    expect(notenstandWeichtAb({ ...stand, note: 3 }, vorschlag)).toBe(false);
    expect(notenstandWeichtAb(null, vorschlag)).toBe(false);
    // Ohne Vorschlag gibt es nichts, wovon abgewichen werden könnte.
    expect(notenstandWeichtAb(stand, { note: null, gesperrtDurch: null, ohneSperre: null })).toBe(false);
  });
});

describe('Tendenz und offene Kategorien (FA-51)', () => {
  function verlaufEintraege(werte: Array<number | null>) {
    return werte.map((prozent, i) => ({
      abschnitt: {
        id: `s${i + 1}`,
        klasseId: 'k1',
        nummer: i + 1,
        name: `Sprint ${i + 1}`,
        art: 'sprint' as const,
        strang: 'praxis' as const,
        rubrikId: RUBRIK_SPRINT,
        von: '',
        bis: '',
        faktor: 1,
        peerAktiv: false,
      },
      ergebnis: {
        prozent,
        prozentBerechnet: prozent,
        gesetzt: null,
        prozentVorKorrektur: prozent,
        korrektur: 0,
        team: null,
        prozess: null,
        individuell: null,
        peer: null,
        selbst: null,
        fehlend: [] as string[],
      },
      zeitfaktor: 1,
    }));
  }

  it('liest aus einem einzigen Abschnitt keine Richtung ab', () => {
    expect(tendenz(verlaufEintraege([70]))).toBeNull();
    expect(tendenz([])).toBeNull();
  });

  it('erkennt eine steigende und eine fallende Entwicklung', () => {
    expect(tendenz(verlaufEintraege([50, 55, 75]))).toBe('steigend');
    expect(tendenz(verlaufEintraege([80, 78, 55]))).toBe('fallend');
  });

  it('nennt kleine Schwankungen keine Tendenz', () => {
    expect(tendenz(verlaufEintraege([70, 72, 74]))).toBe('gleich');
    // Die Schwelle an zwei Abschnitten, wo die Hälften je ein Wert sind:
    // 4,9 Prozentpunkte sind noch gleichbleibend, 5 sind eine Tendenz.
    expect(tendenz(verlaufEintraege([70, 74.9]))).toBe('gleich');
    expect(tendenz(verlaufEintraege([70, 75]))).toBe('steigend');
    expect(tendenz(verlaufEintraege([75, 70]))).toBe('fallend');
  });

  it('lässt sich von einem einzelnen Ausfall nicht umdrehen (TF-F, TF-G)', () => {
    // Derselbe Vorfall früh und spät – beide Male ist der Verlauf im Kern
    // unverändert. Ein Vergleich des letzten Werts mit dem Mittel der früheren
    // meldete hier „steigend“ beziehungsweise „fallend“.
    expect(tendenz(verlaufEintraege([30, 80, 82, 85, 83, 86, 84, 85]))).toBe('gleich');
    expect(tendenz(verlaufEintraege([85, 84, 86, 83, 85, 82, 30, 84]))).toBe('gleich');
  });

  it('trifft die neun Verläufe aus dem Testfalldokument', () => {
    const erwartet: Array<[string, number[], string]> = [
      ['TF-A', [85, 85, 85, 85, 85, 85, 85, 85], 'gleich'],
      ['TF-B', [45, 50, 60, 68, 75, 82, 88, 90], 'steigend'],
      ['TF-C', [90, 88, 82, 75, 68, 60, 50, 45], 'fallend'],
      ['TF-D', [80, 82, 80, 83, 81, 40, 35, 30], 'fallend'],
      ['TF-E', [50, 48, 52, 50, 55, 75, 88, 92], 'steigend'],
      ['TF-F', [30, 80, 82, 85, 83, 86, 84, 85], 'gleich'],
      ['TF-G', [85, 84, 86, 83, 85, 82, 30, 84], 'gleich'],
      ['TF-H', [80, 45, 85, 50, 78, 48, 82, 52], 'gleich'],
      ['TF-I', [55, 54, 56, 55, 53, 56, 55, 54], 'gleich'],
    ];
    for (const [name, werte, richtung] of erwartet) {
      expect([name, tendenz(verlaufEintraege(werte))]).toEqual([name, richtung]);
    }
  });

  it('lässt nicht bewertete Abschnitte aus', () => {
    expect(tendenz(verlaufEintraege([50, null, null, 80]))).toBe('steigend');
    expect(tendenz(verlaufEintraege([null, 70]))).toBeNull();
  });

  it('sammelt die offenen Kategorien ohne Wiederholung', () => {
    const eintraege = verlaufEintraege([70, 80]);
    eintraege[0].ergebnis.fehlend = ['Scrum-Prozess', 'Individueller Beitrag'];
    eintraege[1].ergebnis.fehlend = ['Scrum-Prozess'];
    expect(offeneKategorien(eintraege)).toEqual(['Scrum-Prozess', 'Individueller Beitrag']);
  });
});

describe('Verstehensnachweis im individuellen Beitrag (FA-40)', () => {
  const team = [person('p1'), person('p2')];

  function mitNachweis(stufe: Verstehensstufe | null, punkte = true): Bewertung {
    const b = leereBewertung();
    b.individuell = {
      p1: {
        punkte: punkte ? { i1: 10, i2: 8, i3: 6, i4: 6 } : {}, // 100 %
        notiz: '',
        ...(stufe ? { verstehen: { stufe, notiz: '', gesetztAm: '2026-11-14T10:00:00.000Z' } } : {}),
      },
    };
    return b;
  }

  it('lässt die Kategorie unverändert, solange kein Nachweis vorliegt (AK-3)', () => {
    const ergebnis = ergebnisAusRubrik(mitNachweis(null), person('p1'), team, rubrik(), false);
    expect(ergebnis.individuell!.prozent).toBe(100);
  });

  it('mischt Kriterien und Nachweis im Verhältnis 70 zu 30 (AK-2)', () => {
    // Kriterien 100 %, Nachweis „teilweise“ = 33,3 % → 0,7·100 + 0,3·33,3 = 80 %.
    const ergebnis = ergebnisAusRubrik(
      mitNachweis('teilweise'),
      person('p1'),
      team,
      rubrik(),
      false,
    );
    expect(ergebnis.individuell!.prozent).toBeCloseTo(80, 6);
  });

  it('bildet die vier Stufen auf 100, 67, 33 und 0 Prozent ab (AK-1)', () => {
    const werte = (['sicher', 'ueberwiegend', 'teilweise', 'nicht'] as const).map(
      (stufe) =>
        mitVerstehensnachweis(
          { prozent: 0, prozentBerechnet: 0, gesetzt: null, erreicht: 0, moeglich: 1, ausgefuellt: 1, gesamt: 1 },
          { stufe, notiz: '', gesetztAm: '2026-11-14T10:00:00.000Z' },
          100,
        )!.prozent,
    );
    expect(werte[0]).toBe(100);
    expect(werte[1]).toBeCloseTo(66.667, 3);
    expect(werte[2]).toBeCloseTo(33.333, 3);
    expect(werte[3]).toBe(0);
  });

  it('trägt die Kategorie allein, wenn nur der Nachweis vorliegt', () => {
    const ergebnis = ergebnisAusRubrik(
      mitNachweis('sicher', false),
      person('p1'),
      team,
      rubrik(),
      false,
    );
    expect(ergebnis.individuell!.prozent).toBe(100);
  });

  it('ist einstellbar; bei 0 bleibt die Kategorie unberührt (AK-2)', () => {
    const ohne = ergebnisAusRubrik(mitNachweis('nicht'), person('p1'), team, rubrik(), false, 5, 0);
    expect(ohne.individuell!.prozent).toBe(100);
    const halb = ergebnisAusRubrik(mitNachweis('nicht'), person('p1'), team, rubrik(), false, 5, 50);
    expect(halb.individuell!.prozent).toBe(50);
  });

  it('wird von einem gesetzten Wert überstimmt (FA-50 AK-3)', () => {
    const b = mitNachweis('nicht');
    b.gesetzt = {
      kategorie: { individuell: { prozent: 90, begruendung: '', gesetztAm: '2026-11-14T10:00:00.000Z' } },
    };
    const ergebnis = ergebnisAusRubrik(b, person('p1'), team, rubrik(), false);
    expect(ergebnis.individuell!.prozent).toBe(90);
    // Der gerechnete Wert daneben enthält den Nachweis.
    expect(ergebnis.individuell!.prozentBerechnet).toBeCloseTo(70, 6);
  });
});

describe('Rubrik angleichen (FA-47)', () => {
  /** Ein bewerteter Abschnitt mit eingefrorener Rubrik. */
  function lage(): { daten: Datenbestand; bewertungen: Map<string, Bewertung> } {
    const daten = leererDatenbestand();
    daten.klassen.push({ id: 'k1', name: '4AHIF' });
    daten.teams.push({ id: 'team1', klasseId: 'k1', name: 'Team Kepler' });
    daten.personen.push(person('p1'));
    const kopie = strukturKopie(VORLAGE_RUBRIK_SPRINT);
    daten.abschnitte.push({
      id: 's1',
      klasseId: 'k1',
      nummer: 1,
      name: 'Sprint 1',
      art: 'sprint',
      strang: 'praxis',
      rubrikId: RUBRIK_SPRINT,
      rubrikKopie: kopie,
      eingefrorenAm: '2026-10-24T10:00:00.000Z',
      von: '',
      bis: '',
      faktor: 1,
      peerAktiv: false,
    });
    daten.zugehoerigkeiten.push({ abschnittId: 's1', personId: 'p1', teamId: 'team1' });
    const bewertung: Bewertung = {
      abschnittId: 's1',
      teamId: 'team1',
      team: { t1: 8 },
      prozess: {},
      individuell: {},
      peer: {},
      notiz: '',
    };
    daten.bewertungen.push(bewertung);
    return { daten, bewertungen: new Map([['s1__team1', bewertung]]) };
  }

  function aktuelleRubrik(daten: Datenbestand) {
    return daten.rubriken.find((r) => r.id === RUBRIK_SPRINT)!;
  }

  it('meldet nichts, solange die Rubrik unverändert ist', () => {
    const { daten, bewertungen } = lage();
    expect(angleichungsVorschau(daten, RUBRIK_SPRINT, bewertungen)).toEqual([]);
  });

  it('erkennt eine reine Textänderung als folgenlos (AK-3)', () => {
    const { daten, bewertungen } = lage();
    aktuelleRubrik(daten).team[0].name = 'Funktionsumfang';
    aktuelleRubrik(daten).team[1].beschreibung = 'neu formuliert';
    const vorschau = angleichungsVorschau(daten, RUBRIK_SPRINT, bewertungen);
    expect(vorschau).toHaveLength(1);
    expect(vorschau[0].nurTexte).toBe(true);
    expect(angleichungAendertWerte(vorschau)).toBe(false);
  });

  it('zeigt die Änderung der Prozentwerte je Person (AK-2)', () => {
    const { daten, bewertungen } = lage();
    // Das Maximum des bewerteten Kriteriums halbieren: 8 von 5 wird gekappt.
    aktuelleRubrik(daten).team[0].max = 5;
    const vorschau = angleichungsVorschau(daten, RUBRIK_SPRINT, bewertungen);
    expect(vorschau[0].nurTexte).toBe(false);
    expect(vorschau[0].folgen[0].vorher).toBeCloseTo(80, 6);
    expect(vorschau[0].folgen[0].nachher).toBe(100);
    expect(angleichungAendertWerte(vorschau)).toBe(true);
  });

  it('erkennt auch eine geänderte Gewichtung als wertverändernd', () => {
    const { daten, bewertungen } = lage();
    aktuelleRubrik(daten).gewichte.team = 10;
    expect(angleichungsVorschau(daten, RUBRIK_SPRINT, bewertungen)[0].nurTexte).toBe(false);
  });

  it('lässt Abschnitte ohne eingefrorene Kopie außen vor (FA-65)', () => {
    const { daten, bewertungen } = lage();
    delete daten.abschnitte[0].rubrikKopie;
    aktuelleRubrik(daten).team[0].name = 'Funktionsumfang';
    // Dort wirkt die Änderung ohnehin – es gibt nichts anzugleichen.
    expect(angleichungsVorschau(daten, RUBRIK_SPRINT, bewertungen)).toEqual([]);
  });

  it('verändert bei der Vorschau nichts (AK-1)', () => {
    const { daten, bewertungen } = lage();
    aktuelleRubrik(daten).team[0].max = 5;
    const vorher = JSON.stringify(daten);
    angleichungsVorschau(daten, RUBRIK_SPRINT, bewertungen);
    expect(JSON.stringify(daten)).toBe(vorher);
  });
});

/* -------------------------------------------------------------------------- */
/* Zeitraum und Kriterien je Team (FA-66, FA-67, FA-69)                        */
/* -------------------------------------------------------------------------- */

describe('Stichtagszuordnung über das Teamende (FA-48 AK-6a, FA-66)', () => {
  /** Ein Sprint, zwei Teams, verschiedene Enddaten um den Stichtag herum. */
  function zweiTeams() {
    const daten = leererDatenbestand();
    daten.stichtage = strukturKopie(vorlageStichtage(2026));
    daten.klassen.push({ id: 'k1', name: '4AHIF' });
    daten.teams.push({ id: 'team1', klasseId: 'k1', name: 'Kepler' });
    daten.teams.push({ id: 'team2', klasseId: 'k1', name: 'Doppler' });
    daten.personen.push(person('p1', 'team1'), person('p2', 'team2'));
    daten.abschnitte.push({
      id: 's1',
      klasseId: 'k1',
      nummer: 1,
      name: 'Sprint 1',
      art: 'sprint',
      strang: 'praxis',
      rubrikId: RUBRIK_SPRINT,
      von: '2027-01-07',
      bis: '2027-01-28',
      faktor: 1,
      peerAktiv: false,
    });
    daten.zugehoerigkeiten.push(
      { abschnittId: 's1', personId: 'p1', teamId: 'team1' },
      { abschnittId: 's1', personId: 'p2', teamId: 'team2' },
    );
    // Kepler ist vor dem Semesterzeugnis fertig, Doppler danach.
    daten.teamabschnitte.push(
      { abschnittId: 's1', teamId: 'team1', ziel: 'Buchung', von: '2027-01-07', bis: '2027-01-28' },
      { abschnittId: 's1', teamId: 'team2', ziel: 'Storno', von: '2027-01-07', bis: '2027-02-03' },
    );
    const bewertungen = new Map<string, Bewertung>();
    for (const teamId of ['team1', 'team2']) {
      const bewertung: Bewertung = {
        abschnittId: 's1',
        teamId,
        team: { t1: 10, t2: 10, t3: 8, t4: 6, t5: 6, t6: 5 },
        prozess: {},
        individuell: {},
        peer: {},
        notiz: '',
      };
      daten.bewertungen.push(bewertung);
      bewertungen.set(bewertungsSchluessel('s1', teamId), bewertung);
    }
    return { daten, bewertungen };
  }

  it('zählt denselben Sprint für ein Team ins Semester und für das andere nicht', () => {
    const { daten, bewertungen } = zweiTeams();
    const kepler = gesamtErgebnis(daten, daten.personen[0], bewertungen, 'stichtag-semester');
    const doppler = gesamtErgebnis(daten, daten.personen[1], bewertungen, 'stichtag-semester');
    expect(kepler.praxis.abschnitte.map((e) => e.abschnitt.id)).toEqual(['s1']);
    expect(doppler.praxis.abschnitte).toEqual([]);
  });

  it('nimmt ohne Planung den Rahmen des Abschnitts (FA-66 AK-3)', () => {
    const { daten, bewertungen } = zweiTeams();
    daten.teamabschnitte = [];
    const doppler = gesamtErgebnis(daten, daten.personen[1], bewertungen, 'stichtag-semester');
    expect(doppler.praxis.abschnitte.map((e) => e.abschnitt.id)).toEqual(['s1']);
  });

  it('meldet ein Team ohne Enddatum als Auslassung (FA-66 AK-4)', () => {
    const { daten, bewertungen } = zweiTeams();
    daten.abschnitte[0].bis = '';
    daten.teamabschnitte[1].bis = '';
    const doppler = gesamtErgebnis(daten, daten.personen[1], bewertungen, 'stichtag-semester');
    expect(doppler.auslassung.ohneDatum.map((a) => a.id)).toEqual(['s1']);
    // Für das andere Team ist nichts ausgelassen.
    const kepler = gesamtErgebnis(daten, daten.personen[0], bewertungen, 'stichtag-semester');
    expect(kepler.auslassung.ohneDatum).toEqual([]);
  });

  it('weist abweichende Kriterien aus, wo Teams verglichen werden (FA-67 AK-6)', () => {
    const { daten } = zweiTeams();
    expect(kriterienWeichenAb(daten, daten.abschnitte[0])).toBe(false);

    const eigene = strukturKopie(VORLAGE_RUBRIK_SPRINT);
    eigene.team = eigene.team.filter((k) => k.id !== 't3');
    daten.teamabschnitte[1].rubrikKopie = eigene;
    expect(kriterienWeichenAb(daten, daten.abschnitte[0])).toBe(true);
    expect(abschnitteMitAbweichung(daten, daten.abschnitte).map((a) => a.id)).toEqual(['s1']);
  });

  it('nennt eine andere Beschreibung keine Abweichung (FA-67 AK-6)', () => {
    const { daten } = zweiTeams();
    const eigene = strukturKopie(VORLAGE_RUBRIK_SPRINT);
    eigene.team[0].beschreibung = 'anders formuliert';
    daten.teamabschnitte[1].rubrikKopie = eigene;
    expect(kriterienWeichenAb(daten, daten.abschnitte[0])).toBe(false);
  });
});

describe('Vorlage für den Vorbereitungssprint (FA-69)', () => {
  it('trägt die sechs vereinbarten Ergebnisse mit zusammen 50 Punkten (AK-4)', () => {
    expect(VORLAGE_RUBRIK_VORBEREITUNG.team.map((k) => k.name)).toEqual([
      'Fachliches Konzept',
      'Anforderungsspezifikation',
      'Solution-Design',
      'CI/CD',
      'Stakeholderanalyse',
      'Versionsverwaltung',
    ]);
    expect(VORLAGE_RUBRIK_VORBEREITUNG.team.reduce((s, k) => s + k.max, 0)).toBe(50);
  });

  it('übernimmt Prozess, individuellen Beitrag und Peer wörtlich aus der Sprint-Rubrik (AK-5)', () => {
    for (const kategorie of ['prozess', 'individuell', 'peer'] as const) {
      expect(VORLAGE_RUBRIK_VORBEREITUNG[kategorie]).toEqual(VORLAGE_RUBRIK_SPRINT[kategorie]);
    }
  });

  it('gewichtet den Prozess niedriger, weil er erst entsteht (AK-6)', () => {
    expect(VORLAGE_RUBRIK_VORBEREITUNG.gewichte).toEqual({
      team: 50,
      prozess: 15,
      individuell: 35,
      peer: 0,
    });
  });

  it('wird mit ausgeliefert (AK-1)', () => {
    expect(vorlagenRubriken().map((r) => r.name)).toContain('Vorbereitungssprint');
  });
});
