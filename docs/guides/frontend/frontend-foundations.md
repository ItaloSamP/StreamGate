# Fundacoes do Frontend

## Objetivo

Este guia fixa as regras de arquitetura, interface e integracao do frontend do StreamGate. Ele existe para manter a experiencia consistente enquanto o produto evolui de telas scaffold para operacao real.

## Estado atual

Estado alinhado a trilha de frontend operacional:

- superficies publicas e autenticadas usam linguagem visual consolidada desde as Ciclos de entrega 0 e 1
- auth real esta conectado a API (`register`, `login`, `logout`, `me`, `session/refresh`, reset)
- `/upload` e `/jobs` consomem dados reais desde a entrega de upload/job
- `/dashboard`, `/analytics`, `/clickhouse`, `/etl-explorer`, `/quarantine`, `/events` e `/audit` consomem dados reais
- `/upload` suporta arquivo local e `public_link`, mantendo conectores wave 1 fora do corte funcional
- `/audit` e DLQ sao superficies admin-only
- filtros operacionais usam URL state compartilhavel
- payloads/metadados sensiveis sao mascarados antes de renderizar previews ou CSV
- refresh e frescor de dados sao explicitos, sem polling automatico neste ciclo de entrega

## Regras/Contratos

### Superficies publicas

Telas publicas sao acessiveis sem sessao e devem apresentar o produto ou preparar a entrada do usuario.

Entram nesta categoria:

- `LandingPage`
- `LoginPage`
- `RegisterPage`
- `ResetPasswordPage`

Regras:

- comunicar a identidade visual oficial do produto
- nao depender de dados operacionais reais para funcionar
- nao expor dados internos do pipeline nem controles operacionais reais
- manter foco em orientacao, entrada e narrativa de produto

### Superficies autenticadas

Telas autenticadas existem para operar, monitorar ou consultar o produto apos sessao validada.

Entram nesta categoria:

- `DashboardPage`
- `UploadPage`
- `JobsPage`
- `AnalyticsPage`
- `QuarantinePage`
- `EventLogPage`
- `AuditPage`
- `SettingsPage`
- paginas de detalhe protegidas por `ProtectedRoute`

Regras:

- exigir sessao ativa
- renderizar dentro de `WorkspacePageFrame` e `DashboardSurface`
- privilegiar leitura operacional, densidade informacional e clareza de acao
- tratar loading, empty, error, access denied, success e stale como parte da entrega
- evitar hero marketing, banners promocionais ou shells paralelos dentro do workspace

### Componentes e layouts base

Antes de criar novos componentes, reaproveitar:

- `StreamGateMark`
- `SectionLabel`
- `ShellPanel`
- `AuthShell`
- `DashboardSurface`
- `WorkspacePageFrame`
- `WorkspaceOverview`
- `WorkspaceModule`
- `OperationalToolbar`
- `OperationalStateBlock`
- `IdCopy`
- `JsonPreview`
- `Button`
- `Input`
- `Label`

Um componente novo so deve nascer quando a base existente falhar estruturalmente para o caso de uso, e nao apenas por preferencia local.

### Camada de dados

A fronteira HTTP oficial vive em:

- `src/lib/api-client.ts`
- `src/lib/streamgate-api.ts`

Regras:

- toda chamada HTTP nova deve partir do adapter oficial
- envelopes de sucesso e erro devem seguir o contrato da API
- erros devem preservar `request_id`, `trace_id`, `code` e `details` quando existirem
- serializacao de query params deve ficar centralizada
- paginas nao devem implementar `fetch` ad hoc
- cache/polling futuros nao podem quebrar a camada adapter

Adapters reais disponiveis na workspace operacional:

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

### URL state operacional

Filtros que alteram a leitura operacional devem ser compartilhaveis por URL.

Defaults atuais:

- `preset=last_7d`
- `timezone=UTC`
- `page=1`
- `per_page=20`
- `sort_order=desc`

Campos comuns:

- `preset`
- `from`
- `to`
- `timezone`
- `sort_by`
- `sort_order`
- `page`
- `per_page`
- `search`

### Estados oficiais de interface

