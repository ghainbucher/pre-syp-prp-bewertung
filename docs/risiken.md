# Risikoanalyse

| | |
|---|---|
| **Projekt** | PRE/SYP-PRP-Bewertung |
| **Dokument** | Risikoanalyse |
| **Version** | 0.12 |
| **Datum** | 2026-09-10 |
| **Autor** | Gerald Hainbucher |
| **Status** | Entwurf – nicht freigegeben |
| **Gültig für Softwarestand** | 0.1.0 |
| **Zuletzt geprüft** | 2026-09-10 |
| **Nächste Prüfung** | Ende Sprint 1 |
| **Rahmenbedingung** | RB-08 |

---

## 1 Änderungshistorie

| Version | Datum | Autor | Änderung | Status |
|---|---|---|---|---|
| 0.1 | 2026-09-09 | G. Hainbucher | Ersterstellung: acht Risiken aus Technologie, Recht, Fachlichkeit und Betrieb | Entwurf |
| 0.2 | 2026-09-10 | G. Hainbucher | R-09 ergänzt: Ungleichheit durch Arbeit in der Freizeit, sichtbar geworden durch das Zeitbudget von 3 Wochenstunden | Entwurf |
| 0.3 | 2026-09-10 | G. Hainbucher | R-03 neu bewertet: Verarbeitung auf Lehrergeräten ist zulässig; verbleiben die Sorgfaltspflichten, insbesondere der Ablageort der Sicherungsdatei | Entwurf |
| 0.4 | 2026-09-10 | G. Hainbucher | R-10 ergänzt: Ein Teil der Jahresnote entsteht in der Diplomarbeitsvorbereitung, die das Werkzeug noch nicht abbildet | Entwurf |
| 0.5 | 2026-09-10 | G. Hainbucher | R-10 in Behandlung: Erfassung als eigener Abschnitt entschieden (FA-55 bis FA-57). R-01 um die Schemamigration ergänzt | Entwurf |
| 0.6 | 2026-09-10 | G. Hainbucher | R-11 ergänzt: Die Sperre bei negativem Strang steht auf zwei bis vier Tests im Jahr | Entwurf |
| 0.7 | 2026-09-10 | G. Hainbucher | R-11 neu bewertet: mindestens ein Test je Semester ist festgelegt, der Fall „Semester ohne Theoriestand“ entfällt | Entwurf |
| 0.8 | 2026-09-10 | G. Hainbucher | R-11 auf gering: fünf bis sechs Tests je Semester. R-12 ergänzt: KI-gestützte Korrektur offener Antworten | Entwurf |
| 0.9 | 2026-09-10 | G. Hainbucher | Tägliche Sicherung in den schulischen Speicher festgelegt: R-01 und R-03 nachgezogen, OP-R2 entschieden | Entwurf |
| 0.10 | 2026-09-10 | G. Hainbucher | R-01: automatische Sicherung als Maßnahme M-01f aufgenommen, Restrisiko neu bewertet | Entwurf |
| 0.11 | 2026-09-10 | G. Hainbucher | R-12 mit festgelegter Rückfallebene neu bewertet; R-10 nach der Entscheidung zu FA-55/FA-56 neu bewertet; Einstufungen von R-10 bis R-12 an die Skala aus Kapitel 2 angeglichen | Entwurf |
| 0.12 | 2026-09-10 | G. Hainbucher | R-06 behandelt: Die Rubrik wird beim ersten Eintrag eingefroren (FA-65). OP-R1 entschieden | Entwurf |

---

## 2 Zweck und Methode

Bisher waren Risiken im Projekt **implizit** behandelt: ADR-001 ist im Kern eine
Risikoentscheidung, NFA-09 eine Schadensbegrenzung, DS-01 bis DS-05 sind rechtliche
Kontrollen. Was fehlte, war eine Stelle, an der ein Risiko benannt, bewertet und einer
Maßnahme zugeordnet ist — und damit prüfbar bleibt, ob es beherrscht **bleibt**.

**Bewertung:** Eintrittswahrscheinlichkeit (W) und Schadenshöhe (S) je auf einer Skala von
1 (gering) bis 4 (sehr hoch). Die Risikozahl ist ihr Produkt.

