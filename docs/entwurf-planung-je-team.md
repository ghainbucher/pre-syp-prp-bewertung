# Entwurf: Planung je Team (Schemastand 3)

> **Stillgelegt am 14.09.2026. Dieses Papier gilt nicht mehr.**
>
> Es hat Schemastand 3 hervorgebracht – die Planung je Team als eigene Größe neben dem
> Abschnitt. **Schemastand 4 schafft diese Größe wieder ab**: Seit der Sprint dem Projekt
> gehört, gibt es nichts mehr, was mehrere Teams zugleich betrifft, und Abschnitt und Planung
> sind ein Datensatz. Siehe [Solution-Design 5.0c](solution-design.md) und
> [ADR-012](adr/0012-projekt-als-ordnungsachse.md).
>
> Das ist kein Fehler dieses Papiers: Solange ein Abschnitt der Klasse gehörte, war die
> zweite Größe richtig. Erhalten bleibt es als Beleg dafür.

Stand 12.09.2026 · Entwurf zur Entscheidung · betrifft docs/anforderungen.md und
docs/solution-design.md

## 1 Anlass

Im Gespräch am 12.09.2026 festgehalten:

- Wie lange ein Sprint dauert, entscheidet sich erst beim Sprintbeginn.
- Das ist von Team zu Team unterschiedlich, Beginn wie Ende.
- Auch das Sprintziel wird erst zu diesem Zeitpunkt klar.
- Bewertet werden kann erst am Ende eines Sprints.
- Der erste Sprint ist immer ein Vorbereitungssprint, zählt aber wie jeder andere.
- Auch dort wird geplant, was zu tun ist und was am Schluss bewertet wird –
  und dabei können einzelne Kriterien dazukommen oder wegfallen.

Nachgetragen am selben Tag:

- Die Kriterien werden **aus dem letzten Sprint des Teams übernommen**, nicht
  jedes Mal neu aus der Rubrik geholt.
- Für den ersten Sprint braucht es ein **vorgeschlagenes Set**, weil sich gerade
  die frühen Sprints deutlich von den späteren unterscheiden. Ab der Mitte des
  Jahres geht es meist um dieselben Kriterien.
- **KO-Kriterien** sind noch nicht beschrieben: Werden bestimmte Dinge nicht
  geliefert, ist der Sprint negativ zu beurteilen. Wird später ergänzt (Kapitel 8).

Damit fällt die Annahme aus Schemastand 2, ein Abschnitt sei ein **gemeinsames
Zeitfenster der Klasse**. Er ist künftig nur noch Nummer, Reihenfolge, Art und
Strang; alles Zeitliche und Inhaltliche liegt beim Team.

Für Tests bleibt es beim bisherigen Modell: Ein Test findet für alle zur selben
Zeit statt und hat für alle dieselben Fragen.

## 2 Was sich am Modell ändert

| | Schemastand 2 (heute) | Schemastand 3 |
|---|---|---|
| Zeitraum eines Sprints | am Abschnitt, für alle gleich | **je Team** |
| Sprintziel | gibt es nicht | **je Team**, beim Planning festgehalten |
| Geltende Kriterien | Rubrikkopie am Abschnitt | **Rubrikkopie je Team** |
| Zeitpunkt des Einfrierens | erster Punkteintrag | **Festhalten der Planung**, ersatzweise erster Punkteintrag |
| Zuordnung zum Stichtag | Enddatum des Abschnitts | **Enddatum des Teams** |
| Zeitfaktor | Reihenfolge im Strang | unverändert |

Neue Größe im Datenbestand:

```
Teamabschnitt
  abschnittId, teamId
  ziel            was sich das Team vorgenommen hat
  von, bis        Beginn und Ende dieses Teams
  geplantAm       wann die Planung festgehalten wurde
  rubrikKopie     die für dieses Team geltenden Kriterien
  eingefrorenAm, angeglichenAm
```

