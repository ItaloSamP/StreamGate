# StreamGate - Roadmap Mestre de Sprints e To-Do Executivo

## Objetivo

Este documento e o backlog executivo do projeto. Ele existe para responder, com clareza operacional, cinco perguntas que normalmente ficam implicitas e viram divida:

1. O que exatamente precisa ser feito em cada sprint.
2. Em que ordem isso deve acontecer.
3. O que ja existe hoje e pode ser reaproveitado.
4. O que precisa ser validado para dizer que algo esta realmente pronto.
5. O que bloqueia o fechamento de uma sprint.

O tom aqui e deliberadamente de engenharia. A ideia nao e listar desejos. A ideia e deixar o caminho de entrega visivel, verificavel e dificil de deturpar.

## Estado real do projeto em 2026-04-03

- `Frontend`: base visual forte ja existe em `apps/web`, com landing page, login, cadastro, reset, dashboard shell, auth mock, route guard e alguns testes de UX/logica.
- `Frontend stack`: hoje o app roda em React 19, React Router 7, Vite 8, Tailwind 4 e Vitest 4; a Sprint 1 tambem materializou a primeira camada HTTP oficial em `api-client` e `streamgate-api`.
- `Frontend navegavel`: a Sprint 1 ja abriu a malha protegida real com `/dashboard`, `/upload`, `/jobs`, `/analytics`, `/quarantine`, `/events`, `/audit` e `/settings`, todas sustentadas por shell compartilhado de workspace e scaffold de modulo.
- `API Rails`: continua em estado de esqueleto tecnico; hoje ha apenas `GET /up` e infraestrutura inicial de Swagger/OpenAPI em `/api-docs`, sem dominio, sem endpoints de negocio, sem migrations e sem estrutura materializada de services/use-cases/policies/serializers.
- `Worker`: ainda esta mais perto de um template de gem do que de um runtime real de filas/processamento; no `compose` o container continua em `sleep infinity` para smoke de dependencia.
- `Contracts`: `packages/contracts` segue como placeholder.
- `Infra local`: `compose.yaml` esta bem montado, com servicos relevantes, profiles e health checks.
- `CI`: existem workflows separados para frontend, backend e docker; o frontend agora roda `vitest` no workflow e a trilha de contrato/integracao segue como gate pendente.
- `Governanca`: existe template de PR, mas ainda nao existem `CODEOWNERS`, `dependabot.yml`, issue templates, sistema de labels, `AGENTS.md` raiz e guias formais de contribuicao.
- `Swagger/OpenAPI`: a base existe e `/api-docs` ja foi preparado, mas ainda sem recursos reais de negocio.
- `Readiness operacional`: uma leitura rapida com a skill `readiness-report` mostrou maturidade baixa para desenvolvimento autonomo assistido, com gaps mais fortes em observabilidade, seguranca automatizada, descoberta de tarefas e governanca do repositorio.
- `Gaps conhecidos`: no host Windows, fluxos locais com Docker ainda exigem execucao elevada; o worker ja nao sofre mais com `git ls-files`, mas ainda nao possui runtime; scripts de automacao precisam continuar atentos a diferencas de encoding/WSL/PowerShell no host atual.

## Assumptions Fechados

- Cadencia orientada por prontidao, nao por sprint curta obrigatoria.
- Gates sem duracao fixa sao permitidos quando reduzem risco (exemplo: Sprint 2.5).
- Timebox longo pode ser usado quando necessario; `2 semanas` passa a ser referencia, nao regra fixa.
- Pasta oficial de skills recorrentes do projeto: `.agents/skills`.
- Estado final esperado: `Docker + Kubernetes`.
- Toda entrega de frontend deve preservar o modelo visual do projeto; nao existe permissao tacita para redesenhar tudo a cada feature.
- Toda entrega de backend deve ser orientada a contrato, rastreabilidade, clareza de dominio e operacao.
- Toda mudanca de endpoint exige atualizacao de Swagger/OpenAPI no mesmo ciclo.

## Regras Globais de Operacao

### Como cada sprint deve ser lida

Cada sprint abaixo contem, no minimo:

- `Status atual`
- `Dependencias`
- `Bloqueadores conhecidos`
- `O que nao pode ficar para depois`
- `Contexto e intencao`
- `Ja existe hoje`
- `Back planning`
- `Back execution`
- `Front planning`
- `Front execution`
- `DevOps`
- `Documentation`
- `Test planning`
- `Test execution`
- `Security`
- `Skills da sprint`
- `Checklist de saida`
- `Reavaliacao de transicao por trilha`

### Definition of Done global do projeto

Nenhuma sprint fecha se qualquer item abaixo estiver quebrado no escopo da sprint:

- documentacao da sprint nao foi atualizada;
- testes planejados nao foram executados;
- CI relevante nao esta verde;
- Swagger/OpenAPI nao acompanha endpoints novos ou alterados;
- servicos Docker do escopo estao `unhealthy`;
- a implementacao so funciona na maquina de quem fez;
- riscos, pendencias e trade-offs nao foram registrados.

### Evidencias obrigatorias por sprint

Ao encerrar uma sprint, o time deve anexar ou registrar:

- comandos rodados;
- resultado dos testes;
- telas/rotas validadas;
- servicos `healthy`;
- arquivos de documentacao alterados;
- riscos aceitos explicitamente.

### Regra obrigatoria de transicao entre sprints

Nenhuma sprint nova deve comecar apenas porque a sprint anterior terminou no calendario.

Antes de iniciar a sprint seguinte, passa a ser obrigatorio executar uma reavaliacao do produto e do repositorio, com o mesmo espirito desta revisao de roadmap:

- revisar o estado real do codigo, da infra, da documentacao e da UX ja entregues;
- comparar o que estava planejado com o que de fato foi implementado;
- identificar o que ficou faltando, o que mudou de prioridade e o que apareceu de novo no caminho;
- registrar debitos, gaps operacionais, lacunas de contrato, logica, teste, seguranca, observabilidade e documentacao;
- atualizar este roadmap mestre e todos os documentos relacionados tocados pela evolucao da sprint.

Essa reavaliacao nao e opcional nem burocratica. Ela existe para impedir estagnacao, backlog invisivel e crescimento desordenado.

Objetivo pratico:

- garantir evolucao continua do produto;
- impedir que funcionalidades novas nascam sem entrar no plano oficial;
- impedir que lacunas tecnicas ou de regra de negocio fiquem escondidas entre sprints;
- manter o roadmap sempre coerente com o estado real do projeto, e nao com uma fotografia antiga.

Documentos que devem ser revistos e atualizados sempre que a sprint tiver impacto neles:

- este roadmap mestre;
- `docs/product/vision.md`;
- `docs/guides/architecture.md`;
- `docs/guides/backend-foundations.md`;
- `docs/guides/frontend-foundations.md`;
- `docs/guides/testing-baseline-sprint-0.md` ou o documento de testes vigente;
- `docs/guides/security-baseline-sprint-0.md` ou o documento de seguranca vigente;
- `docs/guides/devops-roadmap.md` e runbooks/ADRs afetados;
- `apps/web/README.md`, `apps/api/README.md` e `apps/worker/README.md`;
- contratos e especificacoes vivas em `packages/contracts` e `apps/api/openapi/v1/openapi.yaml`.
- o checklist operacional em `docs/guides/sprint-reassessment-checklist.md`.

