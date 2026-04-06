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
- `CI`: existem workflows separados para frontend, backend e docker, mas o pipeline do frontend ainda nao roda `vitest` e a trilha de contrato/integracao ainda nao entrou como gate real.
- `Governanca`: existe template de PR, mas ainda nao existem `CODEOWNERS`, `dependabot.yml`, issue templates, sistema de labels, `AGENTS.md` raiz e guias formais de contribuicao.
- `Swagger/OpenAPI`: a base existe e `/api-docs` ja foi preparado, mas ainda sem recursos reais de negocio.
- `Readiness operacional`: uma leitura rapida com a skill `readiness-report` mostrou maturidade baixa para desenvolvimento autonomo assistido, com gaps mais fortes em observabilidade, seguranca automatizada, descoberta de tarefas e governanca do repositorio.
- `Gaps conhecidos`: no ambiente Windows atual, Vitest falha com `spawn EPERM`; o worker ja nao sofre mais com `git ls-files`, mas ainda nao possui runtime; scripts de automacao precisam continuar atentos a diferencas de encoding/WSL/PowerShell no host atual.

## Assumptions Fechados

- Cadencia padrao: `2 semanas` por sprint.
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

| Trilha | Reavaliacao minima obrigatoria |
| --- | --- |
| `Back planning` | escopo planejado vs escopo entregue, novos requisitos e repriorizacao de backlog |
| `Back execution` | dominio, regras, contrato HTTP/eventos, OpenAPI e debitos tecnicos transferidos |
| `Worker execution` (quando houver) | fila, retries, idempotencia, observabilidade e efeito em operacao/analytics |
| `Front planning` | jornadas, prioridades de UX e estados obrigatorios por tela/modulo |
| `Front execution` | fidelidade do fluxo real, estados de UI, acessibilidade, performance e regressao visual |
| `DevOps` | CI/gates, scripts oficiais, ambientes, smoke operacional e gaps de automacao |
| `Documentation` | docs atualizados, ADRs/runbooks alterados e inconsistencias documentais abertas |
| `Test planning` | matriz de testes da proxima sprint, novas coberturas obrigatorias e riscos de qualidade |
| `Test execution` | comandos rodados, resultados, falhas de ambiente vs implementacao e riscos residuais |
| `Security` | novas superficies sensiveis, controles faltantes, riscos aceitos e hardening priorizado |
| `Skills da sprint` | skills usadas, skills faltantes e ajustes no stack de skills da proxima sprint |

### Matriz minima de documentacao por sprint

Sempre revisar, no minimo, estes documentos quando a sprint tocar o assunto:

| Area | Documento minimo |
| --- | --- |
| Produto e escopo | `docs/product/vision.md` |
| Roadmap e progresso | este arquivo |
| Arquitetura macro | `docs/guides/architecture.md` e ADRs em `docs/adr/` |
| API | `docs/guides/api-docs.md` e `apps/api/openapi/v1/openapi.yaml` |
| Setup/ambiente | `docs/guides/setup.md` |
| Skills/metodo | `.agents/skills/README.md` |
| App especifico | `apps/web/README.md`, `apps/api/README.md`, `apps/worker/README.md` |

### Comandos oficiais de verdade

Os comandos abaixo sao a base para checklist operacional. Quando um comando falha por limitacao de ambiente, isso deve ser registrado com causa e plano de correcao.

| Escopo | Comando oficial |
| --- | --- |
| Frontend install/build | `pnpm install`, `pnpm build` em `apps/web` |
| Frontend lint/test | `pnpm lint`, `pnpm test:run` em `apps/web` |
| API | `bundle exec rails db:prepare`, `bundle exec rails test` em `apps/api` |
| Worker | `bundle exec rspec` em `apps/worker` |
| CI local | `./scripts/ci/ci-local.sh` ou `.\scripts\ci\ci-local.ps1` |
| Docker infra | `./scripts/dev/dev-up.sh` |
| Docker full | `./scripts/dev/dev-up.sh full` |
| Compose smoke | `./scripts/compose/compose-health-tests.sh` |

### Matriz de ambientes

| Ambiente | Papel | Status hoje | Observacao |
| --- | --- | --- | --- |
| `Windows host` | host de conveniencia | Parcial | Vitest falha neste ambiente; nao deve ser o fluxo principal |
| `WSL dev` | ambiente recomendado | Parcial | e o fluxo alvo para desenvolvimento diario |
| `Docker infra` | dependencias locais | Ja existe | compose e health checks ja preparados |
| `Docker full` | stack completa | Parcial | apps sobem, mas worker ainda nao tem runtime real |
| `CI GitHub` | validacao oficial | Parcial | workflows existem, mas ainda validam um produto incompleto |

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

**Status atual:** `Parcial`

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

**Status atual:** `Parcial`

**Dependencias**

- Sprint 1 com dominio base e contratos iniciais definidos

**Bloqueadores conhecidos**

