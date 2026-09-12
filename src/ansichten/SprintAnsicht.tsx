/**
 * Die drei Sichten eines Sprints und die der Diplomarbeitsvorbereitung
 * (FA-70 bis FA-73).
 *
 * Ein Sprint wird zu drei Zeitpunkten angefasst, und die Anwendung folgt dem:
 * im **Planning** entsteht er und wird geplant, im **Daily** wird beobachtet,
 * im **Review** wird beurteilt. Welche Kriterien wo erscheinen, entscheidet
 * ihr Erfassungszeitpunkt (FA-75) – nicht eine fest verdrahtete Kennung.
 *
 * Die Diplomarbeitsvorbereitung benutzt dieselbe Maske in der Phase „Review“:
 * Sie läuft ganzjährig neben den Sprints (FA-73), wird aber wie jeder andere
 * Abschnitt erfasst und gerechnet.
 *
 * Der Test hat eine eigene Sicht (TestAnsicht, FA-74): Dort gibt es kein Team.
 */

import { useMemo, type ReactNode } from 'react';

import {
  VERSTEHENS_BEZEICHNUNG,
  VERSTEHENS_STUFEN,
  ZEITPUNKT_BEZEICHNUNG,
  zeitpunktVon,
} from '../domain/defaults';
import {
  bewertungsSchluessel,
  datumDeutsch,
  ergebnisAusRubrik,
  formatProzent,
  gesamtErgebnis,
  kategorieErgebnis,
  peerFrageFaellig,
  selbstbildAbweichung,
  tendenz,
} from '../domain/scoring';
import {
  abschnitteVon,
  mitgliederIn,
  planungVon,
  punkteErfasst,
  rubrikFuer,
  rueckmeldungOffen,
} from '../domain/zuordnung';
import { NotizenKarte } from './NotizenKarte';
import { PlanungsKarte } from './PlanungsKarte';
import type {
  Abschnitt,
  Verstehensstufe,
  GesetzterWert,
  Bewertung,
  Kriterium,
  Notenstufe,
  Person,
  Punkte,
  Rubrik,
} from '../domain/types';
import { dateiAnbieten } from '../export/csv';
import { rubrikblattDateiname, rubrikblattHtml } from '../export/rubrikblatt';
import { rueckmeldungDateiname, rueckmeldungHtml } from '../export/rueckmeldung';
import { bewertungsIndex, type PunkteKategorie } from '../store/storeReducer';
import { teamsVon } from '../ui/auswahl';
import {
  GesetztFeld,
  Karte,
  LeerHinweis,
  Notenzeichen,
  Prozent,
  Punktefeld,
  Textfeld,
} from '../ui/bausteine';
import type { AnsichtProps } from './typen';

/** Kurzzeichen für die Abschnittswahl. */
function zeichen(abschnitt: Abschnitt): string {
  if (abschnitt.art === 'test') return `T${abschnitt.nummer}`;
  if (abschnitt.art === 'diplomarbeit') return `DA${abschnitt.nummer}`;
  return `S${abschnitt.nummer}`;
}

/** In welcher Phase des Sprints wird gerade gearbeitet (FA-70 bis FA-72)? */
export type Phase = 'planning' | 'daily' | 'review';

const PHASENTEXT: Record<Phase, { titel: string; text: string }> = {
  planning: {
    titel: 'Sprintplanning',
    text: 'Hier entsteht der Sprint: Ziel, Zeitraum und die Kriterien, nach denen am Ende beurteilt wird. Was hier beobachtet wird, wird auch hier beurteilt.',
  },
  daily: {
    titel: 'Daily',
    text: 'Was während des Sprints auffällt. Ein leeres Feld bleibt „nicht bewertet“ – das Daily wird oft nicht beurteilt, und das ist kein Mangel.',
  },
  review: {
    titel: 'Sprintreview',
    text: 'Der Sprint wird abgeschlossen: Punkte, Peer-Werte, Verstehensnachweis und Rückmeldung. Was im Planning oder Daily erfasst wurde, steht hier nur noch zur Ansicht.',
  },
};

export function SprintplanningAnsicht(props: AnsichtProps) {
  return <Ablauf {...props} phase="planning" art="sprint" />;
}

export function DailyAnsicht(props: AnsichtProps) {
  return <Ablauf {...props} phase="daily" art="sprint" />;
}

export function SprintreviewAnsicht(props: AnsichtProps) {
  return <Ablauf {...props} phase="review" art="sprint" />;
}

/**
 * Die Diplomarbeitsvorbereitung (FA-73).
 *
 * Dieselbe Maske in der Phase „Review“: Sie läuft ganzjährig neben den Sprints
 * und ist kein Glied ihrer Reihe, wird aber wie jeder Abschnitt erfasst.
 */
export function DiplomarbeitAnsicht(props: AnsichtProps) {
  return <Ablauf {...props} phase="review" art="diplomarbeit" />;
}

