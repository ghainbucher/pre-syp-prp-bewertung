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

import {
  ZUSTAND_BEZEICHNUNG,
  fixierbarkeit,
  kriterienVorrat,
  kriterienVorschlag,
  planungVon,
  sprintZustand,
  ueberschneidungen,
  zeitraumVerdreht,
} from '../domain/zuordnung';
import type {
  Abschnitt,
  Datenbestand,
  KategorieSchluessel,
  Kriterium,
  Team,
} from '../domain/types';
import { KATEGORIE_BEZEICHNUNG, datumDeutsch } from '../domain/scoring';
import type { Aktion } from '../store/storeReducer';
import { useState } from 'react';

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
  // Die geltende Auswahl; vor dem Festhalten der Vorschlag (FA-67 AK-7, AK-8).
  const gewaehlt = planung?.rubrikKopie ?? kriterienVorschlag(daten, abschnitt, team.id).rubrik;
  // Alles, was zur Wahl steht (AK-2a).
  const vorrat = kriterienVorrat(daten, abschnitt, team.id);
  const ueberlappende = ueberschneidungen(daten, abschnitt.id, team.id);
  // FA-77: Solange ein Sprint nicht fixiert ist, ist er ein Vorschlag – eine
  // Absicht, die noch nicht gilt.
  const zustand = sprintZustand(daten, abschnitt.id, team.id);
  const fixierung = fixierbarkeit(daten, abschnitt, team.id);

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
            gewaehlt[kategorie].map((kriterium) => (
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
      hinweis={[
        abschnitt.art === 'sprint' ? ZUSTAND_BEZEICHNUNG[zustand] : null,
        planung.geplantAm
          ? `festgehalten am ${datumDeutsch(planung.geplantAm.slice(0, 10))}`
          : null,
        planung.fixiertAm
          ? `fixiert am ${datumDeutsch(planung.fixiertAm.slice(0, 10))}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ') || undefined}
      rechts={
        abschnitt.art === 'sprint' && zustand === 'vorschlag' ? (
          <button
            type="button"
            className="schalter haupt"
            disabled={!fixierung.erlaubt}
            onClick={() =>
              dispatch({ art: 'planung/fixieren', abschnittId: abschnitt.id, teamId: team.id })
            }
          >
            Sprint fixieren
          </button>
        ) : undefined
      }
    >
      {/* FA-77 AK-2, AK-4, AK-7: Ein Vorschlag ist als solcher zu erkennen, und
          wenn das Fixieren nicht geht, steht der Grund da. */}
      {abschnitt.art === 'sprint' && zustand === 'vorschlag' ? (
        <p className={fixierung.erlaubt ? 'hinweis' : 'warnung'} role="status">
          {fixierung.wartetAuf ? (
            <>
              Noch ein Vorschlag. Fixieren geht erst, wenn {fixierung.wartetAuf.name} mit dem
              Sprintreview abgeschlossen ist – ein neuer Sprint beginnt nicht, während der vorige
              unbesprochen ist. Erfassen lässt sich hier trotzdem schon.
            </>
          ) : (
            <>
              Noch ein Vorschlag: vorausgeplant, aber nicht der geltende Sprint. Ziel, Zeitraum und
              Kriterien sind frei änderbar. Erfassen lässt sich auch jetzt schon.
            </>
          )}
        </p>
      ) : null}
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

      {/*
        FA-96: Was in diesem Sprint umgesetzt werden soll – vorerst Freitext,
        eine Zeile je Anforderung. Das Ziel darüber ist der Satz, hier stehen
        die Punkte. Im Review steht dieser Text neben dem, was tatsächlich
        umgesetzt wurde; erst das macht den Vergleich möglich.
      */}
      <div className="zeile">
        <label className="etikett" htmlFor={`anforderungen-${team.id}`}>
          Geplante Anforderungen
        </label>
        <div className="dehnen">
          <Textfeld
            mehrzeilig
            wert={planung.geplanteAnforderungen ?? ''}
            beschriftung={`Geplante Anforderungen von ${team.name}`}
            platzhalter={'eine Zeile je Anforderung\nz. B. Storno einer Buchung'}
            breit
            onAendern={(geplanteAnforderungen) =>
              dispatch({
                art: 'planung/aendern',
                abschnittId: abschnitt.id,
                teamId: team.id,
                aenderung: { geplanteAnforderungen },
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

      {/* FA-66 AK-8: Ein Team arbeitet zu einer Zeit an einem Sprint. */}
      {zeitraumVerdreht(planung) ? (
        <p className="warnung" role="status">
          Das Ende liegt vor dem Beginn.
        </p>
      ) : null}

      {ueberlappende.length > 0 ? (
        <p className="warnung" role="status">
          Der Zeitraum überschneidet sich mit{' '}
          {ueberlappende
            .map((andere) => daten.abschnitte.find((a) => a.id === andere.abschnittId)?.name)
            .filter(Boolean)
            .join(', ')}
          . Ein Team arbeitet zu einer Zeit an einem Sprint – sonst ist nicht mehr entscheidbar,
          in welchen eine Leistung gehört. Dass ein Sprint am Tag des vorigen Endes beginnt, ist
          in Ordnung.
        </p>
      ) : null}

      <h4>Kriterien</h4>
      <p className="hinweis">{herkunftssatz(daten, abschnitt, team.id)}</p>

      {gesperrt ? (
        <p className="hinweis">
          Für dieses Team sind bereits Punkte erfasst – die Kriterien stehen damit fest. Die
          Auswahl ist unten weiterhin zu sehen; eine Berichtigung läuft über „Rubrik angleichen“.
        </p>
      ) : null}

      {KATEGORIEN.map((kategorie) => (
        <Kriterienblock
          key={kategorie}
          kategorie={kategorie}
          vorrat={vorrat[kategorie]}
          gewaehlt={gewaehlt[kategorie]}
          gesperrt={gesperrt}
          onWaehlen={(kriteriumId, an) =>
            dispatch({
              art: 'planung/kriteriumWaehlen',
              abschnittId: abschnitt.id,
              teamId: team.id,
              kategorie,
              kriteriumId,
              gewaehlt: an,
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

function Kriterienblock({
  kategorie,
  vorrat,
  gewaehlt,
  gesperrt,
  onWaehlen,
  onHinzufuegen,
}: {
  kategorie: KategorieSchluessel;
  /** Alles, was zur Wahl steht (FA-67 AK-2a). */
  vorrat: Kriterium[];
  /** Was in diesem Abschnitt gilt. */
  gewaehlt: Kriterium[];
  gesperrt: boolean;
  onWaehlen: (kriteriumId: string, an: boolean) => void;
  onHinzufuegen: (kriterium: Kriterium) => void;
}) {
  const anIds = new Set(gewaehlt.map((k) => k.id));
  const punkte = gewaehlt.reduce((summe, k) => summe + k.max, 0);

  return (
    <div className="kriterienblock">
      <h5>
        {KATEGORIE_BEZEICHNUNG[kategorie]}{' '}
        <span className="hinweis">
          {gewaehlt.length} von {vorrat.length} gewählt · {punkte} Punkte
        </span>
      </h5>
      {vorrat.length === 0 ? (
        <p className="hinweis">In dieser Kategorie steht nichts zur Wahl.</p>
      ) : (
        <ul className="kriterienliste">
          {vorrat.map((kriterium) => (
            <li key={kriterium.id}>
              <label className={anIds.has(kriterium.id) ? undefined : 'anmerkung'}>
                <input
                  type="checkbox"
                  checked={anIds.has(kriterium.id)}
                  disabled={gesperrt}
                  aria-label={`${kriterium.name} in diesem Abschnitt verwenden`}
                  onChange={(e) => onWaehlen(kriterium.id, e.target.checked)}
                />{' '}
                {kriterium.name} <span className="maximum">/ {kriterium.max}</span>
                {kriterium.beschreibung ? (
                  <span className="hinweis"> – {kriterium.beschreibung}</span>
                ) : null}
              </label>
            </li>
          ))}
        </ul>
      )}
      {gesperrt ? null : <NeuesKriterium kategorie={kategorie} onHinzufuegen={onHinzufuegen} />}
    </div>
  );
}

/**
 * Ein Kriterium anlegen, das es in keiner Rubrik gibt (FA-67 AK-2a).
 *
 * Name und Punkte gleich mit: Ein Kriterium namens „Neues Kriterium“ wäre in
 * der Belegfassung nicht begründbar. Wer es wieder loswerden will, nimmt das
 * Häkchen weg – damit fällt es aus der Auswahl und aus dem Vorrat.
 */
function NeuesKriterium({
  kategorie,
  onHinzufuegen,
}: {
  kategorie: KategorieSchluessel;
  onHinzufuegen: (kriterium: Kriterium) => void;
}) {
  const [offen, setOffen] = useState(false);
  const [name, setName] = useState('');
  const [punkte, setPunkte] = useState('5');

  if (!offen) {
    return (
      <button type="button" className="schalter schlicht" onClick={() => setOffen(true)}>
        Kriterium ergänzen
      </button>
    );
  }

  const max = Number(punkte.replace(',', '.'));
  const gueltig = name.trim().length > 0 && Number.isFinite(max) && max > 0;

  return (
    <div className="zeile">
      <Textfeld
        wert={name}
        beschriftung={`Name des neuen Kriteriums in ${KATEGORIE_BEZEICHNUNG[kategorie]}`}
        platzhalter="Bezeichnung"
        onAendern={setName}
      />
      <Textfeld
        wert={punkte}
        beschriftung={`Punkte des neuen Kriteriums in ${KATEGORIE_BEZEICHNUNG[kategorie]}`}
        platzhalter="Punkte"
        onAendern={setPunkte}
      />
      <button
        type="button"
        className="schalter klein"
        disabled={!gueltig}
        onClick={() => {
          onHinzufuegen({
            id: `${kategorie}-${Date.now().toString(36)}`,
            name: name.trim(),
            beschreibung: '',
            max,
          });
          setName('');
          setPunkte('5');
          setOffen(false);
        }}
      >
        Übernehmen
      </button>
      <button type="button" className="schalter schlicht" onClick={() => setOffen(false)}>
        abbrechen
      </button>
    </div>
  );
}