- frontend ainda depende de auth mock
- backend ainda nao possui recurso real de usuario/sessao
- Swagger ainda nao cobre fluxo de auth real

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
- [ ] Definir mecanismo de autenticacao e sessao.
- [ ] Definir payloads de cadastro, login, logout e reset.
- [ ] Definir politica de senha, expiracao e revogacao.
- [ ] Definir modelo de `User` e perfil minimo.
- [ ] Definir papeis iniciais de acesso e a fronteira entre autenticacao e autorizacao da v1.
- [ ] Definir endpoints minimos de sessao atual, expiracao e renovacao/revalidacao quando aplicavel.

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `api-documenter`, `openapi`, `review-codebase`.
- [ ] Implementar persistencia de usuarios.
- [ ] Implementar hashing de senha.
- [ ] Implementar endpoints reais de auth.
- [ ] Implementar sessao/token e logout.
- [ ] Implementar endpoint `me` ou equivalente para bootstrap da sessao no frontend.
- [ ] Implementar contrato de erro para sessao expirada, credencial invalida e acesso negado.
- [ ] Documentar tudo em Swagger/OpenAPI.

### Front planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `frontend-skill`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`.
- [ ] Mapear impacto da troca de mock para integracao real.
- [ ] Definir estados de loading, erro e sessao expirada.
- [ ] Confirmar que o design atual suporta erros reais sem gambiarras.

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [ ] Remover dependencia do auth mock do fluxo principal.
- [ ] Conectar login/cadastro/reset/logout ao backend.
- [ ] Exibir erros reais sem degradar a UX.
- [ ] Validar persistencia de sessao conforme politica definida.
- [ ] Substituir `auth.ts`/storage mock por adapter de sessao real preservando a UX atual.
- [ ] Centralizar consumo de auth em cliente HTTP unico para evitar acoplamento de pagina com transporte.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [ ] Adicionar envs e segredos de auth.
- [ ] Criar seeds minimas para desenvolvimento.
- [ ] Ajustar CI para cobrir auth real.
- [ ] Configurar envs de CORS/CSRF/cookies conforme a estrategia de sessao escolhida.
- [ ] Garantir seeds e fixtures de auth reproduziveis em ambiente local e CI.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [ ] Atualizar setup para incluir auth real.
- [ ] Atualizar API docs e guia de autenticacao.
- [ ] Documentar contrato de erro de auth.
- [ ] Criar ADR curto da estrategia de autenticacao da SPA.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Planejar unitarios e request specs de auth.
- [ ] Planejar testes de sessao persistida e expirada.
- [ ] Planejar E2E de login/logout/rota protegida.

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Executar request specs de auth.
- [ ] Executar testes do frontend ligados ao backend real.
- [ ] Executar E2E cobrindo fluxo completo de acesso.

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `kubernetes`, `security-best-practices`, `security-threat-model`.
- [ ] Revisar hashing e armazenamento de segredos.
- [ ] Revisar enumeracao de usuario.
- [ ] Revisar rate limit inicial.
- [ ] Revisar mensagens de erro e logs de auth.
- [ ] Revisar CORS, CSRF, cookies `httpOnly`, `sameSite` e armazenamento de sessao no browser conforme a estrategia adotada.

### Skills da sprint

- [ ] Usar `test-driven-development` antes da implementacao do backend de auth.
- [ ] Usar `security-best-practices` como checklist de fechamento.
- [ ] Usar `api-documenter`, `api-designer` e `openapi` para manter contrato forte.

### Checklist de saida

- [ ] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [ ] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.

- [ ] Login real funciona ponta a ponta.
- [ ] Dashboard deixa de depender do mock no fluxo principal.
- [ ] Swagger cobre auth.
- [ ] E2E de acesso esta verde.
- [ ] CI de auth permanece verde.

---

## Sprint 3 - Upload assinado, MinIO e criacao de job

**Status atual:** `Pendente`

**Dependencias**

- Sprint 2 fechada com auth real

**Bloqueadores conhecidos**

- nao ha endpoints de upload real
- frontend ainda nao possui fluxo real de upload
- MinIO esta disponivel, mas o produto nao o usa ainda

**O que nao pode ficar para depois**

- definir limites e contrato de upload antes da UI
- registrar rastreabilidade do upload desde o primeiro endpoint
- impedir que a API receba arquivo pesado diretamente

**Contexto e intencao**

Esta sprint fecha a porta de entrada real do produto. A API deve orquestrar o upload, emitir URL assinada, registrar metadados e disparar o inicio do job.

**Ja existe hoje**

- [x] MinIO no compose
- [x] arquitetura documentada prevendo URL assinada
- [x] dashboard com espaco natural para o fluxo de ingestao

### Back planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `architecture-patterns`, `domain-modeling`, `review-architecture`, `api-designer`, `supabase-postgres-best-practices`.
- [ ] Definir payload de solicitacao de upload.
- [ ] Definir metadados obrigatorios e convencao de chave de objeto.
- [ ] Definir endpoint de confirmacao pos-upload.
- [ ] Definir limites de tamanho, extensao e MIME.
- [ ] Definir se a v1 usa upload simples ou multipart/resumivel e quais metadados/checksums entram no contrato inicial.
- [ ] Definir prazo de expiracao, reconciliacao e limpeza para uploads iniciados e nao confirmados.

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `api-documenter`, `openapi`, `review-codebase`.
- [ ] Implementar endpoint que emite URL assinada.
- [ ] Implementar endpoint que confirma upload.
- [ ] Criar registro de `Upload`.
- [ ] Criar `Job` associado.
- [ ] Publicar evento inicial de ingestao.
- [ ] Registrar checksum, tamanho, chave final do objeto e metadados minimos de rastreabilidade no `Upload`.

