$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

. "$PSScriptRoot/compose-health.ps1"

if (-not (Test-Path ".env")) {
  Write-Host "Arquivo .env nao encontrado. Copie .env.example para .env antes de subir o ambiente." -ForegroundColor Yellow
  exit 1
}

$composeProjectName = Get-DotEnvValue -Path ".env" -Key "COMPOSE_PROJECT_NAME"
$projectNameValidation = Test-ComposeProjectNameValue -ProjectName $composeProjectName

if (-not $projectNameValidation.IsValid) {
  Write-Host $projectNameValidation.Message -ForegroundColor Red
  exit 1
}

$timeoutSeconds = 180
$pollIntervalSeconds = 5
$deadline = (Get-Date).AddSeconds($timeoutSeconds)

try {
  $composeUpResult = Invoke-ComposeCommand -Arguments 'up -d'
  $composeUpResult.Output | Out-Host

  if ($composeUpResult.ExitCode -ne 0) {
    $friendlyError = Get-ComposeUpFriendlyError -ComposeOutput ($composeUpResult.Output -join "`n")

    if ($null -ne $friendlyError) {
      throw $friendlyError
    }

    throw "docker compose up -d falhou."
  }

  while ($true) {
    $services = Get-ComposeServices
    $result = Test-ComposeServicesReady -Services $services

    if ($result.IsReady) {
      (Invoke-ComposeCommand -Arguments 'ps').Output | Out-Host
      Write-Host ""
      Write-Host "Infraestrutura local do StreamGate iniciada e saudavel." -ForegroundColor Green
      exit 0
    }

    if ($result.FatalIssues.Count -gt 0) {
      Write-Host ""
      Write-Host "Falha ao subir a infraestrutura local do StreamGate." -ForegroundColor Red
      $result.FatalIssues | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
      (Invoke-ComposeCommand -Arguments 'ps').Output | Out-Host
      (Invoke-ComposeCommand -Arguments 'down').Output | Out-Host
      exit 1
    }

    if ((Get-Date) -ge $deadline) {
      Write-Host ""
      Write-Host "Timeout aguardando containers ficarem prontos." -ForegroundColor Red
      $result.PendingIssues | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
      (Invoke-ComposeCommand -Arguments 'ps').Output | Out-Host
      (Invoke-ComposeCommand -Arguments 'down').Output | Out-Host
      exit 1
    }

    Start-Sleep -Seconds $pollIntervalSeconds
  }
}
catch {
  Write-Host ""
  Write-Host "Erro ao subir a infraestrutura local do StreamGate: $($_.Exception.Message)" -ForegroundColor Red
  try {
    (Invoke-ComposeCommand -Arguments 'ps').Output | Out-Host
    (Invoke-ComposeCommand -Arguments 'down').Output | Out-Host
  }
  catch {
  }
  exit 1
}
