# packages/contracts

Fonte compartilhada dos contratos do StreamGate entre API, worker e frontend.

## Estrutura atual

- `version.json`: versao publicada do pacote e politica de compatibilidade.
- `COMPATIBILITY.md`: regra oficial de evolucao de contratos.
- `schemas/http/shared/envelopes`: envelopes HTTP reutilizaveis.
- `schemas/http/shared/resources`: recursos HTTP compartilhados.
- `schemas/http/uploads`: contratos HTTP de upload e registro de job.
- `schemas/http/operational-reads`: contratos HTTP de leituras operacionais.
- `schemas/http/operations`: contratos HTTP de mutacoes operacionais.
- `schemas/http/artifacts`: contratos HTTP de artefatos finais.
- `schemas/http/notifications`: contratos HTTP de notificacoes e deliveries.
- `schemas/events/uploads`: contratos de eventos assincronos de upload.
- `examples/http/<dominio>` e `examples/events/<dominio>`: exemplos concretos espelhando a taxonomia dos schemas.

## Convencoes oficiais

### Entidades operacionais

- `user`
- `upload`
- `job`
- `job_batch`
- `quarantine_record`
- `audit_event`
- `processing_attempt`

### Eventos iniciais

- `upload.received`
- `etl.validation.failed`
- `etl.batch.loaded`
- `etl.job.completed`

### Campos minimos de rastreabilidade

Todo contrato de evento deve prever, quando aplicavel:

- `event_id`
- `event_name`
- `occurred_at`
- `producer`
- `payload_version`
- `trace_id`
- `request_id`
- `correlation_id`
- `upload_id`
- `job_id`
- `batch_id`

## Contratos HTTP por dominio

- `uploads`: signed URL, registro idempotente e listagem de uploads.
- `operational-reads`: jobs, analytics, quarantine, audit e DLQ read-only.
- `operations`: retry, resolve e ciclo de replay DLQ.
- `artifacts`: listagem e URL assinada curta de download.
- `notifications`: inbox, leitura/arquivo/delete, acoes em massa essenciais, settings e webhook/email deliveries.

Exemplos correspondentes ficam no mesmo dominio em `examples/http`.
## Fonte de verdade complementar

- [Glossario de dominio](C:/estudos/StreamGate/docs/guides/backend/domain-glossary.md)
- [Fundacoes do backend](C:/estudos/StreamGate/docs/guides/backend/backend-foundations.md)
- [ADR 0002](C:/estudos/StreamGate/docs/adr/0002-domain-boundaries-identifiers-and-contracts.md)
