/**
 * Klassenübersicht, Teamvergleich, Notenverteilung und CSV-Export
 * (FA-28 bis FA-31, FA-59).
 */

import { useMemo } from 'react';

import {
  datumDeutsch,
  gesamtErgebnis,
  notenstandWeichtAb,
  notenvorschlag,
  strangUnterGrenze,
  zeitfaktorWeichtAb,
} from '../domain/scoring';
import { abschnitteImZeitraum, teamIn, zeitraumVon } from '../domain/zuordnung';
import { belegfassungDateiname, belegfassungHtml } from '../export/belegfassung';
import { alsCsv, csvDateiname, dateiAnbieten, uebersichtZeilen } from '../export/csv';
import { bewertungsIndex } from '../store/storeReducer';
import { personenVon, teamsVon } from '../ui/auswahl';
import {
  Balken,
  Karte,
  LeerHinweis,
  Notenzeichen,
  Prozent,
  Punktefeld,
  Textfeld,
} from '../ui/bausteine';
import type { AnsichtProps } from './typen';

export function AuswertungAnsicht({ daten, dispatch, ui, setUi }: AnsichtProps) {
  const index = useMemo(() => bewertungsIndex(daten), [daten]);
  const klasse = daten.klassen.find((k) => k.id === ui.klasseId);
  const zeitraum = zeitraumVon(daten, ui.stichtagId);
  const abschnitte = abschnitteImZeitraum(daten, ui.klasseId, zeitraum);
  const stichtag = daten.stichtage.find((s) => s.id === ui.stichtagId) ?? null;
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

  const ergebnisse = personen.map((person) => {
    const ergebnis = gesamtErgebnis(daten, person, index, ui.stichtagId);
    return {
      person,
      ergebnis,
      vorschlag: notenvorschlag(ergebnis, daten.notenschluessel, daten.sperreAktiv),
    };
  });

  // Der Zeitfaktor hängt an der Lage im Strang und ist für alle Personen
  // gleich; einmal aus dem ersten Ergebnis abgelesen genügt.
  const zeitfaktorVon = new Map(
    (ergebnisse[0]?.ergebnis.alle ?? []).map((e) => [e.abschnitt.id, e.zeitfaktor]),
  );

  // Die Auslassung hängt am Zeitraum, nicht an der Person – einmal ablesen genügt.
  const ohneDatum = ergebnisse[0]?.ergebnis.auslassung.ohneDatum ?? [];

  const verteilung = new Map<number | 'offen', number>();
  for (const eintrag of ergebnisse) {
    // Gezählt wird der Vorschlag **mit** Sperre – sonst zeigte die Verteilung
    // etwas anderes als die Tabelle darüber.
    const schluessel = eintrag.vorschlag.note ?? ('offen' as const);
    verteilung.set(schluessel, (verteilung.get(schluessel) ?? 0) + 1);
  }
  const gesperrte = ergebnisse.filter((e) => e.vorschlag.gesperrtDurch !== null).length;

  function exportieren() {
    const zeilen = uebersichtZeilen({
      daten,
      klasseId: klasse!.id,
      personen,
      teams,
      abschnitte,
      bewertungen: index,
      stichtagId: ui.stichtagId,
    });
    dateiAnbieten(csvDateiname(klasse!.name, new Date(), stichtag?.name), alsCsv(zeilen));
  }

  return (
    <>
      <div className="ansichtskopf">
        <div>
          <h2>Auswertung {klasse.name}</h2>
          <p>
            Praxis und Theorie werden getrennt gemittelt und dann mit{' '}
            {daten.strangGewichte.praxis} zu {daten.strangGewichte.theorie} zusammengeführt
            (FA-59). Innerhalb eines Strangs zählt das Produkt aus Abschnittsfaktor und
            Zeitfaktor – die zweite Hälfte wiegt {daten.zeitfaktorZweiteHaelfte}-fach
            (§ 20 Abs. 1 LBVO). Abschnitte ohne Eintrag bleiben außen vor.
          </p>
          {zeitfaktorWeichtAb(daten.zeitfaktorZweiteHaelfte) ? (
            <p className="anmerkung">
              Der Zeitfaktor steht auf {daten.zeitfaktorZweiteHaelfte}: Spätere Abschnitte wiegen
              damit nicht schwerer als frühere. Das weicht von § 20 Abs. 1 LBVO ab.
            </p>
          ) : null}
        </div>
        <span className="dehnen" />
        {/* FA-48 AK-3: Der gewählte Stichtag ist in der Ausgabe erkennbar. */}
        {daten.stichtage.length > 0 ? (
          <div className="zeile">
            <label className="etikett" htmlFor="stichtagwahl">
              Stichtag
            </label>
            <select
              id="stichtagwahl"
              value={ui.stichtagId ?? ''}
              onChange={(e) => setUi({ stichtagId: e.target.value || null })}
            >
              <option value="">gesamter Durchgang</option>
              {[...daten.stichtage]
                .sort((a, b) => a.bis.localeCompare(b.bis))
                .map((eintrag) => (
                  <option key={eintrag.id} value={eintrag.id}>
                    {eintrag.name} ({datumDeutsch(eintrag.bis)})
                  </option>
                ))}
            </select>
          </div>
        ) : null}
        <button type="button" className="schalter" onClick={exportieren}>
          CSV exportieren
        </button>
      </div>

      {stichtag ? (
        <p className="anmerkung">
          Ausgewertet wird der Zeitraum{' '}
          {zeitraum.von ? `nach dem ${datumDeutsch(zeitraum.von)} ` : ''}bis{' '}
          {datumDeutsch(stichtag.bis)} – {stichtag.name}
          {stichtag.art === 'kontrolle'
            ? '. Dieser Stichtag schließt keinen Beurteilungszeitraum ab, sondern wertet den laufenden aus (§ 19 Abs. 3a SchUG).'
            : '.'}{' '}
          Spätere Abschnitte bleiben erhalten und erscheinen nur hier nicht.
        </p>
      ) : null}

      {ohneDatum.length > 0 ? (
        <div className="meldung" role="status">
          {ohneDatum.length === 1
            ? 'Ein Abschnitt hat kein Enddatum'
            : `${ohneDatum.length} Abschnitte haben kein Enddatum`}{' '}
          ({ohneDatum.map((a) => a.name).join(', ')}) und lässt sich damit keinem Stichtag
          zuordnen. {ohneDatum.length === 1 ? 'Er bleibt' : 'Sie bleiben'} in dieser Auswertung
          außen vor – bitte das Enddatum unter „Klassen &amp; Teams“ eintragen.
        </div>
      ) : null}

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
                      <th
                        key={abschnitt.id}
                        className="zahl"
                        title={`${abschnitt.name} · Abschnittsfaktor ${abschnitt.faktor} · Zeitfaktor ${
                          zeitfaktorVon.get(abschnitt.id) ?? 1
                        }`}
                      >
                        {abschnitt.art === 'test' ? 'T' : abschnitt.art === 'diplomarbeit' ? 'DA' : 'S'}
                        {abschnitt.nummer}
                        <br />
                        {/* Beide Faktoren getrennt (FA-54 AK-4): Wer nur das
                            Produkt sieht, kann Lage und Einstellung nicht
                            mehr unterscheiden. */}
                        <span className="maximum">
                          ×{abschnitt.faktor} · Z{zeitfaktorVon.get(abschnitt.id) ?? 1}
                        </span>
                      </th>
                    ))}
                    <th className="zahl">Praxis</th>
                    <th className="zahl">Theorie</th>
                    <th className="zahl">Gesamt</th>
                    <th className="zahl">Vorschlag</th>
                    <th className="zahl">Notenstand</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {ergebnisse.map(({ person, ergebnis, vorschlag }) => {
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
                        {/* FA-61 AK-5: Ein Strang unter der Grenze ist erkennbar,
                            bevor der Beurteilungszeitraum endet. */}
                        <td
                          className={
                            strangUnterGrenze(ergebnis.praxis.prozent, daten.notenschluessel)
                              ? 'zahl gefaehrdet'
                              : 'zahl'
                          }
                          title={
                            strangUnterGrenze(ergebnis.praxis.prozent, daten.notenschluessel)
                              ? 'Praxisstrang unter der Genügend-Grenze'
                              : undefined
                          }
                        >
                          <Prozent wert={ergebnis.praxis.prozent} stellen={1} />
                        </td>
                        <td
                          className={
                            strangUnterGrenze(ergebnis.theorie.prozent, daten.notenschluessel)
                              ? 'zahl gefaehrdet'
                              : 'zahl'
                          }
                          title={
                            strangUnterGrenze(ergebnis.theorie.prozent, daten.notenschluessel)
                              ? 'Theoriestrang unter der Genügend-Grenze'
                              : undefined
                          }
                        >
                          <Prozent wert={ergebnis.theorie.prozent} stellen={1} />
                        </td>
                        <td className="zahl">
                          <span className="zeile" style={{ justifyContent: 'flex-end', gap: 8 }}>
                            <span style={{ width: 60 }}>
                              <Balken wert={ergebnis.prozent} />
                            </span>
                            <span
                              className={ergebnis.gesetzt ? 'abweichend' : undefined}
                              title={
                                ergebnis.gesetzt
                                  ? `Gesetzt am ${datumDeutsch(ergebnis.gesetzt.gesetztAm.slice(0, 10))}. Gerechnet: ${
                                      ergebnis.prozentBerechnet === null
                                        ? 'kein Wert'
                                        : `${Math.round(ergebnis.prozentBerechnet)} %`
                                    }${ergebnis.gesetzt.begruendung ? ` – ${ergebnis.gesetzt.begruendung}` : ''}`
                                  : undefined
                              }
                            >
                              <Prozent wert={ergebnis.prozent} stellen={1} />
                            </span>
                          </span>
                        </td>
                        <td className="zahl">
                          <span
                            className={
                              vorschlag.note === null ? 'note note-leer' : `note note-${vorschlag.note}`
                            }
                            title={
                              vorschlag.gesperrtDurch
                                ? `Gesperrt durch den ${vorschlag.gesperrtDurch === 'praxis' ? 'Praxis' : 'Theorie'}strang (§ 14 LBVO). Ohne Sperre: ${vorschlag.ohneSperre ?? '–'}`
                                : undefined
                            }
                          >
                            {vorschlag.note ?? '–'}
                            {vorschlag.gesperrtDurch ? '*' : ''}
                          </span>
                        </td>
                        {/* FA-49: Die Note trägt die Lehrkraft ein. Weicht sie
                            vom Vorschlag ab, bleiben beide stehen (AK-3). */}
                        <td className="zahl">
                          <select
                            aria-label={`Notenstand von ${person.name}`}
                            className={
                              notenstandWeichtAb(ergebnis.notenstand, vorschlag)
                                ? 'abweichend'
                                : undefined
                            }
                            title={
                              notenstandWeichtAb(ergebnis.notenstand, vorschlag)
                                ? `Weicht vom Vorschlag ${vorschlag.note} ab${
                                    ergebnis.notenstand?.begruendung
                                      ? ` – ${ergebnis.notenstand.begruendung}`
                                      : ''
                                  }`
                                : undefined
                            }
                            value={ergebnis.notenstand?.note ?? ''}
                            onChange={(e) =>
                              dispatch({
                                art: 'notenstand',
                                stichtagId: ui.stichtagId,
                                personId: person.id,
                                note: e.target.value
                                  ? (Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
                                  : null,
                              })
                            }
                          >
                            <option value="">–</option>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="zahl">
                          {/* FA-32: die vollständige Herleitung – auf Verlangen,
                              nicht bei jedem Aufruf. */}
                          <button
                            type="button"
                            className="schalter schlicht klein"
                            onClick={() =>
                              dateiAnbieten(
                                belegfassungDateiname(person.name),
                                belegfassungHtml({
                                  daten,
                                  person,
                                  ergebnis,
                                  stichtagsname: stichtag?.name,
                                }),
                                'text/html;charset=utf-8',
                              )
                            }
                          >
                            Belegfassung
                          </button>
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

          {/* FA-50 AK-1: der Gesamtstand als oberste setzbare Ebene. */}
          <Karte
            titel="Gesamtstand setzen"
            hinweis={stichtag ? `für ${stichtag.name}` : 'für den gesamten Durchgang'}
            buendig
          >
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
                  {ergebnisse.map(({ person, ergebnis }) => (
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
                          wert={ergebnis.gesetzt?.prozent}
                          max={100}
                          beschriftung={`Gesamtstand gesetzt – ${person.name}`}
                          onAendern={(wert) =>
                            dispatch({
                              art: 'gesetzt/gesamt',
                              stichtagId: ui.stichtagId,
                              personId: person.id,
                              wert,
                            })
                          }
                        />
                      </td>
                      <td>
                        {ergebnis.gesetzt ? (
                          <Textfeld
                            breit
                            wert={ergebnis.gesetzt.begruendung}
                            beschriftung={`Begründung Gesamtstand – ${person.name}`}
                            platzhalter="freiwillig"
                            onAendern={(begruendung) =>
                              dispatch({
                                art: 'gesetzt/gesamt',
                                stichtagId: ui.stichtagId,
                                personId: person.id,
                                wert: ergebnis.gesetzt!.prozent,
                                begruendung,
                              })
                            }
                          />
                        ) : (
                          <span className="anmerkung">–</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="inhalt">
              <p className="anmerkung" style={{ margin: 0 }}>
                Ein gesetzter Wert ersetzt den gerechneten nicht – beide bleiben erhalten und
                stehen nebeneinander. Ändert sich später etwas darunter, bleibt der gesetzte Wert
                stehen und die Abweichung wird sichtbar.
              </p>
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
          {gesperrte > 0 ? (
            <p className="anmerkung">
              * {gesperrte === 1 ? 'Ein Vorschlag ist' : `${gesperrte} Vorschläge sind`} durch einen
              negativen Strang auf Nicht genügend gesetzt (§ 14 LBVO, FA-61). Die Strangstände und
              der Gesamtstand daneben bleiben davon unberührt – die Sperre verändert keinen Wert.
            </p>
          ) : null}
          <p className="anmerkung">
            Der Vorschlag ersetzt die Beurteilung nicht. Die Note entscheidet die Lehrkraft.
          </p>
        </div>
      </div>
    </>
  );
}
