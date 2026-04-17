# Mapa do Workspace Frontend

## Objetivo

Este guia registra a malha oficial do workspace autenticado do StreamGate. Ele serve como mapa de produto e arquitetura para evitar que o dashboard volte a concentrar responsabilidades demais ou que novas telas nascam fora da linguagem operacional aprovada.

## Estado atual

Estado alinhado a entrega de frontend da Sprint 4:

- workspace protegido usa `DashboardSurface` + `WorkspacePageFrame`
- navegacao oficial vive em `workspace-config.ts`
- dashboard virou command center operacional real
- jobs, uploads, analytics, quarentena, DLQ, audit e event log consomem API real
- audit e DLQ sao admin-only
- badges de navegacao no dashboard usam dados reais
- filtros operacionais sao refletidos em URL
- rotas de detalhe permitem investigacao compartilhavel por ID

## Regras/Contratos

### Shell oficial

O shell autenticado compartilhado e composto por:

- `DashboardSurface`: sidebar, topbar, alert strip e linguagem visual base
- `WorkspacePageFrame`: wrapper de sessao, role e navegacao
- `WorkspaceOverview`: visao geral do dashboard quando aplicavel
- `WorkspaceModule`: scaffold padrao para superficies protegidas
- `OperationalToolbar`: filtros, refresh, export e frescor de dados
- `OperationalStateBlock`: estados de loading, empty, error e access denied

Toda nova pagina autenticada deve nascer a partir dessa pilha antes de propor um shell paralelo.

### Rotas protegidas oficiais

| Rota | Papel | Familia | Acesso |
| --- | --- | --- | --- |
| `/dashboard` | command center operacional | principal | admin/operator |
| `/upload` | entrada de ingestao | principal | admin/operator |
| `/jobs` | leitura de execucao | principal | admin/operator |
| `/jobs/:id` | detalhe de job | principal | admin/operator |
| `/analytics` | metricas e leitura agregada | analise | admin/operator |
| `/quarantine` | triagem read-only de registros rejeitados | analise | admin/operator |
| `/quarantine/:id` | detalhe de registro em quarentena | analise | admin/operator |
| `/quarantine/dlq/:messageId` | detalhe de mensagem DLQ | sistema | admin |
| `/events` | event log operacional baseado em audit | analise | admin/operator |
| `/audit` | trilha de auditoria | sistema | admin |
| `/audit/:id` | detalhe de auditoria | sistema | admin |
| `/settings` | defaults e configuracoes | sistema | admin/operator |

### Configuracao central

A fonte de verdade da navegacao vive em `apps/web/src/components/app/workspace-config.ts`.

Este arquivo define:

- grupos e ordem da sidebar
- metadata de modulos
- restricao admin-only
- estados oficiais de job na UI
- badges dinamicos quando habilitados pelo dashboard

Mudancas de navegacao devem partir dessa configuracao antes de alterar paginas individualmente.

### Integração de dados

Toda pagina protegida deve consumir a camada HTTP oficial:

- `apps/web/src/lib/api-client.ts`
- `apps/web/src/lib/streamgate-api.ts`

Paginas e fontes atuais:

- `DashboardPage`: `getAnalytics`, `listJobs`, `listUploads`, `listQuarantine`, `listAuditEvents`, `listQuarantineDlq`
- `AnalyticsPage`: `getAnalytics`
- `QuarantinePage`: `listQuarantine`, `listQuarantineDlq`
- `AuditPage`: `listAuditEvents`
- `EventLogPage`: `listAuditEvents`
- `JobsPage`: `listJobs`
- `UploadPage`: `requestUploadSignedUrl`, `registerUpload`, `listUploads`, `listJobs`
- `OperationalDetailPages`: listas oficiais filtradas por ID/search

### Query state e refresh

Regras atuais:

- filtros e paginacao operacionais ficam em URL
- `preset=last_7d`, `timezone=UTC`, `page=1`, `per_page=20` sao defaults comuns
- refresh e manual via `Recarregar`
- `lastUpdatedAt` deve ficar visivel em telas operacionais
- stale state deve indicar leitura potencialmente antiga sem iniciar polling automatico

### Investigacao operacional

Rotas de detalhe devem oferecer:

- contexto principal do item
- IDs copiaveis
- links para entidades relacionadas quando existirem
- metadata/payload mascarado
- JSON expandido colapsado por padrao
- link atual copiavel quando util

### Governanca de acesso

- `operator` nao ve `Auditoria` na sidebar
- `operator` nao acessa DLQ
- `admin` ve audit e DLQ
- paginas admin-only devem falhar de forma segura com access denied

## Validacao/Evidencias

Evidencias da trilha de frontend Sprint 4:

- testes de adapter cobrem endpoints reais e query params novos
- testes de paginas cobrem analytics, quarantine, audit/event log, dashboard, navegacao por role e rotas de detalhe
- `pnpm.cmd test:run`: aprovado, 11 arquivos e 53 testes
- `pnpm.cmd lint`: aprovado sem warnings
- `pnpm.cmd build`: aprovado com permissao escalada por restricao de sandbox
- `pnpm.cmd test:e2e`: aprovado contra ambiente Docker `app` saudavel em `http://localhost:5173`

## Referencias

- [Fundacoes do frontend](C:/estudos/StreamGate/docs/guides/frontend/frontend-foundations.md)
- [README do web](C:/estudos/StreamGate/apps/web/README.md)
- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
- [Governanca de documentacao](C:/estudos/StreamGate/docs/guides/operations/documentation-governance.md)
