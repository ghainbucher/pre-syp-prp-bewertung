# Arbeitsweise im Projekt

Diese Konventionen setzen die Rahmenbedingungen RB-01 bis RB-04 um. Sie sind bewusst so
gewählt, dass sie auch als Beispiel im Unterricht taugen.

## Branches

| Branch | Zweck |
|---|---|
| `main` | jederzeit lauffähig, geschützt, wird automatisch veröffentlicht |
| `feature/FA-xx-kurzbeschreibung` | Umsetzung einer Anforderung |
| `fix/kurzbeschreibung` | Fehlerbehebung |
| `docs/kurzbeschreibung` | Änderung an Anforderungen oder Solution-Design |

Direkte Pushes auf `main` sind unterbunden. Änderungen kommen über einen Pull Request, der
erst zusammengeführt wird, wenn die Pipeline grün ist.

**Einmalig einzurichten** (Settings → Branches → Add rule für `main`):

- Require a pull request before merging
- Require status checks to pass: `Lint, Typen, Unit-Tests, Build` und `End-to-End-Tests`
- Require branches to be up to date before merging

## Commits

Nach *Conventional Commits*, mit der Nummer der Anforderung im Text:

```
feat(bewertung): Peer-Matrix je Bewertendem erfassen (FA-14)
fix(auswertung): leere Sprints nicht als 0 werten (FA-24)
docs(anforderungen): Rahmenbedingung RB-07 ergänzt
test(domain): Grenzfälle des Notenschlüssels abgedeckt
chore(ci): Playwright auf Firefox ausgeweitet
```

Erlaubte Typen: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build`, `ci`.

## Versionen

Semantische Versionierung `MAJOR.MINOR.PATCH`:

| Erhöhung | Anlass |
|---|---|
| MAJOR | Änderung, die einen bestehenden Datenbestand ohne Migration unbrauchbar macht |
| MINOR | neue Funktion aus dem Anforderungsdokument |
| PATCH | Fehlerbehebung, Text- oder Darstellungskorrektur |

Die Dokumente haben eigene Versionen (`0.1`, `1.0`, `1.1` …) und eigene Tags
(`docs/anforderungen-v1.0`, `docs/solution-design-v1.0`).

## Ein Release erstellen

1. `docs/CHANGELOG.md` ergänzen: neue Version, Datum, Änderungen.
2. `version` in `package.json` anheben.
3. Commit: `chore(release): v0.2.0`.
4. Tag setzen und schieben:
   ```bash
   git tag -a v0.2.0 -m "PRE/SYP-PRP-Bewertung 0.2.0"
   git push origin main --follow-tags
   ```
5. Die Pipeline baut und testet beide Läufe. Der Lauf für `main` veröffentlicht die Seite auf
   GitHub Pages, der Lauf für den Tag legt das GitHub-Release an. Ein Tag schiebt **nicht**
   nach Pages – die Umgebung `github-pages` lässt nur `main` zu, und zweimal denselben Commit
   zu veröffentlichen brächte ohnehin nichts.

## Issues

Das Issue ist das **Arbeitspaket**, die Anforderung steht im Dokument. Beide werden nicht
vermischt – Begründung und Aufbau stehen im
[Anforderungs- und Lösungsmanagement](docs/anforderungs-und-loesungsmanagement.md), Kapitel 5.

- Titel: `FA-32 Bewertungsbegründung je Person`
- Labels: Art (`anforderung`, `fehler`, `dokumentation`) und Priorität (`prio:muss` …)
- Milestone: das Release, in dem es umgesetzt wird
- Im Text: Verweis auf den Abschnitt im Anforderungsdokument, dann die Aufgaben als
  Haken – **nur die AK-Nummern, nicht ihren Text**
- Im Pull Request: `Closes #12`

Vorlagen liegen unter `scripts/github/ISSUE_TEMPLATE/` und werden vom Einrichtungsskript
nach `.github/ISSUE_TEMPLATE/` kopiert. Labels und Milestones: `scripts/github/labels.md`.

## Dokumente aktuell halten

`npm run dokumente` prüft die Ketten zwischen den geführten Dokumenten und läuft in der
Pipeline mit:

- **hart** – jede umgesetzte Anforderung wird von einem Test genannt (oder nennt ein anderes
  Prüfverfahren), jede Anforderung nennt Stakeholder und Nutzen, jedes Risiko nennt eine
  Maßnahme mit Verweis;
- **weich** – Aktualitätskopf veraltet oder länger als ein Sprint nicht geprüft.

Gerissene Ketten brechen den Lauf, Fristen warnen nur. Ein inhaltlicher Fehler soll
aufhalten; ein Terminproblem soll nicht dazu führen, dass an einem ungünstigen Tag nichts
mehr zusammengeführt werden kann.

## Definition of Done

Eine Anforderung gilt als umgesetzt, wenn:

- [ ] die Funktion der Beschreibung im Anforderungsdokument entspricht,
- [ ] die dort genannten Akzeptanzkriterien durch Tests abgedeckt sind,
- [ ] die Anforderungs-ID im Commit und im Testnamen steht,
- [ ] Lint, Typprüfung, Unit- und E2E-Tests grün sind,
- [ ] `npm run dokumente` ohne Fehler durchläuft,
- [ ] das Solution-Design bei abweichender Umsetzung nachgezogen wurde,
- [ ] `docs/CHANGELOG.md` einen Eintrag unter „Unveröffentlicht“ hat,
- [ ] am Sprintende geprüft wurde, ob eines der geführten Dokumente nachzuziehen ist,
- [ ] der Pull Request angibt, welche Teile wesentlich mit KI entstanden sind und wie sie
      geprüft wurden (Fachkonzept 9.1 – Angabe, keine Bewertung).

## Fehler melden

Ein Fehler wird zuerst als fehlschlagender Test abgebildet und erst dann behoben. So bleibt
er behoben.
