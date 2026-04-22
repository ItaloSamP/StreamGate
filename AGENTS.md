# AGENTS

Guia rapido para agentes e contribuidores trabalhando no StreamGate.

## Mapa do repositorio

- `apps/api`: Rails API-only, auth, operacao segura, artefatos, notificacoes e contratos OpenAPI.
- `apps/web`: React + Vite, command center, inbox de notificacoes e painel admin de operacoes.
- `apps/worker`: runtime Ruby para consumo de eventos, processamento, artefatos e notificacoes operacionais.
- `packages/contracts`: schemas e examples compartilhados por dominio.
- `scripts`: bootstrap, dev, compose, CI local, smokes e reports.
- `docs`: guias tecnicos, roadmap, closeouts e referencias operacionais.

## Comandos oficiais

- Setup/app stack:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\dev\dev-up.ps1 -Mode app`
  - `bash scripts/dev/dev-up.sh app`
- Stack completa:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\dev\dev-up.ps1 -Mode full`
  - `bash scripts/dev/dev-up.sh full`
- Derrubar stack:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\dev\dev-down.ps1`
  - `bash scripts/dev/dev-down.sh`

## Gates principais

- Fast gates do dia a dia:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 e2e`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 docker`
- Frontend:
  - `cd apps/web && pnpm test:run`
  - `cd apps/web && pnpm test:integration`
  - `cd apps/web && pnpm build`
- Backend:
  - `cd apps/api && bundle exec rails test`
- Worker:
  - `cd apps/worker && bundle exec rspec`
- Contratos:
  - `ruby scripts/ci/validate-operational-contracts.rb`
- Operational gate:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1`
- Full-closeout gate:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout`

## Politica operacional dos gates

- `WSL/Compose-first` e o caminho oficial para gates pesados; Windows host continua suportado para checks rapidos e suporte local.
- `ci-local all` continua existindo, mas deve ser reservado para fechamento relevante ou diagnostico; no dia a dia prefira workflows isolados.
- `run-smokes` e o gate operacional ponta a ponta para runtime, worker, notificacoes, artefatos e operacao segura.
- `run-all-reports` e o orquestrador oficial de evidencias; ele nao deve rerodar `ci-local all` em cascata.
- Use `-SkipInstallSteps` e `-ResumeFromStep` no `ci-local.ps1` quando a investigacao exigir retomar o fluxo sem repetir bootstrap pesado.

## Regras de trabalho

- Nao espalhe chamadas HTTP fora da fronteira oficial do client no frontend.
- Toda mudanca de endpoint precisa manter OpenAPI e `packages/contracts` sincronizados no mesmo ciclo.
- Mutacoes operacionais sensiveis exigem RBAC, motivo obrigatorio, auditoria e `Idempotency-Key`.
- Smokes e reports devem continuar sobrescrevendo artefatos locais sem versionar lixo de execucao.
- Docs afetadas por runtime, contratos, seguranca ou UX operacional devem ser atualizadas junto com o codigo.

## Referencias de apoio

- `README.md`
- `docs/planning/streamgate-full-sprints-roadmap.md`
- `docs/guides/platform/devops-roadmap.md`
- `docs/guides/operations/worker-runtime-runbook.md`
- `docs/guides/backend/api-docs.md`
- `docs/reports/index.html`
