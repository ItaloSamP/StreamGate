# Fundacoes do Frontend

## Objetivo

Este guia fixa as decisoes de interface da Sprint 0 e da Sprint 1 para o `apps/web`. Ele existe para preservar a baseline visual ja aprovada e evitar que novas telas reaprendam do zero como o StreamGate deve parecer, se comportar e crescer.

O frontend atual do projeto ja possui tres grupos de superficie:

- `publica`: landing page
- `auth`: login, cadastro e redefinicao de senha
- `autenticada`: workspace protegido segmentado por modulos

A Sprint 0 reconheceu a baseline visual. A Sprint 1 fechou a primeira malha oficial do workspace e a camada HTTP inicial.

## Regras objetivas de telas publicas vs autenticadas

### Telas publicas

Telas publicas sao acessiveis sem sessao e devem apresentar o produto ou preparar a entrada do usuario.

Entram nesta categoria:

- `LandingPage`
- `LoginPage`
- `RegisterPage`
- `ResetPasswordPage`

Regras:

- devem comunicar a identidade visual oficial do produto
- nao dependem de dados operacionais reais para funcionar
- podem conter CTA para autenticacao ou cadastro
- nao devem expor dados internos do pipeline nem controles operacionais reais
- devem manter foco em orientacao, entrada e narrativa do produto

### Telas autenticadas

Telas autenticadas existem para operar, monitorar ou consultar o produto apos a sessao ser validada.

Entram nesta categoria:

- `DashboardPage`
- `UploadPage`
- `JobsPage`
- `AnalyticsPage`
- `QuarantinePage`
- `EventLogPage`
- `AuditPage`
- `SettingsPage`
- qualquer superficie futura protegida por `ProtectedRoute`

Regras:

- exigem sessao ativa
- devem ser renderizadas dentro da linguagem de workspace do dashboard
- precisam privilegiar leitura operacional, densidade informacional e clareza de acao
- nao devem introduzir hero marketing nem linguagem promocional tipica de landing page
- devem tratar estado de dados, filtros, alerts e acao como parte da interface, nao como detalhe opcional

### Regra de transicao entre superficies

A fronteira oficial entre publico e autenticado hoje e:

- `ProtectedRoute` controla o acesso ao workspace
- `auth-context` controla a sessao real da API no frontend
- login concluido envia o usuario para `/dashboard`
- logout retorna para a landing page

Com a Sprint 2, essa transicao passou a usar auth real via API (`register`, `login`, `logout`, `me`, `session/refresh` e reset). O comportamento de navegacao segue a mesma referencia visual, agora com estados reais de sessao expirada e acesso negado.

## Biblioteca minima de componentes e layouts

Antes de criar novos componentes, o frontend deve reaproveitar esta base minima ja existente.

### Identidade e blocos estruturais

- `StreamGateMark`: marca visual base
- `SectionLabel`: eyebrow e rotulo de secao
- `ShellPanel`: superficie visual reutilizavel para blocos e paineis

### Layouts e superficies de app

- `AuthShell`: casca oficial para login, cadastro e reset
- `DashboardSurface`: shell oficial do workspace autenticado
- `WorkspacePageFrame`: wrapper padrao das rotas protegidas
- `WorkspaceOverview`: conteudo da visao geral do dashboard
- `WorkspaceModule`: scaffold oficial das superficies de modulo
- `DashboardGraphics`: apoio visual dos graficos do dashboard
- `dashboard-surface.css`: linguagem visual do workspace autenticado

### Navegacao e protecao

- `ProtectedRoute`: fronteira de acesso autenticado
- `AuthProvider` e `useAuth`: sessao do frontend atual
- `workspace-config.ts`: mapa oficial de navegacao, modulos e estados de job

### Primitives de formulario

- `Button`
- `Input`
- `Label`

### Regras de reaproveitamento

- telas de auth novas devem nascer de `AuthShell`
- superficies autenticadas novas devem reutilizar a linguagem de `DashboardSurface` e `WorkspacePageFrame` antes de inventar um shell paralelo
- novas secoes devem tentar compor `ShellPanel`, `SectionLabel` e `Button` antes de criar wrappers equivalentes
- um novo componente so deve nascer quando o componente existente falhar estruturalmente para o caso de uso, e nao apenas por preferencia local

## Mapa oficial do workspace

A Sprint 1 congela a primeira navegacao autenticada oficial do produto:

