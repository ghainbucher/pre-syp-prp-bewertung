import { describe, expect, it } from 'vitest';

import { auswertungGelesen, zeitsatz } from './repoauswertung';
import type { GithubAuswertung } from './types';

/*
 * Diese Prüfungen standen bis zur Straffung der Teststrategie im Durchstich
 * „liest die GitHub-Auswertung ein und schlägt Punkte vor" (Solution-Design
 * 8.1). Dort kostete jeder Fall einen Browserlauf mit hochgeladener Datei; hier
 * kosten sie nichts – und es lassen sich Fälle prüfen, die von Hand kaum
 * herzustellen sind: eine abgeschnittene Datei, eine mit fremden Feldern, eine
 * aus einer älteren Fassung des Skripts.
 */

/** Eine vollständige Auswertung, wie `npm run github` sie schreibt. */
function vollstaendig(): unknown {
  return {
    standAm: '2026-10-18T10:00:00.000Z',
    von: '2026-10-03',
    bis: '2026-10-17',
    anteile: { anna: 60, bert: 40 },
    reviews: [{ von: 'anna', an: 'bert', anzahl: 2 }],
    prAnteil: 100,
    direktePushes: 0,
    jeTag: { '2026-10-06': 4, '2026-10-13': 6 },
    nichtZugeordnet: ['dependabot'],
  };
}

describe('Auswertung einlesen (FA-81 AK-4)', () => {
  it('liest eine vollständige Datei unverändert ein', () => {
    const gelesen = auswertungGelesen(vollstaendig());
    expect(gelesen?.anteile).toEqual({ anna: 60, bert: 40 });
    expect(gelesen?.prAnteil).toBe(100);
    expect(gelesen?.reviews).toEqual([{ von: 'anna', an: 'bert', anzahl: 2 }]);
  });

  it('lehnt ab, was keine Auswertung ist', () => {
    // Ohne Verteilung gibt es nichts zu zeigen – dann lieber gar nichts
    // übernehmen als einen halb gefüllten Stand (AK-4).
    expect(auswertungGelesen(null)).toBeNull();
    expect(auswertungGelesen('{}')).toBeNull();
    expect(auswertungGelesen({ von: '2026-10-03' })).toBeNull();
    expect(auswertungGelesen({ anteile: null })).toBeNull();
  });

  it('nimmt eine Datei ohne die späteren Felder an', () => {
    // Eine ältere Fassung des Skripts kannte `jeTag` und `nichtZugeordnet`
    // nicht. Sie soll lesbar bleiben – fehlende Angaben sind leer, nicht falsch.
    const gelesen = auswertungGelesen({ anteile: { anna: 100 } });
    expect(gelesen?.jeTag).toEqual({});
    expect(gelesen?.nichtZugeordnet).toEqual([]);
    expect(gelesen?.reviews).toEqual([]);
    expect(gelesen?.prAnteil).toBe(0);
    expect(gelesen?.von).toBe('');
  });

  it('macht aus unbrauchbaren Zahlen 0 statt NaN', () => {
    // `NaN` würde sich durch jede Rechnung ziehen und erst in der Anzeige
    // auffallen – als leeres Feld ohne erkennbaren Grund.
    const gelesen = auswertungGelesen({
      anteile: { anna: 'viel', bert: Number.NaN },
      prAnteil: 'alle',
      direktePushes: Number.POSITIVE_INFINITY,
    });
    expect(gelesen?.anteile).toEqual({ anna: 0, bert: 0 });
    expect(gelesen?.prAnteil).toBe(0);
    expect(gelesen?.direktePushes).toBe(0);
  });

  it('behält nicht zugeordnete Kennungen (AK-2)', () => {
    // Sie sind der Hinweis darauf, dass eine Kennung am Schüler fehlt. Würden
    // sie stillschweigend verschwinden, wäre die Verteilung unbemerkt falsch.
    expect(auswertungGelesen(vollstaendig())?.nichtZugeordnet).toEqual(['dependabot']);
  });

  it('wirft Reviews ohne Absender weg', () => {
    const gelesen = auswertungGelesen({
      anteile: { anna: 100 },
      reviews: [{ an: 'bert', anzahl: 1 }, 'kaputt', { von: 'anna', an: 'bert' }],
    });
    expect(gelesen?.reviews).toEqual([{ von: 'anna', an: 'bert', anzahl: 0 }]);
  });
});

describe('Zeitliche Verteilung in einem Satz (FA-81 AK-2)', () => {
  const grund = auswertungGelesen(vollstaendig()) as GithubAuswertung;

  it('nennt Tage und den stärksten Tag', () => {
    expect(zeitsatz(grund)).toBe('an 2 Tagen, stärkster Tag 60 % der Beiträge');
  });

  it('sagt nichts, wenn es nichts zu sagen gibt', () => {
    expect(zeitsatz({ ...grund, jeTag: {} })).toBeNull();
    expect(zeitsatz({ ...grund, jeTag: { '2026-10-06': 0 } })).toBeNull();
  });

  it('erkennt den Sprint, der an einem Tag entstanden ist', () => {
    // Das ist die Aussage, wegen der die Verteilung überhaupt erhoben wird
    // (Fachkonzept A4): alles am Abend vor dem Review.
    expect(zeitsatz({ ...grund, jeTag: { '2026-10-16': 12 } })).toBe(
      'an 1 Tag, stärkster Tag 100 % der Beiträge',
    );
  });
});
