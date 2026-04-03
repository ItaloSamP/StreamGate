# Baseline DevOps da Sprint 0

## Objetivo

Este documento registra o estado operacional real do projeto ao fim da trilha DevOps da Sprint 0. Ele existe para separar:

- o que ja funciona
- o que falha por ambiente
- o que falhava por implementacao e ja foi corrigido
- qual ambiente deve ser tratado como caminho principal de desenvolvimento

## Recomendacao oficial de ambiente

O StreamGate deve ser tratado como `WSL-first` no Windows.

### Ambientes suportados

| Ambiente | Papel | Status atual | Leitura pratica |
| --- | --- | --- | --- |
| `WSL2 + Ubuntu` | ambiente principal de desenvolvimento | Recomendado | deve ser o fluxo padrao para scripts `.sh`, Node/Vite/Vitest e Compose |
| `Windows host + PowerShell` | fallback local | Parcial | util para comandos pontuais, mas nao e o fluxo principal |
| `Docker infra` | dependencias locais | Funcional | `compose config` valida e os helpers de health check estao consistentes |
| `Docker full` | stack completa de desenvolvimento | Parcial | definicao valida, mas ainda depende do runtime real do worker para representar o produto completo |
| `GitHub Actions` | validacao remota oficial | Parcial | workflows existem, mas ainda refletem um produto em fundacao |

## Classificacao formal das falhas conhecidas

### Vitest no Windows atual

Classificacao:

- `ambiente`: o fluxo via `pnpm` em PowerShell falha por politica de execucao do `pnpm.ps1`
- `permissao`: o Windows atual bloqueia a execucao do script shim do `pnpm` sem bypass explicito
- `compatibilidade de runner`: mesmo contornando o shim com `pnpm.cmd`, o ecossistema `Vite/Vitest` falha com `spawn EPERM` ao carregar a configuracao

Evidencia observada nesta sessao:

- `pnpm test:run` em `apps/web`: falha com `PSSecurityException` porque `pnpm.ps1` nao esta assinado digitalmente
- `pnpm.cmd test:run` em `apps/web`: falha com `spawn EPERM` em `externalize-deps` ao carregar `vitest.config.ts`
- `pnpm.cmd build` em `apps/web`: falha com `spawn EPERM` e tambem com carga nativa do `@tailwindcss/oxide-win32-x64-msvc`
- `pnpm.cmd lint` em `apps/web`: passa, o que mostra que o problema nao e uma falha geral do frontend

Conclusao operacional:

- a falha do Vitest no Windows atual nao deve ser tratada como bug isolado de teste
- ela faz parte de uma trilha Windows puro parcial para o stack `pnpm + Vite + Vitest + bindings nativos`
- o fluxo correto do projeto continua sendo `WSL-first`

### Worker e `git ls-files` no gemspec

Classificacao:

- `implementacao`: o `worker.gemspec` dependia de `git ls-files` para descobrir arquivos da gem
- `compatibilidade de ambiente`: no Windows atual essa execucao podia falhar com erro de permissao ao chamar `git`

Estado atual:

- a causa raiz foi corrigida
- o `worker.gemspec` agora usa descoberta local de arquivos e nao depende mais de `git ls-files`

Evidencia observada nesta sessao:

- `bundle exec rspec` em `apps/worker`: `PASS`

Conclusao operacional:

- este problema deixou de ser um bloqueador tecnico do worker na Sprint 0
- a falha original era de implementacao com impacto ampliado no ambiente Windows atual

## Registro de checks por escopo

| Escopo | Comando | Resultado | Classificacao |
| --- | --- | --- | --- |
| Frontend | `pnpm test:run` | FAIL | ambiente/permissao no PowerShell (`pnpm.ps1` bloqueado) |
| Frontend | `pnpm.cmd test:run` | FAIL | compatibilidade de runner no Windows (`spawn EPERM`) |
| Frontend | `pnpm.cmd lint` | PASS | sem bloqueio relevante no ambiente atual |
| Frontend | `pnpm.cmd build` | FAIL | compatibilidade no Windows (`spawn EPERM` + binding nativo do Tailwind oxide) |
| Worker | `bundle exec rspec` | PASS | implementacao corrigida para o ambiente atual |
| Docker | `docker compose -f compose.yaml config` | PASS com warning | compose valido; warning externo de acesso ao `docker config.json` do host |
| Docker | `docker compose -f compose.yaml --profile full config` | PASS com warning | definicao full valida; mesmo warning externo do host |
| Compose helpers | `powershell -ExecutionPolicy Bypass -File .\scripts\compose\compose-health.tests.ps1` | PASS | fallback PowerShell funcional |
| Compose helpers | `bash scripts/compose/compose-health-tests.sh` | FAIL | ambiente/permite integracao Bash-WSL indisponivel nesta sessao (`E_ACCESSDENIED`) |
| API | `bundle exec rails test` | NA nesta sessao | nao executado por limitacao do sandbox da sessao Windows do agente |
| API | `bundle exec rubocop` | NA nesta sessao | nao executado por limitacao do sandbox da sessao Windows do agente |

## Leitura pratica dos resultados

### O que ja esta confiavel

- `worker` apos a correcao do gemspec
- validacao estatica do compose
- helpers PowerShell de compose-health
- lint do frontend

### O que continua parcial no Windows host

- execucao de `pnpm` via PowerShell sem bypass
- stack `Vite/Vitest` no Windows atual
- build frontend com binding nativo do Tailwind oxide neste host
- execucao de helpers Bash/WSL a partir desta sessao especifica

### O que o time deve fazer daqui para frente

- tratar `WSL2 + Ubuntu` como ambiente principal para desenvolvimento diario
- usar `PowerShell` apenas como fallback operacional, nao como referencia de compatibilidade da stack frontend
- considerar falhas de `spawn EPERM` no Windows host como falhas de ambiente ate prova em contrario
- manter os checks do worker sem dependencia de `git` ou de processos externos desnecessarios

## Comandos fonte de verdade

Para a Sprint 0, estes continuam sendo os comandos oficiais de referencia:

- `pnpm lint` em `apps/web`
- `pnpm test:run` em `apps/web`
- `pnpm build` em `apps/web`
- `bundle exec rails test` em `apps/api`
- `bundle exec rspec` em `apps/worker`
- `docker compose -f compose.yaml config`
- `docker compose -f compose.yaml --profile full config`
- `./scripts/compose/compose-health-tests.sh`
- `powershell -ExecutionPolicy Bypass -File .\scripts\compose\compose-health.tests.ps1`

A diferenca agora e que o projeto passa a registrar explicitamente quando um comando falha por ambiente, em vez de atribuir automaticamente a falha ao codigo do produto.