- `/dashboard`: visao geral operacional
- `/upload`: entrada e validacao de ingestao
- `/jobs`: leitura e acompanhamento de execucao
- `/analytics`: leitura analitica e metricas
- `/quarantine`: tratamento de registros rejeitados
- `/events`: event log e trilha de automacao
- `/audit`: auditoria e governanca operacional
- `/settings`: configuracoes e defaults do workspace

Essa divisao existe para impedir que o dashboard central concentre todas as responsabilidades futuras do produto.

## Camada de dados do frontend

A Sprint 1 tambem fecha a primeira camada HTTP oficial em:

- `src/lib/api-client.ts`
- `src/lib/streamgate-api.ts`

Regras oficiais daqui em diante:

- toda chamada HTTP nova deve partir do adapter oficial antes de qualquer fetch local na pagina
- envelopes de sucesso e erro devem seguir o contrato da API
- erro de integracao deve preservar `request_id`, `trace_id`, `code` e `details` quando existirem
- serializacao de query params deve ficar centralizada
- a decisao sobre cache, polling e query state pode evoluir depois, mas nao deve quebrar a camada adapter

## Estados oficiais de job na UI

A primeira tabela oficial de estados de job no frontend passa a ser:

- `pending`
- `processing`
- `completed`
- `failed`
- `quarantined_with_warnings`

Esses estados devem ser a referencia visual e semantica da UI ate que o backend amplie ou refine a maquina de estados.

## Estados padrao de interface

### Loading

Regra atual:

- a interface deve sinalizar operacao em andamento no proprio CTA ou bloco afetado
- formularios usam copy de acao progressiva no botao principal, como `Entrando...`, `Criando acesso...` e `Redefinindo...`

Regra para evolucao:

- loading local deve preservar layout e evitar salto visual
- loading global so deve existir quando a tela inteira depender do carregamento
- skeletons futuros devem respeitar a hierarquia visual da superficie em vez de inserir placeholders genericos

### Empty state

Regra atual:

- a base atual ainda nao possui empty states dedicados nos modulos do workspace

Regra oficial daqui em diante:

- todo empty state deve explicar o que esta vazio, por que isso pode acontecer e qual a proxima acao disponivel
- empty states em superficies autenticadas devem usar linguagem utilitaria, nao marketing
- empty state nao deve quebrar o shell visual da tela

### Error

Regra atual:

- erros de formulario aparecem inline por campo e tambem via toast singleton
- erros de acesso sao tratados por redirecionamento de rota protegida
- erros de integracao passam a ter tipo proprio via `ApiClientError`

Regra oficial daqui em diante:

- erros validaveis de formulario devem aparecer inline no campo correspondente
- erros de acao devem ter feedback resumido e visivel, preferencialmente no CTA ou toast
- erros de superficie autenticada devem preservar contexto e permitir retry quando fizer sentido
- o tom do erro deve ser operacional e claro, nunca alarmista ou vago

### Success

Regra atual:

- login, cadastro, reset e logout usam toasts singleton com copy curta e orientada a proxima acao

Regra oficial daqui em diante:

- sucessos devem confirmar o que aconteceu e o proximo estado do usuario
- feedback de sucesso nao deve competir visualmente com a hierarquia principal da tela
- sucesso silencioso so e aceitavel quando a propria navegacao ou atualizacao de dados deixar o resultado obvio

### Formularios

Regras oficiais:

- formularios publicos seguem a casca `AuthShell`
- `Label`, `Input` e `Button` sao a base padrao
- validacao deve combinar mensagem inline no campo com feedback resumido em toast quando houver falha de submissao
- estado de submit deve desabilitar o CTA principal
- a copy de placeholder e ajuda deve orientar preenchimento, nao decorar a interface
- novas regras de validacao devem ser centralizadas em `src/lib/validation.ts` quando fizer sentido

## O que ainda e mock no frontend atual

### Auth real (Sprint 2)

A autenticacao do frontend deixou de ser mock e passou a operar com backend real:

- login, cadastro, logout e bootstrap de sessao via endpoint me
- persistencia de sessao no browser respeitando a opcao de remember
- tratamento centralizado de token Bearer no api-client
- fallback central para session_expired e access_denied
- fluxo de reset conectado aos endpoints request e confirm

Arquivos principais:

