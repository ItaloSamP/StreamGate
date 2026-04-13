# Runbook: Worker Runtime

## Objetivo
Este guia consolida diretrizes de worker runtime runbook para uso consistente no projeto.

## Estado atual
Conteudo alinhado ao fechamento da Sprint 3 e ao planejamento da Sprint 4; atualizar em cada mudanca relevante.


## Regras/Contratos
- As regras normativas deste tema estao descritas nas secoes tecnicas abaixo.
- Mudancas devem manter alinhamento com roadmap, ADRs e READMEs.

## Validacao/Evidencias
- Validar coerencia com README raiz, docs/README e roadmap da release atual.
- Registrar atualizacoes desta pagina no closeout da sprint correspondente.


## Objetivo detalhado

Padronizar operacao, diagnostico e resposta a incidentes da trilha de runtime real do worker na Sprint 4.

## Estado atual detalhado

- ate o fechamento da Sprint 3, o worker ainda nao consome fila em runtime real.
- este runbook define o baseline operacional exigido para abrir a trilha de execucao real na Sprint 4.

## Regras e contratos operacionais

- trilha minima da Sprint 4:
  - consumo real de fila do broker;
  - processamento de evento com transicao de estado de job;
  - registro de erros com `trace_id`, `request_id`, `job_id` e `upload_id`.
- escopo fora da Sprint 4:
  - conectores `external_link`, `oauth_delegated`, `google_drive`, `s3`, `http_url`;
  - automacao de cluster e reprocessamento avancado.
- qualquer mudanca em runtime deve manter sincronia com:
  - `packages/contracts`;
  - `apps/api/openapi/v1/openapi.yaml` (quando houver reflexo em API);
  - roadmap mestre e closeout da sprint.

## Procedimentos operacionais

### 1. Startup e validacao inicial

1. subir stack `full` (`api`, `web`, `worker`, infra).
2. validar conectividade com broker e storage.
3. validar health operacional da API (`/up`) e status de dependencias no compose.

### 2. Diagnostico de falhas

1. coletar `trace_id`/`request_id` do erro.
2. localizar `job_id` e `upload_id` correlatos.
3. classificar falha:
   - ambiente (infra/rede/host);
   - implementacao (regra/codigo/contrato).
4. registrar classificacao no fechamento da sprint.

### 3. Retry e recuperacao

1. aplicar retry apenas para falhas `retryable`.
2. evitar duplicacao de carga com idempotencia baseada em chaves do dominio.
3. quando necessario, escalar para replay controlado com trilha de auditoria.

## Validacao e evidencias

- evidencias minimas da trilha:
  - comandos executados;
  - status dos servicos;
  - resultado por camada (API, worker, integração);
  - classificacao ambiente vs implementacao.
- comandos de referencia:
  - `python scripts/compose/compose-smoke.py`
  - `python scripts/compose/upload-signed-smoke.py`
  - suites relevantes de `apps/api`, `apps/web` e `apps/worker`.

## Referencias

- [Roadmap mestre](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
- [Arquitetura base](C:/estudos/StreamGate/docs/guides/platform/architecture.md)
- [Fundacoes do backend](C:/estudos/StreamGate/docs/guides/backend/backend-foundations.md)
- [Glossario de dominio](C:/estudos/StreamGate/docs/guides/backend/domain-glossary.md)
- [Threat model](C:/estudos/StreamGate/docs/guides/security/streamgate-threat-model.md)