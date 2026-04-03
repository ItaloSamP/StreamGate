# Fundacoes do Backend

## Objetivo

Este guia fixa as decisoes operacionais do backend durante a Sprint 0. Ele existe para eliminar ambiguidade antes da implementacao de dominio e endpoints reais.

O backend do StreamGate e composto por:

- `apps/api`: camada HTTP e orquestracao
- `apps/worker`: runtime assincrono de processamento
- `packages/contracts`: fonte compartilhada de contratos, nomes e exemplos

Este documento complementa:

- [Arquitetura base](C:/estudos/StreamGate/docs/guides/architecture.md)
- [ADR 0001 - Fundacoes de engenharia](C:/estudos/StreamGate/docs/adr/0001-engineering-foundations.md)
- [Visao do produto](C:/estudos/StreamGate/docs/product/vision.md)

## Estado atual assumido

Na Sprint 0, o backend ainda esta em fundacao:

- a API Rails esta operacional como esqueleto tecnico
- o worker ainda nao e um runtime de fila real
- o dominio de negocio ainda nao foi implementado
- os contratos compartilhados ainda serao materializados ao longo das proximas sprints

O objetivo aqui nao e adiantar feature. O objetivo e congelar a linguagem e as fronteiras.

## Responsabilidades por camada

### API

A API e a fronteira HTTP do produto. Ela deve:

- autenticar e autorizar chamadas
- emitir URLs assinadas de upload
- registrar uploads, jobs, eventos operacionais e auditoria
- expor leitura operacional e, no momento certo, leitura analitica preparada
- publicar eventos para o worker

A API nao deve:

- receber arquivo massivo para processamento inline
- executar ETL pesado
- esconder regra de dominio dentro de controllers
- acoplar serializacao, politica e acesso a dados na mesma classe

### Worker

O worker e o runtime assincrono do produto. Ele deve:

- consumir eventos de fila
- buscar artefatos no storage
- processar lotes
- validar registros
- atualizar progresso, falha, quarentena e replay
- carregar dados operacionais e analiticos

O worker nao deve:

- se comportar como biblioteca utilitaria sem responsabilidade operacional
- assumir semantica HTTP
- duplicar contratos ja definidos em `packages/contracts`

### Contracts

`packages/contracts` concentra a linguagem compartilhada entre API, worker e frontend:

- nomes oficiais de eventos
- schemas e payloads
- exemplos de mensagens
- nomes de exchanges, filas e routing keys

Enquanto os arquivos reais ainda nao existirem, este guia e a referencia oficial de nomenclatura.

## Convencao arquitetural da API

### Controllers

Controllers existem para traducao HTTP, nao para negocio. Cada controller deve:

- validar contexto HTTP basico
- delegar a um service ou use-case
- aplicar autorizacao via policy
- devolver resposta serializada
- traduzir erros para o envelope padrao da API

Controllers nao devem:

- montar regra de dominio inline
- fazer query complexa diretamente quando isso pertencer a um fluxo de aplicacao
- conhecer detalhes de fila, storage ou analytics

Convencao sugerida:

- namespace por contexto em `app/controllers`
- um controller por recurso ou acao agregadora clara
- actions pequenas e sem branching operacional pesado

### Services e use-cases

Services ou use-cases concentram a orquestracao da aplicacao. Devem:

- representar uma intencao explicita do negocio
- coordenar modelos, contratos externos e publicacao de eventos
- devolver resultado previsivel ou erro de aplicacao claro

Convencao sugerida:

- `app/services/<contexto>/...` para servicos de orquestracao
- `app/use_cases/<contexto>/...` se o time preferir nomear cada fluxo por caso de uso

Regra de consistencia:

- escolher um padrao por contexto e nao misturar nomes equivalentes no mesmo fluxo
- para o StreamGate, a convencao inicial recomendada e `services` como pasta principal, com classes nomeadas pelo caso de uso

Exemplos de nomes futuros:

- `Uploads::CreateSignedUploadService`
- `Jobs::RegisterUploadService`
- `Jobs::RetryJobService`

### Policies

Policies concentram autorizacao. Devem:

- responder quem pode fazer o que
- depender de identidade, papel e contexto do recurso
- permanecer independentes da serializacao da resposta

Convencao sugerida:

- `app/policies`
- uma policy por recurso agregador principal
- escopos de leitura separados quando necessario

### Serializers

Serializers concentram o contrato de saida. Devem:

- expor apenas os campos do contrato publico
- traduzir objetos internos para payload estavel
- manter separacao entre visao operacional e visao analitica

Convencao sugerida:

- `app/serializers`
- serializers distintos para recursos operacionais, recursos analiticos e envelopes compostos

Serializers nao devem:

- executar regra de autorizacao
- carregar dados adicionais por efeito colateral

### Jobs

Jobs da API sao auxiliares de orquestracao. Devem:

- iniciar trabalho assincrono leve ou agendamento
- nunca substituir o worker de processamento pesado
- carregar contexto minimo e rastreavel

Convencao sugerida:

