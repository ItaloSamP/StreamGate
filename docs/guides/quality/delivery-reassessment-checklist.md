# Checklist de Reavaliacao de Entrega

## Objetivo
Este guia consolida diretrizes de delivery reassessment checklist para uso consistente no projeto.

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

## Referencias
- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/)
- [Governanca de documentacao](C:/estudos/StreamGate/docs/guides/operations/documentation-governance.md)


## Objetivo detalhado

Este documento transforma a reavaliacao entre ciclos de entrega em um ritual operacional claro, repetivel e verificavel.

Ele deve ser usado sempre que um ciclo de entrega terminar e antes que a proxima seja oficialmente aberta.

A ideia nao e fazer uma retrospectiva abstrata. A ideia e revisar o estado real do produto, identificar o que mudou desde o planejamento anterior e atualizar o plano vivo do projeto para evitar backlog invisivel, lacunas tecnicas e estagnacao.

## Regra principal

Nenhum ciclo de entrega novo deve comecar sem que este checklist tenha sido executado e refletido na documentacao viva do projeto.

## Skills obrigatorias

Esta reavaliacao deve sempre usar, no minimo:

- `review-codebase`
- `breakdown-test`
- `readiness-report`

Adicionar tambem as skills da trilha afetada pelo ciclo de entrega que terminou, por exemplo:

- `review-architecture`, `architecture-patterns`, `domain-modeling`
- `api-documenter`, `api-designer`, `openapi`, `api-contract-testing`
- `frontend-skill`, `web-design-guidelines`, `tailwind-design-system`, `vercel-react-best-practices`
- `integration-testing`, `vitest`, `playwright`
- `security-best-practices`, `security-threat-model`
- `docker`, `github-actions-expert`, `monitoring-observability`, `kubernetes`, `helm-chart-scaffolding`, `gitops-workflow`

## Checklist operacional

### 1. Revisar o que foi entregue de verdade

- [ ] Comparar o que estava planejado no ciclo de entrega com o que foi realmente implementado.
- [ ] Identificar itens concluidos, itens parciais e itens que ficaram para tras.
- [ ] Confirmar se houve mudanca de escopo, prioridade ou abordagem durante o ciclo de entrega.
- [ ] Confirmar se a documentacao atual descreve corretamente o estado atual do projeto.

### 2. Revisar o estado real do codigo e da arquitetura

- [ ] Revisar as areas alteradas no codigo com `review-codebase`.
- [ ] Revisar se surgiram novos acoplamentos, retrabalho potencial ou drift arquitetural.
- [ ] Confirmar se contratos, naming, ids, estados e fronteiras continuam coerentes.
- [ ] Confirmar se surgiram novas entidades, regras, fluxos ou modulos que precisam entrar no roadmap.

### 3. Revisar testes, qualidade e validacao

- [ ] Reavaliar cobertura e lacunas com `breakdown-test`.
- [ ] Confirmar quais tipos de teste agora sao obrigatorios no proximo ciclo de entrega.
- [ ] Confirmar se houve falha de ambiente ou falha real de implementacao durante o ciclo de entrega.
- [ ] Revisar se o CI continua contando a mesma historia do estado real do produto.

### 4. Revisar seguranca, operacao e observabilidade

- [ ] Revisar se surgiram novas superficies sensiveis, riscos ou dependencias externas.
- [ ] Revisar se logs, rastreabilidade, auditoria e runbooks continuam suficientes para a fase atual.
- [ ] Revisar se o projeto acumulou lacunas de seguranca, operacao ou governanca que precisam entrar no plano.
- [ ] Confirmar se surgiram necessidades novas de monitoramento, alertas, hardening ou automacao.

### 5. Revisar maturidade e prontidao do repositorio

- [ ] Rodar ou atualizar a leitura com `readiness-report`.
- [ ] Identificar gaps de governanca, agent-readiness, automacao, feedback loop e descoberta de tarefas.
- [ ] Confirmar se novos rituais, templates, scanners ou gates devem entrar nos proximos ciclos de entrega.

