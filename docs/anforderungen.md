# Anforderungsdokument – PRE/SYP-PRP-Bewertung

| | |
|---|---|
| **Projekt** | PRE/SYP-PRP-Bewertung |
| **Dokument** | Anforderungsdokument |
| **Version** | 0.22 |
| **Datum** | 2026-09-12 |
| **Autor** | Gerald Hainbucher |
| **Status** | Entwurf – nicht freigegeben |
| **Gültig für Softwarestand** | 0.3.0 |
| **Zuletzt geprüft** | 2026-09-12 |
| **Nächste Prüfung** | Ende Sprint 1 |
| **Rahmenbedingung** | RB-01 |

---

## 1 Änderungshistorie

| Version | Datum | Autor | Änderung | Status |
|---|---|---|---|---|
| 0.1 | 2026-09-09 | G. Hainbucher | Ersterstellung auf Basis des Prototyps und der Rahmenbedingungen RB-01 bis RB-04 | Entwurf |
| 0.2 | 2026-09-09 | G. Hainbucher | Umstellung auf Satzschablone; Stakeholderanalyse und Product Goal ausgelagert; neun neue Anforderungen FA-39 bis FA-47 aus Fachkonzept und Risikoanalyse; Rahmenbedingungen RB-07 bis RB-10 ergänzt | Entwurf |
| 0.3 | 2026-09-10 | G. Hainbucher | Zeitraum berichtigt (1. Oktober bis 30. April statt Semester), Annahmen an das tatsächliche Zeitbudget angepasst, FA-48 für die Auswertung zu einem Stichtag ergänzt | Entwurf |
| 0.4 | 2026-09-10 | G. Hainbucher | OP-F2 entschieden: Peer-Werte wirken als gedeckelter Korrekturfaktor. FA-45 von „Kann/offen“ auf „Soll/geplant“, FA-22 entsprechend angepasst | Entwurf |
| 0.22 | 2026-09-12 | G. Hainbucher | Schemastand 3: Beginn, Ende und Ziel eines Sprints liegen beim Team (FA-66), Kriterien werden je Team angepasst und aus dem vorigen Sprint fortgeschrieben (FA-67), Migration (FA-68), Vorlage „Vorbereitungssprint“ (FA-69). FA-04, FA-47, FA-48, FA-55 und FA-65 daran angeschlossen. Releaseplan: 0.4.0 „Planen“, bisheriges 0.4.0 wird 0.5.0. OP-F17 bis OP-F20 aufgenommen | Entwurf |
| 0.21 | 2026-09-11 | G. Hainbucher | Release 0.3.0 umgesetzt: FA-32, FA-40 (AK-1 bis AK-4 nachgetragen), FA-41 (AK-3, AK-4), FA-42, FA-45, FA-47, FA-48 (AK-6, AK-7), FA-49, FA-50, FA-51, FA-54, FA-61 | Entwurf |
| 0.20 | 2026-09-11 | G. Hainbucher | Release 0.2.0 umgesetzt: FA-17 (AK-1 bis AK-5 nachgetragen), FA-39 (AK-4 bis AK-7 nachgetragen), FA-46, FA-64, DS-06, FA-53 (AK-6, AK-7 nachgetragen). OP-F16 aufgenommen | Entwurf |
| 0.19 | 2026-09-11 | G. Hainbucher | Schemastand 2 umgesetzt: FA-52, FA-55 bis FA-60 und FA-65 von „geplant“ auf „umgesetzt“, jeweils durch Tests belegt | Entwurf |
| 0.18 | 2026-09-10 | G. Hainbucher | OP-R1 entschieden: Die Rubrik wird beim ersten Eintrag je Abschnitt eingefroren (FA-65); FA-47 auf das Angleichen umgestellt | Entwurf |
| 0.17 | 2026-09-10 | G. Hainbucher | Releaseplan: Schnitt in 0.2.0 Erfassen, 0.3.0 Beurteilen, 0.4.0 Ergänzen (neues Kap. 3.1). 21 Anforderungen neu zugeordnet. OP-M3 geschlossen | Entwurf |
| 0.16 | 2026-09-10 | G. Hainbucher | FA-64: automatische Sicherung in einen gewählten Ordner; NFA-05 um die Browserabhängigkeit ergänzt | Entwurf |
| 0.15 | 2026-09-10 | G. Hainbucher | OP-2 entschieden: Einbenutzerbetrieb auf einem Gerät. Tägliche Sicherung in den schulischen Speicher: NFA-03 und DS-02 präzisiert, DS-06 ergänzt, FA-46 auf den Tagesrhythmus umgestellt | Entwurf |
| 0.14 | 2026-09-10 | G. Hainbucher | FA-63: Testergebnisse aus einer Datei einlesen | Entwurf |
| 0.13 | 2026-09-10 | G. Hainbucher | Testaufbau 3 × MC und eine offene Frage (FA-60 neu gefasst); Bewertungsschema und KI-Vorschlag in FA-32 und FA-60 verankert | Entwurf |
| 0.12 | 2026-09-10 | G. Hainbucher | FA-62: Testzeitbudget je Semester nach § 8 Abs. 5 LBVO im Blick behalten | Entwurf |
| 0.11 | 2026-09-10 | G. Hainbucher | Zwei Stränge (FA-59), Tests als Abschnitte (FA-60), Sperre bei negativem Strang (FA-61). FA-24 und FA-25 daran angeschlossen | Entwurf |
| 0.10 | 2026-09-10 | G. Hainbucher | OP-F6 entschieden: Teamzugehörigkeit je Abschnitt (FA-58). Zweite Rubrikvorlage für die Diplomarbeitsvorbereitung (FA-09 AK-2, Fachkonzept 8.8) | Entwurf |
| 0.9 | 2026-09-10 | G. Hainbucher | OP-F12 entschieden: Beurteilungsabschnitt als tragender Begriff, Rubrik je Abschnitt (FA-55, FA-56, FA-57). Schemastand 2 | Entwurf |
| 0.8 | 2026-09-10 | G. Hainbucher | Der Gegenstand läuft bis Schuljahresende (Fachkonzept 3.4): FA-48 auf drei Stichtage erweitert, Frühwarnung Ende April aufgenommen | Entwurf |
| 0.7 | 2026-09-10 | G. Hainbucher | FA-54: Zeitfaktor nach § 20 Abs. 1 LBVO – die zweite Hälfte der Sprints eines Beurteilungszeitraums zählt doppelt. FA-24 und FA-48 daran angeschlossen | Entwurf |
| 0.6 | 2026-09-10 | G. Hainbucher | Peer-Bewertung wird zugeschaltet, nicht vorausgesetzt: FA-52 (Schalter je Sprint) und FA-53 (Nachfrage am Ende der Sprintbewertung) | Entwurf |
| 0.5 | 2026-09-10 | G. Hainbucher | Grundsätze G8 bis G10: Aufzeichnungen ohne Noten (FA-25 wird Notenvorschlag, FA-49 Notenstand), gesetzte Werte auf jeder Ebene ohne Überschreiben (FA-50), zurückhaltende Darstellung (FA-51). FA-32 und FA-42 als getrennte Ausgaben geschärft, FA-28/30/31 nachgezogen | Entwurf |

---

## 2 Zweck und Geltung

Dieses Dokument beschreibt, **was** die PRE/SYP-PRP-Bewertung leisten muss. Das **Wie** steht im
[Solution Design](solution-design.md), das **Wozu** im [Product Goal](product-goal.md),
das **Für wen** in der [Stakeholderanalyse](stakeholder.md).

Format, Ablage und Pflege dieser Anforderungen sind im
[Anforderungs- und Lösungsmanagement](anforderungs-und-loesungsmanagement.md) festgelegt.
Kurzfassung: Funktionale Anforderungen folgen der Satzschablone, nicht-funktionale sind
Aussagesätze mit messbarem Kriterium, IDs werden nie wiederverwendet.

**Lesehilfe zur Kopfzeile jeder Anforderung:**
`Priorität` · Release · Stakeholder · Status. Priorität nach MoSCoW (Muss / Soll / Kann /
Zurückgestellt), Stakeholder-IDs siehe [Stakeholderanalyse](stakeholder.md).

---

## 3 Abgrenzung

| Nr. | Nicht-Ziel | Begründung |
|---|---|---|
| NZ-1 | Anbindung an ein Schulverwaltungsprogramm | Kein Zugriff auf Schnittstellen; Export genügt |
| NZ-2 | Analyse von Schüler-Quellcode oder Git-Statistiken | Metriken sind keine Beobachtung von Kompetenz (PN-2) |
| NZ-3 | Verwaltung des Product Backlogs der Schülerteams | Dafür nutzen die Teams GitHub (PN-5) |
| NZ-4 | Mehrbenutzerbetrieb mit Rollen und Anmeldung | Ein Anwender pro Installation (RB-05) |
| NZ-5 | Rechtsverbindliche Notenarchivierung | Verbleibt im Schulsystem |
| NZ-6 | Eigener Zugang für den Product Owner der Schülerprojekte | Würde ein Backend erfordern und RB-06 aufheben; die Lehrkraft erfasst stellvertretend (FA-44) |

---

## 3.1 Releaseplan

Der Schnitt folgt nicht dem Aufwand, sondern dem **Bedarfszeitpunkt**: Wann wird eine
Funktion im Durchgang zum ersten Mal gebraucht?

| Release | Zweck | Gebraucht ab |
|---|---|---|
| **0.2.0 Erfassen** | Das Datenmodell in seiner endgültigen Form und alles, was zum Bewerten eines Sprints nötig ist. Dazu die Ausgabe der Rubrik an die Klasse und die Sicherung. | **Mitte Oktober**, erste Sprintbewertung |
| **0.3.0 Beurteilen** | Rechnen und Ausgeben: Zeitfaktor, Peer-Korrektur, gesetzte Werte, Notenstand, Sperre, Stichtag, Belegfassung, Rückmeldung an die Person. | **Ende Jänner**, Semesterzeugnis |
| **0.4.0 Planen** | Der Sprint gehört dem Team: Beginn, Ende und Ziel je Team, Kriterien je Team mit Fortschreibung aus dem vorigen Sprint, Vorlage für den Vorbereitungssprint, Migration auf Schemastand 3. | **vor dem ersten Sprintbeginn** eines Durchgangs |
| **0.5.0 Ergänzen** | Was den Betrieb angenehmer macht, aber keinen Termin hat: Auftraggeber, Testzeitbudget, Ergebnisimport, Tastaturbedienung, Barrierefreiheit, Rubrikweitergabe. | laufend |

**Das Datenmodell kommt vollständig in 0.2.0** – einschließlich Theoriestrang und
Diplomarbeitsvorbereitung, obwohl beides erst im November beziehungsweise im Mai benutzt
wird. Der Grund ist nicht Ordnungsliebe: Jede spätere Modelländerung wäre eine Migration
eines laufenden Bestands mit echten Schülerdaten – das riskanteste, was dieses Projekt kennt
(R-01). Einmal richtig ist billiger als dreimal migriert.

**Schemastand 3 widerspricht dem vorigen Absatz nicht, er belegt ihn.** Am 12.09.2026 hat der
Auftraggeber festgehalten, dass Dauer und Ziel eines Sprints je Team beim Planning entstehen –
eine Tatsache über den Unterricht, die beim Schnitt von 0.2.0 nicht bekannt war. „Einmal
richtig“ heißt nicht „einmal geraten“; es heißt, das Modell dann zu ändern, wenn neues Wissen
da ist, und nicht in Teilschritten danach. Die Umstellung fällt weiterhin in eine Zeit **ohne
echte Daten** – der teure Fall aus R-01 tritt damit auch diesmal nicht ein.

