/**
 * Einen Abschnitt löschen – und vorher sagen, was dabei verlorengeht
 * (FA-36 AK-3).
 *
 * Eine Rückfrage „wirklich?“ beantwortet jeder mit Ja; sie schützt nur vor dem
 * Verrutschen der Maus. Was hier fehlt, ist die Information: An einem Abschnitt
 * hängen Planungen, Punkte, Notizen, Peer-Urteile und Rückmeldungen. Wer sie
 * gezählt sieht, entscheidet anders als jemand, der gefragt wird, ob er sicher
 * ist.
 *
 * Diese Ansicht zählt nichts selbst – das tut `abschnittsinhalt` in der Domäne.
 */

import { useState } from 'react';

import { abschnittIstLeer, abschnittsinhalt } from '../domain/zuordnung';
import type { Datenbestand } from '../domain/types';

/** Die Posten in der Reihenfolge, in der sie jemanden interessieren. */
function posten(inhalt: ReturnType<typeof abschnittsinhalt>): string[] {
  const zeilen: Array<[number, string, string]> = [
    [inhalt.punkte, 'Punktewert', 'Punktewerte'],
    [inhalt.gesetzteWerte, 'gesetzter Wert', 'gesetzte Werte'],
    [inhalt.rueckmeldungen, 'Rückmeldung', 'Rückmeldungen'],
    [inhalt.verstehensnachweise, 'Verstehensnachweis', 'Verstehensnachweise'],
    [inhalt.reflexionen, 'Reflexionsnotiz', 'Reflexionsnotizen'],
    [inhalt.spuren, 'gezeigte Spur', 'gezeigte Spuren'],
    [inhalt.massnahmen, 'Maßnahme', 'Maßnahmen'],
    [inhalt.peerUrteile, 'Peer-Urteil', 'Peer-Urteile'],
    [inhalt.notizen, 'Notiz', 'Notizen'],
    [inhalt.planungen, 'Planung', 'Planungen'],
  ];
  return zeilen
    .filter(([anzahl]) => anzahl > 0)
    .map(([anzahl, eins, viele]) => `${anzahl} ${anzahl === 1 ? eins : viele}`);
}

export function AbschnittLoeschen({
  daten,
  abschnittId,
  teamId = null,
  beschriftung,
  hinweis,
  onLoeschen,
}: {
  daten: Datenbestand;
  abschnittId: string;
  /** Gesetzt: Es wird nur gezählt und entfernt, was diesem Team gehört. */
  teamId?: string | null;
  beschriftung: string;
  /** Was mit dem Löschen geschieht, in einem Satz. */
  hinweis: string;
  onLoeschen: () => void;
}) {
  const [offen, setOffen] = useState(false);
  const inhalt = abschnittsinhalt(daten, abschnittId, teamId);
  const leer = abschnittIstLeer(inhalt);

  if (!offen) {
    return (
      <button type="button" className="schalter schlicht klein" onClick={() => setOffen(true)}>
        {beschriftung}
      </button>
    );
  }

  const liste = posten(inhalt);

  return (
    <div className={leer ? 'meldung' : 'meldung dringend'} role="status">
      {leer ? (
        <>Hier ist nichts erfasst. {hinweis}</>
      ) : (
        <>
          <b>Damit gehen verloren:</b> {liste.join(' · ')}. {hinweis} Das lässt sich nicht
          rückgängig machen – eine Sicherung von vorher enthält die Daten noch.
        </>
      )}{' '}
      <button
        type="button"
        className="schalter gefahr klein"
        onClick={() => {
          setOffen(false);
          onLoeschen();
        }}
      >
        endgültig löschen
      </button>{' '}
      <button type="button" className="schalter schlicht" onClick={() => setOffen(false)}>
        abbrechen
      </button>
    </div>
  );
}
