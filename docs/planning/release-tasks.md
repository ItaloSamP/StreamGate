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
- `[ ]` **FASE 3: Verificação Estática e Segurança Base**
  - `[ ]` Navegar nas páginas (Garantir ausência de mock data e testar role-gating).
  - `[ ]` Segurança no frontend e remoção de segredos do Git.
  - `[ ]` Varredura estática (`Brakeman` e `bundle-audit`).
  - `[ ]` **Commit & Push:** Organizar alterações e commitar (Fase 3).

## Execução Massiva (The Mega-Refactor)
- `[ ]` **FASE 5: Deep Refactoring & Finalização de Pendências**
  - `[ ]` Finalizar implementações "discovery-only" (Conectores `google_drive` e `oauth_delegated`).
  - `[ ]` Componentizar monolitos Frontend (`UploadPage.tsx`, `SettingsPage.tsx`, `streamgate-api.ts`).
  - `[ ]` Limpeza de Código Morto (Referências ao CircleCI, mocks visuais).
  - `[ ]` Otimização Extrema (Lazy Loading no React, Streaming Assíncrono no Ruby Worker).
  - `[ ]` **Commit & Push:** Organizar alterações e commitar (Fase 5).
- `[ ]` **FASE 8: UX Polish, Design Anti-Cliché & Product Delight (UI/UX)**
  - `[ ]` Aplicar Maestro Auditor (Erradicar "Purple Ban" e quebrar "Safe Splits" 50/50).
  - `[ ]` Padronizar Geometria (Consolidar cantos Sharp ou Soft em todo o app).
  - `[ ]` Adicionar Micro-interações e Spring Physics (`transform`, `opacity`).
  - `[ ]` Redesenhar Empty States com CTAs focados no onboarding operacional.
  - `[ ]` **Commit & Push:** Organizar alterações e commitar (Fase 8).
- `[ ]` **FASE 9: Observabilidade, Rate Limiting e Operação (SRE)**
  - `[ ]` Refinar Rate Limiting (HTTP 429) e limites rígidos de payload.
  - `[ ]` Observabilidade (Logs estruturados JSON, expor métricas do RabbitMQ via `/health`).
  - `[ ]` Consolidar ciclo do DLQ (Poison Messages com limites de retries explícitos).
  - `[ ]` **Commit & Push:** Organizar alterações e commitar (Fase 9).

## Infraestrutura & Workflows
- `[ ]` **FASE 6: Infraestrutura, K8s e Workflows (CI/CD)**
  - `[ ]` Endurecer GitHub Actions (Cache agressivo, Paralelismo).
  - `[ ]` Aplicar Fail-fast nos scripts PS1 e Bash (`set -e`, `$ErrorActionPreference`).
  - `[ ]` Revisão e Tunagem de Manifestos (Limits/Requests pro Web, API, Worker e ClamAV).
  - `[ ]` Configurar Autoscaling (HPA por fila RabbitMQ) e NetworkPolicies.
  - `[ ]` GitOps (ArgoCD) e fluxo de ExternalSecrets consolidado.
  - `[ ]` **Commit & Push:** Organizar alterações e commitar (Fase 6).

## Fechamento & Validação
- `[ ]` **FASE 4: Reescrita Completa da Documentação (Zero-Base Documentation)**
  - `[ ]` Mapeamento Arquitetural (C4 Model).
  - `[ ]` API Specs (OpenAPI) e Dicionário de Dados/Domínio.
  - `[ ]` Operational Runbooks (Worker) e Onboarding Guides.
  - `[ ]` **Commit & Push:** Organizar alterações e commitar (Fase 4).
- `[ ]` **FASE 7: Validação E2E e Teste Funcional Total do Sistema**
  - `[ ]` Testar Ingestão ponta-a-ponta (Upload -> ClamAV -> Parsers -> Analytics Warehouse).
  - `[ ]` Verificar robustez de Quarentena, DLQ e Circuit Breakers.
  - `[ ]` Testar eventos Realtime (ActionCable/WebSockets).
  - `[ ]` Rodar `run-smokes.ps1` final sob o perfil "full-closeout" para gerar Hub de Release.
  - `[ ]` **Commit & Push:** Organizar alterações e commitar (Fase 7).
