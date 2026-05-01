# StreamGate Worker

Worker Ruby do StreamGate.

## Papel do worker

O worker sera responsavel por:

- consumir eventos publicados pela API
- ler arquivos do storage
- processar lotes
- validar dados
- registrar progresso, falha, quarentena e replay
- alimentar as camadas operacional e analitica

## Estado atual

O worker executa runtime real de fila e fecha a trilha de artefatos/notificacoes de operacao segura:

- consumo RabbitMQ (`upload.received.v1`) com retry controlado e DLQ
- idempotencia por `event_id` para evitar reprocessamento duplicado
- leitura de objetos no MinIO via S3 API
- parse inicial de `text/csv` (`,` e `;`) e `application/zip` (exatamente 1 CSV)
- atualizacao de `jobs`, `processing_attempts`, `job_batches`, `quarantine_records` e `audit_events`
- geracao dos artefatos `processed_dataset`, `quality_report` e `audit_report` em `job_artifacts`
- notificacoes operacionais `job.completed`, `job.quarantined_with_warnings` e `job.failed`
- sincronizacao de `analytics_job_snapshots` e metricas em `worker_processing_metrics`
- rastreabilidade por `trace_id`, `request_id`, `upload_id` e `job_id`

## Comandos atuais

```bash
bundle install
bundle exec rspec
bundle exec ruby -e 'require "worker"; Worker.run!'
```

Para gerar logs, resumo HTML e coverage SimpleCov no padrao oficial, rode o runner unico na raiz:

```bash
bash scripts/reports/run-all-reports.sh
```

No PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/reports/run-all-reports.ps1
```

Os artefatos do worker ficam em `apps/worker/spec/reports/` e sao sobrescritos a cada execucao.

## Observacao importante

O gap antigo do `gemspec` baseado em `git ls-files` ja foi removido na baseline inicial.

No ambiente Windows atual, o principal cuidado do worker passa a ser a validacao do setup Ruby local, do runtime real de fila e da disponibilidade de Postgres/MinIO quando a suite sair dos mocks.

## Proximo passo esperado

A evolucao apos este baseline deve focar em:

1. parser por dominio e regras de validacao ricas
2. smoke completo de artefato baixavel ponta a ponta
3. observabilidade mais profunda (metricas e alertas por fila/tentativa/artefato)

## Referencias

- [Baseline de testes e reports](C:/estudos/StreamGate/docs/guides/quality/testing-baseline.md)
- [Runbook do worker](C:/estudos/StreamGate/docs/guides/operations/worker-runtime-runbook.md)
