import { describe, expect, it } from 'vitest';

import {
  BAUSTEINE_VORGABE,
  BAUSTEIN_BEZEICHNUNG,
  personenrueckmeldungText,
  teamrueckmeldungText,
} from './teamrueckmeldung';
import type { Abschnitt, Bewertung, Person, Teamabschnitt } from '../domain/types';

const abschnitt: Abschnitt = {
  id: 's2',
  klasseId: 'k1',
  nummer: 2,
  name: 'Sprint 2',
  art: 'sprint',
  strang: 'praxis',
  rubrikId: 'rubrik-sprint',
  von: '',
  bis: '',
  faktor: 1,
  peerAktiv: false,
};

const planung: Teamabschnitt = {
  abschnittId: 's2',
  teamId: 'a',
  ziel: 'Buchungsmodul mit Storno',
  von: '2026-10-03',
  bis: '2026-10-17',
  massnahmen: [
    { id: 'm1', text: 'Daily am Anfang jeder Einheit' },
    { id: 'm2', text: 'Board täglich aktualisieren' },
  ],
};

const mitglieder: Person[] = [
  { id: 'p1', klasseId: 'k1', name: 'Berger Lena' },
  { id: 'p2', klasseId: 'k1', name: 'Steiner Jonas' },
];

const bewertung: Bewertung = {
  abschnittId: 's2',
  teamId: 'a',
  team: { t1: 9 },
  prozess: {},
  individuell: {
    p1: {
      punkte: { i1: 9 },
      notiz: 'intern: sehr selbstständig',
      spur: { bezeichnung: 'PR #42, Storno-Validierung', verweis: 'https://example.invalid/42' },
      rueckmeldung: {
        staerken: 'Schnittstelle sauber entworfen',
        entwicklung: 'Tests zu spät',
        gesetztAm: '2026-10-18T09:00:00.000Z',
      },
      verstehen: { stufe: 'sicher', notiz: '', gesetztAm: '2026-10-18T09:00:00.000Z' },
    },
    p2: { punkte: { i1: 4 }, notiz: '', spur: { bezeichnung: 'PR #45, Tests' } },
  },
  peer: {},
  notiz: 'Storno läuft, Review ohne Nacharbeit',
  gesetzt: {
    sprintwert: { prozent: 82, begruendung: 'Ziel erreicht', gesetztAm: '2026-10-18T09:00:00.000Z' },
  },
};

function text(teil: Partial<Parameters<typeof teamrueckmeldungText>[0]> = {}): string {
  return teamrueckmeldungText({
    abschnitt,
    teamname: 'Kepler',
    planung,
    bewertung,
    mitglieder,
    bausteine: BAUSTEINE_VORGABE,
    ...teil,
  });
}

/*
 * Vorher im Durchstich „legt den Sprintwert fest und gibt den Kanaltext mit"
 * über die Schalterliste in der Karte geprüft (Solution-Design 8.1). Die
 * Aussage hängt aber nicht an der Oberfläche, sondern an dieser Liste: Was
 * nicht als Baustein existiert, kann auch keine Karte anbieten.
 */
describe('Welche Bausteine es gibt (FA-83 AK-4)', () => {
  it('sind genau fünf, und alle betreffen das Team', () => {
    expect(Object.keys(BAUSTEINE_VORGABE).sort()).toEqual([
      'beitraege',
      'gelungen',
      'massnahmen',
      'sprintwert',
      'ziel',
    ]);
  });

  it('bietet keinen Baustein für die Rückmeldung je Person', () => {
    // Eine Aussage über eine einzelne Person gehört nicht in einen Kanal, den
    // die ganze Klasse liest (FA-83 AK-4, OP-F29). Sie hat einen eigenen Weg:
    // `personenrueckmeldungText`.
    for (const bezeichnung of Object.values(BAUSTEIN_BEZEICHNUNG)) {
      expect(/Person|Stärken|Entwicklung|Note/.test(bezeichnung)).toBe(false);
    }
  });

  it('ist anfangs alles an', () => {
    // Abschalten ist ein Handgriff, Zuschalten ein Suchen.
    expect(Object.values(BAUSTEINE_VORGABE).every(Boolean)).toBe(true);
  });
});

