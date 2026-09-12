/**
 * Die Sprintplanung eines Teams (FA-66, FA-67).
 *
 * Der erste Schritt eines Sprints, nicht ein Nebenprodukt der Bewertung: Ziel,
 * Zeitraum und die Kriterien, nach denen am Ende beurteilt wird, entstehen im
 * Planning – bevor gearbeitet wird. Mit dem Festhalten stehen sie fest
 * (FA-65 AK-1a); ab dem ersten Punkt sind sie nur noch über das Angleichen
 * änderbar (FA-67 AK-4).
 *
 * Diese Ansicht rechnet nichts. Sie zeigt, was die Domäne liefert, und schickt
 * Aktionen zurück.
 */

import { kriterienVorschlag, planungVon } from '../domain/zuordnung';
import type {
  Abschnitt,
  Datenbestand,
  KategorieSchluessel,
  Kriterium,
  Team,
} from '../domain/types';
import { KATEGORIE_BEZEICHNUNG, datumDeutsch } from '../domain/scoring';
import type { Aktion } from '../store/storeReducer';
import { Karte, Textfeld } from '../ui/bausteine';

const KATEGORIEN: KategorieSchluessel[] = ['team', 'prozess', 'individuell'];

/** Woher die Kriterien stammen, in einem Satz (FA-67 AK-9). */
function herkunftssatz(daten: Datenbestand, abschnitt: Abschnitt, teamId: string): string {
  const planung = planungVon(daten, abschnitt.id, teamId);
  const herkunft = planung?.herkunft;
  if (!herkunft) return 'Noch keine Kriterien festgehalten.';

  const name = (abschnittId: string) =>
    daten.abschnitte.find((a) => a.id === abschnittId)?.name ?? 'einem früheren Abschnitt';

  if (herkunft.art === 'vorlage') {
    const rubrik = daten.rubriken.find((r) => r.id === herkunft.rubrikId);
    return `Aus der Vorlage „${rubrik?.name ?? 'Rubrik'}“ übernommen.`;
  }
  if (herkunft.art === 'uebernommen') {
    return `Aus ${name(herkunft.ausAbschnittId)} übernommen, unverändert.`;
  }
  return herkunft.ausAbschnittId
    ? `Aus ${name(herkunft.ausAbschnittId)} übernommen und für diesen Sprint geändert.`
    : 'Für diesen Sprint geändert.';
}

export function PlanungsKarte({
  daten,
  dispatch,
  abschnitt,
  team,
  gesperrt,
}: {
  daten: Datenbestand;
  dispatch: (aktion: Aktion) => void;
  abschnitt: Abschnitt;
  team: Team;
  /** Sind schon Punkte erfasst? Dann sind die Kriterien eingefroren (AK-4). */
  gesperrt: boolean;
}) {
  const planung = planungVon(daten, abschnitt.id, team.id);
  const vorschlag = planung?.rubrikKopie ?? kriterienVorschlag(daten, abschnitt, team.id).rubrik;

  if (!planung) {
    return (
      <Karte
        titel="Sprint planen"
        hinweis={`${team.name} · noch nicht geplant`}
        rechts={
          <button
            type="button"
            className="schalter haupt"
            onClick={() =>
              dispatch({ art: 'planung/festhalten', abschnittId: abschnitt.id, teamId: team.id })
            }
          >
            Planung festhalten
          </button>
        }
      >
        <p className="hinweis">
          Beginn, Ende und Ziel legt jedes Team für sich fest. Mit dem Festhalten stehen auch die
          Kriterien fest, nach denen am Ende beurteilt wird – vorgeschlagen sind die des vorigen
          Sprints dieses Teams.
        </p>
        <ul className="kriterienliste">
          {KATEGORIEN.map((kategorie) =>
            vorschlag[kategorie].map((kriterium) => (
              <li key={`${kategorie}-${kriterium.id}`}>
                <span className="etikett">{KATEGORIE_BEZEICHNUNG[kategorie]}</span> {kriterium.name}{' '}
                <span className="maximum">/ {kriterium.max}</span>
              </li>
            )),
          )}
        </ul>
      </Karte>
    );
  }

  return (
    <Karte
      titel="Sprintplanung"
      hinweis={
        planung.geplantAm
          ? `festgehalten am ${datumDeutsch(planung.geplantAm.slice(0, 10))}`
          : undefined
      }
    >
      <div className="zeile">
        <label className="etikett" htmlFor={`ziel-${team.id}`}>
          Ziel
        </label>
        <div className="dehnen">
          <Textfeld
            wert={planung.ziel}
            beschriftung={`Sprint-Ziel von ${team.name}`}
            platzhalter="Woran dieses Team in diesem Sprint arbeitet"
            breit
            onAendern={(ziel) =>
              dispatch({
                art: 'planung/aendern',
                abschnittId: abschnitt.id,
                teamId: team.id,
                aenderung: { ziel },
              })
            }
          />
        </div>
      </div>

      <div className="zeile">
        <label className="etikett" htmlFor={`von-${team.id}`}>
          Beginn
        </label>
        <input
          id={`von-${team.id}`}
          type="date"
          value={planung.von}
          aria-label={`Beginn von ${team.name}`}
          onChange={(e) =>
            dispatch({
              art: 'planung/aendern',
              abschnittId: abschnitt.id,
              teamId: team.id,
              aenderung: { von: e.target.value },
            })
          }
        />
        <label className="etikett" htmlFor={`bis-${team.id}`}>
          Ende
        </label>
        <input
          id={`bis-${team.id}`}
          type="date"
          value={planung.bis}
          aria-label={`Ende von ${team.name}`}
          onChange={(e) =>
            dispatch({
              art: 'planung/aendern',
              abschnittId: abschnitt.id,
              teamId: team.id,
              aenderung: { bis: e.target.value },
            })
          }
        />
      </div>

      {planung.bis.trim() === '' ? (
        <p className="warnung" role="status">
          Ohne Enddatum bleibt dieses Team in jeder Stichtagsauswertung außen vor – es wird dort
          genannt, aber nicht mitgerechnet.
        </p>
      ) : null}

      <h4>Kriterien</h4>
      <p className="hinweis">{herkunftssatz(daten, abschnitt, team.id)}</p>

      {gesperrt ? (
        <p className="hinweis">
          Für dieses Team sind bereits Punkte erfasst – die Kriterien stehen damit fest. Eine
          Berichtigung läuft über „Rubrik angleichen“.
        </p>
      ) : (
        <VorlagenWahl daten={daten} dispatch={dispatch} abschnitt={abschnitt} team={team} />
      )}

      {KATEGORIEN.map((kategorie) => (
        <Kriterienblock
          key={kategorie}
          kategorie={kategorie}
          kriterien={vorschlag[kategorie]}
          gesperrt={gesperrt}
          onLoeschen={(index) =>
            dispatch({
              art: 'planung/kriteriumLoeschen',
              abschnittId: abschnitt.id,
              teamId: team.id,
              kategorie,
              index,
            })
          }
          onHinzufuegen={(kriterium) =>
            dispatch({
              art: 'planung/kriteriumHinzufuegen',
              abschnittId: abschnitt.id,
              teamId: team.id,
              kategorie,
              kriterium,
            })
          }
        />
      ))}
    </Karte>
  );
}