### Front planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `frontend-skill`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`.
- [ ] Definir UX do upload no contexto do dashboard.
- [ ] Definir estados `idle`, `uploading`, `confirming`, `failed`, `completed`.
- [ ] Definir mensagens operacionais e retries.
- [ ] Definir se a UI inicial de upload ja precisa suportar cancelar, retomar ou reenviar sem corromper o fluxo.

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [ ] Construir fluxo real de upload.
- [ ] Integrar URL assinada.
- [ ] Integrar confirmacao de upload.
- [ ] Exibir progresso, erro e sucesso com clareza.
- [ ] Validar responsividade e comportamento em rede lenta.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [ ] Validar bucket, policy e bootstrap do MinIO.
- [ ] Garantir smoke do upload em compose.
- [ ] Revisar variaveis de ambiente e credenciais do storage.
- [ ] Definir politica de retencao e limpeza do bucket bruto para arquivos expirados ou abandonados.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [ ] Documentar fluxo de upload ponta a ponta.
- [ ] Atualizar Swagger com request/response e exemplos.
- [ ] Criar troubleshooting de falha de upload.
- [ ] Documentar ciclo de vida do objeto bruto entre emissao da URL, confirmacao, consumo e retencao.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Usar `breakdown-test` para explicitar cobertura funcional, risco e quality gates da sprint.
- [ ] Planejar testes do endpoint de assinatura.
- [ ] Planejar testes do endpoint de confirmacao.
- [ ] Planejar cenarios de falha parcial e idempotencia inicial.

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Usar `integration-testing` para validar API, storage e criacao de job com dependencias reais.
- [ ] Criar smoke automatizado `frontend -> api -> minio -> job`.
- [ ] Cobrir payload invalido.
- [ ] Cobrir falha de confirmacao.

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `kubernetes`, `security-best-practices`, `security-threat-model`.
- [ ] Validar extensao, MIME, tamanho e policy do bucket.
- [ ] Revisar acesso indevido ao objeto bruto.
- [ ] Revisar abuso de emissao de URL assinada.

### Skills da sprint

- [ ] Usar `playwright` para smoke do fluxo.
- [ ] Usar `api-contract-testing` para validar contrato entre endpoint, Swagger e consumidores do upload.
- [ ] Usar `security-best-practices` para validar superficie de upload.
- [ ] Usar `openapi` para schema preciso do fluxo.

### Checklist de saida

- [ ] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [ ] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.

- [ ] Upload real funcionando.
- [ ] Job criado com rastreabilidade.
- [ ] Swagger atualizado.
- [ ] Smoke Docker verde.
- [ ] Fluxo documentado ponta a ponta.

---

## Sprint 4 - Worker real, broker e processamento base

**Status atual:** `Pendente`

**Dependencias**

- Sprint 3 com upload e job reais

**Bloqueadores conhecidos**

- worker ainda e template
- container do worker nao consome fila real
- nao existe contrato operacional entre API, broker e worker

**O que nao pode ficar para depois**

- definir evento consumido antes do runtime
- registrar tentativas e estados desde a primeira execucao
- tratar idempotencia antes de pensar em reprocessamento

**Contexto e intencao**

O produto so deixa de ser prototipo quando o worker deixa de ser placeholder. Esta sprint transforma RabbitMQ e worker em parte real da aplicacao.

**Ja existe hoje**

- [x] RabbitMQ no compose
- [x] worker separado como app do monorepo
- [x] fluxo arquitetural ja documentado

### Back planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `architecture-patterns`, `domain-modeling`, `review-architecture`, `api-designer`, `supabase-postgres-best-practices`.
- [ ] Definir payload de evento consumido pelo worker.
- [ ] Definir batch size inicial.
- [ ] Definir retries, falha recuperavel e falha terminal.
- [ ] Definir estrategia de idempotencia.
- [ ] Definir fila de rejeicao/DLQ, estrategia de ack/nack e tratamento de poison message.
- [ ] Definir propagacao obrigatoria de `trace_id`, `request_id`, `event_id`, `upload_id` e `job_id` da API ate o worker.

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `api-documenter`, `openapi`, `review-codebase`.
- [ ] Implementar atualizacao consistente de estados do `Job`.
- [ ] Registrar tentativas de processamento.
- [ ] Persistir progresso por lote.

### Worker execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `integration-testing`, `docker`, `monitoring-observability`, `review-codebase`.
- [ ] Corrigir estrutura do worker para runtime real.
- [ ] Implementar consumidor RabbitMQ.
- [ ] Implementar leitura do arquivo no MinIO.
- [ ] Implementar parsing inicial por lote.
- [ ] Implementar atualizacao de progresso.
- [ ] Implementar retries minimos.
- [ ] Implementar encerramento gracioso do consumidor e comportamento seguro em restart/deploy.

