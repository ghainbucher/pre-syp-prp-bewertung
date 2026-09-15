# ADR-012: Das Projekt ist die Ordnungsachse, nicht die Klasse

- **Status:** angenommen
- **Datum:** 2026-09-13
- **Bezug:** FA-34 (neu gefasst), FA-87 bis FA-93; ADR-009; Fachkonzept G11; Risiko R-01

## Kontext

Bisher hängt alles an der Klasse: `Person.klasseId`, `Team.klasseId`, `Abschnitt.klasseId`.
Das war richtig, solange ein Team eine Teilmenge einer Klasse war und ein Sprint für die ganze
Klasse galt.

Am 13.09.2026 hat der Auftraggeber nach einem Review der Sichten zwei Dinge festgestellt, die
diese Annahme brechen:

1. **„Ich kümmere mich um ein Projekt zu einem Zeitpunkt."** Die Arbeit im Unterricht ist nach
   Projekt organisiert, nicht nach Klasse. Eine Klasse ist beim Bewerten eines Sprints keine
   nützliche Einheit – sie ist nur der Ort, an dem die Schüler herkommen.
2. **Bei Diplomarbeiten arbeiten Schüler verschiedener Klassen zusammen.** Ein Projekt lässt
   sich dann keiner Klasse zuordnen. Mit `Team.klasseId` als Pflichtfeld ist dieser Fall nicht
   abbildbar, und mit `Abschnitt.klasseId` erst recht nicht: Der Sprint eines gemischten Teams
   gehörte zu keiner Klasse.

Die Klasse verschwindet damit nicht – sie bleibt für **Tests** und **Notenauswertung** die
richtige Einheit, weil dort nach Schüler gearbeitet wird und der Zugang über die Klasse führt.

## Entscheidung

**Das heutige Team wird zum Projekt.** Ein Projekt ist das, woran eine Gruppe arbeitet; ein
zweiter Begriff daneben wäre eine Ebene ohne Inhalt, weil eine Gruppe immer genau ein Projekt
hat.

Konkret:

- `Team` heißt fachlich **Projekt** und bekommt `art` (`syp-pre-4`, `syp-pre-5`,
  `diplomarbeit`) sowie eine **optionale** `klasseId`. Leer heißt „gemischt“ – das ist der
  Diplomarbeitsfall und kein Fehler.
- `Abschnitt.klasseId` wird zu `Abschnitt.projektId`. Ein Sprint gehört zu einem Projekt, nicht
  zu einer Klasse.
- `Person` behält `klasseId` und bekommt `githubKennung` und `schulEmail`. Die Zuordnung
  Kennung → Person wandert damit vom Projekt zum Schüler (bisher `Team.kennungen`).

**Schemastand 4.** Die Änderung ist nicht additiv: `Abschnitt.klasseId` entfällt, und die
Zuordnung der Kennungen wechselt die Ebene. Eine Migration führt beide Schritte aus.

## Begründung

**Jetzt ist der billige Zeitpunkt.** Es liegen weiterhin **keine echten Daten** vor. Dieselbe
Überlegung wie bei Schemastand 3: Eine Modelländerung an einem laufenden Bestand mit echten
Schülerdaten ist das teuerste Ereignis, das dieses Projekt kennt (R-01). Vor dem ersten
Datensatz kostet sie eine Migration und ein paar Tests.

**Die Alternative wäre schlimmer.** Ein Projekt als eigene Ebene **über** dem Team hätte den
gemischten Fall ebenfalls gelöst, aber eine Ebene in jede Zuordnung, jede Auswertung und jede
Belegfassung eingezogen – für einen Fall, den es im Unterricht nicht gibt: Zwei Teams am selben
Projekt kommen bei drei bis vier Schülern je Gruppe nicht vor.

**Die Klasse bleibt, wo sie trägt.** Tests und Notenauswertung arbeiten nach Schüler, und dort
ist der Klassenfilter der natürliche Einstieg. Die Ordnungsachse wechselt also nicht überall,
sondern dort, wo nach Projekt gearbeitet wird.

## Umsetzung in zwei Schritten (Nachtrag vom 13.09.2026)

