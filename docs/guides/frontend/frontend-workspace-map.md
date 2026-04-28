# Mapa do Workspace Frontend

## Objetivo

Este guia registra a malha oficial do workspace autenticado do StreamGate. Ele serve como mapa de produto e arquitetura para evitar que o dashboard volte a concentrar responsabilidades demais ou que novas telas nascam fora da linguagem operacional aprovada.

## Estado atual

Estado alinhado a entrega de frontend da Sprint 6:

- workspace protegido usa `DashboardSurface` + `WorkspacePageFrame`
- navegacao oficial vive em `workspace-config.ts`
- dashboard virou command center operacional real via `GET /api/v1/analytics/dashboard`, com secoes `live`, `derived`, `empty` ou `degraded`
- jobs, uploads, analytics, quarentena, DLQ, audit e event log consomem API real
- `/clickhouse` e `/etl-explorer` deixaram de ser placeholders e viraram drilldowns analiticos reais
- Upload Center suporta arquivo local e `public_link`; `oauth_delegated`, `google_drive`, `s3` e `http_url` seguem fora do corte funcional
- audit e DLQ sao admin-only
- operacoes mutaveis sensiveis vivem em painel admin-only dedicado
- notificacoes in-app usam sino na topbar, inbox completa, arquivamento e canais
- detalhe de job exibe historico de artefatos finais com download assinado
- badges de navegacao no dashboard usam dados reais quando habilitados
- chips e gauges fixos foram neutralizados para nao parecerem telemetria real
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
| `/clickhouse` | warehouse operacional, fallback e SLO | analise | admin/operator |
| `/quarantine` | triagem read-only de registros rejeitados | analise | admin/operator |
| `/etl-explorer` | lineage por job, batches, attempts, artefatos e audit refs | analise | admin/operator |
| `/quarantine/:id` | detalhe de registro em quarentena | analise | admin/operator |
| `/quarantine/dlq/:messageId` | detalhe de mensagem DLQ | sistema | admin |
| `/events` | event log operacional baseado em audit | analise | admin/operator |
| `/audit` | trilha de auditoria | sistema | admin |
| `/audit/:id` | detalhe de auditoria | sistema | admin |
| `/operations` | wizard de retry, resolve e replay DLQ | sistema | admin |
| `/notifications` | inbox, arquivadas, regras e canais | sistema | admin/operator |
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

### Organizacao de testes

O workspace separa runtime e verificacao:

- `apps/web/src`: codigo carregado pelo app.
- `apps/web/tests/unit`: Vitest unitario e de componentes.
- `apps/web/tests/integration`: Vitest de integracao contra backend real/local.
- `apps/web/e2e`: Playwright.

Essa separacao evita testes misturados com paginas e adapters, mantendo `src/pages`, `src/lib` e `src/features` mais faceis de navegar.

Paginas e fontes atuais:

- `DashboardPage`: `getAnalyticsDashboard`, `listJobs`, `listUploads`
- `AnalyticsPage`: `getAnalytics`
- `ClickHousePage`: `getAnalyticsWarehouse`
- `EtlExplorerPage`: `listJobs`, `getAnalyticsLineage`
- `QuarantinePage`: `listQuarantine`, `listQuarantineDlq`
- `AuditPage`: `listAuditEvents`
- `EventLogPage`: `listAuditEvents`
- `JobsPage`: `listJobs`
- `OperationsPage`: `retryJob`, `resolveQuarantine`, `createDlqReplayRequest`, `approveDlqReplayRequest`, `executeDlqReplayRequest`
- `NotificationsPage`: `listNotifications`, mutacoes de inbox, `getNotificationSettings`, `updateNotificationSettings`, `testWebhookNotification`
- `UploadPage`: `requestUploadSignedUrl`, `registerUpload`, `createPublicLinkUpload`, `listUploads`, `listJobs`
- `OperationalDetailPages`: listas oficiais filtradas por ID/search e `listJobArtifacts`/`createArtifactDownloadUrl`

### Dashboard, warehouse e lineage

Regras da Sprint 6:

- a dashboard nao usa mais `scaffoldQueue`, `scaffoldWorkers`, `scaffoldEventRows` ou `scaffoldFormatRows`
- ausencia de dado vira empty state explicito, nao numero sintetico
- `/clickhouse` exibe warehouse operacional denso, sem console de query livre
- `/etl-explorer` auto-seleciona um job recente quando `?job_id=` nao existe e grava a selecao na URL
- `event_log` da dashboard vem do contrato backend e deve permanecer compacto para leitura operacional

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

### Artefatos finais

O detalhe de job deve exibir os tres tipos oficiais quando existirem:

- `processed_dataset`
- `quality_report`
- `audit_report`

Regras de UX:

- agrupar historico por tipo e destacar a versao mais recente
- mostrar status, filename, tamanho, checksum, geracao e expiracao
- permitir download apenas quando o artefato estiver `available`
- gerar URL assinada curta via API antes de abrir o arquivo
- falhas de download devem orientar nova tentativa, sem expor storage key sensivel

### Notificacoes

O sino minimalista da topbar e o ponto unico de entrada para `/notifications`.

Regras de UX:

- bolinha vermelha indica notificacoes `unread`
- `Inbox` mostra notificacoes ativas e filtros por todas, nao lidas e lidas
- `Arquivadas` mostra itens com aviso de expiracao por retencao do backend
- `Regras e canais` mostra severidade derivada de `event_name` e configuracao `in_app`, `email`, `webhook`
- severidade visual usa `info`, `alerta` e `critico`
- acoes contextuais podem abrir job, artefatos, auditoria ou operacao segura quando metadata sanitizada permitir
- delecao e individual com confirmacao; acoes em massa ficam restritas a marcar visiveis como lidas e arquivar selecionadas

### Operacoes seguras

`/operations` e admin-only e concentra as mutacoes sensiveis da Sprint 5:

- retry de job
- resolve de quarantine record
- replay DLQ em tres etapas: request, approve e execute

O wizard deve sempre exigir alvo, revisao de regras, motivo operacional e confirmacao. Operadores nao veem rota, nav item ou controles sensiveis.

### Governanca de acesso

- `operator` nao ve `Auditoria` na sidebar
- `operator` nao acessa DLQ
- `admin` ve audit e DLQ
- paginas admin-only devem falhar de forma segura com access denied

## Validacao/Evidencias

Evidencias da trilha de frontend Sprint 6:

- testes de adapter cobrem `getAnalyticsDashboard`, `getAnalyticsWarehouse`, `getAnalyticsLineage` e `createPublicLinkUpload`
- testes de paginas cobrem dashboard sem fixtures enganosas, `/clickhouse`, `/etl-explorer`, Upload Center com arquivo local e `public_link`
- testes de rotas cobrem `/clickhouse` e `/etl-explorer` como rotas protegidas reais para operador
- `pnpm.cmd --dir apps/web test:run`, `pnpm.cmd --dir apps/web test:integration`, `pnpm.cmd --dir apps/web build`, `ci-local.ps1 frontend` e `run-smokes.ps1` com `SMOKE_PUBLIC_LINK_URL` passaram no fechamento do recorte
- verificacao visual desktop/mobile passou para dashboard, warehouse, lineage e Upload Center

## Referencias

- [Fundacoes do frontend](C:/estudos/StreamGate/docs/guides/frontend/frontend-foundations.md)
- [README do web](C:/estudos/StreamGate/apps/web/README.md)
- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
- [Governanca de documentacao](C:/estudos/StreamGate/docs/guides/operations/documentation-governance.md)
