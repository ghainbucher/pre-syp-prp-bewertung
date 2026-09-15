/**
 * Die Datei aus `npm run github` lesen und prüfen (FA-81).
 *
 * **Warum das in der Domäne steht und nicht in der Karte.** Es ist keine
 * Darstellung, sondern eine Entscheidung über fremde Daten: Die Datei kommt von
 * außen, ist von Hand veränderbar und kann alles enthalten. Eine Komponente
 * rechnet nicht (NFA-06) – und was hier schiefgeht, fällt sonst erst im
 * Browser auf.
 *
 * **Ganz oder gar nicht** (AK-4): Eine Datei ohne `anteile` ist keine
 * Auswertung und wird als Ganzes abgelehnt. Bei allem anderen wird ein
 * fehlender Wert zu 0 und ein fehlendes Feld zu einer leeren Liste – ein
 * halb gefüllter Stand wäre schlechter als eine klare Meldung.
 *
 * Die Zahlen sind **Verteilungen auf Teamebene**, nie eine Leistungszahl je
 * Person (AK-2). Die Anwendung ruft nichts ab; sie liest, was das Skript
 * geschrieben hat (ADR-001, NFA-03).
 */

import { formatProzent } from './scoring';
import type { GithubAuswertung } from './types';

/** Eine eingelesene Datei auf das Nötige prüfen (AK-4). */
export function auswertungGelesen(roh: unknown): GithubAuswertung | null {
  if (typeof roh !== 'object' || roh === null) return null;
  const o = roh as Record<string, unknown>;
  const zahl = (wert: unknown) => (typeof wert === 'number' && Number.isFinite(wert) ? wert : 0);
  if (typeof o.anteile !== 'object' || o.anteile === null) return null;
  return {
    standAm: typeof o.standAm === 'string' ? o.standAm : new Date().toISOString(),
    von: typeof o.von === 'string' ? o.von : '',
    bis: typeof o.bis === 'string' ? o.bis : '',
    anteile: Object.fromEntries(
      Object.entries(o.anteile as Record<string, unknown>).map(([k, v]) => [k, zahl(v)]),
    ),
    reviews: Array.isArray(o.reviews)
      ? o.reviews
          .filter((k): k is Record<string, unknown> => typeof k === 'object' && k !== null)
          .map((k) => ({
            von: String(k.von ?? ''),
            an: String(k.an ?? ''),
            anzahl: zahl(k.anzahl),
          }))
          .filter((k) => k.von !== '')
      : [],
    prAnteil: zahl(o.prAnteil),
    direktePushes: zahl(o.direktePushes),
    jeTag:
      typeof o.jeTag === 'object' && o.jeTag !== null
        ? Object.fromEntries(
            Object.entries(o.jeTag as Record<string, unknown>).map(([k, v]) => [k, zahl(v)]),
          )
        : {},
    nichtZugeordnet: Array.isArray(o.nichtZugeordnet) ? o.nichtZugeordnet.map(String) : [],
  };
}

/** Die zeitliche Verteilung in einem Satz (AK-2, vierte Größe). */
export function zeitsatz(auswertung: GithubAuswertung): string | null {
  const tage = Object.entries(auswertung.jeTag).filter(([, n]) => n > 0);
  if (tage.length === 0) return null;
  const gesamt = tage.reduce((summe, [, n]) => summe + n, 0);
  const sortiert = [...tage].sort((a, b) => b[1] - a[1]);
  const anteilStaerksterTag = (100 * sortiert[0][1]) / gesamt;
  return `an ${tage.length} ${tage.length === 1 ? 'Tag' : 'Tagen'}, stärkster Tag ${formatProzent(
    anteilStaerksterTag,
  )} % der Beiträge`;
}
