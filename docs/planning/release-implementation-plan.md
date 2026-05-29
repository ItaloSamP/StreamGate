# Plano de Entrega Final — StreamGate Release (Aprimorado - Visão P.O. / Principal Engineer)

## Contexto e Visão do Produto

O StreamGate é uma plataforma operacional para ingestão, processamento assíncrono, auditoria e exploração analítica de dados em alto volume. Após uma análise crítica atuando como **Product Owner e Frontend/Backend Architect**, percebemos que um código que compila não é o mesmo que um **produto de classe mundial**. 

> [!IMPORTANT]
> A pedido do usuário, este plano sofreu sua última mutação. Além de consertar, testar e refatorar (Fases 1 a 7), adicionamos uma camada de **UX Polish Extremo** (combatendo designs genéricos) e **Observabilidade de Produção**. Queremos que o StreamGate seja inesquecível visualmente e inquebrável operacionalmente.

---

## Fases do Plano de Entrega (1 a 3 - Validação e Estabilização Inicial)

### FASE 1 — Sanidade do Ambiente
- [x] Sincronia de `.env` e `.gitignore` e remoção do `master.key` versionado.
- [x] Instalação de dependências (`pnpm` e `bundle`).
- [x] **Commit & Push:** Organizar alterações da Fase 1, realizar commit descritivo e push.

### FASE 2 — Gates Automatizados (Testes)
- [x] Executar Unit, Integration e Build do frontend.
- [x] Executar Request/Service/Model tests no backend e Worker runtime specs.
- [x] Rodar **Smokes Operacionais E2E no Docker** (`scripts/smokes/run-smokes.ps1`).
- [x] **Commit & Push:** Organizar alterações da Fase 2, realizar commit descritivo e push.

### FASE 3 — Verificação Estática e Segurança Base
- [ ] Check de segurança no frontend e remoção de segredos do Git.
- [ ] Varredura estática (`Brakeman` e `bundle-audit`).
- [ ] **Commit & Push:** Organizar alterações da Fase 3, realizar commit descritivo e push.

---

## FASE 4 — Reescrita Completa da Documentação (Zero-Base Documentation)
- [ ] **Mapeamento Arquitetural (C4 Model)** refazendo a topologia do zero.
- [ ] **API Specs & Contratos** (OpenAPI) enriquecidos com guias reais de falhas.
- [ ] **Operational Runbooks** focados no Worker e **Onboarding Guides**.
- [ ] **Commit & Push:** Organizar alterações da Fase 4, realizar commit descritivo e push.

---

## FASE 5 — Deep Refactoring & Finalização de Pendências (Em Lote Massivo)
- [ ] **Finalizar O que Está Inacabado:** Finalizar e testar conectores `google_drive` e `oauth_delegated`.
- [ ] **Componentização Frontend:** Quebrar `UploadPage.tsx` (43KB), `SettingsPage.tsx` (34KB) e `streamgate-api.ts` (53KB).
- [ ] **Limpeza de Código Morto:** Remoção do CircleCI e mocks inúteis de UI.
- [ ] **Otimização Extrema:** Lazy Loading no Frontend e Streaming Assíncrono no Worker Ruby (parsers).
- [ ] **Commit & Push:** Organizar alterações da Fase 5, realizar commit descritivo e push.

---

## FASE 6 — Infraestrutura, K8s e Workflows (CI/CD)
- [ ] **Workflows:** Endurecer GitHub Actions com Caching, Fail-fast nos scripts PS1/Bash.
- [ ] **K8s (Helm/GitOps):** Limits/Requests tunados, Autoscaling HPA por fila RabbitMQ, NetworkPolicies e ExternalSecrets no ArgoCD.
- [ ] **Commit & Push:** Organizar alterações da Fase 6, realizar commit descritivo e push.

---

## FASE 7 — Validação E2E e Teste Funcional Total do Sistema
- [ ] Teste massivo rodando ponta-a-ponta via Docker: Ingestão HTTP -> ClamAV -> Parsers -> Analytics.
- [ ] Teste de Quarentena, DLQ, Circuit Breakers e WebSockets (ActionCable) sob carga simulada.
- [ ] **Commit & Push:** Organizar alterações da Fase 7, realizar commit descritivo e push.

