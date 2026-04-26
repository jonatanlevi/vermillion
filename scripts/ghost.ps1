# ghost.ps1 - Ghost Agent Daily UX Critique Runner
# Usage:
#   .\scripts\ghost.ps1           - full report (auto day)
#   .\scripts\ghost.ps1 -Day 8   - specific day
#   .\scripts\ghost.ps1 -Save    - save to ghost-feedback/

param(
  [int]    $Day  = 0,
  [switch] $Save = $false
)

$root = Split-Path $PSScriptRoot -Parent

if ($Day -eq 0) {
  $regDate = [datetime]"2026-04-18T09:00:00"
  $Day = ([math]::Floor(([datetime]::Now - $regDate).TotalDays)) + 1
  if ($Day -lt 1)  { $Day = 1 }
  if ($Day -gt 30) { $Day = 30 }
}

$dateStr  = Get-Date -Format "yyyy-MM-dd HH:mm"

# ─── BLOCKERS (RED) ──────────────────────────────────────────────────────────
$redIssues = @(
  "[ChallengeScreen - stamp] Persona does not understand Personal Time mechanic. Fix: add 1-line explanation above clock",
  "[AICoachScreen - greeting] Generic greeting (no real numbers) = bot feeling. Fix: verify generatePersonalizedGreeting() uses computeFinancialMetrics()"
)

# ─── FRICTION (YELLOW) ───────────────────────────────────────────────────────
$yellowIssues = @(
  "[RegisterScreen] Skeptic user needs to know value BEFORE giving personal data. Fix: add subtitle: '7 min = full financial profile. 79 NIS after 7 days.'",
  "[AvatarAppearanceScreen] Choosing avatar colors before app knows user = feels like cheap gamification. Fix: add 1 line: 'Avatar evolves with your financial performance'",
  "[DailyQuestions day 4] Unclear: include spouse income? side income? no hint. Fix: add placeholder + info button",
  "[DailyQuestions day 5] Daycare - fixed or variable expense? Persona unsure. Fix: add examples list",
  "[FinancialQuiz] Wrong answer has no strong visual signal. Fix: red border + 'Wrong -' prefix on explanation",
  "[BudgetBattle result] Missed goal reason not shown. Fix: show 'if you cut [coffee+gym] = +919 NIS savings'",
  "[LeaderboardScreen] Rank #12 but no guidance to improve. Fix: microtext 'X points to rank 11, complete tomorrow'",
  "[ObstacleGame first run] No instructions - persona did not know tap = jump. Fix: 3-second overlay 'TAP -> JUMP'"
)

# ─── WINS (GREEN) ─────────────────────────────────────────────────────────────
$wins = @(
  "SplashScreen - instant logo + name, no text wall",
  "WelcomeScreen - 45,000 prize visible immediately, caught attention",
  "AI greeting with real numbers = WOW moment. 'It knows me'",
  "Lifestyle questions days 1-3: fast, non-threatening, under 3 min",
  "Debt questions: persona felt non-judged, UI not dramatic about amounts",
  "Obstacle game attempt 3: addictive, good learning curve",
  "Financial Quiz: persona learned something new about emergency fund",
  "Budget Battle: swipe gesture feels right on mobile",
  "Leaderboard #12: immediate desire to reach #5",
  "AI answered car loan question with actual NIS amounts from profile"
)

# ─── QUOTE (rotates by day) ───────────────────────────────────────────────────
$quotes = @(
  "The app knows me - saw I have 45,500 NIS debt and mentioned it. Did not expect that.",
  "Quiz taught me I need 3 emergency months. I have 0.6. That hit me.",
  "The leaderboard motivates me more than expected. I am #12, want #5.",
  "The stamp clock confused me. Tapped by mistake before I was ready.",
  "AI answered with MY numbers - that is what other apps do not do.",
  "Budget Battle: did not realize morning coffee costs 840 NIS per month.",
  "7 days of questions is a lot - but now the AI talks to me specifically."
)
$quote = $quotes[$Day % $quotes.Length]

# ─── SCORE ───────────────────────────────────────────────────────────────────
$score = [math]::Max(1.0, 10.0 - $redIssues.Count * 2.0 - $yellowIssues.Count * 0.5)

