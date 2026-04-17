# Reports e Coverage Locais

## Objetivo

Esta pasta concentra a automacao de reports locais do StreamGate. A proposta e transformar uma execucao de testes em um pacote de evidencias navegavel, com logs, HTML, summaries em JSON e coverage por camada.

O comando principal e:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1
```

Em ambientes Bash/WSL/Linux:

```bash
bash scripts/reports/run-all-reports.sh
```

## Quando usar

Use o `run-all-reports` antes de fechar uma entrega relevante, antes de commits grandes, antes de pushs que mexem em runtime, CI, testes, Docker ou contrato entre frontend/backend.

Ele tambem e o melhor ponto de partida quando um teste falha e voce precisa de um rastro persistente para investigar depois.

## O que o run-all faz

O runner executa, em ordem fail-fast:

1. Testes unitarios do frontend com Vitest e coverage HTML.
2. Subida da infra local via Docker Compose.
3. Preparacao do banco de teste da API.
4. Testes Rails/Minitest da API com SimpleCov.
5. Specs RSpec do worker com SimpleCov.
6. Subida do perfil `app` para testes integrados.
7. Seed de credenciais operacionais sem imprimir segredos.
8. Testes de integracao do frontend contra backend real.
9. E2E Playwright contra a aplicacao local.
10. Smokes operacionais, incluindo upload assinado e worker real.
11. CI local completo (`frontend-ci`, `backend-ci`, `e2e-auth`, `docker-ci`).
12. Atualizacao do hub visual em `docs/reports/index.html`.

Se qualquer etapa falhar, o runner interrompe a execucao imediatamente, atualiza o indice de reports com o que ja foi gerado e retorna exit code diferente de zero.

## Outputs gerados

Os reports sao sobrescritos a cada nova execucao para evitar acumulo de lixo local.

| Camada | Saida |
| --- | --- |
| Frontend unit/integration | `apps/web/reports/` |
| Frontend E2E | `apps/web/e2e/reports/` |
| API Rails/Minitest | `apps/api/test/reports/` |
| Worker RSpec | `apps/worker/spec/reports/` |
| Smokes operacionais | `scripts/smokes/reports/` |
| CI local | `scripts/ci/reports/` |
| Hub agregado | `docs/reports/index.html` |

Cada runner gera, quando aplicavel:

- `summary.json`: estado estruturado da execucao.
- `report.html`: leitura humana do resultado.
- `stdout.log`, `stderr.log` ou logs por etapa.
- `coverage/index.html`: coverage HTML para suites com cobertura de codigo.

## Scripts da pasta

### `run-all-reports.ps1`

Runner oficial para Windows/PowerShell. Ele gerencia variaveis de ambiente, sobe e derruba a stack Docker quando necessario, executa as suites em ordem e atualiza o hub global.

Parametros:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -TimeoutSeconds 480
```

- `TimeoutSeconds`: tempo maximo usado pelas subidas de ambiente via `scripts/dev/dev-up.ps1`.
- Valor padrao: `480`.
- Faixa aceita: `30` a `3600`.

### `run-all-reports.sh`

Equivalente Bash do runner completo. Usa `TIMEOUT_SECONDS` como variavel opcional.

```bash
TIMEOUT_SECONDS=480 bash scripts/reports/run-all-reports.sh
```

### `run-command.mjs`

Wrapper generico para transformar qualquer comando em um report local.

Exemplo:

```bash
node scripts/reports/run-command.mjs \
  --name "API Rails tests" \
  --out apps/api/test/reports \
  --cwd apps/api \
  --coverage apps/api/test/reports/coverage/index.html \
  --env STREAMGATE_REPORTS=1 \
  -- bundle exec rails test
```

Ele captura:

- comando executado;
- diretorio de trabalho;
- exit code;
- duracao;
- stdout/stderr;
- artifacts HTML/coverage informados por parametro.

### `generate-index.mjs`

Atualiza o hub agregado em `docs/reports/index.html` a partir dos summaries disponiveis. Pode ser usado isoladamente quando os reports ja existem.

```bash
node scripts/reports/generate-index.mjs
```

## Variaveis relevantes

O runner le valores do ambiente atual e, se ausentes, consulta `.env` quando aplicavel.

| Variavel | Uso |
| --- | --- |
| `SEED_OPERATOR_PASSWORD` | Login dos testes integrados, E2E e smokes. |
| `SEED_ADMIN_PASSWORD` | Seed admin; por padrao acompanha a senha do operador se nao for informada. |
| `AUTH_INTEGRATION_BASE_URL` | Base URL dos testes de integracao do frontend. |
| `E2E_BASE_URL` | Base URL usada pelo Playwright. |
| `POSTGRES_HOST`/`POSTGRES_PORT` | Conexao local para testes Rails. |
| `POSTGRES_DB`/`POSTGRES_TEST_DB` | Bancos de desenvolvimento e teste usados pela API. |
| `POSTGRES_USER`/`POSTGRES_PASSWORD` | Credenciais locais do Postgres. |

O runner nao deve imprimir segredos nos logs. Quando precisa passar senha para containers, usa variaveis de ambiente em vez de interpolar valores sensiveis no texto do comando.

## Regras de manutencao

- Reports gerados ficam fora do Git.
- Apenas `.gitkeep` deve ser versionado nas pastas de reports.
- Qualquer nova suite oficial deve gerar `summary.json` e, quando possivel, `report.html`.
- Mudancas em testes, smokes ou CI devem manter o hub `docs/reports/index.html` funcionando.
- O comportamento esperado do `run-all` e fail-fast: primeira falha interrompe as proximas etapas.

## Troubleshooting rapido

Se o `run-all` falhar:

1. Abra `docs/reports/index.html`.
2. Identifique o card com status `FAIL`.
3. Abra o `report.html` ou log da camada correspondente.
4. Corrija a causa raiz.
5. Rode novamente o `run-all` para sobrescrever os reports com o estado atual.

Se a falha envolver Docker, confira tambem os reports de smokes e CI local, pois eles preservam logs recentes de servicos como `api`, `web`, `worker`, `rabbitmq` e `minio`.
