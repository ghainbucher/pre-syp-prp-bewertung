/**
 * Rubrik, Gewichtung und Notenschlüssel (FA-05 bis FA-09, FA-15).
 */

import type { KategorieSchluessel } from '../domain/types';
import { neueId } from '../ui/auswahl';
import { BestaetigenSchalter, Karte, Textfeld } from '../ui/bausteine';
import type { AnsichtProps } from './typen';

const KATEGORIEN: Array<{
  schluessel: KategorieSchluessel;
  titel: string;
  hinweis: string;
  erklaerung: string;
  mitPunkten: boolean;
}> = [
  {
    schluessel: 'team',
    titel: 'Team-Ergebnis',
    hinweis: 'Produkt am Sprint-Ende',
    erklaerung: 'gilt für alle im Team',
    mitPunkten: true,
  },
  {
    schluessel: 'prozess',
    titel: 'Scrum-Prozess',
    hinweis: 'Planung, Daily, Board, Retrospektive',
    erklaerung: 'Arbeitsweise nach Scrum',
    mitPunkten: true,
  },
  {
    schluessel: 'individuell',
    titel: 'Individueller Beitrag',
    hinweis: 'je Person, im Sprint bewertet',
    erklaerung: 'persönlicher Beitrag',
    mitPunkten: true,
  },
  {
    schluessel: 'peer',
    titel: 'Peer-Kriterien',
    hinweis: 'gegenseitige Einschätzung im Team',
    erklaerung: 'Einschätzung im Team',
    mitPunkten: false,
  },
];