Bewusst **nicht** in die Bewertung hineingelegt: Die Planung entsteht am
Sprintbeginn, also bevor es irgendeine Bewertung gibt. Eine leere Bewertung nur
als Träger eines Datums anzulegen, würde mit der Aufräumregel kollidieren, die
leere Bewertungen entfernt.

## 3 Neue Anforderungen

### FA-66 Sprintplanung je Team

`Muss` · 0.4.0 · SH-1, SH-2 · geplant

Als Lehrkraft
möchte ich am Sprintbeginn je Team Ziel, Beginn und Ende festhalten,
damit am Ende nachvollziehbar ist, was in welchem Zeitraum beurteilt wurde.

- **AK-1** Je Abschnitt und Team lassen sich Ziel, Beginn und Ende erfassen.
- **AK-2** Die Planung kann angelegt werden, bevor ein einziger Punkt erfasst ist.
- **AK-3** Der Abschnitt gibt Nummer, Art und Strang vor, aber keinen verbindlichen
  Zeitraum. Weicht ein Team stark von den übrigen ab, wird das angezeigt und nicht
  verhindert.
- **AK-4** Ein Team ohne erfasstes Ende bleibt in der Stichtagsauswertung außen
  vor **und wird dabei genannt** (wie FA-48 AK-6 für Abschnitte ohne Datum).
- **AK-5** Das Ziel erscheint in der Belegfassung und in der Rückmeldung. Es ist
  keine Bewertung, sondern der Gegenstand der Bewertung – ohne es steht in der
  Aufzeichnung ein Prozentwert ohne Bezug.
- **AK-6** Für einen Test entfällt die Planung; dort gilt der Zeitpunkt des
  Abschnitts für alle.

*Folgt aus dem Gespräch vom 12.09.2026. Rahmenbedingung: Fachkonzept 3.2 und 8.1.*

### FA-67 Kriterien je Team anpassen

`Muss` · 0.4.0 · SH-1, SH-2 · geplant

Als Lehrkraft
möchte ich beim Planning einzelne Kriterien für dieses Team ergänzen oder streichen,
damit beurteilt wird, was dieses Team in diesem Sprint tatsächlich vorhat.

- **AK-1** Mit dem Festhalten der Planung wird die geltende Rubrik als Kopie an das
  Team gebunden.
- **AK-2** In dieser Kopie lassen sich einzelne Kriterien ergänzen oder streichen.
  Die Gewichte der vier Kategorien bleiben unverändert; innerhalb einer Kategorie
  verschiebt sich das Gewicht über die Maximalpunkte.
- **AK-3** Ein gestrichenes Kriterium ist nicht dasselbe wie ein unbewertetes: Es
  zählt in dieser Kategorie gar nicht mit, während ein unbewertetes aus der
  Gewichtung fällt und als offen gemeldet wird.
- **AK-4** Nach dem ersten Punkteintrag ist die Kopie eingefroren. Änderungen nur
  über das Angleichen (FA-47), das damit je Team wirkt.
- **AK-5** Die Belegfassung weist je Abschnitt und Team die geltenden Kriterien aus
  und benennt Abweichungen von der zugrunde liegenden Rubrik.
- **AK-6** Überall, wo Teams miteinander verglichen werden – Teamvergleich,
  Notenverteilung, Export –, ist auszuweisen, dass die Kriterien abweichen.
  Ein Vergleich ungleicher Maßstäbe ohne Hinweis wäre irreführend.
- **AK-7** Beim Planen eines Sprints sind die Kriterien **des vorigen Sprints
  desselben Teams** vorbelegt, nicht die der Rubrik. Eine einmal getroffene
  Anpassung wirkt damit fort, ohne jedes Mal wiederholt zu werden. Sie bleibt
  ein Vorschlag und ist vor dem Festhalten änderbar.
- **AK-8** Hat das Team noch keinen vorigen Sprint, gilt die Vorlage für den
  ersten Sprint (FA-69).
- **AK-9** Die Herkunft der Kriterien ist erkennbar: übernommen aus Sprint n,
  aus einer Vorlage, oder in diesem Sprint geändert.
