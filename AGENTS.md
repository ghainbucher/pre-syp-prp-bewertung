# PRE/SYP-PRP-Bewertung – Vorgaben für KI-Werkzeuge

**Diese Datei ist die verbindliche Quelle.** `CLAUDE.md` und
`.github/copilot-instructions.md` verweisen nur hierher; es gibt genau einen Text, der
gepflegt wird. Wer eine der Zeigerdateien ändert statt dieser, erzeugt zwei Wahrheiten – und
dann streiten zwei Werkzeuge im selben Repository mit Berufung auf verschiedene Regeln.

`AGENTS.md` ist der werkzeugübergreifende De-facto-Standard: Codex, Cursor, GitHub Copilot,
Gemini CLI, Windsurf, Zed, Aider und VS Code lesen ihn von sich aus. Claude Code liest
`CLAUDE.md`, Copilot zusätzlich `.github/copilot-instructions.md` – deshalb die zwei Zeiger.
Kommt ein Werkzeug dazu, das keinen davon kennt (etwa Windsurf mit `.windsurfrules`), wird ein
weiterer Zeiger angelegt und **nicht** der Inhalt kopiert. Zeiger statt Symlinks, weil Symlinks
unter Windows eine gesonderte Einstellung brauchen.

Die Copilot-Zeigerdatei wird aus `scripts/github/copilot-instructions.md` nach `.github/`
kopiert (`scripts/repo-einrichten.ps1`) – wie die Workflow- und Issue-Vorlagen, weil Dateien
unter `.github` nicht aus der Ferne geschrieben werden dürfen. Geändert wird die Datei unter
`scripts/github/`, sonst geht die Änderung beim nächsten Einrichten verloren.

**Was hier nicht hineingehört:** nichts Vertrauliches. Der Inhalt dieser Datei wird von den
Werkzeugen an ihre Anbieter übertragen, bei jedem Aufruf. Und nicht das Anforderungsdokument –
diese Datei **zeigt** darauf, sie ersetzt es nicht. Lange Vorgabedateien werden verdünnt und
dann übergangen.

**Grenze der Wirkung:** Diese Vorgaben erreichen nur eine KI, die *im Repository* läuft. Wer
Code in ein Browser-Chatfenster einfügt, arbeitet ohne sie. Die Datei senkt die Fehlerquote,
sie setzt nichts durch – durchgesetzt wird im Pull Request und im Review.

---

Die PRE/SYP-PRP-Bewertung ist eine Webanwendung, mit der eine Lehrkraft Schüler-Softwareprojekte bewertet,
die in Sprints entwickelt werden. Auftraggeber und einziger Anwender ist Gerald Hainbucher.

**Sprache:** Alles auf Deutsch – Oberfläche, Kommentare, Commit-Nachrichten, Dokumente und
auch die Bezeichner im Code (`sprintErgebnis`, `bewertungsIndex`, `Punktefeld`). Englische
Fachbegriffe bleiben englisch, wo sie Fachbegriffe sind (Sprint, Backlog, Retrospektive,
Reducer, Props).

---

## Zuerst lesen

| Datei | Wofür |
|---|---|
| `docs/fachkonzept-unterricht.md` | Der Unterricht, für den das Werkzeug da ist: Kompetenzmodell, Sprintablauf, Beurteilung. |
| `docs/zusammenarbeit-mit-ki.md` | Teamarbeit, Anforderungsarbeit und Repository-Ablauf, wenn jeder eine KI im Hintergrund hat. Didaktische Grundlage, keine Anforderung – noch in Diskussion. |
| `docs/stakeholder.md` | Wer betroffen ist, woran Zufriedenheit erkennbar ist, welche Zielkonflikte entschieden sind. |
| `docs/product-goal.md` | Wozu es das Produkt gibt. Jede Anforderung muss sich daran messen lassen. |
| `docs/anforderungen.md` | Was die Software leisten muss. Jede Anforderung hat eine ID (FA-xx, NFA-xx, DS-xx). |
| `docs/risiken.md` | Was schiefgehen kann und welche Anforderung etwas dagegen tut. |
| `docs/testfaelle-notenfindung.md` | Neun Verläufe mit erwarteten Werten – die Vorgabe für die Gewichtungstests. |
| `docs/anforderungs-und-loesungsmanagement.md` | Wie Anforderungen formuliert, abgelegt und aktuell gehalten werden. |
| `docs/solution-design.md` | Wie sie es tut: Architektur, Datenmodell, Formeln, Teststrategie. |
| `docs/adr/` | Warum es so und nicht anders ist. |
| `CONTRIBUTING.md` | Branches, Commits, Versionen, Issues, Definition of Done. |

