# 🌊 StreamGate

O **StreamGate** é uma plataforma robusta projetada para ingestão escalável, processamento seguro e análise de grandes volumes de dados de streaming e eventos.

## 🌟 Arquitetura

O sistema é dividido em aplicações (apps) independentes que compartilham pacotes comuns:

- **Command Center (`apps/web`)**: Painel de administração e frontend do usuário final (React, Vite, Tailwind CSS). Focado na usabilidade, monitoramento de jobs, links públicos e gestão de contas.
- **API Server (`apps/api`)**: Core backend (Ruby on Rails). Responsável por gerenciar todo o ciclo de vida da aplicação de forma síncrona. Organizado sob o padrão de **Domínios (Bounded Contexts)**.
- **Worker (`apps/worker`)**: Processamento assíncrono (Ruby puro). Focado na resiliência e alto desempenho no consumo de filas via RabbitMQ e inserções no ClickHouse.
- **Contracts (`packages/contracts`)**: Contratos unificados usando OpenAPI.

👉 Para visualizar todos os componentes detalhados do sistema, visite o nosso **[Hub de Documentação](docs/README.md)**.

## ⚙️ Bounded Contexts

Toda a arquitetura é orientada a domínios:
- `Auth`: Gestão de identidade e acessos.
- `Uploads`: Manipulação e segurança de ativos digitais.
- `Analytics`: Dashboards, métricas e integração OLAP (ClickHouse).
- `Operations`: Quarentenas, notificações, DLQ e auditoria.

## 🚀 Como Iniciar

O StreamGate possui ferramentas poderosas para facilitar o bootstraping de toda a stack local.

### Inicialização (App Stack Completa)

No Windows (PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev\dev-up.ps1 -Mode full
```

No Linux/Mac (Bash):
```bash
bash scripts/dev/dev-up.sh full
```

### Pipelines de Integração (CI Local)

Execute os pipelines localmente para garantir qualidade:
```powershell
# Frontend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend

# Backend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend

# Testes E2E e Smokes
powershell -ExecutionPolicy Bypass -File .\scripts\smokes\run-smokes.ps1
```

> **Nota:** Nunca espalhe chamadas HTTP fora dos contratos oficiais. Mutacoes sensíveis exigem `Idempotency-Key` e auditoria em todos os domínios.
