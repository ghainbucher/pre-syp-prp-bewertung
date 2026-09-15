/**
 * Rückmeldung an das Team als Text für den Kanal (FA-83).
 *
 * **Text, nicht Versand.** Hier entsteht nur eine Zeichenkette; wohin sie
 * gelangt, entscheidet die Lehrkraft, indem sie sie einfügt (AK-6). Die
 * Anwendung spricht mit keinem Dienst (ADR-001, NFA-03, DS-02).
 *
 * Jeder Baustein ist einzeln zuschaltbar (AK-2) – das war die Festlegung des
 * Auftraggebers: „Das muss ich bestimmen können. Ein Vorschlag wäre trotzdem
 * gut.“ Also: Vorgabe an, jederzeit ab.
 *
 * Was hier **nicht** entsteht, ist ein Baustein mit der Rückmeldung je Person
 * (AK-4, OP-F29): Eine Leistungsbeurteilung gehört der Person und den
 * Erziehungsberechtigten, nicht den Mitschülern. Das Feld in der Oberfläche
 * ist frei – wer es hineinschreibt, entscheidet das bewusst. Ein Knopf dafür
 * machte aus der Entscheidung eine Gewohnheit.
 */

import { datumDeutsch, formatProzent } from '../domain/scoring';
import type { Abschnitt, Bewertung, Person, Teamabschnitt } from '../domain/types';

/** Welche Bausteine im Text stehen (FA-83 AK-2). */
export interface Bausteine {
  ziel: boolean;
  gelungen: boolean;
  beitraege: boolean;
  massnahmen: boolean;
  sprintwert: boolean;
}

/** Vorgabe: alles an. Abschalten ist ein Handgriff, Zuschalten ein Suchen. */
export const BAUSTEINE_VORGABE: Bausteine = {
  ziel: true,
  gelungen: true,
  beitraege: true,
  massnahmen: true,
  sprintwert: true,
};

export const BAUSTEIN_BEZEICHNUNG: Record<keyof Bausteine, string> = {
  ziel: 'Ziel und Zeitraum',
  gelungen: 'Was gelungen ist',
  beitraege: 'Woran die Einzelnen gearbeitet haben',
  massnahmen: 'Maßnahmen für den nächsten Sprint',
  sprintwert: 'Sprintwert',
};

export interface Teamtexteingabe {
  abschnitt: Abschnitt;
  teamname: string;
  planung: Teamabschnitt | undefined;
  bewertung: Bewertung | undefined;
  mitglieder: Person[];
  bausteine: Bausteine;
}

/** Zeitraum in einem Satzteil, leer wenn nichts eingetragen ist. */
function zeitraum(planung: Teamabschnitt | undefined, abschnitt: Abschnitt): string {
  const von = planung?.von?.trim() || abschnitt.von;
  const bis = planung?.bis?.trim() || abschnitt.bis;
  return [von, bis].filter(Boolean).map(datumDeutsch).join(' bis ');
}

/**
 * Der Textvorschlag (FA-83 AK-1).
 *
 * Bewusst schlichter Text und kein Markdown-Kunstwerk: Er wird in ein
 * Nachrichtenfeld eingefügt, das Formatierungen unterschiedlich behandelt.
 * Lesbar bleibt er in jedem Fall.
 */
export function teamrueckmeldungText(eingabe: Teamtexteingabe): string {
  const { abschnitt, teamname, planung, bewertung, mitglieder, bausteine } = eingabe;
  const zeilen: string[] = [];

  const spanne = zeitraum(planung, abschnitt);
  zeilen.push(`${abschnitt.name} · ${teamname}${spanne ? ` · ${spanne}` : ''}`);

  if (bausteine.ziel && planung?.ziel.trim()) {
    zeilen.push(`Ziel: ${planung.ziel.trim()}`);
  }

  // AK-2: Der Sprintwert erscheint nur, wenn er gesetzt ist (FA-82 AK-6) –
  // nie der gerechnete Wert, den das Team nicht kennt.
  const sprintwert = bewertung?.gesetzt?.sprintwert;
  if (bausteine.sprintwert && sprintwert) {
    const begruendung = sprintwert.begruendung.trim();
    zeilen.push(
      `Sprintwert: ${formatProzent(sprintwert.prozent)} %${begruendung ? ` – ${begruendung}` : ''}`,
    );
  }

  if (bausteine.gelungen && bewertung?.notiz.trim()) {
    zeilen.push(`Was gelungen ist: ${bewertung.notiz.trim()}`);
  }

  // AK-3: Namen und Tätigkeit, **keine Bewertung**. Die Spur ist eine Tatsache
  // über die Arbeit; ein Prozentwert je Person wäre eine Beurteilung und
  // verriete im Kanal, wo jemand steht.
  if (bausteine.beitraege) {
    const beitraege = mitglieder
      .map((person) => {
        const spur = bewertung?.individuell?.[person.id]?.spur;
        const text = spur?.bezeichnung.trim();
        return text ? `${person.name} an ${text}` : null;
      })
      .filter((z): z is string => z !== null);
    if (beitraege.length > 0) {
      zeilen.push(`Woran gearbeitet wurde: ${beitraege.join(', ')}`);
    }
  }

  if (bausteine.massnahmen) {
    const massnahmen = (planung?.massnahmen ?? []).map((m) => m.text.trim()).filter(Boolean);
    if (massnahmen.length > 0) {
      zeilen.push(`Vorgenommen für den nächsten Sprint: ${massnahmen.join(' · ')}`);
    }
  }

  return `${zeilen.join('\n')}\n`;
}

/**
 * Die Rückmeldung **je Person** als Text (FA-83 AK-7).
 *
 * Für ein Einzelgespräch oder einen Einzelchat. Sie enthält weder Note noch
 * Notenvorschlag und keine Punktetabelle (FA-42 AK-2, AK-3) – und sie gehört
 * nicht in den Teamkanal.
 */
export function personenrueckmeldungText(eingabe: {
  abschnitt: Abschnitt;
  person: Person;
  planung: Teamabschnitt | undefined;
  bewertung: Bewertung | undefined;
  /** Stand in Prozent, falls er genannt werden soll (FA-42 AK-2). */
  stand: number | null;
}): string {
  const { abschnitt, person, planung, bewertung, stand } = eingabe;
  const rueckmeldung = bewertung?.individuell?.[person.id]?.rueckmeldung;
  const zeilen: string[] = [`${abschnitt.name} · ${person.name}`];

  if (planung?.ziel.trim()) zeilen.push(`Ziel des Teams: ${planung.ziel.trim()}`);
  if (stand !== null) zeilen.push(`Stand: ${formatProzent(stand)} %`);
  if (rueckmeldung?.staerken.trim()) zeilen.push(`Stärken: ${rueckmeldung.staerken.trim()}`);
  if (rueckmeldung?.entwicklung.trim()) {
    zeilen.push(`Woran du arbeiten kannst: ${rueckmeldung.entwicklung.trim()}`);
  }

  return `${zeilen.join('\n')}\n`;
}
