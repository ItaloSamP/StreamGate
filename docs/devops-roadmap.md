# Roadmap DevOps

## Objetivo

Criar uma base que permita:

- desenvolver localmente com previsibilidade
- testar integracoes cedo
- evitar acoplamento entre servicos
- evoluir para deploy em cluster sem reescrever tudo

## Fase 0: fundacao

Entregas:

- estrutura de monorepo
- `.env.example`
- `compose.yaml`
- scripts PowerShell de bootstrap
- documentacao de onboarding

## Fase 1: padrao de desenvolvimento

Entregas sugeridas:

- `apps/web` gerado com Vite
- `apps/api` gerado com Rails API-only
- `apps/worker` com consumidor RabbitMQ
- padrao de logs estruturados
- contract-first para eventos

## Fase 2: qualidade automatizada

Entregas sugeridas:

- lint frontend
- lint Ruby
- testes unitarios
- testes de integracao com compose
- pipeline de pull request no GitHub Actions

## Fase 3: observabilidade

Entregas sugeridas:

- health endpoints
- metricas de fila
- dashboard de jobs
- logs centralizados
- rastreio de erro por job id

## Fase 4: entrega continua

Entregas sugeridas:

- build de imagens Docker
- publicacao em registry
- deploy por ambiente
- segredos por ambiente
- rollback simples

## Fase 5: preparacao para Kubernetes

Entregas sugeridas:

- manifests por servico
- readiness e liveness probes
- autoscaling de workers
- segregacao de workloads stateful e stateless