### Regra transversal de reavaliacao por trilha

A reavaliacao entre sprints so e considerada completa quando existir um delta explicito por trilha.

Regra de preenchimento:

- se a trilha foi tocada na sprint, registrar entregue, lacunas, riscos e impacto na sprint seguinte;
- se a trilha nao foi tocada, registrar explicitamente `nao tocada nesta sprint`;
- se houver gap critico sem plano com prioridade, responsavel e sprint alvo, a proxima sprint nao deve ser aberta.

Matriz minima obrigatoria para todas as sprints:

| Trilha                             | Reavaliacao minima obrigatoria                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| `Back planning`                    | escopo planejado vs escopo entregue, novos requisitos e repriorizacao de backlog        |
| `Back execution`                   | dominio, regras, contrato HTTP/eventos, OpenAPI e debitos tecnicos transferidos         |
| `Worker execution` (quando houver) | fila, retries, idempotencia, observabilidade e efeito em operacao/analytics             |
| `Front planning`                   | jornadas, prioridades de UX e estados obrigatorios por tela/modulo                      |
| `Front execution`                  | fidelidade do fluxo real, estados de UI, acessibilidade, performance e regressao visual |
| `DevOps`                           | CI/gates, scripts oficiais, ambientes, smoke operacional e gaps de automacao            |
| `Documentation`                    | docs atualizados, ADRs/runbooks alterados e inconsistencias documentais abertas         |
| `Test planning`                    | matriz de testes da proxima sprint, novas coberturas obrigatorias e riscos de qualidade |
| `Test execution`                   | comandos rodados, resultados, falhas de ambiente vs implementacao e riscos residuais    |
| `Security`                         | novas superficies sensiveis, controles faltantes, riscos aceitos e hardening priorizado |
| `Skills da sprint`                 | skills usadas, skills faltantes e ajustes no stack de skills da proxima sprint          |

### Matriz minima de documentacao por sprint

Sempre revisar, no minimo, estes documentos quando a sprint tocar o assunto:

| Area                | Documento minimo                                                    |
| ------------------- | ------------------------------------------------------------------- |
| Produto e escopo    | `docs/product/vision.md`                                            |
| Roadmap e progresso | este arquivo                                                        |
| Arquitetura macro   | `docs/guides/architecture.md` e ADRs em `docs/adr/`                 |
| API                 | `docs/guides/api-docs.md` e `apps/api/openapi/v1/openapi.yaml`      |
| Setup/ambiente      | `docs/guides/setup.md`                                              |
| Skills/metodo       | `.agents/skills/README.md`                                          |
| App especifico      | `apps/web/README.md`, `apps/api/README.md`, `apps/worker/README.md` |

### Comandos oficiais de verdade

Os comandos abaixo sao a base para checklist operacional. Quando um comando falha por limitacao de ambiente, isso deve ser registrado com causa e plano de correcao.

| Escopo                 | Comando oficial                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| Frontend install/build | `pnpm install`, `pnpm build` em `apps/web`                             |
| Frontend lint/test     | `pnpm lint`, `pnpm test:run` em `apps/web`                             |
| API                    | `bundle exec rails db:prepare`, `bundle exec rails test` em `apps/api` |
| Worker                 | `bundle exec rspec` em `apps/worker`                                   |
| CI local               | `./scripts/ci/ci-local.sh` ou `.\scripts\ci\ci-local.ps1`              |
| Docker infra           | `./scripts/dev/dev-up.sh`                                              |
| Docker full            | `./scripts/dev/dev-up.sh full`                                         |
| Compose smoke          | `./scripts/compose/compose-health-tests.sh`                            |

### Matriz de ambientes

| Ambiente       | Papel                | Status hoje | Observacao                                                  |
| -------------- | -------------------- | ----------- | ----------------------------------------------------------- |
| `Windows host` | host de conveniencia | Parcial     | Vitest falha neste ambiente; nao deve ser o fluxo principal |
| `WSL dev`      | ambiente recomendado | Parcial     | e o fluxo alvo para desenvolvimento diario                  |
| `Docker infra` | dependencias locais  | Ja existe   | compose e health checks ja preparados                       |
| `Docker full`  | stack completa       | Parcial     | apps sobem, mas worker ainda nao tem runtime real           |
| `CI GitHub`    | validacao oficial    | Parcial     | workflows existem, mas ainda validam um produto incompleto  |

## Stack de Skills do Projeto

A partir deste roadmap, o uso de skills nao deve ser tratado como sugestao. Toda task deve iniciar pelas skills da trilha correspondente antes de implementacao, revisao ou validacao.

### Skills locais ja adotadas como padrao

- `find-skills`
- `frontend-skill`
- `web-design-guidelines`
- `tailwind-design-system`
- `vercel-react-best-practices`
- `test-driven-development`
- `supabase-postgres-best-practices`
- `playwright`

### Skills externas trazidas para `.agents/skills`

- `architecture-patterns`
- `domain-modeling`
- `review-codebase`
- `review-architecture`
- `readiness-report`
- `api-documenter`
- `api-designer`
- `openapi`
- `docker`
- `kubernetes`
- `gitops-workflow`
- `helm-chart-scaffolding`
- `generate-github-workflow`
- `github-actions-expert`
- `monitoring-observability`
- `breakdown-test`
- `integration-testing`
- `api-contract-testing`
- `vitest`

O uso pratico e o racional de cada uma esta documentado em [`.agents/skills/README.md`](C:/estudos/StreamGate/.agents/skills/README.md).

## Frentes transversais que entraram no roadmap nesta revisao

Estas frentes nao pertencem a uma unica sprint. Elas apareceram pelo estado real do repositorio e precisam ser distribuidas ao longo da v1.

### 1. Contratos compartilhados executaveis

`packages/contracts` ja deixou de ser apenas uma boa ideia e virou dependencia critica do sequenciamento. A partir de agora o roadmap assume explicitamente:

- estrutura real do pacote com schemas, exemplos e convencoes versionadas;
- estrategia de reutilizacao entre Ruby e TypeScript;
- validacao automatica de compatibilidade entre OpenAPI, eventos e consumidores;
- geracao ou distribuicao de tipos utilitarios para frontend, API e worker.

### 2. Camada de dados do frontend

O dashboard atual tem uma IA rica, mas ainda nao tem uma camada de dados real. Antes de plugar muitos endpoints, o projeto precisa:

- definir cliente HTTP oficial do frontend;
- padronizar tratamento de auth, erro, loading, refresh e sessao expirada;
- decidir como filtros, paginacao e polling vao viver na URL e no estado da app;
- evitar que cada tela implemente fetch, retry e parsing do seu proprio jeito.

### 3. Governanca de repositorio e agent-readiness

Conforme o projeto crescer, itens de governanca deixam de ser detalhe e passam a proteger a entrega:

- `CODEOWNERS`;
- `dependabot.yml`;
- issue templates, labels e guias de contribuicao;
- `AGENTS.md` raiz com comandos, fluxos e restricoes oficiais;
- padroes minimos para automacoes e scripts funcionarem tanto em WSL quanto no host Windows atual.

