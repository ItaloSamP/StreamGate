# Roadmap DevOps

## Objetivo

Criar uma base que permita:

- desenvolver localmente com previsibilidade
- testar integracoes cedo
- evitar acoplamento entre servicos
- evoluir para deploy em cluster sem reescrever tudo

A baseline operacional consolidada da Sprint 0 esta registrada em [docs/guides/devops-baseline-sprint-0.md](C:/estudos/StreamGate/docs/guides/devops-baseline-sprint-0.md).

## Fase 0: fundacao

Entregas:

- estrutura de monorepo
- `.env.example`
- `compose.yaml`
- scripts de bootstrap para `WSL/Linux` e `PowerShell`
- documentacao de onboarding
- matriz de ambientes suportados e classificacao de falhas conhecidas

## Fase 1: padrao de desenvolvimento

Entregas esperadas:

- `apps/web` gerado com Vite
- `apps/api` gerado com Rails API-only
- `apps/worker` com consumidor RabbitMQ
- padrao de logs estruturados
- contract-first para eventos

## Fase 2: qualidade automatizada

Entregas esperadas:

- lint frontend
- lint Ruby
- testes unitarios
- testes de integracao com compose
- pipeline de pull request no GitHub Actions
- registro claro de falha por ambiente vs falha de implementacao

## Fase 3: observabilidade

Entregas esperadas:

- health endpoints
- metricas de fila
- dashboard de jobs
- logs centralizados
- rastreio de erro por job id

## Fase 4: entrega continua

Entregas esperadas:

- build de imagens Docker
- publicacao em registry
- deploy por ambiente
- segredos por ambiente
- rollback simples

## Fase 5: preparacao para Kubernetes

Entregas esperadas:

- manifests por servico
- readiness e liveness probes
- autoscaling de workers
- segregacao de workloads stateful e stateless

