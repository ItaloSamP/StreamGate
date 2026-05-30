# 🏗️ Infraestrutura

Este diretório contém os artefatos de infraestrutura como código (IaC) e orquestração do StreamGate.

## 🐳 Docker e Orquestração Local

O StreamGate depende de containers Docker para espelhar o ambiente de produção na máquina local.

- **RabbitMQ**: Serviço de mensageria que conecta a API (`publisher`) ao Worker (`consumer`).
- **ClickHouse**: Banco OLAP colunar de altíssima performance para Analytics.
- **PostgreSQL**: Banco de dados relacional (ACID) para o estado transacional do sistema (Auth, Operações, Configurações).
- **Redis** (Opcional/Cache): Para rate-limiting e sessões distribuídas.

A inicialização e teardown completos dessas stacks devem ser gerenciados pelos scripts em `scripts/dev/` e `scripts/compose/`. Nunca rode `docker-compose up` manualmente sem entender as variáveis injetadas pelos scripts de automação.

## 🚢 Kubernetes (Em Breve)

Os manifestos de produção do K8s (Helm/Kustomize) também viverão neste repositório. As aplicações foram construídas segundo a metodologia *12-Factor App*, sendo perfeitamente aderentes a deployments escaláveis nativos em cloud.
