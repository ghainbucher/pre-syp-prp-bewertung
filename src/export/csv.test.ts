import { describe, expect, it } from 'vitest';

import { RUBRIK_SPRINT, leererDatenbestand, testRubrik } from '../domain/defaults';
import { bewertungsIndex, storeReducer, type Aktion } from '../store/storeReducer';
import type { Abschnitt, Datenbestand } from '../domain/types';
import { BOM, alsCsv, csvDateiname, uebersichtZeilen } from './csv';

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

/**
 * Eine Klasse mit einer Person, zwei Sprints (Praxis) und einem Test (Theorie).
 *
 * Bewertet sind Sprint 1 mit 8 von 10 Punkten (80 %) und der Test mit 6 von 10
 * Punkten (60 %). Bei 75 zu 25 ergibt das gesamt 75 %.
 */
function bestand(): Datenbestand {
  const aktionen: Aktion[] = [
    { art: 'klasse/anlegen', id: 'k1', name: '4 AHIF' },
    { art: 'team/anlegen', id: 'team1', klasseId: 'k1', name: 'Team Kepler' },
    {
      art: 'person/anlegen',
      klasseId: 'k1',
      teamId: 'team1',
      namen: [{ id: 'p1', name: 'Berger, Lena' }],
    },
    // Nur die Team-Kategorie trägt Gewicht – vor der ersten Erfassung gesetzt,
    // damit die eingefrorene Rubrik diese Gewichte hat (FA-65).
    { art: 'rubrik/gewicht', rubrikId: RUBRIK_SPRINT, kategorie: 'prozess', wert: 0 },
    { art: 'rubrik/gewicht', rubrikId: RUBRIK_SPRINT, kategorie: 'individuell', wert: 0 },
    { art: 'rubrik/gewicht', rubrikId: RUBRIK_SPRINT, kategorie: 'peer', wert: 0 },
    { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's1', nummer: 1, name: 'Sprint 1' }) },
    { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's2', nummer: 2, name: 'Sprint 2' }) },
    {
      art: 'abschnitt/anlegen',
      abschnitt: abschnitt({ id: 'x1', nummer: 3, name: 'Test 1', art: 'test', strang: 'theorie', rubrikId: 'rubrik-test-1' }),
      rubrik: testRubrik('rubrik-test-1', 'Test 1'),
    },
    { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 8 },
    { art: 'bewertung/individuell', abschnittId: 'x1', teamId: null, personId: 'p1', kriteriumId: 'f1', wert: 2 },
    { art: 'bewertung/individuell', abschnittId: 'x1', teamId: null, personId: 'p1', kriteriumId: 'f2', wert: 2 },
    { art: 'bewertung/individuell', abschnittId: 'x1', teamId: null, personId: 'p1', kriteriumId: 'f3', wert: 2 },
    { art: 'bewertung/individuell', abschnittId: 'x1', teamId: null, personId: 'p1', kriteriumId: 'f4', wert: 0 },
  ];
  return aktionen.reduce(storeReducer, leererDatenbestand());
}

function zeilen(daten = bestand(), abschnitte = daten.abschnitte) {
  return uebersichtZeilen({
    daten,
    klasseId: 'k1',
    personen: daten.personen,
    teams: daten.teams,
    abschnitte,
    bewertungen: bewertungsIndex(daten),
  });
}

