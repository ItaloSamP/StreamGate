# Scripts do StreamGate

A raiz de `scripts/` agora fica apenas com a documentacao e as subpastas organizadas.

## Estrutura

- `bootstrap/`: verificacoes iniciais do ambiente
- `dev/`: subida e parada do ambiente local
- `ci/`: simulacao local dos workflows do GitHub Actions
- `compose/`: helpers e testes de health check do Compose
- `reports/`: runner unico e gerador do hub local de reports/coverage
- `smokes/`: smokes operacionais e runner unico para `infra`, `app` e `full`

## Comandos principais

### WSL/Linux

- `./scripts/bootstrap/check-prereqs.sh`
- `./scripts/dev/dev-up.sh`
- `./scripts/dev/dev-up.sh full`
- `./scripts/dev/dev-down.sh`
- `./scripts/compose/compose-health-tests.sh`
- `./scripts/reports/run-all-reports.sh`
- `./scripts/smokes/run-smokes.sh`
- `./scripts/ci/ci-local.sh`

### PowerShell

- `.\scripts\bootstrap\check-prereqs.ps1`
- `.\scripts\dev\dev-up.ps1`
- `.\scripts\dev\dev-up.ps1 -Mode full`
- `.\scripts\dev\dev-down.ps1`
- `.\scripts\compose\compose-health.tests.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1`
- `.\scripts\ci\ci-local.ps1`

## Reports locais

O fluxo oficial para gerar todas as evidencias locais em uma unica passada e:

```bash
bash scripts/reports/run-all-reports.sh
```

No PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1
```

Esse runner executa frontend unit/integration/E2E, backend API/worker com SimpleCov, smokes operacionais e atualiza o hub `docs/reports/index.html`.
Os reports sao sobrescritos a cada execucao e ficam fora do Git; apenas `.gitkeep` mantem a estrutura de pastas.

Antes de subir ambientes Docker, os scripts oficiais passam pelo `scripts/dev/dev-up`, que verifica imagens externas ausentes e fingerprints de build. Se voce apagou imagens/volumes do Docker, o fluxo oficial tenta puxar infra e rebuildar API/Web/Worker seletivamente antes do `compose up`.
