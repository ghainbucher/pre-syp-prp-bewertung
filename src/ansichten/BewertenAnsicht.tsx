/**
 * Erfassungsmaske je Sprint und Team (FA-12 bis FA-19, FA-26).
 */

import { useMemo } from 'react';

import { kategorieErgebnis, selbstbildAbweichung, sprintErgebnis } from '../domain/scoring';
import type { Bewertung, Kriterium, Person, Punkte, Rubrik } from '../domain/types';
import { bewertungsIndex, type PunkteKategorie } from '../store/storeReducer';
import { personenVon, sprintsVon, teamsVon } from '../ui/auswahl';
import {
  Karte,
  LeerHinweis,
  Notenzeichen,
  Prozent,
  Punktefeld,
  Textfeld,
} from '../ui/bausteine';
import type { AnsichtProps } from './typen';

export function BewertenAnsicht({ daten, dispatch, ui, setUi }: AnsichtProps) {
  const sprints = sprintsVon(daten, ui.klasseId);
  const teams = teamsVon(daten, ui.klasseId);
  const index = useMemo(() => bewertungsIndex(daten), [daten]);

  if (!ui.klasseId) {
    return (
      <LeerHinweis
        titel="Noch keine Klasse angelegt"
        text="Unter „Klassen & Teams“ eine Klasse mit Teams, Personen und Sprints anlegen."
        aktion={
          <button type="button" className="schalter haupt" onClick={() => setUi({ ansicht: 'struktur' })}>
            Zu Klassen &amp; Teams
          </button>
        }
      />
    );
  }

  if (sprints.length === 0 || teams.length === 0) {
    return (
      <LeerHinweis
        titel="Sprint oder Team fehlt"
        text="Zum Bewerten braucht es mindestens ein Team und einen Sprint."
        aktion={
          <button type="button" className="schalter haupt" onClick={() => setUi({ ansicht: 'struktur' })}>
            Zu Klassen &amp; Teams
          </button>
        }
      />
    );
  }

  const sprint = sprints.find((s) => s.id === ui.sprintId) ?? sprints[sprints.length - 1];
  const team = teams.find((t) => t.id === ui.teamId) ?? teams[0];
  const mitglieder = personenVon(daten, ui.klasseId, team.id);
  const bewertung = index.get(`${sprint.id}__${team.id}`);
  const bewerter = mitglieder.find((p) => p.id === ui.bewerterId) ?? mitglieder[0] ?? null;

  const zeitraum = [sprint.von, sprint.bis].filter(Boolean).join(' – ');

  return (
    <>
      <div className="ansichtskopf">
        <div>
          <h2>
            {sprint.name} · {team.name}
          </h2>
          <p>
            {zeitraum ? `${zeitraum} · ` : ''}
            Punkte eintragen – die Ergebnisse rechts aktualisieren sich sofort. Ein leeres Feld
            bedeutet „nicht bewertet“, nicht 0 Punkte.
          </p>
        </div>
      </div>

      <div className="auswahlzeile">
        <span className="etikett">Sprint</span>
        {sprints.map((eintrag) => (
          <button
            key={eintrag.id}
            type="button"
            className="chip"
            aria-pressed={eintrag.id === sprint.id}
            onClick={() => setUi({ sprintId: eintrag.id })}
          >
            <span className="index">S{eintrag.nummer}</span>
            {eintrag.name}
          </button>
        ))}
      </div>

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
            kriterien={daten.rubrik.team}
            punkte={bewertung?.team}
            notenschluessel={daten.rubrik.notenschluessel}
            onAendern={(kriteriumId, wert) =>
              dispatch({
                art: 'bewertung/punkte',
                sprintId: sprint.id,
                teamId: team.id,
                kategorie: 'team' as PunkteKategorie,
                kriteriumId,
                wert,
              })
            }
          />

          <KriterienKarte
            titel="Scrum-Prozess"
            hinweis="Arbeitsweise des Teams im Sprint"
            kriterien={daten.rubrik.prozess}
            punkte={bewertung?.prozess}
            notenschluessel={daten.rubrik.notenschluessel}
            onAendern={(kriteriumId, wert) =>
              dispatch({
                art: 'bewertung/punkte',
                sprintId: sprint.id,
                teamId: team.id,
                kategorie: 'prozess' as PunkteKategorie,
                kriteriumId,
                wert,
              })
            }
          />

          <Karte titel="Individueller Beitrag" hinweis="je Schülerin und Schüler" buendig>
            {mitglieder.length === 0 ? (
              <div className="leer">Diesem Team ist noch niemand zugeordnet.</div>
            ) : (
              <div className="tabellenrahmen">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      {daten.rubrik.individuell.map((kriterium) => (
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
                      const ergebnis = kategorieErgebnis(punkte, daten.rubrik.individuell);
                      return (
                        <tr key={person.id}>
                          <td>
                            <b>{person.name}</b>
                          </td>
                          {daten.rubrik.individuell.map((kriterium) => (
                            <td key={kriterium.id} className="zahl">
                              <Punktefeld
                                schmal
                                wert={punkte?.[kriterium.id]}
                                max={kriterium.max}
                                beschriftung={`${person.name} – ${kriterium.name}`}
                                onAendern={(wert) =>
                                  dispatch({
                                    art: 'bewertung/individuell',
                                    sprintId: sprint.id,
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

          <PeerKarte
            rubrik={daten.rubrik}
            mitglieder={mitglieder}
            bewertung={bewertung}
            bewerter={bewerter}
            onBewerterWechseln={(id) => setUi({ bewerterId: id })}
            onAendern={(bewerterId, bewerteterId, kriteriumId, wert) =>
              dispatch({
                art: 'bewertung/peer',
                sprintId: sprint.id,
                teamId: team.id,
                bewerterId,
                bewerteterId,
                kriteriumId,
                wert,
              })
            }
          />

          <Karte titel="Notiz zum Sprint" hinweis="Rückmeldung an das Team">
            <Textfeld
              mehrzeilig
              wert={bewertung?.notiz ?? ''}
              beschriftung="Notiz zum Sprint"
              platzhalter="Was ist gelungen, woran arbeitet das Team im nächsten Sprint?"
              onAendern={(notiz) =>
                dispatch({ art: 'bewertung/notiz', sprintId: sprint.id, teamId: team.id, notiz })
              }
            />
          </Karte>
        </div>

        <div className="seite">
          <div className="uebersicht">
            <h3>Ergebnis {sprint.name}</h3>
            <UebersichtsZeile
              titel="Team-Ergebnis"
              unterzeile={`Gewicht ${daten.rubrik.gewichte.team} %`}
              ergebnis={kategorieErgebnis(bewertung?.team, daten.rubrik.team)}
              rubrik={daten.rubrik}
            />
            <UebersichtsZeile
              titel="Scrum-Prozess"
              unterzeile={`Gewicht ${daten.rubrik.gewichte.prozess} %`}
              ergebnis={kategorieErgebnis(bewertung?.prozess, daten.rubrik.prozess)}
              rubrik={daten.rubrik}
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
                const ergebnis = sprintErgebnis(bewertung, person, mitglieder, daten.rubrik);
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
                    <Notenzeichen prozent={ergebnis.prozent} notenschluessel={daten.rubrik.notenschluessel} />
                  </div>
                );
              })
            )}
          </div>
          <p className="anmerkung" style={{ marginTop: 10 }}>
            Nicht bewertete Kategorien werden nicht als 0 gewertet, sondern aus der Gewichtung
            herausgerechnet.
          </p>
        </div>
      </div>
    </>
  );
}

function UebersichtsZeile({
  titel,
  unterzeile,
  ergebnis,
  rubrik,
}: {
  titel: string;
  unterzeile: string;
  ergebnis: ReturnType<typeof kategorieErgebnis>;
  rubrik: Rubrik;
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
      <Notenzeichen prozent={ergebnis?.prozent ?? null} notenschluessel={rubrik.notenschluessel} />
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
  notenschluessel: Rubrik['notenschluessel'];
  onAendern: (kriteriumId: string, wert: number | null) => void;
}) {
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
