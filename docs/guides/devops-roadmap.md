# Roadmap DevOps

## Objetivo

Consolidar uma base operacional previsivel para o StreamGate, com foco em:

- reproducibilidade local e em CI;
- separacao clara entre falha de ambiente e falha de implementacao;
- evolucao segura para observabilidade, release continuo e cluster.

A baseline operacional da Sprint 0 continua registrada em [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md).

## Estado consolidado ate a Sprint 2 (2026-04-06)

### O que ja esta fechado na trilha DevOps

- [x] scripts oficiais consolidados em `scripts/bootstrap`, `scripts/dev`, `scripts/ci` e `scripts/compose`.
- [x] matriz de ambiente formalizada com recomendacao `WSL-first`.
- [x] falha de `vitest` no Windows classificada como limitacao de ambiente local.
- [x] falha antiga do worker por `git ls-files` tratada no gemspec.
- [x] `compose.yaml` com perfis `infra` e `full`, health checks e validacao de config.
- [x] workflows separados (`frontend-ci`, `backend-ci`, `docker-ci`) e alinhados ao estado real do projeto.

### Fechamento especifico da Sprint 2 (DevOps)

Skills aplicadas nesta trilha: `docker`, `github-actions-expert`, `generate-github-workflow`, `monitoring-observability`.

- [x] adicionar envs e segredos de auth em `.env.example`, compose e CI;
- [x] criar seeds minimas de auth para desenvolvimento e CI;
- [x] ajustar CI para cobrir auth real (incluindo idempotencia de seed e fluxo auth);
- [x] configurar envs de CORS/CSRF/cookies conforme estrategia de sessao da v1;
- [x] garantir seeds e fixtures de auth reproduziveis em ambiente local e CI.

## Planejamento da trilha DevOps na Sprint 2

### Escopo que precisava ser resolvido

- evitar drift entre frontend, API, scripts e compose na camada de env;
- evitar falso verde em CI sem cobrir auth real;
- garantir bootstrap em banco limpo com `db:prepare` + `db:seed` sem ajuste manual;
- manter fallback PowerShell funcional sem quebrar o fluxo recomendado em WSL.

### Contratos operacionais definidos

- envs oficiais de auth/sessao: `AUTH_*`;
- envs oficiais de CORS: `API_CORS_*`;
- env de integracao frontend->API: `VITE_API_BASE_URL`;
- segredos de seed para auth local/CI: `SEED_OPERATOR_PASSWORD` e `SEED_ADMIN_PASSWORD`.

## Execucao materializada na Sprint 2

### 1) Configuracao de ambiente e compose

- `.env.example` recebeu variaveis de auth, CORS e seed usadas na trilha;
- `compose.yaml` recebeu defaults para envs de auth/CORS/frontend para reduzir quebra quando `.env` local estiver desatualizado;
- API e web passaram a receber explicitamente as variaveis criticas no profile `full`.

### 2) Runtime da API para auth e CORS

- `apps/api/config/initializers/auth_runtime.rb` centraliza leitura de env de sessao/auth;
- `apps/api/config/initializers/cors.rb` foi materializado com politica configuravel por env;
- `rack-cors` foi adicionado ao `Gemfile` da API.

### 3) Seeds e fixtures reproduziveis

- `apps/api/db/seeds.rb` foi ajustado para idempotencia;
- fixtures de sessao foram adicionadas em `apps/api/test/fixtures/auth_sessions.yml`;
- teste de reproducibilidade de seed/fixture foi adicionado em `apps/api/test/models/auth_seed_fixture_test.rb`.

### 4) CI remoto e CI local

- `.github/workflows/backend-ci.yml` cobre envs de auth/CORS, idempotencia de seed e testes de fluxo auth;
- `.github/workflows/frontend-ci.yml` agora roda `pnpm test:run` alem de lint/build;
- `scripts/ci/ci-local.ps1` e `scripts/ci/ci-local.sh` foram alinhados ao mesmo contrato de execucao.

### 5) Documentacao operacional

- `docs/guides/setup.md` foi atualizado com mapa oficial de servicos/variaveis da Sprint 2;
- o roadmap mestre reflete a trilha DevOps da Sprint 2 como concluida.

## Evidencias operacionais da trilha

Comandos de referencia para validar essa trilha:

- `docker compose -f compose.yaml config`
- `docker compose -f compose.yaml --profile full config`
- `powershell -ExecutionPolicy Bypass -File .\scripts\compose\compose-health.tests.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 -Workflow backend`

Leitura pratica da ultima validacao executada em 2026-04-06:

- `docker compose -f compose.yaml config`: PASS (com warning de acesso ao `C:\Users\italo\.docker\config.json` no host, sem impacto no resultado);
- `docker compose -f compose.yaml --profile full config`: PASS (mesmo warning de host);
- `powershell -ExecutionPolicy Bypass -File .\scripts\compose\compose-health.tests.ps1`: PASS;
- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 -Workflow backend`: PASS apos executar com permissao de Docker habilitada na sessao.

Observacao operacional:

- avisos de `VIPS-WARNING` sobre modulos opcionais (`heif`, `jxl`, `magick`, `openslide`, `poppler`) apareceram na execucao de testes Ruby no Windows, mas nao bloquearam `db:prepare`, testes, RuboCop nem Brakeman.
- qualquer falha restante de frontend `vitest` no host Windows continua classificada como limitacao de ambiente local, nao como bloqueador da trilha DevOps ja entregue.

## Fora de escopo desta trilha

No fechamento final da Sprint 2 (2026-04-07), as trilhas relacionadas que estavam fora de escopo direto de DevOps tambem foram concluidas no roadmap mestre:

- Documentation finalizada com setup, guia de auth, ADR e closeout da sprint;
- Test planning/execution finalizada com gate `e2e-auth`;
- Security finalizada com hardening inicial de auth, throttle e logs.

## Proximas fases apos Sprint 2

### Fase 3: observabilidade

Entregas esperadas:

- health endpoints e sinais de prontidao por servico;
- metricas RED/USE por camada;
- rastreabilidade por `trace_id`/`request_id`/`job_id` no fluxo real.

### Fase 4: entrega continua

Entregas esperadas:

- build e publish de imagens com politica de tag;
- segredos por ambiente com governanca minima;
- fluxo de rollback simples e reproduzivel.

### Fase 5: preparacao para Kubernetes

Entregas esperadas:

- manifests/Helm por servico;
- readiness e liveness probes alinhados ao runtime real;
- estrategia de GitOps para reconciliacao de ambiente.



## Sprint 2.5 - Gate de prontidao (registro)

- envs oficiais de upload adicionados em .env.example, compose.yaml e CI para evitar drift antes da Sprint 3;
- trilha de upload assinado continua sem execucao funcional nesta sprint;
- foco mantido em preparacao operacional e governanca de transicao.