function Ablauf({
  daten,
  dispatch,
  ui,
  setUi,
  phase,
  art,
}: AnsichtProps & { phase: Phase; art: Abschnitt['art'] }) {
  const alle = abschnitteVon(daten, ui.klasseId);
  const abschnitte = alle.filter((a) => a.art === art);
  const index = useMemo(() => bewertungsIndex(daten), [daten]);
  const istSprint = art === 'sprint';

  if (!ui.klasseId) {
    return (
      <LeerHinweis
        titel="Noch keine Klasse angelegt"
        text="Unter „Klassen & Teams“ eine Klasse mit Teams und Personen anlegen."
        aktion={
          <button type="button" className="schalter haupt" onClick={() => setUi({ ansicht: 'struktur' })}>
            Zu Klassen &amp; Teams
          </button>
        }
      />
    );
  }

  /** Einen Sprint anlegen – er entsteht beim Planning (FA-70 AK-1). */
  function sprintAnlegen() {
    const nummer = alle.reduce((groesste, a) => Math.max(groesste, a.nummer), 0) + 1;
    const id = `abschnitt-${Date.now().toString(36)}`;
    dispatch({
      art: 'abschnitt/anlegen',
      abschnitt: {
        id,
        klasseId: ui.klasseId!,
        nummer,
        name: `Sprint ${abschnitte.length + 1}`,
        art: 'sprint',
        strang: 'praxis',
        rubrikId: daten.vorgabeRubrikId,
        von: '',
        bis: '',
        faktor: 1,
        peerAktiv: false,
      },
    });
    setUi({ abschnittId: id });
  }

  if (abschnitte.length === 0) {
    return (
      <LeerHinweis
        titel={istSprint ? 'Noch kein Sprint geplant' : 'Noch keine Diplomarbeitsvorbereitung angelegt'}
        text={
          istSprint
            ? 'Ein Sprint entsteht hier, beim Planning – nicht vorab unter „Klassen & Teams“.'
            : 'Die Diplomarbeitsvorbereitung läuft ganzjährig neben den Sprints. Sie wird unter „Klassen & Teams“ angelegt.'
        }
        aktion={
          istSprint && phase === 'planning' ? (
            <button type="button" className="schalter haupt" onClick={sprintAnlegen}>
              Sprint anlegen
            </button>
          ) : istSprint ? (
            <button
              type="button"
              className="schalter haupt"
              onClick={() => setUi({ ansicht: 'planning' })}
            >
              Zum Sprintplanning
            </button>
          ) : (
            <button type="button" className="schalter haupt" onClick={() => setUi({ ansicht: 'struktur' })}>
              Zu Klassen &amp; Teams
            </button>
          )
        }
      />
    );
  }

  const abschnitt = abschnitte.find((a) => a.id === ui.abschnittId) ?? abschnitte[abschnitte.length - 1];

  const abschnittswahl = (
    <div className="auswahlzeile">
      <span className="etikett">{istSprint ? 'Sprint' : 'Abschnitt'}</span>
      {abschnitte.map((eintrag) => (
        <button
          key={eintrag.id}
          type="button"
          className="chip"
          aria-pressed={eintrag.id === abschnitt.id}
          onClick={() => setUi({ abschnittId: eintrag.id })}
        >
          <span className="index">{zeichen(eintrag)}</span>
          {eintrag.name}
        </button>
      ))}
      {istSprint && phase === 'planning' ? (
        <button type="button" className="schalter klein" onClick={sprintAnlegen}>
          + Sprint
        </button>
      ) : null}
    </div>
  );

  return (
    <TeamMaske
      daten={daten}
      dispatch={dispatch}
      ui={ui}
      setUi={setUi}
      abschnitt={abschnitt}
      index={index}
      phase={phase}
      abschnittswahl={abschnittswahl}
    />
  );
}