- src/lib/auth.ts
- src/lib/api-client.ts
- src/lib/streamgate-api.ts
- src/features/auth/auth-context.tsx
- src/features/auth/protected-route.tsx
- paginas de auth em src/pages

### Workspace mock parcial

Depois da Sprint 3, a trilha principal de `upload+job` deixou de ser mock no workspace:

- `/upload`: formulario real com fluxo `signed-url -> PUT -> register`, estados explicitos (`idle`, `assinando`, `enviando`, `confirmando`, `sucesso`, `erro`) e duas listagens reais (uploads e jobs recentes);
- `/jobs`: listagem real de jobs com filtro/status + pagina em URL.

Ainda permanece mockado no cliente:

- KPIs e visao consolidada do dashboard
- analytics, quarentena, event log e auditoria em profundidade
- chips globais e distribuicoes avancadas ainda sem backend analitico completo

Arquivos principais:

- `src/components/app/dashboard-data.tsx`
- `src/components/app/workspace-overview.tsx`
- `src/components/app/workspace-config.ts`
- paginas de modulo em `src/pages`

### Baseline oficial vs mock

Mesmo quando os dados ainda sao mock, a estrutura visual nao e provisoria. Nesta fase, o projeto passa a assumir:

- landing, auth shell e workspace shell como baseline oficial
- mocks apenas como substituicao temporaria das trilhas ainda nao conectadas
- substituicao de mock por dado real sem resetar a linguagem visual
- substituicao de fetch mock por adapter real sem multiplicar clientes HTTP pela app

## UI rules para evitar regressao visual futura

### Hierarquia e composicao

- manter a landing page como superficie publica premium, com narrativa de produto e preview do workspace
- manter o workspace como superficie operacional densa e contida, sem virar mosaico generico de cards SaaS
- evitar criar shells paralelos quando `AuthShell`, `DashboardSurface` ou `WorkspacePageFrame` ja resolverem a estrutura

### Tipografia e copy

- headlines publicas podem ser mais expressivas, mas telas autenticadas devem preferir copy utilitaria
- headings de produto devem nomear a funcao da area antes de vender uma promessa
- formularios devem usar copy objetiva e orientada a acao

### Cor, estado e feedback

- usar a paleta e os tokens ja presentes no app como baseline visual
- manter consistencia entre tons de alerta, sucesso e destaque
- nao introduzir novas cores de estado sem necessidade real

### Componentizacao

- nao criar novo botao, input, label, panel ou shell por variacao superficial
- primeiro tentar estender variantes dos componentes existentes
- quando uma nova abstracao surgir, ela deve representar um padrao recorrente, nao uma tela isolada

### Superficies autenticadas

- workspace autenticado deve priorizar leitura, status, acao e contexto
- charts, tabelas e paineis futuros devem parecer parte da mesma familia visual do dashboard atual
- evitar banners promocionais, hero copy e excesso de ornamento dentro da area protegida

## Criterio de pronto para mudancas de frontend

Uma entrega de frontend so e considerada pronta quando:

- respeita a divisao entre superficie publica e autenticada
- usa a base minima de componentes e layouts antes de criar novos
- trata loading, empty, error e success de forma explicita
- deixa claro o que ainda esta mock e o que ja esta integrado
- preserva a linguagem visual oficial do projeto
- cresce o workspace por modulos oficiais e por adapter compartilhado, nao por excecoes locais




## Ajustes de prontidao da Sprint 2.5

- Adapter oficial passa a reservar consumo de envelope completo para listagens paginadas (getEnvelope), mantendo contrato consistente para Sprint 3.
- Endpoints de listagem em preparacao foram alinhados para /api/v1/uploads e /api/v1/jobs no adapter compartilhado, sem abrir fluxo funcional novo nesta sprint.
- Matriz minima de estados obrigatorios para superficies de dados no workspace (Sprint 3 base):
  - loading: feedback explicito no modulo e CTA afetado
  - empty: explicacao do estado vazio + proxima acao
  - error: mensagem operacional + retry quando aplicavel
  - success: confirmacao de transicao de estado sem ruir hierarquia visual

## Entrega consolidada da Sprint 3

- `UploadPage` e `JobsPage` agora consomem API real via adapter oficial.
- URL state minimo aplicado:
  - `/jobs`: `status`, `page`
  - `/upload`: `upload_status`, `upload_page`, `job_status`, `job_page`
- Refresh pos-upload confirmado sem polling continuo nesta sprint (refetch imediato de uploads/jobs).
