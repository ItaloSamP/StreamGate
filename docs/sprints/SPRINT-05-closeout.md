# Sprint 5 Closeout

## Resultado

Sprint 5 foi fechada no escopo funcional previsto: operacao segura mutavel, artefatos finais, notificacoes, readiness do repositorio, matriz de testes reforcada e fechamento documental/security do estado entregue.

O unico ponto que permaneceu sensivel no host Windows foi o runner Compose agregado (`run-smokes.ps1` / `run-all-reports.ps1 -Profile full-closeout`) por combinacao de healthcheck do Docker Desktop, stale PID do Rails e conectividade host->container. Os blocos funcionais do smoke expandido foram validados diretamente apos os fixes aplicados, e a classificacao final desse residual ficou como `environment`, nao `implementation`.

## Entregas fechadas por trilha

- Back planning/execution: contratos, RBAC, idempotencia, mutacoes operacionais, auditoria, artefatos e notificacoes.
- Worker execution: artefatos finais reais, idempotencia por `event_id`, notificacoes operacionais e falhas nao bloqueantes.
- Front planning/execution: sino na topbar, inbox, regras/canais, wizard admin-only e historico de artefatos.
- DevOps: repo readiness, perfis `fast / operational / full-closeout`, checks de env, smokes e hub de reports.
- Security/documentation: threat model, baseline, vision, closeout e roadmap sincronizados com o estado real da Sprint 5.

## Evidencias principais

### Backend e worker

- `bundle exec rails test`
  - PASS
  - cobertura: `86.67%` linhas (`1561/1801`) e `59.96%` branches (`295/492`).
- `bundle exec rspec`
  - PASS
  - cobertura: `83.17%` linhas (`336/404`) e `48.24%` branches (`41/85`).
- `ruby scripts/ci/validate-operational-contracts.rb`
  - PASS

### Frontend

- `pnpm test:run`
  - PASS
  - `60` testes
  - cobertura: `66.08%` linhas, `63.05%` statements, `53.97%` branches, `68.98%` functions.
- `pnpm test:integration`
  - PASS
  - `4` testes
  - cobertura focada na fronteira HTTP/adapter: `36.36%` linhas, `35.44%` statements, `43.10%` branches, `46.03%` functions.
- `pnpm exec playwright test e2e/operational-flow.spec.ts --project=chromium`
  - PASS
  - fluxo Sprint 5 cobrindo `/notifications` e `/operations`.

### Smokes Sprint 5 expandidos

Validacoes diretas contra a stack Compose local apos os ajustes de startup/rede:

- `python scripts/smokes/upload-signed-smoke.py`
  - PASS
  - login, signed-url, upload, register e listagens.
- `python scripts/smokes/worker-operational-smoke.py`
  - PASS
  - job concluido, job com quarentena e delta de analytics.
- `python scripts/smokes/safe-operations-smoke.py`
  - PASS
  - artefatos, signed download-url, notificacoes, retry, resolve, replay e audit trail via API.
- `powershell -ExecutionPolicy Bypass -File scripts/smokes/verify-safe-operations-records.ps1`
  - PASS
  - notificacoes persistidas, deliveries `email/webhook` e auditoria persistida no backend.

### Repo readiness / docs

- `CODEOWNERS`, `dependabot.yml`, issue templates, PR template e `AGENTS.md` entregues.
- `docs/guides/security/streamgate-threat-model.md` e `docs/guides/security/security-baseline-sprint-0.md` sincronizados com Sprint 5.
- `docs/product/vision.md`, `docs/planning/streamgate-full-sprints-roadmap.md` e este closeout atualizados.

## Leitura de cobertura

- Front unit subiu onde o risco da sprint realmente estava: inbox, operations wizard, artifacts history e adapter oficial.
- Front integration continua com cobertura global menor porque o recorte e propositalmente concentrado no adapter/backend real; o risco Sprint 5 foi coberto melhor do que o percentual absoluto sugere.
- API ja estava alta e ganhou densidade nos cenarios de idempotencia, ownership, negativas e auditoria.
- Worker subiu no que mais importava para a sprint: artefatos, replay controlado, falha nao bloqueante e notificacoes.
- E2E saiu do auth-only e ganhou um fluxo feliz Sprint 5 real.

## Riscos aceitos

- O aggregate runner Compose local continua mais fragil no Windows host do que em execucoes step-by-step; a politica oficial permanece `WSL/Compose-first` para gates pesados.
- O smoke expandido foi validado por passos diretos e pelo runner oficial anterior, mas o rerun agregado no Windows ainda pode sofrer flake de healthcheck/networking do Docker Desktop.
- Conectores `google_drive`, `s3`, `http_url` e `oauth_delegated` continuam discovery-only e seguem fora da entrega funcional.

## O que ficou para Sprint 6+

- endurecer ainda mais o runner agregado no host Windows, sem depender de comportamento variavel do Docker Desktop;
- expandir E2E para fluxo completo de artefato baixavel pela UI, se o custo/estabilidade local continuar aceitavel;
- manter a estrategia de cobertura por risco em vez de perseguir numero global sem retorno operacional.
