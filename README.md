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

O repositorio agora trabalha com dois modos principais:

- `infra`: sobe apenas PostgreSQL, Redis, RabbitMQ, MinIO, init do MinIO e ClickHouse
- `full`: sobe infra + `api` + `web` + `worker`

Os servicos de aplicacao usam os profiles `app` e `full`, entao `app` e `full` funcionam como aliases para desenvolvimento completo.

## Primeiros passos

1. Leia o guia de setup em [docs/setup.md](C:/estudos/StreamGate/docs/setup.md).
2. Copie `.env.example` para `.env` e ajuste os valores locais.
3. Rode `./scripts/check-prereqs.sh`.
4. Suba apenas a infra com `./scripts/dev-up.sh` ou tudo com `./scripts/dev-up.sh full`.
5. Se quiser usar apenas o compose diretamente, rode `docker compose up -d` para infra ou `docker compose --profile full up -d` para o ambiente completo.

## O que ja esta pronto

- monorepo inicial organizado
- frontend gerado e buildando
- API Rails gerada e conectavel ao PostgreSQL via variaveis de ambiente
- worker Ruby gerado com testes basicos
- Dockerfiles independentes para frontend e backend
- compose validado
- CI separado em tres workflows
- scripts de bootstrap para `WSL/Linux` e `PowerShell`
- profiles `infra` e `full` para desenvolvimento local

## CI/CD

Os workflows atuais ficam em `.github/workflows`:

- `frontend-ci.yml`: instala, linta e builda `apps/web`
- `backend-ci.yml`: testa `apps/api` e `apps/worker`
- `docker-ci.yml`: valida o compose e builda as imagens Docker da API e do frontend


Para reproduzir esses workflows localmente com um comando e um relatorio detalhado:

- WSL/Linux: `./scripts/ci-local.sh`
- PowerShell: `.\scripts\ci-local.ps1`

Tambem e possivel rodar apenas um workflow:

- `./scripts/ci-local.sh frontend`
- `./scripts/ci-local.sh backend`
- `./scripts/ci-local.sh docker`
## Docker

Imagens prontas para validacao no CI:

- [apps/web/Dockerfile](C:/estudos/StreamGate/apps/web/Dockerfile)
- [apps/api/Dockerfile](C:/estudos/StreamGate/apps/api/Dockerfile)
- [apps/web/Dockerfile.dev](C:/estudos/StreamGate/apps/web/Dockerfile.dev)
- [apps/api/Dockerfile.dev](C:/estudos/StreamGate/apps/api/Dockerfile.dev)
- [apps/worker/Dockerfile.dev](C:/estudos/StreamGate/apps/worker/Dockerfile.dev)

## Documentacao

- [Arquitetura](C:/estudos/StreamGate/docs/architecture.md)
- [Setup do ambiente](C:/estudos/StreamGate/docs/setup.md)
- [Roadmap DevOps](C:/estudos/StreamGate/docs/devops-roadmap.md)