### 4. Observabilidade e operacao por rastreabilidade

O guia de backend ja congelou `trace_id`, `request_id`, `upload_id`, `job_id` e `batch_id`; o roadmap passa a assumir que isso nao e opcional:

- logs estruturados precisam existir antes da operacao ficar real;
- runbooks e sinais minimos entram antes de cluster;
- replay, auditoria e analytics dependem dessa rastreabilidade estar viva desde as primeiras features reais.

---

## Sprint 0 - Fundacao do metodo, baseline tecnica e limpeza do terreno

**Status atual:** `Concluida`

**Dependencias**

- nenhuma

**Bloqueadores conhecidos**

- Vitest falha no ambiente Windows atual com `spawn EPERM`
- worker ainda depende de padrao de gemspec inadequado para este ambiente
- README da API estava em estado template
- README do frontend e do worker estavam desalinhados com o estado real do projeto

**O que nao pode ficar para depois**

- decidir e documentar o ambiente suportado
- explicitar o que ja esta pronto e o que ainda e placeholder
- amarrar documentacao, skills e definicao de pronto

**Contexto e intencao**

Esta sprint existe para matar ambiguidade. O objetivo aqui nao e entregar feature. O objetivo e transformar o repositorio em terreno confiavel, para que o resto do roadmap seja executado sem os custos de contexto tipicos de um projeto que cresce em cima de placeholders.

**Ja existe hoje**

- [x] `compose.yaml` com servicos essenciais e health checks
- [x] workflows separados em `.github/workflows`
- [x] documentacao de arquitetura, setup, visao do produto e API docs base
- [x] frontend com base visual ja convincente
- [x] Swagger/OpenAPI inicial no backend
- [x] skills externas prioritarias importadas para `.agents/skills`
- [x] trilha de backend reforcada com skills de arquitetura e modelagem de dominio
- [x] trilha de testes reforcada com skills de planejamento, integracao e contrato de API

### Back planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `architecture-patterns`, `domain-modeling`, `review-architecture`, `api-designer`, `supabase-postgres-best-practices`.
- [x] Inventariar o estado real da API Rails e registrar que ela ainda e esqueleto tecnico.
- [x] Definir convencao arquitetural para controllers, services/use-cases, policies, serializers e jobs.
- [x] Definir envelope padrao de erro da API e envelope padrao de erro operacional do worker.
- [x] Definir nomenclatura oficial de entidades operacionais e analiticas.
- [x] Definir campos obrigatorios de rastreabilidade em logs, auditoria e eventos.

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `api-documenter`, `openapi`, `review-codebase`.
- [x] Reescrever [`apps/api/README.md`](C:/estudos/StreamGate/apps/api/README.md) para refletir o projeto real.
- [x] Remover placeholders de codigo realmente enganadores dentro da API quando atrapalharem onboarding.
- [x] Criar ADR inicial explicando papel da API como orquestradora, nao como processadora pesada.
- [x] Formalizar, em documentacao, responsabilidades do backend por camada.

### Front planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `frontend-skill`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`.
- [x] Reconhecer a UI atual como baseline oficial do projeto.
- [x] Definir regras objetivas de telas autenticadas vs publicas.
- [x] Definir comportamento padrao para loading, empty state, erro, sucesso e formularios.
- [x] Registrar o conjunto minimo de componentes que devem ser reaproveitados antes de criar novos.

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [x] Atualizar [`apps/web/README.md`](C:/estudos/StreamGate/apps/web/README.md) para refletir o estado real do frontend.
- [x] Consolidar em documentacao a biblioteca de componentes/layouts ja existente no dashboard e nas telas de auth.
- [x] Documentar quais estados de interface ainda sao mock.
- [x] Fechar uma UI rules section para evitar regressao visual futura.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [x] Confirmar que `scripts/bootstrap`, `scripts/dev`, `scripts/ci` e `scripts/compose` sao os caminhos oficiais documentados.
- [x] Classificar a falha do Vitest entre problema de ambiente, permissao e compatibilidade de runner.
- [x] Classificar a falha do worker causada por `git ls-files` no gemspec.
- [x] Documentar matriz de ambientes suportados e recomendacao `WSL-first`.
- [x] Rodar e registrar os checks existentes por escopo, separando falha de ambiente de falha de implementacao.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [x] Criar este roadmap mestre em `docs/planning/`.
- [x] Criar ADR inicial em `docs/adr/`.
- [x] Criar catalogo de skills em `.agents/skills/README.md`.
- [x] Atualizar hub de documentacao para incluir roadmap e ADRs.
- [x] Registrar Definition of Done global de forma referenciavel por PR e sprint.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [x] Definir matriz oficial de testes por camada: unitario, request, integracao, contrato, E2E, docker smoke, seguranca.
- [x] Definir cobertura minima desejada por tipo de entrega.
- [x] Definir quais comandos sao fonte de verdade por stack.
- [x] Definir criterio para aceitar falha causada exclusivamente por ambiente.

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [x] Confirmar que existem testes basicos no frontend.
- [x] Registrar formalmente a falha atual do Vitest no ambiente Windows.
- [x] Registrar formalmente a falha atual do worker no ambiente Windows.
- [x] Executar e registrar o estado atual da API, worker, frontend e compose smoke.

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `kubernetes`, `security-best-practices`, `security-threat-model`.
- Documentos de apoio: [docs/guides/security-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/security-baseline-sprint-0.md), [docs/guides/streamgate-threat-model.md](C:/estudos/StreamGate/docs/guides/streamgate-threat-model.md) e [docs/guides/definition-of-done.md](C:/estudos/StreamGate/docs/guides/definition-of-done.md).
- [x] Criar threat model inicial do repositorio inteiro.
- [x] Delimitar superficies de ataque: auth, upload, storage, broker, dashboard, analytics.
- [x] Definir scanners oficiais por camada.
- [x] Definir politica minima de segredos, `.env` e arquivos sensiveis.
- [x] Tornar obrigatoria revisao de seguranca proporcional ao escopo da sprint.

### Skills da sprint

- [x] Instalar skills externas prioritarias para backend, API docs, CI/CD, Kubernetes e observabilidade.
- [x] Instalar skills de arquitetura e modelagem para pensar backend antes da implementacao.
- [x] Instalar skills de teste para planejamento, integracao e contrato.
- [x] Manter skills locais de frontend, testes, threat model e Postgres como baseline.
- [x] Documentar gatilhos de uso por trilha dentro do catalogo de skills.
- [x] Revisar, ao fim da sprint, se alguma skill importada nao agrega valor real e deve ser descontinuada.

### Checklist de saida

- [x] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [x] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.
- [x] Trilha nao tocada registrada: `Worker execution` (nao aplicavel nesta sprint).
- [x] Roadmap mestre criado.
- [x] ADR inicial criada.
- [x] Catalogo de skills criado.
- [x] `apps/api/README.md` refeito.
- [x] `apps/web/README.md` refeito.
- [x] `apps/worker/README.md` refeito.
- [x] Falha do Vitest classificada e documentada.
- [x] Falha do worker classificada e documentada.
- [x] Matriz de testes criada e validada.
- [x] Threat model inicial criado.

---

## Sprint 1 - Modelo de dominio, contratos e arquitetura executavel

