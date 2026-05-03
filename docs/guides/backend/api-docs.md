# Swagger/OpenAPI da API

## Objetivo
Este guia consolida diretrizes de api docs para uso consistente no projeto.

## Estado atual
Conteudo alinhado ao estado atual de Back + Worker; atualizar em cada mudanca relevante.

## Regras/Contratos
- As regras normativas deste tema estao descritas nas secoes tecnicas abaixo.
- Mudancas devem manter alinhamento com roadmap, ADRs e READMEs.

## Validacao/Evidencias
- Validar coerencia com README raiz, docs/README e roadmap da release atual.
- Registrar atualizacoes desta pagina no closeout do ciclo de entrega correspondente.

## Referencias
- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/)
- [Governanca de documentacao](C:/estudos/StreamGate/docs/guides/operations/documentation-governance.md)


A API Rails do StreamGate usa OpenAPI como contrato publico versionado da v1.

## Estado apos command center operacional Back + Worker

O contrato oficial cobre auth, runtime operacional, dashboard expandida, realtime, exports, alert actions e conectores base S3/HTTP:

- auth: `register`, `login`, `logout`, `me`, `session/refresh`, reset de senha
- upload/job:
  - `POST /api/v1/uploads/signed-url`
  - `POST /api/v1/uploads`
  - `POST /api/v1/uploads/public-link`
  - `GET /api/v1/uploads`
  - `GET /api/v1/jobs`
- operacional read-only:
  - `GET /api/v1/analytics`
  - `GET /api/v1/analytics/dashboard`
  - `GET /api/v1/analytics/warehouse`
  - `GET /api/v1/analytics/lineage?job_id=...`
  - `GET /api/v1/quarantine`
  - `GET /api/v1/quarantine/dlq` (admin-only)
  - `GET /api/v1/audit` (admin-only)
- dashboard/realtime:
  - `POST /api/v1/analytics/dashboard/exports`
  - `POST /api/v1/realtime/tickets`
  - `GET /api/v1/realtime/events`
  - `POST /api/v1/alerts/:id/review`
  - `POST /api/v1/alerts/:id/dismiss`
- conectores base:
  - `GET /api/v1/connectors/profiles`
  - `POST /api/v1/connectors/profiles`
  - `GET /api/v1/connectors/profiles/:id`
  - `PATCH /api/v1/connectors/profiles/:id`
  - `POST /api/v1/connectors/profiles/:id/test`
  - `POST /api/v1/connectors/profiles/:profile_id/ingestions`
  - `POST /api/v1/internal/connectors/leases/:id/claim`

Fonte unica do contrato:

- `apps/api/openapi/v1/openapi.yaml`

## Como acessar localmente

```bash
cd apps/api
bundle exec rails server
```

UI da doc:

