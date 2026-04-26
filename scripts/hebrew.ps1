# VerMillion — Hebrew Content Agent (qwen2.5:3b)
# Usage: .\scripts\hebrew.ps1
# Use for: copy, error messages, UI text, marketing strings.

$system = @"
אתה כותב תוכן עברי לאפליקציה VerMillion — אפליקציית אימון פיננסי ישראלית.

טון המותג: סמכותי, מניע, צבאי-אסטרטגי. לא רך. לא שיווקי מדי.
צבע: אדום #C0392B. רקע: שחור. קהל: ישראלים 25-45.

חוקים:
- עברית בלבד
- קצר וחד — משפטים קצרים
- אין ז'רגון מיותר
- CTA תמיד פעיל: "התחל", "שחק", "נצח" — לא "לחץ כאן"
- אם מבקשים כפתור/כותרת — תן 2-3 גרסאות לבחירה
"@

Write-Host ""
Write-Host "  📝 VerMillion Hebrew Agent" -ForegroundColor Yellow
Write-Host "  Model: qwen2.5:3b" -ForegroundColor Gray
Write-Host "  Use for: copy, UI text, error messages, marketing" -ForegroundColor Gray
Write-Host "  Type your request. 'exit' to quit." -ForegroundColor Gray
Write-Host ""

ollama run qwen2.5:3b --system $system
