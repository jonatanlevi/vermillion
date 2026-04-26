# VerMillion — One-shot task runner
# Usage: .\scripts\task.ps1 "בנה קומפוננט X עם Y"
# Sends a single task to coder agent and prints the result.

param(
  [Parameter(Mandatory=$true)]
  [string]$Task
)

$root = Split-Path $PSScriptRoot -Parent
$claude = Get-Content "$root\CLAUDE.md" -Raw -Encoding UTF8

$prompt = @"
PROJECT CONTEXT (read carefully):
$claude

TASK:
$Task

Output only the complete code for the file. No explanations.
"@

Write-Host ""
Write-Host "  ⚡ Running task..." -ForegroundColor Red
Write-Host "  $Task" -ForegroundColor Gray
Write-Host ""

$prompt | ollama run qwen2.5-coder:7b
