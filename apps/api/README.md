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

Hoje a API ainda esta em fase de fundacao:

- health check disponivel em `GET /up`
- Swagger/OpenAPI inicial preparado em `/api-docs`
- conexao planejada para PostgreSQL via variaveis de ambiente
- dominio de negocio ainda nao implementado

As convencoes oficiais da camada backend nesta fase estao em [docs/guides/backend-foundations.md](C:/estudos/StreamGate/docs/guides/backend-foundations.md).

## Convencao arquitetural adotada

Na Sprint 0, a API passa a assumir estas fronteiras:

- `controllers` traduzem HTTP e delegam fluxo
- `services` ou `use-cases` concentram orquestracao de aplicacao
- `policies` concentram autorizacao
- `serializers` controlam o contrato de saida
- `jobs` da API sao auxiliares leves e nao substituem o worker

O detalhamento completo de envelopes de erro, nomenclatura e rastreabilidade tambem esta no guia de fundacoes do backend.

## Arquivos importantes

- rotas: `config/routes.rb`
- OpenAPI base: `openapi/v1/openapi.yaml`
- inicializacao do rswag: `config/initializers/rswag.rb`

## Fluxo local

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

## Proximo passo esperado

A API deve evoluir nesta ordem:

1. modelagem de dominio e contratos
2. autenticacao real
3. upload assinado e criacao de job
4. leitura operacional e analitica

O backlog executivo detalhado dessa evolucao esta em [docs/planning/streamgate-full-sprints-roadmap.md](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md).
