/**
 * Tests als eigene Sicht (FA-74, FA-60).
 *
 * Ein Test hat kein Team: eine Zeile je Person, eine Spalte je Frage über die
 * ganze Klasse (FA-60 AK-3). Er steht deshalb nicht in derselben Leiste wie die
 * Sprints, sondern hier.
 */

import { useMemo, type ReactNode } from 'react';

import { bewertungsSchluessel, datumDeutsch, kategorieErgebnis } from '../domain/scoring';
import { abschnitteVon, rubrikVon } from '../domain/zuordnung';
import type { Abschnitt, Bewertung, Notenstufe, Person, Rubrik } from '../domain/types';
import { bewertungsIndex } from '../store/storeReducer';
import { personenVon } from '../ui/auswahl';
import { Karte, LeerHinweis, Notenzeichen, Prozent, Punktefeld } from '../ui/bausteine';
import { NotizenKarte } from './NotizenKarte';
import type { AnsichtProps } from './typen';

export function TestAnsicht({ daten, dispatch, ui, setUi }: AnsichtProps) {
  const tests = abschnitteVon(daten, ui.klasseId).filter((a) => a.art === 'test');
  const index = useMemo(() => bewertungsIndex(daten), [daten]);

  if (!ui.klasseId || tests.length === 0) {
    return (
      <LeerHinweis
        titel="Noch kein Test angelegt"
        text="Tests werden unter „Klassen & Teams“ angelegt und angekündigt; erfasst werden sie hier."
        aktion={
          <button type="button" className="schalter haupt" onClick={() => setUi({ ansicht: 'struktur' })}>
            Zu Klassen &amp; Teams
          </button>
        }
      />
    );
  }

  const test = tests.find((a) => a.id === ui.abschnittId) ?? tests[tests.length - 1];

  const testwahl = (
    <div className="auswahlzeile">
      <span className="etikett">Test</span>
      {tests.map((eintrag) => (
        <button
          key={eintrag.id}
          type="button"
          className="chip"
          aria-pressed={eintrag.id === test.id}
          onClick={() => setUi({ abschnittId: eintrag.id })}
        >
          <span className="index">T{eintrag.nummer}</span>
          {eintrag.name}
        </button>
      ))}
    </div>
  );

  return (
    <TestMaske
      abschnitt={test}
      rubrik={rubrikVon(daten, test)}
      personen={personenVon(daten, ui.klasseId)}
      bewertung={index.get(bewertungsSchluessel(test.id, null))}
      notenschluessel={daten.notenschluessel}
      abschnittswahl={testwahl}
      onAendern={(personId, kriteriumId, wert) =>
        dispatch({
          art: 'bewertung/individuell',
          abschnittId: test.id,
          teamId: null,
          personId,
          kriteriumId,
          wert,
        })
      }
      onNotiz={(personId, notiz) =>
        dispatch({ art: 'bewertung/individuellNotiz', abschnittId: test.id, teamId: null, personId, notiz })
      }
    />
  );
}

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

