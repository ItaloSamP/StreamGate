# Guia De Fechamento Do Produto

Este guia resume o estado final do StreamGate antes da branch de release. Ele existe para deixar claro o que esta entregue, quais gates provam essa leitura e quais pontos devem ser revisados no pente fino final.

## Leitura Atual

O StreamGate possui um nucleo operacional completo para ingestao, processamento assincrono, command center, auditoria, artefatos, notificacoes, conectores base e leitura analitica.

O produto ja pode ser explicado como uma plataforma de ingestao operacional com:

- entrada por arquivo local, link publico e conectores S3/HTTP admin-only;
- API Rails como orquestradora segura;
- worker Ruby como runtime de ETL;
- PostgreSQL como fonte operacional;
- ClickHouse como fonte analitica com fallback honesto;
- frontend React como workspace operacional;
- contratos versionados em OpenAPI e `packages/contracts`;
- gates locais, smokes e GitHub Actions como caminho de validacao.

## O Que Esta Entregue

| Frente | Estado |
| --- | --- |
| Auth, sessao e role gating | funcional |
| Upload local e public link | funcional |
| Conectores S3/HTTP | funcional no corte admin/API/worker/UI |
| Pipeline RabbitMQ + worker | funcional |
| CSV, JSON, NDJSON, ZIP seguro, XLSX e Parquet condicionado ao runtime | funcional |
| Jobs, batches, attempts e quarantine | funcional |
| Safe operations | funcional para fluxo aprovado |
| Artefatos finais | funcional |
| Notificacoes | funcional |
| Audit trail | funcional |
| Dashboard command center | funcional, data-driven e com estados honestos |
| Realtime dashboard | funcional com ticket curto e polling fallback |
| Exports e alert actions | funcional, auditavel e mascarado |
| ClickHouse/warehouse | funcional com fallback Postgres |
| ETL Explorer | funcional por lineage de job |
| OpenAPI e contratos | versionados e validados |
| Reports, smokes e CI local | operacionalizados |

## Limites Declarados

- `google_drive` e `oauth_delegated` continuam discovery-only.
- A branch de release deve focar em pente fino visual/UX, hardening final, verificacao ampla e fechamento de qualquer detalhe residual.
- Deploy produtivo em cluster, tracing distribuido completo e observabilidade avancada ficam fora do corte atual.
- CircleCI nao e gate versionado neste repositorio; GitHub Actions e o CI remoto oficial.

## Fluxo Principal Que Deve Permanecer Intacto

1. Usuario autenticado entra no workspace.
2. Inicia ingestao por arquivo, link publico ou conector permitido.
3. API valida permissao, idempotencia e contrato.
4. Storage recebe o bruto.
5. Evento vai para RabbitMQ.
6. Worker processa, cria batches, separa quarentena e gera artefatos.
7. PostgreSQL, ClickHouse, realtime events, warnings e audit trail sao atualizados.
8. Frontend reflete estado em dashboard, jobs, lineage, analytics, artifacts, notificacoes e audit.

## Checklist De Release

### Produto

- [x] Workspace autenticado coerente e navegavel.
- [x] Dashboard sem fixtures invisiveis.
- [x] Upload Center e quick upload ligados ao fluxo real.
- [x] Settings com conectores admin-only e sem exposicao de segredo.
- [x] Analytics, ClickHouse e ETL Explorer com papeis distintos.
- [x] Admin/operator com profundidade correta por papel.

### Backend, Worker E Contratos

- [x] OpenAPI e contracts cobrem endpoints e eventos atuais.
- [x] Mutacoes sensiveis exigem RBAC, idempotencia e auditoria.
- [x] Realtime, exports, alert actions e conectores possuem contratos e testes.
- [x] Worker processa formatos suportados e falha de forma segura.
- [x] ClickHouse nao recebe payload bruto sensivel.

### Operacao E Qualidade

- [x] Gates frontend/backend/e2e/docker definidos.
- [x] Smoke operacional definido.
- [x] Full-closeout definido como pacote final de evidencia.
- [x] GitHub Actions documentado como CI remoto oficial.
- [x] CircleCI documentado como diagnostico externo, sem config versionada.

### Documentacao

- [x] README raiz explica o produto final.
- [x] READMEs de API, web, worker e contracts explicam responsabilidades atuais.
- [x] API docs, threat model, workspace map, runbook e release checklist sincronizados.
- [x] Roadmap e closeout registram o fechamento historico.

## Gates De Fechamento

Comandos obrigatorios para uma entrega final:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 e2e
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 docker
powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout
```

`SMOKE_PUBLIC_LINK_URL` e opcional. O smoke usa uma fixture CSV publica padrao e so precisa de override quando a rede local exige uma origem propria.

Comandos diretos de apoio:

```bash
cd apps/api && bundle exec rails test
cd apps/worker && bundle exec rspec
ruby scripts/ci/validate-operational-contracts.rb
cd apps/web && pnpm test:run
cd apps/web && pnpm test:integration
cd apps/web && pnpm build
```

## Pente Fino Da Branch De Release

A branch de release deve concentrar:

- revisao visual completa de todas as rotas;
- mobile/tablet e acessibilidade;
- consistencia de copy e estados vazios/degradados;
- varredura de segredo/payload sensivel em UI, docs e logs;
- revisao de branch protection, CI e docs finais;
- decisao explicita sobre qualquer backlog residual.

## Referencias

- [Visao de produto](../../product/vision.md)
- [Roadmap mestre](../../planning/)
- [Testing baseline](../quality/testing-baseline.md)
- [Release/rollback checklist](release-rollback-checklist.md)
- [Workspace map](../frontend/frontend-workspace-map.md)
- [API docs](../backend/api-docs.md)
- [Worker runbook](../operations/worker-runtime-runbook.md)
