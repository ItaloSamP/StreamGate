# Scripts do StreamGate

A raiz de `scripts/` agora fica apenas com a documentacao e as subpastas organizadas.

## Estrutura

- `bootstrap/`: verificacoes iniciais do ambiente
- `dev/`: subida e parada do ambiente local
- `ci/`: simulacao local dos workflows do GitHub Actions
- `compose/`: helpers, testes de health check e smoke test do Compose

## Comandos principais

### WSL/Linux

- `./scripts/bootstrap/check-prereqs.sh`
- `./scripts/dev/dev-up.sh`
- `./scripts/dev/dev-up.sh full`
- `./scripts/dev/dev-down.sh`
- `./scripts/compose/compose-health-tests.sh`
- `./scripts/ci/ci-local.sh`

### PowerShell

- `.\scripts\bootstrap\check-prereqs.ps1`
- `.\scripts\dev\dev-up.ps1`
- `.\scripts\dev\dev-up.ps1 -Mode full`
- `.\scripts\dev\dev-down.ps1`
- `.\scripts\compose\compose-health.tests.ps1`
- `.\scripts\ci\ci-local.ps1`