**Status atual:** `Concluida`

**Dependencias**

- Sprint 0 com baseline documental fechada

**Bloqueadores conhecidos**

- nenhum bloqueador critico aberto para fechar a Sprint 1
- limitacao conhecida de ambiente Windows para `vitest`/`vite build` (`spawn EPERM` e binary nativa do Tailwind), sem impacto no fechamento do escopo de planejamento e execucao desta sprint

**O que nao pode ficar para depois**

- congelar vocabulario do dominio antes de construir endpoints
- separar o que e operacional do que e analitico
- evitar que frontend e backend inventem nomes diferentes para o mesmo conceito

**Contexto e intencao**

Antes de escrever upload, jobs e analytics, o projeto precisa concordar sobre o significado das entidades. Esta sprint transforma visao de produto em modelo de dominio, contratos versionados e invariantes.

**Ja existe hoje**

- [x] visao do produto em `docs/product/vision.md`
- [x] arquitetura base em `docs/guides/architecture.md`
- [x] stack de infra que antecipa PostgreSQL, MinIO, RabbitMQ e ClickHouse

### Back planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `architecture-patterns`, `domain-modeling`, `review-architecture`, `api-designer`, `supabase-postgres-best-practices`.
- [x] Definir entidades centrais: `User`, `Upload`, `Job`, `JobBatch`, `QuarantineRecord`, `AuditEvent`, `ProcessingAttempt`.
- [x] Definir estados oficiais de `Job` e `JobBatch`.
- [x] Definir invariantes de dominio que nunca podem ser violadas.
- [x] Definir quais atributos vivem no PostgreSQL e quais sao derivados para ClickHouse.
- [x] Definir taxonomia de erro operacional vs erro de validacao.
- [x] Definir estrategia oficial de identificadores (`user_id`, `upload_id`, `job_id`, `batch_id`, `audit_event_id`) e padrao de geracao.
- [x] Definir envelope de sucesso, paginacao e filtros da API antes da proliferacao de endpoints.
- [x] Definir estrutura real de `packages/contracts` com schemas, exemplos, versionamento e estrategia de reutilizacao entre Ruby e TypeScript.

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `api-documenter`, `openapi`, `review-codebase`.
- [x] Criar migrations iniciais do dominio operacional.
- [x] Criar models base com validacoes minimas e nomes definitivos.
- [x] Criar enums/constantes de estados.
- [x] Criar estrutura minima de auditoria.
- [x] Adicionar seeds/fixtures minimas para desenvolvimento e testes.
- [x] Materializar esqueleto de `services`, `policies`, `serializers` e contratos para impedir que a API cresca direto em controllers.
- [x] Criar constraints e indices minimos que suportem idempotencia, rastreabilidade e consultas operacionais futuras.

### Front planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `frontend-skill`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`.
- [x] Mapear os modulos finais do dashboard operacional.
- [x] Mapear os modulos finais do dashboard analitico.
- [x] Definir quais estados reais de job precisam aparecer na UI.
- [x] Definir como a navegacao do shell atual vai crescer sem reescrita estrutural.
- [x] Definir a segmentacao oficial de rotas protegidas (`/dashboard`, `/jobs`, `/quarantine`, `/analytics`, `/audit`, `/settings`) mesmo que algumas ainda nascam como cascas.

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [x] Ajustar arquitetura de rotas/layouts para acomodar `Jobs`, `Quarentena`, `Auditoria` e `Analytics`.
- [x] Reservar slots de navegacao e layout para modulos futuros.
- [x] Garantir que a estrutura de IA nao force retrabalho quando dados reais chegarem.
- [x] Introduzir a primeira camada oficial de cliente/adapter HTTP do frontend para preparar a troca de mocks por contratos reais.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [x] Garantir que `db:prepare` seja reproduzivel num banco limpo.
- [x] Validar criacao/rollback de migrations em ambiente local.
- [x] Definir fixture minima para desenvolvimento sem dados manuais.
- [x] Revisar nomes de servicos e variaveis que os contratos vao depender.
- [x] Garantir que scripts de suporte e automacao rodem com encoding previsivel em WSL e PowerShell.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [x] Criar glossario de dominio.
- [x] Criar ADR de dominio e fronteiras.
- [x] Criar primeiros contratos em `packages/contracts`.
- [x] Documentar versionamento de contratos e regras de compatibilidade.
- [x] Registrar convencao de ids, envelopes, paginacao e filtros como parte do contrato publico do projeto.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [x] Planejar testes de migration.
- [x] Planejar testes de model.
- [x] Planejar testes de transicao de estado.
- [x] Planejar validacao de contratos/eventos.

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [x] Rodar migrations em banco limpo.
- [x] Executar os primeiros testes de dominio.
- [x] Validar se os contratos versionados batem com exemplos reais.

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `kubernetes`, `security-best-practices`, `security-threat-model`.
- [x] Classificar campos sensiveis do dominio.
- [x] Definir visibilidade minima por recurso.
- [x] Definir o que deve ou nao ir para logs, auditoria e payloads.
- [x] Definir classificacao inicial de dados e estrategia minima de redacao/sanitizacao para campos sensiveis.

### Skills da sprint

- [x] Usar `architecture-patterns` para validar a forma do backend antes de abrir models, services e eventos.
- [x] Usar `domain-modeling` para desenhar entidades, invariantes e estados antes de escrever migrations.
- [x] Usar `review-architecture` para validar o desenho do dominio antes de abrir muitos arquivos.
- [x] Usar `review-codebase` ao final da sprint para checar coerencia estrutural.
- [x] Usar `supabase-postgres-best-practices` para revisar schema, indices e naming.

### Checklist de saida

- [x] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [x] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.
- [x] Trilha nao tocada registrada: `Worker execution` (nao aplicavel nesta sprint).
- [x] Entidades principais modeladas.
- [x] Contratos versionados criados.
- [x] Banco sobe e migra do zero sem acao manual obscura.
- [x] Glossario e ADR de dominio publicados.
- [x] Testes de dominio e migration verdes.

---

## Sprint 2 - Autenticacao real e sessao

**Status atual:** `Concluida`

**Dependencias**

- Sprint 1 com dominio base e contratos iniciais definidos

**Bloqueadores conhecidos**

- frontend ja opera com auth real; proxima lacuna e conectar dados reais dos modulos do workspace
- backend e frontend ja possuem auth real; fechamento documental e hardening da Sprint 2 foram concluidos em 2026-04-07
- Swagger ja cobre auth real; proximas iteracoes cobrem recursos de negocio da API

**O que nao pode ficar para depois**

- definir erro de auth desde o inicio
- decidir politica de sessao/token antes de espalhar suposicoes no frontend
- impedir que o dashboard continue acoplado ao mock no fluxo principal

**Contexto e intencao**

O frontend ja ensaiou a experiencia de acesso. Esta sprint faz o backend assumir esse papel de forma real, segura, documentada e testavel.

**Ja existe hoje**

- [x] telas de login, cadastro e reset
- [x] route guard no frontend
- [x] experiencia de auth mock ja validada visualmente