export function RubrikAnsicht({ daten, dispatch }: AnsichtProps) {
  const { rubrik } = daten;
  const gewichtssumme = KATEGORIEN.reduce(
    (summe, kategorie) => summe + (rubrik.gewichte[kategorie.schluessel] ?? 0),
    0,
  );

  return (
    <>
      <div className="ansichtskopf">
        <div>
          <h2>Rubrik &amp; Notenschlüssel</h2>
          <p>
            Kriterien, Punkte und Gewichtung gelten für alle Klassen und Sprints. Änderungen wirken
            sofort auf bereits erfasste Bewertungen.
          </p>
        </div>
        <span className="dehnen" />
        <BestaetigenSchalter
          beschriftung="Auf Vorlage zurücksetzen"
          klasse="schalter klein"
          onBestaetigt={() => dispatch({ art: 'rubrik/zuruecksetzen' })}
        />
      </div>

      <div className="zweispaltig">
        <div>
          {KATEGORIEN.map((kategorie) => {
            const kriterien = rubrik[kategorie.schluessel];
            const punktesumme = kriterien.reduce((summe, kriterium) => summe + kriterium.max, 0);
            return (
              <Karte
                key={kategorie.schluessel}
                titel={kategorie.titel}
                hinweis={kategorie.hinweis}
                buendig
                rechts={
                  <span className="maximum">
                    {kategorie.mitPunkten ? `${punktesumme} Punkte gesamt` : 'Skala 1–5'}
                  </span>
                }
              >
                <div className="tabellenrahmen">
                  <table>
                    <thead>
                      <tr>
                        <th>Kriterium</th>
                        <th>Beschreibung</th>
                        {kategorie.mitPunkten ? <th className="zahl">max.</th> : null}
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {kriterien.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="anmerkung">
                            keine Kriterien
                          </td>
                        </tr>
                      ) : (
                        kriterien.map((kriterium, index) => (
                          <tr key={kriterium.id}>
                            <td>
                              <Textfeld
                                wert={kriterium.name}
                                beschriftung="Name des Kriteriums"
                                onAendern={(name) =>
                                  dispatch({
                                    art: 'rubrik/kriteriumAendern',
                                    kategorie: kategorie.schluessel,
                                    index,
                                    aenderung: { name },
                                  })
                                }
                              />
                            </td>
                            <td>
                              <Textfeld
                                breit
                                wert={kriterium.beschreibung}
                                beschriftung="Beschreibung des Kriteriums"
                                onAendern={(beschreibung) =>
                                  dispatch({
                                    art: 'rubrik/kriteriumAendern',
                                    kategorie: kategorie.schluessel,
                                    index,
                                    aenderung: { beschreibung },
                                  })
                                }
                              />
                            </td>
                            {kategorie.mitPunkten ? (
                              <td className="zahl">
                                <input
                                  type="number"
                                  className="schmal"
                                  min={1}
                                  step={1}
                                  value={kriterium.max}
                                  aria-label={`Maximalpunkte für ${kriterium.name}`}
                                  onChange={(e) =>
                                    dispatch({
                                      art: 'rubrik/kriteriumAendern',
                                      kategorie: kategorie.schluessel,
                                      index,
                                      aenderung: { max: Math.max(1, Number(e.target.value) || 1) },
                                    })
                                  }
                                />
                              </td>
                            ) : null}
                            <td className="zahl">
                              <BestaetigenSchalter
                                beschriftung="löschen"
                                onBestaetigt={() =>
                                  dispatch({
                                    art: 'rubrik/kriteriumLoeschen',
                                    kategorie: kategorie.schluessel,
                                    index,
                                  })
                                }
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="inhalt">
                  <button
                    type="button"
                    className="schalter klein"
                    onClick={() =>
                      dispatch({
                        art: 'rubrik/kriteriumHinzufuegen',
                        kategorie: kategorie.schluessel,
                        kriterium: {
                          id: neueId(kategorie.schluessel.charAt(0)),
                          name: 'Neues Kriterium',
                          beschreibung: '',
                          max: 5,
                        },
                      })
                    }
                  >
                    + Kriterium
                  </button>
                </div>
              </Karte>
            );
          })}
        </div>

        <div className="seite">
          <div className="uebersicht">
            <h3>Gewichtung</h3>
            {KATEGORIEN.map((kategorie) => (
              <div className="uebersichtszeile" key={kategorie.schluessel}>
                <div className="bezeichnung">
                  <b>{kategorie.titel}</b>
                  <span>{kategorie.erklaerung}</span>
                </div>
                <input
                  type="number"
                  className="schmal"
                  min={0}
                  max={100}
                  step={5}
                  value={rubrik.gewichte[kategorie.schluessel] ?? 0}
                  aria-label={`Gewicht ${kategorie.titel}`}
                  onChange={(e) =>
                    dispatch({
                      art: 'rubrik/gewicht',
                      kategorie: kategorie.schluessel,
                      wert: Number(e.target.value) || 0,
                    })
                  }
                />
                <span className="maximum">%</span>
              </div>
            ))}
            <div className="uebersichtszeile summe">
              <div className="bezeichnung">
                <b>Summe</b>
                <span>
                  {gewichtssumme === 100 ? 'passt' : 'wird intern auf 100 % umgerechnet'}
                </span>
              </div>
              <span className="prozent">{gewichtssumme} %</span>
            </div>
          </div>

          <Karte titel="Notenschlüssel" buendig>
            <div className="tabellenrahmen">
              <table>
                <tbody>
                  {rubrik.notenschluessel
                    .slice()
                    .sort((a, b) => a.note - b.note)
                    .map((stufe) => (
                      <tr key={stufe.note}>
                        <td>
                          <span className={`note note-${stufe.note}`}>{stufe.note}</span>
                          <b style={{ marginLeft: 6 }}>{stufe.bezeichnung}</b>
                        </td>
                        <td className="zahl">
                          <input
                            type="number"
                            className="schmal"
                            min={0}
                            max={100}
                            step={1}
                            value={stufe.ab}
                            disabled={stufe.note === 5}
                            aria-label={`Untergrenze für Note ${stufe.note}`}
                            onChange={(e) =>
                              dispatch({
                                art: 'rubrik/notengrenze',
                                note: stufe.note,
                                ab: Number(e.target.value) || 0,
                              })
                            }
                          />{' '}
                          <span className="maximum">% und mehr</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="inhalt">
              <label className="zeile" style={{ gap: 7, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rubrik.selbstZaehlt}
                  onChange={(e) => dispatch({ art: 'rubrik/selbstZaehlt', wert: e.target.checked })}
                />
                <span>Selbsteinschätzung zählt in die Peer-Note</span>
              </label>
            </div>
          </Karte>
        </div>
      </div>
    </>
  );
}
