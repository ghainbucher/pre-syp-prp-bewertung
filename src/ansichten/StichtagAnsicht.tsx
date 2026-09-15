/**
 * Stammdaten · Stichtage (FA-48, FA-34 AK-3, FA-94).
 *
 * Die Zeitpunkte, zu denen ein Stand festgestellt wird: Semesterzeugnis,
 * Frühwarnung nach § 19 Abs. 3a SchUG, Jahreszeugnis.
 *
 * **Rahmendaten, aber eigenes Blatt.** Sie gehören weder zu den Schülern noch
 * zu einem Leistungsbereich – sie gelten für den ganzen Durchgang. Auf dem
 * Schülerblatt standen sie bisher nur, weil es dort Platz gab.
 *
 * Der Stichtag entscheidet mit über die Rechnung: Er begrenzt den Zeitraum, aus
 * dem Abschnitte einfließen (FA-48 AK-6), und halbiert ihn für den Zeitfaktor
 * nach § 20 Abs. 1 LBVO.
 *
 * Neben der Vorlage für den ganzen Durchgang lässt sich hier auch ein
 * **einzelner** Zeitpunkt anlegen – etwa eine zweite Frühwarnung, die es in der
 * Vorlage nicht gibt.
 */

import { useState } from 'react';

import { schuljahrVon } from '../domain/defaults';
import { loeschhinweis, nurAktive } from '../domain/loeschen';
import type { Stichtagsart } from '../domain/types';
import { neueId } from '../ui/auswahl';
import {
  BestaetigenSchalter,
  GeloeschteSchalter,
  Karte,
  Textfeld,
} from '../ui/bausteine';
import type { AnsichtProps } from './typen';

function datum(wert: string | undefined): string {
  if (!wert || !wert.trim()) return '–';
  const teile = wert.split('-');
  return teile.length === 3 ? `${teile[2]}.${teile[1]}.${teile[0]}` : wert;
}

