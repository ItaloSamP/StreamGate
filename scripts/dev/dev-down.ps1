$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom
$ErrorActionPreference = "Stop"

docker compose down

Write-Host "Infraestrutura local do StreamGate finalizada." -ForegroundColor Green
