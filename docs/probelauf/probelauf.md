# Probelauf mit erfundenem Datenbestand

**Stand:** erzeugt am 13.09.2026 · Schemastand 3 · alle Namen erfunden

Der Datenbestand `probedaten.json` ist eine Sicherungsdatei. Die Zeiträume liegen
**relativ zum Erzeugungstag**: Sprint 3 läuft am 13.09.2026. Wird der Probelauf
deutlich später gemacht, verschieben sich die Zustände – dann sage Bescheid, dann
wird die Datei neu erzeugt.

## Einlesen

1. Anwendung öffnen, **Sicherung einlesen**, `probedaten.json` wählen.
2. Vorher den eigenen Bestand sichern, falls schon einer im Browser liegt: Das
   Einlesen ersetzt ihn.

## Was drin ist

| | |
|---|---|
| Klasse | 3AHIF, 11 Personen |
| Teams | Kepler (4), Curie (4 → ab Sprint 3 drei), Turing (3 → ab Sprint 3 vier) |
| Sprints | 1 Vorbereitung *(abgeschlossen)*, 2 *(abgeschlossen; Turing offen)*, 3 *(läuft)*, 4 *(Vorschlag)* |
| Sonstiges | ein Test (theorie, 30 min, angekündigt), eine Diplomarbeitsvorbereitung ohne Bewertung |

Bewusst eingebaute Grenzfälle:

- **Curie, Sprint 1:** Kriterium *CI/CD* leer → muss aus der Gewichtung fallen, nicht als 0 zählen.
- **Turing, Sprint 1:** Kategorie *Prozess* ganz leer → dasselbe auf Kategorieebene (ADR-004).
- **Turing, Sprint 2:** kein Abschluss → Sprint 4 darf nicht fixierbar sein.
- **Ebner Lukas:** in Sprint 1 keinem Team zugeordnet, erst ab Sprint 2 dabei.
- **Brunner David:** wechselt ab Sprint 3 von Curie zu Turing.
- **Brunner David beim Test:** nicht bewertet (gefehlt) – nicht 0 Punkte.
- **Turing:** kein Repository → die GitHub-Auswertung muss ohne auskommen.
- **Kepler, Sprint 3:** eingelesene GitHub-Auswertung mit einer nicht zugeordneten Kennung (`gast-ci`).
- **Curie, Sprint 2:** gesetzter Kategoriewert *Prozess* 55 % mit Begründung – der gerechnete muss daneben stehen bleiben.
- Peer-Urteile nur bei **Kepler, Sprint 1**. Curie hat in demselben Sprint keine – der Peer-Anteil muss dort einfach fehlen.

## Erwartete Werte

Diese Zahlen kommen aus der Rechenschicht, nicht aus der Oberfläche. Wenn die
Ansicht etwas anderes zeigt, ist das ein Fund.

**Sprintzustände**

| | Kepler | Curie | Turing |
|---|---|---|---|
| Sprint 1 | abgeschlossen | abgeschlossen | abgeschlossen |
| Sprint 2 | abgeschlossen | abgeschlossen | fixiert |
| Sprint 3 | fixiert, **läuft** | fixiert, **läuft** | fixiert, **läuft** |
| Sprint 4 | Vorschlag | Vorschlag | keine Planung |

Sprint 4 ist bei **keinem** Team fixierbar – alle warten auf den Abschluss von Sprint 3.

**Befund Sprint 2**

| Team | Muster | Team | Bezug (Median) | Spanne |
|---|---|---|---|---|
| Kepler | ungleich | 82 % | 80 % | 59 |
| Curie | zusammen | 64 % | 63 % | 34 |
| Turing | zusammen | 51 % | 63 % | 20 |

- **Moser Felix (Kepler):** Abstand −47, zwei Signale, **auffällig**. Das ist der Trittbrettfahrer-Fall.
- **Pichler Nina (Curie):** Abstand +24, ein Signal, *nicht* auffällig – Ausschlag nach oben.
- **Ebner Lukas (Turing):** Abstand −20, ein Signal, *nicht* auffällig – der Grenzfall.

**Abschnittsergebnisse Kepler, Sprint 2**

| | Team | Prozess | Individuell | Ergebnis |
|---|---|---|---|---|
| Berger Lena | 82 | 84 | 92 | 86 |
| Steiner Jonas | 82 | 84 | 88 | 85 |
| Haider Amira | 82 | 84 | 73 | 79 |
| Moser Felix | 82 | 84 | 33 | 65 |

**Sprintwert-Vorschläge Sprint 2:** Kepler 83 %, Curie 61 %, Turing 50 %.
Gesetzt sind 84 % (Sprint 1) und 86 % (Sprint 2) bei Kepler – der Vorschlag darf sie nicht überschreiben.

**Versionsverwaltung aus der GitHub-Auswertung (Kepler, Sprint 3):** Vorschlag **4 von 6**
(PR-Anteil 78 %, Review-Beteiligung 60 %, 3 direkte Pushes).

**Jahresstand ohne Stichtag**

| | | | | | |
|---|---|---|---|---|---|
| Berger Lena | 88 % (2) | Pichler Nina | 79 % (3) | Fuchs Elias | 59 % (4) |
| Steiner Jonas | 82 % (2) | Wagner Tobias | 70 % (3) | Kaiser Mira | 63 % (4) |
| Haider Amira | 82 % (2) | Leitner Sarah | 67 % (3) | Ebner Lukas | 48 % (5) |
| Moser Felix | 61 % (4) | Brunner David | 63 % (4) | | |

Die Note ist ein **Vorschlag** – im Bestand steht keine einzige Ziffer.

## Reihenfolge zum Durchklicken

1. **Struktur:** Klasse, Teams, Repositories, GitHub-Kennungen. Bei Turing fehlt das Repository – zeigt die Ansicht das ruhig an?
2. **Sprint 3 (läuft):** Ist er als laufender erkennbar, ohne dass man ein Datum nachrechnet? Planning und Daily sind erfasst, das Review noch nicht.
3. **Sprint 2 (abgeschlossen):** Die Maske muss **gesperrt** sein. Erst „zum Bearbeiten öffnen" gibt sie frei (FA-76). Befund und Retro ansehen.
4. **Sprint 4:** Planung als Vorschlag. Fixieren muss verweigert werden, mit Begründung.
5. **Rückmeldung an das Team** (Sprint 2, Kepler): Bausteine ein- und ausschalten, Text kopieren. Steht ein Personenwert drin? Darf nicht.
6. **Auswertung:** Jahresstand, Tendenz, Auslassungen. Ebner Lukas fehlt Sprint 1 – wird das als Auslassung benannt oder stillschweigend übergangen?
7. **Belegfassung** einer Person mit gesetztem Wert (Curie) – stehen gerechneter Wert, gesetzter Wert und Begründung nebeneinander?
8. **Test:** Brunner David hat keine Punkte. Nirgends darf 0 % stehen.

## Was zu notieren ist

Nicht Fehler suchen, sondern **Reibung**: Wo hast du gesucht? Wo gerechnet, was
dastehen müsste? Wo etwas zweimal eingegeben? Wo gezögert, weil unklar war, was
ein Klick auslöst? Jede dieser Stellen ist mehr wert als ein Rechenfehler – die
Rechnung ist durch 436 Tests abgedeckt, die Bedienung durch keinen.