### 6. Atualizar o plano vivo do projeto

- [ ] Atualizar o roadmap mestre com itens concluidos, pendentes, novos e replanejados.
- [ ] Atualizar a visao do produto se o entendimento do produto tiver evoluido.
- [ ] Atualizar arquitetura, ADRs, runbooks, OpenAPI, contratos e READMEs impactados.
- [ ] Registrar explicitamente lacunas tecnicas, logicas, operacionais e documentais que precisem entrar no proximo ciclo de entrega.

### 7. Registrar delta por trilha (obrigatorio em todos os ciclos de entrega)

- [ ] `Back planning`: registrar escopo planejado vs entregue e repriorizacao.
- [ ] `Back execution`: registrar mudancas de dominio, contratos e debitos tecnicos.
- [ ] `Worker execution` (quando houver): registrar retries, idempotencia e rastreabilidade operacional.
- [ ] `Front planning`: registrar ajustes de jornada, UX e prioridades.
- [ ] `Front execution`: registrar fluxo validado, estados de UI, a11y e performance.
- [ ] `DevOps`: registrar gates, automacoes, ambientes, smoke e lacunas operacionais.
- [ ] `Documentation`: registrar docs/ADRs/runbooks atualizados e pendencias.
- [ ] `Test planning`: registrar cobertura obrigatoria do proximo ciclo de entrega.
- [ ] `Test execution`: registrar resultados, falhas de ambiente vs implementacao e risco residual.
- [ ] `Security`: registrar superficies sensiveis, controles faltantes e hardening.
- [ ] `Skills do ciclo de entrega`: registrar skills usadas, faltantes e ajustes recomendados.
- [ ] Para qualquer trilha nao tocada, registrar explicitamente `nao tocada neste ciclo de entrega`.

### 8. Validar a transicao para o proximo ciclo de entrega

- [ ] Confirmar o que entra como prioridade alta do proximo ciclo de entrega.
- [ ] Confirmar o que permanece bloqueador e o que deixou de ser bloqueador.
- [ ] Confirmar se a ordem de execucao do roadmap ainda faz sentido.
- [ ] Confirmar que o proximo ciclo de entrega vai partir do estado real do projeto, e nao de um plano antigo.

## Saidas minimas obrigatorias

Ao final da reavaliacao entre ciclos de entrega, deve existir pelo menos:

- roadmap mestre atualizado;
- documentacao relacionada atualizada;
- lista explicita do que foi concluido, do que ficou parcial e do que apareceu de novo;
- registro das lacunas que entraram no proximo ciclo de entrega;
- registro das skills usadas nessa reavaliacao;
- registro do delta por trilha (incluindo `nao tocada neste ciclo de entrega` quando aplicavel).

## Documentos que normalmente precisam ser revisitados

- `docs/planning/`
- `docs/product/vision.md`
- `docs/guides/platform/architecture.md`
- `docs/guides/backend/backend-foundations.md`
- `docs/guides/frontend/frontend-foundations.md`
- `docs/guides/quality/definition-of-done.md`
- `docs/guides/quality/testing-baseline.md` ou o documento de testes vigente
- `docs/guides/security/security-baseline.md` ou o documento de seguranca vigente
- `docs/guides/platform/devops-roadmap.md`
- `apps/web/README.md`
- `apps/api/README.md`
- `apps/worker/README.md`
- `packages/contracts`
- `apps/api/openapi/v1/openapi.yaml`

## Uso recomendado

Usar este checklist como ritual oficial de fechamento e transicao de ciclo de entrega.

Sequencia recomendada:

1. Encerrar o ciclo de entrega com evidencias e status real.
2. Executar esta reavaliacao com skills.
3. Atualizar roadmap e docs.
4. So depois abrir o proximo ciclo de entrega.

Template recomendado para registrar esse fechamento: `docs/templates/delivery-closeout-template.md`.

Registre cada fechamento no arquivo historico correspondente.
