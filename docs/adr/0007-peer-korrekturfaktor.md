# ADR-007: Peer-Werte wirken als gedeckelter Korrekturfaktor

- **Status:** angenommen
- **Datum:** 2026-09-10
- **Bezug:** FA-45, ersetzt die lineare Einrechnung aus FA-07; Risiko R-04, Zielkonflikt ZK-3

## Kontext

Die Einschätzung durch die Teammitglieder ist fachlich wertvoll – sie sieht, was die
Lehrkraft nicht sieht – und zugleich die angreifbarste Datenquelle im ganzen Modell.
Absprachen innerhalb eines Teams, Vergeltung nach einem Konflikt und schlichte
Gefälligkeitsurteile sind nicht auszuschließen und von außen nicht zu erkennen.

Bisher ging der Peer-Wert als eigene Kategorie mit einem Rubrikgewicht ein. Damit hing sein
Einfluss auf die Note an einer Zahl in der Rubrik, war nach oben offen und ließ sich nicht in
einem Satz erklären.

Geprüft wurden zwei Alternativen: ein **gedeckelter Korrekturfaktor** und eine
**Ausreißerbereinigung** (Streichen des höchsten und niedrigsten Urteils). Die
Ausreißerbereinigung setzt mindestens vier Bewertende voraus und wirkt bei einer Absprache
des ganzen Teams gar nicht.

## Entscheidung

Das Peer-Ergebnis verschiebt das Sprintergebnis um höchstens ±5 Prozentpunkte. Neutraler
Punkt ist 50 %; ein Peer-Ergebnis von 50 % ändert nichts. Liegt kein Peer-Ergebnis vor,
bleibt das Sprintergebnis unverändert. Die Deckelung ist einstellbar, die Vorgabe ist ±5.

Auffällige Abweichungen zwischen Selbst- und Fremdbild bleiben davon unberührt: Sie führen
zum Gespräch (FA-27), nicht zu einer Zahl.

## Folgen

**Positiv**

- Der maximale Einfluss der Peer-Werte ist eine Zahl, die im Dokument steht, und keine
  Rechnung über Rubrikgewichte. Er lässt sich Schülerinnen und Schülern in einem Satz sagen.
- Eine Absprache im Team verschiebt eine Note um höchstens eine halbe Notenstufe. Das nimmt
  dem Manipulationsversuch den Ertrag, ohne den Beitrag zu entwerten.
- Die Peer-Bewertung bleibt als Lernanlass erhalten, ohne die Beurteilung zu tragen.

**Negativ**

- Bei einem tatsächlich stark abweichenden Beitrag ist die Korrektur zu klein, um ihn
  abzubilden. Dafür ist die Kategorie „Individuell“ da – dort beurteilt die Lehrkraft.
- Der Faktor ist rechnerisch weniger unmittelbar als ein Gewicht. Das Rechenbeispiel im
  Solution-Design (6.8) ist deshalb Teil der Erklärung.
