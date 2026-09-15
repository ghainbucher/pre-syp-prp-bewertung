/**
 * Stammdaten · Tests (FA-34 AK-3, FA-60).
 *
 * Was einen Test ausmacht, bevor er geschrieben wird: zu welcher Klasse er
 * gehört, wann er angekündigt wurde (§ 8 LBVO) und wie lange er dauert.
 *
 * **Ein Test gehört der Klasse, nicht einem Projekt** (Fachkonzept 15.1). Das
 * ist der Unterschied zur Projektseite nebenan und der Grund, warum es zwei
 * Stammdatenseiten gibt.
 *
 * Die **Fragen** eines Tests sind seine Rubrik (FA-60 AK-2). Sie werden unter
 * „Rubrik & Notenschlüssel“ bearbeitet; von hier führt ein Weg dorthin.
 */

import { useState } from 'react';

import { testRubrik } from '../domain/defaults';
import { loeschhinweis } from '../domain/loeschen';
import { abschnitteVon, sichtbareKlassen } from '../domain/zuordnung';
import type { Abschnitt } from '../domain/types';
import { klassen as alleKlassen, neueId } from '../ui/auswahl';
import {
  BestaetigenSchalter,
  GeloeschteSchalter,
  Karte,
  LeerHinweis,
  Textfeld,
} from '../ui/bausteine';
import type { AnsichtProps } from './typen';

function datum(wert: string | undefined): string {
  if (!wert || !wert.trim()) return '–';
  const teile = wert.split('-');
  return teile.length === 3 ? `${teile[2]}.${teile[1]}.${teile[0]}` : wert;
}

