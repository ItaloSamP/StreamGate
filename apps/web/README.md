# StreamGate Web

Frontend React do StreamGate.

## Objetivo

O `apps/web` entrega a experiencia publica, autenticacao e workspace operacional do StreamGate. A partir da Sprint 6, o workspace autenticado fecha dashboard, warehouse, lineage e ingestao `public_link` como superficies reais da v1, sem fixtures enganosas no fluxo principal.

## Estado atual

Estado alinhado a entrega de frontend da Sprint 6:

- landing page publica preservada como superficie de produto
- login, cadastro e reset conectados na API real
- route guard com tratamento de sessao expirada e acesso negado
- workspace autenticado segmentado por modulos
- auth real integrado (`register`, `login`, `logout`, `me`, `session/refresh`, reset)
- camada HTTP oficial para API (`api-client` e `streamgate-api`)
- fluxo real de upload assinado em `/upload`
- listagem real de jobs em `/jobs` com filtro e paginacao na URL
- command center real em `/dashboard`
- dashboard final via `getAnalyticsDashboard`, com empty/degraded/fallback honestos
- leitura real de `/analytics`, `/quarantine`, `/quarantine/dlq`, `/audit`, `/events`, `/jobs` e `/uploads`
- `/clickhouse` como warehouse operacional via `getAnalyticsWarehouse`
- `/etl-explorer` como lineage por job via `getAnalyticsLineage`
- Upload Center com arquivo local e `public_link` via `createPublicLinkUpload`
- rotas internas de detalhe para investigacao operacional
- export CSV client-side para listas carregadas na tela
- mascaramento visual de payloads e metadados sensiveis
- badges reais de navegacao no dashboard
- auditoria e DLQ visiveis apenas para `admin`

As convencoes oficiais desta fase estao em [docs/guides/frontend/frontend-foundations.md](C:/estudos/StreamGate/docs/guides/frontend/frontend-foundations.md), [docs/guides/frontend/frontend-workspace-map.md](C:/estudos/StreamGate/docs/guides/frontend/frontend-workspace-map.md) e [docs/guides/backend/authentication-guide.md](C:/estudos/StreamGate/docs/guides/backend/authentication-guide.md).

## Superficies oficiais

A UI do projeto assume estas superficies como baseline oficial:

- `LandingPage` como superficie publica de produto
- `AuthShell` como casca oficial de login, cadastro e reset
- `DashboardSurface` como shell autenticado compartilhado
- `DashboardPage`, `UploadPage`, `JobsPage`, `AnalyticsPage`, `ClickHousePage`, `EtlExplorerPage`, `QuarantinePage`, `EventLogPage`, `AuditPage` e `SettingsPage` como modulos oficiais do workspace
- `OperationalDetailPages` para leitura contextual de jobs, quarentena, DLQ e auditoria

Antes de criar novas variacoes, o app deve reaproveitar:

- `StreamGateMark`, `SectionLabel`, `ShellPanel`
- `Button`, `Input`, `Label`
- `ProtectedRoute`, `AuthProvider` e `WorkspacePageFrame`
- `DashboardSurface`, `WorkspaceOverview`, `WorkspaceModule` e `OperationalToolbar`
- helpers de `src/lib/operational-utils.ts` para query state, CSV, timestamps, masking e erros humanos

## Dados reais e fronteiras

Nesta fase, os modulos protegidos abaixo consomem dados reais via adapter oficial:

- `/dashboard`: snapshot de command center via `analytics/dashboard`, jobs recentes e uploads recentes
- `/analytics`: KPIs e breakdowns por `status`, `actor` e `source`
- `/clickhouse`: fonte, fallback, dependencias, SLO e agregados do warehouse
- `/etl-explorer`: job, upload/acquisition, batches, attempts, quarantine, artifacts, warnings e audit refs
- `/quarantine`: registros de quarentena e DLQ admin-only
- `/events`: event log operacional baseado em `/audit`
- `/audit`: trilha de auditoria admin-only
- `/jobs`: jobs reais com filtro/paginacao e export CSV da lista carregada
- `/upload`: fluxo real de upload assinado, registro de job e `public_link`

Ainda permanecem fora do escopo funcional desta sprint:

- polling automatico
- mutacoes operacionais (`retry`, `resolve`, `replay`, `delete`, `acknowledge`, `reprocess`)
- exportacao server-side de toda a base
- visualizacoes analiticas historicas avancadas
- conectores externos alem de `public_link` (`oauth_delegated`, `google_drive`, `s3`, `http_url`)

