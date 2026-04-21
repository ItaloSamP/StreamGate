# Sprint 5 Closeout

## Resultado

Resultado real da Sprint 5 ate o fechamento da trilha DevOps: operacao segura mutavel, artefatos finais, notificacoes, readiness do repositorio e a nova politica de gates locais foram entregues e documentados.

## Evidencias principais

- `powershell -ExecutionPolicy Bypass -File scripts/smokes/run-smokes.ps1`
  - PASS
  - validou compose smoke, upload assinado, worker operacional, artefatos finais, notificacoes, retry/resolve/replay e audit trail.
- `powershell -ExecutionPolicy Bypass -File scripts/ci/ci-local.ps1 frontend`
- `powershell -ExecutionPolicy Bypass -File scripts/ci/ci-local.ps1 backend`
- `powershell -ExecutionPolicy Bypass -File scripts/ci/ci-local.ps1 e2e`
- `powershell -ExecutionPolicy Bypass -File scripts/ci/ci-local.ps1 docker`
  - passam a ser o caminho oficial de `fast gate` por trilha, sem duplicacao desnecessaria.
- `powershell -ExecutionPolicy Bypass -File scripts/reports/run-all-reports.ps1 -Profile full-closeout`
  - PASS
  - validou unit, API, worker, integracao auth real, E2E em modo estavel e smokes operacionais sem rerodar `ci-local all`.
- `docs/reports/index.html`
  - hub regenerado com cards por camada e playbook de gates.

## Mudanca operacional principal

### Antes

- `run-all-reports` rerodava pacotes que ja tinham sido executados por `ci-local` e `smokes`;
- `ci-local all` era empurrado como gate geral mesmo para mudancas pequenas;
- falhas longas interrompidas perdiam contexto demais para retomar rapido.

### Depois

- `ci-local` vira o gate `fast`, por workflow;
- `run-smokes` vira o gate `operational` ponta a ponta;
- `run-all-reports` vira o gate `full-closeout` e deixa de chamar `ci-local all` em cascata;
- `ci-local` passa a registrar `lastCompletedStep`, classificacao e logs por step com suporte a `-SkipInstallSteps` e `-ResumeFromStep`.
- `run-all-reports` registra o fechamento relevante em perfis (`fast`, `operational`, `full-closeout`) e publica o playbook no hub visual.

## Repo readiness entregue

- `CODEOWNERS`
- `dependabot.yml`
- issue templates
- PR template ajustado para perfis de gate
- `AGENTS.md`

## Riscos aceitos

- Gates pesados continuam caros em host Windows, por isso o caminho oficial foi formalizado como `WSL/Compose-first`.
- `ci-local all` permanece disponivel para diagnostico/fechamento, mas nao deve voltar a ser usado como gate padrao de toda implementacao pequena.
- Playwright em Firefox segue mais fragil no host Windows; o perfil estavel de fechamento usa Chromium unico para reduzir flake local sem perder o smoke operacional ponta a ponta.

## Proximos passos

- manter a matriz `fast / operational / full-closeout` na Sprint 6;
- continuar classificando falhas como `environment` ou `implementation` antes de abrir novos bloqueadores;
- evoluir observabilidade remota e automacao de release quando a trilha de cluster entrar.
