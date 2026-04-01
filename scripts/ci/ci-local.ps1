param(
  [ValidateSet('all', 'frontend', 'backend', 'docker')]
  [string]$Workflow = 'all'
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
. (Join-Path $root 'scripts/compose/compose-health.ps1')
$results = New-Object System.Collections.Generic.List[object]
$createdEnv = $false

function Write-Rule {
  Write-Host ('=' * 80)
}

function Write-WorkflowHeader {
  param([string]$Name)
  Write-Host ''
  Write-Rule
  Write-Host "WORKFLOW: $Name"
  Write-Rule
}

function Add-WorkflowResult {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Detail
  )

  $results.Add([pscustomobject]@{
    Workflow = $Name
    Status = $Status
    Detail = $Detail
  }) | Out-Null
}

function Ensure-EnvFile {
  $envPath = Join-Path $root '.env'
  if (Test-Path $envPath) {
    return
  }

  Copy-Item (Join-Path $root '.env.example') $envPath
  $script:createdEnv = $true
  Write-Host 'Arquivo .env nao encontrado; copia temporaria criada a partir de .env.example.' -ForegroundColor Yellow
}

function Invoke-WorkflowStep {
  param(
    [string]$WorkflowName,
    [string]$StepName,
    [string]$WorkingDirectory,
    [string]$Command
  )

  Write-Host ''
  Write-Host ">>> [$WorkflowName] $StepName"
  Write-Host "Diretorio: $WorkingDirectory"
  Write-Host "Comando: $Command"
  Write-Host 'Status: RUNNING'

  Push-Location $WorkingDirectory
  try {
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $output = cmd.exe /d /c "$Command 2>&1"
    $exitCode = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $previousPreference
    Pop-Location
  }

  Write-Host '--- output start ---'
  if ($null -ne $output -and @($output).Count -gt 0) {
    $output | Out-Host
  }
  else {
    Write-Host '(sem output)'
  }
  Write-Host '--- output end ---'

  if ($exitCode -eq 0) {
    Write-Host 'Status: PASS' -ForegroundColor Green
  }
  else {
    Write-Host "Status: FAIL (exit code $exitCode)" -ForegroundColor Red
  }

  return [pscustomobject]@{
    ExitCode = $exitCode
    Output = @($output)
  }
}

