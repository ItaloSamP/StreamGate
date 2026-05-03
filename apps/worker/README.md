# StreamGate Worker

Runtime Ruby responsavel por consumir eventos, baixar entradas, processar arquivos, gerar artefatos, alimentar ClickHouse e publicar sinais operacionais para o command center.

## Responsabilidades

- Consumir `upload.received.v1`, `upload.public_link.requested.v1` e `connector.ingestion.requested.v1`.
- Baixar objetos do MinIO, links publicos e conectores S3/HTTP por lease interno.
- Processar CSV, JSON, NDJSON, ZIP seguro, XLSX e Parquet quando o runtime nativo estiver disponivel.
- Manter idempotencia por evento, upload, job e tentativa.
- Criar batches, attempts, quarantine records, warnings, audit events e artifacts.
- Carregar agregados e metadados seguros no ClickHouse, sem payload bruto sensivel.
- Emitir realtime events best-effort sem bloquear o fluxo principal.

## Pipeline

1. Recebe evento duravel via RabbitMQ.
2. Valida idempotencia e contexto.
3. Resolve entrada no storage ou em conector externo.
4. Faz spool/streaming com limites e cleanup best effort.
5. Parseia registros e separa validos de invalidos.
6. Atualiza PostgreSQL com progresso, batches e warnings.
7. Alimenta ClickHouse com agregados e fingerprints.
8. Gera `processed_dataset`, `quality_report` e `audit_report`.
9. Publica notificacoes, audit trail e eventos realtime.

## Conectores

- S3: usa perfil admin-only criptografado na API e lease interno reivindicado pelo worker.
- HTTP: aplica anti-SSRF, bloqueio de localhost/private/link-local/metadata, validacao de redirect e masking.
- Credenciais e secrets nunca devem aparecer em resposta, evento ou log.

## Desenvolvimento Local

```bash
bundle install
bundle exec rspec
bundle exec ruby -e 'require "worker"; Worker.run!'
```

Com stack completa:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev\dev-up.ps1 -Mode full
```

## Qualidade

```bash
bundle exec rspec
bundle exec rubocop
```

Gate coordenado na raiz:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend
```

## Operacao E Diagnostico

- DLQ recebe mensagens que excedem retry ou falham de forma controlada.
- Falhas de ClickHouse, realtime ou cleanup viram warnings tecnicos quando nao devem bloquear artefatos/auditoria.
- Toda investigacao deve partir de `trace_id`, `request_id`, `upload_id`, `job_id` e `event_id`.
- Runbook oficial: [worker-runtime-runbook.md](../../docs/guides/operations/worker-runtime-runbook.md).

## Referencias

- [API docs](../../docs/guides/backend/api-docs.md)
- [Contracts](../../packages/contracts/README.md)
- [Testing baseline](../../docs/guides/quality/testing-baseline.md)
- [Threat model](../../docs/guides/security/streamgate-threat-model.md)
