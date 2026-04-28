# Sprint 6 Closeout

## Resultado

Sprint 6 foi fechada como a sprint de conclusao da v1 do StreamGate. O produto saiu de uma base operacional funcional para uma entrega final validada: dashboard real, drilldowns analiticos, warehouse ClickHouse com fallback honesto, lineage por job, `public_link` seguro, shell responsivo, Upload Center completo e documentacao sincronizada.

Nao ha bloqueador de implementacao aberto para a Sprint 6. A primeira execucao do gate Docker sem `SMOKE_PUBLIC_LINK_URL` falhou corretamente porque o smoke exige um CSV publico pequeno; a reexecucao com a variavel configurada passou e o full-closeout final ficou verde.

## Entregas fechadas por trilha

- Back planning/execution: endpoints Sprint 6, OpenAPI, contratos, dashboard real, warehouse, lineage, `public_link`, RBAC, org scoping, idempotencia e fallback `postgres_derived`.
- Worker execution: processor dedicado de `public_link`, streaming/spool controlado, hardening SSRF, DLQ dedicada, ClickHouse load nao bloqueante, warnings operacionais e backfill idempotente.
- Front planning/execution: dashboard command center sem fixtures enganosas, `/clickhouse` e `/etl-explorer` funcionais, Upload Center com arquivo local e link publico, shell desktop/mobile e navegacao por role.
- DevOps/testes: gates backend, frontend, e2e, docker, smokes e full-closeout executados com evidencia final.
- Security/documentation: threat model, API docs, roadmap, final delivery guide, workspace map, contracts e reports sincronizados com o corte real da v1.

## Escopo consolidado

### Backend e contratos

- `GET /api/v1/analytics/dashboard` entrega `sections.event_log` derivado de audit, warnings e metricas do worker, sem fixture local enganosa.
- `GET /api/v1/analytics/warehouse` le ClickHouse quando disponivel e degrada para `source=postgres_derived` com SLO, `dependency_status`, `fallback_reason` e warning tecnico.
- `GET /api/v1/analytics/lineage?job_id=...` sustenta drilldown por job com upload/acquisition, batches, attempts, quarantine, artifacts, warnings e audit refs.
- `POST /api/v1/uploads/public-link` cria upload/job/acquisition `public_link`, exige `Idempotency-Key`, mascara URL, persiste `url_hash` e respeita RBAC/org scoping.
- OpenAPI, `packages/contracts`, exemplos e docs da API foram atualizados no mesmo ciclo.

### Worker

- `PublicLinkFetcher` valida URL por `HEAD + GET`, limita redirects, bloqueia localhost/private/link-local/metadata IPs, protege contra DNS rebind e evita portas nao padrao.
- A aquisicao remota grava em MinIO por streaming, calcula SHA-256, publica `upload.received.v1` e reutiliza o pipeline principal.
- O processamento usa streaming/spool controlado, cleanup best effort e warning operacional quando cleanup/ClickHouse falha.
- CSV preserva comportamento atual; JSON aceita array de objetos e `{ "records": [...] }`; ZIP aceita 1 CSV e bloqueia zip slip/zip bomb.
- ClickHouse recebe camada por job e por registro com metadata + HMAC-SHA256, TTL de 30 dias e sem payload bruto.

### Frontend

- Dashboard consome `GET /api/v1/analytics/dashboard` e removeu filas, workers, formatos e event log baseados em fixtures locais.
- `/clickhouse` consome `GET /api/v1/analytics/warehouse` e mostra fonte, fallback, dependencias, lag, stale, SLO, p95, error budget e agregados sem console SQL livre.
- `/etl-explorer` consome `GET /api/v1/analytics/lineage?job_id=...`, auto-seleciona job recente quando necessario e grava `?job_id=...`.
- Upload Center preserva arquivo local por signed URL e adiciona `public_link` com acquisition mascarada e handoff para job.
- Shell neutralizou chips/gauges fixos para evitar telemetria falsa no chrome compartilhado.

## Evidencias principais

### Backend, worker e contratos

- `cd apps/api && bundle exec rails test test/requests/sprint6_backend_test.rb`
  - PASS
  - `7 runs, 57 assertions, 0 failures`
- `ruby scripts/ci/validate-operational-contracts.rb`
  - PASS
- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend`
  - PASS
  - API: `70 runs, 396 assertions, 0 failures`
  - Worker: `35 examples, 0 failures`

### Frontend e e2e

- `pnpm.cmd --dir apps/web test -- tests/unit/lib/streamgate-api.test.ts --runInBand`
  - PASS
- `pnpm.cmd --dir apps/web test -- tests/unit/pages/workspace-routes.test.tsx tests/unit/pages/operational-pages.test.tsx tests/unit/pages/UploadPage.test.tsx --runInBand`
  - PASS
- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend`
  - PASS
  - Unit: `11 files`, `69 tests`
  - TypeScript e build de producao verdes
- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 e2e`
  - PASS
  - Vitest integration: `4 tests`
  - Playwright Chromium: `5 tests`

### Docker, smokes e reports

- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 docker`
  - PASS com `SMOKE_PUBLIC_LINK_URL=https://raw.githubusercontent.com/plotly/datasets/master/2014_apple_stock.csv`
- `powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1 -TimeoutSeconds 900`
  - PASS com `SMOKE_PUBLIC_LINK_URL`
  - cobriu upload assinado, worker operacional, `public_link`, artefatos, notificacao, operacao segura, auditoria persistida e deliveries
- `powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout -TimeoutSeconds 900`
  - PASS com `SMOKE_PUBLIC_LINK_URL`
  - `docs/reports/index.html` atualizado com `PASS:7 FAIL:0 NOT_RUN:0`
- Verificacao visual Playwright desktop/mobile em `/dashboard`, `/clickhouse`, `/etl-explorer` e `/upload`
  - PASS
  - screenshots locais em `apps/web/e2e/reports/sprint6-visual`, ignorados pelo git

## Leitura de cobertura

- API manteve o fechamento funcional com request tests de dashboard, warehouse, lineage, RBAC, org scoping, fallback e `public_link`.
- Worker cobriu o risco central da sprint: aquisicao remota segura, parsing/streaming, warnings nao bloqueantes, ClickHouse, backfill e DLQ dedicada.
- Frontend cobriu contratos do client, dashboard sem fixtures, warehouse, lineage, Upload Center, role gating, shell e verificacao visual desktop/mobile.
- Os smokes provaram a historia operacional completa, incluindo `public_link` real ate artefatos e notificacao.

## Riscos e observacoes nao bloqueantes

- CodeRabbit CLI nao estava instalado/reconhecido no ambiente local durante a frente frontend; a revisao assistida permanece melhoria operacional pos-v1, nao gate de release.
- `google_drive`, `s3`, `http_url` e `oauth_delegated` continuam fora da entrega funcional e devem receber sprint propria antes de qualquer exposicao como feature entregue.
- A politica oficial segue `WSL/Compose-first` para gates pesados, com Windows host suportado para checks rapidos e suporte local.

## Pos-v1

- Evoluir conectores externos alem de `public_link`.
- Considerar SSE/WebSocket para reduzir polling depois que o usage real do dashboard justificar.
- Ampliar RBAC granular por modulo/recurso/acao operacional.
- Instalar/autenticar CodeRabbit CLI no ambiente local ou mover a revisao assistida para CI/PR.