### Front planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `frontend-skill`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`.
- [ ] Definir como a UI representa `pending`, `processing`, `failed` e `completed`.
- [ ] Definir frequencia de refresh inicial.
- [ ] Definir estado intermediario de processando.

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [ ] Exibir progresso real no dashboard.
- [ ] Exibir transicao de estados em tempo util.
- [ ] Exibir erro terminal com contexto suficiente.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [ ] Alterar container do worker para runtime real.
- [ ] Criar healthcheck do worker baseado em operacao.
- [ ] Garantir reproducao local e em CI.
- [ ] Subir broker com topologia minima versionada para filas principais, retry e rejeicao.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [ ] Criar runbook do worker.
- [ ] Documentar eventos e fluxo de processamento.
- [ ] Documentar estados de job.
- [ ] Documentar contratos reais de evento com exemplos aceitos e rejeitados.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Usar `breakdown-test` para definir cobertura do fluxo assincrono por risco.
- [ ] Planejar testes unitarios de parsing.
- [ ] Planejar testes de consumidor e fila.
- [ ] Planejar reinicio sem perda de estado.

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Usar `integration-testing` para validar broker, storage e persistencia do job com infraestrutura real.
- [ ] Cobrir arquivo valido.
- [ ] Cobrir parsing com erro.
- [ ] Cobrir reinicio do worker.
- [ ] Cobrir atualizacao de estado do job.

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `kubernetes`, `security-best-practices`, `security-threat-model`.
- [ ] Revisar poison messages.
- [ ] Revisar replay indevido.
- [ ] Revisar limites de uso do worker.
- [ ] Revisar autenticidade, replay e rejeicao de eventos invalidos na borda do consumidor.

### Skills da sprint

- [ ] Usar `test-driven-development` no worker e nos estados do job.
- [ ] Usar `review-codebase` ao final para checar qualidade estrutural.
- [ ] Usar `security-threat-model` para revisar malha `api -> broker -> worker -> storage`.

### Checklist de saida

- [ ] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [ ] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.

- [ ] Worker consome evento real.
- [ ] Job atualiza status.
- [ ] Runtime do worker nao e mais placeholder.
- [ ] Testes e docs de processamento estao fechados.
- [ ] Compose continua saudavel.

---

## Sprint 5 - Quarentena e erros operacionais

**Status atual:** `Pendente`

**Dependencias**

- Sprint 4 com processamento real

**Bloqueadores conhecidos**

- pipeline ainda nao separa falha parcial de falha total
- nao existe modelo de quarentena
- nao existe leitura operacional de erro

**O que nao pode ficar para depois**

- taxonomia de erro
- diferenciacao entre invalido de negocio e falha tecnica
- rastreabilidade de contexto para investigacao

**Contexto e intencao**

Sem quarentena, o pipeline so distingue sucesso bruto e fracasso bruto. Esta sprint entrega maturidade operacional minima.

**Ja existe hoje**

- [x] visao de produto e arquitetura ja preveem quarentena
- [x] dashboard shell tem espaco para evoluir para visao operacional

### Back planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `architecture-patterns`, `domain-modeling`, `review-architecture`, `api-designer`, `supabase-postgres-best-practices`.
- [ ] Definir modelo de `QuarantineRecord`.
- [ ] Definir formato de motivo, severidade e contexto.
- [ ] Definir relacao com `Job`, `Upload` e `Batch`.
- [ ] Definir criterio de falha parcial vs falha total.
- [ ] Definir acao operacional esperada para cada categoria de erro e cada severidade.

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `api-documenter`, `openapi`, `review-codebase`.
- [ ] Persistir registros invalidos.
- [ ] Criar endpoints de leitura de quarentena.
- [ ] Criar endpoints de detalhe de erro.

### Worker execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `integration-testing`, `docker`, `monitoring-observability`, `review-codebase`.
- [ ] Classificar invalidos corretamente.
- [ ] Registrar motivo e contexto.
- [ ] Garantir que invalidos nao derrubem o job inteiro quando nao devem.

### Front planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `frontend-skill`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`.
- [ ] Desenhar visao de quarentena.
- [ ] Desenhar detalhe do erro.
- [ ] Desenhar filtros, severidade e empty states.

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [ ] Implementar telas de quarentena e detalhe.
- [ ] Implementar filtros, busca e estados de erro.
- [ ] Exibir contexto suficiente para o operador agir.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [ ] Adicionar logs estruturados por `job_id`, `batch_id` e `upload_id`.
- [ ] Preparar metricas basicas de erro e falha.
- [ ] Garantir consulta rastreavel por `upload_id`, `job_id`, `batch_id` e categoria de erro.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [ ] Documentar taxonomia de erro.
- [ ] Documentar quarentena.
- [ ] Criar runbook de investigacao.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Planejar linhas invalidas.
- [ ] Planejar lotes mistos.
- [ ] Planejar sucesso parcial e falha parcial.

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Cobrir registros invalidos.
- [ ] Cobrir job misto.
- [ ] Cobrir leitura de quarentena pelo dashboard.

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `kubernetes`, `security-best-practices`, `security-threat-model`.
- [ ] Revisar dados sensiveis em logs e erros.
- [ ] Revisar payload exposto ao frontend.
- [ ] Revisar auditoria de falha.

### Skills da sprint

- [ ] Usar `frontend-skill` para manter qualidade da UI operacional.
- [ ] Usar `review-architecture` para checar o modelo de erro.
- [ ] Usar `security-best-practices` nas respostas da API.

### Checklist de saida

- [ ] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [ ] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.

- [ ] Quarentena funcionando.
- [ ] Dashboard mostra erro com contexto.
- [ ] Logs e docs operacionais atualizados.
- [ ] Testes cobrem cenarios principais.

---

## Sprint 6 - Dashboard operacional real e observabilidade inicial

