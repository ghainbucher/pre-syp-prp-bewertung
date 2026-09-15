/**
 * Stammdaten · Klassen (FA-01, FA-34 AK-3).
 *
 * Ein Blatt für eine Sache: Klassen anlegen, umbenennen, löschen. Wer in der
 * Klasse ist, steht auf dem Schülerblatt nebenan – die Klasse hängt am Schüler
 * (Fachkonzept 15.1) und nicht umgekehrt.
 *
 * Das Löschen sagt vorher, was daran hängt. „Wirklich?" beantwortet jeder mit
 * Ja; „12 Schüler und 3 Tests" nicht (FA-36 AK-3).
 */

import { useState } from 'react';

import { loeschhinweis } from '../domain/loeschen';
import { abschnitteVon } from '../domain/zuordnung';
import { klassen as alleKlassen, neueId } from '../ui/auswahl';
import { BestaetigenSchalter, GeloeschteSchalter, Karte, Textfeld } from '../ui/bausteine';
import type { AnsichtProps } from './typen';

export function KlassenAnsicht({ daten, dispatch, ui }: AnsichtProps) {
  const [neu, setNeu] = useState('');
  const [zeigeGeloeschte, setZeigeGeloeschte] = useState(false);
  const klassen = alleKlassen(daten);
  const geloeschte = daten.klassen
    .filter((k) => k.geloeschtAm)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  function anlegen() {
    const name = neu.trim();
    if (!name) return;
    const id = neueId('k');
    dispatch({ art: 'klasse/anlegen', id, name });
    // **Der Filter wird nicht mitgezogen** (FA-95 AK-9): Eine neu angelegte
    // Klasse zu filtern hieße, jede andere Sicht hinter dem Rücken des
    // Benutzers enger zu stellen. Wer drei Klassen hintereinander anlegt,
    // säße danach im Filter der letzten und fände seine Schüler nicht mehr.
    setNeu('');
  }

  return (
    <>
      <div className="ansichtskopf">
        <div>
          <h2>Stammdaten · Klassen</h2>
          <p>
            Die Klassen des Durchgangs. Sie schreiben Tests gemeinsam; für Projekte spielen sie
            keine Rolle – dort zählt die Mitgliedschaft der einzelnen Schüler.
          </p>
        </div>
      </div>

      <div className="blattschmal">
        <Karte
          titel="Klassen"
          hinweis={`${klassen.length} Klassen`}
          rechts={
            <span className="zeile">
              <GeloeschteSchalter
                anzahl={geloeschte.length}
                offen={zeigeGeloeschte}
                onUmschalten={setZeigeGeloeschte}
              />
              <Textfeld
                wert={neu}
                beschriftung="Neue Klasse"
                platzhalter="z. B. 4AHIF"
                onAendern={setNeu}
              />
              <button type="button" className="schalter klein haupt" onClick={anlegen}>
                anlegen
              </button>
            </span>
          }
        >
          {klassen.length === 0 ? (
            <p className="hinweis">
              Noch keine Klasse. Ohne Klasse lassen sich keine Schüler anlegen – und ohne Schüler
              kein Projekt besetzen.
            </p>
          ) : (
            <div className="tabellenrahmen">
              <table>
                <thead>
                  <tr>
                    <th>Bezeichnung</th>
                    <th className="zahl">Schüler</th>
                    <th className="zahl">Tests</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {klassen.map((klasse) => {
                    const schueler = daten.personen.filter((p) => p.klasseId === klasse.id);
                    const tests = abschnitteVon(daten, klasse.id).filter((a) => a.art === 'test');
                    return (
                      <tr key={klasse.id} className={klasse.id === ui.klasseId ? 'gewaehlt' : undefined}>
                        <td>
                          <Textfeld
                            wert={klasse.name}
                            beschriftung={`Bezeichnung von ${klasse.name}`}
                            onAendern={(name) =>
                              dispatch({ art: 'klasse/umbenennen', id: klasse.id, name })
                            }
                          />
                        </td>
                        <td className="zahl">{schueler.length}</td>
                        <td className="zahl">{tests.length}</td>
                        <td>
                          <BestaetigenSchalter
                            beschriftung="löschen"
                            frage={
                              schueler.length + tests.length === 0
                                ? 'wirklich löschen?'
                                : `mit ${schueler.length} Schülern und ${tests.length} Tests?`
                            }
                            onBestaetigt={() => dispatch({ art: 'klasse/loeschen', id: klasse.id })}
                          />
                          <div className="anmerkung">{loeschhinweis(daten, 'klasse', klasse.id)}</div>
                        </td>
                      </tr>
                    );
                  })}
                  {zeigeGeloeschte
                    ? geloeschte.map((klasse) => (
                        <tr key={klasse.id} className="geloescht">
                          <td>{klasse.name}</td>
                          <td className="zahl">
                            {daten.personen.filter((p) => p.klasseId === klasse.id).length}
                          </td>
                          <td className="zahl">
                            {daten.abschnitte.filter((a) => a.klasseId === klasse.id && a.art === 'test').length}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="schalter schlicht klein"
                              onClick={() =>
                                dispatch({
                                  art: 'stammdaten/wiederherstellen',
                                  was: 'klasse',
                                  id: klasse.id,
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
            <b>Gelöscht wird auf zwei Arten</b> (FA-94): Hängt nichts Bewertetes an einer Klasse,
            wird sie endgültig entfernt – samt ihren Schülern und Tests. Hängen Punkte, gesetzte
            Werte oder ein Notenstand daran, bleibt alles stehen und die Klasse wird nur
            ausgeblendet; sie lässt sich jederzeit wiederherstellen. Anders wäre eine Note nicht
            mehr rekonstruierbar (Fachkonzept G7). Was im Einzelfall geschieht, steht neben dem
            Schalter.
          </p>
        </Karte>
      </div>
    </>
  );
}
