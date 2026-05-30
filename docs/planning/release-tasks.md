# StreamGate Final Release Task Tracker

Utilize as marcações:
- `[ ]` Pendente
- `[/]` Em progresso
- `[x]` Concluído

## Pre-Flight & Qualidade Inicial
- `[x]` **FASE 1: Sanidade do Ambiente**
  - `[x]` Sincronia de `.env` e `.gitignore` e remoção do `master.key` versionado.
  - `[x]` Instalação de dependências (`pnpm` e `bundle`).
  - `[x]` **Commit & Push:** Organizar alterações e commitar (Fase 1).
- `[x]` **FASE 2: Gates Automatizados (Testes)**
  - `[x]` Executar Unit, Integration e Build do frontend.
  - `[x]` Executar Request/Service/Model tests no backend e Worker runtime specs.
  - `[x]` Rodar Smokes Operacionais E2E no Docker (`scripts/smokes/run-smokes.ps1`).
  - `[x]` **Commit & Push:** Organizar alterações e commitar (Fase 2).
- `[x]` **FASE 3: Verificação Estática e Segurança Base**
  - `[x]` Navegar nas páginas (Garantir ausência de mock data e testar role-gating).
  - `[x]` Segurança no frontend e remoção de segredos do Git.
  - `[x]` Varredura estática (`Brakeman` e `bundle-audit`).
  - `[x]` **Commit & Push:** Organizar alterações e commitar (Fase 3).

## Execução Massiva (The Mega-Refactor)
- `[x]` **FASE 5: Deep Refactoring & Finalização de Pendências**
  - `[x]` Finalizar implementações "discovery-only" (Conectores `google_drive` e `oauth_delegated`).
  - `[x]` Componentizar monolitos Frontend (`UploadPage.tsx`, `SettingsPage.tsx`, `streamgate-api.ts`).
  - `[x]` Limpeza de Código Morto (Referências ao CircleCI, mocks visuais).
  - `[x]` Otimização Extrema (Lazy Loading no React, Streaming Assíncrono no Ruby Worker).
  - `[x]` **Commit & Push:** Organizar alterações e commitar (Fase 5).
- `[x]` **FASE 8: UX Polish, Design Anti-Cliché & Product Delight (UI/UX)**
  - `[x]` Aplicar Maestro Auditor (Erradicar "Purple Ban" e quebrar "Safe Splits" 50/50).
  - `[x]` Padronizar Geometria (Consolidar cantos Sharp ou Soft em todo o app).
  - `[x]` Adicionar Micro-interações e Spring Physics (`transform`, `opacity`).
  - `[x]` Redesenhar Empty States com CTAs focados no onboarding operacional.
  - `[x]` **Commit & Push:** Organizar alterações e commitar (Fase 8).
- `[ ]` **FASE 9: Observabilidade, Rate Limiting e Operação (SRE)**
  - `[ ]` Refinar Rate Limiting (HTTP 429) e limites rígidos de payload.
  - `[ ]` Observabilidade (Logs estruturados JSON, expor métricas do RabbitMQ via `/health`).
  - `[ ]` Consolidar ciclo do DLQ (Poison Messages com limites de retries explícitos).
  - `[ ]` **Commit & Push:** Organizar alterações e commitar (Fase 9).

## Infraestrutura & Workflows
- `[x]` **FASE 6: Infraestrutura, K8s e Workflows (CI/CD)**
  - `[x]` Endurecer GitHub Actions (Cache agressivo, Paralelismo).
  - `[x]` Aplicar Fail-fast nos scripts PS1 e Bash (`set -e`, `$ErrorActionPreference`).
  - `[x]` Revisão e Tunagem de Manifestos (Limits/Requests pro Web, API, Worker e ClamAV).
  - `[x]` Configurar Autoscaling (HPA por fila RabbitMQ) e NetworkPolicies.
  - `[x]` GitOps (ArgoCD) e fluxo de ExternalSecrets consolidado.
  - `[x]` **Commit & Push:** Organizar alterações e commitar (Fase 6).

## Validação Total
- `[ ]` **FASE 7: Validação E2E e Teste Funcional Total do Sistema**
  - `[ ]` Testar Ingestão ponta-a-ponta (Upload -> ClamAV -> Parsers -> Analytics Warehouse).
  - `[ ]` Verificar robustez de Quarentena, DLQ e Circuit Breakers.
  - `[ ]` Testar eventos Realtime (ActionCable/WebSockets).
  - `[ ]` Rodar `run-smokes.ps1` final sob o perfil "full-closeout" para gerar Hub de Release.
  - `[ ]` **Commit & Push:** Organizar alterações e commitar (Fase 7).

## O PENTE FINO FINAL
- `[ ]` **FASE 10: Reescrita Completa da Documentação (Zero-Base Documentation)**
  - `[ ]` Ignorar tudo existente (todos .md e readmes antigos).
  - `[ ]` Reescrever o README raiz com foco em clareza, refinamento e completude.
  - `[ ]` Escrever READMEs hiper-explicativos e polidos para pastas (`apps/api`, `apps/web`, etc).
  - `[ ]` Refazer Mapeamento Arquitetural (C4 Model).
  - `[ ]` Construir novas API Specs (OpenAPI) e Dicionário de Dados do zero.
  - `[ ]` Criar Operational Runbooks exemplificativos e guias de Onboarding impecáveis.
  - `[ ]` **Commit & Push:** Organizar alterações e commitar (Fase 10).
