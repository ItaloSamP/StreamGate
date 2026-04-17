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
- `CI/CD`: GitHub Actions com pipelines separados para frontend, backend, docker e e2e de auth

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

1. Leia o guia de setup em [docs/guides/platform/setup.md](C:/estudos/StreamGate/docs/guides/platform/setup.md).
2. Leia o roadmap executivo em [docs/planning/streamgate-full-sprints-roadmap.md](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md).
3. Copie `.env.example` para `.env` e ajuste os valores locais.
4. Rode `./scripts/bootstrap/check-prereqs.sh`.
5. Suba apenas a infra com `./scripts/dev/dev-up.sh` ou tudo com `./scripts/dev/dev-up.sh full`.

## O que ja esta pronto

- monorepo inicial organizado
- frontend com auth real e base de workspace segmentada
- API Rails com auth real, sessao e reset de senha
- worker Ruby isolado como app do monorepo
- compose validado com perfis `infra` e `full`
- CI separado em quatro workflows
- scripts de bootstrap, dev, ci, compose, smokes e reports organizados por trilha
- hub local de reports/coverage gerado em `docs/reports/index.html`
- roadmap executivo e ADRs de autenticacao documentados
- base de skills ampliada para arquitetura, modelagem de backend, OpenAPI, estrategia de testes, testes de integracao/contrato, CI/CD, infra e seguranca

## CI/CD

Os workflows atuais ficam em `.github/workflows`:

- `frontend-ci.yml`: instala, linta, testa e builda `apps/web`
- `backend-ci.yml`: testa `apps/api` e `apps/worker`
- `docker-ci.yml`: valida o compose e builda as imagens Docker da API e do frontend
- `e2e-auth.yml`: valida auth ponta a ponta com stack de aplicacao + Playwright

## Documentacao

- [Hub de documentacao](C:/estudos/StreamGate/docs/README.md)
- [Visao do produto](C:/estudos/StreamGate/docs/product/vision.md)
- [Arquitetura](C:/estudos/StreamGate/docs/guides/platform/architecture.md)
- [Guia de autenticacao](C:/estudos/StreamGate/docs/guides/backend/authentication-guide.md)
- [Definition of Done](C:/estudos/StreamGate/docs/guides/quality/definition-of-done.md)
- [Baseline de testes e reports](C:/estudos/StreamGate/docs/guides/quality/testing-baseline-sprint-0.md)
- [Baseline de seguranca da Sprint 0](C:/estudos/StreamGate/docs/guides/security/security-baseline-sprint-0.md)
- [Threat model inicial do repositorio](C:/estudos/StreamGate/docs/guides/security/streamgate-threat-model.md)
- [Setup do ambiente](C:/estudos/StreamGate/docs/guides/platform/setup.md)
- [Swagger/OpenAPI da API](C:/estudos/StreamGate/docs/guides/backend/api-docs.md)
- [Roadmap mestre de sprints](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
- [ADR 0001 - Fundacoes de engenharia](C:/estudos/StreamGate/docs/adr/0001-engineering-foundations.md)
- [ADR 0003 - Estrategia de autenticacao e sessao](C:/estudos/StreamGate/docs/adr/0003-authentication-and-session-strategy.md)
- [Closeout Sprint 3](C:/estudos/StreamGate/docs/sprints/SPRINT-03-closeout.md)
- [Planejamento Sprint 4](C:/estudos/StreamGate/docs/planning/streamgate-full-sprints-roadmap.md)
- [Catalogo de skills do projeto](C:/estudos/StreamGate/.agents/skills/README.md)