**Status atual:** `Parcial`

**Dependencias**

- Sprint 5 com quarentena e leitura operacional

**Bloqueadores conhecidos**

- dashboard ainda consome estado mock
- nao ha endpoints operacionais reais suficientes
- nao ha metricas basicas de uso/latencia

**O que nao pode ficar para depois**

- fechar payloads operacionais antes de polir UI
- manter fidelidade ao modelo visual ja aprovado
- garantir navegacao, filtros e feedbacks reais

**Contexto e intencao**

O dashboard atual ainda e mais demonstracao do que operacao. Esta sprint o transforma em superficie real de trabalho.

**Ja existe hoje**

- [x] dashboard shell visualmente forte
- [x] auth e navegacao base
- [x] linguagem visual consistente nas telas principais

### Back planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `architecture-patterns`, `domain-modeling`, `review-architecture`, `api-designer`, `supabase-postgres-best-practices`.
- [ ] Definir endpoints de listagem de jobs.
- [ ] Definir endpoint de detalhe do job.
- [ ] Definir endpoint de auditoria operacional.
- [ ] Definir paginacao, filtros e ordenacao.
- [ ] Definir endpoint agregado de resumo operacional separado dos endpoints de listagem detalhada.
- [ ] Definir politica inicial de polling e criterios futuros para migrar para SSE ou WebSocket.

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `api-documenter`, `openapi`, `review-codebase`.
- [ ] Implementar endpoints operacionais reais.
- [ ] Padronizar payloads para o frontend.
- [ ] Garantir consistencia de nomes e erro.

### Front planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `frontend-skill`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`.
- [ ] Mapear componentes mock reaproveitaveis.
- [ ] Mapear blocos que precisam virar dados reais.
- [ ] Definir loading/empty/error por area do dashboard.

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [ ] Integrar dashboard com API real.
- [ ] Implementar filtros e navegacao operacional.
- [ ] Implementar refresh periodico.
- [ ] Materializar camada de query/state do dashboard para evitar fetch espalhado por componente.
- [ ] Refletir filtros e pagina atual na URL quando fizer sentido operacional.
- [ ] Preservar fidelidade estetica ao baseline.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [ ] Instrumentar logs basicos e metricas de endpoint.
- [ ] Adicionar smoke funcional do dashboard no fluxo E2E.
- [ ] Instrumentar tempos basicos de resposta, polling e latencia percebida do dashboard.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [ ] Atualizar catalogo de telas.
- [ ] Atualizar contrato operacional.
- [ ] Atualizar Swagger dos endpoints operacionais.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Usar `breakdown-test` para fechar a matriz de testes do dashboard operacional.
- [ ] Planejar request specs dos endpoints operacionais.
- [ ] Planejar testes de componentes criticos.
- [ ] Planejar smoke E2E do dashboard.

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Executar regressao `login + upload + visualizacao do job`.
- [ ] Executar regressao da area de quarentena.
- [ ] Executar smoke visual do dashboard.

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `kubernetes`, `security-best-practices`, `security-threat-model`.
- [ ] Validar autorizacao por recurso.
- [ ] Validar vazamento de dados operacionais.
- [ ] Revisar mensagens de erro exibidas ao usuario.

### Skills da sprint

- [ ] Usar `frontend-skill`, `web-design-guidelines` e `vercel-react-best-practices`.
- [ ] Usar `playwright` nos fluxos criticos do dashboard.
- [ ] Usar `monitoring-observability` para fechar a primeira camada de sinais operacionais.

### Checklist de saida

- [ ] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [ ] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.

- [ ] Dashboard consome dados reais.
- [ ] Jobs, detalhes e quarentena sao navegaveis.
- [ ] Swagger atualizado.
- [ ] Smoke E2E principal verde.
- [ ] UX continua fiel ao padrao visual.

---

## Sprint 7 - Analytics real com ClickHouse

**Status atual:** `Pendente`

**Dependencias**

- Sprint 6 com dashboard operacional real

**Bloqueadores conhecidos**

- ClickHouse existe na infra, mas nao recebe carga de negocio
- nao ha KPIs definidos com contrato
- nao ha endpoints analiticos reais

**O que nao pode ficar para depois**

- definir fonte de verdade de cada indicador
- separar claramente leitura operacional de leitura analitica
- impedir que dashboard analitico vire consulta direta ad-hoc sem contrato

**Contexto e intencao**

A proposta do produto depende da separacao entre leitura operacional e leitura analitica. Esta sprint entrega a camada analitica real.

**Ja existe hoje**

- [x] ClickHouse no compose
- [x] visao do produto preve metricas operacionais e analiticas
- [x] shell visual do dashboard ja aponta para essa evolucao

### Back planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `architecture-patterns`, `domain-modeling`, `review-architecture`, `api-designer`, `supabase-postgres-best-practices`.
- [ ] Definir estrutura analitica.
- [ ] Definir KPIs, metricas e janelas temporais.
- [ ] Definir latencia aceitavel de atualizacao.
- [ ] Definir responsabilidade de cada tabela/agregacao.
- [ ] Definir estrategia de backfill/rebuild das agregacoes sem corromper a leitura operacional.
- [ ] Definir contrato de frescor das metricas e como isso sera exposto na UI.

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `api-documenter`, `openapi`, `review-codebase`.
- [ ] Implementar carga para ClickHouse.
- [ ] Implementar endpoints de metricas analiticas.
- [ ] Implementar filtros temporais e agregacoes principais.

