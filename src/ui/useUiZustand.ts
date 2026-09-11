/**
 * Oberflächenzustand: gewählte Ansicht, Klasse, Sprint, Team, Bewertende Person.
 *
 * Wird getrennt vom Datenbestand gehalten und im localStorage abgelegt, damit
 * die Anwendung dort weitermacht, wo zuletzt gearbeitet wurde (FA-35).
 */

import { useCallback, useEffect, useState } from 'react';

export type Ansicht = 'bewerten' | 'auswertung' | 'struktur' | 'rubrik';

export interface UiZustand {
  ansicht: Ansicht;
  klasseId: string | null;
  sprintId: string | null;
  teamId: string | null;
  bewerterId: string | null;
}

const SCHLUESSEL = 'pre-syp-prp.ui.v1';

const START: UiZustand = {
  ansicht: 'bewerten',
  klasseId: null,
  sprintId: null,
  teamId: null,
  bewerterId: null,
};

function gelesen(): UiZustand {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return START;
    const wert = JSON.parse(roh) as Partial<UiZustand>;
    return { ...START, ...wert };
  } catch {
    return START;
  }
}

export function useUiZustand() {
  const [zustand, setZustand] = useState<UiZustand>(gelesen);

  useEffect(() => {
    try {
      localStorage.setItem(SCHLUESSEL, JSON.stringify(zustand));
    } catch {
      /* Ohne Speicher geht die Auswahl beim Neuladen verloren – kein Fehlerfall. */
    }
  }, [zustand]);

  const setzen = useCallback((aenderung: Partial<UiZustand>) => {
    setZustand((vorher) => ({ ...vorher, ...aenderung }));
  }, []);

  return [zustand, setzen] as const;
}
