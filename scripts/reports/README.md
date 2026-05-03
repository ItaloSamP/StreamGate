# Reports e Coverage Locais

## Objetivo

Esta pasta concentra a automacao de reports locais do StreamGate. A proposta e transformar uma execucao de testes em um pacote de evidencias navegavel, com logs, HTML, summaries em JSON e coverage por camada.

O comando principal para fechamento pesado e:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout
```

Em ambientes Bash/WSL/Linux:

```bash
PROFILE=full-closeout bash scripts/reports/run-all-reports.sh
```

## Quando usar

Use o `run-all-reports` como gate `full-closeout`: fechamento de ciclo de entrega, PR grande, alteracao critica de runtime/CI ou quando voce precisar regenerar o hub oficial de evidencias sem rerodar `ci-local all` em cascata.

Para o dia a dia:

- `fast`: rode `scripts/ci/ci-local.(ps1|sh)` por workflow.
- `operational`: rode `scripts/smokes/run-smokes.(ps1|sh)` quando a trilha tocar runtime.
- `full-closeout`: rode `run-all-reports` quando precisar do pacote final.

## O que o run-all faz

O runner agora trabalha por perfil:

1. `fast`
   - frontend unit com coverage;
   - infra para backend;
   - `rails test`;
   - `rspec`;
   - atualizacao do hub.
2. `operational`
   - smoke operacional completo de operacao segura;
   - atualizacao do hub.
3. `full-closeout`
   - tudo de `fast`;
   - integracao do frontend;
   - Playwright E2E;
   - smokes operacionais;
   - atualizacao do hub.

`ci-local all` continua existindo, mas roda separado quando voce quiser fechar ou diagnosticar os workflows locais sem duplicar esse trabalho dentro do `run-all-reports`.

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
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout -TimeoutSeconds 480
```

- `TimeoutSeconds`: tempo maximo usado pelas subidas de ambiente via `scripts/dev/dev-up.ps1`.
- `Profile`: `fast`, `operational` ou `full-closeout`.
- Valor padrao: `480`.
- Faixa aceita: `30` a `3600`.

### `run-all-reports.sh`

Equivalente Bash do runner completo. Usa `TIMEOUT_SECONDS` como variavel opcional.

```bash
PROFILE=full-closeout TIMEOUT_SECONDS=480 bash scripts/reports/run-all-reports.sh
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
- O caminho pesado oficial para os perfis `operational` e `full-closeout` e `WSL/Compose-first`.

## Troubleshooting rapido

Se o `run-all` falhar:

1. Abra `docs/reports/index.html`.
2. Identifique o card com status `FAIL`.
3. Abra o `report.html` ou log da camada correspondente.
4. Corrija a causa raiz.
5. Rode novamente o `run-all` para sobrescrever os reports com o estado atual.

Se a falha envolver Docker, confira tambem os reports de smokes e CI local, pois eles preservam logs recentes de servicos como `api`, `web`, `worker`, `rabbitmq` e `minio`.

Se voce limpou imagens/volumes do Docker Desktop, rode o mesmo comando normalmente. O `run-all` usa `scripts/dev/dev-up`, que agora:

- verifica imagens externas de infraestrutura (`postgres`, `redis`, `rabbitmq`, `minio`, `minio-init`, `clickhouse`);
- executa `docker compose pull` quando alguma delas estiver ausente;
- verifica fingerprints de build para `api`, `web` e `worker`;
- executa rebuild seletivo quando a imagem local nao existe ou quando arquivos Docker/dependencias mudaram.

Se mesmo assim aparecer `500 Internal Server Error` na API do Docker Engine, reinicie o Docker Desktop antes de repetir o runner. Esse erro acontece antes do Compose conseguir puxar/buildar imagens e deve ser classificado como falha ambiental do host.
