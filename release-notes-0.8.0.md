## „Ordnen“

Bis hierher konnte die Anwendung bewerten und rechnen. Ordnen konnte sie nicht: Ein Projekt war
eine Ansammlung von Abschnitten einer Klasse, die Stammdaten lagen auf einem Blatt zusammen, und
ein Filter wirkte auf vier von zehn Sichten. Das ist die erste Fassung, die einen ganzen
Durchgang trägt.

**Das Projekt ist die Ordnungsachse**

- **Schüler gehören zu Projekten**, nicht zu Abschnitten (Schemastand 4). Die Zuordnung geschieht
  beim Projekt und gilt für alle seine Sprints. Ein Schüler darf in mehreren Projekten sein; die
  Anwendung fragt dann nach, weil es selten gewollt ist, und hält die Bestätigung fest.
- **Die Klasse hängt am Schüler, nicht am Projekt.** Zu welcher Klasse ein Projekt gehört, ergibt
  sich aus seinen Mitgliedern – ein gemischtes Projekt gehört zu beiden. „Gemischt“ ist damit
  kein Zustand, den jemand setzt, sondern der Fall, dass zwei Klassen vorkommen.
- **Die Diplomarbeit ist ein Projekt eines Typs**, keine eigene Sicht und keine eigene
  Abschnittsart mehr.
- **Vier Bereiche statt acht** – Projekte, Tests, Notenauswertung, Stammdaten –, der Sprintablauf
  eine Ebene tiefer.

**Stammdaten: ein Blatt je Sache**

- **Sechs Blätter** statt eines: Klassen, Schüler, Projekte, Tests, Rubrik & Notenschlüssel,
  Stichtage. Angelegt, geändert und gelöscht wird **nur dort**.
- **Löschen hat zwei Ausgänge, und die Anwendung wählt selbst:** endgültig, solange nichts
  Bewertetes daran hängt – sonst nur ausgeblendet und jederzeit wiederherstellbar. Welcher der
  beiden greift, steht **vor** der Bestätigung neben dem Schalter. Anders wäre eine Note nicht
  mehr rekonstruierbar.

**Ein Klassenfilter für die ganze Anwendung**

- Die Klassenwahl in der Kopfleiste kennt **„alle Klassen“** und wirkt auf jeder Sicht, auf der
  eine Klasse vorkommt. Vorher stand sie überall und tat auf sechs von zehn Sichten nichts.
- Ist ein Gegenstand gewählt, gilt **seine** Klasse: Die Schüler zu einem Test kommen aus der
  Klasse des Tests, die Sprints eines Projekts aus dem Projekt.
- Den Filter stellt **nur der Benutzer**. Kein Anlegen, kein Projektklick verstellt ihn.
- Eine leere Sicht sagt, **ob sie leer oder gefiltert ist**, und behält die Auswahlleisten – ein
  Projekt ohne Sprint war vorher eine Sackgasse.

**Im Sprint festhalten, was vereinbart war**

- **Geplante Anforderungen** im Sprintplanning, **umgesetzte** im Sprintreview, dort nebeneinander.
  Einzeln sagt keiner der beiden Texte etwas; erst der Vergleich beantwortet die erste Frage des
  Reviews. Beide gehen in keine Rechnung ein: Warum etwas offen blieb, entscheidet die Lehrkraft.

**Umgesetzt:** FA-34, FA-73, FA-87, FA-88, FA-90, FA-91, FA-93 bis FA-96.

**Bekannte Einschränkungen**

- Klassenlisten müssen **von Hand** eingetippt werden; der Dateiimport (FA-89) fehlt.
- Aufbau der Sichten **Theorie-Tests** und **Notenauswertung** ist noch nicht entschieden
  (OP-F32, OP-F33); beide tragen einen sichtbaren Hinweis darauf.
- Die Anwendung ist noch **nie mit echten Daten** gelaufen (OP-F39).

Weiterhin ohne Netzzugriff (ADR-001), alle Daten im Browser des Geräts.
