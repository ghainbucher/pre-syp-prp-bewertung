/**
 * Erfassungsmaske je Abschnitt (FA-12 bis FA-19, FA-26, FA-52, FA-60).
 *
 * Zwei Formen, gesteuert von der Abschnittsart:
 * - Sprint und Diplomarbeitsvorbereitung: teamweise Maske mit Team-,
 *   Prozess-, Einzel- und – sofern eingeschaltet – Peer-Bewertung.
 * - Test: eine Tabelle Person × Frage über die ganze Klasse, ohne Team
 *   (FA-60 AK-3).
 */

import { useMemo, type ReactNode } from 'react';

import {
  bewertungsSchluessel,
  datumDeutsch,
  ergebnisAusRubrik,
  kategorieErgebnis,
  peerFrageFaellig,
  selbstbildAbweichung,
} from '../domain/scoring';
import { mitgliederIn, rubrikVon, abschnitteVon } from '../domain/zuordnung';
import type {
  Abschnitt,
  Bewertung,
  Kriterium,
  Notenstufe,
  Person,
  Punkte,
  Rubrik,
} from '../domain/types';
import { dateiAnbieten } from '../export/csv';
import { rubrikblattDateiname, rubrikblattHtml } from '../export/rubrikblatt';
import { bewertungsIndex, type PunkteKategorie } from '../store/storeReducer';
import { personenVon, teamsVon } from '../ui/auswahl';
import { Karte, LeerHinweis, Notenzeichen, Prozent, Punktefeld, Textfeld } from '../ui/bausteine';
import type { AnsichtProps } from './typen';

/** Kurzzeichen für die Abschnittswahl. */
function zeichen(abschnitt: Abschnitt): string {
  if (abschnitt.art === 'test') return `T${abschnitt.nummer}`;
  if (abschnitt.art === 'diplomarbeit') return `DA${abschnitt.nummer}`;
  return `S${abschnitt.nummer}`;
}

