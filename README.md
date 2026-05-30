<div align="center">
  <img src="https://via.placeholder.com/150" alt="StreamGate Logo" width="150"/>
  <h1>🌊 StreamGate</h1>
  <p><strong>Plataforma Definitiva de Ingestão e Segurança de Ativos em Larga Escala</strong></p>
</div>

---

O **StreamGate** é uma plataforma robusta projetada para ingestão massiva, segurança em tempo real, e análise de dados em ambientes operacionais distribuídos. Com foco na resiliência e entrega segura (zero-trust), ele atua como o principal portão de entrada para uploads institucionais garantindo que todo arquivo passe por varreduras de malware e fluxos granulares de conformidade.

> 🌟 **[Acesse o Novo Hub de Documentação (Visual)](docs/index.html)** - Explore a nossa documentação através de uma página interativa com design limpo e navegação facilitada.

## 🌟 O Valor de Negócio (Visão do Produto)

Na era digital, aceitar arquivos do mundo exterior é um risco constante. O **StreamGate** elimina esta fricção oferecendo:
1. **Ambiente Isolado (Quarentena)**: Uploads suspeitos ficam retidos. Zero chance de infecção para a rede da corporação.
2. **Ingestão Multi-Canal**: Via Web (drag-and-drop), links públicos anônimos, ou conectores nativos para Google Drive e S3.
3. **Analytics em Tempo Real**: Visão imediata do comportamento de tráfego (Volume, Ameaças mitigadas) extraído em relatórios ricos de inteligência (OLAP ClickHouse).

## 🧩 Arquitetura Tecnológica

Construído sob os preceitos do **Domain-Driven Design (DDD)** e arquitetura de microsserviços, com separação brutal de responsabilidades e Segurança desde o Código (Security-by-Design):

- 🎨 **[Command Center (`apps/web`)](apps/web/README.md)**: Aplicação frontend imersiva usando React, Vite, Tailwind CSS e TypeScript (Feature-Sliced Design). Focada em painéis de telemetria, exploração analítica e controle de acesso seguro.
- ⚙️ **[API Server (`apps/api`)](apps/api/README.md)**: O cérebro transacional. Feito em Ruby on Rails em modo estrito de API. Gerencia Autenticação, Operações baseadas em RBAC, Conectores OIDC e garante idempotência (`Idempotency-Key`).
- 👷 **[Data Worker (`apps/worker`)](apps/worker/README.md)**: Motor escalável (Ruby puro) que consome massas de eventos do RabbitMQ e as integra com o ecossistema externo (ClamAV para antivírus) gravando resultados agressivamente em bancos OLAP (ClickHouse) ou S3.
- 📜 **[Contracts (`packages/contracts`)](packages/contracts/README.md)**: A fonte da verdade para comunicação HTTP. Esqueça ambiguidades: o OpenAPI v3 rege todas as interações do ecossistema.
- 🚀 **[Infraestrutura GitOps/Helm (`infra`)](infra/README.md)**: Configurações do ArgoCD, Helm, Kubernetes e esteiras de CI/CD contínuas.

## 📚 Guias e Referências Oficiais do Projeto

Este `README.md` atua como o **Hub de Documentação Principal** (Main README). Acesse os guias fundamentais da plataforma abaixo:

- 📖 **[Manual do Usuário Final](docs/guides/user-manual.md)** (Fluxos e Operações do Command Center)
- 🏗️ **[Arquitetura do Sistema](docs/guides/architecture.md)** (Topologia em Nuvem, Microsserviços e Mensageria)
- 🛠️ **[DevOps Runbook](docs/guides/devops-runbook.md)** (Troubleshooting, ArgoCD, Helm e Mitigação de Falhas)

### Estrutura de Domínios (Bounded Contexts)
O StreamGate organiza suas funcionalidades em domínios coesos (em toda a stack):
- **Auth**: Autenticação, registro, SSO e MFA.
- **Uploads**: Gestão de arquivos, links públicos e conectores de armazenamento.
- **Analytics**: Dashboards, integração ClickHouse e auditoria.
- **Operations**: Quarentena, DLQ, webhooks e RBAC.
- **Core**: Filtros, policies e lógicas transacionais transversais.

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
