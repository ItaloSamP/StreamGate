# Swagger/OpenAPI da API

## Objetivo
Este guia consolida diretrizes de api docs para uso consistente no projeto.

## Estado atual
Conteudo alinhado ao fechamento da Sprint 3 e ao planejamento da Sprint 4; atualizar em cada mudanca relevante.

## Regras/Contratos
- As regras normativas deste tema estao descritas nas secoes tecnicas abaixo.
- Mudancas devem manter alinhamento com roadmap, ADRs e READMEs.

## Validacao/Evidencias
- Validar coerencia com README raiz, docs/README e roadmap da release atual.
- Registrar atualizacoes desta pagina no closeout da sprint correspondente.

## Referencias
- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
- [Governanca de documentacao](C:/estudos/StreamGate/docs/guides/operations/documentation-governance.md)


A API Rails do StreamGate usa OpenAPI como contrato publico versionado da v1.

## Estado apos Sprint 4 (backend)

O contrato oficial agora cobre auth + runtime backend da trilha operacional:

- auth: `register`, `login`, `logout`, `me`, `session/refresh`, reset de senha
- upload/job:
  - `POST /api/v1/uploads/signed-url`
  - `POST /api/v1/uploads`
  - `GET /api/v1/uploads`
  - `GET /api/v1/jobs`
- operacional read-only:
  - `GET /api/v1/analytics`
  - `GET /api/v1/quarantine`
  - `GET /api/v1/quarantine/dlq` (admin-only)
  - `GET /api/v1/audit` (admin-only)

Fonte unica do contrato:

- `apps/api/openapi/v1/openapi.yaml`

## Como acessar localmente

```bash
cd apps/api
bundle exec rails server
```

UI da doc:

- [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Contratos da trilha upload/job (Sprint 4 backend)

### `POST /api/v1/uploads/signed-url`

Request (`upload`):

- `filename`
- `content_type` (`application/zip` ou `text/csv`)
- `byte_size`
- `checksum_sha256`

Response `201`:

- `data.storage_key`
- `data.method` (`PUT`)
- `data.upload_url`
- `data.required_headers`
- `data.expires_at`

### `POST /api/v1/uploads`

Request (`upload`):

- `filename`
- `content_type`
- `byte_size`
- `checksum_sha256`
- `storage_key`
- `metadata` (opcional)

Response `201`:

- `data.upload`
- `data.job`

Idempotencia:

- mesmo `storage_key` + mesmo `checksum_sha256` retorna `200` com `meta.idempotent=true`
- mesmo `storage_key` + checksum diferente retorna `409 resource_conflict`

### `GET /api/v1/uploads` e `GET /api/v1/jobs`

Filtros:

- `status`
- `page`
- `per_page`
- `search` (opcional)

Envelope padrao:

- `data`
- `meta.pagination`
- `meta.filters`

## Contratos operacionais read-only

### `GET /api/v1/analytics`

- janela por `preset` (`last_24h`, `last_7d`, `last_30d`) ou `from`/`to`/`timezone`
- ordenacao por `sort_by` + `sort_order`
- paginação de breakdown de `actor`
- KPIs base:
  - `uploads_total`
  - `jobs_total`
  - `jobs_processing`
  - `jobs_completed`
  - `jobs_failed`
  - `jobs_quarantined`
  - `quarantine_records_total`
  - `audit_events_total`
- camada materializada: `analytics_job_snapshots`

### `GET /api/v1/quarantine`

- filtros: `preset|from/to/timezone`, `severity`, `job_id`, `trace_id`, `search`
- ordenacao: `created_at|severity|row_number|code`
- paginação padrao `page`/`per_page`
- escopo:
  - `admin`: global
  - `operator`: recursos da mesma `organization_id`

### `GET /api/v1/quarantine/dlq`

- endpoint de inspeção read-only da fila `streamgate.worker.upload.received.v1.dlq`
- filtros em snapshot de mensagem: `dead_letter_reason`, `event_name`, `trace_id`, `job_id`
- ordenacao: `retry_count|dead_letter_reason|event_id|occurred_at`
- restricao: `admin-only`

### `GET /api/v1/audit`

- filtros: `preset|from/to/timezone`, `action`, `actor_id`, `auditable_type`, `trace_id`, `request_id`, `search`
- ordenacao: `occurred_at|action|actor_id|auditable_type`
- paginação padrao `page`/`per_page`
- politica de acesso: `admin-only`
- retenção operacional: `AUDIT_RETENTION_DAYS` (default `180`)

## Codigos de erro estaveis

Trilha auth/upload/job usa estes codigos como contrato:

- `validation_failed`
- `resource_conflict`
- `access_denied`
- `rate_limited`
- `dependency_unavailable`
- `invalid_credentials`
- `session_expired`

Envelope de erro:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Nao foi possivel validar os dados enviados.",
    "request_id": "req_xxx",
    "trace_id": "trace_xxx",
    "correlation_id": "req_xxx",
    "details": [
      { "field": "content_type", "reason": "not_supported" }
    ]
  }
}
```

## Eventos e outbox

- evento oficial de ingestao: `upload.received.v1`
- topologia:
  - exchange: `streamgate.events`
  - routing key: `upload.received.v1`
  - queue: `streamgate.worker.upload.received.v1`
  - dlq: `streamgate.worker.upload.received.v1.dlq`
- publicacao via outbox transacional:
  - tabela `integration_outbox_events`
  - despacho best-effort no registro + task `streamgate:outbox:dispatch`

## Relacao com contratos compartilhados

Os schemas/examples HTTP ficam organizados por dominio em:

- `packages/contracts/schemas/http/uploads`
- `packages/contracts/schemas/http/operational-reads`
- `packages/contracts/schemas/http/operations`
- `packages/contracts/schemas/http/artifacts`
- `packages/contracts/schemas/http/notifications`

### Notificacoes in-app

A Sprint 5 expande a inbox sem expor payload sensivel:

- `GET /api/v1/notifications?status=active|unread|read|archived`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/:id/archive`
- `PATCH /api/v1/notifications/:id/unarchive`
- `DELETE /api/v1/notifications/:id`
- `PATCH /api/v1/notifications/mark-all-read`
- `PATCH /api/v1/notifications/bulk-archive`

Todas as mutacoes sao escopadas ao ator autenticado. `active` lista notificacoes nao arquivadas; arquivadas continuam sujeitas a expiracao por retencao.
- `packages/contracts/schemas/http/shared`
- `packages/contracts/examples/http/<dominio-correspondente>`

Compatibilidade de contrato deve seguir sincronizada com OpenAPI no mesmo ciclo de mudanca.

## Relacao com outros docs

- setup e envs: [docs/guides/platform/setup.md](C:/estudos/StreamGate/docs/guides/platform/setup.md)
- autenticacao: [docs/guides/backend/authentication-guide.md](C:/estudos/StreamGate/docs/guides/backend/authentication-guide.md)
- roadmap executivo: [docs/planning/streamgate-full-sprints-roadmap.md](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