## Rotas protegidas oficiais

A navegacao autenticada oficial contem estas rotas:

- `/dashboard`
- `/upload`
- `/jobs`
- `/jobs/:id`
- `/analytics`
- `/clickhouse`
- `/quarantine`
- `/etl-explorer`
- `/quarantine/:id`
- `/quarantine/dlq/:messageId`
- `/events`
- `/audit`
- `/audit/:id`
- `/settings`

`/audit`, `/audit/:id` e a superficie de DLQ sao admin-only. Operadores permanecem com leitura operacional restrita aos modulos permitidos.

## Camada HTTP oficial

O frontend tem uma base de integracao oficial em `src/lib/api-client.ts` e `src/lib/streamgate-api.ts`.

Responsabilidades desta camada:

- centralizar `baseUrl` da API
- serializar query params
- padronizar envelopes de sucesso e erro
- carregar `request_id` e `trace_id` em erros da API
- aplicar `Authorization` de sessao de forma centralizada
- tratar expiracao/negacao de sessao sem acoplamento de pagina
- evitar fetch ad hoc por tela

Adapters oficiais da fase atual:

- `requestUploadSignedUrl`
- `registerUpload`
- `listUploads`
- `listJobs`
- `getAnalytics`
- `getAnalyticsDashboard`
- `getAnalyticsWarehouse`
- `getAnalyticsLineage`
- `createPublicLinkUpload`
- `listQuarantine`
- `listQuarantineDlq`
- `listAuditEvents`

Toda integracao futura deve partir dessa camada antes de introduzir caches, query libraries, polling ou agregadores mais sofisticados.

## Regras/Contratos

Toda evolucao do frontend deve respeitar estes principios:

- preservar o modelo visual ja aprovado
- nao criar componentes paralelos sem necessidade
- tratar `loading`, `empty`, `error`, `access denied`, `success` e `stale` como parte da entrega
- manter filtros operacionais em URL quando afetarem leitura compartilhavel
- mascarar payloads/metadados sensiveis no cliente antes de renderizar previews ou CSV
- exportar CSV apenas do conjunto carregado na tela
- preservar `api-client` e `streamgate-api` como fronteira unica de consumo HTTP
- usar `documentation-writer` para qualquer atualizacao documental
- usar `api-documenter` + `openapi` quando a mudanca tocar contrato/API

## Validacao/Evidencias

Validacoes executadas na trilha de frontend Sprint 6:

- testes focados de adapter, dashboard, `/clickhouse`, `/etl-explorer`, Upload Center e rotas protegidas passaram no ciclo de implementacao
- `pnpm.cmd --dir apps/web test:run`, `pnpm.cmd --dir apps/web test:integration`, `pnpm.cmd --dir apps/web build`, `ci-local.ps1 frontend` e `run-smokes.ps1` com `SMOKE_PUBLIC_LINK_URL` passaram no fechamento do recorte Sprint 6
- verificacao visual desktop/mobile passou nas rotas principais alteradas

Para validar E2E localmente, suba o web server antes do comando ou use `scripts/dev/dev-up.ps1 -Mode app`.

## Reports locais

- Testes Vitest ficam em `apps/web/tests`, separados do runtime em `apps/web/src`.
- `apps/web/tests/unit` cobre adapters, paginas, componentes e features com jsdom.
- `apps/web/tests/integration` cobre integracoes Vitest contra backend real/local.
- `apps/web/e2e` permanece reservado para Playwright.
- `pnpm test:run` gera logs, resumo HTML e coverage em `apps/web/reports/unit/`.
- `pnpm test:integration` gera logs, resumo HTML e coverage em `apps/web/reports/integration/`.
- `pnpm test:e2e` gera logs e Playwright HTML report em `apps/web/e2e/reports/`.
- Para uma varredura completa do produto, use `scripts/reports/run-all-reports.ps1` ou `scripts/reports/run-all-reports.sh` na raiz.

## Referencias

- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
- [Fundacoes do frontend](C:/estudos/StreamGate/docs/guides/frontend/frontend-foundations.md)
- [Mapa do workspace frontend](C:/estudos/StreamGate/docs/guides/frontend/frontend-workspace-map.md)
- [Guia de autenticacao](C:/estudos/StreamGate/docs/guides/backend/authentication-guide.md)
- [Baseline de testes e reports](C:/estudos/StreamGate/docs/guides/quality/testing-baseline-sprint-0.md)
