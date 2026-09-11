import { describe, expect, it } from 'vitest';

import { RUBRIK_SPRINT, leererDatenbestand } from '../domain/defaults';
import { gesamtErgebnis } from '../domain/scoring';
import { bewertungsIndex, storeReducer, type Aktion } from '../store/storeReducer';
import type { Abschnitt, Datenbestand, Person } from '../domain/types';
import { belegfassungDateiname, belegfassungHtml } from './belegfassung';

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

const GRUND: Aktion[] = [
  { art: 'klasse/anlegen', id: 'k1', name: '4AHIF' },
  { art: 'team/anlegen', id: 'team1', klasseId: 'k1', name: 'Team Kepler' },
  {
    art: 'person/anlegen',
    klasseId: 'k1',
    teamId: 'team1',
    namen: [{ id: 'p1', name: 'Berger Lena' }],
  },
  { art: 'abschnitt/anlegen', abschnitt: abschnitt({ id: 's1', nummer: 1, name: 'Sprint 1' }) },
];

function lage(weitere: Aktion[] = []): { daten: Datenbestand; person: Person; html: string } {
  const daten = [...GRUND, ...weitere].reduce(storeReducer, leererDatenbestand());
  const person = daten.personen[0];
  const ergebnis = gesamtErgebnis(daten, person, bewertungsIndex(daten));
  return {
    daten,
    person,
    html: belegfassungHtml({ daten, person, ergebnis, stand: new Date(2027, 0, 31) }),
  };
}

describe('belegfassungHtml (FA-32)', () => {
  it('nennt je Kategorie Kriterien, Punkte und Prozentwert (AK-1)', () => {
    const { html } = lage([
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 8 },
    ]);
    expect(html).toContain('Funktionalität');
    expect(html).toContain('Sprint-Ziel erreicht');
    expect(html).toContain('>8</td>');
    expect(html).toContain('80,0 %');
  });

  it('schreibt „nicht bewertet“ statt 0 (AK-2)', () => {
    const { html } = lage([
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 8 },
    ]);
    // Zwei Kategorien sind leer – beide müssen so ausgewiesen sein.
    expect((html.match(/nicht bewertet/g) ?? []).length).toBeGreaterThanOrEqual(2);
    // Und nirgends steht an ihrer Stelle eine Null. („80,0 %“ enthält „0,0 %“
    // als Teilzeichenkette – deshalb wird auf die Ergebnisstelle geprüft.)
    expect(html).not.toContain('"ergebnis">0,0 %');
  });

  it('weist einen gesetzten Wert samt gerechnetem Vergleich und Begründung aus (AK-3)', () => {
    const { html } = lage([
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 5 },
      {
        art: 'gesetzt/kategorie',
        abschnittId: 's1',
        teamId: 'team1',
        kategorie: 'team',
        wert: 85,
        begruendung: 'Demo im Unterricht gesehen',
      },
    ]);
    expect(html).toContain('Gesetzter Wert');
    expect(html).toContain('85,0 %');
    expect(html).toContain('50,0 %'); // gerechnet: 5 von 10
    expect(html).toContain('Demo im Unterricht gesehen');
  });

  it('weist Notenvorschlag und Notenstand beide aus (AK-4)', () => {
    const { html } = lage([
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 9 },
      { art: 'notenstand', stichtagId: null, personId: 'p1', note: 2, begruendung: 'Verlauf steigend' },
    ]);
    expect(html).toContain('Notenvorschlag');
    expect(html).toContain('Notenstand');
    expect(html).toContain('Verlauf steigend');
    expect(html).toContain('weicht vom Vorschlag ab');
  });

  it('enthält keine internen Bezeichner (AK-5)', () => {
    const { html, daten } = lage([
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 8 },
    ]);
    expect(html).not.toContain('rubrik-sprint');
    expect(html).not.toContain('team1');
    expect(html).not.toContain('"t1"');
    expect(html).not.toContain(daten.personen[0].id);
  });

  it('nennt je Abschnitt Rubrik und Team (AK-6)', () => {
    const { html } = lage([
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 8 },
    ]);
    expect(html).toContain('Rubrik „Sprint“');
    expect(html).toContain('Team Team Kepler');
    // Nach dem ersten Eintrag ist die Rubrik eingefroren – das gehört hinein.
    expect(html).toContain('beim ersten Eintrag festgehalten');
  });

  it('nennt bei einem Test das Bewertungsschema der offenen Frage (AK-7)', () => {
    const { html } = lage([
      {
        art: 'abschnitt/anlegen',
        abschnitt: abschnitt({ id: 'x1', nummer: 2, name: 'Test 1', art: 'test', strang: 'theorie', rubrikId: 'r-test' }),
        rubrik: {
          id: 'r-test',
          name: 'Test 1',
          team: [],
          prozess: [],
          individuell: [
            { id: 'f1', name: 'Frage 1', beschreibung: 'Multiple Choice', max: 2 },
            { id: 'f4', name: 'Offene Frage', beschreibung: '0–4 nach Vollständigkeit und Begründung', max: 4 },
          ],
          peer: [],
          gewichte: { team: 0, prozess: 0, individuell: 100, peer: 0 },
          selbstZaehlt: false,
        },
      },
      { art: 'bewertung/individuell', abschnittId: 'x1', teamId: null, personId: 'p1', kriteriumId: 'f4', wert: 3 },
    ]);
    expect(html).toContain('Bewertungsschema der offenen Frage');
    expect(html).toContain('0–4 nach Vollständigkeit und Begründung');
    expect(html).toContain('Test – ohne Team');
  });

  it('weist die Sperre mit Rechtsgrundlage aus (FA-61 AK-2)', () => {
    const { html } = lage([
      {
        art: 'abschnitt/anlegen',
        abschnitt: abschnitt({ id: 'x1', nummer: 2, name: 'Test 1', art: 'test', strang: 'theorie' }),
      },
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 9 },
      { art: 'gesetzt/abschnitt', abschnittId: 'x1', teamId: null, personId: 'p1', wert: 30 },
    ]);
    expect(html).toContain('§ 14 LBVO');
    expect(html).toContain('ohne diese Sperre');
  });

  it('kommt ohne Verweise nach außen und ohne Skript aus (NFA-03)', () => {
    const { html } = lage();
    expect(html).not.toContain('<script');
    expect(html).not.toContain('https://');
  });

  it('sagt es, wenn für die Person nichts erfasst ist', () => {
    const daten = GRUND.reduce(storeReducer, leererDatenbestand());
    daten.abschnitte = [];
    const person = daten.personen[0];
    const html = belegfassungHtml({
      daten,
      person,
      ergebnis: gesamtErgebnis(daten, person, bewertungsIndex(daten)),
    });
    expect(html).toContain('noch nichts erfasst');
  });

  it('baut einen Dateinamen mit Person und Datum', () => {
    expect(belegfassungDateiname('Berger Lena', new Date('2027-01-31T08:00:00Z'))).toBe(
      'belegfassung-Berger_Lena-2027-01-31.html',
    );
  });
});

