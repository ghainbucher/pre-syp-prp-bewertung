# ADR-003: Eine Bewertung je Sprint und Team

- **Status:** angenommen
- **Datum:** 2026-09-09
- **Bezug:** FA-12 bis FA-14, Abschnitt 5 des Solution-Designs

## Kontext

Team-Ergebnis und Scrum-Prozess gelten für alle Mitglieder eines Teams gleichermaßen. Der
individuelle Beitrag und die Peer-Urteile sind personenbezogen, entstehen aber im selben
Erfassungsvorgang.

## Entscheidung

Der Datensatz `Bewertung` wird durch die Kombination aus `sprintId` und `teamId`
identifiziert und enthält alles, was in diesem Sprint für dieses Team erfasst wird:
Teampunkte, Prozesspunkte, die Einzelbewertungen aller Mitglieder und die vollständige
Peer-Matrix.

## Folgen

**Positiv**

- Teampunkte existieren genau einmal; sie können zwischen Mitgliedern nicht auseinanderlaufen.
- Die Erfassungsmaske arbeitet auf genau einem Datensatz – eine Änderung, ein Schreibvorgang.
- Die Anzahl der Datensätze bleibt klein (Sprints × Teams statt Sprints × Personen).

**Negativ**

- Wechselt eine Person das Team, liegen ihre Daten in zwei Datensätzen. Solange die
  Teamzugehörigkeit nicht historisiert ist (OP-6), zählt für die Auswertung die aktuelle
  Zuordnung.
- Der Datensatz wächst mit der Teamgröße; bei sehr großen Teams wäre die Peer-Matrix
  quadratisch. Bei den in A-1 angenommenen Größen ist das unkritisch.