**Nie Code schreiben, ohne die betroffene Anforderung gelesen zu haben.** Die
Akzeptanzkriterien dort sind die Vorgabe – nicht die Formulierung im Chat.

Wenn eine Anfrage im Widerspruch zum Anforderungsdokument steht: nachfragen, nicht
stillschweigend das Dokument überstimmen. Ändert sich die Anforderung, ändert sich zuerst
das Dokument (neue Version, Änderungshistorie), dann der Code.

### Format einer Anforderung

Funktionale Anforderungen stehen in der Satzschablone – verpflichtend, auch wenn es nur
wenige Rollen gibt:

```markdown
### FA-32 Titel

`Soll` · 0.2.0 · SH-2, SH-4 · geplant

Als ‹Rolle›
möchte ich ‹Ziel›,
damit ‹Nutzen›.

- **AK-1** Gegeben … wenn … dann …
```

Die Kopfzeile ist `Priorität` · Release · Stakeholder · Status und wird maschinell gelesen –
wer ihre Form bricht, bricht den Prüflauf. Nicht-funktionale Anforderungen tragen statt der
Schablone einen Aussagesatz und eine Zeile `**Prüfung:** …`.

**Der Story-Text steht nur im Dokument.** GitHub Issues sind Arbeitspakete und verweisen
darauf; sie kopieren keine Akzeptanzkriterien.

**IDs werden nie wiederverwendet und nie umnummeriert.** Eine entfallene Anforderung bekommt
den Status `entfallen` und bleibt stehen.

---

## Architektur: die Schichtregel

```
domain/     kennt niemanden – kein React, kein Browser, keine Seiteneffekte
store/      kennt domain
export/     kennt domain
ui/         kennt domain und store
ansichten/  kennt alles darunter
```

Umgekehrte Abhängigkeiten sind unzulässig. Der Grund steht in NFA-06: Nur so bleibt die
Notenberechnung ohne Oberfläche prüfbar. Wenn eine Berechnung in einer Komponente landet,
ist das ein Fehler, kein Abkürzungsweg.

**Komponenten rechnen nicht.** Sie rufen `domain/scoring.ts` auf und stellen dar.

---

## Fachliche Regeln, die leicht verletzt werden

Diese vier Punkte sind der häufigste Weg, das Modell kaputtzumachen:

1. **Ein leeres Feld ist „nicht bewertet“, nicht 0 Punkte.** Leere Werte werden gar nicht
   erst gespeichert (Schlüssel fehlt im Objekt). Nie mit `?? 0` auffüllen.
2. **Fehlende Kategorien werden aus der Gewichtung herausgerechnet**, nicht als 0 gewertet
   (ADR-004). Das gilt auch für einzelne Kriterien innerhalb einer Kategorie.
3. **Keine Netzwerkaufrufe.** Die Anwendung ist rein clientseitig (ADR-001, NFA-03). Kein
   `fetch`, keine Analytics, keine externen Schriften, keine CDN-Einbindung. Ein E2E-Test
   prüft das.
4. **Kriterien-IDs sind stabil.** Beim Umbenennen eines Kriteriums bleibt die ID – sonst
   verlieren erfasste Punkte ihren Bezug.
