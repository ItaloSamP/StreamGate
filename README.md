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

## Ambiente recomendado

O projeto agora deve ser tratado como `WSL-first` no Windows.

Recomendacao:

- manter o repositorio principal dentro do filesystem Linux, por exemplo `~/projects/streamgate`
- usar `Docker Desktop` com integracao WSL2 habilitada
- abrir o projeto no VS Code a partir do Ubuntu com `code .`

Os scripts `.sh` em `scripts/` sao o fluxo principal para WSL/Linux.
Os scripts `.ps1` continuam no repositorio como fallback para Windows puro.

## Perfis Docker Compose

O repositorio trabalha com dois modos principais:

- `infra`: sobe apenas PostgreSQL, Redis, RabbitMQ, MinIO, init do MinIO e ClickHouse
- `full`: sobe infra + `api` + `web` + `worker`

## Primeiros passos

1. Leia o guia de setup em [docs/guides/setup.md](C:/estudos/StreamGate/docs/guides/setup.md).
2. Leia o roadmap executivo em [docs/planning/streamgate-full-sprints-roadmap.md](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md).
3. Copie `.env.example` para `.env` e ajuste os valores locais.
4. Rode `./scripts/bootstrap/check-prereqs.sh`.
5. Suba apenas a infra com `./scripts/dev/dev-up.sh` ou tudo com `./scripts/dev/dev-up.sh full`.

## O que ja esta pronto

- monorepo inicial organizado
- frontend gerado, redesenhado e buildando
- API Rails gerada e preparada para PostgreSQL e Swagger/OpenAPI base
- worker Ruby isolado como app do monorepo
- compose validado com perfis `infra` e `full`
- CI separado em tres workflows
- scripts de bootstrap, dev, ci e compose organizados por trilha
- roadmap executivo e ADR inicial documentados
- base de skills do projeto ampliada para arquitetura e modelagem de backend, OpenAPI, estrategia de testes, testes de integracao/contrato, CI/CD e infra

## CI/CD

Os workflows atuais ficam em `.github/workflows`:

- `frontend-ci.yml`: instala, linta e builda `apps/web`
- `backend-ci.yml`: testa `apps/api` e `apps/worker`
- `docker-ci.yml`: valida o compose e builda as imagens Docker da API e do frontend

## Documentacao

- [Hub de documentacao](C:/estudos/StreamGate/docs/README.md)
- [Visao do produto](C:/estudos/StreamGate/docs/product/vision.md)
- [Arquitetura](C:/estudos/StreamGate/docs/guides/architecture.md)
- [Definition of Done](C:/estudos/StreamGate/docs/guides/definition-of-done.md)
- [Baseline de testes da Sprint 0](C:/estudos/StreamGate/docs/guides/testing-baseline-sprint-0.md)
- [Setup do ambiente](C:/estudos/StreamGate/docs/guides/setup.md)
- [Swagger/OpenAPI da API](C:/estudos/StreamGate/docs/guides/api-docs.md)
- [Roadmap mestre de sprints](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
- [ADR 0001 - Fundacoes de engenharia](C:/estudos/StreamGate/docs/adr/0001-engineering-foundations.md)
- [Catalogo de skills do projeto](C:/estudos/StreamGate/.agents/skills/README.md)
