# Entwurf: Acht Sichten entlang des Unterrichts

Stand 12.09.2026 · Entwurf zur Entscheidung · betrifft docs/anforderungen.md
Kapitel 10 und das Kapitel „Bewertung erfassen"

## 1 Anlass

Aus dem Gespräch vom 12.09.2026, in deinen Worten:

- „Wir sollten die Punkte Planning, Daily (wenn überhaupt bewertet) und
  Sprintplanning/Sprintreview in drei eigene Sichten geben. Diese bauen
  aufeinander auf." — Planning ist dabei ein Synonym für Sprintplanning.
- Das Daily ist **nicht** abschaltbar, wird aber oft nicht bewertet: „eigentlich
  nur negativ, wenn nichts überlegt wurde". Daran wird jetzt nichts geändert.
- „Ein Abschnitt im Projekt ist ein Sprint, der beim Sprintplanning entsteht."
- „Tests muss ich festlegen, klar."
- Die Diplomarbeitsvorbereitung läuft **das ganze Jahr parallel** wegen der
  Themensuche; erst ihre Aufbereitung erfolgt nach dem Projekt. Sie bekommt eine
  eigene Sicht.

## 2 Die acht Bereiche

| | Bereich | was darin geschieht |
|---|---|---|
| 1 | **Klassen & Teams** | Stammdaten. Unverändert, minus dem Anlegen von Sprints |
| 2 | **Sprintplanning** | Ein Sprint entsteht. Ziel, Zeitraum, Kriterienauswahl je Team |
| 3 | **Daily** | Was während des Sprints beobachtet wird |
| 4 | **Sprintreview** | Der Sprint wird beurteilt: Punkte, Peer, Verstehensnachweis, Rückmeldung |
| 5 | **Diplomarbeitsvorbereitung** | Läuft ganzjährig neben den Sprints |
| 6 | **Tests** | Werden festgelegt und erfasst. Unverändert, nur als eigener Bereich |
| 7 | **Auswertung** | Unverändert |
| 8 | **Rubrik & Notenschlüssel** | Unverändert |

„Bewerten" entfällt als eigener Bereich; seine Inhalte verteilen sich auf 2 bis 6.

## 3 Was ich dabei interpretiert habe

Zwei Stellen sind meine Auslegung deiner Worte, nicht deine Worte. Wenn eine
davon falsch ist, ändert sich der Entwurf erheblich:

**Die drei Sichten folgen dem Zeitpunkt der Beobachtung, nicht der Kategorie.**
Du hast von „den Punkten Planning, Daily und Sprintreview" gesprochen — das sind
drei Kriterien der Kategorie Scrum-Prozess. Ich lese daraus: Diese Kriterien
werden zu verschiedenen Zeiten beobachtet und sollen deshalb zu diesen Zeiten
erfasst werden, statt am Sprintende gemeinsam in einem Formular. Das erklärt auch
„bauen aufeinander auf": Wer das Planning gesehen hat, beurteilt das Daily
anders, und wer beides gesehen hat, das Review.

**Die Kategorien bleiben, wie sie sind.** Team-Ergebnis, Scrum-Prozess,
individueller Beitrag und Peer ändern sich nicht; nur der **Ort** der Erfassung
wandert. Ein Kriterium gehört weiterhin zu genau einer Kategorie und wird
weiterhin genauso gerechnet.

## 4 Neue Anforderungen

### FA-70 Sprintplanning als eigene Sicht

`Muss` · 0.5.0 · SH-1, SH-2 · geplant

Als Lehrkraft
möchte ich einen Sprint dort anlegen, wo ich ihn plane,
damit die Reihenfolge in der Anwendung der Reihenfolge im Unterricht entspricht.

- **AK-1** Ein Sprint **entsteht in dieser Sicht**, nicht mehr unter „Klassen &
  Teams". Nummer und Bezeichnung werden dabei vorgeschlagen.
- **AK-2** Je Team werden Ziel, Beginn, Ende und die geltenden Kriterien erfasst
  (FA-66, FA-67) — das ist der Inhalt der heutigen Planungskarte.
