---
name: Chore / Ops
about: Registrar manutencao operacional, CI, scripts, compose ou governanca do repo
title: "[Ops]: "
labels: ["chore", "ops"]
assignees: ["ItaloSamP"]
---

## Contexto operacional

Qual fluxo esta sendo mantido ou endurecido?

## Mudanca proposta

- Scripts:
- CI/workflows:
- Compose/infra:
- Repo readiness:

## Risco

- O que pode quebrar:
- Plano de rollback:

## Validacao

- [ ] `scripts/ci/ci-local.ps1 <workflow-relevante>`
- [ ] `scripts/smokes/run-smokes.ps1` (quando tocar runtime/worker/notificacoes/artefatos)
- [ ] `scripts/reports/run-all-reports.ps1 -Profile full-closeout` (quando for fechamento grande)
- [ ] Outros:
