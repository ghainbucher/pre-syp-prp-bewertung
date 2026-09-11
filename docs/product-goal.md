# Product Goal

| | |
|---|---|
| **Projekt** | PRE/SYP-PRP-Bewertung |
| **Dokument** | Product Goal |
| **Version** | 0.3 |
| **Datum** | 2026-09-10 |
| **Autor** | Gerald Hainbucher |
| **Status** | Entwurf – nicht freigegeben |
| **Gültig für Softwarestand** | 0.2.0 |
| **Zuletzt geprüft** | 2026-09-11 |
| **Nächste Prüfung** | Ende Sprint 1 |
| **Rahmenbedingung** | RB-09 |

---

## 1 Änderungshistorie

| Version | Datum | Autor | Änderung | Status |
|---|---|---|---|---|
| 0.1 | 2026-09-09 | G. Hainbucher | Ersterstellung; herausgelöst aus Fachkonzept Kap. 12 | Entwurf |
| 0.2 | 2026-09-10 | G. Hainbucher | „über ein Semester“ durch den tatsächlichen Projektzeitraum ersetzt; Messgrößen an das Zeitbudget von 3 Wochenstunden angeschlossen | Entwurf |
| 0.3 | 2026-09-10 | G. Hainbucher | Nachgezogen auf Fachkonzept 0.19: zwei Phasen, zwei Stränge, Notenstand statt Note. Zielsatz neu gefasst, Messgrößen berichtigt und um PZ-6 und PZ-7 ergänzt, zwei Nicht-Ziele ergänzt | Entwurf |

---

## 2 Das Ziel

> **Die PRE/SYP-PRP-Bewertung befähigt die Lehrkraft, aus den über das Schuljahr in Abschnitten erhobenen
> Beobachtungen für jede Schülerin und jeden Schüler einen belegten, kriteriengeleiteten
> Leistungsstand zu führen – so, dass die Beurteilung ihre Entscheidung bleibt, im Anlassfall
> rekonstruierbar ist und der Erfassungsaufwand den Unterricht nicht verdrängt.**

---

## 3 Woher jeder Bestandteil kommt

| Bestandteil | Herkunft |
|---|---|
| **belegt** | Grundsatz G7 und die Gegenstandsart: Ein eigener Projektgegenstand trägt die Jahresnote und muss im Anlassfall belegbar sein (SH-4) |
| **kriteriengeleitet** | Grundsatz G1: Die Kriterien sind vor dem Abschnitt bekannt. Seit FA-65 gilt für einen bewerteten Abschnitt, was damals bekannt war – nicht, was heute in der Rubrik steht |
| **Leistungsstand, nicht Note** | Grundsatz G8 und § 4 Abs. 2 LBVO: Einzelne Leistungen im Rahmen der Mitarbeit sind nicht gesondert zu benoten. Die Aufzeichnungen führen Punkte und Prozent |
| **die Beurteilung bleibt ihre Entscheidung** | Grundsatz G9 und § 11 Abs. 2 LBVO: Die Leistungsbeurteilung ist eine pädagogische gutachterliche Tätigkeit. Die Software schlägt vor, die Lehrkraft trägt ein |
| **in Abschnitten** | Sprints, Diplomarbeitsvorbereitung und Tests sind dasselbe Gebilde mit derselben Rechnung (Fachkonzept 3.4, 3.5) |
| **über das Schuljahr** | Anfang Oktober bis zur Freigabe der Diplomarbeitsthemen Anfang Juni, in zwei Beurteilungszeiträumen |
| **ohne den Unterricht zu verdrängen** | Erfolgskriterium von SH-1; jede Minute Verwaltung fehlt der Begleitung |

Das Ziel nennt bewusst **keine Funktion**. Es beschreibt einen Zustand, an dem sich jede
Anforderung messen lassen muss: Trägt sie zu einem belegten, kriteriengeleiteten Stand bei —
und um welchen Preis an Aufwand?

**Was sich gegenüber 0.2 geändert hat und warum es zählt:** Der frühere Zielsatz sprach davon,
eine Note zu *bilden*. Das war schon damals nicht gemeint und ist seit Grundsatz G8 auch
sprachlich falsch. Die Software bildet keine Note. Sie führt einen Stand, aus dem die
Lehrkraft eine Note ableitet — und hält beides auseinander.

---

## 4 Woran das Ziel als erreicht gilt

| Nr. | Messgröße | Zielwert | Erhebung |
|---|---|---|---|
| **PZ-1** | Erfassungsdauer je Team und Abschnitt | ≤ 5 Minuten | Zeitmessung mit echtem Datensatz |
| **PZ-1a** | Erfassungsaufwand über den Durchgang | ≤ 4,5 Stunden bei 4 Teams, 9 bewerteten Abschnitten und 10 bis 12 Tests – gegenüber rund 100 Unterrichtsstunden, also unter 5 % | Rechnung aus PZ-1 |
| **PZ-2** | Anteil der Personen mit vollständigem Stand in **beiden** Strängen | 100 % der beurteilbaren | Auswertung Ende Jänner und Anfang Juni |
| **PZ-3** | Rekonstruktion eines Stands im Anlassfall | ≤ 10 Minuten, ohne Handrechnung, einschließlich der damals geltenden Rubrik | Trockenübung mit einem abgeschlossenen Durchgang |
| **PZ-4** | Rückmeldungen, die vor der Notenbildung bei der Person waren | 100 % | Zählung je Abschnitt |
| **PZ-5** | Netzwerkverbindungen der Anwendung während der Bedienung | 0 | Netzwerkprüfung im E2E-Test |
| **PZ-6** | Später negativ Beurteilte, deren Gefährdung vor dem Stichtag sichtbar war | 100 % | Abgleich am Stichtag Ende April gegen die Jahresbeurteilung |
| **PZ-7** | Arbeitstage mit Änderungen, aber ohne Sicherung | 0 | Zeitstempel der letzten Sicherung, aus der Anwendung ablesbar |

