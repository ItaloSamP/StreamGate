# StreamGate Web

Frontend React do StreamGate.

## Papel do app

A aplicacao web e responsavel por:

- apresentar a experiencia publica do produto
- autenticar o usuario
- iniciar uploads
- acompanhar jobs, quarentena e dashboards
- manter a linguagem visual oficial do projeto

## Estado atual

No fechamento da Sprint 3, o frontend possui:

- landing page
- login, cadastro e reset conectados na API real
- route guard com tratamento de sessao expirada
- workspace autenticado segmentado por modulos
- auth real integrado (`register`, `login`, `logout`, `me`, `session/refresh`, reset)
- camada HTTP oficial para API (`api-client` e `streamgate-api`)
- fluxo real de upload assinado em `/upload` (assinar, enviar, confirmar, atualizar listas)
- listagem real de jobs em `/jobs` com filtro/paginacao na URL
- suites de teste unitaria, integracao (backend real) e E2E

As convencoes oficiais desta fase estao em [docs/guides/frontend-foundations.md](C:/estudos/StreamGate/docs/guides/frontend-foundations.md), [docs/guides/frontend-workspace-map.md](C:/estudos/StreamGate/docs/guides/frontend-workspace-map.md) e [docs/guides/authentication-guide.md](C:/estudos/StreamGate/docs/guides/authentication-guide.md).

## Superficies oficiais

A UI do projeto assume estas superficies como baseline oficial:

- `LandingPage` como superficie publica de produto
- `AuthShell` como casca oficial de login, cadastro e reset
- `DashboardSurface` como shell autenticado compartilhado
- `DashboardPage`, `UploadPage`, `JobsPage`, `AnalyticsPage`, `QuarantinePage`, `EventLogPage`, `AuditPage` e `SettingsPage` como modulos oficiais do workspace

Antes de criar novas variacoes, o app deve reaproveitar:

- `StreamGateMark`, `SectionLabel`, `ShellPanel`
- `Button`, `Input`, `Label`
- `ProtectedRoute`, `AuthProvider` e `WorkspacePageFrame`
- `DashboardSurface`, `WorkspaceOverview` e `WorkspaceModule`

## O que ainda e mock

Nesta fase, ainda sao mockados no cliente:

- dados operacionais exibidos no dashboard
- analytics, quarentena, event log e auditoria em profundidade
- algumas superficies de modulo que ainda servem como scaffold visual

A estrutura visual dessas telas nao e provisoria. O mock atual substitui dados de dominio, nao a linguagem de interface, a segmentacao do workspace nem a camada adapter.

## Rotas protegidas oficiais

A navegacao autenticada oficial contem estas rotas:

- `/dashboard`
- `/upload`
- `/jobs`
- `/analytics`
- `/quarantine`
- `/events`
- `/audit`
- `/settings`

Essa malha existe para evitar que o dashboard vire uma unica tela monolitica conforme o produto crescer.

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

Para a trilha de upload/job da Sprint 3, o adapter inclui:

- `requestUploadSignedUrl`
- `registerUpload`
- `listUploads`
- `listJobs`

Toda integracao futura deve partir dessa camada antes de introduzir caches, query libraries ou polling mais sofisticado.

## Comandos locais

```bash
pnpm install
pnpm dev --host
pnpm lint
pnpm build
pnpm test:run
pnpm test:integration
pnpm test:e2e
```

## Pilares de implementacao

Toda evolucao do frontend deve respeitar estes principios:

- preservar o modelo visual ja aprovado
- nao criar componentes paralelos sem necessidade
- tratar loading, empty state e erro como parte da entrega
- manter coerencia com `frontend-skill`, `web-design-guidelines`, `tailwind-design-system` e `vercel-react-best-practices`
- ampliar o workspace por modulos e adapters, nao por telas isoladas com fetch proprio

## Proximos passos esperados

A evolucao planejada do frontend esta em [docs/planning/streamgate-full-sprints-roadmap.md](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md), com foco em:

1. ampliar dados reais nos modulos alem de upload/job
2. dashboard operacional consolidado com dados de dominio
3. dashboard analitico conectado
4. suporte futuro a ingestao por link/conector (fora da Sprint 3 base)

## Gate de prontidao da Sprint 2.5

A Sprint 2.5 fechou ajustes estruturais sem abrir feature nova de dominio:

- adapter streamgate-api alinhado para namespace /api/v1 em listagens de jobs e uploads;
- suporte a envelope completo (data + meta) no api-client para preparar paginacao/filters da Sprint 3;
- matriz minima de estados (loading, empty, error, success) consolidada nos guias de frontend para evitar retrabalho.