5. **Ein bewerteter Abschnitt rechnet mit seiner eingefrorenen Rubrik**, nie mit der
   aktuellen (FA-65). Immer `rubrikKopie ?? rubrik(rubrikId)`. Der Fehler ist von außen
   unsichtbar und fällt erst auf, wenn eine Belegfassung die falschen Kriterien zeigt.

---

## Strukturfragen: zuerst Modell und Attrappe, dann Anforderung

Eine Anforderung soll eine Entscheidung **festhalten**, nicht eine herbeiführen. Wo noch
nicht entschieden ist, sind Akzeptanzkriterien geraten – und Raten kostet mehr als Fragen.

**Woran eine Strukturfrage zu erkennen ist:** Es geht darum, *wo etwas hingehört*, *was zu
was gehört* oder *was man gleichzeitig sehen muss*. Beispiele: „Team oder Projekt?", „Hängt
der Sprint an der Klasse?", „Welche Bereiche hat die Oberfläche?", „Gehört das auf eine
Seite?".

**Dann in dieser Reihenfolge:**

1. **Zurückspiegeln, was die Änderung im Datenmodell auslöst** – ein ERD (Mermaid) und die
   Liste dessen, was wegfällt. Der Auftraggeber findet Fehler im Modell in Minuten; in einer
   Anforderung findet sie niemand.
2. **Eine klickbare Attrappe**, wenn es um Sichten geht. Eine Anordnung beurteilt man durch
   Anschauen, nicht durch Lesen. Erfundene Namen (DS-01), keine Rechnung, deutlich als
   Attrappe gekennzeichnet.
3. **Erst danach die Anforderung** – sie hält fest, was entschieden wurde.
4. **Dann Code.**

**Warum das hier steht:** Am 13.09.2026 sind sieben Anforderungen und ein ADR entstanden,
bevor irgendjemand eine Sicht gesehen hatte. Die Antwort des Auftraggebers war „das war
leider nicht das, was ich wollte". Am 14.09.2026 hat dieselbe Frage mit ERD und Attrappe in
einem Vormittag gehalten. Der Unterschied war nicht der Aufwand, sondern die Reihenfolge.

**Zwei Warnzeichen, bei denen die Reihenfolge schon verletzt ist:**

- Mehrere Anforderungen hintereinander handeln davon, *wo* etwas steht. Dann ist nicht die
  einzelne Sicht offen, sondern die Ordnung. Aufhören zu schreiben und fragen.
- Eine bestehende Struktur wird als entschieden behandelt, weil sie schon Code ist. Laufender
  Code ist eine Annahme, die sich bewährt hat – keine Festlegung.

### Eine Aussage des Auftraggebers sortieren

Der Auftraggeber redet in ganzen Sätzen, nicht vorsortiert. **Das Sortieren ist Aufgabe der
KI** – aber nie stillschweigend: Die Einordnung ist eine Auslegung, und eine falsche fällt
nicht auf. Also sortieren, das Ergebnis in einer Zeile je Aussage vorlegen, widersprechen
lassen, dann ablegen.

Ein Satz hat oft Anteile für **drei** Ziele. Zwei Fragen entscheiden:

1. **Wäre der Satz auch ohne die Software wahr?** → Fachkonzept.
2. **Nennt er einen Maßstab (warum etwas so sein soll) oder ein Verhalten (was die Software
   tut)?** Maßstab → Fachkonzept, Verhalten → Anforderung.