- **AK-10** Neben dem Übernehmen muss sich der Satz **aus einer Vorlage neu
  beginnen** lassen. Der Übergang vom Vorbereitungssprint zum zweiten Sprint
  tauscht sechs Kriterien auf einmal; sie einzeln zu streichen und einzeln neu
  anzulegen wäre der falsche Weg für einen Vorgang, der jedes Jahr ansteht.

*Folgt aus dem Gespräch vom 12.09.2026. Behandelt das Risiko, dass die
Vergleichbarkeit zwischen den Teams unbemerkt verlorengeht.*

### FA-68 Bestand auf Schemastand 3 heben

`Muss` · 0.4.0 · SH-1 · geplant

Als Lehrkraft
möchte ich meinen bisherigen Bestand ohne Verlust weiterverwenden,
damit ein laufendes Schuljahr eine Programmänderung übersteht.

- **AK-1** Zu jedem Abschnitt mit Teams entsteht je Team eine Planung mit Beginn
  und Ende des Abschnitts und leerem Ziel.
- **AK-2** Eine vorhandene Rubrikkopie am Abschnitt wird an jedes Team übernommen;
  der Zeitpunkt des Einfrierens bleibt erhalten.
- **AK-3** Punkte, Notizen, Rückmeldungen, Verstehensnachweise, gesetzte Werte und
  Notenstände bleiben unverändert.
- **AK-4** Vor der Umstellung wird der bisherige Stand unverändert gesichert
  (wie FA-57 AK-3).
- **AK-5** Ein Bestand nach Schemastand 3 ergibt dieselben Prozentwerte wie vorher.
  Dafür steht ein Test mit dem Probebestand aus dem Testlauf.

### FA-69 Eigene Vorlage für den Vorbereitungssprint

`Soll` · 0.4.0 · SH-1 · geplant

Als Lehrkraft
möchte ich für den ersten Sprint einen eigenen Kriteriensatz vorgeschlagen bekommen,
damit ich im Vorbereitungssprint nicht Dinge beurteile, die es dort noch gar nicht gibt.

- **AK-1** Neben „Sprint" und „Diplomarbeitsvorbereitung" wird eine dritte Vorlage
  ausgeliefert: „Vorbereitungssprint".
- **AK-2** Sie ist Ausgangspunkt der Fortschreibung nach FA-67 AK-7, nicht ihr Ziel:
  Ab dem zweiten Sprint übernimmt das Team seine eigenen Kriterien.
- **AK-3** Die Vorlage ist wie jede andere Rubrik änderbar und zurücksetzbar.
- **AK-4** Der Kriteriensatz ist in Kapitel 9 ausgeschrieben.

## 4 Geänderte Anforderungen

| Anforderung | Änderung |
|---|---|
| **FA-48** Stichtag | Zugeordnet wird über das **Enddatum des Teams**, nicht mehr des Abschnitts. AK-6 gilt sinngemäß für Teams ohne Enddatum. |
| **FA-65** Einfrieren | Wandert vom Abschnitt auf das Team **und** vom ersten Punkteintrag auf das Festhalten der Planung. Das ist die bessere Reihenfolge: Die Kriterien stehen vor dem Sprint fest, nicht nach der ersten Eintragung. |
| **FA-47** Angleichen | Wirkt je Team; die Vorschau zeigt, welche Teams betroffen sind. **Verliert an Bedeutung:** Mit der Fortschreibung nach FA-67 AK-7 ist der übliche Weg einer Kriterienänderung der nächste Sprint, nicht das nachträgliche Angleichen des vorigen. Angleichen bleibt für den Fall, dass ein Kriterium falsch war – nicht dafür, dass es sich weiterentwickelt hat. |
| **FA-55** Rubriken | Die Rubrik ist nur noch **Saatgut**: Sie belegt den ersten Sprint vor, danach trägt die Kette der Teamkopien. Das ist eine stille, aber große Verschiebung – die Rubrikansicht ist damit nicht mehr der Ort, an dem man sieht, wonach beurteilt wird. |
| **FA-31 / FA-51** Vergleich | Hinweis auf abweichende Kriterien, siehe FA-67 AK-6. |

