/**
 * Belegfassung je Person (FA-32).
 *
 * Die vollständige Herleitung eines Stands: je Abschnitt die Rubrik, das Team,
 * die Kategorien mit Kriterien, Punkten und Prozentwerten, gesetzte Werte samt
 * gerechnetem Vergleichswert und Begründung, am Ende Notenvorschlag und
 * eingetragener Notenstand.
 *
 * Sie ist **nicht** die Rückmeldung an die Person (FA-42): Diese Fassung
 * belegt im Anlassfall gegenüber Eltern, Schulleitung oder Behörde, wie ein
 * Stand zustande gekommen ist. Deshalb steht hier alles drin – und deshalb
 * geht sie nicht ohne Anlass hinaus.
 *
 * Ohne interne Bezeichner (AK-5): Wer die Herleitung lesen muss, kennt keine
 * Kriterien-IDs.
 */

import { formatProzent, notenvorschlag, notenstandWeichtAb } from '../domain/scoring';
import { planungVon, rubrikFuer, teamIn } from '../domain/zuordnung';
import type {
  Datenbestand,
  Gesamtergebnis,
  Kategorieergebnis,
  KategorieSchluessel,
  Person,
} from '../domain/types';
import { VERSTEHENS_BEZEICHNUNG } from '../domain/defaults';
import { maskiert } from './rubrikblatt';

/** Nur die drei gewichteten Kategorien – Peer wirkt seit FA-45 als Korrektur. */
type Punktekategorie = Extract<KategorieSchluessel, 'team' | 'prozess' | 'individuell'>;

const KATEGORIEN: Array<{ schluessel: Punktekategorie; titel: string }> = [
  { schluessel: 'team', titel: 'Team-Ergebnis' },
  { schluessel: 'prozess', titel: 'Scrum-Prozess' },
  { schluessel: 'individuell', titel: 'Individueller Beitrag' },
];

export interface BelegfassungEingabe {
  daten: Datenbestand;
  person: Person;
  ergebnis: Gesamtergebnis;
  /** Name des Stichtags, sofern die Auswertung auf einen eingeschränkt ist. */
  stichtagsname?: string;
  stand?: Date;
}

function datumDeutsch(datum: Date): string {
  const zahl = (wert: number) => String(wert).padStart(2, '0');
  return `${zahl(datum.getDate())}.${zahl(datum.getMonth() + 1)}.${datum.getFullYear()}`;
}

function prozentOderLeer(wert: number | null): string {
  // AK-2: „nicht bewertet“ – ausdrücklich nicht 0.
  return wert === null ? '<span class="leer">nicht bewertet</span>' : `${formatProzent(wert, 1)} %`;
}

/** Eine Kategorie mit ihren Kriterien und dem, was erfasst wurde. */
function kategorieBlock(
  titel: string,
  gewicht: number,
  kriterien: Array<{ name: string; beschreibung: string; max: number }>,
  punkte: Record<string, number> | undefined,
  ergebnis: Kategorieergebnis | null,
): string {
  if (kriterien.length === 0) return '';

  const zeilen = kriterien
    .map((kriterium) => {
      const wert = punkte?.[kriterium.name];
      return `          <tr>
            <th scope="row">${maskiert(kriterium.name)}</th>
            <td>${maskiert(kriterium.beschreibung)}</td>
            <td class="zahl">${wert === undefined ? '<span class="leer">–</span>' : wert}</td>
            <td class="zahl">${kriterium.max}</td>
          </tr>`;
    })
    .join('\n');

  const gesetzt = ergebnis?.gesetzt;
  const gesetztZeile = gesetzt
    ? `        <p class="gesetzt">Gesetzter Wert: <b>${formatProzent(gesetzt.prozent, 1)} %</b> ·
           gerechnet ${prozentOderLeer(ergebnis?.prozentBerechnet ?? null)}${
             gesetzt.begruendung ? ` · Begründung: ${maskiert(gesetzt.begruendung)}` : ''
           } · gesetzt am ${datumDeutsch(new Date(gesetzt.gesetztAm))}</p>`
    : '';

  return `      <section class="kategorie">
        <h4>${maskiert(titel)} <span class="gewicht">Gewicht ${gewicht} %</span>
          <span class="ergebnis">${prozentOderLeer(ergebnis?.prozent ?? null)}</span></h4>
        <table>
          <thead>
            <tr><th scope="col">Kriterium</th><th scope="col">Worauf geachtet wurde</th>
                <th scope="col">Punkte</th><th scope="col">von</th></tr>
          </thead>
          <tbody>
${zeilen}
          </tbody>
        </table>
${gesetztZeile}
      </section>`;
}