3. Weder noch, sondern eine **Festlegung des Auftraggebers zum Vorgehen** („Filter später",
   „die Redundanz bleibt bewusst") → offener Punkt oder ADR.

**Schlagseite, gegen die diese Regel gerichtet ist:** Anforderungen sind verlockend – sie
haben eine ID, werden vom Prüfskript kontrolliert und lassen sich abhaken. Das Fachkonzept
ist das langsamere Dokument ohne Belohnung. Sich selbst überlassen füllt eine KI die
Anforderungen und lässt das Fachkonzept dünn. Am 13.09.2026 ist genau das passiert.

### Fachliches und technisches Modell sind zwei Dinge

Das **fachliche** Modell steht in der Sprache des Unterrichts: Gegenstände, Beziehungen,
Arbeitsweise. Es enthält keine Kennungen, keine optionalen Felder, kein JSON. Es wird vom
**Auftraggeber** bestätigt – bestätigt es niemand, trägt alles Weitere auf Sand.

Das **technische** Modell ist die Antwort darauf: Ablage, Kennungen, Migration, was
gespeichert und was abgeleitet wird. Es verantwortet die KI und muss sich gegen das
fachliche prüfen lassen. Beides zu vermischen macht das technische für einen Menschen
unprüfbar, weil er nicht mehr unterscheiden kann, was Fachlichkeit ist und was
Entwurfsentscheidung.

### Wohin welches Ergebnis gehört

| Ergebnis | Ort | Wer bestätigt |
|---|---|---|
| Fachliches Modell: Gegenstände, Beziehungen, Arbeitsweise | `docs/fachkonzept-unterricht.md`, Kapitel 15 | Auftraggeber |
| Technisches Modell samt Zuordnung zum fachlichen | `docs/solution-design.md`, Kapitel 5 – **eine** Fassung | KI, prüfbar gegen Kapitel 15 |
| Welche Sichten es gibt und was sie leisten | `docs/anforderungen.md` (FA) | Auftraggeber |
| Wie eine Sicht angeordnet ist | Attrappe, aus dem Solution-Design verlinkt | Auftraggeber, durch Anschauen |
| Warum so und nicht anders | `docs/adr/` | – |
| Zwischenstand einer laufenden Klärung | `docs/entwurf-*.md` | – |

**Weder das fachliche noch das technische Modell gehört ins Product-Goal.** Das sagt, *wozu*
es die Software gibt, und muss einen vollständigen Neubau überleben.

### Die Kette in beide Richtungen

- **Jede Anforderung nennt ihre fachliche Grundlage** – ein Kapitel oder eine Aussage aus dem
  Fachkonzept. Hat sie keine, ist sie entweder erfunden oder eine Festlegung, die nirgends
  steht; dann trägt sie den ausdrücklichen Vermerk *„keine fachliche Grundlage, Festlegung
  des Auftraggebers vom …"*.
- **Jede fachliche Aussage nennt ihre Wirkung aufs Produkt** – oder *„ohne Produktwirkung"*.
  Das ist eine gültige Antwort: Das Fachkonzept beschreibt den Unterricht, nicht die
  Software. Verlangte man für jeden Punkt eine Produktwirkung, würde das Fachkonzept auf das
  zusammengestutzt, was die Software kann.

`scripts/dokumente-pruefen.mjs` prüft beides. Es prüft, dass ein Verweis **da** ist – nicht,
dass er **stimmt**.

**`docs/entwurf-*.md` sind Arbeitspapiere mit Ablaufdatum.** Sobald entschieden ist, wandert
der Inhalt an seinen Ort aus der Tabelle, und das Entwurfspapier bekommt oben einen Zeiger
dorthin. Ein Entwurf, der neben dem gültigen Dokument weiterlebt, ist die zweite Wahrheit,
gegen die dieses ganze Repository gebaut ist.

**Kein neues Dokument anlegen, ohne zu fragen.** Die Ablage oben deckt alles ab, was bisher
gebraucht wurde.

---

## Ablauf für eine Anforderung

1. Anforderung in `docs/anforderungen.md` lesen, inklusive Akzeptanzkriterien.
2. Branch: `feature/FA-xx-kurzbeschreibung` (bzw. `fix/…`, `docs/…`).
3. **Test zuerst**, aus den Akzeptanzkriterien abgeleitet, mit der ID im Testnamen:
   `it('lässt nicht bewertete Sprints leer (FA-31)', …)`.
4. Umsetzen, bis der Test grün ist.
5. `npm run pruefen` (Lint, Typprüfung, Tests, Dokumentenprüfung, Build) muss durchlaufen.
6. **Hinsehen** – die geänderte Sicht im Browser bedienen, nicht nur übersetzen (Regel 1).
7. Eintrag unter „Unveröffentlicht“ in `docs/CHANGELOG.md`.
8. Commit nach Conventional Commits mit ID:
   `feat(auswertung): Bewertungsbegründung je Person (FA-32)`
9. Weicht die Umsetzung vom Solution-Design ab: Solution-Design nachziehen.

Kleine Schritte. Ein Commit pro Anforderung, nicht fünf Anforderungen pro Commit.

---

## Arbeitsweise: zehn Regeln

Festgelegt am 14.09.2026, nachdem der Auftraggeber zwei Fehler gefunden hatte, die vor der
Lieferung hätten auffallen müssen. Jede Regel steht hier, weil etwas Bestimmtes schiefgegangen
ist – nicht, weil sie gut klingt.

**1. Vor der Lieferung die Anwendung ansehen, nicht nur übersetzen.** Eine KI-Sitzung kann die
Oberfläche selbst bedienen, auch ohne `npm install`: `esbuild` (liegt in `tsx`), `playwright`
und Chromium sind in der Regel vorhanden. Bündeln, auf `127.0.0.1` ausliefern, mit Playwright
durchklicken, Bildschirmfoto machen:

```bash
ESB=$(dirname $(readlink -f $(which tsx)))/../lib/node_modules/tsx/node_modules/esbuild/bin/esbuild
$ESB src/main.tsx --bundle --outfile=probe/app.js --jsx=automatic --format=iife \
     --define:process.env.NODE_ENV='"production"'
# index.html mit <div id="app"> und <script src="app.js">, dann statisch ausliefern
# und mit playwright (chromium aus /opt/pw-browsers/chromium-*/chrome-linux/chrome) bedienen
```

Der Auftraggeber ist nicht der Testrechner. Wer nicht hingesehen hat, schreibt „geliefert“ und
meint „übersetzt“.

**2. Beschriftungen und Tests zusammen ändern – von Hand, nicht mit einem Prüfer.** Zwei von
drei E2E-Fehlschlägen am 14.09.2026 waren umbenannte Beschriftungen, nicht Fehler in der
Anwendung. Die Regel lautet: **Wer eine Beschriftung ändert, sucht im selben Schritt nach der
alten:**

```bash
grep -rnF 'Art des Projekts' e2e/ src/
```

Ein Skript, das alle `getByLabel`-Namen automatisch gegen den Quelltext prüft, wurde versucht
und wieder **verworfen**. Es hatte dreizehn Fehlalarme, weil die halbe Oberfläche mit Vorlagen
beschriftet (`` `Name von ${projekt.name}` ``); nachdem die weg waren, fand es drei von drei
eingebauten Umbenennungen nicht mehr – „Sprint erzeugen“ galt als gedeckt, weil es irgendwo
`` `Sprint ${nummer}` `` gibt, und „Klassenbezeichnung“, weil im Deutschen zu viele Wörter
ihren Stamm teilen. Ein Prüfer, der beides falsch macht, ist schlimmer als keiner: Er kostet
Lauf­zeit und erzeugt Zutrauen, das er nicht deckt. Den Rest fängt Regel 1.

**3. Ein Commit je Anforderung, nicht ein Stapel Dateien.** Lose Dateien sind nicht
zurücknehmbar und nicht vergleichbar. Kann die Sitzung nicht selbst committen, liefert sie die
Dateien **und** die Commit-Nachricht mit FA-Nummer.

**4. Probelauf mit Daten vor der Lieferung.** Beide Fehler vom 14.09.2026 – ein Filter, der nur
auf vier von zehn Sichten wirkte, und ein Projekt ohne Sprint als Sackgasse – wären in zehn
Minuten Klicken aufgefallen. Mit Regel 1 ist das keine Bitte an den Auftraggeber mehr.

**5. Die Kette Anforderung → fachliche Grundlage gilt vorwärts.** Ab **FA-87** ist eine fehlende
fachliche Grundlage ein **Fehler** in `npm run dokumente`, kein Hinweis. Die älteren
Anforderungen bleiben ein benannter Rückstand: Eine Warnung, die achtzig Mal erscheint, erzieht
zum Wegsehen.

**6. Eine Versionsnummer, nicht vier.** Am 14.09.2026 standen in `package.json` 0.3.0, in der
README 0.1.0 und im Anforderungsdokument „Softwarestand 0.3.0“, während der CHANGELOG fünf
unveröffentlichte Versionen führte. Beim Release werden **alle** Stellen angehoben. Ein
Dokument, das bei einer Kleinigkeit lügt, wird auch bei der Notenfindung nicht geglaubt.

**7. Vertagtes gehört ins Repository, nicht in den Chatverlauf.** „Machen wir später“ wird im
selben Zug ein offener Punkt in `docs/anforderungen.md` oder `docs/risiken.md`. Der
Gesprächsverlauf einer KI-Sitzung wird komprimiert; was nur dort steht, ist weg.

**8. Ein Ding, ein Name.** Der Code sagt `Team`, fachlich heißt es **Projekt**. Das kostet bei
jedem Lesen eine Übersetzung und hat Fehler erzeugt – `teamsVon` filterte über das
bedeutungslose Altfeld `Team.klasseId`. Mit Schemastand 5 wird umbenannt, in einem Zug, ohne
weitere Änderung im selben Commit.

**9. Kleinere Lieferungen.** Vier große Dinge in einem Zug lassen sich nicht einzeln beurteilen
und nicht einzeln zurücknehmen. Eine Anforderung, eine Lieferung, eine Rückmeldung.

**10. Bei Mehrdeutigkeit einmal fragen – vor dem Bauen, mit Empfehlung.** Eine Rückfrage zum
Klassenfilter kostete eine Minute und lenkte den Umbau von sechs Sichten. Geraten wird nicht;
zweimal gefragt wird auch nicht.

---

## Tests

- Unit-Tests neben dem Modul (`scoring.ts` → `scoring.test.ts`), Vitest.
- Berechnungslogik: mindestens 90 % Zweigabdeckung (NFA-06). Grenzfälle gehören dazu:
  nichts erfasst, nur eine Kategorie, Gewicht 0, Punkte über Maximum, fehlende Peer-Urteile,
  Notenschlüsselgrenzen.
- E2E in `e2e/`, Playwright, gegen den Produktionsbuild.
- Ein gemeldeter Fehler wird **zuerst** als fehlschlagender Test abgebildet, dann behoben.

### Ein neuer E2E-Test braucht einen Durchstich

Ein E2E-Test wird nur angelegt, wenn er einem der fünf Durchstiche D1 bis D5 zuzuordnen ist
(Solution-Design 8.1). Für alles andere gilt: **eine Ebene tiefer.**

Der Grund steht in der Rechnung. Ein E2E-Fall kostet Sekunden je Lauf, läuft in zwei Browsern
und bricht bei jeder verschobenen Beschriftung – auch dann, wenn an der Anwendung nichts
falsch ist. Am 14.09.2026 ließ eine einzige Umstellung zwei Fälle umschlagen, beide wegen
eines Locators. Ein Unit-Test kostet Millisekunden und bricht, wenn das Verhalten bricht.

Verlockend ist der E2E-Test trotzdem, weil er bequem alles zugleich beweist. Genau deshalb
diese Regel: Die Bequemlichkeit beim Schreiben zahlt jeder spätere Umbau zurück.

**Wenn die Prüfung unten nicht möglich ist, liegt das fast immer an der Stelle, wo die
Entscheidung steht.** Rechnet eine Komponente selbst, ist sie nur über den Browser erreichbar –
und das ist ein Verstoß gegen die Schichtregel (NFA-06), kein Grund für einen E2E-Test. Dann
wandert **zuerst die Entscheidung** in Domäne oder Store, und geprüft wird sie dort. So sind
am 14.09.2026 die Überschneidungsprüfung bei der Projektzuordnung, die Prüfung auf doppelte
GitHub-Kennung, das Lesen der GitHub-Auswertungsdatei und die Regel, was vom Sichtzustand
dauerhaft gemerkt wird, aus den Ansichten herausgewandert.

**Was ein Umzug nicht kann:** prüfen, ob die Ansicht die Funktion tatsächlich aufruft. Fällt
das weg, wird es benannt – im Solution-Design und gegenüber dem Auftraggeber – und nicht
stillschweigend als abgedeckt geführt.

---

## Abhängigkeiten

Das Projekt kommt bewusst mit wenigen aus: React, Vite, Vitest, Playwright, ESLint,
TypeScript. **Keine neue Laufzeitabhängigkeit ohne Eintrag im Solution-Design** samt
Begründung, warum sie nicht durch zwanzig Zeilen eigenen Code zu ersetzen ist. Kein
CSS-Framework, keine Zustandsbibliothek, keine Datums- oder Hilfsbibliothek.

Der Zustand liegt in einem `useReducer` in `store/storeReducer.ts`. Jede Änderung am
Datenbestand ist eine Aktion dort – nirgends sonst.

---

## Befehle

```bash
npm run dev        # Entwicklungsserver
npm run pruefen    # Lint + Typprüfung + Tests + Dokumentenprüfung + Build
npm test           # nur Unit-Tests
npm run coverage   # mit Abdeckungsbericht
npm run dokumente  # Ketten zwischen den Dokumenten und deren Aktualität
npm run e2e        # End-to-End (baut vorher)
npm run github     # Kennzahlen eines Teamrepositorys abfragen (FA-81)
npm run reviewzettel  # Reviewvorbereitung fuer ein Teamrepository (Kap. 6.5)
npm run pullrequests  # Pull Requests eines Zeitraums auswerten (Kap. 6.5)
npm run deutung       # Auswertung deuten: Zahlen, Interpretation, Fragen (Kap. 6.5)
npm run ausmustern -- <datei>   # mit Zeitstempel nach _temp/ und Original loeschen
```

**Löschen macht der Rechner, nicht die KI.** In diesem Aufbau kann eine KI auf dem Rechner des
Auftraggebers lesen und schreiben, aber nicht löschen – und die Freigabe dafür gälte für einen
ganzen Ordner und die restliche Sitzung. Für eine ausgemusterte Datei ist das eine Reichweite
ohne Verhältnis. Deshalb: `npm run ausmustern -- <datei>` vorschlagen und den Auftraggeber
aufrufen lassen. `--nur-anzeigen` zeigt vorher, was geschähe.

`npm run dokumente` bricht ab, wenn eine umgesetzte Anforderung von keinem Test genannt wird,
eine Anforderung keinen Stakeholder oder keinen Nutzen nennt, ein Risiko ohne Maßnahme dasteht –
oder eine Anforderung **ab FA-87** keine fachliche Grundlage nennt (Regel 5). Veraltete
Aktualitätsköpfe erzeugen nur eine Warnung.

**Beim Release wird die Versionsnummer an allen Stellen angehoben** (Regel 6): `package.json`,
`README.md`, `docs/CHANGELOG.md` und der Kopf „Gültig für Softwarestand“ in **jedem** Dokument
unter `docs/`. `npm run dokumente` warnt für jedes Dokument, das zurückbleibt.

---

## Datenschutz

Die Anwendung verarbeitet Namen Minderjähriger und deren Noten. Nichts davon verlässt das
Gerät. Keine Beispieldaten mit echten Schülernamen in Tests, Fixtures oder Dokumenten –
erfundene Namen verwenden. In Fehlermeldungen und Protokollausgaben nie Namen oder Noten
ausgeben.

---

## Was hier bewusst fehlt

Kein Backend, keine Anmeldung, keine Mehrbenutzerfähigkeit, kein URL-Routing (ADR-001,
ADR-005). Vorschläge in diese Richtung sind nicht falsch, aber sie heben Rahmenbedingungen
auf – das ist eine Entscheidung des Auftraggebers, keine des Entwicklungsschritts.