**Zum Zeitpunkt dieses Plans liegen keine echten Daten vor** (bestätigt am 10.09.2026). Ist
0.2.0 vor dem ersten Datensatz fertig, entsteht der Bestand von Anfang an im Schemastand 2
und die Migration von 1 auf 2 wird nie ausgeführt. FA-57 steht deshalb in 0.3.0: als
Absicherung für den Fall, dass doch ein alter Bestand auftaucht, und als Grundlage für
künftige Schemaänderungen – nicht als Voraussetzung für den Start.

**Keine Aufwandsschätzung je Anforderung.** Sie wäre dazu da, die Kapazität der Lehrkraft zu
planen; die ist hier nicht die knappe Größe, weil die Umsetzung nicht ihre Zeit kostet. Die
knappe Größe ist der Termin, und den ordnet der Bedarfszeitpunkt. Entschieden mit OP-M3 am
10.09.2026.

---

## 4 Begriffe

| Begriff | Bedeutung |
|---|---|
| **Sprint** | Beurteilungsabschnitt der Klasse. Nummer, Reihenfolge und Art gelten für alle; Beginn, Ende und Ziel legt **jedes Team** beim Planning fest (FA-66) |
| **Sprintplanung** | Was ein Team sich für einen Sprint vornimmt: Ziel, Beginn, Ende und die Kriterien, nach denen am Ende beurteilt wird |
| **Team** | Gruppe, die gemeinsam an einem Produkt arbeitet |
| **Rubrik** | Katalog von Bewertungskriterien mit erreichbaren Punkten |
| **Kategorie** | Team-Ergebnis, Scrum-Prozess, Individueller Beitrag, Peer-Bewertung |
| **Gewichtung** | Anteil einer Kategorie am Sprintergebnis, in Prozent |
| **Sprintfaktor** | Gewicht eines Sprints im Gesamtergebnis |
| **Projektzeitraum** | 1. Oktober bis 30. April, rund 25 Arbeitswochen à 3 Schulstunden |
| **Peer-Bewertung** | Einschätzung durch die anderen Teammitglieder |
| **Verstehensnachweis** | Mündliche Erklärung einer selbst eingebrachten Codestelle im Review |
| **Auftraggeber / PO** | Stellt die Anforderungen an das Schülerprojekt; oft nicht die Lehrkraft |
| **Notenschlüssel** | Zuordnung von Prozentbereichen zu Noten – erzeugt einen **Vorschlag**, keine Note |
| **Notenstand** | Die von der Lehrkraft eingetragene Note. Einzige Stelle im Bestand, an der eine Ziffer 1–5 steht |
| **Gesetzter Wert** | Ein unmittelbar eingegebener Wert einer Ebene, der neben dem berechneten steht und ihn nicht ersetzt |

---

## 5 Stammdaten

### FA-01 Klassen verwalten

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich Klassen anlegen, umbenennen und löschen können,
damit ich mehrere Gruppen getrennt führen und bewerten kann.

- **AK-1** Beim Löschen einer Klasse werden auch ihre Teams, Personen, Sprints und Bewertungen entfernt.

### FA-02 Teams verwalten

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich innerhalb einer Klasse Teams anlegen, umbenennen und löschen können,
damit ich die Zusammenarbeit so abbilden kann, wie sie tatsächlich stattfindet.

- **AK-1** Wird ein Team gelöscht, bleiben seine Personen erhalten und sind danach „ohne Team“.

### FA-03 Schülerinnen und Schüler verwalten

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich Personen anlegen, umbenennen, einem Team zuordnen und entfernen können,
damit die Bewertung den tatsächlichen Klassenstand abbildet.

- **AK-1** Mehrere durch Beistrich getrennte Namen erzeugen mehrere Einträge.
- **AK-2** Wird eine Person entfernt, verschwinden ihre Einzel- und Peer-Bewertungen aus allen Auswertungen.

### FA-04 Sprints verwalten

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich Sprints mit Nummer, Bezeichnung, Zeitraum und Faktor anlegen und ändern können,
damit ich den tatsächlichen Projektverlauf abbilden und den Lernsprint geringer gewichten kann.

- **AK-1** Der Sprintfaktor ist frei wählbar; 0 nimmt den Sprint aus dem Gesamtergebnis.
- **AK-2** Der Zeitraum am Sprint ist ein **Rahmen** und keine Festlegung: Maßgeblich sind Beginn und Ende, die jedes Team in seiner Planung einträgt (FA-66). Für einen Test gilt der Zeitraum des Abschnitts für alle.
- **AK-3** Der Faktor bleibt am Sprint und gilt für alle Teams: Ein Lernsprint ist ein Format der Klasse, keine Vereinbarung eines einzelnen Teams.

### FA-43 Auftraggeber je Team erfassen

`Soll` · 0.5.0 · SH-5 · geplant

Als Lehrkraft
möchte ich zu jedem Team festhalten, wer der Auftraggeber ist und welcher Art,
damit später erkennbar bleibt, ob eine Abnahme meine eigene Beobachtung war oder eine übernommene Fremdangabe.

- **AK-1** Erfasst werden Name und Art des Auftraggebers: Lehrkraft selbst, Kollegin oder Kollege, extern.
- **AK-2** Ist die Lehrkraft selbst Auftraggeber, gilt ihre Rückmeldung als eigene Beobachtung; sonst als Fremdangabe.

---

## 6 Rubrik und Bewertungsmodell

### FA-05 Vier Bewertungskategorien

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich in vier Kategorien bewerten – Team-Ergebnis, Scrum-Prozess, Individueller Beitrag, Peer-Bewertung –,
damit Produkt, Arbeitsweise und persönlicher Beitrag getrennt sichtbar bleiben.

### FA-06 Kriterien pflegen

`Muss` · 0.1.0 · SH-1, SH-6 · umgesetzt

Als Lehrkraft
möchte ich Kriterien je Kategorie hinzufügen, umbenennen, beschreiben und löschen können,
damit ich die Rubrik auf meinen Gegenstand zuschneiden kann, ohne den Code zu ändern.

- **AK-1** Beim Umbenennen eines Kriteriums bleibt seine ID stabil; erfasste Punkte behalten ihren Bezug.

### FA-07 Kategorien gewichten

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich jeder Kategorie ein Gewicht in Prozent geben können,
damit die Note das Verhältnis abbildet, das ich fachlich für richtig halte.

- **AK-1** Die Summe der Gewichte muss nicht 100 ergeben; intern wird normiert.
- **AK-2** Ein Gewicht von 0 nimmt die Kategorie aus der Berechnung, ohne erfasste Daten zu löschen.
- **AK-3** Die Peer-Kategorie trägt kein Gewicht; sie wirkt über den Korrekturfaktor nach FA-45.

### FA-08 Notenschlüssel festlegen

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich je Note 1 bis 5 eine untere Prozentgrenze festlegen,
damit die Umrechnung meinem Anspruch entspricht und nicht einer fremden Vorgabe.

- **AK-1** Zulässig sind Werte von 0 bis 100; die Grenze für Note 5 ist fix 0.

### FA-09 Rubrik auf Vorlage zurücksetzen

`Soll` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich die Rubrik auf die mitgelieferte Vorlage zurücksetzen können,
damit ich nach einem Fehlversuch ohne Neuinstallation wieder auf einem sinnvollen Stand bin.

- **AK-3** Ausgeliefert werden drei Vorlagen: „Sprint“, „Diplomarbeitsvorbereitung“ und ab 0.4.0 „Vorbereitungssprint“ (FA-69).

### FA-10 Einheitliche Rubrik

`Muss` · 0.1.0 · SH-4 · umgesetzt

Als Lehrkraft
möchte ich, dass die Rubrik für alle Klassen und Sprints eines Datenbestands gilt,
damit Bewertungen untereinander vergleichbar bleiben.

### FA-11 Rubrik weitergeben

`Kann` · 0.5.0 · SH-6 · geplant

Als lehrende Kollegin oder lehrender Kollege
möchte ich eine Rubrik als Datei erhalten und einlesen können,
damit ich ein erprobtes Bewertungsmodell übernehmen kann, statt es nachzubauen.

### FA-65 Kriterien einfrieren

`Muss` · 0.4.0 · SH-4, SH-1 · umgesetzt

Als Lehrkraft
möchte ich, dass ein bewertetes Team die Kriterien behält, nach denen ich es bewertet habe,
damit eine später erzeugte Belegfassung zeigt, was damals galt, und nicht, was heute gilt.

- **AK-1** Die Kriterien werden **je Team und Abschnitt** eingefroren, nicht je Abschnitt. Seit FA-67 können sie sich von Team zu Team unterscheiden; eine Kopie am Abschnitt könnte diesen Unterschied nicht tragen.
- **AK-1a** Eingefroren wird beim **Festhalten der Planung** (FA-66). Fehlt eine Planung, geschieht es ersatzweise beim ersten Punkteintrag – so bleibt ein Abschnitt auch ohne Planung geschützt.
- **AK-2** Alle Berechnungen und Ausgaben dieses Teams in diesem Abschnitt verwenden ab diesem Zeitpunkt seine Kopie, nicht die aktuelle Rubrik.
- **AK-3** Eine Änderung an der Rubrik wirkt nur dort, wo noch keine Kopie liegt – also auf künftige Planungen.
- **AK-4** Die Belegfassung (FA-32) weist die Kriterien so aus, wie sie zum Zeitpunkt der Erfassung galten.
- **AK-5** Der Zeitpunkt des Einfrierens wird festgehalten.
- **AK-6** Eine eingefrorene Kopie lässt sich innerhalb ihrer Planung weiterhin ändern – die Änderung bleibt auf dieses Team und diesen Abschnitt beschränkt.
- **AK-7** Ein Test (FA-60) hat keine Teams; dort bleibt die Kopie am Abschnitt.

*Entschieden mit OP-R1 am 10.09.2026, geändert am 12.09.2026. Behandelt Risiko R-06. Dasselbe
Muster wie bei den gesetzten Werten (ADR-006): Die Kopie ist, was galt; die Rubrik ist, was
gelten wird. Nichts wird überschrieben. Das frühere Einfrieren – beim Planen statt beim ersten
Punkt – ist zugleich die pädagogisch richtige Reihenfolge: Die Kriterien stehen fest, bevor
gearbeitet wird, und nicht erst, wenn beurteilt wird.*

### FA-47 Eingefrorene Rubrik an die aktuelle angleichen

`Soll` · 0.3.0 · SH-1, SH-4 · umgesetzt

Als Lehrkraft
möchte ich eine Rubrikänderung ausdrücklich auf bereits bewertete Abschnitte übertragen können,
damit ich einen Tippfehler oder eine unklare Beschreibung berichtigen kann, ohne es beiläufig zu tun.

- **AK-1** Das Angleichen ist eine eigene, ausdrücklich ausgelöste Handlung – es geschieht nie als Nebenwirkung einer Rubrikänderung.
- **AK-2** Vor dem Angleichen wird gezeigt, welche Abschnitte betroffen sind und wie sich ihre Prozentwerte dadurch ändern.
- **AK-3** Ändern sich Prozentwerte, ist eine zweite Bestätigung nötig; ändern sich nur Bezeichnungen und Beschreibungen, genügt eine.
- **AK-4** Das Angleichen wird mit Zeitpunkt festgehalten und erscheint in der Belegfassung.
- **AK-5** Eine Rubrikänderung ohne Angleichen erzeugt keine Warnung mehr – sie wirkt nur nach vorne und ist damit harmlos (FA-65 AK-3).
- **AK-6** Das Angleichen wirkt **je Team**; die Vorschau nennt Abschnitt und Team. Ein Team, dessen Kriterien nach FA-67 abweichen, wird dabei nicht eingeebnet: Angeglichen wird nur, was aus der Rubrik stammt.

