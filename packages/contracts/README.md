# packages/contracts

Fonte compartilhada dos contratos do StreamGate entre API, worker e frontend.

## Estrutura da Sprint 1

- `version.json`: versao publicada do pacote e politica de compatibilidade.
- `schemas/http`: envelopes e recursos HTTP.
- `schemas/events`: contratos de eventos assincronos.
- `examples/http`: exemplos concretos de respostas HTTP.
- `examples/events`: exemplos concretos de eventos.
- `COMPATIBILITY.md`: regra oficial de evolucao de contratos.

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

## Contratos HTTP adicionados na Sprint 3

- `upload-signed-url-request.v1.json`
- `upload-signed-url-response.v1.json`
- `upload-register-request.v1.json`
- `upload-register-response.v1.json`
- `upload-list-response.v1.json`
- `job-list-response.v1.json`
- `analytics-response.v1.json`
- `quarantine-list-response.v1.json`
- `audit-list-response.v1.json`
- `dlq-list-response.v1.json`

Exemplos correspondentes estao em `examples/http`.
## Fonte de verdade complementar

- [Glossario de dominio](C:/estudos/StreamGate/docs/guides/backend/domain-glossary.md)
- [Fundacoes do backend](C:/estudos/StreamGate/docs/guides/backend/backend-foundations.md)
- [ADR 0002](C:/estudos/StreamGate/docs/adr/0002-domain-boundaries-identifiers-and-contracts.md)
