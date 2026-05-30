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
- [x] Implementar rate limit em controllers cruciais da API.
- [x] Tratamento centralizado para Lograge (Structured Logs).
- [x] DLQ Cycle Management: Visualização e Replay no Frontend e Backend.
- [x] Executar Request/Service/Model tests no backend e Worker runtime specs.
- [x] Rodar **Smokes Operacionais E2E no Docker** (`scripts/smokes/run-smokes.ps1`).
- [x] **Commit & Push:** Organizar alterações da Fase 2, realizar commit descritivo e push.

### FASE 3 — Verificação Estática e Segurança Base
- [x] Check de segurança no frontend e remoção de segredos do Git.
- [x] Varredura estática (`Brakeman` e `bundle-audit`).
- [x] **Commit & Push:** Organizar alterações da Fase 3, realizar commit descritivo e push.

---

## FASE 5 — Deep Refactoring & Finalização de Pendências (Em Lote Massivo)
- [x] **Finalizar O que Está Inacabado:** Finalizar e testar conectores `google_drive` e `oauth_delegated`.
- [x] Componentização Frontend: Quebrar `UploadPage.tsx` (43KB), `SettingsPage.tsx` (34KB) e `streamgate-api.ts` (53KB).
- [x] Limpeza de Código Morto: Remoção do CircleCI e mocks inúteis de UI.
- [x] Otimização Extrema: Lazy Loading no Frontend e Streaming Assíncrono no Worker Ruby (parsers).
- [x] **Commit & Push:** Organizar alterações da Fase 5, realizar commit descritivo e push.

---

## FASE 6 — Infraestrutura, K8s e Workflows (CI/CD)
- [x] **Workflows:** Endurecer GitHub Actions com Caching, Fail-fast nos scripts PS1/Bash.
- [x] **K8s (Helm/GitOps):** Limits/Requests tunados, Autoscaling HPA por fila RabbitMQ, NetworkPolicies e ExternalSecrets no ArgoCD.
- [x] **Commit & Push:** Organizar alterações da Fase 6, realizar commit descritivo e push.

---

## FASE 7 — Validação E2E e Teste Funcional Total do Sistema
- [x] Teste massivo rodando ponta-a-ponta via Docker: Ingestão HTTP -> ClamAV -> Parsers -> Analytics.
- [x] Teste de Quarentena, DLQ, Circuit Breakers e WebSockets (ActionCable) sob carga simulada.
- [x] **Commit & Push:** Organizar alterações da Fase 7, realizar commit descritivo e push.

---

## 🔥 NOVAS FASES: Visão Crítica de Produto (P.O. e UI/UX Architect)

Um produto excelente não pode ter cara de template e não pode operar no escuro. Aplicando as rules da IA (`frontend-specialist`, `product-owner`, `performance-optimizer`), adicionamos:

### FASE 8 — UX Polish, Design Anti-Cliché & Product Delight (UI/UX)
**Objetivo:** Eliminar qualquer rastro de "SaaS Genérico". A interface deve ser veloz, tátil e inesquecível, seguindo o *Maestro Auditor* e as diretrizes do `frontend-specialist`.

**🤖 Global Skills:** `frontend-design`, `web-design-guidelines`, `tailwind-patterns`.

- [x] **Maestro Auditor & Purple Ban:** Escanear o código Tailwind eliminando dependências de roxo/índigo padrão. Avaliar o layout para destruir "Safe Splits" (50/50). Aplicar quebras de grid (assimetria 70/30 ou 90/10) e cores disruptivas focadas em alta operabilidade.
- [x] **Tipografia e Geometria Estrita:** O app hoje tem mistura de bordas? Padronizar brutalmente: ou é 100% *Sharp/Tech* (0px a 2px) ou *Friendly/Organic* (16px+).
- [x] Ajustes nos painéis de Admin.
- [x] Micro-interações, tooltips e skeletons para carregamento.
- [x] Cores vibrantes "Anti-Cliché" em OKLCH e Glassmorphism. Adicionar animações táteis de botão (`scale-95` no click), reveals de entrada progressiva no Dashboard (scroll) e *spring physics* nos modais/drawers, usando *apenas GPU* (`transform`, `opacity`).
- [x] **Empty States Operacionais:** Nenhuma tela vazia (ex: sem Jobs, sem Quarentena) deve ser apenas uma mensagem triste. Transformar todas as "Empty States" em Oportunidades de CTA e educação do usuário (ex: um drag-and-drop enorme aparecendo).
- [x] **Commit & Push:** Organizar alterações da Fase 8, realizar commit descritivo e push.

### FASE 9 — Observabilidade, Rate Limiting e Operação (SRE/DevOps)
**Objetivo:** Como P.O. e Architect, não entrego a release se o sistema puder ser facilmente derrubado por um cliente ruim.

**🤖 Global Skills:** `server-management`, `api-patterns`, `devops-deploy`.

- [ ] **Defesa contra Abuso (Rate Limiting):** A API e o Worker devem provar que aguentam estresse. Confirmar HTTP 429 no upload e verificar se há um limite estrito de payload (ex: 50MB) imposto corretamente no middleware/Rails.
- [ ] **Observabilidade Estruturada:** Padronizar os logs (`json` estruturado) para que DataDog/ELK consigam extrair métricas. Garantir que as rotas `/health` ou `/metrics` expõem os tamanhos de fila do RabbitMQ.
- [ ] **Ciclo de Vida do DLQ (Poison Messages):** Implementar ou auditar a regra do "Dead Letter Queue". Uma mensagem que falha não pode ficar no limbo do "Retry" para sempre. Precisamos de uma política exata (ex: 3 tentativas -> Quarentena definitiva -> Alerta P0).
- [ ] **Commit & Push:** Organizar alterações da Fase 9, realizar commit descritivo e push.