*Behandelt Risiko R-06. Ersetzt die frühere Fassung dieser Anforderung: Gewarnt wird nicht
mehr vor der Rubrikänderung, sondern vor dem Übertragen auf bereits Bewertetes – seit FA-65
ist die Änderung selbst folgenlos für Vergangenes.*

*Verliert mit FA-67 an Bedeutung: Der übliche Weg einer Kriterienänderung ist ab 0.4.0 der
nächste Sprint, nicht das nachträgliche Angleichen des vorigen. Angleichen bleibt für den
Fall, dass ein Kriterium **falsch** war – nicht dafür, dass es sich weiterentwickelt hat.*

---

### FA-59 Zwei Stränge mit eigenem Stand

`Muss` · 0.2.0 · SH-1, SH-4 · umgesetzt

Als Lehrkraft
möchte ich Praxis und Theorie als getrennte Stränge führen, die je einen eigenen Prozentstand haben,
damit ich sehe, woran eine Person steht, statt nur zu sehen, dass etwas nicht stimmt.

- **AK-1** Jeder Abschnitt gehört zu genau einem Strang: Praxis oder Theorie.
- **AK-2** Je Strang entsteht ein eigener Stand nach denselben Regeln wie bisher, einschließlich Sprint- und Zeitfaktor (FA-54).
- **AK-3** Der Gesamtstand ist das gewichtete Mittel der Strangstände; Vorgabe Praxis 75 %, Theorie 25 %.
- **AK-4** Die Gewichte sind einstellbar und summieren sich auf 100 %.
- **AK-5** Ein Strang ohne jedes Ergebnis fällt aus der Gewichtung, statt als 0 zu zählen (ADR-004).
- **AK-6** Beide Strangstände sind überall dort ausgewiesen, wo der Gesamtstand steht.

*Grundlage: Fachkonzept 3.5 und 10.4. Die Gewichte folgen der Stundentafel – drei von vier
Wochenstunden gegen eine.*

### FA-60 Tests als Abschnitte des Theoriestrangs

`Muss` · 0.2.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich einen Test mit erreichten und möglichen Punkten je Person erfassen,
damit der Theoriestand aus denselben Bausteinen entsteht wie der Praxisstand und nicht aus einer zweiten Rechnung.

- **AK-1** Ein Test ist ein Abschnitt der Art „Test“ im Strang Theorie.
- **AK-2** Seine Rubrik trägt vier Kriterien in der Kategorie „Individuell“: drei Multiple-Choice-Fragen zu je 2 Punkten und eine offene Frage zu 4 Punkten (20/20/20/40). Team-, Prozess- und Peer-Anteile entfallen.
- **AK-3** Erfasst werden erreichte Punkte je Person und Frage; ein Test hat damit 10 mögliche Punkte.
- **AK-4** Ein Test ohne Eintrag für eine Person zählt für diese nicht als 0, sondern als nicht bewertet (FA-12).
- **AK-5** Zum Test werden Datum, Ankündigungsdatum und Arbeitszeit festgehalten (§ 8 LBVO: zwei Unterrichtstage Vorlauf, siehe FA-62).
- **AK-6** Zur offenen Frage gehört ein Bewertungsschema von 0 bis 4 Punkten mit Deskriptoren; es wird an der Rubrik gespeichert und erscheint in der Belegfassung (FA-32).
- **AK-7** Der Aufbau ist eine Vorlage, keine Zwangsform: Zahl und Punktewerte der Fragen sind je Test änderbar.

*Grundlage: Fachkonzept 3.6. Die offene Frage trägt 40 %, weil § 14 LBVO neben der Erfassung
auch die Anwendung des Lehrstoffs verlangt und automatisch auswertbare Formate fast nur das
Erste messen. Die Korrektur der offenen Frage kann mit KI vorbereitet werden – der Vorschlag
ersetzt die Beurteilung nicht (§ 11 Abs. 2 LBVO), und es gehen keine personenbezogenen Daten
in das Werkzeug (Fachkonzept 3.6, OP-F15).*

*Grundlage: Fachkonzept 3.5.*

### FA-63 Testergebnisse einlesen

`Soll` · 0.5.0 · SH-1 · geplant

Als Lehrkraft
möchte ich die Punkte eines Tests aus einer Datei übernehmen, statt sie einzeln einzutippen,
damit zehn bis zwölf Tests im Jahr nicht die Zeit auffressen, die der Sprintbegleitung gehört.

- **AK-1** Eingelesen wird eine Datei mit einer Zeile je Person und einer Spalte je Frage.
- **AK-2** Vor dem Schreiben zeigt die Anwendung die erkannte Zuordnung von Zeilen zu Personen und verlangt eine Bestätigung.
- **AK-3** Nicht zuordenbare Zeilen werden einzeln benannt; sie werden nicht stillschweigend verworfen.
- **AK-4** Ein leeres Feld in der Datei bleibt leer und wird nicht zu 0 Punkten (FA-12).
- **AK-5** Bereits erfasste Punkte werden nur nach ausdrücklicher Bestätigung ersetzt; die Anwendung benennt vorher, wie viele betroffen sind.
- **AK-6** Der Import ist auf Abschnitte der Art „Test“ beschränkt.
- **AK-7** Die Datei wird ausschließlich lokal gelesen; es entsteht keine Netzwerkverbindung (NFA-03).

*Zahlt auf Messgröße PZ-1 ein. Bewusst auf 0.3.0 gesetzt: Die Erfassung funktioniert auch
ohne, nur langsamer. Erster Kandidat zum Vorziehen, wenn der Eingabeaufwand im ersten
Durchgang drückt.*

### FA-62 Testzeitbudget je Semester

`Soll` · 0.5.0 · SH-1 · geplant

Als Lehrkraft
möchte ich sehen, wie viel der zulässigen Testzeit eines Semesters schon verbraucht ist,
damit ich nicht versehentlich eine Überprüfung ansetze, die über die Grenze des § 8 LBVO hinausgeht.

- **AK-1** Zu jedem Test wird seine Arbeitszeit in Minuten erfasst.
- **AK-2** Je Beurteilungszeitraum wird die Summe der Arbeitszeiten dem eingestellten Höchstmaß gegenübergestellt; Vorgabe 80 Minuten.
- **AK-3** Überschreitet ein neuer Test die Grenze, erscheint ein Hinweis; die Erfassung wird nicht verhindert.
- **AK-4** Auch die Höchstdauer einer einzelnen Überprüfung ist einstellbar; Vorgabe 25 Minuten.
- **AK-5** Beide Grenzen sind Einstellungen, keine fest verdrahteten Zahlen – die Verordnung wird geändert, die Software soll das überleben.

*Grundlage: § 8 Abs. 4 und 5 LBVO (Q7). Das Höchstmaß gilt je Semester; die Jahresgrenze
betrifft nur Berufsschulen.*

### FA-61 Sperre bei negativem Strang

`Muss` · 0.3.0 · SH-1, SH-2, SH-4 · umgesetzt

Als Lehrkraft
möchte ich, dass ein Strang unterhalb der Genügend-Grenze den Notenvorschlag auf Nicht genügend setzt,
damit eine starke Praxis eine nicht bestandene Theorie nicht verdeckt – und umgekehrt.

- **AK-1** Gegeben ein Strangstand unter der Genügend-Grenze des Notenschlüssels, wenn der Notenvorschlag gebildet wird, dann lautet er „Nicht genügend“, unabhängig vom Gesamtstand.
- **AK-2** Der Vorschlag nennt den Strang, der die Sperre ausgelöst hat.
- **AK-3** Die Sperre verändert **keinen** gespeicherten Wert: Beide Strangstände und der Gesamtstand bleiben unverändert erhalten (G9).
- **AK-4** Die Sperre wirkt in beide Richtungen; kein Strang ist von ihr ausgenommen.
- **AK-5** Droht ein Strang unter die Grenze zu fallen, ist das in der Übersicht erkennbar, bevor der Beurteilungszeitraum endet (Frühwarnung, Fachkonzept 3.4).
- **AK-6** Die Sperre lässt sich abschalten, für den Fall eines Gegenstands ohne wesentliche Bereiche in diesem Sinn; Vorgabe ist eingeschaltet.

*Rechtsgrundlage: § 14 LBVO (Q8) – „Genügend“ verlangt die Erfüllung in den wesentlichen
Bereichen. Behandelt Risiko R-11.*

### FA-58 Teamzugehörigkeit je Abschnitt

`Muss` · 0.2.0 · SH-1, SH-4 · umgesetzt

Als Lehrkraft
möchte ich festhalten, in welchem Team eine Person in einem bestimmten Abschnitt gearbeitet hat,
damit ein Teamwechsel weder Daten entwertet noch die Zuordnung eines Teamergebnisses unklar macht.

- **AK-1** Die Zugehörigkeit gilt je Abschnitt und Person, nicht als dauerhafte Eigenschaft der Person.
- **AK-2** Beim Anlegen eines Abschnitts wird die Zuordnung des vorangegangenen übernommen und ist änderbar.
- **AK-3** Eine Person kann in einem Abschnitt keinem Team angehören; sie erhält dann für diesen Abschnitt kein Teamergebnis.
- **AK-4** Ein Wechsel wirkt nicht rückwirkend: Bereits erfasste Punkte behalten den Abschnitt und das Team, zu dem sie erhoben wurden.
- **AK-5** Der Gesamtstand einer Person läuft über alle ihre Abschnitte, unabhängig vom Team (G2).
- **AK-6** Die Belegfassung (FA-32) weist je Abschnitt das Team aus, in dem die Person war.
- **AK-7** Ein Team kann in einem Abschnitt bestehen und in einem anderen nicht.

*Entschieden mit OP-F6 am 10.09.2026. Löst zugleich OP-6 im Solution-Design. Grundlage:
Fachkonzept 6.1 und 3.4 – zur zweiten Phase bilden sich die Gruppen nach Thema neu.*

### FA-55 Mehrere Rubriken führen

`Muss` · 0.2.0 · SH-1, SH-6 · umgesetzt

Als Lehrkraft
möchte ich mehr als eine Rubrik führen und jedem Beurteilungsabschnitt eine davon zuordnen,
damit ich eine Phase mit anderen Kriterien beurteilen kann, ohne die Rubrik der Sprints zu verbiegen.

- **AK-1** Eine Rubrik hat einen Namen und wird einem oder mehreren Abschnitten zugeordnet.
- **AK-2** Jeder Abschnitt hat genau eine Rubrik; ohne Zuordnung gilt die als Vorgabe markierte.
- **AK-3** Eine Rubrik, die einem Abschnitt mit erfassten Punkten zugeordnet ist, lässt sich nicht löschen.
- **AK-4** Kriterien-IDs sind je Rubrik eindeutig; Punkte behalten ihren Bezug, auch wenn zwei Rubriken gleich benannte Kriterien führen.
- **AK-5** Die Warnung bei nachträglicher Rubrikänderung (FA-47) gilt je Rubrik.
- **AK-6** Ein Bestand nach Schemastand 1 wird beim Einlesen auf eine einzige Rubrik mit dem Namen „Sprint“ überführt, ohne dass Punkte verloren gehen.
- **AK-7** Ab 0.4.0 ist eine Rubrik **Saatgut**: Sie belegt die erste Planung eines Teams vor; danach schreibt das Team seine eigenen Kriterien fort (FA-67 AK-7). Wer wissen will, wonach ein Team in einem Sprint beurteilt wird, findet das in dessen Planung – nicht in der Rubrikansicht.

*Folgt aus OP-F12. Rahmenbedingung: Fachkonzept 3.4.*

