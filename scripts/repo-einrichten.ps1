<#
    PRE/SYP-PRP-Bewertung – Repository einrichten (Windows, PowerShell)

    Legt die lokale Git-Historie an, erzeugt den ersten Commit und setzt die
    Version 0.1.0 als Tag. Das Anlegen des Repositories auf GitHub und das
    Hochladen erfolgt danach mit den ausgegebenen Befehlen.

    Aufruf im Projektordner:
        powershell -ExecutionPolicy Bypass -File .\scripts\repo-einrichten.ps1

    Nachdem das Repository auf GitHub liegt, setzt derselbe Aufruf mit -Schutz
    die fuenf Schutzeinstellungen fuer `main` (siehe CONTRIBUTING.md):
        powershell -ExecutionPolicy Bypass -File .\scripts\repo-einrichten.ps1 -Schutz

    Fuer ein Schuelerteam zusaetzlich -Genehmigungen 1 -AdminsEingeschlossen:
    Dann ist eine Genehmigung durch eine andere Person Pflicht, und niemand kann
    sie mit Verwaltungsrechten umgehen.
#>

param(
    # Setzt die Schutzeinstellungen fuer `main`. Verlangt die GitHub CLI (gh)
    # und ein bereits angelegtes Repository mit Fernverweis.
    [switch] $Schutz,

    # Zahl der verlangten Genehmigungen. 0 ist die Vorgabe und der richtige Wert
    # fuer ein Einpersonenprojekt: Der Pull Request bleibt Pflicht, aber niemand
    # muss ihn genehmigen – sonst koennte der Alleinentwickler nie zusammenfuehren,
    # weil man den eigenen Pull Request nicht genehmigen kann.
    # Fuer ein Schuelerteam: 1.
    [ValidateRange(0, 6)]
    [int] $Genehmigungen = 0,

    # Gelten die Regeln auch fuer Verwaltungsrechte? Fuer ein Schuelerteam ja –
    # sonst hebt der mit den Rechten die ganze Absicherung auf. Im eigenen
    # Einpersonenprojekt bleibt der Notausgang offen.
    [switch] $AdminsEingeschlossen,

    # Nur anzeigen, was gesendet wuerde.
    [switch] $NurAnzeigen
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

<#
    Die fuenf Schutzeinstellungen fuer `main`.

    Sie sind der Grund, warum die Pipeline mehr ist als eine Empfehlung: Ohne sie
    kann jeder direkt auf `main` schieben, und alle Pruefungen sind freiwillig.

      1. Kein direkter Push – Aenderungen nur ueber Pull Request
      2. Alle Pruefungen muessen gruen sein
      3. Zweig muss vor dem Zusammenfuehren aktuell sein
      4. Genehmigungen verfallen bei neuen Commits
      5. Kein Force-Push, kein Loeschen des Zweigs

    Nummer 4 ist die, die am haeufigsten fehlt. Ohne sie ist eine Genehmigung eine
    Aussage ueber einen Stand, der nicht mehr da ist: genehmigen, nachschieben,
    zusammenfuehren.

    Die Namen der Pruefungen muessen den Job-Namen in .github\workflows\ci.yml
    entsprechen. Aendert sich dort ein Name, greift die Pruefung hier ins Leere –
    und der Schutz sieht aktiv aus, ohne zu wirken.
#>
function Set-Zweigschutz {
    param(
        [int] $Genehmigungen,
        [bool] $AdminsEingeschlossen,
        [bool] $NurAnzeigen
    )

    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        Write-Host 'Die GitHub CLI (gh) ist nicht installiert – Schutzeinstellungen uebersprungen.' -ForegroundColor Yellow
        Write-Host 'Von Hand: Settings -> Branches -> Add rule fuer main, siehe CONTRIBUTING.md.'
        return
    }

    # Kein try/catch: Ein fehlgeschlagenes externes Programm loest in PowerShell
    # keine Ausnahme aus (je nach Version), es setzt nur $LASTEXITCODE. Ein catch
    # um `gh` waere ein Schutz, der nie greift – und im Review sieht er richtig aus.
    $repo = (gh repo view --json nameWithOwner --jq .nameWithOwner 2>$null)
    if ($LASTEXITCODE -ne 0 -or -not $repo) {
        Write-Host 'Kein Repository auf GitHub gefunden (Fernverweis fehlt?) – Schutzeinstellungen uebersprungen.' -ForegroundColor Yellow
        return
    }
    $repo = $repo.Trim()

    $koerper = [ordered]@{
        # 2 und 3: Pruefungen gruen, Zweig aktuell.
        required_status_checks = [ordered]@{
            strict   = $true
            contexts = @('Lint, Typen, Unit-Tests, Build', 'End-to-End-Tests')
        }
        # Gelten die Regeln auch fuer Verwaltungsrechte?
        enforce_admins = $AdminsEingeschlossen
        # 1 und 4: Pull Request Pflicht, Genehmigungen verfallen bei neuen Commits.
        required_pull_request_reviews = [ordered]@{
            dismiss_stale_reviews          = $true
            required_approving_review_count = $Genehmigungen
        }
        # Keine Einschraenkung, wer schieben darf – das regelt der Pull Request.
        restrictions = $null
        # 5: Historie bleibt nachvollziehbar.
        allow_force_pushes = $false
        allow_deletions    = $false
    }

    $json = $koerper | ConvertTo-Json -Depth 5
    Write-Host ''
    Write-Host "Schutzeinstellungen fuer main in $repo" -ForegroundColor Cyan
    Write-Host "  Pull Request Pflicht, $Genehmigungen Genehmigung(en), Genehmigungen verfallen bei neuen Commits"
    Write-Host '  Pruefungen: Lint, Typen, Unit-Tests, Build + End-to-End-Tests, Zweig muss aktuell sein'
    Write-Host "  Auch fuer Verwaltungsrechte: $AdminsEingeschlossen"

    if ($NurAnzeigen) {
        Write-Host ''
        Write-Host $json
        return
    }

    $antwort = ($json | gh api --method PUT "repos/$repo/branches/main/protection" --input - 2>&1)
    if ($LASTEXITCODE -eq 0) {
        Write-Host 'Schutzeinstellungen gesetzt.' -ForegroundColor Green
    } else {
        # Der haeufigste Fall ist kein Tippfehler, sondern der Tarif.
        Write-Host 'Die Schutzeinstellungen konnten nicht gesetzt werden.' -ForegroundColor Yellow
        Write-Host $antwort
        Write-Host ''
        Write-Host 'Haeufigste Ursache: Geschuetzte Zweige gibt es in *privaten* Repositories nur' -ForegroundColor Yellow
        Write-Host 'mit GitHub Pro, Team oder Enterprise. In oeffentlichen Repositories sind sie'
        Write-Host 'auch im kostenlosen Tarif enthalten. Fuer Schulen lohnt der Blick auf GitHub'
        Write-Host 'Education; ob die dortigen Leistungen das abdecken, ist vorher zu pruefen.'
        Write-Host 'Ohne geschuetzten Zweig bleibt die Pipeline eine Empfehlung – dann traegt die'
        Write-Host 'Absicherung allein das Review (siehe docs/zusammenarbeit-mit-ki.md, Kap. 6.4).'
    }
}

