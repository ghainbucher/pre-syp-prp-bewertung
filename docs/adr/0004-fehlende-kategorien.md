# ADR-004: Fehlende Kategorien werden aus der Gewichtung herausgerechnet

- **Status:** angenommen
- **Datum:** 2026-09-09
- **Bezug:** FA-21, FA-23, FA-26

## Kontext

Während eines Sprints liegen selten alle Daten gleichzeitig vor: Die Peer-Bögen kommen
später, der individuelle Beitrag wird im Gespräch ergänzt, der Prozess wird erst nach der
Retrospektive beurteilt. Trotzdem soll die Lehrkraft jederzeit einen Zwischenstand sehen.

## Entscheidung

Eine Kategorie ohne jede Eingabe hat **kein** Ergebnis. Sie geht weder mit 0 % in die
Rechnung ein noch senkt sie das Ergebnis. Stattdessen wird ihr Gewicht aus dem Nenner
genommen; das Sprintergebnis ist das gewichtete Mittel der **vorhandenen** Kategorien.
Dasselbe gilt innerhalb einer Kategorie für einzelne Kriterien.

Damit dieser Zwischenstand nicht mit einem Endergebnis verwechselt wird, benennt die
Oberfläche die noch fehlenden Kategorien (FA-26).

## Folgen

**Positiv**

- Zwischenstände sind aussagekräftig statt systematisch zu niedrig.
- Eine bewusst nicht verwendete Kategorie (Gewicht 0) verhält sich identisch – die Rubrik
  bleibt anpassbar, ohne Altdaten zu entwerten.

**Negativ**

- Ein Prozentwert allein sagt nicht, worauf er beruht. Die Anzeige muss die Grundlage
  ausweisen, sonst entsteht ein falscher Eindruck von Vollständigkeit.
- Ein leeres Feld heißt „nicht bewertet“ und ist von „0 Punkte“ zu unterscheiden – auch in
  der Speicherung, weshalb leere Werte gar nicht erst abgelegt werden.