*AK-7 verschiebt die Rolle dieser Anforderung merklich: Die Rubrikansicht war bis 0.3.0 der
Ort, an dem die geltenden Kriterien standen. Ab 0.4.0 ist sie der Ort, an dem sie **beginnen**.
Die Oberfläche muss das zeigen, sonst sucht man dort eine Antwort, die es dort nicht gibt.*

### FA-56 Die Diplomarbeitsvorbereitung als Abschnitt

`Muss` · 0.2.0 · SH-1, SH-4 · umgesetzt

Als Lehrkraft
möchte ich die Diplomarbeitsvorbereitung im Mai als eigenen Beurteilungsabschnitt erfassen,
damit die Jahresnote in einem Stück belegbar bleibt und nicht zu einem Drittel aus meinem Gedächtnis stammt.

- **AK-1** Ein Abschnitt trägt eine Art: Sprint oder Diplomarbeitsvorbereitung.
- **AK-2** Beide Arten verhalten sich in Erfassung, Rechnung, Zeitfaktor, gesetzten Werten und Belegfassung gleich.
- **AK-3** Die Art bestimmt nur die vorgeschlagene Rubrik und die Beschriftung in der Oberfläche.
- **AK-4** Ein Abschnitt der Art Diplomarbeitsvorbereitung gehört zu einem Beurteilungszeitraum wie jeder andere (FA-48).
- **AK-5** Die Peer-Bewertung ist auch für diesen Abschnitt zuschaltbar (FA-52).

*Behandelt Risiko R-10.*

### FA-66 Sprintplanung je Team

`Muss` · 0.4.0 · SH-1, SH-2 · umgesetzt

Als Lehrkraft
möchte ich am Sprintbeginn je Team Ziel, Beginn und Ende festhalten,
damit am Ende nachvollziehbar ist, was in welchem Zeitraum beurteilt wurde.

- **AK-1** Je Abschnitt und Team lassen sich Ziel, Beginn und Ende erfassen.
- **AK-2** Die Planung kann angelegt werden, bevor ein einziger Punkt erfasst ist. Sie ist der erste Schritt eines Sprints, nicht ein Nebenprodukt der Bewertung.
- **AK-3** Der Abschnitt gibt Nummer, Art, Strang und Faktor vor, aber keinen verbindlichen Zeitraum (FA-04 AK-2). Weicht ein Team deutlich von den übrigen ab, wird das angezeigt und nicht verhindert.
- **AK-4** Ein Team ohne erfasstes Ende bleibt in der Stichtagsauswertung außen vor **und wird dabei genannt** (FA-48 AK-6).
- **AK-5** Das Ziel erscheint in der Belegfassung (FA-32) und in der Rückmeldung (FA-42). Es ist keine Bewertung, sondern ihr Gegenstand – ohne es steht in der Aufzeichnung ein Prozentwert ohne Bezug.
- **AK-6** Für einen Test (FA-60) entfällt die Planung; dort gelten Zeitpunkt und Fragen des Abschnitts für alle.
- **AK-7** Wechselt eine Person das Team (FA-58), gilt für sie die Planung des Teams, in dem sie in diesem Abschnitt war.

*Folgt aus der Festlegung des Auftraggebers vom 12.09.2026. Grundlage: Fachkonzept 3.2
(Sprint-Ziel im Planning) und 8.1. Hebt die Annahme aus Schemastand 2 auf, ein Abschnitt sei
ein gemeinsames Zeitfenster der Klasse.*

### FA-67 Kriterien je Team auswählen und fortschreiben

`Muss` · 0.4.0 · SH-1, SH-2 · umgesetzt

Als Lehrkraft
möchte ich beim Planning aus allen Kriterien auswählen, welche für dieses Team gelten,
damit beurteilt wird, was dieses Team in diesem Sprint tatsächlich vorhat.

- **AK-1** Mit dem Festhalten der Planung wird der geltende Kriteriensatz als Kopie an das Team gebunden (FA-65 AK-1a).
- **AK-2** Beim Planen werden **alle verfügbaren Kriterien angezeigt**, und die Lehrkraft wählt aus, welche in diesem Abschnitt gelten. Die Gewichte der vier Kategorien bleiben unverändert; innerhalb einer Kategorie verschiebt sich das Gewicht über die Maximalpunkte der gewählten.
- **AK-2a** Verfügbar ist: die dem Abschnitt zugeordnete Rubrik, alles, was dieses Team in einem früheren Abschnitt **derselben Art** verwendet hat, und bei einem Sprint zusätzlich die Vorlage „Vorbereitungssprint“ (FA-69). Ein hier neu angelegtes Kriterium kommt dazu.
- **AK-3** Ein gestrichenes Kriterium ist nicht dasselbe wie ein unbewertetes: Es zählt in seiner Kategorie gar nicht mit, während ein unbewertetes aus der Gewichtung fällt und als offen gemeldet wird (FA-21, FA-26).
- **AK-4** Nach dem ersten Punkteintrag ist die Kopie eingefroren; Änderungen laufen über das Angleichen (FA-47 AK-6).
- **AK-5** Die Belegfassung weist je Abschnitt und Team die geltenden Kriterien aus und benennt Abweichungen von der zugrunde liegenden Rubrik.
- **AK-6** Überall, wo Teams miteinander verglichen werden – Teamübersicht (FA-29), Notenverteilung (FA-30), Export (FA-31) –, ist auszuweisen, dass die Kriterien abweichen. Ein Vergleich ungleicher Maßstäbe ohne Hinweis wäre irreführend.
- **AK-7** Vorausgewählt sind die Kriterien **des vorigen Sprints desselben Teams**, nicht die der Rubrik. Eine einmal getroffene Auswahl wirkt damit fort. Sie ist ein Vorschlag und bis zum Festhalten änderbar.
- **AK-8** Hat das Team keinen vorigen Sprint, ist die dem Abschnitt zugeordnete Rubrik vorausgewählt.
- **AK-9** Die Herkunft der Kriterien ist erkennbar: übernommen aus Sprint n, aus einer Rubrik, oder in diesem Sprint geändert.
- **AK-10** **Die Fortschreibung läuft nur von Sprint zu Sprint.** Ein Test und die Diplomarbeitsvorbereitung entstehen aus keinem Sprint und geben an keinen weiter: Sie haben ihre eigenen Kriterien, und ihre Auswahl beginnt bei der zugeordneten Rubrik.

*Folgt aus der Festlegung des Auftraggebers vom 12.09.2026: „Die Kriterien sollen immer aus
dem letzten Sprint übernommen werden … am Ende geht es meistens um dieselben Kriterien, nur
die ersten Sprints unterscheiden sich maßgeblich.“ Behandelt das Risiko, dass die
Vergleichbarkeit zwischen den Teams unbemerkt verlorengeht – siehe OP-F19 und OP-F20.*

*AK-2 und AK-10 am 12.09.2026 nachgeschärft, nachdem der Auftraggeber die erste Umsetzung
gesehen hat: Gewählt wird aus dem vollständigen Vorrat, statt einzelne Kriterien zu streichen
und zu ergänzen – „ich möchte die Kriterien alle sehen und auswählen, welche ich verwenden
möchte“. Die frühere AK-10 („aus einer Vorlage neu beginnen“) entfällt damit ersatzlos: Wenn
alles sichtbar ist, ist ein Satzwechsel eine Frage von Häkchen und braucht keinen eigenen Weg.
Zugleich berichtigt: Die Kette läuft **nur** von Sprint zu Sprint – ein Test und die
Diplomarbeitsvorbereitung entstehen aus keinem Sprint.*

### FA-69 Eigene Vorlage für den Vorbereitungssprint

`Soll` · 0.4.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich für den ersten Sprint einen eigenen Kriteriensatz vorgeschlagen bekommen,
damit ich im Vorbereitungssprint nicht beurteile, was es dort noch gar nicht gibt.

- **AK-1** Neben „Sprint“ und „Diplomarbeitsvorbereitung“ wird eine dritte Vorlage ausgeliefert: „Vorbereitungssprint“.
- **AK-2** Ihre Kriterien stehen beim Planen eines Sprints immer im Vorrat zur Auswahl (FA-67 AK-2a) – auch später im Jahr, falls eine Unterlage nachgereicht wird. Ist sie dem ersten Sprint als Rubrik zugeordnet, ist sie dort vorausgewählt.
- **AK-3** Die Vorlage ist wie jede andere Rubrik änderbar und zurücksetzbar (FA-09).
- **AK-4** Ihr Team-Ergebnis trägt sechs Kriterien mit zusammen 50 Punkten: Fachliches Konzept (10), Anforderungsspezifikation (10), Solution-Design (10), CI/CD (8), Stakeholderanalyse (6), Versionsverwaltung (6).
- **AK-5** Scrum-Prozess, Individueller Beitrag und Peer übernehmen die Kriterien der Sprint-Rubrik unverändert. Sie werden in den zweiten Sprint mitgenommen; eine abweichende Benennung würde den Verlauf über das Jahr unlesbar machen.
- **AK-6** Die Gewichtung lautet 50 / 15 / 35: Der Prozess wiegt weniger als später, weil er im ersten Sprint erst entsteht.

*Festgelegt vom Auftraggeber am 12.09.2026, Kriterien und Gewichtung ausgeschrieben in
docs/entwurf-planung-je-team.md, Kapitel 9. Der Auftraggeber hat dazu angemerkt, dass sich der
Satz nach den ersten Erfahrungen ändern wird – AK-3 hält diesen Weg offen.*

### FA-57 Bestand auf Schemastand 2 heben

`Muss` · 0.3.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich, dass mein bestehender Datenbestand beim ersten Start der neuen Fassung ohne Zutun weiterläuft,
damit eine Änderung am Datenmodell nicht die Aufzeichnungen eines laufenden Durchgangs kostet.

- **AK-1** Gegeben ein Bestand nach Schemastand 1, wenn er eingelesen wird, dann entsteht daraus ein Bestand nach Schemastand 2 mit unveränderten Punkten, Notizen und gesetzten Werten.
- **AK-2** Jeder bisherige Sprint wird zu einem Abschnitt der Art Sprint.
- **AK-3** Vor der Migration wird der bisherige Bestand unverändert gesichert (NFA-09).
- **AK-4** Die Migration läuft genau einmal und ist an der Schemanummer erkennbar.
- **AK-5** Schlägt sie fehl, bleibt der alte Bestand unangetastet und die Anwendung meldet das, statt leer zu starten.

*Behandelt Risiko R-01. Auf 0.3.0 gesetzt: Zum Zeitpunkt der Planung liegt kein Bestand im
Schemastand 1 vor (bestätigt am 10.09.2026). Entsteht der erste echte Datensatz bereits unter
0.2.0, wird diese Migration nie ausgeführt – der Mechanismus bleibt trotzdem nötig, weil jede
künftige Schemaänderung ihn braucht.*

### FA-68 Bestand auf Schemastand 3 heben

`Muss` · 0.4.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich meinen bisherigen Bestand ohne Verlust weiterverwenden,
damit ein laufendes Schuljahr eine Programmänderung übersteht.

- **AK-1** Zu jedem Abschnitt mit Teams entsteht je Team eine Planung mit Beginn und Ende des Abschnitts und leerem Ziel.
- **AK-2** Eine vorhandene Rubrikkopie am Abschnitt wird an jedes Team übernommen; der Zeitpunkt des Einfrierens bleibt erhalten.
- **AK-3** Punkte, Notizen, Rückmeldungen, Verstehensnachweise, Reflexionen, Peer-Urteile, gesetzte Werte und Notenstände bleiben unverändert.
- **AK-4** Vor der Umstellung wird der bisherige Stand unverändert gesichert (wie FA-57 AK-3).
- **AK-5** Ein migrierter Bestand ergibt **dieselben Prozentwerte, Notenvorschläge und Sperren** wie vorher. Der Probebestand aus dem Testlauf ist dafür der Prüfstein und liegt als Test bei.
- **AK-6** Die Migration läuft genau einmal und ist an der Schemanummer erkennbar; schlägt sie fehl, bleibt der alte Bestand unangetastet.