**PZ-1 und PZ-3 sind die eigentlichen Prüfsteine.** Sie stehen in Spannung zueinander –
schnelles Erfassen und vollständige Belegbarkeit ziehen in verschiedene Richtungen. Dass
beide erreicht werden sollen, ist der Anspruch; dass sie zusammen gemessen werden, verhindert,
dass einer auf Kosten des anderen erfüllt wird.

**PZ-6 ist neu und die unbequemste Größe.** Die Sperre (Fachkonzept 10.4) ist die einzige
Stelle im Modell, an der eine gute Leistung nichts nützt. Wird sie erst am Ende sichtbar, hat
die Person keine Gelegenheit mehr zu reagieren – und § 19 Abs. 3a SchUG verlangt eine
unverzügliche Verständigung. Ein Wert unter 100 % ist deshalb kein Schönheitsfehler, sondern
ein Befund.

**PZ-7 misst eine Gewohnheit, nicht die Software.** Genau deshalb steht sie hier: Der Verlust
des Datenbestands ist das kritische Risiko (R-01), und die automatische Sicherung (FA-64)
nimmt der Gewohnheit nur einen Teil der Last ab.

---

## 5 Was das Produkt ausdrücklich nicht tut

| Nr. | Nicht-Ziel | Grund |
|---|---|---|
| **PN-1** | Es vergibt keine Note, es rechnet einen Stand aus | Die Beurteilung ist eine pädagogische Entscheidung der Lehrkraft (§ 11 Abs. 2 LBVO); die Software macht sie nachvollziehbar, ersetzt sie nicht |
| **PN-2** | Es misst keine Codemetriken und wertet keine Git-Statistiken aus | Grundsatz G4: Beurteilt wird, was beobachtet wurde — Commit-Zahlen sind keine Beobachtung von Kompetenz |
| **PN-3** | Es erkennt keinen KI-Einsatz | Weder feststellbar noch die richtige Frage; geprüft wird, ob jemand für seinen Code einstehen kann |
| **PN-4** | Es ersetzt kein Gespräch | Der Verstehensnachweis ist mündlich; die Software hält nur sein Ergebnis fest |
| **PN-5** | Es ist kein Werkzeug für die Schülerteams | Deren Backlog und Board liegen in GitHub; dies ist ein Beurteilungswerkzeug der Lehrkraft |
| **PN-6** | Es führt keine Tests durch und korrigiert nichts | Tests laufen dort, wo sie laufen; die Anwendung nimmt ihre Punkte entgegen. Es spricht insbesondere mit keinem KI-Dienst (Fachkonzept 3.6) |
| **PN-7** | Es überträgt nichts und sichert nicht selbsttätig in die Cloud | Die Anwendung schreibt eine lokale Datei; wohin sie gelangt, entscheidet die Lehrkraft (NFA-03, DS-06) |

---

## 6 Bedingungen, unter denen dieses Ziel neu zu fassen wäre

Ein Product Goal ist keine Ewigkeitsaussage. Diese Ereignisse würden es aufheben:

1. **Mehrere Lehrkräfte arbeiten am selben Datenbestand.** Dann fällt RB-05, und mit ihm die
   Architekturentscheidung ADR-001. Für den ersten Durchgang ist das ausgeschlossen
   (OP-2, entschieden am 10.09.2026: ein Gerät, eine Anwenderin).
2. **Schülerinnen und Schüler erfassen selbst** (Peer-Bewertung, Reflexion). Ohne Backend ist
   das nur als Kioskbetrieb am Lehrergerät möglich; alles andere hebt RB-06 auf.
3. **Die Stundentafel ändert sich.** Die Gewichtung 75 zu 25 zwischen Praxis und Theorie folgt
   drei Wochenstunden gegen eine. Ändert sich das Verhältnis, ändert sich die Gewichtung mit —
   und mit ihr die Begründung, warum beide Stränge wesentliche Bereiche sind (Fachkonzept 10.4).
4. **Die Diplomarbeitsvorbereitung wandert aus dem Gegenstand.** Dann entfällt die zweite
   Phase, und mit ihr rund ein Drittel des zweiten Beurteilungszeitraums.

Die schulrechtliche Prüfung ist für die tragenden Fragen abgeschlossen (OP-F1, OP-F8, OP-F10,
OP-F11). Offen bleibt die Zulässigkeit der KI-gestützten Korrektur (OP-F15) — sie berührt
dieses Ziel nicht, weil die Software daran nicht beteiligt ist.

Tritt eines der vier Ereignisse ein, wird zuerst dieses Dokument geändert — dann das
Anforderungsdokument, dann der Code.
