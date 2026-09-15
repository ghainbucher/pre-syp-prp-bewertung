/**
 * Stammdaten · Projekte (FA-87, FA-34 AK-3).
 *
 * Links alle Projekte, rechts das gewählte: Name, Typ, Repository, Zeitraum,
 * Beschreibung und die Schülerzuordnung.
 *
 * **Die Klasse steht nicht am Projekt** (Fachkonzept 15.1). Sie hängt am
 * Schüler; die Spalte „Klasse(n)“ wird aus den Mitgliedern abgeleitet und
 * nirgends gepflegt. „Gemischt“ ist damit kein Zustand, den jemand setzt,
 * sondern schlicht der Fall, dass zwei Klassen vorkommen.
 */

import { useState } from 'react';

import { loeschhinweis, nurAktive } from '../domain/loeschen';
import {
  heutigerTag,
  mitgliederVon,
  paralleleProjekte,
  projektInKlasse,
  zuordnungBrauchtBestaetigung,
} from '../domain/zuordnung';
import type { Projekttyp } from '../domain/types';
import { klassen as alleKlassen, neueId, teamsVon } from '../ui/auswahl';
import {
  BestaetigenSchalter,
  GeloeschteSchalter,
  Karte,
  LeerHinweis,
  Textfeld,
} from '../ui/bausteine';
import { ART_BEZEICHNUNG, ART_KURZ, projektzeile } from '../ui/projekte';
import type { AnsichtProps } from './typen';

const TYPEN: Projekttyp[] = ['syp-pre-4', 'syp-pre-5', 'diplomarbeit'];

/** Ein Datum, wie es in einer Liste gelesen wird. */
function datum(wert: string | undefined): string {
  if (!wert || !wert.trim()) return '–';
  const teile = wert.split('-');
  return teile.length === 3 ? `${teile[2]}.${teile[1]}.${teile[0]}` : wert;
}

