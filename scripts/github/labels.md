# Labels und Milestones

Einmalig im Repository anzulegen (Issues → Labels).

## Labels

| Label | Farbe | Bedeutung |
|---|---|---|
| `anforderung` | `#0e8a16` | Arbeitspaket zu einer Anforderung aus dem Lastenheft |
| `fehler` | `#d73a4a` | Abweichung von einer beschriebenen Anforderung |
| `dokumentation` | `#0075ca` | Änderung an einem geführten Dokument |
| `technische-schuld` | `#fbca04` | Aufräumarbeit ohne neue Funktion |
| `prio:muss` | `#b60205` | MoSCoW: Muss |
| `prio:soll` | `#d93f0b` | MoSCoW: Soll |
| `prio:kann` | `#fef2c0` | MoSCoW: Kann |
| `blockiert` | `#5319e7` | Wartet auf eine Entscheidung oder ein anderes Issue |

Mit der GitHub CLI in einem Durchgang:

```bash
gh label create anforderung      --color 0e8a16 --description "Arbeitspaket zu einer Anforderung"
gh label create fehler           --color d73a4a --description "Abweichung von einer Anforderung"
gh label create dokumentation    --color 0075ca --description "Änderung an einem geführten Dokument"
gh label create technische-schuld --color fbca04 --description "Aufräumarbeit ohne neue Funktion"
gh label create prio:muss        --color b60205
gh label create prio:soll        --color d93f0b
gh label create prio:kann        --color fef2c0
gh label create blockiert        --color 5319e7 --description "Wartet auf eine Entscheidung"
```

## Milestones

Milestones sind **Releases**, nicht Themen – so zeigt GitHub den Fortschritt gleich mit an.

```bash
gh api repos/:owner/:repo/milestones -f title='0.2.0' -f description='Rückmeldung an die Schüler, Auftraggeber, Sicherungserinnerung'
gh api repos/:owner/:repo/milestones -f title='0.3.0' -f description='Rubrik weitergeben, Teamhistorie'
```
