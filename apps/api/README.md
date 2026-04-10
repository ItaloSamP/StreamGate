# StreamGate API

API Rails do StreamGate. Esta aplicacao e o centro de orquestracao do produto.

## Papel da API

A API e responsavel por:

- autenticacao e autorizacao
- emissao de URL assinada para upload
- criacao e consulta de uploads, jobs e auditoria
- leitura da visao operacional
- exposicao futura da visao analitica preparada

A API nao deve assumir processamento pesado de arquivo. Esse trabalho pertence ao worker.

## Estado atual

Depois do fechamento da Sprint 3, a API possui auth real + trilha base de upload/job:

- health check disponivel em `GET /up`
- OpenAPI v1 servido em `/api-docs`
- dominio operacional base materializado com `User`, `Upload`, `Job`, `JobBatch`, `QuarantineRecord`, `ProcessingAttempt` e `AuditEvent`
- autenticacao real com `register`, `login`, `logout`, `me`, `session/refresh` e reset de senha
- tabela de sessao persistida (`auth_sessions`) com expiracao e revogacao
- hardening inicial com rate limit configuravel por env para login/register/reset
- endpoints de upload/job reais:
  - `POST /api/v1/uploads/signed-url`
  - `POST /api/v1/uploads`
  - `GET /api/v1/uploads`
  - `GET /api/v1/jobs`
- idempotencia no registro de upload por `storage_key + checksum_sha256`
- validacao de objeto no storage antes de registrar upload/job
- paginacao padrao com `data + meta.pagination + meta.filters`
- seeds e fixtures minimas para desenvolvimento e testes
- suite de Minitest cobrindo validacoes de dominio e fluxo de auth

As convencoes oficiais desta fase estao em [docs/guides/backend-foundations.md](C:/estudos/StreamGate/docs/guides/backend-foundations.md), [docs/guides/authentication-guide.md](C:/estudos/StreamGate/docs/guides/authentication-guide.md), [docs/guides/domain-glossary.md](C:/estudos/StreamGate/docs/guides/domain-glossary.md) e [docs/adr/0003-authentication-and-session-strategy.md](C:/estudos/StreamGate/docs/adr/0003-authentication-and-session-strategy.md).

## Convencao arquitetural adotada

A API assume estas fronteiras:

- `controllers` traduzem HTTP e delegam fluxo
- `services` concentram orquestracao de aplicacao
- `policies` concentram autorizacao
- `serializers` controlam o contrato de saida
- `jobs` da API sao auxiliares leves e nao substituem o worker

O detalhamento completo de envelopes de erro, sucesso, nomenclatura e rastreabilidade tambem esta no guia de fundacoes do backend.

## Arquivos importantes

- rotas: `config/routes.rb`
- OpenAPI: `openapi/v1/openapi.yaml`
- modelos de dominio: `app/models/`
- servicos de aplicacao: `app/services/`
- politicas de acesso: `app/policies/`
- serializers: `app/serializers/`
- migrations base:
  - `db/migrate/20260405000100_create_streamgate_domain_foundations.rb`
  - `db/migrate/20260406000100_add_authentication_foundations.rb`

## Fluxo local

Com o PostgreSQL local disponivel:

```bash
bundle install
bundle exec rails db:prepare
bundle exec rails db:seed
bundle exec rails server
```

Com a app rodando localmente:

- health: [http://localhost:3000/up](http://localhost:3000/up)
- docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Testes e qualidade

```bash
bundle exec rails test
bundle exec rails test test/requests/uploads_jobs_flow_test.rb
bundle exec rails test test/requests/auth_flow_test.rb
bundle exec rubocop
bundle exec brakeman
```

## Proximo passo esperado

A API deve evoluir nesta ordem:

1. ampliar cobertura operacional (analytics/quarantine/audit) sobre a base upload/job ja entregue
2. conectar worker real aos contratos versionados
3. abrir ingestao por link/conector em sprint posterior (3.x/4)

O backlog executivo detalhado dessa evolucao esta em [docs/planning/streamgate-full-sprints-roadmap.md](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md).

## Gate de prontidao da Sprint 2.5

A Sprint 2.5 nao abriu endpoints de negocio novos. O foco foi alinhar prontidao estrutural para Sprint 3:

- congelamento do namespace alvo para trilha upload/job base em /api/v1;
- alinhamento de envs oficiais de upload em setup/compose/CI;
- hardening de logs para reduzir risco de vazamento de URL assinada e segredos.