---

## 👑 O PENTE FINO FINAL

### FASE 10 — Reescrita Completa da Documentação (Zero-Base Documentation)
**Objetivo:** Ignorar totalmente a documentação existente (todos os `.md`, todos os `READMEs`). Reescrever tudo do zero de forma organizada, polida, explicativa e refinada, sem deixar lacunas.
**🤖 Global Skills:** `documentation-writer`, `c4-architecture`, `api-documenter`.

- [ ] **Aniquilar e recriar o README Raiz:** Explicar o que é o StreamGate, como ele funciona sob o capô, stack, e roteiros de dev locais.
- [x] Reescrever `README.md` raiz.
- [x] Reescrever `README.md` para as pastas: `api`, `web`, `worker`, `contracts`, `scripts`.
- [x] Limpar / Consolidar a pasta `docs/`.
- [ ] **Mapeamento Arquitetural (C4 Model):** Diagramas C4 via Mermaid atualizados, explicando a topologia de Ingestão -> RabbitMQ -> Worker -> ClickHouse/Postgres.
- [ ] **API Specs & Contratos (OpenAPI):** Refazer toda a documentação da API baseada no estado final do código. Entregar payloads de sucesso, cenários reais de erro, limites operacionais e paginação.
- [ ] **Operational Runbooks e Onboarding Guides:** Guias claros, polidos e exemplificativos focados no Worker e infraestrutura. Ex: "Como tratar DLQ", "Como subir o ClamAV localmente", etc.
- [ ] **Commit & Push:** Organizar alterações da Fase 10, realizar commit descritivo e push.

---

## Resumo e Ordem de Ação
Com o plano selado:
1. **Auditoria Padrão:** Descobrimos o que está quebrado (Fases 1 a 3).
2. **Mega-Refactor (Engenharia & UX):** Executamos em lote a quebra de arquivos, finalização de features, refinamento E2E do Kubernetes e a aplicação da maquiagem agressiva de UI/UX (Fases 5, 6 e 8).
3. **Robustez Produtiva:** Confirmamos limites e rate-limiting (Fase 9).
4. **Validação:** Carimbamos a Release no Teste Funcional (Fase 7).
5. **Zero-Base Docs:** Documentamos tudo perfeitamente (Fase 10).
### FASE 9 — Observabilidade, Rate Limiting e Operação (SRE/DevOps)

**Objetivo:** Adicionar limites estritos e tornar os serviços prontos para auditoria de métricas através de logs estruturados (JSON).

## Proposed Changes

### Rate Limiting & Protection (API)
Vamos adicionar a gem `rack-attack` para prover rate limiting real no middleware Rails.
#### [NEW] `apps/api/config/initializers/rack_attack.rb`
- Configurar limite padrão global de requisições por IP (ex: 100 req/minuto).
- Configurar limite restrito para endpoints sensíveis como uploads e auth (ex: 10 req/minuto).
- Adicionar política de throttling que responde com `HTTP 429 Too Many Requests`.
- Inserir `Rack::Attack` no middleware em `application.rb` ou via initializer.

### Observabilidade & Structured Logging (API & Worker)
Para o DataDog/ELK conseguir extrair as métricas facilmente sem parse complexo, o log precisa estar em JSON.
#### [MODIFY] `apps/api/Gemfile`
- Adicionar `rack-attack`.
- Adicionar `lograge` para estruturar os logs do Rails em JSON.

#### [MODIFY] `apps/api/config/environments/production.rb`
- Configurar `config.lograge.enabled = true` e formatador para JSON.
- Garantir que as chaves de requisição, IP e status sejam extraídas no lograge.

#### [MODIFY] `apps/worker/lib/worker/logger.rb` (Se existir, ou equivalente)
- Configurar o stdout logger do worker para usar formato JSON (com chaves `timestamp`, `level`, `message`, `event_id`, etc).

### Endpoint de Health c/ Métricas do Broker
A rota atual de `/health` não expõe as filas.
#### [MODIFY] `apps/api/config/routes.rb`
- Adicionar a rota customizada `get "/health", to: "health#show"` se já não existir, e mapear apropriadamente (a Rails padrão é `/up`).

#### [MODIFY] `apps/api/app/controllers/health_controller.rb`
- Retornar o status global (`ok`).
- Retornar contagem de filas usando o client HTTP da API do RabbitMQ (ou Bunny se conectado diretamente) para obter tamanhos das filas principais e DLQ (opcional, faremos a aproximação se o RabbitMQ Manager estiver ativo).

### Ciclo de Vida do DLQ (Poison Messages)
**Nota:** Após auditoria no `consumer.rb` do Worker, foi constatado que a política do DLQ já está rigorosamente implementada!
O worker possui `TransientProcessingError` que realiza backoff exponencial até o `max_retries` e, se falhar, envia para a fila `dlq` (com header `x-dead-letter-reason`).
Portanto, a tarefa do DLQ consistirá apenas em auditar/confirmar a política no documento final, ou ajustar logs.

## Verification Plan

### Automated Tests
- O `system-validation-smoke.py` criado na Fase 7 já possui o `step_rate_limit_probe` que testa HTTP 429. Com a implementação do Rate Limiting, este teste deve passar rigorosamente.

### Manual Verification
- Inspecionar saída no terminal de `apps/api` e `apps/worker` para garantir que o stdout exibe objetos JSON ao invés de strings limpas.
- Bater no endpoint `/health` via cURL.
