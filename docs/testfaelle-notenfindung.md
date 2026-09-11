# Testfälle zur Notenfindung

| | |
|---|---|
| **Projekt** | PRE/SYP-PRP-Bewertung |
| **Dokument** | Testfälle zur Notenfindung |
| **Version** | 0.2 |
| **Datum** | 2026-09-10 |
| **Autor** | Gerald Hainbucher |
| **Status** | Entwurf – nicht freigegeben |
| **Gültig für Softwarestand** | 0.3.0 |
| **Zuletzt geprüft** | 2026-09-11 |
| **Nächste Prüfung** | Ende Sprint 1 |
| **Bezug** | [Fachkonzept](fachkonzept-unterricht.md) Kap. 10 · FA-24, FA-25, FA-50, FA-54, FA-59, FA-61 |
| **Rahmenbedingung** | RB-01 |

---

## 1 Änderungshistorie

| Version | Datum | Autor | Änderung | Status |
|---|---|---|---|---|
| 0.1 | 2026-09-10 | G. Hainbucher | Ersterstellung: neun Verläufe mit erwarteten Werten, entstanden bei der Entscheidung zu OP-F4 | Entwurf |
| 0.2 | 2026-09-10 | G. Hainbucher | Vier Fälle zur Sperre bei negativem Strang ergänzt (Kap. 4.2) | Entwurf |

---

## 2 Wozu dieses Dokument

Neun erfundene Verläufe über acht Sprints. Zu jedem steht, welchen Gesamtstand die Rechnung
liefern **muss** – und wo die Rechnung bewusst nicht ausreicht und eine Entscheidung der
Lehrkraft erwartet wird.

Es hat zwei Zwecke:

1. **Es macht die Gewichtungsregel überprüfbar.** Die Werte sind Regressionstests in
   `src/domain/scoring.test.ts`. Ändert eine spätere Anpassung das Ergebnis eines Falls,
   bricht der Testlauf – und zwar mit dem Fall im Testnamen.
2. **Es macht die Regel besprechbar.** Ob eine Gewichtung richtig ist, sieht man nicht an der
   Formel, sondern an dem, was sie mit einem konkreten Verlauf macht. Diese Fälle sind vor
   der Entscheidung gerechnet worden, nicht danach.

Alle Werte sind Prozent. Die Note in Klammern ist der **Notenvorschlag** beim
Standardschlüssel (1 ab 90, 2 ab 80, 3 ab 65, 4 ab 51) – nicht der Notenstand. Den vergibt
die Lehrkraft (G8).

---

## 3 Die Regel, gegen die geprüft wird

Gewicht eines Sprints = **Sprintfaktor** × **Zeitfaktor**.

- Sprintfaktor: Vorgabe 1, Lernsprint 0,5, frei einstellbar (FA-04).
- Zeitfaktor: erste Hälfte des Beurteilungszeitraums 1, zweite Hälfte 2, bei ungerader
  Sprintzahl zugunsten der späteren aufgerundet (FA-54, § 20 Abs. 1 LBVO).

In allen Fällen unten ist der Sprintfaktor durchgehend 1, damit nur der Zeitfaktor wirkt.
Bei acht Sprints ergibt das die Faktoren `1 1 1 1 2 2 2 2`.

**Kontrolle der Aufrundung** – gehört ebenfalls zum Regressionstest:

| Sprints | Zeitfaktoren |
|---|---|
| 2 | 1 · 2 |
| 3 | 1 · 2 · 2 |
| 4 | 1 · 1 · 2 · 2 |
| 5 | 1 · 1 · 2 · 2 · 2 |
| 6 | 1 · 1 · 1 · 2 · 2 · 2 |
| 7 | 1 · 1 · 1 · 2 · 2 · 2 · 2 |
| 8 | 1 · 1 · 1 · 1 · 2 · 2 · 2 · 2 |
| 9 | 1 · 1 · 1 · 1 · 2 · 2 · 2 · 2 · 2 |

---

## 4 Die Fälle

