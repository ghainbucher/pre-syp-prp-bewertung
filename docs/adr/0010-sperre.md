# ADR-010: Die Sperre wirkt auf den Notenvorschlag, nicht auf die gespeicherten Werte

- **Status:** angenommen
- **Datum:** 2026-09-10
- **Bezug:** FA-59, FA-61; Fachkonzept 3.5 und 10.4; Q8 (§ 14 LBVO); Risiko R-11

## Kontext

Der Gegenstand hat zwei Stränge: Praxis mit drei Wochenstunden, Theorie mit einer. Sie gehen
mit 75 zu 25 Prozent in die Note ein, und der Auftraggeber verlangt, dass ein negativer
Strang die positive Gesamtbeurteilung ausschließt: „Ein Teil negativ, alles negativ.“

Das ist rechtlich gedeckt. § 14 LBVO verlangt für ein „Genügend“, dass die Anforderungen „in
den wesentlichen Bereichen überwiegend erfüllt“ sind – wer einen wesentlichen Bereich nicht
besteht, erfüllt diese Bedingung nicht, wie gut der andere ausfällt.

Offen war, **wo** diese Regel im Modell greift. Der naheliegende Weg wäre, den Gesamtstand im
Sperrfall auf einen Wert unterhalb der Genügend-Grenze zu setzen. Dann stünde eine einzige
Zahl da, und alles Weitere ergäbe sich von selbst.

## Entscheidung

Die Sperre ist ein **Prädikat über den Strangständen**, keine Rechenoperation. Sie verändert
keinen gespeicherten Wert. Beide Strangstände und der Gesamtstand bleiben stehen, wie sie
sind; ausschließlich der Notenvorschlag wird zu „Nicht genügend“, versehen mit der Angabe,
welcher Strang ihn ausgelöst hat.

Ein Strang ohne jedes Ergebnis löst die Sperre nicht aus. Nur ein vorhandener Stand unterhalb
der Grenze tut das.

## Folgen

**Positiv**

- Die Aufzeichnungen bleiben wahr. Wer 82 % in der Praxis und 44 % in der Theorie hat, hat
  genau diese beiden Zahlen – und nicht einen künstlich gesenkten Gesamtwert, der niemandem
  sagt, woran es liegt.
- Die Rückmeldung an die Person kann konkret sein: nicht „zu wenig“, sondern „die Theorie
  trägt nicht, die Praxis schon“. Das ist der Unterschied zwischen einer Note und einem
  Hinweis, was zu tun ist.
- Es ist dieselbe Trennung wie bei ADR-006: Was gerechnet wurde, und was daraus folgen soll,
  sind zwei verschiedene Aussagen und bleiben getrennt.
- Die Sperre ist abschaltbar, ohne dass Daten anders gespeichert werden müssten.

**Negativ**

- Es gibt zwei Zahlen, die in verschiedene Richtungen zeigen: einen Gesamtstand von 72 % und
  einen Vorschlag „Nicht genügend“. Das ist erklärungsbedürftig, und die Oberfläche muss die
  Erklärung mitliefern, sonst wirkt es wie ein Fehler.
- Die Sperre ist die einzige Stelle im Modell, an der eine gute Leistung nichts nützt. Sie
  muss deshalb früh sichtbar sein; eine Sperre, die erst am Ende erscheint, ist pädagogisch
  wertlos und im Widerspruchsfall angreifbar (FA-61 AK-5).
- Sie hängt an wenigen Feststellungen: ein bis zwei Tests je Semester. Das ist der
  eigentliche Grund für Risiko R-11 – nicht die Regel selbst, sondern ihre schmale Grundlage.