Der Auftraggeber hat nach der Spezifikation verlangt, **zuerst die Sichten zu bauen** und sie
anzusehen – mit dem Argument, dass man eine Aufteilung von Sichten durch Anschauen beurteilt und
nicht durch Lesen. Das ist richtig, und es ändert die Reihenfolge der Umsetzung, nicht die
Entscheidung.

**Schritt 1 – additiv, innerhalb von Schemastand 3 (umgesetzt).** `Team.art`, `Person.githubKennung`,
`Person.schulEmail`; die fünf Bereiche; Projektliste, Filter und Sprintliste. Kein Feld entfällt,
keine Migration, jeder bestehende Bestand bleibt lesbar.

**Schritt 2 – Schemastand 4 (offen).** `Abschnitt.projektId` statt `Abschnitt.klasseId`, die
optionale Klasse am Projekt, das Entfernen von `Team.kennungen`, samt Migration und Tests.

**Was in Schritt 1 anders gelöst ist als oben entschieden:** „Gemischt“ hängt **nicht** an einer
leeren Klassenangabe, sondern wird aus den Klassen der Mitglieder **abgeleitet** – ein Projekt gilt
als gemischt, sobald seine Mitglieder aus mehr als einer Klasse kommen. Das ist fachlich dieselbe
Aussage, kostet kein Feld und kann nicht veralten: Ein Kennzeichen, das jemand setzen muss, wäre
neben der Mitgliederliste eine zweite Wahrheit. Die Klasse des Projekts ist bis zu Schritt 2 seine
*Heimatklasse* – der Ort, an dem es verwaltet wird.

**Warum die Zweiteilung vertretbar ist.** Der teure Teil der Migration ist der Wechsel von
`Abschnitt.klasseId` auf `projektId`; er wird billiger, nicht teurer, wenn er erst nach der Abnahme
der Sichten kommt – denn dann ist entschieden, was die Sichten brauchen. Das Argument aus dem
Abschnitt *Begründung* bleibt unberührt: Es liegen **noch keine echten Daten** vor, und solange das
so ist, ist der Zeitpunkt gleich günstig. Zöge sich Schritt 2 über den ersten echten Bestand hinaus,
wäre das ein Befund (R-01) und nicht mehr eine Reihenfolge.

## Folgen

- **Migration von Schemastand 3 auf 4** mit Tests: Jeder Abschnitt bekommt seine Projekte
  zugewiesen; jede Kennung aus `Team.kennungen` wandert an die Person.
- **Ein Sonderfall verschwindet:** Mehrere GitHub-Konten je Person waren bisher möglich, weil
  die Zuordnung je Projekt galt (Schule und zuhause). Der Auftraggeber hat entschieden, dass
  eine Kennung je Schüler genügt. Taucht der Fall auf, ist er sichtbar – die Auswertung nennt
  unzugeordnete Kennungen (FA-81 AK-3).
- **Die Oberfläche wird von acht auf fünf Bereiche umgestellt** (FA-34 neu gefasst). Der Ablauf
  – Planning, Daily, Review – verschwindet dabei nicht, er rückt **eine Ebene tiefer**: in den
  Sprint innerhalb des Projekts.
- **Die Reihenfolge der Bereiche folgt nicht mehr dem Ablauf, sondern der Häufigkeit.** Das ist
  eine ausdrückliche Umkehr von FA-34 AK-2 in der Fassung von 0.5.0 und dort begründet.

## Verworfen

- **Projekt als eigene Ebene über dem Team** – eine Ebene ohne Fall, siehe oben.
- **Klasse bleibt Pflicht, gemischte Gruppen bekommen eine Sammelklasse „unklar“** – eine
  erfundene Klasse in den Stammdaten, die in jeder Auswertung wieder herausgerechnet werden
  müsste. Ein leeres Feld sagt dasselbe, ohne etwas zu erfinden.
- **Alles lassen und die Sichten nur umsortieren** – die Fassade hätte gehalten, bis das erste
  gemischte Diplomarbeitsteam angelegt wird. Dann läge echter Bestand vor, und die Änderung
  wäre teuer.