### Worker execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `integration-testing`, `docker`, `monitoring-observability`, `review-codebase`.
- [ ] Enviar dados preparados ao ClickHouse.
- [ ] Garantir consistencia entre estado operacional e carga analitica.
- [ ] Garantir que replays e reprocessamentos nao produzam contagem analitica duplicada.

### Front planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `frontend-skill`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`.
- [ ] Definir modulos analiticos do dashboard.
- [ ] Definir cards, tabelas e graficos necessarios.
- [ ] Definir narrativa visual dos indicadores.

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [ ] Implementar paineis analiticos reais.
- [ ] Integrar filtros e janelas temporais.
- [ ] Tratar ausencia de dados e atualizacao.
- [ ] Exibir frescor/ultima atualizacao dos KPIs e deixar clara a origem operacional vs analitica de cada bloco.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [ ] Preparar schema analitico.
- [ ] Criar smoke de carga e consulta.
- [ ] Monitorar performance basica de ingestao e leitura.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [ ] Documentar origem de cada metrica.
- [ ] Documentar diferenca entre OLTP e OLAP.
- [ ] Criar catalogo de metricas com definicao, origem, atraso esperado e dono de cada indicador.
- [ ] Atualizar Swagger para analytics.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Usar `breakdown-test` para definir cobertura de metricas, agregacoes e regressao analitica.
- [ ] Planejar consistencia de metricas.
- [ ] Planejar testes de agregacao.
- [ ] Planejar testes de consultas temporais.

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Validar atualizacao apos processamento.
- [ ] Validar leitura analitica no dashboard.
- [ ] Validar payloads e agregacoes.

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `kubernetes`, `security-best-practices`, `security-threat-model`.
- [ ] Revisar abuso de query e custo/performance.
- [ ] Revisar exposicao de dados analiticos.
- [ ] Revisar limites de acesso e janelas de consulta.

### Skills da sprint

- [ ] Usar `supabase-postgres-best-practices` na fronteira OLTP.
- [ ] Usar `review-codebase` para checar separacao entre camadas operacional e analitica.
- [ ] Usar `api-contract-testing` para proteger os endpoints analiticos e seus schemas.
- [ ] Usar `openapi` para os endpoints analiticos.

### Checklist de saida

- [ ] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [ ] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.

- [ ] ClickHouse recebe carga real.
- [ ] Dashboard analitico mostra metricas reais.
- [ ] Docs e Swagger atualizados.
- [ ] Smoke de analytics verde.

---

## Sprint 8 - Reprocessamento, auditoria forte e operacao assistida

**Status atual:** `Pendente`

**Dependencias**

- Sprint 7 com leitura operacional e analitica reais

**Bloqueadores conhecidos**

- ainda nao ha replay/reprocessamento
- auditoria ainda nao cobre a trilha operacional completa
- operacao ainda nao consegue corrigir e repetir fluxo com seguranca

**O que nao pode ficar para depois**

- regras de permissao para replay
- idempotencia real do reprocessamento
- historico completo de tentativas

**Contexto e intencao**

Um produto operacional maduro precisa permitir correcao e reprocessamento com trilha clara. Esta sprint fecha o ciclo de operacao assistida.

**Ja existe hoje**

- [x] arquitetura e visao de produto ja preveem trilha de jobs, quarentena e dashboards

### Back planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `architecture-patterns`, `domain-modeling`, `review-architecture`, `api-designer`, `supabase-postgres-best-practices`.
- [ ] Definir regras de reprocessamento.
- [ ] Definir permissoes.
- [ ] Definir escopos de replay.
- [ ] Definir trilha de auditoria obrigatoria.
- [ ] Definir como uma tentativa de replay referencia a tentativa anterior e como isso aparece para operacao.

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `api-documenter`, `openapi`, `review-codebase`.
- [ ] Implementar reprocessamento por upload/job/lote.
- [ ] Registrar tentativas e historico.
- [ ] Garantir idempotencia.
- [ ] Garantir trilha imutavel de quem pediu replay, quando pediu, por qual motivo e qual foi o efeito.

### Worker execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `integration-testing`, `docker`, `monitoring-observability`, `review-codebase`.
- [ ] Implementar replay seguro.
- [ ] Garantir ausencia de duplicacao.
- [ ] Garantir historico rastreavel.

### Front planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `frontend-skill`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`.
- [ ] Desenhar fluxo de reprocessamento.
- [ ] Desenhar confirmacoes e warnings.
- [ ] Desenhar historico de execucoes.

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [ ] Implementar acao de reprocessar.
- [ ] Implementar visualizacao de historico.
- [ ] Implementar feedback operacional claro.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [ ] Instrumentar alertas basicos.
- [ ] Exibir metricas de falha, atraso e replay.
- [ ] Criar smoke de incidente e recuperacao.
- [ ] Exercitar o efeito de replay sobre a camada analitica e sobre o historico operacional.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [ ] Criar runbook de incidente.
- [ ] Criar runbook de replay.
- [ ] Criar manual de operacao assistida.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Planejar cenarios de replay.
- [ ] Planejar concorrencia.
- [ ] Planejar idempotencia.
- [ ] Planejar erro durante replay.

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Validar replay sem duplicacao.
- [ ] Validar auditoria do replay.
- [ ] Validar efeito no dashboard.

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `kubernetes`, `security-best-practices`, `security-threat-model`.
- [ ] Revisar privilegios operacionais.
- [ ] Revisar abuso de replay.
- [ ] Revisar integridade da auditoria.