describe('Verstehensnachweis und Reflexion in der Belegfassung (FA-40 AK-4, FA-41 AK-4)', () => {
  it('nennt Einstufung, Anteil und Notiz des Verstehensnachweises', () => {
    const { html } = lage([
      {
        art: 'bewertung/verstehen',
        abschnittId: 's1',
        teamId: 'team1',
        personId: 'p1',
        stufe: 'ueberwiegend',
        notiz: 'Bei der Transaktion unsicher',
      },
    ]);
    expect(html).toContain('überwiegend erklärt');
    expect(html).toContain('Anteil am individuellen Beitrag 30 %');
    expect(html).toContain('Bei der Transaktion unsicher');
  });

  it('nennt die Sicht der Person', () => {
    const { html } = lage([
      {
        art: 'bewertung/reflexion',
        abschnittId: 's1',
        teamId: 'team1',
        personId: 'p1',
        text: 'Habe die Schnittstelle gebaut und gelernt, früher zu fragen.',
      },
    ]);
    expect(html).toContain('Sicht der Person');
    expect(html).toContain('früher zu fragen');
  });

  it('lässt beide weg, wenn nichts erhoben wurde', () => {
    const { html } = lage([
      { art: 'bewertung/punkte', abschnittId: 's1', teamId: 'team1', kategorie: 'team', kriteriumId: 't1', wert: 8 },
    ]);
    expect(html).not.toContain('Verstehensnachweis im Review');
    expect(html).not.toContain('Sicht der Person');
  });
});
