# Mapa do Workspace Frontend

## Objetivo

Este documento registra a malha oficial do workspace autenticado aberta na Sprint 1. Ele existe para evitar que o frontend volte a tratar o dashboard como uma unica tela monolitica.

## Shell oficial

O shell autenticado compartilhado do projeto e composto por:

- `DashboardSurface`: sidebar, topbar, alert strip e linguagem visual base
- `WorkspacePageFrame`: wrapper de sessao, logout e navegacao
- `WorkspaceOverview`: conteudo da rota `/dashboard`
- `WorkspaceModule`: scaffold padrao para novas superficies protegidas

Toda nova pagina autenticada deve nascer a partir dessa pilha antes de propor um shell paralelo.

## Rotas protegidas da Sprint 1

| Rota | Papel | Familia |
| --- | --- | --- |
| `/dashboard` | visao geral operacional | principal |
| `/upload` | entrada de ingestao | principal |
| `/jobs` | leitura de execucao | principal |
| `/analytics` | metricas e leitura agregada | analise |
| `/quarantine` | triagem de registros rejeitados | analise |
| `/events` | event log operacional | analise |
| `/audit` | governanca e trilha de auditoria | sistema |
| `/settings` | defaults e configuracoes | sistema |

## Configuracao central

A configuracao oficial da navegacao vive em `apps/web/src/components/app/workspace-config.ts`.

Este arquivo passa a ser a fonte de verdade para:

- grupos e ordem da sidebar
- metadata de modulos
- chips globais do topo
- estados oficiais de job na UI

Mudancas de navegacao devem partir dessa configuracao antes de alterar paginas individualmente.

## Regras de crescimento

### Novos modulos

Ao adicionar um novo modulo protegido, o fluxo minimo deve ser:

1. registrar a rota em `workspace-config.ts`
2. criar a pagina com `WorkspacePageFrame`
3. usar `WorkspaceModule` ou um derivado claro dessa linguagem
4. registrar o modulo neste documento e no roadmap

### Integracao de dados

Toda pagina protegida futura deve consumir a camada HTTP oficial antes de implementar fetch local.

Base atual:

- `apps/web/src/lib/api-client.ts`
- `apps/web/src/lib/streamgate-api.ts`

### Query state e polling

A Sprint 1 so fecha o adapter. Polling, sincronizacao com URL e cache mais sofisticado entram nas proximas sprints, mas ja com estas regras:

- filtros e paginacao nao devem ficar escondidos em estado local opaco
- polling so deve nascer em modulos operacionais que realmente precisem de frescor
- a camada HTTP deve continuar sendo a fronteira comum

## Estados oficiais de job

A UI da Sprint 1 reconhece estes estados como oficiais:

- `pending`
- `processing`
- `completed`
- `failed`
- `quarantined_with_warnings`

Se o backend ampliar a maquina de estados, este documento e `workspace-config.ts` devem ser atualizados no mesmo ciclo.

## O que esta pronto vs o que ainda falta

Ja pronto ate a Sprint 2:

- shell compartilhado do workspace
- malha de rotas protegidas
- scaffold de modulos
- camada HTTP inicial
- auth real integrado (login/cadastro/logout/me/refresh/reset)
- testes basicos de navegacao e adapter

Ainda faltando para as proximas sprints:

- dados reais por modulo
- estados de loading, empty e erro conectados a dados reais
- filtros, paginacao e query state conectados a URL
- polling e refresh operacional

## Skills obrigatorias para reavaliacao futura

Toda reavaliacao desse mapa entre sprints deve usar pelo menos:

- `review-codebase`
- `frontend-skill`
- `tailwind-design-system`
- `vercel-react-best-practices`
- `vitest`

Quando a mudanca tocar integracao real, adicionar tambem:

- `breakdown-test`
- `api-contract-testing`
- `playwright`



## Gate de prontidao da Sprint 2.5

Decisoes fechadas para liberar a Sprint 3 base sem retrabalho:

- filtros minimos de listagem no workspace devem mapear URL em status + page;
- per_page e search permanecem reservados para evolucao progressiva sem quebrar o shell atual;
- modo de uso guided vs dvanced fica documentado como direcao de UX e nao como feature entregue nesta sprint.
