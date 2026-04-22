# Checklist de Release e Rollback Pre-Cluster

## Objetivo

Padronizar o fechamento operacional do StreamGate no estagio atual do projeto: ambiente local/Compose, gates oficiais e rollback seguro sem depender de cluster ou automacao remota.

## Quando usar

Use este checklist em:

- fechamento de sprint com runtime alterado;
- PR grande que toca API, worker, web, contratos ou scripts operacionais;
- validacao antes de demonstracao relevante ou pacote de evidencias final.

## Release checklist

### 1. Sanidade de ambiente

- Confirmar `.env` sincronizado com `.env.example`.
- Confirmar envs criticas de Sprint 5 presentes:
  - email;
  - webhook;
  - artefatos;
  - idempotencia;
  - retenções;
  - credenciais de smoke.
- Confirmar Docker Desktop/WSL operacionais quando o gate for pesado.

### 2. Stack e health

- Validar `docker compose -f compose.yaml config`.
- Validar `docker compose -f compose.yaml --profile full config`.
- Subir stack necessaria com `scripts/dev/dev-up`.
- Confirmar servicos `healthy` antes de prosseguir.

### 3. Gates por perfil

- Rodar `fast` por trilha relevante com `scripts/ci/ci-local.ps1 <workflow>`.
- Rodar `operational` com `scripts/smokes/run-smokes.ps1` quando houver impacto em runtime, worker, artefatos, notificacoes ou operacao segura.
- Rodar `full-closeout` com `scripts/reports/run-all-reports.ps1 -Profile full-closeout` no fechamento relevante.

### 4. Evidencias obrigatorias

- Conferir `docs/reports/index.html`.
- Conferir `scripts/ci/reports/summary.json` quando `ci-local` entrar no fechamento.
- Conferir `scripts/smokes/reports/summary.json` quando o runtime entrar no fechamento.
- Registrar comandos, resultados e classificacao de falhas no closeout/roadmap.

### 5. Criterios para abortar release

Aborte o fechamento e trate a causa raiz se ocorrer qualquer um dos casos:

- smoke operacional falhar;
- Compose ficar `unhealthy`;
- drift entre contrato/OpenAPI e implementacao;
- falha sem classificacao clara entre `environment` e `implementation`;
- rollback previsto nao estiver claro antes da promocao.

## Rollback checklist

### App/Web/Worker

- Derrubar a stack atual com `scripts/dev/dev-down`.
- Restaurar o commit/tag anterior.
- Subir novamente com `scripts/dev/dev-up` no perfil necessario.
- Revalidar health e, no minimo, o gate `operational` se a falha tocou runtime.

### Migrations

- So executar rollback de migration quando houver plano explicito para dados e compatibilidade.
- Rodar rollback localmente antes de repetir subida da stack.
- Reexecutar os testes backend relevantes depois do rollback.

### Scripts e CI local

- Se a falha vier de runner/script, restaurar a versao anterior dos scripts.
- Revalidar o workflow minimo afetado (`frontend`, `backend`, `e2e` ou `docker`) antes de tentar o pacote completo novamente.

## Observacoes operacionais

- `ci-local all` continua disponivel, mas nao e obrigatorio em toda task pequena.
- O caminho pesado oficial e `WSL/Compose-first`.
- No Windows host, falhas de integracao Bash/WSL/sandbox devem ser registradas como falha de ambiente quando nao houver regressao funcional do projeto.