export function TestStammdatenAnsicht({ daten, dispatch, ui, setUi }: AnsichtProps) {
  const [neuerTest, setNeuerTest] = useState('');
  const [neueKlasse, setNeueKlasse] = useState('');
  const [zeigeGeloeschte, setZeigeGeloeschte] = useState(false);

  const klassen = alleKlassen(daten);
  /** Die gefilterte Klasse, `null` = alle (FA-95). */
  const klasse = klassen.find((k) => k.id === ui.klasseId) ?? null;
  /**
   * Klasse, in der ein neuer Test entsteht – „alle Klassen" ist dafür keine
   * Antwort. Steht der Filter auf einer Klasse, ist sie es; sonst wird sie
   * ausdrücklich gewählt und nicht stillschweigend die erste genommen.
   */
  const zielklasse =
    klasse ?? klassen.find((k) => k.id === neueKlasse) ?? klassen[0] ?? null;
  const sichtbar = sichtbareKlassen(daten);
  const tests = abschnitteVon(daten, klasse?.id ?? null).filter((a) => a.art === 'test');
  const geloeschte = daten.abschnitte.filter(
    (a) =>
      a.art === 'test' &&
      a.geloeschtAm &&
      (klasse ? a.klasseId === klasse.id : sichtbar.has(a.klasseId)),
  );
  const test = tests.find((a) => a.id === ui.abschnittId) ?? tests[tests.length - 1] ?? null;
  const rubrik = test ? daten.rubriken.find((r) => r.id === test.rubrikId) : undefined;

  const kopf = (
    <div className="ansichtskopf">
      <div>
        <h2>Stammdaten · Tests</h2>
        <p>
          Ein Test gehört der Klasse und wird von allen zugleich geschrieben – anders als ein
          Sprint, der einem Projekt gehört. Seine Fragen sind zugleich seine Kriterien.
        </p>
      </div>
    </div>
  );

  if (!zielklasse) {
    return (
      <>
        {kopf}
        <LeerHinweis
          titel="Noch keine Klasse angelegt"
          text="Ein Test wird von einer Klasse geschrieben. Zuerst nebenan eine Klasse anlegen."
          aktion={
            <button
              type="button"
              className="schalter haupt"
              onClick={() => setUi({ ansicht: 'stammdaten', stammseite: 'klassen' })}
            >
              Zu den Klassen
            </button>
          }
        />
      </>
    );
  }

  function testAnlegen() {
    const name = neuerTest.trim();
    if (!name || !zielklasse) return;
    // Auch logisch gelöschte Abschnitte zählen hier mit: Sonst bekäme ein
    // neuer Test die Nummer eines nur ausgeblendeten (FA-94).
    const nummer =
      daten.abschnitte
        .filter((a) => a.klasseId === zielklasse.id)
        .reduce((groesste, a) => Math.max(groesste, a.nummer), 0) + 1;
    const id = neueId('a');
    const eigene = testRubrik(neueId('r'), name);
    const neu: Abschnitt = {
      id,
      klasseId: zielklasse.id,
      nummer,
      name,
      art: 'test',
      strang: 'theorie',
      rubrikId: eigene.id,
      von: '',
      bis: '',
      faktor: 1,
      peerAktiv: false,
    };
    dispatch({ art: 'abschnitt/anlegen', abschnitt: neu, rubrik: eigene });
    // Nur der neue Test wird gewählt, nicht der Klassenfilter gesetzt
    // (FA-95 AK-9) – unter „alle Klassen" steht er ohnehin in der Liste.
    setUi({ abschnittId: id });
    setNeuerTest('');
  }

  const liste = (
    <div className="tabellenrahmen">
      <table>
        <thead>
          <tr>
            <th>Test</th>
            <th>angekündigt</th>
            <th className="zahl">Min.</th>
            <th className="zahl">Fragen</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((eintrag) => {
            const eigene = daten.rubriken.find((r) => r.id === eintrag.rubrikId);
            return (
              <tr
                key={eintrag.id}
                className={eintrag.id === test?.id ? 'gewaehlt' : undefined}
              >
                <td>
                  <button
                    type="button"
                    className="schalter schlicht klein"
                    onClick={() => setUi({ abschnittId: eintrag.id })}
                  >
                    {eintrag.name}
                  </button>
                </td>
                <td className="mono">{datum(eintrag.angekuendigtAm)}</td>
                <td className="zahl">{eintrag.arbeitszeitMinuten ?? '–'}</td>
                <td className="zahl">{eigene?.individuell.length ?? 0}</td>
              </tr>
            );
          })}
          {zeigeGeloeschte
            ? geloeschte.map((eintrag) => (
                <tr key={eintrag.id} className="geloescht">
                  <td>{eintrag.name}</td>
                  <td className="mono">{datum(eintrag.angekuendigtAm)}</td>
                  <td colSpan={2}>
                    <button
                      type="button"
                      className="schalter schlicht klein"
                      onClick={() =>
                        dispatch({
                          art: 'stammdaten/wiederherstellen',
                          was: 'abschnitt',
                          id: eintrag.id,
                        })
                      }
                    >
                      wiederherstellen
                    </button>
                  </td>
                </tr>
              ))
            : null}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {kopf}

      {/*
        Dieselbe Klassenwahl wie in der Kopfleiste (FA-95) – hier als Leiste,
        weil sie auf diesem Blatt der wichtigste Filter ist. Ein Filter, der
        über Sichtgrenzen wirkt, muss auf jeder betroffenen Sicht zu sehen und
        zu ändern sein.
      */}
      <div className="auswahlzeile">
        <span className="etikett">Klasse</span>
        <button
          type="button"
          className="chip"
          aria-pressed={klasse === null}
          onClick={() => setUi({ klasseId: null, abschnittId: null })}
        >
          alle Klassen
        </button>
        {klassen.map((eintrag) => (
          <button
            key={eintrag.id}
            type="button"
            className="chip"
            aria-pressed={eintrag.id === klasse?.id}
            onClick={() => setUi({ klasseId: eintrag.id, abschnittId: null })}
          >
            {eintrag.name}
          </button>
        ))}
      </div>

      <div className="zweispaltig listeschmal">
        <div>
          <Karte
            titel={klasse ? `Tests der ${klasse.name}` : 'Tests aller Klassen'}
            hinweis={`${tests.length} Tests`}
            buendig
            rechts={
              <span className="zeile">
                <GeloeschteSchalter
                  anzahl={geloeschte.length}
                  offen={zeigeGeloeschte}
                  onUmschalten={setZeigeGeloeschte}
                />
                {klasse === null && klassen.length > 1 ? (
                  <select
                    aria-label="Klasse für den neuen Test"
                    value={zielklasse?.id ?? ''}
                    onChange={(e) => setNeueKlasse(e.target.value)}
                  >
                    {klassen.map((eintrag) => (
                      <option key={eintrag.id} value={eintrag.id}>
                        {eintrag.name}
                      </option>
                    ))}
                  </select>
                ) : null}
                <Textfeld
                  wert={neuerTest}
                  beschriftung="Neuer Test"
                  platzhalter="Bezeichnung"
                  onAendern={setNeuerTest}
                />
                <button type="button" className="schalter klein haupt" onClick={testAnlegen}>
                  anlegen
                </button>
              </span>
            }
          >
            {tests.length === 0 && !(zeigeGeloeschte && geloeschte.length > 0) ? (
              <div className="inhalt">
                <p className="hinweis">
                  {klasse ? 'Noch kein Test in dieser Klasse.' : 'Noch kein Test angelegt.'} Ein
                  neuer Test bekommt automatisch eine eigene Rubrik – seine Fragen.
                </p>
              </div>
            ) : (
              liste
            )}
          </Karte>
        </div>

        {test ? (
          <div>
            <Karte
              titel={test.name}
              hinweis={daten.klassen.find((k) => k.id === test.klasseId)?.name ?? '—'}
            >
              <div className="feldgitter">
                <label className="feld">
                  <span>Bezeichnung</span>
                  <Textfeld
                    wert={test.name}
                    beschriftung={`Bezeichnung von ${test.name}`}
                    onAendern={(wert) =>
                      dispatch({ art: 'abschnitt/aendern', id: test.id, aenderung: { name: wert } })
                    }
                  />
                </label>
                <label className="feld">
                  <span>Angekündigt am</span>
                  <input
                    type="date"
                    aria-label={`Ankündigung von ${test.name}`}
                    value={test.angekuendigtAm ?? ''}
                    onChange={(e) =>
                      dispatch({
                        art: 'abschnitt/aendern',
                        id: test.id,
                        aenderung: { angekuendigtAm: e.target.value },
                      })
                    }
                  />
                </label>
                <label className="feld">
                  <span>Arbeitszeit in Minuten</span>
                  <input
                    type="number"
                    min={0}
                    aria-label={`Arbeitszeit von ${test.name}`}
                    value={test.arbeitszeitMinuten ?? ''}
                    onChange={(e) =>
                      dispatch({
                        art: 'abschnitt/aendern',
                        id: test.id,
                        aenderung: {
                          arbeitszeitMinuten: e.target.value === '' ? undefined : Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
                <label className="feld">
                  <span>Geschrieben am</span>
                  <input
                    type="date"
                    aria-label={`Termin von ${test.name}`}
                    value={test.bis}
                    onChange={(e) =>
                      dispatch({
                        art: 'abschnitt/aendern',
                        id: test.id,
                        aenderung: { von: e.target.value, bis: e.target.value },
                      })
                    }
                  />
                </label>
              </div>

              <p className="hinweis" style={{ marginTop: 12 }}>
                Die Ankündigung steht hier, weil § 8 LBVO sie verlangt – nicht als Erinnerung,
                sondern als Aufzeichnung. Ohne Datum ist der Test trotzdem erfassbar; die Lücke
                bleibt aber sichtbar.
              </p>

              <BestaetigenSchalter
                beschriftung="Test löschen"
                frage="wirklich löschen?"
                klasse="schalter klein"
                onBestaetigt={() => dispatch({ art: 'abschnitt/loeschen', id: test.id })}
              />
              <p className="anmerkung">{loeschhinweis(daten, 'abschnitt', test.id)}</p>
              <p className="hinweis">
                <b>Gelöscht wird auf zwei Arten</b> (FA-94): Ein Test ohne erfasste Punkte
                verschwindet endgültig. Sobald Punkte erfasst sind oder die Fragen eingefroren
                wurden, bleibt der Test stehen und wird nur ausgeblendet – sonst wäre die Note
                nicht mehr rekonstruierbar (Fachkonzept G7).
              </p>
            </Karte>

            <Karte
              titel="Fragen"
              hinweis={`${rubrik?.individuell.length ?? 0} Fragen · ${
                rubrik?.individuell.reduce((summe, k) => summe + k.max, 0) ?? 0
              } Punkte`}
            >
              {rubrik && rubrik.individuell.length > 0 ? (
                <div className="tabellenrahmen">
                  <table>
                    <thead>
                      <tr>
                        <th className="zahl">Nr.</th>
                        <th>Frage</th>
                        <th className="zahl">Punkte</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rubrik.individuell.map((frage, i) => (
                        <tr key={frage.id}>
                          <td className="zahl mono">F{i + 1}</td>
                          <td>{frage.name}</td>
                          <td className="zahl">{frage.max}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="hinweis">Für diesen Test sind noch keine Fragen erfasst.</p>
              )}

              <p className="hinweis" style={{ marginTop: 12 }}>
                <b>Die Fragen sind die Rubrik dieses Tests</b> (FA-60 AK-2). Deshalb stehen sie
                nicht bei der Projektrubrik, die über viele Sprints gleich bleibt. Bearbeitet
                werden sie dort, wo alle Rubriken bearbeitet werden:
              </p>
              <button
                type="button"
                className="schalter klein"
                onClick={() => setUi({ stammseite: 'rubrik', rubrikId: test.rubrikId })}
              >
                Fragen bearbeiten
              </button>
            </Karte>
          </div>
        ) : null}
      </div>
    </>
  );
}
