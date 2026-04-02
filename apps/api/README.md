# StreamGate API

API Rails do StreamGate. Esta aplicacao sera o centro de orquestracao do produto.

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
