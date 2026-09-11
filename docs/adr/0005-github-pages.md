# ADR-005: Auslieferung über GitHub Pages

- **Status:** angenommen
- **Datum:** 2026-09-09
- **Bezug:** RB-03, RB-04, RB-06, ADR-001

## Kontext

RB-04 verlangt, dass jede Version über eine CI/CD-Pipeline für Tests deployed wird. Aus
ADR-001 folgt ein rein statisches Artefakt. Der Quellcode liegt ohnehin in GitHub (RB-03).

## Entscheidung

Die Pipeline veröffentlicht jeden Stand von `main` sowie jede Version `vX.Y.Z` nach GitHub
Pages. Diese Seite ist die Testumgebung, die der Auftraggeber ohne lokale Installation
prüfen kann.

Der Vite-Build verwendet `base: './'`, damit die Anwendung auch unter einem Unterpfad
(`https://<konto>.github.io/pre-syp-prp-bewertung/`) läuft.

## Folgen

**Positiv**

- Keine zusätzlichen Konten, keine Kosten, keine Zugangsdaten in der Pipeline.
- Testumgebung und Quellstand sind immer derselbe Commit.

**Negativ**

- Die veröffentlichte Seite ist öffentlich erreichbar, sobald das Repository öffentlich ist.
  Das ist unkritisch, weil die Anwendung keine Daten enthält – die Daten entstehen erst im
  Browser der Lehrkraft. Bei einem privaten Repository ist GitHub Pages nur mit
  kostenpflichtigem Plan nutzbar; dann tritt eine Alternative an diese Stelle.
- Kein serverseitiges Routing; die Anwendung kommt deshalb ohne URL-Routen aus.
