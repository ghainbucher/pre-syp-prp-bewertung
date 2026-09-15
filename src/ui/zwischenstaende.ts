/**
 * Welche Sichten einen Zwischenstand tragen und wo darüber entschieden wird
 * (FA-93).
 *
 * **Warum das eine Tabelle ist und keine zwei Textstellen in zwei Komponenten.**
 * FA-93 AK-2 verlangt, dass der Hinweis nennt, *wo* die Entscheidung fällt –
 * sonst wird er selbst zu Inventar. Eine Angabe, die in der Ansicht steht, ist
 * nur so lange richtig, wie sich jemand daran erinnert; hier steht sie an einer
 * Stelle, ist prüfbar und fällt auf, wenn der offene Punkt entschieden wurde.
 *
 * **Und wann sie verschwindet.** FA-93 AK-4: Mit der Entscheidung wird der
 * Eintrag gelöscht, nicht der Text umgeschrieben. Bleibt einer länger als einen
 * Durchgang stehen, ist das selbst ein Befund (R-07).
 */

/** Ein Zwischenstand: der offene Punkt und die Frage, die er beantwortet. */
export interface Zwischenstand {
  /** Kennung des offenen Punktes in `docs/anforderungen.md`. */
  offenerPunkt: string;
  /** Die tatsächlich offene Frage – keine Umschreibung von „noch offen". */
  frage: string;
}

/** Die Sichten, deren Aufbau am 13.09.2026 noch nicht festgelegt war. */
export const ZWISCHENSTAENDE: Record<'tests' | 'auswertung', Zwischenstand> = {
  tests: {
    offenerPunkt: 'OP-F32',
    frage: 'Erfassung je Test über alle Schüler – wie hier – oder je Schüler über alle Tests?',
  },
  auswertung: {
    offenerPunkt: 'OP-F33',
    frage:
      'Was ist der Einstieg – der Stand einer Person über alle Abschnitte, oder die Klasse im Überblick?',
  },
};
