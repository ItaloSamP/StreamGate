# Sprint 7 Closeout

## Resultado

Sprint 7 fecha a paridade funcional do command center final do StreamGate e prepara o projeto para a branch de release. A entrega transforma a dashboard em superficie viva, expande backend/worker para realtime, exports, alert actions, formatos e conectores S3/HTTP, e sincroniza a documentacao para leitura profissional de produto, operacao e engenharia.

Leitura geral: `concluida`.

## Entregas Fechadas Por Trilha

- P0 Dashboard: command center data-driven com KPIs, series 24h, pipeline, distribuicao, formatos, heatmap, fila, ingestao, workers, alert strip, drawer e estados honestos.
- Back planning/execution: contrato expandido de dashboard, realtime tickets/events, exports auditaveis, alert actions, RBAC, retencao, ClickHouse-first e fallback Postgres.
- Worker execution: realtime best-effort, agregados ClickHouse, NDJSON, ZIP seguro, XLSX, Parquet condicionado ao runtime, cleanup, warnings e conectores S3/HTTP por lease.
- Front planning/execution: WebSocket + polling, exports backend, alert review/dismiss persistentes, quick upload compartilhado, settings/admin connectors e upload por connector profile.
- Connectors: perfis S3/HTTP admin-only, secrets criptografados, masking, anti-SSRF, leases internos e UX sem nova rota.
- DevOps: GitHub Actions confirmado como CI remoto oficial; CircleCI registrado como diagnostico externo sem config versionada; gates locais e full-closeout documentados.
- Test planning/execution: matriz cobre contratos, role/org, masking, realtime fallback, exports, alerts, quick upload, conectores e formatos.
- Security: threat model atualizado para realtime, exports, alert actions, S3/HTTP, leases, masking, SSRF e payloads warehouse.
- Documentation: README raiz, READMEs de apps, contracts, docs hub, testing baseline, DevOps, release checklist, final delivery guide, vision, API docs, runbooks e roadmap sincronizados.

## Escopo Consolidado

### Command Center

- `GET /api/v1/analytics/dashboard` aceita secoes expandidas e preserva compatibilidade.
- Dashboard declara `live`, `derived`, `empty`, `degraded` ou `backend-pending` em vez de fixture invisivel.
- Frontend consome snapshot REST, Action Cable por ticket curto e polling fallback.
- Exports CSV/JSON saem do backend via endpoint auditavel e mascarado.
- Alerts usam review/dismiss persistente com idempotencia e RBAC.

### Backend E Contratos

- OpenAPI e `packages/contracts` cobrem dashboard expandida, realtime, exports, alert actions, connector profiles, ingestions e leases.
- Leitura analitica prefere ClickHouse e degrada para Postgres com motivo, stale/SLO e warning tecnico.
- Mutacoes sensiveis exigem `Idempotency-Key`, motivo quando aplicavel, auditoria e permissao.
- Realtime events persistem payload sanitizado e expiram conforme politica operacional.

### Worker

- Worker processa CSV, JSON array, `{ records: [...] }`, NDJSON, ZIP com um arquivo suportado, XLSX e Parquet quando runtime nativo permite.
- ClickHouse recebe agregados e fingerprints, sem payload bruto de registros.
- Falhas de ClickHouse, realtime, cleanup ou conector viram warning quando nao devem bloquear artifacts/audit.
- Conectores S3/HTTP baixam por lease interno e publicam o fluxo padrao `upload.received.v1`.

### Frontend

- `/dashboard` validado com realtime, exports, alert strip, drawer e estados honestos.
- `/settings` ganhou painel admin-only para perfis S3/HTTP com secrets mascarados.
- `/upload` ganhou modo admin-only de ingestion por profile com `filename`, `content_type` e `object_key/source_path`.
- Operator nao ve controles sensiveis; admin ve detalhes tecnicos mascarados.

## Validacao Executada

### Backend, Worker E Contratos

- `cd apps/api && bundle exec rails test`
  - PASS
- `cd apps/worker && bundle exec rspec`
  - PASS
- `ruby scripts/ci/validate-operational-contracts.rb`
  - PASS
- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend`
  - PASS

### Frontend

- `cd apps/web && pnpm test:run`
  - PASS
- `cd apps/web && pnpm test:integration`
  - PASS
- `cd apps/web && pnpm build`
  - PASS
- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend`
  - PASS

### E2E, Docker, Smokes E Reports

- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 e2e`
  - PASS
- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 docker`
  - PASS
- `powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1`
  - PASS
- `powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout`
  - PASS

### Browser

- `/dashboard`: command center, realtime status, backend exports, alert strip, drawer e empty/degraded states.
- `/upload`: arquivo local, public link e modo conector admin-only.
- `/settings`: RBAC operator/admin, criacao/teste/status de perfis S3/HTTP e ausencia de segredos visiveis.
- `/clickhouse`, `/etl-explorer`, `/analytics`, `/events`, `/quarantine`, `/audit`: rotas protegidas e role gating.

## CI Remoto E PR

- PR alvo: `sprint7` -> `dev`.
- Merge: squash.
- Checks esperados: frontend, backend, docker e e2e-auth via GitHub Actions.
- CircleCI: sem config versionada no repositorio; tratar como check externo apenas se aparecer no PR.

## Riscos E Observacoes Nao Bloqueantes

- `google_drive` e `oauth_delegated` continuam discovery-only.
- Parquet depende de runtime nativo/gem disponivel no ambiente worker.
- Public link smoke usa fixture CSV publica padrao; `SMOKE_PUBLIC_LINK_URL` segue disponivel apenas para override.
- Branch de release deve fazer pente fino visual e UX amplo antes da finalizacao definitiva do projeto.
- Deploy produtivo em cluster, tracing distribuido completo e observabilidade avancada continuam fora do corte atual.

## Documentacao Atualizada

- `README.md`
- `apps/api/README.md`
- `apps/web/README.md`
- `apps/worker/README.md`
- `packages/contracts/README.md`
- `docs/README.md`
- `docs/product/vision.md`
- `docs/guides/platform/final-delivery-guide.md`
- `docs/guides/platform/devops-roadmap.md`
- `docs/guides/platform/release-rollback-checklist.md`
- `docs/guides/quality/testing-baseline.md`
- `docs/guides/backend/api-docs.md`
- `docs/guides/frontend/frontend-foundations.md`
- `docs/guides/frontend/frontend-workspace-map.md`
- `docs/guides/operations/worker-runtime-runbook.md`
- `docs/guides/security/streamgate-threat-model.md`
- `docs/planning/streamgate-full-sprints-roadmap.md`

## Transicao

- Fazer PR `sprint7` -> `dev`.
- Aguardar GitHub Actions verdes.
- Fazer squash merge.
- Atualizar `dev` local.
- Excluir `sprint7` local/remota.
- Criar `release` a partir de `dev` atualizado e fazer push.