- **AK-3** Das Kriterium „Sprint Planning" wird hier beurteilt, nicht am
  Sprintende: Es wird hier beobachtet.
- **AK-4** Das Kriterienblatt für die Klasse (FA-39) wird hier ausgegeben. Es
  gehört an den Anfang des Sprints, nicht an sein Ende.
- **AK-5** Solange ein Sprint nur geplant und nicht beurteilt ist, erscheint er
  in der Auswertung als „läuft", nicht als unbewertet.

### FA-71 Daily als eigene Sicht

`Soll` · 0.5.0 · SH-1, SH-2 · geplant

Als Lehrkraft
möchte ich während des Sprints festhalten, was mir im Daily auffällt,
damit ich es am Sprintende nicht aus dem Gedächtnis rekonstruieren muss.

- **AK-1** Die Sicht zeigt den laufenden Sprint je Team und erlaubt das Erfassen
  des Kriteriums „Daily Standup".
- **AK-2** Sie ist **nicht abschaltbar**, aber ein leeres Feld bleibt „nicht
  bewertet" — das Daily wird oft nicht beurteilt, und das ist kein Mangel.
- **AK-3** Notizen je Team und je Person (FA-16, FA-17) sind hier erreichbar:
  Was im Daily auffällt, ist meist eine Beobachtung und keine Punktzahl.
- **AK-4** **Noch nicht Gegenstand dieser Anforderung:** die einseitige
  Bewertung — „nur negativ, wenn nichts überlegt wurde". Sie ist ausdrücklich
  später dran und steht als OP-F22.

### FA-72 Sprintreview als eigene Sicht

`Muss` · 0.5.0 · SH-1, SH-2 · geplant

Als Lehrkraft
möchte ich den Sprint dort beurteilen, wo ich ihn abschließe,
damit Planung, Beobachtung und Beurteilung nicht in einem Formular verschwimmen.

- **AK-1** Hier werden Team-Ergebnis, individueller Beitrag, die übrigen
  Prozesskriterien, Peer-Werte, Verstehensnachweis, Reflexion und Rückmeldung
  erfasst — der heutige Inhalt der Bewerten-Sicht ohne Planung und Daily.
- **AK-2** Was in Planning und Daily bereits erfasst wurde, ist hier **sichtbar,
  aber als dort erfasst gekennzeichnet**; es wird nicht doppelt abgefragt.
- **AK-3** Die Nachfrage zur Peer-Bewertung (FA-53) steht hier, weil sie an das
  Ende einer Sprintbeurteilung gehört.
- **AK-4** Die offenen Rückmeldungen (FA-42 AK-4) werden hier genannt.

### FA-73 Diplomarbeitsvorbereitung als eigene Sicht

`Muss` · 0.5.0 · SH-1, SH-4 · geplant

Als Lehrkraft
möchte ich die Diplomarbeitsvorbereitung ganzjährig neben den Sprints führen,
damit die Themensuche über das Jahr belegbar ist und nicht erst am Ende auffällt.

- **AK-1** Sie ist **kein Abschnitt in der Sprintreihe**, sondern läuft parallel:
  eine eigene Sicht, ein eigener Zeitraum über das Schuljahr.
- **AK-2** Erfasst wird nach der Rubrik „Diplomarbeitsvorbereitung" (FA-56), je
  Team und je Person wie bisher.
- **AK-3** Ihr Ergebnis geht wie bisher in den Praxisstrang ein.
- **AK-4** Für den Zeitfaktor (FA-54) zählt sie **nicht** als Glied der
  Sprintreihe: Etwas Ganzjähriges hat keine zweite Hälfte. Wie sie stattdessen
  gewichtet wird, ist offen — siehe OP-F23.
- **AK-5** Die Aufbereitung des Themas nach Projektende ist ein eigener
  Zeitabschnitt innerhalb dieser Sicht, keine eigene Sicht.

### FA-74 Tests als eigene Sicht

`Soll` · 0.5.0 · SH-1 · geplant

