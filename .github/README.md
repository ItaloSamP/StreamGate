# 🚀 Infraestrutura & CI/CD (GitHub Actions)

Este repositório consolida as rotinas de integração contínua (CI) e deploy contínuo (CD) do StreamGate.

## 🛠️ Workflows

Todos os pipelines são configurados de maneira declarativa em `.github/workflows/`.

- `ci.yml`: O principal fluxo de Continuous Integration. Roda os testes do Command Center, API, Worker e checa os Contratos.
- `deploy.yml`: Flow de release (em breve detalharemos as esteiras de staging e prod).

## 🛡️ Políticas Operacionais

1. **Nenhum Deploy Manual**: Todas as mutações na infraestrutura ocorrem exclusivamente pela esteira automatizada.
2. **Testes de Integração**: Uma release não pode ser mesclada em `main` se as rotinas da API e do Command Center quebrarem (incluindo End-to-End).

## 🚢 Docker & Composição

Para facilitar os builds, confiamos em orquestração via `docker-compose` (presente em nossos scripts oficiais na raiz do projeto). Ele assegura que o Worker consiga conversar com o RabbitMQ, ClickHouse, Postgres, simulando o ambiente produtivo.
