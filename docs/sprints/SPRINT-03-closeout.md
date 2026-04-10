# Sprint 3 - Closeout

## Identificacao

- Sprint: `Sprint 3 - Upload assinado e criacao de job (E2E Workspace)`
- Periodo: `2026-04-08` a `2026-04-10`
- Responsaveis: time de engenharia StreamGate
- Data do fechamento: `2026-04-10`

## Resumo executivo

- Objetivo da sprint: entregar fluxo base `upload+job` ponta a ponta no workspace autenticado.
- Resultado real: trilhas de backend, frontend, devops, testes, seguranca e documentacao fechadas para o escopo da Sprint 3 base.
- Leitura geral: `concluida`

## O que foi entregue

- [x] `POST /api/v1/uploads/signed-url` com presigned `PUT`, TTL configuravel e validacoes contratuais
- [x] `POST /api/v1/uploads` com idempotencia por `storage_key + checksum_sha256`
- [x] `GET /api/v1/uploads` e `GET /api/v1/jobs` com filtros e paginacao
- [x] `UploadPage` real com estados de fluxo e refresh de uploads/jobs
- [x] `JobsPage` real com status + pagina em URL
- [x] smoke operacional do fluxo assinado (`signed-url -> PUT -> register -> list`)
- [x] sincronizacao de OpenAPI + contratos HTTP + documentacao da sprint

## O que ficou fora de escopo (planejado)

- runtime real do worker (permanece nao tocado nesta sprint)
- ingestao por `external_link` e `oauth_delegated`
- conectores wave 1 (`google_drive`, `s3`, `http_url`)

## Validacao executada

Comandos e resultado:

- `apps/api`: `bundle exec rails test` (ok: `35 runs`, `147 assertions`, `0 failures`, `0 errors`)
- `apps/web`: `pnpm lint` (ok)
- `apps/web`: `pnpm test:run` (ok: `9` arquivos, `41` testes)
- `apps/web`: `pnpm test:integration` (ok: `3` testes)
- `apps/web`: `pnpm test:e2e` (ok: `8` testes)
- raiz: `python scripts/compose/compose-smoke.py` (ok)
- raiz: `python scripts/compose/upload-signed-smoke.py` (ok, upload/job criados)

Classificacao ambiente vs implementacao:

- falhas de implementacao abertas no fechamento: `nenhuma`
- observacao de ambiente: limitacoes conhecidas de host Windows continuam classificadas como ambiente quando nao reproduzidas no fluxo oficial `WSL/CI`

## Seguranca e confianca

Validacoes consolidadas na trilha:

- allowlist de `content_type` ativa (`application/zip`, `text/csv`)
- TTL de signed URL configuravel por env e escopo restrito ao storage key emitido
- hardening de `storage_key` contra path traversal e formato invalido
- rate limit dedicado para `signed-url` e `register`
- filtros de log para evitar vazamento de token, assinatura e URL assinada

## Delta por trilha (obrigatorio)

- `Back planning`: `concluida`
- `Back execution`: `concluida`
- `Worker execution`: `nao tocada nesta sprint`
- `Front planning`: `concluida`
- `Front execution`: `concluida`
- `DevOps`: `concluida`
- `Documentation`: `concluida`
- `Test planning`: `concluida`
- `Test execution`: `concluida`
- `Security`: `concluida`
- `Skills da sprint`: `concluida`

## Pendencias movidas para Sprint 4

- abrir trilha funcional de worker runtime com consumo real de fila
- ampliar modulos reais alem de upload/jobs (analytics/quarantine/audit)
- iniciar backlog de ingestao por link/conector (Sprint 3.x/4)
