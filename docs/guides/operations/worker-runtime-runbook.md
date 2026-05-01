# Runbook: Worker Runtime

## Objetivo
Este guia consolida diretrizes de worker runtime runbook para uso consistente no projeto.

## Estado atual
Conteudo alinhado ao estado atual de Back + Worker; atualizar em cada mudanca relevante.


## Regras/Contratos
- As regras normativas deste tema estao descritas nas secoes tecnicas abaixo.
- Mudancas devem manter alinhamento com roadmap, ADRs e READMEs.

## Validacao/Evidencias
- Validar coerencia com README raiz, docs/README e roadmap da release atual.
- Registrar atualizacoes desta pagina no closeout do ciclo de entrega correspondente.


## Objetivo detalhado

Padronizar operacao, diagnostico e resposta a incidentes da trilha de runtime real do worker, incluindo processamento principal, artefatos, realtime, warehouse e conectores base.

## Estado atual detalhado

- runtime operacional backend ativou runtime real de consumo RabbitMQ.
- fluxo oficial agora opera com outbox transacional na API + consumidor real no worker.
- leitura operacional de DLQ disponivel em `GET /api/v1/quarantine/dlq` (admin-only).
- operacao segura adiciona geracao de artefatos finais, notificacoes operacionais e replay controlado sobre a mesma idempotencia por `event_id`.
- command center operacional adiciona eventos realtime best-effort, agregados ClickHouse para dashboard, formatos NDJSON/XLSX/Parquet e conectores S3/HTTP via lease interno.

## Regras e contratos operacionais

- trilha minima do runtime operacional:
  - consumo real de fila do broker;
  - processamento de evento `upload.received.v1` com transicao de estado de job;
  - idempotencia por `event_id` (`worker_consumed_events`);
  - retry com backoff exponencial e DLQ apos limite;
  - registro de erros com `trace_id`, `request_id`, `correlation_id`, `job_id` e `upload_id`.
- extensao de operacao segura:
  - geracao de `processed_dataset`, `quality_report` e `audit_report` em `job_artifacts`;
  - escrita dos artefatos no storage em `artifacts/<job_id>/<event_id>/`;
  - metricas `artifact_generated` e `artifact_failed` em `worker_processing_metrics`;
  - notificacoes `job.completed`, `job.quarantined_with_warnings` e `job.failed` via inbox/outbox;
  - falha de artefato registrada como auditoria sem alterar o estado final do job.
- extensao do command center operacional:
  - eventos realtime duraveis em `realtime_events` sem bloquear o processamento principal;
  - ClickHouse alimentado sem payload bruto, preservando hashes/HMAC e metadados agregaveis;
  - parsing de CSV, JSON array, `{ records: [...] }`, NDJSON, ZIP com exatamente um arquivo suportado, XLSX e Parquet;
  - limite operacional de 10 GB, spool/tempfile controlado e cleanup best-effort;
  - conectores S3/HTTP consumidos pelo worker via lease interno da API e `X-Worker-Token`.
- escopo fora do corte command center operacional:
  - `google_drive` e `oauth_delegated`;
  - UI admin nova para conectores S3/HTTP;
  - automacao de cluster e reprocessamento avancado.
- qualquer mudanca em runtime deve manter sincronia com:
  - `packages/contracts`;
  - `apps/api/openapi/v1/openapi.yaml` (quando houver reflexo em API);
  - roadmap mestre e closeout do ciclo de entrega.

## Procedimentos operacionais

### 1. Startup e validacao inicial

1. subir stack `full` (`api`, `web`, `worker`, infra).
2. validar conectividade com broker e storage.
3. validar health operacional da API (`/up`) e status de dependencias no compose.
4. validar topologia de fila:
   - exchange `streamgate.events`
   - routing `upload.received.v1`
   - queue `streamgate.worker.upload.received.v1`
   - dlq `streamgate.worker.upload.received.v1.dlq`
   - routing `connector.ingestion.requested.v1`
   - queue `streamgate.worker.connector.ingestion.requested.v1`
   - dlq `streamgate.worker.connector.ingestion.requested.v1.dlq`
5. validar envs command center operacional:
   - `WORKER_INTERNAL_TOKEN`
   - `BROKER_CONNECTOR_REQUESTED_ROUTING_KEY`
   - `REALTIME_EVENT_RETENTION_DAYS`
   - `CONNECTOR_LEASE_TTL_SECONDS`
   - credenciais S3/HTTP somente nos perfis criptografados da API.

### 2. Diagnostico de falhas

1. coletar `trace_id`/`request_id` do erro.
2. localizar `job_id` e `upload_id` correlatos.
3. classificar falha:
   - ambiente (infra/rede/host);
   - implementacao (regra/codigo/contrato).
4. registrar classificacao no fechamento do ciclo de entrega.

### 3. Retry e recuperacao

1. aplicar retry apenas para falhas `retryable`.
2. politica default:
   - max retries: `3`
   - backoff: exponencial (`1s`, `2s`, `4s` ... ate `30s`)
3. ao exceder limite, evento vai para DLQ com `x-dead-letter-reason`.
4. erro terminal marca `job.failed` e segue com `ack` sem requeue.
5. evitar duplicacao de carga com idempotencia por `event_id`.
6. replay aprovado deve passar pelo mesmo fluxo de idempotencia; evento ja consumido retorna como duplicado e nao gera novos artefatos.

