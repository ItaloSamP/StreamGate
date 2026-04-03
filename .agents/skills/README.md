# Catalogo de Skills do Projeto

Este arquivo registra as skills usadas de forma recorrente no StreamGate, o papel de cada uma no fluxo de trabalho e quando elas devem entrar obrigatoriamente em cada trilha.

Ele funciona como catalogo operacional do projeto. Parte das skills esta versionada em `.agents/skills`, e parte pode vir do ambiente do agente quando o roadmap exigir uma capacidade especifica, como seguranca.

## Principio de curadoria

Uma skill so permanece como parte do metodo oficial se cumprir pelo menos um destes papeis:

- apoiar diretamente a stack atual do projeto
- apoiar uma fase do roadmap ja planejada
- evitar retrabalho recorrente em backend, frontend, testes, CI/CD, infra ou seguranca

Skills sem encaixe real na stack atual ou no roadmap devem sair do fluxo para evitar poluicao metodologica.

## Skills mantidas no fluxo do projeto

### Descoberta e planejamento

- `find-skills`
  Descobre e instala novas skills quando surge uma necessidade especializada fora do baseline atual.
  Usar quando faltar uma capacidade nova no projeto.

- `brainstorming`
  Ajuda a esclarecer intencao, requisitos, riscos e desenho antes de implementar algo novo.
  Usar em discovery de features, fluxos e componentes mais abertos.

- `readiness-report`
  Avalia a maturidade do repositorio para desenvolvimento assistido por IA, cobrindo build, docs, testes, seguranca e operacao.
  Usar antes de marcos grandes ou para medir o quanto o repo esta pronto para acelerar.

### Backend, dominio e arquitetura

- `architecture-patterns`
  Apoia desenho de backend com Clean Architecture, Hexagonal Architecture e DDD.
  Usar para definir camadas, fronteiras e direcao de dependencias.

- `domain-modeling`
  Foca em modelagem de dominio, value objects, invariantes, tipos semanticos e eliminacao de primitive obsession.
  Usar ao desenhar entidades, estados, contratos internos e regras centrais.

- `review-architecture`
  Revisa a arquitetura e as fronteiras do codigo, com foco em acoplamento, responsabilidade e direcao de dependencias.
  Usar antes de consolidar um desenho tecnico ou ao revisar um refactor estrutural.

- `review-codebase`
  Faz uma revisao ampla de diretorios, modulos ou do repo inteiro, apontando divida tecnica, maintainability e riscos de evolucao.
  Usar ao fim de entregas importantes ou para preparar cleanup/refactor.

- `api-designer`
  Ajuda a desenhar recursos de API, payloads, erros, versionamento, paginacao e estrategia de contrato.
  Usar antes de abrir endpoints novos ou alterar recursos existentes.

- `api-documenter`
  Especializada em documentacao tecnica de APIs e specs Swagger/OpenAPI.
  Usar quando endpoints, exemplos e guias de uso precisarem ser escritos ou revisados.

- `openapi`
  Focada na estrutura e validacao do documento OpenAPI 3.x.
  Usar para manter `openapi.yaml` consistente, versionado e alinhado aos endpoints.

- `supabase-postgres-best-practices`
  Reune boas praticas de modelagem, indices, consultas e performance em PostgreSQL.
  Usar em schema design, tuning e revisao de queries.

### Frontend, design system e UI

- `shadcn`
  Apoia uso e manutencao do ecossistema shadcn/ui.
  Faz sentido no StreamGate porque `apps/web/components.json` existe e o frontend usa esse fluxo.

- `tailwind-design-system`
  Ajuda a estruturar design system com Tailwind, tokens, componentes e padroes reutilizaveis.
  Usar para manter consistencia visual e escalabilidade do frontend.

- `vercel-react-best-practices`
  Guia boas praticas de React para estrutura, rendering, estado e performance.
  Usar em telas, componentes e refactors de React.

- `web-design-guidelines`
  Revisa qualidade de UX, acessibilidade e consistencia de interface.
  Usar em auditorias de UI e refinamento visual.

### Testes e validacao

- `test-driven-development`
  Estrutura a implementacao orientada a testes antes do codigo de producao.
  Usar como abordagem padrao em backend, worker e regras criticas.

- `breakdown-test`
  Ajuda a planejar cobertura de testes e quality gates de uma entrega.
  Usar para quebrar o que precisa ser validado por risco, camada e fluxo.

- `integration-testing`
  Apoia desenho e implementacao de testes de integracao com API, banco, filas, storage e servicos reais.
  Usar quando o comportamento depende da interacao entre modulos.

- `api-contract-testing`
  Protege contratos de API contra breaking changes e inconsistencias entre provider e consumer.
  Usar para validar schemas, compatibilidade e alinhamento com OpenAPI.

- `vitest`
  Focada em configuracao, mocks, coverage e suites de teste do Vitest.
  Usar no frontend e em qualquer fluxo Vite/Vitest.

### Infra, CI/CD e operacao

- `docker`
  Reune boas praticas para Dockerfiles, imagens e compose.
  Usar para otimizar ambiente local, build e seguranca de containers.

- `github-actions-expert`
  Ajuda a desenhar e refinar pipelines GitHub Actions.
  Usar em CI/CD, cache, paralelizacao, seguranca e manutencao dos workflows.

- `generate-github-workflow`
  Gera ou revisa workflows com foco em seguranca, permissoes minimas e auditabilidade.
  Usar ao criar ou refatorar workflows do projeto.

- `monitoring-observability`
  Apoia estrategia de logs, metricas, traces, dashboards e alertas.
  Usar quando a stack precisar ganhar sinais operacionais reais.