function TeamMaske({
  daten,
  dispatch,
  ui,
  setUi,
  abschnitt,
  index,
  phase,
  abschnittswahl,
}: AnsichtProps & {
  abschnitt: Abschnitt;
  index: Map<string, Bewertung>;
  phase: Phase;
  abschnittswahl: ReactNode;
}) {
  const teams = teamsVon(daten, ui.klasseId);

  if (teams.length === 0) {
    return (
      <LeerHinweis
        titel="Noch kein Team angelegt"
        text="Sprints und die Diplomarbeitsvorbereitung werden teamweise bewertet."
        aktion={
          <button type="button" className="schalter haupt" onClick={() => setUi({ ansicht: 'struktur' })}>
            Zu Klassen &amp; Teams
          </button>
        }
      />
    );
  }

  const team = teams.find((t) => t.id === ui.teamId) ?? teams[0];
  // FA-67: Die geltenden Kriterien hängen am Team, nicht am Abschnitt.
  const rubrik = rubrikFuer(daten, abschnitt, team.id);
  const planung = planungVon(daten, abschnitt.id, team.id);
  const mitglieder = mitgliederIn(daten, abschnitt.id, team.id);
  const bewertung = index.get(bewertungsSchluessel(abschnitt.id, team.id));
  const bewerter = mitglieder.find((p) => p.id === ui.bewerterId) ?? mitglieder[0] ?? null;
  // FA-66: Maßgeblich ist der Zeitraum des Teams; der Abschnitt gibt nur den Rahmen.
  const zeitraum = [planung?.von || abschnitt.von, planung?.bis || abschnitt.bis]
    .filter(Boolean)
    .map(datumDeutsch)
    .join(' – ');
  // FA-42 AK-4: Für wen steht die Rückmeldung noch aus?
  const offeneRueckmeldungen = new Set(
    rueckmeldungOffen(daten, abschnitt.id, index).map((p) => p.id),
  );
  // FA-75: Welche Kriterien gehören in diese Phase? Nicht die Kennung
  // entscheidet das, sondern der eingetragene Erfassungszeitpunkt.
  const hier = (kriterien: Kriterium[]) => kriterien.filter((k) => zeitpunktVon(k) === phase);
  const anderswo = (kriterien: Kriterium[]) =>
    kriterien.filter((k) => zeitpunktVon(k) !== 'review');
  const nurReview = phase === 'review';
  // Die Diplomarbeitsvorbereitung benutzt dieselbe Maske, ist aber kein Sprint
  // (FA-73): Sie trägt ihren eigenen Titel und wird hier auch geplant, weil ihr
  // „Ziel“ das gesuchte Thema ist.
  const istDiplomarbeit = abschnitt.art === 'diplomarbeit';
  const titel = istDiplomarbeit ? 'Diplomarbeitsvorbereitung' : PHASENTEXT[phase].titel;
  const einleitung = istDiplomarbeit
    ? 'Läuft ganzjährig neben den Sprints. Ziel ist hier das Thema, das das Team sucht.'
    : PHASENTEXT[phase].text;
  const mitPlanung = phase === 'planning' || istDiplomarbeit;
  const teamKriterien = hier(rubrik.team);
  const prozessKriterien = hier(rubrik.prozess);

  /** Kriterienblatt für die Klasse (FA-39) – ohne Namen und ohne Punkte. */
  function kriterienAusgeben() {
    dateiAnbieten(
      rubrikblattDateiname(abschnitt.name),
      rubrikblattHtml({
        titel: abschnitt.name,
        rubrik,
        notenschluessel: daten.notenschluessel,
        peerAktiv: abschnitt.peerAktiv,
        zeitraum: zeitraum || undefined,
      }),
      'text/html;charset=utf-8',
    );
  }

  return (
    <>
      <div className="ansichtskopf">
        <div>
          <h2>
            {titel} · {abschnitt.name} · {team.name}
          </h2>
          <p>
            {zeitraum ? `${zeitraum} · ` : ''}
            {einleitung}
          </p>
        </div>
        <span className="dehnen" />
        {/* FA-70 AK-4: Das Kriterienblatt gehört an den Anfang eines Sprints. */}
        {phase === 'planning' ? (
          <button type="button" className="schalter" onClick={kriterienAusgeben}>
            Kriterien ausgeben
          </button>
        ) : null}
      </div>

      {/* FA-72 AK-3: Die Nachfrage gehört an das Ende einer Sprintbeurteilung. */}
      {nurReview && peerFrageFaellig(daten, abschnitt, index) ? (
        <div className="meldung" role="status">
          <b>{abschnitt.name} ist fertig bewertet.</b> Soll die Peer-Bewertung ab dem nächsten
          Abschnitt laufen? Die Entscheidung liegt bei dir – die Anwendung schlägt keinen
          Zeitpunkt vor.{' '}
          <button
            type="button"
            className="schalter schlicht"
            onClick={() => dispatch({ art: 'peer/entscheidung', abschnittId: abschnitt.id, antwort: 'ja' })}
          >
            ja, ab dem nächsten
          </button>{' '}
          <button
            type="button"
            className="schalter schlicht"
            onClick={() => dispatch({ art: 'peer/entscheidung', abschnittId: abschnitt.id, antwort: 'nein' })}
          >
            nein, noch nicht
          </button>{' '}
          <button
            type="button"
            className="schalter schlicht"
            onClick={() => dispatch({ art: 'peer/entscheidung', abschnittId: abschnitt.id, antwort: 'spaeter' })}
          >
            später entscheiden
          </button>
        </div>
      ) : null}

      {abschnittswahl}

      <div className="auswahlzeile">
        <span className="etikett">Team</span>
        {teams.map((eintrag) => (
          <button
            key={eintrag.id}
            type="button"
            className="chip"
            aria-pressed={eintrag.id === team.id}
            onClick={() => setUi({ teamId: eintrag.id, bewerterId: null })}
          >
            {eintrag.name}
          </button>
        ))}
      </div>

      {mitPlanung ? (
        <PlanungsKarte
          daten={daten}
          dispatch={dispatch}
          abschnitt={abschnitt}
          team={team}
          gesperrt={punkteErfasst(daten, abschnitt.id, team.id)}
        />
      ) : null}

      <div className="zweispaltig">
        <div>
          {teamKriterien.length > 0 ? (
          <KriterienKarte
            titel="Team-Ergebnis"
            hinweis={`gilt für alle Mitglieder von ${team.name}`}
            kriterien={teamKriterien}
            punkte={bewertung?.team}
            notenschluessel={daten.notenschluessel}
            gesetzt={bewertung?.gesetzt?.kategorie?.team}
            onAendern={(kriteriumId, wert) =>
              dispatch({
                art: 'bewertung/punkte',
                abschnittId: abschnitt.id,
                teamId: team.id,
                kategorie: 'team' as PunkteKategorie,
                kriteriumId,
                wert,
              })
            }
            onGesetzt={(prozent) =>
              dispatch({
                art: 'gesetzt/kategorie',
                abschnittId: abschnitt.id,
                teamId: team.id,
                kategorie: 'team',
                wert: prozent,
              })
            }
            onBegruendung={(begruendung) =>
              dispatch({
                art: 'gesetzt/kategorie',
                abschnittId: abschnitt.id,
                teamId: team.id,
                kategorie: 'team',
                wert: bewertung?.gesetzt?.kategorie?.team?.prozent ?? 0,
                begruendung,
              })
            }
          />
          ) : null}

          {prozessKriterien.length > 0 ? (
          <KriterienKarte
            titel="Scrum-Prozess"
            hinweis="Arbeitsweise des Teams im Abschnitt"
            kriterien={prozessKriterien}
            punkte={bewertung?.prozess}
            notenschluessel={daten.notenschluessel}
            gesetzt={bewertung?.gesetzt?.kategorie?.prozess}
            onAendern={(kriteriumId, wert) =>
              dispatch({
                art: 'bewertung/punkte',
                abschnittId: abschnitt.id,
                teamId: team.id,
                kategorie: 'prozess' as PunkteKategorie,
                kriteriumId,
                wert,
              })
            }
            onGesetzt={(prozent) =>
              dispatch({
                art: 'gesetzt/kategorie',
                abschnittId: abschnitt.id,
                teamId: team.id,
                kategorie: 'prozess',
                wert: prozent,
              })
            }
            onBegruendung={(begruendung) =>
              dispatch({
                art: 'gesetzt/kategorie',
                abschnittId: abschnitt.id,
                teamId: team.id,
                kategorie: 'prozess',
                wert: bewertung?.gesetzt?.kategorie?.prozess?.prozent ?? 0,
                begruendung,
              })
            }
          />
          ) : null}

          {nurReview ? (
          <>
          <Karte titel="Individueller Beitrag" hinweis="je Schülerin und Schüler" buendig>
            {mitglieder.length === 0 ? (
              <div className="leer">Diesem Team ist in diesem Abschnitt noch niemand zugeordnet.</div>
            ) : (
              <div className="tabellenrahmen">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      {rubrik.individuell.map((kriterium) => (
                        <th key={kriterium.id} className="zahl" title={kriterium.beschreibung}>
                          {kriterium.name}
                          <br />
                          <span className="maximum">/ {kriterium.max}</span>
                        </th>
                      ))}
                      <th className="zahl">Ergebnis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mitglieder.map((person) => {
                      const punkte = bewertung?.individuell?.[person.id]?.punkte;
                      const ergebnis = kategorieErgebnis(punkte, rubrik.individuell);
                      return (
                        <tr key={person.id}>
                          <td>
                            <b>{person.name}</b>
                          </td>
                          {rubrik.individuell.map((kriterium) => (
                            <td key={kriterium.id} className="zahl">
                              <Punktefeld
                                schmal
                                wert={punkte?.[kriterium.id]}
                                max={kriterium.max}
                                beschriftung={`${person.name} – ${kriterium.name}`}
                                onAendern={(wert) =>
                                  dispatch({
                                    art: 'bewertung/individuell',
                                    abschnittId: abschnitt.id,
                                    teamId: team.id,
                                    personId: person.id,
                                    kriteriumId: kriterium.id,
                                    wert,
                                  })
                                }
                              />
                            </td>
                          ))}
                          <td className="zahl">
                            <Prozent wert={ergebnis?.prozent ?? null} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Karte>

          {nurReview && abschnitt.peerAktiv ? (
            <PeerKarte
              rubrik={rubrik}
              mitglieder={mitglieder}
              bewertung={bewertung}
              bewerter={bewerter}
              onBewerterWechseln={(id) => setUi({ bewerterId: id })}
              onAendern={(bewerterId, bewerteterId, kriteriumId, wert) =>
                dispatch({
                  art: 'bewertung/peer',
                  abschnittId: abschnitt.id,
                  teamId: team.id,
                  bewerterId,
                  bewerteterId,
                  kriteriumId,
                  wert,
                })
              }
            />
          ) : (
            <p className="anmerkung">
              Für diesen Abschnitt ist die Peer-Bewertung ausgeschaltet. Sie lässt sich unter
              „Klassen &amp; Teams“ je Abschnitt einschalten, sobald das Team das Vorgehen
              tatsächlich einhält (FA-52).
            </p>
          )}

          {/* FA-50 AK-1: das Abschnittsergebnis je Person unmittelbar setzen,
              ohne den Umweg über die Kategorien. */}
          <Karte
            titel="Ergebnis je Person setzen"
            hinweis="tritt neben das gerechnete, ersetzt es nicht"
            buendig
          >
            {mitglieder.length === 0 ? (
              <div className="leer">Diesem Team ist in diesem Abschnitt noch niemand zugeordnet.</div>
            ) : (
              <div className="tabellenrahmen">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th className="zahl">gerechnet</th>
                      <th className="zahl">gesetzt</th>
                      <th>Begründung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mitglieder.map((person) => {
                      const ergebnis = ergebnisAusRubrik(
                        bewertung,
                        person,
                        mitglieder,
                        rubrik,
                        abschnitt.peerAktiv,
                        daten.peerDeckelung,
                      );
                      const gesetzt = ergebnis.gesetzt;
                      return (
                        <tr key={person.id}>
                          <td>
                            <b>{person.name}</b>
                          </td>
                          <td className="zahl">
                            <Prozent wert={ergebnis.prozentBerechnet} stellen={1} />
                          </td>
                          <td className="zahl">
                            <Punktefeld
                              schmal
                              wert={gesetzt?.prozent}
                              max={100}
                              beschriftung={`Ergebnis gesetzt – ${person.name}`}
                              onAendern={(wert) =>
                                dispatch({
                                  art: 'gesetzt/abschnitt',
                                  abschnittId: abschnitt.id,
                                  teamId: team.id,
                                  personId: person.id,
                                  wert,
                                })
                              }
                            />
                          </td>
                          <td>
                            {gesetzt ? (
                              <Textfeld
                                breit
                                wert={gesetzt.begruendung}
                                beschriftung={`Begründung – ${person.name}`}
                                platzhalter="freiwillig"
                                onAendern={(begruendung) =>
                                  dispatch({
                                    art: 'gesetzt/abschnitt',
                                    abschnittId: abschnitt.id,
                                    teamId: team.id,
                                    personId: person.id,
                                    wert: gesetzt.prozent,
                                    begruendung,
                                  })
                                }
                              />
                            ) : (
                              <span className="anmerkung">–</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Karte>

          {/* FA-40 und FA-41: Was im Review gesprochen wurde. Der Nachweis
              rechnet mit, die Reflexion nicht. */}
          <Karte
            titel="Verstehensnachweis und Reflexion"
            hinweis={`Nachweis zählt ${daten.verstehensAnteil} % des individuellen Beitrags`}
            buendig
          >
            {mitglieder.length === 0 ? (
              <div className="leer">Diesem Team ist in diesem Abschnitt noch niemand zugeordnet.</div>
            ) : (
              <div className="tabellenrahmen">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Verstehensnachweis</th>
                      <th>Notiz dazu</th>
                      <th>Sicht der Person</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mitglieder.map((person) => {
                      const eintrag = bewertung?.individuell?.[person.id];
                      return (
                        <tr key={person.id}>
                          <td style={{ verticalAlign: 'top' }}>
                            <b>{person.name}</b>
                          </td>
                          <td style={{ verticalAlign: 'top' }}>
                            <select
                              aria-label={`Verstehensnachweis – ${person.name}`}
                              value={eintrag?.verstehen?.stufe ?? ''}
                              onChange={(e) =>
                                dispatch({
                                  art: 'bewertung/verstehen',
                                  abschnittId: abschnitt.id,
                                  teamId: team.id,
                                  personId: person.id,
                                  stufe: (e.target.value || null) as Verstehensstufe | null,
                                })
                              }
                            >
                              <option value="">– nicht erhoben –</option>
                              {VERSTEHENS_STUFEN.map((stufe) => (
                                <option key={stufe} value={stufe}>
                                  {VERSTEHENS_BEZEICHNUNG[stufe]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            {eintrag?.verstehen ? (
                              <Textfeld
                                breit
                                wert={eintrag.verstehen.notiz}
                                beschriftung={`Notiz zum Verstehensnachweis – ${person.name}`}
                                platzhalter="freiwillig"
                                onAendern={(notiz) =>
                                  dispatch({
                                    art: 'bewertung/verstehen',
                                    abschnittId: abschnitt.id,
                                    teamId: team.id,
                                    personId: person.id,
                                    stufe: eintrag.verstehen!.stufe,
                                    notiz,
                                  })
                                }
                              />
                            ) : (
                              <span className="anmerkung">–</span>
                            )}
                          </td>
                          <td>
                            <Textfeld
                              mehrzeilig
                              wert={eintrag?.reflexion ?? ''}
                              beschriftung={`Reflexion – ${person.name}`}
                              platzhalter="Was habe ich beigetragen, was gelernt, was nehme ich mir vor?"
                              onAendern={(text) =>
                                dispatch({
                                  art: 'bewertung/reflexion',
                                  abschnittId: abschnitt.id,
                                  teamId: team.id,
                                  personId: person.id,
                                  text,
                                })
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="inhalt">
              <p className="anmerkung" style={{ margin: 0 }}>
                Der Nachweis fragt nicht, wie der Code entstanden ist, sondern ob die Person für
                ihn einstehen kann (Fachkonzept 8.3). Die Sicht der Person geht in keine Rechnung
                ein – sie steht in der Belegfassung, weil sie erhoben wurde.
              </p>
            </div>
          </Karte>

          {/* FA-42: Was an die Person geht – ohne Punkte, ohne Note. */}
          <RueckmeldungsKarte
            personen={mitglieder}
            bewertung={bewertung}
            offen={offeneRueckmeldungen}
            onAendern={(personId, staerken, entwicklung) =>
              dispatch({
                art: 'bewertung/rueckmeldung',
                abschnittId: abschnitt.id,
                teamId: team.id,
                personId,
                staerken,
                entwicklung,
              })
            }
            onAusgeben={(person) => {
              const e = ergebnisAusRubrik(
                bewertung,
                person,
                mitglieder,
                rubrik,
                abschnitt.peerAktiv,
                daten.peerDeckelung,
              );
              const r = bewertung?.individuell?.[person.id]?.rueckmeldung;
              dateiAnbieten(
                rueckmeldungDateiname(person.name, abschnitt.name),
                rueckmeldungHtml({
                  personenname: person.name,
                  abschnittsname: abschnitt.name,
                  stand: e.prozent,
                  staerken: r?.staerken ?? '',
                  entwicklung: r?.entwicklung ?? '',
                  ziel: planung?.ziel || undefined,
                  zeitraum: zeitraum || undefined,
                }),
                'text/html;charset=utf-8',
              );
            }}
          />
          </>
          ) : null}

          {/* FA-72 AK-2: Was anderswo erfasst wurde, steht hier zur Ansicht. */}
          {nurReview ? (
            <AnderswoKarte
              team={anderswo(rubrik.team)}
              prozess={anderswo(rubrik.prozess)}
              punkteTeam={bewertung?.team}
              punkteProzess={bewertung?.prozess}
            />
          ) : null}

          {/* FA-71 AK-3: Was im Daily auffällt, ist meist eine Beobachtung. */}
          {phase === 'planning' && !istDiplomarbeit ? null : (
          <NotizenKarte
            personen={mitglieder}
            bewertung={bewertung}
            onAendern={(personId, notiz) =>
              dispatch({
                art: 'bewertung/individuellNotiz',
                abschnittId: abschnitt.id,
                teamId: team.id,
                personId,
                notiz,
              })
            }
          />
          )}

          {phase === 'planning' && !istDiplomarbeit ? null : (
          <Karte titel="Notiz zum Abschnitt" hinweis="Rückmeldung an das Team">
            <Textfeld
              mehrzeilig
              wert={bewertung?.notiz ?? ''}
              beschriftung="Notiz zum Abschnitt"
              platzhalter="Was ist gelungen, woran arbeitet das Team im nächsten Abschnitt?"
              onAendern={(notiz) =>
                dispatch({ art: 'bewertung/notiz', abschnittId: abschnitt.id, teamId: team.id, notiz })
              }
            />
          </Karte>
          )}
        </div>

        <div className="seite">
          <div className="uebersicht">
            <h3>Ergebnis {abschnitt.name}</h3>
            <UebersichtsZeile
              titel="Team-Ergebnis"
              unterzeile={`Gewicht ${rubrik.gewichte.team} %`}
              ergebnis={kategorieErgebnis(bewertung?.team, rubrik.team)}
              notenschluessel={daten.notenschluessel}
            />
            <UebersichtsZeile
              titel="Scrum-Prozess"
              unterzeile={`Gewicht ${rubrik.gewichte.prozess} %`}
              ergebnis={kategorieErgebnis(bewertung?.prozess, rubrik.prozess)}
              notenschluessel={daten.notenschluessel}
            />
            <div className="uebersichtszeile">
              <div className="bezeichnung">
                <span className="etikett">Schülerinnen und Schüler</span>
              </div>
            </div>
            {mitglieder.length === 0 ? (
              <div className="uebersichtszeile">
                <div className="bezeichnung">
                  <span>keine Zuordnung</span>
                </div>
              </div>
            ) : (
              mitglieder.map((person) => {
                const ergebnis = ergebnisAusRubrik(
                  bewertung,
                  person,
                  mitglieder,
                  rubrik,
                  abschnitt.peerAktiv,
                );
                const teile: string[] = [];
                if (ergebnis.individuell) {
                  teile.push(`ind. ${Math.round(ergebnis.individuell.prozent)} %`);
                }
                if (ergebnis.peer) teile.push(`peer ${Math.round(ergebnis.peer.prozent)} %`);
                if (ergebnis.korrektur !== 0) {
                  // FA-45: Die Verschiebung wird ausgewiesen, nicht versteckt –
                  // sonst ist der Unterschied zum gewichteten Wert nicht erklärbar.
                  const vorzeichen = ergebnis.korrektur > 0 ? '+' : '−';
                  teile.push(
                    `Peer-Korrektur ${vorzeichen}${formatProzent(Math.abs(ergebnis.korrektur), 1)} PP`,
                  );
                }
                if (ergebnis.gesetzt) {
                  teile.push(
                    `gesetzt – gerechnet ${
                      ergebnis.prozentBerechnet === null
                        ? 'kein Wert'
                        : `${formatProzent(ergebnis.prozentBerechnet, 1)} %`
                    }`,
                  );
                }
                const abweichung = selbstbildAbweichung(ergebnis);
                if (abweichung) {
                  teile.push(`Selbstbild ${abweichung === 'hoeher' ? 'höher' : 'niedriger'}`);
                }
                if (ergebnis.fehlend.length > 0) teile.push(`offen: ${ergebnis.fehlend.join(', ')}`);
                // FA-51 AK-1: Stand, Tendenz und offene Kategorien – die
                // Punkte stehen links, hier steht die Einordnung.
                const richtung = tendenz(
                  gesamtErgebnis(daten, person, index).praxis.abschnitte,
                );
                if (richtung !== null) {
                  teile.push(
                    richtung === 'steigend'
                      ? 'Tendenz steigend'
                      : richtung === 'fallend'
                        ? 'Tendenz fallend'
                        : 'Tendenz gleichbleibend',
                  );
                }

                return (
                  <div className="uebersichtszeile" key={person.id}>
                    <div className="bezeichnung">
                      <b>{person.name}</b>
                      <span>{teile.join(' · ') || 'noch nichts erfasst'}</span>
                    </div>
                    <Prozent wert={ergebnis.prozent} />
                    <Notenzeichen prozent={ergebnis.prozent} notenschluessel={daten.notenschluessel} />
                  </div>
                );
              })
            )}
          </div>
          <p className="anmerkung" style={{ marginTop: 10 }}>
            Nicht bewertete Kategorien werden nicht als 0 gewertet, sondern aus der Gewichtung
            herausgerechnet.
          </p>
          {abschnitt.rubrikKopie ? (
            <p className="anmerkung">
              Dieser Abschnitt rechnet mit der beim ersten Eintrag eingefrorenen Rubrik
              „{abschnitt.rubrikKopie.name}“. Spätere Änderungen an der Rubrik wirken hier nicht
              mehr (FA-65).
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

/**
 * Rückmeldung an die Person (FA-42).
 *
 * Bewusst neben, nicht in der Notizkarte: Die Notiz bleibt bei der Lehrkraft,
 * diese Rückmeldung geht hinaus. Zwei Felder statt eines Freitexts, weil
 * AK-1 drei Fragen verlangt und die dritte – der Stand – aus der Rechnung
 * kommt.
 */
function RueckmeldungsKarte({
  personen,
  bewertung,
  offen,
  onAendern,
  onAusgeben,
}: {
  personen: Person[];
  bewertung: Bewertung | undefined;
  offen: Set<string>;
  onAendern: (personId: string, staerken: string, entwicklung: string) => void;
  onAusgeben: (person: Person) => void;
}) {
  if (personen.length === 0) return null;
  const offeneHier = personen.filter((p) => offen.has(p.id));

  return (
    <Karte
      titel="Rückmeldung an die Person"
      hinweis="geht hinaus – ohne Punkte, ohne Note"
      buendig
      rechts={
        <span className="maximum">
          {offeneHier.length === 0
            ? 'alle erledigt'
            : `${offeneHier.length} offen: ${offeneHier.map((p) => p.name).join(', ')}`}
        </span>
      }
    >
      <div className="tabellenrahmen">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Das ist gelungen</th>
              <th>Daran arbeiten</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {personen.map((person) => {
              const r = bewertung?.individuell?.[person.id]?.rueckmeldung;
              return (
                <tr key={person.id}>
                  <td style={{ verticalAlign: 'top' }}>
                    <b>{person.name}</b>
                    {offen.has(person.id) ? <span className="maximum"> offen</span> : null}
                  </td>
                  <td>
                    <Textfeld
                      mehrzeilig
                      wert={r?.staerken ?? ''}
                      beschriftung={`Stärken – ${person.name}`}
                      platzhalter="zwei bis drei – je Zeile eine"
                      onAendern={(text) => onAendern(person.id, text, r?.entwicklung ?? '')}
                    />
                  </td>
                  <td>
                    <Textfeld
                      mehrzeilig
                      wert={r?.entwicklung ?? ''}
                      beschriftung={`Entwicklungsfelder – ${person.name}`}
                      platzhalter="ein bis zwei – je Zeile eines"
                      onAendern={(text) => onAendern(person.id, r?.staerken ?? '', text)}
                    />
                  </td>
                  <td className="zahl" style={{ verticalAlign: 'top' }}>
                    <button
                      type="button"
                      className="schalter klein"
                      disabled={r === undefined}
                      onClick={() => onAusgeben(person)}
                    >
                      ausgeben
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="inhalt">
        <p className="anmerkung" style={{ margin: 0 }}>
          Je Person eine eigene Datei – so enthält jedes Blatt nur die Daten einer Person. Die
          vollständige Herleitung ist die Belegfassung (FA-32) und geht nicht mit hinaus.
        </p>
      </div>
    </Karte>
  );
}

/**
 * Freitext je Person (FA-17).
 *
 * Steht bewusst neben der Notiz an das Team (FA-16): Die eine geht an die
 * Gruppe, die andere ist eine Aufzeichnung der Lehrkraft für Gespräch und
 * Begründung (§ 18 Abs. 1 SchUG). Sie erscheint in keiner Ausgabe an die
 * Klasse.
 */
function UebersichtsZeile({
  titel,
  unterzeile,
  ergebnis,
  notenschluessel,
}: {
  titel: string;
  unterzeile: string;
  ergebnis: ReturnType<typeof kategorieErgebnis>;
  notenschluessel: Notenstufe[];
}) {
  return (
    <div className="uebersichtszeile">
      <div className="bezeichnung">
        <b>{titel}</b>
        <span>
          {unterzeile}
          {ergebnis ? ` · ${ergebnis.erreicht} / ${ergebnis.moeglich} P` : ''}
        </span>
      </div>
      <Prozent wert={ergebnis?.prozent ?? null} />
      <Notenzeichen prozent={ergebnis?.prozent ?? null} notenschluessel={notenschluessel} />
    </div>
  );
}

function KriterienKarte({
  titel,
  hinweis,
  kriterien,
  punkte,
  notenschluessel,
  gesetzt,
  onAendern,
  onGesetzt,
  onBegruendung,
}: {
  titel: string;
  hinweis: string;
  kriterien: Kriterium[];
  punkte: Punkte | undefined;
  notenschluessel: Notenstufe[];
  gesetzt: GesetzterWert | undefined;
  onAendern: (kriteriumId: string, wert: number | null) => void;
  onGesetzt: (prozent: number | null) => void;
  onBegruendung: (text: string) => void;
}) {
  if (kriterien.length === 0) return null;
  const berechnet = kategorieErgebnis(punkte, kriterien);
  // FA-50 AK-3: Liegt ein gesetzter Wert vor, gilt er – die Rechnung darunter
  // läuft weiter und bleibt sichtbar.
  const ergebnis = gesetzt ? { ...berechnet, prozent: gesetzt.prozent } : berechnet;
  return (
    <Karte
      titel={titel}
      hinweis={hinweis}
      buendig
      rechts={
        <span className="zeile">
          <Prozent wert={ergebnis?.prozent ?? null} />
          <Notenzeichen prozent={ergebnis?.prozent ?? null} notenschluessel={notenschluessel} />
        </span>
      }
    >
      <div className="tabellenrahmen">
        <table>
          <tbody>
            {kriterien.map((kriterium) => (
              <tr key={kriterium.id}>
                <td>
                  <span className="kriterium">{kriterium.name}</span>
                  <span className="erlaeuterung">{kriterium.beschreibung}</span>
                </td>
                <td className="zahl" style={{ width: 150 }}>
                  <Punktefeld
                    wert={punkte?.[kriterium.id]}
                    max={kriterium.max}
                    beschriftung={kriterium.name}
                    onAendern={(wert) => onAendern(kriterium.id, wert)}
                  />{' '}
                  <span className="maximum">/ {kriterium.max}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <GesetztFeld
        wert={gesetzt ?? null}
        berechnet={berechnet?.prozent ?? null}
        beschriftung={`${titel} gesetzt`}
        onAendern={onGesetzt}
        onBegruendung={onBegruendung}
      />
    </Karte>
  );
}

function PeerKarte({
  rubrik,
  mitglieder,
  bewertung,
  bewerter,
  onBewerterWechseln,
  onAendern,
}: {
  rubrik: Rubrik;
  mitglieder: Person[];
  bewertung: Bewertung | undefined;
  bewerter: Person | null;
  onBewerterWechseln: (id: string) => void;
  onAendern: (
    bewerterId: string,
    bewerteterId: string,
    kriteriumId: string,
    wert: number | null,
  ) => void;
}) {
  if (rubrik.peer.length === 0 || mitglieder.length < 2 || !bewerter) return null;

  return (
    <Karte titel="Peer- & Selbsteinschätzung" hinweis="1 = trifft kaum zu · 5 = trifft voll zu">
      <div className="auswahlzeile" style={{ marginBottom: 10 }}>
        <span className="etikett">Bewertung von</span>
        {mitglieder.map((person) => {
          const anzahl = Object.keys(bewertung?.peer?.[person.id] ?? {}).length;
          return (
            <button
              key={person.id}
              type="button"
              className="chip"
              aria-pressed={person.id === bewerter.id}
              onClick={() => onBewerterWechseln(person.id)}
            >
              {person.name}
              {anzahl > 0 ? <span className="index">{anzahl}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="tabellenrahmen">
        <table>
          <thead>
            <tr>
              <th>bewertet</th>
              {rubrik.peer.map((kriterium) => (
                <th key={kriterium.id} className="zahl" title={kriterium.beschreibung}>
                  {kriterium.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mitglieder.map((ziel) => {
              const urteil = bewertung?.peer?.[bewerter.id]?.[ziel.id];
              return (
                <tr key={ziel.id}>
                  <td>
                    <b>{ziel.name}</b>
                    {ziel.id === bewerter.id ? (
                      <span className="maximum"> (Selbsteinschätzung)</span>
                    ) : null}
                  </td>
                  {rubrik.peer.map((kriterium) => (
                    <td key={kriterium.id} className="zahl">
                      <select
                        aria-label={`${bewerter.name} bewertet ${ziel.name}: ${kriterium.name}`}
                        value={urteil?.[kriterium.id] ?? ''}
                        onChange={(ereignis) =>
                          onAendern(
                            bewerter.id,
                            ziel.id,
                            kriterium.id,
                            ereignis.target.value === '' ? null : Number(ereignis.target.value),
                          )
                        }
                      >
                        <option value="">–</option>
                        {[1, 2, 3, 4, 5].map((wert) => (
                          <option key={wert} value={wert}>
                            {wert}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="anmerkung" style={{ margin: '12px 0 0' }}>
        Die Selbsteinschätzung{' '}
        {rubrik.selbstZaehlt ? 'zählt in die Note ein' : 'wird nur zum Vergleich angezeigt'} –
        umstellbar unter „Rubrik &amp; Notenschlüssel“.
      </p>
    </Karte>
  );
}

/**
 * Was in einer anderen Phase erfasst wurde (FA-72 AK-2).
 *
 * Sichtbar, aber nicht änderbar: Wer im Review sitzt, soll den Planningwert
 * kennen, ohne ihn dort noch einmal einzutippen – zwei Eingabestellen für
 * denselben Wert sind eine Fehlerquelle, keine Bequemlichkeit.
 */
function AnderswoKarte({
  team,
  prozess,
  punkteTeam,
  punkteProzess,
}: {
  team: Kriterium[];
  prozess: Kriterium[];
  punkteTeam: Punkte | undefined;
  punkteProzess: Punkte | undefined;
}) {
  const zeilen = [
    ...team.map((k) => ({ kriterium: k, wert: punkteTeam?.[k.id] })),
    ...prozess.map((k) => ({ kriterium: k, wert: punkteProzess?.[k.id] })),
  ];
  if (zeilen.length === 0) return null;

  return (
    <Karte titel="Früher erfasst" hinweis="im Planning oder Daily beurteilt" buendig>
      <div className="tabellenrahmen">
        <table>
          <thead>
            <tr>
              <th>Kriterium</th>
              <th>erfasst im</th>
              <th className="zahl">Punkte</th>
              <th className="zahl">von</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map(({ kriterium, wert }) => (
              <tr key={kriterium.id}>
                <td>{kriterium.name}</td>
                <td className="anmerkung">{ZEITPUNKT_BEZEICHNUNG[zeitpunktVon(kriterium)]}</td>
                <td className="zahl">
                  {wert === undefined ? <span className="anmerkung">nicht bewertet</span> : wert}
                </td>
                <td className="zahl">{kriterium.max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Karte>
  );
}
