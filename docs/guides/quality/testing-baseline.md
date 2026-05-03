# Baseline De Testes E Evidencias

Este guia define os gates oficiais do StreamGate e como interpretar resultados locais, remotos e operacionais.

## Politica Geral

- Escolha o gate pelo risco da mudanca.
- Execute comandos diretos para feedback rapido.
- Use `ci-local` para validar uma trilha completa.
- Use `run-smokes` quando runtime, worker, artefatos, notificacoes, conectores ou operacao segura forem impactados.
- Use `run-all-reports -Profile full-closeout` para fechamento relevante, PR grande ou release.
- Classifique falhas como `implementation` ou `environment` com evidencia concreta.

## Matriz De Gates

| Escopo | Comando principal | Quando usar |
| --- | --- | --- |
| Frontend unitario | `cd apps/web && pnpm test:run` | adapters, componentes, paginas e estado local |
| Frontend integracao | `cd apps/web && pnpm test:integration` | contrato frontend contra API local |
| Frontend build | `cd apps/web && pnpm build` | TypeScript e bundle de producao |
| API | `cd apps/api && bundle exec rails test` | endpoints, models, policies e services |
| Worker | `cd apps/worker && bundle exec rspec` | parsers, runtime, conectores e processamento |
| Contratos | `ruby scripts/ci/validate-operational-contracts.rb` | OpenAPI, schemas e exemplos |
| CI local frontend | `scripts/ci/ci-local.ps1 frontend` | trilha web completa |
| CI local backend | `scripts/ci/ci-local.ps1 backend` | API, worker, rubocop e seguranca Ruby |
| CI local e2e | `scripts/ci/ci-local.ps1 e2e` | auth/integracao e Playwright |
| CI local docker | `scripts/ci/ci-local.ps1 docker` | compose, imagens e smoke docker |
| Operacional | `scripts/smokes/run-smokes.ps1` | fluxo ponta a ponta |
| Fechamento | `scripts/reports/run-all-reports.ps1 -Profile full-closeout` | pacote final de evidencias |

## Reports Oficiais

| Escopo | Saida |
| --- | --- |
| Web unit | `apps/web/reports/unit/` |
| Web integration | `apps/web/reports/integration/` |
| Web e2e | `apps/web/e2e/reports/` |
| API | `apps/api/test/reports/` |
| Worker | `apps/worker/spec/reports/` |
| CI local | `scripts/ci/reports/` |
| Smokes | `scripts/smokes/reports/` |
| Hub | `docs/reports/index.html` |

Reports locais sao regenerados e sobrescritos. Em geral, apenas estrutura `.gitkeep` fica versionada; o hub pode ser versionado quando o fechamento exigir evidencia navegavel.

## Perfis Operacionais

### Fast

Use para uma trilha isolada:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 e2e
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 docker
```

### Operational

Use quando o fluxo de runtime precisa ser provado:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1
```

### Full Closeout

Use para fechamento de release ou PR grande:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout
```

O fluxo de public link usa uma fixture CSV publica padrao. Defina `SMOKE_PUBLIC_LINK_URL` apenas para trocar a origem do arquivo.

## GitHub Actions

GitHub Actions e o CI remoto oficial:

- `frontend-ci.yml`
- `backend-ci.yml`
- `docker-ci.yml`
- `e2e-auth-ci.yml`

CircleCI nao possui configuracao versionada no repositorio. Se aparecer como check externo, tratar como integracao externa: capturar pipeline/job/step, classificar transiente vs deterministico e corrigir apenas causa confirmada.

## Criterios De Aceite

Uma entrega relevante so pode ser tratada como pronta quando:

- comandos do escopo alterado passam;
- contratos/OpenAPI estao sincronizados quando houver mudanca de interface;
- smokes passam quando runtime ou operacao forem tocados;
- full-closeout passa no fechamento relevante;
- falhas de ambiente, se houver, possuem causa concreta e caminho de reexecucao;
- roadmap, closeout e docs afetadas registram a evidencia.

## Falha De Ambiente

Uma falha pode ser classificada como ambiente somente quando:

- acontece antes de exercitar regra de negocio ou por dependencia externa ao codigo;
- possui causa concreta, reproduzivel e registrada;
- existe comando oficial alternativo ou caminho recomendado;
- nao ha evidencia de regressao de implementacao.

Exemplos: Docker Desktop indisponivel, permissao WSL/host, rede externa bloqueada para download de dependencia, politica local do PowerShell.

## Referencias

- [Definition of Done](definition-of-done.md)
- [DevOps roadmap](../platform/devops-roadmap.md)
- [Release/rollback checklist](../platform/release-rollback-checklist.md)
- [Roadmap mestre](../../planning/)