| Zahl | Einstufung | Konsequenz |
|---|---|---|
| 12–16 | **kritisch** | Maßnahme vor der nächsten Version |
| 6–9 | **hoch** | Maßnahme eingeplant, Termin genannt |
| 3–4 | **mittel** | beobachten, Maßnahme bei Verschlechterung |
| 1–2 | **gering** | bewusst getragen |

Jedes Risiko nennt eine Maßnahme und die Anforderung oder Entscheidung, in der sie
umgesetzt ist. **Ein Risiko ohne Verweis ist unversorgt** — der Prüflauf meldet das.

---

## 3 Risikoübersicht

| ID | Risiko | Kategorie | W | S | Zahl | Einstufung | Status |
|---|---|---|---|---|---|---|---|
| R-01 | Verlust des Datenbestands durch gelöschten Browserspeicher | Technologie | 3 | 4 | 12 | kritisch | offen |
| R-02 | Note wird angefochten und ist nicht belegbar | Recht | 2 | 4 | 8 | hoch | in Behandlung |
| R-03 | Sorgfaltspflichten beim Umgang mit Schülerdaten auf dem Lehrergerät | Recht | 2 | 3 | 6 | hoch | in Behandlung |
| R-04 | Peer-Bewertungen werden abgesprochen oder zur Vergeltung genutzt | Fachlichkeit | 3 | 2 | 6 | hoch | Maßnahme entschieden |
| R-05 | Teams sind wegen unterschiedlicher Auftraggeber nicht vergleichbar | Fachlichkeit | 3 | 3 | 9 | hoch | in Behandlung |
| R-06 | Rubrik wird mitten im Durchgang geändert und entwertet frühere Sprints | Betrieb | 2 | 3 | 6 | hoch | in Behandlung |
| R-07 | Dokumente veralten und tragen im Ernstfall nicht | Betrieb | 3 | 3 | 9 | hoch | in Behandlung |
| R-08 | Projekt wird nach dem ersten Durchgang nicht weitergepflegt | Betrieb | 2 | 2 | 4 | mittel | getragen |
| R-09 | Ungleiche Voraussetzungen für Arbeit in der Freizeit verzerren die Note | Fachlichkeit | 3 | 3 | 9 | hoch | in Behandlung |
| R-10 | Ein Drittel der Jahresnote entsteht außerhalb des Werkzeugs und ist nicht belegbar | Fachlichkeit | 2 | 3 | 6 | hoch | in Behandlung |
| R-11 | Die Sperre entscheidet über positiv oder negativ, steht aber auf wenigen Feststellungen | Fachlichkeit | 1 | 4 | 4 | mittel | behandelt |
| R-12 | Die KI-gestützte Korrektur offener Antworten ist unzulässig, uneinheitlich oder beides | Recht, Fachlichkeit | 3 | 3 | 9 | hoch | in Behandlung |

---

## 4 Im Einzelnen

### R-01 Verlust des Datenbestands — *kritisch*

**Beschreibung.** Der gesamte Bestand liegt im `localStorage` eines Browserprofils. Ein
„Browserdaten löschen“, ein Profilwechsel, ein neu aufgesetztes Gerät oder ein privates
Fenster genügen, um die Bewertungen eines ganzen Durchgangs zu verlieren. Bei einem eigenen
Projektgegenstand ist das der Verlust einer Jahresnote für eine ganze Klasse.

**Warum es heute kritisch ist.** Die einzige Gegenmaßnahme ist ein Hinweistext in der
Fußzeile. Das ist eine Bitte, keine Kontrolle.

**Maßnahmen**

| Nr. | Maßnahme | Umgesetzt in | Termin |
|---|---|---|---|
| M-01a | Export des vollständigen Bestands als Datei | FA-33 | vorhanden |
| M-01b | Erinnerung, sobald am laufenden Tag geändert und noch nicht gesichert wurde | FA-46 | 0.2.0 |
| M-01c | Datierter Dateiname; eine Sicherung überschreibt keine frühere | FA-46 | 0.2.0 |
| M-01d | **Betriebsregel: tägliche Sicherung in den schulischen Speicher** (Festlegung vom 10.09.2026) | DS-06 | sofort |
| M-01e | Deutlicherer Hinweis, wenn die letzte Sicherung mehr als drei Tage zurückliegt | FA-46 | 0.2.0 |
| M-01f | **Automatische Sicherung** in einen einmal gewählten Ordner, mit sichtbarem Zeitstempel der letzten erfolgreichen Sicherung | FA-64 | 0.2.0 |

