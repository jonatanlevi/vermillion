# VerMillion — פריסת Edge Functions (game-complete + stamp)
# דורש התחברות חד-פעמית: npx supabase@latest login

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$projectRef = "hegbvrvmgvmmbigfpqax"
$cli = "npx"
$supabase = @("supabase@latest")

Write-Host "VerMillion Edge deploy (project: $projectRef)" -ForegroundColor Cyan

& $cli @($supabase + "--version") | Out-Host

Write-Host "`n[1/4] Link project (skip if already linked)..." -ForegroundColor Yellow
& $cli @($supabase + "link", "--project-ref", $projectRef)

$secret = $env:EXPO_PUBLIC_APP_SECRET
if (-not $secret) {
  $envFile = Join-Path $PSScriptRoot ".env"
  if (Test-Path $envFile) {
    $line = Get-Content $envFile | Where-Object { $_ -match '^EXPO_PUBLIC_APP_SECRET=' } | Select-Object -First 1
    if ($line) { $secret = ($line -split '=', 2)[1].Trim().Trim('"') }
  }
}
if (-not $secret) {
  Write-Host "Set EXPO_PUBLIC_APP_SECRET in .env or pass: `$env:EXPO_PUBLIC_APP_SECRET='your-secret'" -ForegroundColor Red
  exit 1
}

Write-Host "`n[2/4] Set APP_SECRET on Supabase..." -ForegroundColor Yellow
& $cli @($supabase + "secrets", "set", "APP_SECRET=$secret")

Write-Host "`n[3/4] Deploy game-complete..." -ForegroundColor Yellow
& $cli @($supabase + "functions", "deploy", "game-complete")

Write-Host "`n[4/4] Deploy stamp..." -ForegroundColor Yellow
& $cli @($supabase + "functions", "deploy", "stamp")

Write-Host "`nDone. Check Dashboard -> Edge Functions." -ForegroundColor Green