Als Lehrkraft
möchte ich Tests dort festlegen und erfassen, wo sie hingehören,
damit sie nicht in derselben Leiste stehen wie die Sprints.

- **AK-1** Tests werden hier angelegt, angekündigt (§ 8 LBVO) und erfasst —
  inhaltlich unverändert gegenüber FA-60.
- **AK-2** Sie erscheinen nicht mehr in einer gemeinsamen Abschnittsleiste mit
  den Sprints.

## 5 Geänderte Anforderungen

| Anforderung | Änderung |
|---|---|
| **FA-34** „Vier Bereiche" | Hinfällig. Neu zu fassen als acht Bereiche. Der Durchstich zählt heute genau vier und muss mit |
| **FA-04** Sprints verwalten | Das Anlegen wandert von „Klassen & Teams" ins Sprintplanning (FA-70 AK-1). Ändern und Löschen bleiben erreichbar |
| **FA-56** Diplomarbeitsvorbereitung | Sie ist kein Abschnitt am Ende der Reihe mehr, sondern ganzjährig (FA-73). AK-4 zur Zuordnung in einen Beurteilungszeitraum ist davon berührt |
| **FA-60** Tests | Unverändert im Inhalt, neuer Ort (FA-74) |
| **FA-66/FA-67** | Unverändert im Inhalt; die Planungskarte wird zur Sicht |

Unberührt bleibt das **Rechenmodell**. Alle Umstellungen dieses Entwurfs
betreffen die Oberfläche; Kategorien, Gewichte, Stränge, Zeitfaktor, Sperre und
Notenfindung bleiben, wie sie sind. Das ist kein Zufall, sondern die Absicherung:
Eine Oberflächenänderung, die Noten verschiebt, wäre keine Oberflächenänderung.

## 6 Offene Punkte

| | Frage |
|---|---|
| **OP-F22** | Die einseitige Bewertung des Daily — „nur negativ, wenn nichts überlegt wurde". Vom Auftraggeber ausdrücklich vertagt. Verwandt mit den KO-Kriterien (OP-F21): beides sind Kriterien, die nur in eine Richtung wirken |
| **OP-F23** | Wie wird die ganzjährige Diplomarbeitsvorbereitung im Zeitfaktor behandelt? Sie hat keine zweite Hälfte. Denkbar: fester Faktor, oder Zuordnung zu der Hälfte, in der ihr Abschluss liegt |
| **OP-F24** | Ist eine Reiterleiste bei acht Bereichen noch die richtige Form? Vier passen in eine Zeile, acht nicht ohne Weiteres |
| **OP-F25** | Bleibt „Abschnitt" als Oberbegriff in der Oberfläche, wenn Sprints, Tests und Diplomarbeitsvorbereitung getrennte Sichten haben? Im Datenmodell bleibt er in jedem Fall |

## 7 Was das kostet und in welcher Reihenfolge

Das ist eine größere Umstellung als Schemastand 3 — aber eine **flachere**: Sie
fasst die Oberfläche neu, ohne das Modell anzufassen. Vorschlag:

| Schritt | Inhalt |
|---|---|
| 1 | FA-34 neu fassen und die Navigation auf acht Bereiche umstellen, Inhalte zunächst unverändert verschoben |
| 2 | FA-70 Sprintplanning, einschließlich Anlegen des Sprints |
| 3 | FA-72 Sprintreview |
| 4 | FA-71 Daily |
| 5 | FA-73 Diplomarbeitsvorbereitung — als Letztes, weil OP-F23 vorher entschieden sein sollte |
| 6 | FA-74 Tests |

Schritt 1 zuerst, weil er allein schon prüfbar ist und die übrigen sonst
gegeneinander laufen.

Und eine Empfehlung, die ich schon zweimal ausgesprochen habe und die hier noch
mehr gilt: **Bevor das gebaut wird, einmal mit dem Bestehenden arbeiten.** Diese
acht Sichten sind eine Antwort auf ein Gefühl beim Ansehen. Was beim Benutzen
auffällt, kann die Aufteilung noch einmal verschieben — und dann wäre sie zweimal
gebaut.
