# Glossario de Dominio do StreamGate

## Objetivo

Este glossario congela a linguagem operacional da Sprint 1 para evitar que API, worker, frontend e contratos usem nomes diferentes para o mesmo conceito.

## Entidades centrais

### User

Identidade humana ou tecnica que aciona operacoes na plataforma.

Campos centrais:

- `user_id`
- `email`
- `full_name`
- `role`
- `status`

### Upload

Artefato de entrada registrado na camada transacional. Um upload representa o arquivo recebido pelo sistema, sua trilha de rastreabilidade e seu enquadramento minimo de sensibilidade.

Campos centrais:

- `upload_id`
- `user_id`
- `filename`
- `content_type`
- `byte_size`
- `checksum_sha256`
- `storage_key`
- `status`
- `sensitivity_level`
- `request_id`
- `trace_id`

### Job

Unidade operacional que orquestra o processamento de um upload. O job e o agregado central da trilha de execucao.

Campos centrais:

- `job_id`
- `upload_id`
- `requested_by_id`
- `status`
- `error_code`
- `error_category`
- `quarantined_records_count`
- `request_id`
- `trace_id`

Estados oficiais:

- `pending`
- `processing`
- `completed`
- `failed`
- `quarantined_with_warnings`

### JobBatch

Particao operacional de um job para carga, validacao e rastreabilidade em lote.

Campos centrais:

- `batch_id`
- `job_id`
- `batch_number`
- `status`
- `input_rows`
- `valid_rows`
- `invalid_rows`
- `trace_id`

Estados oficiais:

- `pending`
- `processing`
- `loaded`
- `failed`
- `quarantined`

### QuarantineRecord

Registro individual que foi bloqueado ou sinalizado durante o processamento por motivo de qualidade ou regra de negocio.

Campos centrais:

- `quarantine_record_id`
- `job_id`
- `batch_id`
- `row_number`
- `code`
- `message`
- `severity`
- `trace_id`

### ProcessingAttempt

Tentativa rastreavel de execucao do pipeline operacional, inclusive para replay futuro.

Campos centrais:

- `processing_attempt_id`
- `job_id`
- `source_attempt_id`
- `initiated_by_id`
- `attempt_number`
- `status`
- `operation`
- `error_code`
- `retryable`
- `trace_id`

### AuditEvent

Evento imutavel de auditoria usado para responder quem fez o que, quando e com qual contexto.

Campos centrais:

- `audit_event_id`
- `actor_id`
- `auditable_type`
- `auditable_id`
- `action`
- `request_id`
- `trace_id`
- `occurred_at`

## Identificadores oficiais

A Sprint 1 fecha a estrategia oficial de IDs do dominio operacional:

- IDs publicos e internos do dominio sao strings prefixadas.
- O formato padrao e `<prefixo>_<32 hex>`.
- Prefixos aprovados: `user`, `upload`, `job`, `batch`, `quarantine`, `attempt`, `audit`, `trace`, `req`.
- O ID do recurso e a referencia oficial entre API, contratos, logs e trilhas internas.

Exemplos:

- `user_6c561be0f4f24b2db15c0ddfd4e0d3c2`
- `upload_52dc1cd9d40c472ebd63408d8d7b866f`
- `job_6f51b476d7274d6d94c7943ee6d88515`
- `batch_7f2294cf8d654d3981a5d25fd782a5bd`

## Erro operacional vs erro de validacao

### Erro de validacao

Ocorre quando o payload, o arquivo ou o registro nao cumpre um contrato ou regra verificavel e previsivel. Deve ser modelado como erro esperado, com `code` estavel e sem stack trace exposto.

### Erro operacional

Ocorre quando a execucao falha por indisponibilidade, integracao, infraestrutura transitoria, timeout ou comportamento inesperado. Deve ser classificado por categoria e informar se e `retryable`.

## O que fica no PostgreSQL agora

Na Sprint 1, o PostgreSQL guarda o estado transacional e auditavel:

- usuarios
- uploads
- jobs
- lotes
- registros de quarentena
- tentativas de processamento
- eventos de auditoria

## O que fica derivado para ClickHouse no futuro

A camada analitica deve nascer a partir dos fatos operacionais, e nao duplicar estado de escrita:

- tempos de processamento agregados
- taxas de erro por origem e periodo
- throughput por job, lote e pipeline
- metricas historicas por dimensao temporal
