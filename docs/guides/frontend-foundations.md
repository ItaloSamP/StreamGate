# Fundacoes do Frontend

## Objetivo

Este guia fixa as decisoes de interface da Sprint 0 para o `apps/web`. Ele existe para preservar a baseline visual ja aprovada e evitar que novas telas reaprendam do zero como o StreamGate deve parecer e se comportar.

O frontend atual do projeto ja possui tres grupos de superficie:

- `publica`: landing page
- `auth`: login, cadastro e redefinicao de senha
- `autenticada`: dashboard protegido

A Sprint 0 nao existe para redesenhar essa base. Ela existe para transformar essa base em referencia oficial.

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
- `auth-context` controla a sessao local atual
- login concluido envia o usuario para `/dashboard`
- logout retorna para a landing page

Enquanto o auth real nao existe, essa transicao continua mockada no cliente, mas o comportamento de navegacao ja e a referencia oficial.

## Biblioteca minima de componentes e layouts

Antes de criar novos componentes, o frontend deve reaproveitar esta base minima ja existente.

### Identidade e blocos estruturais

- `StreamGateMark`: marca visual base
- `SectionLabel`: eyebrow/rotulo de secao
- `ShellPanel`: superficie visual reutilizavel para blocos e paineis

### Layouts e superficies de app

- `AuthShell`: casca oficial para login, cadastro e reset
- `DashboardSurface`: superficie oficial do workspace autenticado
- `DashboardGraphics`: apoio visual dos graficos do dashboard
- `dashboard-surface.css`: linguagem visual do workspace autenticado

### Navegacao e protecao

- `ProtectedRoute`: fronteira de acesso autenticado
- `AuthProvider` e `useAuth`: sessao do frontend atual

### Primitives de formulario

- `Button`
- `Input`
- `Label`

### Regras de reaproveitamento

- telas de auth novas devem nascer de `AuthShell`
- superficies autenticadas novas devem reutilizar a linguagem de `DashboardSurface` antes de inventar um shell paralelo
- novas secoes devem tentar compor `ShellPanel`, `SectionLabel` e `Button` antes de criar wrappers equivalentes
- um novo componente so deve nascer quando o componente existente falhar estruturalmente para o caso de uso, e nao apenas por preferencia local

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

- a base atual ainda nao possui empty states dedicados no dashboard

Regra oficial daqui em diante:

- todo empty state deve explicar o que esta vazio, por que isso pode acontecer e qual a proxima acao disponivel
- empty states em superficies autenticadas devem usar linguagem utilitaria, nao marketing
- empty state nao deve quebrar o shell visual da tela

### Error

Regra atual:

- erros de formulario aparecem inline por campo e tambem via toast singleton
- erros de acesso sao tratados por redirecionamento de rota protegida

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

### Auth mock

Ainda esta mockado no cliente:

- armazenamento de sessao em `localStorage` e `sessionStorage`
- perfil registrado salvo localmente por `saveRegisteredProfile`
- redirecionamento apos login sem backend real
- redefinicao de senha sem integracao externa

Arquivos principais:

- `src/lib/auth.ts`
- `src/features/auth/auth-context.tsx`
- `src/features/auth/protected-route.tsx`
- paginas de auth em `src/pages`

### Dashboard mock

Ainda esta mockado no cliente:

- KPIs
- jobs
- filas
- workers
- eventos
- uploads
- chips e alertas de status
- graficos e distribuicoes do workspace

Arquivos principais:

- `src/components/app/dashboard-data.tsx`
- `src/components/app/dashboard-surface.tsx`
- `src/components/app/dashboard-graphics.tsx`

### Baseline oficial vs mock

Mesmo quando os dados ainda sao mock, a estrutura visual nao e provisoria. Nesta sprint, o projeto passa a assumir:

- landing, auth shell e dashboard shell como baseline oficial
- mocks apenas como substituicao temporaria da camada de dados e autenticacao
- substituicao de mock por dado real sem resetar a linguagem visual

## UI rules para evitar regressao visual futura

### Hierarquia e composicao

- manter a landing page como superficie publica premium, com narrativa de produto e preview do workspace
- manter o dashboard como superficie operacional densa e contida, sem virar mosaico generico de cards SaaS
- evitar criar shells paralelos quando `AuthShell` ou `DashboardSurface` ja resolverem a estrutura

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
- quando uma nova abstração surgir, ela deve representar um padrao recorrente, nao uma tela isolada

### Superficies autenticadas

- workspace autenticado deve priorizar leitura, status, acao e contexto
- charts, tabelas e paines futuros devem parecer parte da mesma familia visual do dashboard atual
- evitar banners promocionais, hero copy e excesso de ornamento dentro da area protegida

## Criterio de pronto para mudancas de frontend

Uma entrega de frontend so e considerada pronta quando:

- respeita a divisao entre superficie publica e autenticada
- usa a base minima de componentes e layouts antes de criar novos
- trata loading, empty, error e success de forma explicita
- deixa claro o que ainda esta mock e o que ja esta integrado
- preserva a linguagem visual oficial do projeto


