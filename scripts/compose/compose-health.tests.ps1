$ErrorActionPreference = "Stop"

. "$PSScriptRoot/compose-health.ps1"

function Assert-Equal {
  param(
    $Actual,
    $Expected,
    [string]$Message
  )

  if ($Actual -ne $Expected) {
    throw "Assert-Equal failed: $Message. Expected '$Expected', got '$Actual'."
  }
}

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw "Assert-True failed: $Message"
  }
}

$healthyServices = @(
  [pscustomobject]@{ Service = "postgres"; State = "running"; Health = "healthy"; ExitCode = 0 },
  [pscustomobject]@{ Service = "redis"; State = "running"; Health = "healthy"; ExitCode = 0 },
  [pscustomobject]@{ Service = "rabbitmq"; State = "running"; Health = "healthy"; ExitCode = 0 },
  [pscustomobject]@{ Service = "minio"; State = "running"; Health = "healthy"; ExitCode = 0 },
  [pscustomobject]@{ Service = "clickhouse"; State = "running"; Health = "healthy"; ExitCode = 0 },
  [pscustomobject]@{ Service = "minio-init"; State = "exited"; Health = ""; ExitCode = 0 }
)

$healthyResult = Test-ComposeServicesReady -Services $healthyServices
Assert-True $healthyResult.IsReady "Expected healthy environment to be ready"
Assert-Equal $healthyResult.Issues.Count 0 "Healthy environment should not report issues"

$failedServices = @(
  [pscustomobject]@{ Service = "postgres"; State = "running"; Health = "healthy"; ExitCode = 0 },
  [pscustomobject]@{ Service = "redis"; State = "running"; Health = "starting"; ExitCode = 0 },
  [pscustomobject]@{ Service = "rabbitmq"; State = "running"; Health = "unhealthy"; ExitCode = 0 },
  [pscustomobject]@{ Service = "minio"; State = "exited"; Health = ""; ExitCode = 1 },
  [pscustomobject]@{ Service = "clickhouse"; State = "running"; Health = "healthy"; ExitCode = 0 },
  [pscustomobject]@{ Service = "minio-init"; State = "exited"; Health = ""; ExitCode = 1 }
)

$failedResult = Test-ComposeServicesReady -Services $failedServices
Assert-True (-not $failedResult.IsReady) "Expected unhealthy environment to fail readiness"
Assert-Equal $failedResult.Issues.Count 4 "Expected four issues to be reported"

$issueText = $failedResult.Issues -join "`n"
Assert-True ($issueText -match "redis") "Expected redis starting state to be reported"
Assert-True ($issueText -match "rabbitmq") "Expected rabbitmq unhealthy state to be reported"
Assert-True ($issueText -match "minio") "Expected minio exited state to be reported"
Assert-True ($issueText -match "minio-init") "Expected minio-init failure to be reported"

$validProjectName = Test-ComposeProjectNameValue -ProjectName "streamgate"
Assert-True $validProjectName.IsValid "Expected lowercase project name to be valid"
Assert-Equal $validProjectName.Message "" "Valid project name should not report an error"

$invalidProjectName = Test-ComposeProjectNameValue -ProjectName "StreamGate"
Assert-True (-not $invalidProjectName.IsValid) "Expected uppercase project name to be invalid"
Assert-True ($invalidProjectName.Message -match "COMPOSE_PROJECT_NAME") "Expected invalid project name message to mention COMPOSE_PROJECT_NAME"

$conflictMessage = Get-ComposeUpFriendlyError -ComposeOutput 'Error response from daemon: Conflict. The container name "/streamgate-clickhouse" is already in use by container "abc".'
Assert-True ($conflictMessage -match 'streamgate-clickhouse') "Expected friendly conflict message to mention conflicting container"
Assert-True ($conflictMessage -match 'docker rm -f streamgate-clickhouse') "Expected friendly conflict message to include cleanup command"

$unknownMessage = Get-ComposeUpFriendlyError -ComposeOutput 'some other docker error'
Assert-Equal $unknownMessage $null "Unexpected errors should not be rewritten"

Write-Host "compose-health tests passed" -ForegroundColor Green