- `kubernetes`
  Apoia o trabalho com cluster local, manifests e operacao em Kubernetes.
  Usar na fase de K8s do roadmap.

- `helm-chart-scaffolding`
  Ajuda na organizacao de charts Helm e parametrizacao de deploys.
  Usar se o projeto optar por Helm na fase de cluster.

- `gitops-workflow`
  Ajuda a estruturar GitOps com reconciliacao declarativa.
  Usar quando a trilha de deploy em cluster chegar ao ponto de promocao automatizada.

### Seguranca

- `security-best-practices`
  Faz revisao secure-by-default para frontend, backend e fluxos web com foco em configuracao, auth, storage, renderizacao e segredos.
  Usar sempre que a task tocar superficie web, auth, upload, tokens, cookies, storage local ou dados sensiveis.

- `security-threat-model`
  Apoia threat modeling repo-grounded, fronteiras de confianca, ativos e abuse paths.
  Usar em sprints que abrem novas superficies ou consolidam fronteiras criticas, como auth, upload, broker e analytics.

## Gatilhos obrigatorios por trilha

A partir da Sprint 0, estes gatilhos deixam de ser recomendacao e passam a ser regra de execucao.

### Backend

- Planejamento estrutural: `brainstorming` + `architecture-patterns` + `domain-modeling`
- Revisao de desenho: `review-architecture`
- Revisao ampla de modulo: `review-codebase`
- Design de endpoints: `api-designer`
- Documentacao de API: `api-documenter` + `openapi`
- Banco e consultas: `supabase-postgres-best-practices`

### Frontend

- Discovery e desenho de tela: `brainstorming`
- Componentes e sistema visual: `shadcn` + `tailwind-design-system`
- Revisao de React: `vercel-react-best-practices`
- Revisao de UX/acessibilidade: `web-design-guidelines`
- Revisao de seguranca quando houver auth, rotas protegidas, browser storage ou integracao com API: `security-best-practices`

### Testes

- Planejamento de cobertura: `breakdown-test`
- Implementacao guiada a testes: `test-driven-development`
- Testes de integracao: `integration-testing`
- Contratos de API: `api-contract-testing`
- Frontend unitario: `vitest`

### Infra e operacao

- Containers e compose: `docker`
- CI/CD: `github-actions-expert` + `generate-github-workflow`
- Observabilidade: `monitoring-observability`
- Kubernetes: `kubernetes` + `helm-chart-scaffolding` + `gitops-workflow`
- Revisao de seguranca quando houver envs, portas, imagens, segredos ou servicos administrativos: `security-best-practices`

### Seguranca

- Revisao estrutural: `review-architecture` + `review-codebase`
- Interface e contrato: `openapi`
- Infra e topologia: `docker` + `kubernetes`
- Revisao secure-by-default: `security-best-practices`
- Threat model e abuso por fronteira: `security-threat-model`

### Documentacao

- Revisao de consistencia do repo e impactos cruzados: `review-codebase`
- APIs e contratos: `api-documenter` + `openapi` quando houver interface publica
- Trilha nova sem skill adequada: `find-skills`

## Revisao de valor das skills ao fim da Sprint 0

### Skills que continuam agregando valor real

Todas as skills hoje mantidas no fluxo continuam justificadas pelo roadmap ativo.

Em especial:

- backend e dominio ainda vao depender fortemente de `architecture-patterns`, `domain-modeling`, `api-designer` e `review-architecture`
- frontend ainda depende de `shadcn`, `tailwind-design-system`, `vercel-react-best-practices` e `web-design-guidelines`
- testes ainda dependem de `breakdown-test`, `integration-testing`, `api-contract-testing`, `vitest` e `test-driven-development`
- DevOps e seguranca ainda dependem de `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`, `security-best-practices` e `security-threat-model`

### Skills sem valor real neste fechamento

Nenhuma skill importada precisa ser descontinuada no fechamento da Sprint 0.

O criterio para remocao futura continua sendo:

- a skill nao apoiar mais nenhuma sprint planejada
- a skill duplicar completamente outra sem ganho metodologico
- a skill empurrar um fluxo que o projeto nao usa na pratica

## Skills removidas na curadoria

- `enhance-prompt`
  Removida porque era focada em prompts para Stitch/UI generation e nao conversa com o fluxo real do StreamGate.

- `mcp-builder`
  Removida porque o projeto nao esta construindo servidores MCP como parte do roadmap atual.

- `stripe-best-practices`
  Removida porque o StreamGate nao possui trilha de pagamentos, billing ou Stripe no produto atual.

## Regra pratica do projeto

Sempre que uma tarefa importante comecar, a skill apropriada deve entrar antes da implementacao. No StreamGate, a ordem preferencial e:

1. pensar e desenhar
2. revisar risco e seguranca quando houver superficie sensivel
3. implementar
4. validar
5. documentar

Na pratica:

- backend novo: `architecture-patterns` + `domain-modeling` -> `security-threat-model` quando abrir superficie critica -> `test-driven-development` -> `review-architecture`/`review-codebase`
- endpoint novo: `api-designer` -> `openapi`/`api-documenter` -> `api-contract-testing` -> `security-best-practices`
- fluxo com infraestrutura real: `breakdown-test` -> `integration-testing` -> `docker`/`monitoring-observability` -> `security-best-practices`
- frontend novo: `brainstorming` + `shadcn` + `tailwind-design-system` -> `vercel-react-best-practices` -> `web-design-guidelines` + `vitest` -> `security-best-practices` quando houver auth, storage ou consumo de API
