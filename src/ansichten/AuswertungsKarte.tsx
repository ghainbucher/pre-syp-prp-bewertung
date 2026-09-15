/**
 * Kennzahlen zur Zusammenarbeit einlesen und lesen (FA-81).
 *
 * **Die Anwendung ruft nichts ab.** Die Zahlen entstehen außerhalb, durch
 * `scripts/github-auswertung.mjs`, und werden hier als Datei eingelesen
 * (AK-1). Damit bleiben ADR-001, NFA-03 und DS-02 unverändert gültig: kein
 * Netzwerkaufruf, kein Zugriffstoken im Browser.
 *
 * Was hier steht, sind Verteilungen auf Teamebene – nie eine Leistungszahl je
 * Person (AK-2). Der Vorschlag für die Versionsverwaltung deckt nur den
 * mechanisch beobachtbaren Teil des Kriteriums und überschreibt nichts
 * (AK-5, AK-6).
 */

import { useRef, useState } from 'react';

import { datumDeutsch, formatProzent, versionsverwaltungVorschlag } from '../domain/scoring';
import { auswertungGelesen, zeitsatz } from '../domain/repoauswertung';
import { planungVon } from '../domain/zuordnung';
import type {
  Abschnitt,
  Datenbestand,
  Kriterium,
  Punkte,
  Team,
} from '../domain/types';
import type { Aktion } from '../store/storeReducer';

import { Karte } from '../ui/bausteine';

