import { describe, expect, it } from 'vitest';

import { VORLAGE_RUBRIK, strukturKopie } from './defaults';
import {
  ABWEICHUNG_SCHWELLE,
  bewertungsSchluessel,
  gesamtErgebnis,
  kategorieErgebnis,
  note,
  peerErgebnis,
  peerWertInProzent,
  selbstEinschaetzung,
  selbstbildAbweichung,
  sprintErgebnis,
} from './scoring';
import type { Bewertung, Kriterium, Person, Rubrik, Sprint } from './types';

/* -------------------------------------------------------------------------- */
/* Testdaten                                                                  */
/* -------------------------------------------------------------------------- */

const KRITERIEN: Kriterium[] = [
  { id: 'a', name: 'A', beschreibung: '', max: 10 },
  { id: 'b', name: 'B', beschreibung: '', max: 5 },
  { id: 'c', name: 'C', beschreibung: '', max: 5 },
];

function person(id: string, teamId: string | null = 'team1'): Person {
  return { id, klasseId: 'k1', teamId, name: id };
}

function leereBewertung(sprintId = 's1', teamId = 'team1'): Bewertung {
  return { sprintId, teamId, team: {}, prozess: {}, individuell: {}, peer: {}, notiz: '' };
}

function sprint(id: string, nummer: number, faktor = 1): Sprint {
  return { id, klasseId: 'k1', nummer, name: `Sprint ${nummer}`, von: '', bis: '', faktor };
}