### Back planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `architecture-patterns`, `domain-modeling`, `review-architecture`, `api-designer`, `supabase-postgres-best-practices`.
- [x] Definir mecanismo de autenticacao e sessao.
- [x] Definir payloads de cadastro, login, logout e reset.
- [x] Definir politica de senha, expiracao e revogacao.
- [x] Definir modelo de `User` e perfil minimo.
- [x] Definir papeis iniciais de acesso e a fronteira entre autenticacao e autorizacao da v1.
- [x] Definir endpoints minimos de sessao atual, expiracao e renovacao/revalidacao quando aplicavel.

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `api-documenter`, `openapi`, `review-codebase`.
- [x] Implementar persistencia de usuarios.
- [x] Implementar hashing de senha.
- [x] Implementar endpoints reais de auth.
- [x] Implementar sessao/token e logout.
- [x] Implementar endpoint `me` ou equivalente para bootstrap da sessao no frontend.
- [x] Implementar contrato de erro para sessao expirada, credencial invalida e acesso negado.
- [x] Documentar tudo em Swagger/OpenAPI.

### Front planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `frontend-skill`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`.
- [x] Mapear impacto da troca de mock para integracao real.
- [x] Definir estados de loading, erro e sessao expirada.
- [x] Confirmar que o design atual suporta erros reais sem gambiarras.

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [x] Remover dependencia do auth mock do fluxo principal.
- [x] Conectar login/cadastro/reset/logout ao backend.
- [x] Exibir erros reais sem degradar a UX.
- [x] Validar persistencia de sessao conforme politica definida.
- [x] Substituir `auth.ts`/storage mock por adapter de sessao real preservando a UX atual.
- [x] Centralizar consumo de auth em cliente HTTP unico para evitar acoplamento de pagina com transporte.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [x] Adicionar envs e segredos de auth.
- [x] Criar seeds minimas para desenvolvimento.
- [x] Ajustar CI para cobrir auth real.
- [x] Configurar envs de CORS/CSRF/cookies conforme a estrategia de sessao escolhida.
- [x] Garantir seeds e fixtures de auth reproduziveis em ambiente local e CI.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [x] Atualizar setup para incluir auth real.
- [x] Atualizar API docs e guia de autenticacao.
- [x] Documentar contrato de erro de auth.
- [x] Criar ADR curto da estrategia de autenticacao da SPA.

Evidencia minima da trilha (2026-04-07):

- [x] `docs/guides/setup.md` atualizado com workflow `e2e-auth` e envs de hardening de auth.
- [x] `docs/guides/api-docs.md` atualizado com contrato de erro (`invalid_credentials`, `access_denied`, `session_expired`, `rate_limited`) e status HTTP.
- [x] `docs/guides/authentication-guide.md` criado como guia operacional de auth da Sprint 2.
- [x] `docs/adr/0003-authentication-and-session-strategy.md` atualizado com decisoes de hardening.
- [x] `docs/sprints/SPRINT-02-closeout.md` publicado com checklist e evidencias da sprint.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [x] Planejar request/model auth com cobertura explicita de `session_expired` em sessao real expirada.
- [x] Planejar separacao de suites web por contrato de gate: `test:run` (unit), `test:integration` (backend real) e `test:e2e` (Playwright).
- [x] Planejar E2E auth estendido (register/login/logout/reset/sessao expirada) com execucao em Chromium + Firefox.
- [x] Planejar gate obrigatorio de CI dedicado (`e2e-auth`) e paridade no runner local (`ci-local` workflow `e2e`).

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [x] Executar request specs de auth com cenario real de expiracao de sessao.
- [x] Executar testes do frontend ligados ao backend real.
- [x] Executar E2E cobrindo fluxo completo de acesso (Chromium + Firefox).

Evidencia minima da trilha (2026-04-07):

- [x] `docker compose exec -T api bundle exec rails test test/requests/auth_flow_test.rb` (8 runs, 32 assertions, 0 failures).
- [x] `pnpm lint` em `apps/web`.
- [x] `pnpm test:run` em `apps/web` (7 files, 30 tests, 0 failures).
- [x] `pnpm test:integration` em `apps/web` com backend real (1 file, 3 tests, 0 failures).
- [x] `.\scripts\ci\ci-local.ps1 -Workflow e2e` (stack app + seed + integration + Playwright: 8 passed).

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `kubernetes`, `security-best-practices`, `security-threat-model`.
- [x] Revisar hashing e armazenamento de segredos.
- [x] Revisar enumeracao de usuario.
- [x] Revisar rate limit inicial.
- [x] Revisar mensagens de erro e logs de auth.
- [x] Revisar CORS, CSRF, cookies `httpOnly`, `sameSite` e armazenamento de sessao no browser conforme a estrategia adotada.

Evidencia minima da trilha (2026-04-07):

- [x] `docker compose exec -T api bundle exec rails test test/requests/auth_flow_test.rb` (8 runs, 32 assertions, 0 failures), incluindo cobertura de `session_expired` e `rate_limited`.
- [x] `AuthRuntime` com limites configuraveis por ENV para login, registro e reset de senha, com janela de throttle centralizada.
- [x] Controllers de auth com `enforce_rate_limit!` por IP/identificador e log estruturado de falha sem vazamento de segredo.

### Skills da sprint

- [x] Usar `test-driven-development` antes da implementacao do backend de auth.
- [x] Usar `security-best-practices` como checklist de fechamento.
- [x] Usar `api-documenter`, `api-designer` e `openapi` para manter contrato forte.

### Checklist de saida

- [x] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [x] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.
- [x] Trilha de Documentation concluida com setup, API docs, auth guide, ADR e closeout da sprint.
- [x] Trilha de Test planning/execution atualizada com evidencia minima da Sprint 2.
- [x] Workflow dedicado `e2e-auth` criado e runner local estendido com modo `e2e`.

- [x] Login real funciona ponta a ponta.
- [x] Dashboard deixa de depender do mock no fluxo principal.
- [x] Swagger cobre auth.
- [x] E2E de acesso esta verde.
- [x] CI de auth permanece verde (gate local `ci-local e2e` e workflow dedicado `e2e-auth` preparados).

### Delta por trilha (2026-04-07)

- Back planning: concluida; arquitetura, contratos e politica de sessao definidos para auth real.
- Back execution: concluida; endpoints, sessao, refresh, logout, `me` e erros contratuais implementados.
- Front planning: concluida; estados de loading/erro/sessao expirada mapeados para integracao real.
- Front execution: concluida; fluxo auth conectado ao backend real sem dependencia de mock.
- DevOps: concluida; envs/seeds/CI para auth real estabilizados e reproduziveis.
- Documentation: concluida; setup, guia de auth, OpenAPI, ADR e closeout da sprint sincronizados.
- Test planning: concluida; matriz unit/integration/e2e e gate dedicado definidos.
- Test execution: concluida; request/integration/e2e executados com evidencia minima registrada.
- Security: concluida; hardening inicial (throttle, logs, contratos e superficie de sessao) aplicado e validado.
- Skills da sprint: concluida; uso das skills obrigatorias registrado por trilha.

---

## Sprint 2.5 - Pente fino estrutural e prontidao para o novo direcionamento de produto

**Status atual:** `Concluida (Gate sem duracao fixa)`

**Dependencias**

