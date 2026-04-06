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

Hoje o frontend ja possui uma base relevante:

- landing page
- login, cadastro e reset
- route guard
- workspace autenticado segmentado por modulos
- auth mock para viabilizar a experiencia inicial
- camada HTTP oficial para a API
- testes de UX, navegacao e adapter

A troca do auth mock por integracao real continua prevista para a Sprint 2, mas a malha principal de rotas e a estrutura do workspace ja sao oficiais na Sprint 1.

As convencoes oficiais do frontend nesta fase estao em [docs/guides/frontend-foundations.md](C:/estudos/StreamGate/docs/guides/frontend-foundations.md) e [docs/guides/frontend-workspace-map.md](C:/estudos/StreamGate/docs/guides/frontend-workspace-map.md).

## Superficies oficiais da Sprint 1

A UI do projeto passa a assumir estas superficies como baseline oficial:

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

- sessao e perfil do usuario via storage local
- login, cadastro e reset sem backend real
- dados operacionais exibidos no dashboard
- leituras de jobs, analytics, quarentena e auditoria
- a chamada HTTP oficial ainda aponta para endpoints que serao materializados nas sprints seguintes

A estrutura visual dessas telas, porem, nao e provisoria. O mock atual substitui dados e auth, nao a linguagem de interface, a segmentacao do workspace nem a camada adapter.

## Rotas protegidas oficiais

A Sprint 1 fecha a navegacao autenticada com estas rotas:

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

O frontend agora passa a ter uma base de integracao oficial em `src/lib/api-client.ts` e `src/lib/streamgate-api.ts`.

Responsabilidades desta camada:

- centralizar `baseUrl` da API
- serializar query params
- padronizar envelopes de sucesso e erro
- carregar `request_id` e `trace_id` em erros da API
- evitar fetch ad hoc por tela

Toda integracao futura deve partir dessa camada antes de introduzir caches, query libraries ou polling mais sofisticado.

## Comandos locais

```bash
pnpm install
pnpm dev --host
pnpm lint
pnpm build
pnpm test:run
```

## Pilares de implementacao

Toda evolucao do frontend deve respeitar estes principios:

- preservar o modelo visual ja aprovado
- nao criar componentes paralelos sem necessidade
- tratar loading, empty state e erro como parte da entrega
- manter coerencia com `frontend-skill`, `web-design-guidelines`, `tailwind-design-system` e `vercel-react-best-practices`
- ampliar o workspace por modulos e adapters, nao por telas isoladas com fetch proprio

## Proximo passo esperado

A evolucao planejada do frontend esta em [docs/planning/streamgate-full-sprints-roadmap.md](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md), com foco em:

1. auth real
2. fluxo real de upload
3. dashboard operacional com dados reais
4. dashboard analitico conectado
