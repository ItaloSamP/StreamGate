# StreamGate

> Ingestão Segura, Assíncrona e Operacional de Lotes.

StreamGate é uma plataforma Enterprise desenvolvida para resolver um problema clássico e doloroso: **Ingestão de grandes volumes de dados**. Ele fornece um pipeline de ponta a ponta assíncrono para o recebimento, processamento, quarentena e ingestão em data warehouses usando ferramentas modernas e arquiteturas distribuídas.

![StreamGate Overview](docs/assets/overview.png) *(Coloque aqui uma screenshot de overview do dashboard)*

## 🚀 O Problema que Resolvemos

A ingestão direta de arquivos grandes ou lotes de APIs em bancos de dados síncronos gera timeouts, instabilidade sistêmica e corrupção de dados. StreamGate atua como um **buffer operacional seguro**:

1. Recebe uploads massivos de arquivos (via painel Web, API, links públicos ou conectores OAuth/S3).
2. Valida os arquivos (verificação de vírus, tamanho, integridade, rate limits).
3. Processa em background (parsing, transformações usando workers).
4. Separa linhas problemáticas (DLQ / Quarentena).
5. Carrega as linhas válidas de forma assíncrona no Data Warehouse (ClickHouse).

---

## 🏗 Arquitetura do Projeto

A stack do StreamGate utiliza a filosofia *best tool for the job*, integrando ferramentas assíncronas para escalar massivamente:

- **Frontend (Web Command Center):** Construído com React, Vite e Tailwind CSS. Uma interface de operador dark-mode, focada em observabilidade (glassmorphism UI, real-time jobs).
- **Backend (API Rails):** Ruby on Rails no modo API. Gerencia uploads (URLs pré-assinadas via S3), Autenticação (Sessões & API Tokens), e atua como orquestrador do RabbitMQ.
- **Worker (Ruby Daemon):** Um consumidor de filas puro (RabbitMQ) que faz o trabalho pesado de parse (CSV, NDJSON, Parquet, Excel) e inserções em lote no ClickHouse.
- **Banco de Dados Relacional:** PostgreSQL para configurações, sessões de usuário, RBAC e rastreabilidade de Jobs/Uploads.
- **Data Warehouse:** ClickHouse. Destinado às cargas analíticas pesadas após a sanitização dos lotes no Worker.
- **Filas e Mensageria:** RabbitMQ para desacoplar a API do Worker (inclui gestão inteligente de DLQ e retry exponencial).
- **Object Storage:** Compatível com S3 (AWS S3 ou MinIO). Mantém os arquivos brutos, e os artefatos de saída do processamento de forma efêmera.

---

## 📂 Organização do Repositório (Monorepo)

O projeto é organizado como um Monorepo para consolidar a evolução do produto em um único ciclo de vida de desenvolvimento:

| Diretório | Responsabilidade | Descrição |
|-----------|-----------------|-----------|
| `apps/api/` | **API Core** | O cérebro do sistema. Fornece contratos OpenAPI, rate-limits, autenticação JWT/OIDC, e emissão de eventos para as filas. |
| `apps/web/` | **Command Center** | O dashboard operacional. Painéis de controle de Jobs, Quarentena de dados e Configurações (ex: OAuth Connectors). |
| `apps/worker/` | **Data Engine** | Runtime daemon sem estado. Consome RabbitMQ, descompacta arquivos e envia dados saudáveis para o ClickHouse. |
| `packages/contracts/` | **Schemas e API** | Contratos agnósticos de schema, arquivos JSON Schema/OpenAPI que definem as transações e payload das filas. |
| `scripts/` | **DevOps & CI** | Scripts para bootstrap local (Docker Compose), automação de pipelines (E2E), linters e verificações de segurança. |
| `docs/` | **Documentação Técnica** | Arquitetura, Playbooks, ADRs (Architecture Decision Records) e Planos de Release. |

> Consulte os `README.md` específicos dentro de cada pasta para saber mais detalhes técnicos, testes e scripts operacionais locais.

---

## ⚡ Fluxo de Ingestão de Dados (Anatomia de um Job)

1. **Upload Request (Frontend -> API):** O frontend solicita uma Signed URL apontando para o Storage.
2. **Transferência Segura (Frontend -> Storage):** O arquivo é subido diretamente pro S3 (bypassando a API em termos de I/O pesado).
3. **Registro do Evento (Frontend -> API):** O frontend notifica que o arquivo foi depositado. A API cadastra a entidade `Upload` e dispara a mensagem `upload.received.v1` pro RabbitMQ.
4. **Consumo e Parse (RabbitMQ -> Worker):** O Worker consome a fila. Baixa o arquivo sob demanda. Ocorre a validação de segurança (Anti-Malware).
5. **Data Split (Worker):** As linhas válidas do arquivo recebem carga massiva no `ClickHouse`. Linhas inválidas sofrem split para a tabela de quarentena.
6. **Notificação de Real-time (Worker -> Frontend):** Notifica os clientes via websocket (ou long-polling) e UI Alerts sobre o fim do lote.

---

## 🛠 Como iniciar localmente

StreamGate usa scripts focados na experiência do desenvolvedor (DX). Certifique-se de ter **Docker**, **Docker Compose** (ou WSL no Windows) instalado.

```bash
# 1. Copie o arquivo de variáveis de ambiente
cp .env.example .env

# 2. Inicialize toda a stack com um único comando:
bash scripts/dev/dev-up.sh full
# ou no Windows PowerShell:
# .\scripts\dev\dev-up.ps1 -Mode full
```

Esse comando sobe: PostGres, ClickHouse, RabbitMQ, S3/MinIO e também inicializa localmente a Web, a API e o Worker.

---

## 🔐 Segurança e Compliance

StreamGate trata segurança como funcionalidade crítica (Tier-0):

- **RBAC (Role-Based Access Control):** Operadores comuns não podem gerenciar Conectores OAuth nem purgar dados analíticos; apenas Administradores.
- **S3 Signed URLs:** O Worker nunca confia plenamente em arquivos recém-chegados. Tudo que entra é analisado.
- **Segredos Isolados:** Nenhum artefato no Frontend exibe access tokens ou senhas armazenados. Todo o fluxo OIDC (Drive, S3, HTTP) é delegado unicamente pelo Backend.
- **Idempotência Garantida:** Jobs concorrentes ou conexões instáveis usam `Idempotency-Key` em todos os fluxos de mutação para evitar duplicação ou corrupção de estado no DB.

---

**StreamGate** — Desenvolvido para lidar com a complexidade do mundo real.
