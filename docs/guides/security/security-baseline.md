# Baseline De Seguranca

Este guia define os controles minimos de seguranca para evoluir e fechar o StreamGate com clareza operacional.

## Estado Atual

O produto ja possui auth real, RBAC, upload assinado, public link, conectores S3/HTTP, worker RabbitMQ, ClickHouse, dashboard realtime, exports, alert actions, artefatos, notificacoes, safe operations e auditoria.

Riscos centrais:

- segredo real em docs, fixtures, screenshots, logs ou reports;
- role/org scope quebrado em dashboard, audit, DLQ, operations ou connectors;
- SSRF em public link ou HTTP connector;
- payload sensivel em exports, realtime events, warnings, audit ou notifications;
- defaults locais promovidos para ambiente compartilhado;
- evento interno fora de contrato;
- arquivo hostil afetando worker, storage ou ClickHouse.

## Controles Obrigatorios

### Segredos

- `.env` real nunca deve ser commitado.
- `.env.example` deve conter apenas valores de desenvolvimento.
- Credenciais S3/HTTP ficam criptografadas e nunca retornam em API/UI/event/log.
- Variavel enviada ao frontend deve ser tratada como publica.
- PRs devem revisar docs, examples, reports e screenshots para evitar vazamento.

### Auth E RBAC

- API e fonte de verdade para sessao e permissao.
- Frontend deve tratar 401/403 como estado operacional, nao como fallback silencioso.
- `admin` acessa audit, DLQ, operations e conectores.
- `operator` acessa leitura operacional escopada e nao ve controles sensiveis.
- Rota direta admin-only deve renderizar denied, nao dados parciais.

### Mutacoes Sensiveis

- Exigir `Idempotency-Key`.
- Exigir motivo operacional quando aplicavel.
- Registrar audit event.
- Aplicar policy por role/org.
- Mascarar payload de entrada/saida.

Inclui: retry, resolve, replay DLQ, dashboard exports, alert review/dismiss, connector profile/test/ingestion e webhook test.

### Uploads E Conectores

- Content type por allowlist.
- Checksum/idempotencia no registro de upload.
- Public link e HTTP connector bloqueiam localhost, private, link-local e metadata hosts.
- Redirects devem ser validados.
- ZIP aceita exatamente um arquivo suportado e bloqueia zip slip/zip bomb.
- Worker usa tempfile/spool controlado e cleanup best effort.

### Dados E Exports

- ClickHouse nao recebe payload bruto sensivel.
- Exports CSV/JSON usam masking operacional.
- JSON previews ficam colapsados quando carregam metadata/payload.
- IDs copiaveis devem ser operacionais e seguros.

## Scanners E Gates

- API: `bundle exec brakeman -q`.
- Ruby dependencies: `bundle exec bundle-audit check --update` quando disponivel.
- Frontend: `pnpm audit --prod` quando aplicavel ao pacote.
- Contratos: `ruby scripts/ci/validate-operational-contracts.rb`.
- Gates coordenados: `ci-local backend`, `ci-local frontend`, `run-smokes` e `run-all-reports -Profile full-closeout`.

## Checklist De Revisao

Antes de merge relevante:

- [ ] auth/RBAC revisado;
- [ ] masking revisado;
- [ ] OpenAPI/contracts revisados;
- [ ] threat model atualizado se nova superficie foi aberta;
- [ ] docs e examples sem segredo real;
- [ ] smokes executados quando runtime foi tocado;
- [ ] falhas classificadas como `implementation`, `environment` ou `external`.

## Gaps Aceitos Para Release

- Hardening produtivo de cookies/CSRF/TLS depende do desenho de deploy.
- Secret manager produtivo e egress policy entram no desenho de infraestrutura posterior.
- Google Drive e OAuth delegado entram como superficie funcional de release, com tokens criptografados no backend e sem credenciais em UI, eventos, exemplos ou reports.
- Malware scanning, quotas por org e fuzzing amplo de parsers devem ser avaliados apos o pente fino final.

## Referencias

- [Threat model](streamgate-threat-model.md)
- [Definition of Done](../quality/definition-of-done.md)
- [Testing baseline](../quality/testing-baseline.md)
- [DevOps baseline](../platform/devops-baseline.md)
