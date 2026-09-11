/**
 * Klassenübersicht, Teamvergleich, Notenverteilung und CSV-Export
 * (FA-28 bis FA-31).
 */

import { useMemo } from 'react';

import { gesamtErgebnis, note as noteZu } from '../domain/scoring';
import { alsCsv, csvDateiname, dateiAnbieten, uebersichtZeilen } from '../export/csv';
import { bewertungsIndex } from '../store/storeReducer';
import { personenVon, sprintsVon, teamsVon } from '../ui/auswahl';
import { Balken, Karte, LeerHinweis, Notenzeichen, Prozent } from '../ui/bausteine';
import type { AnsichtProps } from './typen';

export function AuswertungAnsicht({ daten, ui, setUi }: AnsichtProps) {
  const index = useMemo(() => bewertungsIndex(daten), [daten]);
  const klasse = daten.klassen.find((k) => k.id === ui.klasseId);
  const sprints = sprintsVon(daten, ui.klasseId);
  const teams = teamsVon(daten, ui.klasseId);
  const personen = personenVon(daten, ui.klasseId);

  if (!klasse || personen.length === 0) {
    return (
      <LeerHinweis
        titel="Noch nichts auszuwerten"
        text="Sobald eine Klasse mit Personen und Sprints angelegt ist, erscheint hier die Übersicht."
        aktion={
          <button type="button" className="schalter haupt" onClick={() => setUi({ ansicht: 'struktur' })}>
            Zu Klassen &amp; Teams
          </button>
        }
      />
    );
  }

  const ergebnisse = personen.map((person) => {
    const mitglieder = person.teamId ? personenVon(daten, klasse.id, person.teamId) : [];
    return { person, ergebnis: gesamtErgebnis(person, sprints, mitglieder, index, daten.rubrik) };
  });

  const verteilung = new Map<number | 'offen', number>();
  for (const eintrag of ergebnisse) {
    const note = noteZu(eintrag.ergebnis.prozent, daten.rubrik.notenschluessel);
    const schluessel = note ?? ('offen' as const);
    verteilung.set(schluessel, (verteilung.get(schluessel) ?? 0) + 1);
  }

  function exportieren() {
    const zeilen = uebersichtZeilen({
      daten,
      klasseId: klasse!.id,
      personen,
      teams,
      sprints,
      bewertungen: index,
    });
    dateiAnbieten(csvDateiname(klasse!.name), alsCsv(zeilen));
  }

  return (
    <>
      <div className="ansichtskopf">
        <div>
          <h2>Auswertung {klasse.name}</h2>
          <p>
            Gesamt ist das mit dem Sprintfaktor gewichtete Mittel der Sprintergebnisse. Sprints ohne
            Eintrag bleiben außen vor.
          </p>
        </div>
        <span className="dehnen" />
        <button type="button" className="schalter" onClick={exportieren}>
          CSV exportieren
        </button>
      </div>

      <div className="zweispaltig">
        <div>
          <Karte titel="Einzelergebnisse" hinweis="Prozent je Sprint" buendig>
            <div className="tabellenrahmen">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Team</th>
                    {sprints.map((sprint) => (
                      <th key={sprint.id} className="zahl" title={sprint.name}>
                        S{sprint.nummer}
                        <br />
                        <span className="maximum">×{sprint.faktor}</span>
                      </th>
                    ))}
                    <th className="zahl">Gesamt</th>
                    <th className="zahl">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {ergebnisse.map(({ person, ergebnis }) => (
                    <tr key={person.id}>
                      <td>
                        <b>{person.name}</b>
                      </td>
                      <td className="anmerkung">
                        {teams.find((t) => t.id === person.teamId)?.name ?? '–'}
                      </td>
                      {ergebnis.proSprint.map((eintrag) => (
                        <td key={eintrag.sprint.id} className="zahl">
                          <span className="prozent">
                            {eintrag.ergebnis.prozent === null
                              ? '–'
                              : Math.round(eintrag.ergebnis.prozent)}
                          </span>
                        </td>
                      ))}
                      <td className="zahl">
                        <span className="zeile" style={{ justifyContent: 'flex-end', gap: 8 }}>
                          <span style={{ width: 60 }}>
                            <Balken wert={ergebnis.prozent} />
                          </span>
                          <Prozent wert={ergebnis.prozent} stellen={1} />
                        </span>
                      </td>
                      <td className="zahl">
                        <Notenzeichen
                          prozent={ergebnis.prozent}
                          notenschluessel={daten.rubrik.notenschluessel}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Karte>

          <Karte titel="Teams im Vergleich" hinweis="Mittel der Gesamtergebnisse" buendig>
            <div className="tabellenrahmen">
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th className="zahl">Personen</th>
                    <th className="zahl">Ø gesamt</th>
                    <th className="zahl">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="anmerkung">
                        keine Teams
                      </td>
                    </tr>
                  ) : (
                    teams.map((team) => {
                      const werte = ergebnisse
                        .filter((e) => e.person.teamId === team.id)
                        .map((e) => e.ergebnis.prozent)
                        .filter((wert): wert is number => wert !== null);
                      const mittel =
                        werte.length === 0
                          ? null
                          : werte.reduce((summe, wert) => summe + wert, 0) / werte.length;
                      const anzahl = personen.filter((p) => p.teamId === team.id).length;
                      return (
                        <tr key={team.id}>
                          <td>
                            <b>{team.name}</b>
                          </td>
                          <td className="zahl">{anzahl}</td>
                          <td className="zahl">
                            <Prozent wert={mittel} stellen={1} />
                          </td>
                          <td className="zahl">
                            <Notenzeichen
                              prozent={mittel}
                              notenschluessel={daten.rubrik.notenschluessel}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Karte>
        </div>

        <div className="seite">
          <div className="uebersicht">
            <h3>Notenverteilung</h3>
            {daten.rubrik.notenschluessel
              .slice()
              .sort((a, b) => a.note - b.note)
              .map((stufe) => {
                const anzahl = verteilung.get(stufe.note) ?? 0;
                return (
                  <div className="uebersichtszeile" key={stufe.note}>
                    <div className="bezeichnung">
                      <b>Note {stufe.note}</b>
                      <span>{stufe.bezeichnung}</span>
                    </div>
                    <span style={{ width: 90 }}>
                      <Balken wert={personen.length ? (anzahl / personen.length) * 100 : 0} />
                    </span>
                    <span className="prozent">{anzahl}</span>
                  </div>
                );
              })}
            {verteilung.get('offen') ? (
              <div className="uebersichtszeile summe">
                <div className="bezeichnung">
                  <b>ohne Note</b>
                  <span>zu wenig erfasst</span>
                </div>
                <span className="prozent">{verteilung.get('offen')}</span>
              </div>
            ) : null}
          </div>
          <p className="anmerkung" style={{ marginTop: 10 }}>
            Notenschlüssel:{' '}
            {daten.rubrik.notenschluessel
              .slice()
              .sort((a, b) => b.ab - a.ab)
              .map((stufe) => `Note ${stufe.note} ab ${stufe.ab} %`)
              .join(' · ')}
          </p>
        </div>
      </div>
    </>
  );
}
