# Documentacao Do StreamGate

Este diretorio concentra a documentacao viva do StreamGate. A leitura deve permitir que produto, engenharia e operacao entendam o que existe, como rodar, como validar e quais limites ainda precisam ser respeitados.

## Como Navegar

Comece por estes documentos:

1. [Visao de produto](product/vision.md)
2. [Guia de fechamento do produto](guides/platform/final-delivery-guide.md)
3. [Arquitetura](guides/platform/architecture.md)
4. [Setup](guides/platform/setup.md)
5. [API docs](guides/backend/api-docs.md)
6. [Frontend foundations](guides/frontend/frontend-foundations.md)
7. [Workspace map](guides/frontend/frontend-workspace-map.md)
8. [Worker runbook](guides/operations/worker-runtime-runbook.md)
9. [Testing baseline](guides/quality/testing-baseline.md)
10. [Threat model](guides/security/streamgate-threat-model.md)
11. [Release/rollback checklist](guides/platform/release-rollback-checklist.md)
12. [Roadmap e closeouts](planning/)

## Mapa Por Area

| Area | Documentos principais |
| --- | --- |
| Produto | `product/vision.md`, `guides/platform/final-delivery-guide.md` |
| Plataforma | `guides/platform/architecture.md`, `setup.md`, `devops-roadmap.md`, `release-rollback-checklist.md` |
| Backend | `guides/backend/api-docs.md`, `backend-foundations.md`, `authentication-guide.md`, `domain-glossary.md` |
| Frontend | `guides/frontend/frontend-foundations.md`, `frontend-workspace-map.md` |
| Worker e operacao | `guides/operations/worker-runtime-runbook.md`, `documentation-governance.md` |
| Qualidade | `guides/quality/definition-of-done.md`, `testing-baseline.md`, `delivery-reassessment-checklist.md` |
| Seguranca | `guides/security/security-baseline.md`, `streamgate-threat-model.md` |
| Evidencias | `reports/index.html`, `sprints/` |

## Principios De Governanca

- Documentos de produto descrevem comportamento atual e limites aprovados.
- Guias tecnicos devem apontar para comandos reais e contratos versionados.
- Mudancas de API exigem atualizacao coordenada de OpenAPI, contratos, exemplos e docs.
- Mudancas em runtime, worker, seguranca ou UX operacional devem atualizar runbook, threat model ou workspace map quando houver impacto.
- Referencias historicas de ciclos ficam no roadmap e closeouts; docs permanentes devem falar em produto, release, operacao e contrato.

## Evidencias E Reports

O hub `docs/reports/index.html` e gerado pelos scripts de reports e serve como indice local dos artefatos de validacao.

Reports detalhados ficam em:

- `apps/web/reports/`
- `apps/web/e2e/reports/`
- `apps/api/test/reports/`
- `apps/worker/spec/reports/`
- `scripts/ci/reports/`
- `scripts/smokes/reports/`

Esses artefatos sao sobrescritos pelos gates e, em geral, nao devem ser versionados.

## Templates E Historico

- Templates: `docs/templates/`
- Closeouts historicos: consulte o indice de planejamento e os arquivos de fechamento historico.
- Roadmap mestre: `docs/planning/`
- ADRs: `docs/adr/`