*Behandelt Risiko R-01. Zum Zeitpunkt dieser Planung liegen weiterhin keine echten Daten vor
(bestätigt am 12.09.2026); die Migration ist Absicherung, nicht Voraussetzung. AK-5 ist der
eigentliche Inhalt: Eine Umstellung, die Noten verschiebt, wäre keine Migration, sondern eine
stille Neubewertung.*

## 7 Bewertung erfassen

### FA-12 Team- und Prozesspunkte erfassen

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich je Sprint und Team Punkte zu allen Kriterien der Kategorien Team-Ergebnis und Scrum-Prozess vergeben,
damit die gemeinsame Leistung des Teams festgehalten ist.

- **AK-1** Punkte sind auf halbe Punkte genau erfassbar.
- **AK-2** Werte über dem Maximum werden auf das Maximum begrenzt, negative auf 0.
- **AK-3** Ein leeres Feld bedeutet „nicht bewertet“ und wird nicht als 0 gespeichert.

### FA-13 Individuellen Beitrag erfassen

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich für jede Person des Teams eigene Punkte zum individuellen Beitrag vergeben,
damit die Note trotz gemeinsamer Arbeit individuell bleibt.

### FA-14 Peer- und Selbsteinschätzung erfassen

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich festhalten, wie die Teammitglieder einander und sich selbst auf einer Skala von 1 bis 5 einschätzen,
damit ich eine Innensicht auf das Team bekomme, die ich von außen nicht habe.

- **AK-1** Die Urteile sind je bewertender Person getrennt erfasst.
- **AK-2** Ein fehlendes Einzelurteil zählt nicht als schlechteste Bewertung.

### FA-15 Selbsteinschätzung wahlweise einrechnen

`Soll` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich einstellen können, ob die Selbsteinschätzung in die Peer-Note eingeht oder nur zum Vergleich dient,
damit ich entscheiden kann, ob Selbstauskunft notenwirksam sein soll.

### FA-16 Notiz zum Sprint

`Soll` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich zu jedem Sprint und Team eine Freitextnotiz erfassen,
damit ich Beobachtungen festhalten kann, die keine Punktezahl abbildet.

### FA-17 Notiz je Person

`Soll` · 0.2.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich zu jeder Person und jedem Abschnitt eine Freitextnotiz erfassen,
damit ich für das Gespräch und die spätere Begründung konkrete Belege zur Hand habe.

- **AK-1** Zu jeder Person, die in einem Abschnitt bewertet wird, lässt sich ein Freitext erfassen; er wird ohne ausdrückliches Speichern übernommen (FA-19).
- **AK-2** Die Notiz gehört zu Person und Abschnitt und ist unabhängig von der Notiz an das Team (FA-16). Beide stehen nebeneinander.
- **AK-3** Eine geleerte Notiz wird nicht gespeichert; sie ist nicht dasselbe wie eine leere Zeichenkette im Bestand.
- **AK-4** Die Notiz ist eine Aufzeichnung der Lehrkraft: Sie erscheint weder in der Ausgabe an die Klasse (FA-39) noch im CSV-Export (FA-31).
- **AK-5** Die Notiz bleibt erhalten, solange Person und Abschnitt bestehen – auch wenn alle Punkte dieser Person wieder geleert werden.

*Grundlage: § 18 Abs. 1 SchUG – die Beurteilung stützt sich auf Aufzeichnungen der Lehrkraft.
Wechselt eine Person **innerhalb** eines Abschnitts das Team, bleiben Notiz und Einzelpunkte
bei der früheren Teambewertung; Teamwechsel sind zwischen Abschnitten vorgesehen, nicht
innerhalb (FA-58).*

### FA-18 Ergebnis läuft mit

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich beim Erfassen sofort sehen, wie sich das Ergebnis verändert,
damit ich merke, wenn eine Eingabe nicht das bewirkt, was ich beabsichtigt habe.

### FA-19 Kein ausdrückliches Speichern

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich, dass Eingaben ohne Speichern-Klick übernommen werden,
damit ich beim Bewerten nicht an die Bedienung denken muss.

### FA-20 Erfassung durch die Teams

`Zurückgestellt` · 0.5.0 · SH-2 · offen

Als Schülerin oder Schüler
möchte ich meine Peer-Einschätzung selbst eingeben, ohne fremde Bewertungen zu sehen,
damit meine Einschätzung unbeeinflusst bleibt und die Lehrkraft sie nicht abtippen muss.

*Abhängig von OP-F2 und OP-7; ohne Backend nur als Kioskbetrieb am Lehrergerät möglich.*

### FA-40 Verstehensnachweis erfassen

`Soll` · 0.3.0 · SH-1, SH-4 · umgesetzt

Als Lehrkraft
möchte ich je Person und Sprint festhalten, wie der mündliche Verstehensnachweis im Review ausgefallen ist,
damit ich belegen kann, dass die Person für den eingebrachten Code einstehen konnte.

- **AK-1** Erfasst werden eine Einstufung in vier Stufen – **sicher, überwiegend, teilweise, nicht** – und ein kurzer Freitext. Der Freitext ist freiwillig.
- **AK-2** Der Verstehensnachweis geht als eigener Anteil in den individuellen Beitrag ein: Die Kriterien der Kategorie tragen 70 %, der Nachweis 30 %. Der Anteil ist einstellbar.
- **AK-3** Liegt kein Verstehensnachweis vor, zählt der individuelle Beitrag unverändert aus seinen Kriterien – ein fehlender Nachweis ist kein misslungener (ADR-004).
- **AK-4** Die Einstufung erscheint in der Belegfassung (FA-32), nicht in der Rückmeldung an die Person (FA-42).

*Grundlage: Fachkonzept 8.3. Stufen und Anteil entschieden am 11.09.2026: vier Stufen
(100/67/33/0 %) und 30 % Anteil – spürbar, aber ein schwaches Review kippt die Note nicht
allein.*

### FA-41 Reflexionsnotiz der Person

`Soll` · 0.3.0 · SH-2 · umgesetzt

Als Schülerin oder Schüler
möchte ich am Sprintende kurz festhalten, was ich beigetragen und gelernt habe und was ich mir vornehme,
damit meine Sicht in die Beurteilung eingeht und ich im Folgesprint daran anknüpfen kann.

- **AK-1** Die Notiz wird der Person und dem Abschnitt zugeordnet und bleibt dauerhaft sichtbar.
- **AK-2** Erfassung erfolgt in der ersten Ausbaustufe durch die Lehrkraft.
- **AK-3** Sie geht in keine Rechnung ein: Die Sicht der Person ist Grundlage des Gesprächs, nicht ein Prozentwert.
- **AK-4** Sie erscheint in der Belegfassung (FA-32), damit im Anlassfall belegbar ist, dass die Sicht der Person erhoben wurde.

### FA-44 Rückmeldung des Auftraggebers erfassen

`Soll` · 0.5.0 · SH-5 · geplant

Als Lehrkraft
möchte ich die Rückmeldung des Auftraggebers je Sprint und Team festhalten, samt Kennzeichnung ihrer Herkunft,
damit sie in die Beurteilung eingehen kann, ohne mit meiner eigenen Beobachtung verwechselt zu werden.

- **AK-1** Erfasst werden eine Einstufung der Zufriedenheit und ein Freitext.
- **AK-2** Die Herkunft ist gekennzeichnet: eigene Beobachtung oder übernommene Fremdangabe (siehe FA-43).
- **AK-3** Die Rückmeldung geht als eigener, gering gewichteter Anteil ein, nicht in die Produktrubrik.

*Behandelt Risiko R-05.*

---

## 8 Berechnung

### FA-21 Kategorieergebnis

`Muss` · 0.1.0 · SH-4 · umgesetzt

Als Lehrkraft
möchte ich, dass je Kategorie nur die ausgefüllten Kriterien in Zähler und Nenner eingehen,
damit ein Zwischenstand aussagekräftig ist und nicht systematisch zu niedrig.

- **AK-1** Sind keine Kriterien ausgefüllt, gibt es kein Kategorieergebnis – nicht 0 %.

### FA-22 Peer-Werte in Prozent

`Muss` · 0.1.0 · SH-4 · umgesetzt

Als Lehrkraft
möchte ich, dass Peer-Werte der Skala 1 bis 5 linear auf 0 bis 100 Prozent abgebildet werden,
damit sie mit den punktebasierten Kategorien vergleichbar sind.

- **AK-1** 1 entspricht 0 %, 5 entspricht 100 %.

### FA-23 Sprintergebnis

`Muss` · 0.1.0 · SH-1, SH-4 · umgesetzt

Als Lehrkraft
möchte ich, dass fehlende Kategorien aus der Gewichtung herausgerechnet und nicht als 0 gewertet werden,
damit eine Lücke in der Erhebung nicht wie ein Leistungsmangel aussieht.

- **AK-1** Das Sprintergebnis ist das gewichtete Mittel der vorhandenen Kategorieergebnisse.
- **AK-2** Kategorien mit Gewicht 0 bleiben unberücksichtigt und gelten nicht als fehlend.

*Begründet in ADR-004.*

### FA-24 Gesamtergebnis über den Projektzeitraum

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich, dass sich das Gesamtergebnis als mit dem Sprintfaktor gewichtetes Mittel der Sprintergebnisse bildet,
damit der Lernsprint weniger zählt als die übrigen Sprints.

- **AK-1** Sprints ohne Ergebnis und Sprints mit Faktor 0 bleiben unberücksichtigt.
- **AK-2** Die Sprintlänge geht nicht in den Faktor ein: Alle Sprints zählen gleich, außer dem Lernsprint mit 0,5.
- **AK-3** Das Gewicht eines Sprints ist das Produkt aus Sprintfaktor und Zeitfaktor (FA-54).
- **AK-4** Die Rechnung läuft je Strang; der Gesamtstand entsteht erst darüber (FA-59).

### FA-54 Zeitfaktor: der zuletzt erreichte Leistungsstand wiegt schwerer

`Muss` · 0.3.0 · SH-1, SH-4 · umgesetzt

Als Lehrkraft
möchte ich, dass spätere Sprints eines Beurteilungszeitraums stärker in den Gesamtstand eingehen als frühere,
damit die Beurteilung § 20 Abs. 1 LBVO entspricht und die Entwicklung einer Person abbildet statt ihres Durchschnitts.

- **AK-1** Die zweite Hälfte der **Abschnitte** eines Beurteilungszeitraums erhält den Zeitfaktor 2, die erste den Zeitfaktor 1.
- **AK-2** Bei ungerader Abschnittszahl wird zugunsten der späteren aufgerundet: bei 5 Abschnitten tragen 3 den Faktor 2.
- **AK-2a** Die Diplomarbeitsvorbereitung zählt dabei als Abschnitt wie ein Sprint (FA-56).
- **AK-3** Der Zeitfaktor wird je Beurteilungszeitraum bestimmt (FA-48), nicht über den gesamten Projektzeitraum.
- **AK-4** Zeitfaktor und Sprintfaktor bleiben getrennt gespeichert und werden getrennt ausgewiesen; das Gewicht ist ihr Produkt.
- **AK-5** Gegeben zwei Personen mit spiegelbildlichem Verlauf – eine steigend, eine fallend, gleiches arithmetisches Mittel –, wenn der Gesamtstand gebildet wird, dann liegen die beiden Werte auseinander.
- **AK-6** Der Faktor der zweiten Hälfte ist einstellbar; Vorgabe 2. Der Wert 1 ist zulässig, aber als Abweichung von § 20 Abs. 1 LBVO gekennzeichnet.

