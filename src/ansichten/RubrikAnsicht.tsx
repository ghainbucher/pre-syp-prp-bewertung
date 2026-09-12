/**
 * Rubriken, Gewichtung, Notenschlüssel und Stranggewichte
 * (FA-05 bis FA-09, FA-15, FA-55, FA-59).
 *
 * Mehrere Rubriken sind möglich; eine davon ist die Vorgabe für neue
 * Abschnitte. Der Notenschlüssel gehört nicht zur Rubrik, sondern gilt für den
 * ganzen Gegenstand.
 */

import { useState } from 'react';

import {
  RUBRIK_DIPLOMARBEIT,
  RUBRIK_SPRINT,
  VORLAGE_RUBRIK_SPRINT,
  strukturKopie,
} from '../domain/defaults';
import {
  angleichungAendertWerte,
  angleichungsVorschau,
  genuegendGrenze,
  zeitfaktorWeichtAb,
} from '../domain/scoring';
import { bewertungsIndex } from '../store/storeReducer';
import { rubrikMitId } from '../domain/zuordnung';
import type { KategorieSchluessel, Rubrik } from '../domain/types';
import { neueId } from '../ui/auswahl';
import { BestaetigenSchalter, Karte, Prozent, Textfeld } from '../ui/bausteine';
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
    hinweis: 'gegenseitige Einschätzung im Team – wirkt als Korrektur, nicht als Gewicht',
    erklaerung: 'Einschätzung im Team',
    mitPunkten: false,
  },
];

/** Nur die ausgelieferten Rubriken haben eine Vorlage zum Zurücksetzen. */
function hatVorlage(rubrik: Rubrik): boolean {
  return rubrik.id === RUBRIK_SPRINT || rubrik.id === RUBRIK_DIPLOMARBEIT;
}