if ($Schutz) {
    Set-Zweigschutz -Genehmigungen $Genehmigungen -AdminsEingeschlossen $AdminsEingeschlossen.IsPresent -NurAnzeigen $NurAnzeigen.IsPresent
    return
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git ist nicht installiert oder nicht im PATH.'
}

# Die beiden Pipeline-Dateien liegen unter scripts\workflows, weil GitHub-Actions-
# Dateien nicht aus der Ferne geschrieben werden duerfen. Hier kommen sie an ihren Platz.
$ziel = '.github\workflows'
if (-not (Test-Path $ziel)) { New-Item -ItemType Directory -Path $ziel -Force | Out-Null }
foreach ($datei in @('ci.yml', 'deploy.yml')) {
    $quelle = Join-Path 'scripts\workflows' $datei
    if (Test-Path $quelle) {
        Copy-Item $quelle (Join-Path $ziel $datei) -Force
        Write-Host "Pipeline-Datei $datei nach .github\workflows kopiert." -ForegroundColor Green
    }
}

# Ebenso die Issue-Vorlagen.
$vorlagenZiel = '.github\ISSUE_TEMPLATE'
if (Test-Path 'scripts\github\ISSUE_TEMPLATE') {
    if (-not (Test-Path $vorlagenZiel)) { New-Item -ItemType Directory -Path $vorlagenZiel -Force | Out-Null }
    Copy-Item 'scripts\github\ISSUE_TEMPLATE\*' $vorlagenZiel -Force
    Write-Host 'Issue-Vorlagen nach .github\ISSUE_TEMPLATE kopiert.' -ForegroundColor Green
}

