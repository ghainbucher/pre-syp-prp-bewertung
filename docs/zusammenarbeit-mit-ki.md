# Zusammenarbeit im Team, wenn jeder eine KI im Hintergrund hat

| | |
|---|---|
| **Gegenstand** | Softwareprojekt (eigener Projektgegenstand) |
| **Dokument** | Didaktische Grundlage: Teamarbeit, Anforderungen und Repository unter KI-Einsatz |
| **Version** | 0.9 |
| **Datum** | 2026-09-13 |
| **Autor** | Gerald Hainbucher |
| **Status** | Entwurf – in Diskussion, nicht freigegeben |
| **Gültig für Softwarestand** | 0.3.0 |
| **Zuletzt geprüft** | 2026-09-13 |
| **Nächste Prüfung** | Ende Sprint 1 |
| **Vorgelagert** | [Fachliches Konzept](fachkonzept-unterricht.md) |
| **Nachgelagert** | keines – dieses Dokument ändert den Unterricht, nicht die Software |

---

## 1 Änderungshistorie

| Version | Datum | Autor | Änderung | Status |
|---|---|---|---|---|
| 0.1 | 2026-09-13 | G. Hainbucher | Erstfassung: verschobene Begründung der Teamarbeit, der unklare Kunde, Ablauf im Repository mit mehreren KIs, empirische Fundstellen E7–E10, offene Fragen OP-K1 bis OP-K6 | Entwurf |
| 0.2 | 2026-09-13 | G. Hainbucher | Kapitel 11 ergänzt: Rahmenbedingungen beim Firmenauftrag, sechs Festlegungen des Auftraggebers und ihre Folgen. OP-K1 bis OP-K3 dadurch entschieden, OP-K7 bis OP-K9 neu. Verweis auf R-14 | Entwurf |
| 0.3 | 2026-09-13 | G. Hainbucher | Kapitel 11.6 ergänzt: versetzte Sprints je Team, Sprintlänge folgt der Teamzahl. OP-K7 entschieden, daraus FA-84 und OP-F30 | Entwurf |
| 0.4 | 2026-09-13 | G. Hainbucher | OP-F30 entschieden: Das Standup ist eine Gelegenheit, keine Pflicht. 11.6 nachgezogen | Entwurf |
| 0.5 | 2026-09-13 | G. Hainbucher | 6.1 berichtigt: Der Inhalt liegt zentral, die Einstiegspunkte sind werkzeugabhängig. Muster „eine Quelle, mehrere Türen“ mit `AGENTS.md`; Grenze der Wirkung benannt. Im eigenen Repository umgesetzt | Entwurf |
| 0.6 | 2026-09-13 | G. Hainbucher | 6.4 ausgebaut: Was der Pull Request absichert, in drei Schichten – Pipeline, Form, Mensch – samt den fünf Schutzeinstellungen und den Grenzen. Im eigenen Repository als Skriptaufruf umgesetzt | Entwurf |
| 0.7 | 2026-09-13 | G. Hainbucher | 6.5 neu: maschineller Nachprüfer im Pull Request – eine Lizenz am Repository statt einer je Schüler. Reihenfolgeregel, Differenz als Signal, vier Warnungen. Bisherige 6.5 bis 6.7 zu 6.6 bis 6.8. OP-K12 und OP-K13 neu | Entwurf |
| 0.8 | 2026-09-13 | G. Hainbucher | 6.5 um den lokalen Weg ergänzt: `npm run reviewzettel` erzeugt die Reviewvorbereitung je Teamrepository, mit einer Lizenz und ohne Einrichtung im Schülerrepo | Entwurf |
| 0.9 | 2026-09-13 | G. Hainbucher | 6.5 um die Auswertung **je Pull Request im Nachhinein** ergänzt (`npm run pullrequests`): Kennzahlen ohne KI getrennt vom KI-Teil, über `gh` ohne Klon | Entwurf |

---

## 2 Wozu dieses Dokument

Es ist **keine Nutzungsordnung für KI** und keine Anforderung an die Software. Es hält fest,
was sich im Unterricht verschiebt, wenn jeder Schüler eine KI zur Hand hat, und welche
Konsequenzen das für Teamarbeit, Anforderungsarbeit und den Ablauf im Repository hat.

Der Anlass: Die bisherigen Begründungen für Teamarbeit und für das Erlernen der Grundlagen
stimmen so nicht mehr. Sie sind nicht falsch geworden, aber ihre **Begründung** hat sich
verlagert. Wer mit der alten Begründung argumentiert, verliert die Auseinandersetzung mit
einem Siebzehnjährigen, der schon gemerkt hat, dass es anders geht.

Was hier steht, ist Grundlage für Gespräche im Review und für die Aufgabenstellung – nicht
für eine eigene Bewertungskategorie. Bewertet wird weiter nach der Rubrik.

Die **konkreten Rahmenbedingungen** des Regelfalls – eine Firma vergibt einen kleinen Auftrag
an drei bis vier Schüler – stehen in Kapitel 11. Die Kapitel 3 bis 7 gelten unabhängig davon.

---

## 3 Was sich verschoben hat

### 3.1 Die These und ihre Einschränkung

Die Ausgangsthese des Auftraggebers: *Jeder Programmierer ist in Zukunft ein Programmierer
mit KI im Hintergrund. Das Handwerkszeug der Programmierung sinkt. Die Denkleistung im Team
steigt – vor allem im Hinterfragen von Konzepten.*

Der erste und der dritte Satz tragen. Der zweite ist zu ergänzen: Es sinkt die
**Notwendigkeit, das Handwerk auszuführen**. Sein Gewicht sinkt nicht, es verlagert sich vom
Herstellen zum Beurteilen. Und Lesen ist schwerer als Schreiben: Ein Konzept, das man
technisch nicht versteht, kann man nicht hinterfragen. Wer nie selbst eine Transaktion
vergessen hat, sieht die fehlende nicht.

Was steigt, ist genauer gesagt das **Beurteilen von Plausiblem**. Der typische Fehler ist
nicht mehr der Syntaxfehler, der auffällt, sondern der Code, der überzeugend aussieht und
falsch ist.

### 3.2 Folge für den Unterricht

