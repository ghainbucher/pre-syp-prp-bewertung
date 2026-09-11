/**
 * Oberflächenzustand: gewählte Ansicht, Klasse, Abschnitt, Team, bewertende
 * Person und die zur Bearbeitung geöffnete Rubrik.
 *
 * Wird getrennt vom Datenbestand gehalten und im localStorage abgelegt, damit
 * die Anwendung dort weitermacht, wo zuletzt gearbeitet wurde (FA-35).
 */

import { useCallback, useEffect, useState } from 'react';

export type Ansicht = 'bewerten' | 'auswertung' | 'struktur' | 'rubrik';

export interface UiZustand {
  ansicht: Ansicht;
  klasseId: string | null;
  /** Gewählter Beurteilungsabschnitt – Sprint, Diplomarbeit oder Test. */
  abschnittId: string | null;
  teamId: string | null;
  bewerterId: string | null;
  /** In der Rubrikansicht geöffnete Rubrik (FA-55). */
  rubrikId: string | null;
  /** Stichtag der Auswertung; `null` = alles (FA-48). */
  stichtagId: string | null;
  /**
   * Herleitung anzeigen (FA-51)? Vorgabe aus.
   *
   * Steht bewusst hier und nicht im Datenbestand: Die Einstellung wirkt nur auf
   * die Anzeige und darf nie in einer Sicherung landen (AK-3).
   */
  ausfuehrlich: boolean;
}

// Stand 2: Bis dahin hieß der gewählte Abschnitt „sprintId“. Ein neuer
// Schlüssel ist einfacher als eine Migration eines Zustands, der sich in
// Sekunden wiederherstellt.
const SCHLUESSEL = 'pre-syp-prp.ui.v2';

const START: UiZustand = {
  ansicht: 'bewerten',
  klasseId: null,
  abschnittId: null,
  teamId: null,
  bewerterId: null,
  rubrikId: null,
  stichtagId: null,
  ausfuehrlich: false,
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