function Test-CommandAvailable {
  param([string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-PowerShellFileCommand {
  param([string]$FilePath)

  if (Test-CommandAvailable 'pwsh') {
    return "pwsh -File $FilePath"
  }

  if (Test-CommandAvailable 'powershell') {
    return "powershell -ExecutionPolicy Bypass -File $FilePath"
  }

  throw 'Nem pwsh nem powershell estao disponiveis neste ambiente.'
}

function Run-FrontendWorkflow {
  $workflowName = 'frontend-ci'
  Write-WorkflowHeader $workflowName

  if (-not (Test-CommandAvailable 'pnpm')) {
    Add-WorkflowResult -Name $workflowName -Status 'FAIL' -Detail 'Comando obrigatorio nao encontrado: pnpm'
    return
  }

  $failed = $false
  $reason = 'Todos os passos passaram.'
  $steps = @(
    @{ Name = 'Install dependencies'; Dir = (Join-Path $root 'apps/web'); Command = 'set CI=true && pnpm install --frozen-lockfile'; Reason = 'Falha em Install dependencies.' },
    @{ Name = 'Lint'; Dir = (Join-Path $root 'apps/web'); Command = 'pnpm lint'; Reason = 'Falha em Lint.' },
    @{ Name = 'TypeScript build'; Dir = (Join-Path $root 'apps/web'); Command = '.\node_modules\.bin\tsc -b'; Reason = 'Falha em TypeScript build.' },
    @{ Name = 'Production build'; Dir = (Join-Path $root 'apps/web'); Command = 'pnpm build'; Reason = 'Falha em Production build.' }
  )

  foreach ($step in $steps) {
    if ($failed) { break }
    $result = Invoke-WorkflowStep -WorkflowName $workflowName -StepName $step.Name -WorkingDirectory $step.Dir -Command $step.Command
    if ($result.ExitCode -ne 0) {
      $failed = $true
      $reason = $step.Reason
    }
  }

  Add-WorkflowResult -Name $workflowName -Status ($(if ($failed) { 'FAIL' } else { 'PASS' })) -Detail $reason
}

function Run-BackendWorkflow {
  $workflowName = 'backend-ci'
  Write-WorkflowHeader $workflowName

  foreach ($commandName in @('ruby', 'bundle')) {
    if (-not (Test-CommandAvailable $commandName)) {
      Add-WorkflowResult -Name $workflowName -Status 'FAIL' -Detail "Comando obrigatorio nao encontrado: $commandName"
      return
    }
  }

  Ensure-EnvFile

  $postgresHost = Get-DotEnvValue -Path (Join-Path $root '.env') -Key 'POSTGRES_HOST'
  if ([string]::IsNullOrWhiteSpace($postgresHost)) { $postgresHost = 'localhost' }
  $postgresPort = Get-DotEnvValue -Path (Join-Path $root '.env') -Key 'POSTGRES_PORT'
  if ([string]::IsNullOrWhiteSpace($postgresPort)) { $postgresPort = '5432' }
  $postgresUser = Get-DotEnvValue -Path (Join-Path $root '.env') -Key 'POSTGRES_USER'
  if ([string]::IsNullOrWhiteSpace($postgresUser)) { $postgresUser = 'postgres' }
  $postgresPassword = Get-DotEnvValue -Path (Join-Path $root '.env') -Key 'POSTGRES_PASSWORD'
  if ([string]::IsNullOrWhiteSpace($postgresPassword)) { $postgresPassword = 'postgres' }
  $postgresTestDb = Get-DotEnvValue -Path (Join-Path $root '.env') -Key 'POSTGRES_TEST_DB'
  if ([string]::IsNullOrWhiteSpace($postgresTestDb)) { $postgresTestDb = 'streamgate_test' }

  $apiPrepareCommand = 'set "RAILS_ENV=test" && set "POSTGRES_HOST=' + $postgresHost + '" && set "POSTGRES_PORT=' + $postgresPort + '" && set "POSTGRES_TEST_DB=' + $postgresTestDb + '" && set "POSTGRES_USER=' + $postgresUser + '" && set "POSTGRES_PASSWORD=' + $postgresPassword + '" && set "BUNDLE_WITHOUT=production" && bundle exec rails db:prepare'
  $apiTestCommand = 'set "RAILS_ENV=test" && set "POSTGRES_HOST=' + $postgresHost + '" && set "POSTGRES_PORT=' + $postgresPort + '" && set "POSTGRES_TEST_DB=' + $postgresTestDb + '" && set "POSTGRES_USER=' + $postgresUser + '" && set "POSTGRES_PASSWORD=' + $postgresPassword + '" && set "BUNDLE_WITHOUT=production" && bundle exec rails test'

  $failed = $false
  $reason = 'Todos os jobs passaram.'
  $steps = @(
    @{ Name = 'Infra for backend'; Dir = $root; Command = 'powershell -ExecutionPolicy Bypass -File .\\scripts\\dev\\dev-up.ps1'; Reason = 'Falha ao subir a infra para backend-ci.' },
    @{ Name = 'API install dependencies'; Dir = (Join-Path $root 'apps/api'); Command = 'bundle install --jobs 4 --retry 3'; Reason = 'Falha em API install dependencies.' },
    @{ Name = 'API prepare database'; Dir = (Join-Path $root 'apps/api'); Command = $apiPrepareCommand; Reason = 'Falha em API prepare database.' },
    @{ Name = 'API tests'; Dir = (Join-Path $root 'apps/api'); Command = $apiTestCommand; Reason = 'Falha em API tests.' },
    @{ Name = 'API RuboCop'; Dir = (Join-Path $root 'apps/api'); Command = 'bundle exec rubocop'; Reason = 'Falha em API RuboCop.' },
    @{ Name = 'API Brakeman'; Dir = (Join-Path $root 'apps/api'); Command = 'bundle exec brakeman -q'; Reason = 'Falha em API Brakeman.' },
    @{ Name = 'Worker install dependencies'; Dir = (Join-Path $root 'apps/worker'); Command = 'bundle install --jobs 4 --retry 3'; Reason = 'Falha em Worker install dependencies.' },
    @{ Name = 'Worker tests'; Dir = (Join-Path $root 'apps/worker'); Command = 'bundle exec rspec'; Reason = 'Falha em Worker tests.' },
    @{ Name = 'Worker RuboCop'; Dir = (Join-Path $root 'apps/worker'); Command = 'bundle exec rubocop'; Reason = 'Falha em Worker RuboCop.' }
  )

  foreach ($step in $steps) {
    if ($failed) { break }
    $result = Invoke-WorkflowStep -WorkflowName $workflowName -StepName $step.Name -WorkingDirectory $step.Dir -Command $step.Command
    if ($result.ExitCode -ne 0) {
      $failed = $true
      $reason = $step.Reason
    }
  }

  try {
    Invoke-WorkflowStep -WorkflowName $workflowName -StepName 'Stop backend infra' -WorkingDirectory $root -Command 'powershell -ExecutionPolicy Bypass -File .\\scripts\\dev\\dev-down.ps1' | Out-Null
  }
  catch {
  }

  Add-WorkflowResult -Name $workflowName -Status ($(if ($failed) { 'FAIL' } else { 'PASS' })) -Detail $reason
}

function Run-DockerWorkflow {
  $workflowName = 'docker-ci'
  Write-WorkflowHeader $workflowName

  if (-not (Test-CommandAvailable 'docker')) {
    Add-WorkflowResult -Name $workflowName -Status 'FAIL' -Detail 'Comando obrigatorio nao encontrado: docker'
    return
  }

  Ensure-EnvFile

  $composeHealthCommand = Get-PowerShellFileCommand -FilePath '.\\scripts\\compose\\compose-health.tests.ps1'

  $failed = $false
  $reason = 'Todos os passos passaram.'
  $steps = @(
    @{ Name = 'Validate compose default config'; Dir = $root; Command = 'docker compose -f compose.yaml config'; Reason = 'Falha em Validate compose default config.' },
    @{ Name = 'Validate compose full profile'; Dir = $root; Command = 'docker compose -f compose.yaml --profile full config'; Reason = 'Falha em Validate compose full profile.' },
    @{ Name = 'Validate WSL bash health helpers'; Dir = $root; Command = 'bash scripts/compose/compose-health-tests.sh'; Reason = 'Falha em Validate WSL bash health helpers.' },
    @{ Name = 'Validate PowerShell health helpers'; Dir = $root; Command = $composeHealthCommand; Reason = 'Falha em Validate PowerShell health helpers.' },
    @{ Name = 'Build API production image'; Dir = $root; Command = 'docker build -t streamgate-api:ci .\apps\api'; Reason = 'Falha em Build API production image.' },
    @{ Name = 'Build API development image'; Dir = $root; Command = 'docker build -f apps/api/Dockerfile.dev -t streamgate-api-dev:ci .\apps\api'; Reason = 'Falha em Build API development image.' },
    @{ Name = 'Build Web production image'; Dir = $root; Command = 'docker build -t streamgate-web:ci .\apps\web'; Reason = 'Falha em Build Web production image.' },
    @{ Name = 'Build Web development image'; Dir = $root; Command = 'docker build -f apps/web/Dockerfile.dev -t streamgate-web-dev:ci .\apps\web'; Reason = 'Falha em Build Web development image.' },
    @{ Name = 'Build Worker development image'; Dir = $root; Command = 'docker build -f apps/worker/Dockerfile.dev -t streamgate-worker-dev:ci .\apps\worker'; Reason = 'Falha em Build Worker development image.' },
    @{ Name = 'Smoke test infra profile'; Dir = $root; Command = 'docker compose up -d && python scripts/compose/compose-smoke.py && docker compose ps'; Reason = 'Falha em Smoke test infra profile.' }
  )

  foreach ($step in $steps) {
    if ($failed) { break }
    $result = Invoke-WorkflowStep -WorkflowName $workflowName -StepName $step.Name -WorkingDirectory $step.Dir -Command $step.Command
    if ($result.ExitCode -ne 0) {
      $failed = $true
      $reason = $step.Reason
    }
  }

  try {
    Invoke-WorkflowStep -WorkflowName $workflowName -StepName 'Stop compose stack' -WorkingDirectory $root -Command 'docker compose down -v' | Out-Null
  }
  catch {
  }

  Add-WorkflowResult -Name $workflowName -Status ($(if ($failed) { 'FAIL' } else { 'PASS' })) -Detail $reason
}

switch ($Workflow) {
  'all' {
    Run-FrontendWorkflow
    Run-BackendWorkflow
    Run-DockerWorkflow
  }
  'frontend' { Run-FrontendWorkflow }
  'backend' { Run-BackendWorkflow }
  'docker' { Run-DockerWorkflow }
}

Write-Host ''
Write-Rule
Write-Host 'RESUMO FINAL'
Write-Rule

$failureCount = 0
foreach ($result in $results) {
  '{0,-18} {1,-8} {2}' -f $result.Workflow, $result.Status, $result.Detail | Write-Host
  if ($result.Status -ne 'PASS') {
    $failureCount++
  }
}

Write-Host ''
if ($failureCount -eq 0) {
  Write-Host 'Resultado geral: PASS' -ForegroundColor Green
}
else {
  Write-Host "Resultado geral: FAIL ($failureCount workflow(s) com problema)" -ForegroundColor Red
}

if ($createdEnv -and (Test-Path (Join-Path $root '.env'))) {
  Remove-Item (Join-Path $root '.env')
}

if ($failureCount -gt 0) {
  exit 1
}


