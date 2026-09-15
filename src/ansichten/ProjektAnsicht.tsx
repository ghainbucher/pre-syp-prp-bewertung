/**
 * Der Bereich **Projekt** (FA-87, FA-90, FA-91).
 *
 * Einstieg in die Anwendung: Hier wird wöchentlich gearbeitet, deshalb steht er
 * vorne (FA-34 AK-1, AK-2). Die Sicht zeigt
 *
 * 1. die Filter – Jahrgang, Klasse, Suche (FA-90),
 * 2. die Liste der Projekte mit dem Sprint, in dem jedes gerade steht (FA-84),
 * 3. zum gewählten Projekt seine Stammdaten und die Liste seiner Sprints
 *    (FA-91), von wo aus Planning, Daily und Review geöffnet werden.
 *
 * Die Sicht rechnet nicht: Alle Zeilen kommen aus `ui/projekte.ts` (NFA-06).
 */

import { nurAktive } from '../domain/loeschen';
import { useState } from 'react';

import type { Abschnitt } from '../domain/types';
import { klassen as alleKlassen, neueId } from '../ui/auswahl';
import { Karte, LeerHinweis, Textfeld } from '../ui/bausteine';
import {
  ART_BEZEICHNUNG,
  ART_KURZ,
  FILTER_LEER,
  projektzeilen,
  type Projektfilter,
  type Projektzeile,
} from '../ui/projekte';
import type { AnsichtProps } from './typen';

const JAHRGAENGE: Array<{ wert: 4 | 5 | null; titel: string }> = [
  { wert: null, titel: 'alle Jahrgänge' },
  { wert: 4, titel: '4. Jahrgang' },
  { wert: 5, titel: '5. Jahrgang' },
];

/** Ein Datum, wie es in einer Liste gelesen wird. Leer bleibt leer. */
function tag(wert: string): string {
  if (!wert.trim()) return '–';
  const teile = wert.split('-');
  return teile.length === 3 ? `${teile[2]}.${teile[1]}.` : wert;
}

