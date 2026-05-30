<div align="center">
  <img src="https://via.placeholder.com/150" alt="StreamGate Logo" width="150"/>
  <h1>🌊 StreamGate</h1>
  <p><strong>Plataforma Definitiva de Ingestão e Segurança de Ativos em Larga Escala</strong></p>
</div>

---

O **StreamGate** é uma plataforma robusta projetada para ingestão massiva, segurança em tempo real, e análise de dados em ambientes operacionais distribuídos. Com foco na resiliência e entrega segura (zero-trust), ele atua como o principal portão de entrada para uploads institucionais garantindo que todo arquivo passe por varreduras de malware e fluxos granulares de conformidade.

## 🌟 O Valor de Negócio (Visão do Produto)

Na era digital, aceitar arquivos do mundo exterior é um risco constante. O **StreamGate** elimina esta fricção oferecendo:
1. **Ambiente Isolado (Quarentena)**: Uploads suspeitos ficam retidos. Zero chance de infecção para a rede da corporação.
2. **Ingestão Multi-Canal**: Via Web (drag-and-drop), links públicos anônimos, ou conectores nativos para Google Drive e S3.
3. **Analytics em Tempo Real**: Visão imediata do comportamento de tráfego (Volume, Ameaças mitigadas) extraído em relatórios ricos de inteligência (OLAP ClickHouse).

## 🧩 Arquitetura Tecnológica

Construído sob os preceitos do **Domain-Driven Design (DDD)** e arquitetura de microsserviços, com separação brutal de responsabilidades e Segurança desde o Código (Security-by-Design):

- 🎨 **[Command Center (`apps/web`)](docs/README.md)**: Aplicação frontend imersiva usando React, Vite, Tailwind CSS e TypeScript (Feature-Sliced Design). Focada em painéis de telemetria, exploração analítica e controle de acesso seguro.
- ⚙️ **[API Server (`apps/api`)](docs/README.md)**: O cérebro transacional. Feito em Ruby on Rails em modo estrito de API. Gerencia Autenticação, Operações baseadas em RBAC, Conectores OIDC e garante idempotência (`Idempotency-Key`).
- 👷 **[Data Worker (`apps/worker`)](docs/README.md)**: Motor escalável (Ruby puro) que consome massas de eventos do RabbitMQ e as integra com o ecossistema externo (ClamAV para antivírus) gravando resultados agressivamente em bancos OLAP (ClickHouse) ou S3.
- 📜 **[Contracts (`packages/contracts`)](docs/README.md)**: A fonte da verdade para comunicação HTTP. Esqueça ambiguidades: o OpenAPI v3 rege todas as interações do ecossistema.

> 👉 **Mergulhe fundo na nossa infraestrutura no [Hub Central de Documentação](docs/README.md).**

Ou acesse os guias fundamentais da plataforma:
- 📖 **[Manual do Usuário Final](docs/guides/user-manual.md)** (Operações do Command Center)
- 🏗️ **[Arquitetura do Sistema](docs/guides/architecture.md)** (Topologia dos Microsserviços e Eventos)
- 🛠️ **[DevOps Runbook](docs/guides/devops-runbook.md)** (Troubleshooting, ArgoCD, e Helm)

## 🚀 Como Iniciar o Desenvolvimento

A inicialização foi desenhada para oferecer uma réplica 100% fidedigna da produção através de contêineres e automações avançadas.

### 1. Requisitos
- Docker Engine & Docker Compose
- Windows PowerShell (ou Bash no macOS/Linux)

### 2. Inicialização Completa (App Stack)

Suba o cluster de infra (Postgres, RabbitMQ, Redis, ClickHouse, Minio) e os serviços das aplicações de forma assistida:

No Windows (PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev\dev-up.ps1 -Mode full
```

No Linux/Mac (Bash):
```bash
bash scripts/dev/dev-up.sh full
```

### 3. Validação e CI Local (Integração Contínua)

O repositório é guardado por fluxos restritos. É obrigatório testar os pacotes antes de submeter PRs. Acesse o **[Guia de Scripts](scripts/README.md)** para mais detalhes.

```powershell
# Execução unitária das ferramentas
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 frontend
powershell -ExecutionPolicy Bypass -File .\scripts\ci\ci-local.ps1 backend

# Para fechamento completo (Testes ponta a ponta e auditoria)
powershell -ExecutionPolicy Bypass -File .\scripts\reports\run-all-reports.ps1 -Profile full-closeout
```

## 🔐 Compromisso com a Segurança

Toda e qualquer rota operacional mutável na API requer controle de acesso `Role-Based (RBAC)` e gera trilhas de auditoria criptograficamente isoladas. Nenhuma exceção é permitida para bypassar o fluxo de quarentena. Para mais informações, acesse o painel de **Security & SaaS** na inicialização do sistema.
