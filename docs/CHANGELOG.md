# Änderungsprotokoll

Alle nennenswerten Änderungen an der PRE/SYP-PRP-Bewertung. Format angelehnt an
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionierung nach
[SemVer](https://semver.org/lang/de/).

## [Unveröffentlicht]

### Geplant

- **Schemastand 5** ([ADR-012](adr/0012-projekt-als-ordnungsachse.md), Schritt 2,
  [Solution-Design 5.0d](solution-design.md)): `Abschnitt.projektId` statt `Abschnitt.klasseId`,
  `Abschnitt` und `Teamabschnitt` verschmelzen, `Team.klasseId` entfällt. Dabei wird **`Team` zu
  `Projekt` umbenannt** (OP-F40) – in einem Zug, ohne weitere Änderung im selben Commit

- **Klasse aus einer Datei einlesen** (FA-89) – vorher braucht es eine echte Exportdatei aus dem
  Schulverwaltungssystem, sonst wird der Import zweimal gebaut – und **Klassen-/Schülerfilter in
  Theorie-Tests und Notenauswertung** (FA-92). Letzteres bewusst erst, wenn der Aufbau dieser
  beiden Sichten entschieden ist (OP-F32, OP-F33)

- **Probelauf mit `docs/probelauf/probedaten.json`** (OP-F39). Die Anwendung ist nie mit
  fünfundzwanzig Schülern und drei Projekten gelaufen

---

## [0.8.0] – 2026-09-15 · „Ordnen“

**Die erste Fassung, die einen ganzen Durchgang trägt.** Bis hierher konnte die Anwendung
bewerten und rechnen; sie konnte aber nicht ordnen, was dabei anfällt. Das Projekt war eine
Ansammlung von Abschnitten einer Klasse, Stammdaten lagen auf einem Blatt zusammen, und ein
Filter wirkte auf vier von zehn Sichten. Mit dieser Fassung ist das Projekt die Ordnungsachse,
jedes Stammdatum hat sein Blatt, und der Klassenfilter gilt für die ganze Anwendung.

**Bekannte Einschränkungen**, damit sie nicht beim ersten Einsatz überraschen:

- Klassenlisten müssen **von Hand** eingetippt werden; der Dateiimport (FA-89) fehlt.
- Der Aufbau der Sichten **Theorie-Tests** und **Notenauswertung** ist noch nicht entschieden
  (OP-F32, OP-F33); beide tragen einen sichtbaren Hinweis darauf.
- Die Anwendung ist noch **nie mit echten Daten** gelaufen (OP-F39).

### Hinzugefügt

- **Ein Klassenfilter für die ganze Anwendung** (FA-95, fachliche Grundlage **A14**). Die
  Klassenwahl in der Kopfleiste kennt jetzt **„alle Klassen"** und *wirkt* auf jeder Sicht: auf
  der Schülerliste, auf beiden Projektlisten, auf Tests, auf der Notenauswertung und auf der
  Projektleiste der Sprintsichten. Bisher stand sie überall, tat aber nur auf vier von zehn
  Sichten etwas – und auf der Projektsicht standen zwei Bedienelemente namens „Klasse"
  nebeneinander, mit verschiedener Bedeutung. Der eigene Klassenfilter jener Sicht ist darin
  aufgegangen; „nur gemischte" bleibt als eigener Schalter, weil „gemischt" kein Klassenwert
  ist, sondern eine Eigenschaft – beides zusammen ergibt „gemischte Projekte, an denen die
  4AHIF beteiligt ist".

  Zwei Regeln machen das erst brauchbar. **Ist ein Gegenstand gewählt, gilt seine Klasse und
  nicht der Filter**: Die Schüler zu einem Test kommen aus der Klasse des Tests, die Sprints
  eines Projekts aus dem Projekt – sonst zeigte „alle Klassen" alle Schüler der Schule zu einem
  Test einer einzigen Klasse. Und **ein Projekt gehört zu der Klasse, aus der seine Mitglieder
  kommen** (Fachkonzept 15.1), nicht zu einem Feld am Projekt; ein gemischtes Projekt steht
  damit in beiden Klassen. Ein frisch angelegtes Projekt ohne Mitglieder bleibt in der Klasse
  sichtbar, in der es angelegt wurde – sonst wäre der nächste Schritt, die Schüler zuzuordnen,
  nicht mehr erreichbar.

  Verschwindet die gefilterte Klasse, fällt der Filter auf „alle Klassen" zurück und nicht auf
  die nächstbeste: Wer eine Klasse gelöscht hat, arbeitet danach nicht stillschweigend in einer
  anderen weiter.

  **Behoben, vom Auftraggeber gemeldet:** Ein Projekt ohne Sprint war eine Sackgasse. Die
  Sprintsicht zeigte nur die Leermeldung – die Projektleiste, mit der man zu einem anderen
  Projekt käme, stand erst über dem *gefüllten* Inhalt und fehlte damit genau dort, wo man sie
  braucht (FA-95 AK-10). Sie steht jetzt vor der Leermeldung. Aus derselben Ursache sagen die
  leeren Sichten jetzt auch, **ob sie leer oder gefiltert sind**: „Kein Test in dieser Klasse"
  mit einem Schalter „Alle Klassen zeigen" ist eine andere Auskunft als „Noch kein Test
  angelegt" (AK-11).

- **Geplante und umgesetzte Anforderungen je Sprint** (FA-96, fachliche Grundlage **A15**). Im
  Sprintplanning steht jetzt neben dem Ziel ein Feld für die geplanten Anforderungen, im
  Sprintreview eines für die umgesetzten – und dort stehen **beide nebeneinander**. Einzeln
  sagt keiner von beiden etwas; erst der Vergleich beantwortet die erste Frage des Reviews.
  Vorerst Freitext, eine Zeile je Anforderung (OP-F38).

  Beide Texte gehen in **keine Rechnung** ein (G9): Dass eine Anforderung offen blieb, ist eine
  Feststellung. Ob sie dem Team anzulasten ist – falsch geschätzt, umpriorisiert oder
  liegengeblieben –, entscheidet die Lehrkraft und schreibt es in die Sprintnotiz. Eine Software,
  die Zeilen zählt und daraus eine Note ableitet, verlöre genau diese Unterscheidung.

- **Stammdaten werden nur noch in den Stammdatenblättern gepflegt, und Löschen hat zwei
  Ausgänge** (FA-94, fachliche Grundlage **A13** und **G7**). Anlegen, Ändern und Löschen eines
  Projekts ist aus der Projektsicht verschwunden; sie zeigt Typ und Repository nur noch an und
  verweist auf „Stammdaten · Projekte". Geblieben ist dort das **Anlegen eines Sprints** – ein
  Sprint ist kein Stammdatum, sondern Leistungsdatum (Plan und Ist), Festlegung des
  Auftraggebers vom 14.09.2026.

  Beim Löschen entscheidet jetzt die Anwendung, **wie** gelöscht wird: **endgültig**, solange
  nichts Bewertetes am Objekt hängt – ein Bestand, in dem jeder Tippfehler ewig mitläuft, wird
  unbenutzbar –, und **logisch**, sobald Punkte, Peer-Urteile, ein gesetzter Wert, eine
  eingefrorene Rubrik oder ein Notenstand daran hängen. Logisch gelöscht heißt: aus allen
  Listen, Auswahlfeldern und Auswertungen verschwunden, in bestehenden Bewertungen und
  Belegfassungen aber weiterhin lesbar. Anders wäre eine Note nicht mehr rekonstruierbar (G7).

  Welcher der beiden Ausgänge greift, steht **vor** der Bestätigung neben dem Schalter. Dass die
  Anwendung entscheidet, heißt nicht, dass sie es für sich behält. Jedes Blatt zeigt auf Wunsch
  seine gelöschten Einträge und stellt jeden davon mit einem Klick wieder her; ohne diesen Weg
  wäre „logisch gelöscht" nur eine unsichtbare Falle. Die Vorgaberubrik bleibt in jedem Fall –
  ohne sie hätte ein neuer Abschnitt keine Kriterien (FA-55 AK-2).

- **Einzelne Stichtage anlegen** (FA-48): Bisher gab es nur die Vorlage für den ganzen Durchgang
  – drei Zeitpunkte, alles oder nichts. Eine zweite Frühwarnung war damit nicht erfassbar,
  obwohl das Datenmodell sie seit je erlaubt

- **`npm run ausmustern -- <datei>`**: legt eine Datei mit `yyyymmdd_hhmmss_`-Präfix nach
  `_temp/` und löscht das Original. Der Grund ist nicht Bequemlichkeit: Eine KI kann in diesem
  Aufbau auf dem Rechner des Auftraggebers lesen und schreiben, aber nicht löschen – und die
  Freigabe dafür gälte für einen **ganzen Ordner und die restliche Sitzung**. Für drei
  ausgemusterte Dateien ist das eine Reichweite ohne Verhältnis. Also macht es der Rechner
  selbst, auf ausdrücklichen Aufruf. `_temp/` ist von Git ausgenommen; `--nur-anzeigen` zeigt
  vorher, was geschähe, und ein Fehler bricht ab, bevor irgendetwas verändert wurde

- **Stammdaten: sechs Blätter statt einem** (FA-34 AK-3 bis AK-3d). Bisher trug eine einzige
  Sicht Klassen, Projekte, Schüler, Abschnitte, Teamzuordnung und Stichtage nebeneinander.
  Jetzt: **Klassen**, **Schüler**, **Projekte**, **Tests**, **Rubrik & Notenschlüssel**,
  **Stichtage** – ein Blatt je Sache. Die Klasse wird **beim Schüler** zugeordnet, die
  Projektzuordnung **beim Projekt**; auf dem Schülerblatt steht sie nur noch als Auskunft. Die
  GitHub-Kennung bleibt dort, wo sie hingehört – als Spalte in der Schülerliste, ohne eigene
  Karte

- **Die Diplomarbeit ist ein Projekt eines Typs** (FA-73 neu gefasst): keine eigene Sicht und
  keine eigene Abschnittsart mehr. Sie wird geführt wie jedes Projekt – mit Mitgliedern,
  Sprints und Bewertungen. Bestehende Abschnitte der alten Art bleiben erreichbar, bis
  Schemastand 5 sie umhängt

- **`Team.kennungen` ist entfallen.** Die GitHub-Kennung liegt seit Schemastand 4 an der
  Person (FA-88 AK-3); sie am Projekt ein zweites Mal führen zu können war eine zweite
  Wahrheit. Die eingelesene Auswertung löst Kennungen jetzt über den Schüler auf

- **Teststrategie 8.1: welche Durchstiche es geben soll** – fünf, in der Sprache des
  Unterrichts, jeder mit seiner fachlichen Grundlage aus Fachkonzept 15.2. Das Kapitel sagte
  seit jeher „wenige Durchstiche" und nannte genau einen; es sind 21 geworden, Anforderung für
  Anforderung. Die Durchsicht dagegen steht aus und ist als Befund vermerkt

- **Schemastand 4: Schüler gehören zu Projekten, nicht zu Sprints.** Die Zuordnung ist eine
  eigene Größe (`Mitgliedschaft`) und gilt für alle Sprints eines Projekts. Damit entfallen
  `Zugehoerigkeit`, die Vorbelegung `Person.teamId` und `Team.kennungen` – die GitHub-Kennung
  liegt an der Person. **Ein Schüler darf in mehreren Projekten sein** (im 5. Jahrgang laufen
  SYP/PRE-Projekt und Diplomarbeit nebeneinander); die Anwendung warnt und verlangt eine
  Bestätigung, die mit Datum an der Mitgliedschaft festgehalten wird. Eine Migration hebt
  bestehende Bestände; **die Rechnung ändert sich dabei nicht** – wer durchgehend in einem Team
  war, ist danach Mitglied genau dieses Projekts. Verloren geht nur der Fall „wechselt im
  dritten Sprint das Team", eine ausdrückliche Festlegung des Auftraggebers
  ([Fachkonzept 15.2](fachkonzept-unterricht.md), A8)

- **Fachliches Modell** als [Fachkonzept, Kapitel 15](fachkonzept-unterricht.md): die
  Gegenstände des Unterrichts samt Beziehungen (15.1) und die Arbeitsweise damit (15.2, A1 bis
  A12). Es ist der Maßstab, gegen den sich das technische Modell und der Zuschnitt der Sichten
  prüfen lassen. Jede Aussage nennt ihre Wirkung aufs Produkt; „ohne Produktwirkung" ist eine
  gültige Antwort, weil das Fachkonzept den Unterricht beschreibt und nicht die Software

- **Vier Bereiche statt fünf** (FA-34 neu gefasst): **Projekte**, **Tests**,
  **Notenauswertung**, **Stammdaten**. Die ersten beiden sind die getrennten Leistungsbereiche,
  der dritte führt sie zusammen, der vierte trägt vier Unterseiten – Schüler & Klassen,
  Projekte, Tests, Rubrik & Notenschlüssel. Je Leistungsbereich also eine eigene
  Stammdatenseite; Schüler und Notenschlüssel gelten für beide und stehen daneben

- **Stammdaten · Projekte**: alle Projekte als Liste, zum gewählten Name, Typ, Repository,
  Zeitraum, Beschreibung und die Schülerzuordnung mit der Überschneidungswarnung. Die Klasse
  steht **nicht** am Projekt – die Spalte „Klasse(n)" wird aus den Mitgliedern abgeleitet, und
  „gemischt" ist dadurch kein Zustand, den jemand pflegt

- **Stammdaten · Tests**: Ankündigung nach § 8 LBVO, Arbeitszeit, Termin – und der Hinweis,
  dass die **Fragen die Rubrik dieses Tests sind**, mit dem Weg dorthin

- **Fünf Bereiche statt acht** (FA-34 neu gefasst): **Projekt**, Theorie-Tests, Notenauswertung,
  Schüler & Klassen, Rubrik & Notenschlüssel. Die Reihenfolge folgt jetzt der **Häufigkeit der
  Benutzung** und nicht mehr dem Ablauf. Der Ablauf ist nicht verschwunden – Sprintplanning,
  Daily, Sprintreview und Diplomarbeitsvorbereitung stehen in einer zweiten, untergeordneten
  Zeile. Diese Zeile ist **nur im Bereich Projekt** sichtbar (AK-5a): Ein Sprintteil gehört zu
  einem Projekt, und ohne Projekt ist er ein Schritt ohne Gegenstand. Solange ein Teil offen ist,
  bleibt „Projekt" der gewählte Bereich

- **Bereich „Projekt"** als Einstieg (FA-90, FA-91, FA-84): Filter nach Jahrgang und Klasse –
  einschließlich **„gemischt"** für Projekte über Klassengrenzen –, eine Liste aller Projekte mit
  dem Sprint, in dem jedes gerade steht, und darunter die Sprintliste des gewählten Projekts mit
  Nummer, Zeitraum, Ziel und Zustand. Von dort geht es in Planning, Daily und Review; ein neuer
  Sprint lässt sich hier anlegen. Das **Repository** steht am Projekt, damit für ein Gespräch ohne
  Suchen ein vorübergehender Klon möglich ist. **„Gemischt" wird abgeleitet**, nicht erfasst: aus
  den Klassen der Mitglieder. Ein Kennzeichen, das jemand setzen muss, wäre neben der
  Mitgliederliste eine zweite Wahrheit

- **Bereich „Schüler & Klassen"** (FA-88): eine schlichte Liste je Schüler mit Klasse, Name,
  **GitHub-Kennung** und **Schul-E-Mail**, durchsuchbar. Dieselbe Kennung zweimal wird gemeldet –
  zwei Personen mit einer Kennung machen jede Beitragsverteilung falsch, und zwar unbemerkt. Die
  Kennung liegt damit an der **Person** statt am Projekt. Ob die Adresse zum GitHub-Konto gehört,
  kann die Anwendung nicht feststellen: Sie ruft nichts ab (ADR-001), und GitHub verbirgt Adressen
  standardmäßig – der Abgleich im Skript bleibt ein Hinweis und ist kein Nachweis

- **Projektart** am Projekt (FA-87 AK-2): SYP/PRE 4. Jahrgang, SYP/PRE 5. Jahrgang, Diplomarbeit.
  Der **Jahrgang** wird daraus abgeleitet; ein Projekt ohne Art fällt aus dem Jahrgangsfilter
  heraus und wird keinem Jahrgang zugeschlagen (dieselbe Regel wie ADR-004: was fehlt, zählt nicht
  als Null)

- **Hinweis auf ausstehende Überarbeitung** (FA-93) in Theorie-Tests und Notenauswertung. Er nennt
  den offenen Punkt, unter dem entschieden wird (OP-F32, OP-F33), sperrt nichts und verschwindet
  mit der Entscheidung. Steht er länger als einen Durchgang, ist das selbst ein Befund (R-07)

- **`npm run deutung`** (`scripts/auswertung-deuten.mjs`): macht aus der JSON-Auswertung einen
  Bericht mit drei Teilen – **Zahlen**, **Interpretation der Auswertung** und **Fragen für das
  Gespräch**. Die Interpretation ist *gerechnet*: feste Regeln, für jedes Team dieselben (G11,
  R-14), und jede Aussage nennt, was sie nicht sagt. Erkannt werden unter anderem: hoher
  PR-Anteil ohne ein einziges Review (R-13), schiefe Beteiligung und das Muster „designierter
  Ingenieur" (E1a), Arbeit in den Ferien (G4, R-09), Schubarbeit, lange Pausen, Kennungen ohne
  Person. Optional dazu: **Wissensinseln** aus einer Arbeitskopie (`--klon`) sowie **Issues,
  Board und rote Pipeline-Phasen** über `gh` (`--repo`). Kein Punktevorschlag – den rechnet die
  Anwendung (FA-81 AK-5)

- **Team-Repositories kommen aus der Sicherungsdatei** (`--bestand`): Die Adresse wird nur in
  der Anwendung gepflegt (FA-81 AK-3), die Skripte lesen sie von dort. Damit erkennt der
  Bericht auch **Kennungen, die keiner Person zugeordnet sind** – ein Schul- oder gemeinsames
  Konto verschiebt die ganze Verteilung, und das steht dann im Bericht

- **Vor dem Versand an ein KI-Werkzeug** ersetzt der Bericht alle Kennungen und Namen durch
  Pseudonyme. Die Zuordnung bleibt auf dem Gerät – dieselbe Regel wie in den beiden anderen
  Skripten

### Geändert

- **Durchstiche gestrafft: von 21 E2E-Fällen auf elf** (Solution-Design 8.1). Die Testdatei war
  Anforderung für Anforderung gewachsen, weil ein E2E-Test bequem alles zugleich beweist. Zehn
  Fälle prüften in Wahrheit ein Einzelkriterium und sind auf die tiefere Ebene gezogen: FA-51,
  FA-64 AK-7, FA-73, FA-76, FA-78/79, FA-80, FA-81, FA-82/83, FA-88 und FA-93.

  Bei vier davon ging das nur, weil **zuerst die Entscheidung umgezogen ist** – sie steckte in
  einer Komponente und war damit nur über den Browser erreichbar (NFA-06): die
  Überschneidungsprüfung bei der Projektzuordnung (`zuordnungBrauchtBestaetigung`), die Prüfung
  auf doppelt vergebene GitHub-Kennungen (`kennungDoppelt`), das Lesen der
  GitHub-Auswertungsdatei (neues Modul `domain/repoauswertung.ts`) und die Regel, was vom
  Sichtzustand dauerhaft gemerkt wird (`dauerhafterTeil`, neues Modul `ui/uizustand.ts` ohne
  React). Die Tests dazu prüfen jetzt Fälle, die im Browser kaum herzustellen waren: eine
  abgeschnittene Auswertungsdatei, eine aus einer älteren Fassung des Skripts, ein Browser ohne
  IndexedDB.

  **Was dabei verloren geht, steht in Solution-Design 8.1 und als OP-F37 in den Anforderungen:**
  Fünf Aussagen über die Verdrahtung – ob ein Umschalter umschaltet, ob ein gesperrtes Feld
  gesperrt ist, ob ein Absatz dasteht – prüft maschinell niemand mehr. Sie fallen beim Bedienen
  sofort auf; ein falsch gelesener Zahlenwert nicht. Ein Komponententest-Aufbau (jsdom) würde
  sie zurückholen und ist bewusst nicht eingerichtet.

- **Platzverteilung auf den Stammdatenblättern.** Die Blätter „Projekte" und „Tests" gaben der
  Liste – vier schmale Spalten – die ganze Breite und quetschten die Felder des gewählten
  Objekts in 320 px; jetzt ist es umgekehrt. Die Feldraster (`.feldgitter`) und die
  Schülerzuordnung (`.schuelerliste`) hatten bis dahin **gar keine Gestaltung** und liefen als
  eine Spalte hinunter: Eine Klasse mit dreißig Namen war drei Bildschirme hoch. „Klassen" und
  „Stichtage" sind kurze Listen und bekommen keine 1180 px mehr, sondern 860

- **Die Dokumentenprüfung prüft die fachliche Kette in beide Richtungen** (W3, W4): Jede
  Anforderung nennt eine fachliche Grundlage, jede fachliche Aussage ihre Wirkung aufs Produkt.
  Beides warnt zunächst nur – am 14.09.2026 nannten 29 von 109 Anforderungen eine Grundlage,
  und alle übrigen auf einmal nachzuziehen wäre ein Tag Buchführung ohne Fortschritt. Neue und
  geänderte Anforderungen bekommen sie sofort. Das Skript prüft, dass ein Verweis **da** ist,
  nicht dass er stimmt

- **Die drei `docs/entwurf-*.md` sind stillgelegt** und tragen oben einen Zeiger auf das
  Dokument, in dem ihr Ergebnis jetzt steht. Ein Entwurf, der neben dem gültigen Dokument
  weiterlebt, ist die zweite Wahrheit, gegen die dieses Repository gebaut ist

- **Das ERD im Solution-Design war seit Schemastand 3 falsch** – es zeigte noch
  `KLASSE ||--o{ SPRINT` und `TEAM ||--o{ PERSON`. Kapitel 5 ist neu und trennt jetzt das
  technische Modell vom fachlichen, mit einer Zuordnungstabelle dazwischen

- **Auswertungen landen in `scripts/Review-Auswertungen/JJJJ-MM/`** statt im aktuellen
  Verzeichnis – ein Ordner je Monat, über alle Teams hinweg, damit sie sich vergleichen
  lassen. Der Monat kommt vom **Ende** des Zeitraums: Ein Sprint über den Monatswechsel gehört
  in den Monat, in dem er abgeschlossen wurde (dieselbe Regel wie FA-48 AK-6). Die Dateinamen
  tragen den Repository-Namen. `--aus` schreibt weiterhin genau dorthin, wo es sagt.
  **Der Ordner ist von Git ausgenommen:** Die Berichte enthalten GitHub-Kennungen und damit
  personenbezogene Daten; sie gehören in den schulischen Speicher (DS-06) und nicht in ein
  Repository auf GitHub. Versioniert ist nur die Erklärung darin

### Behoben

- **`--repo` nimmt jetzt auch eine URL.** `https://github.com/htl/projekt`, die SSH-Form und
  sogar die Adresse eines Pull Requests werden auf `eigentuemer/name` zurückgeführt. Vorher
  wurde der Wert unverändert in den API-Pfad gesetzt, und `gh` meldete „unsupported protocol
  scheme" – eine Meldung über die Adresse statt über den Aufruf, die an der falschen Stelle
  suchen lässt. Was weiterhin nicht passt, wird mit den erlaubten Formen erklärt

- **Hinweis bei einem Zeitraum in der Zukunft.** Ein künftiger Beginn ist fast immer ein
  Vertipper; ohne Hinweis sieht das leere Ergebnis wie ein Team ohne Beiträge aus

- **Zwei literale NUL-Bytes in `github-auswertung.mjs`** durch die Escape-Schreibweise ersetzt.
  Sie machten die Datei für `grep`, `diff` und manche Editoren zu einer Binärdatei

### Hinzugefügt

- **`scripts/hilfen.mjs`**: die drei Skripte teilen sich Aufrufparameter, Abbruch,
  Anonymisierung, Repo-Umsetzung und Zeitraumprüfung, statt sie zu kopieren – „Gibt es das
  schon?" gilt auch für die eigenen Werkzeuge

- **`npm run pullrequests`** (`scripts/pull-requests-auswerten.mjs`): wertet die Pull Requests
  eines Zeitraums **im Nachhinein** aus, in zwei getrennten Teilen. Erst die **zählbaren**
  Größen ohne KI – gab es ein Review einer anderen Person, wie lange lag zwischen dem letzten
  Commit *vor* der Genehmigung und der Genehmigung, wie groß war der Pull Request, wurde
  danach noch nachgeschoben, wer hat wen begutachtet –, dann die vier Fragen je Pull Request
  mit KI. Die Trennung ist der Zweck: Der erste Teil ist reproduzierbar und im Widerspruchsfall
  zeigbar, der zweite nicht. Holt alles über `gh`, **ohne Klon**; Personen erscheinen als
  Pseudonyme, die Zuordnung steht nur im Bericht. Ohne `--werkzeug` entstehen nur die
  Kennzahlen und kein Diff verlässt den Rechner

- **`npm run reviewzettel`** (`scripts/review-vorbereitung.mjs`): erzeugt aus dem Git-Diff eines
  Teamrepositorys einen Zettel für das Sprintreview – was sich fachlich geändert hat, welche
  Akzeptanzkriterien ohne Test geblieben sind, wo verdoppelt statt wiederverwendet wurde, und
  **drei Fragen mit Datei und Zeile**. Läuft lokal mit **einer** Lizenz für alle Teamrepos,
  braucht im Schülerrepo keine Einrichtung und funktioniert mit `--nur-prompt` auch ganz ohne
  Zugang. In den Prompt geht der Diff **ohne Commit-Autoren und ohne Adressen**; mit
  `--mit-verlauf` erscheinen Beitragende als Pseudonyme, und die Zuordnung steht nur im Zettel.
  Der Zettel ist ein **Vorschlag** und enthält keine Bewertung (G9). Steht außerhalb der
  Anwendung, ADR-001 und NFA-03 bleiben unberührt

- **`scripts/repo-einrichten.ps1 -Schutz` setzt die fünf Schutzeinstellungen für `main`**:
  Pull Request Pflicht, Prüfungen müssen grün sein, Zweig muss aktuell sein, Genehmigungen
  verfallen bei neuen Commits, kein Force-Push und kein Löschen. Bisher stand das nur als
  Handanweisung in `CONTRIBUTING.md` – und was von Hand zu tun ist, wird pro Projekt
  vergessen. `-Genehmigungen 1 -AdminsEingeschlossen` für ein Schülerteam; die Vorgabe 0
  passt zum Einpersonenprojekt, weil man den eigenen Pull Request nicht genehmigen kann.
  Scheitert der Aufruf am Tarif (geschützte Zweige gibt es in privaten Repositories nur mit
  Pro, Team oder Enterprise), sagt das Skript das im Klartext

### Geändert

- **Vorgaben für KI-Werkzeuge liegen jetzt in `AGENTS.md`.** Der Inhalt des bisherigen
  `CLAUDE.md` ist dorthin gewandert; `CLAUDE.md` und das neue
  `.github/copilot-instructions.md` sind **Zeiger** von drei Zeilen. Grund: Jedes Werkzeug
  sucht eine andere Datei – Claude Code `CLAUDE.md`, Copilot `.github/copilot-instructions.md`,
  Codex und Cursor `AGENTS.md`. Eine Quelle, mehrere Türen; auseinanderlaufende Vorgaben wären
  schlimmer als keine. Zeiger statt Symlinks wegen Windows. Einzelheiten und die Grenze der
  Wirkung in [Zusammenarbeit mit KI, Kap. 6.1](zusammenarbeit-mit-ki.md)

- **`p2` heißt „Standup“ statt „Daily Standup“** (OP-F30). Bei drei Wocheneinheiten als Block
  gibt es ein Treffen je Woche, kein tägliches. Das Kriterium ist damit eine **Gelegenheit,
  keine Pflicht**: Findet ein Standup statt, wird es bewertet; findet keines statt, bleibt es
  leer und fällt aus der Gewichtung (FA-21, ADR-004). Die Kriterien-ID bleibt `p2`, der
  Erfassungszeitpunkt bleibt `daily` (FA-75 AK-4) – erfasste Punkte behalten ihren Bezug.
  Betroffen sind beide Sprintvorlagen; bestehende Bestände bleiben unverändert, weil ihre
  Rubriken Kopien sind (FA-65)

### Hinzugefügt

- **Sprintwert je Team** (FA-82). Ein Wert je Sprint und Team, den die Lehrkraft **setzt** –
  mit Begründung, und er tritt neben die Rechnung statt sie zu ersetzen. Vorgeschlagen wird
  der Team-Anteil: Team-Ergebnis und Scrum-Prozess zusammen, auf 100 % umgerechnet; der
  individuelle Beitrag bleibt draußen, weil er Personen betrifft und in einem Dreierteam auf
  die Werte der übrigen zurückrechenbar wäre. Geht in **keine Note** ein und steht mit Datum
  in der Belegfassung

- **Rückmeldung an das Team für den Teams-Kanal** (FA-83). Ein Textvorschlag aus dem, was
  erfasst ist – Ziel und Zeitraum, Sprintwert, was gelungen ist, woran die Einzelnen
  gearbeitet haben (aus den Spuren), Maßnahmen für den nächsten Sprint. Jeder Baustein
  einzeln zuschaltbar, der Text vor dem Kopieren **frei änderbar**, dann in die Zwischenablage.
  Die Anwendung versendet nichts: Was in den Kanal gelangt, stellt die Lehrkraft dort selbst
  hinein und sieht es vorher (ADR-001, NFA-03). Namentliche Beiträge nennen **Tätigkeit ohne
  Bewertung** – keine Prozentwerte je Person, keine Stärken, keine Entwicklungsfelder. Für die
  Rückmeldung je Person gibt es denselben Weg als eigener Text fürs Einzelgespräch, aber
  **keinen Baustein**, der sie in den Teamtext einsetzt: Eine Leistungsbeurteilung gehört der
  Person und den Erziehungsberechtigten, nicht den Mitschülern (OP-F29, zur Klärung mit der
  Schulleitung)

- **Die Spur je Person** (FA-78). Je Person und Sprint eine Stelle, an der sie ihren Beitrag
  zeigt – ein Commit, ein Pull Request, im Vorbereitungssprint ein Dokument. Erfasst im
  Sprintreview neben dem Verstehensnachweis, weil dort darüber gesprochen wird. Erwartet, nicht
  erzwungen; **kein Punktewert** – eine einzige Stelle kann viel oder wenig Arbeit sein. Der
  Verweis wird gespeichert und angezeigt, **nie abgerufen**. Dazu ein neues Kriterium „Eigene
  Spur“ (6 Punkte) im individuellen Beitrag; „Code Reviews“ ist dafür aus „Beitrag zum Team“
  entfallen, damit ein gegebenes Review nicht zweimal zählt

- **Der Befund: agiert das Team als Team?** (FA-79). Im Sprintreview steht zuerst eine Aussage
  über das Team, darunter die Werte, die sie tragen. Drei Muster, die Verschiedenes bedeuten:
  zusammen; zusammen und schwach (ein fachliches Problem, kein Teamproblem); auseinander.
  Auffällig ist, wo zwei von drei Signalen in dieselbe Richtung zeigen – Abstand zum Median der
  Mitglieder, Peer-Wert gegenüber den übrigen, fehlende Spuren –, oder wo der Abstand allein
  mindestens das Doppelte der Schwelle beträgt. Die Abweichung zählt **in beide Richtungen**:
  Wer das Team trägt, ist derselbe Befund wie wer mitläuft. Rechnet nichts in die Note, nennt
  Tatsachen und kein Etikett, und funktioniert ab dem ersten Sprint. Schwelle einstellbar,
  Vorgabe 15 Prozentpunkte

- **Maßnahmen aus der Retrospektive** (FA-80). Zwei bis drei Sätze am Ende des Sprintreviews;
  im Folgesprint stehen sie mit Herkunft wieder da und werden abgehakt: umgesetzt, teilweise,
  nicht. Damit hat das Prozesskriterium „Retrospektive“ endlich etwas, worauf es sich bezieht –
  bisher bewertete es „im Folgesprint sichtbar umgesetzt“, ohne dass irgendwo stand, was
  vorgenommen war

- **Kennzahlen zur Zusammenarbeit im Repository** (FA-81). `npm run github -- --repo … --von …
  --bis …` fragt über die GitHub-CLI ab und schreibt eine Datei; die Anwendung **liest sie ein
  und ruft selbst nichts ab** – ADR-001, NFA-03 und DS-02 bleiben unverändert gültig, und es
  liegt kein Zugriffstoken im Browser. Vier Größen, alle als Verteilung auf Teamebene: Anteile
  der Mitglieder, wer wessen Pull Requests begutachtet, Anteil über Pull Requests gegenüber
  direkten Pushes, zeitliche Verteilung. Daraus ein **Vorschlag** für „Versionsverwaltung“, der
  nur den mechanischen Teil deckt und nichts überschreibt; für jedes andere Kriterium gibt es
  keinen. Repopfad und GitHub-Kennungen liegen am Team, eine Person darf mehrere Kennungen
  haben

- **Vorschlag, fixiert, abgeschlossen** (FA-77). Der Abschluss steht **innerhalb** des Schreibschutzes (AK-5a): Nach dem Enddatum braucht das Review eine ausdrückliche Freigabe – ein Klick mehr, dafür eine Sicht, die nicht halb erreichbar ist. Ein Team kann beliebig viele Sprints
  vorausplanen; bis zur Fixierung sind sie **Vorschläge** – vorausgeplant, aber nicht der
  geltende Sprint. **Fixiert** wird mit einer Handlung, und erst dann, wenn der vorige Sprint
  mit dem Sprintreview **abgeschlossen** ist; geht es nicht, steht der Grund da samt dem
  Sprint, der noch auf sein Review wartet. Abgeschlossen wird im Sprintreview, ebenfalls mit
  einer Handlung: Vorgeschlagen wird sie, sobald alles erfasst ist, aber ein bewusst leeres
  Feld hält die Kette nicht auf. Der Abschluss ist zurücknehmbar, ohne den Folgesprint zu
  entfixieren. Der Zustand sperrt nichts – erfassen lässt sich auch in einem Vorschlag
- **Die Sprints eines Teams überschneiden sich zeitlich nicht** (FA-66 AK-8). Überlappen zwei
  Zeiträume desselben Teams, steht das beim Planen da – mit den Namen der betroffenen Sprints.
  Endet einer am Tag, an dem der nächste beginnt, ist das keine Überschneidung, sondern der
  übliche Übergabetag. Ein Ende vor dem Beginn wird ebenso benannt. Gemeldet, nicht verhindert:
  Ein hartes Verbot verlangte, die Zeiträume in einer bestimmten Reihenfolge zu berichtigen

- **Schreibschutz für abgeschlossene Abschnitte** (FA-76). Geschrieben wird im **laufenden**
  Sprint eines Teams – dem, in dessen Zeitraum das heutige Datum liegt. Andere sind
  vollständig zu sehen, aber gesperrt, damit im Gespräch mit einem Team nichts im falschen
  Sprint landet. Mit einer
  ausdrücklichen Handlung lässt sich ein alter Sprint öffnen; die Freigabe gilt nur für diese
  Sitzung und nur für diesen Abschnitt. Schutz gegen Versehen, nicht gegen Absicht – ein harter
  Schreibschutz sperrte auch die Berichtigung aus, und Tippfehler fallen später auf als am
  selben Tag

- **Löschen sagt, was verlorengeht** (FA-36 AK-3). Vor dem Löschen eines Abschnitts stehen die
  Posten mit Anzahl da: Punktewerte, gesetzte Werte, Rückmeldungen, Verstehensnachweise,
  Reflexionen, Peer-Urteile, Notizen, Planungen. Ist nichts erfasst, wird auch das gesagt. Eine
  Frage „wirklich?“ schützt vor der verrutschten Maus, nicht vor der falschen Entscheidung
- **Ein Sprint lässt sich für ein einzelnes Team entfernen** (FA-70 AK-8) – dort, wo er
  entstanden ist. Andere Teams behalten ihn; bleibt kein Team übrig, verschwindet der Abschnitt
  ganz. Ein Teamwechsel setzt die Sprintwahl auf den letzten Sprint dieses Teams zurück

### Geändert

- **Der laufende Sprint wird am Datum erkannt** (FA-76 AK-1, neu gefasst). Bisher galt der
  letzte in der Reihe. Das war falsch, sobald künftige Sprints geplant sind: Ein Sprint, der im
  Februar beginnt, wäre im Oktober der beschreibbare gewesen. Liegt heute in keinem Zeitraum –
  Ende vorbei, Review offen, oder Ferien –, ist nichts ohne Weiteres beschreibbar; es steht
  dann da, welcher Sprint zuletzt lief. Gesperrt ist dabei die **Bewertung**: Die Planung eines
  Sprints, der noch nicht begonnen hat, bleibt änderbar, sonst wäre kein Vorschlag anlegbar

- **Der Sprint gehört dem Team** (FA-70 AK-6, OP-F17). Die Sprintleiste zeigt nur, wofür das
  gewählte Team eine Planung hat, und das Team steht in der Bedienung vor dem Sprint. Ein neu
  angelegter Sprint wird sofort für dieses Team geplant. Ein Abschnitt, den kein Team geplant
  hat, gilt weiterhin für die ganze Klasse – sonst wäre ein älterer Bestand unlesbar
- **Der Zeitfaktor bezieht sich auf die eigenen Abschnitte der Person** (FA-54 AK-7). Das ist
  die einzige Änderung dieses Schritts, die Noten verschiebt, und sie berichtigt einen stillen
  Fehler: Lagen alle Sprints eines Teams in derselben Hälfte der Klassenliste, trugen sie alle
  denselben Faktor – und ein gemeinsamer Faktor kürzt sich aus dem gewichteten Mittel heraus.
  Der Zeitfaktor fiel damit **ganz aus**. Ein Team, das sich von 55 auf 95 steigerte, stand auf
  demselben Wert wie eines, das von 95 auf 55 abfiel: 75,0 %, beide Note 3. Richtig gerechnet
  sind es 80,0 % (Note 2) und 70,0 % (Note 3). Als TF-N und TF-O in den Testfällen hinterlegt
  und als Regressionstest gebaut
- **Das Kürzel zählt je Team** (FA-04 AK-5): Keplers dritter Sprint heißt S3, auch wenn Doppler
  schon bei fünf ist. Wo für die ganze Klasse beschriftet wird – in der Auswertung –, zählt
  weiterhin die Klasse

- **Acht Bereiche statt vier (FA-34).** Die Oberfläche folgt jetzt dem Unterricht:
  Klassen & Teams · Sprintplanning · Daily · Sprintreview · Diplomarbeitsvorbereitung ·
  Tests · Auswertung · Rubrik & Notenschlüssel. „Bewerten“ entfällt als Bereich; seine
  Inhalte liegen in den fünf neuen. Grundlage ist die Festlegung des Auftraggebers vom
  12.09.2026: Planning, Daily und Review finden zu verschiedenen Zeiten statt und gehören
  deshalb nicht in ein Formular – „diese bauen aufeinander auf“
- **FA-70 Sprintplanning.** Ein Sprint **entsteht hier**, nicht mehr vorab unter
  „Klassen & Teams“ – die Reihenfolge in der Anwendung entspricht damit der im Unterricht.
  Ziel, Zeitraum und Kriterienauswahl je Team stehen hier, ebenso das Kriterienblatt für die
  Klasse: Es gehört an den Anfang eines Sprints, nicht an sein Ende
- **FA-71 Daily.** Was während des Sprints auffällt, samt den Notizen je Team und je Person.
  Nicht abschaltbar, aber ein leeres Feld bleibt „nicht bewertet“ – das Daily wird oft nicht
  beurteilt, und das ist kein Mangel
- **FA-72 Sprintreview.** Der Abschluss: Punkte, Peer-Werte, Verstehensnachweis, Reflexion,
  Rückmeldung und die Nachfrage zur Peer-Bewertung. Was in Planning oder Daily erfasst wurde,
  steht hier unter „Früher erfasst“ **nur zur Ansicht** – zwei Eingabestellen für denselben
  Wert sind eine Fehlerquelle, keine Bequemlichkeit
- **FA-73 Diplomarbeitsvorbereitung.** Eigene Sicht, ganzjährig neben den Sprints statt als
  Glied ihrer Reihe. Der Auftraggeber hat am selben Tag berichtigt, dass sie wegen der
  Themensuche das ganze Jahr läuft; erst ihre Aufbereitung erfolgt nach dem Projekt. Ihr
  „Ziel“ ist das gesuchte Thema
- **FA-74 Tests.** Eigene Sicht; sie stehen nicht mehr in derselben Leiste wie die Sprints.
  Inhaltlich unverändert
- **FA-75 Erfassungszeitpunkt je Kriterium.** Ein Kriterium trägt, wann es beobachtet wird:
  Planning, Daily oder Review; ohne Angabe Review. Das bestimmt **nur den Ort der Erfassung**,
  nie die Rechnung. Ohne dieses Feld müssten die Sichten die Kennungen `p1` und `p2` fest
  verdrahten – und das bräche, sobald ein Team andere Kriterien führt, was seit FA-67 der
  Normalfall ist. Das Feld ist innerhalb von Schemastand 3 additiv: Ein Bestand ohne es wird
  nicht verändert

- **Schemastand 3: Der Sprint gehört dem Team.** Bisher war ein Abschnitt ein gemeinsames
  Zeitfenster der Klasse. Der Auftraggeber hat am 12.09.2026 festgehalten, dass Dauer und Ziel
  eines Sprints je Team beim Planning entstehen – damit fällt diese Annahme. Der Abschnitt
  behält Nummer, Reihenfolge, Art, Strang und Faktor; alles Zeitliche und Inhaltliche liegt
  beim Team (FA-66 bis FA-69)
- **FA-66 Sprintplanung je Team.** Ziel, Beginn und Ende je Abschnitt und Team, anlegbar
  **bevor** ein einziger Punkt erfasst ist. Der Zeitraum am Abschnitt ist nur noch ein Rahmen
  (FA-04 AK-2); ohne Planung gilt er weiter, damit ein ungeplanter Sprint nicht aus jeder
  Stichtagsauswertung fällt. Das Ziel erscheint in Belegfassung und Rückmeldung: Es ist keine
  Bewertung, sondern ihr Gegenstand – ohne es steht in der Aufzeichnung ein Prozentwert ohne
  Bezug. Ein Test wird nicht geplant; dort gilt der Zeitpunkt für alle
- **Die Stichtagszuordnung entscheidet sich am Teamende** (FA-48 AK-6a). Endet Sprint 3 bei
  einem Team am 28.01. und beim anderen am 03.02., zählt er für das eine ins Semesterzeugnis
  und für das andere nicht. Das ist die Folge unterschiedlicher Enddaten und keine
  Ungenauigkeit – die Auswertung macht es erkennbar, weil danach gefragt werden wird
- **FA-67 Kriterien je Team.** Beim Planen stehen **alle** Kriterien da, und angehakt wird,
  was in diesem Abschnitt gilt. Im Vorrat liegen: die zugeordnete Rubrik, alles, was dieses
  Team in einem früheren Abschnitt derselben Art verwendet hat, bei einem Sprint zusätzlich
  die Vorlage „Vorbereitungssprint“, und was hier neu angelegt wird. Ein abgewähltes Kriterium
  ist nicht dasselbe wie ein unbewertetes: Es zählt in seiner Kategorie gar nicht mit, während
  ein unbewertetes aus der Gewichtung fällt und als offen gemeldet wird. Nach dem ersten Punkt
  stehen die Kriterien fest
- **Fortgeschrieben wird der Satz des vorigen Sprints**, nicht die Rubrik (AK-7). Damit ist
  eine Rubrik nur noch **Saatgut**: Sie belegt die erste Planung vor, danach trägt die Kette.
  Die Rubrikansicht ist damit nicht mehr der Ort, an dem die geltenden Kriterien stehen –
  sie sagt das jetzt auch (FA-55 AK-7)
- **Die Kette läuft nur von Sprint zu Sprint** (AK-10). Ein Test und die
  Diplomarbeitsvorbereitung entstehen aus keinem Sprint und geben an keinen weiter: Ihre
  Auswahl beginnt bei der zugeordneten Rubrik. Die erste Umsetzung hatte die
  Diplomarbeitsvorbereitung in die Kette gestellt – vom Auftraggeber am selben Tag berichtigt
- Ebenfalls nach Durchsicht berichtigt: Statt einzelne Kriterien zu streichen und zu ergänzen,
  wird aus dem vollständigen Vorrat **ausgewählt**. Ein eigener Weg „aus einer Vorlage neu
  beginnen“ entfällt damit ersatzlos – wenn alles sichtbar ist, ist ein Satzwechsel eine Frage
  von Häkchen
- **Wo Teams verglichen werden, wird die Abweichung ausgewiesen** (AK-6): Auswertung,
  Notenverteilung und CSV-Export nennen die Abschnitte, in denen nach verschiedenen Kriterien
  beurteilt wurde. Verglichen wird dabei der rechnende Teil – eine andere Beschreibung
  desselben Kriteriums ändert keinen Prozentwert und ist keine Abweichung
- **FA-65 Einfrieren wandert** vom Abschnitt auf das Team und vom ersten Punkteintrag auf das
  Festhalten der Planung. Das ist zugleich die pädagogisch richtige Reihenfolge: Die Kriterien
  stehen fest, bevor gearbeitet wird, und nicht erst, wenn beurteilt wird. Für einen Test
  bleibt die Kopie am Abschnitt – dort gibt es kein Team
- **FA-47 Angleichen wirkt je Team** und rührt nur an, was aus der Rubrik stammt. Ein
  fortgeschriebener oder geänderter Satz ist eine Entscheidung des Teams und wird nicht
  eingeebnet. Die Anforderung verliert damit an Bedeutung: Der übliche Weg einer
  Kriterienänderung ist ab jetzt der nächste Sprint, nicht das Korrigieren des vorigen
- **FA-69 Vorlage „Vorbereitungssprint“.** Sechs Ergebnisse mit zusammen 50 Punkten –
  Fachliches Konzept, Anforderungsspezifikation, Solution-Design, CI/CD, Stakeholderanalyse,
  Versionsverwaltung –, vom Auftraggeber am 12.09.2026 festgelegt. Prozess, individueller
  Beitrag und Peer sind **wörtlich** die der Sprint-Rubrik: Sie werden in den zweiten Sprint
  mitgenommen, und eine abweichende Benennung machte den Verlauf über das Jahr unlesbar.
  Gewichtung 50/15/35, weil der Prozess im ersten Sprint erst entsteht

### Hinzugefügt

- **FA-68 Migration auf Schemastand 3.** Aus jeder Paarung von Abschnitt und Team mit
  Bewertung oder Zugehörigkeit entsteht eine Planung mit dem Zeitraum des Abschnitts und
  leerem Ziel; eine eingefrorene Rubrik wird samt Zeitpunkt an jedes Team übernommen. Der
  bisherige Stand wird vorher gesichert. **Ein migrierter Bestand ergibt dieselben
  Prozentwerte, Notenvorschläge und Sperren wie vorher** – das ist nicht Nebeneffekt, sondern
  Bedingung: Eine Umstellung, die Noten verschiebt, wäre eine stille Neubewertung. Geprüft am
  Probebestand aus dem Testlauf, zwölf Personen über acht Abschnitte, alle Werte gleich

### Behoben

- **`npm run e2e` prüfte einen veralteten Build.** Das Skript rief nur
  `playwright test` auf; der Vorschauserver liefert aus, was in `dist` liegt, und sagt nicht
  dazu, wie alt das ist. Gebaut hat bisher nur `npm run pruefen` – solange man beides
  hintereinander laufen ließ, fiel es nicht auf. Einmal nur `npm run e2e` genügte, um eine
  bereits behobene Ursache zweimal als offen erscheinen zu lassen. Das Skript baut jetzt selbst

- **Die Diplomarbeitsvorbereitung bekam die Sprint-Rubrik** statt ihrer eigenen (FA-56 AK-3,
  FA-73 AK-2). Beim Anlegen eines Abschnitts galt die Vorgaberubrik für alles außer einem
  Test; die mitgelieferte Rubrik „Diplomarbeitsvorbereitung“ wurde damit nie zugeordnet. Der
  Fehler ist älter als Release 0.5.0 und fiel erst auf, als die Vorbereitung eine eigene Sicht
  bekam und ein Durchstich nach „Themenqualität“ suchte. Die Art schlägt jetzt ihre Rubrik
  vor; fehlt sie im Bestand, gilt weiterhin die Vorgabe

- **Der Deploy-Workflow schob auch für einen Tag nach GitHub Pages** und scheiterte dort an der
  Schutzregel der Umgebung `github-pages`, die nur `main` zulässt. Weil das Release am
  Veröffentlichen hing, entstand dadurch kein GitHub-Release. Seite und Release sind jetzt
  getrennt: `main` veröffentlicht die Seite, der Tag legt das Release an, und beide hängen nur
  am gemeinsamen Bauen. Die Schutzregel bleibt, wie sie ist – sie hatte recht

## [0.3.0] – 2026-09-11 · „Beurteilen“

Aus den erfassten Punkten wird ein begründbarer Stand: Zeitfaktor nach § 20 Abs. 1 LBVO,
Peer-Werte als gedeckelte Korrektur, Sperre bei negativem Strang nach § 14 LBVO, Stichtage,
gesetzte Werte auf jeder Ebene ohne Überschreiben, Notenstand, Belegfassung und Rückmeldung.
Umgesetzt: FA-32, FA-40 bis FA-42, FA-45, FA-47 bis FA-51, FA-54 und FA-61.

### Geändert

- **FA-47 Eingefrorene Rubrik angleichen.** Eine Rubrikänderung lässt sich ausdrücklich auf
  bereits bewertete Abschnitte übertragen – als eigene Handlung, nie als Nebenwirkung (AK-1).
  Davor steht eine Vorschau: welche Abschnitte betroffen sind und wie sich der Prozentwert
  **je Person** ändert (AK-2). Ändern sich Werte, ist zusätzlich zu bestätigen, dass die
  Vorschau durchgesehen wurde – ein zweiter Klick allein erzwänge das nicht; ändern sich nur
  Bezeichnungen und Beschreibungen, genügt die einfache Bestätigung (AK-3)
- Ob sich Werte ändern können, wird am **rechnenden Teil** der Rubrik entschieden – Kennungen,
  Maximalpunkte, Gewichte, `selbstZaehlt`. Ist der gleich, kann kein Prozentwert wandern
- Das Angleichen wird mit Zeitpunkt am Abschnitt festgehalten und erscheint in der Belegfassung
  (AK-4): Wer nachvollziehen soll, wie ein Stand zustande kam, muss wissen, dass die Kriterien
  nachträglich berichtigt wurden
- **FA-40 Verstehensnachweis** und **FA-41 Reflexionsnotiz** je Person und Abschnitt. Der
  Nachweis wird in vier Stufen erfasst – sicher, überwiegend, teilweise, nicht (100/67/33/0 %) –
  und geht mit **30 % in den individuellen Beitrag** ein; die Kriterien tragen die übrigen 70 %.
  Beides entschieden am 11.09.2026 und als AK-1 bis AK-4 nachgetragen, weil die Anforderung nur
  „ein eigener Anteil“ sagte. Der Anteil ist einstellbar; 0 nimmt den Nachweis aus der Rechnung,
  ohne ihn aus den Aufzeichnungen zu entfernen
- **Ein fehlender Nachweis ist kein misslungener:** Ohne Einstufung zählt der individuelle
  Beitrag unverändert aus seinen Kriterien (dieselbe Regel wie ADR-004). Liegt umgekehrt nur der
  Nachweis vor, trägt er die Kategorie allein – auch er ist eine erhobene Leistung
- Das Erfassen einer Einstufung friert die Rubrik ein (FA-65), weil sie in die Rechnung eingeht;
  eine Reflexionsnotiz tut das nicht – sie ist keine Bewertung
- Beide erscheinen in der **Belegfassung** (FA-32) und ausdrücklich **nicht** in der Rückmeldung
  an die Person (FA-42); Tests prüfen beides
- **FA-51 Zurückhaltende Darstellung.** Die Auswertung zeigt standardmäßig Stand, **Tendenz**
  und offene Kategorien; die Punkte je Abschnitt sind die Herleitung und kommen mit einem
  Klick auf „Herleitung zeigen“. Der Schalter liegt im Oberflächenzustand, nicht im
  Datenbestand – er kann damit gar nicht in einer Sicherung landen (AK-3)
- **Die Tendenz vergleicht die Mediane der beiden Verlaufshälften**, geteilt wie beim
  Zeitfaktor. Der erste Ansatz – letzter Wert gegen das Mittel der früheren – lag bei drei der
  neun Testverläufe falsch: Ein einzelner Ausfall ließ einen unveränderten Verlauf als Anstieg
  (TF-F) oder als Absturz (TF-G) erscheinen. Alle neun Verläufe sind als Test hinterlegt
- **FA-32 Belegfassung je Person** und **FA-42 Rückmeldung je Person** – zwei Ausgaben, die
  sich ausdrücklich ausschließen. Die Belegfassung zeigt alles: je Abschnitt Rubrik, Team,
  Kategorien mit Kriterien und Punkten, gesetzte Werte samt gerechnetem Vergleichswert und
  Begründung, Peer-Korrektur, am Ende Notenvorschlag samt Sperrgrund und eingetragenen
  Notenstand. Leere Kategorien stehen als „nicht bewertet“, nie als 0, und interne Bezeichner
  kommen nicht vor – Punkte werden über Kriteriennamen aufgelöst. Sie geht nicht ohne Anlass
  hinaus
- Die **Rückmeldung** beantwortet drei Fragen – wo stehe ich, was ist gelungen, woran arbeite
  ich – und enthält **keine** Punktetabelle, keine Herleitung, keine Note und keinen
  Notenvorschlag (G10). Der Stand erscheint nur als grobe Prozentangabe. Tests prüfen
  ausdrücklich das Fehlen dieser Teile
- **Eine Datei je Person**, nicht eine je Team oder Klasse: So enthält jedes Blatt nur die
  Daten einer Person und kann ohne weitere Prüfung weitergegeben werden
- `Einzelbewertung` trägt neben der internen Notiz (FA-17) jetzt die `rueckmeldung` – beide
  bewusst getrennt, weil das eine bleibt und das andere hinausgeht. Sind beide Felder der
  Rückmeldung leer, gilt sie als nicht erteilt und steht weiter auf der Liste der offenen
  (FA-42 AK-4); die Bewerten-Ansicht nennt sie namentlich
- **FA-50 Werte auf jeder Ebene setzen** und **FA-49 Notenstand eintragen**. Setzbar sind
  Kategorieergebnis, Abschnittsergebnis je Person und Gesamtstand je Stichtag – jeweils mit
  freiwilliger Begründung und Zeitstempel. Ein gesetzter Wert **ersetzt den berechneten nicht**:
  Der berechnete ist eine Funktion des Bestands, keine Spalte darin, also stehen beide
  nebeneinander (AK-2, G9). Jedes Ergebnis führt seither `prozent` (geltend) und
  `prozentBerechnet` (gerechnet) getrennt; ändert sich die Ebene darunter, bleibt der gesetzte
  Wert stehen und die Abweichung wird sichtbar (AK-4)
- Der **Notenstand** ist die einzige personenbezogene Ziffer im Bestand (FA-49 AK-1, G8) und
  lässt sich ohne jeden Prozentwert eintragen (AK-2). Weicht er vom Vorschlag ab, bleiben beide
  erhalten und die Abweichung ist in der Auswertung erkennbar (AK-3). Der CSV-Export trägt ihn
  in einer eigenen Spalte
- **Behoben:** Der CSV-Export rechnete ohne den gewählten Stichtag – FA-48 AK-1 verlangt ihn
  auch dort. Der Fehler stammte aus dem vorigen Schritt und ist jetzt durch einen Test gedeckt
- **Berichtigt:** Das Rechenbeispiel im Solution-Design (Kap. 6.8) nannte für die Variante mit
  gesetzter Kategorie 79,0 % statt 79,25 % und damit 82,1 % statt 82,4 %. Der Fehler fiel auf,
  als der Fall zum Test wurde – genau dafür stehen die Zahlen dort
- Das Datenmodell in Kap. 5.1 hieß `sprintergebnis`; umgesetzt ist `abschnittsergebnis`
  (Schemastand 2). Ohne gewählten Stichtag greift der feste Schlüssel `gesamter-durchgang`
- **FA-48 Auswertung zu einem Stichtag.** Drei Zeitpunkte – Semesterzeugnis, Frühwarnung,
  Jahreszeugnis – schränken Einzelergebnisse, Teamvergleich, Notenverteilung und Export auf
  den jeweiligen Zeitraum ein; spätere Abschnitte bleiben erhalten und erscheinen nur nicht.
  Der Zeitraum eines Zeugnis-Stichtags beginnt nach dem vorherigen **Zeugnis**-Stichtag; die
  Frühwarnung Ende April erzeugt keinen eigenen Zeitraum, sondern wertet den laufenden aus
  (AK-5, § 19 Abs. 3a SchUG). Der Zeitfaktor wird innerhalb des Zeitraums neu bestimmt – ein
  Semester ist eine eigene Zeitreihe (neue AK-7)
- Zugeordnet wird nach dem **Enddatum** eines Abschnitts. Ein Abschnitt ohne Enddatum bleibt in
  der Stichtagsauswertung außen vor **und wird dabei genannt** (neue AK-6): stilles Weglassen
  ergäbe einen falschen Stand, stilles Mitzählen einen falschen Zeitraum
- Der Dateiname des CSV-Exports trägt den Stichtag – sonst hießen Semester- und Jahresexport
  desselben Tages gleich und überschrieben einander
- **FA-61 Sperre bei negativem Strang** (§ 14 LBVO). Liegt ein Strangstand unter der
  Genügend-Grenze, lautet der Notenvorschlag „Nicht genügend“ – unabhängig vom Gesamtstand.
  Die Sperre ist ein **Prädikat über den Strangständen**, keine Rechenoperation: Sie verändert
  keinen gespeicherten Wert (AK-3). Ein Strang **ohne** Ergebnis löst sie nicht aus; sonst
  zeigte die Anwendung im Oktober, wenn noch kein Test geschrieben wurde, jedem ein Nicht
  genügend (Testfall TF-L). `notenvorschlag()` gibt Note, auslösenden Strang und die Note ohne
  Sperre zurück; die Ansichten stellen dar und entscheiden nichts
- Ein Strang unter der Grenze wird in der Auswertung hervorgehoben, bevor der
  Beurteilungszeitraum endet (Frühwarnung, AK-5). Die Notenverteilung und der CSV-Export
  zählen den Vorschlag **mit** Sperre, sonst widersprächen sie der Tabelle darüber; der Export
  hat dafür die neue Spalte „Sperre“
- Die Sperre ist abschaltbar (AK-6, `sperreAktiv`, Vorgabe eingeschaltet)
- TF-J bis TF-M aus `docs/testfaelle-notenfindung.md` sind Regressionstests, einschließlich
  beider Seiten der Schwelle und des Nachweises, dass die Sperre nichts verändert
- **FA-54 Zeitfaktor: der zuletzt erreichte Leistungsstand wiegt schwerer** (§ 20 Abs. 1 LBVO).
  Die zweite Hälfte der Abschnitte eines Strangs trägt den Faktor 2, die erste 1; bei
  ungerader Zahl wird zugunsten der späteren aufgerundet. Das Gewicht eines Abschnitts ist
  das **Produkt** aus Abschnitts- und Zeitfaktor; beide werden getrennt gespeichert und in der
  Auswertung getrennt ausgewiesen (AK-4). Der Faktor ist einstellbar; der Wert 1 hebt die
  Gewichtung auf und wird als Abweichung von § 20 Abs. 1 LBVO benannt statt stillschweigend
  hingenommen (AK-6)
- Der Zeitfaktor wird **je Strang** bestimmt: Tests und Sprints liegen in verschiedenen
  Zeitreihen und dürfen sich ihre Hälften nicht gegenseitig verschieben (FA-59)
- Alle neun Verläufe aus `docs/testfaelle-notenfindung.md` (TF-A bis TF-I) sind jetzt
  Regressionstests – je einer mit und einer ohne Zeitfaktor, dazu die Kontrolltabelle der
  Aufrundung und der Beleg, dass die spiegelbildlichen Verläufe TF-B und TF-C 9,3
  Prozentpunkte auseinanderliegen
- **FA-45 Peer-Werte als gedeckelter Korrekturfaktor.** Der Peer-Anteil geht nicht mehr als
  gewichtete Kategorie ein, sondern verschiebt das Abschnittsergebnis um höchstens ±5
  Prozentpunkte; neutraler Punkt ist 50 %. `rubrik.gewichte.peer` wird dabei **ignoriert** –
  sonst zählte dieselbe Einschätzung zweimal; das Feld bleibt nur für ältere Bestände lesbar.
  Die Deckelung ist einstellbar (`peerDeckelung`, additiv in Schemastand 2) und steht in der
  Rubrikansicht anstelle des früheren Peer-Gewichts. Das Abschnittsergebnis führt jetzt auch
  den Wert vor der Korrektur mit, damit die Ansichten beides zeigen können, ohne zu rechnen
- Das dokumentierte Rechenbeispiel (Solution-Design 6.8) ergibt damit **77,1 %** statt 74,0 %.
  Der Test dazu trug bis jetzt den Platzhalter „als Korrekturfaktor kommt er erst mit FA-45“;
  die beiden im Dokument genannten Varianten sind nun ebenfalls als Test hinterlegt

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
