$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom
$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$args = @('--profile', 'app', '--profile', 'full', '--profile', 'worker', 'down', '--remove-orphans')

docker compose @args
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
  Write-Host "Falha ao finalizar a infraestrutura local do StreamGate." -ForegroundColor Red
  exit $exitCode
}

Write-Host "Infraestrutura local do StreamGate finalizada." -ForegroundColor Green
