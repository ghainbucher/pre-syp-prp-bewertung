/**
 * Verwaltung von Klassen, Teams, Personen und Abschnitten
 * (FA-01 bis FA-04, FA-36, FA-52, FA-56, FA-58, FA-60).
 */

import { useState } from 'react';

import { testRubrik } from '../domain/defaults';
import { abschnitteVon, teamIn } from '../domain/zuordnung';
import type { Abschnitt, Abschnittsart, Strang } from '../domain/types';
import { klassen as alleKlassen, neueId, personenVon, teamsVon } from '../ui/auswahl';
import { BestaetigenSchalter, Karte, Textfeld } from '../ui/bausteine';
import type { AnsichtProps } from './typen';

const ARTEN: Array<{ wert: Abschnittsart; name: string; strang: Strang }> = [
  { wert: 'sprint', name: 'Sprint', strang: 'praxis' },
  { wert: 'diplomarbeit', name: 'Diplomarbeitsvorbereitung', strang: 'praxis' },
  { wert: 'test', name: 'Test', strang: 'theorie' },
];

const STRAENGE: Array<{ wert: Strang; name: string }> = [
  { wert: 'praxis', name: 'Praxis' },
  { wert: 'theorie', name: 'Theorie' },
];

export function StrukturAnsicht({ daten, dispatch, ui, setUi }: AnsichtProps) {
  const [neueKlasse, setNeueKlasse] = useState('');
  const [neuesTeam, setNeuesTeam] = useState('');
  const [neuerAbschnitt, setNeuerAbschnitt] = useState('');
  const [neueArt, setNeueArt] = useState<Abschnittsart>('sprint');
  const [neuePersonen, setNeuePersonen] = useState('');
  const [neuePersonTeam, setNeuePersonTeam] = useState('');

  const klassen = alleKlassen(daten);
  const klasse = klassen.find((k) => k.id === ui.klasseId) ?? null;
  const teams = teamsVon(daten, klasse?.id ?? null);
  const personen = personenVon(daten, klasse?.id ?? null);
  const abschnitte = abschnitteVon(daten, klasse?.id ?? null);
  const gewaehlt =
    abschnitte.find((a) => a.id === ui.abschnittId) ?? abschnitte[abschnitte.length - 1] ?? null;

  function klasseAnlegen() {
    const name = neueKlasse.trim();
    if (!name) return;
    const id = neueId('k');
    dispatch({ art: 'klasse/anlegen', id, name });
    setUi({ klasseId: id, abschnittId: null, teamId: null });
    setNeueKlasse('');
  }

  function teamAnlegen() {
    const name = neuesTeam.trim();
    if (!name || !klasse) return;
    dispatch({ art: 'team/anlegen', id: neueId('t'), klasseId: klasse.id, name });
    setNeuesTeam('');
  }

  /**
   * Legt einen Abschnitt an. Die Art bestimmt nur die vorgeschlagene Rubrik
   * und den Strang (FA-56 AK-3); ein Test bekommt eine eigene Rubrik, weil
   * ihre Kriterien die Fragen genau dieses Tests sind (FA-60 AK-2).
   */
  function abschnittAnlegen() {
    const name = neuerAbschnitt.trim();
    if (!name || !klasse) return;
    const vorgabe = ARTEN.find((a) => a.wert === neueArt)!;
    const nummer = abschnitte.reduce((max, a) => Math.max(max, a.nummer), 0) + 1;
    const id = neueId('a');
    const eigeneRubrik = neueArt === 'test' ? testRubrik(neueId('r'), name) : null;
    const neu: Abschnitt = {
      id,
      klasseId: klasse.id,
      nummer,
      name,
      art: neueArt,
      strang: vorgabe.strang,
      rubrikId: eigeneRubrik?.id ?? daten.vorgabeRubrikId,
      von: '',
      bis: '',
      faktor: 1,
      peerAktiv: false,
    };
    dispatch(
      eigeneRubrik
        ? { art: 'abschnitt/anlegen', abschnitt: neu, rubrik: eigeneRubrik }
        : { art: 'abschnitt/anlegen', abschnitt: neu },
    );
    setUi({ abschnittId: id });
    setNeuerAbschnitt('');
  }

  function personenAnlegen() {
    if (!klasse) return;
    const namen = neuePersonen
      .split(/[,;\n]/)
      .map((teil) => teil.trim())
      .filter(Boolean)
      .map((name) => ({ id: neueId('p'), name }));
    if (namen.length === 0) return;
    dispatch({
      art: 'person/anlegen',
      klasseId: klasse.id,
      teamId: neuePersonTeam || null,
      namen,
    });
    setNeuePersonen('');
  }

  return (
    <>
      <div className="ansichtskopf">
        <div>
          <h2>Klassen &amp; Teams</h2>
          <p>
            Struktur der Beurteilung: Klasse, Teams, Personen und die Abschnitte, über die bewertet
            wird – Sprints und Diplomarbeitsvorbereitung im Praxisstrang, Tests im Theoriestrang.
          </p>
        </div>
      </div>

      <div className="zweispaltig">
        <div>
          <Karte titel="Teams" hinweis={klasse?.name} buendig>
            {!klasse ? (
              <div className="leer">Zuerst eine Klasse anlegen.</div>
            ) : (
              <>
                <div className="tabellenrahmen">
                  <table>
                    <tbody>
                      {teams.length === 0 ? (
                        <tr>
                          <td className="anmerkung">noch keine Teams</td>
                        </tr>
                      ) : (
                        teams.map((team) => (
                          <tr key={team.id}>
                            <td>
                              <Textfeld
                                wert={team.name}
                                beschriftung="Teamname"
                                onAendern={(name) =>
                                  dispatch({ art: 'team/umbenennen', id: team.id, name })
                                }
                              />
                            </td>
                            <td className="anmerkung">
                              {gewaehlt
                                ? `${personen.filter((p) => teamIn(daten, gewaehlt.id, p.id) === team.id).length} Personen`
                                : `${personen.filter((p) => p.teamId === team.id).length} Personen`}
                            </td>
                            <td className="zahl">
                              <BestaetigenSchalter
                                beschriftung="Team löschen"
                                onBestaetigt={() => dispatch({ art: 'team/loeschen', id: team.id })}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="inhalt">
                  <div className="zeile">
                    <input
                      type="text"
                      value={neuesTeam}
                      aria-label="Neues Team"
                      placeholder="Teamname, z. B. Team Kepler"
                      onChange={(e) => setNeuesTeam(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && teamAnlegen()}
                    />
                    <button type="button" className="schalter" onClick={teamAnlegen}>
                      Team hinzufügen
                    </button>
                  </div>
                </div>
              </>
            )}
          </Karte>

          <Karte titel="Schülerinnen und Schüler" buendig>
            {!klasse ? (
              <div className="leer">Zuerst eine Klasse anlegen.</div>
            ) : (
              <>
                <div className="tabellenrahmen">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Team (Vorbelegung)</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {personen.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="anmerkung">
                            noch keine Einträge
                          </td>
                        </tr>
                      ) : (
                        personen.map((person) => (
                          <tr key={person.id}>
                            <td>
                              <Textfeld
                                wert={person.name}
                                beschriftung="Name"
                                onAendern={(name) =>
                                  dispatch({ art: 'person/umbenennen', id: person.id, name })
                                }
                              />
                            </td>
                            <td>
                              <select
                                aria-label={`Team von ${person.name}`}
                                value={person.teamId ?? ''}
                                onChange={(e) =>
                                  dispatch({
                                    art: 'person/teamSetzen',
                                    id: person.id,
                                    teamId: e.target.value || null,
                                  })
                                }
                              >
                                <option value="">– ohne Team –</option>
                                {teams.map((team) => (
                                  <option key={team.id} value={team.id}>
                                    {team.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="zahl">
                              <BestaetigenSchalter
                                beschriftung="entfernen"
                                onBestaetigt={() =>
                                  dispatch({ art: 'person/loeschen', id: person.id })
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
                  <div className="zeile">
                    <input
                      type="text"
                      value={neuePersonen}
                      aria-label="Neue Schülerinnen und Schüler"
                      placeholder="Nachname Vorname"
                      onChange={(e) => setNeuePersonen(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && personenAnlegen()}
                    />
                    <select
                      aria-label="Team für neue Einträge"
                      value={neuePersonTeam}
                      onChange={(e) => setNeuePersonTeam(e.target.value)}
                    >
                      <option value="">– ohne Team –</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="schalter" onClick={personenAnlegen}>
                      Hinzufügen
                    </button>
                  </div>
                  <p className="anmerkung" style={{ margin: '10px 0 0' }}>
                    Mehrere auf einmal: Namen mit Beistrich trennen. Die Vorbelegung gilt für neu
                    angelegte Abschnitte – die tatsächliche Zuordnung steht unten je Abschnitt.
                  </p>
                </div>
              </>
            )}
          </Karte>

          <Karte
            titel="Abschnitte"
            hinweis="Der Faktor steuert den Anteil am Strangergebnis"
            buendig
          >
            {!klasse ? (
              <div className="leer">Zuerst eine Klasse anlegen.</div>
            ) : (
              <>
                <div className="tabellenrahmen">
                  <table>
                    <thead>
                      <tr>
                        <th>Nr.</th>
                        <th>Bezeichnung</th>
                        <th>Art</th>
                        <th>Strang</th>
                        <th>Rubrik</th>
                        <th>von</th>
                        <th>bis</th>
                        <th className="zahl">Faktor</th>
                        <th className="zahl">Peer</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {abschnitte.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="anmerkung">
                            noch keine Abschnitte
                          </td>
                        </tr>
                      ) : (
                        abschnitte.map((abschnitt) => (
                          <tr key={abschnitt.id}>
                            <td>
                              <input
                                type="number"
                                className="schmal"
                                min={1}
                                step={1}
                                value={abschnitt.nummer}
                                aria-label="Nummer des Abschnitts"
                                onChange={(e) =>
                                  dispatch({
                                    art: 'abschnitt/aendern',
                                    id: abschnitt.id,
                                    aenderung: { nummer: Number(e.target.value) || 1 },
                                  })
                                }
                              />
                            </td>
                            <td>
                              <Textfeld
                                wert={abschnitt.name}
                                beschriftung="Bezeichnung des Abschnitts"
                                onAendern={(name) =>
                                  dispatch({
                                    art: 'abschnitt/aendern',
                                    id: abschnitt.id,
                                    aenderung: { name },
                                  })
                                }
                              />
                            </td>
                            <td>
                              <select
                                aria-label={`Art von ${abschnitt.name}`}
                                value={abschnitt.art}
                                onChange={(e) =>
                                  dispatch({
                                    art: 'abschnitt/aendern',
                                    id: abschnitt.id,
                                    aenderung: { art: e.target.value as Abschnittsart },
                                  })
                                }
                              >
                                {ARTEN.map((eintrag) => (
                                  <option key={eintrag.wert} value={eintrag.wert}>
                                    {eintrag.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                aria-label={`Strang von ${abschnitt.name}`}
                                value={abschnitt.strang}
                                onChange={(e) =>
                                  dispatch({
                                    art: 'abschnitt/aendern',
                                    id: abschnitt.id,
                                    aenderung: { strang: e.target.value as Strang },
                                  })
                                }
                              >
                                {STRAENGE.map((eintrag) => (
                                  <option key={eintrag.wert} value={eintrag.wert}>
                                    {eintrag.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              {abschnitt.rubrikKopie ? (
                                <span
                                  className="anmerkung"
                                  title="Beim ersten Punkteintrag eingefroren (FA-65)"
                                >
                                  {abschnitt.rubrikKopie.name} (eingefroren)
                                </span>
                              ) : (
                                <select
                                  aria-label={`Rubrik von ${abschnitt.name}`}
                                  value={abschnitt.rubrikId}
                                  onChange={(e) =>
                                    dispatch({
                                      art: 'abschnitt/aendern',
                                      id: abschnitt.id,
                                      aenderung: { rubrikId: e.target.value },
                                    })
                                  }
                                >
                                  {daten.rubriken.map((rubrik) => (
                                    <option key={rubrik.id} value={rubrik.id}>
                                      {rubrik.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td>
                              <input
                                type="date"
                                value={abschnitt.von}
                                aria-label={`Beginn von ${abschnitt.name}`}
                                onChange={(e) =>
                                  dispatch({
                                    art: 'abschnitt/aendern',
                                    id: abschnitt.id,
                                    aenderung: { von: e.target.value },
                                  })
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                value={abschnitt.bis}
                                aria-label={`Ende von ${abschnitt.name}`}
                                onChange={(e) =>
                                  dispatch({
                                    art: 'abschnitt/aendern',
                                    id: abschnitt.id,
                                    aenderung: { bis: e.target.value },
                                  })
                                }
                              />
                            </td>
                            <td className="zahl">
                              <input
                                type="number"
                                className="schmal"
                                min={0}
                                step={0.5}
                                value={abschnitt.faktor}
                                aria-label={`Faktor von ${abschnitt.name}`}
                                onChange={(e) =>
                                  dispatch({
                                    art: 'abschnitt/aendern',
                                    id: abschnitt.id,
                                    aenderung: { faktor: Number(e.target.value) },
                                  })
                                }
                              />
                            </td>
                            <td className="zahl">
                              <input
                                type="checkbox"
                                checked={abschnitt.peerAktiv}
                                aria-label={`Peer-Bewertung in ${abschnitt.name}`}
                                disabled={abschnitt.art === 'test'}
                                onChange={(e) =>
                                  dispatch({
                                    art: 'abschnitt/aendern',
                                    id: abschnitt.id,
                                    aenderung: { peerAktiv: e.target.checked },
                                  })
                                }
                              />
                            </td>
                            <td className="zahl">
                              <BestaetigenSchalter
                                beschriftung="Abschnitt löschen"
                                onBestaetigt={() =>
                                  dispatch({ art: 'abschnitt/loeschen', id: abschnitt.id })
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
                  <div className="zeile">
                    <input
                      type="text"
                      value={neuerAbschnitt}
                      aria-label="Neuer Abschnitt"
                      placeholder="z. B. Sprint 4 – Buchungsmodul"
                      onChange={(e) => setNeuerAbschnitt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && abschnittAnlegen()}
                    />
                    <select
                      aria-label="Art des neuen Abschnitts"
                      value={neueArt}
                      onChange={(e) => setNeueArt(e.target.value as Abschnittsart)}
                    >
                      {ARTEN.map((eintrag) => (
                        <option key={eintrag.wert} value={eintrag.wert}>
                          {eintrag.name}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="schalter" onClick={abschnittAnlegen}>
                      Abschnitt hinzufügen
                    </button>
                  </div>
                  <p className="anmerkung" style={{ margin: '10px 0 0' }}>
                    Ein Test bekommt eine eigene Rubrik mit drei Multiple-Choice-Fragen und einer
                    offenen Frage (20/20/20/40); sie ist unter „Rubrik &amp; Notenschlüssel“
                    bearbeitbar.
                  </p>
                </div>
              </>
            )}
          </Karte>

          {gewaehlt && gewaehlt.art !== 'test' ? (
            <Karte
              titel="Teamzuordnung je Abschnitt"
              hinweis={gewaehlt.name}
              buendig
              rechts={
                <select
                  aria-label="Abschnitt für die Teamzuordnung"
                  value={gewaehlt.id}
                  onChange={(e) => setUi({ abschnittId: e.target.value })}
                >
                  {abschnitte
                    .filter((a) => a.art !== 'test')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              }
            >
              {personen.length === 0 ? (
                <div className="leer">Zuerst Personen anlegen.</div>
              ) : (
                <div className="tabellenrahmen">
                  <table>
                    <tbody>
                      {personen.map((person) => (
                        <tr key={person.id}>
                          <td>
                            <b>{person.name}</b>
                          </td>
                          <td>
                            <select
                              aria-label={`Team von ${person.name} in ${gewaehlt.name}`}
                              value={teamIn(daten, gewaehlt.id, person.id) ?? ''}
                              onChange={(e) =>
                                dispatch({
                                  art: 'zugehoerigkeit/setzen',
                                  abschnittId: gewaehlt.id,
                                  personId: person.id,
                                  teamId: e.target.value || null,
                                })
                              }
                            >
                              <option value="">– ohne Team –</option>
                              {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                  {team.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="anmerkung" style={{ margin: '10px 0 0' }}>
                Teams dürfen wechseln. Eine Änderung hier gilt nur für diesen Abschnitt; frühere
                Abschnitte behalten ihre Zuordnung (FA-58).
              </p>
            </Karte>
          ) : null}
        </div>

        <div className="seite">
          <Karte titel="Klassen" buendig>
            <div className="tabellenrahmen">
              <table>
                <tbody>
                  {klassen.length === 0 ? (
                    <tr>
                      <td className="anmerkung">noch keine Klasse</td>
                    </tr>
                  ) : (
                    klassen.map((eintrag) => (
                      <tr key={eintrag.id}>
                        <td>
                          <Textfeld
                            wert={eintrag.name}
                            beschriftung="Klassenname"
                            onAendern={(name) =>
                              dispatch({ art: 'klasse/umbenennen', id: eintrag.id, name })
                            }
                          />
                        </td>
                        <td className="zahl">
                          <BestaetigenSchalter
                            beschriftung="löschen"
                            onBestaetigt={() => dispatch({ art: 'klasse/loeschen', id: eintrag.id })}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="inhalt">
              <div className="zeile">
                <input
                  type="text"
                  value={neueKlasse}
                  aria-label="Neue Klasse"
                  placeholder="z. B. 4AHIF"
                  onChange={(e) => setNeueKlasse(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && klasseAnlegen()}
                />
                <button type="button" className="schalter haupt" onClick={klasseAnlegen}>
                  Klasse anlegen
                </button>
              </div>
            </div>
          </Karte>

          {gewaehlt?.art === 'test' ? (
            <Karte titel="Angaben zum Test" hinweis={gewaehlt.name} buendig>
              <div className="inhalt">
                <div className="zeile">
                  <label className="etikett" htmlFor="angekuendigt">
                    angekündigt am
                  </label>
                  <input
                    id="angekuendigt"
                    type="date"
                    value={gewaehlt.angekuendigtAm ?? ''}
                    onChange={(e) =>
                      dispatch({
                        art: 'abschnitt/aendern',
                        id: gewaehlt.id,
                        aenderung: { angekuendigtAm: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="zeile" style={{ marginTop: 8 }}>
                  <label className="etikett" htmlFor="arbeitszeit">
                    Arbeitszeit (Minuten)
                  </label>
                  <input
                    id="arbeitszeit"
                    type="number"
                    className="schmal"
                    min={0}
                    max={25}
                    step={5}
                    value={gewaehlt.arbeitszeitMinuten ?? ''}
                    onChange={(e) =>
                      dispatch({
                        art: 'abschnitt/aendern',
                        id: gewaehlt.id,
                        aenderung: { arbeitszeitMinuten: Number(e.target.value) || undefined },
                      })
                    }
                  />
                </div>
                <p className="anmerkung" style={{ margin: '10px 0 0' }}>
                  § 8 LBVO: mindestens zwei Schultage vorher ankündigen, höchstens 25 Minuten je
                  Test.
                </p>
              </div>
            </Karte>
          ) : null}

          <p className="anmerkung">
            Beim Löschen einer Klasse werden auch ihre Teams, Abschnitte und Bewertungen entfernt.
          </p>
        </div>
      </div>
    </>
  );
}
