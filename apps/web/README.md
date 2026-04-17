# StreamGate Web

Frontend React do StreamGate.

## Objetivo

O `apps/web` entrega a experiencia publica, autenticacao e workspace operacional do StreamGate. A partir da Sprint 4, o workspace autenticado deixa de ser apenas scaffold visual para os modulos operacionais e passa a funcionar como command center read-only conectado aos dados reais do backend.

## Estado atual

Estado alinhado a entrega de frontend da Sprint 4:

- landing page publica preservada como superficie de produto
- login, cadastro e reset conectados na API real
- route guard com tratamento de sessao expirada e acesso negado
- workspace autenticado segmentado por modulos
- auth real integrado (`register`, `login`, `logout`, `me`, `session/refresh`, reset)
- camada HTTP oficial para API (`api-client` e `streamgate-api`)
- fluxo real de upload assinado em `/upload`
- listagem real de jobs em `/jobs` com filtro e paginacao na URL
- command center real em `/dashboard`
- leitura real de `/analytics`, `/quarantine`, `/quarantine/dlq`, `/audit`, `/events`, `/jobs` e `/uploads`
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
- `DashboardPage`, `UploadPage`, `JobsPage`, `AnalyticsPage`, `QuarantinePage`, `EventLogPage`, `AuditPage` e `SettingsPage` como modulos oficiais do workspace
- `OperationalDetailPages` para leitura contextual de jobs, quarentena, DLQ e auditoria

Antes de criar novas variacoes, o app deve reaproveitar:

- `StreamGateMark`, `SectionLabel`, `ShellPanel`
- `Button`, `Input`, `Label`
- `ProtectedRoute`, `AuthProvider` e `WorkspacePageFrame`
- `DashboardSurface`, `WorkspaceOverview`, `WorkspaceModule` e `OperationalToolbar`
- helpers de `src/lib/operational-utils.ts` para query state, CSV, timestamps, masking e erros humanos

## Dados reais e fronteiras

Nesta fase, os modulos protegidos abaixo consomem dados reais via adapter oficial:

- `/dashboard`: KPIs, jobs recentes, uploads recentes, quarentena recente, audit/DLQ admin-only
- `/analytics`: KPIs e breakdowns por `status`, `actor` e `source`
- `/quarantine`: registros de quarentena e DLQ admin-only
- `/events`: event log operacional baseado em `/audit`
- `/audit`: trilha de auditoria admin-only
- `/jobs`: jobs reais com filtro/paginacao e export CSV da lista carregada
- `/upload`: fluxo real de upload assinado e registro de job

Ainda permanecem fora do escopo funcional desta sprint:

- polling automatico
- mutacoes operacionais (`retry`, `resolve`, `replay`, `delete`, `acknowledge`, `reprocess`)
- exportacao server-side de toda a base
- visualizacoes analiticas historicas avancadas
- conectores externos (`external_link`, `oauth_delegated`, `google_drive`, `s3`, `http_url`)

## Rotas protegidas oficiais

A navegacao autenticada oficial contem estas rotas:

- `/dashboard`
- `/upload`
- `/jobs`
- `/jobs/:id`
- `/analytics`
- `/quarantine`
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

Validacoes executadas na trilha de frontend Sprint 4:

- `pnpm.cmd test:run`: aprovado, 11 arquivos de teste e 53 testes
- `pnpm.cmd lint`: aprovado sem warnings
- `pnpm.cmd build`: aprovado com permissao escalada por restricao de sandbox ao Vite/Tailwind
- `pnpm.cmd test:e2e`: aprovado contra ambiente Docker `app` saudavel em `http://localhost:5173`

Para validar E2E localmente, suba o web server antes do comando ou use `scripts/dev/dev-up.ps1 -Mode app`.

## Reports locais

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