### Skills da sprint

- [ ] Usar `security-threat-model`.
- [ ] Usar `review-architecture`.
- [ ] Usar `playwright` para o cenario operacional completo.

### Checklist de saida

- [ ] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [ ] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.

- [ ] Replay funciona.
- [ ] Auditoria e confiavel.
- [ ] Operacao consegue investigar e agir.
- [ ] Documentacao operacional esta completa.

---

## Sprint 9 - Hardening de qualidade, seguranca e release

**Status atual:** `Parcial`

**Dependencias**

- Sprint 8 com operacao assistida funcional

**Bloqueadores conhecidos**

- suite regressiva ainda nao esta fechada
- quality gates ainda medem mais o esqueleto do que o produto real
- scanners e cobertura ainda nao compoem um gate completo

**O que nao pode ficar para depois**

- suite regressiva oficial
- cobertura minima por camada
- release checklist e rollback

**Contexto e intencao**

Esta sprint consolida o que foi entregue e remove a fragilidade residual. O foco deixa de ser feature e vira robustez, seguranca e previsibilidade de release.

**Ja existe hoje**

- [x] backend CI com RuboCop e Brakeman
- [x] frontend CI com lint/build
- [x] docker CI com compose e build

### Back planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `architecture-patterns`, `domain-modeling`, `review-architecture`, `api-designer`, `supabase-postgres-best-practices`.
- [ ] Mapear debt tecnica restante.
- [ ] Mapear gargalos de performance.
- [ ] Mapear inconsistencias de contratos, erros e naming.

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `api-documenter`, `openapi`, `review-codebase`.
- [ ] Fechar inconsistencias da API e do worker.
- [ ] Revisar performance e erros.
- [ ] Eliminar pontos de acoplamento desnecessarios.

### Front planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `frontend-skill`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`.
- [ ] Revisar consistencia visual final.
- [ ] Revisar acessibilidade.
- [ ] Revisar performance e usabilidade.

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [ ] Corrigir problemas de UX.
- [ ] Melhorar loading/erro/vazio.
- [ ] Revisar responsividade, teclado e contraste.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [ ] Ampliar CI com scans obrigatorios.
- [ ] Adicionar gates de cobertura.
- [ ] Adicionar scans de imagem/container e dependencia.
- [ ] Colocar `vitest`, smoke E2E principal e verificacoes de contrato no CI oficial.
- [ ] Introduzir `CODEOWNERS`, `dependabot.yml`, issue templates, labels e `AGENTS.md` raiz como parte da governanca minima do repo.
- [ ] Adicionar secret scanning e scanners de supply chain proporcionais a cada stack.
- [ ] Definir fluxo de release e rollback.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [ ] Consolidar changelog.
- [ ] Consolidar runbooks.
- [ ] Consolidar API docs finais.
- [ ] Consolidar guias de release.
- [ ] Consolidar guia de contribuicao, onboarding tecnico e automacoes recorrentes do repositorio.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Definir suite regressiva oficial.
- [ ] Definir cobertura minima por camada.
- [ ] Definir smoke oficial de release.

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Executar regressao completa.
- [ ] Executar scans de seguranca.
- [ ] Executar smoke Docker completo.

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `kubernetes`, `security-best-practices`, `security-threat-model`.
- [ ] Rodar revisao formal com `security-best-practices`.
- [ ] Revisar supply chain.
- [ ] Revisar segredos.
- [ ] Revisar OWASP basico do sistema.
- [ ] Revisar segredos, ownership, branch protection e automacao de atualizacao de dependencias como parte da seguranca operacional do repositorio.

### Skills da sprint

- [ ] Usar `github-actions-expert`.
- [ ] Usar `generate-github-workflow`.
- [ ] Usar `security-best-practices`.
- [ ] Avaliar uma skill futura de release notes quando o processo estiver maduro.

### Checklist de saida

- [ ] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [ ] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.

- [ ] CI mais completo e verde.
- [ ] Scanners integrados.
- [ ] Regressao oficial definida e executada.
- [ ] Swagger e docs finais de release atualizados.
- [ ] Projeto pronto para release estavel em Docker.

---

## Sprint 10 - Kubernetes, GitOps e estado final de operacao

**Status atual:** `Pendente`

**Dependencias**

- Sprint 9 com stack endurecida e release repetivel

**Bloqueadores conhecidos**

- `infra/k8s` ainda e placeholder
- nao ha pipeline de deploy em cluster
- nao ha observabilidade de producao definida

**O que nao pode ficar para depois**

- readiness/liveness reais
- estrategia de rollout e rollback
- segregacao de workloads e segredos

**Contexto e intencao**

O produto fecha aqui o ciclo de operacao madura: local, CI, Docker e cluster. Nao basta subir em K8s; precisa ficar operavel, observavel e recuperavel.

**Ja existe hoje**

- [x] a estrutura `infra/k8s/` ja existe no monorepo
- [x] compose ja separa bem responsabilidades locais
- [x] skills de Docker, Kubernetes, Helm e GitHub Actions ja foram importadas

