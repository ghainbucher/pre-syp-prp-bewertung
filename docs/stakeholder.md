# Stakeholderanalyse

| | |
|---|---|
| **Projekt** | PRE/SYP-PRP-Bewertung |
| **Dokument** | Stakeholderanalyse |
| **Version** | 0.5 |
| **Datum** | 2026-09-10 |
| **Autor** | Gerald Hainbucher |
| **Status** | Entwurf – nicht freigegeben |
| **Gültig für Softwarestand** | 0.1.0 |
| **Zuletzt geprüft** | 2026-09-10 |
| **Nächste Prüfung** | Ende Sprint 1 |
| **Rahmenbedingung** | RB-07 |

---

## 1 Änderungshistorie

| Version | Datum | Autor | Änderung | Status |
|---|---|---|---|---|
| 0.1 | 2026-09-09 | G. Hainbucher | Ersterstellung; herausgelöst aus Fachkonzept Kap. 11 und Anforderungsdokument Kap. 4, ergänzt um Erfolgskriterien je Gruppe, Einfluss/Interesse und Zielkonflikte | Entwurf |
| 0.2 | 2026-09-10 | G. Hainbucher | Erfolgskriterium von SH-1 an die zwei Feststellungen im Projektzeitraum angepasst | Entwurf |
| 0.3 | 2026-09-10 | G. Hainbucher | Anforderungszuordnungen nach der Trennung von Belegfassung (FA-32) und Rückmeldung (FA-42) berichtigt | Entwurf |
| 0.4 | 2026-09-10 | G. Hainbucher | OP-S1 zurückgestellt: Die Peer-Bewertung wird zugeschaltet, nicht vorausgesetzt (FA-52) | Entwurf |
| 0.5 | 2026-09-10 | G. Hainbucher | OP-S2 entschieden: SH-6 wird nicht aktiv bedient; Erfolgskriterium und Anforderungszuordnung entsprechend gefasst | Entwurf |

---

## 2 Zweck

Wer ist von der PRE/SYP-PRP-Bewertung betroffen, was will diese Gruppe, **woran erkennt man, dass sie
zufrieden ist** — und wo widersprechen sich diese Interessen?

Der letzte Teil ist der wichtigste. Ein Erfolgskriterium, das nicht prüfbar formuliert ist,
lässt sich hinterher beliebig auslegen. Ein unbenannter Zielkonflikt wird nicht entschieden,
sondern im Code implizit entschieden — meist zugunsten dessen, der die Software bedient.

Dieses Dokument speist das [Product Goal](product-goal.md) und ist der Nachweis dafür, dass
jede Anforderung einen Nutznießer hat.

---

## 3 Übersicht

| ID | Stakeholder | Rolle im Projekt | Einfluss | Interesse |
|---|---|---|---|---|
| **SH-1** | Lehrkraft | Auftraggeber, Entwickler, einziger Anwender | hoch | hoch |
| **SH-2** | Schülerin / Schüler | Gegenstand der Beurteilung, liefert Selbst- und Peer-Einschätzung | gering | sehr hoch |
| **SH-3** | Erziehungsberechtigte | erhalten im Anlassfall die Begründung | gering | punktuell hoch |
| **SH-4** | Schulleitung / Aufsicht | prüft im Widerspruchsfall die Notenfindung | hoch | gering, im Anlassfall hoch |
| **SH-5** | Product Owner der Schülerprojekte | stellt Anforderungen, nimmt ab; oft nicht die Lehrkraft | mittel | gering |
| **SH-6** | Lehrende Kolleginnen und Kollegen | mögliche Nachnutzer von Konzept und Rubrik | gering | mittel |
| **SH-7** | Schulerhalter / Datenschutz | verantwortet den Rahmen der Datenverarbeitung | hoch | gering, bis etwas passiert |

**Zur Verteilung:** Die Gruppe mit dem höchsten Interesse (SH-2) hat den geringsten Einfluss.
Das ist die typische Lage bei Beurteilungssystemen — und der Grund, warum die Interessen
dieser Gruppe ausdrücklich in Anforderungen übersetzt werden müssen und nicht darauf warten
können, eingefordert zu werden.

---

## 4 Im Einzelnen

### SH-1 Lehrkraft