describe('teamrueckmeldungText (FA-83)', () => {
  it('setzt alle Bausteine zusammen (AK-1, AK-2)', () => {
    const t = text();
    expect(t).toContain('Sprint 2 · Kepler');
    expect(t).toContain('03.10.2026 bis 17.10.2026');
    expect(t).toContain('Ziel: Buchungsmodul mit Storno');
    expect(t).toContain('Sprintwert: 82 % – Ziel erreicht');
    expect(t).toContain('Was gelungen ist: Storno läuft, Review ohne Nacharbeit');
    expect(t).toContain('Berger Lena an PR #42, Storno-Validierung');
    expect(t).toContain('Steiner Jonas an PR #45, Tests');
    expect(t).toContain('Daily am Anfang jeder Einheit · Board täglich aktualisieren');
  });

  it('lässt jeden Baustein einzeln weg (AK-2)', () => {
    const ohneZiel = text({ bausteine: { ...BAUSTEINE_VORGABE, ziel: false } });
    expect(ohneZiel).not.toContain('Ziel:');
    // Der Kopf mit Abschnitt und Team bleibt immer stehen.
    expect(ohneZiel).toContain('Sprint 2 · Kepler');

    expect(text({ bausteine: { ...BAUSTEINE_VORGABE, sprintwert: false } })).not.toContain(
      'Sprintwert',
    );
    expect(text({ bausteine: { ...BAUSTEINE_VORGABE, beitraege: false } })).not.toContain(
      'Berger Lena',
    );
    expect(text({ bausteine: { ...BAUSTEINE_VORGABE, massnahmen: false } })).not.toContain(
      'Daily am Anfang',
    );
    expect(text({ bausteine: { ...BAUSTEINE_VORGABE, gelungen: false } })).not.toContain(
      'Storno läuft',
    );
  });

  it('nennt bei den Beiträgen keine Bewertung (AK-3)', () => {
    const t = text();
    // Weder Prozentwerte je Person noch Stärken oder Entwicklungsfelder.
    expect(t).not.toContain('Schnittstelle sauber entworfen');
    expect(t).not.toContain('Tests zu spät');
    expect(t).not.toMatch(/Berger Lena[^\n]*\d+\s?%/);
  });

  it('gibt die Notiz je Person nicht heraus (FA-17 AK-4)', () => {
    expect(text()).not.toContain('intern: sehr selbstständig');
  });

  it('nennt keinen Sprintwert, solange keiner gesetzt ist (FA-82 AK-6)', () => {
    const ohneWert: Bewertung = { ...bewertung, gesetzt: undefined };
    const t = text({ bewertung: ohneWert });
    expect(t).not.toContain('Sprintwert');
    // Und rechnet auch keinen aus: Was das Team nicht kennt, steht nicht da.
    expect(t).not.toMatch(/\d+\s?%/);
  });

  it('lässt eine Person ohne Spur aus der Aufzählung (AK-3)', () => {
    const ohneSpur: Bewertung = {
      ...bewertung,
      individuell: { ...bewertung.individuell, p2: { punkte: {}, notiz: '' } },
    };
    const t = text({ bewertung: ohneSpur });
    expect(t).toContain('Berger Lena an PR #42');
    // Kein „Steiner Jonas an –“: Eine leere Zeile behauptet nichts.
    expect(t).not.toContain('Steiner Jonas');
  });

  it('bleibt ohne jeden Inhalt bei der Kopfzeile', () => {
    const leer = teamrueckmeldungText({
      abschnitt,
      teamname: 'Kepler',
      planung: undefined,
      bewertung: undefined,
      mitglieder: [],
      bausteine: BAUSTEINE_VORGABE,
    });
    expect(leer.trim()).toBe('Sprint 2 · Kepler');
  });
});

describe('personenrueckmeldungText (FA-83 AK-7)', () => {
  it('enthält Stand, Stärken und Entwicklungsfelder', () => {
    const t = personenrueckmeldungText({
      abschnitt,
      person: mitglieder[0],
      planung,
      bewertung,
      stand: 78.4,
    });
    expect(t).toContain('Sprint 2 · Berger Lena');
    expect(t).toContain('Stand: 78 %');
    expect(t).toContain('Stärken: Schnittstelle sauber entworfen');
    expect(t).toContain('Woran du arbeiten kannst: Tests zu spät');
  });

  it('nennt weder Note noch Punktetabelle (FA-42 AK-2, AK-3)', () => {
    const t = personenrueckmeldungText({
      abschnitt,
      person: mitglieder[0],
      planung,
      bewertung,
      stand: 78.4,
    });
    expect(t).not.toMatch(/Note/);
    expect(t).not.toContain('i1');
  });

  it('lässt den Stand weg, wenn keiner genannt werden soll', () => {
    const t = personenrueckmeldungText({
      abschnitt,
      person: mitglieder[1],
      planung,
      bewertung,
      stand: null,
    });
    expect(t).not.toContain('Stand:');
  });
});