describe('uebersichtZeilen (FA-31)', () => {
  it('schreibt eine Kopfzeile mit einer Spalte je Abschnitt und je Strang', () => {
    expect(zeilen()[0]).toEqual([
      'Name',
      'Team',
      'Sprint 1 (%)',
      'Sprint 2 (%)',
      'Test 1 (%)',
      'Praxis (%)',
      'Theorie (%)',
      'Gesamt (%)',
      'Notenvorschlag',
      'Sperre',
      'Notenstand',
    ]);
  });

  it('lässt nicht bewertete Abschnitte leer statt sie mit 0 zu füllen', () => {
    const [, datenzeile] = zeilen();
    expect(datenzeile[2]).toBe('80,0');
    expect(datenzeile[3]).toBe('');
  });

  it('weist die beiden Stränge getrennt aus (FA-59)', () => {
    const [, datenzeile] = zeilen();
    expect(datenzeile[4]).toBe('60,0');
    expect(datenzeile[5]).toBe('80,0');
    expect(datenzeile[6]).toBe('60,0');
  });

  it('gewichtet den Gesamtstand mit 75 zu 25 (FA-59 AK-3)', () => {
    expect(zeilen()[1][7]).toBe('75,0');
  });

  it('verwendet das Komma als Dezimaltrennzeichen', () => {
    expect(String(zeilen()[1][7])).toContain(',');
  });

  it('gibt den Notenvorschlag der Klassenübersicht aus', () => {
    expect(zeilen()[1][8]).toBe(3);
  });

  it('lässt einen Strang ohne Ergebnis aus der Gewichtung (FA-59 AK-5)', () => {
    const daten = bestand();
    const nurPraxis = daten.abschnitte.filter((a) => a.strang === 'praxis');
    const ohneTest = { ...daten, abschnitte: nurPraxis, bewertungen: daten.bewertungen.filter((b) => b.abschnittId !== 'x1') };
    // Ohne den Test hat die Tabelle nur zwei Abschnittsspalten: Die
    // Strangspalten rücken um eine Stelle nach vorn.
    const [, datenzeile] = zeilen(ohneTest, nurPraxis);
    expect(datenzeile[4]).toBe('80,0');
    expect(datenzeile[5]).toBe('');
    expect(datenzeile[6]).toBe('80,0');
  });

  it('gibt persönliche Notizen nicht aus (FA-17 AK-4)', () => {
    const notiz: Aktion[] = [
      {
        art: 'bewertung/individuellNotiz',
        abschnittId: 's1',
        teamId: 'team1',
        personId: 'p1',
        notiz: 'Interne Beobachtung',
      },
    ];
    const daten = notiz.reduce(storeReducer, bestand());
    expect(alsCsv(zeilen(daten))).not.toContain('Interne Beobachtung');
  });

  it('setzt den Vorschlag bei negativem Strang auf 5 und nennt den Grund (FA-61)', () => {
    const daten = bestand();
    // Der Test steht auf 60 %; ein zweiter Test mit 0 Punkten drückt den
    // Theoriestrang unter die Genügend-Grenze.
    const schlecht: Aktion[] = [
      {
        art: 'abschnitt/anlegen',
        abschnitt: abschnitt({ id: 'x2', nummer: 4, name: 'Test 2', art: 'test', strang: 'theorie', rubrikId: 'rubrik-test-2' }),
        rubrik: testRubrik('rubrik-test-2', 'Test 2'),
      },
      { art: 'bewertung/individuell', abschnittId: 'x2', teamId: null, personId: 'p1', kriteriumId: 'f1', wert: 0 },
    ];
    const mitSperre = schlecht.reduce(storeReducer, daten);
    const [, datenzeile] = zeilen(mitSperre);
    expect(datenzeile[datenzeile.length - 3]).toBe(5);
    expect(datenzeile[datenzeile.length - 2]).toBe('Theorie negativ');
  });

  it('lässt die Spalte „Sperre“ leer, solange kein Strang negativ ist (FA-61)', () => {
    const [, datenzeile] = zeilen();
    expect(datenzeile[datenzeile.length - 2]).toBe('');
  });

  it('gibt den eingetragenen Notenstand aus und rechnet ihn nicht (FA-49)', () => {
    const daten = bestand();
    daten.notenstaende['gesamter-durchgang'] = {
      p1: { note: 2, begruendung: 'Verlauf steigend', gesetztAm: '2027-06-05T10:00:00.000Z' },
    };
    const [, datenzeile] = zeilen(daten);
    expect(datenzeile[datenzeile.length - 1]).toBe(2);
    // Der Vorschlag daneben bleibt, was er war – 3.
    expect(datenzeile[datenzeile.length - 3]).toBe(3);
  });

  it('folgt dem gewählten Stichtag (FA-48 AK-1)', () => {
    const daten = bestand();
    daten.stichtage = [
      { id: 'st1', name: 'Semesterzeugnis', bis: '2027-01-31', art: 'zeugnis' },
    ];
    // Sprint 1 endet vor dem Stichtag, der Test danach.
    daten.abschnitte[0].bis = '2026-11-14';
    daten.abschnitte[2].bis = '2027-03-20';
    const zeilenMitStichtag = uebersichtZeilen({
      daten,
      klasseId: 'k1',
      personen: daten.personen,
      teams: daten.teams,
      abschnitte: daten.abschnitte.filter((a) => a.bis && a.bis <= '2027-01-31'),
      bewertungen: bewertungsIndex(daten),
      stichtagId: 'st1',
    });
    const [kopf, datenzeile] = zeilenMitStichtag;
    // Nur Sprint 1 steht in den Spalten, der Test nicht.
    expect(kopf).toContain('Sprint 1 (%)');
    expect(kopf).not.toContain('Test 1 (%)');
    // Theorie hat in diesem Zeitraum keinen Stand.
    expect(datenzeile[kopf.indexOf('Theorie (%)')]).toBe('');
  });

  it('nennt in der Spalte „Team“ die Zuordnung im letzten Abschnitt (FA-58)', () => {
    const wechsel: Aktion[] = [
      { art: 'team/anlegen', id: 'team2', klasseId: 'k1', name: 'Team Galilei' },
      { art: 'zugehoerigkeit/setzen', abschnittId: 's2', personId: 'p1', teamId: 'team2' },
    ];
    const daten = wechsel.reduce(storeReducer, bestand());
    const sprints = daten.abschnitte.filter((a) => a.strang === 'praxis');
    const [, datenzeile] = zeilen(daten, sprints);
    expect(datenzeile[1]).toBe('Team Galilei');
  });
});

