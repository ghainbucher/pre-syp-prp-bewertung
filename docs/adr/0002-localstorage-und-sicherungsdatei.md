# ADR-002: `localStorage` als Speicher, JSON-Datei als Sicherung

- **Status:** angenommen
- **Datum:** 2026-09-09
- **Bezug:** ADR-001, FA-33, NFA-09, A-1, A-2

## Kontext

Aus ADR-001 folgt, dass die Daten auf dem Gerät bleiben. Der Browser bietet dafür
`localStorage`, `sessionStorage` und IndexedDB. Der Bestand ist klein: bei 40 Personen und
12 Sprints bleibt das JSON-Dokument deutlich unter einem Megabyte.

## Entscheidung

Der gesamte Bestand wird als ein JSON-Dokument unter dem Schlüssel `pre-syp-prp.data.v1` im
`localStorage` abgelegt und bei jeder Änderung entprellt geschrieben. Für Gerätewechsel und
Datensicherung gibt es Export und Import als JSON-Datei.

Das Dokument trägt eine `schemaVersion`. Beim Laden hebt eine Migrationsfunktion ältere
Stände an; ein unlesbarer Bestand wird nicht überschrieben, sondern unter einem
Sicherungsschlüssel abgelegt (NFA-09).

## Folgen

**Positiv**

- Synchroner Zugriff, kein asynchrones Schema, einfache Tests mit einer Speicherattrappe.
- Die Sicherungsdatei ist lesbar und lässt sich im Notfall von Hand reparieren.

**Negativ**

- Ein gelöschter Browserspeicher nimmt die Daten mit – daher der ständige Hinweis auf die
  Sicherung in der Fußzeile.
- `localStorage` ist auf wenige Megabyte begrenzt. Sollte A-1 einmal nicht mehr gelten,
  ist ein Wechsel auf IndexedDB nötig; die Kapselung in `store/persistence.ts` hält diesen
  Wechsel auf ein Modul begrenzt.
