# Baseline de Testes da Sprint 0

## Objetivo
Este guia consolida diretrizes de testing baseline sprint 0 para uso consistente no projeto.

## Estado atual
Conteudo alinhado ao fechamento da Sprint 3 e ao planejamento da Sprint 4; atualizar em cada mudanca relevante.


## Estado atual detalhado
Conteudo alinhado ao fechamento da Sprint 3 e ao planejamento da Sprint 4; atualizar em cada mudanca relevante.

## Regras/Contratos
- As regras normativas deste tema estao descritas nas secoes tecnicas abaixo.
- Mudancas devem manter alinhamento com roadmap, ADRs e READMEs.

## Validacao/Evidencias
- Validar coerencia com README raiz, docs/README e roadmap da release atual.
- Registrar atualizacoes desta pagina no closeout da sprint correspondente.


## Objetivo detalhado

Este documento fixa a base de planejamento e execucao de testes da Sprint 0. Ele existe para responder quatro perguntas de forma operacional:

- que tipo de teste o projeto reconhece oficialmente
- qual comando e fonte de verdade por stack
- qual cobertura minima esperamos por tipo de entrega
- quando uma falha pode ser aceita como exclusivamente de ambiente

A Sprint 0 nao existe para maximizar cobertura. Ela existe para tornar a validacao do projeto legivel, repetivel e auditavel.

## Matriz oficial de testes por camada

| Camada | Objetivo | Ferramenta/trilha atual | Status na Sprint 0 |
| --- | --- | --- | --- |
| Unitario | validar funcoes, helpers e regras locais | `vitest` no frontend, testes Ruby locais quando existirem | Parcial |
| Request | validar endpoint HTTP e contrato basico da API | `rails test` em `apps/api` | Parcial |
| Integracao | validar interacao entre camadas e servicos reais | `integration-testing` como metodo, compose e banco real quando aplicavel | Parcial |
| Contrato | validar compatibilidade entre contrato publico, OpenAPI e consumidores | `api-contract-testing` como trilha obrigatoria quando houver contrato real | Placeholder enquanto `packages/contracts` nao estiver materializado |
| E2E | validar fluxo completo do usuario | `playwright` como trilha obrigatoria para fluxos criticos futuros | Nao iniciado |
| Docker smoke | validar compose, health helpers e subida basica da stack | scripts em `scripts/compose` + `docker compose config` | Parcial, com evidencias reais |
| Seguranca | validar checks e scanners proporcionais ao escopo | `brakeman`, scanners futuros, revisao de seguranca | Parcial |

## Cobertura minima desejada por tipo de entrega

A cobertura minima da Sprint 0 e orientada por tipo de entrega, nao por percentual global artificial.

### Mudancas de documentacao

- documentacao alterada e referenciada nos hubs corretos
- nenhum teste novo obrigatorio, salvo quando a documentacao descrever um fluxo operacional que precise ser verificado

### Mudancas de frontend

- `lint` obrigatorio
- `vitest` obrigatorio para logica, guards, validacoes e comportamento interativo que ja tenha suite
- quando houver tela/fluxo critico novo, registrar necessidade futura de `playwright`

### Mudancas de API

- `rails test` obrigatorio no escopo alterado
- `db:prepare` deve continuar reproduzivel
- se houver endpoint novo ou alterado, OpenAPI deve ser atualizado no mesmo ciclo

### Mudancas de worker

- `rspec` obrigatorio
- qualquer dependencia de ambiente externo desnecessaria deve ser removida do caminho critico dos testes

### Mudancas de compose ou operacao

- `docker compose config` obrigatorio
- smoke/helper correspondente obrigatorio quando houver script oficial para isso
- falha de ambiente deve ser registrada com causa concreta

## Comandos fonte de verdade por stack

### Frontend

- `pnpm lint` em `apps/web`
- `pnpm test:run` em `apps/web`
- `pnpm build` em `apps/web`

### API