export function BewertenAnsicht({ daten, dispatch, ui, setUi }: AnsichtProps) {
  const abschnitte = abschnitteVon(daten, ui.klasseId);
  const index = useMemo(() => bewertungsIndex(daten), [daten]);

  if (!ui.klasseId) {
    return (
      <LeerHinweis
        titel="Noch keine Klasse angelegt"
        text="Unter „Klassen & Teams“ eine Klasse mit Teams, Personen und Abschnitten anlegen."
        aktion={
          <button type="button" className="schalter haupt" onClick={() => setUi({ ansicht: 'struktur' })}>
            Zu Klassen &amp; Teams
          </button>
        }
      />
    );
  }

  if (abschnitte.length === 0) {
    return (
      <LeerHinweis
        titel="Noch kein Abschnitt angelegt"
        text="Zum Bewerten braucht es mindestens einen Abschnitt – einen Sprint, die Diplomarbeitsvorbereitung oder einen Test."
        aktion={
          <button type="button" className="schalter haupt" onClick={() => setUi({ ansicht: 'struktur' })}>
            Zu Klassen &amp; Teams
          </button>
        }
      />
    );
  }

  const abschnitt = abschnitte.find((a) => a.id === ui.abschnittId) ?? abschnitte[abschnitte.length - 1];
  const rubrik = rubrikVon(daten, abschnitt);

  const abschnittswahl = (
    <div className="auswahlzeile">
      <span className="etikett">Abschnitt</span>
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
    </div>
  );

  if (abschnitt.art === 'test') {
    return (
      <TestMaske
        abschnitt={abschnitt}
        rubrik={rubrik}
        personen={personenVon(daten, ui.klasseId)}
        bewertung={index.get(bewertungsSchluessel(abschnitt.id, null))}
        notenschluessel={daten.notenschluessel}
        abschnittswahl={abschnittswahl}
        onAendern={(personId, kriteriumId, wert) =>
          dispatch({
            art: 'bewertung/individuell',
            abschnittId: abschnitt.id,
            teamId: null,
            personId,
            kriteriumId,
            wert,
          })
        }
        onNotiz={(personId, notiz) =>
          dispatch({
            art: 'bewertung/individuellNotiz',
            abschnittId: abschnitt.id,
            teamId: null,
            personId,
            notiz,
          })
        }
      />
    );
  }

  return (
    <TeamMaske
      daten={daten}
      dispatch={dispatch}
      ui={ui}
      setUi={setUi}
      abschnitt={abschnitt}
      rubrik={rubrik}
      index={index}
      abschnittswahl={abschnittswahl}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Test: Person × Frage über die ganze Klasse (FA-60)                          */
/* -------------------------------------------------------------------------- */

function TestMaske({
  abschnitt,
  rubrik,
  personen,
  bewertung,
  notenschluessel,
  abschnittswahl,
  onAendern,
  onNotiz,
}: {
  abschnitt: Abschnitt;
  rubrik: Rubrik;
  personen: Person[];
  bewertung: Bewertung | undefined;
  notenschluessel: Notenstufe[];
  abschnittswahl: ReactNode;
  onAendern: (personId: string, kriteriumId: string, wert: number | null) => void;
  onNotiz: (personId: string, notiz: string) => void;
}) {
  const fragen = rubrik.individuell;
  const angaben = [
    abschnitt.angekuendigtAm ? `angekündigt am ${datumDeutsch(abschnitt.angekuendigtAm)}` : null,
    abschnitt.arbeitszeitMinuten ? `${abschnitt.arbeitszeitMinuten} Minuten Arbeitszeit` : null,
  ].filter(Boolean);

  return (
    <>
      <div className="ansichtskopf">
        <div>
          <h2>{abschnitt.name}</h2>
          <p>
            {angaben.length > 0 ? `${angaben.join(' · ')} · ` : ''}
            Ein Test wird ohne Team erfasst: eine Zeile je Person, eine Spalte je Frage. Ein leeres
            Feld bedeutet „nicht bewertet“, nicht 0 Punkte.
          </p>
        </div>
      </div>

      {abschnittswahl}

      <Karte
        titel="Punkte je Frage"
        hinweis={`${fragen.length} Fragen · ${fragen.reduce((s, f) => s + f.max, 0)} Punkte`}
        buendig
      >
        {personen.length === 0 ? (
          <div className="leer">In dieser Klasse ist noch niemand eingetragen.</div>
        ) : (
          <div className="tabellenrahmen">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  {fragen.map((frage) => (
                    <th key={frage.id} className="zahl" title={frage.beschreibung}>
                      {frage.name}
                      <br />
                      <span className="maximum">/ {frage.max}</span>
                    </th>
                  ))}
                  <th className="zahl">Ergebnis</th>
                  <th className="zahl">Note</th>
                </tr>
              </thead>
              <tbody>
                {personen.map((person) => {
                  const punkte = bewertung?.individuell?.[person.id]?.punkte;
                  const ergebnis = kategorieErgebnis(punkte, fragen);
                  return (
                    <tr key={person.id}>
                      <td>
                        <b>{person.name}</b>
                      </td>
                      {fragen.map((frage) => (
                        <td key={frage.id} className="zahl">
                          <Punktefeld
                            schmal
                            wert={punkte?.[frage.id]}
                            max={frage.max}
                            beschriftung={`${person.name} – ${frage.name}`}
                            onAendern={(wert) => onAendern(person.id, frage.id, wert)}
                          />
                        </td>
                      ))}
                      <td className="zahl">
                        <Prozent wert={ergebnis?.prozent ?? null} />
                      </td>
                      <td className="zahl">
                        <Notenzeichen
                          prozent={ergebnis?.prozent ?? null}
                          notenschluessel={notenschluessel}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Karte>

      <NotizenKarte personen={personen} bewertung={bewertung} onAendern={onNotiz} />

      <p className="anmerkung">
        Die offene Frage wird nach dem in der Rubrik hinterlegten Schema bewertet. Ein
        KI-Vorschlag darf nur mit pseudonymisierten Arbeiten eingeholt werden; die Entscheidung
        trifft die Lehrkraft (§ 11 Abs. 2 LBVO).
      </p>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Sprint und Diplomarbeitsvorbereitung: teamweise Maske                       */
/* -------------------------------------------------------------------------- */

function TeamMaske({
  daten,
  dispatch,
  ui,
  setUi,
  abschnitt,
  rubrik,
  index,
  abschnittswahl,
}: AnsichtProps & {
  abschnitt: Abschnitt;
  rubrik: Rubrik;
  index: Map<string, Bewertung>;
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
  const mitglieder = mitgliederIn(daten, abschnitt.id, team.id);
  const bewertung = index.get(bewertungsSchluessel(abschnitt.id, team.id));
  const bewerter = mitglieder.find((p) => p.id === ui.bewerterId) ?? mitglieder[0] ?? null;
  const zeitraum = [abschnitt.von, abschnitt.bis].filter(Boolean).map(datumDeutsch).join(' – ');

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
            {abschnitt.name} · {team.name}
          </h2>
          <p>
            {zeitraum ? `${zeitraum} · ` : ''}
            Punkte eintragen – die Ergebnisse rechts aktualisieren sich sofort. Ein leeres Feld
            bedeutet „nicht bewertet“, nicht 0 Punkte.
          </p>
        </div>
        <span className="dehnen" />
        <button type="button" className="schalter" onClick={kriterienAusgeben}>
          Kriterien ausgeben
        </button>
      </div>

      {peerFrageFaellig(daten, abschnitt, index) ? (
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

      <div className="zweispaltig">
        <div>
          <KriterienKarte
            titel="Team-Ergebnis"
            hinweis={`gilt für alle Mitglieder von ${team.name}`}
            kriterien={rubrik.team}
            punkte={bewertung?.team}
            notenschluessel={daten.notenschluessel}
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
          />

          <KriterienKarte
            titel="Scrum-Prozess"
            hinweis="Arbeitsweise des Teams im Abschnitt"
            kriterien={rubrik.prozess}
            punkte={bewertung?.prozess}
            notenschluessel={daten.notenschluessel}
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
          />

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

          {abschnitt.peerAktiv ? (
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
                const abweichung = selbstbildAbweichung(ergebnis);
                if (abweichung) {
                  teile.push(`Selbstbild ${abweichung === 'hoeher' ? 'höher' : 'niedriger'}`);
                }
                if (ergebnis.fehlend.length > 0) teile.push(`offen: ${ergebnis.fehlend.join(', ')}`);

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
 * Freitext je Person (FA-17).
 *
 * Steht bewusst neben der Notiz an das Team (FA-16): Die eine geht an die
 * Gruppe, die andere ist eine Aufzeichnung der Lehrkraft für Gespräch und
 * Begründung (§ 18 Abs. 1 SchUG). Sie erscheint in keiner Ausgabe an die
 * Klasse.
 */
function NotizenKarte({
  personen,
  bewertung,
  onAendern,
}: {
  personen: Person[];
  bewertung: Bewertung | undefined;
  onAendern: (personId: string, notiz: string) => void;
}) {
  if (personen.length === 0) return null;

  return (
    <Karte
      titel="Notizen je Person"
      hinweis="nur für dich – erscheint in keiner Ausgabe an die Klasse"
      buendig
    >
      <div className="tabellenrahmen">
        <table>
          <tbody>
            {personen.map((person) => (
              <tr key={person.id}>
                <td style={{ width: '30%', verticalAlign: 'top' }}>
                  <b>{person.name}</b>
                </td>
                <td>
                  <Textfeld
                    mehrzeilig
                    wert={bewertung?.individuell?.[person.id]?.notiz ?? ''}
                    beschriftung={`Notiz zu ${person.name}`}
                    platzhalter="Beobachtung, Beleg, Vereinbarung"
                    onAendern={(notiz) => onAendern(person.id, notiz)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Karte>
  );
}

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
  onAendern,
}: {
  titel: string;
  hinweis: string;
  kriterien: Kriterium[];
  punkte: Punkte | undefined;
  notenschluessel: Notenstufe[];
  onAendern: (kriteriumId: string, wert: number | null) => void;
}) {
  if (kriterien.length === 0) return null;
  const ergebnis = kategorieErgebnis(punkte, kriterien);
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