# Die Zeigerdatei fuer Copilot. Sie liegt hier und nicht direkt in .github, weil
# Dateien unter .github nicht aus der Ferne geschrieben werden duerfen – dieselbe
# Ursache wie bei den Workflow-Dateien. Inhaltlich ist sie ein Zeiger auf AGENTS.md.
if (Test-Path 'scripts\github\copilot-instructions.md') {
    if (-not (Test-Path '.github')) { New-Item -ItemType Directory -Path '.github' -Force | Out-Null }
    Copy-Item 'scripts\github\copilot-instructions.md' '.github\copilot-instructions.md' -Force
    Write-Host 'Copilot-Zeigerdatei nach .github kopiert.' -ForegroundColor Green
}

# Und die Pull-Request-Vorlage (Fachkonzept 9.1: Vermerk zum KI-Einsatz).
if (Test-Path 'scripts\github\PULL_REQUEST_TEMPLATE.md') {
    if (-not (Test-Path '.github')) { New-Item -ItemType Directory -Path '.github' -Force | Out-Null }
    Copy-Item 'scripts\github\PULL_REQUEST_TEMPLATE.md' '.github\PULL_REQUEST_TEMPLATE.md' -Force
    Write-Host 'Pull-Request-Vorlage nach .github kopiert.' -ForegroundColor Green
}

if (Test-Path .git) {
    Write-Host 'Es gibt bereits eine Git-Historie – es wird nichts überschrieben.' -ForegroundColor Yellow
} else {
    git init -b main
    git add .
    git commit -m @"
chore: Projektgeruest fuer die PRE/SYP-PRP-Bewertung 0.1.0

Anforderungsdokument v0.1, Solution-Design v0.1, Domaenenlogik mit Tests,
Oberflaeche in vier Bereichen, CI- und Deploy-Pipeline (RB-01 bis RB-04).
"@
    git tag -a v0.1.0 -m 'PRE/SYP-PRP-Bewertung 0.1.0'
    git tag -a docs/anforderungen-v0.1 -m 'Anforderungsdokument v0.1 (Entwurf)'
    git tag -a docs/solution-design-v0.1 -m 'Solution-Design v0.1 (Entwurf)'
    Write-Host 'Lokale Historie mit Version 0.1.0 angelegt.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Naechste Schritte:' -ForegroundColor Cyan
Write-Host '  1. Repository auf github.com anlegen (leer, ohne README).'
Write-Host '  2. Dann hier:'
Write-Host '       git remote add origin https://github.com/<konto>/pre-syp-prp-bewertung.git'
Write-Host '       git push -u origin main --follow-tags'
Write-Host '  3. Auf GitHub: Settings -> Pages -> Source: GitHub Actions'
Write-Host '  4. Schutzeinstellungen fuer main setzen:'
Write-Host '       powershell -ExecutionPolicy Bypass -File .\scripts\repo-einrichten.ps1 -Schutz'
Write-Host '     (Schuelerteam: zusaetzlich -Genehmigungen 1 -AdminsEingeschlossen)'
Write-Host '  5. Labels und Milestones anlegen: siehe scripts\github\labels.md'
Write-Host ''
Write-Host 'Mit installierter GitHub CLI geht Schritt 1 und 2 in einem:' -ForegroundColor Cyan
Write-Host '       gh repo create pre-syp-prp-bewertung --private --source=. --push'