- `bundle exec rails db:prepare` em `apps/api`
- `bundle exec rails test` em `apps/api`
- `bundle exec rubocop` em `apps/api`
- `bundle exec brakeman -q` em `apps/api`

### Worker

- `bundle exec rspec` em `apps/worker`
- `bundle exec rubocop` em `apps/worker`

### Docker e Compose

- `docker compose -f compose.yaml config`
- `docker compose -f compose.yaml --profile full config`
- `./scripts/compose/compose-health-tests.sh`
- `powershell -ExecutionPolicy Bypass -File .\scripts\compose\compose-health.tests.ps1`
- `python scripts/compose/compose-smoke.py`

### CI local

- `./scripts/ci/ci-local.sh`
- `.\scripts\ci\ci-local.ps1`

## Criterio para aceitar falha causada exclusivamente por ambiente

Uma falha so pode ser tratada como exclusivamente de ambiente quando todos os pontos abaixo forem verdadeiros:

- existe comando oficial definido para o mesmo escopo
- a falha acontece antes da regra de negocio ser exercitada ou por limitacao externa ao codigo alterado
- a causa e concreta e reproduzivel, nao vaga
- a falha esta registrada com contexto suficiente para reexecucao futura
- o time sabe qual ambiente e o caminho recomendado para evitar essa falha

Exemplos validos na Sprint 0:

- `pnpm.ps1` bloqueado por politica de execucao do PowerShell
- `spawn EPERM` no ecossistema `Vite/Vitest` no Windows host atual
- falha de integracao Bash/WSL com `E_ACCESSDENIED` nesta sessao do agente

Exemplos invalidos:

- teste falhou e ninguem investigou
- comando nao rodou porque dependencias nao foram instaladas no fluxo oficial
- stack trace de aplicacao tratado genericamente como "problema do ambiente"

## Registro oficial do estado atual na Sprint 0

| Escopo | Comando | Resultado atual | Leitura |
| --- | --- | --- | --- |
| Frontend | `pnpm lint` | PASS | validacao estatica funciona no host atual |
| Frontend | `pnpm test:run` via PowerShell | FAIL | bloqueado por politica de execucao do `pnpm.ps1` |
| Frontend | `pnpm.cmd test:run` | FAIL | `spawn EPERM` ao carregar `vitest.config.ts` no Windows atual |
| Frontend | `pnpm.cmd build` | FAIL | `spawn EPERM` e binding nativo do Tailwind oxide no host atual |
| API | `bundle exec rails test` | Nao concluido nesta sessao | limitacao do sandbox do agente, sem evidenciar falha da app |
| Worker | `bundle exec rspec` | PASS | suite minima executa apos cleanup do gemspec |
| Compose | `docker compose -f compose.yaml config` | PASS com warning | definicao valida; warning externo do host Docker |
| Compose | `docker compose -f compose.yaml --profile full config` | PASS com warning | definicao full valida |
| Compose helpers | `powershell -ExecutionPolicy Bypass -File .\scripts\compose\compose-health.tests.ps1` | PASS | helper PowerShell validado |
| Compose helpers | `bash scripts/compose/compose-health-tests.sh` | FAIL | falha de ambiente nesta sessao (`E_ACCESSDENIED`) |

## Como usar esta baseline nas proximas sprints

- toda task deve declarar qual camada de teste ela impacta
- toda entrega deve executar os comandos fonte de verdade do seu escopo
- toda falha deve ser classificada entre `implementacao` e `ambiente`
- contract tests reais entram quando `packages/contracts` deixar de ser placeholder
- E2E real com `playwright` entra assim que os fluxos criticos deixarem de ser majoritariamente mock

## Referencias

- [Definition of Done](C:/estudos/StreamGate/docs/guides/quality/definition-of-done.md)
- [Baseline DevOps da Sprint 0](C:/estudos/StreamGate/docs/guides/platform/devops-baseline-sprint-0.md)
- [Roadmap mestre de sprints](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
