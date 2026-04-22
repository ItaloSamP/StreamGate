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
- `powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout`
- `powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1`
- `.\scripts\ci\ci-local.ps1`

## Perfis oficiais de gate

- `fast`: validacao rapida por trilha com `scripts/ci/ci-local.(ps1|sh)` em um workflow por vez.
- `operational`: validacao ponta a ponta de runtime com `scripts/smokes/run-smokes.(ps1|sh)`.
- `full-closeout`: pacote final de evidencias com `scripts/reports/run-all-reports.(ps1|sh)`; use no fechamento de sprint, PR grande ou mudanca critica de runtime/CI.

O caminho pesado oficial e `WSL/Compose-first`. No host Windows, prefira checks rapidos no dia a dia e deixe o pacote pesado para fechamento relevante.

## Reports locais

O fluxo oficial para gerar as evidencias de fechamento e:

```bash
PROFILE=full-closeout bash scripts/reports/run-all-reports.sh
```

No PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout
```

Esse runner atua como orquestrador das evidencias oficiais por perfil e atualiza o hub `docs/reports/index.html`.
Os reports sao sobrescritos a cada execucao e ficam fora do Git; apenas `.gitkeep` mantem a estrutura de pastas.

Antes de subir ambientes Docker, os scripts oficiais passam pelo `scripts/dev/dev-up`, que verifica imagens externas ausentes e fingerprints de build. Se voce apagou imagens/volumes do Docker, o fluxo oficial tenta puxar infra e rebuildar API/Web/Worker seletivamente antes do `compose up`.
