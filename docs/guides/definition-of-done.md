# Definition of Done

## Objetivo

Este documento existe para transformar a definicao de pronto do StreamGate em uma referencia simples, reutilizavel e verificavel por sprint, PR e revisao tecnica.

Ele complementa o roadmap mestre e nao substitui os criterios especificos de backend, frontend, DevOps, testes e seguranca ja definidos nos guias da stack.

## Regra principal

Nenhuma entrega e considerada pronta apenas porque o codigo parece funcionar.

Uma task, PR ou sprint so pode ser tratada como concluida quando os criterios abaixo estiverem atendidos no escopo alterado.

## Definition of Done global

### 1. Escopo implementado de forma coerente

- a mudanca entrega o objetivo declarado
- nao introduz comportamento paralelo desnecessario
- respeita a arquitetura e a linguagem oficial do projeto

### 2. Documentacao atualizada

- os documentos impactados pela mudanca foram atualizados
- riscos, limites, mocks e trade-offs foram registrados quando existirem
- o roadmap foi atualizado quando a task fizer parte de uma sprint ativa

## 3. Skills usadas desde o inicio da task

- a task foi iniciada pelas skills da trilha correspondente
- a skill nao foi tratada como sugestao opcional
- implementacao, revisao e validacao seguiram o metodo definido no projeto

## 4. Validacao executada

- os testes planejados para o escopo foram executados
- quando um comando falhou por ambiente, isso foi registrado com causa explicita
- quando um comando falhou por implementacao, a falha nao foi ignorada

## 5. CI e checks relevantes

- os checks relevantes para a mudanca estao verdes ou tiveram excecao documentada
- comandos locais e CI contam a mesma historia operacional da entrega

## 6. Contratos e interface atualizados

- endpoints novos ou alterados atualizam Swagger/OpenAPI no mesmo ciclo
- mudancas de frontend tratam loading, empty, error e success explicitamente
- contratos compartilhados permanecem consistentes com a linguagem oficial do projeto

## 7. Ambiente e operacao preservados

- servicos Docker do escopo nao ficam `unhealthy`
- a entrega nao depende apenas da maquina de quem implementou
- impactos de setup, envs, scripts ou fluxo operacional foram documentados

## 8. Revisao de seguranca proporcional ao escopo

- toda task revisou se abriu ou alterou auth, upload, storage, broker, dashboard, analytics, envs ou segredos
- mudancas de frontend com auth, browser storage ou consumo de API passaram por `security-best-practices`
- mudancas de backend, infra ou novas superficies sensiveis passaram por revisao de seguranca proporcional e threat modeling quando aplicavel
- segredos, arquivos sensiveis e defaults de ambiente nao foram promovidos sem documentacao e controle explicitos

## 9. Evidencias registradas

Sempre que aplicavel, a entrega deve deixar rastros claros de validacao:

- comandos executados
- resultados relevantes
- telas ou rotas validadas
- servicos `healthy`
- arquivos de documentacao alterados
- riscos aceitos explicitamente

## Uso por PR

Ao abrir ou revisar um PR, confirmar pelo menos:

- qual objetivo esta sendo entregue
- quais documentos foram atualizados
- quais checks foram executados
- se houve falha de ambiente ou falha real de implementacao
- se houve revisao de seguranca proporcional ao escopo
- quais riscos ou pendencias ficaram para depois

## Uso por sprint

Ao encerrar uma sprint, confirmar:

- itens do roadmap marcados corretamente
- Definition of Done atendida no escopo fechado
- evidencias registradas
- pendencias remanescentes visiveis para a sprint seguinte

## Regra de reavaliacao antes da proxima sprint

Encerrar uma sprint nao autoriza iniciar a seguinte automaticamente.

Antes de abrir a proxima sprint, passa a ser obrigatorio executar uma reavaliacao formal do produto e do repositorio para revisar o estado real da entrega e atualizar o plano vivo do projeto.

Essa reavaliacao deve sempre:

- revisar o que foi planejado versus o que foi realmente entregue;
- revisar codigo, infraestrutura, contratos, UX, testes, seguranca, observabilidade e documentacao impactados;
- identificar gaps, dividas, retrabalho evitavel, mudancas de prioridade e funcionalidades novas surgidas durante a sprint;
- atualizar o roadmap mestre e toda documentacao relacionada ao estado atual do projeto.

## Skills obrigatorias nessa reavaliacao

Essa reavaliacao nao deve ser feita sem metodo. Ela deve sempre usar skills para apoiar a leitura do estado atual e a atualizacao do plano.

Skills minimas obrigatorias:

- `review-codebase` para revisar o estado estrutural real do repositorio;
- `breakdown-test` para revisar cobertura, lacunas e qualidade esperada das proximas entregas;
- `readiness-report` para identificar gaps de maturidade operacional, governanca, feedback loop e prontidao do repositorio.

Skills adicionais devem entrar quando a sprint tocar temas especificos, por exemplo:

- `review-architecture`, `architecture-patterns` e `domain-modeling` para mudancas fortes de backend e dominio;
- `api-documenter`, `api-designer`, `openapi` e `api-contract-testing` para API e contratos;
- `frontend-skill`, `web-design-guidelines`, `tailwind-design-system` e `vercel-react-best-practices` para evolucao relevante de frontend;
- `integration-testing`, `vitest` e `playwright` para revisar estrategia real de testes;
- `security-best-practices` e `security-threat-model` para superfices sensiveis;
- `docker`, `github-actions-expert`, `monitoring-observability`, `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow` para trilhas operacionais e de plataforma.

A transicao entre sprints so deve ser considerada pronta quando essa reavaliacao tiver sido executada e refletida na documentacao viva do projeto.

Checklist operacional oficial: `docs/guides/sprint-reassessment-checklist.md`.

## Referencias relacionadas

- [Roadmap mestre de sprints](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
- [Fundacoes do backend](C:/estudos/StreamGate/docs/guides/backend-foundations.md)
- [Fundacoes do frontend](C:/estudos/StreamGate/docs/guides/frontend-foundations.md)
- [Baseline DevOps da Sprint 0](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md)
- [Baseline de Testes da Sprint 0](C:/estudos/StreamGate/docs/guides/testing-baseline-sprint-0.md)
- [Baseline de Seguranca da Sprint 0](C:/estudos/StreamGate/docs/guides/security-baseline-sprint-0.md)
- [Threat model inicial do repositorio](C:/estudos/StreamGate/docs/guides/streamgate-threat-model.md)
- [Checklist de reavaliacao entre sprints](C:/estudos/StreamGate/docs/guides/sprint-reassessment-checklist.md)