Unberührt bleiben: FA-54 Zeitfaktor, FA-58 Teamzugehörigkeit, FA-59 Stränge,
FA-61 Sperre, FA-49 Notenstand, FA-50 gesetzte Werte, die gesamte Peer-Rechnung
und der Aufbau der Belegfassung.

## 5 Offene Punkte

| | Frage | Warum sie zählt |
|---|---|---|
| **OP-F17** | Dürfen Teams eine **unterschiedliche Anzahl** Sprints haben? | Der Zeitfaktor teilt die Abschnitte eines Strangs in zwei Hälften. Bei gleicher Anzahl ist das unproblematisch. Hat ein Team fünf und ein anderes sechs Sprints, liegen die Hälften verschieden – rechnerisch zulässig, aber erklärungsbedürftig. |
| **OP-F18** | Was geschieht mit einem Sprint, der **über einen Zeugnisstichtag hinausläuft**? | Heute zählt das Enddatum, der Sprint fiele also ganz in das zweite Semester. Bei einem Sprint, der zu vier Fünfteln im ersten liegt, ist das eine Entscheidung und keine Selbstverständlichkeit – § 20 LBVO verlangt den Leistungsstand *am Ende des Beurteilungszeitraums*. |
| **OP-F19** | Reicht bei abweichenden Kriterien ein **Hinweis**, oder muss die Notenverteilung über die Klasse entfallen? | FA-67 AK-6 sieht einen Hinweis vor. Ob das genügt, ist eine pädagogische Frage, keine technische. Die Fortschreibung verschärft sie: Kleine Anpassungen wirken fort, die Teams driften über das Jahr auseinander – am Ende können drei deutlich verschiedene Kriteriensätze dastehen, ohne dass das je entschieden wurde. |
| **OP-F20** | Soll die Anwendung **melden**, wenn die Kriteriensätze der Teams zu weit auseinanderlaufen? | Eine Zahl dafür gibt es nicht von selbst. Denkbar: ein Hinweis, sobald sich die Sätze zweier Teams um mehr als n Kriterien unterscheiden. |

## 6 Folge für den Releaseplan

Der Umfang liegt über dem, was heute als 0.4.0 „Ergänzen" geplant ist. Vorschlag:

| Release | Inhalt |
|---|---|
| **0.4.0 „Planen"** | FA-66, FA-67, FA-68 und die Änderungen aus Kapitel 4 |
| **0.5.0 „Ergänzen"** | die bisherige 0.4.0: FA-38, NFA-08, FA-43, FA-44, FA-62, FA-63, FA-11 |

## 7 Empfehlung zur Reihenfolge

Den Testlauf **vorher** machen, nicht nachher. Die Planung je Team ist ein neuer
Schritt in der Bedienung – der erste, den du vor dem Bewerten machst. Wie er
aussehen soll, weiß ich besser, wenn du den jetzigen Ablauf einmal durchgeklickt
hast. Der Probebestand bleibt gültig; FA-68 AK-5 macht ihn sogar zum Prüfstein
der Umstellung.

## 8 Vorgemerkt: KO-Kriterien

Noch nicht beschrieben, nur festgehalten, damit es nicht verlorengeht:

> Werden bestimmte Kriterien nicht geliefert, ist der Sprint automatisch negativ
> zu beurteilen.

Zwei Hinweise vorab, weil sie die Entscheidungen oben berühren:

**Das Muster gibt es schon.** Die Sperre bei negativem Strang (FA-61) ist genau
das: eine Aussage *über* den Bestand, die keinen gespeicherten Wert verändert.
Ein KO-Kriterium würde ebenso wirken – der Prozentwert bleibt, was er ist, und
das Ergebnis lautet trotzdem negativ. Das ist ehrlicher, als eine 0 zu erzwingen
und damit die Rechnung zu verbiegen.