Die Grundlagen werden nicht überflüssig – sie werden **früher gebraucht und aus einem anderen
Grund**: nicht zum Produzieren, sondern zum Urteilen. Das ist didaktisch unangenehm, weil die
alte Motivation („ich brauche das, damit überhaupt etwas läuft") wegfällt und die neue erst
nach einer Enttäuschung einleuchtet.

Die Schüler werden den Satz in seiner bequemen Fassung hören: *„muss ich nicht lernen, macht
die KI."* Dagegen hilft kein Appell, sondern nur eine Situation, in der das Urteil sofort
gebraucht wird und sein Fehlen sofort sichtbar ist:

1. **„Erklär mir das" statt „du brauchst das später".** Im Sprintreview muss jede Person ihre
   Spur erklären (FA-78, Kriterium `i5`). Wer es nicht kann, merkt das vor dem Team – nicht
   durch die Beurteilung, sondern durch die eigene Stille. Beim ersten Mal ohne Notenfolge.
2. **Einmal den Boden wegziehen.** Eine Einheit mit KI-erzeugtem Code, der einen plausiblen
   Fehler enthält: eine fehlende Transaktion, ein Off-by-one an der Bereichsgrenze, eine
   Sortierung, die bei Gleichstand instabil ist. Der Code ist kommentiert, sieht gut aus und
   ist falsch. Diese Stunde überzeugt mehr als ein Semester Appelle, weil sie nichts behauptet,
   sondern erleben lässt.
3. **Den Integrationsschmerz nicht abfedern.** Vier Leute, vier KI-Antworten, die nicht
   zusammenpassen. Löst die Lehrkraft das auf, lernt niemand etwas; liegt es in der
   Retrospektive auf dem Tisch, formuliert das Team die Regel selbst – und eine selbst
   beschlossene Maßnahme (FA-80) trägt, eine verordnete nicht.
4. **Lesen zur Rolle machen.** Pro Sprint ist eine Person dafür zuständig, den Code der
   anderen zu lesen, rotierend. Wer den Fehler gefunden hat, hat Ansehen: Beurteilen wird
   sozial belohnt und nicht nur bepunktet.

**Was nicht getan wird:** KI als Schummeln rahmen. In der Sekunde, in der sie verboten ist,
verschwindet sie in den privaten Chat, und die Lehrkraft sieht gar nichts mehr. Erwartet,
nicht erzwungen – wie bei den Commits (NZ-2).

---

## 4 Warum Teamarbeit bleibt

### 4.1 Was schwächer geworden ist

Das Mengenargument. „Einer allein schafft das Pensum nicht" trägt weniger, wenn ein Schüler
mit KI Codemengen erzeugt, für die früher drei nötig waren. Arbeitsteilung als
Mengenbewältigung ist als Begründung verbraucht.

### 4.2 Was stärker geworden ist

Genau das, was KI nicht abnimmt: sich abstimmen, Arbeit schneiden, fremden Code lesen und
verantworten, ein Review halten, in dem man erklärt, was man nicht selbst getippt hat. Diese
Kompetenz ist im Einzelbetrieb nicht einmal **beobachtbar**. Dazu kommt das Formale: Die
Diplomarbeit ist Teamarbeit, das ist keine didaktische Wahl.

### 4.3 Bezug zum Prinzip des Auftraggebers

> „Zuerst muss man feststellen, ob das Team als Team agiert (also den Beitrag der Einzelnen
> feststellen), erst dann kann man ein Team entwickeln." (Fachkonzept 8.2a)

KI macht den Einzelbeitrag **schwerer** sichtbar, nicht leichter: Was jemand beigetragen hat,
ist am Ergebnis weniger ablesbar als früher. Damit gewinnt das Feststellen an Bedeutung, und
die Instrumente dafür – Spur (FA-78), Befund (FA-79), Verstehensnachweis (FA-40) – tragen
mehr Gewicht als zum Zeitpunkt ihrer Festlegung angenommen.

---

## 5 Der Kunde

### 5.1 Team mit externem Kunden

Diese Teams haben den unklaren Kunden schon; er muss nicht gespielt werden, sondern
**sichtbar** gemacht:

- Vorzulegen sind die **Aussagen** des Kunden, nicht die Interpretation des Teams.
- Die Anforderung führt eine **datierte Änderungshistorie**. Damit wird „der Kunde hat es
  anders gemeint" von einer Ausrede zu einer nachvollziehbaren Tatsache – und im Review ist
  erkennbar, ob überhaupt jemand gefragt hat.

### 5.2 Team mit eigener Idee

Der schwierigere Fall, nicht der leichtere. Diese Teams sind ihr eigener Kunde, und dieser
Kunde stimmt immer zu. Es gibt keine Reibung, keinen Widerspruch, niemanden, der sagt „das
war nicht gefragt" – der Umfang wandert lautlos dorthin, wo das Bauen bequem ist. Das
Scheitern sieht dabei wie Erfolg aus: keine Konflikte, keine Änderungen, alles fertig, und ein
Produkt, das niemand gebraucht hätte.

Gegenmittel ist echte Reibung von außen, so billig wie möglich:

- **Eine** Person außerhalb des Teams als möglichen Nutzer befragen, und im Review berichten,
  **was dabei nicht der eigenen Annahme entsprach**. Ein Gespräch reicht, wenn das Ergebnis
  festgehalten werden muss.
- Ersatzweise übernimmt ein anderes Team die Kundenrolle. Schwächer, weil beide dieselbe
  Brille tragen.

### 5.3 Die Rolle, die es zu erklären gilt

Es gibt eine Rolle, deren Kompetenz darin besteht, Kundenanforderungen so abzuholen, dass
weder Fachlichkeit noch Technik untergeht – und die deshalb beide Tiefenbereiche an andere
abgibt. In einem Menschenleben geht es nicht anders. Im Weltbild der Schüler kommt diese Rolle
nicht vor: Es gibt „der programmiert richtig", und alles andere ist Reden.

Zu erklären ist sie über drei Punkte:

1. **Es ist derselbe Satz wie bei der KI:** Von beiden Seiten braucht es genug Tiefe, um zu
   **urteilen**, nicht um zu produzieren. Damit ist die Rolle keine Ausnahme, sondern das
   Zielbild dessen, was ohnehin verlangt wird. Und die Statusfrage ist beantwortet: Wer dem
   Kunden sagen kann „das widerspricht dem, was Sie Dienstag gesagt haben", und dem
   Entwickler „das war nicht gefragt", braucht mehr Wissen als beide, nicht weniger.
2. **Tiefe ist endlich, und das darf offen gesagt werden.** Niemand hat ein Leben für
   Fachlichkeit *und* Technologie *und* Menschen. Spezialisierung ist nicht das Eingeständnis
   eines Mangels, sondern die Voraussetzung dafür, dass irgendwo Tiefe entsteht. Der Furcht,
   „der zu sein, der nichts richtig kann", ist ausdrücklich zu widersprechen – sonst hören die
   Schüler sie in jedem Satz mit.
3. **Ein Artefakt zeigen.** `docs/anforderungen.md`: Satzschablone, Akzeptanzkriterien,
   Änderungshistorie, IDs, die nie wiederverwendet werden. Schüler glauben ein Artefakt eher
   als eine Erklärung, und sie sehen daran, dass das nicht „Reden" ist.

---

## 6 Ablauf im Repository, wenn mehrere KIs beteiligt sind

Die Konstellation: mehrere Personen, jede mit eigener KI, ein Repository, eine Umgebung, in der
der Kunde prüft und getestet wird. Der Engpass ist dann nicht mehr das Herstellen von Code,
sondern **die Einigkeit darüber, was gilt**. Danach richtet sich der Ablauf.

### 6.1 Der Vertrag liegt im Repository

Versioniert und für alle lesbar: die Anforderungen mit Akzeptanzkriterien, die Konventionen
(Architektur, Schichten, Benennung) und die Definition of Done. Das ist die tragfähige Fassung
von „eine KI pro Aufgabengebiet": **nicht ein Werkzeug pro Bereich, sondern ein geschriebener
Stand, den jedes Werkzeug liest.** Liegt die Vorgabe in der privaten Konfiguration jedes
Einzelnen, entstehen so viele Weltbilder wie Beteiligte, und sie treffen erst beim
Zusammenführen aufeinander.

Der Nebeneffekt ist der didaktisch wertvollste Teil dieses Dokuments: Fachlichkeit so
aufzuschreiben, dass eine KI damit richtig baut, ist **dieselbe Arbeit** wie sie so
aufzuschreiben, dass ein neues Teammitglied damit richtig baut. Damit wird die KI zum
Prüfstein für die Spezifikation: Baut sie das Falsche, war die Anforderung mehrdeutig – nicht
der Schüler hat schlecht gearbeitet. Anforderungsqualität wird damit sofort und sichtbar
prüfbar, und das ist eine Antwort auf das Motivationsproblem aus 3.2.

**Skills braucht es dafür selten.** Ein Dokument hält Tatsachen und Regeln fest, ein Skill eine
wiederholbare Vorgehensweise. Fachlichkeit ist fast immer das Erste. Ein Skill lohnt für etwas
wie „so fügt man in diesem Projekt eine neue Tarifregel hinzu".

#### Der Inhalt liegt zentral – die Einstiegspunkte nicht

Das ist die Einschränkung, die man beim Satz „die Vorgaben liegen im Repository" leicht
übersieht: Jedes Werkzeug sucht eine **andere** Datei.

| Werkzeug | liest |
|---|---|
| Claude Code | `CLAUDE.md`, samt aller darüberliegenden Verzeichnisse |
| GitHub Copilot | `.github/copilot-instructions.md`, zusätzlich `.github/instructions/*.instructions.md` |
| Cursor | `.cursor/rules/`, früher `.cursorrules` – liest auch `AGENTS.md` |
| OpenAI Codex | `AGENTS.md` |
| Windsurf | `.windsurfrules` bzw. `.windsurf/rules/` |
| Aider | `CONVENTIONS.md` |
| JetBrains Junie | `.junie/guidelines.md` |

**`AGENTS.md` ist der werkzeugübergreifende De-facto-Standard** – nach Angaben des Projekts in
über 60.000 Open-Source-Projekten verwendet und von Codex, Cursor, GitHub Copilot, Gemini CLI,
Windsurf, Zed, Aider, VS Code, Devin und Jules gelesen. Claude Code gehört ausdrücklich **nicht**
dazu.

**Muster: eine Quelle, mehrere Türen.** Der Inhalt steht in `AGENTS.md`, weil die meisten
Werkzeuge dort suchen. `CLAUDE.md` und `.github/copilot-instructions.md` sind **Zeiger** von drei
Zeilen: „Verbindlich ist `AGENTS.md`, dort weiterlesen." Ein Werkzeug mehr heißt ein Zeiger mehr –
nie eine Kopie des Inhalts. Zeiger statt Symlinks, weil Symlinks unter Windows eine gesonderte
Einstellung brauchen. Auseinanderlaufende Vorgabedateien sind schlimmer als keine: Dann streiten
zwei Werkzeuge im selben Repository mit Berufung auf verschiedene Regeln.

Verschachtelte `AGENTS.md` in Unterverzeichnissen sind vorgesehen, und die **nächstgelegene
gewinnt**. Ein fachlicher Ausschnitt (6.2) kann damit seine eigene Datei tragen: Teamregeln oben,
Besonderheiten der Domäne darunter.

**Die Grenze der Wirkung, und sie ist für den Firmenauftrag entscheidend.** Diese Dateien
erreichen nur eine KI, die **im Repository läuft** – als Erweiterung in der Entwicklungsumgebung
oder als Agent auf der Kommandozeile. Wer Code in ein **Browser-Chatfenster** einfügt, arbeitet
ohne sie. Und genau das ist der Fall bei kostenlosen und nicht lizenzierten Zugängen (11.2): Das
sind meist Browser-Chats, keine Werkzeuge im Projekt. Die zentrale Datei erreicht damit
möglicherweise die Hälfte der tatsächlich benutzten Werkzeuge. Sie ist deshalb **keine
Durchsetzung**, sondern eine Senkung der Fehlerquote für die, die im Repo arbeiten; durchgesetzt
wird im Pull Request und im Review (6.4).

**Zwei Dinge gehören nicht hinein.** Nichts Vertrauliches – der Inhalt wird von den Werkzeugen an
ihre Anbieter übertragen, bei jedem Aufruf; die Datei verlässt das Haus. Und nicht das
Anforderungsdokument: Die Vorgabedatei **zeigt** darauf. Kurz, befehlsförmig, überprüfbar; lange
Vorgabedateien werden verdünnt und dann übergangen.

**Prüfbar ist sie auch:** Verletzt eine KI eine Regel wiederholt, ist meist die Regel schlecht
geschrieben und nicht die KI schlecht. Ihre Pflege ist Dokumentation im Sinne von `t4`.

*Im eigenen Repository am 13.09.2026 so umgesetzt: `AGENTS.md` trägt den Inhalt, `CLAUDE.md` und
`.github/copilot-instructions.md` sind Zeiger. Das Muster steht damit im Projekt und muss den
Schülern nicht beschrieben werden.*

### 6.2 Arbeitsschnitt: fachlich und klein

Der klassische Schnitt war technisch – einer Frontend, einer Backend, einer Datenbank. Seine
Begründung war die teure technische Tiefe; genau die ist billig geworden. Knapp bleibt
Domänenwissen, weil es in keinem Trainingsmaterial steht, sondern im Kopf des Kunden. Also
verantwortet jede Person einen **fachlichen Ausschnitt** von der Anforderung bis zur Abnahme.

Mit zwei Einschränkungen:

- Alleinbesitz erzeugt Wissensinseln, und wer eine Domäne nicht versteht, kann sie nicht
  reviewen – damit fällt weg, worauf die Beurteilung aufbaut. Deshalb: eine verantwortliche
  Person je Ausschnitt und **eine zweite, die mitlesen muss**.
- Die Ausschnitte müssen groß genug sein, um echt zu sein. Bei vier Schülern und einem
  Schulprojekt sind vier Domänen meist zu klein geschnitten; zwei Paare mit je einem
  Ausschnitt tragen besser.

Ein Zweig pro Anforderung, eine Anforderung pro Person zur Zeit, die ID im Zweignamen – nicht
aus Ordnungsliebe, sondern weil ein Review nur bei kleinen Einheiten stattfindet. Bei 800
Zeilen wird es zum Abnicken.

### 6.3 Der Test ist der Vertrag, nicht der Nachweis

Das ist die wichtigste Änderung gegenüber dem klassischen Ablauf. Kommt die Umsetzung von der
KI, ist der Test die einzige Stelle, an der die **Absicht** festgehalten ist.

> **Akzeptanztest zuerst, abgeleitet aus den Akzeptanzkriterien, geschrieben von jemand
> anderem als dem Umsetzer.**

Damit ist strukturell verhindert, dass Code und Test derselben Fehlannahme folgen – was genau
passiert, wenn beide aus demselben Chat kommen.

### 6.4 Der Merge ist der Prüfpunkt

Der Pull Request sichert in **drei Schichten** ab, und sie sind sehr unterschiedlich stark. Wer
sie verwechselt, verlässt sich auf die schwächste.

**Schicht 1 – die Pipeline: unbestechlich, aber begrenzt.** Sie hat keine Laune und macht keine
Ausnahme; sie prüft nur, was prüfbar ist. Damit sie mehr ist als eine Empfehlung, braucht `main`
fünf Schutzeinstellungen:

| | Einstellung |
|---|---|
| 1 | Kein direkter Push – Änderungen nur über Pull Request |
| 2 | Alle Prüfungen müssen grün sein |
| 3 | Zweig muss vor dem Zusammenführen aktuell sein |
| 4 | **Genehmigungen verfallen bei neuen Commits** |
| 5 | Kein Force-Push, kein Löschen des Zweigs |

Nummer 4 fehlt am häufigsten und ist die wichtigste: Ohne sie wird genehmigt und danach
nachgeschoben. Zwei Einschränkungen gehören dazu: Für ein Schülerteam muss die Regel **auch für
Verwaltungsrechte** gelten, sonst hebt der mit den Rechten alles auf – und geschützte Zweige
gibt es in *privaten* Repositories nur in den Bezahltarifen. Wo das nicht zu haben ist, bleibt
die Pipeline eine Empfehlung, und die Absicherung trägt allein Schicht 3.

**Schicht 2 – die Form: wirkt ohne Einsicht.**

- **Größenbegrenzung.** Die einzige Maßnahme, die gegen KI-Volumen wirklich hilft. Ab etwa 400
  geänderten Zeilen wird nicht mehr gelesen, sondern durchgewinkt – und KI macht große
  Änderungen billig. Darüber wird aufgeteilt.
- **Ein Pull Request, eine Anforderung**, mit der ID im Zweignamen und im Titel.
- **Pflichtfelder in der Vorlage:** welche Anforderung, wie geprüft, und was bewusst *nicht*
  gemacht wurde. Das letzte erzwingt eine Grenze statt eines Gefühls von Vollständigkeit.

**Schicht 3 – der Mensch: nachweislich die schwächste.** Nach E10 begegnen Reviewer
KI-erzeugten Beiträgen **milder** als menschlichen, bei gleichzeitig höherer Redundanz. Die
Sicherung gibt also gerade dort nach, wo sie am meisten gebraucht wird. Dagegen hilft Struktur,
nicht Wohlwollen – drei Fragen, die man mit Sympathie nicht beantworten kann:

1. **„Gibt es das schon?"** – gegen das Verdoppeln, das E8 und E10 beide messen.
2. **„Was passiert am Rand?"** – leere Liste, Null, zwei gleichzeitig, Grenzwert.
3. **„Nenne den Test, der bricht, wenn diese Zeile falsch ist."** Bricht keiner, ist die Stelle
   unbewacht – unabhängig davon, wie gut der Code aussieht.

Und: Der Reviewer schreibt **eine Zeile, was er geprüft hat**, nicht „LGTM". Damit hängt sein
Name an einer Aussage statt an einem Häkchen.

**Was der Pull Request grundsätzlich nicht kann.** Er stellt **keine Urheberschaft** fest und
kann es nicht. Und er verhindert kein gegenseitiges Durchwinken – zwei Schüler können sich
abwechselnd genehmigen, und die Kennzahl „Review-Beteiligung" sieht danach hervorragend aus
(R-13).

**Die Absicherung dagegen ist nicht technisch.** Der Pull Request sichert nicht selbst ab; er
erzeugt die **Belege, an die sich das Gespräch hängen kann**. Eine Genehmigung mit Namen und
Datum ist eine Behauptung, und im Sprintreview ist sie beantwortbar: *„Du hast das genehmigt –
erklär mir, was da passiert."* Wer das nicht kann, hat nicht gelesen, und das ist eine
Feststellung zu `i4` und `i5`, keine Vermutung. Damit ist der Pull Request für die Arbeit der
anderen, was die Spur (FA-78) für die eigene ist: ein Anker für die Frage, nicht die Antwort.

*Im eigenen Repository am 13.09.2026 umgesetzt: `scripts/repo-einrichten.ps1 -Schutz` setzt die
fünf Einstellungen, `CONTRIBUTING.md` begründet jede einzelne.*

#### Wie es abläuft

Vorher läuft die Pipeline unpersönlich durch (Bauen, Tests, Lint), damit im Review über
Substanz geredet wird und nicht über Formatierung. Dann liest ein Mensch und fragt. Die Regel
lautet nicht „kein KI-Code", sondern **„kein unreviewter Code"** – und der Autor muss erklären
können, was drinsteht.

Dazu ein Befund, der dieser Stelle ihre Schärfe nimmt und deshalb dazugehört: Reviewer
begegnen KI-erzeugten Beiträgen **milder** als menschlichen (E10). Die Sicherung ist also
gerade dort schwächer, wo sie am meisten gebraucht wird. Wer Review als Schutz einsetzt, muss
das benennen – sonst verlässt sich das Team auf etwas, das nachgibt.

Architekturentscheidungen gehören nicht in den privaten Chat, sondern als kurze, datierte ADRs
ins Repository. Sonst begründet jede KI dieselbe Frage mehrfach verschieden, und keine
Entscheidung ist nachvollziehbar.

### 6.5 Der maschinelle Nachprüfer im Pull Request

*Vorschlag des Auftraggebers vom 13.09.2026: eine KI als Nachprüfer im Pull Request – dann
braucht es **eine** gute Lizenz am Repository statt einer je Schüler.*

Das dreht das Werkzeugproblem um. Die Schule kann sechzehn Schüler nicht ausstatten (11.2), aber
**einen** Zugang in der Pipeline kann sie bezahlen. Damit wird die Ungleichheit dort ausgeglichen,
wo sie für die Beurteilung zählt: beim Prüfen, nicht beim Schreiben.

**Drei Dinge, die das tatsächlich löst**

1. **Gleiche Bedingungen beim Prüfen.** Jeder Pull Request wird gleich geprüft, unabhängig davon,
   mit welchem Werkzeug er entstanden ist.
2. **Das Loch aus 6.1.** Ein Prüfer, der in der CI läuft, liest `AGENTS.md` und die Anforderungen –
   anders als das Browser-Chatfenster des Schülers. Die Projektregeln erreichen ihn.
3. **Gleichmäßigkeit.** Er stellt bei Team C dieselben Fragen wie bei Team A, auch in der sechsten
   Stunde. Menschliche Aufmerksamkeit tut das nicht; das ist keine Kritik, sondern Biologie – und
   es ist zugleich eine Maßnahme gegen R-14.

**Was er gut kann und was nicht.** Gut: Duplikate, Randfälle, fehlende Fehlerbehandlung,
Abweichungen von den Konventionen. Schlecht: genau die **erfundene Geschäftsregel** – dass ein
Storno zwei Tage Kulanz hat, weiß er nicht. Außer man gibt ihm die **Akzeptanzkriterien** der im
Pull Request genannten Anforderung. Dann ist die stärkste Frage aus dem Repository heraus
beantwortbar: *„Welches Akzeptanzkriterium ist durch keinen Test abgedeckt?"*

**Die Reihenfolge ist alles: Nachprüfer, nicht Vorprüfer.** Der Mensch zuerst, die Maschine
danach. Läuft sie vorher, liest der Schüler ihre Anmerkungen statt des Codes, und „Review" heißt
dann „Bot-Kommentare abarbeiten" – damit stirbt genau das, was beurteilt werden soll (`i4`, `i5`).
Technisch heißt das: nicht beim Öffnen des Pull Requests auslösen, sondern **nachdem** ein
menschliches Review abgegeben wurde.

**Das eigentlich Wertvolle ist die Differenz.** Interessant ist nicht, was der Prüfer findet,
sondern was der **Mensch** gefunden hat und der Prüfer nicht – und was der Prüfer gefunden hat und
der Mensch übersah. Das steht mit Zeitstempeln im Pull Request, ist schwer zu manipulieren und ist
der erste belastbare Hinweis darauf, **ob jemand gelesen hat**. Für `i4` ist das mehr wert als
jede Zählung. Es bleibt ein Hinweis für das Gespräch, keine Kennzahl.

**Vier Warnungen**

| | |
|---|---|
| **Dringend** | Copilot Code Review kann seit 01.09.2026 Pull Requests **genehmigen**, und diese Genehmigung kann auf die verlangte Zahl der Genehmigungen angerechnet werden. Standardmäßig aus – und **muss aus bleiben**: Sonst erfüllt der Bot die Einstellung „mindestens eine Genehmigung" (6.4), und die Absicherung ist hohl. Bei einem Schülerteam ist das die erste Abkürzung, die gefunden wird |
| Bewertung | **Nicht bewerten, was der Prüfer findet.** Sonst wird auf Bot-Stille optimiert und der Code vorher durch die eigene KI geschickt (R-13). Die Ausgabe ist **Prüfanlass**, nicht Bewertungsgrundlage – dieselbe Konstruktion wie FA-81 AK-5 |
| Kosten | Copilot Code Review verbraucht seit 01.06.2026 GitHub-Actions-Minuten; die automatische Prüfung verlangt je nach Einrichtungsweg (Benutzer, Repository per Ruleset, Organisation) unterschiedliche Tarife. Was für das eigene Konto gilt, ist dort zu prüfen |
| Forks | Bei einem **eigenen** API-Schlüssel in der Pipeline: Pull Requests aus **Forks** erhalten keine Secrets. Arbeiten die Schüler in Zweigen desselben Repositories, ist es kein Problem; in Forks läuft der Prüfer nie – und niemand merkt, warum |

**Vertraulichkeitsrechtlich ist es eine Verbesserung.** Statt vieler privater Gewohnheiten, von
denen die Lehrkraft keine kennt, gibt es **einen** dokumentierten Dienst, der in der Vereinbarung
mit der Firma steht (11.2). Das ist der Unterschied zwischen einem Risiko und einer Entscheidung.

**Was der Nachprüfer nicht ist.** Er ist kein Reviewer, er ist ein zweites Paar Augen mit anderen
Schwächen. E10 sagt, dass Menschen KI-Code milder beurteilen; über die Milde einer KI gegenüber
KI-Code ist damit nichts gesagt. Die Absicherung bleibt das Gespräch (6.4, letzter Absatz) – der
Nachprüfer liefert ihm nur mehr Material.

**Der lokale Weg ist dem in der Pipeline überlegen** – für diese Rahmenbedingungen jedenfalls.
Die Lehrkraft lässt den Durchlauf auf ihrem Gerät über die Teamrepositorys laufen: **eine**
Lizenz für alle, keine Einrichtung im Schülerrepo, keine Secrets, kein Fork-Problem, keine
Actions-Minuten – und **kein Tarifproblem**: Der Bot in der Pipeline scheitert bei einem privaten
Repository im kostenlosen Tarif, der lokale Durchlauf nie.

Umgesetzt als `npm run reviewzettel` (`scripts/review-vorbereitung.mjs`). Er erzeugt je Team und
Zeitraum einen Zettel mit vier Abschnitten: was sich fachlich geändert hat, welche
Akzeptanzkriterien ohne Test geblieben sind, wo verdoppelt statt wiederverwendet wurde, und **drei
Fragen mit Datei und Zeile**. Der letzte Abschnitt ist der Ertrag: Eine Frage mit Fundstelle ist
etwas, worauf man zeigen kann.

**Der zweite Weg: Auswertung je Pull Request im Nachhinein** (`npm run pullrequests`). Der
Reviewzettel sieht die Änderung eines Zeitraums als Ganzes; diese Auswertung sieht **jeden Pull
Request einzeln**, nachdem er zusammengeführt ist. Sie braucht **keinen Klon**: `gh pr list` und
`gh pr diff` holen Liste und Diff direkt.

Sie liefert zwei Teile, und die Trennung ist ihr Zweck:

1. **Zählbar, ohne KI.** Gab es ein Review einer **anderen** Person? Wie lange lag zwischen dem
   letzten Commit *vor* der Genehmigung und der Genehmigung – und wie viele Zeilen waren das je
   Minute? Wurde nach der Genehmigung noch nachgeschoben (6.4, Einstellung 4)? Wer hat wen
   begutachtet? Das ist reproduzierbar und im Widerspruchsfall zeigbar.
2. **Vier Fragen je Pull Request, mit KI.** Danach, getrennt, als Vorschlag gekennzeichnet.

Die Trennung erlaubt, dem einen Teil zu glauben, ohne dem anderen zu glauben. Ohne `--werkzeug`
entstehen **nur** die Kennzahlen – dann verlässt kein Diff den Rechner.

Drei Festlegungen stecken in beiden Skripten:

- **Der Prompt ist für alle Teams derselbe.** Das ist der halbe Zweck – Gleichmäßigkeit gegen
  R-14.
- **Die KI sieht Code, nicht Leute.** Commit-Autoren bleiben draußen, Adressen werden entfernt;
  mit `--mit-verlauf` erscheinen Beitragende als Pseudonyme, und die Zuordnung steht nur im Zettel
  auf dem Gerät. Vollständige Anonymisierung wird dabei **nicht behauptet**: Was im Quelltext
  selbst steht, kann kein Filter zuverlässig finden.
- **Ohne Zugang geht es auch.** `--nur-prompt` schreibt nur den Text; einfügen, Antwort
  zurückkopieren. Damit hängt das Verfahren an keiner Lizenz.

Noch nicht entschieden: **OP-K12** (ob ein Nachprüfer in der Pipeline dazukommt) und **OP-K13**
(mit welchem Werkzeug und auf welchem Weg).

### 6.6 Der Kunde prüft am laufenden System, nicht am Code

Jeder Merge landet in der Prüfumgebung; der Kunde testet gegen die Kriterien, die er
mitgezeichnet hat. Seine Rückmeldung geht **datiert in das Anforderungsdokument** – nicht als
mündliches „er hat's anders gemeint". Sonst ist am Ende nicht unterscheidbar, ob das Team
falsch gebaut oder der Kunde umentschieden hat, und die Beurteilung hängt an einer
Erinnerung.

### 6.7 Drei Reibungen, die sicher kommen

| Reibung | Warum | Gegenmittel |
|---|---|---|
| Konflikte vervielfachen sich | Jede KI formatiert beim Vorbeigehen um und „verbessert" Nachbarcode | Formatierer und Lint-Regeln liegen fest im Repo; „nur den eigenen Ausschnitt anfassen" ist eine Regel |
| Abhängigkeiten schleichen sich ein | KI greift bereitwillig nach einer Bibliothek | Neue Abhängigkeit nur mit schriftlicher Begründung |
| Doppelter Code | Zwei Personen bekommen denselben Helfer zweimal erzeugt; KI übersieht bestehende Wiederverwendung (E8, E10) | „Gibt es das schon?" ist eine Reviewfrage, nicht ein Zufall |

### 6.8 Einführungsreihenfolge

Nicht alles auf einmal. Zwei Regeln zuerst – **Test zuerst, von jemand anderem** und **kein
Merge ohne Review** –, der Rest kommt dazu, wenn die Schüler den Schmerz gespürt haben.
Verordnete Regeln ohne erlebten Anlass werden umgangen.

---

## 7 Was davon bewertet wird – und was nicht

Bewertet wird weiter nach der Rubrik. Die Berührungspunkte:

| Was | Wo es zählt |
|---|---|
| Erklären können, was man eingebracht hat | Verstehensnachweis (FA-40), Spur (FA-78), `i5` |
| Verlässlichkeit gegenüber dem Team, Reviews geben | `i4` |
| Vereinbarungen aus der Retrospektive einhalten | Maßnahmen und Nachschau (FA-80), `p5` |
| Umgang mit Versionsverwaltung und Reviews | `t5`, unterstützt durch die eingelesene Auswertung (FA-81) |

**Nicht bewertet wird der KI-Einsatz selbst** – nicht seine Menge, nicht sein Anteil, nicht
seine Offenlegung. Erstens ist er nicht messbar: Was jemand abends auf seinem Laptop fragt, ist
nicht beobachtbar. Zweitens würde jede Kennzahl dazu sofort bespielt (R-13, Campbell's Law) und
die Nutzung in den privaten Bereich verschieben, wo sie gar nicht mehr besprechbar ist.
Gegenstand der Beurteilung ist, was vorliegt und was erklärt werden kann.

Eine mögliche Ausnahme ohne Bewertungsfolge: Der Pull-Request-Text nennt, welche Teile **nicht
von Hand** entstanden sind – nicht zur Kontrolle, sondern als Hinweis für den Reviewer, wo er
genauer hinsehen soll. Offen, siehe OP-K4.

---

## 8 Offene Fragen

Keine Anforderungen, sondern Entscheidungen des Auftraggebers, die noch ausstehen. Sie leben
in diesem Dokument, bis sie entschieden sind; erst dann entsteht daraus gegebenenfalls eine
Anforderung oder ein Absatz im Fachkonzept.

| Nr. | Frage |
|---|---|
| **OP-K1** | Ausschnittsgröße: ein fachlicher Ausschnitt je Person oder je Paar? Abhängig von Teamgröße und Projektumfang – Festlegung nach dem ersten Durchgang. |
| **OP-K2** | Wird der Akzeptanztest verpflichtend von einer anderen Person geschrieben als die Umsetzung, oder ist das eine Empfehlung? Verpflichtend heißt: im Review prüfbar, und bei Nichteinhaltung eine Folge. |
| **OP-K3** | Wird die Kundenbefragung bei Eigenprojekten verlangt (eine Person außerhalb des Teams), und ist ihr Ergebnis Teil der Sprintabnahme? |
| **OP-K4** | Soll der Pull-Request-Text nennen, was nicht von Hand entstanden ist? Nutzen für den Reviewer gegen die Gefahr, dass daraus eine Kontrolle wird. |
| **OP-K5** | Wer pflegt die gemeinsame Vorgabedatei im Repository – das Team selbst oder die Lehrkraft? Wird sie bewertet (Teil von „Dokumentation", `t4`) oder ist sie Voraussetzung? |
| **OP-K6** | Die Fehlersuchübung aus 3.2: eigener Abschnitt mit Bewertung oder Übung ohne Notenfolge? |

---

## 9 Empirische Grundlage zum KI-Einsatz

Die Aussagen in 3 bis 6 sind Erfahrungs- und Plausibilitätsargumente, soweit hier nichts
anderes steht. Vier Arbeiten stützen einzelne davon. Sie zeigen in eine Richtung – **mehr
Ausgabe, schwächere Sicherungen** –, und ihre Tragfähigkeit ist begrenzt.

| Nr. | Quelle | Befund | Wirkt auf |
|---|---|---|---|
| **E7** | METR, *Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity* (randomisierter Versuch, 16 erfahrene Entwickler, 246 Aufgaben in eigenen großen Repositories) | Mit KI-Werkzeugen brauchten die Entwickler **19 % länger**. Sie erwarteten vorher 24 % Beschleunigung und glaubten **nachher**, um 20 % schneller gewesen zu sein. Die Selbsteinschätzung lag also um fast 40 Punkte neben der Messung | 3.1, 3.2 – Vorsicht gegenüber „Denkleistung steigt" in der optimistischen Lesart |
| **E8** | GitClear, *AI Copilot Code Quality* (211 Mio. geänderte Codezeilen, 2020–2024, Repositories großer Konzerne) | Anteil kopierter (geklonter) Codeblöcke von 8,3 % auf 12,3 % gestiegen, Anteil umstrukturierenden Codes von 25 % auf unter 10 % gefallen; kopierter Code übertraf erstmals verschobenen | 6.7 – doppelter Code als Reviewfrage |
| **E9** | DORA / Google Cloud, *Balancing AI tensions* (1.110 offene Antworten von Google-Ingenieuren, 3. Quartal 2025) | Höhere KI-Nutzung geht mit **höherem Durchsatz und gleichzeitig höherer Instabilität** der Auslieferung einher. Als wirksame Gegengewichte genannt: kleine Arbeitspakete, Testautomatisierung, für KI lesbare interne Dokumentation, früher ansetzende Reviews | 6.1 bis 6.5 – die Maßnahmen dieses Kapitels sind genau diese |
| **E10** | Huang u. a., *More Code, Less Reuse: Investigating Code Quality and Reviewer Sentiment towards AI-generated Pull Requests* (MSR '26; 3.858 Python-Pull-Requests, Vertiefung an einem Repository mit 617) | KI-erzeugte Pull Requests enthalten **1,87-mal mehr redundanten Code** und übersehen bestehende Wiederverwendung; klassische Maße (Codezeilen, zyklomatische Komplexität) unterscheiden sich kaum. Reviewer reagieren auf KI-Beiträge **neutraler bis positiver** als auf menschliche – weniger Ärger, weniger Überraschung | 6.4 – das Review ist gegenüber KI-Code schwächer; 6.5, 6.7 |

**Wie weit das trägt: begrenzt.** E7 hat 16 Teilnehmer, erfahrene Entwickler in ihren eigenen
großen Projekten – die Autoren sagen ausdrücklich, ihr Ergebnis zeige **nicht**, dass KI
generell nicht hilft, und verweisen auf Lerneffekte, die erst nach mehreren hundert Stunden
Nutzung auftreten könnten (ihre Teilnehmer hatten etwa 50). Schüler sind keine erfahrenen
Entwickler; der Befund ist auf sie nicht übertragbar, sondern eine Warnung gegen die
Selbsteinschätzung als Beweis. E8 legt nicht offen, wie KI-erzeugter Code identifiziert wurde,
und nennt keine Fehlerschranken – die Zahlen sind Anhaltspunkte, keine Messwerte. E9 ist eine
Befragung in **einem** Unternehmen, keine Kausalaussage. E10 untersucht nur Python und die
Vertiefung nur ein Repository; die Stimmungsanalyse arbeitet mit einem Modell für allgemeines
Englisch, nicht für Code-Reviews.

Nichts davon stammt aus einer österreichischen HTL oder überhaupt aus dem Unterricht. Keine
dieser Arbeiten begründet eine Note.

### 9.1 Fundstellen

| Nr. | Quelle | Abgerufen |
|---|---|---|
| E7 | [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) · [arXiv:2507.09089](https://arxiv.org/abs/2507.09089) | 2026-09-13 |
| E8 | [AI Copilot Code Quality: 2025 Data Suggests 4x Growth in Code Clones](https://www.gitclear.com/ai_assistant_code_quality_2025_research) | 2026-09-13 |
| E9 | [Balancing AI tensions: Moving from AI adoption to effective SDLC use](https://dora.dev/insights/balancing-ai-tensions/) | 2026-09-13 |
| E10 | [More Code, Less Reuse: Investigating Code Quality and Reviewer Sentiment towards AI-generated Pull Requests](https://arxiv.org/html/2601.21276) | 2026-09-13 |

### 9.2 Fundstellen zu den Werkzeugvorgaben (6.1)

Keine Studien, sondern Angaben der Hersteller und des Standards – Tatsachen über Werkzeuge, die
sich ändern können.

| Thema | Quelle | Abgerufen |
|---|---|---|
| `AGENTS.md` als Standard, unterstützte Werkzeuge, verschachtelte Dateien | [agents.md](https://agents.md/) | 2026-09-13 |
| Welche Datei welches Werkzeug liest | [AI Agent Configuration Files: Complete Cross-Tool Guide 2026](https://www.productbuilder.net/learn/agent-config-files) | 2026-09-13 |
| Copilot: `.github/copilot-instructions.md` | [GitHub Docs: Adding repository custom instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions-in-your-ide/add-repository-instructions-in-your-ide) | 2026-09-13 |
| Copilot Code Review kann Pull Requests genehmigen (01.09.2026) | [GitHub Changelog](https://github.blog/changelog/2026-09-01-copilot-code-review-can-now-approve-pull-requests/) | 2026-09-13 |
| Automatische Prüfung einrichten, Tarife, Ruleset | [GitHub Docs: Configuring automatic code review by Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-automatic-review) | 2026-09-13 |
| Actions-Minuten ab 01.06.2026 | [GitHub Changelog](https://github.blog/changelog/2026-04-27-github-copilot-code-review-will-start-consuming-github-actions-minutes-on-june-1-2026/) | 2026-09-13 |

---

## 10 Was dieses Dokument nicht regelt

- **Keine Änderung an der Software.** Alle genannten Instrumente (FA-40, FA-78 bis FA-81)
  bestehen bereits; es entsteht daraus keine neue Anforderung.
- **Keine Nutzungsordnung.** Ob und wie Schüler KI verwenden, wird hier nicht geregelt, und die
  Verwendung wird nicht bewertet (siehe 7).
- **Keine Aussage zur Rechtslage.** Ob KI-Einsatz bei einer Diplomarbeit offenzulegen ist,
  richtet sich nach den Vorgaben der Schule und des Prüfungsrechts, nicht nach diesem Dokument.

---

## 11 Rahmenbedingungen beim Firmenauftrag

### 11.1 Der Regelfall

Eine Firma vergibt einen kleinen Auftrag an eine Gruppe von drei bis vier Schülern. Repository,
CI/CD und Kundentestsystem sind gesetzt. Die Arbeit erfolgt in Sprints. Die Schüler verfügen
über **unterschiedlich gute, teilweise nicht lizenzierte** KI-Werkzeuge.

Damit unterscheidet sich die Lage von einem Schulprojekt in drei Punkten: Es gibt ein fremdes
Interesse mit Terminen und Rechten; die Infrastruktur ist nicht verhandelbar; und die KI-Frage
ist keine didaktische mehr, sondern eine Frage der Vertraulichkeit gegenüber der Firma.

### 11.2 Festlegungen des Auftraggebers

Entschieden am 13.09.2026.

| Frage | Festlegung |
|---|---|
| KI-Einsatz gegenüber der Firma | **Mit jeder Firma einzeln zu vereinbaren.** Es gibt keine allgemeine Regel; die Klausel gehört in jede Auftragsvereinbarung |
| Ungleich gute Werkzeuge | Die Schule **kann keine Werkzeuge bereitstellen**. Gleiche Bedingungen sind damit nicht herstellbar |
| Abnahme eines Sprints | **Alle drei Varianten** kommen vor – Firma fachlich, Lehrkraft allein, gemeinsam –, je nach Firma |
| Wer holt die Vereinbarung ein | **Das Team selbst.** Das ist die erste echte Anforderungsarbeit und wird bewertet (`v5`, `da-p2`) |
| Werkzeugfreier Nachweis | **Nichts zusätzlich** – das Sprintreview genügt |
| Schweigende Firma | **Ausgleich im Einzelfall**, kein Grundsatz |
| Repository-Eigentum | **Hängt von der Firma ab** |
| Anforderungsänderung mitten im Sprint | **Sprint wird abgebrochen und neu geplant**, der abgebrochene trotzdem bewertet |
| Sprintwert des abgebrochenen Sprints | **Grundsätzlich ja**, aber Einzelfallentscheidung |
| Ausfall der Firma | **Die Lehrkraft übernimmt die Kundenrolle**, das Ziel wird auf das Machbare zugeschnitten |

### 11.3 Was daraus folgt

**a) Das Review trägt die Werkzeugunabhängigkeit allein.** Wenn die Schule keine Werkzeuge
stellt und nichts zusätzlich werkzeugfrei erbracht wird, ist das Sprintreview die einzige
Stelle, an der werkzeugunabhängig festgestellt wird. Das ist vertretbar – bewertet wird, was
jemand erklären und verantworten kann, nicht was vorliegt. Es verlangt aber: für alle Teams
dieselben Fragen, und das Ergebnis aufgeschrieben (FA-40, FA-78). Eine Beurteilung, die
Ausgabemenge belohnt, belohnt bei ungleichem Zugang teilweise Kaufkraft – das ist der Satz,
gegen den die Reviewführung schützen muss.

**b) Nicht lizenzierte Werkzeuge heilt keine Vereinbarung.** Werden Nutzungsbedingungen
umgangen oder Zugänge geteilt, kann das nicht Teil eines von der Schule vorgegebenen Ablaufs
sein – schon gar nicht auf fremdem Firmencode. Die Konsequenz ist keine Kontrolle, sondern eine
Anforderung an die Aufgabenstellung: **Kein Arbeitsschritt im Sprint darf ein Werkzeug
voraussetzen, das ein Schüler nur unlizenziert hätte.**

**c) Erheben und unterschreiben sind zweierlei.** Minderjährige schließen keinen Vertrag. Das
Team erhebt den Inhalt der Vereinbarung, Vertragspartner sind Schule und Firma. Das muss auf dem
Blatt stehen, sonst haftet am Ende ein Siebzehnjähriger für eine Zusage.

**d) Der Beweis darf nicht im Repository liegen.** Hängt der Zugang an der Firma, kann er nach
Projektende entzogen werden – und damit die Grundlage der Aufzeichnung nach § 18 Abs. 1 SchUG
und der Einsicht nach § 71 SchUG. Daraus folgt eine **zweite Begründung für FA-81**: Die
eingelesene Auswertung ist die archivierte Abschrift, nicht bloß eine Bequemlichkeit. Sie wird
deshalb **bei jedem Sprintabschluss** eingelesen, nicht bei Gelegenheit. Und die Vereinbarung
hält fest, dass der Zugang der Lehrkraft bis zum Ende des Schuljahres bestehen bleibt.

**e) „Abbruch" ist kein Zustand im Modell, sondern ein Vorgang.** FA-77 kennt Vorschlag,
fixiert und abgeschlossen. Ein Abbruch wird deshalb so festgehalten: **Zeitraum auf den
Abbruchtag verkürzen, Sprint regulär abschließen, Grund in die Teamnotiz.** Damit bleibt die
eingefrorene Rubrik gültig (FA-65), der Folgesprint ist fixierbar (FA-77 AK-3), der Zeitfaktor
rechnet mit der tatsächlichen Dauer (FA-04), und bewertet wird gegen das Ziel, das bis zum
Abbruch galt. **Keine neue Anforderung, keine Code-Änderung** – aber eine Regel, die dastehen
muss, sonst wird daraus „schauen wir mal".

### 11.4 Das Muster hinter den Festlegungen – und sein Preis

Vier der zehn Festlegungen lauten „Einzelfallentscheidung". Das ist kein Ausweichen: Eine Regel
wäre in diesen Fällen gröber als das Urteil, und das entspricht dem Grundsatz, auf dem das
ganze Werkzeug gebaut ist – die Rechnung macht einen **Vorschlag**, die Lehrkraft entscheidet
(G9, ADR-006). Deshalb verlangt keine dieser Festlegungen neuen Code: Der gesetzte Wert mit
Begründung (FA-50) ist das Werkzeug für alle vier Fälle.

Der Preis steht als **[R-14](risiken.md)** im Risikoregister: Je mehr Einzelfälle, desto mehr
hängt die Vergleichbarkeit zwischen den Teams an der Aufzeichnung – und an nichts sonst. Eine
still vorgenommene Korrektur ist im Nachhinein nicht von Willkür zu unterscheiden.

### 11.6 Sprintrhythmus: versetzte Sprints je Team

**Ausgangslage.** Drei Wocheneinheiten als **ein Block**, rund 135 Minuten, nutzbar etwa 120.
Darin liegt genau **ein** volles Sprintreview samt Retrospektive und anschließendem Planning
(rund 40 Minuten); die übrigen Teams arbeiten in dieser Zeit weiter.

**Der Engpass ist die Reviewzeit, nicht die Arbeitszeit.** Die Arbeit skaliert mit der Zahl der
Schüler, das Review mit der Zahl der **Teams** – und die Unterrichtszeit tut das nicht. Bei vier
Teams und Zwei-Wochen-Sprints wären zwei bis drei Stunden je Sprint allein für Reviews nötig:
die Hälfte bis zwei Drittel der gesamten Kontaktzeit.

**Festlegung vom 13.09.2026: die Sprints der Teams laufen versetzt.** In jeder Einheit ist genau
ein Review. Daraus folgt die Sprintlänge, sie ist nicht mehr frei:

> **Sprintlänge in Wochen = Zahl der Teams.**

Drei Teams ergeben Drei-Wochen-Sprints, vier Teams Vier-Wochen-Sprints. **Bei fünf und mehr
Teams bricht die Regel:** Fünf Wochen sind zu lang – die Rückmeldung kommt zu spät und es
bleiben im Jahr rund sechs Feststellungen. Dann braucht es zwei Reviews je Block (je 30 Minuten,
straffes Format) oder einen zweiten Termin. Das ist eine Obergrenze, keine Geschmacksfrage.

**Der Versatz entsteht einmal**, indem der **erste** Sprint je Team unterschiedlich lang ist –
Team A drei Wochen, Team B vier, Team C fünf. Danach laufen alle mit gleicher Länge, ihre
Reviews liegen aber in aufeinanderfolgenden Wochen. Von selbst hält das für den Rest des Jahres.

**Was die Software dafür braucht.** Die Rechnung nichts: Der Zeitraum hängt am Team (FA-66,
Schemastand 3), die Stichtagszuordnung geht nach dem Teamende (FA-48 AK-6), fehlende Abschnitte
fallen aus der Gewichtung statt als 0 zu zählen (ADR-004). Dass Team A zum Semesterzeugnis drei
und Team C zwei Sprints fertig hat, trägt das Modell.

Die **Navigation** dagegen nicht: Die Oberfläche ist nach Abschnitt gegliedert, und bei Versatz
gibt es keinen Abschnitt mehr, der „heute" zeigt – Team A steckt in Sprint 4, während Team C
noch in Sprint 3 ist. Daraus ist **FA-84** entstanden: eine Übersicht über die Abschnitte
hinweg, welches Team wo steht und wo ein Review fällig ist.

**Was dabei aufbricht: der Daily.** Bei einem Block pro Woche gibt es ein Treffen je Woche; ein
„Daily Standup" ist das nicht.

**Entschieden am 13.09.2026 (OP-F30): Das Standup ist eine Gelegenheit, keine Pflicht.** Das
Kriterium heißt künftig `p2` „Standup"; findet eines statt, wird es bewertet, findet keines
statt, bleibt es **leer** und fällt aus der Gewichtung (FA-21, ADR-004). Kein Ersatzwert, keine
Null. Die Kriterien-ID bleibt `p2`, der Erfassungszeitpunkt bleibt `daily` – erfasste Punkte
behalten damit ihren Bezug.

Zwei Sorgfaltspflichten hängen daran:

- **„Nicht beobachtet" ist nicht „nicht geleistet".** Im Bestand steht in beiden Fällen
  dasselbe: leer. Dass es an der Gelegenheit lag, gehört deshalb in die Sprintnotiz (FA-16) –
  sonst liest sich das leere Feld später wie ein Versäumnis des Teams.
- **Weggelassen wird es für das ganze Team**, nicht für einzelne Personen. `p2` ist ein
  Team-Prozesskriterium; wird es bei einem Team bewertet und bei einem anderen nicht, rechnen
  die beiden mit unterschiedlichen Grundlagen. Das ist nicht systematisch unfair – es kann in
  beide Richtungen wirken –, aber es muss erkennbar bleiben, woran es lag.

### 11.5 Weiterhin offen

| Nr. | Frage |
|---|---|
| **OP-K7** | ~~Sprintlänge gegen Schulrhythmus~~ **entschieden 13.09.2026: versetzte Sprints je Team, Sprintlänge in Wochen = Zahl der Teams, Obergrenze vier. Siehe 11.6, daraus FA-84 und OP-F30** |
| **OP-K8** | Arbeit außerhalb der Schule: Wenn die Firma Termine erwartet, entsteht Arbeit zuhause. Beurteilbar ist nur, was beobachtet oder erklärt werden kann (siehe R-09) |
| **OP-K9** | Gewährleistung: Was gilt, wenn die Firma das Ergebnis produktiv nimmt? Die Vereinbarung muss es als Schulübung ohne Zusage ausweisen |
| **OP-K10** | Notengewicht: Ein Firmenauftrag ist mehr Aufwand und mehr Risiko als ein Eigenprojekt. Zählt er gleich? |
| **OP-K11** | Firmendaten im Bewertungswerkzeug: Repository-Pfad und Kennungen sind harmlos, Testdaten aus dem Kundensystem dürfen nicht hineingeraten (DS-01) |
| **OP-K12** | Wird ein **maschineller Nachprüfer** im Pull Request eingesetzt (6.5)? Kosten und Nutzen stehen dort; zu entscheiden ist auch, ob er bei allen Teams gleich läuft – ungleich eingesetzt wäre er selbst eine Ungleichheit |
| **OP-K13** | Wenn ja: mit welchem Werkzeug und auf welchem Weg – Copilot Code Review per Ruleset oder ein eigener Schlüssel in der Pipeline? Tarif, Actions-Minuten und die Fork-Frage entscheiden das, nicht der Geschmack |

OP-K1 bis OP-K3 sind mit 11.2 entschieden, OP-K7 mit 11.6; OP-K4 bis OP-K6 und OP-K8 bis OP-K13 bleiben offen.