/**
 * Den ganzen Satz aus einer Vorlage neu beginnen (FA-67 AK-10).
 *
 * Der Übergang vom Vorbereitungssprint zum zweiten tauscht sechs Kriterien auf
 * einmal; einzeln wäre das der falsche Weg für einen Vorgang, der jedes Jahr
 * ansteht.
 */
function VorlagenWahl({
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
  return (
    <div className="zeile">
      <span className="etikett">Neu beginnen mit</span>
      <select
        value=""
        aria-label={`Kriterien von ${team.name} aus einer Vorlage neu beginnen`}
        onChange={(e) => {
          if (!e.target.value) return;
          dispatch({
            art: 'planung/ausVorlage',
            abschnittId: abschnitt.id,
            teamId: team.id,
            rubrikId: e.target.value,
          });
        }}
      >
        <option value="">– Vorlage wählen –</option>
        {daten.rubriken.map((rubrik) => (
          <option key={rubrik.id} value={rubrik.id}>
            {rubrik.name}
          </option>
        ))}
      </select>
      <span className="hinweis">ersetzt den ganzen Satz</span>
    </div>
  );
}

function Kriterienblock({
  kategorie,
  kriterien,
  gesperrt,
  onLoeschen,
  onHinzufuegen,
}: {
  kategorie: KategorieSchluessel;
  kriterien: Kriterium[];
  gesperrt: boolean;
  onLoeschen: (index: number) => void;
  onHinzufuegen: (kriterium: Kriterium) => void;
}) {
  return (
    <div className="kriterienblock">
      <h5>{KATEGORIE_BEZEICHNUNG[kategorie]}</h5>
      {kriterien.length === 0 ? (
        <p className="hinweis">In dieser Kategorie ist nichts vorgesehen.</p>
      ) : (
        <ul className="kriterienliste">
          {kriterien.map((kriterium, index) => (
            <li key={kriterium.id}>
              {kriterium.name} <span className="maximum">/ {kriterium.max}</span>
              {gesperrt ? null : (
                <button
                  type="button"
                  className="schalter schlicht"
                  aria-label={`${kriterium.name} für dieses Team streichen`}
                  onClick={() => onLoeschen(index)}
                >
                  streichen
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {gesperrt ? null : (
        <button
          type="button"
          className="schalter schlicht"
          onClick={() =>
            onHinzufuegen({
              id: `${kategorie}-${Date.now().toString(36)}`,
              name: 'Neues Kriterium',
              beschreibung: '',
              max: 5,
            })
          }
        >
          Kriterium ergänzen
        </button>
      )}
    </div>
  );
}
