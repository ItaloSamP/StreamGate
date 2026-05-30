# ⚙️ API Server (Backend)

Esta é a API central do StreamGate, desenvolvida em Ruby on Rails em modo API-only.

## 🏗️ Estrutura de Domínios (Bounded Contexts)

Para suportar alta escalabilidade e isolamento lógico, nossa arquitetura não usa o MVC padrão (pastas globais `models/`, `controllers/`, etc). Em vez disso, organizamos o código por **Domínios de Negócio** dentro de `app/domains/`:

- `auth`: Controllers de sessão, MFA, OIDC, e modelos de usuário.
- `uploads`: Lógica de links públicos, assinaturas S3 e aquisições de conectores.
- `analytics`: Dashboards, snapshotting, Data Warehouse (ClickHouse).
- `operations`: Motor de filas (DLQ), retry de jobs, RBAC de organizações, Webhooks.
- `core`: Classes base como `ApplicationController` e modulos compartilhados (`PrefixedId`).

## 🛠️ Tecnologias e Dependências

- **Ruby** 3.4.0
- **Rails** 8.0.x (API Only)
- **PostgreSQL**: Banco primário para estado transacional.
- **ClickHouse**: OLAP para analytics e reports.
- **RabbitMQ**: Message broker via Bunny/Sneakers.

## 🚀 Como Executar Localmente

Você não precisa rodar comandos Rails isoladamente a menos que deseje debuggar. Use a stack oficial:

```powershell
# Sobe banco, cache, rabbit, clickhouse e o servidor
powershell -ExecutionPolicy Bypass -File ..\..\scripts\dev\dev-up.ps1 -Mode app
```

### Testes
Para garantir que as regras de domínio não foram quebradas:
```bash
bundle exec rails test
```

## 🔐 Políticas de Segurança

- **Nenhum Token Vazado**: Conectores OIDC e OAuth nunca expõem tokens no payload de resposta da API.
- **Auditoria Obrigatória**: Todas as ações operacionais devem gerar um `AuditEvent` usando o service correspondente no domínio `operations`.
