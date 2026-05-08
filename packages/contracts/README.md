# StreamGate Contracts

Pacote de contratos compartilhados entre API, worker, frontend e validadores operacionais.

## Papel

`packages/contracts` reduz drift entre implementacao, OpenAPI, eventos e exemplos. Qualquer endpoint, evento ou payload operacional relevante deve ter schema e exemplo versionados quando fizer parte do contrato publico ou interservico.

## Estrutura

```text
packages/contracts/
|-- version.json
|-- COMPATIBILITY.md
|-- schemas/
|   |-- http/
|   |   |-- shared/
|   |   |-- uploads/
|   |   |-- operational-reads/
|   |   |-- operations/
|   |   |-- connectors/
|   |   |-- saas/
|   |   |-- artifacts/
|   |   `-- notifications/
|   `-- events/
|       |-- uploads/
|       `-- connectors/
`-- examples/
    |-- http/
    `-- events/
```

## Dominios Cobertos

- Uploads: signed URL, registro idempotente, public link e listagem.
- Operational reads: jobs, uploads, analytics, dashboard, warehouse, lineage, quarantine, audit, DLQ e realtime events.
- Operations: retry, resolve, replay DLQ, exports e alert actions.
- Connectors: profiles admin-only, ingestions e leases internos sem credencial de lease em claro nos eventos.
- SaaS readiness: centro admin de release para identidade, quotas, conectores, AWS EKS, observabilidade open-source, SOC 2 Type I e bloqueios externos sem segredos.
- Artifacts: listagem e signed download URL curta.
- Notifications: inbox, bulk actions, settings e deliveries.
- Events: upload received, public link requested e connector ingestion requested.

## Convencoes

- Schemas usam versionamento semantico no nome, por exemplo `analytics-dashboard-response.v1.json`.
- Exemplos devem representar payloads reais, mascarados e seguros.
- Campos sensiveis devem ser omitidos ou mascarados no contrato exposto.
- Eventos devem carregar `event_id`, `event_name`, `payload_version`, `occurred_at`, `trace_id`, `request_id` e IDs de recurso quando aplicavel.
- Contratos HTTP usam envelope `data` e `meta` quando aplicavel.

## Validacao

Na raiz do repositorio:

```bash
ruby scripts/ci/validate-operational-contracts.rb
```

Esse gate compara schemas, exemplos, OpenAPI e arquivos esperados para evitar drift silencioso.

## Compatibilidade

Consulte [COMPATIBILITY.md](COMPATIBILITY.md).

Regra pratica:

- adicionar campo opcional e compativel e aceitavel;
- remover campo, alterar tipo ou mudar semantica exige novo contrato/versionamento;
- endpoints ou eventos novos entram com schema, exemplo e referencia em docs no mesmo ciclo.

## Referencias

- [API docs](../../docs/guides/backend/api-docs.md)
- [Domain glossary](../../docs/guides/backend/domain-glossary.md)
- [Backend foundations](../../docs/guides/backend/backend-foundations.md)