export function AuswertungsKarte({
  daten,
  dispatch,
  abschnitt,
  team,
  kriterium,
  punkte,
}: {
  daten: Datenbestand;
  dispatch: (aktion: Aktion) => void;
  abschnitt: Abschnitt;
  team: Team;
  /** Das Kriterium „Versionsverwaltung“ der geltenden Rubrik, falls vorhanden. */
  kriterium: Kriterium | undefined;
  /** Bereits erfasste Team-Punkte – ein vorhandener Wert wird nicht angetastet. */
  punkte: Punkte | undefined;
}) {
  const [meldung, setMeldung] = useState<string | null>(null);
  const feld = useRef<HTMLInputElement>(null);
  const planung = planungVon(daten, abschnitt.id, team.id);
  const auswertung = planung?.auswertung;
  const vorschlag = versionsverwaltungVorschlag(auswertung, kriterium?.max ?? 0);
  const erfasst = kriterium ? punkte?.[kriterium.id] : undefined;

  async function einlesen(datei: File) {
    try {
      const roh = JSON.parse(await datei.text()) as unknown;
      const auswertung = auswertungGelesen(roh);
      if (!auswertung) {
        setMeldung('Die Datei enthält keine Auswertung – erwartet wird die Ausgabe des Skripts.');
        return;
      }
      dispatch({
        art: 'planung/auswertungEinlesen',
        abschnittId: abschnitt.id,
        teamId: team.id,
        auswertung,
      });
      setMeldung(null);
    } catch {
      setMeldung('Die Datei ist kein lesbares JSON.');
    }
  }

  return (
    <Karte
      titel="Zusammenarbeit im Repository"
      hinweis={
        auswertung
          ? `Stand ${datumDeutsch(auswertung.standAm.slice(0, 10))}`
          : 'noch nichts eingelesen'
      }
      rechts={
        <>
          <input
            ref={feld}
            type="file"
            accept="application/json,.json"
            aria-label={`Auswertung für ${team.name} einlesen`}
            style={{ display: 'none' }}
            onChange={(e) => {
              const datei = e.target.files?.[0];
              if (datei) void einlesen(datei);
              e.target.value = '';
            }}
          />
          <button type="button" className="schalter" onClick={() => feld.current?.click()}>
            Auswertung einlesen
          </button>
        </>
      }
    >
      {meldung ? (
        <p className="warnung" role="status">
          {meldung}
        </p>
      ) : null}

      {!auswertung ? (
        <p className="hinweis">
          Die Zahlen entstehen außerhalb der Anwendung. Dieser Aufruf schreibt die Datei, die hier
          eingelesen wird:
          <br />
          <code>
            npm run github -- --repo {team.repository || 'eigentuemer/name'} --von{' '}
            {planung?.von || 'JJJJ-MM-TT'} --bis {planung?.bis || 'JJJJ-MM-TT'}
          </code>
          <br />
          Die Anwendung ruft nichts ab und braucht kein Zugriffstoken. Ohne Auswertung bleibt alles
          wie bisher – sie ist eine Erleichterung, keine Voraussetzung.
          {team.repository ? null : ' Das Repository steht unter „Stammdaten · Projekte“.'}
        </p>
      ) : (
        <>
          <p className="hinweis">
            Zeitraum {auswertung.von ? datumDeutsch(auswertung.von) : '–'} bis{' '}
            {auswertung.bis ? datumDeutsch(auswertung.bis) : '–'}. Die Zahlen sind ein Stand und
            werden nicht nachgeführt; ein erneutes Einlesen ersetzt ihn.
          </p>

          <h4>Verteilung der Beiträge</h4>
          <div className="uebersicht">
            {Object.entries(auswertung.anteile)
              .sort((a, b) => b[1] - a[1])
              .map(([kennung, anteil]) => {
                // Ab Schemastand 4 steht die Kennung an der Person (FA-88 AK-3).
                const person = daten.personen.find(
                  (p) => (p.githubKennung ?? '').toLowerCase() === kennung.toLowerCase(),
                );
                return (
                  <div className="uebersichtszeile" key={kennung}>
                    <div className="bezeichnung">
                      <b>{person?.name ?? kennung}</b>
                      <span>
                        {person ? kennung : 'Kennung keiner Person zugeordnet – unter Stammdaten · Schüler'}
                      </span>
                    </div>
                    <span className="zahl">{formatProzent(anteil)} %</span>
                  </div>
                );
              })}
          </div>

          <h4>Zusammenarbeit</h4>
          <p className="hinweis">
            {formatProzent(auswertung.prAnteil)} % der Änderungen liefen über Pull Requests mit
            Review, {auswertung.direktePushes}{' '}
            {auswertung.direktePushes === 1 ? 'Änderung' : 'Änderungen'} direkt auf den
            Hauptzweig. Reviews gegeben:{' '}
            {auswertung.reviews.length === 0
              ? 'keine'
              : auswertung.reviews
                  .map((kante) => `${kante.von} → ${kante.an} (${kante.anzahl})`)
                  .join(' · ')}
            . Beiträge {zeitsatz(auswertung) ?? 'ohne Datum'}.
          </p>

          {auswertung.nichtZugeordnet.length > 0 ? (
            <p className="warnung" role="status">
              Ohne Person: {auswertung.nichtZugeordnet.join(', ')}. Solange eine Kennung niemandem
              gehört, zählt sie in keiner Verteilung mit – die Kennung steht am Schüler, unter
              „Stammdaten · Schüler“.
            </p>
          ) : null}

          {/* AK-5, AK-6: Vorschlag, nicht Eintrag. Er deckt den mechanischen
              Teil und überschreibt nichts. */}
          {vorschlag && kriterium ? (
            <>
              <h4>Vorschlag für „{kriterium.name}“</h4>
              <p className="hinweis">
                {formatProzent(vorschlag.punkte, 1)} von {vorschlag.max} Punkten – zur Hälfte aus
                dem PR-Anteil ({formatProzent(vorschlag.prAnteil)} %), zur Hälfte aus der
                Review-Beteiligung ({formatProzent(vorschlag.reviewBeteiligung)} % der Kennungen
                haben mindestens ein Review gegeben). <b>Nur der mechanische Teil:</b> Ob die
                Commits aussagekräftig sind, kann kein Skript beurteilen – das bleibt dein Urteil,
                und für die Qualität von Commit-Nachrichten ist kein Zusammenhang mit der Leistung
                nachweisbar.
              </p>
              {erfasst !== undefined ? (
                <p className="hinweis">
                  Erfasst sind {formatProzent(erfasst, 1)} Punkte. Der Vorschlag überschreibt das
                  nicht{' '}
                  {erfasst === vorschlag.punkte
                    ? '– er stimmt damit überein.'
                    : `– er weicht um ${formatProzent(Math.abs(erfasst - vorschlag.punkte), 1)} Punkte ab.`}
                </p>
              ) : null}
              <button
                type="button"
                className="schalter"
                onClick={() =>
                  dispatch({
                    art: 'bewertung/punkte',
                    abschnittId: abschnitt.id,
                    teamId: team.id,
                    kategorie: 'team',
                    kriteriumId: kriterium.id,
                    wert: vorschlag.punkte,
                  })
                }
              >
                Vorschlag übernehmen
              </button>
            </>
          ) : null}
        </>
      )}
    </Karte>
  );
}
