/**
 * Agiert das Team als Team (FA-79)?
 *
 * Zuerst die Aussage über das Team, darunter die Werte, die sie tragen
 * (AK-1) – nicht umgekehrt. Gefragt ist ein Befund über das Team; die
 * abweichende Person ist sein Symptom, nicht sein Ergebnis.
 *
 * Diese Ansicht rechnet nichts: `befund` in der Domäne liefert Muster,
 * Signale und Schwelle, hier wird daraus Text.
 */

import { befund, formatProzent } from '../domain/scoring';
import type { Muster, Personensignal } from '../domain/scoring';
import type { Abschnitt, Bewertung, Datenbestand, Team } from '../domain/types';

import { Karte } from '../ui/bausteine';

/**
 * Was das Muster bedeutet – und was daraus folgt (Fachkonzept 8.2a).
 *
 * Der Ton ist „sieh hin“, nie „hier stimmt etwas nicht“ (AK-6). Und das
 * zweite Muster ist ausdrücklich **kein** Teamproblem: Ein Team, das
 * gleichmäßig schwach ist, braucht fachliche Unterstützung und keine
 * Teamentwicklung. Eine Darstellung, die beides gleich behandelt, führt in
 * die falsche Maßnahme (AK-2).
 */
const MUSTERTEXT: Record<Muster, { satz: string; folge: string }> = {
  zusammen: {
    satz: 'Die Beiträge liegen zusammen.',
    folge: 'Das sieht nach einem Team aus.',
  },
  'zusammen-schwach': {
    satz: 'Die Beiträge liegen zusammen, aber niedrig.',
    folge:
      'Das ist ein fachliches Problem und kein Teamproblem – gemeinsam schwach ist trotzdem gemeinsam.',
  },
  ungleich: {
    satz: 'Die Beiträge liegen weit auseinander.',
    folge:
      'Sieh hin: Auch wer das Team trägt, ist derselbe Befund wie wer mitläuft. ' +
      'Beides ist ein Anlass für die Retrospektive.',
  },
  unklar: {
    satz: 'Noch zu wenig erfasst für einen Befund.',
    folge: 'Es braucht Ergebnisse von mindestens zwei Mitgliedern.',
  },
};

/** Die Signale einer Person in einem Satz – Tatsachen, kein Etikett (AK-5). */
function signalsatz(signal: Personensignal, schwelle: number): string {
  const teile: string[] = [];
  if (signal.abstand !== null && Math.abs(signal.abstand) >= schwelle) {
    teile.push(
      `${formatProzent(Math.abs(signal.abstand))} Prozentpunkte ${
        signal.abstand < 0 ? 'unter' : 'über'
      } den übrigen`,
    );
  }
  // Der Abstand zum Team-Ergebnis ist keine Signalgröße, aber die Information,
  // die im Gespräch zählt: Ein gutes Teamergebnis kann einen schwachen eigenen
  // Beitrag tragen.
  if (
    signal.richtung === 'unter' &&
    signal.abstandTeam !== null &&
    Math.abs(signal.abstandTeam) >= schwelle
  ) {
    teile.push(
      `${formatProzent(Math.abs(signal.abstandTeam))} Prozentpunkte unter dem Team-Ergebnis`,
    );
  }
  if (signal.peerAbstand !== null && Math.abs(signal.peerAbstand) >= schwelle) {
    teile.push(
      `Peer-Wert ${formatProzent(Math.abs(signal.peerAbstand))} Prozentpunkte ${
        signal.peerAbstand < 0 ? 'unter' : 'über'
      } den übrigen`,
    );
  }
  if (signal.ohneSpur > 0) {
    teile.push(
      signal.ohneSpur === 1
        ? 'in einem abgeschlossenen Sprint keine Spur'
        : `in ${signal.ohneSpur} abgeschlossenen Sprints keine Spur`,
    );
  }
  return teile.join(' · ');
}

export function BefundKarte({
  daten,
  abschnitt,
  team,
  index,
}: {
  daten: Datenbestand;
  abschnitt: Abschnitt;
  team: Team;
  index: Map<string, Bewertung>;
}) {
  const ergebnis = befund(daten, abschnitt, team.id, index);
  const text = MUSTERTEXT[ergebnis.muster];

  return (
    <Karte
      titel="Agiert das Team als Team?"
      hinweis={`Schwelle ${formatProzent(ergebnis.schwelle)} Prozentpunkte · rechnet nicht in die Note`}
    >
      <p className={ergebnis.muster === 'ungleich' ? 'warnung' : 'hinweis'} role="status">
        <b>{text.satz}</b> {text.folge}
        {ergebnis.spanne !== null ? (
          <>
            {' '}
            Abstand zwischen höchstem und niedrigstem Beitrag:{' '}
            {formatProzent(ergebnis.spanne)} Prozentpunkte
            {ergebnis.bezug !== null ? `, Mitte bei ${formatProzent(ergebnis.bezug)} %` : ''}
            {ergebnis.teamProzent !== null
              ? `, Team-Ergebnis ${formatProzent(ergebnis.teamProzent)} %`
              : ''}
            .
          </>
        ) : null}
      </p>

      <div className="uebersicht">
        {ergebnis.personen.length === 0 ? (
          <div className="leer">Diesem Team ist in diesem Abschnitt noch niemand zugeordnet.</div>
        ) : (
          ergebnis.personen.map((signal) => (
            <div className="uebersichtszeile" key={signal.person.id}>
              <div className="bezeichnung">
                <b>{signal.person.name}</b>
                <span>
                  {signal.auffaellig
                    ? signalsatz(signal, ergebnis.schwelle)
                    : signal.individuell === null
                      ? 'individueller Beitrag noch nicht erfasst'
                      : 'im Rahmen des Teams'}
                </span>
              </div>
              <span className="zahl">
                {signal.individuell === null ? '–' : `${formatProzent(signal.individuell)} %`}
              </span>
            </div>
          ))
        )}
      </div>

      <p className="hinweis">
        Auffällig ist, wo mindestens zwei von drei Signalen in dieselbe Richtung zeigen:
        Abstand zum Median der Mitglieder, Peer-Wert gegenüber den übrigen, fehlende Spuren. Ein
        einzelnes Signal ist Rauschen – ein schwacher Sprint, eine Krankheit, eine
        Aufgabenverteilung, die nicht aufgegangen ist. Ein Abstand von mindestens{' '}
        {formatProzent(2 * ergebnis.schwelle)} Prozentpunkten trägt allein: Fünfzehn
        Prozentpunkte können ein schwacher Sprint sein, fünfzig sind kein Rauschen.
      </p>
    </Karte>
  );
}