function rubrik(aenderung: Partial<Rubrik> = {}): Rubrik {
  return { ...strukturKopie(VORLAGE_RUBRIK), ...aenderung };
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
/* FA-23 Sprintergebnis                                                       */
/* -------------------------------------------------------------------------- */

describe('sprintErgebnis (FA-23, FA-26)', () => {
  const team = [person('p1'), person('p2')];

  it('rechnet das dokumentierte Beispiel aus dem Solution-Design nach (NFA-02)', () => {
    // Team 33,5/45 = 74,44 %, Prozess 20/25 = 80 %, Individuell 21/30 = 70 %,
    // Peer Mittelwert 4,25 → 81,25 %. Gewichte 40/15/35/10 → 74,4 %.
    const b = leereBewertung();
    b.team = { t1: 8, t2: 7.5, t3: 5, t4: 4, t5: 5, t6: 4 };
    b.prozess = { p1: 4, p2: 3, p3: 4, p4: 5, p5: 4 };
    b.individuell = { p1: { punkte: { i1: 6, i2: 6, i3: 5, i4: 4 }, notiz: '' } };
    b.peer = { p2: { p1: { q1: 5, q2: 4, q3: 4, q4: 4 } } };

    const ergebnis = sprintErgebnis(b, person('p1'), team, rubrik());
    expect(ergebnis.team!.prozent).toBeCloseTo(74.444, 2);
    expect(ergebnis.prozess!.prozent).toBeCloseTo(80, 10);
    expect(ergebnis.individuell!.prozent).toBeCloseTo(70, 10);
    expect(ergebnis.peer!.prozent).toBeCloseTo(81.25, 10);
    expect(ergebnis.prozent).toBeCloseTo(74.4, 1);
    expect(note(ergebnis.prozent, VORLAGE_RUBRIK.notenschluessel)).toBe(3);
  });

  it('rechnet fehlende Kategorien aus der Gewichtung heraus statt sie als 0 zu werten', () => {
    const b = leereBewertung();
    b.team = { t1: 10, t2: 10, t3: 8, t4: 6, t5: 6, t6: 5 }; // 100 %
    const ergebnis = sprintErgebnis(b, person('p1'), team, rubrik());
    expect(ergebnis.prozent).toBe(100);
    expect(ergebnis.fehlend).toEqual([
      'Scrum-Prozess',
      'Individueller Beitrag',
      'Peer-Bewertung',
    ]);
  });

  it('nimmt Kategorien mit Gewicht 0 aus der Berechnung, ohne sie als fehlend zu melden (FA-07)', () => {
    const b = leereBewertung();
    b.team = { t1: 10, t2: 10, t3: 8, t4: 6, t5: 6, t6: 5 };
    b.prozess = { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 };
    const r = rubrik({ gewichte: { team: 100, prozess: 0, individuell: 0, peer: 0 } });
    const ergebnis = sprintErgebnis(b, person('p1'), team, r);
    expect(ergebnis.prozent).toBe(100);
    expect(ergebnis.fehlend).toEqual([]);
  });

  it('liefert kein Ergebnis, solange nichts erfasst ist', () => {
    const ergebnis = sprintErgebnis(undefined, person('p1'), team, rubrik());
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
    const eins = sprintErgebnis(b, person('p1'), team, rubrik());
    const zwei = sprintErgebnis(b, person('p2'), team, rubrik());
    expect(eins.prozent).toBeGreaterThan(zwei.prozent!);
  });
});

/* -------------------------------------------------------------------------- */
/* FA-24 Gesamtergebnis                                                       */
/* -------------------------------------------------------------------------- */

describe('gesamtErgebnis (FA-24)', () => {
  const team = [person('p1')];
  const r = rubrik({ gewichte: { team: 100, prozess: 0, individuell: 0, peer: 0 } });

  function bestandMit(werte: Array<{ sprintId: string; punkte: number }>): Map<string, Bewertung> {
    const map = new Map<string, Bewertung>();
    for (const eintrag of werte) {
      const b = leereBewertung(eintrag.sprintId);
      b.team = { t1: eintrag.punkte }; // max 10
      map.set(bewertungsSchluessel(eintrag.sprintId, 'team1'), b);
    }
    return map;
  }

  it('gewichtet Sprints mit ihrem Faktor', () => {
    const sprints = [sprint('s1', 1, 0.5), sprint('s2', 2, 1)];
    const bewertungen = bestandMit([
      { sprintId: 's1', punkte: 4 }, // 40 %
      { sprintId: 's2', punkte: 10 }, // 100 %
    ]);
    // (0,5·40 + 1·100) / 1,5 = 80
    expect(gesamtErgebnis(person('p1'), sprints, team, bewertungen, r).prozent).toBeCloseTo(80, 10);
  });

  it('lässt Sprints ohne Daten unberücksichtigt', () => {
    const sprints = [sprint('s1', 1), sprint('s2', 2)];
    const bewertungen = bestandMit([{ sprintId: 's1', punkte: 9 }]);
    expect(gesamtErgebnis(person('p1'), sprints, team, bewertungen, r).prozent).toBeCloseTo(90, 10);
  });

  it('lässt Sprints mit Faktor 0 unberücksichtigt', () => {
    const sprints = [sprint('s1', 1, 0), sprint('s2', 2, 1)];
    const bewertungen = bestandMit([
      { sprintId: 's1', punkte: 0 },
      { sprintId: 's2', punkte: 8 },
    ]);
    expect(gesamtErgebnis(person('p1'), sprints, team, bewertungen, r).prozent).toBeCloseTo(80, 10);
  });

  it('liefert null für Personen ohne Team', () => {
    const sprints = [sprint('s1', 1)];
    const bewertungen = bestandMit([{ sprintId: 's1', punkte: 10 }]);
    const ohneTeam = person('p9', null);
    expect(gesamtErgebnis(ohneTeam, sprints, team, bewertungen, r).prozent).toBeNull();
  });

  it('führt jedes Sprintergebnis einzeln mit', () => {
    const sprints = [sprint('s1', 1), sprint('s2', 2)];
    const bewertungen = bestandMit([{ sprintId: 's1', punkte: 5 }]);
    const ergebnis = gesamtErgebnis(person('p1'), sprints, team, bewertungen, r);
    expect(ergebnis.proSprint).toHaveLength(2);
    expect(ergebnis.proSprint[0].ergebnis.prozent).toBeCloseTo(50, 10);
    expect(ergebnis.proSprint[1].ergebnis.prozent).toBeNull();
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

  it('wendet dieselbe Rubrik unabhängig von Klasse und Team an (FA-10)', () => {
    const b = leereBewertung();
    b.team = { t1: 5 };
    const r = rubrik();
    const ausKlasseA = { ...person('p1'), klasseId: 'k1', teamId: 'team1' };
    const ausKlasseB = { ...person('p2'), klasseId: 'k2', teamId: 'team2' };
    expect(sprintErgebnis(b, ausKlasseA, [ausKlasseA], r).team!.prozent).toBe(
      sprintErgebnis(b, ausKlasseB, [ausKlasseB], r).team!.prozent,
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
    return sprintErgebnis(b, person('p1'), team, rubrik());
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
    const ohnePeer = sprintErgebnis(leereBewertung(), person('p1'), team, rubrik());
    expect(selbstbildAbweichung(ohnePeer)).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* FA-25 Note                                                                 */
/* -------------------------------------------------------------------------- */

describe('note (FA-25)', () => {
  const schluessel = VORLAGE_RUBRIK.notenschluessel;

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