- **Interesse:** schnelle Erfassung, belastbare Note, kein Verwaltungsaufwand, der den
  Unterricht verdrängt.
- **Erfolgskriterium:** Ein Team ist in höchstens 5 Minuten je Sprint vollständig bewertet;
  Semester- und Jahresnote entstehen ohne Nachrechnen von Hand.
- **Anforderungen:** FA-12 bis FA-19, FA-28 bis FA-31, NFA-01.

### SH-2 Schülerin / Schüler

- **Interesse:** eine faire Note, die vorher absehbar und nachher erklärbar ist; Rückmeldung
  früh genug, um darauf zu reagieren.
- **Erfolgskriterium:** Kennt die Kriterien vor dem Sprint, erhält nach jedem Sprint eine
  Rückmeldung, und kann sich die eigene Note aus Kriterien und Punkten herleiten lassen.
- **Anforderungen:** FA-39, FA-41, FA-42, FA-51.
- **Anmerkung:** Diese vier Anforderungen sind erst durch das Fachkonzept entstanden. Das
  frühere Anforderungsdokument war fast vollständig auf die Erfassungsseite ausgerichtet —
  eine Folge davon, vom Werkzeug her zu denken statt vom Zweck.

### SH-3 Erziehungsberechtigte

- **Interesse:** im Anlassfall eine verständliche Herleitung der Note.
- **Erfolgskriterium:** Erhalten eine schriftliche Begründung, die ohne Fachkenntnis lesbar
  ist und keine internen Bezeichner enthält.
- **Anforderungen:** FA-32 (Belegfassung, auf Verlangen).

### SH-4 Schulleitung / Aufsicht

- **Interesse:** dokumentierte, konsistente Kriterien; im Widerspruchsfall belastbare Daten.
- **Erfolgskriterium:** Ein Widerspruchsfall ist in höchstens 10 Minuten aus den erfassten
  Daten rekonstruierbar.
- **Anforderungen:** FA-24 bis FA-26, FA-32, FA-33, FA-49, FA-50, NFA-02.
- **Gewicht:** Der Einfluss ist gering, solange nichts passiert, und im Ernstfall
  entscheidend. Deshalb wird für diese Gruppe entworfen, auch wenn sie nie etwas verlangt.

### SH-5 Product Owner der Schülerprojekte

- **Interesse:** ein Team, das nachfragt statt zu raten, und ein Ergebnis, das dem Zugesagten
  entspricht.
- **Erfolgskriterium:** Die Rückmeldung des Auftraggebers findet erkennbar Eingang in die
  Beurteilung, ohne dass er selbst ein Werkzeug bedienen muss.
- **Anforderungen:** FA-43, FA-44.
- **Anmerkung:** Der PO ist **kein Anwender** der Software. In der ersten Ausbaustufe erfasst
  die Lehrkraft seine Rückmeldung stellvertretend; ein eigener Zugang würde ein Backend
  erfordern und damit RB-06 aufheben.

### SH-6 Lehrende Kolleginnen und Kollegen

- **Interesse:** Konzept und Rubrik für einen eigenen Gegenstand übernehmen können.
- **Erfolgskriterium:** Wer will, kann die Anwendung ohne Zutun der Entwicklung verwenden und
  sich eine eigene Rubrik einstellen, ohne den Code zu ändern.
- **Anforderungen:** FA-06 bis FA-10; FA-11 als `Kann`.
- **Entschieden am 10. September 2026 (OP-S2): Diese Gruppe wird nicht aktiv bedient.**
  „Übernehmen“ hat drei Stufen, und keine davon teilt Daten:

  | Stufe | Was geschieht | Aufwand |
  |---|---|---|
  | 1 Konzept | Fachkonzept und Rubrik lesen und im eigenen Gegenstand ähnlich verfahren | keiner |
  | 2 Anwendung | Dieselbe über GitHub Pages veröffentlichte Adresse aufrufen. Weil der Speicher am Browserprofil hängt, entsteht **automatisch ein eigener, getrennter Datenbestand** | keiner, funktioniert heute |
  | 3 Rubrik | Kriterien, Punkte, Gewichte und Notenschlüssel als Datei übernehmen, statt sie abzutippen | FA-11, `Kann` |

  Stufe 2 ist der Punkt, an dem ein Missverständnis naheliegt: **Mehrere Anwender bedeuten
  hier nicht einen gemeinsamen Datenbestand, sondern je einen pro Gerät.** Das ist die
  Konsequenz von ADR-001, und sie arbeitet hier für uns – eine zentrale Datenbank wäre genau
  das, was dabei *nicht* entsteht.

  Stufe 3 wird gebaut, sobald jemand danach fragt, und nicht vorher. Solange niemand fragt,
  wäre es eine Funktion für einen gedachten Nutzer.