# ─── BUILD REPORT ─────────────────────────────────────────────────────────────
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("")
$lines.Add("================================================================")
$lines.Add("  GHOST AGENT DAILY REPORT -- Day $($Day.ToString().PadLeft(2,'0')) / 30")
$lines.Add("  Persona: Aviv Cohen (31, Backend Dev, Tel Aviv)")
$lines.Add("  Date: $dateStr")
$lines.Add("================================================================")
$lines.Add("")
$lines.Add("PERSONA FINANCIALS:")
$lines.Add("  Income: 18,000 NIS | Expenses: 13,100 NIS | Surplus: 4,900 NIS")
$lines.Add("  Debt: 45,500 NIS | Savings: 8,000 NIS | Emergency: 0.6 months WARNING")
$lines.Add("  Savings rate: 27% | Tier 3: Building | Session: 22:30 (after kid sleeps)")
$lines.Add("")
$lines.Add("UX SCORE: $($score.ToString('0.0')) / 10")
$lines.Add("  RED (blockers):  $($redIssues.Count)")
$lines.Add("  YELLOW (friction): $($yellowIssues.Count)")
$lines.Add("  GREEN (wins):    $($wins.Count)")
$lines.Add("")
$lines.Add("----------------------------------------------------------------")
$lines.Add("RED -- BLOCKERS (fix before beta)")
$lines.Add("----------------------------------------------------------------")
for ($i = 0; $i -lt $redIssues.Count; $i++) {
  $lines.Add("  $($i+1). $($redIssues[$i])")
  $lines.Add("")
}
$lines.Add("----------------------------------------------------------------")
$lines.Add("YELLOW -- FRICTION (should fix)")
$lines.Add("----------------------------------------------------------------")
for ($i = 0; $i -lt $yellowIssues.Count; $i++) {
  $lines.Add("  $($i+1). $($yellowIssues[$i])")
  $lines.Add("")
}
$lines.Add("----------------------------------------------------------------")
$lines.Add("GREEN -- WORKING WELL")
$lines.Add("----------------------------------------------------------------")
foreach ($w in $wins) { $lines.Add("  + $w") }
$lines.Add("")
$lines.Add("----------------------------------------------------------------")
$lines.Add("PERSONA QUOTE")
$lines.Add("----------------------------------------------------------------")
$lines.Add("  Avatar says: $quote")
$lines.Add("")
$lines.Add("NEXT ACTIONS:")
for ($i = 0; $i -lt $redIssues.Count; $i++) {
  $lines.Add("  P0-$($i+1): $($redIssues[$i])")
}
for ($i = 0; $i -lt [math]::Min(3, $yellowIssues.Count); $i++) {
  $lines.Add("  P1-$($i+1): $($yellowIssues[$i])")
}
$lines.Add("")
$lines.Add("  Ghost Agent v1.0 | DELETE before production | Aviv Cohen persona")
$lines.Add("================================================================")
$lines.Add("")

$reportText = $lines -join "`n"

# ─── PRINT ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "  GHOST AGENT -- Day $Day/30 | Aviv Cohen" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "UX SCORE: $($score.ToString('0.0'))/10" -ForegroundColor $(if ($score -ge 8) { "Green" } elseif ($score -ge 5) { "Yellow" } else { "Red" })
Write-Host ""
Write-Host "RED BLOCKERS ($($redIssues.Count))" -ForegroundColor Red
foreach ($issue in $redIssues) { Write-Host "  $issue" -ForegroundColor DarkRed; Write-Host "" }
Write-Host "YELLOW FRICTION ($($yellowIssues.Count))" -ForegroundColor Yellow
foreach ($issue in $yellowIssues) { Write-Host "  $issue" -ForegroundColor DarkYellow; Write-Host "" }
Write-Host "GREEN WINS ($($wins.Count))" -ForegroundColor Green
foreach ($w in $wins) { Write-Host "  + $w" -ForegroundColor DarkGreen }
Write-Host ""
Write-Host "PERSONA: $quote" -ForegroundColor White
Write-Host ""

if ($Save) {
  $feedbackDir = Join-Path $root "ghost-feedback"
  if (-not (Test-Path $feedbackDir)) { New-Item -ItemType Directory -Path $feedbackDir | Out-Null }
  $fileName = "day-$($Day.ToString().PadLeft(2,'0'))-$(Get-Date -Format 'yyyy-MM-dd').txt"
  $filePath = Join-Path $feedbackDir $fileName
  [System.IO.File]::WriteAllText($filePath, $reportText, [System.Text.Encoding]::UTF8)
  Write-Host "Saved: $filePath" -ForegroundColor Cyan
}

Write-Host "Ghost Agent done. Day $Day/30" -ForegroundColor Magenta
