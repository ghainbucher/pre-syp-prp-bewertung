/**
 * Retrospektive: Maßnahmen festhalten und Nachschau halten (FA-80).
 *
 * Der zweite Halbsatz des Prinzips aus Fachkonzept 8.2a – „erst dann kann man
 * ein Team entwickeln". Ohne aufgeschriebene Maßnahme ist „im Folgesprint
 * sichtbar umgesetzt" nicht feststellbar, sondern geraten; das Prozesskriterium
 * „Retrospektive" bewertete bis hierher etwas, das nirgends stand.
 *
 * Zwei Dinge in einer Karte, weil sie im Unterricht zusammen vorkommen: die
 * Nachschau über die Maßnahmen des **vorigen** Sprints (oben, AK-4) und die
 * Maßnahmen **dieses** Sprints (unten, AK-1).
 */

import { useState } from 'react';

import { massnahmenZurNachschau, planungVon } from '../domain/zuordnung';
import type { Abschnitt, Datenbestand, Team, Umsetzungsstand } from '../domain/types';
import type { Aktion } from '../store/storeReducer';
import { neueId } from '../ui/auswahl';

import { Karte, Textfeld } from '../ui/bausteine';

const STAENDE: Array<{ wert: Umsetzungsstand; text: string }> = [
  { wert: 'ja', text: 'umgesetzt' },
  { wert: 'teilweise', text: 'teilweise' },
  { wert: 'nein', text: 'nicht umgesetzt' },
];

/** Höchstzahl der Maßnahmen: zwei bis drei, mehr merkt sich kein Team (AK-1). */
const HOECHSTZAHL = 3;

export function RetroKarte({
  daten,
  dispatch,
  abschnitt,
  team,
}: {
  daten: Datenbestand;
  dispatch: (aktion: Aktion) => void;
  abschnitt: Abschnitt;
  team: Team;
}) {
  const [neu, setNeu] = useState('');
  const planung = planungVon(daten, abschnitt.id, team.id);
  const massnahmen = planung?.massnahmen ?? [];
  const vorher = massnahmenZurNachschau(daten, abschnitt, team.id);

  return (
    <Karte
      titel="Retrospektive"
      hinweis="zwei bis drei Maßnahmen für den Folgesprint · zählt nicht in die Rechnung"
    >
      {/* AK-3, AK-4: Was sich das Team zuletzt vorgenommen hat – mit Herkunft. */}
      {vorher ? (
        <>
          <h4>Aus {vorher.herkunft.name}</h4>
          <p className="hinweis">
            Was sich {team.name} in der Retrospektive von {vorher.herkunft.name} vorgenommen hat.
            Ob es geschehen ist, ist die Grundlage für das Prozesskriterium „Retrospektive“.
          </p>
          {vorher.massnahmen.map((massnahme) => {
            const nachschau = planung?.nachschau?.[massnahme.id];
            return (
              <div className="zeile" key={massnahme.id}>
                <div className="dehnen">
                  <b>{massnahme.text}</b>
                  <div className="zeile">
                    <select
                      aria-label={`Umsetzung – ${massnahme.text}`}
                      value={nachschau?.stand ?? ''}
                      onChange={(e) =>
                        dispatch({
                          art: 'planung/nachschau',
                          abschnittId: abschnitt.id,
                          teamId: team.id,
                          massnahmeId: massnahme.id,
                          stand: (e.target.value || null) as Umsetzungsstand | null,
                        })
                      }
                    >
                      <option value="">– noch nicht nachgesehen –</option>
                      {STAENDE.map((stand) => (
                        <option key={stand.wert} value={stand.wert}>
                          {stand.text}
                        </option>
                      ))}
                    </select>
                    {nachschau ? (
                      <div className="dehnen">
                        <Textfeld
                          breit
                          wert={nachschau.notiz}
                          beschriftung={`Notiz zur Umsetzung – ${massnahme.text}`}
                          platzhalter="freiwillig"
                          onAendern={(notiz) =>
                            dispatch({
                              art: 'planung/nachschau',
                              abschnittId: abschnitt.id,
                              teamId: team.id,
                              massnahmeId: massnahme.id,
                              stand: nachschau.stand,
                              notiz,
                            })
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      ) : null}

      <h4>Für den nächsten Sprint</h4>
      {massnahmen.length === 0 ? (
        <p className="hinweis">
          Noch nichts festgehalten. Eine Maßnahme ist ein Satz, den das Team im nächsten Sprint
          einlösen kann – nicht ein Vorsatz.
        </p>
      ) : (
        massnahmen.map((massnahme, i) => (
          <div className="zeile" key={massnahme.id}>
            <span className="etikett">{i + 1}</span>
            <div className="dehnen">
              <Textfeld
                breit
                wert={massnahme.text}
                beschriftung={`Maßnahme ${i + 1} von ${team.name}`}
                onAendern={(text) =>
                  dispatch({
                    art: 'planung/massnahme',
                    abschnittId: abschnitt.id,
                    teamId: team.id,
                    massnahmeId: massnahme.id,
                    text,
                  })
                }
              />
            </div>
            <button
              type="button"
              className="schalter schlicht klein"
              onClick={() =>
                dispatch({
                  art: 'planung/massnahmeEntfernen',
                  abschnittId: abschnitt.id,
                  teamId: team.id,
                  massnahmeId: massnahme.id,
                })
              }
            >
              entfernen
            </button>
          </div>
        ))
      )}

      {massnahmen.length < HOECHSTZAHL ? (
        <div className="zeile">
          <div className="dehnen">
            <Textfeld
              breit
              wert={neu}
              beschriftung={`Neue Maßnahme für ${team.name}`}
              platzhalter="Was das Team im nächsten Sprint anders macht"
              onAendern={setNeu}
            />
          </div>
          <button
            type="button"
            className="schalter"
            disabled={neu.trim() === ''}
            onClick={() => {
              dispatch({
                art: 'planung/massnahme',
                abschnittId: abschnitt.id,
                teamId: team.id,
                massnahmeId: neueId('m'),
                text: neu,
              });
              setNeu('');
            }}
          >
            hinzufügen
          </button>
        </div>
      ) : (
        <p className="hinweis">
          Drei Maßnahmen sind genug. Mehr nimmt sich ein Team vor, als es in einem Sprint
          einlösen kann – dann ist am Ende keine davon umgesetzt.
        </p>
      )}
    </Karte>
  );
}
