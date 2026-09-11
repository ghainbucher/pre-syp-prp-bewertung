# ADR-006: Gesetzte Werte treten neben die berechneten und ersetzen sie nicht

- **Status:** angenommen
- **Datum:** 2026-09-10
- **Bezug:** FA-49, FA-50, Fachkonzept G8/G9, Grundsatz G7

## Kontext

Die Beurteilung entsteht als Pyramide: Punkte je Kriterium → Kategorieergebnis →
Sprintergebnis → Gesamtstand → Notenstand. In der Praxis ist die Lehrkraft nicht auf jeder
Ebene gleich unsicher. Manchmal ist die Einschätzung einer Kategorie unmittelbar klar, und
der Weg über Einzelpunkte ist ein Umweg, der nichts genauer macht. Es muss daher möglich
sein, jede Ebene zu überspringen.

Die naheliegende Umsetzung – der gesetzte Wert überschreibt den berechneten – wurde vom
Auftraggeber ausdrücklich abgelehnt: *„Überschreiben ist ein No Go. Nachvollziehbarkeit für
den Lehrer bei Diskussionen ist von entscheidender Bedeutung.“*

## Entscheidung

Ein gesetzter Wert wird **zusätzlich** gespeichert. Der berechnete Wert bleibt erhalten,
weil er gar nicht gespeichert wird: Er ist eine Funktion des Datenbestands und entsteht bei
jeder Anzeige neu.

Für die Weitergabe nach oben gilt der gesetzte Wert. Für die Belegfassung gelten **beide**,
samt der Abweichung zwischen ihnen. Ändern sich später die Daten darunter, ändert sich der
berechnete Wert; der gesetzte bleibt, bis ihn jemand ändert oder entfernt.

Dasselbe Muster gilt zwischen Gesamtstand und Note – mit einem Unterschied: Dort gibt es
keinen berechneten Wert, den man übernehmen könnte, sondern nur einen *Vorschlag*. Die Note
selbst ist ausschließlich ein gesetzter Wert (G8).

## Folgen

**Positiv**

- Eine Diskussion über eine Note lässt sich in beide Richtungen führen: Was sagen die Daten,
  und was hat die Lehrkraft entschieden? Beides steht da.
- Die Pyramide ist an jeder Stelle betretbar. Wer nur den Gesamtstand setzen will, muss
  keinen einzigen Sprint erfassen.
- Nichts geht verloren, wenn jemand eine Ebene nachträglich ausfüllt.

**Negativ**

- Zwei Werte je Ebene sind mehr, als eine Anzeige verträgt. Die Oberfläche zeigt deshalb
  standardmäßig nur einen (FA-51); die Abweichung wird gemeldet, aber nicht ausgebreitet.
- Ein gesetzter Wert kann veralten, ohne dass jemand es merkt. Die Anwendung weist die
  Abweichung aus, entscheidet aber nichts – das bleibt eine Sache der Lehrkraft.
- Die Berechnungsfunktionen geben nicht mehr eine Zahl zurück, sondern Zahl und Herkunft.
  Das ist im Code spürbar und in den Tests zu prüfen.