export function ProjektStammdatenAnsicht({ daten, dispatch, ui, setUi }: AnsichtProps) {
  const [neuesProjekt, setNeuesProjekt] = useState('');
  /** Schüler, dessen Überschneidung gerade zur Bestätigung ansteht (FA-87 AK-5). */
  const [nachfrage, setNachfrage] = useState<string | null>(null);
  const [zeigeGeloeschte, setZeigeGeloeschte] = useState(false);

  const klassen = alleKlassen(daten);
  // Der Klassenfilter der Kopfleiste wirkt auch hier (FA-95). Welche Klasse ein
  // Projekt betrifft, ergibt sich aus seinen Mitgliedern (Fachkonzept 15.1).
  const projekte = teamsVon(daten, ui.klasseId);
  const geloeschte = daten.teams
    .filter((t) => t.geloeschtAm && projektInKlasse(daten, t, ui.klasseId))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const klasseName = ui.klasseId
    ? (klassen.find((k) => k.id === ui.klasseId)?.name ?? null)
    : null;
  const projekt = projekte.find((p) => p.id === ui.teamId) ?? projekte[0] ?? null;

  const kopf = (
    <div className="ansichtskopf">
      <div>
        <h2>Stammdaten · Projekte</h2>
        <p>
          Links alle Projekte, rechts das gewählte. Die Klasse steht nicht am Projekt – sie hängt
          am Schüler und ergibt sich aus der Zuordnung.
        </p>
        {klasseName ? (
          <p className="anmerkung">
            Gezeigt werden nur Projekte mit Schülern der <b>{klasseName}</b> – so steht es oben in
            der Kopfleiste. Ein gemischtes Projekt erscheint in jeder beteiligten Klasse.
          </p>
        ) : null}
      </div>
    </div>
  );

  function projektAnlegen() {
    const name = neuesProjekt.trim();
    const klasseId = ui.klasseId ?? klassen[0]?.id ?? null;
    if (!name || !klasseId) return;
    const id = neueId('t');
    // `klasseId` ist bis zum nächsten Schemastand noch Pflicht am Team. Sie
    // wird nirgends angezeigt und hat keine fachliche Bedeutung mehr.
    dispatch({ art: 'team/anlegen', id, klasseId, name });
    setUi({ teamId: id });
    setNeuesProjekt('');
  }

  /**
   * Schüler zuordnen oder entfernen (FA-87 AK-5).
   *
   * Beim Zuordnen wird geprüft, ob der Schüler schon in einem anderen Projekt
   * ist. Dann wird **nicht** zugeordnet, sondern gefragt – die Bestätigung
   * schreibt das Datum an die Mitgliedschaft und ist damit später nachlesbar.
   */
  function zuordnen(personId: string, dabei: boolean) {
    if (!projekt) return;
    if (!dabei) {
      dispatch({ art: 'mitgliedschaft/setzen', projektId: projekt.id, personId, dabei: false });
      setNachfrage(null);
      return;
    }
    // Die Entscheidung trifft die Domäne (NFA-06); hier wird sie nur befolgt.
    if (zuordnungBrauchtBestaetigung(daten, projekt.id, personId)) {
      setNachfrage(personId);
      return;
    }
    dispatch({ art: 'mitgliedschaft/setzen', projektId: projekt.id, personId, dabei: true });
    setNachfrage(null);
  }

  function bestaetigen(personId: string) {
    if (!projekt) return;
    dispatch({
      art: 'mitgliedschaft/setzen',
      projektId: projekt.id,
      personId,
      dabei: true,
      bestaetigtAm: new Date().toISOString(),
    });
    setNachfrage(null);
  }

  if (klassen.length === 0) {
    return (
      <>
        {kopf}
        <LeerHinweis
          titel="Noch keine Klasse angelegt"
          text="Ein Projekt braucht Schüler, und Schüler gehören zu einer Klasse. Zuerst nebenan eine Klasse anlegen."
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

  const liste = (
    <div className="tabellenrahmen">
      <table>
        <thead>
          <tr>
            <th>Projekt</th>
            <th>Typ</th>
            <th>Klasse(n)</th>
            <th className="zahl">Schüler</th>
          </tr>
        </thead>
        <tbody>
          {projekte.map((eintrag) => {
            const zeile = projektzeile(daten, eintrag);
            return (
              <tr
                key={eintrag.id}
                className={eintrag.id === projekt?.id ? 'gewaehlt' : undefined}
                onClick={() => setUi({ teamId: eintrag.id })}
              >
                <td>
                  <button
                    type="button"
                    className="schalter schlicht klein"
                    onClick={() => setUi({ teamId: eintrag.id })}
                  >
                    {eintrag.name}
                  </button>
                  {eintrag.repository ? (
                    <div className="anmerkung mono">{eintrag.repository}</div>
                  ) : null}
                </td>
                <td>{eintrag.typ ? ART_KURZ[eintrag.typ] : '–'}</td>
                <td>
                  {zeile.klassen.join(', ') || <span className="anmerkung">niemand zugeordnet</span>}
                  {zeile.gemischt ? <span className="etikett"> gemischt</span> : null}
                </td>
                <td className="zahl">{zeile.mitglieder.length}</td>
              </tr>
            );
          })}
          {zeigeGeloeschte
            ? geloeschte.map((eintrag) => (
                <tr key={eintrag.id} className="geloescht">
                  <td>{eintrag.name}</td>
                  <td>{eintrag.typ ? ART_KURZ[eintrag.typ] : '–'}</td>
                  <td colSpan={2}>
                    <button
                      type="button"
                      className="schalter schlicht klein"
                      onClick={() =>
                        dispatch({
                          art: 'stammdaten/wiederherstellen',
                          was: 'projekt',
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
      <div className="zweispaltig listeschmal">
        <div>
          <Karte
            titel="Alle Projekte"
            hinweis={`${projekte.length} Projekte`}
            buendig
            rechts={
              <span className="zeile">
                <GeloeschteSchalter
                  anzahl={geloeschte.length}
                  offen={zeigeGeloeschte}
                  onUmschalten={setZeigeGeloeschte}
                />
                <Textfeld
                  wert={neuesProjekt}
                  beschriftung="Neues Projekt"
                  platzhalter="Name des Auftrags"
                  onAendern={setNeuesProjekt}
                />
                <button type="button" className="schalter klein haupt" onClick={projektAnlegen}>
                  anlegen
                </button>
              </span>
            }
          >
            {projekte.length === 0 && !(zeigeGeloeschte && geloeschte.length > 0) ? (
              <div className="inhalt">
                <p className="hinweis">
                  Noch kein Projekt. Der Name des Auftrags genügt – Typ, Repository und Zeitraum
                  lassen sich danach eintragen.
                </p>
              </div>
            ) : (
              liste
            )}
          </Karte>
          <p className="hinweis">
            Filter über Jahrgang, Klasse und Suche kommen später (FA-90). Sie wirken dann über die
            Schüler – nicht über eine Klassenangabe am Projekt, die es nicht mehr gibt.
          </p>
        </div>

        {projekt ? (
          <div>
            <Karte titel={projekt.name} hinweis="Stammdaten des gewählten Projekts">
              <div className="feldgitter">
                <label className="feld">
                  <span>Name</span>
                  <Textfeld
                    wert={projekt.name}
                    beschriftung={`Name von ${projekt.name}`}
                    onAendern={(wert) =>
                      dispatch({ art: 'team/umbenennen', id: projekt.id, name: wert })
                    }
                  />
                </label>
                <label className="feld">
                  <span>Typ</span>
                  <select
                    aria-label={`Typ von ${projekt.name}`}
                    value={projekt.typ ?? ''}
                    onChange={(e) =>
                      dispatch({
                        art: 'team/art',
                        id: projekt.id,
                        projektart: e.target.value === '' ? null : (e.target.value as Projekttyp),
                      })
                    }
                  >
                    <option value="">– nicht festgelegt –</option>
                    {TYPEN.map((wert) => (
                      <option key={wert} value={wert}>
                        {ART_BEZEICHNUNG[wert]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="feld">
                  <span>Repository</span>
                  <Textfeld
                    wert={projekt.repository ?? ''}
                    beschriftung={`Repository von ${projekt.name}`}
                    platzhalter="eigentuemer/name"
                    onAendern={(wert) =>
                      dispatch({ art: 'team/repository', id: projekt.id, repository: wert })
                    }
                  />
                </label>
                <label className="feld">
                  <span>Beginn des Projekts</span>
                  <input
                    type="date"
                    aria-label={`Projektbeginn von ${projekt.name}`}
                    value={projekt.von ?? ''}
                    onChange={(e) =>
                      dispatch({ art: 'team/zeitraum', id: projekt.id, von: e.target.value })
                    }
                  />
                </label>
                <label className="feld">
                  <span>Ende des Projekts</span>
                  <input
                    type="date"
                    aria-label={`Projektende von ${projekt.name}`}
                    value={projekt.bis ?? ''}
                    onChange={(e) =>
                      dispatch({ art: 'team/zeitraum', id: projekt.id, bis: e.target.value })
                    }
                  />
                </label>
                <label className="feld breit">
                  <span>Beschreibung</span>
                  <Textfeld
                    mehrzeilig
                    wert={projekt.beschreibung ?? ''}
                    beschriftung={`Beschreibung von ${projekt.name}`}
                    platzhalter="Worum geht es in diesem Auftrag?"
                    onAendern={(wert) =>
                      dispatch({ art: 'team/beschreibung', id: projekt.id, text: wert })
                    }
                  />
                </label>
              </div>

              <p className="hinweis" style={{ marginTop: 12 }}>
                Der Zeitraum ({datum(projekt.von)} – {datum(projekt.bis)}) ist{' '}
                <b>Information für den Leser</b> und geht in keine Rechnung ein. Der Zeitfaktor
                nach § 20 Abs. 1 LBVO rechnet weiterhin über die Hälften des
                Beurteilungszeitraums.
              </p>

              <p className="hinweis">
                Das Repository steht hier, damit für ein Gespräch ohne Suchen ein vorübergehender
                Klon angelegt werden kann. Die Anwendung ruft nichts ab (ADR-001).
              </p>

              <BestaetigenSchalter
                beschriftung="Projekt löschen"
                frage={
                  mitgliederVon(daten, projekt.id).length === 0
                    ? 'wirklich löschen?'
                    : `mit ${mitgliederVon(daten, projekt.id).length} Schülern?`
                }
                klasse="schalter klein"
                onBestaetigt={() => dispatch({ art: 'team/loeschen', id: projekt.id })}
              />
              <p className="anmerkung">{loeschhinweis(daten, 'projekt', projekt.id)}</p>
              <p className="hinweis">
                <b>Gelöscht wird auf zwei Arten</b> (FA-94): Hängt nichts Bewertetes am Projekt,
                wird es endgültig entfernt – samt seinen Sprints und Mitgliedschaften. Hängen
                Punkte oder eine festgehaltene Planung daran, bleibt alles stehen und das Projekt
                wird nur ausgeblendet; es lässt sich jederzeit wiederherstellen. Anders wäre eine
                Note nicht mehr rekonstruierbar (Fachkonzept G7).
              </p>
            </Karte>

            <Karte
              titel="Schüler in diesem Projekt"
              hinweis={`${mitgliederVon(daten, projekt.id).length} zugeordnet`}
            >
              {nachfrage ? (
                <p className="warnung" role="status">
                  <b>{daten.personen.find((p) => p.id === nachfrage)?.name}</b> ist bereits in{' '}
                  {paralleleProjekte(daten, projekt.id, nachfrage)
                    .map((team) => team.name)
                    .join(', ')}
                  . Parallele Mitgliedschaft ist erlaubt, aber selten gewollt – sie verteilt die
                  Beiträge desselben Schülers auf zwei Bewertungen.{' '}
                  <button
                    type="button"
                    className="schalter klein haupt"
                    onClick={() => bestaetigen(nachfrage)}
                  >
                    Überschneidung ist gewollt
                  </button>{' '}
                  <button
                    type="button"
                    className="schalter klein"
                    onClick={() => setNachfrage(null)}
                  >
                    doch nicht zuordnen
                  </button>
                </p>
              ) : null}

              <div className="schuelerliste">
                {nurAktive(daten.personen)
                  .sort(
                    (a, b) =>
                      (daten.klassen.find((k) => k.id === a.klasseId)?.name ?? '').localeCompare(
                        daten.klassen.find((k) => k.id === b.klasseId)?.name ?? '',
                        'de',
                      ) || a.name.localeCompare(b.name, 'de'),
                  )
                  .map((person) => {
                    const eintrag = daten.mitgliedschaften.find(
                      (m) => m.projektId === projekt.id && m.personId === person.id,
                    );
                    const andere = paralleleProjekte(daten, projekt.id, person.id);
                    return (
                      <div
                        key={person.id}
                        className={eintrag ? 'schuelerzeile drin' : 'schuelerzeile'}
                      >
                        <input
                          type="checkbox"
                          id={`m-${projekt.id}-${person.id}`}
                          checked={Boolean(eintrag)}
                          onChange={(e) => zuordnen(person.id, e.target.checked)}
                        />
                        <label className="klasse" htmlFor={`m-${projekt.id}-${person.id}`}>
                          {daten.klassen.find((k) => k.id === person.klasseId)?.name ?? '—'}
                        </label>
                        <label htmlFor={`m-${projekt.id}-${person.id}`}>{person.name}</label>
                        <span className="dehnen" />
                        {eintrag?.ueberschneidungBestaetigtAm ? (
                          <span className="woanders">
                            Überschneidung bestätigt am{' '}
                            {datum(eintrag.ueberschneidungBestaetigtAm.slice(0, 10))}
                          </span>
                        ) : andere.length > 0 ? (
                          <span className="woanders">
                            auch in {andere.map((team) => team.name).join(', ')}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
              </div>

              <p className="hinweis" style={{ marginTop: 12 }}>
                Die Zuordnung gilt für das <b>Projekt</b> und damit für alle seine Sprints
                (Fachkonzept 15.2, A8) – nicht mehr je Abschnitt. Ein Schüler darf in mehreren
                Projekten sein; die Anwendung fragt dann nach, weil es selten gewollt ist.
                Heute ist der {datum(heutigerTag())}.
              </p>
            </Karte>
          </div>
        ) : null}
      </div>
    </>
  );
}