export function belegfassungHtml(eingabe: BelegfassungEingabe): string {
  const { daten, person, ergebnis, stichtagsname } = eingabe;
  const stand = eingabe.stand ?? new Date();
  const vorschlag = notenvorschlag(ergebnis, daten.notenschluessel, daten.sperreAktiv);

  const abschnitte = ergebnis.alle
    .map(({ abschnitt, ergebnis: e, zeitfaktor }) => {
      const teamId = abschnitt.art === 'test' ? null : teamIn(daten, abschnitt.id, person.id);
      const rubrik = rubrikFuer(daten, abschnitt, teamId);
      const planung = planungVon(daten, abschnitt.id, teamId);
      const teamname = daten.teams.find((t) => t.id === teamId)?.name ?? null;
      const bewertung = daten.bewertungen.find(
        (b) => b.abschnittId === abschnitt.id && b.teamId === teamId,
      );

      // AK-6: Rubrik und Team je Abschnitt. Nach dem Einfrieren gilt die Kopie –
      // seit Schemastand 3 die des Teams (FA-67 AK-5).
      const eingefroren = planung?.rubrikKopie ? planung : abschnitt.rubrikKopie ? abschnitt : null;
      const angeglichenAm = eingefroren?.angeglichenAm;
      const zeitraum =
        abschnitt.art === 'test'
          ? abschnitt.bis
          : (planung?.bis?.trim() ?? '') || abschnitt.bis;
      const kopfzeilen = [
        `Rubrik „${rubrik.name}“${
          eingefroren
            ? angeglichenAm
              ? ` (festgehalten, am ${datumDeutsch(new Date(angeglichenAm))} an die geänderte Rubrik angeglichen)`
              : ' (beim ersten Eintrag festgehalten)'
            : ''
        }`,
        abschnitt.art === 'test' ? 'Test – ohne Team' : teamname ? `Team ${teamname}` : 'ohne Team',
        // FA-66 AK-5: Das Ziel ist der Gegenstand der Bewertung. Ohne es steht
        // in der Aufzeichnung ein Prozentwert ohne Bezug.
        planung?.ziel?.trim() ? `Ziel: ${planung.ziel.trim()}` : null,
        zeitraum ? `bis ${datumDeutsch(new Date(`${zeitraum}T00:00:00`))}` : null,
        `Gewicht ${abschnitt.faktor} × Zeitfaktor ${zeitfaktor}`,
      ].filter((z): z is string => z !== null);

      const bloecke = KATEGORIEN.map((k) => {
        const punkte =
          k.schluessel === 'individuell'
            ? bewertung?.individuell?.[person.id]?.punkte
            : bewertung?.[k.schluessel];
        // Punkte hängen an Kriterien-IDs; die Belegfassung kennt nur Namen.
        const nachName: Record<string, number> = {};
        for (const kriterium of rubrik[k.schluessel]) {
          const wert = punkte?.[kriterium.id];
          if (wert !== undefined) nachName[kriterium.name] = wert;
        }
        return kategorieBlock(
          k.titel,
          rubrik.gewichte[k.schluessel] ?? 0,
          rubrik[k.schluessel],
          nachName,
          e[k.schluessel],
        );
      })
        .filter(Boolean)
        .join('\n');

      // FA-40 AK-4, FA-41 AK-4: Beide gehören in die Belegfassung – der
      // Nachweis, weil er in die Rechnung eingeht; die Reflexion, weil im
      // Anlassfall belegbar sein muss, dass die Sicht der Person erhoben wurde.
      const eintrag = bewertung?.individuell?.[person.id];
      const verstehenZeile = eintrag?.verstehen
        ? `      <p class="verstehen">Verstehensnachweis im Review:
         <b>${maskiert(VERSTEHENS_BEZEICHNUNG[eintrag.verstehen.stufe])}</b> –
         Anteil am individuellen Beitrag ${daten.verstehensAnteil} %${
           eintrag.verstehen.notiz ? ` · ${maskiert(eintrag.verstehen.notiz)}` : ''
         }</p>`
        : '';

      const reflexionZeile = eintrag?.reflexion
        ? `      <p class="reflexion">Sicht der Person: ${maskiert(eintrag.reflexion)}</p>`
        : '';

      // FA-78 AK-7: Die Spur ist der Teil der Aufzeichnung, der ein Urteil
      // über den individuellen Beitrag überprüfbar macht (§ 18 Abs. 1 SchUG).
      // Ausdrücklich als „kein Punktewert“ ausgewiesen, damit niemand sie für
      // eine Bewertungsgröße nimmt.
      const spurZeile = eintrag?.spur
        ? `      <p class="spur">Gezeigte Spur: ${maskiert(eintrag.spur.bezeichnung)}${
            eintrag.spur.verweis ? ` · ${maskiert(eintrag.spur.verweis)}` : ''
          } <span class="anmerkung">(Anker des Urteils, kein Punktewert)</span></p>`
        : '';

      const peerZeile =
        abschnitt.peerAktiv && e.peer
          ? `      <p class="peer">Peer-Einschätzung ${formatProzent(e.peer.prozent, 1)} % aus
         ${e.peer.bewertende} ${e.peer.bewertende === 1 ? 'Rückmeldung' : 'Rückmeldungen'} ·
         Korrektur ${e.korrektur >= 0 ? '+' : '−'}${formatProzent(Math.abs(e.korrektur), 1)} Prozentpunkte
         (höchstens ± ${daten.peerDeckelung})</p>`
          : '';

      const gesetztZeile = e.gesetzt
        ? `      <p class="gesetzt">Ergebnis dieses Abschnitts <b>gesetzt</b> auf
           ${formatProzent(e.gesetzt.prozent, 1)} % · gerechnet
           ${prozentOderLeer(e.prozentBerechnet)}${
             e.gesetzt.begruendung ? ` · Begründung: ${maskiert(e.gesetzt.begruendung)}` : ''
           } · gesetzt am ${datumDeutsch(new Date(e.gesetzt.gesetztAm))}</p>`
        : '';

      // FA-80 AK-7: Die Maßnahmen sind eine Zusage des Teams, keine
      // Zuschreibung an eine Person – sie stehen deshalb ohne Namen und ohne
      // Wertung da, samt Umsetzungsstand aus dem Folgesprint.
      const massnahmen = planung?.massnahmen ?? [];
      const massnahmenZeile =
        massnahmen.length > 0
          ? `      <p class="massnahmen">Maßnahmen der Retrospektive: ${massnahmen
              .map((m) => maskiert(m.text))
              .join(' · ')}</p>`
          : '';

      // FA-82 AK-5: Der Sprintwert ist das, was das Team gehört hat. Ein Wert,
      // den das Team kennt und der in keiner Aufzeichnung steht, wäre im
      // Anlassfall nicht erklärbar. Ausdrücklich als „geht in keine Note ein“.
      const sprintwert = bewertung?.gesetzt?.sprintwert;
      const sprintwertZeile = sprintwert
        ? `      <p class="sprintwert">Sprintwert des Teams <b>${formatProzent(
            sprintwert.prozent,
            1,
          )} %</b>${
            sprintwert.begruendung ? ` · ${maskiert(sprintwert.begruendung)}` : ''
          } · gesetzt am ${datumDeutsch(new Date(sprintwert.gesetztAm))}
         <span class="anmerkung">(Aussage an das Team, geht in keine Note ein)</span></p>`
        : '';

      const schema =
        abschnitt.art === 'test'
          ? `      <p class="schema">Bewertungsschema der offenen Frage: ${maskiert(
              rubrik.individuell.find((k) => k.max >= 4)?.beschreibung ?? 'nicht hinterlegt',
            )}</p>`
          : '';

      return `    <section class="abschnitt">
      <h3>${maskiert(abschnitt.name)} <span class="ergebnis">${prozentOderLeer(e.prozent)}</span></h3>
      <p class="kopf">${maskiert(kopfzeilen.join(' · '))}</p>
${bloecke}
${spurZeile}
${verstehenZeile}
${reflexionZeile}
${peerZeile}
${sprintwertZeile}
${massnahmenZeile}
${schema}
${gesetztZeile}
    </section>`;
    })
    .join('\n');

  const gesamtGesetzt = ergebnis.gesetzt
    ? `    <p class="gesetzt">Gesamtstand <b>gesetzt</b> auf ${formatProzent(ergebnis.gesetzt.prozent, 1)} % ·
       gerechnet ${prozentOderLeer(ergebnis.prozentBerechnet)}${
         ergebnis.gesetzt.begruendung ? ` · Begründung: ${maskiert(ergebnis.gesetzt.begruendung)}` : ''
       }</p>`
    : '';

  const notenstand = ergebnis.notenstand;
  const abweichung = notenstandWeichtAb(notenstand, vorschlag);

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Belegfassung – ${maskiert(person.name)}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0 auto; padding: 32px 24px; max-width: 48em;
         font: 14px/1.5 "Segoe UI", system-ui, sans-serif; color: #1a1a1a; background: #fff; }
  h1 { font-size: 1.4rem; margin: 0 0 2px; }
  h3 { font-size: 1.05rem; margin: 0 0 2px; }
  h4 { font-size: 0.92rem; margin: 16px 0 4px; font-weight: 600; }
  section.abschnitt { margin-top: 26px; padding-top: 14px; border-top: 2px solid #999;
                      page-break-inside: avoid; }
  section.kategorie { margin-left: 4px; }
  p.kopf { margin: 0 0 8px; color: #555; font-size: 0.85rem; }
  p.peer, p.gesetzt, p.schema, p.verstehen, p.reflexion { margin: 8px 0 0; font-size: 0.85rem; color: #444;
                                background: #f4f2ec; padding: 6px 9px; border-radius: 4px; }
  span.gewicht { font-weight: 400; color: #666; font-size: 0.82rem; }
  span.ergebnis { float: right; font-variant-numeric: tabular-nums; }
  span.leer { color: #777; font-style: italic; }
  table { border-collapse: collapse; width: 100%; font-size: 0.88rem; margin-top: 4px; }
  th, td { border-bottom: 1px solid #e3e1d9; padding: 4px 7px; text-align: left;
           vertical-align: top; }
  thead th { border-bottom: 1px solid #999; font-size: 0.76rem; text-transform: uppercase;
             letter-spacing: 0.04em; color: #555; }
  th[scope="row"] { width: 26%; font-weight: 600; }
  td.zahl, thead th:nth-child(3), thead th:nth-child(4) { text-align: right; white-space: nowrap; }
  .abschluss { margin-top: 30px; padding: 14px 16px; border: 2px solid #1a1a1a; border-radius: 4px; }
  .abschluss dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; margin: 0; }
  .abschluss dt { font-weight: 600; }
  .abschluss dd { margin: 0; }
  footer { margin-top: 26px; padding-top: 12px; border-top: 1px solid #ddd;
           color: #555; font-size: 0.82rem; }
  @media print { body { padding: 0; max-width: none; } }
</style>
</head>
<body>
  <h1>Belegfassung – ${maskiert(person.name)}</h1>
  <p class="kopf">${
    stichtagsname ? `${maskiert(stichtagsname)} · ` : ''
  }erstellt am ${datumDeutsch(stand)}</p>

${abschnitte || '    <p class="leer">Für diese Person ist noch nichts erfasst.</p>'}

  <div class="abschluss">
    <dl>
      <dt>Praxis</dt><dd>${prozentOderLeer(ergebnis.praxis.prozent)}${
        daten.strangGewichte.praxis !== 100 ? ` (Gewicht ${daten.strangGewichte.praxis} %)` : ''
      }</dd>
      <dt>Theorie</dt><dd>${prozentOderLeer(ergebnis.theorie.prozent)}${
        daten.strangGewichte.theorie !== 100 ? ` (Gewicht ${daten.strangGewichte.theorie} %)` : ''
      }</dd>
      <dt>Gesamtstand</dt><dd>${prozentOderLeer(ergebnis.prozent)}</dd>
      <dt>Notenvorschlag</dt><dd>${
        vorschlag.note ?? '<span class="leer">kein Vorschlag – zu wenig erfasst</span>'
      }${
        vorschlag.gesperrtDurch
          ? ` – gesperrt durch den ${vorschlag.gesperrtDurch === 'praxis' ? 'Praxis' : 'Theorie'}strang nach § 14 LBVO; ohne diese Sperre ${vorschlag.ohneSperre ?? '–'}`
          : ''
      }</dd>
      <dt>Notenstand</dt><dd>${
        notenstand
          ? `${notenstand.note}${abweichung ? ' – weicht vom Vorschlag ab' : ''}${
              notenstand.begruendung ? ` · ${maskiert(notenstand.begruendung)}` : ''
            } · eingetragen am ${datumDeutsch(new Date(notenstand.gesetztAm))}`
          : '<span class="leer">noch nicht eingetragen</span>'
      }</dd>
    </dl>
${gesamtGesetzt}
  </div>

  <footer>
    Nicht bewertete Kategorien werden aus der Gewichtung herausgerechnet und nicht als 0
    gewertet. Prozentwerte sind Rechengrößen; die Note vergibt die Lehrkraft. Diese Fassung
    enthält personenbezogene Daten und ist wie eine Notenliste zu behandeln.
  </footer>
</body>
</html>
`;
}

/** Dateiname der Belegfassung. */
export function belegfassungDateiname(personenname: string, datum = new Date()): string {
  const sauber =
    personenname.trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '') || 'Person';
  return `belegfassung-${sauber}-${datum.toISOString().slice(0, 10)}.html`;
}
