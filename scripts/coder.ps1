# VerMillion — Coder Agent (qwen2.5-coder:7b)
# Usage: .\scripts\coder.ps1
# Opens an interactive session with full project context loaded.

$root = Split-Path $PSScriptRoot -Parent
$claude = Get-Content "$root\CLAUDE.md" -Raw -Encoding UTF8
$tasks  = Get-Content "$root\TASKS.md"  -Raw -Encoding UTF8

$system = @"
You are a React Native developer working on VerMillion — an Israeli financial coaching app.

PROJECT CONTEXT:
$claude

CURRENT TASKS:
$tasks

RULES:
- Write React Native code only (no web CSS, no TypeScript)
- Dark theme: background #0A0A0A, primary #C0392B, text #FFFFFF
- Hebrew RTL: textAlign right, flexDirection row reversed
- StyleSheet.create always, no inline styles
- No comments on obvious code
- Output only the code — no explanations unless asked
"@

Write-Host ""
Write-Host "  🔨 VerMillion Coder Agent" -ForegroundColor Red
Write-Host "  Model: qwen2.5-coder:7b" -ForegroundColor Gray
Write-Host "  Context: CLAUDE.md + TASKS.md loaded" -ForegroundColor Gray
Write-Host "  Type your task. 'exit' to quit." -ForegroundColor Gray
Write-Host ""

ollama run qwen2.5-coder:7b --system $system
