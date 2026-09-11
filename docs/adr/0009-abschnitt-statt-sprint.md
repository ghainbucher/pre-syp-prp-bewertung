# ADR-009: Der Beurteilungsabschnitt trägt das Modell, nicht der Sprint

- **Status:** angenommen
- **Datum:** 2026-09-10
- **Bezug:** FA-55, FA-56, FA-57; Fachkonzept 3.4; Risiko R-10; OP-F12

## Kontext

Der Gegenstand hat zwei Phasen: das Sprintprojekt von Oktober bis April und die
Diplomarbeitsvorbereitung im Mai. Beide werden beurteilt, beide gehen in dieselbe Jahresnote
ein – aber sie haben nichts gemeinsam außer dem Kompetenzbereich K3. Ein Sprint liefert
Software, die zweite Phase liefert ein freigegebenes Thema.

Das bisherige Modell kannte nur Sprints und **eine** Rubrik für alles. Damit wäre rund ein
Drittel der Jahresnote außerhalb des Werkzeugs entstanden – jener Teil, der dem Zeugnis am
nächsten liegt und im Widerspruchsfall zuerst hinterfragt wird (R-10).

Drei Wege standen zur Wahl: ein eigener Abschnittstyp mit eigener Struktur, ein weiterer
Abschnitt derselben Struktur mit eigener Rubrik, oder Beurteilung außerhalb des Werkzeugs
mit einem gesetzten Wert.

## Entscheidung

Der **Abschnitt** ersetzt den Sprint als tragenden Begriff. Er hat ein Merkmal `art`
(`sprint` oder `diplomarbeitsvorbereitung`) und **eine eigene Rubrik**. Alles andere –
Erfassung, Kategorierechnung, Zeitfaktor, gesetzte Werte, Peer-Korrektur, Belegfassung –
verhält sich für beide Arten identisch.

Die `art` steuert ausschließlich die vorgeschlagene Rubrik und die Beschriftung. Sie ist ein
Etikett, keine Fallunterscheidung in der Rechenlogik.

Das erfordert Schemastand 2 mit einer Migration bestehender Bestände (FA-57).

## Folgen

**Positiv**

- Die Jahresnote ist in einem Stück belegbar. Die Belegfassung deckt beide Phasen ab, ohne
  dass jemand wissen muss, dass es zwei gibt.
- Es gibt **keinen zweiten Rechenweg**. Wäre die zweite Phase ein eigener Typ mit eigener
  Logik geworden, gäbe es zwei Stellen, an denen Prozentwerte entstehen – und damit die
  Möglichkeit, dass sie auseinanderlaufen.
- Die Rubrik je Abschnitt ist über die zweite Phase hinaus nützlich: Ein Lernsprint darf
  jetzt andere Kriterien tragen als ein regulärer.

**Negativ**

- Eine Migration eines laufenden Datenbestands ist der riskanteste Eingriff, den dieses
  Projekt kennt (R-01). Sie sichert deshalb zuerst und schreibt die Schemanummer zuletzt.
- Der Weg zurück auf Schemastand 1 ist versperrt: Eine zweite Rubrik hat dort keinen Platz.
- Mehrere Rubriken heißen mehrere Stellen, an denen Kriterien gepflegt werden. Der
  Erfassungsaufwand steigt nicht, der Einrichtungsaufwand schon.
- „Sprint“ bleibt im Namen des Produkts, aber nicht mehr im Zentrum des Modells. Das ist
  hinnehmbar; ein Umbenennen des Werkzeugs wäre teurer als der begriffliche Bruch.
