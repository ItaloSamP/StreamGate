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

## Estado apos Sprint 3

O contrato oficial agora cobre auth + trilha base de ingestao (`upload+job`):

- auth: `register`, `login`, `logout`, `me`, `session/refresh`, reset de senha
- upload/job:
  - `POST /api/v1/uploads/signed-url`
  - `POST /api/v1/uploads`
  - `GET /api/v1/uploads`
  - `GET /api/v1/jobs`

Fonte unica do contrato:

- `apps/api/openapi/v1/openapi.yaml`

## Como acessar localmente

```bash
cd apps/api
bundle exec rails server
```

UI da doc:

- [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Contratos da trilha upload/job (Sprint 3)

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
    "details": [
      { "field": "content_type", "reason": "not_supported" }
    ]
  }
}
```

## Relacao com contratos compartilhados

Os schemas/examples HTTP da trilha ficam em:

- `packages/contracts/schemas/http`
- `packages/contracts/examples/http`

Compatibilidade de contrato deve seguir sincronizada com OpenAPI no mesmo ciclo de mudanca.

## Relacao com outros docs

- setup e envs: [docs/guides/platform/setup.md](C:/estudos/StreamGate/docs/guides/platform/setup.md)
- autenticacao: [docs/guides/backend/authentication-guide.md](C:/estudos/StreamGate/docs/guides/backend/authentication-guide.md)
- roadmap executivo: [docs/planning/streamgate-full-sprints-roadmap.md](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
