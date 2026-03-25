$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env")) {
  Write-Host "Arquivo .env nao encontrado. Copie .env.example para .env antes de subir o ambiente." -ForegroundColor Yellow
  exit 1
}

docker compose up -d
docker compose ps

Write-Host ""
Write-Host "Infraestrutura local do StreamGate iniciada." -ForegroundColor Green
