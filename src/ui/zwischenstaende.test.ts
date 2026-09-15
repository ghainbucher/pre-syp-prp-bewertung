import { describe, expect, it } from 'vitest';

import { ZWISCHENSTAENDE } from './zwischenstaende';

/*
 * Vorher der Durchstich „weist in Theorie-Tests und Notenauswertung auf die
 * ausstehende Überarbeitung hin". Der Browserlauf prüfte, dass ein Absatz da
 * steht; geprüft werden muss aber, dass er **etwas Bestimmtes** sagt – FA-93
 * AK-2 verlangt den Ort der Entscheidung.
 *
 * Was hier nicht mehr geprüft wird: dass der Absatz tatsächlich gerendert wird.
 * Das ist der Preis des Umzugs und steht so in Solution-Design 8.1.
 */
describe('Hinweis auf ausstehende Überarbeitung (FA-93)', () => {
  it('betrifft genau die beiden Sichten, deren Aufbau offen ist (AK-1)', () => {
    expect(Object.keys(ZWISCHENSTAENDE).sort()).toEqual(['auswertung', 'tests']);
  });

  it('nennt zu jeder Sicht den offenen Punkt (AK-2)', () => {
    expect(ZWISCHENSTAENDE.tests.offenerPunkt).toBe('OP-F32');
    expect(ZWISCHENSTAENDE.auswertung.offenerPunkt).toBe('OP-F33');
  });

  it('stellt eine wirkliche Frage und nicht „noch offen"', () => {
    // Ein Hinweis, der nur sagt „wird überarbeitet", wird zu Inventar (AK-2).
    // Eine Frage mit zwei benannten Möglichkeiten lässt sich beantworten.
    for (const stand of Object.values(ZWISCHENSTAENDE)) {
      expect(stand.frage.endsWith('?')).toBe(true);
      expect(stand.frage.includes(' oder ')).toBe(true);
      expect(/^OP-[FKR]\d+$/.test(stand.offenerPunkt)).toBe(true);
    }
  });
});