- [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Contratos da trilha upload/job

### `POST /api/v1/uploads/signed-url`

Request (`upload`):

- `filename`
- `content_type`
- `byte_size`
- `checksum_sha256`

Content types aceitos:

- `text/csv`
- `application/json`
- `application/zip`
- `application/x-ndjson`
- `application/ndjson`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `application/vnd.apache.parquet`

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

### `POST /api/v1/uploads/public-link`

Cria a primeira fronteira funcional de `external_link` como `public_link`.

- exige `Idempotency-Key`;
- aceita somente `http`/`https` sem credenciais e sem portas nao padrao;
- bloqueia destinos locais/privados/link-local/metadata;
- persiste apenas `url_masked` + `url_hash` em recursos expostos;
- publica `upload.public_link.requested.v1` para o worker baixar por stream e transformar em `upload.received.v1`.

Response `201`:

- `data.upload.source_type=external_link`
- `data.job.source_type=external_link`
- `data.acquisition.link_mode=public_link`
- `meta.idempotent=true`

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

### `GET /api/v1/analytics/dashboard`

Snapshot agregado para a dashboard final. Cada secao declara `status` como `live`, `derived`, `empty`, `degraded` ou `backend-pending`; dado ausente vira empty state explicito, nao fixture.

Na command center operacional, o payload preserva compatibilidade com consumidores workspace operacional e adiciona secoes opcionais para command center:

- `kpis`
- `timeseries_24h`
- `status_distribution`
- `formats`
- `heatmap_7d`
- `jobs_board`
- `queue_items`
- `ingestion`
- `workers_live`
- `alerts`
- `event_log`
- `dependencies.source_health`

ClickHouse e a fonte preferencial para series, heatmap, formatos, distribuicao, historico e workers. Quando ClickHouse esta indisponivel, a API retorna fallback Postgres com `source=postgres_derived`, `fallback_reason`, `stale`, `slo` e warning tecnico. Operator recebe somente dados do proprio escopo organizacional; admin pode consultar a visao global.

### `POST /api/v1/analytics/dashboard/exports`

Cria export server-side auditavel e idempotente para `snapshot`, `series`, `heatmap` ou `event_log`, nos formatos `csv` ou `json`.

Regras:

- exige `Idempotency-Key`;
- aplica RBAC e escopo por organizacao;
- mascara chaves sensiveis, URLs, headers, object keys e credenciais antes de retornar conteudo;
- persiste metadata em `dashboard_exports`;
- retorna o conteudo no response para o frontend baixar sem fixture local.

### Realtime

`POST /api/v1/realtime/tickets` emite ticket curto assinado com usuario, organizacao e role para uso em Action Cable/Solid Cable. `GET /api/v1/realtime/events` oferece fallback de polling sobre `realtime_events` duravel.

Eventos realtime sao escopados por organizacao e recurso, possuem severidade, payload sanitizado, expiracao e indice para leitura operacional. Falhas de emissao nao bloqueiam upload, job, artefato, notificacao ou auditoria.

### Alert actions

`POST /api/v1/alerts/:id/review` e `POST /api/v1/alerts/:id/dismiss` persistem revisao/dispensa em `operational_warnings`.

Regras:

- exigem `Idempotency-Key`;
- respeitam RBAC e escopo por organizacao;
- registram motivo operacional quando informado;
- auditam a acao;
- sao idempotentes para repeticao segura pelo frontend.

### Conectores S3/HTTP

Perfis de conector sao admin-only e usam Active Record Encryption para segredos. As respostas publicas nunca retornam secrets, bucket, object key, URL completa com query, headers ou credenciais.

Fluxo:

1. admin cria perfil S3 ou HTTP em `POST /api/v1/connectors/profiles`;
2. a API cria ingestion com `POST /api/v1/connectors/profiles/:profile_id/ingestions`;
3. um lease interno e gerado para o worker;
4. o worker reivindica `POST /api/v1/internal/connectors/leases/:id/claim` usando `X-Worker-Token`;
5. o worker baixa S3/HTTP, grava no storage padrao e publica `upload.received.v1`.

HTTP aplica anti-SSRF, bloqueio de localhost/private/link-local/metadata hosts, validacao de redirects e masking de URL/header. S3 nao expoe bucket, key ou credenciais em API, evento ou log.

### `GET /api/v1/analytics/warehouse`

Leitura real de warehouse em ClickHouse quando disponivel. A carga analitica e feita pelo worker em duas camadas: uma linha por job e linhas de registro com metadata + HMAC-SHA256, sem payload bruto. O payload agrega `jobs_total`, `uploads_total`, `records_total`, `valid_records`, `invalid_records`, `by_status` e `by_source`.

Quando ClickHouse nao estiver disponivel, retorna `200` com `source=postgres_derived`, `fallback_reason`, `dependency_status`, metadados de SLO e warning tecnico em `operational_warnings`. Falha analitica nao bloqueia job, artefatos, notificacoes ou auditoria operacional.

### `GET /api/v1/analytics/lineage?job_id=...`

Drilldown tecnico por job com batches, attempts, quarantine, artifacts, warnings tecnicos e `audit_refs`.

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
- evento oficial de aquisicao por public link: `upload.public_link.requested.v1`
- evento oficial de requisicao de conector: `connector.ingestion.requested.v1`
- topologia:
  - exchange: `streamgate.events`
  - routing key: `upload.received.v1`
  - queue: `streamgate.worker.upload.received.v1`
  - dlq: `streamgate.worker.upload.received.v1.dlq`
- publicacao via outbox transacional:
  - tabela `integration_outbox_events`
  - despacho best-effort no registro + task `streamgate:outbox:dispatch`

Eventos de worker tambem alimentam `realtime_events` best-effort para dashboard e polling. O payload deve ser sanitizado antes de persistir ou publicar.

## Relacao com contratos compartilhados

Os schemas/examples HTTP ficam organizados por dominio em:

- `packages/contracts/schemas/http/uploads`
- `packages/contracts/schemas/http/operational-reads`
- `packages/contracts/schemas/http/operations`
- `packages/contracts/schemas/http/artifacts`
- `packages/contracts/schemas/http/notifications`
- `packages/contracts/schemas/http/connectors`
- `packages/contracts/schemas/events/connectors`
- `packages/contracts/schemas/http/shared`
- `packages/contracts/examples/http/<dominio-correspondente>`

### Notificacoes in-app

A operacao segura expande a inbox sem expor payload sensivel:

- `GET /api/v1/notifications?status=active|unread|read|archived`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/:id/archive`
- `PATCH /api/v1/notifications/:id/unarchive`
- `DELETE /api/v1/notifications/:id`
- `PATCH /api/v1/notifications/mark-all-read`
- `PATCH /api/v1/notifications/bulk-archive`

Todas as mutacoes sao escopadas ao ator autenticado. `active` lista notificacoes nao arquivadas; arquivadas continuam sujeitas a expiracao por retencao.

Compatibilidade de contrato deve seguir sincronizada com OpenAPI no mesmo ciclo de mudanca.

## Relacao com outros docs

- setup e envs: [docs/guides/platform/setup.md](C:/estudos/StreamGate/docs/guides/platform/setup.md)
- autenticacao: [docs/guides/backend/authentication-guide.md](C:/estudos/StreamGate/docs/guides/backend/authentication-guide.md)
- roadmap executivo: docs/planning/