---

## 🔥 NOVAS FASES: Visão Crítica de Produto (P.O. e UI/UX Architect)

Um produto excelente não pode ter cara de template e não pode operar no escuro. Aplicando as rules da IA (`frontend-specialist`, `product-owner`, `performance-optimizer`), adicionamos:

### FASE 8 — UX Polish, Design Anti-Cliché & Product Delight (UI/UX)
**Objetivo:** Eliminar qualquer rastro de "SaaS Genérico". A interface deve ser veloz, tátil e inesquecível, seguindo o *Maestro Auditor* e as diretrizes do `frontend-specialist`.

**🤖 Global Skills:** `frontend-design`, `web-design-guidelines`, `tailwind-patterns`.

- [ ] **Maestro Auditor & Purple Ban:** Escanear o código Tailwind eliminando dependências de roxo/índigo padrão. Avaliar o layout para destruir "Safe Splits" (50/50). Aplicar quebras de grid (assimetria 70/30 ou 90/10) e cores disruptivas focadas em alta operabilidade.
- [ ] **Tipografia e Geometria Estrita:** O app hoje tem mistura de bordas? Padronizar brutalmente: ou é 100% *Sharp/Tech* (0px a 2px) ou *Friendly/Organic* (16px+). Não ficar no meio-termo.
- [ ] **Micro-interações e Física de Mola:** Interfaces estáticas falham no engajamento. Adicionar animações táteis de botão (`scale-95` no click), reveals de entrada progressiva no Dashboard (scroll) e *spring physics* nos modais/drawers, usando *apenas GPU* (`transform`, `opacity`).
- [ ] **Empty States Operacionais:** Nenhuma tela vazia (ex: sem Jobs, sem Quarentena) deve ser apenas uma mensagem triste. Transformar todas as "Empty States" em Oportunidades de CTA e educação do usuário (ex: um drag-and-drop enorme aparecendo).
- [ ] **Commit & Push:** Organizar alterações da Fase 8, realizar commit descritivo e push.

### FASE 9 — Observabilidade, Rate Limiting e Operação (SRE/DevOps)
**Objetivo:** Como P.O. e Architect, não entrego a release se o sistema puder ser facilmente derrubado por um cliente ruim.

**🤖 Global Skills:** `server-management`, `api-patterns`, `devops-deploy`.

- [ ] **Defesa contra Abuso (Rate Limiting):** A API e o Worker devem provar que aguentam estresse. Confirmar HTTP 429 no upload e verificar se há um limite estrito de payload (ex: 50MB) imposto corretamente no middleware/Rails.
- [ ] **Observabilidade Estruturada:** Padronizar os logs (`json` estruturado) para que DataDog/ELK consigam extrair métricas. Garantir que as rotas `/health` ou `/metrics` expõem os tamanhos de fila do RabbitMQ.
- [ ] **Ciclo de Vida do DLQ (Poison Messages):** Implementar ou auditar a regra do "Dead Letter Queue". Uma mensagem que falha não pode ficar no limbo do "Retry" para sempre. Precisamos de uma política exata (ex: 3 tentativas -> Quarentena definitiva -> Alerta P0).
- [ ] **Commit & Push:** Organizar alterações da Fase 9, realizar commit descritivo e push.

---

## Resumo e Ordem de Ação
Com o plano selado:
1. **Auditoria Padrão:** Descobrimos o que está quebrado (Fases 1 a 3).
2. **Mega-Refactor (Engenharia & UX):** Executamos em lote a quebra de arquivos, finalização de features, refinamento E2E do Kubernetes e a aplicação da maquiagem agressiva de UI/UX (Fases 5, 6 e 8).
3. **Robustez Produtiva:** Confirmamos limites e rate-limiting (Fase 9).
4. **Zero-Base Docs & Validação:** Documentamos tudo perfeitamente (Fase 4) e carimbamos a Release no Teste Funcional (Fase 7).
