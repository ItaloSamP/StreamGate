# Workflows do GitHub Actions

Workflows ativos:

- `frontend-ci.yml`: instala dependencias, roda lint, testes (`vitest`) e build do frontend
- `backend-ci.yml`: valida API e worker Ruby, incluindo auth flow e idempotencia de seeds
- `docker-ci.yml`: valida Compose, helpers de health check e imagens Docker

O workflow legado de `opencode` foi removido porque nao faz mais parte do fluxo atual do projeto.
