/**
 * Klassenübersicht, Teamvergleich, Notenverteilung und CSV-Export
 * (FA-28 bis FA-31, FA-59).
 */

import { useMemo } from 'react';

import { gesamtErgebnis, note as noteZu } from '../domain/scoring';
import { abschnitteVon, teamIn } from '../domain/zuordnung';
import { alsCsv, csvDateiname, dateiAnbieten, uebersichtZeilen } from '../export/csv';
import { bewertungsIndex } from '../store/storeReducer';
import { personenVon, teamsVon } from '../ui/auswahl';
import { Balken, Karte, LeerHinweis, Notenzeichen, Prozent } from '../ui/bausteine';
import type { AnsichtProps } from './typen';

export function AuswertungAnsicht({ daten, ui, setUi }: AnsichtProps) {
  const index = useMemo(() => bewertungsIndex(daten), [daten]);
  const klasse = daten.klassen.find((k) => k.id === ui.klasseId);
  const abschnitte = abschnitteVon(daten, ui.klasseId);
  const teams = teamsVon(daten, ui.klasseId);
  const personen = personenVon(daten, ui.klasseId);

  if (!klasse || personen.length === 0) {
    return (
      <LeerHinweis
        titel="Noch nichts auszuwerten"
        text="Sobald eine Klasse mit Personen und Abschnitten angelegt ist, erscheint hier die Übersicht."
        aktion={
          <button type="button" className="schalter haupt" onClick={() => setUi({ ansicht: 'struktur' })}>
            Zu Klassen &amp; Teams
          </button>
        }
      />
    );
  }

  // Teams wechseln (FA-58); maßgeblich für die Spalte „Team“ und den
  // Teamvergleich ist der zuletzt angelegte Abschnitt, der ein Team kennt.
  const letzterMitTeam = [...abschnitte].reverse().find((a) => a.art !== 'test');
  const teamVon = (personId: string) =>
    letzterMitTeam
      ? teamIn(daten, letzterMitTeam.id, personId)
      : (daten.personen.find((p) => p.id === personId)?.teamId ?? null);

  const ergebnisse = personen.map((person) => ({
    person,
    ergebnis: gesamtErgebnis(daten, person, index),
  }));

  const verteilung = new Map<number | 'offen', number>();
  for (const eintrag of ergebnisse) {
    const note = noteZu(eintrag.ergebnis.prozent, daten.notenschluessel);
    const schluessel = note ?? ('offen' as const);
    verteilung.set(schluessel, (verteilung.get(schluessel) ?? 0) + 1);
  }

  function exportieren() {
    const zeilen = uebersichtZeilen({
      daten,
      klasseId: klasse!.id,
      personen,
      teams,
      abschnitte,
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
            Praxis und Theorie werden getrennt gemittelt und dann mit{' '}
            {daten.strangGewichte.praxis} zu {daten.strangGewichte.theorie} zusammengeführt
            (FA-59). Innerhalb eines Strangs gilt der Faktor des Abschnitts; Abschnitte ohne
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
          <Karte titel="Einzelergebnisse" hinweis="Prozent je Abschnitt" buendig>
            <div className="tabellenrahmen">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Team</th>
                    {abschnitte.map((abschnitt) => (
                      <th key={abschnitt.id} className="zahl" title={abschnitt.name}>
                        {abschnitt.art === 'test' ? 'T' : abschnitt.art === 'diplomarbeit' ? 'DA' : 'S'}
                        {abschnitt.nummer}
                        <br />
                        <span className="maximum">×{abschnitt.faktor}</span>
                      </th>
                    ))}
                    <th className="zahl">Praxis</th>
                    <th className="zahl">Theorie</th>
                    <th className="zahl">Gesamt</th>
                    <th className="zahl">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {ergebnisse.map(({ person, ergebnis }) => {
                    const nachId = new Map(ergebnis.alle.map((e) => [e.abschnitt.id, e.ergebnis]));
                    return (
                      <tr key={person.id}>
                        <td>
                          <b>{person.name}</b>
                        </td>
                        <td className="anmerkung">
                          {teams.find((t) => t.id === teamVon(person.id))?.name ?? '–'}
                        </td>
                        {abschnitte.map((abschnitt) => {
                          const wert = nachId.get(abschnitt.id)?.prozent ?? null;
                          return (
                            <td key={abschnitt.id} className="zahl">
                              <span className="prozent">
                                {wert === null ? '–' : Math.round(wert)}
                              </span>
                            </td>
                          );
                        })}
                        <td className="zahl">
                          <Prozent wert={ergebnis.praxis.prozent} stellen={1} />
                        </td>
                        <td className="zahl">
                          <Prozent wert={ergebnis.theorie.prozent} stellen={1} />
                        </td>
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
                            notenschluessel={daten.notenschluessel}
                          />
                        </td>
                      </tr>
                    );
                  })}
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
                      const imTeam = ergebnisse.filter((e) => teamVon(e.person.id) === team.id);
                      const werte = imTeam
                        .map((e) => e.ergebnis.prozent)
                        .filter((wert): wert is number => wert !== null);
                      const mittel =
                        werte.length === 0
                          ? null
                          : werte.reduce((summe, wert) => summe + wert, 0) / werte.length;
                      return (
                        <tr key={team.id}>
                          <td>
                            <b>{team.name}</b>
                          </td>
                          <td className="zahl">{imTeam.length}</td>
                          <td className="zahl">
                            <Prozent wert={mittel} stellen={1} />
                          </td>
                          <td className="zahl">
                            <Notenzeichen
                              prozent={mittel}
                              notenschluessel={daten.notenschluessel}
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
            {daten.notenschluessel
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
            {daten.notenschluessel
              .slice()
              .sort((a, b) => b.ab - a.ab)
              .map((stufe) => `Note ${stufe.note} ab ${stufe.ab} %`)
              .join(' · ')}
          </p>
          <p className="anmerkung">
            Der Vorschlag ersetzt die Beurteilung nicht. Die Note entscheidet die Lehrkraft; ein
            negativer Strang muss gesondert betrachtet werden.
          </p>
        </div>
      </div>
    </>
  );
}