### 4. Artefatos e notificacoes

1. apos sucesso do processamento, consultar `GET /api/v1/jobs/:job_id/artifacts`.
2. conferir os tres tipos oficiais: `processed_dataset`, `quality_report` e `audit_report`.
3. para download, usar a URL assinada curta gerada pela API, nao proxy direto pelo worker.
4. se houver `worker.artifacts.failed` em audit, o job pode permanecer `completed` ou `quarantined_with_warnings`; tratar a falha do artefato como incidente operacional.
5. notificacoes externas ficam em `webhook_deliveries` como outbox persistido; falha de envio nao bloqueia o processamento principal.

### 5. Formatos de entrada

Formatos suportados pelo worker:

- CSV;
- JSON array;
- JSON objeto com `{ "records": [...] }`;
- NDJSON (`application/x-ndjson` ou `application/ndjson`);
- ZIP com exatamente um arquivo suportado dentro;
- XLSX via `roo`;
- Parquet quando o grupo opcional/runtime nativo estiver disponivel.

Regras de seguranca:

- ZIP com multiplos arquivos suportados falha com erro seguro;
- zip slip, zip bomb e arquivos acima do limite sao rejeitados;
- payload bruto nao e enviado ao ClickHouse;
- erros retornam mensagens operacionais sem secrets, URL completa, headers, bucket ou object key.

Observacao de ambiente: no Windows host, Parquet pode exigir toolchain nativa/libclang. O runtime trata Parquet como suporte real quando a gem opcional estiver instalada no ambiente de worker; WSL/Linux e o caminho recomendado para validar esse parser em closeout pesado.

### 6. Conectores S3/HTTP

Fluxo operacional:

1. API cria `connector_profiles` admin-only com segredos criptografados.
2. API cria `connector_ingestions` e `connector_leases`.
3. Worker consome `connector.ingestion.requested.v1`.
4. Worker reivindica o lease em `POST /api/v1/internal/connectors/leases/:id/claim` com `X-Worker-Token`.
5. Worker baixa S3/HTTP, grava o arquivo no storage padrao e publica `upload.received.v1`.

Controles obrigatorios:

- HTTP bloqueia localhost, private, link-local, metadata host e redirects inseguros;
- DNS resolvido para IP privado deve ser rejeitado para reduzir risco de DNS rebind;
- S3 nunca deve aparecer com bucket/key/secret em resposta publica, evento, warning ou log;
- falha de conector deve virar warning tecnico/auditoria e nao vazar credenciais.

## Validacao e evidencias

- evidencias minimas da trilha:
  - comandos executados;
  - status dos servicos;
  - resultado por camada (API, worker, integração);
  - classificacao ambiente vs implementacao.
- comandos de referencia:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1`
  - `bash scripts/smokes/run-smokes.sh`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout`
  - `bash scripts/reports/run-all-reports.sh`
  - `python scripts/smokes/compose-smoke.py`
  - `python scripts/smokes/upload-signed-smoke.py`
  - `python scripts/smokes/worker-operational-smoke.py`
  - `bundle exec rake streamgate:outbox:dispatch` (API)
  - `GET /api/v1/quarantine/dlq` (inspecao read-only da DLQ)
  - `bundle exec rspec` em `apps/worker`
- o smoke operacional do worker deve comprovar, no minimo:
  - CSV valido publicado via signed URL termina como `job.completed`;
  - CSV com linha vazia termina como `job.quarantined_with_warnings`;
  - os tres artefatos finais ficam persistidos e listaveis por job;
  - uma notificacao operacional e/ou delivery pendente e criado para a transicao final;
  - a listagem de quarantine mostra o registro do arquivo com aviso;
  - analytics reflete o delta de jobs apos o processamento;
  - realtime/polling reflete eventos recentes sem bloquear o job;
  - conectores S3/HTTP base funcionam por lease interno quando variaveis de smoke estiverem presentes;
  - o runner derruba a stack ao final, inclusive em falha.
- o runner de reports consolida logs, SimpleCov do worker e smokes em `docs/reports/index.html`; estes artefatos sao locais e sobrescritos a cada execucao.

## Playbook de incidente (fila)

### Broker indisponivel

1. confirmar health do `rabbitmq` no compose.
2. verificar backlog de `integration_outbox_events` pendente.
3. apos restaurar broker, disparar `streamgate:outbox:dispatch`.

### Backlog crescendo na fila principal

1. medir taxa de consumo do worker e latencia media (`worker_processing_metrics`).
2. verificar falhas transitórias recorrentes em storage/rede.
3. revisar `WORKER_MAX_RETRIES` e capacidade de processamento.

### DLQ crescendo

1. consultar `GET /api/v1/quarantine/dlq` por `dead_letter_reason`.
2. separar eventos por `invalid_json`, `max_retries_exceeded`, `unexpected_error`.
3. tratar causa raiz antes de replay manual.
  - suites relevantes de `apps/api`, `apps/web` e `apps/worker`.

## Referencias

- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/)
- [Arquitetura base](C:/estudos/StreamGate/docs/guides/platform/architecture.md)
- [Fundacoes do backend](C:/estudos/StreamGate/docs/guides/backend/backend-foundations.md)
- [Glossario de dominio](C:/estudos/StreamGate/docs/guides/backend/domain-glossary.md)
- [Threat model](C:/estudos/StreamGate/docs/guides/security/streamgate-threat-model.md)
