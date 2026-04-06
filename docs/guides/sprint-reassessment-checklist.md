# Checklist de Reavaliacao Entre Sprints

## Objetivo

Este documento transforma a reavaliacao entre sprints em um ritual operacional claro, repetivel e verificavel.

Ele deve ser usado sempre que uma sprint terminar e antes que a proxima seja oficialmente aberta.

A ideia nao e fazer uma retrospectiva abstrata. A ideia e revisar o estado real do produto, identificar o que mudou desde o planejamento anterior e atualizar o plano vivo do projeto para evitar backlog invisivel, lacunas tecnicas e estagnacao.

## Regra principal

Nenhuma sprint nova deve comecar sem que este checklist tenha sido executado e refletido na documentacao viva do projeto.

## Skills obrigatorias

Esta reavaliacao deve sempre usar, no minimo:

- `review-codebase`
- `breakdown-test`
- `readiness-report`

Adicionar tambem as skills da trilha afetada pela sprint que terminou, por exemplo:

- `review-architecture`, `architecture-patterns`, `domain-modeling`
- `api-documenter`, `api-designer`, `openapi`, `api-contract-testing`
- `frontend-skill`, `web-design-guidelines`, `tailwind-design-system`, `vercel-react-best-practices`
- `integration-testing`, `vitest`, `playwright`
- `security-best-practices`, `security-threat-model`
- `docker`, `github-actions-expert`, `monitoring-observability`, `kubernetes`, `helm-chart-scaffolding`, `gitops-workflow`

## Checklist operacional

### 1. Revisar o que foi entregue de verdade

- [ ] Comparar o que estava planejado na sprint com o que foi realmente implementado.
- [ ] Identificar itens concluidos, itens parciais e itens que ficaram para tras.
- [ ] Confirmar se houve mudanca de escopo, prioridade ou abordagem durante a sprint.
- [ ] Confirmar se a documentacao atual descreve corretamente o estado atual do projeto.

### 2. Revisar o estado real do codigo e da arquitetura

- [ ] Revisar as areas alteradas no codigo com `review-codebase`.
- [ ] Revisar se surgiram novos acoplamentos, retrabalho potencial ou drift arquitetural.
- [ ] Confirmar se contratos, naming, ids, estados e fronteiras continuam coerentes.
- [ ] Confirmar se surgiram novas entidades, regras, fluxos ou modulos que precisam entrar no roadmap.

### 3. Revisar testes, qualidade e validacao

- [ ] Reavaliar cobertura e lacunas com `breakdown-test`.
- [ ] Confirmar quais tipos de teste agora sao obrigatorios na proxima sprint.
- [ ] Confirmar se houve falha de ambiente ou falha real de implementacao durante a sprint.
- [ ] Revisar se o CI continua contando a mesma historia do estado real do produto.

### 4. Revisar seguranca, operacao e observabilidade

- [ ] Revisar se surgiram novas superficies sensiveis, riscos ou dependencias externas.
- [ ] Revisar se logs, rastreabilidade, auditoria e runbooks continuam suficientes para a fase atual.
- [ ] Revisar se o projeto acumulou lacunas de seguranca, operacao ou governanca que precisam entrar no plano.
- [ ] Confirmar se surgiram necessidades novas de monitoramento, alertas, hardening ou automacao.

### 5. Revisar maturidade e prontidao do repositorio

- [ ] Rodar ou atualizar a leitura com `readiness-report`.
- [ ] Identificar gaps de governanca, agent-readiness, automacao, feedback loop e descoberta de tarefas.
- [ ] Confirmar se novos rituais, templates, scanners ou gates devem entrar nas proximas sprints.

### 6. Atualizar o plano vivo do projeto

- [ ] Atualizar o roadmap mestre com itens concluidos, pendentes, novos e replanejados.
- [ ] Atualizar a visao do produto se o entendimento do produto tiver evoluido.
- [ ] Atualizar arquitetura, ADRs, runbooks, OpenAPI, contratos e READMEs impactados.
- [ ] Registrar explicitamente lacunas tecnicas, logicas, operacionais e documentais que precisem entrar na proxima sprint.

### 7. Registrar delta por trilha (obrigatorio em todas as sprints)

- [ ] `Back planning`: registrar escopo planejado vs entregue e repriorizacao.
- [ ] `Back execution`: registrar mudancas de dominio, contratos e debitos tecnicos.
- [ ] `Worker execution` (quando houver): registrar retries, idempotencia e rastreabilidade operacional.
- [ ] `Front planning`: registrar ajustes de jornada, UX e prioridades.
- [ ] `Front execution`: registrar fluxo validado, estados de UI, a11y e performance.
- [ ] `DevOps`: registrar gates, automacoes, ambientes, smoke e lacunas operacionais.
- [ ] `Documentation`: registrar docs/ADRs/runbooks atualizados e pendencias.
- [ ] `Test planning`: registrar cobertura obrigatoria da proxima sprint.
- [ ] `Test execution`: registrar resultados, falhas de ambiente vs implementacao e risco residual.
- [ ] `Security`: registrar superficies sensiveis, controles faltantes e hardening.
- [ ] `Skills da sprint`: registrar skills usadas, faltantes e ajustes recomendados.
- [ ] Para qualquer trilha nao tocada, registrar explicitamente `nao tocada nesta sprint`.

### 8. Validar a transicao para a proxima sprint

- [ ] Confirmar o que entra como prioridade alta da proxima sprint.
- [ ] Confirmar o que permanece bloqueador e o que deixou de ser bloqueador.
- [ ] Confirmar se a ordem de execucao do roadmap ainda faz sentido.
- [ ] Confirmar que a proxima sprint vai partir do estado real do projeto, e nao de um plano antigo.

## Saidas minimas obrigatorias

Ao final da reavaliacao entre sprints, deve existir pelo menos:

- roadmap mestre atualizado;
- documentacao relacionada atualizada;
- lista explicita do que foi concluido, do que ficou parcial e do que apareceu de novo;
- registro das lacunas que entraram na proxima sprint;
- registro das skills usadas nessa reavaliacao;
- registro do delta por trilha (incluindo `nao tocada nesta sprint` quando aplicavel).

## Documentos que normalmente precisam ser revisitados

- `docs/planning/streamgate-full-sprints-roadmap.md`
- `docs/product/vision.md`
- `docs/guides/architecture.md`
- `docs/guides/backend-foundations.md`
- `docs/guides/frontend-foundations.md`
- `docs/guides/definition-of-done.md`
- `docs/guides/testing-baseline-sprint-0.md` ou o documento de testes vigente
- `docs/guides/security-baseline-sprint-0.md` ou o documento de seguranca vigente
- `docs/guides/devops-roadmap.md`
- `apps/web/README.md`
- `apps/api/README.md`
- `apps/worker/README.md`
- `packages/contracts`
- `apps/api/openapi/v1/openapi.yaml`

## Uso recomendado

Usar este checklist como ritual oficial de fechamento e transicao de sprint.

Sequencia recomendada:

1. Encerrar a sprint com evidencias e status real.
2. Executar esta reavaliacao com skills.
3. Atualizar roadmap e docs.
4. So depois abrir a proxima sprint.

Template recomendado para registrar esse fechamento: `docs/templates/sprint-closeout-template.md`.

Primeiro registro oficial criado em: `docs/sprints/SPRINT-00-closeout.md`.
