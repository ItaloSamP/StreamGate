# Roadmap DevOps

## Objetivo

Consolidar uma operacao local previsivel para o StreamGate, com gates claros, evidencias navegaveis e um caminho de evolucao seguro para CI remoto, release continuo e ambiente futuro de cluster.

## Estado atual

Estado alinhado ao fechamento da trilha DevOps de operacao segura (2026-04-21):

- scripts oficiais seguem organizados em `scripts/bootstrap`, `scripts/dev`, `scripts/compose`, `scripts/ci`, `scripts/smokes` e `scripts/reports`;
- a operacao segura adicionou env checks operacionais para email, webhook, idempotencia, download de artefatos e smoke seguro;
- `run-smokes` cobre operacao segura, artefatos finais, notificacoes e audit trail;
- repo readiness minimo foi fechado com `CODEOWNERS`, `dependabot.yml`, issue templates, PR template e `AGENTS.md`;
- o hub `docs/reports/index.html` continua sendo a leitura agregada oficial do workspace.

## Politica oficial de gates

### Ambiente recomendado

- caminho oficial para gates pesados: `WSL/Compose-first`;
- PowerShell/Windows host continua suportado para checks rapidos, suporte local e fallback operacional;
- falhas ligadas a permissao WSL, Docker Desktop ou integracao host/sandbox devem ser classificadas como `environment`, nao como regressao de implementacao.

### Perfis de execucao

#### `fast`

Use no dia a dia para validar uma trilha sem pagar o custo do pacote completo.

Comandos oficiais:

- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend`
- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend`
- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 e2e`
- `powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 docker`

Regras:

- prefira um workflow por vez;
- use `-SkipInstallSteps` quando o bootstrap ja estiver pronto e o objetivo for depurar etapa posterior;
- use `-ResumeFromStep "<workflow :: step>"` para retomar uma execucao interrompida sem recomecar do zero.

#### `operational`

Use quando a mudanca tocar runtime, worker, notificacoes, artefatos ou operacao mutavel.

Comandos oficiais:

- `powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1`
- `bash scripts/smokes/run-smokes.sh`

Cobertura minima esperada na operacao segura:

- autenticacao operacional;
- upload assinado;
- processamento real;
- artefatos finais;
- notificacoes emitidas;
- retry/resolve/replay controlados;
- audit trail consultavel.

#### `full-closeout`

Use no fechamento de ciclo de entrega, PR grande ou mudanca critica de runtime, CI, scripts ou contratos.

Comandos oficiais:

- `powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout`
- `PROFILE=full-closeout bash scripts/reports/run-all-reports.sh`

Regras:

- `run-all-reports` agora orquestra evidencias por perfil e nao reroda `ci-local all` em cascata;
- `ci-local all` continua disponivel, mas fica reservado para fechamento relevante ou diagnostico aprofundado de workflows locais;
- o pacote full so deve ser exigido em fechamento relevante, nao em toda task pequena.

## Papel de cada runner

### `scripts/ci/ci-local`

Responsavel por simular workflows locais com foco em feedback rapido por trilha.

Contratos atuais:

- gera `scripts/ci/reports/summary.json`, `report.html` e logs por step;
- registra duracao, status, classificacao (`environment`, `implementation`, `skip`) e ultima etapa concluida;
- suporta `skip` explicito de installs e retomada por step.

### `scripts/smokes/run-smokes`

Responsavel pelo runtime ponta a ponta.

Contratos atuais:

- sobe e derruba stack limpa;
- executa compose smoke, upload assinado, worker operacional e smoke seguro de operacao segura;
- gera summary/report HTML e snapshots de diagnostico quando ha falha.

### `scripts/reports/run-all-reports`

Responsavel por consolidar evidencias oficiais por perfil.

Contratos atuais:

- `fast`: frontend unit + backend API/worker;
- `operational`: smoke operacional;
- `full-closeout`: `fast` + integracao/E2E + smoke operacional;
- atualiza sempre o hub `docs/reports/index.html`.

## Repo readiness entregue na operacao segura

- `CODEOWNERS` com ownership minimo por app, contratos, docs, scripts e GitHub config;
- `dependabot.yml` para Actions, npm e Bundler;
- issue templates para bug, feature, docs, chore/ops e task;
- PR template alinhado aos perfis de gate;
- `AGENTS.md` raiz com mapa do repo, comandos oficiais e politica operacional.

## Evidencias de operacao segura

Evidencias minimas esperadas para considerar a trilha DevOps concluida:

- `scripts/smokes/run-smokes.ps1`: PASS cobrindo safe operations, artefatos, notificacoes e audit trail;
- `scripts/ci/ci-local.ps1` nos workflows relevantes, sem duplicacao desnecessaria;
- `scripts/reports/run-all-reports.ps1 -Profile full-closeout`: PASS como orquestrador final de evidencias;
- `docs/reports/index.html` regenerado com status e links atualizados.

## Release e rollback pre-cluster

O checklist oficial de release/rollback desta fase esta em [docs/guides/platform/release-rollback-checklist.md](C:/estudos/StreamGate/docs/guides/platform/release-rollback-checklist.md).

Resumo operacional:

- validar env e Compose antes de qualquer fechamento;
- nao promover release local sem smoke operacional verde;
- rollback de app/worker/migration deve ser decidido antes da execucao, nunca improvisado durante falha;
- qualquer falha de gate pesado precisa ser classificada como `environment` ou `implementation` antes de seguir.

## Referencias

- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/)
- [Setup da plataforma](C:/estudos/StreamGate/docs/guides/platform/setup.md)
- [Runbook do worker](C:/estudos/StreamGate/docs/guides/operations/worker-runtime-runbook.md)
- [Hub de reports](C:/estudos/StreamGate/docs/reports/index.html)