Loading:

- preservar layout e evitar salto visual
- sinalizar operacao em andamento no bloco afetado
- usar loading global apenas quando a tela inteira depender do carregamento

Empty:

- explicar o que esta vazio e por que isso pode acontecer
- oferecer proxima acao quando houver acao segura
- manter linguagem utilitaria, nao marketing

Error:

- preservar contexto do modulo
- permitir retry quando fizer sentido
- traduzir `validation_failed` para detalhes por campo quando disponivel
- traduzir 403 para permissao negada
- traduzir 503 em DLQ como dependencia indisponivel

Access denied:

- esconder auditoria e DLQ para operadores na navegacao
- renderizar mensagem clara quando um usuario sem permissao acessar rota direta

Success:

- confirmar transicoes sem competir com a hierarquia principal
- usar atualizacao de dados como feedback quando o resultado for obvio

Stale:

- exibir `lastUpdatedAt`
- marcar leitura como stale apos alguns minutos sem refresh
- nao adicionar polling automatico neste ciclo de entrega

### Dados sensiveis

O frontend deve mascarar payloads/metadados antes de renderizar preview ou CSV.

Regras:

- exibir apenas campos seguros por allowlist visual
- colapsar JSON expandido por padrao
- nunca exportar campos sensiveis bloqueados no CSV client-side
- oferecer copy buttons apenas para identificadores operacionais seguros (`job_id`, `upload_id`, `trace_id`, `request_id`, `actor_id`)

### Acesso por papel

- `admin`: acessa dashboard completo, audit e DLQ
- `operator`: acessa workspace operacional permitido, sem audit/DLQ
- paginas admin-only devem ser removidas da sidebar para operador
- rota direta admin-only deve renderizar access denied, nao dados parciais

### O que nao entra neste ciclo de entrega

- polling automatico
- mutacoes operacionais (`retry`, `resolve`, `replay`, `delete`, `acknowledge`, `reprocess`)
- query library/cache externo
- exportacao server-side de toda a base
- conectores externos como fluxo funcional

## Organizacao De Testes

`apps/web/src` deve conter apenas codigo de runtime do frontend: paginas, componentes, hooks, features e bibliotecas carregadas pelo app.

Testes Vitest vivem em `apps/web/tests`:

- `tests/unit`: testes unitarios, de componentes, adapters, features e paginas com jsdom.
- `tests/integration`: testes Vitest em ambiente Node contra backend real/local.
- `tests/setup.ts`: setup compartilhado dos testes unitarios.

Testes Playwright continuam em `apps/web/e2e`. Novos arquivos `*.test.ts`, `*.test.tsx` ou `*.integration.test.ts` nao devem ser criados dentro de `src`.

## Validacao/Evidencias

Evidencias da trilha de frontend workspace operacional:

- testes focados de adapter, dashboard, `/clickhouse`, `/etl-explorer`, Upload Center e rotas protegidas passaram no ciclo de implementacao
- `pnpm.cmd --dir apps/web test:run`, `pnpm.cmd --dir apps/web test:integration`, `pnpm.cmd --dir apps/web build`, `ci-local.ps1 frontend` e `run-smokes.ps1` com `SMOKE_PUBLIC_LINK_URL` passaram no fechamento do recorte do workspace operacional
- verificacao visual desktop/mobile passou nas rotas principais alteradas

Criterio de pronto para mudancas futuras de frontend:

- respeitar divisao entre superficie publica e autenticada
- usar componentes/layouts base antes de criar novos
- cobrir loading, empty, error, access denied, success e stale
- preservar URL state nos filtros operacionais
- preservar masking e export seguro
- manter `api-client` e `streamgate-api` como fronteira unica
- atualizar docs com `documentation-writer` quando houver alteracao documental

## Referencias

- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/)
- [Mapa do workspace frontend](C:/estudos/StreamGate/docs/guides/frontend/frontend-workspace-map.md)
- [README do web](C:/estudos/StreamGate/apps/web/README.md)
- [Governanca de documentacao](C:/estudos/StreamGate/docs/guides/operations/documentation-governance.md)
