/**
 * Rubriken, Gewichtung, Notenschlüssel und Stranggewichte
 * (FA-05 bis FA-09, FA-15, FA-55, FA-59).
 *
 * Mehrere Rubriken sind möglich; eine davon ist die Vorgabe für neue
 * Abschnitte. Der Notenschlüssel gehört nicht zur Rubrik, sondern gilt für den
 * ganzen Gegenstand.
 */

import {
  RUBRIK_DIPLOMARBEIT,
  RUBRIK_SPRINT,
  VORLAGE_RUBRIK_SPRINT,
  strukturKopie,
} from '../domain/defaults';
import { rubrikMitId } from '../domain/zuordnung';
import type { KategorieSchluessel, Rubrik } from '../domain/types';
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
    hinweis: 'gemeinsames Ergebnis am Ende des Abschnitts',
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
    hinweis: 'je Person – bei einem Test die Fragen',
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

/** Nur die ausgelieferten Rubriken haben eine Vorlage zum Zurücksetzen. */
function hatVorlage(rubrik: Rubrik): boolean {
  return rubrik.id === RUBRIK_SPRINT || rubrik.id === RUBRIK_DIPLOMARBEIT;
}

export function RubrikAnsicht({ daten, dispatch, ui, setUi }: AnsichtProps) {
  const rubrik =
    (ui.rubrikId ? rubrikMitId(daten, ui.rubrikId) : undefined) ??
    rubrikMitId(daten, daten.vorgabeRubrikId) ??
    daten.rubriken[0];

  if (!rubrik) return <div className="leer">Keine Rubrik vorhanden.</div>;

  const gewichtssumme = KATEGORIEN.reduce(
    (summe, kategorie) => summe + (rubrik.gewichte[kategorie.schluessel] ?? 0),
    0,
  );
  // Eine Rubrik, nach der schon bewertet wurde, bleibt erhalten (FA-55 AK-3).
  const inVerwendung = daten.abschnitte.some((a) => a.rubrikId === rubrik.id && a.rubrikKopie);

  function rubrikAnlegen() {
    const id = neueId('r');
    dispatch({
      art: 'rubrik/anlegen',
      rubrik: { ...strukturKopie(VORLAGE_RUBRIK_SPRINT), id, name: 'Neue Rubrik' },
    });
    setUi({ rubrikId: id });
  }

  return (
    <>
      <div className="ansichtskopf">
        <div>
          <h2>Rubrik &amp; Notenschlüssel</h2>
          <p>
            Kriterien, Punkte und Gewichtung gehören zur Rubrik; jedem Abschnitt ist eine zugeordnet
            (FA-55). Sobald in einem Abschnitt der erste Punkt erfasst ist, rechnet er mit einer
            eingefrorenen Kopie – Änderungen hier wirken dann nur noch auf neue Abschnitte (FA-65).
          </p>
        </div>
        <span className="dehnen" />
        {hatVorlage(rubrik) ? (
          <BestaetigenSchalter
            beschriftung="Auf Vorlage zurücksetzen"
            klasse="schalter klein"
            onBestaetigt={() => dispatch({ art: 'rubrik/zuruecksetzen', rubrikId: rubrik.id })}
          />
        ) : null}
      </div>

      <div className="auswahlzeile">
        <span className="etikett">Rubrik</span>
        {daten.rubriken.map((eintrag) => (
          <button
            key={eintrag.id}
            type="button"
            className="chip"
            aria-pressed={eintrag.id === rubrik.id}
            onClick={() => setUi({ rubrikId: eintrag.id })}
          >
            {eintrag.name}
            {eintrag.id === daten.vorgabeRubrikId ? <span className="index">Vorgabe</span> : null}
          </button>
        ))}
        <button type="button" className="schalter klein" onClick={rubrikAnlegen}>
          + Rubrik
        </button>
      </div>

      <div className="zweispaltig">
        <div>
          <Karte titel="Bezeichnung" buendig>
            <div className="inhalt">
              <div className="zeile">
                <Textfeld
                  breit
                  wert={rubrik.name}
                  beschriftung="Name der Rubrik"
                  onAendern={(name) =>
                    dispatch({ art: 'rubrik/umbenennen', rubrikId: rubrik.id, name })
                  }
                />
                {daten.rubriken.length > 1 && !inVerwendung ? (
                  <BestaetigenSchalter
                    beschriftung="Rubrik löschen"
                    onBestaetigt={() => dispatch({ art: 'rubrik/loeschen', rubrikId: rubrik.id })}
                  />
                ) : null}
              </div>
              {inVerwendung ? (
                <p className="anmerkung" style={{ margin: '10px 0 0' }}>
                  Nach dieser Rubrik wurde bereits bewertet – sie lässt sich nicht mehr löschen
                  (FA-55 AK-3).
                </p>
              ) : null}
            </div>
          </Karte>

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
                                    rubrikId: rubrik.id,
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
                                    rubrikId: rubrik.id,
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
                                      rubrikId: rubrik.id,
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
                                    rubrikId: rubrik.id,
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
                        rubrikId: rubrik.id,
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
                      rubrikId: rubrik.id,
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
                <span>{gewichtssumme === 100 ? 'passt' : 'wird intern auf 100 % umgerechnet'}</span>
              </div>
              <span className="prozent">{gewichtssumme} %</span>
            </div>
          </div>

          <div className="uebersicht" style={{ marginTop: 12 }}>
            <h3>Stränge</h3>
            <div className="uebersichtszeile">
              <div className="bezeichnung">
                <b>Praxis</b>
                <span>Sprints und Diplomarbeitsvorbereitung</span>
              </div>
              <input
                type="number"
                className="schmal"
                min={0}
                max={100}
                step={5}
                value={daten.strangGewichte.praxis}
                aria-label="Gewicht Praxis"
                onChange={(e) =>
                  dispatch({
                    art: 'strang/gewicht',
                    strang: 'praxis',
                    wert: Number(e.target.value) || 0,
                  })
                }
              />
              <span className="maximum">%</span>
            </div>
            <div className="uebersichtszeile">
              <div className="bezeichnung">
                <b>Theorie</b>
                <span>eine Wochenstunde, Tests</span>
              </div>
              <input
                type="number"
                className="schmal"
                min={0}
                max={100}
                step={5}
                value={daten.strangGewichte.theorie}
                aria-label="Gewicht Theorie"
                onChange={(e) =>
                  dispatch({
                    art: 'strang/gewicht',
                    strang: 'theorie',
                    wert: Number(e.target.value) || 0,
                  })
                }
              />
              <span className="maximum">%</span>
            </div>
            <p className="anmerkung" style={{ margin: '10px 12px 0' }}>
              Vorgabe 75 zu 25 – drei von vier Wochenstunden Praxis. Ein Strang ohne Ergebnis fällt
              aus der Gewichtung, statt als 0 zu zählen.
            </p>
          </div>

          <Karte titel="Notenschlüssel" hinweis="gilt für den ganzen Gegenstand" buendig>
            <div className="tabellenrahmen">
              <table>
                <tbody>
                  {daten.notenschluessel
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
                                art: 'notengrenze',
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
                  onChange={(e) =>
                    dispatch({ art: 'rubrik/selbstZaehlt', rubrikId: rubrik.id, wert: e.target.checked })
                  }
                />
                <span>Selbsteinschätzung zählt in die Peer-Note ({rubrik.name})</span>
              </label>
            </div>
          </Karte>
        </div>
      </div>
    </>
  );
}
