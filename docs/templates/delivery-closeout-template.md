# Template de Fechamento de Entrega

## Identificacao

- Ciclo de entrega:
- Periodo:
- Responsaveis:
- Data do fechamento:

## Resumo executivo

- Objetivo original do ciclo de entrega:
- Resultado real do ciclo de entrega:
- Leitura geral: `concluida`, `parcial` ou `replanejada`

## O que foi entregue

- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

## O que ficou parcial

- Item:
  - Status atual:
  - O que falta:
  - Impacto no proximo ciclo de entrega:

## O que nao foi entregue

- Item:
  - Motivo:
  - Continua prioritario?:
  - Vai para qual ciclo de entrega ou trilha?:

## O que surgiu de novo durante o ciclo de entrega

- Novo requisito, risco, dependencia ou oportunidade:
- Origem:
- Impacto no produto:
- Precisa entrar no roadmap?: `sim` ou `nao`

## Validacao executada

- Comandos executados:
- Testes executados:
- CI/checks relevantes:
- Falhas classificadas como ambiente:
- Falhas classificadas como implementacao:

## Seguranca, operacao e observabilidade

- Novas superficies sensiveis abertas:
- Gaps de seguranca identificados:
- Gaps operacionais identificados:
- Gaps de observabilidade identificados:
- Runbooks ou alertas que precisam ser criados/atualizados:

## Documentacao atualizada

- [ ] `docs/planning/`
- [ ] `docs/product/vision.md`
- [ ] `docs/guides/platform/architecture.md`
- [ ] `docs/guides/backend/backend-foundations.md`
- [ ] `docs/guides/frontend/frontend-foundations.md`
- [ ] `docs/guides/quality/definition-of-done.md`
- [ ] `docs/guides/quality/testing-baseline.md` ou documento equivalente
- [ ] `docs/guides/security/security-baseline.md` ou documento equivalente
- [ ] `docs/guides/platform/devops-roadmap.md`
- [ ] `docs/guides/operations/documentation-governance.md`
- [ ] `apps/web/README.md`
- [ ] `apps/api/README.md`
- [ ] `apps/worker/README.md`
- [ ] `packages/contracts`
- [ ] `apps/api/openapi/v1/openapi.yaml`
- [ ] Regra de skill obrigatoria para documentacao (`documentation-writer`) aplicada nas tasks documentais do ciclo de entrega
- [ ] Outros:

## Skills usadas na reavaliacao

Skills minimas obrigatorias:

- [ ] `review-codebase`
- [ ] `breakdown-test`
- [ ] `readiness-report`
- [ ] `documentation-writer` (obrigatoria para qualquer atividade de documentacao)

Skills adicionais usadas neste ciclo de entrega:

- [ ] `review-architecture`
- [ ] `architecture-patterns`
- [ ] `domain-modeling`
- [ ] `api-documenter`
- [ ] `api-designer`
- [ ] `openapi`
- [ ] `api-contract-testing`
- [ ] `frontend-skill`
- [ ] `web-design-guidelines`
- [ ] `tailwind-design-system`
- [ ] `vercel-react-best-practices`
- [ ] `integration-testing`
- [ ] `vitest`
- [ ] `playwright`
- [ ] `security-best-practices`
- [ ] `security-threat-model`
- [ ] `docker`
- [ ] `github-actions-expert`
- [ ] `monitoring-observability`
- [ ] `kubernetes`
- [ ] `helm-chart-scaffolding`
- [ ] `gitops-workflow`
- [ ] Outras:

## Delta por trilha (obrigatorio)

Para cada trilha, registrar status e delta para o ciclo de entrega seguinte. Se nao foi tocada, preencher com `nao tocada neste ciclo de entrega`.

- `Back planning`:
  - Status (`concluida`, `parcial`, `nao tocada`):
  - Delta para o proximo ciclo de entrega:
- `Back execution`:
  - Status (`concluida`, `parcial`, `nao tocada`):
  - Delta para o proximo ciclo de entrega:
- `Worker execution` (quando houver):
  - Status (`concluida`, `parcial`, `nao tocada`):
  - Delta para o proximo ciclo de entrega:
- `Front planning`:
  - Status (`concluida`, `parcial`, `nao tocada`):
  - Delta para o proximo ciclo de entrega:
- `Front execution`:
  - Status (`concluida`, `parcial`, `nao tocada`):
  - Delta para o proximo ciclo de entrega:
- `DevOps`:
  - Status (`concluida`, `parcial`, `nao tocada`):
  - Delta para o proximo ciclo de entrega:
- `Documentation`:
  - Status (`concluida`, `parcial`, `nao tocada`):
  - Delta para o proximo ciclo de entrega:
- `Test planning`:
  - Status (`concluida`, `parcial`, `nao tocada`):
  - Delta para o proximo ciclo de entrega:
- `Test execution`:
  - Status (`concluida`, `parcial`, `nao tocada`):
  - Delta para o proximo ciclo de entrega:
- `Security`:
  - Status (`concluida`, `parcial`, `nao tocada`):
  - Delta para o proximo ciclo de entrega:
- `Skills do ciclo de entrega`:
  - Status (`concluida`, `parcial`, `nao tocada`):
  - Delta para o proximo ciclo de entrega:

## Reavaliacao para o proximo ciclo de entrega

- O roadmap foi revisado com base no estado real do projeto?: `sim` ou `nao`
- A ordem dos proximos ciclos de entrega continua fazendo sentido?: `sim` ou `nao`
- Principais prioridades do proximo ciclo de entrega:
- Bloqueadores que continuam vivos:
- Novos bloqueadores descobertos:
- Lacunas tecnicas ou logicas que precisam entrar oficialmente no plano:

## Decisao de transicao

- Existe alguma trilha com gap critico sem plano, responsavel e ciclo de entrega alvo?: `sim` ou `nao`
- O proximo ciclo de entrega pode ser aberto?: `sim` ou `nao`
- Condicoes para abertura:
- Ajustes obrigatorios antes de iniciar:
