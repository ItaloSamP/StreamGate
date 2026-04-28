# Sprint 6 - Frontend partial closeout

## Escopo fechado

- `Front planning` e `Front execution` da Sprint 6 foram fechadas sem marcar a Sprint 6 inteira como concluida.
- Dashboard final consome `GET /api/v1/analytics/dashboard` e removeu filas, workers, formatos e event log baseados em fixtures locais.
- `/clickhouse` consome `GET /api/v1/analytics/warehouse` e mostra fonte, fallback, dependencias, lag, stale, SLO, p95, error budget e agregados sem console de query livre.
- `/etl-explorer` consome `GET /api/v1/analytics/lineage?job_id=...`, auto-seleciona job recente quando necessario e mostra contexto de job/upload, batches, attempts, quarantine, artifacts, warnings e audit refs.
- Upload Center preserva arquivo local por signed URL e adiciona `public_link` via `POST /api/v1/uploads/public-link` com `Idempotency-Key` e acquisition mascarada.
- O shell neutralizou chips/gauges fixos para evitar telemetria falsa no chrome compartilhado.

## Fora do corte

- `oauth_delegated`, `google_drive`, `s3` e `http_url` continuam fora da Sprint 6.
- Frontend nao recebeu console SQL livre nem exploracao visual profunda de ClickHouse.
- Fechamento total da Sprint 6 depende dos gates finais e das trilhas DevOps/Test/Security/Documentation restantes.

## Evidencias locais

- `pnpm.cmd --dir apps/web test -- tests/unit/lib/streamgate-api.test.ts --runInBand`: PASS.
- `pnpm.cmd --dir apps/web test -- tests/unit/pages/workspace-routes.test.tsx tests/unit/pages/operational-pages.test.tsx tests/unit/pages/UploadPage.test.tsx --runInBand`: PASS.
- `pnpm.cmd --dir apps/web test:run`: PASS, 11 arquivos e 69 testes.
- `pnpm.cmd --dir apps/web test:integration`: primeira tentativa falhou por `ECONNREFUSED` em `localhost:3000`; apos `scripts/dev/dev-up.ps1 -Mode app`, PASS com 2 arquivos e 4 testes.
- `pnpm.cmd --dir apps/web build`: PASS.
- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend`: PASS.
- `powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1` com `SMOKE_PUBLIC_LINK_URL=https://raw.githubusercontent.com/plotly/datasets/master/2014_apple_stock.csv`: PASS.
- Verificacao visual Playwright desktop/mobile em `/dashboard`, `/clickhouse`, `/etl-explorer` e `/upload`: PASS; screenshots em `apps/web/e2e/reports/sprint6-visual` (artefato local ignorado pelo git).

## Risco residual

- CodeRabbit CLI nao esta instalado/autenticado neste ambiente ate esta parcial; tentativa `coderabbit review --agent -t uncommitted -c AGENTS.md` falhou com comando nao reconhecido.
- Revisao humana/local do diff foi feita junto dos gates; uma revisao CodeRabbit real deve ser repetida quando a CLI estiver instalada/autenticada.