*Entschieden mit OP-F4 am 10.09.2026. Rechtsgrundlage Q1 im Fachkonzept, Kap. 14. Die
erwarteten Werte für neun Verläufe stehen in [Testfälle zur Notenfindung](testfaelle-notenfindung.md).*

### FA-25 Notenvorschlag aus Prozent

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich aus dem Gesamtstand über den eingestellten Schlüssel einen Notenvorschlag erhalten,
damit ich eine einheitliche Orientierung habe, ohne die Note aus der Hand zu geben.

- **AK-1** Es gilt die beste Note, deren untere Grenze erreicht ist.
- **AK-2** Ohne Gesamtstand gibt es keinen Vorschlag.
- **AK-4** Eine Sperre nach FA-61 geht dem Schlüssel vor.
- **AK-3** Der Vorschlag ist als Vorschlag gekennzeichnet und wird **nicht** als Note gespeichert (G8).

### FA-26 Fehlendes benennen

`Soll` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich beim Erfassen sehen, welche Kategorien noch offen sind,
damit ich nicht ein Zwischenergebnis für ein Endergebnis halte.

### FA-27 Auffällige Selbsteinschätzung melden

`Kann` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich darauf hingewiesen werden, wenn Selbst- und Fremdeinschätzung deutlich auseinanderliegen,
damit ich das Gespräch suchen kann, statt es zu übersehen.

- **AK-1** Ein Hinweis erscheint ab 20 Prozentpunkten Abweichung.

### FA-45 Peer-Werte als gedeckelter Korrekturfaktor

`Soll` · 0.3.0 · SH-2 · umgesetzt

Als Schülerin oder Schüler
möchte ich, dass die Einschätzung meiner Teammitglieder meine Note nur begrenzt verändern kann,
damit eine Absprache oder ein persönlicher Konflikt im Team meine Beurteilung nicht bestimmt.

- **AK-1** Der Peer-Anteil geht nicht als gewichtete Kategorie ein, sondern verändert das Sprintergebnis um höchstens ±5 Prozentpunkte.
- **AK-2** Gegeben ein Peer-Ergebnis von 50 %, wenn der Korrekturfaktor angewendet wird, dann bleibt das Sprintergebnis unverändert – 50 % ist der neutrale Punkt.
- **AK-3** Liegt kein Peer-Ergebnis vor, bleibt das Sprintergebnis unverändert.
- **AK-4** Die Deckelung ist einstellbar; Vorgabe ±5 Prozentpunkte.

*Entschieden mit OP-F2 am 10.09.2026. Behandelt Risiko R-04. Löst die bisherige lineare
Einrechnung über das Kategoriegewicht ab (FA-07).*

### FA-52 Peer-Bewertung je Sprint zuschalten

`Muss` · 0.2.0 · SH-1, SH-2 · umgesetzt

Als Lehrkraft
möchte ich je Sprint entscheiden, ob eine Peer-Bewertung stattfindet,
damit ich sie erst einsetze, wenn das Team nach Sprintlogik arbeitet und die Einschätzung eine gemeinsame Grundlage hat.

- **AK-1** Die Peer-Bewertung ist je Sprint ein- und ausschaltbar; Vorgabe für einen neuen Sprint ist **aus**.
- **AK-2** Ist sie ausgeschaltet, wird die Peer-Erfassung nicht angeboten und der Korrekturfaktor ist 0 (FA-45 AK-3).
- **AK-3** Bereits erfasste Peer-Werte bleiben beim Ausschalten erhalten und gehen nicht in die Rechnung ein.
- **AK-4** Der Schalterstand je Sprint bleibt gespeichert und erscheint in der Belegfassung (FA-32).
- **AK-5** Die Rubrik bleibt gültig, auch wenn sie Peer-Kriterien enthält, die in diesem Sprint nicht verwendet werden.

### FA-53 Nachfrage am Ende der Sprintbewertung

`Soll` · 0.3.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich am Ende jeder Sprintbewertung gefragt werden, ob die Peer-Bewertung ab dem nächsten Sprint laufen soll,
damit ich die Entscheidung bewusst treffe, statt sie zu vergessen.

- **AK-1** Gegeben eine Klasse, in der alle Teams des Sprints ein Sprintergebnis haben, wenn die Bewertung dieses Sprints abgeschlossen wird, dann erscheint die Frage.
- **AK-2** Die Frage erscheint nicht, solange die Peer-Bewertung bereits eingeschaltet ist.
- **AK-3** Die Frage blockiert nichts; sie lässt sich übergehen und erscheint dann beim nächsten Sprint erneut.
- **AK-4** Die Antwort wird mit Sprint und Datum festgehalten, damit nachvollziehbar bleibt, ab wann Peer-Werte einfließen.
- **AK-5** Die Entscheidung trifft ausschließlich die Lehrkraft; die Anwendung schlägt weder einen Zeitpunkt vor noch schaltet sie selbst um.
- **AK-6** Ein „ja“ schaltet den **nächsten bereits angelegten** Abschnitt desselben Strangs ein. Für erst später angelegte Abschnitte bleibt die Vorgabe „aus“ (FA-52 AK-1) – der Schalter ist dort von Hand zu setzen.
- **AK-7** Ein übergangenes „später“ wird wie eine Antwort festgehalten, damit die Frage nach einem Neuladen nicht erneut zu diesem Abschnitt erscheint.

*Entschieden am 10.09.2026: Der Zeitpunkt hängt an der Einschätzung der Lehrkraft, nicht an
einem berechneten Kriterium. Die Anwendung erinnert, sie entscheidet nicht.*

---

## 9 Auswertung, Ausgabe und Sicherung

### FA-28 Klassenübersicht

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich je Person das Ergebnis jedes Sprints, den Gesamtstand, den Notenvorschlag und den eingetragenen Notenstand auf einen Blick sehen,
damit ich die Noten der ganzen Klasse in einem Arbeitsgang festlegen kann.

- **AK-1** Vorschlag und eingetragener Notenstand sind unterscheidbar dargestellt.
- **AK-2** Gesetzte Werte sind als solche erkennbar (FA-50).

### FA-29 Teamübersicht

`Soll` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich die Teams im Mittel vergleichen können,
damit mir auffällt, wenn ein Team systematisch zurückbleibt.

### FA-30 Notenverteilung

`Soll` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich die Verteilung der eingetragenen Notenstände sehen,
damit ich prüfen kann, ob mein Notenschlüssel zum tatsächlichen Leistungsbild passt.

- **AK-1** Grundlage sind die eingetragenen Notenstände, nicht die Vorschläge.
- **AK-2** Personen ohne eingetragenen Notenstand werden gesondert ausgewiesen.

### FA-31 CSV-Export

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich die Klassenübersicht als CSV-Datei exportieren,
damit ich die Noten in meine übrigen Unterlagen übernehmen kann.

- **AK-1** Trennzeichen ist der Strichpunkt, Kodierung UTF-8 mit BOM.
- **AK-2** Dezimaltrennzeichen ist das Komma.
- **AK-3** Nicht bewertete Sprints erscheinen als leere Zelle, nicht als 0.
- **AK-4** Der Export enthält Prozentwerte und den eingetragenen Notenstand, keine berechnete Note.

### FA-32 Belegfassung je Person

`Soll` · 0.3.0 · SH-3, SH-4 · umgesetzt

Als Lehrkraft
möchte ich zu jeder Person auf Verlangen eine vollständige Herleitung ihres Stands erzeugen können,
damit ich die Beurteilung im Anlassfall belegen kann, ohne sie aus dem Gedächtnis zu rekonstruieren.

- **AK-1** Gegeben eine Person mit mindestens einem bewerteten Sprint, wenn die Belegfassung erzeugt wird, dann enthält sie je Kategorie die Kriterien, die vergebenen Punkte und den Prozentwert.
- **AK-2** Nicht bewertete Kategorien erscheinen als „nicht bewertet“, nicht als 0.
- **AK-3** Gesetzte Werte sind als solche ausgewiesen, samt berechnetem Vergleichswert und – sofern erfasst – Begründung (FA-50).
- **AK-4** Notenvorschlag und eingetragener Notenstand sind beide ausgewiesen.
- **AK-5** Die Belegfassung enthält keine internen Bezeichner oder IDs und ist ohne Fachkenntnis lesbar.
- **AK-6** Je Abschnitt sind die zugrunde liegende Rubrik und das Team der Person ausgewiesen (FA-55, FA-58).
- **AK-7** Bei Tests enthält sie das Bewertungsschema der offenen Frage (FA-60 AK-6).

*Behandelt Risiko R-02. Nicht zu verwechseln mit der Rückmeldung an die Person (FA-42) –
Fachkonzept 8.6 unterscheidet die beiden.*

### FA-33 Datenbestand sichern und einlesen

`Muss` · 0.1.0 · SH-1, SH-7 · umgesetzt

Als Lehrkraft
möchte ich den gesamten Datenbestand als Datei sichern und wieder einlesen können,
damit ich das Gerät wechseln kann und nicht von einem Browserprofil abhängig bin.

- **AK-1** Die Sicherung ist verlustfrei: Einlesen stellt den Stand vollständig wieder her.
- **AK-2** Eine fremde oder beschädigte Datei wird mit verständlicher Meldung abgewiesen.

### FA-39 Rubrik zur Ausgabe an die Klasse

`Soll` · 0.2.0 · SH-2 · umgesetzt

Als Schülerin oder Schüler
möchte ich die Bewertungskriterien vor dem Sprint schriftlich erhalten,
damit ich meine Arbeit danach ausrichten kann und die Note nachher keine Überraschung ist.

- **AK-1** Die Ausgabe enthält alle Kriterien mit Beschreibung, Punktemaxima, Kategoriegewichten und Notenschlüssel.
- **AK-2** Sie enthält keine Namen und keine erfassten Bewertungen.
- **AK-3** Sie ist druck- oder weitergabefähig.
- **AK-4** Sie gilt für einen Abschnitt und zeigt die dort tatsächlich geltende Rubrik – nach dem Einfrieren die Kopie (FA-65), vorher die zugeordnete Rubrik.
- **AK-5** Sie nennt, ob in diesem Abschnitt peer-bewertet wird (FA-52), damit die Ausgabe nicht mehr verspricht als gilt.
- **AK-6** Für einen Test (FA-60) wird sie nicht angeboten: Dort **sind** die Kriterien die Fragen, eine Ausgabe vorab hebt den Test auf. Das Bewertungsschema der offenen Frage wird nach der Rückgabe besprochen.
- **AK-7** Kategorien ohne Kriterien erscheinen nicht; eine Kategorie ohne Gewicht wird als nicht zählend ausgewiesen, statt sie stillschweigend wegzulassen.

*Grundlage: Fachkonzept G1. Behandelt Risiko R-02.*

### FA-42 Rückmeldung je Person vor der Note

`Soll` · 0.3.0 · SH-2 · umgesetzt

Als Schülerin oder Schüler
möchte ich nach jedem Sprint kurz erfahren, wo ich stehe, was gut ist und woran ich arbeiten soll,
damit ich im Folgesprint noch etwas ändern kann.

- **AK-1** Die Rückmeldung beantwortet drei Fragen: Stand, zwei bis drei Stärken, ein bis zwei Entwicklungsfelder.
- **AK-2** Sie enthält **keine Punktetabelle** und keine Herleitung – höchstens einen Prozentwert als Einordnung (G10).
- **AK-3** Sie enthält weder Note noch Notenvorschlag.
- **AK-4** Es ist erkennbar, für welche Personen die Rückmeldung eines Sprints noch aussteht.

