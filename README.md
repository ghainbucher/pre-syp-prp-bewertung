# PRE/SYP-PRP-Bewertung

Kriteriengeleitete Bewertung von Schüler-Softwareprojekten, die in Sprints entwickelt werden.
Team-Ergebnis, Scrum-Prozess, individueller Beitrag und Peer-Einschätzung werden je Sprint
erfasst, gewichtet zu einem Prozentwert verrechnet und über einen frei einstellbaren
Notenschlüssel zu einer Note geführt.

**Version 0.1.0** · Status: in Entwicklung

---

## Dokumente

| Dokument | Inhalt |
|---|---|
| [`docs/fachkonzept-unterricht.md`](docs/fachkonzept-unterricht.md) | Fachliches Konzept des Unterrichts – Kompetenzmodell, Sprintablauf, Beurteilung |
| [`docs/stakeholder.md`](docs/stakeholder.md) | Wer betroffen ist, woran Zufriedenheit erkennbar ist, welche Zielkonflikte entschieden sind |
| [`docs/product-goal.md`](docs/product-goal.md) | Wozu es das Produkt gibt und woran das Ziel als erreicht gilt |
| [`docs/anforderungen.md`](docs/anforderungen.md) | Anforderungsdokument – *was* die Software leisten muss |
| [`docs/risiken.md`](docs/risiken.md) | Was schiefgehen kann, wie schwer es wiegt, was dagegen getan wird |
| [`docs/anforderungs-und-loesungsmanagement.md`](docs/anforderungs-und-loesungsmanagement.md) | Wie Anforderungen formuliert, abgelegt, verknüpft und aktuell gehalten werden |
| [`docs/solution-design.md`](docs/solution-design.md) | Technisches Konzept – *wie* sie es tut |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Was sich je Version geändert hat |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branches, Commits, Versionen, Ablauf eines Releases |
| [`docs/adr/`](docs/adr/) | Architekturentscheidungen mit Begründung |

Die Dokumente bauen aufeinander auf:

```
Stakeholderanalyse ─┐
                    ├─→ Product Goal ─→ Anforderungen ─→ Solution Design ─→ Code + Tests
Fachkonzept ────────┘                        ↑
                       Risikoanalyse ────────┘  (fordert Maßnahmen)
```

Jedes trägt einen Aktualitätskopf und wird versioniert geführt; `npm run dokumente` prüft,
ob die Ketten dazwischen geschlossen sind.

---

## Schnellstart

Voraussetzung: Node.js 20.19 oder neuer.

```bash
npm ci          # Abhängigkeiten installieren
npm run dev     # Entwicklungsserver, http://localhost:5173
npm run pruefen # Lint, Typprüfung, Unit-Tests und Build in einem Lauf
```

Weitere Befehle:

| Befehl | Wirkung |
|---|---|
| `npm test` | Unit-Tests |
| `npm run coverage` | Unit-Tests mit Abdeckungsbericht |
| `npm run e2e` | End-to-End-Tests (Playwright, baut vorher) |
| `npm run dokumente` | Prüft Aktualität und Verknüpfung der geführten Dokumente |
| `npm run build` | Produktionsbuild nach `dist/` |
| `npm run preview` | Produktionsbuild lokal ansehen |

---

## Aufbau

```
src/
  domain/     Datenmodell und Berechnung – ohne React, ohne Browser, vollständig getestet
  store/      Zustandsänderungen (Reducer) und Persistenz im localStorage
  export/     CSV-Ausgabe
  ui/         wiederverwendete Bausteine und Oberflächenzustand
  ansichten/  die vier Bereiche: Bewerten, Auswertung, Klassen & Teams, Rubrik
e2e/          Durchstiche mit Playwright
docs/         Anforderungen, Solution-Design, Changelog, Entscheidungen
.github/      CI- und Deploy-Pipeline
```

Die Schichtregel lautet: `domain` kennt niemanden, `store` kennt `domain`, `ansichten`
kennen beide. Dadurch bleibt die Notenberechnung ohne Oberfläche prüfbar.

---

## Datenschutz

Die PRE/SYP-PRP-Bewertung verarbeitet Namen von Schülerinnen und Schülern sowie Leistungsbewertungen.
Alle Daten bleiben im Browser des verwendeten Geräts (`localStorage`); es gibt keinen Server
und keine Übertragung an Dritte. Der End-to-End-Test prüft, dass während der Bedienung kein
Netzwerkaufruf nach außen erfolgt.

Die Sicherungsdatei (`Sicherung speichern`) enthält Klartext und ist wie eine Notenliste zu
behandeln. Über `Alle Daten löschen` lässt sich der Bestand vollständig entfernen.

---

## Einrichtung des Repositories

Beim ersten Mal:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\repo-einrichten.ps1
```

Das Skript kopiert die beiden Pipeline-Dateien aus `scripts/workflows/` nach
`.github/workflows/`, legt die Git-Historie an, erzeugt den ersten Commit und setzt die Tags
`v0.1.0`, `docs/anforderungen-v0.1` und `docs/solution-design-v0.1`. Anschließend gibt es die
Befehle für `git remote add` und `git push` aus.

> Die Pipeline-Dateien liegen zunächst unter `scripts/workflows/`, weil GitHub-Actions-Dateien
> aus Sicherheitsgründen nicht aus der Ferne in `.github/workflows/` geschrieben werden dürfen.
> Nach dem ersten Lauf des Skripts liegen sie am richtigen Platz und werden dort gepflegt.

## Auslieferung

Jeder Stand auf `main` wird von der Pipeline nach GitHub Pages veröffentlicht und dient dort
als Testumgebung. Einmalig einzurichten: **Settings → Pages → Source: GitHub Actions**.

---

## Vorgeschichte

Version 0.1 des Konzepts entstand als lauffähiger Prototyp in einem Claude-Artifact. Er
diente als Grundlage für das Anforderungsdokument und wird von dieser Fassung abgelöst.