export function StichtagAnsicht({ daten, dispatch }: AnsichtProps) {
  const [neuerName, setNeuerName] = useState('');
  const [neuesDatum, setNeuesDatum] = useState('');
  const [neueArt, setNeueArt] = useState<Stichtagsart>('kontrolle');
  const [zeigeGeloeschte, setZeigeGeloeschte] = useState(false);

  const stichtage = nurAktive(daten.stichtage).sort((a, b) => a.bis.localeCompare(b.bis));
  const geloeschte = daten.stichtage
    .filter((s) => s.geloeschtAm)
    .sort((a, b) => a.bis.localeCompare(b.bis));

  function anlegen() {
    const name = neuerName.trim();
    if (!name || !neuesDatum) return;
    dispatch({
      art: 'stichtag/anlegen',
      stichtag: { id: neueId('s'), name, bis: neuesDatum, art: neueArt },
    });
    setNeuerName('');
    setNeuesDatum('');
  }

  return (
    <>
      <div className="ansichtskopf">
        <div>
          <h2>Stammdaten · Stichtage</h2>
          <p>
            Zeitpunkte, zu denen ein Stand festgestellt wird. Sie gelten für den ganzen Durchgang
            und über beide Leistungsbereiche hinweg.
          </p>
        </div>
      </div>

      <div className="blattschmal">
        <Karte
          titel="Stichtage"
          hinweis={`${stichtage.length} Zeitpunkte`}
          rechts={
            <GeloeschteSchalter
              anzahl={geloeschte.length}
              offen={zeigeGeloeschte}
              onUmschalten={setZeigeGeloeschte}
            />
          }
        >
          {stichtage.length === 0 && !(zeigeGeloeschte && geloeschte.length > 0) ? (
            <>
              <p className="hinweis">
                Drei Zeitpunkte sind vorgesehen: <b>Semesterzeugnis</b> Ende Jänner,
                <b> Frühwarnung</b> Ende April (§ 19 Abs. 3a SchUG) und <b>Jahreszeugnis</b> Anfang
                Juni. Die Daten lassen sich danach anpassen.
              </p>
              <button
                type="button"
                className="schalter haupt"
                onClick={() => dispatch({ art: 'stichtag/vorlage', startjahr: schuljahrVon() })}
              >
                Stichtage anlegen
              </button>
            </>
          ) : (
            <div className="tabellenrahmen">
              <table>
                <thead>
                  <tr>
                    <th>Bezeichnung</th>
                    <th>letztes einbezogenes Datum</th>
                    <th>Art</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {stichtage.map((stichtag) => (
                    <tr key={stichtag.id}>
                      <td>
                        <Textfeld
                          wert={stichtag.name}
                          beschriftung={`Bezeichnung von ${stichtag.name}`}
                          onAendern={(name) =>
                            dispatch({ art: 'stichtag/aendern', id: stichtag.id, aenderung: { name } })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={stichtag.bis}
                          aria-label={`Datum von ${stichtag.name}`}
                          onChange={(e) =>
                            dispatch({
                              art: 'stichtag/aendern',
                              id: stichtag.id,
                              aenderung: { bis: e.target.value },
                            })
                          }
                        />
                      </td>
                      <td className="anmerkung">
                        {stichtag.art === 'zeugnis'
                          ? 'schließt einen Beurteilungszeitraum ab'
                          : 'wertet den laufenden Zeitraum aus'}
                      </td>
                      <td>
                        <BestaetigenSchalter
                          beschriftung="löschen"
                          onBestaetigt={() => dispatch({ art: 'stichtag/loeschen', id: stichtag.id })}
                        />
                        <div className="anmerkung">
                          {loeschhinweis(daten, 'stichtag', stichtag.id)}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {zeigeGeloeschte
                    ? geloeschte.map((stichtag) => (
                        <tr key={stichtag.id} className="geloescht">
                          <td>{stichtag.name}</td>
                          <td className="mono">{datum(stichtag.bis)}</td>
                          <td className="anmerkung">
                            {stichtag.art === 'zeugnis' ? 'Zeugnis' : 'Kontrolle'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="schalter schlicht klein"
                              onClick={() =>
                                dispatch({
                                  art: 'stammdaten/wiederherstellen',
                                  was: 'stichtag',
                                  id: stichtag.id,
                                })
                              }
                            >
                              wiederherstellen
                            </button>
                          </td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
            </div>
          )}

          <p className="hinweis" style={{ marginTop: 14 }}>
            Das Datum ist das <b>letzte einbezogene</b>, nicht der Tag der Konferenz. Ein Sprint
            zählt zu dem Stichtag, an dem er <b>endet</b> (FA-48 AK-6) – ein Sprint über den
            Jahreswechsel gehört also in das Semester, in dem er abgeschlossen wurde.
          </p>
        </Karte>

        <Karte
          titel="Einzelnen Stichtag anlegen"
          hinweis="für alles, was die Vorlage nicht vorsieht"
        >
          <div className="zeile">
            <label className="feld" style={{ flex: 1, minWidth: 220 }}>
              <span>Bezeichnung</span>
              <Textfeld
                wert={neuerName}
                beschriftung="Bezeichnung des neuen Stichtags"
                platzhalter="z. B. zweite Frühwarnung"
                onAendern={setNeuerName}
              />
            </label>
            <label className="feld">
              <span>letztes einbezogenes Datum</span>
              <input
                type="date"
                aria-label="Datum des neuen Stichtags"
                value={neuesDatum}
                onChange={(e) => setNeuesDatum(e.target.value)}
              />
            </label>
            <label className="feld">
              <span>Art</span>
              <select
                aria-label="Art des neuen Stichtags"
                value={neueArt}
                onChange={(e) => setNeueArt(e.target.value as Stichtagsart)}
              >
                <option value="kontrolle">wertet den laufenden Zeitraum aus</option>
                <option value="zeugnis">schließt einen Beurteilungszeitraum ab</option>
              </select>
            </label>
            <button type="button" className="schalter haupt" onClick={anlegen}>
              anlegen
            </button>
          </div>

          <p className="hinweis" style={{ marginTop: 12 }}>
            <b>Die Art entscheidet über die Rechnung</b>, nicht über die Beschriftung: Ein Zeugnis
            schließt einen Beurteilungszeitraum ab, der nächste beginnt danach. Eine Kontrolle
            wertet den laufenden Zeitraum nur aus und verschiebt nichts.
          </p>

          <p className="hinweis">
            <b>Gelöscht wird auf zwei Arten</b> (FA-94): Ein Stichtag ohne gesetzten Stand und ohne
            Notenstand verschwindet endgültig. Hängt ein festgestellter Stand daran, bleibt er
            stehen und wird nur ausgeblendet – sonst wäre die Note, die zu diesem Zeitpunkt
            gegeben wurde, nicht mehr rekonstruierbar (Fachkonzept G7).
          </p>
        </Karte>
      </div>
    </>
  );
}
