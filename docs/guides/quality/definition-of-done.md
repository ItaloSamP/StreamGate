# Definition of Done

## Objetivo
Este guia consolida diretrizes de definition of done para uso consistente no projeto.

## Estado atual
Conteudo alinhado ao estado operacional atual; atualizar em cada mudanca relevante.


## Estado atual detalhado
Conteudo alinhado ao estado operacional atual; atualizar em cada mudanca relevante.

## Regras/Contratos
- As regras normativas deste tema estao descritas nas secoes tecnicas abaixo.
- Mudancas devem manter alinhamento com roadmap, ADRs e READMEs.

## Validacao/Evidencias
- Validar coerencia com README raiz, docs/README e roadmap da release atual.
- Registrar atualizacoes desta pagina no closeout do ciclo de entrega correspondente.


## Objetivo detalhado

Este documento existe para transformar a definicao de pronto do StreamGate em uma referencia simples, reutilizavel e verificavel por ciclo de entrega, PR e revisao tecnica.

Ele complementa o roadmap mestre e nao substitui os criterios especificos de backend, frontend, DevOps, testes e seguranca ja definidos nos guias da stack.

## Regra principal

Nenhuma entrega e considerada pronta apenas porque o codigo parece funcionar.

Uma task, PR ou ciclo de entrega so pode ser tratada como concluida quando os criterios abaixo estiverem atendidos no escopo alterado.

## Definition of Done global

### 1. Escopo implementado de forma coerente

- a mudanca entrega o objetivo declarado
- nao introduz comportamento paralelo desnecessario
- respeita a arquitetura e a linguagem oficial do projeto

### 2. Documentacao atualizada

- os documentos impactados pela mudanca foram atualizados
- riscos, limites, mocks e trade-offs foram registrados quando existirem
- o roadmap foi atualizado quando a task fizer parte de um ciclo de entrega ativa

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

## Uso por ciclo de entrega

Ao encerrar um ciclo de entrega, confirmar:

- itens do roadmap marcados corretamente
- Definition of Done atendida no escopo fechado
- evidencias registradas
- pendencias remanescentes visiveis para o ciclo de entrega seguinte

## Regra de reavaliacao antes do proximo ciclo de entrega

Encerrar um ciclo de entrega nao autoriza iniciar a seguinte automaticamente.

Antes de abrir o proximo ciclo de entrega, passa a ser obrigatorio executar uma reavaliacao formal do produto e do repositorio para revisar o estado real da entrega e atualizar o plano vivo do projeto.

Essa reavaliacao deve sempre:

- revisar o que foi planejado versus o que foi realmente entregue;
- revisar codigo, infraestrutura, contratos, UX, testes, seguranca, observabilidade e documentacao impactados;
- identificar gaps, dividas, retrabalho evitavel, mudancas de prioridade e funcionalidades novas surgidas durante o ciclo de entrega;
- atualizar o roadmap mestre e toda documentacao relacionada ao estado atual do projeto.

## Skills obrigatorias nessa reavaliacao

Essa reavaliacao nao deve ser feita sem metodo. Ela deve sempre usar skills para apoiar a leitura do estado atual e a atualizacao do plano.

Skills minimas obrigatorias:

- `review-codebase` para revisar o estado estrutural real do repositorio;
- `breakdown-test` para revisar cobertura, lacunas e qualidade esperada das proximas entregas;
- `readiness-report` para identificar gaps de maturidade operacional, governanca, feedback loop e prontidao do repositorio.

Skills adicionais devem entrar quando o ciclo de entrega tocar temas especificos, por exemplo:

- `review-architecture`, `architecture-patterns` e `domain-modeling` para mudancas fortes de backend e dominio;
- `api-documenter`, `api-designer`, `openapi` e `api-contract-testing` para API e contratos;
- `frontend-skill`, `web-design-guidelines`, `tailwind-design-system` e `vercel-react-best-practices` para evolucao relevante de frontend;
- `integration-testing`, `vitest` e `playwright` para revisar estrategia real de testes;
- `security-best-practices` e `security-threat-model` para superfices sensiveis;
- `docker`, `github-actions-expert`, `monitoring-observability`, `kubernetes`, `helm-chart-scaffolding` e `gitops-workflow` para trilhas operacionais e de plataforma.

A transicao entre ciclos de entrega so deve ser considerada pronta quando essa reavaliacao tiver sido executada e refletida na documentacao viva do projeto.

Checklist operacional oficial: `docs/guides/quality/delivery-reassessment-checklist.md`.

## Referencias

- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/)
- [Fundacoes do backend](C:/estudos/StreamGate/docs/guides/backend/backend-foundations.md)
- [Fundacoes do frontend](C:/estudos/StreamGate/docs/guides/frontend/frontend-foundations.md)
- [Baseline DevOps](C:/estudos/StreamGate/docs/guides/platform/devops-baseline.md)
- [Baseline de Testes](C:/estudos/StreamGate/docs/guides/quality/testing-baseline.md)
- [Baseline de Seguranca](C:/estudos/StreamGate/docs/guides/security/security-baseline.md)
- [Threat model inicial do repositorio](C:/estudos/StreamGate/docs/guides/security/streamgate-threat-model.md)
- [Checklist de reavaliacao entre ciclos de entrega](C:/estudos/StreamGate/docs/guides/quality/delivery-reassessment-checklist.md)