*Grundlage: Fachkonzept G5 und G10. Die vollständige Herleitung ist die Belegfassung (FA-32)
und geht nicht an die Person.*

### FA-48 Auswertung zu einem Stichtag

`Soll` · 0.3.0 · SH-1, SH-4 · umgesetzt

Als Lehrkraft
möchte ich die Auswertung auf die bis zu einem Stichtag abgeschlossenen Sprints einschränken können,
damit ich zu jedem der drei Zeitpunkte im Jahr nach denselben Regeln einen Stand bilden kann.

- **AK-1** Die Einschränkung wirkt auf Einzelergebnisse, Teamvergleich, Notenverteilung und Export.
- **AK-2** Nach dem Stichtag liegende Abschnitte bleiben erhalten und erscheinen nur nicht in der Auswertung.
- **AK-3** Der gewählte Stichtag ist in der Ausgabe erkennbar.
- **AK-4** Drei Stichtage sind vorgesehen: Ende Jänner (Semesterzeugnis), Ende April (Frühwarnung, Ende der Sprintphase), Anfang Juni (Jahreszeugnis).
- **AK-5** Der Stichtag Ende April erzeugt keinen Beurteilungszeitraum; er wertet den laufenden aus.
- **AK-6** Zugeordnet wird nach dem **Ende**. Ab 0.4.0 ist das für einen Sprint das Enddatum **des Teams** (FA-66), für einen Test das des Abschnitts. Ohne Enddatum ist keine Zuordnung möglich: Das Team bleibt in der Stichtagsauswertung außen vor und wird dabei ausdrücklich genannt – weder stilles Weglassen noch stilles Mitzählen.
- **AK-6a** Damit kann derselbe Sprint für ein Team in den Beurteilungszeitraum fallen und für ein anderes nicht. Das ist die Folge unterschiedlicher Enddaten und keine Ungenauigkeit; die Auswertung muss es erkennbar machen, weil danach gefragt werden wird. Siehe OP-F18 für den Fall eines Sprints, der über den Stichtag hinausläuft.
- **AK-7** Der Zeitfaktor (FA-54) wird innerhalb des gewählten Zeitraums neu bestimmt; ein Semester ist eine eigene Zeitreihe.

*Grundlage: Fachkonzept 3.3 und 3.4. Der Stichtag Ende April dient der Frühwarnung nach
§ 19 Abs. 3a SchUG (Q6): Er ist der letzte Zeitpunkt, zu dem eine Warnung im zweiten Semester
noch etwas bewirken kann.*

### FA-49 Notenstand eintragen

`Muss` · 0.3.0 · SH-1, SH-4 · umgesetzt

Als Lehrkraft
möchte ich den Notenstand je Person selbst eintragen,
damit die Beurteilung meine Entscheidung bleibt und nicht das Ergebnis einer Rechnung ist.

- **AK-1** Der Notenstand ist die einzige Stelle im Datenbestand, an der eine Ziffer 1 bis 5 steht (G8).
- **AK-2** Ein Notenstand kann eingetragen werden, ohne dass ein Gesamtstand vorliegt.
- **AK-3** Weicht der Notenstand vom Vorschlag ab, bleiben beide Werte erhalten und die Abweichung ist erkennbar.
- **AK-4** Zum Notenstand kann eine Begründung erfasst werden; sie ist nicht verpflichtend.
- **AK-5** Notenstände sind je Stichtag getrennt führbar (Semester, Jahr – siehe FA-48).

### FA-50 Werte auf jeder Ebene setzen

`Muss` · 0.3.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich auf jeder Ebene der Bewertung einen Wert unmittelbar setzen können, ohne die Ebene darunter auszufüllen,
damit ich dort, wo ich sicher bin, nicht den Umweg über Einzelpunkte gehen muss.

- **AK-1** Setzbar sind: Kategorieergebnis, Sprintergebnis je Person, Gesamtstand je Person.
- **AK-2** Ein gesetzter Wert **ersetzt den berechneten nicht**; beide bleiben gespeichert und sind unterscheidbar (G9).
- **AK-3** Liegt ein gesetzter Wert vor, gilt dieser für alle darüberliegenden Ebenen und für die Ausgabe.
- **AK-4** Eine spätere Änderung der Ebene darunter verdrängt einen gesetzten Wert nicht; die Abweichung wird erkennbar.
- **AK-5** Zu jedem gesetzten Wert kann eine Begründung erfasst werden; sie ist nicht verpflichtend.
- **AK-6** Ein gesetzter Wert lässt sich wieder entfernen, worauf der berechnete gilt.

### FA-51 Zurückhaltende Darstellung

`Soll` · 0.3.0 · SH-1, SH-2 · umgesetzt

Als Lehrkraft
möchte ich standardmäßig nur den Wert und seine Einordnung sehen und die Herleitung erst auf Abruf,
damit mich die Zahlenmenge beim Bewerten nicht von der Einschätzung ablenkt.

- **AK-1** Die Standardansicht einer Person zeigt Stand, Tendenz und offene Kategorien – nicht die Punktetabelle.
- **AK-2** Die vollständige Herleitung ist mit einem Schritt erreichbar.
- **AK-3** Die Einstellung wirkt nur auf die Anzeige, nie auf die gespeicherten Daten.

### FA-64 Automatische Sicherung in einen gewählten Ordner

`Soll` · 0.2.0 · SH-1, SH-7 · umgesetzt

Als Lehrkraft
möchte ich einen Ordner einmal auswählen und die Sicherung danach ohne mein Zutun geschrieben bekommen,
damit die tägliche Sicherung nicht an meiner Erinnerung hängt.

- **AK-1** Der Zielordner wird einmal ausgewählt; die Anwendung behält ihn über Sitzungen hinweg.
- **AK-2** Nach einer Änderung wird die Tagesdatei `pre-syp-prp-JJJJ-MM-TT.json` in diesen Ordner geschrieben, ohne dass ein Dialog erscheint.
- **AK-3** Innerhalb eines Tages wird dieselbe Datei fortgeschrieben; Dateien früherer Tage werden nie überschrieben (FA-46 AK-4).
- **AK-4** Der Zeitpunkt der letzten **erfolgreichen** Sicherung ist dauerhaft in der Oberfläche sichtbar, nicht nur als abweisbare Meldung.
- **AK-5** Gegeben eine entzogene Berechtigung oder ein nicht mehr erreichbarer Ordner, wenn eine Sicherung ansteht, dann meldet die Anwendung das deutlich und fällt auf FA-46 zurück – ein stilles Fehlschlagen ist unzulässig.
- **AK-6** Ist die Berechtigung nach einem Neuladen zu bestätigen, wird das einmal je Sitzung erfragt und nicht bei jeder Änderung.
- **AK-7** In Browsern ohne die erforderliche Schnittstelle bleibt es beim manuellen Export (FA-33); die Anwendung sagt das, statt die Funktion anzubieten und scheitern zu lassen.
- **AK-8** Es entsteht keine Netzwerkverbindung; geschrieben wird eine lokale Datei (NFA-03).

*Behandelt Risiko R-01 (kritisch) – die wirksamste Einzelmaßnahme dagegen. Setzt die File
System Access API voraus und ist damit auf Chromium-Browser beschränkt (ADR-011, NFA-05).
Liegt der gewählte Ordner im schulischen Sync-Ordner, erfüllt sich DS-06 von selbst.*

### FA-46 Erinnerung an die Sicherung

`Soll` · 0.2.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich erinnert werden, wenn ich längere Zeit keine Sicherung erstellt habe,
damit mich ein gelöschter Browserspeicher nicht die Noten eines ganzen Durchgangs kostet.

- **AK-1** Wurde am laufenden Tag etwas geändert und noch keine Sicherung erzeugt, erscheint ein Hinweis.
- **AK-2** Der Hinweis ist abweisbar und blockiert die Arbeit nicht.
- **AK-3** Die Anwendung merkt sich Zeitpunkt und Umfang der letzten Sicherung und zeigt beides an.
- **AK-4** Der Dateiname trägt das Datum, damit eine Sicherung keine frühere überschreibt (`pre-syp-prp-JJJJ-MM-TT.json`).
- **AK-5** Liegt die letzte Sicherung mehr als drei Tage zurück, ist der Hinweis deutlicher; abweisbar bleibt er.
- **AK-6** Ist die automatische Sicherung eingerichtet und erfolgreich (FA-64), entfällt der Hinweis. Ist sie eingerichtet und fehlgeschlagen, erscheint er verschärft.

*Behandelt Risiko R-01 (kritisch). Der Tagesrhythmus folgt der Festlegung vom 10.09.2026:
Es wird täglich in den schulischen Speicher gesichert (DS-06). Damit ist OP-R2 – nach welcher
Schwelle erinnert wird – entschieden.*

---

## 10 Bedienung

### FA-34 Vier Bereiche

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich die Anwendung in Bewerten, Auswertung, Klassen & Teams sowie Rubrik & Notenschlüssel gegliedert vorfinden,
damit ich beim Bewerten nicht suchen muss.

### FA-35 Auswahl merken

`Soll` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich beim nächsten Öffnen dort weitermachen, wo ich aufgehört habe,
damit ich Klasse, Sprint und Team nicht jedes Mal neu einstellen muss.

### FA-36 Löschen bestätigen

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich, dass Löschvorgänge eine zweite Bestätigung verlangen,
damit ein Fehlklick keine Bewertungen vernichtet.

### FA-37 Deutschsprachige Oberfläche

`Muss` · 0.1.0 · SH-1 · umgesetzt

Als Lehrkraft
möchte ich eine vollständig deutschsprachige Oberfläche,
damit ich sie im Anlassfall auch Eltern zeigen kann.

### FA-38 Tastaturbedienung

`Soll` · 0.5.0 · SH-1 · geplant

Als Lehrkraft
möchte ich die Erfassung vollständig mit der Tastatur bedienen können,
damit das Eintragen vieler Punkte zügig geht.

- **AK-1** Von Feld zu Feld führt die Tabulatortaste in der Lesereihenfolge.
- **AK-2** Jedes Bedienelement ist mit sichtbarem Fokus erreichbar.

---

## 11 Nicht-funktionale Anforderungen

Nicht-funktionale Anforderungen folgen keiner Satzschablone (siehe
[Methodik, Kap. 4.3](anforderungs-und-loesungsmanagement.md)). Jede nennt ein messbares
Kriterium und das Verfahren, mit dem es geprüft wird.

### NFA-01 Erfassungsdauer

`Muss` · 0.1.0 · SH-1 · umgesetzt

Ein Team ist in einem Sprint in höchstens 5 Minuten vollständig bewertbar.
**Prüfung:** Zeitmessung mit einem echten Datensatz.

### NFA-02 Nachvollziehbarkeit der Rechnung

`Muss` · 0.1.0 · SH-4 · umgesetzt

Jeder angezeigte Prozentwert ist aus den erfassten Punkten und der dokumentierten Formel reproduzierbar.
**Prüfung:** Rechenweg im Solution Design, Unit-Tests der Berechnungslogik.

### NFA-03 Keine Datenübertragung

`Muss` · 0.1.0 · SH-7 · umgesetzt

Die Anwendung baut keine Netzwerkverbindung auf. Personenbezogene Daten werden ausschließlich lokal gespeichert und von der Anwendung an keinen Server übertragen. Davon unberührt ist die Sicherungsdatei, die die Lehrkraft selbst ablegt (DS-06).
**Prüfung:** E2E-Test überwacht ausgehende Netzwerkaufrufe; keine Backend-Aufrufe im Quellcode.

