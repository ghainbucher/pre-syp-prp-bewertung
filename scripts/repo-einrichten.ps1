<#
    PRE/SYP-PRP-Bewertung – Repository einrichten (Windows, PowerShell)

    Legt die lokale Git-Historie an, erzeugt den ersten Commit und setzt die
    Version 0.1.0 als Tag. Das Anlegen des Repositories auf GitHub und das
    Hochladen erfolgt danach mit den ausgegebenen Befehlen.

    Aufruf im Projektordner:
        powershell -ExecutionPolicy Bypass -File .\scripts\repo-einrichten.ps1
#>

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

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
Write-Host '  4. Auf GitHub: Settings -> Branches -> Regel fuer main (siehe CONTRIBUTING.md)'
Write-Host '  5. Labels und Milestones anlegen: siehe scripts\github\labels.md'
Write-Host ''
Write-Host 'Mit installierter GitHub CLI geht Schritt 1 und 2 in einem:' -ForegroundColor Cyan
Write-Host '       gh repo create pre-syp-prp-bewertung --private --source=. --push'
