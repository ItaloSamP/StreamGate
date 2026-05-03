# StreamGate

StreamGate e uma plataforma operacional para ingestao, processamento assincrono, auditoria e exploracao analitica de dados em alto volume.

O produto organiza a jornada completa: entrada de arquivos ou fontes externas, processamento por worker, quarentena de registros problematicos, artefatos finais, notificacoes, auditoria, command center em tempo quase real e leitura analitica via ClickHouse.

## O Que O Produto Entrega

- Ingestao por arquivo local, link publico e conectores base S3/HTTP.
- Processamento assincrono orientado a eventos com RabbitMQ e worker Ruby.
- Suporte a CSV, JSON, NDJSON, ZIP seguro, XLSX e Parquet quando o runtime nativo estiver disponivel.
- Command center operacional com dashboard expandida, WebSocket com polling fallback, exports auditaveis e alert review/dismiss persistentes.
- Warehouse ClickHouse para agregados, heatmap, historico e leitura analitica, com fallback Postgres honesto quando a dependencia esta degradada.
- Quarentena, DLQ, safe operations, artefatos finais e notificacoes operacionais.
- RBAC inicial para `admin` e `operator`, auditoria por recurso e masking de payloads sensiveis.
- Contratos versionados em OpenAPI e `packages/contracts`.

## Arquitetura

```text
Browser React/Vite
  -> Rails API-only
  -> PostgreSQL, Redis, MinIO, RabbitMQ, ClickHouse
  -> Ruby Worker
  -> artefatos, notificacoes, auditoria e command center
```

| Area | Stack | Papel |
| --- | --- | --- |
| `apps/web` | React + Vite + TypeScript | SPA publica, auth e workspace operacional |
| `apps/api` | Ruby on Rails API-only | Auth, RBAC, contratos HTTP, orquestracao e auditoria |
| `apps/worker` | Ruby | Consumo de eventos, parsing, ETL, artefatos e ClickHouse |
| `packages/contracts` | JSON Schema + exemplos | Fonte compartilhada de contratos |
| `scripts` | PowerShell, Bash, Node, Ruby | Bootstrap, dev, CI local, smokes e reports |
| `docs` | Markdown | Produto, arquitetura, runbooks, qualidade e fechamento |

## Fluxo Operacional

1. Usuario autenticado solicita upload, link publico ou ingestao por conector.
2. API valida permissao, idempotencia, content type e rastreabilidade.
3. Arquivo bruto entra no MinIO.
4. API publica evento de processamento no RabbitMQ.
5. Worker consome, valida, processa, separa quarentena e publica progresso.
6. PostgreSQL guarda estado operacional, auditoria e warnings.
7. ClickHouse recebe agregados e camadas analiticas sem payload bruto sensivel.
8. Frontend exibe command center, jobs, lineage, artefatos, notificacoes e auditoria.

## Perfis De Acesso

- `admin`: acesso global aos modulos operacionais, auditoria, DLQ, conectores, exports e mutacoes sensiveis.
- `operator`: acesso operacional escopado, sem segredos, auditoria global, DLQ ou configuracao de conectores.

Mutacoes sensiveis exigem RBAC, motivo quando aplicavel, auditoria e `Idempotency-Key`.

## Primeiros Passos

1. Copie `.env.example` para `.env`.
2. Ajuste segredos locais, portas e URLs conforme seu ambiente.
3. Instale dependencias dos apps que pretende rodar.
4. Suba a stack.

PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev\dev-up.ps1 -Mode app
```

Bash/WSL:

```bash
bash scripts/dev/dev-up.sh app
```

Para a stack completa com worker e dependencias:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev\dev-up.ps1 -Mode full
```

```bash
bash scripts/dev/dev-up.sh full
```

URLs locais usuais:

- Web: <http://localhost:5173>
- API health: <http://localhost:3000/up>
- API docs: <http://localhost:3000/api-docs>
- MinIO console: <http://localhost:9001>

## Gates Oficiais

Use gates isolados no dia a dia:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 e2e
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 docker
```

Gates diretos por app:

```bash
cd apps/api && bundle exec rails test
cd apps/worker && bundle exec rspec
cd apps/web && pnpm test:run
cd apps/web && pnpm test:integration
cd apps/web && pnpm build
ruby scripts/ci/validate-operational-contracts.rb
```

Fechamento operacional:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout
```

O smoke de public link usa um CSV publico pequeno por padrao. Use `SMOKE_PUBLIC_LINK_URL` apenas quando precisar apontar para uma fixture espelhada ou controlada.

## CI Remoto

GitHub Actions e a validacao remota oficial do repositorio:

- `frontend-ci.yml`
- `backend-ci.yml`
- `docker-ci.yml`
- `e2e-auth-ci.yml`

Nao ha configuracao CircleCI versionada neste repositorio. Caso um check externo do CircleCI apareca no PR, ele deve ser tratado como sinal externo e diagnosticado separadamente antes de bloquear release.

## Documentacao Principal

- [Hub de documentacao](docs/README.md)
- [Visao de produto](docs/product/vision.md)
- [Arquitetura](docs/guides/platform/architecture.md)
- [Setup](docs/guides/platform/setup.md)
- [API docs](docs/guides/backend/api-docs.md)
- [Frontend foundations](docs/guides/frontend/frontend-foundations.md)
- [Workspace map](docs/guides/frontend/frontend-workspace-map.md)
- [Worker runbook](docs/guides/operations/worker-runtime-runbook.md)
- [Threat model](docs/guides/security/streamgate-threat-model.md)
- [Testing baseline](docs/guides/quality/testing-baseline.md)
- [Release/rollback checklist](docs/guides/platform/release-rollback-checklist.md)
- [Roadmap e closeouts](docs/planning/)

## Politica De Entrega

- Toda mudanca de endpoint deve manter OpenAPI, contratos e docs sincronizados.
- Toda superficie sensivel deve revisar RBAC, masking, auditoria, idempotencia e retencao.
- Reports locais sao artefatos gerados e nao devem ser versionados, exceto o hub oficial quando o fechamento exigir.
- O caminho pesado recomendado segue `WSL/Compose-first`; PowerShell permanece suportado para operacao local e fallback.
