Write-Host "Building..." -ForegroundColor Cyan
npx expo export --platform web --clear
if ($LASTEXITCODE -ne 0) {
  Write-Host "expo export failed (exit $LASTEXITCODE)." -ForegroundColor Red
  exit $LASTEXITCODE
}

# Patch dist/index.html — viewport lock, dark bg, static spinner, no scroll
$htmlPath = "dist\index.html"
$styleInject = @"
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html {
    background-color: #0A0A0A;
    height: 100vh; height: 100dvh;
    overflow: hidden;
    overscroll-behavior: none;
  }
  body {
    background-color: #0A0A0A;
    height: 100vh; height: 100dvh;
    overflow: hidden;
    overscroll-behavior: none;
    margin: 0; padding: 0;
  }
  #root {
    height: 100vh; height: 100dvh;
    display: flex; flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  @keyframes vm-spin { to { transform: rotate(360deg); } }
  #vm-loader {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: #0A0A0A; display: flex; align-items: center;
    justify-content: center; z-index: 9999; pointer-events: none;
  }
  #vm-loader-ring {
    width: 44px; height: 44px;
    border: 3px solid rgba(192,57,43,0.25);
    border-top-color: #C0392B;
    border-radius: 50%;
    animation: vm-spin 0.9s linear infinite;
  }
</style>
</head>
"@
$html = (Get-Content $htmlPath -Raw) -replace '</head>', $styleInject
$html = $html -replace '<div id="root"></div>', '<div id="root"><div id="vm-loader"><div id="vm-loader-ring"></div></div></div>'
$html | Set-Content $htmlPath -NoNewline
Write-Host "Patched index.html — viewport lock + dark bg + static spinner" -ForegroundColor DarkGray

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