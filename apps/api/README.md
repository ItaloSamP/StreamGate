# StreamGate API

Rails API-only responsavel por autenticacao, autorizacao, contratos HTTP, orquestracao de ingestao, auditoria, dashboard operacional e integracao com o worker.

## Responsabilidades

- Emitir signed URLs e registrar uploads/jobs de forma idempotente.
- Validar auth, RBAC, organization scope e acoes sensiveis.
- Expor leituras operacionais: jobs, uploads, analytics, dashboard, warehouse, lineage, quarantine, DLQ, audit, events e artifacts.
- Persistir warnings, exports, realtime events, connector profiles, connector ingestions e leases internos.
- Servir OpenAPI em `/api-docs` e manter `apps/api/openapi/v1/openapi.yaml` como contrato publico.
- Garantir masking de payloads, headers, URLs, object keys e credenciais antes de resposta, evento ou log.

Processamento pesado de arquivo pertence ao worker. A API orquestra, valida, audita e publica eventos.

## Superficies HTTP Principais

- Auth: `register`, `login`, `logout`, `me`, `session/refresh`, reset de senha.
- Upload/job: signed URL, registro de upload, `public_link`, listagem de uploads e jobs.
- Analytics: dashboard expandida, warehouse ClickHouse/fallback, lineage, KPIs e breakdowns.
- Realtime: tickets curtos e polling de eventos persistentes.
- Dashboard actions: exports CSV/JSON, alert review e alert dismiss.
- Operacao segura: retry, resolve e replay DLQ com request/approve/execute.
- Connectors: perfis S3/HTTP admin-only, teste, ingestions e lease interno para worker.
- Artifacts: listagem e signed download URL curta.
- Notifications: inbox, arquivo, delete, acoes em massa, settings e teste de webhook.

## Dados E Modulos

| Dominio | Modelos principais |
| --- | --- |
| Auth | `User`, `AuthSession` |
| Ingestao | `Upload`, `Job`, `JobBatch`, `ProcessingAttempt` |
| Qualidade | `QuarantineRecord`, `OperationalWarning` |
| Operacao | `AuditEvent`, `SafeOperationRequest`, `Notification` |
| Artefatos | `JobArtifact` |
| Command center | `RealtimeEvent`, `DashboardExport` |
| Conectores | `ConnectorProfile`, `ConnectorIngestion`, `ConnectorLease` |

## Arquitetura Interna

- `controllers`: traduzem HTTP, auth e parametros.
- `services`: concentram orquestracao de aplicacao.
- `policies`: concentram autorizacao por role/org.
- `serializers`: definem contratos de saida e masking.
- `jobs`: tarefas leves da API, sem ETL pesado.
- `channels`: canal realtime autenticado por ticket curto.

## Desenvolvimento Local

Em desenvolvimento e teste, a API carrega automaticamente o `.env` da raiz do repositorio durante o boot, sem sobrescrever variaveis ja exportadas no processo. Use `STREAMGATE_SKIP_DOTENV=1` apenas quando quiser testar explicitamente um ambiente sem esse carregamento local.

```bash
bundle install
bundle exec rails db:prepare
bundle exec rails db:seed
bundle exec rails server
```

Endpoints uteis:

- Health: <http://localhost:3000/up>
- OpenAPI UI: <http://localhost:3000/api-docs>

## Qualidade

```bash
bundle exec rails test
bundle exec rubocop
bundle exec brakeman -q
```

Gate coordenado na raiz:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend
```

Contratos:

```bash
ruby scripts/ci/validate-operational-contracts.rb
```

## Regras De Evolucao

- Endpoint novo ou alterado exige OpenAPI, contratos e exemplos sincronizados.
- Mutacoes sensiveis exigem RBAC, motivo quando aplicavel, auditoria e `Idempotency-Key`.
- Eventos realtime e exports nunca devem carregar payload bruto sensivel.
- Conectores nunca retornam credenciais, secrets, bucket/key completo ou headers sensiveis.
- Fallback operacional deve ser explicito: `live`, `derived`, `empty`, `degraded`, `backend-pending` ou equivalente contratual.

## Referencias

- [API docs](../../docs/guides/backend/api-docs.md)
- [Backend foundations](../../docs/guides/backend/backend-foundations.md)
- [Authentication guide](../../docs/guides/backend/authentication-guide.md)
- [Domain glossary](../../docs/guides/backend/domain-glossary.md)
- [Threat model](../../docs/guides/security/streamgate-threat-model.md)
- [Contracts](../../packages/contracts/README.md)