- **Was das kostet, wenn es eintritt:** Sobald Stufe 2 oder 3 wirklich stattfindet, wird die
  Lehrkraft zur Anlaufstelle für die Software von Kolleginnen und Kollegen. Das ist Risiko
  R-08 – ein Projekt mit einer entwickelnden Person. Kein Grund, es zu lassen; einer, es
  bewusst zu tun.

### SH-7 Schulerhalter / Datenschutz

- **Interesse:** keine unkontrollierte Verarbeitung personenbezogener Daten Minderjähriger.
- **Erfolgskriterium:** Keine Übertragung an Dritte; jederzeitige vollständige Löschbarkeit;
  die Verarbeitung entspricht der einer lokal geführten Notenliste.
- **Anforderungen:** DS-01 bis DS-05, NFA-03.
- **Offen:** Die Zulässigkeit auf dem verwendeten Gerät ist mit der Schulleitung zu klären
  (OP-F1 im Fachkonzept). Das ist eine Auskunft des Dienstgebers, keine Einschätzung der
  Entwicklung.

---

## 5 Zielkonflikte und ihre Entscheidung

| Nr. | Konflikt | Entscheidung | Begründung |
|---|---|---|---|
| **ZK-1** | Erfassungsaufwand (SH-1) ↔ ausführliche Begründung (SH-2, SH-3) | Die Begründung wird **aus den erfassten Daten erzeugt**, nicht zusätzlich geschrieben | Der Aufwand entsteht einmal, bei der Erfassung |
| **ZK-2** | Vollständige Offenlegung der Rubrik ↔ Gefahr des Abarbeitens nach Punkteliste | Rubrik wird vollständig offengelegt | Ohne bekannte Kriterien ist die Note weder steuerbar noch verteidigbar; die Kriterien sind so formuliert, dass sie Qualität und nicht Menge belohnen |
| **ZK-3** | Peer-Feedback als Lernanlass ↔ als Notenbestandteil (SH-2) | geringe Gewichtung, Auffälligkeiten führen zum Gespräch | Absprachen und Vergeltung machen Peer-Werte als Notengrundlage angreifbar |
| **ZK-4** | Vergleichbarkeit der Teams ↔ unterschiedliche Auftraggeber (SH-5) | Die Note trägt, was PO-unabhängig prüfbar ist; PO-Zufriedenheit ist ein eigenes, gering gewichtetes Signal | Sonst hinge die Note davon ab, welchen Auftraggeber ein Team gezogen hat |
| **ZK-5** | Datensparsamkeit (SH-7) ↔ Rekonstruierbarkeit im Anlassfall (SH-4) | Es wird nur erfasst, was in die Note eingeht — dieses aber vollständig und dauerhaft | Weniger wäre nicht belegbar, mehr wäre nicht erforderlich |

---

## 6 Offene Punkte

| Nr. | Frage | Status |
|---|---|---|
| OP-S1 | Erhalten Schülerinnen und Schüler eine anonymisierte Rückmeldung aus der Peer-Bewertung? Das würde SH-2 stärken und ZK-3 verschärfen. | zurückgestellt – die Peer-Bewertung läuft nicht ab dem ersten Sprint (FA-52), die Frage stellt sich erst danach |
| OP-S2 | Soll SH-6 aktiv bedient werden (Export/Import der Rubrik, FA-11) oder bleibt es bei „wäre möglich“? | **entschieden 2026-09-10: nicht aktiv bedient. Stufen 1 und 2 sind ohne Aufwand möglich und werden nicht beworben; FA-11 bleibt `Kann`, bis jemand danach fragt** |
| OP-S3 | Ist SH-7 vor der Freigabe einzubinden, oder genügt die Auskunft der Schulleitung? | offen |