**Restrisiko nach Umsetzung:** W 1 × S 4 = 4 (mittel). Mit der täglichen Sicherung kostet ein
Verlust höchstens einen Arbeitstag statt eines ganzen Durchgangs; mit der automatischen
Sicherung (M-01f) sind es Minuten. Weil die Sicherungen datiert und nicht überschrieben
werden, ist auch der zweite Fall gedeckt: ein beschädigter Bestand, der über einen guten
gesichert wird.

Was bleibt, ist die Abhängigkeit von einer Gewohnheit – abgeschwächt, nicht aufgehoben. Die
automatische Sicherung braucht einen Klick je Sitzung und läuft nur in Chromium-Browsern
(ADR-011). Und sie verlagert das Risiko: Eine Sicherung, die still fehlschlägt, ist
gefährlicher als eine vergessene, weil sie Sicherheit vortäuscht. Deshalb der dauerhaft
sichtbare Zeitstempel (FA-64 AK-4) und deshalb bleibt die Betriebsregel im Register.

### R-02 Note wird angefochten und ist nicht belegbar — *hoch*

**Beschreibung.** Ein Widerspruch verlangt, dass die Note aus den erfassten Daten
rekonstruierbar ist — Kriterien, Punkte, Zeitpunkte, Beobachtungen. Fehlt eines davon oder
lässt es sich nicht mehr zuordnen, ist die Note angreifbar.

**Maßnahmen**

| Nr. | Maßnahme | Umgesetzt in |
|---|---|---|
| M-02a | Rubrik vor dem Sprint bekanntgeben und ausgeben | FA-39 |
| M-02b | Bewertungsbegründung je Person aus den erfassten Daten erzeugen | FA-32 |
| M-02c | Fehlende Kategorien werden ausgewiesen, nicht als 0 gewertet | FA-23, FA-26 |
| M-02d | Rechenweg dokumentiert und durch Unit-Tests abgesichert | NFA-02, NFA-06 |
| M-02e | Rubrik bleibt über den Durchgang stabil | siehe R-06 |

### R-03 Sorgfaltspflichten beim Umgang mit Schülerdaten — *hoch*

**Geklärt (10. September 2026):** Die Verarbeitung von Schülerdaten auf Lehrergeräten ist
zulässig; eine praktikable Alternative besteht nicht. Die Architektur entspricht dem: Die
Verarbeitung gleicht einer lokal geführten Notenliste.

**Was bleibt.** Die Erlaubnis nimmt die Sorgfaltspflichten nicht weg. Das Risiko verschiebt
sich von „darf ich das“ zu „wohin gerät die Datei“. Der kritische Punkt ist die
Sicherungsdatei aus FA-33: Sie enthält Namen und Noten im Klartext. Landet sie in einem
privaten Cloud-Ordner, verlässt der Datenbestand genau den Rahmen, den die Architektur
sorgfältig einhält.

**Seit dem 10. September 2026 ist der Ablageort festgelegt:** täglich in den schulischen
Speicher (DS-06, Solution-Design 7.1). Damit ist aus einer Betriebsregel im Kopf eine
Anforderung mit einer Prüfung geworden. Rechtlich ändert sich die Lage dadurch zum Besseren:
Verantwortlicher für diesen Speicher ist der Schulerhalter – dieselbe Stelle, die auch für
eine dort abgelegte Notenliste verantwortlich ist.

**Maßnahmen**

| Nr. | Maßnahme | Umgesetzt in |
|---|---|---|
| M-03a | Keine Übertragung an Dritte; im E2E-Test geprüft | NFA-03, DS-02 |
| M-03b | Datensparsamkeit: nur Name, Zuordnung, Bewertung | DS-01 |
| M-03c | Vollständige Löschbarkeit | DS-03, FA-33 |
| M-03d | Sicherungsdateien ausschließlich im schulischen Speicher; keine privaten Cloud-Ordner (festgelegt 10.09.2026) | **DS-06**, Hinweis beim Export (DS-05) |
| M-03e | Gerätesperre und Nutzerkonto mit Kennwort; kein geteiltes Konto | Betriebsregel |
| M-03f | Löschung des Datenbestands nach Abschluss des Beurteilungszeitraums | DS-03, FA-33 |

