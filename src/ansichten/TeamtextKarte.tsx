/**
 * Sprintwert setzen und die Rückmeldung für den Kanal (FA-82, FA-83).
 *
 * Zwei Dinge in einer Karte, weil sie zusammen erledigt werden: Erst legst du
 * fest, was das Team in diesem Sprint geleistet hat, dann nimmst du den Text
 * mit, der es dem Team sagt.
 *
 * Diese Ansicht rechnet nichts und formuliert nichts selbst: Der Vorschlag
 * kommt aus `sprintwertVorschlag`, der Text aus `teamrueckmeldungText`.
 */

import { useEffect, useState } from 'react';

import { formatProzent, sprintwertVorschlag } from '../domain/scoring';
import { planungVon } from '../domain/zuordnung';
import {
  BAUSTEINE_VORGABE,
  BAUSTEIN_BEZEICHNUNG,
  teamrueckmeldungText,
  type Bausteine,
} from '../export/teamrueckmeldung';
import type { Abschnitt, Bewertung, Datenbestand, Person, Rubrik, Team } from '../domain/types';
import type { Aktion } from '../store/storeReducer';

import { Karte, Textfeld } from '../ui/bausteine';

const SCHLUESSEL = Object.keys(BAUSTEINE_VORGABE) as Array<keyof Bausteine>;

export function TeamtextKarte({
  daten,
  dispatch,
  abschnitt,
  team,
  rubrik,
  bewertung,
  mitglieder,
}: {
  daten: Datenbestand;
  dispatch: (aktion: Aktion) => void;
  abschnitt: Abschnitt;
  team: Team;
  rubrik: Rubrik;
  bewertung: Bewertung | undefined;
  mitglieder: Person[];
}) {
  const [bausteine, setBausteine] = useState<Bausteine>(BAUSTEINE_VORGABE);
  const [text, setText] = useState('');
  const [kopiert, setKopiert] = useState(false);

  const planung = planungVon(daten, abschnitt.id, team.id);
  const gesetzt = bewertung?.gesetzt?.sprintwert;
  const vorschlag = sprintwertVorschlag(bewertung, rubrik);

  // FA-83 AK-1: Der Text ist ein **Vorschlag** und danach frei änderbar. Er
  // wird deshalb neu erzeugt, wenn sich die Bausteine oder die Daten darunter
  // ändern – aber nicht bei jedem Tastendruck im Feld.
  const vorlage = teamrueckmeldungText({
    abschnitt,
    teamname: team.name,
    planung,
    bewertung,
    mitglieder,
    bausteine,
  });
  useEffect(() => {
    setText(vorlage);
    setKopiert(false);
  }, [vorlage]);

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(text);
      setKopiert(true);
    } catch {
      // NFA-05: Fehlt die Schnittstelle oder ist sie gesperrt, bleibt der Text
      // markierbar stehen. Die Anwendung bleibt ohne sie bedienbar.
      setKopiert(false);
    }
  }

  return (
    <Karte
      titel="Rückmeldung an das Team"
      hinweis="Sprintwert festlegen · Text für den Kanal · wird nicht versendet"
    >
      {/* FA-82: Der Wert wird gesetzt, nicht gerechnet. Der Vorschlag ist der
          Team-Anteil – Team-Ergebnis und Prozess, auf 100 % umgerechnet. */}
      <h4>Sprintwert</h4>
      <div className="zeile">
        <div className="gesetzt">
          <input
            type="number"
            className="schmal"
            min={0}
            max={100}
            step={1}
            value={gesetzt ? Math.round(gesetzt.prozent) : ''}
            placeholder="–"
            aria-label={`Sprintwert von ${team.name}`}
            onChange={(e) =>
              dispatch({
                art: 'gesetzt/sprintwert',
                abschnittId: abschnitt.id,
                teamId: team.id,
                wert: e.target.value === '' ? null : Number(e.target.value),
                begruendung: gesetzt?.begruendung,
              })
            }
          />
          <span className="maximum">%</span>
        </div>
        {vorschlag !== null ? (
          <button
            type="button"
            className="schalter schlicht klein"
            onClick={() =>
              dispatch({
                art: 'gesetzt/sprintwert',
                abschnittId: abschnitt.id,
                teamId: team.id,
                wert: Math.round(vorschlag),
                begruendung: gesetzt?.begruendung,
              })
            }
          >
            Vorschlag {formatProzent(vorschlag)} % übernehmen
          </button>
        ) : null}
        {gesetzt ? (
          <button
            type="button"
            className="schalter schlicht klein"
            onClick={() =>
              dispatch({
                art: 'gesetzt/sprintwert',
                abschnittId: abschnitt.id,
                teamId: team.id,
                wert: null,
              })
            }
          >
            zurücknehmen
          </button>
        ) : null}
      </div>

      {gesetzt ? (
        <Textfeld
          breit
          wert={gesetzt.begruendung}
          beschriftung={`Begründung zum Sprintwert von ${team.name}`}
          platzhalter="Ein Satz, der im Kanal neben dem Wert steht"
          onAendern={(begruendung) =>
            dispatch({
              art: 'gesetzt/sprintwert',
              abschnittId: abschnitt.id,
              teamId: team.id,
              wert: gesetzt.prozent,
              begruendung,
            })
          }
        />
      ) : null}

      <p className="hinweis">
        Der Wert ist eine Aussage an das Team und geht in <b>keine Note</b> ein – die Jahresnote
        entsteht weiter aus den Abschnittsergebnissen je Person. Vorgeschlagen wird der
        Team-Anteil: Team-Ergebnis und Scrum-Prozess zusammen, auf 100 % umgerechnet. Der
        individuelle Beitrag bleibt draußen, weil er Personen betrifft.
      </p>

      <h4>Text für den Kanal</h4>
      <div className="zeile" style={{ flexWrap: 'wrap' }}>
        {SCHLUESSEL.map((schluessel) => (
          <label key={schluessel} className={bausteine[schluessel] ? undefined : 'anmerkung'}>
            <input
              type="checkbox"
              checked={bausteine[schluessel]}
              onChange={(e) =>
                setBausteine({ ...bausteine, [schluessel]: e.target.checked })
              }
            />{' '}
            {BAUSTEIN_BEZEICHNUNG[schluessel]}
          </label>
        ))}
      </div>

      <textarea
        rows={8}
        value={text}
        aria-label={`Rückmeldung an ${team.name} für den Kanal`}
        onChange={(e) => {
          setText(e.target.value);
          setKopiert(false);
        }}
      />

      <div className="zeile">
        <button type="button" className="schalter haupt" onClick={() => void kopieren()}>
          {kopiert ? 'kopiert' : 'in die Zwischenablage'}
        </button>
        <button
          type="button"
          className="schalter schlicht klein"
          onClick={() => {
            setText(vorlage);
            setKopiert(false);
          }}
        >
          Vorschlag wiederherstellen
        </button>
      </div>

      <p className="hinweis">
        Der Text ist frei änderbar und wird <b>nicht gespeichert</b> – gespeichert sind die
        Bausteine, aus denen er entsteht. Die Anwendung versendet nichts: Was in den Kanal
        gelangt, stellst du dort selbst hinein und siehst es vorher. Die Rückmeldung <b>je
        Person</b> gehört nicht hierher, sondern ins Einzelgespräch – sie enthält den Stand
        dieser Person, und der ist keine Sache des Teams.
      </p>
    </Karte>
  );
}
