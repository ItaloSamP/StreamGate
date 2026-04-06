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

Depois da primeira execucao de backend da Sprint 1, a API ja saiu do esqueleto puro e passou a ter fundacao de dominio executavel:

- health check disponivel em `GET /up`
- OpenAPI inicial preparado em `/api-docs`
- dominio operacional base materializado com `User`, `Upload`, `Job`, `JobBatch`, `QuarantineRecord`, `ProcessingAttempt` e `AuditEvent`
- migration inicial com constraints, indices e rastreabilidade
- esqueleto de `services`, `policies` e `serializers`
- seeds e fixtures minimas para desenvolvimento e testes
- suite inicial de Minitest cobrindo validacoes, transicoes de estado e service de registro de upload

As convencoes oficiais da camada backend nesta fase estao em [docs/guides/backend-foundations.md](C:/estudos/StreamGate/docs/guides/backend-foundations.md), [docs/guides/domain-glossary.md](C:/estudos/StreamGate/docs/guides/domain-glossary.md) e [docs/adr/0002-domain-boundaries-identifiers-and-contracts.md](C:/estudos/StreamGate/docs/adr/0002-domain-boundaries-identifiers-and-contracts.md).

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
- OpenAPI base: `openapi/v1/openapi.yaml`
- modelos de dominio: `app/models/`
- servicos de aplicacao: `app/services/`
- politicas de acesso: `app/policies/`
- serializers: `app/serializers/`
- migration inicial da Sprint 1: `db/migrate/20260405000100_create_streamgate_domain_foundations.rb`

## Fluxo local

Com o PostgreSQL local disponivel:

```bash
bundle install
bundle exec rails db:prepare
bundle exec rails server
```

Com a app rodando localmente:

- health: [http://localhost:3000/up](http://localhost:3000/up)
- docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Testes e qualidade

```bash
bundle exec rails test
bundle exec rubocop
bundle exec brakeman
```

No ambiente local atual, a validacao da Sprint 1 foi executada com PostgreSQL via `docker compose up -d postgres`.

## Proximo passo esperado

A API deve evoluir nesta ordem:

1. consolidar auth real e `me`
2. abrir upload assinado e criacao de job sobre o dominio ja materializado
3. conectar worker real aos contratos versionados
4. expor leitura operacional e, depois, leitura analitica

O backlog executivo detalhado dessa evolucao esta em [docs/planning/streamgate-full-sprints-roadmap.md](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md).
