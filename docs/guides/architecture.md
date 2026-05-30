# 🏗️ Arquitetura do StreamGate

O StreamGate possui uma arquitetura de sistemas distribuídos voltada a alta disponibilidade e segurança desde a concepção (Security-by-Design). 

## 🧩 Visão Geral dos Componentes

- **`apps/web` (Command Center)**: Construído com React, Vite e Tailwind. Ele se comunica de forma estrita com a API seguindo os contratos OpenAPI definidos. Foi refatorado sob o modelo *Feature-Sliced Design*, organizando código por domínio (Dashboard, Operations, Settings, Uploads).
- **`apps/api` (Rails API-only)**: O coração transacional. Construído com Ruby on Rails. Utiliza **Domain-Driven Design (DDD)** na pasta `app/domains/*` isolando regras transacionais de Autenticação, Operações, SaaS e Conectores.
- **`apps/worker` (Micro-worker Runtime)**: Um ambiente Ruby enxuto, totalmente apartado do Rails. Escala horizontalmente de forma agressiva (ideal via KEDA). É responsável por engolir as filas do **RabbitMQ**, processar integrações de IO pesado (Ex: Integração ClamAV para verificação de vírus) e despejar dados analíticos de forma rápida.

## 📡 Comunicação e Eventos

A plataforma não sofre de acoplamento temporal em operações críticas.
Quando a `api` recebe um arquivo para upload, ela grava o registro e emite um evento (`UploadScanRequested`) no RabbitMQ. A API retorna `202 Accepted`.
O `worker` consome este evento, busca o arquivo, submete ao scanner e apenas notifica o resultado atualizando o status do banco. 

## 🔐 Segurança Base

Todas as transações que alteram dados sensíveis ou operacionais no sistema (liberar quarentenas, alterar permissões) requerem verificação de RBAC (Role-Based Access Control) e são inseridas em tabelas de auditoria imutáveis.
O uso de chaves de idempotência (`Idempotency-Key`) protege a API contra retry storms acidentais ou ataques de repetição.
