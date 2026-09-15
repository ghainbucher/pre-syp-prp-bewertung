/**
 * Der Haken für den Oberflächenzustand (FA-35).
 *
 * Alles außer React steht in `uizustand.ts` – die Form des Zustands, der
 * Startwert und die Regel, was dauerhaft gemerkt wird. Von hier werden die
 * Typen weitergereicht, damit die rund zwanzig bestehenden Importe stimmen
 * bleiben.
 */

import { useCallback, useEffect, useState } from 'react';

import { SCHLUESSEL, dauerhafterTeil, gelesen } from './uizustand';
import type { UiZustand } from './uizustand';

export type { Ansicht, Stammseite, UiZustand } from './uizustand';
export { START, dauerhafterTeil } from './uizustand';

export function useUiZustand() {
  const [zustand, setZustand] = useState<UiZustand>(gelesen);

  useEffect(() => {
    try {
      localStorage.setItem(SCHLUESSEL, JSON.stringify(dauerhafterTeil(zustand)));
    } catch {
      /* Ohne Speicher geht die Auswahl beim Neuladen verloren – kein Fehlerfall. */
    }
  }, [zustand]);

  const setzen = useCallback((aenderung: Partial<UiZustand>) => {
    setZustand((vorher) => ({ ...vorher, ...aenderung }));
  }, []);

  return [zustand, setzen] as const;
}