- Sprint 2 concluida com auth real, sessao e gates minimos estabilizados.
- Visao de produto atualizada em `2026-04-07` e consolidada em `docs/product/vision.md`.

**Bloqueadores conhecidos**

- Possiveis desalinhamentos entre contratos atuais de API/frontend e a nova visao de produto ainda nao mapeados ponta a ponta.
- Riscos de naming, estados de UX e acoplamentos estruturais podem gerar retrabalho direto na Sprint 3 se nao forem tratados antes.
- Limites de ambiente no host Windows continuam relevantes para parte das validacoes locais; fluxo oficial segue `WSL-first`.

**O que nao pode ficar para depois**

- remover conflitos de naming, contrato e UX base que possam contaminar a Sprint 3;
- fechar lacunas estruturais pequenas agora para evitar rework caro nas trilhas futuras;
- registrar pendencias priorizadas com clareza de ownership e criterio de transicao.

**Contexto e intencao**

Esta sprint funciona como gate de prontidao entre a Sprint 2 e a Sprint 3. O objetivo e validar aderencia entre implementacao atual e nova visao de produto, corrigindo desalinhamentos pontuais antes de abrir nova feature de negocio.

Regra explicita da Sprint 2.5: permitido ajuste pontual de codigo para alinhamento estrutural; proibido abrir novo pacote funcional amplo.

**Ja existe hoje**

- [x] auth real e sessao em producao local com gates minimos ativos.
- [x] shell protegido do workspace e malha principal de rotas no frontend.
- [x] base de dominio (`Upload`, `Job`, `AuditEvent`) e contratos iniciais versionados.
- [x] Sprint 3 planejada para upload assinado + criacao de job.

### Back planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `architecture-patterns`, `domain-modeling`, `review-architecture`, `api-designer`, `supabase-postgres-best-practices`.
- [x] Mapear delta entre visao de produto atualizada e modelo de dominio/API existente.
- [x] Listar gaps de contrato que podem quebrar compatibilidade na trilha upload/job base.
- [x] Revisar decisoes de idempotencia e naming para manter consistencia entre backend, OpenAPI e contratos.
- [x] Definir fronteiras explicitas do que fica para Sprint 3 base vs Sprint 3.x/4.

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `openapi`, `review-codebase`.
- [x] Executar ajustes pontuais de estrutura em backend sem abrir features novas de negocio.
- [x] Reduzir acoplamentos desnecessarios entre controllers, services e contratos HTTP.
- [x] Alinhar naming e envelopes de resposta onde houver drift conhecido.
- [x] Atualizar contratos e OpenAPI quando houver ajuste estrutural que afete interface existente.

### Front planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `frontend-skill`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`.
- [x] Mapear delta UX atual vs visao (modo `guided`/`advanced`, observabilidade operacional, produtividade).
- [x] Definir matriz minima de estados obrigatorios por pagina de workspace antes da Sprint 3.
- [x] Priorizar ajustes de base que reduzem retrabalho nas proximas funcionalidades.

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [x] Aplicar ajustes pontuais de base no workspace para coerencia de estados e navegacao.
- [x] Consolidar convencoes de erro/loading/empty no shell compartilhado sem redesenhar a UX inteira.
- [x] Preservar adapter HTTP unico (`api-client`) e remover pontos de acoplamento que dificultem a Sprint 3.
- [x] Nao abrir escopo de conectores (`google_drive`, `s3`, `http_url`) nesta sprint.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [x] Revisar envs e variaveis compartilhadas para evitar drift antes da trilha upload/job.
- [x] Revisar pipelines para garantir gate coerente com mudancas pontuais da Sprint 2.5.
- [x] Definir sinais minimos de observabilidade para a transicao segura da Sprint 3.
- [x] Registrar limites de ambiente (Windows/WSL) e workaround oficial atualizado.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [x] Atualizar roadmap mestre com delta real da Sprint 2.5 e criterio de liberacao da Sprint 3.
- [x] Atualizar documentos de arquitetura/guias tocados pelos ajustes pontuais desta sprint.
- [x] Registrar decisoes de fronteira (o que entra na Sprint 3 base e o que fica para 3.x/4).
- [x] Publicar closeout da Sprint 2.5 com riscos residuais e pendencias priorizadas.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [x] Definir matriz de regressao para cada ajuste estrutural pontual aprovado.
- [x] Planejar verificacoes de contrato para garantir que ajustes de 2.5 nao quebrem a base da Sprint 3.
- [x] Planejar smoke de workspace para estados essenciais apos os ajustes.

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [x] Executar suites relevantes por camada de acordo com o delta aplicado.
- [x] Registrar evidencias por comando, resultado e classificacao ambiente vs implementacao.
- [x] Confirmar que nao houve regressao no fluxo de auth/sessao e no shell do workspace.

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `security-best-practices`, `security-threat-model`.
- [x] Revisar superficies de ataque para ingestao futura por `external_link` e `connector` sem implementar conectores agora.
- [x] Validar se contratos/logs atuais evitam vazamento de dados sensiveis em fluxos de erro.
- [x] Revisar rate limits e controles base que serao reutilizados na Sprint 3.
- [x] Registrar riscos residuais e mitigacoes propostas para Sprint 3.x/4.

### Skills da sprint

- [x] Usar `review-codebase` e `review-architecture` no inicio para mapear desalinhamentos estruturais.
- [x] Usar `api-designer` e `openapi` para corrigir drift de contrato antes da feature sprint.
- [x] Usar `breakdown-test` para matriz de regressao da Sprint 2.5.
- [x] Usar `monitoring-observability` para definir sinais minimos de prontidao da Sprint 3.
- [x] Usar `readiness-report` no fechamento para validar o gate de transicao.

### Checklist de saida

- [x] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [x] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.
- [x] Gate so fecha com riscos residuais documentados e pendencias priorizadas com proximo passo definido.
- [x] Conflitos de naming/contrato/UX base identificados e tratados ou aceitos explicitamente.
- [x] Sprint 3 liberada apenas com pre-condicoes estruturais verificadas.

### Reavaliacao de transicao por trilha

- [x] `Back planning`: confirmar que o delta visao x dominio/API foi fechado para a Sprint 3 base.
- [x] `Back execution`: confirmar que ajustes pontuais nao abriram escopo funcional indevido.
- [x] `Front planning`: confirmar matriz de estados obrigatorios para upload/job base.
- [x] `Front execution`: confirmar reducao de acoplamento e ausencia de regressao visual/funcional critica.
- [x] `DevOps`: confirmar envs/gates minimos prontos para fluxo upload/job.
- [x] `Documentation`: confirmar rastreabilidade das decisoes e fronteiras da Sprint 3.
- [x] `Test planning`: confirmar cobertura de regressao adequada para o delta da 2.5.
- [x] `Test execution`: confirmar evidencias minimas de validacao do gate.
- [x] `Security`: confirmar riscos residuais mapeados para ingestao por link/conector em sprint posterior.
- [x] `Skills da sprint`: registrar gaps, ajustes e recomendacoes para Sprint 3.

### Delta por trilha (2026-04-07)

