# StreamGate

Base inicial do projeto StreamGate, preparada para desenvolvimento local, organizacao em monorepo e evolucao para uma arquitetura orientada a eventos.

## Objetivo

O StreamGate vai receber arquivos massivos, processar tudo de forma assincrona e expor dois tipos de visao:

- operacional, via PostgreSQL
- analitica, via ClickHouse

A stack definida para a base atual e:

- `Frontend`: React + Vite + TypeScript
- `API`: Ruby on Rails API-only
- `Worker`: Ruby dedicado para consumo de eventos e ETL
- `Mensageria`: RabbitMQ
- `Object Storage`: MinIO
- `OLTP`: PostgreSQL
- `OLAP`: ClickHouse
- `Suporte`: Redis
- `Ambiente local`: Docker Compose
- `CI/CD`: GitHub Actions com pipelines separados para frontend, backend e docker

## Estrutura do repositorio

```text
.
|-- apps/
|   |-- api/
|   |-- web/
|   `-- worker/
|-- docs/
|-- infra/
|   `-- k8s/
|-- packages/
|   `-- contracts/
|-- scripts/
|-- compose.yaml
`-- .env.example
```

## Primeiros passos

1. Leia o guia de setup em [docs/setup.md](C:/estudos/StreamGate/docs/setup.md).
2. Copie `.env.example` para `.env` e preencha os valores locais.
3. Rode `./scripts/check-prereqs.ps1`.
4. Suba a infraestrutura com `./scripts/dev-up.ps1`.
5. Inicie o frontend em `apps/web` com `pnpm dev`.
6. Prepare a API em `apps/api` com `bundle exec rails db:prepare`.
7. Suba a API em `apps/api` com `bundle exec rails server`.
8. Rode os testes do worker em `apps/worker` com `bundle exec rspec`.

## O que ja esta pronto

- monorepo inicial organizado
- frontend gerado e buildando
- API Rails gerada e conectavel ao PostgreSQL via variaveis de ambiente
- worker Ruby gerado com testes basicos
- Dockerfiles independentes para frontend e backend
- compose validado
- CI separado em tres workflows

## CI/CD

Os workflows atuais ficam em `.github/workflows`:

- `frontend-ci.yml`: instala, linta e builda `apps/web`
- `backend-ci.yml`: testa `apps/api` e `apps/worker`
- `docker-ci.yml`: valida o compose e builda as imagens Docker da API e do frontend

## Docker

Imagens prontas para validacao no CI:

- [apps/web/Dockerfile](C:/estudos/StreamGate/apps/web/Dockerfile)
- [apps/api/Dockerfile](C:/estudos/StreamGate/apps/api/Dockerfile)

## Documentacao

- [Arquitetura](C:/estudos/StreamGate/docs/architecture.md)
- [Setup do ambiente](C:/estudos/StreamGate/docs/setup.md)
- [Roadmap DevOps](C:/estudos/StreamGate/docs/devops-roadmap.md)