| Nr. | Verlauf über acht Sprints |
|---|---|
| **TF-A** Konstant gut | 85 · 85 · 85 · 85 · 85 · 85 · 85 · 85 |
| **TF-B** Aufsteiger | 45 · 50 · 60 · 68 · 75 · 82 · 88 · 90 |
| **TF-C** Absteiger | 90 · 88 · 82 · 75 · 68 · 60 · 50 · 45 |
| **TF-D** Später Einbruch | 80 · 82 · 80 · 83 · 81 · 40 · 35 · 30 |
| **TF-E** Spätzünder | 50 · 48 · 52 · 50 · 55 · 75 · 88 · 92 |
| **TF-F** Ein Ausreißer früh | 30 · 80 · 82 · 85 · 83 · 86 · 84 · 85 |
| **TF-G** Ein Ausreißer spät | 85 · 84 · 86 · 83 · 85 · 82 · 30 · 84 |
| **TF-H** Schwankend | 80 · 45 · 85 · 50 · 78 · 48 · 82 · 52 |
| **TF-I** Knapp durchgehend | 55 · 54 · 56 · 55 · 53 · 56 · 55 · 54 |

### 4.1 Erwartete Werte

| Nr. | ohne Zeitfaktor | **erwartet (mit Zeitfaktor)** | Δ | Erwartung an die Lehrkraft |
|---|---|---|---|---|
| **TF-A** | 85.0 % (2) | **85.0 % (2)** | +0.0 | Kein Anlass für eine Abweichung. |
| **TF-B** | 69.8 % (3) | **74.4 % (3)** | +4.6 | Rechnung genügt. Spiegelbild zu TF-C – die beiden müssen auseinanderliegen. |
| **TF-C** | 69.8 % (3) | **65.1 % (3)** | -4.7 | Rechnung genügt. Spiegelbild zu TF-B. |
| **TF-D** | 63.9 % (4) | **58.1 % (4)** | -5.8 | Rechnung genügt. Der Einbruch ist der zuletzt erreichte Stand. |
| **TF-E** | 63.8 % (4) | **68.3 % (3)** | +4.5 | Rechnung genügt. Ohne Zeitfaktor wäre die Note eine Stufe schlechter. |
| **TF-F** | 76.9 % (3) | **79.4 % (3)** | +2.5 | Rechnung genügt; der frühe Ausfall wirkt bereits schwächer. |
| **TF-G** | 77.4 % (3) | **75.0 % (3)** | -2.4 | **Gesetzter Wert erwartet.** Ein Einbruch ist kein Stand. |
| **TF-H** | 65.0 % (3) | **65.0 % (3)** | +0.0 | Rechnung genügt. Kein Trend, den der Zeitfaktor greifen könnte. |
| **TF-I** | 54.8 % (4) | **54.7 % (4)** | -0.1 | Rechnung genügt. Grenzfall zur Note 4. |

Die Spalte „ohne Zeitfaktor“ steht nicht zum Vergleich da, sondern als Beleg: Sie ist die
Rechnung, die § 20 Abs. 1 LBVO nicht entspricht, und zeigt, was der Zeitfaktor überhaupt
bewirkt.

### 4.2 Fälle zur Sperre (FA-59, FA-61)

Vier Fälle, die nichts über die Gewichtung aussagen und alles über die Zusammenführung der
beiden Stränge. Gewichte 75 / 25, Genügend-Grenze 51 %.

| Nr. | Praxis | Theorie | Gesamtstand | Vorschlag **ohne** Sperre | **erwartet** |
|---|---|---|---|---|---|
| **TF-J** Theorie trägt nicht | 82,0 % | 44,0 % | 72,5 % | 3 | **5 – gesperrt durch Theorie** |
| **TF-K** Praxis trägt nicht | 48,0 % | 90,0 % | 58,5 % | 4 | **5 – gesperrt durch Praxis** |
| **TF-L** Noch kein Test | 82,0 % | – | 82,0 % | 2 | **2 – keine Sperre** |
| **TF-M** Beide knapp | 52,0 % | 51,0 % | 51,8 % | 4 | **4 – keine Sperre** |

**TF-J ist der Fall, für den die Regel da ist**, und zugleich der, der in einer Diskussion
mit Eltern aufschlägt: 82 % in der Praxis, ein Gesamtstand von 72,5 % – und trotzdem ein
Nicht genügend. Beide Zahlen bleiben erhalten und stehen in der Belegfassung. Was den
Vorschlag trägt, ist nicht die Rechnung, sondern § 14 LBVO.

**TF-K prüft die Gegenrichtung.** Die Sperre gilt für beide Stränge; ein glänzender
Theorieteil rettet eine nicht bestandene Praxis ebenso wenig.

**TF-L ist der wichtigste Grenzfall.** Solange kein Test geschrieben wurde, hat der
Theoriestrang keinen Stand – und ein fehlender Stand ist **kein** negativer. Der Gesamtstand
ist dann der reine Praxisstand, nicht ein um 25 % gedrückter Wert (ADR-004). Ein Fehler an
dieser Stelle würde jedem Schüler im Oktober ein Nicht genügend anzeigen.

