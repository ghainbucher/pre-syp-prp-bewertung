# ADR-011: Automatische Sicherung über die File System Access API, als Zusatzfunktion

- **Status:** angenommen
- **Datum:** 2026-09-10
- **Bezug:** FA-64, FA-46, FA-33, DS-06, NFA-03, NFA-05; Risiko R-01 (kritisch)

## Kontext

Der Datenbestand liegt im `localStorage` eines Browserprofils. Sein Verlust ist das kritische
Risiko dieses Projekts (R-01): Ein gelöschtes Browserprofil kostet die Bewertungen eines
ganzen Durchgangs. Die Gegenmaßnahme ist eine Sicherungsdatei – und die hängt bisher an einer
Gewohnheit.

Der Auftraggeber hat die tägliche Sicherung in den schulischen Speicher festgelegt und
gefragt, warum sie nicht automatisch erfolgt.

Die Antwort ist zunächst: weil ein Browser das nicht darf. Eine Webseite kann nicht im
Hintergrund an einen festen Ort schreiben; sonst könnte es jede besuchte Seite. Ohne Backend
oder installierte Anwendung gibt es kein unbeaufsichtigtes Sichern.

Die **File System Access API** kommt nahe heran: Ein einmal gewählter Verzeichnis-Handle
lässt sich in IndexedDB behalten, und danach schreibt die Anwendung ohne Dialog in diesen
Ordner. Nach einem Neuladen ist die Schreibberechtigung einmal je Sitzung zu bestätigen. Die
API gibt es nur in Chromium-Browsern; Firefox und Safari unterstützen sie in keiner Version.

## Entscheidung

Die automatische Sicherung wird umgesetzt (FA-64) – als **Zusatzfunktion**, nicht als
Grundlage. Wo die API fehlt, bleibt es beim manuellen Export samt Erinnerung (FA-33, FA-46),
und die Anwendung sagt das, statt die Funktion anzubieten und scheitern zu lassen.

NFA-05 wird dafür gelockert: Einzelne Zusatzfunktionen dürfen an Schnittstellen hängen, die
nicht überall vorhanden sind, solange die Anwendung ohne sie vollständig bedienbar bleibt.

Der Zeitpunkt der letzten **erfolgreichen** Sicherung gehört dauerhaft in die Oberfläche.

## Folgen

**Positiv**

- Die wirksamste Einzelmaßnahme gegen R-01. Ein Verlust kostet dann Minuten statt eines
  Sprints, und er hängt nicht mehr an einer Gewohnheit.
- Liegt der gewählte Ordner im schulischen Sync-Ordner, erfüllt sich DS-06 von selbst –
  ohne dass jemand daran denken muss, wohin die Datei gehört.
- NFA-03 bleibt unberührt: geschrieben wird eine lokale Datei, kein Netzwerkaufruf. Dass ein
  Sync-Client den Ordner spiegelt, geschieht außerhalb der Anwendung.

**Negativ**

- Die Anwendung verhält sich in Chrome und Edge anders als in Firefox. Das ist genau die Art
  von Unterschied, die später zu „bei mir geht das nicht“ führt; deshalb muss die Anwendung
  den Unterschied benennen, statt ihn zu verschweigen.
- Ein Klick je Sitzung bleibt nötig. „Automatisch“ heißt hier: automatisch nach dem ersten
  Klick, nicht ohne ihn.
- **Eine automatische Sicherung, die still fehlschlägt, ist schlechter als gar keine** – sie
  erzeugt Sicherheit, wo keine ist. Der sichtbare Zeitstempel und die verschärfte Meldung bei
  Fehlschlag sind deshalb nicht Beiwerk, sondern der Kern der Anforderung.
- Zwei Wege zur Sicherung heißen zwei Wege, die zu prüfen sind, und ein Testlauf ohne die API.
