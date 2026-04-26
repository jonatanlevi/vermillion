# ghost-all.ps1 - Run all 5 personas for a full week simulation
# Usage: .\scripts\ghost-all.ps1
# Usage: .\scripts\ghost-all.ps1 -Save

param([switch]$Save = $false)

$root = Split-Path $PSScriptRoot -Parent

# Auto-detect day
$regDate = [datetime]"2026-04-18T09:00:00"
$Day = ([math]::Floor(([datetime]::Now - $regDate).TotalDays)) + 1
if ($Day -lt 1)  { $Day = 1 }
if ($Day -gt 30) { $Day = 30 }

# ─── All 5 Personas ──────────────────────────────────────────────────────────
$personas = @(
  @{
    name    = "Aviv Cohen"
    nameHe  = "אביב כהן"
    age     = 31
    tier    = 3
    label   = "Building"
    income  = 18000
    expenses= 13100
    surplus = 4900
    debt    = 45500
    savings = 8000
    emerg   = 0.6
    savRate = 27
    session = "22:30"
    score   = 7.2
    quote   = "The AI answered with MY numbers. That is what other apps do not do."
    reds    = @(
      "[stamp mechanic] Persona does not understand Personal Time. Fix: add 1-line explanation",
      "[AI greeting] Generic greeting = bot feeling. Fix: verify real numbers in greeting"
    )
    yellows = @(
      "[Register] Value not clear before signup",
      "[DailyQ day4] Unclear if spouse income included - entered 20pct wrong data",
      "[BudgetBattle] Missed goal, reason not shown",
      "[ObstacleGame] No instructions on first run"
    )
    wins    = @(
      "AI with real numbers on day 7 = WOW moment",
      "Flappy Bird attempt 3 addictive",
      "Financial Quiz taught real insight about emergency fund",
      "Leaderboard #12 created immediate competitive desire"
    )
  },
  @{
    name    = "Miriam Levi"
    nameHe  = "מרים לוי"
    age     = 58
    tier    = 4
    label   = "Optimization"
    income  = 31000
    expenses= 11000
    surplus = 20000
    debt    = 0
    savings = 380000
    emerg   = 34
    savRate = 52
    session = "21:00"
    score   = 5.8
    quote   = "I know more than the app. It gave me basics. I need pension tax optimization, not emergency fund advice."
    reds    = @(
      "[AICoach Tier4] AI gives Tier-2 advice to Tier-4 user. Fix: upgrade advice depth for savingsRate > 40pct",
      "[ProfileReveal] No pension/retirement projection shown. Fix: critical for 58-year-old"
    )
    yellows = @(
      "[DailyQ] No question about pension fund balance, inheritance, rental income",
      "[FinancialQuiz] Questions too basic for high financial literacy user",
      "[Challenge] Flappy Bird feels juvenile for 58-year-old. Budget Battle more relevant",
      "[Leaderboard] Competing with 24-year-olds feels wrong context"
    )
    wins    = @(
      "App flow is clean and fast - respects her time",
      "Dark theme professional, not childish",
      "Budget Battle felt relevant to her optimization mindset",
      "Settings language picker worked perfectly"
    )
  },
  @{
    name    = "Yosef Mizrahi"
    nameHe  = "יוסף מזרחי"
    age     = 24
    tier    = 1
    label   = "Stabilize"
    income  = 9000
    expenses= 7200
    surplus = 1800
    debt    = 20000
    savings = 1200
    emerg   = 0.17
    savRate = -18
    session = "23:30"
    score   = 6.1
    quote   = "Nobody ever explained money to me like this. Simple. Real. I want to get out of the minus."
    reds    = @(
      "[DailyQ day4] App assumes stable monthly income. Yosef has 5K-11K variability. Fix: add 'average' clarification + range input",
      "[AICoach] Gives budget analysis but Yosef earns cash - no bank statements. Fix: cash-based flow needs separate path"
    )
    yellows = @(
      "[AICoach] Tier-1 blocker works (no investment talk) but transitions feel abrupt",
      "[FinancialQuiz] Financial terms unknown - needs glossary tooltips",
      "[Onboarding] Too much text at 23:30 after 12-hour market shift",
      "[Challenge] 3 attempts wasted fast - too few for high-energy user"
    )
    wins    = @(
      "Flappy Bird at 23:30 - played all 3 attempts without hesitation",
      "Simple question format works for low-attention session",
      "AI debt response gave clear single next step",
      "Leaderboard motivated despite low score"
    )
  },
  @{
    name    = "Roni Shapira"
    nameHe  = "רוני שפירא"
    age     = 35
    tier    = 2
    label   = "Survival"
    income  = 6800
    expenses= 13800
    surplus = -7000
    debt    = 45000
    savings = 4500
    emerg   = 0.3
    savRate = -22
    session = "14:00"
    score   = 4.9
    quote   = "The app showed me I have a 7,000 NIS deficit every month. I knew it was bad. Seeing the number made it real and terrifying."
    reds    = @(
      "[CRITICAL - data model] Mandatory alimony 6,300 NIS/month not separable from optional expenses. Fix: add mandatory_obligations field",
      "[AICoach] Chronic deficit advice loop - AI keeps asking what to cut but everything is mandatory. Fix: Tier-1 path for negative surplus",
      "[DailyQ day5] fixed_expenses field cant capture alimony+child_support as distinct category"
    )
    yellows = @(
      "[HomeScreen] No acknowledgment that irregular freelance income exists",
      "[BudgetBattle] All cards feel mandatory to Roni - game causes frustration not insight",
      "[ProfileReveal] Showing deficit in large numbers without path forward feels hopeless",
      "[Tone] App assumes user can cut something. Roni literally cannot."
    )
    wins    = @(
      "AI correctly identified Tier-2 and blocked investment advice",
      "Dark minimal design - not judgmental visually",
      "Daily questions gave Roni first full picture of his situation",
      "Quiz was the only positive moment - learned without pressure"
    )
  },
  @{
    name    = "Noa Barak"
    nameHe  = "נועה ברק"
    age     = 27
    tier    = 0
    label   = "Blind"
    income  = 3200
    expenses= 4600
    surplus = -1400
    debt    = 0
    savings = 800
    emerg   = 0.17
    savRate = 8
    session = "07:00"
    score   = 7.8
    quote   = "I never thought about money seriously. This app made me realize in 7 days I have zero foundation. But also - doctor salary in 2 years. This is the right time to start."
    reds    = @(
      "[AICoach] Does not detect future income inflection (student -> doctor). Fix: if employment_type=student, ask about expected salary change",
      "[DailyQ day4] No guidance for students - income field unclear when stipend + parents. Fix: add student-specific income path"
    )
    yellows = @(
      "[FinancialQuiz] Terms completely unknown - needs educational mode, not quiz mode",
      "[Challenge stamp] 07:00 means she is rushing to hospital. Stamp mechanic stressful",
      "[Tier0 AI] Blind tier correctly asks for numbers but tone feels interrogative to eager learner",
      "[Onboarding] Avatar selection at 07:00 before hospital shift - wrong timing friction"
    )
    wins    = @(
      "Budget Battle perfect score - naturally frugal student mindset",
      "AI asking for numbers felt like teaching not interrogating (mostly)",
      "7-day structure works well for disciplined med student",
      "App sparked genuine financial awareness for first time"
    )
  }
)

