# Änderungsprotokoll

Alle nennenswerten Änderungen an der PRE/SYP-PRP-Bewertung. Format angelehnt an
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionierung nach
[SemVer](https://semver.org/lang/de/).

## [Unveröffentlicht]

Noch nichts.

## [0.2.0] – 2026-09-11 · „Erfassen“

Der Beurteilungsabschnitt trägt das Modell, die beiden Stränge sind getrennt, Tests sind
erfassbar, und die Sicherung hängt nicht mehr an einer Gewohnheit. Umgesetzt: FA-17, FA-39,
FA-46, FA-52, FA-53, FA-55 bis FA-60, FA-64, FA-65 und DS-06.

### Hinzugefügt

- Fachliches Konzept des Unterrichts mit Kompetenzmodell, Sprintdidaktik und
  Beurteilungsgrundsätzen (`docs/fachkonzept-unterricht.md`)
- Stakeholderanalyse mit Erfolgskriterien je Gruppe und entschiedenen Zielkonflikten (RB-07)
- Product Goal als eigenes Dokument, mit Messgrößen und Nicht-Zielen (RB-09)
- Risikoanalyse mit acht bewerteten Risiken und zugeordneten Maßnahmen (RB-08)
- Konzept für Anforderungs- und Lösungsmanagement: Satzschablone, Ablage, Nachvollziehbarkeit
- Prüflauf `npm run dokumente`: prüft die Ketten zwischen den Dokumenten und ihre
  Aktualität; in CI und Deploy eingebunden (RB-10)
- Issue-Vorlagen und Labeldefinition unter `scripts/github/`
- `CLAUDE.md` als Projektgedächtnis für KI-gestützte Arbeit am Repository
- Neun Anforderungen FA-39 bis FA-47, überwiegend zum Weg zurück zur Schülerin und zum
  Schüler: Rubrik vorab, Verstehensnachweis, Reflexion, Rückmeldung vor der Note
- FA-48 bis FA-51: Auswertung zu einem Stichtag, Notenstand eintragen, Werte auf jeder Ebene
  setzen, zurückhaltende Darstellung
- ADR-006 (gesetzte Werte treten neben die berechneten) und ADR-007 (Peer-Werte als
  gedeckelter Korrekturfaktor)
- FA-65: Die Rubrik wird **beim ersten Eintrag je Abschnitt eingefroren**. Spätere Änderungen
  wirken nur auf künftige Abschnitte; die Belegfassung zeigt damit, was zum Zeitpunkt der
  Erfassung galt. FA-47 warnt seither nicht mehr vor der Rubrikänderung, sondern vor dem
  ausdrücklichen Angleichen bereits bewerteter Abschnitte. R-06 gilt als behandelt
- Rückfallebene für den Fall, dass die KI-gestützte Korrektur nicht zulässig ist
  (Fachkonzept 3.6): weniger Tests, kürzere offene Fragen, Korrektur und Eintragung von Hand.
  Der Aufbau der Beurteilung bleibt unverändert, und die Anwendung ist davon nicht betroffen –
  die Anwendung spricht mit keinem KI-Dienst. OP-F15 wird im Nachgang geklärt und hält den
  Start nicht auf
- Risikoeinstufungen von R-10 bis R-12 an die Skala aus Kapitel 2 angeglichen; R-10 und R-12
  nach den getroffenen Entscheidungen neu bewertet
- **Umbenannt:** Das Werkzeug heißt **PRE/SYP-PRP-Bewertung** (vorher Sprintnote). Technisch
  `pre-syp-prp-bewertung` für Repository, Ordner und Paket; `pre-syp-prp` als Vorsilbe für
  Speicherschlüssel und Dateinamen. Betroffen waren 71 Stellen in Code, Dokumenten und
  Skripten. Die Kürzel stehen im Fachkonzept Kap. 3 einmal ausgeschrieben
- Product Goal auf 0.3 nachgezogen: Der Zielsatz sprach davon, eine Note zu *bilden* – die
  Software führt einen Stand, aus dem die Lehrkraft eine Note ableitet. Messgrößen an zwei
  Phasen und zwei Stränge angepasst, PZ-6 (Gefährdung vor dem Stichtag sichtbar) und PZ-7
  (kein Arbeitstag ohne Sicherung) ergänzt, PN-6 und PN-7 als Nicht-Ziele aufgenommen
- OP-S2 entschieden: Kolleginnen und Kollegen werden nicht aktiv bedient. Die Anwendung
  mitzubenutzen kostet nichts und teilt nichts – jeder Browser hat seinen eigenen
  Datenbestand; FA-11 (Rubrik als Datei weitergeben) bleibt `Kann` bis zur ersten Nachfrage
- **Releaseplan** (Anforderungen Kap. 3.1): Der Schnitt folgt dem Bedarfszeitpunkt, nicht dem
  Aufwand – 0.2.0 Erfassen bis Mitte Oktober, 0.3.0 Beurteilen bis Ende Jänner, 0.4.0
  Ergänzen laufend. Das Datenmodell kommt vollständig in 0.2.0, damit es nur eine
  Modelländerung gibt statt drei. 21 Anforderungen neu zugeordnet: 0.2.0 schrumpft von 30
  auf 11
- OP-M3 entschieden: keine Aufwandsschätzung je Anforderung
- FA-64: **automatische Sicherung** in einen einmal gewählten Ordner über die File System
  Access API – als Zusatzfunktion für Chromium-Browser, mit manuellem Export als Rückfall
  (ADR-011). Der Zeitpunkt der letzten erfolgreichen Sicherung ist dauerhaft sichtbar
- NFA-05 gelockert: Zusatzfunktionen dürfen an nicht überall vorhandenen Schnittstellen
  hängen, solange die Anwendung ohne sie vollständig bedienbar bleibt
- OP-2 entschieden: Betrieb auf einem Gerät, eine Anwenderin. RB-05 und ADR-001 bleiben
- Sicherungskonzept (Solution-Design 7.1): **täglich** in den schulischen Speicher, datierter
  Dateiname, keine Überschreibung. Neue Anforderung DS-06 zum Ablageort; NFA-03 und DS-02
  präzisiert – die Anwendung überträgt nichts, die Sicherungsdatei legt die Lehrkraft ab
- FA-46 auf den Tagesrhythmus umgestellt; damit ist OP-R2 entschieden
- Fachkonzept 10.4: Die Arbeitsteilung der beiden Stränge ist ausdrücklich festgelegt – die
  Praxis trägt Anwendung, Durchführung und Eigenständigkeit, die Theorie die Erfassung des
  Lehrstoffs und über die offene Frage einen Anteil Anwendung. Kein Strang muss für sich
  allein alles abdecken; § 14 LBVO betrachtet den Gegenstand als Ganzes
- FA-63: Testergebnisse aus einer Datei einlesen (0.3.0)
- Fachkonzept 3.6: Aufbau eines Tests – drei Multiple-Choice-Fragen zu je 2 Punkten und eine
  offene Frage zu 4 Punkten (20/20/20/40). Fünf bis sechs kurze Tests je Semester, einer je
  Thema. Die offene Frage wird mit KI-Unterstützung vorkorrigiert: pseudonymisiert, mit
  Bewertungsschema, und als Vorschlag – die Beurteilung bleibt bei der Lehrkraft
  (§ 11 Abs. 2 LBVO). Zulässigkeit als OP-F15 bei der Schulleitung
- Risiko R-12 zur KI-gestützten Korrektur; R-11 sinkt auf gering
- FA-62: Das Testzeitbudget je Semester nach § 8 Abs. 5 LBVO wird mitgeführt – 80 Minuten je
  Gegenstand und Semester, 25 Minuten je Überprüfung, beides einstellbar
- Festgelegt: mindestens ein, höchstens zwei Tests je Semester. Damit hat auch das
  Semesterzeugnis einen Theoriestand, und R-11 sinkt von hoch auf mittel
- FA-59 bis FA-61: Der Gegenstand hat **zwei Stränge** – Praxis 75 %, Theorie 25 % mit zwei
  bis vier Tests im Jahr. Ein Strang unter der Genügend-Grenze setzt den Notenvorschlag auf
  Nicht genügend, ohne einen gespeicherten Wert zu verändern (ADR-010, § 14 LBVO)
- Berichtigt: Tests sind schriftliche Überprüfungen und **anzukündigen** (§ 8 LBVO). Die
  Aussage „Ankündigung entfällt“ galt nur für die Mitarbeitsfeststellung im Praxisstrang
- Risiko R-11: Die Sperre entscheidet über positiv oder negativ, ruht aber auf zwei bis vier
  Feststellungen
- OP-4 entschieden: kein Beurteilungsanteil ohne Abschnitt und ohne Kriterien
- Fachkonzept 9.1: KI-Einsatz wird im Pull Request vermerkt – als Teil der Definition of
  Done, ausdrücklich nicht als Bewertungskriterium. Gilt für die Schülerprojekte und für
  dieses Projekt selbst; Pull-Request-Vorlage unter `scripts/github/` ergänzt
- FA-58: Die Teamzugehörigkeit gilt je Abschnitt statt je Person. Teams dürfen wechseln –
  zwischen Sprints und regelmäßig zur Diplomarbeitsvorbereitung, in der sich die Gruppen nach
  Thema neu bilden. Damit ist OP-6 erledigt
- Fachkonzept 8.8: die Rubrik der zweiten Phase – elf Kriterien, Gewichte 30 / 20 / 50
- FA-55 bis FA-57: Der **Beurteilungsabschnitt** trägt das Modell statt des Sprints. Eine
  Rubrik je Abschnitt statt einer für alles; die Diplomarbeitsvorbereitung wird ein Abschnitt
  eigener Art; Schemastand 2 samt Migration des bestehenden Bestands (ADR-009)
- Fachkonzept 3.4: Der Gegenstand läuft bis Schuljahresende. Ab Mai folgt die
  Diplomarbeitsvorbereitung – Themensuche in der Wirtschaft, Präsentation vor dem
  Lehrergremium, Freigabe Anfang Juni. Der 30. April ist Phasengrenze, kein Stichtag
- FA-48 auf drei Stichtage erweitert: Ende Jänner, Ende April (Frühwarnung nach
  § 19 Abs. 3a SchUG), Anfang Juni
- Risiko R-10: Ein Drittel der Jahresnote entsteht in einer Phase, die das Werkzeug noch
  nicht abbildet
- FA-54: Zeitfaktor nach § 20 Abs. 1 LBVO – die zweite Hälfte der Sprints eines
  Beurteilungszeitraums zählt doppelt. Das Gewicht eines Sprints ist das Produkt aus
  Sprintfaktor und Zeitfaktor; ADR-008 begründet die Stufe gegen eine steigende Reihe
- `docs/testfaelle-notenfindung.md`: neun durchgerechnete Verläufe mit erwarteten Werten,
  die als Regressionstests hinterlegt werden
- Fachkonzept Kap. 14: Rechtsgrundlagen und Quellenverzeichnis (LBVO, SchUG) mit Abrufdatum
- FA-52 und FA-53: Die Peer-Bewertung wird je Sprint zugeschaltet – Vorgabe aus – und das
  Werkzeug fragt am Ende jeder Sprintbewertung nach, ob sie ab dem nächsten Sprint läuft

### Geändert

- **FA-53 Nachfrage am Ende der Sprintbewertung.** Sobald jedes Mitglied jedes Teams eines
  Abschnitts ein Ergebnis hat, erscheint in der Bewerten-Ansicht die Frage, ob die
  Peer-Bewertung ab dem nächsten Abschnitt laufen soll. Sie blockiert nichts und kennt drei
  Antworten – „ja“, „nein“ und „später“; auch das „später“ wird festgehalten, sonst stünde die
  Frage nach jedem Neuladen wieder da. Jede Antwort wird mit Abschnitt und Datum vermerkt
  (`peerEntscheidungen`), damit nachvollziehbar bleibt, ab wann Peer-Werte einfließen. Ein „ja“
  schaltet den nächsten **bereits angelegten** Abschnitt ein; für später angelegte bleibt die
  Vorgabe „aus“, weil FA-52 AK-1 das so festlegt. Diese Spannung ist als OP-F16 offen notiert
- **FA-64 Automatische Sicherung in einen gewählten Ordner** (ADR-011). Der Ordner wird einmal
  gewählt und bleibt als Handle in IndexedDB; danach schreibt die Anwendung die Tagesdatei
  `pre-syp-prp-JJJJ-MM-TT.json` ohne Dialog dorthin – drei Sekunden nach der letzten Änderung,
  nicht bei jedem Tastendruck. Es entsteht kein Netzwerkaufruf (NFA-03); geschrieben wird eine
  lokale Datei. Nach einem Neuladen ist die Schreibberechtigung einmal je Sitzung zu
  bestätigen – die Anwendung fragt das **nicht** von sich aus, weil der Browser eine Nachfrage
  ohne Klick ablehnt, sondern bietet einen Schalter an. Fehlschläge landen sichtbar in Fußzeile
  und Hinweisband; still scheitern darf die Automatik nicht. In Browsern ohne die File System
  Access API wird die Funktion gar nicht erst angeboten, und die Anwendung sagt das (AK-7)
- **DS-06 Ablageort der Sicherung**: Der Hinweis auf den schulischen Speicher steht jetzt beim
  Export, beim Einrichten des Ordners und dauerhaft in der Fußzeile
- **FA-46 Erinnerung an die Sicherung.** Wurde am laufenden Tag gearbeitet und noch nicht
  gesichert, erscheint ein abweisbarer Hinweis mit Zeitpunkt und Umfang der letzten Sicherung;
  liegt sie mehr als drei Tage zurück, wird er deutlich. In der Fußzeile steht der Stand
  dauerhaft, nicht nur als wegklickbare Meldung. Die Regel liegt als reine Funktion in
  `store/sicherung.ts` und ist ohne Oberfläche prüfbar (NFA-06); der Stand hat einen eigenen
  Speicherschlüssel, damit eine eingelesene Sicherungsdatei nicht behauptet, sie sei bereits
  gesichert worden. Die beiden Fälle der automatischen Sicherung (FA-46 AK-6) sind im Modell
  bereits vorgesehen und greifen, sobald FA-64 steht
- **FA-39 Rubrik zur Ausgabe an die Klasse.** Ein Schalter „Kriterien ausgeben“ in der
  Bewerten-Ansicht erzeugt ein in sich geschlossenes HTML-Blatt zum Ausdrucken oder
  Weitergeben: alle Kriterien mit Beschreibung und Punktemaxima, die Kategoriegewichte und der
  Notenschlüssel. Kein Skript, kein Verweis nach außen (NFA-03). Das Blatt kennt nur Rubrik und
  Notenschlüssel – Namen und Punkte werden gar nicht erst übergeben. Es zeigt die für den
  Abschnitt tatsächlich geltende Rubrik, nach dem Einfrieren also die Kopie (FA-65). Für einen
  Test wird es **nicht** angeboten: dort sind die Kriterien die Fragen (neue AK-4 bis AK-7)
- **FA-17 Notiz je Person** ist in der Oberfläche angekommen: eine eigene Karte „Notizen je
  Person“ in beiden Erfassungsmasken, neben der Notiz an das Team (FA-16). Sie ist eine
  Aufzeichnung der Lehrkraft (§ 18 Abs. 1 SchUG) und erscheint in keiner Ausgabe an die
  Klasse. Eine geleerte Notiz wird nicht abgelegt; eine Notiz ohne Punkte bleibt erhalten.
  Die Akzeptanzkriterien AK-1 bis AK-5 waren im Anforderungsdokument nachzutragen
- **Schemastand 2 umgesetzt (Block A).** Das Datenmodell trägt jetzt den **Abschnitt** statt
  des Sprints: Ein Sprint, die Diplomarbeitsvorbereitung und ein Test sind drei Arten
  desselben Bausteins (FA-56). Dazu die beiden Stränge Praxis und Theorie mit Vorgabe 75 zu 25
  (FA-59), eine Rubrik je Abschnitt aus mehreren wählbar (FA-55), die Teamzugehörigkeit je
  Abschnitt statt an der Person (FA-58), das Einfrieren der Rubrik beim ersten Punkteintrag
  (FA-65) und Tests als eigene Abschnittsart mit eigener Rubrik (FA-60)
- Die Migration hebt einen Bestand von Stand 1 auf Stand 2 und legt vorher eine unveränderte
  Sicherung an (FA-57). Punkte, Notizen und Peer-Urteile bleiben unangetastet; aus der einen
  Rubrik wird die Rubrikliste, aus `sprints` werden Abschnitte im Praxisstrang, und die
  Teamzuordnung der Personen wird je Abschnitt festgeschrieben
- Der Notenschlüssel gehört nicht mehr zur Rubrik, sondern zum Gegenstand: Er stand vorher in
  jeder Rubrik und hätte sich mit mehreren Rubriken widersprechen können
- Die Erfassungsmaske hat zwei Formen (FA-60 AK-3): Sprint und Diplomarbeitsvorbereitung
  teamweise wie bisher, ein Test als Tabelle Person × Frage über die ganze Klasse, ohne Team
- Die Peer-Bewertung erscheint nur noch in Abschnitten, in denen sie eingeschaltet ist
  (FA-52); Vorgabe ist aus
- Die Auswertung weist Praxis und Theorie getrennt aus und führt sie erst danach zusammen;
  ein Strang ohne jedes Ergebnis fällt aus der Gewichtung, statt als 0 zu zählen (FA-59 AK-5).
  Der CSV-Export trägt dieselben Spalten
- Die Spalte „Team“ in Auswertung und Export nennt die Zuordnung im letzten Abschnitt mit
  Team – Teams dürfen wechseln

- Anforderungsdokument auf 0.2: alle funktionalen Anforderungen in Satzschablonenform, je
  Anforderung Stakeholder, Zweck und Status
- Fachkonzept auf 0.2: Der Product Owner ist oft nicht die Lehrkraft. Der Auftraggeber nimmt
  ab, die Lehrkraft beurteilt; die Produktnote trägt, was auftraggeberunabhängig prüfbar ist
- Solution Design auf 0.2: Datenmodell um Auftraggeber, Verstehensnachweis, Reflexion und
  Auftraggeber-Rückmeldung erweitert
- Fachkonzept auf 0.8 und Anforderungen auf 0.5: **Die Aufzeichnungen enthalten keine Noten**
  (G8). Festgehalten werden Punkte und Prozentwerte; die Ziffer 1 bis 5 vergibt die Lehrkraft
  als Notenstand. Jede Ebene der Bewertungspyramide ist überspringbar, ein gesetzter Wert
  tritt neben den berechneten und ersetzt ihn nicht (G9). Schülerinnen und Schüler erhalten
  eine knappe Rückmeldung statt der vollständigen Herleitung (G10) – die Belegfassung
  (FA-32) und die Rückmeldung an die Person (FA-42) sind seither zwei getrennte Ausgaben
- Peer-Werte gehen nicht mehr als gewichtete Kategorie ein, sondern als Korrekturfaktor von
  höchstens ±5 Prozentpunkten (FA-45)
- Solution Design auf 0.3: Datenmodell und Formeln entsprechend nachgezogen

### Behoben

- Die Schwelle für ein auffälliges Selbstbild (FA-27) lag in der Erfassungsmaske statt in der
  Domäne – ein Bruch der Schichtregel aus NFA-06. Sie ist jetzt als `selbstbildAbweichung()`
  in `domain/scoring.ts` und durch Unit-Tests abgedeckt. Gefunden durch den neuen Prüflauf.
- E2E-Tests sprachen Reiter mehrdeutig an; die Navigationsleiste wird jetzt gezielt adressiert.

**Aus dem ersten vollständigen Prüflauf am 11.09.2026** – bis dahin war das Projekt nie
ausgeführt worden, weil in der Entwicklungsumgebung keine Paketquellen erreichbar sind:

- ESLint kannte für `scripts/*.mjs` keine Umgebung: Die Globals waren nur für `**/*.{ts,tsx}`
  gesetzt, weshalb `console`, `process` und `URL` als undefiniert galten. Eigener
  Konfigurationsblock für Node-Skripte ergänzt, mit `no-console: off` – der Prüflauf ist ein
  Kommandozeilenwerkzeug, seine Ausgabe ist sein Zweck.
- `getByDisplayValue` im E2E-Test gibt es in Playwright nicht; das ist Testing-Library-
  Vokabular. Ersetzt durch `getByLabel('Teamname')` mit `toHaveValue` – was präziser prüft,
  was gemeint war.
- Der Prüflauf ermittelte sein Wurzelverzeichnis über `new URL(…).pathname`. Unter Windows
  liefert das `/C:/…`, was `join()` zu `C:\C:\…` verkettet. Jetzt `fileURLToPath()`.

**Aus dem ersten CI-Lauf am 11.09.2026:**

- `playwright.config.ts` verwendet `process.env`, `tsconfig.json` führt in `types` aber nur
  `vite/client` – Node-Globals sind also nicht Teil des Programms. **Lokal fiel das nicht
  auf**, weil TypeScript `@types/node` aus einem `node_modules` im Benutzerverzeichnis
  auflöste; auf dem Runner gibt es das nicht. Jetzt `@types/node` als ausdrückliche
  Entwicklungsabhängigkeit und eine `/// <reference types="node" />` genau in der einen
  Datei, die sie braucht – damit bleiben Node-Globals aus dem Anwendungscode heraus.


**Aus dem ersten E2E-Lauf am 11.09.2026:**

- **Datenverlust beim Schließen (FA-19, Risiko R-01).** Das Speichern war um 400 ms entprellt
  und hatte keinen Abschluss beim Verlassen der Seite. Wer eine Eingabe machte und den Tab
  innerhalb dieser 400 ms schloss oder neu lud, verlor sie – sichtbar eingetippt und trotzdem
  fort. Jetzt wird bei `pagehide` und beim Wechsel in den Hintergrund sofort geschrieben. Der
  E2E-Test lädt bewusst ohne Wartezeit neu und deckt genau diesen Weg ab.
- Zwei E2E-Prüfungen waren mehrdeutig: `/Sprint 1/` traf sowohl die Überschrift des Sprints
  als auch „Ergebnis Sprint 1“, und „Team Kepler“ steht in mehreren Tabellen. Jetzt über die
  Überschriftenebene beziehungsweise über die Karte eingegrenzt.

## [0.1.0] – 2026-09-09

Erste Fassung im Repository. Setzt die mit **M** priorisierten Anforderungen des
Anforderungsdokuments v0.1 um.

### Hinzugefügt

- Stammdaten: Klassen, Teams, Schülerinnen und Schüler, Sprints mit Sprintfaktor
  (FA-01 bis FA-04)
- Rubrik mit vier Kategorien, frei änderbaren Kriterien, Punktemaxima, Gewichtung und
  Notenschlüssel (FA-05 bis FA-10)
- Erfassung je Sprint und Team: Team-Ergebnis, Scrum-Prozess, individueller Beitrag,
  Peer- und Selbsteinschätzung, Sprintnotiz (FA-12 bis FA-19)
- Berechnung: Kategorieprozent nur über ausgefüllte Kriterien, Peer-Skala 1–5 linear auf
  0–100 %, gewichtetes Sprintergebnis ohne Abwertung fehlender Kategorien, Gesamtergebnis
  mit Sprintfaktor, Note nach eigenem Schlüssel (FA-21 bis FA-26)
- Auswertung: Einzelergebnisse je Sprint, Teamvergleich, Notenverteilung, CSV-Export
  (FA-28 bis FA-31)
- Sicherung des gesamten Datenbestands als JSON-Datei, Einlesen und vollständiges Löschen
  (FA-33, DS-03)
- Speicherung im `localStorage` mit Schemaversion, Migration und Sicherung eines
  beschädigten Bestands (NFA-09)
- Unit-Tests für Berechnung, Zustandsänderungen, Persistenz und CSV-Ausgabe
- CI-Pipeline (Lint, Typprüfung, Unit-Tests mit Abdeckung, Build, E2E) und Auslieferung
  der Testumgebung nach GitHub Pages (RB-04)

### Bekannte Einschränkungen

- Teamwechsel zwischen Sprints wird noch nicht historisiert (OP-6)
- Erfassung der Peer-Bewertung durch die Schülerinnen und Schüler selbst ist offen (FA-20)
- Bewertungsbegründung je Person und Druckansicht folgen in 0.2.0 (FA-32)
- Komponententests folgen in 0.2.0; bislang decken Unit- und E2E-Tests ab