**Ein Feld mehr am Kriterium.** Ein Kriterium müsste tragen, dass es ein
KO-Kriterium ist, und ab welcher Punktezahl es als geliefert gilt. Das gehört in
die Struktur, die wir gerade ohnehin anfassen – wenn die Entscheidung bis zur
Umsetzung von 0.4.0 fällt, kostet sie fast nichts. Danach kostet sie eine weitere
Umstellung des Schemastands.

Offene Fragen, wenn wir so weit sind: Gilt das KO für den Sprint oder für den
ganzen Beurteilungszeitraum? Kann es nachträglich als erfüllt nachgereicht
werden? Und wie verhält es sich zum Notenstand, den die Lehrkraft ohnehin frei
setzen kann?

## 9 Vorlage „Vorbereitungssprint"

Festgelegt am 12.09.2026. Die sechs Ergebnisse sind deine Vorgabe; Punktezahlen,
Beschreibungen und die beiden anderen Kategorien sind mein Vorschlag.

### Team-Ergebnis · Gewicht 50 %

| Kriterium | Worauf geachtet wird | Punkte |
|---|---|---|
| Fachliches Konzept | Problem, Zielgruppe und Nutzen sind beschrieben; der fachliche Ablauf ist in eigenen Worten dargestellt, nicht aus der Aufgabenstellung abgeschrieben | 10 |
| Anforderungsspezifikation | Anforderungen als überprüfbare Sätze mit Akzeptanzkriterien; Muss und Kann unterschieden | 10 |
| Stakeholderanalyse | Beteiligte benannt, Interesse und Einfluss eingeschätzt, der Auftraggeber darunter | 6 |
| Solution-Design | Architekturüberblick, Datenmodell und die tragenden Entscheidungen mit Begründung | 10 |
| Versionsverwaltung | Repository eingerichtet, aussagekräftige Commits, Branch-Strategie vereinbart und eingehalten | 6 |
| CI/CD | Pipeline läuft: Bauen und Tests bei jedem Push, ein fehlgeschlagener Lauf wird bemerkt und behoben | 8 |

Summe 50 Punkte.

### Scrum-Prozess · Gewicht 15 %

Dieselben fünf Kriterien wie in der Sprint-Rubrik – Sprint Planning, Daily
Standup, Backlog-Pflege, Board und Transparenz, Retrospektive, je 5 Punkte.
Absichtlich unverändert: Sie werden in den zweiten Sprint mitgenommen, und ein
Bruch in der Benennung würde den Verlauf über das Jahr unlesbar machen. Das
Gewicht ist niedriger als später (15 statt 20 %), weil der Prozess im ersten
Sprint erst entsteht.

### Individueller Beitrag · Gewicht 35 %

Ebenfalls unverändert aus der Sprint-Rubrik: Umfang und Schwierigkeit,
Selbstständigkeit, Termintreue, Beitrag zum Team. In diesem Sprint bezieht sich
das auf Anteile an den Dokumenten statt am Code – die Kriterien tragen das, ohne
umformuliert zu werden.

### Peer · gedeckelte Korrektur

Unverändert die vier Fragen der Sprint-Rubrik. Ob im ersten Sprint überhaupt
peer-bewertet wird, ist wie immer zuschaltbar.

### Zwei Anmerkungen

**Das Gewicht wandert.** 50/15/35 gegenüber 45/20/35 im laufenden Sprint. Wenn
dir das zu fein ist, nimm 45/20/35 auch hier – dann ist die Vorlage in allem außer
den sechs Ergebnissen identisch mit der Sprint-Rubrik, und der Übergang wird noch
einfacher.

**Die KO-Kandidaten stehen schon da.** Versionsverwaltung und CI/CD sind die
beiden Kriterien, bei denen „nicht geliefert" nicht graduell ist: Entweder die
Pipeline läuft oder sie läuft nicht. Wenn ihr Kapitel 8 angeht, würde ich dort
anfangen.
