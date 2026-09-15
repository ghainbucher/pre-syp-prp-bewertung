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
  abschlussFaellig,
  peerFrageFaellig,
  selbstbildAbweichung,
  tendenz,
} from '../domain/scoring';
import {
  abschnitteVon,
  abschnitteVonTeam,
  ZUSTAND_BEZEICHNUNG,
  abschnittKuenftig,
  istLaufenderAbschnitt,
  sprintZustand,
  zuletztGelaufenerAbschnitt,
  kurzzeichen,
  mitgliederIn,
  planungVon,
  punkteErfasst,
  rubrikFuer,
  rueckmeldungOffen,
} from '../domain/zuordnung';
import { AbschnittLoeschen } from './AbschnittLoeschen';
import { AuswertungsKarte } from './AuswertungsKarte';
import { AnforderungenKarte } from './AnforderungenKarte';
import { BefundKarte } from './BefundKarte';
import { NotizenKarte } from './NotizenKarte';
import { RetroKarte } from './RetroKarte';
import { TeamtextKarte } from './TeamtextKarte';
import { personenrueckmeldungText } from '../export/teamrueckmeldung';
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
  Team,
} from '../domain/types';
import { dateiAnbieten } from '../export/csv';
import { rubrikblattDateiname, rubrikblattHtml } from '../export/rubrikblatt';
import { rueckmeldungDateiname, rueckmeldungHtml } from '../export/rueckmeldung';
import { bewertungsIndex, type PunkteKategorie } from '../store/storeReducer';
import { nurAktive } from '../domain/loeschen';
import { klassen, teamsVon } from '../ui/auswahl';
import { projektzeile } from '../ui/projekte';
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
  // Der Klassenfilter der Kopfleiste wirkt auf die **Projektleiste** (FA-95):
  // Er entscheidet, welche Projekte zur Wahl stehen.
  const teams = teamsVon(daten, ui.klasseId);
  // Das Team steht **vor** der Abschnittswahl: Jedes Team hat seine eigenen
  // Sprints (OP-F17), also hängt die Leiste am Team und nicht umgekehrt.
  const team = teams.find((t) => t.id === ui.teamId) ?? teams[0] ?? null;
  /*
    Ist ein Projekt gewählt, kommt die Klasse **von ihm** und nicht mehr vom
    Filter. Sonst verschwänden die Sprints eines gemischten Projekts, sobald
    nach einer der beteiligten Klassen gefiltert wird – die Sprints hängen am
    Projekt, nicht an der Klasse (Fachkonzept 15.1).
  */
  const arbeitsklasse = team?.klasseId ?? ui.klasseId;
  const alle = abschnitteVon(daten, arbeitsklasse);
  const abschnitte = abschnitteVonTeam(daten, arbeitsklasse, team?.id ?? null, art);
  const index = useMemo(() => bewertungsIndex(daten), [daten]);
  const istSprint = art === 'sprint';

  if (klassen(daten).length === 0) {
    return (
      <LeerHinweis
        titel="Noch keine Klasse angelegt"
        text="Unter „Stammdaten“ eine Klasse mit Teams und Personen anlegen."
        aktion={
          <button type="button" className="schalter haupt" onClick={() => setUi({ ansicht: 'stammdaten', stammseite: 'klassen' })}>
            Zu den Stammdaten
          </button>
        }
      />
    );
  }

  /**
   * Einen Sprint anlegen – er entsteht beim Planning (FA-70 AK-1) und gehört
   * dem gewählten Team (OP-F17). Deshalb wird er gleich für dieses Team
   * geplant: Ein Sprint ohne Planung gehörte niemandem und stünde in jeder
   * Leiste.
   */
  function sprintAnlegen() {
    if (!team) return;
    const nummer = alle.reduce((groesste, a) => Math.max(groesste, a.nummer), 0) + 1;
    const id = `abschnitt-${Date.now().toString(36)}`;
    dispatch({
      art: 'abschnitt/anlegen',
      abschnitt: {
        id,
        // Der Sprint gehört dem Projekt; seine Klasse ist die des Projekts.
        klasseId: team.klasseId,
        nummer,
        // Gleiche Zählweise wie das Kürzel (FA-04 AK-5): der wievielte Sprint
        // **dieses Teams**.
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
    dispatch({ art: 'planung/festhalten', abschnittId: id, teamId: team.id });
    setUi({ abschnittId: id });
  }

  if (!team) {
    // Mit gesetztem Klassenfilter ist die Liste vielleicht nicht leer, sondern
    // gefiltert (FA-95 AK-6). Das gehört dazugesagt – sonst sucht man ein
    // Projekt, das es sehr wohl gibt.
    const gefiltert = ui.klasseId !== null && nurAktive(daten.teams).length > 0;
    return (
      <LeerHinweis
        titel={gefiltert ? 'Kein Projekt in dieser Klasse' : 'Noch kein Projekt angelegt'}
        text={
          gefiltert
            ? 'Der Klassenfilter oben in der Kopfleiste zeigt nur diese Klasse. Auf „alle Klassen" gestellt, stehen wieder alle Projekte zur Wahl.'
            : 'Sprints gehören einem Projekt. Zuerst unter „Stammdaten · Projekte“ eines anlegen.'
        }
        aktion={
          gefiltert ? (
            <button
              type="button"
              className="schalter haupt"
              onClick={() => setUi({ klasseId: null, teamId: null, abschnittId: null })}
            >
              Alle Klassen zeigen
            </button>
          ) : (
            <button
              type="button"
              className="schalter haupt"
              onClick={() => setUi({ ansicht: 'stammdaten', stammseite: 'projekte' })}
            >
              Zu den Projekt-Stammdaten
            </button>
          )
        }
      />
    );
  }

  /**
   * Die Projektleiste (FA-95 AK-10).
   *
   * Sie steht **vor** jeder Leermeldung und nicht erst über dem gefüllten
   * Inhalt: Ein Projekt ohne Sprint hatte sonst keinen Weg zurück – die
   * Leiste, mit der man das Projekt wechselt, war genau dort verschwunden,
   * wo man sie braucht. Eine Auswahl, die entscheidet, was zu sehen ist,
   * muss auch dann erreichbar sein, wenn nichts zu sehen ist.
   */
  const projektwahl = (
    /* Das Team zuerst: Es entscheidet, welche Sprints es überhaupt gibt. */
    <div className="auswahlzeile">
      <span className="etikett">Team</span>
      {teams.map((eintrag) => (
        <button
          key={eintrag.id}
          type="button"
          className="chip"
          aria-pressed={eintrag.id === team.id}
          // Beim Teamwechsel den Sprint zurücksetzen: Jedes Team hat seine
          // eigenen, und die Vorgabe ist der letzte dieses Teams.
          onClick={() => setUi({ teamId: eintrag.id, abschnittId: null, bewerterId: null })}
        >
          {eintrag.name}
          {/*
            Ohne Klassenfilter stehen Projekte mehrerer Klassen nebeneinander
            – dann gehört die Klasse dazu (FA-95). Genannt werden die Klassen
            der Mitglieder, nicht die Verwaltungsklasse am Projekt
            (Fachkonzept 15.1).
          */}
          {ui.klasseId === null ? (
            <span className="woanders">
              {projektzeile(daten, eintrag).klassen.join(', ') || 'ohne Schüler'}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );

  if (abschnitte.length === 0) {
    return (
      <>
        {projektwahl}
        <LeerHinweis
          titel={
            istSprint
              ? `Noch kein Sprint für ${team.name}`
              : 'Noch keine Diplomarbeitsvorbereitung angelegt'
          }
          text={
            istSprint
              ? `Ein Sprint entsteht hier, beim Planning – nicht vorab unter „Stammdaten“. Er gehört dann ${team.name}; andere Teams haben ihre eigenen.`
              : 'Die Diplomarbeitsvorbereitung läuft ganzjährig neben den Sprints. Sie wird unter „Stammdaten“ angelegt.'
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
              <button
                type="button"
                className="schalter haupt"
                onClick={() => setUi({ ansicht: 'stammdaten', stammseite: 'klassen' })}
              >
                Zu den Stammdaten
              </button>
            )
          }
        />
      </>
    );
  }

  const abschnitt = abschnitte.find((a) => a.id === ui.abschnittId) ?? abschnitte[abschnitte.length - 1];

  const auswahl = (
    <>
      {projektwahl}
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
            <span className="index">{kurzzeichen(daten, eintrag, team.id)}</span>
            {eintrag.name}
          </button>
        ))}
        {istSprint && phase === 'planning' ? (
          <button type="button" className="schalter klein" onClick={sprintAnlegen}>
            + Sprint
          </button>
        ) : null}
      </div>
    </>
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
      team={team}
      auswahl={auswahl}
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
  team,
  auswahl,
}: AnsichtProps & {
  abschnitt: Abschnitt;
  index: Map<string, Bewertung>;
  phase: Phase;
  team: Team;
  auswahl: ReactNode;
}) {
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
  // FA-76: Geschrieben wird im laufenden Abschnitt. Ein abgeschlossener ist zu
  // sehen, aber nicht zu ändern – bis er ausdrücklich geöffnet wird.
  const laufend = istLaufenderAbschnitt(daten, abschnitt, team.id);
  const schreibbar = laufend || ui.bearbeiten === abschnitt.id;
  // FA-77: Vorschlag, fixiert oder abgeschlossen. Der Zustand sperrt nicht
  // (AK-7) – er sagt, ob dieser Sprint schon gilt.
  const zustand = sprintZustand(daten, abschnitt.id, team.id);
  // FA-76 AK-1a: Liegt heute in keinem Zeitraum, läuft keiner. Dann hilft der
  // Hinweis, welcher zuletzt lief – das ist der, den man nachtragen will.
  const zuletzt = laufend
    ? undefined
    : zuletztGelaufenerAbschnitt(daten, abschnitt.klasseId, team.id);
  // FA-76 AK-1c: Gesperrt ist die Bewertung. Die Planung eines Sprints, der
  // noch nicht begonnen hat, bleibt änderbar – sonst wäre kein Vorschlag
  // anlegbar. Ein vergangener ist auch in der Planung gesperrt.
  const planungSchreibbar = schreibbar || abschnittKuenftig(daten, abschnitt, team.id);
  // FA-77 AK-5: Steht der Abschluss an?
  const abschlussAnsteht = abschlussFaellig(daten, abschnitt, team.id, index);
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
            {/* FA-77 AK-1: In welchem Zustand dieser Sprint ist – sichtbar in
                jeder Phase, nicht nur beim Planen. */}
            {abschnitt.art === 'sprint' ? `${ZUSTAND_BEZEICHNUNG[zustand]} · ` : ''}
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

      {auswahl}

      {/* FA-70 AK-8: Eine Fehleingabe muss dort verschwinden können, wo sie
          entstanden ist – aber nur für dieses Team. */}
      {phase === 'planning' || istDiplomarbeit ? (
        <div className="zeile">
          <span className="dehnen" />
          <AbschnittLoeschen
            daten={daten}
            abschnittId={abschnitt.id}
            teamId={team.id}
            beschriftung={`${istDiplomarbeit ? 'Abschnitt' : 'Sprint'} für ${team.name} entfernen`}
            hinweis={`Der ${istDiplomarbeit ? 'Abschnitt' : 'Sprint'} verschwindet aus der Leiste von ${team.name}; andere Teams behalten ihn.`}
            onLoeschen={() => {
              dispatch({
                art: 'abschnitt/vonTeamEntfernen',
                abschnittId: abschnitt.id,
                teamId: team.id,
              });
              setUi({ abschnittId: null });
            }}
          />
        </div>
      ) : null}

      {schreibbar ? null : (
        <div className="meldung" role="status">
          <b>Heute liegt außerhalb von {abschnitt.name}.</b>{' '}
          {zuletzt && zuletzt.id !== abschnitt.id
            ? `Zuletzt lief ${zuletzt.name}.`
            : 'Für dieses Team läuft gerade kein Sprint.'}{' '}
          Hier wird nur angezeigt, damit im Gespräch nichts versehentlich in den falschen Sprint
          gerät.{' '}
          <button
            type="button"
            className="schalter schlicht"
            onClick={() => setUi({ bearbeiten: abschnitt.id })}
          >
            zum Bearbeiten öffnen
          </button>
        </div>
      )}

      {!laufend && schreibbar ? (
        <div className="meldung dringend" role="status">
          <b>{abschnitt.name} ist zum Bearbeiten geöffnet.</b> Heute liegt außerhalb seines
          Zeitraums; eine Änderung verschiebt einen bereits gebildeten Stand. Die Freigabe gilt nur
          für diese Sitzung.{' '}
          <button
            type="button"
            className="schalter schlicht"
            onClick={() => setUi({ bearbeiten: null })}
          >
            wieder schützen
          </button>
        </div>
      ) : null}

      {mitPlanung ? (
        <fieldset className="maske" disabled={!planungSchreibbar}>
          <PlanungsKarte
            daten={daten}
            dispatch={dispatch}
            abschnitt={abschnitt}
            team={team}
            gesperrt={punkteErfasst(daten, abschnitt.id, team.id)}
          />
        </fieldset>
      ) : null}

      <fieldset className="maske" disabled={!schreibbar}>
      {/* FA-77 AK-5, AK-5a: Der Sprint wird im Review abgeschlossen – mit einer
          ausdrücklichen Handlung, nicht von selbst. Erst danach lässt sich der
          nächste fixieren. Steht **innerhalb** der Maske: Der Abschluss
          unterliegt dem Schreibschutz wie alles andere im Review (FA-76). Eine
          halb erreichbare Sicht wäre unvorhersehbar. */}
      {nurReview && abschnitt.art === 'sprint' ? (
        zustand === 'abgeschlossen' ? (
          <div className="meldung" role="status">
            <b>{abschnitt.name} ist abgeschlossen.</b> {team.name} kann damit den nächsten Sprint
            fixieren.{' '}
            <button
              type="button"
              className="schalter schlicht"
              onClick={() =>
                dispatch({
                  art: 'planung/abschliessen',
                  abschnittId: abschnitt.id,
                  teamId: team.id,
                  abgeschlossen: false,
                })
              }
            >
              Abschluss zurücknehmen
            </button>
          </div>
        ) : (
          <div className={abschlussAnsteht ? 'meldung dringend' : 'meldung'} role="status">
            {abschlussAnsteht ? (
              <>
                <b>Alles erfasst.</b> Damit ist {abschnitt.name} für {team.name} beurteilt – das
                Review schließt ihn ab.
              </>
            ) : (
              <>
                <b>{abschnitt.name} ist offen.</b> Abschließen geht auch jetzt: Ein bewusst leeres
                Feld bleibt „nicht bewertet“ und ist kein Hindernis.
              </>
            )}{' '}
            <button
              type="button"
              className="schalter"
              onClick={() =>
                dispatch({
                  art: 'planung/abschliessen',
                  abschnittId: abschnitt.id,
                  teamId: team.id,
                  abgeschlossen: true,
                })
              }
            >
              Sprint abschließen
            </button>
          </div>
        )
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
              „Stammdaten“ je Abschnitt einschalten, sobald das Team das Vorgehen
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
            titel="Spur, Verstehensnachweis und Reflexion"
            hinweis={`Nachweis zählt ${daten.verstehensAnteil} % des individuellen Beitrags · die Spur zählt nicht`}
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
                      <th>Spur</th>
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
                          {/* FA-78: Woran diese Person ihren Beitrag zeigt.
                              Neben dem Verstehensnachweis, weil hier darüber
                              gesprochen wird – und ohne Punktewert (AK-3). */}
                          <td style={{ verticalAlign: 'top' }}>
                            <Textfeld
                              breit
                              wert={eintrag?.spur?.bezeichnung ?? ''}
                              beschriftung={`Spur – ${person.name}`}
                              platzhalter="PR #42, Storno-Validierung"
                              onAendern={(bezeichnung) =>
                                dispatch({
                                  art: 'bewertung/spur',
                                  abschnittId: abschnitt.id,
                                  teamId: team.id,
                                  personId: person.id,
                                  bezeichnung,
                                })
                              }
                            />
                            {eintrag?.spur ? (
                              <Textfeld
                                breit
                                wert={eintrag.spur.verweis ?? ''}
                                beschriftung={`Verweis zur Spur – ${person.name}`}
                                platzhalter="Verweis, freiwillig"
                                onAendern={(verweis) =>
                                  dispatch({
                                    art: 'bewertung/spur',
                                    abschnittId: abschnitt.id,
                                    teamId: team.id,
                                    personId: person.id,
                                    bezeichnung: eintrag.spur!.bezeichnung,
                                    verweis,
                                  })
                                }
                              />
                            ) : null}
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
                ein – sie steht in der Belegfassung, weil sie erhoben wurde. Die Spur ist die
                Stelle, über die gesprochen wurde: ein Anker für das Urteil, kein Nachweis von
                Menge – eine einzige Stelle kann viel oder wenig Arbeit sein. Der Verweis wird
                gespeichert und angezeigt, nie abgerufen.
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
            onKopieren={(person) => {
              // FA-83 AK-7: Derselbe Inhalt als Text – für ein Einzelgespräch.
              const e = ergebnisAusRubrik(
                bewertung,
                person,
                mitglieder,
                rubrik,
                abschnitt.peerAktiv,
                daten.peerDeckelung,
              );
              void navigator.clipboard?.writeText(
                personenrueckmeldungText({
                  abschnitt,
                  person,
                  planung,
                  bewertung,
                  stand: e.prozent,
                }),
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

          {/* FA-96: Plan und Ist der Anforderungen nebeneinander – vor dem
              Befund, weil er die erste Frage des Reviews beantwortet: Ist
              das entstanden, was vereinbart war? */}
          {nurReview && abschnitt.art === 'sprint' ? (
            <AnforderungenKarte
              daten={daten}
              dispatch={dispatch}
              abschnitt={abschnitt}
              team={team}
            />
          ) : null}

          {/* FA-79: Der Befund über das Team – nach den Werten, die ihn tragen,
              und vor der Retrospektive, in der etwas daraus folgt. */}
          {nurReview && abschnitt.art === 'sprint' ? (
            <BefundKarte daten={daten} abschnitt={abschnitt} team={team} index={index} />
          ) : null}

          {/* FA-81: Eingelesene Kennzahlen und der Vorschlag für die
              Versionsverwaltung. Die Anwendung ruft nichts ab. */}
          {nurReview && abschnitt.art === 'sprint' ? (
            <AuswertungsKarte
              daten={daten}
              dispatch={dispatch}
              abschnitt={abschnitt}
              team={team}
              kriterium={rubrik.team.find((k) => k.id === 't5')}
              punkte={bewertung?.team}
            />
          ) : null}

          {/* FA-80: Erst feststellen, dann entwickeln – die Maßnahmen stehen
              am Ende des Reviews, vor dem Abschließen des Sprints. */}
          {nurReview && abschnitt.art === 'sprint' ? (
            <RetroKarte daten={daten} dispatch={dispatch} abschnitt={abschnitt} team={team} />
          ) : null}

          {/* FA-82, FA-83: Sprintwert festlegen und den Text für den Kanal
              mitnehmen – nach der Retrospektive, weil die Maßnahmen darin
              stehen. */}
          {nurReview && abschnitt.art === 'sprint' ? (
            <TeamtextKarte
              daten={daten}
              dispatch={dispatch}
              abschnitt={abschnitt}
              team={team}
              rubrik={rubrik}
              bewertung={bewertung}
              mitglieder={mitglieder}
            />
          ) : null}

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
      </fieldset>
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
  onKopieren,
}: {
  personen: Person[];
  bewertung: Bewertung | undefined;
  offen: Set<string>;
  onAendern: (personId: string, staerken: string, entwicklung: string) => void;
  onAusgeben: (person: Person) => void;
  /** FA-83 AK-7: Text für ein Einzelgespräch – nicht für den Teamkanal. */
  onKopieren: (person: Person) => void;
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
                    </button>{' '}
                    <button
                      type="button"
                      className="schalter schlicht klein"
                      disabled={r === undefined}
                      onClick={() => onKopieren(person)}
                    >
                      kopieren
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
          „Kopieren“ legt denselben Text in die Zwischenablage, für ein Einzelgespräch oder
          einen Einzelchat. <b>Nicht für den Teamkanal:</b> Hier steht der Stand dieser Person,
          und der ist keine Sache des Teams.
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
