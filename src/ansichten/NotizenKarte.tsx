/**
 * Notizen je Person (FA-17).
 *
 * Aufzeichnung der Lehrkraft für Gespräch und Begründung. Sie geht **nicht**
 * an die Person – das tut die Rückmeldung (FA-42). Eigene Datei, weil sie
 * sowohl im Sprint als auch beim Test gebraucht wird.
 */

import type { Bewertung, Person } from '../domain/types';
import { Karte, Textfeld } from '../ui/bausteine';

export function NotizenKarte({
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