M-03d bis M-03f liegen außerhalb der Software – es sind Betriebsregeln. Die Software kann
nur darauf hinweisen (DS-05); wohin die Datei gelegt wird, entscheidet der Anwender.

Die beurteilungsrechtliche Seite ist ebenfalls geklärt (Mitarbeitsfeststellung, Fachkonzept
Kap. 3).

### R-04 Absprachen und Vergeltung bei der Peer-Bewertung — *hoch*

**Beschreibung.** Teams können sich absprechen und sich gegenseitig Bestnoten geben; einzelne
können jemanden gezielt abwerten. Beides macht Peer-Werte als Notengrundlage angreifbar —
besonders, wenn die betroffene Person das Ergebnis nicht einsehen kann.

**Maßnahmen**

| Nr. | Maßnahme | Umgesetzt in |
|---|---|---|
| M-04a | Geringe Gewichtung (Vorgabe 10 %) | FA-07 |
| M-04b | Abweichung zwischen Selbst- und Fremdbild wird gemeldet und führt zum Gespräch, nicht zum Abzug | FA-27 |
| M-04c | Gedeckelter Korrekturfaktor statt linearer Einrechnung – höchstens ±5 Prozentpunkte | FA-45 (entschieden 10.09.2026) |

### R-05 Teams sind nicht vergleichbar — *hoch*

**Beschreibung.** Wenn Team A einen fordernden und Team B einen genügsamen Auftraggeber hat,
sind die Produktergebnisse nicht vergleichbar. Die Note hinge dann teilweise davon ab, welchen
PO ein Team gezogen hat. Bei einer Jahresnote ist das angreifbar.

**Maßnahmen**

| Nr. | Maßnahme | Umgesetzt in |
|---|---|---|
| M-05a | Die Note trägt, was PO-unabhängig prüfbar ist: Handwerk, Prozess, Einhaltung eigener Zusagen | Rubrik, ZK-4 |
| M-05b | PO-Zufriedenheit ist ein eigenes, gering gewichtetes Signal | FA-44 |
| M-05c | Art des Auftraggebers wird erfasst, damit erkennbar bleibt, wie die Rückmeldung zustande kam | FA-43 |

### R-06 Rubrikänderung mitten im Durchgang — *behandelt*

**Beschreibung.** Eine Änderung an Kriterien oder Gewichten wirkte rückwirkend auf alle bereits
erfassten Abschnitte. Frühere Bewertungen bedeuten danach etwas anderes als zum Zeitpunkt der
Erfassung — und das fällt niemandem auf.

**Der schwerste Fall war nicht die Rechnung, sondern die Belegfassung.** Eine im Juni erzeugte
Herleitung für einen Sprint aus dem Oktober hätte die Kriterien von Juni gezeigt. Das Dokument
sieht richtig aus und ist es nicht — und zwar genau in der Lage, für die SH-4 da ist.

**Maßnahmen**

| Nr. | Maßnahme | Umgesetzt in |
|---|---|---|
| M-06a | Betriebsregel: Rubrik bleibt über den Durchgang stabil | Fachkonzept 8.1 |
| M-06b | **Einfrieren beim ersten Eintrag:** Der Abschnitt erhält eine Kopie der Rubrik, spätere Änderungen wirken nur nach vorne | FA-65, 0.2.0 |
| M-06c | Angleichen an die aktuelle Rubrik nur als ausdrückliche Handlung, mit Vorschau der Wertänderung | FA-47, 0.3.0 |

**Restrisiko.** Eine Berichtigung, die wirklich rückwirken soll, ist jetzt zwei Klicks weiter
weg als vorher — gewollt. Und wer sie ausführt, ohne die Vorschau zu lesen, ändert wieder
rückwirkend Werte; dagegen hilft nur die zweite Bestätigung (FA-47 AK-3).

### R-07 Dokumente veralten — *hoch*

**Beschreibung.** Genau die Artefakte, die im Ernstfall tragen sollen, verfallen leise. Das
fällt erst auf, wenn man sich auf sie stützen will.

**Maßnahmen**