describe('alsCsv', () => {
  it('trennt mit Strichpunkt und beginnt mit einem BOM', () => {
    const csv = alsCsv([['a', 'b'], [1, 2]]);
    expect(csv.startsWith(BOM)).toBe(true);
    expect(csv).toContain('"a";"b"');
  });

  it('maskiert Anführungszeichen im Inhalt', () => {
    expect(alsCsv([['Sagt "Hallo"']])).toContain('"Sagt ""Hallo"""');
  });

  it('verkraftet Beistriche im Namen, weil in Anführungszeichen gesetzt', () => {
    expect(alsCsv(zeilen())).toContain('"Berger, Lena"');
  });
});

describe('csvDateiname', () => {
  it('baut einen dateisystemtauglichen Namen mit Datum', () => {
    expect(csvDateiname('4 AHIF', new Date('2026-09-09T08:00:00Z'))).toBe('pre-syp-prp-4_AHIF-2026-09-09.csv');
  });

  it('fängt einen leeren Klassennamen ab', () => {
    expect(csvDateiname('   ', new Date('2026-09-09T08:00:00Z'))).toBe('pre-syp-prp-Klasse-2026-09-09.csv');
  });
});

describe('csvDateiname mit Stichtag (FA-48)', () => {
  it('nimmt den Stichtag in den Namen auf', () => {
    expect(csvDateiname('4 AHIF', new Date('2027-01-31T08:00:00Z'), 'Semesterzeugnis')).toBe(
      'pre-syp-prp-4_AHIF-Semesterzeugnis-2027-01-31.csv',
    );
  });

  it('lässt ihn weg, wenn keiner gewählt ist', () => {
    expect(csvDateiname('4 AHIF', new Date('2027-01-31T08:00:00Z'))).toBe(
      'pre-syp-prp-4_AHIF-2027-01-31.csv',
    );
  });
});
