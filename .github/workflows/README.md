# Workflows do GitHub Actions

Workflows ativos:

- `frontend-ci.yml`: instala dependencias, roda lint, testes (`vitest`) e build do frontend
- `backend-ci.yml`: valida API e worker Ruby, incluindo auth flow e idempotencia de seeds
- `docker-ci.yml`: valida Compose, helpers de health check e imagens Docker
- `e2e-auth-ci.yml`: sobe stack de aplicacao, valida auth integration (`vitest`) e E2E (`playwright`) em Chromium
