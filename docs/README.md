# 📚 StreamGate Documentation Hub

Bem-vindo ao centro de documentação oficial do StreamGate. O projeto foi estruturado utilizando princípios de Bounded Contexts e Domains, tanto no backend quanto no frontend, garantindo alta manutenibilidade e separação de conceitos.

## 🧭 Navegação Rápida

Explore as diferentes áreas do sistema através dos links abaixo:

- 🏠 **[Visão Geral do Projeto (Root)](../README.md)**: Propósito do sistema, arquitetura macro e guia de inicialização.
- 📖 **[Manual do Usuário Final](guides/user-manual.md)**: Guia completo para os fluxos do Command Center.
- 🏗️ **[Arquitetura do Sistema](guides/architecture.md)**: Detalhamento do modelo em nuvem e comunicação.
- 🛠️ **[DevOps Runbook](guides/devops-runbook.md)**: Guia definitivo para implantação, infraestrutura e mitigação de falhas.
- 🎨 **[Frontend Web (Command Center)](../apps/web/README.md)**: Aplicação React/Vite, estrutura de features e componentes de UI.
- ⚙️ **[Backend API (Rails)](../apps/api/README.md)**: API Ruby on Rails, estrutura de domínios e regras de negócio.
- 👷 **[Worker (Background Jobs)](../apps/worker/README.md)**: Processamento assíncrono, integração com RabbitMQ e rotinas pesadas.
- 📜 **[Contratos (OpenAPI)](../packages/contracts/README.md)**: Definições de API, schemas compartilhados e tipagens.
- 🚀 **[Infraestrutura GitOps/Helm](../infra/README.md)**: Configurações do ArgoCD, Helm, k8s e CI/CD.

## 🏗️ Estrutura de Domínios (Bounded Contexts)

O StreamGate organiza suas funcionalidades em domínios coesos (tanto na API quanto no Frontend):

- **Auth**: Autenticação, registro, tokens, SSO (Google Workspace) e MFA.
- **Uploads**: Gestão de arquivos, links públicos e conectores de armazenamento externo.
- **Analytics**: Dashboards, exportações, integração com ClickHouse e auditoria.
- **Operations**: DLQ, integrações via Webhook, notificações, quarentena e RBAC de organizações.
- **Core**: Filtros, ID prefixados, policies e lógicas transacionais base.

> *Para mais detalhes sobre as implementações, verifique os READMEs de cada aplicação listada acima.*
