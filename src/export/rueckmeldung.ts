/**
 * Rückmeldung an eine Person nach einem Abschnitt (FA-42).
 *
 * Das Gegenstück zur Belegfassung (FA-32): Die Belegfassung erklärt lückenlos,
 * wie ein Stand zustande kommt, und bleibt bei der Lehrkraft. Diese Rückmeldung
 * beantwortet drei Fragen – wo stehe ich, was ist gut, woran arbeite ich – und
 * geht an die Schülerin oder den Schüler.
 *
 * **Was hier bewusst fehlt** (Fachkonzept G10, AK-2, AK-3): keine
 * Punktetabelle, keine Kategorien, keine Herleitung, keine Note und kein
 * Notenvorschlag. Höchstens ein Prozentwert als grobe Einordnung. Wer die
 * vollständige Herleitung weitergibt, verschiebt das Gespräch von der Arbeit
 * auf die Zahl.
 *
 * Eine Datei je Person: So enthält jedes Blatt nur die Daten einer einzigen
 * Person und kann ohne weitere Prüfung weitergegeben werden.
 */

import { maskiert } from './rubrikblatt';

export interface RueckmeldungEingabe {
  personenname: string;
  abschnittsname: string;
  /** Grobe Einordnung in Prozent; `null` lässt die Zeile weg (AK-2). */
  stand: number | null;
  staerken: string;
  entwicklung: string;
  zeitraum?: string;
  stand_datum?: Date;
}

function absaetze(text: string): string {
  const zeilen = text
    .split(/\r?\n/)
    .map((z) => z.trim())
    .filter(Boolean);
  if (zeilen.length === 0) return '<p class="offen">– noch nichts festgehalten –</p>';
  return zeilen.map((z) => `<li>${maskiert(z)}</li>`).join('\n        ');
}

function datumDeutsch(datum: Date): string {
  const zahl = (wert: number) => String(wert).padStart(2, '0');
  return `${zahl(datum.getDate())}.${zahl(datum.getMonth() + 1)}.${datum.getFullYear()}`;
}

/** Einordnung in Worten statt in einer Ziffer – die Note bleibt außen vor (AK-3). */
export function einordnung(stand: number | null): string {
  if (stand === null) return 'Für diesen Abschnitt liegt noch keine Einordnung vor.';
  const gerundet = Math.round(stand);
  return `Dein Stand in diesem Abschnitt liegt bei rund ${gerundet} %.`;
}

export function rueckmeldungHtml(eingabe: RueckmeldungEingabe): string {
  const { personenname, abschnittsname, stand, staerken, entwicklung, zeitraum } = eingabe;
  const datum = eingabe.stand_datum ?? new Date();

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Rückmeldung – ${maskiert(abschnittsname)}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0 auto; padding: 32px 24px; max-width: 38em;
         font: 15px/1.6 "Segoe UI", system-ui, sans-serif; color: #1a1a1a; background: #fff; }
  h1 { font-size: 1.35rem; margin: 0 0 2px; }
  h2 { font-size: 1rem; margin: 26px 0 6px; }
  p.kopf { margin: 0 0 22px; color: #555; font-size: 0.88rem; }
  p.stand { font-size: 1.05rem; margin: 0 0 4px; }
  ul { margin: 0; padding-left: 1.2em; }
  li { margin-bottom: 4px; }
  p.offen { color: #777; font-style: italic; margin: 0; }
  footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #ddd;
           color: #555; font-size: 0.85rem; }
  @media print { body { padding: 0; max-width: none; } }
</style>
</head>
<body>
  <h1>Rückmeldung zu ${maskiert(abschnittsname)}</h1>
  <p class="kopf">${maskiert(personenname)}${zeitraum ? ` · ${maskiert(zeitraum)}` : ''} · ${datumDeutsch(datum)}</p>

  <h2>Wo du stehst</h2>
  <p class="stand">${maskiert(einordnung(stand))}</p>

  <h2>Das ist dir gelungen</h2>
  <ul>
        ${absaetze(staerken)}
  </ul>

  <h2>Daran arbeitest du im nächsten Abschnitt</h2>
  <ul>
        ${absaetze(entwicklung)}
  </ul>

  <footer>
    Diese Rückmeldung ist keine Note. Sie soll dir zeigen, woran du im nächsten Abschnitt
    ansetzen kannst – und sie ist besprechbar: Wenn du etwas anders siehst, sag es.
  </footer>
</body>
</html>
`;
}

/** Dateiname der Rückmeldung. */
export function rueckmeldungDateiname(
  personenname: string,
  abschnittsname: string,
  datum = new Date(),
): string {
  const sauber = (text: string, ersatz: string) =>
    text.trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '') || ersatz;
  return `rueckmeldung-${sauber(personenname, 'Person')}-${sauber(abschnittsname, 'Abschnitt')}-${datum.toISOString().slice(0, 10)}.html`;
}