- Back planning: concluida; delta visao x dominio/API mapeado e fronteiras da Sprint 3 base congeladas.
- Back execution: concluida; ajustes pontuais de estrutura/hardening aplicados sem abrir pacote funcional novo.
- Front planning: concluida; matriz de estados obrigatorios e URL state minimo (`status` + `page`) consolidados.
- Front execution: concluida; adapter HTTP alinhado para `/api/v1/uploads` e `/api/v1/jobs` com suporte a envelope completo.
- DevOps: concluida; envs oficiais de readiness de upload alinhados em `.env.example`, compose e CI.
- Documentation: concluida; roadmap, guias e closeout sincronizados no mesmo ciclo.
- Test planning: concluida; regressao da trilha de adapter/contrato mapeada para o gate.
- Test execution: concluida; suites relevantes do delta executadas e registradas.
- Security: concluida; filtro de parametros sensiveis ampliado para segredos e URL assinada.
- Skills da sprint: concluida; uso das skills obrigatorias registrado por trilha.

Evidencia de fechamento:

- [x] `docs/sprints/SPRINT-02-5-closeout.md` publicado.

---
## Sprint 3 - Upload assinado e criacao de job (E2E Workspace)

**Status atual:** `Concluida`

**Dependencias**

- Sprint 2 concluida com auth real, sessao, CI `e2e-auth`, OpenAPI de auth e base de dominio consolidada.
- Sprint 2.5 concluida com gate de prontidao estrutural fechado e sem pendencias criticas abertas.

**Bloqueadores conhecidos**

- worker runtime segue fora de escopo funcional nesta fase (container de desenvolvimento, sem consumo real de fila);
- limitacoes conhecidas do host Windows para Vitest seguem classificadas como ambiente; fluxo oficial permanece `WSL-first`;
- nenhuma pendencia critica para o escopo da Sprint 3 base.

**O que nao pode ficar para depois**

- congelar o contrato de upload assinado antes de plugar UI real;
- entregar leitura real minima de uploads/jobs para tirar o workspace do mock principal dessa trilha;
- fechar testes por camada e manter OpenAPI + contratos sincronizados no mesmo ciclo.

**Contexto e intencao**

Com auth ja estabilizada na Sprint 2 e o gate estrutural fechado na Sprint 2.5, o gargalo seguinte da v1 passa a ser ingestao. Esta sprint fecha o fluxo ponta a ponta de entrada no workspace autenticado:

- assinar upload;
- enviar arquivo para object storage com URL assinada;
- confirmar upload e registrar job;
- ler uploads/jobs reais na interface.

Escopo confirmado desta sprint: `upload+job base`, sem abertura de conectores e sem runtime real do worker.

Regra desta sprint: trilha de `Documentation` fica no final para consolidar o que foi entregue.

Fronteira explicita (fora da Sprint 3 base): `external_link`, `oauth_delegated` e conectores wave 1 (`google_drive`, `s3`, `http_url`) ficam para sprint posterior (3.x/4).

**Ja existe hoje**

- [x] dominio base (`Upload`, `Job`, `AuditEvent`) e `Uploads::RegisterUploadService` no backend;
- [x] adapter frontend (`api-client`, `streamgate-api`) com base para leituras de uploads/jobs;
- [x] contratos base em `packages/contracts` e OpenAPI v1 com auth.

### Back planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `architecture-patterns`, `domain-modeling`, `review-architecture`, `api-designer`, `supabase-postgres-best-practices`.
- [x] Congelar fluxo em 2 etapas: `POST signed-url` + `POST register upload/job`.
- [x] Definir endpoints oficiais da sprint:
  - `POST /api/v1/uploads/signed-url`
  - `POST /api/v1/uploads`
  - `GET /api/v1/uploads`
  - `GET /api/v1/jobs`
- [x] Definir filtros minimos (`status`, `page`, `per_page`, `search` opcional) e envelope de paginacao.
- [x] Definir regra de idempotencia para registro de upload (`checksum_sha256` + `storage_key`).
- [x] Definir codigos de erro da trilha (`validation_failed`, `resource_conflict`, `access_denied`, `rate_limited`, `dependency_unavailable`).

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `api-documenter`, `openapi`, `review-codebase`.
- [x] Implementar servico de assinatura MinIO (presigned `PUT`) com TTL configuravel.
- [x] Criar controllers/policies/serializers para upload e listagens de upload/job.
- [x] Integrar `POST /api/v1/uploads` ao `Uploads::RegisterUploadService`.
- [x] Garantir auditoria no registro de upload/job com `trace_id` e `request_id`.
- [x] Implementar resposta paginada em envelope padrao (`data` + `meta.pagination` + `meta.filters`).
- [x] Atualizar `config/routes.rb` e `apps/api/openapi/v1/openapi.yaml` no mesmo PR.
- [x] Manter fora de escopo os ajustes de pente fino estrutural ja tratados na Sprint 2.5.

### Front planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `frontend-skill`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`.
- [x] Definir UX do `UploadPage` para estados reais: idle, assinando, enviando, confirmando, sucesso e erro.
- [x] Definir estrategia de refresh de dados apos upload confirmado (`/uploads` e `/jobs`).
- [x] Definir empty/error/loading states reais para `UploadPage` e `JobsPage`.
- [x] Definir mapeamento de filtros de jobs/uploads na URL (minimo: `status` + `page`).

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [x] Adicionar no `streamgate-api` metodos para solicitar signed URL, registrar upload/job e listar uploads/jobs com filtros.
- [x] Implementar formulario real de upload em `UploadPage` com envio para URL assinada.
- [x] Trocar blocos mock de `JobsPage` para consumo real da API.
- [x] Aplicar estados explicitos de loading/empty/error/success sem quebrar o shell visual atual.
- [x] Preservar adapter HTTP unico (`api-client`) com tratamento centralizado de erros contratuais.
- [x] Manter fora de escopo os ajustes estruturais horizontais que nao impactam diretamente upload/job base.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [x] Introduzir envs oficiais de assinatura/upload (endpoint/bucket/ttl/credenciais S3-compativeis).
- [x] Garantir CORS do MinIO para upload browser via presigned `PUT`.
- [x] Ajustar compose/profile `full` para variaveis de upload sem drift.
- [x] Atualizar CI local/remoto para incluir testes da trilha upload/job.
- [x] Incluir smoke operacional para upload assinado (stack app + seed + fluxo minimo).
- [x] Tratar como pre-condicao atendida os ajustes de base e governanca fechados na Sprint 2.5.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [x] Planejar request tests da API para os 4 endpoints novos (sucesso + erros esperados).
- [x] Planejar testes de contrato para novos schemas HTTP e exemplos.
- [x] Planejar testes frontend unitarios para o novo adapter upload/job.
- [x] Planejar integracao web->api para fluxo `signed-url -> register`.
- [x] Planejar E2E minimo de dominio: usuario autenticado envia arquivo e visualiza job criado.
- [x] Reusar matriz de regressao da Sprint 2.5 para garantir ausencia de regressao estrutural.

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [x] Rodar `bundle exec rails test` cobrindo requests e services de upload/job.
- [x] Rodar `pnpm lint` e `pnpm test:run` em `apps/web`.
- [x] Rodar `pnpm test:integration` com backend real para fluxo upload/job.
- [x] Rodar E2E do fluxo completo com stack `full`.
- [x] Registrar evidencias por comando, resultado e classificacao ambiente vs implementacao.