# ─── Run all personas ─────────────────────────────────────────────────────────
$allLines = [System.Collections.Generic.List[string]]::new()

$allLines.Add("")
$allLines.Add("================================================================")
$allLines.Add("  GHOST TEAM — WEEK SIMULATION REPORT")
$allLines.Add("  5 Personas x 7 Days | Day $Day/30")
$allLines.Add("  $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
$allLines.Add("================================================================")
$allLines.Add("")

# Summary table
$allLines.Add("PERSONA OVERVIEW:")
$allLines.Add("  Name              Age  Tier  Score  Surplus/mo   Emergency  RedIssues")
$allLines.Add("  ----------------  ---  ----  -----  -----------  ---------  ---------")
foreach ($p in $personas) {
  $surplusStr = if ($p.surplus -lt 0) { "-NIS$([math]::Abs($p.surplus).ToString('N0'))" } else { "+NIS$($p.surplus.ToString('N0'))" }
  $line = "  $($p.nameHe.PadRight(18)) $($p.age.ToString().PadLeft(3))  T$($p.tier)    $($p.score.ToString('0.0'))   $($surplusStr.PadRight(12)) $($p.emerg) mo    $($p.reds.Count)"
  $allLines.Add($line)
}

$allLines.Add("")
$allLines.Add("================================================================")
$allLines.Add("SYSTEM-WIDE FINDINGS (patterns across all personas)")
$allLines.Add("================================================================")
$allLines.Add("")
$allLines.Add("CRITICAL - appears in 3+ personas:")
$allLines.Add("  [P0-A] Daily Questions income field: unclear what to include")
$allLines.Add("         -> Aviv: excluded spouse. Yosef: irregular income. Noa: excluded parent support.")
$allLines.Add("         -> FIX: rewrite income question with student/freelance/irregular paths")
$allLines.Add("")
$allLines.Add("  [P0-B] Stamp mechanic unexplained in ALL personas")
$allLines.Add("         -> Everyone confused on first encounter")
$allLines.Add("         -> FIX: 1-line explanation + 3-second tutorial")
$allLines.Add("")
$allLines.Add("  [P0-C] AI advice depth does not match tier correctly")
$allLines.Add("         -> Miriam (T4) gets T2 advice. Roni (T2 deficit) gets stuck in loop.")
$allLines.Add("         -> FIX: tier-aware advice expansion + deficit path for negative surplus")
$allLines.Add("")
$allLines.Add("STRUCTURAL GAP - missing data fields:")
$allLines.Add("  - No mandatory_obligations field (alimony, child support)")
$allLines.Add("  - No income_type field (salary/freelance/cash/student)")
$allLines.Add("  - No pension_balance field (critical for Miriam)")
$allLines.Add("  - No future_income_change field (critical for Noa)")
$allLines.Add("")
$allLines.Add("================================================================")

foreach ($p in $personas) {
  $scoreColor = if ($p.score -ge 8) { "Green" } elseif ($p.score -ge 6) { "Yellow" } else { "Red" }
  $allLines.Add("")
  $allLines.Add("----------------------------------------------------------------")
  $allLines.Add("  $($p.nameHe) ($($p.name)) | Age $($p.age) | Tier $($p.tier): $($p.label)")
  $allLines.Add("  Income: NIS$($p.income.ToString('N0')) | Expenses: NIS$($p.expenses.ToString('N0')) | Surplus: $(if($p.surplus -lt 0){'-'}else{'+'})NIS$([math]::Abs($p.surplus).ToString('N0'))")
  $allLines.Add("  Debt: NIS$($p.debt.ToString('N0')) | Savings: NIS$($p.savings.ToString('N0')) | Emergency: $($p.emerg) months")
  $allLines.Add("  UX Score: $($p.score)/10 | Session: $($p.session)")
  $allLines.Add("----------------------------------------------------------------")
  $allLines.Add("  RED ($($p.reds.Count)):")
  foreach ($r in $p.reds) { $allLines.Add("    - $r") }
  $allLines.Add("  YELLOW ($($p.yellows.Count)):")
  foreach ($y in $p.yellows) { $allLines.Add("    - $y") }
  $allLines.Add("  GREEN ($($p.wins.Count)):")
  foreach ($w in $p.wins) { $allLines.Add("    + $w") }
  $allLines.Add("  QUOTE: $($p.quote)")
}

$allLines.Add("")
$allLines.Add("================================================================")
$allLines.Add("MASTER ACTION LIST - sorted by impact")
$allLines.Add("================================================================")
$allLines.Add("")
$allLines.Add("P0 - Before any beta user:")
$allLines.Add("  1. Rewrite income question: paths for salary/freelance/student/irregular")
$allLines.Add("  2. Add stamp mechanic explanation (1 line + 3-sec tutorial)")
$allLines.Add("  3. Fix AI tier depth: Tier4 needs optimization advice, not survival advice")
$allLines.Add("  4. Add mandatory_obligations field to questionnaire (alimony, child support)")
$allLines.Add("  5. Add negative-surplus path to AI advisor")
$allLines.Add("")
$allLines.Add("P1 - Before public launch:")
$allLines.Add("  6. Add income_type to DailyQ day4 (salary/freelance/cash/student)")
$allLines.Add("  7. Budget Battle: show what caused goal miss in result screen")
$allLines.Add("  8. ObstacleGame: first-run instructions overlay")
$allLines.Add("  9. FinancialQuiz: glossary tooltips for Tier 0-1 users")
$allLines.Add(" 10. Add pension_balance + future_income questions")
$allLines.Add("")
$allLines.Add("P2 - Post-launch iterations:")
$allLines.Add(" 11. Age-appropriate challenge variants (not just Flappy for 58-year-old)")
$allLines.Add(" 12. Student-specific AI path (future income projection)")
$allLines.Add(" 13. Cash-income path for informal workers")
$allLines.Add(" 14. Retirement deep-dive for Tier 4 users")
$allLines.Add("")
$allLines.Add("  Ghost Team v1.0 | 5 Personas | DELETE before production")
$allLines.Add("================================================================")
$allLines.Add("")

$reportText = $allLines -join "`n"

# Print with colors
Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "  GHOST TEAM -- 5 PERSONAS | Day $Day/30" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "SCORES:" -ForegroundColor Cyan
foreach ($p in $personas) {
  $col = if ($p.score -ge 8) { "Green" } elseif ($p.score -ge 6) { "Yellow" } else { "Red" }
  Write-Host "  $($p.nameHe.PadRight(14)) T$($p.tier) | $($p.score)/10 | $($p.reds.Count) blockers | $($p.quote.Substring(0, [math]::Min(60,$p.quote.Length)))..." -ForegroundColor $col
}

Write-Host ""
Write-Host "SYSTEM-WIDE P0 ISSUES (fix these first):" -ForegroundColor Red
Write-Host "  1. Income question unclear -> 3 personas entered wrong data" -ForegroundColor DarkRed
Write-Host "  2. Stamp mechanic -> ALL 5 personas confused" -ForegroundColor DarkRed
Write-Host "  3. AI advice depth -> Tier4 gets Tier2 advice, deficit loop for Tier2" -ForegroundColor DarkRed
Write-Host "  4. Missing: mandatory_obligations field (alimony, child support)" -ForegroundColor DarkRed
Write-Host "  5. Missing: negative-surplus AI path" -ForegroundColor DarkRed
Write-Host ""

foreach ($p in $personas) {
  $col = if ($p.score -ge 8) { "Green" } elseif ($p.score -ge 6) { "Yellow" } else { "Red" }
  Write-Host "-- $($p.nameHe) ($($p.label)) --" -ForegroundColor $col
  Write-Host "   $($p.quote)"
  Write-Host ""
}

if ($Save) {
  $feedbackDir = Join-Path $root "ghost-feedback"
  if (-not (Test-Path $feedbackDir)) { New-Item -ItemType Directory -Path $feedbackDir | Out-Null }
  $fileName = "team-day-$($Day.ToString().PadLeft(2,'0'))-$(Get-Date -Format 'yyyy-MM-dd').txt"
  $filePath = Join-Path $feedbackDir $fileName
  [System.IO.File]::WriteAllText($filePath, $reportText, [System.Text.Encoding]::UTF8)
  Write-Host "Saved: $filePath" -ForegroundColor Cyan
}

Write-Host "Ghost Team done. Day $Day/30 | 5 personas" -ForegroundColor Magenta