| Nr. | Maßnahme | Umgesetzt in |
|---|---|---|
| M-07a | Aktualitätskopf in jedem geführten Dokument | RB-10 |
| M-07b | Fixer Prüfpunkt am Sprintende in der Definition of Done | CONTRIBUTING |
| M-07c | Maschineller Prüflauf in der Pipeline: gerissene Ketten hart, Fristen weich | RB-10 |

### R-09 Ungleichheit durch Arbeit in der Freizeit — *hoch*

**Beschreibung.** Die Hauptarbeitszeit sind 3 Wochenstunden in der Schule. Erfahrungsgemäß
arbeiten Schülerinnen und Schüler zusätzlich zu Hause. Wer das nicht kann – wegen Fahrzeiten,
Nebenbeschäftigung oder Betreuungspflichten –, liefert weniger, ohne weniger zu können. Wird
der Umfang der Sprint-Ziele an dem bemessen, was die Fleißigsten zu Hause schaffen, misst die
Note am Ende die verfügbare Freizeit statt der Kompetenz.

Hinzu kommt: Was zu Hause entsteht, ist nicht beobachtet. Grundsatz G4 verlangt aber, dass
beurteilt wird, was beobachtet wurde.

**Maßnahmen**

| Nr. | Maßnahme | Umgesetzt in |
|---|---|---|
| M-09a | Sprint-Ziele werden so bemessen, dass sie im Schulzeitbudget erreichbar sind | Fachkonzept 3.2 |
| M-09b | Bewertet wird der individuelle Beitrag im Verhältnis zum Team, nicht die absolute Menge | FA-13 |
| M-09c | Der Verstehensnachweis prüft Können, nicht Umfang – er ist gegenüber Freizeitunterschieden neutral | FA-40 |
| M-09d | Termintreue misst zugesagte gegen gelieferte Stories; wer realistisch zusagt, wird nicht bestraft | Rubrik i3 |

**Restrisiko.** Ein Team, in dem alle viel Freizeit einbringen, wird trotzdem mehr liefern.
Das ist nicht vollständig auszugleichen – die Maßnahmen sorgen dafür, dass es nicht die
*individuelle* Note bestimmt.

### R-10 Die Jahresnote ist nur zum Teil belegbar — *hoch*

**Neu bewertet am 10. September 2026:** Die Eintrittswahrscheinlichkeit ist von 4 auf 2
gesunken, seit die Erfassung der zweiten Phase entschieden und als FA-55/FA-56 in 0.2.0
eingeplant ist. Sie bleibt über 1, weil die Umsetzung noch aussteht.

**Beschreibung.** Der Gegenstand hat zwei Phasen (Fachkonzept 3.4). Die Anwendung kennt bisher
nur die erste. Die Diplomarbeitsvorbereitung im Mai trägt nach der Gewichtungsregel rund ein Drittel
der Jahresnote – jenes Drittel, das dem Zeugnis am nächsten liegt und im Widerspruchsfall
zuerst hinterfragt wird.

Bliebe es dabei, entstünde genau die Lage, gegen die dieses Projekt angetreten ist: eine
Note, deren größerer Teil dokumentiert ist und deren entscheidender Teil aus dem Gedächtnis
begründet werden muss. Das trifft SH-4 unmittelbar und macht die Belegfassung (FA-32)
unvollständig, ohne dass man ihr das ansieht – der gefährlichere Fall.

**Maßnahmen**

| Nr. | Maßnahme | Umgesetzt in |
|---|---|---|
| M-10a | Phase 2 wird als eigener Beurteilungsabschnitt mit eigener Rubrik erfasst (entschieden 10.09.2026) | FA-55, FA-56 |
| M-10d | Die Schemamigration sichert den bisherigen Bestand, bevor sie ihn anfasst | FA-57 |
| M-10b | Bis dahin bleibt der gesetzte Wert samt Begründung der Notbehelf – er ist belegbar, aber nicht kriteriengestützt | FA-50 |
| M-10c | Die Belegfassung weist aus, welche Abschnitte sie abdeckt und welche nicht | FA-32 |

**Restrisiko.** Auch bei eigener Rubrik für Phase 2 bleibt sie kürzer beobachtet als ein
Sprint: vier Arbeitswochen, ein Auftritt. Die Beurteilung stützt sich dort auf weniger
Feststellungen als in Phase 1 – vertretbar, weil die Präsentation vor dem Gremium ein
ungewöhnlich dichter Beobachtungsanlass ist.

