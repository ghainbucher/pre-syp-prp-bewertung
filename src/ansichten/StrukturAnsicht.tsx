/**
 * Verwaltung von Klassen, Teams, Personen und Sprints (FA-01 bis FA-04, FA-36).
 */

import { useState } from 'react';

import { klassen as alleKlassen, neueId, personenVon, sprintsVon, teamsVon } from '../ui/auswahl';
import { BestaetigenSchalter, Karte, Textfeld } from '../ui/bausteine';
import type { AnsichtProps } from './typen';

export function StrukturAnsicht({ daten, dispatch, ui, setUi }: AnsichtProps) {
  const [neueKlasse, setNeueKlasse] = useState('');
  const [neuesTeam, setNeuesTeam] = useState('');
  const [neuerSprint, setNeuerSprint] = useState('');
  const [neuePersonen, setNeuePersonen] = useState('');
  const [neuePersonTeam, setNeuePersonTeam] = useState('');

  const klassen = alleKlassen(daten);
  const klasse = klassen.find((k) => k.id === ui.klasseId) ?? null;
  const teams = teamsVon(daten, klasse?.id ?? null);
  const personen = personenVon(daten, klasse?.id ?? null);
  const sprints = sprintsVon(daten, klasse?.id ?? null);

  function klasseAnlegen() {
    const name = neueKlasse.trim();
    if (!name) return;
    const id = neueId('k');
    dispatch({ art: 'klasse/anlegen', id, name });
    setUi({ klasseId: id, sprintId: null, teamId: null });
    setNeueKlasse('');
  }

  function teamAnlegen() {
    const name = neuesTeam.trim();
    if (!name || !klasse) return;
    dispatch({ art: 'team/anlegen', id: neueId('t'), klasseId: klasse.id, name });
    setNeuesTeam('');
  }

  function sprintAnlegen() {
    const name = neuerSprint.trim();
    if (!name || !klasse) return;
    const nummer = sprints.reduce((max, sprint) => Math.max(max, sprint.nummer), 0) + 1;
    dispatch({
      art: 'sprint/anlegen',
      sprint: { id: neueId('s'), klasseId: klasse.id, nummer, name, von: '', bis: '', faktor: 1 },
    });
    setNeuerSprint('');
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
            Struktur der Projektarbeit: Klasse, Teams, Personen und die Sprints, über die bewertet
            wird.
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
                              {personen.filter((p) => p.teamId === team.id).length} Personen
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
                        <th>Team</th>
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
                    Mehrere auf einmal: Namen mit Beistrich trennen.
                  </p>
                </div>
              </>
            )}
          </Karte>

          <Karte titel="Sprints" hinweis="Der Faktor steuert den Anteil am Gesamtergebnis" buendig>
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
                        <th>von</th>
                        <th>bis</th>
                        <th className="zahl">Faktor</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {sprints.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="anmerkung">
                            noch keine Sprints
                          </td>
                        </tr>
                      ) : (
                        sprints.map((sprint) => (
                          <tr key={sprint.id}>
                            <td>
                              <input
                                type="number"
                                className="schmal"
                                min={1}
                                step={1}
                                value={sprint.nummer}
                                aria-label="Sprintnummer"
                                onChange={(e) =>
                                  dispatch({
                                    art: 'sprint/aendern',
                                    id: sprint.id,
                                    aenderung: { nummer: Number(e.target.value) || 1 },
                                  })
                                }
                              />
                            </td>
                            <td>
                              <Textfeld
                                wert={sprint.name}
                                beschriftung="Sprintbezeichnung"
                                onAendern={(name) =>
                                  dispatch({ art: 'sprint/aendern', id: sprint.id, aenderung: { name } })
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                value={sprint.von}
                                aria-label="Sprintbeginn"
                                onChange={(e) =>
                                  dispatch({
                                    art: 'sprint/aendern',
                                    id: sprint.id,
                                    aenderung: { von: e.target.value },
                                  })
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                value={sprint.bis}
                                aria-label="Sprintende"
                                onChange={(e) =>
                                  dispatch({
                                    art: 'sprint/aendern',
                                    id: sprint.id,
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
                                value={sprint.faktor}
                                aria-label="Sprintfaktor"
                                onChange={(e) =>
                                  dispatch({
                                    art: 'sprint/aendern',
                                    id: sprint.id,
                                    aenderung: { faktor: Number(e.target.value) },
                                  })
                                }
                              />
                            </td>
                            <td className="zahl">
                              <BestaetigenSchalter
                                beschriftung="Sprint löschen"
                                onBestaetigt={() => dispatch({ art: 'sprint/loeschen', id: sprint.id })}
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
                      value={neuerSprint}
                      aria-label="Neuer Sprint"
                      placeholder="z. B. Sprint 4 – Buchungsmodul"
                      onChange={(e) => setNeuerSprint(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sprintAnlegen()}
                    />
                    <button type="button" className="schalter" onClick={sprintAnlegen}>
                      Sprint hinzufügen
                    </button>
                  </div>
                </div>
              </>
            )}
          </Karte>
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
          <p className="anmerkung">
            Beim Löschen einer Klasse werden auch ihre Teams, Sprints und Bewertungen entfernt.
          </p>
        </div>
      </div>
    </>
  );
}
