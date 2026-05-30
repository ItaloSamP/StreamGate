# 📚 StreamGate Documentation Hub

Bem-vindo ao centro de documentação oficial do StreamGate. O projeto foi estruturado utilizando princípios de Bounded Contexts e Domains, tanto no backend quanto no frontend, garantindo alta manutenibilidade e separação de conceitos.

## 🧭 Navegação Rápida

Explore as diferentes áreas do sistema através dos links abaixo:

- 🏠 **[Visão Geral do Projeto (Root)](../README.md)**: Propósito do sistema, arquitetura macro e guia de inicialização.
- 🎨 **[Frontend Web (Command Center)](../apps/web/README.md)**: Aplicação React/Vite, estrutura de features e componentes de UI.
- ⚙️ **[Backend API (Rails)](../apps/api/README.md)**: API Ruby on Rails, estrutura de domínios e regras de negócio.
- 👷 **[Worker (Background Jobs)](../apps/worker/README.md)**: Processamento assíncrono, integração com RabbitMQ e rotinas pesadas.
- 📜 **[Contratos (OpenAPI)](../packages/contracts/README.md)**: Definições de API, schemas compartilhados e tipagens.
- 🚀 **[Infraestrutura e CI/CD](../.github/README.md)**: Workflows do GitHub Actions, pipelines de deploy e configuração docker.

## 🏗️ Estrutura de Domínios (Bounded Contexts)

O StreamGate organiza suas funcionalidades em domínios coesos (tanto na API quanto no Frontend):

- **Auth**: Autenticação, registro, tokens, SSO (Google Workspace) e MFA.
- **Uploads**: Gestão de arquivos, links públicos e conectores de armazenamento externo.
- **Analytics**: Dashboards, exportações, integração com ClickHouse e auditoria.
- **Operations**: DLQ, integrações via Webhook, notificações, quarentena e RBAC de organizações.
- **Core**: Filtros, ID prefixados, policies e lógicas transacionais base.

> *Para mais detalhes sobre as implementações, verifique os READMEs de cada aplicação listada acima.*
