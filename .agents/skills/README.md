# Catalogo de Skills do Projeto

Este arquivo registra quais skills fazem parte do fluxo recorrente do StreamGate e em que momento elas devem entrar.

## Skills base ja existentes no projeto

### Produto, frontend e design

- `frontend-skill`: usar sempre que a entrega envolver tela nova, refinamento visual, landing, dashboard ou experiencia de interface.
- `web-design-guidelines`: usar para revisar acessibilidade, consistencia visual e qualidade de UX.
- `tailwind-design-system`: usar quando a entrega exigir padronizacao de tokens, componentes e variacoes visuais.
- `vercel-react-best-practices`: usar para revisar arquitetura React, rendering, estado, performance e composicao.

### Engenharia e testes

- `test-driven-development`: usar antes de implementar feature ou correcao relevante.
- `playwright`: usar para fluxos E2E, smoke e validacao visual de navegacao.
- `supabase-postgres-best-practices`: usar ao modelar schema, indices e consultas PostgreSQL.

### Descoberta e expansao de capacidade

- `find-skills`: usar quando surgir demanda por capacidade nova ou workflow especializado.

## Skills externas adicionadas ao repositorio

### Backend, arquitetura e readiness

- `review-codebase`
  Fonte: [skills.sh/nesnilnehc/ai-cortex/review-codebase](https://skills.sh/nesnilnehc/ai-cortex/review-codebase)
  Usar para revisar arquitetura, fronteiras, divida tecnica e coesao de diretorios ou do repo inteiro.

- `review-architecture`
  Fonte: [skills.sh/nesnilnehc/ai-cortex/review-architecture](https://skills.sh/nesnilnehc/ai-cortex/review-architecture)
  Usar antes de fechar desenho de dominio, contratos e distribuicao de responsabilidades entre apps.

- `readiness-report`
  Fonte: [skills.sh/openhands/skills](https://skills.sh/openhands/skills)
  Usar para medir maturidade do repositorio antes de marcos grandes, como auth real, worker real e release.

- `api-designer`
  Fonte: [skills.sh/404kidwiz/claude-supercode-skills/api-designer](https://skills.sh/404kidwiz/claude-supercode-skills/api-designer)
  Usar quando o trabalho for de desenho de recursos, versionamento, payloads, erros e estrategia de contrato.

### API docs e OpenAPI

- `api-documenter`
  Fonte: [skills.sh/404kidwiz/claude-supercode-skills/api-documenter](https://skills.sh/404kidwiz/claude-supercode-skills/api-documenter)
  Usar para escrever ou revisar docs de endpoints, guias de autenticacao e exemplos de uso.

- `openapi`
  Fonte: [skills.sh/itechmeat/llm-code/openapi](https://skills.sh/itechmeat/llm-code/openapi)
  Usar quando a entrega exigir schema OpenAPI 3.x forte, exemplos consistentes e estrutura versionada.

### Infra, CI/CD e operacao

- `docker`
  Fonte: [skills.sh/mindrally/skills/docker](https://skills.sh/mindrally/skills/docker)
  Usar para revisar Dockerfiles, compose, convencoes de imagens e otimizacao de ambiente local/CI.

- `kubernetes`
  Fonte: [skills.sh/mindrally/skills/kubernetes](https://skills.sh/mindrally/skills/kubernetes)
  Usar na trilha de K8s para cluster local, manifests, probes e operacao em cluster.

- `helm-chart-scaffolding`
  Fonte: [skills.sh/wshobson/agents/helm-chart-scaffolding](https://skills.sh/wshobson/agents/helm-chart-scaffolding)
  Usar quando a stack chegar em `infra/k8s` e o time optar por Helm.

- `gitops-workflow`
  Fonte: [skills.sh/wshobson/agents/gitops-workflow](https://skills.sh/wshobson/agents/gitops-workflow)
  Usar ao desenhar deploy declarativo, reconciliacao e promocao de ambiente em cluster.

- `generate-github-workflow`
  Fonte: [skills.sh/nesnilnehc/ai-cortex/generate-github-workflow](https://skills.sh/nesnilnehc/ai-cortex/generate-github-workflow)
  Usar quando um workflow novo for criado ou quando os gates de CI precisarem ser refeitos.

- `github-actions-expert`
  Fonte: [skills.sh/cin12211/orca-q/github-actions-expert](https://skills.sh/cin12211/orca-q/github-actions-expert)
  Usar para refinar jobs, cache, paralelizacao, seguranca e legibilidade do CI.

- `monitoring-observability`
  Fonte: [skills.sh/ahmedasmar/devops-claude-skills/monitoring-observability](https://skills.sh/ahmedasmar/devops-claude-skills/monitoring-observability)
  Usar ao desenhar metricas, dashboards, alertas, traces e sinais operacionais.

### Testes

- `vitest`
  Fonte: [skills.sh/antfu/skills/vitest](https://skills.sh/antfu/skills/vitest)
  Usar para revisar configuracao de Vitest, diagnosticar falhas do runner e organizar suites do frontend.

## Gatilhos recomendados por trilha

### Backend

- Desenho de recurso/endpoint: `api-designer`
- Revisao de arquitetura: `review-architecture`
- Revisao ampla de modulo/repo: `review-codebase`
- Contrato/documentacao de API: `api-documenter` + `openapi`
- Modelagem de banco: `supabase-postgres-best-practices`

### Frontend

- Nova UI ou refino visual: `frontend-skill`
- Padroes visuais e acessibilidade: `web-design-guidelines`
- Tokens e componentizacao: `tailwind-design-system`
- React e performance: `vercel-react-best-practices`
- Teste do frontend: `vitest` + `playwright`

### Infra e operacao

- Docker/compose/Dockerfiles: `docker`
- GitHub Actions/CI: `github-actions-expert` + `generate-github-workflow`
- Cluster/Kubernetes: `kubernetes` + `helm-chart-scaffolding`
- GitOps: `gitops-workflow`
- Observabilidade: `monitoring-observability`

## Regra pratica do projeto

Quando uma tarefa importante comecar e houver uma skill claramente apropriada, a skill deve entrar antes da implementacao. Isso evita que o projeto cresca em modo improviso justamente nos pontos em que ele mais precisa de consistencia.
