import { describe, expect, it } from 'vitest';

import {
  RUBRIK_SPRINT,
  STANDARD_NOTENSCHLUESSEL,
  VORLAGE_RUBRIK_SPRINT,
  leererDatenbestand,
  strukturKopie,
  testRubrik,
} from './defaults';
import {
  ABWEICHUNG_SCHWELLE,
  abschnittsErgebnis,
  abschnittAbgeschlossen,
  bewertungsSchluessel,
  datumDeutsch,
  ergebnisAusRubrik,
  gesamtErgebnis,
  kategorieErgebnis,
  note,
  peerErgebnis,
  peerFrageFaellig,
  peerWertInProzent,
  selbstEinschaetzung,
  selbstbildAbweichung,
  strangErgebnis,
} from './scoring';
import type {
  Abschnitt,
  Bewertung,
  Datenbestand,
  Kriterium,
  Person,
  Rubrik,
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
    // Gewichte 45/20/35 → 74,0 %. Der Peer-Anteil trägt kein Kategoriegewicht
    // mehr (ADR-007); als Korrekturfaktor kommt er erst mit FA-45.
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
    expect(ergebnis.prozent).toBeCloseTo(74.0, 1);
    expect(note(ergebnis.prozent, STANDARD_NOTENSCHLUESSEL)).toBe(3);
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
    expect(ergebnis.fehlend).toEqual(['Scrum-Prozess', 'Individueller Beitrag', 'Peer-Bewertung']);
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
    expect(ergebnis.fehlend).toHaveLength(4);
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

  it('gewichtet Abschnitte mit ihrem Faktor', () => {
    const daten = bestand();
    daten.abschnitte[0].faktor = 0.5;
    const bewertungen = mitPunkten(daten, [
      { abschnittId: 's1', teamPunkte: 4 }, // 40 %
      { abschnittId: 's2', teamPunkte: 10 }, // 100 %
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