export function RubrikAnsicht({ daten, dispatch, ui, setUi }: AnsichtProps) {
  // Zweite Bestätigung, wenn sich Prozentwerte ändern (FA-47 AK-3). Sie zwingt
  // dazu, die Vorschau anzusehen – ein zweiter Klick allein täte das nicht.
  const [gesehen, setGesehen] = useState(false);
  const rubrik =
    (ui.rubrikId ? rubrikMitId(daten, ui.rubrikId) : undefined) ??
    rubrikMitId(daten, daten.vorgabeRubrikId) ??
    daten.rubriken[0];

  if (!rubrik) return <div className="leer">Keine Rubrik vorhanden.</div>;

  // FA-47 AK-2: Was würde ein Übertragen bewirken? Ohne Antwort darauf ist
  // die Handlung nicht verantwortbar.
  const vorschau = angleichungsVorschau(daten, rubrik.id, bewertungsIndex(daten));
  const aendertWerte = angleichungAendertWerte(vorschau);

  const gewichtssumme = KATEGORIEN.filter((k) => k.schluessel !== 'peer').reduce(
    (summe, kategorie) => summe + (rubrik.gewichte[kategorie.schluessel] ?? 0),
    0,
  );
  // Eine Rubrik, nach der schon bewertet wurde, bleibt erhalten (FA-55 AK-3).
  const abschnitteDerRubrik = new Set(
    daten.abschnitte.filter((a) => a.rubrikId === rubrik.id).map((a) => a.id),
  );
  const inVerwendung =
    daten.abschnitte.some((a) => a.rubrikId === rubrik.id && a.rubrikKopie) ||
    (daten.teamabschnitte ?? []).some(
      (tp) => tp.rubrikKopie && abschnitteDerRubrik.has(tp.abschnittId),
    );

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
            Eine Rubrik ist <b>Saatgut</b>, kein Maßstab (FA-55 AK-7): Sie belegt die erste Planung
            eines Teams vor. Danach schreibt jedes Team seine eigenen Kriterien fort, und wonach ein
            Team in einem Sprint beurteilt wird, steht in dessen Planung – nicht hier. Änderungen
            wirken nur auf noch nicht geplante Sprints.
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

          {/* FA-47: Eine Rubrikänderung ausdrücklich auf bereits Bewertetes
              übertragen – nie als Nebenwirkung (AK-1). */}
          {vorschau.length > 0 ? (
            <Karte
              titel="Auf bewertete Abschnitte übertragen"
              hinweis={`${vorschau.length} ${vorschau.length === 1 ? 'Eintrag' : 'Einträge'} betroffen · fortgeschriebene Kriterien bleiben unberührt`}
              buendig
            >
              <div className="tabellenrahmen">
                <table>
                  <thead>
                    <tr>
                      <th>Abschnitt</th>
                      <th>Person</th>
                      <th className="zahl">bisher</th>
                      <th className="zahl">danach</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vorschau.flatMap((eintrag) =>
                      eintrag.folgen.length === 0
                        ? [
                            <tr key={`${eintrag.abschnitt.id}-${eintrag.teamId ?? '-'}`}>
                              <td>
                                <b>{eintrag.abschnitt.name}</b>
                                {eintrag.teamname ? <> · {eintrag.teamname}</> : null}
                              </td>
                              <td colSpan={3} className="anmerkung">
                                keine erfassten Ergebnisse
                              </td>
                            </tr>,
                          ]
                        : eintrag.folgen.map((folge, i) => {
                            const gleich =
                              folge.vorher !== null &&
                              folge.nachher !== null &&
                              Math.abs(folge.vorher - folge.nachher) <= 0.0001;
                            return (
                              <tr
                                key={`${eintrag.abschnitt.id}-${eintrag.teamId ?? '-'}-${folge.person.id}`}
                              >
                                <td>
                                  {i === 0 ? (
                                    <>
                                      <b>{eintrag.abschnitt.name}</b>
                                      {eintrag.teamname ? <> · {eintrag.teamname}</> : null}
                                    </>
                                  ) : null}
                                </td>
                                <td>{folge.person.name}</td>
                                <td className="zahl">
                                  <Prozent wert={folge.vorher} stellen={1} />
                                </td>
                                <td className={gleich ? 'zahl anmerkung' : 'zahl'}>
                                  {gleich ? (
                                    'unverändert'
                                  ) : (
                                    <b>
                                      <Prozent wert={folge.nachher} stellen={1} />
                                    </b>
                                  )}
                                </td>
                              </tr>
                            );
                          }),
                    )}
                  </tbody>
                </table>
              </div>
              <div className="inhalt">
                {aendertWerte ? (
                  <>
                    <p className="anmerkung" style={{ margin: '0 0 10px' }}>
                      <b>Das Übertragen ändert erteilte Prozentwerte.</b> Bereits besprochene
                      Beurteilungen sehen danach anders aus. Für einen Tippfehler ist das der
                      falsche Weg – dafür genügt eine Textänderung, die nichts rechnet.
                    </p>
                    <label className="zeile" style={{ gap: 7, cursor: 'pointer', marginBottom: 10 }}>
                      <input
                        type="checkbox"
                        checked={gesehen}
                        aria-label="Änderungen oben gesehen"
                        onChange={(e) => setGesehen(e.target.checked)}
                      />
                      <span>Ich habe die Änderungen oben durchgesehen</span>
                    </label>
                  </>
                ) : (
                  <p className="anmerkung" style={{ margin: '0 0 10px' }}>
                    Es ändern sich nur Bezeichnungen und Beschreibungen – kein Prozentwert bewegt
                    sich.
                  </p>
                )}
                {aendertWerte && !gesehen ? (
                  <button type="button" className="schalter" disabled>
                    Übertragen
                  </button>
                ) : (
                  <BestaetigenSchalter
                    beschriftung="Auf bewertete Abschnitte übertragen"
                    klasse="schalter"
                    onBestaetigt={() => {
                      dispatch({ art: 'abschnitt/angleichen', rubrikId: rubrik.id });
                      setGesehen(false);
                    }}
                  />
                )}
              </div>
            </Karte>
          ) : null}

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
            {KATEGORIEN.filter((kategorie) => kategorie.schluessel !== 'peer').map((kategorie) => (
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
            {/* FA-45: Die Peer-Werte tragen kein Kategoriegewicht mehr,
                sondern verschieben das Ergebnis um höchstens ± diesen Betrag. */}
            <div className="uebersichtszeile">
              <div className="bezeichnung">
                <b>Peer-Korrektur</b>
                <span>verschiebt das Ergebnis, kein eigenes Gewicht</span>
              </div>
              <input
                type="number"
                className="schmal"
                min={0}
                max={50}
                step={1}
                value={daten.peerDeckelung}
                aria-label="Höchste Peer-Korrektur in Prozentpunkten"
                onChange={(e) =>
                  dispatch({ art: 'peerDeckelung', wert: Number(e.target.value) || 0 })
                }
              />
              <span className="maximum">± PP</span>
            </div>
            {/* FA-40 AK-2: Anteil des Verstehensnachweises am individuellen Beitrag. */}
            <div className="uebersichtszeile">
              <div className="bezeichnung">
                <b>Verstehensnachweis</b>
                <span>Anteil am individuellen Beitrag</span>
              </div>
              <input
                type="number"
                className="schmal"
                min={0}
                max={100}
                step={5}
                value={daten.verstehensAnteil}
                aria-label="Anteil des Verstehensnachweises"
                onChange={(e) =>
                  dispatch({ art: 'verstehensAnteil', wert: Number(e.target.value) || 0 })
                }
              />
              <span className="maximum">%</span>
            </div>
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
            <div className="uebersichtszeile">
              <div className="bezeichnung">
                <b>Zeitfaktor zweite Hälfte</b>
                <span>§ 20 Abs. 1 LBVO – der zuletzt erreichte Stand wiegt schwerer</span>
              </div>
              <input
                type="number"
                className="schmal"
                min={1}
                max={5}
                step={1}
                value={daten.zeitfaktorZweiteHaelfte}
                aria-label="Zeitfaktor der zweiten Hälfte"
                onChange={(e) =>
                  dispatch({ art: 'zeitfaktor', wert: Number(e.target.value) || 1 })
                }
              />
              <span className="maximum">×</span>
            </div>
            <p className="anmerkung" style={{ margin: '10px 12px 0' }}>
              Vorgabe 75 zu 25 – drei von vier Wochenstunden Praxis. Ein Strang ohne Ergebnis fällt
              aus der Gewichtung, statt als 0 zu zählen.
              {zeitfaktorWeichtAb(daten.zeitfaktorZweiteHaelfte)
                ? ' Der Zeitfaktor 1 hebt die Gewichtung nach § 20 Abs. 1 LBVO auf – zulässig, aber eine bewusste Abweichung.'
                : ''}
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
                  checked={daten.sperreAktiv}
                  aria-label="Negativer Strang sperrt den Notenvorschlag"
                  onChange={(e) => dispatch({ art: 'sperre', wert: e.target.checked })}
                />
                <span>
                  Ein Strang unter {genuegendGrenze(daten.notenschluessel)} % setzt den
                  Notenvorschlag auf Nicht genügend (§ 14 LBVO)
                </span>
              </label>
              <label className="zeile" style={{ gap: 7, cursor: 'pointer', marginTop: 8 }}>
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
