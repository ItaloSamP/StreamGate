$ErrorActionPreference = "Stop"

$checks = @(
  @{ Name = "git"; Command = "git --version" },
  @{ Name = "docker"; Command = "docker --version" },
  @{ Name = "docker compose"; Command = "docker compose version" },
  @{ Name = "node"; Command = "node --version" },
  @{ Name = "npm.cmd"; Command = "npm.cmd --version" },
  @{ Name = "ruby"; Command = "ruby --version" },
  @{ Name = "bundle"; Command = "bundle --version" },
  @{ Name = "rails"; Command = "rails --version" }
)

foreach ($check in $checks) {
  try {
    $result = Invoke-Expression $check.Command
    Write-Host "[OK] $($check.Name): $result" -ForegroundColor Green
  }
  catch {
    Write-Host "[MISSING/ERROR] $($check.Name): $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "Se o npm falhar no PowerShell, rode:" -ForegroundColor Cyan
Write-Host "Set-ExecutionPolicy -Scope CurrentUser RemoteSigned"