Evidencias registradas (2026-04-10):

- `apps/api`: `bundle exec rails test` com envs de projeto (`35 runs`, `147 assertions`, `0 failures`, `0 errors`).
- `apps/web`: `pnpm lint` (ok), `pnpm test:run` (`9` arquivos, `41` testes, ok), `pnpm test:integration` (`3` testes, ok), `pnpm test:e2e` (`8` testes, ok).
- operacao: `python scripts/compose/compose-smoke.py` (ok) e `python scripts/compose/upload-signed-smoke.py` (ok, upload/job criado).
- classificacao ambiente vs implementacao: sem falha de implementacao aberta no fechamento; limitacoes de host Windows permanecem documentadas como ambiente quando nao reproduzidas em `WSL/CI`.

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `kubernetes`, `security-best-practices`, `security-threat-model`.
- [x] Validar allowlist de `content_type` e limites de tamanho no registro.
- [x] Garantir TTL curto e escopo restrito da signed URL.
- [x] Revisar riscos de overwrite/path traversal em `storage_key`.
- [x] Revisar rate limit para `signed-url` e `register upload`.
- [x] Garantir que logs/auditoria nao vazem segredos, token ou URL assinada completa.
- [x] Manter fora de escopo desta sprint os riscos especificos de conectores externos (Sprint 3.x/4).

### Skills da sprint

- [x] Usar `test-driven-development` antes da implementacao dos endpoints de upload/job.
- [x] Usar `api-designer` e `openapi` para fechar contrato antes da UI.
- [x] Usar `api-contract-testing` para sincronizar `packages/contracts` com OpenAPI.
- [x] Usar `breakdown-test` para matriz de cobertura por camada.
- [x] Usar `monitoring-observability` para sinais operacionais minimos da trilha.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [x] Atualizar este roadmap mestre com status e evidencia real da sprint.
- [x] Atualizar `docs/guides/api-docs.md` com endpoints e erros da trilha upload/job.
- [x] Atualizar `docs/guides/setup.md` com envs de upload, CORS MinIO e comandos de validacao.
- [x] Atualizar `docs/guides/frontend-foundations.md` e `docs/guides/frontend-workspace-map.md` com estados reais de upload/jobs.
- [x] Atualizar `apps/api/README.md` e `apps/web/README.md` com o fluxo novo.
- [x] Atualizar contratos em `packages/contracts` (schemas, exemplos e compatibilidade).
- [x] Publicar `docs/sprints/SPRINT-03-closeout.md`.

### Checklist de saida

- [x] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [x] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.
- [x] Trilha nao tocada registrada: `Worker execution` (nao tocada nesta sprint).
- [x] Pre-condicoes da Sprint 2.5 validadas e sem item critico pendente para o escopo da Sprint 3.
- [x] Fluxo upload assinado + criacao de job funcionando ponta a ponta.
- [x] Workspace autenticado exibindo uploads/jobs reais no fluxo principal da trilha.
- [x] OpenAPI, contratos e documentacao sincronizados no mesmo ciclo da entrega.
- [x] Gate de testes da sprint verde em CI local e remoto.

### Reavaliacao de transicao por trilha

- [x] `Back planning`: comparar contrato planejado vs implementado.
- [x] `Back execution`: registrar dividas tecnicas movidas para Sprint 4.
- [x] `Worker execution`: registrar explicitamente `nao tocada nesta sprint`.
- [x] `Front planning`: validar ajustes de jornada e prioridades de UX.
- [x] `Front execution`: validar fluxo real, estados de UI, a11y e performance.
- [x] `DevOps`: revisar maturidade de smoke, gates e readiness para runtime real do worker.
- [x] `Documentation`: confirmar fechamento documental completo ao final da sprint.
- [x] `Test planning`: confirmar cobertura obrigatoria da sprint seguinte.
- [x] `Test execution`: registrar resultados e risco residual.
- [x] `Security`: registrar riscos residuais de upload, storage e broker.
- [x] `Skills da sprint`: registrar lacunas e ajustes no stack de skills da proxima sprint.

### Delta por trilha (Sprint 3 - fechamento)

- Back planning: concluida; contrato da trilha upload/job congelado e entregue conforme planejado.
- Back execution: concluida; endpoints de upload/job base entregues com idempotencia, paginacao, auditoria e contrato sincronizado.
- Front planning: concluida; jornada e estado da UX fechados para `/upload` e `/jobs`.
- Front execution: concluida; workspace autenticado opera com upload assinado e listagens reais sem mock no fluxo principal.
- DevOps: concluida; envs oficiais, CORS MinIO, compose/full e smoke operacional da trilha estabilizados.
- Documentation: concluida; guias, READMEs, roadmap e closeout sincronizados no mesmo ciclo.
- Test planning: concluida; cobertura por camada formalizada e alinhada com matriz da Sprint 2.5.
- Test execution: concluida; suites backend/web/integration/e2e e smokes operacionais validadas.
- Security: concluida; allowlist, TTL, storage_key hardening, rate limit e filtro de segredos revisados.
- Skills da sprint: concluida; skills obrigatorias aplicadas nas trilhas da Sprint 3.

## Pos-v1 e backlog estrategico

Os itens abaixo nao entram na trilha critica da v1, mas ja estao visiveis pelo estado atual do produto e devem permanecer no horizonte oficial para evitar reinvencao desordenada depois do cluster.

### Evolucoes funcionais naturais

- SSE ou WebSocket para reduzir polling quando o dashboard operacional ja estiver estavel.
- RBAC mais fino por modulo, recurso e acao operacional.
- Suporte a novos tipos de pipeline alem do fluxo principal de ingestao de arquivos.
- Ferramentas de investigacao mais profundas no dashboard, como diff entre tentativas e comparacao de replays.

### Evolucoes de plataforma

- tracing distribuido de ponta a ponta;
- product analytics e error-to-issue pipeline;
- feature flags para rollout de modulos sensiveis;
- bundle/perf tracking do frontend e debt tracking mais formal do repositorio.

### Evolucoes de produto e arquitetura

- multi-tenant e segregacao mais forte de dados;
- politicas de retencao por cliente ou por pipeline;
- enriquecimento da camada analitica com backfills, jobs agendados e metricas historicas mais ricas.

## Ordem recomendada de execucao

Se houver pressao para pular etapas, usar esta sequencia como trava racional:

1. Fechar baseline, ambiente e metodo.
2. Congelar dominio e contratos.
3. Entregar auth real.
4. Fechar gate de prontidao estrutural (Sprint 2.5).
5. Entregar upload e criacao de job base.
6. Entregar worker e processamento.
7. Entregar quarentena e leitura operacional.
8. Entregar dashboard operacional real.
9. Entregar analytics real.
10. Entregar reprocessamento e auditoria forte.
11. Endurecer qualidade, seguranca e release.
12. Levar para Kubernetes com observabilidade madura.

## Fechamento

Se este documento for seguido com disciplina, o projeto deixa de evoluir por intuicao e passa a evoluir por capacidade comprovada. A regra e simples: nenhuma sprint e pronta porque o codigo parece bom; ela so e pronta quando o escopo implementado roda, esta testado, esta documentado, esta coberto por CI e nao abre uma divida invisivel para a sprint seguinte.
