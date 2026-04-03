# packages/contracts

Espaco reservado para contratos compartilhados entre frontend, API e worker.

## Papel no projeto

Este pacote vai concentrar:

- eventos de dominio
- schemas JSON
- nomes de filas, exchanges e routing keys
- payloads de exemplo
- versao de contratos publicada

Enquanto os contratos concretos ainda nao foram materializados em arquivos, a referencia oficial de linguagem e:

- [Fundacoes do backend](C:/estudos/StreamGate/docs/guides/backend-foundations.md)
- [Visao do produto](C:/estudos/StreamGate/docs/product/vision.md)

## Convencoes iniciais

### Entidades operacionais

- `upload`
- `job`
- `batch`
- `quarantine_entry`
- `audit_event`
- `processing_attempt`

### Entidades analiticas

- `fact_ingestion_record`
- `dim_source_file`
- `dim_processing_time`
- `analytic_metric`

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
- `upload_id`
- `job_id`
- `batch_id`