**TF-M sichert die Grenze selbst.** 51 % ist positiv, 50,9 % nicht. Der Test prüft beide
Seiten der Schwelle.

---

## 5 Was die Fälle zeigen

**TF-B und TF-C sind der eigentliche Beweis.** Ohne Zeitfaktor ergeben beide exakt 69,8 % –
die eine Person hat sich von 45 auf 90 verbessert, die andere von 90 auf 45 verschlechtert.
Eine Beurteilung, die beide gleich behandelt, bildet den *Durchschnitt* ab und nicht den
*Leistungsstand*. Mit Zeitfaktor liegen sie 9,3 Prozentpunkte auseinander.

**TF-E ist der einzige Notenwechsel.** 63,8 % (Note 4) werden zu 68,3 % (Note 3). Wer fünf
Sprints braucht, um anzukommen, und dann 92 % erreicht, steht am Ende nicht bei „Genügend“.

**TF-F und TF-G sind derselbe Vorfall zu verschiedenen Zeitpunkten** – ein einzelner Ausfall
von 30 %, sonst konstant über 80. Der Zeitfaktor behandelt sie ungleich: TF-F verliert 2,5
Punkte weniger als TF-G. Das ist die gewollte Wirkung, wenn der Ausfall ein
*Leistungsabfall* war. War es dagegen Krankheit oder ein einmaliger Konflikt, ist der zuletzt
erreichte Stand bei TF-G 84 % und nicht 30 % – dann ist ein **gesetzter Wert samt Begründung
die richtige Antwort** (FA-50), nicht eine Nachbesserung der Formel.

TF-G ist deshalb der wichtigste Fall in diesem Dokument: Er zeigt die Grenze der Rechnung.
Jeder Versuch, ihn per Formel zu lösen – Streichresultat, Ausreißerbereinigung, gleitendes
Mittel –, verschiebt die Entscheidung nur in eine Regel, die im nächsten Sonderfall wieder
falsch liegt. Die Verordnung verlangt an dieser Stelle ein Gutachten, keine Rechnung.

**TF-A, TF-H und TF-I ändern sich nicht.** Bei konstantem, schwankendem oder durchgehend
knappem Verlauf gibt es keinen Trend, den eine Gewichtung greifen könnte. Das ist ein gutes
Zeichen: Die Regel wirkt dort, wo sie soll, und sonst nicht.

---

## 6 Umsetzung als Test

Jeder Fall wird ein Testfall in `src/domain/scoring.test.ts`, mit der Nummer im Namen:

```ts
it('gewichtet die zweite Hälfte doppelt: TF-C Absteiger ergibt 65,1 % (FA-54)', …)
it('unterscheidet spiegelbildliche Verläufe: TF-B ≠ TF-C (FA-54 AK-5)', …)
it('rundet die Aufteilung zugunsten der späteren Sprints (FA-54 AK-2)', …)
```

Erwartete Werte werden auf eine Nachkommastelle geprüft. Die Fälle TF-A bis TF-I decken die
Grenzfälle der Gewichtung ab, nicht die der Kategorienrechnung – diese stehen weiterhin bei
FA-21 und FA-23.

**TF-G bekommt zwei Tests:** einen für den gerechneten Wert (75,0 %) und einen dafür, dass
ein gesetzter Wert von 80 % den gerechneten nicht löscht (FA-50 AK-2).

**TF-J bis TF-M** prüfen zusätzlich, dass die Sperre keinen gespeicherten Wert verändert
(FA-61 AK-3, ADR-010): Vor und nach dem Bilden des Vorschlags sind beide Strangstände und
der Gesamtstand identisch.

---

## 7 Offene Punkte

| Nr. | Frage | Status |
|---|---|---|
| OP-T1 | Sollen Verläufe mit fehlenden Sprints ergänzt werden – Krankheit über einen ganzen Sprint (Fachkonzept 10.5)? | offen |
| OP-T2 | Ein Fall mit Lernsprint (Sprintfaktor 0,5) fehlt noch; er prüft das Produkt aus beiden Faktoren (FA-24 AK-3) | offen |
| OP-T3 | Ein Fall, in dem eine Person an einem Test nicht teilgenommen hat – zählt nicht als 0 (FA-60 AK-4), aber wie wirkt er auf den Theoriestand bei nur zwei Tests? | offen |