### Back planning

- Skills obrigatorias para todas as tasks desta trilha: `brainstorming`, `architecture-patterns`, `domain-modeling`, `review-architecture`, `api-designer`, `supabase-postgres-best-practices`.
- [ ] Revisar comportamento stateless.
- [ ] Revisar readiness e liveness.
- [ ] Revisar configuracao externa e uso de segredos.
- [ ] Revisar comportamento com multiplas replicas.
- [ ] Decidir explicitamente quais dependencias de dados irao para cluster, quais permanecem externas/gerenciadas e qual e a estrategia de backup/restore de cada uma.

### Back execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `architecture-patterns`, `domain-modeling`, `api-designer`, `api-documenter`, `openapi`, `review-codebase`.
- [ ] Ajustar API e worker para cluster.
- [ ] Garantir comportamento seguro em escala horizontal.
- [ ] Garantir compatibilidade com deploy progressivo.

### Front execution

- Skills obrigatorias para todas as tasks desta trilha: `frontend-skill`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `vitest`, `playwright`.
- [ ] Validar ambiente publicado.
- [ ] Validar consumo da API em ambiente orquestrado.
- [ ] Validar smoke ponta a ponta.

### DevOps

- Skills obrigatorias para todas as tasks desta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`; quando houver cluster, somar `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow`.
- Documentos de apoio: [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md), [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md) e [docs/guides/devops-roadmap.md](C:/estudos/StreamGate/docs/guides/devops-roadmap.md).
- [ ] Criar manifests ou charts.
- [ ] Criar pipeline de deploy.
- [ ] Definir namespaces, ingress, requests/limits e probes.
- [ ] Definir autoscaling do worker.
- [ ] Definir rollout, rollback e GitOps.
- [ ] Definir observabilidade com logs, metricas e tracing quando fizer sentido.
- [ ] Definir politica de backup, restore drill, retention e segregacao para PostgreSQL, MinIO, RabbitMQ e ClickHouse conforme a estrategia de deploy escolhida.
- [ ] Definir PDB, network policies, secrets externos e fronteiras entre workloads stateful e stateless.

### Documentation

- Skills obrigatorias para todas as tasks desta trilha: `api-documenter`, `openapi`, `review-codebase`, `readiness-report`.
- [ ] Documentar deploy.
- [ ] Documentar rollback.
- [ ] Documentar suporte.
- [ ] Documentar arquitetura final de producao.
- [ ] Documentar troubleshooting em cluster.
- [ ] Documentar a decisao final do data plane: self-hosted no cluster, servicos gerenciados ou modelo hibrido.

### Test planning

- Skills obrigatorias para todas as tasks desta trilha: `breakdown-test`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Planejar smoke pos-deploy.
- [ ] Planejar falha controlada.
- [ ] Planejar teste de readiness/health.
- [ ] Planejar checklist de producao.

### Test execution

- Skills obrigatorias para todas as tasks desta trilha: `test-driven-development`, `vitest`, `integration-testing`, `api-contract-testing`, `playwright`.
- [ ] Validar upload em cluster.
- [ ] Validar processamento em cluster.
- [ ] Validar dashboard e analytics em cluster.
- [ ] Validar rollback.
- [ ] Validar observabilidade minima.

### Security

- Skills obrigatorias para todas as tasks desta trilha: `review-architecture`, `review-codebase`, `openapi`, `docker`, `kubernetes`, `security-best-practices`, `security-threat-model`.
- [ ] Revisar network policies.
- [ ] Revisar exposicao externa.
- [ ] Revisar segredos do cluster.
- [ ] Revisar segregacao de workloads.
- [ ] Revisar privilege boundaries de infra.

### Skills da sprint

- [ ] Usar `kubernetes`.
- [ ] Usar `helm-chart-scaffolding`.
- [ ] Usar `gitops-workflow`.
- [ ] Usar `github-actions-expert` e `generate-github-workflow`.
- [ ] Usar `monitoring-observability` para fechamento da camada operacional.

### Checklist de saida

- [ ] Delta por trilha registrado para Back planning, Back execution, Front planning, Front execution, DevOps, Documentation, Test planning, Test execution, Security e Skills da sprint.
- [ ] Trilhas nao tocadas na sprint marcadas explicitamente como nao tocada nesta sprint.

- [ ] App funciona em Kubernetes.
- [ ] Deploy e repetivel.
- [ ] Rollback e testado.
- [ ] Observabilidade e util.
- [ ] Seguranca de cluster foi revisada.
- [ ] Documentacao final de producao esta fechada.

---

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
4. Entregar upload e criacao de job.
5. Entregar worker e processamento.
6. Entregar quarentena e leitura operacional.
7. Entregar dashboard operacional real.
8. Entregar analytics real.
9. Entregar reprocessamento e auditoria forte.
10. Endurecer qualidade, seguranca e release.
11. Levar para Kubernetes com observabilidade madura.

## Fechamento

Se este documento for seguido com disciplina, o projeto deixa de evoluir por intuicao e passa a evoluir por capacidade comprovada. A regra e simples: nenhuma sprint e pronta porque o codigo parece bom; ela so e pronta quando o escopo implementado roda, esta testado, esta documentado, esta coberto por CI e nao abre uma divida invisivel para a sprint seguinte.