export function ProjektAnsicht({ daten, dispatch, ui, setUi }: AnsichtProps) {
  // Nur die Suche ist flüchtig; Jahrgang und Klasse liegen im
  // Oberflächenzustand und überleben das Neuladen (FA-90 AK-3).
  const [suche, setSuche] = useState('');
  const filter: Projektfilter = {
    ...FILTER_LEER,
    jahrgang: ui.jahrgang,
    // Die Klasse kommt aus der Kopfleiste – sie gilt für die ganze Anwendung
    // und steht deshalb dort, wo sie auf jeder Sicht zu sehen ist (FA-95).
    klasse: ui.klasseId,
    nurGemischt: ui.nurGemischt,
    suche,
  };

  const klassen = alleKlassen(daten);
  const zeilen = projektzeilen(daten, filter);
  /** Welche Filter gerade greifen – für die Erklärung einer leeren Liste (FA-90 AK-4). */
  const aktiveFilter = [
    ui.jahrgang !== null ? `Jahrgang ${ui.jahrgang}` : null,
    ui.klasseId ? `Klasse ${klassen.find((k) => k.id === ui.klasseId)?.name ?? ui.klasseId}` : null,
    ui.nurGemischt ? 'nur gemischte Projekte' : null,
    suche.trim() !== '' ? `Suche „${suche.trim()}“` : null,
  ].filter((eintrag): eintrag is string => eintrag !== null);
  const gewaehlt = zeilen.find((z) => z.team.id === ui.teamId) ?? null;
  /** Ausgeblendete Projekte zählen hier nicht mit (FA-94). */
  const sichtbareProjekte = nurAktive(daten.teams).length;

  /**
   * Ein Projekt wählen.
   *
   * **Die Klasse wird nicht mitgezogen** (FA-95): Der Klassenfilter gehört dem
   * Benutzer, und ein Klick auf ein Projekt darf ihn nicht hinter seinem Rücken
   * enger stellen. Nötig war das Mitziehen, solange die Sprintsichten ihre
   * Abschnitte über den Filter suchten; sie nehmen die Klasse jetzt vom
   * gewählten Projekt.
   */
  function projektWaehlen(zeile: Projektzeile) {
    setUi({
      teamId: zeile.team.id,
      abschnittId: zeile.aktuell?.abschnitt.id ?? null,
    });
  }

  /**
   * Einen Sprint anlegen (FA-91 AK-3).
   *
   * Gleiche Wirkung wie im Sprintplanning (FA-70 AK-1): Der Abschnitt wird
   * angelegt **und** für dieses Projekt geplant. Ein Sprint ohne Planung
   * gehörte niemandem und stünde in der Leiste jedes Teams.
   */
  function sprintAnlegen(zeile: Projektzeile) {
    const nummer = daten.abschnitte.reduce((groesste, a) => Math.max(groesste, a.nummer), 0) + 1;
    const id = neueId('a');
    const neu: Abschnitt = {
      id,
      klasseId: zeile.team.klasseId,
      nummer,
      // Gleiche Zählweise wie das Kürzel (FA-04 AK-5): der wievielte Sprint
      // dieses Projekts.
      name: `Sprint ${zeile.sprints.length + 1}`,
      art: 'sprint',
      strang: 'praxis',
      rubrikId: daten.vorgabeRubrikId,
      von: '',
      bis: '',
      faktor: 1,
      peerAktiv: false,
    };
    dispatch({ art: 'abschnitt/anlegen', abschnitt: neu });
    dispatch({ art: 'planung/festhalten', abschnittId: id, teamId: zeile.team.id });
    setUi({ teamId: zeile.team.id, abschnittId: id, ansicht: 'planning' });
  }

  function sprintOeffnen(zeile: Projektzeile, abschnittId: string, ansicht: 'planning' | 'daily' | 'review') {
    setUi({ teamId: zeile.team.id, abschnittId, ansicht });
  }

  const kopf = (
    <div className="ansichtskopf">
      <div>
        <h2>Projekte</h2>
        <p>
          Ein Projekt zu einem Zeitpunkt (Fachkonzept 15.2, A2). Ein Projekt ist das, woran eine
          Gruppe arbeitet – die Klasse ist nur der Ort, aus dem die Schüler kommen. Der Ablauf
          eines Sprints liegt eine Ebene tiefer, in der Leiste „im Sprint“.
        </p>
      </div>
    </div>
  );

  if (klassen.length === 0) {
    return (
      <>
        {kopf}
        <LeerHinweis
          titel="Noch keine Klasse angelegt"
          text="Ein Projekt gehört zu einer Klasse. Zuerst unter „Stammdaten“ eine Klasse mit Schülern anlegen."
          aktion={
            <button
              type="button"
              className="schalter haupt"
              onClick={() => setUi({ ansicht: 'stammdaten', stammseite: 'klassen' })}
            >
              Zu den Stammdaten
            </button>
          }
        />
      </>
    );
  }

  return (
    <>
      {kopf}

      <Karte
        titel="Filter"
        hinweis={`${zeilen.length} von ${sichtbareProjekte} Projekten`}
      >
        <div className="auswahlzeile">
          {JAHRGAENGE.map((eintrag) => (
            <button
              key={String(eintrag.wert)}
              type="button"
              className="chip"
              aria-pressed={ui.jahrgang === eintrag.wert}
              onClick={() => setUi({ jahrgang: eintrag.wert })}
            >
              {eintrag.titel}
            </button>
          ))}
        </div>

        <div className="zeile">
          <label className="etikett" htmlFor="projektfilter-klasse">
            Klasse
          </label>
          <select
            id="projektfilter-klasse"
            value={ui.klasseId ?? ''}
            onChange={(e) =>
              setUi({ klasseId: e.target.value || null, abschnittId: null, teamId: null })
            }
          >
            <option value="">alle Klassen</option>
            {klassen.map((klasse) => (
              <option key={klasse.id} value={klasse.id}>
                {klasse.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="chip"
            aria-pressed={ui.nurGemischt}
            onClick={() => setUi({ nurGemischt: !ui.nurGemischt })}
          >
            nur gemischte
          </button>
          <Textfeld
            wert={filter.suche}
            beschriftung="Projekte durchsuchen"
            platzhalter="Name, Repository oder Klasse"
            onAendern={setSuche}
          />
        </div>

        <p className="hinweis">
          <b>Die Klassenwahl hier ist dieselbe wie oben in der Kopfleiste</b> (FA-95). Sie wirkt
          über alle Sichten: Wer hier auf die 4AHIF stellt, sieht auch in Tests und
          Notenauswertung nur diese Klasse. Sie steht zweimal, weil sie zu den Filtern dieser
          Sicht gehört – nicht, weil es zwei davon gibt.
        </p>

        <p className="hinweis">
          „Gemischt“ heißt: Die Mitglieder kommen aus mehr als einer Klasse – der Regelfall bei
          Diplomarbeiten (FA-90 AK-3). Das ist kein Fehler und wird aus den Schülern abgeleitet,
          nicht eigens erfasst. Ein Projekt gehört zu jeder Klasse, aus der ein Mitglied kommt;
          ein gemischtes steht deshalb in beiden. Der Jahrgang stammt aus dem Projekttyp; ein
          Projekt ohne Typ fällt aus dem Jahrgangsfilter heraus.
        </p>
      </Karte>

      <Karte titel="Projekte" hinweis="in welchem Sprint steht welches Projekt (FA-84)">
        {zeilen.length === 0 ? (
          <p className="hinweis">
            {sichtbareProjekte === 0 ? (
              'Noch kein Projekt angelegt. Der Name des Auftrags genügt – die Art und das Repository lassen sich danach eintragen.'
            ) : (
              <>
                Kein Projekt passt zu diesem Filter: <b>{aktiveFilter.join(' · ')}</b>. Es gibt{' '}
                {sichtbareProjekte} {sichtbareProjekte === 1 ? 'Projekt' : 'Projekte'} – die
                Liste ist nicht leer, sie ist gefiltert.{' '}
                <button
                  type="button"
                  className="schalter schlicht klein"
                  onClick={() => {
                    setUi({ jahrgang: null, klasseId: null, nurGemischt: false });
                    setSuche('');
                  }}
                >
                  Filter zurücksetzen
                </button>
              </>
            )}
          </p>
        ) : (
          <div className="tabellenrahmen">
            <table>
              <thead>
                <tr>
                  <th>Projekt</th>
                  <th>Art</th>
                  <th>Klasse(n)</th>
                  <th>Schüler</th>
                  <th>Sprint</th>
                  <th>Zeitraum</th>
                  <th>Zustand</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {zeilen.map((zeile) => (
                  <tr
                    key={zeile.team.id}
                    aria-selected={zeile.team.id === ui.teamId}
                    className={zeile.team.id === ui.teamId ? 'gewaehlt' : undefined}
                  >
                    <td>
                      <b>{zeile.team.name}</b>
                      {zeile.team.repository ? (
                        <span className="anmerkung mono"> {zeile.team.repository}</span>
                      ) : null}
                    </td>
                    <td>{zeile.art ? ART_KURZ[zeile.art] : '–'}</td>
                    <td>
                      {zeile.klassen.length > 0 ? zeile.klassen.join(', ') : zeile.klasseName}
                      {zeile.gemischt ? <span className="etikett"> gemischt</span> : null}
                    </td>
                    <td className="zahl">{zeile.mitglieder.length}</td>
                    <td>{zeile.aktuell ? zeile.aktuell.kurz : '–'}</td>
                    <td>
                      {zeile.aktuell ? `${tag(zeile.aktuell.von)}–${tag(zeile.aktuell.bis)}` : '–'}
                    </td>
                    <td>
                      {zeile.aktuell ? (
                        <span className={zeile.aktuell.laufend ? 'etikett haupt' : 'etikett'}>
                          {zeile.aktuell.laufend ? 'laufend' : zeile.aktuell.zustandText}
                        </span>
                      ) : (
                        <span className="anmerkung">kein Sprint</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="schalter schlicht klein"
                        onClick={() => projektWaehlen(zeile)}
                      >
                        öffnen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Karte>

      {gewaehlt ? <ProjektKarte
        zeile={gewaehlt}
        onSprintAnlegen={() => sprintAnlegen(gewaehlt)}
        onSprintOeffnen={(abschnittId, ansicht) => sprintOeffnen(gewaehlt, abschnittId, ansicht)}
      /> : null}
    </>
  );
}

/** Das gewählte Projekt: Stammdaten und Sprints (FA-91). */
function ProjektKarte({
  zeile,
  onSprintAnlegen,
  onSprintOeffnen,
}: {
  zeile: Projektzeile;
  onSprintAnlegen: () => void;
  onSprintOeffnen: (abschnittId: string, ansicht: 'planning' | 'daily' | 'review') => void;
}) {
  const ohneKennung = zeile.mitglieder.filter((p) => !(p.githubKennung ?? '').trim());

  return (
    <>
      <Karte
        titel={zeile.team.name}
        hinweis={`${zeile.klassen.join(', ') || zeile.klasseName} · ${
          zeile.mitglieder.length
        } Schüler`}
      >
        <div className="zeile" style={{ gap: 18 }}>
          <span className="anmerkung">{zeile.art ? ART_BEZEICHNUNG[zeile.art] : 'Typ nicht festgelegt'}</span>
          {zeile.team.repository ? (
            <span className="anmerkung mono">{zeile.team.repository}</span>
          ) : (
            <span className="anmerkung">kein Repository hinterlegt</span>
          )}
        </div>

        <p className="hinweis">
          Typ, Repository, Zeitraum, Beschreibung und die Schülerzuordnung werden unter{' '}
          <b>Stammdaten · Projekte</b> gepflegt. Angelegt, geändert und gelöscht werden
          Stammdaten nur dort – hier wird gearbeitet, nicht verwaltet.
        </p>

        {zeile.mitglieder.length === 0 ? (
          <p className="warnung">
            Diesem Projekt ist noch kein Schüler zugeordnet. Die Zuordnung geschieht je Abschnitt
            (FA-58) – im Sprintplanning oder unter „Stammdaten“.
          </p>
        ) : (
          <p className="hinweis">
            {zeile.mitglieder.map((p) => p.name).join(', ')}
            {ohneKennung.length > 0
              ? ` · ${ohneKennung.length} ohne GitHub-Kennung – ohne sie bleibt die Beitragsverteilung dieses Projekts unvollständig.`
              : ''}
          </p>
        )}
      </Karte>

      <Karte
        titel="Sprints"
        hinweis={`${zeile.sprints.length} Sprints dieses Projekts`}
        rechts={
          <button type="button" className="schalter klein haupt" onClick={onSprintAnlegen}>
            Sprint anlegen
          </button>
        }
      >
        {zeile.sprints.length === 0 ? (
          <p className="hinweis">
            Noch kein Sprint. Er entsteht beim Planning und gehört dann diesem Projekt – andere
            Projekte haben ihre eigenen (OP-F17).
          </p>
        ) : (
          <div className="tabellenrahmen">
            <table>
              <thead>
                <tr>
                  <th>Nr.</th>
                  <th>von</th>
                  <th>bis</th>
                  <th>Ziel</th>
                  <th>Zustand</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {zeile.sprints.map((sprint) => (
                  <tr key={sprint.abschnitt.id}>
                    <td className="mono">{sprint.kurz}</td>
                    <td>{tag(sprint.von)}</td>
                    <td>{tag(sprint.bis)}</td>
                    <td>
                      {sprint.ziel.trim() ? (
                        sprint.ziel
                      ) : (
                        <span className="anmerkung">kein Ziel festgehalten</span>
                      )}
                    </td>
                    <td>
                      <span className={sprint.laufend ? 'etikett haupt' : 'etikett'}>
                        {sprint.laufend ? 'laufend' : sprint.zustandText}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="schalter schlicht klein"
                        onClick={() => onSprintOeffnen(sprint.abschnitt.id, 'planning')}
                      >
                        Planning
                      </button>
                      <button
                        type="button"
                        className="schalter schlicht klein"
                        onClick={() => onSprintOeffnen(sprint.abschnitt.id, 'daily')}
                      >
                        Daily
                      </button>
                      <button
                        type="button"
                        className="schalter schlicht klein"
                        onClick={() => onSprintOeffnen(sprint.abschnitt.id, 'review')}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="hinweis">
          Die Zählung „S1, S2, …“ gilt innerhalb dieses Projekts (FA-04 AK-5): Der dritte Sprint
          dieses Teams heißt S3, auch wenn ein anderes Team zur selben Zeit schon bei fünf ist.
          Sprints derselben Klasse tragen im Bestand trotzdem fortlaufende Nummern – daher können
          versetzte Sprints ohne Weiteres nebeneinander laufen (Zusammenarbeit 11.6).
        </p>
      </Karte>
    </>
  );
}
