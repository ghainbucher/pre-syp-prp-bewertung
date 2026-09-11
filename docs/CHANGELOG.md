# Änderungsprotokoll

Alle nennenswerten Änderungen an der PRE/SYP-PRP-Bewertung. Format angelehnt an
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionierung nach
[SemVer](https://semver.org/lang/de/).

## [Unveröffentlicht]

### Behoben

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
