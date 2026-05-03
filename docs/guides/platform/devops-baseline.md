# Baseline DevOps

Este documento registra a linha operacional atual do StreamGate para ambiente local, CI remoto e fechamento de release.

## Ambiente Recomendado

| Ambiente | Papel | Status |
| --- | --- | --- |
| WSL2/Ubuntu | caminho principal para gates pesados | recomendado |
| Windows + PowerShell | suporte local e fallback operacional | suportado |
| Docker Compose | dependencias e stack completa local | funcional |
| GitHub Actions | validacao remota oficial | funcional |
| CircleCI | integracao externa sem config versionada | diagnostico apenas |

## Scripts Oficiais

- `scripts/bootstrap`: pre-checks e preparacao.
- `scripts/dev`: sobe e derruba stack local.
- `scripts/compose`: validacao de Compose e health helpers.
- `scripts/ci`: workflows locais por trilha.
- `scripts/smokes`: fluxo operacional ponta a ponta.
- `scripts/reports`: pacote agregado de evidencias.

## Gates Fonte De Verdade

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 e2e
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 docker
```

Fechamento operacional:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout
```

O runner operacional possui uma fixture CSV publica padrao para o fluxo de public link. Configure `SMOKE_PUBLIC_LINK_URL` somente quando o ambiente exigir uma fonte espelhada.

## CI Remoto

GitHub Actions contem os workflows oficiais:

- frontend;
- backend;
- docker;
- e2e-auth.

Falhas remotas devem ser investigadas pelo primeiro job/step quebrado. Checks externos, incluindo CircleCI caso aparecam, devem ser tratados como integracoes externas e nao como configuracao versionada deste repositorio.

## Politica De Falhas

Classifique toda falha antes de seguir:

- `implementation`: bug, contrato quebrado, teste deterministico vermelho, drift de docs ou configuracao incorreta.
- `environment`: Docker/WSL indisponivel, permissao local, rede externa bloqueada, credencial ausente ou limitacao do host.
- `external`: check remoto fora de GitHub Actions sem configuracao versionada no repo.

Uma falha de ambiente ou externa precisa de causa concreta, comando usado e caminho de reexecucao.

## Reports

- `scripts/ci/reports/`
- `scripts/smokes/reports/`
- `apps/web/reports/`
- `apps/web/e2e/reports/`
- `apps/api/test/reports/`
- `apps/worker/spec/reports/`
- `docs/reports/index.html`

Reports sao regeneraveis e nao devem virar deposito manual de evidencias soltas.

## Referencias

- [DevOps roadmap](devops-roadmap.md)
- [Testing baseline](../quality/testing-baseline.md)
- [Release/rollback checklist](release-rollback-checklist.md)
- [Setup](setup.md)
