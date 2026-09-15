/**
 * Stammdaten · Schüler (FA-88, FA-34 AK-3).
 *
 * Eine Liste, eine Zeile je Schüler: **Klasse, Name, GitHub-Kennung,
 * Schul-E-Mail**. Mehr gehört hier nicht her.
 *
 * Insbesondere **keine Projektzuordnung**: Die Schüler werden beim Projekt
 * gewählt und nicht das Projekt beim Schüler (Fachkonzept 15.2, A8). Die Spalte
 * „in Projekten" zeigt nur, was dort zugeordnet wurde – sie ist Auskunft, keine
 * Eingabe.
 *
 * Die Kennung ist ein **Detail je Schüler** und bekommt deshalb keine eigene
 * Karte: eine Spalte in dieser Liste genügt.
 */

import { useState } from 'react';

import { loeschhinweis } from '../domain/loeschen';
import { kennungDoppelt, projekteVon, sichtbareKlassen } from '../domain/zuordnung';
import { klassen as alleKlassen, neueId, personenVon } from '../ui/auswahl';
import {
  BestaetigenSchalter,
  GeloeschteSchalter,
  Karte,
  LeerHinweis,
  Textfeld,
} from '../ui/bausteine';
import type { AnsichtProps } from './typen';

export function SchuelerAnsicht({ daten, dispatch, ui, setUi }: AnsichtProps) {
  const [filter, setFilter] = useState('');
  const [neueNamen, setNeueNamen] = useState('');
  const [neueKlasse, setNeueKlasse] = useState('');
  const [zeigeGeloeschte, setZeigeGeloeschte] = useState(false);

  const klassen = alleKlassen(daten);
  const klasseVon = (klasseId: string) =>
    daten.klassen.find((k) => k.id === klasseId)?.name ?? '(ohne Klasse)';

  // Logisch gelöschte Schüler stehen nicht in der Liste, sondern nur hinter dem
  // Schalter im Kartenkopf (FA-94). Der Klassenfilter der Kopfleiste wirkt auch
  // hier: Was er ausblendet, ist überall ausgeblendet (FA-95).
  const personen = personenVon(daten, ui.klasseId);
  const gefiltert = ui.klasseId !== null;
  const sichtbar = sichtbareKlassen(daten);
  const geloeschte = daten.personen
    .filter(
      (p) =>
        p.geloeschtAm && (ui.klasseId ? p.klasseId === ui.klasseId : sichtbar.has(p.klasseId)),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  const gesucht = filter.trim().toLowerCase();
  const liste = personen
    .filter((person) => {
      if (gesucht === '') return true;
      const felder = [
        person.name,
        klasseVon(person.klasseId),
        person.githubKennung ?? '',
        person.schulEmail ?? '',
      ];
      return felder.some((feld) => feld.toLowerCase().includes(gesucht));
    })
    .sort(
      (a, b) =>
        klasseVon(a.klasseId).localeCompare(klasseVon(b.klasseId), 'de') ||
        a.name.localeCompare(b.name, 'de'),
    );

  const ohneKennung = personen.filter((p) => !(p.githubKennung ?? '').trim()).length;

  const kopf = (
    <div className="ansichtskopf">
      <div>
        <h2>Stammdaten · Schüler</h2>
        <p>
          Die Klasse hängt hier und nur hier. Die Zuordnung zu Projekten geschieht beim Projekt –
          die Spalte rechts zeigt sie an, ändern lässt sie sich dort.
        </p>
        {gefiltert ? (
          <p className="anmerkung">
            Gezeigt wird nur die Klasse <b>{klasseVon(ui.klasseId!)}</b> – so steht es oben in der
            Kopfleiste. Auf „alle Klassen" gestellt, stehen hier alle Schüler.
          </p>
        ) : null}
      </div>
    </div>
  );

  function anlegen() {
    const klasseId = neueKlasse || ui.klasseId || klassen[0]?.id;
    if (!klasseId) return;
    const namen = neueNamen
      .split(/[,;\n]/)
      .map((teil) => teil.trim())
      .filter(Boolean)
      .map((name) => ({ id: neueId('p'), name }));
    if (namen.length === 0) return;
    // `teamId: null` – die Projektzuordnung geschieht beim Projekt (A8).
    dispatch({ art: 'person/anlegen', klasseId, teamId: null, namen });
    setNeueNamen('');
  }

  if (klassen.length === 0) {
    return (
      <>
        {kopf}
        <LeerHinweis
          titel="Noch keine Klasse angelegt"
          text="Ein Schüler gehört zu einer Klasse. Zuerst nebenan eine Klasse anlegen."
          aktion={
            <button
              type="button"
              className="schalter haupt"
              onClick={() => setUi({ stammseite: 'klassen' })}
            >
              Zu den Klassen
            </button>
          }
        />
      </>
    );
  }

  return (
    <>
      {kopf}

      <Karte
        titel="Schüler anlegen"
        hinweis="mehrere auf einmal – durch Komma, Semikolon oder Zeilenumbruch getrennt"
      >
        <div className="zeile">
          <label className="feld" style={{ flex: 1, minWidth: 260 }}>
            <span>Namen</span>
            <Textfeld
              mehrzeilig
              wert={neueNamen}
              beschriftung="Neue Schülerinnen und Schüler"
              platzhalter="Berger Lena, Steiner Jonas"
              onAendern={setNeueNamen}
            />
          </label>
          <label className="feld">
            <span>Klasse</span>
            <select
              aria-label="Klasse für neue Schüler"
              value={neueKlasse || (ui.klasseId ?? klassen[0]?.id ?? '')}
              onChange={(e) => setNeueKlasse(e.target.value)}
            >
              {klassen.map((klasse) => (
                <option key={klasse.id} value={klasse.id}>
                  {klasse.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="schalter haupt" onClick={anlegen}>
            Hinzufügen
          </button>
        </div>
      </Karte>

      <Karte
        titel="Schülerinnen und Schüler"
        hinweis={`${personen.length} Einträge · ${ohneKennung} ohne GitHub-Kennung`}
        rechts={
          <GeloeschteSchalter
            anzahl={geloeschte.length}
            offen={zeigeGeloeschte}
            onUmschalten={setZeigeGeloeschte}
          />
        }
      >
        {personen.length === 0 && !(zeigeGeloeschte && geloeschte.length > 0) ? (
          <p className="hinweis">Noch niemand angelegt.</p>
        ) : (
          <>
            <div className="zeile">
              <Textfeld
                wert={filter}
                beschriftung="Liste durchsuchen"
                platzhalter="Klasse, Name, Kennung oder Adresse"
                onAendern={setFilter}
              />
              {gesucht !== '' ? (
                <span className="anmerkung">
                  {liste.length} von {personen.length}
                </span>
              ) : null}
            </div>

            <div className="tabellenrahmen">
              <table>
                <thead>
                  <tr>
                    <th>Klasse</th>
                    <th>Name</th>
                    <th>GitHub-Kennung</th>
                    <th>Schul-E-Mail</th>
                    <th>in Projekten</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {liste.map((person) => {
                    const kollision = kennungDoppelt(daten, person.id, person.githubKennung ?? '');
                    const projekte = projekteVon(daten, person.id).map(
                      (id) => daten.teams.find((t) => t.id === id)?.name ?? id,
                    );
                    return (
                      <tr key={person.id}>
                        <td>
                          <select
                            aria-label={`Klasse von ${person.name}`}
                            value={person.klasseId}
                            onChange={(e) =>
                              dispatch({
                                art: 'person/klasse',
                                id: person.id,
                                klasseId: e.target.value,
                              })
                            }
                          >
                            {klassen.map((klasse) => (
                              <option key={klasse.id} value={klasse.id}>
                                {klasse.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <Textfeld
                            wert={person.name}
                            beschriftung={`Name von ${person.name}`}
                            onAendern={(name) =>
                              dispatch({ art: 'person/umbenennen', id: person.id, name })
                            }
                          />
                        </td>
                        <td>
                          <Textfeld
                            wert={person.githubKennung ?? ''}
                            beschriftung={`GitHub-Kennung von ${person.name}`}
                            platzhalter="kennung"
                            onAendern={(wert) =>
                              dispatch({
                                art: 'person/stammdaten',
                                id: person.id,
                                githubKennung: wert,
                              })
                            }
                          />
                          {kollision ? (
                            <div className="warnhinweis">
                              Dieselbe Kennung hat auch <b>{kollision.name}</b>. Zwei Personen mit einer
                              Kennung machen jede Beitragsverteilung falsch – und zwar unbemerkt.
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <Textfeld
                            wert={person.schulEmail ?? ''}
                            beschriftung={`Schul-E-Mail von ${person.name}`}
                            platzhalter="vorname.nachname@schule.at"
                            onAendern={(wert) =>
                              dispatch({ art: 'person/stammdaten', id: person.id, schulEmail: wert })
                            }
                          />
                        </td>
                        <td className="anmerkung">
                          {projekte.length === 0 ? 'keinem zugeordnet' : projekte.join(', ')}
                        </td>
                        <td>
                          <BestaetigenSchalter
                            beschriftung="löschen"
                            frage={
                              projekte.length === 0
                                ? 'wirklich löschen?'
                                : `obwohl in ${projekte.join(', ')}?`
                            }
                            onBestaetigt={() =>
                              dispatch({ art: 'person/loeschen', id: person.id })
                            }
                          />
                          <div className="anmerkung">
                            {loeschhinweis(daten, 'person', person.id)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {zeigeGeloeschte
                    ? geloeschte.map((person) => (
                        <tr key={person.id} className="geloescht">
                          <td>{klasseVon(person.klasseId)}</td>
                          <td>{person.name}</td>
                          <td className="mono">{person.githubKennung || '–'}</td>
                          <td className="mono">{person.schulEmail || '–'}</td>
                          <td className="anmerkung">
                            {projekteVon(daten, person.id)
                              .map((id) => daten.teams.find((t) => t.id === id)?.name ?? id)
                              .join(', ') || 'keinem zugeordnet'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="schalter schlicht klein"
                              onClick={() =>
                                dispatch({
                                  art: 'stammdaten/wiederherstellen',
                                  was: 'person',
                                  id: person.id,
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

            <p className="hinweis" style={{ marginTop: 14 }}>
              Die Kennung liegt an der <b>Person</b> und nicht am Projekt: Sie gehört einem
              Menschen, nicht einer Gruppe (FA-88 AK-3). Ob die Schul-E-Mail mit dem GitHub-Konto
              verknüpft ist, kann die Anwendung <b>nicht feststellen</b> – sie ruft nichts ab, und
              GitHub verbirgt Adressen standardmäßig. Das Skript kann abgleichen, ob eine passende
              Adresse in den Commits vorkommt; das ist ein Hinweis und kein Nachweis (AK-5).
            </p>

            <p className="hinweis">
              <b>Gelöscht wird auf zwei Arten</b> (FA-94): Wer noch nichts erbracht hat, wird
              endgültig entfernt – ein Tippfehler beim Anlegen soll nicht ewig mitlaufen. Sobald
              Punkte, ein Peer-Urteil oder ein Notenstand an einem Schüler hängen, bleibt der
              Eintrag stehen und wird nur ausgeblendet; sonst wäre die Note nicht mehr
              rekonstruierbar (Fachkonzept G7). Was im Einzelfall geschieht, steht neben dem
              Schalter.
            </p>
          </>
        )}
      </Karte>
    </>
  );
}
