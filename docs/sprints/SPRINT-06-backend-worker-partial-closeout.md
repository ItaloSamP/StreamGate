# Sprint 6 backend/worker closeout

Este closeout marca somente as trilhas `Back planning`, `Back execution` e `Worker execution` da Sprint 6. A Sprint 6 completa continua aberta para frontend, UX final, DevOps/testes globais e fechamento geral da v1.

## Entregue

- Endpoints `GET /api/v1/analytics/dashboard`, `GET /api/v1/analytics/warehouse` e `GET /api/v1/analytics/lineage?job_id=...`.
- `sections.event_log` requerido na dashboard, derivado de audit, warnings e metricas do worker.
- ClickHouse real como warehouse OLAP minimo, com tabelas de job e registros, TTL de 30 dias, metadata + HMAC-SHA256 e sem payload bruto.
- Fallback honesto `postgres_derived` quando ClickHouse estiver indisponivel, com SLO, `dependency_status`, `fallback_reason` e warning tecnico.
- `POST /api/v1/uploads/public-link` com `Idempotency-Key`, URL mascarada, `url_hash`, upload/job `external_link` e acquisition `public_link`.
- `uploads.source_type`, `upload_acquisitions` e `operational_warnings`.
- Worker com `PublicLinkFetcher`, validacao SSRF, stream para MinIO, SHA-256 e evento derivado `upload.received.v1`.
- Worker com carga ClickHouse nao bloqueante, schema idempotente, backfill idempotente e warnings para falhas tecnicas.
- Parser do worker expandido para JSON array, JSON `{ "records": [...] }` e ZIP com protecao contra zip slip e zip bomb.
- Smoke dedicado `public_link` configuravel por `SMOKE_PUBLIC_LINK_URL`, falhando explicitamente se a URL publica CSV nao for informada.
- Contratos, exemplos, OpenAPI, guia da API, vision, final delivery guide, threat model e roadmap sincronizados.

## Validado neste recorte

- `cd apps/api && bundle exec rails test test/requests/sprint6_backend_test.rb` (7 runs, 57 assertions, 0 failures).
- `cd apps/api && bundle exec rails test` with `PARALLEL_WORKERS=1` (70 runs, 396 assertions, 0 failures).
- `cd apps/worker && bundle exec rspec` (35 examples, 0 failures).
- `ruby scripts/ci/validate-operational-contracts.rb`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend` with `PARALLEL_WORKERS=1` (PASS).
- `powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1` with `SMOKE_PUBLIC_LINK_URL=https://raw.githubusercontent.com/plotly/datasets/master/2014_apple_stock.csv` (PASS).

## Pendencias fora deste closeout parcial

- `run-smokes` exige `SMOKE_PUBLIC_LINK_URL` apontando para CSV pequeno publico para validar o caminho feliz de `public_link`.
- Trilha frontend da Sprint 6 ainda deve consumir os contratos novos e remover fixtures enganosas da dashboard.
