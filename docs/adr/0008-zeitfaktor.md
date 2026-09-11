# ADR-008: Der Zeitfaktor ist eine Stufe, keine steigende Reihe

- **Status:** angenommen
- **Datum:** 2026-09-10
- **Bezug:** FA-54, FA-24; Fachkonzept 10.3 und Q1 (§ 20 Abs. 1 LBVO); OP-F4

## Kontext

§ 20 Abs. 1 LBVO verlangt, dass „dem zuletzt erreichten Leistungsstand das größere Gewicht
zuzumessen ist“. Eine Gleichgewichtung aller Sprints ist damit nicht zulässig. Offen war
nur, **wie** das Gewicht steigt.

Zwei Formen kamen in Frage: eine über die Sprints steigende Reihe (etwa 1 / 1,25 / 1,5 /
1,75 / 2) und eine einzelne Stufe (erste Hälfte 1, zweite Hälfte 2).

## Entscheidung

Eine Stufe. Die zweite Hälfte der Sprints eines Beurteilungszeitraums erhält den Zeitfaktor
2, die erste den Faktor 1; bei ungerader Sprintzahl wird zugunsten der späteren Sprints
aufgerundet.

Der Zeitfaktor wird je Beurteilungszeitraum bestimmt und getrennt vom frei einstellbaren
Sprintfaktor geführt. Das Gewicht eines Sprints ist das Produkt beider.

## Folgen

**Positiv**

- Die Regel hat **eine** Setzung – wo die Hälfte liegt –, und diese Setzung steht so im
  Verordnungstext. Bei einer steigenden Reihe wäre jeder einzelne Faktor zu begründen, und
  niemand kann sagen, warum der fünfte Sprint mit 1,75 und nicht mit 1,6 zählen soll.
  Genauigkeit, die sich nicht begründen lässt, ist im Widerspruchsfall die schwächere
  Position.
- Sie lässt sich einer Klasse in einem Satz erklären, und zwar zu Projektbeginn.
- Sie funktioniert bei drei wie bei neun Sprints, ohne dass Faktoren neu verteilt werden.

**Negativ**

- Zwei benachbarte Sprints links und rechts der Hälfte werden ungleich behandelt, obwohl
  zwischen ihnen zwei Wochen liegen. Eine steigende Reihe hätte diesen Sprung nicht.
- Der Faktor 2 ist selbst eine Setzung. Er ist einstellbar (FA-54 AK-6); der Wert 1 hebt die
  Regel auf und wird deshalb als Abweichung von § 20 Abs. 1 LBVO gekennzeichnet.
- Ein einzelner Einbruch in der zweiten Hälfte wiegt doppelt, obwohl er den erreichten Stand
  nicht beschreibt. Das wird bewusst nicht über die Formel gelöst, sondern über einen
  gesetzten Wert (ADR-006, FA-50) – siehe Fall TF-G in den Testfällen.
