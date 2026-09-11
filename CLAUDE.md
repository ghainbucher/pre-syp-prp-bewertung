# PRE/SYP-PRP-Bewertung – Hinweise für Claude

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

## Ablauf für eine Anforderung

1. Anforderung in `docs/anforderungen.md` lesen, inklusive Akzeptanzkriterien.
2. Branch: `feature/FA-xx-kurzbeschreibung` (bzw. `fix/…`, `docs/…`).
3. **Test zuerst**, aus den Akzeptanzkriterien abgeleitet, mit der ID im Testnamen:
   `it('lässt nicht bewertete Sprints leer (FA-31)', …)`.
4. Umsetzen, bis der Test grün ist.
5. `npm run pruefen` (Lint, Typprüfung, Tests, Dokumentenprüfung, Build) muss durchlaufen.
6. Eintrag unter „Unveröffentlicht“ in `docs/CHANGELOG.md`.
7. Commit nach Conventional Commits mit ID:
   `feat(auswertung): Bewertungsbegründung je Person (FA-32)`
8. Weicht die Umsetzung vom Solution-Design ab: Solution-Design nachziehen.

Kleine Schritte. Ein Commit pro Anforderung, nicht fünf Anforderungen pro Commit.

---

## Tests

- Unit-Tests neben dem Modul (`scoring.ts` → `scoring.test.ts`), Vitest.
- Berechnungslogik: mindestens 90 % Zweigabdeckung (NFA-06). Grenzfälle gehören dazu:
  nichts erfasst, nur eine Kategorie, Gewicht 0, Punkte über Maximum, fehlende Peer-Urteile,
  Notenschlüsselgrenzen.
- E2E in `e2e/`, Playwright, gegen den Produktionsbuild.
- Ein gemeldeter Fehler wird **zuerst** als fehlschlagender Test abgebildet, dann behoben.

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
```

`npm run dokumente` bricht ab, wenn eine umgesetzte Anforderung von keinem Test genannt wird,
eine Anforderung keinen Stakeholder oder keinen Nutzen nennt, oder ein Risiko ohne Maßnahme
dasteht. Veraltete Aktualitätsköpfe erzeugen nur eine Warnung.

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
