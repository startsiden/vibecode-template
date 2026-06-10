# Verifies the local toolchain matches what the FA Vibe Starter needs.
# Windows / PowerShell 7+. Run with: pwsh scripts/check-tools.ps1

$ErrorActionPreference = 'Continue'

$RequiredNodeMajor = 22
$RequiredPnpmMajor = 10

function Check {
    param(
        [string]$Name,
        [string]$Cmd,
        [string]$ExpectMatch,
        [string]$Hint
    )
    $exe = Get-Command $Cmd -ErrorAction SilentlyContinue
    if (-not $exe) {
        Write-Host ("X  {0,-8} not installed — {1}" -f $Name, $Hint) -ForegroundColor Red
        return $false
    }
    $version = & $Cmd --version 2>$null | Select-Object -First 1
    if ($ExpectMatch -and ($version -notmatch $ExpectMatch)) {
        Write-Host ("!  {0,-8} {1} (expected {2})" -f $Name, $version, $ExpectMatch) -ForegroundColor Yellow
        return $true
    }
    Write-Host ("OK {0,-8} {1}" -f $Name, $version) -ForegroundColor Green
    return $true
}

Write-Host 'Toolchain check for fa-vibe-starter'
Write-Host '-----------------------------------'

$results = @(
    Check -Name 'node'   -Cmd 'node'   -ExpectMatch "v$RequiredNodeMajor\." -Hint "install Node $RequiredNodeMajor LTS via winget OpenJS.NodeJS.LTS"
    Check -Name 'pnpm'   -Cmd 'pnpm'   -ExpectMatch "$RequiredPnpmMajor\."  -Hint 'run: corepack enable; corepack prepare pnpm@latest --activate'
    Check -Name 'git'    -Cmd 'git'    -ExpectMatch ''                       -Hint 'install Git via winget Git.Git'
    Check -Name 'docker' -Cmd 'docker' -ExpectMatch ''                       -Hint 'install Docker Desktop (optional)'
)

Write-Host '-----------------------------------'
$missing = ($results | Where-Object { $_ -eq $false }).Count
if ($missing -gt 0) {
    Write-Host "$missing tool(s) missing. Install them and re-run." -ForegroundColor Red
    exit 1
}
Write-Host 'All required tools present.' -ForegroundColor Green
