import { describe, expect, it } from 'vitest';

import { dauerhafterTeil, type UiZustand } from './uizustand';

/*
 * Der Durchstich „schreibt nur im laufenden Sprint" prüfte am Ende, dass eine
 * Freigabe das Neuladen **nicht** übersteht (FA-76 AK-3). Dafür lud er die
 * Seite neu und klickte sich zurück – ein halber Testlauf für eine Zeile.
 *
 * Geprüft gehört die Regel selbst (Solution-Design 8.1).
 */
describe('Was vom Sichtzustand gemerkt wird (FA-35, FA-76 AK-3)', () => {
  const zustand: UiZustand = {
    ansicht: 'review',
    stammseite: 'projekte',
    klasseId: 'k1',
    abschnittId: 's1',
    teamId: 'team1',
    bewerterId: 'p1',
    rubrikId: 'r1',
    stichtagId: null,
    jahrgang: 4,
    nurGemischt: false,
    schuelerId: null,
    ausfuehrlich: true,
    bearbeiten: 's1',
  };

  it('merkt sich die Auswahl (FA-35)', () => {
    const dauerhaft = dauerhafterTeil(zustand);
    expect(dauerhaft.klasseId).toBe('k1');
    expect(dauerhaft.abschnittId).toBe('s1');
    expect(dauerhaft.teamId).toBe('team1');
    expect(dauerhaft.ansicht).toBe('review');
  });

  it('merkt sich die Freigabe eines nicht laufenden Sprints nicht (FA-76 AK-3)', () => {
    // Sie gilt für diese Sitzung. Überstünde sie das Neuladen, wäre aus der
    // Ausnahme der Normalzustand geworden.
    expect('bearbeiten' in dauerhafterTeil(zustand)).toBe(false);
  });

  it('lässt den übrigen Zustand unangetastet', () => {
    // Die Regel soll genau ein Feld entfernen – nicht aufräumen, was ihr sonst
    // noch auffällt.
    expect(Object.keys(dauerhafterTeil(zustand)).sort()).toEqual(
      Object.keys(zustand)
        .filter((k) => k !== 'bearbeiten')
        .sort(),
    );
  });
});