### R-11 Die Sperre steht auf schmaler Grundlage — *mittel*

**Beschreibung.** Ein negativer Strang schließt die positive Gesamtbeurteilung aus (10.4).
Der Theoriestrang beruht auf Tests. Wären es ein bis zwei je Semester, entschiede ein
einzelner Tag über den Theoriestand – und damit unter Umständen darüber, ob jemand den
Gegenstand besteht, auch wenn die Praxis über acht Abschnitte hinweg gut war.

**Mit fünf bis sechs Tests je Semester (Entscheidung vom 10.09.2026) ist das weitgehend
erledigt.** Ein misslungener Test trägt dann rund ein Fünftel des Theoriestrangs und damit
etwa 5 % der Note. Das Risiko bleibt im Register, weil die Festlegung eine Planungsabsicht
ist und kein Automatismus: Wer im Semesterbetrieb Termine ausfallen lässt, landet wieder bei
zwei Tests.

Das ist kein Fehler der Regel. § 14 LBVO trägt sie, und der Auftraggeber will sie. Das Risiko
liegt in der **Zahl der Feststellungen**, auf denen sie ruht: Je weniger es sind, desto mehr
Zufall steckt in einer Entscheidung, die keine Zwischentöne kennt.

Ein zweiter Fall ist damit ebenfalls ausgeschlossen: Läge im ersten Semester kein Test, hätte
der Theoriestrang zum Semesterzeugnis keinen Wert, die Sperre griffe dort nicht, und die
Person erführe von der Gefährdung erst im zweiten Semester.

**Maßnahmen**

| Nr. | Maßnahme | Umgesetzt in |
|---|---|---|
| M-11a | Fünf bis sechs Tests je Semester, einer je Thema (entschieden 10.09.2026) | Fachkonzept 3.5, FA-60 |
| M-11e | Hinweis auf einen Beurteilungszeitraum ohne Test | FA-60 |
| M-11b | Ein drohend negativer Strang ist in der Übersicht erkennbar, bevor der Zeitraum endet | FA-61 |
| M-11c | Die Sperre verändert keine gespeicherten Werte; beide Strangstände bleiben sichtbar und begründbar | ADR-010 |
| M-11d | Dass beide Stränge wesentliche Bereiche sind, wird zu Schuljahresbeginn erklärt | FA-39 |

**Restrisiko.** Die Theorie bleibt die schmalere Grundlage – eine Wochenstunde gegen drei.
Das ist der Preis der Stundentafel und durch kein Werkzeug aufzuheben. Was das Werkzeug
leisten kann, ist, einen Beurteilungszeitraum ohne Test zu melden und eine Gefährdung früh zu
zeigen.

### R-12 Die KI-gestützte Korrektur trägt nicht — *hoch*

**Neu bewertet am 10. September 2026.** Die Schadenshöhe ist von 4 auf 3 gesunken, seit die
Rückfallebene feststeht (Fachkonzept 3.6): Fällt die Auskunft negativ aus, werden weniger
Tests mit kürzeren offenen Fragen geschrieben, von Hand korrigiert und von Hand eingetragen.
Das kostet Zeit – es bricht nichts.

**Beschreibung.** Die offene Frage jedes Tests wird mit KI-Unterstützung vorkorrigiert
(Fachkonzept 3.6). Daran hängen drei verschiedene Risiken, die leicht verwechselt werden:

1. **Unzulässigkeit.** Auch pseudonymisiert ist die Verarbeitung von Prüfungsleistungen
   Minderjähriger über einen Dienst Dritter zu klären. Fällt die Auskunft negativ aus,
   entfällt die Arbeitsersparnis – nicht der Testaufbau.
2. **Uneinheitlichkeit.** Ohne Bewertungsschema fallen KI-Vorschläge für gleichwertige
   Antworten unterschiedlich aus. Eine Beurteilung, die sich nicht wiederholen lässt, ist im
   Widerspruchsfall nicht zu verteidigen.
