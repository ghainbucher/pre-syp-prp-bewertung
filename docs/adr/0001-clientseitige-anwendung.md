# ADR-001: Rein clientseitige Anwendung ohne Backend

- **Status:** angenommen
- **Datum:** 2026-09-09
- **Bezug:** NFA-03, NFA-04, RB-05, RB-06

## Kontext

Die PRE/SYP-PRP-Bewertung verarbeitet Namen von Schülerinnen und Schülern und deren Leistungsbewertungen –
personenbezogene Daten von Minderjährigen. Anwender ist eine einzelne Lehrkraft. Für den
Betrieb stehen weder Serverkapazität noch Budget zur Verfügung, und eine
Datenschutzfolgenabschätzung für eine schulische Serveranwendung wäre unverhältnismäßig.

## Entscheidung

Die Anwendung läuft vollständig im Browser. Es gibt keinen Anwendungsserver, keine
Datenbank und keine Anmeldung. Die Auslieferung erfolgt als statische Dateien.

## Folgen

**Positiv**

- Personenbezogene Daten verlassen das Gerät nicht; die datenschutzrechtliche Lage bleibt
  vergleichbar mit einer Notenliste in einer lokalen Tabellenkalkulation.
- Nach dem ersten Laden ist die Anwendung offline nutzbar.
- Auslieferung über GitHub Pages ohne laufende Kosten möglich.

**Negativ**

- Der Datenbestand ist an Gerät und Browserprofil gebunden; ein Wechsel erfordert die
  Sicherungsdatei.
- Gemeinsames Arbeiten mehrerer Lehrkräfte an einem Bestand ist nicht möglich.
- Die direkte Erfassung der Peer-Bewertung durch die Teams (FA-20) ist nur als Kioskmodus
  am Lehrergerät umsetzbar.

## Alternativen

- **Backend mit Datenbank:** verworfen wegen Betriebsaufwand, Kosten und Datenschutzlage.
- **Tabellenkalkulation mit Formeln:** verworfen, weil Peer-Matrix und Gewichtungslogik
  darin fehleranfällig und schlecht prüfbar sind.
