/**
 * Geplante und umgesetzte Anforderungen eines Sprints (FA-96).
 *
 * **Warum nebeneinander.** Einzeln sind beide Texte belanglos: Eine Liste
 * dessen, was man sich vorgenommen hat, sagt nichts über den Sprint, und eine
 * Liste dessen, was fertig wurde, sagt nichts darüber, ob es das war, was
 * vereinbart war. Erst der Vergleich trägt die Aussage – und der ist nur
 * möglich, wenn beides in einem Blick steht.
 *
 * **Warum das keine Bewertung ist.** Bewertet wird nach den Kriterien der
 * Planung (FA-65); dieser Text geht in keine Rechnung ein (G9). Dass eine
 * Anforderung offen blieb, ist eine **Feststellung**. Ob sie zu Recht offen
 * blieb – Aufwand falsch geschätzt, Auftraggeber hat umpriorisiert, Team hat
 * getrödelt –, entscheidet die Lehrkraft und schreibt es in die Sprintnotiz
 * (FA-16). Eine Software, die Zeilen zählt und daraus eine Note ableitet,
 * würde genau diese Unterscheidung verlieren.
 *
 * **Vorerst Freitext** (Festlegung des Auftraggebers vom 14.09.2026): eine
 * Zeile je Anforderung, ohne Kennung und ohne Status. Welche Struktur es
 * braucht, entscheidet sich, wenn erkennbar ist, wie damit gearbeitet wird
 * (OP-F38).
 */

import { planungVon } from '../domain/zuordnung';
import type { Abschnitt, Datenbestand, Team } from '../domain/types';
import type { Aktion } from '../store/storeReducer';
import { Karte, Textfeld } from '../ui/bausteine';

export function AnforderungenKarte({
  daten,
  dispatch,
  abschnitt,
  team,
}: {
  daten: Datenbestand;
  dispatch: (aktion: Aktion) => void;
  abschnitt: Abschnitt;
  team: Team;
}) {
  const planung = planungVon(daten, abschnitt.id, team.id);
  if (!planung) return null;

  const geplant = (planung.geplanteAnforderungen ?? '').trim();
  const zeilen = (text: string) => text.split('\n').filter((z) => z.trim() !== '').length;

  return (
    <Karte
      titel="Anforderungen"
      hinweis={
        geplant === ''
          ? 'im Planning nichts festgehalten'
          : `${zeilen(geplant)} geplant · ${zeilen(planung.umgesetzteAnforderungen ?? '')} umgesetzt`
      }
    >
      <div className="gegenueber">
        <div>
          <h4>Geplant</h4>
          {geplant === '' ? (
            <p className="hinweis">
              Im Sprintplanning wurde nichts eingetragen. Nachtragen lässt es sich dort – der Text
              gehört zum Plan und nicht zum Ergebnis, auch wenn er später entsteht.
            </p>
          ) : (
            <p className="vorlage">{geplant}</p>
          )}
        </div>

        <div>
          <h4>Umgesetzt</h4>
          <Textfeld
            mehrzeilig
            wert={planung.umgesetzteAnforderungen ?? ''}
            beschriftung={`Umgesetzte Anforderungen von ${team.name}`}
            platzhalter={'eine Zeile je Anforderung\nwas offen blieb, gehört auch hierher'}
            breit
            onAendern={(umgesetzteAnforderungen) =>
              dispatch({
                art: 'planung/aendern',
                abschnittId: abschnitt.id,
                teamId: team.id,
                aenderung: { umgesetzteAnforderungen },
              })
            }
          />
        </div>
      </div>

      <p className="hinweis" style={{ marginTop: 12 }}>
        Der Vergleich ist eine <b>Feststellung, keine Bewertung</b>. Punkte entstehen aus den
        Kriterien dieser Planung (FA-65) – nicht daraus, wie viele Zeilen hier stehen. Warum etwas
        offen blieb, gehört in die Sprintnotiz: Eine umpriorisierte Anforderung ist etwas anderes
        als eine liegengebliebene.
      </p>
    </Karte>
  );
}