### NFA-04 Offlinefähigkeit

`Muss` · 0.1.0 · SH-1 · umgesetzt

Nach dem ersten Laden funktioniert die Anwendung ohne Internetverbindung.
**Prüfung:** manueller Offline-Test.

### NFA-05 Browserunterstützung

`Soll` · 0.1.0 · SH-1 · umgesetzt

Lauffähig in den jeweils letzten zwei Hauptversionen von Chrome, Edge und Firefox. Einzelne Zusatzfunktionen dürfen an Schnittstellen hängen, die nicht überall vorhanden sind – die Anwendung bleibt dann ohne sie vollständig bedienbar und weist darauf hin (derzeit FA-64).
**Prüfung:** Playwright-Matrix; zusätzlich ein Durchlauf ohne die File System Access API.

### NFA-06 Testabdeckung der Berechnung

`Muss` · 0.1.0 · SH-4 · umgesetzt

Die Berechnungslogik ist frei von Oberflächenbezügen und zu mindestens 90 % durch Unit-Tests abgedeckt.
**Prüfung:** Abdeckungsbericht in der Pipeline.

### NFA-07 Qualitätssicherung vor Zusammenführung

`Muss` · 0.1.0 · SH-1 · umgesetzt

Kein Stand gelangt auf `main`, der Linting, Typprüfung oder Tests nicht besteht.
**Prüfung:** Branch Protection mit erforderlichen Statusprüfungen.

### NFA-08 Barrierefreiheit

`Soll` · 0.5.0 · SH-1 · geplant

Farbkontraste erfüllen WCAG 2.1 AA; Information wird nie allein über Farbe vermittelt.
**Prüfung:** Kontrastwerkzeug, Sichtprüfung der Notenanzeige ohne Farbe.

### NFA-09 Robustheit der Persistenz

`Muss` · 0.1.0 · SH-1 · umgesetzt

Ein beschädigter oder veralteter gespeicherter Bestand führt nicht zum Absturz, sondern zu einer verständlichen Meldung; der unlesbare Stand wird gesichert statt überschrieben.
**Prüfung:** Unit-Tests mit manipulierten Daten.

### NFA-10 Auslieferungsgröße

`Kann` · 0.1.0 · SH-1 · umgesetzt

Die ausgelieferte Anwendung ist ohne Medien kleiner als 500 kB (gzip).
**Prüfung:** Größenprüfung im Build.

---

## 12 Datenschutz

### DS-01 Datensparsamkeit

`Muss` · 0.1.0 · SH-7 · umgesetzt

Gespeichert werden ausschließlich Name, Klassen- und Teamzuordnung sowie Bewertungsdaten. Keine Kontaktdaten, keine Geburtsdaten, keine Kennungen aus Schulsystemen.
**Prüfung:** Durchsicht des Datenmodells in `src/domain/types.ts` bei jeder Schemaänderung.

### DS-02 Verbleib der Daten

`Muss` · 0.1.0 · SH-7 · umgesetzt

Der Arbeitsbestand verbleibt im Browser des Anwendergeräts. Die Anwendung überträgt nichts an Dritte. Die Sicherungsdatei verlässt das Gerät nur durch eine bewusste Handlung der Lehrkraft und nur in den schulischen Speicher (DS-06).
**Prüfung:** E2E-Test überwacht ausgehende Netzwerkaufrufe während der Bedienung.

### DS-03 Auskunft und Löschung

`Muss` · 0.1.0 · SH-7 · umgesetzt

Der Datenbestand kann jederzeit vollständig exportiert und vollständig gelöscht werden.
**Prüfung:** Unit-Tests der Persistenz.

### DS-04 Vertraulichkeit der Peer-Urteile

`Muss` · 0.1.0 · SH-2 · umgesetzt

Wer wen wie eingeschätzt hat, ist nur der Lehrkraft zugänglich. Gegenüber Schülerinnen und Schülern werden Peer-Ergebnisse nur aggregiert dargestellt.
**Prüfung:** Sichtprüfung der Ausgaben nach FA-32 und FA-39.

### DS-05 Hinweis beim Export

`Soll` · 0.1.0 · SH-7 · umgesetzt

Beim Erzeugen einer Sicherung wird darauf hingewiesen, dass die Datei Klartext enthält und wie eine Notenliste zu behandeln ist.
**Prüfung:** Sichtprüfung beim Export.

### DS-06 Ablageort der Sicherung

`Muss` · 0.2.0 · SH-7 · umgesetzt

Die Sicherungsdatei wird ausschließlich im schulischen Speicher abgelegt, für den der Schulerhalter verantwortlich ist – nicht in einem privat genutzten Cloud-Dienst. Sie ist wie eine geführte Notenliste zu behandeln: Zugriff nur durch die Lehrkraft.
**Prüfung:** Sichtprüfung des Ablageorts bei der Aktualitätsprüfung der Dokumente; Hinweistext beim Export (DS-05).

---

## 13 Rahmenbedingungen

| ID | Rahmenbedingung | Wessen Bedürfnis |
|---|---|---|
| **RB-01** | Es gibt ein Anforderungsdokument, das in Versionen geführt wird | Lehrender und künftiger Wartender |
| **RB-02** | Es gibt ein Solution Design, das in Versionen geführt wird | dito |
| **RB-03** | Die Software wird in Versionen erstellt und in GitHub verwaltet | dito |
| **RB-04** | Jede Version wird über eine CI/CD-Pipeline für Tests deployed | dito |
| **RB-05** | Ein Anwender pro Installation; kein Mehrbenutzerbetrieb, keine Anmeldung | Anwender, Datenschutz |
| **RB-06** | Kein eigener Server, keine laufenden Kosten; statische Auslieferung | Anwender, Schulerhalter |
| **RB-07** | Es gibt eine Stakeholderanalyse, die aktuell gehalten wird | Auftraggeber |
| **RB-08** | Es gibt eine Risikoanalyse, die aktuell gehalten wird | Auftraggeber, Schulleitung |
| **RB-09** | Es gibt ein Product Goal, das aktuell gehalten wird | Auftraggeber |
| **RB-10** | Die Aktualität aller geführten Dokumente ist maschinell prüfbar und Teil der Pipeline | Auftraggeber |

**Zum Zweck von RB-01 bis RB-04 und RB-07 bis RB-10:** Nach dem Maßstab des geringsten
Aufwands wären diese Rahmenbedingungen für ein Werkzeug mit einem Anwender nicht zu
rechtfertigen. Sie bedienen einen anderen Stakeholder als den Anwender: die Lehrkraft, die
ein vorzeigbares Beispiel für den Unterricht braucht, und dieselbe Person in einem Jahr, die
das Werkzeug noch warten können muss. Dieser Zweck ist hier festgehalten, damit ein späterer
Leser den Aufwand nicht für unbegründet hält und abbaut.

---

## 14 Annahmen

| Nr. | Annahme |
|---|---|
| A-1 | Eine Klasse umfasst höchstens 40 Personen, ein Durchgang höchstens 12 Sprints. |
| A-2 | Die Lehrkraft arbeitet an einem Gerät und einem Browserprofil; für den Gerätewechsel dient der Export. |
| A-3 | Peer-Bewertung und Reflexionsnotiz werden zunächst von der Lehrkraft eingetragen. |
| A-4 | Der Auftraggeber der Schülerprojekte bedient die Software nicht; seine Rückmeldung wird stellvertretend erfasst. |
| A-5 | Ein Durchgang läuft vom 1. Oktober bis 30. April: rund 25 Arbeitswochen zu je 3 Schulstunden, sieben bis neun Sprints von 2 bis 4 Wochen. |
| A-6 | Der Zeitraum überspannt die Semestergrenze; es sind zwei Feststellungen zu bilden (Ende Jänner, Ende April). |
| A-7 | Die Sprintbeurteilungen sind Mitarbeitsfeststellungen; jeder Sprint wird bewertet. Eine formale Ankündigung ist nicht erforderlich, wohl aber Auskunft über den Leistungsstand (FA-42). |

---

## 15 Offene Punkte

| Nr. | Frage | Zu klären mit | Status |
|---|---|---|---|
| OP-1 | Anonymisierte Rückmeldung der Peer-Ergebnisse an die Schülerinnen und Schüler? | Auftraggeber | zurückgestellt bis die Peer-Bewertung zugeschaltet ist (FA-52); gleichlautend mit OP-F5 und OP-S1 |
| OP-2 | Gemeinsame Nutzung durch mehrere Lehrkräfte? Würde RB-05 und RB-06 aufheben. | Auftraggeber | **entschieden 2026-09-10: nein. Betrieb auf einem Gerät, eine Anwenderin. Eine spätere Erweiterung bleibt möglich, ist aber nicht geplant** |
| OP-3 | Weitere Rahmenbedingungen | Auftraggeber | laufend |
| OP-4 | Mitarbeitsnote außerhalb der Sprints berücksichtigen? | Auftraggeber | **entschieden 2026-09-10: nein – kein Beurteilungsanteil ohne Abschnitt und ohne Kriterien (Fachkonzept 3.5)** |
| OP-5 | Export in ein von der Schule genutztes Format? | Auftraggeber | offen |
| OP-F16 | Soll ein „ja“ auf die Nachfrage (FA-53) auch für **später angelegte** Abschnitte gelten, also die Vorgabe aus FA-52 AK-1 für diese Klasse umdrehen? Derzeit nein: Ein „ja“ wirkt nur auf bereits angelegte Abschnitte, sonst ist von Hand zu schalten | Auftraggeber | offen |
| OP-F17 | Dürfen Teams eine **unterschiedliche Anzahl** Sprints haben? Der Zeitfaktor (FA-54) teilt die Abschnitte eines Strangs in zwei Hälften; bei ungleicher Anzahl liegen die Hälften je Team verschieden – rechnerisch zulässig, aber erklärungsbedürftig | Auftraggeber | offen |
| OP-F18 | Was geschieht mit einem Sprint, der **über einen Zeugnisstichtag hinausläuft**? Heute zählt das Enddatum, er fiele also ganz in den nächsten Zeitraum. Bei einem Sprint, der zu vier Fünfteln im ersten liegt, ist das eine Entscheidung und keine Selbstverständlichkeit (§ 20 LBVO: Leistungsstand am Ende des Beurteilungszeitraums) | Auftraggeber, nötigenfalls Schulleitung | offen |
| OP-F19 | Reicht bei abweichenden Kriterien (FA-67) ein **Hinweis**, oder muss die Notenverteilung über die Klasse entfallen? Die Fortschreibung verschärft die Frage: Kleine Anpassungen wirken fort, die Teams driften über das Jahr auseinander | Auftraggeber | offen |
| OP-F20 | Soll die Anwendung **melden**, wenn die Kriteriensätze der Teams zu weit auseinanderlaufen? Ein Maß dafür gibt es nicht von selbst; denkbar wäre ein Hinweis ab n unterschiedlichen Kriterien | Auftraggeber | offen |
| OP-F21 | **KO-Kriterien**: Werden bestimmte Kriterien nicht geliefert, ist der Sprint negativ zu beurteilen. Vom Auftraggeber am 12.09.2026 angekündigt und ausdrücklich vertagt. Betrifft die Struktur eines Kriteriums und ist deshalb bis zur Umsetzung von 0.4.0 fast kostenlos, danach ein weiterer Schemastand | Auftraggeber | offen, vertagt |
| OP-M3 | Aufwandsschätzung je Anforderung führen? Priorität ohne Aufwand ist die halbe Entscheidungsgrundlage. | Auftraggeber | **entschieden 2026-09-10: nein, nicht erforderlich. Die Reihenfolge ergibt sich aus dem Bedarfszeitpunkt (Kap. 3.1), nicht aus dem Aufwand** |