3. **Stille Übernahme.** Das eigentliche Risiko ist nicht die schlechte KI-Bewertung, sondern
   die ungeprüft übernommene. Wer zwanzig plausible Vorschläge gesehen hat, prüft den
   einundzwanzigsten nicht mehr. Genau dann ist die Beurteilung faktisch delegiert, obwohl
   § 11 Abs. 2 LBVO sie der Lehrkraft zuweist.

**Maßnahmen**

| Nr. | Maßnahme | Umgesetzt in |
|---|---|---|
| M-12a | Klärung mit der Schulleitung vor dem ersten Einsatz der KI-Korrektur; sie hält den Projektstart nicht auf | OP-F15 im Fachkonzept |
| M-12e | Rückfallebene vorab festgelegt: weniger Tests, kürzere offene Fragen, Korrektur und Eintragung von Hand | Fachkonzept 3.6 |
| M-12b | Pseudonymisierte Übergabe: nur Antworttexte und Schema, keine Namen | Fachkonzept 3.6 |
| M-12c | Bewertungsschema 0–4 mit Deskriptoren je offener Frage, gespeichert und in der Belegfassung ausgewiesen | FA-60, FA-32 |
| M-12d | Der KI-Vorschlag ist ein Vorschlag; die Punkte setzt die Lehrkraft – dasselbe Muster wie Notenvorschlag und Notenstand | FA-49, FA-50 |

**Restrisiko.** Gegen die stille Übernahme hilft keine Regel und keine Software, sondern nur
die Gewohnheit, die Antwort selbst zu lesen, bevor der Vorschlag gelesen wird. Das ist eine
Arbeitsweise, keine Maßnahme.

**Die PRE/SYP-PRP-Bewertung ist von diesem Risiko nicht betroffen.** Die Anwendung spricht mit keinem
KI-Dienst; sie nimmt Punkte entgegen, gleich wer sie ermittelt hat. Das Risiko liegt
vollständig im Unterrichtsbetrieb – weshalb es hier steht und nicht im Anforderungsdokument.

### R-08 Projekt wird nicht weitergepflegt — *mittel, bewusst getragen*

**Beschreibung.** Ein Werkzeug mit einem Entwickler und einem Anwender hängt an einer Person.
Fällt sie aus oder verliert das Interesse, bleibt ein Datenbestand ohne Werkzeug.

**Warum es getragen wird.** Der Schaden ist begrenzt: Die Sicherungsdatei ist lesbares JSON,
die Auswertung ist in einer Tabellenkalkulation nachbaubar, und die Rubrik existiert auf
Papier. Die Maßnahmen — dokumentiertes Format, verständlicher Aufbau, Tests — dienen dem
ohnehin und kosten nichts zusätzlich.

---

## 5 Bewusst nicht als Risiko geführt

| Thema | Warum nicht |
|---|---|
| Ausfall von GitHub Pages | Die Anwendung läuft nach dem Laden offline; ein Ausfall verzögert höchstens den Zugriff |
| Sicherheitslücken in Abhängigkeiten | Ohne Server und ohne fremde Daten ist die Angriffsfläche eine lokale Webseite; wird über Aktualisierungen behandelt, nicht als Projektrisiko |
| Browser-Inkompatibilität | Durch NFA-05 und die Playwright-Matrix abgedeckt |

---

## 6 Offene Punkte

| Nr. | Frage | Status |
|---|---|---|
| OP-R1 | Soll die Rubrik je Klasse und Durchgang eingefroren werden, statt global zu gelten? | **entschieden 2026-09-10: eingefroren je Abschnitt, beim ersten Eintrag (FA-65). Nicht je Klasse und nicht als Versionsverwaltung – der Abschnitt ist die richtige Ebene, seit die Rubrik ohnehin an ihm hängt** |
| OP-R2 | Ab wie vielen Änderungen ohne Sicherung soll erinnert werden (M-01b)? | **entschieden 2026-09-10: nicht nach Änderungen, sondern nach Tagen – erinnert wird, sobald am laufenden Tag geändert und noch nicht gesichert wurde (FA-46)** |
| OP-R3 | Wer prüft dieses Register — nur die Lehrkraft, oder ist es Teil der Abstimmung mit der Schulleitung? | offen |
| OP-R4 | Soll der erwartete Umfang eines Sprint-Ziels in Schulstunden ausgewiesen werden, damit M-09a überprüfbar wird? | offen |
