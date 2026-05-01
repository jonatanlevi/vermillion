Write-Host "Building..." -ForegroundColor Cyan
npx expo export --platform web --clear
if ($LASTEXITCODE -ne 0) {
  Write-Host "expo export failed (exit $LASTEXITCODE)." -ForegroundColor Red
  exit $LASTEXITCODE
}

# Patch dist/index.html — dark background and block bounce ONLY
$htmlPath = "dist\index.html"
$styleInject = "<style>body, html { background-color: #0A0A0A; overscroll-behavior: none; }</style></head>"
(Get-Content $htmlPath -Raw) -replace '</head>', $styleInject | Set-Content $htmlPath -NoNewline
Write-Host "Patched index.html with dark background and bounce prevention" -ForegroundColor DarkGray

Write-Host "Configuring Vercel project..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "dist\.vercel" | Out-Null
Copy-Item "vercel.json" "dist\vercel.json" -Force
Copy-Item ".vercel-project.json" "dist\.vercel\project.json" -Force

Write-Host "Deploying to Vercel..." -ForegroundColor Cyan
Push-Location dist
$raw = vercel --prod --yes 2>&1 | Tee-Object -Variable _
$vercelExit = $LASTEXITCODE
$prodLine = ($raw | Where-Object { $_ -match "Production:" } | Select-Object -Last 1)
$deployUrl = ($prodLine -split '\s+' | Where-Object { $_ -like "https://*" } | Select-Object -First 1)
Pop-Location

if ($vercelExit -ne 0) {
  Write-Host "vercel deploy failed (exit $vercelExit)." -ForegroundColor Red
  exit $vercelExit
}

if ($deployUrl) {
    Write-Host "Aliasing $deployUrl → vermillion-ashen.vercel.app" -ForegroundColor Yellow
    Push-Location dist
    vercel alias set $deployUrl vermillion-ashen.vercel.app
    Pop-Location
}

Write-Host ""
Write-Host "Done! https://vermillion-ashen.vercel.app" -ForegroundColor Green