- `app/jobs`
- jobs pequenos, idempotentes e com argumentos serializaveis

Regra pratica:

- se a execucao implicar parse, ETL pesado, carga em lote ou semantica de replay operacional, isso pertence ao worker, nao a um Active Job da API

## Envelope padrao de erro da API

Todo erro exposto pela API deve usar o mesmo envelope:

```json
{
  "error": {
    "code": "resource_conflict",
    "message": "Nao foi possivel concluir a operacao solicitada.",
    "details": [
      {
        "field": "upload_id",
        "reason": "already_processed"
      }
    ],
    "request_id": "req_01HRZP7K3F4N9S2X8A6B1C0D3E",
    "trace_id": "trace_01HRZP7K3F4N9S2X8A6B1C0D3E"
  }
}
```

Campos:

- `code`: identificador estavel e legivel por maquina
- `message`: mensagem segura para consumo humano
- `details`: lista opcional de detalhes por campo, regra ou dependencia
- `request_id`: identificador da requisicao HTTP
- `trace_id`: identificador correlacionavel com logs e eventos

Regras:

- nunca retornar stack trace ao cliente
- usar `code` como contrato, nao a `message`
- manter nomes em `snake_case`
- incluir `details` so quando adicionarem contexto util

Codigos iniciais recomendados:

- `validation_failed`
- `unauthorized`
- `forbidden`
- `not_found`
- `resource_conflict`
- `rate_limited`
- `dependency_unavailable`
- `internal_error`

## Envelope padrao de erro operacional do worker

Erros do worker devem ser registrados em estrutura consistente para logs, auditoria e eventos internos:

```json
{
  "error": {
    "code": "batch_validation_failed",
    "message": "O lote contem registros invalidos.",
    "category": "validation",
    "retryable": false,
    "operation": "etl.process_batch",
    "job_id": "job_01HRZP7K3F4N9S2X8A6B1C0D3E",
    "batch_id": "batch_000042",
    "trace_id": "trace_01HRZP7K3F4N9S2X8A6B1C0D3E",
    "details": {
      "invalid_rows": 17
    }
  }
}
```

Campos minimos:

- `code`
- `message`
- `category`
- `retryable`
- `operation`
- `trace_id`

Campos contextuais quando existirem:

- `job_id`
- `batch_id`
- `upload_id`
- `event_id`
- `details`

Categorias iniciais recomendadas:

- `validation`
- `integration`
- `transient_infra`
- `domain_rule`
- `unexpected`

## Nomenclatura oficial de entidades

### Entidades operacionais

Estas entidades descrevem o estado transacional e auditavel do pipeline:

- `upload`
- `job`
- `batch`
- `quarantine_entry`
- `audit_event`
- `processing_attempt`

Estados operacionais iniciais de `job`:

- `pending`
- `processing`
- `completed`
- `failed`
- `quarantined_with_warnings`

### Entidades analiticas

Estas entidades descrevem dados prontos para consulta agregada:

- `fact_ingestion_record`
- `dim_source_file`
- `dim_processing_time`
- `analytic_metric`

Regra de linguagem:

- nomes operacionais descrevem fluxo e rastreabilidade
- nomes analiticos descrevem leitura, agregacao e consulta
- o mesmo conceito nao deve receber nomes diferentes em frontend, API, worker e contratos

## Campos obrigatorios de rastreabilidade

Os campos abaixo sao obrigatorios sempre que o contexto existir.

### Logs

- `timestamp`
- `level`
- `service`
- `environment`
- `request_id`
- `trace_id`
- `actor_id` quando houver usuario autenticado
- `upload_id` quando a operacao tocar upload
- `job_id` quando a operacao tocar job
- `batch_id` quando a operacao tocar lote
- `event_name` quando houver publicacao ou consumo de evento
- `operation` com nome explicito da acao

### Auditoria

- `audit_event_id`
- `occurred_at`
- `actor_type`
- `actor_id`
- `action`
- `resource_type`
- `resource_id`
- `request_id`
- `trace_id`
- `metadata`

### Eventos

- `event_id`
- `event_name`
- `occurred_at`
- `producer`
- `trace_id`
- `request_id` quando originado por HTTP
- `upload_id` quando aplicavel
- `job_id` quando aplicavel
- `batch_id` quando aplicavel
- `payload_version`

## Limites entre backend e produto

Para manter coesao nas proximas sprints:

- autenticacao, upload assinado, registro de job e leitura operacional pertencem primeiro a API
- ETL, validacao em lote, quarentena e replay pertencem ao worker
- ClickHouse deve ser alimentado por pipeline assincrono, nao por endpoint sincrono
- frontend consome contratos publicados; nao inventa estados fora da linguagem oficial

## Criterio de pronto para mudancas de backend

Uma entrega de backend so e considerada pronta quando:

- respeita estas fronteiras arquiteturais
- atualiza documentacao relevante
- atualiza OpenAPI quando houver endpoint publico
- deixa claro o impacto em logs, auditoria e contratos
- registra qualquer excecao de ambiente ou risco remanescente
